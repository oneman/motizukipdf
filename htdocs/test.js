/*
 * htdocs/test.js — node tests for the web engine: the wasm build of src/ (htdocs/engine/iut.wasm.js)
 * must start, pass the C self-tests, run all 73 processes on every built-in example, export the
 * identifier and process tables, and — when a native ./iut is built in src/ — produce byte-identical
 * output to it for a set of commands.  Also checks htdocs/data/types.js against the identifier table.
 *
 *   node htdocs/test.js
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

global.window = undefined;
require(path.join(__dirname, 'engine', 'iut.wasm.js'));
require(path.join(__dirname, 'data', 'types.js'));
require(path.join(__dirname, 'js', 'engine.js'));
const IUT = globalThis.IUT, TYPES = globalThis.IUT_TYPES;

let checks = 0, failures = 0;
function ok(cond, msg) { checks++; if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg); } }

(async () => {
  await IUT.ready();
  ok(IUT.isReady(), 'engine compiled');

  const st = IUT.exec(['selftest']);
  ok(st.code === 0 && /PASSED/.test(st.out), 'iut selftest passes in wasm (' + st.ms.toFixed(1) + ' ms)');

  const ids = IUT.json(['ids', '--json']);
  ok(ids.length === 448, 'ids --json: 448 identifiers (' + ids.length + ')');
  ok(ids.every(i => /^[A-Za-z]+$/.test(i.id)), 'every identifier is letters only');
  const kinds = new Set(ids.map(i => i.kind));
  ok(kinds.size === 35, '35 kinds of identifier (' + kinds.size + ')');

  const procs = IUT.json(['procs', '--json']);
  ok(procs.length === 73, 'procs --json: 73 processes (' + procs.length + ')');
  ok(procs.every(p => ids.some(i => i.id === p.id && i.kind === 'process')), 'every process id is an identifier of kind process');

  for (let k = 0; k <= 5; k++) {
    const r = IUT.exec(['run', '--all', '--example', String(k)]);
    const m = r.out.match(/(\d+) process\(es\) run, (\d+) failure\(s\)/);
    ok(r.code === 0 && m && m[1] === '73' && m[2] === '0', 'run --all --example ' + k + ': 73 ok, 0 failures (' + r.ms.toFixed(1) + ' ms)');
  }
  for (const seed of [1, 2, 3]) {
    const r = IUT.exec(['run', '--all', '--random', String(seed)]);
    ok(r.code === 0 && /73 process\(es\) run, 0 failure/.test(r.out), 'run --all --random ' + seed + ' ok');
  }
  const g = IUT.json(['gen', '--json', '--abc', '1', '8', '9', '--l', '7']);
  ok(g.species === 'InitialThetaData' && g.l === 7 && g.LStar === 3 && g.LPm === 4, 'gen --abc 1 8 9 --l 7: l=7, l*=3, l±=4');
  const v = IUT.json(['validate', '--json', '--example', '2']);
  ok(v.errors === 0, 'validate --example 2: no errors');
  const w = IUT.json(['walk', '--json', '--rows', '2', '--horizontal', 'LGP', '--example', '2']);
  ok(w.HodgeTheaters.length === 10 && w.links.length === 9, 'walk --rows 2: 10 Hodge theaters, 9 links');
  ok(w.links.filter(l => l.species !== 'LogLink').length === 1, 'exactly one horizontal link in the H');
  /* the exact worked examples of initial Θ-data, passed as --theta-json <text> (the wasm engine has no files) */
  require(path.join(__dirname, 'data', 'initial-theta-data.js'));
  const TJ = globalThis.IUT_THETA_DATA || [];
  ok(TJ.length === 4, 'data/initial-theta-data.js: 4 worked examples (' + TJ.map(t => t.id).join(', ') + ')');
  for (const t of TJ) {
    const pj = IUT.exec(['pipeline', '--json', '--theta-json', t.text]);
    const P = pj.code === 0 ? JSON.parse(pj.out) : null;
    ok(P && P.problems === 0 && P.data.l === t.l && P.data.EpsilonUnder === 1 && P.crossCheck.length === 4 && P.crossCheck.every(x => x.ok),
       'pipeline --theta-json ' + t.id + ': 0 problems, l = ' + t.l + ', ε̲ = ±1, cross-check with the file ok (' + pj.ms.toFixed(1) + ' ms)');
    const r = IUT.exec(['run', '--all', '--theta-json', t.text]);
    ok(r.code === 0 && /73 process\(es\) run, 0 failure/.test(r.out), 'run --all --theta-json ' + t.id + ': 73 processes, 0 failures');
  }
  const nofile = IUT.exec(['gen', '--theta-json', 'docs/initial-theta-data/frey-1-8-9.json']);
  ok(nofile.code !== 0 && /could not read/.test(nofile.err), 'a path for --theta-json fails cleanly in wasm (no file system)');
  const bad = IUT.exec(['run', 'NoSuchProcess', '--example', '0']);
  ok(bad.code !== 0, 'unknown process exits non-zero');

  /* the generated struct forms */
  ok(TYPES.structs.length > 80 && TYPES.enums.length > 10, 'data/types.js: ' + TYPES.structs.length + ' structs, ' + TYPES.enums.length + ' enums');
  const unknown = Object.keys(TYPES.byIdent).filter(id => !ids.some(i => i.id === id));
  ok(unknown.length === 0, 'every identifier in data/types.js exists in iut ids' + (unknown.length ? ': ' + unknown.join(', ') : ''));
  const key = ['InitialThetaData', 'ThetaPmEllNFHodgeTheater', 'LogThetaLattice', 'ThetaLink', 'LogShell', 'FPrimeStrip', 'ThetaPmBridge', 'ThetaPilot'];
  key.forEach(id => ok((TYPES.byIdent[id] || []).length > 0, id + ' has a struct form (' + (TYPES.byIdent[id] || []).join(', ') + ')'));

  /* byte-identical with the native build, when there is one */
  const native = path.join(__dirname, '..', 'src', 'iut');
  if (fs.existsSync(native)) {
    const cmds = [['ids', '--json'], ['procs', '--json'], ['species'], ['gen', '--example', '2'], ['gen', '--json', '--random', '7'],
      ['validate', '--example', '5'], ['walk', '--rows', '3', '--horizontal', 'gau', '--example', '1'], ['walk', '--json', '--example', '3'],
      ['run', '--all', '--example', '4'], ['run', '--all', '--random', '11'], ['run', 'ComputeThmOneTen', '--abc', '3', '125', '128', '--l', '11'],
      ['pipeline', '--example', '2'], ['pipeline', '--json', '--rows', '3', '--random', '5']];
    for (const t of (globalThis.IUT_THETA_DATA || [])) cmds.push(['pipeline', '--theta-json', t.text], ['walk', '--json', '--theta-json', t.text]);
    for (const c of cmds) {
      let nat;
      try { nat = execFileSync(native, c, { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { nat = e.stdout; }
      const web = IUT.exec(c).out;
      ok(nat === web, 'native == wasm: iut ' + c.map(a => a.length > 60 ? '<' + a.length + ' bytes of JSON>' : a).join(' '));
    }
  } else console.log('  (no src/iut built: skipping the native comparison)');

  console.log((failures ? 'FAILED: ' : 'PASSED: ') + failures + ' failure(s) in ' + checks + ' web-engine checks');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
