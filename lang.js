// Språk med andra skriftsystem:
//   Ryska (ru)     – kyrilliska. Svaret kan skrivas med kyrilliska (tangentbord på skärmen) eller latinska bokstäver.
//   Kinesiska (zh) – tecken. Lagras som 'tecken|pinyin'. Svaret ges genom att dra/klicka teckenbrickor.
// Använder esc, alts, norm, shuffle, fmt, stopTimer, timerId, Store, infoBtn från game.js/history.js.

// ---------- Translitterering ryska → latinska bokstäver ----------
// Svensk standard (zj, sj, tj, ja …) visas på tangentbordet. Engelsk variant (zh, sh, ch, ya …) godkänns också.
const RU_SV = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'jo', ж: 'zj', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'ch', ц: 'ts', ч: 'tj', ш: 'sj', щ: 'sjtj', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'ju', я: 'ja' };
const RU_EN = { ...RU_SV, ё: 'yo', ж: 'zh', й: 'y', х: 'kh', ч: 'ch', ш: 'sh', щ: 'shch', ю: 'yu', я: 'ya' };
// Efter ж, ч, ш, щ skrivs ё som "o" (жёлтый → zjoltyj)
const translit = (s, map = RU_SV) => [...s.toLowerCase()].map((c, i, a) =>
  (c === 'ё' && 'жчшщ'.includes(a[i - 1]) ? 'o' : c in map ? map[c] : c)).join('');

// ---------- Kinesiska ----------
const zhChar = s => s.split('|')[0];
const zhPin = s => s.split('|')[1] || '';

// Hur ett ord visas (fråga/facit) och vilka svar som godkänns
function dispWord(lang, s) {
  if (lang === 'zh') return `${zhChar(s)} · ${zhPin(s)}`;
  if (lang === 'ru') return `${s} (${translit(s)})`;
  return s;
}
function answersFor(lang, v) {
  const list = alts(v);
  if (lang === 'zh') return list.map(zhChar);
  // Godkänn kyrilliska, svensk och engelsk translitterering – även med е i stället för ё (vanligt i vardagen)
  if (lang === 'ru') return [...new Set(list.flatMap(a => [a, a.replace(/ё/g, 'е')]).flatMap(a => [a, translit(a), translit(a, RU_EN)]))];
  return list;
}
// Startar rätt sorts spel för ett ordquiz
function startVocab(quiz, onBack, onFlip) { (quiz.tiles ? playTiles : playQuiz)(quiz, onBack, onFlip); }

