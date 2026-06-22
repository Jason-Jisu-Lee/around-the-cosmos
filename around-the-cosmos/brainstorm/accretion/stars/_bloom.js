// Hex Bloom layout — single color, ~10 hexes/category, irregular availability.
(function(){
  const W=58, H=64, RH=H*0.75;
  // pointy-top axial -> pixel
  const ax2px=(q,r)=>({x:W*(q + r/2), y:RH*r});
  // compact honeycomb disk: center first, then ring by ring (so "open" fills from the core out)
  function hexDisk(n){
    const cells=[[0,0]];
    const CD=[[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]];
    for(let ring=1; cells.length<n; ring++){
      let cube=[CD[4][0]*ring,CD[4][1]*ring,CD[4][2]*ring];
      for(let i=0;i<6 && cells.length<n;i++)
        for(let j=0;j<ring && cells.length<n;j++){
          cells.push([cube[0],cube[2]]);           // axial q=x, r=z
          cube=[cube[0]+CD[i][0],cube[1]+CD[i][1],cube[2]+CD[i][2]];
        }
    }
    return cells;
  }
  // irregular total counts + irregular "available now" counts
  const CL=[
   {name:'Lacuna',   count:10, open:3},
   {name:'Orbiters', count:12, open:2},
   {name:'Phenomena',count:9,  open:5},
   {name:'Cycles',   count:11, open:2},
  ];
  let k=1;
  document.getElementById('c').innerHTML = CL.map(cl=>{
    const pts=hexDisk(cl.count).map(([q,r])=>ax2px(q,r));
    const minX=Math.min(...pts.map(p=>p.x)), minY=Math.min(...pts.map(p=>p.y));
    const maxX=Math.max(...pts.map(p=>p.x)), maxY=Math.max(...pts.map(p=>p.y));
    const bw=maxX-minX+W, bh=maxY-minY+H;
    const hexes=pts.map((p,i)=>{
      const open=i<cl.open, x=p.x-minX, y=p.y-minY;
      if(open) return `<div class="hex open" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px"><span class="n">Dummy #${k++}</span><span class="c">✦1</span></div>`;
      return `<div class="hex lock" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px"><div class="inner" style="width:${W-3}px;height:${H-3}px"><span class="n">Dummy #${k++}</span><span class="c">✦2</span></div></div>`;
    }).join('');
    return `<div class="cluster"><div class="ctitle">${cl.name}</div><div class="bloom" style="width:${bw}px;height:${bh}px">${hexes}</div></div>`;
  }).join('');
})();
