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
let ferroPulseFlash = -1;              // asteroid Ferromagnetic Pulse: field-line arcs on each pulse
const FERRO_DUR = 0.45;
let slingFlash = -1;                   // asteroid Gravitational Slingshot: whip flash on the burst
const SLING_WHIP_DUR = 0.6;
let eclipseFlash = -1;                  // moon Solar Eclipse: shadow + corona over Maw
const ECLIPSE_DUR = 1.5;
let standstillFlash = -1;               // moon Lunar Standstill: big silver flare at the moon
const STANDSTILL_DUR = 1.4;
let dwarfStoreFlash = -1;               // dwarf Stored Winter: frost-burst on release
const DWARF_STORE_DUR = 0.8;

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
// the asteroid body's actual drawn position (clump + its local wobble) - so FX aim at the rock, not the orbit line
function asteroidBodyPos(t) {
    const cp = asteroidClumpPos(), b = G.asteroids[0];
    if (!b) return cp;
    const la = b.localPhase + t * b.localSpin;
    return { x: cp.x + Math.cos(la) * b.localR, y: cp.y + Math.sin(la) * b.localR };
}

function moonClumpPos() { const r=orbitR(2); return { x:CX+Math.cos(G.moonClump.angle)*r, y:CY+Math.sin(G.moonClump.angle)*r }; }
function dwarfClumpPos() { const r=orbitR(3); return { x:CX+Math.cos(G.dwarfClump.angle)*r, y:CY+Math.sin(G.dwarfClump.angle)*r }; }

function drawClump(list, cp, pr, color, t) {
    const ident = list.length && !list[0].motes;                                  // dust clump (the asteroid carries motes)
    const frost = ident && typeof lvl === 'function' && lvl('iceMantles') > 0;     // Ice Mantles identity -> frost rim
    const devil = (ident && typeof dustDevilFrac === 'function') ? dustDevilFrac() : 0;   // Dust Devil -> tightening, faster whirl
    for (const o of list) {
        const la = o.localPhase + t*o.localSpin*(1 + devil*2.2);
        const lr = o.localR * (1 - devil*0.55);
        const px = cp.x + Math.cos(la)*lr, py = cp.y + Math.sin(la)*lr;
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
        if (frost) { ctx.lineWidth = Math.max(1, pr*0.18); ctx.strokeStyle = 'rgba(205,228,248,0.85)'; ctx.stroke(); }

        // far-side shadow (asteroid stronger, dust fainter) - the gradient is in local coords, so one
        // per (radius, strength) is built once and reused every frame
        ctx.clip();
        ctx.rotate(-la*1.5);
        ctx.fillStyle = clumpShade(pr, !!o.motes);
        ctx.fillRect(-pr*2.5,-pr*2.5,pr*5,pr*5);
        ctx.restore();


        if (o.motes) {
            for (const mte of o.motes) {
                const ma = mte.phase + t*mte.spin;
                const mx = px + Math.cos(ma)*pr*mte.dist, my = py + Math.sin(ma)*pr*mte.dist;
                ctx.beginPath(); ctx.arc(mx,my,mte.size,0,Math.PI*2);
                ctx.fillStyle='rgba(138,135,130,0.5)'; ctx.fill();
            }
            drawAsteroidIdentityFx(px, py, pr, t);   // Rubble Pile / Prospector / Slingshot / Meteor Shower
        }
    }
}

const clumpShadeCache = new Map();   // `${pr}|strength` -> radial gradient (local coords, frame-reusable)
function clumpShade(pr, strong) {
    const key = pr.toFixed(2) + (strong ? 'A' : 'D');
    let g = clumpShadeCache.get(key);
    if (!g) {
        const lx=-pr*0.45, ly=-pr*0.55;
        g = ctx.createRadialGradient(lx,ly,pr*0.15, lx,ly,pr*2.1);
        g.addColorStop(0,'rgba(0,0,0,0)');
        if (strong) { g.addColorStop(0.5,'rgba(20,16,12,0.10)');  g.addColorStop(1,'rgba(20,16,12,0.34)'); }
        else        { g.addColorStop(0.55,'rgba(20,16,12,0.05)'); g.addColorStop(1,'rgba(20,16,12,0.20)'); }
        clumpShadeCache.set(key, g);
    }
    return g;
}

