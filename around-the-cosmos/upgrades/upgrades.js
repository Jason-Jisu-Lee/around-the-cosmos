"use strict";

// ── Upgrade definitions ──────────────────────────────────────────────────────
// All purchasable upgrades and the order their sections render in. Effects are
// kept ADDITIVE (fixed +amount per level) rather than doubling, so the economy
// scales predictably (see orbiters/* for how payout/speed read these levels).
//
//   unlock: fn  -> card is visible when fn() returns true.
//   section:    -> heading the card is grouped under (see SECTION_ORDER).
//   flavor:     -> optional lore line (the upper "description" area of the popup).
//   desc:       -> the actual function/effect (the lower "Effect" area). fn of level.
const UPGRADES = [
  {
    id: "touch",
    name: "Star Touch",
    maxLevel: 8,
    section: "MAIN",
    costs: [10, 50, 150, 250, 400, 600, 800, 1000],
    tapYield: [1, 2, 3, 4, 5, 6, 7, 8, 9], // +1 ✦ per click per level
    flavor: "Reach into the dark and take what little light answers.",
    desc: () => "+1 ✦ to every click, per level.",
    unlock: () => true, // always visible (the first thing seen)
  },
  {
    id: "grasp",
    name: "Star Grasp",
    maxLevel: 3,
    section: "MAIN",
    costs: [500, 1000, 1500],
    flavor: "A surer hand closes on the falling stardust.",
    desc: () => "+2 ✦ to every click, per level (stacks on Star Touch).",
    unlock: () => lvl("touch") >= 6, // after the 6th Star Touch
  },
  {
    id: "pulse",
    name: "Pulse",
    maxLevel: 1,
    section: "MAIN",
    costs: [100000], // one-time buy
    flavor: "A steady heartbeat to keep the gathering going on its own.",
    desc: () =>
      "Every 3s the Lacuna pulses for 12 clicks of stardust (about 4 / sec). Hands-free: you no longer harvest by clicking.",
    unlock: () => lvl("grasp") >= 3, // after Star Grasp is maxed (with Gravitational Pull + Resonance)
  },
  {
    id: "gravpull",
    name: "Gravitational Pull",
    maxLevel: 2,
    section: "MAIN",
    costs: [5000, 12000],
    flavor: "Let your own gathered weight do some of the pulling.",
    desc: () => "+1% of all orbiter payout added to every click, per level.",
    unlock: () => lvl("grasp") >= 3, // after Star Grasp is maxed
  },
  {
    id: "resonance",
    name: "Resonance",
    maxLevel: 5,
    section: "MAIN",
    costs: [12000, 26500, 57000, 150000, 365000],
    flavor: "Tune the whole quiet system until it hums.",
    desc: () =>
      "+10% to every orbiter’s payout, per level. Also lights the Lacuna’s glow.",
    unlock: () => lvl("pulse") >= 1,
  },
  {
    id: "dust",
    name: "Dust Particle",
    maxLevel: 1,
    section: "DUST PARTICLES",
    costs: [100], // one-time: creates the first dust particle
    flavor: "The first grain of dust to settle into the Lacuna’s quiet orbit.",
    desc: () =>
      "Adds your first dust particle on the inner orbit. +10 base payout per orbit.",
    unlock: () => lvl("touch") >= 2, // after the second Star Touch
  },
  {
    id: "dustcount",
    name: "Dust Particle Count",
    maxLevel: 4,
    section: "DUST PARTICLES",
    costs: [500, 1200, 2500, 4000], // adds dust particles 2-5 (cap 5 total)
    desc: () =>
      "+1 dust particle in the clump, up to 5 (+10 base payout each).",
    unlock: () => lvl("dust") >= 1, // after the first dust particle exists
  },
  {
    id: "dustpay",
    name: "Dust Particle Payout",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [150, 500, 1200, 2000, 3000],
    desc: () => "+10 to every dust particle’s payout, per level.",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "dustspd",
    name: "Dust Particle Speed",
    maxLevel: 5,
    section: "DUST PARTICLES",
    costs: [200, 600, 1500, 2500, 4200],
    mult: (lvl) => 1 + 0.2 * lvl, // multiplier; dustSpeed() scales it by 0.82
    desc: () => "+20% dust orbit speed, per level.",
    unlock: () => lvl("dust") >= 1,
  },
  {
    id: "asteroid",
    name: "Asteroid",
    maxLevel: 1,
    section: "ASTEROID",
    costs: [1500], // a single body, NOT a count upgrade
    flavor: "A wandering chunk of old rock, heavy and slow.",
    desc: () =>
      "Adds the asteroid on a wider, slower orbit. +50 base payout per orbit.",
    unlock: () => lvl("dustcount") >= 1, // after the second dust particle
  },
  {
    id: "astpay",
    name: "Asteroid Payout",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [1500, 4500, 10000, 20000, 36000],
    desc: () => "+50 to the asteroid’s payout, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astspd",
    name: "Asteroid Speed",
    maxLevel: 5,
    section: "ASTEROID",
    costs: [2000, 4500, 9000, 17000, 30000],
    mult: (lvl) => 1 + 0.2 * lvl, // multiplier; asteroidSpeed() scales it by 0.88
    desc: () => "+20% asteroid orbit speed, per level.",
    unlock: () => lvl("asteroid") >= 1,
  },
  {
    id: "astcomp",
    name: "Asteroid Composition",
    maxLevel: 3,
    section: "ASTEROID",
    costs: [3000, 8000, 18000], // reforge into richer material
    flavor: "Reforge the rock into denser, richer stuff.",
    desc: (l) =>
      l >= 3
        ? `Composition: ${ASTEROID_COMP.names[3]}. Asteroid payout x${ASTEROID_COMP.mult[3]}.`
        : `Reforge ${ASTEROID_COMP.names[l]} to ${ASTEROID_COMP.names[l + 1]}. Asteroid payout x${ASTEROID_COMP.mult[l + 1]}.`,
    unlock: () => lvl("asteroid") >= 1, // the asteroid's unique upgrade
  },
  {
    id: "moon",
    name: "Moon",
    maxLevel: 1,
    section: "MOON",
    costs: [8000], // a single body, NOT a count upgrade
    flavor: "A pale companion, heavy enough to hold its own slow circle.",
    desc: () =>
      "Adds the moon on the widest, slowest orbit. Pays 200 per orbit at base, scaled by its lunar phase (x0.75 at the new moon up to x1.25 at the full). Whatever the payout reads when it completes an orbit is what it pays.",
    unlock: () => lvl("asteroid") >= 1, // after you own the asteroid
  },
  {
    id: "moonpay",
    name: "Moon Payout",
    maxLevel: 5,
    section: "MOON",
    costs: [8000, 18000, 36000, 70000, 120000],
    desc: () => "+200 to the moon’s base payout, per level.",
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "moonspd",
    name: "Moon Speed",
    maxLevel: 5,
    section: "MOON",
    costs: [9000, 18000, 35000, 60000, 100000],
    mult: (lvl) => 1 + 0.2 * lvl, // multiplier; moonSpeed() scales it by 0.663
    desc: () => "+20% moon orbit speed, per level.",
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "moonphase",
    name: "Lunar Phases",
    maxLevel: 5,
    section: "MOON", // the moon's unique upgrade
    costs: [12000, 28000, 55000, 90000, 140000],
    flavor: "Learn the tides the moon answers to, and widen them.",
    // Shifts the moon's phase payout range up by 0.10 on BOTH ends per level.
    desc: (l) =>
      `Moon payout swings x${(0.75 + 0.1 * l).toFixed(2)} at the new moon to x${(1.25 + 0.1 * l).toFixed(2)} at the full moon. Each level adds +0.10 to both ends.`,
    unlock: () => lvl("moon") >= 1,
  },
  {
    id: "charm",
    name: "Comet Charm",
    maxLevel: 3,
    section: "COMETS",
    costs: [30, 80, 200],
    bonus: (lvl) => 1 + 0.25 * lvl,
    desc: (lvl) => `Comet windfall x${(1 + 0.25 * lvl).toFixed(2)}.`,
    unlock: () => false, // comet upgrades disabled for now
  },
];

// Display order of upgrade sections — one per orbiter (a future tab each), MAIN first.
const SECTION_ORDER = ["MAIN", "DUST PARTICLES", "ASTEROID", "MOON", "COMETS"];
