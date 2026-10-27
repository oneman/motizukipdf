#!/usr/bin/env node
/*
 * build.js — generate docs/IUT_MANUAL.pdf, the manual / demo of the IUT data types and processes.
 *
 * Sources of truth (nothing in the manual is typed in twice):
 *   src/iut_ids.c   via  `iut ids --json`     the 448 identifiers (notation, kind, citation, description)
 *   src/iut_proc.c  via  `iut procs --json`   the registry of 73 processes
 *   src/iut.h, src/iut_i.h                    the C structs = the *form* of every data type
 *   docs/DATA_MODEL.md §8b                    which struct implements which identifier (IUT I types)
 *   `iut run --all`, `iut walk`, `iut validate`   transcripts of the processes on the demo Θ-data
 *   scripts/manual/lib/diagrams.js, processes.js   the SVG diagrams and the ten step-by-step progressions
 *   (the former JavaScript model of the web app, kept here for the manual; htdocs/ runs the C engine itself)
 *   docs/manual/pageindex.json                statement → PDF page in pdf/ (scripts/manual/pageindex.py)
 *
 * Output: docs/manual/iut-manual.html (self-contained) and docs/IUT_MANUAL.pdf (Chromium via Playwright).
 * Usage:  node scripts/manual/build.js [--html-only] [--example K] [--abc A B C --l L]
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src'), HT = path.join(__dirname, 'lib'), DOCS = path.join(ROOT, 'docs');
const OUTDIR = path.join(DOCS, 'manual');
const HTML_OUT = path.join(OUTDIR, 'iut-manual.html');
const PDF_OUT = path.join(DOCS, 'IUT_MANUAL.pdf');
const IUT_BIN = path.join(SRC, 'iut');

const argv = process.argv.slice(2);
const HTML_ONLY = argv.includes('--html-only');
let EXAMPLE = 2, DATA_ARGS = ['--example', '2'];
{ const i = argv.indexOf('--example'); if (i >= 0) { EXAMPLE = +argv[i + 1]; DATA_ARGS = ['--example', argv[i + 1]]; } }
{ const i = argv.indexOf('--abc'); if (i >= 0) { DATA_ARGS = ['--abc', argv[i + 1], argv[i + 2], argv[i + 3]]; const j = argv.indexOf('--l'); if (j >= 0) DATA_ARGS.push('--l', argv[j + 1]); EXAMPLE = -1; } }

// ------------------------------------------------------------------ helpers
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function run(cmd, args) { return cp.execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 }); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function sh(cmd) { return cp.execSync(cmd, { encoding: 'utf8', cwd: ROOT }).trim(); }

// ------------------------------------------------------------------ 0. build the C program, export the tables
if (!fs.existsSync(IUT_BIN)) run('make', ['-C', SRC]);
const IDS = JSON.parse(run(IUT_BIN, ['ids', '--json']));
const PROCS = JSON.parse(run(IUT_BIN, ['procs', '--json']));
const RUNALL = run(IUT_BIN, ['run', '--all'].concat(DATA_ARGS));
const WALK = run(IUT_BIN, ['walk', '--rows', '2'].concat(DATA_ARGS));
const VALIDATE = run(IUT_BIN, ['validate'].concat(DATA_ARGS));
const SPECIES_TXT = run(IUT_BIN, ['species']);
const PAGEIDX = JSON.parse(read(path.join(OUTDIR, 'pageindex.json')));
const GIT = (() => { try { return sh('git rev-parse --short HEAD'); } catch (e) { return 'unknown'; } })();
const DATE = new Date().toISOString().slice(0, 10);
const IDMAP = {}; IDS.forEach(i => { IDMAP[i.id.toLowerCase()] = i; });

// ------------------------------------------------------------------ 1. the web model in node: data, lattice, diagrams
global.window = undefined;
const IUT = require(path.join(HT, 'iut.js')); global.IUT = IUT;
const OPS = require(path.join(HT, 'ops.js')); global.OPS = OPS;
global.IUT_IDENTS = require(path.join(HT, 'identifiers.js'));
require(path.join(HT, 'diagrams.js'));
require(path.join(HT, 'processes.js'));
const DIAGRAMS = global.DIAGRAMS, PROCESSES = global.PROCESSES, SV = global.SV;
const D = EXAMPLE >= 0 ? IUT.genExample(EXAMPLE) : IUT.genFromAbc(+DATA_ARGS[1], +DATA_ARGS[2], +DATA_ARGS[3], +(DATA_ARGS[5] || 13));
const LAT = new IUT.Lattice(D, 'ThetaUnitsModTorsLGPTorsorLink'); LAT.buildH(0, -1, 1);
const CTX = { d: D, lat: LAT, params: PROCESSES.params };

function fig(svgStr, caption, opt) {
  opt = opt || {};
  // let the SVG scale to the column: drop the fixed pixel size, keep the viewBox
  const s = svgStr.replace(/ width="\d+(\.\d+)?" height="\d+(\.\d+)?"/, ' class="fig"');
  return `<figure class="${opt.cls || ''}">${s}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

// ------------------------------------------------------------------ 2. citations → paper, section, statement, page
const PAPER_SHORT = { IUTchI: 'IUT I', IUTchII: 'IUT II', IUTchIII: 'IUT III', IUTchIV: 'IUT IV', EssLgc: 'EssLgc', Alien: 'Alien', Pano: 'Pano', AbsTopIII: 'AbsTopIII', ExpEst: 'ExpEst', FormIUT: 'FormIUT', EtTh: 'EtTh', FrdI: 'FrdI', FrdII: 'FrdII', CanLift: 'CanLift' };
const KWLONG = { Def: 'Definition', Prop: 'Proposition', Cor: 'Corollary', Thm: 'Theorem', Rem: 'Remark', Ex: 'Example', Lem: 'Lemma', Fig: 'Figure' };
const unresolved = {};
/** Parse "[IUTchI] Def 3.1 (ii), Prop 4.2; [Alien] §3.3 (v), Fig 3.8" into [{tag, items:[{kw, num, sub, raw}]}]. */
function parseRef(ref) {
  const groups = [];
  let tag = null;
  String(ref).split(/;\s*/).forEach(part => {
    part = part.trim(); if (!part) return;
    const m = part.match(/^\[([A-Za-z]+)\]\s*(.*)$/);
    if (m) { tag = m[1]; part = m[2]; }
    const g = { tag: tag, items: [], raw: part };
    let kw = null;
    part.split(/,\s*(?![^()]*\))/).forEach(it => {
      it = it.trim(); if (!it) return;
      let mm = it.match(/^(Def|Prop|Cor|Thm|Rem|Ex|Lem|Fig|Step|Steps)\.?\s*([A-Z]?[0-9]+(?:\.[0-9]+)*|[A-D])(.*)$/);
      if (mm) { kw = mm[1]; g.items.push({ kw: kw, num: mm[2], sub: mm[3].trim(), raw: it }); return; }
      mm = it.match(/^§\s*([0-9]+(?:\.[0-9]+)*|I[0-9]*)(.*)$/);
      if (mm) { g.items.push({ kw: '§', num: mm[1], sub: mm[2].trim(), raw: it }); return; }
      mm = it.match(/^([0-9]+(?:\.[0-9]+)*)(.*)$/);           // "Def 4.6, 5.5, 6.4": the keyword carries over
      if (mm && kw) { g.items.push({ kw: kw, num: mm[1], sub: mm[2].trim(), raw: it }); return; }
      g.items.push({ kw: null, num: null, sub: '', raw: it });
    });
    groups.push(g);
  });
  return groups;
}
function lookupPage(tag, kw, num) {
  const P = PAGEIDX[tag]; if (!P) return null;
  const idx = P.index;
  if (kw === '§') { if (/^I/.test(num)) return idx['§I'] || null; return idx['§' + num] || idx['§' + num.split('.')[0]] || null; }
  if (kw === 'Step' || kw === 'Steps') return null;
  const first = String(num).split(/[-–]/)[0];
  return idx[kw + ' ' + first] || null;
}
function sectionOf(tag, kw, num) {
  if (kw === '§') return /^I/.test(num) ? 'Introduction' : '§' + num;
  if (/^[A-D]$/.test(num)) return 'Introduction';
  const s = String(num).split('.')[0];
  if (/^I/.test(s)) return 'Introduction';
  return '§' + s;
}
/** HTML for a citation string, each statement resolved to paper · section · statement · page. */
function cite(ref, opt) {
  opt = opt || {};
  const groups = parseRef(ref);
  const out = [];
  groups.forEach(g => {
    if (!g.tag) { out.push(`<span class="cite-raw">${esc(g.raw)}</span>`); return; }
    const P = PAGEIDX[g.tag];
    const short = PAPER_SHORT[g.tag] || g.tag;
    const items = g.items.map(it => {
      if (!it.kw) return `<span class="cite-item">${esc(it.raw)}</span>`;
      const pg = lookupPage(g.tag, it.kw, it.num);
      const label = it.kw === '§' ? (/^I/.test(it.num) ? 'Introduction' + (it.num.length > 1 ? ' §' + it.num : '') : '§' + it.num) : (opt.long ? KWLONG[it.kw] : it.kw) + ' ' + it.num;
      const sec = it.kw === '§' ? '' : sectionOf(g.tag, it.kw, it.num);
      if (!pg) { if (P) unresolved[g.tag + ' ' + it.kw + ' ' + it.num] = (unresolved[g.tag + ' ' + it.kw + ' ' + it.num] || 0) + 1; return `<span class="cite-item">${esc(label)}${it.sub ? ' ' + esc(it.sub) : ''}</span>`; }
      return `<span class="cite-item">${sec && opt.long ? esc(sec) + ', ' : ''}${esc(label)}${it.sub ? ' ' + esc(it.sub) : ''}<span class="pg"> p.&thinsp;${pg.page}</span></span>`;
    });
    out.push(`<span class="cite"><span class="paper" title="${P ? esc(P.title) : ''}">[${esc(short)}]</span> ${items.join(', ')}</span>`);
  });
  return out.join('; ');
}

