const P = {name:'', siteType:'', client:'', phone:'', address:'', imgData:null};
let cur = {sec:'map', sub:'upload'};
const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

/* ---------- appearance: theme, font size, language ---------- */
let fontPct = +store.get('vs.font', 100);
function applyTheme(th){ document.documentElement.dataset.theme = th; store.set('vs.theme', th);
  document.querySelector('meta[name=theme-color]').content = th==='dark' ? '#0f3b40' : '#9a4b1c'; }
function applyFont(){ document.documentElement.style.fontSize = (16*fontPct/100)+'px'; store.set('vs.font', fontPct); }
function renderChrome(){
  $('langsel').innerHTML = LANGS.map(l=>`<option value="${l[0]}" ${l[0]===LANG?'selected':''}>${l[1]}</option>`).join('');
  $('langsel').title = t('ui.lang'); $('themebtn').title = t('ui.theme');
  $('fdown').title = $('fup').title = t('ui.font');
  $('empty').innerHTML = esc(t('ui.empty'));
}
function refreshAll(){ renderChrome(); renderMenu(); renderPanel(); renderMapTools(); $('zoneinfo').textContent = t('ui.clickmap'); }

/* ---------- menu ---------- */
function renderMenu(){
  const done = {project:()=>P.name&&P.siteType, map:()=>M.img&&M.pxPerM&&M.closed, zone:()=>M.show.grid||M.show.brahma};
  $('menu').innerHTML = MENU.map((s,i)=>`<button class="${s.id===cur.sec?'on':''}" data-s="${s.id}"><span class="num">${i+1}</span> ${t('m.'+s.id)}${done[s.id]&&done[s.id]()?` <span class="ok" title="${t('ui.done')}">&#10003;</span>`:''}</button>`).join('');
  $('menu').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.s, MENU.find(s=>s.id===b.dataset.s).subs[0].id));
  const sec = MENU.find(s=>s.id===cur.sec);
  $('sub').innerHTML = `<input id="qs" type="search" placeholder="${t('ui.search')}"><div id="qres"></div><div id="slist">` + sec.subs.map(u=>`<button class="${u.id===cur.sub?'on':''} ${!PANELS[sec.id+'/'+u.id]?'soon':''}" data-u="${u.id}">${t('s.'+u.id)}${!PANELS[sec.id+'/'+u.id]?` <span class="tag">${t('ui.stage',{n:u.stage})}</span>`:''}</button>`).join('') + '</div>';
  $('slist').querySelectorAll('button').forEach(b=>b.onclick=()=>go(cur.sec,b.dataset.u));
  $('qs').oninput = e => {
    const q = e.target.value.trim().toLowerCase(), r = [];
    if(q) MENU.forEach(s=>s.subs.forEach(u=>{ if((t('s.'+u.id)+' '+t('m.'+s.id)).toLowerCase().includes(q)) r.push([s,u]); }));
    $('qres').innerHTML = !q ? '' : r.length ? r.map(([s,u])=>`<button data-s="${s.id}" data-u="${u.id}">${t('m.'+s.id)} &rsaquo; ${t('s.'+u.id)}</button>`).join('') : `<span class="tag">${t('ui.nores')}</span>`;
    $('qres').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.s,b.dataset.u));
  };
}
// Next step in the journey: next sub-menu, or first sub-menu of the next section.
function nextStep(){
  const si = MENU.findIndex(s=>s.id===cur.sec), sec = MENU[si], ui = sec.subs.findIndex(u=>u.id===cur.sub);
  if(ui < sec.subs.length-1) go(sec.id, sec.subs[ui+1].id);
  else if(si < MENU.length-1) go(MENU[si+1].id, MENU[si+1].subs[0].id);
}
function go(sec, sub){ cur={sec,sub}; M.mode='view'; M.roomPts=[]; M.featPts=[]; M.draw(); renderMenu(); renderPanel(); renderMapTools(); }

