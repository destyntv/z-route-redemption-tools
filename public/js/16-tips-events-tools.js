// ========== TIPS / NOW / TOOLS / POLISH ==========
const TIPS_DB = [
  { cat: 'VS', t: 'If unsure, SAVE the resource for the correct VS day.' },
  { cat: 'VS', t: 'Fighter Parts & Combat Chips → Monday. Component Chests → Wednesday only.' },
  { cat: 'VS', t: 'Don’t collect finished buildings until Construction day (Tuesday).' },
  { cat: 'MR', t: 'Double-dip: same action when VS day and Mission Readiness category match.' },
  { cat: 'MR', t: 'Capital Appointment + MR window + VS day = triple benefit when aligned.' },
  { cat: 'Fighter', t: 'Training progress <80% + Combat Chips = 50% crit chance. Parts never crit.' },
  { cat: 'Fighter', t: 'Fighter stats convert to ALL heroes’ HP/ATK/DEF in battle.' },
  { cat: 'Formation', t: 'Front-Right takes the most damage — put your best tank there.' },
  { cat: 'Formation', t: '5 same faction = +20% HP/ATK/DEF. Prefer full core over mixed.' },
  { cat: 'Casualties', t: 'Hospital overflow becomes permanent deaths — raise beds before big marches.' },
  { cat: 'Casualties', t: 'Higher troop tier (T7–T10) reduces permanent loss for the same fight.' },
  { cat: 'Roster', t: 'Save to cache after edits. Export TXT/JSON for backup.' },
  { cat: 'Events', t: 'Devourers: kill map mobs to spawn Zombie Chiefs — no chiefs, no big rewards.' },
  { cat: 'Events', t: 'Pandora: save speedups until the matching task day appears.' }
];

function renderTipsGuide() {
  const q = (document.getElementById('tipsSearch')?.value || '').toLowerCase();
  const box = document.getElementById('tipsGuide');
  if (!box) return;
  const list = TIPS_DB.filter(x => !q || x.cat.toLowerCase().includes(q) || x.t.toLowerCase().includes(q));
  const cats = [...new Set(list.map(x => x.cat))];
  box.innerHTML = cats.map(c =>
    `<h3>${c}</h3>` + list.filter(x => x.cat === c).map(x => `<div class="tip-note">${x.t}</div>`).join('')
  ).join('');
}

function renderNowAdvice() {
  const d = typeof getGuideDay === 'function' ? getGuideDay() : new Date().getDay();
  const mr = document.getElementById('nowMr')?.value || 'none';
  const info = typeof VS_PHASE !== 'undefined' ? VS_PHASE[d] : null;
  const el = document.getElementById('nowAdvice');
  if (!el) return;
  if (!info) { el.textContent = 'Load page fully first.'; return; }
  let lines = [`<strong>${VS_DAY_NAMES[d]} · ${info.phase}</strong> (guide clock)`, ...info.items.map(i => '☐ ' + i)];
  if (d === 1 && mr === 'fighter') lines.push('🔥 <strong>Do now:</strong> Fighter Parts + Chips (VS Mon + MR Fighter).');
  if (d === 3 && (mr === 'tech' || mr === 'fighter')) lines.push('🔥 <strong>Do now:</strong> Open Component Chests.');
  if (mr !== 'none' && !((d === 1 && mr === 'fighter') || (d === 3 && mr === 'tech'))) {
    lines.push('MR is <em>' + mr + '</em> — small spends for MR chests OK; keep big stacks for Mon/Wed if possible.');
  }
  if (d === 0) lines.push('Rest day — bank everything.');
  el.innerHTML = lines.map(l => '• ' + l).join('<br>');
}

function giantInvaderFromRoster() {
  const fac = document.getElementById('giFaction')?.value || 'Warrior';
  const owned = [];
  document.querySelectorAll('#rosterList > div').forEach(row => {
    const n = row.querySelector('.h-name')?.value;
    const p = +row.querySelector('.h-power')?.value || 0;
    const h = HEROES.find(x => x.name === n);
    if (h && h.faction === fac) owned.push({ ...h, power: p || h.power });
  });
  owned.sort((a, b) => (b.power || 0) - (a.power || 0));
  const tanks = owned.filter(h => h.role === 'Tank');
  const rest = owned.filter(h => h.role !== 'Tank');
  const squad = [];
  if (tanks[0]) squad.push(tanks[0]);
  rest.forEach(h => { if (squad.length < 5 && !squad.includes(h)) squad.push(h); });
  owned.forEach(h => { if (squad.length < 5 && !squad.includes(h)) squad.push(h); });
  const box = document.getElementById('giResult');
  if (!box) return;
  if (squad.length < 5) {
    box.innerHTML = '<div class="empty-state">Need more <strong>' + fac + '</strong> heroes on Roster (have ' + owned.length + ').</div>';
    return;
  }
  box.innerHTML = squad.map(h => h.name + ' (' + (h.power||0).toLocaleString() + ')').join(' · ') +
    ' <button class="green" onclick=\'placeSquad(' + JSON.stringify(squad).replace(/'/g,"&#39;") + ');goTab("formation")\'>Apply formation</button>';
}

function calcRally() {
  const you = +document.getElementById('rallyYou')?.value || 0;
  const mates = +document.getElementById('rallyMates')?.value || 0;
  const enemy = +document.getElementById('rallyEnemy')?.value || 1;
  const total = you + mates;
  const ratio = total / enemy;
  let msg = ratio >= 1.2 ? 'Strong — likely kill' : ratio >= 0.9 ? 'Close — risky' : 'Underpowered — add marches or skip';
  document.getElementById('rallyResult').innerHTML = `Combined ${total.toLocaleString()} vs ${enemy.toLocaleString()} (ratio ${ratio.toFixed(2)}). <strong>${msg}</strong>. <span class="estimated">Estimate</span>`;
}

