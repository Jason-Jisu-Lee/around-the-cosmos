'use strict';

// The background music is ONE looping audio file: sound/music/background.ogg
// ("lolurio Free Sci-fi Music", user-picked free asset). It plays through the WebAudio graph
// (musicSession -> musicBus -> master -> limiter), so the Music volume slider, the mute button,
// pause and the output limiter all apply. Playback RESUMES from where it stopped (pause keeps
// the position instead of restarting the track). The procedural tracks (Celestial/Drift/Wane,
// then Perigee) are gone; their auditions live on in test/music-demo.html.

const MUSIC_FILE = 'sound/music/background.ogg';
const MUSIC_FILE_GAIN = 1.0;   // trim knob for the file's own loudness (raise/lower just the music file)

let musicBuf = null, musicLoading = false;
let musicSrc = null, musicStartedAt = 0, musicOffset = 0;
let musicWanted = false;       // startMusic was called and not yet stopped (so a finished load auto-plays)
let musicFallback = null;      // <audio> element fallback when fetch/decode fails (e.g. file:// pages)

function loadMusicFile() {
    if (musicBuf || musicLoading || musicFallback) return;
    musicLoading = true;
    fetch(MUSIC_FILE)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(ab => SND.ctx.decodeAudioData(ab))
        .then(buf => { musicBuf = buf; musicLoading = false; if (musicWanted) startMusic(); })
        .catch(() => {
            // fetch is blocked on file:// pages - fall back to a looping <audio> element, still
            // routed into musicBus via MediaElementSource so volume/mute keep working
            musicLoading = false;
            try {
                musicFallback = new Audio(MUSIC_FILE);
                musicFallback.loop = true;
                SND.ctx.createMediaElementSource(musicFallback).connect(SND.musicBus);
                if (musicWanted) musicFallback.play().catch(() => {});
            } catch (_) { musicFallback = null; }
        });
}

function startMusic() {
    if (!SND.ctx) return;
    musicWanted = true;
    if (musicFallback) { musicFallback.play().catch(() => {}); return; }
    if (!musicBuf) { loadMusicFile(); return; }   // plays as soon as the decode finishes
    if (musicSrc) return;                          // already playing
    SND.musicSession = SND.ctx.createGain();
    SND.musicSession.gain.setValueAtTime(0, SND.ctx.currentTime);
    SND.musicSession.gain.linearRampToValueAtTime(MUSIC_FILE_GAIN, SND.ctx.currentTime + 0.35);
    SND.musicSession.connect(SND.musicBus);
    musicSrc = SND.ctx.createBufferSource();
    musicSrc.buffer = musicBuf;
    musicSrc.loop = true;
    musicSrc.connect(SND.musicSession);
    musicOffset %= musicBuf.duration;
    musicSrc.start(0, musicOffset);
    musicStartedAt = SND.ctx.currentTime;
}

function stopMusic() {
    musicWanted = false;
    if (musicFallback) { musicFallback.pause(); return; }
    if (musicSrc) {
        musicOffset = (musicOffset + SND.ctx.currentTime - musicStartedAt) % musicBuf.duration;
        try { musicSrc.stop(); } catch (_) {}
        musicSrc.disconnect(); musicSrc = null;
    }
    if (SND.musicSession) { SND.musicSession.disconnect(); SND.musicSession = null; }
}
