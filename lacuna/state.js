'use strict';

let G = createInitialState();

function createInitialState() {
    return {
        dust:0, runDust:0, totalDust:0,
        orbitsCompleted:0, taps:0, cometsCaught:0, gameTime:0,
        upgrades: { touch:0, planet:0, charm:0 },
        planets:  [],   // none at start — the first planet must be bought
        comet:null, cometTimer:randCometGap(),
        particles:[], floatingTexts:[], incomeWindow:[], income:0,
    };
}

// Planets pay out when they cross the top of their orbit (angle 3π/2, where sin = -1).
// nextTop tracks the upcoming top-crossing angle.
function newPlanet(i) {
    const angle = Math.random()*Math.PI*2;
    let nextTop = 3*Math.PI/2;
    while (nextTop <= angle) nextTop += Math.PI*2;
    return { idx:i, angle, nextTop, pulse:0, seen:false, up:{ payout:0, speed:0 } };
}

function randCometGap() {
    return CFG.COMET_MIN_GAP + Math.random()*(CFG.COMET_MAX_GAP-CFG.COMET_MIN_GAP);
}

function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 ? (Math.round(n*10)/10).toString() : Math.round(n).toString();
    if (n < 1e6)  return (n/1e3).toFixed(2)+'K';
    if (n < 1e9)  return (n/1e6).toFixed(2)+'M';
    if (n < 1e12) return (n/1e9).toFixed(2)+'B';
    return (n/1e12).toFixed(2)+'T';
}

function fmtTime(secs) {
    const m = Math.floor(secs/60), s = Math.floor(secs%60);
    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m ${String(s).padStart(2,'0')}s`;
}

function upg(id) { return UPGRADES.find(u => u.id === id); }
function lvl(id) { return G.upgrades[id]; }
function planetUpgDef(id) { return PLANET_UPGRADES.find(u => u.id === id); }

function orbitPayout(idx) {
    const base = idx === 0 ? 5 : PLANET_DEF[idx].value;   // first planet pays a flat 5
    const p = G.planets[idx];
    const payoutLvl = p ? p.up.payout : 0;
    return base * planetUpgDef('payout').mult(payoutLvl);  // ×Orbit Payout upgrade
}

function earn(amount, x, y, big) {
    G.dust += amount; G.runDust += amount; G.totalDust += amount;
    G.incomeWindow.push({ t:G.gameTime, v:amount });
    if (x !== undefined) {
        G.floatingTexts.push({ x, y, text:'+✦'+fmtNum(amount), age:0, maxAge:big?1.6:1.1, size:big?22:14 });
    }
}

function saveGame() {
    try {
        localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({
            dust:G.dust, runDust:G.runDust, totalDust:G.totalDust,
            orbitsCompleted:G.orbitsCompleted, taps:G.taps,
            cometsCaught:G.cometsCaught, gameTime:G.gameTime,
            upgrades:{...G.upgrades},
            planetUp:G.planets.map(p => [p.up.payout, p.up.speed, p.seen?1:0]),
        }));
    } catch(_) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(CFG.SAVE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        const def = (k, fb) => d[k] ?? fb;
        G.dust=def('dust',0); G.runDust=def('runDust',0); G.totalDust=def('totalDust',0);
        G.orbitsCompleted=def('orbitsCompleted',0); G.taps=def('taps',0);
        G.cometsCaught=def('cometsCaught',0); G.gameTime=def('gameTime',0);
        G.upgrades = Object.assign({ touch:0, planet:0, charm:0 }, d.upgrades);
        G.planets = [];
        const count = Math.min(CFG.MAX_PLANETS, G.upgrades.planet); // planets == New Planet level
        const pu = d.planetUp || [];
        for (let i = 0; i < count; i++) {
            const p = newPlanet(i);
            if (pu[i]) { p.up.payout = pu[i][0]||0; p.up.speed = pu[i][1]||0; p.seen = !!pu[i][2]; }
            G.planets.push(p);
        }
    } catch(_) {}
}