function calcHospital() {
  const beds = +document.getElementById('hospBeds')?.value || 0;
  const w = +document.getElementById('hospWound')?.value || 0;
  const overflow = Math.max(0, w - beds);
  document.getElementById('hospResult').innerHTML = overflow
    ? `<span class="bad">Overflow ${overflow.toLocaleString()} → likely permanent deaths.</span> Need ~${overflow} more beds.`
    : `<span class="good">Beds cover expected wounded.</span>`;
}

function calcSpeedups() {
  const b = +document.getElementById('suBuild')?.value || 0;
  const r = +document.getElementById('suRes')?.value || 0;
  const t = +document.getElementById('suTrain')?.value || 0;
  const h = +document.getElementById('suHeal')?.value || 0;
  document.getElementById('suResult').innerHTML =
    `Build <strong>${b}h</strong> → Tue/Fri/Sat · Research <strong>${r}h</strong> → Wed/Fri/Sat · Train <strong>${t}h</strong> → Fri/Sat · Heal <strong>${h}h</strong> → Sat/PvP. Total ${b+r+t+h}h banked.`;
}

function counterHint() {
  const names = (document.getElementById('enemyNames')?.value || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const fac = {};
  names.forEach(n => {
    const h = HEROES.find(x => x.name.toLowerCase() === n.toLowerCase());
    if (h) fac[h.faction] = (fac[h.faction] || 0) + 1;
  });
  const top = Object.entries(fac).sort((a, b) => b[1] - a[1])[0];
  const counter = { Warrior: 'Tactical', Tactical: 'Assault', Assault: 'Warrior' };
  const box = document.getElementById('counterResult');
  if (!top) { box.textContent = 'No known heroes matched. Check spelling.'; return; }
  box.innerHTML = `Enemy lean: <strong>${top[0]}</strong> (${top[1]}). Try <strong>${counter[top[0]]}</strong> core or same-faction +20%. <span class="estimated">Heuristic</span>`;
}

function exportFullBackup() {
  const data = {
    v: 1,
    at: new Date().toISOString(),
    profile: {
      username: document.getElementById('username')?.value,
      hospital: document.getElementById('hospital')?.value,
      desc: document.getElementById('profileDesc')?.value
    },
    roster: [],
    fighter: localStorage.getItem('zr_fighter'),
    troops: {},
    offset: localStorage.getItem('zr_server_offset')
  };
  document.querySelectorAll('#rosterList > div').forEach(row => {
    const name = row.querySelector('.h-name')?.value;
    if (name) data.roster.push({
      name,
      stars: +row.querySelector('.h-stars')?.value || 0,
      power: +row.querySelector('.h-power')?.value || 0
    });
  });
  for (let i = 1; i <= 10; i++) data.troops[i] = document.getElementById('tc' + i)?.value || 0;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'zroute-backup.json';
  a.click();
}

function importFullBackup(ev) {
  const f = ev.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      pushUndo();
      document.getElementById('rosterList').innerHTML = '';
      (data.roster || []).forEach(h => {
        const found = HEROES.find(x => x.name === h.name);
        addHeroRow(found ? { ...found, ...h } : h);
      });
      if (data.profile?.username) document.getElementById('username').value = data.profile.username;
      if (data.profile?.hospital) document.getElementById('hospital').value = data.profile.hospital;
      if (data.troops) for (let i = 1; i <= 10; i++) {
        const el = document.getElementById('tc' + i);
        if (el) el.value = data.troops[i] || 0;
      }
      markSaved();
      alert('Backup imported.');
    } catch (e) { alert('Invalid backup: ' + e.message); }
  };
  r.readAsText(f);
  ev.target.value = '';
}

function resetDemoData() {
  if (!confirm('Reset casualty/kill demo numbers to defaults? Roster is kept.')) return;
  const defaults = { mySoldiers: 10000, enemyPower: 12000, myPower: 15000, myMorale: 30, enemyMorale: 20 };
  Object.entries(defaults).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  alert('Demo fields reset.');
}

function printDayCard() {
  const d = typeof getGuideDay === 'function' ? getGuideDay() : new Date().getDay();
  const info = VS_PHASE[d];
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>VS ${VS_DAY_NAMES[d]}</title>
    <style>body{font-family:system-ui;padding:24px} li{margin:8px 0} h1{margin:0}</style></head><body>
    <h1>${VS_DAY_NAMES[d]} · ${info.phase}</h1>
    <p>${info.short}</p><ul>${info.items.map(i => '<li>☐ ' + i + '</li>').join('')}</ul>
    <p style="color:#666;font-size:12px">Z Route analyzer · SERVER day guide</p>
    <script>onload=()=>print()<\/script></body></html>`);
  w.document.close();
}

function markSaved() {
  const el = document.getElementById('saveInd');
  if (!el) return;
  el.textContent = 'Saved · ' + new Date().toLocaleTimeString();
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1200);
}

function toggleCompact() {
  document.body.classList.toggle('compact');
  localStorage.setItem('zr_compact', document.body.classList.contains('compact') ? '1' : '0');
}

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 's' || e.key === 'S') { e.preventDefault(); saveRoster(); markSaved(); }
});