// ---------- Kyrilliskt tangentbord ----------
const CYR_KEYS = 'йцукенгшщзхъ фывапролджэ ячсмитьбю ё';
function cyrKeyboardHtml() {
  return `<div class="cyrkb" id="cyrkb">${CYR_KEYS.split(' ').map(row => `<div class="kbrow">${[...row].map(c =>
    `<button class="kbkey" data-c="${c}"><span class="kc">${c}</span><span class="kl">${RU_SV[c] || '–'}</span></button>`).join('')}</div>`).join('')}
    <div class="kbrow"><button class="kbkey wide" data-c="⌫">⌫ Sudda</button><button class="kbkey wide" data-c=" ">mellanslag</button></div>
    <p class="small">Under varje bokstav står hur den skrivs med våra bokstäver. Du kan också skriva direkt med latinska bokstäver – t.ex. <em>sobaka</em> för собака.</p></div>`;
}
function wireCyrKeyboard(root, input) {
  root.querySelector('#cyrkb')?.addEventListener('click', e => {
    const k = e.target.closest('.kbkey'); if (!k || input.disabled) return;
    input.value = k.dataset.c === '⌫' ? input.value.slice(0, -1) : input.value + k.dataset.c;
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
}

// ---------- Teckenbrickor (kinesiska som svarsspråk) ----------
function playTiles(quiz, onBack, onFlip) {
  stopTimer();
  const found = new Set(), missedOnce = new Set();
  let timeLeft = quiz.time, selected = null, started = false;
  const showPin = () => Store.getSetting('zhPinyin') !== false;
  // Brickor: rätt tecken (första alternativet) + några lockande tecken från andra ord
  const right = quiz.items.map(it => it.tile);
  const pool = TRACKS.find(t => t.id === 'sprak').categories.flatMap(c => c.words.map(w => alts(w.zh)[0]))
    .filter(z => !right.some(r => zhChar(r) === zhChar(z)));
  const tiles = shuffle([...right, ...shuffle([...new Set(pool)]).slice(0, Math.min(4, Math.ceil(right.length / 3)))]);
  const used = new Set();

  app.innerHTML = `
    <button class="back">← Tillbaka</button>
    <h2>${quiz.title}</h2>
    <p>Dra rätt tecken till varje ord – eller klicka på ett tecken och sedan på ordet. Några tecken hör inte hit!</p>
    <div class="bar">
      <span class="stat" id="score">0/${quiz.items.length}</span>
      <span class="stat" id="clock">${fmt(timeLeft)}</span>
      <label class="check"><input type="checkbox" id="pin" ${showPin() ? 'checked' : ''}> Visa pinyin (uttal)</label>
      ${quiz.rebuild ? `<label class="check qonly"><input type="checkbox" id="qonly" ${quiz.only ? 'checked' : ''}> Bara ord jag inte kan</label>` : ''}
      ${onFlip ? '<button class="btn secondary" id="flip" title="Vänd håll">⇄ Vänd</button>' : ''}
      <button class="btn" id="start">Starta</button>
    </div>
    <div id="result"></div>
    <div class="tiles" id="tiles"></div>
    <div class="grid">${quiz.items.map((it, i) =>
      `<div class="cell tcell" id="c${i}" data-i="${i}"><span class="q">${esc(it.q)}</span><span class="a"></span></div>`).join('')}
    </div>`;
  app.querySelector('.back').onclick = onBack;
  const flipBtn = app.querySelector('#flip'), startBtn = app.querySelector('#start'), tilesEl = app.querySelector('#tiles');
  wireQuizFilter(quiz, onBack, onFlip, startBtn);
  if (flipBtn) flipBtn.onclick = () => startVocab(onFlip(), onBack, onFlip);
  app.querySelector('#pin').onchange = e => { Store.setSetting('zhPinyin', e.target.checked); renderTiles(); };

  function renderTiles() {
    tilesEl.classList.toggle('nopin', !showPin());
    tilesEl.innerHTML = started ? tiles.map((t, k) => used.has(k) ? '' :
      `<button class="ztile ${selected === k ? 'sel' : ''}" draggable="true" data-k="${k}"><span class="zc">${zhChar(t)}</span><span class="zp">${zhPin(t)}</span></button>`).join('')
      : '<span class="empty">Tryck Starta så visas tecknen.</span>';
  }
  function tryPlace(k, i) {
    if (!started || found.has(i)) return;
    const it = quiz.items[i], cell = app.querySelector('#c' + i);
    if ([].concat(it.a).includes(zhChar(tiles[k]))) {
      found.add(i); used.add(k); selected = null;
      cell.classList.add('found');
      cell.querySelector('.a').innerHTML = `<span class="zc small">${zhChar(tiles[k])}</span> ${esc(zhPin(tiles[k]))}${it.info ? ' ' + infoBtn(it.q, it.info) : ''}`;
      app.querySelector('#score').textContent = `${found.size}/${quiz.items.length}`;
      renderTiles();
      if (found.size === quiz.items.length) finish(true);
    } else {
      missedOnce.add(i);
      cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 450);
    }
  }
  tilesEl.addEventListener('click', e => { const b = e.target.closest('.ztile'); if (b) { selected = +b.dataset.k; renderTiles(); } });
  tilesEl.addEventListener('dragstart', e => { const b = e.target.closest('.ztile'); if (b) e.dataTransfer.setData('text/plain', b.dataset.k); });
  app.querySelectorAll('.tcell').forEach(cell => {
    cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('over'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('over'));
    cell.addEventListener('drop', e => { e.preventDefault(); cell.classList.remove('over'); tryPlace(+e.dataTransfer.getData('text/plain'), +cell.dataset.i); });
    cell.addEventListener('click', () => { if (selected != null) tryPlace(selected, +cell.dataset.i); });
  });

  function start() {
    started = true; renderTiles();
    if (flipBtn) flipBtn.remove();
    startBtn.textContent = 'Ge upp'; startBtn.className = 'btn secondary';
    startBtn.onclick = () => finish(false);
    timerId = setInterval(() => { timeLeft--; app.querySelector('#clock').textContent = fmt(timeLeft); if (timeLeft <= 0) finish(false); }, 1000);
  }
  function finish(all) {
    stopTimer(); started = false;
    quiz.items.forEach((it, i) => {
      if (found.has(i)) return;
      const c = app.querySelector('#c' + i);
      c.classList.add('missed');
      c.querySelector('.a').innerHTML = `<span class="zc small">${zhChar(it.tile)}</span> ${esc(zhPin(it.tile))}${it.info ? ' ' + infoBtn(it.q, it.info) : ''}`;
    });
    renderTiles();
    const ok = i => found.has(i) && !missedOnce.has(i);
    const score = quiz.items.filter((_, i) => found.has(i)).length;
    const fresh = Store.updateWords(quiz.pairKey, quiz.items.map((it, i) => ({ key: it.key, ok: ok(i) })));
    Store.addAttempt({
      quiz: quiz.id, title: quiz.baseTitle || quiz.title, at: new Date().toISOString(),
      score, total: quiz.items.length, secs: quiz.time - timeLeft,
      missed: quiz.items.filter((_, i) => !ok(i)).map(it => ({ q: it.q, a: zhChar(it.tile) })),
    });
    app.querySelector('#result').innerHTML = `<div class="result"><strong>${all ? '🎉 Alla rätt!' : 'Slut!'}</strong>
      Du fick ${score} av ${quiz.items.length}${missedOnce.size ? ` (${missedOnce.size} med fel på vägen)` : ''} på ${fmt(quiz.time - timeLeft)}.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 nytt ord' : fresh + ' nya ord'} som du nu kan!` : ''}</div>`;
    startBtn.textContent = 'Spela igen'; startBtn.className = 'btn';
    startBtn.onclick = () => playTiles(quiz, onBack, onFlip);
  }
  startBtn.onclick = start;
  renderTiles();
}
