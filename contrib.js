// Bidrag från spelare: vem som helst kan fylla på de ämnen som finns – ordlistor, historiekategorier,
// sorteringar och recept – på samma sätt som det inbyggda innehållet. Varje bidrag märks med vem som lagt
// till det, och man kan välja att visa allt, bara Lärospels innehåll eller bara bidrag (och dölja enskilda personer).
// Bidragen sparas i webbläsaren (gemensamt för alla spelare på datorn) och kan delas som fil.
// Använder TRACKS, Store, Profiles, card, esc, showInfo, showHome, showTrack, getPair.

const Contrib = {
  KEY: 'larospel-contrib',
  all() { try { const a = JSON.parse(localStorage.getItem(this.KEY)); if (Array.isArray(a)) return a; } catch {} return []; },
  save(a) { try { localStorage.setItem(this.KEY, JSON.stringify(a)); } catch {} },
  upsert(c) { const a = this.all(); const i = a.findIndex(x => x.id === c.id); if (i >= 0) a[i] = c; else a.push(c); this.save(a); },
  remove(id) { this.save(this.all().filter(x => x.id !== id)); },
};

const byKey = by => `${by.emoji} ${by.name}`;
const contribSettings = () => ({ mode: 'all', hide: [], ...(Store.getSetting('contrib') || {}) });
const clean = s => String(s || '').replace(/[<>"]/g, '').trim();
const EMOJI_RE = /^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}]*)\s*/u;
const splitEmoji = s => { const m = s.match(EMOJI_RE); return m ? [m[1], s.slice(m[0].length).trim()] : ['', s.trim()]; };
const lines = s => String(s || '').split('\n').map(l => l.trim()).filter(Boolean);
const cols = (l, sep = '=') => l.split(l.includes('\t') ? '\t' : sep).map(x => clean(x));
const cParseYear = s => { const m = String(s).replace(/\s/g, '').match(/^(-?\d{1,4})(f\.?kr\.?)?$/i); return m ? (m[2] ? -Math.abs(+m[1]) : +m[1]) : null; };
const cYearStr = y => (y < 0 ? `${-y} f.Kr.` : String(y));

