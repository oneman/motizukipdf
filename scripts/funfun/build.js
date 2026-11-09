#!/usr/bin/env node
/*
 * build.js — typeset funfun_iut.pdf, a light-hearted article on the characteristics of
 * inter-universal Teichmüller theory, from docs/funfun_iut/funfun_iut.html.
 *
 * The source is plain HTML with LaTeX math between \( … \) (inline) and \[ … \] (display),
 * rendered here with KaTeX, and {{key}} placeholders for the numbers of the running example,
 * which are read from the toolkit (src/iut) so that nothing in the article is typed in by hand:
 *
 *   iut gen  --abc 1 2400 2401 --l 13                 log(q), |log(q)|, ht_E, log(f), [F:Q], [K:Q]
 *   iut walk --abc 1 2400 2401 --l 13 --rows 2        Θ-pilot log-volume, lattice size
 *   iut run ComputeThmOneTen / ChainAndSteps / EvaluateLogicModel
 *   iut ids --json, iut procs --json                  how many identifiers and processes there are
 *
 * Output: funfun_iut.pdf at the repository root (Chromium via Playwright) and the rendered
 * HTML at build/funfun_iut.html.
 *
 * Usage:  make -C src && (cd scripts/funfun && npm install) && node scripts/funfun/build.js [--html-only]
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_HTML = path.join(ROOT, 'docs', 'funfun_iut', 'funfun_iut.html');
const OUT_HTML = path.join(ROOT, 'build', 'funfun_iut.html');
const OUT_PDF = path.join(ROOT, 'funfun_iut.pdf');
const IUT = path.join(ROOT, 'src', 'iut');
const NM = path.join(__dirname, 'node_modules');
const HTML_ONLY = process.argv.includes('--html-only');

const A = 1, B = 2400, C = 2401, L = 13;
const DATA = ['--abc', String(A), String(B), String(C), '--l', String(L)];

function need(file, hint) {
  if (!fs.existsSync(file)) { console.error(`${path.relative(ROOT, file)} is missing: ${hint}`); process.exit(1); }
}
need(IUT, 'run `make -C src` first');
need(path.join(NM, 'katex'), 'run `npm install` in scripts/funfun first');
const katex = require(path.join(NM, 'katex'));

const iut = (...args) => cp.execFileSync(IUT, args, { encoding: 'utf8', maxBuffer: 64 << 20 });
function grab(text, re, what) {
  const m = text.match(re);
  if (!m) { console.error(`could not find ${what} in the toolkit output`); process.exit(1); }
  return m[1];
}

/* ---- numbers of the running example, from the toolkit ---- */
const gen = iut('gen', ...DATA);
const walk = iut('walk', ...DATA, '--rows', '2');
const thm = iut('run', 'ComputeThmOneTen', ...DATA);
const chain = iut('run', 'ChainAndSteps', ...DATA);
const logic = iut('run', 'EvaluateLogicModel', ...DATA);
const ids = JSON.parse(iut('ids', '--json'));
const procs = JSON.parse(iut('procs', '--json'));

const rad = n => { let r = 1; for (let p = 2; n > 1; p++) if (n % p === 0) { r *= p; while (n % p === 0) n /= p; } return r; };
const radABC = rad(A * B * C);
const ctheta = Number(grab(thm, /C_Θ = ([0-9.]+)/, 'C_Θ'));
const [cMant, cExp] = ctheta.toExponential(2).split('e+');

