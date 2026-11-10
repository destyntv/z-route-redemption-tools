// ========== READINESS ==========
function calcReadiness() {
  const stage = +document.getElementById('vsStage').value;
  const hosp = +document.getElementById('readyHospital').value;
  const r = roster.length ? roster : JSON.parse(localStorage.getItem('zr_roster')||'[]');
  const power = r.reduce((s,h)=>s+(h.power||0),0);
  const stars = r.reduce((s,h)=>s+(h.stars||0),0);

  let score = 50;
  if (power > 5000000) score += 20;
  else if (power > 2000000) score += 10;
  if (stars / (r.length||1) >= 3.5) score += 15;
  if (hosp > 8000) score += 15;
  else if (hosp > 3000) score += 8;
  if (stage === 6) score -= 10; // Raid day is riskier
  if (stage === 5) score += 5;  // Combat readiness day

  score = Math.max(0, Math.min(100, score));

  document.getElementById('readyScore').textContent = score;
  document.getElementById('readyScore').className = 'value ' + (score>=75?'good':score>=50?'warn':'bad');
  document.getElementById('readinessResult').style.display = 'block';

  let label = score >= 75 ? 'SAFE TO FULL PUSH' : score >= 50 ? 'MODERATE RISK – WATCH HOSPITAL' : 'SAVE TROOPS TODAY';
  document.getElementById('readyLabel').textContent = label;

  let tips = [];
  if (stage === 6) tips.push('Raid Day: prioritize high-value targets and keep hospital free.');
  if (hosp < 3000) tips.push('Low hospital capacity – heal or expand before big fights.');
  if (r.length < 5) tips.push('Build a full 5-hero core first.');
  tips.push('Check zroute-tools.com Route Reminder for exact VS actions today.');
  document.getElementById('readinessTips').innerHTML = tips.map(t=>`• ${t}`).join('<br>');
  document.getElementById('readinessTips').style.display = 'block';
}
