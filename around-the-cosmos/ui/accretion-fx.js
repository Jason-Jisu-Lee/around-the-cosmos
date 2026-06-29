'use strict';

// The Singularity collapse & Rebirth animation, drawn on the full-window #accretion-fx canvas.
// Choreographed to sound/music/accretion-1.mp3 as 5 timed beats (~34.3s) + a 3s hold, then onDone().
// Self-contained: started once by startAccretionSequence (ui/accretion.js); only reads render/orbiter
// globals (canvas, ORBITERS, PLANET_DEF) + the onDone callback. Tunable timing lives in test/singularity-demo.html.
const FX_TL = { windup: 15.0, absorb: 4.15, collapse: 2.55, converge: 10.0, rebirth: 2.5 };
const FX_HOLD = 3.0;
function runAccretionFx(onDone) {
    const fx = document.getElementById('accretion-fx');
    fx.style.display = 'block';
    fx.width = innerWidth; fx.height = innerHeight;
    const X = fx.getContext('2d');
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const scl = r.width / canvas.width;
    const toWin = p => ({ x: r.left + p.x * scl, y: r.top + p.y * scl });

    const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
    const easeIn = p => p * p, easeOut = p => 1 - (1 - p) * (1 - p);
    const BEATS = ['windup', 'absorb', 'collapse', 'converge', 'rebirth'];
    const totalT = BEATS.reduce((s, b) => s + FX_TL[b], 0);
    function beatAt(t) { let acc = 0; for (const b of BEATS) { const d = FX_TL[b];
        if (t < acc + d || b === 'rebirth') return { name: b, p: clamp((t - acc) / d, 0, 1) }; acc += d; }
        return { name: 'rebirth', p: 1 }; }

    const SPIN_TOP = 14, SPIN_CAP = 34, coreR = 15, SKY_R = Math.hypot(fx.width, fx.height) * 0.6;

    const bodies = [];
    for (const o of ORBITERS) {
        const list = o.list(); if (!list.length) continue;
        const c = toWin(o.clumpPos());
        const col = o.color ? o.color() : '#8a8275';
        const size = o.id === 'moon' ? 16 : o.id === 'asteroid' ? 11 : 5;
        const period = (typeof PLANET_DEF !== 'undefined' && PLANET_DEF[o.ring]) ? PLANET_DEF[o.ring].period : 8;
        const spd = (typeof o.speed === 'function') ? o.speed() : 1;
        const w = (2 * Math.PI / period) * spd;
        const pts = o.id === 'dust'
            ? list.map((_, i) => { const a = i / list.length * 6.2832; return { x: c.x + Math.cos(a) * 11, y: c.y + Math.sin(a) * 11 }; })
            : [{ x: c.x, y: c.y }];
        for (const pt of pts) { const dx = pt.x - cx, dy = pt.y - cy, R = Math.hypot(dx, dy) || 1;
            bodies.push({ R, R0: R, A: Math.atan2(dy, dx), w, col, size }); }
    }

    const stars = [];
    for (let i = 0; i < 150; i++) { const a = Math.random() * 6.2832, rr = 50 + Math.random() * SKY_R;
        stars.push({ a, r: rr, v: 0, size: Math.random() * 1.5 + 0.6, tw: Math.random() * 6.28, restSet: false }); }

    let t0 = 0, last = 0, t = 0, done = false;
    function step(ts) {
        const now = ts / 1000; if (!t0) { t0 = now; last = now; }
        const dt = Math.min(now - last, 0.05); last = now; t = now - t0;
        const beat = beatAt(t);

        const dark = beat.name === 'windup' ? 0 : beat.name === 'absorb' ? clamp(beat.p / 0.7, 0, 1) : 1;
        X.fillStyle = `rgb(${Math.round(244 - 234 * dark)},${Math.round(240 - 232 * dark)},${Math.round(232 - 216 * dark)})`;
        X.fillRect(0, 0, fx.width, fx.height);

        let part = 'static', sp = 0;
        if (beat.name === 'converge') { const settleDur = Math.min(4, FX_TL.converge * 0.9), ssp = (FX_TL.converge - settleDur) / FX_TL.converge;
            if (beat.p < ssp) part = 'pull'; else { part = 'settle'; sp = easeOut(clamp((beat.p - ssp) / (1 - ssp), 0, 1)); } }
        for (const s of stars) {
            const tw = 0.6 + 0.4 * Math.sin(t * 2.5 + s.tw); let fade = 1;
            if (part === 'pull') { s.v += 130 * dt; s.r -= s.v * dt; s.a += 0.5 * dt;
                if (s.r < coreR) { s.a = Math.random() * 6.2832; s.r = SKY_R * (0.7 + Math.random() * 0.3); s.v = 20 + Math.random() * 40; }
            } else { if (part === 'settle') { if (!s.restSet) { s.v0 = s.v; s.restSet = true; }
                    s.v = s.v0 * (1 - sp); s.r = Math.max(s.r - s.v * dt, coreR); s.a += 0.5 * dt * (1 - sp); }
                fade = clamp((s.r - 30) / 50, 0, 1); }
            X.fillStyle = `rgba(223,226,240,${0.85 * dark * tw * fade})`;
            X.beginPath(); X.arc(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r, s.size, 0, 6.2832); X.fill();
        }

        let charge = 0;
        if (beat.name === 'absorb') charge = easeIn(beat.p) * 0.8;
        else if (beat.name === 'collapse') charge = 0.8 * (1 - beat.p);
        if (beat.name === 'windup' || beat.name === 'absorb') {
            for (const b of bodies) {
                let w;
                if (beat.name === 'windup') w = b.w * (1 + easeIn(beat.p) * (SPIN_TOP - 1));
                else { b.R = b.R0 * (1 - easeIn(beat.p)); w = Math.min(b.w * SPIN_TOP * (b.R0 / Math.max(b.R, 8)), SPIN_CAP); }
                b.A += w * dt;
                if (b.R < coreR + 2) continue;
                X.fillStyle = b.col; X.beginPath(); X.arc(cx + Math.cos(b.A) * b.R, cy + Math.sin(b.A) * b.R, b.size, 0, 6.2832); X.fill();
            }
        }

        if (charge > 0) { const Rg = coreR * (1 + charge * 1.6), g = X.createRadialGradient(cx, cy, 0, cx, cy, Rg * 2.5);
            g.addColorStop(0, `rgba(230,200,140,${0.5 * charge})`); g.addColorStop(1, 'rgba(230,200,140,0)');
            X.fillStyle = g; X.beginPath(); X.arc(cx, cy, Rg * 2.5, 0, 6.2832); X.fill(); }
        X.fillStyle = '#0a0810'; X.beginPath(); X.arc(cx, cy, coreR, 0, 6.2832); X.fill();

        if (beat.name === 'collapse') { const p = beat.p, flash = clamp(1 - p / 0.25, 0, 1);
            if (flash > 0) { X.fillStyle = `rgba(255,250,240,${flash})`; X.fillRect(0, 0, fx.width, fx.height); }
            const reach = Math.max(fx.width, fx.height) * 0.75;
            X.strokeStyle = `rgba(214,176,90,${clamp(1 - p, 0, 1)})`; X.lineWidth = 4 * (1 - p) + 1;
            X.beginPath(); X.arc(cx, cy, easeOut(p) * reach, 0, 6.2832); X.stroke();
            X.strokeStyle = `rgba(214,176,90,${clamp(0.5 - p, 0, 1)})`;
            X.beginPath(); X.arc(cx, cy, easeOut(clamp(p - 0.12, 0, 1)) * reach, 0, 6.2832); X.stroke(); }

        if (beat.name === 'rebirth') { const p = beat.p, Rg = coreR * (1 + easeOut(p) * 4.2), g = X.createRadialGradient(cx, cy, 0, cx, cy, Rg);
            g.addColorStop(0, `rgba(150,130,210,${0.6 * p})`); g.addColorStop(0.5, `rgba(120,140,200,${0.3 * p})`); g.addColorStop(1, 'rgba(120,140,200,0)');
            X.fillStyle = g; X.beginPath(); X.arc(cx, cy, Rg, 0, 6.2832); X.fill();
            X.fillStyle = '#0a0810'; X.beginPath(); X.arc(cx, cy, coreR, 0, 6.2832); X.fill(); }

        if (t >= totalT + FX_HOLD) { if (!done) { done = true; onDone(); } return; }
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
