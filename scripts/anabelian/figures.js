/*
 * figures.js — the inline SVG figures of anabelian_guide.pdf.
 *
 * Each export is a function (V) => '<svg …>' where V holds the computed numbers of build.js.
 * Labels that need math are written as HTML inside <foreignObject> with \( … \) delimiters;
 * build.js renders them with KaTeX after the figures are inserted, like the body text.
 *
 * Colour code (used in every figure and stated in §0 of the guide):
 *   sora   blue    étale-like objects: groups, containers, "zero mass"
 *   yuzu   orange  Frobenius-like objects: monoids, Frobenioids, "positive mass"
 *   matcha green   reconstructed ring / field structures (the output)
 *   sakura pink    indeterminacies, links, warnings
 *   fuji   purple  the algorithm itself
 * The mascot Musubi (an onigiri) is an original drawing.
 */
'use strict';

const C = {
  ink: '#2a2433', soft: '#6b6178', rule: '#e4dcef', white: '#ffffff',
  sora: '#3a74c4', soraBg: '#eef4fc', soraLn: '#c6d9f3',
  yuzu: '#c98a10', yuzuBg: '#fff8e6', yuzuLn: '#f0d79b',
  matcha: '#3f8f5a', matchaBg: '#eff8f1', matchaLn: '#c3e3cc',
  sakura: '#e85d8a', sakuraBg: '#fff2f6', sakuraLn: '#f6c3d4',
  fuji: '#7a5cc4', fujiBg: '#f3effc', fujiLn: '#d6caf2',
  nori: '#2f3b33', rice: '#fffdf7',
};
const SANS = "Inter, 'M PLUS Rounded 1c', 'DejaVu Sans', sans-serif";
const ROUND = "'M PLUS Rounded 1c', Inter, 'DejaVu Sans', sans-serif";
const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

