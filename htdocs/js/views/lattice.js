/*
 * views/lattice.js — "Lattice": the log-theta-lattice built by the engine (`iut walk --json`), drawn on a
 * canvas you can click: a vertex opens its Hodge theater (capsules, strips with copy ids, pilots,
 * log-shells), a link opens its record (what is coric, what is dilated).  A "build" animation applies the
 * log-links and the Θ-link one at a time, in the order the C program applies them.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, DG = root.DIAG, D = root.DRAW, el = U.el, esc = U.esc, fmt = D.fmt;

  var state = { focus: [0, 0], selLink: null, revealed: null, tab: 'ht', timer: null };
  var container, cv, insp, geo;

  function render(c) {
    container = c; U.clear(c);
    c.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Lattice explorer' }),
      el('p', { class: 'lead', html: 'The log-theta-lattice as the engine builds it (<code>iut walk</code>): the "infinite H" — columns (0,◦) and (1,◦) joined by one Θ-link — with the number of rows and the horizontal link flavour chosen below. Click a vertex • for its Hodge theater, click an arrow for the link record, or press <b>build</b> to watch the links being applied one at a time.' })
    ]));
    var layout = el('div', { class: 'lattice-layout' });
    var left = el('div', { class: 'card' });
    var s = M.get();
    var controls = el('div', { class: 'controls' });
    var rowsSel = el('select', {}, [1, 2, 3, 4, 5, 6].map(function (r) { return el('option', { value: r, text: r + (r === 1 ? ' row' : ' rows') + ' each way', selected: r === s.rows ? '' : null }); }));
    rowsSel.addEventListener('change', function () { M.set({ rows: +rowsSel.value }); });
    var horSel = el('select', {}, M.HORIZONTAL.map(function (h) { return el('option', { value: h.key, text: h.label, selected: h.key === s.horizontal ? '' : null }); }));
    horSel.addEventListener('change', function () { M.set({ horizontal: horSel.value }); });
    controls.appendChild(el('label', {}, ['rows ', rowsSel]));
    controls.appendChild(el('label', {}, ['horizontal link ', horSel]));
    controls.appendChild(el('button', { class: 'primary', text: '▶ build step by step', onclick: build }));
    controls.appendChild(el('button', { text: 'show all', onclick: function () { stop(); state.revealed = null; draw(); } }));
    left.appendChild(controls);
    cv = el('canvas', { class: 'diagram', style: 'cursor:pointer' });
    cv.addEventListener('click', onClick);
    left.appendChild(cv);
    left.appendChild(el('div', { class: 'legend', html: '<span><i style="background:#2563eb"></i>log-link (n,m) → (n,m+1): Π_v kept, monoids renewed, log-shells built at the codomain</span><span><i style="background:#ea580c"></i>Θ-link (0,0) → (1,0): G_v, O×μ shared up to Ind1/Ind2, Π_v and rings alien</span><span><i style="background:#17202d"></i>• = codomain of a log-link (carries log-shells I_v)</span><span><i style="background:#7c3aed"></i>focus</span>' }));
    left.appendChild(el('div', { id: 'lattice-build-msg', class: 'small muted' }));
    layout.appendChild(left);
    insp = el('div', { class: 'inspector card' });
    layout.appendChild(insp);
    c.appendChild(layout);
    draw(); renderInspector();
  }

  function w() { return M.walk(); }

  function visible(kind, obj, i) {
    if (!state.revealed) return true;
    if (kind === 'link') return i < state.revealed.links;
    return state.revealed.hts.indexOf(obj.n + ',' + obj.m) >= 0;
  }

  function draw() {
    var W = w();
    var idx = state.selLink;
    geo = DG.lattice(cv, W, { focus: state.focus, selectedLink: idx, shells: true, visible: visible, width: 760 });
  }

  function onClick(ev) {
    var rect = cv.getBoundingClientRect(), sx = 760 / rect.width;
    var x = (ev.clientX - rect.left) * sx, y = (ev.clientY - rect.top) * sx;
    var W = w(), best = null, bd = 1e9;
    W.HodgeTheaters.forEach(function (h) { var dx = geo.X(h.n) - x, dy = geo.Y(h.m) - y, d = Math.sqrt(dx * dx + dy * dy); if (d < bd) { bd = d; best = { ht: h }; } });
    if (bd > 22) {
      /* a link? distance to the segment midpoint */
      bd = 1e9;
      W.links.forEach(function (l, i) { var mx = (geo.X(l.dom[0]) + geo.X(l.cod[0])) / 2, my = (geo.Y(l.dom[1]) + geo.Y(l.cod[1])) / 2, d = Math.sqrt((mx - x) * (mx - x) + (my - y) * (my - y)); if (d < bd) { bd = d; best = { link: i }; } });
      if (bd > 40) return;
    }
    if (best.ht) { state.focus = [best.ht.n, best.ht.m]; state.selLink = null; state.tab = state.tab === 'link' ? 'ht' : state.tab; }
    else { state.selLink = best.link; state.tab = 'link'; }
    draw(); renderInspector();
  }

  function build() {
    stop();
    var W = w();
    /* order: the C program creates (0,0), applies log-links down/up the 0-column, the Θ-link, then the 1-column */
    var hts = W.HodgeTheaters.map(function (h) { return h.n + ',' + h.m; });
    state.revealed = { hts: ['0,0'], links: 0 };
    var msg = document.getElementById('lattice-build-msg');
    var steps = [];
    W.links.forEach(function (l, i) { steps.push({ links: i + 1, add: l.cod[0] + ',' + l.cod[1], text: (l.species === 'LogLink' ? 'apply the log-link (' + l.dom.join(',') + ') → (' + l.cod.join(',') + '): Π_v kept, O renewed, log-shells built' : 'apply the ' + l.notation + ' (' + l.dom.join(',') + ') → (' + l.cod.join(',') + '): G_v, O×μ glued; Π_v alien; value groups dilated by ' + fmt(l.dilation)) }); });
    var k = 0;
    draw(); msg.textContent = 'step 0: the Hodge theater †HT at (0,0), universe #1';
    state.timer = setInterval(function () {
      if (k >= steps.length) { stop(); msg.textContent += '  —  built: ' + hts.length + ' Hodge theaters, ' + W.links.length + ' links.'; return; }
      var s = steps[k++];
      state.revealed.links = s.links;
      if (state.revealed.hts.indexOf(s.add) < 0) state.revealed.hts.push(s.add);
      msg.textContent = 'step ' + k + ': ' + s.text;
      draw();
    }, 900);
  }
  function stop() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }

  function stripRow(name, strip, g) {
    var det = el('details', {}, [el('summary', { html: '<b>' + esc(name) + '</b> <span class="muted">' + esc(strip.notation) + '-prime-strip "' + esc(strip.label) + '", ' + (strip.etaleLike ? 'étale-like' : 'Frobenius-like') + ', ' + (strip.monoAnalytic ? 'mono-analytic' : 'holomorphic') + (strip.global ? ', degree ' + fmt(strip.globalDegree) : '') + '</span>' })]);
    det.appendChild(U.canvas(function (cv) { DG.primeStrip(cv, strip, g); }));
    return det;
  }

  function renderInspector() {
    U.clear(insp);
    var W = w(), g = W.data, f = state.focus, ht = M.hodgeTheaterAt(W, f[0], f[1]);
    var tabs = el('div', { class: 'tabs' });
    [['ht', 'Hodge theater'], ['strips', 'prime-strips'], ['shells', 'log-shells & pilots'], ['link', 'link'], ['alien', 'alien copies'], ['multi', 'multiradial'], ['etale', 'étale-picture'], ['report', 'validation']].forEach(function (t) {
      tabs.appendChild(el('button', { class: t[0] === state.tab ? 'active' : '', text: t[1], onclick: function () { state.tab = t[0]; renderInspector(); } }));
    });
    insp.appendChild(tabs);
    var body = el('div');
    insp.appendChild(body);
    if (state.tab === 'ht' && ht) {
      body.appendChild(el('h3', { html: esc(ht.copy === 'Dag' ? '†HT' : ht.copy === 'Ddag' ? '‡HT' : '{' + ht.n + ',' + ht.m + '}HT') + ' <span class="muted small">at (' + ht.n + ',' + ht.m + '), universe #' + ht.universe + ', log-iterate ' + ht.logIterate + '</span>' }));
      body.appendChild(U.canvas(function (cv) { DG.hodgeTheater(cv, ht, g); }));
      body.appendChild(U.kv([
        ['capsule F_T', ht.ThetaPmEllHodgeTheater.capsuleFT.length + ' strips, t ∈ F_l, basepoints #' + ht.ThetaPmEllHodgeTheater.capsuleFT[0].basepoint + '…'],
        ['capsule F_J', ht.ThetaNFHodgeTheater.capsuleFJ.length + ' strips, j ∈ F_l^*'],
        ['bridges', 'Θ± ' + (ht.ThetaPmEllHodgeTheater.ThetaPmBridge ? '✓' : '✗') + '  Θell ' + (ht.ThetaPmEllHodgeTheater.ThetaEllBridge ? '✓' : '✗') + '  Θ ' + (ht.ThetaNFHodgeTheater.ThetaBridge ? '✓' : '✗') + '  NF ' + (ht.ThetaNFHodgeTheater.NFBridge ? '✓' : '✗')],
        ['glued 0,⊞ ↦ >', ht.glued ? 'yes' : 'no'],
        ['Θ̲_v(j) = q̲^{j²}', ht.ThetaNFHodgeTheater.ThetaHodgeTheater.thetaValues.join(', ')],
        ['incoming log-link', ht.hasIncomingLog ? 'yes: ' + ht.LogShell.length + ' log-shells' : 'no (no log-shells at this vertex)'],
        ['links here', M.linksOf(W, ht.n, ht.m).map(function (l) { return l.notation + ' (' + l.dom.join(',') + ')→(' + l.cod.join(',') + ')'; }).join('; ')]
      ]));
    } else if (state.tab === 'strips' && ht) {
      body.appendChild(el('h3', { text: 'the prime-strips of ' + (ht.copy || '') }));
      body.appendChild(el('p', { class: 'small muted', text: 'copy ids make coricity literal: compare Π_v / G_v / O ids with the neighbouring vertices.' }));
      var pm = ht.ThetaPmEllHodgeTheater, nf = ht.ThetaNFHodgeTheater;
      [['F_⊞', pm.FBoxPlus], ['D_⊚±', pm.DCircDotPm], ['F_>', nf.FGt], ['F_⊛', nf.FCircAst], ['F⊩_mod', nf.ThetaHodgeTheater.FMonoGlobMod], ['F⊩_tht', nf.ThetaHodgeTheater.FMonoGlobTht], ['F⊩_Δ', ht.FMonoGlobTriangle], ['F⊩_env', ht.FMonoGlobEnv], ['F⊩_gau', ht.FMonoGlobGau], ['F⊩_LGP', ht.FMonoGlobLGPTorsor], ['F⊩_lgp', ht.FMonoGlobLgpIdeal]].forEach(function (p) { if (p[1]) body.appendChild(stripRow(p[0], p[1], g)); });
    } else if (state.tab === 'shells' && ht) {
      body.appendChild(U.canvas(function (cv) { DG.pilots(cv, ht, g); }));
      if (ht.hasIncomingLog) body.appendChild(U.canvas(function (cv) { DG.logShells(cv, ht.LogShell, g); }));
      else body.appendChild(el('p', { class: 'callout blue', text: 'This vertex is not the codomain of a log-link, so it carries no log-shells yet: apply a log-link into it (add rows) — [IUTchIII] Def 3.8 (ii) needs the log-shells of (n, m−1) to define the Θ×μ_LGP-link out of (n, m).' }));
    } else if (state.tab === 'link') {
      var lk = state.selLink != null ? W.links[state.selLink] : W.links.filter(function (l) { return l.species !== 'LogLink'; })[0];
      if (!lk) { body.appendChild(el('p', { text: 'click an arrow' })); }
      else {
        body.appendChild(el('h3', { html: esc(lk.notation) + ' <span class="muted small">(' + lk.dom.join(',') + ') → (' + lk.cod.join(',') + ')</span>' }));
        var dom = M.hodgeTheaterAt(W, lk.dom[0], lk.dom[1]), cod = M.hodgeTheaterAt(W, lk.cod[0], lk.cod[1]);
        if (lk.species !== 'LogLink') body.appendChild(U.canvas(function (cv) { DG.thetaLink(cv, dom, cod, lk, g); }));
        body.appendChild(U.kv([
          ['species', el('span', {}, [U.identPill(lk.species)])], ['glued prime-strips', el('span', {}, [U.identPill(lk.glued)])], ['full poly-isomorphism', lk.fullPolyIsomorphism ? 'yes' : 'no'],
          ['Π_v identified', lk.preservesPiV ? 'yes (vertical coricity)' : 'NO — mutually alien copies'], ['G_v identified', lk.preservesGV ? 'yes (up to Aut(G_v): Ind1)' : 'no'],
          ['O×μ identified', lk.preservesUnitsModTors ? 'yes (up to Ism: Ind2)' : 'no — the log-link renews the monoids'], ['ring structure', lk.preservesRing ? 'yes' : 'never'], ['dilation of value groups', fmt(lk.dilation, 4) + (lk.species === 'LogLink' ? '' : ' = l(l+1)/12')]
        ]));
        if (lk.species === 'LogLink' && cod) body.appendChild(U.canvas(function (cv) { DG.logShells(cv, cod.LogShell, g); }));
      }
    } else if (state.tab === 'alien') {
      var sec = M.walkSections().filter(function (s) { return /^Mutually alien/.test(s.title); })[0];
      body.appendChild(el('h3', { text: 'mutually alien copies across the Θ-link' }));
      if (sec) body.appendChild(U.transcript(sec.title + '\n' + sec.lines.join('\n')));
    } else if (state.tab === 'multi') {
      var sec2 = M.walkSections().filter(function (s) { return /^Multiradial/.test(s.title); })[0];
      body.appendChild(el('h3', { text: 'multiradial representation and the log-volume estimate' }));
      if (sec2) { body.appendChild(U.canvas(function (cv) { DG.multiradial(cv, g, sec2.lines); })); body.appendChild(U.transcript(sec2.title + '\n' + sec2.lines.join('\n'))); }
    } else if (state.tab === 'etale') {
      var sec3 = M.walkSections().filter(function (s) { return /^Étale-picture/.test(s.title); })[0];
      body.appendChild(U.canvas(function (cv) { DG.etalePicture(cv, W); }));
      if (sec3) body.appendChild(U.transcript(sec3.title + '\n' + sec3.lines.join('\n')));
    } else if (state.tab === 'report') {
      var sec4 = M.walkSections().filter(function (s) { return /^Validation report/.test(s.title); })[0];
      body.appendChild(el('h3', { text: 'validation of the data and the lattice' }));
      if (sec4) body.appendChild(U.transcript(sec4.title + '\n' + sec4.lines.join('\n')));
    } else body.appendChild(el('p', { class: 'muted', text: 'click a vertex of the lattice' }));
  }

  function onChange() { stop(); state.revealed = null; state.selLink = null; if (container && container.classList.contains('active')) render(container); }
  root.VIEW_LATTICE = { render: render, onChange: onChange };
})(typeof window !== 'undefined' ? window : globalThis);
