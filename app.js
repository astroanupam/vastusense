const P = {name:'', siteType:'', client:'', phone:'', address:'', imgData:null};
let cur = {sec:'map', sub:'upload'};
const $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"'`]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
const store = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

/* ---------- security: validation of everything that comes from outside ---------- */
// Anything typed, uploaded or loaded from a file is untrusted. Text is escaped when shown (esc), and files are rebuilt
// from a whitelist (sanitizeProject) so unknown keys, odd types, scripts and external links never reach the page.
const LIMITS = {project:25*1024*1024, small:2*1024*1024, image:12*1024*1024, text:300, area:4000};
const IMG_TYPES = ['image/png','image/jpeg','image/webp','image/gif'];
const sStr = (v,max=LIMITS.text) => typeof v==='string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').slice(0,max) : '';
const sNum = (v,min,max,def) => { const n=+v; return (typeof v==='number'||typeof v==='string') && v!=='' && isFinite(n) ? Math.min(max,Math.max(min,n)) : def; };
const sNumStr = v => (typeof v==='string'||typeof v==='number') && /^-?\d{0,9}(\.\d{0,6})?$/.test(String(v)) ? String(v) : '';
const sPt = p => Array.isArray(p) && p.length===2 && p.every(n=>typeof n==='number' && isFinite(n) && Math.abs(n)<1e5) ? [p[0],p[1]] : null;
const sPts = (a,min,max) => { if(!Array.isArray(a)) return null; const r=a.slice(0,max).map(sPt); return r.every(Boolean)&&r.length>=min ? r : null; };
const sEnum = (v,list,def) => list.includes(v) ? v : def;
const sColor = (v,def) => typeof v==='string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : def;
const sDataImg = (v,max=LIMITS.image*1.4) => typeof v==='string' && v.length<=max && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(v) ? v : '';
const FEAT_OK = () => Object.keys(L).filter(k=>k.startsWith('f.')).map(k=>k.slice(2));
const DIRS_OK = ['N','NE','E','SE','S','SW','W','NW','C'];
const SITE_OK = () => SITE_TYPES.flatMap(g=>g.t);
function sRules(a, kind){
  if(!Array.isArray(a)) return [];
  return a.slice(0,500).map(x=>{
    if(!x||typeof x!=='object'||!ROOM_ALL.includes(x.room)) return null;
    const dirs=k=>Array.isArray(x[k])?x[k].filter(d=>DIRS_OK.includes(d)).slice(0,9):[];
    if(kind==='remedy'){ const text=sStr(x.text,1000); if(!text) return null;
      return {room:x.room, dirs:dirs('dirs'), verdict:(Array.isArray(x.verdict)?x.verdict:[]).filter(v=>['prefer','ok','avoid','neutral'].includes(v)), category:sEnum(x.category,['layout','element','colour'],'other'), text, structural:x.structural===true, source:sStr(x.source,300), status:sEnum(x.status,['verified'],'unverified')}; }
    return {room:x.room, prefer:dirs('prefer'), accept:dirs('accept'), avoid:dirs('avoid'), weight:sNum(x.weight,1,5,1), source:sStr(x.source,300), status:sEnum(x.status,['verified'],'unverified'),
      applies:x.applies==='*'||!Array.isArray(x.applies)?'*':x.applies.filter(s=>SITE_OK().includes(s)), school:(Array.isArray(x.school)?x.school:[]).filter(s=>['vedic','bs','modern','maha','custom'].includes(s))};
  }).filter(Boolean);
}
function sBrand(b){
  if(!b||typeof b!=='object') return {};
  const o={name:sStr(b.name,200),prep:sStr(b.prep,200),contact:sStr(b.contact,300),footer:sStr(b.footer,300)}; const lg=sDataImg(b.logo,600000); if(lg) o.logo=lg; return o;
}
// Rebuild a loaded project from a whitelist. Returns null when the file is not a project at all.
function sanitizeProject(d){
  if(!d||typeof d!=='object'||Array.isArray(d)||!d.P||typeof d.P!=='object') return null;
  const s=d.P, m=(d.map&&typeof d.map==='object')?d.map:{}, P2={};
  ['name','client','phone','address','soilNote','place','fireSrc'].forEach(k=>{ P2[k]=sStr(s[k]); });
  P2.siteType=sEnum(s.siteType,SITE_OK(),''); P2.facing=sEnum(s.facing,DIRS_OK.slice(0,8),''); P2.school=sEnum(s.school,['vedic','bs','modern','maha','custom'],'');
  P2.config=sEnum(s.config,['1 BHK','2 BHK','3 BHK','4 BHK+','Duplex','other'],''); P2.soil=sEnum(s.soil,['clay','sand','silt','gravel','rock','black','fill','unknown'],'');
  ['bearing','decl','fireMax','windFrom'].forEach(k=>{ P2[k]=sNumStr(s[k]); }); P2.northOk=s.northOk===true; P2.showLC=s.showLC===true;
  P2.imgData=sDataImg(s.imgData)||null;
  P2.levels={}; if(s.levels&&typeof s.levels==='object') DIRS_OK.slice(0,8).concat([]).forEach(c=>{ P2.levels[c]=sNumStr(s.levels[c]); });
  P2.water={}; P2.cool={}; P2.fresh={};
  ['occ','lpcd','days'].forEach(k=>{ P2.water[k]=sNumStr((s.water||{})[k]); }); ['dens','div'].forEach(k=>{ P2.cool[k]=sNumStr((s.cool||{})[k]); }); ['occ','lps','area','lpsm2'].forEach(k=>{ P2.fresh[k]=sNumStr((s.fresh||{})[k]); });
  P2.clear=(Array.isArray(s.clear)?s.clear:[]).slice(0,200).map(c=>c&&CLEAR_KINDS.includes(c.a)&&CLEAR_KINDS.includes(c.b)?{a:c.a,b:c.b,min:sNum(c.min,0,1e6,0),src:sStr(c.src,300)}:null).filter(Boolean);
  P2.userRules=sRules(s.userRules,'rule'); P2.userRemedies=sRules(s.userRemedies,'remedy'); P2.brand=sBrand(s.brand);
  P2.rpSel={}; RP_SECTIONS.forEach(k=>{ if(s.rpSel&&s.rpSel[k]===false) P2.rpSel[k]=false; });
  P2.cert={name:sStr((s.cert||{}).name,200), ok:(s.cert||{}).ok===true};
  P2.astro=sAstro(s.astro);
  P2.charts=(Array.isArray(s.charts)?s.charts:[]).slice(0,50).map(c=>(c&&typeof c==='object')?{label:sStr(c.label,120), data:sAstro(c.data), custom:c.custom===true}:null).filter(Boolean);
  const map={northDeg:sNum(m.northDeg,-360,360,0), closed:m.closed===true, pxPerM:sNum(m.pxPerM,0,1e6,0), zsys:sEnum(m.zsys,[8,16,24,32],16)};
  map.poly=sPts(m.poly,0,500)||[]; map.centre=sPt(m.centre);
  map.devata=(Array.isArray(m.devata)&&m.devata.length===81)?m.devata.map(v=>sStr(v,60)):null;
  map.rooms=(Array.isArray(m.rooms)?m.rooms:[]).slice(0,500).map(r=>{ const pts=r&&sPts(r.pts,3,400); return pts&&ROOM_TYPES.includes(r.type)?{type:r.type,pts,kw:sNumStr(r.kw),wm2:sNumStr(r.wm2)}:null; }).filter(Boolean);
  const fk=FEAT_OK(); map.feats=(Array.isArray(m.feats)?m.feats:[]).slice(0,1000).map(f=>{ const pts=f&&sPts(f.pts,1,500); return pts&&fk.includes(f.kind)?{kind:f.kind,pts}:null; }).filter(Boolean);
  const AT=['line','pencil','rect','square','circle','ellipse','tri','trap','text'];
  map.annos=(Array.isArray(m.annos)?m.annos:[]).slice(0,2000).map(a=>{ const pts=a&&sPts(a.pts,1,5000); if(!pts||!AT.includes(a.type)) return null;
    return {type:a.type, pts, stroke:sColor(a.stroke,'#d02'), fill:sColor(a.fill,'#ffd966'), fillMode:sEnum(a.fillMode,['none','light','solid'],'none'), w:sNum(a.w,1,20,3), dash:sEnum(a.dash,['solid','dash','dot','dd'],'solid'), size:sNum(a.size,6,80,14), text:sStr(a.text,500)}; }).filter(Boolean);
  return {P:P2, map};
}
// Check a user-chosen image: type, size, and the real file signature (not just the name), then hand back a safe data URL.
function safeImageFile(f, maxPx, cb, fail){
  if(!f) return;
  if(!IMG_TYPES.includes(f.type) || f.size>LIMITS.image || f.size<12){ fail&&fail('sec.badimg'); return; }
  const hd=new FileReader();
  hd.onload=()=>{ const b=new Uint8Array(hd.result), hex=[...b.slice(0,12)].map(x=>x.toString(16).padStart(2,'0')).join('');
    const ok = hex.startsWith('89504e47') || hex.startsWith('ffd8ff') || hex.startsWith('47494638') || (hex.startsWith('52494646') && hex.slice(16,24)==='57454250');
    if(!ok){ fail&&fail('sec.badimg'); return; }
    const rd=new FileReader(); rd.onload=()=>{ const im=new Image();
      im.onload=()=>{ const s=Math.min(1,maxPx/Math.max(im.naturalWidth,im.naturalHeight)), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.naturalWidth*s)); c.height=Math.max(1,Math.round(im.naturalHeight*s));
        // re-encoding through a canvas strips any hidden data and normalises the format
        c.getContext('2d').drawImage(im,0,0,c.width,c.height); cb(c.toDataURL(f.type==='image/jpeg'?'image/jpeg':'image/png', .9), c.width, c.height); };
      im.onerror=()=>fail&&fail('sec.badimg'); im.src=rd.result; };
    rd.onerror=()=>fail&&fail('sec.badimg'); rd.readAsDataURL(f); };
  hd.onerror=()=>fail&&fail('sec.badimg'); hd.readAsArrayBuffer(f.slice(0,12));
}
function safeTextFile(f, max, cb){
  if(!f) return; if(f.size>max){ toast('sec.big'); return; }
  const r=new FileReader(); r.onload=()=>cb(r.result); r.onerror=()=>toast('sec.badproj'); r.readAsText(f);
}
const safeJSON = s => { try{ const v=JSON.parse(s); return (v&&typeof v==='object')?v:null; }catch(e){ return null; } };
// Text boxes: strip control characters and cap the length while typing.
document.addEventListener('input', e=>{ const el=e.target; if(!el||!el.tagName) return;
  if((el.tagName==='INPUT'&&el.type==='text')||el.tagName==='TEXTAREA'){ const max=el.tagName==='TEXTAREA'?LIMITS.area:LIMITS.text; let v=el.value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,''); if(v.length>max) v=v.slice(0,max); if(v!==el.value) el.value=v; } }, true);
// Clickjacking: if the page is shown inside another site's frame, hide it.
try{ if(window.top!==window.self) document.documentElement.style.display='none'; }catch(e){ document.documentElement.style.display='none'; }

/* ---------- appearance: theme, font size, language ---------- */
let fontPct = Math.min(160, Math.max(80, Math.round(+store.get('vs.font', 100)) || 100));
function applyTheme(th){ document.documentElement.dataset.theme = th; store.set('vs.theme', th);
  document.querySelector('meta[name=theme-color]').content = th==='dark' ? '#0f3b40' : '#9a4b1c'; }
function applyFont(){ document.documentElement.style.fontSize = (16*fontPct/100)+'px'; store.set('vs.font', fontPct); }
function renderChrome(){
  $('langsel').innerHTML = LANGS.map(l=>`<option value="${l[0]}" ${l[0]===LANG?'selected':''}>${l[1]}</option>`).join('');
  $('langsel').title = t('ui.lang'); $('themebtn').title = t('ui.theme');
  $('fdown').title = $('fup').title = t('ui.font');
  $('empty').innerHTML = esc(t('ui.empty')); authChrome();
}
function refreshAll(){ grahaSync(); renderChrome(); renderMenu(); renderPanel(); renderMapTools(); $('zoneinfo').textContent = t('ui.clickmap'); }

/* ---------- menu ---------- */
const MENU_V = () => MENU.filter(s=>s.id!=='admin' || (typeof SESSION!=='undefined' && SESSION && SESSION.role==='superadmin'));   // the Admin tab is for the Superadmin only
function renderMenu(){
  const done = {project:()=>P.name&&P.siteType, map:()=>M.img&&M.pxPerM&&M.closed, zone:()=>M.show.grid||M.show.brahma};
  $('menu').innerHTML = MENU_V().map((s,i)=>`<button class="${s.id===cur.sec?'on':''}" data-s="${s.id}"><span class="num">${i+1}</span> ${t('m.'+s.id)}${done[s.id]&&done[s.id]()?` <span class="ok" title="${t('ui.done')}">&#10003;</span>`:''}</button>`).join('');
  $('menu').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.s, MENU.find(s=>s.id===b.dataset.s).subs[0].id));
  const sec = MENU.find(s=>s.id===cur.sec);
  $('sub').innerHTML = `<input id="qs" type="search" placeholder="${t('ui.search')}"><div id="qres"></div><div id="slist">` + sec.subs.map(u=>`<button class="${u.id===cur.sub?'on':''} ${!PANELS[sec.id+'/'+u.id]?'soon':''}" data-u="${u.id}">${t('s.'+u.id)}${!PANELS[sec.id+'/'+u.id]?` <span class="tag">${t('ui.stage',{n:u.stage})}</span>`:''}</button>`).join('') + '</div>';
  $('slist').querySelectorAll('button').forEach(b=>b.onclick=()=>go(cur.sec,b.dataset.u));
  $('qs').oninput = e => {
    const q = e.target.value.trim().toLowerCase(), r = [];
    if(q) MENU_V().forEach(s=>s.subs.forEach(u=>{ if((t('s.'+u.id)+' '+t('m.'+s.id)).toLowerCase().includes(q)) r.push([s,u]); }));
    $('qres').innerHTML = !q ? '' : r.length ? r.map(([s,u])=>`<button data-s="${s.id}" data-u="${u.id}">${t('m.'+s.id)} &rsaquo; ${t('s.'+u.id)}</button>`).join('') : `<span class="tag">${t('ui.nores')}</span>`;
    $('qres').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.s,b.dataset.u));
  };
}
// Next step in the journey: next sub-menu, or first sub-menu of the next section.
function nextStep(){
  const MV=MENU_V(), si = MV.findIndex(s=>s.id===cur.sec), sec = MV[si], ui = sec.subs.findIndex(u=>u.id===cur.sub);
  if(ui < sec.subs.length-1) go(sec.id, sec.subs[ui+1].id);
  else if(si < MV.length-1) go(MV[si+1].id, MV[si+1].subs[0].id);
}
function go(sec, sub){ cur={sec,sub}; M.mode='view'; M.roomPts=[]; M.featPts=[]; M.annoDraft=null; M.annoSel=-1; M.cv.style.touchAction='auto'; ctxClose(); M.draw(); renderMenu(); renderPanel(); renderMapTools(); }

function renderMapTools(){
  const c = (k,l)=>`<label><input type="checkbox" data-k="${k}" ${M.show[k]?'checked':''}> ${t(l)}</label>`;
  $('maptools').innerHTML = c('zones','mt.zones')+c('labels','mt.labels')+c('grid','mt.grid')+c('brahma','mt.brahma')+c('poly','mt.boundary')+c('rooms','mt.rooms')+c('cuts','mt.cuts')+c('feats','mt.feats')+c('marma','mt.marma')+c('annos','mt.annos')+`<button class="btn alt" style="margin:0;padding:.15rem .5rem" onclick="saveMapImage()">${t('mt.saveimg')}</button>`+
    `<span class="tag">${M.pxPerM?M.pxPerM.toFixed(1)+' px/m':t('mt.noscale')}</span>`+
    `<span class="tag">${t('mt.north',{d:M.northDeg.toFixed(1)})}</span>`+
    (M.pxPerM&&M.polyArea()?`<span class="tag">${t('mt.area',{a:(M.polyArea()/M.pxPerM/M.pxPerM).toFixed(0)})}</span>`:'');
  $('maptools').querySelectorAll('input').forEach(i=>i.onchange=()=>{M.show[i.dataset.k]=i.checked;M.draw();});
}

const modeBtn = (m,l)=>`<button class="btn ${M.mode===m?'on':''}" onclick="setMode('${m}')">${t(l)}</button>`;
function setMode(m){ M.mode = M.mode===m?'view':m; if(m==='room') M.roomPts=[]; if(m==='boundary'&&M.mode==='boundary'){M.poly=[];M.closed=false;} M.draw(); renderPanel(); }
// A message that floats at the bottom of the screen for a few seconds (the line under the map is often out of view).
let _toastT=null;
function toast(k,v){
  const msg=t(k,v); $('zoneinfo').textContent=msg;
  let b=document.getElementById('toastbox'); if(!b){ b=document.createElement('div'); b.id='toastbox'; b.setAttribute('role','status'); document.body.append(b); }
  b.textContent=msg; b.className='toastbox show'; clearTimeout(_toastT); _toastT=setTimeout(()=>{ b.className='toastbox'; },4000);
}

