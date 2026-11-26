// Uppskattningar: gissa ett tal, få poäng efter hur nära (storleksordning) och ett visuellt facit:
// en skala med din gissning mot svaret, uträkningen steg för steg och kunskapen som leder dit.
// Använder bluffRef (bluff.js), Store, KNOWN_AT, parseNum, esc, shuffle, card, stopTimer, infoBtn.

const EST_ROUND = 6;
const estAnswer = q => (typeof q.answer === 'function' ? q.answer() : q.answer);
const estSteps = q => q.steps.map(s => (typeof s === 'function' ? s() : s));
const estReady = q => q.refs.map(bluffRef).filter(r => r.ok).length;
const nice = v => {
  const a = Math.abs(v);
  // Stora tal: tre värdesiffror (en uppskattning ska inte låtsas vara exakt)
  const r = a >= 1000 ? Number(v.toPrecision(3)) : a >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  return r.toLocaleString('sv-SE');
};
// Hur nära? r = hur många gånger fel (alltid ≥ 1)
function estGrade(guess, ans) {
  if (!(guess > 0)) return { r: Infinity, pts: 0, label: 'Ingen uppskattning', cls: 'bad' };
  const r = Math.max(guess / ans, ans / guess);
  if (r <= 1.1) return { r, pts: 100, label: '🎯 Mitt i prick!', cls: 'ok' };
  if (r <= 1.5) return { r, pts: 75, label: '🔥 Mycket nära!', cls: 'ok' };
  if (r <= 2) return { r, pts: 50, label: '👍 Nära – inom en faktor 2', cls: 'ok' };
  if (r <= 10) return { r, pts: 20, label: '📏 Rätt storleksordning', cls: 'mid' };
  return { r, pts: 0, label: '🙈 Fel storleksordning', cls: 'bad' };
}

// Skala (logaritmisk): svaret i mitten, ±100 gånger åt vardera håll
function estScale(guess, ans) {
  const pos = v => Math.min(100, Math.max(0, 50 + 25 * Math.log10(v / ans))); // ×10 = 25 %
  const g = guess > 0 ? pos(guess) : null;
  return `<div class="escale">
    <div class="ezone z10"></div><div class="ezone z2"></div>
    <div class="emark ans" style="left:50%"><span>Svar<br><strong>${nice(ans)}</strong></span></div>
    ${g != null ? `<div class="emark you" style="left:${g}%"><span>Du<br><strong>${nice(guess)}</strong></span></div>` : ''}
    <div class="elab" style="left:0">÷100</div><div class="elab" style="left:25%">÷10</div><div class="elab" style="left:75%">×10</div><div class="elab" style="left:100%">×100</div>
  </div><p class="small center">Grönt område = inom en faktor 2 · ljusgrönt = rätt storleksordning (inom en faktor 10)</p>`;
}

function showEstimateTrack(track) {
  stopTimer();
  const m = Store.known('uppskatta');
  const kn = track.questions.filter(q => (m[q.id] || 0) >= KNOWN_AT).length;
  const ready = track.questions.filter(q => estReady(q) === q.refs.length).length;
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <p class="legend">Frågor som kombinerar kunskap från flera ämnen. Du behöver inte svara exakt – du får poäng efter hur nära du kommer.
      Facit visar uträkningen och vilka saker du lärt dig på olika ställen i spelet som leder fram till svaret.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelector('.quizzes').appendChild(card(`<strong>🎯 Uppskatta!</strong>
    <small>${track.questions.length} frågor · ${kn === track.questions.length ? '✅ Du kan alla' : `${kn} klarade`}</small>
    <small>🔓 ${ready} bygger helt på sådant du redan visat att du kan</small>
    <div class="progress"><div style="width:${Math.round(100 * kn / track.questions.length)}%"></div></div>`,
    () => playEstimate(track, () => showEstimateTrack(track))));
}

