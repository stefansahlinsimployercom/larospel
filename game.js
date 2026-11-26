// Lärospel – motor för Sporcle-liknande quiz.
// Spår registrerar sig i quizzes/*.js via window.TRACKS. Två sorters spår:
//   - vanliga:  { quizzes: [{ id, title, prompt, time, items: [{q, a}] }] }
//   - ordlistor: { languages: {...}, categories: [{ id, name, icon, words: [{sv, en, …}] }] }

const TRACKS = window.TRACKS || [];
const app = document.getElementById('app');

// ---------- Lagring ----------
// Allt sparas som ett JSON-objekt i webbläsarens localStorage:
// {
//   version: 1,
//   settings: { sprak: { from: 'sv', to: 'en' } },
//   attempts: [ { quiz: 'sprak/farger/sv-pt', title, at: ISO-tid, score, total, secs, missed: [{q, a}] } ],
//   known: { 'sprak/sv-pt': { 'farger/röd': 2, 'djur/häst': 0 } }   // rätt-i-rad per ord och håll
// }
// Ett ord räknas som "kan" när det klarats KNOWN_AT gånger i rad. En miss nollställer.
const KNOWN_AT = 2;

// ---------- Profiler ----------
// Flera spelare på samma dator: varje profil har en egen lagringsplats ('larospel-v1:<id>').
// Profillistan: { active: id | null, list: [{ id, name, emoji, created }] }
// Prototypnivå – ingen inloggning eller säkerhet.
const Profiles = {
  KEY: 'larospel-profiles',
  read() {
    try { const p = JSON.parse(localStorage.getItem(this.KEY)); if (p && Array.isArray(p.list)) return p; } catch {}
    return { active: null, list: [] };
  },
  write(p) { try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch {} },
  list() { return this.read().list; },
  active() { const p = this.read(); return p.list.find(x => x.id === p.active) || null; },
  setActive(id) { const p = this.read(); p.active = id; this.write(p); },
  create(name, emoji, data) {
    const p = this.read();
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    p.list.push({ id, name, emoji, created: new Date().toISOString() });
    p.active = id;
    this.write(p);
    if (data) { try { localStorage.setItem(Store.keyFor(id), JSON.stringify(data)); } catch {} }
    return id;
  },
  rename(id, name, emoji) { const p = this.read(); const x = p.list.find(y => y.id === id); if (x) { x.name = name; x.emoji = emoji; this.write(p); } },
  remove(id) {
    const p = this.read();
    p.list = p.list.filter(x => x.id !== id);
    if (p.active === id) p.active = null;
    this.write(p);
    try { localStorage.removeItem(Store.keyFor(id)); } catch {}
  },
  // Första gången: flytta befintlig progress (från tiden före profiler) till en första profil.
  // Den gamla nyckeln lämnas kvar orörd som säkerhetskopia.
  migrate() {
    const p = this.read();
    if (p.list.length) return;
    let old = null;
    try { old = JSON.parse(localStorage.getItem('larospel-v1')); } catch {}
    if (old && old.version === 1) this.create('Jag', '🦉', old);
  },
};

