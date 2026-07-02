'use strict';

let lastVisibleSig = '';
let showCompleted  = true;
const sectionOpen  = {};
const cardRefs     = [];
const seenUpg      = new Set();
let firstPanelBuild = true;

function upgradeVisible(u) { return u.unlock ? u.unlock() : false; }

function isShown(u) {
    if (!upgradeVisible(u)) return false;
    const maxed = G.upgrades[u.id] >= u.maxLevel;
    return !maxed || showCompleted || !G.moonEverOwned;
}

function visibleSig() {
    let s = (showCompleted ? 'C' : '_') + (G.moonEverOwned ? 'M' : '_') + '|';
    for (const u of UPGRADES) if (isShown(u)) s += u.id + ',';
    return s;
}

function makeCard(u) {
    const card = document.createElement('div');
    card.className = 'upgrade-card' + (u.identity ? ' upg-identity' : '');
    card.dataset.upg = u.id;   // tutorial spotlights target cards via [data-upg="<id>"]

    if (!firstPanelBuild && !seenUpg.has(u.id)) {
        card.classList.add('upg-new');
        card.addEventListener('animationend', () => card.classList.remove('upg-new'), { once: true });
    }
    seenUpg.add(u.id);
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div>`
        + `<div class="upg-botrow"><div class="upg-bar"><i></i></div><span class="upg-level"></span></div>`;
    let drain = null;
    if (u.id === 'afterglow') { drain = document.createElement('div'); drain.className = 'upg-drain'; card.appendChild(drain); }

    // Identity upgrades: only the FIRST level (the lock-in) is HOLD-to-buy, with a fill bar under the
    // card showing hold progress. Once chosen (lvl >= 1) it upgrades on a normal click like any other
    // card. Everything else (and identity lvls 2-5) is a plain click.
    if (u.identity && G.upgrades[u.id] === 0) {
        const holdBar = document.createElement('div'); holdBar.className = 'upg-hold'; card.appendChild(holdBar);
        wireIdentityHold(card, u, holdBar);
    } else {
        card.addEventListener('click', () => {
            if (!buyUpgrade(u)) return;
            if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards();
        });
    }

    card.addEventListener('mouseenter', () => { showUpgPop(u, card); SoundSystem.sfxHover(); });
    card.addEventListener('mouseleave', hideUpgPop);
    cardRefs.push({ u, card, drain,
        cost:  card.querySelector('.upg-cost'),
        level: card.querySelector('.upg-level'),
        bar:   card.querySelector('.upg-bar > i') });
    return card;
}

// The identity LOCK-IN (level 0 -> 1) is bought by HOLDING (not clicking). The card vibrates while held
// (.holding) and a fill bar (holdBar) sweeps 0 -> 1 over HOLD_MS; releasing early cancels + snaps it back.
// On commit we rebuild the panel so the now-chosen card re-wires to a plain click for levels 2-5.
// Only starts if buyable (not maxed, not locked, affordable).
function wireIdentityHold(card, u, holdBar) {
    const HOLD_MS = 750;
    let timer = null;
    const resetBar = () => { if (holdBar) { holdBar.style.transition = 'none'; holdBar.style.transform = 'scaleX(0)'; } };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } card.classList.remove('holding'); resetBar(); };
    const start = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (timer) return;
        if (typeof vortexStealing === 'function' && vortexStealing()) return;   // vortex lock: no spending
        const l = G.upgrades[u.id];
        if (l >= u.maxLevel) return;                       // already chosen
        if (identityLockedBy(u)) return;                   // another identity locked it
        if (G.dust < u.costs[l]) return;                   // can't afford -> no hold
        card.classList.add('holding');
        if (holdBar) {                                     // sweep the fill bar 0 -> 1 over the hold
            resetBar(); void holdBar.offsetWidth;          // commit the 0 state before transitioning
            holdBar.style.transition = `transform ${HOLD_MS}ms linear`;
            holdBar.style.transform = 'scaleX(1)';
        }
        timer = setTimeout(() => { stop(); if (buyUpgrade(u)) buildPanels(); }, HOLD_MS);
    };
    card.addEventListener('mousedown', start);
    card.addEventListener('mouseup', stop);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('touchstart', start, { passive: false });
    card.addEventListener('touchend', stop);
    card.addEventListener('touchcancel', stop);
}

const upgPop = document.getElementById('upg-pop');
let popUpg = null, popCard = null, popHtml = '';   // the upgrade currently hovered - renderUpgPop keeps its popup LIVE

function showUpgPop(u, cardEl) {
    popUpg = u; popCard = cardEl;
    renderUpgPop();
}

// (Re)renders the open popup from current state. Called on hover, after every buy, and each
// updateCards tick - so the popup updates in real time while the mouse stays on the card
// (level-ups, live values like Gravitational Pull's ✦/pulse or the Standstill orbit tally).
function renderUpgPop() {
    if (!popUpg) return;
    const u = popUpg, l = G.upgrades[u.id];
    const flavor = typeof u.flavor === 'function' ? u.flavor(l) : u.flavor;
    const desc = u.desc ? u.desc(l) : '';   // desc is optional - pure stat upgrades rely on name + Now/Next alone
    let html = (flavor ? `<div class="upg-pop-flavor">${flavor}</div>` : '')
        + (desc ? `<div class="upg-pop-fn">${desc}</div>` : '');
    // Now / Next rows: the total bonus at the owned level and at the next one (u.now(l)),
    // so what the upgrade provides - and will provide - is always visible.
    if (u.now) {
        let rows = '';
        if (l > 0)          rows += `<div class="upg-pop-stat"><span class="upg-pop-k">Now</span><span class="upg-pop-v">${u.now(l)}</span></div>`;
        if (l < u.maxLevel) rows += `<div class="upg-pop-stat"><span class="upg-pop-k">Next</span><span class="upg-pop-v">${u.now(l + 1)}</span></div>`;
        if (rows) html += `<div class="upg-pop-stats">${rows}</div>`;
    }
    if (html !== popHtml) { upgPop.innerHTML = html; popHtml = html; }
    upgPop.style.display = 'block';
    const r = popCard.getBoundingClientRect();
    const pw = upgPop.offsetWidth, ph = upgPop.offsetHeight;
    let left = r.left - pw - 12;
    if (left < 6) left = r.right + 12;
    let top = r.top + r.height / 2 - ph / 2;
    top = Math.max(6, Math.min(top, window.innerHeight - ph - 6));
    upgPop.style.left = left + 'px';
    upgPop.style.top  = top + 'px';
}
function hideUpgPop() { popUpg = null; popCard = null; popHtml = ''; upgPop.style.display = 'none'; }

function resetPanelAnimations() { seenUpg.clear(); }

function buildPanels() {
    const mainList = document.getElementById('main-upgrades');
    const list = document.getElementById('upgrades-list');
    mainList.innerHTML = ''; list.innerHTML = ''; cardRefs.length = 0;

    for (const sec of SECTION_ORDER) {
        const ups = UPGRADES.filter(u => u.section === sec && isShown(u));
        if (!ups.length) continue;

        if (sec === 'MAIN') {
            for (const u of ups) mainList.appendChild(makeCard(u));
            continue;
        }

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

    appendPrestigeCards(mainList);

    // A rebuild replaces every card element; re-anchor the open popup to the hovered upgrade's
    // NEW card (e.g. an identity lock-in rebuilds mid-hover), or hide it if the card is gone.
    if (popUpg) {
        const ref = cardRefs.find(r => r.u.id === popUpg.id);
        if (ref) popCard = ref.card; else hideUpgPop();
    }

    lastVisibleSig = visibleSig();
    firstPanelBuild = false;
    updateCards();
}

function appendPrestigeCards(mainList) {
    const acc = document.createElement('div');
    acc.id = 'accretion-btn'; acc.className = 'accretion-card';
    acc.innerHTML = '<span class="acc-card-label">Accretion</span><div class="acc-card-prog"><i></i></div>';
    acc.addEventListener('click', () => { if (typeof canAccrete === 'function' && canAccrete() && typeof openAccConfirm === 'function') openAccConfirm(); });
    acc.addEventListener('mouseenter', () => SoundSystem.sfxHover());
    mainList.appendChild(acc);

    const mass = document.createElement('div');
    mass.id = 'mass-upgrades-btn'; mass.className = 'mass-upg-card'; mass.textContent = 'Mass Upgrades';
    mass.addEventListener('click', () => { if (typeof openMassBrowse === 'function') openMassBrowse(); });
    mass.addEventListener('mouseenter', () => SoundSystem.sfxHover());
    mainList.appendChild(mass);
}

function updateCards() {
    for (const ref of cardRefs) {
        const u = ref.u;
        const l = G.upgrades[u.id];
        const isMax = l >= u.maxLevel;
        const locked = !!u.identity && !isMax && !!identityLockedBy(u);   // another identity in the group was chosen
        const cost = isMax ? null : u.costs[l];
        const afford = !isMax && !locked && G.dust >= cost;

        if (ref._afford !== afford) { ref.card.classList.toggle('can-afford', afford); ref._afford = afford; }
        if (ref._locked !== locked) { ref.card.classList.toggle('upg-locked', locked); ref._locked = locked; }
        if (ref._max !== isMax) {
            ref.card.classList.toggle('is-maxed', isMax);
            ref.cost.classList.toggle('maxed', isMax);
            ref._max = isMax;
        }
        const costText = isMax ? 'MAX' : locked ? 'Locked' : '✦' + fmtNum(cost);
        if (ref._costText !== costText) { ref.cost.textContent = costText; ref._costText = costText; }
        if (ref._lvl !== l) {
            ref.level.textContent = `${l} / ${u.maxLevel}`;
            ref.bar.style.width = (l / u.maxLevel * 100) + '%';
            ref._lvl = l;
        }
        if (ref.drain) {   // Afterglow buff: light the card + drain the bar over the 60s window
            const on = typeof afterglowActive === 'function' && afterglowActive();
            const fr = on ? afterglowFrac() : 0, low = on && fr < 0.18;
            if (ref._glowOn  !== on)  { ref.card.classList.toggle('afterglow-on', on);   ref._glowOn = on; }
            if (ref._glowLow !== low) { ref.card.classList.toggle('afterglow-low', low); ref._glowLow = low; }
            if (ref._fr !== fr) { ref.drain.style.transform = `scaleX(${fr})`; ref._fr = fr; }
        }
    }
    // vortex lock: while it feeds, every card reads visually blocked (and buyUpgrade refuses anyway)
    const vlock = typeof vortexStealing === 'function' && vortexStealing();
    if (updateCards._vlock !== vlock) {
        updateCards._vlock = vlock;
        document.getElementById('main-upgrades').classList.toggle('vortex-lock', vlock);
        document.getElementById('upgrades-list').classList.toggle('vortex-lock', vlock);
    }
    renderUpgPop();   // keep the hovered card's popup live (no-op when none is open)
}
