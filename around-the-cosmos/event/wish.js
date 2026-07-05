'use strict';

// Falling Star Wish (design 4 "Constellation Choice" from test/event-designs.html):
// a star streaks across the WINDOW (own overlay #wish-layer, z65). Click it -> the game
// PAUSES (main.js `frozen` reads `wishChoosing`) and three faint constellations appear;
// click one to take its wish, then play resumes. The three offers are ROLLED per star
// (Bright Tail x2-x4 next comet / Warm Current +10-40% stardust for 60s / Small Gift
// x5-x30 pulse) and the rolled numbers are shown BIG so the choice is informed.
// First star ever at the 120s universe mark (G.tutSeen.wishSpawned marks "has appeared");
// afterwards every 60-70s. A feeding vortex blocks new stars. The first CLICK ever fires
// the `wish` tutorial ("A Falling Star! Choose your starwish"), then the picker opens.
const WISH = { FIRST_AT: 120, GAP_MIN: 60, GAP_MAX: 70, CATCH_R: 44 };

let wishLayer = null, wishCtx = null;
let wishStar = null;            // { x,y,vx,vy,trail[],frozen }
let wishChoosing = false;       // freezes the game while the picker is up
let wishOpenAfterTut = false;   // first star ever: the callout IS the catch - picker opens right after Okay
let wishTimer = 0;
let wishOffers = null;          // the 3 rolled offers [{name, val, desc, apply}]
const wishFx = [];              // rising +✦ floats on the overlay

// ---- active wish effects (read by comet.js and state.js earn) ----
let wishNextCometMult = 1;
let wishWarmUntil = -1, wishWarmPct = 0;
function wishCometMultTake() { const m = wishNextCometMult; wishNextCometMult = 1; return m; }
function wishIncomeMult() { return (typeof gameClock !== 'undefined' && gameClock < wishWarmUntil) ? 1 + wishWarmPct / 100 : 1; }

const WISH_CONS = [   // the three constellation shapes (relative points)
    [[-36, 10], [-10, -12], [18, -2], [38, -24]],
    [[-30, -16], [-10, 6], [16, -2], [30, 22], [4, 32]],
    [[-18, 14], [10, 14], [-4, -10], [-18, 14]],
];

function rollWishOffers() {
    const gs = (typeof generousStarsMult === 'function') ? generousStarsMult() : 1;   // Generous Stars Mass upgrade: x1.5
    const tail = ((2 + Math.random() * 2) * gs).toFixed(1);          // x2.0 - x4.0 (x3.0 - x6.0 with Generous Stars)
    const warm = Math.round((10 + Math.random() * 30) * gs);         // +10% - +40%
    const gift = Math.round((5 + Math.random() * 25) * gs);          // x5 - x30
    wishOffers = [
        { name: 'Bright Tail',  val: 'x' + tail,        desc: 'next comet',
          apply() { wishNextCometMult = parseFloat(tail); } },
        { name: 'Warm Current', val: '+' + warm + '%',  desc: 'stardust for 60s',
          apply() { wishWarmPct = warm; wishWarmUntil = gameClock + 60; } },
        { name: 'Small Gift',   val: 'x' + gift,        desc: 'pulse',
          apply() { earn(Math.max(gift, gift * pulseValue()), CX, CY - 30); } },
    ];
}

// speed varies +-20% per star; the FIRST star ever flies noticeably slower (slow=true, x0.65 fixed)
function spawnWishStar(slow) {
    const fromLeft = Math.random() < 0.5;
    const k = slow ? 0.65 : (0.9 + Math.random() * 0.4);
    wishStar = {
        x: fromLeft ? -20 : innerWidth + 20,
        y: 40 + Math.random() * (innerHeight * 0.35),
        vx: (fromLeft ? 1 : -1) * (innerWidth / 7) * k,
        vy: innerHeight / 12 * (slow ? 0.7 : (0.8 + Math.random() * 0.6)),
        trail: [], frozen: false,
    };
}

function wishGap() { return WISH.GAP_MIN + Math.random() * (WISH.GAP_MAX - WISH.GAP_MIN); }

