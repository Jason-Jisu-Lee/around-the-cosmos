'use strict';

const MOON_CYCLE = 16;

function moonPhase() { return (G.gameTime % MOON_CYCLE) / MOON_CYCLE; }
function moonLit()   { return (1 - Math.cos(2*Math.PI*moonPhase())) / 2; }
// Blood Moon (identity) lowers the new-moon floor toward 0 and widens the full-moon swing toward x2.
// The terms cancel in the phase average, so moonAvgPayout stays (1 + 0.10*moonphase): swing only, not average.
function moonPhaseMult() {
    const bm = lvl('bloodmoon');
    const floor = Math.max(0, 0.75 + 0.10 * lvl('moonphase') - 0.15 * bm);
    const swing = 0.50 + 0.30 * bm;
    return floor + swing * moonLit();
}
// ---- Moon identities (pick 2 of 5; group 'moon') ----
function albedoMult()      { return 1 + 0.10 * lvl('albedo'); }               // plain x payout (both live + avg)
function springTideBonus() { return 20 * lvl('springtide') * moonLit(); }     // [SYN][DLY] +/pulse, strongest at the full moon, added in the pulse loop

function newMoonBody() {
    return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0 };
}

function moonIceBonus()  { return typeof iceMoonBonus === 'function' ? iceMoonBonus() : 0; }   // Ice Mantles (dust identity) feeds the moon
function moonPayout()    { return Math.round((200 + 200 * lvl('moonpay') + moonIceBonus()) * moonPhaseMult() * resonanceMult() * lunarFavorMult() * albedoMult()); }
function moonAvgPayout() { return Math.round((200 + 200 * lvl('moonpay') + moonIceBonus()) * (1 + 0.10 * lvl('moonphase')) * resonanceMult() * lunarFavorMult() * albedoMult()); }
function moonSpeed()        { return 0.663 * upg('moonspd').mult(lvl('moonspd')); }
function moonOrbitsPerMin() { return 60 * moonSpeed() / PLANET_DEF[2].period; }
function moonStardustPerMin() { return moonAvgPayout() * moonOrbitsPerMin(); }

// [SYN][SCI][EVT] Solar Eclipse + [DLY][EVT] Lunar Standstill: both counted on the moon's top-crosses.
const STANDSTILL_ORBITS = 16;   // fixed: the moon reaches a standstill and pays a x40 burst every 16 orbits
let eclipseCount = 0, standstillCount = 0;
function standstillFrac()       { return lvl('standstill') > 0 ? Math.min(1, standstillCount / STANDSTILL_ORBITS) : 0; }
function standstillOrbitsLeft() { return Math.max(0, STANDSTILL_ORBITS - standstillCount); }   // live tally for the upgrade description
function moonOnOrbit() {
    if (lvl('eclipse') > 0) {
        if (++eclipseCount >= 6 - lvl('eclipse')) {                            // every 5..3 orbits
            eclipseCount = 0;
            const pos = moonClumpPos();
            earn(Math.round(moonAvgPayout() * 10), pos.x, pos.y - 16);         // x10 burst (sound-only cue)
            eclipseFlash = gameClock;
            SoundSystem.sfxComet();
        }
    } else eclipseCount = 0;
    if (lvl('standstill') > 0) {
        if (++standstillCount >= STANDSTILL_ORBITS) {                          // every 16 orbits
            standstillCount = 0;
            const pos = moonClumpPos();
            earn(Math.round(moonAvgPayout() * 40), pos.x, pos.y - 16);         // x40 burst, once
            standstillFlash = gameClock;
            SoundSystem.sfxComet();
        }
    } else standstillCount = 0;
}

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
    round:    true,
    color:    () => '#8f9498',
    pebbleR:  () => (PLANET_DEF[2].radius/3 + 6) * 1.8,
    list:     () => G.moons,
    clump:    () => G.moonClump,
    clumpPos: () => moonClumpPos(),
    make:     () => newMoonBody(),
    count:    () => (lvl('moon') >= 1 ? 1 : 0),
    bodyUpgrade: 'moon',
    payout:    moonPayout,
    avgPayout: moonAvgPayout,
    speed:     moonSpeed,
    onOrbit:   moonOnOrbit,   // Solar Eclipse + Lunar Standstill bursts

    rows: () =>
          tipRow('Phase',          moonPhaseName())
        + tipRow('Orbit payout',   '✦' + fmtNum(moonPayout()))
        + tipRow('Orbits / min',   fmtNice(moonOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(moonStardustPerMin()))),
    labels: {
        moon: 'Moon', moonpay: '+200 Payout', moonspd: '×1.2 Speed', moonphase: 'Lunar Phases',
    },
});
