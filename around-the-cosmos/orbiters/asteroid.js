'use strict';

const ASTEROID_COMP = {
    names:  ['Rock', 'Iron', 'Gold', 'Ice', 'Crystal', 'Diamond'],
    colors: ['#7a6a55', '#8c8f96', '#b8923a', '#a8c6d6', '#bda4dd', '#6fd0d8'],
    mult:   [1, 1.2, 1.4, 1.6, 1.8, 2.0],   // base ×1 → ×2.0 over 5 reforges (+0.2 each)
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

// ---- Asteroid identities (pick 2 of 5; group 'asteroid') ----
function rubblePileBonus()     { return 40 * lvl('rubblepile') * G.planets.length; }   // [SYN]  +/dust grain, folded into base payout
function ferroPulseBonus()     { return 15 * lvl('ferropulse'); }                       // [SYN][SCI]  flat +/pulse, added AFTER pulseValue in the pulse loop
function meteorShowerMult()    { return Math.pow(0.85, lvl('meteorshower')); }          // [SYN][EVT]  comet gap x (sooner); no orbit payout
function prospectorActive()    { return lvl('prospector') > 0; }                        // [SYN][SAC]  gives up Composition
function prospectorCometMult() { return 1 + 0.15 * lvl('prospector'); }                 // comet windfall x
function asteroidCompMult()    { return prospectorActive() ? 1 : ASTEROID_COMP.mult[lvl('astcomp')]; }

function asteroidPayout() { return Math.round((50 + 50 * lvl('astpay') + (typeof coagAsteroidBonus === 'function' ? coagAsteroidBonus() : 0) + rubblePileBonus()) * asteroidCompMult() * resonanceMult()); }
function asteroidColor()  { return ASTEROID_COMP.colors[lvl('astcomp')]; }
function asteroidBaseSpeed()      { return 0.88 * upg('astspd').mult(lvl('astspd')); }        // un-modulated (used for display + the observatory average)
function asteroidSpeed()          { return asteroidBaseSpeed() * slingSpeedMult(); }           // LIVE orbit speed - Slingshot winds it slow then whips it fast
function asteroidOrbitsPerMin()   { return 60 * asteroidBaseSpeed() / PLANET_DEF[1].period; }  // display uses the base (steady) speed
function asteroidStardustPerMin() { return asteroidPayout() * asteroidOrbitsPerMin(); }

// [SCI][DLY][EVT] Gravitational Slingshot: charges over SLING_ORBITS top-crosses, then dumps a payout
// burst and flags the whip visual. slingCharge/slingFrac drive the winding-up streak in render.js.
const SLING_ORBITS = 6;
let slingCharge = 0;
// continuous wind-up fraction 0..1 across SLING_ORBITS (whole orbits + progress through the current one)
function slingWindupFrac() {
    if (lvl('slingshot') <= 0) return 0;
    const c = G.asteroidClump;
    const orbFrac = c ? Math.max(0, Math.min(1, 1 - (c.nextTop - c.angle) / (Math.PI * 2))) : 0;
    return Math.min(1, (slingCharge + orbFrac) / SLING_ORBITS);
}
// real speed multiplier: slow while winding up (0.3x), whipping fast just before the slingshot (2.6x)
function slingSpeedMult() {
    if (lvl('slingshot') <= 0) return 1;
    const wf = slingWindupFrac();
    return 0.3 + 2.3 * wf * wf;
}
function slingshotFrac() { return slingWindupFrac(); }   // the trail intensity follows the same wind-up curve
function asteroidOnOrbit() {
    if (lvl('slingshot') <= 0) { slingCharge = 0; return; }
    slingCharge++;
    if (slingCharge >= SLING_ORBITS) {
        slingCharge = 0;
        const burst = Math.round(asteroidPayout() * (2 + lvl('slingshot')));   // x3..x5 of a normal payout
        const pos = asteroidClumpPos();
        earn(burst, pos.x, pos.y - 16);
        slingFlash = gameClock;                                                // whip FX (declared in render.js)
        SoundSystem.sfxOrbit();
    }
}

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
    avgSpeed: asteroidBaseSpeed,   // steady speed for the observatory/stats (Slingshot swings the live speed)
    onOrbit: asteroidOnOrbit,   // Gravitational Slingshot charge/burst

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