// ---------- Vad kan man lägga till? ----------
// arr = listan i spåret som bidraget hamnar i. fields = formuläret. parse = formulär → data (eller fel). toForm = data → formulär.
const CONTRIB_KINDS = {
  vocab: {
    match: t => !!t.languages, arr: 'categories', label: 'ordlista', icon: '📝',
    fields: track => [
      { k: 'langs', type: 'langs', label: 'Språk i listan' },
      { k: 'words', type: 'area', rows: 10, label: 'Orden – ett ord per rad, språken i samma ordning som ovan, åtskilda med =',
        help: 'Flera godkända svar skrivs med snedstreck: vän/kompis. Kinesiska skrivs tecken|pinyin, t.ex. 狗|gǒu.', ph: 'hus = house\nhund = dog\nkatt = cat' },
    ],
    parse(v, track) {
      const langs = Object.keys(track.languages).filter(c => c === 'sv' || v.langs.includes(c));
      const err = [];
      if (langs.length < 2) err.push('Välj minst ett språk utöver svenska.');
      const words = lines(v.words).map((l, i) => {
        const c = cols(l);
        if (c.length !== langs.length || c.some(x => !x)) { err.push(`Rad ${i + 1}: behöver ${langs.length} ord (${langs.map(x => track.languages[x]).join(' = ')}).`); return null; }
        return Object.fromEntries(langs.map((code, k) => [code, c[k]]));
      }).filter(Boolean);
      if (words.length < 3) err.push('Skriv minst tre ord.');
      const sv = words.map(w => alts(w.sv)[0].toLowerCase()), dup = sv.filter((x, i) => sv.indexOf(x) !== i);
      if (dup.length) err.push(`Samma svenska ord finns två gånger: ${[...new Set(dup)].join(', ')}.`);
      return { err, data: { words } };
    },
    toForm(d, track) { const langs = Object.keys(track.languages).filter(c => d.words.some(w => w[c])); return { langs, words: d.words.map(w => langs.map(c => w[c]).join(' = ')).join('\n') }; },
    count: d => `${d.words.length} ord`,
  },
  events: {
    match: t => t.type === 'events', arr: 'categories', label: 'historiekategori', icon: '📜',
    fields: () => [
      { k: 'events', type: 'area', rows: 10, label: 'Händelser – en per rad: händelse = årtal', help: 'År före Kristus skrivs som 753 f.Kr. (eller -753).', ph: 'Stockholm grundas = 1252\nDigerdöden når Sverige = 1350' },
    ],
    parse(v) {
      const err = [];
      const events = lines(v.events).map((l, i) => {
        const c = cols(l), y = cParseYear(c[1] || '');
        if (c.length !== 2 || !c[0] || y == null) { err.push(`Rad ${i + 1}: skriv händelse = årtal.`); return null; }
        return { e: c[0], y };
      }).filter(Boolean);
      if (events.length < 3) err.push('Skriv minst tre händelser.');
      const names = events.map(e => e.e.toLowerCase()), dup = names.filter((x, i) => names.indexOf(x) !== i);
      if (dup.length) err.push(`Samma händelse finns två gånger: ${[...new Set(dup)].join(', ')}.`);
      return { err, data: { events } };
    },
    toForm: d => ({ events: d.events.map(e => `${e.e} = ${cYearStr(e.y)}`).join('\n') }),
    count: d => `${d.events.length} händelser`,
  },
  sort: {
    match: t => t.type === 'sort', arr: 'sets', label: 'sortering', icon: '🧺',
    fields: () => [
      { k: 'desc', type: 'text', label: 'Instruktion', ph: 'Sortera frukterna efter färg.' },
      { k: 'baskets', type: 'area', rows: 4, label: 'Korgar (2–6) – en per rad, gärna med emoji först', ph: '🔴 Röda\n🟡 Gula\n🟢 Gröna' },
      { k: 'items', type: 'area', rows: 10, label: 'Saker att sortera – en per rad: sak = korg = förklaring (frivillig)', help: 'Emoji först på raden blir kortets bild.', ph: '🍓 Jordgubbe = Röda = Mogna jordgubbar är röda.\n🍌 Banan = Gula' },
    ],
    parse(v) {
      const err = [];
      const baskets = lines(v.baskets).map((l, i) => { const [icon, name] = splitEmoji(clean(l)); return { id: 'k' + (i + 1), name, icon: icon || '🧺' }; });
      if (baskets.length < 2 || baskets.length > 6) err.push('Skriv 2–6 korgar.');
      const items = lines(v.items).map((l, i) => {
        const c = cols(l), [e, n] = splitEmoji(c[0] || ''), b = baskets.find(x => x.name.toLowerCase() === (c[1] || '').toLowerCase());
        if (!n || !b) { err.push(`Rad ${i + 1}: skriv sak = korg (korgen måste finnas bland korgarna).`); return null; }
        return { n, e, b: b.id, why: c[2] || `${n} hör till ${b.name}.` };
      }).filter(Boolean);
      if (items.length < 4) err.push('Skriv minst fyra saker att sortera.');
      return { err, data: { desc: clean(v.desc) || 'Sortera korten i rätt korg.', baskets, items } };
    },
    toForm: d => ({ desc: d.desc, baskets: d.baskets.map(b => `${b.icon} ${b.name}`).join('\n'),
      items: d.items.map(it => `${it.e ? it.e + ' ' : ''}${it.n} = ${d.baskets.find(b => b.id === it.b).name} = ${it.why}`).join('\n') }),
    count: d => `${d.items.length} saker i ${d.baskets.length} korgar`,
  },
  recipe: {
    match: t => t.type === 'recipe', arr: 'recipes', label: 'recept', icon: '🍲',
    fields: () => [
      { k: 'desc', type: 'text', label: 'Kort beskrivning', ph: 'Mormors klassiska pannkakor.' },
      { k: 'ingredients', type: 'area', rows: 6, label: '1. Ingredienser – en per rad: ingrediens = mängd', help: 'Emoji först blir ingrediensens bild.', ph: '🥚 Ägg = 3 st\n🌾 Vetemjöl = 2,5 dl\n🥛 Mjölk = 6 dl' },
      { k: 'decoys', type: 'area', rows: 3, label: 'Ingredienser som INTE ska med (frivilligt): ingrediens = varför', help: 'Skriver du färre än två hämtar spelet lurendrejare från andra recept.', ph: '🍞 Jäst = Pannkakor jäser inte – det är äggen som binder smeten.' },
      { k: 'steps', type: 'area', rows: 6, label: '2. Arbetsgången – ett steg per rad, i rätt ordning', help: 'Börjar raden med + får steget göras i valfri ordning med steget ovanför.', ph: 'Vispa mjölet med hälften av mjölken till en slät smet\nVispa i resten av mjölken och äggen\nStek tunna pannkakor i smör' },
      { k: 'wrongSteps', type: 'area', rows: 2, label: 'Steg som INTE ska göras (frivilligt): steg = varför', ph: 'Koka smeten = Då stelnar äggen innan du hunnit steka.' },
      { k: 'values', type: 'area', rows: 3, label: '3. Värden – en fråga per rad: fråga = rätt svar | fel svar | fel svar', ph: 'Mängd mjölk = 6 dl | 1 dl | 2 l\nStekfettet = smör | olivolja | vatten' },
      { k: 'doneQ', type: 'text', label: '4. Fråga: hur vet man att det är klart?', ph: 'Hur vet du när det är dags att vända pannkakan?' },
      { k: 'doneA', type: 'area', rows: 3, label: 'Rätt svar på första raden, fel svar på raderna under', ph: 'Kanterna har släppt och ovansidan har stelnat\nDet har gått exakt en minut\nDet ryker från pannan' },
      { k: 'doneWhy', type: 'text', label: 'Förklaring', ph: 'Smeten ska ha stelnat, annars går pannkakan sönder.' },
    ],
    parse(v, track) {
      const err = [];
      const ingredients = lines(v.ingredients).map((l, i) => { const c = cols(l), [e, n] = splitEmoji(c[0] || ''); if (!n) { err.push(`Ingrediens rad ${i + 1} saknar namn.`); return null; } return { n, e, amt: c[1] || '' }; }).filter(Boolean);
      if (ingredients.length < 2) err.push('Skriv minst två ingredienser.');
      const have = new Set(ingredients.map(x => x.n.toLowerCase()));
      let decoys = lines(v.decoys).map(l => { const c = cols(l), [e, n] = splitEmoji(c[0] || ''); return n && { n, e, why: c[1] || `${n} hör inte hemma här.` }; }).filter(Boolean);
      const steps = []; let o = 0;
      lines(v.steps).forEach(l => { const same = l.startsWith('+'); if (!same || !o) o++; steps.push({ t: clean(l.replace(/^\+\s*/, '')), o }); });
      if (steps.length < 2) err.push('Skriv minst två steg i arbetsgången.');
      const wrongSteps = lines(v.wrongSteps).map(l => { const c = cols(l); return c[0] && { t: c[0], why: c[1] || 'Det ska man inte göra här.' }; }).filter(Boolean);
      const values = lines(v.values).map((l, i) => {
        const [q, rest] = cols(l), opts = (rest || '').split('|').map(clean).filter(Boolean);
        if (!q || opts.length < 2) { err.push(`Värde rad ${i + 1}: skriv fråga = rätt svar | fel svar.`); return null; }
        return { q, a: opts[0], opts: [...new Set(opts)].sort((a, b) => a.localeCompare(b, 'sv', { numeric: true })) };
      }).filter(Boolean);
      if (!values.length) err.push('Skriv minst ett värde (t.ex. mängd, temperatur eller tid).');
      const dl = lines(v.doneA).map(clean);
      if (!clean(v.doneQ) || dl.length < 2) err.push('Steg 4: skriv frågan, ett rätt svar och minst ett fel svar.');
      // För få lurendrejare? Låna ingredienser från spelets andra recept.
      if (decoys.length < 2 && ingredients.length) {
        const pool = shuffle(track._base.flatMap(r => r.ingredients).filter(x => !have.has(x.n.toLowerCase())));
        const seen = new Set(decoys.map(d => d.n.toLowerCase()));
        for (const x of pool) { if (decoys.length >= 3) break; if (seen.has(x.n.toLowerCase())) continue; seen.add(x.n.toLowerCase()); decoys.push({ n: x.n, e: x.e, why: `${x.n} behövs inte i det här receptet.`, auto: true }); }
      }
      return { err, data: { desc: clean(v.desc), ingredients, decoys, steps, wrongSteps, values, done: { q: clean(v.doneQ), a: dl[0], opts: dl, why: clean(v.doneWhy) || 'Så känner man igen att det är klart.' } } };
    },
    toForm: d => ({ desc: d.desc,
      ingredients: d.ingredients.map(x => `${x.e ? x.e + ' ' : ''}${x.n}${x.amt ? ' = ' + x.amt : ''}`).join('\n'),
      decoys: d.decoys.filter(x => !x.auto).map(x => `${x.e ? x.e + ' ' : ''}${x.n} = ${x.why}`).join('\n'),
      steps: d.steps.map((s, i) => `${i && s.o === d.steps[i - 1].o ? '+ ' : ''}${s.t}`).join('\n'),
      wrongSteps: d.wrongSteps.map(s => `${s.t} = ${s.why}`).join('\n'),
      values: d.values.map(x => `${x.q} = ${[x.a, ...x.opts.filter(o => o !== x.a)].join(' | ')}`).join('\n'),
      doneQ: d.done.q, doneA: [d.done.a, ...d.done.opts.filter(o => o !== d.done.a)].join('\n'), doneWhy: d.done.why }),
    count: d => `${d.ingredients.length} ingredienser, ${d.steps.length} steg`,
  },
};
const kindOf = t => Object.keys(CONTRIB_KINDS).find(k => CONTRIB_KINDS[k].match(t));
const contribTracks = () => TRACKS.filter(kindOf);

