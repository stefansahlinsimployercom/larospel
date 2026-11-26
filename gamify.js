// Gamifiering: nivå och XP, 🔥 dagar i rad, vad man lärt sig under en vald period – och jämförelse med andra spelare.
// Bygger på den dagliga loggen (Store.logAdd) och tidsstämplarna när något lärdes in (stats.knownAt, math.doneAt).
// Allt räknas ur en spelares sparade data (d), så samma funktioner fungerar för alla spelare på datorn.
// Använder TRACKS, Store, Profiles, KNOWN_AT, esc, card, stopTimer, showInfo, readProfileData, kmTotals, knowledgeInventory.

const DAY = 864e5;
// XP: 1 per rätt svar, 10 per ny sak man lärt sig, 5 per återlärd, 3 per lyckad repetition, 30 per klart steg i träden, 10 per inplacerat steg
const LEVEL_TITLES = ['🌱 Nyfiken', '🌿 Lärling', '📗 Upptäckare', '🧭 Utforskare', '🔭 Kännare', '🎓 Expert', '🦉 Mästare', '🌟 Vis', '🏛️ Legend'];

// XP för allt man gjort innan loggen fanns – räknas ut ur progressen
function stateXP(d) {
  const known = Object.values(d.known || {}).reduce((s, m) => s + Object.values(m).filter(v => v >= KNOWN_AT).length, 0);
  const tree = Object.values(d.math || {}).filter(s => s.done).length;
  const correct = Object.values(d.stats || {}).reduce((s, m) => s + Object.values(m).reduce((a, x) => a + (x.tries || 0) - (x.wrong || 0), 0), 0);
  return 10 * known + 30 * tree + correct;
}
const sumLog = (d, from = '') => Object.entries(d.log || {}).filter(([day]) => day >= from)
  .reduce((s, [, x]) => { Object.entries(x).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; }); return s; }, {});
const xpOf = d => (d.xpBase ?? stateXP(d)) + (sumLog(d).x || 0);
function levelOf(xp) {
  let lvl = 1, need = 100, rest = xp;
  while (rest >= need) { rest -= need; lvl++; need = 100 + 50 * (lvl - 1); }
  return { lvl, into: rest, need, title: LEVEL_TITLES[Math.min(Math.floor((lvl - 1) / 3), LEVEL_TITLES.length - 1)] };
}
function activeDays(d) {
  const days = new Set(Object.entries(d.log || {}).filter(([, x]) => x.a || x.p).map(([k]) => k));
  (d.attempts || []).forEach(a => a.at && days.add(Store.dayKey(new Date(a.at).getTime())));
  return days;
}
function streakOf(d) {
  const days = activeDays(d);
  let t = Store.now(), n = 0;
  if (!days.has(Store.dayKey(t))) t -= DAY;           // idag räknas inte bort förrän dagen är slut
  while (days.has(Store.dayKey(t))) { n++; t -= DAY; }
  return { n, today: days.has(Store.dayKey()) };
}

// ---------- Vilket ämne hör en sak till, och vad heter den? ----------
function trackOfPk(pk) {
  const id = pk.split('/')[0];
  return TRACKS.find(t => t.id === id) || (id === 'kopplingar' ? { id, icon: '🌐', name: 'Kopplingar mellan ämnen' } : { id, icon: '📦', name: id });
}
const treeTrackOf = nodeId => TRACKS.find(t => t.type === 'tree' && t.branches.some(b => b.nodes.some(n => n.id === nodeId)));
function itemLabel(pk, key) {
  const id = pk.split('/')[0];
  if (id === 'bluff') { const c = TRACKS.find(t => t.id === 'bluff').claims.find(x => x.id === key); return c ? c.parts.join('') : key.startsWith('gen:') ? '⚙️ Genererat påstående' : key; }
  if (id === 'uppskatta') { const q = TRACKS.find(t => t.id === 'uppskatta').questions.find(x => x.id === key); return q ? q.q : '⚙️ Genererad uppskattning'; }
  if (id === 'kopplingar') return key.replace(/\|/g, ' ↔ ').replace(/(hist|geo|zoo|node):/g, '');
  const t = TRACKS.find(x => x.id === id);
  if (t && t.languages) { const [from, to] = pk.split('/')[1].split('-'); return `${key.split('/').slice(1).join('/')} (${t.languages[from] || from} → ${t.languages[to] || to})`; }
  return key.includes('/') ? key.split('/').slice(1).join('/') : key;
}