function renderMapTools(){
  const c = (k,l)=>`<label><input type="checkbox" data-k="${k}" ${M.show[k]?'checked':''}> ${t(l)}</label>`;
  $('maptools').innerHTML = c('zones','mt.zones')+c('labels','mt.labels')+c('grid','mt.grid')+c('brahma','mt.brahma')+c('poly','mt.boundary')+c('rooms','mt.rooms')+c('cuts','mt.cuts')+c('feats','mt.feats')+
    `<span class="tag">${M.pxPerM?M.pxPerM.toFixed(1)+' px/m':t('mt.noscale')}</span>`+
    `<span class="tag">${t('mt.north',{d:M.northDeg.toFixed(1)})}</span>`+
    (M.pxPerM&&M.polyArea()?`<span class="tag">${t('mt.area',{a:(M.polyArea()/M.pxPerM/M.pxPerM).toFixed(0)})}</span>`:'');
  $('maptools').querySelectorAll('input').forEach(i=>i.onchange=()=>{M.show[i.dataset.k]=i.checked;M.draw();});
}

const modeBtn = (m,l)=>`<button class="btn ${M.mode===m?'on':''}" onclick="setMode('${m}')">${t(l)}</button>`;
function setMode(m){ M.mode = M.mode===m?'view':m; if(m==='room') M.roomPts=[]; if(m==='boundary'&&M.mode==='boundary'){M.poly=[];M.closed=false;} M.draw(); renderPanel(); }
function toast(k){ $('zoneinfo').textContent = t(k); }

const PANELS = {
  'project/new': ()=>`<h2>${t('s.new')}</h2><label>${t('p.pname')}</label><input type="text" id="pname" value="${esc(P.name)}">
    <button class="btn" onclick="P.name=$('pname').value;toast('p.savedmem')">${t('p.setname')}</button>
    <button class="btn alt" onclick="if(confirm(t('p.confirmfresh'))){location.reload()}">${t('p.fresh')}</button>`,
  'project/site': ()=>`<h2>${t('s.site')}</h2><p>${t('p.sitenote')}</p>
    <select onchange="P.siteType=this.value"><option value="">${t('p.choose')}</option>${SITE_TYPES.map(g=>`<optgroup label="${t('g.'+g.g)}">${g.t.map(k=>`<option value="${k}" ${P.siteType===k?'selected':''}>${t('t.'+k)}</option>`).join('')}</optgroup>`).join('')}</select>`,
  'project/school': ()=>`<h2>${t('s.school')}</h2><p>${t('p.schoolnote')}</p><label>${t('p.school')}</label>
    <select onchange="P.school=this.value"><option value="">${t('p.choose')}</option>${['vedic','modern','maha','custom'].map(k=>`<option value="${k}" ${P.school===k?'selected':''}>${t('sc.'+k)}</option>`).join('')}</select>`,
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
  'plan/entry': ()=>verdictPanel('s.entry','p.entryinfo', i=>i.type==='entrance'),
  'plan/wet': ()=>verdictPanel('s.wet','p.wetinfo', i=>WET.includes(i.type)),
  'tools/maindoor': ()=>verdictPanel('s.maindoor','p.entryinfo', i=>i.type==='entrance'),
  'report/score': ()=>scorePanel(),
  'lib/rules': ()=>rulesPanel(),
  'map/layers': ()=>`<h2>${t('s.layers')}</h2><p>${t('p.layersinfo')}</p>
    ${[['zones','mt.zones'],['labels','mt.labels'],['grid','mt.grid'],['brahma','mt.brahma'],['poly','mt.boundary'],['rooms','mt.rooms'],['cuts','mt.cuts'],['feats','mt.feats']].map(([k,l])=>`<label style="font-weight:400"><input type="checkbox" ${M.show[k]?'checked':''} onchange="M.show['${k}']=this.checked;M.draw();renderMapTools()"> ${t(l)}</label>`).join('')}`,
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
  'zone/brahma': ()=>`<h2>${t('s.brahma')}</h2><p>${t('p.brinfo')}</p>
    <label><input type="checkbox" ${M.show.brahma?'checked':''} onchange="M.show.brahma=this.checked;M.draw();renderMapTools()"> ${t('p.brshow')}</label>
    <div class="hint">${t('p.brhint')}</div>`,
  'zone/elem': ()=>`<h2>${t('s.elem')}</h2><p>${t('p.elinfo')}</p>
    <table class="ztab">${ELEMENTS.map(e=>`<tr><td><b>${t('e.'+e.k)}</b></td><td>${e.z==='centre'?t('el.centre'):zoneName(e.z)+' ('+e.z+')'}</td></tr>`).join('')}</table>`,
  'lib/classic': ()=>`<h2>${t('s.classic')}</h2><p>${t('p.libnote')}</p>${libList(CLASSICS)}`,
  'lib/modern': ()=>`<h2>${t('s.modern')}</h2><p>${t('p.libnote')}</p>${libList(MODERN)}`,
  'lib/gloss': ()=>`<h2>${t('s.gloss')}</h2><p>${t('p.glosnote')}</p><dl>${GLOSSARY.map(g=>`<dt><b>${esc(g[0])}</b></dt><dd style="margin:0 0 .5rem;margin-inline-start:0;color:var(--mut)">${esc(g[1])}</dd>`).join('')}</dl>`,
  'zone/z16': ()=>`<h2>${t('s.z16')}</h2><p>${t('p.z16info')}</p>
    <table class="ztab">${ZONES.map(z=>`<tr><td><span style="display:inline-block;width:.8rem;height:.8rem;background:${z.col}"></span></td><td><b>${z.c}</b></td><td>${zoneName(z.c)}</td><td>${t('e.'+z.el)}</td><td>${z.lord?t('l.'+z.lord):''}</td></tr>`).join('')}</table>
    <div class="hint">${t('p.z16hint')}</div>`
};

