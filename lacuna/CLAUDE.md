# Lacuna

Celestial idle/incremental game. Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## What this game is
- The **Lacuna** (small dark center) is orbited by **orbiters** that pay stardust (✦) each orbit
- Click anywhere on the canvas to harvest stardust; catch comets for windfalls
- No free orbiters — click to earn, then buy your first **Dust Particle**
- Tone: calm, meditative, slightly melancholy — "lacuna" means a gap or void

> **Current scope (`refine/v.3` — minimal base, rebuilding step by step):** The game
> starts with **0 orbiters** — clicking is the only income; you buy the first one.
> **ACTIONS:** **Star Touch** (4 levels, costs [10,50,200,1000], click → 1/2/4/8/16).
> **ORBITERS:** **Dust Particle** (after 2nd Star Touch; buy 3, costs [100,350,800], +10
> payout each — all share one orbit) and **Dust Particle Payout** (×2 all dust particles,
> 5 levels, costs [150,600,1500,3000,6000]) and **Dust Particle Speed** (clump orbit
> starts at 100% speed; each level adds +20% (×1.2), up to 200% at lvl 5, costs [200,500,1000,2000,4000]). **COMETS:** Comet Charm exists but is **disabled** (`unlock:()=>false`);
> comets still pay windfalls. Prestige, remnants, moons, evolution, etc. are all out.
> Earlier ideas removed: New Planet, per-planet Orbit Payout/Speed, the per-planet tab UI
> (will return once there are >5 orbiters), First Light.

## File structure
Scripts load in this order — each file can reference globals from earlier files freely.

