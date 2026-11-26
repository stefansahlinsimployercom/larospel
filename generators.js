// Generatorer: nya frågor skapade direkt ur spelets kunskap (kunskapsgrafen).
// Svaren räknas fram ur datan, så frågorna är rätt per definition – och det finns i princip oändligt många.
// Fristående från motorerna (bara window.TRACKS), så att valideringsskriptet (tools/validera.js) kan köra dem.

(() => {
  const T = id => (window.TRACKS || []).find(t => t.id === id);
  const yr = y => (y < 0 ? `${-y} f.Kr.` : String(y));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const events = () => { const h = T('historia'); return h ? (h._base || h.categories).flatMap(c => c.events.map(ev => ({ ev, cat: c }))) : []; };

  // ---------- Bluffkollen ----------
  // Tidsordning: "X skedde före Y" (sant eller falskt utifrån årtalen)
  function genTimeClaim() {
    const E = events(); if (E.length < 2) return null;
    let a = pick(E), b = pick(E), guard = 0;
    while ((a === b || Math.abs(a.ev.y - b.ev.y) < 10) && guard++ < 50) b = pick(E);
    if (a === b) return null;
    const [early, late] = a.ev.y < b.ev.y ? [a, b] : [b, a];
    const truth = Math.random() < 0.4;
    const [first, second] = truth ? [early, late] : [late, early];
    return {
      id: `gen:tid:${first.ev.e}|${second.ev.e}`, gen: true,
      parts: [`”${first.ev.e}”`, ' skedde före ', `”${second.ev.e}”.`], bad: truth ? null : 1, types: truth ? [] : ['tid'],
      why: `${early.ev.e}: ${yr(early.ev.y)}. ${late.ev.e}: ${yr(late.ev.y)}. ${truth ? 'Ordningen stämmer.' : 'Det var alltså tvärtom.'}`,
      refs: [{ t: 'hist', n: early.ev.e }, { t: 'hist', n: late.ev.e }],
    };
  }
  // Djur och världsdel: "X lever vilt i Y"
  function genZooPlaceClaim() {
    const s = T('zoologi') && T('zoologi').sets.find(x => x.id === 'varld'); if (!s) return null;
    const it = pick(s.items), right = s.baskets.find(b => b.id === it.b);
    const truth = Math.random() < 0.4;
    const shown = truth ? right : pick(s.baskets.filter(b => b.id !== it.b));
    return {
      id: `gen:plats:${it.n}|${shown.id}`, gen: true,
      parts: [`${it.n}`, ` lever vilt i ${shown.name}.`], bad: truth ? null : 1, types: truth ? [] : ['fakta'],
      why: `${it.why}${truth ? '' : ` (${it.n} hör hemma i ${right.name}.)`}`,
      refs: [{ t: 'zoo', set: 'varld', n: it.n }],
    };
  }
  // Djur och djurgrupp: "X hör till gruppen Y"
  function genZooGroupClaim() {
    const s = T('zoologi') && T('zoologi').sets.find(x => x.id === 'grupper'); if (!s) return null;
    const it = pick(s.items), right = s.baskets.find(b => b.id === it.b);
    const truth = Math.random() < 0.4;
    const shown = truth ? right : pick(s.baskets.filter(b => b.id !== it.b));
    return {
      id: `gen:grupp:${it.n}|${shown.id}`, gen: true,
      parts: [`${it.n}`, ` hör till gruppen ${shown.name.toLowerCase()}.`], bad: truth ? null : 1, types: truth ? [] : ['fakta'],
      why: it.why, refs: [{ t: 'zoo', set: 'grupper', n: it.n }],
    };
  }
  window.genBluffClaims = n => {
    const out = new Map(), makers = [genTimeClaim, genZooPlaceClaim, genZooGroupClaim];
    for (let k = 0; out.size < n && k < n * 6; k++) { const c = pick(makers)(); if (c && !out.has(c.id)) out.set(c.id, c); }
    return [...out.values()];
  };

  // ---------- Uppskattningar ----------
  // "Hur många år gick det mellan X och Y?"
  function genYearsBetween() {
    const E = events(); if (E.length < 2) return null;
    let a = pick(E), b = pick(E), guard = 0;
    while ((a === b || Math.abs(a.ev.y - b.ev.y) < 20) && guard++ < 50) b = pick(E);
    if (a === b) return null;
    const [early, late] = a.ev.y < b.ev.y ? [a, b] : [b, a];
    const diff = late.ev.y - early.ev.y;
    return {
      id: `gen:ar:${early.ev.e}|${late.ev.e}`, gen: true,
      q: `Hur många år gick det mellan ”${early.ev.e}” och ”${late.ev.e}”?`, unit: 'år', answer: diff,
      steps: [`${early.ev.e}: ${yr(early.ev.y)}`, `${late.ev.e}: ${yr(late.ev.y)}`,
        early.ev.y < 0 && late.ev.y > 0 ? `Före och efter Kristus läggs ihop: ${-early.ev.y} + ${late.ev.y} = ${diff} år` : `${late.ev.y} − ${early.ev.y} = ${diff} år`],
      refs: [{ t: 'hist', n: early.ev.e }, { t: 'hist', n: late.ev.e }],
    };
  }
  window.genEstimates = n => {
    const out = new Map();
    for (let k = 0; out.size < n && k < n * 6; k++) { const q = genYearsBetween(); if (q && !out.has(q.id)) out.set(q.id, q); }
    return [...out.values()];
  };
})();