let figNo = 0;
function svg(w, h, body, label) {
  const id = `f${++figNo}`;
  const cols = ['ink', 'soft', 'sora', 'yuzu', 'matcha', 'sakura', 'fuji'];
  const markers = cols.map(c => `<marker id="${id}-${c}" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto-start-reverse"><path d="M0,0.6 L10,5 L0,9.4 z" fill="${C[c]}"/></marker>`).join('');
  const out = body.replace(/url\(#M-(\w+)\)/g, (m, c) => `url(#${id}-${c})`);
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label || '')}"><defs>${markers}</defs>${out}</svg>`;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attrs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}="${v}"`).join(' ');

function rect(x, y, w, h, o = {}) {
  return `<rect ${attrs({ x, y, width: w, height: h, rx: o.r ?? 6, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw ?? (o.stroke ? 1 : undefined), 'stroke-dasharray': o.dash, opacity: o.opacity })}/>`;
}
function circ(cx, cy, r, o = {}) {
  return `<circle ${attrs({ cx, cy, r, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw ?? (o.stroke ? 1 : undefined), 'stroke-dasharray': o.dash, opacity: o.opacity })}/>`;
}
function ell(cx, cy, rx, ry, o = {}) {
  return `<ellipse ${attrs({ cx, cy, rx, ry, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw ?? (o.stroke ? 1 : undefined), 'stroke-dasharray': o.dash, opacity: o.opacity })}/>`;
}
function path(d, o = {}) {
  return `<path ${attrs({ d, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw ?? (o.stroke ? 1 : undefined), 'stroke-dasharray': o.dash, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.opacity, 'marker-end': o.end ? `url(#M-${o.end})` : undefined, 'marker-start': o.start ? `url(#M-${o.start})` : undefined })}/>`;
}
/* straight arrow, optionally shortened at both ends */
function arrow(x1, y1, x2, y2, col = 'ink', o = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, s = o.gap ?? 0, s2 = o.gap2 ?? s;
  const a = [x1 + dx * s / L, y1 + dy * s / L], b = [x2 - dx * s2 / L, y2 - dy * s2 / L];
  return path(`M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`, { stroke: C[col], sw: o.sw ?? 1.3, dash: o.dash, end: o.head === false ? undefined : col, start: o.both ? col : undefined });
}
/* quadratic curved arrow through a control point */
function carrow(x1, y1, cx, cy, x2, y2, col = 'ink', o = {}) {
  return path(`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, { stroke: C[col], sw: o.sw ?? 1.3, dash: o.dash, end: o.head === false ? undefined : col, start: o.both ? col : undefined });
}
function txt(x, y, s, o = {}) {
  return `<text ${attrs({ x, y, 'font-family': o.font ?? SANS, 'font-size': o.size ?? 9, 'font-weight': o.weight ?? 500, fill: o.fill ?? C.ink, 'text-anchor': o.anchor ?? 'start', 'font-style': o.italic ? 'italic' : undefined, 'letter-spacing': o.ls })}>${esc(s)}</text>`;
}
/* an HTML label (may contain \( … \) math) in a box; align: left|center|right */
function fo(x, y, w, h, html, o = {}) {
  const just = { left: 'flex-start', center: 'center', right: 'flex-end' }[o.align ?? 'center'];
  const vj = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[o.valign ?? 'middle'];
  return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;display:flex;flex-direction:column;justify-content:${vj};align-items:${just};text-align:${o.align ?? 'center'};font-family:${o.font ?? "'Source Serif 4', 'Noto Serif JP', serif"};font-size:${o.size ?? 8.6}px;line-height:${o.lh ?? 1.25};color:${o.color ?? C.ink};font-weight:${o.weight ?? 400};hyphens:none;"><div style="width:100%">${html}</div></div></foreignObject>`;
}
/* a labelled card: coloured border + tinted fill + small caps tag + html body */
function card(x, y, w, h, kind, tag, html, o = {}) {
  const col = C[kind], bg = C[kind + 'Bg'], ln = C[kind + 'Ln'];
  let s = rect(x, y, w, h, { fill: o.fill ?? bg, stroke: o.stroke ?? ln, sw: o.sw ?? 1, r: o.r ?? 7, dash: o.dash });
  if (tag) s += txt(x + 7, y + 11, tag.toUpperCase(), { size: 6.2, weight: 700, fill: col, ls: 0.9 });
  s += fo(x + 5, y + (tag ? 13 : 4), w - 10, h - (tag ? 16 : 8), html, { size: o.size ?? 8.4, align: o.align ?? 'center', valign: o.valign ?? 'middle', lh: o.lh });
  return s;
}

/* the mascot: Musubi, an original onigiri with a nori belt. mood: happy | wink | think | shock */
function musubi(cx, cy, s, mood = 'happy', prop) {
  const h = s * 1.0, w = s * 1.1;
  const top = [cx, cy - h * 0.62], bl = [cx - w * 0.62, cy + h * 0.42], br = [cx + w * 0.62, cy + h * 0.42];
  let o = ell(cx, cy + h * 0.52, w * 0.5, h * 0.07, { fill: '#000', opacity: 0.08 });
  o += path(`M${top[0]},${top[1]} C${top[0] + w * 0.16},${top[1] - h * 0.04} ${br[0] + w * 0.06},${br[1] - h * 0.18} ${br[0]},${br[1]} C${br[0] - w * 0.1},${br[1] + h * 0.12} ${bl[0] + w * 0.1},${bl[1] + h * 0.12} ${bl[0]},${bl[1]} C${bl[0] - w * 0.06},${bl[1] - h * 0.18} ${top[0] - w * 0.16},${top[1] - h * 0.04} ${top[0]},${top[1]} Z`,
    { fill: C.rice, stroke: '#d9cbb3', sw: Math.max(0.8, s * 0.035) });
  /* nori belt */
  o += path(`M${cx - w * 0.3},${cy + h * 0.5} L${cx - w * 0.26},${cy + h * 0.12} Q${cx},${cy + h * 0.06} ${cx + w * 0.26},${cy + h * 0.12} L${cx + w * 0.3},${cy + h * 0.5} Q${cx},${cy + h * 0.56} ${cx - w * 0.3},${cy + h * 0.5} Z`, { fill: C.nori });
  /* a grain of rice-paper sparkle on the belt */
  o += circ(cx + w * 0.16, cy + h * 0.22, s * 0.025, { fill: '#7f9a86' });
  const ey = cy - h * 0.08, ex = w * 0.17, er = s * 0.055, ink = C.ink;
  const eye = (x, k) => {
    if (k === 'happy') return path(`M${x - er},${ey + er * 0.4} Q${x},${ey - er * 1.2} ${x + er},${ey + er * 0.4}`, { stroke: ink, sw: s * 0.035 });
    if (k === 'shock') return circ(x, ey, er * 1.05, { fill: '#fff', stroke: ink, sw: s * 0.03 }) + circ(x, ey, er * 0.4, { fill: ink });
    return ell(x, ey, er * 0.8, er * 1.05, { fill: ink }) + circ(x + er * 0.25, ey - er * 0.35, er * 0.33, { fill: '#fff' });
  };
  const L = mood === 'wink' ? 'dot' : mood === 'think' ? 'dot' : mood;
  const R = mood === 'wink' ? 'happy' : mood === 'think' ? 'happy' : mood;
  o += eye(cx - ex, L) + eye(cx + ex, R);
  o += ell(cx - w * 0.3, ey + h * 0.13, s * 0.07, s * 0.04, { fill: '#ffa8c4', opacity: 0.85 });
  o += ell(cx + w * 0.3, ey + h * 0.13, s * 0.07, s * 0.04, { fill: '#ffa8c4', opacity: 0.85 });
  const my = ey + h * 0.13, mw = s * 0.04;
  o += mood === 'shock' ? ell(cx, my + mw * 0.6, mw * 0.9, mw * 1.2, { fill: ink })
    : path(`M${cx - 2 * mw},${my} Q${cx - mw},${my + mw * 1.6} ${cx},${my} Q${cx + mw},${my + mw * 1.6} ${cx + 2 * mw},${my}`, { stroke: ink, sw: s * 0.03 });
  if (prop === 'lens') {
    const lx = cx + w * 0.62, ly = cy - h * 0.05;
    o += path(`M${lx - s * 0.09},${ly + s * 0.12} L${lx - s * 0.26},${ly + s * 0.36}`, { stroke: '#8a6a3a', sw: s * 0.07 });
    o += circ(lx, ly, s * 0.16, { fill: '#eaf3ff', stroke: '#8a6a3a', sw: s * 0.045, opacity: 0.95 });
    o += path(`M${lx - s * 0.08},${ly - s * 0.05} Q${lx - s * 0.04},${ly - s * 0.11} ${lx + s * 0.03},${ly - s * 0.1}`, { stroke: '#fff', sw: s * 0.03 });
  }
  if (prop === 'sweat') o += path(`M${cx + w * 0.42},${cy - h * 0.3} q${s * 0.05},${s * 0.09} 0,${s * 0.12} q${-s * 0.05},${-s * 0.03} 0,${-s * 0.12} Z`, { fill: '#9fd0ff' });
  return o;
}
/* speech bubble whose tail points at (tx, ty) */
function bubble(x, y, w, h, html, tx, ty, o = {}) {
  const r = 7, col = o.stroke ?? C.sakuraLn, fill = o.fill ?? '#fff';
  const bx = Math.max(x + r + 6, Math.min(x + w - r - 16, tx - 6));
  let d = `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} `;
  if (ty > y + h) d += `L${bx + 12},${y + h} L${tx},${ty} L${bx},${y + h} `;
  d += `L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} `;
  if (tx < x) d += `L${x},${y + h * 0.65} L${tx},${ty} L${x},${y + h * 0.35} `;
  d += `L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
  return path(d, { fill, stroke: col, sw: 1 }) + fo(x + 4, y + 2, w - 8, h - 4, html, { size: o.size ?? 7.6, font: ROUND, weight: 500, color: o.color ?? C.ink, lh: 1.2 });
}

/* ================================================================== figures */
const F = {};

/* masthead art: Musubi with a magnifying glass looking at a profinite tower */
F.mast = () => {
  let s = '';
  /* a profinite group as an inverse system of finite quotients */
  const xs = [30, 70, 110, 150];
  const lv = [[0], [-1, 1], [-1.5, -0.5, 0.5, 1.5], [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75]];
  lv.forEach((row, i) => row.forEach((u, j) => {
    const x = 92 + u * 34, y = 22 + i * 26;
    if (i > 0) { const par = lv[i - 1][Math.floor(j / 2)]; s += path(`M${92 + par * 34},${22 + (i - 1) * 26} L${x},${y}`, { stroke: C.soraLn, sw: 1.1 }); }
    s += circ(x, y, 4.2 - i * 0.6, { fill: i === 0 ? C.sora : C.soraBg, stroke: C.sora, sw: 0.9 });
  }));
  s += txt(92, 120, '⋮ ', { anchor: 'middle', fill: C.sora, size: 11 });
  s += musubi(200, 74, 62, 'happy', 'lens');
  s += bubble(232, 10, 128, 34, 'One group in, one field out. No peeking at the original!', 222, 48);
  return svg(370, 130, s, 'Musubi the onigiri inspects a profinite group');
};

/* Fig. 1 — bi-anabelian versus mono-anabelian */
F.monobi = () => {
  let s = '';
  s += txt(8, 14, 'BI-ANABELIAN · “spot the difference”', { size: 7.4, weight: 700, fill: C.soft, ls: 0.6 });
  s += card(8, 22, 92, 40, 'sora', 'group 1', '\\(\\Pi_{X_1}\\)', { size: 11 });
  s += card(8, 70, 92, 40, 'sora', 'group 2', '\\(\\Pi_{X_2}\\)', { size: 11 });
  s += arrow(54, 62, 54, 70, 'sakura', { both: true });
  s += fo(60, 60, 60, 12, '\\(\\sim\\)', { size: 9, color: C.sakura, align: 'left' });
  s += card(130, 40, 112, 52, 'fuji', 'comparison theorem', '\\(\\mathrm{Isom}(X_1,X_2)\\;\\xrightarrow{\\sim}\\;\\mathrm{Isom}^{\\mathrm{Out}}(\\Pi_{X_1},\\Pi_{X_2})\\)', { size: 8.4 });
  s += arrow(100, 66, 130, 66, 'fuji');
  s += fo(118, 94, 136, 22, 'needs <b>two</b> objects and an isomorphism between them', { size: 7, color: C.soft });
  /* divider */
  s += path('M256,10 L256,118', { stroke: C.rule, sw: 1, dash: '3 3' });
  s += txt(268, 14, 'MONO-ANABELIAN · “the recipe”', { size: 7.4, weight: 700, fill: C.soft, ls: 0.6 });
  s += card(268, 40, 64, 52, 'sora', 'input', 'one abstract<br/>group \\(\\Pi\\)', { size: 8.6 });
  s += card(346, 30, 78, 72, 'fuji', 'algorithm', 'software written<br/>in the language of<br/>topological groups', { size: 8 });
  s += card(438, 26, 58, 80, 'matcha', 'output', '\\(\\Delta, G_k\\), cusps,<br/>cyclotome,<br/>\\(\\overline{k}\\) with \\(+,\\times\\)', { size: 7.4 });
  s += arrow(332, 66, 346, 66, 'fuji');
  s += arrow(424, 66, 438, 66, 'fuji');
  s += fo(262, 106, 238, 16, 'mono \\(\\Rightarrow\\) bi formally; bi \\(\\Rightarrow\\) mono is not known; IUT needs mono', { size: 7, color: C.soft });
  return svg(500, 122, s, 'bi-anabelian comparison versus mono-anabelian algorithm');
};

/* Fig. 2 — the two dimensions of G_k and of C^× */
F.twodim = () => {
  let s = '';
  const panel = (x0, title, rigidLabel, floppyLabel, rigidNote, floppyNote) => {
    let o = rect(x0, 6, 236, 150, { fill: '#fcfbfe', stroke: C.rule });
    o += txt(x0 + 10, 20, title, { size: 8, weight: 700, fill: C.ink });
    /* axes: horizontal rigid straight line, vertical floppy wiggle */
    const ox = x0 + 52, oy = 120;
    o += arrow(ox, oy, ox + 160, oy, 'sora', { sw: 2.2 });
    for (let i = 1; i <= 6; i++) o += path(`M${ox + i * 24},${oy - 3} L${ox + i * 24},${oy + 3}`, { stroke: C.sora, sw: 1.2 });
    let d = `M${ox},${oy}`;
    for (let i = 1; i <= 40; i++) { const t = i / 40; d += ` L${(ox + 7 * Math.sin(t * 18) * (0.4 + t)).toFixed(1)},${(oy - t * 84).toFixed(1)}`; }
    o += path(d, { stroke: C.sakura, sw: 1.8, end: 'sakura' });
    o += path(`M${ox},${oy} L${ox},${oy - 84}`, { stroke: C.sakuraLn, sw: 0.8, dash: '2 2' });
    o += fo(ox + 40, oy + 4, 130, 26, rigidLabel, { size: 8.2, color: C.sora });
    o += fo(x0 + 4, 26, 46, 66, floppyLabel, { size: 8.2, color: C.sakura });
    o += fo(ox + 22, 36, 150, 42, floppyNote, { size: 7.4, color: C.soft, align: 'left' });
    o += fo(ox + 22, 82, 150, 26, rigidNote, { size: 7.4, color: C.soft, align: 'left' });
    return o;
  };
  s += panel(4, 'p-adic: the Galois group Gₖ',
    'unramified \\(G_k \\twoheadrightarrow \\widehat{\\mathbb{Z}}\\cdot\\mathrm{Fr}\\)', 'inertia<br/>\\(I_k\\)',
    'rigid: every automorphism of \\(G_k\\) keeps Frobenius', 'floppy: some automorphisms of \\(G_k\\) do not come from fields (they need not preserve the ramification filtration)');
  s += panel(260, 'complex: the multiplicative group ℂ×',
    'units \\(S^1 = \\mathcal{O}^\\times_{\\mathbb{C}}\\)', 'value<br/>group<br/>\\(\\mathbb{R}_{&gt;0}\\)',
    'rigid: a compact circle has only \\(z\\mapsto z^{\\pm1}\\)', 'floppy: \\(\\mathbb{R}_{&gt;0}\\) has the dilations \\(r\\mapsto r^{\\lambda}\\), the Teichmüller stretch');
  return svg(500, 160, s, 'one rigid and one floppy dimension in G_k and in the complex numbers');
};

/* Fig. 3 — sugoroku of [AbsAnab] Prop 1.2.1 */
F.localboard = () => {
  let s = '';
  const sq = [
    ['START', '\\(G_k\\)', 'an abstract profinite group', 'sora'],
    ['1', '\\(G_k^{\\mathrm{ab}}\\) ranks', 'the prime \\(l\\) with \\(\\mathrm{rk}_{\\mathbb{Z}_l}\\ge 2\\) is \\(p\\)', 'fuji'],
    ['2', '\\(d=[k:\\mathbb{Q}_p]\\)', '\\(\\mathrm{rk}_{\\mathbb{Z}_p}G_k^{\\mathrm{ab}}-1\\)', 'fuji'],
    ['3', '\\(q=p^f\\)', 'prime-to-\\(p\\) torsion has order \\(q-1\\)', 'fuji'],
    ['4', 'inertia \\(I_k\\)', 'open \\(H\\) is unramified iff \\(e\\) does not grow', 'fuji'],
    ['5', 'Frobenius', 'acts on \\(\\mu_{q-1}\\) of unramified \\(H\\) as \\(x\\mapsto x^{q}\\)', 'fuji'],
    ['6', '\\(\\mu_{\\mathbb{Q}/\\mathbb{Z}}(G_k)\\)', '\\(\\varinjlim (H^{\\mathrm{ab}})_{\\mathrm{tors}}\\) by transfer: the cyclotome', 'fuji'],
    ['7', '\\(\\chi_{\\mathrm{cyc}}\\), \\(H^2\\cong\\mathbb{Q}/\\mathbb{Z}\\)', 'cyclotomic character and the Brauer residue map', 'fuji'],
    ['GOAL?', 'not \\(k\\) itself', 'the ring structure is still missing', 'sakura'],
  ];
  const W = 104, Hh = 52, gap = 14;
  const pos = i => { const row = Math.floor(i / 4), col = row % 2 === 0 ? i % 4 : 3 - (i % 4); return [8 + col * (W + gap), 8 + row * (Hh + 20)]; };
  sq.forEach(([n, head, body, kind], i) => {
    const [x, y] = pos(i);
    if (i > 0) {
      const [px, py] = pos(i - 1);
      if (py === y) s += arrow(px < x ? px + W : px, py + Hh / 2, px < x ? x : x + W, y + Hh / 2, 'soft', { gap: 1 });
      else s += arrow(px + W / 2, py + Hh, x + W / 2, y, 'soft', { gap: 1 });
    }
    s += card(x, y, W, Hh, kind, n, `<b>${head}</b><br/><span style="font-size:7px;color:${C.soft}">${body}</span>`, { size: 8.2 });
  });
  s += musubi(470, 196, 34, 'shock', 'sweat');
  s += bubble(338, 168, 100, 30, 'Seven squares and still no addition?!', 452, 190);
  return svg(500, 222, s, 'the reconstruction of local invariants from G_k as a sugoroku board');
};

/* Fig. 4 — Uchida's addition on P^1, with the computed numbers */
F.uchida = V => {
  let s = '';
  const ox = 70, oy = 160, sx = 70, sy = 9.5;     /* t ∈ [−1.6, 1.6], values ∈ [−2, 14] */
  const X = t => ox + 80 + t * sx, Y = v => oy - v * sy;
  s += path(`M${X(-1.7)},${Y(0)} L${X(1.75)},${Y(0)}`, { stroke: C.soft, sw: 0.8, end: 'soft' });
  s += path(`M${X(0)},${Y(-1.5)} L${X(0)},${Y(14.5)}`, { stroke: C.rule, sw: 0.8 });
  s += txt(X(1.75) + 4, Y(0) + 3, 't', { size: 8, italic: true, fill: C.soft });
  const line = (a, b, col, dash) => path(`M${X(-1.6)},${Y(a + b * -1.6)} L${X(1.6)},${Y(a + b * 1.6)}`, { stroke: C[col], sw: 1.6, dash });
  s += line(V.lam, -V.lam, 'sora');
  s += line(V.mu, V.mu, 'yuzu');
  s += line(V.ga, V.gb, 'matcha', '5 3');
  const dot = (t, v, col) => circ(X(t), Y(v), 2.6, { fill: C[col], stroke: '#fff', sw: 0.8 });
  s += dot(1, 0, 'sora') + dot(-1, 0, 'yuzu');
  s += dot(1, V.gy1, 'matcha') + dot(-1, V.gy2, 'matcha');
  s += dot(0, V.lam, 'sora') + dot(0, V.mu, 'yuzu') + dot(0, V.ga, 'matcha');
  for (const [t, nm] of [[0, 'x = 0'], [1, 'y₁ = 1'], [-1, 'y₂ = −1']]) {
    s += path(`M${X(t)},${Y(0)} L${X(t)},${Y(13.5)}`, { stroke: C.rule, sw: 0.6, dash: '2 2' });
    s += txt(X(t), Y(0) + 11, nm, { anchor: 'middle', size: 7.4, fill: C.soft });
  }
  s += fo(X(1.04), Y(8.9), 60, 14, `\\(g(y_1)=${V.gy1}\\)`, { size: 7.4, align: 'left', color: C.matcha });
  s += fo(X(-1.62), Y(4.2), 44, 14, `\\(g(y_2)=${V.gy2}\\)`, { size: 7.4, align: 'left', color: C.matcha });
  s += fo(X(-1.5), Y(11.4), X(-0.04) - X(-1.5), 14, `\\(g(x)=${V.ga}=${V.lam}+${V.mu}\\)`, { size: 7.6, align: 'right', color: C.matcha, weight: 700 });
  s += fo(X(0.06), Y(4.3), 64, 14, `\\(f_{\\lambda,1}(x)=${V.lam}\\)`, { size: 7.2, align: 'left', color: C.sora });
  s += fo(X(-0.95), Y(6.5), X(-0.05) - X(-0.95), 14, `\\(f_{\\mu,2}(x)=${V.mu}\\)`, { size: 7.2, align: 'right', color: C.yuzu });
  /* legend */
  s += card(318, 14, 176, 128, 'fuji', 'the trick, multiplicatively',
    `<div style="text-align:left">
      <span style="color:${C.sora}">\\(f_{\\lambda,1}=${V.lam}(1-t)\\)</span>: value \\(${V.lam}\\) at \\(x\\), zero at \\(y_1\\)<br/>
      <span style="color:${C.yuzu}">\\(f_{\\mu,2}=${V.mu}(1+t)\\)</span>: value \\(${V.mu}\\) at \\(x\\), zero at \\(y_2\\)<br/>
      <span style="color:${C.matcha}">\\(g\\)</span>: the <i>unique</i> element of \\(\\Gamma^\\times(D)\\) with \\(g(y_1)=f_{\\mu,2}(y_1)\\) and \\(g(y_2)=f_{\\lambda,1}(y_2)\\)<br/>
      Then \\(g=f_{\\lambda,1}+f_{\\mu,2}=${V.ga}+${V.gb}t\\) and \\(\\lambda+\\mu=g(x)\\).
      Finding \\(g\\) uses divisors, evaluation and \\(\\times\\) only.</div>`, { size: 7.5, align: 'left' });
  s += musubi(440, 168, 30, 'wink');
  s += bubble(318, 150, 104, 30, 'Uchida-sensei’s abacus: no + key needed.', 425, 164, { size: 7 });
  return svg(500, 190, s, "Uchida's lemma computing 3+5=8 from multiplicative data");
};

/* Fig. 5 — Kummer theory: monoid into the étale-like container */
F.kummer = () => {
  let s = '';
  /* Frobenius-like monoid */
  s += card(8, 34, 120, 96, 'yuzu', 'Frobenius-like', '', {});
  const pts = [[30, 66], [52, 56], [74, 74], [96, 60], [44, 92], [70, 100], [104, 88], [90, 104]];
  pts.forEach(([x, y]) => (s += circ(x, y, 3.4, { fill: C.yuzu, opacity: 0.85 })));
  s += fo(14, 112, 108, 16, '\\(\\mathcal{O}^\\times(U)\\), \\(K^\\times\\), \\(\\mathcal{O}^{\\rhd}_{\\overline{k}}\\), …', { size: 7.6, color: C.yuzu });
  /* container */
  s += rect(196, 18, 196, 128, { fill: C.soraBg, stroke: C.sora, sw: 1.4, r: 10 });
  s += txt(206, 32, 'ÉTALE-LIKE CONTAINER', { size: 6.4, weight: 700, fill: C.sora, ls: 0.9 });
  s += fo(206, 34, 180, 18, '\\(H^1\\big(\\Pi_U,\\;\\mu_{\\widehat{\\mathbb{Z}}}(\\Pi_U)\\big)\\), built from \\(\\Pi_U\\) alone', { size: 8, align: 'left', color: C.sora });
  s += rect(222, 60, 144, 74, { fill: '#fff', stroke: C.soraLn, sw: 1, r: 8, dash: '3 2' });
  pts.forEach(([x, y]) => (s += circ(x + 204, y + 6, 3.4, { fill: C.sora, opacity: 0.75 })));
  s += fo(228, 116, 132, 16, 'image of \\(\\kappa\\): characterized by divisors', { size: 7.2, color: C.sora });
  /* Kummer arrows */
  [[30, 66], [74, 74], [96, 60], [70, 100]].forEach(([x, y]) => (s += carrow(x + 4, y, (x + 234) / 2 + 10, y - 26, x + 200, y + 6, 'yuzu', { sw: 0.8, dash: '2 2' })));
  s += fo(118, 2, 90, 26, 'Kummer map \\(\\kappa\\):<br/>\\(f\\mapsto\\) torsor of its roots', { size: 7, color: C.yuzu });
  /* cyclotomic dial */
  s += circ(160, 140, 13, { fill: C.sakuraBg, stroke: C.sakura, sw: 1.2 });
  s += path('M160,140 L168,132', { stroke: C.sakura, sw: 1.6 });
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += path(`M${160 + 10 * Math.cos(a)},${140 + 10 * Math.sin(a)} L${160 + 13 * Math.cos(a)},${140 + 13 * Math.sin(a)}`, { stroke: C.sakura, sw: 0.7 }); }
  s += fo(110, 155, 108, 30, 'the cyclotomic rigidity dial: which \\(\\lambda\\in\\widehat{\\mathbb{Z}}^\\times\\) identifies \\(\\mu(\\text{monoid})\\cong\\mu(\\Pi)\\)?', { size: 7, color: C.sakura });
  /* restriction to inertia */
  s += arrow(392, 82, 420, 82, 'sora');
  s += card(420, 50, 74, 64, 'sora', 'cusps', '\\(\\bigoplus_{x\\in S}\\widehat{\\mathbb{Z}}\\)<br/><span style="font-size:7px">restrict to inertia \\(I_x\\): order of zero or pole at \\(x\\)</span>', { size: 8.4 });
  s += fo(396, 118, 100, 54, '\\(1\\to(k^\\times)^{\\wedge}\\to H^1(\\Pi_U,M_X)\\to\\bigoplus_{x\\in S}\\widehat{\\mathbb{Z}}\\)<br/>[AbsTopIII] Prop 1.6 (iii)', { size: 6.8, color: C.soft });
  return svg(500, 186, s, 'Kummer theory embeds Frobenius-like functions into an étale-like cohomology container');
};

/* Fig. 6 — Belyi cuspidalization */
F.belyi = V => {
  let s = '';
  /* upper P^1 as a circle (the real points of P^1) */
  const circle = (cx, cy, r, marks, title) => {
    let o = circ(cx, cy, r, { stroke: C.soft, sw: 1.1, fill: '#fcfbfe' });
    o += txt(cx, cy - r - 22, title, { anchor: 'middle', size: 7.8, weight: 600, fill: C.soft });
    marks.forEach(([ang, lab, col, ram]) => {
      const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
      o += circ(x, y, ram ? 4.2 : 3.2, { fill: '#fff', stroke: C[col], sw: ram ? 2.2 : 1.6 });
      const lx = cx + (r + 13) * Math.cos(ang), ly = cy + (r + 13) * Math.sin(ang) + 3;
      o += txt(lx, ly, lab, { anchor: 'middle', size: 8, fill: C[col], weight: 600 });
    });
    return o;
  };
  const up = Math.PI * -0.5, rt = 0, dn = Math.PI * 0.5, lf = Math.PI;
  s += circle(66, 66, 30, [[lf, '0', 'yuzu'], [dn, '½', 'sakura', 1], [rt, '1', 'yuzu'], [up, '∞', 'sora', 1]], 'W = ℙ¹ ∖ {0, ½, 1, ∞}');
  s += circle(66, 192, 30, [[lf, '0', 'yuzu'], [rt, '1', 'sakura'], [up, '∞', 'sora']], 'P = ℙ¹ ∖ {0, 1, ∞}');
  s += carrow(112, 72, 128, 128, 112, 184, 'fuji', { sw: 1.6 });
  s += fo(124, 104, 58, 46, '\\(\\beta=4t(1-t)\\)<br/>degree 2, étale over \\(P\\)', { size: 7, align: 'left', color: C.fuji });
  s += fo(4, 228, 180, 26, 'rings: ramified points. \\(\\beta\\) is branched only over \\(0,1,\\infty\\), so over \\(P\\) it is étale', { size: 6.8, color: C.soft });
  /* the chain for 2/5 */
  s += txt(196, 14, `A HARDER POINT: x = 2/5, β = ${V.belyiC}·t²(1−t)³`, { size: 7.4, weight: 700, fill: C.fuji, ls: 0.4 });
  const steps = [
    ['\\(\\Pi_P\\)', 'start: \\(\\mathbb{P}^1\\setminus\\{0,1,\\infty\\}\\)', 'sora'],
    ['\\(\\Pi_W\\subseteq\\Pi_P\\)', `open subgroup of index ${V.belyiDeg} (the Belyi cover, ${V.belyiPunct} punctures)`, 'fuji'],
    ['\\(\\Pi_W\\twoheadrightarrow\\cdots\\)', `fill in the 3 extra punctures \\(${V.belyiR0}\\), \\(${V.belyiRe}\\pm ${V.belyiIm}i\\)`, 'fuji'],
    ['\\(\\Pi_{U\\setminus\\{2/5\\}}\\)', 'the cuspidalization we wanted', 'matcha'],
    ['\\(\\Pi_{U\\setminus\\{2/5\\}}\\twoheadrightarrow\\Pi_U\\)', 'fill in \\(2/5\\): its inertia group is the decomposition group we were after', 'matcha'],
  ];
  steps.forEach(([h, b, k], i) => {
    const y = 22 + i * 44;
    s += card(196, y, 300, 36, k, null, `<div style="display:flex;gap:8px;align-items:center;width:100%"><div style="min-width:96px;font-size:9px"><b>${h}</b></div><div style="text-align:left;font-size:7.4px;color:${C.soft}">${b}</div></div>`, { size: 8 });
    if (i > 0) s += arrow(214, y - 8, 214, y, 'fuji', { gap: 0 });
    s += txt(186, y + 22, ['', '⊂', '•••', '', '•'][i], { anchor: 'middle', size: 9, weight: 700, fill: C.fuji });
  });
  s += fo(196, 240, 300, 16, 'type-chain \\(\\subset,\\bullet,\\ldots,\\bullet\\): one finite étale cover, then de-cuspidalizations ([AbsTopII] Ex 3.6)', { size: 6.8, color: C.soft });
  return svg(500, 258, s, 'Belyi cuspidalization: a Belyi map turns a point into a cusp');
};

/* Fig. 7 — elliptic cuspidalization */
F.elliptic = V => {
  let s = '';
  const torus = (x0, y0, w, N, title, holeAll) => {
    const sk = w * 0.32;
    let o = path(`M${x0},${y0 + w * 0.75} L${x0 + w},${y0 + w * 0.75} L${x0 + w + sk},${y0} L${x0 + sk},${y0} Z`, { fill: '#fcfbfe', stroke: C.soft, sw: 1.1 });
    o += txt(x0 + (w + sk) / 2, y0 + w * 0.75 + 14, title, { anchor: 'middle', size: 7.6, weight: 600, fill: C.soft });
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = i / N, v = j / N;
      const x = x0 + u * w + (1 - v) * sk, y = y0 + v * w * 0.75;
      const isO = i === 0 && j === 0;
      if (!holeAll && !isO) continue;
      o += circ(x + (isO ? 0 : 0), y, isO ? 3.6 : 3, { fill: '#fff', stroke: isO ? C.sakura : C.yuzu, sw: 1.6 });
    }
    return o;
  };
  /* bottom-left corner is the origin (u=0, v=1 → bottom left)?  we place O at (u,v)=(0,0) = top-left+skew */
  s += torus(10, 22, 130, 3, `U = E ∖ E[3]  (9 punctures, Δ free of rank ${V.ellRank3})`, true);
  s += torus(300, 40, 100, 1, 'X = E ∖ {O}  (Δ free of rank 2)', false);
  s += arrow(196, 70, 296, 70, 'fuji', { sw: 1.6 });
  s += fo(200, 36, 94, 32, '\\([3]: U\\to X\\)<br/>finite étale, degree 9', { size: 7.8, color: C.fuji });
  s += carrow(296, 104, 246, 128, 196, 104, 'sora', { sw: 1.3 });
  s += fo(186, 128, 120, 14, '\\(U\\hookrightarrow X\\): fill the holes', { size: 7.4, color: C.sora });
  s += card(10, 160, 486, 58, 'fuji', 'the same group, two jobs',
    `\\(\\Pi_U\\) is an open subgroup of \\(\\Pi_X\\) of index \\(9\\) (via \\([3]\\)) <i>and</i> it surjects onto \\(\\Pi_X\\) (via \\(U\\subseteq X\\)). So \\(\\Pi_X\\) alone produces the cuspidalization \\(\\Pi_{U}\\twoheadrightarrow\\Pi_X\\) and the decomposition groups of the torsion points. For 11a1 with \\(N=2\\) the four removed points are \\(O\\) and the points with \\(x = ${V.e2real}\\), \\(${V.e2re}\\pm${V.e2im}i\\).`, { size: 7.8, align: 'left' });
  return svg(500, 222, s, 'elliptic cuspidalization: multiplication by N makes torsion points into cusps');
};

/* Fig. 8 — the main algorithm [AbsTopIII] Thm 1.9 as a pipeline */
F.pipeline = () => {
  let s = '';
  const nodes = [
    ['in', 'sora', 'input', '\\(\\Pi_X\\)', 'one profinite group, \\(X\\) of strictly Belyi type'],
    ['0', 'fuji', 'step 0', '\\(\\Delta_X\\subseteq\\Pi_X\\twoheadrightarrow G_k\\)', 'geometric vs arithmetic part ([AbsTopI] Thm 2.6)'],
    ['a', 'fuji', '(a) Belyi cusp.', '\\(\\Pi_U\\twoheadrightarrow\\Pi_Y\\)', 'decomposition groups of all NF-points'],
    ['b', 'fuji', '(b) cyclotomes', '\\(I_z\\xrightarrow{\\sim}M_Z\\)', 'inertia \\(=\\) dual of \\(H^2(\\Delta_Z)\\) (Prop 1.4)'],
    ['c', 'fuji', '(c) principal divisors', '\\(P_U\\subseteq H^1(\\Pi_U,M_Z)\\)', 'Jacobian sections test principality (Prop 1.6)'],
    ['d', 'fuji', '(d) Kummer classes', '\\(K_{Z_{\\mathrm{NF}}}^\\times\\hookrightarrow\\varinjlim H^1(\\Pi_V,M_Z)\\)', 'functions vanish somewhere, constants are values (Prop 1.8)'],
    ['e', 'fuji', '(e) Uchida', 'additive structure', 'addition from \\(\\times\\), divisors, evaluation (Prop 1.3)'],
    ['out', 'matcha', 'output', '\\(\\overline{k}_{\\mathrm{NF}}\\), \\(K_{Z_{\\mathrm{NF}}}\\) as fields', 'functorial in \\(\\Pi_X\\) and in the base field'],
  ];
  const W = 112, Hh = 66;
  const pos = i => { const row = Math.floor(i / 4), col = row === 0 ? i : 7 - i; return [6 + col * (W + 12), 10 + row * (Hh + 34)]; };
  nodes.forEach(([id, k, tag, head, body], i) => {
    const [x, y] = pos(i);
    if (i > 0) {
      const [px, py] = pos(i - 1);
      if (py === y) s += arrow(px < x ? px + W : px, y + Hh / 2, px < x ? x : x + W, y + Hh / 2, 'fuji', { gap: 1 });
      else s += arrow(px + W / 2, py + Hh, x + W / 2, y, 'fuji', { gap: 1 });
    }
    s += card(x, y, W, Hh, k, tag, `<b style="font-size:8.6px">${head}</b><br/><span style="font-size:6.9px;color:${C.soft}">${body}</span>`, { size: 8.4 });
  });
  /* side note */
  s += card(6, 186, 300, 40, 'matcha', 'MLF bonus — Cor 1.10',
    'over a \\(p\\)-adic field, the same input also gives \\(\\overline{k}\\), \\(k\\) and \\(\\overline{k}^\\times\\) with its ring structure, not just the NF-portion', { size: 7.6, align: 'left' });
  s += card(316, 186, 178, 40, 'sakura', 'slogan, [IUTchI] §I4',
    '[AbsTopIII] §1 \\(=\\) Uchida’s lemma \\(+\\) Belyi cuspidalization', { size: 7.8 });
  return svg(500, 230, s, 'the steps of the mono-anabelian reconstruction algorithm of AbsTopIII Theorem 1.9');
};

/* Fig. 9 — positive characteristic prototype [Alien] Ex 2.6.1 */
F.frobproto = () => {
  let s = '';
  const L = 60, R = 300, T = 30, B = 128, w = 140, h = 34;
  s += card(L, T, w, h, 'sora', 'étale-like', '\\(K(G_K)^{\\mathrm{Kum}}\\)', { size: 10 });
  s += card(R, T, w, h, 'sora', 'étale-like', '\\(K(G_K)^{\\mathrm{Kum}}\\)', { size: 10 });
  s += card(L, B, w, h, 'yuzu', 'Frobenius-like', '\\(K\\) (function field of \\(X/\\mathbb{F}_q\\))', { size: 9 });
  s += card(R, B, w, h, 'yuzu', 'Frobenius-like', '\\(K\\)', { size: 10 });
  s += arrow(R, T + h / 2, L + w, T + h / 2, 'sora', { sw: 1.4, gap: 2 });
  s += fo(L + w + 4, T + h / 2 - 18, R - L - w - 8, 16, '\\(\\cong\\) via \\(\\Psi\\colon G_K\\xrightarrow{\\sim}G_K\\)', { size: 7.4, color: C.sora });
  s += arrow(L + w, B + h / 2, R, B + h / 2, 'sakura', { sw: 1.8, gap: 2 });
  s += fo(L + w, B + h / 2 + 2, R - L - w, 18, '\\(\\Phi^*\\): \\(f\\mapsto f^p\\), degree \\(p\\)!', { size: 7.8, color: C.sakura });
  s += arrow(L + w / 2, B, L + w / 2, T + h, 'yuzu', { gap: 2 });
  s += arrow(R + w / 2, B, R + w / 2, T + h, 'yuzu', { gap: 2 });
  s += fo(L + w / 2 + 4, T + h + 14, 50, 16, '\\(\\kappa\\)', { size: 9, color: C.yuzu, align: 'left' });
  s += fo(R + w / 2 + 4, T + h + 14, 50, 16, '\\(\\kappa\\)', { size: 9, color: C.yuzu, align: 'left' });
  s += fo(L + w + 20, T + h + 4, R - L - w - 40, 54, '<span style="font-size:22px;color:' + C.sakura + '">?</span><br/>does not commute', { size: 7.6, color: C.sakura });
  s += card(8, 176, 236, 50, 'sakura', 'reading (a): pretend it commutes',
    'then every degree would satisfy \\(p\\cdot\\deg=\\deg\\), so all degrees are \\(0\\). Nonsense, like \\(N h = h\\Rightarrow h=0\\).', { size: 7.6, align: 'left' });
  s += card(256, 176, 238, 50, 'matcha', 'reading (b): pay for it in indeterminacy',
    'replace the rigidity \\(\\lambda\\) by \\(\\lambda\\cdot p^{\\mathbb{Z}}\\) and \\(K\\) by \\(K^{\\mathrm{pf}}\\): now it commutes. IUT does exactly this, and then shows the price is small.', { size: 7.6, align: 'left' });
  return svg(500, 230, s, 'Frobenius in positive characteristic: the prototype of mono-anabelian transport');
};

/* Fig. 10 — mono-anabelian transport [Alien] Fig 2.1, with toolkit numbers */
F.transport = V => {
  let s = '';
  const L = 20, R = 320, T = 22, B = 128, w = 160, h = 44;
  s += card(L, T, w, h, 'sora', 'étale-like · domain', '\\(\\Pi_v\\), \\(G_v\\) and what algorithms build from them<br/><span style="font-size:7px">mass 0</span>', { size: 8 });
  s += card(R, T, w, h, 'sora', 'étale-like · codomain', '\\(\\Pi_v\\), \\(G_v\\), same algorithms<br/><span style="font-size:7px">mass 0</span>', { size: 8 });
  s += card(L, B, w, h, 'yuzu', 'Frobenius-like · domain', 'monoids, Frobenioids, \\(\\Theta\\)-pilot<br/><span style="font-size:7px">log-vol \\(' + V.tr_in + '\\)</span>', { size: 8 });
  s += card(R, B, w, h, 'yuzu', 'Frobenius-like · codomain', 'monoids, Frobenioids, \\(q\\)-pilot<br/><span style="font-size:7px">log-vol \\(' + V.tr_out + '\\)</span>', { size: 8 });
  s += arrow(L + w, B + h / 2, R, B + h / 2, 'sakura', { sw: 2, gap: 3 });
  s += fo(L + w + 4, B + h / 2 + 3, R - L - w - 8, 30, 'the link (\\(\\Theta\\) or log): not a ring map, so not computable directly', { size: 7.4, color: C.sakura });
  s += arrow(L + w, T + h / 2, R, T + h / 2, 'sora', { sw: 2, gap: 3, both: true });
  s += fo(L + w + 4, T - 4, R - L - w - 8, 26, 'mono-anabelian rigidity: same algorithm both sides', { size: 7.4, color: C.sora });
  s += fo(L + w + 4, T + h / 2 + 3, R - L - w - 8, 30, `étale-transport indeterminacy (Ind1): ${V.tr_ind1_fmt} label permutations in the toolkit run`, { size: 6.8, color: C.soft });
  s += arrow(L + w / 2, B, L + w / 2, T + h, 'yuzu', { sw: 1.8, gap: 3 });
  s += arrow(R + w / 2, T + h, R + w / 2, B, 'yuzu', { sw: 1.8, gap: 3 });
  s += fo(L + w / 2 + 6, T + h + 8, 130, 40, '① Kummer-detachment: Frobenius-like \\(\\to\\) étale-like (Ind2, Ind3); log-vol \\(' + V.tr_det + '\\)', { size: 7, align: 'left', color: C.yuzu });
  s += fo(R + w / 2 - 136, T + h + 8, 130, 40, '③ inverse Kummer: back to Frobenius-like on the other side', { size: 7, align: 'right', color: C.yuzu });
  s += txt(250, T + h + 30, '② étale-transport', { anchor: 'middle', size: 7.6, fill: C.sora, weight: 700 });
  s += musubi(250, 205, 30, 'happy');
  s += bubble(282, 186, 210, 30, 'Like a Shinkansen bento: the box (étale-like) rides between universes; the food (Frobenius-like) is re-packed on arrival.', 266, 202, { size: 7 });
  return svg(500, 226, s, 'the mono-anabelian transport square');
};

/* Fig. 11 — the Tate curve chain and the theta function (after [Alien] Fig 3.9) */
F.thetachain = () => {
  let s = '';
  const js = [-2, -1, 0, 1, 2];
  js.forEach((j, i) => {
    const cx = 70 + i * 90, cy = 52;
    s += ell(cx, cy, 34, 20, { fill: j === 0 ? C.matchaBg : '#fcfbfe', stroke: j === 0 ? C.matcha : C.soft, sw: 1.1 });
    s += txt(cx, cy - 26, `label ${j}`, { anchor: 'middle', size: 7.6, weight: 600, fill: j === 0 ? C.matcha : C.soft });
    s += circ(cx, cy, 3, { fill: '#fff', stroke: C.yuzu, sw: 1.6 });
    s += txt(cx, cy + 12, 'cusp ∗', { anchor: 'middle', size: 6.6, fill: C.yuzu });
    if (i < js.length - 1) s += path(`M${cx + 34},${cy} L${cx + 56},${cy}`, { stroke: C.soft, sw: 1 });
    s += txt(cx, cy + 38, 'zero: 1', { anchor: 'middle', size: 7, fill: C.yuzu });
    s += txt(cx, cy + 50, `pole: ${['0', '1/2', '2'][j * j === 4 ? 2 : j * j]}`, { anchor: 'middle', size: 7, fill: C.sakura });
  });
  s += txt(18, 56, '⋯', { size: 12, fill: C.soft });
  s += txt(472, 56, '⋯', { size: 12, fill: C.soft });
  s += fo(8, 110, 486, 40, 'special fibre of the tempered cover \\(Y_v\\to X_v\\) (Galois group \\(\\cong\\mathbb{Z}\\)): a chain of \\(\\mathbb{P}^1\\)s glued \\(\\infty\\) to \\(0\\). The theta function has a simple zero at every cusp and a pole of order \\(j^2/2\\) (in units of \\(\\mathrm{ord}(q_v)\\)) on component \\(j\\). The zeros are symmetric under \\(\\mathbb{Z}\\); the poles are not. That asymmetry is why one packages the data as a mono-theta environment.', { size: 7.6, align: 'left', color: C.soft });
  return svg(500, 152, s, 'the chain of projective lines in the special fibre of the Tate curve cover and the orders of the theta function');
};

/* Fig. 12 — log-shells and upper semi-commutativity */
F.logshell = () => {
  let s = '';
  const cx = 130, cy = 92;
  s += circ(cx, cy, 78, { fill: C.soraBg, stroke: C.sora, sw: 1.6 });
  s += fo(cx - 60, cy - 72, 120, 16, '\\(\\mathcal{I}=(2p)^{-1}\\log(\\mathcal{O}_k^\\times)\\)', { size: 8.4, color: C.sora, weight: 700 });
  s += circ(cx - 22, cy + 6, 44, { fill: C.yuzuBg, stroke: C.yuzu, sw: 1.3 });
  s += fo(cx - 52, cy - 32, 40, 16, '\\(\\mathcal{O}_k\\)', { size: 9, color: C.yuzu });
  s += circ(cx + 26, cy + 10, 34, { fill: C.matchaBg, stroke: C.matcha, sw: 1.3, opacity: 0.85 });
  s += fo(cx + 2, cy - 12, 52, 16, '\\(\\log(\\mathcal{O}_k^\\times)\\)', { size: 8, color: C.matcha });
  s += circ(cx + 30, cy + 26, 12, { fill: '#fff', stroke: C.matcha, sw: 1, dash: '2 1.5' });
  s += txt(cx + 30, cy + 29, 'log²', { anchor: 'middle', size: 6, fill: C.matcha });
  /* iterate strip */
  const x0 = 250;
  ['𝒪', '𝒪', '𝒪', '𝒪'].forEach((o, i) => {
    const x = x0 + i * 62;
    s += card(x, 40, 40, 30, 'yuzu', null, `\\(${'\\mathcal{O}_k'}\\)<span style="font-size:6px">${'†‡§¶'[i]}</span>`, { size: 9 });
    s += card(x, 112, 40, 30, 'sora', null, '\\(\\Pi_X\\)', { size: 9 });
    s += arrow(x + 20, 70, x + 20, 112, 'yuzu', { gap: 2, sw: 0.9 });
    if (i < 3) {
      s += arrow(x + 40, 55, x + 62, 55, 'sakura', { gap: 1 });
      s += txt(x + 51, 50, 'log', { anchor: 'middle', size: 6.6, fill: C.sakura });
      s += txt(x + 51, 131, '≅ ?', { anchor: 'middle', size: 7.6, fill: C.sora });
    }
  });
  s += fo(x0, 146, 242, 40, 'the log-link: each copy of \\(\\mathcal{O}_k\\) is a different universe’s; \\(\\Pi_X\\) is coric. Every composite of arrows lands inside the log-shell \\(I(\\Pi_X)\\): upper semi-commutativity.', { size: 7.2, align: 'left', color: C.soft });
  s += fo(x0, 4, 242, 30, 'for \\(k\\) unramified over \\(\\mathbb{Q}_p\\), \\(p\\) odd: \\(\\log(\\mathcal{O}_k^\\times)=p\\,\\mathcal{O}_k\\), so \\(I=\\mathcal{O}_k\\) exactly', { size: 7.2, align: 'left', color: C.matcha });
  return svg(500, 188, s, 'the log-shell contains O_k and log(O_k×), so every iterate of log lands inside it');
};

/* Fig. 13 — where IUT calls the algorithms */
F.iutmap = () => {
  let s = '';
  /* two Hodge theaters separated by the wall */
  const col = (x, title) => {
    let o = rect(x, 8, 176, 248, { fill: '#fcfbfe', stroke: C.rule, r: 10 });
    o += txt(x + 88, 22, title, { anchor: 'middle', size: 8.4, weight: 700, fill: C.soft });
    return o;
  };
  s += col(6, 'Hodge theater †HT  (domain)');
  s += col(318, 'Hodge theater ‡HT  (codomain)');
  /* the wall */
  s += rect(192, 8, 116, 248, { fill: C.sakuraBg, stroke: C.sakuraLn, r: 10 });
  s += txt(250, 22, 'THE Θ-LINK WALL', { anchor: 'middle', size: 7.2, weight: 800, fill: C.sakura, ls: 0.8 });
  s += fo(196, 26, 108, 56, 'only abstract monoids and groups pass: \\(\\mathcal{F}^{\\Vdash\\times\\mu}\\)-prime-strips, i.e. \\(G_v\\curvearrowright\\mathcal{O}^{\\times\\mu}\\) and the realified value groups', { size: 7, color: C.sakura });
  s += card(200, 92, 100, 40, 'sora', 'coric', '\\(G_v\\) as an abstract group', { size: 8 });
  s += arrow(182, 112, 200, 112, 'sora', { gap: 0 });
  s += arrow(300, 112, 330, 112, 'sora', { gap: 0 });
  s += fo(196, 138, 108, 74, '<b>mono-analytic</b> algorithms only: \\(G_v\\mapsto\\) \\(\\mathcal{O}^{\\times\\mu}(G_v)\\), mono-analytic log-shells, \\(H^2\\cong\\mathbb{Q}/\\mathbb{Z}\\). The ring structure of the other side cannot be carried over.', { size: 7, color: C.ink });
  s += fo(196, 214, 108, 40, 'no common ring: labels †, ‡ must stay (deleting them gives \\(T = T^{-1}\\))', { size: 6.8, color: C.sakura });
  /* calls inside each theater */
  const calls = [
    ['\\(\\Pi_v\\mapsto\\) ring \\(\\overline{K}_v\\)', '[AbsTopIII] Cor 1.10, via the \\(\\Theta\\)-approach ([IUTchI] Rem 3.1.2)', 'matcha'],
    ['\\(\\Pi^{\\mathrm{tp}}_v\\mapsto\\) mono-theta env.', '[EtTh] §2, [IUTchII] Cor 1.10–1.12; elliptic cuspidalization for evaluation points', 'yuzu'],
    ['\\(\\Pi_{C_K}\\mapsto F_{\\mathrm{mod}}\\), \\(\\kappa\\)-coric functions', '[IUTchI] Ex 5.1 via [AbsTopIII] Thm 1.9; \\(\\mathbb{Q}_{&gt;0}\\cap\\widehat{\\mathbb{Z}}^\\times=\\{1\\}\\)', 'fuji'],
    ['\\(\\Pi_{\\vec X}\\mapsto\\Pi_{\\underline X},\\Pi_{\\underline C}\\), cusps, \\(l\\)', '[IUTchI] Cor 1.2 via [AbsTopII] Cor 3.3', 'sora'],
  ];
  calls.forEach(([h, b, k], i) => {
    s += card(14, 30 + i * 56, 160, 50, k, null, `<b>${h}</b><br/><span style="font-size:6.6px;color:${C.soft}">${b}</span>`, { size: 7.8 });
  });
  const right = [
    ['same algorithms, same groups', 'they are coric along the vertical log-links too', 'sora'],
    ['log-shells \\(\\mathcal{I}(\\Pi_v)\\)', '[IUTchIII] Prop 1.2, Thm 1.5: containers for every log-iterate', 'matcha'],
    ['log-Kummer correspondence', '[IUTchIII] Prop 3.5, Thm 3.11 (ii): Kummer along a whole column', 'yuzu'],
    ['multiradial representation', '[IUTchIII] Thm 3.11: see the multiradial guide', 'fuji'],
  ];
  right.forEach(([h, b, k], i) => {
    s += card(326, 30 + i * 56, 160, 50, k, null, `<b>${h}</b><br/><span style="font-size:6.6px;color:${C.soft}">${b}</span>`, { size: 7.8 });
  });
  return svg(500, 262, s, 'where inter-universal Teichmüller theory calls the reconstruction algorithms');
};

/* Fig. 14 — archimedean: Aut-holomorphic disc */
F.aut = () => {
  let s = '';
  const cx = 70, cy = 70, r = 52;
  s += circ(cx, cy, r, { fill: C.soraBg, stroke: C.sora, sw: 1.5 });
  /* hyperbolic geodesics */
  for (const [a, b] of [[0.2, 2.2], [1.1, 3.6], [2.6, 4.9], [4.0, 6.0], [5.2, 7.4]]) {
    const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a), x2 = cx + r * Math.cos(b), y2 = cy + r * Math.sin(b);
    const mx = cx + 0.55 * r * Math.cos((a + b) / 2), my = cy + 0.55 * r * Math.sin((a + b) / 2);
    s += path(`M${x1},${y1} Q${mx},${my} ${x2},${y2}`, { stroke: C.soraLn, sw: 1 });
  }
  s += carrow(cx - 20, cy + 20, cx, cy - 10, cx + 22, cy + 14, 'fuji', { sw: 1.4 });
  s += fo(8, 126, 130, 30, '\\(\\mathrm{Aut}^{\\pm\\mathrm{hol}}(\\mathbb{D})\\subseteq\\mathrm{Homeo}(\\mathbb{D})\\) is commensurably terminal', { size: 7.2, color: C.sora });
  /* parallelograms, rectangles, squares */
  const gx = 170, gy = 18;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const k = (i + j) % 3;
    s += path(`M${gx + i * 30 + j * 10},${gy + j * 30} l30,0 l10,30 l-30,0 Z`, { fill: ['#fcfbfe', C.fujiBg, C.matchaBg][k], stroke: C.fujiLn, sw: 0.8 });
  }
  s += fo(170, 112, 160, 40, '“parallelograms, rectangles, squares”: the linear and then holomorphic structure is read off from which shapes the topology can see', { size: 7, color: C.soft, align: 'left' });
  s += card(342, 14, 152, 128, 'fuji', 'archimedean dictionary',
    `<div style="text-align:left">profinite group \\(\\leftrightarrow\\) <b>Aut-holomorphic space</b>: a surface plus, for each open \\(U\\), the subgroup of holomorphic automorphisms<br/>
    \\(\\widehat{\\mathbb{Z}}\\cdot\\mathrm{Fr}\\) rigid \\(\\leftrightarrow\\) \\(S^1\\) rigid<br/>
    \\(I_k\\) floppy \\(\\leftrightarrow\\) \\(\\mathbb{R}_{&gt;0}\\) floppy<br/>
    Belyi / elliptic cuspidalization \\(\\leftrightarrow\\) elliptic cuspidalization on the Riemann surface ([AbsTopIII] Cor 2.7–2.9)</div>`, { size: 7.4, align: 'left' });
  return svg(500, 158, s, 'the archimedean counterpart: Aut-holomorphic structures');
};

module.exports = F;
