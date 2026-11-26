// Sorteringsspel: kort faller uppifrån och ska dras (eller klickas/tangent 1–6) till rätt korg.
// Generell motor – ett spår med type: 'sort' och sets: [{ baskets, items }] (se quizzes/zoologi.js).
// Använder Store, KNOWN_AT, card, fmt, esc, stopTimer, timerId och shuffle från game.js/history.js.

const SORT_ROUND = 15;     // antal kort per runda
const SORT_SPEED = 38;     // startfart (px/s)
const SORT_SPEEDUP = 4;    // ökning per kort

// ---------- Små världskartor (grova konturer, longitud/latitud) ----------
const CONTINENTS = {
  na: [[[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-60, 55], [-55, 48], [-70, 43], [-76, 35], [-81, 25], [-97, 26], [-97, 18], [-88, 15], [-78, 8], [-85, 10], [-105, 20], [-115, 30], [-125, 40], [-125, 50], [-140, 60], [-160, 58]],
       [[-55, 60], [-20, 70], [-30, 83], [-60, 82], [-72, 77]]],
  sa: [[[-80, 8], [-60, 10], [-50, 0], [-35, -7], [-40, -22], [-57, -38], [-65, -55], [-73, -50], [-72, -30], [-70, -18], [-81, -5]]],
  eu: [[[-10, 36], [-9, 43], [-2, 44], [-5, 48], [5, 52], [8, 57], [5, 62], [15, 69], [30, 71], [40, 67], [50, 68], [60, 60], [55, 45], [40, 42], [28, 41], [25, 36], [15, 38], [10, 44], [3, 43]],
       [[-6, 50], [2, 51], [-2, 58], [-6, 57]]],
  af: [[[-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [40, -5], [40, -15], [35, -25], [20, -35], [17, -28], [12, -17], [13, -5], [9, 4], [-8, 4], [-17, 14]],
       [[44, -12], [50, -15], [47, -25], [43, -22]]],
  as: [[[40, 42], [55, 45], [60, 60], [50, 68], [70, 73], [110, 77], [140, 72], [180, 68], [170, 60], [160, 55], [140, 48], [130, 42], [122, 40], [122, 30], [110, 20], [105, 10], [100, 2], [98, 10], [92, 22], [80, 8], [72, 20], [60, 25], [57, 22], [52, 15], [43, 12], [35, 28], [36, 36]],
       [[130, 31], [141, 36], [142, 45], [138, 38]], [[95, 5], [105, -6], [120, -9], [140, -8], [130, -2], [118, 2], [108, 2]]],
  oc: [[[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -27], [150, -37], [141, -38], [131, -31], [115, -34]],
       [[172, -35], [178, -38], [174, -41], [167, -46], [170, -46]]],
};
function mapSvg(highlight) {
  const poly = pts => pts.map(([lo, la]) => `${lo + 180},${90 - la}`).join(' ');
  const parts = Object.entries(CONTINENTS).map(([k, polys]) =>
    polys.map(p => `<polygon points="${poly(p)}" class="${k === highlight ? 'hl' : 'land'}"/>`).join('')).join('');
  return `<svg viewBox="0 5 360 150" class="mapsvg">${parts}</svg>`;
}

// ---------- Framsteg ----------
const sortPair = (track, set) => `${track.id}/${set.id}`;
function sortProgress(track, set) {
  const m = Store.known(sortPair(track, set));
  return { known: set.items.filter(it => (m[it.n] || 0) >= KNOWN_AT).length, total: set.items.length };
}

// ---------- Ämnessida ----------
function showSortTrack(track) {
  stopTimer();
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <label class="check"><input type="checkbox" id="only" ${Store.getSetting('onlyUnknown') !== false ? 'checked' : ''}> Träna mest på det jag inte kan</label>
    </div>
    <p class="legend">Korten faller allt snabbare. Dra dem till rätt korg – eller klicka på korgen / tryck siffran 1–6.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const onlySel = app.querySelector('#only');
  onlySel.onchange = () => Store.setSetting('onlyUnknown', onlySel.checked);
  const box = app.querySelector('.quizzes');
  track.sets.forEach(set => {
    if (contribSkip(set)) return;
    const p = sortProgress(track, set);
    const status = p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} kan du`;
    box.appendChild(card(`<strong>${set.icon} ${set.name}</strong><small>${set.baskets.length} korgar · ${status}</small>${byTag(set)}
      <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>`,
      () => playSort(track, set, onlySel.checked, () => showSortTrack(track))));
  });
  contribAddCard(track, box, () => showSortTrack(track));
}

// ---------- Spelet ----------
function playSort(track, set, onlyUnknown, onBack) {
  stopTimer();
  const pk = sortPair(track, set);
  const m = Store.known(pk);
  // Välj kort: okända först, fyll på med kända så rundan blir lagom lång
  let pool = shuffle(set.items);
  if (onlyUnknown) {
    const unk = pool.filter(it => (m[it.n] || 0) < KNOWN_AT), kn = pool.filter(it => (m[it.n] || 0) >= KNOWN_AT);
    pool = unk.concat(kn.slice(0, Math.max(0, 8 - unk.length)));
  }
  const items = shuffle(pool.slice(0, SORT_ROUND));
  const basketById = Object.fromEntries(set.baskets.map(b => [b.id, b]));
  const results = []; // { it, chosen }
  let idx = 0, cur = null, y = 0, speed = SORT_SPEED, paused = false, last = 0, started = false;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${set.icon} ${set.name}</h2>
    <p>${esc(set.desc)}</p>
    <div class="bar">
      <span class="stat" id="score">0/${items.length}</span>
      <span class="stat small" id="left">${items.length} kort kvar</span>
      <button class="btn" id="start">Starta</button>
    </div>
    <div id="result"></div>
    <div class="sortarea" id="area">
      <div class="faller" id="faller" draggable="true" hidden></div>
      <div class="toast" id="toast">Tryck <strong>Starta</strong> – korten börjar falla.</div>
    </div>
    <div class="baskets">${set.baskets.map((b, i) => `
      <div class="basket" data-b="${b.id}">
        <span class="key">${i + 1}</span>
        <div class="bimg">${b.map ? mapSvg(b.map) : `<span class="bemo">${b.icon}</span>`}</div>
        <div class="bname">${esc(b.name)}${b.more ? infoBtn(b.name, `<p>${esc(b.more)}</p>`) : ''}</div>
      </div>`).join('')}
    </div>`;
  app.querySelector('.back').onclick = () => { document.removeEventListener('keydown', onKey); onBack(); };
  const area = app.querySelector('#area'), faller = app.querySelector('#faller'), toast = app.querySelector('#toast');
  const startBtn = app.querySelector('#start');
  const basketEls = [...app.querySelectorAll('.basket')];

  const gone = () => { if (faller.isConnected) return false; document.removeEventListener('keydown', onKey); return true; };
  function spawn() {
    if (gone()) return;
    if (idx >= items.length) return finish();
    cur = items[idx++];
    faller.innerHTML = `<span class="emo">${cur.e || '🐾'}</span> ${esc(cur.n)}`;
    faller.hidden = false;
    faller.style.left = (25 + Math.random() * 50) + '%';
    y = -10;
    app.querySelector('#left').textContent = `${items.length - idx + 1} kort kvar`;
  }
  function tick() {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!cur || paused) return;
    y += speed * dt;
    faller.style.transform = `translate(-50%, ${y}px)`;
    if (y > area.clientHeight - faller.offsetHeight) resolve(null);
  }
  function resolve(bid) {
    if (!cur || gone()) return;
    const it = cur;
    cur = null;
    faller.hidden = true;
    const ok = bid === it.b;
    results.push({ it, chosen: bid });
    const right = basketEls.find(e => e.dataset.b === it.b);
    const chosen = basketEls.find(e => e.dataset.b === bid);
    if (chosen && !ok) flash(chosen, 'bad');
    flash(right, ok ? 'good' : 'show');
    toast.innerHTML = ok ? `✅ ${esc(it.n)} – ${esc(basketById[it.b].name)}`
      : `${bid ? '✗' : '⏬ För sent!'} ${esc(it.n)} hör till <strong>${esc(basketById[it.b].name)}</strong>.<br><small>${esc(it.why || '')}</small>`;
    toast.className = 'toast ' + (ok ? 'ok' : 'bad');
    app.querySelector('#score').textContent = `${results.filter(r => r.chosen === r.it.b).length}/${items.length}`;
    speed += SORT_SPEEDUP;
    setTimeout(() => { if (started) spawn(); }, ok ? 500 : 1800);
  }
  function flash(el, cls) { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1200); }

  // Dra och släpp
  faller.addEventListener('dragstart', e => { paused = true; e.dataTransfer.setData('text/plain', 'x'); e.dataTransfer.effectAllowed = 'move'; });
  faller.addEventListener('dragend', () => { paused = false; last = performance.now(); });
  basketEls.forEach(el => {
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); paused = false; resolve(el.dataset.b); });
    el.addEventListener('click', () => resolve(el.dataset.b));
  });
  function onKey(e) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= set.baskets.length && cur) resolve(set.baskets[n - 1].id);
  }
  document.addEventListener('keydown', onKey);

  function start() {
    started = true;
    startBtn.textContent = 'Avsluta';
    startBtn.className = 'btn secondary';
    startBtn.onclick = finish;
    toast.textContent = '';
    toast.className = 'toast';
    last = performance.now();
    timerId = setInterval(tick, 16);
    spawn();
  }

  function finish() {
    stopTimer();
    started = false; cur = null; faller.hidden = true;
    document.removeEventListener('keydown', onKey);
    const score = results.filter(r => r.chosen === r.it.b).length;
    const fresh = Store.updateWords(pk, results.map(r => ({ key: r.it.n, ok: r.chosen === r.it.b })));
    Store.addAttempt({
      quiz: pk, title: `${set.icon} ${set.name}`, at: new Date().toISOString(),
      score, total: results.length, secs: 0,
      missed: results.filter(r => r.chosen !== r.it.b).map(r => ({ q: r.it.n, a: basketById[r.it.b].name })),
    });
    const wrong = results.filter(r => r.chosen !== r.it.b);
    toast.textContent = '';
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${score === results.length && results.length ? '🎉 Alla rätt!' : 'Klart!'}</strong> ${score} av ${results.length} rätt.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 nytt djur' : fresh + ' nya djur'} som du nu kan!` : ''}
      ${wrong.length ? `<ul class="misslist">${wrong.map(r => `<li><strong>${r.it.e || ''} ${esc(r.it.n)}</strong> → ${esc(basketById[r.it.b].name)}
        <span class="small">(${r.chosen ? 'du valde ' + esc(basketById[r.chosen].name) : 'för sent'}) – ${esc(r.it.why || '')}</span></li>`).join('')}</ul>` : ''}
      <p class="small">Alla i rundan – klicka på ⓘ för att läsa mer:</p>
      <div>${results.map(r => `<span class="chip ${r.chosen === r.it.b ? 'known' : ''}">${r.it.e || ''} ${esc(r.it.n)}${infoBtn(r.it.n, `<p>${esc(r.it.why || '')}</p><p class="small">Hör till: <strong>${esc(basketById[r.it.b].name)}</strong></p>${(typeof crossLinksHtml === 'function' ? crossLinksHtml({ t: 'zoo', set: set.id, n: r.it.n }) : '')}`)}</span>`).join(' ')}</div>
    </div>`;
    startBtn.textContent = 'Spela igen';
    startBtn.className = 'btn';
    startBtn.onclick = () => playSort(track, set, onlyUnknown, onBack);
  }
  startBtn.onclick = start;
}

// ---------- Statistik på resultatsidan ----------
function sortStatsHtml() {
  const knownAll = Store.load().known;
  return TRACKS.filter(t => t.type === 'sort').map(track => track.sets.map(set => {
    const pk = sortPair(track, set), m = knownAll[pk];
    if (!m) return '';
    const p = sortProgress(track, set);
    const rows = set.baskets.map(b => {
      const its = set.items.filter(it => it.b === b.id);
      const kn = its.filter(it => (m[it.n] || 0) >= KNOWN_AT).length;
      const chips = its.map(it => {
        const s = m[it.n] || 0;
        return `<span class="chip ${s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : ''}" title="${esc(it.why || '')}">${it.e || ''} ${esc(it.n)}${infoBtn(it.n, `<p>${esc(it.why || '')}</p>${(typeof crossLinksHtml === 'function' ? crossLinksHtml({ t: 'zoo', set: set.id, n: it.n }) : '')}`)}</span>`;
      }).join(' ');
      return `<tr><td>${b.icon || ''} ${esc(b.name)}<br><small>${kn}/${its.length}</small>
        <div class="progress"><div style="width:${Math.round(100 * kn / its.length)}%"></div></div></td><td>${chips}</td></tr>`;
    }).join('');
    return `<h3>${track.icon} ${track.name} – ${set.name} (${p.known}/${p.total})
      <button class="link" data-reset="${pk}|">Nollställ</button></h3><table class="vocab">${rows}</table>`;
  }).join('')).join('');
}
