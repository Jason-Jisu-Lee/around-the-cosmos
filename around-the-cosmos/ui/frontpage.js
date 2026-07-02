'use strict';

// Front page ("The Slow Zoom", design 8 of test/frontpage-designs.html): a dark starfield
// drifting past as the camera pushes toward one gold dot, the title breathing in from wide
// letter-spacing, a single centered START button, and "By 2ndIntelligentWorld" top-right.
// Shown on every load and reopened by the FRONT PAGE button in settings. While open the game
// is frozen (main.js `frozen` reads `frontpageActive`) and the music is silent; START closes
// it (that click doubles as the audio-boot gesture, so the music starts right after).

let frontpageActive = true;   // true from load until the first START

let _fpCtx = null, _fpStars = [];

function _fpCanvas() { return document.getElementById('front-stars'); }

function _fpResize() {
    const c = _fpCanvas(), dpr = devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    _fpCtx = c.getContext('2d'); _fpCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Called every frame from the main loop; no-op when closed. Star drift is per-frame state and
// the dot pulse uses wall time, so the animation runs while the game clock is frozen.
function drawFrontpage() {
    if (!frontpageActive) return;
    if (!_fpCtx) _fpResize();
    const g = _fpCtx, W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2;
    if (!_fpStars.length)
        _fpStars = Array.from({ length: 170 }, () => ({ a: Math.random() * 6.28, r: Math.random(), s: 0.5 + Math.random() }));
    g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, H);
    const RM = Math.hypot(W, H) / 2;
    for (const s of _fpStars) {
        s.r += 0.0006 * s.s;               // slow outward drift = the camera pushing in
        if (s.r > 1) s.r = 0.02;
        const rr = Math.pow(s.r, 1.6) * RM;
        g.fillStyle = `rgba(226,218,196,${Math.min(0.85, 0.15 + s.r * 1.1).toFixed(3)})`;
        g.beginPath(); g.arc(cx + Math.cos(s.a) * rr, cy + Math.sin(s.a) * rr, 0.6 + s.r * 1.7, 0, 7); g.fill();
    }
    const t = performance.now() / 1000;
    g.fillStyle = '#c9a24a';
    g.beginPath(); g.arc(cx, cy, 2.6 + 0.5 * Math.sin(t * 2), 0, 7); g.fill();
}

function openFrontpage() {
    frontpageActive = true;
    const el = document.getElementById('frontpage');
    el.classList.add('show');
    // restart the title/button entrance animations on every open
    el.querySelectorAll('.front-title, #front-start').forEach(e => { e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; });
    if (typeof SoundSystem !== 'undefined') SoundSystem.stopMusic();
}

function closeFrontpage() {
    frontpageActive = false;
    document.getElementById('frontpage').classList.remove('show');
    if (typeof SoundSystem !== 'undefined' && typeof paused !== 'undefined' && !paused) SoundSystem.startMusic();
}

function initFrontpage() {
    document.getElementById('frontpage').classList.add('show');
    document.getElementById('front-start').addEventListener('click', closeFrontpage);
    document.getElementById('front-page-btn').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.remove('open');
        openFrontpage();
    });
    addEventListener('resize', () => { _fpCtx = null; });
}
