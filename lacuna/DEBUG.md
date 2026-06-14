# Debug Panel

**Activate:** add `?debug` to the URL. Panel appears bottom-left. Invisible without it.

| Button | Effect |
|---|---|
| `+ ✦ 1K / 100K / 10M` | Inject stardust |
| `+ ✸ 10 / 100` | Inject remnants |
| `Spawn Comet` | Force a comet immediately |
| `Speed ×1/5/20` | Time multiplier |

## Before publishing
1. Delete the `// ─── DEBUG PANEL` block in `game.js`
2. Change `tickWithDebug(dt)` → `tick(dt)` in `loop()`
3. Delete this file
