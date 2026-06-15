# Lacuna

A calm, celestial idle game. Planets orbit a sun and pay stardust (✦) on each
completed orbit. Click anywhere to harvest stardust, and catch comets for windfalls.
Spend stardust on **Star Touch** (stronger clicks) and **New Planet** (more orbits).

"Lacuna" means a gap or void. The tone is meditative, slightly melancholy.

## Run it

No build step, no dependencies — it's pure vanilla JS + Canvas. Serve the folder
over HTTP (the browser blocks audio/fetch from `file://`):

```bash
python -m http.server 3000
```

Then open `http://localhost:3000`.

## Debug mode

Add `?debug` to the URL for a draggable cheat panel (inject dust, speed multiplier,
force comets, reset). It does not appear in normal play.
