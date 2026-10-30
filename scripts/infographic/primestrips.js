#!/usr/bin/env node
/*
 * scripts/infographic/primestrips.js — the 4K infographic of the nine kinds of prime-strip.
 *
 *   node scripts/infographic/primestrips.js            → docs/primestrips-infographic.svg (master)
 *                                                        docs/primestrips-infographic.png (3840×2160)
 *   node scripts/infographic/primestrips.js --svg-only   skip Chromium, write the SVG only
 *
 * Everything drawn is read from the toolkit, so the picture cannot drift from it:
 *   · the kind table ps_kinds of src/iut_ids.c (identifier, notation, étale-like /
 *     mono-analytic / global flags) and the enum comments of src/iut.h (the datum at v),
 *   · the flags iut_prime_strip_build sets for each kind (ported below, and checked
 *     against what `iut run ForgetLadder` prints),
 *   · the coricity predicates of src/iut_lattice.c,
 *   · the strips a Θ±ell NF-Hodge theater is built from (iut_hodge_theater_new),
 *   · `iut ids --json` (every identifier of kind primestrip and the parts of a strip),
 *   · `iut procs --json` and `iut run LiftToFrobenioids` (the functors between kinds),
 *   · `iut walk` (one concrete F⊩▶×μ-prime-strip as the CLI / TUI print it).
 * The validator rules, the link ↦ glued-kind table and the one-line descriptions of
 * the instances are annotated here and cross-checked against the tables.
 *
 * Layout (3840 × 2160):
 *   header      the rule, the numbers
 *   row A       the nine kinds and the forgetful functors between them ·
 *               what each kind carries at v (the flags) and the ladder as printed
 *   row B       where each kind occurs (Hodge theaters, links, shells) ·
 *               what the validator checks · one strip as the program holds it
 *
 * Text widths are measured with a canvas in Chromium (the same Chromium that
 * renders the PNG) — the method of scripts/infographic/build.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT_SVG = path.join(ROOT, 'docs', 'primestrips-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'primestrips-infographic.png');
const W = 3840, H = 2160;

/* ------------------------------------------------------------ data */
const BIN = path.join(SRC, 'iut');
if (!fs.existsSync(BIN)) { console.error('src/iut is not built: run `make -C src` first'); process.exit(1); }
const iut = args => execFileSync(BIN, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const iutJSON = args => JSON.parse(iut(args));
const fail = msg => { console.error(msg); process.exit(1); };

/* the kind table of src/iut_ids.c, in enum order */
function readKinds() {
  const src = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8');
  const tbl = src.split('ps_kinds[IUT_PS_KIND_COUNT] = {')[1].split('\n};')[0];
  const kinds = [];
  for (const m of tbl.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)",\s*(\d),\s*(\d),\s*(\d)\s*\}/g))
    kinds.push({ id: m[1], notation: m[2], etale: m[3] === '1', mono: m[4] === '1', glob: m[5] === '1' });
  /* the enum of src/iut.h: IUT_PS_X,  /* notation  {datum}  nature *\/ */
  const hdr = fs.readFileSync(path.join(SRC, 'iut.h'), 'utf8');
  const en = hdr.split('typedef enum {').find(s => s.includes('} iut_ps_kind;')).split('} iut_ps_kind;')[0];
  const enums = [];
  for (const m of en.matchAll(/IUT_PS_(\w+)(?:\s*=\s*0)?,\s*\/\*\s*(\S+)\s+(.*?)\s*\*\//g))
    enums.push({ en: m[1], notation: m[2], comment: m[3].replace(/\s{2,}/g, ' ') });
  if (enums.length !== kinds.length) fail(`iut.h enum has ${enums.length} kinds, iut_ids.c table ${kinds.length}`);
  /* the datum at v is the leading {…} or (…) group of the comment (brackets may nest) */
  const leadGroup = s => {
    const open = s[0], close = open === '{' ? '}' : open === '(' ? ')' : null;
    if (!close) return null;
    let d = 0;
    for (let i = 0; i < s.length; i++) { if (s[i] === open) d++; else if (s[i] === close && --d === 0) return s.slice(0, i + 1); }
    return null;
  };
  kinds.forEach((k, i) => {
    if (enums[i].notation !== k.notation) fail(`kind ${i}: enum says ${enums[i].notation}, table ${k.notation}`);
    k.en = enums[i].en; k.comment = enums[i].comment;
    const g = leadGroup(k.comment);
    if (g) { const rest = k.comment.slice(g.length).trim(); const sp = rest.match(/^split\b/); k.datum = g + (sp ? ' split' : ''); k.nature = sp ? rest.slice(5).trim() : rest; }
    else { k.datum = k.comment; k.nature = ''; }
  });
  return kinds;
}

/* the flags iut_prime_strip_build (src/iut_core.c) sets at every v for a kind */
function flagsOf(k) {
  const e = k.en;
  const f = { Pi: !k.mono, G: true, units: !k.etale, modTors: false, valgroup: false, split: false, kummer: 0, glob: k.glob };
  if (!k.etale) {
    f.modTors = ['FMonoUnitsModTors', 'FMonoValUnitsModTors', 'FMonoGlobValUnitsModTors'].includes(e);
    f.valgroup = !['FMonoUnits', 'FMonoUnitsModTors'].includes(e);
    f.split = ['FMono', 'FMonoGlob', 'FMonoValUnitsModTors', 'FMonoGlobValUnitsModTors'].includes(e);
    f.kummer = f.modTors ? 2 : (['F', 'FMonoUnits'].includes(e) ? 1 : 0);
  }
  /* src/iut_lattice.c: iut_vertically_coric / iut_horizontally_coric / iut_bi_coric */
  f.vert = k.etale; f.horiz = e === 'FMonoUnitsModTors' || e === 'DMono'; f.bi = e === 'DMono';
  return f;
}

/* `iut run ForgetLadder`: the ladder as the program prints it, used to check flagsOf */
function readLadder(kinds) {
  const out = iut(['run', 'ForgetLadder']);
  const steps = [];
  for (const m of out.matchAll(/^\s*(?:→\s*)?(\S+)\s+global (\d), valgroup (\d), units (\S+), Kummer (\S+(?: \S+)?)\s+(\[[^\]]+\][^\n]*)$/gm))
    steps.push({ notation: m[1], glob: m[2] === '1', valgroup: m[3] === '1', units: m[4], kummer: m[5].trim(), ref: m[6].trim() });
  if (steps.length !== 5) fail('could not parse the five rungs of `iut run ForgetLadder`:\n' + out);
  for (const s of steps) {
    const k = kinds.find(x => x.notation === s.notation); if (!k) fail('ForgetLadder prints unknown kind ' + s.notation);
    const f = flagsOf(k);
    const units = !f.units ? '—' : f.modTors ? 'O×μ' : 'O×';
    const kummer = f.kummer === 2 ? 'Ism-orbit' : f.kummer === 1 ? 'Ẑ×' : '—';
    if (f.glob !== s.glob || f.valgroup !== s.valgroup || units !== s.units || kummer !== s.kummer)
      fail(`flagsOf(${k.id}) disagrees with iut run ForgetLadder: ${JSON.stringify(s)}`);
    s.id = k.id;
  }
  const deg = out.match(/pilot object degree (-?[\d.]+)/);
  return { steps, pilotDegree: deg ? deg[1] : '?', raw: out.split('\n').filter(l => /global \d, valgroup|pilot object/.test(l)).map(l => l.replace(/^\s+/, '')) };
}

/* `iut run LiftToFrobenioids`: the functors between kinds, with Cor 5.3 */
function readFunctors(kinds) {
  const out = iut(['run', 'LiftToFrobenioids']);
  const fs_ = [];
  for (const m of out.matchAll(/^\s+([A-Za-z]+)\s+→\s+([A-Za-z]+)\s+(.+?)\s+bijective on Isom: (yes|no)\s+surjective: (yes|no)\s+(\[.*)$/gm))
    if (kinds.find(k => k.id === m[1]) && kinds.find(k => k.id === m[2]))
      fs_.push({ from: m[1], to: m[2], what: m[3].trim(), bij: m[4] === 'yes', surj: m[5] === 'yes', ref: m[6].trim() });
  if (fs_.length < 5) fail('could not parse `iut run LiftToFrobenioids`:\n' + out);
  const lift = out.match(/lift of the D-prime-strip .*?: (yes|no), Π copy preserved: (yes|no)/);
  return { functors: fs_, lift: lift ? { ok: lift[1] === 'yes', pi: lift[2] === 'yes' } : null };
}

/* the strips a Θ±ell NF-Hodge theater is built from: iut_hodge_theater_new in src/iut_core.c */
function readHodgeTheaterStrips(kinds, byId) {
  const src = fs.readFileSync(path.join(SRC, 'iut_core.c'), 'utf8');
  const body = src.split('iut_hodge_theater *iut_hodge_theater_new(')[1];
  const ALIAS = { FMonoGlobLGP: 'FMonoGlobLGPTorsor', FMonoGlobLgp: 'FMonoGlobLgpIdeal' };
  const members = [];
  for (const m of body.matchAll(/iut_prime_strip_build\(&ht->([\w.]+),\s*IUT_PS_(\w+),\s*"(\w+)",\s*d,\s*[^,]+,\s*(\w+),\s*([^)]+)\)/g)) {
    const field = m[1], leaf = field.split('.').pop(), ident = ALIAS[leaf] || leaf;
    const k = kinds.find(x => x.en === m[2]); if (!k) fail('iut_hodge_theater_new builds an unknown kind IUT_PS_' + m[2]);
    if (!byId[ident]) fail(`iut_hodge_theater_new builds ht->${field}, which has no identifier ${ident}`);
    members.push({ ident, field: 'ht->' + field, kind: k.id, label: m[3], theta: m[4] !== 'NULL' });
  }
  if (members.length < 10) fail('could not find the strips of iut_hodge_theater_new');
  return members;
}

/* one concrete strip, as iut_view_prime_strip prints it inside `iut walk` */
function readExampleStrip() {
  const lines = iut(['walk', '--rows', '1']).split('\n');
  const i = lines.findIndex(l => /prime-strip\s+'LGPTorsor'/.test(l));
  if (i < 0) fail('`iut walk` does not print the LGPTorsor strip');
  const block = [lines[i].trim()];
  for (let j = i + 1; j < lines.length && /^ {4}\S/.test(lines[j]); j++) block.push(lines[j].trim());
  const gen = iut(['gen']).split('\n');
  const name = (gen.find(l => /^\s*name\s*:/.test(l)) || '').replace(/^\s*name\s*:\s*/, '').trim();
  return { block, name };
}

const kinds = readKinds();
if (kinds.length !== 9) fail('expected nine kinds, found ' + kinds.length);
const ids = iutJSON(['ids', '--json']);
const procs = iutJSON(['procs', '--json']);
const byId = {}; for (const r of ids) byId[r.id] = r;
for (const k of kinds) { if (!byId[k.id]) fail('kind ' + k.id + ' is not in the identifier table'); k.ref = byId[k.id].ref; k.desc = byId[k.id].desc; k.flags = flagsOf(k); }
/* which kinds are species of iut_species_table */
{
  const src = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8');
  const sp = src.split('iut_species_table[] = {')[1].split('\n};')[0];
  for (const k of kinds) k.species = new RegExp(`\\{\\s*"${k.id}"`).test(sp);
}
const ladder = readLadder(kinds);
const { functors, lift } = readFunctors(kinds);
const htStrips = readHodgeTheaterStrips(kinds, byId);
const example = readExampleStrip();

/* every identifier of kind primestrip that is not one of the nine kinds: where it lives */
const kindIds = new Set(kinds.map(k => k.id));
const instances = ids.filter(r => r.kind === 'primestrip' && !kindIds.has(r.id));
/* the kind of each instance: from iut_hodge_theater_new where the toolkit builds it, else annotated here */
const INSTANCE_KIND = {
  DGt: 'DPrimeStrip', DMonoGt: 'DMonoPrimeStrip', DMonoTriangle: 'DMonoPrimeStrip',
  FMonoGlobD: 'FMonoGlobPrimeStrip', BasicPrimeStrip: 'FMonoUnitsModTorsPrimeStrip',
};
const INSTANCE_WHERE = {
  FBoxPlus: 'Θ±ell-HT: target of the Θ±-bridge F_T → F_⊞', DCircDotPm: 'Θ±ell-HT: target of the Θell-bridge D_T → D_⊚±',
  FGt: 'ΘNF-HT: target of the Θ-bridge F_J → F_>', FCircAst: 'ΘNF-HT: target of the NF-bridge F_J → F_⊛',
  FMonoGlobMod: 'Θ-HT: carries q̲_v; codomain side of the Θ-link', FMonoGlobTht: 'Θ-HT: carries Θ̲_v; domain side of the Θ-link',
  FMonoGlobTriangle: 'label Δ (0 and F_l^* identified); home of the q-pilot', FMonoGlobEnv: 'theta monoids Ψ_env',
  FMonoGlobGau: 'Gaussian monoids Ψ_gau: Θ×μ_gau-link', FMonoGlobLGPTorsor: 'LGP-monoids via F_MOD: Θ×μ_LGP-link, the Θ-pilot',
  FMonoGlobLgpIdeal: 'lgp via F_mod: Θ×μ_lgp-link, log-volumes', DGt: 'base of F_>', DMonoGt: 'mono-analytic base of F_>',
  DMonoTriangle: 'the bi-coric core at the centre of the étale picture', FMonoGlobD: 'D-version of F⊩_mod: D⊩_mod, Prime ≅ V, {D⊢_v}',
  BasicPrimeStrip: '[FormIUT] §1: the horizontally coric gluing datum of the Θ×μ-links',
};
for (const r of instances) {
  const m = htStrips.find(s => s.ident === r.id);
  r.kindId = m ? m.kind : INSTANCE_KIND[r.id];
  if (!r.kindId) fail(`primestrip identifier ${r.id} is not built by iut_hodge_theater_new and has no entry in INSTANCE_KIND`);
  if (!INSTANCE_WHERE[r.id]) fail(`primestrip identifier ${r.id} has no entry in INSTANCE_WHERE`);
  r.where = INSTANCE_WHERE[r.id]; r.field = m ? m.field : null; r.theta = m ? m.theta : false;
}
for (const id of Object.keys(INSTANCE_KIND).concat(Object.keys(INSTANCE_WHERE))) if (!byId[id]) fail('annotation for unknown identifier ' + id);

/* the links of src/iut_ids.c and the kind of strip each one glues (iut_link.glued_kind) */
const LINK_GLUES = {
  ThetaLink: ['FMonoGlobPrimeStrip', '†F⊩_tht ≅ ‡F⊩_mod, Θ̲_v ↦ q̲_v', '[IUTchI] Cor 3.7'],
  ThetaUnitsModTorsLink: ['FMonoGlobValUnitsModTorsPrimeStrip', 'units modulo torsion', '[IUTchII] Cor 4.10 (iii)'],
  ThetaUnitsModTorsGauLink: ['FMonoGlobValUnitsModTorsPrimeStrip', 'through F⊩_gau', '[IUTchII] Cor 4.10 (iii)'],
  ThetaUnitsModTorsLGPTorsorLink: ['FMonoGlobValUnitsModTorsPrimeStrip', 'through F⊩_LGP: the horizontal arrow', '[IUTchIII] Def 3.8'],
  ThetaUnitsModTorsLgpIdealLink: ['FMonoGlobValUnitsModTorsPrimeStrip', 'through F⊩_lgp', '[IUTchIII] Def 3.8'],
  LogLink: ['FPrimeStrip', 'O× → log(O×) at every v; makes the log-shells', '[IUTchIII] Def 1.1'],
  DThetaPmEllNFLink: ['DMonoPrimeStrip', 'the étale picture: D⊢ shared by all spokes', '[IUTchII] Cor 4.10 (iv)'],
};
{
  const src = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8');
  const tbl = src.split('link_kinds[IUT_LINK_KIND_COUNT] = {')[1].split('\n};')[0];
  const links = [...tbl.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)"/g)].map(m => ({ id: m[1], notation: m[2] }));
  const a = links.map(l => l.id).sort().join(','), b = Object.keys(LINK_GLUES).sort().join(',');
  if (a !== b) fail('link_kinds and LINK_GLUES disagree:\n  table: ' + a + '\n  notes: ' + b);
  for (const l of links) { const g = LINK_GLUES[l.id]; if (!kindIds.has(g[0])) fail(l.id + ' glues unknown kind ' + g[0]); l.glues = g[0]; l.how = g[1]; l.ref = g[2]; }
  var links_ = links; // eslint-disable-line no-var
}

/* what iut_validate_prime_strip (src/iut_core.c) checks, rule by rule */
const RULES = [
  ['error', 'all', 'indexed by V: one local datum per v ∈ V, |V| as in the Θ-data', '[IUTchI] Def 4.1'],
  ['error', 'holomorphic', 'a holomorphic strip needs Π_v at every v', '[IUTchI] Def 4.1'],
  ['error', 'mono-analytic', 'a mono-analytic strip must NOT remember Π_v, only G_v', '[IUTchI] Def 4.1'],
  ['error', 'all', 'G_v present at every v', '[IUTchI] Def 4.1'],
  ['error', 'étale-like', 'carries no Frobenius-like monoid', '[IUTchI] Def 4.1'],
  ['error', 'Frobenius-like', 'needs a monoid O at every v', '[IUTchI] Def 5.2'],
  ['error', 'F⊢×μ', 'O×μ with a ×μ-Kummer structure (an Ism-orbit), and no value-group portion O▶', '[IUTchII] Def 4.9 (i)'],
  ['error', 'F⊢▶×μ, F⊩▶×μ', 'O▶ × O×μ: value groups and units modulo torsion', '[IUTchII] Def 4.9'],
  ['error', 'F⊢, F⊩', 'split Frobenioids: O▷ = O× × O▶', '[IUTchI] Def 5.2 (ii)'],
  ['error', '⊩', 'the global realified Frobenioid C⊩ is present — and only ⊩ strips carry it', '[IUTchI] Def 5.2 (iv)'],
  ['warn', 'O▶ at v ∈ V^bad', 'a q̲-generator of the value group is recorded', '[IUTchI] Ex 3.2'],
  ['error', 'O▶', 'every value-group generator has positive valuation', '[IUTchI] Ex 3.2'],
  ['warn', '⊩', 'the pilot object has arithmetic degree ≤ 0', '[IUTchIII] Def 3.8'],
];

/* the processes that act on prime-strips */
const PROC_RE = /strip|PrimeStrip|F⊢|F⊩|D⊢/;
const EXTRA_PROCS = ['CheckBicoric', 'MakeLogShells', 'ExtractCapsules', 'BuildBridges', 'BuildProcessions', 'ForgetToDHodgeTheater'];
const stripProcs = procs.filter(p => PROC_RE.test(p.name + ' ' + p.inputs + ' ' + p.outputs) || EXTRA_PROCS.includes(p.id));
for (const id of EXTRA_PROCS) if (!procs.find(p => p.id === id)) fail('unknown process ' + id);

/* the parts of a strip that have identifiers of their own */
const PARTS = ['PiV', 'GV', 'CMonoGlob', 'PrimeCMonoGlob', 'RhoV', 'UnitsModTorsKummer', 'UnitsKummer', 'QUnderV', 'QPilot', 'ThetaPilot', 'FT', 'FJ', 'SPmJPlusOne'].filter(id => byId[id]).map(id => byId[id]);

const data = {
  kinds, instances, htStrips, ladder, functors, lift, links: links_, RULES, example,
  stripProcs: stripProcs.map(p => ({ id: p.id, paper: p.paper, inputs: p.inputs, outputs: p.outputs })),
  parts: PARTS.map(r => ({ id: r.id, notation: r.notation, kind: r.kind })),
  counts: {
    kinds: kinds.length, etale: kinds.filter(k => k.etale).length, frob: kinds.filter(k => !k.etale).length,
    mono: kinds.filter(k => k.mono).length, hol: kinds.filter(k => !k.mono).length, glob: kinds.filter(k => k.glob).length,
    coric: kinds.filter(k => k.flags.vert || k.flags.horiz).length, species: kinds.filter(k => k.species).length,
    stripIds: ids.filter(r => r.kind === 'primestrip').length, instances: instances.length, procs: stripProcs.length, links: links_.length,
  },
  generated: new Date().toISOString().slice(0, 10),
};

/* ------------------------------------------------------------ layout (runs in Chromium) */
/* The function below is serialised into the page; it must be self-contained. */
function layout(D) {
  const W = 3840, H = 2160, M = 80;
  const C = {               // the reference palette of the dataviz method (light mode)
    surface: '#fcfcfb', panel: '#f4f4f1', line: '#e4e3df', text: '#0b0b0b', text2: '#52514e', muted: '#8a8984',
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  };
  const SANS = "Inter, 'Inter Display', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif";
  const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, monospace";
  const SYM = "'DejaVu Sans', 'DejaVu Serif', 'FreeSerif', Inter, sans-serif";

  const cv = document.createElement('canvas').getContext('2d');
  const measure = (text, font, size, weight) => { cv.font = `${weight || 400} ${size}px ${font}`; return cv.measureText(text).width; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const out = [];
  const text = (x, y, s, o = {}) => {
    const font = o.font || SANS, size = o.size || 20, weight = o.weight || 400, fill = o.fill || C.text, anchor = o.anchor || 'start';
    out.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${o.extra || ''}>${esc(s)}</text>`);
    return measure(s, font, size, weight);
  };
  const rect = (x, y, w, h, o = {}) => out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  const line = (x1, y1, x2, y2, o = {}) => out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}/>`);
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  const circle = (x, y, r, o = {}) => out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const bg = [252, 252, 251]; const mix = (c, s) => Math.round(s + (c - s) * a); return `rgb(${mix(r, bg[0])},${mix(g, bg[1])},${mix(b, bg[2])})`; };

  /* word-wrap prose; returns the y after the last line */
  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.35; const words = s.split(' '); let cur = '', yy = y, n = 0;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, o); yy += lh; cur = w; n++; } else cur = t;
    }
    if (cur) { text(x, yy, cur, o); yy += lh; n++; }
    if (o.maxLines && n > o.maxLines) console.warn(`wrap overflow: ${n} lines > ${o.maxLines}: ${s.slice(0, 40)}…`);
    return yy;
  };
  /* one line, cut with an ellipsis if it does not fit */
  const fit = (x, y, s, width, o = {}) => {
    const font = o.font || SANS, size = o.size || 20;
    let t = s;
    while (t.length > 1 && measure(t, font, size, o.weight) > width) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== s) console.warn('cut: ' + s);
    return text(x, y, t, o);
  };

  const CHIP = { size: 16, h: 23, padx: 7, gap: 6, vgap: 4 };
  const chipW = (id, size = CHIP.size) => Math.ceil(measure(id, MONO, size)) + CHIP.padx * 2 + 5;
  const chip = (x, y, id, col, o = {}) => {
    const size = o.size || CHIP.size, h = o.h || CHIP.h, w = chipW(id, size);
    rect(x, y, w, h, { rx: 5, fill: tint(col, o.faint ? 0.07 : 0.13) });
    rect(x, y, 5, h, { rx: 2.5, fill: col, opacity: o.faint ? 0.45 : 1 });
    text(x + 5 + CHIP.padx, y + h / 2 + size * 0.36, id, { font: MONO, size, fill: o.faint ? C.text2 : C.text });
    return w;
  };
  const flow = (x, y, width, items, o = {}) => {
    let cx = x, cy = y, rowH = (o.h || CHIP.h) + CHIP.vgap;
    for (const it of items) {
      const w = chipW(it.id, o.size);
      if (cx + w > x + width && cx > x) { cx = x; cy += rowH; }
      chip(cx, cy, it.id, it.col, o); cx += w + CHIP.gap;
    }
    return cy + rowH - CHIP.vgap - y;
  };
  const panel = (x, y, w, h, title, sub, subw) => {
    rect(x, y, w, h, { rx: 14, fill: C.panel });
    text(x + 28, y + 44, title, { size: 30, weight: 600 });
    if (sub) return wrap(x + 28, y + 76, sub, subw || w - 56, { size: 19, fill: C.text2, lh: 25 });
    return y + 76;
  };
  const pill = (x, y, s, col, o = {}) => {
    const size = o.size || 12, w = measure(s, SANS, size, 600) + 14;
    rect(x, y - 13, w, 18, { rx: 9, fill: o.solid ? col : tint(col, 0.18) });
    text(x + 7, y, s, { size, weight: 600, fill: o.solid ? '#fff' : col });
    return w;
  };
  const stage = (x, y, w, label) => { text(x, y, label, { size: 15, weight: 600, fill: C.muted, extra: ' letter-spacing="1.5"' }); line(x, y + 8, x + w, y + 8, { stroke: C.line, sw: 1 }); };

  /* box colour = what the strip carries: nothing (étale-like), units only, a local Frobenioid, + the global C⊩ */
  const family = k => k.etale ? 0 : k.glob ? 3 : k.flags.valgroup ? 2 : 1;
  const FAMILY = [
    { col: C.series[0], name: 'étale-like: no monoid, only the base' },
    { col: C.series[3], name: 'units only: O× or O×μ' },
    { col: C.series[1], name: 'a local Frobenioid: O▷, or O▶ × O×μ' },
    { col: C.series[6], name: '+ the global realified Frobenioid C⊩' },
  ];
  const GREEN = C.series[5];
  const colOf = k => FAMILY[family(k)].col;
  const byId = {}; for (const k of D.kinds) byId[k.id] = k;
  const colOfId = id => colOf(byId[id]);

  out.push(`<defs>${[['arr', C.text2], ['arrG', GREEN], ['arrM', C.muted]].map(([id, c]) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`);
  rect(0, 0, W, H, { fill: C.surface });

  /* ================================================================ header */
  text(M, 92, 'The nine kinds of prime-strip in inter-universal Teichmüller theory', { size: 62, weight: 700 });
  wrap(M, 140,
    `A prime-strip is one piece of local data for every valuation v ∈ V of the number field: a Galois group, with or without a monoid of ` +
    `units and values acting under it ([IUTchI] Def 4.1, 5.2 and Fig I1.2; [IUTchII] Def 4.9 adds the ×μ-kinds). The kinds differ only in what they remember — ` +
    `the holomorphic Π_v or just its quotient G_v, the full monoid O▷, the units O× or O×μ, the value groups O▶, the global realified Frobenioid C⊩ — ` +
    `and the whole theory is bookkeeping about which of these survive which link. The toolkit holds all nine as one enum iut_ps_kind, one struct ` +
    `iut_prime_strip with a local datum per v (src/iut.h), one forgetful function iut_prime_strip_forget and one validator iut_validate_prime_strip; ` +
    `this page is drawn from those and from what iut run prints.`,
    2560, { size: 22, fill: C.text2, lh: 30 });
  const stats = [
    [D.counts.kinds, 'kinds'], [D.counts.etale, 'étale-like'], [D.counts.frob, 'Frobenius-like'], [D.counts.mono, 'mono-analytic'],
    [D.counts.glob, 'carry C⊩'], [D.counts.coric, 'coric kinds'], [D.counts.stripIds, 'strip identifiers'], [D.counts.procs, 'processes'],
  ];
  let sx = W - M - stats.length * 136;
  for (const [v, l] of stats) {
    rect(sx, 46, 124, 118, { rx: 12, fill: C.panel });
    text(sx + 62, 112, String(v), { size: 46, weight: 600, anchor: 'middle' });
    text(sx + 62, 146, l, { size: 15, fill: C.text2, anchor: 'middle' });
    sx += 136;
  }

  /* ================================================================ row A */
  const AY = 265, AH = 975;

  /* --- A1: the nine kinds and the functors between them */
  const A1X = M, A1W = 2150;
  panel(A1X, AY, A1W, AH, 'The nine kinds, and what forgets into what',
    `Columns: what the strip remembers of the base at v — the holomorphic Π_v, or only the mono-analytic G_v (⊢, ⊩). Rows: how much Frobenius-like structure sits on top — ` +
    `the global realified Frobenioid C⊩ (⊩), a local Frobenioid with value groups, the units alone, or nothing (étale-like). Grey arrows are the forgetful functors of [IUTchI] Def 4.1, 5.2 ` +
    `and Rem 5.2.1; the green ones are the ladder of [IUTchII] Def 4.9 exactly as iut run ForgetLadder walks it; dashed arrows go the other way (a lift, an adjunction). ` +
    `Green frames are the coric kinds of [IUTchIII] Thm 1.5.`, A1W - 56);
  const NW = 320, NH = 118;
  const xH = A1X + 190, xM1 = A1X + 680, xM2 = A1X + 1150;
  const y0 = AY + 196, PITCH = 182, y1 = y0 + PITCH, y2 = y1 + PITCH, y3 = y2 + PITCH;
  /* column headers */
  const HY = AY + 160;
  stage(xH, HY, NW, 'HOLOMORPHIC · remembers Π_v');
  stage(xM1, HY, xM2 + NW - xM1, 'MONO-ANALYTIC (⊢, ⊩) · remembers only G_v, the quotient Π_v ↠ G_v');
  text(xM1, HY + 26, 'units O×: ×-Kummer, unique (Ẑ×)', { size: 13, fill: C.muted });
  text(xM2, HY + 26, '×μ: units modulo torsion O×μ, ×μ-Kummer = an Ism-orbit', { size: 13, fill: C.muted });
  /* row bands */
  const band = (y, a, b) => { text(A1X + 28, y + 34, a, { size: 14, weight: 600, fill: C.text2 }); wrap(A1X + 28, y + 54, b, 150, { size: 12, fill: C.muted, lh: 15 }); line(A1X + 28, y + NH + 30, xM2 + NW + 20, y + NH + 30, { stroke: C.line, dash: '3 5' }); };
  band(y0, '⊩  global', 'the global realified Frobenioid C⊩, Prime(C⊩) ≅ V, gluings ρ_v; carries the pilot objects');
  band(y1, 'local Frobenioid', 'O▷ (F, F⊢), or O▶ × O×μ: units and value groups at each v');
  band(y2, 'units only', 'O× or O×μ: no value groups, no pilots — what the Θ-link can share');
  band(y3, 'étale-like', 'no monoid at all: the base categories, the coric data of the lattice');

  /* a kind box */
  const nodes = {};
  const node = (x, y, k) => {
    const col = colOf(k), coric = k.flags.vert || k.flags.horiz;
    rect(x, y, NW, NH, { rx: 10, fill: tint(col, k.flags.bi ? 0.24 : 0.13), stroke: coric ? GREEN : undefined, sw: k.flags.bi ? 3.5 : 2.2 });
    rect(x, y, 7, NH, { rx: 3.5, fill: col });
    /* notation at 34px, or 28px when the datum would not fit beside it */
    const avail = NW - 20 - 12 - 12;
    const small = measure(k.notation, SYM, 34, 700) + 12 + measure(k.datum, SYM, 14) > avail;
    const ns = small ? 28 : 34, ds = small ? 13 : 14;
    text(x + 20, y + 40, k.notation, { font: SYM, size: ns, weight: 700 });
    const nw = measure(k.notation, SYM, ns, 700);
    fit(x + 20 + nw + 12, y + 40, k.datum, avail - nw, { font: SYM, size: ds, fill: C.text2 });
    chip(x + 20, y + 54, k.id, col, { size: 13, h: 20 });
    const ref = k.ref.split(';')[0];
    text(x + 20, y + 97, ref, { size: 12, fill: C.muted });
    let px = x + 20 + measure(ref, SANS, 12) + 10;
    if (k.flags.bi) px += pill(px, y + 97, 'bi-coric', GREEN, { solid: true }) + 5;
    else if (k.flags.vert) px += pill(px, y + 97, 'vertically coric', GREEN) + 5;
    else if (k.flags.horiz) px += pill(px, y + 97, 'horizontally coric', GREEN) + 5;
    if (k.species) px += pill(px, y + 97, 'species', C.series[2]) + 5;
    return (nodes[k.id] = { x, y, w: NW, h: NH, cx: x + NW / 2, cy: y + NH / 2, r: x + NW, b: y + NH, k });
  };
  node(xM1, y0, byId.FMonoGlobPrimeStrip); node(xM2, y0, byId.FMonoGlobValUnitsModTorsPrimeStrip);
  node(xH, y1, byId.FPrimeStrip); node(xM1, y1, byId.FMonoPrimeStrip); node(xM2, y1, byId.FMonoValUnitsModTorsPrimeStrip);
  node(xM1, y2, byId.FMonoUnitsPrimeStrip); node(xM2, y2, byId.FMonoUnitsModTorsPrimeStrip);
  node(xH, y3, byId.DPrimeStrip); node((xM1 + xM2) / 2, y3, byId.DMonoPrimeStrip);
  const N = nodes;

  /* arrows: labelled pills on the path */
  const alabel = (x, y, s, col, o = {}) => {
    const size = o.size || 13, w = measure(s, SANS, size) + 12;
    const lx = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
    rect(lx, y - 12, w, 20, { rx: 4, fill: C.panel });
    text(lx + 6, y + 3, s, { size, fill: col });
  };
  const varrow = (a, b, s, o = {}) => {   /* a above b, same column; the label sits in the gap between the rows */
    const x = o.x ?? a.cx, col = o.green ? GREEN : C.text2;
    line(x, a.b, x, b.y - 2, { stroke: col, sw: 2, marker: o.green ? 'arrG' : 'arr', dash: o.dash });
    const ly = (a.b + b.y) / 2;
    alabel(x + (o.side === 'left' ? -16 : 16), ly + 2, s, col, { anchor: o.side === 'left' ? 'end' : 'start' });
  };
  const harrow = (a, b, s, o = {}) => {   /* a left of b, same row; the label must fit the gap between the columns */
    const y = o.y ?? a.cy, col = o.green ? GREEN : C.text2;
    const x1 = o.reverse ? b.x : a.r, x2 = o.reverse ? a.r + 2 : b.x - 2;
    line(x1, y, x2, y, { stroke: col, sw: 2, marker: o.green ? 'arrG' : 'arr', dash: o.dash });
    const lx = (a.r + b.x) / 2;
    if (measure(s, SANS, 13) + 12 > b.x - a.r - 4) console.warn('harrow label too wide: ' + s);
    alabel(lx, y + (o.below ? 22 : -14), s, col);
  };
  const curve = (x1, y1, x2, y2, s, o = {}) => {
    const col = o.green ? GREEN : o.faint ? C.muted : C.text2;
    const c1 = o.c1 || [x1, (y1 + y2) / 2], c2 = o.c2 || [x2, (y1 + y2) / 2];
    pathd(`M${x1},${y1} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`, { stroke: col, sw: 2, marker: o.green ? 'arrG' : o.faint ? 'arrM' : 'arr', dash: o.dash });
    if (s) alabel(o.lx ?? (x1 + x2) / 2, o.ly ?? (y1 + y2) / 2, s, col, { anchor: o.anchor });
  };
  const F = N.FPrimeStrip, Dn = N.DPrimeStrip, FM = N.FMonoPrimeStrip, FMU = N.FMonoUnitsPrimeStrip, FMUM = N.FMonoUnitsModTorsPrimeStrip,
    FMV = N.FMonoValUnitsModTorsPrimeStrip, FG = N.FMonoGlobPrimeStrip, FGV = N.FMonoGlobValUnitsModTorsPrimeStrip, DM = N.DMonoPrimeStrip;
  const fx = (a, b) => D.functors.find(f => f.from === a && f.to === b) || {};
  const isom = f => f.bij ? 'Isom bijective' : f.surj ? 'Isom surjective, not injective' : '';
  /* [IUTchI]: the four original kinds */
  line(F.cx - 50, F.b, F.cx - 50, Dn.y - 2, { stroke: C.text2, sw: 2, marker: 'arr' });
  line(F.cx + 50, Dn.y, F.cx + 50, F.b + 2, { stroke: C.muted, sw: 2, marker: 'arrM', dash: '6 5' });
  { const my = (F.b + Dn.y) / 2;
    alabel(F.cx + 66, my - 12, `F ↦ D · ${isom(fx('FPrimeStrip', 'DPrimeStrip'))} · Cor 5.3 (ii)`, C.text2, { anchor: 'start' });
    alabel(F.cx + 66, my + 14, `lift D ↦ F${D.lift && D.lift.ok ? ', Π_v preserved' : ''} · Rem 5.3.1`, C.muted, { anchor: 'start' }); }
  harrow(F, FM, 'F ↦ F⊢ · Rem 5.2.1 (ii)', {});
  text((F.r + FM.x) / 2, F.cy + 24, 'F Kummer-ready, F⊢ Kummer-blind', { size: 12, fill: C.muted, anchor: 'middle' });
  harrow(Dn, DM, `D ↦ D⊢: Π_v ↦ G_v · ${isom(fx('DPrimeStrip', 'DMonoPrimeStrip'))} · Def 4.1 (iv)`, {});
  curve(F.cx + 20, F.y, FG.x, FG.cy + 30, null, { dash: '6 5', faint: true, c1: [F.cx + 20, F.y - 110], c2: [FG.x - 90, FG.cy + 30] });
  text(xH + 10, y0 + 36, 'F ↦ F⊩: adjoin the global realified', { size: 13, fill: C.muted });
  text(xH + 10, y0 + 54, 'Frobenioid C⊩ · Def 5.2 (iv), Rem 5.2.1 (iii)', { size: 13, fill: C.muted });
  text(xH + 10, y0 + 80, 'no holomorphic ⊩-kind: C⊩ is realified,', { size: 12, fill: C.muted });
  text(xH + 10, y0 + 96, 'it only sees G_v and the value groups', { size: 12, fill: C.muted });
  varrow(FG, FM, 'F⊩ ↦ F⊢: forget C⊩, keep the split O▷', { x: FG.cx - 40, side: 'left' });
  curve(FM.x + 40, FM.b, DM.x + 60, DM.y, 'F⊢ ↦ D⊢ · Cor 5.3 (iii)', { c1: [FM.x - 30, FM.b + 150], c2: [FM.x - 30, DM.y - 60], lx: FM.x - 4, ly: y3 - 34, anchor: 'end' });
  varrow(FM, FMU, 'F⊢ ↦ F⊢×: the unit portion, no O▶', { x: FM.cx + 50, side: 'left' });
  /* [IUTchII] Def 4.9: the ladder as printed */
  const L = D.ladder.steps;  /* F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢ */
  varrow(FGV, FMV, `① forget C⊩ · ${L[1].ref}`, { green: true, x: FGV.cx + 40, side: 'left' });
  varrow(FMV, FMUM, `② forget the value groups O▶ · ${L[2].ref}`, { green: true, x: FMV.cx + 40, side: 'left' });
  line(FMUM.x, FMUM.cy + 22, FMU.r + 2, FMUM.cy + 22, { stroke: GREEN, sw: 2, marker: 'arrG' });
  alabel((FMU.r + FMUM.x) / 2, FMUM.cy + 44, '③ O× for O×μ (vi)', GREEN);
  line(FMU.r, FMU.cy - 22, FMUM.x - 2, FMU.cy - 22, { stroke: C.text2, sw: 2, marker: 'arr' });
  alabel((FMU.r + FMUM.x) / 2, FMU.cy - 36, 'O× ↠ O×μ (vi)', C.text2);
  curve(FMU.cx - 60, FMU.b, DM.x + 110, DM.y, `④ forget the monoid: the bi-coric core · ${L[4].ref}`, { green: true, c1: [FMU.cx - 60, FMU.b + 80], c2: [DM.x + 110, DM.y - 70], lx: FMU.cx - 50, ly: FMU.b + 28, anchor: 'start' });
  curve(FMUM.cx, FMUM.b, DM.r - 60, DM.y, 'F⊢×μ ↦ D⊢: both horizontally coric', { c1: [FMUM.cx, FMUM.b + 90], c2: [DM.r - 60, DM.y - 60], lx: FMUM.cx - 12, ly: FMUM.b + 54, anchor: 'end' });
  harrow(FG, FGV, 'F⊩ ↦ F⊩▶×μ (viii)', { below: true });
  harrow(FM, FMV, 'F⊢ ↦ F⊢▶×μ (vii)', { below: true });

  /* right of the diagram: legend + the functor table */
  const LX = xM2 + NW + 50, LW = A1X + A1W - 28 - LX;
  let ly = AY + 160;
  text(LX, ly, 'box colour = what the strip carries', { size: 15, weight: 600, fill: C.text2 }); ly += 10;
  for (const f of FAMILY) { ly += 24; rect(LX, ly - 13, 14, 14, { rx: 3, fill: f.col }); text(LX + 22, ly, f.name, { size: 14, fill: C.text2 }); }
  ly += 26; rect(LX, ly - 13, 14, 14, { rx: 3, fill: 'none', stroke: GREEN, sw: 2.5 });
  ly = wrap(LX + 22, ly, 'coric ([IUTchIII] Thm 1.5): vertically = survives the log-link, horizontally = survives the Θ×μ-links, bi-coric = both', LW - 22, { size: 14, fill: C.text2, lh: 19 });
  ly += 24;
  text(LX, ly, 'Isom(F) → Isom(D)', { size: 15, weight: 600, fill: C.text2 }); ly += 6;
  ly = wrap(LX, ly + 18, 'What each functor does to isomorphisms, as iut run LiftToFrobenioids prints it from the table iut_strip_functors ([IUTchI] Cor 5.3): a D-prime-strip lifts back to an F-prime-strip, a D⊢-prime-strip does not lift uniquely.', LW, { size: 13, fill: C.muted, lh: 17 });
  ly += 4;
  for (const f of D.functors) {
    ly += 24;
    const a = byId[f.from], b = byId[f.to];
    text(LX, ly, a.notation, { font: SYM, size: 15, weight: 600 }); text(LX + 60, ly, '↦', { size: 14, fill: C.muted }); text(LX + 80, ly, b.notation, { font: SYM, size: 15, weight: 600 });
    const s = f.bij ? 'bijective on Isom' : f.surj ? 'surjective, not injective' : 'neither';
    pill(LX + 150, ly, s, f.bij ? GREEN : C.series[1]);
    text(LX + 345, ly, f.ref.replace(/[:;].*/, ''), { size: 12, fill: C.muted });
  }
  ly += 22;
  ly = wrap(LX, ly, 'The other direction exists too: D⊢ ↦ D⊩(D⊢) rebuilds a global realified Frobenioid from the bi-coric core alone ([IUTchII] Cor 4.5 (ii), iut run RealifyFromDMono) — which is why F⊩_Δ can be compared across the Θ-link.', LW, { size: 13, fill: C.muted, lh: 17 });
  ly += 22;
  text(LX, ly, 'Where the kinds come from', { size: 15, weight: 600, fill: C.text2 });
  ly = wrap(LX, ly + 22, '[IUTchI] Fig I1.2 draws F, F⊢, D, D⊢ and F⊩ as the data of the Θ-Hodge theaters and bridges. [IUTchII] Def 4.9 (vi)–(viii) adds F⊢×, F⊢×μ, F⊢▶×μ and F⊩▶×μ: the Θ-link may only identify units modulo torsion and value groups across the alien copies, so it is stated on F⊩▶×μ and induces †F⊢×μ ≅ ‡F⊢×μ (Cor 4.10 (iv)). [IUTchIII] Thm 1.5 then says what each lattice arrow keeps: D and D⊢ vertically, F⊢×μ and D⊢ horizontally — D⊢ is the bi-coric core, and the mono-analytic log-shells I(D⊢) built from it are what the multiradial representation is written in.', LW, { size: 13, fill: C.text2, lh: 18 });
  ly += 8;
  wrap(LX, ly, '[FormIUT] §1 calls F⊢×μ the basic prime-strip (BasicPrimeStrip): the datum the Θ×μ-links glue.', LW, { size: 12, fill: C.muted, lh: 16 });
  if (ly > AY + AH - 30) console.warn('A1 legend overflow ' + (ly - (AY + AH - 30)));

  /* --- A2: what each kind carries at v */
  const A2X = A1X + A1W + 30, A2W = W - M - A2X;
  panel(A2X, AY, A2W, AH, 'What each kind carries at v ∈ V',
    `The flags iut_prime_strip_build sets in the local datum for each kind and iut_validate_prime_strip then demands (src/iut_core.c; the Lean version is PrimeStrip.WellFormed). ` +
    `A copy id for Π_v, G_v and the monoid; whether the units are O× or O×μ; the value-group portion O▶ with the valuations of its generators in units of ord(q̲_v); the splitting O▷ = O× × O▶; ` +
    `the Kummer structure; the global portion. Cross-checked against the rungs iut run ForgetLadder prints.`);
  const COLS = [
    ['Π_v', 'holomorphic base'], ['G_v', 'mono-analytic base'], ['monoid', 'at every v'], ['O▶', 'value groups'], ['split', 'O× × O▶'],
    ['Kummer', 'on the units'], ['C⊩', 'global realified'], ['pilot', 'degree ≤ 0'], ['coric', 'Thm 1.5'],
  ];
  const TX = A2X + 28, TY = AY + 176, LABW = 332, CW = Math.floor((A2W - 56 - LABW) / COLS.length), RH = 50;
  COLS.forEach(([a, b], i) => {
    const cx = TX + LABW + i * CW + CW / 2;
    text(cx, TY, a, { font: SYM, size: 16, weight: 700, anchor: 'middle' });
    text(cx, TY + 17, b, { size: 11, fill: C.muted, anchor: 'middle' });
  });
  line(TX, TY + 28, TX + LABW + COLS.length * CW, TY + 28);
  const dot = (cx, cy, on, col) => on ? circle(cx, cy, 7, { fill: col }) : text(cx, cy + 5, '—', { size: 15, fill: C.line, anchor: 'middle' });
  D.kinds.forEach((k, i) => {
    const y = TY + 40 + i * RH, col = colOf(k), f = k.flags;
    if (i % 2) rect(TX, y, LABW + COLS.length * CW, RH, { fill: tint(C.text, 0.025) });
    rect(TX, y + 6, 5, RH - 12, { rx: 2.5, fill: col });
    text(TX + 16, y + 24, k.notation, { font: SYM, size: 21, weight: 700 });
    text(TX + 16 + measure(k.notation, SYM, 21, 700) + 10, y + 24, k.datum, { font: SYM, size: 12, fill: C.text2 });
    text(TX + 16, y + 44, k.id, { font: MONO, size: 12, fill: C.text2 });
    const cells = [
      () => dot(0, 0, f.Pi, col), () => dot(0, 0, f.G, col),
      () => f.units ? text(0, 5, f.valgroup ? (f.modTors ? 'O▶ × O×μ' : 'O▷') : (f.modTors ? 'O×μ' : 'O×'), { font: SYM, size: 15, weight: 600, anchor: 'middle' }) : dot(0, 0, false, col),
      () => dot(0, 0, f.valgroup, col), () => dot(0, 0, f.split, col),
      () => f.kummer === 2 ? [text(0, 0, '×μ: Ism-orbit', { size: 12, weight: 600, anchor: 'middle' }), text(0, 15, 'UnitsModTorsKummer', { font: MONO, size: 9, fill: C.muted, anchor: 'middle' })]
        : f.kummer === 1 ? [text(0, 0, '×: unique', { size: 12, weight: 600, anchor: 'middle' }), text(0, 15, 'UnitsKummer', { font: MONO, size: 9, fill: C.muted, anchor: 'middle' })] : dot(0, 0, false, col),
      () => dot(0, 0, f.glob, col),
      () => f.glob ? text(0, 5, k.id === 'FMonoGlobValUnitsModTorsPrimeStrip' ? 'q, Θ' : 'q̲_v / Θ̲_v', { font: SYM, size: 13, weight: 600, anchor: 'middle' }) : dot(0, 0, false, col),
      () => f.bi ? pill(-28, 5, 'bi', GREEN, { solid: true }) : f.vert ? pill(-20, 5, 'vert', GREEN) : f.horiz ? pill(-24, 5, 'horiz', GREEN) : dot(0, 0, false, col),
    ];
    cells.forEach((fn, j) => {
      const cx = TX + LABW + j * CW + CW / 2, cy = y + RH / 2;
      out.push(`<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">`); fn(); out.push('</g>');
    });
  });
  let ay = TY + 40 + D.kinds.length * RH + 8;
  line(TX, ay, TX + LABW + COLS.length * CW, ay);
  text(TX, ay + 22, 'the pilot column: F⊩_mod carries q̲_v and F⊩_tht carries Θ̲_v; the ⊩▶×μ-strips F⊩_Δ, F⊩_gau, F⊩_LGP, F⊩_lgp carry the q- and Θ-pilots {q̲_v}, {q̲_v^{j²}} of [IUTchIII] Def 3.8', { size: 12, fill: C.muted });

  /* the ladder as printed */
  ay += 50;
  stage(TX, ay, A2W - 56, 'THE LADDER OF [IUTchII] DEF 4.9, AS  iut run ForgetLadder  PRINTS IT');
  ay += 22;
  const rawY0 = ay;
  for (const l of D.ladder.raw) { ay += 19; fit(TX + 12, ay, l, A2W - 80, { font: MONO, size: 12.5, fill: C.text }); }
  rect(TX, rawY0 - 4, A2W - 56, ay - rawY0 + 14, { rx: 8, fill: 'none', stroke: C.line });
  ay += 34;
  ay = wrap(TX, ay, `Each rung is iut_prime_strip_forget: it copies the struct and clears fields — the global portion, the value-group generators, the splitting, the Kummer kind — so that the validator of the target kind accepts the result. The pilot object of the F⊩▶×μ-strip (degree ${D.ladder.pilotDegree}, in units of |log q̲|, summed over v ∈ V^bad) is what the Θ-link dilates; in Lean, forget_wellFormed proves every rung preserves well-formedness.`, A2W - 56, { size: 13, fill: C.text2, lh: 18 });
  if (ay > AY + AH - 20) console.warn('A2 overflow ' + (ay - (AY + AH - 20)));

  /* ================================================================ row B */
  const BY = AY + AH + 25, BH = H - 38 - BY;

  /* --- B1: where each kind occurs */
  const B1X = M, B1W = 1420;
  panel(B1X, BY, B1W, BH, 'Where the kinds occur',
    `The ${D.counts.instances} named prime-strips of the identifier table, grouped by the kind the toolkit builds them as (iut_hodge_theater_new in src/iut_core.c for the members of a Θ±ell NF-Hodge theater), and the kind of strip each of the ${D.counts.links} links glues.`);
  const groups = D.kinds.map(k => ({ k, items: D.instances.filter(r => r.kindId === k.id) })).filter(g => g.items.length);
  const GX = B1X + 28, GW = 790; let gy = BY + 134;
  for (const g of groups) {
    const col = colOf(g.k);
    rect(GX, gy - 16, 5, 22, { rx: 2.5, fill: col });
    text(GX + 14, gy, g.k.notation + '-prime-strips', { font: SYM, size: 17, weight: 700 });
    text(GX + 14 + measure(g.k.notation + '-prime-strips', SYM, 17, 700) + 10, gy, g.k.id, { font: MONO, size: 12, fill: C.muted });
    line(GX, gy + 8, GX + GW, gy + 8);
    gy += 14;
    for (const r of g.items) {
      gy += 25;
      text(GX + 14, gy, r.notation, { font: SYM, size: 16, weight: 600 });
      chip(GX + 130, gy - 16, r.id, col, { size: 12, h: 20 });
      fit(GX + 330, gy, r.where, GW - 330 - (r.field ? 140 : 0), { size: 13, fill: C.text2 });
      if (r.field) text(GX + GW, gy, r.field.replace(/^ht->/, '') + (r.theta ? ' · j²' : ''), { font: MONO, size: 11, fill: C.muted, anchor: 'end' });
    }
    gy += 30;
  }
  gy -= 6;
  wrap(GX, gy, `The capsules F_T (|F_l| = l members) and F_J (|F_l^*| = l* members) hold the remaining F-prime-strips of a Hodge theater, one per label; the processions S^±_{j+1} are capsules of D⊢-prime-strips. The ⊩-strips F⊩_Δ … F⊩_lgp are F⊩-prime-strips in the papers; the toolkit builds them as F⊩▶×μ because that is the kind the Θ×μ-links glue.`, GW, { size: 12, fill: C.muted, lh: 16 });
  /* links → glued kind */
  const KX = GX + GW + 36, KW = B1X + B1W - 28 - KX;
  let ky = BY + 134;
  text(KX, ky, 'What each link glues', { size: 17, weight: 600 }); line(KX, ky + 8, KX + KW, ky + 8); ky += 10;
  for (const l of D.links) {
    const k = byId[l.glues];
    ky += 26;
    text(KX, ky, l.notation, { font: SYM, size: 14, weight: 600 });
    text(KX + measure(l.notation, SYM, 14, 600) + 10, ky, l.id, { font: MONO, size: 10, fill: C.muted });
    rect(KX + KW - 96, ky - 16, 5, 22, { rx: 2.5, fill: colOf(k) });
    text(KX + KW - 84, ky, k.notation, { font: SYM, size: 17, weight: 700 });
    fit(KX, ky + 17, l.how, KW - 200, { size: 12, fill: C.text2 });
    text(KX + KW, ky + 17, l.ref, { size: 10, fill: C.muted, anchor: 'end' });
    ky += 20;
  }
  ky += 44;
  text(KX, ky, 'What each log-shell is made from', { size: 17, weight: 600 }); line(KX, ky + 8, KX + KW, ky + 8); ky += 12;
  for (const [n, s] of [['F', 'I(F): the Frobenius-like units through log, holomorphic'], ['F⊢×μ', 'I(F⊢×μ): mono-analytic, up to Ism'], ['D', 'I(D): reconstructed from Π_v, vertically coric'], ['D⊢', 'I(D⊢): reconstructed from G_v, bi-coric — the tensor packets']]) {
    ky += 24;
    const k = D.kinds.find(x => x.notation === n);
    rect(KX, ky - 16, 5, 22, { rx: 2.5, fill: colOf(k) });
    text(KX + 12, ky, n, { font: SYM, size: 17, weight: 700 });
    fit(KX + 80, ky, s, KW - 80, { size: 12, fill: C.text2 });
  }
  ky += 10;
  wrap(KX, ky + 16, '[IUTchIII] Def 1.1, Prop 1.2 (vi)–(ix): the four shells are isomorphic up to Ism / ±1 — iut run MakeLogShells.', KW, { size: 11, fill: C.muted, lh: 15 });

  /* --- B2: what the validator checks */
  const B2X = B1X + B1W + 30, B2W = 1080;
  panel(B2X, BY, B2W, BH, 'What the validator checks',
    `iut_validate_prime_strip (src/iut_core.c), rule by rule, with the kinds each rule applies to; iut validate and iut run BuildPrimeStrip run it, the TUI shows the report. ` +
    `The Lean file lean/IUT/PrimeStrip.lean states the same rules as PrimeStrip.WellFormed and proves that build and every forget satisfy them.`);
  let ry = BY + 150;
  for (const [sev, who, what, ref] of D.RULES) {
    const sc = sev === 'error' ? C.series[7] : C.series[3];
    pill(B2X + 28, ry, sev, sc, { size: 11 });
    text(B2X + 92, ry, who, { font: SYM, size: 13, weight: 600, fill: C.text2 });
    ry = wrap(B2X + 222, ry, what, B2W - 56 - 194 - 150, { size: 13, lh: 17 });
    text(B2X + B2W - 28, ry - 17, ref, { size: 11, fill: C.muted, anchor: 'end' });
    ry += 12;
  }
  ry += 6; line(B2X + 28, ry, B2X + B2W - 28, ry); ry += 24;
  text(B2X + 28, ry, 'Proved in Lean (lean/IUT/PrimeStrip.lean)', { size: 15, weight: 600, fill: C.text2 }); ry += 4;
  for (const [n, s] of [['card', 'Fintype.card PrimeStripKind = 9'], ['mono_of_hasGlobal', 'a ⊩-kind is mono-analytic'], ['not_hasGlobal_of_etale', 'an étale-like kind carries no C⊩'], ['build_wellFormed', 'PrimeStrip.build always validates'], ['forget_wellFormed', 'every forgetful mutation preserves well-formedness'], ['biCoric_iff', 'bi-coric ⇔ vertically and horizontally coric'], ['ident_mem_identifiers', 'each kind has its identifier in the table']]) {
    ry += 21; text(B2X + 28, ry, n, { font: MONO, size: 12, fill: C.text }); text(B2X + 232, ry, s, { size: 12, fill: C.text2 });
  }

  /* --- B3: one strip as the program holds it */
  const B3X = B2X + B2W + 30, B3W = W - M - B3X;
  panel(B3X, BY, B3W, BH, 'One strip, as the program holds it',
    `The struct iut_prime_strip of src/iut.h: a kind, a label, and one iut_local_datum per v — copy ids, so that "shared" and "a distinct copy" are literal equalities. Below, the F⊩▶×μ-prime-strip F⊩_LGP of the Hodge theater at (0,0) for ${D.example.name}, as iut walk, the TUI and iut_json_prime_strip print it.`);
  let ey = BY + 150;
  const fields = [
    ['iut_ps_kind kind', 'one of the nine'], ['char label[]', '"Gt", "BoxPlus", "LGPTorsor", "t=-3", …'], ['unsigned nV', '|V|'], ['iut_local_datum loc[nV]', 'one per v ∈ V'],
    ['int has_global_realified', '⊩: C⊩ present'], ['double global_degree', 'arithmetic degree of the pilot object (≤ 0)'],
  ];
  const lfields = [
    ['unsigned Pi_copy', 'Π_v (0 = absent)'], ['unsigned G_copy', 'G_v'], ['unsigned units_copy', 'O× / O×μ (0 = absent)'], ['int units_mod_tors', 'O×μ rather than O×'],
    ['int has_valgroup', 'O▶ present'], ['int has_splitting', 'O▷ = O× × O▶'], ['iut_q val[nval]', 'generators, in units of ord(q̲_v)'], ['int kummer_kind', '0 none · 1 ×-Kummer · 2 ×μ-Kummer (Ism)'],
  ];
  const col2 = B3X + 28 + (B3W - 56) / 2 + 10;
  text(B3X + 28, ey, 'iut_prime_strip', { font: MONO, size: 14, weight: 500, fill: C.series[6] });
  text(col2, ey, 'iut_local_datum  (at each v)', { font: MONO, size: 14, weight: 500, fill: C.series[6] });
  let fy = ey;
  for (const [a, b] of fields) { fy += 20; text(B3X + 40, fy, a, { font: MONO, size: 12 }); text(B3X + 40 + 215, fy, b, { size: 11, fill: C.muted }); }
  let gy2 = ey;
  for (const [a, b] of lfields) { gy2 += 20; text(col2 + 12, gy2, a, { font: MONO, size: 12 }); text(col2 + 12 + 190, gy2, b, { size: 11, fill: C.muted }); }
  ey = Math.max(fy, gy2) + 30;
  stage(B3X + 28, ey, B3W - 56, 'iut walk · iut_view_prime_strip');
  ey += 20;
  const exY0 = ey;
  for (const l of D.example.block) { ey += 20; fit(B3X + 40, ey, l, B3W - 80, { font: MONO, size: 12.5, fill: C.text }); }
  rect(B3X + 28, exY0 - 4, B3W - 56, ey - exY0 + 14, { rx: 8, fill: 'none', stroke: C.line });
  ey += 32;
  wrap(B3X + 28, ey, 'JSON (iut walk --json, the web app): {species, notation, label, etaleLike, monoAnalytic, global, globalDegree, local: [{PiV, GV, units, unitsModTors, valGroup, split, kummer, vals}]}. Ids in the 280000s are the copies of the Hodge theater at (0,0); the valuations q̲^1 … q̲^36 = q̲^{j²}, j = 1 … l* = 6, are the Θ-pilot at the three bad primes; v13 is good and v∞ archimedean, so their O▶ have no q̲-generator.', B3W - 56, { size: 12, fill: C.text2, lh: 16 });
  ey += 80;
  stage(B3X + 28, ey, B3W - 56, `THE ${D.stripProcs.length} PROCESSES THAT ACT ON PRIME-STRIPS · iut run <id>`);
  ey += 20;
  const used = flow(B3X + 28, ey, B3W - 56, D.stripProcs.map(p => ({ id: p.id, col: C.series[6] })), { size: 14, h: 24 });
  ey += used + 24;
  ey = wrap(B3X + 28, ey, 'Parts with identifiers of their own: ' + D.parts.map(p => p.notation + ' ' + p.id).join(' · '), B3W - 56, { size: 11, fill: C.muted, lh: 15 });
  if (ey > BY + BH - 10) console.warn('B3 overflow ' + (ey - (BY + BH - 10)));
  if (ry > BY + BH - 10) console.warn('B2 overflow ' + (ry - (BY + BH - 10)));
  if (gy > BY + BH - 10) console.warn('B1 overflow ' + (gy - (BY + BH - 10)));

  /* footer */
  text(W - M, H - 12, `oneman/motizukipdf · docs/DATA_MODEL.md §4, docs/IDENTIFIERS.md · generated ${D.generated} by scripts/infographic/primestrips.js from src/iut.h, src/iut_ids.c, src/iut_core.c, iut ids --json, iut procs --json and iut run`, { size: 14, fill: C.muted, anchor: 'end' });
  text(M, H - 12, `${D.counts.kinds} kinds: ${D.counts.etale} étale-like · ${D.counts.frob} Frobenius-like · ${D.counts.hol} holomorphic · ${D.counts.mono} mono-analytic · ${D.counts.glob} with C⊩ · ${D.counts.coric} coric · ${D.counts.species} are species of iut_species_table · ${D.counts.instances} named strips · ${D.counts.links} links`, { size: 14, fill: C.muted });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<title>The nine kinds of prime-strip in inter-universal Teichmüller theory — docs/DATA_MODEL.md §4</title>
${out.join('\n')}
</svg>`;
}

/* ------------------------------------------------------------ render */
(async () => {
  const svgOnly = process.argv.includes('--svg-only');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.error('[page] ' + m.text()); });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fcfcfb">
    <div style="font-family:Inter">x</div><div style="font-family:'Inter';font-weight:600">x</div><div style="font-family:'Inter';font-weight:700">x</div>
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'JetBrains Mono';font-weight:500">x</div><div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const svg = await page.evaluate(`(${layout.toString()})(${JSON.stringify(data)})`);
  fs.writeFileSync(OUT_SVG, svg);
  console.log(`wrote ${path.relative(ROOT, OUT_SVG)} (${(svg.length / 1024).toFixed(0)} KB)`);
  if (!svgOnly) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fcfcfb">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT_PNG, clip: { x: 0, y: 0, width: W, height: H }, type: 'png' });
    console.log(`wrote ${path.relative(ROOT, OUT_PNG)} (${(fs.statSync(OUT_PNG).size / 1024).toFixed(0)} KB)`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
