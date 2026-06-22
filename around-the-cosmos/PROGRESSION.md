# Around the Cosmos — Progression & Upgrade Reference

> Living design doc for the **current build** (`feature/moon`). Numbers here
> mirror `config.js` / `state.js`. Updated alongside any balance/structure change.

---

## The loop in one line
Click the Lacuna (center) to earn **stardust (✦)** → buy **Star Touch** to earn more per click
→ buy **Dust Particles** (orbiters) that pay on every orbit → catch **comets** for bursts.

- **Clicking:** each click earns the current click value (Star Touch + Star Grasp). **Hold the mouse** to auto-click **~3×/sec**.
- **No passive income yet** — early game is active (clicking + comets). Orbiters add the first "idle" income.

---

## Early-game flow (what unlocks, in order)

| Step | Trigger | What happens |
|---|---|---|
| Start | t = 0 | Just the Lacuna. Click to earn **1 ✦**/click. Only **Star Touch** is shown. |
| First comet | ~**7–13 s** in | A comet crosses — tap it for a burst. Unlocks the **Comet Value** stat. After this, comets recur every **25–55 s**. |
| Star Touch ×1 | buy (✦10) | Click now earns **2** (+1). |
| Star Touch ×2 | buy (✦50) | Click earns **3**. → **Dust Particle** upgrade appears (creates your first orbiter). |
| First Dust Particle | buy (✦100) | Your first **orbiter** appears, paying **10 ✦** per orbit. One-time buy. Unlocks **Dust Particle Count**, **Dust Particle Payout**, **Dust Particle Speed**, and the **All Orbiters Payout** stat. |
| 2nd Dust Particle | buy Dust Particle Count (✦500) | A second dust particle joins the clump → unlocks the **Asteroid** (a single body). |
| Star Touch ×6 | buy (✦600) | → **Star Grasp** appears in MAIN (a stronger per-click upgrade). |
| The Asteroid | buy (✦1,500) | A single bigger, slower **asteroid** appears on a wider orbit, paying **50 ✦** per orbit. Unlocks **Asteroid Payout**, **Asteroid Speed**, **Asteroid Composition**. |
| Star Grasp maxed | buy (lvl 3) | → **Gravitational Pull**, **Resonance**, and **Pulse** all appear in MAIN at once (clicks scale with orbiter payout; Resonance is a global orbit payout boost that lights the Lacuna glow; Pulse is the ✦100,000 auto-clicker). |
| The Moon | buy (✦8,000) | A large pale **moon** appears on the widest, slowest orbit (ring 2), sitting right on the orbit line and visibly waxing/waning. Pays **200 ✦** per orbit (varying with its phase by default, most at full moon). Unlocks **Moon Payout**, **Moon Speed**, and **Lunar Phases**. |
| … | … | Buy more dust particles (max 5), pump payout/speed, grab **Resonance**, develop the Moon, keep catching comets. |

---

## Upgrades

> Sections are **per orbiter** (each will become a tab): **MAIN**, **DUST PARTICLES**, **ASTEROID**, **MOON**, **COMETS**.
> If the list overflows, scroll the upgrade panel.

### MAIN

**Star Touch** — *always available* · max **8** levels · **+1 ✦ per click each level** (additive, not doubling)
| Level | Cost ✦ | Click value |
|---|---|---|
| (base) | — | 1 |
| 1 | 10 | 2 |
| 2 | 50 | 3 |
| 3 | 150 | 4 |
| 4 | 250 | 5 |
| 5 | 400 | 6 |
| 6 | 600 | 7 |
| 7 | 800 | 8 |
| 8 | 1,000 | 9 |

> Buying level 2 is what reveals the DUST PARTICLES section (Dust Particle).

**Star Grasp** — *unlocks after Star Touch lvl 6* · max **3** · **+2 ✦ per click each level** (stacks on Star Touch)
| Level | Cost ✦ | Adds to each click |
|---|---|---|
| 1 | 500 | +2 |
| 2 | 1,000 | +4 |
| 3 | 1,500 | +6 |

> Total click value = Star Touch value + 2 × Star Grasp level (+ Gravitational Pull, below), via `clickValue()`.

**Pulse** — *unlocks after Star Grasp is maxed (lvl 3), alongside Gravitational Pull + Resonance* · max **1** · one-time **✦100,000** · the **auto-clicker**.
A slow heartbeat every **3 seconds** auto-harvests **12 clicks** worth of stardust (≈**4 clicks/sec**), with a gentle beat on the Lacuna.
**Trade-off:** once bought you **can no longer harvest by clicking** — it's hands-free (comets and info cards still respond to clicks).

**Gravitational Pull** — *unlocks after Star Grasp is maxed* · max **2** · each level adds **+1% of total orbiter payout to every click**
| Level | Cost ✦ | Click bonus |
|---|---|---|
| 1 | 2,000 | +1% of all orbiter payout |
| 2 | 4,000 | +2% of all orbiter payout |

> Ties active clicking to your idle income — the more your orbiters pay, the more each click is worth.
> Combos with **Resonance** (which raises orbiter payout, so it raises this bonus too).

