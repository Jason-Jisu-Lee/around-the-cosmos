'use strict';

const SETTINGS_KEY = 'around_the_cosmos_settings_v2';

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        const mv=s.musicVol??75, sv=s.sfxVol??75, track=s.track??0;
        document.getElementById('vol-music').value            = mv;
        document.getElementById('vol-sfx').value              = sv;
        document.getElementById('vol-music-val').textContent  = mv+'%';
        document.getElementById('vol-sfx-val').textContent    = sv+'%';
        document.querySelectorAll('.track-btn').forEach(b =>
            b.classList.toggle('active', parseInt(b.dataset.track)===track));
        return { mv, sv, track };
    } catch(_) { return { mv:75, sv:75, track:0 }; }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
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
    const wireVolEdit = (sliderId, valId, apply) => {
        const slider = document.getElementById(sliderId), val = document.getElementById(valId);
        val.contentEditable = 'true'; val.spellcheck = false;
        val.addEventListener('focus', () => {
            val.textContent = slider.value;
            const r = document.createRange(); r.selectNodeContents(val);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        });
        val.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); val.blur(); } });
        val.addEventListener('blur', () => {
            let v = parseInt(val.textContent.replace(/[^0-9]/g, ''), 10);
            if (isNaN(v)) v = parseInt(slider.value, 10);
            v = Math.max(0, Math.min(100, v));
            slider.value = v; val.textContent = v + '%';
            apply(v); saveSettings();
        });
    };
    wireVolEdit('vol-music', 'vol-music-val', v => SoundSystem.setMusicVolume(v));
    wireVolEdit('vol-sfx', 'vol-sfx-val', v => SoundSystem.setSfxVolume(v));
    return { mv, sv, track };
}
