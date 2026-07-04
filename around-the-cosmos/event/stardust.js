'use strict';

// Stray stardust: a tiny drifting glint on the sky. SWEEPING the cursor over it collects it -
// no click. Worth ~5 pulses. Spawns every 7-11s (avg ~9, tight variance); the first one ever waits for the 20s mark
// of the universe clock and fires its own tutorial (ui/tutorial.js). Independent of the
// comet/vortex no-overlap rule - it is background texture, not an event.
const STRAY = {
    GAP_MIN: 7, GAP_MAX: 11,    // seconds between glints (avg ~9s after the last sweep, tight variance)
    R: 50,                       // sweep radius (sky-canvas px; matches the bigger glint)
    PULSES: 5,                   // value = ~5 pulses
};

const strayFirstAt = 20;   // the first-ever glint appears at the 20s universe mark
let strayTimer = 0;
let stray = null;                // { x, y, vx, vy, age, tw }
const strayFx = [];              // collect sparkles { x, y, age, maxAge }

function strayGap() { return STRAY.GAP_MIN + Math.random() * (STRAY.GAP_MAX - STRAY.GAP_MIN); }
function strayValue() { return Math.max(10, Math.round(STRAY.PULSES * pulseValue())); }

const STRAY_KINDS = ['twinkle', 'cluster', 'dustling'];   // designs A / D / E - one picked at random per glint
function spawnStray() {
    let x, y, tries = 0;
    do {
        x = 50 + Math.random() * Math.max(1, W - 100);
        y = 50 + Math.random() * Math.max(1, H - 100);
    } while (Math.hypot(x - CX, y - CY) < 90 && ++tries < 30);   // keep off Maw itself
    const a = Math.random() * Math.PI * 2, s = 14 + Math.random() * 10;
    stray = { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, tw: Math.random() * 6.28,
              kind: STRAY_KINDS[Math.random() * STRAY_KINDS.length | 0] };
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
    if (stray.kind === 'dustling') {   // the mini-comet drifts on a lazy arc
        const turn = 0.35 * dt;
        const vx = stray.vx * Math.cos(turn) - stray.vy * Math.sin(turn);
        stray.vy = stray.vx * Math.sin(turn) + stray.vy * Math.cos(turn);
        stray.vx = vx;
    }
    stray.x += stray.vx * dt; stray.y += stray.vy * dt;
    if (stray.x < 30 && stray.vx < 0) stray.vx = -stray.vx;
    if (stray.x > W - 30 && stray.vx > 0) stray.vx = -stray.vx;
    if (stray.y < 30 && stray.vy < 0) stray.vy = -stray.vy;
    if (stray.y > H - 30 && stray.vy > 0) stray.vy = -stray.vy;
    // the sweep: hovering within R collects (after a beat, so a lucky resting cursor doesn't eat it invisibly)
    if (cosmoOver && stray.age > 0.3 && Math.hypot(cosmoMx - stray.x, cosmoMy - stray.y) < STRAY.R) collectStray();
}

// drawn on the sky canvas, after draw() (main loop) - three looks, one picked per glint:
// 'twinkle' (4-point cross), 'cluster' (a tiny constellation), 'dustling' (a mini-comet)
function _strayHalo(x, y, r, a) {
    const gl = ctx.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, `rgba(201,162,74,${a.toFixed(3)})`);
    gl.addColorStop(1, 'rgba(201,162,74,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
const STRAY_SCALE = 2.9;     // the glint must read clearly bigger than a background star
const STRAY_BRIGHT = 1.3;    // brightness lift on every look (alphas clamp at 1)
function drawStray(t) {
    if (stray) {
        const S = STRAY_SCALE;
        const fadeIn = Math.min(1, stray.age / 0.6);
        const a = Math.min(1, fadeIn * (0.65 + 0.35 * Math.sin(t * 5 + stray.tw)) * STRAY_BRIGHT);   // no fade-out: it waits until swept
        const x = stray.x, y = stray.y;
        if (stray.kind === 'cluster') {
            for (let i = 0; i < 4; i++) {
                const aa = t * 0.9 + i * Math.PI / 2 + stray.tw, rr = (8 + Math.sin(t * 1.7 + i) * 2.5) * S;
                const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr * 0.8;
                const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 4 + i * 2));
                ctx.fillStyle = `rgba(201,162,74,${(a * tw).toFixed(3)})`;
                ctx.beginPath(); ctx.arc(px, py, 1.6 * S, 0, 7); ctx.fill();
            }
            ctx.fillStyle = `rgba(255,240,200,${(a * 0.8).toFixed(3)})`;
            ctx.beginPath(); ctx.arc(x, y, 1.2 * S, 0, 7); ctx.fill();
            _strayHalo(x, y, 18 * S, a * 0.3);
        } else if (stray.kind === 'dustling') {
            const sp = Math.hypot(stray.vx, stray.vy) || 1;
            for (let i = 1; i <= 8; i++) {
                const k = i / 8;
                ctx.fillStyle = `rgba(190,150,80,${(a * (1 - k) * 0.5).toFixed(3)})`;
                ctx.beginPath(); ctx.arc(x - stray.vx / sp * i * 4 * S, y - stray.vy / sp * i * 4 * S, (1 - k) * 2.6 * S, 0, 7); ctx.fill();
            }
            _strayHalo(x, y, 14 * S, a * 0.45);
            ctx.fillStyle = `rgba(240,200,120,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 2.6 * S, 0, 7); ctx.fill();
            ctx.fillStyle = `rgba(255,250,235,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 1.2 * S, 0, 7); ctx.fill();
        } else {   // twinkle
            const r = (5 + Math.sin(t * 3 + stray.tw) * 1.2) * S;
            _strayHalo(x, y, r * 4, a * 0.4);
            ctx.strokeStyle = `rgba(180,140,60,${a.toFixed(3)})`; ctx.lineWidth = 1.4 * S; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
            ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
            ctx.stroke();
            ctx.fillStyle = `rgba(255,240,200,${a.toFixed(3)})`;
            ctx.beginPath(); ctx.arc(x, y, 1.8 * S, 0, 7); ctx.fill();
        }
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
    const r = canvas.getBoundingClientRect(), R = 56;
    const x = r.left + stray.x, y = r.top + stray.y;
    return { left: x - R, top: y - R, right: x + R, width: R * 2, height: R * 2 };
}
