// ========== COMMAND STRIP / NAV / UNDO / VS DAY ==========
let _undoStack = [];
function goTab(name) {
  const t = document.querySelector('.tab[data-tab="' + name + '"]');
  if (t) t.click();
}
function undoLast() {
  if (!_undoStack.length) { alert('Nothing to undo.'); return; }
  const snap = _undoStack.pop();
  document.getElementById('rosterList').innerHTML = '';
  (snap.roster || []).forEach(h => addHeroRow(h));
  showSuggestions();
  updateStats();
  syncAllTabs();
  alert('Undo applied.');
}
function pushUndo() {
  const rows = document.querySelectorAll('#rosterList > div');
  const roster = [];
  rows.forEach(r => {
    const name = r.querySelector('.h-name')?.value;
    if (name) roster.push({
      name,
      stars: +r.querySelector('.h-stars')?.value || 0,
      power: +r.querySelector('.h-power')?.value || 0
    });
  });
  _undoStack.push({ roster });
  if (_undoStack.length > 10) _undoStack.shift();
}
function updateCommandStrip() {
  const d = getGuideDay();
  const info = VS_PHASE[d];
  const mode = document.getElementById('timeModeTop')?.value || 'server';
  const el = document.getElementById('cmdToday');
  if (el) {
    el.textContent = VS_DAY_NAMES[d] + ' · ' + info.phase;
  }
  const hint = document.getElementById('cmdHint');
  if (hint) {
    hint.textContent = ' · ' + (mode === 'server' ? 'SERVER day' : 'LOCAL day') + ' · ' + info.short;
  }
  const box = document.getElementById('cmdSpend');
  if (box) {
    const server = getServerNow();
    const key = 'srv-' + server.getFullYear() + '-' + (server.getMonth()+1) + '-' + server.getDate() + '-d' + d;
    const done = JSON.parse(localStorage.getItem('zr_cmd_done') || '{}');
    box.innerHTML = info.items.map((s, i) => {
      const id = key + '-' + i;
      return `<label class="cmd-chip ${done[id] ? 'done' : ''}" style="cursor:pointer">
        <input type="checkbox" class="chk" data-id="${id}" ${done[id] ? 'checked' : ''} onchange="toggleCmdCheck(this)"> ${s}
      </label>`;
    }).join('');
  }
  // keep other day selectors in sync when on auto
  const vsPick = document.getElementById('vsDayPick');
  if (vsPick && vsPick.value === '') { /* auto */ }
  const fVs = document.getElementById('fVsDay');
  if (fVs && !fVs.dataset.locked) fVs.value = String(d);
}
function toggleCmdCheck(input) {
  const done = JSON.parse(localStorage.getItem('zr_cmd_done') || '{}');
  const id = input.dataset.id;
  if (input.checked) done[id] = 1;
  else delete done[id];
  localStorage.setItem('zr_cmd_done', JSON.stringify(done));
  input.closest('.cmd-chip')?.classList.toggle('done', input.checked);
}
function toggleCmdChip(el) {
  // legacy no-op if any old chips remain
  const cb = el.querySelector?.('input[type=checkbox]');
  if (cb) { cb.checked = !cb.checked; toggleCmdCheck(cb); }
}
