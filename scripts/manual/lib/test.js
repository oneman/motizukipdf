// node scripts/manual/lib/test.js — tests of the manual's JavaScript model (the former web-app model) (iut.js) against the same facts the C selftest checks.
'use strict';
var IUT = require('./iut.js');
var IDS = require('./identifiers.js');
var fails = 0, n = 0;
function check(cond, msg) { n++; if (!cond) { fails++; console.log('  FAIL ' + msg); } else console.log('  ok   ' + msg); }

console.log('iut.js tests');
// identifiers (generated from the C table)
check(IDS.IDENTS.length > 150, 'identifier table loaded: ' + IDS.IDENTS.length + ' entries');
check(IDS.IDENTS.every(function (x) { return IDS.isValid(x.id); }), 'all identifiers match ^[A-Za-z]+$');
var lower = {}; var dup = IDS.IDENTS.filter(function (x) { var k = x.id.toLowerCase(); if (lower[k]) return true; lower[k] = 1; return false; });
check(dup.length === 0, 'identifiers unique case-insensitively');
check(IDS.find('Ddag').notation === '‡' && IDS.find('fmonoglobtriangle').notation === 'F⊩_Δ', 'lookup Ddag ↔ ‡, FMonoGlobTriangle ↔ F⊩_Δ');
Object.keys(IUT.PS).forEach(function (k) { check(!!IDS.find(k), 'prime-strip kind ' + k + ' is in the identifier table'); });
Object.keys(IUT.LINKS).forEach(function (k) { check(!!IDS.find(k), 'link kind ' + k + ' is in the identifier table'); });
check(IDS.MUTATIONS.every(function (m) { return IDS.SPECIES.some(function (s) { return s.id === m.dom; }) && IDS.SPECIES.some(function (s) { return s.id === m.cod; }); }), 'mutations have species endpoints');

// generators
var d = IUT.genExample(2);
check(d.l === 13 && d.LStar === 6 && d.LPm === 7, 'example 2: l = 13, l* = 6, l± = 7');
check(Math.abs(IUT.logQ(d) - 25.5886) < 1e-3, 'log(q) for abc(1,2400,2401) = ' + IUT.logQ(d).toFixed(4) + ' (matches the C program)');
check(Math.abs(IUT.logF(d) - 5.3471) < 1e-3, 'log(f) = ' + IUT.logF(d).toFixed(4));
var v2 = d.VSet.filter(function (v) { return v.p === 2; })[0];
check(v2.reduction === 'badMultiplicative' && v2.ordQ === 2 && !v2.inVBadMod, '2^5 ∥ abc ⇒ ord_2(q_min) = 2, 2 ∉ V^bad_mod');
var d4 = IUT.genExample(4); v2 = d4.VSet.filter(function (v) { return v.p === 2; })[0];
check(v2.reduction === 'good', 'Frey(1,80,81): 2^4 ∥ abc ⇒ good reduction at 2');
var threw = 0; [[1, 2, 4, 7], [2, 4, 6, 7], [1, 8, 9, 9], [1, 8, 9, 3]].forEach(function (t) { try { IUT.genFromAbc.apply(null, t); } catch (e) { threw++; } });
check(threw === 4, 'rejects a+b≠c, non-coprime, composite l, l < 5');
for (var k = 0; k <= 5; k++) { var dk = IUT.genExample(k), rk = IUT.validateData(dk); check(rk.errors === 0, 'example ' + k + ' validates (' + dk.name + ')'); }
var rnd = IUT.genRandom(7); check(IUT.validateData(rnd).errors === 0 && rnd.Fmod.degree >= 1, 'random synthetic data validates (' + rnd.name + ')');
var d5 = IUT.genFromAbc(1, 80, 81, 5); check(IUT.validateData(d5).errors > 0, 'l = 5 rejected ([F:F_mod] divisible by l)');
var broken = IUT.genExample(2); broken.VSet.forEach(function (v) { if (v.reduction === 'badMultiplicative' && v.p % 2) v.reduction = 'good'; }); IUT.finish(broken);
check(IUT.validateData(broken).errors > 0, 'validator rejects empty V^bad_mod');

// symmetries (l = 7)
var d0 = IUT.genExample(0);
check(IUT.symFlSemiPm(d0, 1, -1, 3) === -2 && IUT.symFlSemiPm(d0, 3, 1, 3) === -1, 'F_l^{⋊±} action');
check(IUT.symFlStar(d0, 2, 3) === 1 && IUT.symFlStar(d0, 3, 2) === 1, 'F_l^* action');

// prime-strips
var ps = IUT.buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'test', d, 5, [1, 4, 9, 16, 25, 36]);
check(IUT.validatePrimeStrip(ps, d).errors === 0 && ps.globalDegree < 0, 'F⊩▶×μ-prime-strip builds, validates, negative pilot degree');
var q = IUT.forgetPrimeStrip(ps, 'FMonoUnitsModTorsPrimeStrip');
check(IUT.validatePrimeStrip(q, d).errors === 0 && !q.global && !q.local[0].valGroup, 'forget → F⊢×μ drops C⊩ and O▶');
q = IUT.forgetPrimeStrip(ps, 'DMonoPrimeStrip');
check(IUT.validatePrimeStrip(q, d).errors === 0 && !q.local[0].units && !q.local[0].PiV, 'forget → D⊢ keeps only G_v');
var bad = IUT.buildPrimeStrip('FPrimeStrip', 'hol', d, 6); bad.local[0].PiV = 0;
check(IUT.validatePrimeStrip(bad, d).errors > 0, 'validator rejects F-prime-strip without Π_v');
check(IUT.CORIC.vertically('DPrimeStrip') && IUT.CORIC.horizontally('FMonoUnitsModTorsPrimeStrip') && IUT.CORIC.bi('DMonoPrimeStrip') && !IUT.CORIC.bi('FPrimeStrip'), 'coricity table');

// Hodge theater
var ht = IUT.newHodgeTheater(d, 0, 0, 1);
check(IUT.validateHodgeTheater(ht, d).errors === 0, 'Θ±ell NF-Hodge theater validates');
check(ht.ThetaPmEllHodgeTheater.capsuleFT.length === 13 && ht.ThetaNFHodgeTheater.capsuleFJ.length === 6, 'capsules |F_T| = 13, |F_J| = 6');
check(Math.abs(ht.ThetaPilot.logVolume / ht.QPilot.logVolume - 13 * 14 / 12) < 1e-9, 'naive Θ-pilot volume = l(l+1)/12 × q-pilot volume');
ht.ThetaPmEllHodgeTheater.capsuleFT[2].basepoint = ht.ThetaPmEllHodgeTheater.capsuleFT[3].basepoint;
check(IUT.validateHodgeTheater(ht, d).errors > 0, 'rejects shared basepoints in F_T');

