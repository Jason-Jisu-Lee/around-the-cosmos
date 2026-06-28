'use strict';

let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    const frozen = typeof accreting !== 'undefined' && accreting;
    const claimable   = !frozen && canAccrete();
    const accProgress = !frozen && G.massEarned > 0 && !claimable;   // progress bar - only after the first accretion
    const accEl = document.getElementById('accretion-btn');
    if (accEl) {
        accEl.style.display = (claimable || accProgress) ? 'block' : 'none';
        accEl.classList.toggle('claimable', claimable);
        accEl.classList.toggle('progress', accProgress);
        const bar = accEl.querySelector('.acc-card-prog i');
        if (bar) bar.style.width = Math.min(100, G.runDust / accrThreshold() * 100).toFixed(1) + '%';
    }

    const massBtnShown = !frozen && G.massEarned > 0;
    const massEl = document.getElementById('mass-upgrades-btn');
    if (massEl) massEl.style.display = massBtnShown ? 'block' : 'none';

    document.getElementById('upg-controls').style.display = G.moonEverOwned ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
