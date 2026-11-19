// Static data for VastuSense. Rules/element notes here are the common traditional
// assignments (dikpalas); they are marked for review and are NOT yet tied to citations.
// Keys resolve through i18n.js: g.* = group, t.* = type.
const SITE_TYPES = [
  {g:'res',  t:['flat','house','villa','farm']},
  {g:'com',  t:['shop','showroom','office','campus','cowork']},
  {g:'hos',  t:['hotel','resort','restaurant']},
  {g:'pub',  t:['mall','hospital','clinic','school','bank','hall','multiplex','petrol','temple']},
  {g:'ind',  t:['factory','workshop','industrial']},
  {g:'land', t:['plot','layout','township']}
];

// 16 zones, clockwise from North, each 22.5 degrees wide, centred on its direction.
const ZONES = [
  {c:'N',  n:'North',            lord:'Kubera',  el:'Water',  col:'#4f8fd6'},
  {c:'NNE',n:'North-North-East', lord:'',        el:'Water',  col:'#7fb0e0'},
  {c:'NE', n:'North-East',       lord:'Ishana',  el:'Water',  col:'#3aa6b8'},
  {c:'ENE',n:'East-North-East',  lord:'',        el:'Air',    col:'#8cc9a0'},
  {c:'E',  n:'East',             lord:'Indra',   el:'Air',    col:'#5bb36f'},
  {c:'ESE',n:'East-South-East',  lord:'',        el:'Fire',   col:'#d6b25a'},
  {c:'SE', n:'South-East',       lord:'Agni',    el:'Fire',   col:'#e0793a'},
  {c:'SSE',n:'South-South-East', lord:'',        el:'Fire',   col:'#e59a6a'},
  {c:'S',  n:'South',            lord:'Yama',    el:'Earth',  col:'#c1503f'},
  {c:'SSW',n:'South-South-West', lord:'',        el:'Earth',  col:'#b58b5a'},
  {c:'SW', n:'South-West',       lord:'Nairrti', el:'Earth',  col:'#8a6a3e'},
  {c:'WSW',n:'West-South-West',  lord:'',        el:'Earth',  col:'#a9a05a'},
  {c:'W',  n:'West',             lord:'Varuna',  el:'Water',  col:'#5a6fc9'},
  {c:'WNW',n:'West-North-West',  lord:'',        el:'Air',    col:'#9aa6d8'},
  {c:'NW', n:'North-West',       lord:'Vayu',    el:'Air',    col:'#8a8fa8'},
  {c:'NNW',n:'North-North-West', lord:'',        el:'Air',    col:'#a5b4c4'}
];

const ROOM_TYPES = ['entrance','living','dining','kitchen','master','bedroom','kids','guest','puja','study','toilet','bath','store','stair','balcony','garage','tank','septic','office','reception','cash','lobby','lift','shopfloor','godown','conference','server','pantry','restaurant','banquet','laundry','other'];
// MEP items placed on the map (feature kinds). Vastu rules may refer to them as well as to rooms.
const MEP_KINDS = ['mpanel','xfmr','dg','earth','meter','ohtank','sump','stp','manhole','pump','borewell','well','fexit','hydrant','fpump','assembly','lift','shaft','stairc','ahu','chiller','ctower','odu','plantroom','fai','exh','kexh'];
const ROOM_ALL = ROOM_TYPES.concat(MEP_KINDS);
const COMM_ONLY = ['shopfloor','godown','cash','office','reception','conference','server','pantry'];
const HOSP_ONLY = ['lobby','restaurant','banquet','laundry'];
// Typical spaces to tag per site type (a completeness checklist, not a Vastu claim).
const KIND = {flat:'res',house:'res',villa:'res',farm:'res',shop:'shop',showroom:'shop',mall:'shop',office:'office',campus:'office',cowork:'office',bank:'office',hotel:'hotel',resort:'hotel',restaurant:'hotel'};
const TYPICAL = {
  res:['entrance','living','kitchen','master','bedroom','toilet','puja'],
  shop:['entrance','shopfloor','cash','godown','toilet'],
  office:['entrance','reception','office','conference','server','pantry','toilet'],
  hotel:['entrance','lobby','reception','guest','restaurant','kitchen','banquet','laundry','lift','stair']
};

