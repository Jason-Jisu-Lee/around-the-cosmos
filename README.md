# Around the Cosmos

A calm, celestial **idle / incremental** game. A small dark **Lacuna** sits at the
centre; **orbiters** circle it and pay **stardust (✦)** every time they complete an
orbit. Click anywhere to harvest stardust by hand, and catch **comets** for windfalls.

> "Lacuna" means a gap or void. The tone is meditative, slightly melancholy.

Pure **vanilla JS + Canvas** — no build step, no framework, no dependencies.

## Play / run it

The game lives in [`around-the-cosmos/`](around-the-cosmos/). Serve that folder over HTTP (browsers block
audio from `file://`):

```bash
cd around-the-cosmos
python -m http.server 3000
```

Then open `http://localhost:3000`.

## The loop

1. **Click** the sky to earn stardust (buy **Star Touch** for more per click).
2. Buy **Dust Particles** — small orbiters that pay on every orbit.
3. Unlock the **Asteroid**, then payout/speed/composition upgrades for each orbiter.
4. **Gravitational Pull** ties clicks to your orbiter income; **Resonance** boosts all
   orbiters and lights the Lacuna's glow.
5. Catch **comets** for bursts of stardust.

Hover the Lacuna or an orbiter for its real-physics stats; click for a pinned card.

## Debug mode

Add `?debug` to the URL for a draggable panel (inject dust, speed multiplier, force
comets, reset). It never appears in normal play.

## Project docs

- [`around-the-cosmos/CLAUDE.md`](around-the-cosmos/CLAUDE.md) — architecture & mechanics reference.
- [`around-the-cosmos/PROGRESSION.md`](around-the-cosmos/PROGRESSION.md) — early-game flow & full upgrade tree.
