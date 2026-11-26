// Kopplingar mellan ämnen (data i quizzes/kopplingar.js):
//   crossLinksHtml(ref) – avsnitt i ⓘ-rutor: "🌐 Kopplingar till andra ämnen"
//   showCrossMap()      – nätverk med en kolumn per ämne och linjer mellan saker som hör ihop
//   playCross()         – spelet "Koppla ihop ämnen"
// Använder bluffRef (bluff.js), Store, KNOWN_AT, esc, shuffle, showInfo, stopTimer.

const refKey = r => (r.t === 'zoo' ? `zoo:${r.set}:${r.n}` : r.t === 'node' ? `node:${r.id}` : `${r.t}:${r.n}`);
const crossKey = l => `${refKey(l.a)}|${refKey(l.b)}`;
const CROSS_SUBJ = { hist: '🏛️ Historia', geo: '🗺️ Geografi', zoo: '🦁 Zoologi', node: '⚛️ Fysik' };
const crossLinks = () => window.CROSS_LINKS || [];
// Kort namn utan ledtrådar (t.ex. djur utan världsdel – annars avslöjas svaret)
function crossLabel(r) {
  if (r.t === 'zoo') { const it = TRACKS.find(t => t.id === 'zoologi').sets.find(x => x.id === r.set)?.items.find(i => i.n === r.n); return `${it && it.e ? it.e + ' ' : ''}${r.n}`; }
  return bluffRef(r).label;
}
function crossFor(ref) {
  const k = refKey(ref);
  return crossLinks().filter(l => refKey(l.a) === k || refKey(l.b) === k).map(l => ({ l, other: refKey(l.a) === k ? l.b : l.a }));
}
function crossLinksHtml(ref) {
  const list = crossFor(ref);
  if (!list.length) return '';
  return `<h4>🌐 Kopplingar till andra ämnen</h4><ul>${list.map(({ l, other }) => {
    const o = bluffRef(other);
    return `<li>${o.ok ? '✅ ' : ''}<strong>${esc(o.label)}</strong> <span class="small">${esc(o.where)}</span><br><span class="small">${esc(l.why)}</span></li>`;
  }).join('')}</ul>`;
}

// ---------- Kopplingskarta ----------
function showCrossMap(onBack = showKnowledgeMap) {
  stopTimer();
  const cols = Object.keys(CROSS_SUBJ).filter(t => crossLinks().some(l => l.a.t === t || l.b.t === t));
  const nodes = new Map(); // refKey → { ref, col, info }
  crossLinks().forEach(l => [l.a, l.b].forEach(r => { if (!nodes.has(refKey(r))) nodes.set(refKey(r), { ref: r, col: cols.indexOf(r.t), info: bluffRef(r), short: crossLabel(r) }); }));
  const W = 1000, colW = W / cols.length, ROW = 30, TOP = 56;
  const byCol = cols.map((_, c) => [...nodes.values()].filter(n => n.col === c).sort((a, b) => a.short.localeCompare(b.short, 'sv')));
  const H = TOP + Math.max(...byCol.map(c => c.length)) * ROW + 20;
  byCol.forEach((list, c) => list.forEach((n, k) => { n.x = colW * c + colW / 2; n.y = TOP + k * ROW + ROW / 2; }));
  const curve = (p, q) => { const mx = (p.x + q.x) / 2; return `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`; };
  const lines = crossLinks().map((l, i) => {
    const p = nodes.get(refKey(l.a)), q = nodes.get(refKey(l.b));
    const known = (Store.known('kopplingar')[crossKey(l)] || 0) >= KNOWN_AT;
    return `<path d="${curve(p, q)}" class="xline ${known ? 'known' : ''}" data-i="${i}"><title>${esc(l.why)}</title></path>`;
  }).join('');
  const heads = cols.map((t, c) => `<text x="${colW * c + colW / 2}" y="26" class="xhead">${CROSS_SUBJ[t]}</text>`).join('');
  const dots = [...nodes.entries()].map(([k, n]) => `<g class="xnode ${n.info.ok ? 'ok' : ''}" data-k="${esc(k)}">
      <rect x="${n.x - 92}" y="${n.y - 11}" width="184" height="22" rx="11"/><text x="${n.x}" y="${n.y + 4}">${esc(n.short.length > 26 ? n.short.slice(0, 25) + '…' : n.short)}</text>
      <title>${esc(n.info.label)}</title></g>`).join('');
  const known = crossLinks().filter(l => (Store.known('kopplingar')[crossKey(l)] || 0) >= KNOWN_AT).length;
  app.innerHTML = `
    <button class="back">← Kunskapskartan</button>
    <h2>🌐 Kopplingar mellan ämnen</h2>
    <p class="legend">Saker du lärt dig i olika ämnen som hör ihop – ${crossLinks().length} kopplingar. <strong>Ifyllda</strong> rutor kan du redan i sitt eget ämne,
      <strong>gröna linjer</strong> är kopplingar du klarat i spelet. Klicka på en ruta för att se hur den hänger ihop.</p>
    <p><button class="btn" id="xplay">🔗 Koppla ihop ämnen (${known}/${crossLinks().length})</button></p>
    <div class="xmap"><svg viewBox="0 0 ${W} ${H}">${heads}${lines}${dots}</svg></div>`;
  app.querySelector('.back').onclick = onBack;
  app.querySelector('#xplay').onclick = () => playCross(() => showCrossMap(onBack));
  app.querySelector('.xmap').addEventListener('click', e => {
    const g = e.target.closest('.xnode'); if (!g) return;
    const n = nodes.get(g.dataset.k);
    showInfo(n.info.label, `<p class="small">${esc(n.info.where)}${n.info.ok ? ' · ✅ det här kan du' : ''}</p>${n.info.info || ''}${crossLinksHtml(n.ref)}`);
  });
  // Markera en rutas kopplingar när man pekar på den
  app.querySelectorAll('.xnode').forEach(g => {
    const k = g.dataset.k;
    g.addEventListener('mouseenter', () => app.querySelectorAll('.xline').forEach(p => {
      const l = crossLinks()[+p.dataset.i]; p.classList.toggle('hl', refKey(l.a) === k || refKey(l.b) === k);
    }));
    g.addEventListener('mouseleave', () => app.querySelectorAll('.xline').forEach(p => p.classList.remove('hl')));
  });
}

