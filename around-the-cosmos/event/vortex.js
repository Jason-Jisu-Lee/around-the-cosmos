'use strict';

const VTAU = Math.PI * 2;

const VX = {
    SPAWN_MIN: 2.5 * 60,
    SPAWN_MAX: 3.5 * 60,
    FIRST_DELAY: 2 * 60,   // the first vortex of a session appears 2 min later than the usual cadence
    FADE_IN:   1.0,
    STAY:      5.0,
    HOLD:      3.0,
    ABSORB:    0.8,
    FADE_OUT:  2.0,
    SPIN_MAX:  1.1,
    RENDER_R:  150,
    REWARD_MULT: 4,
    GRAB_FRAC: 1.15,
    SIZE_MIN: 0.085,
    SIZE_MAX: 0.125,
};

let vortexBitmap = null, vortexBitmapDiscR = 0;
let vortexTimer = VX.FIRST_DELAY + VX.SPAWN_MIN + Math.random() * (VX.SPAWN_MAX - VX.SPAWN_MIN);
const vortexFx = [];
const VTX = { active:false, phase:'idle', t:0, fade:0, spin:0, spinRate:0,
              stayLeft:0, hold:0, shrink:0, holding:false, cx:0, cy:0, R:0, grabR:0, flash:0 };

let vortexLayer = null, vortexCtx = null;

function vxSmooth(a, b, x){ const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); }
function vxMul(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
function vxHash(x,y){ let h=(x|0)*374761393+(y|0)*668265263; h=Math.imul(h^(h>>>13),1274126177); return((h^(h>>>16))>>>0)/4294967296; }
function vxVN(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
    const a=vxHash(xi,yi),b=vxHash(xi+1,yi),c=vxHash(xi,yi+1),d=vxHash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function vxFBM(x,y){ return 0.55*vxVN(x,y)+0.30*vxVN(x*2.1+5,y*2.1-3)+0.15*vxVN(x*4.4-7,y*4.4+9); }
function vxSpeck(buf,W,H,x,y,rad,cr,cg,cb,a,mode){
    const x0=Math.max(0,(x-rad)|0),x1=Math.min(W-1,(x+rad+1)|0),y0=Math.max(0,(y-rad)|0),y1=Math.min(H-1,(y+rad+1)|0);
    for(let py=y0;py<=y1;py++)for(let px=x0;px<=x1;px++){ const dx=px-x,dy=py-y,d=Math.hypot(dx,dy); if(d>rad)continue;
        const fall=1-d/rad, aa=a*fall*fall, o=(py*W+px)*3;
        if(mode==='lighten'){ buf[o]=255-(255-buf[o])*(1-aa*cr/255); buf[o+1]=255-(255-buf[o+1])*(1-aa*cg/255); buf[o+2]=255-(255-buf[o+2])*(1-aa*cb/255); }
        else{ buf[o]=buf[o]*(1-aa)+cr*aa; buf[o+1]=buf[o+1]*(1-aa)+cg*aa; buf[o+2]=buf[o+2]*(1-aa)+cb*aa; } } }
function vxBlur(buf,W,H,w){ const tmp=new Float32Array(buf.length);
    for(let c=0;c<3;c++)for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,n=0;for(let k=-w;k<=w;k++){const xx=x+k;if(xx<0||xx>=W)continue;s+=buf[(y*W+xx)*3+c];n++;}tmp[(y*W+x)*3+c]=s/n;}
    for(let c=0;c<3;c++)for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,n=0;for(let k=-w;k<=w;k++){const yy=y+k;if(yy<0||yy>=H)continue;s+=tmp[(yy*W+x)*3+c];n++;}buf[(y*W+x)*3+c]=s/n;} }

