'use strict';
// ── Lacuna click reactions ───────────────────────────────────────────────────
// Five small, non-intrusive ways the Lacuna "reacts" to a harvest click. Each
// effect is a pure function of progress p (0→1 over its own duration); it returns
// a transform applied to the Lacuna core only (the glow stays put):
//   dx,dy = pixel offset   |   sx,sy = scale on each axis (1 = unchanged)
// `ctx` carries the click direction (unit vector from the Lacuna toward the click)
// for direction-aware effects like recoil.
//
// Swap the live one by setting `clickFxId` (the debug panel has buttons; the
// gallery at preview.html lets you feel all five). Pure — no game globals, so
// both the game and the preview share this file.

// A single Bounce — a quick uniform scale pop (sx = sy = s), like a beat.
const CLICK_FX = {
    bouncePop: {
        name: 'Pop', dur: 0.13,
        fn: p => { const s = 1 + 0.34 * Math.sin(Math.PI * p); return { sx: s, sy: s }; },
    },
    // The Pulse auto-clicker's heartbeat — a slow, gentle swell. NOT in CLICK_FX_LIST,
    // so manual clicks never roll it; logic.js triggers it directly every 3s.
    pulseBeat: {
        name: 'Heartbeat', dur: 0.5,
        fn: p => { const s = 1 + 0.16 * Math.sin(Math.PI * p); return { sx: s, sy: s }; },
    },
};
const CLICK_FX_LIST = ['bouncePop'];

// ── live state (read by render.js, set by the click handler) ─────────────────
let clickFxRandom = true;          // each click picks a random effect (equal chance)
let clickFxId = 'bouncePop';       // the active effect (when not random, or the last roll)
let clickFxStart = -1;             // start time in seconds (-1 = idle)
let clickFxCtx = { dirx: 0, diry: -1 };

// Pick a uniformly-random effect id (equal chance, repeats allowed).
function randomClickFxId() { return CLICK_FX_LIST[(Math.random() * CLICK_FX_LIST.length) | 0]; }

// Evaluate the active effect at time t (seconds) → {dx,dy,sx,sy}. Identity when idle.
function clickFxTransform(t) {
    const fx = CLICK_FX[clickFxId];
    if (!fx || clickFxStart < 0) return { dx: 0, dy: 0, sx: 1, sy: 1 };
    const p = (t - clickFxStart) / fx.dur;
    if (p < 0 || p >= 1) return { dx: 0, dy: 0, sx: 1, sy: 1 };
    const r = fx.fn(p, clickFxCtx);
    return { dx: r.dx || 0, dy: r.dy || 0, sx: r.sx == null ? 1 : r.sx, sy: r.sy == null ? 1 : r.sy };
}

// Fire the effect from a click at unit direction (dirx,diry) away from the Lacuna.
function triggerClickFx(t, dirx, diry) { clickFxStart = t; clickFxCtx = { dirx, diry }; }
