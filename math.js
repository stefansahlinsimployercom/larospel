// Mattespår: färdighetsträd, ekvationsmotor och två lägen
//   - steg:  steg för steg – dra operationskort till ekvationen
//   - snabb: snabbräkning mot klockan
// Använder Store, card, fmt, esc, stopTimer, timerId och shuffle från game.js/history.js.

const MATH_GOAL = 5; // rätt i rad för att klara en nod
const MATH_MODES = { steg: '🧩 Steg för steg', snabb: '⚡ Snabbräkning', ord: '📖 Ordproblem' };

// ---------- Bråktal ----------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function F(n, d = 1) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; }
const Fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const Fmul = (a, b) => F(a.n * b.n, a.d * b.d);
const Fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
const Fneg = a => F(-a.n, a.d);
const Fzero = a => a.n === 0;
const Fone = a => a.n === 1 && a.d === 1;
const Fstr = a => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
const Fabs = a => F(Math.abs(a.n), a.d);

// ---------- Ekvationer ----------
// En sida = m·(ix·x + ik) + x·x + k
function side(s = {}) {
  const o = { m: F(s.m || 0), ix: F(s.ix || 0), ik: F(s.ik || 0), x: F(s.x || 0), k: F(s.k || 0) };
  return normSide(o);
}
function normSide(s) {
  if (Fone(s.m)) { s = expandSide(s); } // 1·(…) är ingen riktig parentes
  return s;
}
function expandSide(s) {
  return { m: F(0), ix: F(0), ik: F(0), x: Fadd(s.x, Fmul(s.m, s.ix)), k: Fadd(s.k, Fmul(s.m, s.ik)) };
}
const cloneEq = e => JSON.parse(JSON.stringify(e));

