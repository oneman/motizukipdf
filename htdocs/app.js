/*
 * app.js — the Part III explorer (HTML5 canvas) plus the glue that renders the
 * Part I gallery (diagrams.js) and the Part II processes (processes.js) from
 * the same state: one Lattice (iut.js) plus a focus (n,m).
 *
 * Explorer tabs:  data · lattice · hodge theater · alien copies · multiradial · species · identifiers
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var state = { lat: null, horizontal: 'ThetaUnitsModTorsLGPTorsorLink', seed: 2, example: 2, tab: 'lattice', hoverCell: null };
  var IDENT_SET = {}; IUT_IDENTS.IDENTS.forEach(function (x) { IDENT_SET[x.id.toLowerCase()] = x; });

  var COLORS = {
    bg: '#ffffff', grid: '#c9d0de', text: '#1c2130', dim: '#5d6578', dag: '#d9a300', ddag: '#0e9aa7', bullet: '#3a4356',
    log: '#1f9d55', theta: '#e4572e', etale: '#2f6fde', frob: '#f29e1f', shared: '#1f9d55', alien: '#d7263d', hull: '#7b4fd1', focus: '#1c2130',
    etaleFill: '#e4edff', frobFill: '#fff1dc', dagFill: '#fff6cc', ddagFill: '#dcf5f7', softFill: '#f3f5fa', thetaFill: '#fde3dc', panelFill: '#f7f8fc'
  };

  function fit(canvas) {
    var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 800, h = canvas.clientHeight || 500;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  function text(ctx, s, x, y, opt) {
    opt = opt || {}; ctx.font = (opt.bold ? 'bold ' : '') + (opt.size || 13) + 'px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = opt.color || COLORS.text; ctx.textAlign = opt.align || 'left'; ctx.textBaseline = opt.base || 'middle'; ctx.fillText(s, x, y);
  }
  function arrow(ctx, x1, y1, x2, y2, color, width, label) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1), s = 8;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4)); ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    if (label) text(ctx, label, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 8, { color: color, size: 11 });
  }
  function box(ctx, x, y, w, h, stroke, fill, r) {
    r = r || 6; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function fmt(x, k) { return (typeof x === 'number' && isFinite(x)) ? x.toFixed(k === undefined ? 4 : k) : String(x); }

  // ------------------------------------------------------------ data tab (DOM)
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderData() {
    var d = state.lat.data, r = IUT.validateData(d);
    var focus = state.lat.peek(state.lat.focus[0], state.lat.focus[1]);
    if (focus) IUT.validateHodgeTheater(focus, d, r);
    IUT.validateLattice(state.lat, r);
    var h = '<h3>Initial Θ-data <span class="ref">[IUTchI] Def 3.1 — <code>InitialThetaData</code></span></h3>';
    h += '<table class="kv"><tr><th>name</th><td>' + escapeHtml(d.name) + '</td></tr><tr><th>curve</th><td>' + escapeHtml(d.curve) + '</td></tr>';
    h += '<tr><th>fields</th><td>F_mod ⊆ F ⊆ K = F(E[l]) ⊆ F̄ &nbsp; [F_mod:Q] = ' + d.Fmod.degree + ', [F:Q] ≤ ' + d.F.degreeBound + ', [K:Q] ≤ ' + d.K.degreeBound + '</td></tr>';
    h += '<tr><th>l</th><td>' + d.l + ' &nbsp; (l* = ' + d.LStar + ', l± = ' + d.LPm + ') &nbsp; ε̲ = ' + d.EpsilonUnder + '</td></tr>';
    h += '<tr><th>log(q)</th><td>' + fmt(IUT.logQ(d)) + ' &nbsp; |log(q)| = log(q)/2l = ' + fmt(IUT.logQ(d) / (2 * d.l)) + ' &nbsp; ht_E = log(q)/6 = ' + fmt(IUT.logQ(d) / 6) + '</td></tr>';
    h += '<tr><th>log(f), log(d)</th><td>log(f) = ' + fmt(IUT.logF(d)) + ' &nbsp; log(d^Ftpd) = ' + fmt(d.F.logDifferentTpd) + ' &nbsp; log(d^K) ≈ ' + fmt(d.K.logDifferentEstimate) + '</td></tr>';
    h += '<tr><th>labels</th><td>F_l = {' + (-d.LStar) + '..' + d.LStar + '} (<code>Fl</code>), |F_l| = {0..' + d.LStar + '} (<code>FlAbs</code>), F_l^* = {1..' + d.LStar + '} (<code>FlStar</code>); symmetries <code>FlSemiPm</code> (additive), <code>FlStarSym</code> (multiplicative)</td></tr></table>';
    h += '<h4>V ≅ V_mod <span class="ref"><code>VSet</code>, <code>VBadMod</code></span></h4><table class="grid"><tr><th>name</th><th>kind</th><th>p</th><th>e/f (F_mod)</th><th>e/f (K)</th><th>reduction</th><th>ord(q_v)</th><th>V^bad_mod</th></tr>';
    d.VSet.forEach(function (v) { h += '<tr><td>' + v.name + '</td><td>' + v.kind + '</td><td>' + (v.p || '∞') + '</td><td>' + v.eMod + '/' + v.fMod + '</td><td>' + v.eK + '/' + v.fK + '</td><td>' + v.reduction + '</td><td>' + v.ordQ + '</td><td>' + (v.inVBadMod ? '✓' : '') + '</td></tr>'; });
    h += '</table><h4>Hypotheses asserted (not machine-checkable from numeric data)</h4><ul class="hyp">';
    Object.keys(d.hypotheses).forEach(function (k) { h += '<li><code>' + k + '</code>: ' + (d.hypotheses[k] ? '✓ asserted' : '✗') + '</li>'; });
    h += '</ul><h4>Validation report (' + r.errors + ' errors, ' + r.warnings + ' warnings, ' + r.issues.length + ' checks)</h4><table class="grid report">';
    r.issues.forEach(function (i) { h += '<tr class="sev-' + i.severity + '"><td>' + i.severity + '</td><td><code>' + i.condition + '</code></td><td>' + escapeHtml(i.msg) + '</td><td class="ref">' + escapeHtml(i.ref) + '</td></tr>'; });
    h += '</table>';
    $('data-view').innerHTML = h;
    $('json-view').textContent = JSON.stringify(d, null, 1);
  }

  // ------------------------------------------------------------ lattice canvas
  var latticeGeom = null;
  function drawLattice() {
    var c = fit($('c-lattice')), ctx = c.ctx, lat = state.lat;
    var vs = lat.vertices(); if (!vs.length) return;
    var nmin = Math.min.apply(null, vs.map(function (v) { return v.n; })) - 1, nmax = Math.max.apply(null, vs.map(function (v) { return v.n; })) + 1;
    var mmin = Math.min.apply(null, vs.map(function (v) { return v.m; })) - 1, mmax = Math.max.apply(null, vs.map(function (v) { return v.m; })) + 1;
    nmin = Math.max(nmin, -IUT.LAT.NOFF); nmax = Math.min(nmax, IUT.LAT.NOFF); mmin = Math.max(mmin, -IUT.LAT.MOFF); mmax = Math.min(mmax, IUT.LAT.MOFF);
    var cols = nmax - nmin + 1, rows = mmax - mmin + 1, left = 70, top = 40, cw = Math.min(140, (c.w - left - 20) / cols), rh = Math.min(70, (c.h - top - 60) / rows);
    function X(n) { return left + (n - nmin + 0.5) * cw; } function Y(m) { return top + (mmax - m + 0.5) * rh; }
    latticeGeom = { X: X, Y: Y, nmin: nmin, nmax: nmax, mmin: mmin, mmax: mmax, cw: cw, rh: rh, left: left, top: top };
    text(ctx, 'log-theta-lattice   ' + IUT.LINKS[lat.horizontal].notation + ' horizontal  ·  log-link vertical     [IUTchIII] Def 1.4, Def 3.8 (iii)', 12, 16, { color: COLORS.dim, size: 12 });
    for (var n = nmin; n <= nmax; n++) text(ctx, 'n=' + n, X(n), top + 4, { color: COLORS.dim, size: 11, align: 'center' });
    for (var m = mmin; m <= mmax; m++) text(ctx, 'm=' + m, left - 36, Y(m), { color: COLORS.dim, size: 11, align: 'center' });
    // faint grid of possible positions
    for (n = nmin; n <= nmax; n++) for (m = mmin; m <= mmax; m++) { ctx.fillStyle = COLORS.grid; ctx.beginPath(); ctx.arc(X(n), Y(m), 3, 0, 7); ctx.fill(); }
    lat.links.forEach(function (L) {
      var x1 = X(L.dom[0]), y1 = Y(L.dom[1]), x2 = X(L.cod[0]), y2 = Y(L.cod[1]);
      if (L.species === 'LogLink') { arrow(ctx, x1, y1 - 14, x2, y2 + 14, COLORS.log, 2); text(ctx, 'log', x1 - 8, (y1 + y2) / 2, { color: COLORS.log, size: 10, align: 'right' }); }
      else arrow(ctx, x1 + 16, y1, x2 - 16, y2, COLORS.theta, 2.5, 'Θ');
    });
    vs.forEach(function (ht) {
      var x = X(ht.n), y = Y(ht.m), isFocus = ht.n === lat.focus[0] && ht.m === lat.focus[1];
      var col = ht.copy === 'Dag' ? COLORS.dag : ht.copy === 'Ddag' ? COLORS.ddag : COLORS.bullet;
      if (isFocus) { ctx.strokeStyle = COLORS.focus; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
      text(ctx, ht.copy === 'Dag' ? '†' : ht.copy === 'Ddag' ? '‡' : '•', x, y + 1, { color: '#fff', bold: true, size: 13, align: 'center' });
      text(ctx, '#' + ht.universe + (ht.hasIncomingLog ? ' I' : ''), x + 15, y + 12, { color: COLORS.dim, size: 10 });
    });
    if (state.hoverCell) { var hc = state.hoverCell; ctx.strokeStyle = COLORS.dim; ctx.setLineDash([3, 3]); ctx.strokeRect(X(hc[0]) - cw / 2 + 4, Y(hc[1]) - rh / 2 + 4, cw - 8, rh - 8); ctx.setLineDash([]); }
    text(ctx, '• Θ±ell NF-Hodge theater (own universe)   † (0,0)   ‡ (1,0)   I = carries log-shells   click = focus · l / t / H keys apply links', 12, c.h - 30, { color: COLORS.dim, size: 11 });
    text(ctx, 'green ↑ log-link: D-prime-strips shared (vertically coric).  red → Θ-link: F⊢×μ shared (horizontally coric), Π_v alien, value groups dilated by l(l+1)/12 = ' + fmt(lat.data.l * (lat.data.l + 1) / 12, 3) + '.  The diagram does not commute.', 12, c.h - 12, { color: COLORS.dim, size: 11 });
  }
  function latticeHit(ev) {
    if (!latticeGeom) return null; var g = latticeGeom, rect = $('c-lattice').getBoundingClientRect(), x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    var n = Math.round((x - g.left) / g.cw - 0.5 + g.nmin), m = Math.round(g.mmax - ((y - g.top) / g.rh - 0.5));
    return IUT.Lattice.inRange(n, m) && n >= g.nmin && n <= g.nmax && m >= g.mmin && m <= g.mmax ? [n, m] : null;
  }

  // ------------------------------------------------------------ Hodge theater canvas (Fig 3.8 of [Alien])
  function drawHodgeTheater() {
    var c = fit($('c-ht')), ctx = c.ctx, lat = state.lat, d = lat.data, ht = lat.peek(lat.focus[0], lat.focus[1]);
    if (!ht) { text(ctx, 'no Hodge theater at (' + lat.focus + ') — click a vertex or apply a link', 20, 30); return; }
    var title = (ht.copy === 'Dag' ? '†' : ht.copy === 'Ddag' ? '‡' : '{' + ht.n + ',' + ht.m + '}') + 'HT';
    text(ctx, 'Θ±ell NF-Hodge theater ' + title + '   universe #' + ht.universe + '   log-iterate ' + ht.logIterate + '      [IUTchI] Def 6.13; [Alien] §3.3 (v) Fig 3.8      <ThetaPmEllNFHodgeTheater>', 12, 16, { size: 12, color: COLORS.dim });
    var midX = c.w / 2, leftW = c.w * 0.55, cap = ht.ThetaPmEllHodgeTheater.capsuleFT, capJ = ht.ThetaNFHodgeTheater.capsuleFJ;
    // left: Θ±ell-HT
    box(ctx, 14, 34, leftW - 24, c.h - 150, COLORS.grid, COLORS.panelFill);
    text(ctx, 'Θ±ell-Hodge theater  <ThetaPmEllHodgeTheater>', 24, 48, { size: 12, color: COLORS.dag });
    text(ctx, 'symmetry F_l^{⋊±} <FlSemiPm>: additive / geometric, conjugate synchronization', 24, 63, { size: 10, color: COLORS.dim });
    var tw = Math.min(34, (leftW - 60) / cap.length), ty = c.h / 2 - 20, tx0 = 30;
    cap.forEach(function (m, i) {
      var x = tx0 + i * tw, zero = m.t === 0;
      box(ctx, x, ty, tw - 4, 34, zero ? COLORS.theta : COLORS.frob, zero ? COLORS.thetaFill : COLORS.frobFill, 4);
      text(ctx, (m.t > 0 ? '+' : '') + m.t, x + (tw - 4) / 2, ty + 12, { size: 11, align: 'center' });
      text(ctx, '#' + (m.basepoint % 1000), x + (tw - 4) / 2, ty + 25, { size: 8, align: 'center', color: COLORS.dim });
    });
    text(ctx, 'capsule F_T,  t ∈ F_l  (' + cap.length + ' F-prime-strips, distinct basepoints)  <FT> <LabelT>', 30, ty - 14, { size: 11, color: COLORS.dim });
    // bridges
    var cx = tx0 + (cap.length * tw) / 2;
    box(ctx, cx - 115, 80, 230, 40, COLORS.etale, COLORS.etaleFill);
    text(ctx, 'D_⊚±  (Π_{X_K})  <DCircDotPm>', cx, 94, { size: 11, align: 'center', color: COLORS.etale });
    text(ctx, 'D-prime-strip, étale-like', cx, 110, { size: 10, align: 'center', color: COLORS.dim });
    arrow(ctx, cx, ty - 22, cx, 124, COLORS.etale, 1.5, 'Θell-bridge <ThetaEllBridge>');
    box(ctx, cx - 90, ty + 90, 180, 40, COLORS.frob, COLORS.frobFill);
    text(ctx, 'F_⊞  <FBoxPlus>', cx, ty + 104, { size: 11, align: 'center', color: COLORS.frob });
    text(ctx, 'F-prime-strip, Frobenius-like', cx, ty + 120, { size: 10, align: 'center', color: COLORS.dim });
    arrow(ctx, cx, ty + 40, cx, ty + 86, COLORS.frob, 1.5, 'Θ±-bridge <ThetaPmBridge>');
    // right: ΘNF-HT
    var rx = leftW + 4;
    box(ctx, rx, 34, c.w - rx - 14, c.h - 150, COLORS.grid, COLORS.panelFill);
    text(ctx, 'ΘNF-Hodge theater  <ThetaNFHodgeTheater>', rx + 10, 48, { size: 12, color: COLORS.ddag });
    text(ctx, 'symmetry F_l^* <FlStarSym>: multiplicative / arithmetic', rx + 10, 63, { size: 10, color: COLORS.dim });
    var jw = Math.min(40, (c.w - rx - 60) / capJ.length), jx0 = rx + 20;
    capJ.forEach(function (m, i) {
      var x = jx0 + i * jw;
      box(ctx, x, ty, jw - 4, 34, COLORS.frob, COLORS.frobFill, 4);
      text(ctx, String(m.j), x + (jw - 4) / 2, ty + 12, { size: 11, align: 'center' });
      text(ctx, 'q̲^' + (m.j * m.j), x + (jw - 4) / 2, ty + 25, { size: 8, align: 'center', color: COLORS.dim });
    });
    text(ctx, 'capsule F_J,  j ∈ F_l^*  (' + capJ.length + ' F-prime-strips)  <FJ> <LabelJ>', jx0, ty - 14, { size: 11, color: COLORS.dim });
    var jcx = jx0 + (capJ.length * jw) / 2;
    box(ctx, jcx - 125, 80, 250, 40, COLORS.etale, COLORS.etaleFill);
    text(ctx, 'F_⊛  (Π_{C_K} ↷ F_mod^×)  <FCircAst>', jcx, 94, { size: 11, align: 'center', color: COLORS.etale });
    text(ctx, 'number-field portion', jcx, 110, { size: 10, align: 'center', color: COLORS.dim });
    arrow(ctx, jcx, ty - 22, jcx, 124, COLORS.etale, 1.5, 'NF-bridge <NFBridge>');
    box(ctx, jcx - 125, ty + 90, 250, 40, COLORS.frob, COLORS.frobFill);
    text(ctx, 'F_>  <FGt>', jcx, ty + 104, { size: 11, align: 'center', color: COLORS.frob });
    text(ctx, 'Θ-HT: F⊩_tht (Θ̲_v) → F⊩_mod (q̲_v)', jcx, ty + 120, { size: 10, align: 'center', color: COLORS.dim });
    arrow(ctx, jcx, ty + 40, jcx, ty + 86, COLORS.frob, 1.5, 'Θ-bridge <ThetaBridge>');
    // gluing
    ctx.strokeStyle = ht.glued ? COLORS.shared : COLORS.alien; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 90, ty + 110); ctx.lineTo(jcx - 125, ty + 110); ctx.stroke(); ctx.setLineDash([]);
    text(ctx, 'gluing  0, ⊞ ↦ >   (F_l ⊇ F_l^× ↠ F_l^*, ±j ↦ j)  <GluingZeroBoxPlusToGt> ' + (ht.glued ? '✓' : '✗'), (cx + jcx) / 2, ty + 96, { size: 11, align: 'center', color: ht.glued ? COLORS.shared : COLORS.alien });
    // bottom: pilots and log-shells
    var by = c.h - 104;
    text(ctx, 'Θ-Hodge theater values Θ̲_v(j) = q̲^{j²}:  ' + capJ.map(function (m) { return 'q̲^' + m.j * m.j; }).join(', ') + '      q-pilot {q̲_v} −|log q| = ' + fmt(ht.QPilot.logVolume) + '    Θ-pilot {q̲_v^{j²}} naive = ' + fmt(ht.ThetaPilot.logVolume) + ' (= l(l+1)/12 × q-pilot)', 14, by, { size: 11 });
    text(ctx, '⊩-strips built here: F⊩_Δ <FMonoGlobTriangle> (q-pilot) · F⊩_env · F⊩_gau · F⊩_LGP <FMonoGlobLGPTorsor> (Θ-pilot) · F⊩_lgp <FMonoGlobLgpIdeal>      pilot degrees ' + fmt(ht.FMonoGlobTriangle.globalDegree) + ' / ' + fmt(ht.FMonoGlobLGPTorsor.globalDegree), 14, by + 18, { size: 11, color: COLORS.dim });
    if (ht.hasIncomingLog) {
      text(ctx, 'log-shells I_v = (p*)^{-1} log(O×_{K_v})  (codomain of the log-link from (' + ht.n + ',' + (ht.m - 1) + '))  <LogShell>:', 14, by + 40, { size: 11, color: COLORS.log });
      var sx = 14;
      ht.LogShell.forEach(function (S) { var s = S.v + ': p*=' + S.PStar + ' I=p^{' + S.radius + '}O μ=' + fmt(S.logVolume, 3); text(ctx, s, sx, by + 58, { size: 10, color: COLORS.text }); sx += s.length * 6.6 + 14; });
    } else text(ctx, 'no log-shells at this vertex yet — apply a log-link into it (key l on the vertex below, or build the infinite H).', 14, by + 40, { size: 11, color: COLORS.dim });
    text(ctx, 'the Frobenius-like portion of every strip is a fresh copy at each vertex; the étale-like Π_v/G_v copies are shared along a column (log-links) and the G_v/O×μ copies across a Θ-link.', 14, by + 80, { size: 10, color: COLORS.dim });
  }

  // ------------------------------------------------------------ alien copies canvas
  function drawAlien() {
    var c = fit($('c-alien')), ctx = c.ctx, lat = state.lat, d = lat.data, n = lat.focus[0], m = lat.focus[1];
    var L = lat.findLink(false, n, m), note = '';
    if (!L) { L = lat.links.filter(function (x) { return x.species !== 'LogLink'; })[0]; if (L) { note = '   (no Θ-link at the focus; showing the one at (' + L.dom + '))'; n = L.dom[0]; m = L.dom[1]; } }
    var A = lat.peek(n, m), B = lat.peek(n + 1, m);
    text(ctx, 'Mutually alien copies across the ' + IUT.LINKS[lat.horizontal].notation + '  (' + n + ',' + m + ') → (' + (n + 1) + ',' + m + ')      [Alien] §1, §3.6; [IUTchII] Cor 4.10      <AlienCopy> <Dag> <Ddag>' + note, 12, 16, { size: 12, color: COLORS.dim });
    if (!A || !B || !L) { text(ctx, 'no Θ-link in the lattice yet. Press t on a vertex (or build the infinite H).', 20, 50); return; }
    var colW = (c.w - 60) / 2, lx = 20, rxx = 40 + colW, y0 = 44;
    box(ctx, lx, y0, colW - 10, c.h - y0 - 130, COLORS.dag, COLORS.dagFill);
    box(ctx, rxx, y0, colW - 10, c.h - y0 - 130, COLORS.ddag, COLORS.ddagFill);
    text(ctx, '†HT = ' + A.copy + '  (universe #' + A.universe + ')   domain: F⊩_LGP (Θ-pilot {q̲^{j²}})', lx + 10, y0 + 16, { color: COLORS.dag, bold: true });
    text(ctx, '‡HT = ' + B.copy + '  (universe #' + B.universe + ')   codomain: F⊩_Δ (q-pilot {q̲})', rxx + 10, y0 + 16, { color: COLORS.ddag, bold: true });
    var rowH = Math.min(58, (c.h - y0 - 170) / Math.max(1, d.VSet.length)), y = y0 + 40;
    d.VSet.forEach(function (v, i) {
      var a = A.FMonoGlobLGPTorsor.local[i], b = B.FMonoGlobTriangle.local[i];
      var piA = A.ThetaNFHodgeTheater.FGt.local[i].PiV, piB = B.ThetaNFHodgeTheater.FGt.local[i].PiV;
      text(ctx, v.name, lx + 10, y, { bold: true });
      text(ctx, 'Π_v #' + piA, lx + 60, y, { color: COLORS.alien, size: 11 }); text(ctx, 'Π_v #' + piB, rxx + 60, y, { color: COLORS.alien, size: 11 }); text(ctx, v.name, rxx + 10, y, { bold: true });
      text(ctx, 'G_v #' + a.GV, lx + 60, y + 14, { color: a.GV === b.GV ? COLORS.shared : COLORS.alien, size: 11 }); text(ctx, 'G_v #' + b.GV, rxx + 60, y + 14, { color: a.GV === b.GV ? COLORS.shared : COLORS.alien, size: 11 });
      text(ctx, 'O×μ #' + a.units, lx + 60, y + 28, { color: a.units === b.units ? COLORS.shared : COLORS.alien, size: 11 }); text(ctx, 'O×μ #' + b.units, rxx + 60, y + 28, { color: a.units === b.units ? COLORS.shared : COLORS.alien, size: 11 });
      var va = a.vals.length ? 'O▶ {q̲^{' + a.vals.join(',') + '}}' : 'O▶ (good: no q̲)', vb = b.vals.length ? 'O▶ {q̲^{' + b.vals.join(',') + '}}' : 'O▶ (good: no q̲)';
      text(ctx, va, lx + 60, y + 42, { color: a.vals.length ? COLORS.hull : COLORS.dim, size: 11 }); text(ctx, vb, rxx + 60, y + 42, { color: b.vals.length ? COLORS.hull : COLORS.dim, size: 11 });
      // connectors
      var midL = lx + colW - 14, midR = rxx;
      [[14, a.GV === b.GV, 'Ind1'], [28, a.units === b.units, 'Ind2'], [42, false, a.vals.length ? '×' + fmt(L.dilation, 2) : '']].forEach(function (row) {
        ctx.strokeStyle = row[1] ? COLORS.shared : COLORS.alien; ctx.setLineDash(row[1] ? [] : [3, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(midL - 50, y + row[0]); ctx.lineTo(midR + 50, y + row[0]); ctx.stroke(); ctx.setLineDash([]);
        if (row[2]) text(ctx, row[2], (midL + midR) / 2, y + row[0] - 7, { size: 9, color: row[1] ? COLORS.shared : COLORS.hull, align: 'center' });
      });
      y += rowH;
    });
    var by = c.h - 118;
    text(ctx, 'gluing data of the ' + L.notation + ':', 20, by, { bold: true });
    text(ctx, '(aΘ)  G_v ↷ O×μ of †F⊩_LGP  ≅  G_v ↷ O×μ of ‡F⊩_Δ      horizontally coric, up to Aut(G_v) <IndOne> and Ism <IndTwo>' + (L.preservesUnitsModTors ? '  ✓' : '  (plain Θ-link: units glued only at the F⊩ level)'), 20, by + 18, { size: 11, color: COLORS.shared });
    text(ctx, '(bΘ)  {q̲_v^{j²}}_{j=1..l*}  ↦  {q̲_v}      value groups NOT compatible: dilation l(l+1)/12 = ' + fmt(L.dilation, 3) + '  <JSq>', 20, by + 36, { size: 11, color: COLORS.hull });
    text(ctx, '(cΘ)  †C⊩ ≅ ‡C⊩  global realified Frobenioids;  arithmetic degrees † ' + fmt(A.FMonoGlobLGPTorsor.globalDegree) + '  vs  ‡ ' + fmt(B.FMonoGlobTriangle.globalDegree), 20, by + 54, { size: 11 });
    text(ctx, 'Π_v and the ring structures are NOT identified: the two Hodge theaters are mutually alien ring theories. Comparison goes through the bi-coric D⊢-prime-strip (Kummer-detachment) and costs (Ind1),(Ind2),(Ind3).', 20, by + 72, { size: 11, color: COLORS.alien });
    text(ctx, 'full poly-isomorphism ✓ · preserves Π_v ✗ · preserves G_v ✓ · preserves O×μ ' + (L.preservesUnitsModTors ? '✓' : '✗') + ' · preserves ring ✗', 20, by + 90, { size: 11, color: COLORS.dim });
  }

  // ------------------------------------------------------------ multiradial / log-volume canvas
  function drawMultiradial() {
    var c = fit($('c-multi')), ctx = c.ctx, lat = state.lat, d = lat.data, rep = IUT.multiradial(lat, lat.focus[0]);
    text(ctx, 'Multiradial representation R^LGP_{' + rep.n + ',◦}  <MultiradialRepresentation>      [IUTchIII] Thm 3.11, Cor 3.12; [IUTchIV] Thm 1.10; [Alien] §3.7 (iv)', 12, 16, { size: 12, color: COLORS.dim });
    text(ctx, '(a) tensor packets of log-shells over processions S^±_{j+1} = {0..j} <SPmJPlusOne>   (b) splitting monoids {q̲^{j²}}   (c) copies (F_mod^×)_j      up to <IndOne> perms/Aut(G_v), <IndTwo> Ism, <IndThree> upper semi-compatibility', 12, 34, { size: 11, color: COLORS.dim });
    // bar chart: per j, hull (j+1) log d^K (positive) and Θ-shift (negative)
    var steps = rep.steps, left = 70, top = 60, w = c.w - left - 330, h = c.h - top - 150, maxPos = Math.max.apply(null, steps.map(function (s) { return s.hull; })) || 1, maxNeg = Math.max.apply(null, steps.map(function (s) { return -s.thetaShift; })) || 1;
    var zeroY = top + h * maxPos / (maxPos + maxNeg), scale = h / (maxPos + maxNeg), bw = w / steps.length;
    ctx.strokeStyle = COLORS.grid; ctx.beginPath(); ctx.moveTo(left, zeroY); ctx.lineTo(left + w, zeroY); ctx.stroke();
    steps.forEach(function (s, i) {
      var x = left + i * bw + 6, ww = bw - 12;
      ctx.fillStyle = '#c9b6ee'; ctx.fillRect(x, zeroY - s.hull * scale, ww / 2 - 2, s.hull * scale);
      ctx.fillStyle = '#f4a893'; ctx.fillRect(x + ww / 2 + 2, zeroY, ww / 2 - 2, -s.thetaShift * scale);
      text(ctx, 'j=' + s.j, x + ww / 2, top + h + 14, { size: 11, align: 'center' });
      text(ctx, '|S±|=' + s.size + ' ' + s.perms + '!', x + ww / 2, top + h + 28, { size: 9, align: 'center', color: COLORS.dim });
      text(ctx, fmt(s.hull, 1), x + ww / 4, zeroY - s.hull * scale - 8, { size: 9, align: 'center', color: COLORS.hull });
      text(ctx, fmt(s.thetaShift, 1), x + 3 * ww / 4, zeroY - s.thetaShift * scale + 8, { size: 9, align: 'center', color: COLORS.theta });
    });
    text(ctx, 'hull (j+1)·log d^K', left, top - 8, { size: 11, color: COLORS.hull });
    text(ctx, 'Θ-shift −(j²/2l)·log q', left + 160, top - 8, { size: 11, color: COLORS.theta });
    // right panel numbers
    var px = left + w + 20, py = top;
    var lines = [
      ['log(q)', fmt(rep.logQ)], ['|log(q)| = log(q)/2l', fmt(rep.AbsLogQ)], ['−|log(q)|', fmt(-rep.AbsLogQ)], ['log(d^K) (estimate)', fmt(d.K.logDifferentEstimate)],
      ['Σ_j hull + Θ-shift (j=1..l*)', fmt(rep.leadingTerm)], ['(l²/48)(6 log d^K − log q)', fmt(rep.leadingTermAsymptotic)],
      ['÷ l*: hull enlargement', fmt(rep.hullEnlargement)], ['÷ l*: −|log(Θ)| heuristic', fmt(rep.thetaUpperBound)],
      ['heuristic −|logΘ| ≥ −|log q|', rep.heuristicHolds ? 'holds' : 'FAILS'], ['C_Θ (Thm 1.10)', rep.CTheta.toExponential(3)], ['C_Θ ≥ −1', rep.CTheta >= -1 ? 'yes' : 'NO'],
      ['(1/6) log q', fmt(rep.logQ / 6)], ['RHS of Thm 1.10', rep.thmOneTenRHS.toExponential(3)]
    ];
    lines.forEach(function (l, i) { text(ctx, l[0], px, py + i * 18, { size: 11, color: COLORS.dim }); text(ctx, l[1], px + 300, py + i * 18, { size: 11, align: 'right', color: /FAILS|NO/.test(l[1]) ? COLORS.alien : COLORS.text }); });
    var by = c.h - 100;
    text(ctx, 'Cor 3.12:  −|log(Θ)| ≥ −|log(q)|,  i.e. C_Θ ≥ −1 for any C_Θ with −|log(Θ)| ≤ C_Θ·|log(q)|   <CorThreeTwelve> <CTheta> <AbsLogQ> <AbsLogTheta>', 12, by, { size: 11 });
    text(ctx, 'Thm 1.10:  C_Θ = (l+1)/(4|log q|)·{(1 + 12 d_mod/l)(log d^Ftpd + log f^Ftpd) + 10(e*_mod·l + η_prm) − (1/6)(1 − 12/l²) log q} − 1', 12, by + 18, { size: 11, color: COLORS.dim });
    text(ctx, 'with e*_mod = 2^12·3^3·5·e_mod, η_prm = 5·10^20 ([ExpEst]);  hence  (1/6) log q ≤ (1 + 20 d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod·l + η_prm).', 12, by + 36, { size: 11, color: COLORS.dim });
    text(ctx, 'The leading-term heuristic is (l²/48)(6 log d^K − log q): a large constant times the Szpiro quantity ([Alien] §3.7 (iv)).', 12, by + 54, { size: 11, color: COLORS.dim });
    text(ctx, 'overall for this data: ' + (rep.inequalityHolds ? 'inequality holds' : 'inequality FAILS'), 12, by + 76, { bold: true, color: rep.inequalityHolds ? COLORS.shared : COLORS.alien });
    // étale picture (small, under the numbers)
    var ex = px + 150, ey = py + lines.length * 18 + 90, R = 46;
    text(ctx, 'étale-picture', ex, ey - R - 18, { size: 11, align: 'center', color: COLORS.dim });
    var vs = lat.vertices();
    vs.forEach(function (ht, i) { var a = i / vs.length * 2 * Math.PI, x = ex + R * Math.cos(a), yy = ey + R * Math.sin(a); ctx.strokeStyle = COLORS.etale; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(x, yy); ctx.stroke(); ctx.fillStyle = ht.copy === 'Dag' ? COLORS.dag : ht.copy === 'Ddag' ? COLORS.ddag : COLORS.bullet; ctx.beginPath(); ctx.arc(x, yy, 4, 0, 7); ctx.fill(); });
    ctx.fillStyle = COLORS.etale; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fill(); text(ctx, 'D⊢', ex, ey, { size: 9, align: 'center', color: '#fff', bold: true });
    text(ctx, 'bi-coric core <DMonoPrimeStrip>', ex, ey + R + 14, { size: 9, align: 'center', color: COLORS.dim });
  }

  // ------------------------------------------------------------ species / mutation graph canvas
  function drawSpecies() {
    var c = fit($('c-species')), ctx = c.ctx, S = IUT_IDENTS.SPECIES, M = IUT_IDENTS.MUTATIONS;
    text(ctx, 'Species and mutations ([IUTchIV] §3 Def 3.1, 3.3): the mutation-history of the toolkit.  Green = core (all mutations isomorphisms).  <ZeroSpecies> <Mutation> <MutationHistory> <Core>', 12, 16, { size: 12, color: COLORS.dim });
    var pos = {}, cols = 4, cw = (c.w - 40) / cols, rh = Math.max(60, (c.h - 80) / Math.ceil(S.length / cols));
    var loops = {};
    S.forEach(function (s, i) { var x = 20 + (i % cols) * cw + cw / 2, y = 60 + Math.floor(i / cols) * rh + rh / 2; pos[s.id] = [x, y]; });
    M.forEach(function (m) {
      var a = pos[m.dom], b = pos[m.cod]; if (!a || !b) return;
      if (m.dom === m.cod) { var k = (loops[m.dom] = (loops[m.dom] || 0) + 1); ctx.strokeStyle = m.core ? COLORS.shared : COLORS.theta; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a[0] + 60, a[1] - 26, 10 + 4 * k, 0.2, 5.2); ctx.stroke(); text(ctx, m.name, a[0] - 70, a[1] - 22 - 11 * k, { size: 9, color: COLORS.dim }); return; }
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      arrow(ctx, a[0] + ux * 70, a[1] + uy * 16, b[0] - ux * 70, b[1] - uy * 16, m.core ? COLORS.shared : COLORS.theta, 1.3, m.name);
    });
    S.forEach(function (s) { var p = pos[s.id]; box(ctx, p[0] - 110, p[1] - 16, 220, 32, COLORS.bullet, '#ffffff'); text(ctx, s.id, p[0], p[1] - 5, { size: 10, align: 'center' }); text(ctx, s.name.slice(0, 34), p[0], p[1] + 8, { size: 9, align: 'center', color: COLORS.dim }); });
  }

  // ------------------------------------------------------------ identifiers tab (DOM)
  function renderIdents() {
    var q = ($('id-filter').value || '').toLowerCase(), rows = IUT_IDENTS.IDENTS.filter(function (x) { return !q || (x.id + ' ' + x.notation + ' ' + x.kind + ' ' + x.desc + ' ' + x.ref).toLowerCase().indexOf(q) >= 0; });
    var h = '<table class="grid"><tr><th>identifier</th><th>notation</th><th>kind</th><th>ref</th><th>description</th></tr>';
    rows.forEach(function (x) { h += '<tr><td><code>' + x.id + '</code></td><td class="notation">' + escapeHtml(x.notation) + '</td><td>' + x.kind + '</td><td class="ref">' + escapeHtml(x.ref) + '</td><td>' + escapeHtml(x.desc) + '</td></tr>'; });
    h += '</table>';
    $('id-table').innerHTML = h; $('id-count').textContent = rows.length + ' / ' + IUT_IDENTS.IDENTS.length;
  }

  // ------------------------------------------------------------ control
  function setStatus(s) { $('status').textContent = s; }
  function rebuild(d) {
    state.lat = new IUT.Lattice(d, state.horizontal);
    state.lat.buildH(0, -1, 1);
    redraw(); renderGallery(); PROCESSES.refresh();
  }
  function ctx() { return { d: state.lat.data, lat: state.lat }; }

  // ------------------------------------------------------------ Part I gallery (SVG, diagrams.js)
  function identPill(id) { var ok = IDENT_SET[id.toLowerCase()]; return '<span class="ident" data-id="' + escapeHtml(id) + '" title="' + (ok ? escapeHtml(ok.notation + ' — ' + ok.desc) : 'not in the identifier table') + '"' + (ok ? '' : ' style="background:#d7263d"') + '>' + escapeHtml(id) + '</span>'; }
  function renderGallery() {
    var g = $('gallery'); if (!g) return; var h = '';
    DIAGRAMS.cards.forEach(function (c) {
      var fig; try { fig = c.draw(state.lat.data, state.lat); } catch (e) { fig = '<p style="color:#d7263d">diagram error: ' + escapeHtml(e.message) + '</p>'; }
      h += '<div class="card" id="card-' + c.id + '"><h3>' + escapeHtml(c.title) + '</h3><span class="ref">' + escapeHtml(c.ref) + '</span><div class="fig">' + fig + '</div><p>' + c.desc + '</p><div class="idents">' + c.idents.map(identPill).join('') + '</div></div>';
    });
    g.innerHTML = h;
    g.querySelectorAll('.ident').forEach(function (p) { p.addEventListener('click', function () { $('id-filter').value = p.dataset.id; showTab('ids'); $('part-explorer').scrollIntoView(); }); });
  }
  function redraw() {
    var lat = state.lat;
    $('focus-label').textContent = '(' + lat.focus[0] + ',' + lat.focus[1] + ')';
    $('data-name').textContent = lat.data.name;
    if (state.tab === 'data') renderData();
    if (state.tab === 'lattice') drawLattice();
    if (state.tab === 'ht') drawHodgeTheater();
    if (state.tab === 'alien') drawAlien();
    if (state.tab === 'multi') drawMultiradial();
    if (state.tab === 'species') drawSpecies();
    if (state.tab === 'ids') renderIdents();
  }
  function explorerVisible() { var r = $('explorer').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; }
  function showTab(t) {
    state.tab = t;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === t); });
    document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + t); });
    redraw();
  }
  function applyLog() { var f = state.lat.focus, L = state.lat.applyLogLink(f[0], f[1]); if (L) { state.lat.focus = [f[0], f[1] + 1]; setStatus('log-link (' + f + ') → (' + state.lat.focus + '): D-prime-strips shared, log-shells built in the codomain'); } else setStatus('cannot apply a log-link at the edge'); redraw(); }
  function focusLabel(f) { return '(' + f[0] + ',' + f[1] + ')'; }
  function applyTheta() { var f = state.lat.focus, L = state.lat.applyThetaLink(f[0], f[1]); if (L) { state.lat.focus = [f[0] + 1, f[1]]; setStatus(L.notation + ' (' + f + ') → (' + state.lat.focus + '): O×μ shared, value groups dilated by ' + fmt(L.dilation, 3) + ', Π_v alien'); } else setStatus('cannot apply a Θ-link at the edge'); redraw(); }
  function buildH() { var f = state.lat.focus; state.lat.buildH(f[0], -3, 3); setStatus('built the infinite H on columns ' + f[0] + ',' + (f[0] + 1)); redraw(); }
  function moveFocus(dn, dm) { var f = state.lat.focus; if (IUT.Lattice.inRange(f[0] + dn, f[1] + dm)) state.lat.focus = [f[0] + dn, f[1] + dm]; redraw(); }

  function init() {
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
    $('btn-gen-abc').addEventListener('click', function () {
      try { var d = IUT.genFromAbc($('in-a').value, $('in-b').value, $('in-c').value, $('in-l').value); rebuild(d); setStatus('generated ' + d.name); }
      catch (e) { setStatus('rejected: ' + e.message); }
    });
    $('in-c').addEventListener('focus', function () { if (!$('in-c').value) $('in-c').value = (+$('in-a').value) + (+$('in-b').value); });
    $('btn-random').addEventListener('click', function () { state.seed++; var d = IUT.genRandom(state.seed); rebuild(d); setStatus('random data: ' + d.name); });
    $('sel-example').addEventListener('change', function () { var d = IUT.genExample(+$('sel-example').value); rebuild(d); setStatus('example: ' + d.name); if (d.abc) { $('in-a').value = d.abc[0]; $('in-b').value = d.abc[1]; $('in-c').value = d.abc[2]; $('in-l').value = d.l; } });
    $('sel-horizontal').addEventListener('change', function () { state.horizontal = $('sel-horizontal').value; rebuild(state.lat.data); setStatus('horizontal link: ' + IUT.LINKS[state.horizontal].notation); });
    $('btn-log').addEventListener('click', applyLog); $('btn-theta').addEventListener('click', applyTheta); $('btn-h').addEventListener('click', buildH);
    $('btn-up').addEventListener('click', function () { moveFocus(0, 1); }); $('btn-down').addEventListener('click', function () { moveFocus(0, -1); });
    $('btn-left').addEventListener('click', function () { moveFocus(-1, 0); }); $('btn-right').addEventListener('click', function () { moveFocus(1, 0); });
    $('btn-validate').addEventListener('click', function () { showTab('data'); });
    $('id-filter').addEventListener('input', renderIdents);
    $('btn-json').addEventListener('click', function () { var blob = new Blob([JSON.stringify({ data: state.lat.data, HodgeTheaters: state.lat.vertices(), links: state.lat.links }, null, 1)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iut-lattice.json'; a.click(); });
    var cl = $('c-lattice');
    cl.addEventListener('click', function (ev) { var hit = latticeHit(ev); if (hit) { state.lat.focus = hit; redraw(); } });
    cl.addEventListener('dblclick', function (ev) { var hit = latticeHit(ev); if (hit) { state.lat.get(hit[0], hit[1]); state.lat.focus = hit; setStatus('created a fresh Hodge theater at (' + hit + ') (no links yet)'); redraw(); } });
    cl.addEventListener('mousemove', function (ev) { state.hoverCell = latticeHit(ev); if (state.tab === 'lattice') drawLattice(); });
    document.addEventListener('keydown', function (ev) {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT' || ev.target.tagName === 'TEXTAREA' || !explorerVisible()) return;
      if (ev.key === 'ArrowUp') moveFocus(0, 1); else if (ev.key === 'ArrowDown') moveFocus(0, -1); else if (ev.key === 'ArrowLeft') moveFocus(-1, 0); else if (ev.key === 'ArrowRight') moveFocus(1, 0);
      else if (ev.key === 'l') applyLog(); else if (ev.key === 't') applyTheta(); else if (ev.key === 'H') buildH();
      else if (ev.key >= '1' && ev.key <= '7') showTab(['data', 'lattice', 'ht', 'alien', 'multi', 'species', 'ids'][+ev.key - 1]);
      else return;
      ev.preventDefault();
    });
    window.addEventListener('resize', redraw);
    var d = IUT.genExample(state.example);
    $('in-a').value = 1; $('in-b').value = 2400; $('in-c').value = 2401; $('in-l').value = 13;
    state.lat = new IUT.Lattice(d, state.horizontal); state.lat.buildH(0, -1, 1);
    PROCESSES.render($('processes'), ctx);
    rebuild(d); showTab('lattice'); setStatus('built the infinite H for ' + d.name + ' — click a vertex, then l / t / H');
  }
  document.addEventListener('DOMContentLoaded', init);
  window.IUT_APP = { state: state, showTab: showTab, rebuild: rebuild, renderGallery: renderGallery };
})();
