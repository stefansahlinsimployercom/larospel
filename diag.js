// Diagnosspel: en dold orsak, tester i steg som kostar poäng, farliga val, diagnos och åtgärd.
// Avslutas med "proffsens väg" – den smartaste testordningen för just det felet.
// Använder Store, KNOWN_AT, card, esc, stopTimer, shuffle från övriga filer.

const DIAG_START = 100, DIAG_WRONG = 20, DIAG_DANGER = 40, DIAG_HINT = 10;
const diagPk = track => track.id;
const DIAG_STEP_INFO = {
  'Observera': 'Använd dina sinnen först – titta, lyssna, känn. Det är gratis och avslöjar ofta mycket.',
  'Enkla kontroller': 'Snabba saker du kan kolla själv utan verktyg eller specialkunskap.',
  'Mät': 'Med ett mätinstrument får du säkra siffror i stället för gissningar. Tar lite längre tid.',
  'Undersök': 'Ta reda på mer – till exempel genom att kolla information från andra.',
  'Proffshjälp': 'Ett proffs hittar nästan alltid felet – men det kostar tid och pengar. Använd när de billiga testerna inte räcker.',
};
const dngTxt = n => `⛔ ${n} ${n === 1 ? "farligt val" : "farliga val"}`;
const diagKey = (c, causeId) => `${c.id}/${causeId}`;
const allTests = c => c.steps.flatMap((s, si) => s.tests.map(t => ({ ...t, cost: s.cost, step: si })));

// Orsaker som fortfarande stämmer med de svar man fått
const consistent = (c, done, truth) => c.causes.filter(k => done.every(t => t.res[k.id] === t.res[truth]));

// Proffsens väg: välj hela tiden det test som ger mest information per kostnad
function proPath(c, truth) {
  const path = [];
  let left = c.causes.map(k => k.id);
  const tests = allTests(c).filter(t => !t.danger);
  while (left.length > 1) {
    let best = null, bestScore = 0;
    tests.filter(t => !path.includes(t)).forEach(t => {
      const groups = {};
      left.forEach(k => { groups[t.res[k]] = (groups[t.res[k]] || 0) + 1; });
      const expected = Object.values(groups).reduce((s, g) => s + g * g, 0) / left.length;
      const score = (left.length - expected) / t.cost;
      if (score > bestScore) { bestScore = score; best = t; }
    });
    if (!best) break;
    path.push(best);
    left = left.filter(k => best.res[k] === best.res[truth]);
  }
  return path;
}

// ---------- Ämnessida ----------
function showDiagTrack(track) {
  stopTimer();
  const m = Store.known(diagPk(track));
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <p class="legend">Något har gått fel – ta reda på varför. Du börjar med ${DIAG_START} poäng och varje test kostar.
      Börja med det billiga, tänk efter vad svaren betyder och ställ diagnosen så tidigt du kan. Se upp för ⛔ farliga val!
      Felet slumpas varje gång – klara varje möjlig orsak felfritt ${KNOWN_AT} gånger i rad.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const box = app.querySelector('.quizzes');
  track.cases.forEach(c => {
    const kn = c.causes.filter(k => (m[diagKey(c, k.id)] || 0) >= KNOWN_AT).length;
    box.appendChild(card(`<strong>${c.icon} ${c.name}</strong><small>${c.causes.length} möjliga orsaker · ${kn === c.causes.length ? '✅ Du kan alla' : `${kn}/${c.causes.length} kan du`}</small>
      <div class="progress"><div style="width:${Math.round(100 * kn / c.causes.length)}%"></div></div>`,
      () => playDiag(track, c, () => showDiagTrack(track))));
  });
}