function termsStr(terms) {
  const t = terms.filter(([c]) => !Fzero(c));
  if (!t.length) return '0';
  return t.map(([c, body], i) => {
    const neg = c.n < 0;
    return (i ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')) + body(Fabs(c));
  }).join('');
}
const coefX = a => (Fone(a) ? 'x' : a.d === 1 ? `${a.n}x` : `(${Fstr(a)})x`);
const linStr = (x, k) => termsStr([[x, coefX], [k, Fstr]]);
function sideStr(s) {
  return termsStr([
    [s.m, a => `${Fone(a) ? '' : Fstr(a)}(${linStr(s.ix, s.ik)})`],
    [s.x, coefX],
    [s.k, Fstr],
  ]);
}
const eqStr = e => `${sideStr(e.L)} = ${sideStr(e.R)}`;

// Operationer: { t: 'add', v, x } (lägg till v eller v·x), { t: 'mul', v }, { t: 'div', v }, { t: 'expand' }
function opLabel(op) {
  const v = op.v && Fabs(op.v);
  if (op.t === 'add') return (op.v.n < 0 ? '−' : '+') + (op.x ? coefX(v) : Fstr(v));
  if (op.t === 'mul') return '× ' + Fstr(op.v);
  if (op.t === 'div') return '÷ ' + Fstr(op.v);
  return 'Multiplicera in parentesen';
}
const opLong = op => (op.t === 'expand' ? opLabel(op) : `${opLabel(op)} på båda sidor`);

function applySide(s, op) {
  s = { ...s };
  if (op.t === 'add') { if (op.x) s.x = Fadd(s.x, op.v); else s.k = Fadd(s.k, op.v); }
  if (op.t === 'mul' || op.t === 'div') {
    const f = op.t === 'mul' ? (a => Fmul(a, op.v)) : (a => Fdiv(a, op.v));
    s.m = f(s.m); s.x = f(s.x); s.k = f(s.k);
  }
  if (op.t === 'expand' && !Fzero(s.m)) s = expandSide(s);
  return normSide(s);
}
const applyOp = (e, op) => ({ L: applySide(e.L, op), R: applySide(e.R, op) });

const isX = s => Fzero(s.m) && Fone(s.x) && Fzero(s.k);
const isConst = s => Fzero(s.m) && Fzero(s.x);
function solvedValue(e) {
  if (isX(e.L) && isConst(e.R)) return e.R.k;
  if (isX(e.R) && isConst(e.L)) return e.L.k;
  return null;
}

// Lösaren: nästa bra drag från ett läge
function nextOp(e) {
  const { L, R } = e;
  if (solvedValue(e)) return null;
  if (!Fzero(L.m) && Fzero(L.x) && Fzero(L.k) && isConst(R)) return { t: 'div', v: L.m };
  if (!Fzero(L.m) || !Fzero(R.m)) return { t: 'expand' };
  if (!Fzero(R.x)) return { t: 'add', x: true, v: Fneg(R.x) };
  if (!Fzero(L.k)) return { t: 'add', v: Fneg(L.k) };
  if (!Fone(L.x)) return { t: 'div', v: L.x };
  return null;
}
function solution(e) {
  const steps = [];
  for (let i = 0; i < 10; i++) { const op = nextOp(e); if (!op) break; steps.push(op); e = applyOp(e, op); }
  return steps;
}
// Kortleken: lösningens drag + lockande felaktiga drag (fel tecken, granntal, ×/÷ förväxling).
const DECK_SIZE = 6;
function buildDeck(e) {
  const sol = solution(e);
  const deck = [...sol];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const near = v => F(v.n + (Math.random() < 0.5 ? 1 : -1) * v.d * rnd(1, 2), v.d);
  sol.forEach(op => {
    if (op.t === 'add') { deck.push({ ...op, v: Fneg(op.v) }); deck.push({ ...op, v: near(op.v) }); }
    if (op.t === 'div') { deck.push({ t: 'mul', v: op.v }); deck.push({ t: 'div', v: near(op.v) }); }
  });
  if (sol.some(op => op.t === 'div')) deck.push({ t: 'expand' }); // frestande även utan parentes
  const seen = new Set();
  const uniq = deck.filter(op => {
    if (op.v && (Fzero(op.v) || (op.t !== 'add' && (op.v.n <= 0 || Fone(op.v))))) return false;
    const l = opLabel(op); if (seen.has(l)) return false; seen.add(l); return true;
  });
  // Fyll på med slumpade drag tills leken är full
  for (let g = 0; uniq.length < DECK_SIZE && g < 50; g++) {
    const op = Math.random() < 0.7
      ? { t: 'add', v: F((Math.random() < 0.5 ? 1 : -1) * rnd(1, 12)) }
      : { t: Math.random() < 0.5 ? 'mul' : 'div', v: F(rnd(2, 6)) };
    const l = opLabel(op);
    if (!seen.has(l)) { seen.add(l); uniq.push(op); }
  }
  const keep = uniq.slice(0, Math.max(DECK_SIZE, sol.length));
  sol.forEach(op => { if (!keep.some(k => opLabel(k) === opLabel(op))) keep.push(op); });
  return shuffle(keep);
}

// ---------- Framsteg ----------
// Sparas i Store under data.math: { 'al3': { streak, done, ok, fail } }
function mathState(id) { return (Store.load().math || {})[id] || { streak: 0, done: false, ok: 0, fail: 0 }; }
// result: 'ok' (+1 i rad), 'fail' (nollställ), 'help' (räknas inte men nollställer inte)
function mathRecord(id, result) {
  const d = Store.load();
  d.math ||= {};
  const s = d.math[id] ||= { streak: 0, done: false, ok: 0, fail: 0 };
  let justDone = false;
  const xpBefore = typeof xpOf === 'function' ? xpOf(d) : 0;
  if (result === 'ok') { s.ok++; s.streak++; if (!s.done && s.streak >= MATH_GOAL) { s.done = true; justDone = true; s.doneAt = Store.now(); } }
  if (result === 'fail') { s.fail++; s.streak = 0; }
  if (result !== 'help') Store.logAdd(d, { a: 1, c: result === 'ok' ? 1 : 0, x: result === 'ok' ? 1 : 0 });
  if (justDone) Store.logAdd(d, { l: 1, x: 30 });
  Store.save(d);
  if (typeof gameAfterSave === 'function') gameAfterSave(xpBefore, d);
  return { state: s, justDone };
}
function allNodes(track) { return track.branches.flatMap(b => b.nodes); }
function nodeName(track, id) { return (allNodes(track).find(n => n.id === id) || {}).name || id; }
const reqMet = node => node.req.every(r => mathState(r).done);
// I admin-läge (admin.js) är alla byggda steg upplåsta
function isUnlocked(node) { return !node.soon && (reqMet(node) || (typeof isAdmin === 'function' && isAdmin())); }
const nodeHasSteps = node => { if (!node.gen) return false; const t = node.gen(); return !!(t.eq || t.geo || t.phys); };
// Nästa steg att gå till: nästa ej klara i samma gren, annars första öppna ej klara i hela trädet.
function nextNodeFor(track, node) {
  const br = track.branches.find(b => b.nodes.includes(node));
  const after = br.nodes.slice(br.nodes.indexOf(node) + 1).find(n => !n.soon && !mathState(n.id).done);
  return after || allNodes(track).find(n => n !== node && isUnlocked(n) && !mathState(n.id).done) || null;
}
// Ruta med "Gå vidare"-knapp när steget är klart. Returnerar html; koppla med wireNext.
function nextHtml(track, node) {
  if (!mathState(node.id).done) return '';
  const nx = nextNodeFor(track, node);
  if (!nx) return '<div class="next-box">✅ Steget är klart – du har klarat allt som finns i trädet just nu!</div>';
  if (!isUnlocked(nx)) return `<div class="next-box">✅ Steget är klart. Nästa steg <strong>${esc(nx.name)}</strong> kräver också: ${nx.req.filter(r => !mathState(r).done).map(r => esc(nodeName(track, r))).join(', ')}.</div>`;
  return `<div class="next-box">✅ Steget är klart! <button class="btn" data-go="${nx.id}">Gå vidare: ${esc(nx.name)} →</button> <span class="small">eller fortsätt öva här</span></div>`;
}
function wireNext(root, track, onBack) {
  root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
    const nx = allNodes(track).find(n => n.id === b.dataset.go);
    const mode = Store.getSetting(track.id + '-mode') || 'steg';
    (mode === 'ord' && nx.stories ? playStory : mode !== 'snabb' && nodeHasSteps(nx) ? playSteps : playQuick)(track, nx, onBack);
  });
}
// "Det här kan du lösa nu" – egen knapp som öppnar en inforuta (använder INFO/showInfo från game.js)
function unlockHtml(node, done) {
  const u = node.unlocks;
  return `<p>${esc(node.desc || '')}</p>
    <h4>🔓 ${done ? 'Det här kan du lösa nu' : 'Det här kan du lösa när du klarat steget'}: ${esc(u.title)}</h4>
    <ul>${u.problems.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    <p class="ulex">💬 <strong>Exempel:</strong> ${esc(u.example)}</p>`;
}
function unlockLink(node, done, label = '🔓 Vad kan jag lösa?') {
  if (!node.unlocks) return '';
  const k = 'i' + (++infoSeq);
  INFO.set(k, { title: node.name, html: unlockHtml(node, done) });
  return `<span class="ibtn ulink" role="button" tabindex="0" data-info="${k}" title="Vad låser steget upp?">${label}</span>`;
}

function doneMsg(track, node) {
  const opened = allNodes(track).filter(n => n.req.includes(node.id) && isUnlocked(n)).map(n => n.name);
  return '<br>🏆 Steget är klart!' + (opened.length ? ` Nu upplåst: <strong>${opened.map(esc).join(', ')}</strong>` : '')
    + (node.unlocks ? `<br>🔓 Nu kan du lösa: <strong>${esc(node.unlocks.title)}</strong> ${unlockLink(node, true, 'Visa exempel')}` : '');
}

