'use strict';

// Stray stardust: a tiny drifting glint on the sky. SWEEPING the cursor over it collects it -
// no click. Worth ~5 pulses. Spawns every 15-22s; the first one ever waits for a 90-115s mark
// of the universe clock and fires its own tutorial (ui/tutorial.js). Independent of the
// comet/vortex no-overlap rule - it is background texture, not an event.
const STRAY = {
    GAP_MIN: 10, GAP_MAX: 18,   // seconds between glints
    R: 26,                       // sweep radius (sky-canvas px)
    PULSES: 5,                   // value = ~5 pulses
};

const strayFirstAt = 20;   // the first-ever glint appears at the 20s universe mark
let strayTimer = 0;
let stray = null;                // { x, y, vx, vy, age, tw }
const strayFx = [];              // collect sparkles { x, y, age, maxAge }

function strayGap() { return STRAY.GAP_MIN + Math.random() * (STRAY.GAP_MAX - STRAY.GAP_MIN); }
function strayValue() { return Math.max(10, Math.round(STRAY.PULSES * pulseValue())); }

function spawnStray() {
    let x, y, tries = 0;
    do {
        x = 50 + Math.random() * Math.max(1, W - 100);
        y = 50 + Math.random() * Math.max(1, H - 100);
    } while (Math.hypot(x - CX, y - CY) < 90 && ++tries < 30);   // keep off Maw itself
    const a = Math.random() * Math.PI * 2, s = 14 + Math.random() * 10;
    stray = { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, tw: Math.random() * 6.28 };
}

function collectStray() {
    earn(strayValue(), stray.x, stray.y - 14);
    strayFx.push({ x: stray.x, y: stray.y, age: 0, maxAge: 0.55 });
    stray = null; strayTimer = strayGap();
    SoundSystem.sfxTap();
}

function strayTick(dt) {
    for (let i = strayFx.length - 1; i >= 0; i--) { strayFx[i].age += dt; if (strayFx[i].age >= strayFx[i].maxAge) strayFx.splice(i, 1); }

    if (!stray) {
        const vortexUp = typeof VTX !== 'undefined' && VTX.active;   // a feeding vortex blocks NEW events
        if (G.tutSeen && !G.tutSeen.stray) {                          // first glint ever: wait for the mark
            if (G.universeTime >= strayFirstAt && !vortexUp) spawnStray();
            return;
        }
        strayTimer -= dt;
        if (strayTimer <= 0 && !vortexUp) spawnStray();
        return;
    }

    // ONE glint at a time, and it NEVER expires - it drifts (bouncing softly off the edges)
    // until the player sweeps it up. No new glint spawns while this one waits.
    stray.age += dt;
    stray.x += stray.vx * dt; stray.y += stray.vy * dt;
    if (stray.x < 30 && stray.vx < 0) stray.vx = -stray.vx;
    if (stray.x > W - 30 && stray.vx > 0) stray.vx = -stray.vx;
    if (stray.y < 30 && stray.vy < 0) stray.vy = -stray.vy;
    if (stray.y > H - 30 && stray.vy > 0) stray.vy = -stray.vy;
    // the sweep: hovering within R collects (after a beat, so a lucky resting cursor doesn't eat it invisibly)
    if (cosmoOver && stray.age > 0.3 && Math.hypot(cosmoMx - stray.x, cosmoMy - stray.y) < STRAY.R) collectStray();
}

// drawn on the sky canvas, after draw() (main loop) - a 4-point twinkle with a soft gold halo
function drawStray(t) {
    if (stray) {
        const fadeIn = Math.min(1, stray.age / 0.6);
        const a = fadeIn * (0.65 + 0.35 * Math.sin(t * 5 + stray.tw));   // no fade-out: it waits until swept
        const x = stray.x, y = stray.y, r = 5 + Math.sin(t * 3 + stray.tw) * 1.2;
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        gl.addColorStop(0, `rgba(201,162,74,${(a * 0.4).toFixed(3)})`);
        gl.addColorStop(1, 'rgba(201,162,74,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(180,140,60,${a.toFixed(3)})`; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,240,200,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill();
    }
    for (const fx of strayFx) {
        const p = fx.age / fx.maxAge, a = 1 - p;
        ctx.strokeStyle = `rgba(201,162,74,${(a * 0.8).toFixed(3)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, 4 + p * 22, 0, 7); ctx.stroke();
    }
}

// window-space rect for the tutorial spotlight (null when no glint is up)
function strayTutRect() {
    if (!stray) return null;
    const r = canvas.getBoundingClientRect(), R = 34;
    const x = r.left + stray.x, y = r.top + stray.y;
    return { left: x - R, top: y - R, right: x + R, width: R * 2, height: R * 2 };
}
