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
        id: 'dust', name: 'Dust Particle', maxLevel: 3, section: 'ORBITERS',
        costs: [100, 350, 800],
        desc: () => 'A dust particle orbiting the Lacuna · +10 payout',
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
        id: 'charm', name: 'Comet Charm', maxLevel: 3, section: 'COMETS',
        costs: [30, 80, 200],
        bonus: lvl => 1 + 0.25 * lvl, // comet windfall multiplier
        desc: lvl => `Comet windfall ×${(1 + 0.25 * lvl).toFixed(2)}`,
        unlock: () => false, // comet upgrades disabled for now — revisit later
    },
];

// Display order of upgrade sections (new sections append here as the game grows).
const SECTION_ORDER = ['ACTIONS', 'ORBITERS', 'COMETS'];
