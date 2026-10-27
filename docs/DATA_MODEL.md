# The data model: species of IUT as C structs

This document explains what `src/iut.h` models, where each type comes from in
Mochizuki's papers (all of which are PDFs in this repository), which numbers the
program actually computes, and — just as important — what it does *not* claim to
compute. The web app (`htdocs/iut.js`) mirrors the same model one to one; the
node tests (`htdocs/test.js`) and the C self-tests (`iut selftest`) check the
same facts on both sides.

Citations: [IUTchI]–[IUTchIV] are the four IUT papers (IUT I is cited through the
recaps in IUT II–IV, [Pano] §3 and [Alien] §3.3, since the IUT I PDF is not in the
repository), [Pano] the Panoramic Overview, [Alien] *Mutually Alien Copies*,
[EssLgc] *Essential Logical Structure*, [ExpEst] *Explicit Estimates*, [FormIUT]
*On the Formalization of IUT*, [AbsTopIII] *Absolute Anabelian Geometry III*,
[EtTh] *The Étale Theta Function*, [FrdI/II] *Frobenioids I/II*.

## 1. Species, mutations, identifiers

[IUTchIV] §3 defines a **species** as a set-theoretic formula describing a type of
mathematical object and a **mutation** as a species-theoretic functor; a
**mutation-history** is an oriented graph of species and mutations, and the
log-theta-lattice is the mutation-history that matters. The toolkit takes this
literally: every species is a C struct, every mutation a function, and the
lattice is a graph of structs connected by applied links. The tables
`iut_species_table` / `iut_mutation_table` (exported to `docs/IDENTIFIERS.md`
and `htdocs/identifiers.js`) list which struct implements which species.

Because most of the notation uses symbols that are not letters (†HT, ‡HT,
F⊢×μ-prime-strip, F⊩_Δ, Θ×μ_LGP-link, F_l^{⋊±}, S^±_{j+1}, …) every such object
has an **English-letters-only identifier** (`^[A-Za-z]+$`, unique
case-insensitively) — see `docs/IDENTIFIERS.md` for the complete table and the
symbol dictionary († → `Dag`, ‡ → `Ddag`, ⊢ → `Mono`, ⊩ → `MonoGlob`, ×μ →
`UnitsModTors`, ⊞ → `BoxPlus`, > → `Gt`, Δ → `Triangle`, LGP/lgp →
`LGPTorsor`/`LgpIdeal`, …). The identifiers are the struct/field/function names
in C, the keys in the JSON output and the labels in both user interfaces.

## 2. Initial Θ-data — `iut_initial_theta_data` (`InitialThetaData`)

[IUTchI] Def 3.1, recalled in [Alien] §3.3 (i): a collection
(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲) such that

* F_mod = Q(j_E) ⊆ F ⊆ K = F(E[l]) ⊆ F̄; F is Galois over F_mod of degree prime
  to l and contains the fields of definition of E[2·3];
* Im(Gal(K/F) → GL₂(F_l)) ⊇ SL₂(F_l); E_F has stable reduction everywhere;
* C_K is a K-core;
* V ⊆ V(K) maps bijectively to V_mod = V(F_mod);
* V^bad_mod ⊆ V_mod is a nonempty set of **odd** nonarchimedean places of bad
  multiplicative reduction.

The struct stores the degrees `dmod | dF | dK` (the latter two as *upper bounds*,
e.g. 2·|GL₂(F₂)|·|GL₂(F₃)|·|GL₂(F₅)| and ×|GL₂(F_l)| — [IUTchIV] (E3)–(E5)), the
prime l with l* = (l−1)/2 and l± = (l+1)/2, the list `V[]` of valuations with
(p, e, f, reduction type, ord_v(q_v), ∈ V^bad_mod), the shift ε̲, and five
**asserted-hypothesis flags** for the conditions (Galois, 6-torsion, SL₂, stable
reduction, K-core) that cannot be decided from numeric data alone. The validator
reports those as `info: asserted (not machine-checkable)` rather than pretending
to check them.

**Generator (`iut_gen_from_abc`).** From an abc triple a + b = c the Frey curve
y² = x(x−a)(x+b) is used ([ExpEst] Thm A/B context): odd p | abc give bad
multiplicative reduction with ord_p(q_v) = −ord_p(j) = 2·ord_p(abc); for p = 2,
2⁴ ∥ abc gives good reduction (Δ_min = 2⁻⁸(abc)² is odd), 2⁵ | abc gives
multiplicative reduction with ord₂(q) = 2·ord₂(abc) − 8, and smaller powers give
additive reduction (flagged: stable reduction only after the extension F_tpd of
[IUTchIV] Cor 2.2). Because Frey curves have full rational 2-torsion, the
"tripodal" field F_tpd of [IUTchIV] Thm 1.10 is Q, so log(d^{F_tpd}) = 0 and
log(f^{F_tpd}) = log rad(abc). `iut_gen_random` makes either a random Frey
datum or a synthetic datum over a number field of degree 1–3.

