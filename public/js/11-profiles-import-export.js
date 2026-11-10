// ========== PROFILES / WIZARD / SHARE / TROOPS / COMPARE / PASTE / PRINT ==========
function profileKey(slot) {
  return 'zr_profile_' + (slot || document.getElementById('profileSlot')?.value || 'main');
}

function switchProfile() {
  // save current to its slot first? optional – user should save manually
  const slot = document.getElementById('profileSlot').value;
  const data = JSON.parse(localStorage.getItem(profileKey(slot)) || 'null');
  document.getElementById('rosterList').innerHTML = '';
  if (data) {
    document.getElementById('username').value = data.username || '';
    if (document.getElementById('ingameName')) document.getElementById('ingameName').value = data.ingame || '';
    if (document.getElementById('profileDesc')) document.getElementById('profileDesc').value = data.desc || '';
    document.getElementById('hospital').value = data.hospital || 5000;
    if (document.getElementById('saveDate')) document.getElementById('saveDate').value = data.saveDate || '';
    (data.roster || []).forEach(h => addHeroRow(h));
    if (data.troops) {
      for (let i = 1; i <= 10; i++) {
        const el = document.getElementById('tc' + i);
        if (el) el.value = data.troops[i] || 0;
      }
    }
    alert('Loaded profile: ' + slot + ' (' + (data.roster||[]).length + ' heroes)');
  } else {
    document.getElementById('username').value = '';
    if (document.getElementById('ingameName')) document.getElementById('ingameName').value = '';
    if (document.getElementById('profileDesc')) document.getElementById('profileDesc').value = '';
    if (document.getElementById('saveDate')) document.getElementById('saveDate').value = '';
    alert('Profile slot "' + slot + '" is empty. Add heroes and Save.');
  }
  updateStats();
  showSuggestions();
  applyTroopCounts();
}

// Override save to also write profile slot
const _origSaveRoster = saveRoster;
saveRoster = function() {
  _origSaveRoster();
  const slot = document.getElementById('profileSlot')?.value || 'main';
  const rows = document.querySelectorAll('#rosterList > div');
  const r = [];
  rows.forEach(row => {
    const name = row.querySelector('.h-name')?.value;
    if (name) r.push({
      name,
      stars: +row.querySelector('.h-stars')?.value || 0,
      power: +row.querySelector('.h-power')?.value || 0
    });
  });
  const troops = {};
  for (let i = 1; i <= 10; i++) troops[i] = +(document.getElementById('tc' + i)?.value || 0);
  const payload = {
    username: document.getElementById('username').value || '',
    ingame: document.getElementById('ingameName')?.value || '',
    desc: document.getElementById('profileDesc')?.value || '',
    hospital: document.getElementById('hospital').value,
    saveDate: document.getElementById('saveDate')?.value || new Date().toLocaleString(),
    roster: r,
    troops
  };
  localStorage.setItem(profileKey(slot), JSON.stringify(payload));
  // auto-suggest formation after save
  if (r.length >= 5) {
    setTimeout(() => {
      if (confirm('Roster saved. Auto-build Top Power formation?')) {
        document.querySelector('[data-tab="formation"]')?.click();
        autoForm('top');
      }
    }, 100);
  }
};

function startWizard() {
  alert('First-time Wizard: answer a few questions to set up your profile.');
  const name = prompt('1/5 – What is your display / commander name?');
  if (name === null) return;
  document.getElementById('username').value = name || '';
  const ig = prompt('2/5 – In-game username? (optional)');
  if (ig !== null && document.getElementById('ingameName')) document.getElementById('ingameName').value = ig;
  const hosp = prompt('3/5 – Hospital free beds?', '5000');
  if (hosp !== null) document.getElementById('hospital').value = +hosp || 5000;
  const desc = prompt('4/5 – Short description (alliance, server)?');
  if (desc !== null && document.getElementById('profileDesc')) document.getElementById('profileDesc').value = desc;
  const n = prompt('5/5 – How many heroes do you want to add now? (0–10)', '5');
  const count = Math.min(10, Math.max(0, +n || 0));
  document.getElementById('rosterList').innerHTML = '';
  for (let i = 0; i < count; i++) askAddHero();
  saveRoster();
  alert('Wizard done. Profile saved. Use Formation / Casualties / Kill Calc next.');
}