// ------------------------------------------------------------------ 3. the C structs = the form of each type
function parseHeader(file) {
  const text = read(file), lines = text.split('\n'), structs = [], enums = [];
  let pending = [];            // comment lines immediately before a typedef
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\s*\/\*/.test(ln) && !/typedef/.test(ln)) {
      // collect a comment block
      let block = ln; let j = i; while (!/\*\//.test(lines[j]) && j < lines.length - 1) { j++; block += '\n' + lines[j]; }
      pending.push(block); i = j; continue;
    }
    if (/^\s*$/.test(ln)) { continue; }
    let m = ln.match(/^typedef struct\s*\{(.*)\}\s*(\w+);/);
    if (m) { structs.push({ name: m[2], file: path.basename(file), fields: splitFields(m[1]), comment: cleanComment(pending) }); pending = []; continue; }
    m = ln.match(/^typedef struct\s*\{\s*(\/\*.*\*\/)?\s*$/);
    if (m) {
      const fields = []; let j = i + 1; const trailing = m[1] ? [m[1]] : [];
      while (j < lines.length && !/^\}\s*\w+;/.test(lines[j])) { fields.push(lines[j]); j++; }
      const name = lines[j].match(/^\}\s*(\w+);/)[1];
      structs.push({ name: name, file: path.basename(file), fields: parseFieldLines(fields), comment: cleanComment(pending.concat(trailing)) });
      pending = []; i = j; continue;
    }
    m = ln.match(/^typedef enum\s*\{(.*)\}\s*(\w+);/);
    if (m) { enums.push({ name: m[2], file: path.basename(file), values: m[1].split(',').map(s => s.replace(/\/\*.*?\*\//g, '').trim()).filter(Boolean), comment: cleanComment(pending) }); pending = []; continue; }
    m = ln.match(/^typedef enum\s*\{\s*(\/\*.*\*\/)?\s*$/);
    if (m) {
      const vals = []; let j = i + 1;
      while (j < lines.length && !/^\}\s*\w+;/.test(lines[j])) { const v = lines[j].match(/^\s*(\w+)\s*(?:=\s*\w+)?,?\s*(?:\/\*(.*?)\*\/)?/); if (v && v[1] && !/^\/\*/.test(lines[j].trim())) vals.push({ name: v[1], comment: (v[2] || '').trim() }); j++; }
      const name = lines[j].match(/^\}\s*(\w+);/)[1];
      enums.push({ name: name, file: path.basename(file), values: vals, comment: cleanComment(pending) });
      pending = []; i = j; continue;
    }
    pending = [];   // anything else breaks the comment association
  }
  return { structs, enums };
}
function cleanComment(blocks) {
  return blocks.map(b => b.replace(/^\s*\/\*+\s?/, '').replace(/\s*\*+\/\s*$/, '').split('\n').map(l => l.replace(/^\s*\*\s?/, '').replace(/^\s*\/\*+\s?/, '').replace(/\s+$/, '')).join('\n')).join('\n').replace(/\s{2,}/g, ' ').trim();
}
function splitFields(s) {
  // one-line struct body: "const char *id, *notation; int ok; /* c */"
  return parseFieldLines(s.split(';').map(x => x.trim()).filter(Boolean).map(x => x + ';'));
}
function parseFieldLines(lines) {
  const out = []; let carry = '';
  lines.forEach(raw => {
    let ln = raw.trim(); if (!ln) return;
    if (/^\/\*/.test(ln) && !/;/.test(ln)) { carry = (carry ? carry + ' ' : '') + ln.replace(/^\/\*+\s?/, '').replace(/\s*\*+\/$/, '').trim(); return; }   // group comment
    const cm = ln.match(/\/\*(.*?)\*\//); const comment = cm ? cm[1].trim() : '';
    ln = ln.replace(/\/\*.*?\*\//g, '').trim();
    const dm = ln.match(/^((?:const\s+|unsigned\s+|struct\s+)*[\w]+(?:\s+long\s+long|\s+long)?)\s+(.*);$/);
    if (!dm) return;
    const type = dm[1].trim();
    dm[2].split(',').map(x => x.trim()).forEach(decl => {
      const nm = decl.match(/^(\**)(\w+)((?:\[[^\]]*\])*)/); if (!nm) return;
      out.push({ type: type + (nm[1] ? ' ' + nm[1] : ''), name: nm[2], dims: nm[3], comment: comment, group: carry });
    });
    carry = '';
  });
  return out;
}
const HDR = { ...parseHeader(path.join(SRC, 'iut.h')) };
const HDR_I = parseHeader(path.join(SRC, 'iut_i.h'));
const STRUCTS = {}; HDR.structs.concat(HDR_I.structs).forEach(s => { STRUCTS[s.name] = s; });
const ENUMS = {}; HDR.enums.concat(HDR_I.enums).forEach(e => { ENUMS[e.name] = e; });

// struct → identifiers.  iut.h: by hand (the species table + the obvious ones); iut_i.h: from docs/DATA_MODEL.md §8b.
const FORM = {};   // identifier (lower) → [{struct, primary}]
function bind(struct, ids) { ids.forEach((id, k) => { const key = id.toLowerCase(); if (!IDMAP[key]) return; (FORM[key] = FORM[key] || []).push({ struct: struct, primary: k === 0 }); }); }
bind('iut_initial_theta_data', ['InitialThetaData', 'FBarOverF', 'Fmod', 'KField', 'EpsilonUnder']);
bind('iut_valuation', ['VSet', 'VNon', 'VArc', 'VBadMod', 'VGoodMod', 'VBad', 'VGood', 'PV']);
bind('iut_prime_strip', ['BasicPrimeStrip', 'DPrimeStrip', 'DMonoPrimeStrip', 'FPrimeStrip', 'FMonoPrimeStrip', 'FMonoUnitsPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoValUnitsModTorsPrimeStrip', 'FMonoGlobPrimeStrip', 'FMonoGlobValUnitsModTorsPrimeStrip', 'FBoxPlus', 'DCircDotPm', 'FGt', 'FCircAst', 'FMonoGlobTriangle', 'FMonoGlobEnv', 'FMonoGlobGau', 'FMonoGlobLGPTorsor', 'FMonoGlobLgpIdeal', 'FMonoGlobMod', 'FMonoGlobTht', 'DGt', 'DMonoGt', 'DMonoTriangle']);
bind('iut_local_datum', ['BasicPrimeStrip', 'PiV', 'GV', 'OValV', 'OUnitsV', 'OUnitsModTorsV', 'OTorsV', 'OValgroupV', 'UnitsModTorsKummer', 'UnitsKummer']);
bind('iut_pilot', ['QPilot', 'ThetaPilot']);
bind('iut_log_shell', ['LogShell', 'HolLogShell', 'MonoLogShell', 'FrobLogShell', 'EtLogShell', 'PStar']);
bind('iut_capsule_member', ['Capsule', 'FT', 'FJ', 'LabelT', 'LabelJ']);
bind('iut_theta_hodge_theater', ['ThetaHodgeTheater']);
bind('iut_theta_pm_ell_hodge_theater', ['ThetaPmEllHodgeTheater']);
bind('iut_theta_nf_hodge_theater', ['ThetaNFHodgeTheater']);
bind('iut_hodge_theater', ['ThetaPmEllNFHodgeTheater', 'NMHodgeTheater', 'DagHodgeTheater', 'DdagHodgeTheater', 'EtaleHodgeTheater', 'Bullet']);
bind('iut_link', ['ThetaLink', 'ThetaUnitsModTorsLink', 'ThetaUnitsModTorsGauLink', 'ThetaUnitsModTorsLGPTorsorLink', 'ThetaUnitsModTorsLgpIdealLink', 'LogLink', 'DThetaPmEllNFLink', 'ThetaDilation', 'AlienCopy']);
bind('iut_indeterminacies', ['IndOne', 'IndTwo', 'IndThree']);
bind('iut_procession_step', ['Procession', 'SPmJPlusOne', 'SJPlusOne']);
bind('iut_multiradial_rep', ['MultiradialRepresentation', 'CTheta', 'AbsLogQ', 'AbsLogTheta', 'HolomorphicHull']);
bind('iut_log_theta_lattice', ['LogThetaLattice', 'LGPTorsorGaussianLogThetaLattice', 'LgpIdealGaussianLogThetaLattice', 'InfiniteH', 'NCircColumn']);
bind('iut_species', ['ZeroSpecies', 'OneSpecies', 'SpeciesObject', 'SpeciesMorphism']);
bind('iut_mutation', ['Mutation', 'MorphismOfMutations', 'MutationHistory', 'Observable', 'Core']);
bind('iut_ident', ['Dag']);
{
  const md = read(path.join(DOCS, 'DATA_MODEL.md'));
  md.split('\n').filter(l => /^\| §\d/.test(l)).forEach(row => {
    const cell = row.split('|')[2] || '';
    cell.split(';').forEach(part => {
      const names = [...part.matchAll(/`([^`]+)`/g)].map(m => m[1]);
      const structs = names.filter(n => /^iut_/.test(n)), ids = names.filter(n => !/^iut_/.test(n));
      structs.forEach(s => { if (STRUCTS[s] || ENUMS[s]) bind(s, ids); });
    });
  });
}
const FORM_PRIMARY = {};   // struct → the identifier whose entry shows the form
Object.keys(FORM).forEach(k => FORM[k].forEach(f => { if (f.primary && !FORM_PRIMARY[f.struct]) FORM_PRIMARY[f.struct] = IDMAP[k].id; }));

function structTable(name) {
  const s = STRUCTS[name];
  if (s) {
    let h = `<div class="form"><div class="form-head"><code>typedef struct … ${esc(s.name)}</code> <span class="file">${esc(s.file)}</span></div>`;
    if (s.comment) h += `<p class="form-comment">${esc(s.comment)}</p>`;
    h += '<table class="fields"><thead><tr><th>field</th><th>type</th><th>meaning</th></tr></thead><tbody>';
    let lastGroup = '';
    s.fields.forEach(f => {
      if (f.group && f.group !== lastGroup) { h += `<tr class="group"><td colspan="3">${esc(f.group)}</td></tr>`; lastGroup = f.group; }
      h += `<tr><td><code>${esc(f.name)}${esc(f.dims)}</code></td><td><code>${esc(f.type)}</code></td><td>${esc(f.comment)}</td></tr>`;
    });
    h += '</tbody></table></div>';
    return h;
  }
  const e = ENUMS[name];
  if (e) {
    let h = `<div class="form"><div class="form-head"><code>typedef enum … ${esc(e.name)}</code> <span class="file">${esc(e.file)}</span></div>`;
    if (e.comment) h += `<p class="form-comment">${esc(e.comment)}</p>`;
    h += '<table class="fields"><tbody>' + e.values.map(v => typeof v === 'string' ? `<tr><td><code>${esc(v)}</code></td><td></td></tr>` : `<tr><td><code>${esc(v.name)}</code></td><td>${esc(v.comment)}</td></tr>`).join('') + '</tbody></table></div>';
    return h;
  }
  return '';
}

// ------------------------------------------------------------------ 4. the process transcripts
const TRANSCRIPT = {};
{
  let cur = null;
  RUNALL.split('\n').forEach(ln => {
    const m = ln.match(/^([A-Z][A-Za-z]+)  \[/);
    if (m && PROCS.some(p => p.id === m[1])) { cur = m[1]; TRANSCRIPT[cur] = []; }
    if (cur) TRANSCRIPT[cur].push(ln);
  });
}

// ------------------------------------------------------------------ 5. chapters of Part I (kinds → chapters)
const CHAPTERS = [
  { id: 'theta-data', lead: ['InitialThetaData', 'VSet', 'VBadMod', 'EpsilonUnder', 'LPrime', 'LStar', 'LPm', 'LogQ', 'AbsLogQ'], title: 'Initial Θ-data, fields, places and quantities', kinds: ['datum', 'field', 'set', 'constant', 'quantity'], cards: ['thetadata'],
    intro: 'The input of the whole theory is a collection of initial Θ-data ([IUTchI] Def 3.1): a number field F with an elliptic curve, the tower F_mod ⊆ F ⊆ K = F(E[l]) ⊆ F̄, the prime l, the orbicurve C_K, the set of places V ≅ V_mod and the odd bad places V^bad_mod. The toolkit manufactures it from an abc triple through the Frey curve, records the degrees as upper bounds and the five non-numeric hypotheses as asserted flags, and computes from it the quantities log q, |log q|, log f, log d that the final inequality is about.' },
  { id: 'labels', lead: ['Fl', 'FlAbs', 'FlStar', 'FlUnits', 'FlSemiPm', 'FlStarSym', 'Capsule', 'FT', 'FJ', 'LabCusp', 'LabCuspPm'], title: 'Label sets, labels, symmetries and capsules', kinds: ['labelset', 'label', 'symmetry', 'capsule'], cards: ['labels'],
    intro: 'Every Hodge theater is indexed by labels: F_l = {−l*,…,l*} for the additive F_l^{⋊±}-symmetry of the Θ±ell-side, F_l^* = {1,…,l*} for the multiplicative F_l^*-symmetry of the ΘNF-side, |F_l| = F_l/{±1} in between. Capsules are finite collections of prime-strips indexed by these sets; LabCusp and LabCusp± are the torsors of cusp labels that the anabelian side reconstructs.' },
  { id: 'curves', lead: ['XF', 'CK', 'XUnderK', 'PiV', 'GV'], title: 'Orbicurves, cusps, groups and anabelioids', kinds: ['curve', 'cusp', 'group', 'anabelioid'], cards: [],
    intro: 'The geometric side of [IUTchI] §1–§2: the once-punctured elliptic curve X_F, its quotient C_K, the coverings X̲_K, C̲_K, X→, C→ and their local versions X̲̲_v, C̲̲_v at v ∈ V^bad, the cusps ε, ε′, ε″, 2ε used to pin down labels, the (tempered) fundamental groups Π_v ↠ G_v, Π_{X_K}, Π_{C_K} and the anabelioids B(Π), B(X)^0, B^temp(Π) through which the étale-like data is expressed.' },
  { id: 'monoids', lead: ['OValV', 'OUnitsV', 'OUnitsModTorsV', 'OTorsV', 'PseudoMonoid', 'PolyMorphism', 'FullPolyIsomorphism'], title: 'Monoids, morphisms, categories, Frobenioids and maps', kinds: ['monoid', 'morphism', 'category', 'frobenioid', 'map'], cards: ['local'],
    intro: 'The Frobenius-like side: the local monoids O▷ = O× × O▶, O×μ = O×/Oμ at each v, the pseudo-monoids M^⊛ of global rational functions with the Kummer-ready / Kummer-blind distinction, the poly-morphisms (collections of morphisms, full when every isomorphism is included), the base categories D_v, D^⊛, D^⊚± and the Frobenioids F̲_v, C_v, C⊢_v, C^Θ_v, C⊩_mod, F^⊛ with the maps ρ_v, φ, χ, ζ between them.' },
  { id: 'primestrips', lead: ['BasicPrimeStrip', 'DPrimeStrip', 'DMonoPrimeStrip', 'FPrimeStrip', 'FMonoPrimeStrip', 'FMonoUnitsPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoValUnitsModTorsPrimeStrip', 'FMonoGlobPrimeStrip', 'FMonoGlobValUnitsModTorsPrimeStrip'], title: 'Prime-strips', kinds: ['primestrip'], cards: ['primestrips'],
    intro: 'A prime-strip is a collection of local data indexed by v ∈ V ([IUTchI] Fig I1.2). The nine kinds form a forgetful ladder from the holomorphic Frobenius-like F-prime-strip down to the mono-analytic étale-like D⊢-prime-strip; which rungs are preserved by the log-link (vertical coricity) and by the Θ-link (horizontal coricity) is the content of [IUTchIII] Thm 1.5. The labelled strips F_⊞, D_⊚±, F_>, F_⊛, F⊩_Δ, F⊩_LGP, … are the targets of the bridges and the homes of the pilots.' },
  { id: 'hodge', lead: ['ThetaPmEllNFHodgeTheater', 'ThetaPmEllHodgeTheater', 'ThetaNFHodgeTheater', 'ThetaHodgeTheater', 'DThetaPmEllNFHodgeTheater', 'GluingZeroBoxPlusToGt'], title: 'Hodge theaters, bridges and the gluing', kinds: ['hodgetheater', 'bridge', 'gluing'], cards: ['ht', 'pilots'],
    intro: 'A Θ±ell NF-Hodge theater ([IUTchI] Def 6.13) is a Θ±ell-Hodge theater (capsule F_T, Θ±-bridge to F_⊞, Θell-bridge to D_⊚±) glued along 0, ⊞ ↦ > to a ΘNF-Hodge theater (capsule F_J, Θ-bridge to F_>, NF-bridge to F_⊛), which contains the Θ-Hodge theater of Def 3.6 carrying q̲_v and Θ̲_v. Every vertex • of the log-theta-lattice is one such theater in its own universe.' },
  { id: 'links', lead: ['LogThetaLattice', 'InfiniteH', 'LogLink', 'ThetaLink', 'ThetaUnitsModTorsLGPTorsorLink', 'LogShell', 'QPilot', 'ThetaPilot'], title: 'Links, the log-theta-lattice, log-shells and pilots', kinds: ['link', 'lattice', 'logshell', 'pilot'], cards: ['links', 'lattice', 'logshell'],
    intro: 'The vertical arrows of the lattice are log-links (fresh Frobenius-like monoids, shared étale-like data, log-shells I_v = (p*)⁻¹ log(O×) in the codomain); the horizontal arrows are Θ-links in their Θ, Θ×μ, Θ×μ_gau, Θ×μ_LGP, Θ×μ_lgp flavours, gluing the Θ-pilot {q̲^{j²}} of † to the q-pilot {q̲} of ‡ while identifying only G_v and O×μ. The two sides of a Θ-link are mutually alien copies; the proof uses only the infinite H of columns 0 and 1.' },
  { id: 'multi', lead: ['MultiradialRepresentation', 'IndOne', 'IndTwo', 'IndThree', 'TensorPacket', 'Procession', 'HolomorphicHull'], title: 'Indeterminacies, the multiradial representation, structures and properties', kinds: ['indeterminacy', 'structure', 'property'], cards: ['indet', 'multi', 'etale'],
    intro: 'What survives the passage across the Θ-link: processions S^±_{j+1} of tensor packets of log-shells, the splitting monoids of the LGP-monoids and copies of F_mod^×, all up to the indeterminacies Ind1 (automorphisms of processions of D⊢-prime-strips), Ind2 (Ism on O×μ) and Ind3 (upper semi-compatibility of the log-Kummer correspondence) — the multiradial representation of [IUTchIII] Thm 3.11, whose log-volume gives Cor 3.12.' },
  { id: 'species', lead: ['ZeroSpecies', 'Mutation', 'MutationHistory', 'Core', 'CorThreeTwelve', 'ThmThreeEleven', 'ThmOneTen'], title: 'Species, mutations, theorems and diagrams', kinds: ['species', 'mutation', 'theorem', 'diagram'], cards: ['species', 'idents'],
    intro: '[IUTchIV] §3 makes the bookkeeping explicit: each data type is a species (a set-theoretic formula), each construction a mutation, a chain of them a mutation-history; the log-theta-lattice is the mutation-history that matters, and a core is an observable all of whose arrows are isomorphisms (the étale-picture around D⊢). The named theorems and the two pictures (Frobenius-picture and étale-picture) are listed here as objects too.' },
];
const KIND_LABEL = { datum: 'data', field: 'fields', set: 'sets of places', constant: 'constants', quantity: 'quantities', labelset: 'label sets', label: 'labels', symmetry: 'symmetries', capsule: 'capsules', curve: 'orbicurves', cusp: 'cusps', group: 'groups', anabelioid: 'anabelioids', monoid: 'monoids', morphism: 'morphisms', category: 'categories', frobenioid: 'Frobenioids', map: 'maps', primestrip: 'prime-strips', hodgetheater: 'Hodge theaters', bridge: 'bridges', gluing: 'gluings', link: 'links', lattice: 'lattices', logshell: 'log-shells', pilot: 'pilot objects', indeterminacy: 'indeterminacies', structure: 'structures', property: 'properties', species: 'species', mutation: 'mutations', theorem: 'theorems and definitions as objects', diagram: 'diagrams', symbol: 'symbols' };
const PAPER_ORDER = { IUTchI: 1, IUTchII: 2, IUTchIII: 3, IUTchIV: 4, EssLgc: 5, Alien: 6, Pano: 7 };
function refOrderKey(ref) {
  const g = parseRef(ref)[0]; if (!g || !g.tag) return [99, 0, 0];
  const it = g.items.find(x => x.num) || {}; const nums = String(it.num || '0').replace(/^I/, '0').split('.').map(Number);
  return [PAPER_ORDER[g.tag] || 50, nums[0] || 0, nums[1] || 0, nums[2] || 0];
}
function cmpRef(a, b) { const ka = refOrderKey(a.ref), kb = refOrderKey(b.ref); for (let i = 0; i < 4; i++) { if ((ka[i] || 0) !== (kb[i] || 0)) return (ka[i] || 0) - (kb[i] || 0); } return a.id.localeCompare(b.id); }

let MARK = 0; const MARKS = [];   // invisible markers: pass 1 finds them per page, pass 2 prints the page numbers
function mark(key) { const id = 'm' + (MARK++); MARKS.push({ id: id, key: key }); return `<span class="mk">⟦${id}⟧</span>`; }

function identEntry(i, opt) {
  opt = opt || {};
  const forms = (FORM[i.id.toLowerCase()] || []);
  let formHtml = '';
  forms.forEach(f => {
    if (FORM_PRIMARY[f.struct] === i.id) formHtml += structTable(f.struct);
    else formHtml += `<p class="form-ref">form: <code>${esc(f.struct)}</code> — see <a href="#id-${esc(FORM_PRIMARY[f.struct])}">${esc(FORM_PRIMARY[f.struct])}</a></p>`;
  });
  const lean = LEAN_BY_ID[i.id.toLowerCase()];
  return `<section class="ident${forms.length ? ' has-form' : ''}" id="id-${esc(i.id)}">${mark('id:' + i.id)}
  <h4><code class="idn">${esc(i.id)}</code> <span class="notation">${esc(i.notation)}</span> <span class="kind">${esc(KIND_LABEL[i.kind] || i.kind)}</span></h4>
  <p class="desc">${esc(i.desc)}</p>
  <p class="where"><span class="lbl">introduced / recalled</span> ${cite(i.ref, { long: true })}</p>
  ${lean ? `<p class="lean"><span class="lbl">Lean</span> <code>${esc(lean)}</code></p>` : ''}
  ${formHtml}
</section>`;
}

// Lean structures / inductives, matched to identifiers by name
const LEAN_BY_ID = {};
{
  const dir = path.join(ROOT, 'lean', 'IUT');
  if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => /\.lean$/.test(f)).forEach(f => {
    read(path.join(dir, f)).split('\n').forEach(ln => { const m = ln.match(/^(structure|inductive)\s+([A-Za-z]+)/); if (m && IDMAP[m[2].toLowerCase()]) LEAN_BY_ID[m[2].toLowerCase()] = `${m[1]} ${m[2]} — lean/IUT/${f}`; });
  });
}

// ------------------------------------------------------------------ 6. assemble the HTML
const CARD = {}; DIAGRAMS.cards.forEach(c => { CARD[c.id] = c; });
function cardFig(cid) {
  const c = CARD[cid]; if (!c) return '';
  let svg; try { svg = c.draw(D, LAT); } catch (e) { return `<p class="err">diagram ${esc(cid)}: ${esc(e.message)}</p>`; }
  return fig(svg, `<b>${esc(c.title)}.</b> ${c.desc} <span class="figref">${cite(c.ref)}</span><br><span class="idents">${c.idents.map(x => `<a href="#id-${esc(x)}"><code>${esc(x)}</code></a>`).join(' ')}</span>`);
}

const TOC = [];   // {level, title, anchor, markKey}
function H(level, title, anchor, extra) { TOC.push({ level: level, title: title, anchor: anchor }); return `<h${level} id="${esc(anchor)}">${mark('h:' + anchor)}${title}${extra || ''}</h${level}>`; }

const nonProcess = IDS.filter(i => i.kind !== 'process');
const symbols = nonProcess.filter(i => i.kind === 'symbol');
const abc = D.abc || [];

let body = '';

// ---- title page
body += `<section class="title-page">
  <p class="over">motizukipdf · the IUT toolkit</p>
  <h1>Inter-universal Teichmüller Theory<br><span>data types and processes</span></h1>
  <p class="sub">A manual and demo: every data type in its form and with its reference to the original papers, and the processes that act on them, walked through step by step.</p>
  <table class="meta">
    <tr><td>identifiers</td><td>${nonProcess.length} data types and notations, ${PROCS.length} processes (<code>src/iut_ids.c</code>, <code>src/iut_proc.c</code>)</td></tr>
    <tr><td>demo Θ-data</td><td>${esc(D.name)}${abc.length ? ` — the abc triple ${abc[0]} + ${abc[1]} = ${abc[2]}, Frey curve y² = x(x − ${abc[0]})(x + ${abc[1]}), l = ${D.l}` : ''}</td></tr>
    <tr><td>papers</td><td>the PDFs in <code>pdf/</code>; page numbers are PDF page numbers, which coincide with the printed ones</td></tr>
    <tr><td>generated</td><td>${DATE}, from commit <code>${esc(GIT)}</code> by <code>scripts/manual/build.js</code></td></tr>
  </table>
  <div class="title-fig">${fig(SV.svg(560, 330, DIAGRAMS.latticeFig(560, 330, {})), '')}</div>
</section>`;

// ---- table of contents (filled in after the body is known)
body += '<section class="toc-page"><h2 class="toc-title">Contents</h2>%%TOC%%</section>';

// ---- 0 how to read
body += `<section class="chapter">${H(2, '0 · How to read this manual', 'how')}
<p>This manual is generated from the toolkit's own tables, so it matches the code exactly: the identifier table <code>src/iut_ids.c</code> (also <code>docs/IDENTIFIERS.md</code>, <code>lean/IUT/Identifiers.lean</code>), the process registry <code>src/iut_proc.c</code> (<code>docs/PROCESSES.md</code>), the C headers <code>src/iut.h</code> and <code>src/iut_i.h</code>, the diagrams of <code>scripts/manual/lib/diagrams.js</code> and the ten progressions of <code>scripts/manual/lib/processes.js</code>. Each entry of Part I shows one data type or notation in three ways:</p>
<ul>
  <li><b>form</b> — the C struct that implements it, field by field, with the meaning of each field (the Lean port in <code>lean/IUT/</code> mirrors the same fields; where a Lean structure of the same name exists it is named);</li>
  <li><b>reference</b> — where the object is introduced or recalled in the papers, resolved to the paper, the section, the statement and the page of the PDF in <code>pdf/</code>, e.g. <i>[IUT I] §3, Definition 3.1 p. 61</i>. Papers are abbreviated as in the source code: ${Object.keys(PAGEIDX).map(t => `[${esc(PAPER_SHORT[t] || t)}]`).join(', ')} (see the table below);</li>
  <li><b>identifier</b> — the English-letters-only name (<code>^[A-Za-z]+$</code>, unique case-insensitively) under which it appears in the C code, the JSON, the web app and Lean, obtained from the notation through the symbol dictionary of §1.</li>
</ul>
<p>Part II shows the processes: the ten illustrated progressions (scripts/manual/lib/processes.js), step by step with a diagram for every step, and then all ${PROCS.length} processes of the registry with the transcript of <code>iut run &lt;id&gt;</code> on the demo Θ-data. Part III is a demo session: generation and validation of the Θ-data and a walk through the log-theta-lattice with the text views of the C program. The appendix is an alphabetical index of all identifiers with page numbers.</p>
<p>The program models the <em>combinatorics and the numbers</em> of the theory — which labels, which copies are identified, which indeterminacies are incurred, which inequality results — not the anabelian reconstruction algorithms; see <code>docs/DATA_MODEL.md</code> §8 for what is and is not computed.</p>
${H(3, 'The papers', 'papers')}
<table class="papers"><thead><tr><th>tag</th><th>title</th><th>file in <code>pdf/</code></th><th>pages</th><th>indexed statements</th></tr></thead><tbody>
${Object.keys(PAGEIDX).map(t => { const P = PAGEIDX[t]; return `<tr><td><b>[${esc(PAPER_SHORT[t] || t)}]</b></td><td>${esc(P.title)}</td><td><code>${esc(P.file)}</code></td><td>${P.npages}</td><td>${Object.keys(P.index).length}</td></tr>`; }).join('\n')}
</tbody></table>
<p class="small">Statements were located by scanning the text of each PDF for the headings <i>Definition</i>, <i>Proposition</i>, <i>Corollary</i>, <i>Theorem</i>, <i>Remark</i>, <i>Example</i>, <i>Lemma</i>, <i>Fig.</i> and <i>Section / §</i> (<code>scripts/manual/pageindex.py</code> → <code>docs/manual/pageindex.json</code>). A citation whose statement could not be located is printed without a page number.</p>
</section>`;

// ---- 1 symbols
body += `<section class="chapter">${H(2, '1 · The symbol dictionary and the identifier rule', 'symbols')}
<p>Most of the notation of IUT uses symbols that are not letters: †HT, ‡HT, F⊢×μ-prime-strip, F⊩_Δ, Θ×μ_LGP-link, F_l^{⋊±}, S^±_{j+1}, … Every such object has an identifier matching <code>^[A-Za-z]+$</code>, built by replacing each symbol by a word. The ${symbols.length} symbols:</p>
${cardFig('idents')}
<table class="symbols"><thead><tr><th>symbol</th><th>word</th><th>meaning</th><th>introduced / recalled</th></tr></thead><tbody>
${symbols.map(s => `<tr id="id-${esc(s.id)}"><td class="notation">${mark('id:' + s.id)}${esc(s.notation)}</td><td><code class="idn">${esc(s.id)}</code></td><td>${esc(s.desc)}</td><td>${cite(s.ref)}</td></tr>`).join('\n')}
</tbody></table>
<p>Numbers are spelled out (<code>Zero</code>, <code>One</code>, <code>TwoL</code>, <code>JSq</code>, <code>LStar</code>, <code>LPm</code>); l*, l± and S^±_{j+1} become <code>LStar</code>, <code>LPm</code>, <code>SPmJPlusOne</code>; LGP / lgp and MOD / mod become <code>LGPTorsor</code> / <code>LgpIdeal</code> and <code>MODTorsor</code> / <code>ModIdeal</code>. <code>make check</code> fails if any identifier is not letters-only or collides with another one case-insensitively.</p>
</section>`;

// ---- Part I
body += `<section class="part"><h1 class="part-title">${mark('h:part1')}Part I<br><span>The data types</span></h1>
<p class="part-lead">${nonProcess.length - symbols.length} objects in ${CHAPTERS.length} chapters, grouped by kind and ordered by the paper and statement that introduce them. An entry with a <b>form</b> block is implemented by a C struct of its own; the others are fields, kinds or labelled instances of a struct named in the entry.</p></section>`;
TOC.push({ level: 1, title: 'Part I · The data types', anchor: 'part1' });
let chapNo = 2;
CHAPTERS.forEach(ch => {
  const pool = nonProcess.filter(i => ch.kinds.includes(i.kind));
  const lead = (ch.lead || []).map(x => IDMAP[x.toLowerCase()]).filter(x => x && pool.includes(x));
  const entries = lead.concat(pool.filter(i => !lead.includes(i)).sort(cmpRef));
  body += `<section class="chapter">${H(2, `${chapNo} · ${ch.title}`, 'ch-' + ch.id)}
<p class="intro">${esc(ch.intro)}</p>
${ch.cards.map(cardFig).join('\n')}
<p class="count">${entries.length} entries: ${ch.kinds.map(k => `${entries.filter(e => e.kind === k).length} ${KIND_LABEL[k]}`).join(', ')}.</p>
${entries.map(e => identEntry(e)).join('\n')}
</section>`;
  chapNo++;
});

// ---- Part II
body += `<section class="part"><h1 class="part-title">${mark('h:part2')}Part II<br><span>The processes</span></h1>
<p class="part-lead">The verbs of the theory. Chapter ${chapNo} walks through the ten progressions step by step, with the diagram of every step; chapter ${chapNo + 1} lists all ${PROCS.length} processes of the registry, each with its citation and the transcript of <code>iut run</code> on the demo Θ-data (${esc(D.name)}).</p></section>`;
TOC.push({ level: 1, title: 'Part II · The processes', anchor: 'part2' });

body += `<section class="chapter">${H(2, `${chapNo} · Ten progressions, step by step`, 'progressions')}
<p class="intro">Each progression is a sequence of states of the data model; the web app (<code>htdocs/index.html</code>, "Worked examples") walks through the same constructions on the live C engine; the diagrams below are rendered for the demo data.</p>`;
PROCESSES.list.forEach((p, k) => {
  body += `<section class="progression">${H(3, `${chapNo}.${k + 1} ${esc(p.title.replace(/^\d+\s*·\s*/, ''))}`, 'prog-' + p.id)}
  <p class="where"><span class="lbl">sources</span> ${cite(p.ref)}</p>
  <p class="intro">${p.intro}</p>`;
  p.steps.forEach((st, i) => {
    let svg; try { svg = st.draw(CTX); } catch (e) { svg = `<p class="err">${esc(e.message)}</p>`; }
    body += `<div class="step"><div class="step-head"><span class="step-no">step ${i + 1} / ${p.steps.length}</span> <b>${esc(st.title)}</b></div>
    ${fig(svg, '')}
    <p class="step-text">${st.text}</p>${st.ref ? `<p class="where"><span class="lbl">ref</span> ${cite(st.ref)}</p>` : ''}</div>`;
  });
  body += '</section>';
});
body += '</section>';
chapNo++;

// the registry, grouped by paper
const PROC_PAPERS = ['IUTchI', 'IUTchII', 'IUTchIII', 'IUTchIV', 'EssLgc', 'Alien'];
body += `<section class="chapter">${H(2, `${chapNo} · The registry: all ${PROCS.length} processes`, 'registry')}
<p class="intro">Every row is a family of C functions in <code>src/iut_ops_*.c</code> (declared in <code>src/iut_ops.h</code>), run live in the web app (<code>htdocs/index.html</code>, "Processes"); <code>iut run &lt;id&gt;</code> demonstrates it on given Θ-data and <code>iut run --all</code> runs them all (exit code = number of failures). The process ids are identifiers of the table too (kind <i>process</i>).</p>
<table class="registry"><thead><tr><th>id</th><th>paper · section</th><th>process</th><th>inputs → outputs</th></tr></thead><tbody>
${PROCS.map(p => `<tr><td><a href="#proc-${esc(p.id)}"><code class="idn">${esc(p.id)}</code></a></td><td>${cite('[' + p.paper + '] ' + p.section)}</td><td>${esc(p.name)}</td><td>${esc(p.inputs)} → ${esc(p.outputs)}</td></tr>`).join('\n')}
</tbody></table>`;
PROC_PAPERS.forEach((tag, k) => {
  const ps = PROCS.filter(p => p.paper === tag);
  body += `<section class="proc-paper">${H(3, `${chapNo}.${k + 1} Processes of [${esc(PAPER_SHORT[tag])}] — ${esc(PAGEIDX[tag] ? PAGEIDX[tag].title : tag)}`, 'procs-' + tag)}`;
  ps.forEach(p => {
    const tr = TRANSCRIPT[p.id] || ['(no transcript)'];
    const ok = /=> ok\s*$/.test(tr.filter(Boolean).slice(-1)[0] || '');
    body += `<section class="proc" id="proc-${esc(p.id)}">${mark('id:' + p.id)}
    <h4><code class="idn">${esc(p.id)}</code> <span class="pname">${esc(p.name)}</span> <span class="verdict ${ok ? 'ok' : 'fail'}">${ok ? '✓ ok' : 'see transcript'}</span></h4>
    <p class="where"><span class="lbl">where</span> ${cite('[' + p.paper + '] ' + p.section, { long: true })}</p>
    <p class="io"><span class="lbl">inputs</span> ${esc(p.inputs)} <span class="lbl">outputs</span> ${esc(p.outputs)}</p>
    <pre class="transcript">${esc(tr.slice(2).join('\n').replace(/\n+$/, ''))}</pre>
  </section>`;
  });
  body += '</section>';
});
body += '</section>';
chapNo++;

// ---- Part III demo
body += `<section class="part"><h1 class="part-title">${mark('h:part3')}Part III<br><span>A demo session</span></h1>
<p class="part-lead">The text views of the C program on the demo Θ-data, and the standalone figures of the web app: the Hodge theater assembled in five stages, the whole lattice and the infinite H, the multiradial representation and the étale-picture.</p></section>`;
TOC.push({ level: 1, title: 'Part III · A demo session', anchor: 'part3' });
body += `<section class="chapter">${H(2, `${chapNo} · Generate and validate`, 'demo-validate')}
<p class="intro"><code>iut validate ${esc(DATA_ARGS.join(' '))}</code> — the initial Θ-data as the program prints it and the validation report: every condition of [IUTchI] Def 3.1 that can be checked on numbers is checked; the rest is listed as asserted.</p>
<pre class="transcript">${esc(VALIDATE.trim())}</pre>
</section>`;
chapNo++;
const ht00 = LAT.peek ? LAT.peek(0, 0) : null;
body += `<section class="chapter">${H(2, `${chapNo} · Assemble a Hodge theater`, 'demo-ht')}
<p class="intro">The Θ±ell NF-Hodge theater at (0,0), built in the five stages of [IUTchI] §4–§6: the capsule F_T, the Θ±- and Θell-bridges, the capsule F_J, the Θ- and NF-bridges, the gluing 0, ⊞ ↦ >.</p>
${[1, 2, 3, 4, 5].map(st => fig(SV.svg(560, 330, DIAGRAMS.hodgeTheaterSVG(D, ht00, 560, 330, { stage: st })), `stage ${st} of 5 — ${['the capsule F_T (t ∈ F_l, distinct basepoints)', 'the Θ±-bridge F_T → F_⊞ and the Θell-bridge D_T → D_⊚±', 'the capsule F_J (j ∈ F_l^*)', 'the Θ-bridge F_J → F_> and the NF-bridge F_J → F_⊛', 'the gluing 0, ⊞ ↦ > along F_l ⊇ F_l^× ↠ F_l^*'][st - 1]} — ${cite('[IUTchI] Def 6.4, Def 5.5, Def 6.13; [Alien] Fig 3.8')}`)).join('\n')}
</section>`;
chapNo++;
body += `<section class="chapter">${H(2, `${chapNo} · Walk the log-theta-lattice`, 'demo-walk')}
<p class="intro"><code>iut walk --rows 2 ${esc(DATA_ARGS.join(' '))}</code> — the infinite H on columns 0 and 1 with the Θ×μ_LGP-link (0,0) → (1,0), the Hodge theater at the focus, the alien copies across the Θ-link, the log-shells and the multiradial log-volume estimate.</p>
${fig(SV.svg(560, 330, DIAGRAMS.latticeFig(560, 330, {})), `the entire log-theta-lattice ⊇ the infinite H actually used — ${cite('[IUTchIII] Def 1.4; [Alien] Fig 3.6; [EssLgc] §3.3')}`)}
${fig(SV.svg(560, 330, DIAGRAMS.multiradialFig(D, 560, 330, {})), `the multiradial representation of the Θ-pilot — ${cite('[IUTchIII] Thm 3.11; [Alien] Fig 3.16–3.18')}`)}
${fig(SV.svg(560, 300, DIAGRAMS.etalePictureFig(560, 300, {})), `the étale-picture: every column (n,◦) around the one bi-coric core D⊢ — ${cite('[IUTchI] Cor 6.10; [IUTchIII] Cor 3.12; [Alien] Fig 3.5')}`)}
<pre class="transcript">${esc(WALK.trim())}</pre>
</section>`;
chapNo++;
body += `<section class="chapter">${H(2, `${chapNo} · Species and mutations`, 'demo-species')}
<p class="intro"><code>iut species</code> — the species table (which struct implements which species) and the mutation table (which function implements which mutation, and whether it is a core), with the mutation-history of the infinite H.</p>
<pre class="transcript">${esc(SPECIES_TXT.trim())}</pre>
</section>`;

// ---- appendix: struct map + index
body += `<section class="part"><h1 class="part-title">${mark('h:appendix')}Appendix</h1></section>`;
TOC.push({ level: 1, title: 'Appendix', anchor: 'appendix' });
body += `<section class="chapter">${H(2, 'A · C structs and the identifiers they implement', 'structs')}
<table class="structmap"><thead><tr><th>struct / enum</th><th>header</th><th>identifiers</th></tr></thead><tbody>
${Object.keys(FORM_PRIMARY).map(s => { const ids = Object.keys(FORM).filter(k => FORM[k].some(f => f.struct === s)).map(k => IDMAP[k].id); const h = STRUCTS[s] || ENUMS[s]; return `<tr><td><code>${esc(s)}</code></td><td>${esc(h ? h.file : '')}</td><td>${ids.map(x => `<a href="#id-${esc(x)}">${esc(x)}</a>`).join(', ')}</td></tr>`; }).join('\n')}
</tbody></table></section>`;
body += `<section class="chapter index">${H(2, 'B · Index of identifiers', 'index')}
<p class="small">All ${IDS.length} identifiers with their notation and the page of their entry.</p>
<div class="index-cols">
${IDS.slice().sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase())).map(i => `<div class="ix"><a href="#${i.kind === 'process' ? 'proc-' : 'id-'}${esc(i.id)}"><code>${esc(i.id)}</code></a> <span class="notation">${esc(i.notation)}</span> <span class="pgn" data-key="id:${esc(i.id)}"></span></div>`).join('\n')}
</div></section>`;

// ---- CSS
const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
:root { --text:#1c2130; --dim:#5d6578; --line:#dde2ee; --soft:#eef1f8; --accent:#2f6fde; --theta:#e4572e; --log:#1f9d55; --hull:#7b4fd1; --alien:#d7263d; --frob:#f29e1f; }
html { font-size: 10.2pt; }
body { font-family: Inter, "DejaVu Sans", "Segoe UI", Helvetica, Arial, sans-serif; color: var(--text); line-height: 1.38; margin: 0; }
code, pre { font-family: "JetBrains Mono", "DejaVu Sans Mono", Menlo, Consolas, monospace; font-size: 0.9em; }
.notation, .mathy { font-family: "DejaVu Sans", "DejaVu Serif", "FreeSerif", sans-serif; }
h1, h2, h3, h4 { font-weight: 700; line-height: 1.2; break-after: avoid; page-break-after: avoid; }
h2 { font-size: 1.7rem; margin: 0 0 .6rem; padding-bottom: .3rem; border-bottom: 2px solid var(--text); }
h3 { font-size: 1.2rem; margin: 1.4rem 0 .4rem; color: var(--text); }
h4 { font-size: 1.02rem; margin: 0 0 .2rem; }
p { margin: .3rem 0 .5rem; }
a { color: var(--accent); text-decoration: none; }
.mk { color: transparent; font-size: 1px; position: absolute; }
.title-page { page-break-after: always; break-after: page; padding-top: 30mm; }
.title-page .over { color: var(--dim); text-transform: uppercase; letter-spacing: .12em; font-size: .85rem; }
.title-page h1 { font-size: 2.6rem; margin: .2rem 0 .8rem; }
.title-page h1 span { color: var(--theta); font-weight: 600; font-size: 1.9rem; }
.title-page .sub { font-size: 1.1rem; color: var(--dim); max-width: 140mm; }
.title-page .meta { margin-top: 1.4rem; border-collapse: collapse; }
.title-page .meta td { padding: .25rem .8rem .25rem 0; vertical-align: top; border-top: 1px solid var(--line); }
.title-page .meta td:first-child { color: var(--dim); white-space: nowrap; }
.title-fig { margin-top: 2rem; max-width: 150mm; }
.toc-page { page-break-after: always; break-after: page; }
.toc-title { border: none; }
.toc { list-style: none; padding: 0; margin: 0; }
.toc li { display: flex; align-items: baseline; margin: .15rem 0; }
.toc li.l1 { font-weight: 700; margin-top: .9rem; font-size: 1.05rem; }
.toc li.l2 { margin-left: 0; }
.toc li.l3 { margin-left: 1.6rem; color: var(--dim); font-size: .92rem; }
.toc .t { flex: 0 1 auto; }
.toc .dots { flex: 1 1 auto; border-bottom: 1px dotted var(--line); margin: 0 .4rem; min-width: 1rem; transform: translateY(-.25em); }
.toc .p { flex: 0 0 auto; font-variant-numeric: tabular-nums; }
.part { page-break-before: always; break-before: page; padding-top: 60mm; page-break-after: always; break-after: page; }
.part-title { font-size: 2.4rem; border: none; margin: 0 0 1rem; }
.part-title span { color: var(--theta); font-size: 1.6rem; font-weight: 600; }
.part-lead { font-size: 1.05rem; color: var(--dim); max-width: 150mm; }
.chapter { page-break-before: always; break-before: page; }
.chapter .intro { color: var(--dim); }
.count { font-size: .85rem; color: var(--dim); margin: .8rem 0 1rem; }
figure { margin: .8rem 0 1rem; break-inside: avoid; page-break-inside: avoid; }
figure svg.fig { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
figcaption { font-size: .85rem; color: var(--dim); margin-top: .35rem; }
figcaption b { color: var(--text); }
.figref { color: var(--text); }
.idents a code { background: var(--soft); border-radius: 4px; padding: 0 .3em; }
.ident { break-inside: avoid; page-break-inside: avoid; border-top: 1px solid var(--line); padding: .55rem 0 .5rem; position: relative; }
.ident.has-form { break-inside: auto; page-break-inside: auto; }
.ident.has-form h4, .ident.has-form .desc, .ident.has-form .where { break-after: avoid; }
.ident h4 { display: flex; flex-wrap: wrap; gap: .5rem .8rem; align-items: baseline; }
code.idn { background: var(--accent); color: #fff; border-radius: 4px; padding: .05em .4em; font-weight: 600; }
.ident .notation { font-size: 1.05rem; }
.kind { color: var(--dim); font-size: .8rem; font-weight: 400; margin-left: auto; }
.desc { margin: .15rem 0 .25rem; }
.where, .io, .lean, .form-ref { font-size: .86rem; color: var(--dim); margin: .1rem 0; }
.lbl { text-transform: uppercase; letter-spacing: .06em; font-size: .7rem; color: var(--dim); margin-right: .3rem; }
.cite .paper { font-weight: 700; color: var(--text); }
.cite .pg { color: var(--theta); font-variant-numeric: tabular-nums; }
.cite-item { white-space: nowrap; }
.form { margin: .45rem 0 .2rem; border: 1px solid var(--line); border-radius: 6px; padding: .4rem .6rem; background: #fbfcfe; }
.form-head { font-size: .86rem; display: flex; justify-content: space-between; }
.form-head .file { color: var(--dim); }
.form-comment { font-size: .82rem; color: var(--dim); margin: .25rem 0; }
table { border-collapse: collapse; width: 100%; font-size: .84rem; }
th { text-align: left; color: var(--dim); font-weight: 600; border-bottom: 1px solid var(--line); padding: .2rem .4rem; }
td { padding: .18rem .4rem; vertical-align: top; border-bottom: 1px solid #f0f2f7; }
table.fields td:first-child { white-space: nowrap; }
table.fields tr.group td { background: var(--soft); color: var(--dim); font-style: italic; }
table.symbols td.notation { font-size: 1.1rem; }
table.registry td:nth-child(1), table.structmap td:nth-child(1) { white-space: nowrap; }
tr { break-inside: avoid; page-break-inside: avoid; }
pre.transcript { background: #f6f8fc; border: 1px solid var(--line); border-radius: 6px; padding: .5rem .7rem; font-size: 7.6pt; line-height: 1.32; white-space: pre-wrap; word-break: break-word; margin: .4rem 0 .8rem; }
.proc { border-top: 1px solid var(--line); padding: .6rem 0 .4rem; }
.proc h4 { display: flex; flex-wrap: wrap; gap: .5rem .8rem; align-items: baseline; }
.proc .pname { font-weight: 500; }
.verdict { margin-left: auto; font-size: .8rem; font-weight: 600; }
.verdict.ok { color: var(--log); } .verdict.fail { color: var(--alien); }
.progression { }
.step { break-inside: avoid; page-break-inside: avoid; margin: .6rem 0 1rem; }
.step-head { font-size: .95rem; margin-bottom: .2rem; }
.step-no { color: var(--theta); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: .75rem; margin-right: .5rem; }
.step figure { margin: .2rem 0 .3rem; }
.step-text { font-size: .9rem; }
.small { font-size: .82rem; color: var(--dim); }
.err { color: var(--alien); }
.index-cols { column-count: 3; column-gap: 1.2rem; font-size: .78rem; }
.ix { display: flex; gap: .3rem; align-items: baseline; break-inside: avoid; }
.ix .notation { color: var(--dim); flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ix .pgn { color: var(--theta); font-variant-numeric: tabular-nums; }
.ix .pgn:before { content: ''; }
`;

function tocHtml(pages) {
  return '<ul class="toc">' + TOC.map(t => { const pg = pages ? pages['h:' + t.anchor] : ''; return `<li class="l${t.level}"><span class="t"><a href="#${esc(t.anchor)}">${t.title}</a></span><span class="dots"></span><span class="p">${pg || ''}</span></li>`; }).join('') + '</ul>';
}
function assemble(pages) {
  let b = body.replace('%%TOC%%', tocHtml(pages));
  if (pages) b = b.replace(/<span class="pgn" data-key="([^"]+)"><\/span>/g, (m, k) => `<span class="pgn">${pages[k] || ''}</span>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>IUT data types and processes — manual</title><style>${CSS}</style></head><body>${b}</body></html>`;
}

fs.mkdirSync(OUTDIR, { recursive: true });
const unres = Object.keys(unresolved).sort();
if (unres.length) console.error('unresolved citations (' + unres.length + '): ' + unres.join(' | '));
fs.writeFileSync(HTML_OUT, assemble(null));
console.log('wrote', path.relative(ROOT, HTML_OUT), (fs.statSync(HTML_OUT).size / 1024 | 0) + ' KB,', MARKS.length, 'markers');
if (HTML_ONLY) process.exit(0);

// ------------------------------------------------------------------ 7. PDF: two passes (the first finds the page of every marker)
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const footer = `<div style="font-family: Inter, 'DejaVu Sans', sans-serif; font-size: 7.5pt; color: #5d6578; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;"><span>IUT data types and processes · motizukipdf</span><span class="pageNumber"></span></div>`;
  const pdfOpts = { format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer, margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' }, preferCSSPageSize: true };
  async function render(html, out) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ ...pdfOpts, path: out });
  }
  const pass1 = path.join(OUTDIR, '.pass1.pdf');
  await render(assemble(null), pass1);
  // locate the markers with pdftotext
  const txt = run('pdftotext', ['-layout', pass1, '-']);
  const pages = {}; const byId = {}; MARKS.forEach(m => { byId[m.id] = m.key; });
  txt.split('\f').forEach((pg, i) => { const re = /⟦(m\d+)⟧/g; let m; while ((m = re.exec(pg))) { const key = byId[m[1]]; if (key && !pages[key]) pages[key] = i + 1; } });
  const found = Object.keys(pages).length;
  console.log('pass 1:', txt.split('\f').length - 1, 'pages,', found, '/', MARKS.length, 'markers located');
  const finalHtml = assemble(pages);
  fs.writeFileSync(HTML_OUT, finalHtml);
  await render(finalHtml, PDF_OUT);
  fs.unlinkSync(pass1);
  await browser.close();
  const info = run('pdfinfo', [PDF_OUT]).match(/Pages:\s+(\d+)/);
  console.log('wrote', path.relative(ROOT, PDF_OUT), (fs.statSync(PDF_OUT).size / 1024 | 0) + ' KB,', info ? info[1] + ' pages' : '');
})().catch(e => { console.error(e); process.exit(1); });