// Allt man lärt sig sedan en tidpunkt: [{ t, track, label, kind: 'ny' | 'igen' | 'plac' }]
function learnedSince(d, from) {
  const out = [];
  Object.entries(d.stats || {}).forEach(([pk, m]) => Object.entries(m).forEach(([key, s]) => {
    if (s.knownAt >= from) out.push({ t: s.knownAt, track: trackOfPk(pk), label: itemLabel(pk, key), kind: 'ny' });
    if (s.relearnedAt >= from) out.push({ t: s.relearnedAt, track: trackOfPk(pk), label: itemLabel(pk, key), kind: 'igen' });
  }));
  Object.entries(d.math || {}).forEach(([id, s]) => {
    const tr = treeTrackOf(id); if (!tr) return;
    const label = typeof nodeName === 'function' ? nodeName(tr, id) : id;
    if (s.doneAt >= from) out.push({ t: s.doneAt, track: tr, label, kind: 'ny' });
    else if (s.placedAt >= from) out.push({ t: s.placedAt, track: tr, label, kind: 'plac' });
  });
  return out.sort((a, b) => b.t - a.t);
}
// Hur mycket man kan nu, per ämne
function knownPerTrack(d) {
  const per = new Map(), add = (t, n = 1) => per.set(t, (per.get(t) || 0) + n);
  Object.entries(d.known || {}).forEach(([pk, m]) => { const n = Object.values(m).filter(v => v >= KNOWN_AT).length; if (n) add(trackOfPk(pk), n); });
  Object.entries(d.math || {}).forEach(([id, s]) => { if (s.done) { const t = treeTrackOf(id); if (t) add(t); } });
  return per;
}

// ---------- Perioder ----------
const PERIODS = { dag: 'Idag', vecka: '7 dagar', manad: '30 dagar', ar: 'I år', allt: 'Allt' };
function periodStart(p) {
  const d = new Date(Store.now()); d.setHours(0, 0, 0, 0);
  if (p === 'vecka') d.setDate(d.getDate() - 6);
  if (p === 'manad') d.setDate(d.getDate() - 29);
  if (p === 'ar') { d.setMonth(0, 1); }
  return p === 'allt' ? 0 : d.getTime();
}
// Sammanfattning av en spelare – för egen vy och topplista
function playerSummary(d, period) {
  const from = periodStart(period), fromDay = from ? Store.dayKey(from) : '';
  const xp = xpOf(d), L = levelOf(xp), lg = sumLog(d, fromDay);
  const days = [...activeDays(d)].filter(k => k >= fromDay).length;
  const per = knownPerTrack(d);
  const known = [...per.values()].reduce((s, n) => s + n, 0);
  const best = [...per].sort((a, b) => b[1] - a[1])[0];
  // Utan logg (gammal data): XP för hela tiden = allt man har
  const pxp = period === 'allt' ? xp : (lg.x || 0);
  return { xp, L, pxp, learned: (lg.l || 0) + (lg.p || 0), relearned: lg.rl || 0, reviews: lg.r || 0, answers: lg.a || 0, correct: lg.c || 0,
    days, streak: streakOf(d).n, known, best };
}

// ---------- Feedback efter varje spel: +XP och ny nivå ----------
function gameAfterSave(xpBefore, d) {
  const after = xpOf(d), gained = after - xpBefore;
  if (gained <= 0) return;
  const a = levelOf(xpBefore), b = levelOf(after);
  if (b.lvl === a.lvl && gained < 5) return;            // inga notiser för varje enskilt svar
  gameToast(b.lvl > a.lvl ? `⬆️ <strong>Nivå ${b.lvl}!</strong> ${b.title}` : `+${gained} XP`, b.lvl > a.lvl);
}
function gameToast(html, big) {
  let box = document.getElementById('toasts');
  if (!box) { box = Object.assign(document.createElement('div'), { id: 'toasts' }); document.body.appendChild(box); }
  const t = Object.assign(document.createElement('div'), { className: 'toast' + (big ? ' big' : ''), innerHTML: html });
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), big ? 3500 : 1800);
  setTimeout(() => t.remove(), big ? 4200 : 2400);
}

