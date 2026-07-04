'use strict';

const CFG = {
    SAVE_KEY:      'around_the_cosmos_v1',
    MAX_PLANETS:   8,
    COMET_MIN_GAP: 20,
    COMET_MAX_GAP: 30,
    COMET_LIFE:    8,
};

const PLANET_DEF = [];
for (let i = 0; i < CFG.MAX_PLANETS; i++) {
    PLANET_DEF.push({
        period: 6 + 3.5 * i,
        radius: 7 + i * 1.4,
    });
}

