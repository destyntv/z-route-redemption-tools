// ========== FIGHTER COMMAND ==========
const FIGHTER_MILESTONES = [
  { lv: 1, label: 'RX-1 Sky Eye', note: 'Basic scout fighter unlocked' },
  { lv: 30, label: 'Skill tier', note: 'Inferno Missile jamming ~20.5% / 3.2s' },
  { lv: 40, label: 'RX-2 Viper', note: 'Unlock: Fighter ATK +5000' },
  { lv: 50, label: 'Skill module', note: 'Module extra ~22% damage' },
  { lv: 70, label: 'Skill tier', note: 'Jamming ~26% / 3.2s' },
  { lv: 90, label: 'Skill module', note: 'Module bonus damage up to ~45%' },
  { lv: 100, label: 'RX-3 Orion', note: 'All Hero ATK +5%' },
  { lv: 110, label: 'Skill tier', note: 'Jamming ~26% / 4.2s' },
  { lv: 140, label: 'RX-4 Destroyer', note: 'All Hero Skill DMG +2%' },
  { lv: 190, label: 'RX-5 Phantom', note: 'All heroes take −5% DMG' },
  { lv: 250, label: 'RX-6 Apocalypse', note: '+5% enemy soldier death rate in PvP' }
];

function calcFighter() {
  const lv = +document.getElementById('fLevel')?.value || 1;
  const power = +document.getElementById('fPower')?.value || 0;
  const hHp = +document.getElementById('fHeroHp')?.value || 0;
  const hAtk = +document.getElementById('fHeroAtk')?.value || 0;
  const hDef = +document.getElementById('fHeroDef')?.value || 0;
  const cHAtk = +document.getElementById('cHAtk')?.value || 0;
  const cHDef = +document.getElementById('cHDef')?.value || 0;
  const cDmg = +document.getElementById('cDmg')?.value || 0;
  const box = document.getElementById('fighterResult');
  if (box) {
    box.innerHTML = `
      <div class="stat-box"><div class="value">${hHp.toLocaleString()}</div><div class="label">Hero HP (fighter)</div></div>
      <div class="stat-box"><div class="value">${(hAtk + cHAtk).toLocaleString()}</div><div class="label">Hero ATK (fighter+comp)</div></div>
      <div class="stat-box"><div class="value">${(hDef + cHDef).toLocaleString()}</div><div class="label">Hero DEF (fighter+comp)</div></div>
      <div class="stat-box"><div class="value">${power.toLocaleString()}</div><div class="label">Fighter power</div></div>
      <div class="stat-box"><div class="value">+${cDmg}%</div><div class="label">Hero damage (comp)</div></div>
      <div class="stat-box"><div class="value">Lv.${lv}</div><div class="label">Fighter level</div></div>`;
  }
  // roadmap
  const road = document.getElementById('fighterRoadmap');
  if (road) {
    road.innerHTML = '<ul style="padding-left:18px;font-size:0.9rem;line-height:1.55">' +
      FIGHTER_MILESTONES.map(m => {
        const done = lv >= m.lv;
        const next = !done && FIGHTER_MILESTONES.filter(x => x.lv > lv)[0]?.lv === m.lv;
        return `<li style="${done ? 'opacity:0.55' : ''}${next ? 'color:var(--accent2);font-weight:600' : ''}">
          <strong>Lv.${m.lv}</strong> ${m.label} — ${m.note} ${done ? '✓' : next ? '← next' : ''}</li>`;
      }).join('') + '</ul>';
  }
}

function applyFighterToCalcs() {
  const hHp = +document.getElementById('fHeroHp')?.value || 0;
  const hAtk = +document.getElementById('fHeroAtk')?.value || 0;
  // soft boost: add a fraction of fighter power into kill/casualty myPower if present
  const fPow = +document.getElementById('fPower')?.value || 0;
  const myP = document.getElementById('myPower');
  const killP = document.getElementById('killMyPower') || document.getElementById('killHeroPower');
  if (myP && fPow) {
    const base = +myP.value || 0;
    myP.value = Math.round(base + fPow * 0.15);
  }
  if (killP && fPow) {
    killP.value = Math.round((+killP.value || 0) + fPow * 0.15);
  }
  alert('Applied a share of fighter power into Casualties / Kill fields (approx). Hero bonuses: HP +' + hHp + ' / ATK +' + hAtk + '. Re-run Predict / Kill Calc.');
  goTab('kill');
}

function saveFighter() {
  const data = {};
  ['fLevel','fPower','fKeyStage','fAtk','fDef','fHp','fAtkCoef','fDefCoef','fHpCoef','fHeroHp','fHeroAtk','fHeroDef','c1','c2','c3','c4','c5','c6','cAtk','cHAtk','cHDef','cHp','cDmg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  localStorage.setItem('zr_fighter', JSON.stringify(data));
  alert('Fighter stats saved on this device.');
}

function loadFighter() {
  try {
    const data = JSON.parse(localStorage.getItem('zr_fighter') || '{}');
    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = data[id];
    });
  } catch (e) {}
}

