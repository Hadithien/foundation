'use strict';
// Foundation extras: More menu, achievements, stats, seasonal quests, herbarium, sky & light, journal prompts.
// Loaded before app.js; everything here only touches app globals lazily (at call time).

let moreSub = '', jdraft = '', pidx = 0;
const QUEST_QI = 50, HERB_QI = 8;
const questQi = () => Object.keys(S.quests || {}).length * QUEST_QI;
const herbQi = () => (S.herb || []).reduce((a, x) => a + (x.qi ?? HERB_QI), 0);

// ---------- seasonal quests ----------
const QUESTS = {
  Imbolc: 'Light a candle at dusk and write down three things you wish to begin.',
  Ostara: 'Plant a seed or bring fresh greenery indoors, and name what you are growing within yourself.',
  Beltane: 'Spend an hour outdoors among blooming things and leave a small offering of water or song.',
  Litha: 'Greet the sunrise or watch the sunset, then sit quietly for ten minutes in the long light.',
  Lughnasadh: 'Bake or share bread, or harvest something, and give thanks for a skill you have grown.',
  Mabon: 'Walk among falling leaves, gather one, and reflect on balance and what you are ready to release.',
  Samhain: 'Sit in the dark with a single flame and remember someone who walked before you.',
  Yule: 'Bring evergreen indoors and keep a quiet vigil for the returning sun.'
};
const QWIN = 3; // quest is open this many days either side of the festival
function questList(d = new Date()) {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate()), y = d.getFullYear();
  return WHEEL.map(w => {
    const date = new Date(y, w[0] - 1, w[1]), diff = Math.round((date - base) / 864e5), key = `${y}-${w[2]}`;
    const state = S.quests && S.quests[key] ? 'done' : Math.abs(diff) <= QWIN ? 'open' : diff > 0 ? 'soon' : 'missed';
    return { name: w[2], key, date, diff, state, text: QUESTS[w[2]] };
  });
}
const openQuest = () => questList().find(x => x.state === 'open');

// ---------- journal prompts ----------
const PHASE_PROMPTS = {
  'New Moon': 'What seed of intention do you wish to plant in the dark?',
  'Waxing Crescent': 'What small step can you take today to feed that intention?',
  'First Quarter': 'Where do you face resistance, and how might you bend like bamboo?',
  'Waxing Gibbous': 'What needs refining before your work comes to fullness?',
  'Full Moon': 'What has come to light? What are you grateful for?',
  'Waning Gibbous': 'What wisdom have you gathered that is worth sharing?',
  'Last Quarter': 'What are you ready to release or forgive?',
  'Waning Crescent': 'Where do you need rest, stillness and surrender?'
};
function prompts() {
  const m = moon(), t = tree(), f = nextFestival();
  return [
    [m.icon, `${m.name}: ${PHASE_PROMPTS[m.name]}`],
    ['🌳', `${t[2]} (${t[3].toLowerCase()}): where does this quality show up in your life today?`],
    ['🔥', f.days === 0 ? `It is ${f.name}. What does this turning of the wheel ask of you?` : `${f.name} is ${f.days} days away. How will you prepare for it, inwardly and outwardly?`]
  ];
}
const curPrompt = () => { const p = prompts(); return p[pidx % p.length]; };
function promptBlock() {
  const p = curPrompt();
  return `<p class="prompt">${p[0]} <i>${esc(p[1])}</i><br><button data-act="useprompt">Use prompt</button> <button data-act="nextprompt">Another</button></p>`;
}
document.addEventListener('input', e => { if (e.target.id === 'jt') jdraft = e.target.value; });

