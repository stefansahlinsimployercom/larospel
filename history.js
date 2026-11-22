// Händelsespår (t.ex. Historia): två lägen
//   - fritext:   skriv årtalet för varje händelse
//   - tidslinje: dra händelserna i rätt ordning
// Använder Store, card, fmt, esc, stopTimer och timerId från game.js.

const EV_MODES = { fritext: '✍️ Årtal (fritext)', tidslinje: '↕️ Tidslinje' };
const evKey = (cat, ev) => `${cat.id}/${ev.e}`;
const evPair = (track, mode) => `${track.id}/${mode}`;
const fmtYear = y => (y < 0 ? `${-y} f.Kr.` : String(y));

// "753 f.Kr.", "753 fkr", "753 bc" och "-753" → -753
function parseYear(s) {
  const m = s.trim().toLowerCase().replace(/\s+/g, ' ').match(/^(-?\d{1,4})\s*(f\.?\s*kr\.?|fvt\.?|bc)?$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return m[2] ? -Math.abs(y) : y;
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function evProgress(track, cat, mode) {
  const m = Store.known(evPair(track, mode));
  return { known: cat.events.filter(ev => (m[evKey(cat, ev)] || 0) >= KNOWN_AT).length, total: cat.events.length };
}

// Välj händelser att spela; minst `min` stycken (tidslinjen behöver några att sortera).
function selectEvents(track, cat, mode, onlyUnknown, min) {
  if (!onlyUnknown) return { events: cat.events, note: '' };
  const m = Store.known(evPair(track, mode));
  const left = cat.events.filter(ev => (m[evKey(cat, ev)] || 0) < KNOWN_AT);
  if (left.length === cat.events.length) return { events: left, note: '' };
  if (left.length >= min) return { events: left, note: ` (${left.length} kvar att lära)` };
  if (!left.length) return { events: cat.events, note: ' (du kan alla – repetition)' };
  // För få kvar: fyll på med slumpade kända händelser
  const extra = shuffle(cat.events.filter(ev => !left.includes(ev))).slice(0, min - left.length);
  return { events: left.concat(extra), note: ` (${left.length} kvar att lära + repetition)` };
}

// ---------- Ämnessida ----------
function showEventsTrack(track) {
  stopTimer();
  const modeKey = track.id + '-mode';
  let mode = Store.getSetting(modeKey) || 'fritext';

  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <div class="modes">${Object.entries(EV_MODES).map(([k, n]) => `<button data-mode="${k}">${n}</button>`).join('')}</div>
      <label class="check"><input type="checkbox" id="only" ${Store.getSetting('onlyUnknown') !== false ? 'checked' : ''}> Träna bara det jag inte kan</label>
    </div>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const onlySel = app.querySelector('#only');
  onlySel.onchange = () => Store.setSetting('onlyUnknown', onlySel.checked);
  app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    mode = b.dataset.mode; Store.setSetting(modeKey, mode); render();
  });

  function render() {
    app.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const box = app.querySelector('.quizzes');
    box.innerHTML = '';
    track.categories.forEach(cat => {
      const p = evProgress(track, cat, mode);
      const pct = Math.round(100 * p.known / p.total);
      const status = p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} händelser kan du`;
      const back = () => showEventsTrack(track);
      box.appendChild(card(
        `<strong>${cat.icon} ${cat.name}</strong><small>${status}</small>
         <div class="progress"><div style="width:${pct}%"></div></div>`,
        () => (mode === 'fritext' ? playYears : playTimeline)(track, cat, onlySel.checked, back)));
    });
  }
  render();
}

// ---------- Fritextläge ----------
function playYears(track, cat, onlyUnknown, onBack) {
  stopTimer();
  const { events, note } = selectEvents(track, cat, 'fritext', onlyUnknown, 1);
  const items = shuffle(events);
  const title = `${cat.icon} ${cat.name}: Årtal`;
  const found = new Set();
  const total = items.length;
  const time = Math.max(30, total * 10);
  let timeLeft = time;

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${title}${note}</h2>
    <p>Skriv årtalet för varje händelse – rätt svar godkänns direkt och du hoppar till nästa.
       Före Kristus: skriv t.ex. <em>753 f.Kr.</em> eller <em>-753</em>.</p>
    <div class="bar">
      <span class="stat" id="score">0/${total}</span>
      <span class="stat" id="clock">${fmt(timeLeft)}</span>
      <button class="btn" id="start">Starta</button>
    </div>
    <div id="result"></div>
    <div class="yeargrid">${items.map((ev, i) =>
      `<div class="yrow" id="r${i}"><span class="q">${esc(ev.e)}</span><input data-i="${i}" placeholder="år" autocomplete="off" disabled></div>`).join('')}
    </div>`;
  app.querySelector('.back').onclick = onBack;
  const startBtn = app.querySelector('#start');
  const inputs = [...app.querySelectorAll('.yrow input')];

  function focusNext(from) {
    for (let k = 1; k <= total; k++) {
      const j = (from + k) % total;
      if (!found.has(j)) return inputs[j].focus();
    }
  }
  function lock(i, cls) {
    const row = app.querySelector('#r' + i);
    row.classList.add(cls);
    inputs[i].replaceWith(Object.assign(document.createElement('span'), { className: 'a', textContent: fmtYear(items[i].y) }));
    row.insertAdjacentHTML('beforeend', items[i].more ? infoBtn(items[i].e, `<p><strong>${fmtYear(items[i].y)}</strong></p><p>${esc(items[i].more)}</p>`) : '');
  }

  function start() {
    inputs.forEach(inp => inp.disabled = false);
    inputs[0].focus();
    startBtn.textContent = 'Ge upp';
    startBtn.className = 'btn secondary';
    startBtn.onclick = () => finish(false);
    timerId = setInterval(() => {
      timeLeft--;
      app.querySelector('#clock').textContent = fmt(timeLeft);
      if (timeLeft <= 0) finish(false);
    }, 1000);
  }

  const grid = app.querySelector('.yeargrid');
  grid.addEventListener('input', e => {
    const i = +e.target.dataset.i;
    if (parseYear(e.target.value) !== items[i].y) return;
    found.add(i);
    lock(i, 'found');
    app.querySelector('#score').textContent = `${found.size}/${total}`;
    if (found.size === total) finish(true); else focusNext(i);
  });
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.dataset.i) return;
    const inp = e.target;
    if (inp.value.trim()) { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); }
    focusNext(+inp.dataset.i);
  });

  function finish(all) {
    stopTimer();
    items.forEach((ev, i) => { if (!found.has(i)) lock(i, 'missed'); });
    const secs = time - timeLeft;
    const fresh = Store.updateWords(evPair(track, 'fritext'), items.map((ev, i) => ({ key: evKey(cat, ev), ok: found.has(i) })));
    Store.addAttempt({
      quiz: `${track.id}/${cat.id}/fritext`, title, at: new Date().toISOString(),
      score: found.size, total, secs,
      missed: items.filter((ev, i) => !found.has(i)).map(ev => ({ q: ev.e, a: fmtYear(ev.y) })),
    });
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${all ? '🎉 Alla rätt!' : 'Slut!'}</strong> Du fick ${found.size} av ${total} på ${fmt(secs)}.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny händelse' : fresh + ' nya händelser'} som du nu kan!` : ''}
    </div>`;
    startBtn.textContent = 'Spela igen';
    startBtn.className = 'btn';
    startBtn.onclick = () => playYears(track, cat, onlyUnknown, onBack);
  }

  startBtn.onclick = start;
}

// ---------- Tidslinjeläge ----------
// Poäng = längsta delmängd som redan ligger i rätt inbördes ordning.
// Övriga är de man hade behövt flytta.
function inOrderSet(years) {
  const n = years.length, len = Array(n).fill(1), prev = Array(n).fill(-1);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++)
      if (years[j] <= years[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
  let k = len.indexOf(Math.max(...len));
  const set = new Set();
  while (k >= 0) { set.add(k); k = prev[k]; }
  return set;
}

function playTimeline(track, cat, onlyUnknown, onBack) {
  stopTimer();
  const { events, note } = selectEvents(track, cat, 'tidslinje', onlyUnknown, 4);
  let items = shuffle(events);
  for (let t = 0; t < 5 && items.every((ev, i) => !i || items[i - 1].y <= ev.y); t++) items = shuffle(events);
  const title = `${cat.icon} ${cat.name}: Tidslinje`;
  const total = items.length;
  let secs = 0;

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${title}${note}</h2>
    <p>Dra händelserna i rätt ordning – tidigast överst. Du kan också använda pilarna. Tryck <strong>Kontrollera</strong> när du är klar.</p>
    <div class="bar">
      <span class="stat" id="clock">0:00</span>
      <button class="btn" id="check">Kontrollera</button>
    </div>
    <div id="result"></div>
    <div class="tl-label">⬆ Tidigast</div>
    <ul class="timeline" id="tl">${items.map((ev, i) => `
      <li draggable="true" data-i="${i}">
        <span class="grip">⋮⋮</span><span class="q">${esc(ev.e)}</span><span class="yr"></span>
        <span class="mv"><button data-mv="-1" title="Flytta upp">▲</button><button data-mv="1" title="Flytta ner">▼</button></span>
      </li>`).join('')}
    </ul>
    <div class="tl-label">⬇ Senast</div>`;
  app.querySelector('.back').onclick = onBack;
  const ul = app.querySelector('#tl');
  const checkBtn = app.querySelector('#check');

  timerId = setInterval(() => { secs++; app.querySelector('#clock').textContent = fmt(secs); }, 1000);

  // Drag och släpp
  let dragEl = null;
  ul.addEventListener('dragstart', e => {
    dragEl = e.target.closest('li');
    dragEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  ul.addEventListener('dragover', e => {
    if (!dragEl) return;
    e.preventDefault();
    const after = [...ul.querySelectorAll('li:not(.dragging)')]
      .find(li => e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2);
    ul.insertBefore(dragEl, after || null);
  });
  ul.addEventListener('dragend', () => { dragEl?.classList.remove('dragging'); dragEl = null; });
  // Pilknappar
  ul.addEventListener('click', e => {
    const b = e.target.closest('[data-mv]');
    if (!b) return;
    const li = b.closest('li');
    if (b.dataset.mv === '-1' && li.previousElementSibling) ul.insertBefore(li, li.previousElementSibling);
    if (b.dataset.mv === '1' && li.nextElementSibling) ul.insertBefore(li.nextElementSibling, li);
  });

  function check() {
    stopTimer();
    const lis = [...ul.children];
    const order = lis.map(li => items[+li.dataset.i]);
    const ok = inOrderSet(order.map(ev => ev.y));
    lis.forEach((li, p) => {
      li.draggable = false;
      li.classList.add(ok.has(p) ? 'found' : 'missed');
      li.querySelector('.yr').textContent = fmtYear(order[p].y);
      if (order[p].more) li.querySelector('.yr').insertAdjacentHTML('afterend', infoBtn(order[p].e, `<p><strong>${fmtYear(order[p].y)}</strong></p><p>${esc(order[p].more)}</p>`));
      li.querySelector('.mv').remove();
    });
    const score = ok.size;
    const fresh = Store.updateWords(evPair(track, 'tidslinje'), order.map((ev, p) => ({ key: evKey(cat, ev), ok: ok.has(p) })));
    Store.addAttempt({
      quiz: `${track.id}/${cat.id}/tidslinje`, title, at: new Date().toISOString(),
      score, total, secs,
      missed: order.filter((ev, p) => !ok.has(p)).map(ev => ({ q: ev.e, a: fmtYear(ev.y) })),
    });
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${score === total ? '🎉 Helt rätt ordning!' : 'Klart!'}</strong>
      ${score} av ${total} låg rätt i förhållande till varandra på ${fmt(secs)}.
      ${score < total ? `Du hade behövt flytta ${total - score} (röda). <button class="link" id="sort">Visa rätt ordning</button>` : ''}
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny händelse' : fresh + ' nya händelser'} som du nu kan!` : ''}
    </div>`;
    app.querySelector('#sort')?.addEventListener('click', () =>
      lis.slice().sort((a, b) => items[+a.dataset.i].y - items[+b.dataset.i].y).forEach(li => ul.appendChild(li)));
    checkBtn.textContent = 'Spela igen';
    checkBtn.onclick = () => playTimeline(track, cat, onlyUnknown, onBack);
  }
  checkBtn.onclick = check;
}

// ---------- Statistik på resultatsidan ----------
function eventsStatsHtml() {
  const knownAll = Store.load().known;
  let html = '';
  TRACKS.filter(t => t.type === 'events').forEach(track => {
    Object.keys(EV_MODES).forEach(mode => {
      const pk = evPair(track, mode);
      const m = knownAll[pk];
      if (!m) return;
      let sum = 0, tot = 0;
      const rows = track.categories.map(cat => {
        const p = evProgress(track, cat, mode);
        sum += p.known; tot += p.total;
        const chips = cat.events.map(ev => {
          const s = m[evKey(cat, ev)] || 0;
          const cls = s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : '';
          return `<span class="chip ${cls}" title="${fmtYear(ev.y)}">${esc(ev.e)}${ev.more ? infoBtn(ev.e, `<p><strong>${fmtYear(ev.y)}</strong></p><p>${esc(ev.more)}</p>`) : ''}</span>`;
        });
        return `<tr><td>${cat.icon} ${cat.name}<br><small>${p.known}/${p.total}</small>
          <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>
          <button class="link" data-reset="${pk}|${cat.id}">Nollställ</button></td>
          <td>${chips.join(' ')}</td></tr>`;
      }).join('');
      html += `<h3>${track.icon} ${track.name} – ${EV_MODES[mode]} (${sum}/${tot})</h3><table class="vocab">${rows}</table>`;
    });
  });
  return html;
}
