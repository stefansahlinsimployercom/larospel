// Kedjespel: fas 1 – bygg kedjan (ordna stegen, släng det som inte hör hemma),
//            fas 2 – placera aktörerna (t.ex. företag) i rätt steg. Avslutas med ett kedjekort.
// Använder Store, KNOWN_AT, card, esc, stopTimer, shuffle, inOrderSet från övriga filer.

const CHAIN_ROUND = 12; // antal aktörer per runda
const chainPk = (track, ch) => `${track.id}/${ch.id}`;

function showChainTrack(track) {
  stopTimer();
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <p class="legend">Förstå hur större flöden hänger ihop. Först bygger du kedjan steg för steg, sedan placerar du aktörerna där de hör hemma.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const box = app.querySelector('.quizzes');
  track.chains.forEach(ch => {
    const m = Store.known(chainPk(track, ch));
    const kn = ch.actors.filter(a => (m[a.n] || 0) >= KNOWN_AT).length;
    const order = (m._ordning || 0) >= KNOWN_AT ? '✅ Kedjan sitter' : 'Kedjan: inte klar än';
    box.appendChild(card(`<strong>${ch.icon} ${ch.name}</strong><small>${ch.steps.length} steg · ${order}</small>
      <small>${kn}/${ch.actors.length} ${ch.actorLabel} kan du</small>
      <div class="progress"><div style="width:${Math.round(100 * kn / ch.actors.length)}%"></div></div>`,
      () => playChain(track, ch, () => showChainTrack(track))));
  });
}

