#!/usr/bin/env node
/*
 * scripts/infographic/mutations.js — the 4K infographic of the 13 mutations.
 *
 *   node scripts/infographic/mutations.js            → docs/mutations-infographic.svg (master)
 *                                                      docs/mutations-infographic.png (3840×2160)
 *   node scripts/infographic/mutations.js --svg-only   skip Chromium, write the SVG only
 *
 * Reads the species / mutation tables of src/iut_ids.c (the same tables that
 * `iut species`, `iut ids --md` and htdocs/data/types.js print), `iut ids --json`
 * for the kind of each species and `iut procs --json` for the processes each
 * mutation is demonstrated by.  The prose, the "what is carried across" matrix
 * and the C-function / process cross-references live in ANNOTATIONS below,
 * keyed by mutation id: the script refuses to run if the keys and the table
 * drift apart, so a mutation added to src/iut_ids.c must be annotated here.
 *
 * Layout (3840 × 2160):
 *   header      the rule, the numbers
 *   row A       the mutation-history (species as vertices, mutations as edges) ·
 *               what each mutation carries across (Π_v, G_v, O×μ, O▶, rings, C⊩, log-volume)
 *   row B       one card per mutation, numbered as in row A, plus the definitions
 *               of [IUTchIV] Def 3.1 / 3.3 and the species operations
 *
 * Text widths are measured with a canvas in Chromium (the same Chromium that
 * renders the PNG), so the SVG is laid out against the real fonts — the same
 * method as scripts/infographic/build.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT_SVG = path.join(ROOT, 'docs', 'mutations-infographic.svg');
const OUT_PNG = path.join(ROOT, 'docs', 'mutations-infographic.png');
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

function readSpeciesAndMutations() {
  const src = fs.readFileSync(path.join(SRC, 'iut_ids.c'), 'utf8');
  const species = [], mutations = [];
  const sp = src.split('iut_species_table[] = {')[1].split('\n};')[0];
  for (const m of sp.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"/g)) species.push({ id: m[1], notation: m[2], ref: m[3], data: m[4] });
  const mu = src.split('iut_mutation_table[] = {')[1].split('\n};')[0];
  for (const m of mu.matchAll(/\{\s*"([A-Za-z]+)",\s*"([^"]*)",\s*"([A-Za-z]+)",\s*"([A-Za-z]+)",\s*"([^"]*)",\s*(\d)/g))
    mutations.push({ id: m[1], notation: m[2], from: m[3], to: m[4], ref: m[5], core: m[6] === '1' });
  return { species, mutations };
}

/* The columns of the "carried across" matrix: one datum at each v ∈ V (or globally). */
const COLUMNS = [
  { key: 'Pi', label: 'Π_v', sub: 'holomorphic base' },
  { key: 'G', label: 'G_v', sub: 'mono-analytic base' },
  { key: 'units', label: 'O×μ', sub: 'units mod torsion' },
  { key: 'val', label: 'O▶ / pilots', sub: 'value groups' },
  { key: 'ring', label: 'rings', sub: 'ring structures' },
  { key: 'glob', label: 'C⊩', sub: 'global realified' },
  { key: 'vol', label: 'log-vol', sub: 'log-volumes' },
];
/* cell states: keep ● · ind ◐ (with the indeterminacy named) · new ○ · drop — */
const K = s => ({ s: 'keep', n: s }), I = s => ({ s: 'ind', n: s }), N = s => ({ s: 'new', n: s }), D = s => ({ s: 'drop', n: s });

/* Everything below is read from the C comments at the cited functions and from the
 * papers; the matrix states follow the flags of iut_link (preserves_Pi, preserves_G,
 * preserves_units_mod_tors, preserves_ring_structure), iut_prime_strip_forget and
 * iut_hodge_theater_to_D.                                                          */