// lattice
var d1 = IUT.genExample(1), lat = new IUT.Lattice(d1, 'ThetaUnitsModTorsLGPTorsorLink');
lat.buildH(0, -2, 2);
check(lat.nextUniverse === 10 && lat.links.length === 9, 'infinite H: 10 vertices, 9 links');
var rl = IUT.validateLattice(lat); check(rl.errors === 0, 'lattice validates (' + rl.errors + ' errors)');
var A = lat.get(0, 0), B = lat.get(0, 1), C = lat.get(1, 0);
check(A.ThetaNFHodgeTheater.FGt.local[0].PiV === B.ThetaNFHodgeTheater.FGt.local[0].PiV, 'log-link shares Π_v (vertical coricity)');
check(A.FMonoGlobLGPTorsor.local[0].units !== B.FMonoGlobLGPTorsor.local[0].units, 'log-link does not share Frobenius-like units');
check(A.FMonoGlobLGPTorsor.local[0].units === C.FMonoGlobTriangle.local[0].units, 'Θ-link shares O×μ (horizontal coricity)');
check(A.ThetaNFHodgeTheater.FGt.local[0].PiV !== C.ThetaNFHodgeTheater.FGt.local[0].PiV, 'Θ-link does not share Π_v (alien copies)');
check(B.hasIncomingLog && B.LogShell.length === d1.VSet.length && !lat.get(0, -2).hasIncomingLog, 'log-shells only in log-link codomains');
var s3 = B.LogShell.filter(function (s) { return s.v === 'v3'; })[0], s2 = B.LogShell.filter(function (s) { return s.v === 'v2'; })[0];
check(s3.radius === '0' && Math.abs(s3.logVolume) < 1e-9, 'log-shell at unramified odd p: I_v = O_v, μ_log = 0');
check(s2.PStar === 4 && Math.abs(s2.logVolume) < 1e-9, 'log-shell at p = 2: p* = 4, μ_log = 0');
var rep = IUT.multiradial(lat, 0);
check(rep.steps.length === d1.LStar + 1 && rep.steps[3].perms === 24, 'processions S^±_{j+1}, 4! = 24');
check(rep.leadingTerm > 0.5 * rep.leadingTermAsymptotic && rep.leadingTerm < 2 * rep.leadingTermAsymptotic, 'leading term ≈ (l²/48)(6 log d^K − log q)');
check(rep.inequalityHolds && rep.CTheta >= -1, '−|log Θ| ≥ −|log q| holds, C_Θ = ' + rep.CTheta.toExponential(3));
lat.applyThetaLink(0, 1); check(lat.links.length === 10 && IUT.validateLattice(lat).errors === 0, 'second Θ-link on row 1 validates');
['ThetaLink', 'ThetaUnitsModTorsLink', 'ThetaUnitsModTorsGauLink', 'ThetaUnitsModTorsLgpIdealLink'].forEach(function (h) {
  var L2 = new IUT.Lattice(IUT.genExample(3), h); L2.buildH(0, 0, 1); check(IUT.validateLattice(L2).errors === 0, h + ' lattice validates');
});

// Part I / Part II modules (diagrams.js, processes.js) render in node too
global.IUT_IDENTS = IDS; global.IUT = IUT; require('./diagrams.js'); require('./processes.js');
check(global.DIAGRAMS.cards.length >= 14 && global.PROCESSES.list.length >= 10, 'gallery has ' + global.DIAGRAMS.cards.length + ' cards, ' + global.PROCESSES.list.length + ' processes');
var allIdents = global.DIAGRAMS.cards.every(function (c) { return c.idents.every(function (i) { return !!IDS.find(i); }); });
check(allIdents, 'every identifier shown on a card is in the generated table');
var dd = IUT.genExample(2), ll = new IUT.Lattice(dd); ll.buildH(0, -1, 1);
var badCards = global.DIAGRAMS.cards.filter(function (c) { try { return !/^<svg/.test(c.draw(dd, ll)); } catch (e) { return true; } });
check(badCards.length === 0, 'all data-type diagrams render as SVG' + (badCards.length ? ': ' + badCards.map(function (c) { return c.id; }).join(',') : ''));
var nsteps = 0, badSteps = [];
global.PROCESSES.list.forEach(function (p) { p.steps.forEach(function (st, i) { nsteps++; try { if (!/^<svg/.test(st.draw({ d: dd, lat: ll, params: global.PROCESSES.params }))) badSteps.push(p.id + ':' + i); } catch (e) { badSteps.push(p.id + ':' + i + ' ' + e.message); } }); });
check(badSteps.length === 0, nsteps + ' process steps render as SVG' + (badSteps.length ? ': ' + badSteps.join(', ') : ''));
[IUT.genExample(0), IUT.genExample(5), IUT.genRandom(3)].forEach(function (dx) { var lx = new IUT.Lattice(dx); lx.buildH(0, -1, 1); var bad = 0; global.PROCESSES.list.forEach(function (p) { p.steps.forEach(function (st) { try { st.draw({ d: dx, lat: lx, params: global.PROCESSES.params }); } catch (e) { bad++; } }); }); global.DIAGRAMS.cards.forEach(function (c) { try { c.draw(dx, lx); } catch (e) { bad++; } }); check(bad === 0, 'diagrams render for ' + dx.name); });


// ------------------------------------------------------------ operations layer (ops.js mirrors src/iut_ops_*.c; registry from processlist.js mirrors src/iut_proc.c)
console.log('ops.js tests');
var OPS = require('./ops.js'), PL = require('./processlist.js');
var CTX = { species: IDS.SPECIES, mutations: IDS.MUTATIONS };
check(OPS.PROCS.length >= 50 && OPS.PROCS.length === PL.PROCESSES.length, 'process registry loaded: ' + OPS.PROCS.length + ' processes (same list as `iut procs`)');
check(OPS.PROCS.every(function (p) { var x = IDS.find(p.id); return x && x.kind === 'process'; }), 'every process id is in the identifier table with kind "process"');
check(OPS.PROCS.every(function (p) { return typeof OPS.RUN[p.id] === 'function'; }), 'every process has a JS runner');
['IUTchI', 'IUTchII', 'IUTchIII', 'IUTchIV', 'EssLgc', 'Alien'].forEach(function (pp) { check(OPS.PROCS.some(function (p) { return p.paper === pp; }), 'registry covers [' + pp + ']'); });
check(OPS.findProc('maplabels') === OPS.PROCS[0] && !OPS.findProc('nope'), 'process lookup is case-insensitive');
var ra = OPS.runAll(d, CTX);
check(ra.failures === 0 && ra.results.length === OPS.PROCS.length, 'all processes run on example 2 without failure' + (ra.failures ? ': ' + ra.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.id; }).join(',') : ''));
[IUT.genExample(0), IUT.genExample(5), IUT.genRandom(3), IUT.genRandom(11), IUT.genFromAbc(3, 125, 128, 11)].forEach(function (dx) { var rx = OPS.runAll(dx, CTX); check(rx.failures === 0, 'all processes run on ' + dx.name + (rx.failures ? ': ' + rx.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.id; }).join(',') : '')); });