// ---------- Trädvy ----------
function showMathTree(track) {
  stopTimer();
  const modeKey = track.id + '-mode';
  const hasStories = allNodes(track).some(n => n.stories);
  const modes = Object.entries(MATH_MODES).filter(([k]) => k !== 'ord' || hasStories);
  let mode = Store.getSetting(modeKey) || 'steg';
  if (!modes.some(([k]) => k === mode)) mode = 'steg';

  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <div class="modes">${modes.map(([k, n]) => `<button data-mode="${k}">${n}</button>`).join('')}</div>
    </div>
    <p class="legend" id="modehelp"></p>
    <p><button class="btn secondary" id="placebtn">🧭 Inplaceringstest – hoppa över det du redan kan</button></p>
    <div class="tree"></div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; Store.setSetting(modeKey, mode); render(); });
  app.querySelector('#placebtn').onclick = () => playPlacement(track, () => showMathTree(track));

  function render() {
    app.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    app.querySelector('#modehelp').textContent = mode === 'ord'
      ? 'Frivilligt: översätt vardagsproblem till ekvationer. Påverkar inte vad som låses upp – 📖✅ visar steg där du klarat ordproblemen.'
      : `Klara ${MATH_GOAL} uppgifter i rad för att klara ett steg och låsa upp nästa.`;
    const tree = app.querySelector('.tree');
    tree.innerHTML = '';
    track.branches.forEach(br => {
      const col = document.createElement('div');
      col.className = 'branch';
      col.innerHTML = `<h3>${br.icon} ${br.name}</h3>`;
      br.nodes.forEach((node, i) => {
        if (i) col.insertAdjacentHTML('beforeend', '<div class="arrow">↓</div>');
        const isOrd = mode === 'ord';
        const st = mathState(isOrd ? node.id + ':ord' : node.id);
        const ordDone = mathState(node.id + ':ord').done;
        const unlocked = isUnlocked(node);
        const open = unlocked && (!isOrd || !!node.stories);
        const steps = !node.soon && nodeHasSteps(node);
        let status;
        if (node.soon) status = 'Kommer snart';
        else if (!unlocked) status = '🔒 Kräver: ' + node.req.filter(r => !mathState(r).done).map(r => nodeName(track, r)).join(', ');
        else if (isOrd && !node.stories) status = 'Inga ordproblem än';
        else if (st.done) status = isOrd ? '📖 Klar' : '✅ Klar';
        else status = `${isOrd ? '📖' : '🔥'} ${st.streak}/${MATH_GOAL} i rad`;
        if (open && !steps && mode === 'steg') status += ' · bara snabbräkning';
        if (!isOrd && ordDone) status += ' · 📖✅';
        if (unlocked && !reqMet(node)) status += ' · 🔓 admin';
        const pct = st.done ? 100 : Math.round(100 * Math.min(st.streak, MATH_GOAL) / MATH_GOAL);
        const el = card(`<strong>${esc(node.name)}${node.desc && !node.unlocks ? infoBtn(node.name, `<p>${esc(node.desc)}</p>${(typeof crossLinksHtml === 'function' ? crossLinksHtml({ t: 'node', id: node.id }) : '')}`) : ''}</strong><small>${status}</small>
          ${node.unlocks && !node.soon ? `<small class="unl">${unlockLink(node, st.done)}</small>` : ''}
          ${open ? `<div class="progress"><div style="width:${pct}%"></div></div>` : ''}`,
          open ? () => {
            const back = () => showMathTree(track);
            (isOrd ? playStory : mode === 'steg' && steps ? playSteps : playQuick)(track, node, back);
          } : null);
        el.classList.add('node');
        if (st.done) el.classList.add('done');
        col.appendChild(el);
      });
      tree.appendChild(col);
    });
  }
  render();
}

function streakHtml(node, key = node.id) {
  const st = mathState(key);
  if (st.done) return `✅ ${key.endsWith(':ord') ? 'Ordproblemen klara' : 'Steget klart'} · 🔥 ${st.streak} i rad`;
  const dots = Array.from({ length: MATH_GOAL }, (_, i) => `<span class="dot ${i < st.streak ? 'on' : ''}"></span>`).join('');
  return `${dots} <span>${st.streak}/${MATH_GOAL} i rad för att klara steget</span>`;
}

