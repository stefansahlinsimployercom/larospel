// Admin-läge: låser upp alla steg i färdighetsträden (matte, fysik) så att man kan hoppa fritt.
// Slås på med PIN-koden nedan via 🔒-knappen i sidhuvudet. Sparas tills det slås av.
// OBS: spelet körs helt i webbläsaren – PIN:en är en enkel spärr, inget riktigt säkerhetsskydd.

const ADMIN_PIN = '1234'; // ← byt till en egen kod

const isAdmin = () => Store.getSetting('admin') === true;

function renderAdminState() {
  const on = isAdmin();
  document.body.classList.toggle('admin', on);
  const b = document.getElementById('admin');
  b.textContent = on ? '🔓 ADMIN' : '🔒';
  b.title = on ? 'Admin-läge är på – klicka för att stänga av' : 'Admin-läge (kräver PIN)';
  // Rita om trädet om det visas, så att låsen uppdateras direkt
  const back = document.querySelector('.tree') && app.querySelector('h2')?.textContent;
  if (back) { const t = TRACKS.find(x => back.includes(x.name) && x.type === 'tree'); if (t) showMathTree(t); }
}

function toggleAdmin() {
  if (isAdmin()) {
    Store.setSetting('admin', false);
    renderAdminState();
    return;
  }
  document.querySelector('.info-overlay')?.remove();
  const ov = document.createElement('div');
  ov.className = 'info-overlay';
  ov.innerHTML = `<div class="info-box admin-box" role="dialog">
    <button class="info-close" title="Stäng">✕</button>
    <h3>🔒 Admin-läge</h3>
    <p>I admin-läget är alla steg upplåsta, så du kan hoppa fritt mellan nivåerna.</p>
    <form id="adminform"><input id="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN-kod">
      <button class="btn" type="submit">Lås upp</button></form>
    <p class="small" id="pinmsg"></p></div>`;
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.info-close')) close(); });
  ov.querySelector('#adminform').addEventListener('submit', e => {
    e.preventDefault();
    const inp = ov.querySelector('#pin');
    if (inp.value === ADMIN_PIN) { Store.setSetting('admin', true); close(); renderAdminState(); }
    else { ov.querySelector('#pinmsg').textContent = '✗ Fel PIN-kod.'; inp.value = ''; inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); }
  });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(ov);
  ov.querySelector('#pin').focus();
}

document.getElementById('admin').onclick = toggleAdmin;
renderAdminState();
