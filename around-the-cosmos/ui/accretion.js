'use strict';

// The Accretion (prestige) FLOW: opening/closing the Mass page, the collapse confirm modal, the
// hold-to-confirm button, and orchestrating the sequence (commit -> freeze -> FX -> reset -> Mass page).
// The Mass-page rendering lives in ui/mass-tree.js (accRender, accCat/accBrowse); the collapse
// animation lives in ui/accretion-fx.js (runAccretionFx). Both load before this file.

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
    const unit = massUnit();
    const curThresh  = unit * (me / FIRST_GRANT) * (me / FIRST_GRANT);                  // runDust banked toward `me` Mass (inverse of the FIRST_GRANT·sqrt curve)
    const nextThresh = unit * ((me + 1) / FIRST_GRANT) * ((me + 1) / FIRST_GRANT);      // runDust needed for the next Mass
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
    // afterwards, honour the checkbox. (debugSkipAcc is a debug-only override that skips even the first.)
    const skipAnim = (typeof debugSkipAcc !== 'undefined' && debugSkipAcc)
        || (G.massEarned > 0 && !!document.getElementById('acc-skip-anim').checked);
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

// ----- wiring -----
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

// ----- End-of-demo modal (the "Finish Demo" spine gate, mass-tree.js opens this instead of buying) -----
function openDemoFinish()  { document.getElementById('demo-finish').classList.add('show'); }
function closeDemoFinish() { document.getElementById('demo-finish').classList.remove('show'); }   // "Stay in the Cosmos" = cancel
function demoFinish() {   // "Finish" = wipe everything and return to the very beginning, nothing kept
    closeDemoFinish();
    document.getElementById('accretion-screen').classList.remove('show');
    accStarsRunning = false;
    accreting = false;
    try { accretionAudio.pause(); accretionAudio.currentTime = 0; } catch (_) {}
    localStorage.clear();
    G = createInitialState();
    if (typeof closeCosmoCard === 'function') closeCosmoCard();
    if (typeof resetPanelAnimations === 'function') resetPanelAnimations();
    buildPanels();
    if (typeof SoundSystem !== 'undefined') SoundSystem.startMusic();
}
document.getElementById('demo-finish-go').addEventListener('click', demoFinish);
document.getElementById('demo-finish-stay').addEventListener('click', closeDemoFinish);

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('demo-finish').classList.contains('show')) closeDemoFinish();
    else if (document.getElementById('acc-leave-confirm').classList.contains('show')) closeAccLeaveConfirm();
    else if (document.getElementById('acc-confirm').classList.contains('show')) closeAccConfirm();
    else if (document.getElementById('accretion-screen').classList.contains('show')) onAccBack();
});
