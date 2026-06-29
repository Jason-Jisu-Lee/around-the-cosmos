'use strict';

// The Mass page UI: the "Branching Rail" - the Singularity spine + each tab's upgrade cards.
// Pure rendering + hover/click wiring; the prestige FLOW (open/close, confirm, sequence) lives in ui/accretion.js.
// Shared state `accCat` / `accBrowse` is read here and written by the flow file (global across scripts).

const ACC_CATS = ['Maw', 'Orbiters', 'Phenomena', 'Eternity'];

const ACC_MASS_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
    + '<ellipse cx="12" cy="12" rx="10.5" ry="3.9" transform="rotate(-22 12 12)" stroke="#a8853a" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="4.6" fill="#a8853a"/></svg>';

let accCat = 'Maw';
let accBrowse = false;

const ACC_LOCK ='<svg class="acc-lock" width="14" height="14" viewBox="0 0 24 24" fill="none">'
    + '<rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="#a99f88"/>'
    + '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#a99f88" stroke-width="2.1"/></svg>';

// Minimal card: title + one-line effect. Cost badge top-LEFT, level badge (X/Y) top-RIGHT.
// The detailed "math" lives in the hover popup (accNodeDetail) so the card stays simple and fixed-size.
function accNodeHTML(u) {
    // Locked tier: keep the box, no badge/hover. Reveal the NAME only for the next tier;
    // deeper (still-sealed) tiers show a lock icon instead of the title - no readable name.
    if (massNodeVis(u) === 'locked') {
        const reveal = u.tier === singularityLevel() + 1;
        return `<div class="acc-node locked" data-uid="${u.id}">`
            + (reveal ? `<div class="acc-nm">${u.name}</div>` : `<div class="acc-nlock">${ACC_LOCK}</div>`)
            + `</div>`;
    }
    const planned = u.placeholder;
    const l = mlvl(u.id), maxed = !planned && l >= u.max;
    const afford = !accBrowse && !planned && !maxed && G.mass >= u.costs[l];
    let state, desc, costBadge = '', lvlBadge = '';
    if (planned) {
        state = 'next';
        desc = `<div class="acc-ndesc">${u.eff(1)}</div>`;
        lvlBadge = `<div class="acc-badge soon">soon</div>`;
    } else {
        state = maxed ? 'max' : (l > 0 ? 'up' : 'avail');
        desc = `<div class="acc-ndesc">${u.eff(l)}</div>`;
        lvlBadge = maxed ? `<div class="acc-badge done">✓</div>` : `<div class="acc-badge">${l}/${u.max}</div>`;
        if (!maxed) costBadge = `<div class="acc-badge cost${afford ? ' ok' : ''}">${u.costs[l]}</div>`;
    }
    const idAttr = afford ? ` data-id="${u.id}"` : '';
    return `<div class="acc-node ${state}${afford ? ' buy' : ''}" data-uid="${u.id}"${idAttr}>`
        + costBadge + lvlBadge + `<div class="acc-nm">${u.name}</div>${desc}</div>`;
}

// Hover popup - kept tiny: just the plain-English description, plus the next-level effect.
function accNodeDetail(u) {
    if (massNodeVis(u) === 'locked' || u.placeholder) {
        return `<div class="acc-pop-d">${u.flavor}</div>`;
    }
    const l = mlvl(u.id), maxed = l >= u.max;
    let d = `<div class="acc-pop-d">${u.flavor}</div>`;
    if (!maxed) d += `<div class="acc-pop-next">Next: ${u.eff(l + 1)}</div>`;
    return d;
}

// The Singularity spine gate. done = captured (pressed-in, no label), avail = next to buy (cost badge), locked = ???.
// `active` = the gate is captured or the next-available one -> it gets a rail line; locked gates beyond have none.
function accGateHTML(t, first, last, active) {
    const lv = singularityLevel(), cost = SINGULARITY.costs[t - 1];
    // a tier is 'avail' only if it's the next one AND within the demo cap; deeper gates stay 'locked' (sealed)
    const state = lv >= t ? 'done' : (lv === t - 1 && t <= SINGULARITY.demoMax) ? 'avail' : 'locked';
    const buy = !accBrowse && state === 'avail' && G.mass >= cost;
    const idAttr = buy ? ` data-spine="${t}"` : '';
    const name = state === 'locked' ? '???' : SINGULARITY.orbiters[t - 1];
    // cost on the top-LEFT corner; nothing on the right (gates have only one level)
    const costBadge = state === 'avail' ? `<div class="acc-badge cost${buy ? ' ok' : ''}">${cost}</div>` : '';
    const cell = (active ? ' line' : '') + (first ? ' first' : '') + (last ? ' last' : '');
    return `<div class="acc-gatecell${cell}">`
        + `<div class="acc-gate ${state}${buy ? ' buy' : ''}" data-gate="${t}"${idAttr}>`
        +   costBadge + `<div class="acc-gorb">${name}</div>`
        + `</div></div>`;
}

