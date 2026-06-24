'use strict';


const STAR_SHINE_SCALE = 1.2;   // lengthen the shine (fade in/out) by 20%
const STAR_SEQ = [[1,40],[2,40],[3,42],[0,70],[4,55],[5,58],[6,60],[7,62],[8,58],[9,42],[10,40],[11,40],[12,40],[13,48],[1,40],[2,40],[3,42]]
    .map(([f, d]) => [f, Math.round(d * STAR_SHINE_SCALE)]);
const STAR_TOTAL = STAR_SEQ.reduce((s, p) => s + p[1], 0);
const STAR_EDGE = [168, 144, 92], STAR_CORE = [210, 186, 130];
const STAR_ALPHA = 0.42;

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
    let s = 20260621;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) {
        let fx, fy;
        do { fx = 0.06 + rnd() * 0.88; fy = 0.06 + rnd() * 0.88; }
        while (Math.hypot(fx - 0.5, fy - 0.5) < 0.16);

        const idle = 3500 + rnd() * 6000;
        // base size, then a per-star 75%–125% scale for more size variety
        const size = (16 + rnd() * 26) * (0.75 + rnd() * 0.5);
        // per-star shine-duration scale 80%–120% so they don't all twinkle in lockstep
        const sscale = 0.8 + rnd() * 0.4;
        _stars.push({ fx, fy, size, sscale, idle, off: rnd() * (STAR_TOTAL * sscale + idle) });
    }
}

// Defaults to the game canvas (ctx/W/H); the Accretion page passes its own context + dims
// so the exact same looping stars render behind the Mass UI.
function drawStars(t, g = ctx, w = W, h = H) {
    if (!_stars) initStars(22);
    const ms = t * 1000;
    g.save(); g.globalAlpha = STAR_ALPHA;
    for (const st of _stars) {
        const total = STAR_TOTAL * st.sscale;                 // this star's shine length (80–120% of base)
        const phase = (ms + st.off) % (total + st.idle);
        if (phase >= total) continue;
        const f = starFrameAt(phase / st.sscale);             // unscale before mapping into STAR_SEQ frames
        if (!f) continue;
        const img = STAR_TINTED[f];
        if (!img) continue;
        const sz = st.size;
        g.drawImage(img, st.fx * w - sz / 2, st.fy * h - sz / 2, sz, sz);
    }
    g.restore();
}
