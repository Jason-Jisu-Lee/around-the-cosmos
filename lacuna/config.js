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
        id: 'touch', name: 'Star Touch', maxLevel: 2, section: 'ACTIONS',
        costs: [10, 50],
        tapYield: [1, 2, 4],
        desc: lvl => `Each click earns ${[1, 2, 4][lvl]} ✦`,
        unlock: () => true, // always visible — the first thing the player sees
    },
    {
        id: 'planet', name: 'New Planet', maxLevel: 7, section: 'PLANETS',
        costs: [20, 600, 7000, 40000, 240000, 1600000, 10000000],
        desc: () => 'Adds a planet to orbit',
        unlock: () => lvl('touch') >= 1, // appears after the first Star Touch
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 3, section: 'COMETS',
        costs: [30, 80, 200],
        bonus: lvl => 1 + 0.25 * lvl, // comet windfall multiplier
        desc: lvl => `Comet windfall ×${(1 + 0.25 * lvl).toFixed(2)}`,
        unlock: () => G.cometsCaught >= 1,
    },
];

// Display order of upgrade sections (new sections append here as the game grows).
const SECTION_ORDER = ['ACTIONS', 'PLANETS', 'COMETS'];
