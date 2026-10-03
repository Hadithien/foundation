'use strict';
// Calligraphy studio: layered canvas (paper / ink / stroke / grid), brushes, fill, history, gallery in IndexedDB.
(function () {
  const BASE = { brush: 1, dry: .95, nib: 1, pen: 1, marker: .55, pencil: 1, wash: 1, spray: 1 };
  const FREE = new Set(['brush', 'dry', 'nib', 'pen', 'marker', 'pencil', 'wash', 'spray', 'eraser']);
  const SHAPE = new Set(['line', 'rect', 'oval']);
  const TOOLS = [
    ['brush', 'Ink', 'Ink brush: width follows speed (or pen pressure)'],
    ['dry', 'Dry', 'Dry brush 飞白: flying-white streaks'],
    ['nib', 'Nib', 'Flat calligraphy nib'],
    ['pen', 'Pen', 'Even round pen'],
    ['marker', 'Marker', 'Translucent marker'],
    ['pencil', 'Pencil', 'Grainy pencil'],
    ['wash', 'Wash', 'Soft ink wash'],
    ['spray', 'Spray', 'Spray / splatter'],
    ['eraser', 'Erase', 'Eraser'],
    ['fill', 'Fill', 'Bucket fill'],
    ['line', 'Line', 'Straight line (Shift = 45°)'],
    ['rect', 'Box', 'Rectangle (Shift = square)'],
    ['oval', 'Oval', 'Ellipse (Shift = circle)'],
    ['pick', 'Pick', 'Eyedropper']
  ];
  const SWATCHES = [['#1a1410', 'Sumi'], ['#b3261e', 'Cinnabar'], ['#d9482b', 'Vermilion'], ['#c99a2e', 'Gold'], ['#a8742a', 'Ochre'], ['#3f7a52', 'Jade'],
    ['#6b8e3a', 'Moss'], ['#9db8a0', 'Celadon'], ['#2b3a67', 'Indigo'], ['#6b2f55', 'Plum'], ['#8a8378', 'Ash'], ['#f6efe0', 'Rice']];
  const PAPERS = {
    rice: { n: 'Rice paper', bg: '#f3ebd6', fib: 'rgba(150,120,70,.10)', edge: 'rgba(120,90,40,.18)', grid: 'rgba(168,35,26,.38)' },
    parchment: { n: 'Parchment', bg: '#dcc690', fib: 'rgba(90,60,20,.12)', edge: 'rgba(70,40,10,.35)', grid: 'rgba(168,35,26,.38)' },
    red: { n: 'Red couplet', bg: '#a8231a', fib: 'rgba(255,200,120,.08)', edge: 'rgba(40,0,0,.35)', grid: 'rgba(240,210,120,.45)' },
    night: { n: 'Night slate', bg: '#14100d', fib: 'rgba(255,255,255,.03)', edge: 'rgba(0,0,0,.5)', grid: 'rgba(230,195,106,.35)' },
    white: { n: 'Plain white', bg: '#ffffff', fib: null, edge: null, grid: 'rgba(168,35,26,.35)' }
  };
  const SIZES = [['1000x1000', 'Square'], ['900x1200', 'Portrait'], ['1200x900', 'Landscape'], ['600x1400', 'Scroll']];
  const P = (d, extra = '') => `<path d="${d}" ${extra}/>`;
  const SOFT = 'fill="currentColor" fill-opacity=".3"';
  const I = {
    brush: P('M19 3 10 12') + P('M10 12c-3-1-5 1-5 3 0 2-1 3-3 4 4 2 9 1 10-2 .8-2-.3-4-2-5z', SOFT),
    dry: P('M19 3 11 11') + P('M11 11 5 21M11 11 8 21M11 11 11 21M11 11 14 20'),
    nib: P('M5 17 15 7l4 4-10 10z', SOFT) + P('M15 7l3-3 4 4-3 3M5 17l-2 4 4-2'),
    pen: P('M4 20l1-5L17 3l4 4L9 19z', SOFT) + P('M14 6l4 4'),
    marker: '<g transform="rotate(35 12 12)"><rect x="9" y="2" width="6" height="14" rx="1"/>' + P('M9 16h6l-1 5h-4z', SOFT) + '</g>',
    pencil: P('M4 20l1.5-5L16 4.5 19.5 8 9 18.5z') + P('M14 7l3.5 3.5M4 20l3.5-1'),
    wash: P('M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', SOFT),
    spray: '<rect x="9" y="11" width="7" height="10" rx="1.5"/>' + P('M11 11V8h3v3') + '<g fill="currentColor"><circle cx="5" cy="6" r=".9"/><circle cx="7.5" cy="9" r=".9"/><circle cx="4" cy="10" r=".9"/><circle cx="8" cy="4" r=".9"/></g>',
    eraser: P('M4 15 13 6l6 6-7 7H8z', SOFT) + P('M9 10l6 6M12 19h8'),
    fill: P('M5 11 12 4l7 7-7 7z', SOFT) + P('M19 15c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z', 'fill="currentColor"'),
    line: P('M4 20 20 4'),
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    oval: '<ellipse cx="12" cy="12" rx="9" ry="6"/>',
    pick: P('M14 6l4 4M17 3a2.8 2.8 0 0 1 4 4l-3 3-4-4zM14 10 5 19v2h2l9-9'),
    undo: P('M9 14 4 9l5-5') + P('M4 9h10a6 6 0 0 1 0 12h-3'),
    redo: P('M15 14l5-5-5-5') + P('M20 9H10a6 6 0 0 0 0 12h3'),
    clear: P('M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13'),
    mirror: P('M12 3v18', 'stroke-dasharray="2 2"') + P('M9 7 4 12l5 5zM15 7l5 5-5 5z'),
    grid: '<rect x="4" y="4" width="16" height="16"/>' + P('M12 4v16M4 12h16'),
    download: P('M12 4v11M7 11l5 5 5-5M5 20h14'),
    swap: P('M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7')
  };
  const svg = (n, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ---------- IndexedDB ----------
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('foundation-art', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('drawings', { keyPath: 'id' }); r.result.createObjectStore('kv', { keyPath: 'key' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const op = async (name, mode, fn) => {
    const d = await db(), req = fn(d.transaction(name, mode).objectStore(name));
    return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
  };
  const dbPut = (s, v) => op(s, 'readwrite', o => o.put(v));
  const dbGet = (s, k) => op(s, 'readonly', o => o.get(k));
  const dbAll = s => op(s, 'readonly', o => o.getAll());
  const dbDel = (s, k) => op(s, 'readwrite', o => o.delete(k));
  const dbClear = s => op(s, 'readwrite', o => o.clear());

  // ---------- state ----------
  const SKEYS = ['tool', 'size', 'opacity', 'smooth', 'nib', 'color', 'fill', 'shape', 'mirror', 'grid', 'gridN'];
  const st = { tool: 'brush', size: 14, opacity: 100, smooth: 30, nib: 45, color: '#1a1410', fill: '#b3261e', target: 'stroke', shape: 'outline', mirror: false, grid: 'none', gridN: 3, paper: 'rice', W: 1000, H: 1000, name: '', id: null };
  try { const s = JSON.parse(localStorage.getItem('foundation.art.settings') || '{}'); SKEYS.forEach(k => { if (k in s) st[k] = s[k]; }); } catch { }
  const saveSettings = () => localStorage.setItem('foundation.art.settings', JSON.stringify(Object.fromEntries(SKEYS.map(k => [k, st[k]]))));
  let opts = {}, rootEl = null, stage, paperC, inkC, strokeC, gridC, pc, ic, sc, gc;
  let hist = [], hi = -1, modified = false, cur = null, draftT = null;

  // ---------- stage / layers ----------
  function makeStage() {
    stage = document.createElement('div');
    stage.className = 'art-stage';
    [paperC, inkC, strokeC, gridC] = [0, 1, 2, 3].map(() => { const c = document.createElement('canvas'); stage.appendChild(c); return c; });
    [pc, ic, sc, gc] = [paperC, inkC, strokeC, gridC].map(c => c.getContext('2d', { willReadFrequently: c === inkC }));
    setSize(st.W, st.H);
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('contextmenu', e => e.preventDefault());
  }
  function setSize(W, H) {
    st.W = W; st.H = H;
    [paperC, inkC, strokeC, gridC].forEach(c => { c.width = W; c.height = H; });
    stage.style.aspectRatio = `${W}/${H}`;
    stage.style.width = `min(100%, ${Math.round(72 * W / H)}vh)`;
    drawPaper(); drawGrid();
  }
  function paintPaper(ctx, W, H, id) {
    const p = PAPERS[id] || PAPERS.rice;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
    if (p.fib) {
      const r = rng(7); ctx.strokeStyle = p.fib; ctx.lineWidth = 1.2;
      for (let i = 0; i < W * H / 1800; i++) {
        const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 30;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      }
    }
    if (p.edge) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, p.edge);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  const drawPaper = () => paintPaper(pc, st.W, st.H, st.paper);
  function drawGrid() {
    gc.clearRect(0, 0, st.W, st.H);
    if (st.grid === 'none') return;
    const s = st.W / st.gridN;
    gc.strokeStyle = PAPERS[st.paper].grid; gc.lineWidth = 2;
    for (let oy = 0; oy + s <= st.H + 1; oy += s) for (let ox = 0; ox < st.W - 1; ox += s) {
      gc.setLineDash([]); gc.strokeRect(ox + 1, oy + 1, s - 2, s - 2);
      gc.setLineDash([9, 9]); gc.beginPath();
      gc.moveTo(ox + s / 2, oy); gc.lineTo(ox + s / 2, oy + s); gc.moveTo(ox, oy + s / 2); gc.lineTo(ox + s, oy + s / 2);
      if (st.grid === 'mi') { gc.moveTo(ox, oy); gc.lineTo(ox + s, oy + s); gc.moveTo(ox + s, oy); gc.lineTo(ox, oy + s); }
      gc.stroke();
    }
    gc.setLineDash([]);
  }
  function composite(scale = 1) {
    const c = document.createElement('canvas'); c.width = Math.round(st.W * scale); c.height = Math.round(st.H * scale);
    const x = c.getContext('2d'); x.drawImage(paperC, 0, 0, c.width, c.height); x.drawImage(inkC, 0, 0, c.width, c.height);
    return c;
  }

  // ---------- history ----------
  const snap = () => ic.getImageData(0, 0, st.W, st.H);
  function resetHist() { hist = [snap()]; hi = 0; updateButtons(); }
  function pushHist() {
    hist = hist.slice(0, hi + 1); hist.push(snap());
    if (hist.length > 25) hist.shift();
    hi = hist.length - 1; modified = true; scheduleDraft(); updateButtons();
  }
  function undo() { if (hi > 0) { hi--; ic.putImageData(hist[hi], 0, 0); modified = true; scheduleDraft(); updateButtons(); } }
  function redo() { if (hi < hist.length - 1) { hi++; ic.putImageData(hist[hi], 0, 0); modified = true; scheduleDraft(); updateButtons(); } }
  function updateButtons() {
    if (!rootEl || !rootEl.isConnected) return;
    const u = rootEl.querySelector('[data-do=undo]'), r = rootEl.querySelector('[data-do=redo]');
    if (u) u.disabled = hi <= 0; if (r) r.disabled = hi >= hist.length - 1;
  }

  // ---------- drawing ----------
  function pos(e) {
    const r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) * st.W / r.width, y: (e.clientY - r.top) * st.H / r.height };
  }
  function withMirror(fn) {
    const c = st.tool === 'eraser' ? ic : sc;
    const run = () => { c.save(); if (st.tool === 'eraser') { c.globalCompositeOperation = 'destination-out'; c.globalAlpha = st.opacity / 100; } fn(c); c.restore(); };
    run();
    if (st.mirror) { c.save(); c.translate(st.W, 0); c.scale(-1, 1); run(); c.restore(); }
  }
  const setStrokeAlpha = () => { strokeC.style.opacity = st.opacity / 100 * (BASE[st.tool] ?? 1); };

  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const p = pos(e), t = st.tool;
    if (t === 'fill') { bucket(p.x, p.y); return; }
    if (t === 'pick') { pick(p.x, p.y); return; }
    try { stage.setPointerCapture(e.pointerId); } catch { }
    setStrokeAlpha();
    if (SHAPE.has(t)) { cur = { shape: true, a: p, b: p }; return; }
    const N = Math.max(6, Math.min(48, Math.round(st.size * .8)));
    cur = {
      x: p.x, y: p.y, px: p.x, py: p.y, t: e.timeStamp, pts: [{ x: p.x, y: p.y, w: t === 'brush' ? st.size * .6 : st.size }], w: null, v: 0, n: 0, len: 0,
      bristles: Array.from({ length: N }, () => ({ o: Math.random() * 2 - 1, t: Math.random() })), timer: null
    };
    if (t === 'spray') { spray(cur.x, cur.y); cur.timer = setInterval(() => cur && spray(cur.x, cur.y), 30); }
    else if (t === 'brush' || t === 'pen' || t === 'marker' || t === 'eraser') {
      withMirror(c => { c.fillStyle = st.color; c.beginPath(); c.arc(p.x, p.y, cur.pts[0].w / 2, 0, 6.2832); c.fill(); });
    }
  }
  function move(e) {
    if (!cur) return;
    if (cur.shape) {
      let b = pos(e); const a = cur.a;
      if (e.shiftKey) {
        const dx = b.x - a.x, dy = b.y - a.y;
        if (st.tool === 'line') { const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, l = Math.hypot(dx, dy); b = { x: a.x + Math.cos(ang) * l, y: a.y + Math.sin(ang) * l }; }
        else { const m = Math.max(Math.abs(dx), Math.abs(dy)); b = { x: a.x + Math.sign(dx || 1) * m, y: a.y + Math.sign(dy || 1) * m }; }
      }
      cur.b = b; sc.clearRect(0, 0, st.W, st.H);
      withMirror(c => drawShape(c, a, b));
      return;
    }
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    const k = 1 - st.smooth / 100 * .92;
    for (const ev of evs) {
      const r = pos(ev);
      cur.x += (r.x - cur.x) * k; cur.y += (r.y - cur.y) * k;
      step(ev);
    }
  }
  function widthFor(ev) {
    const s = st.size, t = st.tool;
    if (t === 'brush' || t === 'dry') {
      if (ev.pointerType === 'pen' && ev.pressure > 0) return s * (.2 + 1.1 * ev.pressure);
      return s * (1.15 - .8 * cur.v);
    }
    return s;
  }
  function step(ev) {
    const t = st.tool, dx = cur.x - cur.px, dy = cur.y - cur.py, dist = Math.hypot(dx, dy);
    if (t !== 'spray' && dist < .6) return;
    const dt = Math.max(1, ev.timeStamp - cur.t);
    cur.v = cur.v * .7 + Math.min(1, dist / dt / 2.5) * .3;
    const target = widthFor(ev);
    cur.w = cur.w == null ? target : cur.w + (target - cur.w) * .3;
    cur.n++; cur.len += dist;
    let w = cur.w; if (t === 'brush' && cur.n < 8) w *= .5 + .5 * cur.n / 8;
    const a = { x: cur.px, y: cur.py }, b = { x: cur.x, y: cur.y };
    if (t === 'brush' || t === 'pen' || t === 'marker' || t === 'eraser') {
      cur.pts.push({ x: b.x, y: b.y, w: Math.max(.8, w) });
      const P = cur.pts, n = P.length, mid = (i, j) => ({ x: (P[i].x + P[j].x) / 2, y: (P[i].y + P[j].y) / 2 });
      withMirror(c => {
        c.lineCap = t === 'marker' ? 'square' : 'round'; c.lineJoin = 'round'; c.strokeStyle = st.color; c.lineWidth = P[Math.max(0, n - 2)].w;
        c.beginPath();
        if (n === 2) { c.moveTo(P[0].x, P[0].y); const m = mid(0, 1); c.lineTo(m.x, m.y); }
        else { const m0 = mid(n - 3, n - 2), m1 = mid(n - 2, n - 1); c.moveTo(m0.x, m0.y); c.quadraticCurveTo(P[n - 2].x, P[n - 2].y, m1.x, m1.y); }
        c.stroke();
      });
    } else if (t === 'nib') {
      const ang = st.nib * Math.PI / 180, ca = Math.cos(ang) * st.size / 2, sa = -Math.sin(ang) * st.size / 2, steps = Math.ceil(dist);
      withMirror(c => {
        c.strokeStyle = st.color; c.lineWidth = 1.6; c.lineCap = 'butt'; c.beginPath();
        for (let i = 1; i <= steps; i++) { const x = a.x + dx * i / steps, y = a.y + dy * i / steps; c.moveTo(x - ca, y - sa); c.lineTo(x + ca, y + sa); }
        c.stroke();
      });
    } else if (t === 'dry') {
      const half = Math.max(1, w) / 2, nx = -dy / dist, ny = dx / dist, dry = cur.v * .75, bw = Math.max(1, w / cur.bristles.length * 1.8);
      withMirror(c => {
        c.strokeStyle = st.color; c.lineWidth = bw; c.lineCap = 'round';
        cur.bristles.forEach((br, i) => {
          if (br.t + .25 * Math.sin(cur.len * .04 + i * 5.3) <= dry - .05) return;
          const ox = nx * br.o * half, oy = ny * br.o * half;
          c.beginPath(); c.moveTo(a.x + ox, a.y + oy); c.lineTo(b.x + ox, b.y + oy); c.stroke();
        });
      });
    } else if (t === 'pencil') {
      const steps = Math.max(1, Math.ceil(dist / 2)), cnt = Math.max(2, Math.round(st.size * .6));
      withMirror(c => {
        c.fillStyle = st.color; c.globalAlpha = .45;
        for (let i = 1; i <= steps; i++) {
          const x = a.x + dx * i / steps, y = a.y + dy * i / steps;
          for (let k = 0; k < cnt; k++) { const an = Math.random() * 6.28, r = Math.sqrt(Math.random()) * st.size / 2; c.fillRect(x + Math.cos(an) * r, y + Math.sin(an) * r, 1.3, 1.3); }
        }
      });
    } else if (t === 'wash') {
      const gap = Math.max(2, st.size * .15), steps = Math.max(1, Math.ceil(dist / gap)), [r, g, bl] = rgb(st.color), R = st.size;
      withMirror(c => {
        for (let i = 1; i <= steps; i++) {
          const x = a.x + dx * i / steps, y = a.y + dy * i / steps, gr = c.createRadialGradient(x, y, 0, x, y, R);
          gr.addColorStop(0, `rgba(${r},${g},${bl},.10)`); gr.addColorStop(1, `rgba(${r},${g},${bl},0)`);
          c.fillStyle = gr; c.fillRect(x - R, y - R, R * 2, R * 2);
        }
      });
    } else if (t === 'spray') spray(cur.x, cur.y);
    cur.px = cur.x; cur.py = cur.y; cur.t = ev.timeStamp;
  }
  function spray(x, y) {
    const R = st.size * 1.1, cnt = Math.round(st.size * .8 + 8);
    withMirror(c => {
      c.fillStyle = st.color;
      for (let i = 0; i < cnt; i++) { const an = Math.random() * 6.28, r = R * Math.sqrt(Math.random()); c.fillRect(x + Math.cos(an) * r, y + Math.sin(an) * r, 1.4, 1.4); }
    });
  }
  function drawShape(c, a, b) {
    const t = st.tool, x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    c.lineWidth = st.size; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
    if (t === 'line') { c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.strokeStyle = st.color; c.stroke(); return; }
    if (t === 'rect') c.rect(x, y, w, h); else c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.2832);
    if (st.shape === 'solid') { c.fillStyle = st.color; c.fill(); }
    else if (st.shape === 'both') { c.fillStyle = st.fill; c.fill(); c.strokeStyle = st.color; c.stroke(); }
    else { c.strokeStyle = st.color; c.stroke(); }
  }
  function end() {
    if (!cur) return;
    clearInterval(cur.timer);
    const t = st.tool;
    if (!cur.shape && cur.pts.length > 1 && (t === 'brush' || t === 'pen' || t === 'marker' || t === 'eraser')) {
      const P = cur.pts, a = P[P.length - 2], b = P[P.length - 1], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      withMirror(c => { c.lineCap = t === 'marker' ? 'square' : 'round'; c.strokeStyle = st.color; c.lineWidth = b.w * .6; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(b.x, b.y); c.stroke(); });
    }
    if (t !== 'eraser') {
      ic.save(); ic.globalAlpha = st.opacity / 100 * (SHAPE.has(t) ? 1 : (BASE[t] ?? 1)); ic.drawImage(strokeC, 0, 0); ic.restore();
      sc.clearRect(0, 0, st.W, st.H);
    }
    cur = null; pushHist();
  }

  // ---------- fill / pick ----------
  function bucket(px, py) {
    const W = st.W, H = st.H, x = Math.floor(px), y = Math.floor(py);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const img = ic.getImageData(0, 0, W, H), d = img.data, i0 = (y * W + x) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
    const [fr, fg, fb] = rgb(st.fill), solid = ta > 200;
    if (solid && tr === fr && tg === fg && tb === fb) return;
    const match = i => { const a = d[i + 3]; if (ta < 30) return a < 30; return Math.abs(d[i] - tr) <= 40 && Math.abs(d[i + 1] - tg) <= 40 && Math.abs(d[i + 2] - tb) <= 40 && Math.abs(a - ta) <= 40; };
    let mask = new Uint8Array(W * H); const stack = [x, y];
    while (stack.length) {
      const cy = stack.pop(), cx = stack.pop();
      if (mask[cy * W + cx] || !match((cy * W + cx) * 4)) continue;
      let l = cx, r = cx;
      while (l > 0 && !mask[cy * W + l - 1] && match((cy * W + l - 1) * 4)) l--;
      while (r < W - 1 && !mask[cy * W + r + 1] && match((cy * W + r + 1) * 4)) r++;
      for (let k = l; k <= r; k++) mask[cy * W + k] = 1;
      for (const ny of [cy - 1, cy + 1]) {
        if (ny < 0 || ny >= H) continue;
        let inSpan = false;
        for (let k = l; k <= r; k++) {
          const ni = ny * W + k, ok = !mask[ni] && match(ni * 4);
          if (ok && !inSpan) { stack.push(k, ny); inSpan = true; } else if (!ok) inSpan = false;
        }
      }
    }
    if (solid) {
      for (let i = 0; i < mask.length; i++) if (mask[i]) { d[i * 4] = fr; d[i * 4 + 1] = fg; d[i * 4 + 2] = fb; }
      ic.putImageData(img, 0, 0);
    } else {
      for (let it = 0; it < 2; it++) {
        const n = mask.slice();
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
          const i = yy * W + xx;
          if (!mask[i] && ((xx > 0 && mask[i - 1]) || (xx < W - 1 && mask[i + 1]) || (yy > 0 && mask[i - W]) || (yy < H - 1 && mask[i + W]))) n[i] = 1;
        }
        mask = n;
      }
      const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
      const tc = tmp.getContext('2d'), out = tc.createImageData(W, H);
      for (let i = 0; i < mask.length; i++) if (mask[i]) { out.data[i * 4] = fr; out.data[i * 4 + 1] = fg; out.data[i * 4 + 2] = fb; out.data[i * 4 + 3] = 255; }
      tc.putImageData(out, 0, 0);
      ic.save(); ic.globalCompositeOperation = 'destination-over'; ic.globalAlpha = st.opacity / 100; ic.drawImage(tmp, 0, 0); ic.restore();
    }
    pushHist();
  }
  function pick(px, py) {
    const t = document.createElement('canvas'); t.width = t.height = 1;
    const c = t.getContext('2d'); c.drawImage(paperC, -Math.floor(px), -Math.floor(py)); c.drawImage(inkC, -Math.floor(px), -Math.floor(py));
    const [r, g, b] = c.getImageData(0, 0, 1, 1).data, hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    if (st.target === 'stroke') st.color = hex; else st.fill = hex;
    saveSettings(); syncUI();
  }

  // ---------- UI ----------
  const toolBtn = ([id, n, tip]) => `<button class="tl" data-tool="${id}" title="${esc(tip)}">${svg(id)}<span>${n}</span></button>`;
  function template() {
    return `<div class="art card">
<h2>Calligraphy Studio</h2>
<div class="tools">${TOOLS.map(toolBtn).join('')}</div>
<div class="opts">
 <label>Size <input type="range" data-k="size" min="1" max="120"><b data-v="size"></b></label>
 <label>Opacity <input type="range" data-k="opacity" min="5" max="100"><b data-v="opacity"></b></label>
 <label>Smoothing <input type="range" data-k="smooth" min="0" max="100"><b data-v="smooth"></b></label>
 <label data-for="nib">Nib angle <input type="range" data-k="nib" min="0" max="180"><b data-v="nib"></b></label>
 <label data-for="shape">Shapes <select data-k="shape"><option value="outline">Outline</option><option value="solid">Solid</option><option value="both">Outline + fill</option></select></label>
</div>
<div class="opts">
 <button class="chip" data-target="stroke" title="Brush colour"><i class="sw" data-c="color"></i>Ink</button>
 <button class="chip" data-do="swap" title="Swap colours">${svg('swap', 18)}</button>
 <button class="chip" data-target="fill" title="Fill colour"><i class="sw" data-c="fill"></i>Fill</button>
 <input type="color" data-k="custom" title="Custom colour">
</div>
<div class="pal">${SWATCHES.map(([h, n]) => `<button class="sw" data-sw="${h}" title="${n}" style="background:${h}"></button>`).join('')}</div>
<div class="opts">
 <label>Paper <select data-k="paper">${Object.entries(PAPERS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></label>
 <label>Canvas <select data-k="canvas">${SIZES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
 <label>Grid <select data-k="grid"><option value="none">None</option><option value="tian">田 Tian</option><option value="mi">米 Mi</option></select></label>
 <label>Cells <select data-k="gridN"><option>2</option><option>3</option><option>4</option><option>6</option></select></label>
</div>
<div class="opts">
 <button class="chip" data-do="undo">${svg('undo', 18)} Undo</button>
 <button class="chip" data-do="redo">${svg('redo', 18)} Redo</button>
 <button class="chip" data-do="mirror">${svg('mirror', 18)} Mirror</button>
 <button class="chip" data-do="clear">${svg('clear', 18)} Clear</button>
</div>
<div class="stage-wrap"></div>
<div class="opts save">
 <input class="art-name" type="text" placeholder="Name your drawing…" maxlength="60">
 <button class="pri" data-do="save">Save</button>
 <button data-do="copy">Save copy</button>
 <button data-do="new">New</button>
</div>
<p class="art-status small"></p>
</div>
<div class="art card"><h2>Gallery</h2><div class="gal"></div></div>`;
  }
  const $ = s => rootEl.querySelector(s);
  function syncUI() {
    if (!rootEl || !rootEl.isConnected) return;
    rootEl.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === st.tool));
    rootEl.querySelectorAll('[data-k]').forEach(el => {
      const k = el.dataset.k; if (k === 'custom') { el.value = st.target === 'stroke' ? st.color : st.fill; return; }
      el.value = k === 'canvas' ? `${st.W}x${st.H}` : st[k];
    });
    rootEl.querySelectorAll('[data-v]').forEach(b => { b.textContent = st[b.dataset.v] + (b.dataset.v === 'nib' ? '°' : b.dataset.v === 'size' ? '' : '%'); });
    rootEl.querySelectorAll('[data-c]').forEach(b => { b.style.background = st[b.dataset.c]; });
    rootEl.querySelectorAll('[data-target]').forEach(b => b.classList.toggle('on', (b.dataset.target === st.target)));
    const m = rootEl.querySelector('[data-do=mirror]'); if (m) m.classList.toggle('on', st.mirror);
    const show = (sel, ok) => { const e = rootEl.querySelector(sel); if (e) e.classList.toggle('hide', !ok); };
    show('[data-for=nib]', st.tool === 'nib'); show('[data-for=shape]', st.tool === 'rect' || st.tool === 'oval');
    const n = $('.art-name'); if (n && document.activeElement !== n) n.value = st.name;
    updateButtons();
  }
  const status = (m, bad) => { const e = rootEl && rootEl.querySelector('.art-status'); if (e) { e.textContent = m; e.style.color = bad ? '#a8231a' : ''; } };
  const dirty = () => { modified = true; scheduleDraft(); };

  function onInput(e) {
    const el = e.target.closest('[data-k]'); if (!el) return;
    const k = el.dataset.k, v = el.value;
    if (k === 'custom') { st[st.target === 'stroke' ? 'color' : 'fill'] = v; }
    else if (k === 'canvas') {
      if (e.type !== 'change') return;
      const [w, h] = v.split('x').map(Number);
      if (w === st.W && h === st.H) return;
      if (modified && !confirm('Changing the canvas shape clears the current drawing. Continue?')) { syncUI(); return; }
      setSize(w, h); ic.clearRect(0, 0, w, h); resetHist(); st.id = null; modified = false;
    }
    else if (k === 'paper') { st.paper = v; drawPaper(); drawGrid(); dirty(); }
    else if (k === 'grid') { st.grid = v; drawGrid(); }
    else if (k === 'gridN') { st.gridN = +v; drawGrid(); }
    else if (k === 'shape') st.shape = v;
    else st[k] = +v;
    saveSettings(); syncUI();
  }
  function onClick(e) {
    const t = e.target.closest('button'); if (!t || !rootEl.contains(t)) return;
    if (t.dataset.tool) { st.tool = t.dataset.tool; saveSettings(); syncUI(); }
    else if (t.dataset.sw) { st[st.target === 'stroke' ? 'color' : 'fill'] = t.dataset.sw; saveSettings(); syncUI(); }
    else if (t.dataset.target) { st.target = t.dataset.target; syncUI(); }
    else if (t.dataset.do) act(t.dataset.do);
    else if (t.dataset.g) galleryAct(t.dataset.g, t.dataset.id);
  }
  async function act(a) {
    if (a === 'undo') undo();
    else if (a === 'redo') redo();
    else if (a === 'swap') { [st.color, st.fill] = [st.fill, st.color]; saveSettings(); syncUI(); }
    else if (a === 'mirror') { st.mirror = !st.mirror; saveSettings(); syncUI(); }
    else if (a === 'clear') { if (!confirm('Clear the whole canvas?')) return; ic.clearRect(0, 0, st.W, st.H); pushHist(); }
    else if (a === 'new') {
      if (modified && !confirm('Start a new drawing? Unsaved changes will be lost.')) return;
      ic.clearRect(0, 0, st.W, st.H); st.id = null; st.name = ''; resetHist(); modified = false; dbDel('kv', 'draft').catch(() => { }); syncUI(); status('A fresh sheet.');
    }
    else if (a === 'save' || a === 'copy') await save(a === 'copy');
  }

  // ---------- save / gallery ----------
  const toRec = async (id, name) => {
    const th = document.createElement('canvas'), s = 240 / Math.max(st.W, st.H); th.width = Math.round(st.W * s); th.height = Math.round(st.H * s);
    th.getContext('2d').drawImage(composite(), 0, 0, th.width, th.height);
    return { id, name, paper: st.paper, W: st.W, H: st.H, ink: inkC.toDataURL('image/png'), thumb: th.toDataURL('image/jpeg', .8) };
  };
  async function save(copy) {
    const name = ($('.art-name').value || '').trim() || 'Untitled ' + new Date().toLocaleDateString();
    const isNew = copy || !st.id, id = isNew ? uid() : st.id, old = isNew ? null : await dbGet('drawings', id);
    try {
      const rec = await toRec(id, name); rec.created = old ? old.created : Date.now(); rec.updated = Date.now();
      await dbPut('drawings', rec);
      st.id = id; st.name = name; modified = false; dbDel('kv', 'draft').catch(() => { });
      const gain = isNew && opts.onNew ? opts.onNew() : 0;
      syncUI(); status(`Saved “${name}”.${gain ? ` +${gain} Qi` : ''}`); gallery();
    } catch (err) { status('Could not save: ' + err.message, true); }
  }
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  async function openRec(r, asDraft) {
    setSize(r.W, r.H); st.paper = r.paper || 'rice'; drawPaper(); drawGrid();
    ic.clearRect(0, 0, r.W, r.H); ic.drawImage(await loadImg(r.ink), 0, 0);
    st.id = r.id || null; st.name = r.name || ''; resetHist(); modified = !!asDraft; syncUI();
  }
  async function gallery() {
    const g = rootEl && rootEl.querySelector('.gal'); if (!g) return;
    const list = (await dbAll('drawings')).sort((a, b) => b.updated - a.updated);
    g.innerHTML = list.length ? list.map(r => `<figure class="${r.id === st.id ? 'cur' : ''}"><img src="${r.thumb}" alt="${esc(r.name)}"><figcaption>${esc(r.name)}</figcaption>
<div class="opts"><button data-g="open" data-id="${r.id}">Open</button><button data-g="png" data-id="${r.id}" title="Download PNG">${svg('download', 16)}</button><button data-g="rename" data-id="${r.id}">Rename</button><button data-g="del" data-id="${r.id}">Delete</button></div></figure>`).join('')
      : '<p class="empty">No saved drawings yet. Name a piece and press Save.</p>';
  }
  async function galleryAct(a, id) {
    const r = await dbGet('drawings', id); if (!r) return;
    if (a === 'open') {
      if (modified && !confirm('Open this drawing? Unsaved changes will be lost.')) return;
      await openRec(r); status(`Opened “${r.name}”.`); gallery();
    } else if (a === 'rename') {
      const n = (prompt('Rename drawing', r.name) || '').trim(); if (!n) return;
      r.name = n; r.updated = Date.now(); await dbPut('drawings', r); if (st.id === id) { st.name = n; syncUI(); } gallery();
    } else if (a === 'del') {
      if (!confirm(`Delete “${r.name}” forever?`)) return;
      await dbDel('drawings', id); if (st.id === id) { st.id = null; modified = true; } gallery();
    } else if (a === 'png') {
      const c = document.createElement('canvas'); c.width = r.W; c.height = r.H; const x = c.getContext('2d');
      paintPaper(x, r.W, r.H, r.paper); x.drawImage(await loadImg(r.ink), 0, 0);
      const l = document.createElement('a'); l.href = c.toDataURL('image/png'); l.download = r.name.replace(/[^\w\- ]+/g, '_') + '.png'; l.click();
    }
  }

  // ---------- draft autosave ----------
  function scheduleDraft() {
    clearTimeout(draftT);
    draftT = setTimeout(async () => {
      try { const r = await toRec('draft', st.name); r.key = 'draft'; r.sid = st.id; await dbPut('kv', r); } catch { }
    }, 800);
  }
  async function restoreDraft() {
    try { const d = await dbGet('kv', 'draft'); if (d) { await openRec(d, true); st.id = d.sid || null; if (rootEl) status('Restored your unsaved sketch.'); } } catch { }
  }

  // ---------- public ----------
  let ready = null;
  window.Art = {
    init(o) { opts = o || {}; if (!stage) { makeStage(); resetHist(); ready = restoreDraft(); } },
    mount(root) {
      if (!root) return;
      rootEl = root; root.innerHTML = template();
      $('.stage-wrap').appendChild(stage);
      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('change', onInput);
      $('.art-name').addEventListener('input', e => { st.name = e.target.value; });
      syncUI(); gallery(); if (ready) ready.then(() => { syncUI(); gallery(); });
    },
    async exportAll() { return dbAll('drawings'); },
    async importAll(list) {
      if (!Array.isArray(list)) return;
      await dbClear('drawings');
      for (const r of list) if (r && r.id && r.ink) await dbPut('drawings', r);
      if (rootEl && rootEl.isConnected) gallery();
    }
  };
})();
