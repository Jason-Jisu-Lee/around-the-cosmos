'use strict';

const UPGRADES = [
    {
        id: 'touch', name: 'Star Touch', maxLevel: 8, section: 'MAIN',
        costs: [10, 50, 150, 250, 400, 600, 800, 1000],
        tapYield: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        flavor: 'Reach into the dark and take what little light answers.',
        desc: () => '+1 ✦ to every click, per level.',
        unlock: () => true,
    },
    {
        id: 'grasp', name: 'Star Grasp', maxLevel: 3, section: 'MAIN',
        costs: [500, 1000, 1500],
        flavor: 'A surer hand closes on the falling stardust.',
        desc: () => '+2 ✦ to every click, per level (stacks on Star Touch).',
        unlock: () => lvl('touch') >= 4,
    },
    {
        id: 'pulse', name: 'Pulse', maxLevel: 1, section: 'MAIN',
        costs: [10000],
        flavor: 'A steady heartbeat to keep the gathering going on its own.',
        desc: () => 'Every 3s the Lacuna pulses for 12 clicks of stardust (about 4 / sec). Hands-free: you no longer harvest by clicking.',
        unlock: () => lvl('touch') >= 8,
    },
    {
        id: 'gravpull', name: 'Gravitational Pull', maxLevel: 2, section: 'MAIN',
        costs: [2000, 4000],
        flavor: 'Let your own gathered weight do some of the pulling.',
        desc: () => '+1% of all orbiter payout added to every click, per level.',
        unlock: () => lvl('grasp') >= 3,
    },
    {
        id: 'resonance', name: 'Resonance', maxLevel: 5, section: 'MAIN',
        costs: [3000, 6500, 12000, 20000, 32000],
        flavor: 'Tune the whole quiet system until it hums.',
        desc: () => '+10% to every orbiter’s payout, per level. Also lights the Lacuna’s glow.',
        unlock: () => lvl('grasp') >= 3,
    },
    {
        id: 'dust', name: 'Dust Particle', maxLevel: 1, section: 'DUST PARTICLES',
        costs: [100],
        flavor: 'The first grain of dust to settle into the Lacuna’s quiet orbit.',
        desc: () => 'Adds your first dust particle on the inner orbit. +10 base payout per orbit.',
        unlock: () => lvl('touch') >= 2,
    },
    {
        id: 'dustcount', name: 'Dust Particle Count', maxLevel: 4, section: 'DUST PARTICLES',
        costs: [500, 1200, 2500, 4000],
        desc: () => '+1 dust particle in the clump, up to 5 (+10 base payout each).',
        unlock: () => lvl('dust') >= 1,
    },
    {
        id: 'dustpay', name: 'Dust Particle Payout', maxLevel: 5, section: 'DUST PARTICLES',
        costs: [150, 500, 1200, 2000, 3000],
        desc: () => '+10 to every dust particle’s payout, per level.',
        unlock: () => lvl('dust') >= 1,
    },
    {
        id: 'dustspd', name: 'Dust Particle Speed', maxLevel: 5, section: 'DUST PARTICLES',
        costs: [200, 600, 1500, 2500, 4200],
        mult: lvl => 1 + 0.2 * lvl,
        desc: () => '+20% dust orbit speed, per level.',
        unlock: () => lvl('dust') >= 1,
    },
    {
        id: 'asteroid', name: 'Asteroid', maxLevel: 1, section: 'ASTEROID',
        costs: [1500],
        flavor: 'A wandering chunk of old rock, heavy and slow.',
        desc: () => 'Adds the asteroid on a wider, slower orbit. +50 base payout per orbit.',
        unlock: () => lvl('dustcount') >= 1,
    },
    {
        id: 'astpay', name: 'Asteroid Payout', maxLevel: 5, section: 'ASTEROID',
        costs: [1500, 4500, 10000, 20000, 36000],
        desc: () => '+50 to the asteroid’s payout, per level.',
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astspd', name: 'Asteroid Speed', maxLevel: 5, section: 'ASTEROID',
        costs: [2000, 4500, 9000, 17000, 30000],
        mult: lvl => 1 + 0.2 * lvl,
        desc: () => '+20% asteroid orbit speed, per level.',
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'astcomp', name: 'Asteroid Composition', maxLevel: 3, section: 'ASTEROID',
        costs: [3000, 8000, 18000],
        flavor: 'Reforge the rock into denser, richer stuff.',
        desc: l => l >= 3
            ? `Composition: ${ASTEROID_COMP.names[3]}. Asteroid payout x${ASTEROID_COMP.mult[3]}.`
            : `Reforge ${ASTEROID_COMP.names[l]} to ${ASTEROID_COMP.names[l + 1]}. Asteroid payout x${ASTEROID_COMP.mult[l + 1]}.`,
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'moon', name: 'Moon', maxLevel: 1, section: 'MOON',
        costs: [8000],
        flavor: 'A pale companion, heavy enough to hold its own slow circle.',
        desc: () => 'Payout scales with its lunar phase, x0.75 to x1.25 of base. +200 base payout per orbit.',
        unlock: () => lvl('asteroid') >= 1,
    },
    {
        id: 'moonpay', name: 'Moon Payout', maxLevel: 5, section: 'MOON',
        costs: [8000, 18000, 36000, 70000, 120000],
        desc: () => '+200 to the moon’s base payout, per level.',
        unlock: () => lvl('moon') >= 1,
    },
    {
        id: 'moonspd', name: 'Moon Speed', maxLevel: 5, section: 'MOON',
        costs: [9000, 18000, 35000, 60000, 100000],
        mult: lvl => 1 + 0.2 * lvl,
        desc: () => '+20% moon orbit speed, per level.',
        unlock: () => lvl('moon') >= 1,
    },
    {
        id: 'moonphase', name: 'Lunar Phases', maxLevel: 5, section: 'MOON',
        costs: [12000, 28000, 55000, 90000, 140000],
        flavor: 'Learn the tides the moon answers to, and widen them.',

        desc: l => `Moon payout swings x${(0.75 + 0.10 * l).toFixed(2)} at the new moon to x${(1.25 + 0.10 * l).toFixed(2)} at the full moon. Each level adds +0.10 to both ends.`,
        unlock: () => lvl('moon') >= 1,
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 3, section: 'COMETS',
        costs: [30, 80, 200],
        bonus: lvl => 1 + 0.25 * lvl,
        desc: lvl => `Comet windfall x${(1 + 0.25 * lvl).toFixed(2)}.`,
        unlock: () => false,
    },
];

const SECTION_ORDER = ['MAIN', 'DUST PARTICLES', 'ASTEROID', 'MOON', 'COMETS'];
