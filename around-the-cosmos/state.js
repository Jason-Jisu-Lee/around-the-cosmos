'use strict';

const MASS_UPG_IDS = ['singularity','denserCore','heavierPulse','firstLight','heavierBodies','denseDust','lunarFavor','brighterTails','cometShower','greaterCollapse'];
function blankMassUpgrades() { const o = {}; for (const id of MASS_UPG_IDS) o[id] = 0; return o; }

let G = createInitialState();

function createInitialState() {
    return {
        dust:10, runDust:0, totalDust:0,
        mass:0, massEarned:0, moonEverOwned:false,
        massUpgrades: blankMassUpgrades(),
        orbitsCompleted:0, dwarfOrbits:0, taps:0, cometsCaught:0, gameTime:0, universeTime:0,
        upgrades: { touch:0, surge:0, deepbreath:0, abyssal:0, afterglow:0, pulse:0, gravpull:0, dust:0, dustcount:0, dustpay:0, dustspd:0, coagulation:0, iceMantles:0, denser:0, dustdevil:0, prdrag:0, asteroid:0, astpay:0, astspd:0, astcomp:0, rubblepile:0, ferropulse:0, meteorshower:0, prospector:0, slingshot:0, moon:0, moonpay:0, moonspd:0, moonphase:0, albedo:0, springtide:0, eclipse:0, standstill:0, bloodmoon:0, dwarf:0, dwarfpay:0, dwarftrojan:0, dwarfcompound:0, glacial:0, distantkin:0, longnow:0, storedwinter:0, anchor:0, resonance:0, charm:0 },
        planets:  [],
        clump:    newClump(),
        asteroids: [],
        asteroidClump: newClump(),
        moons:     [],
        moonClump: newClump(),
        dwarfs:    [],
        dwarfClump: newClump(),
        comet:null, cometTimer:7 + Math.random()*6, cometSeen:false, vortexSeen:false, tutSeen:{},
        particles:[], floatingTexts:[],
    };
}

function newClump() {
    const angle = Math.random()*Math.PI*2;
    let nextTop = 3*Math.PI/2;
    while (nextTop <= angle) nextTop += Math.PI*2;
    return { angle, nextTop };
}

function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 100000) return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const abbr = (v, suf) => v.toFixed(2).replace(/\.?0+$/, '') + suf;
    if (n < 1e6)  return abbr(n/1e3, 'K');
    if (n < 1e9)  return abbr(n/1e6, 'M');
    if (n < 1e12) return abbr(n/1e9, 'B');
    return abbr(n/1e12, 'T');
}

