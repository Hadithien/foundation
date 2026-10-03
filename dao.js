// Dao Path: an idle cultivation game woven into Foundation
const NFX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qn', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function nf(n) {
  n = +n || 0; const s = n < 0 ? '-' : ''; n = Math.abs(n);
  if (n < 1000) return s + (n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n));
  let i = 0; while (n >= 1000 && i < NFX.length - 1) { n /= 1000; i++; }
  return s + (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + NFX[i];
}
const tf = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`; };
const yrs = v => v >= 1e5 ? nf(v) : Math.floor(v).toLocaleString();

// ---------- world data ----------
const REALM = [['Mortal Awakening', '🌱'], ['Qi Condensation', '💨'], ['Foundation Establishment', '🏛️'], ['Core Formation', '🟡'], ['Nascent Soul', '👶'], ['Spirit Transformation', '👻'], ['Void Refinement', '🌌'], ['Body Integration', '☯️'], ['Mahayana', '🪷'], ['Tribulation Transcendence', '⚡'], ['True Immortal', '🌟'], ['Dao Sovereign', '👑']];
const LIFE = [80, 150, 300, 600, 1200, 2500, 5000, 10000, 20000, 50000, 150000, 1e6];
// Pacing: target days spent in each realm (about one year from Mortal to the peak)
const RDAYS = [.09, .18, .37, .73, 1.5, 2.7, 5.5, 11, 22, 46, 92, 183];
const YEARLEN = r => RDAYS[r] * 86400 / (LIFE[r] * .35); // seconds per in-game year
const BASE = r => 2 * Math.pow(5.5, r);
const LSUM = (() => { let s = 0; for (let l = 1; l <= 9; l++) s += Math.pow(1.3, l - 1) * (l === 9 ? 1.5 : 1) / (1 + .12 * l); return s; })();
const TYPMULT = 3; // assumed typical Qi multiplier
const CAP = (r, l) => BASE(r) * RDAYS[r] * 86400 * TYPMULT / LSUM * Math.pow(1.3, l - 1);
const STR = r => 0.1 * Math.pow(5, r), INSR = r => 0.25 * Math.pow(2, r), ESSR = r => 0.2 * Math.pow(3, r);
const LBL = { qi: 'Qi', atk: 'Attack', def: 'Defense', life: 'Lifespan', bt: 'Breakthrough', stone: 'Spirit stones', herb: 'Herbs', ins: 'Insight', ess: 'Essence', pill: 'Pill potency' };
const sText = (s, k = 1) => Object.entries(s).map(([x, v]) => `${v >= 0 ? '+' : ''}${nf(v * k)}% ${LBL[x]}`).join(' · ');

const PATH = {
  orth: ['🏯', 'Orthodox Sect', 'Disciplined and blessed by the heavens. Safer breakthroughs and a long life.', { bt: 6, stone: 20, life: 10 }],
  demon: ['👹', 'Demonic Path', 'Power at any price. Fast Qi and fierce attacks, a shorter life.', { qi: 35, atk: 40, life: -10 }],
  druid: ['🌿', 'Wild Druid', 'Walk with the forest. Abundant herbs, long life and gentle growth.', { herb: 60, life: 20, ess: 15, qi: 15 }],
  sword: ['⚔️', 'Sword Cultivator', 'One sword, one heart. Overwhelming attack and keen insight.', { atk: 100, ins: 10 }],
  body: ['🛡️', 'Body Cultivator', 'Forge the flesh like iron. Great defense, essence and vitality.', { def: 60, ess: 50, life: 15 }],
  alch: ['⚗️', 'Alchemist', 'Pills are power. Stronger pills and richer herbs.', { herb: 30, pill: 50, stone: 10 }]
};
const DAO = {
  sword: ['🗡️', 'Sword', { atk: 35, bt: 0.4 }], flame: ['🔥', 'Flame', { qi: 28, atk: 10 }], water: ['💧', 'Water', { qi: 15, ins: 12 }],
  nature: ['🌳', 'Nature', { herb: 18, life: 4, qi: 12 }], earth: ['⛰️', 'Earth', { def: 30, life: 3, ess: 10 }], thunder: ['⚡', 'Thunder', { atk: 20, bt: 0.8, qi: 12 }],
  wind: ['🍃', 'Wind', { qi: 18, stone: 8 }], frost: ['❄️', 'Frost', { ins: 14, def: 14, qi: 10 }], time: ['⏳', 'Time', { life: 6, qi: 22, ins: 8 }],
  space: ['🌀', 'Space', { stone: 14, ess: 12, qi: 14 }], lifedeath: ['☯️', 'Life & Death', { life: 8, bt: 0.7, herb: 10 }], slaughter: ['🩸', 'Slaughter', { atk: 40, qi: 18 }]
};
const SYN = [['water', 'frost', { qi: 120 }], ['flame', 'sword', { atk: 150 }], ['nature', 'lifedeath', { life: 20, herb: 60 }], ['thunder', 'wind', { qi: 150 }],
  ['time', 'space', { qi: 300 }], ['sword', 'slaughter', { atk: 300 }], ['earth', 'nature', { def: 150, ess: 40 }], ['flame', 'thunder', { qi: 120, atk: 60 }]];
const PHYS = {
  mortal: ['🧍', 'Mortal Body', 0, 0, {}, 'An ordinary body, full of potential.'],
  jade: ['🪨', 'Jade Bone Body', 0, 500, { qi: 30, def: 30 }, 'Bones like polished jade.'],
  wood: ['🌱', 'Wood Spirit Body', 1, 600, { herb: 50, life: 15, qi: 25 }, 'The forest breathes through you.'],
  frost: ['🧊', 'Frost Jade Body', 2, 600, { qi: 50, ins: 15, def: 20 }, 'Cold clarity of mind.'],
  thunder: ['⚡', 'Thunder Tribulation Body', 3, 700, { atk: 60, bt: 4, qi: 40 }, 'Lightning is your kin.'],
  sword: ['🗡️', 'Sword Bone', 3, 700, { atk: 120, qi: 40 }, 'Born to wield the blade.'],
  phoenix: ['🐦‍🔥', 'Vermilion Phoenix Body', 5, 800, { qi: 120, life: 15, atk: 30 }, 'Reborn in flame.'],
  yinyang: ['☯️', 'Yin-Yang Dao Body', 6, 800, { ins: 60, qi: 100, life: 10 }, 'Balance incarnate.'],
  demon: ['😈', 'Ancient Demon Body', 7, 900, { atk: 150, qi: 100, def: 50 }, 'Blood of the old world.'],
  chaos: ['🌌', 'Primordial Chaos Body', 0, 0, { qi: 300, atk: 100, def: 100, ins: 50 }, 'Unlocked only with 150 Karma.']
};
const MAN = {
  m1: ['qi', 0, 'Breath of the Green Mist', 'Wood', 0, { qi: 50 }, 0], m2: ['qi', 1, 'Nine Turns Heavenly Breath', '', 1, { qi: 150 }],
  m3: ['qi', 2, 'Cinnabar Sun Scripture', 'Fire', 2, { qi: 400, atk: 20 }], m4: ['qi', 2, 'Moonwell Mystic Sutra', 'Water', 2, { qi: 300, ins: 30 }],
  m5: ['qi', 3, 'Ancient Oak Rooting Art', 'Wood', 3, { qi: 800, life: 25, herb: 40 }], m6: ['qi', 4, 'Heaven-Devouring Art', 'Demonic', 4, { qi: 2500, atk: 50, life: -10 }, 1],
  m7: ['qi', 5, 'Nine Suns Divine Canon', 'Fire', 4, { qi: 3500 }], m8: ['qi', 7, 'Primordial Chaos Canon', 'Chaos', 5, { qi: 12000, ins: 40 }],
  m9: ['qi', 9, 'Taiyi Immortal Scripture', 'Immortal', 5, { qi: 40000, life: 30 }, 1],
  a1: ['art', 0, 'Iron Mountain Fist', 'Earth', 0, { atk: 30 }, 0], a2: ['art', 1, 'Falling Leaf Sword', 'Wood', 1, { atk: 90 }],
  a3: ['art', 2, 'Thunder Palm', 'Thunder', 2, { atk: 200, bt: 1 }], a4: ['art', 2, 'Frostwind Step', 'Frost', 2, { def: 90, atk: 60 }],
  a5: ['art', 3, 'Nine Heavens Sword Canon', 'Sword', 3, { atk: 500 }], a6: ['art', 5, 'Void-Cleaving Blade', 'Void', 4, { atk: 1600 }, 1],
  a7: ['art', 7, 'Star-Shattering Fist', 'Star', 5, { atk: 5000, def: 500 }], a8: ['art', 9, 'Thousand-Mile Sword Intent', 'Sword', 5, { atk: 15000 }],
  x1: ['aux', 1, 'Light-Body Technique', '', 1, { bt: 2, def: 20 }], x2: ['aux', 2, 'Spirit Gathering Array', '', 2, { stone: 50 }],
  x3: ['aux', 2, 'Herb Lore Verses', 'Wood', 2, { herb: 60 }], x4: ['aux', 3, 'Golden Bell Shield', '', 2, { def: 200 }],
  x5: ['aux', 3, 'Longevity Sutra', '', 3, { life: 35 }], x6: ['aux', 4, 'Insight Mirror Heart', '', 3, { ins: 60 }],
  x7: ['aux', 5, 'Tribulation-Crossing Art', 'Thunder', 4, { bt: 8 }, 1], x8: ['aux', 4, 'Marrow-Washing Scripture', '', 3, { ess: 60 }]
};
const MAN_ARR = Object.entries(MAN).map(([id, a]) => ({ id, slot: a[0], req: a[1], name: a[2], el: a[3], g: a[4], s: a[5], secret: !!a[6] }));
const mById = Object.fromEntries(MAN_ARR.map(m => [m.id, m]));
const GRADE = ['Mortal', 'Yellow', 'Mysterious', 'Earth', 'Heaven', 'Immortal'];
const mPrice = m => Math.ceil(STR(m.req) * 600 * (1 + m.g * .5));
const SLOTS = { qi: (r) => 1 + (r >= 6 ? 1 : 0), art: (r) => 2 + (r >= 4 ? 1 : 0), aux: (r) => 1 + (r >= 5 ? 1 : 0) + (r >= 8 ? 1 : 0) };
const SLOTN = { qi: 'Cultivation Manual', art: 'Combat Art', aux: 'Auxiliary Art' };
const MER = (() => {
  const names = ['Lung', 'Large Intestine', 'Stomach', 'Spleen', 'Heart', 'Small Intestine', 'Bladder', 'Kidney', 'Pericardium', 'Triple Burner', 'Gallbladder', 'Liver',
    'Governing Vessel', 'Conception Vessel', 'Penetrating Vessel', 'Girdle Vessel', 'Yin Heel Vessel', 'Yang Heel Vessel', 'Yin Link Vessel', 'Yang Link Vessel'];
  return names.map((n, i) => {
    const s = i >= 12 ? { qi: 100 + 12 * (i - 12), bt: 1.2, ins: 15 } : [{ qi: 40 }, { atk: 30 }, { def: 25, life: 2 }, { ess: 15, ins: 10 }][i % 4];
    const req = Math.floor(i * .55);
    return { n: (i >= 12 ? '' : 'Meridian of the ') + n, s, req, cost: ESSR(req) * (200 + 30 * i) };
  });
})();
const PILL = {
  qip: ['💨', 'Qi Gathering Pill', 3, 20, 'Instantly absorb 3 minutes of Qi.', (g, st, k) => { g.qi += st.qps * 180 * k; }],
  fnd: ['🏛️', 'Foundation Pill', 10, 60, '+8% chance on your next breakthrough.', (g, st, k) => { g.btBoost = Math.min(70, g.btBoost + 8 * k); }],
  lng: ['🍑', 'Longevity Pill', 14, 90, 'Restore 5% of your lifespan.', (g, st, k) => { g.age = Math.max(0, g.age - st.life * .05 * k); }],
  ess: ['🩸', 'Marrow Cleansing Pill', 8, 40, 'Gain 3 minutes of Essence.', (g, st, k) => { g.ess += st.ess * 180 * k; }],
  ins: ['👁️', 'Enlightenment Pill', 10, 50, 'Gain 3 minutes of Insight.', (g, st, k) => { g.ins += st.ins * 180 * k; }],
  elx: ['🌀', 'Spirit Surge Elixir', 18, 100, 'Double your Qi gain for 5 minutes.', (g, st, k) => { g.buff = Math.max(g.buff, g.t) + 300000 * k; }],
  hdp: ['🌠', 'Heaven-Defying Pill', 45, 400, '+25% chance on your next breakthrough.', (g, st, k) => { g.btBoost = Math.min(70, g.btBoost + 25 * k); }]
};
const ZONES = [['Whispering Forest', '🌲', 0, 'wolves and bandits'], ['Misty Marshes', '🌫️', 1, 'swamp spirits'], ['Ancient Battlefield', '⚔️', 2, 'restless warriors'],
  ['Frozen Peaks', '🏔️', 3, 'ice wyrms'], ['Volcanic Core', '🌋', 4, 'flame drakes'], ['Void Rift', '🌀', 6, 'void beasts'], ['Immortal Ruins', '🏛️', 8, 'guardian constructs'], ['Chaos Sea', '🌊', 10, 'chaos leviathans']];
const zDur = i => 45 + 15 * i, zPow = z => 16 * Math.pow(5.5, ZONES[z][2]);
const KUP = {
  flame: ['🔥', 'Eternal Flame', '+10% Qi gain per level', 50], start: ['🌅', 'Past-Life Memory', 'Begin each life one realm higher per level', 5],
  life: ['🍃', 'Longevity Seal', '+10% lifespan per level', 20], ins: ['👁️', 'Dao Eyes', '+12% Insight per level', 20], ess: ['🩸', 'Tempered Blood', '+10% Essence per level', 20],
  luck: ['🍀', 'Heavenly Fortune', 'Better loot and secret manual drops', 20], ward: ['⛈️', 'Tribulation Ward', '+2% breakthrough chance per level', 10], vault: ['💎', 'Past-Life Treasury', 'Start each life with spirit stones', 10]
};
const kCost = (id, l) => Math.ceil(5 * Math.pow(1.7, l));

// ---------- fate events ----------
const EVENTS = [
  ['A Dying Elder', 'An old cultivator lies bleeding by the road, clutching a worn jade slip.', [
    ['Tend his wounds', [[.7, { ins: 240, al: 10 }, 'He imparts a fragment of his Dao before passing.'], [.3, { manual: 1 }, 'He presses a secret manual into your hands.']]],
    ['Take the jade slip', [[.5, { stones: 500 }, 'The slip holds a hidden cache of spirit stones.'], [.5, { years: 18, al: -8 }, 'A death curse clings to you.']]],
    ['Walk on', [[1, {}, 'You travel on, untroubled.']]]]],
  ['Spirit Spring', 'A spring of liquid Qi bubbles from a mossy crack in the rock.', [
    ['Bathe in it', [[.8, { qi: 500 }, 'Qi floods your meridians.'], [.2, { qi: 120, years: -8 }, 'The water leaves you lighter and younger.']]],
    ['Bottle some', [[1, { herbs: 8, stones: 150 }, 'You gather herbs from its banks and sell the rest.']]]]],
  ['Ancient Tomb', 'A sealed tomb hums with the stale breath of a forgotten sect.', [
    ['Break the seal', [[.35, { manual: 1 }, 'You discover a hidden inheritance.'], [.3, { ess: 400, stones: 200 }, 'You loot the treasures.'], [.35, { years: 25 }, 'Guardian ghosts drain your vitality.']]],
    ['Study the runes', [[1, { ins: 200 }, 'The old formations teach you something.']]]]],
  ['Bandit Ambush', 'Robbers drop from the trees, blades drawn.', [
    ['Fight them', [[.65, { stones: 350, ess: 120, al: 5 }, 'They fall and you take their purses.'], [.35, { years: 10 }, 'You win, but are wounded.']]],
    ['Pay them off', [[1, { stones: -150 }, 'You hand over some stones and move on.']]]]],
  ['Heavenly Phenomenon', 'Auspicious clouds gather and the sky glows with purple light.', [
    ['Comprehend the Dao', [[1, { ins: 600 }, 'Fragments of truth drift into your mind.']]],
    ['Circulate your Qi', [[1, { qi: 800 }, 'Heaven and earth feed your cultivation.']]]]],
  ['The Silent Grove', 'The trees lean close. The old forest watches you.', [
    ['Meditate beneath them', [[1, { herbs: 10, years: -10 }, 'The grove shares its quiet strength.']]],
    ['Plant a spirit seed', [[.8, { bt: 12 }, 'The seed takes root, strengthening your resolve.'], [.2, { bt: 4, herbs: 20 }, 'It blooms into a handful of herbs.']]]]],
  ['Demonic Temptation', 'A red mist whispers an easy path to power.', [
    ['Accept the whisper', [[.7, { qi: 1600, years: 25, al: -15 }, 'Power surges in, but it costs years.'], [.3, { qi: 400, al: -15 }, 'The whisper fades, leaving a hollow gift.']]],
    ['Refuse', [[1, { ins: 160, al: 10 }, 'Your Dao heart steadies.']]]]],
  ['Sect Recruiters', 'Elders of a rising sect offer you a place among them.', [
    ['Accept a post', [[1, { stones: 700, herbs: 4 }, 'You receive a stipend and supplies.']]],
    ['Decline politely', [[.6, { ins: 100 }, 'Free of obligations, you reflect.'], [.4, { stones: 100 }, 'They leave you a parting gift.']]]]],
  ['Beast Egg', 'A speckled egg warms in a cracked nest. Something inside stirs.', [
    ['Hatch it', [[.5, { ess: 500, stones: 200 }, 'A tiny spirit beast bonds with you and shares its essence.'], [.5, { stones: 400 }, 'It hatches and trades you a gem before fleeing.']]],
    ['Sell it', [[1, { stones: 500 }, 'A merchant pays handsomely.']]]]],
  ['Tribulation Omen', 'Thunder rumbles over a clear sky. A tribulation is near.', [
    ['Face it head-on', [[.55, { bt: 18 }, 'You glimpse the nature of tribulations.'], [.45, { years: 15, bt: 6 }, 'The lightning scars you, but you learn from it.']]],
    ['Hide and observe', [[1, { bt: 6, ins: 80 }, 'Watching from afar teaches you caution.']]]]],
  ['Wandering Alchemist', 'A hunched figure sells pills from a bamboo tray.', [
    ['Buy a pill', [[1, { stones: -250, herbs: 6, qi: 300 }, 'You trade stones for herbs and a pill of Qi.']]],
    ['Trade stories', [[1, { ins: 140, herbs: 3 }, 'He shares an old alchemical secret.']]]]]
];

// ---------- identity & world ----------
const ORIG = {
  orphan: ['🏚️', 'Village Orphan', 'Raised by a whole village, hungry for the Dao.', { ins: 15, bt: 2 }],
  noble: ['🏯', 'Fallen Noble House', 'Your family name once carried weight. You carry its debts and its books.', { stone: 30, def: 10 }],
  herb: ['🌿', "Herbalist's Child", 'You grew up among drying roots and the smell of rain.', { herb: 40, life: 5 }],
  sword: ['🗡️', "Wandering Swordsman's Ward", 'A stranger left you a blade and a single lesson.', { atk: 30 }],
  acol: ['🛕', 'Temple Acolyte', 'Years of chanting taught you stillness.', { life: 8, ins: 8 }],
  clan: ['🐺', 'Beast-Tamer Clan', 'Your people lived beside the wild things, not above them.', { ess: 20, def: 15 }]
};
const TEMP = {
  calm: ['🌊', 'Serene', 'Still water reflects the sky.', { ins: 10, bt: 1 }], fierce: ['🔥', 'Fierce', 'You answer insult with steel.', { atk: 15, qi: 10 }],
  kind: ['🌸', 'Compassionate', 'You cannot walk past suffering.', { herb: 15, life: 5 }], cunning: ['🦊', 'Cunning', 'Every road has a toll; you know the price.', { stone: 15, bt: 1 }]
};
const SECT = {
  azure: ['☁️', 'Azure Cloud Sect', 'An orthodox sect upon the cloud peaks. Disciplined, honourable, wealthy.', { bt: 1, stone: 8 }, 1],
  blood: ['🌙', 'Blood Moon Hall', 'A demonic hall that prizes strength above all.', { qi: 10, atk: 10 }, -1],
  grove: ['🌳', 'Verdant Grove Circle', 'Druidic hermits who speak with roots and rivers.', { herb: 15, life: 2 }, 1],
  iron: ['⚔️', 'Iron Sword Pavilion', 'Swordsmen who judge a person by their edge.', { atk: 20, def: 5 }, 0],
  wander: ['🧭', 'Wandering Rogues', 'No walls, no master. Only the road.', { stone: 5, ins: 5 }, 0]
};
const RANKS = [['Outer Disciple', 0, 0], ['Inner Disciple', 1, 200], ['Core Disciple', 3, 1000], ['Elder', 5, 5000], ['Grand Elder', 7, 20000], ['Patriarch', 9, 80000]];
const NPC = {
  lin: ['🧙', 'Master Lin Qingshan', 'Mentor', 0, 'A retired elder who sees something in you.', { ins: 5, bt: .5 },
    ['"Patience is also cultivation, child."', '"I once chased the sky. Now I chase the tea."', '"Your Qi is restless. Good. Restless things grow."']],
  mu: ['👵', 'Granny Mu', 'Herbalist', 0, 'She sells roots, rumours and remedies.', { herb: 12, life: 1.5 },
    ['"Eat something. A cultivator who starves is just a ghost with ambition."', '"This moss only grows where a dragon once slept."', '"The forest keeps accounts, you know."']],
  han: ['🗡️', 'Han Feng', 'Rival', 1, 'A proud swordsman who refuses to let you walk ahead.', { atk: 10, qi: 3 },
    ['"Do not mistake my respect for weakness."', '"One day I will cross the heavens before you."', '"...Your stance has improved. Tell no one I said so."']],
  zhao: ['🪙', 'Merchant Zhao', 'Trader', 1, 'He knows the price of everything, even secrets.', { stone: 12 },
    ['"A fair price is one both sides complain about."', '"I hear a tomb has opened to the north."', '"For you? A friend\'s discount. Only slightly inflated."']],
  su: ['🌸', 'Su Ruoxue', 'Dao Companion', 2, 'A wandering healer whose path keeps crossing yours.', { qi: 10, ins: 5 },
    ['"Walk beside me a while. The road is shorter in company."', '"Do you ever wonder who we were before the Dao?"', '"Come back alive. That is all I ask."']],
  hei: ['🦇', 'Heiyan', 'Demonic Wanderer', 3, 'A smiling stranger who offers terrible bargains.', { qi: 8, atk: 8 },
    ['"Righteous, demonic... just words people use to feel clean."', '"Power asks no questions. Why should you?"', '"Ah, my favourite hypocrite returns."']]
};
const LOC = ['Mist-Veiled Village', 'Azure Market Town', 'Sect Mountain Gate', 'Golden Plains Citadel', 'Floating Peak Palace', 'Spirit Realm Gateway', 'Void Frontier', 'Celestial Capital', 'Heavenly Court Outskirts', 'Thunder Sea', 'Immortal Isles', 'Throne of the Dao'];
const alLbl = a => a >= 60 ? 'Paragon of Righteousness' : a >= 25 ? 'Righteous' : a > -25 ? 'Neutral Wanderer' : a > -60 ? 'Heterodox' : 'Demonic Overlord';
const bondLv = (M, id) => Math.min(5, Math.floor(((M.bonds[id] || {}).aff || 0) / 60));
const rivalPow = g => 10 * Math.pow(5.5, g.realm) * (1 + .1 * g.layer) * 1.3;
function leg(g, text) { const L = g.meta.legend; L.unshift({ d: new Date().toISOString().slice(0, 10), t: text }); if (L.length > 150) L.length = 150; }
const nm = g => g.meta.id.name || 'the Nameless Cultivator';

// ---------- game state ----------
const newGame = () => ({ v: 1, t: Date.now(), qi: 0, realm: 0, layer: 1, age: 0, stones: 0, herbs: 0, ess: 0, ins: 0, pills: {}, btBoost: 0, buff: 0, mer: 0, dao: {}, chosen: [],
  path: '', phys: 'mortal', auto: true, autoBt: false, exp: null, event: null, nextEv: Date.now() + 200000, log: [], hist: { y: 0, k: 0 },
  meta: { karma: 0, total: 0, ups: {}, phys: { mortal: 1 }, man: { m1: { xp: 0, lvl: 0 }, a1: { xp: 0, lvl: 0 } }, eq: { qi: ['m1'], art: ['a1'], aux: [] }, lives: 1, top: 0, asc: 0 } });
function G() {
  let g = S.game;
  if (!g || typeof g !== 'object' || !g.meta) g = S.game = newGame();
  const M = g.meta;
  M.id = Object.assign({ name: '', epithet: '', origin: '', temper: '', motto: '', story: '' }, M.id);
  if (typeof M.al !== 'number') M.al = 0;
  if (!M.bonds) M.bonds = {};
  if (!Array.isArray(M.legend)) M.legend = [];
  if (M.sect === undefined) M.sect = null;
  return g;
}
let LB = 1; // bonus from real-life Qi
const log = (g, t) => { g.log.unshift(t); if (g.log.length > 40) g.log.length = 40; };

function gstats(g) {
  const b = { qi: 0, atk: 0, def: 0, life: 0, bt: 0, stone: 0, herb: 0, ins: 0, ess: 0, pill: 0 }, M = g.meta, r = g.realm, u = M.ups, sc = 1 + .6 * r;
  const add = (o, k = 1, scale = 1) => { for (const x in o) b[x] += o[x] * k * (x === 'bt' || x === 'life' ? 1 : scale); };
  for (const sl in M.eq) for (const id of M.eq[sl]) { const m = mById[id], o = M.man[id]; if (m && o) add(m.s, 1 + .15 * o.lvl); }
  const ph = PHYS[g.phys], pl = M.phys[g.phys] || 1; if (ph) add(ph[4], 1 + .12 * (pl - 1));
  for (let i = 0; i < g.mer; i++) add(MER[i].s);
  for (const id of g.chosen) { const l = g.dao[id] || 0; if (l) add(DAO[id][2], l, sc); }
  for (const [a, c, s] of SYN) if (g.chosen.includes(a) && g.chosen.includes(c) && (g.dao[a] || 0) >= 3 && (g.dao[c] || 0) >= 3) add(s, 1, sc);
  const p = PATH[g.path]; if (p) add(p[3]);
  const I = M.id; if (ORIG[I.origin]) add(ORIG[I.origin][3]); if (TEMP[I.temper]) add(TEMP[I.temper][3]);
  if (M.sect && SECT[M.sect.id]) add(SECT[M.sect.id][3], M.sect.rank + 1);
  for (const id in NPC) { const l = bondLv(M, id); if (l) add(NPC[id][5], l); }
  if (M.al >= 25) add({ bt: 2 }); else if (M.al <= -25) add({ qi: 12, atk: 10 });
  const buffOn = g.buff > g.t;
  const qps = BASE(r) * (1 + .12 * g.layer) * Math.max(.1, 1 + b.qi / 100) * (1 + .1 * (u.flame || 0) + .25 * M.asc) * LB * (buffOn ? 2 : 1);
  const life = LIFE[r] * Math.max(.3, 1 + (b.life + 10 * (u.life || 0)) / 100);
  return { b, qps, life, buffOn, pow: 10 * Math.pow(5.5, r) * (1 + .1 * g.layer) * (1 + b.atk / 100) * (1 + b.def / 150),
    stone: STR(r) * (1 + b.stone / 100), herb: .03 * (1 + .25 * r) * (1 + b.herb / 100),
    ins: INSR(r) * (1 + (b.ins + 12 * (u.ins || 0)) / 100), ess: ESSR(r) * (1 + (b.ess + 10 * (u.ess || 0)) / 100),
    pill: 1 + b.pill / 100, luck: 1 + .08 * (u.luck || 0),
    bt: Math.max(5, Math.min(100, 72 - 2 * r + b.bt + g.btBoost + 2 * (u.ward || 0))) };
}
const cost = g => CAP(g.realm, g.layer) * (g.layer === 9 ? 1.5 : 1);
const daoSlots = g => Math.min(4, 1 + Math.floor(g.realm / 3));
const daoCost = (g, id) => 15 * Math.pow((g.dao[id] || 0) + 1, 1.6) * Math.pow(2, g.realm);
const karmaFor = (g, asc) => Math.floor(Math.pow(g.realm * 9 + g.layer, 1.5) / 4 * (asc ? 3 : 1));
const mastery = (id, lvl) => 300 * Math.pow(lvl + 1, 1.5) * (1 + mById[id].g);

function reborn(g, why) {
  const M = g.meta, k = karmaFor(g, why === 'ascend');
  M.karma += k; M.total += k; M.lives++; if (why === 'ascend') M.asc++;
  const sr = Math.min(5, M.ups.start || 0);
  Object.assign(g, { qi: 0, realm: sr, layer: 1, age: 0, stones: Math.round(STR(sr) * 600 * (M.ups.vault || 0)), herbs: 0, ess: 0, ins: 0, pills: {}, btBoost: 0, buff: 0, mer: 0, dao: {}, chosen: [], exp: null, event: null, nextEv: g.t + 200000 });
  M.top = Math.max(M.top, sr);
  log(g, why === 'ascend' ? `✨ You ascend beyond the world! +${k} Karma.` : why === 'died' ? `💀 Your lifespan ran out. You are reborn with +${k} Karma.` : `🔄 You reincarnate with +${k} Karma.`);
  g.hist.k = k; g.hist.y = why;
  leg(g, why === 'ascend' ? `${nm(g)} ascended beyond the world.` : why === 'died' ? `${nm(g)} lived out their years and was reborn. Life ${M.lives} begins.` : `${nm(g)} chose reincarnation. Life ${M.lives} begins.`);
}
const gPart = (g, x) => { /* helper placeholder for readability */ return x; };

function fx(g, st, e) {
  const out = [];
  if (e.al) { g.meta.al = Math.max(-100, Math.min(100, g.meta.al + e.al)); out.push(e.al > 0 ? 'righteousness grows' : 'your heart darkens'); }
  if (e.qi) { const v = st.qps * e.qi; g.qi += v; out.push(`+${nf(v)} Qi`); }
  if (e.stones) { const v = st.stone * e.stones * (e.stones > 0 ? 1 : 1); g.stones = Math.max(0, g.stones + v); out.push(`${v >= 0 ? '+' : ''}${nf(v)} stones`); }
  if (e.herbs) { g.herbs += e.herbs * (1 + .3 * g.realm); out.push(`+${nf(e.herbs * (1 + .3 * g.realm))} herbs`); }
  if (e.ess) { const v = st.ess * e.ess; g.ess += v; out.push(`+${nf(v)} essence`); }
  if (e.ins && e.ins > 0) { const v = st.ins * e.ins; g.ins += v; out.push(`+${nf(v)} insight`); }
  if (e.years) { const before = g.age; g.age = Math.max(0, Math.min(g.age + e.years * (1 + g.realm * .5), st.life - 1)); const d = g.age - before; out.push(`${d >= 0 ? '+' : ''}${Math.round(d)} years of age`); }
  if (e.bt) { g.btBoost = Math.min(70, g.btBoost + e.bt); out.push(`+${e.bt}% breakthrough`); }
  if (e.manual) {
    const pool = MAN_ARR.filter(m => m.secret && !g.meta.man[m.id] && m.req <= g.realm + 2);
    if (pool.length) { const m = pool[Math.floor(Math.random() * pool.length)]; g.meta.man[m.id] = { xp: 0, lvl: 0 }; out.push(`found secret manual "${m.name}"`); }
    else { const v = st.stone * 600; g.stones += v; out.push(`+${nf(v)} stones`); }
  }
  return out.join(', ');
}
function newEvent(g) { g.event = Math.floor(Math.random() * EVENTS.length); g.nextEv = g.t + (240 + Math.random() * 180) * 1000; }

function startExp(g, z, rep) {
  g.exp = { z, start: g.t, end: g.t + zDur(z) * 1000, rep: !!rep };
}
function finishExp(g, st) {
  const e = g.exp, z = ZONES[e.z], R = z[2], dur = zDur(e.z), ratio = st.pow / zPow(e.z), p = Math.pow(ratio, 2.5) / (1 + Math.pow(ratio, 2.5));
  g.exp = null;
  if (Math.random() < p) {
    const rnd = () => .8 + Math.random() * .4, k = st.luck;
    const sg = Math.round(STR(R) * dur * 5 * (1 + st.b.stone / 100) * rnd() * k), hb = (2 + R * 1.5) * (1 + st.b.herb / 100) * rnd() * k,
      es = ESSR(R) * dur * 2 * (1 + st.b.ess / 100) * rnd() * k, ns = INSR(R) * dur * 1.5 * (1 + st.b.ins / 100) * rnd() * k;
    g.stones += sg; g.herbs += hb; g.ess += es; g.ins += ns;
    let extra = '';
    if (Math.random() < .05 * k) { const o = fx(g, st, { manual: 1 }); extra = ' · ' + o; }
    log(g, `⚔️ ${z[0]}: defeated ${z[3]}. +${nf(sg)} stones, +${nf(hb)} herbs, +${nf(es)} essence, +${nf(ns)} insight${extra}`);
  } else {
    const before = g.age; g.age = Math.min(g.age + 4 * (1 + g.realm * .5), st.life - 1);
    log(g, `🩹 ${z[0]}: overwhelmed by ${z[3]}. You flee wounded (+${Math.round(g.age - before)} years).`);
  }
  if (e.rep) startExp(g, e.z, true);
}
function tryBreak(g, st) {
  const need = cost(g); if (g.qi < need) return;
  if (g.layer < 9) { g.qi -= need; g.layer++; return; }
  if (g.realm >= REALM.length - 1) return; // ascension is a manual choice
  const ok = Math.random() * 100 < st.bt; g.btBoost = 0;
  if (ok) {
    g.qi = 0; g.realm++; g.layer = 1; g.meta.top = Math.max(g.meta.top, g.realm); g.age = Math.min(g.age, LIFE[g.realm] * .3);
    log(g, `🌟 Breakthrough! You enter the ${REALM[g.realm][0]} realm.`);
    leg(g, `${nm(g)} broke through to the ${REALM[g.realm][0]} realm at ${LOC[g.realm]}.`);
  } else {
    g.qi *= .7; g.age += 3; log(g, '💥 The breakthrough fails. Your Qi backlashes (-30% Qi, +3 years).');
  }
}
function advance(g, dt, offline) {
  const st = gstats(g), M = g.meta;
  g.t += dt * 1000;
  if (M.sect) M.sect.c += dt * .5 * (1 + g.realm * .5);
  g.qi += st.qps * dt; g.stones += st.stone * dt; g.herbs += st.herb * dt; g.ins += st.ins * dt; g.ess += st.ess * dt;
  const yl = YEARLEN(g.realm); g.age += dt / yl; if (offline && g.age > st.life - 1) g.age = Math.max(g.age - dt / yl, st.life - 1);
  for (const sl in M.eq) for (const id of M.eq[sl]) {
    const o = M.man[id]; if (!o || o.lvl >= 9) continue;
    o.xp += dt; const need = mastery(id, o.lvl); if (o.xp >= need) { o.xp -= need; o.lvl++; log(g, `📜 ${mById[id].name} reaches mastery level ${o.lvl}.`); }
  }
  if (g.auto) while (g.layer < 9 && g.qi >= cost(g)) tryBreak(g, st);
  if (g.layer === 9 && g.autoBt && g.qi >= cost(g) && g.realm < REALM.length - 1) tryBreak(g, gstats(g));
  const cp = cost(g); if (g.qi > cp) g.qi = cp;
  if (g.exp && g.t >= g.exp.end) finishExp(g, st);
  if (g.event === null && g.t >= g.nextEv && !offline) newEvent(g);
  if (g.age >= st.life) reborn(g, 'died');
}
function catchUp(g) {
  const now = Date.now(); let dt = (now - g.t) / 1000;
  if (dt < 0) { g.t = now; return; }
  if (dt > 2.5) {
    const away = Math.min(dt, 12 * 3600), r0 = g.realm, s0 = g.stones;
    let left = away; const step = Math.max(5, away / 1500);
    while (left > 0) { const d = Math.min(step, left); advance(g, d, true); left -= d; }
    if (g.event === null && away > 120) newEvent(g);
    g.t = now;
    if (away > 60) log(g, `🌙 While you were away (${tf(away)}) your cultivation continued.${g.realm > r0 ? ' You advanced a realm.' : ''}`);
  } else advance(g, dt, false);
  g.t = now;
}

// ---------- UI ----------
let gOpen = false, gTab = 'cult', gLast = 0, gDown = false, gMsg = '', gMsgT = 0;
const GTABS = [['cult', '☯', 'Cultivate'], ['man', '📜', 'Manuals'], ['body', '🧬', 'Body'], ['dao', '🌀', 'Dao'], ['alch', '⚗️', 'Alchemy'], ['quest', '⚔️', 'Quests'], ['heart', '🔄', 'Rebirth'], ['self', '🪪', 'Self'], ['world', '🏯', 'World']];
const gmsg = t => { gMsg = t; gMsgT = Date.now() + 3000; const el = document.getElementById('gm-msg'); if (el) { el.textContent = t; el.classList.add('on'); } };
const bar = (k, p) => `<div class="bar"><i data-w="${k}" style="width:${Math.min(100, Math.max(0, p))}%"></i></div>`;
const aff = ok => ok ? '' : ' short';

function vCult(g, st) {
  if (!g.path) return pathPick(g, true);
  const need = cost(g), top = g.realm === REALM.length - 1, last = top && g.layer === 9;
  const rdy = g.qi >= need, P = PATH[g.path];
  const act = last ? `<button class="pri big" data-g="ascend"${rdy ? '' : ' disabled'}>✨ Ascend beyond the world</button>`
    : g.layer < 9 ? `<button class="big" data-g="adv"${rdy && !g.auto ? '' : ' disabled'}>${g.auto ? 'Auto-advancing' : 'Advance to layer ' + (g.layer + 1)}</button>`
      : `<button class="pri big" data-g="adv"${rdy ? '' : ' disabled'}>⚡ Attempt Breakthrough · ${Math.round(st.bt)}%</button>`;
  const ev = (g.meta.id.name ? '' : `<button class="fate" data-g="tab" data-id="self">🪪 Create your character: give your cultivator a name and a past</button>`) + (g.event !== null ? `<button class="fate" data-g="tab" data-id="quest">🎴 A fate encounter awaits: ${EVENTS[g.event][0]}</button>` : '');
  return `<div class="card gcard">
    <div class="aura" data-g="tap" role="button" aria-label="Circulate Qi" style="--h:${(g.realm * 31 + 20) % 360}"><i></i><i></i><i></i><span>${REALM[g.realm][1]}</span></div>
    <h2 class="gt">${esc(g.meta.id.name || REALM[g.realm][0])}</h2>
    <p class="center acc tiny" style="margin:0">${g.meta.id.name ? esc(REALM[g.realm][0]) + (g.meta.id.epithet ? ' · ' + esc(g.meta.id.epithet) : '') + ' · ' : ''}${LOC[g.realm]}</p>
    <p class="center dim">Layer ${g.layer} of 9 · ${P[0]} ${P[1]} · ${PHYS[g.phys][1]}</p>
    ${bar('qi', g.qi / need * 100)}
    <div class="row sb"><span><b data-b="qi">${nf(g.qi)}</b> / ${nf(need)} Qi</span><span class="dim">+<b data-b="qps">${nf(st.qps)}</b>/s${st.buffOn ? ' ✨×2' : ''}</span></div>
    <p class="center dim tiny">Tap the circle to circulate Qi. Real-life Qi boosts your gain ×${LB.toFixed(2)}.</p>
    <div class="gact">${act}</div>
    <div class="row"><label class="chip${g.auto ? ' on' : ''}" data-g="auto">Auto layers ${g.auto ? 'on' : 'off'}</label>${g.layer === 9 && !last ? `<label class="chip${g.autoBt ? ' on' : ''}" data-g="autobt">Auto breakthrough ${g.autoBt ? 'on' : 'off'}</label>` : ''}</div>
  </div>
  ${ev}
  <div class="card gcard"><div class="row sb"><b>Lifespan</b><span class="dim"><span data-b="age">${yrs(g.age)}</span> / ${yrs(st.life)} years</span></div>${bar('age', g.age / st.life * 100)}
    <div class="gstats"><span>⚔️ Power <b>${nf(st.pow)}</b></span><span>🎯 Break <b>${Math.round(st.bt)}%</b></span><span>🔮 Karma <b>${nf(g.meta.karma)}</b></span></div></div>
  <div class="card gcard"><h2>Chronicle of the Dao</h2>${g.log.slice(0, 7).map(l => `<p class="glog">${esc(l)}</p>`).join('') || '<p class="dim">Your journey is just beginning.</p>'}</div>`;
}
function pathPick(g, first) {
  const lock = g.path && !(g.realm === 0 && g.layer <= 2);
  return `<div class="card gcard"><h2>${first ? 'Choose your Path' : 'Your Path'}</h2><p class="dim">${first ? 'Every cultivator walks a road. Choose how your story begins.' : lock ? 'Your path is set for this life. You may choose anew when you are reborn.' : 'You may still change your path early in this life.'}</p>
    ${Object.entries(PATH).map(([id, p]) => `<button class="citem${g.path === id ? ' sel' : ''}" data-g="path" data-id="${id}"${lock && g.path !== id ? ' disabled' : ''}><span class="em">${p[0]}</span><span class="gr"><b>${p[1]}</b><small class="wrap">${p[2]}</small><small class="wrap acc">${sText(p[3])}</small></span></button>`).join('')}</div>`;
}
function vMan(g, st) {
  const M = g.meta, r = g.realm;
  const sect = sl => {
    const cap = SLOTS[sl](r), eq = M.eq[sl];
    const own = MAN_ARR.filter(m => m.slot === sl && M.man[m.id]), shop = MAN_ARR.filter(m => m.slot === sl && !M.man[m.id] && !m.secret), sec = MAN_ARR.filter(m => m.slot === sl && !M.man[m.id] && m.secret);
    const card = m => {
      const o = M.man[m.id], on = eq.includes(m.id);
      return `<div class="mcard g${m.g}${on ? ' on' : ''}"><div class="row sb"><b>${m.name}</b><small class="gl">${GRADE[m.g]}${m.el ? ' · ' + m.el : ''}</small></div>
        <small class="wrap acc">${sText(m.s, 1 + .15 * o.lvl)}</small>
        <div class="row sb"><small class="dim">Mastery ${o.lvl}/9</small><button data-g="${on ? 'uneq' : 'eq'}" data-id="${m.id}">${on ? 'Unequip' : 'Equip'}</button></div>
        ${o.lvl < 9 ? bar('m' + m.id, o.xp / mastery(m.id, o.lvl) * 100) : ''}</div>`;
    };
    const buy = m => { const ok = r >= m.req; return `<div class="mcard g${m.g} shop"><div class="row sb"><b>${m.name}</b><small class="gl">${GRADE[m.g]}${m.el ? ' · ' + m.el : ''}</small></div>
      <small class="wrap acc">${sText(m.s)}</small>
      <div class="row sb"><small class="dim">${ok ? '' : 'Needs ' + REALM[m.req][0]}</small><button data-g="buy" data-id="${m.id}"${ok ? '' : ' disabled'} class="${aff(g.stones >= mPrice(m))}">💎 ${nf(mPrice(m))}</button></div></div>`; };
    return `<div class="card gcard"><div class="row sb"><h2>${SLOTN[sl]}s</h2><span class="dim">${eq.length} / ${cap} equipped</span></div>
      ${own.map(card).join('')}${shop.map(buy).join('')}
      ${sec.length ? `<p class="dim center tiny">${sec.length} secret manual${sec.length > 1 ? 's' : ''} lie hidden in this category. Find them on quests and fate encounters.</p>` : ''}</div>`;
  };
  return ['qi', 'art', 'aux'].map(sect).join('');
}
function vBody(g, st) {
  const M = g.meta, r = g.realm;
  const ph = Object.entries(PHYS).map(([id, p]) => {
    const own = M.phys[id], on = g.phys === id, lv = own || 0, up = ESSR(r) * 300 * Math.pow(lv, 1.5), cst = p[2] === 0 && p[3] === 0 ? 0 : ESSR(p[2]) * p[3];
    let btn;
    if (own) btn = `${on ? '<b class="acc">Active</b>' : `<button data-g="phys" data-id="${id}">Embody</button>`} ${lv < 9 && id !== 'mortal' ? `<button data-g="plv" data-id="${id}" class="${aff(g.ess >= up)}">🩸 ${nf(up)} ▲</button>` : ''}`;
    else if (id === 'chaos') btn = `<button data-g="pun" data-id="${id}" class="${aff(M.karma >= 150)}">🔮 150 Karma</button>`;
    else btn = `<button data-g="pun" data-id="${id}"${r >= p[2] ? '' : ' disabled'} class="${aff(g.ess >= cst)}">${r >= p[2] ? '🩸 ' + nf(cst) : 'Needs ' + REALM[p[2]][0]}</button>`;
    return `<div class="mcard${on ? ' on' : ''}"><div class="row sb"><b>${p[0]} ${p[1]}</b>${own ? `<small class="gl">Lv ${lv}/9</small>` : ''}</div>
      <small class="wrap dim">${p[5]}</small><small class="wrap acc">${Object.keys(p[4]).length ? sText(p[4], 1 + .12 * (Math.max(lv, 1) - 1)) : 'No bonus'}</small><div class="row sb"><span></span><span>${btn}</span></div></div>`;
  }).join('');
  const nx = MER[g.mer];
  const mer = `<div class="card gcard"><div class="row sb"><h2>Meridians</h2><span class="dim">${g.mer} / ${MER.length} opened</span></div>
    <p class="dim tiny">Open your meridians in order using Essence. They reset when you are reborn.</p>
    <div class="mgrid">${MER.map((m, i) => `<span class="mdot${i < g.mer ? ' on' : i === g.mer ? ' next' : ''}" title="${esc(m.n)}">${i + 1}</span>`).join('')}</div>
    ${nx ? `<div class="mcard"><b>${nx.n}</b><small class="wrap acc">${sText(nx.s)}</small><div class="row sb"><small class="dim">${r >= nx.req ? '' : 'Needs ' + REALM[nx.req][0]}</small><button data-g="mer"${r >= nx.req ? '' : ' disabled'} class="${aff(g.ess >= nx.cost)}">🩸 ${nf(nx.cost)}</button></div></div>` : '<p class="center dim">All meridians are open.</p>'}</div>`;
  return mer + `<div class="card gcard"><h2>Physiques</h2><p class="dim tiny">Unlocked physiques are yours forever. Temper them with Essence to strengthen them.</p>${ph}</div>`;
}
function vDao(g, st) {
  const sl = daoSlots(g);
  return `<div class="card gcard"><div class="row sb"><h2>Dao Comprehension</h2><span class="dim">${g.chosen.length} / ${sl} walked</span></div>
    <p class="dim tiny">Insight deepens a Dao. Only the Daos you walk grant their power. More slots open as you rise. Certain pairs resonate once both reach level 3.</p>
    <div class="gins">👁️ Insight <b data-b="ins">${nf(g.ins)}</b></div></div>
    ${Object.entries(DAO).map(([id, d]) => { const l = g.dao[id] || 0, on = g.chosen.includes(id), c = daoCost(g, id); return `<div class="mcard${on ? ' on' : ''}"><div class="row sb"><b>${d[0]} ${d[1]} Dao</b><small class="gl">Level ${l}/9</small></div>
      <small class="wrap acc">${sText(d[2], Math.max(1, l) * (1 + .6 * g.realm * 0 + 0))} per level${l ? ' (now ' + sText(Object.fromEntries(Object.entries(d[2]).map(([k, v]) => [k, v * l * (k === 'bt' || k === 'life' ? 1 : 1 + .6 * g.realm)]))) + ')' : ''}</small>
      <div class="row sb"><button data-g="walk" data-id="${id}" class="${on ? 'on' : ''}">${on ? 'Walking ✓' : 'Walk this Dao'}</button>${l < 9 ? `<button data-g="dao" data-id="${id}" class="${aff(g.ins >= c)}">👁️ ${nf(c)} ▲</button>` : '<b class="acc">Mastered</b>'}</div></div>`; }).join('')}
    <div class="card gcard"><h2>Resonances</h2>${SYN.map(([a, c, s]) => { const on = g.chosen.includes(a) && g.chosen.includes(c) && (g.dao[a] || 0) >= 3 && (g.dao[c] || 0) >= 3; return `<p class="glog${on ? ' hot' : ''}">${DAO[a][0]}${DAO[c][0]} ${DAO[a][1]} + ${DAO[c][1]}: ${sText(s)}${on ? ' ✓' : ''}</p>`; }).join('')}</div>`;
}
function vAlch(g, st) {
  return `<div class="card gcard"><h2>Alchemy</h2><p class="dim tiny">Brew pills with herbs and spirit stones. Potency ×${st.pill.toFixed(2)}.</p>
    <div class="gins">🌿 Herbs <b data-b="herbs">${nf(g.herbs)}</b> &nbsp; 💎 Stones <b data-b="stones">${nf(g.stones)}</b></div></div>
    ${Object.entries(PILL).map(([id, p]) => { const h = Math.ceil(p[2] * (1 + .3 * g.realm)), s = STR(g.realm) * p[3], n = g.pills[id] || 0;
      return `<div class="mcard"><div class="row sb"><b>${p[0]} ${p[1]}</b><small class="gl">Owned ${n}</small></div><small class="wrap dim">${p[4]}</small>
      <div class="row sb"><button data-g="brew" data-id="${id}" class="${aff(g.herbs >= h && g.stones >= s)}">Brew · 🌿${nf(h)} 💎${nf(s)}</button><button data-g="use" data-id="${id}"${n ? '' : ' disabled'}>Consume</button></div></div>`; }).join('')}`;
}
function vQuest(g, st) {
  const E = g.event !== null ? EVENTS[g.event] : null;
  const evHtml = E ? `<div class="card gcard fatec"><h2>🎴 ${E[0]}</h2><p>${E[1]}</p>${E[2].map((c, i) => `<button class="citem" data-g="fate" data-id="${i}"><span class="gr"><b>${c[0]}</b></span></button>`).join('')}</div>`
    : `<div class="card gcard"><h2>🎴 Fate Encounters</h2><p class="dim">Wandering through the jianghu, fate will find you. Next stirring: <b data-b="nev">${tf((g.nextEv - g.t) / 1000)}</b></p></div>`;
  let ex;
  if (g.exp) ex = `<div class="card gcard"><h2>${ZONES[g.exp.z][1]} ${ZONES[g.exp.z][0]}</h2>${bar('exp', (g.t - g.exp.start) / (g.exp.end - g.exp.start) * 100)}
    <div class="row sb"><span class="dim">Returns in <b data-b="exp">${tf((g.exp.end - g.t) / 1000)}</b></span><span><label class="chip${g.exp.rep ? ' on' : ''}" data-g="rep">Repeat ${g.exp.rep ? 'on' : 'off'}</label> <button data-g="recall">Recall</button></span></div></div>`;
  else ex = '';
  return evHtml + ex + `<div class="card gcard"><h2>Expeditions</h2><p class="dim tiny">Send yourself to dangerous lands for stones, herbs, essence, insight and secret manuals. Your Power decides the odds.</p>
    ${ZONES.map((z, i) => { const ratio = st.pow / zPow(i), p = Math.round(Math.pow(ratio, 2.5) / (1 + Math.pow(ratio, 2.5)) * 100); return `<button class="citem" data-g="go" data-id="${i}"${g.exp ? ' disabled' : ''}><span class="em">${z[1]}</span><span class="gr"><b>${z[0]}</b><small class="wrap">${z[3]} · ${tf(zDur(i))} · Power ${nf(zPow(i))}</small></span><span class="odds${p >= 70 ? ' good' : p < 35 ? ' bad' : ''}">${p}%</span></button>`; }).join('')}</div>`;
}
function vHeart(g, st) {
  const M = g.meta, kk = karmaFor(g), top = g.realm === REALM.length - 1 && g.layer === 9;
  return pathPick(g) + `<div class="card gcard"><h2>Reincarnation</h2><p class="dim">Rebirth resets your realm, resources, meridians and Daos, but keeps your manuals, physiques and Karma. Reincarnate now for <b>+${kk} Karma</b>. You are on life ${M.lives}${M.asc ? ` · ascended ${M.asc}×` : ''}.</p>
    <button class="big" data-g="reborn">🔄 Reincarnate (+${kk} Karma)</button>${top ? `<button class="pri big" data-g="ascend">✨ Ascend (+${karmaFor(g, true)} Karma, permanent +25% Qi)</button>` : ''}</div>
    <div class="card gcard"><div class="row sb"><h2>Karma Shrine</h2><span class="dim">🔮 ${nf(M.karma)} Karma</span></div>
    ${Object.entries(KUP).map(([id, k]) => { const l = M.ups[id] || 0, c = kCost(id, l); return `<div class="mcard"><div class="row sb"><b>${k[0]} ${k[1]}</b><small class="gl">${l}/${k[3]}</small></div><small class="wrap dim">${k[2]}</small>
      <div class="row sb"><span></span>${l < k[3] ? `<button data-g="kup" data-id="${id}" class="${aff(M.karma >= c)}">🔮 ${c}</button>` : '<b class="acc">Max</b>'}</div></div>`; }).join('')}</div>`;
}
function vSelf(g, st) {
  const M = g.meta, I = M.id, pick = (T, key, act) => Object.entries(T).map(([id, o]) => `<button class="citem${I[key] === id ? ' sel' : ''}" data-g="${act}" data-id="${id}"><span class="em">${o[0]}</span><span class="gr"><b>${o[1]}</b><small class="wrap">${o[2]}</small><small class="wrap acc">${sText(o[3])}</small></span></button>`).join('');
  return `<div class="card gcard"><h2>Your Character</h2><p class="dim tiny">Who are you in the jianghu? Write your own story; the world will answer.</p>
    <label class="fl">Name</label><input id="id-name" maxlength="30" value="${esc(I.name)}" placeholder="e.g. Lan Wuxian">
    <label class="fl">Epithet / Dao name</label><input id="id-ep" maxlength="40" value="${esc(I.epithet)}" placeholder="e.g. Wanderer of the Green Mist">
    <label class="fl">Motto</label><input id="id-motto" maxlength="80" value="${esc(I.motto)}" placeholder="e.g. The mountain does not hurry">
    <label class="fl">Backstory</label><textarea id="id-story" rows="4" maxlength="800" placeholder="Where were you born? What do you seek?">${esc(I.story)}</textarea>
    <button class="pri big" data-g="ident">Save character</button></div>
    <div class="card gcard"><h2>Origin</h2>${pick(ORIG, 'origin', 'orig')}</div>
    <div class="card gcard"><h2>Temperament</h2>${pick(TEMP, 'temper', 'temp')}</div>
    <div class="card gcard"><div class="row sb"><h2>Legend of ${esc(nm(g))}</h2><span class="dim tiny">${M.legend.length} entries</span></div>
      <textarea id="leg-in" rows="2" maxlength="300" placeholder="Record a moment of your story..."></textarea><button data-g="legadd" class="big">Add to Legend</button>
      ${M.legend.slice(0, 20).map(l => `<p class="glog"><span class="dim">${l.d}</span> ${esc(l.t)}</p>`).join('') || '<p class="dim">Your legend is yet unwritten.</p>'}</div>`;
}
function vWorld(g, st) {
  const M = g.meta, S_ = M.sect, al = M.al;
  let sect;
  if (S_ && SECT[S_.id]) {
    const sc = SECT[S_.id], nx = RANKS[S_.rank + 1];
    sect = `<div class="card gcard"><div class="row sb"><h2>${sc[0]} ${sc[1]}</h2><span class="dim">${RANKS[S_.rank][0]}</span></div><p class="dim tiny">${sc[2]}</p>
      <small class="wrap acc">${sText(sc[3], S_.rank + 1)}</small>
      <div class="row sb"><span>Contribution <b data-b="contrib">${nf(S_.c)}</b></span><span class="dim tiny">${nx ? 'Next: ' + nx[0] : 'Highest rank'}</span></div>
      ${nx ? `<button class="big${aff(S_.c >= nx[2] && g.realm >= nx[1])}" data-g="promote">Seek promotion to ${nx[0]} · ${nf(nx[2])} contrib${g.realm >= nx[1] ? '' : ' · needs ' + REALM[nx[1]][0]}</button>` : ''}
      <div class="row"><button data-g="mission"${g.t < (S_.cd || 0) ? ' disabled' : ''}>📜 Sect mission</button><button data-g="leave">Leave sect</button></div></div>`;
  } else {
    sect = `<div class="card gcard"><h2>Sects of the Jianghu</h2><p class="dim tiny">Join a sect for lasting bonuses that grow with your rank. Rank and contribution are kept across reincarnations.</p>
      ${Object.entries(SECT).map(([id, s]) => `<button class="citem" data-g="join" data-id="${id}"><span class="em">${s[0]}</span><span class="gr"><b>${s[1]}</b><small class="wrap">${s[2]}</small><small class="wrap acc">${sText(s[3])} per rank</small></span></button>`).join('')}</div>`;
  }
  const bonds = `<div class="card gcard"><h2>Bonds</h2><p class="dim tiny">People you meet as you rise. Talk and share gifts to deepen bonds and gain their lasting favour.</p>
    ${Object.entries(NPC).map(([id, n]) => {
      if (g.meta.top < n[3] && g.realm < n[3]) return `<div class="mcard dim">❔ A figure waits beyond the ${REALM[n[3]][0]} realm.</div>`;
      const b = M.bonds[id] || { aff: 0 }, l = bondLv(M, id), cd = g.t < (b.cd || 0), gift = STR(g.realm) * 300;
      return `<div class="mcard${l >= 5 ? ' on' : ''}"><div class="row sb"><b>${n[0]} ${n[1]}</b><small class="gl">${n[2]} · Bond ${l}/5</small></div><small class="wrap dim">${n[4]}</small>
        <small class="wrap acc">${sText(n[5], Math.max(1, l))}${l ? '' : ' (at bond 1)'}</small>${l < 5 ? bar('b' + id, (b.aff % 60) / 60 * 100) : ''}
        <div class="row"><button data-g="talk" data-id="${id}"${cd ? ' disabled' : ''}>💬 Talk</button><button data-g="gift" data-id="${id}" class="${aff(g.stones >= gift)}">🎁 Gift 💎${nf(gift)}</button>${id === 'han' ? `<button data-g="spar" data-id="han"${g.t < (b.cd2 || 0) ? ' disabled' : ''}>⚔️ Spar (${Math.round(Math.pow(st.pow / rivalPow(g), 2.5) / (1 + Math.pow(st.pow / rivalPow(g), 2.5)) * 100)}%)</button>` : ''}</div></div>`;
    }).join('')}</div>`;
  return `<div class="card gcard"><h2>Standing in the World</h2><p class="center gt" style="font-size:1.05rem">${alLbl(al)}</p>
    <div class="altrack"><i style="left:${(al + 100) / 2}%"></i></div><div class="row sb tiny dim"><span>Demonic</span><span>Neutral</span><span>Righteous</span></div>
    <p class="dim tiny">Your choices in fate encounters shape your reputation. ${al >= 25 ? 'The orthodox world favours you (+breakthrough).' : al <= -25 ? 'Heterodox power flows through you (+Qi, +attack).' : 'Reach 25 either way to earn a boon.'}</p></div>` + sect + bonds;
}
const VIEWS = { cult: vCult, man: vMan, body: vBody, dao: vDao, alch: vAlch, quest: vQuest, heart: vHeart, self: vSelf, world: vWorld };

function gRender() {
  const root = document.getElementById('gm'); if (!root) return;
  const g = G(), st = gstats(g);
  root.querySelector('#gm-GTABS').innerHTML = GTABS.map(t => `<button class="chip${gTab === t[0] ? ' on' : ''}" data-g="tab" data-id="${t[0]}">${t[1]} ${t[2]}${t[0] === 'quest' && g.event !== null ? ' <i class="dot"></i>' : ''}</button>`).join('');
  root.querySelector('#gm-body').innerHTML = VIEWS[gTab](g, st);
  gLive(); gLast = Date.now();
}
function gLive() {
  const root = document.getElementById('gm'); if (!root) return;
  const g = G(), st = gstats(g), set = (k, v) => root.querySelectorAll(`[data-b="${k}"]`).forEach(e => { if (e.textContent !== v) e.textContent = v; });
  set('qi', nf(g.qi)); set('qps', nf(st.qps)); set('age', yrs(g.age)); set('ins', nf(g.ins)); set('herbs', nf(g.herbs)); set('stones', nf(g.stones));
  set('nev', tf((g.nextEv - g.t) / 1000)); if (g.meta.sect) set('contrib', nf(g.meta.sect.c)); if (g.exp) set('exp', tf((g.exp.end - g.t) / 1000));
  const w = (k, p) => root.querySelectorAll(`[data-w="${k}"]`).forEach(e => e.style.width = Math.min(100, Math.max(0, p)) + '%');
  const need = cost(g); w('qi', g.qi / need * 100); w('age', g.age / st.life * 100); if (g.exp) w('exp', (g.t - g.exp.start) / (g.exp.end - g.exp.start) * 100);
  const res = root.querySelector('#gm-res'); if (res) res.innerHTML = `<span>💎 ${nf(g.stones)}</span><span>🌿 ${nf(g.herbs)}</span><span>🩸 ${nf(g.ess)}</span><span>👁️ ${nf(g.ins)}</span><span>🔮 ${nf(g.meta.karma)}</span>`;
  if (gMsg && Date.now() > gMsgT) { const m = document.getElementById('gm-msg'); if (m) m.classList.remove('on'); gMsg = ''; }
}
function gOpenUI() {
  if (document.getElementById('gm')) return;
  const root = document.createElement('div'); root.id = 'gm'; root.className = 'gm';
  root.innerHTML = `<div class="gm-top"><button class="back sm" data-g="close" aria-label="Close">‹</button><b class="gm-title">Dao Path <small>道途</small></b><span class="dim gm-life">Life Qi ×${LB.toFixed(2)}</span></div>
    <div id="gm-res" class="gm-res"></div><div id="gm-GTABS" class="gm-GTABS filters"></div><div id="gm-msg" class="gm-msg"></div><div id="gm-body" class="gm-body"></div>`;
  document.body.appendChild(root); document.body.classList.add('gm-open'); gOpen = true; gRender();
  root.addEventListener('pointerdown', () => { gDown = true; });
  const up = () => setTimeout(() => { gDown = false; }, 150);
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-g]'); if (!el || el.disabled) return;
    const a = el.dataset.g, f = GA[a]; if (!f) return;
    const g = G(); catchUp(g); f(el, g, gstats(g));
    save(); if (a !== 'tap') gRender(); else gLive();
  });
}
function gClose() { const r = document.getElementById('gm'); if (r) r.remove(); document.body.classList.remove('gm-open'); gOpen = false; save(); }
const gSpend = (g, k, n, what) => { if (g[k] >= n) { g[k] -= n; return true; } gmsg(`Not enough ${what}.`); return false; };

const GA = {
  close() { gClose(); },
  ident(el, g) {
    const v = id => (document.getElementById(id) || {}).value || '', I = g.meta.id, was = I.name;
    I.name = v('id-name').trim().slice(0, 30); I.epithet = v('id-ep').trim().slice(0, 40); I.motto = v('id-motto').trim().slice(0, 80); I.story = v('id-story').trim().slice(0, 800);
    if (I.name && !was) leg(g, `${I.name} set out upon the Dao.`); gmsg('Character saved.');
  },
  orig(el, g) { g.meta.id.origin = el.dataset.id; leg(g, `${nm(g)} is of origin: ${ORIG[el.dataset.id][1]}.`); },
  temp(el, g) { g.meta.id.temper = el.dataset.id; },
  legadd(el, g) { const t = ((document.getElementById('leg-in') || {}).value || '').trim(); if (t) { leg(g, t); gmsg('Added to your Legend.'); } },
  join(el, g) { const id = el.dataset.id; g.meta.sect = { id, rank: 0, c: 0, cd: 0 }; leg(g, `${nm(g)} joined the ${SECT[id][1]}.`); if (SECT[id][4]) g.meta.al = Math.max(-100, Math.min(100, g.meta.al + SECT[id][4] * 10)); },
  leave(el, g) { if (confirm('Leave your sect? Your rank and contribution will be lost.')) { leg(g, `${nm(g)} left the ${SECT[g.meta.sect.id][1]}.`); g.meta.sect = null; } },
  promote(el, g) {
    const s = g.meta.sect, n = RANKS[s.rank + 1]; if (!n) return;
    if (g.realm < n[1]) return gmsg('Your realm is too low for this rank.'); if (s.c < n[2]) return gmsg('Not enough contribution.');
    s.c -= n[2]; s.rank++; log(g, `🏯 You are promoted to ${n[0]}.`); leg(g, `${nm(g)} was promoted to ${n[0]} of the ${SECT[s.id][1]}.`);
  },
  mission(el, g, st) {
    const s = g.meta.sect; if (g.t < s.cd) return;
    const c = 40 * (1 + g.realm) * (1 + s.rank * .5), sg = st.stone * 90; s.c += c; g.stones += sg; s.cd = g.t + 60000;
    log(g, `📜 Sect mission done: +${nf(c)} contribution, +${nf(sg)} stones.`); gmsg('Mission complete.');
  },
  talk(el, g) {
    const id = el.dataset.id, b = g.meta.bonds[id] = g.meta.bonds[id] || { aff: 0 }; if (g.t < (b.cd || 0)) return;
    const before = bondLv(g.meta, id); b.aff += 8; b.cd = g.t + 20000; const n = NPC[id];
    gmsg(`${n[1]}: ${n[6][Math.floor(Math.random() * n[6].length)]}`);
    if (bondLv(g.meta, id) > before) { log(g, `💞 Your bond with ${n[1]} deepens (${bondLv(g.meta, id)}/5).`); leg(g, `${nm(g)} grew closer to ${n[1]}, the ${n[2]}.`); }
  },
  gift(el, g) {
    const id = el.dataset.id, b = g.meta.bonds[id] = g.meta.bonds[id] || { aff: 0 }, c = STR(g.realm) * 300; if (!gSpend(g, 'stones', c, 'spirit stones')) return;
    const before = bondLv(g.meta, id); b.aff += 30; const n = NPC[id];
    gmsg(`${n[1]} accepts your gift graciously.`);
    if (bondLv(g.meta, id) > before) { log(g, `💞 Your bond with ${n[1]} deepens (${bondLv(g.meta, id)}/5).`); leg(g, `${nm(g)} grew closer to ${n[1]}, the ${n[2]}.`); }
  },
  spar(el, g, st) {
    const b = g.meta.bonds.han = g.meta.bonds.han || { aff: 0 }; if (g.t < (b.cd2 || 0)) return;
    const r = Math.pow(st.pow / rivalPow(g), 2.5), win = Math.random() < r / (1 + r); b.cd2 = g.t + 60000;
    if (win) { b.aff += 15; const v = st.ins * 120; g.ins += v; log(g, `⚔️ You best Han Feng in a spar. +${nf(v)} insight.`); gmsg('Victory! Han Feng grudgingly nods.'); }
    else { b.aff += 5; g.age = Math.min(g.age + 1, st.life - 1); log(g, '⚔️ Han Feng defeats you, but respects your effort.'); gmsg('Defeated, but your rival respects you.'); }
  },
  tab(el) { gTab = el.dataset.id; },
  tap(el, g, st) { g.qi = Math.min(cost(g), g.qi + st.qps * 3); },
  adv(el, g, st) { tryBreak(g, st); },
  auto(el, g) { g.auto = !g.auto; },
  autobt(el, g) { g.autoBt = !g.autoBt; },
  path(el, g) { if (!g.path || (g.realm === 0 && g.layer <= 2)) { g.path = el.dataset.id; gTab = 'cult'; } },
  eq(el, g) { const m = mById[el.dataset.id], eq = g.meta.eq[m.slot]; if (eq.length >= SLOTS[m.slot](g.realm)) return gmsg('No free slot. Unequip one first.'); eq.push(m.id); },
  uneq(el, g) { const m = mById[el.dataset.id], eq = g.meta.eq[m.slot]; if (m.slot === 'qi' && eq.length === 1) return gmsg('You need a cultivation manual equipped.'); eq.splice(eq.indexOf(m.id), 1); },
  buy(el, g) { const m = mById[el.dataset.id]; if (g.realm < m.req || !gSpend(g, 'stones', mPrice(m), 'spirit stones')) return; g.meta.man[m.id] = { xp: 0, lvl: 0 }; log(g, `📜 You learn "${m.name}".`); },
  mer(el, g) { const n = MER[g.mer]; if (n && g.realm >= n.req && gSpend(g, 'ess', n.cost, 'essence')) { g.mer++; log(g, `🧬 You open the ${n.n}.`); } },
  phys(el, g) { if (g.meta.phys[el.dataset.id]) g.phys = el.dataset.id; },
  pun(el, g) {
    const id = el.dataset.id, p = PHYS[id]; if (g.meta.phys[id]) return;
    if (id === 'chaos') { if (g.meta.karma < 150) return gmsg('You need 150 Karma.'); g.meta.karma -= 150; }
    else if (g.realm < p[2] || !gSpend(g, 'ess', ESSR(p[2]) * p[3], 'essence')) return;
    g.meta.phys[id] = 1; g.phys = id; log(g, `🧬 You awaken the ${p[1]}.`);
  },
  plv(el, g) { const id = el.dataset.id, l = g.meta.phys[id]; if (l && l < 9 && gSpend(g, 'ess', ESSR(g.realm) * 300 * Math.pow(l, 1.5), 'essence')) g.meta.phys[id]++; },
  walk(el, g) {
    const id = el.dataset.id, i = g.chosen.indexOf(id);
    if (i >= 0) g.chosen.splice(i, 1); else if (g.chosen.length >= daoSlots(g)) gmsg('No free Dao slot. Stop walking another Dao first.'); else g.chosen.push(id);
  },
  dao(el, g) { const id = el.dataset.id; if ((g.dao[id] || 0) < 9 && gSpend(g, 'ins', daoCost(g, id), 'insight')) g.dao[id] = (g.dao[id] || 0) + 1; },
  brew(el, g) { const id = el.dataset.id, p = PILL[id]; if (g.herbs < Math.ceil(p[2] * (1 + .3 * g.realm)) || g.stones < STR(g.realm) * p[3]) return gmsg('Not enough herbs or stones.'); g.herbs -= Math.ceil(p[2] * (1 + .3 * g.realm)); g.stones -= STR(g.realm) * p[3]; g.pills[id] = (g.pills[id] || 0) + 1; },
  use(el, g, st) { const id = el.dataset.id; if (!g.pills[id]) return; g.pills[id]--; PILL[id][5](g, st, st.pill); gmsg(PILL[id][1] + ' consumed.'); },
  go(el, g) { if (!g.exp) startExp(g, +el.dataset.id, false); },
  rep(el, g) { if (g.exp) g.exp.rep = !g.exp.rep; },
  recall(el, g) { g.exp = null; },
  fate(el, g, st) {
    const E = EVENTS[g.event]; if (!E) return; const ch = E[2][+el.dataset.id]; let r = Math.random() * ch[1].reduce((a, o) => a + o[0], 0), pick = ch[1][0];
    for (const o of ch[1]) { if (r < o[0]) { pick = o; break; } r -= o[0]; }
    const out = fx(g, st, pick[1]); g.event = null; g.nextEv = g.t + (240 + Math.random() * 180) * 1000;
    log(g, `🎴 ${E[0]}: ${pick[2]}${out ? ' (' + out + ')' : ''}`); gmsg(pick[2]);
  },
  reborn(el, g) { if (confirm(`Reincarnate now for +${karmaFor(g)} Karma? You will restart at the beginning of your path.`)) { reborn(g, 'reborn'); gTab = 'cult'; } },
  ascend(el, g) { if (g.realm === REALM.length - 1 && g.layer === 9 && g.qi >= cost(g) && confirm('Ascend beyond the world? You are reborn with a large Karma reward and a permanent +25% Qi bonus.')) { reborn(g, 'ascend'); gTab = 'cult'; } },
  kup(el, g) { const id = el.dataset.id, l = g.meta.ups[id] || 0, c = kCost(id, l); if (l < KUP[id][3] && gSpend(g.meta, 'karma', c, 'Karma')) g.meta.ups[id] = l + 1; }
};

// ---------- loop & wiring ----------
let sv = 0;
function gTick() {
  if (typeof S === 'undefined' || !S) return;
  try {
    LB = Math.min(4, 1 + qi() / 1000);
    const g = G(), before = g.realm; catchUp(g);
    if (Date.now() - sv > 10000) { save(); sv = Date.now(); }
    if (gOpen) { if (!gDown && Date.now() - gLast > 3000 && !document.activeElement.matches('input,textarea,select')) gRender(); else gLive(); }
    if (g.realm !== before) { /* achievements refresh on next render */ }
  } catch (e) { console.error(e); }
}
setInterval(gTick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) gTick(); else { try { save(); } catch (e) { } } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && gOpen) gClose(); });
document.addEventListener('click', e => { if (e.target.closest('#dao-btn')) { LB = Math.min(4, 1 + qi() / 1000); catchUp(G()); gOpenUI(); } });
ACH.push(
  ['dao1', '☯️', 'Walker of the Dao', 'Reach Qi Condensation in the Dao Path', () => G().meta.top, 1],
  ['dao3', '🟡', 'Golden Core', 'Reach Core Formation in the Dao Path', () => G().meta.top, 3],
  ['dao6', '🌌', 'Void Walker', 'Reach Void Refinement in the Dao Path', () => G().meta.top, 6],
  ['dao10', '🌟', 'True Immortal', 'Reach True Immortal in the Dao Path', () => G().meta.top, 10],
  ['daore', '🔄', 'Wheel of Rebirth', 'Reincarnate in the Dao Path', () => G().meta.lives - 1, 1],
  ['daoasc', '✨', 'Beyond the World', 'Ascend in the Dao Path', () => G().meta.asc, 1],
  ['daophy', '🧬', 'Many Bodies', 'Unlock 5 physiques', () => Object.keys(G().meta.phys).length, 5],
  ['daoid', '🪪', 'A Name Among Names', 'Create your Dao Path character', () => G().meta.id.name ? 1 : 0, 1],
  ['daosect', '🏯', 'Disciple', 'Join a sect in the Dao Path', () => G().meta.sect ? 1 : 0, 1],
  ['daobond', '💞', 'Sworn Bond', 'Reach bond 5 with someone', () => Math.max(0, ...Object.keys(NPC).map(i => bondLv(G().meta, i))), 5],
  ['daolegend', '📖', 'Legend in the Making', 'Write 20 legend entries', () => G().meta.legend.length, 20]
);