// [IUTchI]
check(OPS.i.labelGluePmToNf(d, -4) === 4 && OPS.i.labelGluePmToNf(d, 0) === 0 && OPS.i.labelGluePmToNf(d, 7) === -1 && OPS.i.labelFlUnitsToFlStar(d, -3) === 3 && OPS.i.labelFlUnitsToFlStar(d, 0) === -1, '[IUTchI] Def 6.13: 0,⊞ ↦ >, t ↦ |t|; F_l^× ↠ F_l^*');
check(OPS.i.labelOrbitFlSemiPm(d, 2) === 13 && OPS.i.labelOrbitFlStar(d, 2) === 6, '[IUTchI] Prop 6.6 / 4.9: orbits of size l and l*');
var pmc = OPS.i.labcuspPmMake(d), nfc = OPS.i.labcuspMake(d), fgc = OPS.i.labcuspForgetSign(pmc);
check(OPS.i.labcuspIsBijection(pmc, d) && OPS.i.labcuspIsBijection(nfc, d) && OPS.i.labcuspIsBijection(fgc, d) && fgc.n === d.LStar, '[IUTchI] Prop 6.5: LabCusp± ≅ F_l, LabCusp ≅ F_l^*');
var prc = OPS.i.processionBuild(d, 'PM'), aut = 1; for (var kk = 1; kk <= d.LPm; kk++) aut *= IUT.factorial(kk);
check(prc.nsteps === d.LPm && prc.size[prc.nsteps - 1] === d.LPm && OPS.i.processionCapsuleLabels(prc, 2).join() === '0,1,2' && prc.automorphisms === aut, '[IUTchI] Prop 6.9: Prc(D_T), |Aut| = Π |S±_k|! = ' + aut);
check(OPS.i.processionBuild(d, 'NF').nsteps === d.LStar && OPS.i.processionBuild(d, 'NF').firstLabel[0] === 1, '[IUTchI] Prop 4.11: Prc(D_J) has l* capsules starting at label 1');
var ht2 = IUT.newHodgeTheater(d, 0, 0, 1), capJ = OPS.i.capsuleFromJ(ht2);
check(OPS.i.capsuleFromT(ht2).n === d.l && capJ.n === d.LStar && OPS.i.capsuleFullPolyIsoCount(capJ) === 720 && !OPS.i.capsuleMorphismValid({ nDom: 2, nCod: 3, map: [0, 0] }), '[IUTchI] §0: capsules F_T, F_J (6! poly-isos), non-injective maps rejected');
check(OPS.i.bridgeBuild(ht2, 'ThetaPmBridge').isos === 2 * Math.pow(2, d.VSet.length) && OPS.i.bridgeBuild(ht2, 'ThetaEllBridge').isos === 2 * d.l && OPS.i.bridgeBuild(ht2, 'NFBridge').isos === d.LStar && OPS.i.bridgeBuild(ht2, 'ThetaBridge').isos === 1, '[IUTchI] Prop 6.6 (i)-(ii), Prop 4.8 (i)-(ii): bridge isomorphism torsors 2·2^|V|, 2l, l*, 1');
var DH = OPS.i.hodgeTheaterToD(ht2);
check(DH.nT === d.l && DH.PiGt[0] === DH.PiBoxPlus[0] && OPS.i.dHodgeTheaterIso(DH, DH), '[IUTchI] Def 6.13: forgetful functor to the D-Hodge theater');
var g1 = OPS.i.globalNfBuild(d, 1), g2 = OPS.i.globalNfBuild(d, 2), rr = new IUT.Report(); OPS.i.globalNfKummer(g1, g2, rr);
check(rr.errors === 0, '[IUTchI] Cor 5.3 / [IUTchII] Cor 4.8: Kummer theory of the global number-field data');
var latO = new IUT.Lattice(IUT.genExample(2)); latO.buildH(0, -2, 2);
var fc = OPS.i.frobeniusChainBuild(latO, 0, -2, 2), ft = OPS.i.frobeniusChainTranslate(fc, 2);
check(fc.n === 5 && !fc.adjacentSwapAllowed && fc.translationSymmetric && ft.universe[2] === fc.universe[0], '[IUTchI] Cor 3.8: Frobenius picture chain of 5, Z-translation, no swaps');
var ep = OPS.i.etalePictureBuild(latO, 0), pp2 = OPS.i.etalePicturePermute(ep, [4, 3, 2, 1, 0]);
check(ep.nspokes === 5 && pp2 && pp2.spokeUniverse[0] === ep.spokeUniverse[4], '[IUTchI] Cor 3.9: étale picture with 5 spokes, permutable');