const Store = {
  keyFor: id => 'larospel-v1:' + id,
  get KEY() { const a = Profiles.active(); return a ? this.keyFor(a.id) : null; },
  load() {
    try {
      const d = this.KEY && JSON.parse(localStorage.getItem(this.KEY));
      if (d && d.version === 1) { d.known ||= {}; this.ensureReview(d); return d; }
    } catch {}
    return { version: 1, settings: {}, attempts: [], known: {}, review: {} };
  },

  // ---------- Smart repetition (glömskekurvan) ----------
  // review: { pk: { key: { step, due } } }. Det man kan kommer tillbaka efter 1, 3, 7, 30 och 90 dagar.
  // Ett rätt svar när det är dags flyttar fram nästa repetition; ett fel gör att det ska läras in igen.
  REVIEW_DAYS: [1, 3, 7, 30, 90],
  _shift: 0,                                   // för test: flytta "nu" framåt i tiden
  now() { return Date.now() + this._shift; },
  // Saker man kunde innan repetitionen fanns får en första repetition om en dag
  ensureReview(d) {
    if (d.review) return;
    d.review = {};
    const due = this.now() + 864e5 * this.REVIEW_DAYS[0];
    Object.entries(d.known).forEach(([pk, m]) => Object.entries(m).forEach(([k, v]) => {
      if (v >= KNOWN_AT) (d.review[pk] ||= {})[k] = { step: 0, due };
    }));
    this.save(d);
  },
  // Vad spelaren kan just nu: saker som är "dags att repetera" räknas tillfälligt som inte kunna
  // (ett rätt svar räcker för att de ska räknas som kunna igen).
  known(pk) {
    const d = this.load(), m = { ...(d.known[pk] || {}) }, r = d.review[pk] || {}, t = this.now();
    Object.entries(r).forEach(([k, s]) => { if (s.due <= t && (m[k] || 0) >= KNOWN_AT) m[k] = KNOWN_AT - 1; });
    return m;
  },
  // Allt som är dags att repetera: [{ pk, key }]
  dueList() {
    const d = this.load(), t = this.now(), out = [];
    Object.entries(d.review).forEach(([pk, r]) => Object.entries(r).forEach(([k, s]) => {
      if (s.due <= t && ((d.known[pk] || {})[k] || 0) >= KNOWN_AT) out.push({ pk, key: k });
    }));
    return out;
  },
  // results: [{ key: 'farger/röd', ok: true }] → returnerar antal saker som just blev "kan"
  // Anpassad tröskel:
  //   – rätt första gången man någonsin möter något → "kan" direkt (man kunde det redan)
  //   – fel innan man har lärt sig något → ett extra rätt krävs (värdet blir −1 i stället för 0)
  // Statistik per sak (stats[pk][key]): first, tries, wrong, ever (har kunnat), knownAt, triesToKnow, waste
  //   waste = rätt svar på något man redan kunde när det inte var dags att repetera (svinn)
  updateWords(pk, results) {
    const d = this.load();
    const m = d.known[pk] ||= {};
    const rv = d.review[pk] ||= {};
    const st = (d.stats ||= {})[pk] ||= {};
    const t = this.now(), DAY = 864e5, last = this.REVIEW_DAYS.length - 1;
    let fresh = 0;
    results.forEach(({ key, ok }) => {
      const before = m[key] || 0;
      const firstTime = !st[key] && before === 0 && !rv[key];
      const s = st[key] ||= { first: t, tries: 0, wrong: 0, ever: before >= KNOWN_AT };
      s.tries++;
      if (!ok) s.wrong++;
      const wasDue = rv[key] && rv[key].due <= t;
      if (ok && before >= KNOWN_AT && !wasDue) s.waste = (s.waste || 0) + 1;
      if (ok) m[key] = firstTime ? Math.max(KNOWN_AT, before + 1) : before + 1;
      else m[key] = s.ever ? 0 : -1;
      if (!ok) delete rv[key];
      else if (before < KNOWN_AT && m[key] >= KNOWN_AT) {
        fresh++;
        if (!s.ever) { s.ever = true; s.knownAt = t; s.triesToKnow = s.tries; s.direct = firstTime; }
        rv[key] = { step: 0, due: t + DAY * this.REVIEW_DAYS[0] };
      }
      else if (wasDue) { const n = Math.min(rv[key].step + 1, last); rv[key] = { step: n, due: t + DAY * this.REVIEW_DAYS[n] }; }
    });
    this.save(d);
    return fresh;
  },
  resetKnown(pk, catId) {
    const d = this.load(), m = d.known[pk] || {};
    if (!catId) delete d.known[pk]; // tom kategori = nollställ hela
    else Object.keys(m).forEach(k => { if (k.startsWith(catId + '/')) delete m[k]; });
    this.save(d);
  },
  save(d) { if (!this.KEY) return; try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch {} },
  addAttempt(a) { const d = this.load(); d.attempts.push(a); this.save(d); },
  attempts() { return this.load().attempts; },
  best(quizId) {
    const s = this.attempts().filter(a => a.quiz === quizId).map(a => a.score);
    return s.length ? Math.max(...s) : null;
  },
  getSetting(k) { return this.load().settings[k]; },
  setSetting(k, v) { const d = this.load(); d.settings[k] = v; this.save(d); },
  clear() { if (!this.KEY) return; try { localStorage.removeItem(this.KEY); } catch {} },
};