function wishTick(dt) {
    for (let i = wishFx.length - 1; i >= 0; i--) { wishFx[i].age += dt; if (wishFx[i].age >= wishFx[i].maxAge) wishFx.splice(i, 1); }
    // first star ever: the callout counted as the catch - open the picker the moment it closes
    if (wishOpenAfterTut && (typeof tutorialActive === 'undefined' || !tutorialActive)) {
        wishOpenAfterTut = false;
        openWishChoice();
        return;
    }
    if (wishChoosing) return;

    // First star ever: comet-style callout 1.75s after spawn, freezing it mid-flight. Acknowledging
    // it COUNTS AS THE CATCH (no second click) - Okay goes straight to the wish picker. Clicking the
    // star before the callout also just opens the picker and counts as learned.
    if (G.tutSeen && !G.tutSeen.wish && wishStar && !wishStar.frozen) {
        if (wishStar.tutAt == null) wishStar.tutAt = gameClock + 1.61;
        const onScreen = wishStar.x > 60 && wishStar.x < innerWidth - 60 && wishStar.y > 20 && wishStar.y < innerHeight - 80;
        const gapOk = typeof lastTutEndClock === 'undefined' || gameClock - lastTutEndClock >= 8;
        if (gameClock >= wishStar.tutAt && onScreen && gapOk && (typeof tutorialActive === 'undefined' || !tutorialActive)) {
            G.tutSeen.wish = true; saveGame();
            wishStar.frozen = true;      // the callout IS the catch
            rollWishOffers();
            wishOpenAfterTut = true;
            const R = 42;
            startTutorial([{
                getRect: () => wishStar ? ({ left: wishStar.x - R, top: wishStar.y - R, right: wishStar.x + R, width: R * 2, height: R * 2 }) : null,
                body: 'A Falling Star! Choose your starwish',
            }]);
            return;
        }
    }

    if (!wishStar) {
        const vortexUp = typeof VTX !== 'undefined' && VTX.active;   // a feeding vortex blocks NEW events
        if (G.tutSeen && !G.tutSeen.wishSpawned) {                    // first star ever: the 120s mark
            if (G.universeTime >= WISH.FIRST_AT && !vortexUp) { G.tutSeen.wishSpawned = true; saveGame(); spawnWishStar(true); }
            return;
        }
        wishTimer -= dt;
        if (wishTimer <= 0 && !vortexUp) spawnWishStar();
        return;
    }
    if (wishStar.frozen) return;   // caught, waiting on the tutorial
    const s = wishStar;
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.trail.unshift({ x: s.x, y: s.y }); if (s.trail.length > 26) s.trail.pop();
    if (s.x < -40 || s.x > innerWidth + 40 || s.y > innerHeight + 40) { wishStar = null; wishTimer = wishGap(); }
}

function openWishChoice() {
    wishChoosing = true;
    if (wishLayer) wishLayer.style.pointerEvents = 'auto';   // the overlay swallows every click while choosing
}

function chooseWish(i) {
    const o = wishOffers[i];
    o.apply();
    wishFx.push({ x: innerWidth / 2, y: innerHeight / 2 - 40, text: o.name + '  ' + o.val, age: 0, maxAge: 1.6 });
    wishChoosing = false; wishStar = null; wishOffers = null;
    if (wishLayer) wishLayer.style.pointerEvents = 'none';
    wishTimer = wishGap();
    SoundSystem.sfxComplete();
}

// the picker's three click zones (kept in sync with drawWishLayer's layout)
function wishZones() {
    const W = innerWidth, H = innerHeight, zw = 250, zh = 210, gap = 46;
    const x0 = W / 2 - (3 * zw + 2 * gap) / 2, y = H / 2 - zh / 2;
    return [0, 1, 2].map(i => ({ x: x0 + i * (zw + gap), y, w: zw, h: zh }));
}