// [IUTchII]
var re = OPS.ii.radialEnvMake('F', 'D⊢', false, ''), rm = OPS.ii.radialEnvMultiradialize(re);
check(!OPS.ii.radialEnvIsMultiradial(re) && OPS.ii.radialEnvIsMultiradial(rm) && rm.multiradialized && OPS.ii.RADIAL_EXAMPLES.length === 7 && OPS.ii.RADIAL_EXAMPLES.filter(OPS.ii.radialEnvIsMultiradial).length === 5, '[IUTchII] Ex 1.7 / 1.8 / 1.9: multiradialization, 5 of 7 examples multiradial');
check(OPS.ii.cyclotomicRigidityGet('MonoTheta').multiradial && !OPS.ii.cyclotomicRigidityGet('MLFGaloisPair').multiradial && OPS.ii.constantMultipleRigidityOrbit() === 2, '[IUTchII] Cor 1.10 / 1.11 / 1.12: cyclotomic rigidities');
var ti = OPS.ii.temperedIndices(d), tv = OPS.ii.thetaEvaluate(d, -3);
check(ti.PiToPiYdd === 2 && ti.PiPmToPi === 13 && ti.PiPmToPiYdd === 26 && tv.value === 9 && tv.torsionIndeterminacy === 26 && OPS.ii.thetaEvaluateAll(d).length === 7, '[IUTchII] Cor 2.4 / 2.5: tempered indices, θ(√−q^{±3}) = q̲^9 up to μ_{2l}');
var vb = d.VSet.map(function (v, i) { return v.inVBadMod ? i : -1; }).filter(function (i) { return i >= 0; })[0];
var env = OPS.ii.monoidBuild(d, 'Theta', vb, 3, false), gau = OPS.ii.monoidBuild(d, 'Gaussian', vb, 3, false), cns = OPS.ii.monoidBuild(d, 'Constant', vb, 3, true), fro = OPS.ii.monoidBuild(d, 'Constant', vb, 3, false), r2 = new IUT.Report();
check(gau.gen.length === 6 && gau.gen[5] === 36 && OPS.ii.monoidEvaluationIso(d, env, gau, r2) && r2.errors === 0, '[IUTchII] Cor 3.5 (ii): Ψ_env ≅ Ψ_gau with generators q̲^{1,4,…,36}');
var ss = OPS.ii.monoidSemisimplify(d, cns);
check(ss.kind === 'Semisimple' && Math.abs(ss.distinguishedLogP - Math.log(d.VSet[vb].p)) < 1e-12 && ss.unitsCopy === cns.unitsCopy, '[IUTchII] Cor 4.5 (ii): semisimplification keeps O× and log p');
check(OPS.ii.monoidKummerIso(fro, cns) && !OPS.ii.monoidKummerIso(cns, fro), '[IUTchII] Cor 4.6: Kummer isomorphism goes from Frobenius-like to étale-like');
var Dm = IUT.buildPrimeStrip('DMonoPrimeStrip', 'D', d, 7), Gr = OPS.ii.globalRealifiedFromDMono(d, Dm);
check(Gr.global && Gr.species === 'FMonoGlobPrimeStrip', '[IUTchII] Cor 4.5 (ii): D⊢ ↦ D⊩(D⊢) realified global');
var sa = OPS.ii.symmetrizeFlSemiPm(d, OPS.i.capsuleFromT(ht2)), sb = OPS.ii.symmetrizeFlStar(d, capJ);
check(sa.nclasses === 7 && OPS.ii.conjugateSynchronized(sa) && sa.classOf[0] === 6 && sa.classOf[6] === 0 && sb.nclasses === 6 && !OPS.ii.conjugateSynchronized(sb), '[IUTchII] Cor 4.5 (iii) / 4.7 (ii): F_l^{⋊±} synchronizes conjugates, F_l^* does not');
check(!OPS.ii.labelSubsetKeepsSymmetry(d, [1], true) && OPS.ii.labelSubsetKeepsSymmetry(d, OPS.alien.labelLineSegment(d), true), '[IUTchII] Rem 4.7.3: only the full label set keeps the symmetry');
var src = IUT.buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'src', d, 5, OPS.ii.thetaGauExponents(d)), lad = OPS.ii.psForgetLadder(d, src);
check(lad.length === 5 && lad[4].kind === 'DMonoPrimeStrip' && lad[2].kind === 'FMonoUnitsModTorsPrimeStrip' && !lad[2].strip.local[0].valGroup && lad[2].strip.local[0].kummer === 'UnitsModTorsKummer' && !lad[4].strip.local[0].units, '[IUTchII] Def 4.9: forgetful ladder F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢');
check(OPS.ii.pilotObjectDegree(src) < 0 && OPS.ii.unitsModTorsKummerOrbit(src) === 2 && OPS.ii.thetaGauExponents(d).length === 6 && OPS.ii.thetaGauExponents(d)[5] === 36, '[IUTchII] Def 4.9 (viii), Rem 4.11.1: negative pilot degree, Ism-orbit, exponents (1²…(l*)²)');
var A0 = latO.get(0, 0), B0 = latO.get(1, 0), TL = OPS.ii.thetaLinkMake(A0, B0, 'ThetaUnitsModTorsGauLink', d), r3 = new IUT.Report();
check(TL && TL.fullPolyIsomorphism && !TL.preservesPi && TL.preservesUnitsModTors && Math.abs(TL.dilation - 13 * 14 / 12) < 1e-12 && !OPS.ii.thetaLinkMake(A0, B0, 'LogLink', d), '[IUTchII] Cor 4.10 (iii): Θ×μ_gau-link full poly-iso, dilation l(l+1)/12; log-link is not a Θ-link');
var DL = OPS.ii.thetaLinkInducedDLink(latO.links[0]);
check(OPS.ii.constantStripIdentify(A0, r3) && OPS.ii.envelopeIsos(A0, r3) && OPS.ii.thetaLinkCoricUnits(A0, B0, r3) && OPS.ii.coricGlobalRealified(A0, B0, r3) && r3.errors === 0 && (!DL || DL.species === 'DThetaPmEllNFLink'), '[IUTchII] Cor 4.10 (i),(ii),(iv): constant strip, envelope isos, coric units and global realified, induced D-link');

