'use strict';



let lastUITick = 0;

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);


    let rate = 0;
    for (const o of ORBITERS) {
        const n = o.list().length; if (!n) continue;
        rate += n * (o.avgPayout || o.payout)() * 60 * o.speed() / PLANET_DEF[o.ring].period;
    }
    document.getElementById('dust-rate').textContent = rate > 0 ? fmtNum(Math.round(rate)) + ' ✦ / min' : '';



    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    updateObservatory();
}
