# Around the Cosmos

An idle/incremental game. A dark center (the Lacuna) is orbited by bodies — dust
particles, an asteroid, a moon — that pay stardust (✦) each time they complete an
orbit. Click to earn stardust, spend it on upgrades, and catch comets for extra.

Vanilla JS + Canvas. No build step, no framework, no dependencies.

## Run it

The game is in `around-the-cosmos/`. Serve that folder over HTTP (browsers block audio on `file://`):

```bash
cd around-the-cosmos
python -m http.server 3000
```

Then open http://localhost:3000.

## How it works

1. Click the sky to earn stardust. Buy Star Touch to earn more per click.
2. Buy Dust Particles — orbiters that pay on every orbit.
3. Unlock the Asteroid and the Moon, plus payout/speed upgrades for each.
4. Gravitational Pull adds a share of your orbiter income to every click. Resonance boosts all orbiter payout.
5. Pulse auto-clicks for you once Star Touch is maxed.
6. Catch comets for bursts of stardust.

Hover a body for its stats; click it to pin a card.

## Debug

Add `?debug` to the URL for a panel (inject stardust, speed multiplier, force comets, reset). It doesn't appear in normal play.

## Docs

- `around-the-cosmos/CLAUDE.md` — architecture and mechanics.
- `around-the-cosmos/PROGRESSION.md` — early-game flow and the full upgrade tree.
