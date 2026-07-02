'use strict';

function randCometGap() {
    const meteor = (typeof meteorShowerMult === 'function') ? meteorShowerMult() : 1;   // asteroid Meteor Shower identity: comets sooner
    return (CFG.COMET_MIN_GAP + Math.random()*(CFG.COMET_MAX_GAP-CFG.COMET_MIN_GAP)) * cometShowerMult() * meteor;
}

const COMET_SPEEDS = [1.0, 1.5, 2.0];
const cometFx = [];

// No two events overlap. Each event checks this before spawning (its own flag is still off then).
function anyEventActive() {
    return !!G.comet
        || (typeof VTX !== 'undefined' && VTX.active)
        || (typeof BIGROCK !== 'undefined' && BIGROCK.active);
}

const AFTERGLOW_DUR = 60;
let afterglowUntil = -1;
function afterglowActive() { return lvl('afterglow') > 0 && gameClock < afterglowUntil; }
function afterglowFrac()   { return Math.max(0, (afterglowUntil - gameClock) / AFTERGLOW_DUR); }

function spawnComet() {
    const WW = innerWidth, HH = innerHeight;
    const side = Math.random()*4|0, r = Math.random();
    const x = side<2 ? (side?WW+40:-40) : r*WW;
    const y = side<2 ? r*HH : (side===2?-40:HH+40);
    const L = mawScreen();
    const tx = L.x + (Math.random()-0.5)*WW*0.4, ty = L.y + (Math.random()-0.5)*HH*0.4;
    const dx = tx-x, dy = ty-y, d = Math.hypot(dx,dy) || 1;
    const speedMult = COMET_SPEEDS[Math.random()*COMET_SPEEDS.length|0];
    const spd = Math.max(WW,HH) / CFG.COMET_LIFE * 1.1 * speedMult;
    G.comet = { x, y, vx:dx/d*spd, vy:dy/d*spd, life:CFG.COMET_LIFE, speedMult };

    // The first comet ever also summons the first vortex ever ~30s later (tutorial pacing) -
    // instead of the usual first-vortex wait of ~5-6 min. tutSeen.comet/.vortex double as the
    // persistent "has ever appeared" markers (set by their tutorials in ui/tutorial.js).
    if (G.tutSeen && !G.tutSeen.comet && !G.tutSeen.vortex && typeof vortexTimer !== 'undefined')
        vortexTimer = 30;
}

function catchComet() {
    const c = G.comet;
    let combined = 0;
    for (const o of ORBITERS) combined += o.list().length * o.payout();
    const prospector = (typeof prospectorCometMult === 'function') ? prospectorCometMult() : 1;   // asteroid Prospector's Cut identity
    const windfall = Math.round((10 * pulseValue() + combined) * (c.speedMult || 1) * brighterTailsMult() * prospector);
    earn(windfall);
    cometFx.push({ x:c.x, y:c.y, text:'+✦'+fmtNum(windfall), age:0, maxAge:1.5 });
    G.cometsCaught++; G.cometSeen = true; SoundSystem.sfxComet();
    afterglowUntil = gameClock + AFTERGLOW_DUR;   // Afterglow: arm/refresh the per-pulse bonus window
    G.comet = null; G.cometTimer = randCometGap();
}

function cometTick(dt) {
    for (let i = cometFx.length-1; i >= 0; i--) {
        cometFx[i].age += dt;
        if (cometFx[i].age >= cometFx[i].maxAge) cometFx.splice(i, 1);
    }
    if (G.comet) {
        const c = G.comet;
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > innerWidth+60 || c.y < -60 || c.y > innerHeight+60) {
            G.comet = null; G.cometTimer = randCometGap();
        }
    } else {
        G.cometTimer -= dt;
        if (G.cometTimer <= 0 && !anyEventActive()) spawnComet();
    }
}
