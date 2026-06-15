'use strict';

const CFG = {
    SAVE_KEY:       'lacuna_v1',
    MAX_PLANETS:    8,
    BASE_TAP_CD:    5,
    COMET_MIN_GAP:  25,
    COMET_MAX_GAP:  55,
    COMET_LIFE:     8,
    SUPERNOVA_COST: 100e6,
    COLLAPSE_UNIT:  5e4,
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

// unlock: null  → hidden in Play View until a milestone is set
// unlock: fn    → visible when fn() returns true
// Milestones are added one at a time as the design evolves.
const UPGRADES = [
    {
        id: 'planet', name: 'New Planet', maxLevel: 7,
        costs: [10, 60, 350, 2000, 12000, 80000, 500000],
        desc: lvl => `${lvl + 1} planet${lvl > 0 ? 's' : ''} in orbit`,
        unlock: null, // milestone TBD
    },
    {
        id: 'velocity', name: 'Orbit Velocity', maxLevel: 12,
        costs: Array.from({ length: 12 }, (_, i) => Math.round(25 * Math.pow(3, i))),
        speed: lvl => 1 + 0.12 * lvl,
        desc: lvl => lvl === 0 ? '+12% orbit speed per level' : `+${lvl * 12}% orbit speed`,
        unlock: null,
    },
    {
        id: 'radiance', name: 'Stellar Radiance', maxLevel: 12,
        costs: Array.from({ length: 12 }, (_, i) => Math.round(50 * Math.pow(3, i))),
        mult: lvl => Math.pow(2, lvl),
        desc: lvl => `${fmtNum(Math.pow(2, lvl))}× orbit payout`,
        unlock: null,
    },
    {
        id: 'touch', name: 'Star Touch', maxLevel: 10,
        costs: Array.from({ length: 10 }, (_, i) => Math.round(15 * Math.pow(3, i))),
        yield: lvl => 0.5 + 0.25 * lvl,
        desc: lvl => `Tap harvest pays ${Math.round((0.5 + 0.25 * lvl) * 100)}% of orbit value`,
        unlock: () => true, // always visible — the first thing the player sees
    },
    {
        id: 'hands', name: 'Quick Hands', maxLevel: 10,
        costs: Array.from({ length: 10 }, (_, i) => Math.round(20 * Math.pow(3, i))),
        cd: lvl => Math.max(1, CFG.BASE_TAP_CD - 0.4 * lvl),
        desc: lvl => `Tap cooldown ${Math.max(1, CFG.BASE_TAP_CD - 0.4 * lvl).toFixed(1)}s`,
        unlock: null,
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 5,
        costs: [500, 5000, 50000, 500000, 5000000],
        bonus: lvl => 1 + lvl,
        desc: lvl => lvl === 0 ? 'Comets visit more often, pay more' : `Comet windfall ×${1 + lvl}, visits ${Math.round((1 - Math.pow(0.88, lvl)) * 100)}% sooner`,
        unlock: null,
    },
    {
        id: 'supernova', name: 'Ignite Supernova', maxLevel: 1, special: true,
        costs: [CFG.SUPERNOVA_COST],
        desc: lvl => lvl === 0
            ? 'Let the star become light. The end of the beginning.'
            : 'The remnant glows — all payouts doubled.',
        unlock: null,
    },
];

const REMNANT_UPGRADES = [
    {
        id: 'ancient', name: 'Ancient Light', maxLevel: 20,
        costs: Array.from({ length: 20 }, (_, i) => i + 1),
        mult: lvl => 1 + 0.25 * lvl,
        desc: lvl => lvl === 0 ? '+25% all stardust per level' : `+${lvl * 25}% all stardust, forever`,
        unlock: null,
    },
    {
        id: 'memory', name: 'Gravitational Memory', maxLevel: 5,
        costs: [2, 5, 12, 25, 50],
        desc: lvl => lvl === 0 ? 'Begin each run with extra planets' : `Begin with ${lvl + 1} planets`,
        unlock: null,
    },
    {
        id: 'dilation', name: 'Time Dilation', maxLevel: 10,
        costs: [1, 3, 6, 10, 15, 21, 28, 36, 45, 55],
        speed: lvl => 1 + 0.15 * lvl,
        desc: lvl => lvl === 0 ? '+15% orbit speed per level, forever' : `+${lvl * 15}% orbit speed, forever`,
        unlock: null,
    },
    {
        id: 'moons', name: 'Moonrise', maxLevel: 8,
        costs: [3, 7, 14, 26, 45, 70, 100, 140],
        desc: lvl => lvl === 0
            ? 'Give planets moons that double their payout'
            : `Innermost ${lvl} planet${lvl > 1 ? 's' : ''} carry moons (×2 payout)`,
        unlock: null,
    },
    {
        id: 'horizon', name: 'Event Horizon', maxLevel: 10,
        costs: [5, 12, 24, 42, 66, 96, 130, 170, 215, 265],
        rate: lvl => 0.02 * lvl,
        desc: lvl => lvl === 0
            ? 'A hidden singularity sips stardust passively'
            : `Accretes ${lvl * 2}% of orbit rate, continuously`,
        unlock: null,
    },
];
