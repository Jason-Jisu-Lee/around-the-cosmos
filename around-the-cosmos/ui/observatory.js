'use strict';



let statsSig = null;
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
    statEls.touch = mk('Cosmic Pulse / s');
    if (showOrbiter) {
        const r = mkPop('All Orbiters Payout'); statEls.orbiter = r.val; statEls.orbiterPop = r.pop;
        statEls.orbiterMin = mk('All Orbiters Payout / min');
    }
    // Total income / min — the whole passive economy: the Lacuna's pulse + every orbiter.
    { const r = mkPop('Total income / min'); statEls.totalMin = r.val; statEls.totalMinPop = r.pop; }
    if (showComet)   { const r = mkPop('Comet Value');         statEls.comet   = r.val; statEls.cometPop   = r.pop; }
    { const r = mkPop('Total Stardust Collected'); statEls.total = r.val; statEls.totalPop = r.pop; }
    statEls.time   = mk('Time on Current Universe');
    statEls.played = mk('Total time played');
}


function updateObservatory() {
    const pulseVal = pulseValue();

    let orbiterSum = 0, orbiterPerMin = 0, totalOrbiters = 0;
    const popParts = [];
    for (const o of ORBITERS) {
        const n = o.list().length;
        if (!n) continue;

        const pay = (o.avgPayout || o.payout)();
        orbiterSum += n * pay;
        orbiterPerMin += n * pay * 60 * o.speed() / PLANET_DEF[o.ring].period;
        totalOrbiters += n;

        const name = o.id.charAt(0).toUpperCase() + o.id.slice(1);
        popParts.push(`${name} ✦${fmtNum(n * pay)}`);
    }
    const cometVal = Math.round((10 * pulseVal + orbiterSum) * brighterTailsMult());   // base (×1 speed); faster comets pay up to ×2

    const showOrbiter = totalOrbiters >= 1, showComet = G.cometSeen;
    const sig = (showOrbiter ? 'O' : '') + (showComet ? 'C' : '');
    if (sig !== statsSig) { buildStats(showOrbiter, showComet); statsSig = sig; }

    statEls.touch.textContent = '✦' + fmtNum(pulseVal) + ' / s';
    if (statEls.orbiter) {
        statEls.orbiter.textContent = '✦' + fmtNum(orbiterSum);
        statEls.orbiterPop.innerHTML = `${popParts.join(' + ')} = <b>✦${fmtNum(orbiterSum)}</b>`;
        statEls.orbiterMin.textContent = '✦' + fmtNum(orbiterPerMin) + ' / min';
    }
    // pulse income per minute: pulseValue() lands every PULSE_INTERVAL second (0 until Cosmic Pulse is owned)
    const pulsePerMin = (60 / PULSE_INTERVAL) * pulseVal;
    const totalPerMin = pulsePerMin + orbiterPerMin;
    statEls.totalMin.textContent = '✦' + fmtNum(totalPerMin) + ' / min';
    statEls.totalMinPop.innerHTML = `pulse (✦${fmtNum(pulsePerMin)}) + orbiters (✦${fmtNum(orbiterPerMin)}) = <b>✦${fmtNum(totalPerMin)}</b> / min`;
    if (statEls.comet) {
        statEls.comet.textContent = '✦' + fmtNum(cometVal);
        statEls.cometPop.innerHTML = `10 × pulse (${fmtNum(pulseVal)}) + orbiters (${fmtNum(orbiterSum)}) = <b>✦${fmtNum(cometVal)}</b> · ×1–2 by speed`;
    }
    statEls.total.textContent = '✦' + fmtNum(G.runDust);
    statEls.totalPop.innerHTML = 'All stardust earned in the current universe (resets on prestige).';
    statEls.time.textContent   = fmtTime(G.universeTime);
    statEls.played.textContent = fmtTime(G.gameTime);
}