// ---------- Lägg in bidragen i spåren (enligt filtret) ----------
function applyContrib() {
  const s = contribSettings(), list = Contrib.all();
  contribTracks().forEach(t => {
    const arr = CONTRIB_KINDS[kindOf(t)].arr;
    if (!t._base) t._base = t[arr];
    const extra = s.mode === 'none' ? [] : list.filter(c => c.track === t.id && !s.hide.includes(byKey(c.by)))
      .map(c => ({ ...c.data, id: c.id, name: c.name, icon: c.icon, _by: c.by }));
    t[arr] = [...t._base, ...extra];
  });
}
// Används av motorerna när de ritar korten
const contribSkip = x => contribSettings().mode === 'only' && !x._by;
const contribHideTrack = t => contribSettings().mode === 'only' && !(kindOf(t) && t[CONTRIB_KINDS[kindOf(t)].arr].some(x => x._by));
const byTag = x => (x && x._by ? `<small class="bytag" title="Tillagt av ${esc(x._by.name)}">✍️ ${x._by.emoji} ${esc(x._by.name)}</small>` : '');
function contribAddCard(track, box, back) {
  const k = kindOf(track); if (!k) return;
  const K = CONTRIB_KINDS[k];
  const c = card(`<strong>➕ Lägg till ${K.label}</strong><small>Fyll på ${esc(track.name)} med något eget – det syns med ditt namn</small>`, () => contribForm(track, null, back));
  c.classList.add('addcard');
  box.appendChild(c);
}

