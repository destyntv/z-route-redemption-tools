// ========== HEROES TABLE / CLOCKS / FEEDBACK / GUESTBOOK ==========
function renderHeroTable() {
  const tb = document.querySelector('#heroTable tbody');
  if (!tb) return;
  const q = (document.getElementById('heroSearch')?.value || '').toLowerCase();
  const ff = document.getElementById('heroFilterFaction')?.value || '';
  const fr = document.getElementById('heroFilterRole')?.value || '';
  const fy = document.getElementById('heroFilterRarity')?.value || '';
  const list = HEROES.filter(h =>
    (!q || h.name.toLowerCase().includes(q)) &&
    (!ff || h.faction === ff) && (!fr || h.role === fr) && (!fy || h.rarity === fy)
  ).sort((a, b) => (b.power || 0) - (a.power || 0));
  tb.innerHTML = list.map(h => {
    const col = { Warrior: '#d4a017', Tactical: '#e74c3c', Assault: '#3498db' }[h.faction] || '#aaa';
    const L = { Warrior: 'W', Tactical: 'T', Assault: 'A' }[h.faction] || '?';
    return `<tr>
      <td style="color:${col};font-weight:600">${L} ${h.name}</td>
      <td>${h.faction}</td><td>${h.role || '—'}</td><td>${h.rarity || '—'}</td>
      <td>${h.power ? Number(h.power).toLocaleString() : '—'}</td>
      <td>${h.level || '—'}</td>
      <td><button class="secondary" style="padding:4px 8px;font-size:0.75rem" onclick='addHeroRow(${JSON.stringify(h).replace(/'/g,"&#39;")});showSuggestions();syncAllTabs();'>+ Roster</button></td>
    </tr>`;
  }).join('');
  const thead = document.querySelector('#heroTable thead tr');
  if (thead && thead.children.length < 7) {
    const th = document.createElement('th');
    th.textContent = 'Add';
    thead.appendChild(th);
  }
}

function detectTimezone() {
  let zone = '—';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '—'; } catch (e) {}
  const offMin = -new Date().getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '−';
  const abs = Math.abs(offMin);
  const utc = `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''}`;
  const el = document.getElementById('clockZone');
  if (el) el.textContent = zone + ' · ' + utc;
  return { zone, utc, offMin };
}

/** Server Date = local now + offset hours. VS stages follow SERVER day. */
function getServerNow() {
  const off = getServerOffsetHours();
  return new Date(Date.now() + off * 3600000);
}
function getServerDay() {
  return getServerNow().getDay();
}
function getGuideDay() {
  const mode = document.getElementById('timeModeTop')?.value || 'server';
  return mode === 'local' ? new Date().getDay() : getServerDay();
}

const VS_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const VS_PHASE = {
  0: { phase: 'Rest', short: 'No VS — bank resources', items: ['Bank all resources', 'Stack radar for Monday'] },
  1: { phase: 'Radar (Stage 1)', short: 'Radar · Parts · Chips · Stamina', items: ['Radar missions', 'Fighter Parts / Combat Chips', 'Stamina', 'Gather Food/Metal/Oil'] },
  2: { phase: 'Construction (Stage 2)', short: 'Builds · Recruits · Trucks', items: ['Complete buildings', 'Build speedups', 'Recruit tickets', 'UR Trucks / Special Ops'] },
  3: { phase: 'Tech (Stage 3)', short: 'Research · Component Chests', items: ['Research finishes', 'Research speedups', 'Fighter Component Chests', 'Scientific Data'] },
  4: { phase: 'Heroes (Stage 4)', short: 'Shards · Tickets · EXP', items: ['Hero shards / tickets', 'Skill books', 'Hero EXP'] },
  5: { phase: 'Combat Ready (Stage 5)', short: 'Train · Training speedups', items: ['Train / promote troops', 'Training speedups', 'Build/Research completes', 'Radar if needed'] },
  6: { phase: 'Raid (Stage 6)', short: 'Combat · Healing · Shield', items: ['Healing speedups', 'Raid / combat', 'UR Trucks / Ops', 'Shield if offline'] }
};

function getServerOffsetHours() {
  const top = document.getElementById('serverOffsetTop');
  const panel = document.getElementById('serverOffset');
  let off = top ? +top.value : (panel ? +panel.value : 2);
  if (Number.isNaN(off)) off = 2;
  return off;
}