// ---------- sun and light (offline) ----------
function sunTimes(date, lat, lon) {
  const rad = Math.PI / 180, mod = (a, n) => ((a % n) + n) % n;
  const N = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 864e5);
  const calc = rising => {
    const lh = lon / 15, t = N + ((rising ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    const L = mod(M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634, 360);
    let RA = mod(Math.atan(0.91764 * Math.tan(L * rad)) / rad, 360);
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    const sd = 0.39782 * Math.sin(L * rad), cd = Math.cos(Math.asin(sd));
    const ch = (Math.cos(90.833 * rad) - sd * Math.sin(lat * rad)) / (cd * Math.cos(lat * rad));
    if (ch > 1 || ch < -1) return null;
    const H = (rising ? 360 - Math.acos(ch) / rad : Math.acos(ch) / rad) / 15;
    const UT = mod(H + RA - 0.06571 * t - 6.622 - lh, 24);
    const base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const c = [-1, 0, 1].map(k => new Date(base + k * 864e5 + UT * 36e5))
      .find(x => x.getFullYear() === date.getFullYear() && x.getMonth() === date.getMonth() && x.getDate() === date.getDate());
    return c || null;
  };
  return { rise: calc(true), set: calc(false) };
}
const hhmm = d => d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--';
const WX = c => c === 0 ? ['☀️', 'Clear'] : c <= 2 ? ['🌤️', 'Partly cloudy'] : c === 3 ? ['☁️', 'Overcast'] : c <= 48 ? ['🌫️', 'Fog'] :
  c <= 57 ? ['🌦️', 'Drizzle'] : c <= 67 ? ['🌧️', 'Rain'] : c <= 77 ? ['❄️', 'Snow'] : c <= 82 ? ['🌦️', 'Showers'] : c <= 86 ? ['🌨️', 'Snow showers'] : ['⛈️', 'Thunderstorm'];
const wxAdvice = c => c >= 95 ? 'Storm outside: stay in and listen to it from the window.' : c >= 51 && c <= 67 || c >= 80 && c <= 82 ? 'Soft rain: a day for tea, brush and book.' :
  c >= 71 && c <= 86 ? 'Snow muffles the world: practise in stillness.' : c >= 45 && c <= 48 ? 'Fog hides the path: walk slowly and listen.' :
  c <= 3 ? 'Fair skies: take your practice outdoors.' : 'A quiet day for gentle practice.';
let wxBusy = false, wxLast = 0;
async function wxFetch() {
  const L = S.loc;
  if (!L || L.wx === false || wxBusy || !navigator.onLine || (S.wx && Date.now() - S.wx.at < 36e5) || Date.now() - wxLast < 6e5) return;
  wxBusy = true; wxLast = Date.now();
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${L.lat.toFixed(2)}&longitude=${L.lon.toFixed(2)}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    const j = await (await fetch(u)).json(), c = j.current;
    if (c && typeof c.temperature_2m === 'number') { S.wx = { at: Date.now(), t: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m }; save(); if (tab === 'today' || (tab === 'settings' && moreSub === 'sky')) render(); }
  } catch { /* offline or blocked: ignore */ }
  wxBusy = false;
}
const tempTxt = c => `${Math.round(c)}°C / ${Math.round(c * 9 / 5 + 32)}°F`;
function skyLine() {
  const L = S.loc; if (!L) return '';
  const s = sunTimes(new Date(), L.lat, L.lon), w = L.wx !== false && S.wx && Date.now() - S.wx.at < 6 * 36e5 ? S.wx : null;
  return `<div class="skyline"><span>🌅 ${hhmm(s.rise)}</span><span>🌇 ${hhmm(s.set)}</span>${w ? `<span>${WX(w.code)[0]} ${tempTxt(w.t)}</span>` : ''}</div>`;
}
function todayExtras() {
  const o = openQuest();
  return skyLine() + (o ? `<div class="skyline"><button data-act="gomore" data-sub="quests">✦ ${o.name} quest is open</button></div>` : '');
}

