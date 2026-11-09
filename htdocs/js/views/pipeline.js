/*
 * views/pipeline.js — "Pipeline": one run of the whole theory on the selected initial Θ-data, stage by stage,
 * as computed by the engine (`iut pipeline --json`, src/iut_pipeline.c):
 *
 *   0 initial Θ-data → 1 Def 3.1 (a)–(f) → 2 Hodge theaters → 3 Gaussian monoids → 4 log-theta-lattice →
 *   5 multiradial representation, Cor 3.12 → 6 Thm 1.10 → 7 cross-check with the JSON file
 *
 * The four exact worked examples of docs/initial-theta-data/ (Tate parameters to 8 p-adic digits, SL2
 * proved) are one click away; any other selection of the bench works too.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, DG = root.DIAG, D = root.DRAW, el = U.el, esc = U.esc, fmt = D.fmt, P = D.P;
  var container;

  var STAGES = [
    { k: 'data', n: '0', t: 'initial Θ-data', ref: '[IUTchI] Def 3.1' },
    { k: 'def', n: '1', t: 'conditions (a)–(f)', ref: '[IUTchI] Def 3.1' },
    { k: 'ht', n: '2', t: 'Hodge theaters', ref: '[IUTchI] §3–§6' },
    { k: 'gau', n: '3', t: 'Gaussian monoids', ref: '[IUTchII] Cor 3.5' },
    { k: 'lat', n: '4', t: 'log-theta-lattice', ref: '[IUTchIII] Def 1.4' },
    { k: 'mr', n: '5', t: 'multiradial rep., Cor 3.12', ref: '[IUTchIII] Thm 3.11' },
    { k: 'hb', n: '6', t: 'height bound', ref: '[IUTchIV] Thm 1.10' },
    { k: 'xc', n: '7', t: 'cross-check', ref: 'the JSON file' }
  ];

  function digits(x, p, n) {   /* base-p digits, little-endian, of a decimal string (BigInt) */
    var out = [], v = BigInt(x), B = BigInt(p);
    for (var i = 0; i < n; i++) { out.push(String(v % B)); v = v / B; }
    return out.join(',');
  }
  function qf(a) { return a[1] === 1 ? String(a[0]) : a[0] + '/' + a[1]; }

  /* the stage strip: eight boxes, green when the stage went through */
  function strip(cv, P0, ok) {
    var W = 760, H = 78, c = D.setup(cv, W, H), n = STAGES.length, w = (W - 20) / n;
    STAGES.forEach(function (s, i) {
      var x = 10 + i * w, good = ok[s.k];
      D.box(c, x + 3, 10, w - 14, 50, { fill: good === false ? P.redBg : good ? P.greenBg : P.greyBg, stroke: null, r: 8 });
      D.text(c, s.n + '  ' + (good === false ? '✗' : good ? '✓' : '·'), x + (w - 8) / 2, 24, { size: 12, bold: true, color: good === false ? P.red : good ? P.green : P.ink3 });
      D.text(c, s.t, x + (w - 8) / 2, 40, { size: 9.5, maxWidth: w - 18 });
      D.text(c, s.ref, x + (w - 8) / 2, 53, { size: 8, color: P.ink3, maxWidth: w - 18 });
      if (i < n - 1) D.text(c, '→', x + w - 5, 35, { size: 12, color: P.ink3 });
    });
    D.text(c, P0.problems ? P0.problems + ' problem(s)' : 'the pipeline went through: 0 problems', W / 2, H - 6, { size: 10.5, color: P0.problems ? P.red : P.green });
  }

  /* Gaussian monoid at one v: bars of ord(q̲_v^{j²}) = j²·ord(q_v)/2l */
  function gaussBars(cv, place, l) {
    var rows = place.rows, W = 760, H = 40 + rows.length * 26, c = D.setup(cv, W, H);
    var max = Math.max.apply(null, rows.map(function (r) { return r.ordQUnderPow[0] / r.ordQUnderPow[1]; }));
    D.text(c, 'Ψ_gau at ' + place.v + ':  ord_v(q̲_v^{j²}) = j²·' + place.ordQ + '/' + (2 * l) + '   (q̲_v = q_v^{1/2l})', W / 2, 14, { size: 12, bold: true });
    rows.forEach(function (r, i) {
      var y = 36 + i * 26, val = r.ordQUnderPow[0] / r.ordQUnderPow[1];
      D.text(c, 'j = ' + r.j, 40, y, { size: 11, mono: true });
      D.bar(c, 80, y - 8, 330, 16, val / max, { fill: P.orange });
      D.text(c, qf(r.ordQUnderPow), 420, y, { size: 11, align: 'left', mono: true });
      if (r.unitPow) D.text(c, 'unit of q^{' + r.jSq + '} ≡ ' + r.unitPow + ' mod ' + place.p + '^' + place.precision, 500, y, { size: 10, align: 'left', mono: true, color: P.ink2, maxWidth: 255 });
    });
  }

  /* procession: (j+1) log d^K versus −(j²/2l) log q, j = 0..l* */
  function processionBars(cv, mr) {
    var pr = mr.procession, W = 760, H = 50 + pr.length * 24, c = D.setup(cv, W, H);
    var max = Math.max.apply(null, pr.map(function (s) { return Math.max(Math.abs(s.leading), Math.abs(s.thetaShift)); })) || 1;
    D.text(c, 'tensor packets over S±_{j+1}: hull (j+1)·log d^K (teal) and theta shift −(j²/2l)·log q (orange)', W / 2, 14, { size: 12, bold: true });
    pr.forEach(function (s, i) {
      var y = 40 + i * 24, x0 = 380;
      D.text(c, 'j = ' + s.j + '   |S| = ' + s.size + '   ' + s.perms + ' perms', 20, y, { size: 10.5, align: 'left', mono: true });
      D.bar(c, x0, y - 7, 180, 14, s.leading / max, { fill: P.teal });
      D.bar(c, x0 - 180, y - 7, 180, 14, -Math.abs(s.thetaShift) / max, { fill: P.orange, track: 'transparent' });
      D.text(c, fmt(s.leading + s.thetaShift, 3), 740, y, { size: 10.5, align: 'right', mono: true });
    });
  }

  function section(stage, body) {
    var s = STAGES.filter(function (x) { return x.k === stage; })[0];
    var card = el('div', { class: 'card', id: 'pipeline-' + stage, style: 'margin-top:16px' });
    card.appendChild(el('h3', {}, [el('span', { text: 'stage ' + s.n + ' — ' + s.t }), el('span', { class: 'ref', text: s.ref })]));
    body.forEach(function (b) { if (b) card.appendChild(b); });
    return card;
  }

  function render(c) {
    container = c; U.clear(c);
    c.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Pipeline' }),
      el('p', { class: 'lead', html: 'One run of the whole theory on the Θ-data selected in the bar above, with the state after every stage: the initial Θ-data of [IUTchI] Def 3.1 and its conditions, the Θ±ell NF-Hodge theater, the Gaussian monoids of theta values, the log-theta-lattice with its Θ×μ_LGP-link and log-shells, the multiradial representation and Cor 3.12, and the height bound of [IUTchIV] Thm 1.10. This is <code>iut pipeline --json</code> (<code>src/iut_pipeline.c</code>) running in the page.' })
    ]));
    if (M.THETA_JSON.length) {
      var pick = el('div', { class: 'controls', style: 'margin-bottom:8px' }, [el('span', { class: 'small muted', text: 'exact worked examples (docs/initial-theta-data/): ' })]);
      M.THETA_JSON.forEach(function (t) {
        var on = M.get().mode === 'json' && M.get().json === t.id;
        pick.appendChild(el('button', { class: on ? 'primary' : '', text: t.title + ' · l = ' + t.l, title: t.curve, onclick: function () { M.set({ mode: 'json', json: t.id }); } }));
      });
      c.appendChild(pick);
    }
    var P0;
    try { P0 = M.pipeline(); } catch (e) { c.appendChild(el('div', { class: 'callout', html: '<b>the pipeline did not run:</b> ' + esc(e.message) })); return; }
    var d = P0.data, w = M.walk(), ht00 = M.hodgeTheaterAt(w, 0, 0), ht10 = M.hodgeTheaterAt(w, 1, 0), g = M.gen();
    var link = w.links.filter(function (l) { return l.species !== 'LogLink'; })[0];
    var ok = { data: true, def: P0.defThreeOne.errors === 0, ht: P0.hodgeTheater.errors === 0, gau: true, lat: P0.lattice.errors === 0,
               mr: P0.multiradial.corThreeTwelve.holds, hb: P0.heightBound.holds, xc: P0.crossCheck.length ? P0.crossCheck.every(function (x) { return x.ok; }) : null };
    c.appendChild(el('div', { class: 'card' }, [U.canvas(function (cv) { strip(cv, P0, ok); })]));

    /* 0 */
    var bad = d.VSet.filter(function (v) { return v.inVBadMod; });
    c.appendChild(section('data', [
      el('p', { class: 'desc', html: '<b>' + esc(d.name) + '</b> — ' + esc(d.curve) + (P0.source !== 'generated' ? ' <span class="chip teal">from docs/initial-theta-data/' + esc(P0.source) + '.json</span>' : ' <span class="chip">generated by the toolkit</span>') }),
      U.canvas(function (cv) { DG.thetaData(cv, g); }),
      U.table(['v', 'p', 'reduction over F', 'ord(q_v)', 'V^bad_mod', 'Tate parameter q_v = p^ord · u'], d.VSet.map(function (v) {
        return [v.name, v.kind === 'VArc' ? '—' : String(v.p), v.kind === 'VArc' ? 'archimedean' : v.reduction, String(v.ordQ), v.inVBadMod ? '✓' : '',
          v.qUnit ? 'u ≡ ' + v.qUnit + ' mod ' + v.p + '<sup>' + v.qPrecision + '</sup> <span class="muted small">(digits ' + digits(v.qUnit, v.p, v.qPrecision) + ')</span>' : ''];
      })),
      el('p', { class: 'small', html: 'l = ' + d.l + ', l* = ' + d.LStar + ', l± = ' + d.LPm + ';  [F:Q] | ' + d.F.degreeBound + ', [K:Q] ≤ ' + d.K.degreeBound + ';  ε̲ = the cusp ±' + d.EpsilonUnder + ' of C̲_K (from a nonzero element of Q ≅ Z/' + d.l + 'Z, the canonical generator at every v ∈ V^bad).' })
    ]));
    /* 1 */
    c.appendChild(section('def', [
      U.table(['', 'clause', 'condition', 'how'], P0.defThreeOne.items.map(function (it) { return [it.ok ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✗</span>', it.item, esc(it.condition), esc(it.detail)]; })),
      el('p', { class: 'small muted', text: 'validator: ' + P0.defThreeOne.errors + ' error(s), ' + P0.defThreeOne.warnings + ' warning(s) in ' + P0.defThreeOne.checks + ' checks' + (P0.defThreeOne.issues.length ? ' — ' + P0.defThreeOne.issues.map(function (x) { return x.condition + ': ' + x.msg; }).join('; ') : '') })
    ]));
    /* 2 */
    var H = P0.hodgeTheater;
    c.appendChild(section('ht', [
      ht00 ? U.canvas(function (cv) { DG.hodgeTheater(cv, ht00, g, { focusT: 0 }); }) : null,
      el('p', { class: 'small', html: 'Θ±ell-HT: ' + H.T.length + ' F-prime-strips labelled t ∈ F_' + d.l + ', symmetry F_l^{⋊±} of order ' + H.symmetryPmOrder + '; ΘNF-HT: ' + H.J.length + ' labelled j ∈ F_l^*, symmetry of order ' + H.symmetryStarOrder + '. Gluing 0,⊞ ↦ >: ' + H.gluing.map(function (p) { return p[0] + '↦' + (p[1] === 0 ? '>' : p[1]); }).join('  ') + '. Θ-HT at V^bad: ' + H.thetaHT.map(function (t) { return t.v + ': ord(q̲_v) = ' + t.ordQ + '/' + t.ordQUnder[1]; }).join(', ') + '. Validator: ' + H.errors + ' error(s) in ' + H.checks + ' checks.' })
    ]));
    /* 3 */
    var G = P0.gaussian, gb = [];
    G.places.forEach(function (pl) { gb.push(U.canvas(function (cv) { gaussBars(cv, pl, d.l); })); });
    gb.push(ht00 ? U.canvas(function (cv) { DG.pilots(cv, ht00, g); }) : null);
    gb.push(el('p', { class: 'small', html: 'θ is evaluated at the l = ' + G.evaluationPoints + ' evaluation points and gives q̲_v^{t²} up to μ_' + G.muOrder + ' ([IUTchII] Cor 2.5). Normalized log-volumes −(j²/2l)·log q: ' + G.logVolumes.map(function (x) { return fmt(x, 4); }).join(', ') + '; q-pilot ' + fmt(G.qPilot, 6) + ', Θ-pilot ' + fmt(G.thetaPilot, 6) + ' (ratio l(l+1)/12 = ' + fmt(G.thetaPilot / G.qPilot, 4) + ').' }));
    c.appendChild(section('gau', gb));
    /* 4 */
    var L = P0.lattice;
    c.appendChild(section('lat', [
      U.canvas(function (cv) { DG.lattice(cv, w, { focus: [0, 0], shells: true }); }),
      link && ht00 && ht10 ? U.canvas(function (cv) { DG.thetaLink(cv, ht00, ht10, link, g); }) : null,
      U.table(['v', 'p*', 'log-shell I_v', 'μ_log(I_v)', 'Π_v kept by the log-link'], L.logShells.map(function (s) { return [s.v, s.pstar ? String(s.pstar) : '—', s.p ? 'p^{' + qf(s.radius) + '}·O_v' : 'π-disc', fmt(s.logVolume, 6), s.piShared ? '✓' : '✗']; })),
      el('p', { class: 'small muted', text: L.vertices + ' Hodge theaters, ' + L.logLinks + ' log-links, ' + (L.thetaLink ? 1 : 0) + ' Θ-link; validator: ' + L.errors + ' error(s) in ' + L.checks + ' checks. The log-shells use e(K_v/Q_p) = 1: the JSON files do not record the local ramification of K = F(E[l]).' })
    ]));
    /* 5 */
    var R = P0.multiradial;
    c.appendChild(section('mr', [
      U.canvas(function (cv) { processionBars(cv, R); }),
      U.table(['step', 'value', 'reference'], R.corThreeTwelve.steps.map(function (s) { return [esc(s.label), fmt(s.value, 6), esc(s.ref)]; })),
      el('p', { class: 'small', html: '(Ind1) |Aut(Prc)| = ' + R.ind1 + ', (Ind2) Ism on ' + R.ind2Summands + ' summands, (Ind3) ' + (R.ind3 ? 'present' : '—') + '; ' + R.packets + ' tensor packets, ' + R.splittingMonoids + ' splitting monoids, ' + R.numberFieldCopies + ' copies of F_mod^×. Cor 3.12 −|log Θ| ≥ −|log q|: <b>' + (R.corThreeTwelve.holds ? 'holds' : 'fails') + '</b>.' })
    ]));
    /* 6 */
    var B = P0.heightBound, C2 = B.corTwoTwo;
    c.appendChild(section('hb', [
      U.kv([
        ['log q, |log q|', fmt(B.logQ, 6) + ',  ' + fmt(B.absLogQ, 6)],
        ['log d^Ftpd, log f^Ftpd', fmt(B.logDTpd, 6) + ',  ' + fmt(B.logFTpd, 6)],
        ['C_Θ', Number(B.CTheta).toExponential(4) + (B.CTheta >= -1 ? '  (≥ −1 ✓)' : '  (< −1 ✗)')],
        ['Thm 1.10', '(1/6)·log q = ' + fmt(B.lhs, 6) + '  ≤  ' + Number(B.rhs).toExponential(4) + (B.holds ? '  ✓' : '  ✗')],
        ['Cor 2.2', 'log q∀ = ' + fmt(C2.logQAll, 6) + ';  (C1) ' + fmt(C2.lMin, 3) + ' ≤ l ≤ ' + Number(C2.lMax).toExponential(3) + ': l = ' + d.l + (C2.lInRange ? ' in range' : ' out of range') + ';  (C2) ' + (C2.holds ? 'holds' : 'fails')]
      ]),
      el('p', { class: 'small muted', text: 'For curves this small the constants (η_prm = 5·10^20) dominate the right-hand side: the inequality holds and says nothing sharper.' })
    ]));
    /* 7 */
    if (P0.crossCheck.length) c.appendChild(section('xc', [
      U.table(['', 'quantity', 'toolkit', 'JSON file'], P0.crossCheck.map(function (x) { return [x.ok ? '✓' : '✗', esc(x.what), fmt(x.toolkit, 6), fmt(x.file, 6)]; }))
    ]));
    var tr = el('details', { style: 'margin-top:16px' }, [el('summary', { text: 'the same run as text (iut pipeline)' })]);
    tr.appendChild(U.transcript(M.pipelineText()));
    c.appendChild(tr);
  }

  function onChange() { if (container) render(container); }
  root.VIEW_PIPELINE = { render: render, onChange: onChange };
})(typeof window !== 'undefined' ? window : globalThis);