// Rule format: {room, prefer:[dirs], accept:[dirs], avoid:[dirs], weight:1-5, source, status, applies:[site types]|'*', school:[...]}
// Directions: N NE E SE S SW W NW, and C (central Brahmasthan cells). Judged on the room's centre point.
// STARTER RULES: widely repeated traditional placements. They are NOT tied to any citation:
// every one is marked 'unverified' and must be checked or replaced from the user's own text.
const U = 'tradition, no citation';
const RES = ['flat','house','villa','farm'], COM = ['shop','showroom','office','campus','cowork'];
const RULES_STARTER = [
  {room:'entrance', prefer:['N','NE','E'], accept:['NW','SE'], avoid:['SW'], weight:5, source:U, status:'unverified', applies:'*'},
  {room:'kitchen',  prefer:['SE'], accept:['NW'], avoid:['NE','C'], weight:4, source:U, status:'unverified', applies:RES},
  {room:'puja',     prefer:['NE'], accept:['N','E'], avoid:['S','SW'], weight:3, source:U, status:'unverified', applies:RES},
  {room:'master',   prefer:['SW'], accept:['S','W'], avoid:['NE'], weight:3, source:U, status:'unverified', applies:RES},
  {room:'living',   prefer:['N','E'], accept:['NE'], avoid:[], weight:2, source:U, status:'unverified', applies:RES},
  {room:'guest',    prefer:['NW'], accept:['W','N'], avoid:[], weight:1, source:U, status:'unverified', applies:RES},
  {room:'toilet',   prefer:['NW'], accept:['W'], avoid:['NE','SW','C'], weight:5, source:U, status:'unverified', applies:'*'},
  {room:'bath',     prefer:['E'], accept:['W','NW'], avoid:['NE'], weight:2, source:U, status:'unverified', applies:'*'},
  {room:'stair',    prefer:['S'], accept:['W','SW'], avoid:['NE','C'], weight:3, source:U, status:'unverified', applies:'*'},
  {room:'garage',   prefer:['SE','NW'], accept:[], avoid:['NE'], weight:1, source:U, status:'unverified', applies:'*'},
  {room:'cash',     prefer:['N'], accept:['E'], avoid:[], weight:3, source:U, status:'unverified', applies:COM},
  {room:'office',   prefer:['SW'], accept:['S','W'], avoid:['NE'], weight:2, source:U, status:'unverified', applies:COM}
];

// Five elements and their traditional zone (zone codes resolve via zoneName()).
const ELEMENTS = [
  {k:'Earth', z:'SW'}, {k:'Water', z:'NE'}, {k:'Fire', z:'SE'}, {k:'Air', z:'NW'}, {k:'Space', z:'centre'}
];

// Reference LIST only (titles, author/period where well established). No chapter or verse is quoted:
// each must be checked against the user's own copy before it is cited in a report.
const CLASSICS = [
  {n:'Brihat Samhita', by:'Varahamihira, about 6th century CE', d:'Encyclopaedic text; contains a chapter on house and site planning (vastu).'},
  {n:'Mayamata', by:'attributed to Maya, about 10th-11th century CE', d:'South Indian treatise on architecture, town and house planning.'},
  {n:'Manasara', by:'date uncertain', d:'Shilpa-tradition text on measurement, building types and planning.'},
  {n:'Samarangana Sutradhara', by:'attributed to King Bhoja, about 11th century CE', d:'Detailed treatise on architecture and site planning.'},
  {n:'Aparajitaprccha', by:'attributed to Bhuvanadeva, about 12th century CE', d:'Dialogue-form text on architecture and design.'},
  {n:'Vishwakarma Prakash', by:'date uncertain', d:'Vastu text from the Vishwakarma tradition.'}
];
const MODERN = [
  {n:'National Building Code of India 2016', by:'Bureau of Indian Standards', d:'Planning, fire and life safety, building services (including lifts and air conditioning).'},
  {n:'Energy Conservation Building Code (ECBC)', by:'Bureau of Energy Efficiency, India', d:'Envelope, HVAC, lighting and electrical efficiency for commercial buildings.'},
  {n:'IS 1893', by:'Bureau of Indian Standards', d:'Earthquake-resistant design of structures.'},
  {n:'IS 456', by:'Bureau of Indian Standards', d:'Plain and reinforced concrete: code of practice.'},
  {n:'IS 3043', by:'Bureau of Indian Standards', d:'Earthing: code of practice.'},
  {n:'ASHRAE 62.1', by:'ASHRAE', d:'Ventilation for acceptable indoor air quality.'},
  {n:'ASHRAE 55', by:'ASHRAE', d:'Thermal environmental conditions for human occupancy.'},
  {n:'ASHRAE 90.1', by:'ASHRAE', d:'Energy standard for buildings.'},
  {n:'NFPA 101', by:'NFPA', d:'Life Safety Code: exits and protection.'},
  {n:'NFPA 13', by:'NFPA', d:'Installation of sprinkler systems.'},
  {n:'NFPA 72', by:'NFPA', d:'Fire alarm and signaling code.'}
];
const GLOSSARY = [
  ['Vastu', 'The traditional science of siting and planning buildings.'],
  ['Vastu Purusha Mandala', 'The square grid diagram used to lay out a plot; here drawn as 9x9 (81 pada).'],
  ['Pada', 'One cell of the grid.'],
  ['Brahmasthan', 'The central part of the plot, traditionally kept open.'],
  ['Devata', 'A presiding deity assigned to a pada or zone.'],
  ['Dikpala', 'Guardian of a direction (for example Kubera of north, Indra of east).'],
  ['Ishanya', 'North-east.'], ['Agneya', 'South-east.'], ['Nairritya', 'South-west.'], ['Vayavya', 'North-west.'],
  ['Panchabhuta', 'The five elements: earth, water, fire, air, space.'],
  ['Marma', 'Vital points of the plot or building, traditionally kept free of heavy load or cutting.'],
  ['MEP', 'Mechanical, electrical and plumbing services of a building.'],
  ['HVAC', 'Heating, ventilation and air conditioning.']
];