// ---------- herbarium (photos live in IndexedDB) ----------
const HERB_KINDS = [['🌳', 'Tree'], ['🌿', 'Plant'], ['🌸', 'Flower'], ['🍄', 'Fungus'], ['🐦', 'Bird'], ['🦌', 'Animal'], ['🦋', 'Insect'], ['🪨', 'Stone / other']];
const kindIcon = k => (HERB_KINDS.find(x => x[1] === k) || ['🌿'])[0];
const Herb = {
  db: null,
  open() {
    return this.db || (this.db = new Promise((res, rej) => {
      const r = indexedDB.open('foundation-herb', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => { const t = db.transaction('photos', mode), st = t.objectStore('photos'), rq = fn(st); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); });
  },
  put(id, data) { return this.tx('readwrite', s => s.put({ id, data })); },
  get(id) { return this.tx('readonly', s => s.get(id)).then(r => r && r.data); },
  del(id) { return this.tx('readwrite', s => s.delete(id)); },
  exportPhotos() { return this.tx('readonly', s => s.getAll()).catch(() => []).then(r => r || []); },
  async importPhotos(list) { await this.tx('readwrite', s => s.clear()); for (const p of list || []) await this.put(p.id, p.data); },
  async shrink(file) {
    const bmp = await createImageBitmap(file), k = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }
};

// ---------- stats and achievements ----------
function activity() {
  const m = {}, add = d => { if (d) m[d] = (m[d] || 0) + 1; };
  S.habits.forEach(h => Object.keys(h.log).forEach(add));
  S.journal.forEach(e => add(e.date)); S.med.forEach(e => add(e.date)); (S.herb || []).forEach(e => add(e.date));
  Object.values(S.quests || {}).forEach(add);
  return m;
}
function activeRuns(m) {
  const days = Object.keys(m).sort(); let run = 0, best = 0, prev = null;
  for (const k of days) { const n = dayNum(k); run = prev !== null && n === prev + 1 ? run + 1 : 1; prev = n; if (run > best) best = run; }
  let cur = 0; const d = new Date(); if (!m[ymd(d)]) d.setDate(d.getDate() - 1);
  while (m[ymd(d)]) { cur++; d.setDate(d.getDate() - 1); }
  return { best, cur };
}
function stats() {
  const r = realm(), act = activity(), runs = activeRuns(act);
  const medMin = S.med.reduce((a, x) => a + x.min, 0);
  return {
    r, act, runs, totalQi: r.total, medMin,
    practiceDays: S.habits.reduce((a, h) => a + Object.keys(h.log).length, 0),
    bestStreak: S.habits.reduce((a, h) => Math.max(a, habitStats(h).best), 0),
    journal: S.journal.length, words: S.journal.reduce((a, e) => a + (e.text.trim().split(/\s+/).filter(Boolean).length), 0),
    longSit: S.med.reduce((a, x) => Math.max(a, x.min), 0),
    drawn: S.drawn || 0, chapters: S.books.reduce((a, b) => a + (+b.read || 0), 0), finished: S.books.filter(b => b.status === 'Finished').length,
    tasks: (S.tdone || 0) + S.tasks.filter(x => x.done).length,
    herb: (S.herb || []).length, kinds: new Set((S.herb || []).map(x => x.kind)).size, quests: Object.keys(S.quests || {}).length
  };
}
const ACH = [
  ['first', '🌱', 'First Breath', 'Log your first practice day', s => s.practiceDays, 1],
  ['p100', '🔥', 'Hundred Offerings', 'Log 100 practice days in total', s => s.practiceDays, 100],
  ['p365', '🏯', 'A Year of Practice', 'Log 365 practice days in total', s => s.practiceDays, 365],
  ['s7', '🕯️', 'Steady Flame', 'Reach a 7-day streak', s => s.bestStreak, 7],
  ['s30', '🌕', 'Unbroken Moon', 'Reach a 30-day streak', s => s.bestStreak, 30],
  ['s100', '🔏', 'Hundred-Day Seal', 'Reach a 100-day streak', s => s.bestStreak, 100],
  ['s365', '☯️', 'Heavenly Constancy', 'Reach a 365-day streak', s => s.bestStreak, 365],
  ['j1', '🖋️', 'First Ink', 'Write your first journal entry', s => s.journal, 1],
  ['j30', '📜', 'Keeper of Scrolls', 'Write 30 journal entries', s => s.journal, 30],
  ['j100', '📚', 'Chronicler', 'Write 100 journal entries', s => s.journal, 100],
  ['w10k', '✍️', 'Ten Thousand Words', 'Write 10,000 words in your journal', s => s.words, 10000],
  ['m60', '🧘', 'First Hour', 'Meditate for 60 minutes in total', s => s.medMin, 60],
  ['m600', '🏔️', 'Ten Hours of Silence', 'Meditate for 600 minutes in total', s => s.medMin, 600],
  ['sit60', '🗻', 'Mountain Stillness', 'Complete a single 60-minute sit', s => s.longSit, 60],
  ['d1', '🖌️', 'First Stroke', 'Save your first calligraphy drawing', s => s.drawn, 1],
  ['d10', '🎋', 'Brush Adept', 'Save 10 drawings', s => s.drawn, 10],
  ['d50', '🏮', 'Calligraphy Master', 'Save 50 drawings', s => s.drawn, 50],
  ['c100', '📖', 'Wanderer of Jianghu', 'Read 100 chapters', s => s.chapters, 100],
  ['b1', '🐉', "Tale's End", 'Finish a novel', s => s.finished, 1],
  ['t25', '✅', 'Diligent Disciple', 'Complete 25 tasks', s => s.tasks, 25],
  ['t100', '⚔️', 'Sect Elder', 'Complete 100 tasks', s => s.tasks, 100],
  ['h1', '🍃', 'First Sighting', 'Log your first herbarium entry', s => s.herb, 1],
  ['h25', '🌲', 'Keeper of the Grove', 'Log 25 herbarium entries', s => s.herb, 25],
  ['hk5', '🔭', 'Naturalist', 'Log 5 different kinds of living things', s => s.kinds, 5],
  ['q1', '🌗', 'Turning of the Wheel', 'Complete a seasonal quest', s => s.quests, 1],
  ['q4', '🌾', 'Wheel Turner', 'Complete 4 seasonal quests', s => s.quests, 4],
  ['q8', '🪷', 'Keeper of the Wheel', 'Complete 8 seasonal quests', s => s.quests, 8],
  ['qi1', '✨', 'Qi Condensation', 'Reach 365 total Qi', s => s.totalQi, 365],
  ['qi2', '🔶', 'Golden Core', 'Reach 3,650 total Qi', s => s.totalQi, 3650],
  ['qi3', '☁️', 'Immortal Ascension', 'Reach 18,250 total Qi', s => s.totalQi, 18250],
  ['a1', '🌌', 'Beyond the Mortal World', 'Ascend for the first time', s => S.asc || 0, 1],
  ['a2', '🌀', 'Chaos Walker', 'Ascend to Primordial Chaos', s => S.asc || 0, 2],
  ['top', '👑', 'Heavenly Dao', 'Reach the final realm', s => (S.asc || 0) >= 2 && s.r.top ? 1 : 0, 1]
];
let achBusy = false;
function checkAch() {
  if (achBusy) return; achBusy = true;
  try {
    const s = stats(), first = !S.ach; S.ach = S.ach || {}; const fresh = [];
    for (const a of ACH) if (a[4](s) >= a[5] && !S.ach[a[0]]) { S.ach[a[0]] = ymd(); fresh.push(a); }
    if (fresh.length) { save(); if (!first) toast(fresh.map(a => `${a[1]} ${a[2]}`).join(' · ')); }
    else if (first) save();
  } finally { achBusy = false; }
}
function toast(txt) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = `<small>Achievement unlocked</small><br>${esc(txt)}`; t.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 4200);
}

