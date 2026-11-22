// Kartspel: platsen visas, klicka där den ligger på världskartan.
// Tre nivåer styr hur nära man måste vara. Zoom med mushjul/knappar, panorera genom att dra.
// Detaljerad karta hämtas från nätet (Natural Earth via jsDelivr); utan nät används de grova konturerna i sort.js.
// Använder Store, KNOWN_AT, card, esc, stopTimer, shuffle, CONTINENTS från övriga filer.

const GEO_LEVELS = {
  allm: { name: '🙂 Allmänbildad', km: 1000 },
  kunnig: { name: '🧭 Kunnig', km: 500 },
  expert: { name: '🎓 Expert', km: 200 },
};
const GEO_LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json';
let geoLandPath = null; // cache: SVG-path för land

// lon/lat → kartans koordinater (enkel rektangulär projektion)
const gx = lon => lon + 180, gy = lat => 90 - lat;

// Avkoda TopoJSON (land) till en SVG-path – liten egen avkodare, inget extra bibliotek.
function topoToPath(topo) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
  });
  const ring = idxs => {
    const pts = [];
    idxs.forEach((i, k) => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      pts.push(...(k ? a.slice(1) : a));
    });
    // Datumgränsen: håll longituden sammanhängande så att konturen inte drar ett streck över hela kartan
    let prev = null, off = 0;
    const fixed = pts.map(([lo, la]) => {
      if (prev != null && Math.abs(lo + off - prev) > 180) off += lo + off > prev ? -360 : 360;
      prev = lo + off;
      return [lo + off, la];
    });
    const draw = shift => 'M' + fixed.map(([lo, la]) => `${(gx(lo) + shift).toFixed(2)},${gy(la).toFixed(2)}`).join('L') + 'Z';
    const xs = fixed.map(([lo]) => gx(lo));
    let d = draw(0);
    if (Math.min(...xs) < 0) d += draw(360);   // delar som hamnat till vänster om kartan
    if (Math.max(...xs) > 360) d += draw(-360); // delar som hamnat till höger om kartan
    return d;
  };
  let d = '';
  topo.objects.land.geometries.forEach(g => {
    const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    polys.forEach(p => p.forEach(r => { d += ring(r); }));
  });
  return d;
}
function fallbackLandPath() {
  return Object.values(CONTINENTS).flat().map(p => 'M' + p.map(([lo, la]) => `${gx(lo)},${gy(la)}`).join('L') + 'Z').join('');
}
async function loadLand() {
  if (geoLandPath) return geoLandPath;
  try {
    const res = await fetch(GEO_LAND_URL);
    geoLandPath = topoToPath(await res.json());
  } catch { geoLandPath = fallbackLandPath(); }
  return geoLandPath;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const kmStr = km => Math.round(km).toLocaleString('sv-SE') + ' km';

// ---------- Framsteg ----------
const geoPair = (track, level) => `${track.id}/${level}`;
const geoKey = (cat, p) => `${cat.id}/${p.n}`;
function geoProgress(track, cat, level) {
  const m = Store.known(geoPair(track, level));
  return { known: cat.places.filter(p => (m[geoKey(cat, p)] || 0) >= KNOWN_AT).length, total: cat.places.length };
}

// ---------- Ämnessida ----------
function showMapTrack(track) {
  stopTimer();
  const levelKey = track.id + '-level';
  let level = Store.getSetting(levelKey) || 'allm';
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>${track.icon} ${track.name}</h2>
    <div class="langbar">
      <div class="modes">${Object.entries(GEO_LEVELS).map(([k, l]) => `<button data-level="${k}">${l.name}</button>`).join('')}</div>
      <label class="check"><input type="checkbox" id="only" ${Store.getSetting('onlyUnknown') !== false ? 'checked' : ''}> Träna bara det jag inte kan</label>
    </div>
    <p class="legend" id="levelhelp"></p>
    <div class="quizzes"></div>`;
  app.querySelector('.back').onclick = showHome;
  const onlySel = app.querySelector('#only');
  onlySel.onchange = () => Store.setSetting('onlyUnknown', onlySel.checked);
  app.querySelectorAll('[data-level]').forEach(b => b.onclick = () => { level = b.dataset.level; Store.setSetting(levelKey, level); render(); });

  function render() {
    app.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('active', b.dataset.level === level));
    app.querySelector('#levelhelp').textContent = `Du måste klicka inom ${GEO_LEVELS[level].km} km från platsen (stora öknar, floder och skogar räknas som träff var som helst i dem). Varje nivå har sin egen progress.`;
    const box = app.querySelector('.quizzes');
    box.innerHTML = '';
    track.categories.forEach(cat => {
      const p = geoProgress(track, cat, level);
      const status = p.known === p.total ? '✅ Du kan alla' : `${p.known}/${p.total} platser kan du`;
      box.appendChild(card(`<strong>${cat.icon} ${cat.name}</strong><small>${status}</small>
        <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>`,
        () => playMap(track, cat, level, onlySel.checked, () => showMapTrack(track))));
    });
  }
  render();
}

// ---------- Spelet ----------
function playMap(track, cat, level, onlyUnknown, onBack) {
  stopTimer();
  const L = GEO_LEVELS[level];
  const pk = geoPair(track, level);
  const m = Store.known(pk);
  let places = cat.places;
  let note = '';
  if (onlyUnknown) {
    const left = places.filter(p => (m[geoKey(cat, p)] || 0) < KNOWN_AT);
    if (left.length) { if (left.length < places.length) note = ` (${left.length} kvar att lära)`; places = left; }
    else note = ' (du kan alla – repetition)';
  }
  places = shuffle(places);
  const results = []; // { p, km, ok, pts }
  let i = 0, points = 0, streak = 0, bestStreak = 0, waiting = false;
  const VB0 = { x: 0, y: 5, w: 360, h: 150 };
  let vb = { ...VB0 };

  app.innerHTML = `
    <button class="back">← ${track.name}</button>
    <h2>${cat.icon} ${cat.name} <small class="lvl">${L.name} · inom ${L.km} km</small>${note}</h2>
    <div class="bar">
      <span class="stat" id="pts">0 p</span>
      <span class="stat small" id="streak"></span>
      <span class="stat small" id="hits">0/${places.length} träffar</span>
    </div>
    <div class="geo-layout">
      <div>
        <div class="geo-ask" id="ask"></div>
        <div class="mapwrap">
          <svg id="map" viewBox="${VB0.x} ${VB0.y} ${VB0.w} ${VB0.h}">
            <rect x="-360" y="-180" width="1080" height="540" class="ocean"/>
            <g id="grid"></g>
            <path id="land" class="land" d=""/>
            <g id="marks"></g>
          </svg>
          <div class="zoomctl">
            <button data-z="in" title="Zooma in">＋</button><button data-z="out" title="Zooma ut">－</button><button data-z="reset" title="Hela världen">⟲</button>
          </div>
          <div class="maphint">Mushjul eller ＋/－ zoomar · dra för att flytta · klicka för att svara</div>
        </div>
        <div id="result"></div>
      </div>
      <ol class="geo-list" id="list"></ol>
    </div>`;
  app.querySelector('.back').onclick = onBack;
  const svg = app.querySelector('#map'), marks = app.querySelector('#marks');

  // Rutnät (var 30:e grad) som hjälp för ögat
  let grid = '';
  for (let lo = -150; lo <= 150; lo += 30) grid += `<line x1="${gx(lo)}" y1="0" x2="${gx(lo)}" y2="180"/>`;
  for (let la = -60; la <= 60; la += 30) grid += `<line x1="0" y1="${gy(la)}" x2="360" y2="${gy(la)}"/>`;
  app.querySelector('#grid').innerHTML = grid;
  loadLand().then(d => { const el = app.querySelector('#land'); if (el) el.setAttribute('d', d); });

  // ---- Zoom & panorering ----
  const setVB = () => {
    vb.w = Math.min(360, Math.max(12, vb.w)); vb.h = vb.w * VB0.h / VB0.w;
    vb.x = Math.min(360 - vb.w, Math.max(0, vb.x)); vb.y = Math.min(180 - vb.h, Math.max(0, vb.y));
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    drawMarks();
  };
  const toMap = (cx, cy) => { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  function zoomAt(f, cx, cy) {
    const p = cx != null ? toMap(cx, cy) : { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    const nw = Math.min(360, Math.max(12, vb.w * f));
    vb.x = p.x - (p.x - vb.x) * nw / vb.w; vb.y = p.y - (p.y - vb.y) * nw / vb.w; vb.w = nw;
    setVB();
  }
  svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 0.8 : 1.25, e.clientX, e.clientY); }, { passive: false });
  app.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
    if (b.dataset.z === 'reset') { vb = { ...VB0 }; setVB(); } else zoomAt(b.dataset.z === 'in' ? 0.6 : 1.6);
  });
  let drag = null;
  svg.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false }; });
  window.addEventListener('mousemove', onMove);
  function onMove(e) {
    if (!drag) return;
    if (!svg.isConnected) return window.removeEventListener('mousemove', onMove);
    const k = vb.w / svg.clientWidth, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) { vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; setVB(); svg.classList.add('panning'); }
  }
  svg.addEventListener('mouseup', e => {
    const wasDrag = drag && drag.moved;
    drag = null; svg.classList.remove('panning');
    if (!wasDrag) guess(e);
  });
  svg.addEventListener('mouseleave', () => { drag = null; svg.classList.remove('panning'); });

  // ---- Markeringar (ritas om vid zoom så de behåller storlek) ----
  let shown = null; // senaste svaret att visa
  function drawMarks() {
    if (!shown) { marks.innerHTML = ''; return; }
    const s = vb.w / 360; // skala så markörer ser lika stora ut oavsett zoom
    const { p, glon, glat, ok } = shown;
    const reach = L.km + p.r, ry = reach / 111, rx = reach / (111 * Math.max(0.2, Math.cos(p.lat * Math.PI / 180)));
    marks.innerHTML = `
      <ellipse cx="${gx(p.lon)}" cy="${gy(p.lat)}" rx="${rx}" ry="${ry}" class="zone ${ok ? 'ok' : 'bad'}"/>
      <line x1="${gx(glon)}" y1="${gy(glat)}" x2="${gx(p.lon)}" y2="${gy(p.lat)}" class="gline ${ok ? 'ok' : 'bad'}" stroke-width="${1.2 * s}"/>
      <circle cx="${gx(p.lon)}" cy="${gy(p.lat)}" r="${3 * s}" class="truth"/>
      <text x="${gx(p.lon)}" y="${gy(p.lat) - 5 * s}" font-size="${7 * s}" class="tlabel">${esc(p.n)}</text>
      <circle cx="${gx(glon)}" cy="${gy(glat)}" r="${2.6 * s}" class="guess ${ok ? 'ok' : 'bad'}"/>`;
  }

  function renderList() {
    app.querySelector('#list').innerHTML = places.map((p, k) => {
      const r = results[k];
      const cls = r ? (r.ok ? 'ok' : 'bad') : k === i ? 'cur' : '';
      return `<li class="${cls}">${r ? (r.ok ? '✓' : '✗') : k === i ? '▶' : '·'} ${esc(p.n)}${r ? ` <small>${kmStr(r.km)}</small>${p.more ? infoBtn(p.n, `<p>${esc(p.more)}</p>`) : ''}` : ''}</li>`;
    }).join('');
  }
  function ask() {
    const p = places[i];
    app.querySelector('#ask').innerHTML = `Var ligger <strong>${esc(p.n)}</strong>?`;
    app.querySelector('#ask').className = 'geo-ask';
    renderList();
  }

  function guess(e) {
    if (waiting || i >= places.length) return;
    const pt = toMap(e.clientX, e.clientY);
    const glon = pt.x - 180, glat = 90 - pt.y;
    const p = places[i];
    const km = Math.max(0, haversine(glat, glon, p.lat, p.lon) - p.r);
    const ok = km <= L.km;
    const pts = ok ? Math.round(50 + 50 * (1 - km / L.km)) : 0;
    points += pts;
    streak = ok ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak);
    results.push({ p, km, ok, pts });
    shown = { p, glon, glat, ok };
    drawMarks();
    const askEl = app.querySelector('#ask');
    askEl.className = 'geo-ask ' + (ok ? 'ok' : 'bad');
    askEl.innerHTML = ok
      ? `🎯 <strong>${esc(p.n)}</strong> – ${km < 1 ? 'mitt i prick!' : kmStr(km) + ' ifrån'} <span class="plus">+${pts}</span>`
      : `✗ <strong>${esc(p.n)}</strong> – ${kmStr(km)} ifrån (gränsen är ${L.km} km)`;
    if (p.more) askEl.insertAdjacentHTML('beforeend', ' ' + infoBtn(p.n, `<p>${esc(p.more)}</p>`));
    app.querySelector('#pts').textContent = `${points} p`;
    app.querySelector('#streak').textContent = streak >= 2 ? `🔥 ${streak} i rad` : '';
    app.querySelector('#hits').textContent = `${results.filter(r => r.ok).length}/${places.length} träffar`;
    i++;
    renderList();
    waiting = true;
    setTimeout(() => {
      waiting = false;
      if (!svg.isConnected) return;
      if (i >= places.length) return finish();
      shown = null; drawMarks(); ask();
    }, ok ? 1400 : 2600);
  }

  function finish() {
    window.removeEventListener('mousemove', onMove);
    const hits = results.filter(r => r.ok).length;
    const fresh = Store.updateWords(pk, results.map(r => ({ key: geoKey(cat, r.p), ok: r.ok })));
    Store.addAttempt({
      quiz: `${track.id}/${cat.id}/${level}`, title: `${cat.icon} ${cat.name} (${L.name})`, at: new Date().toISOString(),
      score: hits, total: results.length, secs: 0,
      missed: results.filter(r => !r.ok).map(r => ({ q: r.p.n, a: kmStr(r.km) + ' fel' })),
    });
    const avg = results.reduce((s, r) => s + r.km, 0) / results.length;
    app.querySelector('#ask').innerHTML = '🏁 Klart!';
    app.querySelector('#result').innerHTML = `<div class="result">
      <strong>${hits === results.length ? '🎉 Alla träffar!' : 'Klart!'}</strong>
      ${hits} av ${results.length} träffar · <strong>${points} poäng</strong> · snittavstånd ${kmStr(avg)}${bestStreak >= 3 ? ` · bästa svit 🔥 ${bestStreak}` : ''}
      ${fresh ? `<br>📚 ${fresh === 1 ? '1 ny plats' : fresh + ' nya platser'} som du nu kan på nivån ${L.name}!` : ''}
      <br><button class="btn" id="again">Spela igen</button>
    </div>`;
    app.querySelector('#again').onclick = () => playMap(track, cat, level, onlyUnknown, onBack);
  }

  ask();
}

// ---------- Statistik på resultatsidan ----------
function geoStatsHtml() {
  const knownAll = Store.load().known;
  let html = '';
  TRACKS.filter(t => t.type === 'map').forEach(track => {
    Object.entries(GEO_LEVELS).forEach(([lk, lv]) => {
      const pk = geoPair(track, lk), m = knownAll[pk];
      if (!m) return;
      let sum = 0, tot = 0;
      const rows = track.categories.map(cat => {
        const p = geoProgress(track, cat, lk);
        sum += p.known; tot += p.total;
        const chips = cat.places.map(pl => {
          const s = m[geoKey(cat, pl)] || 0;
          return `<span class="chip ${s >= KNOWN_AT ? 'known' : s > 0 ? 'half' : ''}">${esc(pl.n)}${pl.more ? infoBtn(pl.n, `<p>${esc(pl.more)}</p>`) : ''}</span>`;
        }).join(' ');
        return `<tr><td>${cat.icon} ${cat.name}<br><small>${p.known}/${p.total}</small>
          <div class="progress"><div style="width:${Math.round(100 * p.known / p.total)}%"></div></div>
          <button class="link" data-reset="${pk}|${cat.id}">Nollställ</button></td><td>${chips}</td></tr>`;
      }).join('');
      html += `<h3>${track.icon} ${track.name} – ${lv.name} (${sum}/${tot})</h3><table class="vocab">${rows}</table>`;
    });
  });
  return html;
}
