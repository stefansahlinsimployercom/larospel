// Kunskapskartan: visuell överblick över ALLT i spelet – hur stort varje område är, var du är och vad som återstår.
// En ruta per sak: grön = kan, gul = på gång, orange = dags att repetera, grå = inte än, streckad = kommer snart.
// Läser progress från Store och respektive spels nycklar (se kommentarerna per ämnestyp nedan).

const KM_ORDER = { known: 3, due: 2, half: 1, none: 0 };
// Läget för en sak: kan / dags att repetera / på gång / inte än
function kmState(pk, key) {
  const d = Store.load(), v = ((d.known || {})[pk] || {})[key] || 0, r = ((d.review || {})[pk] || {})[key];
  if (v >= KNOWN_AT) return r && r.due <= Store.now() ? 'due' : 'known';
  return v > 0 ? 'half' : 'none';
}
const kmBest = (...s) => s.reduce((a, b) => (KM_ORDER[b] > KM_ORDER[a] ? b : a), 'none');
const kmNode = n => { if (n.soon) return 'soon'; const s = mathState(n.id); return s.done ? 'known' : s.streak > 0 || s.ok > 0 ? 'half' : 'none'; };

// Alla ämnen → områden → saker med läge
function knowledgeInventory() {
  return TRACKS.map(t => {
    let areas = [], note = '';
    if (t.type === 'tree') {
      areas = t.branches.map(b => ({ name: b.name, icon: b.icon, items: b.nodes.map(n => ({ label: n.name, state: kmNode(n) })) }));
    } else if (t.type === 'events') {
      areas = t.categories.map(c => ({ name: c.name, icon: c.icon, items: c.events.map(ev => ({ label: `${fmtYear(ev.y)}: ${ev.e}`,
        state: kmBest(kmState('historia/fritext', `${c.id}/${ev.e}`), kmState('historia/tidslinje', `${c.id}/${ev.e}`)) })) }));
      if (t.links) areas.push({ name: 'Orsak & verkan', icon: '🔗', items: t.links.map(l => ({ label: `${l.a} → ${l.b}`, state: kmState('historia/koppling', `${l.a}→${l.b}`) })) });
    } else if (t.languages) {
      const { from, to } = getPair(t);
      note = `${t.languages[from]} → ${t.languages[to]}`;
      areas = t.categories.map(c => ({ name: c.name, icon: c.icon, items: c.words.map(w => ({ label: `${alts(w[from])[0]} → ${alts(w[to])[0]}`, state: kmState(`${t.id}/${from}-${to}`, wordKey(t, c, w)) })) }));
    } else if (t.type === 'map') {
      const lvl = Store.getSetting(t.id + '-level') || 'allm';
      note = GEO_LEVELS[lvl].name;
      areas = t.categories.map(c => ({ name: c.name, icon: c.icon, items: c.places.map(p => ({ label: p.n, state: kmState(`${t.id}/${lvl}`, `${c.id}/${p.n}`) })) }));
    } else if (t.type === 'sort') {
      areas = t.sets.map(s => ({ name: s.name, icon: s.icon, items: s.items.map(it => ({ label: `${it.n}`, state: kmState(`${t.id}/${s.id}`, it.n) })) }));
    } else if (t.type === 'recipe') {
      areas = [{ name: 'Recept', icon: '👩‍🍳', items: t.recipes.map(r => ({ label: r.name, state: kmState(t.id, r.id) })) },
        { name: 'Vad gick fel?', icon: '🔍', items: t.recipes.flatMap(r => (r.faults || []).map(f => ({ label: `${r.name}: ${f.sym}`, state: kmState(`${t.id}/fel`, `${r.id}/${f.sym}`) }))) }];
    } else if (t.type === 'diag') {
      areas = t.cases.map(c => ({ name: c.name, icon: c.icon, items: c.causes.map(k => ({ label: k.n, state: kmState(t.id, `${c.id}/${k.id}`) })) }));
    } else if (t.type === 'chain') {
      areas = t.chains.map(ch => ({ name: ch.name, icon: ch.icon, items: [{ label: 'Kedjans ordning', state: kmState(`${t.id}/${ch.id}`, '_ordning') },
        ...ch.actors.map(a => ({ label: a.n, state: kmState(`${t.id}/${ch.id}`, a.n) }))] }));
    } else if (t.type === 'build') {
      areas = t.builds.map(b => ({ name: b.name, icon: b.icon, items: b.slots.map(s => ({ label: s.n, state: kmState(`${t.id}/${b.id}`, s.id) })) }));
    } else if (t.type === 'bluff') {
      areas = [{ name: 'Påståenden', icon: '💬', items: t.claims.map(c => ({ label: c.parts.join(''), state: kmState('bluff', c.id) })) }];
    } else if (t.type === 'estimate') {
      areas = [{ name: 'Frågor', icon: '🎯', items: t.questions.map(q => ({ label: q.q, state: kmState('uppskatta', q.id) })) }];
    }
    const items = areas.flatMap(a => a.items).filter(i => i.state !== 'soon');
    const count = s => items.filter(i => i.state === s).length;
    return { track: t, areas, note, total: items.length, known: count('known'), due: count('due'), half: count('half') };
  }).filter(x => x.total);
}

