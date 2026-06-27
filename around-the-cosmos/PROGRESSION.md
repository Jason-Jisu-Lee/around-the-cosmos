# Around the Cosmos - Progression & Upgrade Reference

> Living design doc for the **current build** (`feature/accretion_v.4_upgrades`). Numbers here
> mirror `config.js` / `state.js`. Updated alongside any balance/structure change.

---

## The loop in one line
Buy **Cosmic Pulse** so Maw **auto-generates stardust (✦) every second** → buy **Dust Particles**
(orbiters) that pay on every orbit → catch **comets** for bursts.

- **This is an idle game, not a clicker.** Clicking never harvests. Income is Maw's **pulse** (once Cosmic Pulse is owned) plus orbiters and comets.
- **You start with 10 ✦** - exactly enough to buy the first Cosmic Pulse and kick off the income.
- **Clicking** only **catches a passing comet** (within ~48px) or **opens a body's info card**.

---

## Early-game flow (what unlocks, in order)

| Step | Trigger | What happens |
|---|---|---|
| Start | t = 0 | Just Maw and **10 ✦**. No income yet. Only **Cosmic Pulse** is shown. |
| First comet | ~**7–13 s** in | A comet crosses - click it for a burst. Unlocks the **Comet Value** stat. After this, comets recur every **16–41 s**. |
| Cosmic Pulse ×1 | buy (✦10) | Maw begins **auto-generating 5 ✦/sec**, bouncing gently on each pulse. |
| Cosmic Pulse ×2 | buy (✦50) | Now **10 ✦/sec**. → **Dust Particle** upgrade appears (creates your first orbiter). |
| First Dust Particle | buy (✦100) | Your first **orbiter** appears, paying **10 ✦** per orbit. One-time buy. Unlocks **Dust Particle Count**, **Dust Particle Payout**, **Dust Particle Speed**, and the **All Orbiters Payout** stat. |
| 2nd Dust Particle | buy Dust Particle Count (✦500) | A second dust particle joins the clump. |
| Cosmic Pulse ×6 | buy (✦750) | → **Pulse Surge** appears in MAIN (a stronger per-pulse upgrade). |
| 5k stardust collected | `runDust ≥ 5,000` | → the **Asteroid** unlocks (a single body, no longer gated on dust particles). |
| The Asteroid | buy (✦2,000) | A single bigger, slower **asteroid** appears on a wider orbit, paying **50 ✦** per orbit. Unlocks **Asteroid Payout**, **Asteroid Speed**, **Asteroid Composition**. |
| 10k stardust collected | `runDust ≥ 10,000` | → **Deep Breath** and **Abyssal Breath** unlock in MAIN together (every Nth pulse pays ×2 - Deep Breath triggers it sooner, Abyssal Breath raises the ×2 up to ×5). |
| 32k stardust collected | `runDust ≥ 32,000` | → the **Moon** unlocks (a single body). |
| The Moon | buy (✦10,000) | A large pale **moon** appears on the widest, slowest orbit (ring 2), sitting right on the orbit line and visibly waxing/waning. Pays **200 ✦** per orbit (varying with its phase by default, most at full moon). Unlocks **Moon Payout**, **Moon Speed**, and **Lunar Phases**. |
| 50k stardust collected | `runDust ≥ 50,000` | → **Gravitational Pull** and **Resonance** unlock in MAIN together (advanced upgrades - the pulse scales with total orbiter payout; Resonance is a global orbit payout boost that lights Maw glow). |
| … | … | Buy more dust particles (max 5), pump payout/speed, grab **Resonance**, develop the Moon, keep catching comets. |

---

## Upgrades

> Sections are **per orbiter** (each will become a tab): **MAIN**, **DUST PARTICLES**, **ASTEROID**, **MOON**, **COMETS**.
> If the list overflows, scroll the upgrade panel.

### MAIN

**Cosmic Pulse** - *always available* · max **8** levels · **+5 ✦/sec each level** (additive, not doubling) - the core income
Once owned, Maw **auto-generates stardust every second** (it bounces gently on each pulse and plays a soft tick).
| Level | Cost ✦ | ✦ generated / sec |
|---|---|---|
| (base) | - | 0 (no income) |
| 1 | 10 | 5 |
| 2 | 50 | 10 |
| 3 | 120 | 15 |
| 4 | 250 | 20 |
| 5 | 500 | 25 |
| 6 | 750 | 30 |
| 7 | 1,000 | 35 |
| 8 | 1,300 | 40 |

