// ========== BACKGROUND LIBRARY + UPLOAD ==========
let _bgUrl = null;
function toggleBgLibrary() {
  const el = document.getElementById('bgLibrary');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function pickBgPreset(el) {
  document.querySelectorAll('.bg-preset').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const id = el.dataset.bg || 'none';
  document.body.classList.remove('bg-city','bg-hangar','bg-ember','bg-void','has-bg-image');
  if (_bgUrl) { URL.revokeObjectURL(_bgUrl); _bgUrl = null; }
  document.body.style.removeProperty('--user-bg');
  if (id !== 'none') document.body.classList.add('bg-' + id);
  localStorage.setItem('zr_bg_preset', id);
}
function setBackground(ev) {
  const file = ev.target.files?.[0];
  ev.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;
  if (_bgUrl) URL.revokeObjectURL(_bgUrl);
  _bgUrl = URL.createObjectURL(file);
  document.body.classList.remove('bg-city','bg-hangar','bg-ember','bg-void');
  document.body.style.setProperty('--user-bg', 'url("' + _bgUrl + '")');
  document.body.classList.add('has-bg-image');
  document.querySelectorAll('.bg-preset').forEach(x => x.classList.remove('active'));
  localStorage.setItem('zr_bg_preset', 'upload');
}
function clearBackground() {
  if (_bgUrl) { URL.revokeObjectURL(_bgUrl); _bgUrl = null; }
  document.body.style.removeProperty('--user-bg');
  document.body.classList.remove('has-bg-image','bg-city','bg-hangar','bg-ember','bg-void');
  localStorage.setItem('zr_bg_preset', 'none');
}
