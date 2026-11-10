// ========== MODE / HELP / CHIPS ==========
function setMode(mode) {
  document.body.classList.remove('mode-basic', 'mode-advanced');
  document.body.classList.add(mode === 'advanced' ? 'mode-advanced' : 'mode-basic');
  document.getElementById('btnBasic').className = mode === 'basic' ? 'green' : 'secondary';
  document.getElementById('btnAdvanced').className = mode === 'advanced' ? 'green' : 'secondary';
  localStorage.setItem('zr_mode', mode);
  if (mode === 'advanced') buildHeroChips();
}
function toggleHelp() {
  const box = document.getElementById('helpBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
function buildHeroChips() {
  const box = document.getElementById('heroChips');
  if (!box) return;
  box.innerHTML = HEROES.map(h => {
    const f = h.faction.toLowerCase();
    return `<span class="hero-chip" data-name="${h.name}" onclick="this.classList.toggle('selected')">
      <span class="avatar ${f}">${h.name.slice(0,2)}</span>${h.name} <small class="muted">${h.rarity||''}</small>
    </span>`;
  }).join('');
}
function applyChipSelection() {
  const selected = Array.from(document.querySelectorAll('.hero-chip.selected')).map(c => c.dataset.name);
  if (selected.length === 0) { alert('Tap some heroes first.'); return; }
  document.getElementById('rosterList').innerHTML = '';
  selected.forEach(name => {
    const h = HEROES.find(x => x.name === name);
    if (h) addHeroRow(h);
  });
  showSuggestions();
  alert('Applied ' + selected.length + ' heroes to your roster. Adjust stars/power then Save.');
}

// ========== INIT ==========
