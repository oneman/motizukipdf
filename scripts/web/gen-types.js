#!/usr/bin/env node
/*
 * gen-types.js — extract the *form* of every data type from the C headers (src/iut.h, src/iut_i.h,
 * src/iut_ops.h): each `typedef struct { … } name;` with its fields and the comment on every field,
 * each `typedef enum { … } name;` with its enumerators and their comments, and the mapping
 * struct → letters-only identifiers (from docs/DATA_MODEL.md §8b for the IUT I types, and from the
 * table below for the rest).  Output: htdocs/data/types.js, a plain script defining window.IUT_TYPES.
 *
 *   node scripts/web/gen-types.js            # write htdocs/data/types.js
 *   node scripts/web/gen-types.js --check    # exit 1 if htdocs/data/types.js is out of date
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'htdocs', 'data', 'types.js');

/* struct → identifiers it implements (iut.h and iut_ops.h; iut_i.h comes from DATA_MODEL.md §8b) */
const MAP = {
  iut_q: [],
  iut_ident: [],
  iut_valuation: ['VSet', 'PV', 'VNon', 'VArc', 'VBadMod', 'VGoodMod', 'VBad', 'VGood'],
  iut_initial_theta_data: ['InitialThetaData', 'Fmod', 'FBarOverF', 'KField', 'LPrime', 'LStar', 'LPm', 'EpsilonUnder', 'XF', 'CK', 'DefThreeOne'],
  iut_local_datum: ['PiV', 'GV', 'OValV', 'OUnitsV', 'OUnitsModTorsV', 'OValgroupV', 'UnitsKummer', 'UnitsModTorsKummer', 'QUnderV'],
  iut_prime_strip: ['DPrimeStrip', 'DMonoPrimeStrip', 'FPrimeStrip', 'FMonoPrimeStrip', 'FMonoUnitsPrimeStrip', 'FMonoUnitsModTorsPrimeStrip',
    'FMonoValUnitsModTorsPrimeStrip', 'FMonoGlobPrimeStrip', 'FMonoGlobValUnitsModTorsPrimeStrip', 'CMonoGlob', 'PrimeCMonoGlob', 'BasicPrimeStrip',
    'FBoxPlus', 'DCircDotPm', 'FGt', 'FCircAst', 'DGt', 'DMonoGt', 'DMonoTriangle'],
  iut_pilot: ['QPilot', 'ThetaPilot'],
  iut_log_shell: ['LogShell', 'HolLogShell', 'MonoLogShell', 'FrobLogShell', 'EtLogShell', 'PStar', 'LogVolume'],
  iut_capsule_member: ['Capsule', 'FT', 'FJ', 'LabelT', 'LabelJ'],
  iut_theta_hodge_theater: ['ThetaHodgeTheater', 'FMonoGlobMod', 'FMonoGlobTht', 'ThetaUnderV'],
  iut_theta_pm_ell_hodge_theater: ['ThetaPmEllHodgeTheater', 'FT', 'FBoxPlus', 'DCircDotPm', 'ThetaPmBridge', 'ThetaEllBridge', 'FlSemiPm'],
  iut_theta_nf_hodge_theater: ['ThetaNFHodgeTheater', 'FJ', 'FGt', 'FCircAst', 'ThetaBridge', 'NFBridge', 'FlStarSym'],
  iut_hodge_theater: ['ThetaPmEllNFHodgeTheater', 'DagHodgeTheater', 'DdagHodgeTheater', 'NMHodgeTheater', 'GluingZeroBoxPlusToGt', 'Bullet',
    'FMonoGlobTriangle', 'FMonoGlobEnv', 'FMonoGlobGau', 'FMonoGlobLGPTorsor', 'FMonoGlobLgpIdeal', 'AlienCopy'],
  iut_link: ['ThetaLink', 'ThetaUnitsModTorsLink', 'ThetaUnitsModTorsGauLink', 'ThetaUnitsModTorsLGPTorsorLink', 'ThetaUnitsModTorsLgpIdealLink',
    'LogLink', 'DThetaPmEllNFLink', 'ThetaDilation'],
  iut_indeterminacies: ['IndOne', 'IndTwo', 'IndThree'],
  iut_procession_step: ['SPmJPlusOne', 'Procession', 'JSq'],
  iut_multiradial_rep: ['MultiradialRepresentation', 'HolomorphicHull', 'CTheta', 'AbsLogQ', 'AbsLogTheta', 'LogQ', 'CorThreeTwelve'],
  iut_log_theta_lattice: ['LogThetaLattice', 'InfiniteH', 'NCircColumn', 'LGPTorsorGaussianLogThetaLattice', 'LgpIdealGaussianLogThetaLattice'],
  iut_species: ['ZeroSpecies', 'OneSpecies', 'SpeciesObject', 'ZFCG'],
  iut_mutation: ['Mutation', 'Core', 'Observable', 'MorphismOfMutations'],
  iut_issue: [], iut_report: [],
  iut_options: [],
  /* iut_ops.h */
  iut_labcusp: ['LabCusp', 'LabCuspPm'],
  iut_capsule: ['Capsule', 'FT', 'FJ'],
  iut_capsule_morphism: ['CapsuleFullPolyMorphism', 'CapsuleFullPolyIsomorphism'],
  iut_procession: ['Procession', 'SPmJPlusOne', 'SJPlusOne'],
  iut_bridge: ['ThetaBridge', 'NFBridge', 'ThetaPmBridge', 'ThetaEllBridge'],
  iut_d_hodge_theater: ['DThetaPmEllNFHodgeTheater', 'EtaleHodgeTheater'],
  iut_frobenius_chain: ['FrobeniusPicture'],
  iut_etale_picture: ['EtalePicture'],
  iut_global_nf_data: ['FmodUnits', 'PiCK', 'FCircAstGlobal', 'FCircAstMod'],
  iut_radial_env: ['Multiradial', 'Uniradial'],
  iut_cyclotomic_rigidity: [],
  iut_tempered_indices: ['PiTpV'],
  iut_theta_value: ['ThetaUnderV', 'JSq', 'MuTwoL'],
  iut_monoid: ['PsiTheta', 'PsiGau', 'PsiLGP', 'PsiPerpEnvInf', 'PsiPerpGauInf'],
  iut_symmetrization: ['SynchronizedLabels', 'FlSemiPm', 'FlStarSym'],
  iut_forget_ladder: ['BasicPrimeStrip'],
  iut_log_link_result: ['LogLink', 'LogShell'],
  iut_bicoric: ['BiCoric', 'VerticallyCoric', 'HorizontallyCoric'],
  iut_radial_item: [],
  iut_tensor_packet: ['TensorPacket'],
  iut_upper_semi_compat: ['UpperSemiCompatibility', 'IndThree'],
  iut_global_variant_info: ['MODTorsor', 'ModIdeal'],
  iut_non_interference: ['LogKummerCorrespondence'],
  iut_multiradial_full: ['MultiradialRepresentation', 'ThmThreeEleven'],
  iut_named_value: [],
  iut_local_field: [],
  iut_arith_divisor: [],
  iut_thm110: ['ThmOneTen', 'CTheta', 'LogDK', 'LogFK'],
  iut_cor22: ['ThmA', 'ThmB'],
  iut_mutation_history: ['MutationHistory'],
  iut_esslgc_model: [],
  iut_stp: [],
  iut_interval: [],
  iut_gauss_step: [],
  iut_transport_stage: ['KummerDetachment'],
  iut_formal_sum: [],
  iut_dictionary_entry: [],
  iut_process: []
};

