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

// ---- Dust identities (mutually exclusive, one per universe; chosen in the DUST PARTICLES section) ----
function dustCount() { return G.planets.length; }
// Coagulation: each grain pays more the more grains there are; also feeds the Asteroid.
function coagDustBonus()     { return lvl('coagulation') ? 5  * dustCount() : 0; }   // per particle
function coagAsteroidBonus() { return lvl('coagulation') ? 40 * dustCount() : 0; }
// Ice Mantles: flat dust payout; also feeds the Moon (+ frost-rim visual on the grains).
function iceDustBonus()  { return lvl('iceMantles') ? 25  : 0; }   // per particle
function iceMoonBonus()  { return lvl('iceMantles') ? 200 : 0; }
// Radiation Tails: small flat dust payout; also feeds the Dwarf Planet (+ comet-tail visual on the grains).
function radDustBonus()  { return lvl('radTails') ? 15  : 0; }    // per particle
function radDwarfBonus() { return lvl('radTails') ? 500 : 0; }
function dustIdentityPayBonus() { return coagDustBonus() + iceDustBonus() + radDustBonus(); }

function orbiterPayout() { return Math.round((10 + 10 * lvl('dustpay') + denseDustBonus() + dustIdentityPayBonus()) * resonanceMult()); }
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
