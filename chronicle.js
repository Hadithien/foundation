// Chronicle: autobiography, novels, life timeline and linked notes (Obsidian-style)
const KINDS = {
  memory: ['📜', 'Memory', 'What happened? Who was there? Where were you? How did it feel?'],
  person: ['🧑', 'Person', 'Who are they to you? How did you meet? What do you remember of them?'],
  place: ['🏞️', 'Place', 'Describe it. What happened here? What does it mean to you?'],
  idea: ['💡', 'Idea', 'Write freely. Link notes with [[double brackets]] and mark topics with #tags.'],
  chapter: ['📖', 'Chapter', 'Once upon a time...']
};
const cs = { seg: 'notes', id: '', wid: '', q: '', tag: '', edit: false, manu: false, old: '', showJ: true, rev: false };
const P = () => Array.isArray(S.pages) ? S.pages : (S.pages = []);
const W = () => Array.isArray(S.works) ? S.works : (S.works = []);
const wc = t => (String(t || '').match(/\S+/g) || []).length;
const pageQi = p => Math.floor(wc(p.body) / 100) * 2;
const chronQi = () => P().reduce((a, p) => a + pageQi(p), 0);
const cur = () => P().find(p => p.id === cs.id);
const ptitle = p => (p.title || '').trim() || 'Untitled';
const byTitle = t => { t = String(t).trim().toLowerCase(); return P().find(p => (p.title || '').trim().toLowerCase() === t); };
const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- parsing ----------
const pcache = new Map();
function parse(p) {
  const body = p.body || '', key = p.id + ':' + body.length + ':' + (p.upd || 0), c = pcache.get(p.id);
  if (c && c.key === key) return c;
  const links = [], tags = new Set();
  for (const m of body.matchAll(/\[\[([^\]\n|]+)(?:\|[^\]\n]*)?\]\]/g)) links.push(m[1].trim().toLowerCase());
  for (const m of body.matchAll(/(^|[\s(])#([\p{L}][\p{L}\d_-]*)/gmu)) tags.add(m[2].toLowerCase());
  const r = { key, links, tags: [...tags] };
  pcache.set(p.id, r); return r;
}
function allTags() {
  const m = new Map();
  for (const p of P()) for (const t of parse(p).tags) m.set(t, (m.get(t) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// ---------- rich text ----------
const TOK = /\[\[([^\]\n]+)\]\]|(^|[\s(])#([\p{L}][\p{L}\d_-]*)/gu;
const fmtx = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\n]+)\*/g, '<i>$1</i>');
function inline(line) {
  let out = '', last = 0, m; TOK.lastIndex = 0;
  while ((m = TOK.exec(line))) {
    out += fmtx(line.slice(last, m.index));
    if (m[1] !== undefined) {
      const parts = m[1].split('|'), t = parts[0].trim(), shown = (parts[1] || t).trim();
      out += `<button class="wl${byTitle(t) ? '' : ' new'}" data-act="golink" data-t="${esc(t)}">${esc(shown)}</button>`;
    } else out += esc(m[2]) + `<button class="tg" data-act="ctag" data-tag="${esc(m[3].toLowerCase())}">#${esc(m[3])}</button>`;
    last = TOK.lastIndex;
  }
  return out + fmtx(line.slice(last));
}
function rich(text) {
  const lines = String(text || '').split('\n');
  return lines.map(l => {
    const h = l.match(/^(#{1,3})\s+(.*)$/);
    if (h) return `<h4 class="h${h[1].length}">${inline(h[2])}</h4>`;
    if (/^-{3,}\s*$/.test(l)) return '<hr>';
    return inline(l) + '\n';
  }).join('');
}
function snippet(p, ql) {
  const t = (p.body || '').replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, a, b) => b || a).replace(/\s+/g, ' ').trim();
  if (ql) { const i = t.toLowerCase().indexOf(ql); if (i > 40) return '…' + t.slice(i - 30, i + 70); }
  return t.slice(0, 90);
}
const fdate = d => {
  if (!d) return '';
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, (m || 1) - 1, dd || 1).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const ageAt = d => {
  if (!S.born || !d) return null;
  const b = S.born.split('-').map(Number), x = d.split('-').map(Number);
  let a = x[0] - b[0]; if (x[1] < b[1] || (x[1] === b[1] && x[2] < b[2])) a--;
  return a;
};

// ---------- views ----------
function prune() {
  S.pages = P().filter(p => p.id === cs.id || (p.title || '').trim() || (p.body || '').trim());
}
const seg = () => `<div class="seg">${[['notes', '📚 Notes'], ['timeline', '🗓️ Timeline'], ['novels', '📖 Novels'], ['web', '🕸️ Web']].map(s =>
  `<button class="${cs.seg === s[0] ? 'on' : ''}" data-act="cseg" data-seg="${s[0]}">${s[1]}</button>`).join('')}</div>`;

function chronView() {
  const p = cur();
  if (p) return pageView(p);
  const body = cs.seg === 'timeline' ? timelineView() : cs.seg === 'novels' ? novelsView() : cs.seg === 'web' ? webView() : notesView();
  return back + seg() + body;
}
function notesView() {
  const tags = allTags().slice(0, 14);
  return `<div class="card"><h2>Chronicle</h2>
    <p class="dim">Memories, people, places and ideas, linked like a web. Use [[Title]] to link and #tag to group.</p>
    <div class="row">${['memory', 'person', 'place', 'idea'].map(k => `<button data-act="cnew" data-kind="${k}">${KINDS[k][0]} ${KINDS[k][1]}</button>`).join('')}</div></div>
    <div class="card"><input class="grow" style="width:100%" id="cq" data-pf="cq" placeholder="Search everything…" value="${esc(cs.q)}">
    ${tags.length ? `<div class="chips">${cs.tag ? `<button class="tg on" data-act="ctag" data-tag="${esc(cs.tag)}">#${esc(cs.tag)} ✕</button>` : ''}${tags.filter(t => t[0] !== cs.tag).map(t => `<button class="tg" data-act="ctag" data-tag="${esc(t[0])}">#${esc(t[0])} <small>${t[1]}</small></button>`).join('')}</div>` : ''}</div>
    <div id="clist">${notesList()}</div>`;
}
function notesList() {
  const ql = cs.q.trim().toLowerCase();
  let l = P().filter(p => ql || cs.tag ? true : p.kind !== 'chapter');
  if (cs.tag) l = l.filter(p => parse(p).tags.includes(cs.tag));
  if (ql) l = l.filter(p => ((p.title || '') + ' ' + (p.body || '')).toLowerCase().includes(ql));
  l = l.sort((a, b) => (b.upd || 0) - (a.upd || 0));
  let html = l.map(p => `<button class="citem" data-act="copen" data-id="${p.id}"><span class="em">${KINDS[p.kind] ? KINDS[p.kind][0] : '📜'}</span><span class="gr"><b>${esc(ptitle(p))}</b><small>${esc(snippet(p, ql))}</small></span><span class="dim">${wc(p.body)} w</span></button>`).join('');
  if (ql && !cs.tag) {
    const j = S.journal.filter(e => e.text.toLowerCase().includes(ql)).slice(0, 8);
    html += j.map(e => `<button class="citem" data-act="ctojournal" data-q="${esc(cs.q.trim())}"><span class="em">🖋️</span><span class="gr"><b>Journal · ${e.date}</b><small>${esc(e.text.replace(/\s+/g, ' ').slice(0, 90))}</small></span></button>`).join('');
  }
  return html || `<div class="card dim" style="text-align:center">${ql || cs.tag ? 'Nothing found.' : 'Nothing here yet. Record your first memory above.'}</div>`;
}

function timelineView() {
  const items = [];
  for (const p of P()) if (p.kind !== 'chapter' && p.date && (!cs.tag || parse(p).tags.includes(cs.tag)))
    items.push({ d: p.date, end: p.end, t: ptitle(p), s: snippet(p), id: p.id, k: KINDS[p.kind] ? KINDS[p.kind][0] : '📜', tags: parse(p).tags });
  if (cs.showJ && !cs.tag) for (const e of S.journal) items.push({ d: e.date, t: 'Journal', s: e.text.replace(/\s+/g, ' ').slice(0, 100), j: 1, k: '🖋️', tags: [] });
  if (S.born && !cs.tag) items.push({ d: S.born, t: 'Born', s: '', k: '🌱', tags: [], born: 1 });
  items.sort((a, b) => a.d.localeCompare(b.d) || (a.born ? -1 : 0));
  if (cs.rev) items.reverse();
  const undated = P().filter(p => p.kind === 'memory' && !p.date);
  let html = '', yr = '';
  for (const it of items) {
    const y = it.d.slice(0, 4);
    if (y !== yr) { yr = y; const a = ageAt(y + '-12-31'); html += `<h3 class="ty">${y}${S.born && a >= 0 ? ` <small>age ${ageAt(y + '-07-01')}</small>` : ''}</h3>`; }
    const body = `<span class="dim">${fdate(it.d)}${it.end ? ' – ' + fdate(it.end) : ''}</span><b>${it.k} ${esc(it.t)}</b>${it.s ? `<small>${esc(it.s)}</small>` : ''}${it.tags.length ? `<span class="tline">${it.tags.slice(0, 4).map(t => '#' + esc(t)).join(' ')}</span>` : ''}`;
    html += it.id ? `<button class="ev" data-act="copen" data-id="${it.id}">${body}</button>`
      : it.j ? `<button class="ev jr" data-act="ctojournal" data-q="">${body}</button>` : `<div class="ev born">${body}</div>`;
  }
  return `<div class="card"><h2>Life Timeline</h2>
    <div class="row"><label class="dim">Born <input type="date" data-pf="born" value="${esc(S.born || '')}"></label>
    <button data-act="cshowj">${cs.showJ ? 'Hide' : 'Show'} journal</button><button data-act="crev">${cs.rev ? 'Oldest first' : 'Newest first'}</button>
    <button data-act="cnew" data-kind="memory">＋ Memory</button></div>
    ${cs.tag ? `<div class="chips"><button class="tg on" data-act="ctag" data-tag="${esc(cs.tag)}">#${esc(cs.tag)} ✕</button></div>` : ''}
    <p class="dim">Give a memory a date and it appears here. Add an end date for a span of life, like school years.</p></div>
    ${html ? `<div class="tl">${html}</div>` : '<div class="card dim" style="text-align:center">No dated entries yet. Add a memory with a date.</div>'}
    ${undated.length ? `<div class="card"><h2>Undated memories</h2>${undated.map(p => `<button class="citem" data-act="copen" data-id="${p.id}"><span class="em">📜</span><span class="gr"><b>${esc(ptitle(p))}</b></span></button>`).join('')}</div>` : ''}`;
}

// ---------- novels ----------
const chaptersOf = id => P().filter(p => p.kind === 'chapter' && p.work === id).sort((a, b) => (a.ord || 0) - (b.ord || 0) || (a.created || 0) - (b.created || 0));
const workWords = id => chaptersOf(id).reduce((a, c) => a + wc(c.body), 0);
function novelsView() {
  const w = W().find(x => x.id === cs.wid);
  if (!w) {
    const l = W();
    return `<div class="card"><h2>Novels</h2><p class="dim">Write long stories chapter by chapter. Every 100 words earns 2 Qi.</p>
      <div class="row"><input class="grow" id="wtitle" placeholder="Title of a new novel"><button class="pri" data-act="cnewwork">Begin</button></div></div>
      ${l.map(x => { const n = workWords(x.id); return `<button class="citem" data-act="cwork" data-id="${x.id}"><span class="em">📕</span><span class="gr"><b>${esc(x.title || 'Untitled')}</b><small>${chaptersOf(x.id).length} chapters · ${n.toLocaleString()} words${x.goal ? ' · ' + Math.min(100, Math.round(n / x.goal * 100)) + '%' : ''}</small></span></button>`; }).join('')
      || '<div class="card dim" style="text-align:center">No novels yet. Name one above and begin.</div>'}`;
  }
  const chs = chaptersOf(w.id), n = chs.reduce((a, c) => a + wc(c.body), 0);
  if (cs.manu) return `<div class="row sb"><button class="back" data-act="cmanu">‹ ${esc(w.title || 'Novel')}</button><button data-act="cdl">Download .txt</button></div>
    <div class="card book"><h2>${esc(w.title || 'Untitled')}</h2>${w.blurb ? `<p class="dim">${esc(w.blurb)}</p>` : ''}
    ${chs.map(c => `<h3 class="ch">${esc(ptitle(c))}</h3><div class="prose">${rich(c.body)}</div>`).join('') || '<p class="dim">No chapters yet.</p>'}
    <p class="dim">${n.toLocaleString()} words</p></div>`;
  return `<button class="back" data-act="cseg" data-seg="novels">‹ All novels</button>
    <div class="card"><input class="grow" style="width:100%;font-size:1.2rem" data-pf="wtitle" value="${esc(w.title)}" placeholder="Title">
    <p><textarea data-pf="wblurb" rows="2" style="min-height:60px" placeholder="Premise, notes, a line to remember why you write this…">${esc(w.blurb || '')}</textarea></p>
    <div class="row"><label class="dim">Goal (words) <input type="number" min="0" step="1000" style="width:7em" data-pf="wgoal" value="${w.goal || ''}"></label>
    <span class="dim">${n.toLocaleString()} words</span></div>
    ${w.goal ? `<div class="bar thin"><i style="width:${Math.min(100, n / w.goal * 100)}%"></i></div>` : ''}
    <div class="row"><button data-act="cnew" data-kind="chapter" data-w="${w.id}">＋ New chapter</button><button data-act="cmanu">Read manuscript</button><button class="x" data-act="cdelwork">🗑 Delete novel</button></div></div>
    ${chs.map((c, i) => `<div class="citem chrow"><button class="grow-b" data-act="copen" data-id="${c.id}"><span class="em">${i + 1}</span><span class="gr"><b>${esc(ptitle(c))}</b><small>${wc(c.body).toLocaleString()} words</small></span></button>
      <span class="mv"><button data-act="cmove" data-id="${c.id}" data-d="-1"${i ? '' : ' disabled'}>▲</button><button data-act="cmove" data-id="${c.id}" data-d="1"${i < chs.length - 1 ? '' : ' disabled'}>▼</button></span></div>`).join('')
    || '<div class="card dim" style="text-align:center">No chapters yet. Add the first one.</div>'}`;
}

// ---------- web (graph) ----------
let gcache = { key: '', pos: null };
function layout(n, edges) {
  const pos = Array.from({ length: n }, (_, i) => { const a = i / n * 2 * Math.PI; return [.5 + Math.cos(a) * .4, .5 + Math.sin(a) * .4]; });
  const k = Math.sqrt(1 / Math.max(n, 1)) * .8; let temp = .1;
  for (let it = 0; it < 220; it++) {
    const d = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], l = Math.hypot(dx, dy) || .001, f = k * k / l;
      dx = dx / l * f; dy = dy / l * f; d[i][0] += dx; d[i][1] += dy; d[j][0] -= dx; d[j][1] -= dy;
    }
    for (const [a, b] of edges) {
      let dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1], l = Math.hypot(dx, dy) || .001, f = l * l / k;
      dx = dx / l * f; dy = dy / l * f; d[a][0] -= dx; d[a][1] -= dy; d[b][0] += dx; d[b][1] += dy;
    }
    for (let i = 0; i < n; i++) {
      d[i][0] += (.5 - pos[i][0]) * .15; d[i][1] += (.5 - pos[i][1]) * .15;
      const l = Math.hypot(d[i][0], d[i][1]) || .001, m = Math.min(l, temp);
      pos[i][0] += d[i][0] / l * m; pos[i][1] += d[i][1] / l * m;
    }
    temp *= .97;
  }
  const xs = pos.map(p => p[0]), ys = pos.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return pos.map(p => [8 + (p[0] - x0) / ((x1 - x0) || 1) * 84, 6 + (p[1] - y0) / ((y1 - y0) || 1) * 88]);
}
function webView() {
  const pg = P().filter(p => p.kind !== 'chapter'), tc = new Map(allTags());
  const nodes = [], ix = new Map(), edges = [];
  const deg = new Map();
  for (const p of pg) {
    const r = parse(p);
    deg.set('p' + p.id, r.links.filter(t => { const q = byTitle(t); return q && q.id !== p.id && q.kind !== 'chapter'; }).length + r.tags.filter(t => tc.get(t) > 1).length);
  }
  for (const p of pg) for (const t of parse(p).links) { const q = byTitle(t); if (q && q.kind !== 'chapter' && q.id !== p.id) deg.set('p' + q.id, (deg.get('p' + q.id) || 0) + 1); }
  const cand = pg.map(p => ({ key: 'p' + p.id, p })).concat([...tc].filter(t => t[1] > 1).map(t => ({ key: 't' + t[0], tag: t[0] })));
  cand.sort((a, b) => (deg.get(b.key) || tc.get(b.tag) || 0) - (deg.get(a.key) || tc.get(a.tag) || 0));
  cand.slice(0, 80).forEach(c => { ix.set(c.key, nodes.length); nodes.push(c); });
  const seen = new Set();
  for (const p of pg) {
    const a = ix.get('p' + p.id); if (a === undefined) continue; const r = parse(p);
    for (const t of r.links) { const q = byTitle(t), b = q && ix.get('p' + q.id); if (b !== undefined && b !== a && !seen.has(a + '-' + b) && !seen.has(b + '-' + a)) { seen.add(a + '-' + b); edges.push([a, b]); } }
    for (const t of r.tags) { const b = ix.get('t' + t); if (b !== undefined) edges.push([a, b]); }
  }
  const head = `<div class="card"><h2>Web of Memory</h2><p class="dim">Notes joined by [[links]] and shared #tags. Tap a node to open it.</p></div>`;
  if (nodes.length < 2 || !edges.length) return head + `<div class="card dim" style="text-align:center">The web grows as you link notes. Write [[Title]] inside a note to connect it to another.</div>`;
  const key = nodes.map(c => c.key).join() + '|' + edges.length;
  if (gcache.key !== key) gcache = { key, pos: layout(nodes.length, edges) };
  const pos = gcache.pos;
  return head + `<div class="graph"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${edges.map(e => `<line x1="${pos[e[0]][0]}" y1="${pos[e[0]][1]}" x2="${pos[e[1]][0]}" y2="${pos[e[1]][1]}"/>`).join('')}</svg>
    ${nodes.map((c, i) => {
      const lab = c.p ? ptitle(c.p) : '#' + c.tag, st = `left:${pos[i][0]}%;top:${pos[i][1]}%`;
      return c.p ? `<button class="gnode" style="${st}" data-act="copen" data-id="${c.p.id}">${esc(lab.length > 16 ? lab.slice(0, 15) + '…' : lab)}</button>`
        : `<button class="gnode t" style="${st}" data-act="ctag" data-tag="${esc(c.tag)}">${esc(lab)}</button>`;
    }).join('')}</div>`;
}

// ---------- single page ----------
function pageView(p) {
  const kind = KINDS[p.kind] || KINDS.memory, isCh = p.kind === 'chapter';
  const w = isCh && W().find(x => x.id === p.work);
  const bk = `<button class="back" data-act="cclose">‹ ${isCh ? esc(w ? w.title || 'Novel' : 'Novel') : 'Chronicle'}</button>`;
  if (cs.edit) {
    const others = P().filter(x => x.id !== p.id && (x.title || '').trim()).sort((a, b) => a.title.localeCompare(b.title));
    return bk + `<div class="card ed">
      <div class="row">${isCh ? `<span class="dim">📖 Chapter</span>` : `<select data-pf="kind">${['memory', 'person', 'place', 'idea'].map(k => `<option value="${k}"${p.kind === k ? ' selected' : ''}>${KINDS[k][0]} ${KINDS[k][1]}</option>`).join('')}</select>`}
      <input class="grow" data-pf="title" placeholder="${isCh ? 'Chapter title' : 'Title'}" value="${esc(p.title || '')}"></div>
      ${isCh ? '' : `<div class="row"><label class="dim">When <input type="date" data-pf="date" value="${esc(p.date || '')}"></label><label class="dim">until <input type="date" data-pf="end" value="${esc(p.end || '')}"></label></div>`}
      <div class="row"><select data-pf="ins"><option value="">＋ Insert link…</option>${others.map(x => `<option value="${esc(x.title)}">${esc(x.title)}</option>`).join('')}</select></div>
      <textarea id="cbody" data-pf="body" rows="16" style="min-height:300px" placeholder="${esc(kind[2])}">${esc(p.body || '')}</textarea>
      <div class="row sb"><span class="dim" id="cwc">${wc(p.body)} words · +${pageQi(p)} Qi</span><span><button data-act="cdone">Done</button> <button class="x" data-act="cdel">🗑 Delete</button></span></div>
      <p class="dim">[[Title]] links to a note · #tag groups notes · **bold** · *italic* · # Heading. Saved as you type.</p></div>`;
  }
  const r = parse(p), mine = (p.title || '').trim().toLowerCase();
  const back_ = mine ? P().filter(x => x.id !== p.id && parse(x).links.includes(mine)) : [];
  const mentions = mine.length >= 3 ? P().filter(x => x.id !== p.id && !parse(x).links.includes(mine) && (x.body || '').toLowerCase().includes(mine)) : [];
  const jm = mine.length >= 3 ? S.journal.filter(e => e.text.toLowerCase().includes(mine)).slice(0, 5) : [];
  const out = [...new Set(r.links)].map(t => ({ t, q: byTitle(t) }));
  const li = x => `<button class="citem" data-act="copen" data-id="${x.id}"><span class="em">${KINDS[x.kind] ? KINDS[x.kind][0] : '📜'}</span><span class="gr"><b>${esc(ptitle(x))}</b><small>${esc(snippet(x))}</small></span></button>`;
  let nav = '';
  if (isCh) {
    const chs = chaptersOf(p.work), i = chs.findIndex(c => c.id === p.id);
    nav = `<div class="row sb">${i > 0 ? `<button data-act="copen" data-id="${chs[i - 1].id}">‹ ${esc(ptitle(chs[i - 1]))}</button>` : '<span></span>'}${i < chs.length - 1 ? `<button data-act="copen" data-id="${chs[i + 1].id}">${esc(ptitle(chs[i + 1]))} ›</button>` : ''}</div>`;
  }
  return bk + `<div class="card"><div class="row sb"><span class="dim">${kind[0]} ${kind[1]}${p.date ? ' · ' + fdate(p.date) + (p.end ? ' – ' + fdate(p.end) : '') : ''}${!isCh && S.born && p.date && ageAt(p.date) >= 0 ? ` · age ${ageAt(p.date)}` : ''}</span><button data-act="cedit">Edit</button></div>
    <h2>${esc(ptitle(p))}</h2><div class="prose${isCh ? ' book' : ''}">${rich(p.body) || '<span class="dim">Empty. Press Edit to write.</span>'}</div>
    <p class="dim">${wc(p.body).toLocaleString()} words</p></div>${nav}
    ${out.some(o => !o.q) ? `<div class="card"><h2>Unwritten links</h2><div class="chips">${out.filter(o => !o.q).map(o => `<button class="wl new" data-act="golink" data-t="${esc(o.t)}">${esc(o.t)}</button>`).join('')}</div></div>` : ''}
    ${back_.length ? `<div class="card"><h2>Linked from</h2>${back_.map(li).join('')}</div>` : ''}
    ${mentions.length ? `<div class="card"><h2>Also mentioned in</h2>${mentions.map(li).join('')}</div>` : ''}
    ${jm.length ? `<div class="card"><h2>Journal mentions</h2>${jm.map(e => `<button class="citem" data-act="ctojournal" data-q="${esc(p.title.trim())}"><span class="em">🖋️</span><span class="gr"><b>${e.date}</b><small>${esc(e.text.replace(/\s+/g, ' ').slice(0, 90))}</small></span></button>`).join('')}</div>` : ''}`;
}

// ---------- actions ----------
function openPage(p, edit) {
  cs.id = p.id; cs.edit = !!edit; cs.old = (p.title || '').trim();
  if (p.kind === 'chapter') { cs.seg = 'novels'; cs.wid = p.work || ''; }
  prune(); window.scrollTo(0, 0);
}
function newPage(kind, extra) {
  const now = Date.now(), p = Object.assign({ id: uid(), kind, title: '', body: '', date: kind === 'memory' ? ymd() : '', end: '', created: now, upd: now }, extra);
  P().push(p); openPage(p, true);
}
const XC = {
  cseg(el) { prune(); cs.id = ''; cs.seg = el.dataset.seg; cs.wid = ''; cs.manu = false; cs.tag = ''; cs.q = ''; tab = 'settings'; moreSub = 'chron'; window.scrollTo(0, 0); },
  cnew(el) {
    tab = 'settings'; moreSub = 'chron';
    if (el.dataset.kind === 'chapter') { const chs = chaptersOf(el.dataset.w); newPage('chapter', { work: el.dataset.w, ord: chs.length ? (chs[chs.length - 1].ord || 0) + 1 : 1 }); }
    else newPage(el.dataset.kind);
  },
  copen(el) { const p = P().find(x => x.id === el.dataset.id); tab = 'settings'; moreSub = 'chron'; if (p) openPage(p, false); },
  cedit() { cs.edit = true; },
  cdone() { cs.edit = false; prune(); },
  cclose() { prune(); cs.id = ''; cs.edit = false; window.scrollTo(0, 0); },
  cdel() {
    const p = cur(); if (!p || !confirm(`Delete "${ptitle(p)}"? This cannot be undone.`)) return;
    S.banked = (S.banked || 0) + pageQi(p); S.pages = P().filter(x => x.id !== p.id); cs.id = '';
  },
  golink(el) {
    const t = el.dataset.t, p = byTitle(t);
    if (p) openPage(p, false); else newPage('idea', { title: t, date: '' });
  },
  ctag(el) { const t = el.dataset.tag; cs.tag = cs.tag === t && cs.seg === 'notes' ? '' : t; if (cs.seg !== 'timeline') cs.seg = 'notes'; cs.id = ''; cs.q = ''; tab = 'settings'; moreSub = 'chron'; prune(); },
  cshowj() { cs.showJ = !cs.showJ; },
  crev() { cs.rev = !cs.rev; },
  ctojournal(el) { tab = 'journal'; q = el.dataset.q || ''; window.scrollTo(0, 0); },
  cwork(el) { cs.wid = el.dataset.id; cs.manu = false; window.scrollTo(0, 0); },
  cnewwork() {
    const t = (document.getElementById('wtitle').value || '').trim(); if (!t) return;
    const w = { id: uid(), title: t, blurb: '', goal: 0 }; W().push(w); cs.wid = w.id;
  },
  cmanu() { cs.manu = !cs.manu; window.scrollTo(0, 0); },
  cdelwork() {
    const w = W().find(x => x.id === cs.wid); if (!w) return;
    if (!confirm(`Delete "${w.title || 'this novel'}" and all its chapters? This cannot be undone.`)) return;
    for (const c of chaptersOf(w.id)) S.banked = (S.banked || 0) + pageQi(c);
    S.pages = P().filter(p => p.work !== w.id); S.works = W().filter(x => x.id !== w.id); cs.wid = '';
  },
  cmove(el) {
    const chs = chaptersOf(cs.wid), i = chs.findIndex(c => c.id === el.dataset.id), j = i + +el.dataset.d;
    if (i < 0 || j < 0 || j >= chs.length) return;
    [chs[i], chs[j]] = [chs[j], chs[i]]; chs.forEach((c, n) => c.ord = n + 1);
  },
  cdl() {
    const w = W().find(x => x.id === cs.wid); if (!w) return;
    const txt = w.title + '\n\n' + (w.blurb ? w.blurb + '\n\n' : '') + chaptersOf(w.id).map(c => '## ' + ptitle(c) + '\n\n' + (c.body || '')).join('\n\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = ((w.title || 'novel').replace(/[^\w\- ]+/g, '').trim() || 'novel') + '.txt'; a.click();
  }
};
Object.assign(XA, XC);
pages.chron = chronView;

// ---------- live editing (no re-render, so typing is never interrupted) ----------
let svT = 0;
const saveSoon = () => { clearTimeout(svT); svT = setTimeout(save, 350); };
addEventListener('pagehide', () => { clearTimeout(svT); save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(svT); save(); } });
function pf(e) {
  const el = e.target, f = el.dataset && el.dataset.pf; if (!f) return;
  const ch = e.type === 'change';
  if (f === 'cq') { cs.q = el.value; const l = document.getElementById('clist'); if (l) l.innerHTML = notesList(); return; }
  if (f === 'born') { if (ch) { S.born = el.value; save(); render(); } return; }
  if (f[0] === 'w') {
    const w = W().find(x => x.id === cs.wid); if (!w) return;
    if (f === 'wtitle') w.title = el.value; else if (f === 'wblurb') w.blurb = el.value;
    else if (f === 'wgoal') { w.goal = Math.max(0, +el.value || 0); if (ch) { save(); render(); return; } }
    saveSoon(); return;
  }
  const p = cur(); if (!p) return;
  if (f === 'ins') {
    if (!ch || !el.value) return;
    const t = document.getElementById('cbody'), pos = t.selectionStart ?? t.value.length, ins = `[[${el.value}]]`;
    t.value = t.value.slice(0, pos) + ins + t.value.slice(t.selectionEnd ?? pos);
    p.body = t.value; p.upd = Date.now(); el.value = ''; t.focus(); t.setSelectionRange(pos + ins.length, pos + ins.length);
  } else if (f === 'body') { p.body = el.value; p.upd = Date.now(); }
  else if (f === 'title') {
    p.title = el.value; p.upd = Date.now();
    const nt = el.value.trim();
    if (ch && cs.old && nt && cs.old.toLowerCase() !== nt.toLowerCase()) {
      const rx = new RegExp('\\[\\[\\s*' + rxEsc(cs.old) + '\\s*(\\|[^\\]]*)?\\]\\]', 'gi');
      for (const x of P()) if (x.body && rx.test(x.body)) { rx.lastIndex = 0; x.body = x.body.replace(rx, (_, a) => `[[${nt}${a || ''}]]`); x.upd = Date.now(); }
      rx.lastIndex = 0;
    }
    if (ch) cs.old = nt;
  } else if (f === 'kind') p.kind = el.value;
  else if (f === 'date') p.date = el.value;
  else if (f === 'end') p.end = el.value;
  const c = document.getElementById('cwc'); if (c) c.textContent = `${wc(p.body)} words · +${pageQi(p)} Qi`;
  saveSoon();
}
document.addEventListener('input', pf);
document.addEventListener('change', pf);

// ---------- hooks into the rest of the app ----------
const _after = extrasAfter;
extrasAfter = function () {
  if (!(tab === 'settings' && moreSub === 'chron')) { if (cs.id) { cs.id = ''; cs.edit = false; } prune(); }
  _after();
};
function onThisDay() {
  const md = ymd().slice(5), y = new Date().getFullYear(), items = [];
  for (const p of P()) if (p.kind !== 'chapter' && p.date && p.date.slice(5) === md && +p.date.slice(0, 4) < y) items.push(`<button data-act="copen" data-id="${p.id}">${p.date.slice(0, 4)} · ${esc(ptitle(p))}</button>`);
  for (const e of S.journal) if (e.date.slice(5) === md && +e.date.slice(0, 4) < y) items.push(`<button data-act="ctojournal" data-q="">${e.date.slice(0, 4)} · ${esc(e.text.replace(/\s+/g, ' ').slice(0, 28))}…</button>`);
  return items.length ? `<div class="skyline"><span>📜 On this day</span>${items.slice(0, 3).join('')}</div>` : '';
}
const _te = todayExtras;
todayExtras = () => _te() + onThisDay();

function chronStats() {
  const pg = P(), mem = pg.filter(p => p.kind === 'memory' && ((p.body || '').trim() || (p.title || '').trim())).length;
  return { mem, links: pg.reduce((a, p) => a + parse(p).links.length, 0), nov: pg.filter(p => p.kind === 'chapter').reduce((a, p) => a + wc(p.body), 0), total: pg.length };
}
ACH.push(
  ['mem1', '🪶', 'First Memory', 'Record your first memory', () => chronStats().mem, 1],
  ['mem25', '🗓️', 'Keeper of Years', 'Record 25 memories', () => chronStats().mem, 25],
  ['mem100', '🏛️', 'Living Archive', 'Record 100 memories', () => chronStats().mem, 100],
  ['link25', '🕸️', 'Web of Threads', 'Create 25 links between notes', () => chronStats().links, 25],
  ['nov1k', '📕', 'Opening Chapter', 'Write 1,000 words in a novel', () => chronStats().nov, 1000],
  ['nov10k', '📗', 'Rising Action', 'Write 10,000 words in a novel', () => chronStats().nov, 10000],
  ['nov50k', '📚', 'Novel Length', 'Write 50,000 words in a novel', () => chronStats().nov, 50000]
);