const PANELS = {
  'project/new': ()=>`<h2>${t('s.new')}</h2><label>${t('p.pname')}</label><input type="text" id="pname" value="${esc(P.name)}">
    <button class="btn" onclick="P.name=$('pname').value;toast('p.savedmem')">${t('p.setname')}</button>
    <button class="btn alt" onclick="askConfirm(t('p.confirmfresh'),()=>location.reload())">${t('p.fresh')}</button>`,
  'project/site': ()=>`<h2>${t('s.site')}</h2><p>${t('p.sitenote')}</p>
    <select onchange="P.siteType=this.value"><option value="">${t('p.choose')}</option>${SITE_TYPES.map(g=>`<optgroup label="${t('g.'+g.g)}">${g.t.map(k=>`<option value="${k}" ${P.siteType===k?'selected':''}>${t('t.'+k)}</option>`).join('')}</optgroup>`).join('')}</select>`,
  'project/school': ()=>`<h2>${t('s.school')}</h2><p>${t('p.schoolnote')}</p><label>${t('p.school')}</label>
    <select onchange="P.school=this.value"><option value="">${t('p.choose')}</option>${['vedic','bs','modern','maha','custom'].map(k=>`<option value="${k}" ${P.school===k?'selected':''}>${t('sc.'+k)}</option>`).join('')}</select>`,
  'project/facing': ()=>`<h2>${t('s.facing')}</h2><label>${t('p.facing')}</label>
    <select onchange="P.facing=this.value"><option value="">${t('p.choose')}</option>${['N','NE','E','SE','S','SW','W','NW'].map(c=>`<option value="${c}" ${P.facing===c?'selected':''}>${zoneName(c)} (${c})</option>`).join('')}</select>
    <label>${t('p.config')}</label>
    <select onchange="P.config=this.value"><option value="">${t('p.choose')}</option>${['1 BHK','2 BHK','3 BHK','4 BHK+','Duplex','other'].map(c=>`<option value="${c}" ${P.config===c?'selected':''}>${c==='other'?t('ui.other'):c}</option>`).join('')}</select>`,
  'project/client': ()=>`<h2>${t('s.client')}</h2>
    <label>${t('p.cname')}</label><input type="text" value="${esc(P.client)}" onchange="P.client=this.value">
    <label>${t('p.phone')}</label><input type="text" value="${esc(P.phone)}" onchange="P.phone=this.value">
    <label>${t('p.address')}</label><input type="text" value="${esc(P.address)}" onchange="P.address=this.value">`,
  'project/save': ()=>`<h2>${t('s.save')}</h2><p>${t('p.saveinfo')}</p>
    <button class="btn" onclick="saveProject()">${t('p.savebtn')}</button>
    <label>${t('p.openlbl')}</label><input type="file" accept=".json" onchange="openProject(this.files[0])">`,
  'map/upload': ()=>`<h2>${t('s.upload')}</h2><p>${t('p.upinfo')}</p>
    <input type="file" accept="image/*" onchange="loadFile(this.files[0])">
    <p>${t('p.nomap')}</p><button class="btn alt" onclick="M.sample();renderMapTools()">${t('p.sample')}</button>`,
  'map/scale': ()=>`<h2>${t('s.scale')}</h2><p>${t('p.scaleinfo')}</p>
    ${modeBtn('scale','p.pick2')}<div class="hint">${t('p.current')}: ${M.pxPerM?t('p.pxm',{v:M.pxPerM.toFixed(2)}):t('p.notset')}</div>
    <label>${t('p.typepx')}</label><input type="number" step="0.1" value="${M.pxPerM||''}" onchange="M.pxPerM=+this.value;renderMapTools()">`,
  'map/north': ()=>`<h2>${t('s.north')}</h2><p>${t('p.northinfo')}</p>
    <label>${t('p.northdeg',{d:'<span id="nv">'+M.northDeg.toFixed(1)+'</span>'})}</label>
    <input type="range" min="-180" max="180" step="0.5" value="${M.northDeg}" oninput="M.northDeg=+this.value;$('nv').textContent=this.value;M.draw();renderMapTools()">
    ${modeBtn('north','p.clicknorth')}<div class="hint">${t('p.northhint')}</div>`,
  'map/boundary': ()=>`<h2>${t('s.boundary')}</h2><p>${t('p.bndinfo')}</p>
    ${modeBtn('boundary','p.drawbnd')}<button class="btn alt" onclick="M.closePoly();renderPanel()">${t('p.close')}</button>
    <button class="btn alt" onclick="M.poly=[];M.closed=false;M.draw();M.changed()">${t('p.clear')}</button>
    <h2 style="margin-top:.9rem">${t('p.centretitle')}</h2><p>${t('p.centreinfo')}</p>
    ${modeBtn('centre','p.pickcentre')}<button class="btn alt" onclick="M.centre=null;M.draw()">${t('p.resetcentre')}</button>`,
  'map/rooms': ()=>`<h2>${t('s.rooms')}</h2><p>${t('p.roomsinfo')}</p>
    <label>${t('p.roomtype')}</label><select onchange="M.curType=this.value">${ROOM_TYPES.map(k=>`<option value="${k}" ${M.curType===k?'selected':''}>${t('r.'+k)}</option>`).join('')}</select>
    ${modeBtn('room','p.drawroom')}<div style="margin-top:.6rem">${roomList()}</div>`,
  'land/shape': ()=>{ const s=M.shape(); return `<h2>${t('s.shape')}</h2><p>${t('p.shapeinfo')}</p>` + (!s ? `<div class="hint">${t('p.needplot')}</div>` :
    `<table class="ztab"><tr><td><b>${t('shp.'+s.cls)}</b></td><td>${t(s.convex?'shp.convex':'shp.concave')}</td></tr>
     <tr><td>${t('sh.v')}</td><td>${s.n}</td></tr>
     <tr><td>${t('sh.r')}</td><td>${s.aspect.toFixed(2)} : 1</td></tr>
     <tr><td></td><td>${(s.fill*100).toFixed(0)}% ${t('sh.f')}</td></tr>
     ${s.area!==null?`<tr><td>${t('p.area')}</td><td>${s.area.toFixed(1)} m&sup2;</td></tr><tr><td>${t('sh.p')}</td><td>${s.perim.toFixed(1)} m</td></tr><tr><td></td><td>${s.bh.toFixed(1)} m (N&ndash;S) &times; ${s.bw.toFixed(1)} m (E&ndash;W)</td></tr>`:''}</table>`); },
  'land/cuts': ()=>{ const c=M.cuts(); return `<h2>${t('s.cuts')}</h2><p>${t('p.cutinfo')}</p>` + (!c ? `<div class="hint">${t('p.needplot')}</div>` :
    `<label style="font-weight:400"><input type="checkbox" ${M.show.cuts?'checked':''} onchange="M.show.cuts=this.checked;M.draw();renderMapTools()"> ${t('p.cutshow')}</label>` +
    (c.sectors.some(s=>s.pct>0.5) ? `<table class="ztab">${c.sectors.filter(s=>s.pct>0.5).map(s=>`<tr><td><b>${s.c==='centre'?t('el.centre'):zoneName(s.c)+' ('+s.c+')'}</b></td><td>${s.pct.toFixed(0)}% ${t('p.cutmiss')}</td></tr>`).join('')}</table>` : `<div class="hint">${t('p.cutnone')}</div>`)); },
  'land/slope': ()=>`<h2>${t('s.slope')}</h2><p>${t('p.slopeinfo')}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.3rem">${['NW','N','NE','W','','E','SW','S','SE'].map(c=>c?`<div><label style="margin:0">${c}</label><input type="number" step="0.01" id="sl_${c}" value="${(P.levels||{})[c]??''}" oninput="slopeCalc()"></div>`:'<div></div>').join('')}</div>
    <div class="hint" id="slopeout">&nbsp;</div>`,
  'land/road': ()=>featPanel('s.road',['road','tjunction','deadend']),
  'land/around': ()=>featPanel('s.around',['water','tallbld','pole','temple','other']),
  'land/water': ()=>featPanel('s.water',['borewell','well','sump']),
  'land/plants': ()=>featPanel('s.plants',['tree','plant']),
  'land/soil': ()=>`<h2>${t('s.soil')}</h2><p>${t('p.soilinfo')}</p>
    <label>${t('p.soiltype')}</label><select onchange="P.soil=this.value"><option value="">${t('p.choose')}</option>${['clay','sand','silt','gravel','rock','black','fill','unknown'].map(k=>`<option value="${k}" ${P.soil===k?'selected':''}>${t('so.'+k)}</option>`).join('')}</select>
    <label>${t('p.bearing')}</label><input type="number" min="0" step="1" value="${esc(P.bearing)}" onchange="P.bearing=this.value">
    <label>${t('p.soilnote')}</label><input type="text" value="${esc(P.soilNote)}" onchange="P.soilNote=this.value">`,
  'tools/region': ()=>`<h2>${t('s.region')}</h2><p>${t('p.reginfo')}</p>
    <label>${t('p.regname')}</label><input type="text" value="${esc(P.place)}" onchange="P.place=this.value">
    <label>${t('p.cmdecl')}</label><input type="number" step="0.1" value="${esc(P.decl)}" onchange="P.decl=this.value">
    <button class="btn" onclick="go('tools','compass');$('cmd').value=P.decl||0">${t('p.regtocomp')}</button>`,
  'plan/rm': ()=>verdictPanel('s.rm','p.rminfo', i=>i.type!=='entrance'&&!WET.includes(i.type)&&!COMM_ONLY.includes(i.type)&&!HOSP_ONLY.includes(i.type)) + typicalBlock(),
  'plan/comm': ()=>verdictPanel('s.comm','p.comminfo', i=>COMM_ONLY.includes(i.type)) + typicalBlock(),
  'plan/hosp': ()=>verdictPanel('s.hosp','p.hospinfo', i=>HOSP_ONLY.includes(i.type)||['reception','guest','kitchen','lift'].includes(i.type)) + typicalBlock(),
  'project/quick': ()=>quickPanel(),
  'mep/elec': ()=>{ const k=['mpanel','xfmr','dg','earth','meter']; return featPanel('s.elec',k,`<p>${t('p.elecinfo')}</p>`+loadSched()+mepCards(k)); },
  'mep/plumb': ()=>{ const k=['ohtank','sump','stp','manhole','pump']; return featPanel('s.plumb',k,waterBlock()+mepCards(k)); },
  'mep/fire': ()=>{ const k=['fexit','hydrant','fpump','assembly']; return featPanel('s.fire',k,`<p>${t('p.fireinfo')}</p>`+fireBlock()+mepCards(k)); },
  'mep/lift': ()=>{ const k=['lift','shaft','stairc']; return featPanel('s.lift',k,`<p>${t('p.liftinfo')}</p>`+mepCards(k)); },
  'mep/clear': ()=>clearPanel(),
  'report/pdf': ()=>pdfPanel(),
  'report/brand': ()=>brandPanel(),
  'tools/cert': ()=>certPanel(),
  'compare/cmp': ()=>conflictPanel(),
  'remedy/rem': ()=>remedyPanel(),
  'hvac/load': ()=>coolPanel(),
  'hvac/equip': ()=>{ const k=['ahu','chiller','ctower','odu','plantroom']; return featPanel('s.equip',k,`<p>${t('p.equipinfo')}</p>`+mepCards(k)); },
  'hvac/air': ()=>{ const k=['fai','exh','kexh']; return featPanel('s.air',k,`<p>${t('p.airinfo')}</p>`+airBlock()+mepCards(k)); },
  'hvac/duct': ()=>featPanel('s.duct',['duct','pipe'],`<p>${t('p.ductinfo')}</p><button class="btn" onclick="M.finishFeat();renderPanel()">${t('p.finish')}</button>`),
  'lib/faq': ()=>`<h2>${t('s.faq')}</h2>${[1,2,3,4,5,6].map(n=>`<div class="hint"><b>${t('faq.q'+n)}</b><br>${t('faq.a'+n)}</div>`).join('')}`,
  'plan/entry': ()=>featPanel('s.entry',['door'],`<p>${t('p.entryinfo')}</p>`+gateCards()+verdictCards(judgeItems().filter(i=>i.type==='entrance'))),
  'plan/wet': ()=>verdictPanel('s.wet','p.wetinfo', i=>WET.includes(i.type)),
  'tools/maindoor': ()=>featPanel('s.maindoor',['door'],`<p>${t('p.entryinfo')}</p>`+gateCards()+verdictCards(judgeItems().filter(i=>i.type==='entrance'))),
  'report/score': ()=>scorePanel(),
  'lib/rules': ()=>rulesPanel(),
  'map/layers': ()=>`<h2>${t('s.layers')}</h2><p>${t('p.layersinfo')}</p>
    ${[['zones','mt.zones'],['labels','mt.labels'],['grid','mt.grid'],['brahma','mt.brahma'],['poly','mt.boundary'],['rooms','mt.rooms'],['cuts','mt.cuts'],['feats','mt.feats'],['marma','mt.marma'],['annos','mt.annos'],['graha','mt.graha']].map(([k,l])=>`<label style="font-weight:400"><input type="checkbox" ${M.show[k]?'checked':''} onchange="M.show['${k}']=this.checked;M.draw();renderMapTools()"> ${t(l)}</label>`).join('')}`,
  'zone/zsys': ()=>`<h2>${t('s.zsys')}</h2><p>${t('p.zsysinfo')}</p>
    <select onchange="M.zsys=+this.value;M.draw()">${[8,16,24,32].map(n=>`<option value="${n}" ${M.zsys===n?'selected':''}>${n}</option>`).join('')}</select>
    <div class="hint">${t('p.zsysnote')}</div>`,
  'tools/pada': ()=>`<h2>${t('s.pada')}</h2><p>${t('p.padainfo')}</p>
    <label>${t('p.plotlen')}</label><input type="number" min="0" step="0.1" id="pl" oninput="padaCalc()">
    <label>${t('p.plotwid')}</label><input type="number" min="0" step="0.1" id="pw" oninput="padaCalc()">
    <button class="btn alt" onclick="padaUse()">${t('p.useplot')}</button><div class="hint" id="padaout">&nbsp;</div>`,
  'tools/compass': ()=>`<h2>${t('s.compass')}</h2><p>${t('p.cminfo')}</p>
    <label>${t('p.cmbearing')}</label><input type="number" step="0.1" id="cmb" value="0">
    <label>${t('p.cmdecl')}</label><input type="number" step="0.1" id="cmd" value="0">
    <button class="btn" onclick="cmApply()">${t('p.cmapply')}</button>
    <button class="btn alt" onclick="cmDevice()">${t('p.cmdevice')}</button>
    <div class="hint" id="cmlive">&nbsp;</div>`,
  'zone/z45': ()=>`<h2>${t('s.z45')}</h2><p>${t('p.z45info')}</p>
    <label><input type="checkbox" ${M.show.grid?'checked':''} onchange="M.show.grid=this.checked;M.draw();renderMapTools()"> ${t('p.z45draw')}</label>
    <h2 style="margin-top:.9rem">${t('p.z45names')}</h2><p>${t('p.z45note')}</p>
    <button class="btn alt" onclick="devTemplate()">${t('p.z45tpl')}</button>
    <label>${t('p.z45load')}</label><input type="file" accept=".json" onchange="devLoad(this.files[0])">
    <button class="btn alt" onclick="M.devata=null;M.draw()">${t('p.z45clear')}</button>`,
  'zone/marma': ()=>marmaPanel(),
  'about/us': ()=>aboutPanel(),
  'astro/birth': ()=>birthPanel(),
  'astro/graha': ()=>grahaPanel(),
  'astro/chart': ()=>chartPanel(),
  'astro/areport': ()=>areportPanel(),
  'admin/accounts': ()=>adminOnly(adminAccounts),
  'admin/security': ()=>adminOnly(adminSecurity),
  'astro/houses': ()=>housesPanel(),
  'astro/audit': ()=>auditPanel(),
  'map/alloc': ()=>allocPanel(),
  'map/draw': ()=>drawPanel(),
  'zone/brahma': ()=>`<h2>${t('s.brahma')}</h2><p>${t('p.brinfo')}</p>
    <label><input type="checkbox" ${M.show.brahma?'checked':''} onchange="M.show.brahma=this.checked;M.draw();renderMapTools()"> ${t('p.brshow')}</label>
    <div class="hint">${t('p.brhint')}</div>`,
  'zone/elem': ()=>`<h2>${t('s.elem')}</h2><p>${t('p.elinfo')}</p>
    <table class="ztab">${ELEMENTS.map(e=>`<tr><td><b>${t('e.'+e.k)}</b></td><td>${e.z==='centre'?t('el.centre'):zoneName(e.z)+' ('+e.z+')'}</td></tr>`).join('')}</table>`,
  'lib/classic': ()=>classicPanel(),
  'lib/modern': ()=>`<h2>${t('s.modern')}</h2><p>${t('p.libnote')}</p>${libList(MODERN)}`,
  'lib/gloss': ()=>`<h2>${t('s.gloss')}</h2><p>${t('p.glosnote')}</p><dl>${GLOSSARY.map(g=>`<dt><b>${esc(g[0])}</b></dt><dd style="margin:0 0 .5rem;margin-inline-start:0;color:var(--mut)">${esc(g[1])}</dd>`).join('')}</dl>`,
  'zone/z16': ()=>`<h2>${t('s.z16')}</h2><p>${t('p.z16info')}</p>
    <table class="ztab">${ZONES.map(z=>`<tr><td><span style="display:inline-block;width:.8rem;height:.8rem;background:${z.col}"></span></td><td><b>${z.c}</b></td><td>${zoneName(z.c)}</td><td>${t('e.'+z.el)}</td><td>${z.lord?t('l.'+z.lord):''}</td></tr>`).join('')}</table>
    <div class="hint">${t('p.z16hint')}</div>`
};

