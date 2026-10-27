/*
 * views/types.js — "Data types": every mathematical object of the model in its form.
 * Feature cards (a diagram + the live instance computed by the engine + the C struct), then the
 * complete catalogue of the 448 identifiers grouped by kind, each with the struct(s) implementing it.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, DG = root.DIAG, el = U.el, esc = U.esc;

  var KIND_ORDER = ['datum', 'set', 'field', 'curve', 'cusp', 'constant', 'labelset', 'label', 'symmetry', 'group', 'anabelioid', 'category', 'monoid', 'frobenioid', 'morphism', 'map', 'primestrip', 'structure', 'capsule', 'bridge', 'gluing', 'hodgetheater', 'link', 'lattice', 'diagram', 'logshell', 'pilot', 'indeterminacy', 'property', 'quantity', 'theorem', 'species', 'mutation', 'symbol', 'process'];
  var KIND_TITLES = {
    datum: 'data and initial Θ-data', set: 'sets of valuations', field: 'fields', curve: 'curves and orbicurves', cusp: 'cusps', constant: 'constants', labelset: 'label sets', label: 'labels',
    symmetry: 'symmetries', group: 'groups', anabelioid: 'anabelioids', category: 'base categories', monoid: 'monoids and pseudo-monoids', frobenioid: 'Frobenioids', morphism: 'poly-morphisms',
    map: 'maps', primestrip: 'prime-strips', structure: 'structures', capsule: 'capsules', bridge: 'bridges', gluing: 'gluing', hodgetheater: 'Hodge theaters', link: 'links', lattice: 'lattices',
    diagram: 'pictures', logshell: 'log-shells', pilot: 'pilot objects', indeterminacy: 'indeterminacies', property: 'properties', quantity: 'quantities', theorem: 'theorems and definitions',
    species: 'species', mutation: 'mutations', symbol: 'symbols of the notation', process: 'processes (see the Processes view)'
  };

  function card(opt) {
    var c = el('div', { class: 'card' });
    var h = el('h3', {}, [el('span', { class: 'notation', text: opt.notation })]);
    (opt.ids || []).forEach(function (id) { h.appendChild(U.identPill(id)); });
    c.appendChild(h);
    if (opt.ref) c.appendChild(el('div', { class: 'ref', text: opt.ref }));
    if (opt.desc) c.appendChild(el('p', { class: 'desc', html: opt.desc }));
    if (opt.diagram) c.appendChild(U.canvas(opt.diagram));
    if (opt.body) (Array.isArray(opt.body) ? opt.body : [opt.body]).forEach(function (b) { if (b) c.appendChild(b); });
    if (opt.live) { var lv = el('div', { class: 'live' }, [el('div', { class: 'lhead', text: 'live instance from the engine (' + esc(M.dataLabel()) + ')' })]); (Array.isArray(opt.live) ? opt.live : [opt.live]).forEach(function (b) { if (b) lv.appendChild(b); }); c.appendChild(lv); }
    var structs = []; (opt.ids || []).forEach(function (id) { M.structsFor(id).forEach(function (s) { if (structs.indexOf(s) < 0) structs.push(s); }); });
    if (opt.structs) opt.structs.forEach(function (n) { var s = M.types().structs.filter(function (x) { return x.name === n; })[0] || M.types().enums.filter(function (x) { return x.name === n; })[0]; if (s && structs.indexOf(s) < 0) structs.unshift(s); });
    if (structs.length) {
      var det = el('details', {}, [el('summary', { text: 'form: ' + structs.map(function (s) { return s.name; }).join(', ') })]);
      structs.forEach(function (s) { det.appendChild(U.form(s)); });
      c.appendChild(det);
    }
    return c;
  }

  function transcriptTable(id, opt) {
    /* the body lines of a process as a transcript block */
    var r = M.run(id);
    var lines = r.out.split('\n').filter(function (l) { return /^\s{4}/.test(l); });
    return U.transcript(lines.join('\n'), opt);
  }

  function render(container) {
    U.clear(container);
    var g = M.gen(), w = M.walk(), ht00 = M.hodgeTheaterAt(w, 0, 0), ht01 = M.hodgeTheaterAt(w, 0, 1), ht10 = M.hodgeTheaterAt(w, 1, 0);
    var thetaLk = w.links.filter(function (l) { return l.species !== 'LogLink'; })[0];
    var val = M.validate();
    var secs = M.walkSections();
    function section(title) { return (secs.filter(function (s) { return s.title.indexOf(title) === 0; })[0] || { lines: [] }).lines; }

    container.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Data types' }),
      el('p', { class: 'lead', html: 'Every mathematical object that inter-universal Teichmüller theory manipulates is a C struct in <code>src/iut.h</code>, <code>src/iut_i.h</code> and <code>src/iut_ops.h</code>, with a letters-only identifier. Each card below shows the object as a diagram, its <em>live instance</em> computed by the engine from the Θ-data selected above, and its <em>form</em> (the struct, field by field). The complete catalogue of all ' + M.ids().length + ' identifiers follows, grouped by kind.' })
    ]));

    var feats = el('div', { class: 'grid cols-2' });

    feats.appendChild(card({
      notation: 'initial Θ-data  (F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)', ids: ['InitialThetaData', 'VSet', 'VBadMod', 'LPrime', 'EpsilonUnder'], ref: '[IUTchI] Def 3.1; [Alien] §3.3 (i)',
      desc: 'The input of the whole theory: a number field tower F_mod ⊆ F ⊆ K = F(E[l]) ⊆ F̄, an elliptic curve E_F with its once-punctured curve X_F, a prime l ≥ 5, the hyperbolic orbicurve C_K, a set of valuations V ≅ V_mod and the bad places V^bad_mod. From an abc triple the Frey curve y² = x(x−a)(x+b) supplies all of it.',
      diagram: function (cv) { DG.thetaData(cv, g); },
      live: [U.kv([['name', g.name], ['curve', g.curve], ['l, l*, l±', g.l + ', ' + g.LStar + ', ' + g.LPm], ['|V|, |V^bad_mod|', g.VSet.length + ', ' + g.VSet.filter(function (v) { return v.inVBadMod; }).length], ['log q, log f', root.DRAW.fmt(g.logQ) + ', ' + root.DRAW.fmt(g.logF)], ['validation', val.errors + ' error(s), ' + val.warnings + ' warning(s), ' + val.issues.length + ' checks']])]
    }));

    feats.appendChild(card({
      notation: 'label sets  F_l ⊇ F_l^× ↠ F_l^*,  |F_l|', ids: ['Fl', 'FlAbs', 'FlStar', 'FlUnits', 'FlSemiPm', 'FlStarSym'], ref: '[IUTchI] §4–§6, Def 6.13; [Pano] §3',
      desc: 'The Θ±ell-side is indexed by F_l with the <em>additive</em> symmetry F_l^{⋊±} = F_l ⋊ {±1}; the ΘNF-side by F_l^* = F_l^×/{±1} with the <em>multiplicative</em> symmetry F_l^*. The fold t ↦ |t| and the gluing 0, ⊞ ↦ > connect them.',
      diagram: function (cv) { DG.labels(cv, g); },
      live: transcriptTable('ActSymmetries')
    }));

    feats.appendChild(card({
      notation: 'prime-strips (nine kinds) and the forgetful ladder', ids: ['FPrimeStrip', 'DPrimeStrip', 'DMonoPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoGlobValUnitsModTorsPrimeStrip'], ref: '[IUTchI] Fig I1.2, Def 4.1, Def 5.2; [IUTchII] Def 4.9; [IUTchIII] Thm 1.5',
      desc: 'A prime-strip is a collection of local data indexed by v ∈ V: the fundamental group Π_v or its quotient G_v (étale-like) and the monoid O▷, O×, O×μ with or without its value group O▶ (Frobenius-like). Forgetting structure moves down the ladder; D⊢ = {G_v} is <em>bi-coric</em>, F⊢×μ horizontally coric, D vertically coric.',
      diagram: function (cv) { DG.ladder(cv, g); },
      live: U.canvas(function (cv) { DG.primeStrip(cv, ht00.ThetaNFHodgeTheater.FGt, g, { note: 'F_> of †HT: holomorphic, Frobenius-like, with the copy ids of Π_v, G_v, O× at every v' }); })
    }));

    feats.appendChild(card({
      notation: 'the local datum at v:  Π_v ↠ G_v ↷ O▷ = O× × O▶,  O×μ = O×/Oμ', ids: ['PiV', 'GV', 'OValV', 'OUnitsV', 'OUnitsModTorsV', 'OValgroupV', 'UnitsModTorsKummer', 'QUnderV'], ref: '[IUTchI] Def 3.1, Ex 3.2–3.4; [IUTchII] Def 4.9',
      desc: 'At each valuation the program records <em>copy ids</em>: two objects are "the same copy" exactly when their ids agree. Along a log-link the Π_v id is kept and the monoid id is renewed; across a Θ-link only G_v and O×μ ids are shared. Value groups are measured in units of ord(q̲_v), q̲_v = q_v^{1/2l}.',
      diagram: function (cv) { DG.primeStrip(cv, ht00.FMonoGlobLGPTorsor, g, { note: 'F⊩_LGP of †HT: mono-analytic, carries the Θ-pilot {q̲^{j²}} at v ∈ V^bad' }); },
      live: transcriptTable('BuildLocalFrobenioids', { maxLines: 16 })
    }));

    feats.appendChild(card({
      notation: 'Θ±ell NF-Hodge theater  †HT = Θ±ell-HT ⊔_{0,⊞↦>} ΘNF-HT', ids: ['ThetaPmEllNFHodgeTheater', 'ThetaPmEllHodgeTheater', 'ThetaNFHodgeTheater', 'ThetaHodgeTheater', 'GluingZeroBoxPlusToGt'], ref: '[IUTchI] Def 6.13; [Alien] §3.3 (v) Fig 3.8; [Pano] §3',
      desc: 'A vertex • of the lattice. Left: the capsule F_T of F-prime-strips indexed by F_l with the Θ±-bridge to F_⊞ and the Θell-bridge to D_⊚± (Π_{X̲_K}). Right: the capsule F_J indexed by F_l^* with the Θ-bridge to F_> and the NF-bridge to F_⊛ (Π_{C_K} ↷ F_mod^×), containing the Θ-Hodge theater (F⊩_mod, F⊩_tht). Glued along 0, ⊞ ↦ >.',
      diagram: function (cv) { DG.hodgeTheater(cv, ht00, g); },
      live: transcriptTable('ForgetToDHodgeTheater')
    }));

    feats.appendChild(card({
      notation: 'capsules, bridges and their isomorphism torsors', ids: ['FT', 'FJ', 'Capsule', 'ThetaPmBridge', 'ThetaEllBridge', 'ThetaBridge', 'NFBridge'], ref: '[IUTchI] Def 4.6, 5.5, 6.4, 6.11; Prop 4.8, Prop 6.6',
      desc: 'A capsule is a finite collection of prime-strips with pairwise distinct basepoints. A bridge is a poly-morphism from a capsule to a single strip; its isomorphisms form a torsor over the symmetry group of the side: {±1} × {±1}^V and F_l^{⋊±} on the Θ±ell-side, trivial and F_l^* on the ΘNF-side.',
      diagram: function (cv) { DG.bridges(cv, U.procLines('BuildBridges')); },
      live: transcriptTable('CountIsomorphismTorsors')
    }));

    feats.appendChild(card({
      notation: 'processions  S_1 ⊂ … ⊂ S_{l*},  S±_1 ⊂ … ⊂ S±_{l±}', ids: ['Procession', 'SPmJPlusOne', 'SJPlusOne', 'IndOne'], ref: '[IUTchI] Prop 4.11, Prop 6.9; [IUTchIII] §3',
      desc: 'Processions cut the (l±)^{l±} label assignments of a capsule down to l±! — the price is the (Ind1) indeterminacy: each S±_{j+1} = {0, …, j} may be permuted. The tensor packets of log-shells are indexed by these capsules.',
      diagram: function (cv) { DG.procession(cv, g); },
      live: transcriptTable('CountForgottenSymmetries')
    }));

    feats.appendChild(card({
      notation: 'pilot objects:  q-pilot {q̲_v},  Θ-pilot {q̲_v^{j²}}', ids: ['QPilot', 'ThetaPilot', 'FMonoGlobTriangle', 'FMonoGlobLGPTorsor', 'ThetaDilation'], ref: '[IUTchIII] Def 3.8 (i); [IUTchII] Cor 4.10',
      desc: 'The q-pilot lives in F⊩_Δ (labels 0 and F_l^* identified), the Θ-pilot in F⊩_gau ≅ F⊩_LGP. The Θ-link glues the Θ-pilot of †HT to the q-pilot of ‡HT: the value groups are "dilated" by l(l+1)/12 = (1/l*)Σj².',
      diagram: function (cv) { DG.pilots(cv, ht00, g); },
      live: transcriptTable('MakePilots')
    }));

    feats.appendChild(card({
      notation: 'links:  log-link (vertical),  Θ-link and its flavours (horizontal)', ids: ['LogLink', 'ThetaLink', 'ThetaUnitsModTorsLink', 'ThetaUnitsModTorsGauLink', 'ThetaUnitsModTorsLGPTorsorLink', 'ThetaUnitsModTorsLgpIdealLink', 'AlienCopy'], ref: '[IUTchIII] Def 1.1, Prop 1.3, Def 3.8; [IUTchI] Cor 3.7; [IUTchII] Cor 4.10',
      desc: 'A link records what is identified (coric) and what is not. The log-link keeps every Π_v (vertical coricity) and renews the monoids; the Θ-link keeps G_v and O×μ (up to Ind1, Ind2), dilates the value groups and never identifies Π_v or the ring structures: the two sides are <em>mutually alien copies</em>.',
      diagram: function (cv) { DG.thetaLink(cv, ht00, ht10, thetaLk, g); },
      live: U.table(['link', 'from → to', 'glued strip', 'Π_v', 'G_v', 'O×μ', 'ring', 'dilation'], w.links.map(function (l) { return [esc(l.notation), '(' + l.dom.join(',') + ') → (' + l.cod.join(',') + ')', esc(l.glued), l.preservesPiV ? '✓' : '✗', l.preservesGV ? '✓' : '✗', l.preservesUnitsModTors ? '✓' : '✗', l.preservesRing ? '✓' : '✗', root.DRAW.fmt(l.dilation)]; }))
    }));

    feats.appendChild(card({
      notation: 'the log-theta-lattice and the infinite H', ids: ['LogThetaLattice', 'InfiniteH', 'NCircColumn', 'Bullet', 'LGPTorsorGaussianLogThetaLattice'], ref: '[IUTchIII] Def 1.4, Def 3.8 (iii), Fig I.1; [Alien] Fig 3.6; [EssLgc] §3.10',
      desc: 'Vertices {n,m}HT for (n,m) ∈ Z², vertical arrows log-links, horizontal arrows Θ×μ_LGP-links. The squares do not commute. The proof of Cor 3.12 only uses columns (0,◦), (1,◦) and the single Θ-link (0,0) → (1,0): the H. Explore it live in the Lattice view.',
      diagram: function (cv) { DG.lattice(cv, w, { focus: [0, 0], shells: true, H: true }); },
      live: U.kv([['horizontal flavour', M.horizontalInfo().label + ' (' + esc(w.horizontal) + ')'], ['vertices', w.HodgeTheaters.length + ' Hodge theaters, universes #1…#' + w.HodgeTheaters.length], ['links', w.links.filter(function (l) { return l.species === 'LogLink'; }).length + ' log-links, ' + w.links.filter(function (l) { return l.species !== 'LogLink'; }).length + ' Θ-link']])
    }));

    feats.appendChild(card({
      notation: 'log-shells  I_v = (p*)⁻¹ · log(O×_{K_v})', ids: ['LogShell', 'HolLogShell', 'MonoLogShell', 'EtLogShell', 'PStar', 'LogVolume'], ref: '[IUTchIII] Def 1.1 (i), Prop 1.2; [IUTchIV] Prop 1.2, 1.4; [AbsTopIII] Def 5.4 (iii)',
      desc: 'The log-link constructs, at its codomain, the log-shell at every v: a compact module containing log(O×), with p* = p for odd p and p² for p = 2. Its normalized log-volume μ_log is what the final estimate adds up. All four constructions (from F, F⊢×μ, D⊢, D) give isomorphic shells.',
      diagram: function (cv) { DG.logShells(cv, ht01 ? ht01.LogShell : [], g); },
      live: transcriptTable('MakeLogShells', { maxLines: 12 })
    }));

    feats.appendChild(card({
      notation: 'the three indeterminacies  (Ind1), (Ind2), (Ind3)', ids: ['IndOne', 'IndTwo', 'IndThree', 'KummerDetachment', 'UpperSemiCompatibility'], ref: '[IUTchIII] Thm 3.11; [Alien] §3.7 (i); [EssLgc] §3.10',
      desc: 'The price of comparing the two sides of a Θ-link through the étale-like core: permutations of processions and Aut(G_v), the Ism-orbits on units modulo torsion, and the one-sided compatibility of the log-Kummer correspondence.',
      diagram: function (cv) { DG.indeterminacies(cv, g); },
      live: transcriptTable('Fuzzify')
    }));

    feats.appendChild(card({
      notation: 'multiradial representation  R^LGP_{n,◦}', ids: ['MultiradialRepresentation', 'TensorPacket', 'HolomorphicHull', 'CTheta', 'AbsLogTheta', 'CorThreeTwelve'], ref: '[IUTchIII] Thm 3.11, Cor 3.12; [IUTchIV] Thm 1.10; [Alien] §3.7',
      desc: '(a) tensor packets of log-shells over the processions, (b) the splitting monoids of the LGP-monoids, (c) copies of F_mod^× — the Θ-pilot of (0,◦) described in terms of the mono-analytic data of (1,◦), up to Ind1–3. Its log-volume bounds −|log Θ| from above, and −|log Θ| ≥ −|log q| follows.',
      diagram: function (cv) { DG.multiradial(cv, g, section('Multiradial representation')); },
      live: transcriptTable('RepresentMultiradially')
    }));

    feats.appendChild(card({
      notation: 'étale-picture and Frobenius-picture', ids: ['EtalePicture', 'FrobeniusPicture', 'BiCoric', 'VerticallyCoric', 'HorizontallyCoric'], ref: '[IUTchI] Cor 3.8, 4.12, 6.10; [IUTchIII] Thm 1.5, Cor 3.12',
      desc: 'The Frobenius-picture is the chain … → †HT → ‡HT → … of Θ-linked theaters (Z-translation symmetric, no swaps). The étale-picture puts the bi-coric D⊢-prime-strip at the centre and every D-Hodge theater as a spoke; spokes may be permuted.',
      diagram: function (cv) { DG.etalePicture(cv, w); },
      live: transcriptTable('CheckBicoric')
    }));

    feats.appendChild(card({
      notation: 'species and mutations', ids: ['ZeroSpecies', 'Mutation', 'MutationHistory', 'Core', 'Observable', 'AlienCopy'], ref: '[IUTchIV] §3 Def 3.1, Def 3.3',
      desc: 'A species is a set-theoretic formula for a type of object; a mutation a species-theoretic functor. The toolkit takes this literally: species = C structs, mutations = C functions, and the lattice is the mutation-history. A core is an observable all of whose arrows are isomorphisms (D⊢, F⊢×μ, D-HT).',
      diagram: function (cv) { DG.species(cv, M.speciesText()); },
      live: transcriptTable('OperateSpecies')
    }));

    feats.appendChild(card({
      notation: 'the finer objects of [IUTchI]: pseudo-monoids, orbicurves, cusps, global Frobenioids', ids: ['PseudoMonoid', 'MCircAst', 'XUnderK', 'CuspEpsilon', 'FCircAstGlobal', 'DCircAstGlobal', 'LabCusp'], ref: '[IUTchI] §0–§6',
      desc: 'IUT I introduces many objects the later papers only recall: the pseudo-monoids M^⊛, M^⊛_mod, M^⊛_κ, … with the Kummer-ready / Kummer-blind distinction, the orbicurves X, C, X̲, C̲, X→, C→, X̲̲_v, the cusps ε, ε′, ε″, 2ε, the global Frobenioids F^⊛, F^⊛_mod, the torsors LabCusp and LabCusp±. All are in the catalogue below and exercised by the [IUTchI] processes.',
      body: [transcriptTable('ClassifyPseudoMonoids', { maxLines: 14 }), transcriptTable('ClassifyOrbicurves', { maxLines: 10 })]
    }));

    container.appendChild(feats);

    /* ---- the complete catalogue */
    container.appendChild(el('div', { class: 'section-title' }, [el('h2', { text: 'The complete catalogue' }), el('span', { class: 'count', text: M.ids().length + ' identifiers in ' + KIND_ORDER.length + ' kinds — generated from src/iut_ids.c' })]));
    container.appendChild(el('p', { class: 'muted', html: 'Every identifier matches <code>^[A-Za-z]+$</code> (unique case-insensitively): † → Dag, ‡ → Ddag, ⊢ → Mono, ⊩ → MonoGlob, ×μ → UnitsModTors, ⊞ → BoxPlus, > → Gt, Δ → Triangle, … Click an identifier anywhere in the app for its citation, description and form.' }));
    var byKind = {};
    M.ids().forEach(function (i) { (byKind[i.kind] = byKind[i.kind] || []).push(i); });
    KIND_ORDER.forEach(function (k) {
      var list = byKind[k]; if (!list) return;
      var det = el('details', { class: 'card flat', open: ['primestrip', 'hodgetheater', 'link', 'lattice', 'pilot', 'logshell', 'indeterminacy'].indexOf(k) >= 0 ? '' : null });
      det.appendChild(el('summary', { html: '<b>' + esc(KIND_TITLES[k] || k) + '</b> <span class="muted">· ' + list.length + '</span>' }));
      var grid = el('div', { class: 'grid cols-3', style: 'margin-top:10px' });
      list.forEach(function (i) {
        var c = el('div', { class: 'card flat', style: 'padding:10px 12px' });
        c.appendChild(el('h4', { html: '<span class="id-notation">' + esc(i.notation) + '</span>' }));
        c.appendChild(el('div', {}, [U.identPill(i.id), el('span', { class: 'ref', text: ' ' + i.ref })]));
        c.appendChild(el('div', { class: 'desc small', text: i.desc }));
        var structs = M.structsFor(i.id);
        if (structs.length) { var d2 = el('details', {}, [el('summary', { text: 'form: ' + structs.map(function (s) { return s.name; }).join(', ') })]); structs.forEach(function (s) { d2.appendChild(U.form(s)); }); c.appendChild(d2); }
        if (i.kind === 'process') c.appendChild(el('a', { href: '#processes/' + i.id, class: 'small', text: 'run →' }));
        grid.appendChild(c);
      });
      det.appendChild(grid);
      container.appendChild(det);
    });
    /* structs that implement no identifier (bookkeeping) */
    var rest = M.types().structs.filter(function (s) { return !s.idents.length; });
    if (rest.length) {
      var det2 = el('details', { class: 'card flat' }, [el('summary', { html: '<b>auxiliary structs</b> <span class="muted">· ' + rest.length + ' (reports, rationals, options, step tables)</span>' })]);
      rest.forEach(function (s) { det2.appendChild(U.form(s)); });
      container.appendChild(det2);
    }
  }

  root.VIEW_TYPES = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
