'use strict';



let lastVisibleSig = '';
let showCompleted  = false;
const sectionOpen  = {};
const cardRefs     = [];
const seenUpg      = new Set();
let firstPanelBuild = true;

function upgradeVisible(u) { return u.unlock ? u.unlock() : false; }


function isShown(u) {
    if (!upgradeVisible(u)) return false;
    const maxed = G.upgrades[u.id] >= u.maxLevel;
    return !maxed || showCompleted;
}


function visibleSig() {
    let s = (showCompleted ? 'C' : '_') + '|';
    for (const u of UPGRADES) if (isShown(u)) s += u.id + ',';
    return s;
}

function makeCard(u) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';

    if (!firstPanelBuild && !seenUpg.has(u.id)) {
        card.classList.add('upg-new');

        card.addEventListener('animationend', () => card.classList.remove('upg-new'), { once: true });
    }
    seenUpg.add(u.id);
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div>`
        + `<span class="upg-level"></span>`;

    card.addEventListener('click', () => {
        if (!buyUpgrade(u)) return;
        if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();
    });

    card.addEventListener('mouseenter', () => showUpgPop(u, card));
    card.addEventListener('mouseleave', hideUpgPop);
    cardRefs.push({ u, card,
        cost:  card.querySelector('.upg-cost'),
        level: card.querySelector('.upg-level') });
    return card;
}


const upgPop = document.getElementById('upg-pop');
function showUpgPop(u, cardEl) {

    const l = G.upgrades[u.id];
    const flavor = typeof u.flavor === 'function' ? u.flavor(l) : u.flavor;
    upgPop.innerHTML = (flavor ? `<div class="upg-pop-flavor">${flavor}</div>` : '')
        + `<div class="upg-pop-fn">${u.desc(l)}</div>`;
    upgPop.style.display = 'block';
    const r = cardEl.getBoundingClientRect();
    const pw = upgPop.offsetWidth, ph = upgPop.offsetHeight;
    let left = r.left - pw - 12;
    if (left < 6) left = r.right + 12;
    let top = r.top + r.height / 2 - ph / 2;
    top = Math.max(6, Math.min(top, window.innerHeight - ph - 6));
    upgPop.style.left = left + 'px';
    upgPop.style.top  = top + 'px';
}
function hideUpgPop() { upgPop.style.display = 'none'; }


function resetPanelAnimations() { seenUpg.clear(); }

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ''; cardRefs.length = 0;

    for (const sec of SECTION_ORDER) {
        const ups = UPGRADES.filter(u => u.section === sec && isShown(u));
        if (!ups.length) continue;

        const open = sectionOpen[sec] !== false;
        const section = document.createElement('div');
        section.className = 'acc' + (open ? ' open' : '');

        const head = document.createElement('div');
        head.className = 'acc-head';
        head.innerHTML = `<span class="acc-label"><span class="acc-arrow">▸</span>${sec}</span><span class="acc-count">${ups.length}</span>`;
        head.addEventListener('click', () => {
            const nowOpen = !section.classList.contains('open');
            section.classList.toggle('open', nowOpen);
            sectionOpen[sec] = nowOpen;
        });
        section.appendChild(head);

        const body = document.createElement('div');
        body.className = 'acc-body';
        for (const u of ups) body.appendChild(makeCard(u));
        section.appendChild(body);

        list.appendChild(section);
    }

    lastVisibleSig = visibleSig();
    firstPanelBuild = false;
    updateCards();
}

function updateCards() {
    for (const ref of cardRefs) {
        const u = ref.u;
        const l = G.upgrades[u.id];
        const isMax = l >= u.maxLevel;
        const cost = isMax ? null : u.costs[l];
        ref.card.classList.toggle('is-maxed',    isMax);
        ref.card.classList.toggle('can-afford', !isMax && G.dust >= cost);
        ref.cost.textContent = isMax ? 'MAX' : '✦' + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);

        ref.level.textContent = `${l} / ${u.maxLevel}`;

    }
}
