'use strict';

/* Accretion (prestige) screen — Tabs layout. Opens from #accretion-btn, overlays the live
   main page (the looping sky shows faintly through). Tree data is placeholder for now;
   real Mass economy + upgrades come later. */

const ACC_CATS = ['Lacuna', 'Orbiters', 'Phenomena', 'Cycles'];
const ACC_SUB  = {
    Lacuna:   'The dark center, deepened.',
    Orbiters: 'Bodies that circle and pay.',
    Phenomena:'Comets, light, rare events.',
    Cycles:   'Time, rhythm, automation.',
};

// ringed accreting mass — deliberately not a star
const ACC_MASS_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
    + '<ellipse cx="12" cy="12" rx="10.5" ry="3.9" transform="rotate(-22 12 12)" stroke="#a8853a" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="4.6" fill="#a8853a"/></svg>';

// [state, level, max] — irregular tier widths + irregular availability (placeholder)
const ACC_TREE = {
    Lacuna: [
        [['max',5,5]],
        [['up',4,5],['up',2,4]],
        [['avail',0,5],['avail',0,5]],
        [['lock',0,3],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5]],
    ],
    Orbiters: [
        [['max',5,5],['max',3,3]],
        [['up',3,5],['up',1,4],['avail',0,5]],
        [['avail',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5]],
    ],
    Phenomena: [
        [['max',5,5]],
        [['up',3,5],['up',2,5]],
        [['avail',0,5],['avail',0,5],['avail',0,5]],
        [['avail',0,5],['avail',0,5],['lock',0,5]],
    ],
    Cycles: [
        [['max',4,4]],
        [['up',2,5]],
        [['avail',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5],['lock',0,5]],
    ],
};

let accCat = 'Lacuna';

