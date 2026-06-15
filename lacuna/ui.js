'use strict';

let lastUITick     = 0;
let lastVisibleSig = '';
const cardRefs     = [];

function upgradeVisible(u) { return u.unlock ? u.unlock() : false; }

// Fingerprint of which cards should currently show. Changes → panel rebuilds.
function visibleSig() {
    let s = '';
    for (const u of UPGRADES) if (upgradeVisible(u)) s += u.id + ',';
    return s;
}

function makeCard(u) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div><div class="upg-desc"></div>`;
    card.addEventListener('click', () => { if (buyUpgrade(u)) updateCards(); });
    cardRefs.push({ u, card, cost:card.querySelector('.upg-cost'), desc:card.querySelector('.upg-desc') });
    return card;
}

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ''; cardRefs.length = 0;

    // Main list — upgrades with no section
    for (const u of UPGRADES) {
        if (!u.section && upgradeVisible(u)) list.appendChild(makeCard(u));
    }

    // Sectioned upgrades — each distinct section gets its own heading
    const sections = [];
    for (const u of UPGRADES)
        if (u.section && upgradeVisible(u) && !sections.includes(u.section)) sections.push(u.section);
    for (const sec of sections) {
        const title = document.createElement('div');
        title.className = 'panel-title'; title.style.marginTop = '26px'; title.textContent = sec;
        list.appendChild(title);
        for (const u of UPGRADES)
            if (u.section === sec && upgradeVisible(u)) list.appendChild(makeCard(u));
    }

    lastVisibleSig = visibleSig();
    updateCards();
}

function updateCards() {
    for (const ref of cardRefs) {
        const { u, card } = ref;
        const l     = G.upgrades[u.id];
        const isMax = l >= u.maxLevel;
        const cost  = isMax ? null : u.costs[l];
        card.classList.toggle('is-maxed',    isMax);
        card.classList.toggle('can-afford', !isMax && G.dust >= cost);
        ref.cost.textContent = isMax ? '—' : '✦' + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        ref.desc.textContent = u.desc(l);
    }
}

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent   = fmtNum(G.income * 60) + ' / min';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    document.getElementById('stats-list').innerHTML = [
        ['Total Stardust', '✦'+fmtNum(G.totalDust)],
        ['Planets',        G.planets.length],
        ['Orbits',         G.orbitsCompleted.toLocaleString()],
        ['Taps',           G.taps.toLocaleString()],
        ['Comets Caught',  G.cometsCaught],
        ['Time',           fmtTime(G.gameTime)],
    ].map(([l,v]) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`).join('');
}
