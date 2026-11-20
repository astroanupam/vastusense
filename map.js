// Map engine: image, calibration, north, boundary polygon, 16-zone and 9x9 overlays.
const M = {
  cv: null, ctx: null, img: null,
  mode: 'view',            // view | scale | north | boundary | centre
  northDeg: 0,             // direction of North on the image, degrees clockwise from "up"
  poly: [], closed: false,
  scalePts: [], pxPerM: 0,
  centre: null,            // manual centre override
  show: {zones: true, grid: false, labels: true, poly: true, brahma: false, rooms: true, cuts: false, feats: true},
  rooms: [],               // {type, pts:[[x,y],...]}
  roomPts: [], curType: 'living',
  zsys: 16,                // 8 | 16 | 24 | 32 sectors
  marker: null,
  feats: [], featKind: 'road', featPts: [],   // site features: {kind, pts:[[x,y]] (road has 2)}
  onChange: null
};

M.init = function(){
  M.cv = document.getElementById('map'); M.ctx = M.cv.getContext('2d');
  M.cv.addEventListener('click', M.click);
  M.cv.addEventListener('dblclick', e => { if(M.mode==='boundary') M.closePoly(); else if(M.mode==='room') M.closeRoom(); else if(M.mode==='feat' && ['duct','pipe'].includes(M.featKind)) M.finishFeat(); });
  M.draw();
};

M.setImage = function(src, cb){
  const im = new Image();
  im.onload = () => {
    M.img = im; M.cv.width = im.naturalWidth; M.cv.height = im.naturalHeight;
    document.getElementById('empty').style.display = 'none';
    M.draw(); cb && cb();
  };
  im.src = src;
};

M.sample = function(){
  // Generated sample plot so the tools can be tried without a map.
  const c = document.createElement('canvas'); c.width = 900; c.height = 650;
  const x = c.getContext('2d');
  x.fillStyle = '#efe8d8'; x.fillRect(0,0,900,650);
  x.strokeStyle = '#555'; x.lineWidth = 4; x.strokeRect(150,100,600,450);
  x.lineWidth = 2; x.strokeRect(150,100,300,220); x.strokeRect(450,100,300,220);
  x.strokeRect(150,320,200,230); x.strokeRect(350,320,400,230);
  x.fillStyle = '#555'; x.font = '18px sans-serif';
  ['Room A','Room B','Room C','Hall'].forEach((t,i)=>x.fillText(t,[250,550,210,520][i],[220,220,440,440][i]));
  x.fillText('SAMPLE PLAN (north = up)', 330, 60);
  M.setImage(c.toDataURL('image/png'));
  M.northDeg = 0; M.poly = [[150,100],[750,100],[750,550],[150,550]]; M.closed = true;
  M.pxPerM = 30; M.draw(); M.changed();
};

M.pos = function(e){
  const r = M.cv.getBoundingClientRect();
  return [(e.clientX-r.left)*M.cv.width/r.width, (e.clientY-r.top)*M.cv.height/r.height];
};

M.getCentre = function(){
  if(M.centre) return M.centre;
  if(M.poly.length >= 3){            // polygon area centroid
    let a=0,cx=0,cy=0;
    for(let i=0;i<M.poly.length;i++){
      const [x0,y0]=M.poly[i],[x1,y1]=M.poly[(i+1)%M.poly.length], f=x0*y1-x1*y0;
      a+=f; cx+=(x0+x1)*f; cy+=(y0+y1)*f;
    }
    if(Math.abs(a)>1e-6) return [cx/(3*a), cy/(3*a)];
  }
  return [M.cv.width/2, M.cv.height/2];
};

