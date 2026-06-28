'use strict';

const canvas = document.getElementById('sky');
const ctx    = canvas.getContext('2d');
const cometLayer = document.getElementById('comet-layer');
const cometCtx   = cometLayer.getContext('2d');
let W=0, H=0, CX=0, CY=0, MAXR=0;
let winMx=-999, winMy=-999;
const COMET_HOVER_R = 40;
let deepBreathFlash = -1;
const DEEP_FLARE_DUR = 0.62;

function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    CX=W/2; CY=H/2; MAXR=Math.min(W,H)/2-36;
    cometLayer.width = Math.round(innerWidth*dpr); cometLayer.height = Math.round(innerHeight*dpr);
    cometCtx.setTransform(dpr,0,0,dpr,0,0);
}

function mawScreen() { const r = canvas.getBoundingClientRect(); return { x: r.left + CX, y: r.top + CY }; }

function orbitR(i) { return MAXR*(i+1.9)/(CFG.MAX_PLANETS+1.9); }

function clumpPos() { const r=orbitR(0); return { x:CX+Math.cos(G.clump.angle)*r, y:CY+Math.sin(G.clump.angle)*r }; }

function asteroidClumpPos() { const r=orbitR(1); return { x:CX+Math.cos(G.asteroidClump.angle)*r, y:CY+Math.sin(G.asteroidClump.angle)*r }; }

function moonClumpPos() { const r=orbitR(2); return { x:CX+Math.cos(G.moonClump.angle)*r, y:CY+Math.sin(G.moonClump.angle)*r }; }
function dwarfClumpPos() { const r=orbitR(3); return { x:CX+Math.cos(G.dwarfClump.angle)*r, y:CY+Math.sin(G.dwarfClump.angle)*r }; }

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

        if (o.motes) {
            ctx.clip();
            ctx.rotate(-la*1.5);
            const lx=-pr*0.45, ly=-pr*0.55;
            const g=ctx.createRadialGradient(lx,ly,pr*0.15, lx,ly,pr*2.1);
            g.addColorStop(0,'rgba(0,0,0,0)');
            g.addColorStop(0.5,'rgba(20,16,12,0.10)');
            g.addColorStop(1,'rgba(20,16,12,0.34)');
            ctx.fillStyle=g; ctx.fillRect(-pr*2.5,-pr*2.5,pr*5,pr*5);
        } else {
            ctx.clip();
            ctx.rotate(-la*1.5);
            const lx=-pr*0.45, ly=-pr*0.55;
            const g=ctx.createRadialGradient(lx,ly,pr*0.15, lx,ly,pr*2.1);
            g.addColorStop(0,'rgba(0,0,0,0)');
            g.addColorStop(0.55,'rgba(20,16,12,0.05)');
            g.addColorStop(1,'rgba(20,16,12,0.20)');
            ctx.fillStyle=g; ctx.fillRect(-pr*2.5,-pr*2.5,pr*5,pr*5);
        }
        ctx.restore();

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

const MOON_LX = -0.62, MOON_LY = -0.55;
const MOON_LANG = Math.atan2(MOON_LY, MOON_LX);
const MOON_CRATERS = [[-0.30,-0.26,0.16],[0.30,0.12,0.12],[0.05,0.36,0.10],[0.36,-0.30,0.08],[-0.22,0.30,0.075],[-0.42,0.06,0.055],[0.16,-0.12,0.06]];

function moonCrater(cx, cy, r, dx, dy, cr) {
    const x = cx + dx*r, y = cy + dy*r, rad = cr*r;
    ctx.fillStyle = 'rgba(44,48,54,0.16)';
    ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    ctx.lineWidth = Math.max(0.6, rad*0.34);
    ctx.strokeStyle = 'rgba(228,230,232,0.40)';
    ctx.beginPath(); ctx.arc(x, y, rad*0.92, MOON_LANG-1.0, MOON_LANG+1.0); ctx.stroke();
    ctx.strokeStyle = 'rgba(26,29,34,0.30)';
    ctx.beginPath(); ctx.arc(x, y, rad*0.92, MOON_LANG+Math.PI-1.0, MOON_LANG+Math.PI+1.0); ctx.stroke();
}

