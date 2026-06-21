'use strict';



const CFG = {
    SAVE_KEY:      'around_the_cosmos_v1',
    MAX_PLANETS:   8,
    COMET_MIN_GAP: 25,
    COMET_MAX_GAP: 55,
    COMET_LIFE:    8,
};


const PLANET_DEF = [];
for (let i = 0; i < CFG.MAX_PLANETS; i++) {
    PLANET_DEF.push({
        period: 6 + 3.5 * i,
        radius: 7 + i * 1.4,
    });
}


const PHYS = {
    G:                  6.674e-11,
    lacunaRadius:       120e3,
    lacunaDensity:      2500,
    orbitRadius:        200e3,
    asteroidOrbitRadius:400e3,
    moonOrbitRadius:    600e3,
};
