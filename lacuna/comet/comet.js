'use strict';

// ── Comet ────────────────────────────────────────────────────────────────────
// Comets drift across the sky on a timer; catch one (click within ~48px) for a
// windfall. Spawning, movement, and the catch payout all live here. The hover
// reticle is drawn in render.js (drawReticle) since it's pure rendering.

function randCometGap() {
    return CFG.COMET_MIN_GAP + Math.random()*(CFG.COMET_MAX_GAP-CFG.COMET_MIN_GAP);
}

function spawnComet() {
    const side = Math.random()*4|0, r = Math.random();
    const x = side<2 ? (side?W+40:-40) : r*W;
    const y = side<2 ? r*H : (side===2?-40:H+40);
    const tx = CX+(Math.random()-0.5)*W*0.5, ty = CY+(Math.random()-0.5)*H*0.5;
    const dx = tx-x, dy = ty-y, d = Math.sqrt(dx*dx+dy*dy);
    const spd = Math.max(W,H) / CFG.COMET_LIFE * 1.1;
    G.comet = { x, y, vx:dx/d*spd, vy:dy/d*spd, life:CFG.COMET_LIFE };
}

function catchComet() {
    const c = G.comet;
    // Windfall = 10 clicks' worth + 1.25 × every orbiter's payout combined.
    let combined = 0;
    for (const o of ORBITERS) combined += o.list().length * o.payout();
    const windfall = 10 * upg('touch').tapYield[lvl('touch')] + 1.25 * combined;
    earn(windfall, c.x, c.y-20, true);
    G.cometsCaught++; G.cometSeen = true; SoundSystem.sfxComet();
    burst(c.x, c.y, 'rgba(60,80,70,', 26, 180);
    G.comet = null; G.cometTimer = randCometGap();
}

// Per-frame comet update: move an active comet (despawn when expired/off-screen),
// or count down to the next spawn.
function cometTick(dt) {
    if (G.comet) {
        const c = G.comet;
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > W+60 || c.y < -60 || c.y > H+60) {
            G.comet = null; G.cometTimer = randCometGap();
        }
    } else {
        G.cometTimer -= dt;
        if (G.cometTimer <= 0) spawnComet();
    }
}
