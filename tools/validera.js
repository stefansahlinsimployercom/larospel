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

// ---------- Ordlistor (språk) ----------
const sprak = T('sprak'), LANGS = Object.keys(sprak.languages);
let words = 0;
const catIds = sprak.categories.map(c => c.id).filter((id, i, a) => a.indexOf(id) !== i);
if (catIds.length) err('språk', `dubbla kategori-id:n: ${catIds.join(', ')}`);
sprak.categories.forEach(c => {
  const where = `språk:${c.id}`;
  if (!c.name || !c.icon || !c.words || !c.words.length) return err(where, 'saknar namn, ikon eller ord');
  c.words.forEach(w => {
    words++;
    LANGS.forEach(l => { if (!w[l] || !String(w[l]).trim()) err(where, `"${w.sv}" saknas på ${sprak.languages[l]}`); });
    if (w.zh && !String(w.zh).split('/').every(x => /^[^|\s]+\|[^|]+$/.test(x))) err(where, `"${w.sv}": kinesiska ska skrivas tecken|pinyin (${w.zh})`);
  });
  // Samma ord två gånger på ett språk = två likadana frågor i quizet
  LANGS.forEach(l => {
    const first = c.words.map(w => String(w[l] || '').split('/')[0].trim().toLowerCase());
    const d = first.filter((x, i) => x && first.indexOf(x) !== i);
    if (d.length) err(where, `samma ord två gånger på ${sprak.languages[l]}: ${[...new Set(d)].join(', ')}`);
  });
});

// ---------- Historia ----------
const evNames = events.map(e => e.e), evDup = evNames.filter((x, i) => evNames.indexOf(x) !== i);
if (evDup.length) err('historia', `samma händelse finns två gånger: ${[...new Set(evDup)].join(', ')}`);
T('historia').categories.forEach(c => {
  if (!c.id || !c.name || !c.icon || !c.events || c.events.length < 3) err(`historia:${c.id}`, 'saknar id, namn, ikon eller minst tre händelser');
  (c.events || []).forEach(e => { if (!e.e || !Number.isInteger(e.y) || e.y < -5000 || e.y > 2100) err(`historia:${c.id}`, `"${e.e}": årtalet ${e.y} är inte ett rimligt heltal (f.Kr. = negativt)`); });
});

// ---------- Geografi ----------
const plNames = places.map(p => p.n), plDup = plNames.filter((x, i) => plNames.indexOf(x) !== i);
if (plDup.length) err('geografi', `samma plats finns två gånger: ${[...new Set(plDup)].join(', ')}`);
T('geografi').categories.forEach(c => (c.places || []).forEach(p => {
  if (!(Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)) err(`geografi:${c.id}`, `"${p.n}": ogiltiga koordinater (lat ${p.lat}, lon ${p.lon})`);
  if (!(p.r > 0)) err(`geografi:${c.id}`, `"${p.n}": saknar utbredning r (km)`);
}));

// ---------- Zoologi (sorteringar) ----------
TRACKS.filter(t => t.type === 'sort').forEach(t => t.sets.forEach(s => {
  const where = `${t.id}:${s.id}`, bIds = s.baskets.map(b => b.id);
  if (s.baskets.length < 2 || s.baskets.length > 6) err(where, 'ska ha 2–6 korgar');
  if (new Set(bIds).size !== bIds.length) err(where, 'två korgar har samma id');
  const names = s.items.map(i => i.n), d = names.filter((x, i) => names.indexOf(x) !== i);
  if (d.length) err(where, `samma kort två gånger: ${[...new Set(d)].join(', ')}`);
  s.items.forEach(i => { if (!bIds.includes(i.b)) err(where, `"${i.n}": korgen ${i.b} finns inte`); if (!i.why) err(where, `"${i.n}": saknar förklaring (why)`); });
}));

// ---------- Recept ----------
TRACKS.filter(t => t.type === 'recipe').forEach(t => {
  const ids = t.recipes.map(r => r.id);
  if (new Set(ids).size !== ids.length) err(t.id, 'två recept har samma id');
  t.recipes.forEach(r => {
    const where = `recept:${r.id}`;
    if (!r.name || !r.icon || !r.desc) err(where, 'saknar namn, ikon eller beskrivning');
    if (!(r.ingredients || []).length || r.ingredients.length < 2) err(where, 'behöver minst två ingredienser');
    if (!(r.decoys || []).length) err(where, 'behöver minst en ingrediens som inte ska med (decoys)');
    (r.decoys || []).forEach(x => { if (!x.why) err(where, `decoy "${x.n}" saknar why`); if (r.ingredients.some(i => i.n === x.n)) err(where, `"${x.n}" är både ingrediens och decoy`); });
    if (!(r.steps || []).length || r.steps.length < 2 || r.steps.some(s => !s.t || !Number.isInteger(s.o))) err(where, 'steps: minst två steg, var och ett med t och heltalet o');
    (r.wrongSteps || []).forEach(s => { if (!s.why) err(where, `fel steg "${s.t}" saknar why`); });
    if (!(r.values || []).length) err(where, 'behöver minst ett värde (values)');
    (r.values || []).forEach(v => { if (!v.opts || !v.opts.includes(v.a)) err(where, `värdet "${v.q}": rätt svar finns inte bland alternativen`); });
    if (!r.done || !r.done.opts || !r.done.opts.includes(r.done.a) || !r.done.why) err(where, 'done: rätt svar måste finnas bland alternativen, och why behövs');
    (r.faults || []).forEach(f => {
      if (!f.sym || !f.cause || !f.why || !f.fix || !(f.wrong || []).length) err(where, `felet "${f.sym}" saknar sym, cause, wrong, why eller fix`);
      else if (f.wrong.includes(f.cause)) err(where, `felet "${f.sym}": rätt orsak finns också bland fel orsaker`);
    });
  });
});

