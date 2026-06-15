'use strict';

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────

let lastTs   = 0;
let lastSave = 0;

function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    tickWithDebug(dt);

    lastSave += dt;
    if (lastSave >= 20) { lastSave = 0; saveGame(); }

    draw(ts / 1000);
    updateUI(ts);

    requestAnimationFrame(loop);
}

// ─── RESET ───────────────────────────────────────────────────────────────────

function resetGame() {
    if (!confirm('Reset ALL progress, including Remnants?')) return;
    localStorage.removeItem(CFG.SAVE_KEY);
    G = createInitialState();
    remnantSectionShown = false;
    buildPanels();
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function loadSettings() {
    try {
        const s  = JSON.parse(localStorage.getItem('lacuna_settings_v1') || '{}');
        const mv = s.musicVol ?? 100;
        const sv = s.sfxVol   ?? 100;
        document.getElementById('vol-music').value               = mv;
        document.getElementById('vol-sfx').value                 = sv;
        document.getElementById('vol-music-val').textContent     = mv + '%';
        document.getElementById('vol-sfx-val').textContent       = sv + '%';
        return { mv, sv };
    } catch (_) { return { mv: 100, sv: 100 }; }
}

function saveSettings() {
    try {
        localStorage.setItem('lacuna_settings_v1', JSON.stringify({
            musicVol: parseInt(document.getElementById('vol-music').value),
            sfxVol:   parseInt(document.getElementById('vol-sfx').value),
        }));
    } catch (_) {}
}

function initSettings() {
    const { mv, sv } = loadSettings();

    const settingsBtn   = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    settingsBtn.addEventListener('click', e => { e.stopPropagation(); settingsPanel.classList.toggle('open'); });
    settingsPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => settingsPanel.classList.remove('open'));

    document.getElementById('vol-music').addEventListener('input', e => {
        const v = parseInt(e.target.value);
        document.getElementById('vol-music-val').textContent = v + '%';
        SoundSystem.setMusicVolume(v);
        saveSettings();
    });
    document.getElementById('vol-sfx').addEventListener('input', e => {
        const v = parseInt(e.target.value);
        document.getElementById('vol-sfx-val').textContent = v + '%';
        SoundSystem.setSfxVolume(v);
        saveSettings();
    });

    return { mv, sv };
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (G.comet) {
        const dx = G.comet.x - x, dy = G.comet.y - y;
        if (dx * dx + dy * dy < 48 * 48) { catchComet(); return; }
    }

    if (G.planets.length > 0) {
        const amount = PLANET_DEF[0].value * upg('touch').yield(lvl('touch')) * globalMult();
        earn(amount, x, y - 14);
        G.taps++;
        SoundSystem.sfxTap();
        burst(x, y, 'rgba(100,80,50,', 5, 80);
    }
});

document.getElementById('sn-close').addEventListener('click', () => {
    document.getElementById('supernova-overlay').classList.remove('show');
});

document.getElementById('mute-btn').addEventListener('click', () => {
    const m = SoundSystem.toggleMute();
    document.getElementById('mute-btn').classList.toggle('muted', m);
});

// ─── AUDIO BOOT (first gesture — browser autoplay policy) ────────────────────

let _savedVols = { mv: 100, sv: 100 };
const _bootAudio = () => {
    SoundSystem.boot();
    SoundSystem.startMusic();
    SoundSystem.setMusicVolume(_savedVols.mv);
    SoundSystem.setSfxVolume(_savedVols.sv);
    window.removeEventListener('click',   _bootAudio);
    window.removeEventListener('keydown', _bootAudio);
};
window.addEventListener('click',   _bootAudio);
window.addEventListener('keydown', _bootAudio);

// ─── INIT ────────────────────────────────────────────────────────────────────

window.addEventListener('resize',      resize);
window.addEventListener('beforeunload', saveGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);

loadGame();
resize();
buildPanels();
initDebug();
_savedVols = initSettings();

requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(loop); });
