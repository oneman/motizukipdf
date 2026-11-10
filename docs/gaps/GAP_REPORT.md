# Gap report: can the toolkit run the whole of IUT without mistakes?

Date: 2026-11-10. Scope: the C toolkit in `src/` (library, `iut` CLI, TUI, `iut-gui`), its
WebAssembly build in `htdocs/`, and the generated documents, compared with the papers in `pdf/`.
The day-by-day record of what was read and found is [REVIEW_LOG.md](REVIEW_LOG.md); the
machine-readable list is `iut gaps` ([../GAPS.md](../GAPS.md), generated from `src/iut_gaps.c`).

## 1. Answer in short

No, not yet, and it now says so itself.

`iut pipeline` does carry real initial Θ-data through eight stages and logs every stage, and
every arithmetic quantity that the papers define by a formula (log q, |log q|, the orders of
the theta values, the pilot log-volumes, the constant C_Θ, both sides of Thm 1.10, the
conditions of Cor 2.2) is computed. What it does not do is perform the constructions the
theory consists of: there are no local fields, no Galois or tempered groups, no elements that
pass through a log-link, no region whose hull is taken. Those stages are bookkeeping of
labels and copy numbers plus formulas taken from the end of the proofs.

Before this change the output did not make that distinction. It ended with
"pipeline complete: 0 problem(s)" and printed "Cor 3.12 … ✓". The review found eight outright
mistakes (section 2) and seventeen places where the code stands in for something the papers
do (section 3). The mistakes are fixed. The stand-ins are now placeholders: named, listed in
a registry, marked in the source, printed under the stage they belong to, and counted in the
last line of every run.

| | count |
|---|---|
| mistakes found and fixed | 8 (6 registry entries marked *fixed*, 2 folded into *approximate* entries) |
| placeholders: not computed at all (*open*) | 13 |
| placeholders: computed from bounds (*approximate*) | 3 |
| placeholders: inputs that are not checked (*asserted*) | 3 |
| placeholder functions with their final signature, returning `IUT_NOT_IMPLEMENTED` | 6 |

## 2. Mistakes that were fixed

Each of these produced a wrong statement or a wrong number in the old output.

1. **The verdict on Cor 3.12 rested on a heuristic.** The "upper bound for −|log Θ|" was the
   two leading terms ((l+5)/4)·log d^K − ((l+1)/24)·log q with an estimated log d^K, and the
   pipeline printed the corollary with a ✓. The bound is now the one in the proof of
   [IUTchIV] Thm 1.10, Steps (v)–(vii), computed prime by prime with every term
   (`iut_hull_bound_compute`): at a distinguished prime
   ((l+5)/4)·log d^K_vQ − ((l+1)/24)·log q_vQ + log s_vQ + (l+5)·l*_mod, at an unramified
   prime 0, at the archimedean prime ((l+5)/4)·log π. For 1 + 8 = 9 with l = 7 this gives
   B = 792.815 and C_Θ = B/|log q| = 2525.78, against the leading-term figure 15.59 that was
   shown before, and against 3.19·10^22 from the closed formula of the statement. The
   pipeline checks that the place-by-place value lies below the closed formula and counts a
   problem if it does not. Cor 3.12 itself is labelled an input and the line reads
   "consistent", not "holds".
2. **The clauses of Def 3.1 were lettered differently from the paper.** SL_2 and the K-core
   sat under (b), the section V under (d), V^bad_mod under (e). Both the checker and the
   validator now follow [IUTchI] Def 3.1 (a)–(f), and each clause says which part is computed
   and which is asserted.
3. **A failed clause (c) was not a problem.** l dividing ord_v(q_v) at a place of V^bad_mod
   was a warning, so `iut pipeline --abc 1 2187 2188 --l 7` showed ✗ at (c) and still exited
   0. It is an error now.
4. **A bad place over l made valid data fail.** Every odd place of bad multiplicative
   reduction was forced into V^bad_mod, so 1 + 2400 = 2401 with l = 7 was rejected. Def 3.1
   lets V^bad_mod be a chosen set prime to l, and Thm 1.10 asks for good reduction only away
   from 2l. Such a place now stays in V^good with a note.
