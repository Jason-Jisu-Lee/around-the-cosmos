'use strict';

function tick(dt) {
    G.gameTime += dt;
    G.universeTime += dt;

    // The dust clump orbits as a group; all particles pay when the clump crosses the top.
    if (G.planets.length) {
        const w = (Math.PI*2 / PLANET_DEF[0].period) * dustSpeed();
        G.clump.angle += w*dt;
        if (G.clump.angle >= G.clump.nextTop) {
            G.clump.nextTop += Math.PI*2;
            const pos = clumpPos();
            earn(G.planets.length * orbiterPayout(), pos.x, pos.y-12);
            G.orbitsCompleted++;
            for (const o of G.planets) o.pulse = 1;
            SoundSystem.sfxOrbit();
        }
        if (G.clump.angle > Math.PI*2) { G.clump.angle -= Math.PI*2; G.clump.nextTop -= Math.PI*2; }
    }
    for (const o of G.planets) if (o.pulse > 0) o.pulse = Math.max(0, o.pulse-dt*2.2);

    // The asteroid clump orbits on the wider ring 1; pays when it crosses the top.
    if (G.asteroids.length) {
        const w = (Math.PI*2 / PLANET_DEF[1].period) * asteroidSpeed();
        G.asteroidClump.angle += w*dt;
        if (G.asteroidClump.angle >= G.asteroidClump.nextTop) {
            G.asteroidClump.nextTop += Math.PI*2;
            const pos = asteroidClumpPos();
            earn(G.asteroids.length * asteroidPayout(), pos.x, pos.y-12);
            G.orbitsCompleted++;
            for (const o of G.asteroids) o.pulse = 1;
            SoundSystem.sfxOrbit();
        }
        if (G.asteroidClump.angle > Math.PI*2) { G.asteroidClump.angle -= Math.PI*2; G.asteroidClump.nextTop -= Math.PI*2; }
    }
    for (const o of G.asteroids) if (o.pulse > 0) o.pulse = Math.max(0, o.pulse-dt*2.2);

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
    // Windfall = 10 clicks' worth + 1.25 × every orbiter's payout combined (dust + asteroids).
    const combined = G.planets.length * orbiterPayout() + G.asteroids.length * asteroidPayout();
    const windfall = 10 * upg('touch').tapYield[lvl('touch')] + 1.25 * combined;
    earn(windfall, c.x, c.y-20, true);
    G.cometsCaught++; G.cometSeen = true; SoundSystem.sfxComet();
    burst(c.x, c.y, 'rgba(60,80,70,', 26, 180);
    G.comet = null; G.cometTimer = randCometGap();
}

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost; G.upgrades[u.id]++;
    if (u.id === 'dust')     G.planets.push(newOrbiter());
    if (u.id === 'asteroid') G.asteroids.push(newAsteroid());
    if (['dust', 'dustpay', 'dustspd'].includes(u.id)) {
        const pos = clumpPos();
        const label = u.id === 'dust' ? '+1 Dust Particle'
                    : u.id === 'dustpay' ? '×2 Payout'
                    : '×1.2 Speed';
        G.floatingTexts.push({ x:pos.x, y:pos.y-20, text:label, age:0, maxAge:1.8, size:15 });
    } else if (['asteroid', 'astpay', 'astspd'].includes(u.id)) {
        const pos = G.asteroids.length ? asteroidClumpPos() : clumpPos();
        const label = u.id === 'asteroid' ? 'Asteroid'
                    : u.id === 'astpay' ? '×2 Payout'
                    : '×1.2 Speed';
        G.floatingTexts.push({ x:pos.x, y:pos.y-20, text:label, age:0, maxAge:1.8, size:15 });
    }
    SoundSystem.sfxBuy(); saveGame(); return true;
}
