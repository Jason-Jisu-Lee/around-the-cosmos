# Lacuna — Progression & Upgrade Reference

> Living design doc for the **current build** (`feature/dust_particles`). Numbers here
> mirror `config.js` / `state.js`. Updated alongside any balance/structure change.

---

## The loop in one line
Click the Lacuna (center) to earn **stardust (✦)** → buy **Star Touch** to earn more per click
→ buy **Dust Particles** (orbiters) that pay on every orbit → catch **comets** for bursts.

- **Clicking:** each click earns the current Star Touch value. **Hold the mouse** to auto-click ~2×/sec.
- **No passive income yet** — early game is active (clicking + comets). Orbiters add the first "idle" income.

---

## Early-game flow (what unlocks, in order)

| Step | Trigger | What happens |
|---|---|---|
| Start | t = 0 | Just the Lacuna. Click to earn **1 ✦**/click. Only **Star Touch** is shown. |
| First comet | ~**7–13 s** in | A comet crosses — tap it for a burst. Unlocks the **Comet Value** stat. After this, comets recur every **25–55 s**. |
| Star Touch ×1 | buy (✦10) | Click now earns **2** (+1). |
| Star Touch ×2 | buy (✦40) | Click earns **3**. → **Dust Particle** upgrade appears. |
| First Dust Particle | buy (✦100) | Your first **orbiter** appears, paying **10 ✦** per orbit. Unlocks **Dust Particle Payout** + **Dust Particle Speed**, and the **All Orbiters Payout** stat. |
| 2nd Dust Particle | buy (✦300) | A second dust particle joins the clump → unlocks the **Asteroid** (a single body). |
| The Asteroid | buy (✦1,000) | A single bigger, slower **asteroid** appears on a wider orbit, paying **50 ✦** per orbit. Unlocks **Asteroid Payout**, **Asteroid Speed**, **Asteroid Composition**. |
| … | … | Buy more dust particles (max 4), pump payout/speed on both, keep catching comets. |

---

## Upgrades

### ACTIONS

**Star Touch** — *always available* · max **4** levels · **+1 ✦ per click each level** (additive, not doubling)
| Level | Cost ✦ | Click value |
|---|---|---|
| (base) | — | 1 |
| 1 | 10 | 2 |
| 2 | 40 | 3 |
| 3 | 130 | 4 |
| 4 | 400 | 5 |

> Buying level 2 is what reveals the ORBITERS section (Dust Particle).

### ORBITERS

**Dust Particle** — *unlocks after Star Touch lvl 2* · max **4**
Each one is a small grey pebble orbiting the Lacuna as part of a shared **clump** (ring 0).
Every dust particle pays **10 ✦ per orbit** at base (before the Payout upgrade).
| Bought | Cost ✦ | Total dust particles |
|---|---|---|
| 1st | 100 | 1 |
| 2nd | 300 | 2 |
| 3rd | 700 | 3 |
| 4th | 1,300 | 4 |

**Dust Particle Payout** — *unlocks after the first dust particle* · max **5**
Adds **+10** to **every** dust particle's payout per level (additive, not doubling).
| Level | Cost ✦ | Payout per particle |
|---|---|---|
| (base) | — | 10 |
| 1 | 150 | 20 |
| 2 | 450 | 30 |
| 3 | 1,000 | 40 |
| 4 | 2,000 | 50 |
| 5 | 3,600 | 60 |

> One dust particle pays `10 + 10×lvl`; four particles pay `4 × that`.

**Dust Particle Speed** — *unlocks after the first dust particle* · max **5**
The upgrade itself runs **100% → 200%** (+20% per level). On top of that, dust has a flat
**×1.2 base-speed bump**, so the *actual* orbit speed is 1.2× the values below — i.e. **120% → 240%**.
| Level | Cost ✦ | Upgrade | Actual (×1.2) |
|---|---|---|---|
| (base) | — | 100 % | 120 % |
| 1 | 200 | 120 % | 144 % |
| 2 | 450 | 140 % | 168 % |
| 3 | 900 | 160 % | 192 % |
| 4 | 1,700 | 180 % | 216 % |
| 5 | 3,000 | 200 % | 240 % |

> Faster orbit = the clump crosses the top more often = more payouts per minute.

**Asteroid** — *unlocks after the 2nd dust particle* · **single body** (one-time buy, ✦1,000)
A bigger rocky-brown body on a **wider, slower orbit** (ring 1, its own clump), with tiny dust
motes drifting around it. Pays **50 ✦ per orbit** at base (before the Payout upgrade).
**Unlike dust particles, the asteroid is not a count upgrade** — there's only ever one. Its
identity comes from its unique **Asteroid Composition** upgrade (below).

