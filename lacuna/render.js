'use strict';

// ─── CANVAS ──────────────────────────────────────────────────────────────────

const canvas = document.getElementById('sky');
const ctx    = canvas.getContext('2d');

let W = 0, H = 0, CX = 0, CY = 0, MAXR = 0;
let stars = [];

function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    MAXR = Math.min(W, H) / 2 - 36;

    stars = [];
    const n = Math.round((W * H) / 6000);
    for (let i = 0; i < n; i++) {
        stars.push({
            x: Math.random() * W, y: Math.random() * H,
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

// ─── DRAW ────────────────────────────────────────────────────────────────────

function draw(t) {
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(0, 0, W, H);

    // Twinkling stars
    for (const s of stars) {
        const a = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(40,35,28,${a * 0.55})`;
        ctx.fill();
    }

    // Orbit rings
    for (let i = 0; i < G.planets.length; i++) {
        ctx.beginPath();
        ctx.arc(CX, CY, orbitR(i), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,90,80,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    if (G.planets.length < CFG.MAX_PLANETS) {
        ctx.beginPath();
        ctx.arc(CX, CY, orbitR(G.planets.length), 0, Math.PI * 2);
        ctx.setLineDash([3, 9]);
        ctx.strokeStyle = 'rgba(100,90,80,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Sun glow
    const pulse = 1 + 0.04 * Math.sin(t * 1.8);
    const sunR  = 26 * pulse;
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, sunR * 4.2);
    g.addColorStop(0, 'rgba(160,130,70,0.22)');
    g.addColorStop(0.5, 'rgba(160,120,60,0.07)');
    g.addColorStop(1, 'rgba(160,120,60,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, sunR * 4.2, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Event Horizon ring
    if (rlvl('horizon') > 0) {
        const hr  = sunR * 1.9;
        const wob = 1 + 0.06 * Math.sin(t * 3.1);
        ctx.beginPath();
        ctx.arc(CX, CY, hr * wob, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(90,70,110,${0.2 + 0.1 * Math.sin(t * 2.2)})`;
        ctx.lineWidth = 3 + rlvl('horizon') * 0.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CX, CY, hr * 1.25 * wob, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(90,70,110,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Sun core
    ctx.beginPath();
    ctx.arc(CX, CY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // Planets
    for (const p of G.planets) {
        const def = PLANET_DEF[p.idx];
        const pos = planetPos(p);
        const r   = orbitR(p.idx);

        // Motion trail
        ctx.beginPath();
        ctx.arc(CX, CY, r, p.angle - 0.55, p.angle);
        ctx.strokeStyle = 'rgba(40,35,28,0.08)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Harvest pulse ring
        if (p.pulse > 0) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.radius + 6 + (1 - p.pulse) * 26, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100,80,40,${p.pulse * 0.55})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Planet body — flat fill
        const dim = p.cd > 0 ? 0.3 : 1;
        ctx.globalAlpha = dim;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, def.radius, 0, Math.PI * 2);
        ctx.fillStyle = PLANET_COLORS[p.idx];
        ctx.fill();
        ctx.globalAlpha = 1;

        // Moon (Moonrise upgrade)
        if (hasMoon(p.idx)) {
            const ma = t * 2.6 + p.idx * 1.7;
            const mr = def.radius + 8;
            ctx.beginPath();
            ctx.arc(pos.x + Math.cos(ma) * mr, pos.y + Math.sin(ma) * mr, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#888878';
            ctx.fill();
        }

        // Tap cooldown arc
        if (p.cd > 0) {
            const cdMax = upg('hands').cd(lvl('hands'));
            const frac  = 1 - p.cd / cdMax;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.radius + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.strokeStyle = 'rgba(80,90,70,0.55)';
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
            ctx.arc(c.x - c.vx * f * 0.45, c.y - c.vy * f * 0.45, (1 - f) * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(60,80,70,${(1 - f) * 0.22})`;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#2a2a2a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16 + 3 * Math.sin(t * 6), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(60,80,70,0.28)';
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

    // Floating text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of G.floatingTexts) {
        const a   = 1 - ft.age / ft.maxAge;
        const pop = 0.7 + 0.3 * Math.min(1, ft.age * 8);
        ctx.font = `600 ${Math.round(ft.size * pop)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = `rgba(26,26,26,${a})`;
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