const V = {
  a: A, b: B, c: C, l: L,
  lstar: (L - 1) / 2, lpm: (L + 1) / 2,
  rad: radABC,
  logc: Math.log(C).toFixed(4),
  lograd: Math.log(radABC).toFixed(4),
  quality: (Math.log(C) / Math.log(radABC)).toFixed(4),
  logq: grab(gen, /log\(q\)\s*:\s*([0-9.]+)/, 'log(q)'),
  abslogq: grab(gen, /\|log\(q\)\| = log\(q\)\/2l = ([0-9.]+)/, '|log(q)|'),
  htE: grab(gen, /ht_E = log\(q\)\/6 = ([0-9.]+)/, 'ht_E'),
  logf: grab(gen, /log\(f\)\s*:\s*([0-9.]+)/, 'log(f)'),
  degF: grab(gen, /\[F:Q\]≤(\d+)/, '[F:Q]'),
  degK: grab(gen, /\[K:Q\]≤(\d+)/, '[K:Q]'),
  nval: grab(gen, /V ≅ V_mod : (\d+) valuations/, 'number of valuations'),
  thetapilot: grab(walk, /naive log-vol\s*=\s*(-?[0-9.]+)/, 'Θ-pilot log-volume'),
  latV: grab(walk, /(\d+) vertices, \d+ links/, 'lattice vertices'),
  latE: grab(walk, /\d+ vertices, (\d+) links/, 'lattice links'),
  ctheta_m: cMant, ctheta_e: cExp,
  gl2: grab(thm, /\|GL2\(F_13\)\| = (\d+)/, '|GL2(F_l)|'),
  stp1: grab(chain, /StpOne\s.*?Ind3\s+(-?[0-9.]+)/, 'Stp1 log-volume'),
  stp4: grab(chain, /StpFour\s.*?none\s+(-?[0-9.]+)/, 'Stp4 log-volume'),
  stp8: grab(chain, /StpEight\s.*?monodromy\s+(-?[0-9.]+)/, 'Stp8 log-volume'),
  andverdict: grab(logic, /AND-IUT \(∧\).*⇒ (.+)/, 'the AND verdict').trim(),
  orverdict: grab(logic, /OR-IUT \(∨\).*⇒ (.+)/, 'the OR verdict').trim(),
  nids: ids.length,
  nprocs: procs.length,
};
V.ratio = (L * (L + 1) / 12).toFixed(4);

/* ---- assemble the page ---- */
let html = fs.readFileSync(SRC_HTML, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (!(k in V)) { console.error(`unknown placeholder ${m}`); process.exit(1); }
  return String(V[k]);
});
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tex = (s, displayMode) => katex.renderToString(unent(s), { displayMode, throwOnError: true, strict: 'ignore', output: 'html' });
html = html.replace(/\\\[([\s\S]+?)\\\]/g, (m, s) => tex(s, true));
html = html.replace(/\\\(([\s\S]+?)\\\)/g, (m, s) => tex(s, false));

const fileURL = p => 'file://' + p.split(path.sep).map(encodeURIComponent).join('/');
const katexDist = path.join(NM, 'katex', 'dist');
const katexCSS = fs.readFileSync(path.join(katexDist, 'katex.min.css'), 'utf8')
  .replace(/url\(fonts\//g, `url(${fileURL(path.join(katexDist, 'fonts'))}/`);
const jpDir = path.join(NM, '@fontsource', 'noto-serif-jp');
const jpCSS = ['400', '700'].map(w => fs.readFileSync(path.join(jpDir, `${w}.css`), 'utf8')
  .replace(/url\(\.\/files\//g, `url(${fileURL(path.join(jpDir, 'files'))}/`)).join('\n');
const ssDir = path.join(NM, '@fontsource', 'source-serif-4');
const ssCSS = ['400', '400-italic', '600', '700', '700-italic'].map(w => fs.readFileSync(path.join(ssDir, `${w}.css`), 'utf8')
  .replace(/url\(\.\/files\//g, `url(${fileURL(path.join(ssDir, 'files'))}/`)).join('\n');
html = html.replace('</head>', `<style>${katexCSS}\n${ssCSS}\n${jpCSS}</style>\n</head>`);

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
    <span>funfun IUT · an otaku field guide to inter-universal Teichmüller theory</span>
    <span>— <span class="pageNumber"></span> / <span class="totalPages"></span> —</span></div>`;
  await page.pdf({
    path: OUT_PDF, format: 'Letter', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer,
    margin: { top: '16mm', bottom: '18mm', left: '17mm', right: '17mm' },
  });
  await browser.close();
  console.log(`wrote ${path.relative(ROOT, OUT_PDF)}`);
})();
