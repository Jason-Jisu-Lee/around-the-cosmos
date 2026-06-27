'use strict';

const CLICK_FX = {
    bouncePop: {
        name: 'Pop', dur: 0.13,
        fn: p => { const s = 1 + 0.34 * Math.sin(Math.PI * p); return { sx: s, sy: s }; },
    },
    pulseBeat: {
        name: 'Pulse', dur: 0.62,
        fn: p => { const s = 1 + 0.15 * Math.sin(Math.PI * Math.pow(p, 0.72)); return { sx: s, sy: s }; },
    },
    deepBreath: {
        name: 'Deep Breath', dur: 0.62,
        fn: p => { const s = 1 + 0.26 * Math.sin(Math.PI * Math.pow(p, 0.72)); return { sx: s, sy: s }; },
    },
};
const CLICK_FX_LIST = ['bouncePop'];

let clickFxRandom = true;
let clickFxId = 'bouncePop';
let clickFxStart = -1;
let clickFxCtx = { dirx: 0, diry: -1 };

function randomClickFxId() { return CLICK_FX_LIST[(Math.random() * CLICK_FX_LIST.length) | 0]; }

function clickFxTransform(t) {
    const fx = CLICK_FX[clickFxId];
    if (!fx || clickFxStart < 0) return { dx: 0, dy: 0, sx: 1, sy: 1 };
    const p = (t - clickFxStart) / fx.dur;
    if (p < 0 || p >= 1) return { dx: 0, dy: 0, sx: 1, sy: 1 };
    const r = fx.fn(p, clickFxCtx);
    return { dx: r.dx || 0, dy: r.dy || 0, sx: r.sx == null ? 1 : r.sx, sy: r.sy == null ? 1 : r.sy };
}

function triggerClickFx(t, dirx, diry) { clickFxStart = t; clickFxCtx = { dirx, diry }; }