function onServerOffsetChange() {
  const off = getServerOffsetHours();
  const panel = document.getElementById('serverOffset');
  const top = document.getElementById('serverOffsetTop');
  if (panel) panel.value = off;
  if (top) top.value = off;
  localStorage.setItem('zr_server_offset', String(off));
  updateClocks();
  updateCommandStrip();
  highlightVsDay();
}

function onTimeModeChange() {
  const mode = document.getElementById('timeModeTop')?.value || 'server';
  const panel = document.getElementById('timeMode');
  if (panel) panel.value = mode;
  localStorage.setItem('zr_time_mode', mode);
  updateClocks();
  updateCommandStrip();
  highlightVsDay();
  const fVs = document.getElementById('fVsDay');
  if (fVs) fVs.value = String(getGuideDay());
}

function updateClocks() {
  const mode = document.getElementById('timeModeTop')?.value || document.getElementById('timeMode')?.value || 'server';
  const top = document.getElementById('timeModeTop');
  const panel = document.getElementById('timeMode');
  if (top) top.value = mode;
  if (panel) panel.value = mode;

  const off = getServerOffsetHours();
  const panelOff = document.getElementById('serverOffset');
  if (panelOff && +panelOff.value !== off) panelOff.value = off;

  const now = new Date();
  const server = new Date(now.getTime() + off * 3600000);
  const fmt = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const localStr = now.toLocaleTimeString(undefined, fmt);
  const serverStr = server.toLocaleTimeString(undefined, fmt);
  const localEl = document.getElementById('clockLocal');
  const serverEl = document.getElementById('clockServer');
  if (localEl) localEl.textContent = localStr;
  if (serverEl) serverEl.textContent = serverStr;

  const el = document.getElementById('clockDisplay');
  const lab = document.getElementById('clockLabel');
  const show = mode === 'server' ? server : now;
  if (el) el.textContent = show.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (lab) lab.textContent = mode === 'server'
    ? `Server time (offset ${off >= 0 ? '+' : ''}${off}h) · VS day uses SERVER`
    : 'Local device time · VS day uses LOCAL';

  // re-sync VS day label when server day rolls (or every minute is enough via strip)
  if (typeof updateCommandStrip === 'function') {
    const d = getGuideDay();
    const prev = document.getElementById('cmdToday')?.dataset?.day;
    if (String(d) !== prev) {
      const el = document.getElementById('cmdToday');
      if (el) el.dataset.day = String(d);
      updateCommandStrip();
      if (document.getElementById('vsguide')?.classList.contains('active')) highlightVsDay();
    }
  }
}
setInterval(updateClocks, 1000);

function saveFeedback() {
  const t = document.getElementById('feedbackText')?.value || '';
  if (!t.trim()) { alert('Write something first.'); return; }
  const list = JSON.parse(localStorage.getItem('zr_feedback') || '[]');
  list.push({ t, at: new Date().toISOString() });
  localStorage.setItem('zr_feedback', JSON.stringify(list));
  alert('Feedback saved on this device only.');
}
function exportFeedback() {
  const list = JSON.parse(localStorage.getItem('zr_feedback') || '[]');
  const blob = new Blob([list.map(x => x.at + '\t' + x.t).join('\n') || 'No feedback yet'], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'zroute-feedback.txt';
  a.click();
}
function addGuestbook() {
  const name = document.getElementById('gbName')?.value || 'Anon';
  const msg = document.getElementById('gbMsg')?.value || '';
  if (!msg.trim()) { alert('Enter a message.'); return; }
  const list = JSON.parse(localStorage.getItem('zr_guestbook') || '[]');
  list.unshift({ name, msg, at: new Date().toLocaleString() });
  localStorage.setItem('zr_guestbook', JSON.stringify(list.slice(0, 50)));
  document.getElementById('gbMsg').value = '';
  renderGuestbook();
}
function renderGuestbook() {
  const list = JSON.parse(localStorage.getItem('zr_guestbook') || '[]');
  const el = document.getElementById('guestbookList');
  if (!el) return;
  el.innerHTML = list.length ? list.map(x => `<div class="tip" style="margin-bottom:6px"><strong>${x.name}</strong> <span class="muted">${x.at}</span><br>${x.msg}</div>`).join('') : '<p class="muted">No entries yet on this device.</p>';
}
