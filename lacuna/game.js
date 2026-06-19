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

function canvasClick(x, y) {
    if (G.comet) {
        const dx=G.comet.x-x, dy=G.comet.y-y;
        if (dx*dx+dy*dy < 48*48) { catchComet(); return; }
    }
    earn(upg('touch').tapYield[lvl('touch')], x, y-14);
    G.taps++; SoundSystem.sfxTap(); burst(x,y,'rgba(100,80,50,',5,80);
}

// Hold to auto-click twice per second; release stops it.
let holdTimer = null, holdX = 0, holdY = 0;
function canvasXY(e) { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
function stopHold() { if (holdTimer) { clearInterval(holdTimer); holdTimer = null; } }
canvas.addEventListener('mousedown', e => {
    [holdX, holdY] = canvasXY(e);
    canvasClick(holdX, holdY);                                   // immediate click
    stopHold();
    holdTimer = setInterval(() => canvasClick(holdX, holdY), 500); // 2× / sec while held
});
canvas.addEventListener('mousemove', e => {
    [cosmoMx, cosmoMy] = canvasXY(e); cosmoOver = true;
    if (holdTimer) [holdX, holdY] = [cosmoMx, cosmoMy];
});
canvas.addEventListener('mouseleave', () => { stopHold(); cosmoOver = false; });
window.addEventListener('mouseup', stopHold);
window.addEventListener('blur', stopHold);

// ---- Cosmic hover tooltip (Lacuna + dust particles) ----
const cosmoTip = document.getElementById('cosmo-tip');
let cosmoMx = 0, cosmoMy = 0, cosmoOver = false;

function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }

function lacunaTipHTML() {
    return `<div class="tip-title">The Lacuna</div>`
        + tipRow('Diameter',        sig3(2*PHYS.lacunaRadius/1000) + ' km')
        + tipRow('Mass',            fmtSci(lacunaMass()) + ' kg')
        + tipRow('Surface gravity', sig3(lacunaGravity()) + ' m/s²')
        + tipRow('Escape velocity', sig3(lacunaEscapeVel()/1000) + ' km/s')
        + tipRow('Density',         sig3(PHYS.lacunaDensity/1000) + ' g/cm³')
        + `<div class="tip-note">Only ${sig3(lacunaGravity()/9.81)} g at the surface — a dropped pebble barely falls.</div>`;
}
function orbiterTipHTML() {
    return `<div class="tip-title">Dust Particle</div>`
        + tipRow('Orbit payout',  '✦' + fmtNum(orbiterPayout()))
        + tipRow('Orbital speed', sig3(orbiterVel()) + ' m/s')
        + tipRow('Orbits / hour', sig3(orbiterOrbitsPerHour()));
}

function updateCosmoTip() {
    let html = null;
    if (cosmoOver) {
        if (Math.hypot(cosmoMx-CX, cosmoMy-CY) < 22) {
            html = lacunaTipHTML();
        } else if (G.planets.length) {
            const cp = clumpPos();
            if (Math.hypot(cosmoMx-cp.x, cosmoMy-cp.y) < 24) html = orbiterTipHTML();
        }
    }
    if (!html) { cosmoTip.style.display = 'none'; canvas.style.cursor = 'default'; return; }
    if (cosmoTip._html !== html) { cosmoTip.innerHTML = html; cosmoTip._html = html; }
    cosmoTip.style.display = 'block';
    canvas.style.cursor = 'help';
    // position near cursor, flipping away from the right / bottom edge
    const pad = 16, tw = cosmoTip.offsetWidth, th = cosmoTip.offsetHeight;
    let lx = cosmoMx + pad, ly = cosmoMy + pad;
    if (lx + tw > W) lx = cosmoMx - pad - tw;
    if (ly + th > H) ly = cosmoMy - pad - th;
    cosmoTip.style.left = Math.max(0, lx) + 'px';
    cosmoTip.style.top  = Math.max(0, ly) + 'px';
}

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
