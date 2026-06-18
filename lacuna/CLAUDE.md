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
> **ORBITERS:** **Dust Particle** (after 2nd Star Touch; buy 3, costs [100,200,500], +5
> payout each — all share one orbit) and **Dust Particle Payout** (×2 all dust particles,
> 4 levels, costs [300,1200,4800,19200], after the first dust particle). **COMETS:** Comet Charm exists but is **disabled** (`unlock:()=>false`);
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
| `config.js` | CFG constants, PLANET_DEF (ring radii/periods), PLANET_COLORS, UPGRADES, SECTION_ORDER |
| `state.js` | G object, createInitialState, formatters, upg/lvl accessors, orbiterPayout, newOrbiter, earn, save/load |
| `render.js` | canvas/ctx, resize, orbitR, clumpPos, draw (clear bg, Lacuna + dust clump), burst |
| `logic.js` | tick, spawnComet, catchComet, buyUpgrade |
| `ui.js` | buildPanels, updateCards, updateUI (+ observatory stats), visibility-signature unlock logic |
| `debug.js` | initDebug, tickWithDebug (speed mult), dust inject / spawn comet / reset |
| `game.js` | Main loop, input (click + hold-to-autoclick 2×/sec), settings, draggable, audio boot, init |

No npm, no bundler, no TypeScript.

**Update this file whenever:** a new file is added, a mechanic changes, upgrade trees grow, state fields are added, CFG constants change, or the save key bumps.

## Key constants (CFG, top of config.js)
- MAX_PLANETS: 8 (only used to size `PLANET_DEF` / the `orbitR` ring math; dust particles use ring 0)
- COMET_MIN_GAP / COMET_MAX_GAP: 25–55s between comets
- COMET_LIFE: 8s on screen

## Upgrade tree (cost ✦)
| id | Name | Levels | Effect | Unlock | Section |
|---|---|---|---|---|---|
| touch | Star Touch | 4 | each click earns tapYield[lvl] = [1,2,4,8,16] ✦ (costs [10,50,200,1000]) | always | ACTIONS |
| dust | Dust Particle | 3 | adds an orbiter (dust particle, +5 payout); count == this level (costs [100,200,500]) | after touch lvl ≥ 2 | ORBITERS |
| dustpay | Dust Particle Payout | 4 | ×2 every dust particle's payout per level → up to ×16 (`mult`=2^lvl, costs [300,1200,4800,19200]) | after dust lvl ≥ 1 | ORBITERS |
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
- **Orbiters / payout**: `G.planets[]` holds dust particles, each `{localPhase,localR,localSpin,pulse,shape}`. They travel as a **clump** along one shared orbit `G.clump{angle,nextTop}` (ring 0, period `PLANET_DEF[0].period` = 6s), and each particle also circles its own little orbit *within* the clump (`localPhase + t·localSpin` around `localR`). When the clump crosses the **top**, every particle pays `orbiterPayout()` = `5 × dustpay.mult(lvl)` (one combined `earn`). Rendered as grey **irregular pebbles** (per-particle `size` 5–12px) via each particle's `shape`. Background is clear (no stars).
- **Lacuna center**: drawn at radius **13** (was 26 — shrunk 50%, will grow later) with a faint warm haze.
- **Observatory stats** (`#stats-list`, rebuilt each UI tick): Star Touch Value (always); **All Orbiters Payout** + **All Orbiters Payout / min** (only after the first orbiter); **Comet Value** (only after the first comet, `G.cometSeen`; hover shows the formula in a themed popup `.stat-pop`); **Time on Current Universe** (`universeTime`). The orbiter/comet rows reset naturally on prestige (planets cleared, `cometSeen`/`universeTime` reset later).
- **No free orbiter**: game starts with `planets: []`; clicking is the only income until you buy a Dust Particle (count == `dust` level). The click handler always earns.
- **Clicking**: clicking the canvas earns the Star Touch value (and catches a nearby comet within 48px). **Holding** the mouse button auto-clicks ~2×/sec (`holdTimer`/`canvasClick` in game.js; stops on mouseup/leave/blur).
- **Comet windfall**: every comet pays `10 × click value + (orbiter count × orbiterPayout())`, and sets `G.cometSeen`. (At the very start this is 10.) No charm factor while comet upgrades are disabled. First comet appears ~14–20s in (then `COMET_MIN_GAP`–`COMET_MAX_GAP`, 25–55s).

## State object (G)
Key fields: `dust`, `runDust`, `totalDust`, `orbitsCompleted`, `taps`, `cometsCaught`, `cometSeen` (caught a comet this universe → gates Comet Value stat), `gameTime`, `universeTime` (current-universe timer; reset on prestige later), `upgrades{touch,dust,dustpay,charm}`, `planets[]` (dust particles; each `{localPhase,localR,localSpin,pulse,shape}`; empty at start; rebuilt from `dust` level on load), `clump{angle,nextTop}` (the shared dust orbit), `comet`, `incomeWindow[]`, `income`

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