5. **Thm 1.10 was evaluated without its hypotheses.** l ≥ 7 (forced by E[5] ⊆ E(F) and
   l prime to [F:F_mod]), good reduction away from 2l, and F = F_mod(√−1, E[2·3·5]) are now
   reported, and the pipeline says "does NOT apply" when one fails. l = 5 with E[5] ⊆ E(F) is
   a validator error.
6. **f^F in Thm 1.10 counted a place over 2.** `--abc 1 8 9` used log 6 where the theorem,
   which sums over V^bad_mod, has log 3. Same correction in the lower bound of Cor 2.2.
7. **Log-shells ignored the roots of unity in K.** K contains the 4·3·5·l-th roots of unity,
   so e(K_v/Q_p) is at least 2 at p = 2 and divisible by p − 1 at p = 3, 5, l, and μ_{p^m}
   with m ≥ 1 (m ≥ 2 at p = 2) lies in K_v. The log-volume formula used e = 1, m = 0 at these
   primes. The lower bounds are applied now and the result is labelled as that of a model
   field.
8. **l could only be given by hand.** `--l auto` picks l as the proof of Cor 2.2 does,
   conditions (P1)–(P3) (`iut_choose_l`); the pipeline prints which l that would be.

## 3. Placeholders, by stage

Status words: *open* = not computed; *approximate* = computed from bounds and labelled so;
*asserted* = an input that is not checked. The id is the name in `iut gaps` and in the
`IUT_GAP("…")` marks.

| stage | id | status | what stands in | prepared next step |
|---|---|---|---|---|
| 0 data | `LocalFieldsOfK` | approximate | e, f, m, d of K_v are bounds, not values | stub `iut_gap_local_field_K`; K_v = F_v(ζ_l, q_v^{1/l}) at V^bad from the Tate parameter already in the JSON |
| 0 data | `GeneratorsFreyOnly` | open | only Frey curves over Q and four worked files | number-field layer in the JSON reader |
| 1 Def 3.1 | `AssertedHypotheses` | asserted | √−1 ∈ F, Galois, E[6], stable reduction, SL_2, K-core, E[5] are flags | stub `iut_gap_serre_SL2`; port Serre's criterion from `scripts/infographic/initialtheta-data.js` |
| 2 Hodge theaters | `HodgeTheatersAreBookkeeping` | open | prime-strips are tuples of copy numbers, bridges are flags | represent Π_v at V^bad by generators |
| 2 Hodge theaters | `GlobalNumberFieldElements` | open | no element of F_mod^×, no κ-coric function | rational functions with exact coefficients for F_mod = Q |
| 3 Gaussian monoids | `ThetaValuesOrdersOnly` | approximate | orders exact, units mod p^8; q̲_v and the theta series are not evaluated | stub `iut_gap_theta_value` |
| 4 lattice | `LogShellFromBounds` | approximate | I_v from lower bounds for e and m; archimedean volume 0 | exact once `LocalFieldsOfK` closes |
| 4 lattice | `LogLinkMovesNoElements` | open | the log-link renumbers copies | p-adic log of the Tate unit to precision p^8 |
| 5 multiradial | `CorThreeTwelveIsAnInput` | asserted | the inequality is used, not tested | none: no computation here can decide it |
| 5 multiradial | `IndeterminaciesAreCounted` | open | (Ind1)–(Ind3) are numbers and a flag; the hull is the container of Prop 1.2/1.4 | stub `iut_gap_hull_exact` |
| 5 multiradial | `DifferentSupport` | open | only the total log d^{F_tpd} is stored | store ramified primes next to d_mod |
| 6 height bound | `InexplicitConstants` | asserted | η_prm = 5·10^20 from [ExpEst], ξ_prm ≥ 5, Exc by two tests | check a citation for a smaller η_prm |
| 6 height bound | `ExplicitEstimatesNotImplemented` | open | nothing of [ExpEst] beyond η_prm | stub `iut_gap_explicit_abc` |
| 6 height bound | `ReductionToGeneralPosition` | open | no compactly bounded subsets ([GenEll]) | not needed for a single run |
| 7 cross-check | `CrossCheckIsShallow` | open | four numbers, JSON data only | recompute ord_v(q_v) from j in C |
| outside | `ManualUsesAJavaScriptPort` | open | the manual runs a JavaScript copy of the model | section 5 below |
| outside | `ViewsDoNotShowGaps` | open | `iut-gui` and the TUI have no gap list or hull table | one page each |
| outside | `LeanNotInSync` | open | `lean/` mirrors older structs | add m_K, the E[5] flag, the V^bad_mod rule |
| outside | `PrerequisitePapers` | open | anabelian and étale-theta results are named facts | stub `iut_gap_reconstruct`; the two guides are the spec |

