// Fysikuppgift steg för steg: 1 Huvudlag → 2 Formel → 3 Storheter → 4 Räkna i steg → 5 Enhet.
// Körs från mattens trädmotor (math.js) när en uppgift har task.phys.
// Använder mathRecord, streakHtml, nextHtml, wireNext, doneMsg, fmtNum, parseNum, esc, shuffle, stopTimer.

const PHYS_STEPS = ['Huvudlag', 'Formel', 'Storheter', 'Räkna', 'Enhet'];

function playPhys(track, node, onBack, task) {
  stopTimer();
  const P = task.phys;
  const laws = shuffle(P.laws), formulas = shuffle(P.formulas), chips = shuffle(P.chips), units = shuffle(P.units);
  let stage = 0, slots = Array(P.formula.n).fill(null), chain = [], ci = 0, mistakes = 0, helped = null;
  const lines = [];
  const close = (a, b) => Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.005);
  const qHtml = esc(P.q).replace(/\[\[(.+?)\]\]/g, '<b class="num">$1</b>');

  app.innerHTML = `
    <button class="back">← Trädet</button>
    <h2>${esc(node.name)}</h2>
    <div class="bar"><span class="stat small" id="streak">${streakHtml(node)}</span></div>
    <div id="nextbar">${nextHtml(track, node)}</div>
    <div class="story">${qHtml}</div>
    <div class="stepper" id="stepper"></div>
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
  const note = (h, cls = '') => { msg.innerHTML = h ? `<p class="note ${cls}">${h}</p>` : ''; };
  const tplHtml = (vals, asSlots) => esc(P.formula.tpl).replace(/\{(\d)\}/g, (_, i) => asSlots
    ? `<span class="slot ${vals[i] != null ? 'filled' : ''}" data-s="${i}">${vals[i] != null ? fmtNum(vals[i]) : '?'}</span>`
    : fmtNum(vals[i]));
  const lhs = P.formula.label.split('=')[0].trim();

  function render() {
    app.querySelector('#stepper').innerHTML = PHYS_STEPS.map((s, i) =>
      `<div class="rstep ${i === stage ? 'cur' : i < stage ? 'done' : ''}"><span class="rnum">${i < stage ? '✔' : i + 1}</span> ${s}</div>`).join('<span class="rarrow">→</span>');
    let cur = '', items = [];
    if (stage === 0) { cur = 'Vilken lag eller princip gäller? <span class="slot wide">?</span>'; items = laws.map(l => l.n); }
    if (stage === 1) { cur = 'Vilken formel – med rätt storhet ensam? <span class="slot wide">?</span>'; items = formulas.map(f => f.label); }
    if (stage === 2) { cur = `${lhs} = ${tplHtml(slots, true)}`; items = chips.map(c => c.label); }
    if (stage === 3) {
      const st = chain[ci];
      cur = `${ci === chain.length - 1 ? lhs + ' = ' : ''}${esc(st.e)} = <input id="calc" autocomplete="off">`;
    }
    if (stage === 4) { cur = `${lhs} = ${fmtNum(roundAns())} <span class="slot">?</span>`; items = units; }
    work.innerHTML = lines.map(l => `<div class="eqrow done-line">${l}</div>`).join('') + (stage < 5 ? `<div class="eqrow current drop">${cur}</div>` : '');
    deckEl.innerHTML = items.map((t, i) => `<button class="opcard ${stage < 2 ? 'wide' : ''}" draggable="true" data-i="${i}">${esc(t)}${stage === 0 && laws[i].more ? ' ' + infoBtn(laws[i].n, `<p>${esc(laws[i].more)}</p>`) : ''}</button>`).join('');
    app.querySelector('#check').style.display = stage === 2 || stage === 3 ? '' : 'none';
    const zones = stage === 2 ? [...work.querySelectorAll('.slot')] : [...work.querySelectorAll('.drop')];
    zones.forEach(z => {
      z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', () => z.classList.remove('over'));
      z.addEventListener('drop', e => { e.preventDefault(); pick(+e.dataTransfer.getData('text/plain'), z.dataset.s != null ? +z.dataset.s : null); });
    });
    work.querySelectorAll('.slot.filled').forEach(z => z.onclick = () => { slots[+z.dataset.s] = null; render(); });
    const calc = work.querySelector('#calc');
    if (calc) { calc.focus(); calc.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }); }
  }
  const roundAns = () => Math.round(P.answer * 100) / 100;
  deckEl.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.dataset.i));
  deckEl.addEventListener('click', e => { const b = e.target.closest('.opcard'); if (b) pick(+b.dataset.i, null); });

  function pick(i, slotIdx) {
    if (stage === 0) {
      const l = laws[i];
      if (l.id === P.law) { lines.push(`Lag: <strong>${esc(l.n)}</strong>`); stage = 1; note('Rätt område! Vilken formel – och vilken omskrivning – ger det vi söker?'); }
      else { mistakes++; note(`✗ <strong>${esc(l.n)}</strong> passar inte här. Vad är det frågan frågar efter?`, 'bad'); }
    } else if (stage === 1) {
      const f = formulas[i];
      if (f.id === P.formula.id) { lines.push(`Formel: <strong>${esc(f.label)}</strong>`); stage = 2; note('Dra in rätt värden från texten. Alla värden behövs inte – och kolla enheterna!'); }
      else {
        mistakes++;
        const what = f.what || `den formeln räknar ut ${f.label.split('=')[0].trim()} – men vi söker ${P.ask}`;
        note(`✗ <strong>${esc(f.label)}</strong>: ${esc(what)}.`, 'bad');
      }
    } else if (stage === 2) {
      const at = slotIdx != null ? slotIdx : slots.indexOf(null);
      if (at >= 0) slots[at] = chips[i].v;
    } else if (stage === 4) {
      if (units[i] === P.unit) { lines.push(`${lhs} = <strong>${fmtNum(roundAns())} ${esc(P.unit)}</strong>`); stage = 5; render(); return finish(); }
      mistakes++; note(`✗ ${esc(units[i])} är inte rätt enhet för ${esc(P.ask)}.`, 'bad');
    }
    render();
  }

  function check() {
    if (stage === 2) {
      if (slots.includes(null)) return note('Fyll alla rutor först.');
      if (close(P.formula.fn(...slots), P.answer)) {
        chain = P.formula.chain(...slots); ci = 0; stage = 3;
        if (chain.length > 1) lines.push(`${lhs} = ${tplHtml(slots)}`); // insättningen – bara när det blir flera räknesteg
        note(chain.length > 1 ? `Räkna i ${chain.length} steg.` : 'Räkna ut svaret.');
      } else {
        mistakes++;
        const wrongUnit = slots.some(v => P.chips.find(c => c.v === v && /\bg\b|cm/.test(c.label)));
        note(wrongUnit ? '✗ Kolla enheterna – formeln vill ha SI-enheter (kg, m).' : '✗ Det stämmer inte – vilket värde hör till vilken storhet?', 'bad');
      }
      return render();
    }
    if (stage === 3) {
      const inp = work.querySelector('#calc');
      const v = parseNum(inp.value);
      if (v != null && close(v, chain[ci].v)) {
        lines.push(`${ci === chain.length - 1 ? lhs + ' = ' : ''}${esc(chain[ci].e)} = <strong>${fmtNum(chain[ci].v)}</strong>`);
        ci++;
        if (ci >= chain.length) { stage = 4; note('Vilken enhet har svaret?'); }
        else note(`Bra! Steg ${ci + 1} av ${chain.length}.`);
      } else { mistakes++; inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); note('✗ Räkna en gång till.', 'bad'); }
      return render();
    }
  }
  app.querySelector('#check').onclick = check;

  app.querySelector('#hint').onclick = () => {
    helped ||= 'hint';
    const glow = i => deckEl.querySelector(`[data-i="${i}"]`)?.classList.add('glow');
    if (stage === 0) { glow(laws.findIndex(l => l.id === P.law)); note('💡 Titta på vad som söks och vilka storheter som är givna.'); }
    if (stage === 1) { glow(formulas.findIndex(f => f.id === P.formula.id)); note(`💡 Vi söker ${esc(P.ask)} – den ska stå ensam till vänster.`); }
    if (stage === 2) { slots = P.sol.slice(); render(); note('💡 Värdena är ifyllda – tryck Kontrollera.'); }
    if (stage === 3) note(`💡 ${esc(chain[ci].e)} = ${fmtNum(chain[ci].v)}`);
    if (stage === 4) { glow(units.indexOf(P.unit)); note('💡 Den markerade enheten.'); }
  };
  app.querySelector('#show').onclick = () => {
    helped = 'solution';
    lines.length = 0;
    lines.push(`Lag: <strong>${esc(P.laws.find(l => l.id === P.law).n)}</strong>`);
    lines.push(`Formel: <strong>${esc(P.formula.label)}</strong>`);
    slots = P.sol.slice();
    lines.push(`${lhs} = ${tplHtml(slots)}`);
    const ch = P.formula.chain(...slots);
    ch.forEach((st, k) => lines.push(`${k === ch.length - 1 ? lhs + ' = ' : ''}${esc(st.e)} = <strong>${fmtNum(st.v)}</strong>`));
    lines.push(`${lhs} = <strong>${fmtNum(roundAns())} ${esc(P.unit)}</strong>`);
    stage = 5; render(); finish();
  };

  function finish() {
    const result = helped === 'solution' ? 'fail' : (helped || mistakes) ? 'help' : 'ok';
    const { justDone } = mathRecord(node.id, result);
    work.lastElementChild.classList.add('solved');
    app.querySelectorAll('.tools button').forEach(b => b.disabled = true);
    const head = result === 'ok' ? '✅ Felfritt löst – lag, formel, storheter, uträkning och enhet!'
      : result === 'help' ? `✅ Löst${mistakes ? ` med ${mistakes} fel` : ''}${helped ? ' och ledtråd' : ''} – räknas inte till "i rad", men nollställer inte heller.`
      : 'Här är lösningen. Prova en ny uppgift av samma typ!';
    const nh = nextHtml(track, node);
    app.querySelector('#nextbar').innerHTML = '';
    msg.innerHTML = `<div class="result">${head}${justDone ? doneMsg(track, node) : ''}
      <br><button class="btn ${nh ? 'secondary' : ''}" id="next">Nästa uppgift ↵</button></div>${nh}`;
    wireNext(msg, track, onBack);
    app.querySelector('#streak').innerHTML = streakHtml(node);
    const next = app.querySelector('#next');
    next.onclick = () => playSteps(track, node, onBack);
    (justDone && msg.querySelector('[data-go]') || next).focus();
  }

  render();
  note('Läs uppgiften. Vilket område av fysiken handlar det om?');
}
