'use strict';

// Public facade — the rest of the game only ever touches SoundSystem.*; the actual
// implementation is split across sound/core.js, sound/effects/, and sound/music/.
const SoundSystem = {
    boot: audioBoot,
    startMusic, stopMusic,
    toggleMute, isMuted,
    setMusicVolume, setSfxVolume,
    setTrack, loadTrack, getTrack,
    sfxTap, sfxOrbit, sfxBuy, sfxComet,
};
