'use strict';

// The ONE background track: "Perigee" - a soft kalimba arpeggio circling Am-F-C-G at ~63 BPM,
// a sine-lead melody that answers only every other pass (so the track breathes: one pass plain,
// one sung), a low felt heartbeat on the bar (a nod to the Maw's pulse), and sine bass, all
// through the cached convolution room. Auditioned in test/music-demo.html against "Aphelion".
// (The old Celestial/Drift/Wane tracks and the whole track picker were removed - there is no
// setTrack/loadTrack/getTrack anymore.)

let loopHandle = null, loopStop = false;
let perigeePass = 0;

const P_BEAT = 0.95;                          // ~63 BPM
const P_ARP_BEATS = [0, 1.5, 3, 4.5, 6, 7];   // the lilting 6-note pattern within each 8-beat bar
const P_BARS = [
    { arp: [220.00, 261.63, 329.63, 440.00, 329.63, 261.63], bass: 110.00 },   // Am (A3 C4 E4 A4)
    { arp: [174.61, 220.00, 261.63, 349.23, 261.63, 220.00], bass:  87.31 },   // F  (F3 A3 C4 F4)
    { arp: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63], bass: 130.81 },   // C  (C4 E4 G4 C5)
    { arp: [196.00, 246.94, 293.66, 392.00, 293.66, 246.94], bass:  98.00 },   // G  (G3 B3 D4 G4)
];
const P_MELODY = [   // [freq, beat offset in the 32-beat pass, length in beats]
    [659.25,  1,   2.5], [587.33, 3.5, 1.5], [523.25, 5,  2.5],
    [440.00,  9,   3.5],
    [523.25, 17,   1.5], [587.33, 18.5, 1.5], [659.25, 20, 2.5],
    [587.33, 25,   2.0], [493.88, 27,   3.0],
];

// ---- voices ----
// kalimba-ish pluck (the sfxOrbit voice, longer and softer)
function mPluck(freq, t, vol, dest, decay = 1.3) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain(), lp = SND.ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = freq;
    lp.type = 'lowpass'; lp.frequency.value = 1500;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.010);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + decay + 0.1);
}
// slow sine pad (the bass bed)
function mPad(freq, t, dur, vol, dest) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.7);
    g.gain.setValueAtTime(vol * 0.9, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.1);
}
// soft sine lead with light vibrato
function mLead(freq, t, dur, vol, dest) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    const lfo = SND.ctx.createOscillator(), lg = SND.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    lfo.frequency.value = 4.1; lg.gain.value = freq * 0.0045;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.30);
    g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.15); lfo.start(t); lfo.stop(t + dur + 0.15);
}
// low felt thump (the heartbeat, dry - straight to the session so it stays a knock, not a wash)
function mThump(t, vol, dest) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(66, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.16);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.3);
}

// The plucks go part-wet, part-dry so the lilt stays readable under the reverb wash.
// One bus per music session (rebuilt when the session changes, like the cached reverb).
let arpBusNode = null, arpBusSess = null;
function perigeeArpBus() {
    const sess = SND.musicSession || SND.musicBus;
    if (arpBusNode && arpBusSess === sess) return arpBusNode;
    arpBusSess = sess;
    arpBusNode = SND.ctx.createGain();
    const wet = SND.ctx.createGain(); wet.gain.value = 0.8;  arpBusNode.connect(wet); wet.connect(reverb(2.2));
    const dry = SND.ctx.createGain(); dry.gain.value = 0.4;  arpBusNode.connect(dry); dry.connect(sess);
    return arpBusNode;
}

function schedulePerigee(startAt) {
    const rev = reverb(2.2), arp = perigeeArpBus(), sess = SND.musicSession || SND.musicBus;
    P_BARS.forEach((bar, bi) => {
        const bt = startAt + bi * 8 * P_BEAT;
        bar.arp.forEach((f, ni) => mPluck(f, bt + P_ARP_BEATS[ni] * P_BEAT, 0.16, arp));
        mPad(bar.bass, bt, 8 * P_BEAT + 2, 0.26, rev);
        mThump(bt, 0.20, sess);
        mThump(bt + 4 * P_BEAT, 0.14, sess);
    });
    if (perigeePass % 2 === 1)
        for (const [f, off, len] of P_MELODY) mLead(f, startAt + off * P_BEAT, len * P_BEAT + 0.4, 0.10, rev);
    perigeePass++;
    return startAt + 32 * P_BEAT;   // ~30.4s per pass
}

function startMusic() {
    if (!SND.ctx || loopHandle !== null) return;
    SND.musicSession = SND.ctx.createGain();
    SND.musicSession.gain.setValueAtTime(0, SND.ctx.currentTime);
    SND.musicSession.gain.linearRampToValueAtTime(1, SND.ctx.currentTime + 0.35);
    SND.musicSession.connect(SND.musicBus);
    loopStop = false; perigeePass = 0;   // resume always opens with a plain pass, melody on the second
    let next = SND.ctx.currentTime + 0.4;
    function tick() {
        if (loopStop) { loopHandle = null; return; }
        next = schedulePerigee(next);
        loopHandle = setTimeout(tick, Math.max(200, (next - SND.ctx.currentTime - 5) * 1000));
    }
    tick();
}

function stopMusic() {
    loopStop = true;
    if (loopHandle) { clearTimeout(loopHandle); loopHandle = null; }
    if (SND.musicSession) { SND.musicSession.disconnect(); SND.musicSession = null; }
}
