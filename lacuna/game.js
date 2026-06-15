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
    requestAnimationFrame(loop);
}

function resetGame() {
    if (!confirm('Reset all progress?')) return;
    localStorage.removeItem(CFG.SAVE_KEY);
    G = createInitialState(); buildPanels();
}

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem('lacuna_settings_v1') || '{}');
        const mv=s.musicVol??100, sv=s.sfxVol??100, track=s.track??0;
        document.getElementById('vol-music').value            = mv;
        document.getElementById('vol-sfx').value              = sv;
        document.getElementById('vol-music-val').textContent  = mv+'%';
        document.getElementById('vol-sfx-val').textContent    = sv+'%';
        document.querySelectorAll('.track-btn').forEach(b =>
            b.classList.toggle('active', parseInt(b.dataset.track)===track));
        return { mv, sv, track };
    } catch(_) { return { mv:100, sv:100, track:0 }; }
}

function saveSettings() {
    try {
        localStorage.setItem('lacuna_settings_v1', JSON.stringify({
            musicVol: parseInt(document.getElementById('vol-music').value),
            sfxVol:   parseInt(document.getElementById('vol-sfx').value),
            track:    SoundSystem.getTrack(),
        }));
    } catch(_) {}
}

function initSettings() {
    const { mv, sv, track } = loadSettings();
    const settingsBtn   = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    settingsBtn.addEventListener('click', e => { e.stopPropagation(); settingsPanel.classList.toggle('open'); });
    settingsPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => settingsPanel.classList.remove('open'));
    document.getElementById('vol-music').addEventListener('input', e => {
        const v=parseInt(e.target.value);
        document.getElementById('vol-music-val').textContent=v+'%';
        SoundSystem.setMusicVolume(v); saveSettings();
    });
    document.getElementById('vol-sfx').addEventListener('input', e => {
        const v=parseInt(e.target.value);
        document.getElementById('vol-sfx-val').textContent=v+'%';
        SoundSystem.setSfxVolume(v); saveSettings();
    });
    document.querySelectorAll('.track-btn').forEach(b => {
        b.addEventListener('click', () => {
            SoundSystem.setTrack(parseInt(b.dataset.track));
            document.querySelectorAll('.track-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active'); saveSettings();
        });
    });
    return { mv, sv, track };
}

canvas.addEventListener('click', e => {
    const rect=canvas.getBoundingClientRect(), x=e.clientX-rect.left, y=e.clientY-rect.top;
    if (G.comet) {
        const dx=G.comet.x-x, dy=G.comet.y-y;
        if (dx*dx+dy*dy < 48*48) { catchComet(); return; }
    }
    if (G.planets.length > 0) {
        earn(upg('touch').tapYield[lvl('touch')], x, y-14);
        G.taps++; SoundSystem.sfxTap(); burst(x,y,'rgba(100,80,50,',5,80);
    }
});

document.getElementById('mute-btn').addEventListener('click', () => {
    const m=SoundSystem.toggleMute();
    document.getElementById('mute-btn').classList.toggle('muted',m);
});

let _savedVols = { mv:100, sv:100, track:0 };
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
        if (e.target.closest('button, input, a')) return; // let controls work
        const rect=el.getBoundingClientRect(), ox=e.clientX-rect.left, oy=e.clientY-rect.top;
        // pin to current spot first, so a plain click doesn't drop it off-screen
        el.style.left=rect.left+'px'; el.style.top=rect.top+'px';
        el.style.bottom='auto'; el.style.right='auto';
        const onMove=mv => { el.style.left=(mv.clientX-ox)+'px'; el.style.top=(mv.clientY-oy)+'px'; };
        const onUp=() => { document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
        document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); e.preventDefault();
    });
}

document.getElementById('show-completed').addEventListener('change', e => {
    showCompleted = e.target.checked;
    buildPanels();
});

window.addEventListener('resize', resize);
window.addEventListener('beforeunload', saveGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);
loadGame(); resize(); buildPanels(); initDebug(); _savedVols=initSettings();
initDraggable(document.getElementById('observatory'));
requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
