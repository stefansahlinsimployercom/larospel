// Profiler (vem spelar?), spara ner/ladda upp progress, och start av appen.
// Laddas sist. Använder Profiles, Store, KNOWN_AT, esc, showHome, showInfo, renderAdminState från övriga filer.

const PROFILE_EMOJIS = ['🦉', '🦊', '🐼', '🐯', '🐸', '🐙', '🦄', '🐢', '🦁', '🐧', '🐝', '🦋', '🚀', '⭐', '🌻', '🎸'];

// Sammanfattning av en profils data (för korten och förhandsvisningen vid import)
function summarize(d) {
  if (!d) return { attempts: 0, known: 0, last: null };
  const known = Object.values(d.known || {}).reduce((s, m) => s + Object.values(m).filter(v => v >= KNOWN_AT).length, 0)
    + Object.values(d.math || {}).filter(s => s.done).length;
  const at = (d.attempts || []).map(a => a.at).sort();
  return { attempts: (d.attempts || []).length, known, last: at.length ? at[at.length - 1] : null };
}
const readProfileData = id => { try { return JSON.parse(localStorage.getItem(Store.keyFor(id))); } catch { return null; } };
const shortDate = iso => (iso ? new Date(iso).toLocaleDateString('sv-SE') : '–');

function renderProfileButton() {
  const a = Profiles.active();
  const b = document.getElementById('profile');
  b.textContent = a ? `${a.emoji} ${a.name}` : '👤 Välj spelare';
}
function switchTo(id) {
  Profiles.setActive(id);
  renderProfileButton();
  renderAdminState();
  showHome();
}

// ---------- Vem spelar? ----------
function showProfiles() {
  stopTimer();
  const list = Profiles.list(), active = Profiles.active();
  app.innerHTML = `
    ${active ? '<button class="back">← Tillbaka</button>' : ''}
    <h2>👋 Vem spelar?</h2>
    <p class="legend">Varje spelare har sin egen progress. Den sparas i den här webbläsaren – vill du ta med den till en annan dator: spara ner den under 📊 Resultat och ladda upp den där.</p>
    <div class="profiles">
      ${list.map(p => {
        const s = summarize(readProfileData(p.id));
        return `<div class="pcard ${active && active.id === p.id ? 'cur' : ''}" data-id="${p.id}" role="button" tabindex="0">
          <div class="pemo">${p.emoji}</div><div class="pname">${esc(p.name)}</div>
          <div class="pstat">${s.known} saker kan · ${s.attempts} omgångar<br>Senast: ${shortDate(s.last)}</div>
          <div class="pact"><span data-edit="${p.id}" title="Byt namn">✏️</span><span data-del="${p.id}" title="Ta bort">🗑</span></div>
        </div>`;
      }).join('')}
      <div class="pcard new" id="newp" role="button" tabindex="0"><div class="pemo">＋</div><div class="pname">Ny spelare</div></div>
    </div>
    <div id="pform"></div>
    <p><button class="btn secondary" id="pimport">📥 Ladda upp sparad progress</button></p>`;
  app.querySelector('.back')?.addEventListener('click', showHome);
  app.querySelector('#pimport').onclick = startImport;
  app.querySelector('#newp').onclick = () => profileForm();
  // Inga spelare alls (ny webbläsare eller ny adress/port): öppna formuläret direkt och förklara varför
  if (!list.length) {
    app.querySelector('.legend').innerHTML = `<strong>Välkommen!</strong> Skriv ditt namn nedan för att börja spela.
      <br><span class="small">Har du spelat förut men ser inga spelare? Progressen sparas per webbläsare och adress – öppna Lärospel där du spelade sist,
      eller ladda upp en sparad progressfil med knappen längst ner.</span>`;
    profileForm();
  }
  app.querySelectorAll('.pcard[data-id]').forEach(c => c.addEventListener('click', e => {
    const id = c.dataset.id;
    if (e.target.closest('[data-edit]')) return profileForm(Profiles.list().find(p => p.id === id));
    if (e.target.closest('[data-del]')) {
      const p = Profiles.list().find(x => x.id === id);
      if (confirm(`Ta bort ${p.name} och all progress? Det går inte att ångra – spara gärna ner den först.`)) { Profiles.remove(id); renderProfileButton(); showProfiles(); }
      return;
    }
    switchTo(id);
  }));
}

