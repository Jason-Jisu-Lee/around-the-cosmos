'use strict';

function tick(dt) {
    G.gameTime += dt;

    for (const p of G.planets) {
        const def = PLANET_DEF[p.idx];
        const w   = (Math.PI*2 / def.period) * planetUpgDef('speed').mult(p.up.speed);
        p.angle += w*dt;
        if (p.angle >= p.nextTop) {        // crossed the top of the orbit → pay out
            p.nextTop += Math.PI*2;
            const pos = planetPos(p);
            earn(orbitPayout(p.idx), pos.x, pos.y-18);
            G.orbitsCompleted++; p.pulse = 1;
            SoundSystem.sfxOrbit();
        }
        if (p.angle > Math.PI*2) { p.angle -= Math.PI*2; p.nextTop -= Math.PI*2; }
        if (p.pulse > 0) p.pulse = Math.max(0, p.pulse-dt*2.2);
    }

    if (G.comet) {
        const c = G.comet;
        c.x += c.vx*dt; c.y += c.vy*dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > W+60 || c.y < -60 || c.y > H+60) {
            G.comet = null; G.cometTimer = randCometGap();
        }
    } else {
        G.cometTimer -= dt;
        if (G.cometTimer <= 0) spawnComet();
    }

    for (let i = G.particles.length-1; i >= 0; i--) {
        const pt = G.particles[i];
        pt.age+=dt; pt.x+=pt.vx*dt; pt.y+=pt.vy*dt;
        pt.vx *= 1-1.5*dt; pt.vy *= 1-1.5*dt;
        if (pt.age >= pt.maxAge) G.particles.splice(i,1);
    }

    for (let i = G.floatingTexts.length-1; i >= 0; i--) {
        const ft = G.floatingTexts[i];
        ft.age+=dt; ft.y -= dt*30;
        if (ft.age >= ft.maxAge) G.floatingTexts.splice(i,1);
    }

    const cutoff = G.gameTime - 5;
    while (G.incomeWindow.length && G.incomeWindow[0].t < cutoff) G.incomeWindow.shift();
    G.income = G.incomeWindow.reduce((s,x) => s+x.v, 0) / 5;
}

function spawnComet() {
    const side = Math.random()*4|0, r = Math.random();
    const x = side<2 ? (side?W+40:-40) : r*W;
    const y = side<2 ? r*H : (side===2?-40:H+40);
    const tx = CX+(Math.random()-0.5)*W*0.5, ty = CY+(Math.random()-0.5)*H*0.5;
    const dx = tx-x, dy = ty-y, d = Math.sqrt(dx*dx+dy*dy);
    const spd = Math.max(W,H) / CFG.COMET_LIFE * 1.1;
    G.comet = { x, y, vx:dx/d*spd, vy:dy/d*spd, life:CFG.COMET_LIFE };
}

function catchComet() {
    const c = G.comet;
    let windfall;
    if (G.cometsCaught === 0) {
        windfall = 10; // the very first comet always pays a flat +10 (and unlocks Comet Charm)
    } else {
        let combined = 0;
        for (const p of G.planets) combined += orbitPayout(p.idx);
        const clickVal = upg('touch').tapYield[lvl('touch')];
        windfall = (combined + 10 * clickVal) * upg('charm').bonus(lvl('charm'));
    }
    earn(windfall, c.x, c.y-20, true);
    G.cometsCaught++; SoundSystem.sfxComet();
    burst(c.x, c.y, 'rgba(60,80,70,', 26, 180);
    G.comet = null; G.cometTimer = randCometGap();
}

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost; G.upgrades[u.id]++;
    if (u.id === 'planet') G.planets.push(newPlanet(G.planets.length));
    SoundSystem.sfxBuy(); saveGame(); return true;
}

// Buy a per-planet upgrade (Orbit Payout / Orbit Speed) for a specific planet.
function buyPlanetUpgrade(pIdx, upId) {
    const p = G.planets[pIdx];
    if (!p) return false;
    const def = planetUpgDef(upId);
    const l = p.up[upId];
    if (l >= def.maxLevel) return false;
    const cost = def.cost(l);
    if (G.dust < cost) return false;
    G.dust -= cost; p.up[upId]++;
    SoundSystem.sfxBuy(); saveGame(); return true;
}