function playChain(track, ch, onBack) {
  stopTimer();
  const pk = chainPk(track, ch);
  const m = Store.known(pk);
  const byId = Object.fromEntries(ch.steps.map(s => [s.id, s]));
  const stepInfo = s => `${s.desc ? `<p>${esc(s.desc)}</p>` : ''}${s.more ? `<p>${esc(s.more)}</p>` : ''}`;
  const actorInfo = a => `<p>${esc(a.note)}</p>${a.more ? `<p>${esc(a.more)}</p>` : ''}
    <p class="small">Steg i kedjan: <strong>${byId[a.b].e} ${esc(byId[a.b].n)}</strong></p>`;
  let orderOk = true;           // fas 1 felfri?
  const firstTry = new Map();   // aktör → rätt på första försöket?

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${ch.icon} ${ch.name}</h2>
    <div class="diag-intro">${esc(ch.intro)}</div>
    <div class="stepper" id="stepper"></div>
    <div id="stage"></div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  let stage = app.querySelector('#stage');
  const msg = app.querySelector('#msg');
  const note = (h, cls = '') => { msg.innerHTML = h ? `<div class="rnote ${cls}">${h}</div>` : ''; };
  const fresh = () => { const n = document.createElement('div'); n.id = 'stage'; stage.replaceWith(n); stage = n; };
  const stepper = k => { app.querySelector('#stepper').innerHTML = ['Bygg kedjan', `Placera ${ch.actorDef}`, 'Kedjekortet'].map((s, i) =>
    `<div class="rstep ${i === k ? 'cur' : i < k ? 'done' : ''}"><span class="rnum">${i < k ? '✔' : i + 1}</span> ${s}</div>`).join('<span class="rarrow">→</span>'); };
  function helpBar(onHint, onFacit, label = 'kostar stjärnan') {
    stage.insertAdjacentHTML('beforeend', `<div class="tools help"><button class="btn secondary" data-help="hint">💡 Ledtråd</button>
      <button class="btn secondary" data-help="facit">📖 Visa facit</button><span class="small">${label}</span></div>`);
    stage.querySelector('[data-help=hint]').onclick = onHint;
    stage.querySelector('[data-help=facit]').onclick = onFacit;
  }

  // ---------- Fas 1: bygg kedjan ----------
  function phaseOrder() {
    fresh(); stepper(0); note('');
    const cards = shuffle([...ch.steps.map(s => ({ ...s, ok: true })), ...ch.decoys.map(d => ({ ...d, ok: false }))]);
    const trashed = new Set();
    let order = cards.map((_, i) => i);
    stage.innerHTML = `
      <h3>1. I vilken ordning går flödet?</h3>
      <p>Dra stegen så att flödet går uppifrån och ner (eller använd pilarna). Steg som sker parallellt får ligga i valfri ordning.
        ${ch.decoys.length} steg hör <strong>inte</strong> hemma i kedjan – släng dem med 🗑.</p>
      <ul class="timeline chainlist" id="cl"></ul>
      <div class="trash" id="trash"><span>🗑 Hör inte hemma i kedjan</span><div id="trashed"></div></div>
      <button class="btn" id="check">Kontrollera</button>`;
    const ul = stage.querySelector('#cl'), trashEl = stage.querySelector('#trashed'), trashBox = stage.querySelector('#trash');
    const li = (i, inTrash) => `<li draggable="true" data-i="${i}"><span class="grip">⋮⋮</span>
      <span class="q"><strong>${cards[i].e} ${esc(cards[i].n)}</strong> ${infoBtn(cards[i].n, stepInfo(cards[i]))}${cards[i].desc ? `<small>${esc(cards[i].desc)}</small>` : ''}</span>
      <span class="mv">${inTrash ? '<button data-act="back" title="Tillbaka">↩</button>' : '<button data-act="up">▲</button><button data-act="down">▼</button><button data-act="trash" title="Hör inte hemma">🗑</button>'}</span></li>`;
    const vis = () => order.filter(k => !trashed.has(k));
    function render() {
      ul.innerHTML = vis().map(i => li(i, false)).join('');
      trashEl.innerHTML = [...trashed].map(i => `<ul class="timeline">${li(i, true)}</ul>`).join('');
    }
    const swap = (a, b) => { const x = order.indexOf(a), y = order.indexOf(b); [order[x], order[y]] = [order[y], order[x]]; };
    stage.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const i = +b.closest('li').dataset.i, v = vis(), p = v.indexOf(i);
      if (b.dataset.act === 'trash') trashed.add(i);
      if (b.dataset.act === 'back') trashed.delete(i);
      if (b.dataset.act === 'up' && p > 0) swap(i, v[p - 1]);
      if (b.dataset.act === 'down' && p < v.length - 1) swap(i, v[p + 1]);
      render();
    });
    let dragI = null;
    stage.addEventListener('dragstart', e => { const l = e.target.closest('li'); if (l) { dragI = +l.dataset.i; e.dataTransfer.setData('text/plain', ''); } });
    ul.addEventListener('dragover', e => {
      e.preventDefault(); if (dragI == null) return;
      const after = [...ul.querySelectorAll('li')].filter(l => +l.dataset.i !== dragI)
        .find(l => e.clientY < l.getBoundingClientRect().top + l.offsetHeight / 2);
      trashed.delete(dragI);
      order = order.filter(k => k !== dragI);
      order.splice(after ? order.indexOf(+after.dataset.i) : order.length, 0, dragI);
      render();
    });
    trashBox.addEventListener('dragover', e => e.preventDefault());
    trashBox.addEventListener('drop', e => { e.preventDefault(); if (dragI != null) { trashed.add(dragI); render(); } });
    stage.addEventListener('dragend', () => { dragI = null; });

    const check = () => {
      const v = vis();
      const wrongKept = v.filter(i => !cards[i].ok), rightTrashed = [...trashed].filter(i => cards[i].ok);
      const keep = v.filter(i => cards[i].ok);
      const okSet = inOrderSet(keep.map(i => cards[i].o));
      const misplaced = keep.filter((_, p) => !okSet.has(p));
      ul.querySelectorAll('li').forEach(l => {
        const i = +l.dataset.i;
        l.classList.remove('found', 'missed');
        l.classList.add(!cards[i].ok || misplaced.includes(i) ? 'missed' : 'found');
      });
      if (!wrongKept.length && !rightTrashed.length && !misplaced.length) {
        stage.querySelectorAll('.mv').forEach(x => x.remove());
        stage.querySelectorAll('li').forEach(x => x.draggable = false);
        stage.querySelector('#check').remove();
        stage.querySelector('.tools.help')?.remove();
        note(`✅ ${orderOk ? 'Helt rätt kedja!' : 'Kedjan är på plats.'} <button class="btn" id="nextphase">Placera ${ch.actorDef} →</button>`, 'ok');
        msg.querySelector('#nextphase').onclick = phaseActors;
        return;
      }
      orderOk = false;
      note(`✗ Inte riktigt – de röda behöver ändras.
        ${wrongKept.length ? `<br>${wrongKept.map(i => `🗑 <strong>${esc(cards[i].n)}</strong> – <small>${esc(cards[i].why)}</small>`).join('<br>')}` : ''}
        ${rightTrashed.length ? `<br>Du har slängt ${rightTrashed.length === 1 ? 'ett steg' : rightTrashed.length + ' steg'} som behövs.` : ''}
        ${misplaced.length ? `<br>${misplaced.length === 1 ? 'Ett steg' : misplaced.length + ' steg'} ligger på fel plats. Fastnat? Ta en 💡 Ledtråd.` : ''}`, 'bad');
    };
    stage.querySelector('#check').onclick = check;
    render();
    const glow = i => { const l = ul.querySelector(`li[data-i="${i}"]`); if (l) { l.classList.add('glow'); l.scrollIntoView({ block: 'nearest' }); } };
    helpBar(() => {
      orderOk = false;
      const v = vis();
      const w = v.find(i => !cards[i].ok);
      if (w != null) { trashed.add(w); render(); return note(`💡 Slängde <strong>${esc(cards[w].n)}</strong> – ${esc(cards[w].why)}`); }
      const back = [...trashed].find(i => cards[i].ok);
      if (back != null) { trashed.delete(back); render(); glow(back); return note(`💡 <strong>${esc(cards[back].n)}</strong> behövs i kedjan.`); }
      const want = v.map(i => cards[i].o).sort((a, b) => a - b);
      const p = v.findIndex((i, k) => cards[i].o !== want[k]);
      if (p < 0) return note('💡 Ordningen ser rätt ut – tryck Kontrollera!');
      const mover = v.slice(p).find(i => cards[i].o === want[p]);
      order = order.filter(k => k !== mover);
      order.splice(order.indexOf(v[p]), 0, mover);
      render(); glow(mover);
      note(`💡 Flyttade <strong>${esc(cards[mover].n)}</strong> till plats ${p + 1}.`);
    }, () => {
      orderOk = false;
      trashed.clear();
      cards.forEach((c, i) => { if (!c.ok) trashed.add(i); });
      order = cards.map((_, i) => i).sort((a, b) => (cards[a].o || 99) - (cards[b].o || 99));
      render(); check();
    });
    note('Börja med att fundera: var börjar flödet, och var slutar det?');
  }

  // ---------- Fas 2: placera aktörerna ----------
  function phaseActors() {
    fresh(); stepper(1); note('');
    // Okända först, minst en per steg om möjligt
    const pool = shuffle(ch.actors);
    const unk = pool.filter(a => (m[a.n] || 0) < KNOWN_AT), kn = pool.filter(a => (m[a.n] || 0) >= KNOWN_AT);
    const picked = [];
    ch.steps.forEach(s => { const a = unk.find(x => x.b === s.id && !picked.includes(x)) || kn.find(x => x.b === s.id && !picked.includes(x)); if (a) picked.push(a); });
    [...unk, ...kn].forEach(a => { if (picked.length < CHAIN_ROUND && !picked.includes(a)) picked.push(a); });
    const actors = shuffle(picked);
    const placed = new Set();
    let selected = null;
    const steps = ch.steps.slice().sort((a, b) => a.o - b.o);

    stage.innerHTML = `
      <h3>2. Var i kedjan hör ${ch.actorDef} hemma?</h3>
      <p>Dra ${ch.actorOne} till rätt steg – eller klicka på det och sedan på steget.</p>
      <div class="actor-pool" id="pool"></div>
      <div class="chain-cols" id="cols">${steps.map((s, k) => `
        ${k && s.o === steps[k - 1].o ? '' : ''}
        <div class="ccol" data-b="${s.id}">
          <div class="ccol-h"><span class="cno">${s.o}</span> ${s.e} ${esc(s.n)} ${infoBtn(s.n, stepInfo(s))}</div>
          <div class="ccol-body"></div>
        </div>`).join('')}
      </div>`;
    const poolEl = stage.querySelector('#pool');
    function renderPool() {
      poolEl.innerHTML = actors.map((a, i) => placed.has(i) ? '' :
        `<span class="actor-wrap"><button class="actor ${selected === i ? 'sel' : ''}" draggable="true" data-i="${i}">${esc(a.n)}</button>${infoBtn(a.n, `<p>${esc(a.note)}</p><p class="small">💡 Att läsa om ett företag innan du placerat det räknas som en ledtråd.</p>`, () => firstTry.set(a.n, false))}</span>`).join('')
        || '<span class="empty">Alla är placerade!</span>';
    }
    function place(i, bid) {
      const a = actors[i], col = stage.querySelector(`.ccol[data-b="${bid}"]`);
      if (a.b === bid) {
        if (!firstTry.has(a.n)) firstTry.set(a.n, true);
        placed.add(i); selected = null;
        col.querySelector('.ccol-body').insertAdjacentHTML('beforeend', `<div class="placed">${esc(a.n)} ${infoBtn(a.n, actorInfo(a))}</div>`);
        col.classList.add('good'); setTimeout(() => col.classList.remove('good'), 600);
        note(`✅ <strong>${esc(a.n)}</strong> – ${esc(a.note)}`, 'ok');
        renderPool();
        if (placed.size === actors.length) done();
      } else {
        firstTry.set(a.n, false);
        col.classList.add('bad'); setTimeout(() => col.classList.remove('bad'), 600);
        note(`✗ <strong>${esc(a.n)}</strong> hör inte till "${esc(byId[bid].n)}". Försök igen!`, 'bad');
      }
    }
    poolEl.addEventListener('click', e => { const b = e.target.closest('.actor'); if (b) { selected = +b.dataset.i; renderPool(); } });
    poolEl.addEventListener('dragstart', e => { const b = e.target.closest('.actor'); if (b) e.dataTransfer.setData('text/plain', b.dataset.i); });
    stage.querySelectorAll('.ccol').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); place(+e.dataTransfer.getData('text/plain'), col.dataset.b); });
      col.addEventListener('click', () => { if (selected != null) place(selected, col.dataset.b); });
    });
    function done() {
      stage.querySelector('.tools.help')?.remove();
      note(`✅ Alla ${ch.actorLabel} är på plats! <button class="btn" id="nextphase">Se kedjekortet →</button>`, 'ok');
      msg.querySelector('#nextphase').onclick = finish;
    }
    renderPool();
    helpBar(() => {
      const i = selected != null ? selected : actors.findIndex((_, k) => !placed.has(k));
      if (i < 0) return;
      firstTry.set(actors[i].n, false);
      selected = i; renderPool();
      const col = stage.querySelector(`.ccol[data-b="${actors[i].b}"]`);
      col.classList.add('glowcol'); setTimeout(() => col.classList.remove('glowcol'), 1500);
      note(`💡 <strong>${esc(actors[i].n)}</strong>: ${esc(actors[i].note)}`);
    }, () => {
      actors.forEach((a, i) => { if (!placed.has(i)) { firstTry.set(a.n, false); place(i, a.b); } });
    }, 'räknas inte som rätt');
  }

  // ---------- Kedjekortet ----------
  function finish() {
    fresh(); stepper(2); note('');
    const results = [...firstTry.entries()];
    const right = results.filter(([, ok]) => ok).length;
    const stars = (orderOk ? 1 : 0) + (right >= results.length * 0.8 ? 1 : 0) + (right === results.length ? 1 : 0);
    const fr = Store.updateWords(pk, [{ key: '_ordning', ok: orderOk }, ...results.map(([n, ok]) => ({ key: n, ok }))]);
    Store.addAttempt({
      quiz: pk, title: `${ch.icon} ${ch.name}`, at: new Date().toISOString(),
      score: right, total: results.length, secs: 0,
      missed: results.filter(([, ok]) => !ok).map(([n]) => ({ q: n, a: byId[ch.actors.find(a => a.n === n).b].n })),
    });
    const steps = ch.steps.slice().sort((a, b) => a.o - b.o);
    stage.innerHTML = `
      <div class="result stars-result">
        <div class="bigstars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        Kedjan ${orderOk ? 'felfri ✅' : 'med hjälp'} · ${right} av ${results.length} ${ch.actorLabel} rätt direkt
        ${fr ? `<br>📚 ${fr} nya saker som du nu kan!` : ''}
        <br><button class="btn" id="again">Spela igen</button>
      </div>
      <div class="recipe-card chain-card">
        <h3>${ch.icon} ${ch.name} – kedjekortet</h3>
        ${steps.map((s, k) => `
          ${k && s.o !== steps[k - 1].o ? '<div class="carrow">↓</div>' : k ? '<div class="carrow par">＋ parallellt</div>' : ''}
          <div class="cstep"><div class="cstep-h">${s.e} <strong>${esc(s.n)}</strong> ${infoBtn(s.n, stepInfo(s))}</div>
            <div class="small">${esc(s.desc)}</div>
            <div class="cactors">${ch.actors.filter(a => a.b === s.id).map(a => `<span class="chip ${(Store.known(pk)[a.n] || 0) >= KNOWN_AT ? 'known' : ''}" title="${esc(a.note)}">${esc(a.n)} ${infoBtn(a.n, actorInfo(a))}</span>`).join(' ')}</div>
          </div>`).join('')}
        <p class="legend">Klicka på ⓘ för att läsa mer om ett steg eller ${ch.actorOne}.</p>
      </div>`;
    stage.querySelector('#again').onclick = () => playChain(track, ch, onBack);
  }

  phaseOrder();
}

// ---------- Statistik på resultatsidan ----------
function chainStatsHtml() {
  return TRACKS.filter(t => t.type === 'chain').map(track => track.chains.map(ch => {
    const m = Store.load().known[chainPk(track, ch)];
    if (!m) return '';
    const rows = ch.steps.slice().sort((a, b) => a.o - b.o).map(s => `<tr><td>${s.e} ${esc(s.n)}</td><td>${ch.actors.filter(a => a.b === s.id).map(a => {
      const v = m[a.n] || 0;
      return `<span class="chip ${v >= KNOWN_AT ? 'known' : v > 0 ? 'half' : ''}" title="${esc(a.note)}">${esc(a.n)}</span>`;
    }).join(' ')}</td></tr>`).join('');
    return `<h3>${track.icon} ${ch.icon} ${ch.name} ${(m._ordning || 0) >= KNOWN_AT ? '· kedjan ✅' : ''}</h3><table class="vocab">${rows}</table>`;
  }).join('')).join('');
}