// Formulär för ny spelare / byta namn
function profileForm(existing) {
  let emoji = existing ? existing.emoji : PROFILE_EMOJIS[Profiles.list().length % PROFILE_EMOJIS.length];
  const box = app.querySelector('#pform');
  box.innerHTML = `<div class="rnote">
    <h3>${existing ? '✏️ Ändra spelare' : '＋ Ny spelare'}</h3>
    <form id="pf"><input id="pfname" maxlength="20" placeholder="Namn" value="${existing ? esc(existing.name) : ''}" autocomplete="off">
      <div class="emojis">${PROFILE_EMOJIS.map(e => `<button type="button" class="emo ${e === emoji ? 'sel' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
      <button class="btn" type="submit">${existing ? 'Spara' : 'Skapa och spela'}</button></form></div>`;
  box.querySelectorAll('.emo').forEach(b => b.onclick = () => { emoji = b.dataset.e; box.querySelectorAll('.emo').forEach(x => x.classList.toggle('sel', x === b)); });
  box.querySelector('#pf').addEventListener('submit', e => {
    e.preventDefault();
    const name = box.querySelector('#pfname').value.trim();
    if (!name) return box.querySelector('#pfname').focus();
    if (existing) { Profiles.rename(existing.id, name, emoji); renderProfileButton(); showProfiles(); }
    else switchTo(Profiles.create(name, emoji));
  });
  box.querySelector('#pfname').focus();
  box.scrollIntoView({ block: 'nearest' });
}

// ---------- Spara ner (export) ----------
function exportProfile() {
  const p = Profiles.active();
  const data = { ...Store.load(), profile: { name: p.name, emoji: p.emoji }, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = p.name.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'spelare';
  a.download = `larospel-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

// ---------- Ladda upp (import) ----------
function startImport() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let d;
      try { d = JSON.parse(r.result); } catch { return showInfo('Kunde inte läsa filen', '<p>Filen verkar inte vara en sparad Lärospel-fil (JSON).</p>'); }
      if (!d || d.version !== 1 || !Array.isArray(d.attempts)) return showInfo('Fel sorts fil', '<p>Det här ser inte ut som en sparad Lärospel-progress.</p>');
      importDialog(d, f.name);
    };
    r.readAsText(f);
  };
  inp.click();
}

// Slå ihop två datamängder – det bästa behålls för varje sak
function mergeData(base, inc) {
  const out = JSON.parse(JSON.stringify(base));
  out.known ||= {}; out.math ||= {}; out.settings ||= {}; out.attempts ||= [];
  Object.entries(inc.known || {}).forEach(([pk, m]) => {
    const t = out.known[pk] ||= {};
    Object.entries(m).forEach(([k, v]) => { t[k] = Math.max(t[k] || 0, v); });
  });
  Object.entries(inc.math || {}).forEach(([id, s]) => {
    const t = out.math[id] || { streak: 0, done: false, ok: 0, fail: 0 };
    out.math[id] = { streak: Math.max(t.streak, s.streak || 0), done: t.done || !!s.done, ok: Math.max(t.ok, s.ok || 0), fail: Math.max(t.fail, s.fail || 0) };
  });
  out.log ||= {};
  Object.entries(inc.log || {}).forEach(([day, x]) => {
    const t = out.log[day] ||= {};
    Object.entries(x).forEach(([k, v]) => { t[k] = Math.max(t[k] || 0, v); });
  });
  out.xpBase = Math.max(out.xpBase || 0, inc.xpBase || 0);
  Object.entries(inc.stats || {}).forEach(([pk, m]) => { const t = (out.stats ||= {})[pk] ||= {}; Object.entries(m).forEach(([k, s]) => { if (!t[k]) t[k] = s; }); });
  const seen = new Set(out.attempts.map(a => a.quiz + '|' + a.at));
  (inc.attempts || []).forEach(a => { if (!seen.has(a.quiz + '|' + a.at)) out.attempts.push(a); });
  out.attempts.sort((a, b) => (a.at < b.at ? -1 : 1));
  Object.entries(inc.settings || {}).forEach(([k, v]) => {
    const cur = out.settings[k];
    if (cur === undefined) out.settings[k] = v;
    else if (cur && v && typeof cur === 'object' && typeof v === 'object') // t.ex. bästa stjärnor per recept
      Object.entries(v).forEach(([kk, vv]) => { if (typeof vv === 'number' && (cur[kk] == null || vv > cur[kk])) cur[kk] = vv; });
  });
  return out;
}

