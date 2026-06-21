'use strict';


const ORBITERS = [];
const ORBITER_BY_ID = {};
function registerOrbiter(def) { ORBITERS.push(def); ORBITER_BY_ID[def.id] = def; }


function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }


function resonanceMult() { return 1 + 0.10 * lvl('resonance'); }


function orbiterPayoutSum() { let s = 0; for (const o of ORBITERS) s += o.list().length * o.payout(); return s; }
