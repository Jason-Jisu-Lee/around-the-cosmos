# Lacuna

Celestial idle/incremental game. Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## What this game is
- Planets orbit a central sun, paying stardust (✦) on each completed orbit
- Click anywhere on the canvas to harvest stardust; catch comets for windfalls
- No free planets — click to earn, then buy your first planet (New Planet)
- Tone: calm, meditative, slightly melancholy — "lacuna" means a gap or void

> **Current scope (`refine/v.3` — minimal base, rebuilding step by step):** The game
> starts with **0 planets** — clicking is the only income; you buy the first planet.
> **Global upgrades** (main accordion tab): **Star Touch** (4 levels, costs [10,50,200,1000],
> click → 1/2/4/8/16) and **New Planet** (after first Star Touch, first costs 20).
> **Per-planet upgrades** (one tab per planet): **Orbit Payout** (×2/lvl) and **Orbit
> Speed** (+25%/lvl), both available the moment a planet is bought.
> **Comet Charm is disabled for now** (`unlock: () => false`); comets still pay windfalls.
> First Light removed. Prestige, remnants, moons, evolution, etc. are all out.

## File structure
Scripts load in this order — each file can reference globals from earlier files freely.

| File | Contents |
|---|---|
| `index.html` | Shell, header (centered stardust HUD), 3-column layout (left reserved, center canvas, right upgrades), floating draggable observatory |
| `style.css` | All styling — parchment theme (#f4f0e8 bg, Georgia serif, flat shapes) |
| `sound.js` | Web Audio API: procedural music (3 tracks) + SFX, mute toggle, volume control |
| `config.js` | CFG constants, PLANET_DEF, PLANET_COLORS, UPGRADES (global), PLANET_UPGRADES (per-planet), SECTION_ORDER |
| `state.js` | G object, createInitialState, formatters, upg/lvl/planetUpgDef accessors, orbitPayout, earn, save/load |
| `render.js` | canvas/ctx, resize, orbitR, planetPos, draw, burst |
| `logic.js` | tick, spawnComet, catchComet, buyUpgrade, buyPlanetUpgrade |
| `ui.js` | buildPanels, tabs (buildTabs/setActiveTab/buildPlanetTab), updateUI, visibility-signature unlock logic |
| `debug.js` | initDebug, tickWithDebug (speed mult), dust inject / spawn comet / reset |
| `game.js` | Main loop, input handlers, settings, draggable, audio boot, init |

No npm, no bundler, no TypeScript.

**Update this file whenever:** a new file is added, a mechanic changes, upgrade trees grow, state fields are added, CFG constants change, or the save key bumps.

## Key constants (CFG, top of config.js)
- MAX_PLANETS: 8
- COMET_MIN_GAP / COMET_MAX_GAP: 25–55s between comets
- COMET_LIFE: 8s on screen

## Upgrade tree (cost ✦)
| id | Name | Levels | Effect | Unlock | Section |
|---|---|---|---|---|---|
**Global upgrades** (`UPGRADES`, shown in the Main accordion tab):
| id | Name | Levels | Effect | Unlock | Section |
|---|---|---|---|---|---|
| touch | Star Touch | 4 | each click earns tapYield[lvl] = [1,2,4,8,16] ✦ (costs [10,50,200,1000]) | always | ACTIONS |
| planet | New Planet | 7 | adds a planet; planets == this level (costs [20,600,7000,…]) | after touch lvl ≥ 1 | PLANETS |
| charm | Comet Charm | 3 | comet windfall ×(1+0.25·lvl) (costs [30,80,200]) | **disabled** (`unlock:()=>false`) | COMETS |

**Per-planet upgrades** (`PLANET_UPGRADES`, shown in each planet's tab; levels stored per planet in `p.up`):
| id | Name | Levels | Effect | Cost(lvl) |
|---|---|---|---|---|
| payout | Orbit Payout | 5 | this planet's orbit payout ×2^lvl | 100·4^lvl |
| speed | Orbit Speed | 5 | this planet's orbit speed ×(1+0.25·lvl) | 120·4^lvl |

Each global upgrade carries a `section` string; `SECTION_ORDER` (config.js) sets display
order. `buildPanels` renders each section as a **multi-open accordion** (`.acc`):
all sections open by default, each independently collapsible (state in `sectionOpen`).
A section with no shown cards is omitted.

**Tabs:** the right panel is tabbed — `[Main]` (the accordion of global upgrades) plus one
`[P1] [P2]…` tab per planet (`PLANET_UPGRADES` for that planet). The tab bar is hidden
until the first planet exists. Switch via tab button or by **clicking a planet in the
orbit** (`setActiveTab` from the canvas click handler). `activeTab` = `'main'` or a planet
index; `buildTabs`/`buildPlanetTab` in ui.js. Eventually a dropdown when planets get many.

**Show completed:** maxed upgrades are hidden by default. A "Show completed" toggle
(top-right of the panel, `#show-completed`) reveals them; it only appears once
something has been maxed. `showCompleted` flag + `isShown(u)` drive this; the render
fingerprint `visibleSig()` includes max-state and the toggle so the panel rebuilds
when an upgrade maxes out or the toggle flips.

Other mechanics:
- **Orbit payout**: a planet pays `orbitPayout(idx)` when it crosses the **top of its orbit** (angle 3π/2, where sin = -1). Tracked per planet via `nextTop`. Base is `3^idx`, except the **first planet (idx 0) is a flat 5**, then ×`Orbit Payout` (2^lvl, per planet). Orbit angular speed = base `2π/period` × `Orbit Speed` (1+0.25·lvl, per planet).
- **No free planet**: game starts with `planets: []`; clicking is the only income until you buy New Planet (planets == New Planet level). The click handler always earns (no "needs a planet" guard).
- **Comet windfall**: the very first comet ever caught pays a flat **+10**. Every comet after pays `((sum of all planets' orbit payout) + 10 × click value) × charm bonus` (charm bonus is ×1 while Comet Charm is disabled).

## State object (G)
Key fields: `dust`, `runDust`, `totalDust`, `orbitsCompleted`, `taps`, `cometsCaught`, `gameTime`, `upgrades{touch,planet,charm}`, `planets[]` (each `{idx,angle,nextTop,pulse,up:{payout,speed}}`; empty at start; `up` levels persisted via `planetUp` in the save), `comet`, `incomeWindow[]`, `income`

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
