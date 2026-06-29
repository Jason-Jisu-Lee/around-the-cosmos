'use strict';

// ===== Singularity =====
// The orbiter-unlock spine that runs down the left of EVERY Mass tab. Each level grows the Maw,
// captures one more orbiter, and unlocks that tier's upgrades across all four categories.
// Nothing in any tab is buyable until the matching tier's orbiter has been captured.
const SINGULARITY = {
  name: 'Singularity',
  tiers: 8,
  // tier N (1-based) captures this orbiter and unlocks tier-N upgrades in every tab.
  // demoMax: the demo caps capturable progression here - tier 2 ("Finish Demo") is the published end.
  // The deeper gates (3+) + all placeholder upgrades stay VISIBLE (as sealed "coming soon"), just not buyable.
  demoMax: 2,
  orbiters: ['Dwarf Planet', 'Finish Demo', 'Ringed Body', 'Gas Giant', 'Pulsar', 'Companion Star', 'Quasar', 'Rogue Star'],
  costs:    [1, 3, 20, 32, 48, 70, 100, 140],   // tier 2 'Finish Demo' = 3 Mass (clicking it opens the end-of-demo modal, not a normal buy)
  flavor:   'The Maw widens, and one more body falls into its keeping.',
};
function singularityLevel()       { return mlvl('singularity'); }
function singularityCost()         { const l = singularityLevel(); return l >= SINGULARITY.demoMax ? null : SINGULARITY.costs[l]; }
function singularityOrbiter(tier)  { return SINGULARITY.orbiters[tier - 1] || 'the next body'; }

