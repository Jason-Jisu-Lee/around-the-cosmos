'use strict';

// ─── Orbiter components ──────────────────────────────────────────────────────
// One entry per orbiter type in ORBITERS below. Each bundles the orbiter's name,
// its flavor **description (EDIT HERE)**, its payout/speed math, and how its info
// card reads. Keeping every orbiter self-contained here is what stops state.js /
// game.js from bloating. To add an orbiter: add its upgrades in config.js, a
// factory in state.js, render it in render.js, and add one entry here.

// Shared helper: one label/value row in a cosmic info card.
function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }

// ---- Payout / speed accessors ----
// Every dust particle pays a flat 20, doubled by Dust Particle Payout.
function orbiterPayout()  { return 20 * upg('dustpay').mult(lvl('dustpay')); }
// The asteroid pays a flat 80, doubled by Asteroid Payout and scaled by Composition tier.
function asteroidPayout() { return 80 * upg('astpay').mult(lvl('astpay')) * ASTEROID_COMP.mult[lvl('astcomp')]; }
function asteroidColor()  { return ASTEROID_COMP.colors[lvl('astcomp')]; }

// Dust speed: the upgrade runs 100%→200% (mult=1+0.2·lvl); a flat ×1.2 base bump multiplies it.
function dustSpeed()      { return 1.2 * upg('dustspd').mult(lvl('dustspd')); }
// Asteroid speed: base 100%, +20% per Speed level (additive), max 200%.
function asteroidSpeed()  { return upg('astspd').mult(lvl('astspd')); }

// ---- Cosmic orbital velocities (derive from the Lacuna's mass + each ring radius) ----
function orbiterVel()            { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.orbitRadius) * dustSpeed(); }
function orbiterOrbitsPerHour()  { return orbiterVel() / (2*Math.PI*PHYS.orbitRadius) * 3600; }
function asteroidVel()           { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.asteroidOrbitRadius) * asteroidSpeed(); }
function asteroidOrbitsPerHour() { return asteroidVel() / (2*Math.PI*PHYS.asteroidOrbitRadius) * 3600; }

// ---- The registry ----
const ORBITERS = [
    {
        id: 'dust',
        title: 'Dust Particle',
        desc: "The first speck stubborn enough to answer the Lacuna's pull, tracing patient circles and paying a little stardust each time it passes.",
        list:     () => G.planets,
        clumpPos: () => clumpPos(),
        hoverR:   35,
        rows: () =>
              tipRow('Orbit payout',  '✦' + fmtNum(orbiterPayout()))
            + tipRow('Orbital speed', fmtNice(orbiterVel()) + ' m/s')
            + tipRow('Orbits / hour', fmtNice(orbiterOrbitsPerHour())),
    },
    {
        id: 'asteroid',
        title: 'Asteroid',
        desc: 'A wandering chunk of old rock, heavier and slower than the dust, but paying out far more each time it lumbers past.',
        list:     () => G.asteroids,
        clumpPos: () => asteroidClumpPos(),
        hoverR:   40,
        rows: () =>
              tipRow('Composition',   ASTEROID_COMP.names[lvl('astcomp')])
            + tipRow('Orbit payout',  '✦' + fmtNum(asteroidPayout()))
            + tipRow('Orbital speed', fmtNice(asteroidVel()) + ' m/s')
            + tipRow('Orbits / hour', fmtNice(asteroidOrbitsPerHour())),
    },
];
const ORBITER_BY_ID = {};
for (const o of ORBITERS) ORBITER_BY_ID[o.id] = o;
