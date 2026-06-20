'use strict';

// ── HUD / per-frame UI refresh ───────────────────────────────────────────────
// Orchestrates the throttled UI update: stardust readout, the "show completed"
// toggle, the upgrade panels, and the observatory stats.

let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent   = fmtNum(G.income * 60) + ' / min';

    // Show the "completed" toggle only once something has actually been maxed.
    const anyMaxed = UPGRADES.some(u => upgradeVisible(u) && G.upgrades[u.id] >= u.maxLevel);
    document.getElementById('upg-controls').style.display = anyMaxed ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
