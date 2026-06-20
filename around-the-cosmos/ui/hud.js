'use strict';

// ── HUD / per-frame UI refresh ───────────────────────────────────────────────
// Orchestrates the throttled UI update: stardust readout, the "show completed"
// toggle, the upgrade panels, and the observatory stats.

let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    // "Show completed" toggle is always present (it no longer pops in / pushes the list down).
    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