let wishLayerHad = true;
function drawWishLayer(t) {
    if (!wishCtx) return;
    const has = !!wishStar || wishChoosing || wishFx.length > 0;
    if (!has && !wishLayerHad) return;
    wishLayerHad = has;
    const g = wishCtx;
    g.clearRect(0, 0, innerWidth, innerHeight);

    if (wishStar) {
        const s = wishStar;
        s.trail.forEach((p, i) => {
            const k = 1 - i / s.trail.length;
            g.fillStyle = `rgba(201,162,74,${(k * 0.55).toFixed(3)})`;
            g.beginPath(); g.arc(p.x, p.y, k * 4.4, 0, 7); g.fill();
        });
        const gl = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 26);
        gl.addColorStop(0, 'rgba(255,236,180,0.55)'); gl.addColorStop(1, 'rgba(255,236,180,0)');
        g.fillStyle = gl; g.beginPath(); g.arc(s.x, s.y, 26, 0, 7); g.fill();
        g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(s.x, s.y, 5, 0, 7); g.fill();
        g.strokeStyle = 'rgba(60,80,70,0.5)'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(s.x, s.y, 15 + Math.sin(t * 6) * 2.5, 0, 7); g.stroke();
        if (!wishChoosing && !s.frozen && Math.hypot(winMx - s.x, winMy - s.y) < WISH.CATCH_R) {
            drawReticle(s.x, s.y, 18 + Math.sin(t * 4) * 1.5, g);
            g.fillStyle = 'rgba(60,80,70,0.9)'; g.font = "600 12px 'Segoe UI',sans-serif";
            g.textAlign = 'center'; g.textBaseline = 'alphabetic';
            g.fillText('Falling Star', s.x, s.y - 28);
        }
    }

    if (wishChoosing && wishOffers) {
        g.fillStyle = 'rgba(40,38,30,0.34)'; g.fillRect(0, 0, innerWidth, innerHeight);
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillStyle = '#f4efe4'; g.font = 'italic 19px Georgia,serif';
        g.fillText('Choose your starwish.', innerWidth / 2, innerHeight / 2 - 150);
        wishZones().forEach((z, i) => {
            const cx = z.x + z.w / 2, cy = z.y + 62, glow = 0.5 + 0.5 * Math.sin(t * 2 + i * 2.1);
            // the constellation
            g.strokeStyle = `rgba(232,220,190,${(0.3 + glow * 0.25).toFixed(3)})`; g.lineWidth = 1.2; g.setLineDash([4, 7]);
            g.beginPath(); WISH_CONS[i].forEach((p, k) => k ? g.lineTo(cx + p[0], cy + p[1]) : g.moveTo(cx + p[0], cy + p[1])); g.stroke();
            g.setLineDash([]);
            WISH_CONS[i].forEach(p => { g.fillStyle = `rgba(240,228,196,${(0.55 + glow * 0.4).toFixed(3)})`; g.beginPath(); g.arc(cx + p[0], cy + p[1], 2.6, 0, 7); g.fill(); });
            // name + the ROLLED VALUE, big and unmissable
            g.fillStyle = 'rgba(244,239,228,0.9)'; g.font = '600 15px Georgia,serif';
            g.fillText(wishOffers[i].name, cx, cy + 62);
            g.fillStyle = '#ffe9a8'; g.font = '700 40px Georgia,serif';
            g.fillText(wishOffers[i].val, cx, cy + 106);
            g.fillStyle = 'rgba(244,239,228,0.62)'; g.font = "12.5px 'Segoe UI',sans-serif";
            g.fillText(wishOffers[i].desc, cx, cy + 128);
        });
    }

    for (const fx of wishFx) {
        const a = Math.max(0, 1 - fx.age / fx.maxAge);
        g.fillStyle = `rgba(26,26,26,${a.toFixed(3)})`; g.font = "700 20px 'Segoe UI',sans-serif";
        g.textAlign = 'center';
        g.fillText(fx.text, fx.x, fx.y - fx.age * 40);
    }
}

function wishInit() {
    wishLayer = document.getElementById('wish-layer');
    if (!wishLayer) return;
    wishCtx = wishLayer.getContext('2d');
    const resizeWish = () => {
        const dpr = window.devicePixelRatio || 1;
        wishLayer.width = Math.round(innerWidth * dpr); wishLayer.height = Math.round(innerHeight * dpr);
        wishCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeWish();
    window.addEventListener('resize', resizeWish);

    // choosing: the layer is pointer-events:auto and takes the click itself
    wishLayer.addEventListener('mousedown', e => {
        if (!wishChoosing || !wishOffers) return;
        wishZones().forEach((z, i) => {
            if (e.clientX > z.x && e.clientX < z.x + z.w && e.clientY > z.y && e.clientY < z.y + z.h) chooseWish(i);
        });
        e.stopPropagation();
    });

    // catching the star: window-level capture, same manners as the comet catch
    window.addEventListener('mousedown', e => {
        if (!wishStar || wishStar.frozen || wishChoosing) return;
        if (typeof tutorialActive !== 'undefined' && tutorialActive) return;
        if (e.target.closest('button, input, label, a, .upgrade-card, .acc-node, #observatory, #settings-panel, #upg-pop, .acc-confirm, #accretion-screen')) return;
        const dx = e.clientX - wishStar.x, dy = e.clientY - wishStar.y;
        if (dx * dx + dy * dy > WISH.CATCH_R * WISH.CATCH_R) return;
        e.stopPropagation();
        wishStar.frozen = true;
        rollWishOffers();
        if (G.tutSeen && !G.tutSeen.wish) { G.tutSeen.wish = true; saveGame(); }   // catching early counts as learned
        openWishChoice();
    }, true);
}
