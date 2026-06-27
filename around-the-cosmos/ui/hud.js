'use strict';

let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    const frozen = typeof accreting !== 'undefined' && accreting;
    const accShown = !frozen && G.runDust >= ACCRETION_THRESHOLD && massGain() >= 1;
    const accEl = document.getElementById('accretion-btn');
    if (accEl) accEl.style.display = accShown ? 'block' : 'none';

    const massBtnShown = !frozen && G.massEarned > 0;
    const massEl = document.getElementById('mass-upgrades-btn');
    if (massEl) massEl.style.display = massBtnShown ? 'block' : 'none';

    document.getElementById('upg-controls').style.display = G.moonEverOwned ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
