'use strict';

const SND = { ctx:null, master:null, musicBus:null, sfxBus:null, limiter:null, musicSession:null, muted:false };

function audioBoot() {
    if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
    SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
    SND.master = mkGain(0.75); SND.musicBus = mkGain(0.5712); SND.sfxBus = mkGain(0.8262);
    SND.limiter = SND.ctx.createDynamicsCompressor();
    SND.limiter.threshold.value = -2;
    SND.limiter.knee.value = 0;
    SND.limiter.ratio.value = 20;
    SND.limiter.attack.value = 0.003;
    SND.limiter.release.value = 0.12;
    SND.musicBus.connect(SND.master); SND.sfxBus.connect(SND.master);
    SND.master.connect(SND.limiter); SND.limiter.connect(SND.ctx.destination);
}
function mkGain(vol) { const g = SND.ctx.createGain(); g.gain.value = vol; return g; }

function tone(type, freq, start, dur, vol, bus, freqEnd) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus || SND.sfxBus); o.start(start); o.stop(start + dur + 0.05);
}

// Cached: the old version built a fresh impulse buffer (~230k noise samples) AND a fresh ConvolverNode
// on every music-loop pass; each convolver stayed connected forever, silently convolving on the audio
// thread for the rest of the session (dozens after an hour). Now one impulse buffer per length lives
// for the whole page, and one convolver per (length, music session) is reused until the session changes.
const _revBufs = new Map();      // len -> impulse AudioBuffer
const _revConvs = new Map();     // len -> live ConvolverNode for the current session
let _revSess = null;
function reverb(len = 2.4) {
    const sess = SND.musicSession || SND.musicBus;
    if (_revSess !== sess) { _revSess = sess; _revConvs.clear(); }
    let conv = _revConvs.get(len);
    if (conv) return conv;
    let buf = _revBufs.get(len);
    if (!buf) {
        const sr = SND.ctx.sampleRate;
        buf = SND.ctx.createBuffer(2, sr * len, sr);
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c);
            for (let i = 0; i < d.length; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.9);
        }
        _revBufs.set(len, buf);
    }
    conv = SND.ctx.createConvolver(); conv.buffer = buf;
    conv.connect(sess);
    _revConvs.set(len, conv);
    return conv;
}

function setMusicVolume(pct) { if (SND.ctx) SND.musicBus.gain.setTargetAtTime(0.5712*pct/75, SND.ctx.currentTime, 0.1); }
function setSfxVolume(pct)   { if (SND.ctx) SND.sfxBus.gain.setTargetAtTime(0.8262*pct/75, SND.ctx.currentTime, 0.1); }
function toggleMute() { if (!SND.ctx) return true; SND.muted=!SND.muted; SND.master.gain.setTargetAtTime(SND.muted?0:0.75, SND.ctx.currentTime, 0.15); return SND.muted; }
function isMuted()    { return SND.muted; }
