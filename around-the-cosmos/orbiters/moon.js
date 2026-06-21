'use strict';

// ── Moon ─────────────────────────────────────────────────────────────────────
// The next tier after the asteroid: a single large, slow, pale body sitting right
// ON the widest orbit line (ring 2) — it does NOT drift around within a clump like
// the dust/asteroid pebbles. Like the asteroid it is NOT a count upgrade.
//
// Its unique upgrade is LUNAR PHASES: the moon visibly waxes and wanes over time
// (a terminator shadow sweeps across it). Once Lunar Phases is bought, payout rides
// that cycle — fuller moons pay a bonus, peaking at the full moon. The bonus is
// pure upside (×1 at new moon → higher at full), so the cycle never penalizes.

const MOON_CYCLE  = 24;          // seconds for a full new→full→new lunar cycle
const MOON_SHADOW = '#3b3f44';   // unlit (shadowed) side of the moon

// Phase 0..1 around the cycle (0/1 = new moon, 0.5 = full moon).
function moonPhase() { return (G.gameTime % MOON_CYCLE) / MOON_CYCLE; }
// Illuminated fraction of the disc: 0 at new moon → 1 at full moon.
function moonLit()   { return (1 - Math.cos(2*Math.PI*moonPhase())) / 2; }
// Lunar Phases payout factor: ×1 at new moon, up to ×(1 + 0.25·lvl) at full moon.
// Level 0 (upgrade not bought) → always ×1, so the visual cycle is purely cosmetic until then.
function moonPhaseMult() { return 1 + 0.25 * lvl('moonphase') * moonLit(); }

// A moon body. localR 0 → it sits exactly on the orbit line (no local wobble).
function newMoonBody() {
    return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0 };
}

// Payout: base 200, +200 per Moon Payout level (additive), × Lunar Phases factor, × Resonance.
// Rounded so the fractional multipliers never leave a fractional payout.
function moonPayout() { return Math.round((200 + 200 * lvl('moonpay')) * moonPhaseMult() * resonanceMult()); }
// Average payout over a full lunar cycle (mean litFraction = 0.5) — used by the observatory so
// the displayed stats don't fluctuate with the phase, while actual orbit-cross earnings stay live.
function moonAvgPayout() { return Math.round((200 + 200 * lvl('moonpay')) * (1 + 0.25 * lvl('moonphase') * 0.5) * resonanceMult()); }
// Physical body (a SMALL moon — see PHYS.moonRadius). Mirrors the Lacuna physics so
// the info card reads as a real, if little, world. Sphere mass = 4/3 π r³ ρ.
function moonBodyMass()  { return (4 / 3) * Math.PI * PHYS.moonRadius ** 3 * PHYS.moonDensity; }
function moonGravity()   { return PHYS.G * moonBodyMass() / PHYS.moonRadius ** 2; }

// Base factor 0.78 (the slowest orbiter — heaviest, widest orbit) × upgrade mult → 78% → 156%.
function moonSpeed()  { return 0.78 * upg('moonspd').mult(lvl('moonspd')); }
function moonVel()           { return Math.sqrt(PHYS.G * lacunaMass() / PHYS.moonOrbitRadius) * moonSpeed(); }
function moonOrbitsPerHour() { return moonVel() / (2*Math.PI*PHYS.moonOrbitRadius) * 3600; }

// Phase name for the info card.
function moonPhaseName() {
    const p = moonPhase();
    const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
    return names[Math.round(p * 8) % 8];
}

registerOrbiter({
    id: 'moon',
    title: 'Moon',
    desc: 'A small moon — pale and patient, lesser than the dwarf worlds still to come, yet heavy enough to hold its own slow circle: the widest, calmest orbit yet, waxing and waning as it goes, richest of all at the full moon.',
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
          tipRow('Class',          'Small moon')
        + tipRow('Diameter',       fmtNice(2 * PHYS.moonRadius / 1000) + ' km')
        + tipRow('Mass',           fmtSci(moonBodyMass()) + ' kg')
        + tipRow('Surface gravity', fmtNice(moonGravity() / 9.81 * 100) + '% of Earth')
        + tipRow('Phase',          moonPhaseName())
        + tipRow('Orbit payout',   '✦' + fmtNum(moonPayout()))
        + tipRow('Orbits / hour',  fmtNice(moonOrbitsPerHour())),
    labels: {
        moon: 'Moon', moonpay: '+200 Payout', moonspd: '×1.2 Speed', moonphase: 'Lunar Phases',
    },
});