function read(p) { return fs.readFileSync(p, 'utf8'); }
function cleanComment(lines) {
  return lines.join(' ').replace(/\/\*+/g, ' ').replace(/\*+\//g, ' ').replace(/^\s*\*+/gm, ' ').replace(/-{3,}/g, ' ').replace(/\s+/g, ' ').trim();
}
function splitTop(s) {
  /* split a one-line struct body "a; b; c;" on semicolons outside comments */
  const out = []; let cur = '', depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (s.startsWith('/*', i)) { depth++; cur += '/*'; i++; continue; }
    if (s.startsWith('*/', i)) { depth--; cur += '*/'; i++; continue; }
    if (c === ';' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function parseField(decl) {
  // "unsigned e_mod, f_mod;  (comment: ram. index ...)" → fields with shared comment
  const cm = decl.match(/\/\*([\s\S]*?)\*\/\s*$/);
  const comment = cm ? cleanComment([cm[1]]) : '';
  let body = decl.replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
  if (!body) return [];
  const m = body.match(/^((?:const\s+|unsigned\s+|struct\s+|signed\s+|long\s+|short\s+)*[\w]+(?:\s*\*+)?)\s+(.*)$/s);
  if (!m) return [{ type: '', name: body, comment }];
  const type = m[1].replace(/\s+/g, ' ').trim();
  const names = m[2].split(',').map(s => s.trim()).filter(Boolean);
  return names.map(n => ({ type, name: n.replace(/[\s;]+/g, ''), comment }));
}
function parseHeader(file) {
  const text = read(file), lines = text.split('\n');
  const structs = [], enums = [];
  let pending = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    /* one-line struct */
    let m = ln.match(/^typedef struct\s*\{(.*)\}\s*(\w+);\s*(\/\*.*\*\/)?\s*$/);
    if (m) {
      const fields = [].concat(...splitTop(m[1]).map(parseField));
      structs.push({ name: m[2], file: path.basename(file), line: i + 1, fields, comment: cleanComment(pending.concat(m[3] ? [m[3]] : [])) });
      pending = []; continue;
    }
    m = ln.match(/^typedef struct\s*\{\s*(\/\*.*\*\/)?\s*$/);
    if (m) {
      const trailing = m[1] ? [m[1]] : [];
      const body = []; let j = i + 1, open = [];
      while (j < lines.length && !/^\}\s*\w+;/.test(lines[j])) { body.push(lines[j]); j++; }
      const name = (lines[j] || '').match(/^\}\s*(\w+);/);
      /* field lines: join continuation comment lines */
      const fields = [];
      let buf = '';
      body.forEach(b => {
        const t = b.trim();
        if (!t) return;
        if (/^\/\*/.test(t) && !/\*\/\s*$/.test(t)) { open.push(t); return; }
        if (open.length) { open.push(t); if (/\*\/\s*$/.test(t)) { open = []; } return; }
        if (/^\/\*.*\*\/$/.test(t)) { /* a comment line inside the struct: a group heading for the next field */ buf = t; return; }
        if (/;/.test(t)) {
          const decl = (buf ? '' : '') + t;
          const fs = parseField(decl);
          if (buf && fs.length && !fs[0].comment) fs[0].comment = cleanComment([buf]);
          else if (buf && fs.length) fs[0].group = cleanComment([buf]);
          fields.push(...fs); buf = '';
        }
      });
      structs.push({ name: name ? name[1] : '?', file: path.basename(file), line: i + 1, fields, comment: cleanComment(pending.concat(trailing)) });
      pending = []; i = j; continue;
    }
    m = ln.match(/^typedef enum\s*\{(.*)\}\s*(\w+);/);
    if (m) {
      const items = splitEnum(m[1]);
      enums.push({ name: m[2], file: path.basename(file), line: i + 1, items, comment: cleanComment(pending) });
      pending = []; continue;
    }
    m = ln.match(/^typedef enum\s*\{\s*(\/\*.*\*\/)?\s*$/);
    if (m) {
      const body = []; let j = i + 1;
      while (j < lines.length && !/^\}\s*\w+;/.test(lines[j])) { body.push(lines[j]); j++; }
      const name = (lines[j] || '').match(/^\}\s*(\w+);/);
      enums.push({ name: name ? name[1] : '?', file: path.basename(file), line: i + 1, items: splitEnum(body.join('\n')), comment: cleanComment(pending) });
      pending = []; i = j; continue;
    }
    /* comment lines preceding a declaration */
    if (/^\s*\/\*/.test(ln) || (pending.length && /^\s*\*/.test(ln)) || (pending.length && /\*\/\s*$/.test(ln))) {
      pending.push(ln);
      if (/\*\/\s*$/.test(ln) && !/^\s*\/\*/.test(ln)) { /* closed */ }
      continue;
    }
    if (!ln.trim()) { if (pending.length && /\*\/\s*$/.test(pending[pending.length - 1])) { /* keep: a blank line between a comment and its struct is common */ } continue; }
    if (/^(#|\s*$)/.test(ln)) { pending = []; continue; }
    if (!/^typedef/.test(ln) && !/^\s*$/.test(ln)) { pending = []; }
  }
  return { structs, enums };
}
function splitEnum(s) {
  /* replace comments by markers, split on commas, then "NAME [= value] [marker]" */
  const comments = [];
  const t = s.replace(/\/\*([\s\S]*?)\*\//g, (m, c) => { comments.push(cleanComment([c])); return '\u0001' + (comments.length - 1) + '\u0001'; });
  const items = [];
  t.split(',').forEach(piece => {
    /* a marker at the start of a piece is the comment that followed the previous item's comma */
    const lead = piece.match(/^\s*\u0001(\d+)\u0001/);
    if (lead && items.length && !items[items.length - 1].comment) items[items.length - 1].comment = comments[+lead[1]];
    const rest = piece.replace(/^\s*(?:\u0001\d+\u0001\s*)*/, '');
    const m = rest.match(/^\s*([A-Za-z_]\w*)\s*(?:=\s*([^\u0001]+?))?\s*(?:\u0001(\d+)\u0001)?\s*$/);
    if (!m) return;
    items.push({ name: m[1], value: m[2] ? m[2].trim() : null, comment: m[3] != null ? comments[+m[3]] : '' });
  });
  return items;
}

/* identifiers for the IUT I structs, from docs/DATA_MODEL.md §8b: rows "| §n | `iut_x` · `Id`, `Id2` | …" */
function mapFromDataModel() {
  const md = read(path.join(ROOT, 'docs', 'DATA_MODEL.md'));
  const sec = md.split('## 8b.')[1] || '';
  const map = {};
  sec.split('\n').forEach(row => {
    if (!/^\|\s*§/.test(row)) return;
    const cells = row.split('|').map(s => s.trim());
    const names = [...(cells[2] || '').matchAll(/`([^`]+)`/g)].map(m => m[1]);
    const structs = names.filter(n => /^iut_/.test(n)), ids = names.filter(n => !/^iut_/.test(n));
    structs.forEach(s => { map[s] = (map[s] || []).concat(ids); });
  });
  return map;
}

const H = ['iut.h', 'iut_i.h', 'iut_ops.h'].map(f => parseHeader(path.join(SRC, f)));
const structs = [].concat(...H.map(h => h.structs)), enums = [].concat(...H.map(h => h.enums));
const mdMap = mapFromDataModel();
const byIdent = {};
structs.forEach(s => {
  const ids = (MAP[s.name] || []).concat(mdMap[s.name] || []);
  s.idents = [...new Set(ids)];
  s.idents.forEach(id => { (byIdent[id] = byIdent[id] || []).push(s.name); });
});
enums.forEach(e => { e.idents = []; });
/* enum → identifiers: through the structs whose fields use the enum type */
structs.forEach(s => s.fields.forEach(f => {
  const e = enums.find(e => e.name === f.type);
  if (e) s.idents.forEach(id => { if (!e.idents.includes(id)) e.idents.push(id); });
}));
enums.forEach(e => e.idents.forEach(id => { (byIdent[id] = byIdent[id] || []); if (!byIdent[id].includes(e.name)) byIdent[id].push(e.name); }));

const out = '// generated by scripts/web/gen-types.js from src/iut.h, src/iut_i.h, src/iut_ops.h — do not edit\n' +
  '(function (root) { root.IUT_TYPES = ' + JSON.stringify({ structs, enums, byIdent }, null, 1) + '; })(typeof window !== "undefined" ? window : globalThis);\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== out) { console.log(path.relative(ROOT, OUT) + ' is out of date: run node scripts/web/gen-types.js'); process.exit(1); }
  process.exit(0);
}
fs.writeFileSync(OUT, out);
console.log('wrote ' + path.relative(ROOT, OUT) + ': ' + structs.length + ' structs, ' + enums.length + ' enums, ' + Object.keys(byIdent).length + ' identifiers mapped');
const unmapped = structs.filter(s => !s.idents.length).map(s => s.name);
if (unmapped.length) console.log('structs without identifiers: ' + unmapped.join(', '));
