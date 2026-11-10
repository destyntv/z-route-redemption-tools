// ========== TABS ==========
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.tab).classList.add('active');
    syncAllTabs();
    if (t.dataset.tab === 'stats') updateStats();
    if (t.dataset.tab === 'history') renderBattles();
    if (t.dataset.tab === 'formation') fillFormationSelects();
    if (t.dataset.tab === 'readiness') { try { calcReadiness(); } catch(e){} }
    if (t.dataset.tab === 'heroes') renderHeroTable();
    if (t.dataset.tab === 'vsguide') { updateClocks(); highlightVsDay(); }
    if (t.dataset.tab === 'about') renderGuestbook();
    if (t.dataset.tab === 'events') showEventSection('ev-vs');
    if (t.dataset.tab === 'fighter') { calcFighter(); fighterSpendAdvice(); fighterTrainAdvice(); fighterWingAdvice(); calcPowerSplit(); }
    if (t.dataset.tab === 'now') renderNowAdvice();
    if (t.dataset.tab === 'tips') renderTipsGuide();
  });
});

function showEventSection(id) {
  document.querySelectorAll('.event-section').forEach(el => { el.style.display = 'none'; });
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function applyMetaCore() {
  const core = ['Arnold', 'Monroe', 'Dirk', 'Carter', 'Lucian'];
  const heroes = core.map(n => HEROES.find(h => h.name === n)).filter(Boolean);
  if (heroes.length < 5) { alert('Core heroes missing from DB.'); return; }
  goTab('formation');
  placeSquad(heroes);
  alert('Warrior meta core applied to Formation.');
}

function highlightVsDay() {
  const pick = document.getElementById('vsDayPick')?.value;
  const d = (pick === '' || pick == null) ? getGuideDay() : +pick;
  const info = VS_PHASE[d];
  const box = document.getElementById('vsDayChecklist');
  if (box) {
    const server = getServerNow();
    const key = 'vs-' + server.getFullYear() + '-' + (server.getMonth()+1) + '-' + server.getDate() + '-d' + d;
    const done = JSON.parse(localStorage.getItem('zr_cmd_done') || '{}');
    box.innerHTML = '<p><strong>' + VS_DAY_NAMES[d] + ' · ' + info.phase + '</strong> <span class="muted">(' +
      (document.getElementById('timeModeTop')?.value === 'local' ? 'LOCAL' : 'SERVER') + ' day)</span></p>' +
      info.items.map((s, i) => {
        const id = key + '-' + i;
        return `<button type="button" class="cmd-chip ${done[id] ? 'done' : ''}" data-id="${id}" aria-pressed="${!!done[id]}" onclick="toggleCmdButton(this)">
          <span class="cmd-chip-indicator" aria-hidden="true">${done[id] ? '✓' : '○'}</span><span>${s}</span>
        </button>`;
      }).join('');
  }
  const table = document.getElementById('vsWeekTable');
  if (table) {
    // rows: 1=Mon … 6=Sat, 7=Sun — map day index to row
    const rowFor = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: 7 };
    [...table.querySelectorAll('tr')].forEach((tr, i) => {
      if (i === 0) return;
      tr.style.outline = (i === rowFor[d]) ? '2px solid var(--accent)' : '';
      tr.style.background = (i === rowFor[d]) ? 'rgba(231,76,60,0.12)' : '';
    });
  }
  updateCommandStrip();
}

/** Push roster + troops + hospital into Casualty, Kill Calc, Stats */
function syncAllTabs() {
  const rows = document.querySelectorAll('#rosterList > div');
  let heroPower = 0;
  const names = [];
  rows.forEach(row => {
    const n = row.querySelector('.h-name')?.value;
    const p = +row.querySelector('.h-power')?.value || 0;
    if (n) { names.push(n); heroPower += p; }
  });
  let troopTotal = 0, weighted = 0;
  for (let i = 1; i <= 10; i++) {
    const n = +(document.getElementById('tc' + i)?.value || 0);
    troopTotal += n;
    weighted += n * i;
  }
  const avgTier = troopTotal ? Math.round(weighted / troopTotal) : 6;
  const hospital = +document.getElementById('hospital')?.value || 5000;

  // Casualty fields
  const mySol = document.getElementById('mySoldiers');
  const myP = document.getElementById('myPower');
  const tierSel = document.getElementById('troopTier');
  if (mySol && troopTotal > 0) mySol.value = troopTotal;
  if (myP && heroPower > 0) myP.value = heroPower;
  if (tierSel) tierSel.value = String(Math.min(10, Math.max(1, avgTier)));

  // Kill calc fields
  const killHero = document.getElementById('killHeroPower');
  const killSolP = document.getElementById('killSoldierPower');
  const killMySol = document.getElementById('killMySoldiers');
  const killTier = document.getElementById('killMyTier');
  const killHosp = document.getElementById('killHospital');
  const killMyP = document.getElementById('killMyPower');
  if (killHero && heroPower > 0) killHero.value = heroPower;
  if (killMySol && troopTotal > 0) killMySol.value = troopTotal;
  if (killTier) killTier.value = String(Math.min(10, Math.max(1, avgTier)));
  if (killHosp) killHosp.value = hospital;
  // rough soldier power estimate if empty
  if (killSolP && troopTotal > 0 && !(+killSolP.value)) killSolP.value = Math.round(troopTotal * avgTier * 25);
  if (killMyP && heroPower > 0) killMyP.value = heroPower + (+killSolP?.value || 0);

  updateTierPreview();
  showSuggestions();
}