// Navigation: section -> sub menus. stage = build stage in which it becomes live.
const MENU = [
  {id:'project', t:'Project', subs:[
    {id:'new', t:'New project', stage:1},{id:'site', t:'Site type', stage:1},
    {id:'school', t:'Vastu school', stage:2},{id:'facing', t:'Facing & home type', stage:2},
    {id:'client', t:'Client details', stage:1},{id:'quick', t:'Quick check (upload to score)', stage:6},
    {id:'save', t:'Save / open', stage:1}]},
  {id:'map', t:'Map Studio', subs:[
    {id:'upload', t:'Upload map', stage:1},{id:'scale', t:'Calibrate scale', stage:1},
    {id:'north', t:'Set north', stage:1},{id:'boundary', t:'Plot boundary', stage:1},
    {id:'rooms', t:'Draw / tag rooms', stage:3},{id:'layers', t:'Layers', stage:3}]},
  {id:'land', t:'Site & Land', subs:[
    {id:'shape', t:'Plot shape', stage:4},{id:'cuts', t:'Cuts & extensions', stage:4},
    {id:'slope', t:'Slope & level', stage:4},{id:'road', t:'Road & T-junctions', stage:4},
    {id:'around', t:'Surroundings', stage:4},{id:'water', t:'Borewell & water source', stage:4},{id:'plants', t:'Plants & landscape', stage:4},
    {id:'soil', t:'Soil', stage:4}]},
  {id:'zone', t:'Zones', subs:[
    {id:'z16', t:'16-zone overlay', stage:1},{id:'z45', t:'9x9 grid (45 devata)', stage:2},
    {id:'zsys', t:'Zone system', stage:3},{id:'brahma', t:'Brahmasthan', stage:2},{id:'elem', t:'Five elements', stage:2},
    {id:'marma', t:'Marma points', stage:5}]},
  {id:'plan', t:'Space Planning', subs:[
    {id:'facingplan', t:'Plan guide by facing', stage:5},{id:'entry', t:'Entrance / main door', stage:5},{id:'rm', t:'Room placement', stage:5},
    {id:'wet', t:'Toilets, tanks, septic', stage:5},{id:'comm', t:'Commercial spaces', stage:6},
    {id:'hosp', t:'Hotel spaces', stage:6}]},
  {id:'mep', t:'MEP', subs:[
    {id:'elec', t:'Electrical', stage:7},{id:'plumb', t:'Plumbing & drainage', stage:7},
    {id:'fire', t:'Fire safety', stage:7},{id:'lift', t:'Lifts & shafts', stage:7},{id:'clear', t:'Clearance checks', stage:7}]},
  {id:'hvac', t:'HVAC', subs:[
    {id:'load', t:'Cooling load', stage:8},{id:'equip', t:'Plant placement', stage:8},
    {id:'air', t:'Fresh air & exhaust', stage:8},{id:'duct', t:'Duct routing', stage:8}]},
  {id:'compare', t:'Vastu vs Engineering', subs:[{id:'cmp', t:'Conflict list', stage:9}]},
  {id:'remedy', t:'Remedies', subs:[{id:'rem', t:'Suggestions', stage:9}]},
  {id:'report', t:'Reports', subs:[
    {id:'score', t:'Score', stage:6},{id:'pdf', t:'PDF report', stage:10},
    {id:'brand', t:'Report branding', stage:10}]},
  {id:'tools', t:'Toolbox', subs:[
    {id:'compass', t:'Compass', stage:3},{id:'maindoor', t:'Main door checker', stage:5},
    {id:'pada', t:'Pada calculator', stage:3},{id:'ayadi', t:'Ayadi calculator', stage:4},{id:'colour', t:'Colour guide', stage:5},
    {id:'region', t:'Region & magnetic declination', stage:4},{id:'cert', t:'Certificate', stage:10}]},
  {id:'lib', t:'Library', subs:[
    {id:'classic', t:'Classical sources', stage:2},{id:'modern', t:'Modern codes', stage:2},
    {id:'rules', t:'Rule library', stage:5},{id:'gloss', t:'Glossary', stage:2},{id:'faq', t:'FAQ', stage:6}]}
];
