'use strict';

// ─── UI STATE ────────────────────────────────────────────────────────────────

let debugFullView      = false; // set by debug.js toggle
let remnantSectionShown = false;
let lastUITick          = 0;
const cardRefs          = [];
let collapseCard        = null;

// ─── PROGRESSIVE UNLOCK ───────────────────────────────────────────────────────
// In Play View: only show upgrades where unlock() returns true.
// In Full View (debug): show everything regardless.
// To add a milestone: set upgrade.unlock = () => <condition using G>  in config.js

function upgradeVisible(u) {
    if (debugFullView) return true;
    return u.unlock ? u.unlock() : false;
}

// ─── UPGRADE CARDS ───────────────────────────────────────────────────────────

function makeCard(u, getLvl, buy, symbol, extraClass) {
    const card = document.createElement('div');
    card.className = 'upgrade-card' + (extraClass || '');
    card.innerHTML = `<div class="upg-top">
  <span class="upg-name">${u.name}</span>
  <span class="upg-cost"></span>
</div>
<div class="upg-desc"></div>
<div class="upg-row">
  <div class="upg-bar-bg"><div class="upg-bar-fill"></div></div>
  <div class="upg-level"></div>
</div>`;
    card.addEventListener('click', () => { if (buy(u)) updateCards(); });
    cardRefs.push({
        u, card, getLvl, symbol,
        cost:  card.querySelector('.upg-cost'),
        desc:  card.querySelector('.upg-desc'),
        fill:  card.querySelector('.upg-bar-fill'),
        level: card.querySelector('.upg-level'),
    });
    return card;
}

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = '';
    cardRefs.length = 0;
    collapseCard = null;

    // Run upgrades — filtered by unlock condition
    for (const u of UPGRADES) {
        if (!upgradeVisible(u)) continue;
        list.appendChild(makeCard(u, () => G.upgrades[u.id], buyUpgrade, '✦', u.special ? ' is-special' : ''));
    }

    // Singularity section — hidden until progress warrants it
    const showSingularity = debugFullView
        || G.collapses > 0
        || G.remnants  > 0
        || G.runDust   >= CFG.COLLAPSE_UNIT * 0.5;

    if (showSingularity) {
        const title = document.createElement('div');
        title.className = 'panel-title';
        title.style.marginTop = '26px';
        title.textContent = 'SINGULARITY';
        list.appendChild(title);

        collapseCard = document.createElement('div');
        collapseCard.className = 'upgrade-card collapse-card';
        collapseCard.innerHTML = `<div class="upg-top">
  <span class="upg-name">Collapse the Star</span>
  <span class="upg-cost collapse-gain"></span>
</div>
<div class="upg-desc collapse-desc"></div>`;
        collapseCard.addEventListener('click', collapse);
        list.appendChild(collapseCard);

        for (const u of REMNANT_UPGRADES) {
            if (!upgradeVisible(u)) continue;
            list.appendChild(makeCard(u, () => G.remnantUpgrades[u.id], buyRemnantUpgrade, '✸', ' is-remnant'));
        }
    }

    updateCards();
}

function updateCards() {
    for (const ref of cardRefs) {
        const { u, card } = ref;
        const l      = ref.getLvl();
        const isMax  = l >= u.maxLevel;
        const cost   = isMax ? null : u.costs[l];
        const wallet = ref.symbol === '✸' ? G.remnants : G.dust;
        card.classList.toggle('is-maxed',    isMax);
        card.classList.toggle('can-afford', !isMax && wallet >= cost);
        ref.cost.textContent = isMax ? '—' : ref.symbol + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        ref.desc.textContent  = u.desc(l);
        ref.fill.style.width  = (isMax ? 100 : (l / u.maxLevel) * 100) + '%';
        ref.level.textContent = isMax ? 'MAX' : `${l}/${u.maxLevel}`;
    }

    if (collapseCard) {
        const gain = collapseGain();
        collapseCard.classList.toggle('can-collapse', gain >= 1);
        collapseCard.querySelector('.collapse-gain').textContent = gain >= 1 ? `+✸${gain}` : '✸0';
        collapseCard.querySelector('.collapse-desc').textContent = gain >= 1
            ? 'Reset this run for permanent Remnants.'
            : `Earn ✦${fmtNum(CFG.COLLAPSE_UNIT)} in one run to gain your first Remnant.`;
    }
}

// ─── HUD UPDATE ───────────────────────────────────────────────────────────────

function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent   = fmtNum(G.income) + ' / s';

    const rEl = document.getElementById('remnant-display');
    if (G.remnants > 0 || G.collapses > 0) {
        rEl.style.display = '';
        document.getElementById('remnant-amount').textContent = fmtNum(G.remnants);
    } else {
        rEl.style.display = 'none';
    }

    // Reveal Singularity section when relevant
    const shouldShow = G.collapses > 0 || G.remnants > 0 || G.runDust >= CFG.COLLAPSE_UNIT * 0.5;
    if (shouldShow && !remnantSectionShown) {
        remnantSectionShown = true;
        buildPanels();
    }

    updateCards();

    document.getElementById('stats-list').innerHTML = [
        ['Total Stardust',   '✦' + fmtNum(G.totalDust)],
        ['This Run',         '✦' + fmtNum(G.runDust)],
        ['Remnants',         '✸' + fmtNum(G.remnants)],
        ['Collapses',        G.collapses],
        ['Planets',          G.planets.length],
        ['Orbits Completed', G.orbitsCompleted.toLocaleString()],
        ['Planet Taps',      G.taps.toLocaleString()],
        ['Comets Caught',    G.cometsCaught],
        ['Time Observed',    fmtTime(G.gameTime)],
    ].map(([l, v]) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`).join('');
}
