'use strict';

const MOON_CYCLE  = 16;
const MOON_SHADOW = '#3b3f44';

function moonPhase() { return (G.gameTime % MOON_CYCLE) / MOON_CYCLE; }

function moonLit()   { return (1 - Math.cos(2*Math.PI*moonPhase())) / 2; }

function moonPhaseMult() { return (0.75 + 0.10 * lvl('moonphase')) + 0.50 * moonLit(); }

function newMoonBody() {
    return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0 };
}

function moonPayout()    { return Math.round((200 + 200 * lvl('moonpay')) * moonPhaseMult() * resonanceMult() * lunarFavorMult()); }

function moonAvgPayout() { return Math.round((200 + 200 * lvl('moonpay')) * (1 + 0.10 * lvl('moonphase')) * resonanceMult() * lunarFavorMult()); }

function moonSpeed()        { return 0.663 * upg('moonspd').mult(lvl('moonspd')); }
function moonOrbitsPerMin() { return 60 * moonSpeed() / PLANET_DEF[2].period; }

function moonStardustPerMin() { return moonAvgPayout() * moonOrbitsPerMin(); }

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
    rows: () =>
          tipRow('Phase',          moonPhaseName())
        + tipRow('Orbit payout',   '✦' + fmtNum(moonPayout()))
        + tipRow('Orbits / min',   fmtNice(moonOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(moonStardustPerMin()))),
    labels: {
        moon: 'Moon', moonpay: '+200 Payout', moonspd: '×1.2 Speed', moonphase: 'Lunar Phases',
    },
});
