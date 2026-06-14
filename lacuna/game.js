'use strict';

// ════════════════════════════════════════════════════════════════════════════
//  LACUNA — a one-hour celestial incremental.
//  Planets pay stardust each completed orbit. Tap planets to harvest early.
//  Catch comets for windfalls. Collapse the star for Remnants and permanent
//  power. Buy the Supernova to finish the arc.
// ════════════════════════════════════════════════════════════════════════════

const CFG = {
    SAVE_KEY: 'lacuna_v1',
    MAX_PLANETS: 8,
    BASE_TAP_CD: 5,            // seconds before a planet can be tapped again
    COMET_MIN_GAP: 25,         // seconds between comet chances
    COMET_MAX_GAP: 55,
    COMET_LIFE: 8,             // seconds a comet stays on screen
    SUPERNOVA_COST: 100e6,
    COLLAPSE_UNIT: 5e4,        // remnants = floor(sqrt(runDust / this))
};

// Per-planet definition (index 0 = innermost)
const PLANET_DEF = [];
for (let i = 0; i < CFG.MAX_PLANETS; i++) {
    PLANET_DEF.push({
        value: Math.pow(3, i),          // stardust per completed orbit
        period: 6 + 3.5 * i,            // seconds per orbit at base speed
        radius: 7 + i * 1.4,            // visual size
    });
}
const PLANET_COLORS = [
    ['#cfe8ff', '#5a8fc0'], ['#ffe2b8', '#c08a40'], ['#ffc9b0', '#c05838'],
    ['#d6f5c0', '#6aa050'], ['#e6ccff', '#8a5ac0'], ['#fff0b0', '#c0a040'],
    ['#c0f0f0', '#4898a8'], ['#ffc8e0', '#b04878'],
];

// ─── RUN UPGRADES (reset on collapse) ────────────────────────────────────────

const UPGRADES = [
    {
        id: 'planet', name: 'New Planet', maxLevel: 7,
        costs: [10, 60, 350, 2000, 12000, 80000, 500000],
        desc: lvl => `${lvl + 1} planet${lvl > 0 ? 's' : ''} in orbit`,
    },
    {
        id: 'velocity', name: 'Orbit Velocity', maxLevel: 12,
        costs: Array.from({ length: 12 }, (_, i) => Math.round(25 * Math.pow(3, i))),
        speed: lvl => 1 + 0.12 * lvl,
        desc: lvl => lvl === 0 ? '+12% orbit speed per level' : `+${lvl * 12}% orbit speed`,
    },
    {
        id: 'radiance', name: 'Stellar Radiance', maxLevel: 12,
        costs: Array.from({ length: 12 }, (_, i) => Math.round(50 * Math.pow(3, i))),
        mult: lvl => Math.pow(2, lvl),
        desc: lvl => `${fmtNum(Math.pow(2, lvl))}× orbit payout`,
    },
    {
        id: 'touch', name: 'Star Touch', maxLevel: 10,
        costs: Array.from({ length: 10 }, (_, i) => Math.round(15 * Math.pow(3, i))),
        yield: lvl => 0.5 + 0.25 * lvl,
        desc: lvl => `Tap harvest pays ${Math.round((0.5 + 0.25 * lvl) * 100)}% of orbit value`,
    },
    {
        id: 'hands', name: 'Quick Hands', maxLevel: 10,
        costs: Array.from({ length: 10 }, (_, i) => Math.round(20 * Math.pow(3, i))),
        cd: lvl => Math.max(1, CFG.BASE_TAP_CD - 0.4 * lvl),
        desc: lvl => `Tap cooldown ${Math.max(1, CFG.BASE_TAP_CD - 0.4 * lvl).toFixed(1)}s`,
    },
    {
        id: 'charm', name: 'Comet Charm', maxLevel: 5,
        costs: [500, 5000, 50000, 500000, 5000000],
        bonus: lvl => 1 + lvl,
        desc: lvl => lvl === 0 ? 'Comets visit more often, pay more' : `Comet windfall ×${1 + lvl}, visits ${Math.round((1 - Math.pow(0.88, lvl)) * 100)}% sooner`,
    },
    {
        id: 'supernova', name: 'Ignite Supernova', maxLevel: 1, special: true,
        costs: [CFG.SUPERNOVA_COST],
        desc: lvl => lvl === 0
            ? 'Let the star become light. The end of the beginning.'
            : 'The remnant glows — all payouts doubled.',
    },
];

