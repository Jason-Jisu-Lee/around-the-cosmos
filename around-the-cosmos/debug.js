'use strict';

let debugSpeedMult = 1;
function tickWithDebug(dt) { tick(dt * debugSpeedMult); }

function initDebug() {
    if (!location.search.includes('debug')) return;

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = [
        'position:fixed;bottom:16px;left:16px;z-index:9999',
        'background:rgba(10,10,20,0.92);border:1px solid rgba(106,223,208,0.4)',
        'border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px',
        'font:13px/1 "Segoe UI",sans-serif;color:#c8d0e8;min-width:200px',
    ].join(';');
    panel.innerHTML = `<div style="font-size:11px;letter-spacing:.1em;color:#6adfd0;margin-bottom:2px">DEBUG</div>`;

    const btnStyle = 'background:rgba(106,223,208,0.12);border:1px solid rgba(106,223,208,0.3);color:#c8d0e8;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;text-align:left;';
    const btn = (label, fn) => {
        const b = document.createElement('button');
        b.textContent=label; b.style.cssText=btnStyle; b.onclick=fn; panel.appendChild(b); return b;
    };

    btn('+ ✦ 100',    () => earn(100));
    btn('+ ✦ 1K',     () => earn(1e3));
    btn('+ ✦ 10K',    () => earn(1e4));
    btn('+ ✦ 100K',   () => earn(1e5));
    btn('+ ✦ 1M',     () => earn(1e6));
    btn('+ ✦ 10M',    () => earn(1e7));
    btn('Spawn Comet', () => { G.comet=null; G.cometTimer=0; });
    btn('Reset',       () => { localStorage.removeItem(CFG.SAVE_KEY); G=createInitialState(); buildPanels(); });

    const speedRow = document.createElement('div');
    speedRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:2px';
    speedRow.innerHTML = '<span style="font-size:12px">Speed</span>';
    [1,3,5,10,20].forEach(n => {
        const b=document.createElement('button');
        b.textContent=`×${n}`; b.style.cssText=btnStyle; b.onclick=()=>{debugSpeedMult=n;};
        speedRow.appendChild(b);
    });
    panel.appendChild(speedRow);
    document.body.appendChild(panel);
    panel.style.cursor = 'grab';
    initDraggable(panel);
}