// ---------- Spelet ----------
function playDiag(track, c, onBack) {
  stopTimer();
  // Välj dold orsak – helst en du inte kan än
  const m = Store.known(diagPk(track));
  const unknown = c.causes.filter(k => (m[diagKey(c, k.id)] || 0) < KNOWN_AT);
  const truth = shuffle(unknown.length ? unknown : c.causes)[0].id;
  const tests = allTests(c);
  const done = [];            // utförda (ofarliga) tester
  const log = [];             // allt du gjort, i ordning
  let points = DIAG_START, dangers = 0, wrongGuesses = 0, hinted = false, actionFirstTry = true;
  const struck = new Set();   // orsaker du själv strukit / fått fel på

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${c.icon} ${c.name}</h2>
    <div class="diag-intro">${esc(c.intro)}</div>
    <div class="bar">
      <span class="stat" id="pts">🪙 ${points} p</span>
      <span class="stat small" id="dng"></span>
    </div>
    <div class="diag-layout">
      <div>
        <div id="steps"></div>
        <h3>📋 Loggbok</h3>
        <ol class="diag-log" id="log"><li class="empty">Inga tester gjorda än.</li></ol>
      </div>
      <div class="diag-side">
        <h3>🧠 Möjliga orsaker</h3>
        <p class="small">Klicka på namnet för att stryka det i dina anteckningar. Tryck <strong>Det är felet</strong> när du är säker.</p>
        <div id="causes"></div>
        <button class="btn secondary" id="hint">💡 Ledtråd (−${DIAG_HINT} p)</button>
      </div>
    </div>
    <div id="phase2"></div>
    <div class="danger-overlay" id="danger" hidden></div>`;
  app.querySelector('.back').onclick = onBack;

  const setPts = d => { points = Math.max(0, points - d); app.querySelector('#pts').textContent = `🪙 ${points} p`; };
  function renderSteps() {
    app.querySelector('#steps').innerHTML = c.steps.map((s, si) => `
      <div class="dstep"><div class="dstep-h"><span class="dnum">${si + 1}</span> ${esc(s.name)}${DIAG_STEP_INFO[s.name] ? infoBtn(s.name, `<p>${esc(DIAG_STEP_INFO[s.name])}</p>`) : ''} <span class="dcost">−${s.cost} p per test</span></div>
        <div class="dtests">${s.tests.map((t, ti) => {
          const used = log.find(l => l.t === t.t);
          return `<button class="dtest ${used ? (t.danger ? 'was-danger' : 'used') : ''}" data-s="${si}" data-t="${ti}" ${used ? 'disabled' : ''}>${used && t.danger ? '⛔ ' : used ? '✔ ' : ''}${esc(t.t)}${used && !t.danger ? `<span class="dres">→ ${esc(used.r)}</span>` : ''}</button>`;
        }).join('')}</div></div>`).join('');
  }
  function renderLog() {
    app.querySelector('#log').innerHTML = log.map(l => l.danger
      ? `<li class="ldanger">⛔ <strong>${esc(l.t)}</strong> – farligt! <small>${esc(l.why)}</small></li>`
      : l.guess ? `<li class="lguess">✗ Diagnos: <strong>${esc(l.guess)}</strong> – fel.</li>`
      : `<li>🔎 <strong>${esc(l.t)}</strong><br>→ ${esc(l.r)}</li>`).join('') || '<li class="empty">Inga tester gjorda än.</li>';
    const el = app.querySelector('#log'); el.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }
  function renderCauses() {
    app.querySelector('#causes').innerHTML = c.causes.map(k => `
      <div class="dcause ${struck.has(k.id) ? 'struck' : ''}" data-c="${k.id}">
        <span class="cname">${esc(k.n)}</span>
        <button class="btn small-btn" data-guess="${k.id}">Det är felet</button>
      </div>`).join('');
  }

  // Testklick
  app.querySelector('#steps').addEventListener('click', e => {
    const b = e.target.closest('.dtest'); if (!b || b.disabled) return;
    const t = c.steps[+b.dataset.s].tests[+b.dataset.t];
    const cost = c.steps[+b.dataset.s].cost;
    if (t.danger) {
      dangers++; setPts(DIAG_DANGER);
      log.push({ t: t.t, danger: true, why: t.why });
      app.querySelector('#dng').textContent = dngTxt(dangers);
      showDanger(t.t, t.why);
    } else {
      setPts(cost);
      done.push({ ...t, cost });
      log.push({ t: t.t, r: t.res[truth] });
    }
    renderSteps(); renderLog();
  });

  function showDanger(t, why, after) {
    const ov = app.querySelector('#danger');
    ov.hidden = false;
    ov.innerHTML = `<div class="danger-box">
      <div class="danger-title">⛔ FARLIGT!</div>
      <div class="danger-what">"${esc(t)}"</div>
      <p>${esc(why)}</p>
      <p class="danger-cost">−${DIAG_DANGER} poäng</p>
      <button class="btn" id="ok-danger">Jag förstår</button></div>`;
    ov.querySelector('#ok-danger').onclick = () => { ov.hidden = true; if (after) after(); };
    ov.querySelector('#ok-danger').focus();
  }

  // Orsaker: stryk / gissa
  app.querySelector('#causes').addEventListener('click', e => {
    const g = e.target.closest('[data-guess]');
    if (g) return guess(g.dataset.guess);
    const row = e.target.closest('.dcause');
    if (row && !row.classList.contains('wrong')) { struck.has(row.dataset.c) ? struck.delete(row.dataset.c) : struck.add(row.dataset.c); renderCauses(); }
  });
  function guess(id) {
    if (id === truth) return diagnosed();
    wrongGuesses++; setPts(DIAG_WRONG); struck.add(id);
    log.push({ guess: c.causes.find(k => k.id === id).n });
    renderCauses(); renderLog();
    app.querySelector(`.dcause[data-c="${id}"]`)?.classList.add('wrong');
  }

  app.querySelector('#hint').onclick = () => {
    hinted = true; setPts(DIAG_HINT);
    const ok = consistent(c, done, truth).map(k => k.id);
    const toStrike = c.causes.filter(k => !ok.includes(k.id) && !struck.has(k.id));
    if (done.length && toStrike.length) {
      toStrike.forEach(k => struck.add(k.id));
      renderCauses();
      log.push({ t: '💡 Ledtråd', r: `Utifrån dina tester kan du stryka: ${toStrike.map(k => k.n).join(', ')}.` });
    } else {
      const next = proPath(c, truth).find(t => !done.some(d => d.t === t.t));
      log.push({ t: '💡 Ledtråd', r: next ? `Ett smart nästa test: "${next.t}".` : 'Du har tillräckligt med information – vilken orsak stämmer med alla svar?' });
    }
    renderLog();
  };

  // ---------- Fas 2: åtgärd ----------
  function diagnosed() {
    app.querySelectorAll('.dtest, [data-guess], #hint').forEach(b => b.disabled = true);
    app.querySelector(`.dcause[data-c="${truth}"]`).classList.add('right');
    const act = c.actions[truth];
    const opts = shuffle([{ t: act.a, ok: true }, ...act.wrong.map(t => ({ t })), { t: act.danger.t, danger: true }]);
    const p2 = app.querySelector('#phase2');
    p2.innerHTML = `<div class="rnote ok">✅ <strong>Rätt diagnos: ${esc(c.causes.find(k => k.id === truth).n)}</strong></div>
      <h3>🛠️ Hur löser du det?</h3>
      <div class="vopts col">${opts.map((o, i) => `<button class="vopt" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`;
    p2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    p2.addEventListener('click', e => {
      const b = e.target.closest('.vopt'); if (!b || b.disabled) return;
      const o = opts[+b.dataset.i];
      if (o.ok) { b.classList.add('ok'); p2.querySelectorAll('.vopt').forEach(x => x.disabled = true); finish(); return; }
      actionFirstTry = false; b.disabled = true;
      if (o.danger) { b.classList.add('danger'); dangers++; setPts(DIAG_DANGER); app.querySelector('#dng').textContent = dngTxt(dangers); showDanger(o.t, act.danger.why); }
      else { b.classList.add('bad'); setPts(5); }
    });
  }

  function finish() {
    const perfect = !dangers && !wrongGuesses && !hinted && actionFirstTry;
    const fresh = Store.updateWords(diagPk(track), [{ key: diagKey(c, truth), ok: perfect }]);
    const stars = points >= 80 ? 3 : points >= 50 ? 2 : points > 0 ? 1 : 0;
    Store.addAttempt({
      quiz: `${track.id}/${c.id}`, title: `${c.icon} ${c.name}`, at: new Date().toISOString(),
      score: points, total: DIAG_START, secs: 0,
      missed: dangers ? [{ q: c.name, a: `${dangers} farliga val` }] : [],
    });
    const pro = proPath(c, truth);
    const proCost = pro.reduce((s, t) => s + t.cost, 0);
    const mine = log.filter(l => !l.guess && !l.danger && l.t !== '💡 Ledtråd');
    app.querySelector('#phase2').insertAdjacentHTML('beforeend', `
      <div class="result stars-result">
        <div class="bigstars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <strong>${points} poäng</strong> ${dangers ? `· <span class="dng-txt">${dngTxt(dangers)}</span>` : '· inga farliga val 👍'}
        ${perfect ? '<br>🎉 Felfritt felsökt!' : ''}${fresh ? '<br>📚 Det här felet kan du nu!' : ''}
        <div class="paths">
          <div><h4>Din väg (${mine.length} test)</h4><ol>${mine.map(l => `<li>${esc(l.t)}</li>`).join('') || '<li>Inga tester – ren gissning!</li>'}</ol></div>
          <div><h4>🏅 Proffsens väg (${pro.length} test, −${proCost} p)</h4><ol>${pro.map(t => `<li>${esc(t.t)} <small>→ ${esc(t.res[truth])}</small></li>`).join('')}</ol></div>
        </div>
        <button class="btn" id="again">Nytt fel ↻</button>
      </div>`);
    app.querySelector('#again').onclick = () => playDiag(track, c, onBack);
  }

  renderSteps(); renderCauses();
}

// ---------- Statistik på resultatsidan ----------
function diagStatsHtml() {
  return TRACKS.filter(t => t.type === 'diag').map(track => {
    const m = Store.load().known[diagPk(track)];
    if (!m) return '';
    const rows = track.cases.map(c => `<tr><td>${c.icon} ${esc(c.name)}</td><td>${c.causes.map(k => {
      const s = m[diagKey(c, k.id)] || 0;
      return `<span class="chip ${s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : ''}">${esc(k.n)}</span>`;
    }).join(' ')}</td></tr>`).join('');
    return `<h3>${track.icon} ${track.name}</h3><table class="vocab">${rows}</table>`;
  }).join('');
}
