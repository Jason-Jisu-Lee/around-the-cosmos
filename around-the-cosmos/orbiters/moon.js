'use strict';

// ── Moon ─────────────────────────────────────────────────────────────────────
// The next tier after the asteroid: a single large, slow, pale body sitting right
// ON the widest orbit line (ring 2). It does NOT drift within a clump like the
// dust/asteroid pebbles, and is NOT a count upgrade.
//
// Its payout swings with the lunar phase: by default x0.75 at the new moon up to
// x1.25 at the full moon. Its unique upgrade LUNAR PHASES (moonphase, 5 levels)
// shifts that whole range up by x0.10 on BOTH ends per level (lvl 5 -> x1.25..x1.75).

const MOON_CYCLE  = 19.2;        // seconds for a full new->full->new lunar cycle (25% faster than 24s)
const MOON_SHADOW = '#3b3f44';   // unlit (shadowed) side of the moon

// Phase 0..1 around the cycle (0/1 = new moon, 0.5 = full moon).
function moonPhase() { return (G.gameTime % MOON_CYCLE) / MOON_CYCLE; }
// Illuminated fraction of the disc: 0 at new moon, 1 at full moon.
function moonLit()   { return (1 - Math.cos(2*Math.PI*moonPhase())) / 2; }
// Phase payout factor. Range is [0.75, 1.25] by default; Lunar Phases adds +0.10 to
// both ends per level. mult = (0.75 + 0.10*lvl) + 0.50*moonLit().
function moonPhaseMult() { return (0.75 + 0.10 * lvl('moonphase')) + 0.50 * moonLit(); }

// A moon body. localR 0 -> it sits exactly on the orbit line (no local wobble).
function newMoonBody() {
    return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0 };
}

// Payout: base 200 (+200 per Moon Payout level), x phase factor, x Resonance. Rounded.
function moonPayout()    { return Math.round((200 + 200 * lvl('moonpay')) * moonPhaseMult() * resonanceMult()); }
// Phase-averaged payout (mean moonLit = 0.5 -> mean mult = 1 + 0.10*lvl) so displayed
// stats don't fluctuate with the phase, while actual orbit-cross earnings stay live.
function moonAvgPayout() { return Math.round((200 + 200 * lvl('moonpay')) * (1 + 0.10 * lvl('moonphase')) * resonanceMult()); }

// Base factor 0.663 (slowed 15% from 0.78; the slowest orbiter) x upgrade mult.
function moonSpeed()        { return 0.663 * upg('moonspd').mult(lvl('moonspd')); }
function moonVel()          { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.moonOrbitRadius) * moonSpeed(); }
function moonOrbitsPerMin() { return 60 * moonSpeed() / PLANET_DEF[2].period; }   // in-game orbit cadence
// Stardust per minute = average payout x orbits per minute.
function moonStardustPerMin() { return moonAvgPayout() * moonOrbitsPerMin(); }

// Phase name for the info card.
function moonPhaseName() {
    const p = moonPhase();
    const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
    return names[Math.round(p * 8) % 8];
}

registerOrbiter({
    id: 'moon',
    title: 'Moon',
    desc: 'A small moon, pale and patient, lesser than the dwarf worlds still to come, yet heavy enough to hold its own slow circle: the widest, calmest orbit yet. Its payout waxes and wanes with its phase, paying most of all at the full moon.',
    ring: 2,
    hoverR: 46,
    round:    true,                                       // drawn as a phased disc, not a pebble clump
    color:    () => '#8f9498',
    pebbleR:  () => (PLANET_DEF[2].radius/3 + 6) * 1.8,   // larger than the asteroid
    list:     () => G.moons,
    clump:    () => G.moonClump,
    clumpPos: () => moonClumpPos(),
    make:     () => newMoonBody(),
    count:    () => (lvl('moon') >= 1 ? 1 : 0),           // single body
    bodyUpgrade: 'moon',
    payout:    moonPayout,
    avgPayout: moonAvgPayout,   // observatory uses this (phase-averaged) so stats don't flicker
    speed:     moonSpeed,
    rows: () =>
          tipRow('Phase',          moonPhaseName())
        + tipRow('Orbit payout',   '✦' + fmtNum(moonPayout()))
        + tipRow('Orbits / min',   fmtNice(moonOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(moonStardustPerMin()))),
    labels: {
        moon: 'Moon', moonpay: '+200 Payout', moonspd: '×1.2 Speed', moonphase: 'Lunar Phases',
    },
});