The single dependency that unlocks most of the rest is `LocalFieldsOfK`. With the true
(e, f, m, d) of K_v, the log-shells become exact, q̲_v can be extracted, the p-adic logarithm
has something to act on, and the tensor packets become actual Z_p-lattices whose hull can be
measured. That is the recommended next piece of work.

## 4. How the gaps are kept from getting lost

* `src/iut_gaps.c` is the registry. `iut gaps` prints it; `--md` and `--json` export it; a
  word after `gaps` filters by id.
* `IUT_GAP("Id");` is a no-op statement placed where the stand-in code is.
  `scripts/check-gaps.sh`, run by `make check`, fails if a non-fixed entry has no mark in the
  sources or a mark names an id that is not in the registry.
* `iut pipeline` prints the entries of each stage under that stage and ends with
  "N placeholder(s) stand in for parts of the theory that are not computed". The JSON has
  them under `gaps`. The web Pipeline view shows them in a fold-out per stage.
* The six stubs (`iut_gap_local_field_K`, `iut_gap_serre_SL2`, `iut_gap_theta_value`,
  `iut_gap_hull_exact`, `iut_gap_explicit_abc`, `iut_gap_reconstruct`) have the signatures
  the real functions should have and return `IUT_NOT_IMPLEMENTED` (−77), so code written
  against them compiles today and a caller cannot mistake the stub for a result.
* `docs/GAPS.md` is generated; `make check` fails when it is stale.

## 5. Fixes to port to the JavaScript copy used by the manual

`docs/IUT_MANUAL.pdf` is built by `scripts/manual` from `scripts/manual/lib/iut.js` and
`ops.js`, a second implementation. None of the fixes above reach it. Until the manual reads
`iut … --json` instead, these need the same change there:

1. V^bad_mod = bad multiplicative, odd, and p ≠ l.
2. l | ord_v(q_v) at V^bad_mod is an error.
3. Def 3.1 lettering in the checker and in every citation.
4. e_K and m_K lower bounds from √−1, μ_3, μ_5, μ_l; the log-shell volume uses m_K.
5. log f^F over V^bad_mod in Thm 1.10 and Cor 2.2.
6. The three hypotheses of Thm 1.10 and the l = 5 rule.
7. The hull bound of Steps (v)–(vii) in place of the leading terms; eight steps for Cor 3.12
   with "input" wording.

## 6. What is out of date after this change

Regenerated here: `docs/GAPS.md`, `docs/IDENTIFIERS.md`, `docs/PROCESSES.md`,
`docs/PIPELINE.md` (table), `docs/initial-theta-data/pipeline/*`, `htdocs/data/*`,
`htdocs/engine/iut.wasm.js`.

Not regenerated, and now behind the code:

* `docs/IUT_MANUAL.pdf` (section 5).
* `funfun_iut.pdf`, `multiradial_guide.pdf`, `gokun_abc.pdf`: they quote
  `docs/initial-theta-data/pipeline/*.json`. The fields they read are still there, but
  "Σ leading terms" and the Cor 3.12 wording in them predate the hull bound.
* `docs/gui/*.png`: the stage 1 tree and the stage 5 and 6 panels changed text.
* `lean/`: see `LeanNotInSync`.

## 7. Tests

`scripts/test.sh` passes: the C self-tests, `iut run --all` (73 processes, 0 failures), the
62 web-engine checks (native and WebAssembly output byte-identical), `make check` (generated
files and gap marks in sync) and `make gui-check` (every example through every stage, the
GUI model agreeing with `iut pipeline`). New self-tests cover the Thm 1.10 hypotheses, the
hull bound (distinguished primes {2, 3, 5, 7, 13} for example 2, and the average over j
equal to B), the bad place over l, the l | ord q error, and `iut_choose_l`.
