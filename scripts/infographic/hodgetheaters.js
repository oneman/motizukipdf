#!/usr/bin/env node
/*
 * scripts/infographic/hodgetheaters.js — the 4K infographic of the Hodge theaters.
 *
 *   node scripts/infographic/hodgetheaters.js            → docs/hodgetheaters-infographic.svg (master)
 *                                                         docs/hodgetheaters-infographic.png (3840×2160)
 *   node scripts/infographic/hodgetheaters.js --svg-only   skip the PNG, write the SVG only
 *
 * The numbers and the anatomy are read from the toolkit, so the picture cannot drift from it:
 *   · `iut ids --json`                  every identifier of kind hodgetheater, bridge and link,
 *   · `iut walk`                        l, l*, V, the capsules F_T and F_J, the theta values Θ̲_v(j),
 *                                       the q- and Θ-pilot log-volumes,
 *   · `iut run MapLabels`               the label map F_l → |F_l| of the gluing 0,⊞ ↦ >,
 *   · `iut run BuildBridges`            the four bridges and the size of their capsules,
 *   · `iut run CountIsomorphismTorsors` the isomorphism torsors of [IUTchI] Prop 4.8, 6.6, Cor 5.6, 6.12,
 *   · `iut run AssembleThetaHodgeTheater` the Cor 3.7 checks and the dilation l(l+1)/12.
 * The prose of each card and the pop-culture jokes are annotations written here. The jokes
 * are text-only references (titles, catchphrases); no character art is reproduced.
 *
 * Layout (3840 × 2160):
 *   header   the rule, the numbers
 *   row A    the anatomy of one Θ±ell NF-Hodge theater (bridges, capsules, gluing) ·
 *            how many ways each piece is "the same" (the isomorphism torsors)
 *   row B    eight cards, one per type of Hodge theater: the math, and a joke
 *
 * Text widths are measured with a canvas in Chromium (the same Chromium that renders the
 * PNG) — the method of scripts/infographic/build.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT_SVG = path.join(ROOT, 'docs', 'hodgetheaters-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'hodgetheaters-infographic.png');
const W = 3840, H = 2160;

/* ------------------------------------------------------------ data */
const BIN = path.join(SRC, 'iut');
if (!fs.existsSync(BIN)) { console.error('src/iut is not built: run `make -C src` first'); process.exit(1); }
const iut = args => execFileSync(BIN, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const fail = msg => { console.error(msg); process.exit(1); };

const ids = JSON.parse(iut(['ids', '--json']));
const byId = {}; for (const r of ids) byId[r.id] = r;
const ofKind = k => ids.filter(r => r.kind === k);

/* iut walk: the initial Θ-data and one Hodge theater */
const walk = iut(['walk', '--rows', '1']);
const num = (re, s = walk) => { const m = s.match(re); if (!m) fail('walk: no match for ' + re); return m; };
const lm = num(/l\s*:\s*(\d+)\s+\(l\* = (\d+), l± = (\d+)\)/);
const l = +lm[1], lstar = +lm[2], lpm = +lm[3];
const nV = +num(/V ≅ V_mod : (\d+) valuations/)[1];
const example = num(/name\s*:\s*(.+)/)[1].trim();
const capT = num(/capsule F_T, t ∈ F_l :\s*(.+)/)[1].match(/\[([+-]?\d+)\]/g).map(s => +s.slice(1, -1));
const capJ = num(/capsule F_J, j ∈ F_l\^\*:\s*(.+)/)[1].match(/\[(\d+)\]/g).map(s => +s.slice(1, -1));
const thetaVals = num(/Θ̲_v evaluated at j ∈ F_l\^\*:\s*(.+)/)[1].trim();
const qPilot = +num(/q-pilot .*?log-vol −\|log\(q\)\| = (-?[\d.]+)/)[1];
const thetaPilot = +num(/Θ-pilot .*?naive log-vol\s*=\s*(-?[\d.]+)/)[1];
if (capT.length !== l || capJ.length !== lstar) fail(`capsules: |T|=${capT.length} (l=${l}), |J|=${capJ.length} (l*=${lstar})`);

/* MapLabels: t ↦ glue target */
const labelMap = [];
for (const m of iut(['run', 'MapLabels']).matchAll(/t=\s*(-?\d+)\s+\|t\|=\s*(\d+).*glue 0,⊞↦>:\s*(\d+)/g)) labelMap.push({ t: +m[1], abs: +m[2], glue: +m[3] });
if (labelMap.length !== l) fail('MapLabels: expected ' + l + ' rows');

/* BuildBridges */
const bridges = {};
for (const m of iut(['run', 'BuildBridges']).matchAll(/^\s+(\w+Bridge)\s+(\w+) → (\w+)\s+\((\d+) members\)\s+isomorphisms: (.+?)\s+\((\d+)\)\s+ok/gm))
  bridges[m[1]] = { from: m[2], to: m[3], members: +m[4], isos: m[5].replace(/\s*\(\[.*$/, ''), order: +m[6] };
for (const b of ['ThetaBridge', 'NFBridge', 'ThetaPmBridge', 'ThetaEllBridge']) if (!bridges[b]) fail('BuildBridges: missing ' + b);

/* CountIsomorphismTorsors */
const torsors = [];
for (const m of iut(['run', 'CountIsomorphismTorsors']).matchAll(/^\s{4}(.+?)\s{2,}torsor over (.+?)\s{2,}order (\d+)\s+(\[.+?)\s*$/gm))
  torsors.push({ what: m[1].trim(), over: m[2].trim(), order: +m[3], ref: m[4].replace(/\[IUTchI\] /, '') });
if (torsors.length < 8) fail('CountIsomorphismTorsors: parsed ' + torsors.length + ' rows');

/* AssembleThetaHodgeTheater */
const asm = iut(['run', 'AssembleThetaHodgeTheater']);
const dilation = +num(/value groups dilated by ([\d.]+)/, asm)[1];
const cor37 = [...asm.matchAll(/\[ (ok|FAIL) \] (\w+)\s+(.+?)\s{2,}\[IUTchI\] (.+)$/gm)].map(m => ({ ok: m[1] === 'ok', id: m[2], what: m[3], ref: m[4] }));

const counts = {
  hts: ofKind('hodgetheater').length, bridges: ofKind('bridge').length, links: ofKind('link').length,
  l, lstar, lpm, nV, dilation,
};

/* ------------------------------------------------------------ the eight cards (annotations) */
/* col: index into the series palette. jp: the stamp, src: where it is from, joke: the joke. */
const CARDS = [
  {
    id: 'ThetaHodgeTheater', title: 'Θ-Hodge theater', col: 6,
    formula: '†HT^Θ = ( {†F̲_v}_{v∈V} , †F⊩_mod )',
    facts: [
      'Local Frobenioids F̲_v at every v ∈ V (at bad v: the tempered one, carrying the theta function) and one global realified Frobenioid F⊩_mod, subject to (a) local models, (b) global model, (c) compatibility.',
      `It holds the two pilots: F⊩_mod carries the q-parameters q̲_v = q_v^{1/2l}, F⊩_tht the theta values Θ̲_v with Θ̲_v(j) = q̲_v^{j²}: ${thetaVals}.`,
      'The Θ-link is the full poly-isomorphism †F⊩_tht ≅ ‡F⊩_mod. It keeps D⊢_v and O×, never Π_v or the rings (Cor 3.7 (i)–(iii)).',
    ],
    code: 'ThetaHodgeTheater · iut run AssembleThetaHodgeTheater',
    jp: '戦闘力', src: 'Dragon Ball Z · the scouter',
    joke: `Point a scouter at the two pilots: the Θ-pilot's value group reads l(l+1)/12 = ${dilation.toFixed(2)} times the q-pilot's. "It's over ${dilation.toFixed(2)}!" doesn't have quite the same ring to it. Then again, the Θ-link has no ring at all.`,
  },
  {
    id: 'ThetaNFHodgeTheater', title: 'ΘNF-Hodge theater', col: 1,
    formula: '†F^⊛  ⟵ψ^NF⟵  †F_J  ⟶ψ^Θ⟶  †F_>  ⇝  †HT^Θ',
    facts: [
      `A capsule F_J of l* = (l−1)/2 = ${lstar} F-prime-strips, labelled j ∈ F_l^* = F_l^×/{±1}. The multiplicative, arithmetic half.`,
      `NF-bridge F_J → F_⊛ (Π_{C_K} ↷ F_mod^×) ties the labels to the number field; its isomorphisms form an F_l^*-torsor (${bridges.NFBridge.order}). Θ-bridge F_J → F_>: evaluation points labelled j, isomorphisms trivial.`,
      'The D-version †D^⊛ ← †D_J → †D_> has trivial automorphisms, but gluing its two bridges is an F_l^*-torsor (Prop 4.8 (iii), (iv)).',
    ],
    code: 'ThetaNFHodgeTheater · DThetaNFHodgeTheater · NFBridge · ThetaBridge',
    jp: 'ゲットだぜ!', src: 'Pokémon · "gotta catch \'em all"',
    joke: `Gotta catch 'em all: one F-prime-strip per j = 1…${lstar}, but only up to ±1, so −3 and 3 count as the same catch. And the NF-bridge may give your team back relabelled by any of the ${lstar} elements of F_l^*. A torsor of trades.`,
  },
  {
    id: 'ThetaPmEllHodgeTheater', title: 'Θ±ell-Hodge theater', col: 0,
    formula: '†D^⊚±  ⟵φ^Θell⟵  †F_T  ⟶ψ^Θ±⟶  †F_⊞',
    facts: [
      `A capsule F_T of l = ${l} F-prime-strips labelled t ∈ F_l, with symmetry F_l^{⋊±} = F_l ⋊ {±1}. The additive, geometric half: it drives conjugate synchronization.`,
      `Θ±-bridge F_T → F_⊞: isomorphisms a torsor over {±1} × {±1}^V (2·2^${nV} = ${bridges.ThetaPmBridge.order}). Θell-bridge D_T → D^⊚± = B(X̲_K)^0: an F_l^{⋊±}-torsor (2l = ${bridges.ThetaEllBridge.order}).`,
      'The Θ±ell-HT itself is determined up to a {±1}-torsor; gluing its two bridges, up to F_l^{⋊±} × {±1}^V (Prop 6.6).',
    ],
    code: 'ThetaPmEllHodgeTheater · DThetaPmEllHodgeTheater · ThetaPmBridge · ThetaEllBridge',
    jp: '君のtは。', src: 'Your Name (Kimi no Na wa) · body swap',
    joke: 'Capsule members t and −t wake up in each other\'s bodies: −1_{F_l} swaps D_t ≅ D_{−t} and nobody can tell. "Kimi no t wa?" Only |t| survives the trip over to the ΘNF side.',
  },
  {
    id: 'ThetaPmEllNFHodgeTheater', title: 'Θ±ell NF-Hodge theater', col: 2,
    formula: '†HT^{Θ±ell NF} = Θ±ell-HT  ⊔_{0, ⊞ ↦ >}  ΘNF-HT',
    facts: [
      'Glue the two halves along F_l ⊇ F_l^× ↠ F_l^*: ±t ↦ |t|, and both 0 and ⊞ go to > (Prop 6.7). F_> now carries the Π copies of F_⊞.',
      'The gluing is unique (Rem 6.12.2), and the F-versions of bridges and theaters have exactly the isomorphisms of their D-versions (Cor 5.6, 6.12).',
      'This is one vertex • of the log-theta-lattice, built in its own universe with its own fresh copies of every Frobenius-like object.',
    ],
    code: 'iut_hodge_theater · iut run GlueHodgeTheaters · iut run BuildBridges',
    jp: '合体!', src: 'Super Sentai · the combining robot',
    joke: 'Two machines, one robot. The additive Θ±ell-HT and the multiplicative ΘNF-HT lock together along 0,⊞ ↦ >, and since the gluing is unique there is no alternate combination sequence. Every • of the lattice is one fully assembled robot.',
  },
  {
    id: 'DThetaPmEllNFHodgeTheater', title: 'D-Hodge theaters (étale-like)', col: 3,
    formula: '†HT^{D-Θ±ell NF} = ( D-Θ±ell-HT , D-ΘNF-HT , gluing )',
    facts: [
      'Replace every F-prime-strip by its D-prime-strip: keep the base categories (Π_v, B(X̲_K)^0, B(C̲_K)^0), forget every monoid and Frobenioid.',
      'D-ΘNF-HT †D^⊛ ← †D_J → †D_>: automorphisms trivial. D-Θ±ell-HT †D_⊞ ← †D_T → †D^⊚±: a {±1}-torsor. Called etHT in [FormIUT].',
      'Vertically coric: every log-link in a column of the lattice shares it, so it is the part that survives the log-wall.',
    ],
    code: 'DThetaPmEllNFHodgeTheater · EtaleHodgeTheater · iut run ForgetToDHodgeTheater',
    jp: '贅沢な名だね', src: 'Spirited Away · Yubaba takes a name',
    joke: '"F⊩▶×μ-prime-strip? What an extravagant name." Forget the monoids, keep only the base category: from now on your name is D. And it is exactly this nameless, étale-like part that every log-link remembers.',
  },
  {
    id: 'DagHodgeTheater', title: '†HT and ‡HT across a Θ-link', col: 7,
    formula: '†F⊩_tht  ≅  ‡F⊩_mod    ( Θ̲_v ↦ q̲_v )',
    facts: [
      '† is the domain, ‡ the codomain: two Θ±ell NF-Hodge theaters in different universes, mutually alien copies of the same arithmetic.',
      `Shared (horizontally coric): G_v, i.e. D⊢_v, and the units O×μ, up to Ind1 and Ind2. Not shared: Π_v and the ring structures. Checks: ${cor37.filter(c => c.ok).length}/${cor37.length} of Cor 3.7 pass.`,
      'Chained, they form the Frobenius picture … → †HT^Θ → ‡HT^Θ → … with ⁿΘ̲_v ↦ ⁿ⁺¹q̲_v (Cor 3.8).',
    ],
    code: 'DagHodgeTheater · DdagHodgeTheater · ThetaLink · iut run ChainFrobeniusPicture',
    jp: '異世界転生', src: 'isekai light novels · the long title',
    joke: '"That Time I Got Reincarnated in Another Universe as ‡HT, and Only My O×μ and G_v Came With Me." Every Θ-link is an isekai: the rings stay behind in the old world, and Ind1, Ind2, Ind3 are the cheat skills nobody can explain.',
  },
  {
    id: 'NMHodgeTheater', title: '{n,m}HT: vertices of the log-theta-lattice', col: 5,
    formula: '{n,m}HT ⟶log⟶ {n,m+1}HT ,   {n,m}HT ⟶Θ×μ_LGP⟶ {n+1,m}HT',
    facts: [
      'A Z²-indexed diagram of Θ±ell NF-Hodge theaters: vertical arrows are log-links, horizontal ones Θ×μ_LGP-links ([IUTchIII] Def 1.4, 3.8).',
      'A log-link applies log : O×_{K_v} → K_v and yields the log-shells I_v = (p*)⁻¹·log(O×_{K_v}). It copies the étale-like data and makes fresh Frobenius-like monoids.',
      'The squares do not commute (Rem 1.4.1). The proof only needs an "infinite H": two columns and one Θ-link.',
    ],
    code: 'NMHodgeTheater · LogThetaLattice · LogLink · iut walk',
    jp: '死に戻り', src: 'Re:Zero · "Return by Death"',
    joke: 'Return by Log: each log-link sends you to a fresh Hodge theater with brand-new monoids, but you keep your memories (Π_v, G_v, the capsule basepoints). Go once around a square and the world is literally different. The diagram does not commute.',
  },
  {
    id: 'EtalePicture', title: 'The étale picture and the D-links', col: 4,
    formula: '†D⊢_>  ≅  ‡D⊢_>    (full poly-isomorphism)',
    facts: [
      'The D-ΘNF-link and D-Θ±ell-link are full poly-isomorphisms of the mono-analytic D⊢_> between two D-Hodge theaters ([IUTchI] Cor 4.12, 6.10).',
      'Gather the Hodge theaters as spokes around one bi-coric core D⊢_>: the étale picture. Its symmetries permute the spokes freely.',
      'Whatever is written in terms of the core looks the same from every spoke: that is multiradiality, the input to [IUTchIII] Thm 3.11 and Cor 3.12.',
    ],
    code: 'DThetaNFLink · DThetaPmEllLink · DThetaPmEllNFLink · EtalePicture',
    jp: '影分身の術', src: 'Naruto · shadow clone technique',
    joke: 'Shadow clone technique: every Hodge theater in the étale picture is a clone radiating from one core D⊢_>, and the full poly-isomorphisms shuffle the clones at will. Which one is the real Hodge theater? From the core, it does not matter. That is the point.',
  },
];
for (const c of CARDS) {
  const r = byId[c.id]; if (!r) fail('no identifier ' + c.id);
  c.ref = r.ref; c.notation = r.notation;
}

const data = {
  counts, example, cor37, capT, capJ, labelMap, bridges, torsors, thetaVals, qPilot, thetaPilot, cards: CARDS,
  refs: Object.fromEntries(['ThetaPmBridge', 'ThetaEllBridge', 'ThetaBridge', 'NFBridge', 'FBoxPlus', 'DCircDotPm', 'FGt', 'FCircAst'].map(k => [k, byId[k] ? byId[k].ref : ''])),
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
  const JP = "'Noto Sans CJK JP', 'Noto Sans JP', 'WenQuanYi Zen Hei', 'Unifont-JP', sans-serif";
  const BLUE = C.series[0], ORANGE = C.series[1], GREEN = C.series[2], VIOLET = C.series[6];

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
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const bg = [252, 252, 251]; const mix = (c, s) => Math.round(s + (c - s) * a); return `rgb(${mix(r, bg[0])},${mix(g, bg[1])},${mix(b, bg[2])})`; };

  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.35; const words = s.split(' '); let cur = '', yy = y, n = 0;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, o); yy += lh; cur = w; n++; } else cur = t;
    }
    if (cur) { text(x, yy, cur, o); yy += lh; n++; }
    if (o.maxLines && n > o.maxLines) console.warn(`wrap overflow: ${n} lines > ${o.maxLines}: ${s.slice(0, 50)}…`);
    return yy;
  };
  const fit = (x, y, s, width, o = {}) => {
    const font = o.font || SANS, size = o.size || 20;
    let t = s;
    while (t.length > 1 && measure(t, font, size, o.weight) > width) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== s) console.warn('cut: ' + s);
    return text(x, y, t, o);
  };
  const panel = (x, y, w, h, title, sub, subw) => {
    rect(x, y, w, h, { rx: 14, fill: C.panel });
    text(x + 28, y + 44, title, { size: 30, weight: 600 });
    if (sub) return wrap(x + 28, y + 76, sub, subw || w - 56, { size: 19, fill: C.text2, lh: 25 });
    return y + 76;
  };

  out.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${C.surface}"/>`);
  out.push(`<defs>${[['arr', C.text2], ['arrB', BLUE], ['arrO', ORANGE], ['arrG', GREEN], ['arrV', VIOLET], ['arrM', C.muted]].map(([id, c]) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`);

  /* ---------------------------------------------------------------- header */
  text(M, 92, 'The Hodge theaters of inter-universal Teichmüller theory, with jokes', { size: 62, weight: 700 });
  wrap(M, 140, `A Hodge theater is one complete, self-contained copy of the arithmetic of an elliptic curve over a number field: local Frobenioids at every v ∈ V, a global realified Frobenioid, and capsules of prime-strips labelled by the l-torsion, tied together by bridges. Two copies living in different universes can then be compared by links that are weaker than ring isomorphisms. [IUTchI] builds them in stages: the Θ-HT (§3), the ΘNF-HT (§4–5) and the Θ±ell-HT (§6), and then glues the last two into the Θ±ell NF-HT, one vertex of the log-theta-lattice ([IUTchIII] Def 1.4). Every number below is what the toolkit computes for ${D.example} (iut walk). Every type also gets a joke from Japanese pop culture, because the theory is very long and the reader deserves a break.`, 2480, { size: 22, fill: C.text2, lh: 30 });

  const stats = [[D.counts.hts, 'Hodge-theater ids'], [D.counts.bridges, 'bridges'], [D.counts.links, 'links'], [D.counts.l, 'l'], [D.counts.lstar, 'l* = |J|'], [D.counts.l, '|T| = |F_l|'], [D.counts.nV, '|V|'], [D.counts.dilation.toFixed(2), 'l(l+1)/12']];
  stats.forEach(([n, lab], i) => {
    const x = W - M - (stats.length - i) * 136 + 12;
    rect(x, 46, 124, 118, { rx: 12, fill: C.panel });
    text(x + 62, 112, String(n), { size: n.toString().length > 3 ? 36 : 46, weight: 600, anchor: 'middle' });
    text(x + 62, 146, lab, { size: 15, fill: C.text2, anchor: 'middle' });
  });

  /* ---------------------------------------------------------------- row A left: the anatomy */
  const AX = M, AY = 300, AW = 2600, AH = 790;
  panel(AX, AY, AW, AH, 'Anatomy of one vertex • : a Θ±ell NF-Hodge theater',
    'Top band: the Θ±ell-Hodge theater, built on the additive symmetry F_l^{⋊±}. Bottom band: the ΘNF-Hodge theater, built on the multiplicative symmetry F_l^*. Each band is a capsule of prime-strips with a bridge out to each side. The grey threads between the two capsules are the gluing of [IUTchI] Prop 6.7, drawn exactly as iut run MapLabels prints it: ±t ↦ |t| ∈ F_l^*, while 0 and ⊞ both go to >. Bridge labels give the order of the isomorphism torsor.', AW - 56);

  const B1y = AY + 160, B1h = 210, B2y = AY + 470, B2h = 210;
  rect(AX + 24, B1y, AW - 48, B1h, { rx: 12, fill: tint(BLUE, 0.07) });
  rect(AX + 24, B2y, AW - 48, B2h, { rx: 12, fill: tint(ORANGE, 0.07) });
  text(AX + 44, B1y + 30, 'Θ±ell-HT · ADDITIVE / GEOMETRIC · symmetry F_l^{⋊±} = F_l ⋊ {±1} · conjugate synchronization', { size: 15, weight: 600, fill: BLUE, extra: ' letter-spacing="1.2"' });
  text(AX + 44, B2y + B2h - 16, 'ΘNF-HT · MULTIPLICATIVE / ARITHMETIC · symmetry F_l^* = F_l^×/{±1} · Kummer theory of the number field', { size: 15, weight: 600, fill: ORANGE, extra: ' letter-spacing="1.2"' });

  /* object box: notation big, gloss small, identifier mono */
  const obox = (x, y, w, h, sym, gloss, id, col) => {
    rect(x, y, w, h, { rx: 10, fill: '#fff', stroke: tint(col, 0.55), sw: 1.5 });
    rect(x, y, 7, h, { rx: 3.5, fill: col });
    text(x + 22, y + 42, sym, { font: SYM, size: 30, weight: 700 });
    text(x + 22, y + 70, gloss, { font: SYM, size: 15, fill: C.text2 });
    text(x + 22, y + h - 14, id, { font: MONO, size: 13, fill: C.muted });
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
  };
  const capsule = (x, y, labels, bw, gap, col, name) => {
    const w = labels.length * bw + (labels.length - 1) * gap;
    rect(x - 14, y - 34, w + 28, 120, { rx: 12, fill: 'none', stroke: col, sw: 1.5, dash: '6 5' });
    text(x - 4, y - 12, name, { font: SYM, size: 17, weight: 700, fill: col });
    const pos = {};
    labels.forEach((t, i) => {
      const bx = x + i * (bw + gap);
      rect(bx, y, bw, 64, { rx: 8, fill: t === 0 ? tint(GREEN, 0.18) : tint(col, 0.16), stroke: t === 0 ? GREEN : col, sw: 1.2 });
      text(bx + bw / 2, y + 30, (t > 0 && name.includes('T') ? '+' : '') + t, { font: SYM, size: 20, weight: 700, anchor: 'middle' });
      text(bx + bw / 2, y + 52, 'F', { font: SYM, size: 13, fill: C.text2, anchor: 'middle' });
      pos[t] = { x: bx + bw / 2, top: y, bot: y + 64 };
    });
    return { x, w, pos, r: x + w, cx: x + w / 2 };
  };

  /* top band: D^⊚± ← F_T → F_⊞ */
  const bw = 6 + 0, capY1 = B1y + 90;
  const T = capsule(AX + 600, capY1, D.capT, 62, 10, BLUE, 'F_T  (t ∈ F_l)');
  const Dcd = obox(AX + 50, B1y + 56, 320, 132, 'D^⊚±', 'B(X̲_K)^0 · Π_{X_K}', 'DCircDotPm', BLUE);
  const Fbp = obox(AX + 1750, B1y + 56, 260, 132, 'F_⊞', 'target of the Θ±-bridge', 'FBoxPlus', BLUE);
  const bridgeArrow = (x1, x2, y, col, mk, name, sub, leftward) => {
    line(leftward ? x2 : x1, y, leftward ? x1 : x2, y, { stroke: col, sw: 2.2, marker: mk });
    const mx = (x1 + x2) / 2;
    text(mx, y - 12, name, { font: SYM, size: 16, weight: 700, fill: col, anchor: 'middle' });
    text(mx, y + 24, sub, { font: SYM, size: 13, fill: C.text2, anchor: 'middle' });
  };
  const ty = capY1 + 32;
  bridgeArrow(Dcd.r + 6, T.x - 18, ty, BLUE, 'arrB', 'Θell-bridge φ^Θell', `F_l^{⋊±}-torsor · ${D.bridges.ThetaEllBridge.order}`, true);
  bridgeArrow(T.r + 18, Fbp.x - 6, ty, BLUE, 'arrB', 'Θ±-bridge ψ^Θ±', `{±1}×{±1}^V · ${D.bridges.ThetaPmBridge.order}`, false);

  /* bottom band: F^⊛ ← F_J → F_> → HT^Θ */
  const capY2 = B2y + 58;
  const jbw = 84, jgap = 18, jw = D.capJ.length * jbw + (D.capJ.length - 1) * jgap;
  const J = capsule(T.cx - jw / 2, capY2, D.capJ, jbw, jgap, ORANGE, 'F_J  (j ∈ F_l^*)');
  const Fca = obox(AX + 50, B2y + 26, 320, 132, 'F_⊛', 'Π_{C_K} ↷ F_mod^×', 'FCircAst', ORANGE);
  const Fgt = obox(AX + 1750, B2y + 26, 260, 132, 'F_>', 'target of the Θ-bridge', 'FGt', ORANGE);
  const jy = capY2 + 32;
  bridgeArrow(Fca.r + 6, J.x - 18, jy, ORANGE, 'arrO', 'NF-bridge ψ^NF', `F_l^*-torsor · ${D.bridges.NFBridge.order}`, true);
  bridgeArrow(J.r + 18, Fgt.x - 6, jy, ORANGE, 'arrO', 'Θ-bridge ψ^Θ', `trivial · ${D.bridges.ThetaBridge.order}`, false);

  /* the gluing threads ±t ↦ |t|, 0 ↦ > */
  for (const m of D.labelMap) {
    const a = T.pos[m.t];
    if (m.t === 0) {
      pathd(`M${a.x},${a.bot} C${a.x},${a.bot + 70} ${Fgt.x - 120},${Fgt.y - 40} ${Fgt.x - 2},${Fgt.y + 30}`, { stroke: GREEN, sw: 1.8, dash: '5 4', marker: 'arrG' });
      continue;
    }
    const b = J.pos[m.glue];
    pathd(`M${a.x},${a.bot} C${a.x},${a.bot + 60} ${b.x},${b.top - 70} ${b.x},${b.top - 2}`, { stroke: m.t < 0 ? '#b9b8b3' : C.text2, sw: 1.5, opacity: 0.9 });
  }
  /* F_⊞ ═ F_> */
  const gx = Fbp.cx;
  line(gx - 5, Fbp.b + 2, gx - 5, Fgt.y - 2, { stroke: GREEN, sw: 2.5 });
  line(gx + 5, Fbp.b + 2, gx + 5, Fgt.y - 2, { stroke: GREEN, sw: 2.5 });
  text(gx - 20, (Fbp.b + Fgt.y) / 2 - 4, 'identified: 0, ⊞ ↦ >', { font: SYM, size: 16, weight: 700, fill: GREEN, anchor: 'end' });
  text(gx - 20, (Fbp.b + Fgt.y) / 2 + 18, 'gluing unique · Rem 6.12.2', { size: 13, fill: C.text2, anchor: 'end' });
  /* D^⊚± double covers D^⊛ */
  line(Dcd.cx, Dcd.b + 4, Fca.cx, Fca.y - 4, { stroke: C.muted, sw: 1.5, dash: '6 5', marker: 'arrM' });
  text(Dcd.cx + 12, (Dcd.b + Fca.y) / 2 + 6, 'double cover  D^⊚± → D^⊛  (Aut ↠ F_l^*, kernel Aut_±)', { font: SYM, size: 13, fill: C.text2 });
  text(T.cx, (capY1 + 64 + capY2 - 34) / 2 + 6, 'F_l ⊇ F_l^× ↠ F_l^*', { font: SYM, size: 14, fill: C.muted, anchor: 'middle', extra: ' opacity="0"' });

  /* the Θ-Hodge theater hanging off F_> */
  const tx = Fgt.r + 34, tyy = B1y + 40, tw = AX + AW - 30 - tx;
  rect(tx, tyy, tw, B2y + B2h - tyy, { rx: 12, fill: tint(VIOLET, 0.09), stroke: tint(VIOLET, 0.5), sw: 1.5 });
  text(tx + 18, tyy + 38, 'Θ-Hodge theater †HT^Θ', { size: 24, weight: 700, fill: VIOLET });
  text(tx + 18, tyy + 64, 'reached from F_> by ψ^Θ_⊛ ([IUTchI] Def 5.5)', { size: 15, fill: C.text2 });
  let yy = tyy + 100;
  const kv = (k, v) => { text(tx + 18, yy, k, { font: SYM, size: 19, weight: 700 }); yy = wrap(tx + 18, yy + 25, v, tw - 36, { font: SYM, size: 16, fill: C.text2, lh: 21 }) + 14; };
  kv('F⊩_mod  ∋ q-pilot {q̲_v}', `log-vol −|log q| = ${D.qPilot.toFixed(4)}`);
  kv('F⊩_tht  ∋ Θ-pilot {q̲_v^{j²}}', `Θ̲_v(j), j = 1…${D.counts.lstar}: ${D.thetaVals}`);
  kv('naive log-vol of the Θ-pilot', `${D.thetaPilot.toFixed(4)} = l(l+1)/12 · (−|log q|)`);
  kv('Θ-link (to the next vertex)', '†F⊩_tht ≅ ‡F⊩_mod, a full poly-isomorphism');
  kv('Checked by iut run (Cor 3.7)', D.cor37.map(c => (c.ok ? '✓ ' : '✗ ') + c.what.replace(/;.*$/, '')).join(' · '));
  line(Fgt.r + 4, Fgt.cy, tx - 4, Fgt.cy, { stroke: VIOLET, sw: 2, marker: 'arrV' });

  /* bottom strip: the stages */
  const sy = B2y + B2h + 30;
  text(AX + 28, sy + 8, 'BUILT IN STAGES', { size: 14, weight: 600, fill: C.muted, extra: ' letter-spacing="1.5"' });
  const stages = [
    ['Θ-HT', '[IUTchI] §3, Def 3.6', VIOLET], ['ΘNF-HT', '§4–5, Def 4.6, 5.5', ORANGE], ['Θ±ell-HT', '§6, Def 6.4, 6.13', BLUE],
    ['Θ±ell NF-HT', 'Def 6.13 (iii)', GREEN], ['D-Θ±ell NF-HT', 'forget to D · Def 6.13 (ii)', C.series[3]], ['{n,m}HT', '[IUTchIII] Def 1.4', C.series[5]],
  ];
  let sx = AX + 210;
  stages.forEach(([n, r, col], i) => {
    const w = Math.max(measure(n, SYM, 18, 700), measure(r, SANS, 13)) + 36;
    rect(sx, sy - 18, w, 52, { rx: 8, fill: tint(col, 0.13) });
    rect(sx, sy - 18, 5, 52, { rx: 2.5, fill: col });
    text(sx + 18, sy + 4, n, { font: SYM, size: 18, weight: 700 });
    text(sx + 18, sy + 24, r, { size: 13, fill: C.text2 });
    sx += w;
    if (i < stages.length - 1) { line(sx + 6, sy + 8, sx + 30, sy + 8, { stroke: C.text2, sw: 1.8, marker: 'arr' }); sx += 38; }
  });
  sx += 60;
  line(sx, sy + 2, sx + 40, sy + 2, { stroke: C.text2, sw: 1.5 }); text(sx + 50, sy + 7, 'thread t ↦ |t|, t > 0', { font: SYM, size: 14, fill: C.text2 });
  line(sx, sy + 26, sx + 40, sy + 26, { stroke: '#b9b8b3', sw: 1.5 }); text(sx + 50, sy + 31, 'thread −t ↦ |t|', { font: SYM, size: 14, fill: C.text2 });
  sx += 260;
  line(sx, sy + 2, sx + 40, sy + 2, { stroke: GREEN, sw: 1.8, dash: '5 4' }); text(sx + 50, sy + 7, '0 ↦ >  (the 0-strip joins F_⊞ at F_>)', { font: SYM, size: 14, fill: C.text2 });
  line(sx, sy + 26, sx + 40, sy + 26, { stroke: C.muted, sw: 1.5, dash: '6 5' }); text(sx + 50, sy + 31, 'covering of base categories', { font: SYM, size: 14, fill: C.text2 });

  /* ---------------------------------------------------------------- row A right: isomorphism torsors */
  const RX = AX + AW + 30, RW = W - M - RX;
  let ry = panel(RX, AY, RW, AH, 'How many ways to be the same', 'The isomorphisms between two copies of each piece form a torsor, and its order is how much "which one is which?" the theory must carry around. Bars are log-scaled. These are the counts iut run CountIsomorphismTorsors prints for l = ' + D.counts.l + ', |V| = ' + D.counts.nV + '.', RW - 56);
  ry += 6;
  const maxO = Math.max(...D.torsors.map(t => t.order));
  const barX = RX + 480, barW = RW - 480 - 110;
  D.torsors.forEach((t, i) => {
    const y = ry + i * 47;
    if (i % 2 === 0) rect(RX + 18, y - 4, RW - 36, 47, { rx: 6, fill: '#fff', opacity: 0.6 });
    const isD = /^D-|^gluing D/.test(t.what);
    const col = /±|ell/.test(t.what) ? BLUE : /NF|Θ-bridge|ΘNF/.test(t.what) ? ORANGE : GREEN;
    fit(RX + 34, y + 18, t.what, 436, { font: SYM, size: 15, weight: 600 });
    fit(RX + 34, y + 36, 'over ' + t.over + ' · ' + t.ref, 436, { font: SYM, size: 12, fill: C.muted });
    const w = t.order <= 1 ? 4 : Math.max(4, barW * Math.log(t.order) / Math.log(maxO));
    rect(barX, y + 8, w, 22, { rx: 4, fill: col, opacity: isD ? 1 : 0.55 });
    text(barX + w + 10, y + 25, String(t.order), { font: MONO, size: 16, weight: 500 });
  });
  ry += D.torsors.length * 47 + 14;
  wrap(RX + 28, ry, 'Read it as: the F-versions (Frobenius-like) have exactly as many isomorphisms as their D-versions (étale-like), so the monoids add no extra symmetry (Cor 5.6, 6.12). The one gluing that matters, Θ±ell-HT to ΘNF-HT, is unique.', RW - 56, { size: 15, fill: C.text2, lh: 21 });

  /* ---------------------------------------------------------------- row B: the eight cards */
  const BY = AY + AH + 26, cols = 4, gapx = 28, gapy = 24;
  const cw = (W - 2 * M - (cols - 1) * gapx) / cols, ch = (H - 44 - BY - gapy) / 2;
  D.cards.forEach((c, i) => {
    const x = M + (i % cols) * (cw + gapx), y = BY + Math.floor(i / cols) * (ch + gapy);
    const col = C.series[c.col];
    rect(x, y, cw, ch, { rx: 14, fill: C.panel });
    rect(x, y, 8, ch, { rx: 4, fill: col });
    text(x + 30, y + 46, c.title, { size: 27, weight: 700 });
    fit(x + 30, y + 72, c.ref, cw - 60, { size: 14, fill: C.muted });
    fit(x + 30, y + 108, c.formula, cw - 60, { font: SYM, size: 21, weight: 700, fill: col });
    let fy = y + 142;
    for (const f of c.facts) {
      rect(x + 32, fy - 11, 6, 6, { rx: 3, fill: col });
      fy = wrap(x + 48, fy, f, cw - 80, { size: 16, fill: C.text, lh: 21, maxLines: 3 }) + 6;
    }
    fit(x + 30, fy + 8, c.code, cw - 60, { font: MONO, size: 13, fill: C.text2 });
    /* the joke */
    const jy = y + ch - 182, jh = 166;
    if (fy + 20 > jy) console.warn('card overflow: ' + c.title + ' by ' + (fy + 20 - jy));
    rect(x + 22, jy, cw - 44, jh, { rx: 10, fill: '#fff', stroke: tint(col, 0.45), sw: 1.2 });
    const stampW = 250;
    rect(x + 22, jy, stampW, jh, { rx: 10, fill: tint(col, 0.12) });
    const jsize = Math.min(46, (stampW - 30) / Math.max(1, [...c.jp].length) * 1.05);
    text(x + 22 + stampW / 2, jy + 82, c.jp, { font: JP, size: jsize, weight: 700, fill: col, anchor: 'middle' });
    wrap(x + 22 + 14, jy + 118, c.src, stampW - 28, { size: 12, fill: C.text2, lh: 16 });
    text(x + 22 + stampW + 18, jy + 26, 'THE JOKE', { size: 12, weight: 700, fill: col, extra: ' letter-spacing="1.5"' });
    wrap(x + 22 + stampW + 18, jy + 50, c.joke, cw - 44 - stampW - 34, { size: 15.5, fill: C.text, lh: 20.5, maxLines: 6 });
  });

  text(M, H - 14, `${D.counts.hts} identifiers of kind hodgetheater · ${D.counts.bridges} bridges · ${D.counts.links} links in iut ids · example ${D.example} · pop-culture references are text only; all titles and catchphrases belong to their owners`, { size: 14, fill: C.muted });
  text(W - M, H - 14, 'oneman/motizukipdf · docs/DATA_MODEL.md §5 · generated by scripts/infographic/hodgetheaters.js from iut walk, iut ids --json and iut run', { size: 14, fill: C.muted, anchor: 'end' });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<title>The Hodge theaters of inter-universal Teichmüller theory, with jokes — docs/DATA_MODEL.md §5</title>
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
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'JetBrains Mono';font-weight:500">x</div><div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊</div>
    <div style="font-family:'Noto Sans CJK JP','WenQuanYi Zen Hei';font-weight:700">戦闘力ゲットだぜ君の名合体贅沢異世界転生死に戻り影分身術</div></body></html>`);
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
