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

// ---- Dust identities (pick 2 of 5; group 'dust'; chosen in the DUST PARTICLES section) ----
// Coagulation: flat +dust payout per grain, also feeds the Asteroid.
function coagDustBonus()     { return 15 * lvl('coagulation'); }   // per particle (max 75)
function coagAsteroidBonus() { return 50 * lvl('coagulation'); }   // (max 250)
// Ice Mantles: flat +dust payout per grain, also feeds the Moon (+ frost-rim visual on the grains).
function iceDustBonus()  { return 5   * lvl('iceMantles'); }   // per particle (max 25)
function iceMoonBonus()  { return 150 * lvl('iceMantles'); }   // (max 750)
function dustIdentityPayBonus() { return coagDustBonus() + iceDustBonus(); }

// Denser Grains (plain -> mult): x payout on the swarm; the grains read larger + darker (pebbleR/color below).
function denserGrainsMult() { return 1 + 0.15 * lvl('denser'); }
// Dust Devil [SCI][DLY]: payout winds up over ~10 min of universe time to +8%/lvl, resets each universe.
const DUST_DEVIL_TIME = 600;
function dustDevilFrac() { return lvl('dustdevil') > 0 ? Math.min(1, G.universeTime / DUST_DEVIL_TIME) : 0; }
function dustDevilMult() { return 1 + 0.08 * lvl('dustdevil') * dustDevilFrac(); }

function dustCount()     { return Math.min(5, (lvl('dust') >= 1 ? 1 : 0) + lvl('dustcount')); }
function orbiterPayout() { return Math.round((10 + 10 * lvl('dustpay') + denseDustBonus() + dustIdentityPayBonus()) * resonanceMult() * denserGrainsMult() * dustDevilMult()); }
function dustSpeed()     { return 0.82 * upg('dustspd').mult(lvl('dustspd')); }
function orbiterOrbitsPerMin()  { return 60 * dustSpeed() / PLANET_DEF[0].period; }
function dustStardustPerMin()   { return G.planets.length * orbiterPayout() * orbiterOrbitsPerMin(); }

// Poynting-Robertson Drag [SCI][SAC][DLY]: on an interval a grain spirals into Maw for a lump, then the
// swarm regrows it. The sacrifice is the temporarily-missing grain (less steady orbit payout).
let prTimer = 0, prMissing = 0;
const dustFallFx = [];   // visual grains spiraling into Maw {sx,sy,age,maxAge}
function dustOnTick(dt) {
    for (let i = dustFallFx.length - 1; i >= 0; i--) { dustFallFx[i].age += dt; if (dustFallFx[i].age >= dustFallFx[i].maxAge) dustFallFx.splice(i, 1); }
    if (lvl('prdrag') <= 0) { prMissing = 0; prTimer = 0; return; }
    prTimer += dt;
    if (prTimer >= 9 - 2 * lvl('prdrag')) {               // interval: 7s / 5s / 3s
        prTimer = 0;
        if (prMissing > 0) {                              // regrow the shed grain
            if (G.planets.length < dustCount()) G.planets.push(newDustParticle());
            prMissing = 0;
        } else if (G.planets.length > 1) {                // shed a grain into Maw for a lump
            const p = clumpPos();
            G.planets.pop();
            prMissing = 1;
            earn(Math.round(orbiterPayout() * (4 + 2 * lvl('prdrag'))), CX, CY - 20);
            dustFallFx.push({ sx: p.x, sy: p.y, age: 0, maxAge: 1.1 });
        }
    }
}

registerOrbiter({
    id: 'dust',
    title: 'Dust Particle',
    desc: "A lone grain of dust drawn into Maw's orbit, tracing patient circles and shedding a little stardust each time it passes.",
    ring: 0,
    hoverR: 35,
    color:    () => { const d = lvl('denser'); if (d <= 0) return '#8a8782'; const f = 1 - 0.09 * d, h = n => Math.round(n * f).toString(16).padStart(2, '0'); return '#' + h(138) + h(135) + h(130); },   // Denser Grains: darker
    pebbleR:  () => (PLANET_DEF[0].radius/3 + 2) * (1 + 0.06 * lvl('denser')),                                                                                                               // Denser Grains: larger
    list:     () => G.planets,
    clump:    () => G.clump,
    clumpPos: () => clumpPos(),
    make:     () => newDustParticle(),
    count:    () => Math.min(5, (lvl('dust') >= 1 ? 1 : 0) + lvl('dustcount')),
    bodyUpgrade: 'dust',
    payout: orbiterPayout,
    speed:  dustSpeed,
    onTick: dustOnTick,   // Poynting-Robertson Drag: shed/regrow grains + fall FX
    rows: () =>
          tipRow('Orbit payout',  '✦' + fmtNum(G.planets.length * orbiterPayout()))
        + tipRow('Orbits / min', fmtNice(orbiterOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(dustStardustPerMin()))),
    labels: { dust: 'Dust Particle', dustcount: '+1 Dust Particle', dustpay: '+10 Payout', dustspd: '×1.2 Speed' },
});
