'use strict';



let lastTs = 0, lastSave = 0;

// gameClock is the single animation clock the whole game draws from. It advances ONLY while the
// game is live — so pausing (or the Accretion freeze) stops the sim AND every visual (orbits,
// twinkles, glow, the pulse bounce) at once. simulation.js triggers the pulse FX off this clock too.
let gameClock = 0, paused = false;

function loop(ts) {
    const dt = Math.min((ts-lastTs)/1000, 0.1);
    lastTs = ts;
    const frozen = (typeof accreting !== 'undefined' && accreting) || paused;
    if (!frozen) { gameClock += dt; tickWithDebug(dt); }   // both sim + clock stop when frozen
    lastSave += dt;
    if (lastSave >= 20) { lastSave=0; saveGame(); }
    draw(gameClock);
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
    btn.innerHTML = p ? '&#9654;' : '&#10074;&#10074;';   // ▶ resume  /  ❚❚ pause
    btn.title = p ? 'Resume' : 'Pause';
    if (typeof SoundSystem !== 'undefined') { if (p) SoundSystem.stopMusic(); else SoundSystem.startMusic(); }
}

function resetGame() {
    if (!confirm('Reset ALL progress? This erases everything — stardust, upgrades, AND Mass — and starts a brand-new game.')) return;
    localStorage.clear();                          // wipe save + settings + any legacy (lacuna_*) keys
    if (typeof accreting !== 'undefined') accreting = false;
    G = createInitialState();                      // fresh state IN PLACE — no page reload, so the audio
    if (typeof closeCosmoCard === 'function') closeCosmoCard();   // context survives and music keeps playing
    if (typeof resetPanelAnimations === 'function') resetPanelAnimations();
    buildPanels();
}


// This is an idle game — clicking never harvests. A click only catches a nearby comet
// (the one interactive moment) or opens a body's info card. Income comes from the pulse.
function canvasXY(e) { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
canvas.addEventListener('mousedown', e => {
    const [mx, my] = canvasXY(e);
    const cometNear = G.comet && ((G.comet.x-mx)**2 + (G.comet.y-my)**2 < 48*48);
    if (cometNear) { catchComet(); return; }
    const tgt = cosmoTargetAt(mx, my);
    if (tgt) openCosmoCard(tgt);
});
canvas.addEventListener('mousemove', e => {
    [cosmoMx, cosmoMy] = canvasXY(e); cosmoOver = true;
});
canvas.addEventListener('mouseleave', () => { cosmoOver = false; });


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


// Browsers block AudioContext until the first user gesture (autoplay policy) — unavoidable on a fresh
// page load. We listen on the EARLIEST gesture events (pointerdown/touchstart/keydown fire on press,
// before a full click completes) so the very first interaction starts the music with no extra step.
let _savedVols = { mv:75, sv:75, track:0 };
const _BOOT_EVENTS = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];
const _bootAudio = () => {
    SoundSystem.boot(); SoundSystem.loadTrack(_savedVols.track); SoundSystem.startMusic();
    SoundSystem.setMusicVolume(_savedVols.mv); SoundSystem.setSfxVolume(_savedVols.sv);
    if (paused) SoundSystem.stopMusic();   // first gesture was the pause button — stay silent while paused
    _BOOT_EVENTS.forEach(ev => window.removeEventListener(ev, _bootAudio));
};
_BOOT_EVENTS.forEach(ev => window.addEventListener(ev, _bootAudio));


function initDraggable(el) {
    el.addEventListener('mousedown', e => {
        if (e.target.closest('button, input, a')) return;
        const rect=el.getBoundingClientRect(), ox=e.clientX-rect.left, oy=e.clientY-rect.top;
        // Pin to pixel coords AND clear any centering transform — otherwise a panel positioned with
        // translateX(-50%) (the debug panel) lurches left by half its width when a drag starts.
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
initDraggable(document.getElementById('observatory'));
requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