// ---------- Startsidan: spelarkortet ----------
function gameEntryHtml() {
  const p = Profiles.active(), d = Store.load(), s = playerSummary(d, 'vecka'), st = streakOf(d);
  return `<div class="gentry" id="gameentry" role="button" tabindex="0">
    <div class="glvl"><span>${s.L.lvl}</span><small>nivå</small></div>
    <div class="gmain"><strong>${p.emoji} ${esc(p.name)} · ${s.L.title}</strong>
      <div class="xpbar" title="${s.L.into} av ${s.L.need} XP till nästa nivå"><div style="width:${Math.round(100 * s.L.into / s.L.need)}%"></div></div>
      <span class="small">${s.L.need - s.L.into} XP till nivå ${s.L.lvl + 1} · senaste 7 dagarna: <strong>+${s.learned}</strong> lärda, +${s.pxp} XP</span></div>
    <div class="gstreak ${st.n ? '' : 'off'}" title="${st.today ? 'Du har spelat idag!' : st.n ? 'Spela idag för att hålla igång sviten' : 'Spela en runda för att starta en svit'}">🔥<strong>${st.n}</strong><small>${st.n === 1 ? 'dag' : 'dagar'} i rad</small></div>
  </div>`;
}

// ---------- Min utveckling ----------
function showProgress(period = Store.getSetting('gperiod') || 'vecka') {
  stopTimer();
  const me = Profiles.active(), d = Store.load(), s = playerSummary(d, period), st = streakOf(d);
  const from = periodStart(period), items = learnedSince(d, from);
  const inv = typeof knowledgeInventory === 'function' ? knowledgeInventory() : [];
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>🏆 Min utveckling</h2>
    <div class="ghero">
      <div class="glvl big"><span>${s.L.lvl}</span><small>nivå</small></div>
      <div class="gmain"><strong>${me.emoji} ${esc(me.name)} · ${s.L.title}</strong>
        <div class="xpbar"><div style="width:${Math.round(100 * s.L.into / s.L.need)}%"></div></div>
        <span class="small">${s.xp.toLocaleString('sv-SE')} XP totalt · ${s.L.need - s.L.into} XP till nivå ${s.L.lvl + 1}${s.L.lvl % 3 === 0 ? ` – då blir du ${levelOf(s.xp + s.L.need - s.L.into).title}` : ''}</span></div>
      <div class="gstreak ${st.n ? '' : 'off'}">🔥<strong>${st.n}</strong><small>${st.n === 1 ? 'dag' : 'dagar'} i rad${st.n && !st.today ? '<br>spela idag!' : ''}</small></div>
    </div>
    <h3>📍 Var du står just nu</h3>
    ${inv.length ? `<div class="gwhere">${inv.filter(x => x.total).map(x => {
      const k = x.known + x.due, pct = Math.round(100 * k / x.total);
      return `<div class="gw"><span>${x.track.icon} ${esc(x.track.name)}</span><div class="progress"><div style="width:${pct}%"></div></div><span class="small">${k}/${x.total}</span></div>`;
    }).join('')}</div>` : ''}
    <h3>📅 Vad har du lärt dig?</h3>
    <div class="modes gperiods">${Object.entries(PERIODS).map(([k, n]) => `<button data-p="${k}" class="${k === period ? 'active' : ''}">${n}</button>`).join('')}</div>
    <div class="gstats">
      ${gstat('📚', s.learned, 'nya saker lärda')}${gstat('♻️', s.relearned, 'återlärda')}${gstat('🔁', s.reviews, 'repetitioner')}
      ${gstat('✏️', s.answers, `svar${s.answers ? ` · ${Math.round(100 * s.correct / s.answers)} % rätt` : ''}`)}${gstat('⭐', s.pxp, 'XP')}${gstat('📆', s.days, 'aktiva dagar')}
    </div>
    ${chartHtml(d, period)}
    ${items.length ? `<h4>Det här har du lärt dig ${period === 'dag' ? 'idag' : period === 'allt' ? 'sedan tidsstämplarna infördes' : `– ${PERIODS[period].toLowerCase()}`}</h4>
      ${groupItems(items)}` : `<p class="small">Inget nytt inlärt ${period === 'dag' ? 'idag' : 'under perioden'} än – en runda räcker för att komma igång!</p>`}
    ${period === 'allt' ? `<p class="small">💡 Datum för när du lärde dig något finns från 26 nov 2026. Det du kunde innan dess räknas in i nivån men syns inte i listan.</p>` : ''}
    <h3>👥 Jämför med andra</h3>
    <div id="board"></div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { Store.setSetting('gperiod', b.dataset.p); showProgress(b.dataset.p); });
  renderBoard(app.querySelector('#board'), period);
}
const gstat = (icon, n, label) => `<div class="gstat"><span>${icon}</span><strong>${Number(n).toLocaleString('sv-SE')}</strong><small>${label}</small></div>`;
function groupItems(items) {
  const per = new Map();
  items.forEach(x => { const k = x.track.id; if (!per.has(k)) per.set(k, { t: x.track, list: [] }); per.get(k).list.push(x); });
  return `<div class="glearned">${[...per.values()].map(({ t, list }) => `<div class="glgroup"><strong>${t.icon} ${esc(t.name)} <span class="small">(${list.length})</span></strong>
    <div>${list.slice(0, 40).map(x => `<span class="chip ${x.kind === 'ny' ? 'known' : 'half'}" title="${new Date(x.t).toLocaleString('sv-SE')}${x.kind === 'igen' ? ' · återlärd' : x.kind === 'plac' ? ' · inplacerad' : ''}">${x.kind === 'igen' ? '♻️ ' : x.kind === 'plac' ? '🧭 ' : ''}${esc(x.label)}</span>`).join(' ')}
    ${list.length > 40 ? `<span class="small">… och ${list.length - 40} till</span>` : ''}</div></div>`).join('')}</div>`;
}
// Stapeldiagram: XP per dag (dag/vecka/månad) eller per månad (år/allt)
function chartHtml(d, period) {
  if (period === 'dag') return '';
  const log = d.log || {}, buckets = [];
  if (period === 'vecka' || period === 'manad') {
    const n = period === 'vecka' ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) { const k = Store.dayKey(Store.now() - i * DAY); buckets.push({ label: k.slice(8).replace(/^0/, ''), key: k, x: (log[k] || {}).x || 0, l: ((log[k] || {}).l || 0) + ((log[k] || {}).p || 0) }); }
  } else {
    const months = new Map();
    Object.entries(log).forEach(([k, x]) => { const m = k.slice(0, 7); const b = months.get(m) || { x: 0, l: 0 }; b.x += x.x || 0; b.l += (x.l || 0) + (x.p || 0); months.set(m, b); });
    const now = new Date(Store.now()), start = period === 'ar' ? new Date(now.getFullYear(), 0, 1) : (() => { const f = [...months.keys()].sort()[0]; return f ? new Date(+f.slice(0, 4), +f.slice(5) - 1, 1) : now; })();
    for (let m = new Date(start); m <= now; m.setMonth(m.getMonth() + 1)) {
      const k = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, b = months.get(k) || { x: 0, l: 0 };
      buckets.push({ label: m.toLocaleDateString('sv-SE', { month: 'short' }), key: k, ...b });
    }
  }
  const max = Math.max(1, ...buckets.map(b => b.x));
  return `<div class="gchart" aria-label="XP per ${period === 'ar' || period === 'allt' ? 'månad' : 'dag'}">${buckets.map(b =>
    `<div class="gcol" title="${b.key}: ${b.x} XP, ${b.l} lärda"><div class="gbar" style="height:${Math.round(100 * b.x / max)}%">${b.l ? `<span>${b.l}</span>` : ''}</div><small>${b.label}</small></div>`).join('')}</div>
    <p class="small center">Staplarna visar XP ${period === 'ar' || period === 'allt' ? 'per månad' : 'per dag'} · siffran = antal saker du lärde dig</p>`;
}