## 3. Label sets and symmetries

F_l = {−l*,…,l*} (`Fl`), |F_l| = F_l/{±1} = {0,…,l*} (`FlAbs`), F_l^* = F_l^×/{±1}
= {1,…,l*} (`FlStar`). The additive symmetry F_l^{⋊±} = F_l ⋊ {±1} (`FlSemiPm`)
acts on F_l and governs the Θ±ell-Hodge theater (conjugate synchronization); the
multiplicative symmetry F_l^* (`FlStarSym`) acts on F_l^* and governs the
ΘNF-Hodge theater ([Alien] §3.3 (ii)). Both actions are implemented and tested.

## 4. Prime-strips — `iut_prime_strip`

[IUTchI] Fig I1.2, [IUTchII] Def 4.9, [IUTchIII] Def 1.1. A prime-strip is a
collection of local data indexed by v ∈ V. The nine kinds modelled:

| kind | data at v | nature | coricity ([IUTchIII] Thm 1.5) |
|---|---|---|---|
| D (`DPrimeStrip`) | Π_v | étale-like, holomorphic | vertically coric |
| D⊢ (`DMonoPrimeStrip`) | G_v | étale-like, mono-analytic | **bi-coric** |
| F (`FPrimeStrip`) | Π_v ↷ O▷ | Frobenius-like, holomorphic | — |
| F⊢ (`FMonoPrimeStrip`) | G_v ↷ O▷ (split) | Frobenius-like, mono-analytic | — |
| F⊢× (`FMonoUnitsPrimeStrip`) | G_v ↷ O× | | — |
| F⊢×μ (`FMonoUnitsModTorsPrimeStrip`) | G_v ↷ O×μ + ×μ-Kummer (Ism-orbit) | | horizontally coric |
| F⊢▶×μ (`FMonoValUnitsModTorsPrimeStrip`) | G_v ↷ O▶ × O×μ | | — |
| F⊩ (`FMonoGlobPrimeStrip`) | F⊢ + global realified Frobenioid C⊩ | | — |
| F⊩▶×μ (`FMonoGlobValUnitsModTorsPrimeStrip`) | F⊢▶×μ + C⊩; carries the pilots | | — |

Each local datum records *copy ids* for Π_v, G_v and the monoid O (so that
"shared" vs "distinct copy" is a literal equality of ids), whether the monoid is
O× or O×μ, whether the value-group portion O▶ and the splitting are present, the
Kummer structure (×: unique, ×μ: Ism-orbit) and the valuations of the
value-group generators **in units of ord_v(q̲_v)** where q̲_v = q_v^{1/2l}, so
that q_v has value 2l and q̲_v^{j²} has value j². `iut_prime_strip_forget` is the
forgetful mutation between kinds; the validator checks, for instance, that a
mono-analytic strip has forgotten Π_v, that an étale-like strip carries no
monoid, and that F⊢×μ has no O▶.

## 5. Hodge theaters — `iut_hodge_theater` (`ThetaPmEllNFHodgeTheater`)

[IUTchI] Def 6.13 (iii); pictures in [Pano] §3 and [Alien] §3.3 (v) Fig 3.8. A
Θ±ell NF-Hodge theater is a Θ±ell-Hodge theater glued to a ΘNF-Hodge theater:

* **Θ±ell-HT** (`ThetaPmEllHodgeTheater`): a capsule F_T of F-prime-strips
  labelled by t ∈ F_l with pairwise distinct basepoints, the Θ±-bridge F_T → F_⊞
  (`FBoxPlus`) and the Θell-bridge D_T → D_⊚± (`DCircDotPm`, Π_{X_K});
* **ΘNF-HT** (`ThetaNFHodgeTheater`): a capsule F_J labelled by j ∈ F_l^*, the
  Θ-bridge F_J → F_> (`FGt`) and the NF-bridge F_J → F_⊛ (`FCircAst`, Π_{C_K} ↷
  F_mod^×), containing the Θ-Hodge theater (F⊩_mod carrying q̲_v, F⊩_tht carrying
  Θ̲_v with Θ̲_v(j) = q̲_v^{j²});
