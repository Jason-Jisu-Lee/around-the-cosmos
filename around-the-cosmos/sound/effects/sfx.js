'use strict';

let orbitSfxCooldown = 0;
let hoverSfxCooldown = 0;

function sfxTap()  { if (!SND.ctx) return; tone('triangle', 700, SND.ctx.currentTime, 0.13, 0.22, SND.sfxBus, 420); }

function sfxHover() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    if (t < hoverSfxCooldown) return;
    hoverSfxCooldown = t + 0.04;
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain(), f = SND.ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(294, t); o.frequency.exponentialRampToValueAtTime(250, t + 0.10);
    f.type = 'lowpass'; f.frequency.value = 600;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.066, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
    o.connect(g); g.connect(f); f.connect(SND.sfxBus);
    o.start(t); o.stop(t + 0.15);
}

function sfxPulse() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine', 196, t, 0.42, 0.075, SND.sfxBus, 520);
    tone('sine', 294, t + 0.015, 0.30, 0.045, SND.sfxBus, 700);
}

function sfxDeepBreath() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine', 147, t, 0.42, 0.072, SND.sfxBus, 400);
    tone('sine', 220, t + 0.015, 0.30, 0.040, SND.sfxBus, 560);
}

const ORBIT_PENT = [523.25, 587.33, 659.25, 783.99, 880.00];
function sfxOrbit() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    if (t < orbitSfxCooldown) return;
    orbitSfxCooldown = t + 0.05;
    const f = ORBIT_PENT[Math.random() * ORBIT_PENT.length | 0];
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain(), lp = SND.ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.value = 1700;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);
    o.connect(lp); lp.connect(g); g.connect(SND.sfxBus);
    o.start(t); o.stop(t + 0.25);
    tone('sine', f * 2, t, 0.10, 0.018, SND.sfxBus);
}
function sfxComet() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine',280,t,0.45,0.38,SND.sfxBus,1400); tone('sine',560,t+0.04,0.40,0.18,SND.sfxBus,1800);
}
function sfxBuy() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('triangle',580,t,0.07,0.22); tone('triangle',870,t+0.07,0.09,0.16);
}

function sfxComplete() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    [[659.25,0.00,0.11],[987.77,0.07,0.11],[1318.51,0.15,0.08]]
        .forEach(([f,d,v]) => tone('sine', f, t+d, 0.7, v, SND.sfxBus));
}

let vortexVerbSend = null;
function vortexReverb() {
    if (vortexVerbSend) return vortexVerbSend;
    const len = Math.floor(SND.ctx.sampleRate * 2.4), buf = SND.ctx.createBuffer(2, len, SND.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.5); }
    const conv = SND.ctx.createConvolver(); conv.buffer = buf;
    vortexVerbSend = SND.ctx.createGain(); vortexVerbSend.connect(conv); conv.connect(SND.sfxBus);
    return vortexVerbSend;
}
function sfxVortexAppear() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime, verb = vortexReverb();
    const out = (node, start, dur, peak, atk, wet) => {
        const g = SND.ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(peak, start + atk);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        node.connect(g); g.connect(SND.sfxBus);
        if (wet) { const w = SND.ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    };
    const nb = Math.floor(SND.ctx.sampleRate * 0.5), buf = SND.ctx.createBuffer(1, nb, SND.ctx.sampleRate), nd = buf.getChannelData(0);
    for (let i = 0; i < nb; i++) nd[i] = Math.random()*2 - 1;
    const air = SND.ctx.createBufferSource(); air.buffer = buf;
    const af = SND.ctx.createBiquadFilter(); af.type = 'lowpass'; af.Q.value = 0.7;
    af.frequency.setValueAtTime(280, t); af.frequency.linearRampToValueAtTime(950, t + 0.5);
    air.connect(af); out(af, t, 0.5, 0.09, 0.35, 0.4); air.start(t); air.stop(t + 0.56);
    const boom = SND.ctx.createOscillator(); boom.type = 'sine';
    boom.frequency.setValueAtTime(64, t + 0.02); boom.frequency.exponentialRampToValueAtTime(34, t + 0.30);
    out(boom, t + 0.02, 0.5, 0.45, 0.004, 0.3); boom.start(t + 0.02); boom.stop(t + 0.58);
    const root = 49;
    const lp = SND.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(200, t); lp.frequency.linearRampToValueAtTime(1450, t + 0.42); lp.frequency.linearRampToValueAtTime(800, t + 1.2);
    const voices = [[root,1],[root,1],[root,0.9],[root,0.9],[root*1.5,0.6],[root*1.5,0.55],[root*1.5,0.5],[root*2,0.5],[root*2,0.45]];
    const total = voices.reduce((s, v) => s + v[1], 0);
    for (const [f, amp] of voices) {
        const o = SND.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        o.detune.value = (Math.random()*2 - 1) * 14;
        const vg = SND.ctx.createGain(); vg.gain.value = amp / total;
        o.connect(vg); vg.connect(lp); o.start(t); o.stop(t + 1.26);
    }
    out(lp, t, 1.2, 0.5, 0.10, 0.45);
    const sub = SND.ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = root / 2;
    out(sub, t, 1.2, 0.32, 0.10, 0.3); sub.start(t); sub.stop(t + 1.26);
}
function sfxVortexAbsorb() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine', 560, t,      0.55, 0.18, SND.sfxBus, 110);
    tone('sine', 70,  t+0.30, 1.0,  0.24, SND.sfxBus, 48);
    [[784,0.34],[1046.5,0.44],[1568,0.56]].forEach(([f,d]) => tone('sine', f, t+d, 0.6, 0.12, SND.sfxBus));
}
