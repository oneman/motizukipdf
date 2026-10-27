/*
 * diagrams.js — SVG helpers (window.SV) and the Part I "data types" gallery
 * (window.DIAGRAMS): one diagram per mathematical object of IUT, drawn from
 * the current initial Θ-data (iut.js).  Every figure cites the PDF it follows.
 */
(function (root) {
  'use strict';
  var C = {
    text: '#1c2130', dim: '#5d6578', line: '#dde2ee', soft: '#eef1f8', grid: '#c9d0de', bullet: '#3a4356',
    accent: '#2f6fde', theta: '#e4572e', log: '#1f9d55', etale: '#2f6fde', frob: '#f29e1f', dag: '#d9a300', ddag: '#0e9aa7',
    hull: '#7b4fd1', alien: '#d7263d', shared: '#1f9d55', ok: '#1f9d55', warn: '#d98e00', err: '#d7263d', white: '#ffffff',
    etaleFill: '#e4edff', frobFill: '#fff1dc', dagFill: '#fff6cc', ddagFill: '#dcf5f7', hullFill: '#eee6fb', alienFill: '#fde3e6', logFill: '#e2f6e9', thetaFill: '#fde3dc', softFill: '#f3f5fa'
  };
  var SANS = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif', MONO = 'ui-monospace, Menlo, Consolas, monospace';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, attrs, inner) { var a = ''; Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null) a += ' ' + k + '="' + esc(attrs[k]) + '"'; }); return '<' + tag + a + '>' + (inner || '') + '</' + tag + '>'; }
  function text(x, y, s, o) {
    o = o || {};
    return el('text', { x: x, y: y, 'font-size': o.size || 12, fill: o.color || C.text, 'text-anchor': o.anchor || 'start', 'font-weight': o.bold ? 700 : 400, 'font-style': o.italic ? 'italic' : 'normal', 'font-family': o.mono ? MONO : SANS, 'dominant-baseline': o.base || 'middle', transform: o.rotate ? 'rotate(' + o.rotate + ' ' + x + ' ' + y + ')' : null }, esc(s));
  }
  function line(x1, y1, x2, y2, color, w, dash) { return el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color || C.text, 'stroke-width': w || 1.5, 'stroke-dasharray': dash || null, 'stroke-linecap': 'round' }); }
  function mid(color) { return 'ar' + String(color).replace(/[^a-z0-9]/gi, ''); }
  function arrow(x1, y1, x2, y2, color, w, dash) { color = color || C.text; return el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, 'stroke-width': w || 1.6, 'stroke-dasharray': dash || null, 'marker-end': 'url(#' + mid(color) + ')' }); }
  function rect(x, y, w, h, o) { o = o || {}; return el('rect', { x: x, y: y, width: w, height: h, rx: o.r === undefined ? 6 : o.r, fill: o.fill || C.white, stroke: o.stroke || C.line, 'stroke-width': o.w || 1.2, 'stroke-dasharray': o.dash || null, opacity: o.opacity }); }
  function circle(cx, cy, r, o) { o = o || {}; return el('circle', { cx: cx, cy: cy, r: r, fill: o.fill || C.white, stroke: o.stroke || C.line, 'stroke-width': o.w || 1.2, 'stroke-dasharray': o.dash || null, opacity: o.opacity }); }
  function path(d, o) { o = o || {}; return el('path', { d: d, fill: o.fill || 'none', stroke: o.stroke || C.text, 'stroke-width': o.w || 1.5, 'stroke-dasharray': o.dash || null, 'marker-end': o.arrow ? 'url(#' + mid(o.stroke || C.text) + ')' : null, opacity: o.opacity }); }
  function pill(x, y, s, o) { o = o || {}; var size = o.size || 11, w = s.length * size * 0.62 + 12, h = size + 8; return rect(x - w / 2, y - h / 2, w, h, { fill: o.fill || C.soft, stroke: o.stroke || 'none', r: h / 2 }) + text(x, y, s, { size: size, color: o.color || C.text, anchor: 'middle', bold: o.bold, mono: o.mono }); }
  function node(x, y, w, h, title, sub, o) { o = o || {}; var s = rect(x - w / 2, y - h / 2, w, h, { fill: o.fill || C.white, stroke: o.stroke || C.line, w: o.w || 1.4, dash: o.dash }); s += text(x, sub ? y - 7 : y, title, { size: o.size || 12, anchor: 'middle', bold: true, color: o.color || C.text }); if (sub) s += text(x, y + 8, sub, { size: (o.size || 12) - 2, anchor: 'middle', color: C.dim }); return s; }
  function dot(x, y, r, color, label, lc) { return circle(x, y, r || 6, { fill: color || C.bullet, stroke: 'none' }) + (label ? text(x, y + 0.5, label, { size: (r || 6) * 1.3, anchor: 'middle', color: lc || C.white, bold: true }) : ''); }
  function defs() { var s = ''; Object.keys(C).forEach(function (k) { var c = C[k]; s += '<marker id="' + mid(c) + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + c + '"/></marker>'; }); return '<defs>' + s + '</defs>'; }
  function svg(W, H, inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" style="font-family:' + esc(SANS) + '">' + defs() + inner + '</svg>'; }
  function wrap(x, y, str, o) { o = o || {}; var max = o.max || 90, words = String(str).split(' '), lines = [], cur = ''; words.forEach(function (w) { if ((cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur); return lines.map(function (ln, i) { return text(x, y + i * (o.lh || 12), ln, o); }).join(''); }
  function fmt(x, k) { return (typeof x === 'number' && isFinite(x)) ? x.toFixed(k === undefined ? 3 : k) : String(x); }
  function sup(n) { return String(n).replace(/[0-9]/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }); }
  function vcolor(v) { return v.kind === 'VArc' ? C.etale : v.reduction === 'good' ? C.log : v.reduction === 'badAdditive' ? C.warn : v.p === 2 ? C.frob : C.alien; }
  function vfill(v) { return v.kind === 'VArc' ? C.etaleFill : v.reduction === 'good' ? C.logFill : v.reduction === 'badAdditive' ? '#fff3d6' : v.p === 2 ? C.frobFill : C.alienFill; }
  function chip(x, y, v, w) { w = w || 58; var s = rect(x, y, w, 30, { fill: vfill(v), stroke: vcolor(v), r: 6 }); s += text(x + w / 2, y + 10, v.name, { size: 11, anchor: 'middle', bold: true }); s += text(x + w / 2, y + 22, v.kind === 'VArc' ? 'arch.' : v.reduction === 'good' ? 'good' : v.reduction === 'badAdditive' ? 'additive' : 'ord q=' + v.ordQ, { size: 9, anchor: 'middle', color: C.dim }); return s; }

  var SV = { C: C, el: el, text: text, wrap: wrap, line: line, arrow: arrow, rect: rect, circle: circle, path: path, pill: pill, node: node, dot: dot, svg: svg, esc: esc, fmt: fmt, sup: sup, vcolor: vcolor, vfill: vfill, chip: chip };

  // =========================================================== Part I cards
  function thetaDataCard(d) {
    var W = 560, H = 330, s = '';
    var tower = [['F̄', 'algebraic closure, G_F = Gal(F̄/F)', ''], ['K = F(E[l])', 'l-torsion field', '[K:Q] ≤ ' + d.K.degreeBound], ['F', 'number field (⊇ E[6])', '[F:Q] ≤ ' + d.F.degreeBound], ['F_mod', 'field of moduli of E', '[F_mod:Q] = ' + d.Fmod.degree]];
    tower.forEach(function (t, i) { var y = 34 + i * 66; s += node(100, y, 150, 36, t[0], t[1], { fill: i === 1 ? C.dagFill : C.softFill, stroke: i === 1 ? C.dag : C.line }); if (t[2]) s += text(180, y, t[2], { size: 10, color: C.dim }); if (i < 3) s += line(100, y + 18, 100, y + 48, C.dim, 1.2); });
    s += text(104, 67, '| Gal, degree prime to l', { size: 9, color: C.dim }); s += text(104, 133, '| ⊇ GL₂(F_l) ⊇ SL₂(F_l)', { size: 9, color: C.dim }); s += text(104, 199, '| Galois', { size: 9, color: C.dim });
    s += node(370, 34, 170, 36, 'E_F', 'elliptic curve over F, stable red.', { fill: C.frobFill, stroke: C.frob });
    s += arrow(370, 52, 370, 82, C.dim); s += text(376, 67, 'remove origin', { size: 9, color: C.dim });
    s += node(370, 100, 170, 36, 'X_F = E_F ∖ {o}', 'once-punctured', { fill: C.frobFill, stroke: C.frob });
    s += arrow(370, 118, 370, 148, C.dim); s += text(376, 133, '×_F K, then / ±1', { size: 9, color: C.dim });
    s += node(370, 166, 170, 36, 'C_K = X_K / ±1', 'K-core, type (1,l-tors)±', { fill: C.frobFill, stroke: C.frob });
    s += arrow(370, 184, 370, 214, C.dim); s += text(376, 199, 'X̲_K → C_K, X̲̲_v at v ∈ V^bad', { size: 9, color: C.dim });
    s += node(370, 232, 170, 36, 'X̲_K, X̲̲_v', 'type (1,l-tors), theta function', { fill: C.frobFill, stroke: C.frob });
    s += text(470, 24, 'l = ' + d.l, { size: 13, bold: true, color: C.theta });
    s += text(470, 40, 'prime ≥ 5', { size: 9, color: C.dim });
    s += text(470, 54, 'l* = ' + d.LStar + ', l± = ' + d.LPm, { size: 10, color: C.dim });
    s += text(470, 68, 'ε̲ = ' + d.EpsilonUnder, { size: 10, color: C.dim });
    s += text(20, 280, 'V ≅ V_mod   (V^bad_mod = odd bad multiplicative, highlighted)', { size: 11, bold: true });
    var x = 20; d.VSet.forEach(function (v) { s += chip(x, 292, v, 56); if (v.inVBadMod) s += text(x + 28, 326, 'V^bad_mod', { size: 8, anchor: 'middle', color: C.alien }); x += 62; });
    return svg(W, H, s);
  }

  function labelsCard(d) {
    var W = 560, H = 300, s = '', l = d.l, ls = d.LStar, cx = 140, cy = 150, R = 100;
    s += text(20, 16, 'F_l = Z/lZ as {−l*,…,l*}, acted on by F_l^{⋊±} (t ↦ ±t + a)', { size: 11, bold: true });
    s += circle(cx, cy, R, { stroke: C.grid, fill: 'none', w: 1 });
    s += line(cx, cy - R - 10, cx, cy + R + 10, C.dim, 1, '4,3'); s += text(cx + 4, cy - R - 4, 't ↦ −t', { size: 9, color: C.dim });
    var pos = {};
    for (var t = -ls; t <= ls; t++) { var a = -Math.PI / 2 + (t / l) * 2 * Math.PI, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); pos[t] = [x, y]; var zero = t === 0; s += dot(x, y, zero ? 11 : 9, zero ? C.theta : t > 0 ? C.frob : C.ddag, (t > 0 ? '+' : '') + t); }
    s += path('M' + (cx + R + 14) + ',' + (cy - 30) + ' A' + (R + 14) + ',' + (R + 14) + ' 0 0,1 ' + (cx + R - 10) + ',' + (cy + 70), { stroke: C.dim, w: 1.2, arrow: true });
    s += text(cx + R + 10, cy + 44, 't ↦ t+a', { size: 9, color: C.dim });
    s += text(cx, cy, 'F_l', { size: 14, anchor: 'middle', bold: true, color: C.dim });
    // fold
    var fx = 330, fy0 = 70, step = Math.min(26, 190 / (ls + 1));
    s += text(fx, 44, '|F_l| = F_l/{±1} = {0,…,l*}    F_l^* = |F_l|∖{0}', { size: 11, bold: true });
    for (var j = 0; j <= ls; j++) { var yy = fy0 + j * step; s += dot(fx + 20, yy, 8, j === 0 ? C.theta : C.frob, String(j)); if (j > 0) { s += arrow(pos[j][0] + 10, pos[j][1], fx + 8, yy, C.frob, 0.8); s += arrow(pos[-j][0] + 10, pos[-j][1], fx + 8, yy, C.ddag, 0.8); } }
    s += rect(fx + 42, fy0 + step - 12, 150, step * ls + 4, { fill: 'none', stroke: C.hull, dash: '4,3', r: 8 });
    s += text(fx + 117, fy0 + step * (ls + 1) / 2 - 8, 'F_l^*', { size: 13, anchor: 'middle', color: C.hull, bold: true }); s += text(fx + 117, fy0 + step * (ls + 1) / 2 + 8, 'u · j  (multiplicative)', { size: 9.5, anchor: 'middle', color: C.hull });
    s += text(fx + 20, fy0 + step * (ls + 1) + 12, '±j ↦ j: the gluing 0,⊞ ↦ > of the two symmetries', { size: 9, color: C.dim });
    s += text(20, 282, 'F_l^{⋊±}: additive / geometric (conjugate synchronization)     F_l^*: multiplicative / arithmetic (number-field side)', { size: 10, color: C.dim });
    return svg(W, H, s);
  }

  function primeStripCard() {
    var W = 560, H = 340, s = '';
    var P = { D: [80, 60], F: [220, 60], Dm: [80, 130], Fm: [220, 130], Fmx: [360, 130], Fmxu: [500, 130], Fmvxu: [500, 200], Fg: [220, 270], Fgvxu: [500, 270] };
    var K = { D: ['D', 'Π_v (hol.)', 'e', 'v'], F: ['F', 'Π_v ↷ O▷_v', 'f', ''], Dm: ['D⊢', 'G_v only', 'e', 'b'], Fm: ['F⊢', 'G_v ↷ O▷ split', 'f', ''], Fmx: ['F⊢×', 'G_v ↷ O×', 'f', ''], Fmxu: ['F⊢×μ', 'G_v ↷ O×μ', 'f', 'h'], Fmvxu: ['F⊢▶×μ', 'O▶ × O×μ', 'f', ''], Fg: ['F⊩', 'F⊢ + C⊩ global', 'f', ''], Fgvxu: ['F⊩▶×μ', 'F⊢▶×μ + C⊩', 'f', ''] };
    var E = [['F', 'D', 'forget O'], ['F', 'Fm', 'forget Π_v'], ['D', 'Dm', 'forget Π_v'], ['Fm', 'Dm', 'forget O'], ['Fm', 'Fmx', 'units O×'], ['Fmx', 'Fmxu', '/μ'], ['Fmvxu', 'Fmxu', 'forget O▶'], ['Fg', 'Fm', 'forget C⊩'], ['Fgvxu', 'Fmvxu', 'forget C⊩'], ['Fgvxu', 'Fg', 'units /μ']];
    E.forEach(function (e) { var a = P[e[0]], b = P[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = Math.abs(ux) > 0.5 ? 58 : 20, py = Math.abs(uy) > 0.5 ? 18 : 20; s += arrow(a[0] + ux * px, a[1] + uy * py, b[0] - ux * px, b[1] - uy * py, C.dim, 1.2); s += text((a[0] + b[0]) / 2 + (Math.abs(uy) > 0.5 ? 6 : 0), (a[1] + b[1]) / 2 - (Math.abs(ux) > 0.5 ? 8 : 0), e[2], { size: 8.5, color: C.dim, anchor: Math.abs(uy) > 0.5 ? 'start' : 'middle' }); });
    Object.keys(P).forEach(function (k) { var p = P[k], d = K[k], cor = d[3]; s += node(p[0], p[1], 112, 36, d[0] + '-prime-strip', d[1], { fill: d[2] === 'e' ? C.etaleFill : C.frobFill, stroke: cor === 'b' ? C.hull : cor === 'v' ? C.etale : cor === 'h' ? C.log : (d[2] === 'e' ? C.etale : C.frob), w: cor ? 3 : 1.4, size: 11 }); });
    s += text(20, 24, 'étale-like (zero mass)', { size: 10, color: C.etale, bold: true }); s += text(170, 24, 'Frobenius-like (positive mass): holomorphic → mono-analytic → units → units mod torsion → with value groups → global', { size: 10, color: C.frob, bold: true });
    s += text(20, 310, 'thick border = coric ([IUTchIII] Thm 1.5):', { size: 10, bold: true }); s += rect(230, 303, 14, 14, { stroke: C.etale, w: 3, fill: 'none', r: 3 }); s += text(250, 310, 'vertically (log-link)', { size: 10 }); s += rect(370, 303, 14, 14, { stroke: C.log, w: 3, fill: 'none', r: 3 }); s += text(390, 310, 'horizontally (Θ-link)', { size: 10 });
    s += rect(20, 322, 14, 14, { stroke: C.hull, w: 3, fill: 'none', r: 3 }); s += text(40, 329, 'bi-coric: D⊢ is the core shared by every Hodge theater of the lattice (the étale-picture turns around it)', { size: 10 });
    return svg(W, H, s);
  }

  function localDatumCard(d) {
    var W = 560, H = 300, s = '', bad = d.VSet.filter(function (v) { return v.inVBadMod; })[0] || d.VSet[0];
    s += text(20, 16, 'the local datum of a prime-strip at v = ' + bad.name + '  (p = ' + (bad.p || '∞') + ')', { size: 11, bold: true });
    s += rect(20, 30, 230, 200, { fill: C.etaleFill, stroke: C.etale, dash: '5,3' }); s += text(30, 44, 'étale-like: topological groups', { size: 10, color: C.etale, bold: true });
    s += node(135, 80, 170, 36, 'Π_v = π₁(X̲̲_v)', 'tempered fundamental group', { fill: C.white, stroke: C.etale });
    s += arrow(135, 98, 135, 140, C.etale); s += text(142, 119, 'quotient ↠ (kills Δ_v)', { size: 9, color: C.dim });
    s += node(135, 158, 170, 36, 'G_v = Gal(K̄_v/K_v)', 'absolute Galois group', { fill: C.white, stroke: C.etale });
    s += text(30, 200, 'holomorphic (Π_v) vs mono-analytic (G_v):', { size: 9.5, color: C.dim }); s += text(30, 214, 'Π_v remembers the ring/scheme theory, G_v does not', { size: 9.5, color: C.dim });
    s += rect(300, 30, 240, 200, { fill: C.frobFill, stroke: C.frob, dash: '5,3' }); s += text(310, 44, 'Frobenius-like: monoids with G_v-action', { size: 10, color: C.frob, bold: true });
    s += node(420, 80, 200, 36, 'O▷_v = O_{K̄_v} ∖ {0}', 'multiplicative monoid', { fill: C.white, stroke: C.frob });
    s += node(365, 150, 100, 34, 'O▶_v', 'value group N', { fill: C.white, stroke: C.hull, size: 11 }); s += node(480, 150, 100, 34, 'O×_v', 'units', { fill: C.white, stroke: C.log, size: 11 });
    s += arrow(400, 98, 375, 132, C.dim, 1.2); s += arrow(440, 98, 470, 132, C.dim, 1.2); s += text(420, 118, 'O▷ ≅ O▶ × O× (split, ⊢)', { size: 9, color: C.dim, anchor: 'middle' });
    s += node(480, 208, 100, 32, 'O×μ = O×/μ', 'units mod torsion', { fill: C.white, stroke: C.log, size: 11 }); s += arrow(480, 167, 480, 191, C.dim, 1.2);
    s += text(365, 190, 'q̲_v ∈ O▶ at bad v', { size: 9.5, color: C.hull, anchor: 'middle' }); s += text(365, 204, 'Θ̲_v(j) = q̲_v^{j²}', { size: 9.5, color: C.hull, anchor: 'middle' });
    s += path('M 300,158 C 270,158 270,158 250,158', { stroke: C.theta, w: 1.6, arrow: true, dash: '3,3' }); s += text(275, 146, 'Kummer', { size: 9, color: C.theta, anchor: 'middle' });
    s += wrap(20, 246, 'Kummer theory relates the Frobenius-like monoid (positive mass) to a construction from the étale-like group (zero-mass container). Only G_v ↷ O×μ with its integral structures crosses a Θ-link; Π_v and the ring structure do not. [Alien] §2.7, §3.3 (vii)', { size: 10, color: C.dim, max: 100 });
    s += text(20, 288, 'ord(q̲_v) at bad v in units of 1/2l: ' + d.VSet.filter(function (v) { return v.reduction === 'badMultiplicative'; }).map(function (v) { return v.name + ':' + v.ordQ; }).join('  '), { size: 10, mono: true });
    return svg(W, H, s);
  }

  function hodgeTheaterSVG(d, ht, W, H, opt) {
    opt = opt || {}; var s = '', ls = d.LStar, cap = ht ? ht.ThetaPmEllHodgeTheater.capsuleFT : null, leftW = W * 0.52;
    var title = ht ? ((ht.copy === 'Dag' ? '†' : ht.copy === 'Ddag' ? '‡' : '(' + ht.n + ',' + ht.m + ')') + 'HT, universe #' + ht.universe) : 'Θ±ell NF-Hodge theater';
    s += text(12, 14, title + '   [IUTchI] Def 6.13; [Alien] Fig 3.8', { size: 10.5, color: C.dim });
    var stage = opt.stage === undefined ? 5 : opt.stage; // 1 capsule FT, 2 bridges ±/ell, 3 capsule FJ, 4 bridges Θ/NF, 5 glued
    s += rect(10, 24, leftW - 16, H - 90, { fill: stage >= 1 ? C.dagFill : C.softFill, stroke: C.dag, opacity: 0.6 });
    s += text(18, 38, 'Θ±ell-Hodge theater', { size: 11, bold: true, color: C.dag }); s += text(18, 52, 'symmetry F_l^{⋊±}: additive', { size: 9, color: C.dim });
    var tw = Math.min(26, (leftW - 50) / (2 * ls + 1)), ty = H / 2 - 10, tx0 = 24, cx = tx0 + ((2 * ls + 1) * tw) / 2;
    if (stage >= 1) for (var t = -ls; t <= ls; t++) { var x = tx0 + (t + ls) * tw, zero = t === 0; s += rect(x, ty, tw - 3, 30, { fill: zero ? C.thetaFill : C.frobFill, stroke: zero ? C.theta : C.frob, r: 4 }); s += text(x + (tw - 3) / 2, ty + 11, (t > 0 ? '+' : '') + t, { size: 9, anchor: 'middle' }); if (cap) s += text(x + (tw - 3) / 2, ty + 23, '#' + (cap[t + ls].basepoint % 1000), { size: 6.5, anchor: 'middle', color: C.dim }); }
    s += text(tx0, ty - 12, 'capsule F_T, t ∈ F_l (' + (2 * ls + 1) + ' F-prime-strips)', { size: 9.5, color: C.dim });
    if (stage >= 2) {
      s += node(cx, 84, 150, 32, 'D_⊚±', 'D-prime-strip (Π_{X_K})', { fill: C.etaleFill, stroke: C.etale, size: 11 }); s += arrow(cx, ty - 20, cx, 102, C.etale, 1.4); s += text(cx + 6, ty - 46, 'Θell-bridge', { size: 9, color: C.etale });
      s += node(cx, ty + 76, 130, 32, 'F_⊞', 'F-prime-strip', { fill: C.frobFill, stroke: C.frob, size: 11 }); s += arrow(cx, ty + 34, cx, ty + 58, C.frob, 1.4); s += text(cx + 6, ty + 46, 'Θ±-bridge', { size: 9, color: C.frob });
    }
    var rx = leftW + 2;
    s += rect(rx, 24, W - rx - 10, H - 90, { fill: stage >= 3 ? C.ddagFill : C.softFill, stroke: C.ddag, opacity: 0.6 });
    s += text(rx + 8, 38, 'ΘNF-Hodge theater', { size: 11, bold: true, color: C.ddag }); s += text(rx + 8, 52, 'symmetry F_l^*: multiplicative', { size: 9, color: C.dim });
    var jw = Math.min(34, (W - rx - 40) / ls), jx0 = rx + 16, jcx = jx0 + (ls * jw) / 2;
    if (stage >= 3) for (var j = 1; j <= ls; j++) { var xj = jx0 + (j - 1) * jw; s += rect(xj, ty, jw - 3, 30, { fill: C.frobFill, stroke: C.frob, r: 4 }); s += text(xj + (jw - 3) / 2, ty + 11, String(j), { size: 9, anchor: 'middle' }); s += text(xj + (jw - 3) / 2, ty + 23, 'q̲^' + (j * j), { size: 6.5, anchor: 'middle', color: C.dim }); }
    s += text(jx0, ty - 12, 'capsule F_J, j ∈ F_l^* (' + ls + ')', { size: 9.5, color: C.dim });
    if (stage >= 4) {
      s += node(jcx, 84, 170, 32, 'F_⊛', 'Π_{C_K} ↷ F_mod^× (NF portion)', { fill: C.etaleFill, stroke: C.etale, size: 11 }); s += arrow(jcx, ty - 20, jcx, 102, C.etale, 1.4); s += text(jcx + 6, ty - 46, 'NF-bridge', { size: 9, color: C.etale });
      s += node(jcx, ty + 76, 170, 32, 'F_>', 'Θ-HT: F⊩_tht → F⊩_mod', { fill: C.frobFill, stroke: C.frob, size: 11 }); s += arrow(jcx, ty + 34, jcx, ty + 58, C.frob, 1.4); s += text(jcx + 6, ty + 46, 'Θ-bridge', { size: 9, color: C.frob });
    }
    if (stage >= 5) { s += line(cx + 66, ty + 76, jcx - 86, ty + 76, C.shared, 2.2, '6,4'); s += text((cx + jcx) / 2, ty + 64, 'glue 0,⊞ ↦ >', { size: 9.5, anchor: 'middle', color: C.shared, bold: true }); }
    if (ht) { s += text(12, H - 46, 'q-pilot {q̲_v}: −|log q| = ' + fmt(ht.QPilot.logVolume) + '    Θ-pilot {q̲_v^{j²}}: ' + fmt(ht.ThetaPilot.logVolume) + ' (naive, ×l(l+1)/12)', { size: 10 }); s += text(12, H - 30, '⊩-strips: F⊩_Δ (q-pilot) · F⊩_env · F⊩_gau · F⊩_LGP (Θ-pilot) · F⊩_lgp', { size: 10, color: C.dim }); s += text(12, H - 14, ht.hasIncomingLog ? 'carries log-shells (codomain of a log-link)' : 'no log-shells yet (not the codomain of a log-link)', { size: 10, color: ht.hasIncomingLog ? C.log : C.dim }); }
    return s;
  }
  function hodgeTheaterCard(d, lat) { var ht = lat ? lat.peek(0, 0) : null; return svg(560, 330, hodgeTheaterSVG(d, ht, 560, 330)); }

  function pilotsCard(d) {
    var W = 560, H = 300, s = '', ls = d.LStar, lq = IUT.logQ(d), avg = d.l * (d.l + 1) / 12, maxv = ls * ls;
    s += text(20, 16, 'Θ-Hodge theater: Θ̲_v(j) = q̲_v^{j²}; the pilots as arithmetic line bundles  [IUTchIII] Def 3.8 (i)', { size: 10.5, bold: true });
    var left = 60, top = 40, h = 180, w = W - left - 40, bw = w / (ls + 1);
    for (var j = 0; j <= ls; j++) { var v = j === 0 ? 1 : j * j, bh = v / maxv * h, x = left + j * bw + 4; s += rect(x, top + h - bh, bw - 8, bh, { fill: j === 0 ? C.dagFill : C.thetaFill, stroke: j === 0 ? C.dag : C.theta, r: 3 }); s += text(x + (bw - 8) / 2, top + h - bh - 8, j === 0 ? 'q̲' : 'q̲^' + (j * j), { size: 9, anchor: 'middle' }); s += text(x + (bw - 8) / 2, top + h + 12, j === 0 ? 'q-pilot' : 'j=' + j, { size: 9, anchor: 'middle', color: C.dim }); }
    var ay = top + h - avg / maxv * h; s += line(left, ay, left + w, ay, C.hull, 1.5, '5,4'); s += text(left + w, ay - 7, 'mean of j² = l(l+1)/12 = ' + fmt(avg, 3), { size: 9.5, anchor: 'end', color: C.hull });
    s += text(20, 250, 'q-pilot degree  −|log q| = −log(q)/2l = ' + fmt(-lq / (2 * d.l)) + '        Θ-pilot {q̲^{j²}}_{j=1..l*}: naive degree ' + fmt(-avg * lq / (2 * d.l)), { size: 10.5 });
    s += wrap(20, 266, 'The Θ-link glues the Θ-pilot of †HT to the q-pilot of ‡HT ({q̲^{j²}} ↦ {q̲}), so the two "equal" bundles differ by the factor l(l+1)/12: the discrepancy the multiradial representation measures.', { size: 9.5, color: C.dim, max: 110, lh: 11 });
    s += text(20, 292, 'log(q) = ' + fmt(lq) + '  (Σ ord(q_v)·f_v·log p over bad v, over [F_mod:Q])', { size: 10, mono: true, color: C.dim });
    return svg(W, H, s);
  }

  function linksCard() {
    var W = 560, H = 300, s = '';
    s += rect(14, 24, 250, 250, { fill: C.logFill, stroke: C.log, opacity: 0.7 }); s += text(24, 40, 'log-link  (n,m) → (n,m+1)', { size: 12, bold: true, color: C.log }); s += text(24, 54, '[IUTchIII] Def 1.1, Prop 1.3, Thm 1.5 (i)', { size: 9, color: C.dim });
    s += dot(80, 230, 12, C.bullet, '•'); s += dot(80, 110, 12, C.bullet, '•'); s += arrow(80, 214, 80, 126, C.log, 2.2); s += text(90, 170, 'log: O×_v → log(O×_v) ⊂ K_v', { size: 9.5, color: C.log });
    s += text(110, 110, '(n, m+1)', { size: 10 }); s += text(110, 230, '(n, m)', { size: 10 });
    s += text(24, 250, '✓ D-prime-strip (Π_v, G_v) shared: vertically coric', { size: 9.5, color: C.shared }); s += text(24, 264, '✗ Frobenius-like O▷ not shared; log-shells I_v', { size: 9.5, color: C.alien }); s += text(36, 276, 'are built in the codomain', { size: 9.5, color: C.alien });
    s += rect(290, 24, 256, 250, { fill: C.thetaFill, stroke: C.theta, opacity: 0.7 }); s += text(300, 40, 'Θ-link  (n,m) → (n+1,m)', { size: 12, bold: true, color: C.theta }); s += text(300, 54, '[IUTchIII] Def 3.8 (ii); [Alien] §3.3 (vii)', { size: 9, color: C.dim });
    s += dot(340, 150, 12, C.dag, '†'); s += dot(500, 150, 12, C.ddag, '‡'); s += arrow(356, 150, 484, 150, C.theta, 2.4); s += text(420, 136, 'Θ', { size: 12, anchor: 'middle', color: C.theta, bold: true });
    s += text(300, 180, '(aΘ) G_v ↷ O×μ (+ lattices)  ≅  (aq)', { size: 9.5, color: C.shared }); s += text(300, 196, '(bΘ) {q̲^{j²}}_{j=1..l*}  ↦  (bq) {q̲}', { size: 9.5, color: C.hull }); s += text(300, 212, '(cΘ) global realified Frobenioid  ≅  (cq)', { size: 9.5, color: C.shared });
    s += text(300, 236, '✓ F⊢×μ shared: horizontally coric (up to Ind1, Ind2)', { size: 9.5, color: C.shared }); s += text(300, 250, '✗ Π_v, ring structures: mutually alien', { size: 9.5, color: C.alien }); s += text(300, 264, '✗ value groups dilated by l(l+1)/12', { size: 9.5, color: C.alien });
    s += text(14, 292, 'No link is compatible with the ring structures; the lattice is highly non-commutative ([IUTchIII] Rem 1.4.1).', { size: 9.5, color: C.dim });
    return svg(W, H, s);
  }

  function latticeFig(W, H, opt) { // [Alien] Fig 3.6 — the entire lattice ⊇ the portion actually used (the "infinite H")
    opt = opt || {}; var s = '', cols = 5, rows = 7, left = 30, top = 30, cw = 44, rh = 32;
    function X(n) { return left + n * cw; } function Y(m) { return top + (rows - 1 - m) * rh; }
    for (var n = 0; n < cols; n++) for (var m = 0; m < rows; m++) { if (m < rows - 1) s += arrow(X(n), Y(m) - 6, X(n), Y(m + 1) + 8, C.log, 1, null); if (n < cols - 1) s += arrow(X(n) + 7, Y(m), X(n + 1) - 8, Y(m), C.theta, 1, null); s += dot(X(n), Y(m), 4, C.grid); }
    s += text(X(2), Y(-1) + 6, 'the entire log-theta-lattice', { size: 10, anchor: 'middle', color: C.dim });
    s += text(X(cols - 1) + 40, Y(3), '⊇', { size: 26, anchor: 'middle', color: C.text });
    var hx = X(cols - 1) + 100, hc = 60;
    function HX(n) { return hx + n * hc; }
    for (n = 0; n < 2; n++) { for (m = 0; m < rows; m++) { if (m < rows - 1) s += arrow(HX(n), Y(m) - 8, HX(n), Y(m + 1) + 10, C.log, 1.8); s += dot(HX(n), Y(m), opt.big ? 7 : 6, m === 3 ? (n === 0 ? C.dag : C.ddag) : C.bullet, m === 3 ? (n === 0 ? '†' : '‡') : ''); } s += text(HX(n), Y(rows - 1) - 22, '⋮', { size: 12, anchor: 'middle', color: C.dim }); s += text(HX(n), Y(0) + 22, '⋮', { size: 12, anchor: 'middle', color: C.dim }); }
    s += arrow(HX(0) + 10, Y(3), HX(1) - 10, Y(3), C.theta, 2.4); s += text((HX(0) + HX(1)) / 2, Y(3) - 10, 'Θ', { size: 11, anchor: 'middle', color: C.theta, bold: true });
    s += text(HX(1) + 20, Y(5), 'log', { size: 9, color: C.log }); s += text(HX(0) + 30, Y(-1) + 6, 'the portion actually used: the infinite H', { size: 10, anchor: 'middle', color: C.dim });
    s += text(HX(0) - 20, Y(3) + 14, '(0,0)', { size: 8, anchor: 'middle', color: C.dim }); s += text(HX(1) + 20, Y(3) + 14, '(1,0)', { size: 8, anchor: 'middle', color: C.dim });
    return s;
  }
  function latticeCard() { var s = latticeFig(560, 300); s += wrap(20, 278, 'Each infinite vertical line is symmetric under vertical shifts (log-link iterates); the two columns are mutually alien ring theories glued by one Θ-link. [Alien] Fig 3.6, §3.3 (ii); [EssLgc] §3.3 (InfH)', { size: 9.5, color: C.dim, max: 115, lh: 11 }); return svg(560, 300, s); }

  function logShellCard(d, lat) {
    var W = 560, H = 300, s = '', ht = lat ? lat.peek(0, 1) : null, shells = ht && ht.hasIncomingLog ? ht.LogShell : [];
    s += text(20, 16, 'log-shell  I_v = (p*)⁻¹ · log(O×_{K_v}) ⊆ K_v,   p* = p (p odd), 4 (p = 2)', { size: 10.5, bold: true });
    var cx = 130, cy = 150;
    s += circle(cx, cy, 100, { fill: C.logFill, stroke: C.log }); s += circle(cx, cy, 70, { fill: C.softFill, stroke: C.dim }); s += circle(cx, cy, 42, { fill: C.frobFill, stroke: C.frob });
    s += text(cx, cy - 86, 'I_v (log-shell)', { size: 10, anchor: 'middle', color: C.log, bold: true }); s += text(cx, cy - 56, 'O_{K_v}', { size: 10, anchor: 'middle', color: C.dim }); s += text(cx, cy - 10, 'log(O×)', { size: 10, anchor: 'middle', color: C.frob }); s += text(cx, cy + 6, '= p^{λ} O for', { size: 8, anchor: 'middle', color: C.dim }); s += text(cx, cy + 18, 'λ = ⌊e/(p−1)⌋+1', { size: 8, anchor: 'middle', color: C.dim });
    s += text(cx, cy + 112, 'additive container for the', { size: 9, anchor: 'middle', color: C.dim }); s += text(cx, cy + 123, 'multiplicative monoids', { size: 9, anchor: 'middle', color: C.dim });
    s += text(260, 52, 'log-shells at (0,1), the codomain of the log-link from (0,0):', { size: 10.5, bold: true });
    var y = 70;
    s += text(260, y, 'v', { size: 10, color: C.dim }); s += text(310, y, 'p*', { size: 10, color: C.dim }); s += text(350, y, 'I_v = p^{r} O', { size: 10, color: C.dim }); s += text(450, y, 'μ_log(I_v)', { size: 10, color: C.dim });
    (shells.length ? shells : []).slice(0, 9).forEach(function (S) { y += 18; s += text(260, y, S.v, { size: 10, mono: true }); s += text(310, y, String(S.PStar), { size: 10, mono: true }); s += text(350, y, 'r = ' + S.radius, { size: 10, mono: true }); s += text(450, y, fmt(S.logVolume, 4), { size: 10, mono: true, color: S.logVolume ? C.theta : C.dim }); });
    if (!shells.length) s += text(260, 90, '(build the infinite H in the explorer)', { size: 10, color: C.dim });
    s += wrap(260, 250, 'μ_log(log_p O×) = −(1/e + m/(ef)) log p (m = 1 iff p = 2): an unramified odd p gives I_v = O_v with log-volume 0 ([IUTchIV] Prop 1.4 (ii)); the log-link preserves log-volumes (Stp8). Étale-like, vertically coric shells hold the Frobenius-like shells of every (n,m) ([Alien] Fig 3.15).', { size: 9, color: C.dim, max: 62, lh: 11 });
    return svg(W, H, s);
  }

  function indetCard() {
    var W = 560, H = 290, s = '', pw = 170;
    [['(Ind1)', 'automorphisms of G_v', 'étale-transport indeterminacy: Aut(G_v) does not preserve ring structures', C.etale, C.etaleFill], ['(Ind2)', 'Ism(O×μ): isometries', 'Kummer-detachment: G_v-equivariant automorphisms of O×μ preserving every lattice O×μ_H', C.log, C.logFill], ['(Ind3)', 'upper semi-compatibility', 'Kummer-detachment along iterates of the log-link: regions only grow (⊆) through the log-Kummer correspondence', C.hull, C.hullFill]].forEach(function (p, i) {
      var x0 = 14 + i * (pw + 12); s += rect(x0, 20, pw, 250, { fill: p[4], stroke: p[3], opacity: 0.8 }); s += text(x0 + 8, 36, p[0] + ' ' + p[1], { size: 10.5, bold: true, color: p[3] });
      var cx = x0 + pw / 2, cy = 120;
      if (i === 0) { s += circle(cx, cy, 40, { fill: C.white, stroke: p[3] }); s += text(cx, cy, 'G_v', { size: 13, anchor: 'middle', bold: true }); s += path('M' + (cx + 52) + ',' + (cy - 20) + ' A54,54 0 0,1 ' + (cx + 30) + ',' + (cy + 46), { stroke: p[3], arrow: true }); s += path('M' + (cx - 52) + ',' + (cy + 20) + ' A54,54 0 0,1 ' + (cx - 30) + ',' + (cy - 46), { stroke: p[3], arrow: true }); s += text(cx, cy + 70, 'Aut(G_v) ↷', { size: 10, anchor: 'middle', color: p[3] }); }
      if (i === 1) { for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) s += dot(cx + a * 16, cy + b * 16, 2.5, p[3]); s += rect(cx - 40, cy - 40, 80, 80, { fill: 'none', stroke: p[3], dash: '3,3' }); s += arrow(cx - 38, cy + 50, cx + 38, cy + 50, p[3], 1.2); s += arrow(cx + 38, cy + 58, cx - 38, cy + 58, p[3], 1.2); s += text(cx, cy + 76, 'lattice-preserving', { size: 10, anchor: 'middle', color: p[3] }); }
      if (i === 2) { [18, 30, 44, 60].forEach(function (r, k) { s += circle(cx, cy, r, { fill: 'none', stroke: p[3], opacity: 1 - k * 0.2, w: 1.2 }); }); s += dot(cx, cy, 3, p[3]); s += text(cx, cy + 78, 'log ↑: region ⊆ larger region', { size: 10, anchor: 'middle', color: p[3] }); }
      var words = p[2].split(' '), lines = [], cur = ''; words.forEach(function (w) { if ((cur + ' ' + w).length > 30) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
      lines.forEach(function (L, k) { s += text(x0 + 8, 216 + k * 12, L, { size: 9, color: C.dim }); });
    });
    s += text(14, 282, '(Ind1),(Ind2) are mild, (Ind3) substantial ([EssLgc] §3.11, Ind3 > 1+2); together: the monodromy of the loop of (Stp7).', { size: 9, color: C.dim });
    return svg(W, H, s);
  }

  function multiradialFig(d, W, H, opt) { // [Alien] Fig 3.18 — the full multiradial representation
    opt = opt || {}; var s = '', ls = d.LStar, rows = Math.min(ls, 6), top = 40, rh = Math.min(38, (H - 110) / rows), x0 = 120;
    s += text(12, 14, 'Θ-values acting on tensor packets of log-shells over processions   [Alien] Fig 3.16–3.18; [IUTchIII] Thm 3.11', { size: 10, color: C.dim });
    for (var j = 1; j <= rows; j++) {
      var y = top + (j - 1) * rh + rh / 2, bw = Math.min(30, (W - x0 - 150) / (j + 1));
      s += text(12, y, 'j = ' + j, { size: 10, bold: true }); s += text(44, y, 'q̲^' + (j * j), { size: 10, color: C.theta, bold: true }); s += arrow(72, y, x0 - 4, y, C.theta, 1.3);
      for (var k = 0; k <= j; k++) { s += rect(x0 + k * bw, y - 11, bw - 4, 22, { fill: k === 0 ? C.thetaFill : C.logFill, stroke: k === 0 ? C.theta : C.log, r: 3 }); s += text(x0 + k * bw + (bw - 4) / 2, y, k === 0 ? '0' : '/±', { size: 9, anchor: 'middle' }); }
      s += text(x0 + (j + 1) * bw + 6, y, 'S^±_{' + (j + 1) + '}: ' + (j + 1) + ' log-shells, ' + IUT.factorial(j + 1) + ' perms', { size: 9, color: C.dim }); s += text(W - 12, y, '(F_mod^×)_' + j, { size: 9.5, anchor: 'end', color: C.etale });
    }
    if (ls > rows) s += text(x0, top + rows * rh + 8, '… up to j = l* = ' + ls, { size: 9.5, color: C.dim });
    s += wrap(12, H - 36, 'Each row is a tensor packet of mono-analytic log-shells (zero-mass containers) acted on by the theta value q̲^{j²} and a copy of F_mod^×, up to (Ind1)–(Ind3). The input is only an abstract F⊢×μ-prime-strip (∧-Input, [EssLgc] §3.6), so the algorithm applies to †HT and ‡HT alike.', { size: 9, color: C.dim, max: Math.round(W / 5.2), lh: 11 });
    return s;
  }
  function multiradialCard(d) { return svg(560, 330, multiradialFig(d, 560, 330)); }

  function etalePictureFig(W, H, opt) {
    opt = opt || {}; var s = '', cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 56, n = opt.n || 6;
    s += text(12, 14, 'étale-picture: every column (n,◦) is radial data over the one bi-coric core D⊢   [Alien] Fig 3.5, 3.12', { size: 10, color: C.dim });
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); s += line(cx, cy, x, y, C.etale, 1.2); s += circle(x, y, 18, { fill: i === 0 ? C.dagFill : i === 1 ? C.ddagFill : C.softFill, stroke: i === 0 ? C.dag : i === 1 ? C.ddag : C.dim }); s += text(x, y, '(' + (i === 0 ? 0 : i === 1 ? 1 : i - 1 === 1 ? 'n' : 'n′') + ',◦)', { size: 9, anchor: 'middle' }); var lx = cx + (R - 34) * Math.cos(a), ly = cy + (R - 34) * Math.sin(a); if (i < 2) s += text(lx, ly, 'Π_v, ring, log-Kummer', { size: 7.5, anchor: 'middle', color: C.dim }); }
    s += circle(cx, cy, 30, { fill: C.hullFill, stroke: C.hull, w: 2.5 }); s += text(cx, cy - 5, 'D⊢', { size: 13, anchor: 'middle', bold: true, color: C.hull }); s += text(cx, cy + 9, 'G_v up to Ind1', { size: 7.5, anchor: 'middle', color: C.dim });
    s += path('M' + (cx + R + 24) + ',' + (cy - 30) + ' A' + (R + 24) + ',' + (R + 24) + ' 0 0,1 ' + (cx + R + 4) + ',' + (cy + 46), { stroke: C.hull, w: 1.2, arrow: true, dash: '4,3' }); s += text(cx + R + 30, cy + 58, 'permutable', { size: 9, color: C.hull, anchor: 'middle' });
    s += wrap(12, H - 22, 'Multiradial = the radial algorithm is compatible with arbitrary permutations of the spokes (parallel transport over the coric data); uniradial data, e.g. holomorphic structures, is not ([Alien] Fig 3.1).', { size: 8.5, color: C.dim, max: Math.round(W / 4.6), lh: 10 });
    return s;
  }
  function etaleCard() { return svg(560, 300, etalePictureFig(560, 300)); }

  function speciesCard() {
    var W = 560, H = 330, s = '', S = IUT_IDENTS.SPECIES, M = IUT_IDENTS.MUTATIONS, cols = 4, cw = (W - 20) / cols, rh = (H - 60) / Math.ceil(S.length / cols), pos = {};
    s += text(12, 14, 'species and mutations ([IUTchIV] §3): green = core (isomorphisms), red = non-isomorphic mutation', { size: 10, color: C.dim });
    S.forEach(function (sp, i) { pos[sp.id] = [10 + (i % cols) * cw + cw / 2, 30 + Math.floor(i / cols) * rh + rh / 2]; });
    var loops = {};
    M.forEach(function (m) { var a = pos[m.dom], b = pos[m.cod]; if (!a || !b) return; if (m.dom === m.cod) { var k = (loops[m.dom] = (loops[m.dom] || 0) + 1); s += path('M' + (a[0] + 62) + ',' + (a[1] - 6 + k * 3) + ' a' + (6 + 3 * k) + ',' + (6 + 3 * k) + ' 0 1,1 0,' + (10 - k * 2), { stroke: m.core ? C.shared : C.theta, w: 1.1, arrow: true }); return; } var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; s += arrow(a[0] + ux * 60, a[1] + uy * 12, b[0] - ux * 60, b[1] - uy * 12, m.core ? C.shared : C.theta, 1.1); });
    S.forEach(function (sp) { var p = pos[sp.id]; s += rect(p[0] - 62, p[1] - 12, 124, 24, { fill: C.white, stroke: C.bullet, r: 5 }); s += text(p[0], p[1], sp.id.length > 22 ? sp.id.slice(0, 21) + '…' : sp.id, { size: 8, anchor: 'middle', mono: true }); });
    return svg(W, H, s);
  }

  function identCard() {
    var W = 560, H = 230, s = '', rows = [['†HT', 'DagHodgeTheater'], ['F⊩▶×μ', 'FMonoGlobValUnitsModTorsPrimeStrip'], ['Θ×μ_LGP-link', 'ThetaUnitsModTorsLGPTorsorLink'], ['F_l^{⋊±}', 'FlSemiPm'], ['S^±_{j+1}', 'SPmJPlusOne'], ['(n,◦)', 'NCircColumn'], ['D_⊚±', 'DCircDotPm'], ['F⊩_Δ', 'FMonoGlobTriangle']];
    s += text(12, 16, 'notation with symbols  →  English-letters-only identifier (^[A-Za-z]+$, unique case-insensitively)', { size: 10.5, bold: true });
    rows.forEach(function (r, i) { var y = 42 + i * 22, found = IUT_IDENTS.find(r[1]); s += text(20, y, r[0], { size: 12 }); s += arrow(150, y, 196, y, C.accent, 1.2); s += pill(206 + r[1].length * 3.6, y, r[1], { fill: found ? C.accent : C.alien, color: C.white, mono: true, size: 10.5 }); });
    s += text(12, 222, IUT_IDENTS.IDENTS.length + ' identifiers generated from src/iut_ids.c; full table in explorer tab 7.', { size: 9.5, color: C.dim });
    return svg(W, H, s);
  }

  var cards = [
    { id: 'thetadata', title: 'Initial Θ-data', ref: '[IUTchI] Def 3.1 (via [IUTchII–IV], [Pano] §3, [Alien] §3.3 (i))', idents: ['InitialThetaData', 'FBarOverF', 'XF', 'CK', 'VBadMod', 'EpsilonUnder'], draw: thetaDataCard,
      desc: 'The input of the whole theory: a number field F with E_F, the prime l, the orbicurve C_K, the set of valuations V ≅ V_mod with its nonempty set V^bad_mod of odd bad multiplicative places, and ε̲. Here it is produced from an abc triple via the Frey curve.' },
    { id: 'labels', title: 'Label sets and their symmetries', ref: '[IUTchI] §4, §6; [Alien] §3.6 (ii)', idents: ['Fl', 'FlAbs', 'FlStar', 'FlSemiPm', 'FlStarSym', 'LabelT', 'LabelJ'], draw: labelsCard,
      desc: 'F_l carries the additive symmetry F_l^{⋊±}, its quotient |F_l| = F_l/±1 and F_l^* = |F_l|∖{0} carry the multiplicative symmetry F_l^*. The Θ±ell side uses t ∈ F_l, the ΘNF side uses j ∈ F_l^*; the two are glued by ±j ↦ j.' },
    { id: 'primestrips', title: 'Prime-strips: the forgetful ladder', ref: '[IUTchI] Fig I1.2, Def 4.1, 5.2; [IUTchII] Def 4.9; [IUTchIII] Thm 1.5', idents: ['DPrimeStrip', 'DMonoPrimeStrip', 'FPrimeStrip', 'FMonoPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoGlobValUnitsModTorsPrimeStrip'], draw: primeStripCard,
      desc: 'Collections of local data indexed by V. Arrows forget structure. The horizontally coric F⊢×μ-strip is what a Θ-link glues; the vertically coric D-strip is what a log-link shares; the bi-coric D⊢-strip is shared by everything.' },
    { id: 'local', title: 'The local datum at v', ref: '[IUTchI] Def 3.1, 4.1; [IUTchII] Def 4.9; [Alien] §2.7, §3.3 (vii)', idents: ['PiV', 'GV', 'OValV', 'OUnitsV', 'OUnitsModTorsV', 'OTorsV', 'QUnderV', 'ThetaUnderV'], draw: localDatumCard,
      desc: 'Inside each prime-strip, at each v: the étale-like groups Π_v ↠ G_v (zero mass) and the Frobenius-like monoid O▷ ≅ O▶ × O× (positive mass), related by Kummer theory. q̲_v sits in the value group O▶; the units mod torsion O×μ are what survives a Θ-link.' },
    { id: 'ht', title: 'Θ±ell NF-Hodge theater', ref: '[IUTchI] Def 6.13; [Alien] §3.3 (v), Fig 3.8', idents: ['ThetaPmEllNFHodgeTheater', 'ThetaPmEllHodgeTheater', 'ThetaNFHodgeTheater', 'FT', 'FJ', 'FBoxPlus', 'DCircDotPm', 'FGt', 'FCircAst', 'GluingZeroBoxPlusToGt'], draw: hodgeTheaterCard,
      desc: 'One vertex • of the lattice: a Θ±ell-HT (capsule F_T, Θ±-bridge to F_⊞, Θell-bridge to D_⊚±) and a ΘNF-HT (capsule F_J, Θ-bridge to F_>, NF-bridge to F_⊛), glued along 0,⊞ ↦ >. It is a single, complete copy of conventional scheme theory around E_F — a "universe".' },
    { id: 'pilots', title: 'Θ-Hodge theater, q-pilot and Θ-pilot', ref: '[IUTchI] Ex 3.2; [IUTchIII] Def 3.8 (i); [Alien] §3.3 (vii)', idents: ['ThetaHodgeTheater', 'QPilot', 'ThetaPilot', 'JSq', 'FMonoGlobTriangle', 'FMonoGlobLGPTorsor'], draw: pilotsCard,
      desc: 'The theta values Θ̲_v(j) = q̲_v^{j²} (j = 1..l*) form the Θ-pilot, the single value q̲_v the q-pilot; the Θ-link identifies them. Averaged over j the Θ-pilot is l(l+1)/12 times the q-pilot: this is the "q ↦ q^N" of [Alien] §2.4 that the theory wants to justify.' },
    { id: 'links', title: 'log-link and Θ-link', ref: '[IUTchIII] Def 1.1, Def 3.8 (ii), Thm 1.5; [Alien] §3.3 (vi), (vii)', idents: ['LogLink', 'ThetaLink', 'ThetaUnitsModTorsLGPTorsorLink', 'VerticallyCoric', 'HorizontallyCoric', 'BiCoric', 'AlienCopy'], draw: linksCard,
      desc: 'The two kinds of arrow of the lattice. The log-link uses both ring structures (the p-adic logarithm) and shares the étale-like D-strip; the Θ-link uses only multiplicative structure and shares G_v ↷ O×μ while mapping {q̲^{j²}} to {q̲}.' },
    { id: 'lattice', title: 'The log-theta-lattice and the infinite H', ref: '[IUTchIII] Def 1.4, Def 3.8 (iii); [Alien] Fig 3.6; [EssLgc] §3.3 (InfH)', idents: ['LogThetaLattice', 'InfiniteH', 'NMHodgeTheater', 'NCircColumn', 'Dag', 'Ddag'], draw: latticeCard,
      desc: 'Hodge theaters at (n,m) ∈ Z², log-links vertical, Θ-links horizontal. Only the two columns (0,◦), (1,◦) and the single Θ-link (0,0) → (1,0) are actually used: the "infinite H" ([EssLgc] §3.10 (Stp7) works entirely inside it).' },
    { id: 'logshell', title: 'Log-shells', ref: '[IUTchIII] Def 1.1, Prop 1.2; [IUTchIV] Prop 1.2, 1.4; [Alien] Ex 2.12.3, Fig 3.15', idents: ['LogShell', 'HolLogShell', 'MonoLogShell', 'FrobLogShell', 'EtLogShell', 'PStar', 'LogVolume'], draw: logShellCard,
      desc: 'I_v = (p*)⁻¹ log(O×_{K_v}): a compact additive module that contains the image of the units. Holomorphic / mono-analytic and Frobenius-like / étale-like versions all appear; the mono-analytic ones are the multiradial containers of (Stp3)–(Stp6).' },
    { id: 'indet', title: 'The three indeterminacies', ref: '[IUTchIII] Thm 3.11; [Alien] §3.7 (i); [EssLgc] §3.10 (Stp1)–(Stp3), §3.11', idents: ['IndOne', 'IndTwo', 'IndThree', 'Ism', 'UpperSemiCompatibility'], draw: indetCard,
      desc: '(Ind1) Aut(G_v) when identifying G_v\'s, (Ind2) isometries of O×μ when confusing Frobenius-like and étale-like log-shells, (Ind3) the upper semi-compatibility of the log-Kummer correspondence. They are the ∨̇\'s of the ∧(∨̇)-chain.' },
    { id: 'multi', title: 'Multiradial representation', ref: '[IUTchIII] Thm 3.11; [Alien] §3.7 (i), Fig 3.16–3.19', idents: ['MultiradialRepresentation', 'SPmJPlusOne', 'TensorPacket', 'HolomorphicHull', 'PsiLGP'], draw: multiradialCard,
      desc: 'The Θ-pilot of (0,0), descended to data that makes sense from (1,0): processions S^±_{j+1} of tensor packets of log-shells, the splitting monoids {q̲^{j²}} and copies of F_mod^×, up to Ind1–3. Its log-volume is bounded by the hull of the shells.' },
    { id: 'etale', title: 'Étale-picture and multiradiality', ref: '[IUTchI] Fig I1.6; [Alien] §3.1, Fig 3.1, 3.5, 3.12', idents: ['EtalePicture', 'Multiradial', 'Uniradial', 'DMonoPrimeStrip'], draw: etaleCard,
      desc: 'Pass to étale-like data: every column of the lattice becomes a spoke around one core D⊢-prime-strip. A multiradial algorithm is one whose output may be transported along any spoke (parallel transport up to the monodromy Ind1–3).' },
    { id: 'species', title: 'Species and mutations', ref: '[IUTchIV] §3 Def 3.1, 3.3', idents: ['ZeroSpecies', 'Mutation', 'MutationHistory', 'Core'], draw: speciesCard,
      desc: 'The set-theoretic bookkeeping: each data type is a species (a formula defining a collection of sets), each construction a mutation; a chain of mutations is a mutation-history. Different universes (Hodge theaters) are related only through the species.' },
    { id: 'idents', title: 'English-letters-only identifiers', ref: 'docs/IDENTIFIERS.md', idents: ['Dag', 'Ddag', 'Mono', 'MonoGlob', 'UnitsModTors', 'BoxPlus', 'CircAst', 'Triangle'], draw: identCard,
      desc: 'Every symbol in a notation maps to a word; the identifiers are the keys used in the JSON of the C program and the web model and are checked for uniqueness by `make check`.' }
  ];

  root.SV = SV; root.DIAGRAMS = { cards: cards, hodgeTheaterSVG: hodgeTheaterSVG, latticeFig: latticeFig, multiradialFig: multiradialFig, etalePictureFig: etalePictureFig };
})(typeof window !== "undefined" ? window : global);