* the **gluing 0, ⊞ ↦ >** (`GluingZeroBoxPlusToGt`) along F_l ⊇ F_l^× ↠ F_l^*.

From these the program builds the ⊩-strips of [IUTchII] Cor 4.10 / [IUTchIII]
Def 3.8: F⊩_Δ (`FMonoGlobTriangle`, labels 0 and F_l^* identified, home of the
**q-pilot** {q̲_v}), F⊩_env, F⊩_gau, F⊩_LGP (`FMonoGlobLGPTorsor`, home of the
**Θ-pilot** {q̲_v^{j²}}_{j=1..l*}) and F⊩_lgp (`FMonoGlobLgpIdeal`). Every vertex
of the lattice gets its own *universe* label ([IUTchIV] §3) and its own fresh
Frobenius-like copies.

## 6. Links and the log-theta-lattice — `iut_link`, `iut_log_theta_lattice`

[IUTchIII] Def 1.4 and Def 3.8 (iii): vertices {n,m}HT for (n,m) ∈ Z², vertical
arrows log-links, horizontal arrows Θ×μ_LGP-links (or the Θ, Θ×μ, Θ×μ_gau, Θ×μ_lgp
variants, selectable). The program models the window |n| ≤ 4, |m| ≤ 6 and
creates vertices lazily.

**log-link** (`LogLink`, [IUTchIII] Def 1.1, Prop 1.3): (n,m) → (n,m+1). The
codomain *shares the étale-like data* (all Π_v, G_v copy ids and capsule
basepoints are copied: vertical coricity), gets *fresh* Frobenius-like monoids,
and receives the **log-shells** I_v = (p*)⁻¹·log(O×_{K_v}), p* = p for odd p and
p* = p² for p = 2 ([IUTchIII] Def 1.1 (i), [AbsTopIII] Def 5.4 (iii)). The
radius is computed from log(1 + p^λ O) = p^λ O for λ > e/(p−1), and the
normalized log-volume from [IUTchIV] Prop 1.4 (ii):
μ_log(log_p(O×)) = −(1/e + m/(ef))·log p, plus log(p*) for the (p*)⁻¹ (so an
unramified odd place gives I_v = O_v with μ_log = 0).

**Θ-link** (`ThetaLink`, …, `ThetaUnitsModTorsLGPTorsorLink`; [IUTchI] Cor 3.7,
[IUTchII] Cor 4.10, [IUTchIII] Def 3.8 (ii)): (n,m) → (n+1,m), gluing †F⊩_LGP to
‡F⊩_Δ. The program identifies the G_v and O×μ copy ids (gluing data (aΘ), up to
Ind1/Ind2), leaves the value groups as they are — {q̲^{j²}} on the left, {q̲} on
the right, the "dilation" l(l+1)/12 = (1/l*)Σj² — and never identifies Π_v or
the ring structures: the two sides are **mutually alien copies** ([Alien] §1).
The link kind is stored with the flags `preserves_Pi = 0, preserves_G = 1,
preserves_units_mod_tors, preserves_ring_structure = 0, full_poly_isomorphism =
1`, and the validator rejects any link that claims otherwise.

**Infinite H** (`InfiniteH`, [EssLgc] §3.10, [Alien] §3.11 Fig 3.14): the proof
of [IUTchIII] Cor 3.12 only uses the two columns (0,◦), (1,◦) and the single
Θ-link (0,0) → (1,0); `iut_lattice_build_H` builds exactly that, and the
validator reports whether the lattice built is an H or carries several Θ-links.
The non-commutativity of the diagram ([IUTchIII] Rem 1.4.1) is checked in the
sense that the data literally differ on the two paths around any square.

## 7. Multiradial representation and the log-volume estimate

[IUTchIII] Thm 3.11 (i): R^LGP_{n,◦} = (a) tensor packets of log-shells over the
processions S^±_{j+1} = {0,…,j} (`SPmJPlusOne`), (b) splitting monoids of the
LGP-monoids, (c) copies (F_mod^×)_j, well-defined up to **Ind1** (automorphisms
of processions of D⊢-prime-strips: (j+1)! permutations and Aut(G_v)), **Ind2**
(Ism on O×μ) and **Ind3** (upper semi-compatibility of the log-Kummer
correspondence). `iut_multiradial_build` records, per j, the size (j+1), the
(j+1)! permutations, the hull term (j+1)·log(d^K) and the Θ-shift
−(j²/2l)·log(q).

[IUTchIII] Cor 3.12: −|log(Θ)| ≥ −|log(q)| with |log(q)| = log(q)/2l, both
procession-normalized (averaged over j ∈ F_l^*); equivalently C_Θ ≥ −1 for any
C_Θ with −|log(Θ)| ≤ C_Θ·|log(q)|. The program reports two things, and labels
them honestly:

