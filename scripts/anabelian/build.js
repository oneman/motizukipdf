#!/usr/bin/env node
/*
 * build.js — typeset anabelian_guide.pdf, a field guide to the anabelian reconstruction
 * algorithms that inter-universal Teichmüller theory runs on, from
 * docs/anabelian/anabelian_guide.html.
 *
 * The source is plain HTML with LaTeX math between \( … \) (inline) and \[ … \] (display),
 * rendered here with KaTeX, plus two kinds of placeholders:
 *
 *   {{key}}       a number, computed below (worked examples) or read from the toolkit (src/iut)
 *   {{fig:name}}  an inline SVG figure, drawn by figures.js (math labels go through KaTeX too)
 *
 * Toolkit calls:
 *   iut ids --json, iut procs --json                        identifier and process counts
 *   iut run TransportMonoAnabelian --abc 1 2400 2401 --l 13 the four stages of mono-anabelian transport
 *   iut run ReconstructCoverings   --abc 1 2400 2401 --l 13 the index identity that recovers l
 *
 * The worked examples (invariants of local Galois groups, Belyi maps, torsion points of 11a1,
 * Uchida's addition) are computed in this file, so every number in the guide is reproducible.
 *
 * Output: anabelian_guide.pdf at the repository root (Chromium via Playwright) and the
 * rendered HTML at build/anabelian_guide.html.
 *
 * Usage:  make -C src && (cd scripts/anabelian && npm install) && node scripts/anabelian/build.js [--html-only]
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_HTML = path.join(ROOT, 'docs', 'anabelian', 'anabelian_guide.html');
const OUT_HTML = path.join(ROOT, 'build', 'anabelian_guide.html');
const OUT_PDF = path.join(ROOT, 'anabelian_guide.pdf');
const IUT = path.join(ROOT, 'src', 'iut');
const NM = path.join(__dirname, 'node_modules');
const HTML_ONLY = process.argv.includes('--html-only');

function need(file, hint) {
  if (!fs.existsSync(file)) { console.error(`${path.relative(ROOT, file)} is missing: ${hint}`); process.exit(1); }
}
need(IUT, 'run `make -C src` first');
need(path.join(NM, 'katex'), 'run `npm install` in scripts/anabelian first');
const katex = require(path.join(NM, 'katex'));
const FIG = require('./figures.js');

const iut = (...args) => cp.execFileSync(IUT, args, { encoding: 'utf8', maxBuffer: 64 << 20 });
function grab(text, re, what) {
  const m = text.match(re);
  if (!m) { console.error(`could not find ${what} in the toolkit output`); process.exit(1); }
  return m[1];
}
function check(cond, what) { if (!cond) { console.error(`worked example failed: ${what}`); process.exit(1); } }

/* ------------------------------------------------------------------ toolkit numbers */
const DATA = ['--abc', '1', '2400', '2401', '--l', '13'];
const ids = JSON.parse(iut('ids', '--json'));
const procs = JSON.parse(iut('procs', '--json'));
const transport = iut('run', 'TransportMonoAnabelian', ...DATA);
const covers = iut('run', 'ReconstructCoverings', ...DATA);
const kinds = {};
for (const x of ids) kinds[x.kind] = (kinds[x.kind] || 0) + 1;

const V = {
  nids: ids.length,
  nprocs: procs.length,
  ngroups: kinds.group || 0,
  nanab: kinds.anabelioid || 0,
  tr_in: grab(transport, /Frobenius-like input at \(0,0\).*?(-?[0-9]+\.[0-9]+)/, 'transport input'),
  tr_det: grab(transport, /Kummer-detach at \(0,0\).*?(-?[0-9]+\.[0-9]+)/, 'Kummer-detachment'),
  tr_ind1: grab(transport, /étale-transport across the Θ-link.*?(-?[0-9]+)\.[0-9]+/, 'Ind1 count'),
  tr_out: grab(transport, /re-attach at \(1,0\).*?(-?[0-9]+\.[0-9]+)/, 'transport output'),
  cov_l2: grab(covers, /l² = (\d+) =/, 'l²'),
  cov_dc: grab(covers, /= \[Δ_C:Δ_X→\]\/2 = (\d+)\/2/, '[Δ_C:Δ_X→]'),
};
V.tr_ind1_fmt = Number(V.tr_ind1).toLocaleString('en-US');
check(Number(V.cov_l2) === 169 && Number(V.cov_dc) === 338, 'l² = [Δ_C:Δ_X→]/2 for l = 13');

