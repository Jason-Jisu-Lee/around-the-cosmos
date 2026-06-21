'use strict';

// ── HUD / per-frame UI refresh ───────────────────────────────────────────────
// Orchestrates the throttled UI update: stardust readout, the "show completed"
// toggle, the upgrade panels, and the observatory stats.

let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    // Passive stardust / min — combined orbiter income (payout × orbits-per-minute).
    // Uses each orbiter's phase-averaged payout so the moon doesn't make it flicker.
    let rate = 0;
    for (const o of ORBITERS) {
        const n = o.list().length; if (!n) continue;
        rate += n * (o.avgPayout || o.payout)() * 60 * o.speed() / PLANET_DEF[o.ring].period;
    }
    document.getElementById('dust-rate').textContent = rate > 0 ? fmtNum(Math.round(rate)) + ' ✦ / min' : '';
    // (hidden via #dust-rate:empty when 0 — e.g. right after a reset, before you own an orbiter)

    // "Show completed" toggle is always present (it no longer pops in / pushes the list down).
    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
