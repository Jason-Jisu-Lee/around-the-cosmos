'use strict';

// ── Upgrade panels ───────────────────────────────────────────────────────────
// The right-hand upgrade list: multi-open accordion sections, cards rebuilt only
// when the visible set changes (visibleSig), values refreshed in place otherwise.

let lastVisibleSig = '';
let showCompleted  = true;        // completed upgrades visible by default ("Hide completed" toggles off)
const sectionOpen  = {};          // per-section accordion state; undefined = open by default
const cardRefs     = [];
const seenUpg      = new Set();    // upgrade ids that have rendered before (for the "new" sweep)
let firstPanelBuild = true;       // don't animate everything that's already visible on first build

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
    // First time this upgrade is ever shown (and not just the initial page build) → sweep highlight.
    if (!firstPanelBuild && !seenUpg.has(u.id)) card.classList.add('upg-new');
    seenUpg.add(u.id);
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div>`
        + `<span class="upg-level"></span>`     // pinned in the card's bottom-right corner (CSS)
        + `<div class="upg-desc"></div>`;
    card.addEventListener('click', () => { if (buyUpgrade(u)) buildPanels(); });
    cardRefs.push({ u, card,
        cost:  card.querySelector('.upg-cost'),
        level: card.querySelector('.upg-level'),
        desc:  card.querySelector('.upg-desc') });
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
    firstPanelBuild = false;   // after the first build, future unlocks animate as "new"
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
        // Level shown small in the card's bottom-right corner (e.g. "1 / 5").
        ref.level.textContent = `${l} / ${u.maxLevel}`;
        ref.desc.textContent = u.desc(l);
    }
}
