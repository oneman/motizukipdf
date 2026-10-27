// node htdocs/test.js — tests of the web-app model (iut.js) against the same facts the C selftest checks.
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

console.log((fails ? 'FAILED' : 'PASSED') + ': ' + fails + ' failure(s) / ' + n + ' checks');
process.exit(fails ? 1 : 0);
