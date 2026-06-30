'use strict';

// Guided tutorial overlay (Minimal Frost design): a light grey dim over the whole screen, a soft-lifted
// spotlight on the target (which stays at full colour), a pulsing dot, and a compact tooltip with an Okay
// button. Freezes the game while open (main.js's loop checks `tutorialActive`). Each tutorial fires once
// EVER, tracked in `G.tutSeen[id]` (persisted + kept across accretion). Steps walk on Okay, then unpause.

let tutorialActive = false;
let _tutSteps = null, _tutIndex = 0;

// union rect of all matching (visible) elements, in viewport coords
function _combinedRect(sel) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const e of document.querySelectorAll(sel)) {
        const x = e.getBoundingClientRect();
        if (!x.width && !x.height) continue;
        l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom);
    }
    return l === Infinity ? null : { left: l, top: t, right: r, width: r - l, height: b - t };
}

function startTutorial(steps) {
    if (tutorialActive || !steps || !steps.length) return;
    tutorialActive = true; _tutSteps = steps; _tutIndex = 0;
    _renderTutStep();
}

function _renderTutStep() {
    const layer = document.getElementById('tutorial');
    layer.style.display = 'block'; layer.innerHTML = '';
    const step = _tutSteps[_tutIndex];
    const r = step.getRect();
    if (!r) { endTutorial(); return; }                 // target gone -> bail gracefully
    const pad = 10, last = _tutIndex === _tutSteps.length - 1;

    // the frost "hole": a transparent box whose huge box-shadow dims everything around it
    const hole = document.createElement('div'); hole.className = 'tut-hole';
    hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
    layer.appendChild(hole);

    const pop = document.createElement('div'); pop.className = 'tut-pop';
    pop.innerHTML = `<div class="tut-body">${step.body}</div><div class="tut-row"><button class="tut-ok">${last ? 'Finish' : 'Okay'}</button></div>`;
    layer.appendChild(pop);
    pop.querySelector('.tut-ok').addEventListener('click', _nextTutStep);

    // place the tooltip beside the target (flip / clamp to stay on-screen)
    const pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 20;
    let left = r.left - pw - gap, side = 'left';
    if (left < 12) { left = r.right + gap; side = 'right'; }
    if (left + pw > innerWidth - 12) left = innerWidth - pw - 12;
    const top = Math.max(12, Math.min(r.top + r.height / 2 - ph / 2, innerHeight - ph - 12));
    pop.style.left = left + 'px'; pop.style.top = top + 'px';

    const dot = document.createElement('div'); dot.className = 'tut-dot';
    dot.style.left = (side === 'left' ? r.left - 5 : r.right - 6) + 'px';
    dot.style.top = (r.top + r.height / 2 - 5) + 'px';
    layer.appendChild(dot);
}

function _nextTutStep() {
    _tutIndex++;
    if (_tutIndex >= _tutSteps.length) endTutorial(); else _renderTutStep();
}

function endTutorial() {
    const layer = document.getElementById('tutorial');
    if (layer) { layer.style.display = 'none'; layer.innerHTML = ''; }
    tutorialActive = false; _tutSteps = null;
}

addEventListener('resize', () => { if (tutorialActive) _renderTutStep(); });

// ---- triggers: each fires once ever (G.tutSeen[id]) ----
// Fires the moment the dust identities appear (their unlock = runDust >= 50k), so the player learns
// about them before they can engage. Walks: identity cards -> the Accretion progress card.
const TUT_IDENTITY_AT = 50000;
function checkTutorials() {
    if (tutorialActive) return;
    if (!G.tutSeen) G.tutSeen = {};
    if (!G.tutSeen.identity && G.runDust >= TUT_IDENTITY_AT && document.querySelector('.upg-identity')) {
        G.tutSeen.identity = true;
        if (typeof saveGame === 'function') saveGame();
        if (typeof sectionOpen !== 'undefined' && sectionOpen['DUST PARTICLES'] === false) {
            sectionOpen['DUST PARTICLES'] = true; if (typeof buildPanels === 'function') buildPanels();
        }
        startTutorial([
            { getRect: () => { const f = document.querySelector('.upg-identity'); if (f) f.scrollIntoView({ block: 'nearest' }); return _combinedRect('.upg-identity'); },
              body: "These upgrades determine the identity of an orbiter. You may only choose one for the current Universe. However, you may choose a different one after your Accretion." },
            { getRect: () => { const e = document.getElementById('accretion-btn'); if (!e || e.style.display === 'none') return null; e.scrollIntoView({ block: 'nearest' }); return e.getBoundingClientRect(); },
              body: "This indicates how close you are to perform Accretion, which will reset all of your progress and give you Mass based on total Stardust collected. You should Accrete when your progress is slowing down." },
        ]);
    }
}