// ---------- Steg för steg ----------
function playSteps(track, node, onBack) {
  stopTimer();
  const task = node.gen();
  if (task.geo) return playGeo(track, node, onBack, task);
  if (task.phys) return playPhys(track, node, onBack, task);
  const start = { L: side(task.eq.L), R: side(task.eq.R) };
  const best = solution(start).length;
  let deck = buildDeck(start);
  const history = [{ eq: start, op: null }];
  let helped = null; // null | 'hint' | 'solution'
  let finished = false;

  app.innerHTML = `
    <button class="back">← Trädet</button>
    <h2>${esc(node.name)}</h2>
    <p>${esc(node.desc)} Dra ett kort till ekvationen (eller klicka på det). Målet är <strong>x = …</strong></p>
    <div class="bar"><span class="stat small" id="streak">${streakHtml(node)}</span></div>
    <div id="nextbar">${nextHtml(track, node)}</div>
    <div class="eqwork" id="work"></div>
    <div class="deck" id="deck"></div>
    <div class="tools">
      <button class="btn secondary" id="undo">↶ Ångra</button>
      <button class="btn secondary" id="hint">💡 Ledtråd</button>
      <button class="btn secondary" id="show">Visa lösning</button>
    </div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  wireNext(app.querySelector('#nextbar'), track, onBack);
  const work = app.querySelector('#work'), deckEl = app.querySelector('#deck'), msg = app.querySelector('#msg');

  function render() {
    work.innerHTML = history.map((h, i) => `
      ${h.op ? `<div class="eqop">${esc(opLong(h.op))}</div>` : ''}
      <div class="eqrow ${i === history.length - 1 ? 'current' : ''}">${esc(eqStr(h.eq))}</div>`).join('');
    deckEl.innerHTML = deck.map((op, i) => `<button class="opcard" draggable="true" data-i="${i}">${esc(opLabel(op))}</button>`).join('');
    app.querySelector('#undo').disabled = finished || history.length < 2;
    const cur = work.querySelector('.current');
    cur.addEventListener('dragover', e => { e.preventDefault(); cur.classList.add('over'); });
    cur.addEventListener('dragleave', () => cur.classList.remove('over'));
    cur.addEventListener('drop', e => { e.preventDefault(); cur.classList.remove('over'); apply(deck[+e.dataTransfer.getData('text/plain')]); });
  }
  deckEl.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.dataset.i));
  deckEl.addEventListener('click', e => { const b = e.target.closest('.opcard'); if (b) apply(deck[+b.dataset.i]); });

  function apply(op) {
    if (finished || !op) return;
    const cur = history[history.length - 1].eq;
    if (op.t === 'expand' && Fzero(cur.L.m) && Fzero(cur.R.m)) { msg.innerHTML = '<p class="note">Det finns ingen parentes att multiplicera in.</p>'; return; }
    msg.innerHTML = '';
    history.push({ eq: applyOp(cur, op), op });
    render();
    if (solvedValue(history[history.length - 1].eq)) done();
  }

  function done() {
    finished = true;
    const steps = history.length - 1;
    const result = helped === 'solution' ? 'fail' : helped === 'hint' ? 'help' : 'ok';
    const { justDone } = mathRecord(node.id, result);
    work.querySelector('.current').classList.add('solved');
    const extra = steps > best ? ` Det går på ${best} steg – kan du hitta den vägen nästa gång?` : ' Kortaste vägen! 👌';
    const head = result === 'ok' ? `✅ Löst på ${steps} steg.${extra}`
      : result === 'help' ? '✅ Löst med ledtråd – räknas inte till "i rad", men nollställer inte heller.'
      : 'Här är lösningen. Prova en ny uppgift av samma typ!';
    const nh = nextHtml(track, node);
    app.querySelector('#nextbar').innerHTML = '';
    msg.innerHTML = `<div class="result">${head}
      ${justDone ? doneMsg(track, node) : ''}
      <br><button class="btn ${nh ? 'secondary' : ''}" id="next">Nästa uppgift ↵</button></div>${nh}`;
    wireNext(msg, track, onBack);
    app.querySelector('#streak').innerHTML = streakHtml(node);
    app.querySelectorAll('.tools button').forEach(b => b.disabled = true);
    const next = app.querySelector('#next');
    next.onclick = () => playSteps(track, node, onBack);
    (justDone && msg.querySelector('[data-go]') || next).focus();
  }

  app.querySelector('#undo').onclick = () => { if (history.length > 1) { history.pop(); msg.innerHTML = ''; render(); } };
  app.querySelector('#hint').onclick = () => {
    const op = nextOp(history[history.length - 1].eq);
    if (!op) return;
    helped ||= 'hint';
    let i = deck.findIndex(d => opLabel(d) === opLabel(op));
    if (i < 0) { deck.push(op); i = deck.length - 1; render(); }
    deckEl.querySelector(`[data-i="${i}"]`).classList.add('glow');
    msg.innerHTML = `<p class="note">💡 Prova: <strong>${esc(opLong(op))}</strong></p>`;
  };
  app.querySelector('#show').onclick = () => {
    helped = 'solution';
    let op;
    while ((op = nextOp(history[history.length - 1].eq))) history.push({ eq: applyOp(history[history.length - 1].eq, op), op });
    render();
    done();
  };

  render();
}

// ---------- Geometri: figurer ----------
const fmtNum = v => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(Math.round(v * 100) / 100).replace('.', ','));

function figSvg(f) {
  const W = 340, H = 200;
  const cm = v => `${fmtNum(v)} cm`;
  const lab = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" class="fl">${esc(t)}</text>`;
  const side = (letter, v, unknown) => (unknown ? `${letter} = ?` : `${letter} = ${cm(v)}`);
  let body = '';
  if (f.type === 'rect') {
    const s = Math.min((W - 140) / f.w, (H - 60) / f.h), rw = f.w * s, rh = f.h * s, x0 = 50, y0 = (H - rh) / 2 - 8;
    body = `<rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" class="shape"/>`
      + lab(x0 + rw / 2, y0 + rh + 20, side('b', f.w)) + lab(x0 + rw + 8, y0 + rh / 2 + 5, side('h', f.h), 'start');
  }
  if (f.type === 'tri') {
    const s = Math.min((W - 120) / f.b, (H - 60) / f.h);
    const X = x => 70 + x * s, Y = y => H - 32 - y * s;
    body = `<polygon points="${X(0)},${Y(0)} ${X(f.b)},${Y(0)} ${X(f.off)},${Y(f.h)}" class="shape"/>`
      + `<line x1="${X(f.off)}" y1="${Y(f.h)}" x2="${X(f.off)}" y2="${Y(0)}" class="dash"/>`
      + `<rect x="${X(f.off)}" y="${Y(0) - 10}" width="10" height="10" class="mark"/>`
      + lab(X(f.b / 2), Y(0) + 20, side('b', f.b)) + lab(X(f.off) + 8, Y(f.h / 2) + 5, side('h', f.h), 'start')
      + lab(X(f.off / 2) - 8, Y(f.h / 2), side('s', f.s), 'end');
  }
  if (f.type === 'circle') {
    const cx = W / 2, cy = H / 2, R = 75;
    body = `<circle cx="${cx}" cy="${cy}" r="${R}" class="shape"/><circle cx="${cx}" cy="${cy}" r="3" class="dot0"/>`
      + (f.showD
        ? `<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="line"/>` + lab(cx, cy - 8, side('d', 2 * f.r))
        : `<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="line"/>` + lab(cx + R / 2, cy - 8, side('r', f.r)));
  }
  if (f.type === 'right') {
    const s = Math.min((W - 160) / f.b, (H - 50) / f.a);
    const X = x => 90 + x * s, Y = y => H - 30 - y * s;
    body = `<polygon points="${X(0)},${Y(0)} ${X(f.b)},${Y(0)} ${X(0)},${Y(f.a)}" class="shape"/>`
      + `<rect x="${X(0)}" y="${Y(0) - 12}" width="12" height="12" class="mark"/>`
      + lab(X(0) - 8, Y(f.a / 2) + 5, side('a', f.a, f.unknown === 'a'), 'end')
      + lab(X(f.b / 2), Y(0) + 20, side('b', f.b, f.unknown === 'b'))
      + lab(X(f.b / 2) + 10, Y(f.a / 2) - 6, side('c', f.c, f.unknown === 'c'), 'start');
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="figsvg" role="img">${body}</svg>`;
}

// ---------- Geometri: steg för steg (formel → mått → svar) ----------
function playGeo(track, node, onBack, task) {
  stopTimer();
  const g = task.geo;
  const byId = id => g.formulas.find(f => f.id === id);
  let stage = 'formula', formula = null, slots = [], mistakes = 0, helped = null;
  const lines = [];
  const tplHtml = (f, vals, asSlots) => esc(f.tpl).replace(/\{(\d)\}/g, (_, i) => asSlots
    ? `<span class="slot ${vals[i] != null ? 'filled' : ''}" data-s="${i}">${vals[i] != null ? fmtNum(vals[i]) : '?'}</span>`
    : fmtNum(vals[i]));

  app.innerHTML = `
    <button class="back">← Trädet</button>
    <h2>${esc(node.name)}</h2>
    <p>${esc(node.desc)}</p>
    <div class="bar"><span class="stat small" id="streak">${streakHtml(node)}</span></div>
    <div id="nextbar">${nextHtml(track, node)}</div>
    <div class="geo"><div class="fig">${figSvg(g.fig)}</div><div class="geo-q">${esc(g.question)}</div></div>
    <div class="eqwork" id="work"></div>
    <div class="deck" id="deck"></div>
    <div class="tools">
      <button class="btn" id="check">Kontrollera</button>
      <button class="btn secondary" id="hint">💡 Ledtråd</button>
      <button class="btn secondary" id="show">Visa lösning</button>
    </div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  wireNext(app.querySelector('#nextbar'), track, onBack);
  const work = app.querySelector('#work'), deckEl = app.querySelector('#deck'), msg = app.querySelector('#msg');
  const checkBtn = app.querySelector('#check');
  const note = h => { msg.innerHTML = h ? `<p class="note">${h}</p>` : ''; };

  function render() {
    let cur = '';
    if (stage === 'formula') cur = `<div class="eqrow current" id="drop">Välj formel: <span class="slot wide">?</span></div>`;
    if (stage === 'fill') cur = `<div class="eqrow current">${g.ansLabel} = ${tplHtml(formula, slots, true)}</div>`;
    if (stage === 'calc') cur = `<div class="eqrow current">${g.ansLabel} = ${tplHtml(formula, slots)} = <input id="calc" autocomplete="off"> ${g.unit}</div>`;
    work.innerHTML = lines.map(l => `<div class="eqrow">${l}</div>`).join('') + cur;
    const items = stage === 'formula' ? g.formulas.map(f => f.label) : stage === 'fill' ? g.chips.map(fmtNum) : [];
    deckEl.innerHTML = items.map((t, i) => `<button class="opcard" draggable="true" data-i="${i}">${esc(t)}</button>`).join('');
    checkBtn.style.display = stage === 'fill' || stage === 'calc' ? '' : 'none';
    // Släppzoner
    const zones = stage === 'formula' ? [work.querySelector('#drop')] : [...work.querySelectorAll('.slot')];
    zones.forEach(z => {
      z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', () => z.classList.remove('over'));
      z.addEventListener('drop', e => { e.preventDefault(); pick(+e.dataTransfer.getData('text/plain'), z.dataset.s != null ? +z.dataset.s : null); });
    });
    work.querySelectorAll('.slot.filled').forEach(z => z.onclick = () => { slots[+z.dataset.s] = null; render(); });
    const calc = work.querySelector('#calc');
    if (calc) { calc.focus(); calc.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }); }
  }
  deckEl.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.dataset.i));
  deckEl.addEventListener('click', e => { const b = e.target.closest('.opcard'); if (b) pick(+b.dataset.i, null); });

  function pick(i, slotIdx) {
    if (stage === 'formula') {
      const f = g.formulas[i];
      if (g.correct.includes(f.id)) {
        formula = f; slots = Array(f.n).fill(null);
        lines.push(`Formel: <strong>${esc(f.label)}</strong>`);
        stage = 'fill'; note('Dra in rätt mått i formeln (klicka på en ruta för att tömma den).');
      } else { mistakes++; note(`✗ <strong>${esc(f.label)}</strong> ger ${esc(f.what)}. Försök igen!`); }
    } else if (stage === 'fill') {
      const at = slotIdx != null ? slotIdx : slots.indexOf(null);
      if (at < 0) return;
      slots[at] = g.chips[i];
    }
    render();
  }

  function check() {
    if (stage === 'fill') {
      if (slots.includes(null)) return note('Fyll alla rutor först.');
      if (Math.abs(formula.fn(...slots) - g.answer) < 1e-6) {
        stage = 'calc'; note('Räkna ut svaret.' + (task.tol ? ' Avrunda till heltal.' : ''));
      } else { mistakes++; note('✗ Det blir inte rätt – titta på figuren: vilka mått behöver formeln?'); }
      return render();
    }
    if (stage === 'calc') {
      const inp = work.querySelector('#calc');
      const v = parseNum(inp.value);
      if (v != null && Math.abs(v - g.answer) <= task.tol + 1e-9) {
        lines.push(`${g.ansLabel} = ${tplHtml(formula, slots)} ${task.tol ? '≈' : '='} <strong>${fmtNum(v)} ${g.unit}</strong>`);
        stage = 'done'; render(); finish();
      } else {
        mistakes++; inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400);
        note('✗ Inte riktigt – räkna en gång till.');
      }
    }
  }
  checkBtn.onclick = check;

  app.querySelector('#hint').onclick = () => {
    helped ||= 'hint';
    if (stage === 'formula') {
      const i = g.formulas.findIndex(f => f.id === g.sol.f);
      deckEl.querySelector(`[data-i="${i}"]`).classList.add('glow');
      note(`💡 Vi söker ${g.ansLabel === 'A' ? 'en area' : g.ansLabel === 'O' ? 'en omkrets' : 'en sida i en rätvinklig triangel'}.`);
    } else if (stage === 'fill') {
      if (formula.id === g.sol.f) { slots = g.sol.slots.slice(); render(); note('💡 Måtten är ifyllda – tryck Kontrollera.'); }
      else note(`💡 Formeln behöver ${formula.n === 1 ? 'ett mått' : formula.n + ' mått'} – kolla figuren noga.`);
    } else if (stage === 'calc') note(`💡 Det blir ungefär ${fmtNum(Math.round(g.answer * 10) / 10)}.`);
  };
  app.querySelector('#show').onclick = () => {
    helped = 'solution';
    formula = byId(g.sol.f); slots = g.sol.slots.slice();
    lines.length = 0;
    lines.push(`Formel: <strong>${esc(formula.label)}</strong>`);
    lines.push(`${g.ansLabel} = ${tplHtml(formula, slots)} ${task.tol ? '≈' : '='} <strong>${fmtNum(task.tol ? Math.round(g.answer) : g.answer)} ${g.unit}</strong>`);
    stage = 'done'; render(); finish();
  };

  function finish() {
    const result = helped === 'solution' ? 'fail' : (helped || mistakes) ? 'help' : 'ok';
    const { justDone } = mathRecord(node.id, result);
    work.lastElementChild.classList.add('solved');
    const head = result === 'ok' ? '✅ Felfritt!'
      : result === 'help' ? `✅ Klart${mistakes ? ` med ${mistakes} fel` : ''}${helped ? ' och ledtråd' : ''} – räknas inte till "i rad", men nollställer inte heller.`
      : 'Här är lösningen. Prova en ny uppgift av samma typ!';
    const nh = nextHtml(track, node);
    app.querySelector('#nextbar').innerHTML = '';
    msg.innerHTML = `<div class="result">${head}${justDone ? doneMsg(track, node) : ''}
      <br><button class="btn ${nh ? 'secondary' : ''}" id="next">Nästa uppgift ↵</button></div>${nh}`;
    wireNext(msg, track, onBack);
    app.querySelector('#streak').innerHTML = streakHtml(node);
    app.querySelectorAll('.tools button').forEach(b => b.disabled = true);
    const next = app.querySelector('#next');
    next.onclick = () => playSteps(track, node, onBack);
    (justDone && msg.querySelector('[data-go]') || next).focus();
  }

  render();
  note('Börja med att välja rätt formel – dra den till rutan eller klicka på den.');
}

