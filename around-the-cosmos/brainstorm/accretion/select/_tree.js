// Shared data + tree builder + unique Mass icon. Each mock wires its own selector -> select(name).
window.CATS = ['Lacuna','Orbiters','Phenomena','Cycles'];
window.CATSUB = {
  Lacuna:   'The dark center, deepened.',
  Orbiters: 'Bodies that circle and pay.',
  Phenomena:'Comets, light, rare events.',
  Cycles:   'Time, rhythm, automation.',
};

// Mass icon: a ringed accreting mass (disc + tilted ring) — deliberately NOT a star.
window.MASS_SVG = (s)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none">
  <ellipse cx="12" cy="12" rx="10.5" ry="3.9" transform="rotate(-22 12 12)" stroke="#a8853a" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="4.6" fill="#a8853a"/></svg>`;

// [state, level, max] — irregular tier widths + irregular availability
const TREE = {
  Lacuna: [
    [['max',5,5]],
    [['up',4,5],['up',2,4]],
    [['avail',0,5],['avail',0,5]],
    [['lock',0,3],['lock',0,5],['lock',0,5]],
    [['lock',0,5],['lock',0,5]],
  ],
  Orbiters: [
    [['max',5,5],['max',3,3]],
    [['up',3,5],['up',1,4],['avail',0,5]],
    [['avail',0,5],['lock',0,5]],
    [['lock',0,5],['lock',0,5],['lock',0,5]],
    [['lock',0,5],['lock',0,5]],
  ],
  Phenomena: [
    [['max',5,5]],
    [['up',3,5],['up',2,5]],
    [['avail',0,5],['avail',0,5],['avail',0,5]],
    [['avail',0,5],['avail',0,5],['lock',0,5]],
  ],
  Cycles: [
    [['max',4,4]],
    [['up',2,5]],
    [['avail',0,5],['lock',0,5]],
    [['lock',0,5],['lock',0,5],['lock',0,5]],
    [['lock',0,5],['lock',0,5],['lock',0,5],['lock',0,5]],
  ],
};

window.buildTree = function(name){
  let k=1;
  return TREE[name].map((tier,ti)=>{
    const nodes = tier.map(([s,l,m])=>{
      const pct = s==='max'?100:(m?Math.round(l/m*100):0);
      const lv  = s==='max'?'MAX':`${l} / ${m}`;
      return `<div class="node ${s}"><div class="nrow"><span class="nm">Dummy #${k++}</span><span class="lv">${lv}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
    }).join('');
    return (ti?`<div class="conn"></div>`:'') + `<div class="tier">${nodes}</div>`;
  }).join('');
};
