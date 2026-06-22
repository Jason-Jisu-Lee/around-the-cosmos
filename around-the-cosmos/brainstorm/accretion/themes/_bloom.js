// Shared Hex Bloom layout. Each theme page sets window.HEX (inner markup fn) + categoryColors before loading this.
(function(){
  const CC = window.CATCOLORS;
  const W=70, H=78, RH=H*0.75;
  const px=(c,r)=> c*W + (r&1)*(W/2);
  const py=(r)=> r*RH;
  // irregular cluster sizes + irregular "available now" counts
  const CL=[
   {name:'Lacuna',  col:CC.Lacuna,  open:2, cells:[[0,0],[1,0],[0,1],[1,1],[0,2]]},
   {name:'Orbiters',col:CC.Orbiters,open:1, cells:[[0,0],[1,0],[0,1],[1,1]]},
   {name:'Phenomena',col:CC.Phenomena,open:3, cells:[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]},
   {name:'Cycles',  col:CC.Cycles,  open:2, cells:[[0,0],[1,0],[1,1],[0,1],[1,2]]},
  ];
  let k=1;
  document.getElementById('c').innerHTML = CL.map(cl=>{
    const pts = cl.cells.map(([c,r])=>({x:px(c,r),y:py(r)}));
    const minX=Math.min(...pts.map(p=>p.x)), minY=Math.min(...pts.map(p=>p.y));
    const maxX=Math.max(...pts.map(p=>p.x)), maxY=Math.max(...pts.map(p=>p.y));
    const bw=maxX-minX+W, bh=maxY-minY+H;
    const hexes = pts.map((p,i)=>{
      const open=i<cl.open;
      return window.HEX({open,k:k++,col:cl.col,W,H,left:p.x-minX,top:p.y-minY,cost:open?1:2});
    }).join('');
    return `<div class="cluster"><div class="ctitle" style="color:${cl.col}">${cl.name}</div>
      <div class="bloom" style="width:${bw}px;height:${bh}px">${hexes}</div></div>`;
  }).join('');
  if(window.LEGEND) window.LEGEND(CL);
})();