// ---------- More pages ----------
const hrs = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
const back = '<button class="back" data-act="sub" data-sub="">‹ More</button>';
function moreView() {
  const p = pages[moreSub];
  if (p) return (moreSub === 'chron' ? '' : back) + p();
  const s = stats(), got = ACH.filter(a => a[4](s) >= a[5]).length, o = openQuest();
  const items = [
    ['chron', '🪶', 'Chronicle', chronStats().total + ' notes'],
    ['ach', '🏆', 'Achievements', `${got} / ${ACH.length}`], ['stats', '📊', 'Stats', `${s.r.total} Qi`],
    ['quests', '🌗', 'Seasonal Quests', o ? `${o.name} is open` : `${s.quests} done`], ['herb', '🌿', 'Herbarium', `${s.herb} sightings`],
    ['sky', '🌅', 'Sky & Light', S.loc ? 'location set' : 'set location'], ['set', '⚙️', 'Settings', 'theme, backup']
  ];
  return `<div class="menu">${items.map(i => `<button data-act="sub" data-sub="${i[0]}"><span class="em">${i[1]}</span><b>${i[2]}</b><small>${i[3]}</small></button>`).join('')}</div>`;
}
const pages = {
  ach() {
    const s = stats(), got = ACH.filter(a => a[4](s) >= a[5]).length;
    const row = a => {
      const cur = a[4](s), ok = cur >= a[5];
      return `<div class="ach ${ok ? 'got' : ''}"><span class="em">${a[1]}</span><div class="grow"><b>${a[2]}</b><div class="dim">${a[3]}</div>
        ${ok ? `<div class="dim">Unlocked ${esc((S.ach || {})[a[0]] || '')}</div>` : `<div class="bar"><i style="width:${Math.min(100, cur / a[5] * 100)}%"></i></div><div class="dim">${Math.min(cur, a[5]).toLocaleString()} / ${a[5].toLocaleString()}</div>`}</div></div>`;
    };
    const done = ACH.filter(a => a[4](s) >= a[5]), todo = ACH.filter(a => a[4](s) < a[5]);
    return `<div class="card"><h2>Achievements</h2><div class="bar"><i style="width:${got / ACH.length * 100}%"></i></div><div class="dim" style="text-align:center">${got} of ${ACH.length} unlocked</div></div>
      ${todo.length ? `<div class="card"><h2>In progress</h2>${todo.map(row).join('')}</div>` : ''}
      ${done.length ? `<div class="card"><h2>Unlocked</h2>${done.map(row).join('')}</div>` : ''}`;
  },
  stats() {
    const s = stats(), act = s.act;
    const tiles = [[s.r.total.toLocaleString(), 'Total Qi'], [s.r.name, 'Realm'], [s.practiceDays, 'Practice days'], [s.bestStreak, 'Best streak'],
      [s.runs.cur, 'Active-day streak'], [s.runs.best, 'Best active run'], [s.journal, 'Journal entries'], [s.words.toLocaleString(), 'Words written'],
      [hrs(s.medMin), 'Meditation'], [s.drawn, 'Drawings'], [s.chapters, 'Chapters read'], [s.tasks, 'Tasks done'], [s.herb, 'Sightings'], [s.quests, 'Quests']];
    const parts = qiParts(), tot = Object.values(parts).reduce((a, b) => a + b, 0) || 1;
    const labels = { practice: 'Practices', med: 'Meditation', journal: 'Journal', read: 'Reading', tasks: 'Tasks', art: 'Calligraphy', herb: 'Herbarium', quest: 'Quests', chron: 'Chronicle', banked: 'Past work' };
    const d0 = new Date(); d0.setDate(d0.getDate() - 7 * 15 - d0.getDay());
    const cells = []; for (let d = new Date(d0); d <= new Date(); d.setDate(d.getDate() + 1)) { const n = act[ymd(d)] || 0; cells.push(`<i class="${n ? 'l' + Math.min(3, n) : ''}" title="${ymd(d)}: ${n}"></i>`); }
    const days = Object.keys(act).length;
    return `<div class="card"><h2>Overview</h2><div class="tiles">${tiles.map(t => `<div class="tile"><b>${t[0]}</b><span>${t[1]}</span></div>`).join('')}</div></div>
      <div class="card"><h2>Where your Qi comes from</h2>${Object.entries(parts).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).map(e =>
        `<div class="row sb"><span>${labels[e[0]]}</span><span class="dim">${e[1].toLocaleString()} · ${Math.round(e[1] / tot * 100)}%</span></div><div class="bar thin"><i style="width:${e[1] / tot * 100}%"></i></div>`).join('') || '<span class="dim">Nothing yet. Begin a practice.</span>'}</div>
      <div class="card"><h2>Activity</h2><div class="heat">${cells.join('')}</div><p class="dim" style="text-align:center">Last 16 weeks · ${days} active days in total</p></div>`;
  },
  quests() {
    const l = questList();
    const st = { done: '✓ Done', open: 'Open now', soon: '', missed: 'Missed this year' };
    return `<div class="card"><h2>Wheel of the Year</h2><p class="dim" style="text-align:center">Each festival opens a quest for ${QWIN} days either side. Completing one grants ${QUEST_QI} Qi.</p></div>` +
      l.sort((a, b) => a.date - b.date).map(q => `<div class="card ${q.state === 'open' ? 'glow' : ''}"><div class="row sb"><b>${q.name}</b><span class="dim">${q.date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${st[q.state] || (q.diff + ' days away')}</span></div>
        <p>${esc(q.text)}</p>${q.state === 'open' ? `<button class="pri" data-act="quest" data-key="${q.key}">Complete quest</button>` : ''}</div>`).join('');
  },
  herb() {
    const list = [...(S.herb || [])].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return `<div class="card"><h2>Log a sighting</h2><div class="row"><input class="grow" id="hname" placeholder="What did you meet? (e.g. Red oak)"><select id="hkind">${HERB_KINDS.map(k => `<option>${k[1]}</option>`).join('')}</select></div>
      <p><textarea id="hnotes" placeholder="Where, when, how it felt..."></textarea></p><div class="row"><label class="dim">Photo <input id="hphoto" type="file" accept="image/*"></label><button class="pri" data-act="addherb">Add (+${HERB_QI} Qi)</button></div></div>` +
      (list.length ? list.map(e => `<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${e.photo ? `<img class="hthumb" data-photo="${e.id}" alt="">` : `<span class="hthumb em">${kindIcon(e.kind)}</span>`}
        <div class="grow"><div class="row sb"><b>${esc(e.name)}</b><button class="x" data-act="delherb" data-id="${e.id}">✕</button></div><div class="dim">${kindIcon(e.kind)} ${esc(e.kind)} · ${e.date}</div>${e.notes ? `<div style="white-space:pre-wrap">${esc(e.notes)}</div>` : ''}</div></div></div>`).join('')
        : '<p class="dim" style="text-align:center">Your herbarium is empty. Log the first tree, bird or flower you meet.</p>');
  },
  sky() {
    const L = S.loc, today0 = new Date();
    let body;
    if (!L) body = `<p class="dim">Set a location to see sunrise, sunset and the best windows for dawn and dusk practice. Sun times are worked out on this device, offline.</p>`;
    else {
      const s = sunTimes(today0, L.lat, L.lon), len = s.rise && s.set ? Math.round((s.set - s.rise) / 6e4) : 0;
      const win = (d, a, b) => d ? `${hhmm(new Date(d.getTime() + a * 6e4))} to ${hhmm(new Date(d.getTime() + b * 6e4))}` : '--';
      const w = L.wx !== false && S.wx ? S.wx : null;
      body = `<div class="tiles"><div class="tile"><b>${hhmm(s.rise)}</b><span>Sunrise</span></div><div class="tile"><b>${hhmm(s.set)}</b><span>Sunset</span></div><div class="tile"><b>${len ? hrs(len) : '--'}</b><span>Daylight</span></div></div>
        <p class="dim" style="text-align:center">Dawn practice: ${win(s.rise, -30, 30)}<br>Dusk practice: ${win(s.set, -30, 30)}</p>
        ${L.wx !== false ? (w ? `<div class="skyline"><span>${WX(w.code)[0]} ${WX(w.code)[1]}</span><span>${tempTxt(w.t)}</span><span>💨 ${Math.round(w.wind)} km/h</span></div><p class="dim" style="text-align:center">${wxAdvice(w.code)}</p>` : '<p class="dim" style="text-align:center">Weather appears here when you are online.</p>') : ''}
        <p class="dim" style="text-align:center">Location ${L.lat.toFixed(2)}, ${L.lon.toFixed(2)}</p>
        <label class="row" style="justify-content:center"><input type="checkbox" data-act="wxtoggle" ${L.wx !== false ? 'checked' : ''}> Show weather (online; sends rounded coordinates to Open-Meteo)</label>`;
    }
    return `<div class="card"><h2>Sky & Light</h2>${body}</div>
      <div class="card"><h2>${L ? 'Change location' : 'Set location'}</h2><div class="row" style="justify-content:center"><button class="pri" data-act="geo">Use my location</button></div>
      <p class="dim" style="text-align:center">or enter coordinates</p><div class="row" style="justify-content:center"><input id="lat" type="number" step="any" placeholder="Latitude" style="width:130px"><input id="lon" type="number" step="any" placeholder="Longitude" style="width:130px"><button data-act="setloc">Save</button></div>
      ${L ? '<p style="text-align:center"><button data-act="clearloc">Remove location</button></p>' : ''}</div>`;
  },
  set() { return views.setpage(); }
};