> Buying level 2 is what reveals the DUST PARTICLES section (Dust Particle).

**Pulse Surge** - *unlocks after Cosmic Pulse lvl 6* · max **5** · **+10 ✦ per pulse each level** (stacks on Cosmic Pulse)
| Level | Cost ✦ | Adds to each pulse |
|---|---|---|
| 1 | 500 | +10 |
| 2 | 1,000 | +20 |
| 3 | 1,500 | +30 |
| 4 | 2,200 | +40 |
| 5 | 3,000 | +50 |

> Pulse value (✦ per second) = 5 × Cosmic Pulse + 10 × Pulse Surge (+ Gravitational Pull, below), via `pulseValue()`. **Deep Breath** then doubles the occasional pulse on top of this.

**Afterglow** - *unlocks with Pulse Surge (Cosmic Pulse lvl 6)* · max **5** · **active-play bonus** - for **60s** after you catch a comet, every pulse gains **+20 / level** ✦ (catching another comet refreshes the timer). The **Afterglow card itself lights up** with a draining bar so you can see the window run out (it flashes amber near the end).
| Level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Cost ✦ | 2,000 | 3,000 | 4,500 | 6,600 | 9,200 |
| Bonus while lit | +20 | +40 | +60 | +80 | +100 / pulse |

**Deep Breath** - *unlocks after collecting 10,000 stardust this universe (`runDust ≥ 10,000`)* · max **8** · **every Nth breath pays ×2**
| Level | Cost ✦ | Deep Breath every |
|---|---|---|
| 1 | 2,500 | 12th breath |
| 2 | 4,500 | 11th breath |
| 3 | 8,500 | 10th breath |
| 4 | 16,000 | 9th breath |
| 5 | 32,000 | 8th breath |
| 6 | 65,000 | 7th breath |
| 7 | 135,000 | 6th breath |
| 8 | 290,000 | 5th breath |

> Every Nth pulse (N = 13 − level) becomes a **Deep Breath**: pays **×2** a normal pulse (raised by Abyssal Breath, below), bounces harder, and flares Maw's glow gold with a deeper tick. Average pulse boost runs **+8.3%** (every 12th) up to **+20%** (every 5th). The multiplier is applied in the pulse loop, not in `pulseValue()`.

**Abyssal Breath** - *unlocks alongside Deep Breath (`runDust ≥ 10,000`)* · max **15** · **empowers Deep Breath**: each level adds **+0.2×** to its payout
| Level | 0 (base) | 1 | 2 | … | 14 | 15 |
|---|---|---|---|---|---|---|
| Deep Breath pays | ×2.0 | ×2.2 | ×2.4 | … | ×4.8 | ×5.0 |

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Cost ✦ | 2,000 | 3,000 | 4,500 | 7,000 | 11,000 | 16,000 | 25,000 | 38,000 |

| Level | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|
| Cost ✦ | 57,000 | 87,000 | 130,000 | 200,000 | 305,000 | 460,000 | 700,000 |

> `deepBreathMult()` = 2 + 0.2 × level. At max, a Deep Breath every 5th pulse paying ×5 is roughly **+80%** average pulse income - the deepest single pulse investment in the game.

**Gravitational Pull** - *an advanced upgrade - unlocks after collecting 50,000 stardust this universe (`runDust ≥ 50,000`)* · max **5** · each level adds **+1% of total orbiter payout to every pulse**
| Level | Cost ✦ | Pulse bonus |
|---|---|---|
| 1 | 12,000 | +1% of all orbiter payout |
| 2 | 20,000 | +2% of all orbiter payout |
| 3 | 40,000 | +3% of all orbiter payout |
| 4 | 93,000 | +4% of all orbiter payout |
| 5 | 200,000 | +5% of all orbiter payout |

> Ties the pulse to your idle income - the more your orbiters pay, the more each pulse is worth.
> Combos with **Resonance** (which raises orbiter payout, so it raises this bonus too).

**Resonance** - *unlocks at `runDust ≥ 50,000` (alongside Gravitational Pull)* · max **5** · **global** payout multiplier on **every** orbiter
Adds **+10% per level (additive)** to all orbiter payout - ×1.10 → ×1.50 at level 5 - and is the only thing
that lights the **Maw's glow** (off by default; brightens marginally per level, but stays *very* faint
even at max). Combos with Gravitational Pull.
| Level | Cost ✦ | All orbiter payout |
|---|---|---|
| 1 | 3,000 | ×1.10 |
| 2 | 6,500 | ×1.20 |
| 3 | 12,000 | ×1.30 |
| 4 | 20,000 | ×1.40 |
| 5 | 32,000 | ×1.50 |

