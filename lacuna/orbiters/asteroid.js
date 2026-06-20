'use strict';

// ── Asteroid ─────────────────────────────────────────────────────────────────
// A single bigger, slower body on ring 1, surrounded by drifting dust motes. Not
// a count upgrade — there's only ever one. Its unique upgrade is Composition,
// which recolors it and multiplies its payout.

// Composition tiers — the asteroid's unique upgrade. Each tier recolors the body
// and multiplies its payout (denser/richer material = more stardust).
const ASTEROID_COMP = {
    names:  ['Rock', 'Iron', 'Gold', 'Ice'],
    colors: ['#7a6a55', '#8c8f96', '#b8923a', '#a8c6d6'], // Rock keeps the original color
    mult:   [1, 1.2, 1.4, 1.6],                            // payout × per tier (gentle, +0.2 steps)
};

// An asteroid body. `motes` are tiny specks that constantly drift around it.
function newAsteroidBody() {
    const shape = [];
    for (let k = 0; k < 8; k++) shape.push(0.6 + Math.random()*0.8);
    const motes = [];
    for (let m = 0; m < 6; m++) motes.push({
        dist:  1.4 + Math.random()*1.4,                     // × pebble radius from its center
        phase: Math.random()*Math.PI*2,
        spin:  (Math.random()<0.5?-1:1) * (0.5 + Math.random()*1.1),
        size:  0.6 + Math.random()*0.9,                     // much smaller than a dust orbiter
    });
    return {
        localPhase: Math.random()*Math.PI*2,
        localR:     8 + Math.random()*8,   // inner-orbit radius within the clump (8–16px)
        localSpin:  (Math.random()<0.5?-1:1) * (0.5 + Math.random()*0.7),
        pulse:0, shape, motes,
    };
}

// Payout: base 50, +50 per Asteroid Payout level (additive), then × the Composition tier.
function asteroidPayout() { return (50 + 50 * lvl('astpay')) * ASTEROID_COMP.mult[lvl('astcomp')]; }
function asteroidColor()  { return ASTEROID_COMP.colors[lvl('astcomp')]; }
function asteroidSpeed()  { return upg('astspd').mult(lvl('astspd')); }
function asteroidVel()           { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.asteroidOrbitRadius) * asteroidSpeed(); }
function asteroidOrbitsPerHour() { return asteroidVel() / (2*Math.PI*PHYS.asteroidOrbitRadius) * 3600; }

registerOrbiter({
    id: 'asteroid',
    title: 'Asteroid',
    desc: 'A wandering chunk of old rock, heavier and slower than the dust, but paying out far more each time it lumbers past.',
    ring: 1,
    hoverR: 40,
    color:    () => asteroidColor(),
    pebbleR:  () => (PLANET_DEF[1].radius/3 + 4) * 1.5,   // 50% bigger than the original asteroid
    list:     () => G.asteroids,
    clump:    () => G.asteroidClump,
    clumpPos: () => asteroidClumpPos(),
    make:     () => newAsteroidBody(),
    count:    () => (lvl('asteroid') >= 1 ? 1 : 0),       // single body
    bodyUpgrade: 'asteroid',
    payout: asteroidPayout,
    speed:  asteroidSpeed,
    rows: () =>
          tipRow('Composition',   ASTEROID_COMP.names[lvl('astcomp')])
        + tipRow('Orbit payout',  '✦' + fmtNum(asteroidPayout()))
        + tipRow('Orbital speed', fmtNice(asteroidVel()) + ' m/s')
        + tipRow('Orbits / hour', fmtNice(asteroidOrbitsPerHour())),
    labels: {
        asteroid: 'Asteroid', astpay: '×2 Payout', astspd: '×1.2 Speed',
        astcomp: () => ASTEROID_COMP.names[lvl('astcomp')],   // composition: new tier name
    },
});
