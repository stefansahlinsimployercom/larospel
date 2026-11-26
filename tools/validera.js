// Valideringsskript för Lärospels innehåll – körs med:  node tools/validera.js
// Läser in innehållet (quizzes/*.js + generators.js) precis som spelet och kontrollerar:
//   – att alla kunskapsreferenser (historia, geografi, zoologi, matte/fysik) finns
//   – Bluffkollen: delar, felindex, feltyper, förklaringar, unika id:n
//   – Uppskattningar: svar är rimliga tal, uträkning finns
//   – kopplingar mellan ämnen och problemtyper
//   – generatorerna: kör hundratals gånger och räknar om varje svar mot datan
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => f.startsWith('quizzes/') || f === 'generators.js');
const ctx = { window: {}, console, Math, Date };
ctx.window.window = ctx.window;
vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const W = ctx.window, TRACKS = W.TRACKS;
const T = id => TRACKS.find(t => t.id === id);

const errors = [], warn = [];
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`);

// ---------- Referenser ----------
const events = T('historia').categories.flatMap(c => c.events);
const places = T('geografi').categories.flatMap(c => c.places);
const nodes = TRACKS.filter(t => t.type === 'tree').flatMap(t => t.branches.flatMap(b => b.nodes));
function refOk(r) {
  if (r.t === 'hist') return events.some(e => e.e === r.n);
  if (r.t === 'geo') return places.some(p => p.n === r.n);
  if (r.t === 'zoo') { const s = T('zoologi').sets.find(x => x.id === r.set); return !!s && s.items.some(i => i.n === r.n); }
  if (r.t === 'node') return nodes.some(n => n.id === r.id && !n.soon);
  return false;
}
const refStr = r => (r.t === 'node' ? `node:${r.id}` : r.t === 'zoo' ? `zoo:${r.set}:${r.n}` : `${r.t}:${r.n}`);
function checkRefs(where, refs) {
  if (!refs || !refs.length) return err(where, 'saknar kunskapsreferenser');
  refs.forEach(r => { if (!refOk(r)) err(where, `referensen ${refStr(r)} finns inte i spelet`); });
}

// ---------- Bluffkollen ----------
const TYPES = ['fakta', 'tid', 'storlek', 'samband', 'enhet', 'jamforelse'];
function checkClaim(c, where = `bluff:${c.id}`) {
  if (!Array.isArray(c.parts) || c.parts.length < 2) err(where, 'behöver minst två delar');
  if (c.bad !== null && !(Number.isInteger(c.bad) && c.bad >= 0 && c.bad < c.parts.length)) err(where, `ogiltigt felindex ${c.bad}`);
  if (c.bad === null && c.types.length) err(where, 'sant påstående ska inte ha feltyper');
  if (c.bad !== null && !c.types.length) err(where, 'bluff saknar feltyp');
  c.types.forEach(t => { if (!TYPES.includes(t)) err(where, `okänd feltyp ${t}`); });
  if (!c.why || c.why.length < 10) err(where, 'saknar förklaring');
  checkRefs(where, c.refs);
}
const claims = T('bluff').claims;
claims.forEach(c => checkClaim(c));
const dupes = claims.map(c => c.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) err('bluff', `dubbla id:n: ${dupes.join(', ')}`);

// ---------- Uppskattningar ----------
function checkEstimate(q, where = `uppskatta:${q.id}`) {
  const a = typeof q.answer === 'function' ? q.answer() : q.answer;
  if (!(typeof a === 'number' && isFinite(a) && a > 0)) err(where, `ogiltigt svar ${a}`);
  if (!q.unit) err(where, 'saknar enhet');
  if (!q.steps || q.steps.length < 1) err(where, 'saknar uträkning');
  checkRefs(where, q.refs);
}
T('uppskatta').questions.forEach(q => checkEstimate(q));

// ---------- Kopplingar och problemtyper ----------
(W.CROSS_LINKS || []).forEach((l, i) => { checkRefs(`koppling ${i + 1}`, [l.a, l.b]); if (!l.why) err(`koppling ${i + 1}`, 'saknar förklaring'); });
(W.PROBLEM_TYPES || []).forEach(p => { checkRefs(`problemtyp:${p.id}`, p.needs); if (!W.PROBLEM_AREAS[p.area]) err(`problemtyp:${p.id}`, `okänt område ${p.area}`); });
(T('historia').links || []).forEach(l => { if (!events.some(e => e.e === l.a) || !events.some(e => e.e === l.b)) err(`historia-koppling ${l.a}→${l.b}`, 'händelse saknas'); });

// ---------- Generatorerna ----------
const yearOf = n => events.find(e => e.e === n).y;
let genClaims = 0, genEst = 0;
for (let k = 0; k < 30; k++) W.genBluffClaims(20).forEach(c => {
  genClaims++;
  checkClaim(c, `generator:${c.id}`);
  if (c.id.startsWith('gen:tid:')) {                     // räkna om: stämmer "före"-påståendet med årtalen?
    const [a, b] = c.refs.map(r => r.n), [first, second] = c.parts.map(p => p.replace(/[”.]/g, '').trim()).filter((_, i) => i !== 1);
    const truth = yearOf(first) < yearOf(second);
    if (truth !== (c.bad === null)) err(`generator:${c.id}`, 'sanningsvärdet stämmer inte med årtalen');
  }
});
for (let k = 0; k < 30; k++) W.genEstimates(8).forEach(q => {
  genEst++;
  checkEstimate(q, `generator:${q.id}`);
  const [a, b] = q.refs.map(r => yearOf(r.n));
  if (Math.abs(b - a) !== q.answer) err(`generator:${q.id}`, `fel svar ${q.answer} (rätt: ${Math.abs(b - a)})`);
});

// ---------- Rapport ----------
const aiC = claims.filter(c => c.ai).length, aiQ = T('uppskatta').questions.filter(q => q.ai).length;
console.log(`Kontrollerat: ${claims.length} påståenden (${aiC} AI-skapade), ${T('uppskatta').questions.length} uppskattningar (${aiQ} AI-skapade), `
  + `${(W.CROSS_LINKS || []).length} kopplingar, ${(W.PROBLEM_TYPES || []).length} problemtyper, `
  + `${genClaims} genererade påståenden och ${genEst} genererade uppskattningar.`);
if (errors.length) { console.log(`\n${errors.length} fel:`); [...new Set(errors)].forEach(e => console.log(e)); process.exit(1); }
console.log('✅ Inga fel hittades.');
