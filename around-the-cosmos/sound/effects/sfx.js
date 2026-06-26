'use strict';


let orbitSfxCooldown = 0;
let hoverSfxCooldown = 0;

function sfxTap()  { if (!SND.ctx) return; tone('triangle', 700, SND.ctx.currentTime, 0.13, 0.22, SND.sfxBus, 420); }

// "Warm" upgrade-hover blip — a low sine (294→250 Hz) under a 600 Hz low-pass: felt more than heard.
// Deliberately tiny since it fires whenever the cursor crosses an upgrade; a 40 ms cooldown stops
// fast sweeps from machine-gunning it. (tone() has no filter, so this is built by hand.)
function sfxHover() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    if (t < hoverSfxCooldown) return;
    hoverSfxCooldown = t + 0.04;
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain(), f = SND.ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(294, t); o.frequency.exponentialRampToValueAtTime(250, t + 0.10);
    f.type = 'lowpass'; f.frequency.value = 600;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.066, t + 0.006);   // +20% (was 0.055)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
    o.connect(g); g.connect(f); f.connect(SND.sfxBus);
    o.start(t); o.stop(t + 0.15);
}
// The Lacuna's once-a-second pulse tick — deliberately soft and low (it plays forever):
// a warm low sine with a gentle decay and a low-pass so it sits under the music, not over it.
function sfxPulse() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine', 196, t, 0.42, 0.075, SND.sfxBus, 520);
    tone('sine', 294, t + 0.015, 0.30, 0.045, SND.sfxBus, 700);
}
function sfxOrbit() {
    if (!SND.ctx) return;
    const now = SND.ctx.currentTime;
    if (now < orbitSfxCooldown) return;
    orbitSfxCooldown = now + 0.4;
    [[523.25,0],[659.25,0.07],[784,0.14]].forEach(([f,d]) => tone('sine',f,now+d,0.6,0.10));
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

// A short filtered-noise burst (built by hand — tone() has no noise source). Used by the Vortex cues.
function noiseBurst(t, dur, vol, type, f0, f1, q) {
    if (!SND.ctx) return;
    const n = Math.floor(SND.ctx.sampleRate * dur);
    const buf = SND.ctx.createBuffer(1, n, SND.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
    const src = SND.ctx.createBufferSource(); src.buffer = buf;
    const f = SND.ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t + dur);
    const g = SND.ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur*0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(SND.sfxBus); src.start(t); src.stop(t + dur + 0.02);
}

// The Vortex APPEARS — a soft, ethereal emergence to match the slow 1s fade-in (gentle, not a harsh
// warning; the dramatic warning + tutorial come later). A warm swell + a soft fifth + a faint shimmer.
function sfxVortexAppear() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine',     147, t,      1.6, 0.10, SND.sfxBus, 196);   // low warm swell rising a touch
    tone('sine',     220, t+0.20, 1.4, 0.06, SND.sfxBus, 294);   // soft fifth above
    tone('triangle', 587, t+0.45, 1.1, 0.025, SND.sfxBus, 740);  // faint high shimmer
}
// Absorbed into the void — a downward whoosh into a warm boom, capped with a sparkle (the windfall).
function sfxVortexAbsorb() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    tone('sine', 560, t,      0.55, 0.18, SND.sfxBus, 110);                  // descending whoosh
    tone('sine', 70,  t+0.30, 1.0,  0.24, SND.sfxBus, 48);                   // deep boom
    [[784,0.34],[1046.5,0.44],[1568,0.56]].forEach(([f,d]) => tone('sine', f, t+d, 0.6, 0.12, SND.sfxBus));  // sparkle
}
