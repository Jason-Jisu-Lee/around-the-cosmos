'use strict';

// ── Core constants ───────────────────────────────────────────────────────────
// Tunables and shared geometry. Upgrade definitions live in upgrades/upgrades.js;
// orbiter-specific data lives in orbiters/*.

const CFG = {
    SAVE_KEY:      'lacuna_v1',
    MAX_PLANETS:   8,
    COMET_MIN_GAP: 25,
    COMET_MAX_GAP: 55,
    COMET_LIFE:    8,
};

const PLANET_DEF = [];
for (let i = 0; i < CFG.MAX_PLANETS; i++) {
    PLANET_DEF.push({
        value:  Math.pow(3, i),
        period: 6 + 3.5 * i,
        radius: 7 + i * 1.4,
    });
}

const PLANET_COLORS = [
    '#4a6a8a', '#7a6040', '#7a4838', '#506840',
    '#6a5070', '#7a6030', '#387070', '#7a4060',
];

// Cosmic-flavor physical model (for hover tooltips). Lacuna is a small dark rocky
// body; everything else (gravity, escape velocity, orbital speed) is derived from
// these with real formulas. All displayed values are capped at 3 significant figures.
const PHYS = {
    G:                  6.674e-11, // gravitational constant (m³ kg⁻¹ s⁻²)
    lacunaRadius:       120e3,     // m — 120 km, a small dark body (will grow with upgrades)
    lacunaDensity:      2500,      // kg/m³ — rocky (2.50 g/cm³)
    orbitRadius:        200e3,     // m — the dust clump's real orbital radius (200 km, ring 0)
    asteroidOrbitRadius:400e3,     // m — the asteroid clump's wider orbit (400 km, ring 1)
};