// ---------- Hjälpfunktioner ----------
// Normalisera svar: gemener, trimma, ta bort accenter (å/ä/ö behålls).
function norm(s) {
  return s.toLowerCase().trim()
    .replace(/[åäö]/g, c => ({ å: '\u0001', ä: '\u0002', ö: '\u0003' }[c]))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\u0001\u0002\u0003]/g, c => ({ '\u0001': 'å', '\u0002': 'ä', '\u0003': 'ö' }[c]))
    .replace(/\s+/g, ' ');
}
const alts = v => String(v).split('/').map(s => s.trim());
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let timerId = null;
function stopTimer() { clearInterval(timerId); timerId = null; }

function card(html, onClick) {
  const el = document.createElement('button');
  el.className = 'card' + (onClick ? '' : ' disabled');
  el.innerHTML = html;
  if (onClick) el.onclick = onClick;
  return el;
}

// ---------- Startsida ----------
function showHome() {
  stopTimer();
  if (!Profiles.active()) return showProfiles();
  app.innerHTML = `<div id="review"></div><div id="kmslot"></div><h2>Välj ämne</h2><div class="tracks"></div>`;
  // Kunskapskartan (knowledgemap.js): överblick över allt
  if (typeof kmEntryHtml === 'function') {
    const slot = app.querySelector('#kmslot');
    slot.innerHTML = kmEntryHtml();
    slot.querySelector('#kmentry').onclick = showKnowledgeMap;
  }
  // Smart repetition: vad är det dags att repetera, per ämne?
  const due = Store.dueList();
  if (due.length) {
    const per = new Map();
    due.forEach(({ pk }) => { const t = TRACKS.find(x => pk === x.id || pk.startsWith(x.id + '/')); if (t) per.set(t, (per.get(t) || 0) + 1); });
    const box = app.querySelector('#review');
    box.innerHTML = `<div class="reviewbox"><strong>🔁 Dags att repetera: ${due.length} ${due.length === 1 ? 'sak' : 'saker'}</strong>
      <span class="small">Det här kunde du – och nu är det precis rätt tid att fräscha upp det innan det glöms. Med "bara det jag inte kan" kommer de med automatiskt.</span>
      <div class="rvlist">${[...per].map(([t, n], k) => `<button class="rvbtn" data-k="${k}">${t.icon} ${esc(t.name)} <strong>${n}</strong></button>`).join('')}</div></div>`;
    const list = [...per.keys()];
    box.querySelectorAll('.rvbtn').forEach(b => b.onclick = () => showTrack(list[+b.dataset.k]));
  }
  const box = app.querySelector('.tracks');
  TRACKS.forEach(t => {
    const n = (t.categories || t.branches || t.sets || t.recipes || t.cases || t.chains || t.builds || t.claims || t.questions || t.quizzes || []).length;
    const sub = n ? `${n} ${t.categories ? 'kategorier' : t.branches ? 'grenar' : t.sets ? 'sorteringsspel' : t.recipes ? 'recept' : t.cases ? 'fall' : t.chains ? (n === 1 ? 'kedja' : 'kedjor') : t.builds ? 'konstruktioner' : t.claims ? 'påståenden' : t.questions ? 'frågor' : 'quiz'}` : 'Kommer snart';
    box.appendChild(card(`<strong>${t.icon} ${t.name}</strong><small>${sub}</small>`, n ? () => showTrack(t) : null));
  });
}