// Bearing (0=N, clockwise) of a point as seen from the centre, corrected for map rotation.
M.bearing = function(p){
  const c = M.getCentre();
  let d = Math.atan2(p[0]-c[0], -(p[1]-c[1]))*180/Math.PI;   // clockwise from image-up
  return ((d - M.northDeg) % 360 + 360) % 360;
};
// Zone of a point for the chosen system (8/16 use named zones; 24/32 are numbered sectors by bearing).
M.zoneOf = function(p){
  const n=M.zsys, w=360/n, k=Math.floor(((M.bearing(p)+w/2)%360)/w), mid=k*w;
  if(n===16) return ZONES[k];
  if(n===8) return ZONES[k*2];
  const base=ZONES[Math.round(mid/22.5)%16];
  return {c:(Math.round(mid*10)/10)+'°', sector:true, el:base.el, lord:'', col:base.col};
};

// Rotate point p about the centre by deg (clockwise on screen).
M.rot = function(p, deg){
  const c=M.getCentre(), a=deg*Math.PI/180, dx=p[0]-c[0], dy=p[1]-c[1];
  return [c[0]+dx*Math.cos(a)-dy*Math.sin(a), c[1]+dx*Math.sin(a)+dy*Math.cos(a)];
};
// North-aligned bounding box of the plot, relative to the centre (rotated frame).
M.frame = function(){
  if(M.poly.length<3) return null;
  const c=M.getCentre(), q=M.poly.map(p=>M.rot(p,-M.northDeg).map((v,i)=>v-c[i]));
  const xs=q.map(p=>p[0]), ys=q.map(p=>p[1]);
  return {c, box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
};
// Grid cell of a point: row 0 = north edge, col 0 = west edge. ring: 0 Brahmasthan, 1 inner, 2 outer.
M.cellOf = function(p){
  const f=M.frame(); if(!f) return null;
  const c=f.c, q=M.rot(p,-M.northDeg), x=q[0]-c[0], y=q[1]-c[1], [x0,y0,x1,y1]=f.box;
  const col=Math.floor(9*(x-x0)/(x1-x0)), row=Math.floor(9*(y-y0)/(y1-y0));
  if(col<0||col>8||row<0||row>8) return null;
  const d=Math.max(Math.abs(row-4),Math.abs(col-4));
  return {row,col,id:'ABCDEFGHI'[row]+(col+1),ring:d<=1?0:d<=3?1:2,name:M.devata?M.devata[row*9+col]:''};
};
M.devata = null;

/* ---------- stage 4: shape, cuts, features ---------- */
// Factual outline measurements of the drawn plot.
M.shape = function(){
  const P = M.poly; if(!M.closed || P.length<3) return null;
  const n=P.length, ang=[]; let perim=0, convex=true, sign=0;
  for(let i=0;i<n;i++){
    const a=P[(i+n-1)%n], b=P[i], c=P[(i+1)%n];
    const v1=[a[0]-b[0],a[1]-b[1]], v2=[c[0]-b[0],c[1]-b[1]];
    ang.push(Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1])/(Math.hypot(...v1)*Math.hypot(...v2)||1))))*180/Math.PI);
    perim+=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const cr=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
    if(cr!==0){ if(sign===0) sign=Math.sign(cr); else if(Math.sign(cr)!==sign) convex=false; }
  }
  const f=M.frame(), [x0,y0,x1,y1]=f.box, bw=x1-x0, bh=y1-y0, area=M.areaOf(P);
  const aspect=Math.max(bw,bh)/Math.min(bw,bh), fill=area/(bw*bh);
  const right=ang.every(a=>Math.abs(a-90)<=5);
  let cls;
  if(n===3) cls='tri';
  else if(n===4 && convex && right) cls = aspect<=1.1 ? 'sq' : 'rect';
  else if(n===4 && convex) cls='quad';
  else if(n===6 && !convex && fill>=0.45 && fill<=0.9) cls='l';
  else cls='irr';
  const s = M.pxPerM||0;
  return {cls, n, convex, aspect, fill, area:s?area/s/s:null, perim:s?perim/s:null, bw:s?bw/s:null, bh:s?bh/s:null};
};
// Share of each outer sector (3x3 split of the north-aligned bounding rectangle) that lies outside the plot.
M.cuts = function(){
  const f=M.frame(); if(!f||!M.closed) return null;
  const [x0,y0,x1,y1]=f.box, N=60, miss=[], cnt=Array(9).fill(0), out=Array(9).fill(0);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const qx=x0+(x1-x0)*(i+.5)/N, qy=y0+(y1-y0)*(j+.5)/N;
    const p=M.rot([f.c[0]+qx, f.c[1]+qy], M.northDeg);
    const s=Math.min(2,Math.floor(3*j/N))*3+Math.min(2,Math.floor(3*i/N));
    cnt[s]++; if(!M.inPoly(p,M.poly)){ out[s]++; miss.push([qx,qy]); }
  }
  const names=['NW','N','NE','W','centre','E','SW','S','SE'];
  return {box:f.box, c:f.c, N, miss, sectors:names.map((c,k)=>({c, pct:100*out[k]/cnt[k]}))};
};
const LINE_KINDS = ['road','duct','pipe'];       // drawn as routes through several points
M.pathLen = pts => { let s=0; for(let i=1;i<pts.length;i++) s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return s; };
// Representative point of a feature: the point itself, or the middle of a route.
M.featPoint = f => {
  if(f.pts.length<2) return f.pts[0];
  let half=M.pathLen(f.pts)/2;
  for(let i=1;i<f.pts.length;i++){ const a=f.pts[i-1], b=f.pts[i], d=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(half<=d){ const u=d?half/d:0; return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u]; } half-=d; }
  return f.pts[f.pts.length-1];
};
M.finishFeat = function(){
  M.dedupe(M.featPts);
  if(M.featPts.length>=2) M.feats.push({kind:M.featKind, pts:M.featPts});
  M.featPts=[]; M.mode='view'; M.draw(); M.changed();
};
M.windFrom = null;   // prevailing wind comes FROM this bearing (degrees, 0 = north), set by the HVAC screen
M.featInfo = function(f){
  const p=M.featPoint(f), c=M.getCentre();
  return {zone:M.zoneOf(p), m:M.pxPerM?Math.hypot(p[0]-c[0],p[1]-c[1])/M.pxPerM:null};
};
M.inPoly = function(p, poly){
  let ins=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if(((yi>p[1])!==(yj>p[1])) && (p[0] < (xj-xi)*(p[1]-yi)/(yj-yi)+xi)) ins=!ins;
  }
  return ins;
};