**Asteroid Payout** — *unlocks after the first asteroid* · max **5** — adds **+50** to the asteroid's payout per level (additive).
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 1,500 | 4,500 | 10,000 | 20,000 | 36,000 |
| Payout (Rock) | 50 | 100 | 150 | 200 | 250 | 300 |

**Asteroid Speed** — *unlocks after the first asteroid* · max **5** — +20% orbit speed per level (100% → 200%).
| Level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Cost ✦ | 2,000 | 4,500 | 9,000 | 17,000 | 30,000 |
| Speed | 120% | 140% | 160% | 180% | 200% |

**Asteroid Composition** — *unlocks after the asteroid* · max **3** — the asteroid's **unique** upgrade.
Reforge the single asteroid into denser/richer material: each tier **recolors** it and **multiplies its payout**.
| Tier | Material | Color | Payout × | Cost to reach ✦ |
|---|---|---|---|---|
| 0 (base) | Rock | grey-brown | ×1 | — |
| 1 | Iron | steel grey | ×1.5 | 3,000 |
| 2 | Gold | gold | ×2.5 | 8,000 |
| 3 | Ice | pale blue | ×4 | 18,000 |

> Composition is the one asteroid **multiplier**: `asteroidPayout = (50 + 50×payoutLvl) × compMult`.

### COMETS

**Comet Charm** — *currently disabled* (will return later). Comets still pay windfalls without it.

---

## Comets
- First appears **~7–13 s** in; afterward every **25–55 s** (`COMET_MIN_GAP`–`COMET_MAX_GAP`).
- On screen for **8 s** (`COMET_LIFE`); tap within ~48px to catch. Hovering it shows a **targeting reticle** and a "Comet" label.
- **Windfall = (10 × click value) + 1.25 × (every orbiter's payout combined).**
  - Combined orbiter payout = `dust × dustPayout + asteroids × asteroidPayout`.
  - Example: click value 3, three dust particles at Payout lvl 1 (20 each) → `10×3 + 1.25×(3×20)` = 30 + 75 = **105 ✦**.

---

## Observatory stats (the draggable panel, top-left)
| Stat | Shows | Appears |
|---|---|---|
| Star Touch Value | ✦ per click | always |
| All Orbiters Payout | combined payout of all dust particles per orbit (hover → formula) | after first dust particle |
| Stardust / min | live total income rate (rolling 5 s average) | always |
| Comet Value | what the next comet pays (hover → formula) | after first comet caught |
| Time on Current Universe | run timer (resets on prestige, later) | always |

---

## The Lacuna (center object)
- The small dark center everything orbits. Currently static (will evolve through stages later — see `asd.txt` for the long-term v3 plan).
- Dust particles clump on **one orbit ring** around it; more orbiter types / rings come later.

## Cosmic info
**Hover** the Lacuna or a dust particle for a quick tooltip that follows your cursor. **Click** it to pin the full card in the **center of the sky** — it stays put so you can read it, and closes with the **× button** or **Escape**. (Clicking a body opens its card instead of harvesting; comets are still caught on click.) All values come from a small physics model (`PHYS` in `config.js`) so the upcoming **science-based upgrades** can grow them; numbers are kept clean (≤2 decimals, intuitive units).

**The Lacuna (center):**
| Stat | Base value |
|---|---|
| Diameter | 240 km |
| Mass | 1.81 × 10¹⁹ kg |
| Surface gravity | 0.85% of Earth |
| Escape velocity | 142 m/s |
| Density | 2.5 g/cm³ |

Plus a one-sentence flavor line introducing the Lacuna as the protagonist.

**A dust particle (ring 0):**
| Stat | Value |
|---|---|
| Orbit payout | ✦ per orbit (= `orbiterPayout()`, base 10 +10/lvl) |
| Orbital speed | ~93 m/s at base (120%); **scales with Dust Particle Speed** (up to ~186 m/s at 240%) |
| Orbits / hour | ~0.27 at base; scales with Speed |

**An asteroid (ring 1):**
| Stat | Value |
|---|---|
| Composition | current material tier (Rock / Iron / Gold / Ice) |
| Orbit payout | ✦ per orbit (= `asteroidPayout()`, base 50 +50/lvl, × composition) |
| Orbital speed | ~54.9 m/s at base; **scales with Asteroid Speed** (up to ~110 m/s) |
| Orbits / hour | ~0.08 at base; scales with Speed |

> Each orbiter's speed and orbits/hour are tied to its Speed upgrade — buying it visibly increases both, so the cosmic readout reflects the actual mechanic. Every card also carries a one-sentence flavor description.

---

## Not in yet (planned)
Prestige (black-hole consumption → Dark Matter), center evolution stages, the Lacuna upgrade
pillar, solar events, more orbiter types, the tabbed per-orbiter UI (once >5 orbiters). The
full v3 design lives in `asd.txt`.
