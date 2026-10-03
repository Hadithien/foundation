'use strict';
// ---------- state ----------
const KEY = 'foundation.state.v1';
const def = () => ({ habits: [], journal: [], books: [], tasks: [], drawn: 0, banked: 0, asc: 0, ascBase: 0, med: [], herb: [], quests: {}, ach: null, tdone: 0, theme: 'dark' });
let S = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}'));
let wiping = false;
const save = () => { if (!wiping) localStorage.setItem(KEY, JSON.stringify(S)); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const DONATE_URL = ''; // set your donation page here, e.g. 'https://ko-fi.com/yourname'
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => ymd();

// ---------- lore ----------
const WORLDS = [
  { name: 'Mortal World', realms: [
    ['Mortal', 0], ['Qi Condensation', 365], ['Foundation Establishment', 1500], ['Golden Core', 3650],
    ['Nascent Soul', 6500], ['Spirit Severing', 10000], ['Dao Seeking', 14000], ['Immortal Ascension', 18250]] },
  { name: 'Immortal Realm', realms: [
    ['Earthly Immortal', 0], ['Heavenly Immortal', 6000], ['True Immortal', 14000], ['Golden Immortal', 24000],
    ['Taiyi Golden Immortal', 38000], ['Daluo Golden Immortal', 56000], ['Quasi-Sage', 80000], ['Heavenly Sage', 110000]] },
  { name: 'Primordial Chaos', realms: [
    ['Chaos Wanderer', 0], ['Void Refiner', 20000], ['Hongmeng Walker', 50000], ['Origin Sovereign', 100000],
    ['Dao Ancestor', 180000], ['Eternal Lord', 300000], ['Heavenly Dao', 500000]] }
];
const world = () => WORLDS[Math.min(S.asc || 0, WORLDS.length - 1)];
const REALMS = WORLDS[0].realms;
const MULTS = [[3, 1.1, 'Kindling'], [7, 1.25, 'Steady Flame'], [14, 1.5, 'Rising Breath'], [30, 2, 'Unbroken Moon'],
  [60, 2.5, 'Iron Resolve'], [100, 3, 'Hundred-Day Seal'], [200, 4, 'Mountain Heart'], [365, 5, 'Heavenly Constancy']];
const ASC_BONUS = 0.5; // added to the multiplier per ascension
const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const streakMult = n => MULTS.reduce((a, x) => n >= x[0] ? x[1] : a, 1);
const ascOn = k => (S.ascDates || []).filter(d => d <= k).length;
const mult = (n, k) => Math.round((streakMult(n) + ASC_BONUS * (k === undefined ? (S.asc || 0) : ascOn(k))) * 100) / 100;
const multName = n => (MULTS.filter(x => n >= x[0]).pop() || [0, 0, ''])[2];
const nextMult = n => MULTS.find(x => n < x[0]);
const TREES = [[12, 24, 'Birch', 'Beginnings, renewal'], [1, 21, 'Rowan', 'Protection, insight'], [2, 18, 'Ash', 'Connection of worlds'],
  [3, 18, 'Alder', 'Courage, foundations'], [4, 15, 'Willow', 'Intuition, flow'], [5, 13, 'Hawthorn', 'Patience, the veil'],
  [6, 10, 'Oak', 'Strength, doorways'], [7, 8, 'Holly', 'Resilience, honour'], [8, 5, 'Hazel', 'Wisdom, inspiration'],
  [9, 2, 'Vine', 'Harvest, abundance'], [9, 30, 'Ivy', 'Tenacity, spirals'], [10, 28, 'Reed', 'Stillness, voice'], [11, 25, 'Elder', 'Endings and transformation']];
const WHEEL = [[2, 1, 'Imbolc'], [3, 20, 'Ostara'], [5, 1, 'Beltane'], [6, 21, 'Litha'], [8, 1, 'Lughnasadh'], [9, 22, 'Mabon'], [11, 1, 'Samhain'], [12, 21, 'Yule']];
const ORACLE = [
  'The river does not fight the stone; it learns the shape of the mountain.',
  'A tree with deep roots laughs at the storm. Tend your roots today.',
  'Cultivate quietly. Ten thousand miles begin beneath the first breath.',
  'The wise wanderer carries little and notices everything.',
  'When the moon is hidden, the forest still grows. Trust unseen progress.',
  'A sword is sharpened by patience, not by anger.',
  'Listen to the wind in the leaves; it speaks to those who stop walking.',
  'True strength is knowing when to bend, like bamboo in snow.',
  'Return to the earth: bare feet, open sky, slow breath.',
  'Every jianghu begins with a single step from one\'s own door.',
  'What you water, grows. Choose your garden with care.',
  'The old oak was once an acorn that held its ground.',
  'Seclusion is not retreat; it is the forge of the breakthrough.',
  'Honour is a quiet fire. Keep it fed and it will never leave you.'];

// ---------- helpers: calendars ----------
function moon(d = new Date()) {
  const age = (((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853 + 29.530588853) % 29.530588853;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const i = Math.floor(((age / 29.530588853) * 8 + 0.5)) % 8;
  return { name: names[i], icon: icons[i], age: age.toFixed(1) };
}
function tree(d = new Date()) {
  const v = (d.getMonth() + 1) * 100 + d.getDate();
  let cur = TREES[0];
  for (const t of TREES) if (v >= t[0] * 100 + t[1]) cur = t;
  return cur;
}
function nextFestival(d = new Date()) {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const c = WHEEL.map(w => [new Date(d.getFullYear(), w[0] - 1, w[1]), w[2]])
    .concat(WHEEL.map(w => [new Date(d.getFullYear() + 1, w[0] - 1, w[1]), w[2]]))
    .filter(x => x[0] >= base).sort((a, b) => a[0] - b[0])[0];
  return { name: c[1], days: Math.round((c[0] - base) / 864e5) };
}
const dayOracle = () => { const n = Math.floor(Date.now() / 864e5); return ORACLE[n % ORACLE.length]; };

// ---------- Qi / realm ----------
const journalQi = t => 10 + Math.min(10, Math.floor(t.trim().length / 100)); // 10, +1 per 100 chars, max 20
const MED_TIERS = [[5, 1.1], [10, 1.25], [20, 1.5], [30, 2], [45, 2.5], [60, 3]];
const medRate = min => MED_TIERS.reduce((a, x) => min >= x[0] ? x[1] : a, 1);
const medQi = min => Math.round(min * medRate(min));
const drawQiAt = n => 10 + 2 * Math.floor((n - 1) / 5); // nth saved drawing
const drawQi = n => { let t = 0; for (let i = 1; i <= n; i++) t += drawQiAt(i); return t; };
function qiParts() {
  return {
    practice: S.habits.reduce((a, x) => a + habitQi(x), 0),
    med: S.med.reduce((a, x) => a + medQi(x.min), 0),
    journal: S.journal.reduce((a, x) => a + (x.qi ?? 10), 0),
    read: S.books.reduce((a, x) => a + (+x.read || 0), 0) * 5,
    tasks: S.tasks.filter(x => x.done).length * 10,
    art: drawQi(S.drawn || 0),
    herb: herbQi(), quest: questQi(), banked: S.banked || 0
  };
}
const qi = () => Object.values(qiParts()).reduce((a, b) => a + b, 0);
function realm() {
  const w = world(), R = w.realms, total = qi(), q = total - (S.ascBase || 0);
  let i = 0;
  R.forEach((r, k) => { if (q >= r[1]) i = k; });
  const next = R[i + 1], top = i === R.length - 1;
  return { q, total, world: w.name, name: R[i][0], next: next && next[0], top,
    canAscend: top && (S.asc || 0) < WORLDS.length - 1,
    pct: next ? (q - R[i][1]) / (next[1] - R[i][1]) * 100 : 100, need: next ? next[1] - q : 0 };
}
function habitStats(h) {
  const days = Object.keys(h.log).sort(); let run = 0, prev = null, qi = 0, best = 0;
  for (const k of days) {
    const n = dayNum(k);
    run = prev !== null && n === prev + 1 ? run + 1 : 1; prev = n;
    qi += Math.round(10 * mult(run, k)); if (run > best) best = run;
  }
  return { qi, best };
}
const habitQi = h => habitStats(h).qi;
function streakLabel(h) {
  const n = streak(h), b = habitStats(h).best, m = mult(n), nx = nextMult(n);
  return `🔥 ${n} day streak${m > 1 ? ` · <b>×${m} Qi</b> ${n ? multName(n) : ''}${S.asc ? ` · ☯ +${S.asc * ASC_BONUS} ascension` : ''}` : ''}<br><small>Best ${b}${nx ? ` · ×${Math.round((nx[1] + ASC_BONUS * (S.asc || 0)) * 100) / 100} at ${nx[0]} days` : ' · max multiplier'}</small>`;
}
function streak(h) {
  let n = 0; const d = new Date();
  if (!h.log[ymd(d)]) d.setDate(d.getDate() - 1);
  while (h.log[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- icons (ink-line SVG, inherit colour) ----------
const IC = {
  today: '<circle cx="24" cy="21" r="7" fill="currentColor" fill-opacity=".25"/><path d="M24 6v4M10 12l3 3M38 12l-3 3M5 22h5M38 22h5M13 33 20 24l5 6 5-8 10 14H4z" /><path d="M4 40h40M10 44h28" opacity=".6"/><path d="M15 36l4-5M31 36l-3-4" opacity=".5"/>',
  practice: '<path d="M24 3c2 9 13 13 13 26a13 13 0 0 1-26 0c0-7 3-10 7-14 0 5 2 7 4 8-2-9-1-14 2-20z" fill="currentColor" fill-opacity=".2"/><path d="M24 25c4 5 6 7 6 11a6 6 0 0 1-12 0c0-4 4-6 6-11z"/><path d="M15 45h18" />',
  journal: '<path d="M24 12c-6-4-14-4-19-2v29c5-2 13-2 19 2 6-4 14-4 19-2V10c-5-2-13-2-19 2z" fill="currentColor" fill-opacity=".15"/><path d="M24 12v29M10 17c3-.8 7-.6 10 .8M10 23c3-.8 7-.6 10 .8M10 29c3-.8 7-.6 10 .8M28 18c3-1.4 7-1.6 10-.8M28 24c3-1.4 7-1.6 10-.8"/><path d="M36 2l-9 9 2 2 9-9z" fill="currentColor"/>',
  library: '<rect x="6" y="30" width="36" height="9" rx="2" fill="currentColor" fill-opacity=".2"/><rect x="9" y="20" width="30" height="9" rx="2" fill="currentColor" fill-opacity=".2"/><rect x="5" y="10" width="32" height="9" rx="2" fill="currentColor" fill-opacity=".2"/><path d="M11 30v9M15 30v9M12 20v9M35 20v9M9 10v9M13 10v9M40 12l3 26"/><path d="M6 43h36" opacity=".6"/>',
  tasks: '<rect x="7" y="7" width="34" height="34" rx="4" fill="currentColor" fill-opacity=".15"/><rect x="11" y="11" width="26" height="26" rx="2"/><path d="M16 25l6 6 11-13" stroke-width="3.2"/><path d="M4 12v-5h5M44 12v-5h-5M4 36v5h5M44 36v5h-5" opacity=".6"/>',
  art: '<path d="M38 5 21 24"/><path d="M21 24c-6-2-10 2-10 6 0 4-2 6-6 8 8 5 19 3 21-4 1-4-1-8-5-10z" fill="currentColor" fill-opacity=".25"/><path d="M30 40h13M33 44h8" opacity=".7"/>',
  grove: '<path d="M24 5c-6 0-10 4-10 9-4 1-7 4-7 8 0 5 4 8 9 8h16c5 0 9-3 9-8 0-4-3-7-7-8 0-5-4-9-10-9z" fill="currentColor" fill-opacity=".2"/><path d="M24 44V24M24 36l-7-6M24 31l8-7M24 26l-4-4"/><path d="M14 44h20M18 41l-4 3M30 41l4 3" opacity=".7"/>',
  meditate: '<path d="M24 5c6 7 6 16 0 24-6-8-6-17 0-24z" fill="currentColor" fill-opacity=".25"/><path d="M24 29c-8 1-15-3-18-11 8-1 14 3 18 11zM24 29c8 1 15-3 18-11-8-1-14 3-18 11z"/><path d="M24 31c-9 4-17 2-21-4 7-1 14 0 21 4zM24 31c9 4 17 2 21-4-7-1-14 0-21 4z" opacity=".7"/><path d="M8 38c6 4 26 4 32 0M14 43c6 3 14 3 20 0" opacity=".6"/>',
  more: '<circle cx="24" cy="24" r="18" fill="currentColor" fill-opacity=".15"/><circle cx="24" cy="24" r="14" opacity=".6"/><rect x="17" y="17" width="14" height="14" rx="1"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6" /><path d="M11 11l3 3M37 11l-3 3M11 37l3-3M37 37l-3-3" opacity=".6"/>'
};
const ic = (n, s = 26) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
function moonSvg(d = new Date(), s = 56) {
  const age = (((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853 + 29.530588853) % 29.530588853;
  const p = age / 29.530588853, c = Math.cos(2 * Math.PI * p), rx = Math.abs(c) * 20;
  const right = p < .5, sweepT = right ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0);
  const lit = `M24 4A20 20 0 0 ${right ? 1 : 0} 24 44A${rx.toFixed(2)} 20 0 0 ${sweepT} 24 4z`;
  return `<svg class="moon" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="mg" cx=".4" cy=".35"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#e6c36a"/></radialGradient></defs>
  <circle cx="24" cy="24" r="20" fill="#3a2a1a"/><path d="${lit}" fill="url(#mg)"/><circle cx="24" cy="24" r="20" fill="none" stroke="#8a5a2a" stroke-width="2"/><circle cx="24" cy="24" r="23" fill="none" stroke="#b8860b" stroke-width=".8" opacity=".7"/></svg>`;
}
// ---------- views ----------
let tab = 'today', q = '', timer = null, oracleText = null;
try { const t = JSON.parse(localStorage.getItem('foundation.timer') || 'null'); if (t && t.end) timer = t; } catch {}
const TABS = [['today', 'today', 'Today'], ['practice', 'practice', 'Practice'], ['journal', 'journal', 'Journal'], ['library', 'library', 'Library'], ['tasks', 'tasks', 'Tasks'], ['art', 'art', 'Calligraphy'], ['meditate', 'meditate', 'Meditate'], ['settings', 'more', 'More']];

const lists = {
  journal() {
    const l = S.journal.filter(e => !q || (e.text + e.mood).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return l.map(e => `<div class="card"><div class="row sb"><span class="dim">${e.date} · ${esc(e.mood)} · +${e.qi ?? 10} Qi</span><button class="x" data-act="delj" data-id="${e.id}">✕</button></div><div style="white-space:pre-wrap">${esc(e.text)}</div></div>`).join('')
      || `<div class="card dim" style="text-align:center">${q ? 'No entries match.' : 'No entries yet. Write your first one above.'}</div>`;
  }
};
const views = {
  today() {
    const m = moon(), t = tree(), f = nextFestival(), r = realm();
    const done = S.habits.filter(h => h.log[today()]).length;
    return `<div class="card"><div class="row sb"><div><div class="dim">${new Date().toDateString()}</div>
      <div class="big">${moonSvg()}</div><div>${m.name} <span class="dim">· day ${m.age}</span></div></div>
      <div style="text-align:right"><div class="tree">${ic('grove', 22)} ${t[2]}</div><div class="dim">${t[3]}</div>
      <div class="dim">${f.days === 0 ? 'Today: ' : 'Next: '}${f.name}${f.days ? ' in ' + f.days + 'd' : ''}</div></div></div>${todayExtras()}</div>
      <div class="card"><h2>${ic('meditate', 24)} Cultivation: ${r.name}</h2><div class="dim" style="text-align:center">${r.world}${S.asc ? ' · Ascension ' + S.asc : ''}</div><div class="bar"><i style="width:${r.pct}%"></i></div>
      <div class="dim">${r.q} Qi${r.next ? ' · ' + r.need + ' to ' + r.next : r.canAscend ? ' · Peak reached' : ' · Max realm reached'}</div>${r.canAscend ? `<p style="text-align:center"><button class="pri" data-act="ascend">☯ Ascend to ${WORLDS[(S.asc || 0) + 1].name}</button></p>` : ''}</div>
      <div class="card"><h2>${ic('journal', 24)} Oracle</h2><div class="quote" id="oracle">${esc(oracleText || dayOracle())}</div>
      <p><button data-act="draw">Draw another</button></p></div>
      <div class="card"><h2>${ic('practice', 24)} Practices</h2>${S.habits.length ? `${done}/${S.habits.length} completed today` : '<span class="dim">Add daily practices in the Practice tab.</span>'}
      ${S.habits.map(h => `<div class="row"><label><input type="checkbox" data-act="hab" data-id="${h.id}" ${h.log[today()] ? 'checked' : ''}> ${esc(h.name)}</label></div>`).join('')}</div>
      <div class="card"><h2>${ic('tasks', 24)} Open tasks</h2>${S.tasks.filter(x => !x.done).slice(0, 5).map(x => `<div>• ${esc(x.text)}</div>`).join('') || '<span class="dim">Nothing pending.</span>'}</div>`;
  },
  practice() {
    return `<div class="card row"><input class="grow" id="hn" placeholder="New practice (e.g. Dawn walk, Qigong, Tea)"><button class="pri" data-act="addhab">Add</button></div>` +
      S.habits.map(h => {
        const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return `<span class="${h.log[ymd(d)] ? 'on' : ''}"></span>`; }).join('');
        return `<div class="card"><div class="row sb"><label><input type="checkbox" data-act="hab" data-id="${h.id}" ${h.log[today()] ? 'checked' : ''}> <b>${esc(h.name)}</b></label>
        <button class="x" data-act="delhab" data-id="${h.id}">✕</button></div><div class="row sb"><div class="week">${days}</div><span class="dim" style="text-align:right">${streakLabel(h)}</span></div></div>`;
      }).join('');
  },
  journal() {
    return `<div class="card"><div class="row"><select id="jm"><option>🌿 Calm</option><option>🔥 Driven</option><option>🌧️ Heavy</option><option>✨ Inspired</option><option>🌙 Reflective</option></select>
      <input type="date" id="jd" value="${today()}"></div>${promptBlock()}<p><textarea id="jt" placeholder="What did the forest teach you today?">${esc(jdraft)}</textarea></p><button class="pri" data-act="addj">Save entry</button> <span class="dim">Each entry gives 10 Qi, +1 per 100 characters written (max 20).</span></div>
      <div class="card"><input class="grow" style="width:100%" id="q" placeholder="Search…" value="${esc(q)}"></div><div id="list">${lists.journal()}</div>`;
  },
  library() {
    return `<div class="card"><h2>${ic('library', 24)} Add a novel</h2><div class="row"><input class="grow" id="bt" placeholder="Title (e.g. Coiling Dragon)"><input id="ba" placeholder="Author"></div>
      <div class="row" style="margin-top:8px"><input id="bt2" type="number" placeholder="Total chapters" style="width:140px"><select id="bs"><option>Reading</option><option>Planned</option><option>Finished</option><option>Dropped</option></select><button class="pri" data-act="addbook">Add</button></div></div>` +
      S.books.map(b => {
        const p = b.total ? Math.min(100, b.read / b.total * 100) : 0;
        return `<div class="card"><div class="row sb"><div><b>${esc(b.title)}</b> <span class="dim">${esc(b.author)}</span></div><button class="x" data-act="delbook" data-id="${b.id}">✕</button></div>
        <div class="bar"><i style="width:${p}%"></i></div>
        <div class="row sb" style="margin-top:8px"><span class="dim">Ch. ${b.read}${b.total ? ' / ' + b.total : ''} · ${esc(b.status)}</span>
        <span><button data-act="ch" data-id="${b.id}" data-n="-1">−</button> <button data-act="ch" data-id="${b.id}" data-n="1">+1</button> <button data-act="ch" data-id="${b.id}" data-n="10">+10</button></span></div></div>`;
      }).join('') || '<p class="dim">Track your xianxia and wuxia reading here.</p>';
  },
  tasks() {
    return `<div class="card row"><input class="grow" id="tn" placeholder="New task"><button class="pri" data-act="addtask">Add</button></div><div class="card">` +
      (S.tasks.map(t => `<div class="row sb"><label class="${t.done ? 'done' : ''}"><input type="checkbox" data-act="task" data-id="${t.id}" ${t.done ? 'checked' : ''}> ${esc(t.text)}</label><button class="x" data-act="deltask" data-id="${t.id}">✕</button></div>`).join('') || '<span class="dim">All clear.</span>') + '</div>' +
      (S.tasks.some(t => t.done) ? '<button data-act="cleartasks">Clear completed</button>' : '');
  },
  art() { return '<div id="art-root"></div>'; },
  meditate() {
    const total = S.med.reduce((a, x) => a + x.min, 0), td = S.med.filter(x => x.date === today()).reduce((a, x) => a + x.min, 0);
    return `<div class="card"><h2>${ic('meditate', 24)} Seated meditation</h2><div class="timer" id="tm">${timer ? fmt(timer.end - Date.now()) : '10:00'}</div>
      <div class="row" style="justify-content:center;margin-top:10px">${timer ? '<button data-act="stopmed">Stop</button>' :
        '<select id="mm"><option>5</option><option selected>10</option><option>20</option><option>30</option><option>45</option><option>60</option></select> min <button class="pri" data-act="startmed">Begin</button>'}</div>
      <p class="dim" style="text-align:center">Longer sits earn more Qi per minute: ${MED_TIERS.map(x => x[0] + 'm x' + x[1]).join(', ')}</p>
      <p class="dim" style="text-align:center">Today: ${td} min · Total: ${total} min = ${S.med.reduce((a, x) => a + medQi(x.min), 0)} Qi</p></div>`;
  },
  settings() { return moreView(); },
  setpage() {
    return `<div class="card"><h2>Theme</h2><button data-act="theme">Toggle light / dark</button></div>
      <div class="card"><h2>Backup</h2><p class="dim">All data lives on this device.       Export gives you a code to save somewhere safe (notes, email). Import restores from that code on any device.</p>
            <div class="row"><button class="pri" data-act="export">Export</button><button data-act="import">Import</button></div>
            ${bmode === 'export' && bcode ? `<p><textarea id="bcode" readonly rows="5" style="font-family:monospace;font-size:.75rem">${esc(bcode)}</textarea></p><div class="row"><button data-act="copycode">Copy code</button><span class="dim">${bcode.length.toLocaleString()} characters</span></div>` : ''}
            ${bmode === 'import' ? `<p><textarea id="rcode" rows="5" style="font-family:monospace;font-size:.75rem" placeholder="Type or paste your backup code here">${esc(rdraft)}</textarea></p><div class="row"><button class="pri" data-act="usecode">Restore</button></div>` : ''}</div>
      <div class="card"><h2>Delete data</h2><p class="dim">Erase everything stored on this device: practice, journal, library, drawings, herbarium and progress.</p><button data-act="wipe">Delete all data</button></div>
      <div class="card"><h2>Donate</h2><p class="dim">Support the work behind Foundation.</p><button class="pri" data-act="donate">Donate</button></div>
      <div class="card"><h2>About</h2><p class="dim">Foundation — a private, offline app for practice, reflection and story. Install it from your browser menu ("Install app" / "Add to Home Screen").</p></div>`;
  }
};
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

// ---------- render ----------
function render() {
  document.body.classList.toggle('light', S.theme === 'light');
  document.getElementById('tabs').innerHTML = TABS.map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-tab="${t[0]}"><b>${ic(t[1], 28)}</b>${t[2]}</button>`).join('');
  document.getElementById('view').innerHTML = views[tab]();
  badge();
  extrasAfter();
  if (tab === 'art' && window.Art) Art.mount(document.getElementById('art-root'));
}
function badge() { const r = realm(); document.getElementById('realm-badge').textContent = `${r.name} · ${r.q} Qi`; }
const val = id => document.getElementById(id).value.trim();

// ---------- actions ----------
const A = {
  draw() { let n; do { n = ORACLE[Math.floor(Math.random() * ORACLE.length)]; } while (n === (oracleText || dayOracle())); oracleText = n; },
  hab(el) { const h = S.habits.find(x => x.id === el.dataset.id); el.checked ? h.log[today()] = 1 : delete h.log[today()]; },
  addhab() { const n = val('hn'); if (n) S.habits.push({ id: uid(), name: n, log: {} }); },
  delhab(el) { if (confirm('Delete this practice?')) { const h = S.habits.find(x => x.id === el.dataset.id); S.banked = (S.banked || 0) + (h ? habitQi(h) : 0); } else return; S.habits = S.habits.filter(x => x.id !== el.dataset.id); },
  addj() { const t = val('jt'); if (t) { S.journal.push({ id: uid(), date: val('jd') || today(), mood: val('jm'), text: t, qi: journalQi(t) }); jdraft = ''; } },
  delj(el) { if (!confirm('Delete entry?')) return; const e = S.journal.find(x => x.id === el.dataset.id); S.banked = (S.banked || 0) + (e ? e.qi ?? 10 : 0); S.journal = S.journal.filter(x => x.id !== el.dataset.id); },
  addbook() { const t = val('bt'); if (t) S.books.push({ id: uid(), title: t, author: val('ba'), total: +val('bt2') || 0, read: 0, status: val('bs') }); },
  delbook(el) { if (confirm('Remove book?')) S.books = S.books.filter(x => x.id !== el.dataset.id); },
  ch(el) {
    const b = S.books.find(x => x.id === el.dataset.id);
    b.read = Math.max(0, b.read + +el.dataset.n);
    if (b.total && b.read >= b.total) { b.read = b.total; b.status = 'Finished'; } else if (b.status === 'Planned' || b.status === 'Finished') b.status = 'Reading';
  },
  addtask() { const t = val('tn'); if (t) S.tasks.push({ id: uid(), text: t, done: false }); },
  task(el) { S.tasks.find(x => x.id === el.dataset.id).done = el.checked; },
  deltask(el) { const d = S.tasks.find(x => x.id === el.dataset.id); if (d && d.done) { S.banked = (S.banked || 0) + 10; S.tdone = (S.tdone || 0) + 1; } S.tasks = S.tasks.filter(x => x.id !== el.dataset.id); },
  cleartasks() { S.tdone = (S.tdone || 0) + S.tasks.filter(x => x.done).length; S.banked = (S.banked || 0) + S.tasks.filter(x => x.done).length * 10; S.tasks = S.tasks.filter(x => !x.done); },
  startmed() { const m = +val('mm'); timer = { start: Date.now(), end: Date.now() + m * 6e4, min: m }; saveTimer(); tick(); },
  stopmed() {
    const done = Math.floor((Date.now() - timer.start) / 6e4);
    clearInterval(timer.int);
    if (done >= 1) S.med.push({ date: today(), min: done });
    timer = null; saveTimer();
  },
  ascend() {
    const r = realm(); if (!r.canAscend) return;
    const nw = WORLDS[(S.asc || 0) + 1];
    if (!confirm(`Ascend to the ${nw.name}? Your cultivation begins anew as a ${nw.realms[0][0]}. Your habits, journal and history are kept.`)) return;
    S.asc = (S.asc || 0) + 1; (S.ascDates = S.ascDates || []).push(ymd()); S.ascBase = r.total; tab = 'today';
    setTimeout(() => alert(`Heaven shakes. You have ascended to the ${nw.name}.`), 50);
  },
  donate() {
    let u = DONATE_URL || S.donate;
    if (!u) { u = (prompt('Paste your donation page link (one-time setup):') || '').trim(); if (!u) return;
      if (!/^[a-z]+:/i.test(u)) u = 'https://' + u;
      try { u = new URL(u); if (u.protocol !== 'https:') throw 0; u = S.donate = u.href; } catch { alert('Please enter a valid https:// link.'); return; } }
    location.href = u;
  },
  async wipe() {
    if (!confirm('Delete ALL Foundation data on this device? This cannot be undone. Export a backup first if unsure.')) return;
    if (!confirm('Really delete everything?')) return;
    wiping = true;
    localStorage.removeItem(KEY);
    await Promise.all(['foundation-art', 'foundation-herb'].map(n => new Promise(r => {
      const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = () => r();
      setTimeout(r, 1500);
    })));
    location.reload();
  },
  theme() { S.theme = S.theme === 'light' ? 'dark' : 'light'; },
  async export() { bmode = 'export'; bcode = await encodeBackup(await gather()); render(); },
  import() { bmode = 'import'; bcode = ''; },
  copycode() {
    const t = document.getElementById('bcode'); if (!t) return;
    t.select();
    (navigator.clipboard ? navigator.clipboard.writeText(bcode) : Promise.reject()).catch(() => document.execCommand('copy')).then(() => alert('Code copied.'), () => alert('Code copied.'));
  },
  async usecode() {
    const t = rdraft = document.getElementById('rcode').value;
    try { applyBackup(await decodeBackup(t)); } catch { alert('That backup code is not valid.'); }
  }
};
let bcode = '', bmode = '', rdraft = '';
async function gather() { return Object.assign({}, S, { drawings: await Art.exportAll(), herbPhotos: await Herb.exportPhotos() }); }
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
async function encodeBackup(data) {
  let bytes = new TextEncoder().encode(JSON.stringify(data)), tag = 'FND0.';
  if (window.CompressionStream) { bytes = await pipe(bytes, new CompressionStream('gzip')); tag = 'FND1.'; }
  let bin = ''; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return tag + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decodeBackup(code) {
  const m = code.replace(/\s+/g, '').match(/^(FND[01])\.([A-Za-z0-9_-]+)$/);
  if (!m) throw 0;
  const b64 = m[2].replace(/-/g, '+').replace(/_/g, '/');
  let bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)), c => c.charCodeAt(0));
  if (m[1] === 'FND1') bytes = await pipe(bytes, new DecompressionStream('gzip'));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function applyBackup(d) {
  const base = def();
  if (!d || typeof d !== 'object' || !Object.keys(base).some(k => k in d)) throw 0;
  if (!confirm('Replace everything on this device with the imported backup?')) return;
  S = Object.assign(base, d);
  for (const k of ['habits', 'journal', 'books', 'tasks', 'med']) if (!Array.isArray(S[k])) S[k] = [];
  const dr = S.drawings, hp = S.herbPhotos; delete S.drawings; delete S.herbPhotos; S.ach = S.ach || null;
  if (!Array.isArray(S.herb)) S.herb = [];
  if (!S.quests || typeof S.quests !== 'object') S.quests = {}; S.drawn = +S.drawn || 0;
  bcode = ''; bmode = ''; rdraft = '';
  return Promise.all([Art.importAll(dr || []), Herb.importPhotos(hp || [])]).then(() => { save(); render(); alert('Restored.'); });
}
function saveTimer() {
  if (timer) localStorage.setItem('foundation.timer', JSON.stringify({ start: timer.start, end: timer.end, min: timer.min }));
  else localStorage.removeItem('foundation.timer');
}
function tick() {
  clearInterval(timer.int);
  const step = () => {
    if (!timer) return;
    const el = document.getElementById('tm');
    if (Date.now() >= timer.end) {
      clearInterval(timer.int);
      S.med.push({ date: today(), min: timer.min }); timer = null; saveTimer(); save();
      if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      render(); setTimeout(() => alert('Meditation complete. 🔔'), 50);
    } else if (el) el.textContent = fmt(timer.end - Date.now());
  };
  timer.int = setInterval(step, 500); step();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; q = ''; if (tab === 'settings') { moreSub = ''; bmode = ''; bcode = ''; rdraft = ''; } render(); return; }
  const b = e.target.closest('button[data-act]');
  if (!b || !A[b.dataset.act]) return;
  A[b.dataset.act](b); save(); render();
  if (b.dataset.act.startsWith('add')) { const f = document.querySelector('#view input:not([type=date]):not([type=number]),#view textarea'); if (f) f.focus(); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.type === 'checkbox' || e.target.id === 'q' || e.target.closest('.art')) return;
  const card = e.target.closest('.card');
  const b = card && card.querySelector('button.pri');
  if (b) b.click();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('input[type=checkbox][data-act]')) { A[el.dataset.act](el); save(); render(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    q = e.target.value;
    const l = document.getElementById('list');
    if (l && lists[tab]) l.innerHTML = lists[tab]();
  }
});

Object.assign(A, XA);
Art.init({ onNew() { S.drawn = (S.drawn || 0) + 1; save(); badge(); return drawQiAt(S.drawn); } });
render();
if (timer) { if (Date.now() >= timer.end) { S.med.push({ date: today(), min: timer.min }); timer = null; saveTimer(); save(); render(); } else tick(); }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');