// [IUTchIII]
var s1 = OPS.iii.logShellFrom(d, 'HolF', vb, 0, 0), s2 = OPS.iii.logShellFrom(d, 'MonoDMono', vb, 0, 0), s3 = OPS.iii.logShellFrom(d, 'MonoFUnitsModTors', vb, 0, 0);
check(s1.PStar === d.VSet[vb].p && OPS.iii.logShellIsomorphic(s1, s2) && OPS.iii.logShellIsomorphic(s2, s3) && s2.etaleLike && !s2.holomorphic && !s3.etaleLike, '[IUTchIII] Prop 1.2 (vi),(vii): the four log-shell constructions agree');
check(OPS.iii.logShellIsoIndeterminacy(d, vb) === 'Ism' && OPS.iii.logShellIsoIndeterminacy(d, d.VSet.length - 1) === '{±1}', '[IUTchIII] Prop 1.2 (vi): indeterminacy Ism (nonarch) / ±1 (arch)');
var badSh = 0, r4 = new IUT.Report(); d.VSet.forEach(function (v, i) { if (!OPS.iii.logShellProperties(OPS.iii.logShellMake(d, i, true, false, 0, 0), d, r4)) badSh++; });
check(badSh === 0, '[IUTchIII] Prop 1.2 (i)-(iv): log-shell properties hold at every v');
var stripA = IUT.buildPrimeStrip('FPrimeStrip', 'A', d, 6), LR = OPS.iii.logLinkStrip(d, stripA, false);
check(LR.coricD && LR.coricDMono && !LR.ringStructurePreserved && LR.logVolumeCompatible && !LR.kummerCompatible && LR.shells.length === d.VSet.length && LR.strip.local[0].PiV === stripA.local[0].PiV && LR.strip.local[0].units !== stripA.local[0].units, '[IUTchIII] Def 1.1 (iii), Prop 1.2: log-link of prime-strips');
var lc = OPS.iii.logChainBuild(latO, 0, -2, 2);
check(lc.n === 5 && lc.kind === 'LogLink' && !lc.adjacentSwapAllowed && OPS.iii.logLinkHodgeTheaterCheck(latO.get(0, 0), latO.get(0, 1), d), '[IUTchIII] Prop 1.2 (x), Prop 1.3: vertical Frobenius picture, D-HTs coric');
check(!OPS.iii.latticeSquareCommutes() && /LGP/.test(OPS.iii.latticeFlavour('ThetaUnitsModTorsLGPTorsorLink')) && /Gaussian/.test(OPS.iii.latticeFlavour('ThetaUnitsModTorsGauLink')) && OPS.iii.latticeHorizontalObligatesVertical(latO), '[IUTchIII] Def 1.4, Rem 1.4.1: lattice flavours, squares do not commute, Θ-links obligate log-links');
var bc = OPS.iii.bicoricCheck(latO, 0, 0);
check(bc && bc.verticalCoricD && bc.horizontalCoricUnits && bc.bicoricUnitsOfDMono && bc.bicoricLogShells && bc.bicoricGlobalRealified, '[IUTchIII] Thm 1.5: bi-coric F⊢×μ-prime-strips, log-shells, global realified');
check(OPS.iii.thetaMonoidVerticallyCoric(latO, 0) && OPS.iii.thetaMonoidMultiradial() && OPS.iii.etaleRadialEnvironment().length === 6 && OPS.iii.etaleRadialEnvironment()[0].item === '(aR)', '[IUTchIII] Prop 2.1, Thm 2.2, Cor 2.3: theta monoids coric/multiradial, radial data (aR)-(eR)');
var pbad = d.VSet[vb].p, nvp = d.VSet.filter(function (v) { return v.kind === 'VNon' && v.p === pbad; }).length, P = OPS.iii.tensorPacketProcession(d, pbad, false);
check(P.length === d.LStar + 1 && P[2].nfactors === 3 && P[2].nsummands === nvp * nvp * nvp && Math.abs(P[2].logVolumeShells - 3 * P[0].logVolumeShells) < 1e-9, '[IUTchIII] Prop 3.1: packets over Q_p with |V_p|^{j+1} summands');
var narc = d.VSet.filter(function (v) { return v.kind === 'VArc'; }).length, PA = OPS.iii.tensorPacketBuild(d, 2, 0, false), PG = OPS.iii.tensorPacketGlobal(d, 2), r5 = new IUT.Report();
check(PA.nsummands === OPS.iv.archSummands(3, narc) && PG.global && PG.nfactors === 3 && OPS.iii.tensorPacketLocalize(PG, OPS.iii.tensorPacketBuild(d, 2, pbad, true), r5) && !OPS.iii.tensorPacketLocalize(PA, PG, r5), '[IUTchIII] Prop 3.2 / 3.3: archimedean packets 2^{|I|−1}|V|^{|I|}, global packets localize to holomorphic ones');
var lgp = OPS.iii.lgpMonoidBuild(d, 4, vb, 5);
check(lgp.kind === 'LGP' && lgp.gen[0] === 16 && lgp.split, '[IUTchIII] Prop 3.4 (ii): LGP splitting monoid at j = 4 generated by q̲^{16}');
var u1 = OPS.iii.upperSemiCompatibility(d, vb), u2 = OPS.iii.upperSemiCompatibility(d, d.VSet.length - 1);
check(u1.kase === 'bad' && u1.logVolumeDelta === 0 && u2.kase === 'arch', '[IUTchIII] Prop 3.5 (ii): upper semi-compatibility cases');
var GV = OPS.iii.GLOBAL_VARIANTS;
check(GV.MODTorsor.thetaLinkCompatible && !GV.MODTorsor.logVolumeCompatible && GV.ModIdeal.logVolumeCompatible && !GV.ModIdeal.thetaLinkCompatible, '[IUTchIII] Ex 3.6 / Prop 3.7: F_MOD (Θ-link) vs F_mod (log-volume)');
var qp = OPS.iii.pilotMake(d, 'QPilot'), tp = OPS.iii.pilotMake(d, 'ThetaPilot');
check(qp.exponents.length === 1 && tp.exponents.length === 6 && tp.exponents[5] === 36 && Math.abs(tp.logVolume - (91 / 6) * qp.logVolume) < 1e-9, '[IUTchIII] Def 3.8 (i): q-pilot and Θ-pilot, avg(j²) = 91/6');
check(Math.abs(OPS.iii.logVolumeScaleByP(1, 7) - (1 - Math.log(7))) < 1e-12 && OPS.iii.logVolumeScaleByE(0) === 1 && Math.abs(OPS.iii.logVolumeProcessionNormalize([1, 2, 3]) - 2) < 1e-12 && Math.abs(OPS.iii.arithDegree(d, qp.exponents) - qp.logVolume) < 1e-12 && OPS.iii.logVolumeLogLinkCompatible(1, 1), '[IUTchIII] Prop 3.9: log-volume normalizations, arithmetic degree, log-link compatibility');
var ni = OPS.iii.kummerNonInterference(d);
check(ni.nonInterference && ni.torsionOrder === 2 && ni.MODCompatibleWithLGPLink && ni.modCompatibleWithLogVolume, '[IUTchIII] Prop 3.10: non-interference of Kummer theory');
var nbad = d.VSet.filter(function (v) { return v.inVBadMod; }).length, MF = OPS.iii.multiradialFullBuild(latO, 0);
check(MF.npackets === d.LStar + 1 && MF.nnumberfields === d.LStar && MF.nsplitting === d.LStar * nbad && MF.ind1Count === prc.automorphisms && MF.ind2Summands >= MF.npackets && MF.ind3 && MF.logKummerOk, '[IUTchIII] Thm 3.11: multiradial representation (Ind1, Ind2, Ind3)');
var cs = OPS.iii.cor312Steps(latO);
check(cs.length === 7 && Math.abs(cs[0].value + IUT.logQ(d) / 26) < 1e-9 && OPS.iii.cor312Holds(latO), '[IUTchIII] Cor 3.12: steps listed, −|log q| = −log q / 2l, inequality holds');
var latL = new IUT.Lattice(IUT.genExample(2)); latL.buildH(0, 0, 1); latL.applyLogLink(0, -1);
check(OPS.iii.LGPLinkRequiresLog(latL, 0, 0) && !OPS.iii.LGPLinkRequiresLog(latL, 1, 0), '[IUTchIII] Def 3.8 (ii): the Θ×μ_LGP-link needs an incoming log-link');
var MH = OPS.iv.mutationHistoryFromLattice(latL);
check(MH.nvertices >= 4 && MH.nedges >= 3, '[IUTchIV] Def 3.3 (iii): the lattice as a mutation-history');

