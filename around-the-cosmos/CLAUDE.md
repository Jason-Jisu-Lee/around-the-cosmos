# Around the Cosmos

Celestial idle/incremental game (the protagonist/center object is named **the Lacuna**).
Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## What this game is
- The **Lacuna** (small dark center) is orbited by **orbiters** that pay stardust (✦) each orbit
- Click anywhere on the canvas to harvest stardust; catch comets for windfalls
- No free orbiters — click to earn, then buy your first **Dust Particle**
- Tone: calm, meditative, slightly melancholy — "lacuna" means a gap or void

> **Current scope (`refine/v.3` — minimal base, rebuilding step by step):** The game
> starts with **0 orbiters** — clicking is the only income; you buy the first one.
> **Economy note:** effects are **additive (fixed +amount/level), not doubling** — this keeps
> the scale from exploding. Multipliers are used sparingly (only Speed and Composition).
> Upgrade sections are now **per orbiter** (future tabs): **MAIN** / **DUST PARTICLES** / **ASTEROID** / **COMETS**.
> **MAIN:** **Star Touch** (8 levels, costs [10,50,150,250,400,600,800,1000], click → 1…9, **+1 per level**),
> then **Star Grasp** (after 5th Star Touch; 3 levels, costs [500,1000,1500], **+2 per click per level**),
> then **Gravitational Pull** (after Star Grasp maxed; 2 levels, costs [5000,20000], each level adds
> **+1% of total orbiter payout to every click**), and **Resonance** (see below). Click value =
> `clickValue()` = Star Touch + 2×Grasp + 0.01×gravpull×(total orbiter payout), rounded.
> **DUST PARTICLES:** **Dust Particle** (after 2nd Star Touch; **one-time buy** that creates the first particle,
> cost 100, **+10 base payout**), then **Dust Particle Count** (after the first; **+1 particle/level**, 4 levels →
> 5 total, costs [500,1200,2500,4000] — all share one orbit on ring 0), **Dust Particle Payout** (**+10 to each dust
> particle's payout per level**, 5 levels, costs [150,500,1200,2000,3000]) and **Dust Particle Speed**
> (the upgrade runs 100%→200%, costs [200,600,1500,2500,4200]). (Like the other orbiters, the count/payout/speed
> upgrades populate only **once the first Dust Particle is bought**.)
> **ASTEROID:** **Asteroid** (after 2nd dust particle; a **single body**, one-time cost 1500, **+50 base payout**,
> own clump on the wider ring 1, with drifting dust motes) with **Asteroid Payout** (**+50/level**, 5
> levels, costs [1500,4500,10000,20000,36000]), **Asteroid Speed** (costs [2000,4500,9000,17000,30000]),
> and its unique **Asteroid Composition** (3 tiers Rock→Iron→Gold→Ice, recolors it + payout ×[1,1.25,1.5,1.75],
> costs [3000,8000,18000]). **MOON:** **Moon** (after you own the asteroid; a **single body**, one-time
> cost 8000, **+200 base payout**, own clump on the widest ring 2 — pale, round, the slowest orbit) with
> **Moon Payout** (**+200/level**, 5 levels, costs [8000,18000,36000,70000,120000]), **Moon Speed**
> (the upgrade runs 100%→200%, scaled by a 0.78 base factor → 78%→156%, costs [9000,18000,35000,60000,100000]),
> and its unique **Lunar Phases** (4 levels, costs [12000,25000,45000,75000]): the moon visibly
> waxes/wanes on a `MOON_CYCLE`=24s loop, and payout rides the cycle — ×1 at new moon up to
> ×(1+0.25·lvl) at full moon (pure upside; lvl 0 = cosmetic cycle only).
> **Resonance** (in MAIN, unlocks after Star Grasp is maxed — appears alongside
> Gravitational Pull; 4 levels, costs [5000,10000,18000,30000]) is a **global ×payout on every orbiter**,
> +0.25/level (×1→×2), and lights the Lacuna's faint glow.
> **Only dust particles use a count upgrade**; all other orbiters are single bodies. **COMETS:** Comet Charm exists but is **disabled** (`unlock:()=>false`);
> comets still pay windfalls. Prestige, remnants, evolution, etc. are all out.
> Earlier ideas removed: New Planet, per-planet Orbit Payout/Speed, the per-planet tab UI
> (will return once there are >5 orbiters), First Light.

## File structure
Scripts load in this order — each file can reference globals from earlier files freely.

| File | Contents |
|---|---|
| `index.html` | Shell, header (game title **"AROUND THE COSMOS"** in `#logo`; centered stardust HUD), 3-column layout, observatory + cosmo-tip/cosmo-card. Loads every script below, in order. **Cache-busting:** `style.css` + every script tag carry `?v=N` — **bump N (currently 60) when you edit a CSS/JS file** or the browser may serve a stale cached copy. |
| `style.css` | All styling — parchment theme (#f4f0e8 bg, Georgia serif, flat shapes). The sky canvas (`#sky`) uses a custom cursor: `url(assets/cursors/needle.png?v=N) 4 4` (tip = hotspot). **Note:** `ui/cosmo.js` rewrites `canvas.style.cursor` **inline every frame** (pointer hand over a body, else the needle) — that inline style wins over this CSS rule, so the needle path/hotspot must stay in sync in both places. The cursor URL carries its own `?v=N` cache-bust because the PNG is overwritten in place when regenerated. |
| `assets/` | Static assets + small self-contained design modules. `cursors/` holds `needle.png` (the in-game cursor — a **32×32 single flat ink** slim triangle pointing top-left, no outline, crisp supersampled edges) + `generate.js` (dependency-free pure-Node PNG generator — `node assets/cursors/generate.js`; the shape is the `TRI` triangle, tip = hotspot 3,3). `cursors`'s `assets/preview.html` shows it at 1×/4×/zoom. `click-effects/` holds `effects.js` (the Lacuna click-reaction registry — see below) + `preview.html` (interactive gallery to feel all five). |
| **Core** | |
| `config.js` | CFG constants, PLANET_DEF (ring radii/periods), **PHYS** (cosmic-flavor physical model). Just constants. |
| `state.js` | G object, createInitialState, `newClump`, formatters (`fmtNum`/`fmtTime`/`fmtNice`/`fmtSci`), upg/lvl accessors, `clickValue`, **Lacuna physics** (`lacunaMass`/`lacunaGravity`/`lacunaEscapeVel`), earn, save/load |
| **`sound/`** | `core.js` (Web Audio engine: `SND` state, `audioBoot`/`tone`/`reverb`, volumes, mute), `effects/sfx.js` (`sfxTap`/`sfxOrbit`/`sfxComet`/`sfxBuy`/`sfxComplete`), `music/tracks.js` (3 procedural tracks + loop scheduler), `sound.js` (the `SoundSystem` facade everything calls) |
| **`orbiters/`** | `registry.js` (`ORBITERS`/`ORBITER_BY_ID`/`registerOrbiter`/`tipRow`); `dust.js`, `asteroid.js`, `moon.js` — **one self-contained component per orbiter type** (body factory, payout/speed/velocity, **flavor description — edit here**, color/pebbleR/ring, list/clump/clumpPos, info-card `rows()`, buy-`labels`; `asteroid.js` also defines `ASTEROID_COMP`). |
| **`upgrades/`** | `upgrades.js` — `UPGRADES` (all upgrade defs: costs/effects/unlocks) + `SECTION_ORDER` |
| `render.js` | canvas/ctx, resize, orbitR, clumpPos/asteroidClumpPos/moonClumpPos, drawClump, **drawReticle**, draw (iterates ORBITERS), burst, COMET_HOVER_R |
| **`comet/`** | `comet.js` — `randCometGap`, `spawnComet`, `catchComet`, `cometTick` |
| `logic.js` | `tick` (iterates ORBITERS + calls `cometTick`), `buyUpgrade` |
| **`ui/`** | `panels.js` (upgrade accordion + visibleSig), `observatory.js` (stats DOM + `updateObservatory`), `hud.js` (`updateUI` orchestrator), `cosmo.js` (hover tooltip + click-to-pin info cards, comet reticle label) |
| `settings.js` | gear panel: volume sliders, track buttons, persistence |
| `debug.js` | initDebug, tickWithDebug (speed mult), dust inject / spawn comet / reset |
| `game.js` | Main loop, canvas input (click + hold-to-autoclick), header controls, audio boot, draggable, init — **~95 lines** |

No npm, no bundler, no TypeScript.

**`PROGRESSION.md`** is a player/designer-facing reference of the early-game flow and the
full upgrade structure (levels, costs, effects, unlock order). Keep it in sync with
`config.js`/`state.js` whenever balance or upgrade structure changes.

**Update this file whenever:** a new file is added, a mechanic changes, upgrade trees grow, state fields are added, CFG constants change, or the save key bumps.

## Key constants (CFG, top of config.js)
- MAX_PLANETS: 8 (only used to size `PLANET_DEF` / the `orbitR` ring math; dust particles use ring 0)
- COMET_MIN_GAP / COMET_MAX_GAP: 25–55s between comets
- COMET_LIFE: 8s on screen

## Upgrade tree (cost ✦) — defined in `upgrades/upgrades.js`. Effects are ADDITIVE, not doubling.
| id | Name | Levels | Effect | Unlock | Section |
|---|---|---|---|---|---|
| touch | Star Touch | 8 | each click earns tapYield[lvl] = [1..9] ✦ (**+1/level**, costs [10,50,150,250,400,600,800,1000]) | always | MAIN |
| grasp | Star Grasp | 3 | **+2 ✦ per click per level** (adds to Star Touch via `clickValue()`, costs [500,1000,1500]) | after touch lvl ≥ 5 | MAIN |
| gravpull | Gravitational Pull | 2 | each level adds **+1% of total orbiter payout to every click** (in `clickValue()`, costs [5000,20000]) | after grasp lvl ≥ 3 | MAIN |
| resonance | Resonance | 4 | **global ×payout on every orbiter**: `resonanceMult()`=1+0.25×lvl (×1→×2); applied in each orbiter's `payout()`. Also lights the Lacuna glow (render.js), brightening faintly per level (costs [5000,10000,18000,30000]) | after grasp lvl ≥ 3 (alongside Gravitational Pull) | MAIN |
| dust | Dust Particle | 1 | **one-time** buy that creates the first dust orbiter (+10 base payout, ring 0); cost [100] | after touch lvl ≥ 2 | DUST PARTICLES |
| dustcount | Dust Particle Count | 4 | **+1** dust particle per level (particles 2–5; `count`=min(5, (dust≥1?1:0)+lvl(dustcount)), costs [500,1200,2500,4000]) | after dust lvl ≥ 1 | DUST PARTICLES |
| dustpay | Dust Particle Payout | 5 | **+10** to every dust particle's payout per level (`orbiterPayout`=10+10·lvl, costs [150,500,1200,2000,3000]) | after dust lvl ≥ 1 | DUST PARTICLES |
| dustspd | Dust Particle Speed | 5 | +20% per level; `dustSpeed()`=`0.82×(1+0.2×lvl)` → effective **82%→164%** (0.82 base factor, costs [200,600,1500,2500,4200]) | after dust lvl ≥ 1 | DUST PARTICLES |
| asteroid | Asteroid | 1 | a single asteroid orbiter (+50 base payout, own clump on ring 1); one-time buy (cost [1500]) | after dustcount lvl ≥ 1 (2nd dust particle) | ASTEROID |
| astpay | Asteroid Payout | 5 | **+50** to the asteroid's payout per level (`asteroidPayout`=(50+50·lvl)×comp, costs [1500,4500,10000,20000,36000]) | after asteroid lvl ≥ 1 | ASTEROID |
| astspd | Asteroid Speed | 5 | +20% per level; `asteroidSpeed()`=`0.88×(1+0.2×lvl)` → effective **88%→176%** (0.88 base factor, costs [2000,4500,9000,17000,30000]) | after asteroid lvl ≥ 1 | ASTEROID |
| astcomp | Asteroid Composition | 3 | **unique asteroid upgrade**: reforge Rock→Iron→Gold→Ice; recolors the asteroid (`ASTEROID_COMP.colors`) and ×payout [1,1.25,1.5,1.75] (`asteroidPayout` is rounded → integer; costs [3000,8000,18000]) | after asteroid lvl ≥ 1 | ASTEROID |
| moon | Moon | 1 | a single moon orbiter (+200 base payout, own clump on the widest ring 2); one-time buy (cost [8000]) | after asteroid lvl ≥ 1 | MOON |
| moonpay | Moon Payout | 5 | **+200** to the moon's payout per level (`moonPayout`=round((200+200·lvl)×moonPhaseMult×reso), costs [8000,18000,36000,70000,120000]) | after moon lvl ≥ 1 | MOON |
| moonspd | Moon Speed | 5 | +20% per level; `moonSpeed()`=`0.78×(1+0.2×lvl)` → effective **78%→156%** (0.78 base factor, costs [9000,18000,35000,60000,100000]) | after moon lvl ≥ 1 | MOON |
| moonphase | Lunar Phases | 4 | **unique moon upgrade**: couples payout to the moon's waxing/waning cycle. `moonPhaseMult()`=1+0.25·lvl·moonLit() → ×1 at new moon up to ×(1+0.25·lvl) at full moon (lvl 0 = ×1 always; visual cycle is cosmetic until bought). Costs [12000,25000,45000,75000] | after moon lvl ≥ 1 | MOON |
| charm | Comet Charm | 3 | comet windfall ×(1+0.25·lvl) (costs [30,80,200]) | **disabled** (`unlock:()=>false`) | COMETS |

`SECTION_ORDER` = `['MAIN','DUST PARTICLES','ASTEROID','MOON','COMETS']` — **one section per orbiter** (each becomes a tab eventually); MAIN holds the click upgrades + Gravitational Pull + Resonance. `buildPanels` renders each section as a
**multi-open accordion** (`.acc`): all sections open by default, each independently
collapsible (state in `sectionOpen`). A section with no shown cards is omitted.

> **Orbiters note:** dust particles share **one clump on ring 0** (the only orbiter with a
> **count** upgrade — `Dust Particle` creates the 1st, `Dust Particle Count` adds 4 more → 5 total);
> the asteroid is a **single body** on its own clump on ring 1
> (wider/slower, `PLANET_DEF[1]`); the moon is a **single body** on its own clump on the widest ring 2
> (`PLANET_DEF[2]`, slowest). All future orbiters are single bodies too. Each type has its
> own Payout (+amount/lvl) and Speed upgrade. The asteroid's unique upgrade is **Composition** (`astcomp`); the moon's is **Lunar Phases** (`moonphase`).
>
> **Component architecture:** each orbiter is a self-contained component in `orbiters/` that calls
> `registerOrbiter(...)`. `logic.js` (tick / orbit payout / **buy reconciles body count to `count()`** + float label), `render.js`
> (orbit rings + clumps), `ui.js` (combined All-Orbiters-Payout), `state.js` `loadGame` (rebuild bodies
> from levels), and the cosmic info cards all **iterate `ORBITERS`** — so adding an orbiter means adding
> a file in `orbiters/` (+ its upgrades in config.js + a body array/clump in state.js), not editing the
> engine. Each component exposes `list/clump/clumpPos/ring/hoverR/color/pebbleR/payout/speed/make/count/
> bodyUpgrade/rows/labels` (+ optional `avgPayout` for a phase-averaged display value, and `round` to
> draw as a phased disc — see `orbiters/registry.js` header). On any buy, `buyUpgrade` syncs the orbiter's
> body array to `count()` (push/pop), so both the "create first body" upgrade and a "+1 count" upgrade add bodies.

**Hide completed:** maxed upgrades are **shown by default** (greyed). A "Hide completed" toggle
(top-right, `#show-completed` — id kept; label is "Hide completed") hides them when checked.
`showCompleted` defaults **true**; the change handler sets `showCompleted = !checkbox.checked`.
The toggle is always present (no pop-in). `isShown(u)` returns maxed cards only when `showCompleted`;
the fingerprint `visibleSig()` includes max-state + the toggle so the panel rebuilds when an upgrade
maxes or the toggle flips. **Newly-unlocked cards** get a one-time **yellow double-flash** highlight
(`.upg-new`, CSS `@keyframes upg-flash`, ~0.9s, a yellow overlay that fades in/out twice then clears; an
`animationend` listener removes `.upg-new` so it returns to its default look): `seenUpg` tracks ids already
rendered; `firstPanelBuild` suppresses the flash for everything visible on the initial build (only mid-play unlocks animate).

Other mechanics:
- **Orbiters / payout**: three clumps (dust ring 0, asteroid ring 1, moon ring 2), rendered by the shared `drawClump()` helper (render.js).
  - **Dust** — `G.planets[]` (count = `dust`(0/1) + `dustcount`, capped 5), each `{localPhase,localR,localSpin,pulse,shape}`, travel as a clump on `G.clump{angle,nextTop}` (ring 0, period `PLANET_DEF[0].period`=6s). Speed = `(2π/period)×dustSpeed()`, `dustSpeed()`=`0.82 × dustspd.mult(lvl)` (mult=1+0.2×lvl) — a **0.82 base factor** (base speed reduced 18%) so effective speed runs **82% → 164%**. On top-cross each pays `orbiterPayout()` = `round((10 + 10·lvl(dustpay)) × resonanceMult())` (additive base × global Resonance; in orbiters/dust.js). Small grey pebbles (radius `PLANET_DEF[0].radius/3+2`), local orbit 5–12px.
  - **Asteroid** (single body) — `G.asteroids[]` (shape fields + a `motes` array), clump on `G.asteroidClump` (ring 1, period `PLANET_DEF[1].period`=9.5s). Speed = `asteroidSpeed()`=`0.88 × astspd.mult(lvl)` (**0.88 base factor**, base reduced 12% → effective 88% → 176%). On top-cross pays `asteroidPayout()` = `round((50 + 50·lvl(astpay)) × ASTEROID_COMP.mult[lvl(astcomp)] × resonanceMult())` (rounded → integer; in orbiters/asteroid.js). Bigger pebble, radius `(PLANET_DEF[1].radius/3+4)×1.5` (50% larger), local orbit 8–16px; **color = `asteroidColor()` = the current Composition tier** (`ASTEROID_COMP.colors`, Rock keeps `#7a6a55`). Carries 6 decorative **motes** — tiny specks that drift around it at all times (drawn in `drawClump` when `o.motes` exists; much smaller than a dust orbiter).
  - **Moon** (single body) — `G.moons[]`, clump on `G.moonClump` (ring 2, period `PLANET_DEF[2].period`=13s — the slowest). **Sits exactly on the orbit line** (`localR:0` — no local wobble, unlike dust/asteroid). Speed = `moonSpeed()`=`0.78 × moonspd.mult(lvl)` (**0.78 base factor** → effective 78% → 156%). On top-cross pays `moonPayout()` = `round((200 + 200·lvl(moonpay)) × moonPhaseMult() × resonanceMult())` (rounded → integer; in orbiters/moon.js). Largest body, radius `(PLANET_DEF[2].radius/3+6)×1.8`, color `#8f9498`. **Rendered by `drawRoundClump`/`drawMoonDisc` (render.js), not `drawClump`** (`o.round:true`): a smooth disc with a **lunar-phase terminator shadow** (`MOON_SHADOW` `#3b3f44`) that waxes/wanes on the `MOON_CYCLE`=24s loop (`moonPhase()`/`moonLit()` in orbiters/moon.js). The phase visual always runs once the moon exists; **Lunar Phases** (`moonphase`) makes it pay (see upgrade table). No motes.
  - Background is clear (no stars).
- **Lacuna click reaction** (`assets/click-effects/effects.js`): each harvest click briefly animates the Lacuna **core only** (the glow stays put). `CLICK_FX` is a registry of **6 Bounce variations** — uniform scale pops: `bouncePop`/`bounceSnap`/`bounceBig`/`bounceElastic`/`bounceDouble`/`bounceHeartbeat`. Each is a pure `fn(p, ctx)` of progress `p`=0→1 over its own `dur`, returning a transform `{dx,dy,sx,sy}` (offset + per-axis scale; the bounces only use `sx`/`sy`). `triggerClickFx(t,dirx,diry)` (called in `game.js canvasClick`, direction = away from the click) sets the start time + direction; `render.js` calls `clickFxTransform(t)` and draws the core as an **ellipse** (`CX+dx,CY+dy`, radii `sunR*sx`,`sunR*sy`) so squash/stretch works. **Each click rolls a uniformly-random effect** (`clickFxRandom` default true → `clickFxId = randomClickFxId()` in `canvasClick`; equal 1/6 chance, repeats allowed). The **debug panel** "Click FX" row can pin one (clears `clickFxRandom`) or restore Random; `assets/click-effects/preview.html` is an interactive gallery with the same Random + per-effect buttons. `effects.js` is pure (no game globals) so the game + preview share it; it loads **before render.js** in index.html.
- **Lacuna center**: drawn at radius **13** (was 26 — shrunk 50%, will grow later). **No glow by default**; an irregular warm glow appears only once **Resonance** is bought — **three soft radial blobs** at gently drifting (time-based) offsets overlap into a non-circular, living haze (radius `sunR*5.6`), center alpha `0.09 + 0.04×(lvl(resonance)-1)` (0.09 lvl 1 → 0.21 lvl 4). The drift + offset blobs avoid a too-perfect circle.
- **Cosmic info** (`ui/cosmo.js` + the orbiters registry): `cosmoTargetAt(x,y)` returns `'comet'` (within `COMET_HOVER_R`=40px), `'lacuna'` (22px), or an **orbiter id** by iterating `ORBITERS` (each entry's `clumpPos()`/`hoverR`). Orbiter card titles/rows/descriptions come from `ORBITER_BY_ID[id]`; the Lacuna card is built inline (`lacunaRows()` + `LACUNA_DESC`). The asteroid card includes a Composition (tier name) row.
- **Comet hover indicator**: hovering the comet shows a **targeting reticle** — a square drawn only at its corners (tactical-crosshair brackets, gently pulsing, `drawReticle()` in render.js, theme green-grey `rgba(60,80,70,…)`) — plus a small **"Comet"** label (`.cosmo-solo`, the follow tooltip). The comet is **never pinned**; clicking it catches it (the `mousedown` comet-catch check runs before the open-card check). The reticle is drawn in `render.js` using the `cosmoMx`/`cosmoOver` globals.
  - **Hover → `#cosmo-tip`:** a small tooltip that **follows the cursor** (flips off the right/bottom edge), `pointer-events:none`, transient (hides on mouse-out). Hidden whenever a card is pinned.
  - **Click → `#cosmo-card`:** clicking a body opens its full card **pinned in the center of the sky**, `pointer-events:auto`, **sticky** (stays until dismissed) with a **× button** (top-right) / **Escape** (`closeCosmoCard`). Clicking a body opens the card *instead of harvesting* (`mousedown` returns early on a target hit); **comets keep click priority** (a comet within 48px is caught first). The card is slightly bigger and slightly transparent (rgba bg).
  - **Content** (`ui/cosmo.js`): **Lacuna** — Diameter / Mass / Surface gravity / Escape velocity / Density + flavor line (`lacunaRows()` + `LACUNA_DESC`, inline here); **orbiters** — title/`rows()`/`desc` pulled from `ORBITER_BY_ID[id]` (defined in each `orbiters/*` component).
  - All numbers derive from `PHYS` (config.js) via `state.js` physics helpers. Display uses **`fmtNice`** (≤2 decimals, integer ≥100) with a chosen unit so values read cleanly — **surface gravity as “% of Earth”** (0.85%, = g/9.81), escape velocity in **m/s** (142); mass uses **`fmtSci`** (1.81 × 10¹⁹ kg). Orbital speed and orbits/hour **scale with the Dust Particle Speed upgrade** (via `dustSpeed()`). innerHTML only rewrites when content changes (`_html` cache on each element). Base model: Lacuna r=120 km, ρ=2.50 g/cm³ → M≈1.81×10¹⁹ kg, g≈0.85% of Earth, v_esc≈142 m/s; orbiter at r=200 km → v≈77.7 m/s, ≈0.22 orbits/hr (at base speed). Future science-based upgrades scale `PHYS` and everything recomputes.
- **Observatory stats** (`#stats-list`): Star Touch Value (always); **All Orbiters Payout** + **All Orbiters Payout / min** (both after first orbiter — the /min = `Σ n×payout×60×speed÷PLANET_DEF[ring].period`, i.e. payout × the clump's orbits per minute); **Comet Value** (after first comet, `G.cometSeen`); **Total Stardust Collected** (always, `G.runDust` — current-universe total; hover popup explains it resets on prestige); **Time on Current Universe** (`universeTime`). The All Orbiters Payout, Comet Value, and Total Stardust Collected rows (`.stat-pop-row`) show a hover popup (`.stat-pop`). (There is **no** "Stardust / min" stat and **no** rate line in the top HUD — both removed, along with the now-unused `G.income`/`incomeWindow` rolling-average machinery.) The DOM is built once per **row layout** (`buildStats`, keyed by `statsSig`) and values are updated in place each tick — so the hover popup doesn't flicker. Rows reset with the universe on prestige. **Display payout uses each orbiter's `avgPayout()` when present** (`(o.avgPayout||o.payout)()`) so the moon's phase-fluctuating payout shows a steady phase-averaged value in All Orbiters Payout / per-min / Comet Value — while actual orbit-cross earnings (logic.js) stay live/instantaneous.
- **No free orbiter**: game starts with `planets: []`; clicking is the only income until you buy a Dust Particle (count = `dust`(0/1) + `dustcount`). The click handler always earns.
- **Clicking**: clicking the canvas earns `clickValue()` (Star Touch + Star Grasp) and catches a nearby comet within 48px. **Holding** the mouse button auto-clicks **~3×/sec** (`holdTimer` interval 333ms in game.js; stops on mouseup/leave/blur).
- **Comet windfall**: every comet pays `round(10 × clickValue() + 1.25 × combined orbiter payout)`, combined = `Σ list.length×payout()` over `ORBITERS`; sets `G.cometSeen`. **Rounded** so the 1.25× never produces a fractional stardust amount. No charm factor while comet upgrades are disabled. First comet ~7–13s in (then `COMET_MIN_GAP`–`COMET_MAX_GAP`, 25–55s).
- **Number format**: `fmtNum` writes any number **< 100,000 in full, comma-grouped** (10000 → "10,000", whole — never a decimal); **6 figures+ abbreviate** as K/M/B/T, trailing zeros trimmed (100000 → "100K", 1e6 → "1M", 123456 → "123.46K"). The comet windfall and all orbiter payouts are rounded at the source so `G.dust` stays integral.
- **Upgrade cards** (`ui/panels.js updateCards`): the card vertically-centres the name|cost row (cost 15px, dominant); the **level indicator** (`.upg-level`, e.g. `2 / 5`) is absolutely pinned in the card's **bottom-right corner** (small/faint, out of flow so it doesn't push the cost). The hover description is a **single shared popup** (`#upg-pop`, slightly transparent) JS-positioned **to the left** of the hovered card (`showUpgPop`/`hideUpgPop` in panels.js wired via each card's `mouseenter`/`mouseleave`). It's `position:fixed` so it escapes the right column's overflow clip and hides nothing in the list (a card-child popup would be clipped, since `overflow-y:auto` forces `overflow-x:auto`). Accordion arrows (`.acc-arrow`) are 15px accent for a clear collapse affordance. **Maxed cards stay greyed even on hover** — only the *face* (`.upg-top` + `.upg-level`) is dimmed (`opacity:0.34`) plus a muted bg/border, **not** the whole card; so the popup keeps full opacity and isn't trapped behind sibling cards (the old whole-card `opacity:0.3` did both, which is why it used to glow-on-hover). The right column is **308px** wide (~20% wider than the original 256px).

## State object (G)
Key fields: `dust`, `runDust`, `totalDust`, `orbitsCompleted`, `taps`, `cometsCaught`, `cometSeen` (caught a comet this universe → gates Comet Value stat), `gameTime`, `universeTime` (current-universe timer; reset on prestige later), `upgrades{touch,grasp,gravpull,dust,dustcount,dustpay,dustspd,asteroid,astpay,astspd,astcomp,moon,moonpay,moonspd,moonphase,resonance,charm}`, `planets[]` (dust particles, ring 0) + `asteroids[]` (asteroids, ring 1) + `moons[]` (moon, ring 2) — each orbiter `{localPhase,localR,localSpin,pulse,shape}`, empty at start, rebuilt from `dust`/`asteroid`/`moon` levels on load, `clump{angle,nextTop}` + `asteroidClump{angle,nextTop}` + `moonClump{angle,nextTop}` (the three shared orbits), `comet`, `particles[]`, `floatingTexts[]`

## Sound system (`sound/`)
Split into: `core.js` (Web Audio engine — the shared `SND` state object, `audioBoot`, `tone`, `reverb`, volumes, mute), `effects/sfx.js` (`sfxTap`/`sfxOrbit`/`sfxComet`/`sfxBuy`), `music/tracks.js` (3 procedural tracks Celestial/Drift/Wane + loop scheduler), and `sound.js` (the `SoundSystem` facade everything calls). Internals are plain globals sharing the `SND` object — **not** an IIFE.
- `SoundSystem.boot()` — call on first user gesture (wired in game.js)
- `SoundSystem.startMusic()` / `setTrack(n)` — looping ambient music
- SFX: `sfxTap`, `sfxOrbit`, `sfxComet`, `sfxBuy`, `sfxComplete` (soft ascending chime played by `buyUpgrade` when an upgrade reaches max level; the normal `sfxBuy` blip plays otherwise)
- Mute button (#mute-btn) in header toggles master gain

## Save system
localStorage key: `around_the_cosmos_v1` (migrates an old `lacuna_v1` save on load). Saves every 20s and on tab close. Settings: `around_the_cosmos_settings_v1` (falls back to `lacuna_settings_v1`).

## Debug panel
URL: `?debug` (e.g. `localhost:3000?debug`)
Buttons to inject ✦ (100, 1K, 10K, 100K, 1M, 10M), set speed multiplier, force-spawn comets, **Auto Hold** (toggle: auto-clicks the canvas centre 3×/sec, like holding the mouse), reset. Draggable. Does NOT appear in normal play.

## Git workflow
- All changes → commit and push to `refine/v.1`
- Merge to `main` only after user explicitly confirms a feature is good
- Remote: https://github.com/Jason-Jisu-Lee/around-the-cosmos.git (repo renamed from `lacuna`)

## Progressive upgrade unlock
- Each upgrade in `config.js` has an `unlock: () => boolean`; the card shows only when it returns true.
- `ui.js` computes a `visibleSig()` fingerprint each frame; when it changes (a new upgrade unlocks), the panel rebuilds automatically — so newly-unlocked cards appear without manual `buildPanels()` calls.
- To gate an upgrade behind a milestone, set its `unlock` fn, e.g. `unlock: () => lvl('touch') >= 2`.
- **Buying an upgrade only rebuilds the panel if `visibleSig()` changed** (else `updateCards()` refreshes values in place). A full rebuild recreates every card element and would kill an in-progress "new upgrade" highlight on a sibling — so card-value changes (e.g. leveling Star Touch) must NOT rebuild. `resetPanelAnimations()` (panels.js) clears `seenUpg` on a universe reset (debug Reset, future prestige) so re-unlocked cards flash again — needed because no page reload happens.

## Vibe coding rules
- Don't change CFG balance numbers or upgrade costs without being asked
- Don't add TypeScript, build tools, or external dependencies
- Visual aesthetic: parchment/editorial (bg #f4f0e8, ink #1a1a1a, Georgia serif, flat/no-gradient shapes)
- User describes what they want in natural language; interpret generously
- After each change, push to `refine/v.1`
- Update this CLAUDE.md whenever the architecture, mechanics, or file structure changes
