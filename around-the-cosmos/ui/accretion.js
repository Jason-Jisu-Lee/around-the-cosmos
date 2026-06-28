'use strict';

const ACC_CATS = ['Maw', 'Orbiters', 'Phenomena', 'Eternity'];

const ACC_MASS_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
    + '<ellipse cx="12" cy="12" rx="10.5" ry="3.9" transform="rotate(-22 12 12)" stroke="#a8853a" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="4.6" fill="#a8853a"/></svg>';

let accCat = 'Maw';
let accBrowse = false;

const ACC_LOCK ='<svg class="acc-lock" width="14" height="14" viewBox="0 0 24 24" fill="none">'
    + '<rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="#a99f88"/>'
    + '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#a99f88" stroke-width="2.1"/></svg>';

// Minimal, uniform-size card: title / one-line effect / cost / progress bar (no level numbers).
// The detailed "math" lives in the hover popup (accNodeDetail) so the card stays simple and fixed-size.
// Minimal card: title + one-line effect. Cost badge top-LEFT, level badge (X/Y) top-RIGHT.
function accNodeHTML(u) {
    // Locked tier: keep the box, no badge/hover. Reveal the NAME only for the next tier;
    // deeper (still-sealed) tiers show a lock icon instead of the title - no readable name.
    if (massNodeVis(u) === 'locked') {
        const reveal = u.tier === singularityLevel() + 1;
        return `<div class="acc-node locked" data-uid="${u.id}">`
            + (reveal ? `<div class="acc-nm">${u.name}</div>` : `<div class="acc-nlock">${ACC_LOCK}</div>`)
            + `</div>`;
    }
    const planned = u.placeholder;
    const l = mlvl(u.id), maxed = !planned && l >= u.max;
    const afford = !accBrowse && !planned && !maxed && G.mass >= u.costs[l];
    let state, desc, costBadge = '', lvlBadge = '';
    if (planned) {
        state = 'next';
        desc = `<div class="acc-ndesc">${u.eff(1)}</div>`;
        lvlBadge = `<div class="acc-badge soon">soon</div>`;
    } else {
        state = maxed ? 'max' : (l > 0 ? 'up' : 'avail');
        desc = `<div class="acc-ndesc">${u.eff(l)}</div>`;
        lvlBadge = maxed ? `<div class="acc-badge done">✓</div>` : `<div class="acc-badge">${l}/${u.max}</div>`;
        if (!maxed) costBadge = `<div class="acc-badge cost${afford ? ' ok' : ''}">${u.costs[l]}</div>`;
    }
    const idAttr = afford ? ` data-id="${u.id}"` : '';
    return `<div class="acc-node ${state}${afford ? ' buy' : ''}" data-uid="${u.id}"${idAttr}>`
        + costBadge + lvlBadge + `<div class="acc-nm">${u.name}</div>${desc}</div>`;
}

// Hover popup - kept tiny: just the plain-English description, plus the next-level effect.
function accNodeDetail(u) {
    if (massNodeVis(u) === 'locked' || u.placeholder) {
        return `<div class="acc-pop-d">${u.flavor}</div>`;
    }
    const l = mlvl(u.id), maxed = l >= u.max;
    let d = `<div class="acc-pop-d">${u.flavor}</div>`;
    if (!maxed) d += `<div class="acc-pop-next">Next: ${u.eff(l + 1)}</div>`;
    return d;
}

// The Singularity spine gate. done = captured (pressed-in, no label), avail = next to buy (cost badge), locked = ???.
// `active` = the gate is captured or the next-available one -> it gets a rail line; locked gates beyond have none.
function accGateHTML(t, first, last, active) {
    const lv = singularityLevel(), cost = SINGULARITY.costs[t - 1];
    const state = lv >= t ? 'done' : lv === t - 1 ? 'avail' : 'locked';
    const buy = !accBrowse && state === 'avail' && G.mass >= cost;
    const idAttr = buy ? ` data-spine="${t}"` : '';
    const name = state === 'locked' ? '???' : SINGULARITY.orbiters[t - 1];
    // cost on the top-LEFT corner; nothing on the right (gates have only one level)
    const costBadge = state === 'avail' ? `<div class="acc-badge cost${buy ? ' ok' : ''}">${cost}</div>` : '';
    const cell = (active ? ' line' : '') + (first ? ' first' : '') + (last ? ' last' : '');
    return `<div class="acc-gatecell${cell}">`
        + `<div class="acc-gate ${state}${buy ? ' buy' : ''}" data-gate="${t}"${idAttr}>`
        +   costBadge + `<div class="acc-gorb">${name}</div>`
        + `</div></div>`;
}