// [IUTchIV]
var k7 = { p: 7, e: 1, f: 1, m: 0, d: 0 }, k7r = { p: 7, e: 6, f: 1, m: 0, d: 5 / 6 }, k2 = { p: 2, e: 1, f: 1, m: 1, d: 0 };
check(OPS.iv.prop12i(k7).equalities && Math.abs(OPS.iv.a(k7) - 1) < 1e-12 && Math.abs(OPS.iv.b(k7) + 1) < 1e-12 && !OPS.iv.prop12i(k7r).equalities && Math.abs(OPS.iv.a(k7r) - 1 / 3) < 1e-12 && Math.abs(OPS.iv.a(k2) - 2) < 1e-12, '[IUTchIV] Prop 1.2: a = 1 = −b unramified; e = 6 > p − 2: a = 1/3; p = 2: a = 2');
check(Math.abs(OPS.iv.mulogLogUnits(k2) + 2 * Math.log(2)) < 1e-12 && Math.abs(OPS.iv.mulogLogUnits(k7) + Math.log(7)) < 1e-12, '[IUTchIV] Prop 1.4 (ii): μ_log(log O×) = −(1/e + m/ef) log p');
var I2 = [k7, k7];
check(Math.abs(OPS.iv.prop12iiExpLog(I2, 0) + 2) < 1e-12 && Math.abs(OPS.iv.prop12iiExpTilde(I2, 0)) < 1e-12 && Math.abs(OPS.iv.prop12iiiExp(I2, 0) + 1) < 1e-12 && OPS.iv.prop12ivUnramified(I2) && OPS.iv.prop14iiiDIPlusAILower(I2) === 2 && OPS.iv.dIstar(I2, 0) === 0, '[IUTchIV] Prop 1.1 / 1.2 (ii)-(iv) / 1.4 (iii): tensor-product exponents');
var pb = OPS.iv.prop13Bounds(k7, k7r, 1);
check(Math.abs(pb.lo - 5 / 6) < 1e-12 && Math.abs(pb.hi - 2) < 1e-12 && pb.lo <= k7r.d && k7r.d <= pb.hi, '[IUTchIV] Prop 1.3: 5/6 ≤ d ≤ 2 for a tame sextic extension');
check(OPS.iv.archSummands(3, 1) === 4 && OPS.iv.archMetricFactor(3) === 4 && OPS.iv.archTensorBound(2, 3) === 9, '[IUTchIV] Prop 1.5: 2^{|I|−1}|V|^{|I|} summands');
check(OPS.iv.pntNBound(97) >= 25 && OPS.iv.pntCountBound(1e21) > 0 && OPS.iv.logLeX(13) && OPS.iv.chebyshevLo(99) < 99 && OPS.iv.chebyshevHi(99) > 99 && OPS.iv.primeInABound(1, 5) === 12, '[IUTchIV] Prop 1.6 / 2.1: prime number theorem bounds');
check(Math.abs(OPS.iv.weightedAverage([1, 3], [1, 3]) - 2.5) < 1e-12 && OPS.iv.normalizedWeights(d, 7).length === 1 && OPS.iv.normalizedWeights(d, 7)[0] === 1, '[IUTchIV] Prop 1.7: weighted averages, λ_v = 1 for F_mod = Q');
var Dq = OPS.iv.arithDivisorQ(d);
check(Math.abs(OPS.iv.arithDivisorNormalizedDeg(d, Dq) - IUT.logQ(d)) < 1e-9 && OPS.iv.arithDivisorDegE(d, Dq, 7) > 0 && OPS.iv.arithDivisorDeg(d, OPS.iv.arithDivisorZero(d)) === 0 && OPS.iv.arithDivisorAdd(Dq, Dq).coeff[vb] === 2 * Dq.coeff[vb], '[IUTchIV] Def 1.9: arithmetic divisors, deg(q) = log q');
var T = OPS.iv.thm110Compute(d);
check(Math.abs(OPS.iv.E1(6) - 3.5) < 1e-12 && Math.abs(OPS.iv.E2(6) - 91 / 6) < 1e-12 && OPS.iv.E3(13) === 13 * 14 * 144 && T.inequalityHolds && T.cor312Holds && T.etaPrm === OPS.ETA_PRM, '[IUTchIV] Thm 1.10: (E1)-(E3), (1/6) log q ≤ (1 + 20 d_mod/l)(log d + log f) + 20(e*_mod l + η_prm)');
var C2 = OPS.iv.cor22Compute(d);
check(C2.delta === 4096 * 27 * 5 && C2.holds && C2.epsE > 0 && C2.logcondHi > C2.logcondLo && OPS.iv.cor23Bound(1, 0, 1, 0, 0) === 0 && OPS.iv.cor23Bound(1, 0, 1, 1, 0) === 1, '[IUTchIV] Cor 2.2 / 2.3: δ = 2^12·3^3·5·d, (C2) holds, ε_E > 0, slack');
var r6 = new IUT.Report(); OPS.iv.torsionFacts(d, r6);
check(r6.issues.length >= 2, '[IUTchIV] Prop 1.8: torsion-point facts reported');
var idm = OPS.iv.mutationIdentity(IDS.SPECIES[0]), composed = null;
IDS.MUTATIONS.forEach(function (f) { IDS.MUTATIONS.forEach(function (g) { if (!composed) composed = OPS.iv.mutationCompose(f, g); }); });
check(idm.dom === idm.cod && idm.core && OPS.iv.speciesIsomorphic(IDS.SPECIES[0], IDS.SPECIES[0]) && composed && composed.dom !== undefined, '[IUTchIV] Def 3.1: identity mutations, isomorphic species, composition of mutations');
check(OPS.iv.observableIsCore('DMonoPrimeStrip', IDS.MUTATIONS) && OPS.iv.observableIsCore('FMonoUnitsModTorsPrimeStrip', IDS.MUTATIONS) && !OPS.iv.observableIsCore('ThetaPmEllNFHodgeTheater', IDS.MUTATIONS), '[IUTchIV] Def 3.3 (v): D⊢, F⊢×μ are cores; the full Hodge theater is not');

// [EssLgc]
var mA = OPS.logic.modelEval(1, 1, 1, 0), mB = OPS.logic.modelEval(1, 1, 1, 1), mC = OPS.logic.modelEval(2, 1, 1, 0);
check(mA.consistent && mA.meaningful && !mB.meaningful && !mC.consistent && OPS.logic.FLAVOURS.length === 5, '[EssLgc] Ex 2.4.5: ∧ ⇒ A = ε; ∨ ⇒ nothing; A ≠ ε is inconsistent');
var stp = OPS.logic.stpChain(latO);
check(stp.length === 8 && stp[0].indeterminacy === 'Ind3' && stp[1].indeterminacy === 'Ind1' && stp[2].indeterminacy === 'Ind2' && /log q/.test(stp[7].to), '[EssLgc] §3.10 (Stp1)-(Stp8): the chain of steps with Ind3, Ind1, Ind2 first');
var rep2 = IUT.multiradial(latO, 0), fg = OPS.logic.fixAndGlue(latO), R = OPS.logic.fuzzify(fg.thetaSide, rep2.ind, 0, 0, rep2.thetaUpperBound - fg.thetaSide);
check(fg.qSide > fg.thetaSide && OPS.logic.engulfs(R, fg.qSide) && !OPS.logic.engulfs(R, fg.thetaSide - 1) && !OPS.logic.engulfs(R, rep2.thetaUpperBound + 1), '[EssLgc] (FxGl), (Englf): the Θ-pilot region engulfs the q-pilot log-volume');
var U = OPS.logic.extInd1Union([1, 2], [2, 3]);
check(U.length === 3 && OPS.logic.extInd2Crush(U, Math.abs).length === 3 && /harmless/.test(OPS.logic.orIndeterminacyVerdict(true)) && /fatal/.test(OPS.logic.orIndeterminacyVerdict(false)), '[EssLgc] (ExtInd1), (ExtInd2), (logORInd): unions, crushing, OR-indeterminacy verdicts');

