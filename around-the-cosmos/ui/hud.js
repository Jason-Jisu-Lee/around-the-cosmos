'use strict';



let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);

    // Accretion button stays hidden until the first time lifetime stardust passes the threshold.
    // (Must be an explicit 'block' — '' would fall back to the CSS rule, which is display:none.)
    document.getElementById('accretion-btn').style.display = canAccrete() ? 'block' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