/* ------------------------------------------------------------------ worked example 1:
 * what the algorithm of [AbsAnab] Prop 1.2.1 reads off G_k^ab.
 * By local class field theory G_k^ab ≅ (k^×)^∧ ≅ Ẑ × μ_{q−1} × μ_{p^∞}(k) × Z_p^d,  d = [k:Q_p].
 * So: rank over Z_l is 1 for l ≠ p and d+1 for l = p; prime-to-p torsion has order q−1.     */
const LOCAL = [
  { name: 'Q_3', tex: '\\mathbb{Q}_3', p: 3, e: 1, f: 1, w: 1, note: 'the bad place of \\((1,8,9)\\)' },
  { name: 'Q_7', tex: '\\mathbb{Q}_7', p: 7, e: 1, f: 1, w: 1, note: '\\(l = 7\\) for \\((1,8,9)\\)' },
  { name: 'Q_9', tex: '\\mathbb{Q}_9', p: 3, e: 1, f: 2, w: 1, note: 'unramified, degree 2' },
  { name: 'Q_3(ζ_3)', tex: '\\mathbb{Q}_3(\\zeta_3)', p: 3, e: 2, f: 1, w: 3, note: 'ramified, has \\(\\mu_3\\)' },
  { name: 'Q_3(√3)', tex: '\\mathbb{Q}_3(\\sqrt{3})', p: 3, e: 2, f: 1, w: 1, note: 'ramified, no \\(\\mu_3\\)' },
  { name: 'Q_2(i)', tex: '\\mathbb{Q}_2(i)', p: 2, e: 2, f: 1, w: 4, note: 'has \\(\\mu_4\\)' },
];
const PRIMES = [2, 3, 5, 7, 11, 13];
const rows = LOCAL.map(k => {
  const d = k.e * k.f, q = k.p ** k.f;
  const ranks = PRIMES.map(l => (l === k.p ? d + 1 : 1));
  /* the algorithm: p is the unique prime with rank ≥ 2; d = rank − 1; q = (prime-to-p torsion) + 1 */
  const pRead = PRIMES[ranks.findIndex(r => r >= 2)];
  const dRead = ranks[PRIMES.indexOf(pRead)] - 1;
  const qRead = (q - 1) + 1;
  const fRead = Math.round(Math.log(qRead) / Math.log(pRead));
  check(pRead === k.p && dRead === d && fRead === k.f, `local invariants of ${k.name}`);
  return { ...k, d, q, ranks, eRead: dRead / fRead };
});
V.localTable = rows.map(r => `<tr><td>\\(${r.tex}\\)</td><td>${r.ranks.map((x, i) => (PRIMES[i] === r.p ? `<b>${x}</b>` : x)).join(' ')}</td>` +
  `<td>\\(${r.p}\\)</td><td>\\(${r.d}\\)</td><td>\\(${r.q - 1}\\)</td><td>\\(${r.q}\\)</td><td>\\(${r.f}\\)</td><td>\\(${r.eRead}\\)</td><td>\\(${r.w}\\)</td><td class="small">${r.note}</td></tr>`).join('\n');

