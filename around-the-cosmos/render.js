'use strict';

const canvas = document.getElementById('sky');
const ctx    = canvas.getContext('2d');
let W=0, H=0, CX=0, CY=0, MAXR=0;
const COMET_HOVER_R = 40;   // hovering within this of the comet shows the targeting reticle

function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    CX=W/2; CY=H/2; MAXR=Math.min(W,H)/2-36;
}

function orbitR(i) { return MAXR*(i+1.9)/(CFG.MAX_PLANETS+1.9); }
// The dust clump orbits Lacuna at ring 0; particles offset locally around this point.
function clumpPos() { const r=orbitR(0); return { x:CX+Math.cos(G.clump.angle)*r, y:CY+Math.sin(G.clump.angle)*r }; }
// The asteroid clump orbits on the wider ring 1.
function asteroidClumpPos() { const r=orbitR(1); return { x:CX+Math.cos(G.asteroidClump.angle)*r, y:CY+Math.sin(G.asteroidClump.angle)*r }; }
// The moon orbits on the widest ring 2.
function moonClumpPos() { const r=orbitR(2); return { x:CX+Math.cos(G.moonClump.angle)*r, y:CY+Math.sin(G.moonClump.angle)*r }; }

// Draw a clump of irregular pebbles (dust or asteroids) around a clump center.
function drawClump(list, cp, pr, color, t) {
    for (const o of list) {
        const la = o.localPhase + t*o.localSpin;
        const px = cp.x + Math.cos(la)*o.localR, py = cp.y + Math.sin(la)*o.localR;
        if (o.pulse > 0) {
            ctx.beginPath(); ctx.arc(px,py,pr+3+(1-o.pulse)*12,0,Math.PI*2);
            ctx.strokeStyle=`rgba(100,90,80,${o.pulse*0.45})`; ctx.lineWidth=1.5; ctx.stroke();
        }
        ctx.save();
        ctx.translate(px,py); ctx.rotate(la*1.5);
        ctx.beginPath();
        for (let k=0; k<o.shape.length; k++) {
            const a=(k/o.shape.length)*Math.PI*2, r=pr*o.shape[k];
            k ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); ctx.fillStyle=color; ctx.fill();
        // Asteroid only: soft 2D shading that gives the rock 3D roundness — a radial
        // gradient darkening the far side. Drawn in WORLD orientation (undo the body spin)
        // so the light stays fixed at upper-left while the rock tumbles. Clipped to the body.
        if (o.motes) {
            ctx.clip();
            ctx.rotate(-la*1.5);
            const lx=-pr*0.45, ly=-pr*0.55;                       // light direction (upper-left)
            const g=ctx.createRadialGradient(lx,ly,pr*0.15, lx,ly,pr*2.1);
            g.addColorStop(0,'rgba(0,0,0,0)');
            g.addColorStop(0.5,'rgba(20,16,12,0.10)');
            g.addColorStop(1,'rgba(20,16,12,0.34)');
            ctx.fillStyle=g; ctx.fillRect(-pr*2.5,-pr*2.5,pr*5,pr*5);
        }
        ctx.restore();

        // Tiny dust motes drifting around the body (asteroids only).
        if (o.motes) {
            for (const mte of o.motes) {
                const ma = mte.phase + t*mte.spin;
                const mx = px + Math.cos(ma)*pr*mte.dist, my = py + Math.sin(ma)*pr*mte.dist;
                ctx.beginPath(); ctx.arc(mx,my,mte.size,0,Math.PI*2);
                ctx.fillStyle='rgba(138,135,130,0.5)'; ctx.fill();
            }
        }
    }
}

