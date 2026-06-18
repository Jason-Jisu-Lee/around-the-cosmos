'use strict';

let lastUITick     = 0;
let lastVisibleSig = '';
let showCompleted  = false;       // hide maxed upgrades unless toggled on
const sectionOpen  = {};          // per-section accordion state; undefined = open by default
const cardRefs     = [];

function upgradeVisible(u) { return u.unlock ? u.unlock() : false; }

// Whether a card actually renders: unlocked, and not maxed (unless showing completed).
function isShown(u) {
    if (!upgradeVisible(u)) return false;
    const maxed = G.upgrades[u.id] >= u.maxLevel;
    return !maxed || showCompleted;
}

// Per-planet upgrade visible: not maxed (unless showing completed).
function isPlanetShown(p, def) {
    const maxed = p.up[def.id] >= def.maxLevel;
    return !maxed || showCompleted;
}

// Fingerprint of the rendered card set. Changes → rebuild (unlock, max-out, toggle, planet count).
function visibleSig() {
    let s = (showCompleted ? 'C' : '_') + '|';
    for (const u of UPGRADES) if (isShown(u)) s += u.id + ',';
    s += '|P' + G.planets.length + ':';
    for (let i = 0; i < G.planets.length; i++)
        for (const def of PLANET_UPGRADES)
            if (isPlanetShown(G.planets[i], def)) s += i + def.id + ',';
    return s;
}

function makeCard(u) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div><div class="upg-desc"></div>`;
    card.addEventListener('click', () => { if (buyUpgrade(u)) buildPanels(); });
    cardRefs.push({ kind:'global', u, card, cost:card.querySelector('.upg-cost'), desc:card.querySelector('.upg-desc') });
    return card;
}

// Per-planet upgrade card (Orbit Payout / Orbit Speed), shown in the PLANETS section.
function makePlanetCard(def, pIdx) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    const label = def.name + (G.planets.length > 1 ? ` · P${pIdx+1}` : '');
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${label}</span><span class="upg-cost"></span></div><div class="upg-desc"></div>`;
    card.addEventListener('click', () => { if (buyPlanetUpgrade(pIdx, def.id)) buildPanels(); });
    cardRefs.push({ kind:'planet', def, pIdx, card, cost:card.querySelector('.upg-cost'), desc:card.querySelector('.upg-desc') });
    return card;
}

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ''; cardRefs.length = 0;

    for (const sec of SECTION_ORDER) {
        const ups = UPGRADES.filter(u => u.section === sec && isShown(u));

        // Per-planet upgrades (one set per planet) live in the PLANETS section.
        const planetCards = [];
        if (sec === 'PLANETS') {
            for (let i = 0; i < G.planets.length; i++)
                for (const def of PLANET_UPGRADES)
                    if (isPlanetShown(G.planets[i], def)) planetCards.push([def, i]);
        }
        const count = ups.length + planetCards.length;
        if (!count) continue;

        const open = sectionOpen[sec] !== false; // default open
        const section = document.createElement('div');
        section.className = 'acc' + (open ? ' open' : '');

        const head = document.createElement('div');
        head.className = 'acc-head';
        head.innerHTML = `<span class="acc-label"><span class="acc-arrow">▸</span>${sec}</span><span class="acc-count">${count}</span>`;
        head.addEventListener('click', () => {
            const nowOpen = !section.classList.contains('open');
            section.classList.toggle('open', nowOpen);
            sectionOpen[sec] = nowOpen;
        });
        section.appendChild(head);

        const body = document.createElement('div');
        body.className = 'acc-body';
        for (const u of ups) body.appendChild(makeCard(u));
        for (const [def, i] of planetCards) body.appendChild(makePlanetCard(def, i));
        section.appendChild(body);

        list.appendChild(section);
    }

    lastVisibleSig = visibleSig();
    updateCards();
}

function updateCards() {
    for (const ref of cardRefs) {
        let l, isMax, cost, descText;
        if (ref.kind === 'planet') {
            const p = G.planets[ref.pIdx]; if (!p) continue;
            l = p.up[ref.def.id];
            isMax = l >= ref.def.maxLevel;
            cost  = isMax ? null : ref.def.cost(l);
            descText = ref.def.desc(l);
        } else {
            l = G.upgrades[ref.u.id];
            isMax = l >= ref.u.maxLevel;
            cost  = isMax ? null : ref.u.costs[l];
            descText = ref.u.desc(l);
        }
        ref.card.classList.toggle('is-maxed',    isMax);
        ref.card.classList.toggle('can-afford', !isMax && G.dust >= cost);
        ref.cost.textContent = isMax ? '—' : '✦' + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        ref.desc.textContent = descText;
    }
}

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent   = fmtNum(G.income * 60) + ' / min';

    // Show the "completed" toggle only once something has actually been maxed.
    const anyMaxed = UPGRADES.some(u => upgradeVisible(u) && G.upgrades[u.id] >= u.maxLevel)
        || G.planets.some(p => PLANET_UPGRADES.some(def => p.up[def.id] >= def.maxLevel));
    document.getElementById('upg-controls').style.display = anyMaxed ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    // ---- Observatory stats ----
    const touchVal = upg('touch').tapYield[lvl('touch')];
    let orbitSum = 0, orbitPerMin = 0;
    for (const p of G.planets) {
        const pay = orbitPayout(p.idx);
        const period = PLANET_DEF[p.idx].period / planetUpgDef('speed').mult(p.up.speed);
        orbitSum    += pay;
        orbitPerMin += pay * (60 / period);
    }
    const cometVal = 10 * touchVal + orbitSum;
    const row = (l, v) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`;
    document.getElementById('stats-list').innerHTML =
        row('Star Touch Value', '✦'+fmtNum(touchVal)) +
        row('All Planet Orbit Payout', '✦'+fmtNum(orbitSum)) +
        `<div class="stat-row stat-comet"><span class="stat-label">Comet Value</span><span class="stat-val">✦${fmtNum(cometVal)}</span>` +
            `<div class="stat-pop">Comet = 10 × click (${fmtNum(touchVal)}) + all orbit payout (${fmtNum(orbitSum)}) = <b>✦${fmtNum(cometVal)}</b></div></div>` +
        row('All Planet Orbit Payout / min', '✦'+fmtNum(orbitPerMin)) +
        row('Time on Current Universe', fmtTime(G.universeTime));
}
