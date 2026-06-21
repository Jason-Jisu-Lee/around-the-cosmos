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

// Six fun Bounce variations — all uniform scale pops (sx = sy = s). Every entry
// is rolled with equal chance on a click.
const CLICK_FX = {
    bouncePop:       {  // smooth single pop
        name: 'Pop', dur: 0.13,
        fn: p => { const s = 1 + 0.34 * Math.sin(Math.PI * p); return { sx: s, sy: s }; },
    },
    bounceSnap:      {  // instant grow, quick ease back
        name: 'Snap', dur: 0.16,
        fn: p => { const s = 1 + 0.32 * Math.pow(1 - p, 1.6); return { sx: s, sy: s }; },
    },
    bounceBig:       {  // a big, bold, satisfying pop
        name: 'Big', dur: 0.20,
        fn: p => { const s = 1 + 0.52 * Math.sin(Math.PI * p); return { sx: s, sy: s }; },
    },
    bounceElastic:   {  // overshoot, dip below 1, settle
        name: 'Elastic', dur: 0.32,
        fn: p => { const s = 1 + 0.34 * Math.exp(-4 * p) * Math.cos(2 * Math.PI * 1.2 * p); return { sx: s, sy: s }; },
    },
    bounceDouble:    {  // two diminishing pops
        name: 'Double', dur: 0.34,
        fn: p => { const s = 1 + 0.40 * Math.exp(-3 * p) * Math.abs(Math.sin(2 * Math.PI * 1.3 * p)); return { sx: s, sy: s }; },
    },
    bounceHeartbeat: {  // thump-thump — two close pops then rest
        name: 'Heartbeat', dur: 0.48,
        fn: p => { const g = (c, w) => Math.exp(-(((p - c) / w) ** 2)); const e = g(0.13, 0.085) + 0.85 * g(0.40, 0.085); return { sx: 1 + 0.30 * e, sy: 1 + 0.30 * e }; },
    },
};
const CLICK_FX_LIST = ['bouncePop', 'bounceSnap', 'bounceBig', 'bounceElastic', 'bounceDouble', 'bounceHeartbeat'];

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
