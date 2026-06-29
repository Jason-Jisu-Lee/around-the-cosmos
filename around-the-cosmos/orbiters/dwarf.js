'use strict';

// Dwarf Planet ("Ember"): the slowest orbiter, on the widest ring (3), with the biggest single payout.
// CONSTANT speed = the Moon's speed at speed-upgrade level 1 (0.663 × 1.2 = 0.7956). No speed/count upgrade.
// Three unique upgrades: Gravity Assist, Trojan Companions, Compounding Orbit.
const DWARF_SPEED = 0.663 * 1.2;          // 0.7956, fixed for the life of the body
const DWARF_TROJAN_OFF = [Math.PI / 3, -Math.PI / 3];   // L4 / L5 Lagrange points (±60°)
const DWARF_ASSIST_DUR = 6;               // seconds a gravity-assist buff rides a lapped orbiter

const _TAU = Math.PI * 2, _TOP = 3 * Math.PI / 2;
function _wrap(a) { a %= _TAU; return a < 0 ? a + _TAU : a; }
// did a body moving forward cross `mark` between prev->cur (small step)?  distance-past-mark wraps TAU->0.
function _crossedMark(prev, cur, mark) { return _wrap(cur - mark) < _wrap(prev - mark); }

function newDwarfBody() { return { localPhase: 0, localR: 0, localSpin: 0, pulse: 0, troj: [0, 0] }; }

// ---- Compounding Orbit (#9): payout ramps +0.3%/orbit, capped by level, resets each universe (G.dwarfOrbits) ----
function dwarfCompoundCap()  { return [0, 0.15, 0.30, 0.50][lvl('dwarfcompound')] || 0; }
function dwarfCompoundMult() { return lvl('dwarfcompound') ? 1 + Math.min(dwarfCompoundCap(), 0.003 * G.dwarfOrbits) : 1; }

// ---- Gravity Assist (#1): a FASTER orbiter that laps the Dwarf gets +25%/lvl for DWARF_ASSIST_DUR seconds ----
const _dwarfAssistUntil = {};   // orbiter id -> gameClock expiry
const _dwarfLapPrev = {};       // orbiter id -> previous wrapped separation
function orbiterAssistMult(o) {
    if (!o || o.id === 'dwarf' || lvl('dwarfassist') < 1) return 1;
    const until = _dwarfAssistUntil[o.id] || 0;
    return (typeof gameClock !== 'undefined' && gameClock < until) ? 1 + 0.25 * lvl('dwarfassist') : 1;
}

// ---- payout ----
function dwarfBasePayout()    { return Math.round((1500 + 1500 * lvl('dwarfpay')) * resonanceMult()); }
function dwarfPayout()        { return Math.round(dwarfBasePayout() * dwarfCompoundMult()); }
function dwarfAvgPayout()     { return dwarfPayout(); }
function dwarfTrojanPayout()  { return Math.round(dwarfAvgPayout() / 3); }
function dwarfTrojanCount()   { return Math.min(2, lvl('dwarftrojan')); }
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

    // Trojan Companions: companions ride ±60°, each paying on its own top-cross (spread payouts)
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

    // Gravity Assist: detect a faster orbiter lapping the dwarf (its separation wraps TAU->0)
    if (small && lvl('dwarfassist') > 0 && typeof gameClock !== 'undefined') {
        const dwarfW = (_TAU / PLANET_DEF[3].period) * DWARF_SPEED;
        for (const o2 of ORBITERS) {
            if (o2.id === 'dwarf' || !o2.list().length) continue;
            const o2w = (_TAU / PLANET_DEF[o2.ring].period) * o2.speed();
            if (o2w <= dwarfW) continue;                         // only faster bodies can lap
            const sep = _wrap(o2.clump().angle - cur);
            const pv = _dwarfLapPrev[o2.id];
            if (pv != null && sep < pv && pv - sep > Math.PI) {   // wrapped past 0 = a lap
                _dwarfAssistUntil[o2.id] = gameClock + DWARF_ASSIST_DUR;
            }
            _dwarfLapPrev[o2.id] = sep;
        }
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
        let s = tipRow('Orbit payout',   '✦' + fmtNum(dwarfPayout()))
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
        dwarf: 'Dwarf Planet', dwarfpay: '+1500 Payout',
        dwarfassist: 'Gravity Assist', dwarftrojan: 'Trojan Companions',
        dwarfcompound: 'Compounding Orbit',
    },
});
