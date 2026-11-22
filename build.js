// Byggspel: dra delarna till rätt plats på en ritning. När allt sitter: "Starta" – en genomgång av flödet.
// Använder Store, KNOWN_AT, card, esc, stopTimer, shuffle, infoBtn från övriga filer.

const buildPk = (track, b) => `${track.id}/${b.id}`;

function blueprintSvg(b) {
  const el = s => {
    if (s.t === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx || 1.2}" class="${s.cls}"/>`;
    if (s.t === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" class="${s.cls}"/>`;
    if (s.t === 'line') return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" class="${s.cls}"/>`;
    if (s.t === 'path') return `<path d="${s.d}" class="${s.cls}"/>`;
    return '';
  };
  return `<svg viewBox="0 0 100 60" class="bpsvg" preserveAspectRatio="none">${b.shapes.map(el).join('')}</svg>`;
}

function showBuildTrack(track) {
  stopTimer();
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <p class="legend">Hur är saker byggda? Dra delarna till rätt plats på ritningen. ⓘ på en plats berättar vad som ska sitta där.
      När allt är på plats – starta maskinen och se hur delarna samverkar.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const box = app.querySelector('.quizzes');
  track.builds.forEach(b => {
    const m = Store.known(buildPk(track, b));
    const kn = b.slots.filter(s => (m[s.id] || 0) >= KNOWN_AT).length;
    box.appendChild(card(`<strong>${b.icon} ${b.name}</strong><small>${b.slots.length} delar · ${b.icons ? 'med ikoner' : 'textbaserad'}</small>
      <small>${kn === b.slots.length ? '✅ Du kan alla delar' : `${kn}/${b.slots.length} delar kan du`}</small>
      <div class="progress"><div style="width:${Math.round(100 * kn / b.slots.length)}%"></div></div>`,
      () => playBuild(track, b, () => showBuildTrack(track))));
  });
}

function playBuild(track, b, onBack) {
  stopTimer();
  const pk = buildPk(track, b);
  const parts = shuffle([...b.slots.map(s => ({ n: s.n, e: s.e, slot: s.id })), ...b.decoys.map(d => ({ ...d, decoy: true }))]);
  const filled = new Map();   // slot-id → del
  const firstTry = new Map(); // slot-id → rätt på första försöket?
  const trashed = new Set();
  let selected = null;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${b.icon} ${b.name}</h2>
    <div class="diag-intro">${esc(b.intro)}</div>
    <div class="bar"><span class="stat" id="prog">0/${b.slots.length} delar</span></div>
    <div class="bp ${b.icons ? '' : 'textual'}" id="bp">${blueprintSvg(b)}
      ${b.slots.map((s, k) => `<div class="bslot" data-s="${s.id}" style="left:${s.x}%;top:${s.y / 60 * 100}%">
        <span class="bnum">${k + 1}</span><span class="bcontent">?</span>${infoBtn(`Plats ${k + 1}`, `<p>${esc(s.hint)}</p>`)}</div>`).join('')}
    </div>
    <div class="parts ${b.icons ? '' : 'textual'}" id="parts"></div>
    <div class="trash small-trash" id="trash"><span>🗑 Hör inte hemma här – dra hit eller klicka på delen och sedan här</span></div>
    <div class="tools help"><button class="btn secondary" id="hint">💡 Ledtråd</button><button class="btn secondary" id="facit">📖 Visa facit</button><span class="small">räknas inte som rätt</span></div>
    <div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const msg = app.querySelector('#msg'), partsEl = app.querySelector('#parts');
  const note = (h, cls = '') => { msg.innerHTML = h ? `<div class="rnote ${cls}">${h}</div>` : ''; };
  const slotEl = id => app.querySelector(`.bslot[data-s="${id}"]`);
  const flash = (el, cls) => { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 700); };

  function renderParts() {
    partsEl.innerHTML = parts.map((p, i) => (filled.has(p.slot) && !p.decoy) || trashed.has(i) ? '' :
      `<button class="bpart ${selected === i ? 'sel' : ''}" draggable="true" data-i="${i}">${b.icons && p.e ? `<span class="bemo2">${p.e}</span>` : ''}${esc(p.n)}</button>`).join('')
      || '<span class="empty">Alla delar är använda!</span>';
    app.querySelector('#prog').textContent = `${filled.size}/${b.slots.length} delar`;
  }

  function placeIn(i, sid) {
    const p = parts[i], s = b.slots.find(x => x.id === sid), el = slotEl(sid);
    if (filled.has(sid)) return note('Den platsen är redan klar.');
    if (p.slot === sid) {
      if (!firstTry.has(sid)) firstTry.set(sid, true);
      filled.set(sid, p); selected = null;
      el.classList.add('done');
      el.querySelector('.bcontent').innerHTML = `${b.icons && s.e ? s.e + ' ' : ''}${esc(s.n)}`;
      el.querySelector('.ibtn')?.remove(); // ledtråds-ⓘ ersätts av fördjupningen
      el.insertAdjacentHTML('beforeend', infoBtn(s.n, `<p>${esc(s.info)}</p><p class="small">${esc(s.hint)}</p>`));
      flash(el, 'good');
      note(`✅ <strong>${esc(s.n)}</strong> – ${esc(s.hint)}`, 'ok');
      renderParts();
      if (filled.size === b.slots.length) complete();
    } else {
      firstTry.set(sid, false);
      flash(el, 'bad');
      note(p.decoy ? `✗ <strong>${esc(p.n)}</strong> hör inte hemma här alls. ${esc(p.why)}` : `✗ <strong>${esc(p.n)}</strong> sitter inte på plats ${b.slots.indexOf(s) + 1}. Läs ⓘ på platsen för en ledtråd!`, 'bad');
    }
  }
  function trash(i) {
    const p = parts[i];
    if (p.decoy) { trashed.add(i); selected = null; renderParts(); note(`🗑 Rätt – <strong>${esc(p.n)}</strong> hör inte hemma här. <small>${esc(p.why)}</small>`, 'ok'); }
    else { firstTry.set(p.slot, false); flash(app.querySelector('#trash'), 'bad'); note(`✗ <strong>${esc(p.n)}</strong> behövs! Hitta rätt plats för den.`, 'bad'); }
  }

  partsEl.addEventListener('click', e => { const x = e.target.closest('.bpart'); if (x) { selected = +x.dataset.i; renderParts(); } });
  partsEl.addEventListener('dragstart', e => { const x = e.target.closest('.bpart'); if (x) e.dataTransfer.setData('text/plain', x.dataset.i); });
  app.querySelectorAll('.bslot').forEach(el => {
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); placeIn(+e.dataTransfer.getData('text/plain'), el.dataset.s); });
    el.addEventListener('click', () => { if (selected != null) placeIn(selected, el.dataset.s); else if (!filled.has(el.dataset.s)) note('Välj först en del nedanför – klicka sedan här.'); });
  });
  const tr = app.querySelector('#trash');
  tr.addEventListener('dragover', e => e.preventDefault());
  tr.addEventListener('drop', e => { e.preventDefault(); trash(+e.dataTransfer.getData('text/plain')); });
  tr.addEventListener('click', () => { if (selected != null) trash(selected); });

  app.querySelector('#hint').onclick = () => {
    // Markera platsen för vald del (eller första lediga plats) och dess del
    const i = selected != null && !parts[selected].decoy ? selected : parts.findIndex(p => !p.decoy && !filled.has(p.slot));
    if (i < 0) return;
    const sid = parts[i].slot;
    firstTry.set(sid, false);
    selected = i; renderParts();
    const el = slotEl(sid); el.classList.add('glowslot'); setTimeout(() => el.classList.remove('glowslot'), 1600);
    note(`💡 <strong>${esc(parts[i].n)}</strong> ska sitta på den blinkande platsen.`);
  };
  app.querySelector('#facit').onclick = () => {
    parts.forEach((p, i) => { if (!p.decoy && !filled.has(p.slot)) { firstTry.set(p.slot, false); placeIn(i, p.slot); } });
    parts.forEach((p, i) => { if (p.decoy) trashed.add(i); });
    renderParts();
  };

  function complete() {
    parts.forEach((p, i) => { if (p.decoy) trashed.add(i); });
    renderParts();
    app.querySelector('.tools.help').remove();
    app.querySelector('#trash').remove();
    const right = [...firstTry.values()].filter(Boolean).length;
    const fresh = Store.updateWords(pk, b.slots.map(s => ({ key: s.id, ok: firstTry.get(s.id) === true })));
    Store.addAttempt({
      quiz: pk, title: `${b.icon} ${b.name}`, at: new Date().toISOString(),
      score: right, total: b.slots.length, secs: 0,
      missed: b.slots.filter(s => firstTry.get(s.id) !== true).map(s => ({ q: s.n, a: `plats ${b.slots.indexOf(s) + 1}` })),
    });
    const stars = right === b.slots.length ? 3 : right >= b.slots.length * 0.7 ? 2 : right > 0 ? 1 : 0;
    note(`<div class="stars-result"><div class="bigstars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <strong>${right === b.slots.length ? '🎉 Felfritt byggt!' : 'Allt sitter på plats!'}</strong> ${right} av ${b.slots.length} delar rätt direkt.
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny del' : fresh + ' nya delar'} som du nu kan!` : ''}
      <br><button class="btn" id="go">▶ ${esc(b.start)}</button> <button class="btn secondary" id="again">Bygg igen</button></div>`, 'ok');
    msg.querySelector('#again').onclick = () => playBuild(track, b, onBack);
    msg.querySelector('#go').onclick = runTour;
  }

  // ---------- Starta maskinen: steg-för-steg-genomgång av flödet ----------
  function runTour() {
    let k = 0;
    const bp = app.querySelector('#bp');
    bp.classList.add('running');
    const panel = document.createElement('div');
    panel.className = 'tour';
    app.querySelector('#bp').after(panel);
    function show() {
      app.querySelectorAll('.bslot').forEach(el => el.classList.remove('active', 'visited'));
      b.tour.slice(0, k).forEach(([sid]) => slotEl(sid).classList.add('visited'));
      const [sid, txt] = b.tour[k];
      slotEl(sid).classList.add('active');
      const last = k === b.tour.length - 1;
      panel.innerHTML = `<div class="tour-step">${k + 1}/${b.tour.length}</div><div class="tour-txt">${esc(txt)}</div>
        <div class="tour-nav">${k ? '<button class="btn secondary" id="tprev">← Tillbaka</button>' : ''}
        <button class="btn" id="tnext">${last ? 'Klart ✓' : 'Nästa →'}</button></div>`;
      panel.querySelector('#tprev')?.addEventListener('click', () => { k--; show(); });
      panel.querySelector('#tnext').onclick = () => {
        if (last) { bp.classList.remove('running'); app.querySelectorAll('.bslot').forEach(el => el.classList.remove('active', 'visited')); panel.remove(); return; }
        k++; show();
      };
      panel.querySelector('#tnext').focus();
    }
    show();
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  renderParts();
  note('Välj en del och dra den till rätt plats – eller klicka på delen och sedan på platsen. Allt behövs inte!');
}

// ---------- Statistik på resultatsidan ----------
function buildStatsHtml() {
  return TRACKS.filter(t => t.type === 'build').map(track => {
    const rows = track.builds.map(b => {
      const m = Store.load().known[buildPk(track, b)];
      if (!m) return '';
      return `<tr><td>${b.icon} ${esc(b.name)}</td><td>${b.slots.map(s => {
        const v = m[s.id] || 0;
        return `<span class="chip ${v >= KNOWN_AT ? 'known' : v > 0 ? 'half' : ''}">${b.icons && s.e ? s.e + ' ' : ''}${esc(s.n)}${infoBtn(s.n, `<p>${esc(s.info)}</p>`)}</span>`;
      }).join(' ')}</td></tr>`;
    }).join('');
    return rows ? `<h3>${track.icon} ${track.name}</h3><table class="vocab">${rows}</table>` : '';
  }).join('');
}