// [Alien]
var gs = OPS.alien.gaussSteps();
check(gs.length === 12 && Math.abs(gs[11].value - Math.sqrt(Math.PI)) < 1e-12 && Math.abs(OPS.alien.gaussNumeric() - Math.sqrt(Math.PI)) < 1e-6, '[Alien] §1: Steps 1-12, ∫ e^{−x²} = √π');
var tr = OPS.alien.transportRun(latO);
check(OPS.alien.transportApparatus().length === 7 && tr.length === 4 && tr[3].value === fg.qSide, '[Alien] §2.7: 7 stages of mono-anabelian transport, 4 values');
var fsG = OPS.alien.formalSumMake(d, 'Gt'), tot = OPS.alien.formalSumTotal(fsG), r7 = new IUT.Report();
check(fsG.label.length === 12 && tot[0] === 1 && tot[1] === 1 && OPS.alien.formalSumTotal(OPS.alien.formalSumMake(d, 'BoxPlus')).join('/') === '1/1' && OPS.alien.formalSumCompatible(d, 'Zero', r7) && OPS.alien.formalSumCompatible(d, 'BoxPlus', r7) && OPS.alien.formalSumCompatible(d, 'Avg', r7) && r7.errors === 0, '[Alien] §3.6 (i): formal sums [0], [|j|], [⊞], [>] of total mass 1, compatible');
check(OPS.alien.labelLineSegment(d).length === 13 && OPS.alien.labelLineSegment(d)[0] === -6 && OPS.alien.evaluationPoints(d, 2).join() === '2,-2' && OPS.alien.evaluationPoints(d, 0).length === 1, '[Alien] §3.6 (ii): the label line segment and evaluation points ±t');
var es = OPS.alien.estimateSteps(latO);
check(es.length === 12 && Math.abs(OPS.alien.leadingTermSum(d) - rep2.leadingTerm) < 1e-9 && Math.abs(OPS.alien.leadingTermJ(d, 1) - (2 * d.K.logDifferentEstimate - IUT.logQ(d) / (2 * d.l))) < 1e-9 && OPS.alien.lFromHeight(d) > 0, '[Alien] §3.7 (ii),(iv): (1est)-(12est), leading term Σ_j ((j+1) log d^K − (j²/2l) log q)');
check(OPS.alien.dictionary().length === 11, '[Alien] §3.8: dictionary (1gau)-(11gau)');

