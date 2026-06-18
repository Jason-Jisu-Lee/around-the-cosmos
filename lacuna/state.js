'use strict';

let G = createInitialState();

function createInitialState() {
    return {
        dust:0, runDust:0, totalDust:0,
        orbitsCompleted:0, taps:0, cometsCaught:0, gameTime:0, universeTime:0,
        upgrades: { touch:0, dust:0, dustpay:0, dustspd:0, charm:0 },
        planets:  [],            // orbiters (dust particles); none at start
        clump:    newClump(),    // the shared orbit the dust clump travels as a group
        comet:null, cometTimer:7 + Math.random()*6, cometSeen:false, // first comet ~7-13s
        particles:[], floatingTexts:[], incomeWindow:[], income:0,
    };
}

// A dust particle: part of a clump that orbits Lacuna together. Each particle also
// circles its own little orbit within the clump (localPhase/localR/localSpin).
// `shape` is a set of jittered radii → an irregular pebble silhouette.
function newOrbiter() {
    const shape = [];
    for (let k = 0; k < 7; k++) shape.push(0.6 + Math.random()*0.8);
    return {
        localPhase: Math.random()*Math.PI*2,
        localR:     5 + Math.random()*7,   // inner-orbit radius within the clump (5–12px)
        localSpin:  (Math.random()<0.5?-1:1) * (0.6 + Math.random()*0.8),
        pulse:0, shape,
    };
}

// The dust clump's shared orbit around Lacuna (ring 0). Pays when it crosses the top.
function newClump() {
    const angle = Math.random()*Math.PI*2;
    let nextTop = 3*Math.PI/2;
    while (nextTop <= angle) nextTop += Math.PI*2;
    return { angle, nextTop };
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

// Every dust particle pays a flat 10, doubled by Dust Particle Payout.
function orbiterPayout() { return 10 * upg('dustpay').mult(lvl('dustpay')); }

// Clump orbit speed factor: base 50%, restored to 100% by Dust Particle Speed (lvl 5).
function dustSpeed() { return 0.5 * upg('dustspd').mult(lvl('dustspd')); }

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
            cometsCaught:G.cometsCaught, gameTime:G.gameTime, universeTime:G.universeTime,
            cometSeen:G.cometSeen,
            upgrades:{...G.upgrades},
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
        G.universeTime=def('universeTime', G.gameTime); // current-universe timer (reset on prestige later)
        G.upgrades = Object.assign({ touch:0, dust:0, dustpay:0, dustspd:0, charm:0 }, d.upgrades);
        G.cometSeen = def('cometSeen', G.cometsCaught > 0);
        G.planets = [];
        const count = Math.min(3, G.upgrades.dust); // one orbiter per Dust Particle level
        for (let i = 0; i < count; i++) G.planets.push(newOrbiter());
    } catch(_) {}
}
