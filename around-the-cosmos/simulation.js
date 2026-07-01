'use strict';

const PULSE_INTERVAL = 1;
let pulseTimer = 0;
let breathCount = 0;

function tick(dt) {
    G.gameTime += dt;
    G.universeTime += dt;

    if (lvl('touch') >= 1) {
        pulseTimer += dt;
        while (pulseTimer >= PULSE_INTERVAL) {
            pulseTimer -= PULSE_INTERVAL;
            breathCount++;
            const n = deepBreathInterval();
            const deep = n > 0 && (breathCount % n === 0);
            const glow = afterglowActive() ? 20 * lvl('afterglow') : 0;   // +20/lvl per pulse for 60s after a comet
            const ferro = (typeof ferroPulseBonus === 'function') ? ferroPulseBonus() : 0;   // asteroid identity: flat +/pulse, added AFTER pulseValue (no feedback with Gravitational Pull)
            const spring = (typeof springTideBonus === 'function') ? springTideBonus() : 0;  // moon Spring Tide identity: +/pulse, strongest at the full moon
            earn((deep ? Math.round(pulseValue() * deepBreathMult()) : pulseValue()) + glow + ferro + spring, CX, CY - 20);
            if (ferro > 0 && G.asteroids.length) ferroPulseFlash = gameClock;   // magnetic field-line arcs asteroid<->Maw
            if (typeof storedWinterBankPulse === 'function') storedWinterBankPulse(pulseValue());   // dwarf Stored Winter: bank a share
            clickFxId = deep ? 'deepBreath' : 'pulseBeat';
            triggerClickFx(gameClock, 0, -1);
            if (deep) { deepBreathFlash = gameClock; SoundSystem.sfxDeepBreath(); }
            else      SoundSystem.sfxPulse();
        }
    }

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
                if (o.onOrbit) o.onOrbit();
                SoundSystem.sfxOrbit();
            }
            if (clump.angle > Math.PI*2) { clump.angle -= Math.PI*2; clump.nextTop -= Math.PI*2; }
            if (o.onTick) o.onTick(dt);
        }
        for (const b of bodies) if (b.pulse > 0) b.pulse = Math.max(0, b.pulse-dt*2.2);
    }

    cometTick(dt);
    vortexTick(dt);

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

let buyLog = [];   // session purchase history (id + cost paid) for the debug "Undo last purchase"

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    if (u.group && typeof identityLockedBy === 'function' && identityLockedBy(u)) return false;   // identity: another path already chosen this universe
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost; G.upgrades[u.id]++;
    if (u.id === 'moon') G.moonEverOwned = true;

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

    buyLog.push({ id: u.id, cost });
    if (G.upgrades[u.id] >= u.maxLevel) SoundSystem.sfxComplete(); else SoundSystem.sfxBuy();
    saveGame(); return true;
}

// Reconcile every orbiter's body array to its current level (used by buy + undo).
function reconcileBodies() {
    for (const o of ORBITERS) {
        const arr = o.list(), want = o.count();
        while (arr.length < want) arr.push(o.make());
        while (arr.length > want) arr.pop();
    }
}

// Undo the last purchase made this session: refund the cost, drop the level, resync bodies + panel.
// Repeatable back to the session start. (Debug aid for testing upgrades one by one.)
function undoLastBuy() {
    const last = buyLog.pop();
    if (!last) return false;
    if ((G.upgrades[last.id] || 0) > 0) { G.upgrades[last.id]--; G.dust += last.cost; }
    reconcileBodies();
    saveGame();
    if (typeof buildPanels === 'function') buildPanels();
    return true;
}
