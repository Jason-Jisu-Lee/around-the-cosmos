'use strict';



let lastTs = 0, lastSave = 0;

function loop(ts) {
    const dt = Math.min((ts-lastTs)/1000, 0.1);
    lastTs = ts;
    tickWithDebug(dt);
    lastSave += dt;
    if (lastSave >= 20) { lastSave=0; saveGame(); }
    draw(ts/1000);
    updateUI(ts);
    updateCosmoTip();
    requestAnimationFrame(loop);
}

function resetGame() {
    if (!confirm('Reset all progress?')) return;
    localStorage.removeItem(CFG.SAVE_KEY);
    G = createInitialState(); buildPanels();
}


function canvasClick(x, y) {
    if (G.comet) {
        const dx=G.comet.x-x, dy=G.comet.y-y;
        if (dx*dx+dy*dy < 48*48) { catchComet(); return; }
    }
    if (lvl('pulse') >= 1) return;
    earn(clickValue(), x, y-14);
    G.taps++; SoundSystem.sfxTap(); burst(x,y,'rgba(100,80,50,',5,80);

    if (clickFxRandom) clickFxId = randomClickFxId();
    const ddx=x-CX, ddy=y-CY, dl=Math.hypot(ddx,ddy)||1;
    triggerClickFx(performance.now()/1000, ddx/dl, ddy/dl);
}


let holdTimer = null, holdX = 0, holdY = 0;
function canvasXY(e) { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
function stopHold() { if (holdTimer) { clearInterval(holdTimer); holdTimer = null; } }
canvas.addEventListener('mousedown', e => {
    [holdX, holdY] = canvasXY(e);

    const cometNear = G.comet && ((G.comet.x-holdX)**2 + (G.comet.y-holdY)**2 < 48*48);
    const tgt = cosmoTargetAt(holdX, holdY);
    if (tgt && !cometNear) { openCosmoCard(tgt); return; }
    canvasClick(holdX, holdY);
    stopHold();
    holdTimer = setInterval(() => canvasClick(holdX, holdY), 333);
});
canvas.addEventListener('mousemove', e => {
    [cosmoMx, cosmoMy] = canvasXY(e); cosmoOver = true;
    if (holdTimer) [holdX, holdY] = [cosmoMx, cosmoMy];
});
canvas.addEventListener('mouseleave', () => { stopHold(); cosmoOver = false; });
window.addEventListener('mouseup', stopHold);
window.addEventListener('blur', stopHold);


document.getElementById('mute-btn').addEventListener('click', () => {
    const m=SoundSystem.toggleMute();
    document.getElementById('mute-btn').classList.toggle('muted',m);
});

document.getElementById('show-completed').addEventListener('change', e => {
    showCompleted = !e.target.checked;
    buildPanels();
});


let _savedVols = { mv:75, sv:75, track:0 };
const _bootAudio = () => {
    SoundSystem.boot(); SoundSystem.loadTrack(_savedVols.track); SoundSystem.startMusic();
    SoundSystem.setMusicVolume(_savedVols.mv); SoundSystem.setSfxVolume(_savedVols.sv);
    window.removeEventListener('click',   _bootAudio);
    window.removeEventListener('keydown', _bootAudio);
};
window.addEventListener('click',   _bootAudio);
window.addEventListener('keydown', _bootAudio);


function initDraggable(el) {
    el.addEventListener('mousedown', e => {
        if (e.target.closest('button, input, a')) return;
        const rect=el.getBoundingClientRect(), ox=e.clientX-rect.left, oy=e.clientY-rect.top;
        el.style.left=rect.left+'px'; el.style.top=rect.top+'px';
        el.style.bottom='auto'; el.style.right='auto';
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
const _accBtn = document.getElementById('accretion-btn');
initDraggable(_accBtn);
setTimeout(() => { const r = document.getElementById('observatory').getBoundingClientRect(); _accBtn.style.left = r.left + 'px'; _accBtn.style.top = (r.bottom + 12) + 'px'; }, 120);
requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
