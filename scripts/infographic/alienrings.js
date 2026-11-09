#!/usr/bin/env node
/*
 * scripts/infographic/alienrings.js — "Alien ring systems ☆ 異世界の環", a vertical
 * (1080 × 1920) kawaii infographic of the mutually alien copies of ring theory in IUT.
 *
 *   node scripts/infographic/alienrings.js            → docs/alienrings-infographic.svg (master)
 *                                                      docs/alienrings-infographic.png (1080×1920)
 *   node scripts/infographic/alienrings.js --svg-only   skip the PNG
 *
 * Every Hodge theater of the log-theta-lattice lives in its own universe with its own copy
 * of the ring theory, and the links between them (Θ-link, log-link) respect only part of the
 * ring structure ([Alien] §1, §2.7, §3; [IUTchI] Cor 3.7, Rem 3.9.3; [IUTchIII] Def 1.1,
 * Prop 1.2–1.3, Thm 1.5). The page draws that with real geometry:
 *   1  a ring is two dances: + and × on the Gaussian integers Z[i]
 *   2  the Θ-link q̲^{j²} ↦ q̲ between two universes, and what crosses it (the table
 *      `iut walk` prints under "Mutually alien copies")
 *   3  the log-link at the archimedean place: log unrolls C^× into a strip
 *   4  mono-anabelian transport: Kummer-detach, étale-transport, re-attach
 *   5  the log-shell at ∞, the closed disc of radius π, and
 *   6  the Gaussian integral of [Alien] §1, two alien copies of ∫e^{−x²}
 * Each card has jokes from Japanese pop culture (text references only; the mascots and
 * planets are original drawings). The numbers are parsed from `iut walk` and `iut run`, and
 * each process must end in "=> ok".
 *
 * The rounded type is M PLUS Rounded 1c (SIL Open Font License, fonts/mplus-rounded-1c/OFL.txt),
 * the vendored fontsource subsets shared with hodgetheaters-kawaii.js, embedded into the SVG.
 * Math stays in DejaVu Sans.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const FONTDIR = path.join(__dirname, 'fonts', 'mplus-rounded-1c');
const OUT_SVG = path.join(ROOT, 'docs', 'alienrings-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'alienrings-infographic.png');
const W = 1080, H = 1920;

/* ------------------------------------------------------------ data */
const BIN = path.join(SRC, 'iut');
if (!fs.existsSync(BIN)) { console.error('src/iut is not built: run `make -C src` first'); process.exit(1); }
const iut = args => execFileSync(BIN, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const fail = msg => { console.error(msg); process.exit(1); };
const grab = (s, re, what) => { const m = s.match(re); if (!m) fail('could not read ' + what); return m; };
const run = p => {
  const o = iut(['run', p]);
  if (!/=> ok\s*$/.test(o)) fail(`iut run ${p} did not end in "=> ok"`);
  return o;
};

const walk = iut(['walk']);
const g0 = grab(walk, /name\s+: (abc\([\d,]+\)) l=(\d+)/, 'example');
const example = g0[1], l = +g0[2];
const lstar = (l - 1) / 2;
const logq = +grab(walk, /log\(q\)\s+: ([\d.]+)\s+\|log\(q\)\| = log\(q\)\/2l = ([\d.]+)/, 'log q')[1];
const abslogq = +grab(walk, /\|log\(q\)\| = log\(q\)\/2l = ([\d.]+)/, '|log q|')[1];

/* the "Mutually alien copies" table */
const alienSec = walk.split('Mutually alien copies')[1];
if (!alienSec) fail('iut walk printed no "Mutually alien copies" section');
const univ = grab(alienSec, /†HT = \w+ \(universe #(\d+)\)\s+‡HT = \w+ \(universe #(\d+)\)/, 'universes');
const AV = 'v3';
const rowRe = new RegExp(`\\n  ${AV}\\s+Π_v#(\\d+)\\s+Π_v#(\\d+)\\s+ALIEN[^\\n]*\\n\\s+G_v#(\\d+)\\s+G_v#(\\d+)\\s+shared[^\\n]*\\n\\s+O×μ#(\\d+)\\s+O×μ#(\\d+)\\s+shared[^\\n]*\\n\\s+(q̲\\^\\{[\\d,]+\\})\\s+(q̲\\^\\{1\\})\\s+DILATED`);
const ar = grab(alienSec, rowRe, 'alien row at ' + AV);
const alien = { v: AV, piD: ar[1], piDD: ar[2], gD: ar[3], gDD: ar[4], oD: ar[5], oDD: ar[6], thetaSet: ar[7], qSet: ar[8] };
if (alien.piD === alien.piDD) fail('Π_v is shared across the Θ-link: the copies are not alien');
if (alien.gD !== alien.gDD || alien.oD !== alien.oDD) fail('G_v or O×μ not shared across the Θ-link');
const nAlien = (alienSec.match(/ALIEN: ring\/holomorphic structure not shared/g) || []).length;
const dilation = +grab(alienSec, /dilated by l\(l\+1\)\/12 = ([\d.]+)/, 'dilation')[1];
const degs = grab(alienSec, /arithmetic degrees: † ([-\d.]+)\s+vs\s+‡ ([-\d.]+)/, 'degrees');
const degTheta = +degs[1], degQ = +degs[2];
const exps = grab(walk, /Θ̲_v evaluated at j ∈ F_l\^\*:\s+([^\n]+)/, 'theta values')[1].match(/\^(\d+)/g).map(s => +s.slice(1));
if (exps.length !== lstar || exps.some((e, i) => e !== (i + 1) ** 2)) fail('theta values are not q̲^{j²}, j = 1..l*');
const shells = [...walk.split('Mutually alien copies')[0].matchAll(/\n    (v\d+)\s+p\* = (\d+)\s+I_v = (p\^\{-?\d+\}·O_v)/g)].slice(0, 5).map(m => ({ v: m[1], pstar: +m[2], I: m[3] }));
if (!shells.length) fail('no log-shells in iut walk');
const archShell = grab(walk, /vinf\s+I_v = (closed disc of radius π) ⊆ C/, 'archimedean log-shell')[1];

const out = {};
for (const p of ['AssembleThetaHodgeTheater', 'ApplyLogLinkStrip', 'ChainLogLinks', 'MakeLogShells', 'CheckBicoric', 'TransportMonoAnabelian', 'ComputeGaussian']) out[p] = run(p);
if (!/\[ ok \] ThetaLinkNotRing/.test(out.AssembleThetaHodgeTheater)) fail('ThetaLinkNotRing not ok');
const ll = grab(out.ApplyLogLinkStrip, /Π kept \((\d+) = (\d+)\), units renewed \((\d+) → (\d+)\), (\d+) log-shells; coric D (\d) D⊢ (\d); ring preserved (\d); log-volume compatible (\d)/, 'log-link strip');
const logLink = { piA: ll[1], piB: ll[2], uA: ll[3], uB: ll[4], shells: +ll[5], ring: ll[8] === '1', vol: ll[9] === '1' };
if (logLink.piA !== logLink.piB || logLink.uA === logLink.uB || logLink.ring) fail('unexpected log-link report');
const chain = grab(out.ChainLogLinks, /vertical chain of (\d+) HTs in column 0 \(universes ([\d ]+)\)/, 'log chain');
const shellOK = (out.MakeLogShells.match(/\[ ok \] LogShellProperties/g) || []).length;
const bic = grab(out.CheckBicoric, /\(iv\) log-shells bi-coric (\d)/, 'bi-coric log-shells')[1] === '1';
const tr = out.TransportMonoAnabelian;
const trIn = +grab(tr, /run: Frobenius-like input at \(0,0\): Θ-pilot log-volume\s+([-\d.]+)/, 'transport input')[1];
const trMid = +grab(tr, /run: Kummer-detach at \(0,0\).*?\s([-\d.]+)\n/, 'transport mass')[1];
const trOut = +grab(tr, /run: re-attach at \(1,0\): q-pilot log-volume.*?\s([-\d.]+)\n/, 'transport output')[1];
const gau = out.ComputeGaussian;
const gI2 = +grab(gau, /Step  3 .*?\s([\d.]+)\s+↔/, 'I²')[1];
const gRad = +grab(gau, /Step 10 .*?\s([\d.]+)\s+↔/, 'radial')[1];
const gAng = +grab(gau, /Step 11 .*?\s([\d.]+)\s+↔/, 'angular')[1];
const gNum = grab(gau, /numerical ∫e\^\{−x²\} = ([\d.]+), √π = ([\d.]+)/, 'Gaussian');

const data = {
  example, l, lstar, logq, abslogq, univ: [univ[1], univ[2]], alien, nAlien, dilation, degTheta, degQ, exps, shells, archShell,
  logLink, chain: { n: +chain[1], univ: chain[2].trim().split(/\s+/) }, shellOK, bic, trIn, trMid, trOut,
  gau: { I2: gI2, rad: gRad, ang: gAng, num: gNum[1], sqrtpi: gNum[2] },
};

/* ------------------------------------------------------------ fonts */
const fontJson = JSON.parse(fs.readFileSync(path.join(FONTDIR, 'fonts.json'), 'utf8'));
const fontCSS = fontJson.map(f => `@font-face{font-family:'M PLUS Rounded 1c';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTDIR, f.file)).toString('base64')}) format('woff2');unicode-range:${f.range};}`).join('\n');
/* every Japanese character on the page must be in a vendored subset, or it would fall back */
const covered = cp => fontJson.some(f => f.weight === 800 && f.range.split(',').some(r => { const [a, b] = r.trim().replace(/U\+/g, '').split('-').map(h => parseInt(h, 16)); return cp >= a && cp <= (b ?? a); }));
const JP_TEXT = 'ようこそ異世界へ!異世界の環環はふたりの漫才テータリンクログリンク対数殻エタール輸送ガウス積分ボケツッコミ';
const missing = [...new Set(JP_TEXT)].filter(c => !covered(c.codePointAt(0)));
if (missing.length) fail('M PLUS Rounded 1c subsets missing for: ' + missing.join('') + ' (vendor them from @fontsource/m-plus-rounded-1c)');

/* ------------------------------------------------------------ layout (runs in Chromium) */
function layout(D) {
  const W = 1080, H = 1920, M = 30;
  const C = {
    bg: '#fff6fa', panel: '#ffffff', ink: '#3d2b45', ink2: '#6e5a75', muted: '#a593ab', blush: '#ff9fbf', line: '#f3dbe6',
    pink: '#ec6fae', purple: '#9b7bea', orange: '#f08a4b', blue: '#4aa3f0', green: '#2fbf8f', gold: '#d99a00', red: '#f0607a', leaf: '#5fa83f',
    series: ['#9b7bea', '#f08a4b', '#4aa3f0', '#2fbf8f', '#d99a00', '#f0607a', '#5fa83f', '#ec6fae'],
  };
  const R = "'M PLUS Rounded 1c', 'DejaVu Sans', 'WenQuanYi Zen Hei', sans-serif";
  const SYM = "'DejaVu Sans', 'DejaVu Serif', 'FreeSerif', 'M PLUS Rounded 1c', sans-serif";
  const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, monospace";

  const cv = document.createElement('canvas').getContext('2d');
  const measure = (t, font, size, weight) => { cv.font = `${weight || 500} ${size}px ${font}`; return cv.measureText(t).width; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const out = [];
  const f1 = (v, d = 1) => Number(v).toFixed(d);
  const text = (x, y, s, o = {}) => {
    const font = o.font || R, size = o.size || 16, weight = o.weight || 500, fill = o.fill || C.ink, anchor = o.anchor || 'start';
    out.push(`<text x="${f1(x)}" y="${f1(y)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${o.extra || ''}>${esc(s)}</text>`);
    return measure(s, font, size, weight);
  };
  const attrs = o => `${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}" stroke-linecap="round" stroke-linejoin="round"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.filter ? ` filter="url(#${o.filter})"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}`;
  const rect = (x, y, w, h, o = {}) => out.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}"${attrs(o)}/>`);
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}"${attrs(o)}/>`);
  const line = (x1, y1, x2, y2, o = {}) => out.push(`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${attrs({ stroke: C.ink, ...o })}/>`);
  const circle = (x, y, r, o = {}) => out.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r, 2)}" fill="${o.fill || 'none'}"${attrs(o)}/>`);
  const ellipse = (x, y, rx, ry, o = {}) => out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${o.fill || 'none'}"${attrs(o)}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const mix = c => Math.round(255 + (c - 255) * a); return `rgb(${mix(r)},${mix(g)},${mix(b)})`; };
  const shade = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const mix = c => Math.round(c * (1 - a)); return `rgb(${mix(r)},${mix(g)},${mix(b)})`; };

  /* break s into lines of at most `width` (the first line `indent` shorter) */
  const lines = (s, width, o = {}) => {
    const font = o.font || R, size = o.size || 16, ind = o.indent || 0, res = []; let cur = '';
    for (const w of s.split(' ')) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, font, size, o.weight) > width - (res.length ? 0 : ind) && cur) { res.push(cur); cur = w; } else cur = t;
    }
    if (cur) res.push(cur);
    return res;
  };
  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 16, lh = o.lh || size * 1.4;
    lines(s, width, o).forEach((t, i) => text(x + (i ? 0 : o.indent || 0), y + i * lh, t, o));
    return y + lines(s, width, o).length * lh;
  };
  const fit = (x, y, s, width, o = {}) => {
    let t = s;
    while (t.length > 1 && measure(t, o.font || R, o.size || 16, o.weight) > width) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== s) console.warn('cut: ' + s);
    return text(x, y, t, o);
  };
  const sparkle = (x, y, r, fill, o = {}) => pathd(`M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z`, { fill, opacity: o.opacity });
  const heart = (x, y, s, fill) => pathd(`M${x},${y + s * 0.9} C${x - s * 1.6},${y - s * 0.1} ${x - s * 0.8},${y - s * 1.2} ${x},${y - s * 0.35} C${x + s * 0.8},${y - s * 1.2} ${x + s * 1.6},${y - s * 0.1} ${x},${y + s * 0.9} Z`, { fill });
  const arrowHead = (x, y, ang, s, fill) => {
    const a = ang, p = (da, r) => `${f1(x + r * Math.cos(a + da))},${f1(y + r * Math.sin(a + da))}`;
    pathd(`M${f1(x)},${f1(y)} L${p(Math.PI - 0.45, s)} L${p(Math.PI + 0.45, s)} Z`, { fill });
  };
  const arrow = (x1, y1, x2, y2, col, sw = 2.5, o = {}) => {
    const ang = Math.atan2(y2 - y1, x2 - x1), hs = o.head || 9;
    line(x1, y1, x2 - Math.cos(ang) * hs * 0.7, y2 - Math.sin(ang) * hs * 0.7, { stroke: col, sw, dash: o.dash });
    arrowHead(x2, y2, ang, hs, col);
  };

  /* a face: dot eyes with a highlight, blush, ω mouth */
  const face = (cx, cy, r, kind = 'dot') => {
    const ey = cy + r * 0.02, ex = r * 0.36, er = r * 0.13, ink = C.ink;
    const eye = (x, k) => {
      if (k === 'happy') pathd(`M${x - er},${ey + er * 0.3} Q${x},${ey - er * 1.1} ${x + er},${ey + er * 0.3}`, { stroke: ink, sw: r * 0.08 });
      else if (k === 'star') { sparkle(x, ey, er * 1.35, ink); circle(x + er * 0.2, ey - er * 0.2, er * 0.25, { fill: '#fff' }); }
      else if (k === 'swirl') { circle(x, ey, er * 0.95, { stroke: ink, sw: r * 0.05 }); circle(x, ey, er * 0.4, { fill: ink }); }
      else { ellipse(x, ey, er * 0.82, er * 1.05, { fill: ink }); circle(x + er * 0.25, ey - er * 0.35, er * 0.32, { fill: '#fff' }); }
    };
    eye(cx - ex, kind === 'wink' ? 'dot' : kind);
    eye(cx + ex, kind === 'wink' ? 'happy' : kind);
    ellipse(cx - r * 0.58, ey + r * 0.27, r * 0.15, r * 0.08, { fill: C.blush, opacity: 0.85 });
    ellipse(cx + r * 0.58, ey + r * 0.27, r * 0.15, r * 0.08, { fill: C.blush, opacity: 0.85 });
    const my = ey + r * 0.25, mw = r * 0.09;
    pathd(`M${cx - 2 * mw},${my} Q${cx - mw},${my + mw * 1.6} ${cx},${my} Q${cx + mw},${my + mw * 1.6} ${cx + 2 * mw},${my}`, { stroke: ink, sw: r * 0.055 });
  };

  /* the mascot: an original mochi alien with two antennae */
  const alienMochi = (cx, cy, r, col, eyes, sym) => {
    const body = tint(col, 0.35), edge = shade(col, 0.05);
    ellipse(cx, cy + r * 0.92, r * 0.95, r * 0.14, { fill: shade(col, 0.3), opacity: 0.12 });
    for (const s of [-1, 1]) {
      pathd(`M${cx + s * r * 0.3},${cy - r * 0.8} Q${cx + s * r * 0.42},${cy - r * 1.25} ${cx + s * r * 0.62},${cy - r * 1.38}`, { stroke: edge, sw: Math.max(2, r * 0.07) });
      circle(cx + s * r * 0.64, cy - r * 1.42, r * 0.13, { fill: col });
      circle(cx + s * r * 0.6, cy - r * 1.46, r * 0.04, { fill: '#fff' });
    }
    pathd(`M${cx - r},${cy + r * 0.55} C${cx - r * 1.08},${cy - r * 0.55} ${cx - r * 0.55},${cy - r * 0.98} ${cx},${cy - r * 0.98} C${cx + r * 0.55},${cy - r * 0.98} ${cx + r * 1.08},${cy - r * 0.55} ${cx + r},${cy + r * 0.55} C${cx + r * 0.92},${cy + r * 0.86} ${cx - r * 0.92},${cy + r * 0.86} ${cx - r},${cy + r * 0.55} Z`, { fill: body, stroke: edge, sw: Math.max(2, r * 0.06) });
    if (sym) text(cx, cy - r * 0.5, sym, { font: SYM, size: r * 0.34, weight: 700, fill: shade(col, 0.1), anchor: 'middle' });
    face(cx, cy + r * 0.05, r, eyes);
  };

  /* a planet with a Saturn ring and a face; the ring is tilted by `tilt` degrees */
  const planet = (cx, cy, r, col, sym, eyes = 'dot', tilt = -16) => {
    const rx = r * 1.75, ry = r * 0.42;
    out.push(`<g transform="rotate(${tilt} ${f1(cx)} ${f1(cy)})">`);
    pathd(`M${cx - rx},${cy} A${rx} ${ry} 0 0 1 ${cx + rx},${cy}`, { stroke: tint(col, 0.55), sw: r * 0.16 });
    out.push('</g>');
    circle(cx, cy, r, { fill: tint(col, 0.32), stroke: shade(col, 0.02), sw: Math.max(1.5, r * 0.06) });
    pathd(`M${cx - r * 0.62},${cy - r * 0.55} Q${cx - r * 0.2},${cy - r * 0.92} ${cx + r * 0.3},${cy - r * 0.78}`, { stroke: '#fff', sw: r * 0.1, opacity: 0.8 });
    face(cx, cy + r * 0.08, r * 0.82, eyes);
    out.push(`<g transform="rotate(${tilt} ${f1(cx)} ${f1(cy)})">`);
    pathd(`M${cx - rx},${cy} A${rx} ${ry} 0 0 0 ${cx + rx},${cy}`, { stroke: tint(col, 0.75), sw: r * 0.16 });
    out.push('</g>');
    if (sym) {
      circle(cx + r * 0.8, cy - r * 0.8, r * 0.36, { fill: '#fff', stroke: col, sw: 2 });
      text(cx + r * 0.8, cy - r * 0.8 + r * 0.14, sym, { font: SYM, size: r * 0.42, weight: 700, fill: shade(col, 0.15), anchor: 'middle' });
    }
  };

  /* speech bubble (rounded box) with an optional tail towards (tx, ty) */
  const bubble = (x, y, w, h, fill, stroke, tx, ty) => {
    const r = Math.min(16, h / 2), hasTail = tx != null;
    const bx = hasTail ? Math.max(x + r + 6, Math.min(x + w - r - 30, tx - 12)) : 0;
    let d = `M${x + r},${y} `;
    if (hasTail && ty < y) d += `L${bx},${y} L${tx},${ty} L${bx + 24},${y} `;
    d += `L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} `;
    if (hasTail && ty > y + h) d += `L${bx + 24},${y + h} L${tx},${ty} L${bx},${y + h} `;
    d += `L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
    pathd(d, { fill, stroke, sw: 2 });
  };
  /* a joke bubble: pill with the source, then the joke; returns its height */
  const JS = 12.5, JLH = 17;
  const jokeH = (src, joke, w) => { const pw = measure(src, R, 11, 800) + 14; return lines(joke, w - 24, { size: JS, indent: pw + 7 }).length * JLH + 15; };
  const joke = (x, y, w, h, src, jk, col, tail) => {
    bubble(x, y, w, h, tint(col, 0.08), tint(col, 0.5), tail ? x + 120 : null, tail ? y - 10 : null);
    const pw = measure(src, R, 11, 800) + 14;
    rect(x + 12, y + 7, pw, 18, { rx: 9, fill: tint(col, 0.3) });
    text(x + 12 + pw / 2, y + 20, src, { size: 11, weight: 800, fill: shade(col, 0.3), anchor: 'middle' });
    wrap(x + 12, y + 20.5, jk, w - 24, { size: JS, lh: JLH, weight: 500, indent: pw + 7 });
  };
  /* a row of joke bubbles across width w; returns the row height */
  const jokeRow = (x, y, w, jokes, col, dry) => {
    const gap = 10, bw = (w - gap * (jokes.length - 1)) / jokes.length;
    const h = Math.max(...jokes.map(([s, j]) => jokeH(s, j, bw)));
    if (!dry) jokes.forEach(([s, j], i) => joke(x + i * (bw + gap), y, bw, h, s, j, col, i === 0));
    return h;
  };

  /* a card: panel + header ribbon; body(x, y, w) draws the contents and returns the bottom y.
     The panel goes underneath, so it is spliced in before the body's elements. */
  const card = (x, y, w, num, title, jp, ref, col, body, forceH) => {
    const idx = out.length;
    const HH = 44;
    const bottom = body(x, y + HH + 10, w);
    const h = forceH || bottom - y + 12;
    const save = out.splice(idx);
    rect(x, y, w, h, { rx: 26, fill: C.panel, filter: 'soft' });
    rect(x, y, w, h, { rx: 26, fill: 'none', stroke: tint(col, 0.45), sw: 2.5 });
    pathd(`M${x + 26},${y} L${x + w - 26},${y} Q${x + w},${y} ${x + w},${y + 26} L${x + w},${y + HH} L${x},${y + HH} L${x},${y + 26} Q${x},${y} ${x + 26},${y} Z`, { fill: tint(col, 0.16) });
    circle(x + 27, y + 23, 14, { fill: col });
    text(x + 27, y + 29, String(num), { size: 16, weight: 800, fill: '#fff', anchor: 'middle' });
    const tw = text(x + 50, y + 30, title, { size: w > 600 ? 21 : 18.5, weight: 800 });
    const jw = measure(jp, R, 12, 800) + 16;
    rect(x + 58 + tw, y + 12, jw, 22, { rx: 11, fill: col });
    text(x + 58 + tw + jw / 2, y + 27.5, jp, { size: 12, weight: 800, fill: '#fff', anchor: 'middle' });
    if (ref) fit(x + w - 16, y + 28, ref, w - (tw + jw + 84), { size: 10.5, fill: C.ink2, anchor: 'end' });
    out.push(...save);
    return y + h;
  };
  const keyLine = (x, y, s, width, col) => { heart(x + 7, y - 4.5, 6, '#ff7fae'); return wrap(x + 19, y, s, width - 19, { size: 13.5, lh: 18, weight: 700, fill: shade(col, 0.25) }); };
  const BODY = { size: 13.5, lh: 18.5, weight: 500 };

  /* ---------------------------------------------------------------- background */
  out.push(`<defs>
  <pattern id="dots" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="3" fill="#ffd3e4"/><circle cx="33" cy="33" r="3" fill="#e6dcff"/></pattern>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#d98bb0" flood-opacity="0.18"/></filter>
  <radialGradient id="gauss" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9b7bea" stop-opacity="0.55"/><stop offset="45%" stop-color="#9b7bea" stop-opacity="0.22"/><stop offset="100%" stop-color="#9b7bea" stop-opacity="0"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe58a" stop-opacity="0.85"/><stop offset="100%" stop-color="#ffe58a" stop-opacity="0"/></linearGradient>
</defs>`);
  rect(0, 0, W, H, { fill: C.bg });
  rect(0, 0, W, H, { fill: 'url(#dots)', opacity: 0.5 });

  /* ---------------------------------------------------------------- header */
  /* a UFO with the mascot under its beam, top right */
  const ux = 960, uy = 50;
  pathd(`M${ux - 30},${uy + 10} L${ux - 56},${uy + 120} L${ux + 56},${uy + 120} L${ux + 30},${uy + 10} Z`, { fill: 'url(#beam)' });
  ellipse(ux, uy, 27, 20, { fill: '#cfe9ff', stroke: '#4aa3f0', sw: 2 });
  ellipse(ux, uy + 9, 66, 16, { fill: '#c9b8f5', stroke: '#9b7bea', sw: 2.5 });
  for (const k of [-2, -1, 0, 1, 2]) circle(ux + k * 24, uy + 12, 4, { fill: ['#ffc94d', '#ff7fae', '#2fbf8f', '#ff7fae', '#ffc94d'][k + 2] });
  alienMochi(ux, uy + 104, 31, C.green, 'happy', '');
  sparkle(1050, 120, 7, '#9b7bea'); sparkle(866, 140, 6, '#4aa3f0');

  text(M, 60, 'Alien ring systems', { size: 44, weight: 800 });
  const tw0 = measure('Alien ring systems', R, 44, 800);
  text(M + tw0 + 18, 58, '異世界の環', { size: 32, weight: 800, fill: C.pink });
  sparkle(M + tw0 + 18 + measure('異世界の環', R, 32, 800) + 18, 30, 10, '#ffc94d');
  bubble(718, 98, 150, 34, '#fff', '#f2a7c5', 912, 128);
  text(793, 121, 'ようこそ異世界へ!', { size: 14, weight: 800, fill: C.pink, anchor: 'middle' });
  text(M, 90, 'isekai no wa: "rings from other worlds", in inter-universal Teichmüller theory', { size: 15, weight: 700, fill: C.ink2 });
  let hy = wrap(M, 120, `Every Hodge theater of IUT lives in its own universe and carries its own copy of ring theory: number fields, local fields K_v, and their + and ×. The links between Hodge theaters keep only part of that structure, never the whole ring, so the copies are mutually alien. This page draws what that means, with the numbers iut walk prints for ${D.example} (l = ${D.l}).`, 670, { size: 13.5, lh: 18.5, fill: C.ink2 });

  /* ---------------------------------------------------------------- the cards */
  const CW = W - 2 * M, GAP = 10;
  const cards = [];
  let y = hy + 4;

  /* 1 · a ring is two dances: Z[i] */
  cards.push(() => card(M, y, CW, 1, 'A ring is two dances at once', '環はふたりの漫才', 'ring = (R, +, ×) · [Alien] §2.3', C.blue, (x, yy, w) => {
    const s = 32, ox = x + 24 + 2 * s, oy = yy + 6 + 3 * s;
    const P = (a, b) => [ox + a * s, oy - b * s];
    for (let a = -2; a <= 4; a++) line(...P(a, -1), ...P(a, 3), { stroke: a === 0 ? '#cdbcd6' : '#efe3f3', sw: a === 0 ? 1.6 : 1 });
    for (let b = -1; b <= 3; b++) line(...P(-2, b), ...P(4, b), { stroke: b === 0 ? '#cdbcd6' : '#efe3f3', sw: b === 0 ? 1.6 : 1 });
    const poly = (pts, col, a) => pathd('M' + pts.map(([u, v]) => P(u, v).map(t => f1(t)).join(',')).join(' L') + ' Z', { fill: tint(col, a), stroke: col, sw: 2.2 });
    poly([[0, 0], [1, 0], [1, 1], [0, 1]], '#b9a7c4', 0.3);
    poly([[1, 1], [2, 1], [2, 2], [1, 2]], C.blue, 0.25);
    poly([[0, 0], [1, 1], [0, 2], [-1, 1]], C.orange, 0.2);
    arrow(...P(0.5, 0.5), ...P(1.45, 1.45), C.blue, 2.4);
    /* × i: a quarter turn from 3 to 3i */
    const [cx0, cy0] = P(0, 0);
    pathd(`M${f1(cx0 + 3 * s)},${f1(cy0)} A${3 * s} ${3 * s} 0 0 0 ${f1(cx0 + 0.25 * s)},${f1(cy0 - 2.99 * s)}`, { stroke: C.purple, sw: 2, dash: '5 5' });
    arrowHead(cx0, cy0 - 3 * s, Math.PI, 9, C.purple);
    for (let a = -2; a <= 4; a++) for (let b = -1; b <= 3; b++) circle(...P(a, b), 2.8, { fill: '#9a76ad' });
    const lab = (a, b, t, dx, dy) => text(P(a, b)[0] + dx, P(a, b)[1] + dy, t, { font: SYM, size: 12, weight: 700, fill: C.ink2 });
    lab(0, 0, '0', -11, 15); lab(1, 0, '1', 4, 15); lab(0, 1, 'i', 5, -5); lab(1, 1, '1+i', 5, 14); lab(0, 2, '2i', 5, -5);
    const lx = x + 24 + 6 * s + 18;
    let ly = yy + 14;
    const leg = (col, t1, t2) => { rect(lx, ly - 11, 13, 13, { rx: 4, fill: tint(col, 0.3), stroke: col, sw: 2 }); text(lx + 20, ly, t1, { font: SYM, size: 13, weight: 700, fill: shade(col, 0.2) }); text(lx + 20, ly + 15, t2, { size: 11.5, fill: C.ink2 }); ly += 36; };
    leg('#b9a7c4', 'the unit square', 'in Z[i], the Gaussian integers');
    leg(C.blue, '+ (1+i): a slide', 'the additive dance');
    leg(C.orange, '× (1+i): turn 45°, ×√2', 'the multiplicative dance');
    leg(C.purple, '× i: a quarter turn', 'i² = −1 maps the grid to itself');
    const tx = lx + 196, tw = x + w - 18 - tx;
    let ty = wrap(tx, yy + 12, 'A ring has two operations welded together by the distributive law a(b+c) = ab + ac. On Z[i] you can watch both: + slides the grid, × turns and stretches it, and the law makes every slide agree with every turn. Mochizuki calls these the two combinatorial dimensions of a ring.', tw, BODY);
    ty = keyLine(tx, ty + 4, 'IUT pulls the two dances apart, then asks how much of the ring survives.', tw, C.blue);
    const bot = Math.max(ty - 8, oy + s + 4, ly - 20);
    return bot + 10 + jokeRow(x + 14, bot + 10, w - 28, [
      ['manzai', 'A ring is a manzai duo: + is the boke, × is the tsukkomi, and the distributive law is their timing. IUT books them into different Hodge theaters.'],
      ['Taiko no Tatsujin', 'Don is +, ka is ×. A ring is a chart with both on every bar, and a(b+c) = ab + ac is the full combo.'],
    ], C.blue);
  }));

  /* 2 · the Θ-link between two universes */
  cards.push(() => card(M, y, CW, 2, 'Two universes, one Θ-link', 'テータリンク', '[IUTchI] Cor 3.7, Rem 3.9.3 · [IUTchII] Cor 4.10', C.purple, (x, yy, w) => {
    const dw = 380, xl = x + 72, xr = x + dw - 48, k = 3.6, top = yy + 74, base = top + 36 * k;
    planet(xl, yy + 28, 21, C.purple, '†', 'dot');
    planet(xr, yy + 28, 21, C.orange, '‡', 'wink', 14);
    text(xl, yy + 66, `†HT · universe #${D.univ[0]}`, { size: 11, weight: 800, fill: C.ink2, anchor: 'middle' });
    text(xr, yy + 66, `‡HT · universe #${D.univ[1]}`, { size: 11, weight: 800, fill: C.ink2, anchor: 'middle' });
    text((xl + xr) / 2, yy + 20, 'Θ-link', { size: 15, weight: 800, fill: C.purple, anchor: 'middle' });
    text((xl + xr) / 2, yy + 38, 'q̲^{j²} ↦ q̲', { font: SYM, size: 13, weight: 700, fill: C.ink2, anchor: 'middle' });
    arrow((xl + xr) / 2 - 50, yy + 48, (xl + xr) / 2 + 50, yy + 48, C.purple, 2);
    line(xl, top - 4, xl, base + 4, { stroke: '#cdbcd6', sw: 3 });
    line(xr, top - 4, xr, base + 4, { stroke: '#cdbcd6', sw: 3 });
    const yq = base - k;
    D.exps.forEach((e, i) => {
      const y2 = base - e * k, col = C.series[i];
      pathd(`M${xl + 6},${f1(y2)} C${f1(xl + 130)},${f1(y2)} ${f1(xr - 130)},${f1(yq)} ${xr - 8},${f1(yq)}`, { stroke: col, sw: 2, opacity: 0.85 });
      circle(xl, y2, 4.5, { fill: col });
      if (e >= 4 || e === 1) text(xl - 9, y2 + (e === 1 ? 7 : 4.5), `q̲^${e}`, { font: SYM, size: 12, weight: 700, fill: shade(col, 0.15), anchor: 'end' });
    });
    arrowHead(xr - 5, yq, 0, 9, C.ink2);
    circle(xr, yq, 5.5, { fill: C.orange });
    text(xr + 10, yq + 5, 'q̲', { font: SYM, size: 14, weight: 700, fill: shade(C.orange, 0.2) });
    text(xr + 8, top + 4, 'ord', { size: 10.5, fill: C.muted });
    text((xl + xr) / 2 + 20, top + 24, `average of j²: ${D.dilation.toFixed(3)}`, { size: 11, weight: 700, fill: C.muted, anchor: 'middle' });

    const tx = x + dw + 14, tw = x + w - 18 - tx;
    let ty = wrap(tx, yy + 12, `Each Hodge theater has its own copy of ring theory. The Θ-link from †HT to ‡HT is an isomorphism of multiplicative monoids that sends every theta value q̲^{j²}, j = 1…${D.lstar}, to the one q̲. A ring map φ sends q̲^4 to φ(q̲)^4, so no ring map can do that: + has to stay home.`, tw, BODY);
    text(tx, ty + 4, `WHAT CROSSES AT ${D.alien.v.toUpperCase()}  ·  iut walk`, { size: 11, weight: 800, fill: C.purple, extra: ' letter-spacing="1"' });
    ty += 10;
    const rows = [
      ['Π_v', `#${D.alien.piD}`, `#${D.alien.piDD}`, '✗ alien', C.red],
      ['G_v', `#${D.alien.gD}`, `#${D.alien.gDD}`, '✓ shared (Ind1)', C.green],
      ['O×μ', `#${D.alien.oD}`, `#${D.alien.oDD}`, '✓ shared (Ind2)', C.green],
      ['q̲', 'q̲^{1,4,…,36}', 'q̲', `dilated ${D.dilation.toFixed(3)}×`, C.orange],
    ];
    const c1 = tx + 6, c2 = tx + 50, c3 = tx + 162, c4 = tx + 258;
    text(c2, ty + 10, '† side', { size: 10.5, weight: 800, fill: C.muted }); text(c3, ty + 10, '‡ side', { size: 10.5, weight: 800, fill: C.muted });
    ty += 14;
    rows.forEach(([n, a, b, st, col], i) => {
      const ry = ty + i * 20;
      rect(tx, ry, tw, 19, { rx: 8, fill: i % 2 ? '#fff' : tint(C.purple, 0.07) });
      text(c1, ry + 14, n, { font: SYM, size: 12.5, weight: 700 });
      text(c2, ry + 14, a, { font: n === 'q̲' ? SYM : MONO, size: 11.5, weight: 500, fill: C.ink2 });
      text(c3, ry + 14, b, { font: n === 'q̲' ? SYM : MONO, size: 11.5, weight: 500, fill: C.ink2 });
      text(c4, ry + 14, st, { font: SYM, size: 12, weight: 700, fill: shade(col, 0.1) });
    });
    ty += rows.length * 20 + 17;
    ty = keyLine(tx, ty, `Degree ${D.degTheta.toFixed(3)} on †, ${D.degQ.toFixed(3)} on ‡. Π_v and the ring are alien at all ${D.nAlien} places.`, tw, C.purple);
    const bot = Math.max(ty - 8, base + 6);
    return bot + 10 + jokeRow(x + 14, bot + 10, w - 28, [
      ['Frieren', `To an elf, ${D.exps[D.exps.length - 1]} human years pass like one. The Θ-link is just as relaxed: q̲^${D.exps[D.exps.length - 1]} and q̲ look like the same day to it.`],
      ['Doraemon', 'The Small Light shrinks everything by one factor. The Θ-link needs a different setting for every j, which is exactly why it is not a ring map.'],
    ], C.purple);
  }));

  /* 3 · the log-link: × becomes + */
  cards.push(() => card(M, y, CW, 3, 'The log-link turns × into +', 'ログリンク', '[IUTchIII] Def 1.1, Prop 1.2–1.3, Def 1.4', C.orange, (x, yy, w) => {
    /* the drawing is on the right this time: the polar web of C^× and the strip log(C^×) */
    const dw = 400, dx = x + w - dw - 8;
    const L0 = -1.0, L1 = 0.25, k = 27;           /* log r from L0 to L1; k px per unit on the strip */
    const pr = 86 / Math.exp(L1);                  /* polar: radius = pr · r */
    const pcx = dx + 100, pcy = yy + 6 + k * Math.PI;
    const sx0 = dx + 300, scy = pcy;               /* strip: x = sx0 + k·log r, y = scy − k·θ */
    const nr = 12, st = Math.PI / 6;
    for (let t = 0; t < nr; t++) { const a = t * st; line(pcx + pr * Math.exp(L0) * Math.cos(a), pcy - pr * Math.exp(L0) * Math.sin(a), pcx + pr * Math.exp(L1) * Math.cos(a), pcy - pr * Math.exp(L1) * Math.sin(a), { stroke: '#ead6ef', sw: 1.2 }); }
    for (let L = L0; L <= L1 + 1e-9; L += 0.25) circle(pcx, pcy, pr * Math.exp(L), { stroke: Math.abs(L) < 1e-9 ? C.orange : '#ead6ef', sw: Math.abs(L) < 1e-9 ? 3 : 1.2 });
    for (let t = 0; t <= nr; t++) { const yv = scy - k * (-Math.PI + t * st); line(sx0 + k * L0, yv, sx0 + k * L1, yv, { stroke: '#ead6ef', sw: 1.2 }); }
    for (let L = L0; L <= L1 + 1e-9; L += 0.25) line(sx0 + k * L, scy - k * Math.PI, sx0 + k * L, scy + k * Math.PI, { stroke: Math.abs(L) < 1e-9 ? C.orange : '#ead6ef', sw: Math.abs(L) < 1e-9 ? 3 : 1.2 });
    /* a cell, its image under × e^{iπ/3} (a turn), and both cells on the strip (a slide) */
    const cell = (La, Lb, ta, tb) => { const p = (L, t) => `${f1(pcx + pr * Math.exp(L) * Math.cos(t))},${f1(pcy - pr * Math.exp(L) * Math.sin(t))}`; return `M${p(La, ta)} A${f1(pr * Math.exp(La))} ${f1(pr * Math.exp(La))} 0 0 0 ${p(La, tb)} L${p(Lb, tb)} A${f1(pr * Math.exp(Lb))} ${f1(pr * Math.exp(Lb))} 0 0 1 ${p(Lb, ta)} Z`; };
    const scell = (La, Lb, ta, tb) => `M${f1(sx0 + k * La)},${f1(scy - k * ta)} L${f1(sx0 + k * Lb)},${f1(scy - k * ta)} L${f1(sx0 + k * Lb)},${f1(scy - k * tb)} L${f1(sx0 + k * La)},${f1(scy - k * tb)} Z`;
    pathd(cell(-0.5, -0.25, 0, st), { fill: tint(C.blue, 0.45), stroke: C.blue, sw: 1.5 });
    pathd(cell(-0.5, -0.25, 2 * st, 3 * st), { fill: tint(C.pink, 0.45), stroke: C.pink, sw: 1.5 });
    pathd(scell(-0.5, -0.25, 0, st), { fill: tint(C.blue, 0.45), stroke: C.blue, sw: 1.5 });
    pathd(scell(-0.5, -0.25, 2 * st, 3 * st), { fill: tint(C.pink, 0.45), stroke: C.pink, sw: 1.5 });
    const rr = pr * Math.exp(-0.1), a0 = st * 0.6, a1 = st * 2.35;
    pathd(`M${f1(pcx + rr * Math.cos(a0))},${f1(pcy - rr * Math.sin(a0))} A${f1(rr)} ${f1(rr)} 0 0 0 ${f1(pcx + rr * Math.cos(a1))},${f1(pcy - rr * Math.sin(a1))}`, { stroke: C.ink2, sw: 1.8 });
    arrowHead(pcx + rr * Math.cos(a1 + 0.08), pcy - rr * Math.sin(a1 + 0.08), Math.atan2(-Math.cos(a1), -Math.sin(a1)), 8, C.ink2);
    arrow(sx0 + k * 0.1, scy - k * st * 0.6, sx0 + k * 0.1, scy - k * st * 2.4, C.ink2, 1.8, { head: 8 });
    circle(pcx, pcy, 3, { fill: C.ink2 });
    text(pcx, pcy + k * Math.PI + 16, 'C^×: circles and rays', { size: 11.5, weight: 700, fill: C.ink2, anchor: 'middle' });
    text(sx0 - k * 0.4, scy + k * Math.PI + 16, 'log C^×: a strip', { size: 11.5, weight: 700, fill: C.ink2, anchor: 'middle' });
    text(sx0 + k * L1 + 6, scy - k * Math.PI + 10, 'iπ', { font: SYM, size: 11.5, fill: C.muted });
    text(sx0 + k * L1 + 6, scy + k * Math.PI + 2, '−iπ', { font: SYM, size: 11.5, fill: C.muted });
    const mx = (pcx + pr * Math.exp(L1) + sx0 + k * L0) / 2;
    arrow(pcx + pr * Math.exp(L1) + 8, pcy - 36, sx0 + k * L0 - 10, scy - 36, C.orange, 2.6);
    text(mx, pcy - 44, 'log', { font: SYM, size: 15, weight: 700, fill: C.orange, anchor: 'middle' });
    text(mx, pcy - 4, '× e^{iπ/3}', { font: SYM, size: 11, weight: 700, fill: C.ink2, anchor: 'middle' });
    text(mx, pcy + 11, 'becomes', { size: 10.5, fill: C.muted, anchor: 'middle' });
    text(mx, pcy + 26, '+ iπ/3', { font: SYM, size: 11, weight: 700, fill: C.ink2, anchor: 'middle' });

    const tx = x + 18, tw = dx - 14 - tx;
    let ty = wrap(tx, yy + 12, `The log-link goes one floor up the lattice, (n, m) → (n, m+1): the logarithm turns the units O× of the lower Hodge theater into the additive group of the upper one. At ∞ you can watch it: log unrolls C^× into a strip, circles become vertical lines and rays horizontal ones, and the unit circle becomes the segment [−iπ, iπ]. The turn × e^{iπ/3} that moves the blue cell to the pink one becomes the slide + iπ/3.`, tw, BODY);
    text(tx, ty + 4, 'iut run ApplyLogLinkStrip', { font: MONO, size: 11.5, weight: 700, fill: C.orange });
    ty += 12;
    const rows = [['Π_v', `#${D.logLink.piA} → #${D.logLink.piB}`, '✓ kept (vertically coric)', C.green], ['O×', `#${D.logLink.uA} → #${D.logLink.uB}`, '✗ renewed', C.red], ['ring', '', '✗ not preserved', C.red]];
    rows.forEach(([n, v, s2, col], i) => {
      const ry = ty + i * 20;
      rect(tx, ry, tw, 19, { rx: 8, fill: i % 2 ? '#fff' : tint(C.orange, 0.08) });
      text(tx + 6, ry + 14, n, { font: SYM, size: 12.5, weight: 700 });
      text(tx + 46, ry + 14, v, { font: MONO, size: 11.5, fill: C.ink2 });
      text(tx + tw - 6, ry + 14, s2, { font: SYM, size: 12, weight: 700, fill: shade(col, 0.1), anchor: 'end' });
    });
    ty += rows.length * 20 + 17;
    ty = keyLine(tx, ty, `The ${D.chain.n} floors of column 0 sit in universes ${D.chain.univ.join(', ')}. Each builds its own ring.`, tw, C.orange);
    const bot = Math.max(ty - 8, scy + k * Math.PI + 20);
    return bot + 10 + jokeRow(x + 14, bot + 10, w - 28, [
      ['Ranma ½', 'Cold water (log) turns the × form into the + form; hot water (exp) turns it back, but only near 1. The p-adic exp converges on a small disc only, so splash carefully.'],
      ['Kirby', 'Kirby inhales the units O× of the floor below and copies their ability. The ability turns out to be addition.'],
    ], C.orange);
  }));

  /* 4 · mono-anabelian transport */
  cards.push(() => card(M, y, CW, 4, 'What can cross: the étale-like ghost', 'エタール輸送', '[Alien] §2.7, Fig 2.1 · iut run TransportMonoAnabelian', C.green, (x, yy, w) => {
    const stops = [
      { t: '† Frobenius-like', s: `Θ-pilot, mass ${D.trIn.toFixed(3)}`, fill: true, col: C.purple },
      { t: 'Kummer-detach', s: 'Ind2, Ind3', step: true },
      { t: '† étale-like', s: `G_v only, mass ${D.trMid.toFixed(0)}`, fill: false, col: C.purple },
      { t: 'étale-transport', s: 'across the Θ-link, Ind1', step: true },
      { t: '‡ étale-like', s: 'rebuilt from G_v', fill: false, col: C.orange },
      { t: 're-attach', s: 'Kummer again', step: true },
      { t: '‡ Frobenius-like', s: `q-pilot, mass ${D.trOut.toFixed(3)}`, fill: true, col: C.orange },
    ];
    const fx = x + 18, fw = w - 36, cyf = yy + 36;
    const blobs = stops.filter(s => !s.step).length, slotB = 146, slotS = (fw - blobs * slotB) / (stops.length - blobs);
    let xx = fx;
    stops.forEach(s => {
      const sw = s.step ? slotS : slotB, cx = xx + sw / 2;
      if (s.step) {
        arrow(xx + 4, cyf, xx + sw - 4, cyf, C.green, 2.5);
        text(cx, cyf - 10, s.t, { size: 11.5, weight: 800, fill: shade(C.green, 0.2), anchor: 'middle' });
        text(cx, cyf + 18, s.s, { font: SYM, size: 10.5, weight: 500, fill: C.ink2, anchor: 'middle' });
      } else {
        /* a ring (annulus): solid when Frobenius-like, a dashed ghost when étale-like */
        if (s.fill) { circle(cx, cyf, 24, { fill: tint(s.col, 0.35), stroke: s.col, sw: 2.5 }); circle(cx, cyf, 10, { fill: '#fff', stroke: s.col, sw: 2 }); }
        else {
          pathd(`M${cx - 22},${cyf + 22} L${cx - 22},${cyf - 4} A22 22 0 0 1 ${cx + 22},${cyf - 4} L${cx + 22},${cyf + 22} L${cx + 14.7},${cyf + 16} L${cx + 7.3},${cyf + 22} L${cx},${cyf + 16} L${cx - 7.3},${cyf + 22} L${cx - 14.7},${cyf + 16} Z`, { fill: '#fff', stroke: s.col, sw: 2, dash: '4 3' });
          face(cx, cyf - 2, 15, 'happy');
        }
        text(cx, cyf + 42, s.t, { size: 12, weight: 800, fill: shade(s.col, 0.15), anchor: 'middle' });
        text(cx, cyf + 57, s.s, { font: SYM, size: 10.5, weight: 500, fill: C.ink2, anchor: 'middle' });
      }
      xx += sw;
    });
    /* the Θ-link as a dashed wall in the middle */
    const wx = fx + slotB * 2 + slotS * 1.5;
    line(wx, cyf - 34, wx, cyf - 24, { stroke: C.purple, sw: 2, dash: '3 4' });
    line(wx, cyf + 26, wx, cyf + 62, { stroke: C.purple, sw: 2, dash: '3 4' });
    const tx = x + 18, tw = w - 36;
    let ty = wrap(tx, cyf + 82, 'Only data that can be rebuilt from the Galois group G_v crosses, and a group has no + and no ×. Kummer theory detaches the Frobenius-like monoids (the ones with mass), the étale-like ghost (mass 0) crosses, and mono-anabelian geometry rebuilds K_v, ring and all, on the far side, up to Ind1 (Aut(G_v), permutations), Ind2 (isomorphisms of O×μ) and Ind3 (upper semi-compatibility).', tw, BODY);
    ty = keyLine(tx, ty + 4, 'A ghost has no ring structure, which is why it is the one thing that can travel between alien rings.', tw, C.green);
    return ty - 8 + 10 + jokeRow(x + 14, ty + 2, w - 28, [
      ['Hatsune Miku', 'A hologram concert: the projection data (G_v) goes on tour and every venue rebuilds the singer on stage. Nobody asks which ring structure she has.'],
      ['Cardcaptor Sakura', 'Seal it in a card (Kummer-detach), carry the card across, shout "Release!" (re-attach). Out comes the same card, up to Ind1, Ind2 and Ind3.'],
    ], C.green);
  }));

  /* 5 + 6 · side by side: the log-shell (a disc of radius π) and the Gaussian integral (I² = π) */
  cards.push(() => {
    const hw = (CW - GAP) / 2, k = 21, Rr = Math.PI * k;
    const legend = (lx, ly, items) => items.forEach(([col, t], i) => { circle(lx + 5, ly + i * 15 - 4, 4.5, { fill: tint(col, 0.4), stroke: col, sw: 1.8 }); text(lx + 14, ly + i * 15, t, { font: SYM, size: 10.5, fill: C.ink2 }); });
    const mark = out.length;
    const draw5 = fh => card(M, y, hw, 5, 'Log-shells: one wall', '対数殻', '[IUTchIII] Def 1.1, Prop 1.2', C.gold, (x, yy, w) => {
      const cx = x + 18 + Rr + 6, cy = yy + 4 + Rr + 6;
      circle(cx, cy, Rr + 6, { stroke: tint(C.gold, 0.45), sw: 2, dash: '2 5' });
      circle(cx, cy, Rr, { fill: tint(C.gold, 0.12), stroke: C.gold, sw: 3 });
      line(cx - Rr, cy, cx + Rr, cy, { stroke: '#e5d6c0', sw: 1 });
      circle(cx, cy, k, { fill: tint(C.blue, 0.35), stroke: C.blue, sw: 2.2 });
      line(cx, cy - Rr, cx, cy + Rr, { stroke: C.orange, sw: 3.5 });
      circle(cx, cy - Rr, 3.5, { fill: C.orange }); circle(cx, cy + Rr, 3.5, { fill: C.orange });
      face(cx + 0.5, cy + 2, 10, 'happy');
      text(cx + 7, cy - Rr + 18, 'iπ', { font: SYM, size: 11, weight: 700, fill: C.orange });
      text(cx + 7, cy + Rr - 8, '−iπ', { font: SYM, size: 11, weight: 700, fill: C.orange });
      text(cx + Rr * 0.72 + 4, cy - Rr * 0.72, 'π', { font: SYM, size: 12, weight: 700, fill: shade(C.gold, 0.2) });
      const tx = cx + Rr + 18, tw = x + w - 16 - tx;
      const sh = D.shells.find(s => s.v === 'v3') || D.shells[0];
      let ty = wrap(tx, yy + 12, `No link keeps the ring, so IUT measures in a container both floors share: the log-shell I_v = (p*)^{-1}·log(O×_{K_v}). It holds log(O×) and, up to a small factor, O_{K_v}. At ∞ it is the ${D.archShell}; at ${sh.v}, p* = ${sh.pstar} and I_v = ${sh.I}. Its mono-analytic version is bi-coric (CheckBicoric: ${D.bic ? 'yes' : 'no'}).`, tw, { size: 13, lh: 17.5, weight: 500 });
      legend(tx, ty + 2, [[C.gold, 'I_∞: |z| ≤ π'], [C.blue, 'O_C: |z| ≤ 1'], [C.orange, 'log(S¹) = [−iπ, iπ]']]);
      ty = Math.max(ty + 2 * 15 + 22, cy + Rr + 26);
      ty = keyLine(x + 18, ty, 'Both rings are measured inside the same shell.', w - 36, C.gold);
      return ty - 8 + 10 + jokeRow(x + 12, ty + 2, w - 24, [
        ['Attack on Titan', 'Wall Sina inside Wall Rose: O_C ⊆ I_∞. Inside the wall of radius π both floors live in peace; outside are rings nobody can compare.'],
      ], C.gold);
    }, fh);
    const draw6 = fh => card(M + hw + GAP, y, hw, 6, 'Why go alien? √π', 'ガウス積分', '[Alien] §1', C.pink, (x, yy, w) => {
      const cx = x + 18 + Rr + 6, cy = yy + 4 + Rr + 6;
      circle(cx, cy, Rr, { fill: 'url(#gauss)' });
      for (const r of [0.5, 1, 1.5, 2, 2.5, 3]) circle(cx, cy, r * k, { stroke: tint(C.pink, 0.35), sw: 1 });
      for (let t = 0; t < 12; t++) { const a = t * Math.PI / 6; line(cx, cy, cx + Rr * Math.cos(a), cy - Rr * Math.sin(a), { stroke: tint(C.pink, 0.25), sw: 1 }); }
      line(cx - Rr - 6, cy, cx + Rr + 6, cy, { stroke: C.ink2, sw: 1.3 });
      line(cx, cy - Rr - 6, cx, cy + Rr + 6, { stroke: C.ink2, sw: 1.3 });
      /* the two copies of e^{−x²}: along x (blue) and along y (orange) */
      const amp = 30, pts = f => { let d = ''; for (let u = -3; u <= 3.001; u += 0.1) { const [px, py] = f(u, Math.exp(-u * u)); d += (d ? ' L' : 'M') + f1(px) + ',' + f1(py); } return d; };
      pathd(pts((u, v) => [cx + u * k, cy - v * amp]), { stroke: C.blue, sw: 2.4 });
      pathd(pts((u, v) => [cx + v * amp, cy - u * k]), { stroke: C.orange, sw: 2.4 });
      /* the slit R≤0 × {0} of the polar coordinates ([Alien] §1 Step 8) */
      line(cx - Rr, cy, cx - 2, cy, { stroke: C.red, sw: 2, dash: '4 4' });
      text(cx - Rr + 2, cy + 13, 'slit', { size: 10.5, weight: 800, fill: C.red });
      text(cx + Rr + 2, cy + 13, 'x', { font: SYM, size: 11.5, weight: 700, fill: C.blue, anchor: 'end' });
      text(cx + 7, cy - Rr + 4, 'y', { font: SYM, size: 11.5, weight: 700, fill: C.orange });
      const tx = cx + Rr + 18, tw = x + w - 16 - tx;
      let ty = wrap(tx, yy + 12, `Mochizuki's own analogy: one copy of I = ∫e^{−x²}dx can't be done by elementary means. Take two alien copies as the axes of a plane and go polar: the radial part (${D.gau.rad.toFixed(3)}) decouples from the angular part (${D.gau.ang.toFixed(5)}), as multiradiality decouples the Θ-pilot from the coric data. So I = √π = ${D.gau.sqrtpi}.`, tw, { size: 13, lh: 17.5, weight: 500 });
      legend(tx, ty + 2, [[C.blue, 'copy 1: e^{−x²}'], [C.orange, 'copy 2: e^{−y²}'], [C.purple, `I² = ∬ = ${D.gau.I2.toFixed(5)}`]]);
      ty = Math.max(ty + 2 * 15 + 22, cy + Rr + 26);
      ty = keyLine(x + 18, ty, 'Two alien copies compute what one copy cannot.', w - 36, C.pink);
      return ty - 8 + 10 + jokeRow(x + 12, ty + 2, w - 24, [
        ['Pretty Cure', 'Futari wa Pretty Cure: one copy of the integral loses every fight. Two copies join hands, go polar, and win √π.'],
      ], C.pink);
    }, fh);
    const b1 = draw5(), b2 = draw6();
    if (Math.abs(b1 - b2) < 0.5) return b1;
    out.splice(mark);
    const hb = Math.max(b1, b2) - y;
    draw5(hb); draw6(hb);
    return y + hb;
  });

  /* lay out the cards, then spread any spare height evenly between them */
  const startY = y, mark = out.length;
  let bottoms = [];
  for (const c of cards) { const b = c(); bottoms.push(b); y = b + GAP; }
  const FOOT = 52;
  const spare = H - FOOT - (y - GAP);
  if (spare < 0) console.warn(`page overflow: ${(-spare).toFixed(0)}px`);
  if (spare > 0) {
    out.splice(mark);
    const extra = spare / cards.length;
    y = startY + extra / 2;
    for (const c of cards) { const b = c(); y = b + GAP + extra; }
  }
  console.log(`layout: spare ${spare.toFixed(0)}px`);

  text(M, H - 30, `Numbers from iut walk and iut run for ${D.example}, l = ${D.l}; every process ended in => ok · type: M PLUS Rounded 1c (SIL OFL) and DejaVu Sans`, { size: 11, fill: C.muted });
  text(M, H - 14, 'Mascot and planets are original drawings · pop-culture references are text only; titles and names belong to their owners · scripts/infographic/alienrings.js', { size: 11, fill: C.muted });
  return out.join('\n');
}