const parseNum = v => { v = String(v).trim().replace('−', '-').replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(v) ? parseFloat(v) : null; };

// ---------- Ordproblem: text → x → ekvation → lösning → svar ----------
// Ekvationsformer som man fyller med tal från texten (__ = ruta).
const SHAPES = {
  xpa: { label: 'x + __ = __', eq: s => ({ L: { x: 1, k: s[0] }, R: { k: s[1] } }) },
  xma: { label: 'x − __ = __', eq: s => ({ L: { x: 1, k: -s[0] }, R: { k: s[1] } }) },
  ax: { label: '__ · x = __', eq: s => ({ L: { x: s[0] }, R: { k: s[1] } }) },
  axb: { label: '__ · x + __ = __', eq: s => ({ L: { x: s[0], k: s[1] }, R: { k: s[2] } }) },
  mxb: { label: '__ · (x + __) = __', eq: s => ({ L: { m: s[0], ix: 1, ik: s[1] }, R: { k: s[2] } }) },
  axbcxd: { label: '__ · x + __ = __ · x + __', eq: s => ({ L: { x: s[0], k: s[1] }, R: { x: s[2], k: s[3] } }) },
};
Object.values(SHAPES).forEach(s => { s.n = s.label.split('__').length - 1; });
const SIGNALS = {
  per: '"per" betyder oftast gånger (·)', totalt: '"totalt" brukar vara det som står efter =',
  'lika mycket': '"lika mycket" = två uttryck med = emellan', 'var sin': '"var sin" = samma sak för alla → parentes gånger antalet',
  till: '"till" = plus', fick: '"fick" = plus', 'kliver av': '"kliver av" = minus', 'äldre än': '"äldre än" = plus på den yngres ålder',
  lika: '"dela lika" = gånger antalet', en: '"en" = det är priset för EN sak vi söker', plus: '"plus" = +',
  'varje vecka': '"varje vecka" = gånger antalet veckor', 'i veckan': '"i veckan" = gånger antalet veckor',
};