/* ---------- stage 5: rule engine ---------- */
const DIR8 = ['N','NE','E','SE','S','SW','W','NW'];
const dirLabel = c => c[0]==='#' ? c.slice(1) : c==='C' ? t('el.centre') : zoneName(c)+' ('+c+')';
const stLabel = s => t(s==='verified' ? 'st.ver' : s==='pageread' ? 'st.pr' : 'st.unv');
function activeRules(){
  const sc = P.school || 'vedic';
  let r = (sc==='vedic'||sc==='modern') ? RULES_STARTER.slice() : sc==='bs' ? RULES_BS.slice() : [];
  r = r.concat((P.userRules||[]).filter(x=>!x.school||!x.school.length||x.school.includes(sc)));
  return r.filter(x=>!P.siteType||!x.applies||x.applies==='*'||x.applies.includes('*')||x.applies.includes(P.siteType));
}
// Direction of a point: 'C' if inside the central Brahmasthan cells, else one of eight 45-degree sectors.
function dir8(p){
  const k = M.cellOf(p); if(k && k.ring===0) return 'C';
  return DIR8[Math.round(M.bearing(p)/45)%8];
}
// One verdict per rule: avoid beats preferred beats acceptable. Scores: 1 / 0.5 / 0.
function judge(type, dir){
  return activeRules().filter(r=>r.room===type).map(r=>{
    let v='neutral', s=0;
    if((r.avoid||[]).includes(dir)) v='avoid';
    else if((r.prefer||[]).includes(dir)){ v='prefer'; s=1; }
    else if((r.accept||[]).includes(dir)){ v='ok'; s=.5; }
    return {rule:r, v, s, dir};
  });
}
// Items to judge: every tagged room, plus the facing from Project when no entrance room is drawn.
function judgeItems(){
  const items = M.rooms.map(room=>({type:room.type, dir:dir8(M.centroid(room.pts))}));
  M.feats.filter(f=>MEP_KINDS.includes(f.kind)).forEach(f=>items.push({type:f.kind, dir:dir8(M.featPoint(f))}));
  if(P.facing && !M.rooms.some(r=>r.type==='entrance')) items.push({type:'entrance', dir:P.facing, fromFacing:true});
  const done = items.map(i=>Object.assign(i,{res:judge(i.type,i.dir)}));
  // Main door on the plot edge, judged by the Brihat Samhita gate squares (school 'bs' only).
  if(P.school==='bs') M.feats.filter(f=>f.kind==='door').forEach(f=>{ const g=gateOf(M.featPoint(f)); if(!g) return;
    const tone=g.g[2], v=tone==='good'?'prefer':tone==='mixed'?'ok':'avoid';
    done.push({type:'door', dir:'#'+gateText(g), res:[{rule:{room:'door',prefer:[],accept:[],avoid:[],weight:5,source:'Brihat Samhita 53.72-75 (published English translation, machine-read; spot-check pending)',status:'pageread'}, v, s:v==='prefer'?1:v==='ok'?.5:0, dir:g.n}]}); });
  return done;
}
// Brihat Samhita gate square of a point on the plot edge: snap to the nearest wall of the north-aligned grid.
function gateOf(p){
  const k=M.cellOf(p); if(!k) return null;
  const m=Math.min(k.row,8-k.row,k.col,8-k.col); let r=k.row, c=8-k.col;      // c counts columns from the east
  if(m===8-k.col) c=0; else if(m===k.col) c=8; else if(m===k.row) r=0; else r=8;
  const n=c*9+r+1, wall=(c===0&&r<=7)?'E':(r===8&&c<=7)?'S':(c===8&&r>=1)?'W':'N';
  return {n, wall, g:GATE_BS[n]};
}
const gateText = g => `${t('p.sq')} ${g.n}, ${t('d.'+g.wall)} ${t('p.wall')} (${g.g[0]}): ${g.g[1]}`;
function gateCards(){
  const ds=M.feats.filter(f=>f.kind==='door');
  if(!ds.length) return `<div class="hint">${t('p.gatenone')}</div>`;
  return ds.map(f=>{ const g=gateOf(M.featPoint(f)); if(!g) return `<div class="hint">${t('p.needplot')}</div>`;
    const v=g.g[2]==='good'?'prefer':g.g[2]==='mixed'?'ok':'avoid';
    return `<div class="hint"><b>${t('f.door')}</b> &middot; ${t('d.'+g.wall)} ${t('p.wall')}, ${t('p.sq')} <b>${g.n}</b> (${esc(g.g[0])})<br><span class="vb v-${v}">${t('v.'+v)}</span> ${esc(g.g[1])}<br><small>${t('p.source')}: Brihat Samhita 53.72-75 &middot; ${t('st.pr')}</small></div>`; }).join('') + `<div class="hint"><small>${t('p.gatenote')}</small></div>`;
}
function scoreOf(items){
  let num=0, den=0;
  items.forEach(i=>i.res.forEach(x=>{ const w=x.rule.weight||1; num+=w*x.s; den+=w; }));
  return den ? {pct:100*num/den, num, den} : null;
}
const WET = ['toilet','bath','tank','septic'];
function verdictCards(items, emptyKey){
  if(!items.length) return `<div class="hint">${t(emptyKey||'p.needrooms')}</div>`;
  return items.map(i=>`<div class="hint"><b>${typeLabel(i.type)}</b> &middot; ${t('p.dir')}: <b>${dirLabel(i.dir)}</b>${i.fromFacing?' ('+t('s.facing')+')':''}` +
    (i.res.length ? i.res.map(x=>`<div style="margin-top:.25rem"><span class="vb v-${x.v}">${t('v.'+x.v)}</span> <span class="tag">${t('p.weight')} ${x.rule.weight||1}</span> <span class="tag">${stLabel(x.rule.status)}</span><br><small>${t('p.source')}: ${esc(x.rule.source)||t('p.srcnone')}</small></div>`).join('')
      : `<div style="margin-top:.25rem"><span class="vb v-neutral">${t('v.norule')}</span></div>`) + `</div>`).join('');
}
function verdictPanel(titleKey, infoKey, pick){
  const rules = activeRules();
  return `<h2>${t(titleKey)}</h2><p>${t(infoKey)}</p><div class="hint">${t('p.rulesnote')}</div>` +
    (!rules.length ? `<div class="hint">${t('p.norules')}</div>` : verdictCards(judgeItems().filter(pick)));
}
// Completeness checklist: which typical spaces for this site type have been tagged.
function typicalBlock(){
  const list = TYPICAL[KIND[P.siteType]];
  if(!list) return `<div class="hint">${t('p.pickside')}</div>`;
  return `<h2 style="margin-top:.8rem">${t('p.typical')}</h2><table class="ztab">${list.map(k=>{ const n=M.rooms.filter(r=>r.type===k).length||(k==='entrance'&&P.facing?1:0);
    return `<tr><td>${t('r.'+k)}</td><td>${n?`<span class="ok" style="color:var(--ok)">&#10003; ${t('p.taggedyes')}</span>`:`<span class="tag">${t('p.taggedno')}</span>`}</td></tr>`; }).join('')}</table>`;
}
// Quick check: guided map-to-score checklist.
function quickPanel(){
  const steps = [
    ['qc.map', !!M.img, 'map','upload'], ['qc.scale', M.pxPerM>0, 'map','scale'],
    ['qc.north', !!P.northOk, null], ['qc.bound', !!M.closed, 'map','boundary'],
    ['qc.site', !!P.siteType, 'project','site'], ['qc.rooms', M.rooms.length>0, 'map','rooms']
  ];
  const all = steps.every(s=>s[1]);
  return `<h2>${t('s.quick')}</h2><p>${t('p.qcinfo')}</p>` + steps.map(s=>{
    if(s[2]===null) return `<label style="font-weight:400"><input type="checkbox" ${P.northOk?'checked':''} onchange="P.northOk=this.checked;renderPanel();renderMenu()"> ${t(s[0])}</label>`;
    return `<div class="row" style="margin:.3rem 0"><span>${s[1]?'<span style="color:var(--ok)">&#10003;</span>':'&#9675;'} ${t(s[0])}</span>${s[1]?'':`<button class="btn alt" style="margin:0" onclick="go('${s[2]}','${s[3]}')">${t('qc.fix')}</button>`}</div>`; }).join('')
    + (all ? scorePanel().replace(/<h2>[^<]*<\/h2><p>[^<]*<\/p>/,'') : '');
}
function scorePanel(){
  const items = judgeItems(), sc = scoreOf(items);
  let h = `<h2>${t('s.score')}</h2><p>${t('p.scoreinfo')}</p><div class="hint">${t('p.rulesnote')}</div>`;
  if(!sc) return h + `<div class="hint">${t(M.rooms.length||P.facing?'p.noscore':'p.needrooms')}</div>`;
  h += `<div style="font-size:2.2rem;font-weight:700;color:var(--acc)">${sc.pct.toFixed(0)}<small style="font-size:1rem"> / 100</small></div><div class="tag">${t('p.scoretotal')}: ${sc.num.toFixed(1)} / ${sc.den.toFixed(1)}</div><h2 style="margin-top:.8rem">${t('p.perdir')}</h2>`;
  [...DIR8,'C'].forEach(d=>{
    const sub = items.filter(i=>i.dir===d); const s = scoreOf(sub); if(!s) return;
    h += `<div style="margin:.3rem 0"><b>${dirLabel(d)}</b> &middot; ${s.pct.toFixed(0)}<div style="height:.5rem;background:var(--bg);border-radius:4px"><div style="height:.5rem;width:${s.pct}%;background:var(--acc);border-radius:4px"></div></div></div>`;
  });
  return h + `<h2 style="margin-top:.8rem">${t('s.rm')}</h2>` + verdictCards(items.filter(i=>i.res.length));
}
function rulesPanel(){
  const act = activeRules();
  return `<h2>${t('s.rules')}</h2><p>${t('p.rulesinfo')}</p><div class="hint">${t('p.rulesnote')}</div>
    <button class="btn alt" onclick="rulesTemplate()">${t('p.rulestpl')}</button><button class="btn alt" onclick="P.userRules=[];renderPanel();renderMenu()">${t('p.rulesclear')}</button>
    <label>${t('p.rulesload')}</label><input type="file" accept=".json" onchange="rulesLoad(this.files[0])">
    <div style="margin-top:.6rem">${act.length ? act.map(r=>`<div class="hint"><b>${typeLabel(r.room)}</b> <span class="tag">${t('p.weight')} ${r.weight||1}</span> <span class="tag">${stLabel(r.status)}</span><br>
      <span class="vb v-prefer">${(r.prefer||[]).join(' ')||'-'}</span> <span class="vb v-ok">${(r.accept||[]).join(' ')||'-'}</span> <span class="vb v-avoid">${(r.avoid||[]).join(' ')||'-'}</span><br><small>${t('p.source')}: ${esc(r.source)||t('p.srcnone')}</small></div>`).join('') : `<div class="hint">${t('p.norules')}</div>`}</div>`;
}
function rulesTemplate(){
  const ex = {rules:[{room:'kitchen', prefer:['SE'], accept:['NW'], avoid:['NE'], weight:3, source:'Book title, chapter, verse', status:'verified', applies:['house'], school:['vedic']}]};
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(ex,null,2)],{type:'application/json'}));
  a.download = 'vastusense-rules-template.json'; a.click();
}
function rulesLoad(f){
  safeTextFile(f, LIMITS.small, txt=>{ const d=safeJSON(txt), raw=Array.isArray(d)?d:(d&&d.rules), list=sRules(raw,'rule');
    if(!Array.isArray(raw)||!raw.length||list.length!==raw.length){ toast('p.rulesbad'); return; }
    P.userRules=(P.userRules||[]).concat(list).slice(0,500); renderPanel(); toast('p.rulesok'); });
}
/* ---------- stage 4 helpers ---------- */
let featSel = {};
const typeLabel = k => L['r.'+k] ? t('r.'+k) : t('f.'+k);
function featPanel(titleKey, kinds, extra=''){
  const sel = kinds.includes(M.featKind) ? M.featKind : kinds[0];
  const rows = M.feats.map((f,i)=>({f,i})).filter(o=>kinds.includes(o.f.kind));
  return `<h2>${t(titleKey)}</h2><p>${t('p.featinfo')}</p>
    <label>${t('p.fkind')}</label><select onchange="M.featKind=this.value">${kinds.map(k=>`<option value="${k}" ${sel===k?'selected':''}>${t('f.'+k)}</option>`).join('')}</select>
    <button class="btn ${M.mode==='feat'?'on':''}" onclick="featPlace(['${kinds.join("','")}'])">${t('p.place')}</button>
    <div style="margin-top:.6rem">${rows.length ? rows.map(o=>{ const i=M.featInfo(o.f);
      return `<div class="hint"><b>${t('f.'+o.f.kind)}</b> &middot; ${t('p.zone')}: <b>${i.zone.c}</b>${i.m!==null?` &middot; ${i.m.toFixed(1)} m ${t('p.dist')}`:''}${(o.f.pts.length>1&&M.pxPerM)?` &middot; ${t('p.length')} ${(M.pathLen(o.f.pts)/M.pxPerM).toFixed(1)} m`:''}
      <button class="btn alt" style="float:inline-end" onclick="M.feats.splice(${o.i},1);M.draw();renderPanel()">${t('p.delete')}</button></div>`; }).join('') : `<span class="tag">${t('p.nofeat')}</span>`}</div>` + extra;
}
/* ---------- stage 7: MEP ---------- */
function mepCards(kinds){
  const items = judgeItems().filter(i=>kinds.includes(i.type));
  if(!items.length) return '';
  const withRule = items.filter(i=>i.res.length);
  return `<h2 style="margin-top:.8rem">${t('p.mepjudge')}</h2>` + (withRule.length ? verdictCards(withRule) : `<div class="hint">${t('p.mepnorule')}</div>`);
}
const mDist = (p,q) => M.pxPerM ? Math.hypot(p[0]-q[0],p[1]-q[1])/M.pxPerM : null;
function distBoundary(p){
  if(!M.pxPerM || M.poly.length<3) return null; let best=Infinity;
  for(let i=0;i<M.poly.length;i++){ const a=M.poly[i], b=M.poly[(i+1)%M.poly.length], dx=b[0]-a[0], dy=b[1]-a[1];
    const u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    best=Math.min(best, Math.hypot(p[0]-(a[0]+u*dx), p[1]-(a[1]+u*dy))); }
  return best/M.pxPerM;
}
function measure(a,b){
  if(a==='boundary'){ const s=a; a=b; b=s; }
  const A = M.feats.filter(f=>f.kind===a).map(M.featPoint);
  if(!A.length) return null;
  if(b==='boundary'){ const d=A.map(distBoundary).filter(v=>v!==null); return d.length?Math.min(...d):null; }
  const B = M.feats.filter(f=>f.kind===b).map(M.featPoint); if(!B.length||!M.pxPerM) return null;
  let best=Infinity; A.forEach(p=>B.forEach(q=>{ best=Math.min(best,mDist(p,q)); })); return best;
}
const CLEAR_KINDS = ['boundary'].concat(MEP_KINDS, ['water','tallbld','pole','tree']);
const clearLabel = k => k==='boundary' ? t('k.boundary') : t('f.'+k);
function clearPanel(){
  const sel = id => `<select id="${id}">${CLEAR_KINDS.map(k=>`<option value="${k}">${clearLabel(k)}</option>`).join('')}</select>`;
  const list = (P.clear||[]).map((c,i)=>{ const m=measure(c.a,c.b);
    const st = m===null ? `<span class="tag">${t('p.nodata')}</span>` : `<span class="vb ${m>=c.min?'v-prefer':'v-avoid'}">${t(m>=c.min?'p.within':'p.over')}</span> ${t('p.measured')} ${m.toFixed(1)} m / ${c.min} m`;
    return `<div class="hint"><b>${clearLabel(c.a)} &harr; ${clearLabel(c.b)}</b> &middot; ${st}<br><small>${t('p.source')}: ${esc(c.src)||t('p.srcnone')}</small>
      <button class="btn alt" style="float:inline-end" onclick="P.clear.splice(${i},1);renderPanel()">${t('p.delete')}</button></div>`; }).join('');
  return `<h2>${t('s.clear')}</h2><p>${t('p.clearinfo')}</p>
    <label>${t('p.itema')}</label>${sel('ca')}<label>${t('p.itemb')}</label>${sel('cb')}
    <label>${t('p.minm')}</label><input type="number" min="0" step="0.1" id="cm"><label>${t('p.codesrc')}</label><input type="text" id="cs">
    <button class="btn" onclick="clearAdd()">${t('p.addcheck')}</button><div style="margin-top:.6rem">${list||`<span class="tag">${t('p.noclear')}</span>`}</div>`;
}
function clearAdd(){
  const m=+$('cm').value; if(!(m>0)) return;
  (P.clear=P.clear||[]).push({a:$('ca').value, b:$('cb').value, min:m, src:$('cs').value}); renderPanel();
}
function loadSched(){
  if(!M.rooms.length) return `<div class="hint">${t('p.needrooms')}</div>`;
  return `<h2 style="margin-top:.8rem">${t('p.loadsched')}</h2>` + M.rooms.map((r,i)=>`<div class="row" style="margin:.2rem 0"><span>${t('r.'+r.type)}</span><input type="number" min="0" step="0.1" value="${r.kw??''}" oninput="M.rooms[${i}].kw=this.value;loadCalc()"></div>`).join('') +
    `<label style="font-weight:400"><input type="checkbox" ${P.showLC?'checked':''} onchange="P.showLC=this.checked;loadCalc()"> ${t('p.loadshow')}</label><div class="hint" id="loadout">&nbsp;</div>`;
}
function loadCalc(){
  const o=$('loadout'); if(!o) return;
  let tot=0, sx=0, sy=0; const byDir={};
  M.rooms.forEach(r=>{ const kw=parseFloat(r.kw); if(!(kw>0)) return; const c=M.centroid(r.pts); tot+=kw; sx+=kw*c[0]; sy+=kw*c[1]; const d=dir8(c); byDir[d]=(byDir[d]||0)+kw; });
  if(!tot){ o.textContent=t('p.loadnone'); M.marker=null; M.draw(); return; }
  const lc=[sx/tot, sy/tot]; M.marker = P.showLC ? lc : null; M.draw();
  const mp = M.feats.find(f=>f.kind==='mpanel'), d = mp ? mDist(M.featPoint(mp), lc) : null, lcd = dir8(lc);
  o.innerHTML = `${t('p.loadtotal')}: <b>${tot.toFixed(1)} kW</b><br>${t('p.loadc')}: <b>${dirLabel(lcd)}</b>` + (d!==null ? `<br>${t('p.panelfrom',{d:d.toFixed(1)})}` : '') +
    '<br>' + Object.keys(byDir).map(k=>`${dirLabel(k)}: ${byDir[k].toFixed(1)} kW`).join('<br>');
}
function waterBlock(){
  const w=P.water||{};
  return `<h2 style="margin-top:.8rem">${t('s.plumb')}</h2><label>${t('p.occ')}</label><input type="number" min="0" id="wo" value="${w.occ??''}" oninput="waterCalc()">
    <label>${t('p.lpcd')}</label><input type="number" min="0" id="wl" value="${w.lpcd??''}" oninput="waterCalc()">
    <label>${t('p.days')}</label><input type="number" min="0" step="0.5" id="wd" value="${w.days??''}" oninput="waterCalc()"><div class="hint" id="waterout">&nbsp;</div>`;
}
function waterCalc(){
  const o=+$('wo').value, l=+$('wl').value, d=+$('wd').value; P.water={occ:$('wo').value, lpcd:$('wl').value, days:$('wd').value};
  if(!(o>0&&l>0)){ $('waterout').innerHTML='&nbsp;'; return; }
  const day=o*l, st=day*(d>0?d:1);
  $('waterout').textContent = t('p.demandout',{a:day.toFixed(0), b:st.toFixed(0), c:(st/1000).toFixed(2)});
}
/* ---------- stage 8: HVAC ---------- */
/* ---------- stage 10: report, branding, certificate ---------- */
const RP_SECTIONS = ['map','score','site','mep','hvac','conflicts','remedies','rules'];
function loadBrand(){ const b = safeJSON(store.get('vs.brand','null')); if(b) P.brand = sBrand(b); }
function brandSet(k,v){ P.brand = P.brand||{}; P.brand[k] = k==='logo' ? sDataImg(v,600000) : sStr(v,300); store.set('vs.brand', JSON.stringify(P.brand)); }
function brandLogo(f){ safeImageFile(f, 300, url=>{ brandSet('logo',url); renderPanel(); }, k=>toast(k)); }
function brandPanel(){
  const b = P.brand||{}, inp = (k,l)=>`<label>${t(l)}</label><input type="text" value="${esc(b[k])}" onchange="brandSet('${k}',this.value)">`;
  return `<h2>${t('s.brand')}</h2><p>${t('p.brandinfo')}</p>${inp('name','b.company')}${inp('prep','b.prep')}${inp('contact','b.contact')}${inp('footer','b.footer')}
    <label>${t('b.logo')}</label><input type="file" accept="image/*" onchange="brandLogo(this.files[0])">
    ${b.logo?`<div style="margin-top:.4rem"><img src="${b.logo}" style="max-width:10rem;max-height:5rem;background:#fff"><br><button class="btn alt" onclick="brandSet('logo','');renderPanel()">${t('b.removelogo')}</button></div>`:''}`;
}
function usedRules(items){ const s=new Set(); items.forEach(i=>i.res.forEach(x=>s.add(x.rule))); return [...s]; }
function snapshot(){
  const c=M.cv, w=Math.min(1000,c.width), h=Math.round(c.height*w/c.width), t2=document.createElement('canvas'); t2.width=w; t2.height=h;
  t2.getContext('2d').drawImage(c,0,0,w,h); try{ return t2.toDataURL('image/png'); }catch(e){ return ''; }
}
const rpTbl = (head, rows) => `<table class="rpt">${head?`<tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr>`:''}${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
function rpHeader(titleKey){
  const b = P.brand||{};
  return `<div class="rp-head">${b.logo?`<img src="${b.logo}" class="rp-logo">`:''}<div><div class="rp-co">${esc(b.name)}</div><div class="rp-sm">${esc(b.contact)}</div></div></div><h1>${t(titleKey)}</h1>` +
    rpTbl(null,[[t('rp.client'),esc(P.client)+' '+esc(P.phone),t('rp.date'),new Date().toLocaleDateString(LANG)],
      [t('rp.project'),esc(P.name)+' '+esc(P.address),t('rp.sitetype'),P.siteType?t('t.'+P.siteType):''],
      [t('rp.facing'),P.facing?zoneName(P.facing):'',t('rp.school'),P.school?t('sc.'+P.school):'']]);
}
function slopeInfo(){
  const lv=P.levels||{}, dirs={N:[0,1],NE:[1,1],E:[1,0],SE:[1,-1],S:[0,-1],SW:[-1,-1],W:[-1,0],NW:[-1,1]}, sh=M.shape(), hx=(sh&&sh.bw)?sh.bw/2:1, hy=(sh&&sh.bh)?sh.bh/2:1, pts=[];
  for(const c in dirs) if(lv[c]!==undefined && lv[c]!=='') pts.push({c,x:dirs[c][0]*hx,y:dirs[c][1]*hy,z:+lv[c]});
  if(pts.length<3) return '';
  const hi=pts.reduce((a,b)=>b.z>a.z?b:a), lo=pts.reduce((a,b)=>b.z<a.z?b:a); return `${t('p.slopehi')}: ${hi.c} (${hi.z}) &middot; ${t('p.slopelo')}: ${lo.c} (${lo.z})`;
}
function rpSite(){
  let h=''; const s=M.shape();
  if(s) h += rpTbl(null,[[t('rp.shape'),`${t('shp.'+s.cls)}, ${t(s.convex?'shp.convex':'shp.concave')}`],[t('sh.r'),s.aspect.toFixed(2)+' : 1'], ...(s.area!==null?[[t('p.area'),s.area.toFixed(1)+' m²'],[t('sh.p'),s.perim.toFixed(1)+' m']]:[])]);
  const cu=M.cuts(); if(cu){ const m=cu.sectors.filter(x=>x.pct>0.5); if(m.length) h += `<p>${t('s.cuts')}: `+m.map(x=>`${x.c==='centre'?t('el.centre'):x.c} ${x.pct.toFixed(0)}% ${t('p.cutmiss')}`).join(', ')+'</p>'; }
  const sl=slopeInfo(); if(sl) h += `<p>${t('s.slope')}: ${sl}</p>`;
  if(P.soil) h += `<p>${t('s.soil')}: ${t('so.'+P.soil)}${P.bearing?', '+esc(P.bearing)+' kN/m²':''} ${esc(P.soilNote)}</p>`;
  if(P.place||P.decl) h += `<p>${t('s.region')}: ${esc(P.place)} ${P.decl?(esc(P.decl)+'°'):''}</p>`;
  const sk=['road','tjunction','deadend','water','tallbld','pole','temple','borewell','well','sump','tree','plant','other'], fs=M.feats.filter(f=>sk.includes(f.kind));
  if(fs.length) h += `<h3>${t('rp.features')}</h3>` + rpTbl([t('p.fkind'),t('p.zone'),t('p.dist')], fs.map(f=>{ const i=M.featInfo(f); return [t('f.'+f.kind), i.zone.c, i.m!==null?i.m.toFixed(1)+' m':'']; }));
  return h;
}
function rpMep(){
  let h=''; const mk=['mpanel','xfmr','dg','earth','meter','ohtank','sump','stp','manhole','pump','fexit','hydrant','fpump','assembly','lift','shaft','stairc'];
  const fs=M.feats.filter(f=>mk.includes(f.kind));
  if(fs.length) h += rpTbl([t('p.fkind'),t('p.zone'),t('p.dist')], fs.map(f=>{ const i=M.featInfo(f); return [t('f.'+f.kind), i.zone.c, i.m!==null?i.m.toFixed(1)+' m':'']; }));
  let tot=0; M.rooms.forEach(r=>{ const kw=parseFloat(r.kw); if(kw>0) tot+=kw; }); if(tot) h += `<p>${t('p.loadsched')}: ${t('p.loadtotal')} ${tot.toFixed(1)} kW</p>`;
  const w=P.water||{}, o=+w.occ, l=+w.lpcd; if(o>0&&l>0){ const d=+w.days>0?+w.days:1; h += `<p>${t('p.demandout',{a:(o*l).toFixed(0), b:(o*l*d).toFixed(0), c:(o*l*d/1000).toFixed(2)})}</p>`; }
  const exits=M.feats.filter(f=>f.kind==='fexit').map(M.featPoint), lim=parseFloat(P.fireMax);
  if(exits.length && M.pxPerM && M.rooms.length) h += `<h3>${t('s.fire')}</h3>`+rpTbl([t('p.roomtype'),t('p.nearexit')], M.rooms.map(r=>{ const d=Math.min(...exits.map(e=>mDist(M.centroid(r.pts),e))); return [t('r.'+r.type), d.toFixed(1)+' m'+(lim>0?` (${t(d<=lim?'p.within':'p.over')}, ${lim} m ${esc(P.fireSrc)})`:'')]; }));
  const cl=(P.clear||[]).map(c=>{ const m=measure(c.a,c.b); return [clearLabel(c.a)+' ↔ '+clearLabel(c.b), m===null?t('p.nodata'):`${m.toFixed(1)} m / ${c.min} m — ${t(m>=c.min?'p.within':'p.over')}`, esc(c.src)||t('p.srcnone')]; });
  if(cl.length) h += `<h3>${t('s.clear')}</h3>`+rpTbl([t('p.itema')+' / '+t('p.itemb'),t('p.measured'),t('p.source')], cl);
  return h;
}
function rpHvac(){
  let h=''; const hk=['ahu','chiller','ctower','odu','plantroom','fai','exh','kexh','duct','pipe'], fs=M.feats.filter(f=>hk.includes(f.kind));
  if(fs.length) h += rpTbl([t('p.fkind'),t('p.zone'),t('p.length')], fs.map(f=>{ const i=M.featInfo(f); return [t('f.'+f.kind), i.zone.c, (f.pts.length>1&&M.pxPerM)?(M.pathLen(f.pts)/M.pxPerM).toFixed(1)+' m':'']; }));
  const dens=parseFloat((P.cool||{}).dens), dv=parseFloat((P.cool||{}).div)||1; let w=0;
  if(M.pxPerM) M.rooms.forEach(r=>{ const d=parseFloat(r.wm2)>0?parseFloat(r.wm2):dens; if(d>0) w+=M.areaOf(r.pts)/M.pxPerM/M.pxPerM*d/1000*dv; });
  if(w) h += `<p><b>${t('s.load')}:</b> ${t('p.coolout',{kw:w.toFixed(1),tr:(w/3.517).toFixed(1)})}</p>`;
  const f=P.fresh||{}, ls=(+f.occ||0)*(+f.lps||0)+(+f.area||0)*(+f.lpsm2||0); if(ls>0) h += `<p>${t('p.freshout',{a:ls.toFixed(0),b:(ls*3.6).toFixed(0)})}</p>`;
  if(P.windFrom!==undefined && P.windFrom!=='') h += `<p>${t('p.windfrom')}: ${esc(P.windFrom)}°</p>`;
  return h;
}
function rpScore(){
  const items=judgeItems(), sc=scoreOf(items); if(!sc) return '';
  let h=`<div class="rp-big">${sc.pct.toFixed(0)} / 100</div><div class="rp-sm">${t('p.scoretotal')}: ${sc.num.toFixed(1)} / ${sc.den.toFixed(1)}</div>`;
  h += rpTbl([t('p.perdir'),''], [...DIR8,'C'].map(d=>{ const s=scoreOf(items.filter(i=>i.dir===d)); return s?[dirLabel(d), `<div class="rp-bar1"><i style="width:${s.pct}%"></i></div> ${s.pct.toFixed(0)}`]:null; }).filter(Boolean));
  const rows=[]; items.filter(i=>i.res.length).forEach(i=>i.res.forEach(x=>rows.push([typeLabel(i.type), dirLabel(i.dir), `<span class="vb v-${x.v}">${t('v.'+x.v)}</span>`, x.rule.weight||1, esc(x.rule.source)||t('p.srcnone')+' ('+stLabel(x.rule.status)+')'])));
  return h + rpTbl([t('p.roomtype'),t('p.dir'),'',t('p.weight'),t('p.source')], rows);
}
function rpRules(items){
  return rpTbl([t('p.roomtype'),'',t('p.weight'),t('p.source')], usedRules(items).map(r=>[typeLabel(r.room), `<span class="vb v-prefer">${(r.prefer||[]).join(' ')||'-'}</span> <span class="vb v-ok">${(r.accept||[]).join(' ')||'-'}</span> <span class="vb v-avoid">${(r.avoid||[]).join(' ')||'-'}</span>`, r.weight||1, (esc(r.source)||t('p.srcnone'))+' — '+stLabel(r.status)]));
}
function showReport(html){
  $('reportview').innerHTML = `<div class="rp-bar"><button class="btn" onclick="window.print()">${t('rp.print')}</button><button class="btn alt" id="rpedit" onclick="rpEdit()">${t('rp.edit')}</button><button class="btn alt" onclick="rpSave()">${t('rp.save')}</button><button class="btn alt" onclick="closeReport()">${t('rp.close')}</button><span class="rp-sm" style="align-self:center">${t('rp.pdfhint')}</span></div><div class="rp">${html}</div><div class="rp-wm" aria-hidden="true">${'<span>VASTUSENSE BY ANOOPAM</span>'.repeat(40)}</div>`;
  const rp=document.querySelector('#reportview .rp');   // edited text is plain text only: pasted or dropped markup is refused
  rp.addEventListener('paste',e=>{ e.preventDefault(); const s=(e.clipboardData||window.clipboardData).getData('text/plain'); document.execCommand('insertText',false,String(s).slice(0,5000)); });
  rp.addEventListener('drop',e=>e.preventDefault());
  document.body.classList.add('rp-on'); $('reportview').scrollTop = 0;
}
function rpEdit(){
  const r=document.querySelector('#reportview .rp'); if(!r) return; const on=r.getAttribute('contenteditable')!=='true';
  r.setAttribute('contenteditable',on?'true':'false'); r.classList.toggle('editing',on); $('rpedit').textContent=t(on?'rp.editdone':'rp.edit');
}
// Save: a stand-alone, script-free HTML file of the report as it is now (edits included). Open it in any browser to view, edit again or print to PDF.
function rpSave(){
  const r=document.querySelector('#reportview .rp'); if(!r) return; const c=r.cloneNode(true); c.removeAttribute('contenteditable'); c.classList.remove('editing');
  c.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(x=>x.remove());
  c.querySelectorAll('*').forEach(x=>{ [...x.attributes].forEach(a=>{ if(/^on/i.test(a.name)||(/^(href|src)$/i.test(a.name)&&!/^(data:image\/(png|jpeg|webp);base64,|#)/i.test(a.value))) x.removeAttribute(a.name); }); });
  let css=''; try{ for(const s of document.styleSheets) for(const x of s.cssRules) css+=x.cssText+'\n'; }catch(e){}
  const html='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(P.name||'VastuSense report')+'</title><style>'+css.replace(/<\/style/gi,'')+'body{display:block!important;background:#fff;color:#111;margin:0}</style></head><body class="rp-on"><div id="reportview" style="display:block;position:static"><div class="rp">'+c.innerHTML+'</div><div class="rp-wm">'+'<span>VASTUSENSE BY ANOOPAM</span>'.repeat(40)+'</div></div></body></html>';
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([html],{type:'text/html'})); a.download=(sStr(P.name,40).replace(/[^\w\- ]+/g,'')||'vastusense')+'-report.html'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}
function closeReport(){ document.body.classList.remove('rp-on'); $('reportview').innerHTML=''; }
function buildReport(){
  const sel=P.rpSel||{}, on=k=>sel[k]!==false, items=judgeItems(), used=usedRules(items), b=P.brand||{};
  M.draw(); let h=rpHeader('rp.title');
  if(used.some(r=>r.status!=='verified')) h += `<div class="rp-warn">${t('rp.unverified')}</div>`;
  const sec=(k,body)=> on(k) ? `<h2>${t('rp.'+k)}</h2>`+(body||`<p class="rp-sm">${t('rp.nodata')}</p>`) : '';
  const img=snapshot();
  h += sec('map', img?`<img src="${img}" class="rp-map">`:'') + sec('score', rpScore()) + sec('site', rpSite()) + sec('mep', rpMep()) + sec('hvac', rpHvac()) +
       sec('conflicts', conflictBody()) + sec('remedies', remedyCards()) + sec('rules', used.length?rpRules(items):'');
  h += `<p class="rp-sm" style="margin-top:1.2rem">${t('rp.disclaimer')}</p><p class="rp-sm">${esc(b.footer)} ${b.prep?'&middot; '+t('b.prep')+': '+esc(b.prep):''} &middot; ${t('rp.generated')}</p>`;
  showReport(h);
}
function pdfPanel(){
  const sel=P.rpSel||{}, unv=usedRules(judgeItems()).some(r=>r.status!=='verified');
  return `<h2>${t('s.pdf')}</h2><p>${t('p.pdfinfo')}</p>${unv?`<div class="hint">${t('rp.unverified')}</div>`:''}` +
    RP_SECTIONS.map(k=>`<label style="font-weight:400"><input type="checkbox" ${sel[k]===false?'':'checked'} onchange="(P.rpSel=P.rpSel||{})['${k}']=this.checked"> ${t('rp.'+k)}</label>`).join('') +
    `<button class="btn" style="margin-top:.6rem" onclick="buildReport()">${t('rp.build')}</button>`;
}
function certPanel(){
  const items=judgeItems(), sc=scoreOf(items), used=usedRules(items), unv=used.filter(r=>r.status!=='verified'), c=P.cert||{};
  let h=`<h2>${t('s.cert')}</h2><p>${t('ct.info')}</p>`;
  if(!sc || !used.length) return h + `<div class="hint">${t('ct.norules')}</div>`;
  if(unv.length) return h + `<div class="hint"><b>${t('ct.blocked')}</b><br>${unv.map(r=>typeLabel(r.room)+' — '+(esc(r.source)||t('p.srcnone'))).join('<br>')}</div>`;
  return h + `<label>${t('ct.consultant')}</label><input type="text" value="${esc(c.name)}" onchange="(P.cert=P.cert||{}).name=this.value">
    <label style="font-weight:400"><input type="checkbox" ${c.ok?'checked':''} onchange="(P.cert=P.cert||{}).ok=this.checked"> ${t('ct.confirm')}</label>
    <button class="btn" style="margin-top:.6rem" onclick="buildCert()">${t('ct.build')}</button>`;
}
function buildCert(){
  const items=judgeItems(), sc=scoreOf(items), used=usedRules(items), c=P.cert||{}, b=P.brand||{};
  if(!sc || !c.ok || !(c.name||'').trim() || used.some(r=>r.status!=='verified')) return;
  showReport(`<div class="rp-cert">${rpHeader('ct.title')}<p class="rp-certtext">${t('ct.text',{score:sc.pct.toFixed(0)})}</p><div class="rp-big">${sc.pct.toFixed(0)} / 100</div>
    <h3>${t('rp.rules')}</h3>${rpRules(items)}<p style="margin-top:2rem">${t('ct.signed')}: <b>${esc(c.name)}</b> ${b.name?'&middot; '+esc(b.name):''}</p><p class="rp-sm">${t('rp.disclaimer')} &middot; ${t('rp.generated')}</p></div>`);
}
/* ---------- stage 9: compare and remedies ---------- */
// Engineering issues found by the checks the user has set up. Each lists the item kinds it involves.
function engIssues(){
  const out=[];
  (P.clear||[]).forEach(c=>{ const m=measure(c.a,c.b); if(m!==null && m<c.min) out.push({kinds:[c.a,c.b], text:t('cf.clearfail',{a:clearLabel(c.a),b:clearLabel(c.b),m:m.toFixed(1),min:c.min})}); });
  const lim=parseFloat(P.fireMax), exits=M.feats.filter(f=>f.kind==='fexit').map(M.featPoint);
  if(lim>0 && exits.length && M.pxPerM) M.rooms.forEach(r=>{ const c=M.centroid(r.pts), d=Math.min(...exits.map(e=>mDist(c,e)));
    if(d>lim) out.push({kinds:['fexit',r.type], text:t('cf.firefail',{room:t('r.'+r.type),d:d.toFixed(1),lim})}); });
  if(M.windFrom!==null){ const down=(M.windFrom+180)%360;
    M.feats.filter(f=>f.kind==='exh'||f.kind==='kexh').forEach(e=>M.feats.filter(f=>f.kind==='fai').forEach(a=>{
      const pe=M.featPoint(e), pa=M.featPoint(a), brg=((Math.atan2(pa[0]-pe[0],-(pa[1]-pe[1]))*180/Math.PI-M.northDeg)%360+360)%360, diff=Math.abs(((brg-down+540)%360)-180);
      if(diff<45) out.push({kinds:[e.kind,'fai'], text:t('f.'+e.kind)+' &rarr; '+t('f.fai')+': '+t('p.reent')}); })); }
  return out;
}
const isGood = it => it.res.length && it.res.every(x=>x.v==='prefer'||x.v==='ok');
const isBad  = it => it.res.some(x=>x.v==='avoid'||x.v==='neutral');
function altDirs(it){
  const s=new Set(); it.res.forEach(x=>(x.rule.prefer||[]).concat(x.rule.accept||[]).forEach(d=>{ if(d!==it.dir) s.add(d); }));
  return [...s].map(dirLabel).join(', ');
}
function itemLine(it){
  return `<b>${typeLabel(it.type)}</b> &middot; ${t('p.dir')}: <b>${dirLabel(it.dir)}</b> ` + it.res.map(x=>`<span class="vb v-${x.v}">${t('v.'+x.v)}</span>`).join(' ');
}
function conflictPanel(){
  return `<h2>${t('s.cmp')}</h2><p>${t('p.cmpinfo')}</p><div class="hint">${t('p.rulesnote')}</div>` + (conflictBody() || `<div class="hint">${t('cf.none')}</div>`);
}
function conflictBody(){
  const issues=engIssues(), items=judgeItems().filter(i=>i.res.length), used=new Set();
  let rows='', engOnly='';
  issues.forEach(is=>{
    let hit=false;
    is.kinds.forEach(k=>items.filter(i=>i.type===k).forEach(it=>{ hit=true; used.add(it);
      const good=isGood(it), alt=altDirs(it);
      rows += `<div class="hint"><span class="vb ${good?'v-ok':'v-avoid'}">${t(good?'cf.tradeoff':'cf.both')}</span><br>${itemLine(it)}<br><small>${is.text}</small>${alt?`<br><small>${t('cf.alt')}: ${alt}</small>`:''}</div>`; }));
    if(!hit) engOnly += `<div class="hint"><small>${is.text}</small></div>`;
  });
  const vOnly = items.filter(i=>isBad(i)&&!used.has(i));
  const body = rows + (engOnly?`<h2 style="margin-top:.8rem">${t('cf.engonly')}</h2>${engOnly}`:'') + (vOnly.length?`<h2 style="margin-top:.8rem">${t('cf.vonly')}</h2>${vOnly.map(i=>`<div class="hint">${itemLine(i)}</div>`).join('')}`:'');
  return body;
}
function remedyPanel(){
  return `<h2>${t('s.rem')}</h2><p>${t('rm.info')}</p><div class="hint">${t('p.rulesnote')}</div>
    <button class="btn alt" onclick="remTemplate()">${t('rm.tpl')}</button><button class="btn alt" onclick="P.userRemedies=[];renderPanel()">${t('rm.clear')}</button>
    <label>${t('rm.load')}</label><input type="file" accept=".json" onchange="remLoad(this.files[0])"><div style="margin-top:.6rem">${remedyCards()}</div>`;
}
function remedyCards(){
  const items=judgeItems().filter(i=>i.res.length&&isBad(i)), mine=P.userRemedies||[];
  const cards = items.map(it=>{
    let h = `<div class="hint">${itemLine(it)}`;
    it.res.filter(x=>x.v==='avoid'||x.v==='neutral').forEach(x=>{
      const pf=(x.rule.prefer||[]).filter(d=>d!==it.dir).map(dirLabel).join(', '), ac=(x.rule.accept||[]).filter(d=>d!==it.dir).map(dirLabel).join(', ');
      h += `<div style="margin-top:.3rem"><span class="tag">${t('rm.layout')}</span> ${t('rm.move',{from:dirLabel(it.dir)})}: ` + (pf?`<span class="vb v-prefer">${pf}</span> `:'') + (ac?`<span class="vb v-ok">${ac}</span>`:'') + `<br><small>${t('p.source')}: ${esc(x.rule.source)||t('p.srcnone')} &middot; ${stLabel(x.rule.status)}</small></div>`; });
    mine.filter(r=>r.room===it.type && (!r.dirs.length||r.dirs.includes(it.dir)) && (!r.verdict.length||it.res.some(x=>r.verdict.includes(x.v)))).forEach(r=>{
      h += `<div style="margin-top:.3rem"><span class="tag">${t('rm.'+r.category)}</span> <span class="tag">${t(r.structural?'rm.struct':'rm.nostruct')}</span> ${esc(r.text)}<br><small>${t('p.source')}: ${esc(r.source)||t('p.srcnone')} &middot; ${stLabel(r.status)}</small></div>`; });
    return h + '</div>';
  }).join('');
  return cards || `<div class="hint">${t(items.length||judgeItems().some(i=>i.res.length)?'rm.none':'p.needrooms')}</div>`;
}
function remTemplate(){
  const ex={remedies:[{room:'kitchen', dirs:['NE'], verdict:['avoid'], category:'element', text:'Describe the remedy here', structural:false, source:'Book title, chapter, verse', status:'verified'}]};
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(ex,null,2)],{type:'application/json'})); a.download='vastusense-remedies-template.json'; a.click();
}
function remLoad(f){
  safeTextFile(f, LIMITS.small, txt=>{ const d=safeJSON(txt), raw=Array.isArray(d)?d:(d&&d.remedies), list=sRules(raw,'remedy');
    if(!Array.isArray(raw)||!raw.length||list.length!==raw.length){ toast('rm.bad'); return; }
    P.userRemedies=(P.userRemedies||[]).concat(list).slice(0,500); renderPanel(); toast('rm.ok'); });
}
function coolPanel(){
  const h = `<h2>${t('s.load')}</h2><p>${t('p.loadinfo')}</p>`;
  if(!M.pxPerM) return h + `<div class="hint">${t('p.needscale')}</div>`;
  if(!M.rooms.length) return h + `<div class="hint">${t('p.needrooms')}</div>`;
  const c=P.cool||{};
  return h + `<label>${t('p.density')}</label><input type="number" min="0" step="1" id="cd" value="${c.dens??''}" oninput="coolCalc()">
    <label>${t('p.divers')}</label><input type="number" min="0" max="1" step="0.05" id="cv" value="${c.div??1}" oninput="coolCalc()">
    <label>${t('p.perroom')}</label>` + M.rooms.map((r,i)=>`<div class="row" style="margin:.2rem 0"><span>${t('r.'+r.type)} (${(M.areaOf(r.pts)/M.pxPerM/M.pxPerM).toFixed(1)} m&sup2;)</span><input type="number" min="0" step="1" value="${r.wm2??''}" oninput="M.rooms[${i}].wm2=this.value;coolCalc()"></div>`).join('') +
    `<div class="hint" id="coolout">&nbsp;</div>`;
}
function coolCalc(){
  const o=$('coolout'); if(!o) return;
  const dens=parseFloat($('cd').value), dv=parseFloat($('cv').value)||1; P.cool={dens:$('cd').value, div:$('cv').value};
  let w=0; const byDir={};
  M.rooms.forEach(r=>{ const d=parseFloat(r.wm2)>0 ? parseFloat(r.wm2) : dens; if(!(d>0)) return;
    const a=M.areaOf(r.pts)/M.pxPerM/M.pxPerM, kw=a*d/1000*dv; w+=kw; const k=dir8(M.centroid(r.pts)); byDir[k]=(byDir[k]||0)+kw; });
  if(!w){ o.textContent=t('p.coolnone'); return; }
  o.innerHTML = `<b>${t('p.coolout',{kw:w.toFixed(1), tr:(w/3.517).toFixed(1)})}</b><br>` + Object.keys(byDir).map(k=>`${dirLabel(k)}: ${byDir[k].toFixed(1)} kW`).join('<br>');
}
function airBlock(){
  const f=P.fresh||{}, tot=M.pxPerM ? M.rooms.reduce((s,r)=>s+M.areaOf(r.pts)/M.pxPerM/M.pxPerM,0) : 0;
  const A=M.feats.filter(f=>f.kind==='fai'), E=M.feats.filter(f=>f.kind==='exh'||f.kind==='kexh');
  let h = `<label>${t('p.windfrom')}</label><input type="number" min="0" max="360" step="1" value="${esc(P.windFrom)}" onchange="P.windFrom=this.value;M.windFrom=this.value===''?null:+this.value;M.draw();renderPanel()">`;
  if(M.windFrom!==null && A.length && E.length){
    const down=(M.windFrom+180)%360;
    h += E.map(e=>A.map(a=>{ const pe=M.featPoint(e), pa=M.featPoint(a);
      const brg=((Math.atan2(pa[0]-pe[0], -(pa[1]-pe[1]))*180/Math.PI - M.northDeg)%360+360)%360, diff=Math.abs(((brg-down+540)%360)-180), risk=diff<45, d=mDist(pe,pa);
      return `<div class="hint"><b>${t('f.'+e.kind)} &rarr; ${t('f.fai')}</b>${d!==null?' &middot; '+d.toFixed(1)+' m':''}<br><span class="vb ${risk?'v-avoid':'v-prefer'}">${t(risk?'p.reent':'p.reentok')}</span> <span class="tag">${t('p.angle')} ${diff.toFixed(0)}&deg;</span></div>`; }).join('')).join('');
  } else if(M.windFrom!==null) h += `<div class="hint">${t('p.noair')}</div>`;
  h += `<h2 style="margin-top:.8rem">${t('s.air')}</h2><label>${t('p.occ')}</label><input type="number" min="0" id="ao" value="${f.occ??''}" oninput="freshCalc()">
    <label>${t('p.lps')}</label><input type="number" min="0" step="0.1" id="al" value="${f.lps??''}" oninput="freshCalc()">
    <label>${t('p.area')} (m&sup2;)</label><input type="number" min="0" step="1" id="aa" value="${f.area??(tot?tot.toFixed(0):'')}" oninput="freshCalc()">
    <label>${t('p.lpsm2')}</label><input type="number" min="0" step="0.01" id="am" value="${f.lpsm2??''}" oninput="freshCalc()"><div class="hint" id="freshout">&nbsp;</div>`;
  return h;
}
function freshCalc(){
  const g=id=>parseFloat($(id).value)||0; P.fresh={occ:$('ao').value, lps:$('al').value, area:$('aa').value, lpsm2:$('am').value};
  const ls=g('ao')*g('al')+g('aa')*g('am');
  $('freshout').innerHTML = ls>0 ? t('p.freshout',{a:ls.toFixed(0), b:(ls*3.6).toFixed(0)}) : '&nbsp;';
}
function fireBlock(){
  const exits = M.feats.filter(f=>f.kind==='fexit').map(M.featPoint);
  let h = `<label>${t('p.firemax')}</label><input type="number" min="0" step="1" value="${esc(P.fireMax)}" onchange="P.fireMax=this.value;renderPanel()">
    <label>${t('p.codesrc')}</label><input type="text" value="${esc(P.fireSrc)}" onchange="P.fireSrc=this.value">`;
  if(!M.pxPerM) return h + `<div class="hint">${t('p.needscale')}</div>`;
  if(!exits.length) return h + `<div class="hint">${t('p.nofexit')}</div>`;
  if(!M.rooms.length) return h + `<div class="hint">${t('p.needrooms')}</div>`;
  return h + `<table class="ztab">${M.rooms.map(r=>{ const c=M.centroid(r.pts), d=Math.min(...exits.map(e=>mDist(c,e))), lim=parseFloat(P.fireMax);
    const st = lim>0 ? ` <span class="vb ${d<=lim?'v-prefer':'v-avoid'}">${t(d<=lim?'p.within':'p.over')}</span>` : '';
    return `<tr><td>${t('r.'+r.type)}</td><td>${d.toFixed(1)} m ${t('p.nearexit')}${st}</td></tr>`; }).join('')}</table>`;
}

function featPlace(kinds){
  const s = document.querySelector('#panel select'); M.featKind = s ? s.value : kinds[0];
  M.featPts = []; M.mode = M.mode==='feat' ? 'view' : 'feat'; M.draw(); renderPanel();
}
function slopeCalc(){
  const dirs={N:[0,1],NE:[1,1],E:[1,0],SE:[1,-1],S:[0,-1],SW:[-1,-1],W:[-1,0],NW:[-1,1]};
  const sh=M.shape(), hx=(sh&&sh.bw)?sh.bw/2:1, hy=(sh&&sh.bh)?sh.bh/2:1, pts=[];
  P.levels = P.levels||{};
  for(const c in dirs){ const v=$('sl_'+c).value; P.levels[c]=v; if(v!=='') pts.push({c, x:dirs[c][0]*hx, y:dirs[c][1]*hy, z:+v}); }
  const o=$('slopeout'); if(pts.length<3){ o.textContent=t('p.slopeneed'); return; }
  const hi=pts.reduce((a,b)=>b.z>a.z?b:a), lo=pts.reduce((a,b)=>b.z<a.z?b:a);
  let txt = `${t('p.slopehi')}: <b>${hi.c}</b> (${hi.z})<br>${t('p.slopelo')}: <b>${lo.c}</b> (${lo.z})`;
  // least-squares plane z = a*x + b*y + c
  let Sx=0,Sy=0,Sxx=0,Syy=0,Sxy=0,Sz=0,Sxz=0,Syz=0; const n=pts.length;
  pts.forEach(p=>{Sx+=p.x;Sy+=p.y;Sxx+=p.x*p.x;Syy+=p.y*p.y;Sxy+=p.x*p.y;Sz+=p.z;Sxz+=p.x*p.z;Syz+=p.y*p.z;});
  const det=(m)=>m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);
  const A=[Sxx,Sxy,Sx, Sxy,Syy,Sy, Sx,Sy,n], D=det(A);
  if(Math.abs(D)>1e-9){
    const a=det([Sxz,Sxy,Sx, Syz,Syy,Sy, Sz,Sy,n])/D, b=det([Sxx,Sxz,Sx, Sxy,Syz,Sy, Sx,Sz,n])/D;
    if(Math.hypot(a,b)>1e-9){ const brg=((Math.atan2(-a,-b)*180/Math.PI)+360)%360, z=ZONES[Math.round(brg/22.5)%16];
      txt += `<br>${t('p.slopefall')}: <b>${z.c}</b> (${brg.toFixed(0)}&deg;)` + ((sh&&sh.bw)?`<br>${t('p.slopepct')}: <b>${(Math.hypot(a,b)*100).toFixed(2)}%</b>`:''); }
  }
  o.innerHTML = txt;
}
/* ---------- stage 3 helpers ---------- */
function roomList(){
  if(!M.rooms.length) return `<span class="tag">${t('p.noroom')}</span>`;
  return M.rooms.map((r,i)=>{
    const f = M.roomInfo(r);
    return `<div class="hint"><select onchange="M.rooms[${i}].type=this.value;M.draw();renderPanel()">${ROOM_TYPES.map(k=>`<option value="${k}" ${r.type===k?'selected':''}>${t('r.'+k)}</option>`).join('')}</select>
      <div style="margin-top:.3rem">${t('p.zone')}: <b>${f.zone.c}</b>${f.cell?` &middot; ${t('zi.cell')} <b>${f.cell.id}</b>`:''}${f.m2!==null?` &middot; ${t('p.area')} <b>${f.m2.toFixed(1)} m&sup2;</b>`:''}
      <button class="btn alt" style="float:inline-end" onclick="M.rooms.splice(${i},1);M.draw();M.changed()">${t('p.delete')}</button></div></div>`;
  }).join('');
}
function padaCalc(){
  const l=+$('pl').value, w=+$('pw').value, o=$('padaout');
  if(!(l>0&&w>0)){ o.innerHTML='&nbsp;'; return; }
  const a=l/9, b=w/9, f=v=>v.toFixed(2);
  o.innerHTML = t('p.padaout',{a:f(a),b:f(b),c:f(a*b)})+'<br>'+t('p.brsize',{a:f(3*a),b:f(3*b)});
}
function padaUse(){
  const f = M.frame(); if(!f||!M.pxPerM) return;
  const [x0,y0,x1,y1]=f.box; $('pw').value=((x1-x0)/M.pxPerM).toFixed(2); $('pl').value=((y1-y0)/M.pxPerM).toFixed(2); padaCalc();
}
function cmApply(){
  const tru = (+$('cmb').value) + (+$('cmd').value);
  M.northDeg = ((((-tru)%360)+540)%360)-180; M.draw(); renderMapTools(); toast('p.cmapplied');
}
function cmDevice(){
  const live=$('cmlive');
  if(!('DeviceOrientationEvent' in window)){ live.textContent=t('p.cmnone'); return; }
  const start = () => {
    const h = e => { const v = e.webkitCompassHeading!==undefined ? e.webkitCompassHeading : (e.alpha!==null&&e.alpha!==undefined ? (360-e.alpha)%360 : null);
      if(v===null){ live.textContent=t('p.cmnone'); return; } live.textContent = t('p.cmlive')+': '+v.toFixed(0)+'°'; $('cmb').value = v.toFixed(1); };
    window.addEventListener('deviceorientationabsolute', h); window.addEventListener('deviceorientation', h);
  };
  if(typeof DeviceOrientationEvent.requestPermission==='function') DeviceOrientationEvent.requestPermission().then(s=>{ if(s==='granted') start(); else live.textContent=t('p.cmnone'); });
  else start();
}
const libTable = tb => (tb.title?`<br><b>${esc(tb.title)}</b>`:'') + `<table class="ztab" style="margin:.4rem 0"><tr>${tb.head.map(h=>`<td><b>${esc(h)}</b></td>`).join('')}</tr>${tb.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` +
  (tb.notes ? `<ul style="margin:.2rem 0 .4rem 1.1rem;padding:0">${tb.notes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>` : '');
const libList = a => a.map(x=>`<div class="hint"><b>${esc(x.n)}</b><br><span class="tag">${esc(x.by)}</span><br>${esc(x.d)}</div>`).join('');

/* ---------- Brihat Samhita detail view: tabs, tables, diagrams ---------- */
let libView = {i:null, tab:0};
function libOpenSrc(i){ libView = {i, tab:0}; renderPanel(); window.scrollTo(0,0); }
function libTabSel(k){ libView.tab = k; renderPanel(); }
function libBack(){ libView = {i:null, tab:0}; renderPanel(); }
const STAT = {ok:['Confirmed','v-prefer'], part:['Partly','v-ok'], diff:['Differs','v-avoid'], none:['Not on page','v-neutral'], unc:['Not checked','v-neutral']};
// Watermark inside every library diagram (SVG): a faint tiled name and a small tag in the corner.
const WM_TEXT = 'VASTUSENSE BY ANOOPAM';
function wmSvg(s){
  const m=s.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); if(!m) return s; const W=+m[1], H=+m[2];
  return s.replace('</svg>', `<text x="${W/2}" y="${H/2}" font-size="${Math.max(10,Math.round(W/15))}" font-weight="700" fill="#000" fill-opacity=".07" text-anchor="middle" transform="rotate(-25 ${W/2} ${H/2})" font-family="sans-serif">${WM_TEXT}</text><text x="${W-5}" y="${H-4}" font-size="7" text-anchor="end" fill="#000" fill-opacity=".5" font-family="sans-serif">${WM_TEXT}</text></svg>`);
}
const libCheck = c => (c.title?`<br><b>${esc(c.title)}</b>`:'') + `<table class="ztab" style="margin:.4rem 0"><tr><td><b>Your pasted statement</b></td><td><b>Status</b></td><td><b>What the page says</b></td></tr>${c.rows.map(r=>`<tr><td>${esc(r[0])}</td><td><span class="vb ${STAT[r[1]][1]}">${STAT[r[1]][0]}</span></td><td>${esc(r[2])}</td></tr>`).join('')}</table>`;
function secBlocks(bl){
  return bl.map(b=>
    b.p ? `<p>${esc(b.p)}</p>` :
    b.h ? `<h3 style="margin:.8rem 0 .2rem">${esc(b.h)}</h3>` :
    b.list ? `<b>${esc(b.list.title)}</b><ul style="margin:.2rem 0 .4rem 1.1rem;padding:0">${b.list.items.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>` :
    b.table ? libTable(b.table) :
    b.check ? libCheck(b.check) :
    b.notes ? `<ul style="margin:.2rem 0 .4rem 1.1rem;padding:0">${b.notes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>` :
    b.svg ? `<div>${wmSvg(DIAG[b.svg]())}</div><p class="rp-sm" style="font-size:.8rem">${esc(b.cap||'')}</p>` :
    b.tool==='dims' ? dimsTool() : '').join('');
}
function classicPanel(){
  if(libView.i===null) return `<h2>${t('s.classic')}</h2><p>${t('p.libnote')}</p>` + CLASSICS.map((x,i)=>`<div class="hint"><b>${esc(x.n)}</b><br><span class="tag">${esc(x.by)}</span><br>${esc(x.d)}${x.sections?`<br><button class="btn" style="margin-top:.4rem" onclick="libOpenSrc(${i})">${t('lib.opendetail')} &rsaquo;</button>`:''}</div>`).join('');
  if(!CLASSICS[libView.i] || !CLASSICS[libView.i].sections){ libView = {i:null, tab:0}; return classicPanel(); }
  const x = CLASSICS[libView.i], sec = x.sections[libView.tab] || x.sections[0];
  setTimeout(()=>{ if($('bsRank')) bsDimUpdate(); },0);
  return `<button class="btn alt" onclick="libBack()">&lsaquo; ${t('s.classic')}</button><h2 style="margin-top:.5rem">${esc(x.n)}</h2><p>${esc(x.by)}. ${t('p.libnote')}</p>
    <div>${x.sections.map((s,k)=>`<button class="btn ${k===libView.tab?'':'alt'}" onclick="libTabSel(${k})">${esc(s.title)}</button>`).join('')}</div>
    <h2 style="margin-top:.8rem">${esc(sec.title)}</h2>${secBlocks(sec.blocks)}`;
}

// Page numbering: squares run down each column from the north-east corner, east column first.
const BS_OUTER = {1:'Agni',2:'Parjanya',3:'Jayanta',4:'Indra',5:'Surya',6:'Satya',7:'Bhrisha',8:'Antariksha',9:'Vayu',18:'Pusha',27:'Vitatha',36:'Brihatkshata',45:'Yama',54:'Gandharva',63:'Bhringaraja',72:'Mriga',81:'Pitri',80:'Dauvarika',79:'Sugriva',78:'Kusumadanta',77:'Varuna',76:'Asura',75:'Shesha',74:'Papayakshma',73:'Roga',64:'Ahi',55:'Mukhya',46:'Bhallata',37:'Soma',28:'Bhujaga',19:'Aditi',10:'Diti'};
const BS_INNER = {11:'Apa',17:'Savitra',71:'Jaya',65:'Rudra',21:'Apavatsa',25:'Savita',61:'Indra',57:'Rajayakshma',23:'Aryaman',43:'Vivasvan',59:'Mitra',39:'Prithvidhara'};
const BS_BRAHMA = [31,32,33,40,41,42,49,50,51];
const BS_GOOD = [3,4,78,77,55,46,37], BS_MIX = [2,36];
const BS_BODY = {1:['head','Agni'],11:['face','Apa'],21:['breast','Apavatsa'],23:['r. nipple','Aryaman'],41:['heart','Brahma'],43:['belly','Vivasvan'],71:['penis','Jaya'],61:['penis','Indra'],81:['feet','Pitri']};
const BS_LINES = [[73,9],[81,1],[27,75],[55,7],[3,63],[19,79]];
function bsGrid(mode){
  const s=44, pad=46, W=2*pad+9*s, pos=n=>{ const c=Math.floor((n-1)/9), r=(n-1)%9; return {c,r,x:pad+(8-c)*s,y:pad+r*s}; };
  let o=`<svg viewBox="0 0 ${W} ${W}" style="width:100%;max-width:34rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" role="img">`;
  for(let n=1;n<=81;n++){
    const p=pos(n), edge=p.c===0||p.c===8||p.r===0||p.r===8, br=BS_BRAHMA.includes(n);
    let fill = br ? '#ffe58a' : edge ? '#f6e7cf' : '#e6efe0', l1='', l2='';
    if(mode==='gate'){ fill = br ? '#fff' : edge ? (BS_GOOD.includes(n)?'#7bc67e':BS_MIX.includes(n)?'#ffd36b':'#f0a29a') : '#eee'; }
    if(mode==='marma'){ fill = br ? '#fff3bf' : '#fbf7ee'; }
    if(mode==='body'){ fill = BS_BODY[n] ? '#ffb3d1' : (br ? '#fff3bf' : '#fbf7ee'); }
    if(mode==='grid'||mode==='gate') l1 = BS_OUTER[n] || BS_INNER[n] || (n===41?'Brahma':'');
    if(mode==='marma' && BS_LINES.some(l=>l.includes(n))) l1 = BS_OUTER[n] || '';
    if(mode==='body' && BS_BODY[n]){ l1=BS_BODY[n][0]; l2=BS_BODY[n][1]; }
    o += `<rect x="${p.x}" y="${p.y}" width="${s}" height="${s}" fill="${fill}" stroke="#999" stroke-width=".6"/><text x="${p.x+3}" y="${p.y+9}" font-size="7" fill="#888">${n}</text>`;
    if(l1) o += `<text x="${p.x+s/2}" y="${p.y+s/2+(l2?0:4)}" font-size="7.5" text-anchor="middle" fill="#222" font-weight="${l2?'700':'400'}">${l1}</text>`;
    if(l2) o += `<text x="${p.x+s/2}" y="${p.y+s/2+10}" font-size="7" text-anchor="middle" fill="#444">${l2}</text>`;
  }
  if(mode==='marma'){
    const ctr=n=>{ const p=pos(n); return [p.x+s/2,p.y+s/2]; }, segs=BS_LINES.map(l=>[ctr(l[0]),ctr(l[1])]), cols=['#c0392b','#c0392b','#2471a3','#2471a3','#117a65','#117a65'];
    segs.forEach((g,i)=>{ o+=`<line x1="${g[0][0]}" y1="${g[0][1]}" x2="${g[1][0]}" y2="${g[1][1]}" stroke="${cols[i]}" stroke-width="1.6"/>`; });
    const seen=[]; for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){ const [p1,p2]=segs[i],[p3,p4]=segs[j], d=(p1[0]-p2[0])*(p3[1]-p4[1])-(p1[1]-p2[1])*(p3[0]-p4[0]); if(Math.abs(d)<1e-9) continue;
      const tt=((p1[0]-p3[0])*(p3[1]-p4[1])-(p1[1]-p3[1])*(p3[0]-p4[0]))/d, uu=((p1[0]-p3[0])*(p1[1]-p2[1])-(p1[1]-p3[1])*(p1[0]-p2[0]))/d;
      if(tt>=-1e-9&&tt<=1+1e-9&&uu>=-1e-9&&uu<=1+1e-9){ const x=p1[0]+tt*(p2[0]-p1[0]), y=p1[1]+tt*(p2[1]-p1[1]); if(!seen.some(q=>Math.hypot(q[0]-x,q[1]-y)<1)) seen.push([x,y]); } }
    seen.forEach(q=>{ o+=`<circle cx="${q[0]}" cy="${q[1]}" r="4.5" fill="#000" stroke="#fff"/>`; });
    o+=`<text x="${W/2}" y="${W-8}" font-size="10" text-anchor="middle" fill="#222">${seen.length} crossing points</text>`;
  }
  o += `<g font-size="12" font-weight="700" fill="#444" text-anchor="middle"><text x="${W/2}" y="16">N</text><text x="${W/2}" y="${W-30}">S</text><text x="${W-12}" y="${W/2+4}">E</text><text x="12" y="${W/2+4}">W</text></g>`;
  if(mode==='grid'){ o += `<g font-size="7.5" fill="#7b241c"><text x="${W-pad+2}" y="${pad-6}">Caraki</text><text x="${W-pad+2}" y="${W-pad+14}">Vidari</text><text x="3" y="${W-pad+14}">Putana</text><text x="3" y="${pad-6}">Rakshasi</text></g>`; }
  return o + '</svg>';
}
function bsDoor(){
  return `<svg viewBox="0 0 320 300" style="width:100%;max-width:22rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" font-size="9">
   <rect x="80" y="20" width="120" height="240" fill="#a0693a" stroke="#4a2c12"/><rect x="98" y="48" width="84" height="190" fill="#fff" stroke="#4a2c12"/>
   <text x="89" y="145" text-anchor="middle" fill="#fff" transform="rotate(-90 89 145)">side frame</text><text x="191" y="145" text-anchor="middle" fill="#fff" transform="rotate(90 191 145)">side frame</text>
   <text x="140" y="38" text-anchor="middle" fill="#fff">top frame (1.5 x side frame)</text><text x="140" y="253" text-anchor="middle" fill="#fff">bottom frame</text>
   <line x1="225" y1="20" x2="225" y2="260" stroke="#c0392b"/><text x="232" y="144" fill="#c0392b">height = 2 x width</text>
   <line x1="80" y1="276" x2="200" y2="276" stroke="#c0392b"/><text x="140" y="290" text-anchor="middle" fill="#c0392b">width</text>
   <text x="12" y="20" fill="#333">thickness (front to back)</text><text x="12" y="32" fill="#333">= 7 x height / 80</text></svg>`;
}
function bsTrees(){
  const pairs={N:['Plaksha','Udumbara'],E:['Banyan','Ashvattha'],S:['Udumbara','Plaksha'],W:['Ashvattha','Banyan']}; // [good, bad]
  const at={N:[150,38],E:[262,150],S:[150,262],W:[38,150]};
  let o=`<svg viewBox="0 0 300 300" style="width:100%;max-width:22rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" font-size="10"><circle cx="150" cy="150" r="82" fill="#f6f1e6" stroke="#bbb"/><path d="M150 40V260M40 150H260" stroke="#ddd"/><text x="150" y="154" text-anchor="middle" font-size="11" fill="#555">house</text>`;
  for(const k in at){ const [x,y]=at[k]; o+=`<text x="${x}" y="${y-14}" text-anchor="middle" font-weight="700" fill="#444">${k}</text><text x="${x}" y="${y}" text-anchor="middle" fill="#1e8449">${pairs[k][0]} (good)</text><text x="${x}" y="${y+13}" text-anchor="middle" fill="#c0392b">${pairs[k][1]} (bad)</text>`; }
  return o+'</svg>';
}
const DIAG = {grid:()=>bsGrid('grid'), gate:()=>bsGrid('gate'), marma:()=>bsGrid('marma'), body:()=>bsGrid('body'), door:bsDoor, trees:bsTrees};

const BS_RANKS = [['King',[108,100,92,84,76],4],['Commander-in-chief',[64,58,52,46,40],6],['Prime minister',[60,56,52,48,44],8],['Crown prince',[80,74,68,62,56],3],['Astrologer, priest',[40,36,32,28,24],6],
  ['Brahmin class',[32,28,24,20,16],10],['Kshatriya class',[32,28,24,20,16],8],['Vaishya class',[32,28,24,20,16],6],['Shudra class',[32,28,24,20,16],4]];
function dimsTool(){
  return `<label>House for</label><select id="bsRank" onchange="bsRankChange()">${BS_RANKS.map((r,i)=>`<option value="${i}">${r[0]}</option>`).join('')}</select>
    <label>Breadth (cubits)</label><select id="bsStep" onchange="bsDimUpdate()"></select><div id="bsDimOut" style="margin:.5rem 0"></div>`;
}
function bsRankChange(){ const r=BS_RANKS[+$('bsRank').value]; $('bsStep').innerHTML = r[1].map(b=>`<option value="${b}">${b}</option>`).join(''); bsDimUpdate(); }
function bsDimUpdate(){
  const sel=$('bsStep'); if(!sel) return; if(!sel.options.length){ bsRankChange(); return; }
  const r=BS_RANKS[+$('bsRank').value], B=+sel.value, f=r[2], L=B*(1+1/f), wall=B/16, floor=B/16+4;
  const k=Math.min(260/L,170/B), w=L*k, h=B*k, t=wall*k, x0=20, y0=20;
  $('bsDimOut').innerHTML = `<svg viewBox="0 0 320 230" style="width:100%;max-width:26rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" font-size="10">
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#e8dcc0" stroke="#4a2c12" stroke-width="${Math.max(1,t)}"/>
    <text x="${x0+w/2}" y="${y0+h+16}" text-anchor="middle">length ${L.toFixed(2)} cubits</text><text x="${x0+w+8}" y="${y0+h/2}" font-size="9">breadth ${B}</text>
    <text x="${x0+w/2}" y="${y0+h/2}" text-anchor="middle" fill="#555">wall thickness ${wall.toFixed(2)} (drawn to scale)</text>
    <text x="${x0+w/2}" y="${y0+h/2+14}" text-anchor="middle" fill="#555">floor height ${floor.toFixed(2)} cubits</text></svg>
    <div class="rp-sm" style="font-size:.8rem">Length = breadth + 1/${f} (verses 4-13); wall = breadth / 16 (23); floor height = breadth / 16 + 4 (22). All in cubits, as the source gives them.</div>`;
  $('bsDimOut').innerHTML = wmSvg($('bsDimOut').innerHTML);
}
function devTemplate(){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({cells:Array(81).fill('')})],{type:'application/json'}));
  a.download = 'devata-template.json'; a.click();
}
function devLoad(f){
  safeTextFile(f, LIMITS.small, txt=>{ const d=safeJSON(txt), c=Array.isArray(d)?d:(d&&d.cells);
    if(!Array.isArray(c)||c.length!==81){ $('zoneinfo').textContent=t('p.z45bad'); return; }
    M.devata = c.map(v=>sStr(v,60)); M.show.grid = true; M.draw(); renderMapTools(); toast('p.z45ok'); });
}
function renderPanel(){
  const key = cur.sec+'/'+cur.sub;
  const sub = MENU.find(s=>s.id===cur.sec).subs.find(s=>s.id===cur.sub);
  $('panel').innerHTML = PANELS[key] ? PANELS[key]()
    : `<h2>${t('s.'+sub.id)}</h2><div class="soonbox">${t('ui.soon',{n:sub.stage})}</div>`;
  $('panel').innerHTML += `<div style="margin-top:1rem"><button class="btn alt" onclick="nextStep()">${t('ui.next')} &rsaquo;</button></div>`;
  document.querySelector('.layout').classList.toggle('wide', (key==='lib/classic' && libView.i!==null) || key==='astro/audit' || key==='astro/birth' || key==='astro/chart');
}

/* ---------- files ---------- */
function loadFile(f){
  safeImageFile(f, 3000, url=>{ P.imgData = url; M.setImage(url, ()=>{M.poly=[];M.closed=false;M.centre=null;renderMapTools();}); }, k=>toast(k));
}
function saveProject(){
  const d = {P, map:{northDeg:M.northDeg, poly:M.poly, closed:M.closed, pxPerM:M.pxPerM, centre:M.centre, devata:M.devata, rooms:M.rooms, zsys:M.zsys, feats:M.feats, annos:M.annos}};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
  a.download = (sStr(P.name,60).replace(/[^\w\- ]+/g,'')||'vastusense-project')+'.json'; a.click();
}
function openProject(f){
  safeTextFile(f, LIMITS.project, txt=>{
    const d = sanitizeProject(safeJSON(txt)); if(!d){ toast('sec.badproj'); return; }
    Object.keys(P).forEach(k=>delete P[k]); Object.assign(P,d.P); curChart=-1; Object.assign(M,d.map);
    M.annoUndo=[]; M.annoRedo=[]; M.annoSel=-1; M.windFrom = P.windFrom==='' ? null : +P.windFrom;
    if(P.imgData) M.setImage(P.imgData, renderMapTools); else M.draw(); refreshAll(); toast('p.loaded'); });
}

/* ---------- right-click space menu, allocation dropdown, drawing panel ---------- */
const CTX_GROUPS = [['cx.rooms',ROOM_TYPES,'room'],
  ['cx.mep',['mpanel','xfmr','dg','earth','meter','ohtank','sump','stp','manhole','pump','fexit','hydrant','fpump','assembly','lift','shaft','stairc'],'feat'],
  ['cx.hvac',['ahu','chiller','ctower','odu','plantroom','fai','exh','kexh','duct','pipe'],'feat'],
  ['cx.site',['door','borewell','well','road','tjunction','deadend','water','tallbld','pole','temple','tree','plant','other'],'feat']];
let ctxPt = null;
function ctxClose(){ const m=$('ctxmenu'); if(m){ m.style.display='none'; m.innerHTML=''; } }
function ctxOpen(e){
  ctxPt = M.pos(e); const r=M.cv.getBoundingClientRect(), tol=14*M.cv.width/r.width; let h='';
  const room=M.roomAt(ctxPt), ri=room?M.rooms.indexOf(room):-1;
  const fi=M.feats.findIndex(f=>{ const q=M.featPoint(f); return Math.hypot(q[0]-ctxPt[0],q[1]-ctxPt[1])<=tol; });
  const ai=M.annoHit(ctxPt,true);
  if(ri>=0) h+=`<details><summary>${t('cx.changeroom')}</summary>${ROOM_TYPES.map(k=>`<button onclick="ctxRoomType(${ri},'${k}')">${t('r.'+k)}</button>`).join('')}</details><button class="dng" onclick="ctxDel('room',${ri})">${t('cx.delroom')}</button>`;
  if(fi>=0) h+=`<button class="dng" onclick="ctxDel('feat',${fi})">${t('cx.delitem')}: ${t('f.'+M.feats[fi].kind)}</button>`;
  if(ai>=0) h+=`<button class="dng" onclick="ctxDel('anno',${ai})">${t('cx.deldraw')}</button>`;
  if(h) h+='<hr>';
  h+=`<div style="padding:.2rem .5rem;font-size:.75rem;color:var(--mut)">${t('cx.place')}</div>`;
  CTX_GROUPS.forEach(g=>{ h+=`<details><summary>${t(g[0])}</summary>${g[1].map(k=>`<button onclick="ctxPlace('${g[2]}','${k}')">${g[2]==='room'?t('r.'+k):t('f.'+k)}</button>`).join('')}</details>`; });
  h+=`<hr><button onclick="ctxText()">${t('cx.text')}</button>`;
  const m=$('ctxmenu'); m.innerHTML=h; m.style.display='block';
  m.style.left=Math.max(4,Math.min(e.clientX, innerWidth-m.offsetWidth-4))+'px'; m.style.top=Math.max(4,Math.min(e.clientY, innerHeight-m.offsetHeight-4))+'px';
}
function ctxRoomType(i,k){ if(!ROOM_TYPES.includes(k)||!M.rooms[i]) return; M.rooms[i].type=k; ctxClose(); M.draw(); M.changed(); }
function ctxDel(kind,i){ if(kind==='room') M.rooms.splice(i,1); else if(kind==='feat') M.feats.splice(i,1); else if(kind==='anno'){ M.annoPush(); M.annos.splice(i,1); M.annoSel=-1; } ctxClose(); M.draw(); M.changed(); }
function ctxPlace(kind,k){
  ctxClose(); const p=ctxPt; M.mode='view'; M.roomPts=[]; M.featPts=[];
  // A room is placed at once as a labelled square (4 m a side when the scale is set, else 8% of the map width). Its corners can then be redrawn if needed.
  if(kind==='room'){ if(!ROOM_TYPES.includes(k)) return; const h=(M.pxPerM?4*M.pxPerM:M.cv.width*0.08)/2; M.rooms.push({type:k, pts:[[p[0]-h,p[1]-h],[p[0]+h,p[1]-h],[p[0]+h,p[1]+h],[p[0]-h,p[1]+h]]}); }
  else { if(!FEAT_OK().includes(k)) return; if(LINE_KINDS.includes(k)){ M.featKind=k; M.featPts=[p]; M.mode='feat'; } else M.feats.push({kind:k, pts:[p]}); }
  M.draw(); M.changed();
}
function ctxText(){ const p=ctxPt; ctxClose(); askText(t('p.texthere'),'',s=>{ s=sStr(s,500); if(s){ M.annoPush(); M.annos.push({type:'text', pts:[p], text:s, stroke:M.annoStyle.stroke, size:M.annoStyle.size}); M.draw(); M.changed(); } }); }
document.addEventListener('click', e=>{ if(!(e.target.closest&&e.target.closest('#ctxmenu'))) ctxClose(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') ctxClose(); });
window.addEventListener('scroll', ctxClose, {passive:true});

function allocPanel(){
  return `<h2>${t('s.alloc')}</h2><p>${t('p.allocinfo')}</p><select id="allocsel">${CTX_GROUPS.map(g=>`<optgroup label="${t(g[0])}">${g[1].map(k=>`<option value="${g[2]}:${k}">${g[2]==='room'?t('r.'+k):t('f.'+k)}</option>`).join('')}</optgroup>`).join('')}</select>
    <button class="btn" onclick="allocGo()">${t('p.place')}</button>`;
}
function allocGo(){
  const [kind,k]=$('allocsel').value.split(':'); M.mode='view'; M.roomPts=[]; M.featPts=[];
  if(kind==='room'&&ROOM_TYPES.includes(k)){ M.curType=k; M.mode='room'; } else if(FEAT_OK().includes(k)){ M.featKind=k; M.mode='feat'; }
  M.draw();
}
const ANNO_TOOLS = [['select','tl.select'],['pencil','tl.pencil'],['line','tl.line'],['rect','tl.rect'],['square','tl.square'],['circle','tl.circle'],['ellipse','tl.ellipse'],['tri','tl.tri'],['trap','tl.trap'],['text','tl.text'],['erase','tl.erase']];
function drawPanel(){
  M.mode='anno'; M.cv.style.touchAction='none'; const st=M.annoStyle, opt=(list,cur)=>list.map(([v,l])=>`<option value="${v}" ${cur===v?'selected':''}>${t(l)}</option>`).join('');
  return `<h2>${t('s.draw')}</h2><p>${t('p.drawinfo')}</p><div class="tools">${ANNO_TOOLS.map(([k,l])=>`<button class="btn ${M.annoTool===k?'':'alt'}" onclick="annoTool('${k}')">${t(l)}</button>`).join('')}</div>
    <label>${t('p.stroke')}</label><input type="color" value="${st.stroke}" onchange="annoSet('stroke',this.value)">
    <label>${t('p.fillmode')}</label><select onchange="annoSet('fillMode',this.value)">${opt([['none','fill.none'],['light','fill.light'],['solid','fill.solid']],st.fillMode)}</select>
    <label>${t('p.fillc')}</label><input type="color" value="${st.fill}" onchange="annoSet('fill',this.value)">
    <label>${t('p.thick')}: <b id="thv">${st.w}</b></label><input type="range" min="1" max="20" value="${st.w}" oninput="$('thv').textContent=this.value;annoSet('w',+this.value)">
    <label>${t('p.dash')}</label><select onchange="annoSet('dash',this.value)">${opt([['solid','dash.solid'],['dash','dash.dash'],['dot','dash.dot'],['dd','dash.dd']],st.dash)}</select>
    <label>${t('p.textsize')}</label><input type="number" min="6" max="80" value="${st.size}" onchange="annoSet('size',+this.value)">
    <div style="margin-top:.6rem"><button class="btn alt" onclick="M.annoUndoDo()">${t('p.undo')}</button><button class="btn alt" onclick="M.annoRedoDo()">${t('p.redo')}</button><button class="btn alt" onclick="askConfirm(t('p.confirmclear'),()=>M.annoClear())">${t('p.clearall')}</button></div>`;
}
function annoTool(k){ if(!ANNO_TOOLS.some(x=>x[0]===k)) return; M.annoTool=k; M.annoSel=-1; renderPanel(); M.draw(); }
function annoSet(k,v){
  const st=M.annoStyle;
  if(k==='stroke'||k==='fill') v=sColor(v,st[k]); else if(k==='w') v=sNum(v,1,20,3); else if(k==='size') v=sNum(v,6,80,14);
  else if(k==='fillMode') v=sEnum(v,['none','light','solid'],'none'); else if(k==='dash') v=sEnum(v,['solid','dash','dot','dd'],'solid'); else return;
  st[k]=v; const a=M.annos[M.annoSel]; if(a){ M.annoPush(); a[k]=v; } M.draw();
}
function saveMapImage(){ M.draw(); M.cv.toBlob(b=>{ if(!b) return; const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='vastusense-map.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); },'image/png'); }

/* ---------- AstroVastu ---------- */
function grahaSync(){ M.grahaLabels = {}; for(const d in GRAHA_DIR) M.grahaLabels[d] = t('gr.'+GRAHA_DIR[d]); }
// One validator per birth-data field. Used while typing (astroSet) and when a project file is loaded (sAstro).
const validTZ = z => { try{ new Intl.DateTimeFormat('en',{timeZone:z}); return /^[A-Za-z0-9_+\-\/]{1,64}$/.test(z); }catch(e){ return false; } };
const isoDate = v => { const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); if(!m) return ''; const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3])); return (d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]&&+m[1]>=1600&&+m[1]<=2200)?v:''; };
const ASTRO_SPEC = {
  name:v=>sStr(v,120), gender:v=>sEnum(v,['f','m','o'],''), rating:v=>sEnum(v,['AA','A','B','C','DD','X','XX'],''), date:v=>isoDate(v),
  // out-of-range numbers are refused, not clamped
  hr:v=>{ const n=+v; return v!==''&&isFinite(n)&&n>=0&&n<=23?String(Math.floor(n)):''; }, mi:v=>{ const n=+v; return v!==''&&isFinite(n)&&n>=0&&n<=59?String(Math.floor(n)):''; }, se:v=>{ const n=+v; return v!==''&&isFinite(n)&&n>=0&&n<=59?String(Math.floor(n)):'0'; },
  h12:v=>v===true||v==='true', country:v=>/^[A-Z]{2}$/.test(v)?v:'', state:v=>sStr(v,100), city:v=>sStr(v,100),
  lat:v=>{ const n=+v; return v!==''&&isFinite(n)&&n>=-90&&n<=90?String(n):''; }, lon:v=>{ const n=+v; return v!==''&&isFinite(n)&&n>=-180&&n<=180?String(n):''; },
  tz:v=>validTZ(v)?v:'', manual:v=>v===true||v==='true', moff:v=>/^[+-]\d{2}:\d{2}$/.test(v)?v:'',
  ayan:v=>sEnum(v,['lahiri','raman','kp','fb','yuk','custom'],'lahiri'), ayc:v=>sNumStr(v), node:v=>sEnum(v,['mean','true'],'mean'), hsys:v=>sEnum(v,['whole','equal','sripati','chalit'],'whole'),
  notes:v=>sStr(v,1000), asc:v=>sEnum(v,RASHI,''), dasha:v=>sStr(v,80)
};
function sAstro(a){
  a = (a&&typeof a==='object') ? a : {}; const o={};
  for(const k in ASTRO_SPEC) o[k]=ASTRO_SPEC[k](typeof a[k]==='boolean'?a[k]:(typeof a[k]==='number'?String(a[k]):(typeof a[k]==='string'?a[k]:'')));
  if(!o.city && typeof a.place==='string') o.city=sStr(a.place,100);           // older projects stored one 'place' text
  o.houses={}; for(let h=1;h<=12;h++){ const x=(a.houses&&typeof a.houses==='object'&&a.houses[h])||{}; o.houses[h]={state:sEnum(x.state,['strong','weak','afflicted'],''), planets:sStr(x.planets,80)}; }
  return o;
}
function astroSet(k,v){
  if(!ASTRO_SPEC[k]) return; P.astro = P.astro||{};
  P.astro[k] = ASTRO_SPEC[k](typeof v==='boolean'?v:String(v==null?'':v));
}
// ---- time zone: UTC offset at the birth instant, from the browser's time-zone database (history and daylight saving included)
function tzOffMs(tz, utcMs){
  const p={}; new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(utcMs)).forEach(x=>{ p[x.type]=x.value; });
  return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-Math.floor(utcMs/1000)*1000;
}
function localToUtc(tz,y,m,d,H,Mi,S){
  const guess=Date.UTC(y,m-1,d,H,Mi,S); let off=tzOffMs(tz,guess), utc=guess-off; const off2=tzOffMs(tz,utc); if(off2!==off){ utc=guess-off2; off=off2; } return {utc, off};
}
const fmtOff = ms => { const m=Math.round(ms/60000), s=m<0?'-':'+', a=Math.abs(m); return s+String(Math.floor(a/60)).padStart(2,'0')+':'+String(a%60).padStart(2,'0'); };
function birthCheckText(){
  const a=P.astro||{}; if(!a.date||a.hr===''||a.hr===undefined||a.mi===''||a.mi===undefined) return t('b.fill');
  const [y,m,d]=a.date.split('-').map(Number), H=+a.hr, Mi=+a.mi, S=+(a.se||0), when=`${String(H).padStart(2,'0')}:${String(Mi).padStart(2,'0')}:${String(S).padStart(2,'0')}`;
  let off, utc, dst='';
  if(a.manual){ if(!a.moff) return t('b.fill'); const sg=a.moff[0]==='-'?-1:1, mins=sg*(+a.moff.slice(1,3)*60+ +a.moff.slice(4,6)); off=mins*60000; utc=Date.UTC(y,m-1,d,H,Mi,S)-off; }
  else { if(!a.tz) return t('b.badtz'); const r=localToUtc(a.tz,y,m,d,H,Mi,S); off=r.off; utc=r.utc; const j=tzOffMs(a.tz,Date.UTC(y,0,1)), l=tzOffMs(a.tz,Date.UTC(y,6,1)); dst=t(off>Math.min(j,l)?'b.dst':'b.std'); }
  const u=new Date(utc).toISOString().replace('T',' ').slice(0,19);
  return a.manual ? t('b.resm',{t:when, o:fmtOff(off), u}) : t('b.res',{t:when, z:a.tz, o:fmtOff(off), d:dst, u});
}
function birthUpdate(){ const e=$('bchk'); if(e) e.textContent=birthCheckText(); }
let _countries={};
function countryList(){
  if(_countries[LANG]) return _countries[LANG]; const out=[]; let dn=null; try{ dn=new Intl.DisplayNames([LANG],{type:'region'}); }catch(e){}
  if(dn) for(let a=65;a<=90;a++) for(let b=65;b<=90;b++){ const c=String.fromCharCode(a,b); let n=''; try{ n=dn.of(c); }catch(e){} if(n && n!==c) out.push([c,n]); }
  return _countries[LANG]=out.sort((x,y)=>x[1].localeCompare(y[1],LANG));
}
const tzList = () => { try{ return Intl.supportedValuesOf('timeZone'); }catch(e){ return ['Asia/Kolkata','Asia/Dubai','Asia/Karachi','Asia/Dhaka','Asia/Kathmandu','Asia/Colombo','Europe/London','Europe/Paris','Europe/Rome','Europe/Madrid','America/New_York','America/Chicago','America/Los_Angeles','America/Toronto','Australia/Sydney','Africa/Johannesburg','UTC']; } };
function birthDateShow(){ const v=(P.astro||{}).date; return v?v.split('-').reverse().join('/'):''; }
function birthDateSet(s){
  s=String(s||'').trim(); if(!s){ astroSet('date',''); birthUpdate(); return; }
  const m=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s), iso=m?`${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`:'';
  astroSet('date',iso); const el=$('bdate'); if(el){ el.style.borderColor=P.astro.date?'':'#c0392b'; if(P.astro.date) el.value=birthDateShow(); } if(!P.astro.date) toast('b.baddate'); birthUpdate();
}
function birthHour12(h24){ return h24===''||h24===undefined ? '' : String((+h24%12)||12); }
function birthTimeSet(k,v){
  const a=P.astro=P.astro||{};
  if(k==='hr' && a.h12){ let h=+v; if(!(h>=1&&h<=12)){ astroSet('hr',''); birthUpdate(); return; } const pm=(a.ampm==='pm'); astroSet('hr',String((h%12)+(pm?12:0))); }
  else astroSet(k,v);
  birthUpdate();
}
function birthAmpm(v){ const a=P.astro=P.astro||{}; a.ampm=v==='pm'?'pm':'am'; if(a.hr!==''&&a.hr!==undefined){ const h=(+a.hr)%12; astroSet('hr',String(h+(a.ampm==='pm'?12:0))); } birthUpdate(); }
function birthMode(h12){ astroSet('h12',h12); const a=P.astro; if(h12) a.ampm = (+a.hr>=12)?'pm':'am'; renderPanel(); }
function birthKeepPlace(on){ const a=P.astro||{}; if(on) store.set('vs.place',JSON.stringify({country:a.country||'',state:a.state||'',city:a.city||'',lat:a.lat||'',lon:a.lon||'',tz:a.tz||''})); else store.set('vs.place',''); }
function birthClear(){ askConfirm(t('p.confirmclear'),()=>{ const h=(P.astro||{}).houses; P.astro={houses:h}; renderPanel(); }); }
/* ---------- City lookup (built-in list, see CITIES in data.js) ---------- */
const normCity = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
// The list is ordered by population, so the biggest match comes first.
function citySearch(q,max){
  const k=normCity(q); if(k.length<2) return []; const db=cityDB(), out=[];
  for(let i=0;i<db.length&&out.length<max;i++){ const c=db[i]; if(!c.k) c.k=normCity(c.n); if(c.k.startsWith(k)) out.push(c); }
  return out;
}
function cityApply(m){
  const a=P.astro=P.astro||{}; a.city=sStr(m.n,100); a.country=ASTRO_SPEC.country(m.c); a.state=sStr(m.s,100); a.lat=ASTRO_SPEC.lat(m.lat); a.lon=ASTRO_SPEC.lon(m.lon); if(validTZ(m.tz)){ a.tz=m.tz; a.manual=false; }
  renderPanel(); toast('b.cityok');
}
function citySuggest(v){
  const box=$('citysug'); if(!box) return; const res=citySearch(v,12); window._csug=res;
  box.innerHTML=res.map((c,i)=>`<button class="btn alt" style="display:block;width:100%;text-align:start;margin:2px 0" onclick="cityApply(_csug[${i}])">${esc(c.n)}${c.s?', '+esc(c.s):''} (${esc(c.c)})</button>`).join('');
}
// Country -> state -> city drop-downs, all filled from the built-in list.
function cityStates(cc){ return [...new Set(cityDB().filter(c=>c.c===cc).map(c=>c.s))].sort((x,y)=>x.localeCompare(y)); }
function cityOf(cc,st){ return cityDB().filter(c=>c.c===cc&&c.s===st).sort((x,y)=>x.n.localeCompare(y.n)); }
function birthCountry(v){ astroSet('country',v); astroSet('state',''); astroSet('city',''); renderPanel(); }
function birthState(v){ astroSet('state',v); astroSet('city',''); renderPanel(); }
function birthCityPick(i){ const m=(window._clist||[])[+i]; if(m) cityApply(m); }
function birthCity(v){
  astroSet('city',v); const a=P.astro, k=normCity(v); if(!k){ birthUpdate(); return; }
  const hit=citySearch(v,50).filter(c=>normCity(c.n)===k), m=hit.find(c=>c.c===a.country)||hit[0];
  if(m) cityApply(m); else birthUpdate();
}

/* ---------- Birth chart calculation ----------
   Low-precision formulas worked out in the browser: Sun, Moon and planets from mean orbital elements (Paul Schlyter's published method) with the main
   Moon, Jupiter and Saturn corrections; mean lunar node; ascendant from sidereal time; ayanamsha from a fixed epoch value plus precession. */
const DEG = Math.PI/180, nrm360 = x => ((x%360)+360)%360;
const EL = {   // [value at d=0, daily change]; d = days since 1999-12-31 00:00 UT
  Mercury:{N:[48.3313,3.24587e-5],i:[7.0047,5e-8],w:[29.1241,1.01444e-5],a:0.387098,e:[0.205635,5.59e-10],M:[168.6562,4.0923344368]},
  Venus:{N:[76.6799,2.4659e-5],i:[3.3946,2.75e-8],w:[54.891,1.38374e-5],a:0.72333,e:[0.006773,-1.302e-9],M:[48.0052,1.6021302244]},
  Mars:{N:[49.5574,2.11081e-5],i:[1.8497,-1.78e-8],w:[286.5016,2.92961e-5],a:1.523688,e:[0.093405,2.516e-9],M:[18.6021,0.5240207766]},
  Jupiter:{N:[100.4542,2.76854e-5],i:[1.303,-1.557e-7],w:[273.8777,1.64505e-5],a:5.20256,e:[0.048498,4.469e-9],M:[19.895,0.0830853001]},
  Saturn:{N:[113.6634,2.3898e-5],i:[2.4886,-1.081e-7],w:[339.3939,2.97661e-5],a:9.55475,e:[0.055546,-9.499e-9],M:[316.967,0.0334442282]},
  Sun:{N:0,i:0,w:[282.9404,4.70935e-5],a:1,e:[0.016709,-1.151e-9],M:[356.047,0.9856002585]},
  Moon:{N:[125.1228,-0.0529538083],i:5.1454,w:[318.0634,0.1643573223],a:60.2666,e:0.0549,M:[115.3654,13.0649929509]}
};
function orbit(name,d){
  const o=EL[name], f=p=>Array.isArray(p)?p[0]+p[1]*d:p, N=f(o.N)*DEG, i=f(o.i)*DEG, w=f(o.w)*DEG, e=f(o.e), M=nrm360(f(o.M))*DEG;
  let E=M+e*Math.sin(M)*(1+e*Math.cos(M)); for(let k=0;k<8;k++) E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const xv=o.a*(Math.cos(E)-e), yv=o.a*Math.sqrt(1-e*e)*Math.sin(E), v=Math.atan2(yv,xv), r=Math.hypot(xv,yv), u=v+w;
  return {x:r*(Math.cos(N)*Math.cos(u)-Math.sin(N)*Math.sin(u)*Math.cos(i)), y:r*(Math.sin(N)*Math.cos(u)+Math.cos(N)*Math.sin(u)*Math.cos(i)), r, Mdeg:nrm360(f(o.M)), wdeg:nrm360(f(o.w)), Ndeg:nrm360(f(o.N))};
}
function tropLongs(d){
  const S=orbit('Sun',d), xs=S.x, ys=S.y, out={};
  out.Sun=nrm360(Math.atan2(ys,xs)/DEG);
  // Moon with its main periodic corrections
  const Mo=orbit('Moon',d); let lm=Math.atan2(Mo.y,Mo.x)/DEG; const Ms=S.Mdeg, Mm=Mo.Mdeg, Lm=Mo.Mdeg+Mo.wdeg+Mo.Ndeg, Ls=S.Mdeg+S.wdeg, D=Lm-Ls, F=Lm-Mo.Ndeg, sn=x=>Math.sin(x*DEG);
  lm += -1.274*sn(Mm-2*D)+0.658*sn(2*D)-0.186*sn(Ms)-0.059*sn(2*Mm-2*D)-0.057*sn(Mm-2*D+Ms)+0.053*sn(Mm+2*D)+0.046*sn(2*D-Ms)+0.041*sn(Mm-Ms)-0.035*sn(D)-0.031*sn(Mm+Ms)-0.015*sn(2*F-2*D)+0.011*sn(Mm-4*D);
  out.Moon=nrm360(lm);
  const Mj=orbit('Jupiter',d).Mdeg, Msa=orbit('Saturn',d).Mdeg, cs=x=>Math.cos(x*DEG);
  ['Mercury','Venus','Mars','Jupiter','Saturn'].forEach(n=>{ const P_=orbit(n,d); let L=Math.atan2(P_.y+ys,P_.x+xs)/DEG;
    if(n==='Jupiter') L+=-0.332*sn(2*Mj-5*Msa-67.6)-0.056*sn(2*Mj-2*Msa+21)+0.042*sn(3*Mj-5*Msa+21)-0.036*sn(Mj-2*Msa)+0.022*cs(Mj-Msa)+0.023*sn(2*Mj-3*Msa+52)-0.016*sn(Mj-5*Msa-69);
    if(n==='Saturn') L+=0.812*sn(2*Mj-5*Msa-67.6)-0.229*cs(2*Mj-4*Msa-2)+0.119*sn(Mj-2*Msa-3)+0.046*sn(2*Mj-6*Msa-69)+0.014*sn(Mj-3*Msa+32);
    out[n]=nrm360(L); });
  out.Rahu=Mo.Ndeg; out.Ketu=nrm360(Mo.Ndeg+180);
  return out;
}
const AYAN0 = {lahiri:[22.460148,1900], raman:[21.014442,1900], kp:[22.363889,1900], fb:[24.042044,1950]};   // value in degrees at the given year
function ayanamsha(jd,a){
  const yr=2000+(jd-2451545)/365.25, rate=0.01396971;
  if(a.ayan==='custom'){ const v=parseFloat(a.ayc); return isFinite(v)? v+rate*(yr-2000) : null; }
  const e=AYAN0[a.ayan]||AYAN0.lahiri; return e[0]+rate*(yr-e[1]);
}
const NAKS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const GRAHAS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'], GAB = {Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'};
function birthUtc(){
  const a=P.astro||{}; if(!a.date||a.hr===''||a.hr===undefined||a.mi===''||a.mi===undefined) return null;
  const [y,m,d]=a.date.split('-').map(Number), H=+a.hr, Mi=+a.mi, S=+(a.se||0);
  if(a.manual){ if(!a.moff) return null; const sg=a.moff[0]==='-'?-1:1, off=sg*(+a.moff.slice(1,3)*60+ +a.moff.slice(4,6))*60000; return {utc:Date.UTC(y,m-1,d,H,Mi,S)-off, off}; }
  if(!a.tz) return null; return localToUtc(a.tz,y,m,d,H,Mi,S);
}
function astroCalc(){
  const a=P.astro||{}, u=birthUtc(), lat=parseFloat(a.lat), lon=parseFloat(a.lon);
  if(!u || !isFinite(lat) || !isFinite(lon) || a.lat===''||a.lon==='') return null;
  const jd=u.utc/86400000+2440587.5, d=jd-2451543.5, ay=ayanamsha(jd,a); if(ay===null) return {err:'ayc'};
  const trop=tropLongs(d), trop2=tropLongs(d+0.05), pos={};
  GRAHAS.forEach(g=>{ const s=nrm360(trop[g]-ay); let retro=(g==='Rahu'||g==='Ketu'); if(!retro&&g!=='Sun'&&g!=='Moon'){ let dl=trop2[g]-trop[g]; if(dl>180)dl-=360; if(dl<-180)dl+=360; retro=dl<0; } pos[g]={lon:s, sign:Math.floor(s/30), deg:s%30, retro, nak:NAKS[Math.floor(s/(360/27))], pada:Math.floor((s%(360/27))/((360/27)/4))+1}; });
  const T=(jd-2451545)/36525, eps=(23.4392911-0.0130042*T)*DEG, ramc=nrm360(280.46061837+360.98564736629*(jd-2451545)+lon)*DEG;
  const asc=nrm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc)*Math.cos(eps)+Math.tan(lat*DEG)*Math.sin(eps)))/DEG-ay), lsign=Math.floor(asc/30);
  const equal=(a.hsys==='equal');
  GRAHAS.forEach(g=>{ const p=pos[g]; p.house = equal ? Math.floor(nrm360(p.lon-asc)/30)+1 : ((p.sign-lsign+12)%12)+1; });
  return {pos, asc:{lon:asc, sign:lsign, deg:asc%30, nak:NAKS[Math.floor(asc/(360/27))]}, ay, utc:u.utc, fallback:(a.hsys==='sripati'||a.hsys==='chalit'), nodeFallback:a.node==='true', ayFallback:a.ayan==='yuk'};
}
const dms = x => { const d=Math.floor(x), m=Math.floor((x-d)*60); return d+'°'+String(m).padStart(2,'0')+"'"; };
function astroChartSvg(res){
  const byH={}; GRAHAS.forEach(g=>{ const h=res.pos[g].house; (byH[h]=byH[h]||[]).push(GAB[g]+(res.pos[g].retro&&g!=='Rahu'&&g!=='Ketu'?'(R)':'')); });
  const body=Object.keys(KPTS).map(h=>{ const p=KPTS[h], c=kcen(p), sn=((res.asc.sign+(h-1))%12)+1, pl=(byH[h]||[]), line1=pl.slice(0,2).join(' '), line2=pl.slice(2,4).join(' '), line3=pl.slice(4).join(' ');
    return `<polygon points="${p.map(q=>q.join(',')).join(' ')}" fill="${h==1?'#fff3df':'#fff'}" stroke="#555"/><text x="${c[0]}" y="${c[1]-19}" font-size="10" font-weight="700" text-anchor="middle" fill="#9a4b1c">${esc(ASTRO_HOUSES[h-1].z)}</text><text x="${c[0]}" y="${c[1]-8}" font-size="9" text-anchor="middle" fill="#777">H${h} &middot; ${sn}</text><text x="${c[0]}" y="${c[1]+4}" font-size="10" font-weight="700" text-anchor="middle">${esc(line1)}</text><text x="${c[0]}" y="${c[1]+15}" font-size="10" font-weight="700" text-anchor="middle">${esc(line2)}</text><text x="${c[0]}" y="${c[1]+26}" font-size="10" font-weight="700" text-anchor="middle">${esc(line3)}</text>`; }).join('');
  return `<svg viewBox="0 0 300 300" style="width:100%;max-width:26rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" role="img">${body}</svg>`;
}
function chartPanel(){
  const res=astroCalc(); let h=`<h2>${t('s.chart')}</h2><p>${t('c.info')}</p>`;
  if(!res) return h+`<div class="hint">${t('c.need')}</div>`;
  if(res.err) return h+`<div class="hint">${t('c.badtz')}</div>`;
  const a=P.astro, notes=[]; if(res.fallback) notes.push(t('c.fallback')); if(res.nodeFallback) notes.push(t('c.nodenote')); if(res.ayFallback) notes.push('Yukteshwar: Lahiri used.');
  h+=`<div class="hint"><b>${esc(a.name||'')}</b> ${t('c.utc')} ${new Date(res.utc).toISOString().replace('T',' ').slice(0,19)} &middot; ${t('c.ayan')} ${dms(res.ay)}<br><b>${t('c.asc')}:</b> ${RASHI[res.asc.sign]} ${dms(res.asc.deg)} &middot; ${res.asc.nak}</div>`;
  // Birth chart (left) and the Vastu plan turned East-up with the 12 house zones (right), side by side. Planets come from this calculation.
  const rows=astroAudit().map(r=>({...r, planets:GRAHAS.filter(g=>res.pos[g].house===r.x.h).map(g=>GAB[g]).join(' ')})), mp=astroMapImg(rows);
  h+=`<div style="display:flex;flex-wrap:wrap;gap:.8rem;align-items:flex-start"><div style="flex:1;min-width:15rem">${wmSvg(astroChartSvg(res))}<div class="rp-sm" style="font-size:.8rem">${t('p.chartleft')}</div></div>
    <div style="flex:1;min-width:15rem">${mp}${M.closed?'':`<div class="hint">${t('p.auditneed')}</div>`}<div class="rp-sm" style="font-size:.8rem">${t('p.chartright')}</div></div></div>`;
  h+=`<table class="ztab" style="margin-top:.6rem"><tr><td><b>${t('c.planet')}</b></td><td><b>${t('c.sign')}</b></td><td><b>${t('c.deg')}</b></td><td><b>${t('c.house')}</b></td><td><b>${t('c.nak')}</b></td></tr>`
    + `<tr><td>${t('c.asc')}</td><td>${RASHI[res.asc.sign]}</td><td>${dms(res.asc.deg)}</td><td>1</td><td>${res.asc.nak}</td></tr>`
    + GRAHAS.map(g=>{ const p=res.pos[g]; return `<tr><td>${t('gr.'+g)}${p.retro?' (R)':''}</td><td>${RASHI[p.sign]}</td><td>${dms(p.deg)}</td><td>${p.house}</td><td>${p.nak}-${p.pada}</td></tr>`; }).join('')+`</table>`;
  h+=`<div class="hint"><small>${t('c.retro')}${notes.length?'<br>'+notes.map(esc).join('<br>'):''}</small></div>`;
  h+=`<button class="btn" onclick="astroChartCopy()">${t('c.copy')}</button><button class="btn alt" onclick="astroReport()">${t('a.build')}</button>${chartList()}<div class="hint"><small>${t('p.astronote')}</small></div>`;
  return h;
}
function astroChartCopy(){
  const res=astroCalc(); if(!res||res.err) return; const a=P.astro; a.asc=RASHI[res.asc.sign]; a.houses=a.houses||{};
  for(let h=1;h<=12;h++){ a.houses[h]=a.houses[h]||{state:'',planets:''}; a.houses[h].planets=GRAHAS.filter(g=>res.pos[g].house===h).map(g=>GAB[g]).join(' '); }
  toast('c.copied');
}
/* ---------- Saved charts and the page-wise Astro-Vastu report ---------- */
let curChart=-1;   // index of the saved chart now open for editing, or -1
const chartLabel = a => sStr((a.name||'-')+' · '+birthDateShow()+(a.city?' · '+a.city:''),120);
function chartSave(){            // save as a new chart
  const a=P.astro||{}; if(!a.date){ toast('c.needsave'); return; } P.charts=P.charts||[]; if(P.charts.length>=50){ toast('c.full'); return; }
  P.charts.push({label:chartLabel(a), data:sAstro(JSON.parse(JSON.stringify(a)))}); curChart=P.charts.length-1; toast('c.savedok'); renderPanel();
}
function chartUpdate(){          // write the edits back into the chart that is open
  const c=(P.charts||[])[curChart], a=P.astro||{}; if(!c||!a.date){ toast('c.needsave'); return; }
  c.data=sAstro(JSON.parse(JSON.stringify(a))); if(!c.custom) c.label=chartLabel(a); toast('c.updated'); renderPanel();
}
function chartOpen(i,toBirth){ const c=(P.charts||[])[i]; if(!c) return; P.astro=sAstro(c.data); curChart=i; toast('c.opened'); if(toBirth) go('astro','birth'); else renderPanel(); }
function chartRename(i,v){ const c=(P.charts||[])[i]; if(!c) return; c.label=sStr(v,120)||chartLabel(c.data); c.custom=true; }
function chartDel(i){ askConfirm(t('p.confirmclear'),()=>{ (P.charts||[]).splice(i,1); if(curChart===i) curChart=-1; else if(curChart>i) curChart--; toast('c.deleted'); renderPanel(); }); }
function chartNew(){ curChart=-1; P.astro={houses:{}}; renderPanel(); }
// The list of saved charts: Edit loads one into Birth details, Report builds its pages, the name can be changed.
let chartPer=5, chartPg=0;   // how many saved charts to show on a page, and which page
function chartPerSet(v){ chartPer=[5,10,20].includes(+v)?+v:5; chartPg=0; renderPanel(); }
function chartPage(d){ const n=Math.max(1,Math.ceil((P.charts||[]).length/chartPer)); chartPg=Math.min(n-1,Math.max(0,chartPg+d)); renderPanel(); }
function chartList(){
  const ch=P.charts||[], pages=Math.max(1,Math.ceil(ch.length/chartPer)); if(chartPg>=pages) chartPg=pages-1;
  const from=chartPg*chartPer, shown=ch.map((c,i)=>[c,i]).slice(from,from+chartPer);
  let h=`<h3 style="margin-top:1rem">${t('a.charts')} (${ch.length})</h3>`;
  if(ch.length>5) h+=`<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-bottom:.3rem"><label style="margin:0;font-weight:400">${t('a.show')}</label><select style="width:auto" onchange="chartPerSet(this.value)">${[5,10,20].map(n=>`<option ${n===chartPer?'selected':''}>${n}</option>`).join('')}</select>
    <button class="btn alt" style="margin:0" ${chartPg<=0?'disabled':''} onclick="chartPage(-1)">&lsaquo; ${t('a.prev')}</button><span>${t('a.pn',{n:chartPg+1,m:pages})}</span><button class="btn alt" style="margin:0" ${chartPg>=pages-1?'disabled':''} onclick="chartPage(1)">${t('a.next')} &rsaquo;</button></div>`;
  h+=ch.length?`<table class="ztab">${shown.map(([c,i])=>`<tr><td><input type="text" style="width:100%;${i===curChart?'border-color:var(--acc);font-weight:700':''}" value="${esc(c.label)}" onchange="chartRename(${i},this.value)"></td>
    <td style="white-space:nowrap"><button class="btn alt" style="margin:0" onclick="chartOpen(${i},true)">${t('a.edit')}</button> <button class="btn alt" style="margin:0" onclick="chartOpen(${i});astroReport()">${t('a.rpt')}</button> <button class="btn alt" style="margin:0" onclick="chartDel(${i})">${t('a.del')}</button></td></tr>`).join('')}</table>`:`<div class="hint">${t('a.nonec')}</div>`;
  h+=`<div style="margin-top:.4rem">${curChart>=0&&ch[curChart]?`<button class="btn" onclick="chartUpdate()">${t('a.update')}</button>`:''}<button class="btn alt" onclick="chartSave()">${t('a.savechart')}</button><button class="btn alt" onclick="chartNew()">${t('a.newchart')}</button></div>`;
  return h+`<div class="hint"><small>${t('a.saveproj')}</small></div>`;
}
function areportPanel(){
  return `<h2>${t('s.areport')}</h2><p>${t('a.rinfo')}</p><button class="btn" onclick="astroReport()">${t('a.build')}</button>${chartList()}`;
}
function astroReport(){
  const res=astroCalc(); if(!res||res.err){ toast('c.need'); return; }
  const a=P.astro, rows=astroAudit().map(r=>({...r, planets:GRAHAS.filter(g=>res.pos[g].house===r.x.h).map(g=>GAB[g]).join(' ')})), mp=astroMapImg(rows), N=5, b=P.brand||{};
  const pg=(n,title,body)=>`<section class="rp-page"><h2>${title}</h2>${body}<div class="rp-foot rp-sm">VASTUSENSE BY ANOOPAM &middot; ${t('a.pn',{n,m:N})}</div></section>`;
  const gen={f:t('b.g.f'),m:t('b.g.m'),o:t('b.g.o')}[a.gender]||'-', place=[a.city,a.state,a.country].filter(Boolean).map(esc).join(', ')||'-';
  const p1=rpHeader('a.rtitle')+rpTbl(null,[[t('b.name'),esc(a.name)||'-',t('b.gender'),gen],[t('b.date'),birthDateShow()||'-',t('b.rating'),a.rating?t('rt.'+a.rating):'-'],
    [t('b.sec2'),place,t('b.lat')+' / '+t('b.lon'),esc(a.lat)+' / '+esc(a.lon)],[t('b.tz'),esc(a.manual?a.moff:a.tz),t('b.check'),esc(birthCheckText())],
    [t('b.ayan'),esc(a.ayan||'lahiri')+' ('+dms(res.ay)+')',t('b.hsys'),esc(a.hsys||'whole')],[t('b.node'),esc(a.node||'mean'),'','']])+(a.notes?`<h3>${t('b.notes')}</h3><p>${esc(a.notes)}</p>`:'');
  const tbl=rpTbl([t('c.planet'),t('c.sign'),t('c.deg'),t('c.house'),t('c.nak')],[[t('c.asc'),RASHI[res.asc.sign],dms(res.asc.deg),1,res.asc.nak]].concat(GRAHAS.map(g=>{ const p=res.pos[g]; return [t('gr.'+g)+(p.retro?' (R)':''),RASHI[p.sign],dms(p.deg),p.house,p.nak+'-'+p.pada]; })));
  const p2=`<div style="text-align:center">${wmSvg(astroChartSvg(res))}</div>`+tbl+`<p class="rp-sm">${t('c.retro')}</p><p class="rp-sm">${t('c.info')}</p>`;
  const p3=`<div style="display:flex;flex-wrap:wrap;gap:.8rem;align-items:flex-start"><div style="flex:1;min-width:14rem">${wmSvg(astroChartSvg(res))}<div class="rp-sm">${t('p.chartleft')}</div></div><div style="flex:1;min-width:14rem">${mp}${M.closed?'':`<div class="rp-warn">${t('p.auditneed')}</div>`}<div class="rp-sm">${t('p.chartright')}</div></div></div>`
    +rpTbl(['H',t('p.dir'),t('c.planet'),t('p.state'),t('p.inzone'),t('p.verdict')],rows.map(r=>['H'+r.x.h,r.x.z,r.planets||'-',r.state?t('as.'+r.state):'-',r.inZ.map(i=>typeLabel(i.type)).join(', ')||'-',r.v?t('ar.'+r.v):'-']));
  const acts=rows.filter(r=>r.v);
  const p4=(acts.length?acts.map(r=>{ const weak=(r.v==='C'||r.v==='Cclear'); return `<div class="hint"><b>H${r.x.h} &middot; ${r.x.z}</b> ${t('ar.'+r.v)}${r.cl.length?`<br>${t('p.moveout',{z:r.x.z})} <b>${r.cl.map(i=>typeLabel(i.type)).join(', ')}</b>`:''}<br><small>${esc(weak?r.x.weak:r.x.strong)}</small></div>`; }).join(''):`<div class="hint">${t('p.auditnone')}</div>`)+`<div class="hint"><small>${t('p.astronote')}</small></div>`;
  const p5=`<div class="hint" style="min-height:14rem">${t('a.notesph')}</div><p class="rp-sm">${t('rp.disclaimer')}</p><p class="rp-sm">${esc(b.footer)} ${b.prep?'&middot; '+t('b.prep')+': '+esc(b.prep):''} &middot; ${t('rp.generated')}</p>`;
  showReport(pg(1,t('s.birth'),p1)+pg(2,t('s.chart'),p2)+pg(3,t('a.p3'),p3)+pg(4,t('s.audit'),p4)+pg(5,t('a.p5'),p5));
}
const AS_STATES = ['strong','weak','afflicted'];
function astroHouse(h){ P.astro=P.astro||{}; P.astro.houses=P.astro.houses||{}; return P.astro.houses[h] || (P.astro.houses[h]={state:'',planets:''}); }
function astroHouseSet(h,k,v){ if(!(h>=1&&h<=12)) return; const o=astroHouse(h); o[k] = k==='state' ? sEnum(v,AS_STATES,'') : sStr(v,80); }
function housesPanel(){
  const a=P.astro||{};
  return `<h2>${t('s.houses')}</h2><p>${t('p.housesinfo')}</p>
    <label>${t('p.asc')}</label><select onchange="astroSet('asc',this.value)"><option value="">${t('p.choose')}</option>${RASHI.map(r=>`<option ${a.asc===r?'selected':''}>${r}</option>`).join('')}</select>
    <label>${t('p.dasha')}</label><input type="text" value="${esc(a.dasha)}" onchange="astroSet('dasha',this.value)">
    <table class="ztab" style="margin-top:.6rem">${ASTRO_HOUSES.map(x=>{ const o=(a.houses||{})[x.h]||{}, m=ASTRO_META[x.h];
      return `<tr><td><b>H${x.h}</b> ${m[0]}<br><small>${x.z} &middot; ${m[1].map(p=>t('gr.'+p)).join(', ')}</small></td>
        <td><select onchange="astroHouseSet(${x.h},'state',this.value)"><option value="">${t('p.choose')}</option>${AS_STATES.map(s=>`<option value="${s}" ${o.state===s?'selected':''}>${t('as.'+s)}</option>`).join('')}</select>
        <input type="text" placeholder="${t('p.planets')}" value="${esc(o.planets)}" onchange="astroHouseSet(${x.h},'planets',this.value)"></td></tr>`; }).join('')}</table>
    <div class="hint"><small>${t('p.astronote')}</small></div>`;
}
const zone16 = p => ZONES[Math.floor(((M.bearing(p)+11.25)%360)/22.5)].c;
function astroItems(){
  const out=[]; M.rooms.forEach(r=>out.push({type:r.type, zone:zone16(M.centroid(r.pts))}));
  M.feats.filter(f=>ROOM_ALL.includes(f.kind)).forEach(f=>out.push({type:f.kind, zone:zone16(M.featPoint(f))})); return out;
}
// Rules A, B, C from the owner's framework. A strong house with a supportive item: activate. Strong with a clashing item: remove it.
// Weak or afflicted with a clashing item: pacify and balance.
function astroAudit(){
  const items = M.closed ? astroItems() : [], hs=(P.astro||{}).houses||{};
  return ASTRO_HOUSES.map(x=>{ const st=hs[x.h]||{}, state=st.state||'', inZ=items.filter(i=>i.zone===x.z), sup=inZ.filter(i=>x.support.includes(i.type)), cl=inZ.filter(i=>x.clash.includes(i.type));
    let v=''; if(state==='strong') v = cl.length?'B':(sup.length?'A':'Aopen'); else if(state==='weak'||state==='afflicted') v = cl.length?'C':'Cclear';
    return {x,state,planets:st.planets||'',inZ,sup,cl,v}; });
}
const AV_CLS = {A:'v-prefer',Aopen:'v-ok',B:'v-avoid',C:'v-ok',Cclear:'v-neutral','':'v-neutral'};
const AV_COL = {strong:'#b7e1b0',weak:'#ffe08a',afflicted:'#f1a9a0','':'#eee'};
// North Indian chart (left half of the side-by-side view): 12 regions, house 1 at the top, counter-clockwise.
const KPTS = (()=>{ const O=[150,150]; return {1:[O,[75,75],[150,0],[225,75]],2:[[0,0],[150,0],[75,75]],3:[[0,0],[75,75],[0,150]],4:[O,[75,75],[0,150],[75,225]],5:[[0,150],[75,225],[0,300]],6:[[0,300],[75,225],[150,300]],
    7:[O,[75,225],[150,300],[225,225]],8:[[150,300],[225,225],[300,300]],9:[[300,300],[225,225],[300,150]],10:[O,[225,225],[300,150],[225,75]],11:[[300,150],[225,75],[300,0]],12:[[300,0],[225,75],[150,0]]}; })();
const kcen = p => [p.reduce((s,q)=>s+q[0],0)/p.length, p.reduce((s,q)=>s+q[1],0)/p.length];
function astroKundaliSvg(rows){
  const pts=KPTS, cen=kcen;
  const body=Object.keys(pts).map(h=>{ const r=rows[h-1], p=pts[h], c=cen(p), sub=(ASTRO_META[h][0]+(r.planets?': '+r.planets:'')).slice(0,24);
    return `<polygon points="${p.map(q=>q.join(',')).join(' ')}" fill="${AV_COL[r.state]}" stroke="#555"/><text x="${c[0]}" y="${c[1]}" font-size="14" font-weight="700" text-anchor="middle">H${h}</text><text x="${c[0]}" y="${c[1]+12}" font-size="8" text-anchor="middle" fill="#333">${esc(r.x.z)}</text><text x="${c[0]}" y="${c[1]+22}" font-size="7" text-anchor="middle" fill="#555">${esc(sub)}</text>`; }).join('');
  return `<svg viewBox="0 0 300 300" style="width:100%;max-width:26rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" role="img">${body}</svg>`;
}
// Vastu map (right half): the real plan turned so EAST is at the top, North on the left, with the 12 house zones tinted.
function astroMapImg(rows){
  // With no plot boundary yet, the 12 direction zones are still drawn (without the plan) so the directions are always visible.
  const S=420, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'); x.fillStyle='#faf6ee'; x.fillRect(0,0,S,S);
  if(M.closed){
    const c=M.getCentre(), W=M.cv.width, H=M.cv.height;
    const keep=Object.assign({},M.show); Object.assign(M.show,{zones:false,labels:false,graha:false,marma:false,grid:false,brahma:false}); M.draw();
    const far=Math.max(Math.hypot(c[0],c[1]),Math.hypot(W-c[0],c[1]),Math.hypot(c[0],H-c[1]),Math.hypot(W-c[0],H-c[1])), k=(S/2)/far*0.98;
    x.save(); x.translate(S/2,S/2); x.rotate(-(M.northDeg+90)*Math.PI/180); x.drawImage(M.cv,-c[0]*k,-c[1]*k,W*k,H*k); x.restore();
    Object.assign(M.show,keep); M.draw();
  }
  const byZone={}; rows.forEach(r=>{ byZone[r.x.z]=r; }), tint={A:'#2e9a3a',Aopen:'#8fcf4a',B:'#d6392b',C:'#e0a800',Cclear:'#c9b94a','':null};
  ZONES.forEach((z,i)=>{ const b=i*22.5, a0=(b-11.25-180)*Math.PI/180, a1=(b+11.25-180)*Math.PI/180, am=(b-180)*Math.PI/180, r=byZone[z.c];
    if(r){ const col=tint[r.v]||(r.state?AV_COL[r.state]:null); if(col){ x.save(); x.globalAlpha=.30; x.fillStyle=col; x.beginPath(); x.moveTo(S/2,S/2); x.arc(S/2,S/2,S/2,a0,a1); x.closePath(); x.fill(); x.restore(); } }
    x.strokeStyle='#0006'; x.lineWidth=1; x.beginPath(); x.moveTo(S/2,S/2); x.lineTo(S/2+Math.cos(a0)*S/2,S/2+Math.sin(a0)*S/2); x.stroke();
    x.font='bold 13px sans-serif'; x.textAlign='center'; x.fillStyle=r?'#000':'#777'; x.lineWidth=3; x.strokeStyle='#fffc'; const tx=S/2+Math.cos(am)*S*0.42, ty=S/2+Math.sin(am)*S*0.42, lab=r?'H'+r.x.h+' '+z.c:z.c; x.strokeText(lab,tx,ty); x.fillText(lab,tx,ty);
    if(r&&r.planets){ x.font='bold 11px sans-serif'; x.strokeText(r.planets,tx,ty+13); x.fillText(r.planets,tx,ty+13); } });
  x.font='bold 15px sans-serif'; x.fillStyle='#222'; x.textAlign='center'; x.fillText('E',S/2,16); x.fillText('W',S/2,S-6); x.fillText('N',10,S/2+5); x.fillText('S',S-10,S/2+5);
  x.save(); x.font='bold 11px sans-serif'; x.textAlign='right'; x.fillStyle='#222'; x.globalAlpha=.7; x.fillText('VASTUSENSE BY ANOOPAM',S-6,S-22); x.restore();
  return `<img src="${cv.toDataURL('image/png')}" style="width:100%;max-width:26rem;border:1px solid #ccc" alt="">`;
}function auditPanel(){
  const rows=astroAudit(), mapped=ASTRO_HOUSES.map(x=>x.z), items=M.closed?astroItems():[], un=items.filter(i=>!mapped.includes(i.zone));
  let h=`<h2>${t('s.audit')}</h2><p>${t('p.auditinfo')}</p>`;
  if(!M.closed) h+=`<div class="hint">${t('p.auditneed')}</div>`;
  h+=`<div style="display:flex;flex-wrap:wrap;gap:.8rem;align-items:flex-start"><div style="flex:1;min-width:15rem">${wmSvg(astroKundaliSvg(rows))}<div class="rp-sm" style="font-size:.8rem">${t('p.chartleft')}</div></div>
    <div style="flex:1;min-width:15rem">${astroMapImg(rows)}${M.closed?'':`<div class="hint">${t('p.auditneed')}</div>`}<div class="rp-sm" style="font-size:.8rem">${t('p.chartright')}</div></div></div>`;
  h+=`<table class="ztab" style="margin-top:.6rem"><tr><td><b>H</b></td><td><b>${t('p.dir')}</b></td><td><b>${t('p.state')}</b></td><td><b>${t('p.inzone')}</b></td><td><b>${t('p.verdict')}</b></td></tr>${rows.map(r=>`<tr><td>H${r.x.h}</td><td>${r.x.z}</td><td>${r.state?t('as.'+r.state):'-'}</td><td>${r.inZ.map(i=>typeLabel(i.type)).join(', ')||'-'}</td><td>${r.v?`<span class="vb ${AV_CLS[r.v]}">${t('ar.'+r.v)}</span>`:'-'}</td></tr>`).join('')}</table>`;
  const acts=rows.filter(r=>r.v);
  h+=acts.length ? acts.map(r=>{ const weak=(r.v==='C'||r.v==='Cclear'), txt=weak?r.x.weak:r.x.strong;
    return `<div class="hint"><b>H${r.x.h} &middot; ${r.x.z}</b> <span class="vb ${AV_CLS[r.v]}">${t('ar.'+r.v)}</span>${r.cl.length?`<br>${t('p.moveout',{z:r.x.z})} <b>${r.cl.map(i=>typeLabel(i.type)).join(', ')}</b>`:''}<br><small>${esc(txt)}</small></div>`; }).join('')
    : `<div class="hint">${t('p.auditnone')}</div>`;
  if(un.length) h+=`<div class="hint"><b>${t('p.unmapped')}</b><br>${un.map(i=>typeLabel(i.type)+' ('+i.zone+')').join(', ')}</div>`;
  return h+`<div class="hint"><small>${t('p.astronote')}</small></div>`;
}

function birthPanel(){
  const a=P.astro=P.astro||{}, h12=!!a.h12;
  if(!a.tz && !a.manual){ const dp=safeJSON(store.get('vs.place','')||'null'); if(dp){ ['country','state','city','lat','lon','tz'].forEach(k=>{ if(!a[k]) a[k]=ASTRO_SPEC[k](dp[k]); }); } if(!a.tz) a.tz='Asia/Kolkata'; }
  if(!a.country && !a.state && !a.city) a.country='IN';   // same default as the time zone; change it in the Country list
  const sel=(id,list,cur,onch)=>`<select id="${id}" onchange="${onch}">${list.map(([v,l])=>`<option value="${esc(v)}" ${cur===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  const hh = a.hr===undefined||a.hr==='' ? '' : (h12?birthHour12(a.hr):a.hr);
  return `<h2>${t('s.birth')}</h2><p>${t('p.birthinfo')}</p>
  <div class="sec"><h3>${t('b.sec1')}</h3>
    <label>${t('b.name')}</label><input type="text" placeholder="${t('b.nameph')}" value="${esc(a.name)}" onchange="astroSet('name',this.value)">
    <div class="row2"><div><label>${t('b.gender')}</label>${sel('bg',[['','—'],['f',t('b.g.f')],['m',t('b.g.m')],['o',t('b.g.o')]],a.gender||'',"astroSet('gender',this.value)")}</div>
    <div><label>${t('b.rating')}</label>${sel('br',[['',t('rt.none')],['AA',t('rt.AA')],['A',t('rt.A')],['B',t('rt.B')],['C',t('rt.C')],['DD',t('rt.DD')],['X',t('rt.X')],['XX',t('rt.XX')]],a.rating||'',"astroSet('rating',this.value)")}</div></div>
    <label>${t('b.date')}</label><input type="text" id="bdate" inputmode="numeric" placeholder="DD/MM/YYYY" maxlength="10" value="${birthDateShow()}" onchange="birthDateSet(this.value)">
    <div style="margin:.5rem 0"><button class="btn ${h12?'alt':''}" style="margin:0" onclick="birthMode(false)">${t('b.h24')}</button> <button class="btn ${h12?'':'alt'}" style="margin:0" onclick="birthMode(true)">${t('b.h12')}</button></div>
    <div class="row3"><div><label>${t('b.hours')}</label><input type="number" min="${h12?1:0}" max="${h12?12:23}" value="${esc(hh)}" oninput="birthTimeSet('hr',this.value)"></div>
      <div><label>${t('b.min')}</label><input type="number" min="0" max="59" value="${esc(a.mi)}" oninput="birthTimeSet('mi',this.value)"></div>
      <div><label>${t('b.sec')}</label><input type="number" min="0" max="59" value="${esc(a.se||'0')}" oninput="birthTimeSet('se',this.value)"></div></div>
    ${h12?`<label>AM / PM</label>${sel('bap',[['am','AM'],['pm','PM']],a.ampm||'am',"birthAmpm(this.value)")}`:''}
  </div>
  <div class="sec"><h3>${t('b.sec2')}</h3>
    <label>${t('b.country')}</label>${sel('bc',[['',t('b.selcountry')]].concat(countryList()),a.country||'',"birthCountry(this.value)")}
    <label>${t('b.state')}</label>${(()=>{ const sl=a.country?cityStates(a.country):[]; if(a.state&&!sl.includes(a.state)) sl.unshift(a.state);
      return `<select onchange="birthState(this.value)"><option value="">${t('p.choose')}</option>${sl.map(s=>`<option value="${esc(s)}" ${s===a.state?'selected':''}>${esc(s||'-')}</option>`).join('')}</select>`; })()}
    <label>${t('b.city')}</label>${(()=>{ const cl=(a.country&&(a.state||cityStates(a.country).includes('')))?cityOf(a.country,a.state||''):[]; window._clist=cl; const cur=cl.findIndex(c=>c.n===a.city);
      return `<select onchange="birthCityPick(this.value)"><option value="">${t('p.choose')}</option>${cl.map((c,i)=>`<option value="${i}" ${i===cur?'selected':''}>${esc(c.n)}</option>`).join('')}</select>`; })()}
    <label>${t('b.citylist')}</label><input type="text" autocomplete="off" value="${esc(a.city)}" oninput="citySuggest(this.value)" onchange="birthCity(this.value)">
    <div id="citysug"></div>
    <div class="hint"><small>${t('b.coordnote')}</small></div>
    <div class="row2"><div><label>${t('b.lat')}</label><input type="number" step="0.0001" min="-90" max="90" value="${esc(a.lat)}" onchange="astroSet('lat',this.value)"></div>
    <div><label>${t('b.lon')}</label><input type="number" step="0.0001" min="-180" max="180" value="${esc(a.lon)}" onchange="astroSet('lon',this.value)"></div></div>
    <label>${t('b.tz')}</label><input type="text" list="tzl" value="${esc(a.tz)}" onchange="if(!validTZ(this.value)){toast('b.badtz');this.style.borderColor='#c0392b';}else{this.style.borderColor='';}astroSet('tz',this.value);birthUpdate()">
    <datalist id="tzl">${tzList().map(z=>`<option value="${esc(z)}">`).join('')}</datalist>
    <div class="hint"><small>${t('b.tzex')}</small></div>
    <label style="font-weight:400"><input type="checkbox" onchange="birthKeepPlace(this.checked)"> ${t('b.keep')}</label>
  </div>
  <div class="sec"><h3>${t('b.sec3')}</h3><p>${t('b.tzinfo')}</p>
    <label style="font-weight:400"><input type="checkbox" ${a.manual?'checked':''} onchange="astroSet('manual',this.checked);renderPanel()"> ${t('b.manual')}</label>
    ${a.manual?`<label>${t('b.moff')}</label><input type="text" placeholder="+05:30" maxlength="6" value="${esc(a.moff)}" onchange="astroSet('moff',this.value);birthUpdate()">`:''}
    <div class="hint" style="margin-top:.5rem"><b>${t('b.check')}</b> <span id="bchk">${esc(birthCheckText())}</span></div>
  </div>
  <div class="sec"><h3>${t('b.sec4')}</h3>
    <label>${t('b.ayan')}</label>${sel('bay',[['lahiri','Lahiri (Chitrapaksha)'],['raman','Raman'],['kp','Krishnamurti (KP)'],['fb','Fagan-Bradley'],['yuk','Yukteshwar'],['custom',t('b.custom')]],a.ayan||'lahiri',"astroSet('ayan',this.value)")}
    <label>${t('b.ayc')}</label><input type="text" placeholder="23.85" value="${esc(a.ayc)}" onchange="astroSet('ayc',this.value)">
    <div class="row2"><div><label>${t('b.node')}</label>${sel('bn',[['mean',t('node.mean')],['true',t('node.true')]],a.node||'mean',"astroSet('node',this.value)")}</div>
    <div><label>${t('b.hsys')}</label>${sel('bh',[['whole',t('hs.whole')],['equal',t('hs.equal')],['sripati','Sripati'],['chalit','Bhava Chalit']],a.hsys||'whole',"astroSet('hsys',this.value)")}</div></div>
    <div class="hint"><small>${t('b.setnote')}</small></div>
  </div>
  <div class="sec"><label>${t('b.notes')}</label><textarea rows="4" style="width:100%;padding:.45rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font:inherit" placeholder="${t('b.notesph')}" onchange="astroSet('notes',this.value)">${esc(a.notes)}</textarea>
    <button class="btn" onclick="${curChart>=0&&(P.charts||[])[curChart]?'chartUpdate()':'chartSave()'}">${t('b.save')}</button><button class="btn alt" onclick="birthClear()">${t('b.clear')}</button></div>
  <div class="sec">${chartList()}</div>
  <div class="hint"><small>${t('p.astroprivacy')}</small></div>`;
}
function grahaPanel(){
  return `<h2>${t('s.graha')}</h2><p>${t('p.grahainfo')}</p>
    <label style="font-weight:400"><input type="checkbox" ${M.show.graha?'checked':''} onchange="M.show.graha=this.checked;if(this.checked)M.show.zones=true;grahaSync();M.draw();renderMapTools()"> ${t('p.grahashow')}</label>
    <table class="ztab">${['N','NE','E','SE','S','SW','W','NW'].map(d=>`<tr><td><b>${d}</b></td><td>${zoneName(d)}</td><td>${t('gr.'+GRAHA_DIR[d])}</td></tr>`).join('')}</table>
    <div class="hint"><span class="tag">${t('st.unv')}</span> <small>${t('p.grahanote')}</small></div>`;
}

/* ---------- About us ---------- */
let aboutEdit = null;   // id of the person being edited
// Built-in profile text and photo are the defaults; a visitor's own edits (kept in their browser) only replace them when not empty.
function loadAbout(){ const s=safeJSON(store.get('vs.about','null')); if(s&&Array.isArray(s.people)) s.people.forEach(sp=>{
  if(sp&&sp.custom===true&&/^c[0-9a-f]{8}$/.test(sp.id)&&!ABOUT.people.some(x=>x.id===sp.id)&&ABOUT.people.length<20&&sStr(sp.name,120)) ABOUT.people.push({id:sp.id,custom:true,name:sStr(sp.name,120),role:'',tagline:'',bio:'',photo:''});
  const p=ABOUT.people.find(x=>sp&&x.id===sp.id); if(!p) return;
  [['role',sStr(sp.role,200)],['tagline',sStr(sp.tagline,300)],['bio',sStr(sp.bio,LIMITS.area)],['photo',sDataImg(sp.photo,600000)]].forEach(([k,v])=>{ if(v) p[k]=v; }); }); }
function saveAbout(){ store.set('vs.about', JSON.stringify({people:ABOUT.people})); }
// Editing, adding and deleting profiles is for the Superadmin only.
const isSA = () => !!(SESSION && SESSION.role==='superadmin');
function aboutAdd(){
  if(!isSA()||ABOUT.people.length>=20) return; const id='c'+[...crypto.getRandomValues(new Uint8Array(4))].map(x=>x.toString(16).padStart(2,'0')).join('');
  ABOUT.people.push({id,custom:true,name:'New profile',role:'',tagline:'',bio:'',photo:''}); aboutEdit=id; saveAbout(); renderPanel();
}
function aboutDel(id){ if(!isSA()) return; askConfirm(t('p.confirmclear'),()=>{ const i=ABOUT.people.findIndex(x=>x.id===id&&x.custom); if(i>=0){ ABOUT.people.splice(i,1); aboutEdit=null; saveAbout(); renderPanel(); } }); }
const initials = n => n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
function aboutPanel(){
  const card = p => {
    const sa=isSA(), ed = sa&&aboutEdit===p.id, pic = p.photo ? `<img src="${p.photo}" alt="${esc(p.name)}" style="width:7rem;height:7rem;border-radius:50%;object-fit:cover;border:2px solid var(--acc)">` : `<div style="width:7rem;height:7rem;border-radius:50%;background:var(--bg);border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--acc)">${esc(initials(p.name))}</div>`;
    return `<div class="hint" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">${pic}<div style="flex:1;min-width:12rem"><h2 style="margin:0">${esc(p.name)}</h2>
      ${ed ? `${p.custom?`<label>${t('b.name')}</label><input type="text" value="${esc(p.name)}" onchange="aboutSet('${p.id}','name',this.value)">`:''}<label>${t('p.role')}</label><input type="text" value="${esc(p.role)}" onchange="aboutSet('${p.id}','role',this.value)">
        <label>${t('p.tagline')}</label><input type="text" value="${esc(p.tagline)}" onchange="aboutSet('${p.id}','tagline',this.value)">
        <label>${t('p.bio')}</label><textarea rows="6" style="width:100%;padding:.45rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font:inherit" onchange="aboutSet('${p.id}','bio',this.value)">${esc(p.bio)}</textarea>
        <label>${t('p.photo')}</label><input type="file" accept="image/*" onchange="aboutPhoto('${p.id}',this.files[0])">
        ${p.photo?`<button class="btn alt" onclick="aboutSet('${p.id}','photo','');renderPanel()">${t('b.removelogo')}</button>`:''}
        <button class="btn" onclick="aboutEdit=null;renderPanel()">${t('p.done')}</button>${p.custom?`<button class="btn alt" onclick="aboutDel('${p.id}')">${t('a.del')}</button>`:''}`
      : `${p.role?`<div style="font-weight:600;color:var(--acc)">${esc(p.role)}</div>`:''}${p.tagline?`<div class="tag" style="margin:.2rem 0">${esc(p.tagline)}</div>`:''}<p style="color:var(--ink);white-space:pre-line">${p.bio?esc(p.bio):`<span style="color:var(--mut)">${t('p.noprofile')}</span>`}</p>${sa?`<button class="btn alt" onclick="aboutEdit='${p.id}';renderPanel()">${t('p.editprofile')}</button>`:''}`}</div></div>`;
  };
  return `<h2>${esc(ABOUT.org)}</h2><p>${t('p.aboutorg')}</p>${ABOUT.people.map(card).join('')}
    <div class="hint"><small>${t('p.aboutnote')}</small></div>${isSA()?`<button class="btn" onclick="aboutAdd()">${t('au.addprof')}</button><button class="btn alt" onclick="aboutExport()">${t('p.aboutexport')}</button>`:`<div class="hint"><small>${t('au.profsa')}</small></div>`}`;
}
function aboutSet(id,k,v){ if(!isSA()) return; const p=ABOUT.people.find(x=>x.id===id); if(!p||!['role','tagline','bio','photo','name'].includes(k)||(k==='name'&&!p.custom)) return;
  p[k] = k==='photo' ? sDataImg(v,600000) : sStr(v,k==='bio'?LIMITS.area:k==='tagline'?300:k==='name'?120:200); if(k==='name'&&!p.name) p.name='New profile'; saveAbout(); }
function aboutPhoto(id,f){ if(!isSA()) return; safeImageFile(f, 400, url=>{ aboutSet(id,'photo',url); renderPanel(); }, k=>toast(k)); }
function aboutExport(){ if(!isSA()) return;
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify({org:ABOUT.org,people:ABOUT.people},null,2)],{type:'application/json'})); a.download='vastusense-about.json'; a.click();
}

/* ---------- marma sthan screen ---------- */
// Items that the source names as harmful on a vital point: pillars, nails, pegs, impure substances, buried objects (verse 58).
// Mapping marked items to these is my reading: buried or impure (septic, sump, wells, manholes, earth pit) and heavy structure (stairs, shafts, lifts, tanks, pumps).
const MARMA_ITEMS = ['stp','sump','borewell','well','manhole','earth','stairc','shaft','lift','ohtank','pump'];
function marmaPanel(){
  let h=`<h2>${t('s.marma')}</h2><p>${t('p.marmainfo')}</p>
    <label style="font-weight:400"><input type="checkbox" ${M.show.marma?'checked':''} onchange="M.show.marma=this.checked;M.draw();renderMapTools()"> ${t('p.marmashow')}</label>
    <div class="hint"><small>${t('p.marmanote')}</small></div><h2 style="margin-top:.8rem">${t('p.marmacheck')}</h2>`;
  if(!M.closed || !M.frame()) return h + `<div class="hint">${t('p.needplot')}</div>`;
  const hits=[]; M.feats.filter(f=>MARMA_ITEMS.includes(f.kind)).forEach(f=>{ const m=M.marmaAt(M.featPoint(f)); if(m&&m.inside) hits.push({f,m}); });
  if(!M.feats.some(f=>MARMA_ITEMS.includes(f.kind))) return h + `<div class="hint">${t('p.marmanofeat')}</div>`;
  return h + (hits.length ? hits.map(x=>`<div class="hint"><span class="vb v-avoid">${t(x.m.atimarma?'zi.atimarma':'zi.marma')}</span> <b>${t('f.'+x.f.kind)}</b> &middot; ${t('p.sq')} ${x.m.n}</div>`).join('') : `<div class="hint">${t('p.marmanone')}</div>`);
}

/* ---------- Samarangana Sutradhara diagrams (from the summary's titles and structure only) ---------- */
function ssBook(){
  const W=600, tot=83, seg=[[49,'#d9c9a8','Chapters 1-48 and 51','Town planning, house building, machines'],[20,'#c9a98f','20 chapters','Temples'],[14,'#a9c4b4','Chapters 70-83','Images (8) and painting (6)']];
  let x=10, o=`<svg viewBox="0 0 620 130" style="width:100%;max-width:38rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" role="img"><text x="10" y="18" font-size="11" font-weight="700">The book in three parts (original numbering, 83 chapters)</text>`;
  seg.forEach(s=>{ const w=W*s[0]/tot; o+=`<rect x="${x}" y="30" width="${w}" height="50" fill="${s[1]}" stroke="#555"/><text x="${x+w/2}" y="52" font-size="10" text-anchor="middle" font-weight="700">${s[2]}</text><text x="${x+w/2}" y="68" font-size="9" text-anchor="middle">${s[3]}</text><text x="${x+w/2}" y="96" font-size="9" text-anchor="middle" fill="#555">${s[0]} chapters</text>`; x+=w; });
  return o+`<text x="10" y="120" font-size="9" fill="#555">Bar lengths are proportional to chapter counts given in the introduction.</text></svg>`;
}
const SS_THEMES = [['Creation and origins','#8e7cc3',[1,2,3,4]],['Geography, society','#76a5af',[5,6,7]],['The architect, the science','#f6b26b',[8,9]],['Land and site','#93c47d',[10,37,39]],
  ['Ritual and foundation','#e06666',[20,21,22,23,24,25,45,47,56]],['Town planning','#6fa8dc',[17,18]],['Palaces and royal buildings','#c27ba0',[26,27,28,29,30,31]],['Houses and parts','#ffd966',[32,33,34,35,36,38,40,41,42,43,44,46]],
  ['Machines, furniture','#b6d7a8',[48,49]],['Temples','#9fc5e8',[50,51,52,53,54,55,57,58,59,60,61,62,63,64,65,66,67,68,69,70]],['Images and poses','#d5a6bd',[71,72,73,74,75,76,77,78]],['Painting, rasa, measures','#ea9999',[79,80,81,82,83,84]]];
function ssMap(){
  const c=42, cols=12, pad=10, th=n=>SS_THEMES.find(t=>t[2].includes(n)), rows=7, legY=pad+rows*c+14;
  let o=`<svg viewBox="0 0 ${pad*2+cols*c} ${legY+Math.ceil(SS_THEMES.length/2)*16+12}" style="width:100%;max-width:38rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" role="img">`;
  for(let n=1;n<=84;n++){ const r=Math.floor((n-1)/cols), q=(n-1)%cols, t=th(n); o+=`<rect x="${pad+q*c}" y="${pad+r*c}" width="${c-3}" height="${c-3}" fill="${t?t[1]:'#eee'}" stroke="${t?'#666':'#ccc'}" stroke-width=".6"/><text x="${pad+q*c+(c-3)/2}" y="${pad+r*c+(c-3)/2+4}" font-size="11" text-anchor="middle" fill="${t?'#222':'#aaa'}">${n}</text>`; }
  SS_THEMES.forEach((t,i)=>{ const x=pad+(i%2)*((cols*c)/2), y=legY+Math.floor(i/2)*16; o+=`<rect x="${x}" y="${y-9}" width="11" height="11" fill="${t[1]}" stroke="#666" stroke-width=".5"/><text x="${x+16}" y="${y}" font-size="10">${t[0]}</text>`; });
  return o+'</svg>';
}
function ssTown(){
  return `<svg viewBox="0 0 440 360" style="width:100%;max-width:30rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" font-size="10" role="img">
   <rect x="20" y="20" width="400" height="300" rx="10" fill="#e8f1fa" stroke="#4a90c8" stroke-width="12"/>
   <rect x="38" y="38" width="364" height="264" rx="6" fill="#faf6ee" stroke="#8a6a3e" stroke-width="7"/>
   <path d="M220 38V302M38 170H402" stroke="#999" stroke-width="9"/><path d="M220 38V302M38 170H402" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 6"/>
   <rect x="208" y="30" width="24" height="16" fill="#faf6ee"/><rect x="208" y="294" width="24" height="16" fill="#faf6ee"/><rect x="30" y="158" width="16" height="24" fill="#faf6ee"/><rect x="394" y="158" width="16" height="24" fill="#faf6ee"/>
   <rect x="58" y="58" width="140" height="94" fill="#ffd966" stroke="#8a6a3e"/><text x="128" y="108" text-anchor="middle">quarters by caste</text><text x="128" y="121" text-anchor="middle">and trade</text>
   <rect x="242" y="58" width="140" height="94" fill="#ffd966" stroke="#8a6a3e"/><text x="312" y="108" text-anchor="middle">quarters by caste</text><text x="312" y="121" text-anchor="middle">and trade</text>
   <rect x="58" y="190" width="140" height="94" fill="#ffd966" stroke="#8a6a3e"/><text x="128" y="240" text-anchor="middle">quarters by caste</text><text x="128" y="253" text-anchor="middle">and trade</text>
   <rect x="242" y="190" width="140" height="94" fill="#ffd966" stroke="#8a6a3e"/><text x="312" y="240" text-anchor="middle">quarters by caste</text><text x="312" y="253" text-anchor="middle">and trade</text>
   <rect x="204" y="156" width="32" height="28" fill="#c27ba0" stroke="#4a2c12"/><text x="220" y="174" text-anchor="middle" font-size="9" fill="#fff">temple</text>
   <text x="220" y="14" text-anchor="middle" font-weight="700">moat</text><text x="220" y="334" text-anchor="middle" fill="#8a6a3e" font-weight="700">rampart</text><text x="220" y="348" text-anchor="middle" fill="#666">roads and gates</text></svg>`;
}
function ssTemples(){
  const rows=[['Ch. 55','64 temples (Rucaka and others)',64],['Ch. 57','65 temples (Vimana and others)',65],['Ch. 58','16 temples (Meru and others)',16],['Ch. 59','40 temples of the pure type',40],['Ch. 60','20 temples (Meru and others)',20],['Ch. 61','20 Nagara temples',20],['Ch. 62','36 temples (Shrikuta and others)',36]];
  let o=`<svg viewBox="0 0 560 ${rows.length*26+36}" style="width:100%;max-width:38rem;background:#fff;border:1px solid #ccc" font-family="sans-serif" font-size="10" role="img"><text x="10" y="16" font-weight="700">Temples named in the chapter titles (count)</text>`;
  rows.forEach((r,i)=>{ const y=28+i*26; o+=`<text x="10" y="${y+12}">${r[0]}</text><rect x="52" y="${y}" width="${r[2]*4}" height="18" fill="#9fc5e8" stroke="#4a78a8"/><text x="${52+r[2]*4+6}" y="${y+13}">${r[2]}  ${r[1]}</text>`; });
  return o+'</svg>';
}
Object.assign(DIAG,{ssBook, ssMap, ssTown, ssTemples});

/* ---------- Sign-in: a privacy lock on this device ----------
   There is no server. Accounts, approvals and sessions live in this browser only, so this is a lock, not shared security.
   Passwords are never stored: only a salted PBKDF2-SHA256 hash (150,000 rounds). Anyone may look around and see sample data;
   any action (typing, buttons, drawing on the map) asks for a login. The Superadmin approves registrations on this device. */
const AUTH_KEY='vs.auth', SESS_KEY='vs.sess', ROLE_RANK={user:1,researcher:2,superadmin:3}, RESEARCH_ONLY=['report/brand','tools/cert','remedy/rem','lib/rules'];
let SESSION=null, authMode='in';
// Password rule: at least 8 characters with a letter, a digit, an uppercase letter and a special character.
const pwOk = p => typeof p==='string' && p.length>=8 && p.length<=200 && /\p{L}/u.test(p) && /\d/.test(p) && /\p{Lu}/u.test(p) && /[^\p{L}\d\s]/u.test(p);
const b64=u=>btoa(String.fromCharCode(...u)), unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)), B64OK=/^[A-Za-z0-9+\/=]{20,64}$/, UNAME=/^[a-z0-9._-]{3,32}$/;
async function pwHash(pw,saltB64){
  const salt=saltB64?unb64(saltB64):crypto.getRandomValues(new Uint8Array(16)), key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(pw).slice(0,200)),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},key,256); return {salt:b64(salt),hash:b64(new Uint8Array(bits))};
}
function authDB(){
  const d=safeJSON(store.get(AUTH_KEY,'null')), o={su:null,users:[],fails:0,lockUntil:0}; if(!d||typeof d!=='object') return o;
  if(d.su&&UNAME.test(d.su.u)&&B64OK.test(d.su.salt)&&B64OK.test(d.su.hash)) o.su={u:d.su.u,salt:d.su.salt,hash:d.su.hash,rsalt:B64OK.test(d.su.rsalt)?d.su.rsalt:'',rhash:B64OK.test(d.su.rhash)?d.su.rhash:''};
  o.users=(Array.isArray(d.users)?d.users:[]).slice(0,200).map(x=>x&&UNAME.test(x.u)&&B64OK.test(x.salt)&&B64OK.test(x.hash)&&['user','researcher'].includes(x.role)&&['pending','approved','suspended'].includes(x.status)&&/^[0-9a-f]{8,32}$/.test(x.id)?{id:x.id,u:x.u,role:x.role,status:x.status,salt:x.salt,hash:x.hash,at:sNum(x.at,0,9e15,0)}:null).filter(Boolean);
  o.fails=sNum(d.fails,0,100,0); o.lockUntil=sNum(d.lockUntil,0,9e15,0); return o;
}
const authSave = db => store.set(AUTH_KEY, JSON.stringify(db));
const signedIn = () => !!SESSION;
function browserName(){ const u=navigator.userAgent; if(/Edg\//.test(u)) return 'Edge'; if(/OPR\/|Opera|Firefox|FxiOS|SamsungBrowser|Brave/.test(u)) return 'Other'; if(/Chrome\/|CriOS\//.test(u)) return 'Chrome'; if(/Safari\//.test(u)&&/Version\//.test(u)) return 'Safari'; return 'Other'; }
function authStart(w,keep){
  SESSION={id:w.id,u:w.u,role:w.role}; const s=JSON.stringify({...SESSION,exp:Date.now()+(keep?30*864e5:12*36e5)});
  try{ sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY); (keep?localStorage:sessionStorage).setItem(SESS_KEY,s); }catch(e){}
  authChrome();
}
function authRestore(){
  let d=null; try{ d=safeJSON(sessionStorage.getItem(SESS_KEY)||localStorage.getItem(SESS_KEY)||'null'); }catch(e){} if(!d||!(d.exp>Date.now())) return;
  const db=authDB(); if(d.role==='superadmin'){ if(db.su&&db.su.u===d.u) SESSION={id:'su',u:d.u,role:'superadmin'}; }
  else { const x=db.users.find(y=>y.id===d.id&&y.u===d.u&&y.status==='approved'&&y.role===d.role); if(x) SESSION={id:x.id,u:x.u,role:x.role}; }
}
function authOut(){ SESSION=null; try{ sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY); }catch(e){}
  if(cur.sec==='admin') go(MENU[0].id,MENU[0].subs[0].id); else renderMenu(); authChrome(); toast('au.out'); }
function authChrome(){
  const b=$('authbtn'); if(!b) return; b.textContent = SESSION ? (SESSION.u+' · '+t('au.out')) : t('au.signin'); b.title = SESSION ? t('au.signedas',{u:SESSION.u,r:t('au.role.'+SESSION.role)}) : t('au.signin');
  const a=$('adminbtn'); if(a){ a.style.display = SESSION&&SESSION.role==='superadmin' ? '' : 'none'; a.textContent=t('au.admin'); }
}
function authBtn(){ if(SESSION) authOut(); else authOpen(); }
function authMsg(k,v){ const m=$('au_msg'); if(m){ m.textContent=t(k,v); m.style.display='block'; } }
function authClose(){ const o=$('authbox'); if(o) o.remove(); }
function authOpen(mode){
  authMode=mode||authMode||'in'; authClose(); const db=authDB(), br=browserName();
  const w=document.createElement('div'); w.id='authbox'; w.className='askbox';
  const setup=(authMode==='setup'), reg=(authMode==='reg'), rec=(authMode==='rec'); let h=`<div class="askcard authcard"><div style="text-align:center"><div class="authlogo">VastuSense</div><small>VastuSutras by Anoopam</small></div>
    <div class="rp-sm" style="text-align:center;margin:.6rem 0 .3rem">${t('au.browsers')}</div>
    <div class="brs">${['Chrome','Edge','Safari'].map(b=>`<span class="br ${b===br?'on':''}">${b===br?'&#10003; ':''}${b==='Edge'?'Microsoft Edge':b==='Chrome'?'Google Chrome':'Safari'}</span>`).join('')}</div>
    <div class="rp-sm" style="text-align:center">${br==='Other'?t('au.br.other',{b:esc(navigator.userAgentData&&navigator.userAgentData.brands?navigator.userAgentData.brands.map(x=>x.brand).filter(x=>!/Not.?A/i.test(x)).join('/'):'?')}):t('au.br.ok',{b:br})} ${t('au.br.note')}</div>
    <div style="text-align:center;margin:.7rem 0"><button class="btn ${authMode==='in'?'':'alt'}" onclick="authOpen('in')">${t('au.signin')}</button><button class="btn ${reg?'':'alt'}" onclick="authOpen('reg')">${t('au.create')}</button></div>
    <div class="rp-sm" style="text-align:center">${t(setup?'au.setupinfo':reg?'au.welcome2':rec?'au.recinfo':'au.welcome')}</div>`;
  if(!reg&&!setup&&!rec) h+=`<label>${t('au.as')}</label><select id="au_role" onchange="authRoleChange()"><option value="superadmin">${t('au.role.superadmin')}</option><option value="researcher">${t('au.role.researcher')}</option><option value="user">${t('au.role.user')}</option></select>`;
  if(reg) h+=`<label>${t('au.as')}</label><select id="au_role"><option value="user">${t('au.role.user')}</option><option value="researcher">${t('au.role.researcher')}</option></select>`;
  h+=`<label>${t('au.user')}</label><input type="text" id="au_user" autocomplete="username" maxlength="32" autocapitalize="none" spellcheck="false">`;
  if(rec) h+=`<label>${t('au.key')}</label><input type="text" id="au_key" maxlength="40" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX">`;
  h+=`<label>${t(rec?'au.newpass':'au.pass')}</label><input type="password" id="au_pass" autocomplete="${reg||setup||rec?'new-password':'current-password'}" maxlength="200">`;
  if(reg||setup||rec) h+=`<div class="rp-sm">${t('au.policy')}</div><label>${t('au.pass2')}</label><input type="password" id="au_pass2" autocomplete="new-password" maxlength="200">`;
  h+=`<div style="margin:.4rem 0"><label class="chk"><input type="checkbox" onchange="['au_pass','au_pass2'].forEach(i=>{const e=$(i);if(e)e.type=this.checked?'text':'password'})"> ${t('au.show')}</label>${reg||rec?'':`<label class="chk"><input type="checkbox" id="au_keep"> ${t('au.keep')}</label>`}</div>
    <div id="au_msg" class="rp-warn" style="display:none"></div>
    <button class="btn" style="width:100%;margin:.4rem 0" onclick="${setup?'authSetup()':reg?'authRegister()':rec?'authRecover()':'authSignIn()'}">${t(setup?'au.setup':reg?'au.create':rec?'au.recover':'au.signin')}</button>
    <div style="text-align:center"><a href="#" onclick="event.preventDefault();authForgot()">${t('au.forgot')}</a> &middot; <a href="#" onclick="event.preventDefault();authClose()">${t('rp.close')}</a></div>
    <p class="rp-sm">${t('au.free')}</p><p class="rp-sm">${t('au.lock')}</p>
    <div class="trustbox"><b>${t('au.trust')}</b><br>${t('au.trusttxt')}</div></div>`;
  w.innerHTML=h; document.body.append(w); const u=$('au_user'); if(u) u.focus();
  w.querySelectorAll('input[type=text],input[type=password]').forEach(i=>i.onkeydown=e=>{ if(e.key==='Enter'){ (setup?authSetup:reg?authRegister:rec?authRecover:authSignIn)(); } });
  if(!reg&&!setup&&!rec){ $('au_role').value=store.get('vs.lastrole','user')==='superadmin'&&db.su?'superadmin':(['superadmin','researcher','user'].includes(store.get('vs.lastrole','user'))?store.get('vs.lastrole','user'):'user'); authRoleChange(); }
}
function authRoleChange(){ const r=$('au_role'); if(!r||authMode!=='in') return; if(r.value==='superadmin'&&!authDB().su) authOpen('setup'); }
async function authSignIn(){
  const role=$('au_role').value, u=$('au_user').value.trim().toLowerCase(), pw=$('au_pass').value, keep=$('au_keep')&&$('au_keep').checked, db=authDB();
  if(Date.now()<db.lockUntil){ authMsg('au.locked'); return; }
  let ok=false, who=null, why='au.bad';
  if(role==='superadmin'){ if(!db.su){ authMsg('au.nosu'); return; } const h=await pwHash(pw,db.su.salt); if(db.su.u===u&&h.hash===db.su.hash){ ok=true; who={id:'su',u,role:'superadmin'}; } }
  else { const x=db.users.find(y=>y.u===u), h=await pwHash(pw,x?x.salt:null);
    if(x&&h.hash===x.hash&&x.role===role){ if(x.status==='pending') why='au.pending'; else if(x.status!=='approved') why='au.suspended'; else { ok=true; who={id:x.id,u,role:x.role}; } } }
  if(!ok){ if(why==='au.bad'){ db.fails++; if(db.fails>=5){ db.fails=0; db.lockUntil=Date.now()+30000; } authSave(db); } authMsg(why); return; }
  db.fails=0; authSave(db); store.set('vs.lastrole',role); authStart(who,keep); authClose(); toast('au.signedas',{u:u,r:t('au.role.'+role)}); renderMenu(); renderPanel();
}
async function authSetup(){
  const u=$('au_user').value.trim().toLowerCase(), p=$('au_pass').value, p2=$('au_pass2').value, db=authDB();
  if(db.su){ authOpen('in'); return; } if(!UNAME.test(u)){ authMsg('au.baduser'); return; } if(!pwOk(p)){ authMsg('au.policy'); return; } if(p!==p2){ authMsg('au.mismatch'); return; }
  const h=await pwHash(p); db.su={u,salt:h.salt,hash:h.hash,rsalt:'',rhash:''}; const key=await authSetKey(db); authSave(db); authStart({id:'su',u,role:'superadmin'},false); authClose(); authShowKey(key); renderMenu(); renderPanel();
}
// ---- Superadmin recovery key. It is made on this device when the Superadmin is created, shown once, and only its hash is kept.
// (A key written into the app's code would be public on GitHub, so it is generated per device instead.)
function genKey(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r=crypto.getRandomValues(new Uint8Array(20)); return [0,5,10,15].map(i=>[...r.slice(i,i+5)].map(x=>A[x%32]).join('')).join('-'); }
const normKey = s => String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
async function authSetKey(db){ const k=genKey(), h=await pwHash(normKey(k)); db.su.rsalt=h.salt; db.su.rhash=h.hash; return k; }
function authShowKey(key){
  authClose(); const w=document.createElement('div'); w.id='authbox'; w.className='askbox';
  w.innerHTML=`<div class="askcard authcard"><h3 style="margin:0 0 .4rem">${t('au.keytitle')}</h3><p>${t('au.keyinfo')}</p><div class="keybox" id="au_keyshow">${esc(key)}</div>
    <button class="btn alt" onclick="navigator.clipboard&&navigator.clipboard.writeText($('au_keyshow').textContent).then(()=>toast('au.copied'))">${t('au.copy')}</button><button class="btn alt" onclick="window.print()">${t('rp.print')}</button>
    <label class="chk"><input type="checkbox" onchange="$('au_keyok').disabled=!this.checked"> ${t('au.keysaved')}</label><button class="btn" id="au_keyok" disabled onclick="authClose();toast('au.setupok')">${t('au.adm.done')}</button></div>`;
  document.body.append(w);
}
async function authRecover(){
  const u=$('au_user').value.trim().toLowerCase(), key=normKey($('au_key').value), p=$('au_pass').value, p2=$('au_pass2').value, db=authDB();
  if(Date.now()<db.lockUntil){ authMsg('au.locked'); return; } if(!db.su||!db.su.rhash){ authMsg('au.nokey'); return; }
  if(!pwOk(p)){ authMsg('au.policy'); return; } if(p!==p2){ authMsg('au.mismatch'); return; }
  const h=await pwHash(key,db.su.rsalt);
  if(db.su.u!==u||h.hash!==db.su.rhash){ db.fails++; if(db.fails>=5){ db.fails=0; db.lockUntil=Date.now()+30000; } authSave(db); authMsg('au.badkey'); return; }
  const np=await pwHash(p); db.su.salt=np.salt; db.su.hash=np.hash; const nk=await authSetKey(db); db.fails=0; authSave(db);
  authStart({id:'su',u,role:'superadmin'},false); authClose(); authShowKey(nk); renderMenu(); renderPanel();
}
function authForgot(){ const r=$('au_role'); if(r&&r.value==='superadmin') authOpen('rec'); else authMsg('au.forgotinfo'); }
async function authNewKey(){ if(!SESSION||SESSION.role!=='superadmin') return; const db=authDB(); if(!db.su) return; const k=await authSetKey(db); authSave(db); authShowKey(k); }
async function authRegister(){
  const role=$('au_role').value, u=$('au_user').value.trim().toLowerCase(), p=$('au_pass').value, p2=$('au_pass2').value, db=authDB();
  if(!['user','researcher'].includes(role)) return; if(!UNAME.test(u)){ authMsg('au.baduser'); return; } if(!pwOk(p)){ authMsg('au.policy'); return; } if(p!==p2){ authMsg('au.mismatch'); return; }
  if((db.su&&db.su.u===u)||db.users.some(x=>x.u===u)){ authMsg('au.exists'); return; } if(db.users.length>=200){ authMsg('au.exists'); return; }
  const h=await pwHash(p), id=[...crypto.getRandomValues(new Uint8Array(8))].map(x=>x.toString(16).padStart(2,'0')).join('');
  db.users.push({id,u,role,status:'pending',salt:h.salt,hash:h.hash,at:Date.now()}); authSave(db); authMsg('au.requested'); $('au_pass').value=$('au_pass2').value='';
}
// ---- Superadmin: approve registrations and manage logins
function authAdmin(){ go('admin','accounts'); }
const adminOnly = f => (SESSION&&SESSION.role==='superadmin') ? f() : `<h2>${t('m.admin')}</h2><div class="hint">${t('au.adm.only')}</div>`;
function adminSecurity(){
  const db=authDB();
  return `<h2>${t('s.security')}</h2><p>${t('au.sec.info')}</p>
    <table class="ztab"><tr><td><b>${t('au.user')}</b></td><td>${esc(db.su?db.su.u:'')}</td></tr><tr><td><b>${t('au.key')}</b></td><td>${db.su&&db.su.rhash?t('au.key.set'):t('au.key.none')}</td></tr></table>
    <button class="btn" onclick="authAct('su','reset')">${t('au.adm.mypw')}</button><button class="btn alt" onclick="authNewKey()">${t('au.newkey')}</button>
    <div class="hint"><small>${t('au.keywhy')}</small></div>`;
}
function adminAccounts(){
  const db=authDB();
  const row=x=>`<tr><td><b>${esc(x.u)}</b><br><small>${t('au.role.'+x.role)} &middot; ${t('au.status.'+x.status)}</small></td><td style="white-space:nowrap">${x.status==='pending'?`<button class="btn" style="margin:0" onclick="authAct('${x.id}','approve')">${t('au.adm.approve')}</button> <button class="btn alt" style="margin:0" onclick="authAct('${x.id}','del')">${t('au.adm.reject')}</button>`
    :`<button class="btn alt" style="margin:0" onclick="authAct('${x.id}','${x.status==='approved'?'suspend':'approve'}')">${t(x.status==='approved'?'au.adm.suspend':'au.adm.restore')}</button> <button class="btn alt" style="margin:0" onclick="authAct('${x.id}','reset')">${t('au.adm.reset')}</button> <button class="btn alt" style="margin:0" onclick="authAct('${x.id}','del')">${t('au.adm.del')}</button>`}</td></tr>`;
  const pend=db.users.filter(x=>x.status==='pending'), rest=db.users.filter(x=>x.status!=='pending');
  return `<h2>${t('m.admin')}</h2><p>${t('au.adm.info')}</p><b>${t('au.adm.pending')} (${pend.length})</b>${pend.length?`<table class="ztab">${pend.map(row).join('')}</table>`:`<div class="rp-sm">${t('au.adm.none')}</div>`}
    <p></p><b>${t('au.adm.title')} (${rest.length})</b>${rest.length?`<table class="ztab">${rest.map(row).join('')}</table>`:`<div class="rp-sm">${t('au.adm.none')}</div>`}
    <p class="rp-sm">${t('au.lock')}</p>`;
}
function authAct(id,act){
  if(!SESSION||SESSION.role!=='superadmin') return; const db=authDB();
  if(act==='reset'){ askText(t('au.adm.newpw',{n:8}),'',async v=>{ const db2=authDB(); if(!pwOk(v)){ toast('au.policy'); return; } const h=await pwHash(v);
      if(id==='su'){ db2.su.salt=h.salt; db2.su.hash=h.hash; } else { const x=db2.users.find(y=>y.id===id); if(!x) return; x.salt=h.salt; x.hash=h.hash; } authSave(db2); toast('au.adm.done'); renderPanel(); }); return; }
  const x=db.users.find(y=>y.id===id); if(!x) return;
  if(act==='approve') x.status='approved'; else if(act==='suspend') x.status='suspended'; else if(act==='del') db.users.splice(db.users.indexOf(x),1);
  authSave(db); renderPanel();
}
// ---- The gate: before anyone is signed in, anything that changes something asks for a login. Looking around stays free.
function authGuard(e){
  const el=e.target; if(!el||!el.closest) return; if(el.closest('#authbox,#askbox,#toastbox,.top,#menu,#sub,#reportview,#ctxmenu')) return;
  const inPanel=el.closest('#panel'), onMap=el.closest('#map'); if(!inPanel&&!onMap) return;
  const key=cur.sec+'/'+cur.sub; if(inPanel){ if(!el.closest('input,select,textarea,button,summary,label,a,[onclick]')) return; if(cur.sec==='lib'&&key!=='lib/rules') return; }
  if(SESSION){ if(ROLE_RANK[SESSION.role]<2&&RESEARCH_ONLY.includes(key)&&inPanel){ e.preventDefault(); e.stopImmediatePropagation(); if(e.type==='click') toast('au.needres'); } return; }
  e.preventDefault(); e.stopImmediatePropagation(); if(e.type==='click'||e.type==='pointerdown'||e.type==='contextmenu') { if(!$('authbox')){ toast('au.need'); authOpen('in'); } }
}
['pointerdown','click','dblclick','contextmenu','keydown','input','change','paste','drop'].forEach(ev=>document.addEventListener(ev,authGuard,true));
// What a visitor sees before signing in: sample data in place of an empty page.
function authPrefill(){
  if(SESSION||P.astro&&P.astro.date) return;
  P.astro=sAstro({name:'Sample native',gender:'',date:'1985-08-15',hr:'6',mi:'30',se:'0',country:'IN',state:'Madhya Pradesh',city:'Indore',lat:'22.719',lon:'75.857',tz:'Asia/Kolkata',ayan:'lahiri',node:'mean',hsys:'whole',houses:{}});
  if(!M.img){ M.sample(); }
}

/* ---------- start ---------- */
M.onContext = ctxOpen;
M.onChange = ()=>{ renderMapTools(); if(cur.sec==='map') renderPanel(); };
$('langsel').onchange = e => { setLang(e.target.value); refreshAll(); };
$('themebtn').onclick = () => applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('fdown').onclick = () => { fontPct = Math.max(80, fontPct-10); applyFont(); };
$('fup').onclick = () => { fontPct = Math.min(160, fontPct+10); applyFont(); };

loadBrand(); loadAbout();
setLang(sEnum(store.get('vs.lang','en'), LANGS.map(l=>l[0]), 'en'));
applyTheme(sEnum(store.get('vs.theme','light'), ['light','dark'], 'light')); applyFont();
M.init(); authRestore(); authPrefill(); refreshAll();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
