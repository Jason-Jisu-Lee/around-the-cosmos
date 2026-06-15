'use strict';

// ─── GAME LOOP TICK ───────────────────────────────────────────────────────────

function tick(dt) {
    G.gameTime += dt;
    const speed = orbitSpeed();

    // Orbit planets
    for (const p of G.planets) {
        const def = PLANET_DEF[p.idx];
        const w   = (Math.PI * 2 / def.period) * speed;
        p.angle += w * dt;
        p.spun  += w * dt;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;

        if (p.spun >= Math.PI * 2) {
            p.spun -= Math.PI * 2;
            const pos = planetPos(p);
            earn(orbitPayout(p.idx), pos.x, pos.y - 18);
            G.orbitsCompleted++;
            p.pulse = 1;
            SoundSystem.sfxOrbit();
        }

        if (p.cd > 0) p.cd = Math.max(0, p.cd - dt);
        if (p.pulse > 0) p.pulse = Math.max(0, p.pulse - dt * 2.2);
    }

    // Event Horizon accretion drip
    const hLvl = rlvl('horizon');
    if (hLvl > 0) {
        G.accretionBuf   += orbitRate() * rupg('horizon').rate(hLvl) * dt;
        G.accretionFlush += dt;
        if (G.accretionFlush >= 0.5 && G.accretionBuf > 0) {
            earn(G.accretionBuf);
            G.accretionBuf = 0;
            G.accretionFlush = 0;
        }
    }

    // Comet lifecycle
    if (G.comet) {
        const c = G.comet;
        c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt;
        if (c.life <= 0 || c.x < -60 || c.x > W + 60 || c.y < -60 || c.y > H + 60) {
            G.comet = null;
            G.cometTimer = randCometGap(lvl('charm'));
        }
    } else {
        G.cometTimer -= dt;
        if (G.cometTimer <= 0) spawnComet();
    }

    // Particles
    for (let i = G.particles.length - 1; i >= 0; i--) {
        const pt = G.particles[i];
        pt.age += dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        pt.vx *= 1 - 1.5 * dt; pt.vy *= 1 - 1.5 * dt;
        if (pt.age >= pt.maxAge) G.particles.splice(i, 1);
    }

    // Floating texts
    for (let i = G.floatingTexts.length - 1; i >= 0; i--) {
        const ft = G.floatingTexts[i];
        ft.age += dt; ft.y -= dt * 30;
        if (ft.age >= ft.maxAge) G.floatingTexts.splice(i, 1);
    }

    // Rolling income (5s window)
    const cutoff = G.gameTime - 5;
    while (G.incomeWindow.length && G.incomeWindow[0].t < cutoff) G.incomeWindow.shift();
    G.income = G.incomeWindow.reduce((s, x) => s + x.v, 0) / 5;
}

// ─── COMET ───────────────────────────────────────────────────────────────────

function spawnComet() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if      (side === 0) { x = -40;    y = Math.random() * H; }
    else if (side === 1) { x = W + 40; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = -40; }
    else                 { x = Math.random() * W; y = H + 40; }
    const tx = CX + (Math.random() - 0.5) * W * 0.5;
    const ty = CY + (Math.random() - 0.5) * H * 0.5;
    const dx = tx - x, dy = ty - y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    const spd = Math.max(W, H) / CFG.COMET_LIFE * 1.1;
    G.comet = { x, y, vx: dx / d * spd, vy: dy / d * spd, life: CFG.COMET_LIFE };
}

function catchComet() {
    const c = G.comet;
    const windfall = Math.max(25, G.income * 45) * upg('charm').bonus(lvl('charm')) * globalMult();
    earn(windfall, c.x, c.y - 20, true);
    G.cometsCaught++;
    SoundSystem.sfxComet();
    burst(c.x, c.y, 'rgba(60,80,70,', 26, 180);
    G.comet = null;
    G.cometTimer = randCometGap(lvl('charm'));
}

// ─── UPGRADES ────────────────────────────────────────────────────────────────

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost;
    G.upgrades[u.id]++;
    if (u.id === 'planet') G.planets.push(newPlanet(G.planets.length));
    if (u.id === 'supernova') triggerSupernova();
    else SoundSystem.sfxBuy();
    saveGame();
    return true;
}

function buyRemnantUpgrade(u) {
    const l = G.remnantUpgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.remnants < cost) return false;
    G.remnants -= cost;
    G.remnantUpgrades[u.id]++;
    SoundSystem.sfxBuy();
    saveGame();
    return true;
}

// ─── PRESTIGE ────────────────────────────────────────────────────────────────

function collapse() {
    const gain = collapseGain();
    if (gain < 1) return;
    if (!confirm(`Collapse the star?\n\nYou will gain ✸${gain} Remnant${gain > 1 ? 's' : ''}.\nPlanets, stardust and run upgrades reset.\nRemnant upgrades are permanent.`)) return;

    G.remnants += gain; G.collapses++;
    G.dust = 0; G.runDust = 0;
    G.upgrades = { planet: 0, velocity: 0, radiance: 0, touch: 0, hands: 0, charm: 0, supernova: 0 };

    const startPlanets = Math.min(CFG.MAX_PLANETS, 1 + rlvl('memory'));
    G.upgrades.planet = startPlanets - 1;
    G.planets = [];
    for (let i = 0; i < startPlanets; i++) G.planets.push(newPlanet(i));

    G.comet = null; G.cometTimer = randCometGap(0);
    G.incomeWindow = []; G.income = 0;

    SoundSystem.sfxCollapse();
    burst(CX, CY, 'rgba(90,70,110,', 90, 360);
    burst(CX, CY, 'rgba(100,80,50,', 50, 200);
    G.floatingTexts.push({ x: CX, y: CY - 70, text: `+✸${gain}`, age: 0, maxAge: 2.2, size: 30 });

    saveGame();
    buildPanels();
}

function triggerSupernova() {
    SoundSystem.sfxSupernova();
    burst(CX, CY, 'rgba(244,240,232,', 120, 420);
    burst(CX, CY, 'rgba(100,80,50,',  80,  260);
    if (!G.sawSupernova) {
        G.sawSupernova = true;
        document.getElementById('supernova-overlay').classList.add('show');
    }
}
