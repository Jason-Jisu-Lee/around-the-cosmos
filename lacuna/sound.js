'use strict';

// ─── LACUNA AUDIO ────────────────────────────────────────────────────────────
// Procedural music + SFX via Web Audio API. No external files.
// Call SoundSystem.boot() on first user gesture, then startMusic().

const SoundSystem = (() => {
    let actx = null;
    let master, musicBus, sfxBus;
    let muted = false;
    let loopHandle = null;
    let loopStop = false;
    let orbitSfxCooldown = 0; // prevent orbit chime spam
    let currentTrack = 0;

    // ── init ─────────────────────────────────────────────────────────────────

    function boot() {
        if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
        actx = new (window.AudioContext || window.webkitAudioContext)();

        master   = make(actx.createGain, 0.75);
        musicBus = make(actx.createGain, 0.56); musicBus.connect(master);
        sfxBus   = make(actx.createGain, 0.81); sfxBus.connect(master);
        master.connect(actx.destination);
    }

    function make(fn, vol) {
        const g = fn.call(actx);
        g.gain.value = vol;
        return g;
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    function tone(type, freq, start, dur, vol, bus, freqEnd) {
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, start);
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g); g.connect(bus || sfxBus);
        o.start(start); o.stop(start + dur + 0.05);
        return o;
    }

    function reverb(len = 2.4) {
        const sr = actx.sampleRate;
        const buf = actx.createBuffer(2, sr * len, sr);
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c);
            for (let i = 0; i < d.length; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.9);
        }
        const conv = actx.createConvolver();
        conv.buffer = buf;
        conv.connect(musicBus);
        return conv;
    }

    // ── background music ──────────────────────────────────────────────────────
    // Slow pentatonic ambient — meditative, celestial, loops ~38 seconds

    // C major pentatonic, spread across 3 octaves
    const P = {
        C2:65.41, G2:98.00, A2:110.00,
        C3:130.81, D3:146.83, E3:164.81, G3:196.00, A3:220.00,
        C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00,
        C5:523.25, E5:659.25, G5:783.99,
    };

    // Main melody — slow, falling, with breath
    const MELODY = [
        [P.G4,3],[P.E4,2],[P.D4,2],[P.C4,4],
        [P.A3,2],[P.G3,3],[P.A3,2],[P.C4,3],
        [P.D4,2],[P.E4,3],[P.G4,2],[P.E4,2],
        [P.D4,2],[P.C4,5],
    ];

    // Slow bass movement
    const BASS = [
        [P.C2,8],[P.G2,6],[P.A2,6],[P.C2,12],
    ];

    // High accent pings
    const ACCENTS = [
        [P.G5, 0],[P.E5, 7],[P.C5, 14],[P.G5, 22],
    ];

    const BEAT = 0.58; // seconds per beat

    function scheduleLoop(startAt) {
        const rev = reverb();

        // Melody voice (triangle — soft, warm)
        let t = startAt;
        for (const [freq, beats] of MELODY) {
            const dur = beats * BEAT;
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.20, t + 0.06);
            g.gain.setValueAtTime(0.15, t + dur * 0.55);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(rev);
            o.start(t); o.stop(t + dur + 0.1);
            t += dur;
        }
        const loopLen = t - startAt;

        // Bass drone (sine — deep, warm)
        let bt = startAt;
        for (const [freq, beats] of BASS) {
            const dur = beats * BEAT;
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, bt);
            g.gain.linearRampToValueAtTime(0.25, bt + 0.6);
            g.gain.linearRampToValueAtTime(0.0001, bt + dur);
            o.connect(g); g.connect(rev);
            o.start(bt); o.stop(bt + dur + 0.1);
            bt += dur;
        }

        // High accent pings (sine — delicate)
        for (const [freq, beatOffset] of ACCENTS) {
            const at = startAt + beatOffset * BEAT;
            tone('sine', freq, at, 1.6, 0.08, rev);
        }

        return startAt + loopLen + 1.5; // return when next loop should start
    }

    // ── Track 2: Drift ───────────────────────────────────────────────────────
    // Ultra-sparse sine drones. Deep, void-like, almost silent. ~36s loop.
    function scheduleLoop2(startAt) {
        const rev = reverb(3.5);
        [
            [65.41,  0,  14, 0.28],   // C2
            [98.00,  6,  12, 0.22],   // G2
            [55.00, 16,  14, 0.24],   // A1
            [82.41, 22,  12, 0.20],   // E2
        ].forEach(([freq, off, dur, vol]) => {
            const t = startAt + off;
            const o = actx.createOscillator(), g = actx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol,        t + dur * 0.28);
            g.gain.setValueAtTime(vol * 0.8,           t + dur * 0.65);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(rev);
            o.start(t); o.stop(t + dur + 0.2);
        });
        // Rare high shimmers
        [[783.99, 3], [659.25, 18], [523.25, 30]].forEach(([freq, off]) =>
            tone('sine', freq, startAt + off, 3.0, 0.06, rev));
        return startAt + 36;
    }

    // ── Track 3: Wane ────────────────────────────────────────────────────────
    // A minor pentatonic, descending, slightly melancholy. Triangle. ~34s loop.
    const WANE_BEAT = 0.72;
    const WANE_MELODY = [
        [440.00,3],[392.00,2],[329.63,2],[293.66,3],  // A4 G4 E4 D4 — falling
        [220.00,2],[261.63,3],[293.66,2],[329.63,3],  // A3 C4 D4 E4 — rising
        [392.00,2],[329.63,2],[261.63,2],[220.00,4],  // G4 E4 C4 A3 — falling
        [220.00,2],[196.00,2],[220.00,2],[261.63,3],  // A3 G3 A3 C4 — close
    ];
    function scheduleLoop3(startAt) {
        const rev = reverb(2.2);
        let t = startAt;
        for (const [freq, beats] of WANE_MELODY) {
            const dur = beats * WANE_BEAT;
            const o = actx.createOscillator(), g = actx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.18, t + 0.06);
            g.gain.setValueAtTime(0.13,           t + dur * 0.55);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(rev);
            o.start(t); o.stop(t + dur + 0.1);
            t += dur;
        }
        const loopLen = t - startAt;
        // Bass drones A1 → D2
        [[55.00, 0, 16, 0.22], [73.42, 14, 16, 0.22]].forEach(([freq, off, dur, vol]) => {
            const bt = startAt + off;
            const o = actx.createOscillator(), g = actx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, bt);
            g.gain.linearRampToValueAtTime(vol, bt + 0.8);
            g.gain.linearRampToValueAtTime(0.0001, bt + dur);
            o.connect(g); g.connect(rev);
            o.start(bt); o.stop(bt + dur + 0.1);
        });
        // Sparse high accents
        [[880.00, 0], [659.25, 10], [880.00, 22]].forEach(([freq, off]) =>
            tone('sine', freq, startAt + off, 1.8, 0.07, rev));
        return startAt + loopLen + 1.5;
    }

    function startMusic() {
        if (!actx || loopHandle !== null) return;
        loopStop = false;
        let next = actx.currentTime + 0.4;
        const schedulers = [scheduleLoop, scheduleLoop2, scheduleLoop3];

        function tick() {
            if (loopStop) { loopHandle = null; return; }
            next = schedulers[currentTrack](next);
            const waitMs = Math.max(200, (next - actx.currentTime - 5) * 1000);
            loopHandle = setTimeout(tick, waitMs);
        }
        tick();
    }

    function stopMusic() {
        loopStop = true;
        if (loopHandle) { clearTimeout(loopHandle); loopHandle = null; }
    }

    // ── SFX ───────────────────────────────────────────────────────────────────

    function sfxTap() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('triangle', 700, t, 0.13, 0.22, sfxBus, 420);
    }

    function sfxOrbit() {
        if (!actx) return;
        const now = actx.currentTime;
        if (now < orbitSfxCooldown) return; // debounce — max 1 chime per 0.4s
        orbitSfxCooldown = now + 0.4;
        [[523.25, 0], [659.25, 0.07], [784, 0.14]].forEach(([f, d]) => {
            tone('sine', f, now + d, 0.6, 0.13);
        });
    }

    function sfxComet() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('sine', 280, t, 0.45, 0.38, sfxBus, 1400);
        tone('sine', 560, t + 0.04, 0.40, 0.18, sfxBus, 1800);
    }

    function sfxBuy() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('triangle', 580, t, 0.07, 0.22);
        tone('triangle', 870, t + 0.07, 0.09, 0.16);
    }

    function sfxCollapse() {
        if (!actx) return;
        const t = actx.currentTime;
        tone('sine', 95, t, 2.4, 0.55, sfxBus, 26);
        tone('sine', 580, t, 1.6, 0.20, sfxBus, 85);
        tone('triangle', 1500, t + 0.08, 1.0, 0.12, sfxBus, 220);
    }

    function sfxSupernova() {
        if (!actx) return;
        const t = actx.currentTime;
        [130.81, 196, 261.63, 329.63, 392, 523.25].forEach((freq, i) => {
            const o = actx.createOscillator();
            const g = actx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            const st = t + i * 0.14;
            g.gain.setValueAtTime(0, st);
            g.gain.linearRampToValueAtTime(0.32, st + 0.5);
            g.gain.exponentialRampToValueAtTime(0.0001, st + 4);
            o.connect(g); g.connect(master);
            o.start(st); o.stop(st + 4.1);
        });
    }

    // ── mute toggle ───────────────────────────────────────────────────────────

    function setMusicVolume(pct) {
        if (!actx) return;
        musicBus.gain.setTargetAtTime(0.56 * pct / 100, actx.currentTime, 0.1);
    }

    function setSfxVolume(pct) {
        if (!actx) return;
        sfxBus.gain.setTargetAtTime(0.81 * pct / 100, actx.currentTime, 0.1);
    }

    // Set track silently (used on boot before music starts)
    function loadTrack(n) { currentTrack = Math.max(0, Math.min(2, n)); }

    // Crossfade to a new track while running
    function setTrack(n) {
        currentTrack = Math.max(0, Math.min(2, n));
        if (!actx) return;
        const vol = musicBus.gain.value;
        stopMusic();
        musicBus.gain.cancelScheduledValues(actx.currentTime);
        musicBus.gain.setTargetAtTime(0, actx.currentTime, 0.15);
        setTimeout(() => {
            musicBus.gain.setTargetAtTime(vol || 0.56, actx.currentTime, 0.2);
            startMusic();
        }, 600);
    }

    function getTrack() { return currentTrack; }

    function toggleMute() {
        if (!actx) return true;
        muted = !muted;
        master.gain.setTargetAtTime(muted ? 0 : 0.75, actx.currentTime, 0.15);
        return muted;
    }

    function isMuted() { return muted; }

    return {
        boot, startMusic, stopMusic, toggleMute, isMuted,
        setMusicVolume, setSfxVolume,
        setTrack, loadTrack, getTrack,
        sfxTap, sfxOrbit, sfxBuy, sfxComet, sfxCollapse, sfxSupernova,
    };
})();