// Draw a moon as a smooth disc with a lunar-phase terminator shadow. `phase` is
// 0..1 (0/1 = new moon, 0.5 = full). The lit disc is filled first, then the unlit
// region is clipped to the circle and filled — its boundary is the outer limb on the
// dark side plus the elliptical terminator (semi-axis shrinks to 0 at the quarters).
// The moon is round but NOT a perfect circle: its rim is gently perturbed by a few
// low-frequency ridges (~1-2% of radius — a perfect sphere at a glance, but lumpier
// up close), and faint darker maria/craters mottle the surface. Fixed coefficients →
// a stable, tidally-locked face (it never shimmers or spins).
const MOON_RIDGES  = [[3, 0.020, 0.6], [7, 0.013, 2.1], [12, 0.008, 4.0]];          // [freq, amp, phase]
const MOON_CRATERS = [[-0.30,-0.26,0.17],[0.30,0.12,0.13],[0.04,0.36,0.10],[0.36,-0.30,0.085],[-0.20,0.28,0.075],[-0.40,0.04,0.06]]; // [dx,dy,r] in units of r
function moonOutline(cx, cy, r) {
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
        const th = i / N * 2 * Math.PI;
        let rr = r;
        for (const [f, a, ph] of MOON_RIDGES) rr += r * a * Math.sin(f * th + ph);
        const x = cx + rr * Math.cos(th), y = cy + rr * Math.sin(th);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
}
function drawMoonDisc(cx, cy, r, phase, lit, dark) {
    moonOutline(cx, cy, r); ctx.fillStyle = lit; ctx.fill();

    ctx.save();
    moonOutline(cx, cy, r); ctx.clip();
    // faint surface texture — soft darker blotches (maria / craters)
    ctx.fillStyle = 'rgba(58,64,70,0.10)';
    for (const [dx, dy, cr] of MOON_CRATERS) { ctx.beginPath(); ctx.arc(cx + dx*r, cy + dy*r, cr*r, 0, Math.PI*2); ctx.fill(); }
    // lunar-phase terminator shadow (slightly oversized so it reaches the ridged rim)
    ctx.fillStyle = dark;
    const rs = r * 1.05;
    const a = r * Math.cos(2*Math.PI*phase);   // terminator horizontal semi-axis (signed)
    const waxing = phase < 0.5;                 // dark on the left while waxing, right while waning
    const bulgeRight = waxing ? (a > 0) : (a < 0);
    ctx.beginPath();
    ctx.arc(cx, cy, rs, -Math.PI/2, Math.PI/2, waxing);   // outer semicircle on the dark side (top→edge→bottom)
    if (bulgeRight) ctx.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, -Math.PI/2, true);
    else            ctx.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, Math.PI*1.5, false);
    ctx.closePath(); ctx.fill();

    // Soft limb darkening — a faint rim shadow (clipped to the disc) that rounds the
    // flat circle into a 3D sphere and softens the hard edge on the dark side.
    const lg = ctx.createRadialGradient(cx, cy, r*0.55, cx, cy, r*1.02);
    lg.addColorStop(0,    'rgba(0,0,0,0)');
    lg.addColorStop(0.78, 'rgba(0,0,0,0)');
    lg.addColorStop(1,    'rgba(18,20,24,0.32)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(cx, cy, r*1.12, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// A round orbiter (the moon): drawn as a single phased disc sitting on the orbit line.
function drawRoundClump(o, t) {
    const cp = o.clumpPos(), pr = o.pebbleR();
    for (const b of o.list()) {
        if (b.pulse > 0) {
            ctx.beginPath(); ctx.arc(cp.x, cp.y, pr+3+(1-b.pulse)*12, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(100,90,80,${b.pulse*0.45})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        drawMoonDisc(cp.x, cp.y, pr, moonPhase(), o.color(), MOON_SHADOW);
    }
}

// Targeting reticle — a square drawn only at its corners (tactical-crosshair brackets),
// gently pulsing. Used to mark the comet on hover.
function drawReticle(x, y, t) {
    const s = 18 + Math.sin(t*4)*1.5;   // half-size (corner offset), gentle pulse (~13% bigger)
    const a = 7;                        // bracket arm length
    ctx.strokeStyle = 'rgba(60,80,70,0.85)';
    ctx.lineWidth = 1.5;
    for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
        const cx = x + sx*s, cy = y + sy*s;
        ctx.beginPath();
        ctx.moveTo(cx - sx*a, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy - sy*a);
        ctx.stroke();
    }
}

function draw(t) {
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(0,0,W,H);

    drawStars(t);   // background shining stars (stars.js), behind everything

    // Orbit rings — one per orbiter type that has bodies (ring index from the component).
    for (const o of ORBITERS) if (o.list().length) {
        ctx.beginPath(); ctx.arc(CX,CY,orbitR(o.ring),0,Math.PI*2);
        ctx.strokeStyle='rgba(100,90,80,0.17)'; ctx.lineWidth=1; ctx.stroke();
    }

    const pulse=1+0.04*Math.sin(t*1.8), sunR=13*pulse;
    // Glow only appears once Resonance is bought, brightening marginally per level (very faint
    // even at max — barely perceptible). No glow by default.
    const reso = lvl('resonance');
    if (reso > 0) {
        const a = 0.08 + 0.025 * (reso - 1);  // center alpha: 0.08 (lvl1) → 0.18 (lvl5)
        const R = sunR * 5.6;                  // radius unchanged (looks natural)
        // Several soft blobs at gently drifting offsets overlap into an irregular, living glow.
        // Each also SHIMMERS — its alpha and size breathe over time, so the glow looks like it's
        // radiating (a sun giving off heat). [dx, dy, radius-scale, alpha-scale, shimmerFreq, phase]
        const blobs = [
            [0, 0, 1.0, 1.0, 0.5, 0.0],
            [Math.cos(t*0.37)*sunR*0.9,      Math.sin(t*0.31)*sunR*0.8,  0.72, 0.6, 0.8, 1.7],
            [Math.cos(t*0.23+2.1)*sunR*0.85, Math.sin(t*0.41+1.3)*sunR*0.95, 0.58, 0.5, 1.2, 3.4],
        ];
        for (const [dx,dy,rs,ms,sf,sp] of blobs) {
            const shimmer = 0.7 + 0.3*Math.sin(t*sf + sp);                 // glow waxes/wanes
            const cx=CX+dx, cy=CY+dy, r=R*rs*(1 + 0.06*Math.sin(t*sf*0.7 + sp));
            const aa = a*ms*shimmer;
            const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
            g.addColorStop(0,`rgba(160,130,70,${aa})`);
            g.addColorStop(0.55,`rgba(160,120,60,${aa*0.4})`);
            g.addColorStop(1,'rgba(160,120,60,0)');
            ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
    }

    // Lacuna core — the click reaction (effects.js) offsets/squashes it briefly.
    const fx = clickFxTransform(t);
    ctx.beginPath(); ctx.ellipse(CX+fx.dx, CY+fx.dy, sunR*fx.sx, sunR*fx.sy, 0, 0, Math.PI*2);
    ctx.fillStyle='#1a1a1a'; ctx.fill();

    // Orbiters — clumps of small irregular pebbles. Each clump orbits Lacuna; each
    // pebble also circles its own little orbit within the clump. Appearance (color,
    // size) comes from the component (orbiters/*).
    for (const o of ORBITERS) if (o.list().length) {
        if (o.round) drawRoundClump(o, t);
        else         drawClump(o.list(), o.clumpPos(), o.pebbleR(), o.color(), t);
    }

    if (G.comet) {
        const c=G.comet;
        for (let i=0; i<14; i++) {
            const f=i/14;
            ctx.beginPath(); ctx.arc(c.x-c.vx*f*0.45, c.y-c.vy*f*0.45,(1-f)*4,0,Math.PI*2);
            ctx.fillStyle=`rgba(60,80,70,${(1-f)*0.22})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(c.x,c.y,6,0,Math.PI*2); ctx.fillStyle='#2a2a2a'; ctx.fill();
        ctx.beginPath(); ctx.arc(c.x,c.y,16+3*Math.sin(t*6),0,Math.PI*2);
        ctx.strokeStyle='rgba(60,80,70,0.28)'; ctx.lineWidth=1.5; ctx.stroke();
        // Targeting reticle when the cursor is over the comet (cosmoMx/cosmoOver from game.js).
        if (cosmoOver && Math.hypot(cosmoMx-c.x, cosmoMy-c.y) < COMET_HOVER_R) drawReticle(c.x, c.y, t);
    }

    for (const pt of G.particles) {
        const a=1-pt.age/pt.maxAge;
        ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.size*a,0,Math.PI*2);
        ctx.fillStyle=pt.color+(a*0.8)+')'; ctx.fill();
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';
    for (const ft of G.floatingTexts) {
        const a=1-ft.age/ft.maxAge, pop=0.7+0.3*Math.min(1,ft.age*8);
        ctx.font=`600 ${Math.round(ft.size*pop)}px 'Segoe UI',sans-serif`;
        ctx.fillStyle=`rgba(26,26,26,${a})`; ctx.fillText(ft.text,ft.x,ft.y);
    }
}

function burst(x,y,color,count,speed) {
    for (let i=0; i<count; i++) {
        const ang=Math.random()*Math.PI*2, spd=speed*(0.4+Math.random()*0.6);
        G.particles.push({ x,y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, age:0, maxAge:0.5+Math.random()*0.4, size:2+Math.random()*2.5, color });
    }
}
