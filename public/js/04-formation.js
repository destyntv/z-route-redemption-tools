// ========== FORMATION ==========
const FACTION_LETTER = { Warrior: 'W', Tactical: 'T', Assault: 'A' };
const FACTION_COLOR = { Warrior: '#d4a017', Tactical: '#e74c3c', Assault: '#3498db' };
let squads = JSON.parse(localStorage.getItem('zr_squads') || '{}');

function heroOptionLabel(h) {
  const letter = FACTION_LETTER[h.faction] || '?';
  const color = FACTION_COLOR[h.faction] || '#aaa';
  return `${letter} ${h.name} (${h.rarity||'?'})`;
}

function fillFormationSelects() {
  // Prefer roster heroes if any, else full list
  let list = [];
  document.querySelectorAll('#rosterList .h-name').forEach(s => {
    const h = HEROES.find(x => x.name === s.value);
    if (h) list.push(h);
  });
  if (list.length < 5) list = HEROES.slice();

  const opts = '<option value="">— empty —</option>' + list.map(h => {
    const letter = FACTION_LETTER[h.faction] || '?';
    return `<option value="${h.name}" style="color:${FACTION_COLOR[h.faction]}">${letter} ${h.name} (${h.rarity||'?'} · ${h.power?Math.round(h.power/1000)+'k':''})</option>`;
  }).join('');

  ['fl','fr','bl','bc','br'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = opts;
    if (prev) sel.value = prev;
  });
  updateFactionBonus();
  colorFormationSelects();
}

function colorFormationSelects() {
  ['fl','fr','bl','bc','br'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel || !sel.value) { sel.style.color = ''; return; }
    const f = getFaction(sel.value);
    const map = { warrior: '#d4a017', tactical: '#e74c3c', assault: '#3498db' };
    sel.style.color = map[f] || '';
    sel.style.fontWeight = '600';
  });
}

function updateFactionBonus() {
  colorFormationSelects();
  const names = ['fl','fr','bl','bc','br'].map(id => document.getElementById(id).value).filter(Boolean);
  const elVal = document.getElementById('bonusValue');
  const elLab = document.getElementById('bonusLabel');
  const sum = document.getElementById('squadSummary');
  if (names.length === 0) {
    if (elVal) elVal.textContent = '—';
    if (sum) sum.innerHTML = '';
    return;
  }
  const factions = names.map(n => {
    const h = HEROES.find(x => x.name === n);
    return h ? h.faction : '?';
  });
  const counts = {};
  factions.forEach(f => counts[f] = (counts[f]||0)+1);
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const max = sorted[0][1];
  const second = sorted[1] ? sorted[1][1] : 0;
  let bonus = 0;
  let label = 'No bonus';
  if (max >= 5) { bonus = 20; label = `5 ${sorted[0][0]}`; }
  else if (max >= 4) { bonus = 15; label = `4 ${sorted[0][0]}`; }
  else if (max === 3 && second === 2) { bonus = 10; label = `3+2 (${sorted[0][0]}/${sorted[1][0]})`; }
  else if (max >= 3) { bonus = 5; label = `3 ${sorted[0][0]}`; }
  else { label = 'Mixed'; }

  if (elVal) {
    elVal.textContent = bonus ? `+${bonus}%` : '0%';
    elVal.className = 'value ' + (bonus >= 15 ? 'good' : bonus > 0 ? 'warn' : '');
  }
  if (elLab) elLab.textContent = label;

  // Power estimate
  let totalP = 0;
  names.forEach(n => {
    const h = HEROES.find(x => x.name === n);
    if (h && h.power) totalP += h.power;
  });
  if (sum) {
    const colored = names.map(n => {
      const f = getFaction(n);
      const col = { warrior:'#d4a017', tactical:'#e74c3c', assault:'#3498db' }[f] || '#aaa';
      const letter = { warrior:'W', tactical:'T', assault:'A' }[f] || '?';
      return `<span style="color:${col};font-weight:600">${letter} ${n}</span>`;
    }).join(' · ');
    sum.innerHTML = `<strong>Squad:</strong> ${colored}<br><strong>Est. hero power:</strong> ${totalP ? totalP.toLocaleString() : '—'} · Bonus: +${bonus}%`;
  }
}

function getRosterHeroes() {
  const list = [];
  document.querySelectorAll('#rosterList .h-name').forEach(s => {
    const h = HEROES.find(x => x.name === s.value);
    if (h) {
      const stars = +(s.parentElement.querySelector('.h-stars')?.value || h.stars || 3);
      const power = +(s.parentElement.querySelector('.h-power')?.value || h.power || 0);
      list.push({ ...h, stars, power });
    }
  });
  return list.length ? list : HEROES.map(h => ({...h}));
}

function placeSquad(heroes) {
  // Sort: tanks first for front, DPS for back-center
  const tanks = heroes.filter(h => h.role === 'Tank');
  const dps = heroes.filter(h => h.role === 'DPS');
  const support = heroes.filter(h => h.role === 'Support');
  const rest = heroes.filter(h => !['Tank','DPS','Support'].includes(h.role));

  const ordered = [];
  // Front-Right = best tank
  if (tanks.length) ordered.push(tanks.shift());
  else if (heroes.length) ordered.push(heroes[0]);
  // Front-Left
  if (tanks.length) ordered.push(tanks.shift());
  else if (support.length) ordered.push(support.shift());
  else if (rest.length) ordered.push(rest.shift());
  else if (dps.length) ordered.push(dps.shift());
  // Back-Center = best DPS
  if (dps.length) ordered.push(dps.shift());
  else if (rest.length) ordered.push(rest.shift());
  // remaining back slots
  const remain = [...tanks, ...dps, ...support, ...rest].filter(Boolean);
  while (ordered.length < 5 && remain.length) ordered.push(remain.shift());

  const ids = ['fr','fl','bc','bl','br'];
  ids.forEach((id, i) => {
    const sel = document.getElementById(id);
    if (sel && ordered[i]) sel.value = ordered[i].name;
  });
  updateFactionBonus();
}

