'use strict';

// ===== Singularity =====
// The orbiter-unlock spine that runs down the left of EVERY Mass tab. Each level grows the Maw,
// captures one more orbiter, and unlocks that tier's upgrades across all four categories.
// Nothing in any tab is buyable until the matching tier's orbiter has been captured.
const SINGULARITY = {
  name: 'Singularity',
  tiers: 8,
  // tier N (1-based) captures this orbiter and unlocks tier-N upgrades in every tab
  orbiters: ['Dwarf Planet', 'Comet Cluster', 'Ringed Body', 'Gas Giant', 'Pulsar', 'Companion Star', 'Quasar', 'Rogue Star'],
  costs:    [1, 5, 12, 22, 38, 60, 90, 130],
  flavor:   'The Maw widens, and one more body falls into its keeping.',
};
function singularityLevel()       { return mlvl('singularity'); }
function singularityCost()         { const l = singularityLevel(); return l >= SINGULARITY.tiers ? null : SINGULARITY.costs[l]; }
function singularityOrbiter(tier)  { return SINGULARITY.orbiters[tier - 1] || 'the next body'; }

const MASS_UPGRADES = [
  // ===== Maw =====
  { id:'denserCore', cat:'Maw', tier:1, name:'Denser Core', max:5, costs:[1,2,3,4,5],
    flavor:'The core draws a deeper breath.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} pulse income` },
  { id:'firstLight', cat:'Maw', tier:2, name:'First Light', max:3, costs:[3,6,10],
    flavor:'A universe born already glowing.',
    eff:l => l ? `begin with ✦${fmtNum(FIRST_LIGHT[l])}` : 'begin with ✦10' },
  { id:'eventHorizon', cat:'Maw', tier:2, placeholder:true, name:'Event Horizon', max:5, costs:[3,5,8,12,17],
    flavor:'Nothing the core reaches escapes.',
    eff:l => `+${30*(l||1)}% pulse income` },
  { id:'mawT3', cat:'Maw', tier:3, placeholder:true, name:'Ergosphere', max:5, costs:[8,14,22,32,44],
    flavor:'Even spacetime is dragged along.',
    eff:l => `+${20*(l||1)}% pulse income` },
  { id:'mawT4', cat:'Maw', tier:4, placeholder:true, name:'Photon Sphere', max:3, costs:[14,24,40],
    flavor:'Light itself orbits, and cannot leave.',
    eff:l => `pulses echo ×${(l||1)}` },

  // ===== Orbiters =====
  { id:'heavierBodies', cat:'Orbiters', tier:1, name:'Heavier Bodies', max:2, costs:[1,5],
    flavor:'Give every orbit more to carry.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} orbiter payout` },
  { id:'retainedComp', cat:'Orbiters', tier:1, name:'Retained Companions', max:3, costs:[2,3,5],
    flavor:'Companions that survive the collapse.',
    eff:l => ['-','start with the Dust Particle','start with Dust + Asteroid','start with Dust + Asteroid + Moon'][l] },
  { id:'swifterOrbits', cat:'Orbiters', tier:2, placeholder:true, name:'Swifter Orbits', max:5, costs:[3,5,8,12,17],
    flavor:'Every body comes around sooner.',
    eff:l => `+${15*(l||1)}% orbiter speed` },
  { id:'orbitersT3', cat:'Orbiters', tier:3, placeholder:true, name:'Tidal Lock', max:3, costs:[8,14,22],
    flavor:'Held in a perfect grip.',
    eff:l => `+${10*(l||1)}% orbiter payout` },
  { id:'orbitersT4', cat:'Orbiters', tier:4, placeholder:true, name:'Resonant Chorus', max:5, costs:[14,24,40,60,86],
    flavor:'They sing in ratio.',
    eff:l => `orbits harmonize ×${(l||1)}` },

  // ===== Phenomena =====
  { id:'brighterTails', cat:'Phenomena', tier:1, name:'Brighter Tails', max:4, costs:[1,2,3,4],
    flavor:'Longer, brighter tails.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} comet windfall` },
  { id:'cometShower', cat:'Phenomena', tier:1, name:'Comet Shower', max:3, costs:[1,2,3],
    flavor:'The quiet sky grows busy.',
    eff:l => l ? `comets ${Math.round((1 - Math.pow(0.85,l))*100)}% sooner` : 'comets at base interval' },
  { id:'meteorShower', cat:'Phenomena', tier:2, placeholder:true, name:'Meteor Shower', max:4, costs:[3,5,8,12],
    flavor:'The sky breaks into falling light.',
    eff:l => `${l||1} meteor${(l||1)===1?'':'s'} per shower` },
  { id:'phenomenaT3', cat:'Phenomena', tier:3, placeholder:true, name:'Aurora', max:5, costs:[8,14,22,32,44],
    flavor:'Curtains of slow colour.',
    eff:l => `events linger +${20*(l||1)}%` },
  { id:'phenomenaT4', cat:'Phenomena', tier:4, placeholder:true, name:'Solar Flare', max:3, costs:[14,24,40],
    flavor:'The dark briefly roars.',
    eff:l => `${l||1} flare${(l||1)===1?'':'s'} per cycle` },

  // ===== Eternity (the accretion cycle / time) =====
  { id:'greaterCollapse', cat:'Eternity', tier:1, name:'Greater Collapse', max:3, costs:[2,3,4],
    flavor:'Collapse harder; gather more.',
    eff:l => `×${(1 + l/3).toFixed(2)} Mass per accretion` },
  { id:'lunarFavor', cat:'Eternity', tier:1, name:'Lunar Favor', max:3, costs:[1,2,3],
    flavor:'The tides run in your favor.',
    eff:l => `+${10*l}% average moon payout` },
  { id:'timeDilation', cat:'Eternity', tier:2, placeholder:true, name:'Time Dilation', max:5, costs:[4,7,11,16,22],
    flavor:'The whole universe runs faster.',
    eff:l => `+${10*(l||1)}% game speed` },
  { id:'cyclesT3', cat:'Eternity', tier:3, placeholder:true, name:'Eternal Return', max:3, costs:[10,18,28],
    flavor:'Something always carries over.',
    eff:l => `keep ${l||1} upgrade${(l||1)===1?'':'s'} on reset` },
  { id:'cyclesT4', cat:'Eternity', tier:4, placeholder:true, name:'Long Now', max:4, costs:[14,24,40,60],
    flavor:'Time pools instead of passing.',
    eff:l => `+${10*(l||1)}% slower, richer pulses` },
];

const MASS_BY_ID  = Object.fromEntries(MASS_UPGRADES.map(u => [u.id, u]));
const FIRST_LIGHT = [10, 1000, 5000, 20000];

function mlvl(id)        { return (G.massUpgrades && G.massUpgrades[id]) || 0; }
function massUpgCost(u)  { const l = mlvl(u.id); return l >= u.max ? null : u.costs[l]; }

function massCatTiers(cat)     { return [...new Set(MASS_UPGRADES.filter(u => u.cat === cat).map(u => u.tier))].sort((a,b) => a-b); }
function massTierNodes(cat, t) { return MASS_UPGRADES.filter(u => u.cat === cat && u.tier === t); }

// A tier's upgrades unlock once the Singularity has captured that tier's orbiter.
function tierUnlocked(t) { return singularityLevel() >= t; }
function massNodeVis(u)  { return tierUnlocked(u.tier) ? 'available' : 'locked'; }

function denserCoreMult()      { return 1 + 0.5 * mlvl('denserCore'); }
function firstLightDust()      { return FIRST_LIGHT[mlvl('firstLight')]; }
function heavierBodiesMult()   { return 1 + 0.5 * mlvl('heavierBodies'); }
function brighterTailsMult()   { return 1 + 0.5 * mlvl('brighterTails'); }
function cometShowerMult()     { return Math.pow(0.85, mlvl('cometShower')); }
function greaterCollapseMult() { return 1 + mlvl('greaterCollapse') / 3; }
function lunarFavorMult()      { return 1 + 0.1 * mlvl('lunarFavor'); }

function applyMassUniverseStart() {
    G.dust = firstLightDust();
    const rc = mlvl('retainedComp');
    G.upgrades.dust     = rc >= 1 ? 1 : 0;
    G.upgrades.asteroid = rc >= 2 ? 1 : 0;
    G.upgrades.moon     = rc >= 3 ? 1 : 0;
    if (rc >= 3) G.moonEverOwned = true;
    if (typeof ORBITERS !== 'undefined') {
        for (const o of ORBITERS) {
            const arr = o.list(); arr.length = 0;
            const n = o.count();
            for (let i = 0; i < n; i++) arr.push(o.make());
        }
    }
}

const accBuyLog = [];
function resetMassBuyLog() { accBuyLog.length = 0; }
function canUndoMass()     { return accBuyLog.length > 0; }

// Buy the next Singularity level (the spine gate). Captures the next orbiter + unlocks its tier.
function buySingularity() {
    if (accBrowse) return false;
    const l = singularityLevel();
    if (l >= SINGULARITY.tiers) return false;
    const cost = SINGULARITY.costs[l];
    if (G.mass < cost) return false;
    G.mass -= cost;
    G.massUpgrades.singularity = l + 1;
    accBuyLog.push({ id:'singularity', cost });
    applyMassUniverseStart();
    if (typeof buildPanels === 'function') buildPanels();
    if (typeof SoundSystem !== 'undefined') SoundSystem.sfxComplete();
    saveGame();
    return true;
}

function buyMassUpgrade(id) {
    const u = MASS_BY_ID[id]; if (!u) return false;
    if (u.placeholder) return false;                 // planned nodes aren't wired yet
    if (massNodeVis(u) !== 'available') return false; // tier's orbiter not captured
    const l = mlvl(id); if (l >= u.max) return false;
    const cost = u.costs[l]; if (G.mass < cost) return false;
    G.mass -= cost;
    G.massUpgrades[id] = l + 1;
    accBuyLog.push({ id, cost });
    applyMassUniverseStart();
    if (typeof buildPanels === 'function') buildPanels();
    if (typeof SoundSystem !== 'undefined') {
        (l + 1 >= u.max) ? SoundSystem.sfxComplete() : SoundSystem.sfxBuy();
    }
    saveGame();
    return true;
}

function undoLastMassUpgrade() {
    const last = accBuyLog.pop();
    if (!last) return false;
    G.massUpgrades[last.id] = Math.max(0, mlvl(last.id) - 1);
    G.mass += last.cost;
    applyMassUniverseStart();
    if (typeof buildPanels === 'function') buildPanels();
    if (typeof SoundSystem !== 'undefined') SoundSystem.sfxBuy();
    saveGame();
    return true;
}
