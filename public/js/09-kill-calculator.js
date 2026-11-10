// ========== KILL CALCULATOR ==========
function updateTierPreview() {
  const tier = +document.getElementById('troopTier')?.value || 6;
  const el = document.getElementById('tierColorPreview');
  if (!el) return;
  const colors = {
    1:'#7f8c8d',2:'#27ae60',3:'#2980b9',4:'#8e44ad',5:'#8e44ad',
    6:'#8e44ad',7:'#c0392b',8:'#c0392b',9:'#f39c12',10:'#f1c40f'
  };
  const labels = {1:'Basic',2:'',3:'',4:'',5:'',6:'',7:'',8:'',9:'Elite',10:'Max'};
  el.innerHTML = `<span class="tier t${tier}" style="background:${colors[tier]};color:${tier===10?'#111':'#fff'}">T${tier}</span> ${labels[tier]||''}`;
}

function setGenericDefaults() {
  document.getElementById('killMyPower').value = 10000000;
  document.getElementById('killHeroPower').value = 7000000;
  document.getElementById('killSoldierPower').value = 300000;
  document.getElementById('killMySoldiers').value = 10000;
  document.getElementById('killMyTier').value = '6';
  document.getElementById('killHospital').value = 8000;
  document.getElementById('killEnemyPower').value = 8000000;
  document.getElementById('killEnemySoldiers').value = 9000;
  document.getElementById('killEnemyTier').value = '5';
  document.getElementById('killRallySize').value = 1;
  document.getElementById('killAllyPower').value = 8000000;
}

function calcKill() {
  const myPower = +document.getElementById('killMyPower').value || 1;
  const heroP = +document.getElementById('killHeroPower').value || 0;
  const solP = +document.getElementById('killSoldierPower').value || 0;
  const mySol = +document.getElementById('killMySoldiers').value || 1;
  const myTier = Math.min(10, Math.max(1, +document.getElementById('killMyTier').value || 5));
  const hospital = +document.getElementById('killHospital').value || 0;
  const enPower = +document.getElementById('killEnemyPower').value || 1;
  const enSol = +document.getElementById('killEnemySoldiers').value || 1;
  const enTier = Math.min(10, Math.max(1, +document.getElementById('killEnemyTier').value || 5));
  const rally = Math.max(1, +document.getElementById('killRallySize').value || 1);
  const allyP = +document.getElementById('killAllyPower').value || myPower;

  // Effective power: heroes amplify soldiers; tier multiplies soldier contribution
  const tierMult = 0.7 + (myTier * 0.08);          // T1≈0.78, T6≈1.18, T10≈1.5
  const enTierMult = 0.7 + (enTier * 0.08);

  let myEff = heroP * 0.6 + solP * tierMult * (mySol / 10000);
  // Rally: diminishing returns after 5 members
  if (rally > 1) {
    const extra = Math.min(rally - 1, 8);
    const dim = extra <= 4 ? 0.85 : 0.65;
    myEff += (allyP * 0.7) * extra * dim;
  }

  const enEff = enPower * 0.55 + enSol * enTierMult * 0.8;

  // Kill probability (logistic-ish)
  const ratio = myEff / (enEff || 1);
  let chance = 50;
  if (ratio >= 1.8) chance = 95;
  else if (ratio >= 1.4) chance = 85;
  else if (ratio >= 1.15) chance = 72;
  else if (ratio >= 1.0) chance = 58;
  else if (ratio >= 0.85) chance = 40;
  else if (ratio >= 0.7) chance = 25;
  else chance = 10;

  // Casualties on our side
  let lossPct = Math.min(0.7, Math.max(0.04, 0.28 / Math.max(0.5, ratio)));
  lossPct *= (1.15 - myTier * 0.03); // higher tier = fewer losses
  let deadPct = lossPct * 0.28;
  let woundPct = lossPct * 0.72;

  let dead = Math.round(mySol * deadPct);
  let wounded = Math.round(mySol * woundPct);
  if (wounded > hospital) {
    const overflow = wounded - hospital;
    dead += Math.round(overflow * 0.55);
    wounded = hospital;
  }

  // Display
  const chanceEl = document.getElementById('killChance');
  chanceEl.textContent = chance + '%';
  chanceEl.className = 'value ' + (chance >= 70 ? 'good' : chance >= 45 ? 'warn' : 'bad');
  const g = document.getElementById('killGauge');
  if (g) g.style.width = chance + '%';
  document.getElementById('killMyDead').textContent = dead.toLocaleString();
  document.getElementById('killMyWound').textContent = wounded.toLocaleString();
  document.getElementById('killResult').style.display = 'block';

  // Tips
  let tips = [];
  if (rally === 1) {
    tips.push(chance >= 70 ? '✅ Solo looks favorable.' : chance >= 45 ? '⚠️ Solo is risky – consider a small rally.' : '❌ Solo is unlikely. Bring alliance help.');
  } else {
    tips.push(`Rally of ${rally}: effective power boosted with diminishing returns after ~5 members.`);
  }
  if (solP < 300000) tips.push('Your Soldier Power is low relative to Hero Power. Training more / higher-tier troops will raise kill chance more than pure hero upgrades.');
  if (myTier < 6) tips.push('Troop tier below T6 increases your losses. Prioritize Training Camp upgrades.');
  if (hospital < wounded * 0.8) tips.push('Hospital may overflow – free beds or you will take extra permanent deaths.');
  if (ratio < 1.0 && rally < 3) tips.push('Try increasing rally size or picking a weaker target.');
  tips.push('Formation + faction counters can swing real results ±15–20%.');

  document.getElementById('killTips').innerHTML = tips.map(t => `• ${t}`).join('<br>');
}
