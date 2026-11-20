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

// School 'bs': rules taken from Brihat Samhita Chapter 53 verse 118 (rooms to be built in each direction), as read from
// the published English translation on 2026-11-20. Status 'pageread' = from the page, spot-check against your own copy pending.
const BSV = 'Brihat Samhita 53.118 (published English translation, machine-read 2026-11-20; spot-check pending)';
const RULES_BS = [
  {room:'puja',    prefer:['NE'], accept:[], avoid:[], weight:3, source:BSV+'; room of the gods, north-east', status:'pageread', applies:'*'},
  {room:'kitchen', prefer:['SE'], accept:[], avoid:[], weight:4, source:BSV+'; kitchen, south-east', status:'pageread', applies:'*'},
  {room:'store',   prefer:['SW'], accept:['NW'], avoid:[], weight:1, source:BSV+'; household utensils south-west, granary north-west', status:'pageread', applies:'*'},
  {room:'cash',    prefer:['NW'], accept:[], avoid:[], weight:2, source:BSV+'; treasury, north-west (a cash counter is my reading of treasury)', status:'pageread', applies:'*'}
];
// Main gate squares, Brihat Samhita 53.72-75, source numbering and spelling. tone: good / mixed / bad.
const GATE_BS = {1:['Agni','fire injury','bad'],2:['Parjanya','daughters born','mixed'],3:['Jayanta','great wealth','good'],4:['Indra',"king's friendship",'good'],5:['Surya','rising anger','bad'],6:['Satya','habit of lying','bad'],7:['Bhrisha','cruelty','bad'],8:['Antariksha','theft','bad'],
  9:['Vayu','few sons','bad'],18:['Pusha','servitude','bad'],27:['Vitatha','becoming an outcaste','bad'],36:['Brihatkshata','excess eating, more sons','mixed'],45:['Yama','anger','bad'],54:['Gandharva','ingratitude','bad'],63:['Bhringaraja','poverty','bad'],72:['Mriga','loss of sons and valour','bad'],
  81:['Pitri','sons suffer','bad'],80:['Dauvarika','enemies increase','bad'],79:['Sugriva','wealth and sons lacking','bad'],78:['Kusumadanta','sons, wealth, strength increase','good'],77:['Varuna','opulence','good'],76:['Asura','fear from kings','bad'],75:['Shesha','wealth lost','bad'],74:['Papayakshma','disease','bad'],
  73:['Roga','cruelty; kinsmen increase','mixed'],64:['Ahi','enemies increase','bad'],55:['Mukhya','wealth and sons','good'],46:['Bhallata','all virtues','good'],37:['Soma','sons and wealth','good'],28:['Bhujaga','hatred of sons','bad'],19:['Aditi','women lose character','bad'],10:['Diti','wealth lost','bad']};

// About us. Role, profile text and photo are left empty on purpose: they are filled in by the owners (editor on the About us screen).
const ABOUT = {org:'VastuSutras by Anoopam', people:[
  {id:'a', name:'Anoopam Shukla', role:'Vastu Expert, Author & VastuSense app Developer', tagline:'(AppstroSutras) · Knowledge Banking, Principal Programmer & Logic Developer', bio:'Anoopam Shukla is a Marine Engineer by profession and an astrologer, Vastu researcher and teacher with over three decades of experience in studying and practising these ancient sciences. Well-versed in Digital Astrology, he is also a software developer and LMS expert, integrating technology with traditional knowledge. His approach combines classical wisdom with structured, modern-day applications. His mission is to promote systematic learning, independent thinking and effective predictive system-building, bridging Classical Wisdom with Modern-Day Applications.', photo:'data:image/jpeg;base64,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'},
  {id:'s', name:'Shweta Vijayvarrgiya', role:'Vastu Expert, Numerologist & Energy Healer', tagline:'(NumeroSutras) · Researcher, Quality Assurance & Testing', bio:'Shweta Vijayvarrgiya is a postgraduate in Applied Mathematics, a practising Numerologist, Author, Vastu Consultant and Researcher with over 15 years of professional experience. Her academic foundation in mathematics inspired her early interest in Numerology and Astrology. She is deeply engaged in researching traditional astrological knowledge, particularly South Indian systems, and has guided clients worldwide through Numerology and Vastu consultations. Her approach blends mathematical logic, traditional wisdom and intuitive understanding to promote awareness and harmony.', photo:'data:image/jpeg;base64,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'}]};

// AstroVastu: the common traditional pairing of the eight directions with planets. NOT from any text read for this app:
// shown as 'unverified tradition' and meant to be replaced or confirmed from the owner's own source.
const GRAHA_DIR = {E:'Sun', SE:'Venus', S:'Mars', SW:'Rahu', W:'Saturn', NW:'Moon', N:'Mercury', NE:'Jupiter'};