/* ------------------------------------------------------------------ worked example 2: Belyi maps */
const frac = (n, d) => ({ n, d });
/* β(t) = 4t(1−t) on P^1: 0,1 ↦ 0; 1/2 ↦ 1 (double); ∞ ↦ ∞ (double). Riemann–Hurwitz: −2 = 2·(−2) + 2. */
const b1 = t => 4 * t * (1 - t);
check(b1(0) === 0 && b1(1) === 0 && b1(0.5) === 1, 'β(t) = 4t(1−t)');
check(-2 === 2 * -2 + (2 - 1) + (2 - 1), 'Riemann–Hurwitz for 4t(1−t)');
/* β(t) = 4(t−1)/t² = (4s(1−s)) ∘ (s = 1/t): sends 2 ↦ 1 */
const b2 = t => 4 * (t - 1) / (t * t);
check(b2(2) === 1 && b2(1) === 0, 'β(t) = 4(t−1)/t²');
/* a = m/(m+n) = 2/5: β(t) = (m+n)^{m+n}/(m^m n^n) · t^m (1−t)^n = 3125/108 · t²(1−t)³ */
const m = 2, n = 3, cst = (m + n) ** (m + n) / (m ** m * n ** n);
const b3 = t => cst * t ** m * (1 - t) ** n;
check(Math.abs(b3(2 / 5) - 1) < 1e-12, 'β(2/5) = 1');
/* β(t) = 1  ⇔  t^5 − 3t^4 + 3t^3 − t^2 + 108/3125 = 0, with a double root at 2/5; deflate to a cubic */
function deflate(c, r) { const out = [c[0]]; for (let i = 1; i < c.length - 1; i++) out.push(c[i] + out[i - 1] * r); return out; }
let poly = [1, -3, 3, -1, 0, 108 / 3125];
poly = deflate(deflate(poly, 0.4), 0.4);                 /* t^3 + a t^2 + b t + c */
/* the cubic: one real root by bisection, then the quadratic factor */
const cub = t => ((t + poly[1]) * t + poly[2]) * t + poly[3];
let lo = -1, hi = 0;
for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cub(lo) * cub(mid) <= 0) hi = mid; else lo = mid; }
const r0 = (lo + hi) / 2;
const q2 = deflate(poly, r0);                             /* t^2 + B t + C */
const re = -q2[1] / 2, im = Math.sqrt(q2[2] - re * re);
check(Math.abs(2 * 0.4 + r0 + 2 * re - 3) < 1e-9, 'sum of the roots of β(t) = 1');
check(Math.abs(b3(r0) - 1) < 1e-9, 'the real extra preimage of 1');
V.belyiDeg = m + n;
V.belyiC = '3125/108';
V.belyiR0 = r0.toFixed(4);
V.belyiRe = re.toFixed(4);
V.belyiIm = im.toFixed(4);
/* Schreier: an index-d open subgroup of a free profinite group of rank r is free of rank d(r−1)+1;
   Δ of P^1 minus s points is free of rank s−1 */
V.belyiPunct = 3 + 1 + 3;                                 /* 0, 1, ∞, 2/5 and the three extra preimages */
check(V.belyiDeg * (2 - 1) + 1 === V.belyiPunct - 1, 'Schreier for the degree-5 Belyi map');
check(2 * (2 - 1) + 1 === 4 - 1, 'Schreier for 4t(1−t)');

/* ------------------------------------------------------------------ worked example 3: elliptic cuspidalization */
/* 11a1: y² + y = x³ − x² − 10x − 20; 2-torsion x-coordinates are the roots of 4x³ + b2 x² + 2 b4 x + b6 */
const b2c = -4, b4c = -20, b6c = -79;
const psi2 = x => 4 * x ** 3 + b2c * x ** 2 + 2 * b4c * x + b6c;
lo = 0; hi = 10;
for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (psi2(lo) * psi2(mid) <= 0) hi = mid; else lo = mid; }
const x0 = (lo + hi) / 2;
/* deflate 4x³ − 4x² − 40x − 79 by (x − x0) */
const qa = 4, qb = -4 + 4 * x0, qc = -40 + qb * x0;
const disc = qb * qb - 4 * qa * qc;
check(disc < 0, '11a1 has one real 2-torsion point');
V.e2real = x0.toFixed(4);
V.e2re = (-qb / (2 * qa)).toFixed(4);
V.e2im = (Math.sqrt(-disc) / (2 * qa)).toFixed(4);
V.ellRank2 = 2 * 2 + 1;
V.ellRank3 = 3 * 3 + 1;
check(4 * (2 - 1) + 1 === V.ellRank2 && 9 * (2 - 1) + 1 === V.ellRank3, 'Schreier for [N] on E minus a point');

