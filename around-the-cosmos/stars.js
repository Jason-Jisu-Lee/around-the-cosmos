'use strict';

// ── Background shining stars ──────────────────────────────────────────────────
// Decorative twinkles drawn behind everything (assets/star/, variation 1). Each
// star runs the same frame sequence with its own phase offset so they twinkle out
// of sync. Positions are fractions of the canvas so they survive resizes.
//
// The source frames are white/gold (built to glow on a DARK background). On the
// parchment sky they'd be invisible, so each frame is re-tinted on load to a warm
// muted gold (luminance → EDGE..CORE gradient) that reads on #f4f0e8 without being
// loud. Originals are untouched on disk, so they stay usable on dark screens.
// [frame (0 = blank), ms]. A full cycle is 16 frames: f1→f13, then f1,f2,f3 again
// (sparkle in → form → hold → sparkle out). Late frames (full star) flicker fast.
const STAR_SEQ = [[1,40],[2,40],[3,42],[0,70],[4,55],[5,58],[6,60],[7,62],[8,58],[9,42],[10,40],[11,40],[12,40],[13,48],[1,40],[2,40],[3,42]];
const STAR_TOTAL = STAR_SEQ.reduce((s, p) => s + p[1], 0);
const STAR_EDGE = [168, 144, 92], STAR_CORE = [210, 186, 130];  // soft, light gold (dim edge → warm core)
const STAR_ALPHA = 0.42;                                        // overall subtlety — keeps it non-intrusive

const STAR_TINTED = [];
function tintStarFrame(img) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const L = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        d[i]     = STAR_EDGE[0] + (STAR_CORE[0] - STAR_EDGE[0]) * L;
        d[i + 1] = STAR_EDGE[1] + (STAR_CORE[1] - STAR_EDGE[1]) * L;
        d[i + 2] = STAR_EDGE[2] + (STAR_CORE[2] - STAR_EDGE[2]) * L;
    }
    x.putImageData(id, 0, 0); return c;
}
for (let i = 1; i <= 13; i++) {
    const im = new Image();
    im.onload = () => { STAR_TINTED[i] = tintStarFrame(im); };
    im.src = 'assets/star/f' + i + '.png?v=3';
}

function starFrameAt(ms) {
    let tt = ((ms % STAR_TOTAL) + STAR_TOTAL) % STAR_TOTAL;
    for (const [f, d] of STAR_SEQ) { if (tt < d) return f; tt -= d; }
    return 0;
}

let _stars = null;
function initStars(n) {
    _stars = [];
    let s = 20260621;                                  // seeded RNG → a stable scatter (no reshuffle each frame)
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) {
        let fx, fy;
        do { fx = 0.06 + rnd() * 0.88; fy = 0.06 + rnd() * 0.88; }
        while (Math.hypot(fx - 0.5, fy - 0.5) < 0.16);  // keep clear of the Lacuna/orbiters in the center
        // After shining, a star stays dark for a long random idle so it doesn't re-twinkle
        // in the same spot too often. Each star's cycle = shine (~0.7s) + idle, all different.
        const idle = 3500 + rnd() * 6000;               // 3.5–9.5s dark between shines
        _stars.push({ fx, fy, size: 16 + rnd() * 26, idle, off: rnd() * (STAR_TOTAL + idle) });
    }
}

function drawStars(t) {
    if (!_stars) initStars(10);
    const ms = t * 1000;
    ctx.save(); ctx.globalAlpha = STAR_ALPHA;
    for (const st of _stars) {
        const phase = (ms + st.off) % (STAR_TOTAL + st.idle);
        if (phase >= STAR_TOTAL) continue;              // idle — star is dark
        const f = starFrameAt(phase);
        if (!f) continue;                               // blank pause frame
        const img = STAR_TINTED[f];
        if (!img) continue;                             // not loaded/tinted yet
        const sz = st.size;
        ctx.drawImage(img, st.fx * W - sz / 2, st.fy * H - sz / 2, sz, sz);
    }
    ctx.restore();
}