function importDialog(d, fileName) {
  const s = summarize(d);
  const name = d.profile?.name || 'Importerad', emoji = d.profile?.emoji || '📥';
  const list = Profiles.list(), active = Profiles.active();
  const clean = JSON.parse(JSON.stringify(d)); delete clean.profile; delete clean.exportedAt;
  document.querySelector('.info-overlay')?.remove();
  const ov = document.createElement('div');
  ov.className = 'info-overlay';
  ov.innerHTML = `<div class="info-box" role="dialog"><button class="info-close" title="Stäng">✕</button>
    <h3>📥 Ladda upp progress</h3>
    <div class="ipreview"><div class="pemo">${emoji}</div><div><strong>${esc(name)}</strong><br>
      <span class="small">${s.known} saker kan · ${s.attempts} omgångar · senast ${shortDate(s.last)}${d.exportedAt ? ` · sparad ${shortDate(d.exportedAt)}` : ''}</span><br>
      <span class="small">Fil: ${esc(fileName)}</span></div></div>
    <h4>Hur ska den läsas in?</h4>
    <label class="iopt"><input type="radio" name="how" value="new" checked> Som en <strong>ny spelare</strong>: <input id="iname" value="${esc(name)}" maxlength="20"></label>
    ${list.length ? `<label class="iopt"><input type="radio" name="how" value="merge"> <strong>Slå ihop</strong> med
      <select id="itarget">${list.map(p => `<option value="${p.id}" ${active && active.id === p.id ? 'selected' : ''}>${p.emoji} ${esc(p.name)}</option>`).join('')}</select>
      <span class="small">– det bästa resultatet behålls för varje sak</span></label>` : ''}
    <p><button class="btn" id="ido">Ladda upp</button> <button class="btn secondary" id="icancel">Avbryt</button></p></div>`;
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.info-close') || e.target.id === 'icancel') close(); });
  ov.querySelector('#iname').addEventListener('focus', () => { ov.querySelector('input[value=new]').checked = true; });
  ov.querySelector('#itarget')?.addEventListener('change', () => { ov.querySelector('input[value=merge]').checked = true; });
  ov.querySelector('#ido').onclick = () => {
    const how = ov.querySelector('input[name=how]:checked').value;
    let id;
    if (how === 'new') id = Profiles.create(ov.querySelector('#iname').value.trim() || name, emoji, clean);
    else {
      id = ov.querySelector('#itarget').value;
      const merged = mergeData(readProfileData(id) || { version: 1, settings: {}, attempts: [], known: {} }, clean);
      try { localStorage.setItem(Store.keyFor(id), JSON.stringify(merged)); } catch {}
    }
    close();
    switchTo(id);
    const p = Profiles.active();
    showInfo('Klart!', `<p>✅ Progressen är inläst för <strong>${p.emoji} ${esc(p.name)}</strong> – ${summarize(Store.load()).known} saker kan.</p>`);
  };
  document.body.appendChild(ov);
}

// ---------- Start ----------
Profiles.migrate();
document.getElementById('profile').onclick = showProfiles;
renderProfileButton();
renderAdminState();
showHome();
