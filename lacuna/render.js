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

// Targeting reticle — a square drawn only at its corners (tactical-crosshair brackets),
// gently pulsing. Used to mark the comet on hover.
function drawReticle(x, y, t) {
    const s = 16 + Math.sin(t*4)*1.3;   // half-size (corner offset), gentle pulse
    const a = 6;                        // bracket arm length
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

    // Orbit rings — one per orbiter type that has bodies (ring index from the component).
    for (const o of ORBITERS) if (o.list().length) {
        ctx.beginPath(); ctx.arc(CX,CY,orbitR(o.ring),0,Math.PI*2);
        ctx.strokeStyle='rgba(100,90,80,0.17)'; ctx.lineWidth=1; ctx.stroke();
    }

    const pulse=1+0.04*Math.sin(t*1.8), sunR=13*pulse;
    const g = ctx.createRadialGradient(CX,CY,0,CX,CY,sunR*4.2);
    g.addColorStop(0,'rgba(160,130,70,0.22)'); g.addColorStop(0.5,'rgba(160,120,60,0.07)'); g.addColorStop(1,'rgba(160,120,60,0)');
    ctx.beginPath(); ctx.arc(CX,CY,sunR*4.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();

    ctx.beginPath(); ctx.arc(CX,CY,sunR,0,Math.PI*2); ctx.fillStyle='#1a1a1a'; ctx.fill();

    // Orbiters — clumps of small irregular pebbles. Each clump orbits Lacuna; each
    // pebble also circles its own little orbit within the clump. Appearance (color,
    // size) comes from the component (orbiters/*).
    for (const o of ORBITERS) if (o.list().length) drawClump(o.list(), o.clumpPos(), o.pebbleR(), o.color(), t);

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