/* ------------------------------------------------------------ render */
(async () => {
  const svgOnly = process.argv.includes('--svg-only');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { const t = m.type(); if (t === 'warning' || t === 'error') console.error('[page] ' + m.text()); else if (t === 'log') console.log('[page] ' + m.text()); });
  const sample = 'Alien ring systems Θ ' + JP_TEXT;
  await page.setContent(`<!doctype html><html><head><style>${fontCSS}</style></head><body style="margin:0;background:#fff6fa">
    ${[500, 700, 800].map(w => `<div style="font-family:'M PLUS Rounded 1c';font-weight:${w}">${sample}</div>`).join('')}
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊q̲</div></body></html>`);
  await page.evaluate(async s => { for (const w of [500, 700, 800]) await document.fonts.load(`${w} 20px "M PLUS Rounded 1c"`, s); await document.fonts.ready; }, sample);
  const body = await page.evaluate(`(${layout.toString()})(${JSON.stringify(data)})`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Alien ring systems ☆ 異世界の環 — the mutually alien copies of ring theory in IUT</title>
<style>${fontCSS}</style>
${body}
</svg>`;
  fs.writeFileSync(OUT_SVG, svg);
  console.log(`wrote ${path.relative(ROOT, OUT_SVG)} (${(svg.length / 1024).toFixed(0)} KB)`);
  if (!svgOnly) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff6fa">${svg}</body></html>`);
    await page.evaluate(async s => { for (const w of [500, 700, 800]) await document.fonts.load(`${w} 20px "M PLUS Rounded 1c"`, s); await document.fonts.ready; }, sample);
    await page.screenshot({ path: OUT_PNG, clip: { x: 0, y: 0, width: W, height: H }, type: 'png' });
    console.log(`wrote ${path.relative(ROOT, OUT_PNG)} (${(fs.statSync(OUT_PNG).size / 1024).toFixed(0)} KB)`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