function autoForm(rule, faction) {
  const roster = getRosterHeroes().sort((a,b) => (b.power||0) - (a.power||0));
  let pick = [];

  if (rule === 'top') {
    pick = roster.slice(0, 5);
  } else if (rule === '5' && faction) {
    pick = roster.filter(h => h.faction === faction).slice(0, 5);
  } else if (rule === '4' || rule === '4:1') {
    const byF = {};
    roster.forEach(h => { byF[h.faction] = byF[h.faction] || []; byF[h.faction].push(h); });
    const best = Object.values(byF).sort((a,b) => b.length - a.length)[0] || [];
    pick = best.slice(0, 4);
    const used = new Set(pick.map(h => h.name));
    const filler = roster.find(h => !used.has(h.name));
    if (filler) pick.push(filler);
  } else if (rule === '3:2') {
    const byF = {};
    roster.forEach(h => { byF[h.faction] = byF[h.faction] || []; byF[h.faction].push(h); });
    const sorted = Object.values(byF).sort((a,b) => b.length - a.length);
    pick = (sorted[0]||[]).slice(0,3).concat((sorted[1]||[]).slice(0,2));
  } else if (rule === '3') {
    const byF = {};
    roster.forEach(h => { byF[h.faction] = byF[h.faction] || []; byF[h.faction].push(h); });
    const best = Object.values(byF).sort((a,b) => b.length - a.length)[0] || [];
    pick = best.slice(0, 3);
    const used = new Set(pick.map(h => h.name));
    roster.filter(h => !used.has(h.name)).slice(0, 2).forEach(h => pick.push(h));
  } else if (rule === 'mix') {
    // one of each faction preference then top
    const w = roster.filter(h => h.faction === 'Warrior');
    const t = roster.filter(h => h.faction === 'Tactical');
    const a = roster.filter(h => h.faction === 'Assault');
    pick = [w[0], t[0], a[0], w[1]||t[1]||a[1], w[2]||t[2]||a[2]].filter(Boolean);
  }

  if (pick.length < 3) {
    alert('Not enough heroes in roster for this rule. Add more heroes first.');
    return;
  }
  placeSquad(pick);
}

function saveCurrentSquad() {
  const num = document.getElementById('squadNum').value;
  const names = ['fl','fr','bl','bc','br'].map(id => document.getElementById(id).value);
  squads[num] = names;
  localStorage.setItem('zr_squads', JSON.stringify(squads));
  alert('Squad ' + num + ' saved.');
}

function switchSquad() {
  const num = document.getElementById('squadNum').value;
  const saved = squads[num];
  if (!saved) return;
  ['fl','fr','bl','bc','br'].forEach((id, i) => {
    const sel = document.getElementById(id);
    if (sel && saved[i]) sel.value = saved[i];
  });
  updateFactionBonus();
}

function buildRankedSquads() {
  const roster = getRosterHeroes().sort((a,b) => (b.power||0) - (a.power||0));
  if (roster.length < 5) {
    alert('Need at least 5 heroes in roster.');
    return;
  }
  // Greedy: take top 5, next 5, etc. Prefer same-faction when possible
  const used = new Set();
  for (let s = 1; s <= 5; s++) {
    const available = roster.filter(h => !used.has(h.name));
    if (available.length < 3) break;
    // try 5-same first
    const byF = {};
    available.forEach(h => { byF[h.faction] = byF[h.faction] || []; byF[h.faction].push(h); });
    let pick = Object.values(byF).sort((a,b) => b.length - a.length)[0].slice(0,5);
    if (pick.length < 5) pick = available.slice(0,5);
    pick.forEach(h => used.add(h.name));
    const names = [];
    // order for positions
    const tanks = pick.filter(h => h.role === 'Tank');
    const dps = pick.filter(h => h.role === 'DPS');
    const other = pick.filter(h => h.role !== 'Tank' && h.role !== 'DPS');
    const ordered = [];
    if (tanks[0]) ordered.push(tanks.shift()); // FR
    if (tanks[0] || other[0]) ordered.push(tanks.shift() || other.shift()); // FL
    if (dps[0]) ordered.push(dps.shift()); // BC
    ordered.push(...tanks, ...dps, ...other);
    while (ordered.length < 5) ordered.push(pick[ordered.length]);
    squads[s] = ['','','','',''];
    // map to fl,fr,bl,bc,br
    const map = [ordered[1], ordered[0], ordered[3], ordered[2], ordered[4]]; // fl,fr,bl,bc,br
    squads[s] = map.map(h => h ? h.name : '');
  }
  localStorage.setItem('zr_squads', JSON.stringify(squads));
  document.getElementById('squadNum').value = '1';
  switchSquad();
  alert('Built up to 5 squads ranked by power (and faction preference). Switch with the Squad dropdown.');
}