### DUST PARTICLES

**Dust Particle** - *unlocks after Star Touch lvl 2* · **one-time buy** (✦100)
Creates your **first** dust particle - a small grey pebble orbiting Maw as part of a shared **clump** (ring 0),
paying **10 ✦ per orbit** at base. Like the other orbiters, buying it populates that orbiter's upgrades
(**Dust Particle Count**, **Payout**, **Speed**).

**Dust Particle Count** - *unlocks after the first dust particle* · max **4** (→ 5 particles total)
Adds one more particle to the clump per level (+10 base payout each).
| Bought | Cost ✦ | Total dust particles |
|---|---|---|
| (1st, via Dust Particle) | 100 | 1 |
| Count ×1 | 500 | 2 |
| Count ×2 | 1,200 | 3 |
| Count ×3 | 3,100 | 4 |
| Count ×4 | 5,600 | 5 |

**Dust Particle Payout** - *unlocks after the first dust particle* · max **5**
Adds **+10** to **every** dust particle's payout per level (additive, not doubling).
| Level | Cost ✦ | Payout per particle |
|---|---|---|
| (base) | - | 10 |
| 1 | 150 | 20 |
| 2 | 500 | 30 |
| 3 | 1,500 | 40 |
| 4 | 3,300 | 50 |
| 5 | 6,000 | 60 |

> One dust particle pays `10 + 10×lvl`; five particles pay `5 × that`.

**Dust Particle Speed** - *unlocks after the first dust particle* · max **5** · +20% per level
The upgrade multiplier runs 100%→200%, but dust has a **0.82 base-speed factor** (base reduced 18%),
so the *actual* orbit speed is the column below - i.e. **82% → 164%**.
| Level | Cost ✦ | Orbit speed (×0.82) |
|---|---|---|
| (base) | - | 82 % |
| 1 | 200 | 98 % |
| 2 | 800 | 115 % |
| 3 | 2,000 | 131 % |
| 4 | 3,850 | 148 % |
| 5 | 7,000 | 164 % |

> Faster orbit = the clump crosses the top more often = more payouts per minute.

### ASTEROID

**Asteroid** - *unlocks after collecting 5,000 stardust this universe (`runDust ≥ 5,000`)* · **single body** (one-time buy, ✦2,000)
A bigger rocky-brown body on a **wider, slower orbit** (ring 1, its own clump), with tiny dust
motes drifting around it. Pays **50 ✦ per orbit** at base (before the Payout upgrade).
**Unlike dust particles, the asteroid is not a count upgrade** - there's only ever one. Its
identity comes from its unique **Asteroid Composition** upgrade (below).

**Asteroid Payout** - *unlocks after the first asteroid* · max **5** - adds **+50** to the asteroid's payout per level (additive).
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | - | 3,000 | 10,000 | 30,000 | 66,000 | 120,000 |
| Payout (Rock) | 50 | 100 | 150 | 200 | 250 | 300 |

> Costs follow the **same ratio as the dust-particle payout upgrade, scaled ×20** (asteroid's 2,000 start ÷ dust's 100 start).

**Asteroid Speed** - *unlocks after the first asteroid* · max **5** - +20% per level, with a **0.88 base-speed factor** (base reduced 12%) → effective **88% → 176%**.
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | - | 4,000 | 16,000 | 40,000 | 77,000 | 140,000 |
| Speed (×0.88) | 88% | 106% | 123% | 141% | 158% | 176% |

**Asteroid Composition** - *unlocks after the asteroid* · max **3** - the asteroid's **unique** upgrade.
Reforge the single asteroid into denser/richer material: each tier **recolors** it and **multiplies its payout**.
| Tier | Material | Color | Payout × | Cost to reach ✦ |
|---|---|---|---|---|
| 0 (base) | Rock | grey-brown | ×1 | - |
| 1 | Iron | steel grey | ×1.25 | 3,000 |
| 2 | Gold | gold | ×1.5 | 8,000 |
| 3 | Ice | pale blue | ×1.75 | 18,000 |

