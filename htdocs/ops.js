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
      case 'ThetaPmBridge': return { kind: kind, nDom: l, dom: 'FT', cod: 'FBoxPlus', symmetry: 'F_l^{⋊±}', isos: 2 * l, poly: true, ok: !!P.ThetaPmBridge };
      case 'ThetaEllBridge': return { kind: kind, nDom: l, dom: 'DT', cod: 'DCircDotPm', symmetry: 'F_l^{⋊±}', isos: 2 * l, poly: true, ok: !!P.ThetaEllBridge };
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
