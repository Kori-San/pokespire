// Pokespire — GBA-era data
// Original creatures + world. Full-color pixel art, not GameBoy DMG.

// ─── PALETTE TOKENS ──────────────────────────────────────────
window.PAL = {
  // UI textbox chrome (Emerald/FireRed era)
  boxBg:      '#f8f8f8',
  boxBgAlt:   '#e8eef8',
  boxBorder:  '#283058',
  boxBorderHi:'#5878a8',
  boxBorderLo:'#101830',
  textDark:   '#282838',
  textMid:    '#585878',
  textLight:  '#f8f8f8',

  // Sky / ground
  skyTop:     '#7cc4ec',
  skyBot:     '#bfe4f8',
  skyHorizon: '#fdd9b5',
  grass:      '#74c850',
  grassDark:  '#3c8c34',
  grassLight: '#a8e070',
  earth:      '#c89460',
  earthDark:  '#8c5028',
  platform:   '#d0a06c',
  platformDk: '#8c5828',

  // HP bar tiers
  hpHigh:     '#58d048',
  hpMid:      '#f8c020',
  hpLow:      '#e84050',
  hpBg:       '#383850',
};

// ─── TYPE SYSTEM ─────────────────────────────────────────────
// 6 elemental types + NORMAL. Each has primary + dark border + light.
window.TYPES = {
  EMBER:  { name:'EMBER',  glyph:'◆', primary:'#ef6f4a', dark:'#8c2810', light:'#fcb888' },
  TIDE:   { name:'TIDE',   glyph:'◉', primary:'#4f8cd6', dark:'#1c3c78', light:'#a8c8ec' },
  FLORA:  { name:'FLORA',  glyph:'✿', primary:'#6cbf48', dark:'#2c6428', light:'#b8e090' },
  SPARK:  { name:'SPARK',  glyph:'✦', primary:'#f5c424', dark:'#8c6018', light:'#fce478' },
  MIND:   { name:'MIND',   glyph:'◈', primary:'#d96aa8', dark:'#742c5c', light:'#f0a8d0' },
  UMBRA:  { name:'UMBRA',  glyph:'◐', primary:'#6a5a8a', dark:'#322848', light:'#b0a4c8' },
  NORMAL: { name:'NORMAL', glyph:'○', primary:'#a89c84', dark:'#54483c', light:'#d4c8b0' },
};

