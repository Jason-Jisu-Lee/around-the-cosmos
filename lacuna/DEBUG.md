# Debug Panel

## How to activate
Add `?debug` to the URL:
- Live server: `http://localhost:3000?debug`
- File open: `file:///C:/Users/idfor/lacuna/index.html?debug`

A small teal panel appears in the **bottom-left corner** of the screen.
It is completely invisible in normal play (no `?debug` = no panel, no overhead).

## What the buttons do

| Button | Effect |
|---|---|
| `+ ✦ 1K` | Add 1,000 stardust instantly |
| `+ ✦ 100K` | Add 100,000 stardust |
| `+ ✦ 10M` | Add 10,000,000 stardust (enough to test Supernova) |
| `+ ✸ 10` | Add 10 Remnants (for testing remnant upgrades) |
| `+ ✸ 100` | Add 100 Remnants |
| `Spawn Comet` | Forces a comet to appear immediately |
| `Speed ×1` | Normal speed |
| `Speed ×5` | 5× time — fast orbit testing |
| `Speed ×20` | 20× time — test prestige math quickly |

## Before publishing / sharing publicly

Remove the debug code from `game.js`. Search for this comment block and delete everything between it and the INIT section:

```
// ─── DEBUG PANEL (only active when URL contains ?debug) ───
```

Delete from that line down to (but not including):

```
// ─── INIT ────────────────────────────────────
```

Also change this line in the `loop` function:
```js
tickWithDebug(dt);   // ← change back to:
tick(dt);
```

Then delete this file and you're clean.

## Checklist before publishing
- [ ] Removed debug block from `game.js`
- [ ] Restored `tick(dt)` in `loop()`
- [ ] Deleted `DEBUG.md`
- [ ] Deleted `package.json` (or keep it, it's harmless)
- [ ] Test with the production URL — confirm no panel appears