// Asteroid identity visuals (drawn on the asteroid body; each guarded by its own level).
function drawAsteroidIdentityFx(px, py, pr, t) {
    if (typeof lvl !== 'function') return;
    // Rubble Pile: one small pebble orbits per dust particle you own
    if (lvl('rubblepile') > 0) {
        const n = G.planets.length;
        for (let i = 0; i < n; i++) {
            const a = t*0.7 + i*(Math.PI*2/Math.max(1,n));
            const rx = px + Math.cos(a)*pr*1.75, ry = py + Math.sin(a)*pr*1.75;
            ctx.beginPath(); ctx.arc(rx, ry, pr*0.24, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(120,108,90,0.8)'; ctx.fill();
        }
    }
    // Prospector's Cut: twinkling crystalline motes (raw shine)
    if (lvl('prospector') > 0) {
        for (let i = 0; i < 5; i++) {
            const a = t*0.85 + i*1.3, rr = pr*(1.15 + 0.5*Math.sin(t*1.6 + i));
            const cx = px + Math.cos(a)*rr, cy = py + Math.sin(a)*rr;
            const tw = 0.5 + 0.5*Math.sin(t*4.5 + i*2.1);
            ctx.beginPath(); ctx.arc(cx, cy, pr*0.15, 0, Math.PI*2);
            ctx.fillStyle = `rgba(150,220,228,${(0.3 + 0.45*tw).toFixed(3)})`; ctx.fill();
        }
    }
    // Gravitational Slingshot: a violet wind-up trail that FOLLOWS the orbit arc behind the rock, growing with charge
    // (Meteor Shower has no visual by design - the effect is comets arriving sooner.)
    if (typeof slingshotFrac === 'function' && slingshotFrac() > 0) {
        const f = slingshotFrac(), R = orbitR(1), ang = G.asteroidClump.angle;   // trail back along the trajectory (smaller angle = where it came from)
        const trailLen = 0.12 + f*0.85, steps = 24;
        ctx.lineWidth = pr*0.5; ctx.lineCap = 'round';
        for (let i = 0; i < steps; i++) {
            const a0 = ang - trailLen*(i/steps), a1 = ang - trailLen*((i+1)/steps);
            ctx.strokeStyle = `rgba(178,150,250,${(0.6*f*(1 - i/steps)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(CX+Math.cos(a0)*R, CY+Math.sin(a0)*R); ctx.lineTo(CX+Math.cos(a1)*R, CY+Math.sin(a1)*R); ctx.stroke();
        }
    }
}

const MOON_LX = -0.62, MOON_LY = -0.55;
const MOON_LANG = Math.atan2(MOON_LY, MOON_LX);
const MOON_CRATERS = [[-0.30,-0.26,0.16],[0.30,0.12,0.12],[0.05,0.36,0.10],[0.36,-0.30,0.08],[-0.22,0.30,0.075],[-0.42,0.06,0.055],[0.16,-0.12,0.06]];

function moonCrater(g, cx, cy, r, dx, dy, cr) {
    const x = cx + dx*r, y = cy + dy*r, rad = cr*r;
    g.fillStyle = 'rgba(44,48,54,0.16)';
    g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    g.lineWidth = Math.max(0.6, rad*0.34);
    g.strokeStyle = 'rgba(228,230,232,0.40)';
    g.beginPath(); g.arc(x, y, rad*0.92, MOON_LANG-1.0, MOON_LANG+1.0); g.stroke();
    g.strokeStyle = 'rgba(26,29,34,0.30)';
    g.beginPath(); g.arc(x, y, rad*0.92, MOON_LANG+Math.PI-1.0, MOON_LANG+Math.PI+1.0); g.stroke();
}

// The disc only depends on the phase + identity state, never on the orbit position - so it renders into
// an offscreen ONLY when its quantized key changes (~16x/s at the terminator's fastest, 0 while paused)
// instead of running the blur-filter terminator + 3 radial gradients every frame. Per-frame cost is one
// drawImage. 256 phase steps over the 16s cycle keep the terminator sweep sub-pixel per step.
const moonOffC = document.createElement('canvas'), moonOffG = moonOffC.getContext('2d');
let moonOffKey = '';
function drawMoonDisc(cx, cy, r, phase) {
    const alb = (typeof lvl === 'function') ? lvl('albedo') : 0;
    const bm  = (typeof lvl === 'function') ? lvl('bloodmoon') : 0;
    const lit = bm > 0 ? moonLit() : 0;
    const ss  = (typeof standstillFrac === 'function') ? standstillFrac() : 0;
    const pad = Math.ceil(r*0.8) + 2, size = Math.ceil(r*2) + pad*2, half = size/2;
    const dpr = window.devicePixelRatio || 1;
    const key = r.toFixed(2)+'|'+Math.round(phase*256)+'|'+alb+'|'+bm+'|'+Math.round(lit*48)+'|'+Math.round(ss*48)+'|'+dpr;
    if (key !== moonOffKey) {
        moonOffKey = key;
        const px = Math.ceil(size*dpr);
        if (moonOffC.width !== px) { moonOffC.width = moonOffC.height = px; }
        moonOffG.setTransform(dpr,0,0,dpr,0,0);
        moonOffG.clearRect(0, 0, size, size);
        renderMoonDisc(moonOffG, half, half, r, phase, alb, bm, lit, ss);
    }
    ctx.drawImage(moonOffC, cx-half, cy-half, size, size);
}
function renderMoonDisc(g, cx, cy, r, phase, alb, bm, lit, ss) {
    g.save();
    g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();

    const grad = g.createRadialGradient(cx+MOON_LX*r*0.5, cy+MOON_LY*r*0.5, r*0.08, cx-MOON_LX*r*0.3, cy-MOON_LY*r*0.3, r*1.35);
    grad.addColorStop(0,    '#d3d6d8');
    grad.addColorStop(0.45, '#9aa0a4');
    grad.addColorStop(0.8,  '#6a7075');
    grad.addColorStop(1,    '#454b51');
    g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();

    // Albedo identity: brighter face / Blood Moon identity: copper-red lit face, strongest at full
    if (alb > 0) { g.fillStyle = `rgba(255,255,255,${(0.055*alb).toFixed(3)})`; g.beginPath(); g.arc(cx,cy,r,0,7); g.fill(); }
    if (bm > 0)  { g.fillStyle = `rgba(150,40,22,${(0.5*lit*Math.min(1,bm/3)).toFixed(3)})`; g.beginPath(); g.arc(cx,cy,r,0,7); g.fill(); }

    for (const [dx, dy, cr] of MOON_CRATERS) moonCrater(g, cx, cy, r, dx, dy, cr);

    const a = r * Math.cos(2*Math.PI*phase);
    const waxing = phase < 0.5;
    const bulgeRight = waxing ? (a > 0) : (a < 0);
    g.save();
    g.filter = `blur(${(r*0.06).toFixed(2)}px)`;
    g.fillStyle = 'rgba(20,22,28,0.80)';
    const rs = r * 1.06;
    g.beginPath();
    g.arc(cx, cy, rs, -Math.PI/2, Math.PI/2, waxing);
    if (bulgeRight) g.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, -Math.PI/2, true);
    else            g.ellipse(cx, cy, Math.abs(a), rs, 0, Math.PI/2, Math.PI*1.5, false);
    g.closePath(); g.fill();
    g.restore();

    const lg = g.createRadialGradient(cx, cy, r*0.5, cx, cy, r*1.02);
    lg.addColorStop(0,    'rgba(0,0,0,0)');
    lg.addColorStop(0.72, 'rgba(0,0,0,0)');
    lg.addColorStop(1,    'rgba(12,14,18,0.30)');
    g.fillStyle = lg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.restore();

    g.strokeStyle = 'rgba(60,64,70,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();

    // Lunar Standstill identity: a soft silver glow builds around the disc as the standstill nears
    if (ss > 0) {
        const R = r * (1.3 + 0.4*ss), gr = g.createRadialGradient(cx, cy, r*0.9, cx, cy, R);
        gr.addColorStop(0, 'rgba(212,222,238,0)');
        gr.addColorStop(0.72, `rgba(212,222,238,${(0.26*ss).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(212,222,238,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    }
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
// The per-pixel sphere render (sqrt/asin/atan2 per pixel + an ImageData alloc) used to run every frame
// for the dwarf AND both trojans. The sphere only changes with its rotation, so frames are cached in a
// per-size sprite sheet: 240 rotation steps (sub-pixel band motion per step), each cell rendered once on
// first use. After one full spin (~29s) every sphere is a single drawImage per frame, zero allocation.
const DWARF_ROT_STEPS = 240, DWARF_SHEET_COLS = 16;
const dwarfSheets = new Map();   // diameter D -> { canvas, g, done: Uint8Array(steps) }
function renderDwarfFrame(sheet, step, D, R, rot) {
    const TW=EMBER_TEX.w, TH=EMBER_TEX.h, TX=EMBER_TEX.data, TAU=Math.PI*2, C=R+1;
    const img=sheet.g.createImageData(D,D), data=img.data;
    const Lx=-0.5,Ly=-0.56,Lz=0.66, Ll=1/Math.hypot(Lx,Ly,Lz), lx=Lx*Ll, ly=Ly*Ll, lz=Lz*Ll;
    for (let j=0;j<D;j++) for (let i=0;i<D;i++) {
        const nx=(i-C)/R, ny=(j-C)/R, d2=nx*nx+ny*ny, o=(j*D+i)*4;
        if (d2>1) { data[o+3]=0; continue; }
        const nz=Math.sqrt(1-d2), cny=ny<-1?-1:ny>1?1:ny, lat=Math.asin(cny), lon=Math.atan2(nx,nz)+rot;
        let u=(lon/TAU)%1; if(u<0)u+=1; const vv=lat/Math.PI+0.5;
        let tx=(u*TW)|0; if(tx>=TW)tx=TW-1; let ty=(vv*TH)|0; if(ty>=TH)ty=TH-1; const to=(ty*TW+tx)*3;
        let diff=nx*lx+ny*ly+nz*lz; if(diff<0)diff=0; const sh=(0.26+0.95*diff)*(0.5+0.5*nz);
        data[o]=TX[to]*sh; data[o+1]=TX[to+1]*sh; data[o+2]=TX[to+2]*sh; data[o+3]=255;
    }
    sheet.g.putImageData(img, (step % DWARF_SHEET_COLS) * D, ((step / DWARF_SHEET_COLS) | 0) * D);
}
function drawDwarfSphere(cx, cy, R, t) {
    if (!EMBER_TEX) buildEmberTex();
    const TAU=Math.PI*2, D=Math.ceil(R*2)+2, x0=Math.round(cx-R)-1, y0=Math.round(cy-R)-1;
    let sheet = dwarfSheets.get(D);
    if (!sheet) {
        const c = document.createElement('canvas');
        c.width  = DWARF_SHEET_COLS * D;
        c.height = Math.ceil(DWARF_ROT_STEPS / DWARF_SHEET_COLS) * D;
        sheet = { canvas: c, g: c.getContext('2d'), done: new Uint8Array(DWARF_ROT_STEPS) };
        dwarfSheets.set(D, sheet);
    }
    const step = ((Math.floor(t*0.22 / TAU * DWARF_ROT_STEPS) % DWARF_ROT_STEPS) + DWARF_ROT_STEPS) % DWARF_ROT_STEPS;
    if (!sheet.done[step]) { renderDwarfFrame(sheet, step, D, R, step / DWARF_ROT_STEPS * TAU); sheet.done[step] = 1; }
    ctx.drawImage(sheet.canvas, (step % DWARF_SHEET_COLS) * D, ((step / DWARF_SHEET_COLS) | 0) * D, D, D, x0, y0, D, D);
}
function drawDwarfClump(o, t) {
    const cp = o.clumpPos(), pr = o.pebbleR();
    const b = o.list()[0];
    if (!b) return;
    const r = orbitR(3), tc = (typeof dwarfTrojanCount === 'function') ? dwarfTrojanCount() : 0;

    // Trojan companions at ±60° (smaller embers, drawn first so the dwarf reads on top)
    for (let i = 0; i < tc; i++) {
        const ang = G.dwarfClump.angle + DWARF_TROJAN_OFF[i];
        const tx = CX + Math.cos(ang)*r, ty = CY + Math.sin(ang)*r, tr = pr*0.52;
        const tp = b.troj ? b.troj[i] : 0;
        if (tp > 0) {
            ctx.beginPath(); ctx.arc(tx, ty, tr+3+(1-tp)*9, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(180,120,60,${tp*0.4})`; ctx.lineWidth = 1.2; ctx.stroke();
        }
        drawDwarfSphere(tx, ty, tr, t*0.85 + i*1.7);
    }

    // Main dwarf
    if (b.pulse > 0) {
        ctx.beginPath(); ctx.arc(cp.x, cp.y, pr+3+(1-b.pulse)*12, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(180,120,60,${b.pulse*0.45})`; ctx.lineWidth = 1.5; ctx.stroke();
    }
    drawDwarfSphere(cp.x, cp.y, pr, t);
    drawDwarfIdentityFx(cp.x, cp.y, pr, t);
}

// Dwarf identity visuals (drawn on Ember; each guarded by its own level).
function drawDwarfIdentityFx(cx, cy, pr, t) {
    if (typeof lvl !== 'function') return;
    // Gravitational Anchor: gravity-well ripples emanate from Ember (bolder, [SCI])
    if (lvl('anchor') > 0) {
        const rings = 2 + lvl('anchor');
        for (let i = 0; i < rings; i++) {
            const ph = (t*0.4 + i/rings) % 1, R = pr*(1.1 + ph*1.9);
            ctx.strokeStyle = `rgba(120,140,180,${(0.22*(1-ph)).toFixed(3)})`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
        }
    }
    // The Long Now: a warm halo that intensifies over the universe's life
    if (lvl('longnow') > 0 && typeof longNowFrac === 'function') {
        const f = longNowFrac();
        if (f > 0.02) {
            const R = pr*(1.25 + 0.25*f), gr = ctx.createRadialGradient(cx,cy,pr*0.85,cx,cy,R);
            gr.addColorStop(0, 'rgba(232,182,112,0)');
            gr.addColorStop(0.7, `rgba(232,182,112,${(0.30*f).toFixed(3)})`);
            gr.addColorStop(1, 'rgba(232,182,112,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
        }
    }
    // Glacial Orbit: a cold wash over the sphere + a frost rim
    if (lvl('glacial') > 0) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,pr,0,7); ctx.clip();
        ctx.fillStyle = 'rgba(150,195,230,0.26)'; ctx.beginPath(); ctx.arc(cx,cy,pr,0,7); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(205,230,248,0.7)'; ctx.lineWidth = Math.max(1, pr*0.1);
        ctx.beginPath(); ctx.arc(cx,cy,pr*0.97,0,7); ctx.stroke();
    }
    // Stored Winter: a frost rim brightens with the banked hoard, a frost-burst on release
    if (lvl('storedwinter') > 0 && typeof storedWinterFrac === 'function') {
        const f = storedWinterFrac();
        if (f > 0.02) {
            ctx.strokeStyle = `rgba(190,220,245,${(0.6*f).toFixed(3)})`; ctx.lineWidth = Math.max(1, pr*0.14*f + 0.5);
            ctx.beginPath(); ctx.arc(cx,cy,pr*1.08,0,7); ctx.stroke();
        }
    }
    if (dwarfStoreFlash >= 0) {
        const sp = (t - dwarfStoreFlash) / DWARF_STORE_DUR;
        if (sp >= 0 && sp < 1) {
            const env = Math.sin(sp*Math.PI), R = pr*(1.2 + 2.0*sp);
            const gr = ctx.createRadialGradient(cx,cy,pr,cx,cy,R);
            gr.addColorStop(0, `rgba(210,235,255,${(0.55*env).toFixed(3)})`); gr.addColorStop(1, 'rgba(210,235,255,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
        }
    }
    // Distant Kin: a faint spiral glimmer turns over Ember (echoing the Vortex)
    if (lvl('distantkin') > 0) {
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.5);
        ctx.strokeStyle = 'rgba(150,130,175,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a < 4.5; a += 0.2) { const rr = pr*0.3 + a*pr*0.17, x = Math.cos(a)*rr, y = Math.sin(a)*rr; a === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); }
        ctx.stroke(); ctx.restore();
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

let cometLayerHad = true;   // whether the overlay held anything last frame (starts true so the first frame clears)
function drawCometBody(g, c, t) {
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
function drawComet(t) {
    const has = !!G.comet || cometFx.length > 0 || (typeof swarmActive === 'function' && swarmActive());
    if (!has && !cometLayerHad) return;   // idle: skip the full-window clear entirely
    cometLayerHad = has;
    const g = cometCtx;
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (G.comet) drawCometBody(g, G.comet, t);
    if (typeof swarmComets !== 'undefined') for (const c of swarmComets) drawCometBody(g, c, t);
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
        const a = (0.09 + 0.03 * (reso - 1)) * 1.1;   // ~10% more intense
        const R = sunR * 6.72;                         // ~20% larger spread (was 5.6)
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

    // Moon Spring Tide: a cool halo gathers on Maw as the moon fills, fading at the new moon (behind the core)
    if (typeof lvl === 'function' && lvl('springtide') > 0 && G.moons.length) {
        const a = 0.16 * moonLit() * Math.min(1, lvl('springtide')/3);
        if (a > 0.002) {
            const R = sunR * 7, gr = ctx.createRadialGradient(CX,CY,0,CX,CY,R);
            gr.addColorStop(0, `rgba(120,170,220,${a.toFixed(3)})`);
            gr.addColorStop(0.5, `rgba(120,170,220,${(a*0.4).toFixed(3)})`);
            gr.addColorStop(1, 'rgba(120,170,220,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2); ctx.fill();
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

    // Asteroid Ferromagnetic Pulse: bowed field-lines snap between Maw and the asteroid BODY (tracks the moving rock) on each pulse
    if (ferroPulseFlash >= 0 && typeof lvl === 'function' && lvl('ferropulse') > 0 && G.asteroids.length) {
        const fp = (t - ferroPulseFlash) / FERRO_DUR;
        if (fp >= 0 && fp < 1) {
            const env = Math.sin(fp*Math.PI), ap = asteroidBodyPos(t);
            const dx = ap.x - CX, dy = ap.y - CY, dd = Math.hypot(dx,dy)||1, nx = -dy/dd, ny = dx/dd;
            ctx.lineWidth = 1.5;
            for (let i = -1; i <= 1; i++) {
                const off = i * dd * 0.17;
                const cxp = (CX+ap.x)/2 + nx*off, cyp = (CY+ap.y)/2 + ny*off;
                ctx.strokeStyle = `rgba(120,180,235,${(0.5*env*(1-Math.abs(i)*0.28)).toFixed(3)})`;
                ctx.beginPath(); ctx.moveTo(CX,CY); ctx.quadraticCurveTo(cxp,cyp,ap.x,ap.y); ctx.stroke();
            }
        }
    }
    // Asteroid Gravitational Slingshot: a bright whip arcing back along the orbit trajectory + a bloom at the rock
    if (slingFlash >= 0 && G.asteroids.length) {
        const sp = (t - slingFlash) / SLING_WHIP_DUR;
        if (sp >= 0 && sp < 1) {
            const env = Math.sin(sp*Math.PI), R = orbitR(1), ang = G.asteroidClump.angle;
            const whipLen = 0.5 + 0.9*sp, steps = 26;
            ctx.lineCap = 'round';
            for (let i = 0; i < steps; i++) {
                const a0 = ang - whipLen*(i/steps), a1 = ang - whipLen*((i+1)/steps), k = 1 - i/steps;
                ctx.strokeStyle = `rgba(200,175,255,${(0.85*env*k).toFixed(3)})`;
                ctx.lineWidth = (3.5*env+1) * (0.4 + 0.6*k);
                ctx.beginPath(); ctx.moveTo(CX+Math.cos(a0)*R, CY+Math.sin(a0)*R); ctx.lineTo(CX+Math.cos(a1)*R, CY+Math.sin(a1)*R); ctx.stroke();
            }
            const ap = asteroidBodyPos(t), Rb = 26*env+6, bg = ctx.createRadialGradient(ap.x,ap.y,0,ap.x,ap.y,Rb);
            bg.addColorStop(0,`rgba(210,190,255,${(0.5*env).toFixed(3)})`); bg.addColorStop(1,'rgba(210,190,255,0)');
            ctx.beginPath(); ctx.arc(ap.x,ap.y,Rb,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill();
        }
    }
    // Moon Solar Eclipse: sound-only (the sfxComet cue in moonOnOrbit); the screen-dim visual was removed by request.
    // Moon Lunar Standstill: a big silver flare at the moon on release
    if (standstillFlash >= 0 && G.moons.length) {
        const sp = (t - standstillFlash) / STANDSTILL_DUR;
        if (sp >= 0 && sp < 1) {
            const env = Math.sin(sp*Math.PI), mp = moonClumpPos(), R = 50*env + 10;
            const gr = ctx.createRadialGradient(mp.x,mp.y,0,mp.x,mp.y,R);
            gr.addColorStop(0, `rgba(232,240,252,${(0.7*env).toFixed(3)})`);
            gr.addColorStop(0.5, `rgba(212,224,242,${(0.3*env).toFixed(3)})`);
            gr.addColorStop(1, 'rgba(212,224,242,0)');
            ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(mp.x,mp.y,R,0,Math.PI*2); ctx.fill();
        }
    }
    // Dust Poynting-Robertson Drag: a shed grain spirals inward and winks out into Maw
    if (typeof dustFallFx !== 'undefined') {
        for (const f of dustFallFx) {
            const p = f.age / f.maxAge, ease = p*p;
            const r0 = Math.hypot(f.sx - CX, f.sy - CY), ang = Math.atan2(f.sy - CY, f.sx - CX) + p*3.5;
            const rr = r0 * (1 - ease), x = CX + Math.cos(ang)*rr, y = CY + Math.sin(ang)*rr, a = (1 - p) * 0.75;
            ctx.beginPath(); ctx.arc(x, y, 2.6*(1 - ease*0.5), 0, Math.PI*2); ctx.fillStyle = `rgba(138,135,130,${a.toFixed(3)})`; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, 5*(1 - p), 0, Math.PI*2); ctx.strokeStyle = `rgba(150,150,150,${(a*0.4).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
        }
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