function kmTotals(inv = knowledgeInventory()) {
  const total = inv.reduce((s, x) => s + x.total, 0), known = inv.reduce((s, x) => s + x.known + x.due, 0), due = inv.reduce((s, x) => s + x.due, 0);
  return { total, known, due, pct: total ? Math.round(100 * known / total) : 0 };
}

// Litet kort på startsidan
function kmEntryHtml() {
  const t = kmTotals();
  return `<div class="kmentry" id="kmentry" role="button" tabindex="0">
    <div class="kmring" style="--p:${t.pct}"><span>${t.pct}%</span></div>
    <div><strong>🗺️ Min kunskapskarta</strong><br><span class="small">Du kan ${t.known} av ${t.total} saker i spelet${t.due ? ` · 🔁 ${t.due} att repetera` : ''} – se helheten</span></div></div>`;
}

// ---------- Själva kartan ----------
function showKnowledgeMap() {
  stopTimer();
  const inv = knowledgeInventory(), tot = kmTotals(inv);
  const max = Math.max(...inv.map(x => x.total));
  const LBL = { known: 'kan', due: 'dags att repetera', half: 'på gång', none: 'inte än', soon: 'kommer snart' };
  app.innerHTML = `
    <button class="back">← Alla ämnen</button>
    <h2>🗺️ Min kunskapskarta</h2>
    <div class="kmhead">
      <div class="kmring big" style="--p:${tot.pct}"><span>${tot.pct}%</span></div>
      <div><strong>Du kan ${tot.known} av ${tot.total} saker</strong> i ${inv.length} ämnen.${tot.due ? `<br>🔁 ${tot.due} är dags att repetera.` : ''}
        <div class="kmlegend"><span><i class="sq known"></i>kan</span><span><i class="sq half"></i>på gång</span><span><i class="sq due"></i>dags att repetera</span><span><i class="sq none"></i>inte än</span><span><i class="sq soon"></i>kommer snart</span></div>
        <span class="small">En ruta = en sak. Ju fler rutor, desto större område. Håll muspekaren över en ruta för att se vad den är – klicka på ett ämne för att öva.</span>
        <p>${typeof competenceEntryHtml === 'function' ? competenceEntryHtml() : ''} ${typeof showCrossMap === 'function' ? '<button class="btn secondary" id="kmcross">🌐 Kopplingar mellan ämnen</button>' : ''}</p></div>
    </div>
    <div class="kmgrid">${inv.map((x, k) => {
      const pct = Math.round(100 * (x.known + x.due) / x.total);
      return `<div class="kmsubj" data-k="${k}" style="--w:${0.6 + 0.4 * x.total / max}">
        <div class="kmsubj-h"><span class="kmtitle">${x.track.icon} ${esc(x.track.name)}</span><span class="kmpct">${pct}%</span></div>
        <div class="progress"><div style="width:${pct}%"></div></div>
        ${x.note ? `<div class="small">${esc(x.note)}</div>` : ''}
        ${x.areas.map(a => `<div class="kmarea"><div class="kmarea-h">${a.icon} ${esc(a.name)} <span class="small">${a.items.filter(i => i.state === 'known' || i.state === 'due').length}/${a.items.filter(i => i.state !== 'soon').length}</span></div>
          <div class="kmsq">${a.items.map(i => `<i class="sq ${i.state}" title="${esc(i.label)} – ${LBL[i.state]}"></i>`).join('')}</div></div>`).join('')}
      </div>`;
    }).join('')}</div>`;
  app.querySelector('.back').onclick = showHome;
  app.querySelector('#kmcross')?.addEventListener('click', () => showCrossMap());
  app.querySelector('#kmcomp')?.addEventListener('click', () => showCompetence());
  app.querySelectorAll('.kmsubj').forEach(el => el.addEventListener('click', e => {
    if (e.target.closest('.sq')) return;
    showTrack(inv[+el.dataset.k].track);
  }));
}