// ─── CREATURES (original) ────────────────────────────────────
// Each has a 6-stop palette: [transparent, outline, shadow, body, light, accent]
// Sprite chars 0-5 map to palette indices.
window.CREATURES = {
  emberling: {
    id:'emberling', name:'EMBERLING', type:'EMBER',
    hp: 28, dex:'#001',
    blurb:'A pup of cinders. Sneezes spark on cold mornings.',
    palette: [null, '#5a1a08', '#c44820', '#ef6f4a', '#fce070', '#fff8c8'],
    sprite: [
      '..............',
      '...11....11...',
      '..1551..1551..',
      '..1322..2231..',
      '..1233333321..',
      '.122333333321.',
      '.122353353321.',
      '.122333333321.',
      '.122344443321.',
      '.122444444321.',
      '..12444444321.',
      '...1144441....',
      '....11..11....',
      '..............',
    ],
  },
  brookpup: {
    id:'brookpup', name:'BROOKPUP', type:'TIDE',
    hp: 30, dex:'#013',
    blurb:'Lives in cold streams. Sleeps belly-up.',
    palette: [null, '#0c2848', '#1c5894', '#4f8cd6', '#bfe0f8', '#fff8c8'],
    sprite: [
      '..............',
      '.....1111.....',
      '....122221....',
      '...12333321...',
      '..1233333321..',
      '..1233333321..',
      '..1235335321..',
      '..1233333321..',
      '..1244444421..',
      '...12444421...',
      '....11.11.....',
      '..............',
      '..............',
      '..............',
    ],
  },
  sproutkin: {
    id:'sproutkin', name:'SPROUTKIN', type:'FLORA',
    hp: 32, dex:'#024',
    blurb:'A bulb-bound critter. Photosynthesizes when bored.',
    palette: [null, '#1c4818', '#2c6428', '#6cbf48', '#b8e090', '#f4a8c8'],
    sprite: [
      '......55......',
      '.....5445.....',
      '....14.41.....',
      '......11......',
      '....111111....',
      '...12333321...',
      '..1233223321..',
      '..1235335321..',
      '..1233223321..',
      '..1233333321..',
      '...12444421...',
      '....11..11....',
      '..............',
      '..............',
    ],
  },
  voltail: {
    id:'voltail', name:'VOLTAIL', type:'SPARK',
    hp: 24, dex:'#037',
    blurb:'Static gathers in its tail. Touch at own risk.',
    palette: [null, '#5a3818', '#a87018', '#f5c424', '#fce478', '#e84050'],
    sprite: [
      '..............',
      '..1.....1.....',
      '..14...41.....',
      '...111111.....',
      '..14333341....',
      '.1433333341.1.',
      '.1235553321.41',
      '.1233333333341',
      '.1244444444321',
      '.1244444444321',
      '..1244444444..',
      '...11..11.....',
      '..............',
      '..............',
    ],
  },
  dreamoth: {
    id:'dreamoth', name:'DREAMOTH', type:'MIND',
    hp: 22, dex:'#055',
    blurb:'Drifts at dusk. Its dust induces vivid dreams.',
    palette: [null, '#4a1838', '#a44078', '#d96aa8', '#f0c4dc', '#fdf4a8'],
    sprite: [
      '..............',
      '..1.......1...',
      '.131.....131..',
      '13321...12331.',
      '133321.123331.',
      '1333321233331.',
      '1333333333331.',
      '.1335335331...',
      '.1333333331...',
      '..13333331....',
      '...144441.....',
      '....1..1......',
      '..............',
      '..............',
    ],
  },
  shadepaw: {
    id:'shadepaw', name:'SHADEPAW', type:'UMBRA',
    hp: 26, dex:'#068',
    blurb:'Slips between shadows. Eats only whispers.',
    palette: [null, '#181028', '#3a2c54', '#6a5a8a', '#a898c0', '#fdc830'],
    sprite: [
      '..............',
      '..11......11..',
      '.1331....1331.',
      '.1331....1331.',
      '..111111111...',
      '.13111111131..',
      '13.15....15.31',
      '13.15....15.31',
      '.1311111111321',
      '..13333333321.',
      '...111111111..',
      '....1..1......',
      '..............',
      '..............',
    ],
  },
  cindermaw: {
    id:'cindermaw', name:'CINDERMAW', type:'EMBER',
    hp: 44, dex:'#002',
    blurb:'Emberling, grown wild. Its growl warms the cave.',
    palette: [null, '#3a1004', '#a02818', '#cf4828', '#f5a050', '#fceb6c'],
    sprite: [
      '..1........1..',
      '..14......41..',
      '.1331....1331.',
      '13333111133331',
      '13333333333331',
      '13355333553331',
      '13333333333331',
      '13211111111231',
      '.13111111131..',
      '.13.1331.31...',
      '.13.1331.31...',
      '.1...11...1...',
      '..............',
      '..............',
    ],
  },
  brinescale: {
    id:'brinescale', name:'BRINESCALE', type:'TIDE',
    hp: 40, dex:'#014',
    blurb:'A serpent of brackish coves. Coils to think.',
    palette: [null, '#08203a', '#185478', '#2c80b8', '#a8d8f0', '#fce070'],
    sprite: [
      '....1111111...',
      '...12222221...',
      '..1233333321..',
      '..1233113321..',
      '..1235335321..',
      '..1233333321..',
      '...1233321....',
      '....12321.....',
      '...12221......',
      '..12221.......',
      '.12221........',
      '12221.........',
      '1221..........',
      '11............',
    ],
  },
};