function showTrack(track) {
  stopTimer();
  if (track.type === 'events') return showEventsTrack(track);
  if (track.type === 'tree') return showMathTree(track);
  if (track.type === 'sort') return showSortTrack(track);
  if (track.type === 'map') return showMapTrack(track);
  if (track.type === 'recipe') return showRecipeTrack(track);
  if (track.type === 'diag') return showDiagTrack(track);
  if (track.type === 'chain') return showChainTrack(track);
  if (track.type === 'build') return showBuildTrack(track);
  if (track.type === 'bluff') return showBluffTrack(track);
  if (track.type === 'estimate') return showEstimateTrack(track);
  if (track.categories) return showVocabTrack(track);
  app.innerHTML = `<button class="back">← Alla ämnen</button><h2>${track.icon} ${track.name}</h2><div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const box = app.querySelector('.quizzes');
  track.quizzes.forEach(q => {
    const best = Store.best(q.id);
    const b = best != null ? ` · Bästa: ${best}/${q.items.length}` : '';
    box.appendChild(card(`<strong>${q.title}</strong><small>${q.items.length} svar · ${q.time}s${b}</small>`,
      () => playQuiz(q, () => showTrack(track))));
  });
}

// ---------- Ordlistespår (språk) ----------
function getPair(track) {
  const codes = Object.keys(track.languages);
  const p = Store.getSetting(track.id) || {};
  const from = codes.includes(p.from) ? p.from : codes[0];
  const to = codes.includes(p.to) && p.to !== from ? p.to : codes.find(c => c !== from);
  return { from, to };
}

// Stabil nyckel för ett ord: kategori + ordet på spårets första språk.
const wordKey = (track, cat, w) => `${cat.id}/${alts(w[Object.keys(track.languages)[0]])[0]}`;
const pairKey = (track, from, to) => `${track.id}/${from}-${to}`;

function catProgress(track, cat, from, to) {
  const m = Store.known(pairKey(track, from, to));
  const known = cat.words.filter(w => (m[wordKey(track, cat, w)] || 0) >= KNOWN_AT).length;
  return { known, total: cat.words.length };
}

function buildVocabQuiz(track, cat, from, to, onlyUnknown) {
  const L = track.languages;
  const pk = pairKey(track, from, to);
  const m = Store.known(pk);
  let words = cat.words;
  let note = '';
  if (onlyUnknown) {
    const left = words.filter(w => (m[wordKey(track, cat, w)] || 0) < KNOWN_AT);
    if (left.length) { if (left.length < words.length) note = ` (${left.length} ord kvar att lära)`; words = left; }
    else note = ' (du kan alla – repetition)';
  }
  return {
    id: `${track.id}/${cat.id}/${from}-${to}`,
    title: `${cat.icon} ${cat.name}: ${L[from]} → ${L[to]}${note}`,
    baseTitle: `${cat.icon} ${cat.name}: ${L[from]} → ${L[to]}`,
    prompt: to === 'ru' ? 'Skriv ordet på ryska – med det kyrilliska tangentbordet nedanför eller med latinska bokstäver (t.ex. sobaka). Rätt svar fylls i automatiskt.'
      : to === 'zh' ? 'Dra rätt kinesiskt tecken till varje ord.' : `Skriv ordet på ${L[to].toLowerCase()}. Rätt svar fylls i automatiskt.`,
    time: Math.max(30, words.length * 6),
    pairKey: pk,
    items: words.map(w => ({ q: dispWord(from, alts(w[from])[0]), a: answersFor(to, w[to]), show: dispWord(to, alts(w[to])[0]),
      tile: alts(w[to])[0], key: wordKey(track, cat, w),
      info: Object.entries(L).map(([c, n]) => `<p><strong>${n}:</strong> ${esc(alts(w[c]).map(x => dispWord(c, x)).join(' / '))}</p>`).join('') })),
    tiles: to === 'zh', cyr: to === 'ru',
  };
}

function showVocabTrack(track) {
  stopTimer();
  const L = track.languages;
  const opts = sel => Object.entries(L).map(([c, n]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${n}</option>`).join('');
  let { from, to } = getPair(track);

  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <label>Från <select id="from">${opts(from)}</select></label>
      <button class="btn secondary" id="flip" title="Vänd håll">⇄</button>
      <label>Till <select id="to">${opts(to)}</select></label>
      <label class="check"><input type="checkbox" id="only" ${Store.getSetting('onlyUnknown') !== false ? 'checked' : ''}> Träna bara ord jag inte kan</label>
    </div>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;

  const fromSel = app.querySelector('#from'), toSel = app.querySelector('#to');
  function update(changed) {
    // Samma språk på båda sidor? Byt plats istället.
    if (fromSel.value === toSel.value) {
      if (changed === 'from') toSel.value = from; else fromSel.value = to;
    }
    from = fromSel.value; to = toSel.value;
    Store.setSetting(track.id, { from, to });
    renderCats();
  }
  fromSel.onchange = () => update('from');
  toSel.onchange = () => update('to');
  app.querySelector('#flip').onclick = () => { [fromSel.value, toSel.value] = [to, from]; update(); };
  const onlySel = app.querySelector('#only');
  onlySel.onchange = () => Store.setSetting('onlyUnknown', onlySel.checked);

  function renderCats() {
    const box = app.querySelector('.quizzes');
    box.innerHTML = '';
    track.categories.forEach(cat => {
      const p = catProgress(track, cat, from, to);
      const pct = Math.round(100 * p.known / p.total);
      const status = p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} ord kan du`;
      box.appendChild(card(
        `<strong>${cat.icon} ${cat.name}</strong><small>${status}</small>
         <div class="progress"><div style="width:${pct}%"></div></div>`,
        () => startVocab(buildVocabQuiz(track, cat, from, to, onlySel.checked), () => showTrack(track), () => {
          [from, to] = [to, from];
          Store.setSetting(track.id, { from, to });
          return buildVocabQuiz(track, cat, from, to, onlySel.checked);
        })));
    });
  }
  renderCats();
}

// ---------- Själva spelet ----------
// onFlip (valfri): returnerar samma quiz åt andra hållet.
function playQuiz(quiz, onBack, onFlip) {
  stopTimer();
  const lookup = new Map(); // normaliserat svar -> index
  quiz.items.forEach((it, i) => [].concat(it.a).forEach(ans => {
    const k = norm(ans);
    if (!lookup.has(k)) lookup.set(k, []);
    lookup.get(k).push(i);
  }));

  const found = new Set();
  let timeLeft = quiz.time;

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${quiz.title}</h2>
    <p>${quiz.prompt || ''}</p>
    <div class="bar">
      <input id="guess" placeholder="Skriv ett svar…" autocomplete="off" disabled>
      <span class="stat" id="score">0/${quiz.items.length}</span>
      <span class="stat" id="clock">${fmt(timeLeft)}</span>
      ${onFlip ? '<button class="btn secondary" id="flip" title="Vänd håll">⇄ Vänd</button>' : ''}
      <button class="btn" id="start">Starta</button>
    </div>
    ${quiz.cyr ? cyrKeyboardHtml() : ''}
    <div id="result"></div>
    <div class="grid">${quiz.items.map((it, i) =>
      `<div class="cell" id="c${i}"><span class="q">${esc(it.q)}</span><span class="a"></span></div>`).join('')}
    </div>`;

  const input = app.querySelector('#guess');
  const startBtn = app.querySelector('#start');
  const flipBtn = app.querySelector('#flip');
  app.querySelector('.back').onclick = onBack;
  if (flipBtn) flipBtn.onclick = () => startVocab(onFlip(), onBack, onFlip);
  if (quiz.cyr) wireCyrKeyboard(app, input);

  function start() {
    input.disabled = false; input.focus();
    if (flipBtn) flipBtn.remove();
    startBtn.textContent = 'Ge upp';
    startBtn.className = 'btn secondary';
    startBtn.onclick = () => finish(false);
    timerId = setInterval(() => {
      timeLeft--;
      app.querySelector('#clock').textContent = fmt(timeLeft);
      if (timeLeft <= 0) finish(false);
    }, 1000);
  }

  input.addEventListener('input', () => {
    const fresh = (lookup.get(norm(input.value)) || []).filter(i => !found.has(i));
    if (!fresh.length) return;
    fresh.forEach(i => {
      found.add(i);
      const c = app.querySelector('#c' + i);
      c.classList.add('found');
      c.querySelector('.a').textContent = quiz.items[i].show || [].concat(quiz.items[i].a)[0];
      if (quiz.items[i].info) c.querySelector('.a').insertAdjacentHTML('beforeend', ' ' + infoBtn(quiz.items[i].q, quiz.items[i].info));
    });
    input.value = '';
    input.classList.add('hit'); setTimeout(() => input.classList.remove('hit'), 200);
    app.querySelector('#score').textContent = `${found.size}/${quiz.items.length}`;
    if (found.size === quiz.items.length) finish(true);
  });

  function finish(all) {
    stopTimer();
    input.disabled = true;
    const missed = [];
    quiz.items.forEach((it, i) => {
      if (found.has(i)) return;
      const a = it.show || [].concat(it.a)[0];
      missed.push({ q: it.q, a });
      const c = app.querySelector('#c' + i);
      c.classList.add('missed');
      c.querySelector('.a').textContent = a;
      if (it.info) c.querySelector('.a').insertAdjacentHTML('beforeend', ' ' + infoBtn(it.q, it.info));
    });
    const prevBest = Store.best(quiz.id);
    const secs = quiz.time - timeLeft;
    Store.addAttempt({
      quiz: quiz.id, title: quiz.baseTitle || quiz.title, at: new Date().toISOString(),
      score: found.size, total: quiz.items.length, secs, missed,
    });
    let record = prevBest == null || found.size > prevBest ? ' 🏆 Nytt rekord!' : ` (Bästa: ${prevBest})`;
    if (quiz.pairKey) {
      const fresh = Store.updateWords(quiz.pairKey, quiz.items.map((it, i) => ({ key: it.key, ok: found.has(i) })));
      record = fresh ? `<br>📚 ${fresh === 1 ? '1 nytt ord' : fresh + ' nya ord'} som du nu kan!` : '';
    }
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${all ? '🎉 Alla rätt!' : 'Slut!'}</strong> Du fick ${found.size} av ${quiz.items.length} på ${fmt(secs)}.${record}
      ${missed.length ? '<br>Missade svar visas i rött – kör igen för att nöta in dem.' : ''}
    </div>`;
    startBtn.textContent = 'Spela igen';
    startBtn.className = 'btn';
    startBtn.onclick = () => playQuiz(quiz, onBack, onFlip);
  }

  startBtn.onclick = start;
}

// ---------- Resultatsida ----------
function showResults() {
  stopTimer();
  const all = Store.attempts();
  const who = Profiles.active();
  app.innerHTML = `<button class="back">← Alla ämnen</button><h2>📊 Resultat ${who ? `<small class="lvl">${who.emoji} ${esc(who.name)}</small>` : ''}</h2>`;
  app.querySelector('.back').onclick = showHome;
  const knowledge = (typeof flagsHtml === 'function' ? flagsHtml() : '') + learningStatsHtml() + vocabStatsHtml() + eventsStatsHtml() + mathStatsHtml() + sortStatsHtml() + geoStatsHtml() + recipeStatsHtml() + diagStatsHtml() + chainStatsHtml() + buildStatsHtml() + bluffStatsHtml() + estimateStatsHtml();
  if (!all.length && !knowledge) {
    app.insertAdjacentHTML('beforeend', '<p>Inga spelade quiz ännu.</p><p><button class="btn secondary" id="import">📥 Ladda upp sparad progress</button></p>');
    app.querySelector('#import').onclick = startImport;
    return;
  }

  // Per quiz: antal, bästa, senaste
  const per = new Map();
  all.forEach(a => {
    const p = per.get(a.quiz) || { title: a.title, total: a.total, n: 0, best: 0, last: a };
    p.n++; p.best = Math.max(p.best, a.score); p.last = a; p.title = a.title;
    per.set(a.quiz, p);
  });
  // Oftast missade
  const miss = new Map();
  all.forEach(a => (a.missed || []).forEach(m => {
    const k = `${m.q} → ${m.a}`;
    miss.set(k, (miss.get(k) || 0) + 1);
  }));
  const topMiss = [...miss].sort((x, y) => y[1] - x[1]).slice(0, 10);
  const date = iso => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

  app.insertAdjacentHTML('beforeend', `
    <p>${all.length} spelade omgångar.</p>
    ${knowledge}
    <h3>Per quiz</h3>
    <table><tr><th>Quiz</th><th>Spelat</th><th>Bästa</th><th>Senast</th></tr>
      ${[...per.values()].sort((x, y) => y.last.at.localeCompare(x.last.at)).map(p =>
        `<tr><td>${esc(p.title)}</td><td>${p.n}</td><td>${p.best}/${p.total}</td><td>${date(p.last.at)}</td></tr>`).join('')}
    </table>
    ${topMiss.length ? `<h3>Oftast missade</h3>
    <table><tr><th>Ord</th><th>Missat</th></tr>
      ${topMiss.map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n} ggr</td></tr>`).join('')}
    </table>` : ''}
    <h3>Senaste omgångarna</h3>
    <table><tr><th>När</th><th>Quiz</th><th>Poäng</th><th>Tid</th></tr>
      ${all.slice(-20).reverse().map(a =>
        `<tr><td>${date(a.at)}</td><td>${esc(a.title)}</td><td>${a.score}/${a.total}</td><td>${fmt(a.secs)}</td></tr>`).join('')}
    </table>
    <p class="actions">
      <button class="btn secondary" id="export">💾 Spara ner (exportera)</button>
      <button class="btn secondary" id="import">📥 Ladda upp (importera)</button>
      <button class="btn secondary" id="clear">Rensa min progress</button>
    </p>`);

  app.querySelector('#export').onclick = exportProfile;
  app.querySelector('#import').onclick = startImport;
  app.querySelector('#clear').onclick = () => {
    if (confirm(`Radera all sparad progress för ${Profiles.active().name}? Andra spelare påverkas inte.`)) { Store.clear(); showResults(); }
  };
  app.querySelectorAll('[data-unflag]').forEach(b => b.onclick = () => { const f = Store.getSetting('flags') || {}; delete f[b.dataset.unflag]; Store.setSetting('flags', f); showResults(); });
  app.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
    const [pk, cat] = b.dataset.reset.split('|');
    if (confirm('Nollställ vilka ord du kan i den här kategorin?')) { Store.resetKnown(pk, cat); showResults(); }
  });
}