function fmtTime(secs) {
    const m = Math.floor(secs/60), s = Math.floor(secs%60);
    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m ${String(s).padStart(2,'0')}s`;
}

function upg(id) { return UPGRADES.find(u => u.id === id); }
function lvl(id) { return G.upgrades[id]; }

function pulseValue() {
    const base = 5 * lvl('touch') + 10 * lvl('surge') + heavierPulseBonus();
    const pull = 0.01 * lvl('gravpull') * orbiterPayoutSum();
    return Math.round((base + pull) * denserCoreMult());
}

function deepBreathInterval() { const l = lvl('deepbreath'); return l ? 13 - l : 0; }

function deepBreathMult() { return 2 + 0.2 * lvl('abyssal'); }

function deepBreathAvgMult() { const n = deepBreathInterval(); return n > 0 ? 1 + (deepBreathMult() - 1) / n : 1; }
function pulseIncomePerSec() {
    const ag = (typeof afterglowActive === 'function' && afterglowActive()) ? 20 * lvl('afterglow') : 0;
    return pulseValue() * deepBreathAvgMult() + ag;
}

function fmtNice(n) {
    if (!isFinite(n)) return '∞';
    if (Math.abs(n) >= 100) return Math.round(n).toString();
    return (Math.round(n*100)/100).toString();
}

function fmtSci(n) {
    if (n === 0) return '0';
    const exp  = Math.floor(Math.log10(Math.abs(n)));
    const mant = Math.round(n / Math.pow(10, exp) * 100) / 100;
    const sup  = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const digits = Math.abs(exp).toString().split('').map(d => sup[+d]).join('');
    return `${mant} × 10${exp < 0 ? '⁻' : ''}${digits}`;
}

function earn(amount, x, y, big) {
    G.dust += amount; G.runDust += amount; G.totalDust += amount;
    if (x !== undefined) {
        G.floatingTexts.push({ x, y, text:'+✦'+fmtNum(amount), age:0, maxAge:big?1.6:1.1, size:big?22:14 });
    }
}

const ACCRETION_THRESHOLD = 320000;   // runDust for the FIRST accretion (at zero lifetime Mass) - anchors the whole curve
const FIRST_GRANT = 3;                 // Mass granted at that first accretion (also the accrete floor)
const MASS_LIFE_K = 0.02;             // each lifetime Mass raises the runDust needed per Mass by 2% - difficulty scales with lifetime Mass
// DIMINISHING returns (square root), anchored so the FIRST accretion lands at exactly ACCRETION_THRESHOLD runDust = FIRST_GRANT Mass:
// Mass = floor(FIRST_GRANT × sqrt(runDust / unit)). Pushing further still earns more, but at a SLOWING rate (push 4× the
// stardust for only 2× the Mass). `unit` grows with lifetime Mass, so a richer save must push further for the same Mass.
function massUnit()     { return ACCRETION_THRESHOLD * (1 + MASS_LIFE_K * G.massEarned); }
function massEarnable() { return Math.floor(FIRST_GRANT * Math.sqrt(G.runDust / massUnit())); }
function baseMassGain() { return massEarnable(); }
function massGain()     { return Math.round(baseMassGain() * greaterCollapseMult()); }
// You can only accrete once you'd gain at least accFloor() = FIRST_GRANT (3) Mass; the lifetime difficulty lives in
// massUnit, which also pushes accrThreshold up as you get richer.
function accFloor()      { return FIRST_GRANT; }
function accrThreshold() { return massUnit(); }   // runDust to reach the floor (massEarnable >= FIRST_GRANT <=> runDust >= unit); = 500k fresh
function canAccrete()    { return massEarnable() >= accFloor(); }

function commitAccretion() {
    const base  = baseMassGain();
    const grant = Math.round(base * greaterCollapseMult());
    G.mass += grant; G.massEarned += base;
    saveGame();
    return grant;
}

function resetUniverse() {
    const keep = { mass:G.mass, massEarned:G.massEarned, totalDust:G.totalDust, gameTime:G.gameTime,
                   moonEverOwned:G.moonEverOwned, massUpgrades:G.massUpgrades, tutSeen:G.tutSeen };
    G = createInitialState();
    Object.assign(G, keep);
    if (typeof applyMassUniverseStart === 'function') applyMassUniverseStart();
    if (typeof resetPanelAnimations === 'function') resetPanelAnimations();
    if (typeof buildPanels === 'function') buildPanels();
    saveGame();
}

function saveGame() {
    try {
        localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({
            dust:G.dust, runDust:G.runDust, totalDust:G.totalDust,
            mass:G.mass, massEarned:G.massEarned, moonEverOwned:G.moonEverOwned,
            massUpgrades:{...G.massUpgrades},
            orbitsCompleted:G.orbitsCompleted, dwarfOrbits:G.dwarfOrbits, taps:G.taps,
            cometsCaught:G.cometsCaught, gameTime:G.gameTime, universeTime:G.universeTime,
            cometSeen:G.cometSeen, vortexSeen:G.vortexSeen, tutSeen:G.tutSeen,
            upgrades:{...G.upgrades},
        }));
    } catch(_) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(CFG.SAVE_KEY) || localStorage.getItem('lacuna_v1');
        if (!raw) return;
        const d = JSON.parse(raw);
        const def = (k, fb) => d[k] ?? fb;
        G.dust=def('dust',0); G.runDust=def('runDust',0); G.totalDust=def('totalDust',0);
        G.mass=def('mass',0); G.massEarned=def('massEarned',0);
        G.massUpgrades = Object.assign(blankMassUpgrades(), d.massUpgrades);
        G.moonEverOwned=def('moonEverOwned', (d.upgrades && d.upgrades.moon >= 1) || false);
        G.orbitsCompleted=def('orbitsCompleted',0); G.dwarfOrbits=def('dwarfOrbits',0); G.taps=def('taps',0);
        G.cometsCaught=def('cometsCaught',0); G.gameTime=def('gameTime',0);
        G.universeTime=def('universeTime', G.gameTime);
        G.upgrades = Object.assign({ touch:0, surge:0, deepbreath:0, abyssal:0, afterglow:0, pulse:0, gravpull:0, dust:0, dustcount:0, dustpay:0, dustspd:0, coagulation:0, iceMantles:0, denser:0, dustdevil:0, prdrag:0, asteroid:0, astpay:0, astspd:0, astcomp:0, rubblepile:0, ferropulse:0, meteorshower:0, prospector:0, slingshot:0, moon:0, moonpay:0, moonspd:0, moonphase:0, albedo:0, springtide:0, eclipse:0, standstill:0, bloodmoon:0, dwarf:0, dwarfpay:0, dwarftrojan:0, dwarfcompound:0, glacial:0, distantkin:0, longnow:0, storedwinter:0, anchor:0, resonance:0, charm:0 }, d.upgrades);
        if (G.upgrades.grasp != null) { G.upgrades.surge = G.upgrades.surge || G.upgrades.grasp; delete G.upgrades.grasp; }   // migrate old 'grasp' id -> 'surge'

        if (G.upgrades.dust > 1) {
            G.upgrades.dustcount = Math.min(4, Math.max(G.upgrades.dustcount, G.upgrades.dust - 1));
            G.upgrades.dust = 1;
        }
        G.cometSeen = def('cometSeen', G.cometsCaught > 0);
        G.vortexSeen = def('vortexSeen', false);
        G.tutSeen = def('tutSeen', {}) || {};

        for (const o of ORBITERS) {
            const arr = o.list();
            arr.length = 0;
            const n = o.count();
            for (let i = 0; i < n; i++) arr.push(o.make());
        }
    } catch(_) {}
}
