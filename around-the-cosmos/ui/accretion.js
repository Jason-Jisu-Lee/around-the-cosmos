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
           (Star Touch, the orbiters, Resonance…) is undone. You start a fresh universe.</p>
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
        openAccretion();               // land on the Mass page (opaque + stars) — game stays frozen behind it
    });
    // the game only resumes when the player hits "Begin again" (closeAccretion)
}

// Implosion & Rebirth — the live orbiters + stars rush into the Lacuna, white flash + shockwave,
// then a new universe glows. Runs on a full-window overlay canvas centered on the on-screen Lacuna.
function runAccretionFx(onDone) {
    const fx = document.getElementById('accretion-fx');
    fx.style.display = 'block';
    fx.width = innerWidth; fx.height = innerHeight;
    const X = fx.getContext('2d');
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;   // the Lacuna, in window coords
    const scl = r.width / canvas.width;
    const toWin = p => ({ x: r.left + p.x * scl, y: r.top + p.y * scl });

    // snapshot the orbiters as they are right now
    const bodies = [];
    for (const o of ORBITERS) {
        const list = o.list(); if (!list.length) continue;
        const c = toWin(o.clumpPos());
        const col = o.color ? o.color() : '#8a8275';
        const size = o.id === 'moon' ? 16 : o.id === 'asteroid' ? 11 : 5;
        if (o.id === 'dust') {
            for (let i = 0; i < list.length; i++) { const a = i / list.length * 6.283;
                bodies.push({ x: c.x + Math.cos(a) * 11, y: c.y + Math.sin(a) * 11, size, col, v: 0 }); }
        } else bodies.push({ x: c.x, y: c.y, size, col, v: 0 });
    }
    const stars = [];
    for (let i = 0; i < 110; i++) stars.push({ x: Math.random() * fx.width, y: Math.random() * fx.height, r: Math.random() * 1.4 + 0.5 });

    const coreR = 15;
    let phase = 'implode', T = 0, dark = 0, flash = 0, shock = 0, rebirth = 0, last = 0, done = false;

    function step(ts) {
        const now = ts / 1000; if (!last) last = now; const dt = Math.min(now - last, 0.05); last = now; T += dt;
        // parchment fading to deep space as the universe collapses
        dark = Math.min(1, dark + dt * 0.8);
        X.fillStyle = `rgb(${244 - 238 * dark},${240 - 232 * dark},${232 - 216 * dark})`;
        X.fillRect(0, 0, fx.width, fx.height);
        // stars surface as it darkens, then get pulled in
        for (const s of stars) {
            const dx = cx - s.x, dy = cy - s.y, d = Math.hypot(dx, dy) || 1;
            if (phase !== 'rebirth') { s.x += dx / d * dt * 72; s.y += dy / d * dt * 72; }
            X.globalAlpha = dark * 0.7; X.fillStyle = '#dfe2f0';
            X.beginPath(); X.arc(s.x, s.y, s.r, 0, 7); X.fill();
        }
        X.globalAlpha = 1;
        let alive = 0;
        for (const b of bodies) {
            if (b.done) continue; alive++;
            const dx = cx - b.x, dy = cy - b.y, d = Math.hypot(dx, dy) || 1;
            b.v += dt * 850; b.x += dx / d * b.v * dt; b.y += dy / d * b.v * dt;
            if (d < coreR + 4) { b.done = true; continue; }
            X.fillStyle = b.col; X.beginPath(); X.arc(b.x, b.y, b.size, 0, 7); X.fill();
        }
        X.fillStyle = dark > 0.5 ? '#0a0810' : '#1a1a1a';
        X.beginPath(); X.arc(cx, cy, coreR, 0, 7); X.fill();
        if (phase === 'implode' && alive === 0 && T > 0.7) { phase = 'flash'; flash = 1; shock = 0; }
        if (phase === 'flash') {
            X.fillStyle = `rgba(255,250,240,${Math.max(0, flash)})`; X.fillRect(0, 0, fx.width, fx.height);
            flash -= dt * 1.3; shock += dt;
            X.strokeStyle = `rgba(214,176,90,${Math.max(0, 1 - shock * 1.1)})`; X.lineWidth = 4;
            X.beginPath(); X.arc(cx, cy, shock * Math.max(fx.width, fx.height) * 0.6, 0, 7); X.stroke();
            if (flash <= 0) phase = 'rebirth';
        }
        if (phase === 'rebirth') {
            rebirth = Math.min(1, rebirth + dt * 0.7);
            const R = coreR * (1 + rebirth * 3.5), g = X.createRadialGradient(cx, cy, 0, cx, cy, R);
            g.addColorStop(0, `rgba(150,130,210,${0.55 * rebirth})`); g.addColorStop(1, 'rgba(150,130,210,0)');
            X.fillStyle = g; X.beginPath(); X.arc(cx, cy, R, 0, 7); X.fill();
            X.fillStyle = '#0a0810'; X.beginPath(); X.arc(cx, cy, coreR, 0, 7); X.fill();
            if (rebirth >= 1 && !done) { done = true; setTimeout(() => { fx.style.display = 'none'; onDone(); }, 600); }
        }
        if (!done) requestAnimationFrame(step);
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
