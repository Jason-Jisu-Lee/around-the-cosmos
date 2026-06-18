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

// Observatory stats: build the DOM once per layout (the set of rows shown), then
// update values in place each tick — so the Comet hover popup doesn't flicker.
let statsSig = null;   // null (not '') so the first updateUI always builds the stats DOM
let statEls  = {};
function buildStats(showOrbiter, showComet) {
    const list = document.getElementById('stats-list');
    list.innerHTML = ''; statEls = {};
    const mk = label => {
        const row = document.createElement('div'); row.className = 'stat-row';
        row.innerHTML = `<span class="stat-label">${label}</span><span class="stat-val"></span>`;
        list.appendChild(row);
        return row.querySelector('.stat-val');
    };
    statEls.touch = mk('Star Touch Value');
    if (showOrbiter) statEls.orbiter = mk('All Orbiters Payout');
    statEls.rate = mk('Stardust / min');
    if (showComet) {
        const row = document.createElement('div'); row.className = 'stat-row stat-comet';
        row.innerHTML = `<span class="stat-label">Comet Value</span><span class="stat-val"></span><div class="stat-pop"></div>`;
        list.appendChild(row);
        statEls.comet = row.querySelector('.stat-val');
        statEls.cometPop = row.querySelector('.stat-pop');
    }
    statEls.time = mk('Time on Current Universe');
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
    const orbiterSum = orbiterCount * orbiterPayout();
    const cometVal = 10 * touchVal + orbiterSum;

    const showOrbiter = orbiterCount >= 1, showComet = G.cometSeen;
    const sig = (showOrbiter ? 'O' : '') + (showComet ? 'C' : '');
    if (sig !== statsSig) { buildStats(showOrbiter, showComet); statsSig = sig; }

    statEls.touch.textContent = '✦' + fmtNum(touchVal);
    if (statEls.orbiter) statEls.orbiter.textContent = '✦' + fmtNum(orbiterSum);
    statEls.rate.textContent = '✦' + fmtNum(G.income * 60) + ' / min';
    if (statEls.comet) {
        statEls.comet.textContent = '✦' + fmtNum(cometVal);
        statEls.cometPop.innerHTML = `Comet = 10 × click (${fmtNum(touchVal)}) + all orbiters payout (${fmtNum(orbiterSum)}) = <b>✦${fmtNum(cometVal)}</b>`;
    }
    statEls.time.textContent = fmtTime(G.universeTime);
}
