'use strict';

const CFG = {
    SAVE_KEY:      'lacuna_v1',
    MAX_PLANETS:   8,
    COMET_MIN_GAP: 25,
    COMET_MAX_GAP: 55,
    COMET_LIFE:    8,
};

const PLANET_DEF = [];
for (let i = 0; i < CFG.MAX_PLANETS; i++) {
    PLANET_DEF.push({
        value:  Math.pow(3, i),
        period: 6 + 3.5 * i,
        radius: 7 + i * 1.4,
    });
}

const PLANET_COLORS = [
    '#4a6a8a', '#7a6040', '#7a4838', '#506840',
    '#6a5070', '#7a6030', '#387070', '#7a4060',
];

// Asteroid Composition tiers — the asteroid's unique upgrade. Each tier recolors the
// asteroid and multiplies its payout (denser/richer material = more stardust).
const ASTEROID_COMP = {
    names:  ['Rock', 'Iron', 'Gold', 'Ice'],
    colors: ['#7a6a55', '#8c8f96', '#b8923a', '#a8c6d6'], // Rock keeps the original color
    mult:   [1, 1.5, 2.5, 4],                              // payout × per tier
};

// Cosmic-flavor physical model (for hover tooltips). Lacuna is a small dark rocky
// body; everything else (gravity, escape velocity, orbital speed) is derived from
// these with real formulas, so future science-based upgrades can scale them.
// All displayed values are capped at 3 significant figures.
const PHYS = {
    G:                  6.674e-11, // gravitational constant (m³ kg⁻¹ s⁻²)
    lacunaRadius:       120e3,     // m — 120 km, a small dark body (will grow with upgrades)
    lacunaDensity:      2500,      // kg/m³ — rocky (2.50 g/cm³)
    orbitRadius:        200e3,     // m — the dust clump's real orbital radius (200 km, ring 0)
    asteroidOrbitRadius:400e3,     // m — the asteroid clump's wider orbit (400 km, ring 1)
};

// unlock: fn → card is visible when fn() returns true.
// section: optional label → grouped under its own heading (else main list).
const UPGRADES = [
    {
        id: 'touch', name: 'Star Touch', maxLevel: 4, section: 'ACTIONS',
        costs: [10, 50, 200, 1000],
        tapYield: [1, 2, 4, 8, 16],
        desc: lvl => `Each click earns ${[1, 2, 4, 8, 16][lvl]} ✦`,
        unlock: () => true, // always visible — the first thing the player sees
    },
    {
        id: 'dust', name: 'Dust Particle', maxLevel: 4, section: 'ORBITERS',
        costs: [100, 350, 800, 1500],
        desc: () => 'A dust particle orbiting the Lacuna · +20 payout',
        unlock: () => lvl('touch') >= 2, // appears after the second Star Touch
    },
    {
        id: 'dustpay', name: 'Dust Particle Payout', maxLevel: 5, section: 'ORBITERS',
        costs: [150, 600, 1500, 3000, 6000],
        mult: lvl => Math.pow(2, lvl),   // ×2 all dust particles per level (up to ×32)
        desc: () => "Doubles every dust particle's payout",
        unlock: () => lvl('dust') >= 1,  // after the first dust particle
    },
    {
        id: 'dustspd', name: 'Dust Particle Speed', maxLevel: 5, section: 'ORBITERS',
        costs: [200, 500, 1000, 2000, 4000],
        mult: lvl => 1 + 0.2 * lvl,      // multiplies the reduced (50%) base; ×2 at lvl 5 → original speed
        desc: () => '×1.2 orbit speed per level (additive +20%). Starts at 100%, max 200%.',
        unlock: () => lvl('dust') >= 1,  // after the first dust particle
    },
    {
        id: 'asteroid', name: 'Asteroid', maxLevel: 1, section: 'ORBITERS',
        costs: [1000],                       // a single body — NOT a count upgrade (dust only)
        desc: () => 'A single rocky asteroid on a wider orbit · +80 payout',
        unlock: () => lvl('dust') >= 2,      // after the second dust particle
    },
    {
        id: 'astpay', name: 'Asteroid Payout', maxLevel: 5, section: 'ORBITERS',
        costs: [1500, 6000, 15000, 30000, 60000], // dust payout ratios × 10
        mult: lvl => Math.pow(2, lvl),       // ×2 every asteroid's payout per level (up to ×32)
        desc: () => "Doubles every asteroid's payout",
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astspd', name: 'Asteroid Speed', maxLevel: 5, section: 'ORBITERS',
        costs: [2000, 5000, 10000, 20000, 40000], // dust speed ratios × 10
        mult: lvl => 1 + 0.2 * lvl,          // base 100%, +20% additive per lvl → 200% at lvl 5
        desc: () => '×1.2 orbit speed per level (additive +20%). Starts at 100%, max 200%.',
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astcomp', name: 'Asteroid Composition', maxLevel: 3, section: 'ORBITERS',
        costs: [3000, 9000, 25000],          // reforge the single asteroid into richer material
        mult: lvl => ASTEROID_COMP.mult[lvl], // payout × for the current tier
        desc: l => l >= 3
            ? `Composition: ${ASTEROID_COMP.names[3]} · payout ×${ASTEROID_COMP.mult[3]}`
            : `Reforge ${ASTEROID_COMP.names[l]} → ${ASTEROID_COMP.names[l+1]} · asteroid payout ×${ASTEROID_COMP.mult[l+1]}`,
        unlock: () => lvl('asteroid') >= 1,  // the asteroid's unique upgrade
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 3, section: 'COMETS',
        costs: [30, 80, 200],
        bonus: lvl => 1 + 0.25 * lvl, // comet windfall multiplier
        desc: lvl => `Comet windfall ×${(1 + 0.25 * lvl).toFixed(2)}`,
        unlock: () => false, // comet upgrades disabled for now — revisit later
    },
];

// Display order of upgrade sections (new sections append here as the game grows).
const SECTION_ORDER = ['ACTIONS', 'ORBITERS', 'COMETS'];
