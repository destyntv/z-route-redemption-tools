// ========== HISTORY ==========
function renderBattles() {
  const list = document.getElementById('battleList');
  if (battles.length === 0) {
    list.innerHTML = '<p class="muted">No battles logged yet.</p>';
    return;
  }
  list.innerHTML = `
    <div class="compare-row">
      ${battles.map(b => `
        <div class="card compare-card">
          <strong>${b.date}</strong><br>
          <span class="muted">${b.username}</span><br>
          Soldiers: ${b.soldiers.toLocaleString()}<br>
          Power: ${b.myPower.toLocaleString()} vs ${b.enemyPower.toLocaleString()}<br>
          <span class="bad">Dead: ${b.dead.toLocaleString()}</span> |
          <span class="warn">Wounded: ${b.wounded.toLocaleString()}</span><br>
          Survive: ${b.survive.toLocaleString()}
        </div>
      `).join('')}
    </div>
    <p class="muted" style="margin-top:8px">Scroll horizontally to compare multiple battles. Future version will add side-by-side charts.</p>
  `;
}

function clearBattles() {
  if (confirm('Clear all battle logs?')) {
    battles = [];
    localStorage.removeItem('zr_battles');
    renderBattles();
    updateStats();
  }
}
