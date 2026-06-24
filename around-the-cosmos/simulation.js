'use strict';

const PULSE_INTERVAL = 1;   // the Lacuna auto-generates stardust every second (no clicking)
let pulseTimer = 0;

function tick(dt) {
    G.gameTime += dt;
    G.universeTime += dt;

    // Core income: once Cosmic Pulse is owned, the Lacuna pulses every PULSE_INTERVAL seconds,
    // earning pulseValue(), bouncing gently (pulseBeat), and giving a soft non-intrusive tick.
    if (lvl('touch') >= 1) {
        pulseTimer += dt;
        while (pulseTimer >= PULSE_INTERVAL) {
            pulseTimer -= PULSE_INTERVAL;
            earn(pulseValue(), CX, CY - 20);
            clickFxId = 'pulseBeat'; triggerClickFx(gameClock, 0, -1);   // same clock draw() uses
            SoundSystem.sfxPulse();
        }
    }


    for (const o of ORBITERS) {
        const bodies = o.list();
        if (bodies.length) {
            const clump = o.clump();
            const w = (Math.PI*2 / PLANET_DEF[o.ring].period) * o.speed();
            clump.angle += w*dt;
            if (clump.angle >= clump.nextTop) {
                clump.nextTop += Math.PI*2;   // pay once per revolution, at the top of the orbit (every orbiter)
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

    cometTick(dt);

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
    if (u.id === 'moon') G.moonEverOwned = true;   // permanent milestone: unlocks the Hide-completed toggle

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

    if (G.upgrades[u.id] >= u.maxLevel) SoundSystem.sfxComplete(); else SoundSystem.sfxBuy();
    saveGame(); return true;
}
