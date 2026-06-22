'use strict';

/* Accretion (prestige) screen — Tabs layout. Opens from #accretion-btn, overlays the live
   main page (the looping sky shows faintly through). Tree data is placeholder for now;
   real Mass economy + upgrades come later. */

const ACC_CATS = ['Lacuna', 'Orbiters', 'Phenomena', 'Cycles'];
const ACC_SUB  = {
    Lacuna:   'The dark center, deepened.',
    Orbiters: 'Bodies that circle and pay.',
    Phenomena:'Comets, light, rare events.',
    Cycles:   'Time, rhythm, automation.',
};

// ringed accreting mass — deliberately not a star
const ACC_MASS_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">'
    + '<ellipse cx="12" cy="12" rx="10.5" ry="3.9" transform="rotate(-22 12 12)" stroke="#a8853a" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="4.6" fill="#a8853a"/></svg>';

// [state, level, max] — irregular tier widths + irregular availability (placeholder)
const ACC_TREE = {
    Lacuna: [
        [['max',5,5]],
        [['up',4,5],['up',2,4]],
        [['avail',0,5],['avail',0,5]],
        [['lock',0,3],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5]],
    ],
    Orbiters: [
        [['max',5,5],['max',3,3]],
        [['up',3,5],['up',1,4],['avail',0,5]],
        [['avail',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5]],
    ],
    Phenomena: [
        [['max',5,5]],
        [['up',3,5],['up',2,5]],
        [['avail',0,5],['avail',0,5],['avail',0,5]],
        [['avail',0,5],['avail',0,5],['lock',0,5]],
    ],
    Cycles: [
        [['max',4,4]],
        [['up',2,5]],
        [['avail',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5]],
        [['lock',0,5],['lock',0,5],['lock',0,5],['lock',0,5]],
    ],
};

let accCat = 'Lacuna';

function accTreeHTML(name) {
    let k = 1;
    return ACC_TREE[name].map((tier, ti) => {
        const nodes = tier.map(([s, l, m]) => {
            const pct = s === 'max' ? 100 : (m ? Math.round(l / m * 100) : 0);
            const lv  = s === 'max' ? 'MAX' : `${l} / ${m}`;
            return `<div class="acc-node ${s}"><div class="acc-nrow"><span class="acc-nm">Dummy #${k++}</span>`
                + `<span class="acc-lv">${lv}</span></div><div class="acc-bar"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
        return (ti ? '<div class="acc-conn"></div>' : '') + `<div class="acc-tier">${nodes}</div>`;
    }).join('');
}

function accRender() {
    document.getElementById('acc-mass').innerHTML = ACC_MASS_ICON
        + `<div class="num">${fmtNum(G.mass)}</div><div class="lbl">Mass</div>`;

    const tabs = document.getElementById('acc-tabs');
    tabs.innerHTML = ACC_CATS.map(c =>
        `<button class="acc-tab${c === accCat ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
    tabs.querySelectorAll('.acc-tab').forEach(b =>
        b.addEventListener('click', () => { accCat = b.dataset.c; accRender(); }));

    document.getElementById('acc-title').textContent = accCat;
    document.getElementById('acc-sub').textContent   = ACC_SUB[accCat];
    document.getElementById('acc-tree').innerHTML     = accTreeHTML(accCat);
}

function openAccretion()  { document.getElementById('accretion-screen').classList.add('show'); accRender(); }
function closeAccretion() { document.getElementById('accretion-screen').classList.remove('show'); }

// Plain-language confirmation before committing an Accretion.
function accConfirmBody() {
    const gain = massGain();
    return `<p>This pulls everything in your universe into the Lacuna and collapses it.</p>
        <p class="acc-gain">You'll gain <b>${gain} Mass</b>.</p>
        <p>Mass comes from <b>all the stardust you've ever gathered</b> (${fmtNum(G.totalDust)} so far).
           The more you collect over your whole journey, the more Mass — so it grows slowly, and
           re-earning the same amount again barely adds any.</p>
        <p><b>What resets:</b> your stardust drops to zero and every stardust upgrade
           (Star Touch, the orbiters, Resonance…) is undone. You start a fresh universe.</p>
        <p><b>What you keep:</b> your Mass, and anything you spend it on.</p>`;
}
function openAccConfirm() {
    document.getElementById('acc-confirm-body').innerHTML = accConfirmBody();
    document.getElementById('acc-confirm').classList.add('show');
}
function closeAccConfirm() { document.getElementById('acc-confirm').classList.remove('show'); }

document.getElementById('accretion-btn').addEventListener('click', openAccretion);
document.getElementById('acc-close').addEventListener('click', closeAccretion);
document.querySelector('.acc-accrete').addEventListener('click', openAccConfirm);
document.getElementById('acc-confirm-cancel').addEventListener('click', closeAccConfirm);
document.getElementById('acc-confirm-go').addEventListener('click', () => {
    doAccretion();
    closeAccConfirm();
    closeAccretion();
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('acc-confirm').classList.contains('show')) closeAccConfirm();
    else closeAccretion();
});