> Composition is the one asteroid **multiplier**: `asteroidPayout = round((50 + 50×payoutLvl) × compMult × resonanceMult)`.
> Rounded so the fractional multipliers never leave a fractional stardust amount.

### MOON

**Moon** - *unlocks after collecting 32,000 stardust this universe (`runDust ≥ 32,000`)* · **single body** (one-time buy, ✦10,000)
A large, pale, round companion on the **widest, slowest orbit** (ring 2, its own clump). Pays
**200 ✦ per orbit** at base (before the Payout upgrade) - by far the richest single body. Like the
asteroid it is **not a count upgrade** - there's only ever one Moon.

**Moon Payout** - *unlocks after the moon* · max **5** - adds **+200** to the moon's payout per level (additive).
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | - | 15,000 | 50,000 | 150,000 | 330,000 | 600,000 |
| Payout | 200 | 400 | 600 | 800 | 1,000 | 1,200 |

> Costs follow the **same ratio as the dust-particle payout upgrade, scaled ×100** (moon's 10,000 start ÷ dust's 100 start).

**Moon Speed** - *unlocks after the moon* · max **5** - +20% per level, with a **0.663 base-speed factor** (slowed 15% from 0.78; the slowest orbiter) → effective **66.3% → 132.6%**.
| Level | (base) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | - | 20,000 | 80,000 | 200,000 | 385,000 | 700,000 |
| Speed (×0.663) | 66% | 80% | 93% | 106% | 119% | 133% |

**Phase-varying payout** - the moon's payout swings with its phase **by default** (no upgrade needed): from **×0.75 at the new moon up to ×1.25 at the full moon**. It visibly waxes and wanes on a 16-second cycle (a terminator shadow sweeps across it), and whatever the payout reads when it completes an orbit is what it pays.

**Lunar Phases** - *unlocks after the moon* · max **5** - the moon's **unique** upgrade. Each level shifts that range up by **+0.10 on both ends**, so it raises the average payout while keeping the new→full swing.
| Level | (default) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Cost ✦ | - | 12,000 | 28,000 | 55,000 | 90,000 | 140,000 |
| Range (new → full) | ×0.75–1.25 | ×0.85–1.35 | ×0.95–1.45 | ×1.05–1.55 | ×1.15–1.65 | ×1.25–1.75 |

> `moonPayout = round((200 + 200×payoutLvl) × moonPhaseMult × resonanceMult)`, where
> `moonPhaseMult = (0.75 + 0.10×phaseLvl) + 0.50 × litFraction` (litFraction 0 at new moon → 1 at full moon).

### COMETS

**Comet Charm** - *currently disabled* (will return later). Comets still pay windfalls without it.

---