function fighterSpendAdvice() {
  const day = +(document.getElementById('fVsDay')?.value ?? getGuideDay());
  const mr = document.getElementById('fMr')?.value || 'none';
  const el = document.getElementById('fSpendAdvice');
  if (!el) return;
  let tips = [];
  if (day === 1) {
    tips.push('<strong>Monday · Radar:</strong> Spend <em>Fighter Parts</em> and <em>Combat Chips</em> on training.');
    if (mr === 'fighter') tips.push('🔥 <strong>Triple-dip window:</strong> VS Mon + MR Fighter Enhancement — dump Parts/Chips now.');
    else tips.push('If MR is not Fighter Enhancement, you can still score VS Mon; wait for MR Fighter window for max value if you can.');
  } else if (day === 3) {
    tips.push('<strong>Wednesday · Tech:</strong> Open <em>Fighter Component Chests</em> (do not open early).');
    if (mr === 'tech' || mr === 'fighter') tips.push('🔥 Good overlap with Tech/Fighter MR — open chests and slot components.');
  } else if (day === 0) {
    tips.push('<strong>Sunday:</strong> Bank Parts, Chips, and Component Chests. No VS.');
  } else {
    tips.push('Not a primary fighter material day. <strong>Save Parts & Chips for Monday</strong>, <strong>Component Chests for Wednesday</strong>.');
    if (mr === 'fighter') tips.push('MR is Fighter Enhancement — small spends OK for MR chests; keep big stacks for Mon/Wed VS.');
  }
  tips.push('Skill breakpoints: 30 / 50 / 70 / 90 / 110 · Airframes: Viper 40, Orion 100 (+5% All Hero ATK), Destroyer 140, Phantom 190, Apocalypse 250.');
  el.innerHTML = tips.map(t => '• ' + t).join('<br>');
}

function fighterTrainAdvice() {
  const pct = +document.getElementById('fTrainPct')?.value || 0;
  const item = document.getElementById('fTrainItem')?.value || 'chips';
  const el = document.getElementById('fTrainAdvice');
  if (!el) return;
  if (item === 'parts') {
    el.innerHTML = '• <strong>Fighter Parts cannot Crit.</strong> Steady EXP only. Prefer Parts when you need guaranteed progress or are above 80%.';
  } else if (pct < 80) {
    el.innerHTML = '• Progress &lt; 80%: Combat Chips have <strong>50% chance to Crit (2× EXP)</strong>. Good time to burn Chips (ideally on VS Monday).';
  } else {
    el.innerHTML = '• Progress ≥ 80%: <strong>No Crit</strong> on Chips. Still use Chips if you need points on Monday; otherwise Parts are fine for linear progress.';
  }
}

function fighterWingAdvice() {
  const f = document.getElementById('fWingFocus')?.value || 'balanced';
  const el = document.getElementById('fWingAdvice');
  if (!el) return;
  const map = {
    raid: 'Prioritize <strong>Attack</strong> + <strong>Initiator</strong> wingmen for boss/rally damage. Support as third.',
    arena: 'Prioritize <strong>Defense</strong> + <strong>Support</strong> for survival; Attack if you outgear the bracket.',
    garrison: '<strong>Defense</strong> + <strong>Support</strong> first — garrison is about lasting hits.',
    balanced: 'One of each role (Initiator / Attack / Support / Defense) for flexible plans.'
  };
  el.innerHTML = '• Requires Upgrade Fighter system (server day 82+) and Fighter upgrade Lv.10 for Wingman Plan.<br>• ' + map[f];
}

function calcPowerSplit() {
  let heroP = 0;
  document.querySelectorAll('#rosterList .h-power').forEach(i => { heroP += +i.value || 0; });
  const fPow = +document.getElementById('fPower')?.value || 0;
  let troopP = 0;
  for (let i = 1; i <= 10; i++) {
    const n = +(document.getElementById('tc' + i)?.value || 0);
    troopP += n * i * 25; // rough estimate
  }
  const total = heroP + fPow + troopP || 1;
  const el = document.getElementById('fPowerSplit');
  if (!el) return;
  const pct = (x) => Math.round(x / total * 100);
  el.innerHTML = `
    <div class="grid grid-3">
      <div class="stat-box"><div class="value">${pct(heroP)}%</div><div class="label">Heroes (${heroP.toLocaleString()})</div>
        <div class="gauge"><span style="width:${pct(heroP)}%"></span></div></div>
      <div class="stat-box"><div class="value">${pct(fPow)}%</div><div class="label">Fighter (${fPow.toLocaleString()})</div>
        <div class="gauge"><span style="width:${pct(fPow)}%"></span></div></div>
      <div class="stat-box"><div class="value">${pct(troopP)}%</div><div class="label">Troops est. (${troopP.toLocaleString()})</div>
        <div class="gauge"><span style="width:${pct(troopP)}%"></span></div></div>
    </div>
    <p class="muted" style="margin-top:8px">Surprise tip: if Fighter is &gt;35% of this split, next Orion (Lv.100) or components often beat a random SSR star for squad-wide gain.</p>`;
}
