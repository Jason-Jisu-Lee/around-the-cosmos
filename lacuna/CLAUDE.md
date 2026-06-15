# Lacuna

Celestial idle/incremental game. Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## What this game is
- Planets orbit a central sun, paying stardust (✦) on each completed orbit
- Click anywhere on the canvas to harvest stardust; catch comets for windfalls
- Buy upgrades (Star Touch → New Planet) to grow output
- Tone: calm, meditative, slightly melancholy — "lacuna" means a gap or void

> **Current scope (being rebuilt step by step):** Only Star Touch + New Planet
> upgrades and the comet windfall are live. Prestige (collapse/remnants/supernova),
> the extra run upgrades (velocity/radiance/hands/charm), remnant upgrades, moons,
> event horizon, tap-cooldown, and the debug "Full View" have been **removed**.
> They'll be reintroduced deliberately, one feature at a time.

## File structure
Scripts load in this order — each file can reference globals from earlier files freely.

| File | Contents |
|---|---|
| `index.html` | Shell, header (centered stardust HUD), 3-column layout (left reserved, center canvas, right upgrades), floating draggable observatory |
| `style.css` | All styling — parchment theme (#f4f0e8 bg, Georgia serif, flat shapes) |
| `sound.js` | Web Audio API: procedural music (3 tracks) + SFX, mute toggle, volume control |
| `config.js` | CFG constants, PLANET_DEF, PLANET_COLORS, UPGRADES (pure data) |
| `state.js` | G object, createInitialState, formatters, upg/lvl accessors, orbitPayout, earn, save/load |
| `render.js` | canvas/ctx, resize, orbitR, planetPos, draw, burst |
| `logic.js` | tick, spawnComet, catchComet, buyUpgrade |
| `ui.js` | buildPanels, updateCards, updateUI, visibility-signature unlock logic (upgradeVisible) |
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
| touch | Star Touch | 3 | each click earns tapYield[lvl] = [1,2,4,6] ✦ (costs [20,100,150]) | always | main |
| firstlight | First Light | 3 | innermost planet payout ×(1+lvl) → up to ×4 (costs [30,90,250]) | after touch lvl ≥ 1 | main |
| planet | New Planet | 7 | adds an orbit slot (costs [200,600,7000,…]) | after touch lvl ≥ 2 | main |
| charm | Comet Charm | 3 | comet windfall ×(1+0.25·lvl) (costs [30,80,200]) | after 1st comet caught | COMETS |

Upgrades may carry an optional `section` string; `buildPanels` renders main (no
section) first, then each distinct section under its own `.panel-title` heading.

Other mechanics:
- **Orbit payout**: a planet pays `orbitPayout(idx)` when it crosses the **top of its orbit** (angle 3π/2, where sin = -1). Tracked per planet via `nextTop`. Base value is `3^idx`; `firstlight` multiplies the innermost planet (idx 0). Orbit speed fixed by `period`.
- **Comet windfall**: the very first comet ever caught pays a flat **+10** (and unlocks Comet Charm). Every comet after pays `((sum of all planets' orbit payout) + 10 × click value) × charm bonus`.

## State object (G)
Key fields: `dust`, `runDust`, `totalDust`, `orbitsCompleted`, `taps`, `cometsCaught`, `gameTime`, `upgrades{touch,firstlight,planet,charm}`, `planets[]` (each `{idx,angle,nextTop,pulse}`), `comet`, `incomeWindow[]`, `income`

## Sound system (sound.js)
- `SoundSystem.boot()` — call on first user gesture (already wired in game.js)
- `SoundSystem.startMusic()` — starts looping ambient music; 3 tracks (Celestial/Drift/Wane)
- SFX: `sfxTap`, `sfxOrbit`, `sfxComet`, `sfxBuy`
- Mute button (#mute-btn) in header toggles master gain

## Save system
localStorage key: `lacuna_v1`. Saves every 20s and on tab close. Settings: `lacuna_settings_v1`.

## Debug panel
URL: `?debug` (e.g. `localhost:3000?debug`)
Buttons to inject ✦, set speed multiplier, force-spawn comets, reset. Draggable. Does NOT appear in normal play.

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
