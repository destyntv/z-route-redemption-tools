// ========== STATS ==========
function updateStats() {
  document.getElementById('statRoster').textContent = roster.length || JSON.parse(localStorage.getItem('zr_roster')||'[]').length;
  const r = roster.length ? roster : JSON.parse(localStorage.getItem('zr_roster')||'[]');
  const avg = r.length ? (r.reduce((s,h)=>s+(h.stars||0),0)/r.length).toFixed(1) : '—';
  document.getElementById('statAvgStars').textContent = avg;
  document.getElementById('statBattles').textContent = battles.length;
}