// ---------- Startsidan ----------
function contribEntryHtml() {
  const s = contribSettings(), n = Contrib.all().length;
  const modeTxt = { all: 'allt', none: 'bara Lärospels innehåll', only: 'bara bidrag' }[s.mode];
  return `<div class="contribbar"><span>✍️ <strong>Bidrag från spelare</strong> ${n ? `· ${n} st · visar ${modeTxt}${s.hide.length ? ` (${s.hide.length} dolda personer)` : ''}`
    : '· Lägg till egna ordlistor, historiekategorier, sorteringar och recept'}</span>
    <button class="btn secondary" id="contribopen">${n ? 'Visa & filtrera' : '➕ Lägg till'}</button></div>`;
}

// ---------- Bidragssidan: lista, filter, dela ----------
function showContrib() {
  stopTimer();
  applyContrib();
  const s = contribSettings(), list = Contrib.all(), me = Profiles.active();
  const people = [...new Map(list.map(c => [byKey(c.by), c.by])).values()];
  const modes = { all: '🌐 Allt', none: '🎓 Bara Lärospels innehåll', only: '✍️ Bara bidrag' };
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>✍️ Bidrag från spelare</h2>
    <p class="legend">Här kan alla fylla på ämnena med egna ordlistor, historiekategorier, sorteringar och recept. De fungerar precis som det
      inbyggda innehållet – med progress, repetition och kunskapskarta – och märks med ✍️ och vem som lagt till dem.
      Bidragen sparas i den här webbläsaren och syns för alla spelare här. Dela dem med andra genom att spara dem som fil.</p>
    <h3>Visa</h3>
    <div class="modes cmodes">${Object.entries(modes).map(([k, n]) => `<button data-cmode="${k}" class="${s.mode === k ? 'active' : ''}">${n}</button>`).join('')}</div>
    ${people.length ? `<p class="small">Visa bidrag från:</p><div class="cpeople">${people.map(p => `<label class="check"><input type="checkbox" data-person="${esc(byKey(p))}" ${s.hide.includes(byKey(p)) ? '' : 'checked'} ${s.mode === 'none' ? 'disabled' : ''}> ${p.emoji} ${esc(p.name)}</label>`).join('')}</div>` : ''}
    <h3>Lägg till</h3>
    <div class="quizzes" id="cadd"></div>
    <h3>Alla bidrag (${list.length})</h3>
    ${list.length ? `<ul class="clist">${list.map(c => {
      const t = TRACKS.find(x => x.id === c.track), K = t && CONTRIB_KINDS[c.kind];
      return `<li><span class="cname">${c.icon} <strong>${esc(c.name)}</strong></span>
        <span class="small">${t ? `${t.icon} ${esc(t.name)} · ${K.label} · ${K.count(c.data)}` : 'okänt ämne'} · ✍️ ${c.by.emoji} ${esc(c.by.name)} · ${new Date(c.at).toLocaleDateString('sv-SE')}</span>
        <span class="cbtns">${t ? `<button class="link" data-cedit="${esc(c.id)}">✏️ Ändra</button>` : ''} <button class="link" data-cdel="${esc(c.id)}">🗑️ Ta bort</button></span></li>`;
    }).join('')}</ul>` : '<p class="small">Inga bidrag än – bli först!</p>'}
    <h3>Dela</h3>
    <div class="cshare">
      ${list.length ? `<button class="btn secondary" id="cexp">💾 Spara alla bidrag som fil</button>` : ''}
      ${list.some(c => me && c.by.pid === me.id) ? `<button class="btn secondary" id="cexpme">💾 Spara bara mina</button>` : ''}
      <button class="btn secondary" id="cimp">📂 Ladda upp bidrag från fil</button>
    </div>`;
  app.querySelector('.back').onclick = showHome;
  const set = patch => { Store.setSetting('contrib', { ...contribSettings(), ...patch }); showContrib(); };
  app.querySelectorAll('[data-cmode]').forEach(b => b.onclick = () => set({ mode: b.dataset.cmode }));
  app.querySelectorAll('[data-person]').forEach(b => b.onchange = () => {
    const h = new Set(contribSettings().hide); b.checked ? h.delete(b.dataset.person) : h.add(b.dataset.person); set({ hide: [...h] });
  });
  const add = app.querySelector('#cadd');
  contribTracks().forEach(t => {
    const K = CONTRIB_KINDS[kindOf(t)];
    add.appendChild(card(`<strong>${K.icon} ${K.label[0].toUpperCase() + K.label.slice(1)}</strong><small>i ${t.icon} ${esc(t.name)}</small>`, () => contribForm(t, null, showContrib)));
  });
  app.querySelectorAll('[data-cedit]').forEach(b => b.onclick = () => {
    const c = Contrib.all().find(x => x.id === b.dataset.cedit);
    contribForm(TRACKS.find(t => t.id === c.track), c, showContrib);
  });
  app.querySelectorAll('[data-cdel]').forEach(b => b.onclick = () => {
    const c = Contrib.all().find(x => x.id === b.dataset.cdel);
    if (confirm(`Ta bort "${c.name}" av ${c.by.name}? Det går inte att ångra (om det inte finns sparat i en fil).`)) { Contrib.remove(c.id); showContrib(); }
  });
  const ex = app.querySelector('#cexp'); if (ex) ex.onclick = () => exportContrib(list, 'alla');
  const exm = app.querySelector('#cexpme'); if (exm) exm.onclick = () => exportContrib(list.filter(c => c.by.pid === me.id), me.name);
  app.querySelector('#cimp').onclick = importContrib;
}

// ---------- Formuläret ----------
function contribForm(track, existing, back) {
  stopTimer();
  const kind = kindOf(track), K = CONTRIB_KINDS[kind], fields = K.fields(track);
  const v = existing ? { name: existing.name, icon: existing.icon, ...K.toForm(existing.data, track) } : { icon: K.icon, langs: ['en'] };
  const field = f => {
    if (f.type === 'langs') return `<div class="cfield"><label>${f.label}</label><div class="clangs">${Object.entries(track.languages).map(([c, n]) =>
      `<label class="check"><input type="checkbox" name="langs" value="${c}" ${c === 'sv' ? 'checked disabled' : (v.langs || []).includes(c) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <span class="small">Svenska är alltid med. Listan syns när du tränar mellan två av språken du väljer.</span></div>`;
    const val = esc(v[f.k] || '');
    return `<div class="cfield"><label for="cf-${f.k}">${f.label}</label>${f.type === 'area'
      ? `<textarea id="cf-${f.k}" name="${f.k}" rows="${f.rows}" placeholder="${esc(f.ph || '')}">${val}</textarea>`
      : `<input id="cf-${f.k}" name="${f.k}" value="${val}" placeholder="${esc(f.ph || '')}" autocomplete="off">`}
      ${f.help ? `<span class="small">${f.help}</span>` : ''}</div>`;
  };
  const me = Profiles.active();
  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${existing ? '✏️ Ändra' : '➕ Lägg till'} ${K.label} <small class="lvl">${track.icon} ${esc(track.name)}</small></h2>
    <p class="legend">${existing ? `Tillagt av ${existing.by.emoji} ${esc(existing.by.name)}.` : `Syns som ✍️ ${me.emoji} ${esc(me.name)} för alla som spelar i den här webbläsaren.`}
      Grå text i rutorna är exempel – skriv över dem med ditt eget.</p>
    <form class="cform" id="cform">
      <div class="crow"><div class="cfield cicon"><label for="cf-icon">Ikon</label><input id="cf-icon" name="icon" value="${esc(v.icon || '')}" maxlength="8"></div>
        <div class="cfield cgrow"><label for="cf-name">Namn</label><input id="cf-name" name="name" value="${esc(v.name || '')}" placeholder="T.ex. ${K.label === 'recept' ? 'Pannkakor' : K.label === 'ordlista' ? 'Frukter' : K.label === 'sortering' ? 'Frukter efter färg' : 'Stockholms historia'}" autocomplete="off" required></div></div>
      ${fields.map(field).join('')}
      <div id="cerr"></div>
      <button class="btn" type="submit">${existing ? 'Spara ändringarna' : 'Lägg till'}</button>
    </form>`;
  app.querySelector('.back').onclick = back;
  const form = app.querySelector('#cform');
  form.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(form), vals = Object.fromEntries(fd.entries());
    vals.langs = fd.getAll('langs');
    const { err, data } = K.parse(vals, track);
    if (!clean(vals.name)) err.unshift('Ge det ett namn.');
    if (err.length) {
      app.querySelector('#cerr').innerHTML = `<div class="rnote bad"><strong>Nästan! Det här behöver rättas:</strong><ul>${err.slice(0, 8).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      return;
    }
    const by = existing ? existing.by : { pid: me.id, name: me.name, emoji: me.emoji };
    Contrib.upsert({ id: existing ? existing.id : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind, track: track.id,
      name: clean(vals.name), icon: splitEmoji(clean(vals.icon))[0] || K.icon, by, at: existing ? existing.at : new Date().toISOString(),
      edited: existing ? new Date().toISOString() : undefined, data });
    applyContrib();
    back();
  };
}

