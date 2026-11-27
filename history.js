// Händelsespår (t.ex. Historia): två lägen
//   - fritext:   skriv årtalet för varje händelse
//   - tidslinje: dra händelserna i rätt ordning
// Använder Store, card, fmt, esc, stopTimer och timerId från game.js.

const EV_MODES = { fritext: '✍️ Årtal (fritext)', tidslinje: '↕️ Tidslinje', koppling: '🔗 Orsak & verkan' };
const evKey = (cat, ev) => `${cat.id}/${ev.e}`;
const evPair = (track, mode) => `${track.id}/${mode}`;
const fmtYear = y => (y < 0 ? `${-y} f.Kr.` : String(y));

// "753 f.Kr.", "753 fkr", "753 bc" och "-753" → -753
function parseYear(s) {
  const m = s.trim().toLowerCase().replace(/\s+/g, ' ').match(/^(-?\d{1,4})\s*(f\.?\s*kr\.?|fvt\.?|bc)?$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return m[2] ? -Math.abs(y) : y;
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function evProgress(track, cat, mode) {
  const m = Store.known(evPair(track, mode));
  return { known: cat.events.filter(ev => (m[evKey(cat, ev)] || 0) >= KNOWN_AT).length, total: cat.events.length };
}

// Välj händelser att spela; minst `min` stycken (tidslinjen behöver några att sortera).
function selectEvents(track, cat, mode, onlyUnknown, min) {
  if (!onlyUnknown) return { events: cat.events, note: '' };
  const m = Store.known(evPair(track, mode));
  const left = cat.events.filter(ev => (m[evKey(cat, ev)] || 0) < KNOWN_AT);
  if (left.length === cat.events.length) return { events: left, note: '' };
  if (left.length >= min) return { events: left, note: ` (${left.length} kvar att lära)` };
  if (!left.length) return { events: cat.events, note: ' (du kan alla – repetition)' };
  // För få kvar: fyll på med slumpade kända händelser
  const extra = shuffle(cat.events.filter(ev => !left.includes(ev))).slice(0, min - left.length);
  return { events: left.concat(extra), note: ` (${left.length} kvar att lära + repetition)` };
}

// ---------- Ämnessida ----------
function showEventsTrack(track) {
  stopTimer();
  const modeKey = track.id + '-mode';
  let mode = Store.getSetting(modeKey) || 'fritext';

  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <div class="modes">${Object.entries(EV_MODES).map(([k, n]) => `<button data-mode="${k}">${n}</button>`).join('')}</div>
      <label class="check"><input type="checkbox" id="only" ${Store.getSetting('onlyUnknown') !== false ? 'checked' : ''}> Träna bara det jag inte kan</label>
    </div>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const onlySel = app.querySelector('#only');
  onlySel.onchange = () => { Store.setSetting('onlyUnknown', onlySel.checked); render(); };
  app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    mode = b.dataset.mode; Store.setSetting(modeKey, mode); render();
  });

  function render() {
    app.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const box = app.querySelector('.quizzes');
    box.innerHTML = '';
    const back = () => showEventsTrack(track);
    if (mode === 'koppling') {
      const m = Store.known(evPair(track, 'koppling')), L = track.links || [];
      const kn = L.filter(l => (m[linkKey(l)] || 0) >= KNOWN_AT).length;
      box.appendChild(card(`<strong>🔗 Orsak & verkan</strong><small>Vad ledde till vad – tvärs över alla kategorier</small>
        <small>${kn === L.length ? '✅ Du kan alla' : `${kn}/${L.length} kopplingar kan du`}</small>
        <div class="progress"><div style="width:${Math.round(100 * kn / L.length)}%"></div></div>`, () => playLinks(track, onlySel.checked, back)));
    }
    box.appendChild(card(`<strong>🗺️ Tidslinjekarta</strong><small>Alla händelser på en tidslinje – med kopplingarna mellan dem</small>`, () => showTimelineMap(track, back)));
    if (mode === 'koppling') return;
    const done = [];
    track.categories.forEach(cat => {
      if (contribSkip(cat)) return;
      const p = evProgress(track, cat, mode);
      const pct = Math.round(100 * p.known / p.total);
      const status = p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} händelser kan du`;
      const c = card(
        `<strong>${cat.icon} ${cat.name}</strong><small>${status}</small>${byTag(cat)}
         <div class="progress"><div style="width:${pct}%"></div></div>`,
        () => (mode === 'fritext' ? playYears : playTimeline)(track, cat, onlySel.checked, back));
      if (onlySel.checked && p.known === p.total) done.push(c); else box.insertBefore(c, box.lastElementChild);
    });
    contribAddCard(track, box, back);
    doneSection(box, done, 'alla händelser');
  }
  render();
}

// ---------- Fritextläge ----------
function playYears(track, cat, onlyUnknown, onBack) {
  stopTimer();
  const { events, note } = selectEvents(track, cat, 'fritext', onlyUnknown, 1);
  const items = shuffle(events);
  const title = `${cat.icon} ${cat.name}: Årtal`;
  const found = new Set();
  const total = items.length;
  const time = Math.max(30, total * 10);
  let timeLeft = time;

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${title}${note}</h2>
    <p>Skriv årtalet för varje händelse – rätt svar godkänns direkt och du hoppar till nästa.
       Före Kristus: skriv t.ex. <em>753 f.Kr.</em> eller <em>-753</em>.</p>
    <div class="bar">
      <span class="stat" id="score">0/${total}</span>
      <span class="stat" id="clock">${fmt(timeLeft)}</span>
      <button class="btn" id="start">Starta</button>
    </div>
    <div id="result"></div>
    <div class="yeargrid">${items.map((ev, i) =>
      `<div class="yrow" id="r${i}"><span class="q">${esc(ev.e)}</span><input data-i="${i}" placeholder="år" autocomplete="off" disabled></div>`).join('')}
    </div>`;
  app.querySelector('.back').onclick = onBack;
  const startBtn = app.querySelector('#start');
  const inputs = [...app.querySelectorAll('.yrow input')];

  function focusNext(from) {
    for (let k = 1; k <= total; k++) {
      const j = (from + k) % total;
      if (!found.has(j)) return inputs[j].focus();
    }
  }
  function lock(i, cls) {
    const row = app.querySelector('#r' + i);
    row.classList.add(cls);
    inputs[i].replaceWith(Object.assign(document.createElement('span'), { className: 'a', textContent: fmtYear(items[i].y) }));
    row.insertAdjacentHTML('beforeend', infoBtn(items[i].e, evInfoHtml(items[i])));
  }

  function start() {
    inputs.forEach(inp => inp.disabled = false);
    inputs[0].focus();
    startBtn.textContent = 'Ge upp';
    startBtn.className = 'btn secondary';
    startBtn.onclick = () => finish(false);
    timerId = setInterval(() => {
      timeLeft--;
      app.querySelector('#clock').textContent = fmt(timeLeft);
      if (timeLeft <= 0) finish(false);
    }, 1000);
  }

  const grid = app.querySelector('.yeargrid');
  grid.addEventListener('input', e => {
    const i = +e.target.dataset.i;
    if (parseYear(e.target.value) !== items[i].y) return;
    found.add(i);
    lock(i, 'found');
    app.querySelector('#score').textContent = `${found.size}/${total}`;
    if (found.size === total) finish(true); else focusNext(i);
  });
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.dataset.i) return;
    const inp = e.target;
    if (inp.value.trim()) { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); }
    focusNext(+inp.dataset.i);
  });

  function finish(all) {
    stopTimer();
    items.forEach((ev, i) => { if (!found.has(i)) lock(i, 'missed'); });
    const secs = time - timeLeft;
    const fresh = Store.updateWords(evPair(track, 'fritext'), items.map((ev, i) => ({ key: evKey(cat, ev), ok: found.has(i) })));
    Store.addAttempt({
      quiz: `${track.id}/${cat.id}/fritext`, title, at: new Date().toISOString(),
      score: found.size, total, secs,
      missed: items.filter((ev, i) => !found.has(i)).map(ev => ({ q: ev.e, a: fmtYear(ev.y) })),
    });
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${all ? '🎉 Alla rätt!' : 'Slut!'}</strong> Du fick ${found.size} av ${total} på ${fmt(secs)}.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny händelse' : fresh + ' nya händelser'} som du nu kan!` : ''}
    </div>`;
    startBtn.textContent = 'Spela igen';
    startBtn.className = 'btn';
    startBtn.onclick = () => playYears(track, cat, onlyUnknown, onBack);
  }

  startBtn.onclick = start;
}

// ---------- Tidslinjeläge ----------
// Poäng = längsta delmängd som redan ligger i rätt inbördes ordning.
// Övriga är de man hade behövt flytta.
function inOrderSet(years) {
  const n = years.length, len = Array(n).fill(1), prev = Array(n).fill(-1);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++)
      if (years[j] <= years[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
  let k = len.indexOf(Math.max(...len));
  const set = new Set();
  while (k >= 0) { set.add(k); k = prev[k]; }
  return set;
}

function playTimeline(track, cat, onlyUnknown, onBack) {
  stopTimer();
  const { events, note } = selectEvents(track, cat, 'tidslinje', onlyUnknown, 4);
  let items = shuffle(events);
  for (let t = 0; t < 5 && items.every((ev, i) => !i || items[i - 1].y <= ev.y); t++) items = shuffle(events);
  const title = `${cat.icon} ${cat.name}: Tidslinje`;
  const total = items.length;
  let secs = 0;

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${title}${note}</h2>
    <p>Dra händelserna i rätt ordning – tidigast överst. Du kan också använda pilarna. Tryck <strong>Kontrollera</strong> när du är klar.</p>
    <div class="bar">
      <span class="stat" id="clock">0:00</span>
      <button class="btn" id="check">Kontrollera</button>
    </div>
    <div id="result"></div>
    <div class="tl-label">⬆ Tidigast</div>
    <ul class="timeline" id="tl">${items.map((ev, i) => `
      <li draggable="true" data-i="${i}">
        <span class="grip">⋮⋮</span><span class="q">${esc(ev.e)}</span><span class="yr"></span>
        <span class="mv"><button data-mv="-1" title="Flytta upp">▲</button><button data-mv="1" title="Flytta ner">▼</button></span>
      </li>`).join('')}
    </ul>
    <div class="tl-label">⬇ Senast</div>`;
  app.querySelector('.back').onclick = onBack;
  const ul = app.querySelector('#tl');
  const checkBtn = app.querySelector('#check');

  timerId = setInterval(() => { secs++; app.querySelector('#clock').textContent = fmt(secs); }, 1000);

  // Drag och släpp
  let dragEl = null;
  ul.addEventListener('dragstart', e => {
    dragEl = e.target.closest('li');
    dragEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  ul.addEventListener('dragover', e => {
    if (!dragEl) return;
    e.preventDefault();
    const after = [...ul.querySelectorAll('li:not(.dragging)')]
      .find(li => e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2);
    ul.insertBefore(dragEl, after || null);
  });
  ul.addEventListener('dragend', () => { dragEl?.classList.remove('dragging'); dragEl = null; });
  // Pilknappar
  ul.addEventListener('click', e => {
    const b = e.target.closest('[data-mv]');
    if (!b) return;
    const li = b.closest('li');
    if (b.dataset.mv === '-1' && li.previousElementSibling) ul.insertBefore(li, li.previousElementSibling);
    if (b.dataset.mv === '1' && li.nextElementSibling) ul.insertBefore(li.nextElementSibling, li);
  });

  function check() {
    stopTimer();
    const lis = [...ul.children];
    const order = lis.map(li => items[+li.dataset.i]);
    const ok = inOrderSet(order.map(ev => ev.y));
    lis.forEach((li, p) => {
      li.draggable = false;
      li.classList.add(ok.has(p) ? 'found' : 'missed');
      li.querySelector('.yr').textContent = fmtYear(order[p].y);
      li.querySelector('.yr').insertAdjacentHTML('afterend', infoBtn(order[p].e, evInfoHtml(order[p])));
      li.querySelector('.mv').remove();
    });
    const score = ok.size;
    const fresh = Store.updateWords(evPair(track, 'tidslinje'), order.map((ev, p) => ({ key: evKey(cat, ev), ok: ok.has(p) })));
    Store.addAttempt({
      quiz: `${track.id}/${cat.id}/tidslinje`, title, at: new Date().toISOString(),
      score, total, secs,
      missed: order.filter((ev, p) => !ok.has(p)).map(ev => ({ q: ev.e, a: fmtYear(ev.y) })),
    });
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${score === total ? '🎉 Helt rätt ordning!' : 'Klart!'}</strong>
      ${score} av ${total} låg rätt i förhållande till varandra på ${fmt(secs)}.
      ${score < total ? `Du hade behövt flytta ${total - score} (röda). <button class="link" id="sort">Visa rätt ordning</button>` : ''}
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny händelse' : fresh + ' nya händelser'} som du nu kan!` : ''}
    </div>`;
    app.querySelector('#sort')?.addEventListener('click', () =>
      lis.slice().sort((a, b) => items[+a.dataset.i].y - items[+b.dataset.i].y).forEach(li => ul.appendChild(li)));
    checkBtn.textContent = 'Spela igen';
    checkBtn.onclick = () => playTimeline(track, cat, onlyUnknown, onBack);
  }
  checkBtn.onclick = check;
}

// ---------- Statistik på resultatsidan ----------
function eventsStatsHtml() {
  const knownAll = Store.load().known;
  let html = '';
  TRACKS.filter(t => t.type === 'events').forEach(track => {
    Object.keys(EV_MODES).filter(m => m !== 'koppling').forEach(mode => {
      const pk = evPair(track, mode);
      const m = knownAll[pk];
      if (!m) return;
      let sum = 0, tot = 0;
      const rows = track.categories.map(cat => {
        const p = evProgress(track, cat, mode);
        sum += p.known; tot += p.total;
        const chips = cat.events.map(ev => {
          const s = m[evKey(cat, ev)] || 0;
          const cls = s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : '';
          return `<span class="chip ${cls}" title="${fmtYear(ev.y)}">${esc(ev.e)}${infoBtn(ev.e, evInfoHtml(ev))}</span>`;
        });
        return `<tr><td>${cat.icon} ${cat.name}<br><small>${p.known}/${p.total}</small>
          <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>
          <button class="link" data-reset="${pk}|${cat.id}">Nollställ</button></td>
          <td>${chips.join(' ')}</td></tr>`;
      }).join('');
      html += `<h3>${track.icon} ${track.name} – ${EV_MODES[mode]} (${sum}/${tot})</h3><table class="vocab">${rows}</table>`;
    });
  });
  return html;
}

// ======================================================================
// Kopplingar: orsak & verkan, samtidighet och tidslinjekarta
// ======================================================================
const linkKey = l => `${l.a}→${l.b}`;
const histTrack = () => TRACKS.find(t => t.id === 'historia');
function allEvents(track = histTrack()) { return track.categories.flatMap(c => c.events.map(ev => ({ ev, cat: c }))); }
const findEvent = (name, track = histTrack()) => allEvents(track).find(x => x.ev.e === name);

// Fördjupningsrutan för en händelse: årtal, fakta, kopplingar och vad som hände samtidigt
function evInfoHtml(ev) {
  const track = histTrack();
  const me = findEvent(ev.e, track);
  const L = (track.links || []);
  const out = L.filter(l => l.a === ev.e).map(l => ({ l, other: findEvent(l.b, track), dir: '→ ledde till' }));
  const inn = L.filter(l => l.b === ev.e).map(l => ({ l, other: findEvent(l.a, track), dir: '← orsakades av' }));
  const same = allEvents(track).filter(x => x.ev !== ev && me && x.cat !== me.cat && Math.abs(x.ev.y - ev.y) <= 15)
    .sort((a, b) => Math.abs(a.ev.y - ev.y) - Math.abs(b.ev.y - ev.y)).slice(0, 3);
  const links = [...inn, ...out].filter(x => x.other);
  return `<p><strong>${fmtYear(ev.y)}</strong>${me ? ` · ${me.cat.icon} ${esc(me.cat.name)}` : ''}</p>
    ${ev.more ? `<p>${esc(ev.more)}</p>` : ''}
    ${links.length ? `<h4>🔗 Hänger ihop med</h4><ul>${links.map(x => `<li><strong>${x.dir}:</strong> ${esc(x.other.ev.e)} (${fmtYear(x.other.ev.y)})<br><span class="small">${esc(x.l.why)}</span></li>`).join('')}</ul>` : ''}
    ${same.length ? `<h4>🌍 Samtidigt i världen</h4><ul>${same.map(x => `<li>${fmtYear(x.ev.y)}: ${esc(x.ev.e)} <span class="small">(${x.cat.icon} ${esc(x.cat.name)})</span></li>`).join('')}</ul>` : ''}${(typeof crossLinksHtml === 'function' ? crossLinksHtml({ t: 'hist', n: ev.e }) : '')}`;
}

// ---------- Läget Orsak & verkan ----------
function playLinks(track, onlyUnknown, onBack) {
  stopTimer();
  const pk = evPair(track, 'koppling');
  const m = Store.known(pk);
  let pool = shuffle(track.links || []);
  if (onlyUnknown) {
    const left = pool.filter(l => (m[linkKey(l)] || 0) < KNOWN_AT);
    if (left.length >= 3) pool = left.concat(pool.filter(l => !left.includes(l))).slice(0, Math.max(left.length, 3));
  }
  const round = pool.slice(0, 8);
  const results = [];
  let i = 0;
  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🔗 Orsak & verkan</h2>
    <div class="dots" id="dots"></div>
    <div id="stage"></div><div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const dots = () => app.querySelector('#dots').innerHTML = round.map((_, k) =>
    `<span class="fdot ${k < results.length ? (results[k] ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></span>`).join('');

  function show() {
    const l = round[i];
    const A = findEvent(l.a, track), B = findEvent(l.b, track);
    const forward = Math.random() < 0.5;
    const given = forward ? A : B, answer = forward ? B : A;
    // Lockande alternativ som passar i tid (efter orsaken / före följden), så att årtalen inte avslöjar svaret
    const others = allEvents(track).filter(x => x.ev !== A.ev && x.ev !== B.ev && (forward ? x.ev.y > A.ev.y : x.ev.y < B.ev.y));
    const opts = shuffle([answer, ...shuffle(others).slice(0, 3)]);
    let wrong = 0;
    dots();
    app.querySelector('#msg').innerHTML = '';
    const stage = app.querySelector('#stage');
    stage.innerHTML = `
      <div class="symptom"><span class="semo">${given.cat.icon}</span>
        <div><div class="slabel">${fmtYear(given.ev.y)} · ${esc(given.cat.name)}</div><div class="stext">${esc(given.ev.e)}</div></div></div>
      <h3>${forward ? 'Vad ledde det här till?' : 'Vad låg bakom det här?'}</h3>
      <div class="vopts col">${opts.map((o, k) => `<button class="vopt" data-k="${k}">${esc(o.ev.e)} <span class="small">(${fmtYear(o.ev.y)})</span></button>`).join('')}</div>`;
    stage.onclick = e => {
      const b = e.target.closest('.vopt'); if (!b || b.disabled) return;
      if (opts[+b.dataset.k] !== answer) { wrong++; b.classList.add('bad'); b.disabled = true; if (wrong < 2) return; }
      stage.querySelectorAll('.vopt').forEach(x => { x.disabled = true; if (opts[+x.dataset.k] === answer) x.classList.add('ok'); });
      const ok = wrong === 0;
      results.push(ok); dots();
      app.querySelector('#msg').innerHTML = `<div class="rnote ${ok ? 'ok' : ''}">
        <strong>${ok ? '✅ Rätt!' : 'Kopplingen:'}</strong> ${esc(l.a)} (${fmtYear(A.ev.y)}) → ${esc(l.b)} (${fmtYear(B.ev.y)})
        <br>${esc(l.why)}
        <br><button class="btn" id="nextl">${i + 1 < round.length ? 'Nästa →' : 'Se resultatet →'}</button></div>`;
      const nb = app.querySelector('#nextl');
      nb.onclick = () => { i++; i < round.length ? show() : finish(); };
      nb.focus();
    };
  }
  function finish() {
    const score = results.filter(Boolean).length;
    const fresh = Store.updateWords(pk, round.map((l, k) => ({ key: linkKey(l), ok: results[k] })));
    Store.addAttempt({ quiz: `${track.id}/koppling`, title: '🔗 Orsak & verkan', at: new Date().toISOString(), score, total: round.length, secs: 0,
      missed: round.filter((_, k) => !results[k]).map(l => ({ q: l.a, a: l.b })) });
    dots();
    app.querySelector('#stage').innerHTML = `<div class="result"><strong>${score === round.length ? '🎉 Alla kopplingar rätt!' : 'Klart!'}</strong> ${score} av ${round.length} rätt på första försöket.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny koppling' : fresh + ' nya kopplingar'} som du nu kan!` : ''}
      <br><button class="btn" id="again">Kör igen</button> <button class="btn secondary" id="map">🗺️ Se tidslinjekartan</button></div>`;
    app.querySelector('#msg').innerHTML = '';
    app.querySelector('#again').onclick = () => playLinks(track, onlyUnknown, onBack);
    app.querySelector('#map').onclick = () => showTimelineMap(track, onBack);
  }
  show();
}

// ---------- Tidslinjekarta ----------
// Hela historien på en tidslinje. Skalan är hoptryckt för antiken så att de senaste seklerna får plats.
function showTimelineMap(track, onBack) {
  stopTimer();
  const W = 1000, PAD = 46, LANE = 78, TOP = 50;
  const BP = [[-800, 0], [500, 0.18], [1500, 0.42], [2030, 1]];
  const xOf = y => { for (let k = 1; k < BP.length; k++) if (y <= BP[k][0]) { const [y0, f0] = BP[k - 1], [y1, f1] = BP[k]; return PAD + (f0 + (f1 - f0) * (y - y0) / (y1 - y0)) * (W - 2 * PAD); } return W - PAD; };
  const cats = track.categories;
  const H = TOP + cats.length * LANE + 40;
  const knownA = Store.known(evPair(track, 'fritext')), knownB = Store.known(evPair(track, 'tidslinje'));
  const isKnown = (cat, ev) => (knownA[evKey(cat, ev)] || 0) >= KNOWN_AT || (knownB[evKey(cat, ev)] || 0) >= KNOWN_AT;
  const COLORS = ['#2b6cb0', '#b7791f', '#2f855a', '#9b2c2c', '#6b46c1'];
  const pos = new Map();
  let dotsSvg = '', laneSvg = '';
  cats.forEach((cat, ci) => {
    const y = TOP + ci * LANE + LANE / 2;
    laneSvg += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" class="lane"/><text x="8" y="${y + 4}" class="lanelabel">${cat.icon}</text>`;
    // Sprid ut punkter som ligger nära varandra i höjdled
    let lastX = -99, bump = 0;
    cat.events.slice().sort((a, b) => a.y - b.y).forEach(ev => {
      const x = xOf(ev.y);
      bump = x - lastX < 12 ? (bump + 1) % 3 : 0; lastX = x;
      const yy = y + (bump === 1 ? -16 : bump === 2 ? 16 : 0);
      pos.set(ev.e, [x, yy]);
      dotsSvg += `<g class="tdot ${isKnown(cat, ev) ? 'known' : ''}" data-e="${esc(ev.e)}"><title>${fmtYear(ev.y)}: ${esc(ev.e)}</title>
        <circle cx="${x}" cy="${yy}" r="6" style="--c:${COLORS[ci % COLORS.length]}"/></g>`;
    });
  });
  const arcs = (track.links || []).map(l => {
    const a = pos.get(l.a), b = pos.get(l.b); if (!a || !b) return '';
    const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 30 - Math.abs(b[0] - a[0]) * 0.12;
    return `<path d="M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}" class="arc"><title>${esc(l.a)} → ${esc(l.b)}</title></path>`;
  }).join('');
  const ticks = [-750, 0, 500, 1000, 1500, 1600, 1700, 1800, 1900, 2000].map(y =>
    `<line x1="${xOf(y)}" y1="${TOP - 10}" x2="${xOf(y)}" y2="${H - 30}" class="tick"/><text x="${xOf(y)}" y="${TOP - 16}" class="ticklabel">${y < 0 ? -y + ' f.Kr.' : y}</text>`).join('');
  const kn = allEvents(track).filter(x => isKnown(x.cat, x.ev)).length;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🗺️ Tidslinjekarta</h2>
    <p class="legend">Alla ${allEvents(track).length} händelser på en tidslinje, en rad per kategori. <strong>Ifyllda</strong> punkter kan du (${kn} st).
      Bågarna visar orsak och verkan. Klicka på en punkt för att läsa mer. Skalan är hoptryckt för antiken.</p>
    <div class="tllegend">${cats.map((c, ci) => `<span><i style="background:${COLORS[ci % COLORS.length]}"></i>${c.icon} ${esc(c.name)}</span>`).join('')}<span><i class="arcsample"></i>orsak → verkan</span></div>
    <div class="tlmap"><svg viewBox="0 0 ${W} ${H}">${ticks}${laneSvg}${arcs}${dotsSvg}</svg></div>`;
  app.querySelector('.back').onclick = onBack;
  app.querySelector('.tlmap').addEventListener('click', e => {
    const g = e.target.closest('.tdot'); if (!g) return;
    const x = findEvent(g.dataset.e, track);
    if (x) showInfo(x.ev.e, evInfoHtml(x.ev));
  });
}
