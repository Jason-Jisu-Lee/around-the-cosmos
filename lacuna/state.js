'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────────

let G = createInitialState();

function createInitialState() {
    return {
        dust: 0, runDust: 0, totalDust: 0,
        remnants: 0, collapses: 0,
        orbitsCompleted: 0, taps: 0, cometsCaught: 0,
        gameTime: 0,
        upgrades:        { planet: 0, velocity: 0, radiance: 0, touch: 0, hands: 0, charm: 0, supernova: 0 },
        remnantUpgrades: { ancient: 0, memory: 0, dilation: 0, moons: 0, horizon: 0 },
        planets:         [newPlanet(0)],
        comet: null,
        cometTimer:      randCometGap(0),
        accretionBuf: 0, accretionFlush: 0,
        particles: [], floatingTexts: [],
        incomeWindow: [], income: 0,
        sawSupernova: false,
    };
}

function newPlanet(i) {
    return { idx: i, angle: Math.random() * Math.PI * 2, spun: 0, cd: 0, pulse: 0 };
}

function randCometGap(charmLvl) {
    const f = Math.pow(0.88, charmLvl);
    return (CFG.COMET_MIN_GAP + Math.random() * (CFG.COMET_MAX_GAP - CFG.COMET_MIN_GAP)) * f;
}

// ─── FORMATTERS ──────────────────────────────────────────────────────────────

function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 ? (Math.round(n * 10) / 10).toString() : Math.round(n).toString();
    if (n < 1e6)  return (n / 1e3).toFixed(2) + 'K';
    if (n < 1e9)  return (n / 1e6).toFixed(2) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
    return (n / 1e12).toFixed(2) + 'T';
}

function fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${String(s).padStart(2, '0')}s`;
}

// ─── UPGRADE ACCESSORS ───────────────────────────────────────────────────────

function upg(id)  { return UPGRADES.find(u => u.id === id); }
function lvl(id)  { return G.upgrades[id]; }
function rupg(id) { return REMNANT_UPGRADES.find(u => u.id === id); }
function rlvl(id) { return G.remnantUpgrades[id]; }

// ─── DERIVED VALUES ───────────────────────────────────────────────────────────

function snMult()           { return lvl('supernova') > 0 ? 2 : 1; }
function globalMult()       { return rupg('ancient').mult(rlvl('ancient')) * snMult(); }
function orbitSpeed()       { return upg('velocity').speed(lvl('velocity')) * rupg('dilation').speed(rlvl('dilation')); }
function hasMoon(idx)       { return idx < rlvl('moons'); }

function orbitPayout(idx) {
    return PLANET_DEF[idx].value
        * upg('radiance').mult(lvl('radiance'))
        * (hasMoon(idx) ? 2 : 1)
        * globalMult();
}

function orbitRate() {
    let r = 0;
    for (const p of G.planets) r += orbitPayout(p.idx) / PLANET_DEF[p.idx].period;
    return r * orbitSpeed();
}

function collapseGain() {
    return Math.floor(Math.sqrt(G.runDust / CFG.COLLAPSE_UNIT));
}

// ─── EARN ────────────────────────────────────────────────────────────────────

function earn(amount, x, y, big) {
    G.dust      += amount;
    G.runDust   += amount;
    G.totalDust += amount;
    G.incomeWindow.push({ t: G.gameTime, v: amount });
    if (x !== undefined) {
        G.floatingTexts.push({
            x, y, text: '+✦' + fmtNum(amount),
            age: 0, maxAge: big ? 1.6 : 1.1,
            size: big ? 22 : 14,
        });
    }
}

// ─── SAVE / LOAD ─────────────────────────────────────────────────────────────

function saveGame() {
    try {
        localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({
            dust: G.dust, runDust: G.runDust, totalDust: G.totalDust,
            remnants: G.remnants, collapses: G.collapses,
            orbitsCompleted: G.orbitsCompleted, taps: G.taps,
            cometsCaught: G.cometsCaught, gameTime: G.gameTime,
            upgrades: { ...G.upgrades },
            remnantUpgrades: { ...G.remnantUpgrades },
            sawSupernova: G.sawSupernova,
        }));
    } catch (_) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(CFG.SAVE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        G.dust = d.dust ?? 0; G.runDust = d.runDust ?? 0; G.totalDust = d.totalDust ?? 0;
        G.remnants = d.remnants ?? 0; G.collapses = d.collapses ?? 0;
        G.orbitsCompleted = d.orbitsCompleted ?? 0; G.taps = d.taps ?? 0;
        G.cometsCaught = d.cometsCaught ?? 0; G.gameTime = d.gameTime ?? 0;
        G.sawSupernova = d.sawSupernova ?? false;
        G.upgrades        = Object.assign({ planet:0,velocity:0,radiance:0,touch:0,hands:0,charm:0,supernova:0 }, d.upgrades);
        G.remnantUpgrades = Object.assign({ ancient:0,memory:0,dilation:0,moons:0,horizon:0 }, d.remnantUpgrades);
        G.planets = [];
        const count = Math.min(CFG.MAX_PLANETS, G.upgrades.planet + 1);
        for (let i = 0; i < count; i++) G.planets.push(newPlanet(i));
    } catch (_) {}
}
