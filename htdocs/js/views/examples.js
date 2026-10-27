/*
 * views/examples.js — "Worked examples": nine step-by-step walks through the processes, on the live data.
 * Every step has prose, a canvas diagram drawn from the engine's output, and the evidence: the transcript
 * of the C process(es) that perform the step (`iut run <id>`), so nothing here is typed in by hand.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, DG = root.DIAG, D = root.DRAW, el = U.el, esc = U.esc, fmt = D.fmt;

  /* ctx: everything a step may draw from */
  function context() {
    var g = M.gen(), w = M.walk();
    var secs = M.walkSections();
    function section(t) { return (secs.filter(function (s) { return s.title.indexOf(t) === 0; })[0] || { title: '', lines: [] }); }
    return {
      g: g, w: w, val: M.validate(), ht00: M.hodgeTheaterAt(w, 0, 0), ht01: M.hodgeTheaterAt(w, 0, 1), ht10: M.hodgeTheaterAt(w, 1, 0), ht0m: M.hodgeTheaterAt(w, 0, -1),
      link: w.links.filter(function (l) { return l.species !== 'LogLink'; })[0], logLink: w.links.filter(function (l) { return l.species === 'LogLink'; })[0],
      section: section, lines: U.procLines
    };
  }

  function ev(ids) { return { procs: ids }; }

  var EXAMPLES = [
    {
      key: 'abc', title: 'From an abc triple to initial Θ-data', sub: '[IUTchI] Def 3.1 via the Frey curve; the places, the prime l, the conditions (a)–(f)',
      steps: [
        { title: 'the abc triple and the Frey curve', ev: ev(['GenerateInitialData']), diagram: function (c, cv) { DG.thetaData(cv, c.g); },
          text: function (c) { return '<p>Everything starts from a triple of coprime positive integers a + b = c. The Frey curve E : y² = x(x − a)(x + b) has field of moduli F_mod = Q(j_E) = Q, full rational 2-torsion, and bad multiplicative reduction at every odd prime dividing abc with ord_p(q) = 2·ord_p(abc) (the q-parameter is the Tate parameter of E at p). The toolkit records this as the species <b>initial Θ-data</b> of [IUTchI] Def 3.1: the tower F_mod ⊆ F ⊆ K = F(E[l]) ⊆ F̄ with degree bounds (|GL₂(F₂)|·|GL₂(F₃)|·|GL₂(F₅)| and ×|GL₂(F_l)|, [IUTchIV] (E3)–(E5)), the once-punctured curve X_F, the orbicurve C_K, and ε̲.</p><p>Current data: <b>' + esc(c.g.name) + '</b>, curve ' + esc(c.g.curve) + '.</p>'; } },
        { title: 'the set of valuations V ≅ V_mod and V^bad_mod', ev: ev(['GenerateInitialData']), diagram: function (c, cv) { DG.thetaData(cv, c.g); },
          text: function (c) { var bad = c.g.VSet.filter(function (v) { return v.inVBadMod; }); return '<p>V ⊆ V(K) is a set of valuations of K mapping bijectively to V_mod = V(F_mod): one place of K above each place of F_mod, including the archimedean one. V^bad_mod is the nonempty set of <em>odd</em> places of bad multiplicative reduction — the places where the theta function lives and where the Θ-link acts. For 2 the generator distinguishes 2⁴ ∥ abc (good reduction, Δ_min odd), 2⁵ | abc (multiplicative, ord₂ q = 2·ord₂(abc) − 8) and smaller powers (additive: stable only after the extension F_tpd of [IUTchIV]).</p><p>Here |V| = ' + c.g.VSet.length + ' and V^bad_mod = {' + bad.map(function (v) { return v.name + ' (ord q = ' + v.ordQ + ')'; }).join(', ') + '}.</p>'; } },
        { title: 'the prime l and the label sets F_l, |F_l|, F_l^*', ev: ev(['MapLabels']), diagram: function (c, cv) { DG.labels(cv, c.g); },
          text: function (c) { return '<p>The prime l ≥ 5 must be prime to 2·3, to the residue characteristics of V^bad_mod and to the orders ord_v(q_v) ([IUTchI] Def 3.1 (c)). It sets l* = (l − 1)/2 and l± = (l + 1)/2 and the three label sets that index everything downstream: F_l = {−l*, …, l*} (Θ±ell-side, additive symmetry), |F_l| = F_l/{±1} = {0, …, l*} and F_l^* = F_l^×/{±1} = {1, …, l*} (ΘNF-side, multiplicative symmetry). The gluing "0, ⊞ ↦ >" of a Hodge theater is, at the level of labels, t ↦ |t| with 0 going to the label ">" of F_>.</p><p>Here l = ' + c.g.l + ', l* = ' + c.g.LStar + ', l± = ' + c.g.LPm + '.</p>'; } },
        { title: 'the six conditions (a)–(f) of Def 3.1 and the validation report', ev: ev(['CheckDefThreeOne']), diagram: null,
          text: function (c) { return '<p>Whatever can be decided from numbers is checked: (c) l prime to the right things, (d) V a section of V(K) ↠ V_mod, (e) V^bad_mod nonempty, odd, multiplicative, (f) ε̲ a cusp. The conditions that need the actual Galois theory — F/F_mod Galois of degree prime to l, F ⊇ Q(E[2·3]), Im(Gal(K/F) → GL₂(F_l)) ⊇ SL₂(F_l), stable reduction, C_K a K-core — are <em>asserted flags</em>: the validator reports them as "asserted (not machine-checkable)" rather than pretending. Rem 3.1.2 records the Θ-approach (M_X ≅ l·Δ_Θ), Rem 3.1.3 the determining data, Rem 3.1.5 the stack S_mod.</p><p>Validation of the current data: ' + c.val.errors + ' error(s), ' + c.val.warnings + ' warning(s), ' + c.val.issues.length + ' checks.</p>'; },
          extra: function (c) { return U.transcript(M.validateText().split('\n').filter(function (l) { return /^\s*\[/.test(l); }).join('\n')); } },
        { title: 'the orbicurves X, C, X̲, C̲, X→, C→ and the cusps', ev: ev(['ClassifyOrbicurves', 'ReconstructCoverings']), diagram: null,
          text: function (c) { return '<p>[IUTchI] §1 sets up the curves: X the once-punctured elliptic curve (type (1,1)), C = X/±1, the cyclic covering X̲ → X of degree l (type (1,l-tors)) with X̲_K having l cusps ↔ F_l, C̲ = X̲/±1 with l± cusps ↔ |F_l|, and X→, C→ of Def 1.1. The cusps ε (of C̲), ε′ = +ε, ε″ = −ε (of X̲, swapped by ι) and 2ε define the section σ of Cor 1.2, and the eight-step reconstruction recovers Π_X̲, Π_C→, Π_C̲ and l from Π_X→ group-theoretically — l² = [Δ_X : Δ_X→].</p>'; } },
        { title: 'the numbers: log q, log f, heights and arithmetic degrees', ev: ev(['DegreeArithDivisors']), diagram: null,
          text: function (c) { return '<p>The q-divisor Σ ord_v(q_v)·v has normalized degree log q; |log q| = log q / 2l is the log-volume unit of the whole estimate; ht_E = (1/6) log q is the height; log f is the log-conductor (log rad(abc) for Frey data). log d^K is only an estimate (log f + 2 log l) and is labelled as such everywhere.</p>'; },
          extra: function (c) { var g = c.g; var n = el('div', { class: 'numbers' }); [['log q', fmt(g.logQ)], ['|log q| = log q/2l', fmt(g.AbsLogQ)], ['ht_E = log q/6', fmt(g.HtE)], ['log f', fmt(g.logF)], ['log d^K (est.)', fmt(g.K.logDifferentEstimate)], ['h(j_E)', fmt(g.jLogHeight)]].forEach(function (p) { n.appendChild(el('div', { class: 'n', html: '<b>' + p[1] + '</b><span>' + esc(p[0]) + '</span>' })); }); return n; } }
      ]
    },
    {
      key: 'labels', title: 'Labels, symmetries and cusps', sub: '[IUTchI] §4–§6: F_l^{⋊±} versus F_l^*, LabCusp torsors, conjugate synchronization',
      steps: [
        { title: 'the additive and the multiplicative symmetry', ev: ev(['ActSymmetries']), diagram: function (c, cv) { DG.labels(cv, c.g, { highlight: 2 }); },
          text: function () { return '<p>F_l^{⋊±} = F_l ⋊ {±1} acts on F_l by t ↦ ±t + a: transitively (one orbit, l elements) — this is the <em>geometric</em> symmetry of the Θ±ell-Hodge theater, which synchronizes the conjugacy indeterminacies of the l labels (Rem 6.12.3 compares it with the translations z ↦ z + a of the upper half-plane). F_l^* acts on F_l^* by multiplication, simply transitively — the <em>arithmetic</em> symmetry of the ΘNF-Hodge theater, which lets the l* copies of the number field be glued to one. The two symmetries share only {±1}.</p>'; } },
        { title: 'LabCusp(†D_v) as an F_l^*-torsor, LabCusp± as a set with F_l^×-action', ev: ev(['LabelCusps', 'TorsorLabelCusps']), diagram: null,
          text: function () { return '<p>The cusps of C̲_v are labelled by |F_l| = {0} ⊔ F_l^* and those of X̲_v by F_l. LabCusp(†D_v) ([IUTchI] Def 4.1 (ii)) is an F_l^*-torsor with a canonical element †η_v (the label 1); Prop 4.2 says the identifications for the different v are compatible, so one gets a single torsor LabCusp(†D). LabCusp±(†D_v) ([IUTchI] Def 6.1 (ii)–(iii)) carries the zero element †η⁰_v and the ±-canonical element †η^±_v, and forgetting the sign (LabCusp± ∖ {η⁰})/{±1} ≅ LabCusp, t ↦ |t|.</p>'; } },
        { title: 'F_l^{⋊±}-groups, F_l^{⋊±}-torsors, positive elements and sign vectors', ev: ev(['StructureFlSemiPm']), diagram: null,
          text: function () { return '<p>An F_l^{⋊±}-group is a set with a {±1}-orbit of bijections to F_l (two of them); an F_l^{⋊±}-torsor a set with an F_l^{⋊±}-orbit (2l bijections). The index set T of the Θ±-bridge is a group, that of the Θell-bridge a torsor; |T| = T/{±1} has l± elements and T* = |T| ∖ {0} has l*. Def 6.1 (iv): a +-full poly-isomorphism of D-prime-strips is, at each v, the Aut_+-orbit or the Aut_−-orbit of an isomorphism, recorded by a sign vector α ∈ {±1}^V (2^{|V|} of them), and −1_{F_l} is the all-minus one.</p>'; } },
        { title: 'transport of label classes: †χ, †ζ, †ζ_±, the ±-synchronization †ξ', ev: ev(['TransportLabelClasses']), diagram: null,
          text: function () { return '<p>[IUTchI] Prop 4.7 (ΘNF): the NF-bridge induces †χ : J ≅ F_l^*, and the Θ-bridge carries the class [†ε] of the cusp ε to the label j through †φ^LC_j, giving †ζ : LabCusp(†D^⊛) ≅ J. Prop 6.5 (Θ±ell) does the same with signed labels, T ≅ F_l, †ζ_± : LabCusp±(†D^⊚±) ≅ T, and the <em>global ±-synchronization</em> †ξ of Rem 6.12.4 makes the sign choices at the different v agree.</p>'; } },
        { title: 'symmetrizing isomorphisms and conjugate synchronization', ev: ev(['Symmetrize']), diagram: function (c, cv) { DG.hodgeTheater(cv, c.ht00, c.g); },
          text: function () { return '<p>[IUTchII] Cor 3.5 (i), Cor 4.5 (iii): the F_l^{⋊±}-symmetrizing isomorphisms identify the l members of the capsule F_T — all their G_v are one copy (<em>conjugate synchronization</em>), which is what allows the theta values at the different labels to be compared in a single monoid. The F_l^*-symmetrization on the ΘNF-side produces the diagonal (−)_{F_l^*} ⊆ Π_j (−)_j but no synchronization. Restricting to a proper subset of the labels breaks the symmetry ([IUTchII] Rem 4.11.1).</p>'; } },
        { title: 'the two symmetries versus the upper half-plane; the Frobenioids of a Hodge theater', ev: ev(['CompareHalfPlane']), diagram: null,
          text: function () { return '<p>[IUTchI] Rem 6.12.3, Fig 6.4: the additive symmetry corresponds to the parabolic transformations z ↦ ±z + a with basepoints V^± and the cusp at infinity (q = e^{2πiz}), the multiplicative one to the toral rotations w ↦ e^{iθ}w with basepoints V^Bor and the node; {±1} is common to both. Fig 6.6 lists which Frobenioids appear where in a Θ±ell NF-Hodge theater and which are Kummer-ready.</p>'; } }
      ]
    },
    {
      key: 'strips', title: 'Prime-strips and the forgetful ladder', sub: '[IUTchI] Ex 3.2–3.5, Def 4.1, Def 5.2; [IUTchII] Def 4.9; [IUTchIII] Thm 1.5',
      steps: [
        { title: 'the local Frobenioids at bad, good and archimedean v', ev: ev(['BuildLocalFrobenioids']), diagram: function (c, cv) { DG.primeStrip(cv, c.ht00.ThetaNFHodgeTheater.FGt, c.g, { note: 'F_> of †HT, one local datum per v ∈ V' }); },
          text: function () { return '<p>At v ∈ V^bad ([IUTchI] Ex 3.2) the local datum is the tempered Frobenioid F̲_v over D_v = B^temp(X̲̲_v)^0, with the split mono-analytic version C⊢_v, τ⊢_v (a μ_2l-orbit of splittings O▷ = O× × Φ, Φ = N·log_Φ(q̲_v)) and its Θ-version; the theta function Θ̲_v is determined up to μ_2l and l·Z, and (a)–(f) list what F̲_v lets one reconstruct. At good nonarchimedean v (Ex 3.3) Φ = N·log(p_v) with the canonical splitting; at archimedean v (Ex 3.4) the Frobenioid comes with a Kummer structure κ_v and D⊢_v is a split monoid C× = S¹ × R>0. F⊢_v ≅ F^Θ_v at every v.</p>'; } },
        { title: 'the global realified Frobenioids C⊩_mod, C⊩_tht, D⊩_mod and ρ_v', ev: ev(['BuildGlobalRealified']), diagram: null,
          text: function () { return '<p>[IUTchI] Ex 3.5: C⊩_mod is the realification of the Frobenioid of arithmetic line bundles on F_mod, with Prime(C⊩_mod) ≅ V_mod; the gluing data ρ_v : log_mod(p_v) ↦ (1/[K_v : (F_mod)_v])·log_Φ(p_v) ties it to the local Φ_{C⊢v}; the Θ-version ρ^Θ_v sends log(Θ) at the label j to j² times that. F⊩_mod = (C⊩_mod, Prime ≅ V, {F⊢_v}, {ρ_v}) and F⊩_tht ≅ F⊩_mod. D⊩_mod is the étale-like version built from the D⊢_v with the Frobenius element ×e_v (or ÷2π).</p>'; } },
        { title: 'building and validating a prime-strip of any of the nine kinds', ev: ev(['BuildPrimeStrip']), diagram: function (c, cv) { DG.primeStrip(cv, c.ht00.FMonoGlobLGPTorsor, c.g, { note: 'F⊩_LGP of †HT with its Θ-pilot exponents' }); },
          text: function () { return '<p>iut_prime_strip_build makes a strip of a given kind with fresh copy ids for Π_v, G_v and the monoid, the value-group generators (q̲^{j²} at bad v for the Θ-strips), the splitting and the Kummer structure (Ẑ×-orbit for O×, Ism-orbit for O×μ), and for the ⊩ kinds the global realified Frobenioid with its pilot degree. The validator checks the invariants of each kind: a mono-analytic strip has forgotten Π_v, an étale-like strip has no monoid, F⊢×μ has no O▶, pilot degrees are ≤ 0.</p>'; } },
        { title: 'the forgetful ladder F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢', ev: ev(['ForgetLadder']), diagram: function (c, cv) { DG.ladder(cv, c.g, { highlight: 'FMonoUnitsModTorsPrimeStrip' }); },
          text: function () { return '<p>[IUTchII] Def 4.9: forget the global Frobenioid, then the value groups, then pass from O×μ to O× (Ism-orbit → Ẑ×-orbit of Kummer structures), then forget the monoid altogether. Each step is a functor and the kinds lower down are what the links can share: F⊢×μ is horizontally coric (the same on both sides of a Θ-link), D⊢ is bi-coric. The pilot object of an F⊩▶×μ-strip has arithmetic degree ≤ 0 (Def 4.9 (viii)).</p>'; } },
        { title: 'F ↦ D is bijective on isomorphisms, F⊢ ↦ D⊢ only surjective; lifting', ev: ev(['LiftToFrobenioids']), diagram: null,
          text: function () { return '<p>[IUTchI] Cor 5.3: an isomorphism of F-prime-strips is determined by the isomorphism of D-prime-strips it induces (the Kummer theory of the holomorphic data is rigid), but Isom(F⊢) → Isom(D⊢) is only surjective — the mono-analytic Frobenioids have extra automorphisms. Rem 5.3.1 lifts a morphism of D-prime-strips uniquely to F-prime-strips. The same holds globally: Isom(F^⊛) → Isom(D^⊛) is bijective.</p>'; } },
        { title: 'coricity: vertical, horizontal, bi-coric', ev: ev(['CheckBicoric']), diagram: function (c, cv) { DG.ladder(cv, c.g); },
          text: function () { return '<p>[IUTchIII] Thm 1.5: (i) the D-Hodge theater is the same down a column of the lattice (vertical coricity), (ii) the F⊢×μ-prime-strips are the same across a Θ-link (horizontal coricity), (iii) F⊢×μ(D⊢_Δ) ≅ F⊢×μ_> via Kummer, (iv) the mono-analytic log-shells and (v) D⊩(D⊢) (up to R>0) are bi-coric. The toolkit makes this literal: the copy ids of Π_v coincide along columns, those of O×μ across the Θ-link.</p>'; } }
      ]
    },
    {
      key: 'ht', title: 'Assembling a Θ±ell NF-Hodge theater', sub: '[IUTchI] §4–§6, Def 6.13; [Alien] Fig 3.8',
      steps: [
        { title: 'the capsules F_T (t ∈ F_l) and F_J (j ∈ F_l^*)', ev: ev(['ExtractCapsules']), diagram: function (c, cv) { DG.hodgeTheater(cv, c.ht00, c.g); },
          text: function (c) { return '<p>A capsule is a finite collection of prime-strips with pairwise distinct basepoints (the toolkit gives each member its own basepoint id, and the validator rejects shared ones). The Θ±ell-side capsule F_T has l members indexed by F_l; the ΘNF-side capsule F_J has l* members indexed by F_l^*; the morphism F_J → F_T, j ↦ +j, is an injection of index sets. A capsule of n strips has n! full poly-isomorphisms (one per permutation of the index set) — here ' + c.ht00.ThetaPmEllHodgeTheater.capsuleFT.length + '! for F_T.</p>'; } },
        { title: 'processions: S_1 ⊂ … ⊂ S_{l*} and S±_1 ⊂ … ⊂ S±_{l±}', ev: ev(['BuildProcessions']), diagram: function (c, cv) { DG.procession(cv, c.g); },
          text: function () { return '<p>[IUTchI] Prop 4.11 / Prop 6.9: a procession is a chain of capsules S_j = {1, …, j} (resp. S±_{j+1} = {0, …, j}) with the label j ∈ S_j "new" at each stage. Instead of choosing a labelling of the capsule — (l*)^{l*} possibilities — one only needs l*! choices, the automorphisms of the procession, Π|S_k|!. Prop 6.9 (iii): the two processions are compatible, S*_j ↪ S±_{j+1}. The procession is what indexes the tensor packets of the multiradial representation.</p>'; } },
        { title: 'the four bridges and their isomorphism torsors', ev: ev(['BuildBridges', 'CountIsomorphismTorsors']), diagram: function (c, cv) { DG.bridges(cv, c.lines('BuildBridges')); },
          text: function () { return '<p>Θ-bridge φ^Θ : F_J → F_> and NF-bridge φ^NF : F_J → F_⊛ ([IUTchI] Def 4.6, 5.5); Θ±-bridge φ^Θ± : F_T → F_⊞ and Θell-bridge φ^Θell : D_T → D_⊚± (Def 6.4, 6.11). Prop 4.8: the D-NF-bridge is an F_l^*-torsor, the D-Θ-bridge and the D-ΘNF-Hodge theater have trivial automorphisms. Prop 6.6: the D-Θ±-bridge is a torsor over {±1} × {±1}^V, the D-Θell-bridge over F_l^{⋊±}, the D-Θ±ell-Hodge theater over {±1}. The F-versions (Cor 5.6, 6.12) have the same torsors, and the gluing of Rem 6.12.2 is unique.</p>'; } },
        { title: 'the Θ-Hodge theater inside F_>: F⊩_mod, F⊩_tht and the evaluation points', ev: ev(['AssembleThetaHodgeTheater', 'EvaluateAtPoints']), diagram: function (c, cv) { DG.pilots(cv, c.ht00, c.g); },
          text: function () { return '<p>[IUTchI] Def 3.6: a Θ-Hodge theater †HT^Θ = ({†F̲_v}_{v ∈ V}, †F⊩_mod) with (a) each F̲_v isomorphic to the model, (b) F⊩_mod isomorphic to the model, (c) compatibility. Ex 4.4: the evaluation points of X̲̲_v are the μ_−-translates of the cusps, labelled by |F_l|, and Θ̲_v takes the value q̲_v^{j²} (up to μ_2l) at the point labelled j; the Θ-bridge constituent φ^Θ_{v_j} is the evaluation section labelled |j| at bad v and the full poly-isomorphism at good v.</p>'; } },
        { title: 'the global number-field data: F^⊛, F^⊛_mod, Kummer-ready versus Kummer-blind', ev: ev(['BuildGlobalNF', 'DistributeGlobalData']), diagram: null,
          text: function () { return '<p>[IUTchI] Ex 5.1: over D^⊛ = B(C̲_K)^0 one has the Frobenioid F^⊛ of arithmetic divisors (Kummer-ready: its units M^⊛ ≅ F̄^× are divisible and cyclotomic, so Kummer theory applies with rigidity Q>0 ∩ Ẑ× = {1}) and F^⊛_mod, the restriction to terminal objects (Kummer-blind). The copies F^⊛_j for j ∈ F_l^* live over the distributions V_j, the diagonal V_⟨J⟩ gives the constant copy whose log-volume is the average, and V_J = Π V_j the product whose log-volume is the sum (Rem 5.4.2).</p>'; } },
        { title: 'gluing the two halves along 0, ⊞ ↦ >', ev: ev(['GlueHodgeTheaters', 'ReduceThetaPmToTheta']), diagram: function (c, cv) { DG.hodgeTheater(cv, c.ht00, c.g, { focusT: 0 }); },
          text: function () { return '<p>[IUTchI] Prop 6.7: from a D-Θ±-bridge one gets a D-Θ-bridge by sending ±t ↦ |t| (two labels to one) and the two strips D_0, D_⊞ to the single D_>. Def 6.13 (iii): a Θ±ell NF-Hodge theater is a Θ±ell-HT and a ΘNF-HT glued through this isomorphism — "0, ⊞ ↦ >". In the toolkit the gluing copies the Π ids of F_⊞ into F_>, so the validator can tell a glued theater from an unglued one.</p>'; } },
        { title: 'forgetting to the D-Hodge theater and counting what is lost', ev: ev(['ForgetToDHodgeTheater', 'CountForgottenSymmetries']), diagram: null,
          text: function () { return '<p>Forgetting all Frobenioids leaves the D-Θ±ell NF-Hodge theater: base categories only, étale-like, hence vertically coric — the same object at every vertex of a column. Prop 4.9 / 6.8 count what the forgetful functors lose: the symmetric group S_{l*} (resp. S_{l±}) acting on the capsules and (l*)^{l*} (resp. (l±)^{l±}) label assignments, which processions cut down to l*! (resp. l±!).</p>'; } }
      ]
    },
    {
      key: 'theta', title: 'The Θ-link and the mutually alien copies', sub: '[IUTchI] Cor 3.7; [IUTchII] Cor 2.5, Cor 4.10; [Alien] §3.3 (vii), §3.6',
      steps: [
        { title: 'theta evaluation: θ(√−q^t) ↦ q̲^{t²}, depending only on |t|', ev: ev(['EvaluateTheta']), diagram: function (c, cv) { DG.pilots(cv, c.ht00, c.g); },
          text: function () { return '<p>[IUTchII] Cor 2.4–2.5: the tempered indices [Π : Π_Ÿ] = 2, [Π± : Π] = l, [Π± : Π_Ÿ] = 2l; at the l-torsion points labelled t ∈ F_l the theta function takes the values q̲^{t²} up to μ_2l, in units of ord(q̲) with q̲ = q^{1/2l}. The value depends only on |t| — which is why the Θ-pilot is indexed by F_l^* and why F_l^{⋊±}-symmetry is needed to synchronize the labels. Cor 2.8 is the mono-theta-theoretic version.</p>'; } },
        { title: 'the monoids Ψ_env, Ψ_gau, Ψ_cns and the evaluation / Kummer isomorphisms', ev: ev(['BuildMonoids', 'RealifyFromDMono']), diagram: null,
          text: function () { return '<p>[IUTchII] Prop 3.1, Cor 3.5–3.6, Cor 4.5–4.6: the theta monoid Ψ_env = O×·θ^N with its canonical splitting, the Gaussian monoid Ψ_gau = O×·(q̲^{j²})_j, the constant monoid Ψ_cns = O▷ and its semisimplification Ψ^ss_cns = O× × R≥0 with the distinguished log(p_v). The evaluation isomorphism Ψ_env ≅ Ψ_gau sends θ ↦ (q̲^{j²})_j; the Kummer isomorphisms identify the Frobenius-like monoids (from F) with the étale-like ones (from D). From D⊢ alone one recovers the global realified Frobenioid D⊩(D⊢) up to R>0.</p>'; } },
        { title: 'the Θ-link of [IUTchI] Cor 3.7: †F⊩_tht ≅ ‡F⊩_mod', ev: ev(['AssembleThetaHodgeTheater']), diagram: function (c, cv) { DG.thetaLink(cv, c.ht00, c.ht10, c.link, c.g); },
          text: function () { return '<p>The Θ-link is the <em>full</em> poly-isomorphism between the Θ-version of the global realified data of †HT and the q-version of ‡HT: Θ̲_v on the left is glued to q̲_v on the right. Cor 3.7 (ii)–(iii) and Rem 3.9.3: it preserves D⊢_v = {G_v} and the units O×, dilates the value groups, and does <em>not</em> relate the ring structures — Π_v on the two sides are different copies. Cor 3.8 gives the Frobenius-picture … → †HT → ‡HT → …, Cor 3.9 the étale-picture around D⊢_v.</p>'; } },
        { title: 'the Θ×μ- and Θ×μ_gau-links of Cor 4.10; coric units modulo torsion', ev: ev(['LinkThetaUnitsModTors']), diagram: function (c, cv) { DG.thetaLink(cv, c.ht00, c.ht10, c.link, c.g); },
          text: function (c) { return '<p>[IUTchII] Cor 4.10: (i) F⊩_Δ ≅ F⊩_mod by identifying the labels 0 and F_l^* with ">"; (ii) F⊩_env ≅ F⊩_tht ≅ F⊩_gau; (iii) the Θ×μ-link and the Θ×μ_gau-link glue †F⊩_env / †F⊩_gau to ‡F⊩_Δ as F⊩▶×μ-prime-strips; (iv) the F⊢×μ-prime-strips on both sides are identified (up to the Ism-orbits: Ind2) and the induced D-Θ±ell NF-link lives on D⊢; (v) D⊩(D⊢) is coric up to R>0. The exponents q̲ ↦ q̲^{(1², …, (l*)²)} of Rem 4.11.1 are the dilation. The lattice above uses the ' + esc(M.horizontalInfo().label) + '.</p>'; } },
        { title: 'what is shared and what is alien: the copy ids', ev: null, diagram: function (c, cv) { DG.thetaLink(cv, c.ht00, c.ht10, c.link, c.g); },
          text: function () { return '<p>Across the Θ-link the toolkit identifies the copy ids of G_v and of O×μ (gluing data (aΘ), up to Ind1 and Ind2), keeps the value groups as they are — {q̲^{j²}} on the left, {q̲} on the right, (bΘ) — identifies the global realified Frobenioids (cΘ), and never identifies Π_v or the ring structures: †HT and ‡HT are <em>mutually alien copies</em> of the ring theory ([Alien] §1). The table from <code>iut walk</code> below lists this per valuation.</p>'; },
          extra: function (c) { var s = c.section('Mutually alien'); return U.transcript(s.title + '\n' + s.lines.join('\n')); } },
        { title: 'the Frobenius-picture and the étale-picture', ev: ev(['ChainFrobeniusPicture', 'DrawEtalePicture']), diagram: function (c, cv) { DG.etalePicture(cv, c.w); },
          text: function () { return '<p>Chaining Θ-links gives the Frobenius-picture, a Z-translation-symmetric sequence … → †HT → ‡HT → ∗HT → … in which adjacent theaters may never be swapped (the domain and codomain of a Θ-link play different roles). Passing to the étale-like data, every theater becomes a spoke around the shared D⊢-prime-strip, and the spokes may be permuted arbitrarily: the étale-picture ([IUTchI] Cor 4.12, 6.10).</p>'; } },
        { title: 'radial environments, multiradiality and cyclotomic rigidity', ev: ev(['ClassifyRadial', 'RigidifyCyclotomes']), diagram: null,
          text: function () { return '<p>[IUTchII] Ex 1.7–1.9: a radial environment is radial data R with a functor to the coric data C; it is multiradial when the functor is full, i.e. when R can be described in terms of C alone up to the automorphisms of C. The holomorphic structure Π_v ↷ O▷ is uniradial; D⊢ itself, O×μ up to Ism, the mono-theta environment with its cyclotomic rigidity (Cor 1.10, no indeterminacy), and the number-field rigidity Q>0 ∩ Ẑ× = {1} are multiradial; the MLF-Galois-pair rigidity (Cor 1.11) is uniradial. Ex 1.7 (ii) multiradializes any environment by adjoining the full poly-isomorphism of C.</p>'; } }
      ]
    },
    {
      key: 'lattice', title: 'Walking the log-theta-lattice', sub: '[IUTchIII] Def 1.1, Prop 1.2–1.3, Def 1.4, Thm 1.5, Def 3.8; [Alien] Fig 3.6',
      steps: [
        { title: 'the log-link on a prime-strip: Π_v kept, the monoid renewed', ev: ev(['ApplyLogLinkStrip']), diagram: function (c, cv) { DG.lattice(cv, c.w, { focus: [0, 1], shells: true }); },
          text: function () { return '<p>[IUTchIII] Def 1.1: the log-link †F → ‡F replaces the multiplicative monoid O▷ by the additive module log(O×) — it is <em>not</em> a ring homomorphism (Prop 1.2 (ii)) and the Kummer isomorphisms are not compatible with it (iv), but D and D⊢ are coric (i) and log-volumes are compatible (iii). In the toolkit the codomain keeps every Π_v and G_v copy id and gets fresh monoid ids: vertical coricity, and "Frobenius-like data is renewed".</p>'; } },
        { title: 'the log-shells I_v and their properties', ev: ev(['MakeLogShells']), diagram: function (c, cv) { DG.logShells(cv, c.ht01.LogShell, c.g); },
          text: function () { return '<p>At the codomain the log-link constructs the log-shell I_v = (p*)⁻¹·log(O×_{K_v}) with p* = p (p odd) or p² (p = 2) ([IUTchIII] Def 1.1 (i), [AbsTopIII] Def 5.4 (iii)): Prop 1.2 (v) (a) log(O×) ⊆ I, (b) O ⊆ p^{−?}I, (c) I is a compact Z_p-module. The four constructions from F, F⊢×μ, D⊢ and D give isomorphic shells (vi)–(ix), with the isomorphism indeterminate up to Ism (nonarchimedean) or ±1 (archimedean). The radius comes from log(1 + p^λ O) = p^λ O for λ > e/(p − 1), the log-volume from [IUTchIV] Prop 1.4 (ii).</p>'; } },
        { title: 'the column (n,◦): the vertical Frobenius picture and vertically coric theta monoids', ev: ev(['ChainLogLinks', 'CoricThetaMonoids']), diagram: function (c, cv) { DG.lattice(cv, c.w, { focus: [0, 0] }); },
          text: function () { return '<p>Prop 1.2 (x) / Prop 1.3: iterating log-links gives the vertical chain … → F → F → F → … (translation symmetric, no swaps), and the log-link of Hodge theaters is defined through an isomorphism Ξ of their D-Hodge theaters, applied to F_>, F_⊚, F_J, F_T. Prop 2.1: the theta monoids Ψ_env(†D_>) built from the étale-like data are the same at every vertex of the column — "(0,◦)" denotes the whole column. Thm 2.2 / Cor 2.3: with the mono-theta cyclotomic rigidity they are multiradial, giving the étale-picture radial environment (aR)–(eR).</p>'; } },
        { title: 'the lattice: flavours, non-commuting squares, horizontal arrows need vertical ones', ev: ev(['DefineLattice']), diagram: function (c, cv) { DG.lattice(cv, c.w, { focus: [1, 0] }); },
          text: function () { return '<p>[IUTchIII] Def 1.4: vertices {n,m}HT, vertical log-links, horizontal Θ-links; the non-Gaussian lattice (Θ or Θ×μ), the Gaussian one (Θ×μ_gau) and, after Def 3.8, the LGP-Gaussian and lgp-Gaussian ones. Rem 1.4.1 (i): the squares do not commute — the data literally differ along the two paths. Rem 1.4.1 (ii): every horizontal arrow obligates the vertical arrows of its column, since the Θ×μ_LGP-link out of (n,m) needs the log-shells built by the log-link into (n,m).</p>'; } },
        { title: 'pilot objects and the Θ×μ_LGP-link relative to a log-link', ev: ev(['MakePilots', 'CompareGlobalVariants']), diagram: function (c, cv) { DG.pilots(cv, c.ht00, c.g); },
          text: function () { return '<p>[IUTchIII] Def 3.8 (i): the q-pilot {q̲_v} in F⊩_Δ and the Θ-pilot {q̲_v^{j²}} in F⊩_LGP; (ii) the Θ×μ_LGP-link (0,0) → (1,0) is defined relative to the log-link (0,−1) → (0,0): it needs the log-shells. Ex 3.6 / Prop 3.7: F_MOD (torsors of rational functions, compatible with the Θ-link) versus F_mod (local fractional ideals, compatible with log-volume), and F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp.</p>'; } },
        { title: 'bi-coricity: what every vertex shares', ev: ev(['CheckBicoric']), diagram: function (c, cv) { DG.etalePicture(cv, c.w); },
          text: function () { return '<p>[IUTchIII] Thm 1.5 is the inventory of what survives both kinds of link: the D-Hodge theater down a column, F⊢×μ across a row, and — bi-coric — D⊢, its units modulo torsion via Kummer, the mono-analytic log-shells and D⊩(D⊢) up to R>0. This is the core around which the étale-picture is drawn and in terms of which the multiradial representation must be expressed.</p>'; } },
        { title: 'the H as a mutation-history; cores', ev: ev(['OperateSpecies']), diagram: function (c, cv) { DG.species(cv, M.speciesText()); },
          text: function () { return '<p>[IUTchIV] §3: species are set-theoretic formulas, mutations species-theoretic functors, and a mutation-history is an oriented graph of them. The toolkit\'s lattice is exactly that graph; composing two log-links is a mutation ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater, the forgetful functors are cores (every arrow an isomorphism), and the species-isomorphism of Def 3.1 (iv) is checked on the tables.</p>'; } }
      ]
    },
    {
      key: 'estimate', title: 'From the multiradial representation to Cor 3.12, Thm 1.10 and abc', sub: '[IUTchIII] §3, Thm 3.11, Cor 3.12; [IUTchIV] §1–§2',
      steps: [
        { title: 'tensor packets of log-shells over the procession S±_{j+1}', ev: ev(['BuildTensorPackets']), diagram: function (c, cv) { DG.procession(cv, c.g, { highlight: 2 }); },
          text: function () { return '<p>[IUTchIII] Prop 3.1–3.3: for each j the j+1 log-shells of the capsule S±_{j+1} are tensored over Q_p: log(^{S±_{j+1}}F_{v_Q}) has |V_p|^{j+1} direct summand fields at a nonarchimedean v_Q (2^j·|V_arc|^{j+1} at the archimedean one, Prop 1.5 of [IUTchIV]); the global packets (M_mod)_{S±_{j+1}} are tensor powers of F_mod and localize into the local ones. The log-volume of the integral structure is the sum of the shells\' log-volumes.</p>'; } },
        { title: 'LGP-monoids and upper semi-compatibility (Ind3)', ev: ev(['BuildLGPMonoids']), diagram: function (c, cv) { DG.indeterminacies(cv, c.g); },
          text: function () { return '<p>Prop 3.4: inside the packets the splitting monoids Ψ_LGP(S±_{j+1}) at v ∈ V^bad are generated by q̲^{j²}. Prop 3.5 (ii): the log-Kummer correspondence is only <em>upper semi-compatible</em> — at nonarchimedean v the inclusion log(O×) ⊆ I, at archimedean v a surjection onto the closed disc, at bad v equality up to roots of unity — so one gets an upper bound on the region, not an equality: (Ind3).</p>'; } },
        { title: 'log-volume normalizations and non-interference', ev: ev(['NormalizeLogVolumes']), diagram: null,
          text: function () { return '<p>Prop 3.9: multiplication by p_v changes the log-volume by −log p_v, by e at an archimedean place by +1; the packet-normalized and procession-normalized (averaged over the capsules) log-volumes; the global log-volume equals the arithmetic degree of the line bundle; the log-link preserves log-volume. Prop 3.10: F_mod^× ∩ Π O×_v = μ, so the global Kummer theory does not interfere with the local one; F_MOD is compatible with the LGP-link and F_mod with log-volume.</p>'; } },
        { title: 'the multiradial representation R^LGP_{0,◦} (Thm 3.11)', ev: ev(['RepresentMultiradially']), diagram: function (c, cv) { DG.multiradial(cv, c.g, c.section('Multiradial representation').lines); },
          text: function () { return '<p>Thm 3.11 (i): the Θ-pilot of (0,◦) is described, up to (Ind1) permutations of the processions and Aut(G_v), (Ind2) Ism on O×μ, (Ind3) upper semi-compatibility, by (a) the tensor packets, (b) the splitting monoids and (c) the copies (F_mod^×)_j, all built from the mono-analytic data that the Θ×μ_LGP-link shares with (1,◦). (ii) the log-Kummer correspondence; (iii) (a)–(d) the compatibility with the link. Per label j the hull contributes (j+1)·log d^K and the theta shift −(j²/2l)·log q.</p>'; } },
        { title: 'Cor 3.12 step by step: −|log Θ| ≥ −|log q|', ev: ev(['EstimateLogVolume']), diagram: function (c, cv) { DG.inequality(cv, c.lines('EstimateLogVolume')); },
          text: function () { return '<p>(0) −|log q| is the log-volume of the q-pilot at (1,0); (1) the Θ-pilot at (0,0) has naive log-volume −avg(j²)·|log q|; (2) the Θ×μ_LGP-link identifies it with the q-pilot; (3) the multiradial representation re-expresses it in (1,0)-terms up to Ind1–3; (4) the holomorphic hull adds Σ(j+1) log d^K; (5) the procession-normalized log-volume of the resulting region bounds −|log Θ| from above; (6) since the region contains the q-pilot, −|log Θ| ≥ −|log q|, equivalently C_Θ ≥ −1.</p>'; } },
        { title: 'the local estimates of [IUTchIV] §1: differents, μ_log, archimedean factors, prime-number bounds', ev: ev(['BoundDifferents', 'EstimateNonarchVolume', 'EstimateArchMetric', 'BoundPrimes', 'AverageWeighted', 'CheckTorsionPoints']), diagram: null,
          text: function () { return '<p>Prop 1.1–1.4: for a local field k_i with ramification e and residue degree f, a_i = (1/e)⌈e/(p−2)⌉ (or 2 for p = 2), b_i = ⌊log(pe/(p−1))/log p⌋ − 1/e give p^a R ⊆ log(R×) ⊆ p^{−b} R; the exponents of Prop 1.2 (ii)–(iv); the different bounds of Prop 1.3; μ_log(log_p R×) = −(1/e + m/(ef)) log p. Prop 1.5: 2^{|I|−1}|V|^{|I|} archimedean summands. Prop 1.6: n ≤ 4p_n/(3 log p_n) and #{p ≤ η} ≤ 4η/(3 log η) for η ≥ η_prm. Prop 1.7: weighted averages with λ_v = [(F_mod)_v : Q_p]. Prop 1.8: the torsion-point facts.</p>'; } },
        { title: 'Thm 1.10, Cor 2.2 and the shape of abc', ev: ev(['ComputeThmOneTen', 'ComputeCorTwoTwo']), diagram: function (c, cv) { DG.inequality(cv, c.lines('EstimateLogVolume')); },
          text: function () { return '<p>[IUTchIV] Thm 1.10 with (E1)–(E5): (1/6) log q ≤ (1 + 20 d_mod/l)(log d^{F_tpd} + log f^{F_tpd}) + 20(e*_mod·l + η_prm) where e*_mod = 2¹²·3³·5·e_mod and η_prm = 5·10²⁰ (the explicit value of [ExpEst]); the program prints the exact C_Θ and reports honestly that with these constants the inequality is astronomically slack for any computable triple — which is why [ExpEst] is needed for Thm A/B. Cor 2.2 chooses l in the range (C1) and gives the height form (C2): ht ≤ (1 + ε)(log-diff + log-cond) + C, the shape of the abc inequality.</p>'; } }
      ]
    },
    {
      key: 'logic', title: 'The logical structure: ∧ versus ∨, (Stp1)–(Stp8)', sub: '[EssLgc] §2.3–§2.4, Ex 2.4.5, §3.6, §3.10, §3.11',
      steps: [
        { title: 'the numerical model of Ex 2.4.5: AND gives A = ε ≤ 1, OR gives nothing', ev: ev(['EvaluateLogicModel']), diagram: null, interactive: 'logic',
          text: function () { return '<p>Replace the whole theory by numbers: the Θ-link asserts that the log-volume −2B of the Θ-pilot on one side and −A of the q-pilot on the other are the <em>same</em> number N; the multiradial representation asserts N = −2A + ε ∧ N = −A, the Θ-pilot expressed in q-side terms up to the indeterminacy ε. Taken together with ∧ (both relations hold for the same N) one gets −2A + ε = −A, A = ε ≤ 1 — the conclusion of IUT. Any ∨-reading (OR-IUT, XOR, "redundant copies", EssOR) asserts only that some disjunct holds and nothing follows. Move the sliders: the ∧-system is solvable exactly when A = ε.</p>'; } },
        { title: '(FxGl) and the chain of logical ∧ relations (Stp1)–(Stp8)', ev: ev(['ChainAndSteps']), diagram: function (c, cv) { DG.stpChain(cv, parseStp(c.lines('ChainAndSteps'))); },
          text: function () { return '<p>[EssLgc] §3.10: fix the q-pilot at (1,0) and glue it to the Θ-pilot at (0,0) (FxGl). Then (Stp1) pass to the vertically coric data (0,◦) — log-Kummer, Ind3; (Stp2) descend to the mono-analytic (0,◦)⊢ — Ind1; (Stp3) (0,0)⊢ ⇔ (1,0)⊢, the Θ-link gluing — Ind2; (Stp4) take the holomorphic hull in (1,◦); (Stp5)–(Stp6) approximate it and take determinants; (Stp7) adjust for the log-shift (1,m)↑ ⇝ (1,m+1)↓; (Stp8) take log-volumes in R: −|log Θ| ≥ −|log q|. Every step is an ∧ with the previous ones — the same object, carried along — never an ∨.</p>'; } },
        { title: 'fuzzification, engulfing, extending indeterminacies, ∨ verdicts', ev: ev(['Fuzzify']), diagram: function (c, cv) { DG.indeterminacies(cv, c.g); },
          text: function () { return '<p>(Englf): the indeterminacies turn the Θ-pilot\'s value into a region, and the region <em>engulfs</em> the q-pilot — this is what the inequality means. (ExtInd1) adding possibilities = unions of label sets, (ExtInd2) crushing = identifying labels; both only enlarge the region, so they are harmless. (logORInd): an ∨ along a log-link is harmless because log-volume is invariant under the log-link; (ΘORInd): an ∨ across the Θ-link would be fatal because it asserts nothing about the gluing.</p>'; } },
        { title: 'formal sums of labels: [0], [|j|], [⊞], [>] and the line segment of Ÿ', ev: ev(['SumLabelsFormally']), diagram: function (c, cv) { DG.formalSums(cv, c.g); },
          text: function () { return '<p>[Alien] §3.6: the labels of a Hodge theater can be bookkept as formal sums of total mass 1: [0], [|j|] = ½([j] + [−j]), [⊞] = (1/l)Σ_t [t], [>] = (1/l*)Σ_j [|j|]. The compatibilities [0] → [>], [⊞] → [>] and (1/(l*+1))([0] + Σ_j [|j|]) → [>] under t ↦ |t| and 0, ⊞ ↦ > are what make the two symmetries and the gluing consistent; the labels form a line segment of Ÿ with evaluation points ±t.</p>'; } }
      ]
    },
    {
      key: 'alien', title: 'Mono-anabelian transport and the Gaussian integral', sub: '[Alien] §1, §2.7, §3.7, §3.8',
      steps: [
        { title: 'the apparatus of mono-anabelian transport (Fig 2.1)', ev: ev(['TransportMonoAnabelian']), diagram: null, interactive: 'transport',
          text: function () { return '<p>A Frobenius-like object carries "positive mass" (the actual arithmetic: a monoid with its Kummer structure); an étale-like object is an isomorphism class reconstructed from Π_v or G_v ("zero mass"). To transport data across a link one <em>Kummer-detaches</em> it (Frobenius-like → étale-like, incurring Ind2, Ind3), carries the étale-like data across (étale-transport, incurring Ind1), and re-attaches on the other side. The run on the lattice moves the Θ-pilot\'s log-volume at (0,0) to the q-pilot\'s at (1,0). Step through the stages.</p>'; } },
        { title: 'the Gaussian integral ∫ e^{−x²} dx = √π, Steps 1–12', ev: ev(['ComputeGaussian']), diagram: null, interactive: 'gaussian',
          text: function () { return '<p>[Alien] §1 is the guiding analogy: a single copy of the integral cannot be computed (Steps 1–2, "one ring theory cannot compute the height"); introduce a second, alien copy and the plane (3–4, the two sides of the Θ-link and the lattice); the measure and the Jacobian (5–6, log-volumes and their compatibility); dilations and rotations (7, the Θ-link dilation q ↦ q^{j²} and the log-link); polar coordinates with the slit (8, the coordinates (n,m) and the indeterminacies); decoupling (9, multiradiality); the radial integral = 1 (10, the multiradial representation); the angular integral = π (11, the hull and the constants); √π with its error from the slit (12, −|log Θ| ≥ −|log q| with Ind1–3 as error term). Move the slider.</p>'; } },
        { title: 'the estimate as twelve steps (1est)–(12est) and the leading term', ev: ev(['StepEstimate']), diagram: function (c, cv) { DG.estimate(cv, parseNamed(c.lines('StepEstimate'))); },
          text: function () { return '<p>[Alien] §3.7 (ii): start with the q-pilot on the right (1est), identify it with the Θ-pilot on the left via the Θ-link (2est), express the Θ-pilot in right-hand terms by the multiradial representation (3est), invariance under Ind1 (4est) and Ind2 (5est), the upper bound from Ind3 (6est), comparison only up to isomorphism of O_k-modules (7est), the holomorphic hull ⊗ of j+1 copies of log(O_k^×) giving the log d^K terms (8est), log-volume = arithmetic degree (9est), log-Kummer on both sides (10est), the inequality (11est), and the leading term (l²/48)(6 log d^K − log q) with l ≈ √height (12est): a large constant times the Szpiro quantity.</p>'; } },
        { title: 'the dictionary (1gau)–(11gau)', ev: ev(['TranslateDictionary']), diagram: function (c, cv) { DG.gaussian(cv, 12); },
          text: function () { return '<p>[Alien] §3.8 closes the loop: each ingredient of the Gaussian computation has its counterpart in IUT, and "the error from the slit is what makes the computation possible" corresponds to the fact that the indeterminacies are precisely what makes the Θ-link\'s gluing consistent with ring theory.</p>'; } }
      ]
    }
  ];

  function parseStp(lines) {
    var out = [];
    lines.forEach(function (l) { var m = l.match(/^\s+(Stp\w+)\s+(.+?)\s+⇝\s+(.+?)\s{2,}(\S+)\s+([-\d.]+)\s+\[/); if (m) out.push({ id: m[1], from: m[2].trim(), to: m[3].trim(), ind: m[4], vol: +m[5] }); });
    return out;
  }
  function parseNamed(lines) {
    var out = [];
    lines.forEach(function (l) { var m = l.match(/^\s+(\(\d+est\)|\(\d\))\s+(.+?)\s{2,}([-\d.e+]+)\s{2,}/); if (m) out.push({ label: m[1] + ' ' + m[2].trim(), value: parseFloat(m[3]) }); });
    return out;
  }

  var state = { ex: 'abc', step: 0 };
  var container, listEl, bodyEl;

  function render(c) {
    container = c; U.clear(c);
    c.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Worked examples' }),
      el('p', { class: 'lead', html: 'Nine walks through the theory, step by step, on the Θ-data selected above. Each step explains what happens, draws it, and shows the <em>evidence</em>: the transcript of the C process that performs the step (<code>iut run …</code>), executed live by the engine.' })
    ]));
    var layout = el('div', { class: 'ex-layout' });
    listEl = el('div', { class: 'ex-list card flat' });
    bodyEl = el('div');
    layout.appendChild(listEl); layout.appendChild(bodyEl);
    c.appendChild(layout);
    renderList(); renderStep();
  }
  function renderList() {
    U.clear(listEl);
    EXAMPLES.forEach(function (e, i) {
      listEl.appendChild(el('a', { class: 'item' + (e.key === state.ex ? ' active' : ''), href: '#examples/' + e.key, onclick: function (ev) { ev.preventDefault(); go(e.key, 0); } }, [
        el('span', { class: 'n', text: (i + 1) + ' · ' + e.steps.length + ' steps' }), el('span', { class: 't', text: e.title }), el('span', { class: 's', text: e.sub })
      ]));
    });
  }
  function go(key, step) {
    state.ex = key; state.step = step || 0;
    var h = '#examples/' + key + '/' + state.step;
    if (location.hash !== h) history.replaceState(null, '', h);
    renderList(); renderStep();
    if (bodyEl && bodyEl.scrollIntoView && window.scrollY > 200) bodyEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function renderStep() {
    U.clear(bodyEl);
    var ex = EXAMPLES.filter(function (e) { return e.key === state.ex; })[0] || EXAMPLES[0];
    var st = ex.steps[Math.min(state.step, ex.steps.length - 1)], c;
    try { c = context(); } catch (e) { bodyEl.appendChild(el('p', { class: 'callout', text: 'the engine could not generate this data: ' + e.message })); return; }
    var card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'kind', text: 'example ' + (EXAMPLES.indexOf(ex) + 1) + ' · ' + ex.sub }));
    card.appendChild(el('h2', { text: ex.title }));
    var steps = el('div', { class: 'steps' });
    ex.steps.forEach(function (s, i) { steps.appendChild(el('button', { class: i === state.step ? 'active' : i < state.step ? 'done' : '', text: String(i + 1), title: s.title, onclick: function () { go(ex.key, i); } })); });
    card.appendChild(steps);
    card.appendChild(el('h3', { text: 'step ' + (state.step + 1) + ' of ' + ex.steps.length + ': ' + st.title }));
    var body = el('div', { class: 'step-body' });
    body.appendChild(el('div', { class: 'prose', html: st.text(c) }));
    if (st.interactive === 'logic') body.appendChild(logicWidget());
    if (st.interactive === 'transport') body.appendChild(stageWidget(function (cv, k) { DG.transport(cv, k); }, 3, ['Frobenius-like input', 'Kummer-detached', 'transported', 'Frobenius-like output']));
    if (st.interactive === 'gaussian') body.appendChild(stageWidget(function (cv, k) { DG.gaussian(cv, k); }, 12, null, 12));
    if (st.diagram) body.appendChild(U.canvas(function (cv) { st.diagram(c, cv); }));
    if (st.extra) { try { body.appendChild(st.extra(c)); } catch (e) { console.error(e); } }
    if (st.ev && st.ev.procs) {
      var evd = el('div', { class: 'evidence' });
      st.ev.procs.forEach(function (id) {
        var p = M.proc(id), r = M.run(id);
        evd.appendChild(el('div', { class: 'ehead' }, [el('span', { text: 'evidence' }), el('code', { text: 'iut run ' + id }), el('span', { class: 'pill ' + (r.code === 0 ? 'ok' : 'fail'), text: r.code === 0 ? 'ok' : 'failed' }), el('a', { href: '#processes/' + id, text: 'open process →', class: 'small' }), el('span', { class: 'muted', text: p ? '[' + p.paper + '] ' + p.section : '' })]));
        evd.appendChild(U.transcript(r.out.split('\n').filter(function (l) { return /^\s{4}/.test(l) || /^\s+\[/.test(l); }).join('\n'), { maxLines: 40 }));
      });
      body.appendChild(evd);
    }
    card.appendChild(body);
    card.appendChild(el('div', { class: 'step-nav' }, [
      el('button', { text: '◀ previous step', disabled: state.step === 0 ? '' : null, onclick: function () { go(ex.key, state.step - 1); } }),
      el('button', { class: 'primary', text: state.step < ex.steps.length - 1 ? 'next step ▶' : 'next example ▶', onclick: function () { if (state.step < ex.steps.length - 1) go(ex.key, state.step + 1); else { var i = EXAMPLES.indexOf(ex); go(EXAMPLES[(i + 1) % EXAMPLES.length].key, 0); } } })
    ]));
    bodyEl.appendChild(card);
  }

  /* interactive: the EssLgc numerical model with sliders (mirrors iut_esslgc_model_eval) */
  function logicWidget() {
    var A = 0.5, B = 0.75, eps = 0.5, flavour = 'AND';
    var wrap = el('div');
    var cv = el('canvas', { class: 'diagram' });
    var row = el('div', { class: 'slider-row' });
    function slider(label, get, set, min, max) {
      var inp = el('input', { type: 'range', min: min, max: max, step: '0.05', value: get() });
      var out = el('b', { text: fmt(get(), 2) });
      inp.addEventListener('input', function () { set(+inp.value); out.textContent = fmt(+inp.value, 2); draw(); });
      row.appendChild(el('label', {}, [label + ' ', inp, out]));
    }
    slider('A', function () { return A; }, function (v) { A = v; }, 0, 2);
    slider('B', function () { return B; }, function (v) { B = v; }, 0, 2);
    slider('ε', function () { return eps; }, function (v) { eps = v; }, 0, 1);
    var sel = el('select', {}, ['AND', 'OR', 'XOR', 'RCS', 'EssOR'].map(function (f) { return el('option', { value: f, text: f + '-IUT' }); }));
    sel.addEventListener('change', function () { flavour = sel.value; draw(); });
    row.appendChild(el('label', {}, ['flavour ', sel]));
    row.appendChild(el('button', { text: 'A = ε', onclick: function () { A = eps; wrap.querySelectorAll('input')[0].value = A; wrap.querySelectorAll('b')[0].textContent = fmt(A, 2); draw(); } }));
    function draw() { DG.logic(cv, A, B, eps, flavour); }
    wrap.appendChild(row); wrap.appendChild(cv); draw();
    wrap.appendChild(el('p', { class: 'small muted', text: 'the same formulas as iut_esslgc_model_eval in src/iut_ops_logic.c; the transcript below is the C program\'s run with A = 0.5, B = 0.75, ε = 0.5' }));
    return wrap;
  }
  function stageWidget(drawFn, max, names, start) {
    var k = start != null ? start : 0, wrap = el('div'), cv = el('canvas', { class: 'diagram' });
    var lbl = el('b');
    function draw() { drawFn(cv, k); lbl.textContent = names ? names[k] : 'Step ' + k; }
    var row = el('div', { class: 'slider-row' }, [
      el('button', { text: '◀', onclick: function () { k = Math.max(0, k - 1); draw(); } }),
      el('button', { text: '▶', onclick: function () { k = Math.min(max, k + 1); draw(); } }), lbl
    ]);
    if (!names) { var r = el('input', { type: 'range', min: 1, max: max, step: 1, value: k }); r.addEventListener('input', function () { k = +r.value; draw(); }); row.appendChild(r); }
    wrap.appendChild(row); wrap.appendChild(cv); draw();
    return wrap;
  }

  function examplesUsing(procId) {
    var out = [];
    EXAMPLES.forEach(function (e) { e.steps.forEach(function (s, i) { if (s.ev && s.ev.procs.indexOf(procId) >= 0) out.push({ key: e.key, title: e.title, step: i, stepTitle: s.title }); }); });
    return out;
  }
  function onHash(parts) { if (parts[1]) { state.ex = EXAMPLES.some(function (e) { return e.key === parts[1]; }) ? parts[1] : 'abc'; state.step = parts[2] ? Math.max(0, +parts[2] | 0) : 0; if (listEl) { renderList(); renderStep(); } } }
  function onChange() { if (container && container.classList.contains('active')) render(container); }

  root.VIEW_EXAMPLES = { render: render, onHash: onHash, onChange: onChange, examplesUsing: examplesUsing, EXAMPLES: EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