// Ordkunskap: per språkhåll och kategori, med varje ord som en etikett.
function vocabStatsHtml() {
  const knownAll = Store.load().known;
  let html = '';
  TRACKS.filter(t => t.languages).forEach(track => { // bara ordlistor (historia och geografi har också kategorier)
    const L = track.languages;
    Object.keys(knownAll).filter(pk => pk.startsWith(track.id + '/')).forEach(pk => {
      const [from, to] = pk.slice(track.id.length + 1).split('-');
      const m = knownAll[pk];
      let sum = 0, tot = 0;
      const rows = track.categories.map(cat => {
        const chips = cat.words.map(w => {
          const s = m[wordKey(track, cat, w)] || 0;
          const cls = s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : '';
          return `<span class="chip ${cls}" title="${esc(dispWord(to, alts(w[to])[0]))}">${esc(dispWord(from, alts(w[from])[0]))}</span>`;
        });
        const p = catProgress(track, cat, from, to);
        sum += p.known; tot += p.total;
        return `<tr><td>${cat.icon} ${cat.name}<br><small>${p.known}/${p.total}</small>
          <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>
          <button class="link" data-reset="${pk}|${cat.id}">Nollställ</button></td>
          <td>${chips.join(' ')}</td></tr>`;
      }).join('');
      html += `<h3>📚 Ord du kan: ${L[from]} → ${L[to]} (${sum}/${tot})</h3>
        <table class="vocab">${rows}</table>`;
    });
  });
  return html ? html + `<p class="legend"><span class="chip known">kan</span> <span class="chip half">rätt 1 gång</span> <span class="chip">inte än</span> · Håll muspekaren över ett ord för att se svaret.</p>` : '';
}

