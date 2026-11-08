#!/usr/bin/env node
/*
 * scripts/infographic/hodgetheaters-kawaii.js — "How to build a Hodge theater ♡", the kawaii
 * 4K infographic of the Hodge theaters and their construction.
 *
 *   node scripts/infographic/hodgetheaters-kawaii.js            → docs/hodgetheaters-kawaii-infographic.svg (master)
 *                                                                docs/hodgetheaters-kawaii-infographic.png (3840×2160)
 *   node scripts/infographic/hodgetheaters-kawaii.js --svg-only   skip the PNG
 *
 * The companion of scripts/infographic/hodgetheaters.js. Where that page explains what a
 * Hodge theater is, this one follows how the toolkit builds one: a sugoroku board of the
 * fourteen processes, from `iut run GenerateInitialData` to `iut run DrawEtalePicture`, in
 * the order of [IUTchI] §3–§6 and [IUTchIII] §1. Each square runs its process and must
 * report `=> ok`; the numbers on the squares are parsed from what the process prints. Then
 * there is one card per type of Hodge theater: how it is built, one key fact, and three jokes
 * from Japanese pop culture (text references only; the mascots are original drawings).
 *
 * The rounded type is M PLUS Rounded 1c (SIL Open Font License, fonts/mplus-rounded-1c/OFL.txt),
 * vendored as the fontsource subsets the page needs and embedded into the SVG, so the master
 * renders the same anywhere. Math stays in DejaVu Sans, as on the other infographics.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const FONTDIR = path.join(__dirname, 'fonts', 'mplus-rounded-1c');
const OUT_SVG = path.join(ROOT, 'docs', 'hodgetheaters-kawaii-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'hodgetheaters-kawaii-infographic.png');
const W = 3840, H = 2160;

/* ------------------------------------------------------------ data */
const BIN = path.join(SRC, 'iut');
if (!fs.existsSync(BIN)) { console.error('src/iut is not built: run `make -C src` first'); process.exit(1); }
const iut = args => execFileSync(BIN, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const fail = msg => { console.error(msg); process.exit(1); };
const ids = JSON.parse(iut(['ids', '--json']));
const byId = {}; for (const r of ids) byId[r.id] = r;
const procs = JSON.parse(iut(['procs', '--json']));
const procById = {}; for (const p of procs) procById[p.id] = p;

const run = p => {
  if (!procById[p]) fail('no process ' + p);
  const o = iut(['run', p]);
  if (!/=> ok\s*$/.test(o)) fail(`iut run ${p} did not end in "=> ok"`);
  return o;
};
const grab = (s, re, what) => { const m = s.match(re); if (!m) fail('could not read ' + what); return m; };

const out = {};
for (const p of ['GenerateInitialData', 'BuildLocalFrobenioids', 'BuildGlobalRealified', 'AssembleThetaHodgeTheater', 'MapLabels', 'LabelCusps',
  'ExtractCapsules', 'EvaluateAtPoints', 'BuildBridges', 'GlueHodgeTheaters', 'ForgetToDHodgeTheater', 'ChainFrobeniusPicture', 'DefineLattice', 'DrawEtalePicture'])
  out[p] = run(p);

const g0 = grab(out.GenerateInitialData, /(abc\([\d,]+\)) l=\d+: l=(\d+), \|V\|=(\d+), log q = ([\d.]+)/, 'initial data');
const example = g0[1], l = +g0[2], nV = +g0[3], logq = +g0[4];
const lstar = (l - 1) / 2;
const locals = grab(out.AssembleThetaHodgeTheater, /(\d+) local Frobenioids \(bad (\d+), good (\d+), arch (\d+)\)/, 'local Frobenioids');
const nPrimes = +grab(out.BuildGlobalRealified, /Prime ≅ V_mod: (\d+) primes/, 'primes')[1];
const realOK = /F⊩_tht ≅ F⊩_mod: yes/.test(out.BuildGlobalRealified);
const dilation = +grab(out.AssembleThetaHodgeTheater, /dilated by ([\d.]+)/, 'dilation')[1];
const cor37 = (out.AssembleThetaHodgeTheater.match(/\[ ok \]/g) || []).length;
const cusps = grab(out.LabelCusps, /LabCusp±\(D_⊚\): (\d+) cusps.*?LabCusp\(D_⊛\): (\d+)/, 'cusps');
const capT = +grab(out.ExtractCapsules, /capsule F_T: (\d+) members/, 'F_T')[1];
const capJ = +grab(out.ExtractCapsules, /capsule F_J: (\d+) members/, 'F_J')[1];
const evalPts = grab(out.EvaluateAtPoints, /(\d+) evaluation points labelled \|F_l\| = \{[\d,]+\}; Θ̲_v values .*?: ([\d ]+)/, 'evaluation points');
const bridges = {};
for (const m of out.BuildBridges.matchAll(/^\s+(\w+Bridge)\s+\w+ → \w+\s+\((\d+) members\)\s+isomorphisms: .+?\((\d+)\)\s+ok/gm)) bridges[m[1]] = { members: +m[2], order: +m[3] };
for (const b of ['ThetaBridge', 'NFBridge', 'ThetaPmBridge', 'ThetaEllBridge']) if (!bridges[b]) fail('BuildBridges: no ' + b);
const glueMap = grab(out.GlueHodgeTheaters, /label map t ↦ \|t\|: ([\d,]+)/, 'label map')[1];
const dSelf = /self-iso: yes/.test(out.ForgetToDHodgeTheater);
const chainN = +grab(out.ChainFrobeniusPicture, /chain of (\d+) Θ-Hodge theaters/, 'chain')[1];
const commute = grab(out.DefineLattice, /squares commute: (\w+)/, 'commute')[1];
const spokes = +grab(out.DrawEtalePicture, /(\d+) spokes/, 'spokes')[1];
if (capT !== l || capJ !== lstar) fail('capsule sizes disagree with l');

/* ------------------------------------------------------------ the board: 14 squares */
/* unlock: index of the card whose Hodge theater this square completes */
const SQUARES = [
  { p: 'GenerateInitialData', title: 'Pick the ingredients', what: `initial Θ-data for ${example}: l = ${l}, |V| = ${nV}, log q = ${logq.toFixed(2)}` },
  { p: 'BuildLocalFrobenioids', title: 'Bake the local Frobenioids', what: `F̲_v at every v: ${locals[2]} bad · ${locals[3]} good · ${locals[4]} arch; q̲_v = q_v^{1/2l} and Θ̲_v` },
  { p: 'BuildGlobalRealified', title: 'Add the global one', what: `C⊩_mod with Prime ≅ V (${nPrimes} primes), weights ρ_v; F⊩_mod ≅ F⊩_tht ${realOK ? '✓' : '✗'}` },
  { p: 'AssembleThetaHodgeTheater', title: 'Assemble ({F̲_v}, F⊩_mod)', what: `(a)(b)(c) of Def 3.6 hold; Θ-link checks ${cor37}/4; dilation ${dilation.toFixed(2)}`, unlock: 0 },
  { p: 'MapLabels', title: 'Make the label sets', what: `F_l = {−${lstar}…${lstar}} ⊇ F_l^× ↠ F_l^* = {1…${lstar}}` },
  { p: 'LabelCusps', title: 'Label the cusps', what: `LabCusp±(D_⊚) ≅ F_l (${cusps[1]} cusps), LabCusp(D_⊛) ≅ F_l^* (${cusps[2]})` },
  { p: 'ExtractCapsules', title: 'Fill the capsules', what: `F_T with ${capT} F-prime-strips, F_J with ${capJ}; F_J ↪ F_T by j ↦ +j` },
  { p: 'EvaluateAtPoints', title: 'Evaluate theta at the points', what: `${evalPts[1]} points labelled |F_l|: Θ̲_v ↦ q̲_v^{j²}, values ${evalPts[2].trim().split(/\s+/).join(', ')}` },
  { p: 'BuildBridges', title: 'Build the four bridges', what: `NF ${bridges.NFBridge.order} · Θ ${bridges.ThetaBridge.order} · Θ± ${bridges.ThetaPmBridge.order} · Θell ${bridges.ThetaEllBridge.order} isomorphisms`, unlock: [1, 2] },
  { p: 'GlueHodgeTheaters', title: 'Glue along 0, ⊞ ↦ >', what: `t ↦ |t|: ${glueMap.replace(/,/g, ' ')}`, unlock: 3 },
  { p: 'ForgetToDHodgeTheater', title: 'Forget down to D', what: `every F ↦ D; capsules |T| = ${capT}, |J| = ${capJ} survive; self-iso ${dSelf ? '✓' : '✗'}`, unlock: 4 },
  { p: 'ChainFrobeniusPicture', title: 'Chain them by Θ-links', what: `a Frobenius picture of ${chainN} Θ-HTs in ${chainN} universes; † → ‡`, unlock: 5 },
  { p: 'DefineLattice', title: 'Lay out the lattice', what: `log-links up, Θ×μ_LGP-links across; squares commute: ${commute}`, unlock: 6 },
  { p: 'DrawEtalePicture', title: 'Draw the étale picture', what: `core D⊢ with ${spokes} spokes; any permutation of spokes is valid`, unlock: 7 },
];
for (const s of SQUARES) s.ref = procById[s.p].paper + ' ' + procById[s.p].section;

/* ------------------------------------------------------------ the eight cards (annotations) */
const CARDS = [
  {
    id: 'ThetaHodgeTheater', short: 'Θ-HT', title: 'Θ-Hodge theater', jp: 'テータ劇場', col: 0, eyes: 'dot', sym: 'Θ',
    formula: '†HT^Θ = ( {†F̲_v}_{v∈V} , †F⊩_mod )',
    steps: ['Choose initial Θ-data (F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)', 'Build a local Frobenioid F̲_v at each v ∈ V, plus the global realified F⊩_mod', 'Assemble them under (a) local models, (b) global model, (c) compatibility'],
    squares: '1–4',
    key: `It carries both pilots: q̲_v in F⊩_mod and Θ̲_v(j) = q̲_v^{j²} in F⊩_tht.`,
    jokes: [
      ['Dragon Ball Z', `The scouter reads the Θ-pilot at l(l+1)/12 ≈ ${dilation.toFixed(2)} times the q-pilot. Not over 9000, but somebody still crushes the scouter.`],
      ['Sailor Moon', 'Theta Prism Power, make up! Θ̲_v transforms into q̲_v^{j²}, with a new outfit for each of the six evaluation points.'],
      ['Evangelion', 'Two pilots, one theater, and nobody has to get in the robot: the Θ-link just tells Θ̲_v that it is q̲_v now.'],
    ],
  },
  {
    id: 'ThetaNFHodgeTheater', short: 'ΘNF-HT', title: 'ΘNF-Hodge theater', jp: 'かけ算劇場', col: 1, eyes: 'happy', sym: '×',
    formula: '†F^⊛ ⟵ †F_J ⟶ †F_> ⇝ †HT^Θ',
    steps: [`Label by F_l^* = F_l^×/{±1} and fill the capsule F_J with l* = ${lstar} F-prime-strips`, 'Evaluate at the points labelled j: Θ̲_v ↦ q̲_v^{j²} (Ex 4.4)', 'Bridge F_J to F_⊛ (NF-bridge, Π_{C_K} ↷ F_mod^×) and to F_> (Θ-bridge)'],
    squares: '5–9',
    key: `NF-bridge: an F_l^*-torsor of ${bridges.NFBridge.order} isomorphisms. Θ-bridge: exactly ${bridges.ThetaBridge.order}.`,
    jokes: [
      ['Pokémon', `Gotta catch all l* = ${lstar} labels! Catching −3 also counts as catching 3, which makes this Pokédex suspiciously easy.`],
      ['gacha games', `An NF-bridge relabelling is a gacha pull over F_l^*: ${lstar} outcomes, every one SSR, and none of them changes your team.`],
      ['Hello Kitty', 'Hello Kitty has no mouth and the Θ-bridge has no automorphisms. Both still manage to say everything they need to.'],
    ],
  },
  {
    id: 'ThetaPmEllHodgeTheater', short: 'Θ±ell-HT', title: 'Θ±ell-Hodge theater', jp: 'たし算劇場', col: 2, eyes: 'wink', sym: '±',
    formula: '†D^⊚± ⟵ †F_T ⟶ †F_⊞',
    steps: [`Label the cusps by F_l: T is an F_l^{⋊±}-group, |T| = l = ${l}`, 'Fill the capsule F_T, one F-prime-strip for each t ∈ F_l', 'Bridge D_T to D^⊚± = B(X̲_K)^0 (Θell-bridge) and F_T to F_⊞ (Θ±-bridge)'],
    squares: '5–9',
    key: `Θ±-bridge: ${bridges.ThetaPmBridge.order} = 2·2^${nV} isomorphisms. Θell-bridge: ${bridges.ThetaEllBridge.order} = 2l.`,
    jokes: [
      ['Your Name', 'Kimi no t wa? t and −t wake up in each other\'s bodies, −1_{F_l} says it wasn\'t involved, and only |t| makes it to the ΘNF side.'],
      ['riichi mahjong', `With l = ${l}, F_T holds exactly ${l} tiles, one per label. Kokushi musō, the thirteen orphans, except every orphan has a bridge.`],
      ['Vocaloid', 'Kagamine Rin and Len are mirror images, and so are D_t and D_{−t}. Only the {±1}-torsor knows which one is singing.'],
    ],
  },
  {
    id: 'ThetaPmEllNFHodgeTheater', short: 'Θ±ell NF-HT', title: 'Θ±ell NF-Hodge theater', jp: '合体劇場', col: 3, eyes: 'star', sym: '•',
    formula: 'Θ±ell-HT  ⊔_{0, ⊞ ↦ >}  ΘNF-HT',
    steps: ['Build both halves: the additive Θ±ell-HT and the multiplicative ΘNF-HT', 'Send ±t ↦ |t|, and D_0, D_⊞ ↦ D_> (Prop 6.7)', 'Glue along 0, ⊞ ↦ >, in a universe of its own (Def 6.13 (iii))'],
    squares: '10',
    key: 'The gluing is unique (Rem 6.12.2). The result is one vertex • of the log-theta-lattice.',
    jokes: [
      ['Super Sentai', '合体! The additive robot and the multiplicative robot combine along 0, ⊞ ↦ >. The gluing is unique, so the stock footage never changes.'],
      ['kyaraben', 'A character bento: additive side on the left, multiplicative on the right, and the rice ball in the middle is labelled >.'],
      ['Tamagotchi', 'Each vertex hatches in its own universe and has to be fed its own fresh monoids. Forget to feed it and it becomes a D-Hodge theater.'],
    ],
  },
  {
    id: 'DThetaPmEllNFHodgeTheater', short: 'D-HT', title: 'D-Hodge theaters', jp: 'なまえなし', col: 4, eyes: 'dot', sym: 'D',
    formula: '( D-Θ±ell-HT , D-ΘNF-HT , gluing )',
    steps: ['Apply F ↦ D to every prime-strip: keep Π_v, drop every monoid (Def 5.2)', 'Keep the base categories B(X̲_K)^0 and B(C̲_K)^0 and the capsules', 'Glue the D-Θ±ell-HT and the D-ΘNF-HT exactly as before (Prop 6.7)'],
    squares: '11',
    key: 'Isom(F) ≅ Isom(D) (Cor 5.3): no symmetry lost. Vertically coric: every log-link keeps it.',
    jokes: [
      ['Spirited Away', '"F⊩▶×μ-prime-strip? What an extravagant name." Yubaba takes the monoids. From now on, your name is D.'],
      ['Marie Kondo', 'Does this monoid spark joy? Thank it and let it go. What is left in the drawer is Π_v, and it is vertically coric.'],
      ['Ghost in the Shell', 'Π_v is the ghost and the monoids are the shell. A log-link swaps the shell (a log-shell, even) and the ghost stays the same.'],
    ],
  },
  {
    id: 'DagHodgeTheater', short: '†HT → ‡HT', title: '†HT and ‡HT', jp: '異世界', col: 5, eyes: 'happy', sym: '‡',
    formula: '†F⊩_tht ≅ ‡F⊩_mod   (Θ̲_v ↦ q̲_v)',
    steps: ['Build two Θ±ell NF-Hodge theaters in two different universes', 'Link †F⊩_tht to ‡F⊩_mod by a full poly-isomorphism (Cor 3.7)', `Repeat: … → †HT → ‡HT → … is the Frobenius picture (Cor 3.8)`],
    squares: '12',
    key: 'Shared: G_v (so D⊢_v) and O×μ. Not shared: Π_v and the ring structures.',
    jokes: [
      ['isekai', '"That Time I Got Reincarnated in Another Universe as ‡HT, and Only My O×μ and G_v Came With Me", vol. 1 of ∞.'],
      ['Doraemon', 'The Θ-link is not an Anywhere Door. You can walk through it, but your ring structure has to stay at home.'],
      ['Steins;Gate', 'Crossing the Θ-link is a world-line shift: only G_v and O×μ remember the old world. El Psy Kongroo.'],
    ],
  },
  {
    id: 'NMHodgeTheater', short: '{n,m}HT', title: '{n,m}HT', jp: 'すごろく', col: 6, eyes: 'wink', sym: '#',
    formula: '{n,m}HT ⟶log⟶ {n,m+1}HT ,  ⟶Θ×μ_LGP⟶ {n+1,m}HT',
    steps: ['Put a fresh Θ±ell NF-Hodge theater at every (n, m) ∈ Z²', 'Vertical: log-links log : O×_{K_v} → K_v, with log-shells I_v ([IUTchIII] Def 1.1)', 'Horizontal: Θ×μ_LGP-links between the pilots ([IUTchIII] Def 3.8)'],
    squares: '13',
    key: 'Squares do not commute (Rem 1.4.1); the proof needs only an infinite H.',
    jokes: [
      ['Re:Zero', 'Return by Log: each log-link wakes you in a fresh Hodge theater with brand-new monoids, but you keep your memories (Π_v, G_v).'],
      ['Super Mario', 'Pipes go up (log-links), warp zones go across (Θ-links), and taking them in another order lands you in another world.'],
      ['shogi', 'A shogi board with Z² squares where pieces only move up or to the right, and no move can ever be taken back.'],
    ],
  },
  {
    id: 'EtalePicture', short: 'étale picture', title: 'The étale picture', jp: '影分身', col: 7, eyes: 'star', sym: '✦',
    formula: '†D⊢_> ≅ ‡D⊢_>   (full poly-isomorphism)',
    steps: ['Forget each Hodge theater down to its D-Hodge theater', 'Link them by the D-links †D⊢_> ≅ ‡D⊢_> (Cor 4.12, 6.10)', 'Arrange them as spokes around the one bi-coric core D⊢_>'],
    squares: '14',
    key: 'The spokes can be permuted freely: multiradiality, the input to [IUTchIII] Thm 3.11.',
    jokes: [
      ['Naruto', 'Shadow clone technique: every Hodge theater is a clone radiating from one core D⊢_>, and the poly-isomorphisms shuffle them at will.'],
      ['idol groups', 'Everyone gets to be center. The core D⊢_> stands in the middle, the spokes rotate, and from the center the formation looks the same.'],
      ['kaitenzushi', 'Conveyor-belt sushi: the Hodge theaters circle past the chef at the core, and whichever plate arrives, the chef sees the same thing.'],
    ],
  },
];
for (const c of CARDS) { const r = byId[c.id]; if (!r) fail('no identifier ' + c.id); c.ref = r.ref; }

/* ------------------------------------------------------------ fonts */
const fontJson = JSON.parse(fs.readFileSync(path.join(FONTDIR, 'fonts.json'), 'utf8'));
const fontCSS = fontJson.map(f => `@font-face{font-family:'M PLUS Rounded 1c';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTDIR, f.file)).toString('base64')}) format('woff2');unicode-range:${f.range};}`).join('\n');

const data = { example, l, lstar, nV, logq, squares: SQUARES, cards: CARDS, counts: { hts: ids.filter(r => r.kind === 'hodgetheater').length } };

/* ------------------------------------------------------------ layout (runs in Chromium) */
function layout(D) {
  const W = 3840, H = 2160, M = 80;
  const C = {
    bg: '#fff6fa', panel: '#ffffff', ink: '#3d2b45', ink2: '#6e5a75', muted: '#a593ab', blush: '#ff9fbf', line: '#f3dbe6',
    series: ['#9b7bea', '#f08a4b', '#4aa3f0', '#2fbf8f', '#d99a00', '#f0607a', '#5fa83f', '#ec6fae'],
  };
  const R = "'M PLUS Rounded 1c', 'DejaVu Sans', 'WenQuanYi Zen Hei', sans-serif";
  const SYM = "'DejaVu Sans', 'DejaVu Serif', 'FreeSerif', 'M PLUS Rounded 1c', sans-serif";
  const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, monospace";

  const cv = document.createElement('canvas').getContext('2d');
  const measure = (t, font, size, weight) => { cv.font = `${weight || 500} ${size}px ${font}`; return cv.measureText(t).width; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const out = [];
  const text = (x, y, s, o = {}) => {
    const font = o.font || R, size = o.size || 20, weight = o.weight || 500, fill = o.fill || C.ink, anchor = o.anchor || 'start';
    out.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${o.extra || ''}>${esc(s)}</text>`);
    return measure(s, font, size, weight);
  };
  const rect = (x, y, w, h, o = {}) => out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.filter ? ` filter="url(#${o.filter})"` : ''}/>`);
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}" stroke-linecap="round" stroke-linejoin="round"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}${o.filter ? ` filter="url(#${o.filter})"` : ''}/>`);
  const circle = (x, y, r, o = {}) => out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`);
  const ellipse = (x, y, rx, ry, o = {}) => out.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${o.fill || 'none'}"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const mix = c => Math.round(255 + (c - 255) * a); return `rgb(${mix(r)},${mix(g)},${mix(b)})`; };
  const shade = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const mix = c => Math.round(c * (1 - a)); return `rgb(${mix(r)},${mix(g)},${mix(b)})`; };

  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.4; const words = s.split(' '); let cur = '', yy = y, n = 0;
    let first = o.indent || 0;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || R, size, o.weight) > width - (n === 0 ? first : 0) && cur) { text(x + (n === 0 ? first : 0), yy, cur, o); yy += lh; cur = w; n++; } else cur = t;
    }
    if (cur) { text(x + (n === 0 ? first : 0), yy, cur, o); yy += lh; n++; }
    if (o.maxLines && n > o.maxLines) console.warn(`wrap overflow: ${n} lines > ${o.maxLines}: ${s.slice(0, 60)}…`);
    return yy;
  };
  const fit = (x, y, s, width, o = {}) => {
    let t = s;
    while (t.length > 1 && measure(t, o.font || R, o.size || 20, o.weight) > width) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== s) console.warn('cut: ' + s);
    return text(x, y, t, o);
  };
  const sparkle = (x, y, r, fill, o = {}) => pathd(`M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z`, { fill, opacity: o.opacity });
  const heart = (x, y, s, fill, o = {}) => pathd(`M${x},${y + s * 0.9} C${x - s * 1.6},${y - s * 0.1} ${x - s * 0.8},${y - s * 1.2} ${x},${y - s * 0.35} C${x + s * 0.8},${y - s * 1.2} ${x + s * 1.6},${y - s * 0.1} ${x},${y + s * 0.9} Z`, { fill, opacity: o.opacity });

  /* the mascot: an original mochi with a tiny theater curtain on its head */
  const mascot = (cx, cy, r, col, eyes, sym) => {
    const body = tint(col, 0.35), edge = shade(col, 0.05);
    ellipse(cx, cy + r * 0.92, r * 0.95, r * 0.14, { fill: shade(col, 0.3), opacity: 0.12 });
    pathd(`M${cx - r},${cy + r * 0.55} C${cx - r * 1.08},${cy - r * 0.55} ${cx - r * 0.55},${cy - r * 0.98} ${cx},${cy - r * 0.98} C${cx + r * 0.55},${cy - r * 0.98} ${cx + r * 1.08},${cy - r * 0.55} ${cx + r},${cy + r * 0.55} C${cx + r * 0.92},${cy + r * 0.86} ${cx - r * 0.92},${cy + r * 0.86} ${cx - r},${cy + r * 0.55} Z`, { fill: body, stroke: edge, sw: Math.max(2, r * 0.06) });
    /* curtain bangs */
    pathd(`M${cx - r * 0.62},${cy - r * 0.78} Q${cx - r * 0.42},${cy - r * 0.38} ${cx - r * 0.12},${cy - r * 0.62} Q${cx},${cy - r * 0.9} ${cx + r * 0.12},${cy - r * 0.62} Q${cx + r * 0.42},${cy - r * 0.38} ${cx + r * 0.62},${cy - r * 0.78} Q${cx},${cy - r * 1.12} ${cx - r * 0.62},${cy - r * 0.78} Z`, { fill: col, opacity: 0.85 });
    /* badge */
    circle(cx, cy - r * 0.98, r * 0.24, { fill: '#fff', stroke: col, sw: Math.max(1.5, r * 0.05) });
    text(cx, cy - r * 0.98 + r * 0.11, sym, { font: SYM, size: r * 0.3, weight: 700, fill: col, anchor: 'middle' });
    const ey = cy + r * 0.05, ex = r * 0.36, er = r * 0.12, ink = C.ink;
    const eye = (x, kind) => {
      if (kind === 'happy') pathd(`M${x - er},${ey + er * 0.3} Q${x},${ey - er * 1.1} ${x + er},${ey + er * 0.3}`, { stroke: ink, sw: r * 0.07 });
      else if (kind === 'star') { sparkle(x, ey, er * 1.35, ink); circle(x + er * 0.2, ey - er * 0.2, er * 0.25, { fill: '#fff' }); }
      else { ellipse(x, ey, er * 0.82, er * 1.05, { fill: ink }); circle(x + er * 0.25, ey - er * 0.35, er * 0.32, { fill: '#fff' }); }
    };
    eye(cx - ex, eyes === 'wink' ? 'dot' : eyes);
    eye(cx + ex, eyes === 'wink' ? 'happy' : eyes);
    ellipse(cx - r * 0.58, ey + r * 0.27, r * 0.15, r * 0.08, { fill: C.blush, opacity: 0.8 });
    ellipse(cx + r * 0.58, ey + r * 0.27, r * 0.15, r * 0.08, { fill: C.blush, opacity: 0.8 });
    /* ω mouth */
    const my = ey + r * 0.24, mw = r * 0.09;
    pathd(`M${cx - 2 * mw},${my} Q${cx - mw},${my + mw * 1.6} ${cx},${my} Q${cx + mw},${my + mw * 1.6} ${cx + 2 * mw},${my}`, { stroke: ink, sw: r * 0.05 });
  };

  /* speech bubble with a tail pointing to (tx, ty) */
  const bubble = (x, y, w, h, fill, stroke, tx, ty) => {
    const r = Math.min(22, h / 2);
    const bx = Math.max(x + r + 10, Math.min(x + w - r - 50, tx));
    const hasTail = tx >= 0, top = hasTail && ty < y;
    let d = `M${x + r},${y} `;
    if (top) d += `L${bx},${y} L${tx},${ty} L${bx + 34},${y} `;
    d += `L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} `;
    if (hasTail && !top && ty > y + h) d += `L${bx + 34},${y + h} L${tx},${ty} L${bx},${y + h} `;
    d += `L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
    pathd(d, { fill, stroke, sw: 2.5 });
  };

  /* ---------------------------------------------------------------- background */
  out.push(`<defs>
  <pattern id="dots" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="4" fill="#ffd3e4"/><circle cx="42" cy="42" r="4" fill="#e6dcff"/></pattern>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#d98bb0" flood-opacity="0.18"/></filter>
  <marker id="arrK" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f2a7c5"/></marker>
</defs>`);
  rect(0, 0, W, H, { fill: C.bg });
  rect(0, 0, W, H, { fill: 'url(#dots)', opacity: 0.55 });

  /* ---------------------------------------------------------------- header */
  text(M, 104, 'How to build a Hodge theater', { size: 70, weight: 800 });
  const tw = measure('How to build a Hodge theater', R, 70, 800);
  heart(M + tw + 48, 76, 22, '#ff7fae');
  text(M + tw + 92, 104, 'ホッジ劇場のつくりかた', { size: 44, weight: 800, fill: '#ec6fae' });
  wrap(M, 156, `A kawaii field guide to inter-universal Teichmüller theory, part 2. The first infographic said what each Hodge theater is; this one builds them, square by square, the way the toolkit does it for ${D.example} (l = ${D.l}, |V| = ${D.nV}). Every square below is a real process: it ran, it printed => ok, and its numbers are what it printed. Then each type gets a card with its recipe, one fact to remember, and three jokes from Japanese pop culture. The mochi are original. The jokes are text-only references.`, 2900, { size: 23, fill: C.ink2, lh: 32 });

  /* mascot with speech bubble, top right */
  bubble(3080, 40, 480, 96, '#fff', '#f2a7c5', 3600, 150);
  text(3320, 82, 'いっしょに作ろう!', { size: 30, weight: 800, fill: '#ec6fae', anchor: 'middle' });
  text(3320, 116, "Let's build one together!", { size: 20, weight: 700, fill: C.ink2, anchor: 'middle' });
  mascot(3670, 176, 74, '#ec6fae', 'happy', '♡');
  sparkle(3560, 228, 14, '#ffc94d'); sparkle(3768, 92, 10, '#9b7bea'); sparkle(3010, 150, 9, '#4aa3f0');

  /* ---------------------------------------------------------------- the sugoroku board */
  const BX = M, BY = 290, BW = W - 2 * M, BH = 600;
  rect(BX, BY, BW, BH, { rx: 36, fill: C.panel, filter: 'soft' });
  rect(BX, BY, BW, BH, { rx: 36, fill: 'none', stroke: '#ffd3e4', sw: 3 });
  text(BX + 40, BY + 58, 'ホッジ劇場すごろく', { size: 36, weight: 800, fill: '#ec6fae' });
  const bt = measure('ホッジ劇場すごろく', R, 36, 800);
  text(BX + 40 + bt + 20, BY + 58, 'the Hodge theater board game: fourteen processes from the ingredients to the étale picture', { size: 28, weight: 700 });
  text(BX + BW - 40, BY + 58, 'iut run <process> on every square · a ★ square completes a Hodge theater', { size: 18, weight: 500, fill: C.muted, anchor: 'end' });

  const nPer = 7, sgap = 46, sw = (BW - 80 - (nPer - 1) * sgap) / nPer, sh = 210;
  const row1 = BY + 110, row2 = BY + 110 + sh + 56;
  const sq = D.squares.map((s, i) => {
    const r = Math.floor(i / nPer), k = i % nPer, col = r === 0 ? k : nPer - 1 - k;
    return { ...s, i, x: BX + 40 + col * (sw + sgap), y: r === 0 ? row1 : row2, row: r };
  });
  /* the road */
  const cy1 = row1 + sh / 2, cy2 = row2 + sh / 2;
  const xs = sq[0].x + sw / 2, xe = sq[nPer - 1].x + sw / 2;
  const road = `M${xs},${cy1} L${xe},${cy1} C${xe + sw * 0.75},${cy1} ${xe + sw * 0.75},${cy2} ${xe},${cy2} L${sq[sq.length - 1].x + sw / 2},${cy2}`;
  pathd(road, { stroke: '#ffe3ee', sw: 70 });
  pathd(road, { stroke: '#f7b6cf', sw: 4, dash: '2 16' });
  for (const s of sq) {
    const star = s.unlock !== undefined;
    const unl = star ? [].concat(s.unlock) : [];
    const col = star ? C.series[unl[0]] : '#c9a7d8';
    rect(s.x, s.y, sw, sh, { rx: 26, fill: star ? tint(col, 0.13) : '#fff', stroke: star ? col : '#ead6ef', sw: star ? 3 : 2.5 });
    circle(s.x + 38, s.y + 40, 24, { fill: star ? col : '#f3e6f7' });
    text(s.x + 38, s.y + 49, String(s.i + 1), { size: 24, weight: 800, fill: star ? '#fff' : '#9a76ad', anchor: 'middle' });
    fit(s.x + 74, s.y + 36, s.title, sw - 90, { size: 22, weight: 800 });
    fit(s.x + 74, s.y + 60, s.p, sw - 90, { font: MONO, size: 15, fill: C.ink2, weight: 400 });
    wrap(s.x + 22, s.y + 100, s.what, sw - 44, { font: SYM, size: 19, fill: C.ink, lh: 26, weight: 400, maxLines: 3 });
    fit(s.x + 22, s.y + sh - 18, '[' + s.ref.replace(' ', '] '), star ? sw - 44 - (measure('★ NEW: ' + [].concat(s.unlock).map(u => D.cards[u].short).join(' + '), R, 15, 800) + 50) : sw - 44, { size: 14, fill: C.muted });
    if (star) {
      const names = unl.map(u => D.cards[u].short);
      const label = '★ NEW: ' + names.join(' + ');
      const bw = measure(label, R, 15, 800) + 26;
      rect(s.x + sw - bw - 16, s.y + sh - 40, bw, 28, { rx: 14, fill: col });
      text(s.x + sw - bw / 2 - 16, s.y + sh - 20, label, { size: 15, weight: 800, fill: '#fff', anchor: 'middle' });
      /* the unlocked mochi peeking over the top edge */
      unl.forEach((u, j) => mascot(s.x + sw - 46 - j * 62, s.y - 4, 26, C.series[u], D.cards[u].eyes, D.cards[u].sym));
      s.names = names;
    }
  }
  /* start and goal flags */
  const flag = (s, jp, en, col) => {
    const t = jp + '  ' + en, w = measure(t, R, 18, 800) + 36, x = s.x + sw / 2 - w / 2, y = s.y - 20;
    rect(x, y, w, 38, { rx: 19, fill: col, stroke: '#fff', sw: 3 });
    text(x + w / 2, y + 26, t, { size: 18, weight: 800, fill: '#fff', anchor: 'middle' });
    sparkle(x + w + 16, y + 6, 10, '#ffc94d');
  };
  flag(sq[0], 'ふりだし', 'START', '#4aa3f0');
  flag(sq[sq.length - 1], 'あがり', 'GOAL', '#ec6fae');

  /* ---------------------------------------------------------------- the eight cards */
  const CY = BY + BH + 30, cols = 4, gx = 30, gy = 28;
  const cw = (W - 2 * M - (cols - 1) * gx) / cols, ch = (H - 46 - CY - gy) / 2;
  D.cards.forEach((c, i) => {
    const x = M + (i % cols) * (cw + gx), y = CY + Math.floor(i / cols) * (ch + gy);
    const col = C.series[c.col];
    rect(x, y, cw, ch, { rx: 34, fill: C.panel, filter: 'soft' });
    rect(x, y, cw, ch, { rx: 34, fill: 'none', stroke: tint(col, 0.45), sw: 3 });
    /* header ribbon */
    pathd(`M${x + 34},${y} L${x + cw - 34},${y} Q${x + cw},${y} ${x + cw},${y + 34} L${x + cw},${y + 96} L${x},${y + 96} L${x},${y + 34} Q${x},${y} ${x + 34},${y} Z`, { fill: tint(col, 0.16) });
    mascot(x + 72, y + 66, 46, col, c.eyes, c.sym);
    text(x + 138, y + 52, c.title, { size: 31, weight: 800 });
    const jw = measure(c.jp, R, 18, 800) + 24;
    rect(x + 138, y + 64, jw, 28, { rx: 14, fill: col });
    text(x + 138 + jw / 2, y + 84, c.jp, { size: 18, weight: 800, fill: '#fff', anchor: 'middle' });
    fit(x + 138 + jw + 12, y + 84, c.ref + ' · squares ' + c.squares, cw - 160 - jw, { size: 15, fill: C.ink2, weight: 500 });
    sparkle(x + cw - 40, y + 34, 11, '#ffc94d'); sparkle(x + cw - 66, y + 62, 6, col, { opacity: 0.7 });

    fit(x + 30, y + 138, c.formula, cw - 60, { font: SYM, size: 21, weight: 700, fill: shade(col, 0.15) });
    text(x + 30, y + 174, 'つくりかた · HOW IT\'S BUILT', { size: 14, weight: 800, fill: col, extra: ' letter-spacing="1.2"' });
    let fy = y + 202;
    c.steps.forEach((st, k) => {
      circle(x + 44, fy - 6, 13, { fill: tint(col, 0.25) });
      text(x + 44, fy - 1, String(k + 1), { size: 15, weight: 800, fill: shade(col, 0.2), anchor: 'middle' });
      fy = wrap(x + 68, fy, st, cw - 98, { font: R, size: 17, lh: 22, weight: 500, maxLines: 2 }) + 6;
    });
    heart(x + 44, fy + 2, 9, '#ff7fae');
    fy = wrap(x + 68, fy + 8, c.key, cw - 98, { size: 17, lh: 22, weight: 700, fill: shade(col, 0.25), maxLines: 2 }) + 4;

    /* the jokes, as speech bubbles */
    const bh = 70, bgap = 12, bw = cw - 52;
    let by = y + ch - 22 - 3 * bh - 2 * bgap;
    if (fy + 6 > by) console.warn(`card overflow: ${c.title} by ${(fy + 6 - by).toFixed(0)}px`);
    c.jokes.forEach(([src, joke], k) => {
      const bx = x + 26;
      bubble(bx, by, bw, bh, k % 2 ? '#fff' : tint(col, 0.09), tint(col, 0.5), k === 0 ? bx + 60 : -1, k === 0 ? by - 14 : -1);
      const pw = measure(src, R, 13, 800) + 20;
      rect(bx + 16, by + 12, pw, 22, { rx: 11, fill: tint(col, 0.3) });
      text(bx + 16 + pw / 2, by + 28, src, { size: 13, weight: 800, fill: shade(col, 0.3), anchor: 'middle' });
      wrap(bx + 16, by + 29, joke, bw - 32, { size: 15.5, lh: 22, weight: 500, indent: pw + 10, maxLines: 2 });
      by += bh + bgap;
    });
  });

  text(M, H - 16, `${D.counts.hts} identifiers of kind hodgetheater in iut ids · example ${D.example} · type: M PLUS Rounded 1c (SIL OFL) and DejaVu Sans · the mochi are original drawings · pop-culture references are text only; all titles, names and catchphrases belong to their owners`, { size: 15, fill: C.muted });
  text(W - M, H - 16, 'oneman/motizukipdf · companion of hodgetheaters-infographic.png · generated by scripts/infographic/hodgetheaters-kawaii.js', { size: 15, fill: C.muted, anchor: 'end' });
  return out.join('\n');
}

/* ------------------------------------------------------------ render */
(async () => {
  const svgOnly = process.argv.includes('--svg-only');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.error('[page] ' + m.text()); });
  const sample = 'How to build Θ ホッジ劇場のつくりかたテータかけ算たし算合体なまえなし異世界すごろく影分身ふりだしあがりいっしょに作ろう!';
  await page.setContent(`<!doctype html><html><head><style>${fontCSS}</style></head><body style="margin:0;background:#fff6fa">
    ${[500, 700, 800].map(w => `<div style="font-family:'M PLUS Rounded 1c';font-weight:${w}">${sample}</div>`).join('')}
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊</div></body></html>`);
  await page.evaluate(async s => { for (const w of [500, 700, 800]) await document.fonts.load(`${w} 20px "M PLUS Rounded 1c"`, s); await document.fonts.ready; }, sample);
  const body = await page.evaluate(`(${layout.toString()})(${JSON.stringify(data)})`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>How to build a Hodge theater ♡ — the kawaii field guide to the Hodge theaters of IUT</title>
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