M.polyArea = function(){
  if(M.poly.length<3) return 0; let a=0;
  for(let i=0;i<M.poly.length;i++){const [x0,y0]=M.poly[i],[x1,y1]=M.poly[(i+1)%M.poly.length];a+=x0*y1-x1*y0;}
  return Math.abs(a)/2;
};

// A double-click delivers two clicks; drop the duplicate last point.
M.dedupe = function(a){ const n=a.length; if(n>1 && Math.hypot(a[n-1][0]-a[n-2][0], a[n-1][1]-a[n-2][1])<6) a.pop(); };
M.closePoly = function(){ M.dedupe(M.poly); if(M.poly.length>=3){M.closed=true; M.mode='view'; M.draw(); M.changed();} };
M.closeRoom = function(){
  M.dedupe(M.roomPts);
  if(M.roomPts.length>=3) M.rooms.push({type:M.curType, pts:M.roomPts});
  M.roomPts=[]; M.mode='view'; M.draw(); M.changed();
};
M.centroid = function(poly){
  let a=0,cx=0,cy=0;
  for(let i=0;i<poly.length;i++){ const [x0,y0]=poly[i],[x1,y1]=poly[(i+1)%poly.length], f=x0*y1-x1*y0; a+=f; cx+=(x0+x1)*f; cy+=(y0+y1)*f; }
  return Math.abs(a)>1e-6 ? [cx/(3*a), cy/(3*a)] : poly[0];
};
M.areaOf = function(poly){ let a=0; for(let i=0;i<poly.length;i++){const [x0,y0]=poly[i],[x1,y1]=poly[(i+1)%poly.length];a+=x0*y1-x1*y0;} return Math.abs(a)/2; };
M.roomAt = function(p){ for(let i=M.rooms.length-1;i>=0;i--) if(M.inPoly(p,M.rooms[i].pts)) return M.rooms[i]; return null; };
// Facts about one room: zone and grid cell of its centroid, area in m2 (if scale known).
M.roomInfo = function(r){
  const c=M.centroid(r.pts);
  return {zone:M.zoneOf(c), cell:M.cellOf(c), m2:M.pxPerM?M.areaOf(r.pts)/M.pxPerM/M.pxPerM:null};
};

