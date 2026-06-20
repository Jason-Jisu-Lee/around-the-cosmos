'use strict';

// ── Dust Particle ────────────────────────────────────────────────────────────
// The starter orbiter: a clump of small grey pebbles on ring 0. The only orbiter
// with a COUNT upgrade (up to 4 bodies, one per Dust Particle level).

// A dust particle: part of a clump that orbits Lacuna together. Each particle also
// circles its own little orbit within the clump (localPhase/localR/localSpin).
function newDustParticle() {
    const shape = [];
    for (let k = 0; k < 7; k++) shape.push(0.6 + Math.random()*0.8);
    return {
        localPhase: Math.random()*Math.PI*2,
        localR:     5 + Math.random()*7,   // inner-orbit radius within the clump (5–12px)
        localSpin:  (Math.random()<0.5?-1:1) * (0.6 + Math.random()*0.8),
        pulse:0, shape,
    };
}

// Payout: base 10 per particle, +10 per Dust Particle Payout level (additive), × Resonance.
// Rounded so Resonance's ×1.25 / ×1.75 never leave a fractional payout.
function orbiterPayout() { return Math.round((10 + 10 * lvl('dustpay')) * resonanceMult()); }
// Speed: base factor 0.82 (base speed reduced 18% — max was too fast) × the upgrade
// multiplier (1+0.2·lvl), so effective speed runs 82% → 164%.
function dustSpeed()     { return 0.82 * upg('dustspd').mult(lvl('dustspd')); }
// Cosmic orbital velocity (ring 0 radius + Lacuna mass), scaled by speed.
function orbiterVel()           { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.orbitRadius) * dustSpeed(); }
function orbiterOrbitsPerHour() { return orbiterVel() / (2*Math.PI*PHYS.orbitRadius) * 3600; }

registerOrbiter({
    id: 'dust',
    title: 'Dust Particle',
    desc: "The first speck stubborn enough to answer the Lacuna's pull, tracing patient circles and paying a little stardust each time it passes.",
    ring: 0,
    hoverR: 35,
    color:    () => '#8a8782',
    pebbleR:  () => PLANET_DEF[0].radius/3 + 2,
    list:     () => G.planets,
    clump:    () => G.clump,
    clumpPos: () => clumpPos(),
    make:     () => newDustParticle(),
    count:    () => Math.min(5, lvl('dust')),    // rebuilt from level on load
    bodyUpgrade: 'dust',                          // buying this id adds a body
    payout: orbiterPayout,
    speed:  dustSpeed,
    rows: () =>
          tipRow('Orbit payout',  '✦' + fmtNum(G.planets.length * orbiterPayout()))   // whole clump
        + tipRow('Orbital speed', fmtNice(orbiterVel()) + ' m/s')
        + tipRow('Orbits / hour', fmtNice(orbiterOrbitsPerHour())),
    labels: { dust: '+1 Dust Particle', dustpay: '×2 Payout', dustspd: '×1.2 Speed' },
});
