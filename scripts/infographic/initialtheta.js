#!/usr/bin/env node
/*
 * scripts/infographic/initialtheta.js — the 4K infographic of how initial Θ-data is built.
 *
 *   node scripts/infographic/initialtheta.js            → docs/initialtheta-infographic.svg (master)
 *                                                        docs/initialtheta-infographic.png (3840×2160)
 *                                                        docs/initial-theta-data/<id>.json (the data, one file per example)
 *   node scripts/infographic/initialtheta.js --svg-only   skip the PNG
 *
 * Every number drawn comes from scripts/infographic/initialtheta-data.js, which computes the
 * initial Θ-data ([IUTchI] Def 3.1) of four elliptic curves over Q exactly (BigInt), proves the
 * SL2 condition from Frobenius traces, and runs the abc examples through the toolkit (iut validate,
 * iut run CheckDefThreeOne, iut gen --json). The same objects are written as JSON next to the picture.
 *
 * Layout (3840 × 2160):
 *   header      the tuple, the numbers
 *   left        eight steps: what Def 3.1 needs (the clause) and how to get it
 *   columns     the four examples, one cell per step, with the real numbers drawn
 *
 * Text widths are measured with a canvas in Chromium (the same Chromium that renders the
 * PNG) — the method of scripts/infographic/build.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { build, stringify } = require('./initialtheta-data.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_SVG = path.join(ROOT, 'docs', 'initialtheta-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'initialtheta-infographic.png');
const OUT_DIR = path.join(ROOT, 'docs', 'initial-theta-data');
const W = 3840, H = 2160;

/* ------------------------------------------------------------ data */
const all = build();
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const D of all) fs.writeFileSync(path.join(OUT_DIR, D.id + '.json'), stringify(D) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), stringify({ schema: 'iut-initial-theta-data/index/1', reference: '[IUTchI] Def 3.1',
  examples: all.map(D => ({ id: D.id, title: D.title, file: D.id + '.json', curve: D.curve.equation, l: D.l.value, VbadMod: D.VbadMod.map(v => v.p) })) }) + '\n');

