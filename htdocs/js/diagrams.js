/*
 * diagrams.js — every drawing of the app, on HTML5 canvas, computed from the engine's JSON / transcripts.
 * Each function takes (canvas, data…) and draws at a fixed logical width (the canvas scales with CSS).
 */
(function (root) {
  'use strict';
  var D = root.DRAW, P = D.P, fmt = D.fmt;

  function valColor(v) { return v.kind === 'VArc' ? P.violet : v.inVBadMod ? P.orange : v.reduction !== 'good' ? P.yellow : P.green; }
  function valBg(v) { return v.kind === 'VArc' ? P.violetBg : v.inVBadMod ? P.orangeBg : v.reduction !== 'good' ? P.yellowBg : P.greenBg; }
  function sup(n) { var s = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(n).split('').map(function (c) { return s[c] || c; }).join(''); }

  /* ---------------------------------------------------------------- initial Θ-data */
  function thetaData(cv, g) {
    var W = 760, nV = g.VSet.length, H = 250;
    var c = D.setup(cv, W, H);
    /* field tower */
    var tx = 90, ty = 36;
    var fields = [
      { l: 'F̄', s: 'algebraic closure', fill: P.greyBg },
      { l: 'K = F(E[l])', s: '[K:Q] ≤ ' + fmt(g.K.degreeBound, 0), fill: P.violetBg },
      { l: 'F', s: '[F:Q] ≤ ' + fmt(g.F.degreeBound, 0), fill: P.blueBg },
      { l: 'F_mod = Q(j_E)', s: '[F_mod:Q] = ' + g.Fmod.degree, fill: P.greenBg }
    ];
    fields.forEach(function (f, i) {
      D.box(c, tx - 70, ty + i * 48, 150, 38, { fill: f.fill, stroke: null, label: f.l, sub: f.s, serif: true, size: 14 });
      if (i < 3) D.line(c, tx + 5, ty + i * 48 + 38, tx + 5, ty + (i + 1) * 48, { color: P.ink3, width: 1.5 });
    });
    D.text(c, 'the field tower', tx + 5, ty - 18, { size: 11, color: P.ink3 });
    /* curve + l */
    var bx = 250;
    D.box(c, bx, ty, 230, 56, { fill: P.yellowBg, stroke: null, label: 'E_F : ' + g.curve.replace('Frey ', ''), sub: 'X_F = E_F ∖ {origin} once-punctured; C_K = X̲_K / ±1', size: 13, serif: true });
    D.box(c, bx, ty + 66, 110, 56, { fill: P.blueBg, stroke: null, label: 'l = ' + g.l, sub: 'l* = ' + g.LStar + '   l± = ' + g.LPm, size: 18, serif: true });
    D.box(c, bx + 120, ty + 66, 110, 56, { fill: P.pinkBg, stroke: null, label: 'ε̲ = ' + g.EpsilonUnder, sub: '2-torsion shift', size: 16, serif: true });
    D.box(c, bx, ty + 132, 230, 50, { fill: P.greyBg, stroke: null, label: 'log q = ' + fmt(g.logQ) + '    |log q| = log q / 2l = ' + fmt(g.AbsLogQ), sub: 'log f = ' + fmt(g.logF) + '   ht_E = (1/6) log q = ' + fmt(g.HtE), size: 12 });
    /* valuations */
    var vx = 500, vw = W - vx - 10, cell = Math.min(60, vw / Math.max(1, Math.ceil(nV / 2)));
    D.text(c, 'V ≅ V_mod  (' + nV + ' valuations)', vx + vw / 2, ty - 18, { size: 11, color: P.ink3 });
    g.VSet.forEach(function (v, i) {
      var col = i % Math.ceil(nV / 2), row = Math.floor(i / Math.ceil(nV / 2));
      var x = vx + col * cell, y = ty + row * 70;
      D.box(c, x + 2, y, cell - 6, 62, { fill: valBg(v), stroke: valColor(v), label: v.kind === 'VArc' ? '∞' : 'p = ' + v.p, sub: v.kind === 'VArc' ? 'arch.' : (v.reduction === 'good' ? 'good' : v.reduction === 'badMultiplicative' ? 'ord q = ' + v.ordQ : 'additive'), size: 13, serif: true });
      if (v.inVBadMod) D.text(c, 'V^bad_mod', x + cell / 2 - 1, y + 70, { size: 9, color: P.orange });
    });
    var ly = H - 18;
    [[P.orange, 'bad multiplicative, in V^bad_mod'], [P.yellow, 'bad, not in V^bad_mod'], [P.green, 'good'], [P.violet, 'archimedean']].forEach(function (e, i) {
      D.dot(c, 24 + i * 180, ly, 5, e[0]); D.text(c, e[1], 34 + i * 180, ly, { size: 10, color: P.ink2, align: 'left' });
    });
  }

  /* ---------------------------------------------------------------- label sets */
  function labels(cv, g, opt) {
    opt = opt || {};
    var l = g.l, ls = g.LStar, W = 760, H = 230, c = D.setup(cv, W, H);
    var x0 = 60, x1 = W - 60, step = (x1 - x0) / (l - 1);
    /* F_l line */
    var y = 50;
    D.text(c, 'F_l = {−l*, …, l*}  (the F_l^{⋊±}-symmetry: t ↦ ±t + a)', x0, 18, { size: 12, align: 'left', color: P.ink2 });
    D.line(c, x0 - 20, y, x1 + 20, y, { color: P.line, width: 2 });
    for (var t = -ls; t <= ls; t++) {
      var x = x0 + (t + ls) * step, hi = opt.highlight != null && (t === opt.highlight || t === -opt.highlight);
      D.dot(c, x, y, hi ? 9 : 7, t === 0 ? P.violet : hi ? P.orange : P.blue);
      D.text(c, String(t), x, y + 20, { size: 11, color: P.ink2, mono: true });
    }
    /* fold arrows to |F_l| */
    var y2 = 130;
    D.text(c, '|F_l| = F_l / {±1} = {0, …, l*}  (fold t ↦ |t|)', x0, y2 - 32, { size: 12, align: 'left', color: P.ink2 });
    var step2 = (x1 - x0) / Math.max(1, ls);
    for (var j = 0; j <= ls; j++) {
      var xj = x0 + j * step2;
      D.dot(c, xj, y2, 7, j === 0 ? P.violet : P.teal);
      D.text(c, String(j), xj, y2 + 20, { size: 11, color: P.ink2, mono: true });
      var xa = x0 + (j + ls) * step, xb = x0 + (-j + ls) * step;
      D.arrow(c, xa, y + 8, xj, y2 - 8, { color: 'rgba(37,99,235,.35)', width: 1, head: false });
      if (j) D.arrow(c, xb, y + 8, xj, y2 - 8, { color: 'rgba(37,99,235,.35)', width: 1, head: false });
    }
    /* F_l^* */
    var y3 = 195;
    D.text(c, 'F_l^* = F_l^× / {±1} = {1, …, l*}  (the F_l^*-symmetry: j ↦ u·j, multiplicative)', x0, y3 - 30, { size: 12, align: 'left', color: P.ink2 });
    for (j = 1; j <= ls; j++) {
      var x3 = x0 + j * step2;
      D.dot(c, x3, y3, 7, P.green);
      D.text(c, String(j), x3, y3 + 18, { size: 11, color: P.ink2, mono: true });
      D.line(c, x3, y2 + 8, x3, y3 - 8, { color: 'rgba(21,128,61,.35)', dashed: true });
    }
    D.text(c, '0 ↦ "0" of the gluing  0, ⊞ ↦ >', x0, y3, { size: 10, color: P.violet, align: 'left' });
    D.text(c, 'l = ' + l + ', l* = ' + ls + ', l± = ' + (ls + 1), x1, 18, { size: 11, color: P.ink3, align: 'right' });
  }

  /* ---------------------------------------------------------------- one prime-strip (local boxes per v) */
  function primeStrip(cv, strip, g, opt) {
    opt = opt || {};
    var nV = strip.local.length, W = 760, H = strip.global ? 190 : 150, c = D.setup(cv, W, H);
    var cell = Math.min(118, (W - 40) / nV), x0 = (W - cell * nV) / 2, y0 = 52;
    D.text(c, (strip.notation || '') + '-prime-strip  "' + strip.label + '"   ' + (strip.etaleLike ? 'étale-like' : 'Frobenius-like') + ', ' + (strip.monoAnalytic ? 'mono-analytic' : 'holomorphic'), W / 2, 18, { size: 13, serif: true, bold: true });
    strip.local.forEach(function (lo, i) {
      var v = g.VSet[i] || { name: 'v' + i }, x = x0 + i * cell;
      D.box(c, x + 3, y0, cell - 6, 84, { fill: '#fff', stroke: v.inVBadMod ? P.orange : P.line });
      D.text(c, v.name === 'vinf' ? 'v = ∞' : 'v | ' + v.p, x + cell / 2, y0 - 12, { size: 11, color: P.ink2, serif: true });
      var ly = y0 + 14;
      function row(label, present, color, bg) {
        D.box(c, x + 8, ly - 8, cell - 16, 17, { fill: present ? bg : '#fff', stroke: present ? null : P.line, dashed: !present, r: 4 });
        D.text(c, label, x + cell / 2, ly, { size: 10.5, color: present ? color : P.ink3, serif: true });
        ly += 21;
      }
      row(lo.PiV ? 'Π_v #' + lo.PiV : 'Π_v —', !!lo.PiV, P.blue, P.blueBg);
      row(lo.GV ? 'G_v #' + lo.GV : 'G_v', !!lo.GV, P.blue, P.blueBg);
      row(lo.units ? (lo.unitsModTors ? 'O×μ #' : 'O× #') + lo.units : 'units —', !!lo.units, P.orange, P.orangeBg);
      row(lo.valGroup ? 'O▶ ' + (lo.vals.length ? 'q̲^{' + lo.vals.join(',') + '}' : '') : 'O▶ —', lo.valGroup, P.teal, P.tealBg);
    });
    if (strip.global) {
      D.box(c, x0, y0 + 98, cell * nV, 34, { fill: P.violetBg, stroke: null, label: 'C⊩ global realified Frobenioid, Prime(C⊩) ≅ V,  degree of the pilot object ' + fmt(strip.globalDegree), size: 12, serif: true });
    }
    if (opt.note) D.text(c, opt.note, W / 2, H - 10, { size: 10, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- the forgetful ladder of prime-strip kinds */
  function ladder(cv, g, opt) {
    opt = opt || {};
    var W = 760, H = 330, c = D.setup(cv, W, H);
    var kinds = [
      { n: 'F⊩▶×μ', id: 'FMonoGlobValUnitsModTorsPrimeStrip', d: 'G_v ↷ O▶ × O×μ + C⊩ (pilots)', cor: '' },
      { n: 'F⊩', id: 'FMonoGlobPrimeStrip', d: 'F⊢ + C⊩, ρ_v', cor: '' },
      { n: 'F⊢▶×μ', id: 'FMonoValUnitsModTorsPrimeStrip', d: 'G_v ↷ O▶ × O×μ', cor: '' },
      { n: 'F⊢×μ', id: 'FMonoUnitsModTorsPrimeStrip', d: 'G_v ↷ O×μ, ×μ-Kummer (Ism)', cor: 'horizontally coric' },
      { n: 'F⊢×', id: 'FMonoUnitsPrimeStrip', d: 'G_v ↷ O×', cor: '' },
      { n: 'F⊢', id: 'FMonoPrimeStrip', d: 'G_v ↷ O▷ split', cor: '' },
      { n: 'F', id: 'FPrimeStrip', d: 'Π_v ↷ O▷', cor: '' },
      { n: 'D', id: 'DPrimeStrip', d: '{Π_v}', cor: 'vertically coric' },
      { n: 'D⊢', id: 'DMonoPrimeStrip', d: '{G_v}', cor: 'bi-coric' }
    ];
    /* two columns: Frobenius-like (left) and étale-like (right), arrows = forgetful functors */
    var fx = 60, ex = 470, w = 300, h = 34, gap = 10;
    D.text(c, 'Frobenius-like (carry monoids O)', fx + w / 2, 20, { size: 12, color: P.orange, bold: true });
    D.text(c, 'étale-like (groups only)', ex + w / 2, 20, { size: 12, color: P.blue, bold: true });
    var pos = {};
    [0, 1, 2, 3, 4, 5, 6].forEach(function (i) {
      var k = kinds[i], y = 40 + i * (h + gap), sel = opt.highlight === k.id;
      pos[k.id] = D.box(c, fx, y, w, h, { fill: sel ? P.orangeBg : '#fff', stroke: k.cor ? P.green : P.orange, lineWidth: sel ? 2.5 : 1.2, label: k.n + '   ' + k.d, size: 12, serif: true });
      if (k.cor) D.pill(c, fx + w - 50, y + h / 2, k.cor, { fill: P.greenBg, color: P.green, size: 9 });
      if (i < 6) D.arrow(c, fx + w / 2, y + h, fx + w / 2, y + h + gap, { color: P.ink3, width: 1 });
    });
    [7, 8].forEach(function (i, j) {
      var k = kinds[i], y = 40 + (j === 0 ? 6 : 3) * (h + gap), sel = opt.highlight === k.id;
      pos[k.id] = D.box(c, ex, y, w, h, { fill: sel ? P.blueBg : '#fff', stroke: P.green, lineWidth: sel ? 2.5 : 1.2, label: k.n + '   ' + k.d, size: 12, serif: true });
      D.pill(c, ex + w - 50, y + h / 2, k.cor, { fill: P.greenBg, color: P.green, size: 9 });
    });
    D.arrow(c, pos.FPrimeStrip.right, pos.FPrimeStrip.cy, pos.DPrimeStrip.x, pos.DPrimeStrip.cy, { color: P.ink3, label: 'F ↦ D (forget O)', labelSize: 10 });
    D.arrow(c, pos.FMonoUnitsModTorsPrimeStrip.right, pos.FMonoUnitsModTorsPrimeStrip.cy, pos.DMonoPrimeStrip.x, pos.DMonoPrimeStrip.cy, { color: P.ink3, label: 'F⊢×μ ↦ D⊢', labelSize: 10 });
    D.arrow(c, pos.DPrimeStrip.cx, pos.DPrimeStrip.y, pos.DMonoPrimeStrip.cx, pos.DMonoPrimeStrip.bottom, { color: P.ink3, label: 'Π_v ↠ G_v', labelSize: 10, labelOffset: 12 });
    D.text(c, 'arrows = forgetful functors ([IUTchI] Def 5.2, [IUTchII] Def 4.9); green border = coric kinds of [IUTchIII] Thm 1.5', W / 2, H - 12, { size: 10, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- Hodge theater ([Alien] Fig 3.8 layout) */
  function hodgeTheater(cv, ht, g, opt) {
    opt = opt || {};
    var W = 760, H = 330, c = D.setup(cv, W, H);
    var T = ht.ThetaPmEllHodgeTheater.capsuleFT, J = ht.ThetaNFHodgeTheater.capsuleFJ;
    D.text(c, 'Θ±ell NF-Hodge theater ' + (ht.copy || '') + ' at (' + ht.n + ',' + ht.m + ')  —  universe #' + ht.universe, W / 2, 16, { size: 13, bold: true });
    /* left: Θ±ell-HT */
    D.box(c, 14, 34, 360, 262, { fill: 'rgba(37,99,235,.04)', stroke: P.blue, dashed: true, r: 12 });
    D.text(c, 'Θ±ell-Hodge theater  (additive symmetry F_l^{⋊±})', 194, 48, { size: 11, color: P.blue, bold: true });
    var cw = Math.min(26, 330 / T.length), cx0 = 194 - cw * T.length / 2;
    T.forEach(function (m, i) {
      var sel = opt.focusT != null && (m.t === opt.focusT);
      D.box(c, cx0 + i * cw + 1, 70, cw - 2, 40, { fill: m.t === 0 ? P.violetBg : sel ? P.orangeBg : P.blueBg, stroke: null, r: 4 });
      D.text(c, String(m.t), cx0 + i * cw + cw / 2, 84, { size: 10, mono: true, color: P.ink });
      D.text(c, '#' + (m.basepoint % 1000), cx0 + i * cw + cw / 2, 100, { size: 7, color: P.ink3 });
    });
    D.brace(c, cx0, cx0 + cw * T.length, 116, 'capsule F_T of F-prime-strips, t ∈ F_l, distinct basepoints', { size: 10 });
    var bp = D.box(c, 60, 170, 120, 44, { fill: P.orangeBg, stroke: null, label: 'F_⊞', sub: 'Θ±-bridge target', serif: true, size: 15 });
    var dc = D.box(c, 214, 170, 140, 44, { fill: P.blueBg, stroke: null, label: 'D_⊚±', sub: 'Π_{X̲_K} (Θell-bridge)', serif: true, size: 15 });
    D.arrow(c, 150, 112, bp.cx, bp.y, { color: P.orange, label: 'Θ±-bridge  F_T → F_⊞', labelSize: 10, labelOffset: 14 });
    D.arrow(c, 240, 112, dc.cx, dc.y, { color: P.blue, label: 'Θell-bridge  D_T → D_⊚±', labelSize: 10, labelOffset: -14 });
    D.text(c, 'isomorphism torsors: {±1}×{±1}^V (Θ±), F_l^{⋊±} (Θell)   [IUTchI] Prop 6.6', 194, 240, { size: 9.5, color: P.ink2 });
    D.text(c, 'conjugate synchronization: the capsule members are identified by the F_l^{⋊±}-symmetrizing isomorphisms', 194, 262, { size: 9, color: P.ink3, maxWidth: 340 });
    /* right: ΘNF-HT */
    D.box(c, 386, 34, 360, 262, { fill: 'rgba(21,128,61,.04)', stroke: P.green, dashed: true, r: 12 });
    D.text(c, 'ΘNF-Hodge theater  (multiplicative symmetry F_l^*)', 566, 48, { size: 11, color: P.green, bold: true });
    var jw = Math.min(34, 300 / J.length), jx0 = 566 - jw * J.length / 2;
    J.forEach(function (m, i) {
      D.box(c, jx0 + i * jw + 1, 70, jw - 2, 40, { fill: P.greenBg, stroke: null, r: 4 });
      D.text(c, String(m.j), jx0 + i * jw + jw / 2, 84, { size: 10, mono: true });
      D.text(c, '#' + (m.basepoint % 1000), jx0 + i * jw + jw / 2, 100, { size: 7, color: P.ink3 });
    });
    D.brace(c, jx0, jx0 + jw * J.length, 116, 'capsule F_J, j ∈ F_l^*', { size: 10 });
    var gt = D.box(c, 420, 170, 130, 44, { fill: P.orangeBg, stroke: null, label: 'F_>', sub: 'Θ-bridge target', serif: true, size: 15 });
    var ca = D.box(c, 580, 170, 150, 44, { fill: P.greenBg, stroke: null, label: 'F_⊛', sub: 'Π_{C_K} ↷ F_mod^× (NF-bridge)', serif: true, size: 15 });
    D.arrow(c, 520, 112, gt.cx, gt.y, { color: P.orange, label: 'Θ-bridge  F_J → F_>', labelSize: 10, labelOffset: 14 });
    D.arrow(c, 610, 112, ca.cx, ca.y, { color: P.green, label: 'NF-bridge  F_J → F_⊛', labelSize: 10, labelOffset: -14 });
    var th = ht.ThetaNFHodgeTheater.ThetaHodgeTheater;
    D.box(c, 420, 228, 310, 52, { fill: P.yellowBg, stroke: null, label: 'Θ-Hodge theater inside F_>:  F⊩_mod {q̲_v},  F⊩_tht {Θ̲_v}', sub: 'Θ̲_v(j) = q̲_v^{j²}:  ' + th.thetaValues.join(', '), size: 11, serif: true });
    /* gluing */
    D.arrow(c, bp.right, bp.cy, gt.x, gt.cy, { color: P.violet, width: 2, label: 'gluing  0, ⊞ ↦ >', labelSize: 11, labelOffset: -12, labelColor: P.violet, both: false });
    D.text(c, 'F_l ⊇ F_l^× ↠ F_l^*', (bp.right + gt.x) / 2, bp.cy + 14, { size: 10, color: P.violet });
    D.text(c, (ht.glued ? 'glued ✓' : 'not glued') + '   pilots: q-pilot ' + fmt(ht.QPilot.logVolume) + ', Θ-pilot ' + fmt(ht.ThetaPilot.logVolume) + '  (log-volumes)', W / 2, H - 14, { size: 10.5, color: P.ink2 });
  }

  /* ---------------------------------------------------------------- the lattice */
  function lattice(cv, w, opt) {
    opt = opt || {};
    var hts = w.HodgeTheaters, links = w.links;
    var ns = hts.map(function (h) { return h.n; }), ms = hts.map(function (h) { return h.m; });
    var nmin = Math.min.apply(null, ns.concat([0])), nmax = Math.max.apply(null, ns.concat([1]));
    var mmin = Math.min.apply(null, ms.concat([0])), mmax = Math.max.apply(null, ms.concat([0]));
    if (opt.ghostRows) { mmin = Math.min(mmin, -opt.ghostRows); mmax = Math.max(mmax, opt.ghostRows); }
    var cols = nmax - nmin + 1, rows = mmax - mmin + 1;
    var W = opt.width || 760, cellW = Math.min(200, (W - 120) / Math.max(cols, 2)), cellH = Math.min(96, 420 / Math.max(rows, 3));
    var H = Math.max(260, (rows + 1) * cellH + 50), c = D.setup(cv, W, H);
    var x0 = (W - (cols - 1) * cellW) / 2, y0 = (H - (rows - 1) * cellH) / 2 + 8;   /* vertices centred, half a ghost row above and below */
    function X(n) { return x0 + (n - nmin) * cellW; }
    function Y(m) { return y0 + (mmax - m) * cellH; }
    var visible = opt.visible || function () { return true; };
    /* ghost grid */
    for (var n = nmin - 1; n <= nmax + 1; n++) for (var m = mmin - 1; m <= mmax + 1; m++) {
      var gx = X(n), gy = Y(m);
      if (gx < 20 || gx > W - 20 || gy < 20 || gy > H - 30) continue;
      D.dot(c, gx, gy, 3, '#e6ebf2');
    }
    /* column labels */
    for (n = nmin; n <= nmax; n++) D.text(c, '(' + n + ',◦)', X(n), 16, { size: 11, color: P.ink3, serif: true });
    /* links */
    links.forEach(function (lk, i) {
      if (!visible('link', lk, i)) return;
      var isLog = lk.species === 'LogLink';
      var x1 = X(lk.dom[0]), y1 = Y(lk.dom[1]), x2 = X(lk.cod[0]), y2 = Y(lk.cod[1]);
      var sel = opt.selectedLink === i;
      if (isLog) D.arrow(c, x1, y1 - 14, x2, y2 + 14, { color: sel ? P.violet : P.blue, width: sel ? 3 : 2, label: opt.labels === false ? null : 'log', labelSize: 9, labelOffset: 12 });
      else D.arrow(c, x1 + 16, y1, x2 - 16, y2, { color: sel ? P.violet : P.orange, width: sel ? 3 : 2.5, label: opt.labels === false ? null : lk.notation, labelSize: 10, labelOffset: -12 });
    });
    /* vertices */
    hts.forEach(function (h, i) {
      if (!visible('ht', h, i)) return;
      var x = X(h.n), y = Y(h.m), sel = opt.focus && opt.focus[0] === h.n && opt.focus[1] === h.m;
      D.dot(c, x, y, sel ? 13 : 10, sel ? P.violet : h.hasIncomingLog ? P.ink : '#fff', sel ? P.violet : P.ink);
      D.text(c, h.copy === 'Dag' ? '†HT' : h.copy === 'Ddag' ? '‡HT' : '{' + h.n + ',' + h.m + '}HT', x + 18, y - 10, { size: 11, align: 'left', serif: true, color: sel ? P.violet : P.ink });
      D.text(c, '#' + h.universe, x + 18, y + 6, { size: 9, align: 'left', color: P.ink3, mono: true });
      if (opt.shells && h.hasIncomingLog) D.pill(c, x - 26, y, 'I', { fill: P.tealBg, color: P.teal, size: 9, serif: true });
    });
    if (opt.H) { /* the infinite H outline */
      D.text(c, 'the "infinite H": columns (0,◦), (1,◦) and the single Θ-link (0,0) → (1,0)', W / 2, H - 12, { size: 10.5, color: P.ink3 });
    }
    return { X: X, Y: Y, W: W, H: H };
  }

  /* ---------------------------------------------------------------- the Θ-link gluing (alien copies) */
  function thetaLink(cv, dom, cod, link, g) {
    var W = 760, H = 300, c = D.setup(cv, W, H);
    D.text(c, link.notation + '  (' + link.dom.join(',') + ') → (' + link.cod.join(',') + ')   glues  †F⊩_LGP  ≅  ‡F⊩_Δ  (full poly-isomorphism)', W / 2, 16, { size: 13, bold: true });
    var L = dom.FMonoGlobLGPTorsor || dom.FMonoGlobGau, R = cod.FMonoGlobTriangle;
    var nV = L.local.length, rowH = 24, y0 = 64;
    D.box(c, 20, 36, 300, 24 + nV * rowH + 10, { fill: 'rgba(234,88,12,.05)', stroke: P.orange, r: 10 });
    D.box(c, 440, 36, 300, 24 + nV * rowH + 10, { fill: 'rgba(37,99,235,.05)', stroke: P.blue, r: 10 });
    D.text(c, '† = ' + dom.copy + ' (universe #' + dom.universe + ')   F⊩_LGP: Θ-pilot {q̲^{j²}}', 170, 50, { size: 11, bold: true, color: P.orange });
    D.text(c, '‡ = ' + cod.copy + ' (universe #' + cod.universe + ')   F⊩_Δ: q-pilot {q̲}', 590, 50, { size: 11, bold: true, color: P.blue });
    L.local.forEach(function (lo, i) {
      var ro = R.local[i], v = g.VSet[i], y = y0 + i * rowH + 8;
      var samG = lo.GV === ro.GV, samU = lo.units === ro.units;
      D.text(c, v.name, 34, y, { size: 10, align: 'left', mono: true, color: P.ink2 });
      D.text(c, 'Π#' + (lo.PiV || '—'), 90, y, { size: 10, align: 'left', mono: true, color: P.red });
      D.text(c, 'G#' + lo.GV, 150, y, { size: 10, align: 'left', mono: true, color: samG ? P.green : P.red });
      D.text(c, 'O×μ#' + lo.units, 212, y, { size: 10, align: 'left', mono: true, color: samU ? P.green : P.red });
      D.text(c, lo.vals.length ? 'q̲^{' + lo.vals.join(',') + '}' : 'O▶', 300, y, { size: 10, align: 'right', mono: true, color: P.teal });
      D.text(c, 'q̲^{' + (ro.vals.length ? ro.vals.join(',') : '') + '}' + (ro.vals.length ? '' : 'O▶'), 456, y, { size: 10, align: 'left', mono: true, color: P.teal });
      D.text(c, 'O×μ#' + ro.units, 530, y, { size: 10, align: 'left', mono: true, color: samU ? P.green : P.red });
      D.text(c, 'G#' + ro.GV, 620, y, { size: 10, align: 'left', mono: true, color: samG ? P.green : P.red });
      D.text(c, 'Π#' + (ro.PiV || '—'), 690, y, { size: 10, align: 'left', mono: true, color: P.red });
      /* the glue per v */
      D.line(c, 322, y, 438, y, { color: samU ? P.green : P.red, width: 1, dashed: true });
    });
    var ymid = y0 + nV * rowH / 2;
    D.box(c, 330, ymid - 26, 100, 52, { fill: P.violetBg, stroke: null, label: '≅', sub: 'up to Ind1, Ind2', serif: true, size: 22, labelColor: P.violet });
    var yy = 36 + 24 + nV * rowH + 30;
    var rows = [
      ['(aΘ)', 'G_v ↷ O×μ of †F⊩_LGP  ≅  G_v ↷ O×μ of ‡F⊩_Δ', link.preservesGV && link.preservesUnitsModTors ? 'shared, up to Aut(G_v) (Ind1) and Ism (Ind2)' : 'units not shared', P.green],
      ['(bΘ)', '{q̲_v^{j²}}_{j=1..l*}  ↦  {q̲_v}', 'value groups dilated by l(l+1)/12 = ' + fmt(link.dilation), P.teal],
      ['(cΘ)', '†C⊩ ≅ ‡C⊩ global realified Frobenioids', 'degrees † ' + fmt(L.globalDegree) + ' vs ‡ ' + fmt(R.globalDegree), P.violet],
      ['—', 'Π_v and the ring structures', link.preservesPiV ? 'identified' : 'NOT identified: mutually alien copies', P.red]
    ];
    rows.forEach(function (r, i) {
      var y = yy + i * 20;
      if (y > H - 8) return;
      D.text(c, r[0], 30, y, { size: 10.5, align: 'left', bold: true, color: r[3] });
      D.text(c, r[1], 70, y, { size: 10.5, align: 'left', serif: true });
      D.text(c, r[2], 740, y, { size: 10, align: 'right', color: r[3] });
    });
  }

  /* ---------------------------------------------------------------- log-shells */
  function logShells(cv, shells, g, opt) {
    opt = opt || {};
    var W = 760, H = 56 + shells.length * 30, c = D.setup(cv, W, H);
    D.text(c, 'log-shells I_v = (p*)⁻¹ · log(O×_{K_v})   at (' + (shells[0] && shells[0].from ? 'built by the log-link from (' + shells[0].from.join(',') + ')' : '') + ')', W / 2, 16, { size: 12.5, bold: true });
    var maxAbs = Math.max(0.5, Math.max.apply(null, shells.map(function (s) { return Math.abs(s.logVolume); })));
    shells.forEach(function (s, i) {
      var y = 44 + i * 30, v = g.VSet[i] || {};
      D.text(c, s.v === 'vinf' ? 'v = ∞' : s.v + ' (p=' + v.p + ', e=' + v.eK + ')', 20, y, { size: 11, align: 'left', serif: true });
      D.text(c, 'p* = ' + (s.PStar || '—'), 150, y, { size: 10.5, align: 'left', mono: true, color: P.ink2 });
      D.text(c, 'radius ' + s.radius, 230, y, { size: 10.5, align: 'left', mono: true, color: P.ink2 });
      D.text(c, s.holomorphic ? 'holomorphic' : 'mono-analytic', 330, y, { size: 10, align: 'left', color: s.holomorphic ? P.violet : P.teal });
      D.text(c, s.etaleLike ? 'étale-like' : 'Frobenius-like', 420, y, { size: 10, align: 'left', color: s.etaleLike ? P.blue : P.orange });
      D.bar(c, 520, y - 7, 150, 14, s.logVolume / maxAbs, { fill: s.logVolume < 0 ? P.red : P.teal });
      D.text(c, 'μ_log = ' + fmt(s.logVolume, 4), 680, y, { size: 10.5, align: 'left', mono: true });
    });
  }

  /* ---------------------------------------------------------------- pilots */
  function pilots(cv, ht, g) {
    var W = 760, H = 170, c = D.setup(cv, W, H);
    var q = ht.QPilot, th = ht.ThetaPilot, ls = g.LStar;
    D.text(c, 'q-pilot and Θ-pilot of ' + (ht.copy || '') + ' ([IUTchIII] Def 3.8 (i))', W / 2, 16, { size: 12.5, bold: true });
    D.box(c, 30, 40, 300, 100, { fill: P.blueBg, stroke: null, r: 10 });
    D.text(c, 'q-pilot  {q̲_v}_{v ∈ V^bad}  in F⊩_Δ', 180, 58, { size: 12, serif: true, bold: true, color: P.blue });
    D.text(c, 'exponent 1', 180, 82, { size: 12, serif: true });
    D.text(c, 'log-volume  −|log q| = ' + fmt(q.logVolume, 4), 180, 112, { size: 12, mono: true });
    D.box(c, 430, 40, 300, 100, { fill: P.orangeBg, stroke: null, r: 10 });
    D.text(c, 'Θ-pilot  {q̲_v^{j²}}_{j=1..l*}  in F⊩_LGP', 580, 58, { size: 12, serif: true, bold: true, color: P.orange });
    D.text(c, 'exponents ' + th.exponents.join(', '), 580, 82, { size: 12, serif: true, maxWidth: 280 });
    D.text(c, 'naive log-volume  ' + fmt(th.logVolume, 4) + ' = −(1/l*)Σj² · |log q|', 580, 112, { size: 11, mono: true });
    D.arrow(c, 430, 90, 330, 90, { color: P.violet, width: 2, label: 'Θ-link: Θ-pilot ↦ q-pilot', labelSize: 10, labelOffset: -12, labelColor: P.violet });
    D.text(c, 'ratio of naive log-volumes = l(l+1)/12 = ' + fmt(th.logVolume / q.logVolume, 3) + '   (the "dilation" of the value groups)', W / 2, H - 14, { size: 10.5, color: P.ink2 });
  }

  /* ---------------------------------------------------------------- procession S±_{j+1} */
  function procession(cv, g, opt) {
    opt = opt || {};
    var ls = g.LStar, n = ls + 1, W = 760, H = 150, c = D.setup(cv, W, H);
    var cell = Math.min(80, (W - 60) / n), x0 = (W - cell * n) / 2, y = 44;
    D.text(c, 'procession Prc(D_T):  S±_1 ⊂ S±_2 ⊂ … ⊂ S±_{l±},   S±_{j+1} = {0, 1, …, j}   ([IUTchI] Prop 6.9)', W / 2, 16, { size: 12, bold: true });
    for (var j = 0; j < n; j++) {
      var x = x0 + j * cell, f = 1; for (var k = 2; k <= j + 1; k++) f *= k;
      D.box(c, x + 2, y, cell - 4, 62, { fill: j === opt.highlight ? P.orangeBg : P.tealBg, stroke: null, r: 6 });
      D.text(c, 'S±_' + (j + 1), x + cell / 2, y + 14, { size: 11, serif: true, bold: true, color: P.teal });
      D.text(c, '{0..' + j + '}', x + cell / 2, y + 32, { size: 10, mono: true });
      D.text(c, (j + 1) + '! = ' + f, x + cell / 2, y + 50, { size: 9.5, color: P.ink2, mono: true });
      if (j < n - 1) D.text(c, '⊂', x + cell - 2, y + 31, { size: 12, color: P.ink3 });
    }
    D.text(c, '(j+1)! permutations of each capsule = the (Ind1) indeterminacy; |Aut(Prc)| = Π (j+1)!', W / 2, H - 16, { size: 10.5, color: P.ink2 });
  }

  /* ---------------------------------------------------------------- multiradial representation + estimate */
  function multiradial(cv, g, text) {
    /* text = the "Multiradial representation" section lines from the walk view (we draw its table) */
    var rows = [];
    text.forEach(function (ln) { var m = ln.match(/^\s+(\d+)\s+(\d+)\s+(\d+)\s+([-\d.]+)\s+([-\d.]+)/); if (m) rows.push({ j: +m[1], size: +m[2], perms: +m[3], hull: +m[4], shift: +m[5] }); });
    var W = 760, H = 110 + rows.length * 24, c = D.setup(cv, W, H);
    D.text(c, 'multiradial representation R^LGP_{0,◦} of the Θ-pilot: per label j, the hull term (j+1)·log d^K and the Θ-shift −(j²/2l)·log q', W / 2, 16, { size: 12, bold: true, maxWidth: 740 });
    var maxH = Math.max.apply(null, rows.map(function (r) { return r.hull; }).concat([1])), maxS = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.shift); }).concat([0.1]));
    ['j', '|S±_{j+1}|', '(j+1)!', 'hull (j+1)·log d^K', 'Θ-shift −(j²/2l)·log q'].forEach(function (h, i) { D.text(c, h, [30, 90, 160, 330, 600][i], 44, { size: 10, color: P.ink3, align: i < 3 ? 'left' : 'center' }); });
    rows.forEach(function (r, i) {
      var y = 64 + i * 24;
      D.text(c, String(r.j), 30, y, { size: 11, mono: true, align: 'left' });
      D.text(c, String(r.size), 90, y, { size: 11, mono: true, align: 'left' });
      D.text(c, String(r.perms), 160, y, { size: 11, mono: true, align: 'left' });
      D.bar(c, 230, y - 7, 150, 14, r.hull / maxH, { fill: P.violet });
      D.text(c, fmt(r.hull, 3), 390, y, { size: 10, mono: true, align: 'left' });
      D.bar(c, 500, y - 7, 150, 14, -Math.abs(r.shift) / maxS, { fill: P.orange });
      D.text(c, fmt(r.shift, 3), 660, y, { size: 10, mono: true, align: 'left' });
    });
    var tail = text.filter(function (l) { return /heuristic|C_Θ|overall/.test(l); }).map(function (s) { return s.trim(); });
    tail.slice(0, 2).forEach(function (t, i) { D.text(c, t, W / 2, H - 30 + i * 16, { size: 10, color: P.ink2, maxWidth: 740 }); });
  }

  function estimate(cv, steps) {
    /* steps: [{label, value}] from EstimateLogVolume / StepEstimate; draw a ladder of numbers */
    var W = 760, H = 50 + steps.length * 26, c = D.setup(cv, W, H);
    var vals = steps.map(function (s) { return s.value; }).filter(function (v) { return isFinite(v) && Math.abs(v) < 1e6; });
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([1]));
    var bx = 430, bw = 300;
    function X(v) { return bx + (v - lo) / (hi - lo) * bw; }
    D.line(c, X(0), 30, X(0), H - 10, { color: P.ink3, dashed: true });
    D.text(c, '0', X(0), 22, { size: 9, color: P.ink3 });
    steps.forEach(function (s, i) {
      var y = 44 + i * 26;
      D.text(c, s.label, 20, y, { size: 10.5, align: 'left', maxWidth: 400 });
      if (isFinite(s.value) && Math.abs(s.value) < 1e6) {
        var x = X(s.value);
        D.line(c, X(0), y, x, y, { color: s.value >= 0 ? P.teal : P.red, width: 6 });
        D.dot(c, x, y, 4, s.value >= 0 ? P.teal : P.red);
        D.text(c, fmt(s.value, 3), x + (s.value >= 0 ? 8 : -8), y, { size: 10, mono: true, align: s.value >= 0 ? 'left' : 'right' });
      } else D.text(c, s.value == null ? '' : fmt(s.value), bx + bw, y, { size: 10, mono: true, align: 'right', color: P.ink3 });
    });
  }

  /* ---------------------------------------------------------------- [EssLgc] (Stp1)–(Stp8) on the lattice */
  function stpChain(cv, steps) {
    var W = 760, H = 320, c = D.setup(cv, W, H);
    /* a mini lattice: (0,0), (0,◦) column, (1,0), (1,◦) column with the mono-analytic ⊢ shadows */
    var X0 = 200, X1 = 560, Y0 = 200, Yc = 110;
    D.text(c, 'the chain of logical ∧ relations: (Stp1)–(Stp8) move the Θ-pilot through the H ([EssLgc] §3.10)', W / 2, 16, { size: 12, bold: true });
    D.arrow(c, X0, Y0 - 14, X0, Yc + 14, { color: P.blue, width: 2, label: 'log-links', labelSize: 9, labelOffset: 12 });
    D.arrow(c, X1, Y0 - 14, X1, Yc + 14, { color: P.blue, width: 2 });
    D.arrow(c, X0 + 14, Y0, X1 - 14, Y0, { color: P.orange, width: 2.5, label: 'Θ×μ_LGP-link', labelSize: 10, labelOffset: 14 });
    D.dot(c, X0, Y0, 10, P.ink); D.text(c, '(0,0)', X0 - 18, Y0, { size: 11, align: 'right', serif: true });
    D.dot(c, X1, Y0, 10, P.ink); D.text(c, '(1,0)', X1 + 18, Y0, { size: 11, align: 'left', serif: true });
    D.dot(c, X0, Yc, 10, '#fff', P.ink); D.text(c, '(0,◦)', X0 - 18, Yc, { size: 11, align: 'right', serif: true });
    D.dot(c, X1, Yc, 10, '#fff', P.ink); D.text(c, '(1,◦)', X1 + 18, Yc, { size: 11, align: 'left', serif: true });
    /* ⊢ shadows */
    D.box(c, X0 - 40, Yc + 150 - 70, 80, 26, { fill: P.tealBg, stroke: null, label: '(0,0)⊢', serif: true, size: 11 });
    D.box(c, X1 - 40, Yc + 150 - 70, 80, 26, { fill: P.tealBg, stroke: null, label: '(1,0)⊢', serif: true, size: 11 });
    D.box(c, X0 - 40, Yc - 60, 80, 26, { fill: P.tealBg, stroke: null, label: '(0,◦)⊢', serif: true, size: 11 });
    D.arrow(c, X0 + 42, Y0 + 30, X1 - 42, Y0 + 30, { color: P.teal, both: true, label: '⇔ (Stp3)', labelSize: 9, labelOffset: 12 });
    /* step arrows */
    var S = [
      ['Stp1', X0, Y0 - 20, X0, Yc + 20, P.violet, 20],
      ['Stp2', X0 - 10, Yc - 12, X0 - 10, Yc - 46, P.violet, -22],
      ['Stp3', X0 + 10, Yc - 46, X0 + 10, Y0 + 16, P.violet, 20],
      ['Stp4', X1, Y0 + 16, X1, Yc + 20, P.green, -22],
      ['Stp5-6', X1 + 60, Yc + 10, X1 + 60, Yc - 30, P.green, 30],
      ['Stp7', X1 - 10, Yc - 12, X1 - 10, Yc - 46, P.green, -22],
      ['Stp8', X1 + 10, Yc - 46, X1 + 10, 50, P.red, 20]
    ];
    S.forEach(function (s) { D.arrow(c, s[1], s[2], s[3], s[4], { color: s[5], width: 1.5, dashed: true, label: s[0], labelSize: 9, labelOffset: s[6] }); });
    D.text(c, '(Stp8): log-volumes → R:  −|log Θ| ≥ −|log q|', X1 + 10, 36, { size: 10.5, color: P.red });
    /* table of the chain */
    var y = 250;
    D.text(c, 'step', 30, y, { size: 9.5, color: P.ink3, align: 'left' }); D.text(c, 'from ⇝ to', 100, y, { size: 9.5, color: P.ink3, align: 'left' }); D.text(c, 'indeterminacy', 330, y, { size: 9.5, color: P.ink3, align: 'left' }); D.text(c, 'running log-volume bound', 480, y, { size: 9.5, color: P.ink3, align: 'left' });
    steps.slice(0, 8).forEach(function (s, i) {
      var yy = y + 14 + i * 8; if (i > 3) return;
    });
    var shown = steps.slice(0, 8);
    var cols = 2, rowsPer = 4;
    shown.forEach(function (s, i) {
      var col = Math.floor(i / rowsPer), row = i % rowsPer, xx = 30 + col * 370, yy = 266 + row * 13;
      D.text(c, s.id, xx, yy, { size: 9, align: 'left', mono: true, color: P.violet });
      D.text(c, s.from + ' ⇝ ' + s.to, xx + 60, yy, { size: 9, align: 'left', maxWidth: 180 });
      D.text(c, s.ind + '  ' + fmt(s.vol, 3), xx + 260, yy, { size: 9, align: 'left', mono: true, color: P.ink2 });
    });
  }

  /* ---------------------------------------------------------------- [EssLgc] Ex 2.4.5: ∧ versus ∨ */
  function logic(cv, A, B, eps, flavour) {
    var W = 760, H = 300, c = D.setup(cv, W, H);
    var isAnd = flavour === 'AND';
    D.text(c, 'the numerical model of [EssLgc] Ex 2.4.5:  Θ-link asserts  N = −2B ∧ N = −A;   multiradial representation asserts  N = −2A + ε ∧ N = −A', W / 2, 16, { size: 11.5, bold: true, maxWidth: 740 });
    /* number line of N */
    var x0 = 60, x1 = W - 60, lo = -4, hi = 1;
    function X(v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }
    var y1 = 90, y2 = 170;
    [y1, y2].forEach(function (y, k) {
      D.line(c, x0, y, x1, y, { color: P.line, width: 2 });
      for (var v = lo; v <= hi; v++) { D.line(c, X(v), y - 4, X(v), y + 4, { color: P.ink3 }); D.text(c, String(v), X(v), y + 14, { size: 9, color: P.ink3, mono: true }); }
    });
    D.text(c, 'Θ-link', 30, y1, { size: 11, align: 'left', bold: true, color: P.orange });
    D.text(c, 'multiradial rep.', 30, y2 - 20, { size: 11, align: 'left', bold: true, color: P.blue, maxWidth: 80 });
    function mark(y, v, label, color, up) {
      var x = Math.max(x0, Math.min(x1, X(v)));
      D.dot(c, x, y, 7, color); D.text(c, label + ' = ' + fmt(v, 2), x, y + (up ? -16 : 28), { size: 10, color: color, serif: true });
    }
    mark(y1, -2 * B, 'N = −2B', P.orange, true); mark(y1, -A, 'N = −A', P.red, false);
    mark(y2, -2 * A + eps, 'N = −2A + ε', P.blue, true); mark(y2, -A, 'N = −A', P.red, false);
    var consistent = Math.abs((-2 * A + eps) - (-A)) < 1e-9;
    var verdict = isAnd ? (consistent ? 'the ∧-system is solvable:  −2A + ε = −A  ⇒  A = ε ≤ 1   (the conclusion of IUT)' : 'the ∧-system has NO solution for these A, ε: adjust A = ε to make both relations hold at once')
      : 'the ∨-version (' + flavour + ') asserts only that one disjunct holds — nothing follows';
    D.box(c, 40, 215, W - 80, 60, { fill: isAnd && consistent ? P.greenBg : isAnd ? P.redBg : P.yellowBg, stroke: null, label: verdict, size: 11.5, labelColor: isAnd && consistent ? P.green : isAnd ? P.red : P.yellow, sub: 'A = ' + fmt(A, 2) + ', B = ' + fmt(B, 2) + ', ε = ' + fmt(eps, 2) + '   ("∧" = both relations hold for the same N; "∨" = at least one does)' });
  }

  /* ---------------------------------------------------------------- the Gaussian integral in polar coordinates */
  function gaussian(cv, step) {
    var W = 760, H = 300, c = D.setup(cv, W, H);
    var cx = 200, cy = 160, R = 110;
    D.text(c, '∫ e^{−x²} dx = √π  via a second copy, the plane, polar coordinates and the slit  ([Alien] §1, Steps 1–12)', W / 2, 16, { size: 12, bold: true, maxWidth: 740 });
    /* heat map of e^{-r^2} */
    for (var r = R; r > 0; r -= 6) {
      var a = Math.exp(-(r / R * 2.2) * (r / R * 2.2));
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = 'rgba(37,99,235,' + (0.08 + a * 0.5) + ')'; c.fill();
    }
    D.line(c, cx - R - 20, cy, cx + R + 20, cy, { color: P.ink3 }); D.line(c, cx, cy - R - 20, cx, cy + R + 20, { color: P.ink3 });
    D.text(c, 'x (first copy)', cx + R + 24, cy, { size: 10, align: 'left', color: P.ink2 });
    D.text(c, 'y (second, alien copy)', cx, cy - R - 30, { size: 10, color: P.ink2 });
    if (step >= 8) { /* the slit */
      D.line(c, cx - R - 20, cy + 1, cx, cy + 1, { color: P.red, width: 3 });
      D.text(c, 'slit R≤0 × {0}: the "error" that makes polar coordinates possible', cx - 60, cy + 18, { size: 9.5, color: P.red, maxWidth: 200 });
    }
    if (step >= 8) { /* polar ray */
      var ang = -0.7; D.arrow(c, cx, cy, cx + Math.cos(ang) * R * 0.8, cy + Math.sin(ang) * R * 0.8, { color: P.orange, width: 2, label: 'r (radial)', labelSize: 10 });
      c.beginPath(); c.arc(cx, cy, 40, 0, ang, true); c.strokeStyle = P.green; c.lineWidth = 2; c.stroke();
      D.text(c, 'θ (angular)', cx + 58, cy - 14, { size: 10, color: P.green, align: 'left' });
    }
    /* right: the dictionary of the current step */
    var rows = [
      [3, 'I² = ∫∫ e^{−x²−y²} dx dy', 'two mutually alien copies of the ring theory'],
      [4, 'the plane R²', 'the log-theta-lattice'],
      [5, 'the measure dx dy', 'log-volumes'],
      [7, 'dilations / rotations', 'Θ-link dilation q ↦ q^{j²} / log-link rotation'],
      [8, 'polar coordinates, the slit', 'the coordinates (n,m); the indeterminacies'],
      [9, 'radial ⊥ angular decoupling', 'multiradiality'],
      [10, '∫₀^∞ e^{−r²} 2r dr = 1', 'the multiradial representation of the Θ-pilot'],
      [11, '∫₀^{2π} ½ dθ = π', 'the holomorphic hull / the constants'],
      [12, '√π with the error from the slit', '−|log Θ| ≥ −|log q| with Ind1–3 as error']
    ];
    rows.forEach(function (r, i) {
      var y = 48 + i * 27, on = step >= r[0];
      D.text(c, 'Step ' + r[0], 380, y, { size: 10, align: 'left', mono: true, color: on ? P.violet : P.ink3 });
      D.text(c, r[1], 440, y, { size: 10.5, align: 'left', serif: true, color: on ? P.ink : P.ink3, maxWidth: 150 });
      D.text(c, '↔ ' + r[2], 600, y, { size: 10, align: 'left', color: on ? P.ink2 : P.ink3, maxWidth: 150 });
    });
  }

  /* ---------------------------------------------------------------- mono-anabelian transport ([Alien] Fig 2.1) */
  function transport(cv, stage) {
    var W = 760, H = 250, c = D.setup(cv, W, H);
    D.text(c, 'mono-anabelian transport ([Alien] §2.7, Fig 2.1): Frobenius-like → (Kummer-detachment) → étale-like → (étale-transport) → étale-like → (re-attach) → Frobenius-like', W / 2, 16, { size: 11, bold: true, maxWidth: 740 });
    var boxes = [
      ['Frobenius-like\ninput at (0,0)', 'Θ-pilot, positive mass', P.orangeBg, P.orange],
      ['étale-like\n(0,◦) data', 'reconstructed from Π_v / G_v, mass 0', P.blueBg, P.blue],
      ['étale-like\n(1,◦) data', 'the coric D⊢ carried across', P.blueBg, P.blue],
      ['Frobenius-like\noutput at (1,0)', 'q-pilot, positive mass', P.orangeBg, P.orange]
    ];
    var bw = 150, gapx = (W - 40 - 4 * bw) / 3, y = 60;
    boxes.forEach(function (b, i) {
      var x = 20 + i * (bw + gapx), on = stage >= i;
      D.box(c, x, y, bw, 70, { fill: on ? b[2] : '#fff', stroke: on ? null : P.line, label: b[0].split('\n')[0], sub: b[0].split('\n')[1] + ' — ' + b[1], size: 12, labelColor: on ? b[3] : P.ink3, bold: true });
      if (i < 3) {
        var lbl = ['Kummer-detachment (Ind2, Ind3)', 'étale-transport across the Θ-link (Ind1)', 'Kummer-detachment⁻¹: re-attach'][i];
        D.arrow(c, x + bw + 4, y + 35, x + bw + gapx - 4, y + 35, { color: stage > i ? P.violet : P.line, width: 2, label: lbl, labelSize: 9, labelOffset: i === 1 ? 16 : -16, labelColor: stage > i ? P.violet : P.ink3 });
      }
    });
    D.box(c, 150, 160, 460, 56, { fill: P.greyBg, stroke: null, label: 'the comparison of input and output holds up to (Ind1), (Ind2), (Ind3)', sub: 'mass is carried only by Frobenius-like objects; étale-like objects are isomorphism classes ("zero mass")', size: 11.5 });
  }

  /* ---------------------------------------------------------------- étale picture */
  function etalePicture(cv, w) {
    var W = 760, H = 300, c = D.setup(cv, W, H), cx = W / 2, cy = H / 2 + 10, R = 105;
    D.text(c, 'the étale-picture: every Hodge theater built so far is a spoke around the bi-coric D⊢-prime-strip ([IUTchIII] Cor 3.12; [IUTchI] Cor 6.10)', cx, 16, { size: 11.5, bold: true, maxWidth: 740 });
    var hts = w.HodgeTheaters, n = hts.length;
    hts.forEach(function (h, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = cx + Math.cos(a) * R * 1.7, y = cy + Math.sin(a) * R * 0.85;
      D.line(c, cx, cy, x, y, { color: P.line, width: 1.5 });
      D.box(c, x - 48, y - 16, 96, 32, { fill: h.n === 0 ? P.blueBg : P.orangeBg, stroke: null, label: '{' + h.n + ',' + h.m + '}D-HT', sub: '#' + h.universe, size: 11, serif: true });
    });
    D.box(c, cx - 70, cy - 28, 140, 56, { fill: P.greenBg, stroke: P.green, label: 'D⊢ = {G_v}', sub: 'bi-coric core + I⊢_v', serif: true, size: 15 });
    D.text(c, 'the spokes may be permuted arbitrarily; Π_v (holomorphic) is not part of the core', cx, H - 12, { size: 10, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- species graph */
  function species(cv, text) {
    var W = 760, lines = text.split('\n');
    var sp = [], mu = [], mode = 0;
    lines.forEach(function (l) {
      if (/^\s+species \(C struct\)/.test(l)) { mode = 1; return; }
      if (/^\s+mutation \(C function\)/.test(l)) { mode = 2; return; }
      if (/^\s+mutation-history/.test(l)) { mode = 0; return; }
      var m;
      if (mode === 1 && (m = l.match(/^\s+([A-Za-z]+)\s{2,}(.+?)\s{2,}(\[.*)$/))) sp.push({ id: m[1], notation: m[2].trim() });
      if (mode === 2 && (m = l.match(/^\s+([A-Za-z]+)\s+(.+?)\s{2,}([A-Za-z]+)\s+→\s+([A-Za-z]+)\s+(yes|no)/))) mu.push({ id: m[1], notation: m[2].trim(), dom: m[3], cod: m[4], core: m[5] === 'yes' });
    });
    var H = 60 + sp.length * 22, c = D.setup(cv, W, H);
    D.text(c, 'species (C structs) and mutations (C functions) — [IUTchIV] §3; the lattice is a mutation-history', W / 2, 16, { size: 12, bold: true });
    var pos = {};
    sp.forEach(function (s, i) { var y = 44 + i * 22; pos[s.id] = y; D.text(c, s.notation, 20, y, { size: 10.5, align: 'left', serif: true }); D.text(c, s.id, 250, y, { size: 9.5, align: 'left', mono: true, color: P.blue }); });
    mu.forEach(function (m, i) {
      var y1 = pos[m.dom], y2 = pos[m.cod]; if (y1 == null || y2 == null) return;
      var x = 520 + (i % 6) * 36;
      if (y1 === y2) { c.beginPath(); c.arc(x, y1, 8, 0, Math.PI * 2); c.strokeStyle = m.core ? P.green : P.orange; c.lineWidth = 1.5; c.stroke(); }
      else D.arrow(c, x, y1, x, y2, { color: m.core ? P.green : P.orange, width: 1.5 });
      D.text(c, m.notation, x, Math.min(y1, y2) - 9, { size: 7.5, color: m.core ? P.green : P.orange, maxWidth: 60 });
    });
    D.text(c, 'green = core (observable all of whose arrows are isomorphisms), orange = genuine mutation', W / 2, H - 10, { size: 9.5, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- formal sums of labels */
  function formalSums(cv, g) {
    var l = g.l, ls = g.LStar, W = 760, H = 230, c = D.setup(cv, W, H);
    D.text(c, 'formal sums of labels with total mass 1 ([Alien] §3.6):  [0],  [|j|] = ½([j] + [−j]),  [⊞] = (1/l) Σ_t [t],  [>] = (1/l*) Σ_j [|j|]', W / 2, 16, { size: 11.5, bold: true, maxWidth: 740 });
    var x0 = 150, x1 = W - 40, step = (x1 - x0) / (l - 1);
    var rows = [
      { name: '[0]', f: function (t) { return t === 0 ? 1 : 0; }, color: P.violet },
      { name: '[|2|]', f: function (t) { return Math.abs(t) === 2 ? 0.5 : 0; }, color: P.teal },
      { name: '[⊞]', f: function (t) { return 1 / l; }, color: P.orange },
      { name: '[>]', f: function (t) { return t === 0 ? 0 : 1 / (2 * ls); }, color: P.green }
    ];
    rows.forEach(function (r, i) {
      var y = 60 + i * 42;
      D.text(c, r.name, 60, y, { size: 14, serif: true, color: r.color });
      D.line(c, x0 - 10, y, x1 + 10, y, { color: P.line });
      for (var t = -ls; t <= ls; t++) {
        var v = r.f(t), x = x0 + (t + ls) * step;
        if (v > 0) { D.bar(c, x - 9, y - 4 - v * 60, 18, v * 60, 1, { fill: r.color, track: 'rgba(0,0,0,0)' }); D.text(c, v === 1 ? '1' : v === 0.5 ? '½' : '1/' + Math.round(1 / v), x, y - 10 - v * 60, { size: 8, color: r.color }); }
        if (i === 3) D.text(c, String(t), x, y + 12, { size: 9, mono: true, color: P.ink3 });
      }
    });
  }

  /* ---------------------------------------------------------------- process flow: inputs → process → outputs */
  function procFlow(cv, p) {
    var W = 760, H = 90, c = D.setup(cv, W, H);
    var ins = p.inputs.split(',').map(function (s) { return s.trim(); }).filter(Boolean), outs = p.outputs.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var y = 45;
    var pw = Math.min(260, D.measure(c, p.id, 13, { mono: true, bold: true }) + 30);
    var pb = D.box(c, W / 2 - pw / 2, y - 20, pw, 40, { fill: P.blueBg, stroke: null, label: p.id, mono: true, bold: true, size: 13, labelColor: P.blue });
    function chips(list, side) {
      var tot = list.length, h = 24, gap = 6, startY = y - ((tot - 1) * (h + gap)) / 2;
      list.forEach(function (s, i) {
        var w = Math.min(230, D.measure(c, s, 11) + 18), x = side < 0 ? pb.x - 40 - w : pb.right + 40, yy = startY + i * (h + gap);
        D.box(c, x, yy - h / 2, w, h, { fill: side < 0 ? P.orangeBg : P.greenBg, stroke: null, label: s, size: 11, labelColor: side < 0 ? P.orange : P.green, r: 12 });
        if (side < 0) D.arrow(c, x + w + 4, yy, pb.x - 4, y, { color: P.ink3, width: 1 }); else D.arrow(c, pb.right + 4, y, x - 4, yy, { color: P.ink3, width: 1 });
      });
    }
    chips(ins.slice(0, 3), -1); chips(outs.slice(0, 3), 1);
    if (ins.length > 3 || outs.length > 3) D.text(c, '…', W / 2, H - 6, { size: 10, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- the indeterminacies */
  function indeterminacies(cv, g) {
    var W = 760, H = 150, c = D.setup(cv, W, H);
    var items = [
      ['(Ind1)', 'automorphisms of processions of D⊢-prime-strips', 'permutations of S±_{j+1} — (j+1)! each — and Aut(G_v)', P.violet, P.violetBg],
      ['(Ind2)', 'Ism-indeterminacies on O×μ', 'the ×μ-Kummer structure is an Ism-orbit (Kummer-detachment)', P.orange, P.orangeBg],
      ['(Ind3)', 'upper semi-compatibility', 'log-Kummer correspondence: only an UPPER bound on the region', P.teal, P.tealBg]
    ];
    items.forEach(function (it, i) {
      var x = 20 + i * 245;
      D.box(c, x, 30, 230, 100, { fill: it[4], stroke: null, r: 10 });
      D.text(c, it[0], x + 115, 50, { size: 15, bold: true, color: it[3], serif: true });
      D.text(c, it[1], x + 115, 76, { size: 11, bold: true, maxWidth: 210 });
      D.text(c, it[2], x + 115, 108, { size: 10, color: P.ink2, maxWidth: 210 });
    });
    D.text(c, 'the multiradial representation is well-defined only up to these three ([IUTchIII] Thm 3.11; [Alien] §3.7 (i); [EssLgc] §3.10 (Stp1)–(Stp3))', W / 2, H - 8, { size: 9.5, color: P.ink3 });
  }

  /* ---------------------------------------------------------------- the capsule / bridges torsor chart */
  function bridges(cv, lines) {
    /* lines of BuildBridges: "    ThetaBridge     FJ → FGt  (6 members)  isomorphisms: … (N)  ok" */
    var rows = [];
    lines.forEach(function (l) { var m = l.match(/^\s+(\w+)\s+(\w+) → (\w+)\s+\((\d+) members\)\s+isomorphisms: (.+?) \((\d+)\)\s+(ok|missing)/); if (m) rows.push({ id: m[1], dom: m[2], cod: m[3], n: +m[4], group: m[5], order: +m[6], ok: m[7] === 'ok' }); });
    var W = 760, H = 60 + rows.length * 46, c = D.setup(cv, W, H);
    D.text(c, 'the four bridges of a Θ±ell NF-Hodge theater and their isomorphism torsors', W / 2, 16, { size: 12, bold: true });
    rows.forEach(function (r, i) {
      var y = 48 + i * 46, col = /Pm|Ell/.test(r.id) ? P.blue : P.green, bg = /Pm|Ell/.test(r.id) ? P.blueBg : P.greenBg;
      D.box(c, 20, y, 120, 32, { fill: bg, stroke: null, label: r.dom + ' (' + r.n + ')', sub: 'capsule', size: 11, mono: true });
      D.arrow(c, 146, y + 16, 300, y + 16, { color: col, width: 2, label: r.id, labelSize: 10, labelOffset: -11, labelColor: col });
      D.box(c, 306, y, 110, 32, { fill: bg, stroke: null, label: r.cod, size: 11, mono: true });
      D.text(c, 'isomorphisms: a torsor over ' + r.group, 440, y + 16, { size: 10.5, align: 'left', serif: true, maxWidth: 220 });
      D.pill(c, 710, y + 16, 'order ' + r.order, { fill: P.greyBg, color: P.ink, size: 10, mono: true });
    });
  }

  /* ---------------------------------------------------------------- numeric summary tiles of Cor 3.12 / Thm 1.10 */
  function inequality(cv, text) {
    /* text: lines of EstimateLogVolume */
    var vals = {};
    text.forEach(function (l) { var m = l.match(/^\s+\((\d)\) (.+?)\s{2,}([-\d.e+]+)\s+\[/); if (m) vals[m[1]] = { label: m[2].trim(), value: parseFloat(m[3]) }; });
    var W = 760, H = 200, c = D.setup(cv, W, H);
    var q = vals[0] ? vals[0].value : 0, th = vals[5] ? vals[5].value : 0, hull = vals[4] ? vals[4].value : 0, naive = vals[1] ? vals[1].value : 0;
    D.text(c, '[IUTchIII] Cor 3.12:   −|log Θ|  ≥  −|log q|     (procession-normalized log-volumes)', W / 2, 16, { size: 12.5, bold: true });
    var lo = Math.min(naive, q, 0) - 1, hi = Math.max(th, hull, 1) + 1, x0 = 60, x1 = W - 60;
    function X(v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }
    var y = 90;
    D.line(c, x0, y, x1, y, { color: P.line, width: 2 });
    D.line(c, X(0), y - 30, X(0), y + 30, { color: P.ink3, dashed: true }); D.text(c, '0', X(0), y + 42, { size: 9, color: P.ink3 });
    D.dot(c, X(naive), y, 6, P.orange); D.text(c, 'naive Θ-pilot ' + fmt(naive, 2), X(naive), y - 18, { size: 10, color: P.orange });
    D.dot(c, X(q), y, 7, P.blue); D.text(c, '−|log q| = ' + fmt(q, 3), X(q), y + 22, { size: 10.5, color: P.blue });
    D.line(c, X(q), y, X(th), y, { color: P.green, width: 8 });
    D.dot(c, X(th), y, 7, P.green); D.text(c, '−|log Θ| ≤ ' + fmt(th, 2) + ' (upper bound)', X(th), y - 18, { size: 10.5, color: P.green });
    D.dot(c, X(hull), y, 5, P.violet); D.text(c, 'hull ' + fmt(hull, 2), X(hull), y + 22, { size: 10, color: P.violet });
    D.text(c, 'the Θ-pilot, once the indeterminacies are taken into account, lands in a region that contains the q-pilot: the region\'s log-volume dominates −|log q|', W / 2, 140, { size: 10.5, color: P.ink2, maxWidth: 700 });
    var ct = vals[6];
    if (ct) D.text(c, 'C_Θ = ' + ct.value.toExponential(3) + '  ≥ −1  ⇒  (1/6) log q ≤ (1 + 20 d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod·l + η_prm)   ([IUTchIV] Thm 1.10)', W / 2, 170, { size: 10, color: P.ink2, maxWidth: 720 });
  }

  root.DIAG = {
    thetaData: thetaData, labels: labels, primeStrip: primeStrip, ladder: ladder, hodgeTheater: hodgeTheater, lattice: lattice, thetaLink: thetaLink,
    logShells: logShells, pilots: pilots, procession: procession, multiradial: multiradial, estimate: estimate, stpChain: stpChain, logic: logic,
    gaussian: gaussian, transport: transport, etalePicture: etalePicture, species: species, formalSums: formalSums, procFlow: procFlow,
    indeterminacies: indeterminacies, bridges: bridges, inequality: inequality
  };
})(typeof window !== 'undefined' ? window : globalThis);