const VX_BG = [244, 239, 228];
function renderVortexBitmap(R){
    const S=Math.ceil(R*2.8), W=S, H=S, cx=S/2, cy=S/2;
    const buf=new Float32Array(W*H*3);
    for(let i=0;i<W*H;i++){ buf[i*3]=VX_BG[0]; buf[i*3+1]=VX_BG[1]; buf[i*3+2]=VX_BG[2]; }
    const rng=vxMul(20260624);
    const Rin=R*0.04, K=-3.0, M=2, SHARP=2.0, ink=[64,48,28], wht=[255,247,226];
    function armOf(phi){ let s=Math.pow((Math.cos(M*phi)+1)/2, SHARP);
        s+=0.45*Math.pow((Math.cos(M*phi+2.0)+1)/2, SHARP+1); s+=0.22*Math.pow((Math.cos(5*phi+0.6)+1)/2, SHARP+2);
        s+=0.15*Math.pow((Math.cos(3*phi-1.0)+1)/2, SHARP+2); return Math.min(1, s/1.5); }
    const densDark=t=>(1-vxSmooth(0.58,1.06,t))*vxSmooth(0.05,0.17,t)*(0.7+0.3*Math.pow(vxSmooth(0.05,0.42,t),0.5));
    const densBright=t=>(1-vxSmooth(0.30,0.48,t))*(0.45+0.55*vxSmooth(0.0,0.05,t));
    const arm=(r,th)=>armOf(th - K*Math.log(Math.max(r,Rin)/Rin));
    const clumpAt=(r,th)=>{ const lr=Math.log(Math.max(r,Rin)/Rin),phi=th-K*lr; return 0.30+1.25*vxFBM(Math.cos(phi)*2.2+r*0.013, Math.sin(phi)*2.2+lr*1.6); };
    for(let i=0;i<46;i++){ const ang=rng()*VTAU, rr=R*(0.2+rng()*1.05);
        vxSpeck(buf,W,H,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr, 0.5+rng()*1.3, 150,120,66, 0.12+rng()*0.5,'darken'); }
    const RB=R*1.15;
    for(let py=Math.max(0,(cy-RB)|0); py<=Math.min(H-1,(cy+RB)|0); py++)
    for(let px=Math.max(0,(cx-RB)|0); px<=Math.min(W-1,(cx+RB)|0); px++){
        const dx=px-cx, dy=py-cy, r=Math.hypot(dx,dy); if(r>RB) continue;
        const t=r/R, lr=Math.log(Math.max(r,Rin)/Rin), th=Math.atan2(dy,dx), phi=th-K*lr;
        const av=armOf(phi); const cl=0.30+1.25*vxFBM(Math.cos(phi)*2.2+r*0.013, Math.sin(phi)*2.2+lr*1.6); const o=(px+py*W)*3;
        const gold=Math.min(0.92, Math.exp(-r*r/(2*Math.pow(R*0.225,2)))*0.8 + Math.exp(-r*r/(2*Math.pow(R*0.42,2)))*0.22);
        if(gold>0.004){ buf[o]=255-(255-buf[o])*(1-gold*1.0); buf[o+1]=255-(255-buf[o+1])*(1-gold*0.875); buf[o+2]=255-(255-buf[o+2])*(1-gold*0.66); }
        const white=Math.min(0.985, Math.exp(-r*r/(2*Math.pow(R*0.085,2)))*1.15);
        if(white>0.004){ buf[o]=255-(255-buf[o])*(1-white*1.0); buf[o+1]=255-(255-buf[o+1])*(1-white*0.99); buf[o+2]=255-(255-buf[o+2])*(1-white*0.95); }
        let dd=av*densDark(t)*Math.max(0,cl)*1.08; let darkA=Math.min(0.82, dd*1.18)*(0.85+0.4*vxSmooth(0.45,0.1,t));
        if(darkA>0.003){ buf[o]=buf[o]*(1-darkA)+ink[0]*darkA; buf[o+1]=buf[o+1]*(1-darkA)+ink[1]*darkA; buf[o+2]=buf[o+2]*(1-darkA)+ink[2]*darkA; }
        const bs=av*densBright(t)*Math.max(0.45,cl); let brA=Math.min(0.9, bs*0.85)*(0.25+1.0*vxSmooth(0.55,0.0,t));
        if(brA>0.003){ buf[o]=255-(255-buf[o])*(1-brA*wht[0]/255); buf[o+1]=255-(255-buf[o+1])*(1-brA*wht[1]/255); buf[o+2]=255-(255-buf[o+2])*(1-brA*wht[2]/255); }
    }
    for(let i=0;i<95000;i++){ const r=Rin+(R-Rin)*Math.pow(rng(),1.3), th=rng()*VTAU;
        if(rng()>arm(r,th)*densDark(r/R)*Math.max(0,clumpAt(r,th))*1.1) continue;
        vxSpeck(buf,W,H,cx+Math.cos(th)*r,cy+Math.sin(th)*r, 1.2+rng()*1.6, ink[0],ink[1],ink[2], (0.03+rng()*0.07)*(1.3-0.6*r/R),'darken'); }
    for(let i=0;i<34000;i++){ const r=Rin*0.6+(R*0.5)*Math.pow(rng(),1.7), th=rng()*VTAU;
        if(rng()>arm(r,th)*densBright(r/R)*Math.max(0.45,clumpAt(r,th))*1.4) continue;
        vxSpeck(buf,W,H,cx+Math.cos(th)*r,cy+Math.sin(th)*r, 1.1+rng()*1.7, wht[0],wht[1],wht[2], (0.05+rng()*0.13)*(0.25+1.0*vxSmooth(R*0.5,Rin,r)),'lighten'); }
    for(let i=0;i<420;i++){ const r=Rin+(R*0.74)*Math.pow(rng(),1.2), th=rng()*VTAU;
        if(rng()>arm(r,th)*Math.max(densDark(r/R),densBright(r/R)*0.5)*1.7) continue;
        vxSpeck(buf,W,H,cx+Math.cos(th)*r,cy+Math.sin(th)*r, 0.7+rng()*1.2, 255,254,248, 0.7+rng()*0.5,'lighten'); }
    const vr=R*0.055;
    for(let py=(cy-vr-3)|0;py<=(cy+vr+3);py++)for(let px=(cx-vr-3)|0;px<=(cx+vr+3);px++){
        const d=Math.hypot(px-cx,py-cy), k=1-vxSmooth(vr-1.5,vr+1.5,d); if(k<=0)continue; const o=(py*W+px)*3;
        buf[o]=buf[o]*(1-k)+21*k; buf[o+1]=buf[o+1]*(1-k)+21*k; buf[o+2]=buf[o+2]*(1-k)+24*k; }
    vxBlur(buf,W,H,1);
    const SAT=1.4;
    for(let i=0;i<W*H;i++){ const o=i*3;
        const dev=Math.abs(buf[o]-VX_BG[0])+Math.abs(buf[o+1]-VX_BG[1])+Math.abs(buf[o+2]-VX_BG[2]);
        const sat=1+(SAT-1)*vxSmooth(2,22,dev); const L=0.30*buf[o]+0.59*buf[o+1]+0.11*buf[o+2];
        buf[o]=L+(buf[o]-L)*sat; buf[o+1]=L+(buf[o+1]-L)*sat; buf[o+2]=L+(buf[o+2]-L)*sat; }
    const c=document.createElement('canvas'); c.width=W; c.height=H; const ic=c.getContext('2d');
    const img=ic.createImageData(W,H);
    for(let i=0;i<W*H;i++){ img.data[i*4]=Math.max(0,Math.min(255,buf[i*3]|0)); img.data[i*4+1]=Math.max(0,Math.min(255,buf[i*3+1]|0)); img.data[i*4+2]=Math.max(0,Math.min(255,buf[i*3+2]|0)); img.data[i*4+3]=255; }
    ic.putImageData(img,0,0);
    return c;
}
function ensureVortexBitmap(){
    if (vortexBitmap) return;
    vortexBitmap = renderVortexBitmap(VX.RENDER_R);
    vortexBitmapDiscR = VX.RENDER_R;
}