/* ------------------------------------------------------------------ worked example 4: Uchida's addition */
/* X = P^1, D = ∞ (so Γ(D) = {a + b t}), x = 0, y1 = 1, y2 = −1.
   f_{λ,1} = λ(1 − t), f_{μ,2} = μ(1 + t); g is the unique a + bt with g(y1) = f_{μ,2}(y1), g(y2) = f_{λ,1}(y2). */
const lam = 3, mu = 5;
const gy1 = mu * 2, gy2 = lam * 2;
const gb = (gy1 - gy2) / 2, ga = (gy1 + gy2) / 2;
check(ga === lam + mu, "Uchida's addition 3 + 5");
Object.assign(V, { lam, mu, gy1, gy2, ga, gb });

/* ------------------------------------------------------------------ assemble the page */
let html = fs.readFileSync(SRC_HTML, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/\{\{fig:(\w+)\}\}/g, (mm, k) => {
  if (!(k in FIG)) { console.error(`unknown figure ${mm}`); process.exit(1); }
  return FIG[k](V);
});
html = html.replace(/\{\{(\w+)\}\}/g, (mm, k) => {
  if (!(k in V)) { console.error(`unknown placeholder ${mm}`); process.exit(1); }
  return String(V[k]);
});
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tex = (s, displayMode) => katex.renderToString(unent(s), { displayMode, throwOnError: true, strict: 'ignore', output: 'html' });
html = html.replace(/\\\[([\s\S]+?)\\\]/g, (mm, s) => tex(s, true));
html = html.replace(/\\\(([\s\S]+?)\\\)/g, (mm, s) => tex(s, false));

const fileURL = p => 'file://' + p.split(path.sep).map(encodeURIComponent).join('/');
const katexDist = path.join(NM, 'katex', 'dist');
const katexCSS = fs.readFileSync(path.join(katexDist, 'katex.min.css'), 'utf8')
  .replace(/url\(fonts\//g, `url(${fileURL(path.join(katexDist, 'fonts'))}/`);
const fontCSS = (pkg, weights) => {
  const dir = path.join(NM, '@fontsource', pkg);
  return weights.map(w => fs.readFileSync(path.join(dir, `${w}.css`), 'utf8')
    .replace(/url\(\.\/files\//g, `url(${fileURL(path.join(dir, 'files'))}/`)).join('\n');
};
html = html.replace('</head>', `<style>${katexCSS}
${fontCSS('source-serif-4', ['400', '400-italic', '600', '700', '700-italic'])}
${fontCSS('noto-serif-jp', ['400', '700'])}
${fontCSS('inter', ['400', '500', '600', '700'])}
${fontCSS('m-plus-rounded-1c', ['500', '700', '800'])}</style>
</head>`);

fs.mkdirSync(path.dirname(OUT_HTML), { recursive: true });
fs.writeFileSync(OUT_HTML, html);
console.log(`wrote ${path.relative(ROOT, OUT_HTML)}`);
if (HTML_ONLY) process.exit(0);

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(fileURL(OUT_HTML), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const footer = `<div style="width:100%;font:8px 'Source Serif 4',serif;color:#8a7f99;padding:0 16mm;display:flex;justify-content:space-between">
    <span>Anabelian reconstruction algorithms · a field guide for IUT travellers</span>
    <span>— <span class="pageNumber"></span> / <span class="totalPages"></span> —</span></div>`;
  await page.pdf({
    path: OUT_PDF, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer,
    margin: { top: '16mm', bottom: '18mm', left: '17mm', right: '17mm' },
  });
  await browser.close();
  console.log(`wrote ${path.relative(ROOT, OUT_PDF)}`);
})();
