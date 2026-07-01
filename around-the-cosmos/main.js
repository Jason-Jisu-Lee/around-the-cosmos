'use strict';

let lastTs = 0, lastSave = 0;
let gameClock = 0, paused = false;

function loop(ts) {
    const dt = Math.min((ts-lastTs)/1000, 0.1);
    lastTs = ts;
    const frozen = (typeof accreting !== 'undefined' && accreting) || paused || (typeof tutorialActive !== 'undefined' && tutorialActive);
    if (!frozen) { gameClock += dt; tickWithDebug(dt); if (typeof checkTutorials === 'function') checkTutorials(); }
    lastSave += dt;
    if (lastSave >= 20) { lastSave=0; saveGame(); }
    draw(gameClock);
    drawVortexLayer();
    drawComet(gameClock);
    updateUI(ts);
    updateCosmoTip();
    requestAnimationFrame(loop);
}

function setPaused(p) {
    if (paused === p) return;
    paused = p;
    document.getElementById('pause-overlay').classList.toggle('show', p);
    const btn = document.getElementById('pause-btn');
    btn.classList.toggle('paused', p);
    btn.innerHTML = p ? '&#9654;' : '&#10074;&#10074;';
    btn.title = p ? 'Resume' : 'Pause';
    if (typeof SoundSystem !== 'undefined') { if (p) SoundSystem.stopMusic(); else SoundSystem.startMusic(); }
}

function resetGame() {
    if (!confirm('Reset ALL progress? This erases everything: stardust, upgrades, AND Mass, then starts a brand-new game.')) return;
    localStorage.clear();
    if (typeof accreting !== 'undefined') accreting = false;
    G = createInitialState();
    if (typeof closeCosmoCard === 'function') closeCosmoCard();
    if (typeof resetPanelAnimations === 'function') resetPanelAnimations();
    buildPanels();
}

function canvasXY(e) { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
canvas.addEventListener('mousedown', e => {
    const [mx, my] = canvasXY(e);
    const tgt = cosmoTargetAt(mx, my);
    if (tgt) openCosmoCard(tgt);
});
canvas.addEventListener('mousemove', e => {
    [cosmoMx, cosmoMy] = canvasXY(e); cosmoOver = true;
});
canvas.addEventListener('mouseleave', () => { cosmoOver = false; });

const COMET_CATCH_R = 48;
window.addEventListener('mousemove', e => { winMx = e.clientX; winMy = e.clientY; });
window.addEventListener('mousedown', e => {
    if (!G.comet) return;
    if (e.target.closest('button, input, label, a, .upgrade-card, .acc-node, #observatory, #settings-panel, #upg-pop, #cosmo-card, .acc-confirm, #accretion-screen')) return;
    const dx = e.clientX - G.comet.x, dy = e.clientY - G.comet.y;
    if (dx*dx + dy*dy < COMET_CATCH_R*COMET_CATCH_R) { catchComet(); e.stopPropagation(); }
}, true);

document.getElementById('mute-btn').addEventListener('click', () => {
    const m=SoundSystem.toggleMute();
    document.getElementById('mute-btn').classList.toggle('muted',m);
});

document.getElementById('pause-btn').addEventListener('click', () => setPaused(!paused));
document.getElementById('pause-overlay').addEventListener('click', () => setPaused(false));

document.getElementById('show-completed').addEventListener('change', e => {
    showCompleted = !e.target.checked;
    buildPanels();
});

let _savedVols = { mv:75, sv:75 };
const _BOOT_EVENTS = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
const _bootAudio = () => {
    SoundSystem.boot(); SoundSystem.startMusic();
    SoundSystem.setMusicVolume(_savedVols.mv); SoundSystem.setSfxVolume(_savedVols.sv);
    if (paused) SoundSystem.stopMusic();
    _BOOT_EVENTS.forEach(ev => window.removeEventListener(ev, _bootAudio));
};
_BOOT_EVENTS.forEach(ev => window.addEventListener(ev, _bootAudio));

function initDraggable(el) {
    el.addEventListener('mousedown', e => {
        if (e.target.closest('button, input, a')) return;
        const rect=el.getBoundingClientRect(), ox=e.clientX-rect.left, oy=e.clientY-rect.top;
        el.style.left=rect.left+'px'; el.style.top=rect.top+'px';
        el.style.bottom='auto'; el.style.right='auto'; el.style.transform='none';
        const onMove=mv => { el.style.left=(mv.clientX-ox)+'px'; el.style.top=(mv.clientY-oy)+'px'; };
        const onUp=() => { document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
        document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); e.preventDefault();
    });
}

window.addEventListener('resize', resize);
window.addEventListener('beforeunload', saveGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);
loadGame(); resize(); buildPanels(); initDebug(); _savedVols=initSettings();
vortexInit();
initDraggable(document.getElementById('observatory'));
requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
