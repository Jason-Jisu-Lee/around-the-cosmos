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
        + '<div class="num">0</div><div class="lbl">Mass</div>';

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

document.getElementById('accretion-btn').addEventListener('click', openAccretion);
document.getElementById('acc-close').addEventListener('click', closeAccretion);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAccretion(); });
