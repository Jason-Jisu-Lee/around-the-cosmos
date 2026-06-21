'use strict';

// Audio engine: the Web Audio context, the master/music/sfx buses, and the shared
// tone()/reverb() helpers everything else builds on. Shared state lives on `SND`.
const SND = { ctx:null, master:null, musicBus:null, sfxBus:null, musicSession:null, muted:false };

function audioBoot() {
    if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
    SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
    SND.master = mkGain(0.75); SND.musicBus = mkGain(0.5712); SND.sfxBus = mkGain(0.8262);
    SND.musicBus.connect(SND.master); SND.sfxBus.connect(SND.master); SND.master.connect(SND.ctx.destination);
}
function mkGain(vol) { const g = SND.ctx.createGain(); g.gain.value = vol; return g; }

// One enveloped oscillator note. Default bus is the SFX bus.
function tone(type, freq, start, dur, vol, bus, freqEnd) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus || SND.sfxBus); o.start(start); o.stop(start + dur + 0.05);
}

// Convolution reverb tail, routed into the current music session (or the music bus).
function reverb(len = 2.4) {
    const sr = SND.ctx.sampleRate, buf = SND.ctx.createBuffer(2, sr * len, sr);
    for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.9);
    }
    const conv = SND.ctx.createConvolver(); conv.buffer = buf;
    conv.connect(SND.musicSession || SND.musicBus); return conv;
}

// Volume scale: 75% is the reference loudness (the default); the slider runs to
// 100% for more headroom. Gain divides by 75 (75%→reference, 100%→reference×1.33).
// Reference gains: music 0.5712, sfx 0.8262 (the earlier 0.672/0.972, toned down 15%).
// Default volumes are 75%.
function setMusicVolume(pct) { if (SND.ctx) SND.musicBus.gain.setTargetAtTime(0.5712*pct/75, SND.ctx.currentTime, 0.1); }
function setSfxVolume(pct)   { if (SND.ctx) SND.sfxBus.gain.setTargetAtTime(0.8262*pct/75, SND.ctx.currentTime, 0.1); }
function toggleMute() { if (!SND.ctx) return true; SND.muted=!SND.muted; SND.master.gain.setTargetAtTime(SND.muted?0:0.75, SND.ctx.currentTime, 0.15); return SND.muted; }
function isMuted()    { return SND.muted; }
