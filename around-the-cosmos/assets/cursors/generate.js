'use strict';
// Pure-Node PNG generator for the in-game cursor (no dependencies).
// A simple, clean triangle pointer - slim blade aimed at the top-left.
// 32x32, single flat ink color, crisp anti-aliased edges (supersampled).
// Hotspot = the tip at 3,3.  Run: node assets/cursors/generate.js
const zlib = require('zlib'), fs = require('fs'), path = require('path');

// ── PNG encode (RGBA, 8-bit) ─────────────────────────────────────────────────
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
}
function encodePNG(N, rgba) {
    const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
    const raw = Buffer.alloc((N * 4 + 1) * N);
    for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; for (let x = 0; x < N * 4; x++) raw[y * (N * 4 + 1) + 1 + x] = rgba[y * N * 4 + x]; }
    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ── geometry ─────────────────────────────────────────────────────────────────
function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
}

// A slim triangle: tip top-left, two base corners down-right. Clean straight edges.
const N = 32, INK = [26, 26, 26];
const TRI = [[3, 3], [22.5, 14], [14, 22.5]];

// Supersampled coverage → smooth alpha, one flat color.
const S = 6;
const out = Buffer.alloc(N * N * 4);
for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    let cov = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++)
        if (inPoly(px + (sx + 0.5) / S, py + (sy + 0.5) / S, TRI)) cov++;
    const o = (py * N + px) * 4;
    out[o] = INK[0]; out[o + 1] = INK[1]; out[o + 2] = INK[2];
    out[o + 3] = Math.round((cov / (S * S)) * 255);
}
fs.writeFileSync(path.join(__dirname, 'needle.png'), encodePNG(N, out));
console.log('wrote needle.png (32x32, hotspot 3,3)');
