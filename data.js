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
