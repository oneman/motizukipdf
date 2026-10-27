/*
 * draw.js — small HTML5-canvas drawing kit used by every diagram of the app (diagrams.js).
 * HiDPI-aware canvases, boxes, arrows, labels, a palette, and a few layout helpers.
 */
(function (root) {
  'use strict';

  var P = {
    ink: '#17202d', ink2: '#4b5563', ink3: '#8a94a6', line: '#c9d2df', paper: '#f6f8fb',
    blue: '#2563eb', blueBg: '#e8f0fe', orange: '#ea580c', orangeBg: '#fff1e6', green: '#15803d', greenBg: '#e7f7ec',
    violet: '#7c3aed', violetBg: '#f1ebfe', teal: '#0f766e', tealBg: '#e3f6f3', red: '#dc2626', redBg: '#fde8e8',
    yellow: '#b45309', yellowBg: '#fff8e1', pink: '#be185d', pinkBg: '#fce7f3', grey: '#64748b', greyBg: '#eef2f7'
  };
  var SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif';
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  var MONO = '"SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

  /* Prepare a canvas of logical size w×h (CSS pixels), scaled for the device pixel ratio.  Returns ctx. */
  function setup(canvas, w, h) {
    var dpr = root.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = '100%'; canvas.style.maxWidth = w + 'px'; canvas.style.aspectRatio = w + ' / ' + h;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.W = w; ctx.H = h;
    return ctx;
  }

  function font(ctx, size, opt) {
    opt = opt || {};
    var fam = opt.serif ? SERIF : opt.mono ? MONO : SANS;
    ctx.font = (opt.italic ? 'italic ' : '') + (opt.bold ? '600 ' : '') + size + 'px ' + fam;
  }

  function text(ctx, s, x, y, opt) {
    opt = opt || {};
    font(ctx, opt.size || 13, opt);
    ctx.fillStyle = opt.color || P.ink;
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = opt.baseline || 'middle';
    if (opt.maxWidth && ctx.measureText(s).width > opt.maxWidth) {
      /* wrap on spaces */
      var words = String(s).split(' '), lines = [], cur = '';
      words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > opt.maxWidth && cur) { lines.push(cur); cur = w; } else cur = t; });
      if (cur) lines.push(cur);
      var lh = (opt.size || 13) * 1.25, y0 = y - (lines.length - 1) * lh / 2;
      lines.forEach(function (l, i) { ctx.fillText(l, x, y0 + i * lh); });
      return lines.length * lh;
    }
    ctx.fillText(s, x, y);
    return (opt.size || 13) * 1.25;
  }

  function measure(ctx, s, size, opt) { font(ctx, size || 13, opt); return ctx.measureText(s).width; }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r || 8, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* A labelled box.  opt: fill, stroke, label, sub, size, serif, mono, dashed, r, labelColor, bold */
  function box(ctx, x, y, w, h, opt) {
    opt = opt || {};
    roundRect(ctx, x, y, w, h, opt.r == null ? 8 : opt.r);
    ctx.fillStyle = opt.fill || '#fff'; ctx.fill();
    if (opt.stroke !== null) {
      ctx.strokeStyle = opt.stroke || P.line; ctx.lineWidth = opt.lineWidth || 1.2;
      if (opt.dashed) ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (opt.label != null) {
      var size = opt.size || 13, hasSub = opt.sub != null;
      text(ctx, opt.label, x + w / 2, y + h / 2 - (hasSub ? size * 0.55 : 0), { size: size, serif: opt.serif, mono: opt.mono, bold: opt.bold, color: opt.labelColor || P.ink, maxWidth: w - 10 });
      if (hasSub) text(ctx, opt.sub, x + w / 2, y + h / 2 + size * 0.75, { size: Math.max(10, size - 3), color: opt.subColor || P.ink2, maxWidth: w - 10, mono: opt.subMono });
    }
    return { x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2, right: x + w, bottom: y + h };
  }

  function dot(ctx, x, y, r, color, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color || P.ink; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  /* arrow from (x1,y1) to (x2,y2).  opt: color, width, dashed, label, labelOffset, head (true), both, curve (bulge px) */
  function arrow(ctx, x1, y1, x2, y2, opt) {
    opt = opt || {};
    var color = opt.color || P.ink2, lw = opt.width || 1.5;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
    if (opt.dashed) ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1);
    if (opt.curve) {
      var nx = -Math.sin(ang) * opt.curve, ny = Math.cos(ang) * opt.curve;
      ctx.quadraticCurveTo(mx + nx, my + ny, x2, y2);
      mx += nx / 2; my += ny / 2;
      ang = Math.atan2(y2 - (my + ny / 2), x2 - (mx + nx / 2));
    } else ctx.lineTo(x2, y2);
    ctx.stroke(); ctx.setLineDash([]);
    if (opt.head !== false) head(ctx, x2, y2, ang, color, opt.headSize || 7);
    if (opt.both) head(ctx, x1, y1, ang + Math.PI, color, opt.headSize || 7);
    if (opt.label) {
      var off = opt.labelOffset == null ? -10 : opt.labelOffset;
      var lx = mx - Math.sin(ang) * off, ly = my + Math.cos(ang) * off;
      var w = measure(ctx, opt.label, opt.labelSize || 11) + 8;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(lx - w / 2, ly - 8, w, 16);
      text(ctx, opt.label, lx, ly, { size: opt.labelSize || 11, color: opt.labelColor || color, serif: opt.serif });
    }
  }
  function head(ctx, x, y, ang, color, s) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - s * Math.cos(ang - Math.PI / 6), y - s * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x - s * Math.cos(ang + Math.PI / 6), y - s * Math.sin(ang + Math.PI / 6));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function line(ctx, x1, y1, x2, y2, opt) {
    opt = opt || {};
    ctx.strokeStyle = opt.color || P.line; ctx.lineWidth = opt.width || 1;
    if (opt.dashed) ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  }

  /* a braces-like bracket under [x1,x2] at y with a label */
  function brace(ctx, x1, x2, y, label, opt) {
    opt = opt || {};
    var c = opt.color || P.ink3;
    line(ctx, x1, y, x2, y, { color: c, width: 1 });
    line(ctx, x1, y, x1, y - 5, { color: c }); line(ctx, x2, y, x2, y - 5, { color: c });
    if (label) text(ctx, label, (x1 + x2) / 2, y + 10, { size: opt.size || 11, color: opt.labelColor || c, serif: opt.serif });
  }

  /* a pill (rounded label) */
  function pill(ctx, x, y, label, opt) {
    opt = opt || {};
    var size = opt.size || 11, w = measure(ctx, label, size, opt) + 14, h = size + 9;
    box(ctx, x - w / 2, y - h / 2, w, h, { fill: opt.fill || P.greyBg, stroke: opt.stroke || null, r: h / 2 });
    text(ctx, label, x, y, { size: size, color: opt.color || P.ink2, mono: opt.mono, serif: opt.serif, bold: opt.bold });
    return w;
  }

  /* a horizontal bar chart row */
  function bar(ctx, x, y, w, h, frac, opt) {
    opt = opt || {};
    roundRect(ctx, x, y, w, h, 4); ctx.fillStyle = opt.track || P.greyBg; ctx.fill();
    var ww = Math.max(2, Math.min(w, Math.abs(frac) * w));
    roundRect(ctx, frac >= 0 ? x : x + w - ww, y, ww, h, 4); ctx.fillStyle = opt.fill || P.blue; ctx.fill();
  }

  /* helpers for the kind colours used throughout */
  function kindColor(k) {
    var m = { etale: P.blue, frob: P.orange, hol: P.violet, mono: P.teal, coric: P.green, bad: P.orange, good: P.green, arch: P.violet };
    return m[k] || P.ink2;
  }

  function fmt(x, d) {
    if (x == null || isNaN(x)) return '—';
    if (Math.abs(x) >= 1e6) return Number(x).toExponential(2);
    return Number(x).toFixed(d == null ? 3 : d).replace(/\.?0+$/, function (m) { return d === 0 ? '' : m; });
  }

  root.DRAW = { P: P, setup: setup, text: text, measure: measure, box: box, dot: dot, arrow: arrow, line: line, brace: brace, pill: pill, bar: bar, roundRect: roundRect, kindColor: kindColor, fmt: fmt, font: font };
})(typeof window !== 'undefined' ? window : globalThis);