function vortexInteractive(){ return VTX.active && VTX.phase === 'stay'; }

function vortexReward(){
    let combined = 0;
    for (const o of ORBITERS) combined += o.list().length * o.payout();
    const base = Math.round((10 * pulseValue() + combined) * brighterTailsMult());
    const kin = (typeof distantKinRewardMult === 'function') ? distantKinRewardMult() : 1;   // dwarf Distant Kin identity
    return Math.max(1, Math.round(base * VX.REWARD_MULT * kin));
}

function pickVortexSpot(){
    const mn = Math.min(innerWidth, innerHeight);
    VTX.R = mn * (VX.SIZE_MIN + Math.random()*(VX.SIZE_MAX - VX.SIZE_MIN));
    VTX.grabR = VTX.R * VX.GRAB_FRAC;
    const L = (typeof mawScreen === 'function') ? mawScreen() : { x:innerWidth/2, y:innerHeight/2 };
    const orbitOuter = (typeof orbitR === 'function') ? orbitR(2) : mn*0.18;
    const KO = orbitOuter + 55 + VTX.R;
    const r = (typeof canvas !== 'undefined' && canvas.getBoundingClientRect) ? canvas.getBoundingClientRect()
              : { left:0, top:0, width:innerWidth, height:innerHeight, right:innerWidth, bottom:innerHeight };
    const m = VTX.R + 12;
    let best = { x:L.x, y:L.y }, bestD = -1;
    for (let i=0;i<40;i++){
        const x = r.left + m + Math.random()*Math.max(1, r.width  - 2*m);
        const y = r.top  + m + Math.random()*Math.max(1, r.height - 2*m);
        const d = Math.hypot(x-L.x, y-L.y);
        if (d >= KO){ best = {x,y}; break; }
        if (d > bestD){ bestD = d; best = {x,y}; }
    }
    VTX.cx = best.x; VTX.cy = best.y;
}