// ---------- Inlärning & svinn (resultatsidan) ----------
function learningStatsHtml() {
  const stats = Store.load().stats || {};
  const all = Object.entries(stats).flatMap(([pk, m]) => Object.entries(m).map(([key, s]) => ({ pk, key, ...s })));
  if (!all.length) return '';
  const learned = all.filter(x => x.ever && x.triesToKnow);
  const direct = learned.filter(x => x.direct).length;
  const worked = learned.filter(x => !x.direct);
  const avg = worked.length ? (worked.reduce((s, x) => s + x.triesToKnow, 0) / worked.length) : 0;
  const waste = all.reduce((s, x) => s + (x.waste || 0), 0);
  const answers = all.reduce((s, x) => s + x.tries, 0);
  const label = x => {
    const t = TRACKS.find(tr => x.pk === tr.id || x.pk.startsWith(tr.id + '/'));
    return `${t ? t.icon + ' ' : ''}${esc(x.key.split('/').pop().replace(/→/, ' → '))}`;
  };
  const hardest = all.filter(x => x.wrong > 0).sort((a, b) => b.wrong - a.wrong || b.tries - a.tries).slice(0, 6);
  return `<h3>⏱️ Inlärning & svinn</h3>
    <div class="lstats">
      <div><strong>${learned.length}</strong><span>saker lärda</span></div>
      <div><strong>${direct}</strong><span>kunde du direkt – nöttes aldrig</span></div>
      <div><strong>${worked.length ? avg.toFixed(1).replace('.', ',') : '–'}</strong><span>svar i snitt för att lära in resten</span></div>
      <div class="${waste ? 'warn' : ''}"><strong>${waste}</strong><span>svar på sådant du redan kunde (svinn${answers ? `, ${Math.round(100 * waste / answers)} % av alla svar` : ''})</span></div>
    </div>
    <p class="small">Svinn = övning på något du redan kunde när det inte var dags att repetera. Bocka i "träna bara det jag inte kan" så hålls det nära noll.</p>
    ${hardest.length ? `<p><strong>Svårast hittills</strong> – här har du fastnat mest:</p><p>${hardest.map(x => `<span class="chip ${x.ever ? 'known' : ''}">${label(x)} <small>${x.wrong} fel</small></span>`).join(' ')}</p>` : ''}`;
}