// ---------- actions (merged into A by app.js) ----------
const XA = {
  sub(el) { moreSub = el.dataset.sub || ''; window.scrollTo(0, 0); },
  gomore(el) { tab = 'settings'; moreSub = el.dataset.sub || ''; window.scrollTo(0, 0); },
  useprompt() { const t = document.getElementById('jt'); jdraft = (t ? t.value.trimEnd() : jdraft); jdraft += (jdraft ? '\n\n' : '') + curPrompt()[1] + '\n\n'; },
  nextprompt() { const t = document.getElementById('jt'); if (t) jdraft = t.value; pidx++; },
  quest(el) { const q = questList().find(x => x.key === el.dataset.key); if (q && q.state === 'open') (S.quests = S.quests || {})[q.key] = ymd(); },
  addherb() {
    const name = val('hname'), kind = val('hkind'), notes = val('hnotes'), f = document.getElementById('hphoto').files[0];
    if (!name) return;
    const e = { id: uid(), date: today(), name, kind, notes, qi: HERB_QI, photo: false };
    (S.herb = S.herb || []).push(e);
    if (f) Herb.shrink(f).then(d => Herb.put(e.id, d)).then(() => { e.photo = true; save(); render(); }).catch(() => alert('That photo could not be saved, but your sighting was.'));
  },
  delherb(el) {
    if (!confirm('Delete this sighting?')) return;
    const e = S.herb.find(x => x.id === el.dataset.id);
    if (e) { S.banked = (S.banked || 0) + (e.qi ?? HERB_QI); if (e.photo) Herb.del(e.id).catch(() => { }); }
    S.herb = S.herb.filter(x => x.id !== el.dataset.id);
  },
  geo() {
    if (!navigator.geolocation) return alert('Location is not available here. Enter coordinates instead.');
    navigator.geolocation.getCurrentPosition(p => { S.loc = { lat: p.coords.latitude, lon: p.coords.longitude, wx: S.loc ? S.loc.wx : true }; delete S.wx; save(); render(); },
      () => alert('Could not get your location. You can enter coordinates instead.'), { timeout: 15000 });
  },
  setloc() {
    const lat = parseFloat(val('lat')), lon = parseFloat(val('lon'));
    if (!(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) return alert('Enter a latitude from -90 to 90 and a longitude from -180 to 180.');
    S.loc = { lat, lon, wx: S.loc ? S.loc.wx : true }; delete S.wx;
  },
  clearloc() { if (confirm('Remove your location?')) { delete S.loc; delete S.wx; } },
  wxtoggle(el) { if (S.loc) S.loc.wx = el.checked; }
};

// ---------- after every render ----------
function extrasAfter() {
  checkAch();
  document.querySelectorAll('img[data-photo]').forEach(im => Herb.get(im.dataset.photo).then(d => { if (d) im.src = d; }).catch(() => { }));
  wxFetch();
}
