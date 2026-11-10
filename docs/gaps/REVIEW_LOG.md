# Review log

A record of the review of 2026-11-10: what was read, what was compared with what, and what
came out. The conclusions are in [GAP_REPORT.md](GAP_REPORT.md); the list of gaps is `iut gaps`
([../GAPS.md](../GAPS.md)).

## What was read

`pdf/` holds 102 files. Nine were converted to text. [IUTchI], [IUTchIII], [IUTchIV], [ExpEst]
and Yamashita's survey were read in the sections listed; the other four were only searched
for the statements the code cites. The rest of `pdf/` (the prerequisite papers) was not
opened in this review and is covered by the single entry `PrerequisitePapers`.

| paper | sections read | used for |
|---|---|---|
| [IUTchI] | Def 3.1 and its remarks; §4–§6 headings and Def 6.13 | stages 0–2 |
| [IUTchII] | searched: Cor 2.5, Cor 3.5, Cor 4.10 | stage 3 |
| [IUTchIII] | Def 1.1, Def 1.4, Prop 1.2, Def 3.8, Thm 3.11, Cor 3.12 | stages 4–5 |
| [IUTchIV] | Prop 1.2–1.6, Thm 1.10 with its whole proof (Steps (i)–(viii)), Rem 1.10.1–1.10.6, Cor 2.2 with proof, Cor 2.3 | stages 5–6 |
| [Alien] | searched: §3.7 | the leading-term form of the hull |
| Yamashita, *A proof of the abc conjecture after Mochizuki* (2024-06-25) | §1.3–1.4 (Prop 1.12, 1.15), Def 10.1, the K-core remark, Thm 13.12, Cor 13.13 | second source for every statement above |
| [ExpEst] | abstract, §5 statement, the origin of η_prm and ξ_prm | stage 6 constants |
| [EssLogic], the 2026 formalization note | searched: Cor 3.12 | status of the inequality |

Code read: every file in `src/` that `iut pipeline` reaches (`iut_core.c`, `iut_i.c`,
`iut_lattice.c`, `iut_ops_ii.c`, `iut_ops_iii.c`, `iut_ops_iv.c`, `iut_pipeline.c`,
`iut_input.c`, `iut_view.c`, `iut_json.c`), the GUI model and drawing code, the web Pipeline
view, `scripts/pipeline/build.js` and `scripts/manual/lib/`.

## Method

For each stage: write down what the paper defines, find the function that claims to implement
it, and decide whether the function (1) computes it, (2) computes something else and calls it
that, (3) computes a bound or estimate, (4) takes it as an input, or (5) does not have it.
(2) is a mistake and was fixed; (3)–(5) became registry entries. Each fix got a self-test
and each run of the four worked examples was compared before and after.

## Findings in order

1. **Stage 1.** Comparing `iut_def_three_one_check` with [IUTchI] Def 3.1 line by line: the
   letters do not match the paper. In the paper (b) carries stable reduction, V^bad_mod,
   F/F_mod Galois and E[2·3]; (c) carries l, SL_2, K and the two "prime to l" conditions;
   (d) the K-core; (e) the section V. Fixed. → `DefThreeOneLettering`.
2. **Stage 1.** `iut pipeline --abc 1 2187 2188 --l 7`: ord_3(q) = 14 is divisible by 7, the
   table shows ✗ at (c), the last line says 0 problems. The validator had it as a warning.
   Fixed. → `DefThreeOneNotCounted`.
3. **Stage 0.** `iut pipeline --abc 1 2400 2401 --l 7`: rejected because 7 | 2401 is a bad
   place over l. Def 3.1 (b) says V^bad_mod is a *chosen* set and Thm 1.10 says "good
   reduction away from 2l", so this data is admissible with v_7 ∈ V^good. Fixed.
   → `BadPlaceOverL`.
4. **Stage 6.** Thm 1.10 has hypotheses beyond Def 3.1 that the code never looked at; among
   them E[5] ⊆ E(F), which with l prime to [F:F_mod] excludes l = 5. Fixed.
   → `ThmOneTenHypotheses`, `AssertedHypotheses`.