// ---------- Topplista ----------
// Spelare på den här datorn + vänner man laddat upp en sparad progressfil från
const Friends = {
  KEY: 'larospel-compare',
  all() { try { const a = JSON.parse(localStorage.getItem(this.KEY)); if (Array.isArray(a)) return a; } catch {} return []; },
  save(a) { try { localStorage.setItem(this.KEY, JSON.stringify(a)); } catch {} },
};
function renderBoard(box, period) {
  const me = Profiles.active();
  const rows = [
    ...Profiles.list().map(p => ({ p, d: p.id === me.id ? Store.load() : readProfileData(p.id), me: p.id === me.id })).filter(x => x.d),
    ...Friends.all().map(f => ({ p: f, d: f.data, friend: true })),
  ].map(x => ({ ...x, s: playerSummary(x.d, period) }));
  const sortKey = Store.getSetting('gsort') || 'period';
  rows.sort((a, b) => sortKey === 'period' ? b.s.pxp - a.s.pxp || b.s.xp - a.s.xp : b.s.xp - a.s.xp);
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
  box.innerHTML = `
    <div class="modes gsort"><button data-s="period" class="${sortKey === 'period' ? 'active' : ''}">Mest XP – ${PERIODS[period].toLowerCase()}</button><button data-s="total" class="${sortKey === 'total' ? 'active' : ''}">Högst nivå totalt</button></div>
    <table class="gboard"><thead><tr><th></th><th>Spelare</th><th>Nivå</th><th>XP ${period === 'allt' ? '' : PERIODS[period].toLowerCase()}</th><th>Lärda</th><th>🔥</th><th>Kan nu</th><th>Starkast i</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${medal(i)}</td>
      <td>${r.p.emoji} ${esc(r.p.name)}${r.me ? ' <span class="small">(du)</span>' : ''}${r.friend ? ` <span class="small" title="Från uppladdad fil ${new Date(r.p.at).toLocaleDateString('sv-SE')}">📄</span> <button class="link" data-unfriend="${esc(r.p.id)}" title="Ta bort från jämförelsen">✕</button>` : ''}</td>
      <td>${r.s.L.lvl} <span class="small">${r.s.L.title.split(' ')[0]}</span></td><td><strong>${r.s.pxp.toLocaleString('sv-SE')}</strong></td>
      <td>${r.s.learned}</td><td>${r.s.streak}</td><td>${r.s.known}</td><td>${r.s.best ? `${r.s.best[0].icon} ${esc(r.s.best[0].name)}` : '–'}</td></tr>`).join('')}</tbody></table>
    ${rows.length < 2 ? '<p class="small">Du är ensam på topplistan än så länge. Skapa fler spelare på den här datorn – eller jämför med en vän:</p>' : ''}
    <p class="small">Vännen sparar sin progress under 📊 Resultat → <em>Spara ner</em> och skickar filen till dig. Vännens progress ändras inte – den syns bara här.</p>
    <button class="btn secondary" id="addfriend">📄 Jämför med en vän (ladda upp deras fil)</button>`;
  box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { Store.setSetting('gsort', b.dataset.s); renderBoard(box, period); });
  box.querySelectorAll('[data-unfriend]').forEach(b => b.onclick = () => { Friends.save(Friends.all().filter(f => f.id !== b.dataset.unfriend)); renderBoard(box, period); });
  box.querySelector('#addfriend').onclick = () => {
    const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let d; try { d = JSON.parse(r.result); } catch { d = null; }
        if (!d || d.version !== 1 || !d.profile) return showInfo('Fel sorts fil', '<p>Det här ser inte ut som en sparad Lärospel-progress.</p>');
        const name = String(d.profile.name || 'Vän').replace(/[<>"]/g, '').slice(0, 30), emoji = String(d.profile.emoji || '🙂').slice(0, 8);
        const list = Friends.all().filter(x => !(x.name === name && x.emoji === emoji));   // samma vän igen = uppdatera
        list.push({ id: 'f' + Date.now().toString(36), name, emoji, at: new Date().toISOString(),
          data: { version: 1, known: d.known || {}, math: d.math || {}, stats: d.stats || {}, log: d.log || {}, xpBase: d.xpBase, attempts: (d.attempts || []).map(a => ({ at: a.at })) } });
        Friends.save(list);
        renderBoard(box, period);
      };
      r.readAsText(f);
    };
    inp.click();
  };
}
