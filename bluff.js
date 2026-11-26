// Bluffkollen: 1) Stämmer eller bluff? 2) Var i meningen sitter felet? 3) Vilken sorts fel?
// Facit visar kunskapen (från spelets andra ämnen) som avslöjar bluffen – och markerar det du redan visat att du kan.
// Använder Store, KNOWN_AT, mathState, allNodes, findEvent, fmtYear, esc, shuffle, card, stopTimer, infoBtn, evInfoHtml.

const BLUFF_ROUND = 8;
const BLUFF_TYPES = {
  fakta: 'Fel fakta (person, plats eller grupp)',
  tid: 'Fel tid eller tidsordning',
  storlek: 'Fel storleksordning',
  samband: 'Fel samband eller orsak',
  enhet: 'Fel enhet',
  jamforelse: 'Vilseledande jämförelse',
};
const SPEAKERS = ['💬 Kollegan vid kaffemaskinen', '💬 Grannen', '🤖 En AI-chatt', '📱 Ett inlägg i sociala medier', '💬 En kompis på middagen', '📺 En reklamfilm'];

// ---------- Kunskapen bakom ett påstående ----------
// Returnerar { label, ok (har spelaren visat att den kan det?), where (var i spelet), info (ⓘ-innehåll) }
function bluffRef(r) {
  const T = id => TRACKS.find(t => t.id === id);
  if (r.t === 'hist') {
    const x = findEvent(r.n);
    if (!x) return { label: r.n, ok: false, where: '🏛️ Historia' };
    const key = `${x.cat.id}/${x.ev.e}`;
    const ok = ['fritext', 'tidslinje'].some(m => (Store.known(`historia/${m}`)[key] || 0) >= KNOWN_AT);
    return { label: `${x.ev.e} (${fmtYear(x.ev.y)})`, ok, where: `🏛️ Historia · ${x.cat.name}`, info: evInfoHtml(x.ev) };
  }
  if (r.t === 'geo') {
    const g = T('geografi'), cat = g.categories.find(c => c.places.some(p => p.n === r.n)), p = cat && cat.places.find(q => q.n === r.n);
    const ok = !!cat && ['allm', 'kunnig', 'expert'].some(l => (Store.known(`geografi/${l}`)[`${cat.id}/${r.n}`] || 0) >= KNOWN_AT);
    return { label: r.n, ok, where: `🗺️ Geografi${cat ? ' · ' + cat.name : ''}`, info: p && p.more ? `<p>${esc(p.more)}</p>` : '' };
  }
  if (r.t === 'zoo') {
    const set = T('zoologi').sets.find(s => s.id === r.set), it = set && set.items.find(i => i.n === r.n);
    const ok = (Store.known(`zoologi/${r.set}`)[r.n] || 0) >= KNOWN_AT;
    const basket = it && set.baskets.find(b => b.id === it.b);
    return { label: `${it && it.e ? it.e + ' ' : ''}${r.n}${basket ? ' – ' + basket.name : ''}`, ok, where: `🦁 Zoologi · ${set ? set.name : ''}`, info: it && it.why ? `<p>${esc(it.why)}</p>` : '' };
  }
  if (r.t === 'node') {
    const tr = TRACKS.filter(t => t.type === 'tree').find(t => allNodes(t).some(n => n.id === r.id));
    const node = tr && allNodes(tr).find(n => n.id === r.id);
    return { label: node ? node.name : r.id, ok: mathState(r.id).done, where: tr ? `${tr.icon} ${tr.name}` : '', info: node && node.desc ? `<p>${esc(node.desc)}</p>` : '' };
  }
  return { label: r.n || '', ok: false, where: '' };
}
const claimReady = c => c.refs.map(bluffRef).filter(r => r.ok).length;

