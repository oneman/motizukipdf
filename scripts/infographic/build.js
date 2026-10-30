#!/usr/bin/env node
/*
 * scripts/infographic/build.js — the 4K infographic of docs/IDENTIFIERS.md.
 *
 *   node scripts/infographic/build.js            → docs/identifiers-infographic.svg (master)
 *                                                  docs/identifiers-infographic.png (3840×2160)
 *   node scripts/infographic/build.js --svg-only   skip Chromium, write the SVG only
 *
 * Reads `iut ids --json`, `iut procs --json` and the section markers of
 * src/iut_ids.c (the family each row belongs to) and the species / mutation
 * tables, so the picture cannot drift from the identifier table: regenerate it
 * after changing src/iut_ids.c or src/iut_proc.c.
 *
 * Layout (3840 × 2160):
 *   header      the rule, the numbers
 *   row A       symbol dictionary · the species / mutation pipeline from
 *               initial Θ-data to the inequality · where the identifiers come from
 *   row B       every (non-process, non-symbol) identifier grouped by family
 *   row C       the 73 processes grouped by paper
 *
 * Text widths are measured with a canvas in Chromium (the same Chromium that
 * renders the PNG), so the SVG is laid out against the real fonts.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT_SVG = path.join(ROOT, 'docs', 'identifiers-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'identifiers-infographic.png');
const W = 3840, H = 2160;

/* ------------------------------------------------------------ data */
function iut(args) {
  const bin = path.join(SRC, 'iut');
  if (!fs.existsSync(bin)) {
    console.error('src/iut is not built: run `make -C src` first');
    process.exit(1);
  }
  return JSON.parse(execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 26 }));
}

