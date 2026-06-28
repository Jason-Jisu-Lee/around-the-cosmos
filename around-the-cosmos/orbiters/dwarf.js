'use strict';

// Dwarf Planet ("Ember"): the slowest orbiter, on the widest ring (ring 3), with the biggest single payout.
// CONSTANT speed = the Moon's speed at speed-upgrade level 1 (0.663 × 1.2 = 0.7956). No speed or count upgrades.
const DWARF_SPEED = 0.663 * 1.2;   // 0.7956, fixed for the life of the body

function newDwarfBody() { return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0 }; }

function dwarfPayout()        { return Math.round((1500 + 1500 * lvl('dwarfpay')) * resonanceMult()); }
function dwarfSpeed()         { return DWARF_SPEED; }
function dwarfOrbitsPerMin()  { return 60 * dwarfSpeed() / PLANET_DEF[3].period; }
function dwarfStardustPerMin(){ return dwarfPayout() * dwarfOrbitsPerMin(); }

registerOrbiter({
    id: 'dwarf',
    title: 'Dwarf Planet',
    desc: 'The slowest of your worlds: a banded ember on the widest, calmest ring. It keeps one steady pace and never hurries, yet each long pass pays more than any other body.',
    ring: 3,
    hoverR: 52,
    sphere:   true,            // custom Ember-sphere render (drawDwarfClump in render.js)
    color:    () => '#b08a5a',
    pebbleR:  () => (PLANET_DEF[3].radius/3 + 7) * 1.8,
    list:     () => G.dwarfs,
    clump:    () => G.dwarfClump,
    clumpPos: () => dwarfClumpPos(),
    make:     () => newDwarfBody(),
    count:    () => (lvl('dwarf') >= 1 ? 1 : 0),
    bodyUpgrade: 'dwarf',
    payout:    dwarfPayout,
    speed:     dwarfSpeed,
    rows: () =>
          tipRow('Orbit payout',   '✦' + fmtNum(dwarfPayout()))
        + tipRow('Orbits / min',   fmtNice(dwarfOrbitsPerMin()))
        + tipRow('Stardust / min', '✦' + fmtNum(Math.round(dwarfStardustPerMin()))),
    labels: {
        dwarf: 'Dwarf Planet', dwarfpay: '+1500 Payout',
    },
});