// ---- IUT I read from the paper (mirror of src/iut_i.h / src/iut_i.c) ----
(function () {
  var d2 = IUT.genExample(2), I = OPS.i, r;
  var m = I.pseudoMonoidGet('MCircAstInfKappaUnits');
  check(m && m.divisible && m.cyclotomic && m.kummerReady && !I.pseudoMonoidGet('MCircAstMod').kummerReady && I.pseudoMonoidContains('MCircAst', 'MCircAstMod') && !I.pseudoMonoidContains('MCircAstMod', 'MCircAst') && I.PSEUDO_MONOIDS.every(function (x) { return IDS.find(x.id); }), '[IUTchI] Ex 5.1 (i), Rem 5.1.3: pseudo-monoids M^⊛_∞κ× divisible/cyclotomic/Kummer-ready, M^⊛_mod ⊆ M^⊛ Kummer-blind, all in the identifier table');
  var pf = I.polyPlusFullMake(d2, d2.VSet.map(function () { return -1; }));
  check(I.polyCompose(I.polyMake('PolyIsomorphism', 4), I.polyMake('FullPolyIsomorphism', 7)).kind === 'FullPolyIsomorphism' && I.polyPlusFullIsNegative(pf) && !I.polyPlusFullIsPositive(pf) && I.signVectorCount(d2) === 64 && I.POLY_KINDS.every(function (k) { return IDS.find(k); }), '[IUTchI] §0, Def 6.1 (iv): full poly-isomorphisms absorb composites; negative +-full poly-iso; |{±1}^V| = 2^6');
  check(I.anabelioidMake('BTemp', 'Π').tempered && I.fieldKindOfValuation(d2.VSet[0]) === 'MLF' && I.fieldKindOfValuation(d2.VSet[5]) === 'CAF', '[IUTchI] §0: B^temp(Π) tempered; K_v an MLF / CAF');
  check(I.ORBICURVES.every(function (id) { return IDS.find(id) && I.orbicurveGet(d2, id); }) && I.orbicurveGet(d2, 'XUnderK').ncusps === 13 && I.orbicurveGet(d2, 'CK').ncusps === 7 && I.orbicurveGet(d2, 'XArrow').autK === 26 && I.orbicurveGet(d2, 'XArrow').covers === 'X̲', '[IUTchI] §1, Def 1.1, Rem 1.2.1: 9 orbicurves; X̲ has l cusps, C̲ has l±, X→ → X̲ with Aut_k ≅ Z/2l');
  var c = I.cuspsSectionOne(d2), c12 = I.corOneTwo(d2);
  check(c.twoEpsilon === 2 && c.twoEpsilonOk && c.deltaEModLOrder === 169 && c12.lSquared === 169 && c12.idxCXArrow === 338 && c12.galXArrowOverCUnder === 26 && c12.galXArrowOverCArrow === 2 && c12.steps.length === 8, '[IUTchI] §1, Cor 1.2: cusps ε, ε′, ε″, 2ε; l² = [Δ_X : Δ_X→] = [Δ_C : Δ_X→]/2; Gal(X→/C̲) ≅ Z/2l');
  check(I.TEMPERED_FACTS.length === 7 && I.TEMPERED_FACTS.every(function (t) { return IDS.find(t.id); }) && I.temperedAtV(d2, 0).decompositionGroupsSynchronized && !I.temperedAtV(d2, 5).temperedAvailable, '[IUTchI] §2: 7 tempered facts; Cor 2.5 synchronization at bad v only');
  var c31 = I.defThreeOneCheck(d2), bad = JSON.parse(JSON.stringify(d2)); bad.VSet[1].ordQ = 13; var c31b = I.defThreeOneCheck(bad);
  check(c31.items.length === 6 && c31.report.errors === 0 && c31.items[2].machineChecked && !c31.items[0].machineChecked && c31b.report.errors >= 1 && !c31b.items[2].ok && I.thetaApproach(d2).cyclotomeIndex === 13 && I.DETERMINING_DATA[2] === 'C̲_K', '[IUTchI] Def 3.1 (a)-(f), Rem 3.1.2, Rem 3.1.3: conditions hold on example 2, l | ord(q_v) detected, M_X ≅ l·Δ_Θ');
  var kv = I.kappaCoricCheck({ npoles: 1, nzeros: 2, divisorOverNF: true, divisorAvoidsCritical: true, rootsOfUnityAtStrictlyCritical: true, allRootsAdjoined: true, constantsAdjoined: true });
  check(kv.kappaCoric && kv.infKappaUnitsCoric && kv.ncritical === 4 && I.kappaCoricCheck({ npoles: 1, nzeros: 1 }).failed && I.kappaSol(d2).sl2Order === 13 * 168, '[IUTchI] Rem 3.1.7: κ-coric conditions, 4 strictly critical points, |SL_2(F_13)|');
  var lf = I.localFrobenioidBuild(d2, 0), lg = I.localFrobenioidBuild(d2, 4), la = I.localFrobenioidBuild(d2, 5);
  check(lf.kind === 'Bad' && lf.isTempered && lf.splittingIndeterminacy === 26 && lf.thetaRootIndeterminacy === 26 && lf.thetaTranslationIndeterminacy && lg.kind === 'GoodNonarch' && lg.splittingIndeterminacy === 1 && la.kind === 'Arch' && la.hasKummerStructure && I.localFrobenioidReconstructions(lf).length === 6 && I.localFrobenioidSplitIso(lf, lf), '[IUTchI] Ex 3.2-3.4: tempered / good / archimedean local Frobenioids, μ_2l indeterminacies, six reconstructions, F⊢_v ≅ F^Θ_v');
  var g = I.globalRealifiedBuild(d2, 'MOD'), gm = I.fMonoGlobBuild(d2, false), gt = I.fMonoGlobBuild(d2, true), h = I.thetaHodgeTheaterDef(d2);
  check(g.nprimes === 6 && g.rho[0] === 1 && Math.abs(I.globalRealifiedBuild(d2, 'D').frobeniusElement[5] - 1 / (2 * Math.PI)) < 1e-12 && Math.abs(I.rhoThetaV(d2, 0, 3) - 9 * Math.log(2)) < 1e-9 && I.fMonoGlobIso(gm, gt) && gt.id === 'FMonoGlobTht' && h.condA && h.condB && h.condC, '[IUTchI] Ex 3.5, Def 3.6: Prime(C⊩_mod) ≅ V_mod, ρ_v, ρ^Θ_v = j²·log p_v/[K_v:(F_mod)_v], F⊩_tht ≅ F⊩_mod, Θ-HT conditions');
  var lat = new IUT.Lattice(d2, 'ThetaLink'); lat.buildH(0, 0, 0); r = new IUT.Report();
  check(I.thetaLinkCorThreeSeven(lat.applyThetaLink(0, 0), r) === 0 && r.errors === 0 && I.thetaLinkCorThreeSeven(lat.applyLogLink(0, 0), new IUT.Report()) > 0, '[IUTchI] Cor 3.7: the Θ-link passes (full poly-iso, D⊢ preserved, no ring); a log-link does not');
  var t = I.labcuspTorsorMake(d2), pm = I.labcuspPmTorsorMake(d2), a = I.globalBaseGet(d2, 'CircAst'), b = I.globalBaseGet(d2, 'CircDotPm'), o = I.valuationOrbits(d2);
  check(t.torsorSize === 6 && I.labcuspTorsorAct(d2, 5, 5) === 1 && pm.size === 13 && pm.autPlusIndex === 2 && I.labcuspPmForget(d2, -4) === 4 && I.labcuspPmForget(d2, 0) === -1 && a.autImageOrder === 936 && a.autEpsImageOrder === 156 && a.quotientOrder === 6 && b.quotientOrder === 26 && b.doubleCover && o.length === 4 && o[1].upperBound <= o[2].upperBound, '[IUTchI] Def 4.1 (ii), Ex 4.3, Def 6.1 (ii)-(v): LabCusp torsors, Borel/semi-unipotent orders, V ⊆ V^±un ⊆ V^Bor ⊆ V(K)');
  var e = I.evalPointsMake(d2, 0), nf = I.labelTransportMake(d2, false), pmt = I.labelTransportMake(d2, true), tor = I.isoTorsors(d2), fc = I.forgetfulCounts(d2, true);
  check(e.n === 7 && e.thetaValue[6] === 36 && I.thetaBridgePiece(d2, 0, -2).viaEvaluationSection && I.thetaBridgePiece(d2, 0, -2).labelUsed === 2 && I.thetaBridgePiece(d2, 5, -2).fullPolyIso && I.labelTransportCheck(nf, d2) && I.labelTransportCheck(pmt, d2) && tor.length === 11 && tor[4].order === 128 && tor[7].order === 26 * 64 && fc.symmetricGroupOrder === 5040 && fc.labelAssignments === 823543, '[IUTchI] Ex 4.4, Prop 4.7, Prop 4.8, Prop 6.5, Prop 6.6, Prop 6.8: evaluation points q̲^{j²}, φ^Θ_{v_j}, label transport, torsor orders, 7^7 vs 7!');
  var gf = I.globalFrobenioidGet(d2, 'FCircAstAngleJ'), dg = I.distributionMake(d2, true), fl = I.distributionMake(d2, false), D = IUT.buildPrimeStrip('DPrimeStrip', 'x', d2, 31, null), F = I.liftDToF(D, d2);
  check(I.GLOBAL_FROBENIOIDS.every(function (id) { return IDS.find(id); }) && !gf.kummerReady && Math.abs(gf.logVolumeWeight - 1 / 6) < 1e-12 && fl.total === 36 && I.distributionLogVolume(dg, [1, 2, 3, 4, 5, 6]) === 3.5 && I.distributionLogVolume(fl, [1, 2, 3, 4, 5, 6]) === 21 && I.STRIP_FUNCTORS.length === 7 && I.STRIP_FUNCTORS[0].bijectiveOnIsoms && !I.STRIP_FUNCTORS[2].bijectiveOnIsoms && F && F.species === 'FPrimeStrip' && F.local[0].PiV === D.local[0].PiV && !I.liftDToF(F, d2), '[IUTchI] Ex 5.1 (vii), Rem 5.4.2, Cor 5.3, Rem 5.3.1: global Frobenioid copies, averaged vs summed log-volumes, strip functors, lifting D → F');
  var G = I.flSemiPmGroup(d2), T = I.flSemiPmTorsor(d2), p67 = I.propSixSeven(d2); r = new IUT.Report();
  check(G.orbitSize === 2 && T.orbitSize === 26 && T.autPlusOrder === 13 && I.flSemiPmAbs(G).length === 7 && I.flSemiPmStar(G).length === 6 && p67.nFrom === 13 && p67.nTo === 6 && p67.from[0] === -6 && p67.to[0] === 6 && I.processionsCompatible(d2, r) && r.errors === 0 && I.HALF_PLANE.length === 3 && I.HT_FROBENIOIDS.length === 6, '[IUTchI] Def 6.1 (i), Def 6.4, Prop 6.7, Prop 6.9 (iii), Rem 6.12.3, Fig 6.6: F_l^{⋊±}-group vs torsor, |T|, T*, ±t ↦ |t|, S*_j ↪ S^±_{j+1}, dictionaries');
  check(OPS.PROCS.length === 73 && OPS.PROCS.filter(function (p) { return p.paper === 'IUTchI'; }).length === 34 && OPS.PROCS.every(function (p) { return typeof OPS.RUN[p.id] === 'function'; }), 'registry: 73 processes, 34 from [IUTchI], every one has a JS runner');
})();

console.log((fails ? 'FAILED' : 'PASSED') + ': ' + fails + ' failure(s) / ' + n + ' checks');
process.exit(fails ? 1 : 0);