const MASS_UPGRADES = [
  // ===== Maw =====
  { id:'denserCore', cat:'Maw', tier:1, name:'Denser Core', max:5, costs:[1,3,7,13,22],
    flavor:'The core draws a deeper breath.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} pulse income` },
  { id:'heavierPulse', cat:'Maw', tier:1, name:'Heavier Pulse', max:5, costs:[2,5,10,18,30],
    flavor:'Each beat carries more weight.',
    eff:l => `+${10*l} ✦ per pulse` },
  { id:'firstLight', cat:'Maw', tier:2, name:'First Light', max:3, costs:[4,10,20],
    flavor:'A universe born already glowing.',
    eff:l => l ? `begin with ✦${fmtNum(FIRST_LIGHT[l])}` : 'begin with ✦10' },
  { id:'eventHorizon', cat:'Maw', tier:2, placeholder:true, name:'Event Horizon', max:5, costs:[6,11,18,27,38],
    flavor:'Nothing the core reaches escapes.',
    eff:l => `+${30*(l||1)}% pulse income` },
  { id:'mawT3', cat:'Maw', tier:3, placeholder:true, name:'Ergosphere', max:5, costs:[12,20,30,42,56],
    flavor:'Even spacetime is dragged along.',
    eff:l => `+${20*(l||1)}% pulse income` },
  { id:'mawT3b', cat:'Maw', tier:3, placeholder:true, name:'Accretion Disk', max:3, costs:[14,24,38],
    flavor:'A bright ring of infalling matter.',
    eff:l => `+${25*(l||1)}% pulse income` },
  { id:'mawT4', cat:'Maw', tier:4, placeholder:true, name:'Photon Sphere', max:3, costs:[24,40,60],
    flavor:'Light itself orbits, and cannot leave.',
    eff:l => `pulses echo ×${(l||1)+1}` },
  { id:'mawT4b', cat:'Maw', tier:4, placeholder:true, name:'Gravity Lens', max:4, costs:[28,46,68,95],
    flavor:'Light bends around the deep.',
    eff:l => `+${40*(l||1)}% pulse income` },
  { id:'mawT5', cat:'Maw', tier:5, placeholder:true, name:'Hawking Glow', max:5, costs:[45,70,100,135,175],
    flavor:'The dark faintly radiates.',
    eff:l => `+${15*(l||1)}% all income` },
  { id:'mawT5b', cat:'Maw', tier:5, placeholder:true, name:'Spaghettification', max:3, costs:[50,80,120],
    flavor:'Stretched thin across the threshold.',
    eff:l => `deep pulses ×${(l||1)+1}` },

  // ===== Orbiters =====
  { id:'heavierBodies', cat:'Orbiters', tier:1, name:'Heavier Bodies', max:2, costs:[1,6],
    flavor:'Give every orbit more to carry.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} orbiter payout` },
  { id:'denseDust', cat:'Orbiters', tier:1, name:'Dense Dust', max:3, costs:[2,6,13],
    flavor:'Each grain packs more in.',
    eff:l => `+${20*l} base payout per dust particle` },
  { id:'lunarFavor', cat:'Orbiters', tier:1, name:'Lunar Favor', max:3, costs:[1,4,9],
    flavor:'The tides run in your favor.',
    eff:l => `+${10*l}% average moon payout` },
  { id:'swifterOrbits', cat:'Orbiters', tier:2, placeholder:true, name:'Swifter Orbits', max:5, costs:[6,11,18,27,38],
    flavor:'Every body comes around sooner.',
    eff:l => `+${15*(l||1)}% orbiter speed` },
  { id:'orbitersT3', cat:'Orbiters', tier:3, placeholder:true, name:'Tidal Lock', max:3, costs:[12,20,30],
    flavor:'Held in a perfect grip.',
    eff:l => `+${10*(l||1)}% orbiter payout` },
  { id:'orbitersT3b', cat:'Orbiters', tier:3, placeholder:true, name:'Shepherd Moons', max:4, costs:[14,24,36,52],
    flavor:'Small wardens herd the belts.',
    eff:l => `+${12*(l||1)}% orbiter payout` },
  { id:'orbitersT4', cat:'Orbiters', tier:4, placeholder:true, name:'Resonant Chorus', max:5, costs:[24,40,60,86,118],
    flavor:'They sing in ratio.',
    eff:l => `orbits harmonize ×${(l||1)+1}` },
  { id:'orbitersT4b', cat:'Orbiters', tier:4, placeholder:true, name:'Orbital Cascade', max:3, costs:[28,46,70],
    flavor:'One pass sets off the next.',
    eff:l => `+${30*(l||1)}% orbiter payout` },
  { id:'orbitersT5', cat:'Orbiters', tier:5, placeholder:true, name:'Captured Belt', max:5, costs:[45,70,100,135,175],
    flavor:'A whole belt falls into step.',
    eff:l => `+${l||1} dust particle${(l||1)===1?'':'s'}` },
  { id:'orbitersT5b', cat:'Orbiters', tier:5, placeholder:true, name:'Binary Dance', max:3, costs:[50,80,120],
    flavor:'Two bodies, one shared waltz.',
    eff:l => `paired orbiters ×${(l||1)+1}` },

  // ===== Phenomena =====
  { id:'brighterTails', cat:'Phenomena', tier:1, name:'Brighter Tails', max:4, costs:[1,3,7,13],
    flavor:'Longer, brighter tails.',
    eff:l => `×${(1 + 0.5*l).toFixed(1)} comet payout` },
  { id:'cometShower', cat:'Phenomena', tier:1, name:'Comet Shower', max:3, costs:[1,4,9],
    flavor:'The quiet sky grows busy.',
    eff:l => l ? `comets ${Math.round((1 - Math.pow(0.85,l))*100)}% sooner` : 'comets at base interval' },
  { id:'meteorShower', cat:'Phenomena', tier:2, placeholder:true, name:'Meteor Shower', max:4, costs:[6,11,18,27],
    flavor:'The sky breaks into falling light.',
    eff:l => `${l||1} meteor${(l||1)===1?'':'s'} per shower` },
  { id:'phenomenaT3', cat:'Phenomena', tier:3, placeholder:true, name:'Aurora', max:5, costs:[12,20,30,42,56],
    flavor:'Curtains of slow colour.',
    eff:l => `events linger +${20*(l||1)}%` },
  { id:'phenomenaT3b', cat:'Phenomena', tier:3, placeholder:true, name:'Nebula Bloom', max:3, costs:[14,24,38],
    flavor:'Slow clouds catch the light.',
    eff:l => `+${20*(l||1)}% comet payout` },
  { id:'phenomenaT4', cat:'Phenomena', tier:4, placeholder:true, name:'Solar Flare', max:3, costs:[24,40,60],
    flavor:'The dark briefly roars.',
    eff:l => `${l||1} flare${(l||1)===1?'':'s'} per cycle` },
  { id:'phenomenaT4b', cat:'Phenomena', tier:4, placeholder:true, name:'Magnetar Pulse', max:4, costs:[28,46,68,95],
    flavor:'A sudden magnetic shout.',
    eff:l => `+${25*(l||1)}% event payout` },
  { id:'phenomenaT5', cat:'Phenomena', tier:5, placeholder:true, name:'Supernova Echo', max:3, costs:[45,75,115],
    flavor:'The afterimage of a death.',
    eff:l => `event payout ×${(l||1)+1}` },
  { id:'phenomenaT5b', cat:'Phenomena', tier:5, placeholder:true, name:'Cosmic Ray', max:5, costs:[50,78,112,152,200],
    flavor:'A thread of far-flung energy.',
    eff:l => `+${10*(l||1)}% event payout` },

  // ===== Eternity (the accretion cycle / time) =====
  { id:'greaterCollapse', cat:'Eternity', tier:1, name:'Greater Collapse', max:5, costs:[3,7,14,24,38],
    flavor:'Collapse harder; gather more.',
    eff:l => `×${(1 + 0.1*l).toFixed(1)} Mass per accretion` },
  { id:'timeDilation', cat:'Eternity', tier:2, placeholder:true, name:'Time Dilation', max:5, costs:[6,11,18,27,38],
    flavor:'The whole universe runs faster.',
    eff:l => `+${10*(l||1)}% game speed` },
  { id:'cyclesT3', cat:'Eternity', tier:3, placeholder:true, name:'Eternal Return', max:3, costs:[12,20,30],
    flavor:'Something always carries over.',
    eff:l => `keep ${l||1} upgrade${(l||1)===1?'':'s'} on reset` },
  { id:'cyclesT3b', cat:'Eternity', tier:3, placeholder:true, name:'Memory of Light', max:4, costs:[14,24,36,52],
    flavor:'Some glow survives the dark.',
    eff:l => `keep +${5*(l||1)}% income on reset` },
  { id:'cyclesT4', cat:'Eternity', tier:4, placeholder:true, name:'Long Now', max:4, costs:[24,40,60,86],
    flavor:'Time pools instead of passing.',
    eff:l => `+${10*(l||1)}% slower, richer pulses` },
  { id:'cyclesT4b', cat:'Eternity', tier:4, placeholder:true, name:'Frozen Moment', max:3, costs:[28,46,70],
    flavor:'A held breath between universes.',
    eff:l => `+${15*(l||1)}% offline gain` },
  { id:'cyclesT5', cat:'Eternity', tier:5, placeholder:true, name:'Deep Time', max:5, costs:[45,70,100,135,175],
    flavor:'The long slow turning of things.',
    eff:l => `+${8*(l||1)}% Mass per accretion` },
  { id:'cyclesT5b', cat:'Eternity', tier:5, placeholder:true, name:'Eternal Recurrence', max:3, costs:[50,80,120],
    flavor:'It has all happened before.',
    eff:l => `cycle bonus ×${(l||1)+1}` },
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
function heavierPulseBonus()   { return 10 * mlvl('heavierPulse'); }     // +10 ✦ per pulse per level (added to the pulse base)
function firstLightDust()      { return FIRST_LIGHT[mlvl('firstLight')]; }
function heavierBodiesMult()   { return 1 + 0.5 * mlvl('heavierBodies'); }
function denseDustBonus()      { return 20 * mlvl('denseDust'); }        // +20 base payout per dust particle per level
function brighterTailsMult()   { return 1 + 0.5 * mlvl('brighterTails'); }
function cometShowerMult()     { return Math.pow(0.85, mlvl('cometShower')); }
function greaterCollapseMult() { return 1 + 0.1 * mlvl('greaterCollapse'); }
function lunarFavorMult()      { return 1 + 0.1 * mlvl('lunarFavor'); }

function applyMassUniverseStart() {
    G.dust = firstLightDust();
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
    if (l >= SINGULARITY.demoMax) return false;   // demo ends at tier 2 ("Finish Demo"); deeper gates aren't capturable yet
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
