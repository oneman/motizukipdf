#!/usr/bin/env node
/*
 * scripts/infographic/hatched.js — line-shaded plates: looking at one universe from another.
 *
 *   node scripts/infographic/hatched.js              → docs/hatched/NN-<name>.svg  (masters)
 *                                                      docs/hatched/NN-<name>.png  (3840×2160)
 *                                                      docs/hatched/hatched-plates.pdf (US Letter, landscape)
 *   node scripts/infographic/hatched.js --svg-only     write the SVGs only
 *   node scripts/infographic/hatched.js --only 3       one plate
 *
 * Six plates in one ink. Nothing is filled with colour: every region is shaded with a line
 * pattern, and the pattern says what kind of object the region is.
 *
 *   ╱  ╲  (diagonals)   the ring (holomorphic) structure of one Hodge theater. Every vertex of the
 *                       log-theta-lattice is its own universe and gets its own angle.
 *   │  (verticals)      étale-like and vertically coric: Π_v, D-prime-strips (shared by a column).
 *   ─  (horizontals)    mono-analytic and horizontally coric: G_v ↷ O×μ, F⊢×μ (shared by a Θ-link).
 *   ┼  (grid)           bi-coric: the D⊢-prime-strip {G_v}, shared by every vertex.
 *   ·  (dots)           value groups O▶ and pilot objects.
 *   ┄  (broken lines)   something known only up to (Ind1), (Ind2), (Ind3).
 *
 * Every piece of geometry carries a chip with the toolkit's name of its data type (the species
 * ids of `iut species`, the C structs of src/iut.h). All numbers are read from the toolkit:
 *   · `iut walk --json`  the lattice, the universes, the prime-strips, pilots and log-shells,
 *   · `iut walk`         the copy ids of the alien-copies table and the procession table,
 *   · `iut species`      the species and the mutations between them.
 *
 * The drawing code runs inside Chromium so that text is measured by the engine that renders it
 * (the method of scripts/infographic/build.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs', 'hatched');
const BIN = path.join(SRC, 'iut');
if (!fs.existsSync(BIN)) { console.error('src/iut is not built: run `make -C src` first'); process.exit(1); }
const iut = args => execFileSync(BIN, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const fail = msg => { console.error(msg); process.exit(1); };

/* ------------------------------------------------------------------ data */
function gather() {
  const J = JSON.parse(iut(['walk', '--rows', '1', '--json']));
  const walk = iut(['walk', '--rows', '1']);
  const m1 = (re, s = walk) => { const m = s.match(re); if (!m) fail('walk: no match for ' + re); return m; };
  const d = J.data;
  const hts = J.HodgeTheaters.map(h => ({
    n: h.n, m: h.m, universe: h.universe, copy: h.copy, logIterate: h.logIterate,
    q: h.QPilot.logVolume, theta: h.ThetaPilot.logVolume, exps: h.ThetaPilot.exponents, shells: h.LogShell,
  }));
  const at = (n, m) => hts.find(h => h.n === n && h.m === m) || fail(`no Hodge theater at (${n},${m})`);
  const theta = J.links.find(k => k.species !== 'LogLink') || fail('no Θ-link');

  /* alien copies table: per valuation the copy ids on both sides */
  const alien = {};
  const tab = walk.slice(walk.indexOf('Mutually alien copies'), walk.indexOf('gluing data of'));
  let cur = null;
  for (const line of tab.split('\n')) {
    let m;
    if ((m = line.match(/^\s+(v\w+)\s+Π_v#(\d+)\s+Π_v#(\d+)/))) { cur = alien[m[1]] = { piDag: m[2], piDdag: m[3] }; }
    else if (cur && (m = line.match(/G_v#(\d+)\s+G_v#(\d+)/))) { cur.gDag = m[1]; cur.gDdag = m[2]; }
    else if (cur && (m = line.match(/O×μ#(\d+)\s+O×μ#(\d+)/))) { cur.uDag = m[1]; cur.uDdag = m[2]; }
  }
  if (!Object.keys(alien).length) fail('walk: alien copies table not found');

  /* procession table */
  const proc = [];
  const pt = walk.slice(walk.indexOf('Multiradial representation'));
  for (const line of pt.split('\n')) {
    const m = line.match(/^\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(-[\d.]+)\s*$/);
    if (m) proc.push({ j: +m[1], size: +m[2], perms: +m[3], hull: +m[4], shift: +m[5] });
  }
  if (proc.length !== d.LPm) fail(`procession: ${proc.length} rows, expected l± = ${d.LPm}`);
  const heur = m1(/hull enlargement ([\d.]+),\s+−\|log\(Θ\)\| \(leading-term heuristic\) = (-?[\d.]+)/, pt);
  const sum = m1(/= ([\d.]+)\s+≈ \(l²\/48\)\(6 log d\^K − log q\) = ([\d.]+)/, pt);
  const cth = m1(/= ([\d.e+]+)\s+→\s+C_Θ ≥ −1 (✓|✗)/, pt);
  const holds = /overall: inequality holds/.test(pt);

  /* species / mutations */
  const sp = iut(['species']);
  const species = [], mutations = [];
  let mode = 0;
  for (const line of sp.split('\n')) {
    if (/^\s+species \(C struct\)/.test(line)) { mode = 1; continue; }
    if (/^\s+mutation \(C function\)/.test(line)) { mode = 2; continue; }
    if (/mutation-history/.test(line)) { mode = 0; continue; }
    if (mode === 1) { const m = line.match(/^\s+(\w+)\s{2,}(.+?)\s{2,}(\[.+)$/); if (m) species.push({ id: m[1], notation: m[2].trim(), ref: m[3].trim() }); }
    if (mode === 2) { const m = line.match(/^\s+(\w+)\s+(.+?)\s+(\w+)\s+→\s+(\w+)\s+(yes|no)\s*$/); if (m) mutations.push({ id: m[1], notation: m[2].trim(), dom: m[3], cod: m[4], core: m[5] === 'yes' }); }
  }
  if (species.length < 10 || mutations.length < 8) fail('species table not parsed');

  return {
    name: d.name, curve: d.curve, l: d.l, lstar: d.LStar, lpm: d.LPm,
    logQ: d.logQ, absLogQ: d.AbsLogQ, logDK: d.K.logDifferentEstimate,
    V: d.VSet.map(v => ({ name: v.name, p: v.p, bad: v.inVBadMod, arch: v.kind !== 'VNon', ordQ: v.ordQ })),
    hts, dag: at(0, 0), ddag: at(1, 0), link: theta, alien, proc,
    hullEnl: +heur[1], thetaHeur: +heur[2], sumExact: +sum[1], sumLead: +sum[2], cTheta: cth[1], cThetaOk: cth[2] === '✓', holds,
    species, mutations,
  };
}

/* =================================================================== in the browser */
function buildAll(D) {
  const W = 1920, H = 1080;
  const INK = '#17171c', PAPER = '#fbfaf4', GREY = '#5d5d66', FAINT = '#a9a9b0';
  const SANS = 'Inter', MONO = 'JetBrains Mono', SYM = 'DejaVu Sans';
  const cv = document.createElement('canvas').getContext('2d');
  const measure = (s, font, size, weight) => { cv.font = `${weight || 400} ${size}px "${font}"`; return cv.measureText(s).width; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f = x => (Math.round(x * 100) / 100).toString();
  const fmt = (x, n = 4) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);

  /* the angle of the ring structure of the universe at (n,m): never 0 or 90, those are the corics */
  const angleOf = (n, m) => (n === 0 ? 45 + 20 * m : 135 - 20 * m);

  function plate(no, title, sub, body) {
    const out = [], defs = [], pats = {};
    const P = s => out.push(s);

    /* ---- patterns ---- */
    function lines(angle, gap = 7, sw = 1, dash = '') {
      const id = `h${Math.round(angle * 10)}_${Math.round(gap * 10)}_${Math.round(sw * 10)}${dash ? '_d' + dash.replace(/\W+/g, '-') : ''}`.replace('-', 'm');
      if (!pats[id]) {
        pats[id] = 1;
        const w = dash ? dash.split(/[ ,]+/).reduce((a, b) => a + +b, 0) * 3 : gap;
        defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${gap}" patternTransform="rotate(${-angle})"><line x1="0" y1="${gap / 2}" x2="${w}" y2="${gap / 2}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/></pattern>`);
      }
      return id;
    }
    function dots(gap = 8, r = 1.15) {
      const id = `d${Math.round(gap * 10)}_${Math.round(r * 100)}`;
      if (!pats[id]) { pats[id] = 1; defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${gap}" height="${gap}"><circle cx="${gap / 4}" cy="${gap / 4}" r="${r}" fill="${INK}"/><circle cx="${gap * 3 / 4}" cy="${gap * 3 / 4}" r="${r}" fill="${INK}"/></pattern>`); }
      return id;
    }
    /* a hatch is a list of pattern ids, drawn one over the other */
    const HT = {
      ring: (n, m, gap = 7) => [lines(angleOf(n, m), gap)],
      dag: () => [lines(45)], ddag: () => [lines(135)],
      etale: (gap = 6) => [lines(90, gap)],
      mono: (gap = 6) => [lines(0, gap)],
      bicoric: (gap = 8) => [lines(0, gap), lines(90, gap)],
      value: (gap = 8) => [dots(gap)],
      indet: (angle = 45, gap = 7) => [lines(angle, gap, 1, '5 4')],
      clash: () => [lines(45, 5), lines(135, 5)],
      none: () => [],
    };
    /* shape: paper, then each pattern, then the outline */
    function shape(d, hatch, o = {}) {
      if (!o.noPaper) P(`<path d="${d}" fill="${PAPER}"/>`);
      for (const id of hatch || []) P(`<path d="${d}" fill="url(#${id})"/>`);
      if (o.sw !== 0) P(`<path d="${d}" fill="none" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.8}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
    }
    const rectD = (x, y, w, h, r = 0) => r ? `M${f(x + r)},${f(y)}h${f(w - 2 * r)}a${r},${r} 0 0 1 ${r},${r}v${f(h - 2 * r)}a${r},${r} 0 0 1 ${-r},${r}h${f(-(w - 2 * r))}a${r},${r} 0 0 1 ${-r},${-r}v${f(-(h - 2 * r))}a${r},${r} 0 0 1 ${r},${-r}z` : `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
    const circD = (cx, cy, r) => `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0z`;
    const polyD = pts => 'M' + pts.map(p => `${f(p[0])},${f(p[1])}`).join('L') + 'z';
    const rect = (x, y, w, h, hatch, o = {}) => shape(rectD(x, y, w, h, o.r || 0), hatch, o);
    const circle = (cx, cy, r, hatch, o) => shape(circD(cx, cy, r), hatch, o);
    const poly = (pts, hatch, o) => shape(polyD(pts), hatch, o);
    /* frame: a band of width t around a rectangle */
    const frame = (x, y, w, h, t, hatch, o = {}) => {
      const d = rectD(x, y, w, h) + ' ' + `M${f(x + t)},${f(y + t)}v${f(h - 2 * t)}h${f(w - 2 * t)}v${f(-(h - 2 * t))}z`;
      P(`<path d="${d}" fill="${PAPER}" fill-rule="evenodd"/>`);
      for (const id of hatch) P(`<path d="${d}" fill="url(#${id})" fill-rule="evenodd"/>`);
      P(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${o.sw || 1.8}"/>`);
    };
    const annulusD = (cx, cy, r1, r0) => circD(cx, cy, r1) + ' ' + `M${f(cx - r0)},${f(cy)}a${f(r0)},${f(r0)} 0 1 1 ${f(2 * r0)},0a${f(r0)},${f(r0)} 0 1 1 ${f(-2 * r0)},0z`;
    const annulus = (cx, cy, r1, r0, hatch, o = {}) => {
      const d = annulusD(cx, cy, r1, r0);
      P(`<path d="${d}" fill="${PAPER}"/>`);
      for (const id of hatch) P(`<path d="${d}" fill="url(#${id})"/>`);
      P(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${o.sw || 1.8}"/>`);
    };
    const sectorD = (cx, cy, r0, r1, a0, a1) => {
      const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
      const big = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      return `M${f(x0)},${f(y0)}A${f(r1)},${f(r1)} 0 ${big} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}` + (r0 > 0 ? `A${f(r0)},${f(r0)} 0 ${big} 0 ${f(x3)},${f(y3)}` : '') + 'z';
    };
    const sector = (cx, cy, r0, r1, a0, a1, hatch, o) => shape(sectorD(cx, cy, r0, r1, a0, a1), hatch, o);

    /* ---- lines and arrows ---- */
    defs.push(`<marker id="ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0,0.8L9,5L0,9.2L2.4,5z" fill="${INK}"/></marker>`);
    defs.push(`<marker id="ahg" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0,0.8L9,5L0,9.2L2.4,5z" fill="${GREY}"/></marker>`);
    const line = (x1, y1, x2, y2, o = {}) => P(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.stroke === GREY ? 'ahg' : 'ah'})"` : ''}${o.arrow2 ? ` marker-start="url(#ah)"` : ''} stroke-linecap="${o.cap || 'butt'}"/>`);
    const pathL = (d, o = {}) => P(`<path d="${d}" fill="none" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.stroke === GREY ? 'ahg' : 'ah'})"` : ''}${o.arrow2 ? ` marker-start="url(#ah)"` : ''} stroke-linejoin="round"/>`);
    const arrow = (x1, y1, x2, y2, o = {}) => line(x1, y1, x2, y2, Object.assign({ arrow: true, sw: 1.6 }, o));
    /* a double-line arrow: paper core between two ink edges */
    const dbl = (x1, y1, x2, y2) => { line(x1, y1, x2, y2, { sw: 5.2 }); line(x1, y1, x2, y2, { sw: 2.4, stroke: PAPER }); };
    /* leader: a thin grey line from a label to a dot on the thing */
    const leader = (x1, y1, x2, y2) => { line(x1, y1, x2, y2, { sw: 0.9, stroke: GREY }); P(`<circle cx="${f(x2)}" cy="${f(y2)}" r="2.6" fill="${INK}"/>`); };

    /* ---- text ---- */
    function text(x, y, s, o = {}) {
      const font = o.font || SANS, size = o.size || 14, weight = o.weight || 400, anchor = o.anchor || 'start';
      const halo = o.halo === false ? '' : ` stroke="${PAPER}" stroke-width="${o.haloW || 4}" stroke-linejoin="round" paint-order="stroke"`;
      P(`<text xml:space="preserve" x="${f(x)}" y="${f(y)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${o.fill || INK}" text-anchor="${anchor}"${o.italic ? ' font-style="italic"' : ''}${halo}${o.rot ? ` transform="rotate(${o.rot} ${f(x)} ${f(y)})"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`);
      return measure(s, font, size, weight);
    }
    function wrap(x, y, width, s, o = {}) {
      const size = o.size || 13, lh = o.lh || Math.round(size * 1.42);
      let cur = '', yy = y;
      for (const w of String(s).split(/\s+/)) {
        const t = cur ? cur + ' ' + w : w;
        if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, Object.assign({}, o, { size })); yy += lh; cur = w; } else cur = t;
      }
      if (cur) { text(x, yy, cur, Object.assign({}, o, { size })); yy += lh; }
      return yy;
    }
    /* chip: the data type name, monospace in a ruled box */
    const CH = 18;
    const chipW = (s, size = 11) => Math.ceil(measure(s, MONO, size, 500)) + 14;
    function chip(x, y, s, o = {}) {
      const size = o.size || 11, w = chipW(s, size), h = o.h || CH;
      const x0 = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x;
      P(`<rect x="${f(x0)}" y="${f(y)}" width="${w}" height="${h}" fill="${PAPER}" stroke="${INK}" stroke-width="0.9"/>`);
      P(`<text x="${f(x0 + 7)}" y="${f(y + h / 2 + size * 0.36)}" font-family="${MONO}" font-size="${size}" font-weight="500" fill="${INK}">${esc(s)}</text>`);
      return w;
    }
    /* label: notation line, then the type chip, then a small note. Returns the y below it. */
    function label(x, y, o) {
      const anchor = o.anchor || 'start';
      let yy = y;
      if (o.n) { text(x, yy, o.n, { font: SYM, size: o.size || 16, weight: 700, anchor }); yy += 7; } else yy -= 12;
      if (o.t) { for (const t of [].concat(o.t)) { chip(x, yy, t, { anchor }); yy += CH + 3; } }
      if (o.s) { for (const s of [].concat(o.s)) { yy += 11; text(x, yy, s, { font: SYM, size: 11.5, fill: GREY, anchor }); yy += 4; } }
      return yy;
    }
    /* plaque: a paper box laid over a hatched region so that text on it stays readable */
    function plaque(x, y, o) {
      const pad = 8, anchor = o.anchor || 'start';
      const rows = [];
      if (o.n) rows.push({ k: 'n', s: o.n, w: measure(o.n, SYM, o.size || 15, 700), h: 20 });
      for (const t of [].concat(o.t || [])) rows.push({ k: 't', s: t, w: chipW(t), h: CH + 4 });
      for (const s of [].concat(o.s || [])) rows.push({ k: 's', s, w: measure(s, SYM, 11.5), h: 16 });
      const w = Math.max(...rows.map(r => r.w)) + 2 * pad, h = rows.reduce((a, r) => a + r.h, 0) + 2 * pad - 2;
      const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      P(`<rect x="${f(x0)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${PAPER}" stroke="${INK}" stroke-width="1.1"/>`);
      let yy = y + pad;
      for (const r of rows) {
        if (r.k === 'n') text(x0 + pad, yy + 14, r.s, { font: SYM, size: o.size || 15, weight: 700, halo: false });
        if (r.k === 't') chip(x0 + pad, yy, r.s);
        if (r.k === 's') text(x0 + pad, yy + 11, r.s, { font: SYM, size: 11.5, fill: GREY, halo: false });
        yy += r.h;
      }
      return { x: x0, y, w, h };
    }
    /* a numbered step marker */
    const step = (x, y, n) => { P(`<circle cx="${f(x)}" cy="${f(y)}" r="12" fill="${INK}"/>`); P(`<text x="${f(x)}" y="${f(y + 4.6)}" font-family="${SANS}" font-size="13" font-weight="700" fill="${PAPER}" text-anchor="middle">${n}</text>`); };
    /* an eye: the observer */
    function eye(x, y, dir = -1, s = 1) {
      const w = 30 * s, h = 13 * s;
      P(`<path d="M${f(x - w)},${f(y)}Q${f(x)},${f(y - 2.2 * h)} ${f(x + w)},${f(y)}Q${f(x)},${f(y + 2.2 * h)} ${f(x - w)},${f(y)}z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`);
      P(`<circle cx="${f(x + dir * 9 * s)}" cy="${f(y)}" r="${f(9.5 * s)}" fill="${PAPER}" stroke="${INK}" stroke-width="1.8"/>`);
      P(`<circle cx="${f(x + dir * 11 * s)}" cy="${f(y)}" r="${f(4.4 * s)}" fill="${INK}"/>`);
    }

    const K = { P, lines, dots, HT, shape, rectD, circD, polyD, rect, circle, poly, frame, annulus, annulusD, sector, sectorD, line, pathL, arrow, dbl, leader, text, wrap, chip, chipW, label, plaque, step, eye, measure };

    /* ---- sheet: border, title block, key ---- */
    P(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`);
    P(`<rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="none" stroke="${INK}" stroke-width="2.4"/>`);
    P(`<rect x="27" y="27" width="${W - 54}" height="${H - 54}" fill="none" stroke="${INK}" stroke-width="0.8"/>`);
    text(52, 62, `PLATE ${no} / 6`, { font: MONO, size: 12, weight: 500, ls: 1.5 });
    text(52, 98, title, { size: 30, weight: 700 });
    wrap(52, 124, 1240, sub, { size: 14.5, fill: GREY, lh: 20 });
    /* title block, top right */
    const tb = [`example   ${D.name}`, `curve     ${D.curve}`, `l = ${D.l}   l* = ${D.lstar}   l± = ${D.lpm}   |V| = ${D.V.length}`];
    P(`<rect x="1508" y="44" width="368" height="78" fill="none" stroke="${INK}" stroke-width="1"/>`);
    tb.forEach((s, i) => text(1520, 66 + i * 21, s, { font: MONO, size: 11.5, halo: false }));

    body(K);

    /* the key to the line patterns, along the bottom */
    const KY = 968, items = [
      [HT.dag(), 'ring structure of †', `one universe · (0,0) · #${D.dag.universe}`],
      [HT.ddag(), 'ring structure of ‡', `another universe · (1,0) · #${D.ddag.universe}`],
      [HT.etale(), 'étale-like', 'vertically coric: Π_v, D'],
      [HT.mono(), 'mono-analytic', 'horizontally coric: G_v ↷ O×μ'],
      [HT.bicoric(), 'bi-coric', 'D⊢ = {G_v}, shared by all'],
      [HT.value(), 'value group', 'O▶, pilot objects'],
      [HT.indet(), 'indeterminate', 'up to (Ind1) (Ind2) (Ind3)'],
      [HT.none(), 'species', 'outline only: a type, not a set'],
    ];
    line(40, KY - 16, W - 40, KY - 16, { sw: 0.8 });
    const IW = (W - 96) / items.length;
    items.forEach((it, i) => {
      const x = 52 + i * IW;
      rect(x, KY, 54, 54, it[0], { sw: 1.4 });
      text(x + 64, KY + 22, it[1], { size: 13, weight: 600, font: SYM });
      text(x + 64, KY + 41, it[2], { size: 10.8, fill: GREY, font: SYM });
    });
    text(52, KY + 78, 'Every chip names a data type of the toolkit (species ids of `iut species`, C structs of src/iut.h). All numbers are read from `iut walk`.', { size: 11, fill: GREY });
    text(W - 52, KY + 78, 'scripts/infographic/hatched.js', { font: MONO, size: 10.5, fill: GREY, anchor: 'end' });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">\n<defs>${defs.join('')}</defs>\n${out.join('\n')}\n</svg>\n`;
  }

  const plates = [];
  const uni = h => `universe #${h.universe}`;
  const vBad = D.V.find(v => v.bad) || D.V[0];
  const al = D.alien[vBad.name];
  const linkNote = D.link.notation;

  /* ============================================================ PLATE 1 */
  plates.push({ name: '01-theta-wall', svg: plate(1, 'Two theaters and the wall between them',
    `The ${linkNote} glues †HT to ‡HT along one prime-strip only. An observer in ‡ looks back at †: the horizontal lines run straight through the wall, the diagonals of † stop at it, and the dots come out rescaled.`,
    K => {
      const { P, HT, rect, frame, line, arrow, text, chip, label, plaque, eye, leader, poly, wrap, pathL } = K;
      const TY = 168, TH = 752, LX = 60, LW = 760, RX = 1100, RW = 760, WX = 884, WW = 152;
      /* the two theaters: a frame hatched in the angle of its ring structure */
      frame(LX, TY, LW, TH, 20, HT.dag());
      frame(RX, TY, RW, TH, 20, HT.ddag());
      text(LX + 40, TY + 52, '†HT', { font: SYM, size: 24, weight: 700 });
      text(LX + 100, TY + 52, `at (0,0) · ${uni(D.dag)} · domain of the link`, { font: SYM, size: 13, fill: GREY });
      chip(LX + 40, TY + 62, 'ThetaPmEllNFHodgeTheater');
      chip(LX + 40 + K.chipW('ThetaPmEllNFHodgeTheater') + 6, TY + 62, 'iut_hodge_theater');
      text(RX + RW - 40, TY + 52, '‡HT', { font: SYM, size: 24, weight: 700, anchor: 'end' });
      text(RX + RW - 100, TY + 52, `codomain of the link · ${uni(D.ddag)} · at (1,0)`, { font: SYM, size: 13, fill: GREY, anchor: 'end' });
      chip(RX + RW - 40, TY + 62, 'ThetaPmEllNFHodgeTheater', { anchor: 'end' });

      /* the glued prime-strips: one cell per valuation */
      const SY = TY + 112, CW = 62, CHh = 44;
      const strip = (x0, hatchPi, nameN, nameT, tag, side) => {
        D.V.forEach((v, i) => {
          const x = x0 + i * CW;
          rect(x, SY, CW, CHh, HT.mono(5), { sw: v.name === vBad.name ? 3 : 1.4 });
          text(x + CW / 2, SY + CHh / 2 + 5, v.name, { font: MONO, size: 12, weight: 600, anchor: 'middle', haloW: 7 });
        });
        const lx = side < 0 ? x0 + D.V.length * CW + 14 : x0 - 14, an = side < 0 ? 'start' : 'end';
        text(lx, SY + 14, nameN, { font: SYM, size: 15, weight: 700, anchor: an });
        chip(lx, SY + 22, nameT, { anchor: an });
        text(lx, SY + 58, tag, { font: SYM, size: 11.5, fill: GREY, anchor: an });
      };
      const sxL = LX + 40, sxR = RX + RW - 40 - D.V.length * CW;
      strip(sxL, null, '†F⊩▶×μ_LGP', 'FMonoGlobValUnitsModTorsPrimeStrip', `'LGPTorsor' · iut_prime_strip · one cell per v ∈ V`, -1);
      strip(sxR, null, '‡F⊩▶×μ_Δ', 'FMonoGlobValUnitsModTorsPrimeStrip', `'Triangle' · iut_prime_strip · one cell per v ∈ V`, 1);

      /* zoom on one bad valuation */
      const vi = D.V.findIndex(v => v.name === vBad.name);
      const BX0 = LX + 44, BX1 = RX + RW - 156, BY = TY + 222;
      const zl = (x0, xa, xb) => { line(x0 + vi * CW, SY + CHh, xa, BY - 8, { sw: 0.9, stroke: GREY, dash: '3 3' }); line(x0 + (vi + 1) * CW, SY + CHh, xb, BY - 8, { sw: 0.9, stroke: GREY, dash: '3 3' }); };
      zl(sxL, BX0, LX + LW - 44); zl(sxR, RX + 44, BX1);
      text(LX + LW / 2, BY - 14, `the local datum at ${vBad.name} (p = ${vBad.p}, bad multiplicative) · iut_local_datum`, { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });
      text(RX + RW / 2 - 40, BY - 14, `the local datum at ${vBad.name} · iut_local_datum`, { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });

      /* the wall */
      const PIh = 104, Gy = BY + PIh + 22, Gh = 78, Uy = Gy + Gh + 10, Uh = 78, Vy = Uy + Uh + 26, Vh = 178;
      rect(WX, TY - 14, WW, TH + 28, HT.clash(), { sw: 2.2 });
      plaque(WX + WW / 2, TY - 2, { n: linkNote, t: ['ThetaUnitsModTorsLGPTorsorLink', 'iut_link'], anchor: 'middle', size: 15 });

      /* band Π_v: holomorphic, stops at the wall on both sides */
      rect(BX0, BY, WX - BX0, PIh, HT.dag(), {});
      rect(WX + WW, BY, BX1 - WX - WW, PIh, HT.ddag(), {});
      line(WX, BY - 6, WX, BY + PIh + 6, { sw: 6 }); line(WX + WW, BY - 6, WX + WW, BY + PIh + 6, { sw: 6 });
      plaque(BX0 + 16, BY + 16, { n: `†Π_v  #${al.piDag}`, t: 'iut_local_datum.Pi_copy', s: 'holomorphic · carries the ring structure of †' });
      plaque(BX1 - 16, BY + 16, { n: `‡Π_v  #${al.piDdag}`, t: 'iut_local_datum.Pi_copy', s: 'holomorphic · carries the ring structure of ‡', anchor: 'end' });
      plaque(WX + WW / 2, BY + 26, { n: '✕  alien', s: ['Π_v not identified', 'rings not identified'], anchor: 'middle', size: 14 });

      /* bands G_v and O×μ: one piece, straight through the slot */
      rect(BX0, Gy, BX1 - BX0, Gh, HT.mono(6), {});
      rect(BX0, Uy, BX1 - BX0, Uh, HT.mono(3.5), {});
      plaque(BX0 + 16, Gy + 12, { n: `G_v  #${al.gDag}`, t: 'iut_local_datum.G_copy', s: 'the same copy on both sides' });
      plaque(BX1 - 16, Gy + 12, { n: `G_v  #${al.gDdag}`, t: 'iut_local_datum.G_copy', anchor: 'end', s: 'the same copy on both sides' });
      plaque(WX + WW / 2, Gy + 10, { n: '(aΘ)  ≅', s: ['up to Aut(G_v)', '(Ind1)'], anchor: 'middle', size: 14 });
      plaque(BX0 + 16, Uy + 12, { n: `O×μ  #${al.uDag}`, t: 'iut_local_datum.units_copy', s: 'units modulo torsion · ×μ-Kummer' });
      plaque(BX1 - 16, Uy + 12, { n: `O×μ  #${al.uDdag}`, t: 'iut_local_datum.units_copy', anchor: 'end', s: 'units modulo torsion · ×μ-Kummer' });
      plaque(WX + WW / 2, Uy + 10, { n: '(aΘ)  ≅', s: ['up to Ism', '(Ind2)'], anchor: 'middle', size: 14 });

      /* band O▶: the value group, dilated by the lens in the wall */
      rect(BX0, Vy, WX - BX0, Vh, HT.value(), {});
      rect(WX + WW, Vy, BX1 - WX - WW, Vh, HT.value(), {});
      const ex = D.dag.exps, emax = ex[ex.length - 1], bw = 40, bx0 = WX - 30 - ex.length * (bw + 12);
      const base = Vy + Vh - 30, sc = (Vh - 62) / emax;
      const tops = [];
      ex.forEach((e, i) => {
        const x = bx0 + i * (bw + 12), h = Math.max(4, e * sc);
        rect(x, base - h, bw, h, [K.lines(90, 4)], { sw: 1.6 });
        text(x + bw / 2, base + 16, `q̲^${e}`, { font: SYM, size: 11.5, anchor: 'middle', weight: 600 });
        tops.push([x + bw, base - h / 2]);
      });
      const qx = WX + WW + 36, qh = Math.max(4, ex[0] * sc);
      rect(qx, base - qh, bw, qh, [K.lines(90, 4)], { sw: 1.6 });
      text(qx + bw / 2, base + 16, 'q̲^1', { font: SYM, size: 11.5, anchor: 'middle', weight: 600 });
      /* the lens */
      const ly = Vy + Vh / 2;
      poly([[WX, Vy + 8], [WX + WW, ly - 14], [WX + WW, ly + 14], [WX, Vy + Vh - 8]], [], { sw: 2 });
      tops.forEach(t => { line(t[0], t[1], WX, t[1], { sw: 0.9 }); line(WX, t[1], WX + WW, ly + (t[1] - ly) * 0.12, { sw: 0.9 }); });
      arrow(WX + WW, ly, qx - 4, base - qh / 2, { sw: 1.2 });
      plaque(BX0 + 16, Vy + 14, { n: '†Θ-pilot  {q̲^(j²)}, j = 1…' + D.lstar, t: ['ThetaPilot', 'iut_pilot'], s: [`value group O▶ of †F⊩▶×μ_LGP`, `arithmetic degree ${fmt(D.dag.theta)}`] });
      plaque(BX1 - 16, Vy + 14, { n: '‡q-pilot  {q̲}', t: ['QPilot', 'iut_pilot'], s: [`value group O▶ of ‡F⊩▶×μ_Δ`, `arithmetic degree ${fmt(D.ddag.q)}`], anchor: 'end' });
      plaque(WX + WW / 2, Vy + Vh + 4, { n: `(bΘ)  ÷ ${D.link.dilation.toFixed(3)}`, s: 'dilation l(l+1)/12', anchor: 'middle', size: 13.5 });

      /* the observer */
      const ex0 = RX + RW - 92, ey = Uy - 5;
      eye(ex0, ey, -1, 1.25);
      line(ex0 - 40, ey, BX1 + 4, ey, { sw: 1.2, dash: '6 4' });
      text(ex0, ey + 44, 'observer', { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      text(ex0, ey + 59, 'in ‡', { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      wrap(RX + RW - 142, ey + 84, 104, 'sees † only along the horizontals', { font: SYM, size: 11, fill: GREY, lh: 14 });
    }) });

  /* ============================================================ PLATE 2 */
  plates.push({ name: '02-inside-one-theater', svg: plate(2, 'Inside one theater: the additive eye and the multiplicative eye',
    `One Θ±ell NF-Hodge theater is two species glued along their labels. The Θ±ell side sees a label t with its sign and turns the labels by addition; the ΘNF side sees only j = |t| and turns them by multiplication. Neither symmetry is visible from the other side.`,
    K => {
      const { P, HT, rect, frame, line, arrow, text, chip, label, plaque, eye, sector, circle, pathL, wrap, dbl, lines } = K;
      const l = D.l, ls = D.lstar;
      frame(60, 168, 1800, 752, 14, HT.dag());
      text(960, 210, '†HT  =  Θ±ell-Hodge theater   ⊔   ΘNF-Hodge theater', { font: SYM, size: 19, weight: 700, anchor: 'middle' });
      chip(960, 220, 'ThetaPmEllNFHodgeTheater', { anchor: 'middle' });
      text(960, 258, `at (0,0) · ${uni(D.dag)} · every strip here lies in the ring structure of †: hatched near 45°, tilted by the sign of its label`, { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });

      const CY = 560, R0 = 104, R1 = 170, RC = 78;
      const hp = [lines(60, 6)], hm = [lines(30, 6)], hboth = [lines(60, 6), lines(30, 6)];
      const lab = (cx, cy, r, a, s, o = {}) => text(cx + r * Math.cos(a), cy + r * Math.sin(a) + 5, s, Object.assign({ font: MONO, size: 13, weight: 600, anchor: 'middle', haloW: 6 }, o));
      const arc = (cx, cy, r, a0, a1, o = {}) => { const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); pathL(`M${f(x0)},${f(y0)}A${r},${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${f(x1)},${f(y1)}`, Object.assign({ arrow: true, sw: 1.6 }, o)); };

      /* A: the capsule F_T, t ∈ F_l, as a ring of l sectors; t = 0 at the top */
      const AX = 400, da = 2 * Math.PI / l;
      for (let t = -ls; t <= ls; t++) {
        const a = -Math.PI / 2 + t * da;
        sector(AX, CY, R0, R1, a - da / 2, a + da / 2, t > 0 ? hp : t < 0 ? hm : [], { sw: t === 0 ? 3 : 1.6 });
        lab(AX, CY, (R0 + R1) / 2, a, (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t));
        line(AX + (RC + 2) * Math.cos(a), CY + (RC + 2) * Math.sin(a), AX + (R0 - 3) * Math.cos(a), CY + (R0 - 3) * Math.sin(a), { sw: 1, arrow2: true });
      }
      circle(AX, CY, RC, HT.etale(), {});
      plaque(AX, CY - 30, { n: 'D_⊚±', t: 'DPrimeStrip', s: `'CircDotPm' · Π_{X_K}`, anchor: 'middle' });
      line(AX, CY - R1 - 46, AX, CY + R1 + 22, { sw: 1, dash: '7 5', stroke: GREY });
      text(AX, CY - R1 - 52, 't ↦ −t', { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      arc(AX, CY, R1 + 16, -Math.PI / 2 + 0.25, -Math.PI / 2 + 1.25);
      text(AX + R1 + 6, CY - R1 + 30, 't ↦ t + 1', { font: SYM, size: 12, weight: 700 });
      label(90, 300, { n: 'Θ±ell-Hodge theater', t: ['ThetaPmEllHodgeTheater', 'iut_theta_pm_ell_hodge_theater'], s: ['symmetry F_l^{⋊±} = F_l ⋊ {±1}', 'additive · geometric'] });
      label(90, CY + R1 + 36, { n: `capsule F_T,  t ∈ F_l  (${l})`, t: 'iut_capsule_member', s: ['one F-prime-strip per sector,', 'each with its own basepoint'], size: 13 });
      text(AX + R0 + 4, CY + R0 + 62, 'Θell-bridge  D_T → D_⊚±', { font: SYM, size: 11.5, fill: GREY });
      K.leader(AX + R0 + 2, CY + R0 + 58, AX + (RC + 14) * Math.cos(1.0), CY + (RC + 14) * Math.sin(1.0));

      /* B: the fold |F_l| = {0..l*}: the half ring, each sector the two tilts at once */
      const BX = 860;
      for (let j = 0; j <= ls; j++) {
        const a = -Math.PI / 2 + j * da;
        sector(BX, CY, R0, R1, j === 0 ? a : a - da / 2, a + da / 2, j ? hboth : [], { sw: j === 0 ? 3 : 1.6 });
        lab(BX, CY, (R0 + R1) / 2, j === 0 ? a + da / 4 : a, String(j));
      }
      line(BX, CY - R1 - 46, BX, CY + R1 + 22, { sw: 1, dash: '7 5', stroke: GREY });
      text(BX + 8, CY - R1 - 52, 'the fold', { font: SYM, size: 12, weight: 700 });
      label(BX - 122, CY - 24, { n: '|F_l| = F_l / {±1}', s: [`= {0, 1, …, ${ls}}`, 'both tilts at once:', 'the sign is gone'], size: 14 });
      /* arrows A → B → C */
      arrow(AX + R1 + 40, CY, BX - 136, CY, { sw: 2 });
      text((AX + R1 + 40 + BX - 136) / 2, CY - 12, '±j ↦ j', { font: SYM, size: 15, weight: 700, anchor: 'middle' });
      chip((AX + R1 + 40 + BX - 136) / 2, CY + 10, 'MapLabels', { anchor: 'middle' });

      /* C: the capsule F_J, j ∈ F_l^*, as a ring in the order of the multiplicative action */
      const CX = 1330;
      let g = 2; const ordOf = u => { let x = u, k = 1; const seen = new Set(); while (!seen.has(x)) { seen.add(x); x = (x * u) % l; x = Math.min(x, l - x); k++; } return seen.size; };
      const norm = x => Math.min(((x % l) + l) % l, l - ((x % l) + l) % l);
      while (g < l && ordOf(norm(g)) !== ls) g++;
      const cyc = [1]; while (cyc.length < ls) cyc.push(norm(cyc[cyc.length - 1] * g));
      const dc = 2 * Math.PI / ls;
      cyc.forEach((j, i) => {
        const a = -Math.PI / 2 + i * dc;
        sector(CX, CY, R0, R1, a - dc / 2, a + dc / 2, hboth, {});
        lab(CX, CY, (R0 + R1) / 2, a, String(j), { size: 15 });
        line(CX + (RC + 2) * Math.cos(a), CY + (RC + 2) * Math.sin(a), CX + (R0 - 3) * Math.cos(a), CY + (R0 - 3) * Math.sin(a), { sw: 1, arrow2: true });
      });
      circle(CX, CY, RC, HT.dag(), {});
      plaque(CX, CY - 30, { n: 'F_⊛', t: 'FPrimeStrip', s: `'CircAst' · Π_{C_K} ↷ F_mod^×`, anchor: 'middle' });
      arc(CX, CY, R1 + 16, -Math.PI / 2 + 0.25, -Math.PI / 2 + 1.25);
      text(CX + R1 + 6, CY - R1 + 30, `j ↦ ${g}·j`, { font: SYM, size: 12, weight: 700 });
      text(CX + R1 + 6, CY - R1 + 46, `cycle (${cyc.join(' ')})`, { font: SYM, size: 11.5, fill: GREY });
      label(1560, 300, { n: 'ΘNF-Hodge theater', t: ['ThetaNFHodgeTheater', 'iut_theta_nf_hodge_theater'], s: ['symmetry F_l^* = F_l^× / {±1}', 'multiplicative · arithmetic'] });
      label(1545, 470, { n: `capsule F_J,  j ∈ F_l^*  (${ls})`, t: 'iut_capsule_member', s: ['NF-bridge  F_J → F_⊛', '(arrows into the centre)'], size: 13 });
      arrow(BX + R1 + 22, CY, CX - R1 - 14, CY, { sw: 2 });
      text((BX + R1 + CX - R1) / 2 + 4, CY - 12, 'F_l^× ↠ F_l^*', { font: SYM, size: 14, weight: 700, anchor: 'middle' });
      text((BX + R1 + CX - R1) / 2 + 4, CY + 22, '0 ↦ >', { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });

      /* the bottom: the targets of the Θ±-bridge and the Θ-bridge, identified */
      const BYy = 832, BH = 50;
      rect(AX - 150, BYy, 300, BH, HT.dag(), {});
      plaque(AX, BYy + 3, { n: 'F_⊞', t: 'FPrimeStrip', anchor: 'middle', size: 14 });
      arrow(AX, CY + R1 + 24, AX, BYy - 3, { sw: 1.6 });
      text(AX + 10, BYy - 30, 'Θ±-bridge  F_T → F_⊞', { font: SYM, size: 11.5, fill: GREY });
      rect(CX - 150, BYy, 300, BH, HT.dag(), {});
      plaque(CX, BYy + 3, { n: 'F_>', t: 'FPrimeStrip', anchor: 'middle', size: 14 });
      arrow(CX, CY + R1 + 4, CX, BYy - 3, { sw: 1.6 });
      text(CX + 10, BYy - 12, 'Θ-bridge  F_J → F_>', { font: SYM, size: 11.5, fill: GREY });
      dbl(AX + 150, BYy + BH / 2, CX - 150, BYy + BH / 2);
      plaque(BX + 20, BYy + 4, { n: 'gluing  0, ⊞ ↦ >', s: 'the two targets are identified', anchor: 'middle', size: 13.5 });

      /* the Θ-Hodge theater hanging off F_>: theta values at the labels j */
      const TX = 1560, TYY = 640, TW = 270, THh = 242;
      rect(TX, TYY, TW, THh, [], { sw: 1.4 });
      label(TX + 12, TYY + 22, { n: 'Θ-Hodge theater', t: ['ThetaHodgeTheater', 'iut_theta_hodge_theater'], s: 'Θ̲_v at the label j:  q̲^(j²)', size: 13 });
      const ex = D.dag.exps, bw = 26, sc = 96 / ex[ex.length - 1], bb = TYY + THh - 26;
      ex.forEach((e, i) => { const x = TX + 22 + i * (bw + 13); rect(x, bb - Math.max(3, e * sc), bw, Math.max(3, e * sc), HT.value(5), { sw: 1.4 }); text(x + bw / 2, bb + 15, String(e), { font: MONO, size: 11, anchor: 'middle' }); });
      line(CX + 150, BYy + BH / 2, TX, BYy + BH / 2, { sw: 1.2, arrow2: true });
      text(CX + 155, BYy + 16, 'F_> ⊇ F⊩_tht', { font: SYM, size: 10, fill: GREY });

      /* the two observers */
      eye(132, 452, 1, 1);
      wrap(84, 486, 118, 'additive eye: sees t with its sign; cannot see j ↦ ' + g + '·j', { font: SYM, size: 11, fill: GREY, lh: 14 });
      eye(1110, 400, -1, 1);
      wrap(1060, 346, 150, 'multiplicative eye: sees only |t|', { font: SYM, size: 11, fill: GREY, lh: 14 });
      line(1076, 402, BX + R1 + 6, 462, { sw: 1.1, dash: '6 4', arrow: true });
    }) });

  /* ============================================================ PLATE 3 */
  plates.push({ name: '03-log-link-column', svg: plate(3, 'Looking up a column: the log-link',
    `A column of the lattice is a stack of floors, each with its own ring structure. The log-link carries the units of one floor into the additive log-shell of the floor above, so ⊠ below becomes ⊞ above. Only the étale-like pillar Π_v stands unchanged through every floor.`,
    K => {
      const { P, HT, rect, line, arrow, text, chip, label, plaque, eye, circle, annulus, poly, wrap, pathL, lines, leader } = K;
      const X0 = 240, X1 = 960, SK = 110, FH = 150, floors = [1, 0, -1], FY = m => 250 + (1 - m) * 232;
      const v = vBad;
      /* the pillar, behind the floors */
      const PX = 356, PW = 66;
      rect(PX, 180, PW, 742, HT.etale(), { sw: 2 });
      floors.forEach(m => {
        const y = FY(m), h = D.hts.find(t => t.n === 0 && t.m === m);
        poly([[X0 + SK, y], [X1 + SK, y], [X1, y + FH], [X0, y + FH]], [lines(angleOf(0, m), 11)], { sw: 2 });
        /* the pillar passes through the floor */
        rect(PX, y - 26, PW, FH + 26 - 40, HT.etale(), { sw: 2 });
        text(X1 + SK + 14, y + 18, m === 0 ? '†HT' : 'HT', { font: SYM, size: 18, weight: 700 });
        text(X1 + SK + 14, y + 36, `(0,${m}) · ${uni(h)}`, { font: SYM, size: 12, fill: GREY });
        text(X1 + SK + 14, y + 52, `ring hatch ${angleOf(0, m)}°`, { font: SYM, size: 11.5, fill: GREY });
        /* units: an annulus; log-shell: a disc with its integers inside */
        const ux = 560, uy = y + FH / 2 + 4, sx = 850, sy = y + FH / 2 + 2;
        annulus(ux, uy, 52, 26, [lines(angleOf(0, m), 4)], {});
        text(ux, uy + 5, 'O×', { font: SYM, size: 14, weight: 700, anchor: 'middle' });
        circle(sx, sy, 62, [lines(angleOf(0, m), 6)], {});
        circle(sx, sy, 30, [lines(angleOf(0, m), 3)], { sw: 1.4 });
        text(sx, sy + 5, 'O', { font: SYM, size: 13, weight: 700, anchor: 'middle' });
        text(sx + 40, sy - 44, 'I_v', { font: SYM, size: 14, weight: 700 });
        /* Kummer: the floor's own monoid acts on its log-shell */
        arrow(ux + 58, uy, sx - 68, sy, { sw: 1.4 });
        text((ux + sx) / 2 - 4, uy - 9, 'Kummer', { font: SYM, size: 11.5, weight: 700, anchor: 'middle' });
        /* the compass of the two dimensions of the ring: turned by a quarter on each floor */
        const cx = 1112, cy = y + 112, r = 24, up = (m % 2 + 2) % 2 === 0;
        line(cx - r, cy, cx + r, cy, { sw: 1.6, arrow: true }); line(cx, cy + r, cx, cy - r, { sw: 1.6, arrow: true });
        text(cx + r + 6, cy + 5, up ? '⊞' : '⊠', { font: SYM, size: 16, weight: 700 });
        text(cx, cy - r - 6, up ? '⊠' : '⊞', { font: SYM, size: 16, weight: 700, anchor: 'middle' });
      });
      /* log-links: units of floor m → log-shell of floor m+1 */
      [0, -1].forEach(m => {
        const y0 = FY(m) + FH / 2 + 4, y1 = FY(m + 1) + FH / 2 + 2;
        pathL(`M${560 + 30},${f(y0 - 46)}C${650},${f(y0 - 130)} ${740},${f(y1 + 130)} ${850 - 40},${f(y1 + 52)}`, { sw: 2.2, arrow: true });
        plaque(690, (y0 + y1) / 2 - 22, { n: 'log-link', t: 'LogLink', s: 'log_v : O× → I_v', anchor: 'middle', size: 13.5 });
      });
      plaque(PX + PW + 14, 166, { n: 'D-prime-strip', t: 'DPrimeStrip', s: ['Π_v · vertically coric', 'the same on every floor'], size: 13.5 });
      /* the observer on † looking down */
      const m0y = FY(0);
      eye(480, m0y + 36, 1, 0.9);
      line(496, m0y + 52, 546, FY(-1) + 34, { sw: 1.1, dash: '6 4', arrow: true });
      wrap(56, m0y + 30, 176, 'observer on †: sees Π_v of the floor below as its own; sees the units of the floor below only as log(O×) inside its own log-shell I_v', { font: SYM, size: 11.5, fill: GREY, lh: 15 });
      wrap(56, FY(1) + 40, 176, 'no floor sees the ring of another: each diagonal hatch stops at the edge of its floor', { font: SYM, size: 11.5, fill: GREY, lh: 15 });
      wrap(56, FY(-1) + 40, 176, '(Ind3) the log-shell is only an upper bound: it contains both O and log(O×), and the link does not commute with Kummer', { font: SYM, size: 11.5, fill: GREY, lh: 15 });

      /* right: the log-shells at (0,0), from the toolkit */
      const GX = 1250, GY = 196, GW = 206, GH = 262;
      text(GX, GY + 4, `The log-shells of †HT, one per v ∈ V`, { font: SYM, size: 16, weight: 700 });
      chip(GX, GY + 14, 'LogShell'); chip(GX + K.chipW('LogShell') + 6, GY + 14, 'iut_log_shell'); chip(GX + K.chipW('LogShell') + K.chipW('iut_log_shell') + 12, GY + 14, 'LogShellConstruction');
      text(GX, GY + 54, 'I_v = (p*)⁻¹ · log(O×_{K_v}) ⊇ O_v    inner disc: O_v    outer disc: I_v, radius grows with μ_log', { font: SYM, size: 11.5, fill: GREY });
      D.dag.shells.forEach((s, i) => {
        const vv = D.V.find(x => x.name === s.v), cx = GX + (i % 3) * GW + GW / 2 - 10, cy = GY + 80 + Math.floor(i / 3) * GH + 100;
        const r0 = vv.arch ? 22 : 34, r1 = vv.arch ? 22 * Math.PI : 34 * (1 + 0.62 * s.logVolume);
        circle(cx, cy, r1, [lines(45, 7)], {});
        circle(cx, cy, r0, [lines(45, 3.5)], { sw: 1.4 });
        text(cx - GW / 2 + 16, cy - 84, s.v, { font: MONO, size: 14, weight: 600 });
        const rad = s.radius === '0' ? 'O_v' : `p^(${s.radius.replace('-', '−')}) · O_v`;
        text(cx, cy + 100, vv.arch ? 'closed disc' : `p* = ${s.PStar}`, { font: SYM, size: 11.5, anchor: 'middle' });
        text(cx, cy + 116, vv.arch ? 'of radius π ⊆ C' : `I_v = ${rad}`, { font: SYM, size: 11.5, anchor: 'middle' });
        text(cx, cy + 132, vv.arch ? 'inner: the unit disc' : `μ_log(I_v) = ${fmt(s.logVolume)}`, { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });
      });
      wrap(GX, GY + 80 + 2 * GH + 40, 600, `These are the Frobenius-like, holomorphic log-shells of the floor (0,0): the codomain of the log-link from (0,−1). At a valuation of good reduction that is unramified the shell is O_v itself.`, { font: SYM, size: 11.5, fill: GREY, lh: 16 });
    }) });

  /* ============================================================ PLATE 4 */
  plates.push({ name: '04-etale-picture', svg: plate(4, 'The étale picture: looking through the core',
    `Forget the Frobenius-like part of every theater and what remains can be laid out as spokes around one shared core, the D⊢-prime-strip. The only line of sight from ‡ to † runs down a spoke, through the core and up another spoke, and what arrives is known only up to three indeterminacies.`,
    K => {
      const { P, HT, rect, line, arrow, text, chip, label, plaque, eye, circle, sector, wrap, pathL, lines, leader, dbl } = K;
      const CX = 640, CY = 534, RC = 104, RA = 150, RB = 236, RD = 342;
      const ang = (n, m) => (n === 0 ? Math.PI + m * 1.02 : -m * 1.02), half = 0.42;
      const pt = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
      D.hts.forEach(h => {
        const a = ang(h.n, h.m);
        sector(CX, CY, RB, RD, a - half, a + half, [lines(angleOf(h.n, h.m), 7)], {});
        sector(CX, CY, RA, RB, a - half, a + half, HT.etale(), {});
        const [x0, y0] = pt(RC + 3, a), [x1, y1] = pt(RA - 3, a);
        line(x1, y1, x0, y0, { sw: 1.8, arrow: true });
        const [lx, ly] = pt((RB + RD) / 2, a);
        const nm = h.n === 0 && h.m === 0 ? '†HT' : h.n === 1 && h.m === 0 ? '‡HT' : 'HT';
        plaque(lx, ly - 22, { n: `${nm} (${h.n},${h.m})`, s: `#${h.universe} · ${angleOf(h.n, h.m)}°`, anchor: 'middle', size: 13 });
      });
      circle(CX, CY, RC, HT.bicoric(), { sw: 2.4 });
      plaque(CX, CY - 40, { n: 'D⊢-prime-strip', t: ['DMonoPrimeStrip', 'iut_prime_strip'], s: '{G_v}, v ∈ V · bi-coric', anchor: 'middle', size: 14 });
      /* the line of sight ‡ → core → † */
      const [ex, ey] = pt(RD + 62, 0);
      eye(ex, ey, -1, 1.1);
      text(ex, ey + 40, 'observer in ‡', { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      const yo = 62;
      pathL(`M${f(ex - 36)},${f(ey - 8)}L${f(CX + RD)},${f(CY - yo)}L${f(CX + RC * 0.8)},${f(CY - yo)}`, { sw: 1.3, dash: '7 5' });
      pathL(`M${f(CX - RC * 0.8)},${f(CY - yo)}L${f(CX - RD - 30)},${f(CY - yo)}`, { sw: 1.3, dash: '7 5', arrow: true });
      text(CX - RD - 38, CY - yo + 4, 'into †', { font: SYM, size: 12, weight: 700, anchor: 'end' });
      /* labels on the left */
      label(52, 196, { n: 'outer band: the Frobenius-like part', t: 'ThetaPmEllNFHodgeTheater', s: ['hatched in the ring angle of its own universe;', 'no two bands share a ring structure'], size: 13.5 });
      leader(250, 262, ...pt(RD - 20, ang(0, 1) - 0.25));
      label(52, 840, { n: 'inner band: the étale-like part', t: ['DThetaPmEllNFHodgeTheater', 'ForgetToD'], s: 'a D-Θ±ell NF-Hodge theater: Π_v and labels only', size: 13.5 });
      leader(250, 826, ...pt(RA + 30, ang(0, -1) + 0.25));
      label(1004, 196, { n: 'arrows into the core', t: ['ForgetToDMono', 'KummerDetachment'], s: ['Π_v ↠ G_v: forget the', 'holomorphic structure'], size: 13.5 });
      leader(1000, 250, ...pt(RA - 20, ang(1, 1) + 0.06));
      pathL(`M${f(pt(RD + 20, Math.PI / 2 - 0.42)[0])},${f(pt(RD + 20, Math.PI / 2 - 0.42)[1])}A${RD + 20},${RD + 20} 0 0 1 ${f(pt(RD + 20, Math.PI / 2 + 0.42)[0])},${f(pt(RD + 20, Math.PI / 2 + 0.42)[1])}`, { sw: 1.4, arrow: true, arrow2: true });
      text(CX, CY + RD + 40, 'spokes may be permuted freely', { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      text(CX, CY + RD + 56, 'the core does not know which is which', { font: SYM, size: 11.5, fill: GREY, anchor: 'middle' });

      /* right: what arrives */
      const RX = 1190, RW = 670;
      text(RX, 196, 'What the observer in ‡ can rebuild of †', { font: SYM, size: 17, weight: 700 });
      chip(RX, 206, 'iut_indeterminacies'); chip(RX + K.chipW('iut_indeterminacies') + 6, 206, 'MultiradialRepresentation');
      const row = (y, n, t, lines2, draw) => {
        rect(RX, y, RW, 196, [], { sw: 1.2 });
        text(RX + 250, y + 34, n, { font: SYM, size: 16, weight: 700 });
        chip(RX + 250, y + 44, t);
        lines2.forEach((s, i) => text(RX + 250, y + 86 + i * 17, s, { font: SYM, size: 12, fill: GREY }));
        draw(RX + 120, y + 98);
      };
      row(250, '(Ind1)  which is which', 'iut_indeterminacies.ind1', ['automorphisms of the processions of', 'D⊢-prime-strips: permutations of the labels', `in S±_(j+1), up to (j+1)!, and Aut(G_v)`], (cx, cy) => {
        const w = 34, perm = [2, 0, 3, 1];
        [0, 1, 2, 3].forEach(i => { rect(cx - 2 * w + i * w, cy - 60, w, 30, HT.bicoric(6), { sw: 1.4 }); text(cx - 2 * w + i * w + w / 2, cy - 40, String(i), { font: MONO, size: 12, weight: 600, anchor: 'middle', haloW: 6 }); });
        perm.forEach((p, i) => { rect(cx - 2 * w + i * w, cy + 30, w, 30, HT.indet(45, 6), { sw: 1.4, dash: '5 3' }); text(cx - 2 * w + i * w + w / 2, cy + 50, String(p), { font: MONO, size: 12, weight: 600, anchor: 'middle', haloW: 6 }); line(cx - 2 * w + p * w + w / 2, cy - 30, cx - 2 * w + i * w + w / 2, cy + 30, { sw: 1 }); });
      });
      row(458, '(Ind2)  turned by how much', 'iut_indeterminacies.ind2', ['the units O×μ are shared only up to an', 'isometry (Ism): the horizontal lines arrive', 'turned by an unknown amount'], (cx, cy) => {
        circle(cx, cy, 70, HT.mono(6), {});
        [-22, 31].forEach(a => P(`<path d="${K.circD(cx, cy, 70)}" fill="url(#${lines(a, 12, 1, '5 4')})"/>`));
        circle(cx, cy, 70, [], { noPaper: true });
      });
      row(666, '(Ind3)  no more than this', 'iut_indeterminacies.ind3', ['upper semi-compatibility of the log-Kummer', 'correspondence: the region is only contained', 'in the log-shell, an upper bound'], (cx, cy) => {
        circle(cx, cy, 74, HT.indet(45, 7), { dash: '6 4' });
        circle(cx - 12, cy + 8, 34, HT.dag(), { sw: 1.4 });
        text(cx + 40, cy - 46, 'I_v', { font: SYM, size: 13, weight: 700 });
      });
    }) });

  /* ============================================================ PLATE 5 */
  plates.push({ name: '05-whole-process', svg: plate(5, 'The whole process: one pilot seen from the other side',
    `The infinite H, step by step. The Θ-pilot of † is the q-pilot of ‡ as far as the link can tell. Rebuilt inside one ring structure from the shared core, it becomes a region with fuzzy edges, and comparing log-volumes gives the inequality of Cor 3.12.`,
    K => {
      const { P, HT, rect, frame, line, arrow, text, chip, label, plaque, eye, circle, wrap, pathL, lines, step, dbl } = K;
      /* ---- left: the infinite H ---- */
      const TS = 112, colX = [96, 372], rowY = m => 480 - m * 190;
      text(52, 190, 'The log-theta-lattice', { font: SYM, size: 16, weight: 700 });
      chip(52, 200, 'iut_log_theta_lattice');
      D.hts.forEach(h => {
        const x = colX[h.n], y = rowY(h.m);
        frame(x, y, TS, TS, 16, [lines(angleOf(h.n, h.m), 6)]);
        const nm = h.n === 0 && h.m === 0 ? '†HT' : h.n === 1 && h.m === 0 ? '‡HT' : 'HT';
        text(x + TS / 2, y + TS / 2 - 4, nm, { font: SYM, size: 15, weight: 700, anchor: 'middle' });
        text(x + TS / 2, y + TS / 2 + 14, `(${h.n},${h.m})`, { font: MONO, size: 12, anchor: 'middle' });
        text(x + TS / 2, y + TS / 2 + 30, `#${h.universe}`, { font: MONO, size: 11, fill: GREY, anchor: 'middle' });
        if (h.m < 1) { arrow(x + TS / 2, y - 4, x + TS / 2, y - 190 + TS + 6, { sw: 1.8 }); text(x + TS / 2 + 8, y - 34, 'log', { font: SYM, size: 12, weight: 700 }); }
        line(x + TS / 2, rowY(1) - 8, x + TS / 2, rowY(1) - 40, { sw: 1.4, dash: '3 5' });
        line(x + TS / 2, rowY(-1) + TS + 8, x + TS / 2, rowY(-1) + TS + 36, { sw: 1.4, dash: '3 5' });
      });
      const ly = rowY(0) + TS / 2;
      dbl(colX[0] + TS + 4, ly, colX[1] - 14, ly); arrow(colX[1] - 16, ly, colX[1] - 4, ly, { sw: 0.1 });
      plaque((colX[0] + TS + colX[1]) / 2, ly - 78, { n: 'Θ-link', t: 'iut_link', anchor: 'middle', size: 13.5 });
      step(colX[1] + TS + 6, rowY(0) - 6, 1); step((colX[0] + TS + colX[1]) / 2, ly + 26, 2); step(colX[0] - 8, rowY(0) - 6, 3);
      /* the steps, as text under the H */
      const steps = [
        [1, `‡q-pilot`, 'QPilot', `log-volume ${fmt(D.ddag.q)} in ‡`],
        [2, `†Θ-pilot ↦ ‡q-pilot`, D.link.species, 'only F⊩▶×μ crosses'],
        [3, 'Kummer detachment, log-shells', 'KummerDetachment', 'up and down the column of †'],
      ];
      steps.forEach((s, i) => { const x = [52, 196, 412][i], y = 862; step(x + 12, y, s[0]); text(x + 30, y + 5, s[1], { font: SYM, size: 12.5, weight: 700 }); chip(x, y + 18, s[2], { size: 9.5 }); text(x, y + 54, s[3], { font: SYM, size: 11, fill: GREY }); });

      /* ---- middle: the procession of tensor packets ---- */
      const MX = 640, MY = 196, CS = 44, n = D.proc.length;
      text(MX, MY - 6, 'The procession: tensor packets of log-shells', { font: SYM, size: 16, weight: 700 });
      step(MX - 22, MY - 11, 4);
      chip(MX, MY + 4, 'TensorPacket'); chip(MX + K.chipW('TensorPacket') + 6, MY + 4, 'iut_procession_step'); chip(MX + K.chipW('TensorPacket') + K.chipW('iut_procession_step') + 12, MY + 4, 'TensorPacketConstruction');
      const baseY = MY + 76 + n * CS, colW = 86;
      D.proc.forEach((p, i) => {
        const x = MX + i * colW;
        for (let k = 0; k <= p.j; k++) {
          const y = baseY - (k + 1) * CS, top = k === p.j;
          rect(x, y, CS, CS, top ? HT.value(6) : HT.bicoric(7), { sw: top ? 2.2 : 1.3 });
          text(x + CS / 2, y + CS / 2 + 4, String(k), { font: MONO, size: 12, weight: 600, anchor: 'middle', haloW: 6 });
        }
        if (p.j > 0) text(x + CS + 4, baseY - p.j * CS - CS / 2 + 4, `q̲^${p.j * p.j}`, { font: SYM, size: 11, weight: 700 });
        text(x + CS / 2, baseY + 18, `S±_${p.size}`, { font: SYM, size: 12, weight: 700, anchor: 'middle' });
      });
      const tr = (y, name, vals, o = {}) => { text(MX - 14, y, name, Object.assign({ font: SYM, size: 11.5, anchor: 'end', fill: GREY }, o)); vals.forEach((s, i) => text(MX + i * colW + CS / 2, y, s, { font: MONO, size: 11.5, anchor: 'middle' })); };
      tr(baseY + 50, 'j', D.proc.map(p => String(p.j)));
      tr(baseY + 70, '(Ind1) (j+1)!', D.proc.map(p => String(p.perms)));
      tr(baseY + 90, 'hull (j+1)·log d^K', D.proc.map(p => p.hull.toFixed(2)));
      tr(baseY + 110, 'Θ-shift −(j²/2l)·log q', D.proc.map(p => fmt(p.shift, 2)));
      step(MX - 150, baseY + 66, 5);
      line(MX - 130, baseY + 30, MX + n * colW - 30, baseY + 30, { sw: 0.8 });
      /* the two bars per column */
      const hmax = Math.max(...D.proc.map(p => p.hull)), BY0 = baseY + 130, BH = 112, bsc = BH / hmax;
      D.proc.forEach((p, i) => {
        const x = MX + i * colW;
        rect(x, BY0 + BH - p.hull * bsc, 20, p.hull * bsc, HT.indet(45, 5), { sw: 1.3, dash: '5 3' });
        rect(x + 24, BY0 + BH - Math.max(1, -p.shift * bsc), 20, Math.max(1, -p.shift * bsc), HT.value(5), { sw: 1.3 });
      });
      line(MX - 10, BY0 + BH, MX + n * colW - 30, BY0 + BH, { sw: 1.2 });
      text(MX - 14, BY0 + BH - 30, 'hull (broken lines)', { font: SYM, size: 11.5, fill: GREY, anchor: 'end' });
      text(MX - 14, BY0 + BH - 14, 'Θ-shift (dots)', { font: SYM, size: 11.5, fill: GREY, anchor: 'end' });
      wrap(MX, MY + 46, 318, `Column j is the container S±_(j+1) = {0, …, j}: j + 1 copies of the mono-analytic log-shell, rebuilt from the core (grid). The top cell carries the theta value q̲^(j²) (dots). The label of each cell is known only up to (j+1)! permutations.`, { font: SYM, size: 11.5, fill: GREY, lh: 16 });

      /* ---- right: the comparison ---- */
      const QX = 1330, QW = 530;
      text(QX, 190, 'The comparison of log-volumes', { font: SYM, size: 16, weight: 700 });
      step(QX - 22, 185, 6);
      chip(QX, 200, 'MultiradialRepresentation'); chip(QX + K.chipW('MultiradialRepresentation') + 6, 200, 'iut_multiradial_rep'); chip(QX, 222, 'MultiradialAlgorithm');
      const ax0 = QX + 60, axW = QW - 100, lo = -5, hi = Math.max(40, D.thetaHeur * 1.15), X = v2 => ax0 + (v2 - lo) / (hi - lo) * axW;
      const ay = 440;
      line(ax0, ay, ax0 + axW, ay, { sw: 1.4 });
      for (let t = 0; t <= hi; t += 10) { line(X(t), ay - 5, X(t), ay + 5, { sw: 1.2 }); text(X(t), ay + 22, String(t), { font: MONO, size: 11, anchor: 'middle' }); }
      line(X(0), ay - 150, X(0), ay + 8, { sw: 1.2 });
      rect(X(0), ay - 128, X(D.thetaHeur) - X(0), 46, HT.indet(45, 6), { dash: '6 4' });
      rect(X(D.dag.q), ay - 62, X(0) - X(D.dag.q), 46, HT.value(5), {});
      text(X(D.thetaHeur) + 8, ay - 110, '−|log Θ|', { font: SYM, size: 13, weight: 700 });
      text(X(D.thetaHeur) + 8, ay - 94, fmt(D.thetaHeur), { font: MONO, size: 12 });
      text(X(0) + 10, ay - 42, '−|log q|', { font: SYM, size: 13, weight: 700 });
      text(X(0) + 10, ay - 26, fmt(D.dag.q), { font: MONO, size: 12 });
      text(ax0, ay + 44, 'log-volume, procession-normalized', { font: SYM, size: 11, fill: GREY });
      const yy0 = 520;
      rect(QX, yy0, QW, 150, [], { sw: 1.6 });
      step(QX + 22, yy0 + 26, 7);
      text(QX + 44, yy0 + 31, '−|log Θ|  ≥  −|log q|', { font: SYM, size: 17, weight: 700 });
      text(QX + 20, yy0 + 62, `${fmt(D.thetaHeur)}  ≥  ${fmt(D.dag.q)}    ${D.holds ? 'holds for this data' : 'FAILS for this data'}`, { font: MONO, size: 13, weight: 600 });
      text(QX + 20, yy0 + 86, `leading-term heuristic of the toolkit: hull enlargement ${D.hullEnl.toFixed(4)},`, { font: SYM, size: 11.5, fill: GREY });
      text(QX + 20, yy0 + 102, `Σ_j [(j+1)·log d^K − (j²/2l)·log q] = ${D.sumExact.toFixed(4)}, divided by l* = ${D.lstar}`, { font: SYM, size: 11.5, fill: GREY });
      text(QX + 20, yy0 + 130, `C_Θ = ${D.cTheta}   ${D.cThetaOk ? '≥ −1 ✓' : '< −1 ✗'}   ([IUTchIV] Thm 1.10)`, { font: MONO, size: 12 });
      eye(QX + 40, 740, 1, 1.1);
      wrap(QX + 90, 716, QW - 100, `The observer stays inside the ring structure of one theater the whole time. The q-pilot is measured there directly (dots). The Θ-pilot is rebuilt there from the shared core, so it is known only as a region (broken lines): its log-volume is an upper bound.`, { font: SYM, size: 11.5, fill: GREY, lh: 16 });
      wrap(QX, 836, QW, `Whether step 6 is a valid comparison is the disputed point of the theory ([IUTchIII] Cor 3.12). The plate draws what the toolkit computes, not a verdict.`, { font: SYM, size: 11.5, fill: GREY, lh: 16 });
    }) });

  /* ============================================================ PLATE 6 */
  plates.push({ name: '06-species-and-mutations', svg: plate(6, 'Species and mutations: what can be carried between universes',
    `A set lives in one universe and cannot be moved. A species is only a rule for building something, so it can be run in any universe; a mutation is a rule that turns one species into another. Below, an outline is a species, and the hatch that fills it is the universe it happens to be run in.`,
    K => {
      const { P, HT, rect, line, arrow, text, chip, label, plaque, eye, circle, wrap, pathL, lines, dbl } = K;
      /* ---- left: two universes, the same stencils ---- */
      const UW = 240, UH = 520, UY = 232, ux = [56, 56 + UW + 34];
      [[HT.dag, D.dag, '†', 45], [HT.ddag, D.ddag, '‡', 135]].forEach(([hf, h, nm, an], i) => {
        const x = ux[i];
        rect(x, UY, UW, UH, [lines(an, 13)], { sw: 2 });
        plaque(x + 10, UY + 10, { n: `universe #${h.universe}`, s: `the sets of ${nm}HT`, size: 13.5 });
        /* three stencils */
        const cx = x + UW / 2;
        rect(cx - 90, UY + 96, 180, 40, [lines(an, 4)], { sw: 2.6 });
        for (let k = 1; k < D.V.length; k++) line(cx - 90 + k * 30, UY + 96, cx - 90 + k * 30, UY + 136, { sw: 1.4 });
        circle(cx, UY + 250, 54, [lines(an, 4)], { sw: 2.6 });
        circle(cx, UY + 250, 24, [], { sw: 1.6 });
        rect(cx - 70, UY + 380, 140, 100, [lines(an, 4)], { sw: 2.6 });
        arrow(cx, UY + 140, cx, UY + 192, { sw: 1.8 }); arrow(cx, UY + 308, cx, UY + 376, { sw: 1.8 });
      });
      const mid = ux[0] + UW + 17;
      [[UY + 116, 'FPrimeStrip'], [UY + 250, 'LogShell'], [UY + 430, 'TensorPacket']].forEach(([y, t]) => chip(mid, y - 9, t, { anchor: 'middle' }));
      [[UY + 166, 'LogShellConstruction'], [UY + 342, 'TensorPacketConstruction']].forEach(([y, t]) => chip(mid, y - 9, t, { anchor: 'middle', size: 10 }));
      wrap(56, UY + UH + 28, 2 * UW + 34, 'Same outlines, same arrows, different lines inside. The outlines and arrows are all that can be compared between † and ‡.', { font: SYM, size: 11.5, fill: GREY, lh: 16 });
      text(56, 196, 'Two universes, one species', { font: SYM, size: 16, weight: 700 });
      chip(56, 206, 'iut_species'); chip(56 + K.chipW('iut_species') + 6, 206, 'iut_mutation');

      /* ---- right: the table of species and mutations as a graph ---- */
      const GX = 700;
      text(GX, 196, `The ${D.species.length} species and ${D.mutations.length} mutations of the toolkit`, { font: SYM, size: 16, weight: 700 });
      text(GX, 216, 'double arrow: a core mutation, the same seen from every universe · loop: a mutation from a species to itself', { font: SYM, size: 11.5, fill: GREY });
      const cols = [
        ['InitialThetaData', 'ThetaHodgeTheater', 'ThetaPmEllHodgeTheater', 'ThetaNFHodgeTheater', 'ThetaPmEllNFHodgeTheater', 'DThetaPmEllNFHodgeTheater'],
        ['FMonoGlobValUnitsModTorsPrimeStrip', 'FMonoValUnitsModTorsPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoGlobPrimeStrip', 'FMonoPrimeStrip', 'FPrimeStrip', 'DPrimeStrip', 'DMonoPrimeStrip'],
        ['MultiradialRepresentation', 'ThetaPilot', 'QPilot', 'LogShell', 'TensorPacket'],
      ];
      const known = new Set(cols.flat());
      D.species.forEach(s => { if (!known.has(s.id)) cols[2].unshift(s.id); });
      const BW = 246, BHh = 50, colx = [830, 1196, 1610], Y0 = 240, Y1 = 928;
      const pos = {};
      cols.forEach((c, ci) => c.forEach((id, i) => { const gap = (Y1 - Y0 - c.length * BHh) / c.length; pos[id] = { x: colx[ci], y: Y0 + gap / 2 + i * (BHh + gap), c: ci }; }));
      /* arrows first */
      const loops = {}, side = {};
      const labels = [];
      D.mutations.forEach(mu => {
        const a = pos[mu.dom], b = pos[mu.cod]; if (!a || !b) return;
        if (mu.dom === mu.cod) { (loops[mu.dom] = loops[mu.dom] || []).push(mu); return; }
        let x1, y1, x2, y2, lx, ly;
        if (a.c === b.c) {
          const k = (side[a.c] = (side[a.c] || 0) + 1), bulge = 26 + 20 * k, d = b.y > a.y ? 1 : -1;
          const sg = a.c === 2 ? -1 : 1;
          x1 = sg > 0 ? a.x + BW : a.x; y1 = a.y + BHh / 2 + d * 10; x2 = x1; y2 = b.y + BHh / 2 - d * 10;
          const dpath = `M${f(x1)},${f(y1)}C${f(x1 + sg * bulge * 1.4)},${f(y1)} ${f(x2 + sg * bulge * 1.4)},${f(y2)} ${f(x2 + sg * 3)},${f(y2)}`;
          if (mu.core) { pathL(dpath, { sw: 5.2 }); pathL(dpath, { sw: 2.4, stroke: PAPER }); pathL(dpath, { sw: 0.01, arrow: true }); } else pathL(dpath, { sw: 1.6, arrow: true });
          lx = sg > 0 ? x1 + bulge + 4 : x1 + 16; ly = sg > 0 ? y1 + (y2 - y1) * 0.78 : (y1 + y2) / 2;
          labels.push([lx, ly, mu, 'start']);
        } else {
          const right = b.c > a.c;
          x1 = right ? a.x + BW : a.x; x2 = right ? b.x - 3 : b.x + BW + 3; y1 = a.y + BHh / 2; y2 = b.y + BHh / 2;
          if (mu.core) { dbl(x1, y1, x2, y2); line(x1, y1, x2, y2, { sw: 0.01, arrow: true }); } else arrow(x1, y1, x2, y2);
          labels.push([x1 + (x2 - x1) * 0.5, y1 + (y2 - y1) * 0.5, mu, 'middle']);
        }
      });
      /* nodes */
      D.species.forEach(s => {
        const p = pos[s.id]; if (!p) return;
        rect(p.x, p.y, BW, BHh, [], { sw: 1.8 });
        text(p.x + 10, p.y + 20, s.notation, { font: SYM, size: K.measure(s.notation, SYM, 13, 700) > BW - 20 ? 11.5 : 13, weight: 700, halo: false });
        text(p.x + 10, p.y + 39, s.id, { font: MONO, size: 10.5, weight: 500, halo: false });
        const rw = K.measure(s.ref, SYM, 9.5);
        if (K.measure(s.id, MONO, 10.5, 500) + rw + 26 < BW) text(p.x + BW - 8, p.y + 39, s.ref, { font: SYM, size: 9.5, fill: GREY, anchor: 'end', halo: false });
        else if (K.measure(s.notation, SYM, 13, 700) + rw + 26 < BW) text(p.x + BW - 8, p.y + 20, s.ref, { font: SYM, size: 9.5, fill: GREY, anchor: 'end', halo: false });
        (loops[s.id] || []).forEach((mu, i) => {
          const y = p.y + 10 + i * 0, x = p.x;
          if (i === 0) pathL(`M${f(x)},${f(p.y + 14)}C${f(x - 44)},${f(p.y - 8)} ${f(x - 44)},${f(p.y + BHh + 8)} ${f(x - 3)},${f(p.y + BHh - 14)}`, { sw: 1.6, arrow: true });
          chip(x - 40, p.y + BHh / 2 - 9 + (i - ((loops[s.id].length - 1) / 2)) * 21, mu.id, { anchor: 'end', size: 9.5 });
        });
      });
      labels.forEach(([x, y, mu, an]) => chip(x, y - 9, mu.id, { anchor: an, size: 10 }));
    }) });
  return plates;
}

/* =================================================================== driver */
(async () => {
  const D = gather();
  const args = process.argv.slice(2);
  const svgOnly = args.includes('--svg-only');
  const only = args.includes('--only') ? +args[args.indexOf('--only') + 1] : 0;
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.setContent(`<html><body><div style="font-family:Inter">x</div><div style="font-family:Inter;font-weight:600">x</div><div style="font-family:Inter;font-weight:700">x</div>
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'JetBrains Mono';font-weight:500">x</div><div style="font-family:'JetBrains Mono';font-weight:600">x</div>
    <div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊</div><div style="font-family:'DejaVu Sans';font-weight:700">⊢⊩▶⊞⊚⊛⋊</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const plates = await page.evaluate(buildAll, D);
  fs.mkdirSync(OUT, { recursive: true });
  const done = [];
  for (const [i, p] of plates.entries()) {
    if (only && only !== i + 1) continue;
    const svgPath = path.join(OUT, p.name + '.svg');
    fs.writeFileSync(svgPath, p.svg);
    done.push(p);
    if (svgOnly) { console.log('wrote ' + path.relative(ROOT, svgPath)); continue; }
    await page.setContent(`<html><body style="margin:0;background:#fbfaf4">${p.svg.replace(/width="3840" height="2160"/, 'width="1920" height="1080"')}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, p.name + '.png'), clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log('wrote ' + path.relative(ROOT, svgPath) + ' and .png');
  }
  if (!svgOnly && !only) {
    /* all plates in one PDF: US Letter, landscape. The PNGs are placed, not the SVGs: Chromium
     * expands every pattern fill in a PDF, which makes the file five times larger. */
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(`<html><head><style>@page{size:11in 8.5in;margin:0}body{margin:0}
      .p{width:11in;height:8.5in;display:flex;align-items:center;justify-content:center;page-break-after:always;background:#fbfaf4}
      .p img{width:10.6in;height:auto}</style></head><body>${plates.map(p => `<div class="p"><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, p.name + '.png')).toString('base64')}"></div>`).join('')}</body></html>`);
    await pdfPage.evaluate(() => document.fonts.ready);
    await pdfPage.pdf({ path: path.join(OUT, 'hatched-plates.pdf'), width: '11in', height: '8.5in', printBackground: true });
    console.log('wrote docs/hatched/hatched-plates.pdf');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
