/*
 * iut.js — the IUT data model for the web app.  A faithful mirror of src/iut.h
 * and friends: initial Θ-data, prime-strips, Θ±ell NF-Hodge theaters, log- and
 * Θ-links, the log-theta-lattice ("infinite H"), log-shells, pilots, the
 * multiradial representation and the log-volume estimate.
 *
 * Works in the browser (window.IUT) and in node (module.exports) so that the
 * model can be tested with `node htdocs/test.js`.  Identifiers used as keys are
 * the English-letters-only identifiers of identifiers.js / docs/IDENTIFIERS.md.
 */
(function (root) {
  'use strict';

  var LAT = { NOFF: 4, MOFF: 6, N: 9, M: 13 };
  var ETA_PRM = 5e20;                                   // [ExpEst] §1
  function estarMod(e) { return 4096 * 27 * 5 * (e || 1); } // 2^12·3^3·5·e_mod, [IUTchIV] Thm 1.10

  // --------------------------------------------------------------- utilities
  function isPrime(n) { if (n < 2) return false; for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function ordp(n, p) { var k = 0; n = Math.abs(n); while (n && n % p === 0) { n /= p; k++; } return k; }
  function factorial(n) { var f = 1; while (n > 1) f *= n--; return f; }
  function factor(n) { var out = []; var p = 2; while (n > 1) { while (n % p) { p++; if (p * p > n) { p = n; } } var k = 0; while (n % p === 0) { n /= p; k++; } out.push([p, k]); p++; } return out; }

  // --------------------------------------------------------------- prime-strip kinds
  var PS = {
    DPrimeStrip:                         { notation: 'D',     etale: true,  mono: false, glob: false },
    DMonoPrimeStrip:                     { notation: 'D⊢',    etale: true,  mono: true,  glob: false },
    FPrimeStrip:                         { notation: 'F',     etale: false, mono: false, glob: false },
    FMonoPrimeStrip:                     { notation: 'F⊢',    etale: false, mono: true,  glob: false },
    FMonoUnitsPrimeStrip:                { notation: 'F⊢×',   etale: false, mono: true,  glob: false },
    FMonoUnitsModTorsPrimeStrip:         { notation: 'F⊢×μ',  etale: false, mono: true,  glob: false },
    FMonoValUnitsModTorsPrimeStrip:      { notation: 'F⊢▶×μ', etale: false, mono: true,  glob: false },
    FMonoGlobPrimeStrip:                 { notation: 'F⊩',    etale: false, mono: true,  glob: true },
    FMonoGlobValUnitsModTorsPrimeStrip:  { notation: 'F⊩▶×μ', etale: false, mono: true,  glob: true }
  };
  var LINKS = {
    ThetaLink:                        { notation: 'Θ-link',        glued: 'FMonoGlobPrimeStrip',                unitsModTors: false },
    ThetaUnitsModTorsLink:            { notation: 'Θ×μ-link',      glued: 'FMonoGlobValUnitsModTorsPrimeStrip', unitsModTors: true,  src: 'FMonoGlobEnv' },
    ThetaUnitsModTorsGauLink:         { notation: 'Θ×μ_gau-link',  glued: 'FMonoGlobValUnitsModTorsPrimeStrip', unitsModTors: true,  src: 'FMonoGlobGau' },
    ThetaUnitsModTorsLGPTorsorLink:   { notation: 'Θ×μ_LGP-link',  glued: 'FMonoGlobValUnitsModTorsPrimeStrip', unitsModTors: true,  src: 'FMonoGlobLGPTorsor' },
    ThetaUnitsModTorsLgpIdealLink:    { notation: 'Θ×μ_lgp-link',  glued: 'FMonoGlobValUnitsModTorsPrimeStrip', unitsModTors: true,  src: 'FMonoGlobLgpIdeal' },
    LogLink:                          { notation: 'log-link',      glued: 'FPrimeStrip' }
  };
  var CORIC = {
    vertically: function (k) { return PS[k].etale; },                                          // [IUTchIII] Thm 1.5 (i)
    horizontally: function (k) { return k === 'FMonoUnitsModTorsPrimeStrip' || k === 'DMonoPrimeStrip'; }, // (ii)
    bi: function (k) { return k === 'DMonoPrimeStrip'; }                                       // (iii)
  };

  // --------------------------------------------------------------- initial Θ-data
  function val(name, p, red, ordq) {
    return { name: name, kind: p ? 'VNon' : 'VArc', p: p || 0, eMod: 1, fMod: 1, eK: 1, fK: 1, reduction: red, ordQ: ordq || 0, inVBadMod: red === 'badMultiplicative' && p % 2 === 1 };
  }
  function finish(d) {
    d.LStar = (d.l - 1) / 2; d.LPm = (d.l + 1) / 2;
    d.VSet.forEach(function (v) {
      v.inVBadMod = v.kind === 'VNon' && v.reduction === 'badMultiplicative' && v.p % 2 === 1;
      if (v.reduction !== 'badMultiplicative') v.ordQ = 0;
    });
    return d;
  }
  function logQ(d) { var s = 0; d.VSet.forEach(function (v) { if (v.kind === 'VNon' && v.reduction === 'badMultiplicative') s += v.ordQ * v.fMod * Math.log(v.p); }); return s / (d.Fmod.degree || 1); }
  function logF(d) { var s = 0; d.VSet.forEach(function (v) { if (v.kind === 'VNon' && v.reduction !== 'good') s += v.fMod * Math.log(v.p); }); return s / (d.Fmod.degree || 1); }

  /* Frey curve y² = x(x−a)(x+b) of an abc triple; F_mod = Q, F_tpd = Q (full rational 2-torsion). */
  function genFromAbc(a, b, c, l) {
    a = +a; b = +b; c = +c; l = +l;
    if (!(a > 0 && b > 0 && c > 0) || a + b !== c) throw new Error('need positive a + b = c');
    if (gcd(a, b) !== 1 || gcd(a, c) !== 1) throw new Error('a, b, c must be coprime');
    if (!isPrime(l) || l < 5 || l > 67) throw new Error('l must be a prime with 5 ≤ l ≤ 67');
    var n = a * b * c, V = [], logf = 0;
    factor(n).forEach(function (pk) {
      var p = pk[0], k = pk[1];
      if (p === 2) {
        if (k > 4) { V.push(val('v2', 2, 'badMultiplicative', 2 * k - 8)); logf += Math.log(2); }
        else if (k === 4) V.push(val('v2', 2, 'good', 0));
        else { V.push(val('v2', 2, 'badAdditive', 0)); logf += Math.log(2); }
      } else { V.push(val('v' + p, p, 'badMultiplicative', 2 * k)); logf += Math.log(p); }
    });
    [3, 5, l].forEach(function (p) { if (!V.some(function (v) { return v.p === p; })) V.push(val('v' + p, p, 'good', 0)); });
    V.push(val('vinf', 0, 'good', 0));
    var dF = 2 * 6 * 48 * 480, gl2 = l * (l + 1) * (l - 1) * (l - 1);
    var d = {
      species: 'InitialThetaData', name: 'abc(' + a + ',' + b + ',' + c + ') l=' + l, curve: 'Frey y^2=x(x-' + a + ')(x+' + b + ')',
      Fmod: { id: 'Fmod', degree: 1 }, F: { id: 'FBarOverF', degreeBound: dF, logDifferentTpd: 0 },
      K: { id: 'KField', degreeBound: dF * gl2, logDifferentEstimate: logf + 2 * Math.log(l) },
      l: l, EpsilonUnder: 0, jLogHeight: Math.abs(3 * Math.log(a * a + a * b + b * b) + 8 * Math.log(2) - 2 * Math.log(n)),
      hypotheses: { FGaloisOverFmod: true, FContainsSixTorsion: true, ImageContainsSLTwo: true, StableReduction: true, CKIsKCore: true },
      VSet: V, abc: [a, b, c]
    };
    return finish(d);
  }

  var LS = [7, 11, 13, 17, 19, 23];
  function rng(seed) { var s = (seed * 2654435761 + 12345) >>> 0; return function (n) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s % n; }; }
  function genRandom(seed) {
    var r = rng(seed);
    if (seed % 2 === 0) {
      for (var t = 0; t < 200; t++) {
        var a = 1 + 2 * r(60), b = 16 * (1 + r(40)); if (a % 4 !== 3) a += 2;
        if (gcd(a, b) !== 1) continue;
        try { var d = genFromAbc(a, b, a + b, LS[r(6)]); d.name = 'random#' + seed + ' ' + d.name; return d; } catch (e) { /* retry */ }
      }
    }
    var dmod = 1 + r(3), l = LS[r(6)], ps = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31], used = {}, V = [];
    var nbad = 1 + r(4);
    for (var i = 0; i < nbad; i++) { var k; do { k = r(10); } while (used[k]); used[k] = 1; var v = val('v' + ps[k], ps[k], 'badMultiplicative', 1 + r(6)); v.eMod = v.eK = 1 + r(dmod); V.push(v); }
    for (k = 0; k < 10 && V.length < 8; k++) if (!used[k]) { used[k] = 1; V.push(val('v' + ps[k], ps[k], 'good', 0)); }
    V.push(val('v2', 2, r(2) ? 'good' : 'badMultiplicative', 2 + 2 * r(3)));
    V.push(val('vinf', 0, 'good', 0));
    var dF = dmod * 2 * 6 * 48;
    var dd = { species: 'InitialThetaData', name: 'random#' + seed + ' synthetic dmod=' + dmod + ' l=' + l, curve: 'E over F_mod of degree ' + dmod,
      Fmod: { id: 'Fmod', degree: dmod }, F: { id: 'FBarOverF', degreeBound: dF, logDifferentTpd: 0.5 + 0.1 * r(40) },
      K: { id: 'KField', degreeBound: dF * l * (l + 1) * (l - 1) * (l - 1), logDifferentEstimate: 0 }, l: l, EpsilonUnder: r(2), jLogHeight: 0,
      hypotheses: { FGaloisOverFmod: true, FContainsSixTorsion: true, ImageContainsSLTwo: true, StableReduction: true, CKIsKCore: true }, VSet: V };
    finish(dd); dd.K.logDifferentEstimate = dd.F.logDifferentTpd + logF(dd) + 2 * Math.log(l);
    return dd;
  }
  var EXAMPLES = [[1, 8, 9, 7], [3, 125, 128, 11], [1, 2400, 2401, 13], [5, 27, 32, 7], [1, 80, 81, 7]];
  function genExample(k) { if (k === 5) return genRandom(1); var e = EXAMPLES[k] || EXAMPLES[2]; return genFromAbc(e[0], e[1], e[2], e[3]); }

  // --------------------------------------------------------------- labels / symmetries
  function inFl(d, t) { return t >= -d.LStar && t <= d.LStar; }
  function inFlStar(d, j) { return j >= 1 && j <= d.LStar; }
  function symFlSemiPm(d, a, sign, t) { var l = d.l, r = ((sign < 0 ? -t : t) + a) % l; if (r < 0) r += l; if (r > d.LStar) r -= l; return r; }
  function symFlStar(d, u, j) { var l = d.l, r = (u * j) % l; if (r < 0) r += l; if (r > d.LStar) r = l - r; return r; }

  // --------------------------------------------------------------- validation
  function Report() { this.issues = []; this.errors = 0; this.warnings = 0; }
  Report.prototype.add = function (sev, cond, ref, msg) { this.issues.push({ severity: sev, condition: cond, ref: ref, msg: msg }); if (sev === 'error') this.errors++; if (sev === 'warn') this.warnings++; return this; };

  function validateData(d, r) {
    r = r || new Report(); var e0 = r.errors;
    if (!isPrime(d.l) || d.l < 5) r.add('error', 'LPrime', '[IUTchI] Def 3.1 (c)', 'l = ' + d.l + ' must be a prime ≥ 5'); else r.add('ok', 'LPrime', '[IUTchI] Def 3.1 (c)', 'l = ' + d.l + ' prime, l* = ' + d.LStar + ', l± = ' + d.LPm);
    if (d.l === 5) r.add('warn', 'LPrime', '[IUTchIV] Thm 1.10', 'l = 5 is excluded in the explicit estimate (F ⊇ Q(E[5]))');
    var dmod = d.Fmod.degree, dF = d.F.degreeBound, dK = d.K.degreeBound;
    if (!dmod || dF % dmod || dK % dF) r.add('error', 'Fmod', '[IUTchI] Def 3.1', 'degrees must satisfy dmod | dF | dK'); else r.add('ok', 'Fmod', '[IUTchI] Def 3.1', 'F_mod ⊆ F ⊆ K with [F_mod:Q]=' + dmod + ', [F:Q]≤' + dF + ', [K:Q]≤' + dK);
    if ((dF / dmod) % d.l === 0) r.add('error', 'FBarOverF', '[IUTchI] Def 3.1 (a)', '[F:F_mod] must be prime to l');
    var narc = 0, nbadOdd = 0, nbadEven = 0, nadd = 0, seen = {};
    d.VSet.forEach(function (v) {
      var key = v.kind + ':' + v.p; if (seen[key]) r.add('error', 'VSet', '[IUTchI] Def 3.1 (e)', 'V → V_mod must be a bijection: ' + v.name + ' duplicated'); seen[key] = 1;
      if (v.kind === 'VArc') { narc++; return; }
      if (!isPrime(v.p)) r.add('error', 'VNon', '[IUTchI] Def 3.1', v.name + ': residue characteristic not prime');
      if (v.reduction === 'badMultiplicative') {
        if (v.p % 2) nbadOdd++; else nbadEven++;
        if (!(v.ordQ > 0)) r.add('error', 'QUnderV', '[IUTchI] Ex 3.2', v.name + ': bad multiplicative reduction needs ord(q_v) > 0');
        if (v.inVBadMod && v.p % 2 === 0) r.add('error', 'VBadMod', '[IUTchI] Def 3.1 (e)', v.name + ': V^bad_mod has odd residue characteristic');
        if (v.ordQ % d.l === 0) r.add('warn', 'QUnderV', '[IUTchI] Def 3.1; [IUTchIV] Prop 1.8 (vii)', v.name + ': l | ord(q_v) = ' + v.ordQ);
      }
      if (v.reduction === 'badAdditive') nadd++;
      if (v.eK < v.eMod || v.fK < v.fMod) r.add('error', 'KField', '[IUTchI] Def 3.1', v.name + ': e_K,f_K must dominate e_mod,f_mod');
    });
    if (!nbadOdd) r.add('error', 'VBadMod', '[IUTchI] Def 3.1 (e)', 'V^bad_mod must be nonempty: no odd prime of bad multiplicative reduction');
    else r.add('ok', 'VBadMod', '[IUTchI] Def 3.1 (e)', '|V^bad_mod| = ' + nbadOdd + ' odd prime(s) of bad multiplicative reduction' + (nbadEven ? ' (2 is bad but excluded)' : ''));
    if (!narc) r.add('warn', 'VArc', '[IUTchI] Def 3.1', 'no archimedean valuation listed');
    if (nadd) r.add('warn', 'VBad', '[IUTchI] Def 3.1 (b); [IUTchIV] Cor 2.2', nadd + ' place(s) of additive reduction: stable reduction only after a finite extension');
    var H = d.hypotheses || {};
    [['FGaloisOverFmod', 'FBarOverF', '[IUTchI] Def 3.1 (a)', 'F Galois over F_mod of degree prime to l'], ['FContainsSixTorsion', 'FBarOverF', '[IUTchI] Def 3.1 (a)', 'F contains the fields of definition of E[2·3]'],
     ['ImageContainsSLTwo', 'KField', '[IUTchI] Def 3.1 (c)', 'Im(Gal(K/F) → GL2(F_l)) ⊇ SL2(F_l)'], ['StableReduction', 'XF', '[IUTchI] Def 3.1 (b)', 'E_F has stable reduction everywhere'], ['CKIsKCore', 'CK', '[IUTchI] Def 3.1 (d)', 'C_K is a K-core']]
      .forEach(function (h) { r.add(H[h[0]] ? 'info' : 'error', h[1], h[2], (H[h[0]] ? 'asserted (not machine-checkable): ' : 'NOT asserted: ') + h[3]); });
    if (d.EpsilonUnder !== 0 && d.EpsilonUnder !== 1) r.add('error', 'EpsilonUnder', '[IUTchI] Def 3.1 (f)', 'ε̲ must be 0 or 1');
    return r;
  }

  // --------------------------------------------------------------- prime-strips
  function buildPrimeStrip(kind, label, d, copyBase, exps) {
    var K = PS[kind], ps = { species: kind, notation: K.notation, label: label, etaleLike: K.etale, monoAnalytic: K.mono, global: K.glob, local: [] };
    d.VSet.forEach(function (v, i) {
      var L = { PiV: K.mono ? 0 : copyBase * 1000 + i * 10 + 2, GV: copyBase * 1000 + i * 10 + 1, units: 0, unitsModTors: false, valGroup: false, split: false, kummer: 'none', vals: [] };
      if (!K.etale) {
        L.units = copyBase * 1000 + i * 10 + 3;
        L.unitsModTors = /UnitsModTors/.test(kind);
        L.valGroup = !(kind === 'FMonoUnitsPrimeStrip' || kind === 'FMonoUnitsModTorsPrimeStrip');
        L.split = /^FMono(Glob)?PrimeStrip$|ValUnitsModTors/.test(kind);
        L.kummer = L.unitsModTors ? 'UnitsModTorsKummer' : (kind === 'FPrimeStrip' || kind === 'FMonoUnitsPrimeStrip' ? 'UnitsKummer' : 'none');
        if (L.valGroup && v.kind === 'VNon' && v.reduction === 'badMultiplicative') L.vals = (exps && exps.length) ? exps.slice() : [1];
      }
      ps.local.push(L);
    });
    if (K.glob) { var ex = (exps && exps.length) ? exps.reduce(function (a, b) { return a + b; }, 0) / exps.length : 1; ps.globalDegree = -ex * logQ(d) / (2 * d.l); }
    return ps;
  }
  function forgetPrimeStrip(ps, to) {
    var q = JSON.parse(JSON.stringify(ps)), K = PS[to]; q.species = to; q.notation = K.notation; q.etaleLike = K.etale; q.monoAnalytic = K.mono; q.global = K.glob;
    q.local.forEach(function (L) {
      if (K.mono) L.PiV = 0;
      if (K.etale) { L.units = 0; L.unitsModTors = false; L.valGroup = false; L.split = false; L.vals = []; L.kummer = 'none'; return; }
      if (to === 'FMonoUnitsPrimeStrip') { L.unitsModTors = false; L.valGroup = false; L.vals = []; L.split = false; L.kummer = 'UnitsKummer'; }
      if (to === 'FMonoUnitsModTorsPrimeStrip') { L.unitsModTors = true; L.valGroup = false; L.vals = []; L.split = false; L.kummer = 'UnitsModTorsKummer'; }
      if (/ValUnitsModTors/.test(to)) { L.unitsModTors = true; L.split = true; L.kummer = 'UnitsModTorsKummer'; }
      if (to === 'FMonoPrimeStrip' || to === 'FMonoGlobPrimeStrip') L.split = true;
    });
    if (!K.glob) delete q.globalDegree;
    return q;
  }
  function validatePrimeStrip(ps, d, r) {
    r = r || new Report(); var K = PS[ps.species], id = ps.species, e0 = r.errors;
    if (!K) return r.add('error', 'DPrimeStrip', '[IUTchI] Fig I1.2', 'unknown prime-strip kind');
    if (ps.local.length !== d.VSet.length) r.add('error', id, '[IUTchI] Def 4.1', ps.label + ': must be indexed by V');
    ps.local.forEach(function (L, i) {
      var vn = d.VSet[i] ? d.VSet[i].name : '?';
      if (!K.mono && !L.PiV) r.add('error', id, '[IUTchI] Def 4.1', ps.label + '@' + vn + ': holomorphic strip needs Π_v');
      if (K.mono && L.PiV) r.add('error', id, '[IUTchI] Def 4.1', ps.label + '@' + vn + ': mono-analytic strip must not remember Π_v');
      if (!L.GV) r.add('error', id, '[IUTchI] Def 4.1', ps.label + '@' + vn + ': G_v missing');
      if (K.etale && L.units) r.add('error', id, '[IUTchI] Def 4.1', ps.label + '@' + vn + ': étale-like strip carries no monoid');
      if (!K.etale && !L.units) r.add('error', id, '[IUTchI] Def 5.2', ps.label + '@' + vn + ': Frobenius-like strip needs a monoid');
      if (ps.species === 'FMonoUnitsModTorsPrimeStrip' && (!L.unitsModTors || L.kummer !== 'UnitsModTorsKummer' || L.valGroup)) r.add('error', id, '[IUTchII] Def 4.9 (i)', ps.label + '@' + vn + ': F⊢×μ needs O×μ with ×μ-Kummer structure and no O▶');
      if (/ValUnitsModTors/.test(ps.species) && (!L.unitsModTors || !L.valGroup)) r.add('error', id, '[IUTchII] Def 4.9', ps.label + '@' + vn + ': ▶×μ needs O▶ × O×μ');
      if ((ps.species === 'FMonoPrimeStrip' || ps.species === 'FMonoGlobPrimeStrip') && !L.split) r.add('error', id, '[IUTchI] Def 5.2 (ii)', ps.label + '@' + vn + ': F⊢ strips are split');
      L.vals.forEach(function (x) { if (!(x > 0)) r.add('error', id, '[IUTchI] Ex 3.2', ps.label + '@' + vn + ': non-positive valuation'); });
    });
    if (K.glob && !ps.global) r.add('error', id, '[IUTchI] Def 5.2 (iv)', ps.label + ': ⊩ strip needs C⊩');
    if (!K.glob && ps.global) r.add('error', id, '[IUTchI] Def 5.2', ps.label + ': only ⊩ strips carry C⊩');
    if (r.errors === e0) r.add('ok', id, '[IUTchI] Fig I1.2', K.notation + '-prime-strip ' + ps.label + ' well-formed');
    return r;
  }

  // --------------------------------------------------------------- Hodge theaters
  function newHodgeTheater(d, n, m, universe) {
    var base = universe * 100, sq = [], j;
    for (j = 1; j <= d.LStar; j++) sq.push(j * j);
    var ht = {
      species: 'ThetaPmEllNFHodgeTheater', n: n, m: m, universe: universe,
      copy: (n === 0 && m === 0) ? 'Dag' : (n === 1 && m === 0) ? 'Ddag' : 'NM' + (n < 0 ? 'Neg' : '') + Math.abs(n) + (m < 0 ? 'Neg' : '') + Math.abs(m),
      logIterate: 0, hasIncomingLog: false, LogShell: [],
      ThetaPmEllHodgeTheater: { symmetry: 'FlSemiPm', capsuleFT: [], ThetaPmBridge: true, ThetaEllBridge: true,
        FBoxPlus: buildPrimeStrip('FPrimeStrip', 'BoxPlus', d, base + 70), DCircDotPm: buildPrimeStrip('DPrimeStrip', 'CircDotPm', d, base + 71) },
      ThetaNFHodgeTheater: { symmetry: 'FlStarSym', capsuleFJ: [], ThetaBridge: true, NFBridge: true,
        FGt: buildPrimeStrip('FPrimeStrip', 'Gt', d, base + 72), FCircAst: buildPrimeStrip('FPrimeStrip', 'CircAst', d, base + 73),
        ThetaHodgeTheater: { thetaValues: [0].concat(sq), FMonoGlobMod: buildPrimeStrip('FMonoGlobPrimeStrip', 'MonoGlobMod', d, base + 74), FMonoGlobTht: buildPrimeStrip('FMonoGlobPrimeStrip', 'MonoGlobTht', d, base + 75, sq) } },
      FMonoGlobTriangle: buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'Triangle', d, base + 80),
      FMonoGlobEnv: buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'Env', d, base + 81, sq),
      FMonoGlobGau: buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'Gau', d, base + 82, sq),
      FMonoGlobLGPTorsor: buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'LGPTorsor', d, base + 83, sq),
      FMonoGlobLgpIdeal: buildPrimeStrip('FMonoGlobValUnitsModTorsPrimeStrip', 'LgpIdeal', d, base + 84, sq),
      QPilot: { species: 'QPilot', exponents: [1], logVolume: -logQ(d) / (2 * d.l) },
      ThetaPilot: { species: 'ThetaPilot', exponents: sq, logVolume: -(sq.reduce(function (a, b) { return a + b; }, 0) / sq.length) * logQ(d) / (2 * d.l) },
      glued: false
    };
    for (var t = -d.LStar; t <= d.LStar; t++) ht.ThetaPmEllHodgeTheater.capsuleFT.push({ t: t, basepoint: base + 1 + (t + d.LStar) });
    for (j = 1; j <= d.LStar; j++) ht.ThetaNFHodgeTheater.capsuleFJ.push({ j: j, basepoint: base + 1 + d.LStar + 1 + (j - 1) });
    glue(ht);
    return ht;
  }
  function glue(ht) { // 0,⊞ ↦ >   [IUTchI] Def 6.13 (iii)
    ht.ThetaNFHodgeTheater.FGt.local.forEach(function (L, i) { var B = ht.ThetaPmEllHodgeTheater.FBoxPlus.local[i]; L.PiV = B.PiV; L.GV = B.GV; });
    ht.glued = true;
  }
  function validateHodgeTheater(ht, d, r) {
    r = r || new Report(); var e0 = r.errors, P = ht.ThetaPmEllHodgeTheater, N = ht.ThetaNFHodgeTheater;
    if (P.capsuleFT.length !== d.l) r.add('error', 'ThetaPmEllHodgeTheater', '[IUTchI] Def 6.13', 'capsule F_T must have l = ' + d.l + ' members');
    var bps = {};
    P.capsuleFT.forEach(function (c) { if (!inFl(d, c.t)) r.add('error', 'LabelT', '[IUTchI] §6', 't=' + c.t + ' ∉ F_l'); if (bps[c.basepoint]) r.add('error', 'FlSemiPm', '[IUTchI] Cor 6.10', 'capsule members t=' + bps[c.basepoint] + ',' + c.t + ' share a basepoint'); bps[c.basepoint] = String(c.t); });
    if (!P.ThetaPmBridge) r.add('error', 'ThetaPmBridge', '[IUTchI] Def 6.4', 'Θ±-bridge missing');
    if (!P.ThetaEllBridge) r.add('error', 'ThetaEllBridge', '[IUTchI] Def 6.4', 'Θell-bridge missing');
    if (N.capsuleFJ.length !== d.LStar) r.add('error', 'ThetaNFHodgeTheater', '[IUTchI] Def 5.5', 'capsule F_J must have l* = ' + d.LStar + ' members');
    N.capsuleFJ.forEach(function (c) { if (!inFlStar(d, c.j)) r.add('error', 'LabelJ', '[IUTchI] §4', 'j=' + c.j + ' ∉ F_l^*'); });
    if (!N.ThetaBridge) r.add('error', 'ThetaBridge', '[IUTchI] Def 5.5', 'Θ-bridge missing');
    if (!N.NFBridge) r.add('error', 'NFBridge', '[IUTchI] Def 5.5', 'NF-bridge missing');
    [P.FBoxPlus, P.DCircDotPm, N.FGt, N.FCircAst, N.ThetaHodgeTheater.FMonoGlobMod, N.ThetaHodgeTheater.FMonoGlobTht, ht.FMonoGlobTriangle, ht.FMonoGlobGau, ht.FMonoGlobLGPTorsor].forEach(function (ps) { validatePrimeStrip(ps, d, r); });
    if (P.FBoxPlus.species !== 'FPrimeStrip') r.add('error', 'FBoxPlus', '[IUTchI] §6', 'F_⊞ must be an F-prime-strip');
    if (P.DCircDotPm.species !== 'DPrimeStrip') r.add('error', 'DCircDotPm', '[IUTchI] §6', 'D_⊚± must be a D-prime-strip');
    for (var j = 1; j <= d.LStar; j++) if (N.ThetaHodgeTheater.thetaValues[j] !== j * j) r.add('error', 'ThetaUnderV', '[IUTchI] Ex 3.2', 'Θ̲-value at j=' + j + ' must be q̲^{j²}');
    if (!ht.glued) r.add('error', 'GluingZeroBoxPlusToGt', '[IUTchI] Def 6.13 (iii)', 'Θ±ell-HT and ΘNF-HT not glued (0,⊞ ↦ >)');
    else N.capsuleFJ.forEach(function (c) { var f = P.capsuleFT.filter(function (x) { return x.t === c.j || x.t === -c.j; }).length; if (f !== 2) r.add('error', 'GluingZeroBoxPlusToGt', '[IUTchI] Def 6.13 (iii)', 'label j=' + c.j + ' must come from ±j'); });
    if (ht.QPilot.exponents.length !== 1 || ht.QPilot.exponents[0] !== 1) r.add('error', 'QPilot', '[IUTchIII] Def 3.8 (i)', 'q-pilot must be {q̲_v}');
    if (ht.ThetaPilot.exponents.length !== d.LStar || ht.ThetaPilot.exponents.some(function (x, i) { return x !== (i + 1) * (i + 1); })) r.add('error', 'ThetaPilot', '[IUTchIII] Def 3.8 (i)', 'Θ-pilot must be {q̲_v^{j²}}');
    if (ht.hasIncomingLog && ht.LogShell.length !== d.VSet.length) r.add('error', 'LogShell', '[IUTchIII] Def 1.1', 'codomain of a log-link must carry one log-shell per v');
    if (r.errors === e0) r.add('ok', 'ThetaPmEllNFHodgeTheater', '[IUTchI] Def 6.13', ht.copy + ' at (' + ht.n + ',' + ht.m + ') is a well-formed Θ±ell NF-Hodge theater (universe #' + ht.universe + ')');
    return r;
  }

  // --------------------------------------------------------------- lattice
  function Lattice(d, horizontal) {
    this.data = d; this.horizontal = horizontal || 'ThetaUnitsModTorsLGPTorsorLink'; if (!LINKS[this.horizontal] || this.horizontal === 'LogLink') this.horizontal = 'ThetaUnitsModTorsLGPTorsorLink';
    this.ht = {}; this.links = []; this.nextUniverse = 0; this.focus = [0, 0];
    this.get(0, 0);
  }
  Lattice.inRange = function (n, m) { return n >= -LAT.NOFF && n <= LAT.NOFF && m >= -LAT.MOFF && m <= LAT.MOFF; };
  Lattice.prototype.key = function (n, m) { return n + ',' + m; };
  Lattice.prototype.peek = function (n, m) { return this.ht[this.key(n, m)] || null; };
  Lattice.prototype.get = function (n, m) { if (!Lattice.inRange(n, m)) return null; var k = this.key(n, m); if (!this.ht[k]) this.ht[k] = newHodgeTheater(this.data, n, m, ++this.nextUniverse); return this.ht[k]; };
  Lattice.prototype.vertices = function () { var self = this; return Object.keys(this.ht).map(function (k) { return self.ht[k]; }).sort(function (a, b) { return a.n - b.n || a.m - b.m; }); };
  Lattice.prototype.findLink = function (vertical, dn, dm) { for (var i = 0; i < this.links.length; i++) { var L = this.links[i]; if ((L.species === 'LogLink') === vertical && L.dom[0] === dn && L.dom[1] === dm) return L; } return null; };

  /* log-link (n,m) → (n,m+1): [IUTchIII] Def 1.1, Prop 1.3 */
  Lattice.prototype.applyLogLink = function (n, m) {
    var dom = this.get(n, m), cod = this.get(n, m + 1); if (!dom || !cod) return null;
    var L = this.findLink(true, n, m); if (!L) { L = {}; this.links.push(L); }
    L.species = 'LogLink'; L.notation = 'log-link'; L.dom = [n, m]; L.cod = [n, m + 1]; L.glued = 'FPrimeStrip'; L.fullPolyIsomorphism = true;
    L.preservesPiV = true; L.preservesGV = true; L.preservesUnitsModTors = false; L.preservesRing = false; L.dilation = 1;
    var pairs = [['ThetaPmEllHodgeTheater', 'FBoxPlus'], ['ThetaPmEllHodgeTheater', 'DCircDotPm'], ['ThetaNFHodgeTheater', 'FGt'], ['ThetaNFHodgeTheater', 'FCircAst'],
      ['ThetaNFHodgeTheater', 'ThetaHodgeTheater', 'FMonoGlobMod'], ['ThetaNFHodgeTheater', 'ThetaHodgeTheater', 'FMonoGlobTht'],
      ['FMonoGlobTriangle'], ['FMonoGlobEnv'], ['FMonoGlobGau'], ['FMonoGlobLGPTorsor'], ['FMonoGlobLgpIdeal']];
    pairs.forEach(function (path) {
      var a = dom, b = cod; path.forEach(function (k) { a = a[k]; b = b[k]; });
      a.local.forEach(function (La, i) { b.local[i].PiV = La.PiV; b.local[i].GV = La.GV; });
    });
    dom.ThetaPmEllHodgeTheater.capsuleFT.forEach(function (c, i) { cod.ThetaPmEllHodgeTheater.capsuleFT[i].basepoint = c.basepoint; });
    dom.ThetaNFHodgeTheater.capsuleFJ.forEach(function (c, i) { cod.ThetaNFHodgeTheater.capsuleFJ[i].basepoint = c.basepoint; });
    var d = this.data;
    cod.LogShell = d.VSet.map(function (v) {
      if (v.kind === 'VArc') return { v: v.name, PStar: 0, radius: '0', logVolume: 0, holomorphic: true, etaleLike: false, from: [n, m] };
      var e = v.eK || 1, p = v.p, kstar = p === 2 ? 2 : 1, lam = Math.floor(e / (p - 1)) + 1, num = lam - kstar * e;
      var mu = -(1 / e + (p === 2 ? 1 : 0) / (e * (v.fK || 1))) * Math.log(p) + kstar * Math.log(p);
      return { v: v.name, PStar: p === 2 ? 4 : p, radius: e === 1 ? String(num) : num + '/' + e, logVolume: mu, holomorphic: true, etaleLike: false, from: [n, m] };
    });
    cod.hasIncomingLog = true; cod.logIterate = dom.logIterate + 1;
    return L;
  };

  /* Θ-link (n,m) → (n+1,m): [IUTchI] Cor 3.7; [IUTchII] Cor 4.10; [IUTchIII] Def 3.8 */
  Lattice.prototype.applyThetaLink = function (n, m) {
    var dom = this.get(n, m), cod = this.get(n + 1, m); if (!dom || !cod) return null;
    var H = LINKS[this.horizontal], d = this.data;
    var L = this.findLink(false, n, m); if (!L) { L = {}; this.links.push(L); }
    L.species = this.horizontal; L.notation = H.notation; L.dom = [n, m]; L.cod = [n + 1, m]; L.glued = H.glued; L.fullPolyIsomorphism = true;
    L.preservesPiV = false; L.preservesGV = true; L.preservesUnitsModTors = !!H.unitsModTors; L.preservesRing = false; L.dilation = d.l * (d.l + 1) / 12;
    var src = this.horizontal === 'ThetaLink' ? dom.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobTht : dom[H.src];
    var dst = this.horizontal === 'ThetaLink' ? cod.ThetaNFHodgeTheater.ThetaHodgeTheater.FMonoGlobMod : cod.FMonoGlobTriangle;
    src.local.forEach(function (a, i) { dst.local[i].GV = a.GV; dst.local[i].units = a.units; });
    return L;
  };
  Lattice.prototype.buildH = function (n, mmin, mmax) {
    for (var col = n; col <= n + 1; col++) for (var m = Math.max(mmin, -LAT.MOFF); m < Math.min(mmax, LAT.MOFF); m++) this.applyLogLink(col, m);
    if (mmin <= 0 && 0 <= mmax) this.applyThetaLink(n, 0);
    this.focus = [n, 0];
  };

  // --------------------------------------------------------------- estimates
  function cTheta(d, logdTpd, logfTpd) {
    var l = d.l, lq = logQ(d); if (!(lq > 0)) return Infinity;
    var e = 1; d.VSet.forEach(function (v) { if (v.kind === 'VNon' && v.eMod > e) e = v.eMod; });
    var A = (1 + 12 * d.Fmod.degree / l) * (logdTpd + logfTpd) + 10 * (estarMod(e) * l + ETA_PRM) - (1 / 6) * (1 - 12 / (l * l)) * lq;
    return (l + 1) / (4 * (lq / (2 * l))) * A - 1;
  }
  function leadingTerm(d) { return d.l * d.l / 48 * (6 * d.K.logDifferentEstimate - logQ(d)); }
  function multiradial(lat, n) {
    var d = lat.data, lq = logQ(d), steps = [], sum = 0, hull = 0;
    for (var j = 0; j <= d.LStar; j++) {
      var s = { j: j, size: j + 1, perms: factorial(j + 1), hull: (j + 1) * d.K.logDifferentEstimate, thetaShift: -(j * j / (2 * d.l)) * lq };
      if (j >= 1) { sum += s.hull + s.thetaShift; hull += s.hull; }
      steps.push(s);
    }
    var rep = { species: 'MultiradialRepresentation', n: n, steps: steps, ind: { IndOne: true, IndTwo: true, IndThree: true }, logQ: lq, AbsLogQ: lq / (2 * d.l),
      leadingTerm: sum, leadingTermAsymptotic: leadingTerm(d), hullEnlargement: hull / d.LStar, thetaUpperBound: sum / d.LStar, CTheta: cTheta(d, d.F.logDifferentTpd, logF(d)) };
    rep.heuristicHolds = rep.thetaUpperBound >= -rep.AbsLogQ;
    rep.inequalityHolds = rep.heuristicHolds && rep.CTheta >= -1;
    rep.thmOneTenRHS = (1 + 20 * d.Fmod.degree / d.l) * (d.F.logDifferentTpd + logF(d)) + 20 * (estarMod(1) * d.l + ETA_PRM);
    return rep;
  }

  function validateLattice(lat, r) {
    r = r || new Report(); var e0 = r.errors, d = lat.data, self = lat;
    var vs = lat.vertices(), seenU = {};
    vs.forEach(function (ht) { var rr = validateHodgeTheater(ht, d); if (rr.errors) r.add('error', 'NMHodgeTheater', '[IUTchIII] Def 1.4', 'Hodge theater at (' + ht.n + ',' + ht.m + '): ' + rr.issues.filter(function (x) { return x.severity === 'error'; })[0].msg); if (seenU[ht.universe]) r.add('error', 'NMHodgeTheater', '[IUTchIV] §3', 'two vertices share a universe'); seenU[ht.universe] = 1; });
    var nlog = 0, ntheta = 0, rows = {};
    lat.links.forEach(function (L) {
      var A = self.peek(L.dom[0], L.dom[1]), B = self.peek(L.cod[0], L.cod[1]);
      if (!A || !B) { r.add('error', L.species, '[IUTchIII] Def 1.4', 'link endpoint missing'); return; }
      if (L.preservesRing) r.add('error', L.species, '[IUTchIII] Rem 1.4.1', 'no link is compatible with the ring structures');
      if (!L.fullPolyIsomorphism) r.add('error', L.species, '[IUTchI] Cor 3.7 (i)', 'links are full poly-isomorphisms');
      if (L.species === 'LogLink') {
        nlog++;
        if (L.cod[0] !== L.dom[0] || L.cod[1] !== L.dom[1] + 1) r.add('error', 'LogLink', '[IUTchIII] Def 1.4', 'log-link must go (n,m) → (n,m+1)');
        if (!L.preservesPiV || !L.preservesGV) r.add('error', 'LogLink', '[IUTchIII] Thm 1.5 (i)', 'log-link must identify the D-prime-strips');
        if (L.preservesUnitsModTors) r.add('error', 'LogLink', '[IUTchIII] Thm 3.11 (ii)', 'log-link does not identify Frobenius-like units');
        if (A.ThetaNFHodgeTheater.FGt.local[0].PiV !== B.ThetaNFHodgeTheater.FGt.local[0].PiV) r.add('error', 'VerticallyCoric', '[IUTchIII] Thm 1.5 (i)', 'D-prime-strip not shared across log-link');
        if (B.LogShell.length !== d.VSet.length) r.add('error', 'LogShell', '[IUTchIII] Def 1.1', 'codomain of log-link lacks log-shells');
      } else {
        ntheta++; rows[L.dom[1]] = 1;
        if (L.cod[0] !== L.dom[0] + 1 || L.cod[1] !== L.dom[1]) r.add('error', L.species, '[IUTchIII] Def 1.4', 'Θ-link must go (n,m) → (n+1,m)');
        if (L.preservesPiV) r.add('error', L.species, '[Alien] §1', 'Θ-link must not identify Π_v');
        if (L.species !== 'ThetaLink' && !L.preservesUnitsModTors) r.add('error', L.species, '[IUTchII] Cor 4.10 (iii)', 'Θ×μ-type links glue the F⊢×μ-prime-strips');
        if (Math.abs(L.dilation - d.l * (d.l + 1) / 12) > 1e-9) r.add('error', 'JSq', '[IUTchIII] Def 3.8', 'dilation must be l(l+1)/12');
        if (A.ThetaNFHodgeTheater.FGt.local[0].PiV === B.ThetaNFHodgeTheater.FGt.local[0].PiV) r.add('error', 'AlienCopy', '[Alien] §1', 'Π_v shared across a Θ-link');
        if (L.species === 'ThetaUnitsModTorsLGPTorsorLink' && A.FMonoGlobLGPTorsor.local[0].units !== B.FMonoGlobTriangle.local[0].units) r.add('error', 'HorizontallyCoric', '[IUTchIII] Thm 1.5 (ii)', 'F⊢×μ not shared across the Θ-link');
      }
    });
    var multi = Object.keys(rows).some(function (k) { return +k !== 0; });
    r.add('info', multi ? 'LogThetaLattice' : 'InfiniteH', multi ? '[IUTchIII] Def 1.4' : '[EssLgc] §3.10; [Alien] §3.11', vs.length + ' Hodge theaters, ' + nlog + ' log-links, ' + ntheta + ' Θ-links' + (multi ? '' : '; only row m=0 carries a Θ-link: the "infinite H"'));
    r.add('info', 'LogThetaLattice', '[IUTchIII] Rem 1.4.1', 'the diagram is highly non-commutative');
    if (r.errors === e0) r.add('ok', 'LogThetaLattice', '[IUTchIII] Def 3.8 (iii)', LINKS[lat.horizontal].notation + ' log-theta-lattice well-formed');
    return r;
  }

  var api = {
    LAT: LAT, PS: PS, LINKS: LINKS, CORIC: CORIC, EXAMPLES: EXAMPLES,
    isPrime: isPrime, gcd: gcd, ordp: ordp, factorial: factorial, factor: factor,
    genFromAbc: genFromAbc, genRandom: genRandom, genExample: genExample, finish: finish, logQ: logQ, logF: logF,
    inFl: inFl, inFlStar: inFlStar, symFlSemiPm: symFlSemiPm, symFlStar: symFlStar,
    Report: Report, validateData: validateData, validatePrimeStrip: validatePrimeStrip, validateHodgeTheater: validateHodgeTheater, validateLattice: validateLattice,
    buildPrimeStrip: buildPrimeStrip, forgetPrimeStrip: forgetPrimeStrip, newHodgeTheater: newHodgeTheater, Lattice: Lattice,
    cTheta: cTheta, leadingTerm: leadingTerm, multiradial: multiradial
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IUT = api;
})(this);
