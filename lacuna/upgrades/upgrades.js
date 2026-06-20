'use strict';

// ── Upgrade definitions ──────────────────────────────────────────────────────
// All purchasable upgrades and the order their sections render in. Effects are
// kept ADDITIVE (fixed +amount per level) rather than doubling, so the economy
// scales predictably — see orbiters/* for how payout/speed read these levels.
//
//   unlock: fn → card is visible when fn() returns true.
//   section: heading the card is grouped under (see SECTION_ORDER).
const UPGRADES = [
    {
        id: 'touch', name: 'Star Touch', maxLevel: 8, section: 'MAIN',
        costs: [10, 50, 150, 250, 400, 600, 800, 1000],
        tapYield: [1, 2, 3, 4, 5, 6, 7, 8, 9],           // +1 ✦ per click per level
        desc: () => '+1 ✦ to every click, per level',    // per-click total is in the observatory
        unlock: () => true,                              // always visible — the first thing seen
    },
    {
        id: 'grasp', name: 'Star Grasp', maxLevel: 3, section: 'MAIN',
        costs: [500, 1000, 1500],
        desc: () => '+2 ✦ to every click, per level',    // stacks on top of Star Touch
        unlock: () => lvl('touch') >= 5,                 // after the 5th Star Touch
    },
    {
        id: 'gravpull', name: 'Gravitational Pull', maxLevel: 2, section: 'MAIN',
        costs: [5000, 20000],
        // Each level adds +1% of total orbiter payout to every click (applied in clickValue()).
        desc: () => '+1% of all orbiter payout to each click, per level',
        unlock: () => lvl('grasp') >= 3,                 // after Star Grasp is maxed
    },
    {
        id: 'dust', name: 'Dust Particle', maxLevel: 5, section: 'DUST PARTICLES',
        costs: [100, 500, 1200, 2500, 4000],
        desc: () => 'A dust particle orbiting the Lacuna · +10 base payout',
        unlock: () => lvl('touch') >= 2,                 // after the second Star Touch
    },
    {
        id: 'dustpay', name: 'Dust Particle Payout', maxLevel: 5, section: 'DUST PARTICLES',
        costs: [150, 500, 1200, 2000, 3000],
        desc: () => '+10 to every dust particle’s payout',   // additive, not doubling
        unlock: () => lvl('dust') >= 1,
    },
    {
        id: 'dustspd', name: 'Dust Particle Speed', maxLevel: 5, section: 'DUST PARTICLES',
        costs: [200, 600, 1500, 2500, 4200],
        mult: lvl => 1 + 0.2 * lvl,                      // multiplier; dustSpeed() scales it by 0.82
        desc: () => '+20% orbit speed per level (additive)',
        unlock: () => lvl('dust') >= 1,
    },
    {
        id: 'asteroid', name: 'Asteroid', maxLevel: 1, section: 'ASTEROID',
        costs: [1500],                                   // a single body — NOT a count upgrade
        desc: () => 'A single rocky asteroid on a wider orbit · +50 base payout',
        unlock: () => lvl('dust') >= 2,                  // after the second dust particle
    },
    {
        id: 'astpay', name: 'Asteroid Payout', maxLevel: 5, section: 'ASTEROID',
        costs: [1500, 4500, 10000, 20000, 36000],
        desc: () => '+50 to every asteroid’s payout',    // additive, not doubling
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astspd', name: 'Asteroid Speed', maxLevel: 5, section: 'ASTEROID',
        costs: [2000, 4500, 9000, 17000, 30000],
        mult: lvl => 1 + 0.2 * lvl,                      // multiplier; asteroidSpeed() scales it by 0.88
        desc: () => '+20% orbit speed per level (additive)',
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astcomp', name: 'Asteroid Composition', maxLevel: 3, section: 'ASTEROID',
        costs: [3000, 8000, 18000],                      // reforge into richer material
        desc: l => l >= 3
            ? `Composition: ${ASTEROID_COMP.names[3]} · payout ×${ASTEROID_COMP.mult[3]}`
            : `Reforge ${ASTEROID_COMP.names[l]} → ${ASTEROID_COMP.names[l+1]} · asteroid payout ×${ASTEROID_COMP.mult[l+1]}`,
        unlock: () => lvl('asteroid') >= 1,              // the asteroid's unique upgrade
    },
    {
        id: 'resonance', name: 'Resonance', maxLevel: 4, section: 'MAIN',
        costs: [5000, 10000, 18000, 30000],
        // +25% to every orbiter's payout per level (additive, ×1.25 → ×2). Also lights the Lacuna's glow.
        desc: () => '+25% to every orbiter’s payout, per level (additive). The Lacuna begins to glow.',
        unlock: () => lvl('touch') >= 8 && lvl('gravpull') >= 2,   // after Star Touch + Gravitational Pull maxed
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 3, section: 'COMETS',
        costs: [30, 80, 200],
        bonus: lvl => 1 + 0.25 * lvl,
        desc: lvl => `Comet windfall ×${(1 + 0.25 * lvl).toFixed(2)}`,
        unlock: () => false,                             // comet upgrades disabled for now
    },
];

// Display order of upgrade sections — one per orbiter (a future tab each), MAIN first.
const SECTION_ORDER = ['MAIN', 'DUST PARTICLES', 'ASTEROID', 'COMETS'];
