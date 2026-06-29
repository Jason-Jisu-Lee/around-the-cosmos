'use strict';

function newDustParticle() {
    const shape = [];
    for (let k = 0; k < 7; k++) shape.push(0.6 + Math.random()*0.8);
    return {
        localPhase: Math.random()*Math.PI*2,
        localR:     5 + Math.random()*7,
        localSpin:  (Math.random()<0.5?-1:1) * (0.6 + Math.random()*0.8),
        pulse:0, shape,
    };
}

function orbiterPayout() { return Math.round((10 + 10 * lvl('dustpay') + denseDustBonus()) * resonanceMult()); }
function dustSpeed()     { return 0.82 * upg('dustspd').mult(lvl('dustspd')); }
function orbiterOrbitsPerMin()  { return 60 * dustSpeed() / PLANET_DEF[0].period; }
function dustStardustPerMin()   { return G.planets.length * orbiterPayout() * orbiterOrbitsPerMin(); }

registerOrbiter({
    id: 'dust',
    title: 'Dust Particle',
    desc: "A lone grain of dust drawn into Maw's orbit, tracing patient circles and shedding a little stardust each time it passes.",
    ring: 0,
    hoverR: 35,
    color:    () => '#8a8782',
    pebbleR:  () => PLANET_DEF[0].radius/3 + 2,
    list:     () => G.planets,
    clump:    () => G.clump,
    clumpPos: () => clumpPos(),
    make:     () => newDustParticle(),
    count:    () => Math.min(5, (lvl('dust') >= 1 ? 1 : 0) + lvl('dustcount')),
    bodyUpgrade: 'dust',
    payout: orbiterPayout,
    speed:  dustSpeed,
    rows: () =>
          tipRow('Orbit payout',  '✦' + fmtNum(G.planets.length * orbiterPayout()))
        + tipRow('Orbits / min', fmtNice(orbiterOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(dustStardustPerMin()))),
    labels: { dust: 'Dust Particle', dustcount: '+1 Dust Particle', dustpay: '+10 Payout', dustspd: '×1.2 Speed' },
});