function vortexSpawn(){
    ensureVortexBitmap();
    pickVortexSpot();
    VTX.active = true; VTX.phase = 'in'; VTX.t = 0; VTX.fade = 0; VTX.spin = Math.random()*VTAU;
    VTX.stayLeft = VX.STAY; VTX.hold = 0; VTX.shrink = 0; VTX.holding = false; VTX.flash = 0;
    if (typeof SoundSystem !== 'undefined' && SoundSystem.sfxVortexAppear) SoundSystem.sfxVortexAppear();
}

function endVortex(){
    VTX.active = false; VTX.phase = 'idle'; VTX.holding = false;
    const kin = (typeof distantKinSpawnMult === 'function') ? distantKinSpawnMult() : 1;   // dwarf Distant Kin identity: sooner
    vortexTimer = (VX.SPAWN_MIN + Math.random() * (VX.SPAWN_MAX - VX.SPAWN_MIN)) * kin;
}

function vortexTick(dt){
    for (let i = vortexFx.length-1; i >= 0; i--){ vortexFx[i].age += dt; if (vortexFx[i].age >= vortexFx[i].maxAge) vortexFx.splice(i,1); }

    if (!VTX.active){
        // the FIRST vortex ever appears at the 2:15 mark of the universe clock (tutorial pacing);
        // tutSeen.vortex is the persistent "a vortex has ever appeared" marker (set by its tutorial)
        if (typeof G !== 'undefined' && G.tutSeen && !G.tutSeen.vortex) {
            if (G.universeTime >= 135 && !anyEventActive()) vortexSpawn();
            return;
        }
        vortexTimer -= dt;
        if (vortexTimer <= 0 && !anyEventActive()) vortexSpawn();
        return;
    }

    VTX.t += dt;

    if (VTX.phase === 'in'){
        const p = Math.min(1, VTX.t / VX.FADE_IN);
        VTX.fade = p*p*(3-2*p);
        VTX.spinRate = VX.SPIN_MAX * p;
        VTX.spin += VTX.spinRate * dt;
        if (VTX.t >= VX.FADE_IN){ VTX.phase = 'stay'; VTX.t = 0; VTX.fade = 1; }
    }
    else if (VTX.phase === 'stay'){
        VTX.fade = 1;
        if (VTX.holding){
            VTX.hold += dt;
            if (VTX.hold >= VX.HOLD){ VTX.hold = VX.HOLD; startAbsorb(); }
        } else {
            VTX.hold = 0;
            VTX.stayLeft -= dt;
            if (VTX.stayLeft <= 0){ VTX.phase = 'out'; VTX.t = 0; }
        }
        const target = VTX.holding ? (VTX.hold / VX.HOLD) : 0;
        const rate = VTX.holding ? 7 : 16;
        VTX.shrink += (target - VTX.shrink) * Math.min(1, dt*rate);
        VTX.spinRate = VX.SPIN_MAX * (1 + VTX.shrink*2.4);
        VTX.spin += VTX.spinRate * dt;
    }
    else if (VTX.phase === 'absorb'){
        VTX.shrink = Math.min(1, 0.92 + 0.08*Math.min(1, VTX.t/0.32));
        VTX.spinRate = VX.SPIN_MAX * 4.2;
        VTX.spin += VTX.spinRate * dt;
        VTX.flash = Math.max(0, 1 - VTX.t/0.45);
        VTX.fade = 1 - vxSmooth(VX.ABSORB-0.28, VX.ABSORB, VTX.t);
        if (VTX.t >= VX.ABSORB) endVortex();
    }
    else if (VTX.phase === 'out'){
        const p = Math.min(1, VTX.t / VX.FADE_OUT);
        VTX.fade = 1 - p*p*(3-2*p);
        VTX.spinRate = VX.SPIN_MAX;
        VTX.spin += VTX.spinRate * dt;
        if (VTX.t >= VX.FADE_OUT) endVortex();
    }
}

