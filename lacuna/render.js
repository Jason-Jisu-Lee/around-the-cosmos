'use strict';

const canvas = document.getElementById('sky');
const ctx    = canvas.getContext('2d');
let W=0, H=0, CX=0, CY=0, MAXR=0;

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
    }
}

function draw(t) {
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(0,0,W,H);

    // Orbit rings — dust on ring 0, asteroids on the wider ring 1.
    if (G.planets.length) {
        ctx.beginPath(); ctx.arc(CX,CY,orbitR(0),0,Math.PI*2);
        ctx.strokeStyle='rgba(100,90,80,0.18)'; ctx.lineWidth=1; ctx.stroke();
    }
    if (G.asteroids.length) {
        ctx.beginPath(); ctx.arc(CX,CY,orbitR(1),0,Math.PI*2);
        ctx.strokeStyle='rgba(100,90,80,0.16)'; ctx.lineWidth=1; ctx.stroke();
    }

    const pulse=1+0.04*Math.sin(t*1.8), sunR=13*pulse;
    const g = ctx.createRadialGradient(CX,CY,0,CX,CY,sunR*4.2);
    g.addColorStop(0,'rgba(160,130,70,0.22)'); g.addColorStop(0.5,'rgba(160,120,60,0.07)'); g.addColorStop(1,'rgba(160,120,60,0)');
    ctx.beginPath(); ctx.arc(CX,CY,sunR*4.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();

    ctx.beginPath(); ctx.arc(CX,CY,sunR,0,Math.PI*2); ctx.fillStyle='#1a1a1a'; ctx.fill();

    // Orbiters — clumps of small irregular pebbles. Each clump orbits Lacuna; each
    // pebble also circles its own little orbit within the clump. Dust = small grey
    // pebbles (ring 0); asteroids = bigger rocky-brown pebbles (ring 1).
    if (G.planets.length)   drawClump(G.planets,   clumpPos(),         PLANET_DEF[0].radius/3 + 2, '#8a8782', t);
    if (G.asteroids.length) drawClump(G.asteroids, asteroidClumpPos(), PLANET_DEF[1].radius/3 + 4, '#7a6a55', t);

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