1. the **exact constant of [IUTchIV] Thm 1.10**
   C_Θ = (l+1)/(4|log q|)·{(1 + 12 d_mod/l)(log d^{F_tpd} + log f^{F_tpd}) +
   10(e*_mod·l + η_prm) − (1/6)(1 − 12/l²) log q} − 1, with e*_mod =
   2¹²·3³·5·e_mod and η_prm = 5·10²⁰ (the explicit value from [ExpEst]); with
   these constants C_Θ ≥ −1 is astronomically slack for any computable triple,
   which is precisely why [ExpEst] is needed to get Thm A/B;
2. the **leading-term heuristic** of [Alien] §3.7 (iv):
   Σ_{j=1}^{l*}[(j+1)·log d^K − (j²/2l)·log q] ≈ (l²/48)(6·log d^K − log q), a
   large constant times the Szpiro quantity; the program prints both the exact
   finite sum and the asymptotic form, divided by l* for procession
   normalization. log(d^K) is only an *estimate* (log f + 2 log l for the Frey
   data) and is labelled as such everywhere.

The étale-picture view shows the bi-coric D⊢-prime-strip at the centre with the
Hodge theaters built so far as spokes ([IUTchIII] Cor 3.12; [IUTchI] Cor 6.10).

## 8. What is not modelled

* The anabelian reconstruction algorithms themselves (mono-anabelian transport,
  the cyclotomic rigidity isomorphisms, the theta function as an actual
  function): the program tracks *what is identified with what* and *which
  indeterminacies are incurred*, not the reconstructions.
* Honest field arithmetic for F and K: degrees are upper bounds, different
  estimates are coarse, and the five Def 3.1 hypotheses are asserted flags.
* Anything about the 2-adic place beyond the Frey-curve minimal-model case.

Everything the program *does* compute is cross-checked between the C and JS
implementations by `make test`.

## 9. Where each object appears in the web app

Part I of `htdocs/index.html` draws one diagram per data type of this document
(`htdocs/diagrams.js`, `DIAGRAMS.cards`), Part II (`htdocs/processes.js`,
`PROCESSES.list`) walks through the processes that use them:

| process | objects used | sources followed |
|---|---|---|
| 1 abc → Θ-data | `InitialThetaData`, `VSet`, `VBadMod`, label sets, `LogQ`, `LogF` | [IUTchI] Def 3.1 via [IUTchIV] §2, [Pano] §3 |
| 2 forgetting | the nine prime-strip kinds, `CORIC` | [IUTchI] Fig I1.2; [IUTchIII] Thm 1.5 |
| 3 Hodge theater | `FT`, `FJ`, bridges, `FBoxPlus`, `DCircDotPm`, `FGt`, `FCircAst`, pilots | [IUTchI] Def 6.13; [Alien] Fig 3.8 |
| 4 lattice | `LogLink`, `ThetaLink`, `NCircColumn`, `InfiniteH`, `LogShell` | [IUTchIII] Def 1.4; [Alien] Fig 3.6, 3.15 |
| 5 Θ-link | (aΘ),(bΘ),(cΘ), `AlienCopy`, `IndOne`, `IndTwo` | [Alien] §3.3 (vii), §3.6 (iv), Fig 3.19 |
| 6 transport | Frobenius-like / étale-like, Kummer, `KummerDetachment` | [Alien] §2.7, Fig 2.1 |
| 7 (Stp1)–(Stp8) | labels (0,0) ⇝ (0,◦) ⇝ (0,◦)⊢ ⇝ (0,0)⊢ ⇔ (1,0)⊢, `HolomorphicHull`, `LogVolume` | [EssLgc] §3.6, §3.10 |
| 8 ∧ vs ∨ | the numerical model A, B, ε, N | [EssLgc] §2.3, §2.4, Ex 2.4.5 |
| 9 Gaussian integral | — (analogy) | [Alien] §1, §3.8 |
| 10 log-volume | `MultiradialRepresentation`, `SPmJPlusOne`, `CTheta`, Thm 1.10 | [IUTchIII] Cor 3.12; [IUTchIV] Thm 1.10 |

The diagrams are drawings of the *data model*, not of the proofs: processes 6,
7 and 9 render the structure of the arguments as described in [Alien] and
[EssLgc] (labels, indeterminacies, which object is glued to which), while the
anabelian reconstructions, the Kummer theory of theta functions and the
multiradial algorithm itself remain outside the program (see §8).
