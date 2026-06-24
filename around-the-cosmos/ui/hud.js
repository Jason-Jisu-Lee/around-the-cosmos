'use strict';



let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    // Accretion button: appears when THIS universe's stardust (G.runDust — the same number shown
    // as "Total Stardust Collected") reaches 200k AND there's ≥1 Mass to actually claim. Gating on
    // runDust (not lifetime totalDust) is why it now matches the displayed figure and won't show early.
    // Hidden during the animation. ('block' is explicit — '' falls back to the CSS display:none.)
    const frozen = typeof accreting !== 'undefined' && accreting;
    const accShown = !frozen && G.runDust >= ACCRETION_THRESHOLD && massGain() >= 1;
    document.getElementById('accretion-btn').style.display = accShown ? 'block' : 'none';

    // Mass Upgrades (browse) button: appears once the player has ever accreted (earned any Mass).
    const massBtnShown = !frozen && G.massEarned > 0;
    document.getElementById('mass-upgrades-btn').style.display = massBtnShown ? 'block' : 'none';

    // "Hide completed" toggle only appears once the Moon has ever been owned (CSS default is flex).
    document.getElementById('upg-controls').style.display = G.moonEverOwned ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
