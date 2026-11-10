// ========== ROSTER ==========
function getFaction(name) {
  const h = HEROES.find(x => x.name === name);
  return h ? h.faction.toLowerCase() : 'unknown';
}
function getInitials(name) {
  return name ? name.slice(0,2).toUpperCase() : '??';
}
function addHeroRow(hero = null) {
  const div = document.createElement('div');
  div.className = 'hero-row';
  const hData = hero || HEROES[0];
  const name = hData.name;
  const faction = getFaction(name);
  div.innerHTML = `
    <div class="avatar ${faction}" title="${faction}">${getInitials(name)}</div>
    <select class="h-name">${HEROES.map(h => {
      const L = {Warrior:'W',Tactical:'T',Assault:'A'}[h.faction]||'?';
      const col = {Warrior:'#d4a017',Tactical:'#e74c3c',Assault:'#3498db'}[h.faction]||'#aaa';
      return `<option value="${h.name}" ${name===h.name?'selected':''} style="color:${col}">${L} ${h.name} (${h.rarity||'?'})</option>`;
    }).join('')}</select>
    <input type="number" class="h-stars" min="0" max="5" value="${hData.stars || 3}" title="Stars" placeholder="★">
    <input type="number" class="h-power" value="${hData.power || 500000}" title="Power" placeholder="Power">
  `;
  const sel = div.querySelector('.h-name');
  const av = div.querySelector('.avatar');
  const starsIn = div.querySelector('.h-stars');
  const powerIn = div.querySelector('.h-power');
  sel.addEventListener('change', () => {
    const found = HEROES.find(x => x.name === sel.value);
    const f = getFaction(sel.value);
    av.className = 'avatar ' + f;
    av.textContent = getInitials(sel.value);
    av.title = f;
    if (found) {
      starsIn.value = found.stars || 3;
      powerIn.value = found.power || 500000;
    }
  });
  document.getElementById('rosterList').appendChild(div);
}

function saveRoster() {
  const rows = document.querySelectorAll('#rosterList > div');
  roster = [];
  rows.forEach(r => {
    const nameEl = r.querySelector('.h-name');
    if (!nameEl) return;
    roster.push({
      name: nameEl.value,
      stars: +r.querySelector('.h-stars')?.value || 0,
      power: +r.querySelector('.h-power')?.value || 0
    });
  });
  const now = new Date().toLocaleString();
  localStorage.setItem('zr_roster', JSON.stringify(roster));
  localStorage.setItem('zr_username', document.getElementById('username').value || '');
  localStorage.setItem('zr_ingame', document.getElementById('ingameName')?.value || '');
  localStorage.setItem('zr_desc', document.getElementById('profileDesc')?.value || '');
  localStorage.setItem('zr_hospital', document.getElementById('hospital').value);
  localStorage.setItem('zr_saveDate', now);
  const sd = document.getElementById('saveDate');
  if (sd) sd.value = now;
  markSaved();
  updateStats();
  showSuggestions();
}

function loadRoster() {
  roster = JSON.parse(localStorage.getItem('zr_roster') || '[]');
  document.getElementById('username').value = localStorage.getItem('zr_username') || '';
  if (document.getElementById('ingameName')) document.getElementById('ingameName').value = localStorage.getItem('zr_ingame') || '';
  if (document.getElementById('profileDesc')) document.getElementById('profileDesc').value = localStorage.getItem('zr_desc') || '';
  document.getElementById('hospital').value = localStorage.getItem('zr_hospital') || 5000;
  if (document.getElementById('saveDate')) document.getElementById('saveDate').value = localStorage.getItem('zr_saveDate') || '';
  document.getElementById('rosterList').innerHTML = '';
  roster.forEach(h => addHeroRow(h));
  updateStats();
  showSuggestions();
  if (roster.length) alert('Loaded ' + roster.length + ' heroes from cache.');
  else alert('No saved roster in cache. List stays empty.');
}

function clearRoster() {
  if (!confirm('Clear the entire hero list? (Profile is kept)')) return;
  pushUndo();
  document.getElementById('rosterList').innerHTML = '';
  roster = [];
  const sug = document.getElementById('suggestions');
  if (sug) sug.style.display = 'none';
  updateStats();
}

function askAddHero() {
  const name = prompt('Hero name? (e.g. Arnold, Monroe, Bekka)');
  if (!name) return;
  const found = HEROES.find(h => h.name.toLowerCase() === name.trim().toLowerCase());
  let power = found ? found.power : 500000;
  let stars = found ? (found.stars || 3) : 3;
  const pIn = prompt('Power? (blank = ' + power + ')', power);
  if (pIn !== null && pIn !== '') power = +pIn || power;
  const sIn = prompt('Stars 0–5? (blank = ' + stars + ')', stars);
  if (sIn !== null && sIn !== '') stars = Math.min(5, Math.max(0, +sIn || stars));
  const hero = found ? { ...found, power, stars } : { name: name.trim(), faction: 'Warrior', role: 'DPS', rarity: '?', power, stars };
  if (!found) HEROES.push(hero);
  addHeroRow(hero);
  showSuggestions();
  alert('Added: ' + hero.name + ' · ' + Number(power).toLocaleString() + ' power · ' + stars + '★');
}