function startAbsorb(){
    VTX.phase = 'absorb'; VTX.t = 0; VTX.holding = false; VTX.flash = 1;
    const reward = vortexReward();
    earn(reward);
    G.vortexSeen = true;   // gates the observatory's Vortex Value row - only after the first successful grab
    vortexFx.push({ x:VTX.cx, y:VTX.cy, text:'+✦'+fmtNum(reward), age:0, maxAge:2.0 });
    if (typeof SoundSystem !== 'undefined' && SoundSystem.sfxVortexAbsorb) SoundSystem.sfxVortexAbsorb();
}

let vortexLayerHad = true;   // whether the overlay held anything last frame (starts true so the first frame clears)
function drawVortexLayer(){
    if (!vortexCtx) return;
    const has = VTX.active || vortexFx.length > 0;
    if (!has && !vortexLayerHad) return;   // idle (~95% of the time): skip the full-window clear
    vortexLayerHad = has;
    const g = vortexCtx;
    g.clearRect(0, 0, innerWidth, innerHeight);

    if (VTX.active){
        const cx = VTX.cx, cy = VTX.cy, R = VTX.R;

        if (VTX.fade > 0.001 && vortexBitmap){
            const fade = VTX.fade;
            const scale = (R / vortexBitmapDiscR) * (1 - VTX.shrink);
            if (scale > 0.0015){
                const clipR = (vortexBitmap.width/2) * scale;
                g.save(); g.globalAlpha = fade;
                g.beginPath(); g.arc(cx, cy, clipR, 0, VTAU); g.clip();
                g.translate(cx, cy); g.rotate(VTX.spin);
                g.scale(scale, scale); g.drawImage(vortexBitmap, -vortexBitmap.width/2, -vortexBitmap.height/2);
                g.restore();
            }
            g.save(); g.globalAlpha = fade;
            const dotR = Math.max(2, R*0.055*(1 + VTX.shrink*0.55));
            g.fillStyle = '#15130f'; g.beginPath(); g.arc(cx, cy, dotR, 0, VTAU); g.fill();
            g.restore();

            if (VTX.flash > 0){
                const f = VTX.flash;
                const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R*0.7);
                grd.addColorStop(0, `rgba(255,250,238,${0.85*f})`); grd.addColorStop(0.5, `rgba(255,236,196,${0.35*f})`); grd.addColorStop(1, 'rgba(255,236,196,0)');
                g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, R*0.7, 0, VTAU); g.fill();
                const ring = R*(0.2 + (1-f)*1.1);
                g.strokeStyle = `rgba(206,168,92,${0.5*f})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, ring, 0, VTAU); g.stroke();
            }
        }
    }

    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const fx of vortexFx){
        const a = Math.max(0, 1 - fx.age/fx.maxAge);
        g.fillStyle = `rgba(26,26,26,${a})`; g.font = "700 22px 'Segoe UI',sans-serif";
        g.fillText(fx.text, fx.x, fx.y - fx.age*44);
    }
}

function vortexHitTest(e){
    if (!vortexInteractive()) return false;
    if (e.target.closest('button, input, label, a, #observatory, #settings-panel, #upg-pop, #cosmo-card, .acc-confirm, #accretion-screen, #debug-panel')) return false;
    const dx = e.clientX - VTX.cx, dy = e.clientY - VTX.cy;
    return dx*dx + dy*dy <= VTX.grabR*VTX.grabR;
}
window.addEventListener('mousedown', e => {
    if (vortexHitTest(e)){ VTX.holding = true; e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
window.addEventListener('mouseup',   () => { VTX.holding = false; });
window.addEventListener('blur',      () => { VTX.holding = false; });
window.addEventListener('touchstart', e => {
    if (e.touches.length && vortexHitTest(e.touches[0])){ VTX.holding = true; e.stopImmediatePropagation(); }
}, true);
window.addEventListener('touchend',    () => { VTX.holding = false; });
window.addEventListener('touchcancel', () => { VTX.holding = false; });

function vortexInit(){
    vortexLayer = document.getElementById('vortex-layer');
    if (vortexLayer){
        vortexCtx = vortexLayer.getContext('2d');
        resizeVortexLayer();
        window.addEventListener('resize', resizeVortexLayer);
    }
    setTimeout(ensureVortexBitmap, 2500);
}
function resizeVortexLayer(){
    if (!vortexLayer) return;
    const dpr = window.devicePixelRatio || 1;
    vortexLayer.width = Math.round(innerWidth*dpr); vortexLayer.height = Math.round(innerHeight*dpr);
    vortexCtx.setTransform(dpr,0,0,dpr,0,0);
}