// ─── REMNANT UPGRADES (permanent, bought with ✸) ─────────────────────────────

const REMNANT_UPGRADES = [
    {
        id: 'ancient', name: 'Ancient Light', maxLevel: 20,
        costs: Array.from({ length: 20 }, (_, i) => i + 1),
        mult: lvl => 1 + 0.25 * lvl,
        desc: lvl => lvl === 0 ? '+25% all stardust per level' : `+${lvl * 25}% all stardust, forever`,
    },
    {
        id: 'memory', name: 'Gravitational Memory', maxLevel: 5,
        costs: [2, 5, 12, 25, 50],
        desc: lvl => lvl === 0 ? 'Begin each run with extra planets' : `Begin with ${lvl + 1} planets`,
    },
    {
        id: 'dilation', name: 'Time Dilation', maxLevel: 10,
        costs: [1, 3, 6, 10, 15, 21, 28, 36, 45, 55],
        speed: lvl => 1 + 0.15 * lvl,
        desc: lvl => lvl === 0 ? '+15% orbit speed per level, forever' : `+${lvl * 15}% orbit speed, forever`,
    },
    {
        id: 'moons', name: 'Moonrise', maxLevel: 8,
        costs: [3, 7, 14, 26, 45, 70, 100, 140],
        desc: lvl => lvl === 0
            ? 'Give planets moons that double their payout'
            : `Innermost ${lvl} planet${lvl > 1 ? 's' : ''} carry moons (×2 payout)`,
    },
    {
        id: 'horizon', name: 'Event Horizon', maxLevel: 10,
        costs: [5, 12, 24, 42, 66, 96, 130, 170, 215, 265],
        rate: lvl => 0.02 * lvl,
        desc: lvl => lvl === 0
            ? 'A hidden singularity sips stardust passively'
            : `Accretes ${lvl * 2}% of orbit rate, continuously`,
    },
];

// ─── STATE ───────────────────────────────────────────────────────────────────

let G = createInitialState();

function createInitialState() {
    return {
        dust: 0,
        runDust: 0,              // earned this run — sets collapse reward
        totalDust: 0,            // lifetime
        remnants: 0,
        collapses: 0,
        orbitsCompleted: 0,
        taps: 0,
        cometsCaught: 0,
        gameTime: 0,
        upgrades: { planet: 0, velocity: 0, radiance: 0, touch: 0, hands: 0, charm: 0, supernova: 0 },
        remnantUpgrades: { ancient: 0, memory: 0, dilation: 0, moons: 0, horizon: 0 },
        planets: [newPlanet(0)],
        comet: null,
        cometTimer: randCometGap(0),
        accretionBuf: 0,
        accretionFlush: 0,
        particles: [],
        floatingTexts: [],
        incomeWindow: [],
        income: 0,
        sawSupernova: false,
    };
}

function newPlanet(i) {
    return {
        idx: i,
        angle: Math.random() * Math.PI * 2,
        spun: 0,
        cd: 0,
        pulse: 0,
    };
}

function randCometGap(charmLvl) {
    const f = Math.pow(0.88, charmLvl);
    return (CFG.COMET_MIN_GAP + Math.random() * (CFG.COMET_MAX_GAP - CFG.COMET_MIN_GAP)) * f;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 ? (Math.round(n * 10) / 10).toString() : Math.round(n).toString();
    if (n < 1e6)  return (n / 1e3).toFixed(2) + 'K';
    if (n < 1e9)  return (n / 1e6).toFixed(2) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
    return (n / 1e12).toFixed(2) + 'T';
}

function fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${String(s).padStart(2, '0')}s`;
}

function upg(id) { return UPGRADES.find(u => u.id === id); }
function lvl(id) { return G.upgrades[id]; }
function rupg(id) { return REMNANT_UPGRADES.find(u => u.id === id); }
function rlvl(id) { return G.remnantUpgrades[id]; }

function snMult() { return lvl('supernova') > 0 ? 2 : 1; }
function globalMult() { return rupg('ancient').mult(rlvl('ancient')) * snMult(); }
function orbitSpeed() { return upg('velocity').speed(lvl('velocity')) * rupg('dilation').speed(rlvl('dilation')); }
function hasMoon(planetIdx) { return planetIdx < rlvl('moons'); }

function orbitPayout(planetIdx) {
    return PLANET_DEF[planetIdx].value
        * upg('radiance').mult(lvl('radiance'))
        * (hasMoon(planetIdx) ? 2 : 1)
        * globalMult();
}

// Sum of payout/period across owned planets — the board's raw ✦/s
function orbitRate() {
    let r = 0;
    for (const p of G.planets) r += orbitPayout(p.idx) / PLANET_DEF[p.idx].period;
    return r * orbitSpeed();
}

function earn(amount, x, y, big) {
    G.dust += amount;
    G.runDust += amount;
    G.totalDust += amount;
    G.incomeWindow.push({ t: G.gameTime, v: amount });
    if (x !== undefined) {
        G.floatingTexts.push({
            x, y, text: '+✦' + fmtNum(amount),
            age: 0, maxAge: big ? 1.6 : 1.1,
            size: big ? 22 : 14,
        });
    }
}

// ─── PRESTIGE ────────────────────────────────────────────────────────────────

function collapseGain() {
    return Math.floor(Math.sqrt(G.runDust / CFG.COLLAPSE_UNIT));
}

function collapse() {
    const gain = collapseGain();
    if (gain < 1) return;
    if (!confirm(`Collapse the star?\n\nYou will gain ✸${gain} Remnant${gain > 1 ? 's' : ''}.\nPlanets, stardust and run upgrades reset.\nRemnant upgrades are permanent.`)) return;

    G.remnants += gain;
    G.collapses++;
    G.dust = 0;
    G.runDust = 0;
    G.upgrades = { planet: 0, velocity: 0, radiance: 0, touch: 0, hands: 0, charm: 0, supernova: 0 };

    // Gravitational Memory: begin with extra planets
    const startPlanets = Math.min(CFG.MAX_PLANETS, 1 + rlvl('memory'));
    G.upgrades.planet = startPlanets - 1;
    G.planets = [];
    for (let i = 0; i < startPlanets; i++) G.planets.push(newPlanet(i));

    G.comet = null;
    G.cometTimer = randCometGap(0);
    G.incomeWindow = [];
    G.income = 0;

    // Implosion-then-burst ceremony
    burst(CX, CY, 'rgba(176,122,224,', 90, 360);
    burst(CX, CY, 'rgba(245,201,106,', 50, 200);
    G.floatingTexts.push({
        x: CX, y: CY - 70, text: `+✸${gain}`,
        age: 0, maxAge: 2.2, size: 30,
    });

    saveGame();
    buildPanels();
}

function buyRemnantUpgrade(u) {
    const l = G.remnantUpgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.remnants < cost) return false;
    G.remnants -= cost;
    G.remnantUpgrades[u.id]++;
    // Moonrise / memory take effect immediately where possible
    saveGame();
    return true;
}

// ─── CANVAS / LAYOUT ─────────────────────────────────────────────────────────

const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

let W = 0, H = 0, CX = 0, CY = 0, MAXR = 0;
let stars = [];

function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2;
    CY = H / 2;
    MAXR = Math.min(W, H) / 2 - 36;

    stars = [];
    const n = Math.round((W * H) / 6000);
    for (let i = 0; i < n; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.3 + 0.3,
            a: Math.random() * 0.5 + 0.15,
            ph: Math.random() * Math.PI * 2,
            tw: 0.4 + Math.random() * 1.2,
        });
    }
}

function orbitR(i) {
    return MAXR * (i + 1.9) / (CFG.MAX_PLANETS + 1.9);
}

function planetPos(p) {
    const r = orbitR(p.idx);
    return { x: CX + Math.cos(p.angle) * r, y: CY + Math.sin(p.angle) * r };
}

// ─── DRAWING ─────────────────────────────────────────────────────────────────

function draw(t) {
    ctx.fillStyle = '#06070d';
    ctx.fillRect(0, 0, W, H);

    // Stars (twinkling)
    for (const s of stars) {
        const a = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216,222,240,${a})`;
        ctx.fill();
    }

    // Orbit rings
    for (let i = 0; i < G.planets.length; i++) {
        ctx.beginPath();
        ctx.arc(CX, CY, orbitR(i), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(110,120,160,0.13)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    if (G.planets.length < CFG.MAX_PLANETS) {
        ctx.beginPath();
        ctx.arc(CX, CY, orbitR(G.planets.length), 0, Math.PI * 2);
        ctx.setLineDash([3, 9]);
        ctx.strokeStyle = 'rgba(110,120,160,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Sun — pulsing layered glow
    const pulse = 1 + 0.04 * Math.sin(t * 1.8);
    const sunR = 26 * pulse;
    let g = ctx.createRadialGradient(CX, CY, 0, CX, CY, sunR * 4.2);
    g.addColorStop(0, 'rgba(245,201,106,0.32)');
    g.addColorStop(0.4, 'rgba(245,170,80,0.10)');
    g.addColorStop(1, 'rgba(245,170,80,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, sunR * 4.2, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Event Horizon — violet accretion ring behind the sun
    if (rlvl('horizon') > 0) {
        const hr = sunR * 1.9;
        const wob = 1 + 0.06 * Math.sin(t * 3.1);
        ctx.beginPath();
        ctx.arc(CX, CY, hr * wob, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(176,122,224,${0.25 + 0.12 * Math.sin(t * 2.2)})`;
        ctx.lineWidth = 3 + rlvl('horizon') * 0.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CX, CY, hr * 1.25 * wob, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(176,122,224,0.10)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    g = ctx.createRadialGradient(CX - sunR * 0.25, CY - sunR * 0.25, 0, CX, CY, sunR);
    g.addColorStop(0, '#fff6dc');
    g.addColorStop(0.55, '#f5c96a');
    g.addColorStop(1, '#d08a30');
    ctx.beginPath();
    ctx.arc(CX, CY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Planets
    for (const p of G.planets) {
        const def = PLANET_DEF[p.idx];
        const pos = planetPos(p);
        const r = orbitR(p.idx);
        const [light, dark] = PLANET_COLORS[p.idx];

        // Motion trail
        ctx.beginPath();
        ctx.arc(CX, CY, r, p.angle - 0.55, p.angle);
        ctx.strokeStyle = 'rgba(216,222,240,0.10)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Harvest pulse ring
        if (p.pulse > 0) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.radius + 6 + (1 - p.pulse) * 26, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(245,201,106,${p.pulse * 0.7})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Planet body
        const dim = p.cd > 0 ? 0.45 : 1;
        ctx.globalAlpha = dim;
        const pg = ctx.createRadialGradient(
            pos.x - def.radius * 0.4, pos.y - def.radius * 0.4, 0,
            pos.x, pos.y, def.radius
        );
        pg.addColorStop(0, light);
        pg.addColorStop(1, dark);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, def.radius, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Moon (Moonrise remnant upgrade)
        if (hasMoon(p.idx)) {
            const ma = t * 2.6 + p.idx * 1.7;
            const mr = def.radius + 8;
            const mx = pos.x + Math.cos(ma) * mr;
            const my = pos.y + Math.sin(ma) * mr;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            const mg = ctx.createRadialGradient(mx - 1, my - 1, 0, mx, my, 3);
            mg.addColorStop(0, '#e8e8f0');
            mg.addColorStop(1, '#888898');
            ctx.fillStyle = mg;
            ctx.fill();
        }

        // Tap cooldown arc
        if (p.cd > 0) {
            const cdMax = upg('hands').cd(lvl('hands'));
            const frac = 1 - p.cd / cdMax;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.radius + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.strokeStyle = 'rgba(106,223,208,0.55)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Comet
    if (G.comet) {
        const c = G.comet;
        for (let i = 0; i < 14; i++) {
            const f = i / 14;
            ctx.beginPath();
            ctx.arc(c.x - c.vx * f * 0.45, c.y - c.vy * f * 0.45, (1 - f) * 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(106,223,208,${(1 - f) * 0.30})`;
            ctx.fill();
        }
        const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 9);
        cg.addColorStop(0, '#eafffc');
        cg.addColorStop(1, '#6adfd0');
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 18 + 4 * Math.sin(t * 6), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(106,223,208,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Particles
    for (const pt of G.particles) {
        const a = 1 - pt.age / pt.maxAge;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
        ctx.fillStyle = pt.color + (a * 0.8) + ')';
        ctx.fill();
    }

    // Floating texts
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of G.floatingTexts) {
        const a = 1 - ft.age / ft.maxAge;
        const pop = 0.7 + 0.3 * Math.min(1, ft.age * 8);
        ctx.font = `600 ${Math.round(ft.size * pop)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = `rgba(245,201,106,${a})`;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
}

function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = speed * (0.4 + Math.random() * 0.6);
        G.particles.push({
            x, y,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            age: 0, maxAge: 0.5 + Math.random() * 0.4,
            size: 2 + Math.random() * 2.5,
            color,
        });
    }
}

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────

function tick(dt) {
    G.gameTime += dt;

    const speed = orbitSpeed();

    // Orbits
    for (const p of G.planets) {
        const def = PLANET_DEF[p.idx];
        const w = (Math.PI * 2 / def.period) * speed;
        p.angle += w * dt;
        p.spun += w * dt;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;

        if (p.spun >= Math.PI * 2) {
            p.spun -= Math.PI * 2;
            const pos = planetPos(p);
            earn(orbitPayout(p.idx), pos.x, pos.y - 18);
            G.orbitsCompleted++;
            p.pulse = 1;
        }

        if (p.cd > 0) p.cd = Math.max(0, p.cd - dt);
        if (p.pulse > 0) p.pulse = Math.max(0, p.pulse - dt * 2.2);
    }

    // Event Horizon: continuous accretion drip
    const hLvl = rlvl('horizon');
    if (hLvl > 0) {
        G.accretionBuf += orbitRate() * rupg('horizon').rate(hLvl) * dt;
        G.accretionFlush += dt;
        if (G.accretionFlush >= 0.5 && G.accretionBuf > 0) {
            earn(G.accretionBuf);          // silent: no floating text
            G.accretionBuf = 0;
            G.accretionFlush = 0;
        }
    }

    // Comet lifecycle
    if (G.comet) {
        const c = G.comet;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.life -= dt;
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
        pt.age += dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 1 - 1.5 * dt;
        pt.vy *= 1 - 1.5 * dt;
        if (pt.age >= pt.maxAge) G.particles.splice(i, 1);
    }

    // Floating texts
    for (let i = G.floatingTexts.length - 1; i >= 0; i--) {
        const ft = G.floatingTexts[i];
        ft.age += dt;
        ft.y -= dt * 30;
        if (ft.age >= ft.maxAge) G.floatingTexts.splice(i, 1);
    }

    // Rolling income (5s window)
    const cutoff = G.gameTime - 5;
    while (G.incomeWindow.length && G.incomeWindow[0].t < cutoff) G.incomeWindow.shift();
    G.income = G.incomeWindow.reduce((s, x) => s + x.v, 0) / 5;
}

function spawnComet() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = -40; y = Math.random() * H; }
    else if (side === 1) { x = W + 40; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = -40; }
    else { x = Math.random() * W; y = H + 40; }
    const tx = CX + (Math.random() - 0.5) * W * 0.5;
    const ty = CY + (Math.random() - 0.5) * H * 0.5;
    const dx = tx - x, dy = ty - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const spd = Math.max(W, H) / CFG.COMET_LIFE * 1.1;
    G.comet = { x, y, vx: dx / d * spd, vy: dy / d * spd, life: CFG.COMET_LIFE };
}

function catchComet() {
    const c = G.comet;
    const windfall = Math.max(25, G.income * 45) * upg('charm').bonus(lvl('charm')) * globalMult();
    earn(windfall, c.x, c.y - 20, true);
    G.cometsCaught++;
    burst(c.x, c.y, 'rgba(106,223,208,', 26, 180);
    G.comet = null;
    G.cometTimer = randCometGap(lvl('charm'));
}

function tapPlanet(p) {
    if (p.cd > 0) return;
    const pos = planetPos(p);
    const amount = orbitPayout(p.idx) * upg('touch').yield(lvl('touch'));
    earn(amount, pos.x, pos.y - 18);
    G.taps++;
    p.cd = upg('hands').cd(lvl('hands'));
    p.pulse = 1;
    burst(pos.x, pos.y, 'rgba(245,201,106,', 10, 110);
}

function buyUpgrade(u) {
    const l = G.upgrades[u.id];
    if (l >= u.maxLevel) return false;
    const cost = u.costs[l];
    if (G.dust < cost) return false;
    G.dust -= cost;
    G.upgrades[u.id]++;

    if (u.id === 'planet') {
        G.planets.push(newPlanet(G.planets.length));
    }
    if (u.id === 'supernova') triggerSupernova();
    saveGame();
    return true;
}

function triggerSupernova() {
    burst(CX, CY, 'rgba(255,240,200,', 120, 420);
    burst(CX, CY, 'rgba(245,201,106,', 80, 260);
    if (!G.sawSupernova) {
        G.sawSupernova = true;
        document.getElementById('supernova-overlay').classList.add('show');
    }
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (G.comet) {
        const dx = G.comet.x - x, dy = G.comet.y - y;
        if (dx * dx + dy * dy < 48 * 48) { catchComet(); return; }
    }

    let best = null, bestD = Infinity;
    for (const p of G.planets) {
        const pos = planetPos(p);
        const dx = pos.x - x, dy = pos.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const hitR = PLANET_DEF[p.idx].radius + 16;
        if (d < hitR && d < bestD) { best = p; bestD = d; }
    }
    if (best) tapPlanet(best);
});

document.getElementById('sn-close').addEventListener('click', () => {
    document.getElementById('supernova-overlay').classList.remove('show');
});

// ─── UI ──────────────────────────────────────────────────────────────────────

// Cards are built once per panel rebuild; fields update in place.
const cardRefs = [];

function makeCard(u, getLvl, buy, currencySymbol, extraClass) {
    const card = document.createElement('div');
    card.className = 'upgrade-card' + (extraClass || '');
    card.innerHTML = `<div class="upg-top">
  <span class="upg-name">${u.name}</span>
  <span class="upg-cost"></span>
</div>
<div class="upg-desc"></div>
<div class="upg-row">
  <div class="upg-bar-bg"><div class="upg-bar-fill"></div></div>
  <div class="upg-level"></div>
</div>`;
    card.addEventListener('click', () => { if (buy(u)) updateCards(); });
    cardRefs.push({
        u, card, getLvl, currencySymbol,
        cost: card.querySelector('.upg-cost'),
        desc: card.querySelector('.upg-desc'),
        fill: card.querySelector('.upg-bar-fill'),
        level: card.querySelector('.upg-level'),
    });
    return card;
}

let collapseCard = null;

function buildPanels() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = '';
    cardRefs.length = 0;

    for (const u of UPGRADES) {
        list.appendChild(makeCard(u, () => G.upgrades[u.id], buyUpgrade, '✦', u.special ? ' is-special' : ''));
    }

    // ── Singularity section: collapse + remnant upgrades ──
    const showRemnants = G.collapses > 0 || G.remnants > 0 || G.runDust >= CFG.COLLAPSE_UNIT * 0.5;
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.style.marginTop = '26px';
    title.textContent = 'SINGULARITY';
    list.appendChild(title);

    collapseCard = document.createElement('div');
    collapseCard.className = 'upgrade-card collapse-card';
    collapseCard.innerHTML = `<div class="upg-top">
  <span class="upg-name">Collapse the Star</span>
  <span class="upg-cost collapse-gain"></span>
</div>
<div class="upg-desc collapse-desc"></div>`;
    collapseCard.addEventListener('click', collapse);
    list.appendChild(collapseCard);

    if (showRemnants) {
        for (const u of REMNANT_UPGRADES) {
            list.appendChild(makeCard(u, () => G.remnantUpgrades[u.id], buyRemnantUpgrade, '✸', ' is-remnant'));
        }
    }
    updateCards();
}

function updateCards() {
    for (const ref of cardRefs) {
        const { u, card } = ref;
        const l = ref.getLvl();
        const isMax = l >= u.maxLevel;
        const cost = isMax ? null : u.costs[l];
        const wallet = ref.currencySymbol === '✸' ? G.remnants : G.dust;
        card.classList.toggle('is-maxed', isMax);
        card.classList.toggle('can-afford', !isMax && wallet >= cost);
        ref.cost.textContent = isMax ? '—' : ref.currencySymbol + fmtNum(cost);
        ref.cost.classList.toggle('maxed', isMax);
        ref.desc.textContent = u.desc(l);
        ref.fill.style.width = (isMax ? 100 : (l / u.maxLevel) * 100) + '%';
        ref.level.textContent = isMax ? 'MAX' : `${l}/${u.maxLevel}`;
    }

    if (collapseCard) {
        const gain = collapseGain();
        collapseCard.classList.toggle('can-collapse', gain >= 1);
        collapseCard.querySelector('.collapse-gain').textContent = gain >= 1 ? `+✸${gain}` : '✸0';
        collapseCard.querySelector('.collapse-desc').textContent = gain >= 1
            ? 'Reset this run for permanent Remnants.'
            : `Earn ✦${fmtNum(CFG.COLLAPSE_UNIT)} in one run to gain your first Remnant.`;
    }
}

let lastUITick = 0;
let remnantSectionShown = false;
function updateUI(now) {
    if (now - lastUITick < 150) return;
    lastUITick = now;

    document.getElementById('dust-amount').textContent = fmtNum(G.dust);
    document.getElementById('dust-rate').textContent = fmtNum(G.income) + ' / s';

    // Remnant counter appears once prestige is relevant
    const rEl = document.getElementById('remnant-display');
    if (G.remnants > 0 || G.collapses > 0) {
        rEl.style.display = '';
        document.getElementById('remnant-amount').textContent = fmtNum(G.remnants);
    } else {
        rEl.style.display = 'none';
    }

    // Reveal remnant shop the moment it becomes relevant
    const shouldShow = G.collapses > 0 || G.remnants > 0 || G.runDust >= CFG.COLLAPSE_UNIT * 0.5;
    if (shouldShow && !remnantSectionShown) {
        remnantSectionShown = true;
        buildPanels();
    }

    updateCards();

    document.getElementById('stats-list').innerHTML = [
        ['Total Stardust', '✦' + fmtNum(G.totalDust)],
        ['This Run', '✦' + fmtNum(G.runDust)],
        ['Remnants', '✸' + fmtNum(G.remnants)],
        ['Collapses', G.collapses],
        ['Planets', G.planets.length],
        ['Orbits Completed', G.orbitsCompleted.toLocaleString()],
        ['Planet Taps', G.taps.toLocaleString()],
        ['Comets Caught', G.cometsCaught],
        ['Time Observed', fmtTime(G.gameTime)],
    ].map(([l, v]) => `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`).join('');
}

// ─── SAVE / LOAD ─────────────────────────────────────────────────────────────

function saveGame() {
    const data = {
        dust: G.dust,
        runDust: G.runDust,
        totalDust: G.totalDust,
        remnants: G.remnants,
        collapses: G.collapses,
        orbitsCompleted: G.orbitsCompleted,
        taps: G.taps,
        cometsCaught: G.cometsCaught,
        gameTime: G.gameTime,
        upgrades: { ...G.upgrades },
        remnantUpgrades: { ...G.remnantUpgrades },
        sawSupernova: G.sawSupernova,
    };
    try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data)); } catch (_) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(CFG.SAVE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        G.dust = d.dust ?? 0;
        G.runDust = d.runDust ?? 0;
        G.totalDust = d.totalDust ?? 0;
        G.remnants = d.remnants ?? 0;
        G.collapses = d.collapses ?? 0;
        G.orbitsCompleted = d.orbitsCompleted ?? 0;
        G.taps = d.taps ?? 0;
        G.cometsCaught = d.cometsCaught ?? 0;
        G.gameTime = d.gameTime ?? 0;
        G.sawSupernova = d.sawSupernova ?? false;
        G.upgrades = Object.assign(
            { planet: 0, velocity: 0, radiance: 0, touch: 0, hands: 0, charm: 0, supernova: 0 },
            d.upgrades
        );
        G.remnantUpgrades = Object.assign(
            { ancient: 0, memory: 0, dilation: 0, moons: 0, horizon: 0 },
            d.remnantUpgrades
        );
        G.planets = [];
        const count = Math.min(CFG.MAX_PLANETS, G.upgrades.planet + 1);
        for (let i = 0; i < count; i++) G.planets.push(newPlanet(i));
    } catch (_) {}
}

function resetGame() {
    if (!confirm('Reset ALL progress, including Remnants?')) return;
    localStorage.removeItem(CFG.SAVE_KEY);
    G = createInitialState();
    remnantSectionShown = false;
    buildPanels();
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────

let lastTs = 0;
let lastSave = 0;

function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;

    tickWithDebug(dt);

    lastSave += dt;
    if (lastSave >= 20) { lastSave = 0; saveGame(); }

    draw(ts / 1000);
    updateUI(ts);

    requestAnimationFrame(loop);
}

// ─── DEBUG PANEL (only active when URL contains ?debug) ──────────────────────

let debugSpeedMult = 1;

function initDebug() {
    if (!location.search.includes('debug')) return;

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position:fixed;bottom:16px;left:16px;z-index:9999;
        background:rgba(10,10,20,0.92);border:1px solid rgba(106,223,208,0.4);
        border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;
        font:13px/1 'Segoe UI',sans-serif;color:#c8d0e8;min-width:180px;
    `;
    panel.innerHTML = `<div style="font-size:11px;letter-spacing:.1em;color:#6adfd0;margin-bottom:2px">DEBUG</div>`;

    const btn = (label, fn) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = `background:rgba(106,223,208,0.12);border:1px solid rgba(106,223,208,0.3);
            color:#c8d0e8;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;text-align:left;`;
        b.onclick = fn;
        panel.appendChild(b);
    };

    btn('+ ✦ 1K',    () => earn(1e3));
    btn('+ ✦ 100K',  () => earn(1e5));
    btn('+ ✦ 10M',   () => earn(1e7));
    btn('+ ✸ 10',    () => { G.remnants += 10; buildPanels(); });
    btn('+ ✸ 100',   () => { G.remnants += 100; buildPanels(); });
    btn('Spawn Comet',() => { G.comet = null; G.cometTimer = 0; });
    btn('Reset',       () => { localStorage.removeItem(CFG.SAVE_KEY); G = createInitialState(); remnantSectionShown = false; buildPanels(); });

    const speedRow = document.createElement('div');
    speedRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:2px';
    speedRow.innerHTML = `<span style="font-size:12px">Speed</span>`;
    [1, 3, 5, 10, 20].forEach(n => {
        const b = document.createElement('button');
        b.textContent = `×${n}`;
        b.style.cssText = `background:rgba(106,223,208,0.12);border:1px solid rgba(106,223,208,0.3);
            color:#c8d0e8;border-radius:4px;padding:3px 7px;cursor:pointer;font-size:12px;`;
        b.onclick = () => { debugSpeedMult = n; };
        speedRow.appendChild(b);
    });
    panel.appendChild(speedRow);

    document.body.appendChild(panel);
}

// Patch tick to respect debugSpeedMult
const _tick = tick;
function tickWithDebug(dt) { _tick(dt * debugSpeedMult); }

// ─── INIT ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', resize);
window.addEventListener('beforeunload', saveGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);

loadGame();
resize();
buildPanels();
initDebug();
requestAnimationFrame(ts => {
    lastTs = ts;
    requestAnimationFrame(loop);
});
