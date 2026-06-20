'use strict';

// Sound effects — short procedural blips. All no-op until the audio engine is booted.
let orbitSfxCooldown = 0;

function sfxTap()  { if (!SND.ctx) return; tone('triangle', 700, SND.ctx.currentTime, 0.13, 0.22, SND.sfxBus, 420); }
function sfxOrbit() {
    if (!SND.ctx) return;
    const now = SND.ctx.currentTime;
    if (now < orbitSfxCooldown) return;     // don't stack when many orbits land at once
    orbitSfxCooldown = now + 0.4;
    [[523.25,0],[659.25,0.07],[784,0.14]].forEach(([f,d]) => tone('sine',f,now+d,0.6,0.13));
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
// Played when an upgrade reaches max level — a soft ascending chime (E5-B5-E6).
function sfxComplete() {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    [[659.25,0.00,0.11],[987.77,0.07,0.11],[1318.51,0.15,0.08]]
        .forEach(([f,d,v]) => tone('sine', f, t+d, 0.7, v, SND.sfxBus));
}
