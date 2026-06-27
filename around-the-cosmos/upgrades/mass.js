'use strict';

const MASS_UPGRADES = [
  { id:'denserCore', cat:'Lacuna', tier:0, name:'Denser Core', max:5, costs:[1,2,3,4,5],
    flavor:'The core draws a deeper breath.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} pulse income` },
  { id:'firstLight', cat:'Lacuna', tier:1, name:'First Light', max:3, costs:[3,6,10],
    flavor:'A universe born already glowing.',
    eff:l => l ? `begin with ✦${fmtNum(FIRST_LIGHT[l])}` : 'begin with ✦10' },
  { id:'eventHorizon', cat:'Lacuna', tier:1, placeholder:true, name:'Event Horizon', max:5, costs:[3,5,8,12,17],
    flavor:'Nothing the core reaches escapes.',
    eff:l => `+${30*l}% pulse income` },
  { id:'lacunaT2', cat:'Lacuna', tier:2, placeholder:true, name:'Naked Singularity', max:5, costs:[8,14,22,32,44],
    flavor:'', eff:() => '' },

  { id:'heavierBodies', cat:'Orbiters', tier:0, name:'Heavier Bodies', max:5, costs:[1,2,3,4,5],
    flavor:'Give every orbit more to carry.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} orbiter payout` },
  { id:'retainedComp', cat:'Orbiters', tier:0, name:'Retained Companions', max:3, costs:[2,3,5],
    flavor:'Companions that survive the collapse.',
    eff:l => ['-','start with the Dust Particle','start with Dust + Asteroid','start with Dust + Asteroid + Moon'][l] },
  { id:'swifterOrbits', cat:'Orbiters', tier:1, placeholder:true, name:'Swifter Orbits', max:5, costs:[3,5,8,12,17],
    flavor:'Every body comes around sooner.',
    eff:l => `+${15*l}% orbiter speed` },
  { id:'orbitersT2', cat:'Orbiters', tier:2, placeholder:true, name:'Tidal Lock', max:3, costs:[8,14,22],
    flavor:'', eff:() => '' },

  { id:'brighterTails', cat:'Phenomena', tier:0, name:'Brighter Tails', max:4, costs:[1,2,3,4],
    flavor:'Longer, brighter tails.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} comet windfall` },
  { id:'cometShower', cat:'Phenomena', tier:0, name:'Comet Shower', max:3, costs:[1,2,3],
    flavor:'The quiet sky grows busy.',
    eff:l => l ? `comets ${Math.round((1 - Math.pow(0.85,l))*100)}% sooner` : 'comets at base interval' },
  { id:'meteorShower', cat:'Phenomena', tier:1, placeholder:true, name:'Meteor Shower', max:4, costs:[3,5,8,12],
    flavor:'The sky breaks into falling light.',
    eff:l => `${l} meteor${l===1?'':'s'} per shower` },
  { id:'phenomenaT2', cat:'Phenomena', tier:2, placeholder:true, name:'Aurora', max:5, costs:[8,14,22,32,44],
    flavor:'', eff:() => '' },

  { id:'greaterCollapse', cat:'Cycles', tier:0, name:'Greater Collapse', max:3, costs:[2,3,4],
    flavor:'Collapse harder; gather more.',
    eff:l => `×${(1 + l/3).toFixed(2)} Mass per accretion` },
  { id:'lunarFavor', cat:'Cycles', tier:0, name:'Lunar Favor', max:3, costs:[1,2,3],
    flavor:'The tides run in your favor.',
    eff:l => `+${10*l}% average moon payout` },
  { id:'timeDilation', cat:'Cycles', tier:1, placeholder:true, name:'Time Dilation', max:5, costs:[4,7,11,16,22],
    flavor:'The whole universe runs faster.',
    eff:l => `+${10*l}% game speed` },
  { id:'cyclesT2', cat:'Cycles', tier:2, placeholder:true, name:'Eternal Return', max:3, costs:[10,18,28],
    flavor:'', eff:() => '' },
];

const MASS_BY_ID  = Object.fromEntries(MASS_UPGRADES.map(u => [u.id, u]));
const FIRST_LIGHT = [10, 1000, 5000, 20000];

function mlvl(id)        { return (G.massUpgrades && G.massUpgrades[id]) || 0; }
function massUpgCost(u)  { const l = mlvl(u.id); return l >= u.max ? null : u.costs[l]; }

function massCatTiers(cat)       { return [...new Set(MASS_UPGRADES.filter(u => u.cat === cat).map(u => u.tier))].sort((a,b) => a-b); }
function massTierNodes(cat, t)   { return MASS_UPGRADES.filter(u => u.cat === cat && u.tier === t); }
function massTierMaxed(cat, t)   { const ns = massTierNodes(cat, t); return ns.length > 0 && ns.every(u => mlvl(u.id) >= u.max); }
function massCurrentTier(cat) {
    const tiers = massCatTiers(cat);
    for (const t of tiers) if (!massTierMaxed(cat, t)) return t;
    return tiers[tiers.length - 1] + 1;
}
function massNodeVis(u) {
    const cur = massCurrentTier(u.cat);
    if (u.tier <= cur)     return 'available';
    if (u.tier === cur + 1) return 'next';
    return 'locked';
}

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

function buyMassUpgrade(id) {
    const u = MASS_BY_ID[id]; if (!u) return false;
    if (massNodeVis(u) !== 'available') return false;
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
