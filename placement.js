// Inplaceringstest för färdighetsträden (matte, fysik): två rätt i rad på ett steg → steget räknas som klart
// och testet går vidare uppåt i grenen. Ett fel eller "Vet inte" stoppar grenen – där börjar man.
// Använder mathState, MATH_GOAL, side, eqStr, figSvg, parseNum, fmtNum, Store, esc, stopTimer.

const PLACE_NEEDED = 2;

function playPlacement(track, onBack) {
  stopTimer();
  const branches = track.branches.map(br => ({ br, nodes: br.nodes.filter(n => n.gen && !n.soon) })).filter(b => b.nodes.length);
  const status = new Map(); // nod-id → 'done' | 'stop' | 'had'
  let bi = 0, ni = 0, inRow = 0, task = null, node = null, asked = 0;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🧭 Inplaceringstest – ${track.icon} ${track.name}</h2>
    <p class="placeinfo">Svara på några uppgifter så hoppar du över det du redan kan. <strong>${PLACE_NEEDED} rätt i rad</strong> på ett steg = steget är klart.
      Vet du inte – tryck <em>Vet inte</em>, så börjar du där. Inget blir fel av att testa.</p>
    <div class="placebar" id="pbar"></div>
    <div class="quick">
      <div class="problem" id="pproblem"></div>
      <form class="answer" id="pform"><span id="pprefix"></span><input id="pans" autocomplete="off" inputmode="decimal">
        <button class="btn" type="submit">Svara</button><button class="btn secondary" type="button" id="pdk">Vet inte</button></form>
    </div>
    <div class="pfeed" id="pfeed"></div>
    <div id="presult"></div>`;
  app.querySelector('.back').onclick = onBack;
  const inp = app.querySelector('#pans');

  function renderBar() {
    app.querySelector('#pbar').innerHTML = branches.map((b, k) => {
      const done = b.nodes.filter(n => mathState(n.id).done).length;
      const stopped = b.nodes.some(n => status.get(n.id) === 'stop');
      return `<span class="${k === bi && !finished ? 'on' : stopped ? 'stop' : k < bi || finished ? 'done' : ''}">${b.br.icon} ${esc(b.br.name)} ${done}/${b.nodes.length}</span>`;
    }).join('');
  }
  let finished = false;

  function next() {
    // Hoppa över steg som redan är klara
    while (bi < branches.length) {
      if (ni >= branches[bi].nodes.length) { bi++; ni = 0; inRow = 0; continue; }
      const n = branches[bi].nodes[ni];
      if (mathState(n.id).done) { if (!status.has(n.id)) status.set(n.id, 'had'); ni++; continue; }
      break;
    }
    if (bi >= branches.length) return finish();
    node = branches[bi].nodes[ni];
    task = node.gen();
    asked++;
    const p = app.querySelector('#pproblem');
    if (task.geo) p.innerHTML = `<div class="fig small">${figSvg(task.geo.fig)}</div><div class="geo-q">${esc(task.geo.question)}</div>`;
    else if (task.eq) p.textContent = eqStr({ L: side(task.eq.L), R: side(task.eq.R) });
    else p.innerHTML = `<div class="geo-q">${esc(task.text)}</div>`;
    p.insertAdjacentHTML('afterbegin', `<div class="slabel">${esc(branches[bi].br.name)} · ${esc(node.name)} · ${inRow + 1}/${PLACE_NEEDED}</div>`);
    app.querySelector('#pprefix').textContent = task.eq ? 'x =' : task.geo ? task.geo.ansLabel + ' =' : task.phys ? task.phys.ask + ' =' : '=';
    inp.value = ''; inp.focus();
    renderBar();
  }
  const correct = () => (task.tol ? '≈ ' + fmtNum(Math.round(task.answer * 100) / 100) : fmtNum(task.answer));
  function answer(v) {
    const ok = v != null && Math.abs(v - task.answer) <= (task.tol || 0) + 1e-9;
    const feed = app.querySelector('#pfeed');
    if (ok) {
      inRow++;
      feed.innerHTML = `<span class="ok">✓ Rätt!</span>`;
      if (inRow >= PLACE_NEEDED) {
        const d = Store.load(); d.math ||= {};
        const s = d.math[node.id] || { streak: 0, done: false, ok: 0, fail: 0 };
        if (!s.done) Store.logAdd(d, { p: 1, x: 10 });
        d.math[node.id] = { ...s, streak: Math.max(s.streak, MATH_GOAL), done: true, ok: s.ok + PLACE_NEEDED, placedAt: s.placedAt || (s.done ? undefined : Store.now()) };
        Store.save(d);
        status.set(node.id, 'done');
        feed.innerHTML = `<span class="ok">✅ ${esc(node.name)} – klart! Vidare uppåt…</span>`;
        ni++; inRow = 0;
      }
    } else {
      status.set(node.id, 'stop');
      feed.innerHTML = `<span class="bad">${v == null ? 'Okej' : '✗ Inte riktigt'} – svaret var ${correct()}. Här börjar du i ${esc(branches[bi].br.name)}.</span>`;
      bi++; ni = 0; inRow = 0;
    }
    next();
  }
  app.querySelector('#pform').addEventListener('submit', e => { e.preventDefault(); const v = parseNum(inp.value); if (v == null) return inp.focus(); answer(v); });
  app.querySelector('#pdk').onclick = () => answer(null);

  function finish() {
    finished = true;
    renderBar();
    app.querySelector('.quick').remove();
    const placed = [...status].filter(([, s]) => s === 'done').map(([id]) => id);
    const rows = branches.map(b => {
      const newly = b.nodes.filter(n => status.get(n.id) === 'done').map(n => n.name);
      const start = b.nodes.find(n => !mathState(n.id).done);
      return `<li><strong>${b.br.icon} ${esc(b.br.name)}:</strong> ${newly.length ? `✅ ${newly.map(esc).join(', ')}` : 'inga nya steg'}
        – ${start ? `du börjar på <strong>${esc(start.name)}</strong>` : '🎉 hela grenen är klar'}</li>`;
    }).join('');
    app.querySelector('#presult').innerHTML = `<div class="result">
      <strong>${placed.length ? `🧭 Klart! ${placed.length} ${placed.length === 1 ? 'steg' : 'steg'} markerade som klara.` : '🧭 Klart! Nu vet vi var du ska börja.'}</strong>
      <ul class="misslist">${rows}</ul>
      <button class="btn" id="totree">Till trädet →</button></div>`;
    app.querySelector('#totree').onclick = onBack;
  }
  next();
}
