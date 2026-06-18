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
        const u = ref.u;
        const l = G.upgrades[u.id];
        const isMax = l >= u.maxLevel;
        const cost = isMax ? null : u.costs[l];
        ref.card.classList.toggle('is-maxed',    isMax);
        ref.card.classList.toggle('can-afford', !isMax && G.dust >= cost);
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

    // Show the "completed" toggle only once something has actually been maxed.
    const anyMaxed = UPGRADES.some(u => upgradeVisible(u) && G.upgrades[u.id] >= u.maxLevel);
    document.getElementById('upg-controls').style.display = anyMaxed ? '' : 'none';

    if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();

    // ---- Observatory stats ----
    const touchVal = upg('touch').tapYield[lvl('touch')];
    const orbiterCount = G.planets.length;
    const orbiterSum   = orbiterCount * orbiterPayout();
    const orbiterPerMin = orbiterSum * (60 / PLANET_DEF[0].period); // ring-0 orbits per minute
    const cometVal = 10 * touchVal + orbiterSum;
    const row = (l, v) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`;

    let html = row('Star Touch Value', '✦'+fmtNum(touchVal));
    if (orbiterCount >= 1) {                                   // only after first orbiter
        html += row('All Orbiters Payout', '✦'+fmtNum(orbiterSum));
        html += row('All Orbiters Payout / min', '✦'+fmtNum(orbiterPerMin));
    }
    if (G.cometSeen) {                                         // only after first comet caught
        html += `<div class="stat-row stat-comet"><span class="stat-label">Comet Value</span><span class="stat-val">✦${fmtNum(cometVal)}</span>`
              + `<div class="stat-pop">Comet = 10 × click (${fmtNum(touchVal)}) + all orbiters payout (${fmtNum(orbiterSum)}) = <b>✦${fmtNum(cometVal)}</b></div></div>`;
    }
    html += row('Time on Current Universe', fmtTime(G.universeTime));
    document.getElementById('stats-list').innerHTML = html;
}
