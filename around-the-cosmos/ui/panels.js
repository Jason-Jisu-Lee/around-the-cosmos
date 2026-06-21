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
    if (!firstPanelBuild && !seenUpg.has(u.id)) {
        card.classList.add('upg-new');
        // Drop the class once the sweep ends so the card returns to its default look seamlessly.
        card.addEventListener('animationend', () => card.classList.remove('upg-new'), { once: true });
    }
    seenUpg.add(u.id);
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div>`
        + `<span class="upg-level"></span>`;    // pinned in the card's bottom-right corner (CSS)
    // On buy, only rebuild the whole panel if the visible set changed (a new unlock, or a
    // card maxed + hidden). Otherwise just refresh values in place — rebuilding would recreate
    // every card element and kill any in-progress "new upgrade" highlight on a sibling card.
    card.addEventListener('click', () => {
        if (!buyUpgrade(u)) return;
        if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();
    });
    // Description shows in the shared left-side popup on hover (not a child of the card).
    card.addEventListener('mouseenter', () => showUpgPop(u, card));
    card.addEventListener('mouseleave', hideUpgPop);
    cardRefs.push({ u, card,
        cost:  card.querySelector('.upg-cost'),
        level: card.querySelector('.upg-level') });
    return card;
}

// Shared description popup, positioned to the LEFT of the hovered card (fixed → escapes
// the right column's overflow clip, so it hides nothing in the list).
const upgPop = document.getElementById('upg-pop');
function showUpgPop(u, cardEl) {
    // Two areas: an optional flavor "description" on top, and the actual "Effect" below.
    const l = G.upgrades[u.id];
    const flavor = typeof u.flavor === 'function' ? u.flavor(l) : u.flavor;
    upgPop.innerHTML = (flavor ? `<div class="upg-pop-flavor">${flavor}</div>` : '')
        + `<div class="upg-pop-fn">${u.desc(l)}</div>`;
    upgPop.style.display = 'block';
    const r = cardEl.getBoundingClientRect();
    const pw = upgPop.offsetWidth, ph = upgPop.offsetHeight;
    let left = r.left - pw - 12;                 // to the left of the card
    if (left < 6) left = r.right + 12;           // no room? fall back to the right
    let top = r.top + r.height / 2 - ph / 2;     // vertically centred on the card
    top = Math.max(6, Math.min(top, window.innerHeight - ph - 6));
    upgPop.style.left = left + 'px';
    upgPop.style.top  = top + 'px';
}
function hideUpgPop() { upgPop.style.display = 'none'; }

// Reset the "new upgrade" highlight tracking — call on any universe reset (debug Reset,
// and prestige later). Without this the in-memory `seenUpg` survives the reset (no page
// reload happens), so re-unlocked upgrades wouldn't flash again. We clear `seenUpg` but
// DON'T re-arm `firstPanelBuild` (it's already false): a reset/prestige drops to the base
// universe (just Star Touch visible), so letting that one card flash is a nice "new universe"
// cue and immediate confirmation — and there's no flash-storm risk since progress is gone.
function resetPanelAnimations() { seenUpg.clear(); }

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
        ref.cost.textContent = isMax ? 'MAX' : '✦' + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        // Level shown small in the card's bottom-right corner (e.g. "1 / 5").
        ref.level.textContent = `${l} / ${u.maxLevel}`;
        // (description text is rendered on hover by showUpgPop, not stored per-card)
    }
}
