# `lean/` — the IUT data types in Lean 4 / Mathlib

A port of the data model of `src/iut.h` / `docs/DATA_MODEL.md` to **Lean 4**
on top of **Mathlib**, with proofs that the objects exist (are inhabited),
that the validators of the C library are satisfied by the constructions, and
of a number of the elementary mathematical facts the C self-test only checks
numerically.

Every identifier follows `docs/IDENTIFIERS.md` (English letters only:
`ThetaPmEllNFHodgeTheater`, `FMonoGlobValUnitsModTorsPrimeStrip`,
`ThetaUnitsModTorsLGPTorsorLink`, `SPmJPlusOne`, …), so the Lean names, the C
names and the web-app names agree.  Every definition and theorem carries the
citation of the C code (`[IUTchIII] Def 1.1`, `[Alien] §3.7 (iv)`, …).

## Building

```
cd lean
lake build          # builds Mathlib (from source, unless `lake exe cache get` works for you) and IUT
```

Toolchain: `leanprover/lean4:v4.35.0`, Mathlib tag `v4.35.0` (pinned in
`lakefile.toml` / `lake-manifest.json`).  Only a subset of Mathlib is imported
(`ZMod`, `Finset` sums, `Equiv.Perm`, `Nat.Prime`, `Fintype`, `ring`/`linarith`/
`field_simp`/`positivity`), so a source build is a few hundred modules.

There are no `sorry`s and no axioms beyond Lean's standard ones; the string
tables are checked by `decide +kernel`.

## Modules

| Module | C counterpart | Contents |
|---|---|---|
| `IUT.Identifiers` | `iut_ids.c` identifier table | the 186 identifiers with kinds, references, descriptions; `identifiers_lettersOnly`, `identifiers_nodup` (case-insensitive), lookup by id / notation |
| `IUT.Labels` | `iut_labels`, `iut_fl_*` | `LPrime` (`l ≥ 5` prime), `l* = (l−1)/2`, `l± = (l+1)/2`; `F_l = ZMod l`, `|F_l| = {0..l*}`, `F_l^* = {1..l*}` as finsets with cardinalities; `absLabel : F_l → |F_l|` (surjective, fibres of size 2 / 1); the group `F_l^{⋊±}` with its `MulAction` on `F_l` (transitive); `F_l^*` acting on `|F_l|` (`FlStarSym`); processions `S^±_{j+1}`, `S_{j+1}` with cardinalities and monotonicity; `6 Σ j² = n(n+1)(2n+1)`, `12 Σ_{j=1}^{l*} j² = l* l (l+1)`, `(1/l*) Σ j² = l(l+1)/12` |
| `IUT.InitialThetaData` | `iut_valuation`, `iut_initial_theta_data`, `iut_validate_data` | valuations, `V^bad_mod`, `V^bad`, `V^good`, the `q`- and conductor divisors, `log q`, `|log q|`, `ht_E`; `WellFormed` as a `Prop` with a `Decidable` instance; the examples `(1,8,9), l=7`, `(3,125,128), l=11`, `(1,80,81), l=7` proved well-formed by `decide`; `exists_wellFormed`, `Inhabited` |
| `IUT.PrimeStrip` | `iut_ps_kind`, `iut_local_datum`, `iut_prime_strip`, `iut_validate_prime_strip` | the 9 kinds with `isEtaleLike` / `isMonoAnalytic` / `hasGlobal` / …; vertical, horizontal and bi-coricity (`biCoric_iff`: only `D⊢`); `CopyId`s of `Π_v`, `G_v`, `O×μ` in a universe; `build` is well-formed; `forget` along the `Forgettable` relation preserves well-formedness (`F ↦ D⊢`, `F⊩ ↦ F⊢×μ`), and a mono-analytic strip cannot be forgotten *to* a holomorphic one |
| `IUT.HodgeTheater` | `iut_hodge_theater`, `iut_hodge_theater_new`, `iut_validate_hodge_theater` | `Θ`, `Θ±ell`, `ΘNF`, `Θ±ell NF`-Hodge theaters, capsules `F_T`, `F_J`, pilots, log-shells; the 40-point validator as `WellFormed`; `build d n m u` is well-formed for well-formed `d` (`build_wellFormed`, `exists_wellFormed`, `Inhabited`); `forgetToD` (D-HT) preserves well-formedness |
| `IUT.Link` | `iut_link`, `iut_apply_log_link`, `iut_apply_theta_link`, `iut_validate_link` | `LinkKind` (7), `Link`, the log-link and the Θ-links with the validator and its consequences (`wellFormed_not_ring`, `wellFormed_fullPoly`, `wellFormed_alien`, `wellFormed_log_Pi`, `wellFormed_log_not_units`, …); `thetaDilation = l(l+1)/12` equals the average exponent of the Θ-pilot; `applyLogLink` / `applyThetaLink` on Hodge theaters preserve well-formedness; the log-link shares `Π_v`, `G_v` and keeps fresh units (Ind3); the `Θ×μ_LGP`-link shares `G_v`, `O×μ` and never `Π_v` (`applyThetaLink_alien`); **`square_not_commutative`**: log-then-Θ and Θ-then-log give different data at `(n+1,m+1)` |
| `IUT.LogThetaLattice` | `iut_log_theta_lattice`, `iut_lattice_*`, `iut_validate_lattice` | lazily created vertices in fresh universes, links, `buildH` (the infinite H); the validator as `Invariant`, preserved by `init`, `ensure`, `applyLogLink`, `applyThetaLink`, `buildH`; `buildH_countP_horizontal = 1`, `buildH_countP_vertical = 2(mmax−mmin)`; `alien`: distinct vertices live in distinct universes; vertical / horizontal coricity through the lattice via `get?` |
| `IUT.Multiradial` | `iut_procession_step`, `iut_indeterminacies`, `iut_multiradial_rep`, `iut_multiradial_build`, `iut_C_theta` | `Ind1_j = Perm (Fin (j+1))` of order `(j+1)!`, acting on tensor packets; `Indeterminacies.Multiradial`; **closed forms** `Σ_{j=1}^{l*}[(j+1) log d − (j²/2l) log q] = (l*(l*+3)/2) log d − (l*(l*+1)/12) log q`; `C_Θ ≥ −1 ⟺ (1/6)(1 − 12/l²) log q ≤ (1 + 12 d_mod/l)(log d + log f) + 10(e* l + η)` ([IUTchIV] Thm 1.10) |
| `IUT.Species` | `iut_species_table`, `iut_mutation_table` | the 19 species and 13 mutations; identifiers letters-only and distinct; every mutation joins species of the table; `MutationHistory` with decidable well-formedness; the lattice path `log, Θ×μ_LGP, log` is a well-formed history; the 4 core mutations and their Lean realisations |

About 280 theorems in all.  `lake env lean IUT/Link.lean` (after `lake build
IUT.HodgeTheater`) type-checks a single module.

## What is and is not proved

The library formalises the *data model* and the elementary combinatorics and
bookkeeping around it, exactly as the C code does (see `docs/DATA_MODEL.md`):
label sets, symmetries, processions, well-formedness of the constructed
objects, the sharing / non-sharing of data across the links, the shape of the
lattice, and the arithmetic identities behind the leading term and `C_Θ`.
Nothing here formalises anabelian geometry, Frobenioids, the Kummer theory, or
the inequality of [IUTchIII] Cor 3.12 itself: the log-volume estimate appears
only as the *statement* `MultiradialRep.inequalityHolds` and the equivalence
`CTheta_ge_neg_one_iff`, not as a theorem about actual log-volumes.