function drawMoonDisc(cx, cy, r, phase) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();

    const g = ctx.createRadialGradient(cx+MOON_LX*r*0.5, cy+MOON_LY*r*0.5, r*0.08, cx-MOON_LX*r*0.3, cy-MOON_LY*r*0.3, r*1.35);
    g.addColorStop(0,    '#d3d6d8');
    g.addColorStop(0.45, '#9aa0a4');
    g.addColorStop(0.8,  '#6a7075');
    g.addColorStop(1,    '#454b51');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();

    for (const [dx, dy, cr] of MOON_CRATERS) moonCrater(cx, cy, r, dx, dy, cr);

    const a = r * Math.cos(2*Math.PI*phase);
    const waxing = phase < 0.5;
    const bulgeRight = waxing ? (a > 0) : (a < 0);
    ctx.save();
    ctx.filter = `blur(${(r*0.06).toFixed(2)}px)`;
    ctx.fillStyle = 'rgba(20,22,28,0.80)';
    const rs = r * 1.06;
    ctx.beginPath();
    ctx.arc(cx, cy, rs, -Math.PI/2, Math.PI/2, waxing);
    if (bulgeRight) ctx.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, -Math.PI/2, true);
    else            ctx.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, Math.PI*1.5, false);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    const lg = ctx.createRadialGradient(cx, cy, r*0.5, cx, cy, r*1.02);
    lg.addColorStop(0,    'rgba(0,0,0,0)');
    lg.addColorStop(0.72, 'rgba(0,0,0,0)');
    lg.addColorStop(1,    'rgba(12,14,18,0.30)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(60,64,70,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
}