function accGateDetail(t) {
    const lv = singularityLevel(), orb = SINGULARITY.orbiters[t - 1];
    if (lv >= t || lv === t - 1) return `<div class="acc-pop-d"><b>${orb}</b> enters the orbit.</div>`;
    return `<div class="acc-pop-d">Sealed — capture the earlier orbiters first.</div>`;
}

function accTreeHTML(cat) {
    // The rail only connects captured tiers + the next available one; locked tiers beyond have no line.
    const lvl = singularityLevel(), lineMax = Math.min(lvl + 1, SINGULARITY.tiers);
    let h = '<div class="acc-railwrap"><div class="acc-rail">';
    for (let t = 1; t <= SINGULARITY.tiers; t++) {
        const nodes = massTierNodes(cat, t), active = t <= lineMax;
        h += accGateHTML(t, t === 1, t === lineMax, active)
           + `<div class="acc-branch${active ? '' : ' noline'}"></div>`
           + `<div class="acc-tiernodes">${nodes.map(accNodeHTML).join('')}</div>`
           + `<div class="acc-rspacer"></div>`;   // balances the spine column so the cards stay page-centred
    }
    return h + '</div></div>';
}

function showAccPop(html, el) {
    const pop = document.getElementById('acc-pop'); if (!pop) return;
    pop.innerHTML = html; pop.classList.add('show');
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = r.right + 12;
    if (x + pw > innerWidth - 8) x = r.left - pw - 12;   // flip left if it would clip the edge
    x = Math.max(8, x);
    const y = Math.max(8, Math.min(r.top + r.height / 2 - ph / 2, innerHeight - ph - 8));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function hideAccPop() { const pop = document.getElementById('acc-pop'); if (pop) pop.classList.remove('show'); }

function accRender() {
    document.getElementById('acc-mass').innerHTML = ACC_MASS_ICON
        + `<div class="num">${fmtNum(G.mass)}</div><div class="lbl">Mass</div>`;

    const tabs = document.getElementById('acc-tabs');
    tabs.innerHTML = ACC_CATS.map(c =>
        `<button class="acc-tab${c === accCat ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
    tabs.querySelectorAll('.acc-tab').forEach(b =>
        b.addEventListener('click', () => { accCat = b.dataset.c; accRender(); }));

    const tree = document.getElementById('acc-tree');
    tree.innerHTML = accTreeHTML(accCat);
    tree.querySelectorAll('.acc-node').forEach(node => {
        node.addEventListener('mouseenter', () => {
            const u = MASS_BY_ID[node.dataset.uid];
            if (u && massNodeVis(u) !== 'locked') { SoundSystem.sfxHover(); showAccPop(accNodeDetail(u), node); }  // locked = no hover
        });
        node.addEventListener('mouseleave', hideAccPop);
    });
    tree.querySelectorAll('.acc-gate').forEach(gate => {
        gate.addEventListener('mouseenter', () => {
            const t = +gate.dataset.gate;
            if (singularityLevel() >= t - 1) { SoundSystem.sfxHover(); showAccPop(accGateDetail(t), gate); }  // captured/next only
        });
        gate.addEventListener('mouseleave', hideAccPop);
    });
    tree.querySelectorAll('.acc-node[data-id]').forEach(node =>
        node.addEventListener('click', () => { if (buyMassUpgrade(node.dataset.id)) { hideAccPop(); accRender(); } }));
    tree.querySelectorAll('.acc-gate[data-spine]').forEach(gate =>
        gate.addEventListener('click', () => { if (buySingularity()) { hideAccPop(); accRender(); } }));

    document.getElementById('acc-undo').style.display = (!accBrowse && canUndoMass()) ? 'block' : 'none';
}

function openAccretion() {
    accBrowse = false;
    resetMassBuyLog();
    const screen = document.getElementById('accretion-screen');
    screen.classList.remove('browse');
    document.getElementById('acc-return').textContent = 'Return to the Cosmos';
    screen.classList.add('show'); accRender(); startAccStars();
}

function openMassBrowse() {
    if (accreting) return;
    accBrowse = true;
    const screen = document.getElementById('accretion-screen');
    screen.classList.add('browse');
    document.getElementById('acc-return').textContent = 'Back';
    screen.classList.add('show'); accRender();
}
function closeMassBrowse() {
    const screen = document.getElementById('accretion-screen');
    screen.classList.remove('show'); screen.classList.remove('browse');
    accBrowse = false;
}

function onAccBack() {
    if (accBrowse) closeMassBrowse();
    else openAccLeaveConfirm();
}

function openAccLeaveConfirm()  { document.getElementById('acc-leave-confirm').classList.add('show'); }
function closeAccLeaveConfirm() { document.getElementById('acc-leave-confirm').classList.remove('show'); }

function closeAccretion() {
    closeAccLeaveConfirm();
    document.getElementById('accretion-screen').classList.remove('show');
    accStarsRunning = false;
    accreting = false;
    try { accretionAudio.pause(); accretionAudio.currentTime = 0; } catch (_) {}
    if (typeof SoundSystem !== 'undefined') SoundSystem.startMusic();
}

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

function musicMuted() {
    if (typeof SoundSystem !== 'undefined' && SoundSystem.isMuted()) return true;
    const el = document.getElementById('vol-music');
    return el ? parseInt(el.value, 10) === 0 : false;
}

function accConfirmBody() {
    const gain = massGain();
    const me = massEarnable();
    const curThresh  = ACCRETION_THRESHOLD * me / MASS_COEF;          // linear inverse of massEarnable
    const nextThresh = ACCRETION_THRESHOLD * (me + 1) / MASS_COEF;
    const needed = Math.max(0, Math.ceil(nextThresh - G.runDust));
    const prog   = Math.max(0.02, Math.min(1, (G.runDust - curThresh) / Math.max(1, nextThresh - curThresh)));
    // "Skip animation" moved OUTSIDE the box (toggled in openAccConfirm); body tail is just the first-run music hint
    const tail = (G.massEarned === 0 && musicMuted())
        ? `<p class="acc-mutehint">♪ The collapse is set to music. Recommend unmuting to hear it.</p>` : '';
    const UP = `<svg class="acc-up" width="13" height="13" viewBox="0 0 16 16"><g fill="currentColor">`
             + `<rect x="1" y="1" width="6" height="6" rx="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.4"/>`
             + `<rect x="1" y="9" width="6" height="6" rx="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.4"/></g></svg>`;
    return `
        <div class="acc-ledger">
            <div class="acc-col lose">
                <div class="acc-colh">Resets</div>
                <div class="acc-colbody">
                    <div class="acc-it"><span class="acc-star">✦</span> Stardust</div>
                    <div class="acc-it">${UP} Upgrades</div>
                </div>
            </div>
            <div class="acc-arrowmid">⟶</div>
            <div class="acc-col keep">
                <div class="acc-colh">Mass gained</div>
                <div class="acc-colbody">
                    <div class="acc-orb"></div>
                    <div class="acc-amt">+${gain}</div>
                </div>
            </div>
        </div>
        <p class="acc-explain">All Stardust and orbiters collapse into Mass<br>Mass can be used for permanent upgrades</p>
        <div class="acc-next2">
            <div class="acc-nextrow"><span class="acc-nextt">Next Mass</span><span class="acc-nextv"><span class="acc-star">✦</span> ${fmtNum(needed)} to go</span></div>
            <div class="acc-bar"><i style="width:${(prog*100).toFixed(0)}%"></i></div>
        </div>${tail}`;
}
function openAccConfirm() {
    document.getElementById('acc-confirm-body').innerHTML = accConfirmBody();
    // First-ever accretion: spell out the hold in the label; afterwards just "Collapse"
    document.querySelector('#acc-confirm-go .acc-go-label').textContent = G.massEarned === 0 ? 'Collapse (Hold)' : 'Collapse';
    // "Skip animation" (outside the box) only after the first accretion; reset to the default (checked = skip)
    const skip = document.getElementById('acc-skip-outer'), cb = document.getElementById('acc-skip-anim');
    if (skip) skip.style.display = G.massEarned > 0 ? 'inline-flex' : 'none';
    if (cb) cb.checked = false;   // default: NOT skipped - the user must opt in to skipping
    document.getElementById('acc-confirm').classList.add('show');
}
function closeAccConfirm() { document.getElementById('acc-confirm').classList.remove('show'); }

let accreting = false;

const accretionAudio = new Audio('sound/music/accretion-1.mp3');
accretionAudio.volume = 0.68;

function startAccretionSequence() {
    // The FIRST-ever accretion always plays the animation no matter what (massEarned isn't bumped until commitAccretion below);
    // afterwards, honour the checkbox.
    const skipAnim = G.massEarned > 0 && !!document.getElementById('acc-skip-anim').checked;
    closeAccConfirm();
    if (typeof closeCosmoCard === 'function') closeCosmoCard();
    if (typeof SoundSystem !== 'undefined') SoundSystem.stopMusic();
    commitAccretion();
    accreting = true;
    G.comet = null;

    if (skipAnim) {
        resetUniverse();
        openAccretion();
        const screen = document.getElementById('accretion-screen');
        screen.style.transition = 'opacity 0.4s ease'; screen.style.opacity = '0';
        requestAnimationFrame(() => requestAnimationFrame(() => { screen.style.opacity = '1'; }));
        setTimeout(() => { screen.style.transition = ''; screen.style.opacity = ''; }, 700);
        return;
    }

    if (typeof SoundSystem === 'undefined' || !SoundSystem.isMuted()) {
        try { accretionAudio.currentTime = 0; accretionAudio.play().catch(() => {}); } catch (_) {}
    }
    runAccretionFx(() => {
        resetUniverse();
        openAccretion();
        const FADE = 5;
        const screen = document.getElementById('accretion-screen');
        const fx = document.getElementById('accretion-fx');
        screen.style.opacity = '0'; screen.style.transition = `opacity ${FADE}s ease-in-out`;
        requestAnimationFrame(() => requestAnimationFrame(() => { screen.style.opacity = '1'; }));
        setTimeout(() => { fx.style.display = 'none'; screen.style.transition = ''; screen.style.opacity = ''; }, FADE * 1000 + 200);
    });
}

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

document.getElementById('acc-undo').addEventListener('click', () => { if (undoLastMassUpgrade()) accRender(); });
document.getElementById('acc-return').addEventListener('click', onAccBack);
document.getElementById('acc-confirm-cancel').addEventListener('click', closeAccConfirm);

(function initCollapseHold() {
    const btn = document.getElementById('acc-confirm-go');
    if (!btn) return;
    const fx = btn.querySelector('.acc-go-fx'), ctx = fx.getContext('2d');
    const HOLD_MS = 1000, TAU = Math.PI * 2;
    let holding = false, holdStart = 0, raf = null, parts = [];

    function frame(now) {
        const r = btn.getBoundingClientRect(), W = r.width, H = r.height, cx = W/2, cy = H/2;
        const dpr = window.devicePixelRatio || 1;
        if (fx.width !== Math.round(W*dpr)) { fx.width = Math.round(W*dpr); fx.height = Math.round(H*dpr); }
        ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
        const elapsed = now - holdStart, p = Math.min(1, elapsed/HOLD_MS);

        if (holding) {
            const n = 3 + Math.round(p*6);
            for (let i=0;i<n;i++) {
                const a = Math.random()*TAU, rad = (W*0.5)*(0.4 + Math.random()*0.55);
                parts.push({ x: cx+Math.cos(a)*rad, y: cy+Math.sin(a)*rad*(H/W), sz: 0.5+Math.random()*1.4, life: 0, max: 0.45+Math.random()*0.4 });
            }
        }
        for (let i=parts.length-1;i>=0;i--) {
            const q = parts[i]; q.life += 0.0166; const k = q.life/q.max;
            if (k>=1) { parts.splice(i,1); continue; }
            q.x += (cx-q.x)*0.14; q.y += (cy-q.y)*0.14;
            ctx.fillStyle = `rgba(255,251,236,${Math.sin(k*Math.PI)*0.95})`;
            ctx.beginPath(); ctx.arc(q.x, q.y, q.sz*(1-k*0.4), 0, TAU); ctx.fill();
        }
        if (holding && p>0.05) {
            const g = ctx.createRadialGradient(cx,cy,0,cx,cy,W*0.42*p);
            g.addColorStop(0, `rgba(255,250,235,${0.45*p})`); g.addColorStop(1,'rgba(255,250,235,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx,cy,W*0.42*p,0,TAU); ctx.fill();
        }
        if (holding && elapsed >= HOLD_MS) {
            holding = false; parts.length = 0; ctx.clearRect(0,0,W,H);
            cancelAnimationFrame(raf); raf = null;
            startAccretionSequence();
            return;
        }
        if (!holding && parts.length === 0) { ctx.clearRect(0,0,W,H); cancelAnimationFrame(raf); raf = null; return; }
        raf = requestAnimationFrame(frame);
    }
    function start(e) {
        if (holding) return;
        e.preventDefault();
        holding = true; holdStart = performance.now(); parts = [];
        cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    }
    const stop = () => { holding = false; };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive:false });
    btn.addEventListener('mouseleave', stop);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
})();
document.getElementById('acc-leave-stay').addEventListener('click', closeAccLeaveConfirm);
document.getElementById('acc-leave-go').addEventListener('click', closeAccretion);
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('acc-leave-confirm').classList.contains('show')) closeAccLeaveConfirm();
    else if (document.getElementById('acc-confirm').classList.contains('show')) closeAccConfirm();
    else if (document.getElementById('accretion-screen').classList.contains('show')) onAccBack();
});
