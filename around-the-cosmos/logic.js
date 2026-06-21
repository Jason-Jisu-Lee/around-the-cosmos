'use strict';

const PULSE_INTERVAL = 3, PULSE_CLICKS = 12;   // Pulse upgrade: a heartbeat every 3s worth 12 clicks
let pulseTimer = 0;

function tick(dt) {
    G.gameTime += dt;
    G.universeTime += dt;

    // Pulse (auto-clicker): once owned, a slow heartbeat auto-harvests 12 clicks every 3s
    // (≈4 clicks/sec) and the Lacuna gives a gentle beat. Manual clicking is disabled (game.js).
    if (lvl('pulse') >= 1) {
        pulseTimer += dt;
        while (pulseTimer >= PULSE_INTERVAL) {
            pulseTimer -= PULSE_INTERVAL;
            earn(PULSE_CLICKS * clickValue(), CX, CY - 20);
            clickFxId = 'pulseBeat'; triggerClickFx(performance.now()/1000, 0, -1);
            SoundSystem.sfxTap();
        }
    }

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
}

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost; G.upgrades[u.id]++;
    // Let the matching orbiter component reconcile its body count to count() (handles both
    // the "create first body" upgrade and any "+1 count" upgrade) and float its label at its
    // clump — all per-orbiter behavior lives in orbiters/*.
    for (const o of ORBITERS) {
        if (o.labels && (u.id in o.labels)) {
            const arr = o.list(), want = o.count();
            while (arr.length < want) arr.push(o.make());
            while (arr.length > want) arr.pop();
            const pos = arr.length ? o.clumpPos() : clumpPos();
            const label = typeof o.labels[u.id] === 'function' ? o.labels[u.id]() : o.labels[u.id];
            G.floatingTexts.push({ x:pos.x, y:pos.y-20, text:label, age:0, maxAge:1.8, size:15 });
            break;
        }
    }
    // Completing an upgrade gets a distinct chime; otherwise the normal buy blip.
    if (G.upgrades[u.id] >= u.maxLevel) SoundSystem.sfxComplete(); else SoundSystem.sfxBuy();
    saveGame(); return true;
}
