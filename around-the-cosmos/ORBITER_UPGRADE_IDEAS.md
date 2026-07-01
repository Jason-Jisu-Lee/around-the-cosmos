# Orbiter Upgrade Ideas (brainstorm)

A design pool of powerful, identity-style unique upgrades for the **Asteroid**, **Moon**, and
**Dwarf Planet ("Ember")**. This is a menu to pick from, not a commitment. Numbers are placeholders
(`+X/lvl`); balance is a later pass.

## How to read this

Each idea is tagged with the traits it carries. An idea can have **0 to 5** of these:

| Tag | Trait | Meaning |
|---|---|---|
| **[SYN]** | 1. Synergy | Touches another orbiter, dust, comet, the Vortex, or Maw. |
| **[SCI]** | 2. Scientific | Built on a real astronomy/physics concept. The **only** category allowed a **bolder, intrusive** visual (because it is a powerful upgrade). |
| **[SAC]** | 3. Sacrifice | Weakens something else to make this body stronger. States exactly what it lowers. |
| **[DLY]** | 4. Delayed | Ramps over time or fires after a wait, instead of paying flat right away. |
| **[EVT]** | 5. Fixed event | A burst or world-event effect (extra pulses, faster comet/Vortex). Weak or **zero** permanent stat. |

Rules that hold for every idea:
- **Visual:** every idea has a visible change. All are **non-intrusive** except **[SCI]** ideas, which earn a bolder one.
- **Economy:** **additive** to its own stat by default (`+X/lvl`, matching the game's additive design). An idea with **no traits** may instead be **multiplicative** (`×/lvl`) since it offers no synergy or side mechanic. Those "plain" ideas are marked **(plain -> mult)**.
- **Hooks** name the real code paths an idea would plug into (`orbiterPayout`, `randCometGap`, `pulseValue`, `moonPhaseMult`, `dwarfCompoundMult`, `resonanceMult`, `VX` spawn, dust count, top-cross, etc.).

---

# DUST PARTICLES (12)

Theme: the only **swarm** (count 1-5), the innermost and fastest ring (0), closest to Maw. Already ships 3 identities (**Coagulation / Ice Mantles / Radiation Tails**), which all feed a bigger orbiter - so these 12 explore **other** angles: feeding Maw directly, swarm/count mechanics, trajectory, comet/Vortex.

### Trait matrix

| # | Name | SYN | SCI | SAC | DLY | EVT | Economy |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 | Static Charge | ✓ | | | | | additive |
| 2 | Accretion Disk | | ✓ | | ✓ | | additive (ramp) |
| 3 | Collisional Cascade | ✓ | | ✓ | | | additive (count²) |
| 4 | Photon Pressure | | ✓ | | | | additive (speed) |
| 5 | Zodiacal Light | ✓ | | | | | additive (comet) |
| 6 | Sublimation Puffs | | | | ✓ | ✓ | event (weak stat) |
| 7 | Poynting-Robertson Drag | ✓ | ✓ | ✓ | ✓ | | additive (count trade) |
| 8 | Swarm Resonance | ✓ | | | | | mult (needs all 5) |
| 9 | Dust Devil | | ✓ | | ✓ | | additive (ramp) |
| 10 | Nucleation | ✓ | | | ✓ | | additive |
| 11 | Interstellar Drift | ✓ | | | | ✓ | event |
| 12 | Denser Grains | | | | | | plain -> mult |

### Details

**1. Static Charge** `[SYN]`
- **Effect:** the grains hold charge and, closest to Maw, feed the pulse: `+X/lvl to every Maw pulse per particle owned` (count-scaled).
- **Visual:** tiny sparks arc between neighboring grains.
- **Hook:** flat add in the simulation.js pulse loop (like Ferromagnetic Pulse) times `G.planets.length`, after `pulseValue()`.

**2. Accretion Disk** `[SCI][DLY]`
- **Effect:** over the universe the swarm spreads into a proto-disk; dust payout ramps `+X` toward a cap as it matures (`universeTime`).
- **Visual (bolder):** a soft luminous disk brightens along ring 0 around Maw.
- **Hook:** `universeTime` ramp into dust `orbiterPayout`; a drawn disk in render.

**3. Collisional Cascade** `[SYN][SAC]`
- **Effect:** grains grind grains. **Sacrifice** dust speed `-X%`; in return payout scales with `count²` (a dense swarm collides far more).
- **Visual:** faint collision sparks flick between passing grains.
- **Hook:** `dustSpeed × (1-sac)`; dust payout `+= Y × count²` (or `count×(count-1)`).

**4. Photon Pressure** `[SCI]`
- **Effect:** starlight pushes the grains into a **wider, faster orbit**, so they pay more often.
- **Visual (bolder):** the dust ring visibly expands to a larger radius and quickens.
- **Hook:** `dustSpeed ×`; a wider ring-radius offset for ring 0 in render.

**5. Zodiacal Light** `[SYN]`
- **Effect:** scattered Maw-light brightens comets: `comet windfall +X`.
- **Visual:** a faint gold haze glows along the dust ring.
- **Hook:** factor in `catchComet` windfall.

**6. Sublimation Puffs** `[DLY][EVT]`
- **Effect:** every Nth orbit the innermost grain puffs into a stardust burst, then reforms. Weak permanent stat.
- **Visual:** a grain flares bright, vanishes, regrows a moment later.
- **Hook:** dust `onOrbit` counter → burst; a puff FX in drawClump.

**7. Poynting-Robertson Drag** `[SCI][SAC][DLY]`
- **Effect:** a real orbital-decay drag: grains **spiral into Maw and are swallowed** (the count drains over time), but each swallowed grain dumps a big lump into the pulse; the swarm slowly rebuilds.
- **Visual (bolder):** grains visibly spiral inward and wink out into Maw, then new ones fade in on the ring.
- **Hook:** periodic count decay + a pulse lump per swallowed grain + slow regrow timer.

**8. Swarm Resonance** `[SYN]`
- **Effect:** a **full swarm (all 5)** locks into a mutual resonance: `×payout on the whole swarm`, active only while you own all 5 (rewards maxing count).
- **Visual:** the grains snap into an even, evenly-spaced ring pattern.
- **Hook:** `if count === 5` multiply dust `orbiterPayout`.

**9. Dust Devil** `[SCI][DLY]`
- **Effect:** the clump spins up into a **tightening whirl** that concentrates payout the longer it runs (a mini-vortex), ramping to a cap.
- **Visual (bolder):** the dust clump visibly swirls into a tighter, faster spiral.
- **Hook:** ramp on payout + a tightening local orbit radius in drawClump.

**10. Nucleation** `[SYN][DLY]`
- **Effect:** each grain slowly seeds a **transient micro-grain** that rides along and pays a little before decaying (temporary swarm past 5).
- **Visual:** faint micro-motes bud off each grain and drift along.
- **Hook:** timed spawner adding short-lived payers to the dust list.

**11. Interstellar Drift** `[SYN][EVT]`
- **Effect:** foreign grains blow in with the **Vortex**: after one is absorbed, the swarm pays a bonus burst / boosted payout for a window.
- **Visual:** a few bluish "foreign" grains mix into the swarm briefly after a Vortex.
- **Hook:** on `startAbsorb`, arm a dust bonus window.

**12. Denser Grains** `(plain -> mult)`
- **Effect:** the no-trait plain option: `×payout` on the swarm.
- **Visual:** the grains read a touch larger and darker.
- **Hook:** multiplier in dust `orbiterPayout`.

---

# ASTEROID (12)

Theme: rock and metal, tumbling on ring 1, mining, impacts, ore, kinetic energy. Already ships **Composition** (Rock -> Diamond).

### Trait matrix

| # | Name | SYN | SCI | SAC | DLY | EVT | Economy |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 | Metallic Core | | | | | | plain -> mult |
| 2 | Rubble Pile | ✓ | | | | | additive |
| 3 | Ore Shipments | ✓ | | | ✓ | | additive |
| 4 | Eccentric Orbit | | ✓ | | | | additive |
| 5 | Kinetic Impactor | | | | | ✓ | event (weak stat) |
| 6 | Cannibalize the Belt | ✓ | | ✓ | | | additive |
| 7 | Ferromagnetic Pulse | ✓ | ✓ | | | | additive |
| 8 | Meteor Shower | ✓ | | | | ✓ | event (zero stat) |
| 9 | Slow Prospect | ✓ | | | ✓ | | additive (ramp) |
| 10 | Tidal Breakup | | ✓ | | ✓ | | additive (ramp) |
| 11 | Prospector's Cut | ✓ | | ✓ | | | additive |
| 12 | Gravitational Slingshot | | ✓ | | ✓ | ✓ | additive + burst |

### Details

**1. Metallic Core** `(plain -> mult)`
- **Effect:** Reveals a dense metal core. Flat `×payout` per level on the asteroid only.
- **Visual:** A specular sheen sweeps across the body as it tumbles (non-intrusive glint).
- **Hook:** multiplier folded into `asteroidPayout`.

**2. Rubble Pile** `[SYN]`
- **Effect:** The asteroid is loosely bound gravel: `+X/lvl` payout for **each dust particle** you own.
- **Visual:** A few small pebbles orbit the asteroid, one per dust particle.
- **Hook:** `asteroidPayout += X * lvl * G.planets.length`.

**3. Ore Shipments** `[SYN] [DLY]`
- **Effect:** The asteroid ships refined ore inward. Every orbit it adds a **stacking** `+X` to each dust particle's payout, up to a cap. Resets slowly if the asteroid is ever removed.
- **Visual:** Ore-tinted motes drift from the asteroid toward the dust ring between passes.
- **Hook:** a per-universe accumulator feeding dust `orbiterPayout`; ramp on asteroid top-cross.

**4. Eccentric Orbit** `[SCI]`
- **Effect:** Bends ring 1 from a circle into an ellipse. Payout scales with closeness to Maw: a spike at perihelion, a lull at aphelion. Net `+X/lvl` averaged.
- **Visual (bolder, [SCI]):** the orbit line visibly deforms into an ellipse; the body speeds up near Maw and coasts far out.
- **Hook:** new eccentricity term in the asteroid clump angle + `asteroidPayout` scaled by radius.

**5. Kinetic Impactor** `[EVT]`
- **Effect:** Every Nth top-cross the asteroid cracks and dumps a **burst** of stardust. Permanent per-orbit payout stays tiny (this is the event, not a stat).
- **Visual:** a brief fracture line flashes on the body and a puff of ejecta motes scatters.
- **Hook:** counter on asteroid top-cross, like Deep Breath's Nth-pulse logic.

**6. Cannibalize the Belt** `[SYN] [SAC]`
- **Effect:** The asteroid devours dust. **Sacrifice:** dust particle payout `-25%` while active; in return asteroid payout `+X/lvl` (large).
- **Visual:** dust grains occasionally get tugged toward the asteroid and vanish into it.
- **Hook:** debuff flag read by dust `orbiterPayout`; buff added to `asteroidPayout`.

**7. Ferromagnetic Pulse** `[SYN] [SCI]`
- **Effect:** The iron body couples to Maw's pulse: `+X/lvl` flat stardust **per pulse** (feeds the pulse, a small reverse of Gravitational Pull).
- **Visual (bolder, [SCI]):** faint magnetic field-line arcs flick between the asteroid and Maw on each pulse.
- **Hook:** flat add inside the `simulation.js` pulse loop, gated on ownership.

**8. Meteor Shower** `[SYN] [EVT]`
- **Effect:** Debris rains inward: **comets spawn faster** (`gap ×0.8^lvl`). The asteroid gains **no** permanent payout.
- **Visual:** small meteor streaks occasionally flick off the asteroid toward the sky.
- **Hook:** factor in `randCometGap` (stacks with the Comet Shower Mass upgrade).

**9. Slow Prospect** `[SYN] [DLY]`
- **Effect:** Rewards patience. Payout ramps `+X` per orbit the longer you go **without catching a comet**, up to a cap; catching a comet resets it.
- **Visual:** a warm ore-glow rim builds on the body as the bonus climbs, dimming on reset.
- **Hook:** timer since `catchComet`, folded into `asteroidPayout`.

**10. Tidal Breakup** `[SCI] [DLY]`
- **Effect:** Tidal stress slowly shears the asteroid. Payout ramps `+X` per orbit toward a cap as a debris trail grows.
- **Visual (bolder, [SCI]):** a visible rubble trail forms behind the asteroid and lengthens over time.
- **Hook:** per-universe ramp on top-cross; trail drawn in `drawClump`.

**11. Prospector's Cut** `[SYN] [SAC]`
- **Effect:** **Sacrifice:** locks the **Composition** multiplier (no more reforging bonus). In return, the diamond dust it sheds boosts **comet windfall** `×1.5`.
- **Visual:** sparkling crystalline motes trail the asteroid.
- **Hook:** clamp `ASTEROID_COMP.mult`; factor into `catchComet` windfall.

**12. Gravitational Slingshot** `[SCI] [DLY] [EVT]`
- **Effect:** Each orbit the asteroid accelerates a little (delayed build). At top speed it slingshots, dumping a **payout burst** and resetting to base speed.
- **Visual (bolder, [SCI]):** the orbit path whips into a tight curve at the slingshot, then relaxes.
- **Hook:** speed accumulator on `asteroidSpeed`; burst on the reset frame.

---

# MOON (12)

Theme: phases, tides, eclipses, tidal lock, libration, albedo, maria, gravity on ring 2. Already ships **Lunar Phases** (widens the phase payout range).

### Trait matrix

| # | Name | SYN | SCI | SAC | DLY | EVT | Economy |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 | Albedo | | | | | | plain -> mult |
| 2 | Tidal Pull | ✓ | ✓ | | | | additive |
| 3 | Spring Tide | ✓ | | | ✓ | | additive (phase-timed) |
| 4 | Solar Eclipse | ✓ | ✓ | | | ✓ | event + small stat |
| 5 | Libration | | ✓ | | | | additive |
| 6 | Maria Flooding | | | | ✓ | | additive (ramp) |
| 7 | Harvest Moon | | | ✓ | | | additive |
| 8 | Moonlight | ✓ | | ✓ | | | additive |
| 9 | Gravitational Lensing | ✓ | ✓ | | | | additive |
| 10 | Lunar Standstill | | | | ✓ | ✓ | delayed one-shot event |
| 11 | Condensation | ✓ | | | ✓ | | additive |
| 12 | Blood Moon | | ✓ | ✓ | | | additive (swing) |

### Details

**1. Albedo** `(plain -> mult)`
- **Effect:** A brighter surface reflects more light. Flat `×payout` per level on the moon only.
- **Visual:** the lit disc reads a shade brighter, highlight a touch sharper (non-intrusive).
- **Hook:** multiplier in `moonPayout` / `moonAvgPayout`.

**2. Tidal Pull** `[SYN] [SCI]`
- **Effect:** The moon's gravity drags the inner ring around: **dust orbit cadence `+X%`** per level (they pay more often).
- **Visual (bolder, [SCI]):** faint tug-lines flex from the moon toward the dust ring as it passes.
- **Hook:** factor on `dustSpeed` while the moon is owned.

**3. Spring Tide** `[SYN] [DLY]`
- **Effect:** Aligned tides amplify Maw. While the moon is **full**, every pulse pays `+X/lvl`; the bonus fades toward new moon. Delayed because it rides the 16s phase loop.
- **Visual:** on the full-moon window Maw's core gains a soft cool halo, timed to the phase.
- **Hook:** `moonLit()`-scaled flat add in the pulse loop.

**4. Solar Eclipse** `[SYN] [SCI] [EVT]`
- **Effect:** Every Nth phase cycle the moon slides across Maw and eclipses it: a big **stardust burst**. Small permanent per-orbit payout.
- **Visual (bolder, [SCI]):** a shadow sweeps over Maw and the sky dims briefly, then a bright ring flares.
- **Hook:** cycle counter; burst + a brief screen-dim FX (kept short and rare).

**5. Libration** `[SCI]`
- **Effect:** The moon rocks side to side (libration), showing more of its face. Widens the phase payout **swing** `+X/lvl` on both ends (stacks with Lunar Phases via a different mechanism).
- **Visual (bolder, [SCI]):** the disc gently rotates/rocks so craters near the limb drift in and out of view.
- **Hook:** wider amplitude in `moonPhaseMult`; slow rotation in `drawMoonDisc`.

**6. Maria Flooding** `[DLY]`
- **Effect:** Dark basalt seas spread across the face over the universe. Payout ramps `+X` as the maria fill, up to a cap.
- **Visual:** dark maria patches slowly grow across the lit disc.
- **Hook:** per-universe fill value feeding `moonPayout`; extra dark blots in `drawMoonDisc`.

**7. Harvest Moon** `[SAC]`
- **Effect:** **Sacrifice (self):** the moon slows its own orbit `-X%` (fewer passes) in exchange for a much larger payout **per** pass. A trade of cadence for weight.
- **Visual:** the disc swells slightly larger and warmer amber, riding lower and slower.
- **Hook:** cut `moonSpeed`, over-add to `moonPayout`.

**8. Moonlight** `[SYN] [SAC]`
- **Effect:** The moon bathes the outer bodies. **Sacrifice:** moon payout `-X%`; in return **Asteroid and Dwarf payout `+X%`** each.
- **Visual:** a soft pale wash briefly lights the asteroid and dwarf as the moon passes near them.
- **Hook:** debuff in `moonPayout`; buff folded into asteroid + dwarf payouts.

**9. Gravitational Lensing** `[SYN] [SCI]`
- **Effect:** The moon's mass bends passing light: **comets that pass near it are worth `+X%`** (and read easier to catch).
- **Visual (bolder, [SCI]):** starlight and the comet's tail visibly bow around the moon's limb as they pass.
- **Hook:** proximity check in `catchComet` windfall; a lensing warp in the comet overlay near the moon.

**10. Lunar Standstill** `[DLY] [EVT]`
- **Effect:** A rare, deeply delayed event: after many phase cycles the moon reaches a **standstill** and pays one enormous burst, then the counter restarts. Near-zero flat stat.
- **Visual:** as the standstill nears, the terminator stops drifting and the disc holds still, then flares.
- **Hook:** long cycle counter; one-shot burst.

**11. Condensation** `[SYN] [DLY]`
- **Effect:** The cold moon condenses volatiles into new grains: over time it seeds **transient dust motes** that ride the dust ring and pay, decaying if unfed. Delayed build.
- **Visual:** tiny frost specks bud off the moon and drift inward to join the dust clump.
- **Hook:** timed spawner adding short-lived payers to the dust list.

**12. Blood Moon** `[SCI] [SAC]`
- **Effect:** **Sacrifice:** deepens the phase gamble. At new moon the moon pays near `0`; at full moon it pays roughly **double**. Higher ceiling, harsher floor.
- **Visual (bolder, [SCI]):** the full moon tints deep copper-red; the new moon goes almost black.
- **Hook:** steeper curve in `moonPhaseMult`; phase-tinted disc.

---

# DWARF PLANET "EMBER" (12)

Theme: distant, cold, slow, banded, resonant, Kuiper-belt, sublimation, cryovolcanism on ring 3. Already ships **Compounding Orbit**, **Trojan Companions**, **Conjunction**.

### Trait matrix

| # | Name | SYN | SCI | SAC | DLY | EVT | Economy |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 | Deepening Bands | | | | | | plain -> mult |
| 2 | Orbital Resonance | ✓ | ✓ | | | | additive |
| 3 | Sublimation Tail | | ✓ | | ✓ | | additive (ramp) |
| 4 | Cryo-Eruption | | | | | ✓ | event (weak stat) |
| 5 | Aphelion Hoard | | | | ✓ | | additive (store/release) |
| 6 | Gravitational Anchor | ✓ | ✓ | | | | additive |
| 7 | Kuiper Capture | ✓ | | | ✓ | | additive (ramp) |
| 8 | Frost Siphon | ✓ | | ✓ | | | additive |
| 9 | Perturber | ✓ | ✓ | ✓ | | | additive |
| 10 | Stored Winter | ✓ | | | | ✓ | event (weak stat) |
| 11 | The Long Now | | | | ✓ | | additive (universe-long ramp) |
| 12 | Distant Kin | ✓ | | | | ✓ | event (zero stat) |

### Details

**1. Deepening Bands** `(plain -> mult)`
- **Effect:** The cloud bands thicken and sharpen. Flat `×payout` per level on the dwarf only.
- **Visual:** the `EMBER_TEX` bands read richer and higher-contrast (non-intrusive).
- **Hook:** multiplier in `dwarfBasePayout`.

**2. Orbital Resonance** `[SYN] [SCI]`
- **Effect:** Locks into a mean-motion resonance with the **Moon** (e.g. 2:3). When they line up, **both** bodies pay `+X/lvl` on that pass.
- **Visual (bolder, [SCI]):** a resonance arc briefly connects the dwarf and moon at each alignment.
- **Hook:** phase-alignment check between `moonClump` and `dwarfClump`; bonus on the aligned top-cross.

**3. Sublimation Tail** `[SCI] [DLY]`
- **Effect:** As Ember slowly warms it outgases. Payout ramps `+X` per orbit toward a cap while the tail grows; cools (resets partway) if unfed across an accretion.
- **Visual (bolder, [SCI]):** a faint cometary tail grows off the dwarf, always pointing away from Maw, lengthening over time.
- **Hook:** per-universe ramp on `dwarfBasePayout`; tail drawn in `drawDwarfClump`.

**4. Cryo-Eruption** `[EVT]`
- **Effect:** Every Nth orbit a cryovolcano erupts and throws a **burst** of stardust. Permanent per-orbit stat stays tiny.
- **Visual:** a brief ice plume jets from the dwarf's surface, settling back as frost.
- **Hook:** counter on dwarf top-cross; burst payout.

**5. Aphelion Hoard** `[DLY]`
- **Effect:** Across its long, slow orbit the dwarf **stores** a growing pile, then **releases** it all on the pass closest to Maw. Bigger the longer the lap.
- **Visual:** the bands brighten and "charge" as it coasts far out, discharging with a soft flash on the near pass.
- **Hook:** accumulator over the orbit, dumped on top-cross.

**6. Gravitational Anchor** `[SYN] [SCI]`
- **Effect:** Ember's mass steadies the whole system: a small **`+X%` to every orbiter's** payout (dust, asteroid, moon, dwarf).
- **Visual (bolder, [SCI]):** a faint gravity-well ripple distorts the starfield around the dwarf.
- **Hook:** global factor folded into `resonanceMult` (or a sibling global mult).

**7. Kuiper Capture** `[SYN] [DLY]`
- **Effect:** The dwarf slowly captures passing debris. Payout ramps `+X` per orbit and scales with the **number of dust particles** you own (more belt, more captures).
- **Visual:** faint captured specks accumulate in a thin co-orbiting arc beside the dwarf.
- **Hook:** ramp × dust count into `dwarfBasePayout`.

**8. Frost Siphon** `[SYN] [SAC]`
- **Effect:** Ember drains the Moon's volatiles. **Sacrifice:** Moon payout `-X%`; the dwarf gains `+X/lvl` (large).
- **Visual:** a thin frost stream drifts from the moon's ring out to the dwarf.
- **Hook:** debuff in `moonPayout`; add to `dwarfBasePayout`.

**9. Perturber** `[SYN] [SCI] [SAC]`
- **Effect:** The dwarf's gravity perturbs the **Asteroid**. **Sacrifice:** the asteroid's orbit wobbles and it pays `-X%`; the flung momentum gives the dwarf `+X/lvl`.
- **Visual (bolder, [SCI]):** the asteroid's ring-1 path visibly wobbles/precesses under the dwarf's pull.
- **Hook:** wobble term on `asteroidClump`; debuff asteroid, buff dwarf.

**10. Stored Winter** `[SYN] [EVT]`
- **Effect:** Ember banks the cold: it **freezes every Nth Maw pulse's** value and releases the hoard as a burst on its next pass. Weak permanent stat.
- **Visual:** frost rings tick brighter on the dwarf as pulses are banked, cracking off on release.
- **Hook:** pulse counter feeding a stored total; burst on dwarf top-cross.

**11. The Long Now** `[DLY]`
- **Effect:** The deepest delay: payout ramps continuously across the **entire universe lifetime** and never caps, paying off hugely on long runs before an Accretion.
- **Visual:** the bands very slowly brighten over the whole session, tracking universe time.
- **Hook:** ramp on `universeTime` into `dwarfBasePayout`; resets on accretion.

**12. Distant Kin** `[SYN] [EVT]`
- **Effect:** Kinship with the deep cosmos: the **Vortex spawns sooner and pays more**. The dwarf gains **no** permanent payout.
- **Visual:** a faint spiral glimmer occasionally turns in Ember's bands, echoing the Vortex.
- **Hook:** factor on `VX` spawn timing + `vortexReward`.

---

## Trait coverage (whole set)

Every trait appears many times across the 36, and each body carries a mix (one plain multiplicative
option, several single-trait, several multi-trait):

- **[SYN]** synergy: 7 asteroid, 7 moon, 7 dwarf.
- **[SCI]** scientific (bolder visual): 4 asteroid, 4 moon, 4 dwarf.
- **[SAC]** sacrifice: 2 asteroid, 3 moon, 2 dwarf.
- **[DLY]** delayed: 4 asteroid, 3 moon, 4 dwarf.
- **[EVT]** fixed event: 3 asteroid, 2 moon, 3 dwarf.

## Open questions for you

- How many of these should each body actually get? (The dust identities are 3 mutually-exclusive picks. Same model here, or a fixed 2 to 3 uniques each?)
- Should the [SAC] ones be **mutually exclusive** with the body they weaken, or free to stack?
- The three plain `(plain -> mult)` options are the "no-trait, so multiplicative" exception. Keep one per body, or drop them so every unique carries at least one trait?
