'use strict';

let lastUITick     = 0;
let lastVisibleSig = '';
let showCompleted  = false;       // hide maxed upgrades unless toggled on
const sectionOpen  = {};          // per-section accordion state; undefined = open by default
const cardRefs     = [];

let activeTab      = 'main';      // 'main' (accordion) or a planet index
let lastTabSig     = '';          // planet count fingerprint → rebuild tab bar
const planetCardRefs = [];

function upgradeVisible(u) { return u.unlock ? u.unlock() : false; }

// Whether a card actually renders: unlocked, and not maxed (unless showing completed).
function isShown(u) {
    if (!upgradeVisible(u)) return false;
    const maxed = G.upgrades[u.id] >= u.maxLevel;
    return !maxed || showCompleted;
}

// Fingerprint of the rendered card set. Changes → rebuild (unlock, max-out, toggle).
function visibleSig() {
    let s = (showCompleted ? 'C' : '_') + '|';
    for (const u of UPGRADES) if (isShown(u)) s += u.id + ',';
    return s;
}

function makeCard(u) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div><div class="upg-desc"></div>`;
    card.addEventListener('click', () => { if (buyUpgrade(u)) buildPanels(); });
    cardRefs.push({ u, card, cost:card.querySelector('.upg-cost'), desc:card.querySelector('.upg-desc') });
    return card;
}

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ''; cardRefs.length = 0;

    for (const sec of SECTION_ORDER) {
        const ups = UPGRADES.filter(u => u.section === sec && isShown(u));
        if (!ups.length) continue;

        const open = sectionOpen[sec] !== false; // default open
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

// ---- Tabs: Main (accordion) + one per planet ----
function buildTabs() {
    const bar = document.getElementById('tab-bar');
    bar.innerHTML = '';
    bar.style.display = G.planets.length ? 'flex' : 'none';  // no tabs until a planet exists

    const tabs = [['main', 'Main']];
    for (let i = 0; i < G.planets.length; i++) tabs.push([i, 'P' + (i + 1)]);

    for (const [key, label] of tabs) {
        const b = document.createElement('button');
        let cls = 'tab-btn';
        if (String(activeTab) === String(key)) cls += ' active';
        if (key !== 'main' && !G.planets[key].seen) cls += ' new'; // pulse until viewed
        b.className = cls;
        b.textContent = label;
        b.addEventListener('click', () => setActiveTab(key));
        bar.appendChild(b);
    }
    lastTabSig = String(G.planets.length);
}

function setActiveTab(key) {
    if (key !== 'main' && !G.planets[key]) key = 'main';
    activeTab = key;
    if (key !== 'main' && !G.planets[key].seen) { G.planets[key].seen = true; saveGame(); } // viewed → not new
    const isMain = key === 'main';
    document.getElementById('main-tab').style.display   = isMain ? 'block' : 'none';
    document.getElementById('planet-tab').style.display = isMain ? 'none' : 'block';
    buildTabs();
    if (!isMain) buildPlanetTab(key);
}

function buildPlanetTab(idx) {
    const panel = document.getElementById('planet-tab');
    panel.innerHTML = ''; planetCardRefs.length = 0;
    if (!G.planets[idx]) return;

    const title = document.createElement('div');
    title.className = 'planet-tab-title';
    title.textContent = 'Planet ' + (idx + 1);
    panel.appendChild(title);

    for (const def of PLANET_UPGRADES) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `<div class="upg-top"><span class="upg-name">${def.name}</span><span class="upg-cost"></span></div><div class="upg-desc"></div>`;
        card.addEventListener('click', () => { if (buyPlanetUpgrade(idx, def.id)) buildPlanetTab(idx); });
        panel.appendChild(card);
        planetCardRefs.push({ def, pIdx: idx, card, cost: card.querySelector('.upg-cost'), desc: card.querySelector('.upg-desc') });
    }
    updatePlanetCards();
}

function updatePlanetCards() {
    for (const ref of planetCardRefs) {
        const p = G.planets[ref.pIdx]; if (!p) continue;
        const l = p.up[ref.def.id];
        const isMax = l >= ref.def.maxLevel;
        const cost = isMax ? null : ref.def.cost(l);
        ref.card.classList.toggle('is-maxed',    isMax);
        ref.card.classList.toggle('can-afford', !isMax && G.dust >= cost);
        ref.cost.textContent = isMax ? '—' : '✦' + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        ref.desc.textContent = ref.def.desc(l);
    }
}

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent   = fmtNum(G.income * 60) + ' / min';

    // Rebuild the tab bar when the planet count changes; keep active tab valid.
    if (String(G.planets.length) !== lastTabSig) {
        if (activeTab !== 'main' && !G.planets[activeTab]) setActiveTab('main');
        else buildTabs();
    }

    // Show the "completed" toggle only once something has actually been maxed.
    const anyMaxed = UPGRADES.some(u => upgradeVisible(u) && G.upgrades[u.id] >= u.maxLevel);
    document.getElementById('upg-controls').style.display = anyMaxed ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();
    if (activeTab !== 'main') updatePlanetCards();

    document.getElementById('stats-list').innerHTML = [
        ['Total Stardust', '✦'+fmtNum(G.totalDust)],
        ['Planets',        G.planets.length],
        ['Orbits',         G.orbitsCompleted.toLocaleString()],
        ['Taps',           G.taps.toLocaleString()],
        ['Comets Caught',  G.cometsCaught],
        ['Time',           fmtTime(G.gameTime)],
    ].map(([l,v]) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`).join('');
}
