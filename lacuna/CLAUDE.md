# Lacuna

Celestial idle/incremental game. Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## What this game is
- Planets orbit a central sun, paying stardust (✦) on each completed orbit
- Click anywhere inside the outermost orbit ring to harvest; catch comets for windfalls
- Buy upgrades to add planets, speed up orbits, boost payouts
- Prestige via "Collapse the Star" — earn Remnants (✸) for permanent upgrades
- Win condition: buy Ignite Supernova (costs 100M ✦)
- Tone: calm, meditative, slightly melancholy — "lacuna" means a gap or void

## File structure
- `index.html` — shell + 3-column layout (left: stats, center: canvas, right: upgrades)
- `style.css` — all styling (parchment/editorial theme: #f4f0e8 background, Georgia serif)
- `game.js` — game logic: state, upgrades, rendering, save/load, input, debug
- `sound.js` — procedural audio via Web Audio API (background music + SFX, no external files)
- No npm, no bundler, no TypeScript — just open index.html in a browser

**Update this file whenever:** a new file is added, a mechanic changes, upgrade trees grow, state fields are added, CFG constants change, or the save key bumps.

## Key constants (CFG, top of game.js)
- MAX_PLANETS: 8
- BASE_TAP_CD: 5s cooldown between planet taps
- SUPERNOVA_COST: 100,000,000 ✦
- COLLAPSE_UNIT: 50,000 (remnants = floor(sqrt(runDust / 50K)))

## Upgrade trees

**Run upgrades** (reset on collapse, cost ✦):
| id | Name | Levels | Effect |
|---|---|---|---|
| planet | New Planet | 7 | adds orbit slot |
| velocity | Orbit Velocity | 12 | speed × (1 + 0.12×lvl) |
| radiance | Stellar Radiance | 12 | payout × 2^lvl |
| touch | Star Touch | 10 | tap yield = (0.5 + 0.25×lvl) × orbit value |
| hands | Quick Hands | 10 | tap CD = max(1, 5 − 0.4×lvl) |
| charm | Comet Charm | 5 | comet bonus × (1+lvl), shorter gaps |
| supernova | Ignite Supernova | 1 | win condition |

**Remnant upgrades** (permanent, cost ✸):
| id | Name | Levels | Effect |
|---|---|---|---|
| ancient | Ancient Light | 20 | +25% all stardust per level |
| memory | Gravitational Memory | 5 | begin each run with +lvl planets |
| dilation | Time Dilation | 10 | +15% orbit speed forever per level |
| moons | Moonrise | 8 | innermost N planets get moon (×2 payout) |
| horizon | Event Horizon | 10 | accretes lvl×2% of orbit rate passively |

## State object (G in game.js)
Key fields: `dust`, `runDust`, `totalDust`, `remnants`, `collapses`, `upgrades{}`, `remnantUpgrades{}`, `planets[]`, `comet`, `incomeWindow[]`, `income`

## Sound system (sound.js)
- `SoundSystem.boot()` — call on first user gesture (already wired in game.js)
- `SoundSystem.startMusic()` — starts looping ambient pentatonic music
- SFX: `sfxTap`, `sfxOrbit`, `sfxComet`, `sfxBuy`, `sfxCollapse`, `sfxSupernova`
- Mute button (#mute-btn) in header toggles master gain

## Save system
localStorage key: `lacuna_v1`. Saves every 20s and on tab close.

## Debug panel
URL: `?debug` (e.g. `localhost:3000?debug`)
Gives buttons to inject ✦/✸, set speed multiplier, and force-spawn comets.
Does NOT appear in normal play.

## Git workflow
- All changes → commit and push to `refine/v.1`
- Merge to `main` only after user explicitly confirms a feature is good
- Remote: https://github.com/Jason-Jisu-Lee/lacuna.git

## Vibe coding rules
- Don't change CFG balance numbers or upgrade costs without being asked
- Don't add TypeScript, build tools, or external dependencies
- Visual aesthetic: parchment/editorial (bg #f4f0e8, ink #1a1a1a, Georgia serif, flat/no-gradient shapes)
- User describes what they want in natural language; interpret generously
- After each change, push to `refine/v.1`
- Update this CLAUDE.md whenever the architecture, mechanics, or file structure changes