M.click = function(e){
  const p = M.pos(e);
  if(M.mode==='scale'){
    M.scalePts.push(p); if(M.scalePts.length===2){
      const px = Math.hypot(M.scalePts[0][0]-M.scalePts[1][0], M.scalePts[0][1]-M.scalePts[1][1]);
      const m = parseFloat(prompt(t('p.askdist'),'10'));
      if(m>0){M.pxPerM = px/m;} M.scalePts=[]; M.mode='view';
    }
  } else if(M.mode==='north'){
    // user clicks toward North as seen from the centre
    const c = M.getCentre();
    M.northDeg = Math.atan2(p[0]-c[0], -(p[1]-c[1]))*180/Math.PI; M.mode='view';
  } else if(M.mode==='boundary'){
    if(M.closed){M.poly=[];M.closed=false;}
    M.poly.push(p);
  } else if(M.mode==='feat'){
    M.featPts.push(p);
    if(M.featKind==='road'){ if(M.featPts.length===2){ M.feats.push({kind:'road', pts:M.featPts}); M.featPts=[]; M.mode='view'; } }
    else if(!LINE_KINDS.includes(M.featKind)){ M.feats.push({kind:M.featKind, pts:M.featPts}); M.featPts=[]; M.mode='view'; }
  } else if(M.mode==='room'){ M.roomPts.push(p);
  } else if(M.mode==='centre'){ M.centre = p; M.mode='view'; }
  else { const z = M.zoneOf(p), b = M.bearing(p);
    document.getElementById('zoneinfo').innerHTML =
      (()=>{ const r=M.roomAt(p); return r ? `<b>${t('r.'+r.type)}</b> &middot; ` : ''; })() +
      `<b>${z.sector ? t('zi.sector')+' '+z.c : zoneName(z.c)+' ('+z.c+')'}</b> &middot; ${t('zi.bearing')} ${b.toFixed(1)}&deg; &middot; ${t('zi.element')}: ${t('e.'+z.el)}` +
      (z.lord?` &middot; ${t('zi.lord')}: ${t('l.'+z.lord)}`:'') +
      (M.poly.length>2 ? ` &middot; ${t(M.inPoly(p,M.poly)?'zi.in':'zi.out')}`:'') +
      (()=>{ const k=M.cellOf(p); return k ? ` &middot; ${t('zi.cell')} ${k.id} (${t('ring.'+k.ring)})`+(k.name?` &middot; ${esc(k.name)}`:'') : ''; })();
  }
  M.draw(); M.changed();
};

M.changed = function(){ M.onChange && M.onChange(); };

