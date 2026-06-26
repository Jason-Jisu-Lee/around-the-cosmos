'use strict';



function randCometGap() {
    // Comet Shower (Mass upgrade) shrinks the gap so comets arrive sooner.
    return (CFG.COMET_MIN_GAP + Math.random()*(CFG.COMET_MAX_GAP-CFG.COMET_MIN_GAP)) * cometShowerMult();
}

// Each comet picks a random speed ×current-base; faster = harder to catch but pays proportionally more.
const COMET_SPEEDS = [1.0, 1.5, 2.0];
// Comet runs in WINDOW coordinates (it travels over the side panels), drawn on the #comet-layer overlay.
// Catch FX (expanding ring + rising windfall text) also live here, in window coords.
const cometFx = [];

function spawnComet() {
    const WW = innerWidth, HH = innerHeight;
    const side = Math.random()*4|0, r = Math.random();
    const x = side<2 ? (side?WW+40:-40) : r*WW;
    const y = side<2 ? r*HH : (side===2?-40:HH+40);
    const L = lacunaScreen();   // aim near the Lacuna's on-screen (window) position
    const tx = L.x + (Math.random()-0.5)*WW*0.4, ty = L.y + (Math.random()-0.5)*HH*0.4;
    const dx = tx-x, dy = ty-y, d = Math.hypot(dx,dy) || 1;
    const speedMult = COMET_SPEEDS[Math.random()*COMET_SPEEDS.length|0];
    const spd = Math.max(WW,HH) / CFG.COMET_LIFE * 1.1 * speedMult;
    G.comet = { x, y, vx:dx/d*spd, vy:dy/d*spd, life:CFG.COMET_LIFE, speedMult };
}

function catchComet() {
    const c = G.comet;

    let combined = 0;
    for (const o of ORBITERS) combined += o.list().length * o.payout();
    // (10 × pulse + 1 × orbiters) × the comet's speed multiplier × Brighter Tails (Mass).
    const windfall = Math.round((10 * pulseValue() + combined) * (c.speedMult || 1) * brighterTailsMult());
    earn(windfall);   // no x/y — the catch FX is drawn on the comet overlay (window coords) instead
    cometFx.push({ x:c.x, y:c.y, text:'+✦'+fmtNum(windfall), age:0, maxAge:1.5 });
    G.cometsCaught++; G.cometSeen = true; SoundSystem.sfxComet();
    G.comet = null; G.cometTimer = randCometGap();
}


function cometTick(dt) {
    for (let i = cometFx.length-1; i >= 0; i--) {
        cometFx[i].age += dt;
        if (cometFx[i].age >= cometFx[i].maxAge) cometFx.splice(i, 1);
    }
    if (G.comet) {
        const c = G.comet;
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > innerWidth+60 || c.y < -60 || c.y > innerHeight+60) {
            G.comet = null; G.cometTimer = randCometGap();
        }
    } else {
        G.cometTimer -= dt;
        if (G.cometTimer <= 0) spawnComet();
    }
}
