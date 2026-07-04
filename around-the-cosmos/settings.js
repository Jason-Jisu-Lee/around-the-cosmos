'use strict';

const SETTINGS_KEY = 'around_the_cosmos_settings_v2';

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        const mv=s.musicVol??75, sv=s.sfxVol??75, hide=s.hideCompleted??false;
        document.getElementById('vol-music').value            = mv;
        document.getElementById('vol-sfx').value              = sv;
        document.getElementById('vol-music-val').textContent  = mv+'%';
        document.getElementById('vol-sfx-val').textContent    = sv+'%';
        // Hide-completed persists across reloads now (it used to reset to unchecked on every refresh,
        // which read as "hiding is broken" after a cache-bust reload)
        const hideBox = document.getElementById('show-completed');
        if (hideBox) { hideBox.checked = hide; if (typeof showCompleted !== 'undefined') showCompleted = !hide; }
        return { mv, sv, hide };
    } catch(_) { return { mv:75, sv:75, hide:false }; }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            musicVol: parseInt(document.getElementById('vol-music').value),
            sfxVol:   parseInt(document.getElementById('vol-sfx').value),
            hideCompleted: !!(document.getElementById('show-completed') && document.getElementById('show-completed').checked),
        }));
    } catch(_) {}
}

function initSettings() {
    const { mv, sv, hide } = loadSettings();
    if (hide && typeof buildPanels === 'function') buildPanels();   // re-apply the persisted hide state to the already-built panel
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
    return { mv, sv };
}
