'use strict';

function randCometGap() {
    const meteor = (typeof meteorShowerMult === 'function') ? meteorShowerMult() : 1;   // asteroid Meteor Shower identity: comets sooner
    return (CFG.COMET_MIN_GAP + Math.random()*(CFG.COMET_MAX_GAP-CFG.COMET_MIN_GAP)) * cometShowerMult() * meteor;
}

const COMET_SPEEDS = [1.0, 1.5, 2.0];
const cometFx = [];

// LEGACY (2026-07-02): events now OVERLAP FREELY - comet, swarm, vortex and stray stardust can all
// be on screen at once, and nothing checks this before spawning anymore. Kept for reference/BIGROCK.
function anyEventActive() {
    return !!G.comet
        || swarmActive()
        || (typeof VTX !== 'undefined' && VTX.active)
        || (typeof BIGROCK !== 'undefined' && BIGROCK.active);
}

const AFTERGLOW_DUR = 60;
let afterglowUntil = -1;
function afterglowActive() { return lvl('afterglow') > 0 && gameClock < afterglowUntil; }
function afterglowFrac()   { return Math.max(0, (afterglowUntil - gameClock) / AFTERGLOW_DUR); }

// builds one comet body flying in from a random edge, aimed loosely at Maw
function newCometObj() {
    const WW = innerWidth, HH = innerHeight;
    const side = Math.random()*4|0, r = Math.random();
    const x = side<2 ? (side?WW+40:-40) : r*WW;
    const y = side<2 ? r*HH : (side===2?-40:HH+40);
    const L = mawScreen();
    const tx = L.x + (Math.random()-0.5)*WW*0.4, ty = L.y + (Math.random()-0.5)*HH*0.4;
    const dx = tx-x, dy = ty-y, d = Math.hypot(dx,dy) || 1;
    const speedMult = COMET_SPEEDS[Math.random()*COMET_SPEEDS.length|0];
    const spd = Math.max(WW,HH) / CFG.COMET_LIFE * 1.1 * speedMult;
    return { x, y, vx:dx/d*spd, vy:dy/d*spd, life:CFG.COMET_LIFE, speedMult };
}

function spawnComet() { G.comet = newCometObj(); }

// pays the windfall + all catch side effects for any comet body (the regular one or a swarm one)
function payCometCatch(c) {
    let combined = 0;
    for (const o of ORBITERS) combined += o.list().length * o.payout();
    const prospector = (typeof prospectorCometMult === 'function') ? prospectorCometMult() : 1;   // asteroid Prospector's Cut identity
    const windfall = Math.round((10 * pulseValue() + combined) * (c.speedMult || 1) * brighterTailsMult() * prospector);
    earn(windfall);
    cometFx.push({ x:c.x, y:c.y, text:'+✦'+fmtNum(windfall), age:0, maxAge:1.5 });
    G.cometsCaught++; G.cometSeen = true; SoundSystem.sfxComet();
    // catching one proves the player knows comets - never show the comet tutorial after a catch
    // (without this, sniping the first comet inside its 2s pre-tutorial window kept deferring
    // the tutorial to a later comet, which read as a bug)
    if (G.tutSeen && !G.tutSeen.comet) { G.tutSeen.comet = true; saveGame(); }
    afterglowUntil = gameClock + AFTERGLOW_DUR;   // Afterglow: arm/refresh the per-pulse bonus window
}

function catchComet() {
    payCometCatch(G.comet);
    G.comet = null; G.cometTimer = randCometGap();
}

// window-space catch test used by main.js: the regular comet first, then any swarm comet
function tryCatchCometAt(x, y, R) {
    if (G.comet) {
        const dx = x - G.comet.x, dy = y - G.comet.y;
        if (dx*dx + dy*dy < R*R) { catchComet(); return true; }
    }
    for (let i = swarmComets.length - 1; i >= 0; i--) {
        const c = swarmComets[i], dx = x - c.x, dy = y - c.y;
        if (dx*dx + dy*dy < R*R) { payCometCatch(c); swarmComets.splice(i, 1); return true; }
    }
    return false;
}

// ---- Comet swarm: a rare event - 8 comets pouring in 0.2-0.4s apart, every 2.5-4 min ----
const SWARM_COUNT = 8, SWARM_GAP_MIN = 150, SWARM_GAP_MAX = 240;
let swarmTimer = SWARM_GAP_MIN + Math.random() * (SWARM_GAP_MAX - SWARM_GAP_MIN);
const swarmComets = [];   // live swarm comets (same body shape as G.comet)
let swarmPending = [];    // per-comet countdowns until each of the 8 spawns

function swarmActive() { return swarmComets.length > 0 || swarmPending.length > 0; }

function triggerCometSwarm() {
    if (swarmPending.length) return;
    let at = 0;
    for (let i = 0; i < SWARM_COUNT; i++) { swarmPending.push(at); at += 0.2 + Math.random() * 0.2; }
}

function cometTick(dt) {
    for (let i = cometFx.length-1; i >= 0; i--) {
        cometFx[i].age += dt;
        if (cometFx[i].age >= cometFx[i].maxAge) cometFx.splice(i, 1);
    }

    // swarm: countdown -> trigger (waits only for the comet tutorial; overlaps anything)
    swarmTimer -= dt;
    if (swarmTimer <= 0) {
        if (G.tutSeen && G.tutSeen.comet) {
            swarmTimer = SWARM_GAP_MIN + Math.random() * (SWARM_GAP_MAX - SWARM_GAP_MIN);
            triggerCometSwarm();
        } else swarmTimer = 5;   // too early (pre-tutorial) -> retry shortly
    }
    for (let i = swarmPending.length - 1; i >= 0; i--) {
        swarmPending[i] -= dt;
        if (swarmPending[i] <= 0) { swarmPending.splice(i, 1); swarmComets.push(newCometObj()); }
    }
    for (let i = swarmComets.length - 1; i >= 0; i--) {
        const c = swarmComets[i];
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > innerWidth+60 || c.y < -60 || c.y > innerHeight+60)
            swarmComets.splice(i, 1);
    }

    if (G.comet) {
        const c = G.comet;
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > innerWidth+60 || c.y < -60 || c.y > innerHeight+60) {
            G.comet = null; G.cometTimer = randCometGap();
        }
    } else {
        G.cometTimer -= dt;
        // the FIRST comet ever holds until the 20s mark of the universe clock (tutorial pacing);
        // tutSeen.comet is the persistent "a comet has ever appeared" marker (set by its tutorial)
        const firstGate = (G.tutSeen && G.tutSeen.comet) || G.universeTime >= 20;
        if (G.cometTimer <= 0 && firstGate) spawnComet();
    }
}