| File | Contents |
|---|---|
| `index.html` | Shell, header (centered stardust HUD), 3-column layout (left reserved, center canvas, right upgrades), floating draggable observatory |
| `style.css` | All styling — parchment theme (#f4f0e8 bg, Georgia serif, flat shapes) |
| `sound.js` | Web Audio API: procedural music (3 tracks) + SFX, mute toggle, volume control |
| `config.js` | CFG constants, PLANET_DEF (ring radii/periods), PLANET_COLORS, **PHYS** (cosmic-flavor physical model), UPGRADES, SECTION_ORDER |
| `state.js` | G object, createInitialState, formatters (`fmtNum`/`fmtTime`/`sig3`/`fmtSci`), upg/lvl accessors, orbiterPayout, **cosmic physics helpers** (`lacunaMass`/`lacunaGravity`/`lacunaEscapeVel`/`orbiterVel`/`orbiterOrbitsPerHour`), newOrbiter, earn, save/load |
| `render.js` | canvas/ctx, resize, orbitR, clumpPos, draw (clear bg, Lacuna + dust clump), burst |
| `logic.js` | tick, spawnComet, catchComet, buyUpgrade |
| `ui.js` | buildPanels, updateCards, updateUI (+ observatory stats), visibility-signature unlock logic |
| `debug.js` | initDebug, tickWithDebug (speed mult), dust inject / spawn comet / reset |
| `game.js` | Main loop, input (click + hold-to-autoclick 2×/sec), **cosmic hover tooltip** (`updateCosmoTip`), settings, draggable, audio boot, init |

No npm, no bundler, no TypeScript.

**`PROGRESSION.md`** is a player/designer-facing reference of the early-game flow and the
full upgrade structure (levels, costs, effects, unlock order). Keep it in sync with
`config.js`/`state.js` whenever balance or upgrade structure changes.

**Update this file whenever:** a new file is added, a mechanic changes, upgrade trees grow, state fields are added, CFG constants change, or the save key bumps.

## Key constants (CFG, top of config.js)
- MAX_PLANETS: 8 (only used to size `PLANET_DEF` / the `orbitR` ring math; dust particles use ring 0)
- COMET_MIN_GAP / COMET_MAX_GAP: 25–55s between comets
- COMET_LIFE: 8s on screen

## Upgrade tree (cost ✦)
| id | Name | Levels | Effect | Unlock | Section |
|---|---|---|---|---|---|
| touch | Star Touch | 4 | each click earns tapYield[lvl] = [1,2,4,8,16] ✦ (costs [10,50,200,1000]) | always | ACTIONS |
| dust | Dust Particle | 3 | adds an orbiter (dust particle, +10 payout); count == this level (costs [100,350,800]) | after touch lvl ≥ 2 | ORBITERS |
| dustpay | Dust Particle Payout | 5 | ×2 every dust particle's payout per level → up to ×32 (`mult`=2^lvl, costs [150,600,1500,3000,6000]) | after dust lvl ≥ 1 | ORBITERS |
| dustspd | Dust Particle Speed | 5 | clump orbit speed: base 100%, +20% additive per lvl → 200% at lvl 5 (`mult`=1+0.2×lvl, costs [200,500,1000,2000,4000]) | after dust lvl ≥ 1 | ORBITERS |
| charm | Comet Charm | 3 | comet windfall ×(1+0.25·lvl) (costs [30,80,200]) | **disabled** (`unlock:()=>false`) | COMETS |

`SECTION_ORDER` = `['ACTIONS','ORBITERS','COMETS']`. `buildPanels` renders each section as a
**multi-open accordion** (`.acc`): all sections open by default, each independently
collapsible (state in `sectionOpen`). A section with no shown cards is omitted.

> **Orbiters note:** all dust particles share **one orbit (ring 0)** at the original
> first-planet radius. Per-orbiter upgrades (Orbit Payout/Speed) and the tab UI were
> removed; a single global **Dust Particle Payout** now scales all dust particles.
> A tabbed per-orbiter UI will return once there are >5 orbiters.

**Show completed:** maxed upgrades are hidden by default. A "Show completed" toggle
(top-right of the panel, `#show-completed`) reveals them; it only appears once
something has been maxed. `showCompleted` flag + `isShown(u)` drive this; the render
fingerprint `visibleSig()` includes max-state and the toggle so the panel rebuilds
when an upgrade maxes out or the toggle flips.

Other mechanics:
- **Orbiters / payout**: `G.planets[]` holds dust particles, each `{localPhase,localR,localSpin,pulse,shape}`. They travel as a **clump** along one shared orbit `G.clump{angle,nextTop}` (ring 0, base period `PLANET_DEF[0].period` = 6s). Clump angular speed = `(2π/period) × dustSpeed()`, where `dustSpeed()` = `dustspd.mult(lvl)` = `1 + 0.2×lvl` — base **100%**, up to **200%** at Dust Particle Speed lvl 5. Each particle also circles its own little orbit *within* the clump (`localPhase + t·localSpin` around `localR`, 5–12px). When the clump crosses the **top**, every particle pays `orbiterPayout()` = `10 × dustpay.mult(lvl)` (one combined `earn`). Rendered as small grey **irregular pebbles** (radius `PLANET_DEF[0].radius/3 + 2`) via each particle's `shape`. Background is clear (no stars).
- **Lacuna center**: drawn at radius **13** (was 26 — shrunk 50%, will grow later) with a faint warm haze.
- **Cosmic hover tooltips** (`#cosmo-tip`, built in `game.js`): hovering the **Lacuna** (within 22px of center) shows Diameter / Mass / Surface gravity / Escape velocity / Density + a fun gravity-vs-Earth note; hovering the **dust clump** (within 24px of `clumpPos()`) shows Orbit payout / Orbital speed / Orbits-per-hour. All numbers derive from `PHYS` in config.js via the `state.js` physics helpers and are formatted to **3 sig figs** (`sig3`, `fmtSci`). Orbital speed and orbits/hour **scale with the Dust Particle Speed upgrade** (via `dustSpeed()`), so buying Speed visibly raises them. The tooltip follows the cursor (flips off the right/bottom edge), is re-hit-tested every frame (so a moving clump leaves/enters under a static cursor), and only rewrites innerHTML when its content changes (`cosmoTip._html` cache). Base model: Lacuna r=120 km, ρ=2.50 g/cm³ → M≈1.81×10¹⁹ kg, g≈0.0839 m/s², v_esc≈0.142 km/s; orbiter at r=200 km → v≈77.7 m/s, ≈0.223 orbits/hr (at base speed). Future science-based upgrades scale `PHYS` and everything recomputes.
- **Observatory stats** (`#stats-list`): Star Touch Value (always); **All Orbiters Payout** (after first orbiter); **Stardust / min** (always, `G.income × 60`); **Comet Value** (after first comet, `G.cometSeen`); both All Orbiters Payout and Comet Value rows (`.stat-pop-row`) show a single-line formula popup (`.stat-pop`) on hover; **Time on Current Universe** (`universeTime`). The DOM is built once per **row layout** (`buildStats`, keyed by `statsSig`) and values are updated in place each tick — so the hover popup doesn't flicker. Rows reset with the universe on prestige.
- **No free orbiter**: game starts with `planets: []`; clicking is the only income until you buy a Dust Particle (count == `dust` level). The click handler always earns.
- **Clicking**: clicking the canvas earns the Star Touch value (and catches a nearby comet within 48px). **Holding** the mouse button auto-clicks ~2×/sec (`holdTimer`/`canvasClick` in game.js; stops on mouseup/leave/blur).
- **Comet windfall**: every comet pays `10 × click value + (orbiter count × orbiterPayout())`, and sets `G.cometSeen`. (At the very start this is 10.) No charm factor while comet upgrades are disabled. First comet appears ~7–13s in (then `COMET_MIN_GAP`–`COMET_MAX_GAP`, 25–55s).

## State object (G)
Key fields: `dust`, `runDust`, `totalDust`, `orbitsCompleted`, `taps`, `cometsCaught`, `cometSeen` (caught a comet this universe → gates Comet Value stat), `gameTime`, `universeTime` (current-universe timer; reset on prestige later), `upgrades{touch,dust,dustpay,dustspd,charm}`, `planets[]` (dust particles; each `{localPhase,localR,localSpin,pulse,shape}`; empty at start; rebuilt from `dust` level on load), `clump{angle,nextTop}` (the shared dust orbit), `comet`, `incomeWindow[]`, `income`

## Sound system (sound.js)
- `SoundSystem.boot()` — call on first user gesture (already wired in game.js)
- `SoundSystem.startMusic()` — starts looping ambient music; 3 tracks (Celestial/Drift/Wane)
- SFX: `sfxTap`, `sfxOrbit`, `sfxComet`, `sfxBuy`
- Mute button (#mute-btn) in header toggles master gain

## Save system
localStorage key: `lacuna_v1`. Saves every 20s and on tab close. Settings: `lacuna_settings_v1`.

## Debug panel
URL: `?debug` (e.g. `localhost:3000?debug`)
Buttons to inject ✦ (100, 1K, 10K, 100K, 1M, 10M), set speed multiplier, force-spawn comets, reset. Draggable. Does NOT appear in normal play.

## Git workflow
- All changes → commit and push to `refine/v.1`
- Merge to `main` only after user explicitly confirms a feature is good
- Remote: https://github.com/Jason-Jisu-Lee/lacuna.git

## Progressive upgrade unlock
- Each upgrade in `config.js` has an `unlock: () => boolean`; the card shows only when it returns true.
- `ui.js` computes a `visibleSig()` fingerprint each frame; when it changes (a new upgrade unlocks), the panel rebuilds automatically — so newly-unlocked cards appear without manual `buildPanels()` calls.
- To gate an upgrade behind a milestone, set its `unlock` fn, e.g. `unlock: () => lvl('touch') >= 2`.

## Vibe coding rules
- Don't change CFG balance numbers or upgrade costs without being asked
- Don't add TypeScript, build tools, or external dependencies
- Visual aesthetic: parchment/editorial (bg #f4f0e8, ink #1a1a1a, Georgia serif, flat/no-gradient shapes)
- User describes what they want in natural language; interpret generously
- After each change, push to `refine/v.1`
- Update this CLAUDE.md whenever the architecture, mechanics, or file structure changes
