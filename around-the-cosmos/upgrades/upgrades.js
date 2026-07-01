"use strict";

const UPGRADES = [
  {
    id: "touch",
    name: "Cosmic Pulse",
    maxLevel: 8,
    section: "MAIN",
    costs: [10, 50, 120, 250, 580, 1000, 1850, 3000],
    flavor: "Maw stirs, drawing a slow, steady breath of light.",
    desc: () => "+5 ✦ generated every second, per level.",
    unlock: () => true,
  },
  {
    id: "surge",
    name: "Pulse Surge",
    maxLevel: 5,
    section: "MAIN",
    costs: [1200, 2200, 3600, 6300, 10000],
    flavor: "Each breath reaches deeper, and takes more.",
    desc: () => "+10 ✦ generated every second, per level.",
    unlock: () => lvl("touch") >= 6,
  },
  {
    id: "afterglow",
    name: "Afterglow",
    maxLevel: 5,
    section: "MAIN",
    costs: [2500, 4500, 8000, 13000, 22000],
    flavor: "Catch the light, and Maw keeps its warmth a while.",
    desc: (l) =>
      `For <b>60s</b> after catching a comet, every pulse gains <b>+${20 * l || 20}</b> ✦ (+20 / level). Catching another comet refreshes the timer.`,
    unlock: () => lvl("touch") >= 6,
  },
  {
    id: "deepbreath",
    name: "Deep Breath",
    maxLevel: 8,
    section: "MAIN",
    costs: [2500, 6000, 13000, 27000, 55000, 110000, 220000, 430000],
    flavor: "Now and then Maw draws a deeper breath, and takes twice as much.",
    desc: (l) => {
      const cur = l >= 1 ? 13 - l : 12;
      let s = `Every <b>${cur}th</b> breath becomes a <b>Deep Breath</b> worth <b>×${deepBreathMult().toFixed(1)}</b> a normal pulse.`;
      if (l >= 1 && l < 8)
        s += `<br><b>Next level:</b> every ${12 - l}th breath.`;
      else if (l === 0)
        s += `<br>Each level triggers it one breath sooner, down to every 5th.`;
      return s;
    },
    unlock: () => G.runDust >= 10000,
  },
  {
    id: "abyssal",
    name: "Abyssal Breath",
    maxLevel: 15,
    section: "MAIN",
    costs: [
      3000, 5000, 8000, 13000, 20000, 31000, 49000, 77000, 120000, 185000,
      290000, 450000, 700000, 1100000, 1700000,
    ],
    flavor: "Each deep breath reaches further down, into the dark Maw keeps.",
    desc: (l) => {
      const mult = 2 + 0.2 * l;
      let s = `Empowers <b>Deep Breath</b>: +0.2× per level. Deep Breaths currently pay <b>×${mult.toFixed(1)}</b> a normal pulse.`;
      if (l < 15) s += `<br><b>Next level:</b> ×${(mult + 0.2).toFixed(1)}.`;
      return s;
    },
    unlock: () => G.runDust >= 10000,
  },
  {
    id: "gravpull",
    name: "Gravitational Pull",
    maxLevel: 5,
    section: "MAIN",
    costs: [12000, 35000, 120000, 475000, 1850000],
    flavor: "Let your own gathered weight do some of the pulling.",
    desc: (l) => {
      const sum = orbiterPayoutSum();
      let s =
        `+1% of all orbiter payout added to every pulse, per level.` +
        `<br><b>Current bonus:</b> +✦${fmtNum(Math.round(0.01 * l * sum))} per pulse`;
      if (l < 5)
        s += `<br><b>Next level:</b> +✦${fmtNum(Math.round(0.01 * (l + 1) * sum))} per pulse`;
      return s;
    },
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "resonance",
    name: "Resonance",
    maxLevel: 5,
    section: "MAIN",
    costs: [14000, 27000, 57000, 150000, 365000],
    flavor: "Tune the whole quiet system until it hums.",
    desc: () =>
      "+10% to every orbiter’s payout, per level. Also lights Maw’s glow.",
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "dust",
    name: "Dust Particle",
    maxLevel: 1,
    section: "DUST PARTICLES",
    costs: [100],
    flavor: "The first grain of dust to settle into Maw’s quiet orbit.",
    desc: () =>
      "Adds your first dust particle on the inner orbit. +10 base payout per orbit.",
    unlock: () => lvl("touch") >= 2,
  },
  {
    id: "dustcount",
    name: "Dust Particle Count",
    maxLevel: 4,
    section: "DUST PARTICLES",
    costs: [600, 1500, 4000, 9200],
    desc: () =>
      "+1 dust particle in the clump, up to 5 (+10 base payout each).",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "dustpay",
    name: "Dust Particle Payout",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [200, 800, 2500, 5600, 14500],
    desc: () => "+10 to every dust particle’s payout, per level.",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "dustspd",
    name: "Dust Particle Speed",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [250, 1000, 3000, 7500, 16000],
    mult: (lvl) => 1 + 0.2 * lvl,
    desc: () => "+20% dust orbit speed, per level.",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "coagulation",
    name: "Coagulation",
    maxLevel: 5,
    section: "DUST PARTICLES",
    identity: true,
    group: "dust",
    costs: [10000, 23000, 48000, 90000, 170000],
    flavor: "Grains collide and stick - the first step toward worlds.",
    desc: (l) =>
      `+${15 * (l || 1)} ✦ to each dust particle, and +${50 * (l || 1)} to the Asteroid's base payout.`,
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "iceMantles",
    name: "Ice Mantles",
    maxLevel: 5,
    section: "DUST PARTICLES",
    identity: true,
    group: "dust",
    costs: [10000, 23000, 48000, 90000, 170000],
    flavor: "Past the frost line, the grains gather ice.",
    desc: (l) =>
      `+${5 * (l || 1)} ✦ to each dust particle, and +${150 * (l || 1)} to the Moon's base payout. The grains gain a frost rim.`,
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "denser",
    name: "Denser Grains",
    maxLevel: 5,
    section: "DUST PARTICLES",
    identity: true,
    group: "dust",
    costs: [10000, 23000, 48000, 90000, 170000],
    flavor: "Heavier, darker grains that carry more each pass.",
    desc: (l) => `Dust particle payout x${(1 + 0.15 * (l || 1)).toFixed(2)}.`,
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "dustdevil",
    name: "Dust Devil",
    maxLevel: 3,
    section: "DUST PARTICLES",
    identity: true,
    group: "dust",
    costs: [15000, 40000, 100000],
    flavor: "The swarm winds into a tightening whirl.",
    desc: (l) => `Dust payout spins up over ~10 minutes in a universe to +${8 * (l || 1)}%, then holds. Resets on Accretion.`,
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "prdrag",
    name: "Poynting-Robertson Drag",
    maxLevel: 3,
    section: "DUST PARTICLES",
    identity: true,
    group: "dust",
    costs: [15000, 40000, 100000],
    flavor: "Starlight drags the grains inward, one by one, into Maw.",
    desc: (l) => `Every ~${9 - (l || 1) * 2}s a grain spirals into Maw for a x${4 + 2 * (l || 1)} payout lump; the swarm sheds it, then regrows it.`,
    unlock: () => G.runDust >= 50000,
  },
  {
    id: "asteroid",
    name: "Asteroid",
    maxLevel: 1,
    section: "ASTEROID",
    costs: [2000],
    flavor: "A wandering chunk of old rock, heavy and slow.",
    desc: () =>
      "Adds the asteroid on a wider, slower orbit. +50 base payout per orbit.",
    unlock: () => G.runDust >= 5000,
  },
  {
    id: "astpay",
    name: "Asteroid Payout",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [2500, 4500, 10500, 24000, 58000],
    desc: () => "+50 to the asteroid’s payout, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astspd",
    name: "Asteroid Speed",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [3000, 6000, 13000, 28000, 62000],
    mult: (lvl) => 1 + 0.2 * lvl,
    desc: () => "+20% asteroid orbit speed, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astcomp",
    name: "Asteroid Composition",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [3500, 11000, 26000, 60000, 135000],
    flavor: "Reforge the rock into denser, richer stuff.",
    desc: (l) => {
      const top = ASTEROID_COMP.mult.length - 1;
      return l >= top
        ? `Composition: ${ASTEROID_COMP.names[top]}. Asteroid payout x${ASTEROID_COMP.mult[top]}.`
        : `Reforge ${ASTEROID_COMP.names[l]} to ${ASTEROID_COMP.names[l + 1]}. Asteroid payout x${ASTEROID_COMP.mult[l + 1]}.`;
    },
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "rubblepile",
    name: "Rubble Pile",
    maxLevel: 5,
    section: "ASTEROID",
    identity: true,
    group: "asteroid",
    costs: [12000, 26000, 52000, 95000, 170000],
    flavor: "A loose heap of gravel, bound only by its own faint gravity.",
    desc: (l) =>
      `+${40 * (l || 1)} ✦ to the Asteroid for each dust particle you own.`,
    unlock: () => lvl("asteroid") >= 1 && G.runDust >= 100000,
  },
  {
    id: "ferropulse",
    name: "Ferromagnetic Pulse",
    maxLevel: 5,
    section: "ASTEROID",
    identity: true,
    group: "asteroid",
    costs: [12000, 26000, 52000, 95000, 170000],
    flavor: "Veins of iron ring with Maw's every beat.",
    desc: (l) =>
      `+${15 * (l || 1)} ✦ to every Maw pulse, added after Gravitational Pull.`,
    unlock: () => lvl("asteroid") >= 1 && G.runDust >= 100000,
  },
  {
    id: "meteorshower",
    name: "Meteor Shower",
    maxLevel: 3,
    section: "ASTEROID",
    identity: true,
    group: "asteroid",
    costs: [20000, 50000, 120000],
    flavor: "The rock keeps shedding debris that rains inward.",
    desc: (l) =>
      `Comets arrive ${Math.round((1 - Math.pow(0.85, l || 1)) * 100)}% sooner. No orbit payout of its own.`,
    unlock: () => lvl("asteroid") >= 1 && G.runDust >= 100000,
  },
  {
    id: "prospector",
    name: "Prospector's Cut",
    maxLevel: 5,
    section: "ASTEROID",
    identity: true,
    group: "asteroid",
    costs: [12000, 26000, 52000, 95000, 170000],
    flavor: "Skip the smelter. Sell the raw shine to passing comets.",
    desc: (l) =>
      `The Asteroid gives up its Composition bonus; comet windfall x${(1 + 0.15 * (l || 1)).toFixed(2)}.`,
    unlock: () => lvl("asteroid") >= 1 && G.runDust >= 100000,
  },
  {
    id: "slingshot",
    name: "Gravitational Slingshot",
    maxLevel: 3,
    section: "ASTEROID",
    identity: true,
    group: "asteroid",
    costs: [20000, 50000, 120000],
    flavor: "Wind up on the deep gravity, then let go.",
    desc: (l) =>
      `Winds up over 6 orbits, then slingshots for a x${2 + (l || 1)} payout burst.`,
    unlock: () => lvl("asteroid") >= 1 && G.runDust >= 100000,
  },
  {
    id: "moon",
    name: "Moon",
    maxLevel: 1,
    section: "MOON",
    costs: [10000],
    flavor: "A pale companion, heavy enough to hold its own slow circle.",
    desc: () =>
      "Adds the moon on the widest, slowest orbit. Pays 200 per orbit at base, scaled by its lunar phase (x0.75 at the new moon up to x1.25 at the full). Whatever the payout reads when it completes an orbit is what it pays.",
    unlock: () => G.runDust >= 32000,
  },
  {
    id: "moonpay",
    name: "Moon Payout",
    maxLevel: 5,
    section: "MOON",
    costs: [15000, 50000, 150000, 330000, 600000],
    desc: () => "+200 to the moon’s base payout, per level.",
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "moonspd",
    name: "Moon Speed",
    maxLevel: 5,
    section: "MOON",
    costs: [20000, 80000, 200000, 385000, 700000],
    mult: (lvl) => 1 + 0.2 * lvl,
    desc: () => "+20% moon orbit speed, per level.",
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "moonphase",
    name: "Lunar Phases",
    maxLevel: 5,
    section: "MOON",
    costs: [12000, 28000, 55000, 90000, 175000],
    flavor: "Learn the tides the moon answers to, and widen them.",
    desc: (l) =>
      `Moon payout swings x${(0.75 + 0.1 * l).toFixed(2)} at the new moon to x${(1.25 + 0.1 * l).toFixed(2)} at the full moon. Each level adds +0.10 to both ends.`,
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "albedo",
    name: "Albedo",
    maxLevel: 5,
    section: "MOON",
    identity: true,
    group: "moon",
    costs: [15000, 32000, 64000, 120000, 220000],
    flavor: "A brighter face throws back more of the light.",
    desc: (l) => `Moon payout x${(1 + 0.10 * (l || 1)).toFixed(2)}.`,
    unlock: () => lvl("moon") >= 1 && G.runDust >= 150000,
  },
  {
    id: "springtide",
    name: "Spring Tide",
    maxLevel: 5,
    section: "MOON",
    identity: true,
    group: "moon",
    costs: [15000, 32000, 64000, 120000, 220000],
    flavor: "When the moon runs full, its tides pull with Maw.",
    desc: (l) => `Up to +${20 * (l || 1)} ✦ to every Maw pulse, strongest at the full moon and fading to nothing at the new.`,
    unlock: () => lvl("moon") >= 1 && G.runDust >= 150000,
  },
  {
    id: "eclipse",
    name: "Solar Eclipse",
    maxLevel: 3,
    section: "MOON",
    identity: true,
    group: "moon",
    costs: [30000, 70000, 150000],
    flavor: "Now and then the moon slides across Maw and swallows the light.",
    desc: (l) => `Every ${6 - (l || 1)} orbits the moon eclipses Maw for a x10 payout burst. Higher levels eclipse more often.`,
    unlock: () => lvl("moon") >= 1 && G.runDust >= 150000,
  },
  {
    id: "standstill",
    name: "Lunar Standstill",
    maxLevel: 1,
    section: "MOON",
    identity: true,
    group: "moon",
    costs: [30000],
    flavor: "Every long while the moon holds still at the far edge of its wander.",
    desc: () => {
      const left = (typeof standstillOrbitsLeft === "function") ? standstillOrbitsLeft() : 16;
      return `After 16 orbits the moon reaches a standstill and pays x40 payout, once. Orbits left until Burst: ${left}.`;
    },
    unlock: () => lvl("moon") >= 1 && G.runDust >= 150000,
  },
  {
    id: "bloodmoon",
    name: "Blood Moon",
    maxLevel: 5,
    section: "MOON",
    identity: true,
    group: "moon",
    costs: [15000, 32000, 64000, 120000, 220000],
    flavor: "Deepen the gamble: nothing at the new, everything at the full.",
    desc: (l) => `Widens the phase swing: pays near 0 at the new moon and up to x${(1.25 + 0.15 * (l || 1)).toFixed(2)} the base at the full. Average payout is unchanged.`,
    unlock: () => lvl("moon") >= 1 && G.runDust >= 150000,
  },
  {
    id: "dwarf",
    name: "Dwarf Planet",
    maxLevel: 1,
    section: "DWARF PLANET",
    costs: [50000],
    flavor: "A captured world settles into the widest, calmest orbit.",
    desc: () =>
      "Brings the Dwarf Planet into orbit on the widest ring. The slowest body, but each long pass pays +800 stardust, more than any other.",
    unlock: () =>
      typeof singularityLevel === "function" && singularityLevel() >= 1,
  },
  {
    id: "dwarfpay",
    name: "Dwarf Planet Payout",
    maxLevel: 5,
    section: "DWARF PLANET",
    costs: [50000, 130000, 320000, 700000, 1200000],
    desc: () => "+800 to the Dwarf Planet's payout, per level.",
    unlock: () => lvl("dwarf") >= 1,
  },
  {
    id: "dwarfcompound",
    name: "Compounding Orbit",
    maxLevel: 3,
    section: "DWARF PLANET",
    costs: [120000, 300000, 700000],
    flavor: "Each slow lap settles a little more stardust into its orbit.",
    desc: (l) =>
      `The Dwarf Planet's payout grows +0.3% every orbit, up to +${[0, 15, 30, 50][l || 1]}%. The ramp resets when the universe collapses.`,
    unlock: () => lvl("dwarf") >= 1,
  },
  {
    id: "dwarftrojan",
    name: "Trojan Companions",
    maxLevel: 2,
    section: "DWARF PLANET",
    costs: [250000, 700000],
    desc: () =>
      "Spawns a Trojan companion that pays 1/8 of the Dwarf Planet's income.",
    unlock: () => lvl("dwarf") >= 1,
  },
  {
    id: "glacial",
    name: "Glacial Orbit",
    maxLevel: 1,
    section: "DWARF PLANET",
    identity: true,
    group: "dwarf",
    costs: [80000],
    flavor: "Ember slows to a crawl, and each pass lands with far more weight.",
    desc: () => `Half orbit speed, but x2.05 payout. Per-orbit payout nearly doubles (feeding the pulse through Gravitational Pull) while income per minute barely changes.`,
    unlock: () => lvl("dwarf") >= 1 && G.runDust >= 200000,
  },
  {
    id: "distantkin",
    name: "Distant Kin",
    maxLevel: 3,
    section: "DWARF PLANET",
    identity: true,
    group: "dwarf",
    costs: [60000, 140000, 300000],
    flavor: "A cold kinship with the deep cosmos calls the Vortex in.",
    desc: (l) => `The Vortex arrives ${Math.round((1 - Math.pow(0.8, l || 1)) * 100)}% sooner and pays x${(1 + 0.25 * (l || 1)).toFixed(2)}. No orbit payout of its own.`,
    unlock: () => lvl("dwarf") >= 1 && G.runDust >= 200000,
  },
  {
    id: "longnow",
    name: "The Long Now",
    maxLevel: 3,
    section: "DWARF PLANET",
    identity: true,
    group: "dwarf",
    costs: [60000, 140000, 300000],
    flavor: "The slow world rewards a slow, patient universe.",
    desc: (l) => `Dwarf payout climbs +0.3% every orbit, up to +${10 * (l || 1)}%. Resets on Accretion.`,
    unlock: () => lvl("dwarf") >= 1 && G.runDust >= 200000,
  },
  {
    id: "storedwinter",
    name: "Stored Winter",
    maxLevel: 3,
    section: "DWARF PLANET",
    identity: true,
    group: "dwarf",
    costs: [60000, 140000, 300000],
    flavor: "Ember banks the cold, then lets it go all at once.",
    desc: (l) => `Banks a ${Math.round(20 * (l || 1))}% share of every Maw pulse and releases the whole hoard each time Ember passes. Little orbit payout of its own.`,
    unlock: () => lvl("dwarf") >= 1 && G.runDust >= 200000,
  },
  {
    id: "anchor",
    name: "Gravitational Anchor",
    maxLevel: 3,
    section: "DWARF PLANET",
    identity: true,
    group: "dwarf",
    costs: [60000, 140000, 300000],
    flavor: "Ember's mass steadies every orbit in the system.",
    desc: (l) => `+${5 * (l || 1)}% to every orbiter's payout, this one and every future orbiter alike.`,
    unlock: () => lvl("dwarf") >= 1 && G.runDust >= 200000,
  },
  {
    id: "charm",
    name: "Comet Charm",
    maxLevel: 3,
    section: "COMETS",
    costs: [30, 80, 200],
    bonus: (lvl) => 1 + 0.25 * lvl,
    desc: (lvl) => `Comet windfall x${(1 + 0.25 * lvl).toFixed(2)}.`,
    unlock: () => false,
  },
];