const ANNOTATIONS = {
  LogLink: {
    group: 'link', arrow: '(n,m) → (n,m+1)  vertical',
    what: 'At every v the units O×_{†v} go through the p-adic logarithm to log(O×), which becomes the additive module of a fresh copy ‡K_v whose monoid O▷_{‡v} is then rebuilt. Π_v and G_v are identified (D and D⊢ are vertically coric); the ring structures are not, and the Kummer isomorphisms of † and ‡ are not compatible with log (Prop 1.2 (iv)). The image of †O× rescaled by (p*)⁻¹ is the log-shell I_v ⊆ ‡K_v. "Tautological" when Π is identified by the identity, "full" when by the full poly-isomorphism.',
    cells: { Pi: K(), G: K(), units: N('new copy'), val: N('rebuilt'), ring: N(), glob: N(), vol: K('Prop 1.2 (iii)') },
    cfn: 'iut_log_link_strip · iut_log_link_hodge_theater_check', proc: ['ApplyLogLinkStrip', 'ChainLogLinks'],
  },
  ThetaUnitsModTorsLGPTorsorLink: {
    group: 'link', arrow: '(n,m) → (n+1,m)  horizontal',
    what: 'The horizontal arrow of the log-theta-lattice: the full poly-isomorphism †F⊩▶×μ_LGP ≅ ‡F⊩▶×μ_Δ that sends the Θ-pilot {q̲_v^{j²}} of (n,m) to the q-pilot {q̲_v} of (n+1,m), dilating value groups by the average of j², l(l+1)/12. Only G_v ↷ O×μ (up to Ind1, Ind2) and the value groups are related; Π_v and the rings are not — the two sides are mutually alien copies. Defined relative to the log-link through the LGP-monoids and F_MOD.',
    cells: { Pi: N('alien'), G: K(), units: I('Ind1, Ind2'), val: I('Θ ↦ q'), ring: N(), glob: I('D⊩ up to R>0'), vol: N() },
    cfn: 'iut_theta_link_make(…, IUT_LINK_THETA_UNITSMODTORS_LGP)', proc: ['MakePilots', 'DefineLattice'],
  },
  ThetaUnitsModTorsLgpIdealLink: {
    group: 'link', arrow: '(n,m) → (n+1,m)  horizontal',
    what: 'The same gluing through F⊩▶×μ_lgp instead of F⊩▶×μ_LGP: the lgp-version is built from F_mod (ideals, compatible with log-volumes, Ex 3.6) where the LGP-version is built from F_MOD (torsors, compatible with the link). F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp (Prop 3.7), so either variant can serve as the horizontal arrow; the toolkit lets the lattice choose its flavour.',
    cells: { Pi: N('alien'), G: K(), units: I('Ind1, Ind2'), val: I('Θ ↦ q'), ring: N(), glob: I('D⊩ up to R>0'), vol: K('F_mod') },
    cfn: 'iut_theta_link_make(…, IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL)', proc: ['CompareGlobalVariants', 'DefineLattice'],
  },
  ThetaUnitsModTorsGauLink: {
    group: 'link', arrow: '(n,m) → (n+1,m)  horizontal',
    what: 'The Θ×μ_gau-link of [IUTchII] Cor 4.10 (iii): †F⊩▶×μ_gau ≅ ‡F⊩▶×μ_Δ through the Gaussian monoids of theta values θ(√−q^{±t}) = q̲^{t²}, the version of the Θ-link that already knows the labels j ∈ F_l^*. It induces the full poly-isomorphism †F⊢×μ ≅ ‡F⊢×μ (iv) — units modulo torsion are horizontally coric — and, on the D⊢-prime-strips, the D-Θ±ell NF-link of the étale picture.',
    cells: { Pi: N('alien'), G: K(), units: I('Ind1, Ind2'), val: I('Θ ↦ q'), ring: N(), glob: I('D⊩ up to R>0'), vol: N() },
    cfn: 'iut_theta_link_make(…, IUT_LINK_THETA_UNITSMODTORS_GAU) · iut_theta_link_coric_units', proc: ['LinkThetaUnitsModTors'],
  },
  ThetaLink: {
    group: 'link', arrow: '†HT^Θ → ‡HT^Θ  the Frobenius picture',
    what: 'The first Θ-link, between Θ-Hodge theaters: the full poly-isomorphism †F⊩_tht ≅ ‡F⊩_mod of F⊩-prime-strips with Θ̲_v ↦ q̲_v, which preserves D⊢_v and the units O× but not Π_v or the ring structures. Cor 3.8 chains Θ-linked Θ-Hodge theaters into the Frobenius picture; the Θ×μ-versions above refine it so that it can coexist with the log-link.',
    cells: { Pi: N('alien'), G: K(), units: K('O×'), val: I('Θ̲_v ↦ q̲_v'), ring: N(), glob: K('C⊩_tht ≅ C⊩_mod'), vol: N() },
    cfn: 'iut_theta_link_make(…, IUT_LINK_THETA) · iut_theta_link_cor_three_seven', proc: ['AssembleThetaHodgeTheater', 'ChainFrobeniusPicture'],
  },
  ForgetToD: {
    group: 'forget', arrow: '{n,m}HT ↦ (n,◦)HT^D',
    what: 'Forgets every Frobenius-like portion of a Θ±ell NF-Hodge theater — all the monoids — and keeps only the base categories: the Π_v copies of F_⊞, F_>, D_⊚±, F_⊛ and the basepoints of the capsules F_T, F_J. The result is the vertically coric datum (n,◦)HT^D of [IUTchIII] Thm 1.5 (i), the same for every m in a column, and one spoke of the étale picture.',
    cells: { Pi: K(), G: K(), units: D(), val: D(), ring: D(), glob: D(), vol: D() },
    cfn: 'iut_hodge_theater_to_D · iut_d_hodge_theater_iso', proc: ['ForgetToDHodgeTheater', 'DrawEtalePicture'],
  },
  ForgetToDMono: {
    group: 'forget', arrow: 'F ↦ D ↦ D⊢',
    what: 'Keeps only the mono-analytic étale-like G_v at each v, forgetting Π_v (the holomorphic structure) and the monoid O▷. D⊢ is bi-coric: it survives both the log-link and the Θ-link, so it is the core at the centre of the étale picture. F ↦ D is bijective on isomorphisms, F⊢ ↦ D⊢ only surjective ([IUTchI] Cor 5.3): a D-prime-strip can be lifted back, a D⊢-prime-strip not uniquely.',
    cells: { Pi: D(), G: K(), units: D(), val: D(), ring: D(), glob: D(), vol: D() },
    cfn: 'iut_prime_strip_forget(…, IUT_PS_DMono)', proc: ['LiftToFrobenioids', 'ForgetLadder', 'CheckBicoric'],
  },
  ForgetToUnitsModTors: {
    group: 'forget', arrow: 'F⊩ ↦ F⊢ ↦ F⊢× ↦ F⊢×μ',
    what: 'Drops the global realified Frobenioid C⊩, the value groups O▶ and the splittings, and keeps G_v ↷ O×μ = O×/O^μ with its ×μ-Kummer structure (an Ism-orbit rather than a unique isomorphism). F⊢×μ is horizontally coric: the Θ×μ-links glue exactly these strips ([IUTchII] Cor 4.10 (iv)). One rung of the forgetful ladder F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢ that ends at the bi-coric core.',
    cells: { Pi: D(), G: K(), units: K('Ism-orbit'), val: D(), ring: D(), glob: D(), vol: D() },
    cfn: 'iut_prime_strip_forget(…, IUT_PS_FMonoUnitsModTors)', proc: ['ForgetLadder', 'LinkThetaUnitsModTors'],
  },
  LogShellConstruction: {
    group: 'shell', arrow: 'F ↦ I = {I_v}',
    what: 'I_v = (p*)⁻¹·log(O×_{K_v}) ⊆ K_v with p* = p for odd p and p* = 4 for p = 2; at an archimedean v the closed disc of radius π. Built from the Frobenius-like units of an F-prime-strip, so it depends on the holomorphic structure and is not coric. Radius (λ − k*·e)/e with λ = ⌊e/(p−1)⌋ + 1; log-volume μ_log(log_p O×) = −(1/e + m/(ef))·log p plus log p* ([IUTchIV] Prop 1.4 (ii)), so an unramified odd place gives I_v = O_v with μ_log = 0.',
    cells: { Pi: K(), G: K(), units: I('log kills μ'), val: D(), ring: D(), glob: D(), vol: K('μ_log') },
    cfn: 'iut_log_shell_make(…, holomorphic) · iut_log_shell_properties', proc: ['MakeLogShells'],
  },
  EtaleLogShellConstruction: {
    group: 'shell', arrow: 'D ↦ I(D),  D⊢ ↦ I(D⊢)',
    what: 'The same shell reconstructed mono-anabelianly from the étale-like data alone: I(D_v) from Π_v, I(D⊢_v) from G_v ([AbsTopIII]). Because it uses only D (vertically coric) or D⊢ (bi-coric), the construction is a core: the four shells I(F), I(F⊢×μ), I(D⊢), I(D) are isomorphic up to the Ism / ±1 indeterminacies ([IUTchIII] Prop 1.2 (vi)–(ix)), which is what lets a shell at (n,◦) be compared across the Θ-link.',
    cells: { Pi: K(), G: K(), units: D('reconstructed'), val: D(), ring: D(), glob: D(), vol: K('μ_log') },
    cfn: 'iut_log_shell_from(…, IUT_SHELL_HOL_D | IUT_SHELL_MONO_DMONO) · iut_log_shell_isomorphic', proc: ['MakeLogShells', 'CheckBicoric'],
  },
  TensorPacketConstruction: {
    group: 'shell', arrow: '{I_t}_{t∈S^±_{j+1}} ↦ ⊗',
    what: 'For the procession S^±_{j+1} = {0, …, j} and v_Q ∈ V_Q: log(^A F_{v_Q}) = ⊗_{α∈A} ⊕_{v|v_Q} log(^α F_v), a direct sum of |V_{v_Q}|^{j+1} finite extensions at a nonarchimedean v_Q, or of 2^j·|V_{v_Q}|^{j+1} copies of C at the archimedean one. Packet-normalized so that the integral structure has log-volume 0; the mono-analytic version I(^A D⊢_{v_Q}) is where the LGP-monoids act (Prop 3.4, 3.5).',
    cells: { Pi: D(), G: K(), units: I('Ism per summand'), val: D(), ring: D(), glob: D(), vol: K('additive') },
    cfn: 'iut_tensor_packet_build · iut_tensor_packet_procession · iut_tensor_packet_localize', proc: ['BuildTensorPackets', 'BuildLGPMonoids'],
  },
  KummerDetachment: {
    group: 'transport', arrow: 'Frobenius-like ↦ étale-like',
    what: 'To compare † and ‡ across a Θ-link, detach the Frobenius-like data from the étale-like data by the Kummer isomorphisms, pass to the bi-coric D⊢-side, transport, re-attach: mono-anabelian transport ([Alien] §2.7, Fig 2.1). The detour costs Ind2 (Ism / Ẑ× on O×μ) and Ind3 (upper semi-compatibility of the log-Kummer correspondence); non-interference, F_mod^× ∩ ∏ O×_v = μ(F_mod) (Prop 3.10), keeps the Kummer theory of F_mod out of the way.',
    cells: { Pi: K('as D-HT'), G: K(), units: I('Ind2'), val: I('Ind3'), ring: D(), glob: D(), vol: K() },
    cfn: 'iut_kummer_non_interference · the stages of p_transport (src/iut_ops_logic.c)', proc: ['TransportMonoAnabelian', 'NormalizeLogVolumes'],
  },
  MultiradialAlgorithm: {
    group: 'transport', arrow: 'Θ-pilot of (0,0) ↦ R^LGP in terms of (1,0)',
    what: 'Describes the Θ-pilot of (0,0) in terms of the mono-analytic data of (1,0): (a) tensor packets of log-shells over S^±_{j+1}, (b) the splitting monoids of the LGP-monoids, (c) the copies (F_mod^×)_j — up to Ind1 (∏_j (j+1)! permutations of the processions, Aut(G_v)), Ind2 (Ism on O×μ) and Ind3. Compatible with the Θ×μ_LGP-link on units, value groups, the D⊢ core and D⊩; Cor 3.12 reads off −|log Θ| ≥ −|log q|.',
    cells: { Pi: D(), G: K(), units: I('Ind2'), val: I('Ind1, Ind3'), ring: D(), glob: I('D⊩ up to R>0'), vol: I('hull') },
    cfn: 'iut_multiradial_build · iut_multiradial_full_build · iut_cor312_steps', proc: ['RepresentMultiradially', 'EstimateLogVolume'],
  },
};
const GROUPS = {
  link: { name: 'link', long: 'links: the arrows of the lattice', series: 1 },
  forget: { name: 'forgetful · core', long: 'forgetful functors (all cores)', series: 5 },
  shell: { name: 'log-shell', long: 'log-shell constructions', series: 6 },
  transport: { name: 'transport', long: 'transport and the multiradial algorithm', series: 4 },
};

