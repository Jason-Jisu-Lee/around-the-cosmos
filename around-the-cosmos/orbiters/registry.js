'use strict';

// ─── Orbiter component registry ──────────────────────────────────────────────
// Each orbiter type lives in its own file in this folder and calls
// registerOrbiter(...) to plug itself in. The engine (logic/render/ui) and the
// info cards iterate ORBITERS, so adding an orbiter never touches those files —
// you only add a new file here (plus its upgrades in config.js and a body array
// in state.js / createInitialState).
//
// A component shape:
//   id, title, desc            — identity + flavor (edit desc here)
//   ring                       — PLANET_DEF index (orbit radius / period)
//   hoverR                     — cursor hit-radius for the info card
//   list()  -> bodies[]        — the array of bodies (lives in G)
//   clump() -> {angle,nextTop} — the shared orbit state (lives in G)
//   clumpPos() -> {x,y}        — current clump screen position
//   color() / pebbleR()        — render appearance
//   payout() / speed()         — per-body payout, orbit-speed factor
//   make()                     — create one body
//   count()                    — how many bodies to rebuild from upgrades (on load)
//   bodyUpgrade                — the upgrade id whose purchase adds a body
//   rows()                     — info-card stat rows
//   labels{ upgradeId: text|fn } — float-text shown when each related upgrade is bought
const ORBITERS = [];
const ORBITER_BY_ID = {};
function registerOrbiter(def) { ORBITERS.push(def); ORBITER_BY_ID[def.id] = def; }

// Shared helper: one label/value row in a cosmic info card.
function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }

// Resonance: a global ×payout multiplier on EVERY orbiter, +0.10 per level (×1 → ×1.5 at lvl 5).
// Each orbiter's payout() applies this, so it lifts dust, asteroids, comet windfalls, and the
// Gravitational Pull click bonus together. Also drives the Lacuna glow (render.js).
function resonanceMult() { return 1 + 0.10 * lvl('resonance'); }

// Combined payout of every orbiter currently in play (count × payout, summed over types).
function orbiterPayoutSum() { let s = 0; for (const o of ORBITERS) s += o.list().length * o.payout(); return s; }