// AstroVastu framework SUPPLIED BY THE OWNER (not from the texts read for this app; no citation; unverified).
// 12 houses of a North Indian chart laid over 12 of the 16 directional zones with East at the top.
// support / clash: room or item types (from ROOM_ALL) that the framework's wording favours or advises against in that zone.
const ASTRO_HOUSES = [
  {h:1,  z:'E',   el:'Fire / Air',  dom:'Self, health, vitality, standing, new beginnings',
   strong:'Place the main entrance, living room or a morning workspace here to amplify charisma.', weak:'Keep East open, bright and clutter-free; remove heavy storage, dark paint and toilets; use copper or brass sun symbols.', support:['entrance','living'], clash:['store','toilet','bath']},
  {h:2,  z:'ENE', el:'Water / Air', dom:'Accumulated wealth, family harmony, speech, food',
   strong:'Place the family lounge, dining area or joyful artwork here to boost prosperity and family warmth.', weak:'Remove dustbins, toilets and red or fire elements; keep the space fragrant, clean and softly lit.', support:['living','dining'], clash:['toilet','bath']},
  {h:3,  z:'NNE', el:'Water',       dom:'Courage, siblings, communication, recovery, immunity',
   strong:'Ideal for a study desk, communication tools, or storing medicines and herbs.', weak:'Remove kitchen or fire elements and heavy clutter; introduce clean water, green plants and silver or white accents.', support:['study'], clash:['kitchen','store']},
  {h:4,  z:'N',   el:'Water',       dom:'Mother, peace of mind, property, vehicles, luxury',
   strong:'Place the main entrance, cash locker, water feature or home office here for financial and emotional flow.', weak:'Remove the stove or fire, red and yellow walls and heavy blocks; use light blue and white tones and mirrors on the North wall.', support:['entrance','cash','office'], clash:['kitchen']},
  {h:5,  z:'NNW', el:'Water / Air', dom:'Children, education, creativity, romance, speculation',
   strong:'Activate with a creative studio, children\'s play or art space, or a guest room.', weak:'Avoid a long-term master bedroom or stagnant storage; balance with white or silver metals and fresh airflow.', support:['guest','study','kids'], clash:['master','store']},
  {h:6,  z:'WNW', el:'Air',         dom:'Daily service, competition, debts, chronic health, detox',
   strong:'Best zone for washrooms, laundry, or clearing stagnant tasks.', weak:'Never place a bedroom, pooja altar or cash safe here; keep ventilation active and use grey or white tones.', support:['toilet','bath','laundry'], clash:['master','bedroom','puja','cash']},
  {h:7,  z:'W',   el:'Space',       dom:'Marriage, partnerships, contracts, gains',
   strong:'Ideal for the dining room, a cash safe (opening North or East) or a bedroom to stabilise partnerships and profits.', weak:'Avoid underground water tanks, toilets, and green or wooden clutter; keep the West wall solid with silver, white or navy accents.', support:['dining','master','bedroom','cash'], clash:['tank','sump','toilet']},
  {h:8,  z:'WSW', el:'Earth / Space', dom:'Savings, research, deep study, transformation',
   strong:'Best zone for a library, study table, skill mastery or confidential financial records.', weak:'Avoid toilets, the main entrance and red colours; organise books neatly and stabilise with earthy yellow or cream tones.', support:['study'], clash:['toilet','entrance']},
  {h:9,  z:'SSW', el:'Earth',       dom:'Letting go, ancestors, dharmic duty, expenditure',
   strong:'Assign to heavy storage, utility or disposal, or toilets to drain obstacles and wasteful habits.', weak:'Never place the pooja room, study desk or master bed here; keep this corner heavy, closed and grounded in yellow or ochre.', support:['store','toilet'], clash:['puja','study','master']},
  {h:10, z:'S',   el:'Fire',        dom:'Career, authority, fame, government, public action',
   strong:'Place the master bedroom, an executive desk or a recognition wall here to command authority.', weak:'Avoid water tanks, mirrors and blue or black colours; keep the South wall elevated and solid with warm red or terracotta accents.', support:['master','office'], clash:['tank','sump','ohtank']},
  {h:11, z:'SSE', el:'Fire',        dom:'Cash flow, income, networks, desire fulfilment',
   strong:'Ideal for the kitchen, the electrical or power panel, or an active sales or finance desk.', weak:'Remove blue colours, water features and toilets; balance with copper or red elements and active lighting.', support:['kitchen','mpanel'], clash:['toilet','tank','sump']},
  {h:12, z:'ESE', el:'Fire / Air',  dom:'Churning, expenditure, sleep, foreign travel, letting go',
   strong:'Use for active physical work, a churning or prep area, or a short-stay guest room.', weak:'Never place a cash safe, prayer altar or main bedroom here (said to cause anxiety or insomnia); balance with light pastel green or off-white.', support:['guest'], clash:['cash','puja','master']}
];
// House names and natural significators (karakas), from the same owner-supplied framework.
const ASTRO_META = {1:['Lagna',['Sun']],2:['Dhana',['Jupiter','Mercury']],3:['Sahaja',['Mars','Mercury']],4:['Sukha',['Moon','Mercury']],5:['Putra',['Jupiter']],6:['Ripu / Roga',['Mars','Saturn']],
  7:['Kalatra',['Venus','Saturn']],8:['Ayu / Randhra',['Saturn']],9:['Bhagya',['Jupiter','Sun']],10:['Karma',['Sun','Saturn','Mercury']],11:['Labha',['Jupiter']],12:['Vyaya',['Saturn','Ketu']]};
const RASHI = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];

// Five elements and their traditional zone (zone codes resolve via zoneName()).
const ELEMENTS = [
  {k:'Earth', z:'SW'}, {k:'Water', z:'NE'}, {k:'Fire', z:'SE'}, {k:'Air', z:'NW'}, {k:'Space', z:'centre'}
];

