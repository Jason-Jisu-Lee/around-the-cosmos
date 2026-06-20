'use strict';

function tick(dt) {
    G.gameTime += dt;
    G.universeTime += dt;

    // Each orbiter clump orbits as a group and pays when it crosses the top. The
    // per-orbiter specifics (ring, speed, payout, position) come from orbiters/*.
    for (const o of ORBITERS) {
        const bodies = o.list();
        if (bodies.length) {
            const clump = o.clump();
            const w = (Math.PI*2 / PLANET_DEF[o.ring].period) * o.speed();
            clump.angle += w*dt;
            if (clump.angle >= clump.nextTop) {
                clump.nextTop += Math.PI*2;
                const pos = o.clumpPos();
                earn(bodies.length * o.payout(), pos.x, pos.y-12);
                G.orbitsCompleted++;
                for (const b of bodies) b.pulse = 1;
                SoundSystem.sfxOrbit();
            }
            if (clump.angle > Math.PI*2) { clump.angle -= Math.PI*2; clump.nextTop -= Math.PI*2; }
        }
        for (const b of bodies) if (b.pulse > 0) b.pulse = Math.max(0, b.pulse-dt*2.2);
    }

    cometTick(dt);   // comet movement / spawning (see comet/comet.js)

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

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost; G.upgrades[u.id]++;
    // Let the matching orbiter component add a body (if this upgrade adds one) and
    // float its label at its clump — all per-orbiter behavior lives in orbiters/*.
    for (const o of ORBITERS) {
        if (o.labels && (u.id in o.labels)) {
            if (o.bodyUpgrade === u.id) o.list().push(o.make());
            const pos = o.list().length ? o.clumpPos() : clumpPos();
            const label = typeof o.labels[u.id] === 'function' ? o.labels[u.id]() : o.labels[u.id];
            G.floatingTexts.push({ x:pos.x, y:pos.y-20, text:label, age:0, maxAge:1.8, size:15 });
            break;
        }
    }
    // Completing an upgrade gets a distinct chime; otherwise the normal buy blip.
    if (G.upgrades[u.id] >= u.maxLevel) SoundSystem.sfxComplete(); else SoundSystem.sfxBuy();
    saveGame(); return true;
}
