// ========== EVENT STAMINA GOAL CALCULATOR ==========
(() => {
  const inputIds = [
    'staminaYourScore', 'staminaLeaderScore', 'staminaPointsPer',
    'stamina10Owned', 'stamina50Owned', 'staminaCurrent', 'staminaClaims'
  ];
  const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const wholeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const read = id => {
    const value = Number(document.getElementById(id)?.value);
    return Number.isFinite(value) ? value : NaN;
  };
  const fmt = value => numberFormat.format(value);
  const fmtWhole = value => wholeFormat.format(value);
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  function renderStaminaCalculator() {
    const values = Object.fromEntries(inputIds.map(id => [id, read(id)]));
    const invalid = Object.entries(values).filter(([id, value]) =>
      !Number.isFinite(value) || value < 0 ||
      (id === 'staminaPointsPer' && value <= 0) ||
      (['stamina10Owned', 'stamina50Owned', 'staminaClaims'].includes(id) && !Number.isInteger(value))
    );
    const tip = document.getElementById('staminaStrategy');
    if (invalid.length) {
      const statusEl = document.getElementById('staminaStatus');
      set('staminaStatus', '⚠️ Check your inputs');
      if (statusEl) statusEl.className = 'stamina-status warn';
      if (tip) {
        tip.className = 'stamina-tip stamina-tip-warn';
        tip.innerHTML = '<h3>⚠️ Check your inventory</h3><p>Enter non-negative numbers. Points per stamina must be greater than zero, and can/claim counts must be whole numbers.</p>';
      }
      return;
    }

    const yourScore = values.staminaYourScore;
    const leaderScore = values.staminaLeaderScore;
    const pointsPerStamina = values.staminaPointsPer;
    const pointsNeeded = Math.max(0, leaderScore - yourScore + 1);
    const staminaNeeded = Math.ceil(pointsNeeded / pointsPerStamina);
    const inventory = {
      cans10: values.stamina10Owned,
      cans50: values.stamina50Owned,
      current: values.staminaCurrent,
      claims: values.staminaClaims
    };
    const available = inventory.cans10 * 10 + inventory.cans50 * 50 +
      inventory.current + inventory.claims * 50;

    // Cans and free claims are indivisible. The final item in a category can
    // create surplus stamina, but the user's requested priority is preserved.
    let remainingNeed = staminaNeeded;
    const use50 = Math.min(inventory.cans50, remainingNeed > 0 ? Math.ceil(remainingNeed / 50) : 0);
    remainingNeed = Math.max(0, remainingNeed - use50 * 50);
    const useClaims = Math.min(inventory.claims, remainingNeed > 0 ? Math.ceil(remainingNeed / 50) : 0);
    remainingNeed = Math.max(0, remainingNeed - useClaims * 50);
    const useCurrent = Math.min(inventory.current, remainingNeed);
    remainingNeed = Math.max(0, remainingNeed - useCurrent);
    const use10 = Math.min(inventory.cans10, remainingNeed > 0 ? Math.ceil(remainingNeed / 10) : 0);

    const totalUsed = use50 * 50 + useClaims * 50 + useCurrent + use10 * 10;
    const pointsGained = totalUsed * pointsPerStamina;
    const projectedScore = yourScore + pointsGained;
    const projectedLead = projectedScore - leaderScore;
    const remain50 = inventory.cans50 - use50;
    const remain10 = inventory.cans10 - use10;
    const remainClaims = inventory.claims - useClaims;
    const remainCurrent = inventory.current - useCurrent;
    const remainingStamina = remain50 * 50 + remainClaims * 50 + remainCurrent + remain10 * 10;
    const remainingPotential = remainingStamina * pointsPerStamina;
    const enough = available >= staminaNeeded;
    const status = !enough ? 'bad' : remainingStamina < 100 ? 'warn' : 'good';

    set('staminaPointsNeeded', fmtWhole(pointsNeeded));
    set('staminaStaminaNeeded', fmtWhole(staminaNeeded));
    set('staminaAvailable', fmt(available));
    set('staminaUse50', fmtWhole(use50));
    set('staminaUseClaims', fmtWhole(useClaims));
    set('staminaUseCurrent', fmt(useCurrent));
    set('staminaUse10', fmtWhole(use10));
    set('staminaTotalUsed', fmt(totalUsed));
    set('staminaPointsGained', fmt(pointsGained));
    set('staminaProjectedScore', fmt(projectedScore));
    set('staminaProjectedLead', (projectedLead >= 0 ? '+' : '') + fmt(projectedLead));
    set('staminaRemain50', fmtWhole(remain50));
    set('staminaRemain10', fmtWhole(remain10));
    set('staminaRemainClaims', fmtWhole(remainClaims));
    set('staminaRemainTotal', fmt(remainingStamina));
    set('staminaRemainPotential', fmt(remainingPotential));

    const statusEl = document.getElementById('staminaStatus');
    if (statusEl) {
      statusEl.className = 'stamina-status ' + status;
      statusEl.textContent = status === 'good' ? '🟢 Guaranteed 1st · 100+ stamina reserve'
        : status === 'warn' ? '🟡 Close Call · 0–99 stamina reserve'
        : '🔴 Not Enough · Short on stamina';
    }

    if (!tip) return;
    if (!enough) {
      const shortBy = staminaNeeded - available;
      tip.className = 'stamina-tip stamina-tip-bad';
      tip.innerHTML = '<h3>🧠 Strategy Tip</h3>' +
        '<p>❌ You do not currently have enough stamina to reach 1st.</p>' +
        '<p>You need <strong>' + fmtWhole(staminaNeeded) + '</strong> stamina.</p>' +
        '<p>You only have <strong>' + fmt(available) + '</strong> stamina.</p>' +
        '<p>You are short by <strong>' + fmt(shortBy) + '</strong> stamina.</p>' +
        '<p>That equals <strong>' + fmt(shortBy * pointsPerStamina) + '</strong> points.</p>';
    } else if (remainingStamina < 100) {
      tip.className = 'stamina-tip stamina-tip-warn';
      tip.innerHTML = '<h3>⚠️ Strategy Tip</h3>' +
        '<p>You can reach 1st place, but your reserve is limited.</p>' +
        '<p>After the push you will have <strong>' + fmt(remainingStamina) + '</strong> stamina remaining.</p>' +
        '<p>That reserve is worth <strong>' + fmt(remainingPotential) + '</strong> additional points.</p>';
    } else {
      tip.className = 'stamina-tip stamina-tip-good';
      tip.innerHTML = '<h3>🧠 Strategy Tip</h3>' +
        '<p>In order to reach 1st place you\'ll need <strong>' + fmtWhole(pointsNeeded) + '</strong> points.</p>' +
        '<p>At <strong>' + fmt(pointsPerStamina) + '</strong> points per stamina, you\'ll need <strong>' + fmtWhole(staminaNeeded) + '</strong> stamina.</p>' +
        '<p>Your inventory contains <strong>' + fmt(available) + '</strong> stamina.</p>' +
        '<p>✅ You have enough stamina to reach 1st place.</p>' +
        '<p>✅ After taking 1st place you will still have <strong>' + fmt(remainingStamina) + '</strong> stamina remaining.</p>' +
        '<p>✅ That reserve is worth <strong>' + fmt(remainingPotential) + '</strong> additional points.</p>' +
        '<p>💡 Consider saving your remaining stamina for a last-minute counter push.</p>';
    }
  }

  window.renderStaminaCalculator = renderStaminaCalculator;
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    input?.addEventListener('input', renderStaminaCalculator);
    input?.addEventListener('change', renderStaminaCalculator);
  });
  document.getElementById('staminaCalculate')?.addEventListener('click', renderStaminaCalculator);
  renderStaminaCalculator();
})();
