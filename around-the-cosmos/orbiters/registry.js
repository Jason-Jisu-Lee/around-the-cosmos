'use strict';

const ORBITERS = [];
const ORBITER_BY_ID = {};
function registerOrbiter(def) { ORBITERS.push(def); ORBITER_BY_ID[def.id] = def; }

function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }

// resonanceMult is the shared global x on EVERY orbiter's payout, so the dwarf Gravitational Anchor
// identity folds in here (typeof-guarded since dwarf.js loads after this) - future orbiters get it for free.
function resonanceMult() { return (1 + 0.10 * lvl('resonance')) * heavierBodiesMult() * (typeof anchorMult === 'function' ? anchorMult() : 1); }

function orbiterPayoutSum() { let s = 0; for (const o of ORBITERS) s += o.list().length * (o.avgPayout || o.payout)(); return s; }
