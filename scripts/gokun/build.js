#!/usr/bin/env node
/*
 * build.js — typeset gokun_abc.pdf, an illustrated article on what Go Yamashita's survey
 * "A proof of the abc conjecture after Mochizuki" (version of 2024-06-25, in pdf/) teaches,
 * confirms and corrects relative to this repository's toolkit and earlier write-ups.
 *
 * Source: docs/gokun_abc/gokun_abc.html — HTML with LaTeX math between \( … \) and \[ … \]
 * (KaTeX) and three kinds of placeholders:
 *   {{key}}         a number, computed below
 *   {{svg:name}}    a figure drawn below
 *   {{table:name}}  a table built below
 * The numbers of the four worked examples are read from docs/initial-theta-data/pipeline/*.json
 * (written by scripts/pipeline/build.js from `iut pipeline --theta-json`), so nothing about the
 * examples is typed in by hand. The page counts of the survey are constants (PAGES) read off the
 * running heads of the PDF.
 *
 * Output: gokun_abc.pdf at the repository root (US Letter, Chromium via Playwright) and the
 * rendered HTML at build/gokun_abc.html.
 *
 * Usage:  (cd scripts/gokun && npm ci) && node scripts/gokun/build.js [--html-only]
 */
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_HTML = path.join(ROOT, 'docs', 'gokun_abc', 'gokun_abc.html');
const OUT_HTML = path.join(ROOT, 'build', 'gokun_abc.html');
const OUT_PDF = path.join(ROOT, 'gokun_abc.pdf');
const PIPE = path.join(ROOT, 'docs', 'initial-theta-data', 'pipeline');
const NM = path.join(__dirname, 'node_modules');
const HTML_ONLY = process.argv.includes('--html-only');

function need(file, hint) {
  if (!fs.existsSync(file)) { console.error(`${path.relative(ROOT, file)} is missing: ${hint}`); process.exit(1); }
}
need(path.join(NM, 'katex'), 'run `npm ci` in scripts/gokun first');
need(PIPE, 'run `make -C src && node scripts/pipeline/build.js` first');
const katex = require(path.join(NM, 'katex'));

