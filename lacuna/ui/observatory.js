'use strict';

// ── Observatory ──────────────────────────────────────────────────────────────
// The draggable stats panel. The DOM is built once per row layout (statsSig) and
// values are updated in place each tick, so the hover formula popups don't flicker.

let statsSig = null;   // null (not '') so the first update always builds the DOM
let statEls  = {};

function buildStats(showOrbiter, showComet) {
    const list = document.getElementById('stats-list');
    list.innerHTML = ''; statEls = {};
    const mk = label => {
        const row = document.createElement('div'); row.className = 'stat-row';
        row.innerHTML = `<span class="stat-label">${label}</span><span class="stat-val"></span>`;
        list.appendChild(row);
        return row.querySelector('.stat-val');
    };
    const mkPop = label => {
        const row = document.createElement('div'); row.className = 'stat-row stat-pop-row';
        row.innerHTML = `<span class="stat-label">${label}</span><span class="stat-val"></span><div class="stat-pop"></div>`;
        list.appendChild(row);
        return { val: row.querySelector('.stat-val'), pop: row.querySelector('.stat-pop') };
    };
    statEls.touch = mk('Star Touch Value');
    if (showOrbiter) { const r = mkPop('All Orbiters Payout'); statEls.orbiter = r.val; statEls.orbiterPop = r.pop; }
    statEls.rate = mk('Stardust / min');
    if (showComet)   { const r = mkPop('Comet Value');         statEls.comet   = r.val; statEls.cometPop   = r.pop; }
    statEls.time = mk('Time on Current Universe');
}

// Recompute + write the observatory values (called from updateUI each tick).
function updateObservatory() {
    const touchVal = clickValue();   // Star Touch + Star Grasp
    // Combine every orbiter type's payout (iterates the orbiters/* registry).
    let orbiterSum = 0, totalOrbiters = 0;
    const popParts = [];
    for (const o of ORBITERS) {
        const n = o.list().length;
        if (!n) continue;
        orbiterSum += n * o.payout();
        totalOrbiters += n;
        popParts.push(`${n} ${o.id} × ${fmtNum(o.payout())}`);
    }
    const cometVal = Math.round(10 * touchVal + 1.25 * orbiterSum);

    const showOrbiter = totalOrbiters >= 1, showComet = G.cometSeen;
    const sig = (showOrbiter ? 'O' : '') + (showComet ? 'C' : '');
    if (sig !== statsSig) { buildStats(showOrbiter, showComet); statsSig = sig; }

    statEls.touch.textContent = '✦' + fmtNum(touchVal);
    if (statEls.orbiter) {
        statEls.orbiter.textContent = '✦' + fmtNum(orbiterSum);
        statEls.orbiterPop.innerHTML = `${popParts.join(' + ')} = <b>✦${fmtNum(orbiterSum)}</b>`;
    }
    statEls.rate.textContent = '✦' + fmtNum(G.income * 60) + ' / min';
    if (statEls.comet) {
        statEls.comet.textContent = '✦' + fmtNum(cometVal);
        statEls.cometPop.innerHTML = `10 × click (${fmtNum(touchVal)}) + 1.25 × orbiters (${fmtNum(orbiterSum)}) = <b>✦${fmtNum(cometVal)}</b>`;
    }
    statEls.time.textContent = fmtTime(G.universeTime);
}
