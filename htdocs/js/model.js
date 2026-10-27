/*
 * model.js — the page's state: which initial Θ-data is selected (an example, an abc triple + l, or a
 * random seed), which horizontal link flavour and how many lattice rows; plus memoised calls into the
 * C engine (engine.js) and a few parsers for its output.  Views subscribe to MODEL.on('change', …).
 */
(function (root) {
  'use strict';
  var IUT = root.IUT;

  var EXAMPLES = [
    { k: 0, label: '1 + 2³ = 3², l = 7', abc: [1, 8, 9], l: 7 },
    { k: 1, label: '3 + 5³ = 2⁷, l = 11', abc: [3, 125, 128], l: 11 },
    { k: 2, label: '1 + 2⁵·3·5² = 7⁴, l = 13', abc: [1, 2400, 2401], l: 13 },
    { k: 3, label: '5 + 3³ = 2⁵, l = 7', abc: [5, 27, 32], l: 7 },
    { k: 4, label: '1 + 2⁴·5 = 3⁴, l = 7', abc: [1, 80, 81], l: 7 },
    { k: 5, label: 'synthetic number field (random #1)', abc: null, l: null }
  ];
  var HORIZONTAL = [
    { key: 'lgp', id: 'ThetaUnitsModTorsLgpIdealLink', label: 'Θ×μ_lgp-link' },
    { key: 'LGP', id: 'ThetaUnitsModTorsLGPTorsorLink', label: 'Θ×μ_LGP-link' },
    { key: 'gau', id: 'ThetaUnitsModTorsGauLink', label: 'Θ×μ_gau-link' },
    { key: 'xmu', id: 'ThetaUnitsModTorsLink', label: 'Θ×μ-link' },
    { key: 'theta', id: 'ThetaLink', label: 'Θ-link' }
  ];

  var state = { mode: 'example', example: 2, abc: [1, 2400, 2401], l: 13, seed: 2, horizontal: 'LGP', rows: 2 };
  var cache = {}, listeners = {}, statics = {};

  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
  function emit(ev, arg) { (listeners[ev] || []).forEach(function (f) { try { f(arg); } catch (e) { console.error(e); } }); }

  function dataArgs() {
    if (state.mode === 'abc') return ['--abc', String(state.abc[0]), String(state.abc[1]), String(state.abc[2]), '--l', String(state.l)];
    if (state.mode === 'random') return ['--random', String(state.seed)];
    return ['--example', String(state.example)];
  }
  function dataLabel() {
    if (state.mode === 'abc') return 'abc(' + state.abc.join(',') + ') l=' + state.l;
    if (state.mode === 'random') return 'random #' + state.seed;
    return EXAMPLES[state.example].label;
  }
  function set(patch) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    cache = {};
    emit('change', state);
  }
  function get() { return state; }

  function memo(key, fn) { if (!(key in cache)) cache[key] = fn(); return cache[key]; }
  function smemo(key, fn) { if (!(key in statics)) statics[key] = fn(); return statics[key]; }

  /* ---- static tables (independent of the data) */
  function ids() { return smemo('ids', function () { return IUT.json(['ids', '--json']); }); }
  function idMap() { return smemo('idmap', function () { var m = {}; ids().forEach(function (i) { m[i.id.toLowerCase()] = i; }); return m; }); }
  function ident(id) { return idMap()[String(id).toLowerCase()] || null; }
  function procs() { return smemo('procs', function () { return IUT.json(['procs', '--json']); }); }
  function proc(id) { id = String(id).toLowerCase(); return procs().filter(function (p) { return p.id.toLowerCase() === id; })[0] || null; }
  function speciesText() { return smemo('species', function () { return IUT.exec(['species']).out; }); }
  function types() { return root.IUT_TYPES || { structs: [], enums: [], byIdent: {} }; }
  function structsFor(id) {
    var names = types().byIdent[id] || [];
    return names.map(function (n) { return types().structs.filter(function (s) { return s.name === n; })[0] || types().enums.filter(function (e) { return e.name === n; })[0]; }).filter(Boolean);
  }

  /* ---- data-dependent (memoised until the selection changes) */
  function gen() { return memo('gen', function () { var r = IUT.exec(['gen', '--json'].concat(dataArgs())); if (r.code) throw new Error(r.err || 'cannot generate'); return JSON.parse(r.out); }); }
  function genText() { return memo('gentext', function () { return IUT.exec(['gen'].concat(dataArgs())).out; }); }
  function validate() { return memo('validate', function () { return JSON.parse(IUT.exec(['validate', '--json'].concat(dataArgs())).out); }); }
  function validateText() { return memo('validatetext', function () { return IUT.exec(['validate'].concat(dataArgs())).out; }); }
  function walk(rows, horizontal) {
    rows = rows || state.rows; horizontal = horizontal || state.horizontal;
    return memo('walk:' + rows + ':' + horizontal, function () { return JSON.parse(IUT.exec(['walk', '--json', '--rows', String(rows), '--horizontal', horizontal].concat(dataArgs())).out); });
  }
  function walkText(rows, horizontal) {
    rows = rows || state.rows; horizontal = horizontal || state.horizontal;
    return memo('walktext:' + rows + ':' + horizontal, function () { return IUT.exec(['walk', '--rows', String(rows), '--horizontal', horizontal].concat(dataArgs())).out; });
  }
  function run(id) { return memo('run:' + id, function () { return IUT.exec(['run', id].concat(dataArgs())); }); }
  function runAll() { return memo('runall', function () { return IUT.exec(['run', '--all'].concat(dataArgs())); }); }

  /* split a `walk` text view into its titled sections */
  function walkSections(rows, horizontal) {
    var txt = walkText(rows, horizontal), secs = [], cur = null;
    txt.split('\n').forEach(function (ln) {
      if (ln && !/^\s/.test(ln)) { cur = { title: ln, lines: [] }; secs.push(cur); }
      else if (cur) cur.lines.push(ln);
    });
    return secs;
  }
  /* split `run --all` output into per-process transcripts: { id: text } */
  function runAllSplit() {
    return memo('runallsplit', function () {
      var out = runAll().out, map = {}, cur = null, buf = [];
      out.split('\n').forEach(function (ln) {
        var m = ln.match(/^([A-Za-z]+)  \[/);
        if (m && proc(m[1])) { if (cur) map[cur] = buf.join('\n'); cur = m[1]; buf = [ln]; }
        else if (cur) buf.push(ln);
      });
      if (cur) map[cur] = buf.join('\n');
      return map;
    });
  }
  function hodgeTheaterAt(w, n, m) { return w.HodgeTheaters.filter(function (h) { return h.n === n && h.m === m; })[0] || null; }
  function linksOf(w, n, m) { return w.links.filter(function (l) { return (l.dom[0] === n && l.dom[1] === m) || (l.cod[0] === n && l.cod[1] === m); }); }
  function horizontalInfo(key) { return HORIZONTAL.filter(function (h) { return h.key === (key || state.horizontal); })[0]; }

  /* escape + mark identifiers in a text: returns HTML */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  root.MODEL = {
    EXAMPLES: EXAMPLES, HORIZONTAL: HORIZONTAL, on: on, set: set, get: get, dataArgs: dataArgs, dataLabel: dataLabel,
    ids: ids, ident: ident, procs: procs, proc: proc, speciesText: speciesText, types: types, structsFor: structsFor,
    gen: gen, genText: genText, validate: validate, validateText: validateText, walk: walk, walkText: walkText, walkSections: walkSections,
    run: run, runAll: runAll, runAllSplit: runAllSplit, hodgeTheaterAt: hodgeTheaterAt, linksOf: linksOf, horizontalInfo: horizontalInfo, esc: esc
  };
})(typeof window !== 'undefined' ? window : globalThis);