// ---------- Ämnessida ----------
function showBluffTrack(track) {
  stopTimer();
  const m = Store.known('bluff');
  const kn = track.claims.filter(c => (m[c.id] || 0) >= KNOWN_AT).length;
  const ready = track.claims.filter(c => claimReady(c) === c.refs.length).length;
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <p class="legend">Påståenden som någon skulle kunna säga till dig – en kollega, en granne eller en AI. Stämmer det, eller är det bluff?
      Hitta <strong>var</strong> felet sitter och <strong>vilken sorts</strong> fel det är. Facit visar kunskapen från spelets andra ämnen som avslöjar bluffen.</p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelector('.quizzes').appendChild(card(`<strong>🕵️ Avslöja bluffen</strong>
    <small>${track.claims.length} påståenden · ${kn === track.claims.length ? '✅ Du kan alla' : `${kn} avslöjade`}</small>
    <small>🔓 ${ready} bygger helt på sådant du redan visat att du kan</small>
    <div class="progress"><div style="width:${Math.round(100 * kn / track.claims.length)}%"></div></div>`,
    () => playBluff(track, () => showBluffTrack(track))));
}

// ---------- Spelet ----------
function playBluff(track, onBack) {
  stopTimer();
  const m = Store.known('bluff');
  // Okända först – och bland dem de som bygger mest på sådant spelaren redan kan
  const order = shuffle(track.claims).sort((a, b) =>
    ((m[a.id] || 0) >= KNOWN_AT) - ((m[b.id] || 0) >= KNOWN_AT) || claimReady(b) / b.refs.length - claimReady(a) / a.refs.length);
  const round = order.slice(0, BLUFF_ROUND);
  const results = [];
  let i = 0, points = 0;

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>🕵️ Avslöja bluffen <small class="lvl" id="pts">0 p</small></h2>
    <div class="dots" id="dots"></div>
    <div id="stage"></div><div id="msg"></div>`;
  app.querySelector('.back').onclick = onBack;
  const dots = () => app.querySelector('#dots').innerHTML = round.map((_, k) =>
    `<span class="fdot ${k < results.length ? (results[k] ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></span>`).join('');

  function show() {
    const c = round[i];
    const refs = c.refs.map(bluffRef), ready = refs.every(r => r.ok);
    let gained = 0, locOk = null, typeOk = null;
    dots();
    const stage = app.querySelector('#stage'), msg = app.querySelector('#msg');
    msg.innerHTML = '';
    stage.innerHTML = `
      <div class="bubble"><div class="speaker">${SPEAKERS[Math.floor(Math.random() * SPEAKERS.length)]}:</div>
        <div class="claim" id="claim">”${c.parts.map((p, k) => `<span class="cpart" data-k="${k}">${esc(p)}</span>`).join('')}”</div></div>
      <p class="small bready">${ready ? '🔓 Du har redan visat att du kan allt som behövs för att avslöja det här.' : '🧩 Bygger på: ' + [...new Set(refs.map(r => r.where.split(' · ')[0]))].join(', ')}</p>
      <div id="step"></div>`;
    const step = stage.querySelector('#step');

    // Steg 1: stämmer eller bluff?
    step.innerHTML = `<h3>Stämmer det?</h3><div class="verdict"><button class="btn vbtn" data-v="true">✅ Stämmer</button><button class="btn vbtn bluffbtn" data-v="false">🚩 Bluff!</button></div>`;
    step.querySelectorAll('.vbtn').forEach(b => b.onclick = () => {
      const saysTrue = b.dataset.v === 'true', isTrue = c.bad === null;
      if (saysTrue !== isTrue) return facit(false);
      gained++;
      if (isTrue) return facit(true);
      stepWhere();
    });

    // Steg 2: var sitter felet?
    function stepWhere() {
      step.innerHTML = '<h3>🚩 Rätt – det är en bluff! Klicka på den del av meningen som är fel.</h3>';
      stage.querySelector('#claim').classList.add('pick');
      stage.querySelectorAll('.cpart').forEach(p => p.onclick = () => {
        if (locOk !== null) return;
        locOk = +p.dataset.k === c.bad;
        stage.querySelectorAll('.cpart').forEach(x => x.classList.toggle('wrongpart', +x.dataset.k === c.bad));
        if (!locOk) p.classList.add('miss');
        stage.querySelector('#claim').classList.remove('pick');
        if (locOk) gained++;
        stepType();
      });
    }
    // Steg 3: vilken sorts fel?
    function stepType() {
      step.innerHTML = `<h3>${locOk ? '🎯 Precis där!' : 'Felet sitter i den markerade delen.'} Vilken sorts fel är det?</h3>
        <div class="vopts">${Object.entries(BLUFF_TYPES).map(([k, n]) => `<button class="vopt" data-t="${k}">${n}</button>`).join('')}</div>`;
      step.querySelectorAll('.vopt').forEach(b => b.onclick = () => {
        typeOk = c.types.includes(b.dataset.t);
        step.querySelectorAll('.vopt').forEach(x => { x.disabled = true; if (c.types.includes(x.dataset.t)) x.classList.add('ok'); });
        if (!typeOk) b.classList.add('bad'); else gained++;
        facit(true);
      });
    }

    function facit(verdictOk) {
      const isTrue = c.bad === null;
      const ok = verdictOk && (isTrue || locOk === true);
      points += gained;
      results.push(ok); dots();
      app.querySelector('#pts').textContent = `${points} p`;
      stage.querySelectorAll('.vbtn').forEach(b => b.disabled = true);
      if (!isTrue) stage.querySelectorAll('.cpart').forEach(x => x.classList.toggle('wrongpart', +x.dataset.k === c.bad));
      const max = isTrue ? 1 : 3;
      msg.innerHTML = `<div class="rnote ${ok ? 'ok' : 'bad'}">
        <strong>${isTrue ? (verdictOk ? '✅ Rätt – det stämmer!' : '✗ Det stämmer faktiskt!')
          : !verdictOk ? '✗ Det var en bluff!' : locOk ? '🕵️ Avslöjad!' : '🚩 Rätt att det är bluff – men felet satt i den understrukna delen.'}</strong>
        <span class="small">(+${gained} av ${max} p)</span><br>${esc(c.why)}
        <div class="kchain"><div class="small"><strong>Kunskapen som avslöjar det:</strong></div>
          ${refs.map(r => `<div class="kref ${r.ok ? 'ok' : ''}">${r.ok ? '✅' : '📖'} <strong>${esc(r.label)}</strong> <span class="small">${esc(r.where)}${r.ok ? ' – det här kan du!' : ' – öva här för att lära dig'}</span>${r.info ? infoBtn(r.label, r.info) : ''}</div>`).join('')}
        </div>
        <button class="btn" id="nextb">${i + 1 < round.length ? 'Nästa påstående →' : 'Se resultatet →'}</button></div>`;
      const nb = msg.querySelector('#nextb');
      nb.onclick = () => { i++; i < round.length ? show() : finish(); };
      nb.focus();
    }
  }

  function finish() {
    const score = results.filter(Boolean).length;
    const fresh = Store.updateWords('bluff', round.map((c, k) => ({ key: c.id, ok: results[k] })));
    Store.addAttempt({ quiz: 'bluff', title: '🕵️ Bluffkollen', at: new Date().toISOString(), score, total: round.length, secs: 0,
      missed: round.filter((_, k) => !results[k]).map(c => ({ q: c.parts.join(''), a: c.bad === null ? 'stämmer' : 'bluff' })) });
    dots();
    app.querySelector('#stage').innerHTML = `<div class="result"><strong>${score === round.length ? '🎉 Ingen bluff kom förbi dig!' : 'Klart!'}</strong>
      ${score} av ${round.length} rätt · <strong>${points} poäng</strong>
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 nytt påstående' : fresh + ' nya påståenden'} som du nu kan avslöja!` : ''}
      <br><button class="btn" id="again">Kör igen</button></div>`;
    app.querySelector('#msg').innerHTML = '';
    app.querySelector('#again').onclick = () => playBluff(track, onBack);
  }
  show();
}

function bluffStatsHtml() {
  const t = TRACKS.find(x => x.type === 'bluff'), m = Store.load().known.bluff;
  if (!t || !m) return '';
  const kn = t.claims.filter(c => (m[c.id] || 0) >= KNOWN_AT).length;
  return `<h3>${t.icon} ${t.name}</h3><p>${kn} av ${t.claims.length} påståenden kan du avslöja.</p>`;
}
