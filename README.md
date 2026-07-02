# Around the Cosmos

A calm idle/incremental game by **2ndIntelligentWorld**.

A small dark center — the **Maw** — generates stardust (✦) with every slow pulse.
Orbiters circle it and pay each time they complete an orbit. Universes collapse,
and begin again.

Pure vanilla JS + Canvas. No build step, no framework, no dependencies.

## Run it

The game is in `around-the-cosmos/`. Serve that folder over HTTP (browsers restrict audio and fetch on `file://`):

```bash
cd around-the-cosmos
python -m http.server 3000
```

Then open http://localhost:3000 and press START.

## The loop

1. **Cosmic Pulse** makes the Maw generate stardust every second. This is an idle game, not a clicker — clicking never harvests.
2. Buy orbiters: the **dust particle** swarm, the **Asteroid**, the **Moon**, and later the **Dwarf Planet** "Ember". Each has payout/speed upgrades plus a unique mechanic (Composition, Lunar Phases, Trojan Companions...).
3. Every orbiter has **5 identity upgrades — pick 2 per universe** (hold to choose). They reset on Accretion, so every universe plays differently.
4. Stay a little active: sweep up **stray stardust**, click **comets** (and rare 8-comet **swarms**), and hold down the **vortex** before it steals your stardust.
5. **Accrete**: collapse the universe into **Mass**, spend it on permanent upgrades, and capture new orbiters along the **Singularity** line.

The published demo ends at the "Finish Demo" gate on the Mass page; the full game is headed to Steam under the same title.

## Repo layout

- `around-the-cosmos/` — the game. `index.html` + plain script files; see `CLAUDE.md` in that folder for the full architecture and `PROGRESSION.md` for the upgrade tree.
- Branches: `main` is current, `stable/v.N` are frozen known-good snapshots, `playtest/*` / `feature/*` are working branches.

## Debug

Add `?debug` to the URL for a panel: inject stardust, speed multiplier, force-spawn comets / swarms / the vortex / stray stardust, identity granters, undo, reset. It never appears in normal play.

## Credits

Music: "lolurio Free Sci-fi Music" (free asset). Everything else by 2ndIntelligentWorld.
