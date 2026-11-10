// ========== CASUALTY PREDICTOR ==========
function predictCasualties() {
  const mySol = +document.getElementById('mySoldiers').value || 1;
  const enemyP = +document.getElementById('enemyPower').value || 1;
  const myP = +document.getElementById('myPower').value || 1;
  const myMor = +document.getElementById('myMorale').value / 100;
  const enMor = +document.getElementById('enemyMorale').value / 100;
  const tier = Math.min(10, Math.max(1, +document.getElementById('troopTier').value || 6));
  const hospital = +document.getElementById('hospital').value || 0;

  // Tier multiplier: T1≈0.85 → T10≈1.45 (higher tier = fewer losses)
  const tierMult = 0.75 + tier * 0.07;

  // Simplified morale model (community)
  const baseMorale = 501.5;
  const myTotalMor = mySol * baseMorale * (1 + myMor) * tierMult;
  const enTotalMor = enemyP * baseMorale * (1 + enMor);
  const ratio = myTotalMor / (enTotalMor || 1);

  // Damage coefficient approximation
  let coef = 1;
  if (ratio > 1.3) coef = 0.55;
  else if (ratio > 1.1) coef = 0.7;
  else if (ratio > 0.9) coef = 0.9;
  else if (ratio > 0.7) coef = 1.15;
  else coef = 1.4;

  // Power ratio adjustment
  const powerRatio = myP / (enemyP || 1);
  coef *= (powerRatio > 1.2 ? 0.8 : powerRatio > 0.9 ? 1 : 1.25);

  // Higher troop tier reduces losses (T1 takes more, T10 takes less)
  coef *= (1.25 - tier * 0.04); // T1≈1.21, T6≈1.01, T10≈0.85

  // Rough loss % of soldiers sent
  let lossPct = Math.min(0.85, Math.max(0.05, 0.35 * coef));
  let deadPct = lossPct * 0.25;
  let woundPct = lossPct * 0.75;

  // Hospital overflow becomes extra deaths
  let wounded = Math.round(mySol * woundPct);
  let dead = Math.round(mySol * deadPct);
  if (wounded > hospital) {
    const overflow = wounded - hospital;
    dead += Math.round(overflow * 0.6);
    wounded = hospital;
  }

  const survive = mySol - dead - wounded;

  document.getElementById('predDead').textContent = dead.toLocaleString();
  document.getElementById('predWounded').textContent = wounded.toLocaleString();
  document.getElementById('predSurvive').textContent = survive.toLocaleString();
  document.getElementById('predictionResult').style.display = 'grid';
  updateTierPreview();

  // Tips
  let tips = [];
  if (dead > mySol * 0.15) tips.push("High permanent losses. Consider stronger front-line tanks or matching faction.");
  if (wounded > hospital * 0.8) tips.push("Hospital almost full – free beds before next big fight or many wounded will die.");
  if (ratio < 0.9) tips.push("Morale disadvantage detected. Add morale bonuses from heroes/tech or send more soldiers.");
  if (tier <= 4) tips.push("Troop tier is low (T" + tier + "). Upgrading Training Camp reduces deaths for the same power.");
  else if (tier >= 8) tips.push("Strong troop tier (T" + tier + ") – good damage absorption.");
  tips.push("Front-Right position takes most hits – keep your highest-star tank there.");
  tips.push("Full 5-same-faction (+20%) usually saves more soldiers than a mixed higher-power squad.");

  document.getElementById('casualtyTips').innerHTML = tips.map(t => `• ${t}`).join('<br>');
  document.getElementById('casualtyTips').style.display = 'block';
}

function saveBattle() {
  const dead = document.getElementById('predDead').textContent;
  if (dead === '—' || dead === '') { alert('Run a prediction first'); return; }
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    username: document.getElementById('username').value || 'Unknown',
    soldiers: +document.getElementById('mySoldiers').value,
    myPower: +document.getElementById('myPower').value,
    enemyPower: +document.getElementById('enemyPower').value,
    dead: +dead.replace(/,/g,''),
    wounded: +document.getElementById('predWounded').textContent.replace(/,/g,''),
    survive: +document.getElementById('predSurvive').textContent.replace(/,/g,'')
  };
  battles.unshift(entry);
  localStorage.setItem('zr_battles', JSON.stringify(battles));
  alert('Battle saved to log');
  updateStats();
}
