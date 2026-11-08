#!/usr/bin/env node
/*
 * scripts/infographic/initialtheta-data.js — worked examples of initial Θ-data, computed exactly.
 *
 *   node scripts/infographic/initialtheta-data.js   → docs/initial-theta-data/<id>.json (one per example)
 *                                                    docs/initial-theta-data/index.json
 *   require('./initialtheta-data.js').build()        → the same objects, for the infographic
 *
 * Initial Θ-data ([IUTchI] Def 3.1) is the tuple (F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲). This script
 * builds it for a few elliptic curves over Q, following the recipe of [IUTchIV] Thm 1.10 for F:
 *
 *   1. the curve:      a Weierstrass model [a1,a2,a3,a4,a6], its b- and c-invariants, Δ and j (exact BigInt)
 *   2. F_mod = Q(j)    = Q, since j ∈ Q
 *   3. the places:     ord_p(j) < 0  ⇔  potentially multiplicative reduction at p; then ord_p(q_p) = −ord_p(j),
 *                      and the Tate parameter q_p is computed p-adically by inverting j = 1/q + 744 + 196884 q + …
 *   4. V^bad_mod       = the odd primes with ord_p(j) < 0 (must be non-empty)
 *   5. F               = Q(√−1, E[2·3·5]); Gal(F/F_tpd) ⊆ {±1} × GL2(F_3) × GL2(F_5), so [F:Q] | 6·2·48·480
 *                        has no prime factor ≥ 7, and by Raynaud's criterion E has stable reduction over F
 *   6. l               the smallest prime ≥ 5 with: l ≠ 5 (E[5] ⊆ E(F)), l ∉ V^bad_mod, l ∤ ord(q_v),
 *                      and Im(G_Q → GL2(F_l)) ⊇ SL2(F_l), proved by Serre's criterion from Frobenius traces a_p
 *   7. K = F(E[l]), C̲_K, V, ε̲, the label sets — and the conditions (a)–(f) with how each one is met
 *
 * Every number is computed here from the integers of the input; nothing is typed in by hand
 * except the input itself. The abc examples are also run through the toolkit (iut validate,
 * iut gen --json, iut run CheckDefThreeOne) and its verdict is stored next to ours.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BIN = path.join(ROOT, 'src', 'iut');
const OUT_DIR = path.join(ROOT, 'docs', 'initial-theta-data');

/* ------------------------------------------------------------ the inputs */
const EXAMPLES = [
  { id: 'frey-1-8-9', title: '1 + 8 = 9', kind: 'abc', abc: [1n, 8n, 9n],
    blurb: 'the smallest abc hit, c > rad(abc) = 6' },
  { id: 'frey-1-2400-2401', title: '1 + 2400 = 2401', kind: 'abc', abc: [1n, 2400n, 2401n],
    blurb: '1 + 2⁵·3·5² = 7⁴: four bad primes, and 2 is bad too' },
  { id: 'frey-2-6436341-6436343', title: '2 + 3¹⁰·109 = 23⁵', kind: 'abc', abc: [2n, 6436341n, 6436343n],
    blurb: 'Reyssat\'s triple, the highest known abc quality 1.6299' },
  { id: 'curve-11a1', title: 'the curve 11a1', kind: 'weierstrass', model: [0n, -1n, 1n, -10n, -20n],
    blurb: 'given by its equation; conductor 11, the smallest over Q' },
];
const L_CANDIDATES = [5, 7, 11, 13, 17, 19, 23];
const WITNESS_BOUND = 3000;     // search Frobenius witnesses among good primes p < this
const QADIC_DIGITS = 8;         // base-p digits of the unit part of q_v