function accGateDetail(t) {
    const lv = singularityLevel(), orb = SINGULARITY.orbiters[t - 1];
    if (orb === 'Finish Demo') return `<div class="acc-pop-d">The end of the demo. More cosmos is on the way.</div>`;
    if (lv >= t || lv === t - 1) return `<div class="acc-pop-d"><b>${orb}</b> enters the orbit.</div>`;
    return `<div class="acc-pop-d">Sealed — capture the earlier orbiters first.</div>`;
}

function accTreeHTML(cat) {
    // The rail only connects captured tiers + the next available one; locked tiers beyond have no line.
    const lvl = singularityLevel(), lineMax = Math.min(lvl + 1, SINGULARITY.demoMax);   // rail stops at the demo end ("Finish Demo")
    let h = '<div class="acc-railwrap"><div class="acc-rail">';
    for (let t = 1; t <= SINGULARITY.tiers; t++) {
        const nodes = massTierNodes(cat, t), active = t <= lineMax;
        h += accGateHTML(t, t === 1, t === lineMax, active)
           + `<div class="acc-branch${active ? '' : ' noline'}"></div>`
           + `<div class="acc-tiernodes">${nodes.map(accNodeHTML).join('')}</div>`
           + `<div class="acc-rspacer"></div>`;   // balances the spine column so the cards stay page-centred
    }
    return h + '</div></div>';
}

function showAccPop(html, el) {
    const pop = document.getElementById('acc-pop'); if (!pop) return;
    pop.innerHTML = html; pop.classList.add('show');
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = r.right + 12;
    if (x + pw > innerWidth - 8) x = r.left - pw - 12;   // flip left if it would clip the edge
    x = Math.max(8, x);
    const y = Math.max(8, Math.min(r.top + r.height / 2 - ph / 2, innerHeight - ph - 8));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function hideAccPop() { const pop = document.getElementById('acc-pop'); if (pop) pop.classList.remove('show'); }

function accRender() {
    document.getElementById('acc-mass').innerHTML = ACC_MASS_ICON
        + `<div class="num">${fmtNum(G.mass)}</div><div class="lbl">Mass</div>`;

    const tabs = document.getElementById('acc-tabs');
    tabs.innerHTML = ACC_CATS.map(c =>
        `<button class="acc-tab${c === accCat ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
    tabs.querySelectorAll('.acc-tab').forEach(b =>
        b.addEventListener('click', () => { accCat = b.dataset.c; accRender(); }));

    const tree = document.getElementById('acc-tree');
    tree.innerHTML = accTreeHTML(accCat);
    tree.querySelectorAll('.acc-node').forEach(node => {
        node.addEventListener('mouseenter', () => {
            const u = MASS_BY_ID[node.dataset.uid];
            if (u && massNodeVis(u) !== 'locked') { SoundSystem.sfxHover(); showAccPop(accNodeDetail(u), node); }  // locked = no hover
        });
        node.addEventListener('mouseleave', hideAccPop);
    });
    tree.querySelectorAll('.acc-gate').forEach(gate => {
        gate.addEventListener('mouseenter', () => {
            const t = +gate.dataset.gate;
            if (singularityLevel() >= t - 1) { SoundSystem.sfxHover(); showAccPop(accGateDetail(t), gate); }  // captured/next only
        });
        gate.addEventListener('mouseleave', hideAccPop);
    });
    tree.querySelectorAll('.acc-node[data-id]').forEach(node =>
        node.addEventListener('click', () => { if (buyMassUpgrade(node.dataset.id)) { hideAccPop(); accRender(); } }));
    tree.querySelectorAll('.acc-gate[data-spine]').forEach(gate =>
        gate.addEventListener('click', () => {
            const t = +gate.dataset.spine;
            // clicking "Finish Demo" doesn't capture/spend - it opens the end-of-demo modal
            if (SINGULARITY.orbiters[t - 1] === 'Finish Demo') { hideAccPop(); if (typeof openDemoFinish === 'function') openDemoFinish(); return; }
            if (buySingularity()) { hideAccPop(); accRender(); }
        }));

    document.getElementById('acc-undo').style.display = (!accBrowse && canUndoMass()) ? 'block' : 'none';
}
