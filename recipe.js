// Receptspel: 1 Ingredienser → 2 Arbetsgång → 3 Värden → 4 Klart när?
// Varje steg som klaras utan fel ger en ⭐. Ett recept räknas som "kan" efter KNOWN_AT felfria rundor i rad.
// Använder Store, KNOWN_AT, card, esc, stopTimer, shuffle, inOrderSet från övriga filer.

const RECIPE_STEPS = ['Ingredienser', 'Arbetsgång', 'Värden', 'Klart när?'];
const recipePk = track => track.id;

const RECIPE_MODES = { laga: '👩‍🍳 Laga', fel: '🔍 Vad gick fel?' };
const faultPk = track => track.id + '/fel';
const faultKey = (rec, f) => `${rec.id}/${f.sym}`;
function faultProgress(track, recs) {
  const m = Store.known(faultPk(track));
  const all = recs.flatMap(r => r.faults.map(f => faultKey(r, f)));
  return { known: all.filter(k => (m[k] || 0) >= KNOWN_AT).length, total: all.length };
}

function showRecipeTrack(track) {
  stopTimer();
  const modeKey = track.id + '-mode';
  let mode = Store.getSetting(modeKey) || 'laga';
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar"><div class="modes">${Object.entries(RECIPE_MODES).map(([k, n]) => `<button data-mode="${k}">${n}</button>`).join('')}</div></div>
    <p class="legend" id="modehelp"></p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; Store.setSetting(modeKey, mode); render(); });

  function render() {
    app.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const box = app.querySelector('.quizzes');
    box.innerHTML = '';
    const back = () => showRecipeTrack(track);
    if (mode === 'laga') {
      app.querySelector('#modehelp').textContent = `Fyra steg per recept: ${RECIPE_STEPS.map((s, i) => `${i + 1}. ${s}`).join(' → ')}. Varje felfritt steg ger en ⭐. Klara receptet felfritt ${KNOWN_AT} gånger i rad så kan du det.`;
      const m = Store.known(recipePk(track));
      const best = Store.getSetting(track.id + '-stars') || {};
      track.recipes.forEach(r => {
        const s = m[r.id] || 0;
        const stars = best[r.id] != null ? '⭐'.repeat(best[r.id]) + '☆'.repeat(4 - best[r.id]) : '☆☆☆☆';
        const status = s >= KNOWN_AT ? '✅ Du kan receptet' : s > 0 ? `${s}/${KNOWN_AT} felfria i rad` : 'Inte provat felfritt än';
        box.appendChild(card(`<strong>${r.icon} ${r.name}</strong><small>${esc(r.desc)}</small><small>Bästa: ${stars} · ${status}</small>`,
          () => playRecipe(track, r, back)));
      });
    } else {
      app.querySelector('#modehelp').textContent = `Något blev fel – vad var orsaken? Ställ diagnosen och lär dig hur du undviker felet. Rätt ${KNOWN_AT} gånger i rad så kan du felet.`;
      const withFaults = track.recipes.filter(r => r.faults && r.faults.length);
      const cardFor = (title, sub, recs) => {
        const p = faultProgress(track, recs);
        box.appendChild(card(`<strong>${title}</strong><small>${sub}</small><small>${p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} fel kan du`}</small>
          <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>`,
          () => playFaults(track, recs, title, back)));
      };
      withFaults.forEach(r => cardFor(`${r.icon} ${r.name}`, `${r.faults.length} vanliga fel`, [r]));
      cardFor('🎲 Blandat', 'Fel från alla recept', withFaults);
    }
  }
  render();
}

// ---------- Vad gick fel? ----------
function playFaults(track, recs, title, onBack) {
  stopTimer();
  const pk = faultPk(track);
  const m = Store.known(pk);
  // Okända fel först (blandade), sedan kända – max 8 per runda
  const all = shuffle(recs.flatMap(r => r.faults.map(f => ({ r, f }))));
  const items = [...all.filter(x => (m[faultKey(x.r, x.f)] || 0) < KNOWN_AT), ...all.filter(x => (m[faultKey(x.r, x.f)] || 0) >= KNOWN_AT)].slice(0, 8);
  const results = [];
  let i = 0;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🔍 Vad gick fel? <small class="lvl">${title}</small></h2>
    <div class="dots" id="dots"></div>
    <div id="stage"></div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  let stage = app.querySelector('#stage');
  const msg = app.querySelector('#msg');
  const note = (h, cls = '') => { msg.innerHTML = h ? `<div class="rnote ${cls}">${h}</div>` : ''; };
  const renderDots = () => {
    app.querySelector('#dots').innerHTML = items.map((_, k) =>
      `<span class="fdot ${k < results.length ? (results[k] ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></span>`).join('');
  };

  function show() {
    const { r, f } = items[i];
    let mistakes = 0;
    const fresh = document.createElement('div'); fresh.id = 'stage'; stage.replaceWith(fresh); stage = fresh;
    note('');
    renderDots();
    const opts = shuffle([f.cause, ...f.wrong]);
    stage.innerHTML = `
      <div class="symptom"><span class="semo">${f.e || '❓'}</span>
        <div><div class="slabel">${r.icon} ${esc(r.name)} · symptom</div><div class="stext">${esc(f.sym)}</div></div></div>
      <h3>Vad är den troligaste orsaken?</h3>
      <div class="vopts col">${opts.map(o => `<button class="vopt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="tools help">
        <button class="btn secondary" data-help="hint">💡 Ledtråd</button>
        <button class="btn secondary" data-help="facit">📖 Visa svaret</button>
        <span class="small">räknas inte som rätt</span></div>`;
    const buttons = () => [...stage.querySelectorAll('.vopt')];
    function solved() {
      const ok = mistakes === 0;
      results.push(ok);
      buttons().forEach(b => { b.disabled = true; if (b.dataset.o === f.cause) b.classList.add('ok'); });
      stage.querySelector('.tools.help').remove();
      renderDots();
      note(`<strong>${ok ? '✅ Rätt diagnos!' : 'Orsaken:'}</strong> ${esc(f.cause)}.
        <br><small>${esc(f.why)}</small>
        <div class="fix">💡 <strong>Så undviker du det:</strong> ${esc(f.fix)}</div>
        <button class="btn" id="nextf">${i + 1 < items.length ? 'Nästa fel →' : 'Se resultatet →'}</button>`, ok ? 'ok' : '');
      const nb = msg.querySelector('#nextf');
      nb.onclick = () => { i++; i < items.length ? show() : finish(); };
      nb.focus();
    }
    stage.addEventListener('click', e => {
      const b = e.target.closest('.vopt'); if (!b || b.disabled) return;
      if (b.dataset.o === f.cause) solved();
      else { mistakes++; b.classList.add('bad'); b.disabled = true; note('✗ Nej, det är inte den troligaste orsaken – försök igen.', 'bad'); }
    });
    stage.querySelector('[data-help=hint]').onclick = () => {
      mistakes++;
      const wrong = buttons().filter(b => !b.disabled && b.dataset.o !== f.cause);
      if (wrong.length > 1) { wrong[0].classList.add('bad'); wrong[0].disabled = true; note('💡 Strök ett alternativ som inte stämmer.'); }
      else solved();
    };
    stage.querySelector('[data-help=facit]').onclick = () => { mistakes++; solved(); };
  }

  function finish() {
    const score = results.filter(Boolean).length;
    const fresh = Store.updateWords(pk, items.map((x, k) => ({ key: faultKey(x.r, x.f), ok: results[k] })));
    Store.addAttempt({
      quiz: `${track.id}/fel/${recs.length > 1 ? 'blandat' : recs[0].id}`, title: `🔍 Vad gick fel? ${title}`, at: new Date().toISOString(),
      score, total: items.length, secs: 0,
      missed: items.filter((_, k) => !results[k]).map(x => ({ q: x.f.sym, a: x.f.cause })),
    });
    renderDots();
    stage.innerHTML = `<div class="result">
      <strong>${score === items.length ? '🎉 Alla diagnoser rätt – du är en riktig felsökare!' : 'Klart!'}</strong> ${score} av ${items.length} rätt på första försöket.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 nytt fel' : fresh + ' nya fel'} som du nu kan!` : ''}
      ${score < items.length ? `<ul class="misslist">${items.filter((_, k) => !results[k]).map(x =>
        `<li><strong>${esc(x.f.sym)}</strong> → ${esc(x.f.cause)}<br><span class="small">💡 ${esc(x.f.fix)}</span></li>`).join('')}</ul>` : ''}
      <br><button class="btn" id="again">Kör igen</button></div>`;
    note('');
    stage.querySelector('#again').onclick = () => playFaults(track, recs, title, onBack);
  }

  show();
}

function playRecipe(track, rec, onBack) {
  stopTimer();
  let step = 0;
  const stars = [];        // true/false per steg
  let mistakes = 0;        // fel i aktuellt steg

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${rec.icon} ${rec.name}</h2>
    <p>${esc(rec.desc)}</p>
    <div class="stepper" id="stepper"></div>
    <div id="stage"></div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  let stage = app.querySelector('#stage');
  const msg = app.querySelector('#msg');
  // Ny tom yta för varje steg, så att lyssnare från förra steget inte ligger kvar
  const resetStage = () => { const n = document.createElement('div'); n.id = 'stage'; stage.replaceWith(n); stage = n; };
  const note = (h, cls = '') => { msg.innerHTML = h ? `<div class="rnote ${cls}">${h}</div>` : ''; };

  function renderStepper() {
    app.querySelector('#stepper').innerHTML = RECIPE_STEPS.map((s, i) => `
      <div class="rstep ${i === step ? 'cur' : i < step ? 'done' : ''}">
        <span class="rnum">${i < step ? (stars[i] ? '⭐' : '✔') : i + 1}</span> ${s}
      </div>`).join('<span class="rarrow">→</span>');
  }
  function nextStep() {
    stars[step] = mistakes === 0;
    step++; mistakes = 0;
    note('');
    renderStepper();
    [stepIngredients, stepProcess, stepValues, stepDone, finish][step]();
  }
  const nextBtn = label => `<button class="btn" id="nextstep">${label} →</button>`;
  // Ledtråd/facit längst ner i varje steg. Båda kostar stjärnan för steget – men man kommer alltid vidare.
  function helpBar(onHint, onFacit) {
    stage.insertAdjacentHTML('beforeend', `<div class="tools help">
      <button class="btn secondary" data-help="hint">💡 Ledtråd</button>
      <button class="btn secondary" data-help="facit">📖 Visa facit</button>
      <span class="small">kostar stjärnan för steget</span></div>`);
    stage.querySelector('[data-help=hint]').onclick = () => { mistakes++; onHint(); };
    stage.querySelector('[data-help=facit]').onclick = () => { mistakes++; onFacit(); };
  }
  const hideHelp = () => stage.querySelector('.tools.help')?.remove();

  // ---------- 1. Ingredienser ----------
  function stepIngredients() {
    resetStage();
    const all = shuffle([...rec.ingredients.map(i => ({ ...i, ok: true })), ...rec.decoys.map(d => ({ ...d, ok: false }))]);
    const picked = new Set();
    stage.innerHTML = `
      <h3>1. Vilka ingredienser behövs?</h3>
      <p>Klicka eller dra ingredienserna till bunken. Klicka igen för att ta bort.</p>
      <div class="pantry" id="pantry"></div>
      <div class="bowl" id="bowl"><span class="bowl-label">🥣 Bunken</span><div id="inbowl"></div></div>
      <button class="btn" id="check">Kontrollera</button>`;
    const pantry = stage.querySelector('#pantry'), inbowl = stage.querySelector('#inbowl'), bowl = stage.querySelector('#bowl');
    const chip = (it, i) => `<button class="ing" draggable="true" data-i="${i}">${it.e} ${esc(it.n)}</button>`;
    function render() {
      pantry.innerHTML = all.map((it, i) => picked.has(i) ? '' : chip(it, i)).join('');
      inbowl.innerHTML = [...picked].map(i => chip(all[i], i)).join('') || '<span class="empty">Tom – lägg i det som behövs</span>';
    }
    stage.addEventListener('click', e => {
      const b = e.target.closest('.ing'); if (!b || b.classList.contains('locked')) return;
      const i = +b.dataset.i; picked.has(i) ? picked.delete(i) : picked.add(i); render();
    });
    stage.addEventListener('dragstart', e => { const b = e.target.closest('.ing'); if (b) e.dataTransfer.setData('text/plain', b.dataset.i); });
    bowl.addEventListener('dragover', e => { e.preventDefault(); bowl.classList.add('over'); });
    bowl.addEventListener('dragleave', () => bowl.classList.remove('over'));
    bowl.addEventListener('drop', e => { e.preventDefault(); bowl.classList.remove('over'); picked.add(+e.dataTransfer.getData('text/plain')); render(); });
    const check = () => {
      const missing = all.filter((it, i) => it.ok && !it.opt && !picked.has(i));
      const wrong = all.filter((it, i) => !it.ok && picked.has(i));
      if (!missing.length && !wrong.length) {
        const opts = all.filter(it => it.opt).map(it => it.n);
        note(`✅ Rätt! ${opts.length ? `<small>(${opts.join(', ')} är valfritt – rätt oavsett.)</small>` : ''} ${nextBtn('Vidare till arbetsgången')}`, 'ok');
        stage.querySelectorAll('.ing').forEach(b => b.classList.add('locked'));
        stage.querySelector('#check').remove();
        hideHelp();
        msg.querySelector('#nextstep').onclick = nextStep;
        return;
      }
      mistakes++;
      note(`✗ Inte riktigt.
        ${wrong.length ? `<br><strong>Ska inte med:</strong> ${wrong.map(w => `${w.e} ${esc(w.n)} – <small>${esc(w.why)}</small>`).join('<br>')}` : ''}
        ${missing.length ? `<br><strong>Det saknas ${missing.length === 1 ? 'en ingrediens' : missing.length + ' ingredienser'}.</strong>` : ''}`, 'bad');
    };
    stage.querySelector('#check').onclick = check;
    render();
    helpBar(() => {
      // Ta bort en felaktig ingrediens – annars lägg i en som saknas
      const w = all.findIndex((it, i) => !it.ok && picked.has(i));
      if (w >= 0) { picked.delete(w); render(); return note(`💡 Tog ur <strong>${all[w].e} ${esc(all[w].n)}</strong> – ${esc(all[w].why)}`); }
      const m = all.findIndex((it, i) => it.ok && !it.opt && !picked.has(i));
      if (m >= 0) { picked.add(m); render(); return note(`💡 La i <strong>${all[m].e} ${esc(all[m].n)}</strong> – den behövs.`); }
      note('💡 Allt som behövs ligger redan i bunken – tryck Kontrollera!');
    }, () => {
      picked.clear();
      all.forEach((it, i) => { if (it.ok) picked.add(i); });
      render(); check();
    });
  }

  // ---------- 2. Arbetsgång ----------
  function stepProcess() {
    resetStage();
    const cards = shuffle([...rec.steps.map(s => ({ ...s, ok: true })), ...rec.wrongSteps.map(s => ({ ...s, ok: false }))]);
    const trashed = new Set();
    stage.innerHTML = `
      <h3>2. I vilken ordning gör man?</h3>
      <p>Dra stegen i rätt ordning (eller använd pilarna). Två steg ska <strong>inte</strong> göras – släng dem med 🗑.</p>
      <ul class="timeline rsteps" id="rl"></ul>
      <div class="trash" id="trash"><span>🗑 Ska inte göras</span><div id="trashed"></div></div>
      <button class="btn" id="check">Kontrollera</button>`;
    const ul = stage.querySelector('#rl'), trashEl = stage.querySelector('#trashed'), trashBox = stage.querySelector('#trash');
    let order = cards.map((_, i) => i);
    const li = (i, inTrash) => `<li draggable="true" data-i="${i}"><span class="grip">⋮⋮</span><span class="q">${esc(cards[i].t)}</span>
      <span class="mv">${inTrash ? '<button data-act="back" title="Tillbaka">↩</button>' : '<button data-act="up">▲</button><button data-act="down">▼</button><button data-act="trash" title="Ska inte göras">🗑</button>'}</span></li>`;
    function render() {
      ul.innerHTML = order.filter(i => !trashed.has(i)).map(i => li(i, false)).join('');
      trashEl.innerHTML = [...trashed].map(i => `<ul class="timeline">${li(i, true)}</ul>`).join('');
    }
    stage.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const i = +b.closest('li').dataset.i, act = b.dataset.act;
      const vis = order.filter(k => !trashed.has(k)), p = vis.indexOf(i);
      if (act === 'trash') trashed.add(i);
      if (act === 'back') trashed.delete(i);
      if (act === 'up' && p > 0) swap(i, vis[p - 1]);
      if (act === 'down' && p < vis.length - 1) swap(i, vis[p + 1]);
      render();
    });
    const swap = (a, b) => { const x = order.indexOf(a), y = order.indexOf(b); [order[x], order[y]] = [order[y], order[x]]; };
    let dragI = null;
    stage.addEventListener('dragstart', e => { const l = e.target.closest('li'); if (l) { dragI = +l.dataset.i; e.dataTransfer.setData('text/plain', ''); } });
    ul.addEventListener('dragover', e => {
      e.preventDefault(); if (dragI == null) return;
      const lis = [...ul.querySelectorAll('li')].filter(l => +l.dataset.i !== dragI);
      const after = lis.find(l => e.clientY < l.getBoundingClientRect().top + l.offsetHeight / 2);
      trashed.delete(dragI);
      order = order.filter(k => k !== dragI);
      order.splice(after ? order.indexOf(+after.dataset.i) : order.length, 0, dragI);
      render();
    });
    trashBox.addEventListener('dragover', e => e.preventDefault());
    trashBox.addEventListener('drop', e => { e.preventDefault(); if (dragI != null) { trashed.add(dragI); render(); } });
    stage.addEventListener('dragend', () => { dragI = null; });

    const check = () => {
      const vis = order.filter(k => !trashed.has(k));
      const wrongKept = vis.filter(i => !cards[i].ok), rightTrashed = [...trashed].filter(i => cards[i].ok);
      const keep = vis.filter(i => cards[i].ok);
      const okSet = inOrderSet(keep.map(i => cards[i].o));
      const misplaced = keep.filter((_, p) => !okSet.has(p));
      ul.querySelectorAll('li').forEach(l => {
        const i = +l.dataset.i;
        l.classList.remove('found', 'missed');
        l.classList.add(!cards[i].ok || misplaced.includes(i) ? 'missed' : 'found');
      });
      if (!wrongKept.length && !rightTrashed.length && !misplaced.length) {
        note(`✅ Helt rätt arbetsgång! ${nextBtn('Vidare till värdena')}`, 'ok');
        stage.querySelectorAll('.mv').forEach(x => x.remove());
        stage.querySelectorAll('li').forEach(x => x.draggable = false);
        stage.querySelector('#check').remove();
        hideHelp();
        msg.querySelector('#nextstep').onclick = nextStep;
        return;
      }
      mistakes++;
      note(`✗ Inte riktigt – de röda behöver ändras.
        ${wrongKept.length ? `<br>${wrongKept.map(i => `🗑 <strong>${esc(cards[i].t)}</strong> – <small>${esc(cards[i].why)}</small>`).join('<br>')}` : ''}
        ${rightTrashed.length ? `<br>Du har slängt ${rightTrashed.length === 1 ? 'ett steg' : rightTrashed.length + ' steg'} som behövs.` : ''}
        ${misplaced.length ? `<br>${misplaced.length === 1 ? 'Ett steg' : misplaced.length + ' steg'} ligger på fel plats. Fastnat? Ta en 💡 Ledtråd.` : ''}`, 'bad');
    };
    stage.querySelector('#check').onclick = check;
    render();
    const glow = i => { const l = ul.querySelector(`li[data-i="${i}"]`); if (l) { l.classList.add('glow'); l.scrollIntoView({ block: 'nearest' }); } };
    helpBar(() => {
      // 1) släng ett felsteg  2) plocka tillbaka ett behövt steg  3) flytta första felplacerade steget rätt
      const vis = order.filter(k => !trashed.has(k));
      const w = vis.find(i => !cards[i].ok);
      if (w != null) { trashed.add(w); render(); return note(`💡 Slängde <strong>${esc(cards[w].t)}</strong> – ${esc(cards[w].why)}`); }
      const back = [...trashed].find(i => cards[i].ok);
      if (back != null) { trashed.delete(back); render(); glow(back); return note(`💡 <strong>${esc(cards[back].t)}</strong> behövs – den är tillbaka i listan.`); }
      const want = vis.map(i => cards[i].o).sort((a, b) => a - b);
      const p = vis.findIndex((i, k) => cards[i].o !== want[k]);
      if (p < 0) return note('💡 Ordningen ser rätt ut – tryck Kontrollera!');
      const mover = vis.slice(p).find(i => cards[i].o === want[p]);
      order = order.filter(k => k !== mover);
      order.splice(order.indexOf(vis[p]), 0, mover);
      render(); glow(mover);
      note(`💡 Flyttade <strong>${esc(cards[mover].t)}</strong> till rätt plats (steg ${p + 1}).`);
    }, () => {
      trashed.clear();
      cards.forEach((c, i) => { if (!c.ok) trashed.add(i); });
      order = cards.map((_, i) => i).sort((a, b) => (cards[a].o || 99) - (cards[b].o || 99));
      render(); check();
    });
  }

  // ---------- 3. Värden ----------
  function stepValues() {
    resetStage();
    const done = new Set();
    stage.innerHTML = `
      <h3>3. Hur mycket, hur varmt, hur länge?</h3>
      <div class="vals">${rec.values.map((v, k) => `
        <div class="val" data-k="${k}"><div class="vq">${esc(v.q)}</div>
          <div class="vopts">${v.opts.map(o => `<button class="vopt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
      </div>`;
    const answer = (b, k) => {
      const box = b.closest('.val');
      b.classList.add('ok'); box.classList.add('ok'); done.add(k);
      box.querySelectorAll('.vopt').forEach(x => x.disabled = true);
      if (done.size === rec.values.length) {
        hideHelp();
        note(`✅ Alla värden klara! ${nextBtn('Sista steget')}`, 'ok');
        msg.querySelector('#nextstep').onclick = nextStep;
      }
    };
    stage.addEventListener('click', e => {
      const b = e.target.closest('.vopt'); if (!b) return;
      const k = +b.closest('.val').dataset.k;
      if (done.has(k)) return;
      if (b.dataset.o === rec.values[k].a) answer(b, k);
      else { mistakes++; b.classList.add('bad'); b.disabled = true; }
    });
    const optsFor = k => [...stage.querySelectorAll(`.val[data-k="${k}"] .vopt`)];
    helpBar(() => {
      // Stryk ett felaktigt alternativ på första obesvarade frågan
      const k = rec.values.findIndex((_, j) => !done.has(j));
      const wrong = optsFor(k).filter(x => !x.disabled && x.dataset.o !== rec.values[k].a);
      if (wrong.length > 1) { wrong[0].classList.add('bad'); wrong[0].disabled = true; note(`💡 Strök ett fel alternativ på <strong>${esc(rec.values[k].q)}</strong>.`); }
      else { answer(optsFor(k).find(x => x.dataset.o === rec.values[k].a), k); if (done.size < rec.values.length) note(`💡 ${esc(rec.values[k].q)}: <strong>${esc(rec.values[k].a)}</strong>.`); }
    }, () => {
      rec.values.forEach((v, k) => { if (!done.has(k)) answer(optsFor(k).find(x => x.dataset.o === v.a), k); });
    });
  }

  // ---------- 4. Klart när? ----------
  function stepDone() {
    resetStage();
    const d = rec.done;
    stage.innerHTML = `<h3>4. ${esc(d.q)}</h3>
      <div class="vopts col">${shuffle(d.opts).map(o => `<button class="vopt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    const right = () => {
      const b = [...stage.querySelectorAll('.vopt')].find(x => x.dataset.o === d.a);
      b.classList.add('ok');
      stage.querySelectorAll('.vopt').forEach(x => x.disabled = true);
      hideHelp();
      note(`✅ ${mistakes ? 'Rätt svar:' : 'Precis!'} <small>${esc(d.why)}</small> ${nextBtn('Se resultatet')}`, 'ok');
      msg.querySelector('#nextstep').onclick = nextStep;
    };
    stage.addEventListener('click', e => {
      const b = e.target.closest('.vopt'); if (!b || b.disabled) return;
      if (b.dataset.o === d.a) right();
      else { mistakes++; b.classList.add('bad'); b.disabled = true; }
    });
    helpBar(() => {
      const wrong = [...stage.querySelectorAll('.vopt')].filter(x => !x.disabled && x.dataset.o !== d.a);
      if (wrong.length > 1) { wrong[0].classList.add('bad'); wrong[0].disabled = true; note('💡 Strök ett fel alternativ.'); }
      else right();
    }, right);
  }

  // ---------- Resultat + receptkort ----------
  function finish() {
    resetStage();
    const n = stars.filter(Boolean).length;
    const perfect = n === RECIPE_STEPS.length;
    const fresh = Store.updateWords(recipePk(track), [{ key: rec.id, ok: perfect }]);
    const best = Store.getSetting(track.id + '-stars') || {};
    if (best[rec.id] == null || n > best[rec.id]) { best[rec.id] = n; Store.setSetting(track.id + '-stars', best); }
    Store.addAttempt({
      quiz: `${track.id}/${rec.id}`, title: `${rec.icon} ${rec.name}`, at: new Date().toISOString(),
      score: n, total: RECIPE_STEPS.length, secs: 0,
      missed: RECIPE_STEPS.filter((_, i) => !stars[i]).map(s => ({ q: rec.name, a: s })),
    });
    const ordered = rec.steps.slice().sort((a, b) => a.o - b.o);
    stage.innerHTML = `
      <div class="result stars-result">
        <div class="bigstars">${'⭐'.repeat(n)}${'☆'.repeat(RECIPE_STEPS.length - n)}</div>
        <strong>${perfect ? '🎉 Felfritt – du är en mästerkock!' : `${n} av ${RECIPE_STEPS.length} steg felfria.`}</strong>
        ${fresh ? '<br>📚 Du kan nu receptet!' : perfect ? '' : `<br>Kör igen – ${KNOWN_AT} felfria i rad så kan du receptet.`}
        <br><button class="btn" id="again">Laga igen</button>
      </div>
      <div class="recipe-card">
        <h3>${rec.icon} ${rec.name} – receptet</h3>
        <div class="rc-cols">
          <div><h4>Ingredienser</h4><ul>${rec.ingredients.map(i => `<li>${i.e} <strong>${esc(i.amt)}</strong> ${esc(i.n.toLowerCase())}${i.opt ? ' <small>(valfritt)</small>' : ''}</li>`).join('')}</ul>
            <h4>Värden</h4><ul>${rec.values.map(v => `<li>${esc(v.q)}: <strong>${esc(v.a)}</strong></li>`).join('')}</ul></div>
          <div><h4>Gör så här</h4><ol>${ordered.map(s => `<li>${esc(s.t)}</li>`).join('')}</ol>
            <h4>Klart när?</h4><p>${esc(rec.done.a)}.</p>
            <h4>⚠️ Vanliga fällor</h4><ul>${[...rec.decoys.map(d => ({ t: `${d.e} ${d.n} i smeten`, why: d.why })), ...rec.wrongSteps.map(w => ({ t: w.t, why: w.why }))].map(f => `<li>${esc(f.t)} ${infoBtn('Varför inte?', `<p>${esc(f.why)}</p>`)}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    note('');
    stage.querySelector('#again').onclick = () => playRecipe(track, rec, onBack);
  }

  renderStepper();
  stepIngredients();
}

// ---------- Statistik på resultatsidan ----------
function recipeStatsHtml() {
  return TRACKS.filter(t => t.type === 'recipe').map(track => {
    const knownAll = Store.load().known;
    const m = knownAll[recipePk(track)], fm = knownAll[faultPk(track)];
    if (!m && !fm) return '';
    const cls = s => (s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : '');
    const best = Store.getSetting(track.id + '-stars') || {};
    let html = `<h3>${track.icon} ${track.name}</h3>`;
    if (m) html += `<p><strong>👩‍🍳 Recept:</strong> ${track.recipes.map(r =>
      `<span class="chip ${cls(m[r.id] || 0)}">${r.icon} ${esc(r.name)} ${best[r.id] != null ? '⭐'.repeat(best[r.id]) : ''}</span>`).join(' ')}</p>`;
    if (fm) {
      const p = faultProgress(track, track.recipes);
      html += `<p><strong>🔍 Vad gick fel? (${p.known}/${p.total})</strong></p><table class="vocab">${track.recipes.map(r =>
        `<tr><td>${r.icon} ${esc(r.name)}</td><td>${r.faults.map(f =>
          `<span class="chip ${cls(fm[faultKey(r, f)] || 0)}" title="${esc(f.cause)}">${esc(f.sym)}</span>`).join(' ')}</td></tr>`).join('')}</table>`;
    }
    return html;
  }).join('');
}
