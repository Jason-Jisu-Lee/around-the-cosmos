'use strict';

// ── Cosmic info cards ────────────────────────────────────────────────────────
// Hover a body → a small tooltip follows the cursor. Click a body → its full card
// opens pinned in the CENTER of the sky, sticky, dismissed with × / Escape. The
// comet is hover-only (a targeting reticle + "Comet" label); clicking it catches
// it. Orbiter names / descriptions / card rows come from the orbiters/* registry.
const cosmoTip  = document.getElementById('cosmo-tip');   // hover — follows cursor
const cosmoCard = document.getElementById('cosmo-card');  // click — pinned center
let cosmoMx = 0, cosmoMy = 0, cosmoOver = false;
let pinnedTarget = null;    // orbiter id | 'lacuna' | null — centered card open via click

const LACUNA_DESC = 'A small absence at the heart of everything — patient, hollow, and quietly gathering a universe back together.';

// Returns 'comet' | 'lacuna' | an orbiter id | null.
function cosmoTargetAt(x, y) {
    if (G.comet && Math.hypot(x-G.comet.x, y-G.comet.y) < COMET_HOVER_R) return 'comet';
    if (Math.hypot(x-CX, y-CY) < 22) return 'lacuna';
    for (const o of ORBITERS) {
        if (o.list().length && Math.hypot(x-o.clumpPos().x, y-o.clumpPos().y) < o.hoverR) return o.id;
    }
    return null;
}

function lacunaRows() {
    return tipRow('Diameter',        fmtNice(2*PHYS.lacunaRadius/1000) + ' km')
         + tipRow('Mass',            fmtSci(lacunaMass()) + ' kg')
         + tipRow('Surface gravity', fmtNice(lacunaGravity()/9.81*100) + '% of Earth')
         + tipRow('Escape velocity', fmtNice(lacunaEscapeVel()) + ' m/s')
         + tipRow('Density',         fmtNice(PHYS.lacunaDensity/1000) + ' g/cm³');
}
function cosmoBody(target, withClose) {
    if (target === 'comet') return `<div class="cosmo-solo">Comet</div>`;
    const title = target === 'lacuna' ? 'The Lacuna' : ORBITER_BY_ID[target].title;
    const rows  = target === 'lacuna' ? lacunaRows()  : ORBITER_BY_ID[target].rows();
    const desc  = target === 'lacuna' ? LACUNA_DESC   : ORBITER_BY_ID[target].desc;
    return (withClose ? `<button class="cosmo-close" aria-label="Close">×</button>` : '')
        + `<div class="cosmo-title">${title}</div>` + rows
        + `<div class="tip-note">${desc}</div>`;
}

// The comet is never pinned (clicking it catches it instead).
function openCosmoCard(target) { if (target === 'comet') return; pinnedTarget = target; cosmoTip.style.display = 'none'; }
function closeCosmoCard()      { pinnedTarget = null; cosmoCard.style.display = 'none'; }

function updateCosmoTip() {
    const over = cosmoOver ? cosmoTargetAt(cosmoMx, cosmoMy) : null;
    // Over a body → the pointer hand (it's clickable); otherwise the custom needle.
    // (Inline style is set each frame, so it must carry the needle or it overrides the CSS.)
    canvas.style.cursor = over ? 'pointer' : 'url(assets/cursors/needle.png?v=63) 3 3, default';

    // hover tooltip — follows the cursor; hidden while a card is pinned
    if (over && !pinnedTarget) {
        const html = cosmoBody(over, false);
        if (cosmoTip._html !== html) { cosmoTip.innerHTML = html; cosmoTip._html = html; }
        cosmoTip.style.display = 'block';
        const pad = 16, tw = cosmoTip.offsetWidth, th = cosmoTip.offsetHeight;
        let lx = cosmoMx + pad, ly = cosmoMy + pad;
        if (lx + tw > W) lx = cosmoMx - pad - tw;
        if (ly + th > H) ly = cosmoMy - pad - th;
        cosmoTip.style.left = Math.max(0, lx) + 'px';
        cosmoTip.style.top  = Math.max(0, ly) + 'px';
    } else {
        cosmoTip.style.display = 'none';
    }

    // pinned card — centered, sticky until × / Escape
    if (pinnedTarget) {
        const html = cosmoBody(pinnedTarget, true);
        if (cosmoCard._html !== html) { cosmoCard.innerHTML = html; cosmoCard._html = html; }
        cosmoCard.style.display = 'block';
        cosmoCard.style.left = Math.round((W - cosmoCard.offsetWidth)/2) + 'px';
        cosmoCard.style.top  = Math.round((H - cosmoCard.offsetHeight)/2) + 'px';
    } else {
        cosmoCard.style.display = 'none';
    }
}

cosmoCard.addEventListener('click', e => {
    if (e.target.closest('.cosmo-close')) { e.stopPropagation(); closeCosmoCard(); }
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeCosmoCard(); });