const ids = iut(['ids', '--json']);
const procs = iut(['procs', '--json']);
const { species, mutations } = readSpeciesAndMutations();
{
  const a = mutations.map(m => m.id).sort().join(','), b = Object.keys(ANNOTATIONS).sort().join(',');
  if (a !== b) { console.error('iut_mutation_table and ANNOTATIONS disagree:\n  table: ' + a + '\n  notes: ' + b); process.exit(1); }
  const procIds = new Set(procs.map(p => p.id));
  for (const [id, a] of Object.entries(ANNOTATIONS)) for (const p of a.proc) if (!procIds.has(p)) { console.error(`${id}: unknown process ${p}`); process.exit(1); }
  for (const m of mutations) for (const s of [m.from, m.to]) if (!species.find(x => x.id === s)) { console.error(`${m.id}: unknown species ${s}`); process.exit(1); }
  for (const [id, a] of Object.entries(ANNOTATIONS)) for (const c of COLUMNS) if (!a.cells[c.key]) { console.error(`${id}: no cell for ${c.key}`); process.exit(1); }
}

/* the same chip colours as build.js */
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
const kindOf = {}; for (const r of ids) kindOf[r.id] = r.kind;
const famOf = id => KIND_FAMILY[kindOf[id] || 'species'];

/* composable pairs, [IUTchIV] Def 3.3 (i): cod f = dom g */
const composable = [];
for (const f of mutations) for (const g of mutations) if (f.to === g.from) composable.push({ f: f.id, g: g.id, from: f.from, to: g.to, core: f.core && g.core });