// ---------- Inforutor (ⓘ) ----------
// infoBtn(titel, html, onOpen?) ger en liten i-knapp. Klick öppnar en ruta med mer information.
// Klicket fångas tidigt så att det inte också räknas som ett klick på kortet/korgen bakom.
const INFO = new Map();
let infoSeq = 0;
function infoBtn(title, html, onOpen) {
  const k = 'i' + (++infoSeq);
  INFO.set(k, { title, html, onOpen });
  return `<span class="ibtn" role="button" tabindex="0" data-info="${k}" title="Mer information" draggable="false">i</span>`;
}
function showInfo(title, html) {
  document.querySelector('.info-overlay')?.remove();
  const ov = document.createElement('div');
  ov.className = 'info-overlay';
  ov.innerHTML = `<div class="info-box" role="dialog"><button class="info-close" title="Stäng">✕</button>
    <h3>ℹ️ ${esc(title)}</h3><div class="info-body">${html}</div></div>`;
  const close = () => { ov.remove(); document.removeEventListener('keydown', onEsc, true); };
  const onEsc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.info-close')) close(); });
  document.addEventListener('keydown', onEsc, true);
  document.body.appendChild(ov);
  ov.querySelector('.info-close').focus();
}
document.addEventListener('click', e => {
  const b = e.target.closest('.ibtn');
  if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const it = INFO.get(b.dataset.info);
  if (!it) return;
  if (it.onOpen) it.onOpen();
  showInfo(it.title, it.html);
}, true);
document.addEventListener('mousedown', e => { if (e.target.closest('.ibtn')) e.stopPropagation(); }, true);

document.getElementById('home').onclick = showHome;
document.getElementById('results').onclick = showResults;
// Starten sker i profiles.js, som laddas sist.