// Löser en byggd ekvation; returnerar värdet på x eller null
function solveValue(eq) {
  try {
    let e = { L: side(eq.L), R: side(eq.R) };
    if (Fzero(Fadd(e.L.x, Fmul(e.L.m, e.L.ix))) && Fzero(Fadd(e.R.x, Fmul(e.R.m, e.R.ix)))) return null;
    solution(e).forEach(op => { e = applyOp(e, op); });
    const v = solvedValue(e);
    return v ? v.n / v.d : null;
  } catch { return null; }
}

function playStory(track, node, onBack) {
  stopTimer();
  const key = node.id + ':ord';
  const s = node.stories[Math.floor(Math.random() * node.stories.length)]();
  const xOpts = shuffle(s.x), shapes = shuffle(s.shapes);
  const nums = [...new Set([...s.text.matchAll(/\[\[(\d+)\]\]/g)].map(m => +m[1]))];
  const textHtml = esc(s.text)
    .replace(/\[\[(\d+)\]\]/g, '<b class="num">$1</b>')
    .replace(/\{\{(.+?)\}\}/g, (_, w) => `<span class="sig" title="${esc(SIGNALS[w.toLowerCase()] || '')}">${w}</span>`);
  let stage = 'x', shape = null, slots = [], mistakes = 0, helped = null;
  let history = [], deck = [];
  const lines = [];

  app.innerHTML = `
    <button class="back">← Trädet</button>
    <h2>📖 ${esc(node.name)} – ordproblem</h2>
    <div class="bar"><span class="stat small" id="streak">${streakHtml(node, key)}</span></div>
    <div class="story">${textHtml}</div>
    <div class="eqwork" id="work"></div>
    <div class="deck" id="deck"></div>
    <div class="tools">
      <button class="btn" id="check">Kontrollera</button>
      <button class="btn secondary" id="undo">↶ Ångra</button>
      <button class="btn secondary" id="hint">💡 Ledtråd</button>
      <button class="btn secondary" id="show">Visa lösning</button>
    </div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const work = app.querySelector('#work'), deckEl = app.querySelector('#deck'), msg = app.querySelector('#msg');
  const note = h => { msg.innerHTML = h ? `<p class="note">${h}</p>` : ''; };
  const shapeHtml = (sh, vals, asSlots) => {
    const parts = sh.label.split('__');
    return parts.map((p, i) => esc(p) + (i < parts.length - 1
      ? (asSlots ? `<span class="slot ${vals[i] != null ? 'filled' : ''}" data-s="${i}">${vals[i] != null ? vals[i] : '?'}</span>` : vals[i])
      : '')).join('');
  };

  function render() {
    let cur = '', items = [];
    if (stage === 'x') { cur = `<div class="eqrow current drop">x = <span class="slot wide">?</span></div>`; items = xOpts; }
    if (stage === 'shape') { cur = `<div class="eqrow current drop">Ekvation: <span class="slot wide">?</span></div>`; items = shapes.map(k => SHAPES[k].label); }
    if (stage === 'fill') { cur = `<div class="eqrow current">${shapeHtml(shape, slots, true)}</div>`; items = nums.map(String); }
    if (stage === 'solve') {
      cur = history.map((h, i) => `${h.op ? `<div class="eqop">${esc(opLong(h.op))}</div>` : ''}
        <div class="eqrow ${i === history.length - 1 ? 'current drop' : ''}">${esc(eqStr(h.eq))}</div>`).join('');
      items = deck.map(opLabel);
    }
    if (stage === 'answer') {
      const [a, b] = s.sentence.split('___');
      cur = `<div class="eqrow current sentence">${esc(a)}<input id="calc" autocomplete="off">${esc(b)}</div>`;
    }
    work.innerHTML = lines.map(l => `<div class="eqrow done-line">${l}</div>`).join('') + cur;
    deckEl.innerHTML = items.map((t, i) => `<button class="opcard ${stage === 'x' ? 'wide' : ''}" draggable="true" data-i="${i}">${esc(t)}</button>`).join('');
    app.querySelector('#check').style.display = stage === 'fill' || stage === 'answer' ? '' : 'none';
    app.querySelector('#undo').style.display = stage === 'solve' ? '' : 'none';
    app.querySelector('#undo').disabled = history.length < 2;
    const zones = stage === 'fill' ? [...work.querySelectorAll('.slot')] : [...work.querySelectorAll('.drop')];
    zones.forEach(z => {
      z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', () => z.classList.remove('over'));
      z.addEventListener('drop', e => { e.preventDefault(); pick(+e.dataTransfer.getData('text/plain'), z.dataset.s != null ? +z.dataset.s : null); });
    });
    work.querySelectorAll('.slot.filled').forEach(z => z.onclick = () => { slots[+z.dataset.s] = null; render(); });
    const calc = work.querySelector('#calc');
    if (calc) { calc.focus(); calc.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }); }
  }
  deckEl.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.dataset.i));
  deckEl.addEventListener('click', e => { const b = e.target.closest('.opcard'); if (b) pick(+b.dataset.i, null); });

  function toSolve() {
    const eq = SHAPES[s.shape === shape.id ? s.shape : shape.id].eq(slots);
    const start = { L: side(eq.L), R: side(eq.R) };
    history = [{ eq: start, op: null }];
    deck = buildDeck(start);
    stage = 'solve';
    note('Lös ekvationen precis som i algebran – dra kort till den.');
  }

  function pick(i, slotIdx) {
    if (stage === 'x') {
      if (xOpts[i] === s.x[0]) {
        lines.push(`x = <strong>${esc(s.x[0])}</strong>`);
        stage = 'shape'; note('Vilken sorts ekvation beskriver texten?');
      } else { mistakes++; note(`✗ Nej – läs frågan igen. Vad är det som frågas efter?`); }
    } else if (stage === 'shape') {
      const k = shapes[i];
      if (k === s.shape) {
        shape = { id: k, ...SHAPES[k] }; slots = Array(shape.n).fill(null);
        stage = 'fill'; note('Dra in talen från texten i rätt rutor. Alla tal behövs inte alltid!');
      } else { mistakes++; note('✗ Den formen passar inte – vad händer med x i texten? Plus, gånger, eller en parentes?'); }
    } else if (stage === 'fill') {
      const at = slotIdx != null ? slotIdx : slots.indexOf(null);
      if (at >= 0) slots[at] = nums[i];
    } else if (stage === 'solve') {
      const op = deck[i];
      const cur = history[history.length - 1].eq;
      if (op.t === 'expand' && Fzero(cur.L.m) && Fzero(cur.R.m)) return note('Det finns ingen parentes att multiplicera in.');
      note('');
      history.push({ eq: applyOp(cur, op), op });
      const v = solvedValue(history[history.length - 1].eq);
      if (v) {
        lines.push(`Ekvation: <strong>${esc(eqStr(history[0].eq))}</strong>`, ...history.slice(1).map(h => `<span class="eqop-inline">${esc(opLabel(h.op))}</span> ${esc(eqStr(h.eq))}`));
        stage = 'answer'; note('Skriv svaret som en mening. Är det rimligt?');
      }
    }
    render();
  }

  function check() {
    if (stage === 'fill') {
      if (slots.includes(null)) return note('Fyll alla rutor först.');
      const v = solveValue(shape.eq(slots));
      if (v != null && Math.abs(v - s.answer) < 1e-9) toSolve();
      else { mistakes++; note('✗ Ekvationen stämmer inte med texten – kolla vilket tal som hör till vad (klicka på en ruta för att tömma den).'); }
      return render();
    }
    if (stage === 'answer') {
      const inp = work.querySelector('#calc');
      if (parseNum(inp.value) === s.answer) {
        lines.push(`<strong>${esc(s.sentence.replace('___', s.answer))}</strong>`);
        stage = 'done'; render(); finish();
      } else { mistakes++; inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); note('✗ Titta på sista raden i uträkningen.'); }
    }
  }
  app.querySelector('#check').onclick = check;
  app.querySelector('#undo').onclick = () => { if (history.length > 1) { history.pop(); note(''); render(); } };

  app.querySelector('#hint').onclick = () => {
    helped ||= 'hint';
    app.querySelector('.story').classList.add('hinted');
    const glow = i => deckEl.querySelector(`[data-i="${i}"]`)?.classList.add('glow');
    if (stage === 'x') { glow(xOpts.indexOf(s.x[0])); note('💡 Frågan i sista meningen avslöjar vad x är. De markerade orden är signalord – håll muspekaren över dem.'); }
    if (stage === 'shape') { glow(shapes.indexOf(s.shape)); note('💡 Signalorden i texten visar vilka räknesätt som behövs.'); }
    if (stage === 'fill') { slots = s.slots.slice(); render(); note('💡 Talen är ifyllda – tryck Kontrollera.'); }
    if (stage === 'solve') {
      const op = nextOp(history[history.length - 1].eq);
      let i = deck.findIndex(d => opLabel(d) === opLabel(op));
      if (i < 0) { deck.push(op); i = deck.length - 1; render(); }
      glow(i); note(`💡 Prova: <strong>${esc(opLong(op))}</strong>`);
    }
    if (stage === 'answer') note(`💡 Sista raden säger x = ${s.answer}.`);
  };
  app.querySelector('#show').onclick = () => {
    helped = 'solution';
    lines.length = 0;
    lines.push(`x = <strong>${esc(s.x[0])}</strong>`);
    let e = (() => { const q = SHAPES[s.shape].eq(s.slots); return { L: side(q.L), R: side(q.R) }; })();
    lines.push(`Ekvation: <strong>${esc(eqStr(e))}</strong>`);
    let op;
    while ((op = nextOp(e))) { e = applyOp(e, op); lines.push(`<span class="eqop-inline">${esc(opLabel(op))}</span> ${esc(eqStr(e))}`); }
    lines.push(`<strong>${esc(s.sentence.replace('___', s.answer))}</strong>`);
    stage = 'done'; render(); finish();
  };

  function finish() {
    const result = helped === 'solution' ? 'fail' : (helped || mistakes) ? 'help' : 'ok';
    const { justDone } = mathRecord(key, result);
    app.querySelector('.story').classList.add('hinted');
    work.lastElementChild.classList.add('solved');
    const head = result === 'ok' ? '✅ Felfritt – snyggt översatt!'
      : result === 'help' ? `✅ Klart${mistakes ? ` med ${mistakes} fel` : ''}${helped ? ' och ledtråd' : ''} – räknas inte till "i rad", men nollställer inte heller.`
      : 'Här är lösningen. Prova ett nytt ordproblem!';
    msg.innerHTML = `<div class="result">${head}
      ${justDone ? '<br>📖 Ordproblemen på det här steget är klara – snyggt!' : ''}
      <br><button class="btn" id="next">Nästa ordproblem ↵</button></div>`;
    app.querySelector('#streak').innerHTML = streakHtml(node, key);
    app.querySelectorAll('.tools button').forEach(b => b.disabled = true);
    const next = app.querySelector('#next');
    next.onclick = () => playStory(track, node, onBack);
    next.focus();
  }

  render();
  note('Läs texten. Börja med att bestämma vad x står för.');
}

// ---------- Snabbräkning ----------
function playQuick(track, node, onBack) {
  stopTimer();
  const TIME = 60;
  let timeLeft = TIME, right = 0, wrong = 0, task = null, justDone = false;
  const log = [];
  const qText = t => (t.eq ? eqStr({ L: side(t.eq.L), R: side(t.eq.R) }) : t.text);

  app.innerHTML = `
    <button class="back">← Trädet</button>
    <h2>⚡ ${esc(node.name)}</h2>
    <p>${esc(node.desc)} Så många du hinner på ${TIME} sekunder. Rätt svar godkänns direkt, Enter hoppar över (räknas som fel).</p>
    <div class="bar">
      <span class="stat" id="score">0 rätt</span>
      <span class="stat" id="clock">${fmt(TIME)}</span>
      <span class="stat small" id="streak">${streakHtml(node)}</span>
      <button class="btn" id="start">Starta</button>
    </div>
    <div id="result"></div>
    <div class="quick">
      <div class="problem" id="problem">Tryck Starta</div>
      <div class="answer"><span id="prefix"></span><input id="ans" autocomplete="off" disabled></div>
    </div>
    <div class="log" id="log"></div>`;
  app.querySelector('.back').onclick = onBack;
  const input = app.querySelector('#ans'), startBtn = app.querySelector('#start');

  function newTask() {
    task = node.gen();
    const p = app.querySelector('#problem');
    if (task.geo) p.innerHTML = `<div class="fig small">${figSvg(task.geo.fig)}</div><div class="geo-q">${esc(task.geo.question)}</div>`;
    else p.textContent = qText(task);
    app.querySelector('#prefix').textContent = task.eq ? 'x =' : task.geo ? task.geo.ansLabel + ' =' : '=';
    input.value = '';
  }
  const hit = v => { const n = parseNum(v); return n != null && Math.abs(n - task.answer) <= (task.tol || 0) + 1e-9; };
  function record(ok) {
    const r = mathRecord(node.id, ok ? 'ok' : 'fail');
    justDone ||= r.justDone;
    log.unshift(`<span class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${esc(qText(task))} → ${task.eq ? 'x = ' : ''}${task.tol ? '≈ ' + fmtNum(Math.round(task.answer * 100) / 100) : fmtNum(task.answer)}</span>`);
    app.querySelector('#log').innerHTML = log.slice(0, 12).join('');
    app.querySelector('#score').textContent = `${right} rätt`;
    app.querySelector('#streak').innerHTML = streakHtml(node);
    newTask();
  }
  input.addEventListener('input', () => { if (hit(input.value)) { right++; record(true); } });
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (hit(input.value)) { right++; record(true); return; }
    wrong++;
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 300);
    record(false);
  });

  function start() {
    input.disabled = false; newTask(); input.focus();
    startBtn.textContent = 'Avsluta';
    startBtn.className = 'btn secondary';
    startBtn.onclick = finish;
    timerId = setInterval(() => {
      timeLeft--;
      app.querySelector('#clock').textContent = fmt(timeLeft);
      if (timeLeft <= 0) finish();
    }, 1000);
  }
  function finish() {
    stopTimer();
    input.disabled = true;
    app.querySelector('#problem').textContent = '⏱ Slut!';
    const secs = TIME - timeLeft;
    Store.addAttempt({
      quiz: `${track.id}/${node.id}/snabb`, title: `⚡ ${node.name}`, at: new Date().toISOString(),
      score: right, total: right + wrong, secs, missed: [],
    });
    app.querySelector('#result').innerHTML = `<div class="result"><strong>${right} rätt</strong> och ${wrong} fel på ${fmt(secs)}.
      ${justDone ? doneMsg(track, node) : ''}</div>${nextHtml(track, node)}`;
    wireNext(app.querySelector('#result'), track, onBack);
    startBtn.textContent = 'Spela igen';
    startBtn.className = 'btn';
    startBtn.onclick = () => playQuick(track, node, onBack);
  }
  startBtn.onclick = start;
}

// ---------- Statistik på resultatsidan ----------
function mathStatsHtml() {
  const m = Store.load().math;
  if (!m || !Object.keys(m).length) return '';
  return TRACKS.filter(t => t.type === 'tree').map(track => {
    const rows = track.branches.map(br => {
      const live = br.nodes.filter(n => !n.soon);
      if (!live.length) return '';
      const done = live.filter(n => mathState(n.id).done).length;
      const chips = live.map(n => {
        const s = mathState(n.id);
        const cls = s.done ? 'known' : s.ok ? 'half' : '';
        return `<span class="chip ${cls}" title="${s.ok} rätt, ${s.fail} fel">${esc(n.name)}${mathState(n.id + ':ord').done ? ' 📖' : ''}</span>`;
      }).join(' ');
      return `<tr><td>${br.icon} ${br.name}<br><small>${done}/${live.length} steg klara</small>
        <div class="progress"><div style="width:${Math.round(100 * done / live.length)}%"></div></div></td><td>${chips}</td></tr>`;
    }).join('');
    return `<h3>${track.icon} ${track.name} – färdighetsträdet</h3><table class="vocab">${rows}</table>`;
  }).join('');
}