function playEstimate(track, onBack) {
  stopTimer();
  const m = Store.known('uppskatta');
  const round = shuffle(track.questions).sort((a, b) =>
    ((m[a.id] || 0) >= KNOWN_AT) - ((m[b.id] || 0) >= KNOWN_AT) || estReady(b) / b.refs.length - estReady(a) / a.refs.length).slice(0, EST_ROUND);
  const results = [];
  let i = 0, points = 0;
  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🎯 Uppskatta! <small class="lvl" id="pts">0 p</small></h2>
    <div class="dots" id="dots"></div>
    <div id="stage"></div><div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const dots = () => app.querySelector('#dots').innerHTML = round.map((_, k) =>
    `<span class="fdot ${k < results.length ? (results[k] ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></span>`).join('');

  function show() {
    const q = round[i], refs = q.refs.map(bluffRef), ready = refs.every(r => r.ok);
    let hinted = false;
    dots();
    const stage = app.querySelector('#stage'), msg = app.querySelector('#msg');
    msg.innerHTML = '';
    stage.innerHTML = `
      <div class="symptom"><span class="semo">🎯</span><div><div class="slabel">${ready ? '🔓 Du har redan visat att du kan allt som behövs' : 'Uppskatta'}</div>
        <div class="stext">${esc(q.q)}</div></div></div>
      <form class="estform" id="ef"><input id="guess" inputmode="decimal" autocomplete="off" placeholder="Din uppskattning"> <span class="eunit">${esc(q.unit)}</span>
        <button class="btn" type="submit">Gissa</button>
        <button class="btn secondary" type="button" id="ehint">💡 Vad behöver jag veta?</button></form>
      <div id="ehintbox"></div>`;
    const inp = stage.querySelector('#guess');
    inp.focus();
    stage.querySelector('#ehint').onclick = () => {
      hinted = true;
      stage.querySelector('#ehintbox').innerHTML = `<div class="rnote"><strong>💡 Det här behöver du:</strong>
        ${refs.map(r => `<div class="kref">${r.ok ? '✅' : '📖'} <strong>${esc(r.label)}</strong> <span class="small">${esc(r.where)}</span>${r.info ? infoBtn(r.label, r.info) : ''}</div>`).join('')}
        <span class="small">Ledtråden halverar poängen för frågan.</span></div>`;
    };
    stage.querySelector('#ef').addEventListener('submit', e => {
      e.preventDefault();
      const raw = inp.value.replace(/\s/g, '').replace(/[kK]$/, '000');
      const guess = parseNum(raw);
      if (guess == null) { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); return; }
      const ans = estAnswer(q), g = estGrade(guess, ans);
      const pts = hinted ? Math.round(g.pts / 2) : g.pts;
      const ok = g.r <= 2 && !hinted;
      points += pts; results.push(ok); dots();
      app.querySelector('#pts').textContent = `${points} p`;
      stage.querySelectorAll('#ef input, #ef button').forEach(x => x.disabled = true);
      msg.innerHTML = `<div class="rnote ${g.cls === 'ok' ? 'ok' : g.cls === 'bad' ? 'bad' : ''}">
        <strong>${g.label}</strong> <span class="small">(+${pts} p${hinted ? ', halverat för ledtråd' : ''}${isFinite(g.r) && g.r > 1.1 ? ` · ${nice(g.r)} gånger fel` : ''})</span>
        ${estScale(guess, ans)}
        <div class="efacit">
          <div class="eflow">${refs.map(r => `<div class="ebox ${r.ok ? 'ok' : ''}">${r.ok ? '✅' : '📖'} ${esc(r.label)}<div class="small">${esc(r.where)}</div></div>`).join('<div class="eplus">+</div>')}
            <div class="earrow">→</div><div class="ebox ans">🎯 ${nice(ans)} ${esc(q.unit)}</div></div>
          <div class="small"><strong>Uträkningen:</strong></div>
          <ol class="esteps">${estSteps(q).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
          ${ready ? '<p class="small">💡 Allt det här har du redan visat att du kan – i olika delar av spelet. Du visste mer än du trodde!</p>'
            : '<p class="small">📖 Det som saknar bock kan du öva på i respektive ämne – då blir nästa uppskattning lättare.</p>'}
        </div>
        <button class="btn" id="nexte">${i + 1 < round.length ? 'Nästa fråga →' : 'Se resultatet →'}</button></div>`;
      const nb = msg.querySelector('#nexte');
      nb.onclick = () => { i++; i < round.length ? show() : finish(); };
      nb.focus();
    });
  }
  function finish() {
    const score = results.filter(Boolean).length;
    const fresh = Store.updateWords('uppskatta', round.map((q, k) => ({ key: q.id, ok: results[k] })));
    Store.addAttempt({ quiz: 'uppskatta', title: '🎯 Uppskattningar', at: new Date().toISOString(), score, total: round.length, secs: 0,
      missed: round.filter((_, k) => !results[k]).map(q => ({ q: q.q, a: `${nice(estAnswer(q))} ${q.unit}` })) });
    dots();
    app.querySelector('#stage').innerHTML = `<div class="result"><strong>${score === round.length ? '🎉 Alla inom en faktor 2!' : 'Klart!'}</strong>
      ${score} av ${round.length} inom en faktor 2 · <strong>${points} poäng</strong>
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny fråga' : fresh + ' nya frågor'} som du nu kan!` : ''}
      <br><button class="btn" id="again">Kör igen</button></div>`;
    app.querySelector('#msg').innerHTML = '';
    app.querySelector('#again').onclick = () => playEstimate(track, onBack);
  }
  show();
}

function estimateStatsHtml() {
  const t = TRACKS.find(x => x.type === 'estimate'), m = Store.load().known.uppskatta;
  if (!t || !m) return '';
  const kn = t.questions.filter(q => (m[q.id] || 0) >= KNOWN_AT).length;
  return `<h3>${t.icon} ${t.name}</h3><p>${kn} av ${t.questions.length} uppskattningsfrågor klarar du inom en faktor 2.</p>`;
}
