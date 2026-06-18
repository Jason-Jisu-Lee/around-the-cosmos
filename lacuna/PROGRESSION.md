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
| Star Touch ×1 | buy (✦10) | Click now earns **2**. |
| Star Touch ×2 | buy (✦50) | Click earns **4**. → **Dust Particle** upgrade appears. |
| First Dust Particle | buy (✦100) | Your first **orbiter** appears, paying **10 ✦** per orbit. Unlocks **Dust Particle Payout** + **Dust Particle Speed**, and the **All Orbiters Payout** stat. |
| … | … | Buy more dust particles (max 3), pump payout/speed, keep catching comets. |

---

## Upgrades

### ACTIONS

**Star Touch** — *always available* · max **4** levels
| Level | Cost ✦ | Click value |
|---|---|---|
| (base) | — | 1 |
| 1 | 10 | 2 |
| 2 | 50 | 4 |
| 3 | 200 | 8 |
| 4 | 1,000 | 16 |

> Buying level 2 is what reveals the ORBITERS section (Dust Particle).

### ORBITERS

**Dust Particle** — *unlocks after Star Touch lvl 2* · max **3**
Each one is a small grey pebble orbiting the Lacuna as part of a shared **clump**.
Every dust particle pays **10 ✦ per orbit** (before multipliers).
| Bought | Cost ✦ | Total dust particles |
|---|---|---|
| 1st | 100 | 1 |
| 2nd | 350 | 2 |
| 3rd | 800 | 3 |

**Dust Particle Payout** — *unlocks after the first dust particle* · max **5**
Multiplies **every** dust particle's payout. Non-effect-stacking with count (it's a global ×).
| Level | Cost ✦ | Payout multiplier |
|---|---|---|
| 1 | 150 | ×2 |
| 2 | 600 | ×4 |
| 3 | 1,500 | ×8 |
| 4 | 3,000 | ×16 |
| 5 | 6,000 | ×32 |

> So one dust particle pays `10 × (payout multiplier)`; three particles pay `3 × 10 × mult`.

**Dust Particle Speed** — *unlocks after the first dust particle* · max **5**
The clump's orbit starts at **50 %** speed; each level brings it back toward original.
Card shows **"(×1.2 speed)"** on every level.
| Level | Cost ✦ | Orbit speed |
|---|---|---|
| (base) | — | 50 % |
| 1 | 200 | 60 % |
| 2 | 500 | 70 % |
| 3 | 1,000 | 80 % |
| 4 | 2,000 | 90 % |
| 5 | 4,000 | 100 % (original) |

> Faster orbit = the clump crosses the top more often = more payouts per minute.

### COMETS

**Comet Charm** — *currently disabled* (will return later). Comets still pay windfalls without it.

---

## Comets
- First appears **~7–13 s** in; afterward every **25–55 s** (`COMET_MIN_GAP`–`COMET_MAX_GAP`).
- On screen for **8 s** (`COMET_LIFE`); tap within ~48px to catch.
- **Windfall = (10 × click value) + (every dust particle's payout combined).**
  - Example: click value 4, three particles at ×2 payout → `10×4 + 3×(10×2)` = 40 + 60 = **100 ✦**.

---

## Observatory stats (the draggable panel, top-left)
| Stat | Shows | Appears |
|---|---|---|
| Star Touch Value | ✦ per click | always |
| All Orbiters Payout | combined payout of all dust particles per orbit | after first dust particle |
| Stardust / min | live total income rate (rolling 5 s average) | always |
| Comet Value | what the next comet pays (hover → formula) | after first comet caught |
| Time on Current Universe | run timer (resets on prestige, later) | always |

---

## The Lacuna (center object)
- The small dark center everything orbits. Currently static (will evolve through stages later — see `asd.txt` for the long-term v3 plan).
- Dust particles clump on **one orbit ring** around it; more orbiter types / rings come later.

---

## Not in yet (planned)
Prestige (black-hole consumption → Dark Matter), center evolution stages, the Lacuna upgrade
pillar, solar events, more orbiter types, the tabbed per-orbiter UI (once >5 orbiters). The
full v3 design lives in `asd.txt`.
