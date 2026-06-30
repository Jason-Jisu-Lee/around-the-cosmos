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

    if (!firstPanelBuild && !seenUpg.has(u.id)) {
        card.classList.add('upg-new');
        card.addEventListener('animationend', () => card.classList.remove('upg-new'), { once: true });
    }
    seenUpg.add(u.id);
    card.innerHTML = `<div class="upg-top"><span class="upg-name">${u.name}</span><span class="upg-cost"></span></div>`
        + `<div class="upg-botrow"><div class="upg-bar"><i></i></div><span class="upg-level"></span></div>`;
    let drain = null;
    if (u.id === 'afterglow') { drain = document.createElement('div'); drain.className = 'upg-drain'; card.appendChild(drain); }

    if (u.identity) {
        wireIdentityHold(card, u);   // identity upgrades are HOLD-to-buy (vibrate while held)
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

function afterBuy() { if (visibleSig() !== lastVisibleSig) buildPanels(); else updateCards(); }

// Identity upgrades are bought by HOLDING (not clicking). The card vibrates while held (.holding),
// and commits at HOLD_MS. Releasing early cancels. Only starts if buyable (not maxed, not locked, affordable).
function wireIdentityHold(card, u) {
    const HOLD_MS = 750;
    let timer = null;
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } card.classList.remove('holding'); };
    const start = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (timer) return;
        const l = G.upgrades[u.id];
        if (l >= u.maxLevel) return;                       // already chosen
        if (identityLockedBy(u)) return;                   // another identity locked it
        if (G.dust < u.costs[l]) return;                   // can't afford -> no hold
        card.classList.add('holding');
        timer = setTimeout(() => { stop(); if (buyUpgrade(u)) afterBuy(); }, HOLD_MS);
    };
    card.addEventListener('mousedown', start);
    card.addEventListener('mouseup', stop);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('touchstart', start, { passive: false });
    card.addEventListener('touchend', stop);
    card.addEventListener('touchcancel', stop);
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
            ref.drain.style.transform = `scaleX(${fr})`;
        }
    }
}