**Resonance** — *unlocks after Star Grasp is maxed (appears alongside Gravitational Pull)* · max **5** · **global** payout multiplier on **every** orbiter
Adds **+10% per level (additive)** to all orbiter payout — ×1.10 → ×1.50 at level 5 — and is the only thing
that lights the **Lacuna's glow** (off by default; brightens marginally per level, but stays *very* faint
even at max). Combos with Gravitational Pull.
| Level | Cost ✦ | All orbiter payout |
|---|---|---|
| 1 | 3,000 | ×1.10 |
| 2 | 6,500 | ×1.20 |
| 3 | 12,000 | ×1.30 |
| 4 | 20,000 | ×1.40 |
| 5 | 32,000 | ×1.50 |

### DUST PARTICLES

**Dust Particle** — *unlocks after Star Touch lvl 2* · **one-time buy** (✦100)
Creates your **first** dust particle — a small grey pebble orbiting the Lacuna as part of a shared **clump** (ring 0),
paying **10 ✦ per orbit** at base. Like the other orbiters, buying it populates that orbiter's upgrades
(**Dust Particle Count**, **Payout**, **Speed**).

**Dust Particle Count** — *unlocks after the first dust particle* · max **4** (→ 5 particles total)
Adds one more particle to the clump per level (+10 base payout each).
| Bought | Cost ✦ | Total dust particles |
|---|---|---|
| (1st, via Dust Particle) | 100 | 1 |
| Count ×1 | 500 | 2 |
| Count ×2 | 1,200 | 3 |
| Count ×3 | 2,500 | 4 |
| Count ×4 | 4,000 | 5 |

**Dust Particle Payout** — *unlocks after the first dust particle* · max **5**
Adds **+10** to **every** dust particle's payout per level (additive, not doubling).
| Level | Cost ✦ | Payout per particle |
|---|---|---|
| (base) | — | 10 |
| 1 | 150 | 20 |
| 2 | 500 | 30 |
| 3 | 1,200 | 40 |
| 4 | 2,000 | 50 |
| 5 | 3,000 | 60 |

> One dust particle pays `10 + 10×lvl`; five particles pay `5 × that`.

**Dust Particle Speed** — *unlocks after the first dust particle* · max **5** · +20% per level
The upgrade multiplier runs 100%→200%, but dust has a **0.82 base-speed factor** (base reduced 18%),
so the *actual* orbit speed is the column below — i.e. **82% → 164%**.
| Level | Cost ✦ | Orbit speed (×0.82) |
|---|---|---|
| (base) | — | 82 % |
| 1 | 200 | 98 % |
| 2 | 600 | 115 % |
| 3 | 1,500 | 131 % |
| 4 | 2,500 | 148 % |
| 5 | 4,200 | 164 % |

> Faster orbit = the clump crosses the top more often = more payouts per minute.

### ASTEROID

**Asteroid** — *unlocks after the 2nd dust particle* · **single body** (one-time buy, ✦1,500)
A bigger rocky-brown body on a **wider, slower orbit** (ring 1, its own clump), with tiny dust
motes drifting around it. Pays **50 ✦ per orbit** at base (before the Payout upgrade).
**Unlike dust particles, the asteroid is not a count upgrade** — there's only ever one. Its
identity comes from its unique **Asteroid Composition** upgrade (below).

**Asteroid Payout** — *unlocks after the first asteroid* · max **5** — adds **+50** to the asteroid's payout per level (additive).
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 1,500 | 4,500 | 10,000 | 20,000 | 36,000 |
| Payout (Rock) | 50 | 100 | 150 | 200 | 250 | 300 |

**Asteroid Speed** — *unlocks after the first asteroid* · max **5** — +20% per level, with a **0.88 base-speed factor** (base reduced 12%) → effective **88% → 176%**.
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 2,000 | 4,500 | 9,000 | 17,000 | 30,000 |
| Speed (×0.88) | 88% | 106% | 123% | 141% | 158% | 176% |

**Asteroid Composition** — *unlocks after the asteroid* · max **3** — the asteroid's **unique** upgrade.
Reforge the single asteroid into denser/richer material: each tier **recolors** it and **multiplies its payout**.
| Tier | Material | Color | Payout × | Cost to reach ✦ |
|---|---|---|---|---|
| 0 (base) | Rock | grey-brown | ×1 | — |
| 1 | Iron | steel grey | ×1.25 | 3,000 |
| 2 | Gold | gold | ×1.5 | 8,000 |
| 3 | Ice | pale blue | ×1.75 | 18,000 |

> Composition is the one asteroid **multiplier**: `asteroidPayout = round((50 + 50×payoutLvl) × compMult × resonanceMult)`.
> Rounded so the fractional multipliers never leave a fractional stardust amount.

### MOON

**Moon** — *unlocks after you own the asteroid* · **single body** (one-time buy, ✦8,000)
A large, pale, round companion on the **widest, slowest orbit** (ring 2, its own clump). Pays
**200 ✦ per orbit** at base (before the Payout upgrade) — by far the richest single body. Like the
asteroid it is **not a count upgrade** — there's only ever one Moon.