// Reference LIST only (titles, author/period where well established). No chapter or verse is quoted:
// each must be checked against the user's own copy before it is cited in a report.
const CLASSICS = [
  {n:"Brihat Samhita", by:"Varahamihira, about 6th century CE", d:"Encyclopaedic text. Its Chapter 53 (On House-building, vastu-vidya) is arranged here by subject, with diagrams drawn from confirmed numbers. Open it to read by subject.",
   sections:[
    {title:"Overview", blocks:[
      {p:"Chapter 53, On House-building (vastu-vidya), English translation by N. Chidambaram Iyer, 1884. The previous chapter is 52 and the next is 54. About 125 verses (counted from the text, not stated in it)."},
      {p:"Each subject tab gives what the source confirms, with diagrams drawn only from confirmed numbers."},
      {table:{title:"Verse map", head:["Verses","Subject","Tab"], rows:[
        ["2-3","Vastupurusha lies face down","Grid and deities"],
        ["4-16","House dimensions by rank and class","Dimensions"],
        ["17-21","Verandahs, vithi","Dimensions"],
        ["22-27","Floor height, walls, entrances, frames","Heights, walls, entrances"],
        ["28-31","Pillar shapes, beams","Heights, walls, entrances"],
        ["42-56","81- and 64-square grids, deities, body parts","Grid and deities"],
        ["57-66","Marma points, buried objects, Brahma's seat","Marma points; Buried objects"],
        ["71-81","Main gate positions and obstructions","Main gate"],
        ["82-83","Entrance rites, corner spirits","Rites, trees, rooms"],
        ["84-91","Corner living, trees, site omens","Rites, trees, rooms"],
        ["92-97","Site and soil tests","Rites, trees, rooms"],
        ["98-111","Groundbreaking, line-drawing, omens","Rites, trees, rooms"],
        ["112-125","First stone, rooms, water, trees, sleeping, closing rites","Rites, trees, rooms"]]}},
      {list:{title:"Chapter topics (summary)", items:["Origin of vastu and the Vastupurusha myth","Dimensions of houses by rank and class","Verandahs, walls, floor height, entrance proportions","Pillar shapes and beam thickness","Named house layouts and their effects","The 81- and 64-square grid and its deities","Vastupurusha body parts and vital points (marmasthala)","Buried-object (shalya) omens","Main gate placement and obstructions","Site and soil selection, ground-preparation rites","Trees, room placement and sleeping customs"]}}]},

    {title:"Dimensions", blocks:[
      {h:"Interactive diagram (cubits, as the source gives them)"},
      {tool:"dims"},
      {table:{title:"What the source confirms, verses 4-13", head:["House for","Breadths (cubits)","Length is breadth plus","Verse"], rows:[
        ["King","108, 100, 92, 84, 76","1/4","4"],
        ["Commander-in-chief","64, 58, 52, 46, 40","1/6","5"],
        ["Prime minister","60, 56, 52, 48, 44","1/8","6"],
        ["Crown prince","80, 74, 68, 62, 56","1/3","7"],
        ["Astrologer, priest (physicians are also named)","40, 36, 32, 28, 24","1/6","10"],
        ["Brahmin class","32, 28, 24, 20, 16 (one shared list for the four classes)","1/10","12, 13"],
        ["Kshatriya class","same shared list","1/8","12, 13"],
        ["Vaishya class","same shared list","1/6","12, 13"],
        ["Shudra class","same shared list","1/4","12, 13"]]}},
      {notes:["Queens' houses are half the prime minister's dimensions (verse 6); younger princes' are half the crown prince's (verse 7).","A house may be made as high as it is broad; with an inner hall its length is twice its breadth (verse 11).","Verse 15: certain mixed classes get half the sum of their class's dimensions. Houses larger or smaller than prescribed are said to bring evil.","Verse 16: no dimensions are given for cow-houses, hermitages, granaries, arsenals and similar; a breadth over 100 cubits is opposed.","Verse 20: the vithi breadth is one-third of the inner-verandah breadth.","The source counts in cubits and digits and defines neither. Verandah and hall widths (verses 17-19) are not loaded because my reading of them was unreliable."]}]},

    {title:"Heights, walls, entrances", blocks:[
      {h:"Entrance frame, schematic (no numbers, because the units are not settled)"},
      {svg:"door", cap:"Verse 25: height is double the width (four classes). Verse 26: side frames and top/bottom frames. Verse 27: thickness."},
      {table:{title:"What the source confirms, verses 22-27", head:["Item","Rule in the source (paraphrase)","Verse"], rows:[
        ["Floor height","breadth / 16 plus 4 cubits; may be one-twelfth less depending on the ground","22"],
        ["Wall thickness","breadth / 16 (burnt brick or wood)","23"],
        ["Entrance, king and commander","height in digits = breadth in cubits + its eleventh part + 70; breadth of entrance = half the height","24"],
        ["Entrance, four classes","breadth = 9/8 x (one-fifth of the house breadth + 18 digits); height = double the breadth","25"],
        ["Side frames","as many digits wide as the number of cubits in the entrance height; top and bottom frames half as much again","26"],
        ["Frame thickness","7 x height, divided by 80","27"],
        ["Pillars (same verse)","bottom diameter = 9 x house height / 80; top is nine-tenths of that","27"]]}},
      {notes:["Verse 28: pillars may be 4-, 8-, 18- or 32-sided (Rucaka, Vajra, Dvivajra, Pralinaka). Verse 30: each higher roof beam is three-fourths as thick as the one below.","Not settled by the source: the unit of the house breadth in verse 25, the digit-to-cubit conversion in verse 26, and which height verse 27 means. No door calculator is built until you confirm them from your own copy."]}]},

    {title:"Grid and deities", blocks:[
      {h:"The 81-square grid, numbered as the source numbers it"},
      {svg:"grid", cap:"Squares are numbered down each column from the north-east corner, east column first. Names are the source's spelling. Outer ring: 32 squares. Inner named squares are those the source numbers (12 of the 13 inner deities, plus Brahma in the centre nine). The other inner squares belong to multi-square deities and are not mapped."},
      {notes:["Verse 42: 81 squares from 10 lines each way; 32 outer and 13 inner deities. Verses 43-45 give the outer ones, 46-49 the inner ones, 50-54 the sides and body parts.","Brahma occupies the nine central squares 31, 32, 33, 40, 41, 42, 49, 50, 51 (verses 46-47).","Verse 48: inner corner squares 11 (Apa), 17 (Savitra), 71 (Jaya), 65 (Rudra). Side squares: Aryaman 23 east, Vivasvan 43 south, Mitra 59 west, Prithvidhara 39 north (one verse gives 33 for the north square). Ring squares: Apavatsa 21, Savita 25, Indra 61, Rajayakshma 57.","Verses 55-56: a 64-square division is also described; its central four squares are held by Brahma.","Verse 83: four women spirits stand outside the grid at the corners: Caraki north-east, Vidari south-east, Putana south-west, Rakshasi north-west.","The source's corner names (Agni at square 1, Vayu at 9, Pitri at 81, Roga at 73) differ from the usual drawing, and the compass placement is drawn from the numbering the source's squares imply. Treat the corners as unconfirmed until you check your own copy. For this reason the 45-deity positions are not built into the Zones grid."]}]},

    {title:"Main gate", blocks:[
      {h:"Gate results on the outer ring (source numbering)"},
      {svg:"gate", cap:"Green: good result in the source (Jayanta, Indra, Kusumadanta, Varuna, Mukhya, Bhallata, Soma). Amber: mixed (Parjanya, Brihatkshata). Red: bad result."},
      {table:{title:"Verses 72-75, source numbering and spelling", head:["Wall (verse)","Square","Deity","Result for a gate (paraphrase)"], rows:[
        ["East (72)","1","Agni","fire injury"],["East (72)","2","Parjanya","daughters born"],["East (72)","3","Jayanta","great wealth"],["East (72)","4","Indra","king's friendship"],
        ["East (72)","5","Surya","rising anger"],["East (72)","6","Satya","habit of lying"],["East (72)","7","Bhrisha","cruelty"],["East (72)","8","Antariksha","theft"],
        ["South (73)","9","Vayu","few sons"],["South (73)","18","Pusha","servitude"],["South (73)","27","Vitatha","becoming an outcaste"],["South (73)","36","Brihatkshata","excess eating, more sons"],
        ["South (73)","45","Yama","anger"],["South (73)","54","Gandharva","ingratitude"],["South (73)","63","Bhringaraja","poverty"],["South (73)","72","Mriga","loss of sons and valour"],
        ["West (74)","81","Pitri","sons suffer"],["West (74)","80","Dauvarika","enemies increase"],["West (74)","79","Sugriva","wealth and sons lacking"],["West (74)","78","Kusumadanta","sons, wealth, strength increase"],
        ["West (74)","77","Varuna","opulence"],["West (74)","76","Asura","fear from kings"],["West (74)","75","Shesha","wealth lost"],["West (74)","74","Papayakshma","disease"],
        ["North (75)","73","Roga","cruelty; kinsmen increase"],["North (75)","64","Ahi","enemies increase"],["North (75)","55","Mukhya","wealth and sons"],["North (75)","46","Bhallata","all virtues"],
        ["North (75)","37","Soma","sons and wealth"],["North (75)","28","Bhujaga","hatred of sons"],["North (75)","19","Aditi","women lose character"],["North (75)","10","Diti","wealth lost"]]}},
      {notes:["Verse 71 introduces eight gate squares per side; verses 72-75 give the four sides. The source does not call any position 'favourable' in so many words.","Verses 76-81: obstructions opposite the gate do no harm beyond twice the house height (verse 76); the other gate defects are listed in the following verses.","These squares are not yet mapped to compass directions in the Main door checker, because the source's corner names differ from the usual drawing."]}]},

    {title:"Marma points", blocks:[
      {h:"The six lines and their crossings"},
      {svg:"marma", cap:"The six lines are those the source lists in verse 63 (squares 73-9, 81-1, 27-75, 55-7, 3-63, 19-79). Dots mark where they cross."},
      {h:"Body parts the source names"},
      {svg:"body", cap:"Squares whose deities the source links to body parts (verses 51-54)."},
      {notes:["Verse 57: the exact centres of the squares are marmasthalas, not to be pressed by pillars or other erections.","Verse 58: if the vital spots are defiled by impure substances, nails, pegs, pillars or buried objects (shalya), the owner suffers in the matching body part.","Verses 63-64: six lines (vamsha) cut in nine points called Atimarma; the area of a marmasthala is one-eighth of a square.","Verse 65: the vamsha breadth in digits equals the side of the square in yards; a sira is one and a half times the vamsha breadth.","Verse 66: defiling Brahma's seat brings misery to the owner.","The source does not say which crossings are the nine Atimarma points; drawn here, the six lines cross at nine points.","Derivation, not source text: taking the named squares' centres as the line ends, the nine crossings fall exactly at the centres of squares 31, 33, 41, 49 and 51 (the centre and corners of Brahma's nine) and 23, 39, 43 and 59 (the squares of Aryaman, Prithvidhara, Vivasvan and Mitra). If the lines were drawn between wall midpoints or corners instead, the points would move; the source does not say which."]}]},

    {title:"Buried objects", blocks:[
      {table:{title:"Verses 58-62 and 105-109", head:["Buried object","Effect in the source (paraphrase)","Verse"], rows:[
        ["Wood","loss of wealth","60"],["Bones","animals suffer; much disease","60"],["Metals (general)","injury from weapons","60"],["Skulls or hair","death","60"],
        ["Charcoal","fear of robbery","61"],["Ashes","constant fear of destructive fires","61"],["Anything other than gold or silver at a marma point","great fears","61"],
        ["Paddy husk","gain of wealth","61"],["Snake teeth at a marma point","misery","61"]]}},
      {notes:["Location: the object lies under the part of the ground matching the body part the owner scratched on first entering the plot, or where bad fire omens occur during the fire ceremony (verse 59).","Verses 105-108: harsh bird calls facing the sun, or certain animals heard, or an ass crying or a dog or jackal crossing the rope at line-drawing, point to buried bones at the matching spot. Verse 109: melodious birds facing away from the sun point to treasure."]}]},

    {title:"Rites, trees, rooms", blocks:[
      {h:"Trees on the four sides of the house (verse 85)"},
      {svg:"trees", cap:"Green: the source's good side for each tree. Red: its bad side."},
      {list:{title:"What the source covers in verses 82-125 (summary)", items:["82-83: entrance with water-pots, fruits, flowers, curdled milk; four corner spirits","84: living in house corners brings misery to most; dog-flesh eaters and outcastes prosper there","85-87: tree directions; thorny trees (fear of enemies), milky trees (waste of wealth) and fruit trees (children die) near the house; if they cannot be removed, plant superior trees between (punnaga, asoka, arista, bakula, panasa, shami, shala)","88-91: site omens (a minister's house, a cheat's house, a temple, crossroads, a Buddhist temple, an anthill, low ground, a tortoise shape); low sides harm particular classes","92-97: refilled-pit, water-walk, lamp and flower tests; ground colour, smell, taste","98-104: groundbreaking at an astrologer's hour; puja; lines drawn with the thumb, middle or forefinger while holding gold, gems, silver, pearls, curdled milk, flowers, fruits or coloured rice; a weapon means death by weapons, a piece of metal means imprisonment; right-to-left lines mean enmity","105-111: bird, animal, rope, peg and water-pot omens for bones, treasure, death or disease","112-114: first foundation stone in the north-east, then left to right; entrance pillars; bird omens like the Indra flag","115-117: a raised north-east corner, bad smell, irregular shape or a high side each bring harm; raise the ground evenly","118: rooms: north-east for the gods, south-east kitchen, south-west household utensils, north-west treasury and granary","119: water in each of the eight directions gives a particular outcome","120-123: which trees not to fell; rice and puja at night; fell next day; the fall direction and cut colour decide","124: sleeping rules; 125: closing puja and entry with Vedic chanting"]}}]},

    {title:"About these notes", blocks:[
      {notes:["All numbers were read from a machine-extracted copy of the translation on 2026-11-20. Spot-check each against your own copy before citing it in a report.","Short paraphrases only; no verse text is reproduced.","Compass placement in the diagrams follows the numbering implied by the source's squares, with north-east as square 1. The source's corner deity names differ from the usual drawing, so treat corners as unconfirmed.","Not covered: Chapter 54 and later chapters, other books, and Vastu rules that do not come from this chapter."]}]}
   ]},
  {n:"Mayamata", by:"attributed to Maya, about 10th-11th century CE (the sources read give no date or attribution)", d:"South Indian treatise on architecture, town and house planning. Open it to read by subject. Built from a published study of the text: the sources read cover mainly the construction of houses, especially the three- and four-winged types.",
   sections:[
    {title:"Overview", blocks:[
      {p:"An ancient Indian treatise on building construction, in the stream of literature on vastuvidya: village and town planning, temple architecture, site selection, orientation and structure. Modern editions and studies, including a two-volume edition with a study, are the sources the published study uses."},
      {p:"The sources read do not state the text's attribution, tradition, date, language or number of chapters. They quote it by chapter and verse, for example chapter 26 (houses with wings), and cross-refer to chapters 19 to 22 (decoration), 27 and 29."},
      ]},

    {title:"Subjects covered", blocks:[
      {p:"This is the study's own outline of the construction of a building (its parts), not the text's list of chapters."},
      {table:{head:["Part","Subject"], rows:[
        ["1","Base (adhisthana): ground preparation, projection, classes"],
        ["2","Storeys and their dimensions"],
        ["3","Joinery (sandhikarma): classes of joint, faults, horizontal joinery"],
        ["4","Roofs, rafters, porch-gable decoration, finial"],
        ["5","Socle (upapitha)"],
        ["6","Entablature: architrave, braces, consoles, cornice, struts, latticed windows"],
        ["7","House types by number of main buildings: one, two, three, four, seven, ten"],
        ["8","Enclosure walls, layout of the house, pavilions, central platform, pillar materials, veranda, master chamber, roofing"],
        ["9","Doors: jambs, leaves, good and bad doors, door position, gateways"],
        ["10","First entry into a house: preliminary rites, vases, offerings, the architect's departure"]]}}]},

    {title:"Four-winged houses", blocks:[
      {p:"A four-winged house (catushala) is a house of four main buildings around a central court. The study says widths run from 9 to about 65 cubits in steps of 2, giving 29 widths, of which the first 14 have an uncovered central court. It names five types although it says 'four'."},
      {table:{title:"The five types as the study describes them", head:["Type","Entrances and features","Parts of the width","Suits"], rows:[
        ["Sarvatobhadra ('good on all sides')","Four doors; five variants; four corner rooms, a gallery on each side; eight gables; a five-storey, many-dome house of about 26 cubits is described in the other book; master's room east or west","8 parts: central 2 = court, half a part for the passage","kings"],
        ["Vardhamana ('increasing')","Seven variants; successive verandahs; no south entrance (other book 53.33); spiral staircase; one to three storeys; no north door for a king's house","6 parts: 2 buildings, 2 court","not stated"],
        ["Nandyavarta","No west door (other book 53.32; also another text); doors on each side except a king's house has no north door; latticed shutters both faces; up to three storeys","6 parts: 2 court, 2 main block","all four classes; east-facing for the third and fourth classes"],
        ["Svastika ('cross')","Verandahs around an eastern entrance (other book 53.34); side square blocks (karkarisala); second variant with wagon, hipped or flat roofs","6 parts; second variant 12, 14 or 18 parts","east-facing for the third and fourth classes"],
        ["Rucaka","Verandahs at the east and west ends (other book 53.35); ridge beams that do not cross; corner stairs; no north door","not stated","all classes"]]},
        notes:["'Other book' is the Brihat Samhita as cited by the study. Its numbers (53.32 to 53.35) follow the study's edition and may differ from the translation used elsewhere in this app.","The study explains some choices (no north door for a king, east for the third and fourth classes) by the directions of Kubera, Yama, Surya and Indra. Those are the study's explanations, not the text's."]}]},

    {title:"Three-winged houses", blocks:[
      {table:{head:["Type","Layout"], rows:[
        ["Merukanta","Width in 8 parts and length in 10; a central court surrounded on three sides by main blocks; suits people in harsh or violent trades"],
        ["Maulibhadra","Width in 10 parts and length in 12; four gables; a front porch; a central court of two parts"]]}},
      {notes:["Both are cited from chapter 26 of the Mayamata. The other three-winged types are not given in the sources read."]}]},

    {title:"Terms", blocks:[
      {table:{head:["Term","Meaning"], rows:[
        ["Sala","A house or main building; catushala is a house of four"],["Sarvatobhadra","'Good on all sides'; a four-faced building"],["Vardhamana","'Increasing'; a house with successive verandahs"],
        ["Nandyavarta","A named house type; no west door in the Brihat Samhita"],["Svastika","A cross-shaped plan"],["Rucaka","A type with ridge beams that do not cross"],
        ["Alinda","Verandah"],["Kuta","A small loggia or gallery"],["Kulyabhadvara","A vaulted door in a partition wall"],["Jalaka","Latticed shutter"],["Kabata","Plain shutter"],
        ["Bhadra","A face or aspect of a building"],["Salakara, Sabhakara, Harmyanga","Wagon roof, hipped roof, flat roof"],["Torana","An arch or arcature"],["Karkarisala","A side square block on a svastika house"],
        ["Ajangana","The central court of the Merukanta type"],["Sankhavarta","A spiral staircase"],["Hasta","Cubit, the unit of width used throughout"]]}}]},

    {title:"About these notes", blocks:[
      {notes:["Built on 2026-11-20 from a published study of the text, read through a tool that returns a machine-extracted copy. Only the section on three- and four-winged houses was read in full.","Everything is a short paraphrase in my own words; no passages are reproduced.","Verse numbers are as the study cites them for its own edition.","Nothing here has been checked against the Sanskrit. Spot-check against your own copy before citing."]}]}
   ]},
  {n:'Manasara', by:'date uncertain', d:'Shilpa-tradition text on measurement, building types and planning.'},
  {n:"Samarangana Sutradhara", by:"ascribed to King Bhoja; date not stated in the summary read (commonly placed about the 11th century CE)", d:"Large Sanskrit treatise on architecture and related arts. Open it to read by subject. Built from a published English summary: most chapters are known by title only, and no measurements or grids are stated in the sources read.",
   sections:[
    {title:"Overview", blocks:[
      {p:"A Sanskrit treatise in verse on vastu-shastra (architecture). It is ascribed to a king noted for supporting art and literature. Besides architecture it covers iconography, arts and crafts, the theory of creation, and geography."},
      {p:"These notes come from an English summary of the work, not from the Sanskrit. The summary's chapter numbers differ from the original's (for example, its chapter 18 is the original's chapter 10). Where a chapter is marked 'title only', I could read only its title, and my words describe the title, not the chapter."},
      {table:{title:"Structure as the summary's introduction describes it (original numbering)", head:["Part","What it covers"], rows:[
        ["First 48 chapters (and chapter 51)","Town planning, house building, and machines"],
        ["Next twenty chapters","Temples"],
        ["Last fourteen chapters (70 to 83)","Iconography and painting: eight on sculpture, six on painting"]]}},
      {svg:"ssBook", cap:"Counts are the introduction's: the first 48 chapters and chapter 51 (49 in all), then twenty on temples, then fourteen on images and painting."},
      {list:{title:"Points the introduction makes", items:["The original has 83 chapters; the summary's index runs to 84 entries.","For comparison it mentions another treatise with 70 chapters (8 introductory, 42 on architecture, 20 on sculpture).","The three familiar temple styles are Nagara, Dravida and Vesara; this text is said to add two more, Bhumija and Lata.","Its list of machines (yantras) includes pleasure machines, toy machines, war machines, door-keeper and soldier machines, water and shower machines, swings, and wooden flying machines."]}}]},

    {title:"Chapters", blocks:[
      {p:"Chapter numbers follow the summary's index. The index does not list chapters 11 to 16 or 19."},
      {table:{head:["No.","Title","What it covers","Basis"], rows:[
        ["1","The Advent of Earth (Mahasamagamana)","Earth complains to Brahma about a king; Brahma gives the planning task to Vishvakarma, who reaches the Himalaya, tied to the northern (Nagara) style","read in detail"],
        ["2","Dialogue between father and sons","A teaching exchange between Vishvakarma and his sons","title only"],
        ["3","The query (Prashna)","A question-and-answer opening to the technical matter","title only"],
        ["4","Creation (Mahadadisarga)","Cosmogony","title only"],
        ["5","Geography (Bhuvanakosha)","World and regional geography","title only"],
        ["6","Men in the company of gods","Unclear from the title; probably the place of people beside the divine","title only"],
        ["7","Division of society by varna and ashrama","Social classes and life stages as they bear on building","title only"],
        ["8","Qualifications of an architect (Sthapati-lakshana)","What an architect must be","title only"],
        ["9","Eightfold limbs of vastu-shastra","The eight parts of the science","title only"],
        ["10","Selection of the site (Bhuparikshana)","Soil and site testing","title only"],
        ["17","Towns and their categories","Kinds of towns","title only"],
        ["18","Town planning (Puranivesha)","Layout with ramparts, moats, gates, roads, quarters by caste and trade, and temples","read in detail"],
        ["20","Offerings (Balidana)","Offerings","title only"],
        ["21","The altar (Vedi-lakshana)","Altar characteristics","title only"],
        ["22","Indra's flag (Indradhvaja)","A ritual flag","title only"],
        ["23","Foundation-laying ceremony (Shilanyasa)","Laying the foundation stone","title only"],
        ["24","First operations (Kilaka-sutrapata)","Staking and laying out the cord","title only"],
        ["25","Measurement of the pedestal (Pithamana)","Pedestal measures","title only"],
        ["26","Planning of a royal palace (Rajanivesha)","Palace planning","title only"],
        ["27","Types of palaces (Rajagriha)","Residential and pleasure palaces","title only"],
        ["28","Assembly hall (Sabha)","Assembly halls","title only"],
        ["29","Stables for elephants (Gajashala)","Elephant stables","title only"],
        ["30","Stables for horses (Ashvashala)","Horse stables","title only"],
        ["31","Shrines (Ayatana-nivesha)","Shrines for royal and noble households","title only"],
        ["32-36","Architecture of the sala-houses","Classes of houses","title only"],
        ["37","Declivity and similar (Nimnocca-adi-phala)","Effects of slope and ground features","title only"],
        ["38","Door-platform and wall measures","Measures of door platforms and walls","title only"],
        ["39","Entry into the forest (Vanapravesha)","Entering the forest (for timber)","title only"],
        ["40","Proportions and parts of the house","Proportions and components","title only"],
        ["41","The door, its merits and demerits (Dvara-gunadosha)","Good and bad doors","title only"],
        ["42","Masonry (Chaya-vidhi)","Building in brick or stone","title only"],
        ["43","Decorating rules","What may and may not be used","title only"],
        ["44","Effects of a door break","Results of a broken door","title only"],
        ["45","Rebuilding a broken torana","Propitiation after damage to a gateway","title only"],
        ["46","Defects of the house","House defects","title only"],
        ["47","Propitiatory measures (Shantika-vidhi)","Rites to remove defects","title only"],
        ["48","Machines (Yantra-adhyaya)","Mechanical devices","title only"],
        ["49","Couches and cots","Furniture for sleeping and sitting","title only"],
        ["50-52","Rucaka and the 64 temples; their genealogy; details","Groups of temples (prasada)","title only"],
        ["53-54","Further details of the prasadas","Temple details","title only"],
        ["55","Rucaka and the group of 64 temples","A group of 64 temples","title only"],
        ["56","Dedication of temples","Dedication","title only"],
        ["57","Vimana and 65 temples","A group of 65 temples","title only"],
        ["58","Meru and 16 temples","A group of 16 temples","title only"],
        ["59","Shridhara and 40 temples of the pure type","A group of 40 temples","title only"],
        ["60","Meru and 20 temples","A group of 20 temples","title only"],
        ["61","Twenty Nagara temples","Northern-style temples","title only"],
        ["62","36 temples beginning with Shrikuta","A group of 36 temples","title only"],
        ["63-64","Five-fold terraces and the Dravida temple","Terraces; southern-style temple","title only"],
        ["65","Vavata style (Digbhadra)","A further style","title only"],
        ["66","Bhumija temple","The Bhumija style","title only"],
        ["67-68","Pavilions (mandapa) of temples","Halls attached to temples","title only"],
        ["69-70","Terraces (jagati) and terrace-temples","Raised platforms and temples on them","title only"],
        ["71","Iconography of the linga and pedestals","Linga images and bases","title only"],
        ["72","Gods, goddesses, forms and hand-held objects","Divine forms and attributes","title only"],
        ["73","Characteristics of images (Pratima-lakshana)","Image rules","title only"],
        ["74","Defects and merits of images","Good and bad images","title only"],
        ["75","Five-fold men and women","Classes of human types","title only"],
        ["76-78","Three broad groups of poses and postures","Poses and gestures (mudra)","title only"],
        ["79","Painting essentials (Chitra-uddesha)","The basics of painting","title only"],
        ["80","Backgrounds (Bhumibandha)","Painting grounds","title only"],
        ["81","Paints, plasters and brushes","Materials for painting","title only"],
        ["82","Measurements of andakas","Measures for forms","title only"],
        ["83","Measurements and forms (Mana-utpatti)","Origin of measures","title only"],
        ["84","Rasas and rasa-drishti","Aesthetic sentiment and its sight","title only"]]}}]},

    {title:"By theme", blocks:[
      {table:{head:["Theme","Chapters (summary numbering)"], rows:[
        ["Creation, cosmology, origins","1 to 4"],
        ["Geography and social setting","5 to 7"],
        ["The architect and the scope of the science","8, 9"],
        ["Land and site","10, 37, 39"],
        ["Ritual and foundation","20 to 25, 45, 47, 56"],
        ["Town planning","17, 18"],
        ["Houses and domestic buildings","32 to 36, 40 to 44, 46"],
        ["Palaces and royal buildings","26 to 31"],
        ["Machines and furniture","48, 49"],
        ["Temples","50 to 70 (styles 61 to 66; pavilions and terraces 67 to 70)"],
        ["Iconography and sculpture","71 to 75; poses 76 to 78"],
        ["Painting and aesthetics","79 to 82; rasa 84"],
        ["Measures","spread over 9, 25, 38, 40, 42, 82, 83"]]}},
      {svg:"ssMap", cap:"Each square is a chapter of the summary, coloured by theme. Chapters 11 to 16 and 19 are not listed in the summary and are left grey. Placement follows chapter titles only."}]},

    {title:"Origins and the architect", blocks:[
      {h:"Chapter 1 (read in detail)"},
      {p:"The earth goes to Brahma with a complaint about a king. Brahma hands the planning of the world to the divine architect Vishvakarma, who comes to the Himalaya. The text ties this to the northern (Nagara) style."},
      {notes:["Chapters 2 to 9 are known by title only: a teaching dialogue, a question-and-answer opening, creation, geography, the place of people beside the gods, society by class and life stage, the qualities of an architect, and the eight limbs of the science."]}]},

    {title:"Site, town and houses", blocks:[
      {h:"Chapter 18, town planning (read in detail)"},
      {p:"The town is laid out with ramparts, moats, gates and roads. Quarters are set aside by caste and trade, and temples have their places. The summary says the detail is given in a separate study."},
      {svg:"ssTown", cap:"Schematic only. It shows the elements the summary names: moat, rampart, gates, roads, quarters by caste and trade, and temples. The summary gives no dimensions, number of gates or directions, so none are drawn."},
      {notes:["Land and site: chapter 10 (site and soil testing) and chapter 37 (effects of slope and ground features) are title only.","Foundation and setting out: chapters 23 to 25 (foundation stone, staking and cord, pedestal measure) are title only.","Houses: chapters 32 to 36 (classes of sala-houses), 40 (proportions), 41 (good and bad doors), 42 (masonry), 43 (decoration rules), 44 (results of a door break), 46 (house defects) are title only.","Remedies: chapters 45 (rebuilding a broken gateway, with propitiation) and 47 (propitiatory measures) exist, but the sources read do not state what the measures are."]}]},

    {title:"Palaces and royal buildings", blocks:[
      {notes:["Chapters 26 to 31, all title only: planning of a royal palace, types of palaces (residential and pleasure), assembly halls, elephant stables, horse stables, and shrines for royal and noble households.","The introduction cites original chapter numbers for several of these (for example, the royal palace as 15, the assembly hall as 27, elephant and horse stables as 32 and 33, shrines as 51)."]}]},

    {title:"Temples", blocks:[
      {p:"Chapters 50 to 70 deal with temples (prasada), with pavilions (mandapa) and terraces (jagati). Temple groups are named by count in the chapter titles."},
      {table:{head:["Chapters","Group"], rows:[
        ["55","64 temples (Rucaka and others)"],["57","65 temples (Vimana and others)"],["58","16 temples (Meru and others)"],["59","40 temples of the pure type"],
        ["60","20 temples (Meru and others)"],["61","20 Nagara temples"],["62","36 temples (Shrikuta and others)"],["63-64","Terraces; Dravida temple"],["65","Vavata style"],["66","Bhumija style"],["67-70","Pavilions; terraces; terrace-temples"]]}},
      {svg:"ssTemples", cap:"Counts come from the chapter titles only; the chapters themselves were not read."},
      {notes:["The introduction says the author adds two styles, Bhumija and Lata, to the three familiar ones (Nagara, Dravida, Vesara). Every temple chapter is title only here; no dimensions or grids are stated in the sources read."]}]},

    {title:"Machines, images and painting", blocks:[
      {notes:["Chapter 48 (machines) is title only. The introduction lists pleasure machines, toy machines, war machines, door-keeper and soldier machines, water and shower machines, swings, and wooden flying machines (vimana-yantra).","Chapter 49 covers couches and cots.","Chapters 71 to 78: the linga and pedestals, gods and goddesses with their forms and attributes, image characteristics, good and bad images, five-fold human types, and three broad groups of poses and gestures.","Chapters 79 to 82: painting essentials, backgrounds, paints, plasters and brushes, and measures of forms. Chapter 83 covers the origin of measures and chapter 84 aesthetic sentiment (rasa)."]}]},

    {title:"Terms", blocks:[
      {table:{head:["Term","Meaning"], rows:[
        ["Vastu-shastra / Shilpa-shastra","The science of architecture, with its wider arts"],
        ["Prasada","A temple, the central shrine"],["Mandapa","A pavilion attached to a temple"],["Jagati","A raised terrace or platform"],
        ["Sabha","An assembly hall"],["Sala","A class of houses"],["Puranivesha","Town planning"],
        ["Kilaka-sutrapata","First setting out with stake and cord"],["Shilanyasa","Foundation-laying ceremony"],["Pithamana","Measure of a pedestal"],
        ["Yantra","A mechanical device"],["Chitra","Painting"],["Mudra","A pose or gesture of hand or body"],
        ["Pratima-lakshana","Characteristics of images"],["Rasa-drishti","Aesthetic sight; rasa theory"],
        ["Nagara, Dravida, Vavata, Bhumija, Lata","Temple style groups"],["Hasta-lakshana","System of measure by hand-units, as the introduction describes it"],
        ["Bhuparikshana","Soil and site examination"],["Vedha, Bhanga","Harmful influence or defect in building"],["Varna, Ashrama","Social class and life stage"],["Torana","A decorative gateway or arch"]]}}]},

        {title:"From more reading", blocks:[
      {p:"Further reading on construction, masonry, machines, house defects and the surviving monuments. The summary gives chapter titles only, so the details below are reported, not yet checked against the text. Chapter numbers differ between sources; where a summary title matches, it is noted."},
      {table:{title:"Walls, doors, columns and joinery", head:["Subject","Reported detail","Status"], rows:[
        ["Chapters on door-platform and wall measures, and on the proportions and parts of a house","Listed as chapters 38 and 40 of the summary","Chapter in summary (title only)"],
        ["Plinth and wall thickness","Plinth one-twelfth to one-sixteenth of the breadth; wall one-sixteenth (lighter walls one-eighteenth to one-twentieth); upper walls reduced by one-twelfth; partitions half to two-thirds of the outer wall","Reported, not yet checked. Brihat Samhita gives wall = breadth / 16 (verse 23)"],
        ["Door proportions","Height twice the width; larger portals 9:4","Partly: twice the width is in Brihat Samhita verse 25 (four classes); 9:4 not checked"],
        ["Door frame members","Jamb faces, sill 1.25 to 1.5 times the jamb, lintel with ear-projections, leaves with locking bars, 3, 5, 7 or 9 facets","Reported, not yet checked. Brihat Samhita has top and bottom frames half as wide again as the side frames (verse 26)"],
        ["Columns and beams","Column base one-eighth to one-tenth of its height, tapering to three-quarters; beam as wide as the column top; bracket arm three times the shaft top (verse 28.35)","Reported, not yet checked"],
        ["Timber joinery","Pegs, tenons, scarf joints, half-lap joints, rafter framing","Reported, not yet checked"]]}},
      {table:{title:"Masonry and foundations", head:["Subject","Reported detail","Status"], rows:[
        ["Chapters on masonry (Chaya-vidhi) and on laying the foundation stone","Listed as chapters 42 and 23 of the summary","Chapter in summary (title only)"],
        ["Bricks","Ratio 4:2:1; large, medium and small sizes in finger-widths; firing and quality tests","Reported, not yet checked"],
        ["Foundation layers","Firm soil, rubble, sand, charcoal and crushed brick, stepped footings; depth one-third to one-quarter of the wall height","Reported, not yet checked"],
        ["Foundation stones","Four, eight or nine stones laid first in the north-east, then clockwise","Reported, not yet checked"],
        ["Bonding","Broken joints, alternating header and stretcher courses, cord and plumb checks, thin lime mortar","Reported, not yet checked"]]}},
      {table:{title:"Machines and water pavilions", head:["Subject","Reported detail","Status"], rows:[
        ["A chapter on machines","Listed as chapter 48 of the summary","Chapter in summary (title only)"],
        ["Kinds of machine","Pleasure, toy, war, door-keeper, water and flying machines","From the summary's introduction"],
        ["Motive powers","Earth, water, fire and air, with mercury as a special driver","Reported, not yet checked"],
        ["Water pavilions","Five kinds, including one named Nandyavarta and a sunken chamber under a lake","Reported, not yet checked"],
        ["Automata and instruments","Guards, serving figures, dancing birds, water clocks, celestial spheres, trapdoors, catapults","Reported, not yet checked"],
        ["Withheld designs","Verse 31.79 is said to withhold secret defence designs","Reported, not yet checked"]]}},
      {table:{title:"House defects", head:["Subject","Reported detail","Status"], rows:[
        ["Chapters on house defects and on propitiatory measures","Listed as chapters 46 and 47 of the summary","Chapter in summary (title only)"],
        ["A chapter on the effects of slopes","Listed as chapter 37 of the summary","Chapter in summary (title only)"],
        ["Slopes","South-east fire, south death, south-west illness, west loss of grain, north-west quarrels, a hollow centre ruin","Reported, not yet checked"],
        ["Ground and axes","Bad subsoil (bones, ash, charcoal and so on); a house turned off the cardinal axes","Reported, not yet checked. Brihat Samhita has buried objects, verses 58-62"],
        ["Walls and roofs","Uneven wall heights, leaning walls, cut corners, piercing marma points, faulty ridge beams and rafters, roof drainage","Reported, not yet checked"],
        ["Doors","Self-opening or self-closing leaves, wrong size, warped frame, an inner door bigger than the main gate; a chapter on door breaks is listed as chapter 44","Reported, not yet checked"],
        ["Obstruction in front of the gate","Within twice the door height","Reported, not yet checked. Brihat Samhita says obstructions beyond twice the house height do no harm (verse 76), a different measure"]]}},
      {table:{title:"Surviving monuments", head:["Subject","Reported detail","Status"], rows:[
        ["Dams at Bhojpur, engraved temple drawings, water pavilions at Mandu, lime mortars","Said to match the book's rules","Reported, not yet checked. History and archaeology; not used by this app"]]}}]},
{title:"About these notes", blocks:[
      {notes:["Built on 2026-11-20 from a published English summary of the text, read through a tool that returns a machine-extracted copy. Two chapters were read in detail; the rest are known by title only.","Everything is a short paraphrase in my own words; no passages are reproduced.","Chapter numbers follow the summary's index and differ from the original's.","Nothing here has been checked against the Sanskrit or an edition. Spot-check against your own copy before citing."]}]}
   ]},
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
    {id:'alloc', t:'Allocate spaces', stage:1},{id:'draw', t:'Draw & annotate', stage:1},{id:'rooms', t:'Draw / tag rooms', stage:3},{id:'layers', t:'Layers', stage:3}]},
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
  {id:'astro', t:'AstroVastu', subs:[
    {id:'birth', t:'Birth details', stage:1},{id:'graha', t:'Planets and directions', stage:1},
    {id:'houses', t:'Chart houses (manual)', stage:1},{id:'audit', t:'Astro-Vastu audit', stage:1},
    {id:'chart', t:'Birth chart', stage:11},{id:'muhurta', t:'Muhurta (auspicious time)', stage:11},{id:'match', t:'Owner and plot match', stage:11}]},
  {id:'tools', t:'Toolbox', subs:[
    {id:'compass', t:'Compass', stage:3},{id:'maindoor', t:'Main door checker', stage:5},
    {id:'pada', t:'Pada calculator', stage:3},{id:'ayadi', t:'Ayadi calculator', stage:4},{id:'colour', t:'Colour guide', stage:5},
    {id:'region', t:'Region & magnetic declination', stage:4},{id:'cert', t:'Certificate', stage:10}]},
  {id:'lib', t:'Library', subs:[
    {id:'classic', t:'Classical sources', stage:2},{id:'modern', t:'Modern codes', stage:2},
    {id:'rules', t:'Rule library', stage:5},{id:'gloss', t:'Glossary', stage:2},{id:'faq', t:'FAQ', stage:6}]},
  {id:'about', t:'About us', subs:[{id:'us', t:'About us', stage:1}]}
];
