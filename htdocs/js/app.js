/*
 * app.js — bootstrap: load the engine, build the navigation and the "dataset bench" (which Θ-data the
 * whole page works on), route the hash to a view, re-render views when the data changes.
 *
 *   #types                    data types (diagram + live instance + C form)        views/types.js
 *   #processes/<id>           the 73 processes, run live                          views/procs.js
 *   #lattice                  the log-theta-lattice explorer                      views/lattice.js
 *   #examples/<key>/<step>    worked examples, step by step                       views/examples.js
 *   #identifiers/<id>         the 448 identifiers                                 views/ids.js
 */
(function (root) {
  'use strict';
  var IUT = root.IUT, M = root.MODEL, U = root.UI, el = U.el;

  var VIEWS = [
    { key: 'home', label: 'Overview', view: null },
    { key: 'types', label: 'Data types', view: function () { return root.VIEW_TYPES; } },
    { key: 'processes', label: 'Processes', view: function () { return root.VIEW_PROCS; } },
    { key: 'lattice', label: 'Lattice', view: function () { return root.VIEW_LATTICE; } },
    { key: 'examples', label: 'Worked examples', view: function () { return root.VIEW_EXAMPLES; } },
    { key: 'identifiers', label: 'Identifiers', view: function () { return root.VIEW_IDS; } }
  ];
  var rendered = {}, current = null, els = {};

  function $(id) { return document.getElementById(id); }

  /* ---------------------------------------------------------------- dataset bench */
  function buildBench() {
    var bench = $('bench'), s = M.get();
    U.clear(bench);
    var mode = el('select', {}, [
      el('option', { value: 'example', text: 'built-in example' }),
      el('option', { value: 'abc', text: 'abc triple' }),
      el('option', { value: 'random', text: 'random seed' })
    ]);
    mode.value = s.mode;
    var exSel = el('select', {}, M.EXAMPLES.map(function (e) { return el('option', { value: e.k, text: e.label }); }));
    exSel.value = String(s.example);
    var a = el('input', { type: 'number', min: 1, value: s.abc[0] }), b = el('input', { type: 'number', min: 1, value: s.abc[1] }), c = el('input', { type: 'number', min: 1, value: s.abc[2] });
    var l = el('input', { type: 'number', min: 3, step: 1, value: s.l, style: 'width:5em' });
    var seed = el('input', { type: 'number', min: 0, step: 1, value: s.seed, style: 'width:6em' });
    var hor = el('select', {}, M.HORIZONTAL.map(function (h) { return el('option', { value: h.key, text: h.label }); }));
    hor.value = s.horizontal;
    var rows = el('select', {}, [1, 2, 3, 4, 5, 6].map(function (r) { return el('option', { value: r, text: r + ' row' + (r > 1 ? 's' : '') }); }));
    rows.value = String(s.rows);

    var exLab = el('label', {}, ['example ', exSel]);
    var abcLab = el('label', {}, ['a + b = c ', a, ' + ', b, ' = ', c, '  l ', l, el('button', { class: 'primary', text: 'generate', onclick: applyAbc })]);
    var rndLab = el('label', {}, ['seed ', seed, el('button', { class: 'primary', text: 'generate', onclick: function () { M.set({ mode: 'random', seed: Math.max(0, +seed.value | 0) }); } })]);
    function showMode() {
      exLab.style.display = mode.value === 'example' ? '' : 'none';
      abcLab.style.display = mode.value === 'abc' ? '' : 'none';
      rndLab.style.display = mode.value === 'random' ? '' : 'none';
    }
    function applyAbc() {
      var A = +a.value, B = +b.value, C = +c.value, L = +l.value;
      if (!(A > 0 && B > 0 && C > 0) || A + B !== C) { flash('a + b must equal c with a, b, c > 0'); return; }
      if (!(L >= 3) || !isPrime(L)) { flash('l must be a prime ≥ 3'); return; }
      M.set({ mode: 'abc', abc: [A, B, C], l: L });
    }
    mode.addEventListener('change', function () {
      showMode();
      if (mode.value === 'example') M.set({ mode: 'example', example: +exSel.value });
      else if (mode.value === 'random') M.set({ mode: 'random', seed: +seed.value });
      else if (+a.value + +b.value === +c.value) applyAbc();
    });
    exSel.addEventListener('change', function () { M.set({ mode: 'example', example: +exSel.value }); });
    [a, b, c, l].forEach(function (inp) { inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') applyAbc(); }); });
    seed.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') M.set({ mode: 'random', seed: +seed.value }); });
    hor.addEventListener('change', function () { M.set({ horizontal: hor.value }); });
    rows.addEventListener('change', function () { M.set({ rows: +rows.value }); });

    bench.appendChild(el('label', { class: 'strong' }, ['Θ-data ', mode]));
    bench.appendChild(exLab); bench.appendChild(abcLab); bench.appendChild(rndLab);
    bench.appendChild(el('span', { class: 'sep' }));
    bench.appendChild(el('label', {}, ['horizontal link ', hor]));
    bench.appendChild(el('label', {}, ['lattice ', rows]));
    var summary = el('div', { class: 'summary', id: 'summary' });
    bench.appendChild(summary);
    showMode();
    els.bench = { mode: mode, exSel: exSel, a: a, b: b, c: c, l: l, seed: seed, hor: hor, rows: rows, summary: summary };
    renderSummary();
  }
  function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  var flashTimer;
  function flash(msg) {
    var f = $('flash'); f.textContent = msg; f.classList.add('on');
    clearTimeout(flashTimer); flashTimer = setTimeout(function () { f.classList.remove('on'); }, 3200);
  }
  function renderSummary() {
    var sm = els.bench.summary; U.clear(sm);
    var g;
    try { g = M.gen(); } catch (e) { sm.appendChild(U.chip('✕ ' + U.esc(e.message), 'red')); return; }
    var v = M.validate();
    var bad = g.VSet.filter(function (x) { return x.inVBadMod; }).length;
    sm.appendChild(U.chip('<b>' + U.esc(g.name) + '</b>', 'blue'));
    sm.appendChild(U.chip('l = <b>' + g.l + '</b> · l* = ' + g.LStar + ' · l± = ' + g.LPm, 'violet'));
    sm.appendChild(U.chip('|V| = <b>' + g.VSet.length + '</b> · |V<sup>bad</sup><sub>mod</sub>| = ' + bad, 'orange'));
    sm.appendChild(U.chip('log q = <b>' + g.logQ.toFixed(3) + '</b>', 'teal'));
    sm.appendChild(U.chip(v.errors ? '✕ ' + v.errors + ' error' + (v.errors > 1 ? 's' : '') : (v.warnings ? '⚠ ' + v.warnings + ' warning' + (v.warnings > 1 ? 's' : '') : '✓ Def 3.1 holds'), v.errors ? 'red' : v.warnings ? 'yellow' : 'green'));
  }

  /* ---------------------------------------------------------------- navigation */
  function buildNav() {
    var nav = $('nav'); U.clear(nav);
    VIEWS.forEach(function (v) {
      nav.appendChild(el('a', { href: '#' + v.key, id: 'nav-' + v.key, text: v.label }));
    });
  }
  function parseHash() {
    var h = (location.hash || '#home').slice(1);
    var parts = h.split('/').map(decodeURIComponent);
    if (!VIEWS.some(function (v) { return v.key === parts[0]; })) parts = ['home'];
    return parts;
  }
  function route() {
    var parts = parseHash(), key = parts[0];
    VIEWS.forEach(function (v) {
      var active = v.key === key;
      $('view-' + v.key).classList.toggle('active', active);
      $('nav-' + v.key).classList.toggle('active', active);
    });
    current = key;
    var def = VIEWS.filter(function (v) { return v.key === key; })[0];
    var container = $('view-' + key);
    if (key === 'home') { if (!rendered.home) { renderHome(container); rendered.home = true; } }
    else {
      var view = def.view();
      if (!rendered[key]) { safely(function () { view.render(container); }, container); rendered[key] = true; }
      if (view.onHash) safely(function () { view.onHash(parts); }, container);
    }
    if (parts.length === 1) window.scrollTo(0, 0);
  }
  function safely(fn, container) {
    try { fn(); } catch (e) {
      console.error(e);
      container.appendChild(el('div', { class: 'callout', html: '<b>this view failed to render:</b> ' + U.esc(e.message) + ' <span class="muted small">(see the browser console)</span>' }));
    }
  }
  function onChange() {
    renderSummary();
    rendered.home = false;
    VIEWS.forEach(function (v) {
      if (!v.view || !rendered[v.key]) return;
      var view = v.view();
      if (view.onChange) { if (v.key === current) safely(function () { view.onChange(); }, $('view-' + v.key)); else rendered[v.key] = false; }
      else rendered[v.key] = false;
    });
    if (current === 'home') { renderHome($('view-home')); rendered.home = true; }
  }

  /* the (Stp1)–(Stp8) rows of the ChainAndSteps transcript, for the home-page diagram */
  function stpSteps() {
    var out = [];
    U.procLines('ChainAndSteps').forEach(function (l) { var m = l.match(/^\s+(Stp\w+)\s+(.+?)\s+⇝\s+(.+?)\s{2,}(\S+)\s+([-\d.]+)\s+\[/); if (m) out.push({ id: m[1], from: m[2].trim(), to: m[3].trim(), ind: m[4], vol: +m[5] }); });
    return out;
  }

  /* ---------------------------------------------------------------- home */
  function renderHome(c) {
    U.clear(c);
    var g = null; try { g = M.gen(); } catch (e) { /* shown in the bench */ }
    var DG = root.DIAG;
    var hero = el('div', { class: 'hero' });
    hero.appendChild(el('div', {}, [
      el('h1', { html: 'The data types and processes of <span>inter-universal Teichmüller theory</span>, running.' }),
      el('p', { html: 'This page is the C toolkit <code>iut</code> (<code>src/</code>) compiled to WebAssembly. Every object of [IUTchI]–[IUTchIV], [EssLgc] and [Alien] is a C struct with a letters-only identifier; every step of the theory is a C function; the ' + M.procs().length + ' named processes run here, live, on the Θ-data you pick in the bar above. Nothing on this page is pre-rendered: change the triple and everything is recomputed.' }),
      el('div', { class: 'quick' }, [
        el('a', { href: '#types', text: 'Data types →' }),
        el('a', { href: '#processes', text: 'Processes →' }),
        el('a', { href: '#lattice', text: 'Lattice explorer →' }),
        el('a', { href: '#examples', text: 'Worked examples →' }),
        el('a', { href: '#identifiers', text: 'Identifiers →' })
      ])
    ]));
    if (g) hero.appendChild(el('div', { class: 'card' }, [U.canvas(function (cv) { DG.thetaData(cv, g); })]));
    c.appendChild(hero);

    var nums = el('div', { class: 'numbers' });
    var T = M.types();
    [[T.structs.length, 'C structs (data types)'], [T.enums.length, 'C enums'], [M.ids().length, 'identifiers'], [M.procs().length, 'processes'], [root.VIEW_EXAMPLES.EXAMPLES.length, 'worked examples'], [g ? g.VSet.length : '–', 'valuations in V(F_mod)']].forEach(function (p) {
      nums.appendChild(el('div', { class: 'n' }, [el('b', { text: String(p[0]) }), el('span', { text: p[1] })]));
    });
    c.appendChild(nums);

    var grid = el('div', { class: 'grid cols-2', style: 'margin-top:24px' });
    function card(title, href, body, draw) {
      var k = el('div', { class: 'card' }, [el('h3', {}, [el('a', { href: href, text: title })]), el('p', { class: 'desc', html: body })]);
      if (draw && g) k.appendChild(U.canvas(draw));
      return k;
    }
    var w = null; try { w = M.walk(); } catch (e) { /* ignore */ }
    grid.appendChild(card('Data types', '#types', 'Each type in its form (the struct, field by field, from the headers), as a diagram, and as the live instance the engine builds from the selected data: Θ-data, labels, prime-strips, Hodge theaters, links, log-shells, pilots, tensor packets…', function (cv) { DG.labels(cv, g, { compact: true }); }));
    grid.appendChild(card('Processes', '#processes', 'The ' + M.procs().length + ' processes of the registry, by paper, each with its inputs → outputs, the C functions behind it and its transcript (<code>iut run &lt;id&gt;</code>). "Run all" runs the whole registry in a few milliseconds.', function (cv) { DG.procFlow(cv, M.proc('LinkThetaUnitsModTors')); }));
    grid.appendChild(card('Lattice explorer', '#lattice', 'The log-theta-lattice as built by <code>iut walk</code>: click a vertex for its Hodge theater, an arrow for the link record, or watch it being built one link at a time.', w ? function (cv) { DG.lattice(cv, w, { compact: true }); } : null));
    grid.appendChild(card('Worked examples', '#examples', 'Step-by-step walks through the processes: from an abc triple to Θ-data, the Θ-link and mutually alien copies, constructing a Hodge theater, the log-theta-lattice, the multiradial algorithm, (Stp1)–(Stp8) of [EssLgc], the final inequality.', function (cv) { DG.stpChain(cv, stpSteps()); }));
    grid.appendChild(card('Identifiers', '#identifiers', 'The ' + M.ids().length + ' letters-only names of the theory, searchable, with notation, reference and the struct that implements each.', null));
    grid.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'The engine' }), el('p', { class: 'desc', html: 'The page runs <code>src/*.c</code> compiled with clang to wasm32-wasi (<code>scripts/web/build-engine.sh</code>). Every command below is the real command-line tool: ' }), U.transcript(IUT.exec(['selftest']).out, { maxLines: 12 })]));
    c.appendChild(grid);
  }

  /* ---------------------------------------------------------------- start */
  function start() {
    var status = $('engine-status');
    var t0 = performance.now();
    IUT.ready().then(function () {
      var ms = Math.round(performance.now() - t0);
      status.innerHTML = 'engine <b>ready</b> · ' + M.ids().length + ' ids · ' + M.procs().length + ' procs · ' + ms + ' ms';
      $('loading').style.display = 'none';
      $('main').style.display = '';
      buildNav();
      buildBench();
      M.on('change', onChange);
      window.addEventListener('hashchange', route);
      route();
    }).catch(function (e) {
      console.error(e);
      status.innerHTML = 'engine <span style="color:var(--red)">failed</span>';
      $('loading').innerHTML = '<p><b>The engine could not start.</b></p><p class="muted">' + U.esc(e.message) + '</p><p class="muted small">The page needs a browser with WebAssembly. If you are developing, run <code>scripts/web/build-engine.sh</code> to regenerate <code>htdocs/engine/iut.wasm.js</code>.</p>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