function shareLink() {
  const rows = document.querySelectorAll('#rosterList > div');
  const data = {
    u: document.getElementById('username').value || '',
    h: document.getElementById('hospital').value,
    r: []
  };
  rows.forEach(row => {
    const name = row.querySelector('.h-name')?.value;
    if (name) data.r.push([name, +row.querySelector('.h-stars')?.value || 0, +row.querySelector('.h-power')?.value || 0]);
  });
  try {
    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const url = location.href.split('#')[0] + '#zr=' + hash;
    navigator.clipboard.writeText(url).then(() => alert('Share link copied to clipboard!')).catch(() => prompt('Copy this link:', url));
  } catch (e) {
    alert('Could not build share link: ' + e.message);
  }
}

function loadFromHash() {
  const m = location.hash.match(/#zr=(.+)/);
  if (!m) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (data.u) document.getElementById('username').value = data.u;
    if (data.h) document.getElementById('hospital').value = data.h;
    document.getElementById('rosterList').innerHTML = '';
    (data.r || []).forEach(arr => {
      const found = HEROES.find(h => h.name === arr[0]);
      addHeroRow(found ? { ...found, stars: arr[1], power: arr[2] } : { name: arr[0], stars: arr[1], power: arr[2], faction: 'Warrior', role: 'DPS' });
    });
    showSuggestions();
    updateStats();
    alert('Loaded roster from share link (' + (data.r||[]).length + ' heroes).');
  } catch (e) { console.warn('hash load failed', e); }
}

function applyTroopCounts() {
  let total = 0, weighted = 0;
  for (let i = 1; i <= 10; i++) {
    const n = +(document.getElementById('tc' + i)?.value || 0);
    total += n;
    weighted += n * i;
  }
  const el = document.getElementById('troopTotal');
  if (el) el.textContent = 'Total soldiers: ' + total.toLocaleString() + (total ? ' · avg tier ~' + (weighted / total).toFixed(1) : '');
  syncAllTabs();
  if (total > 0) alert('Troop counts applied to Casualties & Kill Calc (soldiers + avg tier).');
}

function openCompare() {
  document.getElementById('compareBox').style.display = 'block';
  document.getElementById('compareBox').scrollIntoView({ behavior: 'smooth' });
}

function parseTxtRoster(text) {
  const heroes = [];
  let profile = '';
  String(text).split(/\r?\n/).forEach(line => {
    if (line.startsWith('Profile:')) profile = line.slice(8).trim();
    else if (line.startsWith('#') || line.startsWith('---') || line.startsWith('Saved:') || line.startsWith('InGame:') || line.startsWith('Description:') || line.startsWith('Hospital:') || !line.trim()) return;
    else {
      const p = line.split(/\t|,|;/);
      if (p[0]?.trim()) heroes.push({ name: p[0].trim(), stars: +(p[1]||0), power: +(p[2]||0) });
    }
  });
  return { profile, heroes };
}