function exportRosterTxt() {
  const rows = document.querySelectorAll('#rosterList > div');
  const lines = [];
  lines.push('# Z Route Roster Export');
  lines.push('Profile: ' + (document.getElementById('username').value || ''));
  lines.push('InGame: ' + (document.getElementById('ingameName')?.value || ''));
  lines.push('Description: ' + (document.getElementById('profileDesc')?.value || ''));
  lines.push('Hospital: ' + (document.getElementById('hospital').value || ''));
  lines.push('Saved: ' + (document.getElementById('saveDate')?.value || new Date().toLocaleString()));
  lines.push('---');
  rows.forEach(row => {
    const name = row.querySelector('.h-name')?.value;
    const stars = row.querySelector('.h-stars')?.value || 0;
    const power = row.querySelector('.h-power')?.value || 0;
    if (name) lines.push(name + '\t' + stars + '\t' + power);
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'zroute-roster-' + (document.getElementById('username').value || 'export').replace(/\s+/g, '_') + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importRosterTxt() {
  document.getElementById('importFile').click();
}

function handleImportFile(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const lines = String(reader.result).split(/\r?\n/);
    document.getElementById('rosterList').innerHTML = '';
    let loaded = 0;
    lines.forEach(line => {
      if (line.startsWith('Profile:')) document.getElementById('username').value = line.slice(8).trim();
      else if (line.startsWith('InGame:') && document.getElementById('ingameName')) document.getElementById('ingameName').value = line.slice(7).trim();
      else if (line.startsWith('Description:') && document.getElementById('profileDesc')) document.getElementById('profileDesc').value = line.slice(12).trim();
      else if (line.startsWith('Hospital:')) document.getElementById('hospital').value = line.slice(9).trim() || 5000;
      else if (line.startsWith('#') || line.startsWith('---') || line.startsWith('Saved:') || !line.trim()) return;
      else {
        const parts = line.split(/\t|,|;/);
        const name = parts[0]?.trim();
        if (!name) return;
        const stars = +(parts[1] || 3);
        const power = +(parts[2] || 500000);
        const found = HEROES.find(h => h.name.toLowerCase() === name.toLowerCase());
        addHeroRow(found ? { ...found, stars, power } : { name, stars, power, faction: 'Warrior', role: 'DPS' });
        loaded++;
      }
    });
    showSuggestions();
    updateStats();
    alert('Imported ' + loaded + ' heroes from TXT.');
  };
  reader.readAsText(file);
  ev.target.value = '';
}

function loadFromScreenshots() {
  pushUndo();
  const fromShots = ["Arnold","Monroe","Carter","Bekka","Leah","Victor","Yana","Nora","Toxina","Aria","Zara","Rachel","Celeste","Jack","Logan","Lee Yu","Conan","Dirk","Lucian","Vince","Silas","Hank","Jackson","Jamal"];
  document.getElementById('rosterList').innerHTML = '';
  fromShots.forEach(name => {
    const h = HEROES.find(x => x.name === name);
    if (h) addHeroRow(h);
  });
  showSuggestions();
  alert('Loaded the full hero list. Adjust stars/power for the ones you own, then Save Roster.');
}

function showSuggestions() {
  const box = document.getElementById('suggestions');
  const rows = document.querySelectorAll('#rosterList .h-name');
  const names = Array.from(rows).map(s => s.value);
  if (names.length < 3) { box.style.display = 'none'; return; }

  const warriors = names.filter(n => getFaction(n) === 'warrior');
  const tacticals = names.filter(n => getFaction(n) === 'tactical');
  const assaults = names.filter(n => getFaction(n) === 'assault');

  let tips = [];
  tips.push(`<strong>Your roster factions:</strong> Warrior ${warriors.length} · Tactical ${tacticals.length} · Assault ${assaults.length}`);

  if (warriors.length >= 5) {
    tips.push('✅ You can run a full <span style="color:#d4a017">Warrior +20%</span> core (Arnold + Monroe + Carter + tanks/DPS). Best for most raids & Garrison.');
  } else if (warriors.length >= 3) {
    tips.push('You have a solid Warrior start. Aim for 5 same-faction for the full +20% bonus.');
  }

  if (tacticals.includes('Bekka') && tacticals.includes('Leah')) {
    tips.push('Bekka + Leah is the strong Tactical duo. Good second core or counter to Warrior teams.');
  }

  if (names.includes('Arnold') && names.includes('Monroe')) {
    tips.push('Arnold (Front-Right) + Monroe (Back-Center) is the classic high-survival + high-damage pairing.');
  }
  if (names.includes('Dirk') || names.includes('Lucian')) {
    tips.push('Dirk / Lucian fit the current Warrior meta core for raids and PvP (zroutehq-style comps).');
  }
  if (assaults.length >= 5) {
    tips.push('Full Assault core is strong vs Tactical-heavy enemies (faction counter).');
  }
  if (tacticals.length >= 5) {
    tips.push('Full Tactical core counters Warrior-heavy lineups.');
  }

  // Power concentration tip
  let totalP = 0;
  document.querySelectorAll('#rosterList .h-power').forEach(inp => { totalP += +inp.value || 0; });
  if (totalP > 0 && names.length >= 5) {
    tips.push('Roster hero power sum ≈ <strong>' + totalP.toLocaleString() + '</strong> — synced into Kill Calc & Casualties when you switch tabs.');
  }
  if (names.length >= 10) {
    tips.push('You can run <strong>Build 5 squads</strong> (Formation) for multi-march / garrison defense layers.');
  } else if (names.length >= 5 && names.length < 10) {
    tips.push('Add more heroes to unlock multiple marches (Squad 2–5).');
  }

  tips.push('Higher troop tier (T7–T10) reduces permanent deaths. Keep Training Camp upgrading.');
  tips.push('Hospital free beds matter more than raw power in big Alliance raids — overflow = extra deaths.');
  tips.push('Same-faction 5 = +20% HP/ATK/DEF. Prefer that over mixed unless countering a specific enemy faction.');

  box.innerHTML = tips.map(t => `• ${t}`).join('<br>');
  box.style.display = 'block';
}
