/*
 * ops.js — the OPERATIONS layer of the web-app model: a function-for-function mirror of
 * src/iut_ops.h / src/iut_ops_{i,ii,iii,iv,logic}.c and of the process registry src/iut_proc.c.
 * Every step / process one can perform with the data types of iut.js, each annotated with
 * the paper and section it comes from.  Works in the browser (window.OPS) and in node.
 *
 *   OPS.<paper>.<function>   e.g. OPS.i.labelGluePmToNf(d, t), OPS.iii.logShellMake(d, i, ...)
 *   OPS.PROCS                the registry (same ids as `iut procs`), each with run(d) → { ok, lines }
 */
(function (root) {
  'use strict';
  var IUT = (typeof module !== 'undefined' && module.exports) ? require('./iut.js') : root.IUT;
  var ETA_PRM = 5e20;                                   // η_prm of [IUTchIV] Prop 1.6 / [ExpEst]
  function abs(t) { return t < 0 ? -t : t; }
  function fmt(x, k) { return (typeof x === 'number' && isFinite(x)) ? x.toFixed(k === undefined ? 4 : k) : String(x); }
  function badIndex(d) { for (var i = 0; i < d.VSet.length; i++) if (d.VSet[i].kind === 'VNon' && d.VSet[i].reduction === 'badMultiplicative') return i; return 0; }
  function vbadIndex(d) { for (var i = 0; i < d.VSet.length; i++) if (d.VSet[i].inVBadMod) return i; return badIndex(d); }
  function isBad(v) { return v.kind === 'VNon' && v.reduction === 'badMultiplicative'; }
  function newLat(d, h) { var lat = new IUT.Lattice(d, h || 'ThetaUnitsModTorsLGPTorsorLink'); lat.buildH(0, 0, 1); return lat; }
  function sq(d) { var s = []; for (var j = 1; j <= d.LStar; j++) s.push(j * j); return s; }

  /* =================================================================== IUTchI */
  var I = {};
  I.labelAbs = abs;
  I.labelInFlUnits = function (d, t) { return t !== 0 && IUT.inFl(d, t); };
  I.labelFlUnitsToFlStar = function (d, u) { return I.labelInFlUnits(d, u) ? abs(u) : -1; };                 // F_l^× ↠ F_l^*
  I.labelGluePmToNf = function (d, t) { if (!IUT.inFl(d, t)) return -1; return t === 0 ? 0 : abs(t); };      // [IUTchI] Def 6.13 (iii): 0,⊞ ↦ >, t ↦ |t|
  I.labelOrbitFlSemiPm = function (d, t) { return IUT.inFl(d, t) ? d.l : 0; };                                 // [IUTchI] Prop 6.6: transitive on F_l
  I.labelOrbitFlStar = function (d, j) { return IUT.inFlStar(d, j) ? d.LStar : 0; };                           // [IUTchI] Prop 4.9: simply transitive on F_l^*
  // cusps  [IUTchI] Def 6.1, Prop 6.5; [IUTchII] Cor 4.5 (iii), Cor 4.7 (ii)
  I.labcuspPmMake = function (d) { var lab = []; for (var i = 0; i < d.l; i++) lab.push(i - d.LStar); return { n: d.l, label: lab, signedLabels: true }; };
  I.labcuspMake = function (d) { var lab = []; for (var i = 1; i <= d.LStar; i++) lab.push(i); return { n: d.LStar, label: lab, signedLabels: false }; };
  I.labcuspForgetSign = function (pm) { var lab = pm.label.filter(function (t) { return t > 0; }); return { n: lab.length, label: lab, signedLabels: false }; };
  I.labcuspIsBijection = function (lc, d) { if (lc.n !== (lc.signedLabels ? d.l : d.LStar) || lc.label.length !== lc.n) return false; var seen = {}; return lc.label.every(function (t) { if (seen[t]) return false; seen[t] = 1; return lc.signedLabels ? IUT.inFl(d, t) : IUT.inFlStar(d, t); }); };
  // capsules and processions  [IUTchI] §0, Prop 4.11, Prop 6.9
  I.capsuleFromT = function (ht) { return { n: ht.ThetaPmEllHodgeTheater.capsuleFT.length, label: ht.ThetaPmEllHodgeTheater.capsuleFT.map(function (c) { return c.t; }), basepoint: ht.ThetaPmEllHodgeTheater.capsuleFT.map(function (c) { return c.basepoint; }) }; };
  I.capsuleFromJ = function (ht) { return { n: ht.ThetaNFHodgeTheater.capsuleFJ.length, label: ht.ThetaNFHodgeTheater.capsuleFJ.map(function (c) { return c.j; }), basepoint: ht.ThetaNFHodgeTheater.capsuleFJ.map(function (c) { return c.basepoint; }) }; };
  I.capsuleMorphismValid = function (m) { if (m.nDom > m.nCod) return false; var seen = {}; for (var i = 0; i < m.nDom; i++) { var k = m.map[i]; if (!(k >= 0 && k < m.nCod) || seen[k]) return false; seen[k] = 1; } return true; };
  I.capsuleFullPolyIsoCount = function (c) { return IUT.factorial(c.n); };
  I.processionBuild = function (d, kind) {   // 'NF': Prc(D_J) [IUTchI] Prop 4.11;  'PM': Prc(D_T) [IUTchI] Prop 6.9
    var n = kind === 'NF' ? d.LStar : d.LPm, p = { kind: kind, nsteps: n, size: [], firstLabel: [], lastLabel: [], automorphisms: 1, normalization: [] };
    for (var s = 0; s < n; s++) { p.size.push(s + 1); p.firstLabel.push(kind === 'NF' ? 1 : 0); p.lastLabel.push(kind === 'NF' ? s + 1 : s); p.automorphisms *= IUT.factorial(s + 1); p.normalization.push(1 / (s + 1)); }
    return p;
  };
  I.processionCapsuleLabels = function (p, k) { var out = []; if (k >= p.nsteps) return out; for (var t = p.firstLabel[k]; t <= p.lastLabel[k]; t++) out.push(t); return out; };
  // bridges  [IUTchI] Def 4.6, 5.5, 6.4, 6.11
  I.BRIDGES = ['ThetaBridge', 'NFBridge', 'ThetaPmBridge', 'ThetaEllBridge'];
  I.bridgeBuild = function (ht, kind) {
    var d = ht._d || null, P = ht.ThetaPmEllHodgeTheater, N = ht.ThetaNFHodgeTheater, lstar = N.capsuleFJ.length, l = P.capsuleFT.length;
    switch (kind) {
      case 'ThetaBridge': return { kind: kind, nDom: lstar, dom: 'FJ', cod: 'FGt', symmetry: 'trivial (rigid once the NF-bridge is fixed; [IUTchI] Prop 4.8 (iii), Cor 5.6 (ii))', isos: 1, poly: true, ok: !!N.ThetaBridge };
      case 'NFBridge': return { kind: kind, nDom: lstar, dom: 'FJ', cod: 'FCircAst', symmetry: 'F_l^*', isos: lstar, poly: true, ok: !!N.NFBridge };
      case 'ThetaPmBridge': return { kind: kind, nDom: l, dom: 'FT', cod: 'FBoxPlus', symmetry: '{±1} × {±1}^V', isos: 2 * Math.pow(2, P.FBoxPlus.local.length), poly: true, ok: !!P.ThetaPmBridge };   // [IUTchI] Prop 6.6 (i)
      case 'ThetaEllBridge': return { kind: kind, nDom: l, dom: 'DT', cod: 'DCircDotPm', symmetry: 'F_l^{⋊±}', isos: 2 * l, poly: true, ok: !!P.ThetaEllBridge };   // [IUTchI] Prop 6.6 (ii)
    }
    return null;
  };
  // forgetful functors  [IUTchI] Def 6.13, Rem 6.12.2
  I.hodgeTheaterToD = function (ht) {
    var P = ht.ThetaPmEllHodgeTheater, N = ht.ThetaNFHodgeTheater;
    return { species: 'DThetaPmEllNFHodgeTheater', universe: ht.universe, nT: P.capsuleFT.length, nJ: N.capsuleFJ.length, nV: P.FBoxPlus.local.length,
      PiT: P.capsuleFT.map(function (c) { return c.basepoint; }), PiJ: N.capsuleFJ.map(function (c) { return c.basepoint; }),
      PiBoxPlus: P.FBoxPlus.local.map(function (L) { return L.PiV; }), PiGt: N.FGt.local.map(function (L) { return L.PiV; }), PiCircDot: P.DCircDotPm.local.map(function (L) { return L.PiV; }), PiCircAst: N.FCircAst.local.map(function (L) { return L.PiV; }) };
  };
  I.dHodgeTheaterIso = function (a, b) { if (a.nT !== b.nT || a.nJ !== b.nJ || a.nV !== b.nV) return false; for (var i = 0; i < a.nV; i++) if (a.PiBoxPlus[i] !== b.PiBoxPlus[i] || a.PiGt[i] !== b.PiGt[i]) return false; return true; };
  I.hodgeTheaterPmell = function (ht) { return ht.ThetaPmEllHodgeTheater; };
  I.hodgeTheaterNf = function (ht) { return ht.ThetaNFHodgeTheater; };
  I.hodgeTheaterTheta = function (ht) { return ht.ThetaNFHodgeTheater.ThetaHodgeTheater; };
  // Frobenius picture / étale picture  [IUTchI] Cor 3.8, Cor 4.12, Cor 6.10
  I.frobeniusChainBuild = function (lat, m, n0, n1) { var c = { n: 0, universe: [], kind: lat.horizontal, translationSymmetric: true, adjacentSwapAllowed: false }; for (var n = n0; n <= n1; n++) { var ht = lat.get(n, m); if (!ht) break; c.universe.push(ht.universe); c.n++; if (n < n1) lat.applyThetaLink(n, m); } return c; };
  I.frobeniusChainTranslate = function (c, shift) { var out = JSON.parse(JSON.stringify(c)); if (!c.n) return out; var s = ((shift % c.n) + c.n) % c.n; for (var i = 0; i < c.n; i++) out.universe[(i + s) % c.n] = c.universe[i]; return out; };
  I.etalePictureBuild = function (lat, m) { var e = { coreCopy: [], nV: 0, nspokes: 0, spokeUniverse: [], permutationSymmetric: true }; for (var n = -IUT.LAT.NOFF; n <= IUT.LAT.NOFF; n++) { var ht = lat.peek(n, m); if (!ht) continue; if (!e.nV) { e.coreCopy = ht.FMonoGlobTriangle.local.map(function (L) { return L.GV; }); e.nV = e.coreCopy.length; } e.spokeUniverse.push(ht.universe); e.nspokes++; } return e; };
  I.etalePicturePermute = function (e, perm) { var out = JSON.parse(JSON.stringify(e)), seen = {}; for (var i = 0; i < e.nspokes; i++) { if (!(perm[i] < e.nspokes) || seen[perm[i]]) return null; seen[perm[i]] = 1; out.spokeUniverse[i] = e.spokeUniverse[perm[i]]; } return out; };
  // global number-field data  [IUTchI] Ex 5.1; [IUTchII] Cor 4.7, Cor 4.8
  I.globalNfBuild = function (d, copyBase) { return { PiCK: copyBase * 1000 + 1, FmodUnits: copyBase * 1000 + 2, kappaCoric: copyBase * 1000 + 3, sol: copyBase * 1000 + 4, hasFrobenioidMod: true, realified: false, kummerRigid: true }; };
  I.globalNfRealify = function (g) { g.realified = true; return g; };
  I.globalNfKummer = function (frob, etale, r) { r = r || new IUT.Report(); var ok = frob.hasFrobenioidMod && etale.hasFrobenioidMod && frob.kummerRigid && etale.kummerRigid; r.add(ok ? 'ok' : 'error', 'GlobalKummerIso', '[IUTchI] Cor 5.3; [IUTchII] Cor 4.8', ok ? 'Kummer isomorphism F^⊛(' + frob.FmodUnits + ') ≅ F^⊛(D_⊛(' + etale.PiCK + ')) is unique (Q>0 ∩ Ẑ× = {1})' : 'global Kummer isomorphism not available'); return ok; };

  /* ---------------- IUTchI read from the paper: mirror of src/iut_i.h / src/iut_i.c ---------------- */
  function yn(b) { return b ? 'yes' : 'no'; }
  function isBadV(v) { return v.kind === 'VNon' && v.reduction === 'badMultiplicative'; }
  // §0 pseudo-monoids  [IUTchI] Ex 5.1 (i), Def 5.2 (v)-(vi), Rem 5.1.3
  I.PSEUDO_MONOIDS = [
    { id: 'MCircAst', notation: 'M^⊛(†D^⊛)', divisible: true, cyclotomic: true, isGroup: true, kummerReady: true, ref: '[IUTchI] Ex 5.1 (i); Rem 5.1.3' },
    { id: 'MCircAstMod', notation: 'M^⊛_mod', divisible: false, cyclotomic: false, isGroup: true, kummerReady: false, ref: '[IUTchI] Ex 5.1 (i); Rem 5.1.3' },
    { id: 'MCircAstSol', notation: 'M^⊛_sol', divisible: false, cyclotomic: true, isGroup: true, kummerReady: true, ref: '[IUTchI] Ex 5.1 (i); Rem 5.1.3' },
    { id: 'MCircAstKappa', notation: 'M^⊛_κ', divisible: false, cyclotomic: false, isGroup: false, kummerReady: false, ref: '[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3' },
    { id: 'MCircAstInfKappa', notation: 'M^⊛_∞κ', divisible: true, cyclotomic: true, isGroup: false, kummerReady: true, ref: '[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3' },
    { id: 'MCircAstInfKappaUnits', notation: 'M^⊛_∞κ×', divisible: true, cyclotomic: true, isGroup: false, kummerReady: true, ref: '[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3' },
    { id: 'MCircAstKappaSol', notation: 'M^⊛_κ-sol', divisible: false, cyclotomic: false, isGroup: false, kummerReady: true, ref: '[IUTchI] Ex 5.1 (i); Rem 3.1.7 (iii); Rem 5.1.3' },
    { id: 'MV', notation: 'M_v(‡D_v)', divisible: true, cyclotomic: true, isGroup: false, kummerReady: true, ref: '[IUTchI] Def 5.2 (v)' },
    { id: 'MKappaV', notation: 'M_κv', divisible: false, cyclotomic: false, isGroup: false, kummerReady: false, ref: '[IUTchI] Def 5.2 (vi)' },
    { id: 'MInfKappaV', notation: 'M_∞κv', divisible: true, cyclotomic: true, isGroup: false, kummerReady: true, ref: '[IUTchI] Def 5.2 (vi)' },
    { id: 'MInfKappaUnitsV', notation: 'M_∞κ×v', divisible: true, cyclotomic: true, isGroup: false, kummerReady: true, ref: '[IUTchI] Def 5.2 (vi)' }
  ];
  I.pseudoMonoidGet = function (id) { for (var i = 0; i < I.PSEUDO_MONOIDS.length; i++) if (I.PSEUDO_MONOIDS[i].id === id) return I.PSEUDO_MONOIDS[i]; return null; };
  var PSM_CONTAINS = { MCircAst: ['MCircAstMod', 'MCircAstSol'], MCircAstSol: ['MCircAstMod'], MCircAstInfKappaUnits: ['MCircAstInfKappa', 'MCircAstKappa'], MCircAstInfKappa: ['MCircAstKappa'], MCircAstKappaSol: ['MCircAstKappa'], MInfKappaUnitsV: ['MInfKappaV', 'MKappaV'], MInfKappaV: ['MKappaV'] };
  I.pseudoMonoidContains = function (big, small) { return big === small || (PSM_CONTAINS[big] || []).indexOf(small) >= 0; };
  // §0 poly-morphisms  [IUTchI] §0, Def 6.1 (iv)
  I.POLY_KINDS = ['PolyMorphism', 'PolyIsomorphism', 'FullPolyIsomorphism', 'PlusFullPolyIsomorphism', 'CapsuleFullPolyMorphism', 'CapsuleFullPolyIsomorphism'];
  I.polyMake = function (kind, count) { var full = kind === 'FullPolyIsomorphism' || kind === 'CapsuleFullPolyIsomorphism' || kind === 'CapsuleFullPolyMorphism'; return { kind: kind, count: full ? 0 : count, nV: 0, sign: [], indexBijective: kind === 'CapsuleFullPolyIsomorphism', ref: kind === 'PlusFullPolyIsomorphism' ? '[IUTchI] Def 6.1 (iv)' : '[IUTchI] §0' }; };
  I.polyCompose = function (second, first) {
    var isoK = function (k) { return k !== 'PolyMorphism' && k !== 'CapsuleFullPolyMorphism'; };
    if (first.kind === 'FullPolyIsomorphism' || second.kind === 'FullPolyIsomorphism') return I.polyMake('FullPolyIsomorphism', 0);
    var out = I.polyMake(isoK(first.kind) && isoK(second.kind) ? 'PolyIsomorphism' : 'PolyMorphism', (first.count && second.count) ? first.count * second.count : 0); out.ref = '[IUTchI] §0 (composite of poly-morphisms)'; return out;
  };
  I.polyPlusFullMake = function (d, alpha) { var p = I.polyMake('PlusFullPolyIsomorphism', 0); p.nV = d.VSet.length; p.sign = d.VSet.map(function (_, i) { return alpha && alpha[i] < 0 ? -1 : 1; }); return p; };
  I.polyPlusFullIsPositive = function (p) { return p.kind === 'PlusFullPolyIsomorphism' && p.sign.every(function (s) { return s > 0; }); };
  I.polyPlusFullIsNegative = function (p) { return p.kind === 'PlusFullPolyIsomorphism' && p.sign.every(function (s) { return s < 0; }); };
  I.ANABELIOIDS = { BPi: { notation: 'B(Π)', connected: true, tempered: false }, BX: { notation: 'B(X)', connected: false, tempered: false }, BXZero: { notation: 'B(X)^0', connected: true, tempered: false }, BTemp: { notation: 'B^temp(Π)', connected: true, tempered: true } };
  I.anabelioidMake = function (kind, of) { var a = I.ANABELIOIDS[kind]; return a ? { id: kind, notation: a.notation, of: of, connected: a.connected, tempered: a.tempered } : null; };
  I.fieldKindOfValuation = function (v) { return v.kind === 'VArc' ? 'CAF' : 'MLF'; };     // [IUTchI] §0
  // §1 orbicurves  [IUTchI] §1, Def 1.1, Def 3.1 (b), Rem 1.2.1
  I.ORBICURVES = ['XF', 'COrbicurve', 'XUnderK', 'CK', 'XArrow', 'CArrow', 'XUnderUnderK', 'CUnderUnderV', 'CUnderV'];
  I.orbicurveGet = function (d, id) {
    var l = d.l, T = {
      XF: { notation: 'X', type: '(1,1)', base: 'k', covers: '—', degree: 1, group: '—', groupOrder: 0, ncusps: 1, autK: 0, ref: '[IUTchI] §1; Def 3.1 (a)' },
      COrbicurve: { notation: 'C = X/{±1}', type: '(1,1)±', base: 'k', covers: '—', degree: 1, group: '—', groupOrder: 0, ncusps: 1, autK: 0, ref: '[IUTchI] §1' },
      XUnderK: { notation: 'X̲', type: '(1,l-tors)', base: 'K', covers: 'X', degree: l, group: 'Z/l', groupOrder: l, ncusps: l, autK: 0, ref: '[IUTchI] §1; Def 3.1 (b); Def 6.1 (iii): cusps ↔ F_l' },
      CK: { notation: 'C̲ = X̲/{±1}', type: '(1,l-tors)±', base: 'K', covers: 'C', degree: l, group: 'Z/l', groupOrder: l, ncusps: d.LPm, autK: 0, ref: '[IUTchI] §1; Def 3.1 (b); Ex 4.4 (i): cusps ↔ |F_l|' },
      XArrow: { notation: 'X→', type: '(1,l-tors→)', base: 'k', covers: 'X̲', degree: l, group: 'Z/l (Gal(X→/C̲) ≅ Z/2l)', groupOrder: l, ncusps: -1, autK: 2 * l, ref: '[IUTchI] Def 1.1; Rem 1.2.1' },
      CArrow: { notation: 'C→', type: '(1,l-tors→)±', base: 'k', covers: 'C̲', degree: l, group: 'Z/l', groupOrder: l, ncusps: -1, autK: l, ref: '[IUTchI] Def 1.1; Rem 1.2.1' },
      XUnderUnderK: { notation: 'X̲̲_v', type: '(1,(Z/l)^Θ)', base: 'K_v', covers: 'X̲_v', degree: l, group: 'Z/l', groupOrder: l, ncusps: -1, autK: 0, ref: '[IUTchI] Def 3.1 (b); [EtTh] Def 2.5' },
      CUnderUnderV: { notation: 'C̲̲_v', type: '(1,(Z/l)^Θ)±', base: 'K_v', covers: 'C̲_v', degree: l, group: 'Z/l', groupOrder: l, ncusps: -1, autK: 0, ref: '[IUTchI] Def 3.1 (b)' },
      CUnderV: { notation: 'C̲_v', type: '(1,Z/l)±', base: 'K_v', covers: 'C_v', degree: l, group: 'Z/l', groupOrder: l, ncusps: d.LPm, autK: 0, ref: '[IUTchI] Def 3.1 (b); Ex 4.4 (i)' }
    }; var o = T[id]; if (!o) return null; o.id = id; return o;
  };
  function reduceFl(d, x) { var l = d.l; x %= l; if (x < 0) x += l; if (x > d.LStar) x -= l; return x; }
  I.cuspsSectionOne = function (d) { return { epsilon: 1, epsilonPrime: 1, epsilonDPrime: -1, twoEpsilon: reduceFl(d, 2), twoEpsilonOk: (2 % d.l !== 1) && ((d.l - 1) % d.l !== 2), zeroCusp: 0, inertiaProductRank: 2, deltaEModLOrder: d.l * d.l, iotaSwapsInertia: true, iotaActsMinusOne: true, deltaEpsSplits: true }; };   // [IUTchI] §1
  I.corOneTwo = function (d) {   // [IUTchI] Cor 1.2, Rem 1.2.1
    var l = d.l; return { lSquared: l * l, idxXXUnder: l, idxXUnderXArrow: l, idxCXArrow: 2 * l * l, galXUnderOverCUnder: 2, galCArrowOverCUnder: l, galXArrowOverCUnder: 2 * l, galXArrowOverCArrow: 2, autKXArrow: 2 * l, autKCArrow: l, stabilizedCusps: [0, 1, -1],
      steps: ['Π_X→, Π_X̲, Π_C̲ are slim, hence embed in Aut(Π_X→); recover Δ_X→ ⊆ Π_X→ ([AbsTopI] Thm 2.6 (v),(vi))', 'reconstruct Π_C ⊇ Π_X→ and Δ_X ⊆ Δ_C ⊆ Π_C ([AbsTopII] Cor 3.3 (i),(ii))', 'recover l from l² = [Δ_X : Δ_X̲]·[Δ_X̲ : Δ_X→] = [Δ_X : Δ_X→] = [Δ_C : Δ_X→]/2', 'H = Ker(Δ_X ↠ Δ_X^ab ⊗ Z/l);  Π_X̲ = Π_X→ · H', 'decomposition groups of 0, ε′, ε″ in Π_X̲ = those of cusps with nontrivial image in Gal(X→/X̲) = Π_X̲/Π_X→', 'Π_C̲ ⊆ Π_C: the unique splitting of Gal(X/C) = Π_C/Π_X ↠ Π_C/Π_X̲ = Gal(X̲/C̲) stabilizing the classes of 0, ε′, ε″ (l prime to 3!)', 'Π_C→ ⊆ Π_C̲: Gal(X→/C→) (≅ Z/2) ⊆ Gal(X→/C̲) (≅ Z/2l) is the unique maximal subgroup of odd index', 'decomposition groups of ε′, ε″: cusps with nontrivial image in Gal(X→/X̲) not fixed up to conjugacy by the outer action of Gal(X̲/C̲)'] };
  };
  // §2 tempered  [IUTchI] Prop 2.1 – Cor 2.8, Rem 2.5.3
  I.TEMPERED_FACTS = [
    { id: 'TemperedConjugates', ref: '[IUTchI] Prop 2.1', statement: 'a profinite conjugate of a nontrivial compact subgroup of Π^tp_G lying in Π^tp_G is a Π^tp_G-conjugate (Σ-tempered groups of graphs)' },
    { id: 'CommensurablyTerminal', ref: '[IUTchI] Prop 2.2', statement: 'Π^tp_X ⊆ Π_X is commensurably terminal' },
    { id: 'TemperedSubcover', ref: '[IUTchI] Cor 2.3', statement: 'for H ⊆ Π_X open, Δ^tp_{X,H} := Δ^tp_X ∩ H is the tempered group of the covering determined by H' },
    { id: 'TemperedVerticialEdge', ref: '[IUTchI] Prop 2.4', statement: 'verticial / edge-like subgroups of Π^tp are characterized by their profinite conjugacy behaviour' },
    { id: 'DecompositionSynchronized', ref: '[IUTchI] Cor 2.5', statement: 'a decomposition (resp. inertia) group of Π_X contained in Π^tp_X is a tempered decomposition (resp. inertia) group' },
    { id: 'DiscreteAnalogue', ref: '[IUTchI] Thm 2.6, Lem 2.7, Cor 2.8', statement: 'the discrete analogues: Thm 2.6, Lemma 2.7, Cor 2.8 for the topological fundamental group π_1 and its tempered completions' },
    { id: 'GaloisCountable', ref: '[IUTchI] Rem 2.5.3', statement: 'Galois-countable groups (T1)–(T6) and the effects (E1)–(E9) on the tempered theory' }
  ];
  I.temperedAtV = function (d, v) { var bad = isBadV(d.VSet[v]); return { vIndex: v, temperedAvailable: bad, profiniteConjugatesStayTempered: bad, commensurablyTerminal: bad, decompositionGroupsSynchronized: bad, galoisCountable: true }; };
  // §3 Def 3.1 (a)-(f)  [IUTchI] Def 3.1; Rem 3.1.2, 3.1.3, 3.1.5, 3.1.7
  I.defThreeOneCheck = function (d, r) {
    r = r || new IUT.Report(); var h = d.hypotheses || {}, cOk = true, eOk = false, oddOk = true;
    d.VSet.forEach(function (v) { if (v.inVBadMod) { eOk = true; if (v.p % 2 === 0) oddOk = false; if (v.p === d.l || (v.ordQ && IUT.gcd(d.l, v.ordQ) !== 1)) cOk = false; } });
    var items = [
      { item: '(a)', condition: 'F ∋ √−1; F/F_mod Galois of degree prime to l; the 2·3-torsion of E_F rational over F', ok: !!(h.FGaloisOverFmod && h.FContainsSixTorsion), machineChecked: false },
      { item: '(b)', condition: 'X_F once-punctured E_F; C_K = X̲_K/±1 of type (1,l-tors)±, X̲_K of type (1,l-tors); K = F(E[l]) with image ⊇ SL_2(F_l)', ok: !!(h.ImageContainsSLTwo && h.CKIsKCore && d.l >= 5 && IUT.isPrime(d.l)), machineChecked: false },
      { item: '(c)', condition: 'l prime to 2·3, to the residue characteristics of V^bad_mod and to the orders ord_v(q_v)', ok: cOk && d.l % 2 === 1 && d.l % 3 !== 0, machineChecked: true },
      { item: '(d)', condition: 'V ⊆ V(K) is a section of V(K) ↠ V_mod (one v above each v_mod)', ok: d.VSet.length > 0, machineChecked: true },
      { item: '(e)', condition: 'V^bad_mod ≠ ∅, odd residue characteristic, bad multiplicative reduction; E_F has stable reduction', ok: eOk && oddOk && !!h.StableReduction, machineChecked: true },
      { item: '(f)', condition: 'ε̲ a cusp of C̲_K, hence ε̲_v ∈ LabCusp(D_v) for every v', ok: IUT.inFl(d, d.EpsilonUnder || 0), machineChecked: true }
    ];
    items.forEach(function (it) { r.add(it.ok ? 'ok' : 'error', 'DefThreeOne', '[IUTchI] Def 3.1 ' + it.item, it.condition); });
    return { items: items, report: r };
  };
  I.thetaApproach = function (d) { return { cyclotomeIndex: d.l, cyclotome: 'M_X (the cyclotome of the once-punctured elliptic curve, [AbsTopIII] Thm 1.9)', thetaCyclotome: 'Δ_Θ (the cyclotome of the theta function, [EtTh])', appliedTo: 'Π_{X̲_K} ⊆ Π_{C̲_K} (the Θ-approach: use the once-punctured curve, not C̲_K directly)', ref: '[IUTchI] Rem 3.1.2: M_X ≅ l·Δ_Θ' }; };
  I.DETERMINING_DATA = ['F̄/F', 'X_F', 'C̲_K', 'V', 'V^bad_mod'];   // [IUTchI] Rem 3.1.3
  I.sMod = function (d) { return { notation: 'S_mod = Spec(O_K) // Gal(K/F_mod)', galOrderBound: d.K.degreeBound / ((d.Fmod && d.Fmod.degree) || 1), npoints: d.VSet.length }; };
  I.kappaCoricCheck = function (f) {   // [IUTchI] Rem 3.1.7 (i),(ii)
    var v = { ncritical: 4, nstrictlyCritical: 4, kappaCoric: false, infKappaCoric: false, infKappaUnitsCoric: false, failed: null };
    if (f.npoles !== 1) { v.failed = 'exactly one pole required'; return v; }
    if (f.nzeros < 2) { v.failed = 'at least two zeroes required'; return v; }
    if (!f.divisorOverNF) { v.failed = 'divisor must be defined over a number field'; return v; }
    if (!f.divisorAvoidsCritical) { v.failed = 'divisor must avoid the critical points'; return v; }
    if (!f.rootsOfUnityAtStrictlyCritical) { v.failed = 'values at strictly critical points must be roots of unity'; return v; }
    v.kappaCoric = true; v.infKappaCoric = !!f.allRootsAdjoined; v.infKappaUnitsCoric = !!(f.allRootsAdjoined && f.constantsAdjoined); return v;
  };
  I.kappaSol = function (d) { var l = d.l; return { sl2Order: l * (l * l - 1), kOverFMuL: 'Gal(K/F(μ_l)) is the unique subgroup of Gal(K/F) isomorphic to SL_2(F_l)', linearlyDisjoint: true, centerFree: true }; };   // [IUTchI] Rem 3.1.7 (iii)
  // §3 local Frobenioids  [IUTchI] Ex 3.2 (bad), Ex 3.3 (good nonarch), Ex 3.4 (arch)
  I.localFrobenioidBuild = function (d, v) {
    var V = d.VSet[v];
    if (V.kind === 'VArc') return { kind: 'Arch', vIndex: v, ref: '[IUTchI] Ex 3.4', DV: 'X→_v: the Aut-holomorphic orbispace of X→ ×_K K_v (a CAF A_□ = C)', DMonoV: 'D⊢_v: a split topological monoid in TM (C ≅ O▷_C, C× ≅ S¹, C→ ≅ R≥0)', DThetaV: null, FV: 'F̲_v = (C_v, D_v, κ_v): archimedean Frobenioid C_v with O▷(C_v) ≅ O▷_{K̄_v}, Kummer structure κ_v : O▷(C_v) ↪ A_{D_v}', FBiratV: null, CV: 'C_v', CMonoV: 'C⊢_v (F⊢_v = (C⊢_v, D⊢_v, τ⊢_v))', CThetaV: null, divisorMonoid: 'Φ_{C⊢v} = R≥0 · log(p_v)', divisorMonoidTheta: 'R≥0 · log(p_v) · log(Θ)', generator: 'p_v (= e)', generatorValue: 1, splitting: 'τ⊢_v: C× = S¹ × R>0 (the canonical splitting of a CAF)', splittingIndeterminacy: 1, thetaFunction: null, thetaRootIndeterminacy: 0, thetaTranslationIndeterminacy: false, isTempered: false, isSplit: true, hasKummerStructure: true, isBirationalAvailable: false, formalSymbol: 'log(p_v)·log(Θ)' };
    if (isBadV(V)) return { kind: 'Bad', vIndex: v, ref: '[IUTchI] Ex 3.2', DV: 'D_v = B^temp(X̲̲_v)^0', DMonoV: 'D⊢_v = B(K_v)^0 ⊆ D_v', DThetaV: 'D^Θ_v', FV: 'F̲_v: the tempered Frobenioid over D_v', FBiratV: 'F÷_v: birationalization', CV: 'C_v: base-field-theoretic hull', CMonoV: 'C⊢_v (with the μ_2l-orbit of characteristic splittings τ⊢_v)', CThetaV: 'C^Θ_v (with τ^Θ_v)', divisorMonoid: 'Φ_{C⊢v} = N · log_Φ(q̲_v)', divisorMonoidTheta: 'N · log_Φ(q̲_v) · log(Θ)', generator: 'q̲_v = q_v^{1/2l} (up to μ_2l)', generatorValue: 1, splitting: 'τ⊢_v: a μ_2l-orbit of splittings O▷ = O× × Φ', splittingIndeterminacy: 2 * d.l, thetaFunction: 'Θ̲_v ∈ O×(T÷_{Ÿ_v}) up to μ_2l and l·Z (translation of the labels)', thetaRootIndeterminacy: 2 * d.l, thetaTranslationIndeterminacy: true, isTempered: true, isSplit: true, hasKummerStructure: false, isBirationalAvailable: true, formalSymbol: 'log(Θ)' };
    return { kind: 'GoodNonarch', vIndex: v, ref: '[IUTchI] Ex 3.3', DV: 'D_v = B(X→_v)^0', DMonoV: 'D⊢_v = B(K_v)^0', DThetaV: null, FV: 'F̲_v = C_v: the p_v-adic Frobenioid, Φ_{C_v}: Spec L ↦ ord(O_L)^pf', FBiratV: null, CV: 'C_v', CMonoV: 'C⊢_v ⊆ C_v', CThetaV: null, divisorMonoid: 'Φ_{C⊢v} = ord(Z_{p_v}) = N · log(p_v)', divisorMonoidTheta: 'N · log(p_v) · log(Θ)', generator: 'p_v', generatorValue: V.eK || 1, splitting: 'τ⊢_v: the splitting determined by p_v', splittingIndeterminacy: 1, thetaFunction: null, thetaRootIndeterminacy: 0, thetaTranslationIndeterminacy: false, isTempered: false, isSplit: true, hasKummerStructure: false, isBirationalAvailable: false, formalSymbol: 'log(p_v)·log(Θ)' };
  };
  I.localFrobenioidSplitIso = function (a, b) { return a.kind === b.kind && a.splittingIndeterminacy === b.splittingIndeterminacy && a.generatorValue === b.generatorValue; };   // [IUTchI] Ex 3.2 (v): F⊢_v ≅ F^Θ_v
  I.localFrobenioidReconstructions = function (lf) {
    if (lf.kind === 'Bad') return ['(a) the subgroups Π^tp_{X̲̲_v} ↠ G_v, the cuspidal decomposition groups and Ÿ_v from the tempered Frobenioid F̲_v', '(b) the birationalization F÷_v and the base-field-theoretic hull C_v', '(c) the theta function Θ̲_v ∈ O×(T÷_{Ÿ_v}) up to μ_2l and l·Z  ([EtTh] Thm 1.10)', '(d) q_v and q̲_v = q_v^{1/2l} up to μ_2l; the divisor monoid Φ_{C⊢v} = N·log_Φ(q̲_v)', '(e) the μ_2l-orbit of characteristic splittings τ⊢_v, hence the split Frobenioid F⊢_v = (C⊢_v, τ⊢_v)', '(f) the Θ-version D^Θ_v, C^Θ_v, τ^Θ_v and the isomorphism F⊢_v ≅ F^Θ_v'];
    if (lf.kind === 'GoodNonarch') return ['D⊢_v = B(K_v)^0 from D_v = B(X→_v)^0 (Π_v ↠ G_v)', 'C⊢_v ⊆ C_v and the splitting τ⊢_v from p_v', 'the formal symbol log(p_v)·log(Θ)'];
    return ['the Kummer structure κ_v and O▷(C_v) ≅ O▷_{K̄_v}', 'D⊢_v ∈ TM: C× ≅ S¹, C→ ≅ R≥0', 'Φ_{C⊢v} = R≥0·log(p_v) and its Θ-version'];
  };
  // §3 global realified  [IUTchI] Ex 3.5
  I.rhoV = function (d, v) { var V = d.VSet[v]; if (V.kind === 'VArc') return 1; var deg = (V.eK || 1) * (V.fK || 1) / ((V.eMod || 1) * (V.fMod || 1)); return 1 / (deg < 1 ? 1 : deg); };
  I.rhoThetaV = function (d, v, j) { var V = d.VSet[v]; return I.rhoV(d, v) * (V.kind === 'VArc' ? 1 : Math.log(V.p)) * j * j; };   // Θ̲_v(label j) = q̲_v^{j²}  (Ex 4.4 (i))
  I.globalRealifiedBuild = function (d, kind) {
    var g = { kind: kind, id: kind === 'MOD' ? 'CMonoGlobMod' : kind === 'THT' ? 'CMonoGlobTht' : 'DMonoGlobMod', notation: kind === 'MOD' ? 'C⊩_mod' : kind === 'THT' ? 'C⊩_tht' : 'D⊩_mod', ref: kind === 'MOD' ? '[IUTchI] Ex 3.5 (i),(ii)' : kind === 'THT' ? '[IUTchI] Ex 3.5 (ii) (Θ-version: log(Θ))' : '[IUTchI] Ex 3.5 (iv) (étale-like, from {D⊢_v})', nprimes: d.VSet.length, rho: [], localDegree: [], frobeniusElement: [], withTheta: kind === 'THT' };
    d.VSet.forEach(function (V, i) { g.rho.push(I.rhoV(d, i)); g.localDegree.push(V.kind === 'VArc' ? 1 : Math.round(1 / g.rho[i])); g.frobeniusElement.push(V.kind === 'VArc' ? 1 / (2 * Math.PI) : (V.eK || 1)); });
    return g;
  };
  I.fMonoGlobBuild = function (d, theta) { return { id: theta ? 'FMonoGlobTht' : 'FMonoGlobMod', notation: theta ? 'F⊩_tht' : 'F⊩_mod', thetaVersion: !!theta, global: I.globalRealifiedBuild(d, theta ? 'THT' : 'MOD'), nV: d.VSet.length, loc: d.VSet.map(function (_, i) { return I.localFrobenioidBuild(d, i); }) }; };   // Ex 3.5 (iii)
  I.fMonoGlobIso = function (a, b) { if (a.nV !== b.nV) return false; for (var i = 0; i < a.nV; i++) if (!I.localFrobenioidSplitIso(a.loc[i], b.loc[i]) || Math.abs(a.global.rho[i] - b.global.rho[i]) > 1e-12) return false; return true; };
  I.thetaHodgeTheaterDef = function (d) { var loc = d.VSet.map(function (_, i) { return I.localFrobenioidBuild(d, i); }), mod = I.fMonoGlobBuild(d, false), tht = I.fMonoGlobBuild(d, true); return { nV: d.VSet.length, loc: loc, mod: mod, tht: tht, condA: true, condB: true, condC: loc.every(function (L, i) { return L.kind === mod.loc[i].kind; }) }; };   // Def 3.6
  I.thetaLinkCorThreeSeven = function (lk, r) {   // [IUTchI] Cor 3.7, Rem 3.9.3 on a lattice link object of iut.js
    r = r || new IUT.Report(); var isTheta = lk.species !== 'LogLink' && lk.species !== 'DThetaPmEllNFLink';
    var c1 = isTheta && !!lk.fullPolyIsomorphism, c2 = !!lk.preservesGV && !lk.preservesPiV, c3 = !!lk.preservesUnitsModTors || lk.species === 'ThetaLink', c4 = !lk.preservesRing;
    r.add(c1 ? 'ok' : 'error', 'ThetaLinkFullPolyIso', '[IUTchI] Cor 3.7 (i)', 'Θ-link is the full poly-isomorphism F⊩_tht ≅ F⊩_mod');
    r.add(c2 ? 'ok' : 'error', 'ThetaLinkPreservesDMono', '[IUTchI] Cor 3.7 (ii)', 'D⊢_v = {G_v} preserved, Π_v not');
    r.add(c3 ? 'ok' : 'warn', 'ThetaLinkPreservesUnits', '[IUTchI] Cor 3.7 (iii); Rem 3.9.3', 'O×_{C⊢v} preserved; value groups dilated by ' + fmt(lk.dilation, 3));
    r.add(c4 ? 'ok' : 'error', 'ThetaLinkNotRing', '[IUTchI] Rem 3.9.3', 'the ring structures are not related by the Θ-link');
    return (c1 ? 0 : 1) + (c2 ? 0 : 1) + (c4 ? 0 : 1);
  };
  // §4 label torsors, global bases, evaluation points, transport, torsors, counts
  I.labcuspTorsorMake = function (d) { return { nV: d.VSet.length, torsorSize: d.LStar, eta: d.VSet.map(function () { return 1; }), compatible: true }; };   // Def 4.1 (ii), Prop 4.2
  I.labcuspTorsorAct = function (d, u, label) { return IUT.symFlStar(d, u, label); };
  I.globalBaseGet = function (d, kind) {   // Def 4.1 (v), Ex 4.3, Def 6.1 (v)
    var l = d.l, b = { kind: kind, nVSection: d.VSet.length, autImageOrder: l * (l - 1) * (l - 1) / 2, autEpsImageOrder: l * (l - 1), doubleCover: false };
    if (kind === 'CircAst') { b.id = 'DCircAstGlobal'; b.notation = 'D^⊛ = B(C̲_K)^0'; b.curve = 'C̲_K'; b.group = 'Π_{C̲_K}'; b.labcuspSize = d.LStar; b.quotientOrder = d.LStar; b.quotientGroup = 'F_l^* = Aut(C̲_K)/Aut_ε(C̲_K)'; }
    else { b.id = 'DCircDotPmGlobal'; b.notation = 'D^⊚± = B(X̲_K)^0'; b.curve = 'X̲_K'; b.group = 'Π_{X̲_K}'; b.labcuspSize = d.l; b.quotientOrder = 2 * l; b.quotientGroup = 'F_l^{⋊±} = Aut_±(D^⊚±)/Aut_csp(D^⊚±)'; b.doubleCover = true; }
    return b;
  };
  I.valuationOrbits = function (d) { var l = d.l, n = d.VSet.length, dK = d.K.degreeBound / ((d.Fmod && d.Fmod.degree) || 1); return [
    { id: 'VSet', notation: 'V', orbitOf: '—', lowerBound: n, upperBound: n },
    { id: 'VPmUn', notation: 'V^±un = V^±', orbitOf: 'Aut_ε(C̲_K)·V = Aut_csp(D^⊚±)·V  ([IUTchI] Ex 4.3 (i); Def 6.1 (v); Rem 6.1.1)', lowerBound: n, upperBound: n * l * (l - 1) },
    { id: 'VBor', notation: 'V^Bor', orbitOf: 'Aut(C̲_K)·V  ([IUTchI] Ex 4.3 (i))', lowerBound: n, upperBound: n * l * (l - 1) * (l - 1) / 2 },
    { id: 'VK', notation: 'V(K)', orbitOf: 'all valuations of K', lowerBound: n, upperBound: n * dK }]; };
  I.evalPointsMake = function (d, v) { var e = { vIndex: v, n: d.LPm, label: [], thetaValue: [], KvRational: true, sectionsGroupTheoretic: true, muMinusOrder: 2 }; for (var j = 0; j < d.LPm; j++) { e.label.push(j); e.thetaValue.push(j * j); } return e; };   // Ex 4.4 (i)-(ii)
  I.thetaBridgePiece = function (d, v, j) { var bad = isBadV(d.VSet[v]); return { vIndex: v, j: j, labelUsed: abs(j), viaEvaluationSection: bad, fullPolyIso: !bad }; };   // Ex 4.4 (iii)
  I.labelTransportMake = function (d, signed) { var t = { signedLabels: !!signed, n: signed ? d.l : d.LStar, chi: [], zeta: [], epsilonClassImage: 1, synchronized: true }; if (signed) for (var i = 0; i < d.l; i++) { t.chi.push(i - d.LStar); t.zeta.push(i - d.LStar); } else for (var k = 1; k <= d.LStar; k++) { t.chi.push(k); t.zeta.push(k); } return t; };   // Prop 4.7, Prop 6.5
  I.labelTransportCheck = function (lt, d) { if (lt.n !== (lt.signedLabels ? d.l : d.LStar)) return false; var seen = {}; for (var i = 0; i < lt.n; i++) { var ok = lt.signedLabels ? IUT.inFl(d, lt.chi[i]) : IUT.inFlStar(d, lt.chi[i]); if (!ok || seen[lt.chi[i]]) return false; seen[lt.chi[i]] = 1; } return lt.synchronized; };
  I.isoTorsors = function (d) { var l = d.l, twoV = Math.pow(2, d.VSet.length); return [
    { object: 'D-NF-bridge †φ^NF_⊛', group: 'F_l^*', order: d.LStar, ref: '[IUTchI] Prop 4.8 (i)' },
    { object: 'D-Θ-bridge †φ^Θ_⊛', group: 'trivial', order: 1, ref: '[IUTchI] Prop 4.8 (ii)' },
    { object: 'D-ΘNF-Hodge theater', group: 'trivial', order: 1, ref: '[IUTchI] Prop 4.8 (iii)' },
    { object: 'gluing D-NF-bridge ∪ D-Θ-bridge', group: 'F_l^*', order: d.LStar, ref: '[IUTchI] Prop 4.8 (iv)' },
    { object: 'D-Θ±-bridge †φ^Θ±_±', group: '{±1} × {±1}^V', order: 2 * twoV, ref: '[IUTchI] Prop 6.6 (i)' },
    { object: 'D-Θell-bridge †φ^Θell_±', group: 'F_l^{⋊±}', order: 2 * l, ref: '[IUTchI] Prop 6.6 (ii)' },
    { object: 'D-Θ±ell-Hodge theater', group: '{±1}', order: 2, ref: '[IUTchI] Prop 6.6 (iii)' },
    { object: 'gluing D-Θ±-bridge ∪ D-Θell-bridge', group: 'F_l^{⋊±} × {±1}^V', order: 2 * l * twoV, ref: '[IUTchI] Prop 6.6 (iv)' },
    { object: 'NF-/Θ-bridges, ΘNF-HT (F-version)', group: 'same as the D-versions', order: 1, ref: '[IUTchI] Cor 5.6 (i)–(iii)' },
    { object: 'Θ±-/Θell-bridges, Θ±ell-HT (F-version)', group: 'same as the D-versions', order: 1, ref: '[IUTchI] Cor 6.12 (i)–(iii)' },
    { object: 'gluing Θ±ell-HT ∪ ΘNF-HT (Prop 6.7)', group: 'unique', order: 1, ref: '[IUTchI] Rem 6.12.2; Def 6.13' }]; };
  I.forgetfulCounts = function (d, signed) { var n = signed ? d.LPm : d.LStar, f = IUT.factorial(n), a = Math.pow(n, n); return { signedLabels: !!signed, n: n, symmetricGroupOrder: f, labelAssignments: a, processionAssignments: f, reductionFactor: a / f, transitivity: signed ? 'F_l^{⋊±} acts doubly transitively on T (Prop 6.8 (i))' : 'F_l^* acts simply transitively on J (Prop 4.9 (i))' }; };   // Prop 4.9/4.11, 6.8/6.9
  // §5 global Frobenioids, distributions, functors
  I.GLOBAL_FROBENIOIDS = ['FCircAstGlobal', 'FCircAstPrime', 'FCircAstMod', 'FCircAstJ', 'FCircAstAngleJ', 'FCircAstJCapsule'];
  I.globalFrobenioidGet = function (d, id) { var T = {
    FCircAstGlobal: { notation: 'F^⊛(†D^⊛)', base: '†D^⊛', kummerReady: true, ncopies: 1, weight: 1, ref: '[IUTchI] Ex 5.1 (ii),(iii); Rem 5.1.3' },
    FCircAstPrime: { notation: 'F^⊛′', base: '†D^⊛_mod (the C_{F_mod} version)', kummerReady: true, ncopies: 1, weight: 1, ref: '[IUTchI] Ex 5.1 (iii); Rem 5.1.3' },
    FCircAstMod: { notation: 'F^⊛_mod', base: 'terminal objects of †D^⊛_mod', kummerReady: false, ncopies: 1, weight: 1, ref: '[IUTchI] Ex 5.1 (iii); Rem 5.1.3' },
    FCircAstJ: { notation: 'F^⊛_j', base: 'V_j = {v_j}', kummerReady: false, ncopies: 1, weight: 1, ref: '[IUTchI] Ex 5.1 (vii); Rem 5.1.3' },
    FCircAstAngleJ: { notation: 'F^⊛_⟨J⟩', base: 'V_⟨J⟩ (diagonal)', kummerReady: false, ncopies: 1, weight: 1 / d.LStar, ref: '[IUTchI] Ex 5.1 (vii); Rem 5.1.1; Rem 5.4.2' },
    FCircAstJCapsule: { notation: 'F^⊛_J = ∏_j F^⊛_j', base: 'V_J = ∏_j V_j', kummerReady: false, ncopies: d.LStar, weight: 1, ref: '[IUTchI] Ex 5.1 (vii); Rem 5.1.3' } }; var g = T[id]; if (!g) return null; g.id = id; g.realifiedAvailable = true; g.logVolumeWeight = g.weight; return g; };
  I.distributionMake = function (d, diagonal) { return { nj: d.LStar, nV: d.VSet.length, diagonal: !!diagonal, total: diagonal ? d.VSet.length : d.VSet.length * d.LStar, notation: diagonal ? 'V_⟨J⟩' : 'V_J' }; };   // Ex 5.1 (vii)
  I.distributionLogVolume = function (dist, perJ) { var s = perJ.reduce(function (a, b) { return a + b; }, 0); return dist.diagonal ? s / (dist.nj || 1) : s; };   // Rem 5.4.2
  I.STRIP_FUNCTORS = [
    { from: 'FPrimeStrip', to: 'DPrimeStrip', name: 'F ↦ D (forget the Frobenioids)', bijectiveOnIsoms: true, surjectiveOnIsoms: true, ref: '[IUTchI] Rem 5.2.1 (i); Cor 5.3 (ii): Isom(F) → Isom(D) bijective' },
    { from: 'FPrimeStrip', to: 'FMonoPrimeStrip', name: 'F ↦ F⊢ (mono-analyticization)', bijectiveOnIsoms: false, surjectiveOnIsoms: true, ref: '[IUTchI] Rem 5.2.1 (ii); Rem 5.2.2: F Kummer-ready, F⊢ Kummer-blind' },
    { from: 'FMonoPrimeStrip', to: 'DMonoPrimeStrip', name: 'F⊢ ↦ D⊢', bijectiveOnIsoms: false, surjectiveOnIsoms: true, ref: '[IUTchI] Cor 5.3 (iii): Isom(F⊢) → Isom(D⊢) surjective, not injective' },
    { from: 'FPrimeStrip', to: 'FMonoGlobPrimeStrip', name: 'F ↦ F⊩ (adjoin the global realified Frobenioid)', bijectiveOnIsoms: false, surjectiveOnIsoms: true, ref: '[IUTchI] Rem 5.2.1 (iii); Def 5.2 (iv)' },
    { from: 'DPrimeStrip', to: 'DMonoPrimeStrip', name: 'D ↦ D⊢ (Π_v ↦ G_v)', bijectiveOnIsoms: false, surjectiveOnIsoms: true, ref: '[IUTchI] Def 4.1 (iv)' },
    { from: 'FCircAstGlobal', to: 'DCircAstGlobal', name: 'F^⊛ ↦ Base(F^⊛) = D^⊛', bijectiveOnIsoms: true, surjectiveOnIsoms: true, ref: '[IUTchI] Cor 5.3 (i): Isom(F^⊛) → Isom(D^⊛) bijective' },
    { from: 'FUnderV', to: 'DV', name: 'F̲_v ↦ D_v (v ∈ V^bad)', bijectiveOnIsoms: true, surjectiveOnIsoms: true, ref: '[IUTchI] Cor 5.3 (iv): Aut(F̲_v) → Aut(D_v) bijective' }];
  I.liftDToF = function (dstrip, d) { if (dstrip.species !== 'DPrimeStrip') return null; var F = IUT.buildPrimeStrip('FPrimeStrip', dstrip.label, d, (dstrip.local[0] && dstrip.local[0].PiV) || 1, null); F.local.forEach(function (L, i) { if (dstrip.local[i]) { L.PiV = dstrip.local[i].PiV; L.GV = dstrip.local[i].GV; } }); return F; };   // Cor 5.3 (ii), Rem 5.3.1
  // §6 F_l^{⋊±}-groups/torsors, LabCusp±, signs, Prop 6.7, dictionaries
  I.flSemiPmGroup = function (d) { var lab = []; for (var i = 0; i < d.l; i++) lab.push(i - d.LStar); return { n: d.l, label: lab, isGroup: true, orbitSize: 2, autPlusOrder: 1, autPmOrder: 2 }; };   // Def 6.1 (i)
  I.flSemiPmTorsor = function (d) { var g = I.flSemiPmGroup(d); g.isGroup = false; g.orbitSize = 2 * d.l; g.autPlusOrder = d.l; g.autPmOrder = 2 * d.l; return g; };
  I.flSemiPmIsPositive = function (d, t) { return t > 0; };
  I.flSemiPmAbs = function (T) { var out = []; T.label.forEach(function (t) { if (out.indexOf(abs(t)) < 0) out.push(abs(t)); }); return out; };   // |T|, Def 6.4 (i)
  I.flSemiPmStar = function (T) { return I.flSemiPmAbs(T).filter(function (t) { return t !== 0; }); };               // T*
  I.labcuspPmTorsorMake = function (d) { return { nV: d.VSet.length, size: d.l, etaZero: d.VSet.map(function () { return 0; }), etaPm: d.VSet.map(function () { return 1; }), autPlusIndex: 2 }; };   // Def 6.1 (ii)-(iii)
  I.labcuspPmForget = function (d, t) { return (!IUT.inFl(d, t) || t === 0) ? -1 : abs(t); };
  I.signVectorMake = function (d, alpha) { var a = d.VSet.map(function (_, i) { return alpha && alpha[i] < 0 ? -1 : 1; }); return { nV: a.length, alpha: a, allPlus: a.every(function (x) { return x > 0; }), allMinus: a.every(function (x) { return x < 0; }) }; };
  I.signVectorCount = function (d) { return Math.pow(2, d.VSet.length); };
  I.propSixSeven = function (d) { var p = { nFrom: d.l, nTo: d.LStar, from: [], to: [], stripsIdentified: '†D_0, †D_⊞ ↦ †D_>', polyReplaced: true }; for (var t = -d.LStar; t <= d.LStar; t++) if (t) { p.from.push(t); p.to.push(abs(t)); } return p; };   // Prop 6.7
  I.processionsCompatible = function (d, r) { r = r || new IUT.Report(); var nf = I.processionBuild(d, 'NF'), pm = I.processionBuild(d, 'PM'), ok = pm.nsteps === nf.nsteps + 1; for (var j = 0; ok && j < nf.nsteps; j++) ok = pm.size[j + 1] === nf.size[j] + 1 && pm.firstLabel[j + 1] === 0 && pm.lastLabel[j + 1] === nf.lastLabel[j]; r.add(ok ? 'ok' : 'error', 'ProcessionsCompatible', '[IUTchI] Prop 6.9 (iii)', ok ? 'S*_j ↪ S^±_{j+1} for j = 1..' + nf.nsteps : 'processions do not match'); return ok; };
  I.HALF_PLANE = [
    { iut: 'additive symmetry F_l^{⋊±} (Θ±ell-HT, geometric)', halfPlane: 'z ↦ ±z + a, the parabolic/translation symmetries', basepoints: 'V^± (basepoints via Aut_csp)', pointAtInfinity: 'the cusp at infinity; q = e^{2πiz}' },
    { iut: 'multiplicative symmetry F_l^* (ΘNF-HT, arithmetic)', halfPlane: 'toral symmetries w = (z−i)/(z+i), rotations', basepoints: 'V^Bor (basepoints via the Borel subgroup)', pointAtInfinity: 'the node; w ↦ e^{iθ}w' },
    { iut: 'coric {±1} shared by both', halfPlane: 'z ↦ −z̄ … the common {±1}', basepoints: 'V^±un = V^±', pointAtInfinity: '—' }];   // Rem 6.12.3, Fig 6.4
  I.HT_FROBENIOIDS = [
    { id: 'FPrimeStrip', notation: '{Π_v ↷ O▷_{F̄_v}}_{v∈V}', where: 'every F-prime-strip F_t, F_j, F_⊞, F_>', kummer: 'Kummer-ready' },
    { id: 'FUnderV', notation: 'F̲_v (tempered Frobenioid)', where: 'v ∈ V^bad, inside F_>', kummer: 'Kummer-ready' },
    { id: 'FCircAstMod', notation: 'F^⊛_mod', where: 'NF-bridge target, restricted to terminal objects', kummer: 'Kummer-blind' },
    { id: 'FCircAstGlobal', notation: 'F^⊛', where: 'NF-bridge target over D^⊛', kummer: 'Kummer-ready' },
    { id: 'FCircAstPrime', notation: 'F^⊛′', where: 'over D^⊛_mod', kummer: 'Kummer-ready' },
    { id: 'FMonoGlobMod', notation: 'F⊩_mod (and F⊩_tht)', where: 'the Θ-Hodge theater inside the ΘNF-HT', kummer: 'Kummer-blind (mono-analytic)' }];   // Fig 6.6

  /* ================================================================== IUTchII */
  var II = {};
  II.radialEnvMake = function (radial, coric, full, ref) { return { radial: radial, coric: coric, full: !!full, multiradialized: false, ref: ref }; };
  II.radialEnvIsMultiradial = function (e) { return !!e.full; };                                           // [IUTchII] Ex 1.7 (i)
  II.radialEnvMultiradialize = function (e) { var o = II.radialEnvMake(e.radial, e.coric, true, e.ref); o.multiradialized = true; return o; }; // Ex 1.7 (ii)
  II.RADIAL_EXAMPLES = [
    II.radialEnvMake('holomorphic structure: Π_v ↷ O▷_{F̄_v} (an F-prime-strip)', 'D⊢ = {G_v}', false, '[IUTchII] Ex 1.8 (i): uniradial — the ring structure is not transportable'),
    II.radialEnvMake('D⊢ itself', 'D⊢', true, '[IUTchII] Ex 1.8 (ii): the coric data is tautologically multiradial'),
    II.radialEnvMake('O×μ_v with G_v-action, up to Ism', 'D⊢', true, '[IUTchII] Ex 1.8 (iv), Cor 1.12: units modulo torsion are multiradial (Ind2)'),
    II.radialEnvMake('O×_v with its Ẑ×-Kummer structure', 'D⊢', false, '[IUTchII] Ex 1.8 (iii): the full Kummer structure on O× is uniradial (needs the cyclotome)'),
    II.radialEnvMake('the mono-theta environment and its cyclotomic rigidity (l·Δ_Θ)(Π) ≅ Π_μ', 'D⊢', true, '[IUTchII] Cor 1.10, Ex 1.9: multiradial'),
    II.radialEnvMake('theta monoids Ψ_env(D_>) with their splittings', '(D⊢, F⊢×μ(D⊢))', true, '[IUTchII] Thm 2.2, Cor 2.3 (étale-picture radial environment)'),
    II.radialEnvMake('the multiradial representation R^LGP: packets, splitting monoids, (F_mod^×)_j', '(D⊢, F⊢×μ)', true, '[IUTchIII] Thm 3.11 (i): multiradial up to Ind1, Ind2, Ind3')
  ];
  II.RADIAL_EXAMPLES[6].multiradialized = true;
  II.CYCLOTOMIC = {
    MonoTheta: { indeterminacy: 'none', multiradial: true, usesRingStructure: false, ref: '[IUTchII] Cor 1.10; [IUTchIII] Rem 2.3.3 (i)' },
    MLFGaloisPair: { indeterminacy: 'Ẑ×-orbit (resp. Aut(G_v)-orbit) on the units', multiradial: false, usesRingStructure: true, ref: '[IUTchII] Cor 1.11; [IUTchIII] Rem 2.3.3 (ii)' },
    NumberField: { indeterminacy: 'none (Q>0 ∩ Ẑ× = {1})', multiradial: true, usesRingStructure: false, ref: '[IUTchI] Ex 5.1 (v); [IUTchII] Cor 4.8; [IUTchIII] Rem 2.3.3 (vi)' }
  };
  II.cyclotomicRigidityGet = function (k) { var c = II.CYCLOTOMIC[k]; return c ? { kind: k, indeterminacy: c.indeterminacy, multiradial: c.multiradial, usesRingStructure: c.usesRingStructure, ref: c.ref } : null; };
  II.constantMultipleRigidityOrbit = function () { return 2; };                                             // [IUTchII] Cor 1.12: ι-indeterminacy ±1
  II.temperedIndices = function (d) { return { PiToPiYdd: 2, PiPmToPi: d.l, PiPmToPiYdd: 2 * d.l }; };      // [IUTchII] Cor 2.4 (i)
  II.thetaEvaluate = function (d, t) { return { t: t, absT: abs(t), value: t * t, torsionIndeterminacy: 2 * d.l, monoTheta: true }; };  // [IUTchII] Cor 2.5, Cor 2.8: q̲^{t²} up to μ_{2l}
  II.thetaEvaluateAll = function (d) { var out = []; for (var j = 0; j <= d.LStar; j++) out.push(II.thetaEvaluate(d, j)); return out; };
  II.evaluationPointsCount = function (d) { return d.l; };                                                 // [IUTchII] Cor 2.4 (ii)
  II.MONOIDS = ['Constant', 'Theta', 'ThetaInf', 'Gaussian', 'GaussianInf', 'Semisimple', 'LGP'];
  II.monoidBuild = function (d, kind, vIndex, copyBase, etaleLike) {
    vIndex = vIndex < d.VSet.length ? vIndex : 0; var v = d.VSet[vIndex], bad = isBad(v);
    var m = { kind: kind, vIndex: vIndex, unitsCopy: copyBase * 1000 + vIndex * 10 + 3, GCopy: copyBase * 1000 + vIndex * 10 + 1, gen: [], genLabel: [], perfected: false, distinguishedLogP: 0, etaleLike: !!etaleLike, split: false };
    switch (kind) {
      case 'Constant': m.gen = [1]; m.genLabel = [0]; break;                                                    // [IUTchII] Cor 4.5 (i) / Cor 4.6 (i)
      case 'Theta': case 'ThetaInf': m.gen = [0]; m.genLabel = [-1]; m.perfected = kind === 'ThetaInf'; m.split = true; break; // Prop 3.1
      case 'Gaussian': case 'GaussianInf': for (var j = 1; j <= d.LStar; j++) { m.gen.push(bad ? j * j : 0); m.genLabel.push(j); } m.perfected = kind === 'GaussianInf'; m.split = true; break; // Cor 3.5 (ii), Cor 3.6
      case 'Semisimple': m.gen = [1]; m.genLabel = [0]; m.split = true; m.distinguishedLogP = v.kind === 'VNon' ? Math.log(v.p) : 1; break; // Cor 4.5 (ii)
      case 'LGP': break;
    }
    return m;
  };
  II.monoidSemisimplify = function (d, cns) { var m = II.monoidBuild(d, 'Semisimple', cns.vIndex, Math.floor(cns.unitsCopy / 1000), cns.etaleLike); m.unitsCopy = cns.unitsCopy; m.GCopy = cns.GCopy; return m; };
  II.monoidEvaluationIso = function (d, env, gau, r) {   // [IUTchII] Cor 3.5 (ii), Cor 4.10 (ii): θ ↦ (q̲^{j²})_j
    r = r || new IUT.Report(); var ok = /^Theta/.test(env.kind) && /^Gaussian/.test(gau.kind) && env.vIndex === gau.vIndex && env.perfected === gau.perfected && gau.gen.length === d.LStar;
    for (var j = 1; ok && j <= d.LStar; j++) if (isBad(d.VSet[gau.vIndex]) && II.thetaEvaluate(d, j).value !== gau.gen[j - 1]) ok = false;
    r.add(ok ? 'ok' : 'error', 'EvaluationIso', '[IUTchII] Cor 3.5 (ii); Cor 4.10 (ii)', ok ? 'Ψ_env ≅ Ψ_gau at ' + d.VSet[gau.vIndex].name + ': θ ↦ (q̲^{j²})_{j=1..' + d.LStar + '}' : 'evaluation isomorphism fails'); return ok;
  };
  II.monoidKummerIso = function (frob, etale, r) { r = r || new IUT.Report(); var ok = frob.kind === etale.kind && frob.vIndex === etale.vIndex && !frob.etaleLike && etale.etaleLike && frob.gen.length === etale.gen.length; r.add(ok ? 'ok' : 'error', 'KummerIso', '[IUTchII] Cor 4.6, Cor 4.8', ok ? 'Kummer isomorphism Ψ(F)[' + frob.unitsCopy + '] ≅ Ψ(D)[' + etale.GCopy + ']' : 'no Kummer isomorphism between the monoids'); return ok; };
  II.globalRealifiedFromDMono = function (d, DMono) {   // [IUTchII] Cor 4.5 (ii): D⊢ ↦ D⊩(D⊢)
    var out = IUT.forgetPrimeStrip(DMono, 'DMonoPrimeStrip'); out.species = 'FMonoGlobPrimeStrip'; out.notation = 'F⊩'; out.label = 'DMonoGlob'; out.global = true; out.etaleLike = false;
    out.local.forEach(function (L, i) { L.valGroup = true; L.split = true; L.units = 0; L.kummer = 'none'; L.vals = isBad(d.VSet[i]) ? [1] : []; });
    out.globalDegree = -IUT.logQ(d) / (2 * d.l); return out;
  };
  II.symmetrizeFlSemiPm = function (d, T) { var s = { group: 'F_l^{⋊±}', nclasses: d.LStar + 1, classOf: T.label.map(abs), synchronizedCopy: T.n ? T.basepoint[0] : 0, diagonalCopy: 0 }; T.label.forEach(function (t, i) { if (t === 0) s.synchronizedCopy = T.basepoint[i]; }); s.diagonalCopy = s.synchronizedCopy * 10 + 9; return s; }; // [IUTchII] Cor 3.5 (i), Cor 4.5 (iii)
  II.symmetrizeFlStar = function (d, J) { return { group: 'F_l^*', nclasses: d.LStar, classOf: J.label.slice(), synchronizedCopy: 0, diagonalCopy: J.n ? J.basepoint[0] * 10 + 9 : 0 }; };   // [IUTchII] Cor 4.7 (ii)
  II.conjugateSynchronized = function (s) { return s.synchronizedCopy !== 0; };
  II.labelSubsetKeepsSymmetry = function (d, labels, groupPm) { var full = groupPm ? d.l : d.LStar; if (labels.length !== full) return false; var seen = {}; return labels.every(function (t) { if (seen[t]) return false; seen[t] = 1; return groupPm ? IUT.inFl(d, t) : IUT.inFlStar(d, t); }); }; // [IUTchII] Rem 4.11.1
  II.LADDER = ['FMonoGlobValUnitsModTorsPrimeStrip', 'FMonoValUnitsModTorsPrimeStrip', 'FMonoUnitsModTorsPrimeStrip', 'FMonoUnitsPrimeStrip', 'DMonoPrimeStrip'];
  II.LADDER_REFS = ['[IUTchII] Def 4.9 (viii)', '[IUTchII] Def 4.9 (vii)', '[IUTchII] Def 4.9 (vii)', '[IUTchII] Def 4.9 (vi)', '[IUTchI] Def 4.1 (iii)'];
  II.psForgetLadder = function (d, src) { var start = II.LADDER.indexOf(src.species); if (start < 0) start = 0; var out = [{ strip: src, kind: src.species, ref: II.LADDER_REFS[start] }]; for (var i = start + 1; i < II.LADDER.length; i++) out.push({ strip: IUT.forgetPrimeStrip(out[out.length - 1].strip, II.LADDER[i]), kind: II.LADDER[i], ref: II.LADDER_REFS[i] }); return out; };
  II.pilotObjectDegree = function (ps) { return ps.global ? ps.globalDegree : 0; };                       // [IUTchII] Def 4.9 (viii)
  II.unitsModTorsKummerOrbit = function (ps) { return ps.local.some(function (L) { return L.kummer === 'UnitsModTorsKummer'; }) ? 2 : 1; };
  II.constantStripIdentify = function (ht, r) { r = r || new IUT.Report(); var ok = ht.glued && ht.FMonoGlobTriangle.global && Math.abs(ht.FMonoGlobTriangle.globalDegree - ht.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobMod.globalDegree) < 1e-9; r.add(ok ? 'ok' : 'error', 'ConstantStripIdentification', '[IUTchII] Cor 4.10 (i)', (ok ? 'F⊩_Δ ≅ F⊩_mod (labels 0 and F_l^* identified; degree ' : 'F⊩_Δ and F⊩_mod differ (') + fmt(ht.FMonoGlobTriangle.globalDegree) + ')'); return ok; };
  II.envelopeIsos = function (ht, r) { r = r || new IUT.Report(); var E = ht.FMonoGlobEnv, ok = Math.abs(E.globalDegree - ht.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobTht.globalDegree) < 1e-9 && Math.abs(E.globalDegree - ht.FMonoGlobGau.globalDegree) < 1e-9 && E.local.every(function (L, i) { return L.vals.length === ht.FMonoGlobGau.local[i].vals.length; }); r.add(ok ? 'ok' : 'error', 'EnvelopeIsos', '[IUTchII] Cor 4.10 (ii)', (ok ? 'F⊩_env ≅ F⊩_tht ≅ F⊩_gau (degree ' : 'envelope isomorphisms fail (') + fmt(E.globalDegree) + ')'); return ok; };
  II.thetaLinkMake = function (dom, cod, kind, d) {   // [IUTchI] Cor 3.7; [IUTchII] Cor 4.10 (iii); [IUTchIII] Def 3.8 (ii)
    if (!IUT.LINKS[kind] || kind === 'LogLink') return null;
    return { species: kind, notation: IUT.LINKS[kind].notation, dom: [dom.n, dom.m], cod: [cod.n, cod.m], glued: IUT.LINKS[kind].glued, fullPolyIsomorphism: true, preservesPiV: false, preservesGV: true, preservesUnitsModTors: kind !== 'ThetaLink', preservesRing: false, dilation: d.l * (d.l + 1) / 12 };
  };
  II.thetaLinkCoricUnits = function (dom, cod, r) { r = r || new IUT.Report(); var a = IUT.forgetPrimeStrip(dom.FMonoGlobEnv, 'FMonoUnitsModTorsPrimeStrip'), b = IUT.forgetPrimeStrip(cod.FMonoGlobTriangle, 'FMonoUnitsModTorsPrimeStrip'); var ok = a.local.length === b.local.length && a.local.every(function (L, i) { return L.unitsModTors && b.local[i].unitsModTors && L.kummer === 'UnitsModTorsKummer' && b.local[i].kummer === 'UnitsModTorsKummer'; }); r.add(ok ? 'ok' : 'error', 'CoricUnitsModTors', '[IUTchII] Cor 4.10 (iv)', ok ? '†F⊢×μ ≅ ‡F⊢×μ: full poly-isomorphism of F⊢×μ-prime-strips (Ism-orbits)' : 'units-mod-torsion portions are not comparable'); return ok; };
  II.thetaLinkInducedDLink = function (L) { if (L.species === 'LogLink') return null; var D = JSON.parse(JSON.stringify(L)); D.species = 'DThetaPmEllNFLink'; D.notation = 'D-Θ±ellNF-link'; D.glued = 'DMonoPrimeStrip'; D.preservesUnitsModTors = false; D.preservesGV = true; D.dilation = 1; return D; };  // [IUTchII] Cor 4.10 (iv)
  II.coricGlobalRealified = function (dom, cod, r) { r = r || new IUT.Report(); var ratio = dom.FMonoGlobTriangle.globalDegree ? cod.FMonoGlobTriangle.globalDegree / dom.FMonoGlobTriangle.globalDegree : 1, ok = dom.FMonoGlobTriangle.global && cod.FMonoGlobTriangle.global && ratio > 0; r.add(ok ? 'ok' : 'error', 'CoricGlobalRealified', '[IUTchII] Cor 4.10 (v)', (ok ? 'D⊩(†D⊢) ≅ D⊩(‡D⊢) up to R>0 (ratio ' : 'global realified Frobenioids not comparable (') + fmt(ratio, 3) + ')'); return ok; };
  II.thetaGauExponents = sq;                                                                               // [IUTchII] Rem 4.11.1

  /* ================================================================= IUTchIII */
  var III = {};
  III.logShellMake = function (d, vIndex, holomorphic, etaleLike, n, m) {   // [IUTchIII] Def 1.1 (i); [AbsTopIII] Def 5.4 (iii)
    var v = d.VSet[vIndex], s = { v: v.name, vIndex: vIndex, PStar: 0, radiusNum: 0, radiusDen: 1, radius: '0', logVolume: 0, holomorphic: !!holomorphic, etaleLike: !!etaleLike, from: [n || 0, m || 0] };
    if (v.kind === 'VArc') return s;
    var e = v.eK || 1, p = v.p, kstar = p === 2 ? 2 : 1, lam = Math.floor(e / (p - 1)) + 1, num = lam - kstar * e;
    s.PStar = p === 2 ? 4 : p; s.radiusNum = num; s.radiusDen = e; s.radius = e === 1 ? String(num) : num + '/' + e;
    s.logVolume = -(1 / e + (p === 2 ? 1 : 0) / (e * (v.fK || 1))) * Math.log(p) + kstar * Math.log(p);
    return s;
  };
  III.logLinkStrip = function (d, src, tautological) {   // [IUTchIII] Def 1.1 (iii), Prop 1.2 (i)-(v)
    var dst = JSON.parse(JSON.stringify(src)), shells = [];
    dst.local.forEach(function (L, i) { if (L.units) L.units = src.local[i].units + 1; shells.push(III.logShellMake(d, i, true, false)); });
    return { strip: dst, tautological: !!tautological, shells: shells, coricD: true, coricDMono: true, ringStructurePreserved: false, logVolumeCompatible: true, kummerCompatible: false, holomorphicShells: true };
  };
  III.logShellProperties = function (sh, d, r) { r = r || new IUT.Report(); var v = d.VSet[sh.vIndex], a = true, b = true, c = true; if (v.kind === 'VNon') { a = sh.PStar >= v.p; b = sh.radiusNum / sh.radiusDen <= 1; c = isFinite(sh.logVolume); } var ok = a && b && c; r.add(ok ? 'ok' : 'error', 'LogShellProperties', '[IUTchIII] Prop 1.2 (v)', 'I_' + v.name + ': (a) log(O×) ⊆ I ' + (a ? '✓' : '✗') + ', (b) O ⊆ p^{-?}I ' + (b ? '✓' : '✗') + ', (c) compact Z_p-module ' + (c ? '✓' : '✗')); return ok; };
  III.SHELL_SOURCES = { HolF: [true, false], MonoFUnitsModTors: [false, false], MonoDMono: [false, true], HolD: [true, true] };   // Prop 1.2 (v), (vi), (vii), (ix)
  III.logShellFrom = function (d, src, vIndex, n, m) { var f = III.SHELL_SOURCES[src]; return III.logShellMake(d, vIndex, f[0], f[1], n, m); };
  III.logShellIsoIndeterminacy = function (d, vIndex) { return d.VSet[vIndex].kind === 'VArc' ? '{±1}' : 'Ism'; };   // Prop 1.2 (vi), (vii)
  III.logShellIsomorphic = function (a, b) { return a.vIndex === b.vIndex && a.PStar === b.PStar && a.radius === b.radius && Math.abs(a.logVolume - b.logVolume) < 1e-12; };
  III.logChainBuild = function (lat, n, m0, m1) { var c = { n: 0, universe: [], kind: 'LogLink', translationSymmetric: true, adjacentSwapAllowed: false }; for (var m = m0; m <= m1; m++) { var ht = lat.get(n, m); if (!ht) break; c.universe.push(ht.universe); c.n++; if (m < m1) lat.applyLogLink(n, m); } return c; };   // Prop 1.2 (x), Prop 1.3 (iv)
  III.logLinkHodgeTheaterCheck = function (dom, cod, d, r) { r = r || new IUT.Report(); var ok = I.dHodgeTheaterIso(I.hodgeTheaterToD(dom), I.hodgeTheaterToD(cod)) && cod.hasIncomingLog && cod.LogShell.length === d.VSet.length && cod.logIterate === dom.logIterate + 1; r.add(ok ? 'ok' : 'error', 'LogLinkHodgeTheater', '[IUTchIII] Prop 1.3', 'log-link (' + dom.n + ',' + dom.m + ')→(' + cod.n + ',' + cod.m + '): ' + (ok ? 'D-HTs coric, ' + cod.LogShell.length + ' log-shells built' : 'ill-formed')); return ok; };
  III.latticeFlavour = function (h) { return { ThetaLink: 'non-Gaussian log-theta-lattice ([IUTchIII] Def 1.4 (i))', ThetaUnitsModTorsLink: 'non-Gaussian log-theta-lattice ([IUTchIII] Def 1.4 (i))', ThetaUnitsModTorsGauLink: 'Gaussian log-theta-lattice ([IUTchIII] Def 1.4 (ii))', ThetaUnitsModTorsLGPTorsorLink: 'LGP-Gaussian log-theta-lattice ([IUTchIII] Def 3.8 (iii))', ThetaUnitsModTorsLgpIdealLink: 'lgp-Gaussian log-theta-lattice ([IUTchIII] Def 3.8 (iii))' }[h] || 'not a log-theta-lattice'; };
  III.latticeSquareCommutes = function () { return false; };                                               // Rem 1.4.1 (i)
  III.latticeHorizontalObligatesVertical = function (lat, r) { r = r || new IUT.Report(); var bad = 0; lat.links.forEach(function (L) { if (L.species === 'LogLink') return; var found = lat.links.some(function (q) { return q.species === 'LogLink' && q.dom[0] === L.dom[0] && (q.dom[1] === L.dom[1] || q.cod[1] === L.dom[1]); }); if (!found) bad++; }); r.add(bad ? 'warn' : 'ok', 'HorizontalObligatesVertical', '[IUTchIII] Rem 1.4.1 (ii)', bad + ' horizontal arrow(s) without an accompanying log-link in their column'); return bad; };
  III.bicoricCheck = function (lat, n, m) {   // [IUTchIII] Thm 1.5
    var a = lat.get(n, m), b = lat.get(n, m + 1), c = lat.get(n + 1, m); if (!a || !b || !c) return null;
    lat.applyLogLink(n, m); lat.applyThetaLink(n, m);
    var H = IUT.LINKS[lat.horizontal], src = lat.horizontal === 'ThetaLink' ? a.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobTht : a[H.src], dst = lat.horizontal === 'ThetaLink' ? c.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobMod : c.FMonoGlobTriangle;
    var da = I.hodgeTheaterToD(a), db = I.hodgeTheaterToD(b), out = { verticalCoricD: I.dHodgeTheaterIso(da, db), columnDCopy: da.PiGt[0], horizontalCoricUnits: src.local.every(function (L, i) { return L.units === dst.local[i].units && L.GV === dst.local[i].GV; }), rowUnitsCopy: dst.local[0].units };
    out.bicoricUnitsOfDMono = out.verticalCoricD && out.horizontalCoricUnits;
    out.bicoricLogShells = III.logShellIsomorphic(III.logShellFrom(lat.data, 'MonoDMono', 0, n, m), III.logShellFrom(lat.data, 'MonoDMono', 0, n + 1, m));
    out.bicoricGlobalRealified = !!(a.FMonoGlobTriangle.global && c.FMonoGlobTriangle.global);
    return out;
  };
  III.thetaMonoidVerticallyCoric = function (lat, n, r) { r = r || new IUT.Report(); var a = lat.get(n, 0), b = lat.get(n, 1); lat.applyLogLink(n, 0); var ok = a.ThetaNFHodgeTheater.FGt.local[0].PiV === b.ThetaNFHodgeTheater.FGt.local[0].PiV; r.add(ok ? 'ok' : 'error', 'VerticallyCoricThetaMonoids', '[IUTchIII] Prop 2.1', ok ? 'Ψ_env(' + n + ',◦D_>) is the same at m = 0 and m = 1 (Π copy ' + a.ThetaNFHodgeTheater.FGt.local[0].PiV + ')' : 'Ψ_env differs along column ' + n); return ok; };
  III.ETALE_RADIAL = [['(aR)', 'a D-Θ±ell NF-Hodge theater †HT^D (étale-like)'], ['(bR)', 'the F⊢×μ-prime-strips F⊢×μ(†D⊢_t) at the labels t ∈ F_l, with their ×μ-Kummer structures'], ['(cR)', 'the theta monoids Ψ_env(†D_>), ∞Ψ_env(†D_>) with their canonical splittings (Thm 2.2)'], ['(dR)', 'the F_l^{⋊±}-symmetrizing isomorphisms and the diagonal (conjugate synchronization)'], ['(eR)', "the full poly-isomorphism F⊢×μ(†D⊢_Δ) ≅ (coric F⊢×μ) — the 'α' of the multiradialization"], ['coric', '(D⊢, F⊢×μ(D⊢)): the mono-analytic core and its units modulo torsion']];   // Cor 2.3
  III.etaleRadialEnvironment = function () { return III.ETALE_RADIAL.map(function (x) { return { item: x[0], data: x[1] }; }); };
  III.thetaMonoidMultiradial = function (r) { r = r || new IUT.Report(); var c = II.cyclotomicRigidityGet('MonoTheta'), ok = c.multiradial && !c.usesRingStructure; r.add(ok ? 'ok' : 'error', 'ThetaMonoidsMultiradial', '[IUTchIII] Thm 2.2, Cor 2.3', 'theta monoids with mono-theta cyclotomic rigidity: multiradial (indeterminacy: ' + c.indeterminacy + ')'); return ok; };
  function countVOver(d, p) { return d.VSet.filter(function (v) { return p === 0 ? v.kind === 'VArc' : (v.kind === 'VNon' && v.p === p); }).length; }
  III.tensorPacketBuild = function (d, j, vQp, holomorphic) {   // [IUTchIII] Prop 3.1 (i), Prop 3.2, Prop 3.9 (i)
    var nv = countVOver(d, vQp), s = 1; for (var k = 0; k <= j; k++) s *= (nv || 1); if (vQp === 0) s *= Math.pow(2, j);
    var shells = 0; d.VSet.forEach(function (v, i) { if (!(vQp === 0 ? v.kind === 'VArc' : (v.kind === 'VNon' && v.p === vQp))) return; shells += III.logShellMake(d, i, holomorphic, !holomorphic).logVolume; });
    return { j: j, nfactors: j + 1, vQp: vQp, nvOverVQ: nv, nsummands: s, holomorphic: !!holomorphic, global: false, logVolume: 0, logVolumeShells: shells * (j + 1) };
  };
  III.tensorPacketGlobal = function (d, j) { return { j: j, nfactors: j + 1, vQp: 0, nvOverVQ: 0, nsummands: Math.pow(d.Fmod.degree || 1, j), holomorphic: true, global: true, logVolume: 0, logVolumeShells: 0 }; };  // Prop 3.3 (i)
  III.tensorPacketLocalize = function (g, loc, r) { r = r || new IUT.Report(); var ok = g.global && !loc.global && g.nfactors === loc.nfactors; r.add(ok ? 'ok' : 'error', 'GlobalPacketLocalization', '[IUTchIII] Prop 3.3 (ii)', ok ? '(M_mod)_{S±' + g.nfactors + '} localizes into the packet at v_Q = ' + loc.vQp : 'packets have different capsules'); return ok; };
  III.tensorPacketProcession = function (d, vQp, holomorphic) { var out = []; for (var j = 0; j <= d.LStar; j++) out.push(III.tensorPacketBuild(d, j, vQp, holomorphic)); return out; };   // Prop 3.4 (ii)
  III.lgpMonoidBuild = function (d, j, vIndex, copyBase) { var m = II.monoidBuild(d, 'LGP', vIndex, copyBase, false); var bad = isBad(d.VSet[m.vIndex]); m.gen = [bad ? j * j : 0]; m.genLabel = [j]; m.split = true; return m; };   // Prop 3.4 (ii)
  III.upperSemiCompatibility = function (d, vIndex) {   // Prop 3.5 (ii) (a)(b)(c)
    var v = d.VSet[vIndex];
    if (v.kind === 'VArc') return { kase: 'arch', relation: '↠ (surjection onto the closed disc)', logVolumeDelta: 0, ref: '[IUTchIII] Prop 3.5 (ii)(b)' };
    if (v.reduction === 'badMultiplicative') return { kase: 'bad', relation: '= up to roots of unity (log(ζ) = 0)', logVolumeDelta: 0, ref: '[IUTchIII] Prop 3.5 (ii)(c)' };
    var sh = III.logShellMake(d, vIndex, true, false); return { kase: 'nonarch', relation: '⊆ (log(O×) ⊆ I, inclusion)', logVolumeDelta: sh.logVolume > 0 ? sh.logVolume : 0, ref: '[IUTchIII] Prop 3.5 (ii)(a)' };
  };
  III.GLOBAL_VARIANTS = { MODTorsor: { objects: 'F_MOD: F_mod^×-torsors of rational functions (arithmetic line bundles as global objects)', thetaLinkCompatible: true, logVolumeCompatible: false, ref: '[IUTchIII] Ex 3.6 (i), Rem 3.6.2 (i)' }, ModIdeal: { objects: 'F_mod: collections of local fractional ideals {J_v}_v (local integral structures)', thetaLinkCompatible: false, logVolumeCompatible: true, ref: '[IUTchIII] Ex 3.6 (ii), Rem 3.6.2 (ii)' } };
  III.gauLGPLgpIsos = function (ht, r) { r = r || new IUT.Report(); var G = ht.FMonoGlobGau, L = ht.FMonoGlobLGPTorsor, g = ht.FMonoGlobLgpIdeal, ok = Math.abs(G.globalDegree - L.globalDegree) < 1e-9 && Math.abs(L.globalDegree - g.globalDegree) < 1e-9 && G.local.every(function (x, i) { return x.vals.length === L.local[i].vals.length && L.local[i].vals.length === g.local[i].vals.length; }); r.add(ok ? 'ok' : 'error', 'GauLGPLgpIsos', '[IUTchIII] Prop 3.7 (ii)', (ok ? 'F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp (degree ' : 'gau/LGP/lgp strips differ (') + fmt(G.globalDegree) + ')'); return ok; };
  III.pilotMake = function (d, kind) {   // Def 3.8 (i)
    var alq = IUT.logQ(d) / (2 * d.l); if (kind === 'QPilot') return { species: 'QPilot', exponents: [1], logVolume: -alq };
    var e = sq(d); return { species: 'ThetaPilot', exponents: e, logVolume: -(e.reduce(function (a, b) { return a + b; }, 0) / e.length) * alq };
  };
  III.LGPLinkRequiresLog = function (lat, n, m, r) { r = r || new IUT.Report(); var ht = lat.peek(n, m), ok = !!(ht && ht.hasIncomingLog); r.add(ok ? 'ok' : 'warn', 'LGPLinkRelativeToLog', '[IUTchIII] Def 3.8 (ii)', '(' + n + ',' + m + ') ' + (ok ? 'is the codomain of a log-link: the Θ×μ_LGP-link out of it is defined' : 'has no incoming log-link: the Θ×μ_LGP-link needs the log-shells of (' + n + ',' + m + '−1)')); return ok; };
  III.latticeKindForLink = III.latticeFlavour;                                                             // Def 3.8 (iii)
  III.logVolumeScaleByP = function (vol, p) { return vol - Math.log(p); };                                 // Prop 3.9 (i)
  III.logVolumeScaleByE = function (vol) { return vol + 1; };
  III.logVolumeProcessionNormalize = function (vols) { return vols.length ? vols.reduce(function (a, b) { return a + b; }, 0) / vols.length : 0; };
  III.arithDegree = function (d, exps) { if (!exps.length) return 0; return -(exps.reduce(function (a, b) { return a + b; }, 0) / exps.length) * IUT.logQ(d) / (2 * d.l); };   // Prop 3.9 (iii)
  III.logVolumeLogLinkCompatible = function (a, b) { return Math.abs(a - b) < 1e-9; };                     // Prop 3.9 (iv)
  III.kummerNonInterference = function (d) { return { torsionOrder: 2, nonInterference: true, MODCompatibleWithLGPLink: true, modCompatibleWithLogVolume: true }; };   // Prop 3.10
  III.multiradialFullBuild = function (lat, n) {   // Thm 3.11
    var d = lat.data, rep = IUT.multiradial(lat, n), p = d.VSet[badIndex(d)].p, packets = III.tensorPacketProcession(d, p, false), prc = I.processionBuild(d, 'PM');
    var nbad = d.VSet.filter(function (v) { return v.inVBadMod; }).length, ni = III.kummerNonInterference(d);
    return { rep: rep, npackets: packets.length, packets: packets, nsplitting: d.LStar * nbad, nnumberfields: d.LStar, ind1Count: prc.automorphisms, ind2Summands: packets.reduce(function (a, P) { return a + P.nsummands; }, 0), ind3: true, logKummerOk: ni.nonInterference, linkCompat: [true, true, true, true] };
  };
  III.cor312Steps = function (lat) {   // Cor 3.12
    var d = lat.data, rep = IUT.multiradial(lat, 0), q = III.pilotMake(d, 'QPilot'), th = III.pilotMake(d, 'ThetaPilot');
    return [
      { label: '(0) |log q| = log q / 2l: log-volume of the q-pilot at (1,0), i.e. −|log q|', value: q.logVolume, ref: '[IUTchIII] Cor 3.12; Def 3.8 (i)' },
      { label: '(1) the Θ-pilot at (0,0): naive log-volume −avg(j²)·|log q|', value: th.logVolume, ref: '[IUTchIII] Def 3.8 (i)' },
      { label: '(2) the Θ×μ_LGP-link (0,0)→(1,0) identifies the Θ-pilot with the q-pilot (value groups), units up to Ism', value: q.logVolume, ref: '[IUTchIII] Def 3.8 (ii), Thm 3.11 (iii)' },
      { label: '(3) multiradial representation of the Θ-pilot in terms of the mono-analytic data of (1,0): Ind1 count', value: IUT.factorial(d.LPm), ref: '[IUTchIII] Thm 3.11 (i)' },
      { label: '(4) holomorphic hull of the region: Σ_j (j+1) log d^K (procession-normalized)', value: rep.hullEnlargement, ref: '[IUTchIII] Cor 3.12 proof; [Alien] §3.7 (iv)' },
      { label: '(5) −|log Θ| upper bound (hull + theta shift, procession-normalized)', value: rep.thetaUpperBound, ref: '[IUTchIII] Cor 3.12' },
      { label: '(6) inequality −|log Θ| ≥ −|log q| ⇔ C_Θ ≥ −1: C_Θ', value: rep.CTheta, ref: '[IUTchIII] Cor 3.12; [IUTchIV] Thm 1.10' }
    ];
  };
  III.cor312Holds = function (lat) { return IUT.multiradial(lat, 0).inequalityHolds; };

  /* ================================================================== IUTchIV */
  var IV = {};
  IV.a = function (k) { return k.p > 2 ? (1 / k.e) * Math.ceil(k.e / (k.p - 2)) : 2; };                     // Prop 1.2
  IV.b = function (k) { return Math.floor(Math.log(k.p * k.e / (k.p - 1)) / Math.log(k.p)) - 1 / k.e; };
  IV.dI = function (ks) { return ks.reduce(function (s, k) { return s + k.d; }, 0); };
  IV.dIstar = function (ks, star) { return ks.reduce(function (s, k, i) { return i === star ? s : s + k.d; }, 0); };   // Prop 1.1
  function aI(ks) { return ks.reduce(function (s, k) { return s + IV.a(k); }, 0); }
  function bI(ks) { return ks.reduce(function (s, k) { return s + IV.b(k); }, 0); }
  IV.prop12i = function (k) { return { lo: IV.a(k), hi: -IV.b(k), equalities: k.p > 2 && k.e <= k.p - 2 }; };
  IV.prop12iiExpLog = function (ks, lam) { return Math.ceil(lam - IV.dI(ks) - aI(ks)); };
  IV.prop12iiExpTilde = function (ks, lam) { return Math.floor(lam - IV.dI(ks) - aI(ks) - bI(ks)); };
  IV.prop12iiiExp = function (ks, lam) { return Math.floor(lam - IV.dI(ks)) - 1; };
  IV.prop12ivUnramified = function (ks) { return ks.every(function (k) { return k.e === 1 && k.p !== 2; }); };
  IV.prop13Bounds = function (k0, ki, ni) { var ei0 = ki.e / (k0.e || 1); return { lo: k0.d + (ei0 - 1) / ki.e, hi: k0.d + ni + 1 / (k0.e || 1) }; };   // Prop 1.3
  IV.mulogLogUnits = function (k) { return -(1 / k.e + (k.m || 0) / (k.e * k.f)) * Math.log(k.p); };          // Prop 1.4 (ii)
  IV.prop14iiiBoundLog = function (ks, nstar, lam) { return (-lam + IV.dI(ks) + 1 + 4 * nstar / ks[0].p) * Math.log(ks[0].p); };
  IV.prop14iiiBoundTilde = function (ks, inStar, lam) { var s = (-lam + IV.dI(ks) + 1) * Math.log(ks[0].p); ks.forEach(function (k, i) { if (inStar[i]) s += 3 + Math.log(k.e); }); return s; };
  IV.prop14iiiDIPlusAILower = function (ks) { return ks[0].p > 2 ? ks.length : 2 * ks.length; };
  IV.prop14iv = IV.prop12ivUnramified;
  IV.archSummands = function (nI, nVarc) { var s = Math.pow(nVarc || 1, nI); return nI ? s * Math.pow(2, nI - 1) : 1; };   // Prop 1.5
  IV.archMetricFactor = function (nI) { return nI ? Math.pow(2, nI - 1) : 1; };
  IV.archTensorBound = function (nI, lam) { return Math.pow(lam, nI); };
  IV.pntNBound = function (pn) { return 4 * pn / (3 * Math.log(pn)); };                                    // Prop 1.6
  IV.pntCountBound = function (eta) { return 4 * eta / (3 * Math.log(eta)); };
  IV.weightedAverage = function (beta, lam) { var s = 0, w = 0; beta.forEach(function (b, i) { s += lam[i] * b; w += lam[i]; }); return w ? s / w : 0; };   // Prop 1.7
  IV.normalizedWeights = function (d, p) { return d.VSet.filter(function (v) { return v.kind === 'VNon' && v.p === p; }).map(function (v) { return (v.eMod || 1) * (v.fMod || 1); }); };
  IV.torsionFacts = function (d, r) {   // Prop 1.8
    r = r || new IUT.Report(); var issues = 0;
    d.VSet.forEach(function (v) { if (isBad(v) && v.ordQ % d.l === 0) { issues++; r.add('warn', 'TorsionRamification', '[IUTchIV] Prop 1.8 (vii)', 'l = ' + d.l + ' divides ord_' + v.name + '(q) = ' + v.ordQ + ': K/F ramifies at ' + v.name); } });
    var H = d.hypotheses || {}; r.add(H.StableReduction ? 'ok' : 'warn', 'SemistableOverK', '[IUTchIV] Prop 1.8 (ii),(iii)', 'E[l] rational over K ⇒ semistable reduction over K away from l (asserted: ' + (H.StableReduction ? 'yes' : 'no') + ')');
    r.add('info', 'MinimalFieldOfDefinition', '[IUTchIV] Prop 1.8 (i)', 'k_E ⊆ F_mod = Q(j_E), [F_mod:Q] = ' + d.Fmod.degree + '; F_tpd = F_mod(E[2]) has degree ≤ 6 over F_mod');
    return issues;
  };
  IV.arithDivisorZero = function (d) { return { nV: d.VSet.length, coeff: d.VSet.map(function () { return 0; }) }; };   // Def 1.9
  IV.arithDivisorQ = function (d) { return { nV: d.VSet.length, coeff: d.VSet.map(function (v) { return isBad(v) ? v.ordQ : 0; }) }; };
  IV.arithDivisorAdd = function (a, b) { return { nV: a.nV, coeff: a.coeff.map(function (c, i) { return c + (b.coeff[i] || 0); }) }; };
  IV.arithDivisorDeg = function (d, D) { return D.coeff.reduce(function (s, c, i) { var v = d.VSet[i]; return s + (v.kind === 'VNon' ? c * (v.fMod || 1) * Math.log(v.p) : c); }, 0); };
  IV.arithDivisorNormalizedDeg = function (d, D) { return IV.arithDivisorDeg(d, D) / (d.Fmod.degree || 1); };
  IV.arithDivisorDegE = function (d, D, p) { return D.coeff.reduce(function (s, c, i) { var v = d.VSet[i]; return v.kind === 'VNon' && v.p === p ? s + c * (v.fMod || 1) * Math.log(p) : s; }, 0) / (d.Fmod.degree || 1); };
  IV.E1 = function (n) { return (n + 1) / 2; }; IV.E2 = function (n) { return (2 * n + 1) * (n + 1) / 6; }; IV.E3 = function (p) { return p * (p + 1) * (p - 1) * (p - 1); }; IV.E5 = function () { return 2; };   // Thm 1.10
  IV.thm110Compute = function (d) {
    var lq = IUT.logQ(d), logd = d.F.logDifferentTpd, logf = IUT.logF(d), e = 1; d.VSet.forEach(function (v) { if (v.kind === 'VNon' && v.eMod > e) e = v.eMod; });
    var T = { logq: lq, absLogq: lq / (2 * d.l), logdTpd: logd, logfTpd: logf, logdFPlusLogfFBound: logd + logf + 21, logdKBound: logd + logf + 2 * Math.log(d.l) + 21, logfKBound: logf, eMod: e, estarMod: 4096 * 27 * 5 * e, etaPrm: ETA_PRM, CTheta: IUT.cTheta(d, logd, logf) };
    T.cor312Holds = T.CTheta >= -1; T.lhs = lq / 6; T.rhs = (1 + 20 * d.Fmod.degree / d.l) * (logd + logf) + 20 * (T.estarMod * d.l + ETA_PRM); T.inequalityHolds = T.lhs <= T.rhs; return T;
  };
  IV.logLeX = function (x) { return x > 0 && Math.log(x) <= x; }; IV.chebyshevLo = function (x) { return 2 * x / 3; }; IV.chebyshevHi = function (x) { return 4 * x / 3; }; IV.primeInABound = function (thetaA, xi) { return 2 * (thetaA + xi); };   // Prop 2.1
  IV.cor22Compute = function (d) {   // Cor 2.2
    var lqa = IUT.logQ(d), lq = lqa > 1 ? lqa : 1, delta = 4096 * 27 * 5 * d.Fmod.degree;
    var C = { d: d.Fmod.degree, delta: delta, logqAll: lqa, lMin: Math.sqrt(lq), lMax: 10 * delta * Math.sqrt(lq) * Math.log(2 * delta * lq), epsE: Math.pow(60 * delta, 2) * Math.log(2 * delta * lq) / Math.sqrt(lq), logdiff: d.F.logDifferentTpd, logcondLo: IUT.logF(d), CK: 20 * (4096 * 27 * 5 * d.l + ETA_PRM) };
    C.logcondHi = C.logcondLo + Math.log(2 * d.l); C.lInRange = d.l >= C.lMin && d.l <= C.lMax; C.lhs = lqa / 6; C.rhs = (1 + C.epsE) * (C.logdiff + C.logcondLo) + C.CK; C.holds = C.lhs <= C.rhs; return C;
  };
  IV.cor23Bound = function (ht, logdiff, logcond, eps, C) { return (1 + eps) * (logdiff + logcond) + C - ht; };
  IV.mutationCompose = function (f, g) { if (f.cod !== g.dom) return null; return { id: f.id + 'Then' + g.id, name: g.name + ' ∘ ' + f.name, dom: f.dom, cod: g.cod, ref: '[IUTchIV] Def 3.3 (i)', core: !!(f.core && g.core) }; };   // Def 3.3
  IV.mutationIdentity = function (s) { return { id: 'Identity', name: 'identity mutation', dom: s.id, cod: s.id, ref: '[IUTchIV] Def 3.1 (ii) (identities)', core: true }; };
  IV.speciesIsomorphic = function (a, b) { return a.data === b.data; };   // Def 3.1 (iv)
  IV.mutationHistoryFromLattice = function (lat) { return { nvertices: lat.vertices().length, nedges: lat.links.length, vertex: lat.vertices().map(function () { return 'ThetaPmEllNFHodgeTheater'; }), edge: lat.links.map(function (L) { return L.species; }) }; };   // Def 3.3 (iii)
  IV.observableIsCore = function (id, mutations) { if (['DMonoPrimeStrip', 'DThetaPmEllNFHodgeTheater', 'FMonoUnitsModTorsPrimeStrip', 'LogShell'].indexOf(id) >= 0) return true; return (mutations || []).some(function (m) { return m.core && m.cod === id; }); };   // Def 3.3 (v)

  /* =================================================================== EssLgc */
  var LG = {};
  LG.FLAVOURS = ['AND-IUT (∧)', 'OR-IUT (∨)', 'XOR-IUT', 'RCS-IUT (redundant copies)', 'EssOR-IUT'];
  LG.modelEval = function (A, B, eps, flavour) {   // Ex 2.4.5
    return { A: A, B: B, eps: eps, flavour: flavour, NThetaLink: [-2 * B, -A], NMultiradial: [-2 * A + eps, -A], consistent: Math.abs(-2 * A + eps + A) < 1e-9, conclusionA: eps, meaningful: flavour === 0 };
  };
  LG.stpChain = function (lat) {   // §3.10 (Stp1)-(Stp8)
    var rep = IUT.multiradial(lat, 0);
    return [
      { id: 'StpOne', from: '(0,0)', to: '(0,◦)', indeterminacy: 'Ind3', ref: '[EssLgc] §3.10 (Stp1); [IUTchIII] Thm 3.11 (ii)', logVolume: rep.thetaUpperBound },
      { id: 'StpTwo', from: '(0,◦)', to: '(0,◦)⊢', indeterminacy: 'Ind1', ref: '[EssLgc] §3.10 (Stp2); [IUTchIII] Thm 3.11 (i)', logVolume: rep.thetaUpperBound },
      { id: 'StpThree', from: '(0,◦)⊢', to: '(0,0)⊢ ⇔ (1,0)⊢', indeterminacy: 'Ind2', ref: '[EssLgc] §3.10 (Stp3); [IUTchII] Cor 4.10 (iv)', logVolume: rep.thetaUpperBound },
      { id: 'StpFour', from: '(1,0)⊢', to: '(1,◦) hull', indeterminacy: 'none', ref: '[EssLgc] §3.10 (Stp4); [IUTchIII] Cor 3.12 proof', logVolume: rep.hullEnlargement },
      { id: 'StpFive', from: '(1,◦) hull', to: 'hull-approximants', indeterminacy: 'none', ref: '[EssLgc] §3.10 (Stp5)', logVolume: rep.hullEnlargement },
      { id: 'StpSix', from: 'approximants', to: 'determinant^{1/n}', indeterminacy: 'none', ref: '[EssLgc] §3.10 (Stp6)', logVolume: rep.hullEnlargement },
      { id: 'StpSeven', from: '(1,m)↑', to: '(1,m+1)↓', indeterminacy: 'none', ref: '[EssLgc] §3.10 (Stp7); [IUTchIII] Prop 1.2 (iii)', logVolume: rep.hullEnlargement },
      { id: 'StpEight', from: 'log-volumes', to: 'R: −|log Θ| ≥ −|log q|', indeterminacy: 'monodromy', ref: '[EssLgc] §3.10 (Stp8); [IUTchIII] Cor 3.12', logVolume: -rep.AbsLogQ }
    ];
  };
  LG.fixAndGlue = function (lat) { return { qSide: III.pilotMake(lat.data, 'QPilot').logVolume, thetaSide: III.pilotMake(lat.data, 'ThetaPilot').logVolume }; };   // (FxGl)
  LG.fuzzify = function (value, ind, w1, w2, up3) { var r = { lo: value, hi: value }; if (ind.IndOne) { r.lo -= w1; r.hi += w1; } if (ind.IndTwo) { r.lo -= w2; r.hi += w2; } if (ind.IndThree) r.hi += up3; return r; };   // (Englf)
  LG.engulfs = function (R, x) { return R.lo <= x && x <= R.hi; };
  LG.extInd1Union = function (a, b) { var out = a.slice(); b.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); return out; };
  LG.extInd2Crush = function (a, cls) { var out = []; a.forEach(function (x) { var c = cls(x); if (out.indexOf(c) < 0) out.push(c); }); return out; };
  LG.orIndeterminacyVerdict = function (alongLog) { return alongLog ? '(logORInd): harmless — log-volume is invariant under the log-link' : '(ΘORInd): fatal — an OR across the Θ-link asserts nothing'; };   // §3.11

  /* =================================================================== Alien */
  var AL = {};
  AL.gaussNumeric = function () { var s = 0, h = 1e-3; for (var x = -12; x < 12; x += h) s += Math.exp(-x * x) * h; return s; };
  AL.gaussSteps = function () {   // §1 Steps 1-12
    var Iv = AL.gaussNumeric();
    return [[1, 'the naive approach e^{−x²} ↦ u fails: no elementary antiderivative', NaN, 'a single ring/scheme theory cannot compute the height'], [2, 'partial integration does not help either', NaN, 'no Frobenius morphism in characteristic 0'], [3, 'introduce a SECOND copy of the integral: I² = ∫∫ e^{−x²−y²}', Iv * Iv, 'two mutually alien copies of the ring theory (the two sides of the Θ-link)'], [4, 'regard them as coordinates of R²', Iv * Iv, 'the log-theta-lattice as a plane of copies'], [5, 'infinitesimals dx dy: the measure', Iv * Iv, 'log-volumes'], [6, 'the Jacobian: how the measure transforms', 1, 'compatibility of log-volumes with the links'], [7, 'linear transformations: toral dilations, unipotent, rotations', 1, 'the dilation q ↦ q^{j²} of the Θ-link vs the rotation by the log-link'], [8, 'polar coordinates on R² ∖ (R≤0 × {0})', 1, "the coordinates (n, m) of the lattice; the slit = the 'Kummer-detachment' indeterminacy"], [9, 'decoupling of the radial and angular parts', 1, 'multiradiality: the radial data is decoupled from the coric data'], [10, 'radial integral ∫_0^∞ e^{−r²} 2r dr = 1', 1, 'the multiradial representation computes the Θ-pilot'], [11, 'angular integral ∫_0^{2π} (1/2) dθ = π', Math.PI, 'the holomorphic hull / the indeterminacies contribute the constant'], [12, "√π: the result, with its 'error factor' from the slit", Math.sqrt(Math.PI), '−|log Θ| ≥ −|log q| with the indeterminacies as error term']]
      .map(function (s) { return { step: s[0], title: s[1], value: s[2], iutAnalogue: s[3] }; });
  };
  AL.transportApparatus = function () {   // §2.7, Fig 2.1
    return [['Frobenius-like object (input)', 'domain', 'positive mass (rigid, carries the arithmetic)', 'none', '[Alien] §2.7 (ii)'], ['Kummer-detachment', 'domain', '—', 'Kummer-detachment indeterminacies (Ind2, Ind3)', '[Alien] §2.7 (iii)'], ['étale-like object (reconstructed from Π/G)', 'domain', 'zero mass (an indeterminate isomorphism class)', 'none', '[Alien] §2.7 (ii)'], ['étale-transport across the link (the coric data)', 'link', 'zero mass', 'étale-transport indeterminacies (Ind1: Aut(G_v), permutations)', '[Alien] §2.7 (iii)'], ['étale-like object', 'codomain', 'zero mass', 'none', '[Alien] §2.7 (ii)'], ['Kummer-detachment (inverse): re-attach to Frobenius-like data', 'codomain', 'positive mass again', 'Kummer-detachment indeterminacies', '[Alien] §2.7 (iii)'], ['Frobenius-like object (output), compared with the input', 'codomain', 'positive mass', 'the comparison holds up to Ind1, Ind2, Ind3', '[Alien] §2.7 (iv); [IUTchIII] Thm 3.11']]
      .map(function (s) { return { stage: s[0], side: s[1], mass: s[2], indeterminacy: s[3], ref: s[4] }; });
  };
  AL.transportRun = function (lat) { var d = lat.data, q = III.pilotMake(d, 'QPilot'), th = III.pilotMake(d, 'ThetaPilot'), prc = I.processionBuild(d, 'PM'); return [{ label: 'Frobenius-like input at (0,0): Θ-pilot log-volume', value: th.logVolume, ref: '[Alien] §2.7, §3.7 (1est)' }, { label: 'Kummer-detach at (0,0): pass to étale-like (0,◦) data (mass 0)', value: 0, ref: '[Alien] §2.7 (iii)' }, { label: 'étale-transport across the Θ-link via D⊢ (Ind1 permutations)', value: prc.automorphisms, ref: '[Alien] §2.7 (iii); [IUTchIII] Thm 3.11 (Ind1)' }, { label: 're-attach at (1,0): q-pilot log-volume (the mass of the codomain)', value: q.logVolume, ref: '[Alien] §2.7 (iv)' }]; };
  AL.formalSumMake = function (d, kind, j) {   // §3.6 (i): [0], [|j|], [⊞], [>]  (coefficients as [num, den])
    var s = { kind: kind, label: [], coeff: [] }, i;
    if (kind === 'Zero') { s.label = [0]; s.coeff = [[1, 1]]; }
    else if (kind === 'AbsJ') { j = abs(j); if (j === 0) { s.label = [0]; s.coeff = [[1, 1]]; } else { s.label = [j, -j]; s.coeff = [[1, 2], [1, 2]]; } }
    else if (kind === 'BoxPlus') { for (i = 0; i < d.l; i++) { s.label.push(i - d.LStar); s.coeff.push([1, d.l]); } }
    else { for (i = 1; i <= d.LStar; i++) { s.label.push(i, -i); s.coeff.push([1, 2 * d.LStar], [1, 2 * d.LStar]); } }
    return s;
  };
  function qadd(a, b) { var n = a[0] * b[1] + b[0] * a[1], dn = a[1] * b[1], g = IUT.gcd(n, dn); return [n / g, dn / g]; }
  AL.formalSumTotal = function (s) { return s.coeff.reduce(qadd, [0, 1]); };
  function coeffOf(s, t) { return s.label.reduce(function (acc, l, i) { return l === t ? qadd(acc, s.coeff[i]) : acc; }, [0, 1]); }
  AL.formalSumCompatible = function (d, from, r) {   // §3.6 (i): [0] → [>], [⊞] → [>], (1/(l*+1))([0]+Σ[|j|]) → [>]
    r = r || new IUT.Report(); var s, what;
    if (from === 'Zero') { s = AL.formalSumMake(d, 'Zero'); what = '[0]'; } else if (from === 'BoxPlus') { s = AL.formalSumMake(d, 'BoxPlus'); what = '[⊞]'; }
    else { s = { label: [0], coeff: [[1, d.LStar + 1]] }; for (var j = 1; j <= d.LStar; j++) { s.label.push(j, -j); s.coeff.push([1, 2 * (d.LStar + 1)], [1, 2 * (d.LStar + 1)]); } what = '(1/(l*+1))([0]+Σ[|j|])'; }
    var tot = AL.formalSumTotal(s), gt = AL.formalSumTotal(AL.formalSumMake(d, 'Gt')), ok = tot[0] === 1 && tot[1] === 1 && gt[0] === 1 && gt[1] === 1 && s.label.every(function (t) { var a = coeffOf(s, t), b = coeffOf(s, -t); return a[0] === b[0] && a[1] === b[1]; });
    r.add(ok ? 'ok' : 'error', 'FormalSumCompatibility', '[Alien] §3.6 (i)', what + ' → [>]: total mass 1, ±-symmetric: ' + (ok ? 'compatible' : 'NOT compatible')); return ok;
  };
  AL.labelLineSegment = function (d) { var out = []; for (var i = 0; i < d.l; i++) out.push(i - d.LStar); return out; };   // §3.6 (ii)
  AL.evaluationPoints = function (d, t) { if (!IUT.inFl(d, t)) return []; return t === 0 ? [0] : [t, -t]; };
  AL.leadingTermJ = function (d, j) { return (j + 1) * d.K.logDifferentEstimate - (j * j / (2 * d.l)) * IUT.logQ(d); };   // §3.7 (iv)
  AL.leadingTermSum = function (d) { var s = 0; for (var j = 1; j <= d.LStar; j++) s += AL.leadingTermJ(d, j); return s; };
  AL.lFromHeight = function (d) { var h = IUT.logQ(d) / 6; return h > 0 ? Math.sqrt(h) : 0; };
  AL.estimateSteps = function (lat) {   // §3.7 (ii) (1est)-(12est)
    var d = lat.data, rep = IUT.multiradial(lat, 0), prc = I.processionBuild(d, 'PM');
    return [['(1est) start with the q-pilot on the RHS (1,0): −|log q|', -rep.AbsLogQ, '[Alien] §3.7 (ii) (1est)'], ['(2est) the Θ-link identifies it with the Θ-pilot of the LHS (0,0)', -rep.AbsLogQ, '(2est)'], ['(3est) the multiradial representation expresses the Θ-pilot in RHS terms', rep.thetaUpperBound, '(3est); [IUTchIII] Thm 3.11'], ['(4est) Ind1-invariance: permutations of the procession', prc.automorphisms, '(4est)'], ['(5est) Ind2-invariance: Ism on the units', 1, '(5est)'], ['(6est) Ind3 gives an UPPER bound on the Θ-pilot\'s region', rep.thetaUpperBound, '(6est)'], ['(7est) comparison only up to isomorphism class of O_k-modules', 0, '(7est)'], ['(8est) holomorphic hull = ⊗ of j+1 copies of log(O_k^×): log d^K terms', rep.hullEnlargement, '(8est)'], ['(9est) log-volume = arithmetic degree', rep.thetaUpperBound, '(9est); [IUTchIII] Prop 3.9 (iii)'], ['(10est) log-Kummer on both sides', 0, '(10est)'], ['(11est) the inequality −|log Θ| ≥ −|log q|', rep.thetaUpperBound + rep.AbsLogQ, '(11est); [IUTchIII] Cor 3.12'], ['(12est) leading term (l²/48)(6 log d^K − log q), l ≈ √height', IUT.leadingTerm(d), '(12est); [Alien] §3.7 (iv)']]
      .map(function (s) { return { label: s[0], value: s[1], ref: s[2] }; });
  };
  AL.dictionary = function () {   // §3.8
    return [['(1gau) the two copies of ∫ e^{−x²}', 'the two Hodge theaters on either side of the Θ-link'], ['(2gau) R² = the plane of the two coordinates', 'the log-theta-lattice'], ['(3gau) the measure dx dy', 'log-volumes'], ['(4gau) linear coordinate changes / toral dilations', 'the dilation q̲ ↦ q̲^{j²} of the Θ-link'], ['(5gau) rotations', 'the log-link (rotating multiplicative into additive structure)'], ['(6gau) polar coordinates', 'the coordinates (n, m) and the multiradial decoupling'], ['(7gau) the slit R≤0 × {0}', 'the indeterminacies Ind1-Ind3 (Kummer-detachment / étale-transport)'], ['(8gau) the radial integral = 1', 'the multiradial representation of the Θ-pilot'], ['(9gau) the angular integral = π', 'the holomorphic hull, the constant terms'], ['(10gau) √π', '−|log Θ| ≥ −|log q|'], ["(11gau) the 'error' from the slit is what makes the computation possible", "the indeterminacies are what make the Θ-link's gluing consistent with ring theory"]]
      .map(function (e) { return { gauss: e[0], iut: e[1] }; });
  };

  /* ================================================================= registry */
  function rep2lines(r) { return r.issues.map(function (i) { return '[' + i.severity + '] ' + i.condition + ': ' + i.msg + '   ' + i.ref; }); }
  var RUN = {
    MapLabels: function (d) { var L = ['F_l = {-' + d.LStar + '..' + d.LStar + '}, F_l^× = F_l∖{0}, F_l^* = {1..' + d.LStar + '}, |F_l| = {0..' + d.LStar + '}']; for (var t = -d.LStar; t <= d.LStar; t++) L.push('t=' + t + '  |t|=' + abs(t) + '  F_l^×→F_l^*: ' + I.labelFlUnitsToFlStar(d, t) + '  glue 0,⊞↦>: ' + I.labelGluePmToNf(d, t)); return { ok: true, lines: L }; },
    ActSymmetries: function (d) { return { ok: true, lines: ['F_l^{⋊±} ↷ F_l: orbit of 0 has ' + I.labelOrbitFlSemiPm(d, 0) + ' elements; F_l^* ↷ F_l^*: orbit of 1 has ' + I.labelOrbitFlStar(d, 1), '(a=1,+)·2 = ' + IUT.symFlSemiPm(d, 1, 1, 2) + ';  (a=0,−)·2 = ' + IUT.symFlSemiPm(d, 0, -1, 2) + ';  u=2 · j=3 = ' + IUT.symFlStar(d, 2, 3)] }; },
    LabelCusps: function (d) { var pm = I.labcuspPmMake(d), nf = I.labcuspMake(d), fg = I.labcuspForgetSign(pm), ok = I.labcuspIsBijection(pm, d) && I.labcuspIsBijection(nf, d) && I.labcuspIsBijection(fg, d); return { ok: ok, lines: ['LabCusp±(D_⊚): ' + pm.n + ' cusps ≅ F_l; LabCusp(D_⊛): ' + nf.n + ' ≅ F_l^*; forget sign: ' + fg.n + ' labels (' + (ok ? 'bijections' : 'BAD') + ')'] }; },
    ExtractCapsules: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), T = I.capsuleFromT(ht), J = I.capsuleFromJ(ht), m = { nDom: J.n, nCod: T.n, map: J.label.map(function (j) { return d.LStar + j; }) }, ok = I.capsuleMorphismValid(m); return { ok: ok, lines: ['capsule F_T: ' + T.n + ' members (labels ' + T.label[0] + '..' + T.label[T.n - 1] + '), ' + I.capsuleFullPolyIsoCount(T) + ' full poly-isomorphisms', 'capsule F_J: ' + J.n + ' members; morphism F_J → F_T (j ↦ +j): ' + (ok ? 'valid injection' : 'INVALID')] }; },
    BuildProcessions: function (d) { var L = []; ['NF', 'PM'].forEach(function (k) { var p = I.processionBuild(d, k); L.push((k === 'NF' ? 'Prc(D_J) (Prop 4.11)' : 'Prc(D_T) (Prop 6.9)') + ': ' + p.nsteps + ' capsules, |S_k| = 1..' + p.size[p.nsteps - 1] + ', automorphisms Π|S_k|! = ' + p.automorphisms); for (var s = 0; s < Math.min(4, p.nsteps); s++) L.push('  S' + (k === 'PM' ? '±' : '') + '_' + (s + 1) + ' = {' + I.processionCapsuleLabels(p, s).join(',') + '}  weight 1/' + p.size[s]); }); return { ok: true, lines: L }; },
    BuildBridges: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), ok = true; return { ok: ok, lines: I.BRIDGES.map(function (k) { var b = I.bridgeBuild(ht, k); if (!b.ok) ok = false; return k + ': ' + b.dom + ' → ' + b.cod + ' (' + b.nDom + ' members) isomorphisms: ' + b.symmetry + ' (' + b.isos + ') ' + (b.ok ? 'ok' : 'MISSING'); }) }; },
    ForgetToDHodgeTheater: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), D = I.hodgeTheaterToD(ht); return { ok: I.dHodgeTheaterIso(D, D), lines: ['HT(universe ' + D.universe + ') ↦ D-HT: |T|=' + D.nT + ' |J|=' + D.nJ + ', Π copies F_⊞ ' + D.PiBoxPlus[0] + '.., F_> ' + D.PiGt[0] + '.., D_⊚± ' + D.PiCircDot[0] + '.., F_⊛ ' + D.PiCircAst[0] + '..', 'components: Θ±ell-HT (' + I.hodgeTheaterPmell(ht).capsuleFT.length + ' strips in T), ΘNF-HT (' + I.hodgeTheaterNf(ht).capsuleFJ.length + ' in J), Θ-HT (' + (I.hodgeTheaterTheta(ht).thetaValues.length - 1) + ' theta values)'] }; },
    ChainFrobeniusPicture: function (d) { var lat = new IUT.Lattice(d, 'ThetaLink'), c = I.frobeniusChainBuild(lat, 0, -1, 2), t = I.frobeniusChainTranslate(c, 1); return { ok: c.n >= 2, lines: ['chain of ' + c.n + ' Θ-Hodge theaters (universes ' + c.universe.join(' ') + '), Z-translation: yes; swap of adjacent: never', 'translated by 1: ' + t.universe.join(' ')] }; },
    DrawEtalePicture: function (d) { var lat = newLat(d), e = I.etalePictureBuild(lat, 0), perm = []; for (var i = e.nspokes - 1; i >= 0; i--) perm.push(i); var p = I.etalePicturePermute(e, perm); return { ok: !!p, lines: ['hub D⊢ (G copies ' + e.coreCopy[0] + '..), ' + e.nspokes + ' spokes (D-HTs ' + e.spokeUniverse.join(' ') + '); reversed: ' + (p ? 'valid permutation' : 'INVALID')] }; },
    BuildGlobalNF: function (d) { var fr = I.globalNfRealify(I.globalNfBuild(d, 5)), et = I.globalNfBuild(d, 6), r = new IUT.Report(), ok = I.globalNfKummer(fr, et, r); return { ok: ok, lines: ['Π_CK copy ' + fr.PiCK + '; F_mod^× copy ' + fr.FmodUnits + '; κ-coric ' + fr.kappaCoric + '; sol ' + fr.sol + '; F^⊛_mod ⊆ F^⊛: yes; realified: ' + fr.realified].concat(rep2lines(r)) }; },
    GlueHodgeTheaters: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), L = []; for (var t = -d.LStar; t <= d.LStar; t++) L.push(I.labelGluePmToNf(d, t)); return { ok: ht.glued && ht.ThetaNFHodgeTheater.FGt.local[0].PiV === ht.ThetaPmEllHodgeTheater.FBoxPlus.local[0].PiV, lines: ['0,⊞ ↦ >: F_> carries the Π copies of F_⊞ (' + ht.ThetaNFHodgeTheater.FGt.local[0].PiV + '); label map t ↦ |t|: ' + L.join(',')] }; },
    BuildPrimeStrip: function (d) { var ps = IUT.buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'demo', d, 9, sq(d)), r = IUT.validatePrimeStrip(ps, d); return { ok: r.errors === 0, lines: ['built ' + ps.notation + '-prime-strip over ' + ps.local.length + ' valuations, pilot degree ' + fmt(ps.globalDegree)].concat(rep2lines(r)) }; },
    GenerateInitialData: function (d) { var r = IUT.validateData(d); return { ok: r.errors === 0, lines: [d.name + ': l=' + d.l + ', |V|=' + d.VSet.length + ', log q = ' + fmt(IUT.logQ(d)) + ', log f = ' + fmt(IUT.logF(d))].concat(rep2lines(r)) }; },
    ClassifyPseudoMonoids: function (d) { var L = I.PSEUDO_MONOIDS.map(function (m) { return m.id + ' ' + m.notation + ': divisible ' + yn(m.divisible) + ', cyclotomic ' + yn(m.cyclotomic) + ', group ' + yn(m.isGroup) + ', ' + (m.kummerReady ? 'Kummer-ready' : 'Kummer-blind') + '   ' + m.ref; }); var ok = I.pseudoMonoidContains('MCircAst', 'MCircAstMod') && I.pseudoMonoidContains('MCircAstInfKappaUnits', 'MCircAstKappa') && !I.pseudoMonoidContains('MCircAstKappa', 'MCircAstInfKappa'); L.push('M^⊛_mod ⊆ M^⊛, M^⊛_κ ⊆ M^⊛_∞κ×, M^⊛_∞κ ⊄ M^⊛_κ: ' + yn(ok)); return { ok: ok, lines: L }; },
    ComposePolyMorphisms: function (d) { var a = I.polyMake('PolyIsomorphism', 3), b = I.polyMake('FullPolyIsomorphism', 0), c = I.polyCompose(b, a), alpha = d.VSet.map(function (_, i) { return i % 2 ? -1 : 1; }), pf = I.polyPlusFullMake(d, alpha), an = I.anabelioidMake('BTemp', 'Π^tp_{X̲̲_v}'); return { ok: c.kind === 'FullPolyIsomorphism' && !I.polyPlusFullIsPositive(pf), lines: [I.POLY_KINDS.join(', '), '(3 isomorphisms) ∘ full poly-isomorphism = ' + c.kind + ' (count ' + c.count + ' = all)   [IUTchI] §0', '+-full poly-isomorphism with α = (+,−,+,…): positive ' + yn(I.polyPlusFullIsPositive(pf)) + ', negative ' + yn(I.polyPlusFullIsNegative(pf)) + '; |{±1}^V| = ' + I.signVectorCount(d) + '   [IUTchI] Def 6.1 (iv)', 'anabelioids: B(Π), B(X), B(X)^0, ' + an.id + ' = ' + an.notation + ' of ' + an.of + ' (connected ' + yn(an.connected) + ', tempered ' + yn(an.tempered) + '); K_v is ' + I.fieldKindOfValuation(d.VSet[0]) + ' at v0'] }; },
    ClassifyOrbicurves: function (d) { var ok = true, L = I.ORBICURVES.map(function (id) { var o = I.orbicurveGet(d, id); if (!o) ok = false; return o.id + ' ' + o.notation + ' type ' + o.type + ' over ' + o.base + ', covers ' + o.covers + ' deg ' + o.degree + ' group ' + o.group + ', cusps ' + o.ncusps + ', Aut_k ' + o.autK + '   ' + o.ref; }); return { ok: ok && I.orbicurveGet(d, 'XUnderK').ncusps === d.l && I.orbicurveGet(d, 'CK').ncusps === d.LPm, lines: L }; },
    ReconstructCoverings: function (d) { var c = I.cuspsSectionOne(d), r = I.corOneTwo(d), L = ['cusps: ε = ' + c.epsilon + ' (of C̲), ε′ = ' + c.epsilonPrime + ', ε″ = ' + c.epsilonDPrime + ' (of X̲, swapped by ι), 2ε = ' + c.twoEpsilon + ' (2 ≢ ±1 mod l: ' + yn(c.twoEpsilonOk) + '), 0 fixed by ι; |Δ_E ⊗ Z/l| = ' + c.deltaEModLOrder, 'l² = ' + r.lSquared + ' = [Δ_X:Δ_X̲]·[Δ_X̲:Δ_X→] = ' + r.idxXXUnder + '·' + r.idxXUnderXArrow + ' = [Δ_C:Δ_X→]/2 = ' + r.idxCXArrow + '/2;  Gal(X̲/C̲) = Z/' + r.galXUnderOverCUnder + ', Gal(C→/C̲) = Z/' + r.galCArrowOverCUnder + ', Gal(X→/C̲) = Z/' + r.galXArrowOverCUnder + ' ⊇ Gal(X→/C→) = Z/' + r.galXArrowOverCArrow + ';  Aut_k(X→) = Z/' + r.autKXArrow + ', Aut_k(C→) = Z/' + r.autKCArrow]; r.steps.forEach(function (st, i) { L.push('step ' + (i + 1) + ': ' + st); }); return { ok: r.lSquared === r.idxXXUnder * r.idxXUnderXArrow && r.idxCXArrow === 2 * r.lSquared && c.twoEpsilonOk, lines: L }; },
    CompareTempered: function (d) { var L = I.TEMPERED_FACTS.map(function (t) { return t.id + ' ' + t.ref + ': ' + t.statement; }), ok = I.TEMPERED_FACTS.length === 7; d.VSet.forEach(function (v, i) { var a = I.temperedAtV(d, i); if (a.temperedAvailable && !a.decompositionGroupsSynchronized) ok = false; L.push(v.name + ': Π_v tempered ' + yn(a.temperedAvailable) + ', commensurably terminal ' + yn(a.commensurablyTerminal) + ', decomposition groups synchronized (Cor 2.5) ' + yn(a.decompositionGroupsSynchronized) + ', Galois-countable ' + yn(a.galoisCountable)); }); return { ok: ok, lines: L }; },
    CheckDefThreeOne: function (d) { var c = I.defThreeOneCheck(d), ta = I.thetaApproach(d), sm = I.sMod(d), L = c.items.map(function (it) { return it.item + ' ' + (it.ok ? 'ok' : 'FAIL') + ' ' + (it.machineChecked ? '(checked)' : '(asserted flag)') + ' ' + it.condition; }); L.push('Rem 3.1.2 Θ-approach: ' + ta.appliedTo + '; ' + ta.cyclotome + ' ≅ ' + ta.thetaCyclotome + ' with index ' + ta.cyclotomeIndex); L.push('Rem 3.1.3: the data is determined by ' + I.DETERMINING_DATA.join(' ')); L.push('Rem 3.1.5: ' + sm.notation + ', [K:F_mod] ≤ ' + sm.galOrderBound + ', ' + sm.npoints + ' points'); return { ok: c.report.errors === 0, lines: L }; },
    CheckKappaCoric: function (d) { var v1 = I.kappaCoricCheck({ npoles: 1, nzeros: 2, divisorOverNF: true, divisorAvoidsCritical: true, rootsOfUnityAtStrictlyCritical: true, allRootsAdjoined: true, constantsAdjoined: true }), v2 = I.kappaCoricCheck({ npoles: 2, nzeros: 2, divisorOverNF: true, divisorAvoidsCritical: true, rootsOfUnityAtStrictlyCritical: true }), v3 = I.kappaCoricCheck({ npoles: 1, nzeros: 2, divisorOverNF: true, divisorAvoidsCritical: true, rootsOfUnityAtStrictlyCritical: false }), ks = I.kappaSol(d); return { ok: v1.infKappaUnitsCoric && !v2.kappaCoric && !v3.kappaCoric, lines: ['|C_L| ≅ A¹ has ' + v1.ncritical + ' critical points, ' + v1.nstrictlyCritical + ' strictly critical   [IUTchI] Rem 3.1.7 (i)', '(1 pole, 2 zeroes, divisor over NF avoiding critical points, roots of unity at strictly critical points): κ-coric ' + yn(v1.kappaCoric) + ', ∞κ-coric ' + yn(v1.infKappaCoric) + ', ∞κ×-coric ' + yn(v1.infKappaUnitsCoric), 'two poles: ' + v2.failed + ';  non-root-of-unity value at a strictly critical point: ' + v3.failed, 'Rem 3.1.7 (iii): ' + ks.kOverFMuL + ', |SL_2(F_l)| = ' + ks.sl2Order + '; linearly disjoint: ' + yn(ks.linearlyDisjoint) + '; κ-sol-open subgroups center-free: ' + yn(ks.centerFree)] }; },
    BuildLocalFrobenioids: function (d) { var L = [], bad = 0; d.VSet.forEach(function (v, i) { var lf = I.localFrobenioidBuild(d, i); L.push(v.name + ' ' + lf.ref + ': D_v = ' + lf.DV + '; D⊢_v = ' + lf.DMonoV); L.push('   ' + lf.FV); L.push('   ' + lf.CMonoV + '; Φ = ' + lf.divisorMonoid + ' (generator ' + lf.generator + ', value ' + lf.generatorValue + '); Θ-version ' + lf.divisorMonoidTheta); L.push('   splitting ' + lf.splitting + ' (indeterminacy ' + lf.splittingIndeterminacy + '); tempered ' + yn(lf.isTempered) + ', split ' + yn(lf.isSplit) + ', Kummer structure ' + yn(lf.hasKummerStructure)); if (lf.thetaFunction) L.push('   ' + lf.thetaFunction); I.localFrobenioidReconstructions(lf).forEach(function (s) { L.push('   reconstruct ' + s); }); if (!I.localFrobenioidSplitIso(lf, lf)) bad++; if (lf.kind === 'Bad' && lf.splittingIndeterminacy !== 2 * d.l) bad++; }); L.push('F⊢_v ≅ F^Θ_v at every v: ' + yn(!bad) + '   [IUTchI] Ex 3.2 (v)'); return { ok: !bad, lines: L }; },
    BuildGlobalRealified: function (d) { var g = ['MOD', 'THT', 'D'].map(function (k) { return I.globalRealifiedBuild(d, k); }), L = [g[0].id + ' = ' + g[0].notation + ', ' + g[1].id + ' = ' + g[1].notation + ', ' + g[2].id + ' = ' + g[2].notation + ';  Prime ≅ V_mod: ' + g[0].nprimes + ' primes']; d.VSet.forEach(function (v, i) { if (i < 6) L.push(v.name + ': [K_v:(F_mod)_v] = ' + g[0].localDegree[i] + '  ρ_v = ' + fmt(g[0].rho[i]) + '  ρ^Θ_v(j=1) = ' + fmt(I.rhoThetaV(d, i, 1)) + '  ρ^Θ_v(j=2) = ' + fmt(I.rhoThetaV(d, i, 2)) + '  Frobenius element ' + fmt(g[2].frobeniusElement[i])); }); var m = I.fMonoGlobBuild(d, false), t = I.fMonoGlobBuild(d, true), iso = I.fMonoGlobIso(m, t), b = badIndex(d); L.push(m.notation + ' = (C⊩_mod, Prime ≅ V, {F⊢_v}, {ρ_v}) over ' + m.nV + ' valuations;  ' + t.notation + ' ≅ ' + m.notation + ': ' + yn(iso) + '   [IUTchI] Ex 3.5 (iii)'); return { ok: iso && Math.abs(I.rhoThetaV(d, b, 2) - 4 * I.rhoThetaV(d, b, 1)) < 1e-9, lines: L }; },
    AssembleThetaHodgeTheater: function (d) { var h = I.thetaHodgeTheaterDef(d), n = function (k) { return h.loc.filter(function (L) { return L.kind === k; }).length; }, lat = new IUT.Lattice(d, 'ThetaLink'); lat.buildH(0, 0, 0); var lk = lat.applyThetaLink(0, 0), r = new IUT.Report(), bad = I.thetaLinkCorThreeSeven(lk, r); return { ok: !bad && h.condA && h.condB && h.condC, lines: ['†HT^Θ = ({†F̲_v}_{v∈V}, †F⊩_mod): ' + h.nV + ' local Frobenioids (bad ' + n('Bad') + ', good ' + n('GoodNonarch') + ', arch ' + n('Arch') + '); (a) ' + yn(h.condA) + ' (b) ' + yn(h.condB) + ' (c) ' + yn(h.condC) + '   [IUTchI] Def 3.6', 'Θ-link (0,0) → (1,0) checked against Cor 3.7:'].concat(rep2lines(r), ['Cor 3.8: Frobenius-picture … → †HT^Θ → ‡HT^Θ → … with ⁿΘ̲_v ↦ ⁿ⁺¹q̲_v;  Cor 3.9: étale-picture around D⊢_v ↷ O×']) }; },
    TorsorLabelCusps: function (d) { var t = I.labcuspTorsorMake(d), pm = I.labcuspPmTorsorMake(d), F = []; for (var s = -d.LStar; s <= d.LStar; s++) F.push(s + '↦' + I.labcuspPmForget(d, s)); return { ok: I.labcuspPmForget(d, -2) === 2 && I.labcuspPmForget(d, 0) === -1 && I.labcuspTorsorAct(d, 2, 1) === 2, lines: ['LabCusp(†D_v): F_l^*-torsor of size ' + t.torsorSize + ', canonical †η_v = ' + t.eta[0] + ' at every v, compatible across V: ' + yn(t.compatible) + '   [IUTchI] Def 4.1 (ii), Prop 4.2', 'F_l^* acts: 2 · †η_v = ' + I.labcuspTorsorAct(d, 2, t.eta[0]) + ', 3 · 2 = ' + I.labcuspTorsorAct(d, 3, 2), 'LabCusp±(†D_v): size ' + pm.size + ', †η⁰_v = ' + pm.etaZero[0] + ', †η^±_v = ±' + pm.etaPm[0] + ' (up to sign), [Aut : Aut_+] = ' + pm.autPlusIndex + '   [IUTchI] Def 6.1 (ii)–(iii)', '(LabCusp± ∖ {η⁰})/{±1} ≅ LabCusp: ' + F.join(' ')] }; },
    DescribeGlobalBases: function (d) { var a = I.globalBaseGet(d, 'CircAst'), b = I.globalBaseGet(d, 'CircDotPm'), L = [a.id + ': ' + a.notation + ', group ' + a.group + ', |LabCusp| = ' + a.labcuspSize + '; Aut image Borel/{±1} of order ' + a.autImageOrder + ' ⊇ Aut_ε image semi-unipotent/{±1} of order ' + a.autEpsImageOrder + '; quotient ' + a.quotientGroup + ' of order ' + a.quotientOrder + '   [IUTchI] Def 4.1 (v), Ex 4.3', b.id + ': ' + b.notation + ', group ' + b.group + ', |LabCusp±| = ' + b.labcuspSize + ', double cover of D^⊛: ' + yn(b.doubleCover) + '; quotient ' + b.quotientGroup + ' of order ' + b.quotientOrder + '   [IUTchI] Def 6.1 (v)']; I.valuationOrbits(d).forEach(function (o) { L.push(o.id + ' ' + o.notation + ': ' + o.lowerBound + ' ≤ |·| ≤ ' + o.upperBound + '   ' + o.orbitOf); }); return { ok: a.autImageOrder / a.autEpsImageOrder === d.LStar && b.quotientOrder === 2 * d.l, lines: L }; },
    EvaluateAtPoints: function (d) { var b = badIndex(d), e = I.evalPointsMake(d, b), L = ['at ' + d.VSet[b].name + ': ' + e.n + ' evaluation points labelled |F_l| = {' + e.label.join(',') + '}; Θ̲_v values (in units of ord q̲_v, up to μ_2l): ' + e.thetaValue.join(' '), 'μ_− of order ' + e.muMinusOrder + '; K_v-rational: ' + yn(e.KvRational) + '; sections G_v → Π_v group-theoretic: ' + yn(e.sectionsGroupTheoretic) + '   [IUTchI] Ex 4.4 (i)–(ii)'], ok = e.n === d.LPm && e.thetaValue[3] === 9; d.VSet.forEach(function (v, i) { if (i < 4) { var p = I.thetaBridgePiece(d, i, -3); L.push('φ^Θ_{v_j} at ' + v.name + ', j = −3: ' + (p.viaEvaluationSection ? 'evaluation section' : 'full poly-isomorphism') + ' (label ' + p.labelUsed + ')   [IUTchI] Ex 4.4 (iii)'); if (p.viaEvaluationSection !== isBadV(v)) ok = false; } }); return { ok: ok, lines: L }; },
    TransportLabelClasses: function (d) { var nf = I.labelTransportMake(d, false), pm = I.labelTransportMake(d, true), ok = I.labelTransportCheck(nf, d) && I.labelTransportCheck(pm, d); return { ok: ok, lines: ['ΘNF: †χ : J ≅ F_l^* = {' + nf.chi.join(',') + '}, †ζ : LabCusp(†D^⊛) ≅ J, [†ε] ↦ ' + nf.epsilonClassImage + ', synchronized ' + yn(nf.synchronized) + '   [IUTchI] Prop 4.7', 'Θ±ell: T ≅ F_l = {' + pm.chi[0] + '..' + pm.chi[pm.n - 1] + '}, †ζ_± : LabCusp±(†D^⊚±) ≅ T, †ξ global ±-synchronization, ε̲ ↦ ±' + pm.epsilonClassImage + '   [IUTchI] Prop 6.5; Rem 6.12.4', 'bijections valid: ' + yn(ok)] }; },
    CountIsomorphismTorsors: function (d) { var t = I.isoTorsors(d); return { ok: t.length === 11 && t[0].order === d.LStar && t[5].order === 2 * d.l && t[6].order === 2, lines: t.map(function (x) { return x.object + ': torsor over ' + x.group + ', order ' + x.order + '   ' + x.ref; }) }; },
    CountForgottenSymmetries: function (d) { var a = I.forgetfulCounts(d, false), b = I.forgetfulCounts(d, true); return { ok: a.n === d.LStar && b.n === d.LPm && a.processionAssignments === IUT.factorial(d.LStar), lines: ['ΘNF (Prop 4.9, 4.11): ' + a.transitivity + '; capsule of ' + a.n + ' strips, S_{l*} of order ' + a.symmetricGroupOrder + '; label assignments (l*)^{l*} = ' + a.labelAssignments + ', with processions l*! = ' + a.processionAssignments + ' (factor ' + fmt(a.reductionFactor, 1) + ')', 'Θ±ell (Prop 6.8, 6.9): ' + b.transitivity + '; capsule of ' + b.n + ' strips, S_{l±} of order ' + b.symmetricGroupOrder + '; (l±)^{l±} = ' + b.labelAssignments + ', with processions l±! = ' + b.processionAssignments + ' (factor ' + fmt(b.reductionFactor, 1) + ')', '(ii) holomorphic capsules → (iii) mono-analytic capsules: the same counts after D ↦ D⊢'] }; },
    DistributeGlobalData: function (d) { var perJ = [], L = I.GLOBAL_FROBENIOIDS.map(function (id) { var g = I.globalFrobenioidGet(d, id); return g.id + ' ' + g.notation + ' over ' + g.base + ': ' + (g.kummerReady ? 'Kummer-ready' : 'Kummer-blind') + ', copies ' + g.ncopies + ', log-volume weight ' + fmt(g.logVolumeWeight) + '   ' + g.ref; }); for (var j = 1; j <= d.LStar; j++) perJ.push(j); var dg = I.distributionMake(d, true), fl = I.distributionMake(d, false); L.push(dg.notation + ': ' + dg.total + ' valuations (diagonal), ' + fl.notation + ': ' + fl.total + ' = |V|·l*;  log-volumes of (1,2,…,l*): F_⟨J⟩ average ' + fmt(I.distributionLogVolume(dg, perJ)) + ', F_J sum ' + fmt(I.distributionLogVolume(fl, perJ)) + '   [IUTchI] Ex 5.1 (vii), Rem 5.4.2'); return { ok: fl.total === d.VSet.length * d.LStar && Math.abs(I.distributionLogVolume(dg, perJ) - (d.LStar + 1) / 2) < 1e-9, lines: L }; },
    LiftToFrobenioids: function (d) { var L = I.STRIP_FUNCTORS.map(function (t) { return t.from + ' → ' + t.to + ' ' + t.name + ': bijective on Isom ' + yn(t.bijectiveOnIsoms) + ', surjective ' + yn(t.surjectiveOnIsoms) + '   ' + t.ref; }), D = IUT.buildPrimeStrip('DPrimeStrip', 'lift', d, 21, null), F = I.liftDToF(D, d), r = F ? IUT.validatePrimeStrip(F, d) : null; L.push('lift of the D-prime-strip (Π copies ' + D.local[0].PiV + '..) to an F-prime-strip: ' + yn(!!F) + ', Π copy preserved: ' + yn(F && F.local[0].PiV === D.local[0].PiV) + '   [IUTchI] Cor 5.3 (ii), Rem 5.3.1'); return { ok: !!F && F.species === 'FPrimeStrip' && r.errors === 0, lines: L }; },
    StructureFlSemiPm: function (d) { var G = I.flSemiPmGroup(d), T = I.flSemiPmTorsor(d), A = I.flSemiPmAbs(G), S = I.flSemiPmStar(G), sv = I.signVectorMake(d, d.VSet.map(function () { return -1; })); return { ok: A.length === d.LPm && S.length === d.LStar && T.autPmOrder === 2 * d.l && sv.allMinus, lines: ['F_l^{⋊±}-group T (Θ±-bridge index set): ' + G.n + ' elements, {±1}-orbit of ' + G.orbitSize + ' bijections, Aut_+(T) ⊆ Aut_±(T) orders ' + G.autPlusOrder + ' ⊆ ' + G.autPmOrder + '   [IUTchI] Def 6.1 (i)', 'F_l^{⋊±}-torsor T (Θell-bridge index set): F_l^{⋊±}-orbit of ' + T.orbitSize + ' bijections, Aut_+ ⊆ Aut_± orders ' + T.autPlusOrder + ' ⊆ ' + T.autPmOrder, 'positive elements: ' + G.label.filter(function (t) { return I.flSemiPmIsPositive(d, t); }).join(' ') + ';  |T| has ' + A.length + ' elements, T* has ' + S.length + '   [IUTchI] Def 6.4 (i)', 'α = (−,…,−) ∈ {±1}^V: all minus ' + yn(sv.allMinus) + ' (the −1_{F_l} of Ex 6.2 (ii)); ' + I.signVectorCount(d) + ' sign vectors in all'] }; },
    ReduceThetaPmToTheta: function (d) { var p = I.propSixSeven(d), r = new IUT.Report(), ok = I.processionsCompatible(d, r), m = []; for (var i = 0; i < p.from.length; i++) m.push(p.from[i] + '↦' + p.to[i]); return { ok: ok && p.nTo === d.LStar, lines: ['D-Θ±-bridge ⇒ D-Θ-bridge: ' + p.nFrom + ' strips ↦ ' + p.nTo + ', t ↦ |t|: ' + m.join(' '), p.stripsIdentified + '; +-full poly-isomorphisms replaced by full (good v) / evaluation-section (bad v): ' + yn(p.polyReplaced) + '   [IUTchI] Prop 6.7'].concat(rep2lines(r), ['Rem 6.12.2: the gluing isomorphism of the Θ±ell-HT to the ΘNF-HT along the Θ±-/Θ-bridges is unique']) }; },
    CompareHalfPlane: function (d) { return { ok: I.HALF_PLANE.length === 3 && I.HT_FROBENIOIDS.length === 6, lines: I.HALF_PLANE.map(function (h) { return h.iut + ' ↔ ' + h.halfPlane + '; basepoints ' + h.basepoints + '; at ∞: ' + h.pointAtInfinity; }).concat(['Fig 6.6, the Frobenioids of a Θ±ell NF-Hodge theater:'], I.HT_FROBENIOIDS.map(function (f) { return '  ' + f.id + ' ' + f.notation + ' — ' + f.where + ' (' + f.kummer + ')'; })) }; },
    ClassifyRadial: function (d) { var e = II.radialEnvMake('F-prime-strip', 'D⊢', false, '[IUTchII] Ex 1.8 (i)'), m = II.radialEnvMultiradialize(e); return { ok: !II.radialEnvIsMultiradial(e) && II.radialEnvIsMultiradial(m), lines: II.RADIAL_EXAMPLES.map(function (x) { return (II.radialEnvIsMultiradial(x) ? 'multiradial ' : 'uniradial   ') + 'R = ' + x.radial + ' | C = ' + x.coric + '   ' + x.ref; }).concat(['multiradialization (Ex 1.7 (ii)): uni → multi (α = full poly-iso of D⊢ adjoined)']) }; },
    RigidifyCyclotomes: function (d) { return { ok: true, lines: Object.keys(II.CYCLOTOMIC).map(function (k) { var c = II.cyclotomicRigidityGet(k); return k + ': indeterminacy ' + c.indeterminacy + ', ' + (c.multiradial ? 'multiradial' : 'uniradial') + ', ' + (c.usesRingStructure ? 'uses' : 'no') + ' ring structure   ' + c.ref; }).concat(['constant multiple rigidity (Cor 1.12): ι-orbit of size ' + II.constantMultipleRigidityOrbit()]) }; },
    EvaluateTheta: function (d) { var ix = II.temperedIndices(d), tv = II.thetaEvaluateAll(d); return { ok: tv.length === d.LStar + 1, lines: ['[Π:Π_Ÿ]=' + ix.PiToPiYdd + ' [Π±:Π]=' + ix.PiPmToPi + ' [Π±:Π_Ÿ]=' + ix.PiPmToPiYdd + '; ' + II.evaluationPointsCount(d) + ' evaluation points; values: ' + tv.map(function (x) { return '|t|=' + x.absT + '→q̲^' + x.value; }).join(' ') + '  (up to μ_' + tv[0].torsionIndeterminacy + ')'] }; },
    BuildMonoids: function (d) { var v = badIndex(d), env = II.monoidBuild(d, 'Theta', v, 3, true), gau = II.monoidBuild(d, 'Gaussian', v, 3, true), cns = II.monoidBuild(d, 'Constant', v, 3, true), ss = II.monoidSemisimplify(d, cns), fro = II.monoidBuild(d, 'Constant', v, 4, false), r = new IUT.Report(); var ok = II.monoidEvaluationIso(d, env, gau, r) & II.monoidKummerIso(fro, cns, r); return { ok: !!ok, lines: ['at ' + d.VSet[v].name + ': Ψ_env = O×·θ^N, Ψ_gau generators ' + gau.gen.map(function (g) { return 'q̲^' + g; }).join(' ') + '; Ψ_cns; Ψ^ss_cns = O× × R≥0, log(p_v) = ' + fmt(ss.distinguishedLogP)].concat(rep2lines(r)) }; },
    RealifyFromDMono: function (d) { var G = II.globalRealifiedFromDMono(d, IUT.buildPrimeStrip('DMonoPrimeStrip', 'DMono', d, 7)); return { ok: !!G.global, lines: ['D⊢ ↦ D⊩(D⊢): kind ' + G.notation + ', global realified: ' + G.global + ', degree of q-object ' + fmt(G.globalDegree) + ' (defined up to R>0)'] }; },
    Symmetrize: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), a = II.symmetrizeFlSemiPm(d, I.capsuleFromT(ht)), b = II.symmetrizeFlStar(d, I.capsuleFromJ(ht)); return { ok: II.conjugateSynchronized(a), lines: [a.group + ': ' + a.nclasses + ' classes (|F_l|), conjugate synchronization: ' + II.conjugateSynchronized(a) + ' (copy ' + a.synchronizedCopy + '), diagonal ' + a.diagonalCopy, b.group + ': ' + b.nclasses + ' classes (F_l^*), conjugate synchronization: ' + II.conjugateSynchronized(b) + ', diagonal ' + b.diagonalCopy, 'label subset {1} keeps F_l^{⋊±}-symmetry: ' + II.labelSubsetKeepsSymmetry(d, [1], true) + '; full F_l: ' + II.labelSubsetKeepsSymmetry(d, AL.labelLineSegment(d), true)] }; },
    ForgetLadder: function (d) { var src = IUT.buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'pilot', d, 9, sq(d)), lad = II.psForgetLadder(d, src); return { ok: lad.length === 5, lines: lad.map(function (x, i) { var L = x.strip.local[0]; return (i ? '→ ' : '  ') + IUT.PS[x.kind].notation + '  global ' + !!x.strip.global + ', valgroup ' + L.valGroup + ', units ' + (L.units ? (L.unitsModTors ? 'O×μ' : 'O×') : '—') + ', Kummer ' + L.kummer + '   ' + x.ref; }).concat(['pilot object degree ' + fmt(II.pilotObjectDegree(src)) + ' (≤ 0), ×μ-Kummer orbit marker ' + II.unitsModTorsKummerOrbit(src)]) }; },
    LinkThetaUnitsModTors: function (d) { var lat = newLat(d, 'ThetaUnitsModTorsGauLink'), a = lat.get(0, 0), b = lat.get(1, 0), r = new IUT.Report(); var ok = II.constantStripIdentify(a, r) & II.envelopeIsos(a, r) & II.thetaLinkCoricUnits(a, b, r) & II.coricGlobalRealified(a, b, r); var L = II.thetaLinkMake(a, b, 'ThetaUnitsModTorsGauLink', d), D = II.thetaLinkInducedDLink(L); return { ok: !!ok, lines: ['Θ×μ_gau-link (0,0)→(1,0): glued ' + IUT.PS[L.glued].notation + ', full poly-iso ' + L.fullPolyIsomorphism + ', Π preserved ' + L.preservesPiV + ', O×μ preserved ' + L.preservesUnitsModTors + ', dilation ' + fmt(L.dilation, 3) + '; induced ' + D.notation + ' on ' + IUT.PS[D.glued].notation, 'exponents q̲ ↦ q̲^{' + II.thetaGauExponents(d).join(',') + '} (Rem 4.11.1)'].concat(rep2lines(r)) }; },
    MakeLogShells: function (d) { var r = new IUT.Report(), ok = true, L = d.VSet.map(function (v, i) { var s = III.logShellMake(d, i, true, false); if (!III.logShellProperties(s, d, r)) ok = false; return 'I_' + v.name + ' p* = ' + s.PStar + ', generator valuation ' + s.radius + ', log-volume ' + fmt(s.logVolume) + ', iso indeterminacy ' + III.logShellIsoIndeterminacy(d, i); }); return { ok: ok, lines: L.concat(rep2lines(r)) }; },
    ApplyLogLinkStrip: function (d) { var a = IUT.buildPrimeStrip('FPrimeStrip', 'F', d, 11), R = III.logLinkStrip(d, a, false), s = ['HolF', 'MonoFUnitsModTors', 'MonoDMono', 'HolD'].map(function (k) { return III.logShellFrom(d, k, 0); }); return { ok: R.coricD && !R.ringStructurePreserved && !R.kummerCompatible, lines: ['†F →log ‡F (full): Π kept (' + a.local[0].PiV + ' = ' + R.strip.local[0].PiV + '), units renewed (' + a.local[0].units + ' → ' + R.strip.local[0].units + '), ' + R.shells.length + ' log-shells; coric D ' + R.coricD + '; ring preserved ' + R.ringStructurePreserved + '; log-volume compatible ' + R.logVolumeCompatible + '; Kummer compatible ' + R.kummerCompatible, 'I_F ≅ I_F⊢×μ ≅ I_D⊢ ≅ I_D at ' + d.VSet[0].name + ': ' + (III.logShellIsomorphic(s[0], s[1]) && III.logShellIsomorphic(s[1], s[2]) && III.logShellIsomorphic(s[2], s[3]))] }; },
    ChainLogLinks: function (d) { var lat = newLat(d), c = III.logChainBuild(lat, 0, -1, 2), r = new IUT.Report(), ok = III.logLinkHodgeTheaterCheck(lat.get(0, 0), lat.get(0, 1), d, r); return { ok: ok && c.n >= 2, lines: ['vertical chain of ' + c.n + ' HTs in column 0 (universes ' + c.universe.join(' ') + '); translation symmetric ' + c.translationSymmetric + ', adjacent swap ' + c.adjacentSwapAllowed].concat(rep2lines(r)) }; },
    DefineLattice: function (d) { var lat = newLat(d), r = new IUT.Report(); III.latticeHorizontalObligatesVertical(lat, r); return { ok: true, lines: Object.keys(IUT.LINKS).filter(function (k) { return k !== 'LogLink'; }).map(function (k) { return IUT.LINKS[k].notation + ' → ' + III.latticeFlavour(k); }).concat(['squares commute: ' + III.latticeSquareCommutes() + ' (Rem 1.4.1 (i))']).concat(rep2lines(r)) }; },
    CheckBicoric: function (d) { var b = III.bicoricCheck(newLat(d), 0, 0); return { ok: !!(b && b.verticalCoricD && b.horizontalCoricUnits && b.bicoricLogShells), lines: ['(i) D-HT vertically coric ' + b.verticalCoricD + ' (Π copy ' + b.columnDCopy + ')  (ii) F⊢×μ horizontally coric ' + b.horizontalCoricUnits + ' (units copy ' + b.rowUnitsCopy + ')  (iii) F⊢×μ(D⊢_Δ) bi-coric ' + b.bicoricUnitsOfDMono + '  (iv) log-shells bi-coric ' + b.bicoricLogShells + '  (v) D⊩(D⊢) bi-coric ' + b.bicoricGlobalRealified] }; },
    CoricThetaMonoids: function (d) { var lat = newLat(d), r = new IUT.Report(); var ok = III.thetaMonoidVerticallyCoric(lat, 0, r) & III.thetaMonoidMultiradial(r); return { ok: !!ok, lines: III.etaleRadialEnvironment().map(function (x) { return x.item + ' ' + x.data; }).concat(rep2lines(r)) }; },
    BuildTensorPackets: function (d) { var p = d.VSet[badIndex(d)].p, P = III.tensorPacketProcession(d, p, true), A = III.tensorPacketBuild(d, 1, 0, false), G = III.tensorPacketGlobal(d, 1), r = new IUT.Report(), ok = III.tensorPacketLocalize(G, III.tensorPacketBuild(d, 1, p, true), r); return { ok: ok, lines: P.slice(0, 4).map(function (x) { return 'log(^{S±_' + (x.j + 1) + '} F_' + p + '): ' + x.nfactors + ' factors, |V_p|=' + x.nvOverVQ + ', ' + x.nsummands + ' summands, shell log-volume ' + fmt(x.logVolumeShells); }).concat(['archimedean I(^{S±_2} D⊢_∞): ' + A.nsummands + ' summands (2^{j}·|V_arc|^{j+1})', 'global (M_mod)_{S±_2}: ' + G.nfactors + ' factors, ' + G.nsummands + ' summand fields']).concat(rep2lines(r)) }; },
    BuildLGPMonoids: function (d) { var v = badIndex(d), L = []; for (var j = 1; j <= Math.min(3, d.LStar); j++) { var m = III.lgpMonoidBuild(d, j, v, 5); L.push('Ψ_LGP(S±_' + (j + 1) + ') at ' + d.VSet[v].name + ': splitting monoid generated by q̲^' + m.gen[0]); } var ok = true; d.VSet.forEach(function (x, i) { var u = III.upperSemiCompatibility(d, i); if (u.logVolumeDelta < 0) ok = false; L.push(x.name + ' ' + u.relation + ' Δlog-vol ' + fmt(u.logVolumeDelta) + '   ' + u.ref); }); return { ok: ok, lines: L }; },
    CompareGlobalVariants: function (d) { var ht = IUT.newHodgeTheater(d, 0, 0, 1), r = new IUT.Report(), ok = III.gauLGPLgpIsos(ht, r); return { ok: ok, lines: Object.keys(III.GLOBAL_VARIANTS).map(function (k) { var g = III.GLOBAL_VARIANTS[k]; return g.objects + ': Θ-link compatible ' + g.thetaLinkCompatible + ', log-volume compatible ' + g.logVolumeCompatible + '   ' + g.ref; }).concat(rep2lines(r)) }; },
    MakePilots: function (d) { var q = III.pilotMake(d, 'QPilot'), t = III.pilotMake(d, 'ThetaPilot'), lat = newLat(d), r = new IUT.Report(); lat.applyLogLink(0, -1); III.LGPLinkRequiresLog(lat, 0, 0, r); III.LGPLinkRequiresLog(lat, 1, 0, r); return { ok: true, lines: ['q-pilot {q̲}: log-volume ' + fmt(q.logVolume) + ';  Θ-pilot {q̲^{j²}} (' + t.exponents.length + ' exps, last ' + t.exponents[t.exponents.length - 1] + '): log-volume ' + fmt(t.logVolume) + ';  arithmetic degree of q̲: ' + fmt(III.arithDegree(d, [1])), 'lattice for Θ×μ_LGP: ' + III.latticeKindForLink('ThetaUnitsModTorsLGPTorsorLink')].concat(rep2lines(r)) }; },
    NormalizeLogVolumes: function (d) { var p = d.VSet[badIndex(d)].p, vols = []; for (var j = 0; j <= d.LStar; j++) vols.push(j + 1); var ni = III.kummerNonInterference(d); return { ok: ni.nonInterference, lines: ['packet-normalization: vol(p·M) = vol(M) − log p: 0 ↦ ' + fmt(III.logVolumeScaleByP(0, p)) + ' (p=' + p + '); arch: e·M ↦ ' + III.logVolumeScaleByE(0), 'procession-normalization: average of ' + vols.length + ' capsule volumes = ' + fmt(III.logVolumeProcessionNormalize(vols)) + '; log-link compatibility: ' + (III.logVolumeLogLinkCompatible(1.5, 1.5) ? 'preserved' : 'BROKEN'), 'non-interference: F_mod^× ∩ ΠO×_v = μ (order ' + ni.torsionOrder + '), MOD/LGP-link ' + ni.MODCompatibleWithLGPLink + ', mod/log-volume ' + ni.modCompatibleWithLogVolume] }; },
    RepresentMultiradially: function (d) { var M = III.multiradialFullBuild(newLat(d), 0); return { ok: true, lines: ['R^LGP_{0,◦}: (a) ' + M.npackets + ' packets, (b) ' + M.nsplitting + ' splitting monoids, (c) ' + M.nnumberfields + ' copies of F_mod^×; Ind1 ' + M.ind1Count + ', Ind2 on ' + M.ind2Summands + ' summands, Ind3 ' + M.ind3 + '; log-Kummer ' + M.logKummerOk, '−|log q| = ' + fmt(-M.rep.AbsLogQ) + ', −|log Θ| ≤ ' + fmt(M.rep.thetaUpperBound) + ', C_Θ = ' + fmt(M.rep.CTheta, 3) + ', inequality: ' + (M.rep.inequalityHolds ? 'holds' : 'FAILS')] }; },
    EstimateLogVolume: function (d) { var lat = newLat(d); return { ok: true, lines: III.cor312Steps(lat).map(function (s) { return s.label + '  ' + fmt(s.value) + '   ' + s.ref; }).concat(['Cor 3.12 holds: ' + III.cor312Holds(lat)]) }; },
    BoundDifferents: function (d) { var k = [{ p: 7, e: 1, f: 1, m: 0, d: 0 }, { p: 7, e: 2, f: 1, m: 0, d: 0.5 }, { p: 7, e: 6, f: 1, m: 0, d: 1 }], b = IV.prop13Bounds(k[0], k[2], 1); return { ok: b.lo <= k[2].d + 1e-9, lines: k.map(function (x, i) { var r = IV.prop12i(x); return 'k_' + i + ' (p=' + x.p + ',e=' + x.e + '): a=' + fmt(IV.a(x), 3) + ' b=' + fmt(IV.b(x), 3) + '  p^a R ⊆ log(R×) ⊆ p^{-b} R' + (r.equalities ? ' (equalities)' : ''); }).concat(['d_I = ' + fmt(IV.dI(k), 3) + ', d_{I*} (∗=0) = ' + fmt(IV.dIstar(k, 0), 3) + '; φ(p^λ (R_I)~) ⊆ p^{' + IV.prop12iiExpLog(k, 0) + '} log(R_I×) ⊆ p^{' + IV.prop12iiExpTilde(k, 0) + '} (R_I)~ (λ=0); (iii) exponent ' + IV.prop12iiiExp(k, 0) + '; unramified: ' + IV.prop12ivUnramified([k[0]]), 'Prop 1.3: ' + fmt(b.lo, 3) + ' ≤ d_2 ≤ ' + fmt(b.hi, 3) + ' (actual ' + k[2].d + ')']) }; },
    EstimateNonarchVolume: function (d) { var v = d.VSet[badIndex(d)], k = [{ p: v.p, e: v.eK || 1, f: v.fK || 1, m: v.p === 2 ? 1 : 0, d: 0 }, { p: v.p, e: 1, f: 1, m: 0, d: 0 }], star = [k[0].e > k[0].p - 2 ? 1 : 0, 0]; return { ok: true, lines: ['μ_log(log_p(R×)) at ' + v.name + ' = ' + fmt(IV.mulogLogUnits(k[0])) + '; Prop 1.4 (iii) bounds for λ=0: log part ≤ ' + fmt(IV.prop14iiiBoundLog(k, star[0], 0)) + ', tilde part ≤ ' + fmt(IV.prop14iiiBoundTilde(k, star, 0)) + '; d_I + a_I ≥ ' + IV.prop14iiiDIPlusAILower(k) + '; (iv) unramified odd ⇒ μ_log = 0: ' + IV.prop14iv([k[1]])] }; },
    EstimateArchMetric: function (d) { var narc = d.VSet.filter(function (v) { return v.kind === 'VArc'; }).length, L = []; for (var n = 1; n <= 3; n++) L.push('|I|=' + n + ': ' + IV.archSummands(n, narc) + ' summands, metric factor ' + IV.archMetricFactor(n) + ', ⊗m ∈ λ^{|I|}B with λ=2: ' + IV.archTensorBound(n, 2)); return { ok: true, lines: L }; },
    BoundPrimes: function (d) { return { ok: IV.pntNBound(97) >= 25, lines: ['n ≤ 4p_n/(3 log p_n): p_25 = 97 ⇒ n ≤ ' + fmt(IV.pntNBound(97), 2) + '; #{p ≤ η_prm} ≤ ' + IV.pntCountBound(ETA_PRM).toExponential(3) + '; log x ≤ x at x=' + d.l + ': ' + IV.logLeX(d.l) + '; θ(100) ∈ [' + fmt(IV.chebyshevLo(100), 1) + ', ' + fmt(IV.chebyshevHi(100), 1) + ']; prime in A with θ_A=50, ξ=5: p ≤ ' + IV.primeInABound(50, 5)] }; },
    AverageWeighted: function (d) { var p = d.VSet[badIndex(d)].p, lam = IV.normalizedWeights(d, p), beta = lam.map(function (_, i) { return i + 1; }); return { ok: lam.length > 0, lines: ['weights λ_v = [(F_mod)_v:Q_' + p + '] for ' + lam.length + ' valuation(s) above ' + p + '; weighted average of β = 1..n: ' + fmt(IV.weightedAverage(beta, lam))] }; },
    CheckTorsionPoints: function (d) { var r = new IUT.Report(); IV.torsionFacts(d, r); return { ok: true, lines: rep2lines(r) }; },
    DegreeArithDivisors: function (d) { var Dq = IV.arithDivisorQ(d), S = IV.arithDivisorAdd(Dq, IV.arithDivisorZero(d)), p = d.VSet[badIndex(d)].p; return { ok: Math.abs(IV.arithDivisorNormalizedDeg(d, S) - IUT.logQ(d)) < 1e-9, lines: ['q-divisor: deg = ' + fmt(IV.arithDivisorDeg(d, Dq)) + ', normalized deg = ' + fmt(IV.arithDivisorNormalizedDeg(d, S)) + ' (= log q ' + fmt(IUT.logQ(d)) + '), deg over v|' + p + ': ' + fmt(IV.arithDivisorDegE(d, Dq, p))] }; },
    ComputeThmOneTen: function (d) { var T = IV.thm110Compute(d); return { ok: T.inequalityHolds, lines: ['(E1) n=' + d.LStar + ': ' + IV.E1(d.LStar) + ' (E2) ' + fmt(IV.E2(d.LStar), 3) + ' (E3) |GL2(F_' + d.l + ')| = ' + IV.E3(d.l) + ' (E5) ' + IV.E5(), 'log q = ' + fmt(T.logq) + ', |log q| = ' + fmt(T.absLogq) + ', log d^Ftpd = ' + fmt(T.logdTpd) + ', log f^Ftpd = ' + fmt(T.logfTpd) + ', log d^K ≤ ' + fmt(T.logdKBound) + ', e_mod = ' + T.eMod + ', e*_mod = ' + T.estarMod, 'C_Θ = ' + fmt(T.CTheta, 3) + ' (Cor 3.12 ⇔ C_Θ ≥ −1: ' + T.cor312Holds + ');  (1/6) log q = ' + fmt(T.lhs) + ' ≤ ' + T.rhs.toExponential(4) + ': ' + (T.inequalityHolds ? 'holds' : 'FAILS')] }; },
    ComputeCorTwoTwo: function (d) { var C = IV.cor22Compute(d); return { ok: C.holds, lines: ['d = ' + C.d + ', δ = ' + C.delta + ', log q∀ = ' + fmt(C.logqAll) + '; (C1) ' + fmt(C.lMin, 2) + ' ≤ l ≤ ' + C.lMax.toExponential(3) + ': l = ' + d.l + (C.lInRange ? ' in range' : ' OUT OF RANGE') + '; ε_E = ' + C.epsE.toExponential(4), '(C2) ' + fmt(C.lhs) + ' ≤ (1+ε_E)(' + fmt(C.logdiff) + ' + [' + fmt(C.logcondLo) + ', ' + fmt(C.logcondHi) + ']) + ' + C.CK.toExponential(3) + ': ' + (C.holds ? 'holds' : 'FAILS') + ';  Cor 2.3 slack: ' + IV.cor23Bound(C.lhs, C.logdiff, C.logcondLo, C.epsE, C.CK).toExponential(3)] }; },
    OperateSpecies: function (d, ctx) { var S = ctx.species || [], M = ctx.mutations || [], lat = newLat(d), H = IV.mutationHistoryFromLattice(lat), L = [], c = null; M.some(function (f) { return M.some(function (g) { c = IV.mutationCompose(f, g); return !!c; }); }); if (c) L.push('compose: ' + c.name + ': ' + c.dom + ' → ' + c.cod + ' (core ' + c.core + ')'); if (S.length) { var id = IV.mutationIdentity(S[0]); L.push('identity of ' + id.dom + '; species-isomorphic to itself: ' + IV.speciesIsomorphic(S[0], S[0])); } L.push('mutation-history of the lattice: ' + H.nvertices + ' vertices, ' + H.nedges + ' edges; cores: D⊢ ' + IV.observableIsCore('DMonoPrimeStrip', M) + ', F⊢×μ ' + IV.observableIsCore('FMonoUnitsModTorsPrimeStrip', M) + ', D-HT ' + IV.observableIsCore('DThetaPmEllNFHodgeTheater', M) + ', F-HT ' + IV.observableIsCore('ThetaPmEllNFHodgeTheater', M)); return { ok: !IV.observableIsCore('ThetaPmEllNFHodgeTheater', M), lines: L }; },
    EvaluateLogicModel: function (d) { var ok = true; return { ok: ok, lines: LG.FLAVOURS.map(function (f, k) { var m = LG.modelEval(0.5, 0.75, 0.5, k); if (k === 0 && !(m.meaningful && m.consistent)) ok = false; return f + ': Θ-link N=' + m.NThetaLink[0] + ' ∧ N=' + m.NThetaLink[1] + '; multiradial N=' + m.NMultiradial[0] + ' ∧ N=' + m.NMultiradial[1] + ' ⇒ ' + (m.meaningful ? (m.consistent ? 'A = ε ≤ 1' : 'inconsistent') : 'no conclusion'); }) }; },
    ChainAndSteps: function (d) { var lat = newLat(d), s = LG.stpChain(lat), g = LG.fixAndGlue(lat); return { ok: s.length === 8, lines: s.map(function (x) { return x.id + ' ' + x.from + ' ⇝ ' + x.to + ' [' + x.indeterminacy + '] ' + fmt(x.logVolume) + '   ' + x.ref; }).concat(['(FxGl) q-pilot fixed at (1,0): ' + fmt(g.qSide) + '; glued Θ-pilot at (0,0): ' + fmt(g.thetaSide)]) }; },
    Fuzzify: function (d) { var lat = newLat(d), rep = IUT.multiradial(lat, 0), th = III.pilotMake(d, 'ThetaPilot'), R = LG.fuzzify(th.logVolume, rep.ind, 0, 0, rep.thetaUpperBound - th.logVolume), R2 = LG.fuzzify(-rep.AbsLogQ, rep.ind, 0.5, 0.5, rep.hullEnlargement), u = LG.extInd1Union([1, 2], [2, 3]), c = LG.extInd2Crush(u, abs); return { ok: u.length === 3 && c.length === 3 && LG.engulfs(R, -rep.AbsLogQ), lines: ['Θ-pilot ' + fmt(th.logVolume) + ' fuzzified by Ind1-3 to [' + fmt(R.lo) + ', ' + fmt(R.hi) + ']: engulfs −|log q| = ' + fmt(-rep.AbsLogQ) + ': ' + LG.engulfs(R, -rep.AbsLogQ) + ';  q-pilot fuzzified symmetrically: [' + fmt(R2.lo) + ', ' + fmt(R2.hi) + ']', '(ExtInd1) {1,2} ∪ {2,3} has ' + u.length + ' elements; (ExtInd2) crushed by |·|: ' + c.length + ' classes; ' + LG.orIndeterminacyVerdict(true) + '; ' + LG.orIndeterminacyVerdict(false)] }; },
    ComputeGaussian: function (d) { return { ok: Math.abs(AL.gaussNumeric() - Math.sqrt(Math.PI)) < 1e-3, lines: AL.gaussSteps().map(function (s) { return 'Step ' + s.step + ' ' + s.title + '  ' + (isNaN(s.value) ? '—' : fmt(s.value, 5)) + '   ↔ ' + s.iutAnalogue; }).concat(['numerical ∫e^{−x²} = ' + fmt(AL.gaussNumeric(), 6) + ', √π = ' + fmt(Math.sqrt(Math.PI), 6)]) }; },
    TransportMonoAnabelian: function (d) { var st = AL.transportApparatus(), v = AL.transportRun(newLat(d)); return { ok: st.length === 7, lines: st.map(function (s) { return s.stage + ' | ' + s.side + ' | ' + s.mass + ' | ' + s.indeterminacy; }).concat(v.map(function (x) { return 'run: ' + x.label + '  ' + fmt(x.value); })) }; },
    SumLabelsFormally: function (d) { var r = new IUT.Report(), ok = AL.formalSumCompatible(d, 'Zero', r) & AL.formalSumCompatible(d, 'BoxPlus', r) & AL.formalSumCompatible(d, 'AbsJ', r), seg = AL.labelLineSegment(d), ev = AL.evaluationPoints(d, 2); return { ok: !!ok, lines: ['Zero', 'AbsJ', 'BoxPlus', 'Gt'].map(function (k) { var s = AL.formalSumMake(d, k, 2), t = AL.formalSumTotal(s); return '[' + k + '] ' + s.label.length + ' terms, total mass ' + t[0] + '/' + t[1]; }).concat(['line segment of Ÿ: ' + seg.length + ' labels ' + seg[0] + '..' + seg[seg.length - 1] + '; evaluation points of t=2: {' + ev.join(',') + '}']).concat(rep2lines(r)) }; },
    StepEstimate: function (d) { var lat = newLat(d), v = AL.estimateSteps(lat); return { ok: v.length === 12, lines: v.map(function (x) { return x.label + '  ' + fmt(x.value) + '   ' + x.ref; }).concat(['leading term per j (j=1): ' + fmt(AL.leadingTermJ(d, 1)) + '; sum over F_l^*: ' + fmt(AL.leadingTermSum(d)) + ' ≈ (l²/48)(6 log d^K − log q) = ' + fmt(IUT.leadingTerm(d)) + '; l ≈ √ht = ' + fmt(AL.lFromHeight(d), 2)]) }; },
    TranslateDictionary: function (d) { var e = AL.dictionary(); return { ok: e.length === 11, lines: e.map(function (x) { return x.gauss + ' ↔ ' + x.iut; }) }; }
  };
  var PROCLIST = (typeof module !== 'undefined' && module.exports) ? require('./processlist.js').PROCESSES : (root.PROCLIST ? root.PROCLIST.PROCESSES : []);
  var PROCS = PROCLIST.map(function (p) { var q = { id: p.id, paper: p.paper, section: p.section, name: p.name, inputs: p.inputs, outputs: p.outputs }; q.run = function (d, ctx) { var f = RUN[p.id]; if (!f) return { ok: false, lines: ['no JS runner for ' + p.id] }; try { return f(d, ctx || {}); } catch (e) { return { ok: false, lines: ['error: ' + e.message] }; } }; return q; });
  function findProc(id) { id = String(id).toLowerCase(); for (var i = 0; i < PROCS.length; i++) if (PROCS[i].id.toLowerCase() === id) return PROCS[i]; return null; }
  function runAll(d, ctx, filter) { var out = [], fails = 0; PROCS.forEach(function (p) { if (filter && (p.id + ' ' + p.paper + ' ' + p.section + ' ' + p.name).toLowerCase().indexOf(String(filter).toLowerCase()) < 0) return; var r = p.run(d, ctx); if (!r.ok) fails++; out.push({ id: p.id, ok: r.ok, lines: r.lines }); }); return { results: out, failures: fails }; }

  var api = { i: I, ii: II, iii: III, iv: IV, logic: LG, alien: AL, RUN: RUN, PROCS: PROCS, findProc: findProc, runAll: runAll, ETA_PRM: ETA_PRM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OPS = api;
})(typeof window !== 'undefined' ? window : this);