function runCompare() {
  const f1 = document.getElementById('compareFile1').files?.[0];
  const f2 = document.getElementById('compareFile2').files?.[0];
  if (!f1 || !f2) { alert('Pick both TXT A and TXT B first.'); return; }
  const r1 = new FileReader();
  r1.onload = () => {
    const a = parseTxtRoster(r1.result);
    const r2 = new FileReader();
    r2.onload = () => {
      const b = parseTxtRoster(r2.result);
      const mapA = {}, mapB = {};
      a.heroes.forEach(h => mapA[h.name] = h);
      b.heroes.forEach(h => mapB[h.name] = h);
      const all = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
      let html = '<p><strong>A:</strong> ' + (a.profile||'—') + ' (' + a.heroes.length + ' heroes) · <strong>B:</strong> ' + (b.profile||'—') + ' (' + b.heroes.length + ' heroes)</p>';
      html += '<table><tr><th>Hero</th><th>A power</th><th>B power</th><th>Diff</th></tr>';
      let sumA = 0, sumB = 0;
      [...all].sort().forEach(name => {
        const pa = mapA[name]?.power || 0, pb = mapB[name]?.power || 0;
        sumA += pa; sumB += pb;
        const diff = pb - pa;
        html += '<tr><td>' + name + '</td><td>' + (pa||'—') + '</td><td>' + (pb||'—') + '</td><td class="' + (diff>0?'good':diff<0?'bad':'') + '">' + (diff?diff.toLocaleString():'—') + '</td></tr>';
      });
      html += '<tr><th>Total</th><th>' + sumA.toLocaleString() + '</th><th>' + sumB.toLocaleString() + '</th><th>' + (sumB-sumA).toLocaleString() + '</th></tr></table>';
      document.getElementById('compareResult').innerHTML = html;
    };
    r2.readAsText(f2);
  };
  r1.readAsText(f1);
}

function parseBattlePaste() {
  const text = document.getElementById('battlePaste')?.value || '';
  if (!text.trim()) { alert('Paste some battle text first.'); return; }
  const num = (re) => { const m = text.match(re); return m ? +m[1].replace(/,/g,'') : null; };
  const sol = num(/soldiers?\s*[:=]?\s*([\d,]+)/i) || num(/sent\s*[:=]?\s*([\d,]+)/i);
  const dead = num(/dead\s*[:=]?\s*([\d,]+)/i) || num(/killed\s*[:=]?\s*([\d,]+)/i);
  const wound = num(/wound(?:ed)?\s*[:=]?\s*([\d,]+)/i) || num(/hospital\s*[:=]?\s*([\d,]+)/i);
  const pow = num(/power\s*[:=]?\s*([\d,.]+)\s*m/i);
  if (sol) document.getElementById('mySoldiers').value = sol;
  if (pow) document.getElementById('myPower').value = Math.round(pow * 1e6);
  if (dead || wound) {
    alert('Parsed: soldiers=' + (sol||'?') + ' dead=' + (dead||'?') + ' wounded=' + (wound||'?') + '. Fields updated where found. Run Predict to model, or save actuals to Battle Log.');
  } else {
    alert('Updated fields from paste where numbers were found. Adjust manually if needed.');
  }
}

function printSummary() {
  const name = document.getElementById('username').value || 'Commander';
  const rows = document.querySelectorAll('#rosterList > div');
  let heroes = '';
  let totalP = 0;
  rows.forEach(row => {
    const n = row.querySelector('.h-name')?.value;
    const s = row.querySelector('.h-stars')?.value;
    const p = +row.querySelector('.h-power')?.value || 0;
    if (n) { heroes += '<tr><td>' + n + '</td><td>' + s + '★</td><td>' + p.toLocaleString() + '</td></tr>'; totalP += p; }
  });
  const squad = ['fl','fr','bl','bc','br'].map(id => document.getElementById(id)?.value).filter(Boolean).join(', ');
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${name} – Z Route Summary</title>
    <style>body{font-family:system-ui;padding:24px;color:#111} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:6px 10px;text-align:left} h1{margin:0 0 8px}</style></head><body>
    <h1>${name}</h1>
    <p>${document.getElementById('profileDesc')?.value || ''}</p>
    <p>Hospital: ${document.getElementById('hospital').value} · Saved: ${document.getElementById('saveDate')?.value || '—'}</p>
    <h2>Roster (${rows.length})</h2>
    <table><tr><th>Hero</th><th>Stars</th><th>Power</th></tr>${heroes}
    <tr><th>Total</th><th></th><th>${totalP.toLocaleString()}</th></tr></table>
    <h2>Current formation</h2>
    <p>${squad || 'Not set'}</p>
    <p style="margin-top:40px;color:#666;font-size:12px">Generated by Z Route Casualty & Rotation Analyzer</p>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
  w.document.close();
}
