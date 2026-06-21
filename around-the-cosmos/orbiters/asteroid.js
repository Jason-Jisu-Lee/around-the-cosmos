'use strict';




const ASTEROID_COMP = {
    names:  ['Rock', 'Iron', 'Gold', 'Ice'],
    colors: ['#7a6a55', '#8c8f96', '#b8923a', '#a8c6d6'],
    mult:   [1, 1.25, 1.5, 1.75],
};


const ASTEROID_SHAPE = [1.20, 1.04, 0.82, 0.92, 1.14, 1.06, 0.80, 0.96, 1.10, 0.86, 1.00, 0.90];


function newAsteroidBody() {
    const shape = ASTEROID_SHAPE.slice();
    const motes = [];
    for (let m = 0; m < 6; m++) motes.push({
        dist:  1.4 + Math.random()*1.4,
        phase: Math.random()*Math.PI*2,
        spin:  (Math.random()<0.5?-1:1) * (0.5 + Math.random()*1.1),
        size:  0.6 + Math.random()*0.9,
    });
    return {
        localPhase: Math.random()*Math.PI*2,
        localR:     8 + Math.random()*8,
        localSpin:  (Math.random()<0.5?-1:1) * (0.5 + Math.random()*0.7),
        pulse:0, shape, motes,
    };
}


function asteroidPayout() { return Math.round((50 + 50 * lvl('astpay')) * ASTEROID_COMP.mult[lvl('astcomp')] * resonanceMult()); }
function asteroidColor()  { return ASTEROID_COMP.colors[lvl('astcomp')]; }

function asteroidSpeed()  { return 0.88 * upg('astspd').mult(lvl('astspd')); }
function asteroidOrbitsPerMin()  { return 60 * asteroidSpeed() / PLANET_DEF[1].period; }
function asteroidStardustPerMin() { return asteroidPayout() * asteroidOrbitsPerMin(); }

registerOrbiter({
    id: 'asteroid',
    title: 'Asteroid',
    desc: 'A wandering chunk of old rock, heavier and slower than the dust, but paying out far more each time it lumbers past.',
    ring: 1,
    hoverR: 40,
    color:    () => asteroidColor(),
    pebbleR:  () => (PLANET_DEF[1].radius/3 + 4) * 1.95,
    list:     () => G.asteroids,
    clump:    () => G.asteroidClump,
    clumpPos: () => asteroidClumpPos(),
    make:     () => newAsteroidBody(),
    count:    () => (lvl('asteroid') >= 1 ? 1 : 0),
    bodyUpgrade: 'asteroid',
    payout: asteroidPayout,
    speed:  asteroidSpeed,
    rows: () =>
          tipRow('Composition',   ASTEROID_COMP.names[lvl('astcomp')])
        + tipRow('Orbit payout',  '✦' + fmtNum(asteroidPayout()))
        + tipRow('Orbits / min', fmtNice(asteroidOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(asteroidStardustPerMin()))),
    labels: {
        asteroid: 'Asteroid', astpay: '×2 Payout', astspd: '×1.2 Speed',
        astcomp: () => ASTEROID_COMP.names[lvl('astcomp')],
    },
});