/* what the picture needs; the toolkit's own JSON stays in the files only */
const ex = all.map(D => {
  const E = JSON.parse(JSON.stringify(D));
  if (E.toolkit) delete E.toolkit.gen;
  /* the JSON excerpt shown in the last row */
  E.snippet = stringify({
    id: D.id, curve: D.curve.equation, j: D.curve.j.factored,
    F: `Q(√−1,E[30]), [F:Q] | ${D.F.degreeDivides}`,
    l: D.l.value, K: `F(E[${D.l.value}]), [K:F] = ${D.K.degreeOverF}`,
    ordQ_VbadMod: Object.fromEntries(D.VbadMod.map(v => [v.p, v.ordQ])),
    C_K: `${D.C_K.type}, ${D.C_K.cuspsCUnder} cusps`, epsilon: D.epsilon.label,
    logQ: D.derived.logQ,
  }).split('\n');
  return E;
});
const data = { ex, generated: new Date().toISOString().slice(0, 10),
  maxBar: Math.max(...all.flatMap(D => D.V.places.filter(v => v.ordQ > 0).map(v => v.ordQ * Math.log(v.p)))) };

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
  const BLUE = C.series[0], ORANGE = C.series[1], GREEN = C.series[2], VIOLET = C.series[6], RED = C.series[7];
  const COLS = [BLUE, ORANGE, GREEN, VIOLET];

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
  const line = (x1, y1, x2, y2, o = {}) => out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`);
  const circle = (cx, cy, r, o = {}) => out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const bg = [252, 252, 251]; const mix = (c, s) => Math.round(s + (c - s) * a); return `rgb(${mix(r, bg[0])},${mix(g, bg[1])},${mix(b, bg[2])})`; };
  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.35; const words = s.split(' '); let cur = '', yy = y, n = 0;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, o); yy += lh; cur = w; n++; } else cur = t;
    }
    if (cur) { text(x, yy, cur, o); yy += lh; n++; }
    if (o.maxY && yy - lh > o.maxY) console.warn(`wrap overflow by ${(yy - lh - o.maxY).toFixed(0)}px: ${s.slice(0, 60)}…`);
    return yy;
  };
  const fit = (x, y, s, width, o = {}) => {
    const font = o.font || SANS, size = o.size || 20;
    let t = s;
    while (t.length > 1 && measure(t, font, size, o.weight) > width) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== s) console.warn('cut: ' + s);
    return text(x, y, t, o);
  };
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = k => String(k).split('').map(c => SUP[c] || c).join('');
  const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
  const sub = k => String(k).split('').map(c => SUB[c] || c).join('');
  const badge = (x, y, s, col, o = {}) => {
    const w = measure(s, SANS, o.size || 13, 700) + 16;
    rect(x, y - (o.size || 13) - 4, w, (o.size || 13) + 9, { rx: 5, fill: o.solid ? col : tint(col, 0.16) });
    text(x + 8, y, s, { size: o.size || 13, weight: 700, fill: o.solid ? '#fff' : col });
    return w;
  };

  out.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${C.surface}"/>`);

  /* ---------------------------------------------------------------- header */
  text(M, 92, 'Initial Θ-data, built four times: what it needs, how to make it, and the numbers', { size: 60, weight: 700 });
  wrap(M, 140, 'Everything in inter-universal Teichmüller theory starts from one tuple (F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲), fixed in [IUTchI] Def 3.1: a number field F, a once-punctured elliptic curve X_F over it, a prime l, a curve C̲_K over K = F(E[l]) that remembers one line of l-torsion, a choice V of one place of K over each place of the field of moduli, the odd places of bad multiplicative reduction V^bad_mod, and a cusp ε̲. The left column is the recipe: for each step, the clause of Def 3.1 it has to meet and how to meet it (F is chosen as in [IUTchIV] Thm 1.10). The four columns run the recipe on four elliptic curves over Q, three from abc triples and one given by its equation. Every number is computed exactly from the integers of the input, the SL2 condition is proved from point counts, and the abc examples are re-checked by the toolkit\'s own validator. All of it is saved as JSON, one file per example.', 2560, { size: 22, fill: C.text2, lh: 30 });

  const nb = D.ex.reduce((s, e) => s + e.VbadMod.length, 0);
  const tkErr = D.ex.filter(e => e.toolkit).reduce((s, e) => s + e.toolkit.errors, 0);
  const stats = [[D.ex.length, 'curves'], [7, 'entries in the tuple'], [6, 'conditions (a)–(f)'], [nb, 'places in V^bad_mod'], [D.ex.map(e => e.l.value).join('·'), 'the primes l'], [tkErr, 'toolkit errors'], [D.ex.length, 'JSON files']];
  stats.forEach(([n, lab], i) => {
    const x = W - M - (stats.length - i) * 150 + 12;
    rect(x, 46, 138, 118, { rx: 12, fill: C.panel });
    const s = String(n);
    text(x + 69, 112, s, { size: s.length > 5 ? 26 : s.length > 3 ? 34 : 46, weight: 600, anchor: 'middle' });
    text(x + 69, 146, lab, { size: 14, fill: C.text2, anchor: 'middle' });
  });

  /* ---------------------------------------------------------------- grid */
  const LX = M, LW = 1040, GAP = 18;
  const CX0 = LX + LW + GAP, CW = (W - M - CX0 - 3 * GAP) / 4;
  const colX = i => CX0 + i * (CW + GAP);
  const HY = 280, HH = 92;                       // column header band
  const ROWS = [
    { h: 176, step: 1, title: 'Pick the elliptic curve: X_F and F_mod', clause: '(b)',
      need: 'X_F is a once-punctured elliptic curve (type (1,1)) over F, X_F ⊆ E_F; C_F = X_F/±1; F_mod ⊆ F is the field of moduli of X_F.',
      how: 'Start from any E over Q; an abc triple a + b = c gives the Frey curve y² = x(x − a)(x + b). Compute b2, b4, b6, b8, c4, c6, Δ and j = c4³/Δ exactly and check 1728Δ = c4³ − c6². Here j ∈ Q, so F_mod = Q(j) = Q.' },
    { h: 300, step: 2, title: 'Find the bad places and their q-parameters: V^bad_mod', clause: '(b)',
      need: 'V^bad_mod ⊆ V_mod is a non-empty set of non-archimedean places of odd residue characteristic at which X_F has bad (multiplicative) reduction.',
      how: 'Over F the reduction is stable, so E is bad exactly where j is not integral: ord_p(j) < 0. There the Tate parameter has ord_p(q_p) = −ord_p(j). Its p-adic digits come from inverting j = 1/q + 744 + 196884q + …, i.e. q = x + 744x² + 750420x³ + … with x = 1/j. Keep the odd p. The place 2 can be bad, but it is never in V^bad_mod. The bars show ord(q_v)·log p, the share of v in log q, on one scale for all four.' },
    { h: 196, step: 3, title: 'Build F̄/F, and the field K', clause: '(a) (b) (c)',
      need: '√−1 ∈ F; F/F_mod Galois of degree prime to l; the 2·3-torsion of E_F rational over F; stable reduction at every finite place. K = the field cut out by E[l].',
      how: 'Take F = F_mod(√−1, E[2·3·5]) and F̄ = Q̄. Gal(F/F_tpd) embeds in {±1} × GL2(F_3) × GL2(F_5) (order 2·48·480), so [F:Q] divides [F_tpd:Q]·46080 and has no prime factor ≥ 7. Since E[3], E[5] ⊆ E(F), Raynaud\'s criterion gives semistable reduction everywhere. Then K = F(E[l]). Bars are on a log scale, and ≤ marks a bound.' },
    { h: 150, step: 4, title: 'Choose the prime l', clause: '(c)',
      need: 'l ≥ 5 prime, prime to the residue characteristics of V^bad_mod and to the orders ord(q_v) at V^bad, and the image of G_F → GL2(F_l) contains SL2(F_l).',
      how: 'Sieve 5, 7, 11, …: 5 always fails here because F already contains E[5]; strike any l in V^bad_mod or dividing some ord(q_v); the first survivor whose SL2 condition is proved (step 5) is l. Then l* = (l − 1)/2 and l± = (l + 1)/2.' },
    { h: 196, step: 5, title: 'Prove that the image of Galois contains SL2(F_l)', clause: '(c)',
      need: 'Im(G_F → GL2(F_l)) ⊇ SL2(F_l).',
      how: 'Frob_p (p ∤ lΔ) acts on E[l] with trace a_p = p + 1 − #E(F_p) and det p. By Serre (1972, §2.8 Prop 19) the image contains SL2(F_l) once it has s: tr ≠ 0 and tr² − 4det a non-zero square; s′: tr ≠ 0 and tr² − 4det a non-square; s″: u = tr²/det ∉ {0, 1, 2, 4} and u² − 3u + 1 ≠ 0. These rule out the Borel, the Cartan normalizers and A4, S4, A5. Over F the image has index dividing [F:Q], which is prime to l, so it still contains SL2.' },
    { h: 232, step: 6, title: 'Choose C̲_K, V and ε̲; read off the labels', clause: '(d) (e) (f)',
      need: 'C̲_K of type (1, l-tors)± over K with K-core C_F; V ⊆ V(K) one place over each place of F_mod, of type (1, Z/lZ)± at V^bad; ε̲ a cusp from a non-zero element of Q.',
      how: 'Pick a line in E[l] ≅ F_l². There are l + 1 lines, all K-rational. The quotient E[l] ↠ Q ≅ Z/l cuts out X̲_K, with l cusps ↔ F_l, and C̲_K = X̲_K/±1, with l± cusps ↔ |F_l|. Since j ∉ Z, E has no CM, so the K-core is C_F. For each p choose a v | p in K; at a bad p, take the one where the line is the Tate subgroup μ_l. Finally ε̲ is the cusp ±1.' },
    { h: 196, step: 7, title: 'Check the six conditions', clause: '(a)–(f)',
      need: 'Every clause of Def 3.1 holds for the tuple.',
      how: 'Each clause is checked from the numbers, proved (the SL2 condition), or holds by the choice made in steps 3 and 6. The toolkit re-checks the abc examples: iut validate and iut run CheckDefThreeOne --abc a b c --l l print the same verdicts. Its CLI takes only abc triples, so 11a1 is checked by the script alone.' },
    { h: 214, step: 8, title: 'Write it down: the data as JSON', clause: '',
      need: 'All the data that the rest of the theory reads: the tuple, plus the numbers it is computed from.',
      how: 'docs/initial-theta-data/<id>.json (schema iut-initial-theta-data/1) holds every value on this page: the curve invariants and j; every place with ord(q) and the q-adic digits; the l-sieve with the Serre witnesses; the field degrees; C̲_K, V, ε̲ and the label sets; log q; the six conditions; and the toolkit\'s own iut gen --json output. The excerpt shows the top-level keys.' },
  ];
  const RG = 10;
  let ry = HY + HH + RG;
  ROWS.forEach(r => { r.y = ry; ry += r.h + RG; });
  if (ry - RG > H - 44) console.warn(`rows overflow by ${ry - RG - (H - 44)}px`);

  /* left column: the recipe */
  rect(LX, HY, LW, HH, { rx: 12, fill: C.panel });
  text(LX + 24, HY + 40, 'The recipe', { size: 30, weight: 600 });
  text(LX + 24, HY + 72, 'NEEDED: the clause of [IUTchI] Def 3.1 · HOW: the construction that meets it', { size: 17, fill: C.text2 });
  for (const r of ROWS) {
    rect(LX, r.y, LW, r.h, { rx: 12, fill: C.panel });
    circle(LX + 34, r.y + 32, 18, { fill: C.text });
    text(LX + 34, r.y + 39, String(r.step), { size: 20, weight: 700, fill: '#fff', anchor: 'middle' });
    text(LX + 64, r.y + 40, r.title, { size: 24, weight: 700 });
    if (r.clause) { const tw = measure(r.title, SANS, 24, 700); badge(LX + 64 + tw + 14, r.y + 38, 'Def 3.1 ' + r.clause, C.text2); }
    let yy = r.y + 70;
    text(LX + 24, yy, 'NEEDED', { size: 12, weight: 700, fill: RED, extra: ' letter-spacing="1.4"' });
    yy = wrap(LX + 100, yy, r.need, LW - 124, { font: SYM, size: 15.5, lh: 20.5, fill: C.text });
    yy += 6;
    text(LX + 24, yy, 'HOW', { size: 12, weight: 700, fill: GREEN, extra: ' letter-spacing="1.4"' });
    wrap(LX + 100, yy, r.how, LW - 124, { font: SYM, size: 15.5, lh: 20.5, fill: C.text2, maxY: r.y + r.h - 8 });
  }

  /* column headers */
  D.ex.forEach((e, i) => {
    const x = colX(i), col = COLS[i];
    rect(x, HY, CW, HH, { rx: 12, fill: tint(col, 0.13) });
    rect(x, HY, 8, HH, { rx: 4, fill: col });
    text(x + 26, HY + 42, e.title, { font: SYM, size: 30, weight: 700, fill: col });
    fit(x + 26, HY + 74, e.blurb, CW - 50, { font: SYM, size: 16, fill: C.text2 });
  });

  /* cell frame */
  const cell = (i, r) => { const x = colX(i); rect(x, r.y, CW, r.h, { rx: 12, fill: '#fff', stroke: tint(COLS[i], 0.45), sw: 1.4 }); return { x, y: r.y, w: CW, h: r.h, col: COLS[i], ix: x + 22, iw: CW - 44 }; };
  const kv = (x, y, k, v, o = {}) => { const kw = o.kw || 96; text(x, y, k, { size: 13, weight: 700, fill: C.muted, extra: ' letter-spacing="0.8"' }); return fit(x + kw, y, v, (o.w || 500) - kw, { font: o.font || SYM, size: o.size || 17, weight: o.weight || 400, fill: o.fill || C.text }); };

  D.ex.forEach((e, i) => {
    /* ---------- 1. the curve */
    let c = cell(i, ROWS[0]), y = c.y + 36;
    if (e.input.a) {
      text(c.ix, y, `${e.input.factored.a} + ${e.input.factored.b} = ${e.input.factored.c}`, { font: SYM, size: 22, weight: 700, fill: c.col });
      text(c.x + c.w - 22, y, `rad = ${e.input.rad} · quality ${e.input.quality}`, { size: 14, fill: C.text2, anchor: 'end' });
    } else {
      text(c.ix, y, `[a1,a2,a3,a4,a6] = [${e.input.model.join(', ')}]`, { font: SYM, size: 20, weight: 700, fill: c.col });
    }
    y += 32; kv(c.ix, y, 'E', e.curve.equation, { w: c.iw, weight: 700 });
    y += 28; kv(c.ix, y, 'c4 · c6', `${e.curve.c4} · ${e.curve.c6}`, { w: c.iw, size: 15, font: MONO });
    y += 26; kv(c.ix, y, 'Δ', `${e.curve.discriminant} = ${e.curve.discriminantFactored}`, { w: c.iw, size: 15.5 });
    y += 28; kv(c.ix, y, 'j', e.curve.j.factored, { w: c.iw, weight: 700, size: 18 });

    /* ---------- 2. the places */
    c = cell(i, ROWS[1]);
    const pl = e.V.places.filter(v => v.kind === 'VNon');
    const bx0 = c.ix + 4, bw = Math.min(110, (c.iw - 8) / pl.length), barTop = c.y + 26, barBase = c.y + 112, bh = barBase - barTop;
    line(c.ix, barBase, c.x + c.w - 22, barBase, { stroke: C.line, sw: 1.2 });
    pl.forEach((v, k) => {
      const cx = bx0 + k * bw + bw / 2;
      if (v.ordQ > 0) {
        const val = v.ordQ * Math.log(v.p), hh = Math.max(3, bh * val / D.maxBar);
        const fill = v.inVbadMod ? c.col : '#b9b8b3';
        rect(cx - 26, barBase - hh, 52, hh, { rx: 4, fill });
        text(cx, barBase - hh - 8, val.toFixed(2), { size: 13, weight: 600, fill: v.inVbadMod ? c.col : C.muted, anchor: 'middle' });
      } else {
        circle(cx, barBase - 10, 7, { fill: v.reductionOverQ.startsWith('additive') ? '#fff' : tint(C.muted, 0.35), stroke: C.muted, sw: 1.2 });
      }
      text(cx, barBase + 22, `v${sub(v.p)}`, { font: SYM, size: 17, weight: 700, anchor: 'middle', fill: v.inVbadMod ? c.col : C.text });
      text(cx, barBase + 40, `ord j ${v.ordJ}`, { size: 12, fill: C.text2, anchor: 'middle' });
      const tag = v.inVbadMod ? 'V^bad_mod' : v.ordQ > 0 ? 'bad, even' : v.reductionOverQ.startsWith('additive') ? 'add. → good' : 'good';
      text(cx, barBase + 56, tag, { size: 11.5, weight: v.inVbadMod ? 700 : 400, fill: v.inVbadMod ? c.col : C.muted, anchor: 'middle' });
    });
    y = barBase + 80;
    for (const v of pl.filter(v => v.ordQ > 0)) {
      const t = v.tateParameter, p = v.p;
      const head = `q${sub(p)} = ${p}${sup(t.ord)}·(`;
      let body = '', shown = 0;
      for (let k = 0; k < t.digits.length; k++) {
        const d = t.digits[k]; if (!d) { shown = k + 1; continue; }
        const term = k === 0 ? `${d}` : `${d === 1 ? '' : d + '·'}${p}${k > 1 ? sup(k) : ''}`;
        const cand = body ? `${body} + ${term}` : term;
        if (measure(head + cand + ` + O(${p}${sup(k + 1)}))`, MONO, 14.5) > c.iw - 4) break;
        body = cand; shown = k + 1;
      }
      text(c.ix, y, head + (body || '0') + ` + O(${p}${sup(shown)}))`, { font: MONO, size: 14.5, fill: v.inVbadMod ? C.text : C.muted });
      y += 20;
    }
    const exl = e.VbadModExcluded.length ? `   (v₂ bad but excluded: residue char. 2)` : '';
    y = c.y + c.h - 16;
    text(c.ix, y, `log q = Σ ord(q_v)·log p = ${e.derived.logQ.toFixed(3)}`, { font: SYM, size: 15, weight: 700 });
    if (exl) text(c.x + c.w - 22, y, exl.trim(), { size: 12.5, fill: C.muted, anchor: 'end' });

    /* ---------- 3. the fields, log scale */
    c = cell(i, ROWS[2]);
    const KoverF = Number(e.K.degreeOverF.replace(/^between \d+ and /, '')), Fd = e.F.degreeDivides;
    const bars = [
      ['[F_mod : Q]', 1, '= 1', false], ['[F_tpd : Q]', e.Ftpd.degree, `= ${e.Ftpd.degree}`, false],
      ['[F : Q]', Fd, `≤ ${Fd.toLocaleString('en-US')}`, true], ['[K : F]', KoverF, `= ${KoverF.toLocaleString('en-US')}`, false],
      ['[K : Q]', Fd * KoverF, `≤ ${(Fd * KoverF).toLocaleString('en-US')}`, true],
    ];
    const lx = c.ix + 118, lw = c.iw - 118 - 130, LOGMAX = 9;
    bars.forEach(([lab, v, s, bound], k) => {
      const yy = c.y + 30 + k * 27, ww = Math.max(3, lw * Math.log10(v) / LOGMAX);
      text(c.ix, yy + 5, lab, { font: SYM, size: 15, fill: C.text2 });
      rect(lx, yy - 9, ww, 16, { rx: 3, fill: bound ? tint(c.col, 0.35) : c.col, stroke: bound ? c.col : null, dash: bound ? '4 3' : null });
      text(lx + ww + 8, yy + 5, s, { font: SYM, size: 14.5, weight: 600 });
    });
    text(c.ix, c.y + c.h - 18, `F = Q(√−1, E[30]) · ${e.Ftpd.degree === 1 ? 'E[2] already rational' : `Q(E[2]) has degree ${e.Ftpd.degree}`} · [K:F] = |GL2(F_${e.l.value})|`, { font: SYM, size: 13.5, fill: C.text2 });

    /* ---------- 4. the sieve for l */
    c = cell(i, ROWS[3]);
    const n = e.l.sieve.length, cw2 = (c.iw - (n - 1) * 8) / n;
    const chosen = e.l.value;
    e.l.sieve.forEach((s, k) => {
      const x = c.ix + k * (cw2 + 8), yy = c.y + 22;
      const isPick = s.l === chosen;
      rect(x, yy, cw2, 46, { rx: 8, fill: isPick ? c.col : s.ok ? tint(GREEN, 0.12) : tint(RED, 0.08), stroke: isPick ? c.col : s.ok ? tint(GREEN, 0.6) : tint(RED, 0.5), sw: 1.2 });
      text(x + cw2 / 2, yy + 31, String(s.l), { size: 22, weight: 700, fill: isPick ? '#fff' : s.ok ? GREEN : RED, anchor: 'middle' });
      if (!s.ok) line(x + 10, yy + 38, x + cw2 - 10, yy + 8, { stroke: RED, sw: 1.6, opacity: 0.7 });
    });
    const rej = e.l.sieve.filter(s => !s.ok).map(s => `${s.l}: ${s.short.join(', ')}`).join(' · ');
    wrap(c.ix, c.y + 96, `✗ ${rej}`, c.iw, { font: SYM, size: 13.5, lh: 18, fill: RED });
    text(c.ix, c.y + c.h - 14, `l = ${chosen} · l* = ${e.l.lStar} · l± = ${e.l.lPm} · green = also valid`, { font: SYM, size: 14.5, weight: 700, fill: c.col });

    /* ---------- 5. Serre witnesses */
    c = cell(i, ROWS[4]);
    const W5 = e.l.SL2, L = e.l.value;
    const hdr = ['', 'p', 'a_p', 'tr', 'det', 'tr²−4det', 'u = tr²/det'], xs = [0, 46, 104, 168, 222, 284, 400].map(v => c.ix + v * c.iw / 520);
    hdr.forEach((h, k) => text(xs[k], c.y + 30, h, { size: 12.5, weight: 700, fill: C.muted }));
    const isSq = v => { if (v === 0) return '0'; for (let y2 = 1; y2 < L; y2++) if ((y2 * y2) % L === v) return 'square'; return 'non-sq.'; };
    [['s', W5.s], ['s′', W5.sPrime], ['s″', W5.sDouble]].forEach(([nm, w], k) => {
      const yy = c.y + 58 + k * 28;
      text(xs[0], yy, nm, { font: SYM, size: 17, weight: 700, fill: c.col });
      [w.p, w.ap, w.trace, w.det, `${w.disc} ${isSq(w.disc)}`, `${w.u}`].forEach((v, m) => text(xs[m + 1], yy, String(v), { font: MONO, size: 15, fill: C.text }));
    });
    text(c.ix, c.y + c.h - 40, `mod ${L}: Frob_p has char. poly x² − a_p x + p`, { font: SYM, size: 13.5, fill: C.text2 });
    text(c.ix, c.y + c.h - 16, `⇒ Im ⊇ SL2(F_${L}) over Q, and over F (index | ${e.F.degreeDivides})`, { font: SYM, size: 14.5, weight: 700, fill: GREEN });

    /* ---------- 6. labels, C̲_K, V, ε̲ */
    c = cell(i, ROWS[5]);
    const ls = e.l.lStar, step = Math.min(40, (c.iw - 120) / e.l.value);
    const dotRow = (yy, vals, lab, o = {}) => {
      text(c.ix, yy + 5, lab, { font: SYM, size: 14, weight: 700, fill: C.text2 });
      vals.forEach((t, k) => {
        const cx = c.ix + 120 + k * step + step / 2;
        circle(cx, yy, 13, { fill: o.fill ? o.fill(t) : tint(c.col, 0.18), stroke: o.stroke ? o.stroke(t) : c.col, sw: o.sw ? o.sw(t) : 1.2 });
        text(cx, yy + 5, String(t), { font: SYM, size: 12.5, weight: 700, anchor: 'middle' });
      });
    };
    dotRow(c.y + 28, e.labels.Fl, 'F_l ↔ cusps X̲_K', { fill: t => (t === 0 ? tint(GREEN, 0.25) : tint(c.col, 0.15)), stroke: t => (t === 0 ? GREEN : c.col) });
    dotRow(c.y + 64, e.labels.FlAbs, '|F_l| ↔ C̲_K', { fill: t => (t === 1 ? c.col : t === 0 ? tint(GREEN, 0.25) : tint(c.col, 0.15)), stroke: t => (t === 1 ? C.text : t === 0 ? GREEN : c.col), sw: t => (t === 1 ? 2.5 : 1.2) });
    text(c.ix + 120 + e.labels.FlAbs.length * step + 10, c.y + 69, '← ε̲ = ±1', { font: SYM, size: 14, weight: 700, fill: c.col });
    dotRow(c.y + 100, e.labels.FlStar, 'F_l^* = J', {});
    y = c.y + 136;
    text(c.ix, y, `line of E[${L}] ≅ F_${L}²: 1 of ${e.C_K.choices}`, { font: SYM, size: 14, weight: 700, fill: C.text2 });
    for (let k = 0; k < e.C_K.choices; k++) { const x = c.ix + 270 + k * 16; rect(x, y - 12, 10, 14, { rx: 2, fill: k === 0 ? c.col : tint(c.col, 0.2) }); }
    y += 26;
    const vb = e.V.places.filter(v => v.inVbadMod).map(v => `v${sub(v.p)}`);
    fit(c.ix, y, `V: v_∞, ${e.V.places.filter(v => v.kind === 'VNon').map(v => `v${sub(v.p)}`).join(', ')}, … one v | p in K for every p`, c.iw, { font: SYM, size: 14 });
    y += 22;
    fit(c.ix, y, `V^bad = {${vb.join(', ')}}: v with the line = Tate μ_${L} (type (1, Z/${L}Z)±)`, c.iw, { font: SYM, size: 14 });
    y += 22;
    fit(c.ix, y, `F_l ⋊ {±1}: order ${2 * L} · F_l^*: order ${ls} · Θ-dilation j² = ${e.derived.thetaDilation.replace(/^.*= /, '')}`, c.iw, { font: SYM, size: 14, fill: C.text2 });

    /* ---------- 7. the six conditions */
    c = cell(i, ROWS[6]);
    const STAT = { 'by construction': GREEN, checked: GREEN, proved: GREEN, 'by choice': BLUE, FAILS: RED };
    e.conditions.forEach((cd, k) => {
      const yy = c.y + 28 + k * 22;
      text(c.ix, yy, cd.clause, { font: SYM, size: 14.5, weight: 700 });
      const tk = e.toolkit ? e.toolkit.def31.find(x => `(${x.clause})` === cd.clause) : null;
      const bw2 = badge(c.ix + 38, yy, cd.status, STAT[cd.status] || C.muted, { size: 11.5 });
      fit(c.ix + 38 + bw2 + 8, yy, cd.how, c.iw - 38 - bw2 - 8 - (tk ? 64 : 0), { font: SYM, size: 13, fill: C.text2 });
      if (tk) text(c.x + c.w - 22, yy, tk.ok ? 'iut ✓' : 'iut ✗', { font: SYM, size: 13, weight: 700, fill: tk.ok ? GREEN : RED, anchor: 'end' });
    });
    y = c.y + c.h - 14;
    if (e.toolkit) {
      const s = `iut validate: ${e.toolkit.errors} errors, ${e.toolkit.warnings} warning${e.toolkit.warnings === 1 ? '' : 's'}, ${e.toolkit.checks} checks`;
      text(c.ix, y, s, { size: 14, weight: 700, fill: e.toolkit.errors ? RED : GREEN });
      if (e.toolkit.warnings) text(c.x + c.w - 22, y, 'warning: additive at 2 over Q (good over F)', { size: 12, fill: C.muted, anchor: 'end' });
    } else text(c.ix, y, 'not an abc triple: checked by initialtheta-data.js only', { size: 14, weight: 700, fill: C.text2 });

    /* ---------- 8. the JSON */
    c = cell(i, ROWS[7]);
    rect(c.x + 10, c.y + 10, c.w - 20, c.h - 20, { rx: 8, fill: '#f7f7f5' });
    text(c.ix, c.y + 36, `docs/initial-theta-data/${e.id}.json`, { font: MONO, size: 14, weight: 700, fill: c.col });
    const lines = e.snippet.slice(1, -1);
    lines.forEach((ln, k) => { if (k < 10) fit(c.ix, c.y + 60 + k * 15.5, ln.trim(), c.iw, { font: MONO, size: 12.5, fill: C.text }); });
    if (lines.length > 10) console.warn('snippet cut: ' + e.id);
  });

  text(M, H - 14, `${D.ex.length} examples · F_mod = Q throughout · F as in [IUTchIV] Thm 1.10 · SL2 by Serre 1972 §2.8 Prop 19 from point counts · q-adic digits by inverting j(q) · abc examples re-checked with iut validate and iut run CheckDefThreeOne`, { size: 14, fill: C.muted });
  text(W - M, H - 14, `oneman/motizukipdf · docs/DATA_MODEL.md · generated ${D.generated} by scripts/infographic/initialtheta.js`, { size: 14, fill: C.muted, anchor: 'end' });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<title>Initial Θ-data, built four times — [IUTchI] Def 3.1</title>
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
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'JetBrains Mono';font-weight:700">x</div><div style="font-family:'DejaVu Sans'">Θ̲⊆⋊±∖ε̲√</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const svg = await page.evaluate(`(${layout.toString()})(${JSON.stringify(data)})`);
  fs.writeFileSync(OUT_SVG, svg);
  console.log(`wrote ${path.relative(ROOT, OUT_SVG)} (${(svg.length / 1024).toFixed(0)} KB) and ${all.length} JSON files in ${path.relative(ROOT, OUT_DIR)}/`);
  if (!svgOnly) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fcfcfb">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT_PNG, clip: { x: 0, y: 0, width: W, height: H }, type: 'png' });
    console.log(`wrote ${path.relative(ROOT, OUT_PNG)} (${(fs.statSync(OUT_PNG).size / 1024).toFixed(0)} KB)`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