/* the family of each row = the comment marker above it in src/iut_ids.c */
function readFamilies() {
  const lines = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8').split('\n');
  const families = [];   // [{ key, start, count }]
  let cur = null, n = 0, inTable = false;
  for (const line of lines) {
    if (/^const iut_ident iut_idents\[\]/.test(line)) inTable = true;
    if (!inTable) continue;
    if (/^};/.test(line)) break;
    let m = line.match(/^\/\* -+\s*(.+?)\s*\*\/\s*$/) || line.match(/^\/\* -+ (\[IUTchI\] read from the paper).*\*\//);
    if (m) { cur = { key: m[1], start: n, count: 0 }; families.push(cur); continue; }
    m = line.match(/^\/\* (§\d) \*\/\s*$/);
    if (m) { cur = { key: 'IUTchI ' + m[1], start: n, count: 0 }; families.push(cur); continue; }
    if (/^ROW\(/.test(line)) { n++; if (cur) cur.count++; }
  }
  return families;
}

function readSpeciesAndMutations() {
  const src = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8');
  const species = [], mutations = [];
  const sp = src.split('iut_species_table[] = {')[1].split('\n};')[0];
  for (const m of sp.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)",\s*"([^"]*)"/g)) species.push({ id: m[1], notation: m[2], ref: m[3] });
  const mu = src.split('iut_mutation_table[] = {')[1].split('\n};')[0];
  for (const m of mu.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)",\s*"([A-Za-z]+)",\s*"([A-Za-z]+)",\s*"([^"]*)",\s*(\d)/g))
    mutations.push({ id: m[1], notation: m[2], from: m[3], to: m[4], ref: m[5], core: m[6] === '1' });
  return { species, mutations };
}

function paperOf(ref) { const m = ref.match(/\[(\w+)\]/); return m ? m[1] : '?'; }

const ids = iut(['ids', '--json']);
const procs = iut(['procs', '--json']);
const families = readFamilies();
const { species, mutations } = readSpeciesAndMutations();
if (families.reduce((a, f) => a + f.count, 0) !== ids.length) {
  console.error(`family markers cover ${families.reduce((a, f) => a + f.count, 0)} rows but the table has ${ids.length}`);
  process.exit(1);
}

/* the eight coarse families that colour the chips (fixed categorical order) */
const KIND_FAMILY = {
  primestrip: 0, capsule: 0, frobenioid: 0, category: 0, anabelioid: 0,
  hodgetheater: 1, bridge: 1, gluing: 1, link: 1, lattice: 1, diagram: 1,
  group: 2, monoid: 2, field: 2, curve: 2, cusp: 2, set: 2, datum: 2,
  symbol: 3, label: 3, labelset: 3, symmetry: 3, constant: 3,
  logshell: 4, pilot: 4, quantity: 4, theorem: 4,
  species: 5, mutation: 5,
  process: 6,
  structure: 7, map: 7, morphism: 7, property: 7, indeterminacy: 7,
};
const FAMILY_NAMES = [
  'prime-strips · capsules · Frobenioids · categories',
  'Hodge theaters · bridges · links · lattices',
  'groups · monoids · fields · curves · cusps · sets · data',
  'symbols · labels · label sets · symmetries · constants',
  'log-shells · pilots · quantities · theorems',
  'species · mutations',
  'processes (iut run <id>)',
  'structures · maps · morphisms · properties · indeterminacies',
];
for (const r of ids) if (!(r.kind in KIND_FAMILY)) { console.error('unknown kind ' + r.kind); process.exit(1); }

const PAPERS = {
  IUTchI: 'IUT I — Hodge theaters', IUTchII: 'IUT II — Hodge–Arakelov evaluation', IUTchIII: 'IUT III — log-theta-lattice',
  IUTchIV: 'IUT IV — log-volume computations', Alien: 'Mutually alien copies', EssLgc: 'Essential logical structure',
  FrdI: 'Frobenioids I', EtTh: 'Étale theta', ExpEst: 'Explicit estimates', FormIUT: 'Formalization of IUT',
};

const data = { ids, procs, families, species, mutations, KIND_FAMILY, FAMILY_NAMES, PAPERS,
  kindCounts: countBy(ids, r => r.kind), paperCounts: countBy(ids, r => paperOf(r.ref)),
  generated: new Date().toISOString().slice(0, 10) };

function countBy(arr, f) { const c = {}; for (const x of arr) { const k = f(x); c[k] = (c[k] || 0) + 1; } return c; }

/* ------------------------------------------------------------ layout (runs in Chromium) */
/* The function below is serialised into the page; it must be self-contained. */
function layout(D) {
  const W = 3840, H = 2160, M = 80;
  const C = {               // the reference palette of the dataviz method (light mode)
    surface: '#fcfcfb', panel: '#f4f4f1', line: '#e4e3df', text: '#0b0b0b', text2: '#52514e', muted: '#8a8984',
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
    seq: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
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
  const rect = (x, y, w, h, o = {}) => out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`);
  const line = (x1, y1, x2, y2, o = {}) => out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}/>`);
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const bg = [252, 252, 251]; const mix = (c, s) => Math.round(s + (c - s) * a); return `rgb(${mix(r, bg[0])},${mix(g, bg[1])},${mix(b, bg[2])})`; };

  /* word-wrap prose */
  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.35; const words = s.split(' '); let cur = '', yy = y;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, o); yy += lh; cur = w; } else cur = t;
    }
    if (cur) { text(x, yy, cur, o); yy += lh; }
    return yy;
  };

  /* a chip: identifier in mono on a tinted pill with a family colour bar */
  const CHIP = { size: 16, h: 23, padx: 7, gap: 6, vgap: 4 };
  const chipW = (id, size = CHIP.size) => Math.ceil(measure(id, MONO, size)) + CHIP.padx * 2 + 5;
  const chip = (x, y, id, fam, o = {}) => {
    const size = o.size || CHIP.size, h = o.h || CHIP.h, w = chipW(id, size), col = C.series[fam];
    rect(x, y, w, h, { rx: 5, fill: tint(col, 0.13) });
    rect(x, y, 5, h, { rx: 2.5, fill: col });
    text(x + 5 + CHIP.padx, y + h / 2 + size * 0.36, id, { font: MONO, size, fill: C.text });
    return w;
  };
  /* flow chips into a box of width `width`, return height used */
  const flow = (x, y, width, items, o = {}) => {
    let cx = x, cy = y, rowH = (o.h || CHIP.h) + CHIP.vgap;
    for (const it of items) {
      const w = chipW(it.id, o.size);
      if (cx + w > x + width && cx > x) { cx = x; cy += rowH; }
      chip(cx, cy, it.id, it.fam, o); cx += w + CHIP.gap;
    }
    return cy + rowH - CHIP.vgap - y;
  };
  const panel = (x, y, w, h, title, sub) => {
    rect(x, y, w, h, { rx: 14, fill: C.panel });
    text(x + 28, y + 44, title, { size: 30, weight: 600 });
    if (sub) wrap(x + 28, y + 76, sub, w - 56, { size: 19, fill: C.text2, lh: 25 });
  };
  const arrowDefs = `<defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.text2}"/></marker>
    <marker id="arrB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.series[1]}"/></marker>
    <marker id="arrG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.series[5]}"/></marker>
  </defs>`;
  out.push(arrowDefs);
  rect(0, 0, W, H, { fill: C.surface });

  const byId = {}; for (const r of D.ids) byId[r.id] = r;
  const fam = id => D.KIND_FAMILY[(byId[id] || { kind: 'process' }).kind];

  /* ================================================================ header */
  text(M, 92, 'The identifiers of inter-universal Teichmüller theory', { size: 62, weight: 700 });
  wrap(M, 140,
    `docs/IDENTIFIERS.md gives every object of [IUTchI]–[IUTchIV], [Alien] and [EssLgc] whose printed name contains a symbol that is not an English letter ` +
    `(†, ‡, ⊢, ⊩, ▶, ×μ, ±, ⋊, ⊞, ⊚, ⊛, Δ, >, ∞, …) a unique name matching ^[A-Za-z]+$, unique case-insensitively, so that it works as a C identifier, a JavaScript key, ` +
    `a Lean name, a file name and a URL fragment. Generated from src/iut_ids.c by iut ids --md: these names are the struct, field and function names of the C toolkit, ` +
    `the keys of its JSON output and the labels of the TUI and the web app.`,
    2540, { size: 22, fill: C.text2, lh: 30 });

  /* stat tiles */
  const stats = [
    [D.ids.length, 'identifiers'], [D.kindCounts.symbol, 'symbols → words'], [D.procs.length, 'processes'],
    [D.species.length, 'species'], [D.mutations.length, 'mutations'], [9, 'prime-strip kinds'], [7, 'link kinds'], [Object.keys(D.paperCounts).length, 'papers cited'],
  ];
  let sx = W - M - stats.length * 136;
  for (const [v, l] of stats) {
    rect(sx, 46, 124, 118, { rx: 12, fill: C.panel });
    text(sx + 62, 112, String(v), { size: 46, weight: 600, anchor: 'middle' });
    text(sx + 62, 146, l, { size: 16, fill: C.text2, anchor: 'middle' });
    sx += 136;
  }

  /* ================================================================ row A */
  const AY = 265, AH = 680;

  /* --- A1: symbol dictionary */
  const A1X = M, A1W = 640;
  panel(A1X, AY, A1W, AH, 'Symbol dictionary', 'The 28 symbols of the notation and the word each becomes inside an identifier.');
  const syms = D.ids.filter(r => r.kind === 'symbol');
  const colX = [0, 222, 404];
  syms.forEach((r, i) => {
    const col = Math.floor(i / 10), row = i % 10;
    const x = A1X + 28 + colX[col], y = AY + 140 + row * 29;
    rect(x, y - 22, 40, 29, { rx: 6, fill: tint(C.series[3], 0.16) });
    text(x + 20, y, r.notation, { font: SYM, size: 20, anchor: 'middle', weight: 600 });
    text(x + 50, y - 2, '→', { size: 16, fill: C.muted });
    text(x + 72, y, r.id, { font: MONO, size: 18 });
  });
  /* how a name is assembled */
  let yy = AY + 140 + 10 * 29 + 14;
  line(A1X + 28, yy - 26, A1X + A1W - 28, yy - 26);
  text(A1X + 28, yy + 4, 'How a name is assembled', { size: 22, weight: 600 });
  const builds = [
    ['F⊢×μ-prime-strip', ['F', 'Mono', 'UnitsModTors', 'PrimeStrip']],
    ['Θ×μ_LGP-link', ['Theta', 'UnitsModTors', 'LGPTorsor', 'Link']],
    ['†HT^{D-Θ±ell NF}', ['Dag', 'HT', 'D', 'Theta', 'Pm', 'Ell', 'NF']],
    ['S^±_{j+1}', ['S', 'Pm', 'J', 'Plus', 'One']],
    ['F⊩_LGP  /  F⊩_lgp', ['FMonoGlobLGPTorsor', ' / ', 'FMonoGlobLgpIdeal']],
  ];
  yy += 10;
  for (const [nota, parts] of builds) {
    yy += 36;
    text(A1X + 28, yy, nota, { font: SYM, size: 19, weight: 600 });
    let px = A1X + 28 + 215;
    text(px - 22, yy, '→', { size: 16, fill: C.muted });
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p === ' / ') { text(px + 2, yy, '/', { size: 18, fill: C.muted }); px += 20; continue; }
      const w = measure(p, MONO, 18);
      rect(px - 3, yy - 19, w + 6, 26, { rx: 4, fill: i % 2 ? tint(C.series[0], 0.14) : tint(C.series[3], 0.16) });
      text(px, yy, p, { font: MONO, size: 18 });
      px += w + 8;
    }
  }
  yy += 30;
  wrap(A1X + 28, yy, 'Names that differ only by case in the papers (LGP / lgp, MOD / mod) get distinct words; numbers are spelled out: Zero, One, TwoL, JSq, LStar, LPm.', A1W - 56, { size: 15, fill: C.text2, lh: 20 });

  /* --- A2: the pipeline */
  const A3W = 560;
  const A2X = A1X + A1W + 40, A2W = W - M - A3W - 40 - A2X;
  panel(A2X, AY, A2W, AH, 'From initial Θ-data to the inequality: the species and mutations',
    '[IUTchIV] §3 calls a type of mathematical object a species and a functor between species a mutation; the log-theta-lattice is a mutation-history. ' +
    'The toolkit implements each species as a C struct and each mutation as a function. Boxes are species, arrows are mutations (green = core: an isomorphism on coric data).');
  const node = (x, y, w, h, id, notation, famIdx, o = {}) => {
    const col = C.series[famIdx];
    rect(x, y, w, h, { rx: 8, fill: o.strong ? tint(col, 0.22) : tint(col, 0.12), stroke: o.strong ? col : undefined, sw: 2 });
    rect(x, y, 6, h, { rx: 3, fill: col });
    const two = notation && h < 50;
    text(x + 16, y + (two ? 18 : 24), id, { font: MONO, size: o.idSize || 17, weight: 500 });
    if (notation) text(x + 16, y + h - (two ? 9 : 11), notation, { font: SYM, size: two ? 12 : 16, fill: C.text2 });
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
  };
  const arrow = (a, b, label, o = {}) => {
    /* orthogonal-ish connector from the right edge of a to the left edge of b */
    const x1 = a.r, y1 = o.y1 ?? a.cy, x2 = b.x, y2 = o.y2 ?? b.cy;
    const mx = x1 + (x2 - x1) * (o.bend ?? 0.5);
    pathd(`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`, { stroke: o.core ? C.series[5] : C.text2, sw: o.sw || 1.8, marker: o.core ? 'arrG' : 'arr', dash: o.dash });
    if (label) {
      const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2 - 8;
      const w = measure(label, MONO, 14);
      rect(lx - w / 2 - 5, ly - 14, w + 10, 19, { rx: 4, fill: C.panel });
      text(lx, ly, label, { font: MONO, size: 14, fill: o.core ? C.series[5] : C.text2, anchor: 'middle' });
    }
  };
  const vArrow = (a, b, label, o = {}) => {
    const x = o.x ?? a.cx, y1 = a.b, y2 = b.y;
    line(x, y1, x, y2 - 2, { stroke: o.core ? C.series[5] : C.text2, sw: 1.8, marker: o.core ? 'arrG' : 'arr' });
    if (label) { const w = measure(label, MONO, 14); rect(x + 8, (y1 + y2) / 2 - 11, w + 10, 19, { rx: 4, fill: C.panel }); text(x + 13, (y1 + y2) / 2 + 3, label, { font: MONO, size: 14, fill: o.core ? C.series[5] : C.text2 }); }
  };
  const stage = (x, y, w, label) => { text(x, y, label, { size: 15, weight: 600, fill: C.muted, extra: ' letter-spacing="1.5"' }); line(x, y + 8, x + w, y + 8, { stroke: C.line, sw: 1 }); };

  const PY = AY + 140;      // top of the diagram area
  const NH = 50;
  /* stage 0: initial Θ-data */
  stage(A2X + 28, PY, 250, '0 · INPUT  [IUTchI] Def 3.1');
  const nInit = node(A2X + 28, PY + 30, 250, 70, 'InitialThetaData', '(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)', 2, { strong: true });
  let ly = PY + 30 + 70 + 18;
  for (const [id, nota] of [['Fl', 'F_l, |F_l|, F_l^*'], ['FlSemiPm', 'F_l^{⋊±}  additive'], ['FlStarSym', 'F_l^*  multiplicative'], ['QUnderV', 'q̲_v = q_v^{1/2l}'], ['ThetaUnderV', 'Θ̲_v'], ['PiV', 'Π_v ↠ G_v'], ['GV', 'G_v']]) {
    const w = chip(A2X + 28, ly, id, fam(id), { size: 16, h: 25 });
    text(A2X + 28 + w + 10, ly + 18, nota, { font: SYM, size: 15, fill: C.text2 });
    ly += 31;
  }
  text(A2X + 28, ly + 26, 'labels, symmetries, local data', { size: 15, fill: C.muted });

  /* stage 1: prime-strips */
  const S1X = A2X + 330, S1W = 560;
  stage(S1X, PY, S1W, '1 · PRIME-STRIPS  [IUTchI] Def 4.1, 5.2 · [IUTchII] Def 4.9');
  text(S1X, PY + 44, 'Frobenius-like (F)', { size: 15, weight: 600, fill: C.text2 });
  text(S1X + 400, PY + 44, 'étale-like (D)', { size: 15, weight: 600, fill: C.text2 });
  const psF = [['FMonoGlobValUnitsModTorsPrimeStrip', 'F⊩▶×μ'], ['FMonoGlobPrimeStrip', 'F⊩'], ['FMonoValUnitsModTorsPrimeStrip', 'F⊢▶×μ'], ['FMonoUnitsModTorsPrimeStrip', 'F⊢×μ  basic prime-strip'], ['FMonoUnitsPrimeStrip', 'F⊢×'], ['FMonoPrimeStrip', 'F⊢'], ['FPrimeStrip', 'F  {Π_v ↷ O▷}']];
  const PSN = {}; let py = PY + 58;
  for (const [id, nota] of psF) { PSN[id] = node(S1X, py, 340, 44, id, nota, 0, { idSize: 13 }); py += 54; }
  PSN.DMonoPrimeStrip = node(S1X + 400, PY + 58 + 54 * 3, 160, 44, 'DMonoPrimeStrip', 'D⊢ {G_v}  bi-coric', 0, { idSize: 13, strong: true });
  text(S1X + 400, PY + 58 + 54 * 3 + 62, '← ForgetToDMono (F)', { font: MONO, size: 12, fill: C.series[5] });
  text(S1X + 400, PY + 58 + 54 * 3 + 78, '← ForgetToUnitsModTors', { font: MONO, size: 12, fill: C.series[5] });
  text(S1X + 400, PY + 58 + 54 * 3 + 94, '   (F⊩, core)', { font: MONO, size: 12, fill: C.series[5] });
  PSN.DPrimeStrip = node(S1X + 400, PY + 58 + 54 * 6, 160, 44, 'DPrimeStrip', 'D {Π_v}  holomorphic', 0, { idSize: 13 });
  /* the forgetful ladder */
  line(S1X - 14, PSN[psF[0][0]].y + 8, S1X - 14, PSN[psF[psF.length - 1][0]].b - 10, { stroke: C.series[5], sw: 2, marker: 'arrG' });
  text(S1X - 2, PY + 58 + 54 * 7 + 4, 'ForgetLadder (core)', { font: MONO, size: 13, fill: C.series[5] });
  arrow(PSN.FPrimeStrip, PSN.DMonoPrimeStrip, null, { core: true, bend: 0.3, y2: PSN.DMonoPrimeStrip.cy + 10 });
  arrow(PSN.FMonoGlobPrimeStrip, PSN.DMonoPrimeStrip, null, { core: true, bend: 0.3, y2: PSN.DMonoPrimeStrip.cy - 10 });
  arrow(PSN.FPrimeStrip, PSN.DPrimeStrip, null, { core: true });
  wrap(S1X, py + 30, 'A prime-strip is one datum per v ∈ V. ⊢ forgets the ring structure, ⊩ adds the global realified Frobenioid C⊩, ×μ keeps units modulo torsion, ▶ the value group. Capsules F_J, F_T and processions S_{j+1}, S^±_{j+1} collect strips; bridges map them to F_>, F_⊛, F_⊞, D_⊚±.', S1W, { size: 14, fill: C.muted, lh: 18 });

  /* stage 2: Hodge theaters */
  const S2X = S1X + S1W + 60, S2W = 520;
  stage(S2X, PY, S2W, '2 · HODGE THEATERS  [IUTchI] Def 3.6, 5.5, 6.13');
  const nThBr = node(S2X, PY + 30, 150, 44, 'ThetaBridge', null, 1, { idSize: 14 });
  const nNFBr = node(S2X, PY + 80, 150, 44, 'NFBridge', null, 1, { idSize: 14 });
  const nNF = node(S2X + 200, PY + 48, 230, 56, 'ThetaNFHodgeTheater', 'ΘNF  ·  F_l^*  multiplicative', 1);
  const nPmBr = node(S2X, PY + 150, 150, 44, 'ThetaPmBridge', null, 1, { idSize: 14 });
  const nEllBr = node(S2X, PY + 200, 150, 44, 'ThetaEllBridge', null, 1, { idSize: 14 });
  const nPm = node(S2X + 200, PY + 168, 230, 56, 'ThetaPmEllHodgeTheater', 'Θ±ell  ·  F_l^{⋊±}  additive', 1);
  arrow(nThBr, nNF, null, { bend: 0.4, y2: nNF.cy - 10 }); arrow(nNFBr, nNF, null, { bend: 0.4, y2: nNF.cy + 10 });
  arrow(nPmBr, nPm, null, { bend: 0.4, y2: nPm.cy - 10 }); arrow(nEllBr, nPm, null, { bend: 0.4, y2: nPm.cy + 10 });
  const nHT = node(S2X + 120, PY + 270, 340, 60, 'ThetaPmEllNFHodgeTheater', '• = one vertex of the lattice', 1, { strong: true });
  const glueY = PY + 255;
  pathd(`M${nNF.cx},${nNF.b} L${nNF.cx},${glueY - 8}`, { stroke: C.text2, sw: 1.8 });
  pathd(`M${nPm.cx},${nPm.b} L${nPm.cx},${glueY - 8}`, { stroke: C.text2, sw: 1.8 });
  pathd(`M${nNF.cx},${glueY - 8} L${nHT.cx},${glueY - 8} L${nHT.cx},${nHT.y - 2}`, { stroke: C.text2, sw: 1.8, marker: 'arr' });
  { const l = 'GluingZeroBoxPlusToGt  0,⊞ ↦ >'; const w = measure(l, MONO, 14); rect(nHT.cx - w / 2 - 5, glueY - 30, w + 10, 19, { rx: 4, fill: C.panel }); text(nHT.cx, glueY - 16, l, { font: MONO, size: 14, fill: C.text2, anchor: 'middle' }); }
  const nDHT = node(S2X + 120, PY + 370, 340, 56, 'DThetaPmEllNFHodgeTheater', 'étale-like · vertically coric', 1);
  vArrow(nHT, nDHT, 'ForgetToD', { core: true, x: nHT.cx - 60 });
  const nTh = node(S2X + 120, PY + 462, 340, 44, 'ThetaHodgeTheater', null, 1, { idSize: 14 });
  text(S2X + 120, PY + 528, '(F⊩_mod, F⊩_tht)  [IUTchI] Def 3.6 — the first Hodge theater', { font: SYM, size: 13, fill: C.text2 });
  text(S2X, PY + 480, 'ThetaLink', { font: MONO, size: 13, fill: C.text2 });
  text(S2X, PY + 497, '†F⊩_tht ≅ ‡F⊩_mod', { font: SYM, size: 12, fill: C.muted });
  pathd(`M${S2X + 114},${PY + 476} L${nTh.x - 2},${PY + 476}`, { stroke: C.text2, sw: 1.6, marker: 'arr' });
  void nTh;

  /* stage 3: the log-theta-lattice */
  const S3X = S2X + S2W + 70, S3W = 400;
  stage(S3X, PY, S3W, '3 · LOG-THETA-LATTICE  [IUTchIII] Def 1.4, 3.8');
  const LX = S3X + 60, LY = PY + 70, DX = 130, DY = 100;
  const cells = {};
  for (let n = 0; n < 3; n++) for (let m = 0; m < 3; m++) {
    const x = LX + n * DX, y = LY + (2 - m) * DY;
    cells[`${n},${m}`] = { x, y };
  }
  for (let n = 0; n < 3; n++) for (let m = 0; m < 2; m++) line(cells[`${n},${m}`].x, cells[`${n},${m}`].y - 14, cells[`${n},${m + 1}`].x, cells[`${n},${m + 1}`].y + 14, { stroke: C.series[0], sw: 2.5, marker: 'arr' });
  for (let n = 0; n < 2; n++) for (let m = 0; m < 3; m++) line(cells[`${n},${m}`].x + 14, cells[`${n},${m}`].y, cells[`${n + 1},${m}`].x - 14, cells[`${n + 1},${m}`].y, { stroke: C.series[1], sw: 2.5, marker: 'arrB' });
  for (const k in cells) {
    const c = cells[k];
    out.push(`<circle cx="${c.x}" cy="${c.y}" r="12" fill="${C.series[1]}" stroke="${C.panel}" stroke-width="3"/>`);
    text(c.x + 16, c.y - 14, `{${k}}`, { font: MONO, size: 12, fill: C.muted });
  }
  text(LX + DX, LY - 42, 'Bullet · NMHodgeTheater {n,m}HT', { font: MONO, size: 13, fill: C.text2, anchor: 'middle' });
  let l3 = LY + 2 * DY + 40;
  rect(S3X, l3, 12, 12, { fill: C.series[0] }); text(S3X + 20, l3 + 11, 'LogLink  (vertical, m ↦ m+1)', { font: MONO, size: 14 });
  text(S3X + 20, l3 + 30, 'log: O× → K_v; vertically coric data survive', { size: 13, fill: C.muted });
  l3 += 48;
  rect(S3X, l3, 12, 12, { fill: C.series[1] }); text(S3X + 20, l3 + 11, 'ThetaUnitsModTorsLGPTorsorLink', { font: MONO, size: 14 });
  text(S3X + 20, l3 + 30, 'Θ×μ_LGP-link (horizontal, n ↦ n+1); variants', { size: 13, fill: C.muted });
  text(S3X + 20, l3 + 48, 'ThetaUnitsModTorsLgpIdealLink', { font: MONO, size: 12, fill: C.muted });
  text(S3X + 20, l3 + 64, 'ThetaUnitsModTorsGauLink · ThetaLink', { font: MONO, size: 12, fill: C.muted });
  l3 += 90;
  for (const t of ['LogThetaLattice · NCircColumn (n,◦)', 'InfiniteH ∞H · LGPTorsorGaussianLogThetaLattice', 'VerticallyCoric · HorizontallyCoric · BiCoric', 'KummerDetachment · FrobeniusPicture · EtalePicture']) { text(S3X, l3, t, { font: MONO, size: 12, fill: C.text2 }); l3 += 17; }
  arrow(nHT, { x: LX - 20, cy: cells['0,1'].y }, null, { bend: 0.6, dash: '6 5' });

  /* stage 4: log-shells, pilots, estimate */
  const S4X = S3X + S3W + 60, S4W = A2X + A2W - 28 - S4X;
  stage(S4X, PY, S4W, '4 · LOG-SHELLS → ESTIMATE  [IUTchIII]');
  const nLS = node(S4X, PY + 30, 160, 50, 'LogShell', 'I = (p*)⁻¹ log(O×)', 4);
  const nTP = node(S4X, PY + 115, 160, 50, 'TensorPacket', '⊗ over S^±_{j+1}', 4);
  vArrow(nLS, nTP, 'TensorPacketConstruction');
  text(S4X + 175, PY + 46, 'LogShellConstruction  F ↦ I', { font: MONO, size: 12, fill: C.text2 });
  text(S4X + 175, PY + 64, 'EtaleLogShellConstruction', { font: MONO, size: 12, fill: C.series[5] });
  text(S4X + 175, PY + 80, 'D ↦ I(D)  (core: étale-like)', { font: MONO, size: 12, fill: C.series[5] });
  const nQ = node(S4X + 200, PY + 200, 130, 50, 'QPilot', '{q̲_v}', 4);
  const nT = node(S4X, PY + 200, 160, 50, 'ThetaPilot', '{q̲_v^{j²}}', 4, { strong: true });
  vArrow(nTP, nT, null);
  const nMR = node(S4X, PY + 290, 360, 56, 'MultiradialRepresentation', 'R^LGP_{n,◦} up to IndOne · IndTwo · IndThree', 4, { strong: true });
  vArrow(nT, nMR, 'MultiradialAlgorithm', { x: nT.cx });
  pathd(`M${nQ.cx},${nQ.b} L${nQ.cx},${nMR.y - 2}`, { stroke: C.text2, sw: 1.8, marker: 'arr', dash: '5 4' });
  const nC = node(S4X, PY + 375, 360, 50, 'CorThreeTwelve', '−|log(Θ)| ≥ −|log(q)|   AbsLogTheta, AbsLogQ', 4);
  vArrow(nMR, nC, null, { x: nMR.cx });
  const nE = node(S4X, PY + 450, 360, 50, 'ThmOneTen', '[IUTchIV] Thm 1.10 — the Diophantine inequality', 4);
  vArrow(nC, nE, null, { x: nC.cx });
  text(S4X, PY + 528, 'ThmA · ThmB  [ExpEst] effective abc; FLT for p > 1.6·10¹⁴', { font: MONO, size: 12, fill: C.text2 });
  /* lattice -> log-shell */
  pathd(`M${LX + 2 * DX + 30},${cells['2,1'].y} C${S4X - 30},${cells['2,1'].y} ${S4X - 30},${nLS.cy} ${nLS.x - 2},${nLS.cy}`, { stroke: C.text2, sw: 1.8, marker: 'arr', dash: '6 5' });

  /* --- A3: where the identifiers come from */
  const A3X = A2X + A2W + 40;
  panel(A3X, AY, A3W, AH, 'Where the identifiers come from', 'By the paper of their first reference, and by kind. IUT I dominates: its §0–§6 were read definition by definition.');
  const barChart = (x, y, w, entries, labelOf, maxBars, title) => {
    text(x, y, title, { size: 18, weight: 600, fill: C.text2 });
    const lw = 250, bw = w - lw - 70, max = Math.max(...entries.map(e => e[1]));
    let by = y + 18;
    for (const [k, v] of entries.slice(0, maxBars)) {
      text(x + lw - 12, by + 13, labelOf(k), { size: 14, fill: C.text, anchor: 'end' });
      const len = Math.max(4, bw * v / max);
      const fillc = /^other/.test(k) ? C.seq[1] : C.seq[3];
      rect(x + lw, by, len, 16, { fill: fillc });
      rect(x + lw + len - 4, by, 4, 16, { rx: 2, fill: fillc });
      text(x + lw + len + 8, by + 13, String(v), { size: 14, fill: C.text2 });
      by += 21;
    }
    return by;
  };
  const paperEntries = Object.entries(D.paperCounts).sort((a, b) => b[1] - a[1]);
  let by = barChart(A3X + 28, AY + 140, A3W - 56, paperEntries, k => `[${k}] ${D.PAPERS[k] || ''}`.replace(/ — .*/, '') , 10, 'by paper');
  const kindEntries = Object.entries(D.kindCounts).sort((a, b) => b[1] - a[1]);
  const TOPK = 10;
  const rest = kindEntries.slice(TOPK).reduce((a, e) => a + e[1], 0);
  by = barChart(A3X + 28, by + 22, A3W - 56, kindEntries.slice(0, TOPK), k => k, TOPK, 'by kind');
  text(A3X + 28 + 250 - 12, by + 13, `+ ${rest} more in ${kindEntries.length - TOPK} other kinds`, { size: 14, fill: C.muted, anchor: 'end' });

  /* ================================================================ row B: every identifier by family */
  const BY = AY + AH + 30, BH = 800;
  panel(M, BY, W - 2 * M, BH, 'Every identifier, by family',
    'The ' + (D.ids.length - D.procs.length - D.kindCounts.symbol) + ' object identifiers in the order of src/iut_ids.c: the families of the data model, then [IUTchI] section by section. ' +
    'The colour of a chip is its kind (legend bottom right); the 28 symbols are in the dictionary above and the ' + D.procs.length + ' processes below.');
  const FAMILY_TITLES = {
    'base fields etc': 'Base fields, curves, sets, constants', 'label sets': 'Label sets and symmetries', 'groups/monoids': 'Groups and monoids',
    'prime-strips': 'Prime-strips', 'Hodge theaters': 'Hodge theaters, bridges, capsules', 'links': 'Links, lattices, coricity',
    'log-shells': 'Log-shells, packets, processions', 'pilots / volume': 'Pilots, log-volumes, theorems', 'species': 'Species, mutations, generalities',
  };
  const groups = [];
  for (const f of D.families) {
    if (f.key === 'symbols' || /^processes/.test(f.key) || /read from the paper/.test(f.key)) continue;
    const rows = D.ids.slice(f.start, f.start + f.count);
    const title = FAMILY_TITLES[f.key] || (f.key.replace('IUTchI ', '[IUTchI] ') + ' ' + ({ '§0': 'Notations and conventions', '§1': 'Coverings of punctured elliptic curves', '§2': 'Complements on tempered coverings', '§3': 'Chains of Θ-Hodge theaters', '§4': 'Multiplicative combinatorial Teichmüller', '§5': 'ΘNF-Hodge theaters', '§6': 'Additive combinatorial Teichmüller' }[f.key.slice(-2)] || ''));
    groups.push({ title, items: rows.map(r => ({ id: r.id, fam: D.KIND_FAMILY[r.kind] })) });
  }
  /* masonry: NCOL columns, each group goes to the shortest column */
  const NCOL = 7, GW = (W - 2 * M - 56 - (NCOL - 1) * 26) / NCOL, GX0 = M + 28, GY0 = BY + 100;
  const colY = new Array(NCOL).fill(GY0);
  const groupH = g => { // dry run
    let cx = 0, rows = 1;
    for (const it of g.items) { const w = chipW(it.id); if (cx + w > GW && cx > 0) { cx = 0; rows++; } cx += w + CHIP.gap; }
    return 30 + rows * (CHIP.h + CHIP.vgap) + 10;
  };
  /* balance the columns: tallest group first into the shortest column, then draw each column in source order */
  groups.forEach((g, i) => { g.h = groupH(g); g.i = i; });
  const cols = Array.from({ length: NCOL }, () => []);
  const colH = new Array(NCOL).fill(0);
  for (const g of [...groups].sort((a, b) => b.h - a.h)) {
    let ci = 0; for (let i = 1; i < NCOL; i++) if (colH[i] < colH[ci]) ci = i;
    cols[ci].push(g); colH[ci] += g.h + 10;
  }
  cols.forEach((col, ci) => {
    col.sort((a, b) => a.i - b.i);
    for (const g of col) {
      const x = GX0 + ci * (GW + 26), y = colY[ci];
      text(x, y + 18, g.title, { size: 17, weight: 600 });
      text(x + GW, y + 18, String(g.items.length), { size: 15, fill: C.muted, anchor: 'end' });
      line(x, y + 26, x + GW, y + 26);
      flow(x, y + 36, GW, g.items);
      colY[ci] = y + g.h + 10;
    }
  });
  const usedB = Math.max(...colY);
  if (usedB > BY + BH - 40) console.warn('row B overflow: ' + (usedB - (BY + BH - 40)) + 'px');
  /* legend */
  let lx = M + 28, lyy = BY + BH - 20;
  text(lx, lyy, 'chip colour = kind:', { size: 15, weight: 600, fill: C.text2 }); lx += 150;
  D.FAMILY_NAMES.forEach((name, i) => {
    if (i === 6) return;
    rect(lx, lyy - 12, 12, 12, { rx: 2, fill: C.series[i] });
    lx += 18 + text(lx + 18, lyy, name, { size: 15, fill: C.text2 }) + 28;
  });

  /* ================================================================ row C: processes by paper */
  const CY = BY + BH + 25, CH = H - 30 - CY;
  panel(M, CY, W - 2 * M, CH, 'The ' + D.procs.length + ' processes, by paper',
    'Each process is a function family in src/iut_ops_*.c; iut run <id> demonstrates it on the command line, in the TUI and in the web app (docs/PROCESSES.md).');
  const procPapers = ['IUTchI', 'IUTchII', 'IUTchIII', 'IUTchIV', 'EssLgc', 'Alien'];
  const pc = {}; for (const p of D.procs) (pc[p.paper] = pc[p.paper] || []).push(p);
  const PSIZE = { size: 17, h: 26 };
  const pChipW = id => chipW(id, PSIZE.size) + CHIP.gap;
  /* column widths proportional to total chip length, with a minimum */
  const tot = procPapers.map(p => pc[p].reduce((a, q) => a + pChipW(q.id), 0));
  const avail = W - 2 * M - 56 - (procPapers.length - 1) * 30;
  const sumTot = tot.reduce((a, b) => a + b, 0);
  const minW = 330;
  let widths = tot.map(t => Math.max(minW, avail * t / sumTot));
  const over = widths.reduce((a, b) => a + b, 0) - avail;
  if (over > 0) { const big = widths.map((w, i) => w > minW ? i : -1).filter(i => i >= 0); const bigSum = big.reduce((a, i) => a + widths[i], 0); for (const i of big) widths[i] -= over * widths[i] / bigSum; }
  let px = M + 28;
  procPapers.forEach((p, i) => {
    const w = widths[i], y = CY + 108;
    text(px, y, `[${p}]`, { font: MONO, size: 18, weight: 600 });
    { const t = D.PAPERS[p].replace(/^.*— /, ''), tx = px + measure(`[${p}]`, MONO, 18, 600) + 12; if (tx + measure(t, SANS, 16) < px + w - 110) text(tx, y, t, { size: 16, fill: C.text2 }); }
    text(px + w, y, pc[p].length + ' processes', { size: 15, fill: C.muted, anchor: 'end' });
    line(px, y + 10, px + w, y + 10);
    const used = flow(px, y + 22, w, pc[p].map(q => ({ id: q.id, fam: 6 })), PSIZE);
    if (y + 22 + used > CY + CH - 10) console.warn('row C overflow in ' + p);
    px += w + 30;
  });

  /* footer */
  text(W - M, H - 12, `oneman/motizukipdf · docs/IDENTIFIERS.md · generated ${D.generated} by scripts/infographic/build.js from iut ids --json and iut procs --json`, { size: 14, fill: C.muted, anchor: 'end' });
  text(M, H - 12, `${D.ids.length} identifiers: ${Object.entries(D.kindCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[1] + ' ' + e[0]).join(' · ')} · …`, { size: 14, fill: C.muted });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<title>The identifiers of inter-universal Teichmüller theory — docs/IDENTIFIERS.md</title>
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
  /* warm the fonts up so measureText sees them */
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