const endpointIds = new Set(mutations.flatMap(m => [m.from, m.to]));
const data = {
  species, mutations: mutations.map((m, i) => ({ ...m, n: i + 1, ...ANNOTATIONS[m.id], fam: { from: famOf(m.from), to: famOf(m.to) } })),
  COLUMNS, GROUPS, composable,
  endpoints: [...endpointIds], untouched: species.filter(s => !endpointIds.has(s.id)).map(s => ({ id: s.id, fam: famOf(s.id) })),
  counts: {
    species: species.length, mutations: mutations.length, cores: mutations.filter(m => m.core).length,
    links: mutations.filter(m => ANNOTATIONS[m.id].group === 'link').length,
    forget: mutations.filter(m => ANNOTATIONS[m.id].group === 'forget').length,
    shell: mutations.filter(m => ANNOTATIONS[m.id].group === 'shell').length,
    transport: mutations.filter(m => ANNOTATIONS[m.id].group === 'transport').length,
    endpoints: endpointIds.size, composable: composable.length, procs: new Set(Object.values(ANNOTATIONS).flatMap(a => a.proc)).size,
  },
  generated: new Date().toISOString().slice(0, 10),
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
  const line = (x1, y1, x2, y2, o = {}) => out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}/>`);
  const pathd = (d, o = {}) => out.push(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  const circle = (x, y, r, o = {}) => out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}/>`);
  const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; const bg = [252, 252, 251]; const mix = (c, s) => Math.round(s + (c - s) * a); return `rgb(${mix(r, bg[0])},${mix(g, bg[1])},${mix(b, bg[2])})`; };

  /* word-wrap prose; returns the y after the last line */
  const wrap = (x, y, s, width, o = {}) => {
    const size = o.size || 20, lh = o.lh || size * 1.35; const words = s.split(' '); let cur = '', yy = y, n = 0;
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t, o.font || SANS, size, o.weight) > width && cur) { text(x, yy, cur, o); yy += lh; cur = w; n++; } else cur = t;
    }
    if (cur) { text(x, yy, cur, o); yy += lh; n++; }
    if (o.maxLines && n > o.maxLines) console.warn(`wrap overflow: ${n} lines > ${o.maxLines}: ${s.slice(0, 40)}…`);
    return yy;
  };

  const CHIP = { size: 16, h: 23, padx: 7, gap: 6, vgap: 4 };
  const chipW = (id, size = CHIP.size) => Math.ceil(measure(id, MONO, size)) + CHIP.padx * 2 + 5;
  const chip = (x, y, id, fam, o = {}) => {
    const size = o.size || CHIP.size, h = o.h || CHIP.h, w = chipW(id, size), col = C.series[fam];
    rect(x, y, w, h, { rx: 5, fill: tint(col, o.faint ? 0.07 : 0.13) });
    rect(x, y, 5, h, { rx: 2.5, fill: col, opacity: o.faint ? 0.45 : 1 });
    text(x + 5 + CHIP.padx, y + h / 2 + size * 0.36, id, { font: MONO, size, fill: o.faint ? C.text2 : C.text });
    return w;
  };
  const panel = (x, y, w, h, title, sub, subw) => {
    rect(x, y, w, h, { rx: 14, fill: C.panel });
    text(x + 28, y + 44, title, { size: 30, weight: 600 });
    if (sub) return wrap(x + 28, y + 76, sub, subw || w - 56, { size: 19, fill: C.text2, lh: 25 });
    return y + 76;
  };
  const series = m => m.group === 'link' ? (m.id === 'LogLink' ? C.series[0] : C.series[1]) : m.core ? C.series[5] : m.group === 'shell' ? C.series[6] : C.series[4];
  /* the numbered badge of a mutation */
  const badge = (x, y, m, r = 11) => { circle(x, y, r, { fill: series(m) }); text(x, y + r * 0.42, String(m.n), { size: r * 1.15, weight: 700, fill: '#fff', anchor: 'middle' }); };

  out.push(`<defs>${['arr', 'arrB', 'arrG', 'arrL', 'arrP', 'arrV'].map((id, i) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${[C.text2, C.series[1], C.series[5], C.series[0], C.series[6], C.series[4]][i]}"/></marker>`).join('')}</defs>`);
  const markerOf = m => m.group === 'link' ? (m.id === 'LogLink' ? 'arrL' : 'arrB') : m.core ? 'arrG' : m.group === 'shell' ? 'arrP' : 'arrV';
  rect(0, 0, W, H, { fill: C.surface });
  const byId = {}; for (const m of D.mutations) byId[m.id] = m;
  const spById = {}; for (const s of D.species) spById[s.id] = s;

  /* ================================================================ header */
  text(M, 92, 'The 13 mutations of inter-universal Teichmüller theory', { size: 62, weight: 700 });
  wrap(M, 140,
    `[IUTchIV] §3 calls a type of mathematical object a species and a functor between species a mutation; a mutation-history is an oriented graph with species at its vertices ` +
    `and mutations at its edges, and the log-theta-lattice is the mutation-history that matters. The toolkit implements each of its ${D.counts.species} species as a C struct and each of these ` +
    `${D.counts.mutations} mutations as a C function (iut_mutation_table in src/iut_ids.c, printed by iut species and docs/IDENTIFIERS.md). This page draws the graph they form, ` +
    `what each one carries across — and what it forgets, rebuilds or only keeps up to an indeterminacy — and where each is defined, implemented and demonstrated.`,
    2560, { size: 22, fill: C.text2, lh: 30 });
  const stats = [
    [D.counts.mutations, 'mutations'], [D.counts.species, 'species'], [D.counts.endpoints, 'species as endpoints'], [D.counts.cores, 'cores'],
    [D.counts.links, 'links'], [D.counts.forget, 'forgetful'], [D.counts.shell, 'log-shell steps'], [D.counts.transport, 'transports'],
  ];
  let sx = W - M - stats.length * 136;
  for (const [v, l] of stats) {
    rect(sx, 46, 124, 118, { rx: 12, fill: C.panel });
    text(sx + 62, 112, String(v), { size: 46, weight: 600, anchor: 'middle' });
    text(sx + 62, 146, l, { size: 15, fill: C.text2, anchor: 'middle' });
    sx += 136;
  }

  /* ================================================================ row A */
  const AY = 265, AH = 770;

  /* --- A1: the mutation-history */
  const A1X = M, A1W = 2400;
  panel(A1X, AY, A1W, AH, `The mutation-history: ${D.counts.species} species as vertices, ${D.counts.mutations} mutations as edges`,
    `[IUTchIV] Def 3.3 (iii). Boxes are species (C structs), arrows are mutations (C functions), numbered as in the cards below. ` +
    `The three vertices {n,m}, {n+1,m}, {n,m+1} are the same species: the log-theta-lattice is this graph unrolled over Z², the log-link ① vertical and one of the Θ×μ-links ②–④ horizontal. ` +
    `Green arrows are cores — observables all of whose mutations are isomorphisms, the data that survive a link — and lead to the coric species D⊢, (n,◦)HT^D, F⊢×μ and I(D⊢).`);
  const node = (x, y, w, h, id, notation, famIdx, o = {}) => {
    const col = C.series[famIdx];
    rect(x, y, w, h, { rx: 8, fill: o.strong ? tint(col, 0.22) : tint(col, 0.12), stroke: o.strong ? col : (o.ghost ? col : undefined), sw: o.ghost ? 1 : 2, dash: o.ghost ? '5 4' : undefined });
    rect(x, y, 6, h, { rx: 3, fill: col });
    const two = !!notation;
    text(x + 16, y + (two ? 22 : h / 2 + 6), id, { font: MONO, size: o.idSize || 15, weight: 500 });
    if (notation) text(x + 16, y + h - 11, notation, { font: SYM, size: 13, fill: C.text2 });
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
  };
  const label = (x, y, m, o = {}) => {
    /* a numbered label pill centred at (x,y) */
    const s = o.size || 13, w = measure(m.id, MONO, s) + 10 + 26;
    const lx = o.anchor === 'start' ? x : x - w / 2;
    rect(lx, y - 12, w, 22, { rx: 5, fill: o.fill || C.panel, stroke: series(m), sw: 1 });
    badge(lx + 13, y - 1, m, 9);
    text(lx + 26, y + 4, m.id, { font: MONO, size: s, fill: series(m) });
    return { x: lx, w };
  };
  const arrow = (a, b, m, o = {}) => {
    const x1 = a.r, y1 = o.y1 ?? a.cy, x2 = b.x, y2 = o.y2 ?? b.cy;
    const mx = x1 + (x2 - x1) * (o.bend ?? 0.5);
    pathd(`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`, { stroke: series(m), sw: o.sw || 2, marker: markerOf(m), dash: o.dash });
    if (!o.nolabel) label(o.lx ?? (x1 + x2) / 2, o.ly ?? (y1 + y2) / 2, m);
  };
  const vArrow = (a, b, m, o = {}) => {
    const x = o.x ?? a.cx, y1 = o.up ? a.y : a.b, y2 = o.up ? b.b + 2 : b.y - 2;
    line(x, y1, x, y2, { stroke: series(m), sw: 2, marker: markerOf(m) });
    label(x + (o.side === 'left' ? -14 : 14), (y1 + y2) / 2, m, { anchor: o.side === 'left' ? undefined : 'start', ...(o.side === 'left' ? { anchor: undefined } : {}) });
  };
  const stage = (x, y, w, s) => { text(x, y, s, { size: 15, weight: 600, fill: C.muted, extra: ' letter-spacing="1.5"' }); line(x, y + 8, x + w, y + 8, { stroke: C.line, sw: 1 }); };

  const PY = AY + 150, NW = 290, NH = 54;
  /* lattice corner: Hodge theaters */
  stage(A1X + 28, PY - 22, 900, 'HODGE THEATERS · a corner of the log-theta-lattice   [IUTchI] Def 3.6, 6.13 · [IUTchIII] Def 1.4');
  const nTh = node(A1X + 28, PY + 20, NW, NH, 'ThetaHodgeTheater', '†HT^Θ = (F⊩_mod, F⊩_tht)', 1);
  const nTh2 = node(A1X + 28 + NW + 340, PY + 20, NW, NH, 'ThetaHodgeTheater', '‡HT^Θ  another copy', 1, { ghost: true });
  arrow(nTh, nTh2, byId.ThetaLink);
  const nC = node(A1X + 28, PY + 120, NW, NH, 'ThetaPmEllNFHodgeTheater', '{n,m+1}HT', 1, { ghost: true });
  const nA = node(A1X + 28, PY + 290, NW, NH, 'ThetaPmEllNFHodgeTheater', '{n,m}HT  • one vertex of the lattice', 1, { strong: true });
  const nB = node(A1X + 28 + NW + 340, PY + 290, NW, NH, 'ThetaPmEllNFHodgeTheater', '{n+1,m}HT', 1, { ghost: true });
  vArrow(nA, nC, byId.LogLink, { up: true, x: nA.cx - 40, side: 'right' });
  text(nA.cx - 26, (nC.b + nA.y) / 2 + 26, 'vertical: m ↦ m+1', { size: 13, fill: C.muted });
  /* the three horizontal Θ×μ-links, stacked */
  [['ThetaUnitsModTorsLGPTorsorLink', -24], ['ThetaUnitsModTorsLgpIdealLink', 0], ['ThetaUnitsModTorsGauLink', 24]].forEach(([id, dy]) => {
    const m = byId[id];
    line(nA.r, nA.cy + dy, nB.x - 2, nB.cy + dy, { stroke: series(m), sw: 2, marker: markerOf(m) });
    label((nA.r + nB.x) / 2, nA.cy + dy, m, { size: 12 });
  });
  text((nA.r + nB.x) / 2, nA.b + 40, 'horizontal: n ↦ n+1 — one flavour per lattice', { size: 13, fill: C.muted, anchor: 'middle' });
  const nD = node(A1X + 28, PY + 450, NW, NH, 'DThetaPmEllNFHodgeTheater', '(n,◦)HT^D  vertically coric', 1, { strong: true });
  vArrow(nA, nD, byId.ForgetToD, { x: nA.cx - 40, side: 'right' });
  text(nD.x, nD.b + 24, 'the base categories only: the spoke of the étale picture', { size: 13, fill: C.muted });

  /* prime-strips */
  const S1X = A1X + 1100;
  stage(S1X, PY - 22, 650, 'PRIME-STRIPS   [IUTchI] Def 4.1, 5.2 · [IUTchII] Def 4.9');
  const nFG = node(S1X, PY + 20, NW, NH, 'FMonoGlobPrimeStrip', 'F⊩ = F⊢ + C⊩  Frobenius-like', 0);
  const nF = node(S1X, PY + 170, NW, NH, 'FPrimeStrip', 'F = {Π_v ↷ O▷}  holomorphic', 0);
  const nDs = node(S1X, PY + 320, NW, NH, 'DPrimeStrip', 'D = {Π_v}  étale-like', 0);
  const S2X = S1X + NW + 110;
  const nFU = node(S2X, PY + 20, NW, NH, 'FMonoUnitsModTorsPrimeStrip', 'F⊢×μ  horizontally coric', 0, { strong: true });
  const nDM = node(S2X, PY + 170, NW, NH, 'DMonoPrimeStrip', 'D⊢ = {G_v}  bi-coric', 0, { strong: true });
  arrow(nFG, nFU, byId.ForgetToUnitsModTors, { ly: nFG.y - 14, lx: (nFG.r + nFU.x) / 2 });
  arrow(nF, nDM, byId.ForgetToDMono, { ly: nF.y - 14, lx: (nF.r + nDM.x) / 2 });
  /* KummerDetachment: F⊩ → D-HT, routed under the lattice corner */
  {
    const m = byId.KummerDetachment;
    const x0 = nFG.x, y0 = nFG.cy + 14, x3 = nD.r + 2, y3 = nD.cy;
    pathd(`M${x0},${y0} C${x0 - 180},${y0} ${x3 + 300},${y3} ${x3},${y3}`, { stroke: series(m), sw: 2, marker: markerOf(m), dash: '7 5' });
    label(x3 + 250, y3 - 30, m, { anchor: 'start' });
    text(x3 + 250, y3 - 2, 'detach the Frobenius-like data, transport on the étale side', { size: 12, fill: C.muted });
  }
  /* log-shells and packets */
  stage(S2X, PY + 300 - 22, 300, 'LOG-SHELLS   [IUTchIII] Def 1.1, Prop 3.1');
  const nLS = node(S2X, PY + 320, NW, NH, 'LogShell', 'I_v = (p*)⁻¹ log(O×_{K_v})', 4, { strong: true });
  const nTP = node(S2X, PY + 470, NW, NH, 'TensorPacket', '⊗ of j+1 shells over S^±_{j+1}', 4);
  arrow(nF, nLS, byId.LogShellConstruction, { bend: 0.35, ly: nF.cy + 50, lx: nF.r + 60 });
  arrow(nDs, nLS, byId.EtaleLogShellConstruction, { ly: nDs.cy + 14 + 22, lx: nDs.r + 58 });
  vArrow(nLS, nTP, byId.TensorPacketConstruction, { x: nLS.cx - 60, side: 'right' });
  /* pilots → multiradial representation */
  const S3X = S2X + NW + 120;
  stage(S3X, PY + 300 - 22, A1X + A1W - 28 - S3X, 'THE ESTIMATE   [IUTchIII] Def 3.8, Thm 3.11, Cor 3.12');
  const nTPi = node(S3X, PY + 320, NW, NH, 'ThetaPilot', '{q̲_v^{j²}}_{j=1..l*} at (0,0)', 4, { strong: true });
  const nMR = node(S3X, PY + 470, NW + 50, NH, 'MultiradialRepresentation', 'R^LGP up to Ind1 · Ind2 · Ind3', 4, { strong: true });
  vArrow(nTPi, nMR, byId.MultiradialAlgorithm, { x: nTPi.cx - 60, side: 'right' });
  pathd(`M${nTP.r},${nTP.cy} L${nMR.x - 2},${nMR.cy}`, { stroke: C.muted, sw: 1.4, marker: 'arr', dash: '4 4' });
  text((nTP.r + nMR.x) / 2, nTP.cy - 8, '(a) of Thm 3.11', { size: 12, fill: C.muted, anchor: 'middle' });
  text(nMR.x, nMR.b + 24, '−|log Θ| ≥ −|log q|  (Cor 3.12) → Thm 1.10', { font: SYM, size: 13, fill: C.text2 });
  /* legend + the untouched species */
  let lgx = S3X, lgy = PY + 20;
  text(lgx, lgy, 'arrow colour', { size: 15, weight: 600, fill: C.text2 }); lgy += 22;
  for (const [col, name] of [[C.series[0], 'the log-link'], [C.series[1], 'Θ-type links'], [C.series[5], 'cores (forgetful, étale)'], [C.series[6], 'log-shell constructions'], [C.series[4], 'transport, algorithms']]) {
    line(lgx, lgy - 5, lgx + 26, lgy - 5, { stroke: col, sw: 2.5 }); text(lgx + 34, lgy, name, { size: 14, fill: C.text2 }); lgy += 21;
  }
  lgy += 14;
  text(lgx, lgy, 'box colour = kind of species', { size: 15, weight: 600, fill: C.text2 }); lgy += 22;
  for (const [i, name] of [[0, 'prime-strips'], [1, 'Hodge theaters'], [4, 'log-shells, pilots, the estimate']]) { rect(lgx, lgy - 12, 12, 12, { rx: 2, fill: C.series[i] }); text(lgx + 20, lgy, name, { size: 14, fill: C.text2 }); lgy += 21; }
  /* isolated vertices */
  const UY = AY + AH - 50;
  line(A1X + 28, UY - 26, A1X + A1W - 28, UY - 26);
  text(A1X + 28, UY, `${D.untouched.length} species of the table are vertices that no mutation touches yet:`, { size: 14, fill: C.text2 });
  let ux = A1X + 28 + measure(`${D.untouched.length} species of the table are vertices that no mutation touches yet:`, SANS, 14) + 14;
  for (const s of D.untouched) ux += chip(ux, UY - 16, s.id, s.fam, { size: 13, h: 21, faint: true }) + 6;
  text(A1X + 28, UY + 26, 'They are reached today by the generic prime-strip forgetful functor iut_prime_strip_forget and by the gluing GluingZeroBoxPlusToGt, which the species table does not list as mutations.', { size: 13, fill: C.muted });

  /* --- A2: what each mutation carries across */
  const A2X = A1X + A1W + 40, A2W = W - M - A2X;
  const MX0 = A2X + 28;
  const glyph = (x, y, cell, col) => {
    const r = 9;
    if (cell.s === 'keep') circle(x, y, r, { fill: col });
    else if (cell.s === 'ind') { circle(x, y, r, { fill: 'none', stroke: col, sw: 2 }); pathd(`M${x},${y - r} A${r},${r} 0 0 1 ${x},${y + r} Z`, { fill: col, stroke: 'none' }); }
    else if (cell.s === 'new') circle(x, y, r, { fill: 'none', stroke: col, sw: 2 });
    else line(x - 7, y, x + 7, y, { stroke: C.muted, sw: 2 });
  };
  const subEnd = panel(A2X, AY, A2W, AH, 'What each mutation carries across',
    'At each v ∈ V: the holomorphic base Π_v, the mono-analytic base G_v, the units modulo torsion O×μ, the value groups O▶ and pilots, the ring structures, the global realified Frobenioid C⊩, the log-volumes — ' +
    'read from the flags of iut_link, iut_prime_strip_forget and iut_hodge_theater_to_D.');
  {
    let lx2 = MX0, ly0 = AY + 142;
    for (const [s, t] of [['keep', 'carried over / identified'], ['ind', 'kept up to an indeterminacy (named under the glyph)'], ['new', 'a fresh copy, not identified'], ['drop', 'forgotten or absent']]) {
      glyph(lx2 + 9, ly0 - 5, { s }, C.text2); lx2 += 26 + text(lx2 + 26, ly0, t, { size: 13, fill: C.text2 }) + 22;
    }
  }
  const MX = A2X + 28, MY = subEnd + 34, LW = 400, CW = (A2W - 56 - LW - 70) / D.COLUMNS.length, RH = 36;
  D.COLUMNS.forEach((c, i) => {
    const x = MX + LW + CW * i + CW / 2;
    text(x, MY + 4, c.label, { font: SYM, size: 15, weight: 600, anchor: 'middle' });
    text(x, MY + 20, c.sub, { size: 11, fill: C.muted, anchor: 'middle' });
  });
  text(MX + LW + CW * D.COLUMNS.length + 35, MY + 4, 'core', { size: 15, weight: 600, anchor: 'middle' });
  line(MX, MY + 30, A2X + A2W - 28, MY + 30);
  D.mutations.forEach((m, i) => {
    const y = MY + 42 + i * RH, cy = y + RH / 2 - 2;
    if (i % 2) rect(MX - 8, y, A2W - 56 + 16, RH, { rx: 6, fill: tint(C.text2, 0.045) });
    badge(MX + 12, cy, m, 11);
    text(MX + 32, cy - 2, m.id, { font: MONO, size: 14, weight: 500 });
    text(MX + 32, cy + 14, m.notation + '   ' + m.ref, { font: SYM, size: 11, fill: C.muted });
    D.COLUMNS.forEach((c, k) => {
      const x = MX + LW + CW * k + CW / 2, cell = m.cells[c.key];
      glyph(x, cy - 5, cell, series(m));
      if (cell.n) text(x, cy + 15, cell.n, { size: 10, fill: C.text2, anchor: 'middle' });
    });
    const cx = MX + LW + CW * D.COLUMNS.length + 35;
    if (m.core) { rect(cx - 24, cy - 11, 48, 20, { rx: 10, fill: tint(C.series[5], 0.18) }); text(cx, cy + 4, 'core', { size: 12, weight: 600, fill: C.series[5], anchor: 'middle' }); }
    else text(cx, cy + 4, '·', { size: 14, fill: C.muted, anchor: 'middle' });
  });
  const ly = MY + 42 + D.mutations.length * RH + 28;
  const lyEnd = wrap(MX, ly, 'The pattern is the theory: a Θ-type link keeps G_v ↷ O×μ and dilates the value groups but discards Π_v and the rings; the log-link keeps the bases and rebuilds the monoids; ' +
    'the cores keep only what both kinds of link keep, and the multiradial algorithm reconstructs the Θ-pilot from exactly that intersection, at the price of Ind1–Ind3.', A2W - 56, { size: 13.5, fill: C.text2, lh: 18 });
  if (lyEnd > AY + AH - 10) console.warn('matrix panel overflow: ' + (lyEnd - (AY + AH - 10)) + 'px');

  /* ================================================================ row B: the cards */
  const BY = AY + AH + 25, BH = H - 30 - BY;
  panel(M, BY, W - 2 * M, BH, `The ${D.counts.mutations} mutations, one by one`,
    'Identifier and notation, domain → codomain in the species table, the definition implemented, what is kept (●), kept up to an indeterminacy (◐), rebuilt (○) or forgotten (—), the C function behind it and the processes (iut run <id>) that demonstrate it on actual Θ-data.', 3600);
  const NCOL = 7, GAP = 18, CW2 = (W - 2 * M - 56 - (NCOL - 1) * GAP) / NCOL, CY0 = BY + 92, CH2 = (BY + BH - 16 - CY0 - GAP) / 2;
  const tagPill = (x, y, s, col, right) => { const w = measure(s, SANS, 12, 600) + 16; const lx = right ? x - w : x; rect(lx, y - 14, w, 20, { rx: 10, fill: tint(col, 0.16) }); text(lx + 8, y, s, { size: 12, weight: 600, fill: col }); return w; };
  const card = (x, y, w, h, m) => {
    rect(x, y, w, h, { rx: 10, fill: C.surface, stroke: C.line, sw: 1 });
    rect(x, y, w, 6, { rx: 3, fill: series(m) });
    badge(x + 28, y + 40, m, 14);
    text(x + 50, y + 46, m.id, { font: MONO, size: m.id.length > 26 ? 17 : 19, weight: 600 });
    text(x + 18, y + 80, m.notation, { font: SYM, size: 21, weight: 600 });
    tagPill(x + w - 16, y + 80, D.GROUPS[m.group].name, series(m), true);
    /* domain → codomain */
    let cy = y + 100;
    const fromW = chip(x + 18, cy, m.from, m.fam.from, { size: 14, h: 22 });
    if (m.to === m.from) {
      text(x + 18 + fromW + 10, cy + 16, '→ another copy of the same species', { size: 13, fill: C.text2 });
    } else {
      text(x + 18, cy + 46, '→', { size: 16, fill: C.text2 });
      chip(x + 42, cy + 30, m.to, m.fam.to, { size: 14, h: 22 });
    }
    cy += m.to === m.from ? 30 : 60;
    text(x + 18, cy + 18, m.ref + '  ·  ' + m.arrow, { font: SYM, size: 13, fill: C.text2 });
    if (m.core) tagPill(x + w - 16, cy + 18, 'core', C.series[5], true);
    line(x + 18, cy + 30, x + w - 18, cy + 30);
    /* the C functions (up to two lines) and the processes, anchored at the bottom */
    const cfnLines = (() => {
      const parts = m.cfn.split(' · '), lines = []; let cur = '';
      for (const p of parts) { const t = cur ? cur + ' · ' + p : p; if (cur && measure(t, MONO, 11.5) > w - 36) { lines.push(cur); cur = p; } else cur = t; }
      if (cur) lines.push(cur);
      if (lines.length > 2) console.warn('card overflow (cfn): ' + m.id);
      for (const l of lines) if (measure(l, MONO, 11.5) > w - 36) console.warn('card overflow (cfn line): ' + m.id);
      return lines;
    })();
    const footH = 20 + cfnLines.length * 15 + 19;
    line(x + 18, y + h - footH, x + w - 18, y + h - footH);
    cfnLines.forEach((l, k) => text(x + 18, y + h - footH + 17 + k * 15, l, { font: MONO, size: 11.5, fill: C.text2 }));
    text(x + 18, y + h - 11, 'iut run ' + m.proc.join(' · '), { font: MONO, size: 11.5, fill: C.series[6] });
    if (measure('iut run ' + m.proc.join(' · '), MONO, 11.5) > w - 36) console.warn('card overflow (proc): ' + m.id);
    /* carries / forgets: one wrapped line per state, anchored above the footer */
    const rows = [['keep', '●'], ['ind', '◐'], ['new', '○'], ['drop', '—']].map(([s, g]) => {
      const items = D.COLUMNS.filter(c => m.cells[c.key].s === s).map(c => c.label + (m.cells[c.key].n ? ' (' + m.cells[c.key].n + ')' : ''));
      return items.length ? { s, g, str: items.join(' · ') } : null;
    }).filter(Boolean);
    const RLH = 17, GW = 18, lineCount = str => { let n = 1, cur = ''; for (const wd of str.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (measure(t, SYM, 12.5) > w - 36 - GW && cur) { n++; cur = wd; } else cur = t; } return n; };
    const blockH = rows.reduce((a, r) => a + lineCount(r.str) * RLH, 0);
    let ky = y + h - footH - 10 - blockH + 12;
    const descEnd = wrap(x + 18, cy + 50, m.what, w - 36, { size: 14, fill: C.text, lh: 18.6 });
    if (descEnd - 6 > ky - 14) console.warn(`card overflow (description): ${m.id} by ${(descEnd - (ky - 14)).toFixed(0)}px`);
    for (const r of rows) {
      text(x + 18, ky, r.g, { font: SYM, size: 13, weight: 600, fill: r.s === 'drop' ? C.muted : series(m) });
      ky = wrap(x + 18 + GW, ky, r.str, w - 36 - GW, { font: SYM, size: 12.5, fill: r.s === 'drop' ? C.muted : C.text2, lh: RLH });
    }
  };
  D.mutations.forEach((m, i) => {
    const col = i % NCOL, row = Math.floor(i / NCOL);
    card(M + 28 + col * (CW2 + GAP), CY0 + row * (CH2 + GAP), CW2, CH2, m);
  });
  /* the definitions card in the free slot */
  {
    const x = M + 28 + 6 * (CW2 + GAP), y = CY0 + CH2 + GAP, w = CW2, h = CH2;
    rect(x, y, w, h, { rx: 10, fill: tint(C.series[5], 0.08), stroke: C.line, sw: 1 });
    rect(x, y, w, 6, { rx: 3, fill: C.series[5] });
    text(x + 18, y + 44, 'Species, mutations, histories', { size: 19, weight: 600 });
    text(x + 18, y + 66, '[IUTchIV] Def 3.1, Def 3.3 — iut run OperateSpecies', { font: SYM, size: 13, fill: C.text2 });
    let dy = y + 96;
    const defs = [
      ['Species', 'a set-theoretic formula Φ₀ defining a type of object; isomorphic iff the formulas agree (Def 3.1 (iv))'],
      ['Mutation', 'a species-theoretic functor; identities, composition f then g when cod f = dom g (Def 3.3 (i)); a MorphismOfMutations is a natural transformation (ii)'],
      ['MutationHistory', 'an oriented graph Γ, species at vertices, mutations at edges: the lattice (iii)'],
      ['Observable', 'a compatible family of mutations S_v → S_obs over Γ (iv)'],
      ['Core', 'an observable all of whose mutations are isomorphisms: coric data (v)'],
    ];
    for (const [id, t] of defs) {
      const cw = chip(x + 18, dy - 15, id, 5, { size: 13, h: 21 });
      dy = wrap(x + 18 + cw + 8, dy, t, w - 36 - cw - 8, { size: 12.5, fill: C.text2, lh: 15.5 }) + 5;
    }
    line(x + 18, dy - 2, x + w - 18, dy - 2); dy += 18;
    text(x + 18, dy, 'What the toolkit computes with them', { size: 14, weight: 600 }); dy += 20;
    const pick = (f, g) => D.composable.find(c => c.f === f && c.g === g);
    const ex = [pick('LogLink', 'ForgetToD'), pick('EtaleLogShellConstruction', 'TensorPacketConstruction')].filter(Boolean);
    if (ex.length < 2) ex.push(...D.composable.filter(c => c.f !== c.g && !ex.includes(c)).slice(0, 2 - ex.length));
    dy = wrap(x + 18, dy, `Composition: ${D.counts.composable} composable pairs in the table (cod f = dom g), core iff both are, e.g. ` +
      ex.map(c => `${c.f} then ${c.g}: ${c.from} → ${c.to}${c.core ? ' (core)' : ''}`).join('; ') + '.', w - 36, { size: 12.5, fill: C.text2, lh: 15.5 }) + 5;
    dy = wrap(x + 18, dy, 'Identities are cores. The infinite H as a mutation-history: (0,m) →log (0,m+1), (1,m) →log (1,m+1), (0,0) →Θ (1,0). ' +
      'Coric species: DMonoPrimeStrip, DThetaPmEllNFHodgeTheater, FMonoUnitsModTorsPrimeStrip, LogShell, and every codomain of a core.', w - 36, { size: 12.5, fill: C.text2, lh: 15.5 });
    if (dy > y + h - 10) console.warn('definitions card overflow: ' + (dy - (y + h - 10)) + 'px');
  }

  /* footer */
  text(W - M, H - 12, `oneman/motizukipdf · docs/IDENTIFIERS.md §Species and mutations · generated ${D.generated} by scripts/infographic/mutations.js from src/iut_ids.c, iut ids --json and iut procs --json`, { size: 14, fill: C.muted, anchor: 'end' });
  text(M, H - 12, `${D.counts.mutations} mutations: ${D.counts.links} links · ${D.counts.forget} forgetful · ${D.counts.shell} log-shell · ${D.counts.transport} transport — ${D.counts.cores} cores · ${D.counts.endpoints} of ${D.counts.species} species as endpoints · demonstrated by ${D.counts.procs} processes`, { size: 14, fill: C.muted });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<title>The 13 mutations of inter-universal Teichmüller theory — docs/IDENTIFIERS.md</title>
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
    <div style="font-family:'JetBrains Mono'">x</div><div style="font-family:'JetBrains Mono';font-weight:500">x</div><div style="font-family:'JetBrains Mono';font-weight:600">x</div><div style="font-family:'DejaVu Sans'">⊢⊩▶⊞⊚⊛⋊</div></body></html>`);
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
