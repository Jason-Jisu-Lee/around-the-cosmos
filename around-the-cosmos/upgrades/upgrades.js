"use strict";

const UPGRADES = [
  {
    id: "touch",
    name: "Cosmic Pulse",
    maxLevel: 8,
    section: "MAIN",
    costs: [10, 50, 120, 250, 500, 750, 1000, 1300],
    flavor: "Maw stirs, drawing a slow, steady breath of light.",
    desc: () => "+5 ✦ generated every second, per level.",
    unlock: () => true,
  },
  {
    id: "surge",
    name: "Pulse Surge",
    maxLevel: 5,
    section: "MAIN",
    costs: [1000, 1800, 2800, 4700, 7050],
    flavor: "Each breath reaches deeper, and takes more.",
    desc: () => "+10 ✦ generated every second, per level.",
    unlock: () => lvl("touch") >= 6,
  },
  {
    id: "afterglow",
    name: "Afterglow",
    maxLevel: 5,
    section: "MAIN",
    costs: [2000, 4000, 6650, 9200, 14000],
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
    costs: [2500, 5850, 11000, 16000, 32000, 65000, 135000, 290000],
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
      3000, 5000, 8000, 11000, 16000, 25000, 38000, 57000, 87000, 130000,
      200000, 305000, 460000, 700000, 1200000,
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
    costs: [12000, 20000, 40000, 93000, 200000],
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
    costs: [12000, 26500, 57000, 150000, 365000],
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
    costs: [500, 1200, 3100, 5600],
    desc: () =>
      "+1 dust particle in the clump, up to 5 (+10 base payout each).",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "dustpay",
    name: "Dust Particle Payout",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [150, 500, 1500, 3300, 6000],
    desc: () => "+10 to every dust particle’s payout, per level.",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "dustspd",
    name: "Dust Particle Speed",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [200, 800, 2000, 3850, 7000],
    mult: (lvl) => 1 + 0.2 * lvl,
    desc: () => "+20% dust orbit speed, per level.",
    unlock: () => lvl("dust") >= 1,
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
    costs: [2200, 3750, 7500, 13500, 26500],
    desc: () => "+50 to the asteroid’s payout, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astspd",
    name: "Asteroid Speed",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [2750, 4400, 8800, 16500, 32500],
    mult: (lvl) => 1 + 0.2 * lvl,
    desc: () => "+20% asteroid orbit speed, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astcomp",
    name: "Asteroid Composition",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [3000, 8000, 18000, 40000, 90000],
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
    costs: [12000, 28000, 55000, 90000, 140000],
    flavor: "Learn the tides the moon answers to, and widen them.",
    desc: (l) =>
      `Moon payout swings x${(0.75 + 0.1 * l).toFixed(2)} at the new moon to x${(1.25 + 0.1 * l).toFixed(2)} at the full moon. Each level adds +0.10 to both ends.`,
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "dwarf",
    name: "Dwarf Planet",
    maxLevel: 1,
    section: "DWARF PLANET",
    costs: [50000],
    flavor: "A captured world settles into the widest, calmest orbit.",
    desc: () =>
      "Brings the Dwarf Planet into orbit on the widest ring. The slowest body, but each long pass pays +1,500 stardust, more than any other.",
    unlock: () =>
      typeof singularityLevel === "function" && singularityLevel() >= 1,
  },
  {
    id: "dwarfpay",
    name: "Dwarf Planet Payout",
    maxLevel: 5,
    section: "DWARF PLANET",
    costs: [50000, 130000, 320000, 700000, 1200000],
    desc: () => "+1,500 to the Dwarf Planet's payout, per level.",
    unlock: () => lvl("dwarf") >= 1,
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

const SECTION_ORDER = ["MAIN", "DUST PARTICLES", "ASTEROID", "MOON", "DWARF PLANET", "COMETS"];
