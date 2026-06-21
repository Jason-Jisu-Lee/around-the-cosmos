# Debug Panel

**Activate:** add `?debug` to the URL. Panel appears bottom-left (draggable). Invisible without it.

| Button | Effect |
|---|---|
| `+ ✦ 1K / 100K / 10M` | Inject stardust |
| `Spawn Comet` | Force a comet immediately |
| `Reset` | Wipe save, restart |
| `Speed ×1/3/5/10/20` | Time multiplier |

## Before publishing
The panel only builds when `?debug` is in the URL, so it's already hidden in normal
play. To strip it entirely: delete `debug.js`, its `<script>` tag in `index.html`,
and change `tickWithDebug(dt)` → `tick(dt)` in `loop()` (main.js).