## Comets
- First appears **~7–13 s** in; afterward every **16–41 s** (`COMET_MIN_GAP`–`COMET_MAX_GAP`).
- On screen for **8 s** (`COMET_LIFE`); click within ~48px to catch. Hovering it shows a **targeting reticle** and a "Comet" label.
- Each comet flies at a **random speed** - ×1, ×1.5, ×2, or ×2.5 of base. Faster ones are harder to catch but pay more.
- **Windfall = round( ( (10 × pulse value) + 1 × every orbiter's payout combined ) × comet speed × Brighter Tails ).**
  - Pulse value = 5 × Cosmic Pulse + 10 × Pulse Surge (`pulseValue()`); combined = `Σ each orbiter's count × payout` (dust + asteroid + moon).
  - Rounded so it never leaves a fractional stardust amount.
  - Example: pulse value 15, three dust particles at Payout lvl 1 (20 each), a ×2 comet → `(10×15 + 1×(3×20)) × 2` = (150 + 60) × 2 = **420 ✦**.

---

## Observatory stats (draggable panel, default bottom-left)
| Stat | Shows | Appears |
|---|---|---|
| All Orbiters Payout | combined payout of all orbiters per orbit (hover → formula) | after first orbiter |
| All Orbiters Payout / min | that combined payout × how often the clumps orbit (payout × orbits per minute) | after first orbiter |
| Total income / min | whole passive economy: pulse / min (Deep Breath avg + Afterglow folded in) + orbiters / min (hover → breakdown) | always |
| Comet Value | what the next comet pays (hover → formula) | after first comet caught |
| Vortex Value | what a vortex absorb pays (= comet base × 4; hover → breakdown) | after first vortex appears |
| Total Stardust Collected | all stardust earned this universe (`runDust`; hover → note that it resets on prestige) | always |
| Time on Current Universe | run timer (resets on prestige, later) | always |
| Total time played | lifetime clear-time (`gameTime`; only the Reset button clears it) | after first Accretion |

---

## Maw (center object)
- The small dark center everything orbits. Currently static (will evolve through stages later).
- Orbiters clump on their own rings around it (dust ring 0, asteroid ring 1, moon ring 2); more orbiter types / rings come later.

## Cosmic info
**Hover** Maw or a dust particle for a quick tooltip that follows your cursor. **Click** it to pin the full card in the **center of the sky** - it stays put so you can read it, and closes with the **× button** or **Escape**. (Clicking a body opens its card; clicking never harvests; comets are still caught on click.)

**Maw (center)** - the card shows your live pulse income (the physical stats it used to show were removed):
| Stat | Shows |
|---|---|
| Cosmic Pulse / s | effective ✦ per second = base pulse × **Deep Breath average** + **Afterglow** (while active) |
| Cosmic Pulse / min | that × 60 |

Under them, a concise breakdown line spells out the math (e.g. `✦90/pulse × 1.80 Deep Breath + ✦100 Afterglow = ✦262/s`), then a one-sentence flavor line introducing Maw as the protagonist.

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

> Each orbiter's speed and orbits/hour are tied to its Speed upgrade - buying it visibly increases both, so the cosmic readout reflects the actual mechanic. Every card also carries a one-sentence flavor description.

---

## Accretion (prestige)
Collapse the whole universe into Maw to bank **Mass**, then spend it on permanent upgrades
that carry into every future universe.

- **Unlocks** whenever the **current universe** reaches **200,000** stardust (`runDust`, and there's ≥1 Mass to claim).
- **Mass earned** = `floor(3 × ∛(this universe's stardust / 200,000))` → 200k = 3, 800k = 4, 1.6M = 6, 5.4M = 9, 12.8M = 12, 25M = 15.
  **Per-run, not lifetime:** reaching a milestone pays the **same Mass every universe** (200k always = 3), so you can
  always aim for a milestone and choose whether to push past it. **Cube-root curve:** the first accretion is a big
  **3-Mass** milestone at 200k, but each further point needs ×8 the stardust for ×2 the Mass - pushing is rewarded yet
  slows. (The disincentive to spam quick 200k accretions is meant to come from **rising Mass-upgrade costs** - to be
  tuned - plus the rebuild cost, since the earn curve itself is concave.) **Greater Collapse** multiplies what you receive.
- **What resets:** stardust + every stardust upgrade. **What you keep:** Mass and everything you bought with it.

### Mass upgrades (few, powerful - 1–3 Mass per level)
| Tab | Node | Effect / level | Lvls | Mass cost |
|---|---|---|---|---|
| Maw | **Denser Core** | +50% pulse income | 5 | 1·2·3·4·5 |
| Maw | **First Light** | begin each universe with ✦ 1,000 → 5,000 → 20,000 *(unlocks after Denser Core)* | 3 | 3·6·10 |
| Orbiters | **Heavier Bodies** | +50% to every orbiter's payout | 5 | 1·2·3·4·5 |
| Orbiters | **Retained Companions** | start with the Dust Particle → Asteroid → Moon already formed | 3 | 2·3·5 |
| Phenomena | **Brighter Tails** | +50% comet windfall | 4 | 1·2·3·4 |
| Phenomena | **Comet Shower** | comets arrive ~15% sooner (gap ×0.85) | 3 | 1·2·3 |
| Cycles | **Greater Collapse** | ×Mass per accretion (1 + level/3 → up to ×2) | 3 | 2·3·4 |
| Cycles | **Lunar Favor** | +10% average moon payout | 3 | 1·2·3 |

First Light + Retained Companions take effect at the **birth** of each universe, so they shrink the
opening grind on every subsequent run. You can spend Mass **only on the Mass page right after an
Accretion**; an **Undo** button (top-right) refunds any purchase made on that page, back to the start
of the session (it never touches Mass spent in earlier accretions). The **Mass Upgrades** button
(bottom-left, after your first Accretion) lets you *view* the tree any time, but not spend.

---

## Not in yet (planned)
Center evolution stages, Maw upgrade pillar, solar events, more orbiter types,
more Mass nodes + new prestige mechanics, the tabbed per-orbiter UI (once >5 orbiters).
