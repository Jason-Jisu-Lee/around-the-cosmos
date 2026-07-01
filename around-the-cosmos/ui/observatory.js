'use strict';

let statsSig = null;
let statEls  = {};

function buildStats(showOrbiter, showComet, showVortex, showPlayed) {
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
    if (showOrbiter) {
        const r = mkPop('All Orbiters Payout'); statEls.orbiter = r.val; statEls.orbiterPop = r.pop;
        statEls.orbiterMin = mk('All Orbiters Payout / min');
    }
    { const r = mkPop('Total income / min'); statEls.totalMin = r.val; statEls.totalMinPop = r.pop; }
    if (showComet)   { const r = mkPop('Comet Value');         statEls.comet   = r.val; statEls.cometPop   = r.pop; }
    if (showVortex)  { const r = mkPop('Vortex Value');        statEls.vortex  = r.val; statEls.vortexPop  = r.pop; }
    { const r = mkPop('Total Stardust Collected'); statEls.total = r.val; statEls.totalPop = r.pop; }
    statEls.time   = mk('Time on Current Universe');
    if (showPlayed) statEls.played = mk('Total time played');
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
        orbiterPerMin += n * pay * 60 * (o.avgSpeed || o.speed)() / PLANET_DEF[o.ring].period;
        totalOrbiters += n;
        const name = o.id.charAt(0).toUpperCase() + o.id.slice(1);
        popParts.push(`${name} ✦${fmtNum(n * pay)}`);
    }
    const cometVal = Math.round((10 * pulseVal + orbiterSum) * brighterTailsMult());

    const showOrbiter = totalOrbiters >= 1, showComet = G.cometSeen, showVortex = G.vortexSeen, showPlayed = G.massEarned > 0;
    const sig = (showOrbiter ? 'O' : '') + (showComet ? 'C' : '') + (showVortex ? 'V' : '') + (showPlayed ? 'P' : '');
    if (sig !== statsSig) { buildStats(showOrbiter, showComet, showVortex, showPlayed); statsSig = sig; }

    if (statEls.orbiter) {
        setStatTxt(statEls.orbiter, '✦' + fmtNum(orbiterSum));
        setStatHtml(statEls.orbiterPop, `${popParts.join(' + ')} = <b>✦${fmtNum(orbiterSum)}</b>`);
        setStatTxt(statEls.orbiterMin, '✦' + fmtNum(orbiterPerMin) + ' / min');
    }
    const pulsePerMin = 60 * pulseIncomePerSec();
    const totalPerMin = pulsePerMin + orbiterPerMin;
    setStatTxt(statEls.totalMin, '✦' + fmtNum(totalPerMin) + ' / min');
    setStatHtml(statEls.totalMinPop, `pulse (✦${fmtNum(pulsePerMin)}) + orbiters (✦${fmtNum(orbiterPerMin)}) = <b>✦${fmtNum(totalPerMin)}</b> / min`);
    if (statEls.comet) {
        setStatTxt(statEls.comet, '✦' + fmtNum(cometVal));
        setStatHtml(statEls.cometPop, `Scales with pulse and orbiters.`);
    }
    if (statEls.vortex) {
        const RM = (typeof VX !== 'undefined') ? VX.REWARD_MULT : 10;
        setStatTxt(statEls.vortex, '✦' + fmtNum(cometVal * RM));
        setStatHtml(statEls.vortexPop, `Scales with comet value.`);
    }
    setStatTxt(statEls.total, '✦' + fmtNum(G.runDust));
    setStatHtml(statEls.totalPop, 'All stardust earned in the current universe (resets on prestige).');
    setStatTxt(statEls.time, fmtTime(G.universeTime));
    if (statEls.played) setStatTxt(statEls.played, fmtTime(G.gameTime));
}

// Write-through caches: skip the DOM write (and the innerHTML re-parse) when the value is unchanged -
// most rows only move once a second while the observatory refreshes ~7x/s.
function setStatTxt(el, s)  { if (el._t !== s) { el.textContent = s; el._t = s; } }
function setStatHtml(el, s) { if (el._h !== s) { el.innerHTML  = s; el._h = s; } }