// ---------- Spelet: Koppla ihop ämnen ----------
function playCross(onBack) {
  stopTimer();
  const m = Store.known('kopplingar');
  const round = shuffle(crossLinks()).sort((a, b) => ((m[crossKey(a)] || 0) >= KNOWN_AT) - ((m[crossKey(b)] || 0) >= KNOWN_AT)).slice(0, 8);
  const results = [];
  let i = 0;
  app.innerHTML = `
    <button class="back">← Kopplingar</button>
    <h2>🔗 Koppla ihop ämnen</h2>
    <div class="dots" id="dots"></div><div id="stage"></div><div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const dots = () => app.querySelector('#dots').innerHTML = round.map((_, k) =>
    `<span class="fdot ${k < results.length ? (results[k] ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></span>`).join('');
  function show() {
    const l = round[i];
    const flip = Math.random() < 0.5, given = flip ? l.b : l.a, answer = flip ? l.a : l.b;
    const gi = bluffRef(given);
    // Alternativ av samma sort som svaret (t.ex. bara platser), så att man inte kan gissa på typen
    const pool = [...new Map(crossLinks().flatMap(x => [x.a, x.b]).filter(r => r.t === answer.t && refKey(r) !== refKey(answer)
      && !crossFor(given).some(c => refKey(c.other) === refKey(r))).map(r => [refKey(r), r])).values()];
    const opts = shuffle([answer, ...shuffle(pool).slice(0, 3)]);
    let wrong = 0;
    dots();
    app.querySelector('#msg').innerHTML = '';
    const stage = app.querySelector('#stage');
    stage.innerHTML = `
      <div class="symptom"><span class="semo">${CROSS_SUBJ[given.t].split(' ')[0]}</span>
        <div><div class="slabel">${esc(gi.where)}</div><div class="stext">${esc(crossLabel(given))}</div></div></div>
      <h3>Vad i ${esc(CROSS_SUBJ[answer.t].split(' ').slice(1).join(' ').toLowerCase())} hänger det ihop med?</h3>
      <div class="vopts col">${opts.map((o, k) => `<button class="vopt" data-k="${k}">${esc(crossLabel(o))}</button>`).join('')}</div>`;
    stage.onclick = e => {
      const b = e.target.closest('.vopt'); if (!b || b.disabled) return;
      if (refKey(opts[+b.dataset.k]) !== refKey(answer)) { wrong++; b.classList.add('bad'); b.disabled = true; if (wrong < 2) return; }
      stage.querySelectorAll('.vopt').forEach(x => { x.disabled = true; if (refKey(opts[+x.dataset.k]) === refKey(answer)) x.classList.add('ok'); });
      const ok = wrong === 0;
      results.push(ok); dots();
      app.querySelector('#msg').innerHTML = `<div class="rnote ${ok ? 'ok' : ''}"><strong>${ok ? '✅ Rätt!' : 'Kopplingen:'}</strong>
        ${esc(crossLabel(l.a))} ↔ ${esc(crossLabel(l.b))}<br>${esc(l.why)}
        <br><button class="btn" id="nextx">${i + 1 < round.length ? 'Nästa →' : 'Se resultatet →'}</button></div>`;
      const nb = app.querySelector('#nextx');
      nb.onclick = () => { i++; i < round.length ? show() : finish(); };
      nb.focus();
    };
  }
  function finish() {
    const score = results.filter(Boolean).length;
    const fresh = Store.updateWords('kopplingar', round.map((l, k) => ({ key: crossKey(l), ok: results[k] })));
    Store.addAttempt({ quiz: 'kopplingar', title: '🔗 Koppla ihop ämnen', at: new Date().toISOString(), score, total: round.length, secs: 0,
      missed: round.filter((_, k) => !results[k]).map(l => ({ q: bluffRef(l.a).label, a: bluffRef(l.b).label })) });
    dots();
    app.querySelector('#stage').innerHTML = `<div class="result"><strong>${score === round.length ? '🎉 Alla kopplingar rätt!' : 'Klart!'}</strong> ${score} av ${round.length} rätt på första försöket.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny koppling' : fresh + ' nya kopplingar'} som du nu kan!` : ''}
      <br><button class="btn" id="again">Kör igen</button> <button class="btn secondary" id="tomap">🌐 Se kopplingskartan</button></div>`;
    app.querySelector('#msg').innerHTML = '';
    app.querySelector('#again').onclick = () => playCross(onBack);
    app.querySelector('#tomap').onclick = onBack;
  }
  show();
}