function drawRoundClump(o, t) {
    const cp = o.clumpPos(), pr = o.pebbleR();
    for (const b of o.list()) {
        if (b.pulse > 0) {
            ctx.beginPath(); ctx.arc(cp.x, cp.y, pr+3+(1-b.pulse)*12, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(100,90,80,${b.pulse*0.45})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        drawMoonDisc(cp.x, cp.y, pr, moonPhase());
    }
}

// ----- Dwarf Planet ("Ember") sphere: a procedurally-lit, slowly-spinning banded ball -----
let EMBER_TEX = null;
function buildEmberTex() {
    const TW=300, TH=150, a=new Uint8ClampedArray(TW*TH*3);
    const hsh=(x,y)=>{ let n=(x|0)*374761393+(y|0)*668265263; n=(n^(n>>>13))>>>0; n=Math.imul(n,1274126177)>>>0; return((n^(n>>>16))>>>0)/4294967295; };
    const vn=(x,y)=>{ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),A=hsh(xi,yi),B=hsh(xi+1,yi),C=hsh(xi,yi+1),Dd=hsh(xi+1,yi+1); return A+(B-A)*u+(C-A)*v+(A-B-C+Dd)*u*v; };
    const fbm=(x,y)=>{ let s=0,am=0.5,f=1; for(let k=0;k<5;k++){ s+=am*vn(x*f,y*f); f*=2; am*=0.5; } return s; };
    const cl=(x,lo,hi)=>x<lo?lo:x>hi?hi:x, lp=(p,q,r)=>p+(q-p)*r;
    for (let y=0;y<TH;y++) for (let x=0;x<TW;x++) {
        const u=(x+0.5)/TW, v=(y+0.5)/TH;
        const band=Math.sin(v*Math.PI*6+Math.sin(u*6.28)*0.25)*0.5+0.5, n=fbm(u*10,v*22);
        const t=cl(band*0.7+n*0.3,0,1), hi=cl((t-0.6)/0.4,0,1), o=(y*TW+x)*3;
        a[o]=lp(lp(150,205,t),224,hi); a[o+1]=lp(lp(96,150,t),186,hi); a[o+2]=lp(lp(54,92,t),128,hi);
    }
    EMBER_TEX = { w:TW, h:TH, data:a };
}
const dwarfTmp = document.createElement('canvas'), dwarfTctx = dwarfTmp.getContext('2d');
function drawDwarfSphere(cx, cy, R, t) {
    if (!EMBER_TEX) buildEmberTex();
    const TW=EMBER_TEX.w, TH=EMBER_TEX.h, TX=EMBER_TEX.data, TAU=Math.PI*2, rot=t*0.22;
    const D=Math.ceil(R*2)+2, x0=Math.round(cx-R)-1, y0=Math.round(cy-R)-1;
    if (dwarfTmp.width<D) { dwarfTmp.width=D; dwarfTmp.height=D; }
    const img=dwarfTctx.createImageData(D,D), data=img.data;
    const Lx=-0.5,Ly=-0.56,Lz=0.66, Ll=1/Math.hypot(Lx,Ly,Lz), lx=Lx*Ll, ly=Ly*Ll, lz=Lz*Ll;
    for (let j=0;j<D;j++) for (let i=0;i<D;i++) {
        const nx=(x0+i-cx)/R, ny=(y0+j-cy)/R, d2=nx*nx+ny*ny, o=(j*D+i)*4;
        if (d2>1) { data[o+3]=0; continue; }
        const nz=Math.sqrt(1-d2), cny=ny<-1?-1:ny>1?1:ny, lat=Math.asin(cny), lon=Math.atan2(nx,nz)+rot;
        let u=(lon/TAU)%1; if(u<0)u+=1; const vv=lat/Math.PI+0.5;
        let tx=(u*TW)|0; if(tx>=TW)tx=TW-1; let ty=(vv*TH)|0; if(ty>=TH)ty=TH-1; const to=(ty*TW+tx)*3;
        let diff=nx*lx+ny*ly+nz*lz; if(diff<0)diff=0; const sh=(0.26+0.95*diff)*(0.5+0.5*nz);
        data[o]=TX[to]*sh; data[o+1]=TX[to+1]*sh; data[o+2]=TX[to+2]*sh; data[o+3]=255;
    }
    dwarfTctx.putImageData(img,0,0);
    ctx.drawImage(dwarfTmp,0,0,D,D, x0,y0,D,D);
}
function drawDwarfClump(o, t) {
    const cp = o.clumpPos(), pr = o.pebbleR();
    for (const b of o.list()) {
        if (b.pulse > 0) {
            ctx.beginPath(); ctx.arc(cp.x, cp.y, pr+3+(1-b.pulse)*12, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(180,120,60,${b.pulse*0.45})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        drawDwarfSphere(cp.x, cp.y, pr, t);
    }
}

function drawReticle(x, y, s, g = ctx) {
    const a = 7;
    g.strokeStyle = 'rgba(60,80,70,0.85)';
    g.lineWidth = 1.5;
    for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
        const cx = x + sx*s, cy = y + sy*s;
        g.beginPath();
        g.moveTo(cx - sx*a, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - sy*a);
        g.stroke();
    }
}

function drawComet(t) {
    const g = cometCtx;
    g.clearRect(0, 0, innerWidth, innerHeight);
    const c = G.comet;
    if (c) {
        for (let i=0; i<14; i++) {
            const f=i/14;
            g.beginPath(); g.arc(c.x-c.vx*f*0.45, c.y-c.vy*f*0.45,(1-f)*4,0,Math.PI*2);
            g.fillStyle=`rgba(60,80,70,${(1-f)*0.22})`; g.fill();
        }
        g.beginPath(); g.arc(c.x,c.y,6,0,Math.PI*2); g.fillStyle='#2a2a2a'; g.fill();
        g.beginPath(); g.arc(c.x,c.y,16+3*Math.sin(t*6),0,Math.PI*2);
        g.strokeStyle='rgba(60,80,70,0.28)'; g.lineWidth=1.5; g.stroke();
        if (Math.hypot(winMx-c.x, winMy-c.y) < COMET_HOVER_R) {
            drawReticle(c.x, c.y, 18 + Math.sin(t*4)*1.5, g);
            g.fillStyle='rgba(60,80,70,0.9)'; g.font="600 12px 'Segoe UI',sans-serif";
            g.textAlign='center'; g.textBaseline='alphabetic';
            g.fillText('Comet', c.x, c.y - 28);
        }
    }
    for (const fx of cometFx) {
        const a = Math.max(0, 1 - fx.age/fx.maxAge);
        g.beginPath(); g.arc(fx.x, fx.y, 14 + (1-a)*42, 0, Math.PI*2);
        g.strokeStyle=`rgba(60,80,70,${a*0.4})`; g.lineWidth=2; g.stroke();
        g.fillStyle=`rgba(26,26,26,${a})`; g.font="600 22px 'Segoe UI',sans-serif";
        g.textAlign='center'; g.textBaseline='middle';
        g.fillText(fx.text, fx.x, fx.y - fx.age*38);
    }
}

function draw(t) {
    ctx.fillStyle = '#f4efe4';
    ctx.fillRect(0,0,W,H);

    drawStars(t);

    for (const o of ORBITERS) if (o.list().length) {
        ctx.beginPath(); ctx.arc(CX,CY,orbitR(o.ring),0,Math.PI*2);
        ctx.strokeStyle='rgba(100,90,80,0.17)'; ctx.lineWidth=1; ctx.stroke();
    }

    const pulse=1+0.04*Math.sin(t*1.8), sunR=13*pulse;

    const reso = lvl('resonance');
    if (reso > 0) {
        const a = 0.09 + 0.03 * (reso - 1);
        const R = sunR * 5.6;
        const blobs = [
            [0, 0, 1.0, 1.0, 0.5, 0.0],
            [Math.cos(t*0.37)*sunR*0.9,      Math.sin(t*0.31)*sunR*0.8,  0.72, 0.6, 0.8, 1.7],
            [Math.cos(t*0.23+2.1)*sunR*0.85, Math.sin(t*0.41+1.3)*sunR*0.95, 0.58, 0.5, 1.2, 3.4],
        ];
        for (const [dx,dy,rs,ms,sf,sp] of blobs) {
            const shimmer = 0.7 + 0.3*Math.sin(t*sf + sp);
            const cx=CX+dx, cy=CY+dy, r=R*rs*(1 + 0.06*Math.sin(t*sf*0.7 + sp));
            const aa = a*ms*shimmer;
            const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
            g.addColorStop(0,`rgba(160,130,70,${aa})`);
            g.addColorStop(0.55,`rgba(160,120,60,${aa*0.4})`);
            g.addColorStop(1,'rgba(160,120,60,0)');
            ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
    }

    if (deepBreathFlash >= 0) {
        const fp = (t - deepBreathFlash) / DEEP_FLARE_DUR;
        if (fp >= 0 && fp < 1) {
            const env = Math.sin(fp * Math.PI);
            const R = sunR * (3.0 + fp * 3.0);
            const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
            g.addColorStop(0,   `rgba(202,162,74,${0.30 * env})`);
            g.addColorStop(0.55,`rgba(202,162,74,${0.12 * env})`);
            g.addColorStop(1,   'rgba(202,162,74,0)');
            ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
    }

    const fx = clickFxTransform(t);
    ctx.beginPath(); ctx.ellipse(CX+fx.dx, CY+fx.dy, sunR*fx.sx, sunR*fx.sy, 0, 0, Math.PI*2);
    ctx.fillStyle='#1a1a1a'; ctx.fill();

    for (const o of ORBITERS) if (o.list().length) {
        if (o.sphere)     drawDwarfClump(o, t);
        else if (o.round) drawRoundClump(o, t);
        else              drawClump(o.list(), o.clumpPos(), o.pebbleR(), o.color(), t);
    }

    if (cosmoOver) {
        const breathe = Math.sin(t*4) * 1.5;
        const tgt = cosmoTargetAt(cosmoMx, cosmoMy);
        if (tgt === 'maw')           drawReticle(CX, CY, 20 + breathe);
        else if (tgt) { const o = ORBITER_BY_ID[tgt]; if (o) { const p = o.clumpPos();
            drawReticle(p.x, p.y, Math.max(o.pebbleR() + 8, 16) + breathe); } }
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