/* ------------------------------------------------------------ BigInt arithmetic */
const abs = x => (x < 0n ? -x : x);
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
const mod = (a, m) => ((a % m) + m) % m;
function powmod(b, e, m) { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }
function invmod(a, m) {          // a⁻¹ mod m, gcd(a, m) = 1
  let [r0, r1, s0, s1] = [mod(a, m), m, 1n, 0n];
  while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  if (r0 !== 1n) throw new Error('not invertible');
  return mod(s0, m);
}
function isProbablePrime(n) {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) { if (n === p) return true; if (n % p === 0n) return false; }
  let d = n - 1n, s = 0; while (!(d & 1n)) { d >>= 1n; s++; }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    let x = powmod(a, d, n); if (x === 1n || x === n - 1n) continue;
    let comp = true; for (let i = 1; i < s; i++) { x = x * x % n; if (x === n - 1n) { comp = false; break; } }
    if (comp) return false;
  }
  return true;
}
function rho(n) {               // a non-trivial factor of the composite n (Pollard–Brent)
  if (!(n & 1n)) return 2n;
  for (let c = 1n; ; c++) {
    let x = 2n, y = 2n, d = 1n; const f = v => (v * v + c) % n;
    while (d === 1n) { x = f(x); y = f(f(y)); d = gcd(x - y, n); }
    if (d !== n) return d;
  }
}
function iroot(n, k) {          // ⌊n^{1/k}⌋
  let x = BigInt(Math.ceil(Math.pow(Number(n), 1 / k))) + 2n;
  for (;;) { const y = ((BigInt(k) - 1n) * x + n / x ** BigInt(k - 1)) / BigInt(k); if (y >= x) break; x = y; }
  while (x ** BigInt(k) > n) x--; while ((x + 1n) ** BigInt(k) <= n) x++;
  return x;
}
function perfectPower(n) { for (let k = 7; k >= 2; k--) { const r = iroot(n, k); if (r > 1n && r ** BigInt(k) === n) return { r, k }; } return null; }
function factor(n) {            // Map prime → exponent of |n|
  n = abs(n); const out = new Map(); const add = (p, k = 1) => out.set(p, (out.get(p) || 0) + k);
  for (let p = 2n; p < 10000n && p * p <= n; p += (p === 2n ? 1n : 2n)) while (n % p === 0n) { add(p); n /= p; }
  const stack = n > 1n ? [n] : [];
  while (stack.length) {
    const m = stack.pop(); if (m === 1n) continue;
    if (isProbablePrime(m)) { add(m); continue; }
    const pw = perfectPower(m);                    // c4³ makes cubes common; rho is slow on p^k
    if (pw) { for (let i = 0; i < pw.k; i++) stack.push(pw.r); continue; }
    const d = rho(m); stack.push(d, m / d);
  }
  return new Map([...out.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
}
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const sup = k => String(k).split('').map(c => SUP[c]).join('');
const fmtFactors = (m, sign = 1n) => (sign < 0n ? '−' : '') + ([...m.entries()].map(([p, k]) => (k === 1 ? `${p}` : `${p}${sup(k)}`)).join('·') || '1');
const ordp = (n, p) => { let k = 0; n = abs(n); if (n === 0n) return Infinity; while (n % p === 0n) { n /= p; k++; } return k; };

/* ------------------------------------------------------------ the curve */
function invariants([a1, a2, a3, a4, a6]) {
  const b2 = a1 * a1 + 4n * a2, b4 = 2n * a4 + a1 * a3, b6 = a3 * a3 + 4n * a6;
  const b8 = a1 * a1 * a6 + 4n * a2 * a6 - a1 * a3 * a4 + a2 * a3 * a3 - a4 * a4;
  const c4 = b2 * b2 - 24n * b4, c6 = -b2 * b2 * b2 + 36n * b2 * b4 - 216n * b6;
  const disc = -b2 * b2 * b8 - 8n * b4 * b4 * b4 - 27n * b6 * b6 + 9n * b2 * b4 * b6;
  if (1728n * disc !== c4 ** 3n - c6 ** 2n) throw new Error('invariants inconsistent');
  let jn = c4 ** 3n, jd = disc; const g = gcd(jn, jd); jn /= g; jd /= g; if (jd < 0n) { jn = -jn; jd = -jd; }
  return { b2, b4, b6, b8, c4, c6, disc, jn, jd };
}
const equation = ([a1, a2, a3, a4, a6]) => {
  const t = (c, s, first) => (c === 0n ? '' : `${c < 0n ? (first ? '−' : ' − ') : first ? '' : ' + '}${abs(c) === 1n && s ? '' : abs(c)}${s}`);
  const lhs = 'y²' + t(a1, 'xy') + t(a3, 'y');
  const rhs = 'x³' + t(a2, 'x²') + t(a4, 'x') + t(a6, '');
  return `${lhs} = ${rhs}`;
};

/* a_p = p + 1 − #E(F_p) for odd p ∤ Δ, via y'² = 4x³ + b2x² + 2b4x + b6 (small p: plain Numbers) */
function ap(I, p) {
  const P = BigInt(p), r = v => Number(mod(v, P));
  const B2 = r(I.b2), B4 = r(2n * I.b4), B6 = r(I.b6);
  const isSq = new Int8Array(p).fill(-1); isSq[0] = 0; for (let y = 1; y < p; y++) isSq[(y * y) % p] = 1;
  let s = 0;
  for (let x = 0; x < p; x++) { const x2 = (x * x) % p; s += isSq[((4 * x2 % p) * x + B2 * x2 + B4 * x + B6) % p]; }
  return -s;
}
const primesUpTo = n => { const s = new Uint8Array(n + 1), r = []; for (let i = 2; i <= n; i++) if (!s[i]) { r.push(i); for (let j = i * i; j <= n; j += i) s[j] = 1; } return r; };
const PRIMES = primesUpTo(WITNESS_BOUND);

/* Serre's criterion ([Serre 1972] §2.8 Prop 19), l ≥ 5: a subgroup G ⊆ GL2(F_l) contains SL2(F_l) if it has
 *   s   with tr ≠ 0 and tr² − 4det a non-zero square      (not in a non-split Cartan or its normalizer)
 *   s′  with tr ≠ 0 and tr² − 4det a non-square           (not in a Borel, a split Cartan or its normalizer)
 *   s″  with u = tr²/det ∉ {0,1,2,4} and u² − 3u + 1 ≠ 0  (projective order ∉ {1,…,5}: not A4, S4, A5)
 * Frob_p for p ∤ lΔ has trace a_p and determinant p.                                              */
function serreWitnesses(I, l, aps) {
  const L = l, sq = v => { v = ((v % L) + L) % L; if (v === 0) return 0; let r = 1; for (let i = 0; i < (L - 1) / 2; i++) r = r * v % L; return r === 1 ? 1 : -1; };
  const inv = v => { for (let i = 1; i < L; i++) if ((v * i) % L === 1) return i; return 0; };
  const W = { s: null, sPrime: null, sDouble: null };
  for (const [p, a] of aps) {
    if (p === l) continue;
    const t = ((a % L) + L) % L, d = p % L, disc = ((t * t - 4 * d) % L + L) % L, u = (t * t * inv(d)) % L;
    const row = { p, ap: a, trace: t, det: d, disc, u };
    if (!W.s && t !== 0 && disc !== 0 && sq(disc) === 1) W.s = row;
    if (!W.sPrime && t !== 0 && sq(disc) === -1) W.sPrime = row;
    if (!W.sDouble && ![0, 1, 2, 4].includes(u) && (u * u - 3 * u + 1) % L !== 0) W.sDouble = row;
    if (W.s && W.sPrime && W.sDouble) break;
  }
  W.proved = !!(W.s && W.sPrime && W.sDouble);
  return W;
}

/* ------------------------------------------------------------ the Tate parameter q_v, p-adically */
/* j(q) = 1/q + 744 + 196884q + … = E4³/Δ with E4 = 1 + 240Σσ3(n)qⁿ, Δ = qΠ(1−qⁿ)²⁴.  With x = 1/j,
 * q = x + 744x² + 750420x³ + 872769632x⁴ + … (series reversion; integer coefficients).            */
const NSER = 16;
function jSeries() {            // coefficients c[k] of q·j(q) = Σ c[k] q^k
  const N = NSER + 2;
  const E4 = Array(N).fill(0n); E4[0] = 1n;
  for (let n = 1; n < N; n++) { let s = 0n; for (let d = 1; d <= n; d++) if (n % d === 0) s += BigInt(d) ** 3n; E4[n] = 240n * s; }
  const mul = (A, B) => { const C = Array(N).fill(0n); for (let i = 0; i < N; i++) if (A[i]) for (let j = 0; i + j < N; j++) C[i + j] += A[i] * B[j]; return C; };
  let P = Array(N).fill(0n); P[0] = 1n;                       // Π(1−qⁿ)²⁴
  for (let n = 1; n < N; n++) for (let r = 0; r < 24; r++) { const Q = P.slice(); for (let i = N - 1; i >= n; i--) Q[i] -= P[i - n]; P = Q; }
  const E43 = mul(mul(E4, E4), E4);
  const Pinv = Array(N).fill(0n); Pinv[0] = 1n;              // 1/Π(1−qⁿ)²⁴, integer since P[0] = 1
  for (let i = 1; i < N; i++) { let s = 0n; for (let k = 1; k <= i; k++) s += P[k] * Pinv[i - k]; Pinv[i] = -s; }
  return mul(E43, Pinv);                                      // q·j = E4³/Π
}
function qOfX() {               // b[k]: q = Σ_{k≥1} b[k] x^k with x = 1/j
  /* x = 1/j = q / (q·j) = q·g(q), g = 1/(q·j) power series; revert by fixed point q = x / g(q) */
  const c = jSeries(), N = NSER;
  const g = Array(N).fill(0n); g[0] = 1n;                     // 1/(Σ c_k q^k), c_0 = 1
  for (let i = 1; i < N; i++) { let s = 0n; for (let k = 1; k <= i; k++) s += c[k] * g[i - k]; g[i] = -s; }
  /* q(x) = x·h(x), h = 1/g(q(x)); iterate */
  let q = Array(N).fill(0n); q[1] = 1n;
  const mul = (A, B) => { const C = Array(N).fill(0n); for (let i = 0; i < N; i++) if (A[i]) for (let j = 0; i + j < N; j++) C[i + j] += A[i] * B[j]; return C; };
  for (let it = 0; it < N; it++) {
    let gq = Array(N).fill(0n), pw = Array(N).fill(0n); pw[0] = 1n;
    for (let k = 0; k < N; k++) { for (let i = 0; i < N; i++) gq[i] += g[k] * pw[i]; pw = mul(pw, q); }
    const inv = Array(N).fill(0n); inv[0] = 1n;
    for (let i = 1; i < N; i++) { let s = 0n; for (let k = 1; k <= i; k++) s += gq[k] * inv[i - k]; inv[i] = -s; }
    const nq = Array(N).fill(0n); for (let i = 1; i < N; i++) nq[i] = inv[i - 1];
    q = nq;
  }
  return { c, b: q };
}
const QSER = qOfX();
if (QSER.c[1] !== 744n || QSER.c[2] !== 196884n || QSER.b[2] !== 744n || QSER.b[3] !== 750420n || QSER.b[4] !== 872769632n)
  throw new Error('j-series / reversion self-check failed');

/* q_p = p^m · u with m = −ord_p(j) > 0; returns u mod p^D as base-p digits */
function tateParameter(jn, jd, p, D) {
  const P = BigInt(p), m = ordp(jd, P) - ordp(jn, P);
  /* x = 1/j = jd/jn = p^m · ξ, ξ a p-adic unit; q = Σ b_k x^k = p^m · Σ b_k p^{m(k−1)} ξ^k */
  const mod_ = P ** BigInt(D);
  const xn = jd / P ** BigInt(ordp(jd, P)), xd = jn / P ** BigInt(ordp(jn, P));
  const xi = mod(xn * invmod(xd, mod_), mod_);
  let u = 0n;
  for (let k = 1; k < NSER; k++) {
    if (m * (k - 1) >= D) break;
    u = mod(u + QSER.b[k] * P ** BigInt(m * (k - 1)) * powmod(xi, BigInt(k), mod_), mod_);
  }
  /* self-check: j(q) = j, i.e. ξ · Σ c_k p^{mk} u^k ≡ u  (mod p^D) */
  let S = 0n;
  for (let k = 0; k < NSER; k++) { if (m * k >= D) break; S = mod(S + QSER.c[k] * P ** BigInt(m * k) * powmod(u, BigInt(k), mod_), mod_); }
  if (mod(xi * S - u, mod_) !== 0n) throw new Error(`Tate parameter self-check failed at p = ${p}`);
  const digits = []; let t = u; for (let i = 0; i < D; i++) { digits.push(Number(t % P)); t /= P; }
  return { ord: m, unitModPD: u.toString(), precision: D, digits };
}

/* ------------------------------------------------------------ the 2-division field F_tpd = Q(E[2]) */
function tripodalDegree(model, I, frey) {
  if (frey) return { degree: 1, why: 'the Frey curve has all three 2-torsion points (0,0), (a,0), (−b,0) rational' };
  /* 2-division polynomial ψ(x) = 4x³ + b2x² + 2b4x + b6; rational roots r/s with s | 4 */
  const f = x => 4n * x * x * x + I.b2 * x * x + 2n * I.b4 * x + I.b6;
  const roots = []; const divs = n => { const out = []; n = abs(n); for (let d = 1n; d * d <= n; d++) if (n % d === 0n) out.push(d, n / d); return out; };
  if (I.b6 !== 0n && abs(I.b6) < 10n ** 12n)
    for (const r of divs(I.b6)) for (const s of [1n, 2n, 4n]) for (const sg of [1n, -1n]) {
      const R = sg * r; if (4n * R * R * R + I.b2 * R * R * s + 2n * I.b4 * R * s * s + I.b6 * s * s * s === 0n && !roots.some(([a, b]) => a * s === b * R)) roots.push([R, s]);
    }
  void f;
  const discSquare = (() => { if (I.disc < 0n) return false; let r = BigInt(Math.floor(Math.sqrt(Number(I.disc)))); while (r * r > I.disc) r--; while ((r + 1n) * (r + 1n) <= I.disc) r++; return r * r === I.disc; })();
  if (roots.length === 0) return { degree: discSquare ? 3 : 6, why: `ψ₂ = 4x³ ${I.b2 < 0n ? '−' : '+'} ${abs(I.b2)}x² ${I.b4 < 0n ? '−' : '+'} ${abs(2n * I.b4)}x ${I.b6 < 0n ? '−' : '+'} ${abs(I.b6)} has no rational root, and Δ = ${I.disc} is ${discSquare ? '' : 'not '}a square, so Gal(Q(E[2])/Q) ≅ ${discSquare ? 'A3' : 'S3'}` };
  if (roots.length >= 3) return { degree: 1, why: 'all three roots of ψ₂ are rational' };
  return { degree: 2, why: 'ψ₂ has exactly one rational root and an irreducible quadratic factor' };
}

/* ------------------------------------------------------------ one example */
function buildExample(ex) {
  let model, frey = null;
  if (ex.kind === 'abc') {
    const [a, b, c] = ex.abc;
    if (a + b !== c || gcd(a, b) !== 1n) throw new Error('not a coprime abc triple');
    model = [0n, b - a, 0n, -a * b, 0n];       // y² = x(x − a)(x + b)
    frey = { a, b, c, rad: [...factor(a * b * c).keys()].reduce((x, y) => x * y, 1n) };
    frey.quality = Math.log(Number(c)) / Math.log(Number(frey.rad));
  } else model = ex.model;
  const I = invariants(model);
  const jnF = factor(I.jn), jdF = factor(I.jd), dF = factor(I.disc);
  const badSet = new Set([...dF.keys()]);
  /* every prime where something happens: divisors of Δ, the primes 2, 3, 5 of F, and the candidate l's */
  const special = new Set([2n, 3n, 5n, ...dF.keys()]);
  const places = [];
  for (const P of [...special].sort((x, y) => (x < y ? -1 : 1))) {
    const oj = ordp(I.jn, P) - ordp(I.jd, P);
    const pot = oj < 0 ? 'multiplicative' : 'good';
    const overQ = !badSet.has(P) ? 'good' : oj >= 0 ? 'additive (potentially good)' : I.c4 % P !== 0n ? 'multiplicative' : 'additive (potentially multiplicative: a quadratic twist is multiplicative)';
    const p = Number(P);
    places.push({ name: `v${p}`, kind: 'VNon', p, ordDelta: dF.get(P) || 0, ordJ: oj, reductionOverQ: overQ, reductionOverF: pot,
      ordQ: oj < 0 ? -oj : 0, inVbadMod: oj < 0 && p % 2 === 1,
      ...(oj < 0 ? { tateParameter: tateParameter(I.jn, I.jd, p, QADIC_DIGITS) } : {}) });
  }
  places.push({ name: 'vinf', kind: 'VArc', p: 0, reductionOverF: 'archimedean', inVbadMod: false });
  const vbad = places.filter(v => v.inVbadMod);
  const bad2 = places.find(v => v.p === 2 && v.ordJ < 0);

  /* Frobenius traces at good primes, computed on demand and cached */
  const apCache = [];
  const aps = { *[Symbol.iterator]() {
    let i = 0;
    for (const p of PRIMES) {
      if (p < 3 || badSet.has(BigInt(p))) continue;
      if (i === apCache.length) { const a = ap(I, p); if (a * a > 4 * p) throw new Error(`Hasse bound violated at ${p}`); apCache.push([p, a]); }
      yield apCache[i++];
    }
  } };

  /* the sieve for l */
  const sieve = L_CANDIDATES.map(l => {
    const reasons = [], short = [];
    if (l === 5) { reasons.push('F ⊇ Q(E[5]) acts trivially on E[5], so the image cannot contain SL2(F_5)'); short.push('E[5] ⊆ E(F)'); }
    if (vbad.some(v => v.p === l)) { reasons.push(`l = ${l} is a residue characteristic of V^bad_mod`); short.push(`${l} ∈ V^bad_mod`); }
    for (const v of vbad) if (v.ordQ % l === 0) { reasons.push(`l divides ord(q_${v.p}) = ${v.ordQ}`); short.push(`${l} | ord q_${v.p} = ${v.ordQ}`); }
    let W = null;
    if (!reasons.length) { W = serreWitnesses(I, l, aps); if (!W.proved) { reasons.push(`no Serre witnesses among good p < ${WITNESS_BOUND}`); short.push('SL2 unproved'); } }
    return { l, ok: reasons.length === 0, reasons, short, serre: W };
  });
  const pick = sieve.find(s => s.ok);
  if (!pick) throw new Error('no l found');
  const l = pick.l, lstar = (l - 1) / 2, lpm = (l + 1) / 2;
  const lUnramified = !badSet.has(BigInt(l)) && ![2, 3, 5].includes(l);
  const GL2 = BigInt(l) * BigInt(l - 1) ** 2n * BigInt(l + 1), SL2 = BigInt(l) * BigInt(l * l - 1);
  const tpd = tripodalDegree(model, I, !!frey);
  const FoverTpd = 2 * 48 * 480;       // |{±1} × GL2(F_3) × GL2(F_5)|
  const Fdiv = tpd.degree * FoverTpd;

  const logq = vbad.reduce((s, v) => s + v.ordQ * Math.log(v.p), 0);
  const logf = vbad.reduce((s, v) => s + Math.log(v.p), 0);
  const hj = Math.log(Math.max(Number(abs(I.jn)), Number(abs(I.jd))));   // Weil height of j ∈ Q
  const Fl = Array.from({ length: l }, (_, i) => i - lstar);

  const D = {
    schema: 'iut-initial-theta-data/1',
    id: ex.id, title: ex.title, blurb: ex.blurb,
    reference: '[IUTchI] Def 3.1 (a)–(f); F chosen as in [IUTchIV] Thm 1.10',
    tuple: '(F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲)',
    input: frey ? { kind: 'abc triple → Frey curve', a: String(frey.a), b: String(frey.b), c: String(frey.c),
      rad: String(frey.rad), quality: +frey.quality.toFixed(4), factored: { a: fmtFactors(factor(frey.a)), b: fmtFactors(factor(frey.b)), c: fmtFactors(factor(frey.c)) } }
      : { kind: 'Weierstrass equation', model: model.map(String) },
    curve: {
      equation: equation(model), model: model.map(String),
      b2: String(I.b2), b4: String(I.b4), b6: String(I.b6), b8: String(I.b8), c4: String(I.c4), c6: String(I.c6),
      discriminant: String(I.disc), discriminantFactored: fmtFactors(dF, I.disc),
      j: { num: String(I.jn), den: String(I.jd), factored: `${fmtFactors(jnF, I.jn)} / ${fmtFactors(jdF)}`, value: Number(I.jn) / Number(I.jd), weilHeight: +hj.toFixed(6) },
      check: '1728·Δ = c4³ − c6²',
    },
    Fmod: { field: 'Q', degree: 1, why: 'F_mod is the field of moduli Q(j) of X_F, and j ∈ Q' },
    Ftpd: { field: 'Q(E[2])', degree: tpd.degree, why: tpd.why },
    F: {
      field: 'F = Q(√−1, E[2·3·5]) = F_tpd(√−1, E[3·5])', FBar: 'an algebraic closure Q̄ of Q (hence of F)',
      degreeDivides: Fdiv, degreeDividesFactored: fmtFactors(factor(BigInt(Fdiv))),
      why: `Gal(F/F_tpd) embeds in {±1} × GL2(F_3) × GL2(F_5), of order 2·48·480 = ${FoverTpd}; [F_tpd:Q] = ${tpd.degree}`,
      galoisOverFmod: true, degreePrimeToL: Fdiv % l !== 0, containsSqrtMinus1: true, sixTorsionRational: true,
      stableReduction: 'Raynaud: E[3] ⊆ E(F) ⇒ semistable at every v ∤ 3, E[5] ⊆ E(F) ⇒ semistable at every v ∤ 5',
    },
    X_F: { definition: 'X_F = E_F ∖ {origin}', type: '(1,1)', C_F: 'C_F = X_F / ⟨−1⟩, type (1,1)±', E_F: equation(model) + ', base-changed to F' },
    l: {
      value: l, lStar: lstar, lPm: lpm, sieve: sieve.map(s => ({ l: s.l, ok: s.ok, reasons: s.reasons, short: s.short })),
      SL2: { criterion: 'Serre 1972 §2.8 Prop 19: elements s, s′, s″ in the image force it to contain SL2(F_l)', ...pick.serre,
        overF: `[F:Q] | ${Fdiv} is prime to l, so Im(G_F) is normal of index prime to l in Im(G_Q) ⊇ SL2(F_l), hence also ⊇ SL2(F_l)` },
    },
    K: {
      field: `K = F(E[${l}])`, galoisOverF: true,
      degreeOverF: lUnramified ? String(GL2) : `between ${SL2} and ${GL2}`,
      degreeOverFFactored: lUnramified ? `${l}·${l - 1}²·${l + 1} = |GL2(F_${l})|` : `|SL2(F_${l})| ≤ [K:F] ≤ |GL2(F_${l})|`,
      why: lUnramified ? `F is unramified at ${l} (ramified only over 2, 3, 5 and the primes of Δ), so F ∩ Q(μ_${l}) = Q and det = cyclotomic character is onto F_${l}^×`
        : 'Im ⊇ SL2(F_l); the determinant part depends on F ∩ Q(μ_l)',
      degreeOverQAtMost: String(GL2 * BigInt(Fdiv)),
    },
    C_K: {
      type: '(1, l-tors)±', XUnderK: `X̲_K of type (1, l-tors): the Z/${l}-cover of X_K cut out by a surjection E[${l}] ↠ Q ≅ Z/${l}Z`,
      choices: l + 1, why: `the kernel of E[${l}] ↠ Q is one of the ${l + 1} lines of E[${l}] ≅ F_${l}²; all are K-rational because K = F(E[${l}])`,
      cuspsXUnder: l, cuspsCUnder: lpm, cuspLabels: Array.from({ length: lpm }, (_, i) => i),
      kCore: 'C_F: j ∉ Z (some ord_p(j) < 0) while CM j-invariants are algebraic integers, so E has no CM and the K-core of C̲_K is C_F ([CanLift] Rem 2.1.1)',
    },
    V: {
      rule: 'one place v of K above each place of F_mod = Q (a section of V(K) ↠ V_mod); for v ∈ V^bad choose v so that the kernel of E[l] ↠ Q is the Tate subgroup μ_l (type (1, Z/lZ)±) — possible because Gal(K/F) ⊇ SL2(F_l) moves any line to any other',
      places, otherPrimes: 'every other prime p: E has good reduction at p, v ∈ V^good (any v | p in K)',
    },
    VbadMod: vbad.map(v => ({ p: v.p, ordQ: v.ordQ, q: v.tateParameter })),
    VbadModExcluded: bad2 ? [{ p: 2, ordQ: bad2.ordQ, why: 'residue characteristic 2 is not allowed in V^bad_mod' }] : [],
    epsilon: { cusp: 'the cusp of C̲_K labelled ±1 ∈ |F_l|', label: 1, why: 'Def 3.1 (f): a cusp from a NON-zero element of Q ≅ Z/lZ; at v ∈ V^bad it must be the cusp of the canonical generator ±1 of Z (q^{1/l})' },
    labels: { Fl: Fl, FlAbs: Array.from({ length: lpm }, (_, i) => i), FlStar: Array.from({ length: lstar }, (_, i) => i + 1),
      FlSemiPm: `F_${l} ⋊ {±1}, order ${2 * l}`, FlStarGroup: `F_${l}^× / {±1}, order ${lstar}` },
    derived: {
      logQ: +logq.toFixed(6), logQFormula: 'Σ_{v ∈ V^bad_mod} ord_v(q_v)·log p_v  (= deg of the q-divisor; [F_mod:Q] = 1)',
      absLogQ: +(logq / (2 * l)).toFixed(6), absLogQFormula: '|log(q)| = log(q) / 2l  (one Θ-pilot step)',
      logCond: +logf.toFixed(6), logCondFormula: 'Σ_{v ∈ V^bad_mod} log p_v',
      htFromQ: +(logq / 6).toFixed(6), weilHeightJ: +hj.toFixed(6),
      thetaDilation: `j² for j ∈ F_${l}^* = {${Array.from({ length: lstar }, (_, i) => (i + 1) ** 2).join(', ')}}`,
    },
  };
  D.conditions = [
    { clause: '(a)', need: 'F a number field with √−1 ∈ F; F̄ an algebraic closure', how: 'F = Q(√−1, E[2·3·5]) contains √−1 by construction', status: 'by construction' },
    { clause: '(b)', need: 'X_F once-punctured elliptic curve with stable reduction at every finite v; F/F_mod Galois of degree prime to l; E[2·3] ⊆ E(F); V^bad_mod ≠ ∅, odd, multiplicative', how: `stable (Raynaud, E[15] ⊆ E(F)); [F:Q] | ${Fdiv}; V^bad_mod ≠ ∅`, status: vbad.length ? 'checked' : 'FAILS' },
    { clause: '(c)', need: 'l ≥ 5 prime, Im(G_F → GL2(F_l)) ⊇ SL2(F_l), l prime to V^bad_mod and to every ord(q_v)', how: `l = ${l}: Serre witnesses p = ${pick.serre.s.p}, ${pick.serre.sPrime.p}, ${pick.serre.sDouble.p}; ${vbad.map(v => `${l} ∤ ${v.ordQ}`).join(', ')}`, status: 'proved' },
    { clause: '(d)', need: 'C̲_K of type (1, l-tors)± with K-core C_F', how: `choose one of the ${l + 1} lines of E[${l}]; j ∉ Z so E has no CM`, status: 'by choice' },
    { clause: '(e)', need: 'V ⊆ V(K) a section of V(K) ↠ V_mod; at v ∈ V^bad, C̲_v of type (1, Z/lZ)±', how: 'one v | p per p; at V^bad the v of the Tate μ_l', status: 'by choice' },
    { clause: '(f)', need: 'ε̲ a cusp of C̲_K from a nonzero element of Q', how: 'the cusp ±1', status: 'by choice' },
  ];
  /* [IUTchIV] Thm 1.10 also asks for good reduction at every place of V(F)^good not dividing 2l */
  const outside = places.filter(v => v.kind === 'VNon' && v.reductionOverF === 'multiplicative' && !v.inVbadMod && v.p !== 2 && v.p !== l);
  D.thm110Hypothesis = { statement: 'E_F has good reduction at every v ∈ V(F)^good ∩ V(F)^non not dividing 2l ([IUTchIV] Thm 1.10)',
    holds: outside.length === 0, why: outside.length ? `bad outside V^bad_mod at ${outside.map(v => v.p).join(', ')}` : 'V^bad_mod contains every odd prime where E_F is bad over F' };
  /* the toolkit's view (abc triples only: the CLI takes --abc A B C --l L) */
  if (frey && fs.existsSync(BIN)) {
    const args = ['--abc', String(frey.a), String(frey.b), String(frey.c), '--l', String(l)];
    const run = (cmd) => { try { return execFileSync(BIN, [...cmd, ...args], { encoding: 'utf8' }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
    const val = run(['validate']);
    const m = val.match(/Validation report: (\d+) error\(s\), (\d+) warning\(s\), (\d+) checks/);
    const def31 = run(['run', 'CheckDefThreeOne']);
    D.toolkit = {
      commands: [`iut gen ${args.join(' ')} --json`, `iut validate ${args.join(' ')}`, `iut run CheckDefThreeOne ${args.join(' ')}`],
      errors: m ? +m[1] : null, warnings: m ? +m[2] : null, checks: m ? +m[3] : null,
      warningLines: [...val.matchAll(/\[WARN \] (\S+)\s+(.+?)\s{3}\(/g)].map(x => `${x[1]}: ${x[2]}`),
      def31: [...def31.matchAll(/^\s+\((\w)\) (ok|FAIL)\s+\((\w[^)]*)\)/gm)].map(x => ({ clause: x[1], ok: x[2] === 'ok', how: x[3] })),
      gen: JSON.parse(run(['gen', '--json'])),
    };
    /* cross-check the toolkit against the exact computation */
    const tk = D.toolkit.gen, ours = new Map(places.map(v => [v.p, v]));
    for (const v of tk.VSet) if (v.kind === 'VNon' && v.reduction === 'badMultiplicative' && v.p % 2 === 1) {
      const o = ours.get(v.p); if (!o || o.ordQ !== v.ordQ) throw new Error(`toolkit ord(q) at ${v.p} = ${v.ordQ}, exact = ${o && o.ordQ}`);
    }
    if (tk.l !== l) throw new Error('toolkit l differs');
  }
  return D;
}

/* JSON with short arrays / objects of primitives kept on one line */
function stringify(o) {
  return JSON.stringify(o, null, 2).replace(/\[\s*\n((?:\s*(?:-?[\d.]+|"[^"\n]*"|true|false|null),?\n)+)\s*\]/g, (m, body) => {
    const one = '[' + body.split('\n').map(x => x.trim()).filter(Boolean).join(' ') + ']';
    return one.length <= 100 ? one : m;
  }).replace(/\{\s*\n((?:\s*"[^"\n]+": (?:-?[\d.]+|"[^"\n]*"|true|false|null|\[[^\]\n]*\]),?\n)+)\s*\}/g, (m, body) => {
    const one = '{ ' + body.split('\n').map(x => x.trim()).filter(Boolean).join(' ') + ' }';
    return one.length <= 110 ? one : m;
  });
}

function build() { return EXAMPLES.map(buildExample); }
module.exports = { build, stringify, EXAMPLES };

if (require.main === module) {
  const all = build();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const D of all) {
    fs.writeFileSync(path.join(OUT_DIR, D.id + '.json'), stringify(D) + '\n');
    console.log(`wrote docs/initial-theta-data/${D.id}.json   l = ${D.l.value}, V^bad_mod = {${D.VbadMod.map(v => v.p).join(',')}}` + (D.toolkit ? `, toolkit ${D.toolkit.errors} errors / ${D.toolkit.warnings} warnings` : ''));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ schema: 'iut-initial-theta-data/index/1', reference: '[IUTchI] Def 3.1',
    examples: all.map(D => ({ id: D.id, title: D.title, file: D.id + '.json', curve: D.curve.equation, l: D.l.value, VbadMod: D.VbadMod.map(v => v.p) })) }, null, 2) + '\n');
}