// ---------- Dela via fil ----------
function exportContrib(items, who) {
  const blob = new Blob([JSON.stringify({ larospelContrib: 1, exportedAt: new Date().toISOString(), items }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = String(who).toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'bidrag';
  a.download = `larospel-bidrag-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}
function importContrib() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let d; try { d = JSON.parse(r.result); } catch { d = null; }
      if (!d || d.larospelContrib !== 1 || !Array.isArray(d.items)) return showInfo('Fel sorts fil', '<p>Det här ser inte ut som sparade Lärospel-bidrag.</p>');
      const have = Contrib.all();
      let added = 0, updated = 0, skipped = 0;
      d.items.forEach(c => {
        const t = TRACKS.find(x => x.id === c.track), K = t && CONTRIB_KINDS[c.kind];
        // Kör bidraget genom formulärets kontroll en gång till – en fil kan vara ändrad för hand
        const ok = K && kindOf(t) === c.kind && c.by && c.name && !K.parse(K.toForm(c.data, t), t).err.length;
        if (!ok) { skipped++; return; }
        const safe = { ...c, name: clean(c.name), by: { pid: clean(c.by.pid), name: clean(c.by.name), emoji: clean(c.by.emoji) }, data: K.parse(K.toForm(c.data, t), t).data };
        const old = have.find(x => x.id === c.id);
        if (!old) { added++; Contrib.upsert(safe); } else if ((c.edited || c.at) > (old.edited || old.at)) { updated++; Contrib.upsert(safe); }
      });
      applyContrib();
      showContrib();
      showInfo('Bidrag uppladdade', `<p>${added} nya${updated ? `, ${updated} uppdaterade` : ''}${skipped ? `, ${skipped} hoppades över (kunde inte läsas)` : ''}.</p>`);
    };
    r.readAsText(f);
  };
  inp.click();
}