/* ------------------------------------------------------------------ data */
const IDS = ['frey-1-8-9', 'frey-1-2400-2401', 'frey-2-6436341-6436343', 'curve-11a1'];
const SHORT = { 'frey-1-8-9': '1 + 8 = 9', 'frey-1-2400-2401': '1 + 2400 = 2401', 'frey-2-6436341-6436343': '2 + 3¹⁰·109 = 23⁵', 'curve-11a1': 'curve 11a1' };
const EX = IDS.map(id => ({ id, short: SHORT[id], ...JSON.parse(fs.readFileSync(path.join(PIPE, id + '.json'), 'utf8')) }));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fx = (x, n = 4) => Number(x).toFixed(n);
const sci = (x, n = 1) => { const [m, e] = Number(x).toExponential(n).split('e'); return `${m}·10<sup>${Number(e)}</sup>`; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* constants of the reduction steps (survey Prop 1.12, Prop 1.15) for d = [F_mod:Q] = 1 */
const DSTAR = 4096 * 27 * 5;                                  // d* = 2^12·3^3·5·d
const ETA_PRM = 5e20;                                         // the value the toolkit uses (IUT_ETA_PRM_VALUE)
const epsE = h => (60 * DSTAR) ** 2 * Math.log(2 * DSTAR * h) / Math.sqrt(h);
function solveEps(target) {                                   // smallest h with ε_E(h) ≤ target (ε_E decreasing for large h)
  let lo = 1e6, hi = 1e80;
  for (let i = 0; i < 400; i++) { const mid = Math.sqrt(lo * hi); if (epsE(mid) > target) lo = mid; else hi = mid; }
  return hi;
}
const H_EPS1 = solveEps(1);
const H_S1 = (5 + ETA_PRM) ** 2;                              // (s1): h^{1/2} ≥ ξ_prm + η_prm, with ξ_prm ≥ 5
const digitsOf = h => h / 6 / Math.LN10;                      // (1/6) log q∀ ≈ ht ≈ log c, up to a bounded error

/* page ranges of the survey (2024-06-25 version, 409 pages), from its running heads */
const PAGES = [
  ['Contents', 1, 4, 'front'], ['§0 Introduction', 5, 13, 'front'],
  ['§1 Reduction steps', 14, 47, 'abc'],
  ['§2 Anabelian prelims', 48, 59, 'prep'], ['§3 Mono-anabelian', 60, 89, 'prep'], ['§4 Archimedean', 90, 103, 'prep'],
  ['§5 Log-shells', 104, 110, 'prep'], ['§6 Tempered π₁', 111, 125, 'prep'], ['§7 Étale theta', 126, 167, 'prep'],
  ['§8 Frobenioids', 168, 182, 'prep'], ['§9 NF evaluation', 183, 198, 'prep'],
  ['§10 Hodge theatres', 199, 250, 'iut'], ['§11 H-A evaluation', 251, 306, 'iut'], ['§12 Log-links', 307, 327, 'iut'],
  ['§13 Multiradial', 328, 362, 'iut'],
  ['App. A–C', 363, 378, 'back'], ['Index', 379, 406, 'back'], ['References', 407, 409, 'back'],
];
const GROUPS = {
  front: ['front matter', '#b9aecb'], abc: ['§1: where abc is', '#e85d8a'], prep: ['§2–§9: preparation', '#3a74c4'],
  iut: ['§10–§13: IUT proper', '#7a5cc2'], back: ['appendices, index, references', '#c98a10'],
};
const pagesIn = g => PAGES.filter(p => p[3] === g).reduce((s, p) => s + p[2] - p[1] + 1, 0);
const TOTAL = PAGES.reduce((s, p) => s + p[2] - p[1] + 1, 0);
if (TOTAL !== 409) { console.error(`page table sums to ${TOTAL}, expected 409`); process.exit(1); }

const ex0 = EX[1];                                            // 1 + 2400 = 2401, the funfun article's triple
const V = {
  total: TOTAL, p_abc: pagesIn('abc'), p_prep: pagesIn('prep'), p_iut: pagesIn('iut'), p_index: 28,
  pct_abc: Math.round(100 * pagesIn('abc') / TOTAL), pct_iut: Math.round(100 * pagesIn('iut') / TOTAL),
  dstar: DSTAR,
  h_eps1: sci(H_EPS1), h_s1: sci(H_S1), dig_eps1: sci(digitsOf(H_EPS1), 0), dig_s1: sci(digitsOf(H_S1), 0),
  nex: EX.length,
  h_min: fx(Math.min(...EX.map(e => e.heightBound.corTwoTwo.logQAll)), 2),
  h_max: fx(Math.max(...EX.map(e => e.heightBound.corTwoTwo.logQAll)), 2),
  eps_min: sci(Math.min(...EX.map(e => e.heightBound.corTwoTwo.epsE))),
  ex_l: ex0.data.l, ex_logq: fx(ex0.data.logQ), ex_logqall: fx(ex0.heightBound.corTwoTwo.logQAll),
  ex_bad: ex0.data.VSet.filter(v => v.inVBadMod).map(v => v.p).join(', '),
  ex_sum: ex0.data.VSet.filter(v => v.inVBadMod).map(v => `${v.ordQ}\\log ${v.p}`).join(' + '),
};

/* ------------------------------------------------------------------ tables */
const T = {};
T.level = `<table class="num"><tr><th>example</th><th>\\(l\\)</th><th>\\(h = \\log q^{\\forall}\\)</th><th>\\(\\sqrt h\\) (must be \\(&lt; l\\))</th>
<th>\\(\\varepsilon_E\\) (must be \\(\\le \\min\\{1,\\varepsilon\\}\\))</th><th>toolkit says</th><th>status in Prop. 1.15</th></tr>` +
  EX.map(e => { const c = e.heightBound.corTwoTwo; return `<tr><td>${esc(e.short)}</td><td>${e.data.l}</td><td>${fx(c.logQAll, 2)}</td><td>${fx(Math.sqrt(c.logQAll), 2)}</td>
<td>${sci(c.epsE)}</td><td>“${c.holds ? 'holds' : 'fails'}”</td><td>in the exceptional set</td></tr>`; }).join('') + '</table>';

T.ram = `<table class="num"><tr><th>example</th><th>place</th><th>\\(\\operatorname{ord}_v(q_v)\\)</th><th>\\(l\\)</th>
<th>\\(\\operatorname{ord}(q_v^{1/2l})\\)</th><th>smallest possible \\(e(K_v/\\mathbb{Q}_p)\\)</th><th>toolkit's \\(e_K\\)</th></tr>` +
  EX.flatMap(e => e.data.VSet.filter(v => v.inVBadMod).map(v => {
    const two = 2 * e.data.l, g = gcd(two, v.ordQ);
    return `<tr><td>${esc(e.short)}</td><td>\\(v_{${v.p}}\\)</td><td>${v.ordQ}</td><td>${e.data.l}</td><td>${v.ordQ / g}/${two / g}</td><td>${two / g}</td><td>${v.eK}</td></tr>`;
  })).join('') + '</table>';

T.diff = `<table class="num"><tr><th>example</th><th>\\(l\\)</th><th>toolkit's estimate of \\(\\log \\mathfrak{d}^K\\)</th>
<th>Lemma 1.11 (1): \\(\\log\\mathfrak{d}^{F_{\\mathrm{tpd}}} + \\log\\mathfrak{f}^{F_{\\mathrm{tpd}}} + 2\\log l + 21\\)</th><th>inside the bound?</th></tr>` +
  EX.map(e => { const b = e.heightBound.logDTpd + e.heightBound.logFTpd + 2 * Math.log(e.data.l) + 21, t = e.data.K.logDifferentEstimate;
    return `<tr><td>${esc(e.short)}</td><td>${e.data.l}</td><td>${fx(t, 3)}</td><td>${fx(b, 3)}</td><td>${t <= b ? 'yes' : 'NO'}</td></tr>`; }).join('') + '</table>';

T.miracle = `<table class="num"><tr><th>example</th><th>\\(l\\)</th><th>height side \\(\\frac{l+1}{4}\\)</th><th>different side \\(\\frac{l+5}{4}\\)</th>
<th>ratio</th><th>Θ-pilot \\(-\\frac{l+1}{24}\\log q\\) (Lemma 1.10)</th><th>toolkit's Θ-pilot</th></tr>` +
  EX.map(e => { const l = e.data.l, mine = -(l + 1) / 24 * e.data.logQ;
    if (Math.abs(mine - e.gaussian.thetaPilot) > 1e-6) { console.error(`Θ-pilot mismatch for ${e.id}`); process.exit(1); }
    return `<tr><td>${esc(e.short)}</td><td>${l}</td><td>${fx((l + 1) / 4, 2)}</td><td>${fx((l + 5) / 4, 2)}</td><td>${fx((l + 5) / (l + 1), 3)}</td><td>${fx(mine, 6)}</td><td>${fx(e.gaussian.thetaPilot, 6)}</td></tr>`; }).join('') + '</table>';

/* ------------------------------------------------------------------ figures */
const C = { ink: '#2a2433', soft: '#6b6178', rule: '#e4dcef', sakura: '#e85d8a', matcha: '#3f8f5a', sora: '#3a74c4', yuzu: '#c98a10', fuji: '#7a5cc2' };
const SANS = `font-family="Inter, 'DejaVu Sans', 'Noto Serif JP', sans-serif"`;
const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${SANS} font-size="${o.size || 9}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'start'}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.style ? ` font-style="${o.style}"` : ''}>${s}</text>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const arrowDefs = `<defs>${Object.entries(C).map(([k, c]) => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>`;
const S = {};

/* where the 409 pages go */
S.pages = (() => {
  const W = 640, x0 = 10, bw = W - 20, y0 = 26, bh = 34; let b = '', x = x0;
  b += txt(x0, 14, `Where the ${TOTAL} pages go`, { size: 10, weight: 700 });
  PAGES.forEach(([name, a, z, g]) => {
    const n = z - a + 1, w = bw * n / TOTAL;
    b += `<rect x="${x.toFixed(2)}" y="${y0}" width="${Math.max(w - 1.2, .6).toFixed(2)}" height="${bh}" rx="2" fill="${GROUPS[g][1]}"/>`;
    if (w > 22) b += txt(x + w / 2 - .6, y0 + bh / 2 + 3.2, n, { size: 8.5, fill: '#fff', anchor: 'middle', weight: 700 });
    const m = name.match(/^§(\d+)/); if (m && w > 9) b += txt(x + w / 2 - .6, y0 + bh + 11, '§' + m[1], { size: 7.5, fill: C.soft, anchor: 'middle' });
    x += w;
  });
  let lx = x0;
  Object.entries(GROUPS).forEach(([g, [label, col]]) => {
    const s = `${label} · ${pagesIn(g)} pp`;
    b += `<rect x="${lx}" y="${y0 + bh + 22}" width="9" height="9" rx="2" fill="${col}"/>` + txt(lx + 13, y0 + bh + 30, s, { size: 8, fill: C.soft });
    lx += 20 + s.length * 4.35;
  });
  return svg(W, y0 + bh + 38, b);
})();

/* the chain of reductions */
S.route = (() => {
  const W = 640, H = 196; let b = arrowDefs;
  const box = (x, y, w, h, col, title, l1, l2, ref) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${col}" stroke-width="1.6"/>` +
    txt(x + w / 2, y + 16, title, { anchor: 'middle', weight: 700, size: 9.2, fill: col }) + txt(x + w / 2, y + 30, l1, { anchor: 'middle', size: 8 }) +
    (l2 ? txt(x + w / 2, y + 41, l2, { anchor: 'middle', size: 8 }) : '') + txt(x + w / 2, y + h - 6, ref, { anchor: 'middle', size: 7.2, fill: C.soft });
  const bw = 114, gap = 14, y = 30, h = 66;
  const boxes = [
    [C.sakura, 'abc conjecture', 'max(|a|,|b|,|c|) ≤', 'rad(abc)^(1+ε), almost all', 'Cor. 0.2'],
    [C.yuzu, 'Vojta for curves', 'ht ≲ (1+ε)(log-diff', '+ log-cond) on U_X', 'Thm. 0.1'],
    [C.matcha, 'P¹ ∖ {0,1,∞} only', 'same, on a compactly', 'bounded subset K_V', 'Prop. 1.2 · Belyi maps'],
    [C.sora, 'pick initial Θ-data', 'choose l ≈ √h·(log)', 'outside a finite set Exc', 'Prop. 1.15 · PNT'],
    [C.fuji, 'the IUT inequality', '−|log q| ≤ −|log Θ|', '', 'Cor. 13.13 · §2–§13'],
  ];
  boxes.forEach((bx, i) => {
    const x = 6 + i * (bw + gap); b += box(x, y, bw, h, ...bx);
    if (i) b += `<path d="M${x - 2} ${y + h / 2}L${x - gap + 3} ${y + h / 2}" stroke="${C.soft}" stroke-width="1.4" marker-end="url(#ar-soft)"/>`;
  });
  b += txt(6, 16, 'Reading right to left is the proof; reading left to right is how the survey reduces the problem.', { size: 8.4, fill: C.soft, style: 'italic' });
  const y2 = y + h + 26;
  const notes = [
    [6, 'take X = P¹, D = {0,1,∞}, d = 1;', 'evaluate at the point −a/b'],
    [6 + (bw + gap), 'coverings + a non-critical Belyi map', 'move every curve to the λ-line'],
    [6 + 2 * (bw + gap), 'the place 2 and the archimedean', 'place must be in the support'],
    [6 + 3 * (bw + gap), '“no deep things happen in', 'these reduction steps” (Rem. 1.15.2)'],
    [6 + 4 * (bw + gap), '“0 ≲ −(large number)', '+ (mild indeterminacies)”'],
  ];
  notes.forEach(([x, a, c]) => { b += txt(x + bw / 2, y2, a, { anchor: 'middle', size: 7.4, fill: C.soft }) + txt(x + bw / 2, y2 + 10, c, { anchor: 'middle', size: 7.4, fill: C.soft }); });
  const pg = [[`${pagesIn('abc')} pages`, 6 + 1.5 * (bw + gap) + bw / 2, 3 * (bw + gap) - gap, C.sakura], [`${pagesIn('prep') + pagesIn('iut')} pages`, 6 + 4 * (bw + gap) + bw / 2, bw, C.fuji]];
  pg.forEach(([s, cx, w, col]) => { b += `<rect x="${cx - w / 2}" y="${y2 + 24}" width="${w}" height="16" rx="8" fill="${col}" opacity=".14"/>` + txt(cx, y2 + 35.5, s, { anchor: 'middle', size: 8.4, weight: 700, fill: col }); });
  return svg(W, H, b);
})();

/* the level gauge: where our examples sit relative to where the theorem starts to speak */
S.level = (() => {
  const W = 640, H = 178, x0 = 46, x1 = W - 20, y = 78; let b = arrowDefs;
  const p10 = h => { const [m, e] = h.toExponential(1).split('e+'); return `${m}·10<tspan baseline-shift="super" font-size="6">${e}</tspan>`; };
  const lmin = 0, lmax = 44, X = h => x0 + (Math.log10(h) - lmin) / (lmax - lmin) * (x1 - x0);
  b += txt(10, 14, 'The level gauge: h = log q∀ on a logarithmic scale', { size: 10, weight: 700 });
  b += `<rect x="${x0}" y="${y - 7}" width="${x1 - x0}" height="14" rx="7" fill="#f3eef9"/>`;
  b += `<rect x="${X(H_EPS1)}" y="${y - 7}" width="${x1 - X(H_EPS1)}" height="14" rx="7" fill="${C.matcha}" opacity=".28"/>`;
  b += `<rect x="${X(H_S1)}" y="${y - 7}" width="${x1 - X(H_S1)}" height="14" rx="7" fill="${C.matcha}" opacity=".55"/>`;
  for (let e = 0; e <= 44; e += 4) b += `<path d="M${X(10 ** e)} ${y + 9}v5" stroke="${C.soft}" stroke-width=".8"/>` + txt(X(10 ** e), y + 25, e === 0 ? '1' : `10<tspan baseline-shift="super" font-size="6">${e}</tspan>`, { anchor: 'middle', size: 7.8, fill: C.soft });
  const hs = EX.map(e => e.heightBound.corTwoTwo.logQAll);
  const xa = X(Math.min(...hs)), xb = X(Math.max(...hs));
  b += `<rect x="${xa - 3}" y="${y - 10}" width="${xb - xa + 6}" height="20" rx="6" fill="${C.sakura}"/>`;
  b += `<path d="M${(xa + xb) / 2} ${y - 13}V${y - 30}" stroke="${C.sakura}" stroke-width="1.2"/>` + txt(x0, y - 36, `all ${EX.length} toolkit examples: h between ${V.h_min} and ${V.h_max}`, { size: 8.4, fill: C.sakura, weight: 700 }) + txt(x0, y - 47, 'YOU ARE HERE  ·  現在地', { size: 7.6, fill: C.sakura });
  const mark = (h, label1, label2, dy) => `<path d="M${X(h)} ${y - 12}V${y + 34 + dy}" stroke="${C.matcha}" stroke-width="1.3" stroke-dasharray="3 2"/>` +
    txt(X(h) - 4, y + 44 + dy, label1, { size: 8, fill: C.matcha, weight: 700, anchor: 'end' }) + txt(X(h) - 4, y + 54 + dy, label2, { size: 7.4, fill: C.soft, anchor: 'end' });
  b += mark(H_EPS1, `h ≈ ${p10(H_EPS1)}: from here on, ε_E ≤ 1`, 'below this, the “ε” in (1+ε) is bigger than 1', 0);
  b += mark(H_S1, `h ≈ ${p10(H_S1)}: from here on, (s1) √h ≥ ξ + η`, `with the toolkit's value η = 5·10<tspan baseline-shift="super" font-size="6">20</tspan> for η_prm`, 26);
  b += txt(x1, y - 14, 'the theorem speaks here →', { size: 8, fill: C.matcha, anchor: 'end', weight: 700 });
  return svg(W, H, b);
})();

/* miracle identity: the two averages for growing l */
S.miracle = (() => {
  const W = 640, H = 190, x0 = 50, x1 = 420, y0 = 150, y1 = 28; let b = '';
  const ls = [5, 7, 11, 13, 17, 23, 31, 47, 67, 101, 151, 251, 401, 601, 1009];
  const X = l => x0 + (Math.log10(l) - Math.log10(5)) / (Math.log10(1009) - Math.log10(5)) * (x1 - x0);
  const Y = r => y0 - (r - 1) / (2 - 1) * (y0 - y1);
  b += txt(10, 14, 'The miracle identity at finite l: (different side) / (height side) = (l+5)/(l+1)', { size: 10, weight: 700 });
  [1, 1.25, 1.5, 1.75, 2].forEach(r => { b += `<path d="M${x0} ${Y(r)}H${x1}" stroke="${r === 1 ? C.matcha : C.rule}" stroke-width="${r === 1 ? 1.4 : .8}"/>` + txt(x0 - 6, Y(r) + 3, r.toFixed(2), { size: 7.8, anchor: 'end', fill: C.soft }); });
  [5, 10, 100, 1000].forEach(l => { b += `<path d="M${X(l)} ${y0}v4" stroke="${C.soft}" stroke-width=".8"/>` + txt(X(l), y0 + 14, l, { size: 7.8, anchor: 'middle', fill: C.soft }); });
  b += txt((x0 + x1) / 2, y0 + 27, 'the prime l (log scale)', { size: 8, anchor: 'middle', fill: C.soft });
  b += `<path d="${ls.map((l, i) => `${i ? 'L' : 'M'}${X(l).toFixed(1)} ${Y((l + 5) / (l + 1)).toFixed(1)}`).join('')}" fill="none" stroke="${C.fuji}" stroke-width="2"/>`;
  ls.forEach(l => { b += `<circle cx="${X(l)}" cy="${Y((l + 5) / (l + 1))}" r="2.2" fill="${C.fuji}"/>`; });
  const used = [...new Set(EX.map(e => e.data.l))];
  used.forEach(l => { const r = (l + 5) / (l + 1); b += `<circle cx="${X(l)}" cy="${Y(r)}" r="5" fill="#fff" stroke="${C.sakura}" stroke-width="2"/>` + txt(X(l) + 8, Y(r) - 5, `l = ${l}: ${r.toFixed(3)}`, { size: 8, fill: C.sakura, weight: 700 }); });
  b += txt(x1 - 2, Y(1.88), 'in the limit the main term is exactly 1  ·  真実はいつも一つ', { size: 8, fill: C.matcha, anchor: 'end', weight: 700 });
  /* right panel: the identity itself */
  const px = 446, pw = W - px - 6;
  b += `<rect x="${px}" y="24" width="${pw}" height="150" rx="9" fill="#fff8e6" stroke="#f0d79b"/>`;
  b += txt(px + pw / 2, 41, 'Remark 1.15.3', { anchor: 'middle', size: 8.6, weight: 700, fill: C.yuzu });
  const rows = [['6', 'λ-line over j-line'], ['× 1/2', 'theta: a double cover'], ['× 1/2²', 'exponent is quadratic'], ['× 1/3', 'Σ j² ≈ n³/3'], ['=', ''], ['1/2', 'differents are linear'], ['× 1/2', 'Σ j ≈ n²/2']];
  rows.forEach(([a, c], i) => { b += txt(px + 52, 58 + i * 15.5, a, { anchor: 'end', size: 9.4, weight: 700, fill: a === '=' ? C.sakura : C.ink }) + txt(px + 60, 58 + i * 15.5, c, { size: 7.8, fill: C.soft }); });
  b += txt(px + pw / 2, 168, 'both sides = 1/4', { anchor: 'middle', size: 8.6, weight: 700, fill: C.sakura });
  return svg(W, H, b);
})();

/* log(a^N) ≠ (log a)^N: the square that does not commute, and the infinite column that fixes it */
S.square = (() => {
  const W = 640, H = 200; let b = arrowDefs;
  const a = 2, N = 4, up = Math.log(a ** N), across = Math.log(a) ** N;
  b += txt(10, 14, 'Why one log-link is not enough (start of §13)', { size: 10, weight: 700 });
  const dot = (x, y, label, col = C.ink) => `<circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="${col}" stroke-width="1.6"/>` + txt(x, y + 3.2, label, { anchor: 'middle', size: 8.6, weight: 700, fill: col });
  const L = 70, R = 210, T2 = 58, B = 150;
  b += `<path d="M${L + 17} ${B}H${R - 18}" stroke="${C.sakura}" stroke-width="1.6" marker-end="url(#ar-sakura)"/><path d="M${L + 17} ${T2}H${R - 18}" stroke="${C.sakura}" stroke-width="1.6" marker-end="url(#ar-sakura)"/>`;
  b += `<path d="M${L} ${B - 17}V${T2 + 18}" stroke="${C.sora}" stroke-width="1.6" marker-end="url(#ar-sora)"/><path d="M${R} ${B - 17}V${T2 + 18}" stroke="${C.sora}" stroke-width="1.6" marker-end="url(#ar-sora)"/>`;
  b += dot(L, B, 'a') + dot(R, B, 'aᴺ') + dot(L, T2, 'log a') + dot(R, T2, '?', C.sakura);
  b += txt((L + R) / 2, B + 13, 'Θ: x ↦ xᴺ', { anchor: 'middle', size: 8, fill: C.sakura }) + txt((L + R) / 2, T2 - 7, 'Θ: x ↦ xᴺ', { anchor: 'middle', size: 8, fill: C.sakura });
  b += txt(L - 8, (T2 + B) / 2 + 3, 'log', { anchor: 'end', size: 8, fill: C.sora }) + txt(R + 8, (T2 + B) / 2 + 3, 'log', { size: 8, fill: C.sora });
  b += txt(L - 40, B + 34, `a = ${a}, N = ${N}:   right then up = log(aᴺ) = ${up.toFixed(3)},  but  up then right = (log a)ᴺ = ${across.toFixed(3)}`, { size: 8.4, fill: C.ink });
  b += txt(L - 40, B + 46, 'Two different save files. The square does not commute.', { size: 8.2, fill: C.soft, style: 'italic' });
  /* the infinite column */
  const cx = 420, cx2 = 540;
  [0, 1, 2, 3].forEach(i => {
    const y = 156 - i * 34;
    [cx, cx2].forEach(x => { b += `<circle cx="${x}" cy="${y}" r="6" fill="${C.fuji}"/>`; if (i < 3) b += `<path d="M${x} ${y - 8}V${y - 25}" stroke="${C.sora}" stroke-width="1.4" marker-end="url(#ar-sora)"/>`; });
  });
  [cx, cx2].forEach(x => { b += txt(x, 38, '⋮', { anchor: 'middle', size: 12, fill: C.sora }) + txt(x, 178, '⋮', { anchor: 'middle', size: 12, fill: C.sora }); });
  b += `<path d="M${cx + 9} 122H${cx2 - 10}" stroke="${C.sakura}" stroke-width="1.6" marker-end="url(#ar-sakura)"/>` + txt((cx + cx2) / 2, 116, 'Θ-link', { anchor: 'middle', size: 8, fill: C.sakura });
  b += `<rect x="${cx - 18}" y="26" width="36" height="160" rx="18" fill="none" stroke="${C.fuji}" stroke-dasharray="4 3"/><rect x="${cx2 - 18}" y="26" width="36" height="160" rx="18" fill="none" stroke="${C.fuji}" stroke-dasharray="4 3"/>`;
  b += txt(cx2 + 26, 70, 'a whole column', { size: 8, fill: C.fuji }) + txt(cx2 + 26, 81, 'is invariant under', { size: 8, fill: C.fuji }) + txt(cx2 + 26, 92, 'the vertical shift,', { size: 8, fill: C.fuji }) + txt(cx2 + 26, 103, 'so describe the', { size: 8, fill: C.fuji }) + txt(cx2 + 26, 114, 'column, not a dot', { size: 8, fill: C.fuji });
  b += `<path d="M300 100H360" stroke="${C.soft}" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#ar-soft)"/>` + txt(330, 92, 'the fix', { anchor: 'middle', size: 8, fill: C.soft });
  return svg(W, H, b);
})();

/* hanko-style marking stamps for the report card */
function stamp(kind) {
  const m = { ok: ['#3f8f5a', '合', '格'], fix: ['#e85d8a', '訂', '正'], note: ['#c98a10', '注', '意'], new: ['#3a74c4', '新', '知'] }[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="27" height="27" style="vertical-align:middle"><g transform="rotate(-9 17 17)"><circle cx="17" cy="17" r="15" fill="none" stroke="${m[0]}" stroke-width="2.2"/><circle cx="17" cy="17" r="12" fill="none" stroke="${m[0]}" stroke-width=".7"/>` +
    `<text x="17" y="15.5" text-anchor="middle" font-family="'Noto Serif JP', serif" font-weight="700" font-size="10.5" fill="${m[0]}">${m[1]}</text><text x="17" y="27" text-anchor="middle" font-family="'Noto Serif JP', serif" font-weight="700" font-size="10.5" fill="${m[0]}">${m[2]}</text></g></svg>`;
}

/* ------------------------------------------------------------------ assemble */
let html = fs.readFileSync(SRC_HTML, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/\{\{stamp:(\w+)\}\}/g, (m, k) => stamp(k));
html = html.replace(/\{\{table:(\w+)\}\}/g, (m, k) => { if (!(k in T)) { console.error(`unknown table ${m}`); process.exit(1); } return T[k]; });
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in V)) { console.error(`unknown placeholder ${m}`); process.exit(1); } return String(V[k]); });
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tex = (s, displayMode) => katex.renderToString(unent(s), { displayMode, throwOnError: true, strict: 'ignore', output: 'html' });
html = html.replace(/\\\[([\s\S]+?)\\\]/g, (m, s) => tex(s, true));
html = html.replace(/\\\(([\s\S]+?)\\\)/g, (m, s) => tex(s, false));
/* figures go in after the math pass so that nothing inside an SVG is mistaken for TeX */
html = html.replace(/\{\{svg:(\w+)\}\}/g, (m, k) => { if (!(k in S)) { console.error(`unknown figure ${m}`); process.exit(1); } return S[k]; });

const fileURL = p => 'file://' + p.split(path.sep).map(encodeURIComponent).join('/');
const katexDist = path.join(NM, 'katex', 'dist');
const katexCSS = fs.readFileSync(path.join(katexDist, 'katex.min.css'), 'utf8').replace(/url\(fonts\//g, `url(${fileURL(path.join(katexDist, 'fonts'))}/`);
const fontCSS = (pkg, weights) => { const dir = path.join(NM, '@fontsource', pkg);
  return weights.map(w => fs.readFileSync(path.join(dir, `${w}.css`), 'utf8').replace(/url\(\.\/files\//g, `url(${fileURL(path.join(dir, 'files'))}/`)).join('\n'); };
html = html.replace('</head>', `<style>${katexCSS}\n${fontCSS('source-serif-4', ['400', '400-italic', '600', '700', '700-italic'])}\n${fontCSS('noto-serif-jp', ['400', '700'])}</style>\n</head>`);

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
    <span>The Gokun Strategy Guide · what Yamashita's survey taught the toolkit</span>
    <span>— <span class="pageNumber"></span> / <span class="totalPages"></span> —</span></div>`;
  await page.pdf({
    path: OUT_PDF, format: 'Letter', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer,
    margin: { top: '16mm', bottom: '18mm', left: '17mm', right: '17mm' },
  });
  await browser.close();
  console.log(`wrote ${path.relative(ROOT, OUT_PDF)}`);
})();
