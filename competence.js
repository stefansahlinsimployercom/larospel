// Kompetensmått: vilka verkliga problemtyper kan spelaren lösa, utifrån kunskaper visade i spelets olika ämnen?
//   behärskning per kunskap (0–1) → en problemtyp är löst när ALLA kunskaper den kräver finns (svagaste länken)
//   gränsen = problemtyper där exakt en kunskap saknas
//   nästa bästa = den kunskap som låser upp flest nya problemtyper
// Det är en förutsägelse – den testas i Uppskattningar och Bluffkollen.
// Använder bluffRef, refKey (crosslinks.js), kmState, mathState, MATH_GOAL, allNodes, findEvent, esc, showInfo, showTrack.

const HAVE = 0.75; // behärskning som räknas som "har kunskapen"

function mastery(r) {
  if (r.t === 'node') { const s = mathState(r.id); return s.done ? 1 : Math.min(0.6, (s.streak || 0) / MATH_GOAL); }
  const val = { known: 1, due: 0.75, half: 0.4, none: 0 };
  if (r.t === 'hist') { const x = findEvent(r.n); if (!x) return 0; const k = `${x.cat.id}/${x.ev.e}`; return Math.max(val[kmState('historia/fritext', k)], val[kmState('historia/tidslinje', k)]); }
  if (r.t === 'geo') {
    const cat = TRACKS.find(t => t.id === 'geografi').categories.find(c => c.places.some(p => p.n === r.n));
    return cat ? Math.max(...['allm', 'kunnig', 'expert'].map(l => val[kmState(`geografi/${l}`, `${cat.id}/${r.n}`)])) : 0;
  }
  if (r.t === 'zoo') return val[kmState(`zoologi/${r.set}`, r.n)];
  return 0;
}
// Vilket ämne övar man kunskapen i?
function trackForRef(r) {
  if (r.t === 'node') return TRACKS.filter(t => t.type === 'tree').find(t => allNodes(t).some(n => n.id === r.id));
  return TRACKS.find(t => t.id === { hist: 'historia', geo: 'geografi', zoo: 'zoologi' }[r.t]);
}

function competence() {
  const probs = (window.PROBLEM_TYPES || []).map(p => {
    const needs = p.needs.map(r => ({ r, key: refKey(r), m: mastery(r), info: bluffRef(r) }));
    const missing = needs.filter(n => n.m < HAVE);
    const status = !missing.length ? 'ok' : missing.length === 1 ? 'near' : 'no';
    return { ...p, needs, missing, status, score: Math.min(...needs.map(n => n.m)) };
  });
  // Nästa bästa: för varje saknad kunskap – hur många problem blir lösta om just den kom på plats?
  const skills = new Map();
  probs.forEach(p => p.needs.forEach(n => {
    if (n.m >= HAVE) return;
    const s = skills.get(n.key) || { ...n, unlocks: [], opens: [] };
    s.opens.push(p);
    if (p.missing.length === 1) s.unlocks.push(p);
    skills.set(n.key, s);
  }));
  const next = [...skills.values()].sort((a, b) => b.unlocks.length - a.unlocks.length || b.opens.length - a.opens.length).slice(0, 3);
  const solved = probs.filter(p => p.status === 'ok').length;
  return { probs, next, solved, total: probs.length, pct: probs.length ? Math.round(100 * solved / probs.length) : 0 };
}

function showCompetence(onBack = showKnowledgeMap) {
  stopTimer();
  const C = competence(), A = window.PROBLEM_AREAS;
  const ST = { ok: '✅ Kan lösa', near: '🔜 Ett steg kvar', no: '◻ Inte än' };
  const chip = (n, p) => `<span class="nchip ${n.m >= HAVE ? 'have' : p.status === 'near' ? 'gap' : ''}" data-key="${esc(n.key)}" title="${esc(n.info.where)}">${n.m >= HAVE ? '✅' : '◻'} ${esc(n.info.label)}</span>`;
  app.innerHTML = `
    <button class="back">← Kunskapskartan</button>
    <div id="compwrap"><h2>🧩 Vad kan jag lösa?</h2>
    <div class="kmhead">
      <div class="kmring big" style="--p:${C.pct}"><span>${C.pct}%</span></div>
      <div><strong>Du kan lösa ${C.solved} av ${C.total} typer av verkliga problem</strong> – utifrån det du visat att du kan i spelets olika ämnen.
        <br><span class="small">🔜 ${C.probs.filter(p => p.status === 'near').length} är bara ett steg bort. Det här är en <em>förutsägelse</em> – testa den i 🎯 Uppskattningar och 🕵️ Bluffkollen.</span></div>
    </div>
    ${C.next.length ? `<h3>🚀 Nästa bästa sak att lära dig</h3><div class="nextskills">${C.next.map((s, k) => `
      <div class="nskill" data-key="${esc(s.key)}">
        <div><strong>${esc(s.info.label)}</strong> <span class="small">${esc(s.info.where)}</span></div>
        <div class="small">${s.unlocks.length ? `🔓 Låser upp <strong>${s.unlocks.length}</strong> ny${s.unlocks.length === 1 ? '' : 'a'}: ${s.unlocks.map(p => esc(p.name)).join(' · ')}` : `Ett steg på vägen mot ${s.opens.length} problemtyper`}</div>
        <button class="btn small-btn" data-go="${k}">Öva →</button>
      </div>`).join('')}</div>` : '<p>🎉 Du har allt som behövs för alla problemtyper!</p>'}
    <p class="small">Klicka på en kunskap för att se vilka problem den öppnar – även i andra områden.</p>
    ${Object.entries(A).map(([id, a]) => {
      const list = C.probs.filter(p => p.area === id);
      if (!list.length) return '';
      const ok = list.filter(p => p.status === 'ok').length;
      return `<h3>${a.icon} ${esc(a.name)} <span class="small">${ok}/${list.length}</span></h3><div class="probs">${list.map(p => `
        <div class="prob ${p.status}" data-id="${p.id}">
          <div class="pst">${ST[p.status]}</div>
          <div class="pname">${esc(p.name)}</div>
          <div class="small">💬 ${esc(p.example)}</div>
          <div class="pneeds">${p.needs.map(n => chip(n, p)).join('')}</div>
        </div>`).join('')}</div>`;
    }).join('')}</div>`;
  app.querySelector('.back').onclick = onBack;
  // Framåtblick: markera alla problem som kräver en viss kunskap
  const highlight = key => app.querySelectorAll('.prob').forEach(el => {
    const p = C.probs.find(x => x.id === el.dataset.id);
    el.classList.toggle('lit', !!key && p.needs.some(n => n.key === key));
    el.classList.toggle('dim', !!key && !p.needs.some(n => n.key === key));
  });
  let lit = null;
  app.querySelector('#compwrap').addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { const s = C.next[+go.dataset.go], t = trackForRef(s.r); if (t) showTrack(t); return; }
    const c = e.target.closest('.nchip, .nskill');
    if (!c) { if (lit) { lit = null; highlight(null); } return; }
    lit = lit === c.dataset.key ? null : c.dataset.key;
    highlight(lit);
  });
}

function competenceEntryHtml() {
  const C = competence();
  return `<button class="btn secondary" id="kmcomp">🧩 Vad kan jag lösa? (${C.solved}/${C.total})</button>`;
}