function accTreeHTML(name) {
    let k = 1;
    return ACC_TREE[name].map((tier, ti) => {
        const nodes = tier.map(([s, l, m]) => {
            const pct = s === 'max' ? 100 : (m ? Math.round(l / m * 100) : 0);
            const lv  = s === 'max' ? 'MAX' : `${l} / ${m}`;
            return `<div class="acc-node ${s}"><div class="acc-nrow"><span class="acc-nm">Dummy #${k++}</span>`
                + `<span class="acc-lv">${lv}</span></div><div class="acc-bar"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
        return (ti ? '<div class="acc-conn"></div>' : '') + `<div class="acc-tier">${nodes}</div>`;
    }).join('');
}

function accRender() {
    document.getElementById('acc-mass').innerHTML = ACC_MASS_ICON
        + `<div class="num">${fmtNum(G.mass)}</div><div class="lbl">Mass</div>`;

    const tabs = document.getElementById('acc-tabs');
    tabs.innerHTML = ACC_CATS.map(c =>
        `<button class="acc-tab${c === accCat ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
    tabs.querySelectorAll('.acc-tab').forEach(b =>
        b.addEventListener('click', () => { accCat = b.dataset.c; accRender(); }));

    document.getElementById('acc-title').textContent = accCat;
    document.getElementById('acc-sub').textContent   = ACC_SUB[accCat];
    document.getElementById('acc-tree').innerHTML     = accTreeHTML(accCat);
}

function openAccretion()  { document.getElementById('accretion-screen').classList.add('show'); accRender(); startAccStars(); }
// "Begin again" — leave the Mass page; the freshly-born universe resumes.
function closeAccretion() {
    document.getElementById('accretion-screen').classList.remove('show');
    accStarsRunning = false;
    accreting = false;   // unfreeze: the new universe begins
    try { accretionAudio.pause(); accretionAudio.currentTime = 0; } catch (_) {}  // stop the cue if still playing
    if (typeof SoundSystem !== 'undefined') SoundSystem.startMusic();  // music returns with the new universe
}

// The Mass page is opaque (hides the sky/panels/observatory entirely); it draws the SAME
// looping background stars so only "background color + stars" show behind the UI.
let accStarsRunning = false;
function startAccStars() {
    const cnv = document.getElementById('acc-stars');
    const g = cnv.getContext('2d');
    accStarsRunning = true;
    (function loop(ts) {
        if (!accStarsRunning) return;
        if (cnv.width !== innerWidth || cnv.height !== innerHeight) { cnv.width = innerWidth; cnv.height = innerHeight; }
        g.clearRect(0, 0, cnv.width, cnv.height);
        drawStars((ts || 0) / 1000, g, cnv.width, cnv.height);
        requestAnimationFrame(loop);
    })(performance.now());
}

// Plain-language confirmation before committing an Accretion.
function accConfirmBody() {
    const gain = massGain();
    return `<p>This pulls everything in your universe into the Lacuna and collapses it.</p>
        <p class="acc-gain">You'll gain <b>${gain} Mass</b>.</p>
        <p>Mass comes from <b>all the stardust you've ever gathered</b> (${fmtNum(G.totalDust)} so far).
           The more you collect over your whole journey, the more Mass — so it grows slowly, and
           re-earning the same amount again barely adds any.</p>
        <p><b>What resets:</b> your stardust drops to zero and every stardust upgrade
           (Cosmic Pulse, the orbiters, Resonance…) is undone. You start a fresh universe.</p>
        <p><b>What you keep:</b> your Mass, and anything you spend it on.</p>`;
}
function openAccConfirm() {
    document.getElementById('acc-confirm-body').innerHTML = accConfirmBody();
    document.getElementById('acc-confirm').classList.add('show');
}
function closeAccConfirm() { document.getElementById('acc-confirm').classList.remove('show'); }

// ===== The Accretion sequence =====
// confirm → credit Mass + freeze + hide UI → absorption animation → collapse/reset → Mass page
let accreting = false;

// One-shot accretion cue, played over the (otherwise silenced) animation.
const accretionAudio = new Audio('sound/music/accretion-1.mp3');
accretionAudio.volume = 0.8;

function startAccretionSequence() {
    closeAccConfirm();
    if (typeof closeCosmoCard === 'function') closeCosmoCard();  // dismiss any pinned info card
    if (typeof SoundSystem !== 'undefined') SoundSystem.stopMusic();  // silence — music + (frozen) SFX
    // play the accretion cue once (respect the mute button)
    if (typeof SoundSystem === 'undefined' || !SoundSystem.isMuted()) {
        try { accretionAudio.currentTime = 0; accretionAudio.play().catch(() => {}); } catch (_) {}
    }
    commitAccretion();                 // Mass credited NOW — the major event has happened
    accreting = true;                  // freeze the sim (no earning/comets) — stays frozen through the Mass page
    G.comet = null;
    runAccretionFx(() => {
        resetUniverse();               // the collapse: full reset, keeps Mass / lifetime stardust / time
        openAccretion();               // build the Mass page (opaque + stars) — game stays frozen behind it
        // gently fade the Mass page in over 5s over the held FX final frame, then drop the FX backdrop
        const FADE = 5;                // seconds
        const screen = document.getElementById('accretion-screen');
        const fx = document.getElementById('accretion-fx');
        screen.style.opacity = '0'; screen.style.transition = `opacity ${FADE}s ease-in-out`;
        // double rAF: the first commits opacity:0 on the just-shown element, the second flips to 1 so the transition runs
        requestAnimationFrame(() => requestAnimationFrame(() => { screen.style.opacity = '1'; }));
        setTimeout(() => { fx.style.display = 'none'; screen.style.transition = ''; screen.style.opacity = ''; }, FADE * 1000 + 200);
    });
    // the game only resumes when the player hits "Begin again" (closeAccretion)
}

// Singularity collapse & Rebirth — choreographed to accretion-1.mp3 in 5 timed beats:
//   WINDUP   orbiters spin up from their CURRENT speed on the bright parchment
//   ABSORB   they spiral into the Lacuna while the background darkens (stars reveal)
//   COLLAPSE white flash + gold shockwave (the flash lands at 19.15s)
//   CONVERGE the starfield streams in & recycles (endless), then settles to a calm field
//   REBIRTH  the new universe blooms, then -> onDone (reset + Mass page)
// Runs on a full-window overlay canvas centered on the on-screen Lacuna.
const FX_TL = { windup: 15.0, absorb: 4.15, collapse: 2.55, converge: 10.0, rebirth: 2.5 };
const FX_HOLD = 3.0;   // hold the final calm frame (music still playing) before the Mass page fades in
function runAccretionFx(onDone) {
    const fx = document.getElementById('accretion-fx');
    fx.style.display = 'block';
    fx.width = innerWidth; fx.height = innerHeight;
    const X = fx.getContext('2d');
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;   // the Lacuna, in window coords
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

    // snapshot the live orbiters as polar bodies around the Lacuna, each with its REAL
    // current angular speed (clump orbit speed) so the wind-up starts from where it is now
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

    // starfield — hidden on the bright background, revealed only as space darkens
    const stars = [];
    for (let i = 0; i < 150; i++) { const a = Math.random() * 6.2832, rr = 50 + Math.random() * SKY_R;
        stars.push({ a, r: rr, v: 0, size: Math.random() * 1.5 + 0.6, tw: Math.random() * 6.28, restSet: false }); }

    // Beat clock is ABSOLUTE WALL TIME (t0-anchored), never an accumulation of clamped deltas —
    // the music runs on the same real-time clock, so the two stay locked regardless of frame rate,
    // GC/decode hitches, or how many orbiters are on screen. `dt` (clamped) is used ONLY for the
    // smooth star/body physics integration, where a frame skip shouldn't teleport things.
    let t0 = 0, last = 0, t = 0, done = false;
    function step(ts) {
        const now = ts / 1000; if (!t0) { t0 = now; last = now; }
        const dt = Math.min(now - last, 0.05); last = now; t = now - t0;
        const beat = beatAt(t);

        // background: parchment during wind-up, darkens through absorption, deep space after
        const dark = beat.name === 'windup' ? 0 : beat.name === 'absorb' ? clamp(beat.p / 0.7, 0, 1) : 1;
        X.fillStyle = `rgb(${Math.round(244 - 234 * dark)},${Math.round(240 - 232 * dark)},${Math.round(232 - 216 * dark)})`;
        X.fillRect(0, 0, fx.width, fx.height);

        // stars: pull in & recycle during convergence, then settle to a calm field in place
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

        // orbiters: wind-up spins them up from current speed; absorb spirals them in; gone after
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

        // the Lacuna core (+ accretion heat building as bodies fall in)
        if (charge > 0) { const Rg = coreR * (1 + charge * 1.6), g = X.createRadialGradient(cx, cy, 0, cx, cy, Rg * 2.5);
            g.addColorStop(0, `rgba(230,200,140,${0.5 * charge})`); g.addColorStop(1, 'rgba(230,200,140,0)');
            X.fillStyle = g; X.beginPath(); X.arc(cx, cy, Rg * 2.5, 0, 6.2832); X.fill(); }
        X.fillStyle = '#0a0810'; X.beginPath(); X.arc(cx, cy, coreR, 0, 6.2832); X.fill();

        // collapse: white flash + gold shockwave
        if (beat.name === 'collapse') { const p = beat.p, flash = clamp(1 - p / 0.25, 0, 1);
            if (flash > 0) { X.fillStyle = `rgba(255,250,240,${flash})`; X.fillRect(0, 0, fx.width, fx.height); }
            const reach = Math.max(fx.width, fx.height) * 0.75;
            X.strokeStyle = `rgba(214,176,90,${clamp(1 - p, 0, 1)})`; X.lineWidth = 4 * (1 - p) + 1;
            X.beginPath(); X.arc(cx, cy, easeOut(p) * reach, 0, 6.2832); X.stroke();
            X.strokeStyle = `rgba(214,176,90,${clamp(0.5 - p, 0, 1)})`;
            X.beginPath(); X.arc(cx, cy, easeOut(clamp(p - 0.12, 0, 1)) * reach, 0, 6.2832); X.stroke(); }

        // rebirth bloom
        if (beat.name === 'rebirth') { const p = beat.p, Rg = coreR * (1 + easeOut(p) * 4.2), g = X.createRadialGradient(cx, cy, 0, cx, cy, Rg);
            g.addColorStop(0, `rgba(150,130,210,${0.6 * p})`); g.addColorStop(0.5, `rgba(120,140,200,${0.3 * p})`); g.addColorStop(1, 'rgba(120,140,200,0)');
            X.fillStyle = g; X.beginPath(); X.arc(cx, cy, Rg, 0, 6.2832); X.fill();
            X.fillStyle = '#0a0810'; X.beginPath(); X.arc(cx, cy, coreR, 0, 6.2832); X.fill(); }

        // hold the final calm frame for FX_HOLD seconds (music keeps playing), then hand off.
        // onDone fades the Mass page in over the still-showing FX backdrop and removes it after.
        if (t >= totalT + FX_HOLD) { if (!done) { done = true; onDone(); } return; }
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

document.getElementById('accretion-btn').addEventListener('click', openAccConfirm);
document.getElementById('acc-return').addEventListener('click', closeAccretion);
document.getElementById('acc-confirm-cancel').addEventListener('click', closeAccConfirm);
document.getElementById('acc-confirm-go').addEventListener('click', startAccretionSequence);
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('acc-confirm').classList.contains('show')) closeAccConfirm();
    else if (document.getElementById('accretion-screen').classList.contains('show')) closeAccretion();
});
