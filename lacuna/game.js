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

// ---- Cosmic info card (Lacuna + dust particles) ----
// Hovering a target opens its card pinned in the CENTER of the sky; the card is
// sticky (stays put after the cursor leaves, so you don't have to chase it) and is
// dismissed with the × button or Escape. Hovering the card itself pauses detection
// so the open card never flips while you reach for ×.
const cosmoTip = document.getElementById('cosmo-tip');
let cosmoMx = 0, cosmoMy = 0, cosmoOver = false;
let openTarget = null;      // 'lacuna' | 'orbiter' | null — card currently shown
let dismissedTarget = null; // ×-closed target; won't reopen until the cursor leaves it

const LACUNA_DESC  = 'A small absence at the heart of everything — patient, hollow, and quietly gathering a universe back together.';
const ORBITER_DESC = "The first speck stubborn enough to answer the Lacuna's pull, tracing patient circles and paying a little stardust each time it passes.";

function tipRow(l, v) { return `<div class="tip-row"><span class="tip-l">${l}</span><span class="tip-v">${v}</span></div>`; }
function cosmoCard(title, body, note) {
    return `<button class="cosmo-close" aria-label="Close">×</button>`
        + `<div class="cosmo-title">${title}</div>` + body
        + `<div class="tip-note">${note}</div>`;
}
function lacunaCardHTML() {
    return cosmoCard('The Lacuna',
          tipRow('Diameter',        fmtNice(2*PHYS.lacunaRadius/1000) + ' km')
        + tipRow('Mass',            fmtSci(lacunaMass()) + ' kg')
        + tipRow('Surface gravity', fmtNice(lacunaGravity()*100) + ' cm/s²')
        + tipRow('Escape velocity', fmtNice(lacunaEscapeVel()) + ' m/s')
        + tipRow('Density',         fmtNice(PHYS.lacunaDensity/1000) + ' g/cm³'),
        LACUNA_DESC);
}
function orbiterCardHTML() {
    return cosmoCard('Dust Particle',
          tipRow('Orbit payout',  '✦' + fmtNum(orbiterPayout()))
        + tipRow('Orbital speed', fmtNice(orbiterVel()) + ' m/s')
        + tipRow('Orbits / hour', fmtNice(orbiterOrbitsPerHour())),
        ORBITER_DESC);
}

function closeCosmoCard() {
    dismissedTarget = openTarget;   // don't reopen until the cursor leaves this target
    openTarget = null;
    cosmoTip.style.display = 'none';
}

function updateCosmoTip() {
    let over = null;
    if (cosmoOver) {
        if (Math.hypot(cosmoMx-CX, cosmoMy-CY) < 22) over = 'lacuna';
        else if (G.planets.length && Math.hypot(cosmoMx-clumpPos().x, cosmoMy-clumpPos().y) < 46) over = 'orbiter';
    }
    canvas.style.cursor = over ? 'help' : 'default';
    if (over !== dismissedTarget) dismissedTarget = null; // left it → allow reopen
    if (over && over !== dismissedTarget) openTarget = over; // hover opens; sticky otherwise

    if (!openTarget) { cosmoTip.style.display = 'none'; return; }
    const html = openTarget === 'lacuna' ? lacunaCardHTML() : orbiterCardHTML();
    if (cosmoTip._html !== html) { cosmoTip.innerHTML = html; cosmoTip._html = html; }
    cosmoTip.style.display = 'block';
    cosmoTip.style.left = Math.round((W - cosmoTip.offsetWidth)/2) + 'px';  // pin center
    cosmoTip.style.top  = Math.round((H - cosmoTip.offsetHeight)/2) + 'px';
}

// Hovering the card pauses hit-detection so the open card doesn't switch while
// you move toward the × button.
cosmoTip.addEventListener('mouseenter', () => { cosmoOver = false; });
cosmoTip.addEventListener('click', e => {
    if (e.target.closest('.cosmo-close')) { e.stopPropagation(); closeCosmoCard(); }
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeCosmoCard(); });

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
