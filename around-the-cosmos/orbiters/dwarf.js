'use strict';

// Dwarf Planet ("Ember"): the slowest orbiter, on the widest ring (3), with the biggest single payout.
// CONSTANT speed = the Moon's speed at speed-upgrade level 1 (0.663 × 1.2 = 0.7956). No speed/count upgrade.
// Three unique upgrades: Compounding Orbit, Trojan Companions, Conjunction.
const DWARF_SPEED = 0.663 * 1.2;          // 0.7956, fixed for the life of the body
const DWARF_TROJAN_OFF = [Math.PI / 3, -Math.PI / 3];   // L4 / L5 Lagrange points (±60°)

const _TAU = Math.PI * 2, _TOP = 3 * Math.PI / 2;
function _wrap(a) { a %= _TAU; return a < 0 ? a + _TAU : a; }
// did a body moving forward cross `mark` between prev->cur (small step)?  distance-past-mark wraps TAU->0.
function _crossedMark(prev, cur, mark) { return _wrap(cur - mark) < _wrap(prev - mark); }

function newDwarfBody() { return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0, troj: [0, 0] }; }

// ---- Conjunction: each level adds +700 to the Dwarf's BASE payout and +150 to the Moon's (read by both payouts) ----
function conjunctionBonus()     { return 700 * lvl('dwarfconj'); }    // -> Dwarf base
function conjunctionMoonBonus() { return 150 * lvl('dwarfconj'); }    // -> Moon base (smaller; the moon's own scale is only +200/lvl)

// ---- Compounding Orbit: payout ramps +0.3%/orbit, capped by level, resets each universe (G.dwarfOrbits) ----
function dwarfCompoundCap()  { return [0, 0.15, 0.30, 0.50][lvl('dwarfcompound')] || 0; }
function dwarfCompoundMult() { return lvl('dwarfcompound') ? 1 + Math.min(dwarfCompoundCap(), 0.003 * G.dwarfOrbits) : 1; }

// ---- payout ----
function dwarfBasePayout()    { return Math.round((800 + 800 * lvl('dwarfpay') + conjunctionBonus()) * resonanceMult()); }
function dwarfPayout()        { return Math.round(dwarfBasePayout() * dwarfCompoundMult()); }   // the dwarf body's own per-orbit payout
function dwarfTrojanCount()   { return Math.min(2, lvl('dwarftrojan')); }
function dwarfTrojanPayout()  { return Math.round(dwarfPayout() / 8); }
// the DISPLAYED dwarf payout folds the Trojan companions in - they pay on their own passes, but read as the dwarf's combined income
function dwarfAvgPayout()     { return dwarfPayout() + dwarfTrojanCount() * dwarfTrojanPayout(); }
function dwarfSpeed()         { return DWARF_SPEED; }
function dwarfOrbitsPerMin()  { return 60 * dwarfSpeed() / PLANET_DEF[3].period; }
function dwarfStardustPerMin(){ return dwarfAvgPayout() * dwarfOrbitsPerMin(); }

// ---- per-orbit + per-tick hooks (called from simulation.js tick) ----
function dwarfOnOrbit() { G.dwarfOrbits++; }   // count this universe's dwarf laps -> Compounding ramp

function dwarfOnTick(dt) {
    const b = G.dwarfs[0];
    if (!b) { dwarfOnTick._prev = null; return; }
    const cur = G.dwarfClump.angle;
    if (dwarfOnTick._prev == null) dwarfOnTick._prev = cur;
    const prev = dwarfOnTick._prev;
    // forward step this tick (handles the 2π wrap as a tiny step); a big value = universe reset / frame hitch -> skip detection
    const small = _wrap(cur - prev) < 0.5;

    // Trojan Companions: companions ride ±60°, each paying 1/8 the dwarf payout on its own top-cross (spread payouts)
    const tc = dwarfTrojanCount();
    for (let i = 0; i < 2; i++) {
        if (small && i < tc && _crossedMark(prev + DWARF_TROJAN_OFF[i], cur + DWARF_TROJAN_OFF[i], _TOP)) {
            const ang = cur + DWARF_TROJAN_OFF[i], r = orbitR(3);
            earn(dwarfTrojanPayout(), CX + Math.cos(ang) * r, CY + Math.sin(ang) * r - 12);
            G.orbitsCompleted++;
            b.troj[i] = 1;
            SoundSystem.sfxOrbit();
        }
        if (b.troj[i] > 0) b.troj[i] = Math.max(0, b.troj[i] - dt * 2.2);
    }

    dwarfOnTick._prev = cur;
}

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
    avgPayout: dwarfAvgPayout,
    speed:     dwarfSpeed,
    onOrbit:   dwarfOnOrbit,
    onTick:    dwarfOnTick,
    rows: () => {
        let s = tipRow('Orbit payout',   '✦' + fmtNum(dwarfAvgPayout()))
              + tipRow('Orbits / min',   fmtNice(dwarfOrbitsPerMin()))
              + tipRow('Stardust / min', '✦' + fmtNum(Math.round(dwarfStardustPerMin())));
        if (lvl('dwarfcompound') > 0) {
            const pct = Math.round(Math.min(dwarfCompoundCap(), 0.003 * G.dwarfOrbits) * 100);
            s += tipRow('Compounding', '+' + pct + '% / +' + Math.round(dwarfCompoundCap() * 100) + '% cap');
        }
        if (lvl('dwarftrojan') > 0) s += tipRow('Trojans', dwarfTrojanCount() + ' × ✦' + fmtNum(dwarfTrojanPayout()));
        return s;
    },
    labels: {
        dwarf: 'Dwarf Planet', dwarfpay: '+800 Payout',
        dwarftrojan: 'Trojan Companions', dwarfconj: 'Conjunction', dwarfcompound: 'Compounding Orbit',
    },
});
