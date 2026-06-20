'use strict';

// Background music — three procedural ambient tracks and the looping scheduler.
let currentTrack = 0, loopHandle = null, loopStop = false;

// Track 1: Celestial
const NOTES = {
    C2:65.41,G2:98.00,A2:110.00,C3:130.81,D3:146.83,E3:164.81,
    G3:196.00,A3:220.00,C4:261.63,D4:293.66,E4:329.63,
    G4:392.00,A4:440.00,C5:523.25,E5:659.25,G5:783.99,
};
const MELODY  = [[NOTES.G4,3],[NOTES.E4,2],[NOTES.D4,2],[NOTES.C4,4],[NOTES.A3,2],[NOTES.G3,3],[NOTES.A3,2],[NOTES.C4,3],[NOTES.D4,2],[NOTES.E4,3],[NOTES.G4,2],[NOTES.E4,2],[NOTES.D4,2],[NOTES.C4,5]];
const BASS    = [[NOTES.C2,8],[NOTES.G2,6],[NOTES.A2,6],[NOTES.C2,12]];
const ACCENTS = [[NOTES.G5,0],[NOTES.E5,7],[NOTES.C5,14],[NOTES.G5,22]];
const BEAT = 0.58;

function scheduleLoop(startAt) {
    const rev = reverb(); let t = startAt;
    for (const [freq, beats] of MELODY) {
        const dur = beats * BEAT, o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.20,t+0.06);
        g.gain.setValueAtTime(0.15,t+dur*0.55); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
        o.connect(g); g.connect(rev); o.start(t); o.stop(t+dur+0.1); t += dur;
    }
    const loopLen = t - startAt; let bt = startAt;
    for (const [freq, beats] of BASS) {
        const dur = beats * BEAT, o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0,bt); g.gain.linearRampToValueAtTime(0.25,bt+0.6);
        g.gain.linearRampToValueAtTime(0.0001,bt+dur);
        o.connect(g); g.connect(rev); o.start(bt); o.stop(bt+dur+0.1); bt += dur;
    }
    for (const [freq, off] of ACCENTS) tone('sine', freq, startAt+off*BEAT, 1.6, 0.08, rev);
    return startAt + loopLen + 1.5;
}

// Track 2: Drift — breathing sine drone pairs (mid-range fifths)
function scheduleLoop2(startAt) {
    const rev = reverb(4.5);
    [[130.81,196.00,0],[110.00,164.81,9],[146.83,220.00,18],[174.61,261.63,27]]
    .forEach(([low,high,off]) => {
        [[low,0.34],[high,0.16]].forEach(([freq,vol]) => {
            const t = startAt+off, o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+2.5);
            g.gain.linearRampToValueAtTime(vol*0.85,t+4.5); g.gain.linearRampToValueAtTime(0,t+7.0);
            o.connect(g); g.connect(rev); o.start(t); o.stop(t+7.2);
        });
    });
    return startAt + 36;
}

// Track 3: Wane — staccato E minor pentatonic plucks
const WANE = [
    [164.81,0.0,0.26],[196.00,0.7,0.20],[246.94,1.4,0.22],[293.66,2.1,0.18],[329.63,2.8,0.26],
    [293.66,3.5,0.18],[246.94,4.2,0.20],[196.00,4.9,0.18],[164.81,5.6,0.24],
    [329.63,7.5,0.24],[392.00,8.2,0.20],[440.00,8.9,0.22],[392.00,9.6,0.18],
    [329.63,10.3,0.24],[293.66,11.0,0.18],[246.94,11.7,0.20],[164.81,12.4,0.26],
    [329.63,15.0,0.22],[246.94,15.9,0.18],[196.00,16.8,0.20],[164.81,17.7,0.28],
];
function scheduleLoop3(startAt) {
    const rev = reverb(1.2);
    WANE.forEach(([freq,off,vol]) => {
        const t = startAt+off, o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.008);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
        o.connect(g); g.connect(rev); o.start(t); o.stop(t+0.4);
    });
    [[82.41,0.0],[82.41,7.5],[98.00,15.0]].forEach(([freq,off]) => {
        const t = startAt+off, o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.28,t+0.015);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.9);
        o.connect(g); g.connect(rev); o.start(t); o.stop(t+1.0);
    });
    return startAt + 20;
}

function startMusic() {
    if (!SND.ctx || loopHandle !== null) return;
    SND.musicSession = SND.ctx.createGain();
    SND.musicSession.gain.setValueAtTime(0, SND.ctx.currentTime);
    SND.musicSession.gain.linearRampToValueAtTime(1, SND.ctx.currentTime + 0.35);
    SND.musicSession.connect(SND.musicBus);
    loopStop = false;
    let next = SND.ctx.currentTime + 0.4;
    const schedulers = [scheduleLoop, scheduleLoop2, scheduleLoop3];
    function tick() {
        if (loopStop) { loopHandle = null; return; }
        next = schedulers[currentTrack](next);
        loopHandle = setTimeout(tick, Math.max(200, (next - SND.ctx.currentTime - 5) * 1000));
    }
    tick();
}

function stopMusic() {
    loopStop = true;
    if (loopHandle) { clearTimeout(loopHandle); loopHandle = null; }
    if (SND.musicSession) { SND.musicSession.disconnect(); SND.musicSession = null; }
}

function loadTrack(n) { currentTrack = Math.max(0, Math.min(2, n)); }
function setTrack(n)  { loadTrack(n); if (!SND.ctx) return; stopMusic(); setTimeout(startMusic, 200); }
function getTrack()   { return currentTrack; }
