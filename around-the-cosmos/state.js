'use strict';

let G = createInitialState();

function createInitialState() {
    return {
        dust:0, runDust:0, totalDust:0,
        orbitsCompleted:0, taps:0, cometsCaught:0, gameTime:0, universeTime:0,
        upgrades: { touch:0, grasp:0, pulse:0, gravpull:0, dust:0, dustcount:0, dustpay:0, dustspd:0, asteroid:0, astpay:0, astspd:0, astcomp:0, moon:0, moonpay:0, moonspd:0, moonphase:0, resonance:0, charm:0 },
        planets:  [],            // orbiters (dust particles); none at start
        clump:    newClump(),    // the shared orbit the dust clump travels as a group
        asteroids: [],           // orbiters (asteroids, ring 1); none at start
        asteroidClump: newClump(),// the shared orbit the asteroid clump travels as a group
        moons:     [],           // orbiters (moon, ring 2); none at start
        moonClump: newClump(),   // the shared orbit the moon travels as a group
        comet:null, cometTimer:7 + Math.random()*6, cometSeen:false, // first comet ~7-13s
        particles:[], floatingTexts:[],
    };
}

// Orbiter bodies (dust particles, asteroids, …) are created by their own component
// files in orbiters/ — see each `make()`. State only holds the arrays + clumps below.

// A shared orbit a clump travels as a group. Pays when it crosses the top.
function newClump() {
    const angle = Math.random()*Math.PI*2;
    let nextTop = 3*Math.PI/2;
    while (nextTop <= angle) nextTop += Math.PI*2;
    return { angle, nextTop };
}

function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    // Under 100,000: write the whole number out, comma-grouped (10000 → "10,000"). 6 figures+ abbreviate.
    if (n < 100000) return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const abbr = (v, suf) => v.toFixed(2).replace(/\.?0+$/, '') + suf;   // trims trailing zeros (100.00→100)
    if (n < 1e6)  return abbr(n/1e3, 'K');   // 100000 → "100K"
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

// Stardust earned per click: Star Touch + Star Grasp (+2/lvl) + Gravitational Pull
// (each level adds +1% of total orbiter payout to the click). Rounded → whole stardust.
function clickValue() {
    const base = upg('touch').tapYield[lvl('touch')] + 2 * lvl('grasp');
    const pull = 0.01 * lvl('gravpull') * orbiterPayoutSum();
    return Math.round(base + pull);
}

// ---- Cosmic-flavor Lacuna physics (orbiter payout/speed/velocity live in orbiters.js) ----
function lacunaMass()     { const r = PHYS.lacunaRadius; return PHYS.lacunaDensity * (4/3)*Math.PI * r*r*r; } // kg
function lacunaGravity()  { return PHYS.G * lacunaMass() / (PHYS.lacunaRadius*PHYS.lacunaRadius); }            // m/s²
function lacunaEscapeVel(){ return Math.sqrt(2 * PHYS.G * lacunaMass() / PHYS.lacunaRadius); }                 // m/s

// Compact display: whole number when ≥100, otherwise ≤2 decimals (trailing zeros dropped).
// Pair with a chosen unit so values read cleanly (e.g. 8.39 cm/s², 142 m/s).
function fmtNice(n) {
    if (!isFinite(n)) return '∞';
    if (Math.abs(n) >= 100) return Math.round(n).toString();
    return (Math.round(n*100)/100).toString();
}
// Scientific notation with 3 sig figs and unicode superscript (e.g. 1.81 × 10¹⁹).
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
        const raw = localStorage.getItem(CFG.SAVE_KEY) || localStorage.getItem('lacuna_v1'); // migrate old key
        if (!raw) return;
        const d = JSON.parse(raw);
        const def = (k, fb) => d[k] ?? fb;
        G.dust=def('dust',0); G.runDust=def('runDust',0); G.totalDust=def('totalDust',0);
        G.orbitsCompleted=def('orbitsCompleted',0); G.taps=def('taps',0);
        G.cometsCaught=def('cometsCaught',0); G.gameTime=def('gameTime',0);
        G.universeTime=def('universeTime', G.gameTime); // current-universe timer (reset on prestige later)
        G.upgrades = Object.assign({ touch:0, grasp:0, pulse:0, gravpull:0, dust:0, dustcount:0, dustpay:0, dustspd:0, asteroid:0, astpay:0, astspd:0, astcomp:0, moon:0, moonpay:0, moonspd:0, moonphase:0, resonance:0, charm:0 }, d.upgrades);
        // Migrate old saves where `dust` was the count (1–5): split into dust(=1) + dustcount(the rest).
        if (G.upgrades.dust > 1) {
            G.upgrades.dustcount = Math.min(4, Math.max(G.upgrades.dustcount, G.upgrades.dust - 1));
            G.upgrades.dust = 1;
        }
        G.cometSeen = def('cometSeen', G.cometsCaught > 0);
        // Rebuild each orbiter's bodies from its upgrade level (see orbiters/*).
        for (const o of ORBITERS) {
            const arr = o.list();
            arr.length = 0;
            const n = o.count();
            for (let i = 0; i < n; i++) arr.push(o.make());
        }
    } catch(_) {}
}