/* ---------- stage 5: rule engine ---------- */
const DIR8 = ['N','NE','E','SE','S','SW','W','NW'];
const dirLabel = c => c==='C' ? t('el.centre') : zoneName(c)+' ('+c+')';
function activeRules(){
  const sc = P.school || 'vedic';
  let r = (sc==='vedic'||sc==='modern') ? RULES_STARTER.slice() : [];
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
  return items.map(i=>Object.assign(i,{res:judge(i.type,i.dir)}));
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
    (i.res.length ? i.res.map(x=>`<div style="margin-top:.25rem"><span class="vb v-${x.v}">${t('v.'+x.v)}</span> <span class="tag">${t('p.weight')} ${x.rule.weight||1}</span> <span class="tag">${t(x.rule.status==='verified'?'st.ver':'st.unv')}</span><br><small>${t('p.source')}: ${esc(x.rule.source)||t('p.srcnone')}</small></div>`).join('')
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
    <div style="margin-top:.6rem">${act.length ? act.map(r=>`<div class="hint"><b>${typeLabel(r.room)}</b> <span class="tag">${t('p.weight')} ${r.weight||1}</span> <span class="tag">${t(r.status==='verified'?'st.ver':'st.unv')}</span><br>
      <span class="vb v-prefer">${(r.prefer||[]).join(' ')||'-'}</span> <span class="vb v-ok">${(r.accept||[]).join(' ')||'-'}</span> <span class="vb v-avoid">${(r.avoid||[]).join(' ')||'-'}</span><br><small>${t('p.source')}: ${esc(r.source)||t('p.srcnone')}</small></div>`).join('') : `<div class="hint">${t('p.norules')}</div>`}</div>`;
}
function rulesTemplate(){
  const ex = {rules:[{room:'kitchen', prefer:['SE'], accept:['NW'], avoid:['NE'], weight:3, source:'Book title, chapter, verse', status:'verified', applies:['house'], school:['vedic']}]};
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(ex,null,2)],{type:'application/json'}));
  a.download = 'vastusense-rules-template.json'; a.click();
}
function rulesLoad(f){
  if(!f) return; const r = new FileReader();
  r.onload = () => { let d; try{ d = JSON.parse(r.result); }catch(e){ d=null; }
    const list = Array.isArray(d) ? d : d && d.rules, okDir = a => !a || (Array.isArray(a) && a.every(x=>DIR8.includes(x)||x==='C'));
    if(!Array.isArray(list) || !list.length || !list.every(x=>ROOM_ALL.includes(x.room) && okDir(x.prefer) && okDir(x.accept) && okDir(x.avoid) && (x.weight===undefined || (x.weight>=1 && x.weight<=5)))){ toast('p.rulesbad'); return; }
    P.userRules = (P.userRules||[]).concat(list.map(x=>({room:x.room, prefer:x.prefer||[], accept:x.accept||[], avoid:x.avoid||[], weight:x.weight||1, source:String(x.source||''), status:x.status==='verified'?'verified':'unverified', applies:x.applies||'*', school:x.school||[]})));
    renderPanel(); toast('p.rulesok'); };
  r.readAsText(f);
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
function loadBrand(){ try{ const b = JSON.parse(store.get('vs.brand','null')); if(b) P.brand = b; }catch(e){} }
function brandSet(k,v){ P.brand = P.brand||{}; P.brand[k] = v; store.set('vs.brand', JSON.stringify(P.brand)); }
function brandLogo(f){
  if(!f) return; const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const w = Math.min(300, im.naturalWidth), h = Math.round(im.naturalHeight*w/im.naturalWidth), c = document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(im,0,0,w,h); brandSet('logo', c.toDataURL('image/png')); renderPanel(); };
    im.src = r.result; };
  r.readAsDataURL(f);
}
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
  const rows=[]; items.filter(i=>i.res.length).forEach(i=>i.res.forEach(x=>rows.push([typeLabel(i.type), dirLabel(i.dir), `<span class="vb v-${x.v}">${t('v.'+x.v)}</span>`, x.rule.weight||1, esc(x.rule.source)||t('p.srcnone')+' ('+t(x.rule.status==='verified'?'st.ver':'st.unv')+')'])));
  return h + rpTbl([t('p.roomtype'),t('p.dir'),'',t('p.weight'),t('p.source')], rows);
}
function rpRules(items){
  return rpTbl([t('p.roomtype'),'',t('p.weight'),t('p.source')], usedRules(items).map(r=>[typeLabel(r.room), `<span class="vb v-prefer">${(r.prefer||[]).join(' ')||'-'}</span> <span class="vb v-ok">${(r.accept||[]).join(' ')||'-'}</span> <span class="vb v-avoid">${(r.avoid||[]).join(' ')||'-'}</span>`, r.weight||1, (esc(r.source)||t('p.srcnone'))+' — '+t(r.status==='verified'?'st.ver':'st.unv')]));
}
function showReport(html){
  $('reportview').innerHTML = `<div class="rp-bar"><button class="btn" onclick="window.print()">${t('rp.print')}</button><button class="btn alt" onclick="closeReport()">${t('rp.close')}</button></div><div class="rp">${html}</div>`;
  document.body.classList.add('rp-on'); $('reportview').scrollTop = 0;
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
      h += `<div style="margin-top:.3rem"><span class="tag">${t('rm.layout')}</span> ${t('rm.move',{from:dirLabel(it.dir)})}: ` + (pf?`<span class="vb v-prefer">${pf}</span> `:'') + (ac?`<span class="vb v-ok">${ac}</span>`:'') + `<br><small>${t('p.source')}: ${esc(x.rule.source)||t('p.srcnone')} &middot; ${t(x.rule.status==='verified'?'st.ver':'st.unv')}</small></div>`; });
    mine.filter(r=>r.room===it.type && (!r.dirs.length||r.dirs.includes(it.dir)) && (!r.verdict.length||it.res.some(x=>r.verdict.includes(x.v)))).forEach(r=>{
      h += `<div style="margin-top:.3rem"><span class="tag">${t('rm.'+r.category)}</span> <span class="tag">${t(r.structural?'rm.struct':'rm.nostruct')}</span> ${esc(r.text)}<br><small>${t('p.source')}: ${esc(r.source)||t('p.srcnone')} &middot; ${t(r.status==='verified'?'st.ver':'st.unv')}</small></div>`; });
    return h + '</div>';
  }).join('');
  return cards || `<div class="hint">${t(items.length||judgeItems().some(i=>i.res.length)?'rm.none':'p.needrooms')}</div>`;
}
function remTemplate(){
  const ex={remedies:[{room:'kitchen', dirs:['NE'], verdict:['avoid'], category:'element', text:'Describe the remedy here', structural:false, source:'Book title, chapter, verse', status:'verified'}]};
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(ex,null,2)],{type:'application/json'})); a.download='vastusense-remedies-template.json'; a.click();
}
function remLoad(f){
  if(!f) return; const r=new FileReader();
  r.onload=()=>{ let d; try{ d=JSON.parse(r.result); }catch(e){ d=null; }
    const list=Array.isArray(d)?d:d&&d.remedies, okDir=a=>!a||(Array.isArray(a)&&a.every(x=>DIR8.includes(x)||x==='C')), okV=a=>!a||(Array.isArray(a)&&a.every(x=>['prefer','ok','avoid','neutral'].includes(x)));
    if(!Array.isArray(list)||!list.length||!list.every(x=>ROOM_ALL.includes(x.room)&&okDir(x.dirs)&&okV(x.verdict)&&typeof x.text==='string'&&x.text.trim())){ toast('rm.bad'); return; }
    P.userRemedies=(P.userRemedies||[]).concat(list.map(x=>({room:x.room, dirs:x.dirs||[], verdict:x.verdict||[], category:['layout','element','colour'].includes(x.category)?x.category:'other', text:x.text, structural:x.structural===true, source:String(x.source||''), status:x.status==='verified'?'verified':'unverified'})));
    renderPanel(); toast('rm.ok'); };
  r.readAsText(f);
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
const libList =a => a.map(x=>`<div class="hint"><b>${esc(x.n)}</b><br><span class="tag">${esc(x.by)}</span><br>${esc(x.d)}</div>`).join('');
function devTemplate(){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({cells:Array(81).fill('')})],{type:'application/json'}));
  a.download = 'devata-template.json'; a.click();
}
function devLoad(f){
  if(!f) return; const r = new FileReader();
  r.onload = () => { let d; try{ d = JSON.parse(r.result); }catch(e){ d=null; }
    const c = Array.isArray(d)?d:(d&&d.cells);
    if(!Array.isArray(c)||c.length!==81){ $('zoneinfo').textContent=t('p.z45bad'); return; }
    M.devata = c.map(String); M.show.grid = true; M.draw(); renderMapTools(); toast('p.z45ok'); };
  r.readAsText(f);
}
function renderPanel(){
  const key = cur.sec+'/'+cur.sub;
  const sub = MENU.find(s=>s.id===cur.sec).subs.find(s=>s.id===cur.sub);
  $('panel').innerHTML = PANELS[key] ? PANELS[key]()
    : `<h2>${t('s.'+sub.id)}</h2><div class="soonbox">${t('ui.soon',{n:sub.stage})}</div>`;
  $('panel').innerHTML += `<div style="margin-top:1rem"><button class="btn alt" onclick="nextStep()">${t('ui.next')} &rsaquo;</button></div>`;
}

/* ---------- files ---------- */
function loadFile(f){
  if(!f) return; const r = new FileReader();
  r.onload = () => { P.imgData = r.result; M.setImage(r.result, ()=>{M.poly=[];M.closed=false;M.centre=null;renderMapTools();}); };
  r.readAsDataURL(f);
}
function saveProject(){
  const d = {P, map:{northDeg:M.northDeg, poly:M.poly, closed:M.closed, pxPerM:M.pxPerM, centre:M.centre, devata:M.devata, rooms:M.rooms, zsys:M.zsys, feats:M.feats}};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
  a.download = (P.name||'vastusense-project')+'.json'; a.click();
}
function openProject(f){
  if(!f) return; const r = new FileReader();
  r.onload = () => { const d = JSON.parse(r.result); Object.assign(P,d.P); Object.assign(M,d.map); M.windFrom = (P.windFrom===undefined||P.windFrom==='') ? null : +P.windFrom;
    if(P.imgData) M.setImage(P.imgData, renderMapTools); else M.draw(); renderPanel(); renderMapTools(); toast('p.loaded'); };
  r.readAsText(f);
}

/* ---------- start ---------- */
M.onChange = ()=>{ renderMapTools(); if(cur.sec==='map') renderPanel(); };
$('langsel').onchange = e => { setLang(e.target.value); refreshAll(); };
$('themebtn').onclick = () => applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('fdown').onclick = () => { fontPct = Math.max(80, fontPct-10); applyFont(); };
$('fup').onclick = () => { fontPct = Math.min(160, fontPct+10); applyFont(); };

loadBrand();
setLang(store.get('vs.lang','en'));
applyTheme(store.get('vs.theme','light')); applyFont();
M.init(); refreshAll();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
