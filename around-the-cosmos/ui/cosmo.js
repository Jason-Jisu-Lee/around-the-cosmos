'use strict';

const cosmoTip  = document.getElementById('cosmo-tip');
const cosmoCard = document.getElementById('cosmo-card');
let cosmoMx = 0, cosmoMy = 0, cosmoOver = false;
let pinnedTarget = null;

const MAW_DESC = 'A small absence at the heart of everything, patient and hollow, quietly gathering a universe back together.';

function cosmoTargetAt(x, y) {
    if (Math.hypot(x-CX, y-CY) < 22) return 'maw';
    for (const o of ORBITERS) {
        if (o.list().length && Math.hypot(x-o.clumpPos().x, y-o.clumpPos().y) < o.hoverR) return o.id;
    }
    return null;
}

function mawRows() {
    return tipRow('Diameter',        fmtNice(2*PHYS.mawRadius/1000) + ' km')
         + tipRow('Mass',            fmtSci(mawMass()) + ' kg')
         + tipRow('Surface gravity', fmtNice(mawGravity()/9.81*100) + '% of Earth')
         + tipRow('Escape velocity', fmtNice(mawEscapeVel()) + ' m/s')
         + tipRow('Density',         fmtNice(PHYS.mawDensity/1000) + ' g/cm³');
}
function cosmoBody(target, withClose) {
    if (target === 'comet') return `<div class="cosmo-solo">Comet</div>`;
    const title = target === 'maw' ? 'Maw' : ORBITER_BY_ID[target].title;
    const rows  = target === 'maw' ? mawRows()  : ORBITER_BY_ID[target].rows();
    const desc  = target === 'maw' ? MAW_DESC   : ORBITER_BY_ID[target].desc;
    return (withClose ? `<button class="cosmo-close" aria-label="Close">×</button>` : '')
        + `<div class="cosmo-title">${title}</div>` + rows
        + `<div class="tip-note">${desc}</div>`;
}

let _uniformSet = false;
function setUniformCardSize() {
    _uniformSet = true;
    const c = cosmoCard;
    const sL = c.style.left, sT = c.style.top, sD = c.style.display;
    c.style.width = ''; c.style.minHeight = '';
    c.style.left = '-9999px'; c.style.top = '0'; c.style.display = 'block';
    let maxW = 0, maxH = 0;
    for (const t of ['maw', ...ORBITERS.map(o => o.id)]) {
        c.innerHTML = '<button class="cosmo-close" aria-label="Close">×</button><div class="cosmo-content">' + cosmoBody(t, false) + '</div>';
        if (c.offsetWidth  > maxW) maxW = c.offsetWidth;
        if (c.offsetHeight > maxH) maxH = c.offsetHeight;
    }
    c.style.width = maxW + 'px';
    c.style.minHeight = maxH + 'px';
    c.innerHTML = ''; c._pinned = null; c._html = null; c._w = -1;
    c.style.left = sL; c.style.top = sT; c.style.display = sD || 'none';
}

function openCosmoCard(target) {
    if (target === 'comet') return;
    if (!_uniformSet) setUniformCardSize();
    pinnedTarget = target; cosmoTip.style.display = 'none';
}
function closeCosmoCard()      { pinnedTarget = null; cosmoCard.style.display = 'none'; }

let _cursorSet = false;
function updateCosmoTip() {
    const over = cosmoOver ? cosmoTargetAt(cosmoMx, cosmoMy) : null;

    if (!_cursorSet) { canvas.style.cursor = 'url(assets/cursors/needle.png?v=63) 3 3, default'; _cursorSet = true; }

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

    if (pinnedTarget) {
        if (cosmoCard._pinned !== pinnedTarget) {
            cosmoCard.innerHTML = '<button class="cosmo-close" aria-label="Close">×</button><div class="cosmo-content"></div>';
            cosmoCard._content = cosmoCard.querySelector('.cosmo-content');
            cosmoCard._pinned = pinnedTarget; cosmoCard._html = null; cosmoCard._w = -1;
        }
        const html = cosmoBody(pinnedTarget, false);
        if (cosmoCard._html !== html) { cosmoCard._content.innerHTML = html; cosmoCard._html = html; }
        cosmoCard.style.display = 'block';

        if (cosmoCard._w !== cosmoCard.offsetWidth || cosmoCard._h !== cosmoCard.offsetHeight || cosmoCard._W !== W || cosmoCard._H !== H) {
            cosmoCard._w = cosmoCard.offsetWidth; cosmoCard._h = cosmoCard.offsetHeight; cosmoCard._W = W; cosmoCard._H = H;
            cosmoCard.style.left = Math.round((W - cosmoCard._w)/2) + 'px';
            cosmoCard.style.top  = Math.round((H - cosmoCard._h)/2) + 'px';
        }
    } else {
        if (cosmoCard._pinned) { cosmoCard._pinned = null; cosmoCard._html = null; }
        cosmoCard.style.display = 'none';
    }
}

cosmoCard.addEventListener('click', e => {
    if (e.target.closest('.cosmo-close')) { e.stopPropagation(); closeCosmoCard(); }
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeCosmoCard(); });