// ---------- Matte och fysik: steg och uppgiftsgeneratorer ----------
const allIds = nodes.map(n => n.id), nDup = allIds.filter((x, i) => allIds.indexOf(x) !== i);
if (nDup.length) err('träd', `samma steg-id två gånger: ${[...new Set(nDup)].join(', ')}`);
let genTasks = 0;
TRACKS.filter(t => t.type === 'tree').forEach(t => t.branches.forEach(b => b.nodes.forEach(n => {
  const where = `${t.id}:${n.id}`;
  (n.req || []).forEach(q => { if (!allIds.includes(q)) err(where, `kräver steget ${q}, som inte finns`); });
  if (n.soon) return;
  if (!n.gen) return err(where, 'saknar generator (gen) – eller markera soon: true');
  if (!n.desc) err(where, 'saknar beskrivning (desc)');
  for (let k = 0; k < 300; k++) {
    let x;
    try { x = n.gen(); } catch (e) { return err(where, `generatorn kraschar: ${e.message}`); }
    genTasks++;
    const a = x && x.answer;
    if (typeof a !== 'number' || !isFinite(a)) return err(where, `ogiltigt svar ${a} (t.ex. ${JSON.stringify(x && x.text)})`);
    if (!x.text && !x.eq && !x.geo && !x.phys) return err(where, 'uppgiften saknar text');
    if (!x.tol && !x.geo && !x.phys && Math.abs(a * 100 - Math.round(a * 100)) > 1e-6) return err(where, `svaret ${a} har fler än två decimaler – ange tol eller välj andra tal (${x.text})`);
  }
})));

// ---------- Generatorerna ----------
const yearOf = n => events.find(e => e.e === n).y;
let genClaims = 0, genEst = 0;
const safeGen = (f, n) => { try { return f(n); } catch (e) { err("generatorerna", `kraschar: ${e.message} (troligen ett fel i datan ovan)`); return []; } };
for (let k = 0; k < 30; k++) safeGen(W.genBluffClaims, 20).forEach(c => {
  genClaims++;
  checkClaim(c, `generator:${c.id}`);
  if (c.id.startsWith('gen:tid:')) {                     // räkna om: stämmer "före"-påståendet med årtalen?
    const [a, b] = c.refs.map(r => r.n), [first, second] = c.parts.map(p => p.replace(/[”.]/g, '').trim()).filter((_, i) => i !== 1);
    const truth = yearOf(first) < yearOf(second);
    if (truth !== (c.bad === null)) err(`generator:${c.id}`, 'sanningsvärdet stämmer inte med årtalen');
  }
});
for (let k = 0; k < 30; k++) safeGen(W.genEstimates, 8).forEach(q => {
  genEst++;
  checkEstimate(q, `generator:${q.id}`);
  const [a, b] = q.refs.map(r => yearOf(r.n));
  if (Math.abs(b - a) !== q.answer) err(`generator:${q.id}`, `fel svar ${q.answer} (rätt: ${Math.abs(b - a)})`);
});

// ---------- Rapport ----------
const aiC = claims.filter(c => c.ai).length, aiQ = T('uppskatta').questions.filter(q => q.ai).length;
console.log(`Kontrollerat: ${claims.length} påståenden (${aiC} AI-skapade), ${T('uppskatta').questions.length} uppskattningar (${aiQ} AI-skapade), `
  + `${sprak.categories.length} ordlistor (${words} ord), ${(W.CROSS_LINKS || []).length} kopplingar, ${(W.PROBLEM_TYPES || []).length} problemtyper, `
  + `${events.length} historiska händelser, ${places.length} platser, ${T('matlagning').recipes.length} recept, ${nodes.filter(n => !n.soon).length} matte/fysik-steg (${genTasks} uppgifter), `
  + `${genClaims} genererade påståenden och ${genEst} genererade uppskattningar.`);
if (errors.length) { console.log(`\n${errors.length} fel:`); [...new Set(errors)].forEach(e => console.log(e)); process.exit(1); }
console.log('✅ Inga fel hittades.');