const SECTION_ORDER = [
  "MAIN",
  "DUST PARTICLES",
  "ASTEROID",
  "MOON",
  "DWARF PLANET",
  "COMETS",
];

// Identity upgrades are limited per `group`: a group lets you pick up to IDENTITY_PICKS[group]
// distinct identities per universe; once that many are chosen, the rest lock. Dust picks 1 of 3;
// the orbiter groups pick 2 of 5.
const IDENTITY_PICKS = { dust: 2, asteroid: 2, moon: 2, dwarf: 2 };

function identityChosenCount(group) {
  return UPGRADES.reduce((n, x) => n + (x.group === group && (G.upgrades[x.id] || 0) >= 1 ? 1 : 0), 0);
}

// Returns the id of a chosen identity locking `u` (truthy), or null if `u` is free to buy/level.
function identityLockedBy(u) {
  if (!u || !u.group) return null;
  if ((G.upgrades[u.id] || 0) >= 1) return null;                       // u itself already chosen -> free to level
  const limit = IDENTITY_PICKS[u.group] || 1;
  if (identityChosenCount(u.group) < limit) return null;               // still room to pick another
  const chosen = UPGRADES.find((x) => x.group === u.group && x.id !== u.id && (G.upgrades[x.id] || 0) >= 1);
  return chosen ? chosen.id : true;                                    // limit reached, u is not chosen -> locked
}
