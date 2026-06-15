'use strict';

const SoundSystem = (() => {
    let actx = null, master, musicBus, sfxBus;
    let muted = false, loopHandle = null, loopStop = false;
    let orbitSfxCooldown = 0, currentTrack = 0;
    let musicSession = null; // disconnect this to instantly kill all queued notes

    function boot() {
        if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
        actx    = new (window.AudioContext || window.webkitAudioContext)();
        master   = mk(0.75); musicBus = mk(0.56); sfxBus = mk(0.81);
        musicBus.connect(master); sfxBus.connect(master); master.connect(actx.destination);
    }
    function mk(vol) { const g = actx.createGain(); g.gain.value = vol; return g; }

    function tone(type, freq, start, dur, vol, bus, freqEnd) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, start);
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g); g.connect(bus || sfxBus); o.start(start); o.stop(start + dur + 0.05);
    }

    function reverb(len = 2.4) {
        const sr = actx.sampleRate, buf = actx.createBuffer(2, sr * len, sr);
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c);
            for (let i = 0; i < d.length; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.9);
        }
        const conv = actx.createConvolver(); conv.buffer = buf;
        conv.connect(musicSession || musicBus); return conv;
    }

    // Track 1: Celestial
    const P = {
        C2:65.41,G2:98.00,A2:110.00,C3:130.81,D3:146.83,E3:164.81,
        G3:196.00,A3:220.00,C4:261.63,D4:293.66,E4:329.63,
        G4:392.00,A4:440.00,C5:523.25,E5:659.25,G5:783.99,
    };
    const MELODY  = [[P.G4,3],[P.E4,2],[P.D4,2],[P.C4,4],[P.A3,2],[P.G3,3],[P.A3,2],[P.C4,3],[P.D4,2],[P.E4,3],[P.G4,2],[P.E4,2],[P.D4,2],[P.C4,5]];
    const BASS    = [[P.C2,8],[P.G2,6],[P.A2,6],[P.C2,12]];
    const ACCENTS = [[P.G5,0],[P.E5,7],[P.C5,14],[P.G5,22]];
    const BEAT = 0.58;

    function scheduleLoop(startAt) {
        const rev = reverb(); let t = startAt;
        for (const [freq, beats] of MELODY) {
            const dur = beats * BEAT, o = actx.createOscillator(), g = actx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.20,t+0.06);
            g.gain.setValueAtTime(0.15,t+dur*0.55); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
            o.connect(g); g.connect(rev); o.start(t); o.stop(t+dur+0.1); t += dur;
        }
        const loopLen = t - startAt; let bt = startAt;
        for (const [freq, beats] of BASS) {
            const dur = beats * BEAT, o = actx.createOscillator(), g = actx.createGain();
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
                const t = startAt+off, o = actx.createOscillator(), g = actx.createGain();
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
            const t = startAt+off, o = actx.createOscillator(), g = actx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.008);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
            o.connect(g); g.connect(rev); o.start(t); o.stop(t+0.4);
        });
        [[82.41,0.0],[82.41,7.5],[98.00,15.0]].forEach(([freq,off]) => {
            const t = startAt+off, o = actx.createOscillator(), g = actx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.28,t+0.015);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.9);
            o.connect(g); g.connect(rev); o.start(t); o.stop(t+1.0);
        });
        return startAt + 20;
    }

    function startMusic() {
        if (!actx || loopHandle !== null) return;
        musicSession = actx.createGain();
        musicSession.gain.setValueAtTime(0, actx.currentTime);
        musicSession.gain.linearRampToValueAtTime(1, actx.currentTime + 0.35);
        musicSession.connect(musicBus);
        loopStop = false;
        let next = actx.currentTime + 0.4;
        const schedulers = [scheduleLoop, scheduleLoop2, scheduleLoop3];
        function tick() {
            if (loopStop) { loopHandle = null; return; }
            next = schedulers[currentTrack](next);
            loopHandle = setTimeout(tick, Math.max(200, (next - actx.currentTime - 5) * 1000));
        }
        tick();
    }

    function stopMusic() {
        loopStop = true;
        if (loopHandle) { clearTimeout(loopHandle); loopHandle = null; }
        if (musicSession) { musicSession.disconnect(); musicSession = null; }
    }

    function sfxTap()  { if (!actx) return; tone('triangle', 700, actx.currentTime, 0.13, 0.22, sfxBus, 420); }
    function sfxOrbit() {
        if (!actx) return;
        const now = actx.currentTime;
        if (now < orbitSfxCooldown) return;
        orbitSfxCooldown = now + 0.4;
        [[523.25,0],[659.25,0.07],[784,0.14]].forEach(([f,d]) => tone('sine',f,now+d,0.6,0.13));
    }
    function sfxComet() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('sine',280,t,0.45,0.38,sfxBus,1400); tone('sine',560,t+0.04,0.40,0.18,sfxBus,1800);
    }
    function sfxBuy() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('triangle',580,t,0.07,0.22); tone('triangle',870,t+0.07,0.09,0.16);
    }
    function setMusicVolume(pct) { if (actx) musicBus.gain.setTargetAtTime(0.56*pct/100, actx.currentTime, 0.1); }
    function setSfxVolume(pct)   { if (actx) sfxBus.gain.setTargetAtTime(0.81*pct/100, actx.currentTime, 0.1); }
    function loadTrack(n) { currentTrack = Math.max(0, Math.min(2, n)); }
    function setTrack(n)  { loadTrack(n); if (!actx) return; stopMusic(); setTimeout(startMusic, 200); }
    function getTrack()   { return currentTrack; }
    function toggleMute() { if (!actx) return true; muted=!muted; master.gain.setTargetAtTime(muted?0:0.75,actx.currentTime,0.15); return muted; }
    function isMuted()    { return muted; }

    return { boot,startMusic,stopMusic,toggleMute,isMuted,setMusicVolume,setSfxVolume,setTrack,loadTrack,getTrack,sfxTap,sfxOrbit,sfxBuy,sfxComet };
})();