5. **Stage 6.** log f^{F_tpd}: the theorem's f^F is supported on Supp(q) = V^bad_mod; the code
   summed over all bad places including 2. Wrong for every Frey curve with even conductor.
   Fixed (`iut_log_cond_bad`).
6. **Stage 4.** The log-shell volume takes e(K_v/Q_p) and the number m with μ_{p^m} ⊆ K_v.
   The code had e = 1, m = 0 at good primes although K ⊇ μ_{4·3·5·l}. Lower bounds applied,
   result labelled a model. Exact values are not available. → `LocalFieldsOfK`,
   `LogShellFromBounds`.
7. **Stage 5.** The central one. `iut_multiradial_build` set `inequality_holds` from
   C_Θ ≥ −1 where C_Θ came from the two leading terms and an estimated log d^K, and stage 5
   printed "Cor 3.12 … holds ✓". Read the proof of Thm 1.10: Step (ii) bounds log d^K at
   2, 3, 5, l by 11 log 2, 3 log 3, 2 log 5, 2 log l (+ log f on Supp(q)); Step (v) gives the
   per-prime bound with the terms log s_vQ and (l+5)·l*_mod; Step (vii) the archimedean
   ((l+5)/4)·log π. Implemented as `iut_hull_bound_compute` with one row per prime. Checked
   two ways: the average over j of the per-j bounds equals the total, and the total divided
   by |log q| is below the closed formula for C_Θ in the statement. Wording changed to
   "input … consistent". → `HullBoundWasLeadingTerm`, `CorThreeTwelveIsAnInput`,
   `IndeterminaciesAreCounted`, `DifferentSupport`.
8. **Stage 6.** Cor 2.2's proof chooses l by (P1)–(P3); the toolkit had no way to do that.
   Added `iut_choose_l` and `--l auto`. For 1 + 2400 = 2401 it returns 11.
   → `ChoiceOfLFixed`.
9. **Stage 6.** η_prm = 5·10^20 and ξ_prm = 10^15 are cited in the code as "[IUTchIV]
   Thm 1.10". [IUTchIV] only says such constants exist; the numbers are from [ExpEst].
   Citation corrected. → `InexplicitConstants`, `ExplicitEstimatesNotImplemented`.
10. **Stages 2–4.** Reading `iut_core.c` and `iut_lattice.c` against [IUTchI] §3–§6 and
    [IUTchIII] §1: the objects are records of labels and copy numbers. That is the documented
    design (`docs/DATA_MODEL.md`), not a mistake, but the pipeline output did not say so.
    → `HodgeTheatersAreBookkeeping`, `GlobalNumberFieldElements`, `ThetaValuesOrdersOnly`,
    `LogLinkMovesNoElements`.
11. **Outside the stages.** `scripts/manual/lib/iut.js` and `ops.js` are a separate
    JavaScript implementation used only to build `IUT_MANUAL.pdf`; a C fix does not reach it.
    The GUI and TUI draw from the older fields. `lean/` mirrors older structs.
    → `ManualUsesAJavaScriptPort`, `ViewsDoNotShowGaps`, `LeanNotInSync`.
12. **Last line of the run.** "pipeline complete: 0 problem(s)" read as "verified". Reworded,
    and followed by the count of placeholders.

## Checks that were run

| check | result |
|---|---|
| `make` (warnings as configured) | clean |
| `iut selftest` | pass |
| `iut run --all` | 73 processes, 0 failures |
| `node htdocs/test.js` | 62 checks, native = WebAssembly |
| `make check` | generated files in sync, 25 registry entries, every non-fixed entry marked in source |
| `make gui-check` | 39 runs, 0 disagreements with `iut pipeline` |
| `node scripts/pipeline/build.js` | four examples, 0 problems each |

## Not done in this review

* The 93 prerequisite and companion papers in `pdf/` were not read.
* No attempt was made to judge Cor 3.12; the toolkit cannot, and the registry says so.
* The JavaScript copy behind the manual, the article and guide PDFs, the GUI screenshots and
  `lean/` were not updated (GAP_REPORT.md §5–§6).
* The smaller η_prm suggested under `InexplicitConstants` was not applied; it needs its
  citation checked first.
