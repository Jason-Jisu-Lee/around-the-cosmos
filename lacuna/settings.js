'use strict';

// ── Settings ─────────────────────────────────────────────────────────────────
// The gear panel: music/effects volume, track selection. Persisted to localStorage.

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
