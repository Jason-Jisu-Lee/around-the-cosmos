'use strict';


const ORBITERS = [];
const ORBITER_BY_ID = {};
function registerOrbiter(def) { ORBITERS.push(def); ORBITER_BY_ID[def.id] = def; }


function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }


// Global ×payout applied to every orbiter: Resonance (this universe) × Heavier Bodies (Mass upgrade).
// Folding the Mass mult in here means it propagates to earning, displays, comet value, and gravpull
// at once. (The Lacuna glow reads lvl('resonance') directly, so it's unaffected.)
function resonanceMult() { return (1 + 0.10 * lvl('resonance')) * heavierBodiesMult(); }


// Uses each orbiter's phase-AVERAGED payout (avgPayout where present, e.g. the moon) so the value
// is steady — it feeds Gravitational Pull's contribution to pulseValue(), which must not flicker
// with the moon's lunar phase.
function orbiterPayoutSum() { let s = 0; for (const o of ORBITERS) s += o.list().length * (o.avgPayout || o.payout)(); return s; }