M.draw = function(){
  const x = M.ctx, W = M.cv.width, H = M.cv.height;
  x.clearRect(0,0,W,H);
  if(M.img) x.drawImage(M.img,0,0); else { x.fillStyle='rgba(120,120,120,.08)'; x.fillRect(0,0,W,H); }
  const lw = Math.max(1, W/700);
  const c = M.getCentre(), R = Math.hypot(W,H);
  const NZ = M.zsys, WZ = 360/NZ;
  const ang = i => (i*WZ - WZ/2 + M.northDeg) * Math.PI/180;
  const zoneAt = i => NZ===16 ? ZONES[i] : NZ===8 ? ZONES[i*2] : ZONES[Math.round(i*WZ/22.5)%16];
  const pt = (a,r) => [c[0]+Math.sin(a)*r, c[1]-Math.cos(a)*r];

  const havePoly = M.poly.length>=3 && M.closed;
  if(M.show.zones && (M.img || havePoly)){
    x.save();
    if(havePoly){ x.beginPath(); M.poly.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.clip(); }
    for(let i=0;i<NZ;i++){
      const z = zoneAt(i), a0 = ang(i), a1 = ang(i+1);
      x.beginPath(); x.moveTo(c[0],c[1]);
      const p0 = pt(a0,R), p1 = pt(a1,R); x.lineTo(p0[0],p0[1]); x.lineTo(p1[0],p1[1]); x.closePath();
      x.fillStyle = z.col+'55'; x.fill();
      x.strokeStyle = '#0006'; x.lineWidth = lw; x.stroke();
    }
    if(M.show.labels) for(let i=0;i<NZ;i++){
      const z = zoneAt(i), m = (i*WZ + M.northDeg)*Math.PI/180;
      const r = havePoly ? Math.min(W,H)*0.28 : Math.min(W,H)*0.38;
      const p = pt(m, r);
      x.font = `bold ${Math.round(W/55)}px sans-serif`; x.textAlign='center'; x.fillStyle='#000c';
      x.fillText((NZ===8||NZ===16) ? z.c : (Math.round(i*WZ*10)/10)+'°', p[0], p[1]);
    }
    x.restore();
  }

  // 9x9 grid: aligned to north, fitted to the plot's bounding box in the north-aligned frame
  const g = (M.show.grid||M.show.brahma) ? M.frame() : null;
  if(g){
    x.save(); x.translate(g.c[0],g.c[1]); x.rotate(M.northDeg*Math.PI/180);
    const [x0,y0,x1,y1]=g.box, cw=(x1-x0)/9, ch=(y1-y0)/9;
    if(M.show.brahma){ x.fillStyle='#ffd54a77'; x.fillRect(x0+3*cw,y0+3*ch,3*cw,3*ch); }
    if(M.show.grid){
      for(let i=0;i<=9;i++){
        x.strokeStyle = (i===3||i===6)?'#a60':'#7a2'; x.lineWidth = lw*((i===3||i===6)?2:1);
        if(i>=3&&i<=6){ x.beginPath(); x.moveTo(x0+cw*i,y0); x.lineTo(x0+cw*i,y1); x.stroke(); x.beginPath(); x.moveTo(x0,y0+ch*i); x.lineTo(x1,y0+ch*i); x.stroke(); }
        else { x.beginPath(); x.moveTo(x0+cw*i,y0); x.lineTo(x0+cw*i,y1); x.stroke(); x.beginPath(); x.moveTo(x0,y0+ch*i); x.lineTo(x1,y0+ch*i); x.stroke(); }
      }
      x.fillStyle='#000b'; x.font=`${Math.round(W/75)}px sans-serif`; x.textAlign='center';
      if(M.devata) for(let r=0;r<9;r++)for(let q=0;q<9;q++){ const n=M.devata[r*9+q]; if(n) x.fillText(n, x0+cw*(q+.5), y0+ch*(r+.5)+3); }
    }
    x.restore();
  }

  // boundary
  if(M.show.poly && M.poly.length){
    x.strokeStyle='#d02'; x.lineWidth=lw*2.5; x.beginPath();
    M.poly.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); if(M.closed) x.closePath(); x.stroke();
    x.fillStyle='#d02'; M.poly.forEach(p=>{x.beginPath();x.arc(p[0],p[1],lw*4,0,7);x.fill();});
  }
  // rooms (finished and in progress)
  const rcol = {toilet:'#3b82f6',bath:'#3b82f6',kitchen:'#ef4444',puja:'#f59e0b',tank:'#06b6d4',septic:'#64748b',stair:'#a855f7',entrance:'#22c55e'};
  if(M.show.rooms){
    M.rooms.forEach(r=>{
      x.beginPath(); r.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath();
      x.fillStyle=(rcol[r.type]||'#0ea5a4')+'66'; x.fill(); x.strokeStyle='#000a'; x.lineWidth=lw*1.5; x.stroke();
      const cc=M.centroid(r.pts); x.fillStyle='#000'; x.font=`bold ${Math.round(W/60)}px sans-serif`; x.textAlign='center';
      x.fillText(t('r.'+r.type), cc[0], cc[1]);
    });
  }
  if(M.roomPts.length){
    x.strokeStyle='#06c'; x.lineWidth=lw*2; x.beginPath(); M.roomPts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke();
    x.fillStyle='#06c'; M.roomPts.forEach(p=>{x.beginPath();x.arc(p[0],p[1],lw*4,0,7);x.fill();});
  }
  // cuts: cells of the bounding rectangle that lie outside the plot
  if(M.show.cuts){
    const cu=M.cuts();
    if(cu){ x.save(); x.translate(cu.c[0],cu.c[1]); x.rotate(M.northDeg*Math.PI/180);
      const cw=(cu.box[2]-cu.box[0])/cu.N, ch=(cu.box[3]-cu.box[1])/cu.N; x.fillStyle='#e0202055';
      cu.miss.forEach(m=>x.fillRect(m[0]-cw/2,m[1]-ch/2,cw+.5,ch+.5)); x.restore(); }
  }
  // site features
  const fcol={door:'#d35400',ahu:'#2e86c1',chiller:'#1b4f72',ctower:'#148f77',odu:'#117a65',plantroom:'#5d6d7e',fai:'#28b463',exh:'#cb4335',kexh:'#a04000',duct:'#2e86c1',pipe:'#c0392b',mpanel:'#d4ac0d',xfmr:'#b7950b',dg:'#9a7d0a',earth:'#7d6608',meter:'#f4d03f',ohtank:'#1f618d',stp:'#5d6d7e',manhole:'#7b7d7d',pump:'#2471a3',fexit:'#c0392b',hydrant:'#e74c3c',fpump:'#922b21',assembly:'#229954',lift:'#6c3483',shaft:'#4a235a',stairc:'#8e44ad',road:'#444',tjunction:'#c0392b',deadend:'#e67e22',water:'#2980b9',tallbld:'#7f8c8d',pole:'#f1c40f',temple:'#d35400',borewell:'#16a085',well:'#1abc9c',sump:'#0e6655',tree:'#27ae60',plant:'#2ecc71',other:'#8e44ad'};
  const fsym={door:'D',ahu:'U',chiller:'C',ctower:'K',odu:'R',plantroom:'Q',fai:'I',exh:'J',kexh:'j',mpanel:'E',xfmr:'X',dg:'G',earth:'e',meter:'M',ohtank:'O',stp:'Z',manhole:'H',pump:'p',fexit:'F',hydrant:'h',fpump:'f',assembly:'A',lift:'L',shaft:'#',stairc:'=',tjunction:'T',deadend:'D',water:'W',tallbld:'B',pole:'P',temple:'❀',borewell:'○',well:'◎',sump:'S',tree:'♣',plant:'•',other:'?'};
  if(M.show.feats){
    M.feats.forEach(f=>{
      const col=fcol[f.kind]||'#000';
      if(LINE_KINDS.includes(f.kind)){
        const wd = f.kind==='road' ? 7 : f.kind==='duct' ? 4 : 2.5;
        x.strokeStyle=col; x.lineWidth=lw*wd; x.lineCap='round'; x.lineJoin='round'; x.beginPath(); f.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke();
        if(f.kind==='road'){ x.strokeStyle='#fff'; x.lineWidth=lw*1.5; x.setLineDash([lw*8,lw*8]); x.stroke(); x.setLineDash([]); } }
      else { const p=f.pts[0], r=lw*9; x.fillStyle=col; x.beginPath(); x.arc(p[0],p[1],r,0,7); x.fill(); x.fillStyle='#fff'; x.font=`bold ${Math.round(r*1.2)}px sans-serif`; x.textAlign='center'; x.fillText(fsym[f.kind]||'?',p[0],p[1]+r*.42); }
    });
    if(M.featPts.length>1){ x.strokeStyle='#06c'; x.lineWidth=lw*2; x.beginPath(); M.featPts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke(); }
    if(M.featPts.length){ x.fillStyle='#06c'; M.featPts.forEach(p=>{x.beginPath();x.arc(p[0],p[1],lw*5,0,7);x.fill();}); }
  }
  // prevailing wind arrow (points the way the wind blows)
  if(M.windFrom!==null && M.windFrom!==''){
    const wa=(M.windFrom+180+M.northDeg)*Math.PI/180, wx=70, wy=H-70, L2=45;
    x.strokeStyle='#1a5276'; x.fillStyle='#1a5276'; x.lineWidth=lw*3; x.beginPath();
    x.moveTo(wx-Math.sin(wa)*L2, wy+Math.cos(wa)*L2); x.lineTo(wx+Math.sin(wa)*L2, wy-Math.cos(wa)*L2); x.stroke();
    const tx=wx+Math.sin(wa)*L2, ty=wy-Math.cos(wa)*L2; x.beginPath(); x.moveTo(tx,ty);
    x.lineTo(tx-Math.sin(wa-.5)*14, ty+Math.cos(wa-.5)*14); x.lineTo(tx-Math.sin(wa+.5)*14, ty+Math.cos(wa+.5)*14); x.closePath(); x.fill();
    x.font=`bold ${Math.round(W/55)}px sans-serif`; x.textAlign='center'; x.fillText('wind', wx, wy+L2+Math.round(W/40)); }
  // electrical load centre marker (set by the Electrical screen)
  if(M.marker){ const m=M.marker, r=lw*10; x.strokeStyle='#d4ac0d'; x.lineWidth=lw*3; x.beginPath(); x.moveTo(m[0],m[1]-r); x.lineTo(m[0]+r,m[1]); x.lineTo(m[0],m[1]+r); x.lineTo(m[0]-r,m[1]); x.closePath(); x.stroke();
    x.fillStyle='#000'; x.font=`bold ${Math.round(W/60)}px sans-serif`; x.textAlign='center'; x.fillText('LC',m[0],m[1]+r+Math.round(W/55)); }
  // centre mark
  x.strokeStyle='#000'; x.lineWidth=lw*2; x.beginPath(); x.arc(c[0],c[1],lw*8,0,7); x.stroke();
  // scale points
  M.scalePts.forEach(p=>{x.fillStyle='#08f';x.beginPath();x.arc(p[0],p[1],lw*5,0,7);x.fill();});
  // north arrow
  const na = M.northDeg*Math.PI/180, ax=W-70, ay=70, L=45;
  x.strokeStyle='#000'; x.fillStyle='#000'; x.lineWidth=lw*3;
  x.beginPath(); x.moveTo(ax-Math.sin(na)*L*.5, ay+Math.cos(na)*L*.5); x.lineTo(ax+Math.sin(na)*L, ay-Math.cos(na)*L); x.stroke();
  x.font=`bold ${Math.round(W/40)}px sans-serif`; x.textAlign='center';
  x.fillText('N', ax+Math.sin(na)*(L+16), ay-Math.cos(na)*(L+16)+6);
  // mode hint
  if(M.mode!=='view' && L['h.'+M.mode]){x.fillStyle='#000a';x.fillRect(0,0,W,Math.round(W/28)+10);x.fillStyle='#fff';x.font=`${Math.round(W/46)}px sans-serif`;x.textAlign='center';x.fillText(t('h.'+M.mode),W/2,Math.round(W/46)+4);}
};