**Moon Payout** — *unlocks after the moon* · max **5** — adds **+200** to the moon's payout per level (additive).
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 8,000 | 18,000 | 36,000 | 70,000 | 120,000 |
| Payout | 200 | 400 | 600 | 800 | 1,000 | 1,200 |

**Moon Speed** — *unlocks after the moon* · max **5** — +20% per level, with a **0.663 base-speed factor** (slowed 15% from 0.78; the slowest orbiter) → effective **66.3% → 132.6%**.
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 9,000 | 18,000 | 35,000 | 60,000 | 100,000 |
| Speed (×0.663) | 66% | 80% | 93% | 106% | 119% | 133% |

**Phase-varying payout** — the moon's payout swings with its phase **by default** (no upgrade needed): from **×0.75 at the new moon up to ×1.25 at the full moon**. It visibly waxes and wanes on a 16-second cycle (a terminator shadow sweeps across it), and whatever the payout reads when it completes an orbit is what it pays.

**Lunar Phases** — *unlocks after the moon* · max **5** — the moon's **unique** upgrade. Each level shifts that range up by **+0.10 on both ends**, so it raises the average payout while keeping the new→full swing.
| Level | (default) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | — | 12,000 | 28,000 | 55,000 | 90,000 | 140,000 |
| Range (new → full) | ×0.75–1.25 | ×0.85–1.35 | ×0.95–1.45 | ×1.05–1.55 | ×1.15–1.65 | ×1.25–1.75 |

> `moonPayout = round((200 + 200×payoutLvl) × moonPhaseMult × resonanceMult)`, where
> `moonPhaseMult = (0.75 + 0.10×phaseLvl) + 0.50 × litFraction` (litFraction 0 at new moon → 1 at full moon).

### COMETS

**Comet Charm** — *currently disabled* (will return later). Comets still pay windfalls without it.

---

## Comets
- First appears **~7–13 s** in; afterward every **25–55 s** (`COMET_MIN_GAP`–`COMET_MAX_GAP`).
- On screen for **8 s** (`COMET_LIFE`); tap within ~48px to catch. Hovering it shows a **targeting reticle** and a "Comet" label.
- **Windfall = round( (10 × click value) + 1.25 × every orbiter's payout combined ).**
  - Click value = Star Touch + Star Grasp (`clickValue()`); combined = `Σ each orbiter's count × payout` (dust + asteroid + moon).
  - Rounded so the 1.25× never leaves a fractional stardust amount.
  - Example: click value 3, three dust particles at Payout lvl 1 (20 each) → `10×3 + 1.25×(3×20)` = 30 + 75 = **105 ✦**.

---

## Observatory stats (the draggable panel, top-left)
| Stat | Shows | Appears |
|---|---|---|
| Star Touch Value | ✦ per click (Star Touch + Star Grasp) | always |
| All Orbiters Payout | combined payout of all orbiters per orbit (hover → formula) | after first orbiter |
| All Orbiters Payout / min | that combined payout × how often the clumps orbit (payout × orbits per minute) | after first orbiter |
| Comet Value | what the next comet pays (hover → formula) | after first comet caught |
| Total Stardust Collected | all stardust earned this universe (`runDust`; hover → note that it resets on prestige) | always |
| Time on Current Universe | run timer (resets on prestige, later) | always |

---

## The Lacuna (center object)
- The small dark center everything orbits. Currently static (will evolve through stages later).
- Orbiters clump on their own rings around it (dust ring 0, asteroid ring 1, moon ring 2); more orbiter types / rings come later.

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
| Orbit payout | ✦ per orbit for the **whole clump** (= dust count × `orbiterPayout()`; per particle = 10 +10/lvl) |
| Orbital speed | ~63.7 m/s at base (82%); **scales with Dust Particle Speed** (up to ~127 m/s at 164%) |
| Orbits / hour | ~0.27 at base; scales with Speed |

**An asteroid (ring 1):**
| Stat | Value |
|---|---|
| Composition | current material tier (Rock / Iron / Gold / Ice) |
| Orbit payout | ✦ per orbit (= `asteroidPayout()`, base 50 +50/lvl, × composition) |
| Orbital speed | ~48.3 m/s at base (88%); **scales with Asteroid Speed** (up to ~96.7 m/s at 176%) |
| Orbits / hour | ~0.08 at base; scales with Speed |

**The moon (ring 2):**
| Stat | Value |
|---|---|
| Phase | current lunar phase (New → Full → New, on a 24s cycle) |
| Orbit payout | ✦ per orbit (= `moonPayout()`, base 200 +200/lvl, × phase factor) |
| Orbital speed | scales with Moon Speed (0.78 base factor → 78% → 156%) |
| Orbits / hour | the slowest orbiter; scales with Speed |

> Each orbiter's speed and orbits/hour are tied to its Speed upgrade — buying it visibly increases both, so the cosmic readout reflects the actual mechanic. Every card also carries a one-sentence flavor description.

---

## Not in yet (planned)
Prestige (black-hole consumption → Dark Matter), center evolution stages, the Lacuna upgrade
pillar, solar events, more orbiter types, the tabbed per-orbiter UI (once >5 orbiters).