// ─── ENEMIES (original) ──────────────────────────────────────
window.ENEMIES = {
  rootlet: {
    id:'rootlet', name:'ROOTLET', hp: 18,
    palette:[null,'#3a2010','#7a4820','#b87a40','#e8c890','#e8e060'],
    sprite: [
      '..............',
      '...1......1...',
      '.1.1.1..1.1.1.',
      '.1.111..111.1.',
      '..1111111111..',
      '..1233113321..',
      '..1235335321..',
      '..1233333321..',
      '..1233113321..',
      '..1444444441..',
      '...11....11...',
      '..............',
      '..............',
      '..............',
    ],
  },
  cinderbat: {
    id:'cinderbat', name:'CINDERBAT', hp: 22,
    palette:[null,'#2c0c20','#80204c','#c43868','#f08caa','#fce070'],
    sprite: [
      '..............',
      '1...1....1...1',
      '13.131..131.31',
      '1331331..1331.',
      '.1333333333331',
      '.13355333553.1',
      '..13333333331.',
      '..1311311311..',
      '...111.111....',
      '....1...1.....',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  husk: {
    id:'husk', name:'HUSK GOLEM', hp: 46,
    palette:[null,'#202018','#544c30','#8c7c4c','#c8b884','#e84050'],
    sprite: [
      '...11111111...',
      '..1333333331..',
      '.133333333331.',
      '13311333113331',
      '13355333553331',
      '13333333333331',
      '13333333333331',
      '13313333313331',
      '13311111113331',
      '13333333333331',
      '.133333333331.',
      '..1244444421..',
      '..11......11..',
      '..............',
    ],
  },
};

// ─── CARDS ───────────────────────────────────────────────────
window.CARDS = [
  { id:'flamewhip',  name:'FLAMEWHIP',   type:'EMBER',  cost:1, kind:'ATK', dmg:6,  text:'Deal 6 damage.' },
  { id:'cinderlash', name:'CINDERLASH',  type:'EMBER',  cost:2, kind:'ATK', dmg:11, text:'Deal 11 damage.\nApply 1 BURN.' },
  { id:'flarecore',  name:'FLARECORE',   type:'EMBER',  cost:2, kind:'PWR',          text:'Each turn:\ndeal 2 to foe.' },
  { id:'bubbleveil', name:'BUBBLE VEIL', type:'TIDE',   cost:1, kind:'SKL', block:5, text:'Gain 5 BLOCK.' },
  { id:'tidalcrash', name:'TIDAL CRASH', type:'TIDE',   cost:2, kind:'ATK', dmg:8,   text:'Deal 8 damage.\nDraw 1 card.' },
  { id:'vinesnare',  name:'VINE SNARE',  type:'FLORA',  cost:1, kind:'ATK', dmg:4,   text:'Deal 4 damage.\nApply 1 WEAK.' },
  { id:'photoheal',  name:'PHOTOHEAL',   type:'FLORA',  cost:1, kind:'SKL',          text:'Heal 4 HP.' },
  { id:'staticpulse',name:'STATIC PULSE',type:'SPARK',  cost:1, kind:'ATK', dmg:3,   text:'Deal 3 damage.\n+1 NRG next turn.' },
  { id:'thunderfang',name:'THUNDERFANG', type:'SPARK',  cost:2, kind:'ATK', dmg:10,  text:'Deal 10 damage.\n30%: stun.' },
  { id:'psylash',    name:'PSY LASH',    type:'MIND',   cost:1, kind:'ATK', dmg:7,   text:'Deal 7 damage.' },
  { id:'foresight',  name:'FORESIGHT',   type:'MIND',   cost:0, kind:'SKL',          text:'Draw 2 cards.' },
  { id:'shadowstep', name:'SHADOWSTEP',  type:'UMBRA',  cost:1, kind:'SKL', block:4, text:'Gain 4 BLOCK.\nDraw 1.' },
  { id:'orb',        name:'CAPTURE ORB', type:'NORMAL', cost:1, kind:'ORB',          text:'If foe HP < 40%:\nCAPTURE.' },
  { id:'greatorb',   name:'GREAT ORB',   type:'NORMAL', cost:2, kind:'ORB',          text:'If foe HP < 60%:\nCAPTURE.' },
  { id:'tackle',     name:'TACKLE',      type:'NORMAL', cost:1, kind:'ATK', dmg:5,   text:'Deal 5 damage.' },
  { id:'guard',      name:'GUARD',       type:'NORMAL', cost:1, kind:'SKL', block:5, text:'Gain 5 BLOCK.' },
];
window.CARDS_BY_ID = Object.fromEntries(window.CARDS.map(c => [c.id, c]));

// ─── TYPE MATCHUPS ───────────────────────────────────────────
// attacker × defender → damage multiplier (1.0 = neutral)
window.MATCHUPS = {
  EMBER: { FLORA: 1.5, TIDE:  0.6, EMBER: 0.6 },
  TIDE:  { EMBER: 1.5, FLORA: 0.6, TIDE:  0.6, SPARK: 0.6 },
  FLORA: { TIDE:  1.5, EMBER: 0.6, FLORA: 0.6 },
  SPARK: { TIDE:  1.5, FLORA: 0.6 },
  MIND:  { UMBRA: 1.5, MIND:  0.6 },
  UMBRA: { MIND:  1.5, UMBRA: 0.6 },
  NORMAL:{},
};
window.STAB_MULT = 1.25;

// Compute damage modifier breakdown for a card / attacker / defender.
// Returns { mult, stab, effectiveness } where mult is final multiplier.
window.calcDamageMods = function(cardType, attackerType, defenderType) {
  const stab = cardType === attackerType ? window.STAB_MULT : 1;
  const eff  = (window.MATCHUPS[cardType] || {})[defenderType] ?? 1;
  return { mult: stab * eff, stab, effectiveness: eff };
};

// Capture % for an orb against a foe at given HP ratio.
// Orb (basic) → up to 100% at 0 HP; Great Orb scales 1.5×.
window.calcCaptureChance = function(orbId, hp, maxHp) {
  const missing = 1 - (hp / maxHp);
  const k = orbId === 'greatorb' ? 1.5 : 1.0;
  return Math.max(0, Math.min(1, missing * k));
};

// ─── STARTER TEAM (for demo) ─────────────────────────────────
window.STARTER_TEAM = [
  'emberling','brookpup','sproutkin','voltail','dreamoth','shadepaw',
];

window.STARTER_DECK = [
  'tackle','tackle','tackle','tackle','tackle',
  'guard','guard','guard','guard',
  'flamewhip','flamewhip',
  'orb',
];
