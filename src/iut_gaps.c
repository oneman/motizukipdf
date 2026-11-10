/*
 * iut_gaps.c — the register of gaps and placeholders.
 *
 * Every entry names something the papers specify that the toolkit does not
 * (yet) do the way the papers do it.  Four kinds:
 *
 *   OPEN      not computed at all; a placeholder stands in
 *   APPROX    computed from bounds or estimates, and labelled as such
 *   ASSERTED  taken as an input (a flag, a constant, a theorem), not checked
 *   FIXED     was a gap or a mistake; closed, kept here for the record
 *
 * `iut gaps` prints the table, `iut gaps --md` writes docs/GAPS.md, and
 * `iut pipeline` prints, under each stage, the entries of that stage, so a
 * run never looks more complete than it is.  In the sources the statement
 * IUT_GAP("Id") marks each place an entry refers to; `make check` verifies
 * that every mark has an entry and every non-FIXED entry has a mark.
 *
 * The review that produced the table is logged in docs/gaps/REVIEW_LOG.md and
 * summarized in docs/gaps/GAP_REPORT.md.
 */
#include <string.h>
#include "iut_ops.h"

#define G(id, stage, status, ref, title, paper, code, where, plan) { id, stage, IUT_GAP_##status, ref, title, paper, code, where, plan }

const iut_gap iut_gaps[] = {
/* ------------------------------------------------------------------ stage 0: the initial Θ-data */
G("LocalFieldsOfK", 0, APPROX, "[IUTchI] Def 3.1 (c), (e); [IUTchIV] Prop 1.2–1.4, Thm 1.10 Step (iii)",
  "The local fields K_v are known only through bounds",
  "K = F(E[l]) and, for each v ∈ V, the local field K_v with its ramification index e_v, residue degree f_v, different exponent d_v and p-power roots of unity μ_{p^m}; they enter log(O×_{K_v}), the log-shell I_v and every log-volume.",
  "At a place with p ∤ 30l (F_mod = Q, F = F_mod(√−1, E[2·3·5])) iut_local_field_K writes K_v down: at a Tate-curve place K_v = Q_p(ζ_60l, q_v^{1/30l}) up to an unramified quadratic twist, so e = 30l/gcd(30l, ord q_v), d = 1 − 1/e, m = 0 unless (p − 1) | e, and f from the order of the unit of q_v (JSON data); at a good place e = 1. At p | 30l, where K_v is wildly ramified, and for any other F, e_K and m_K are still the lower bounds forced by q_v^{1/2l} ∈ K_v and by √−1, μ_3, μ_5, μ_l ⊆ K, and f_K = 1. [F:Q] and [K:Q] are upper bounds.",
  "iut_core.c: iut_local_field_K, iut_data_finish, iut_log_shell_volume",
  "Partly done: the tame places are exact (each printed value says = or ≥). Left: the wild places p | 30l, which need the Néron model at p (ordinary or supersingular reduction, and for p = l the image of inertia in GL_2(F_l)); the residue degree at good places, which needs the order of Frobenius on E[60l]; and whether the reduction at a Tate-curve place is split, which decides a factor 2 in f when f is odd."),
G("GeneratorsFreyOnly", 0, OPEN, "[IUTchI] Def 3.1; [IUTchIV] Cor 2.2",
  "Initial Θ-data is generated only for Frey curves over Q",
  "Initial Θ-data for any elliptic curve over a number field F with F_mod = Q(j_E), in particular the points of the λ-line of degree ≤ d of Cor 2.2.",
  "`--abc` builds the Frey curve of an abc triple with F_mod = Q; `--theta-json` reads four worked files (also F_mod = Q); `--random` with an odd seed invents a number field by its degree only.",
  "iut_core.c: iut_gen_from_abc, iut_gen_random; iut_input.c",
  "Open. Needs a number-field layer (minimal polynomial of j, places of F_mod with e, f). The JSON schema already has Fmod.degree and per-place data, so the reader is the place to extend."),
G("ChoiceOfLFixed", 0, FIXED, "[IUTchIV] Cor 2.2, proof, (P1)–(P3)",
  "l could not be chosen the way the proof chooses it",
  "A prime l with h^{1/2} ≤ l ≤ 10δ·h^{1/2}·log(2δh), dividing no local height ord_v(q_v), and with ord_v(q_v) < h^{1/2} if l = p_v.",
  "Was: l always given by hand. Now `--l auto` picks the smallest such prime ≥ 7 within IUT_MAX_L (iut_choose_l).",
  "iut_ops_iv.c: iut_choose_l; iut_main.c: iut_options_make_data",
  "Done in this change."),
G("BadPlaceOverL", 0, FIXED, "[IUTchI] Def 3.1 (b), (c); [IUTchIV] Thm 1.10",
  "A bad place over l was forced into V^bad_mod and the data rejected",
  "V^bad_mod is a chosen nonempty set of odd bad places prime to l; E may be bad at places of V^good, and Thm 1.10 asks for good reduction only away from 2l.",
  "Was: every odd bad multiplicative place was put in V^bad_mod, so abc(1,2400,2401) with l = 7 failed with an error. Now a bad place over l stays in V^good with a note, and log q, the theta values and f^F leave it out.",
  "iut_core.c: iut_data_finish, iut_validate_data",
  "Done in this change."),
/* ------------------------------------------------------------------ stage 1: Def 3.1 */
G("AssertedHypotheses", 1, ASSERTED, "[IUTchI] Def 3.1 (a)–(d); [IUTchIV] Thm 1.10",
  "Five hypotheses of Def 3.1 and one of Thm 1.10 are flags",
  "√−1 ∈ F; F/F_mod Galois; E[2·3] ⊆ E(F); stable reduction; Im(G_F → GL_2(F_l)) ⊇ SL_2(F_l); C_K a K-core; and for Thm 1.10, F = F_mod(√−1, E[2·3·5]).",
  "Each is a boolean the generator sets to true, or the JSON file records with its proof. The C code does not check any of them.",
  "iut_core.c: iut_validate_data; iut_i.c: iut_def_three_one_check; iut_ops_iv.c: iut_thm110_compute, iut_gap_serre_SL2",
  "Prepared: iut_gap_serre_SL2 is the placeholder for Serre's criterion (three Frobenius elements), which scripts/infographic/initialtheta-data.js already runs for the four examples; port it to C. K-core: test j ∉ {the four exceptional j-invariants} and no CM. Stable reduction: Raynaud's criterion from E[3], E[5] ⊆ E(F)."),
G("DefThreeOneLettering", 1, FIXED, "[IUTchI] Def 3.1 (a)–(f)",
  "The clauses of Def 3.1 were lettered differently from the paper",
  "(a) √−1 ∈ F; (b) X_F, stable reduction, V^bad_mod, F/F_mod, E[2·3]; (c) l, SL_2, K, l prime to V^bad_mod and ord q; (d) C̲_K, K-core; (e) V a section; (f) ε̲.",
  "Was: the checker put SL_2 and the K-core under (b), the section V under (d) and V^bad_mod under (e), and the validator cited (a) and (e) for conditions of (b). Now both follow the paper, and a clause that is part computed and part asserted says which part is which.",
  "iut_i.c: iut_def_three_one_check; iut_core.c: iut_validate_data",
  "Done in this change."),
G("DefThreeOneNotCounted", 1, FIXED, "[IUTchI] Def 3.1 (c)",
  "A failed clause (c) did not count as a problem",
  "l is prime to the orders of the q-parameters at V^bad.",
  "Was: l | ord_v(q_v) was a warning in the validator, so `iut pipeline --abc 1 2187 2188 --l 7` printed ✗ at (c) and still ended with 0 problems. Now it is an error and the pipeline counts it.",
  "iut_core.c: iut_validate_data",
  "Done in this change."),
/* ------------------------------------------------------------------ stage 2: Hodge theaters */
G("HodgeTheatersAreBookkeeping", 2, OPEN, "[IUTchI] §3–§6; [EtTh]; [FrdI], [FrdII]; [AbsTopIII]",
  "Hodge theaters are records of labels and copy numbers",
  "Categories: tempered Frobenioids F̲_v, their base categories D_v = B^temp(Π_v)^0, global Frobenioids F^⊛_mod, poly-isomorphisms as sets of isomorphisms, bridges as poly-morphisms of capsules.",
  "A prime-strip is, per v, a tuple of copy numbers (Π_v, G_v, O×) and a list of valuations; a bridge is a flag; a poly-isomorphism is a flag `full_poly_isomorphism` and, in iut_i.c, a count.",
  "iut_core.c: iut_prime_strip_build, iut_hodge_theater_new; iut_i.c",
  "Open, and by design of the data model (docs/DATA_MODEL.md §8). A first real step: represent Π_v at v ∈ V^bad by generators of the tempered fundamental group of the Tate curve and G_v by its (p, e, f) invariants, so that an isomorphism of prime-strips is an actual map."),
G("GlobalNumberFieldElements", 2, OPEN, "[IUTchI] Ex 5.1, Def 5.2; Rem 3.1.7",
  "No element of F_mod^× or κ-coric function is ever written down",
  "The monoid M^⊛_mod = F_mod^×, the κ-coric rational functions on C_K and their values at the strictly critical points, which give the NF-bridge its content.",
  "Pseudo-monoids are described by name and by Kummer-ready/Kummer-blind flags; the κ-coric check takes a caller-supplied description of a function.",
  "iut_i.c: iut_pseudo_monoid_get, iut_kappa_coric_check",
  "Open. For F_mod = Q a rational-function type with exact coefficients would do; the global Kummer theory of Prop 3.10 then becomes a statement about real elements."),
/* ------------------------------------------------------------------ stage 3: Gaussian monoids */
G("ThetaValuesOrdersOnly", 3, APPROX, "[IUTchII] Cor 2.5, 2.6, 3.5; [EtTh] Prop 1.4",
  "Theta values are orders and units of q^{j²}, not values of the theta function",
  "The étale theta function Θ̲_v evaluated at the l-torsion points labelled j gives q̲_v^{j²} = (q_v^{1/2l})^{j²} up to μ_2l, an element of K_v.",
  "The order j²·ord(q_v)/2l is exact, and the unit of q_v^{j²} is computed mod p^8 from the Tate parameter. The 2l-th root q̲_v and the theta series itself are not computed.",
  "iut_pipeline.c: stage 3; iut_input.c: iut_tate_unit_pow; iut_ops_iv.c: iut_gap_theta_value",
  "Prepared: iut_gap_theta_value is the placeholder. Extracting the 2l-th root needs K_v (gap LocalFieldsOfK); once K_v = F_v(ζ_l, q^{1/l}) is represented, q̲ is a uniformizer power times a unit by Hensel, and the series Σ (−1)^n q^{(n²+n)/2}(U^{2n+1}) can be summed to the same p-adic precision."),
/* ------------------------------------------------------------------ stage 4: the lattice */
G("LogShellFromBounds", 4, APPROX, "[IUTchIII] Def 1.1, Prop 1.2; [AbsTopIII] Def 5.4 (iii); [IUTchIV] Prop 1.2, 1.4 (ii)",
  "The log-shell I_v is given by an inner radius and a model log-volume",
  "I_v = (p*_v)^{−1}·log(O×_{K_v}) ⊆ K_v, a specific compact Z_p-module, with μ_log(I_v) = log p* − (1/e + m/(ef)) log p; at an archimedean v, the closed disc of radius π.",
  "The radius printed is that of the largest p^λ·O_v the series argument puts inside I_v. Where K_v is written down (p ∤ 30l, see LocalFieldsOfK) μ_log(I_v) = (1 − 1/e)·log p is exact and marked so; at p | 30l it uses the lower bounds for e and m and is marked a model. The archimedean log-volume is set to 0.",
  "iut_lattice.c: iut_apply_log_link; iut_ops_iii.c: iut_log_shell_make; iut_core.c: iut_log_shell_volume",
  "The wild places follow LocalFieldsOfK. The archimedean term log π per factor is carried in the hull bound (Step (vii)) and should be shown on the shell as well."),
G("LogLinkMovesNoElements", 4, OPEN, "[IUTchIII] Def 1.1 (iii), Prop 1.2 (iii), (iv), Prop 3.5",
  "The log-link relabels copies; no element goes through a logarithm",
  "log_v: O×_{†v} → †K_v, whose image becomes the additive module of the next copy ‡; the log-Kummer correspondence follows elements up the column and is only upper semi-compatible.",
  "The link copies Π_v and G_v, gives the units a new copy number and attaches the log-shells. Upper semi-compatibility is a table of three cases.",
  "iut_lattice.c: iut_apply_log_link; iut_ops_iii.c: iut_log_link_strip, iut_upper_semi_compatibility",
  "Open. With p-adic units to precision p^8 (already used for the Tate unit) the p-adic logarithm of a unit is a few lines; the first use would be to show log(q-unit) inside I_v at each v ∈ V^bad."),
/* ------------------------------------------------------------------ stage 5: multiradial representation */
G("HullBoundWasLeadingTerm", 5, FIXED, "[IUTchIV] Thm 1.10, proof, Steps (iv)–(viii)",
  "The upper bound for −|log Θ| was the two leading terms only",
  "For each v_Q the procession-normalized bound of Step (v) (distinguished), (vi) (unramified: 0) or (vii) (archimedean: ((l+5)/4) log π), summed over v_Q.",
  "Was: ((l+5)/4)·log d^K − ((l+1)/24)·log q with an estimated log d^K, called an upper bound and used for the verdict. Now iut_hull_bound_compute follows Steps (v)–(vii) place by place with every term, checks that the result is below the C_Θ of the statement, and the verdict rests on it.",
  "iut_ops_iv.c: iut_hull_bound_compute; iut_lattice.c: iut_multiradial_build",
  "Done in this change. What remains is in the two entries below."),
G("CorThreeTwelveIsAnInput", 5, ASSERTED, "[IUTchIII] Thm 3.11, Cor 3.12",
  "Cor 3.12 is used, not verified",
  "−|log Θ| ≥ −|log q|: the hull of all possible images of the Θ-pilot, in the multiradial representation and subject to (Ind1)–(Ind3), contains a region of the log-volume of the q-pilot.",
  "The toolkit computes an upper bound B for −|log Θ| and reports whether the consequence B ≥ −|log q| is consistent with the data. It cannot test the inequality itself, and it used to print it with a ✓ as if it had.",
  "iut_lattice.c: iut_multiradial_build; iut_ops_iii.c: iut_cor312_steps; iut_pipeline.c: stage 5",
  "The wording is fixed in this change. The statement itself is disputed in the literature (Scholze–Stix 2018; the 2026 Lean work), and no computation here bears on that."),
G("IndeterminaciesAreCounted", 5, OPEN, "[IUTchIII] Thm 3.11 (i), (ii); Prop 3.2, 3.5; [IUTchIV] Prop 1.2, 1.5",
  "(Ind1)–(Ind3) are counted and named, their effect on a region is not computed",
  "(Ind1) automorphisms of the procession of D⊢-prime-strips, (Ind2) Ism acting on each direct summand of each tensor packet, (Ind3) upper semi-compatibility; the hull is that of the union of the images under all of them.",
  "(Ind1) is the number Π(j+1)!, (Ind2) the number of direct summands, (Ind3) a flag. The union and its hull are replaced by the container of Prop 1.2 (ii) / 1.4 (iii) as in the proof.",
  "iut_ops_iii.c: iut_multiradial_full_build; iut_ops_iv.c: iut_hull_bound_compute, iut_gap_hull_exact",
  "Prepared: iut_gap_hull_exact is the placeholder for the exact log-volume. It needs the tensor packets as actual Z_p-lattices; with LocalFieldsOfK closed, a packet at an unramified p is a free Z_p-module with an explicit basis and the action of Ism is a group of matrices."),
G("DifferentSupport", 5, OPEN, "[IUTchIV] Thm 1.10, proof, Step (iii), (D4)–(D7)",
  "The support of the different of F_tpd is not in the data model",
  "V^dst_Q contains every prime under Supp(d^{F_tpd}); each such prime contributes log p + (l+5)·l*_mod to the bound.",
  "Only the total log d^{F_tpd} is stored. When it is not 0 the hull bound adds ((l+5)/4)·log d^{F_tpd} without those per-prime terms and marks itself incomplete. For the Frey curves F_tpd = Q and nothing is missing.",
  "iut_ops_iv.c: iut_hull_bound_compute",
  "Open; goes with GeneratorsFreyOnly: store the ramified primes of F_tpd with their exponents next to dmod."),
/* ------------------------------------------------------------------ stage 6: the height bound */
G("ThmOneTenHypotheses", 6, FIXED, "[IUTchIV] Thm 1.10",
  "The hypotheses of Thm 1.10 were not looked at, and its f^F counted the wrong places",
  "E has good reduction at every v ∈ V(F)^good not dividing 2l; F = F_mod(√−1, E[2·3·5]), hence l ≥ 7; f^F has the support of the q-divisor, V^bad_mod.",
  "Was: the inequality was evaluated for any data, and log f^{F_tpd} included a bad place over 2 (so `--abc 1 8 9` used log 6 where the theorem has log 3). Now the three hypotheses are reported, the verdict line says when the theorem does not apply, and f^F is summed over V^bad_mod.",
  "iut_ops_iv.c: iut_thm110_compute, iut_cor22_compute",
  "Done in this change."),
G("InexplicitConstants", 6, ASSERTED, "[IUTchIV] Prop 1.6, Prop 2.1 (ii), Cor 2.2 (ii); [ExpEst] §1",
  "η_prm, ξ_prm, H_unif, C_K, H_K are not given by the papers",
  "[IUTchIV] only says that η_prm and ξ_prm ≥ 5 exist, and that H_unif, C_K, H_K exist for a compactly bounded subset; the exceptional set Exc_d is finite but not listed.",
  "η_prm = 5·10^20 is borrowed from [ExpEst] (where it serves a sharper form of the prime number theorem); ξ_prm is used only through ξ_prm ≥ 5; Exc is tested by the two conditions the proof makes explicit; C_K is the constant of Thm 1.10 with e_mod = 1.",
  "iut_ops.h: IUT_ETA_PRM_VALUE; iut_ops_iv.c: iut_cor22_compute",
  "Open. For the 4/3 form of Prop 1.6 a far smaller η_prm is admissible (Rosser–Schoenfeld), which would shrink the constant of Thm 1.10 by many orders of magnitude; it needs a citation checked before it goes in."),
G("ExplicitEstimatesNotImplemented", 6, OPEN, "[ExpEst] Thm A, Thm B, Cor C",
  "The explicit abc inequality of [ExpEst] is not in the toolkit",
  "An explicit ε-version of abc and its consequences (e.g. the Fermat exponent bound), with the modified constants of [ExpEst] §1 and the case p = 2 handled by μ_6-initial Θ-data.",
  "Nothing beyond the constant η_prm. The pipeline ends at [IUTchIV] Thm 1.10 and the conditions of Cor 2.2.",
  "iut_ops_iv.c: iut_gap_explicit_abc",
  "Prepared: iut_gap_explicit_abc is the placeholder. The estimates of [ExpEst] §5 are elementary once the hull bound exists per place, which it now does."),
G("ReductionToGeneralPosition", 6, OPEN, "[IUTchIV] Cor 2.2 (i), Cor 2.3; [GenEll] Thm 2.1",
  "From compactly bounded subsets to all curves: not modelled",
  "Cor 2.3 obtains Vojta/abc for all hyperbolic curves from Cor 2.2 through [GenEll] (Belyi maps, compactly bounded subsets, bounded discrepancy classes).",
  "iut_cor23_bound evaluates the slack of one inequality; there is no notion of a compactly bounded subset or of ≈.",
  "iut_ops_iv.c: iut_cor23_bound",
  "Open. Not needed to run one curve through the theory; needed to state what the run proves."),
/* ------------------------------------------------------------------ stage 7: cross-check */
G("CrossCheckIsShallow", 7, OPEN, "—",
  "The cross-check compares four numbers, for JSON data only",
  "—",
  "log q, |log q|, log f and ht are compared with the values stored in the JSON file. Generated data has no independent check, and nothing else in the pipeline is recomputed a second way.",
  "iut_pipeline.c: stage 7",
  "Prepared: the hull bound now gives a second check (C_Θ place by place must lie below the C_Θ of the statement), which the pipeline counts. Next: recompute ord_v(q_v) from the j-invariant in C for `--abc` data."),
/* ------------------------------------------------------------------ the toolkit as a whole */
G("ManualUsesAJavaScriptPort", -1, OPEN, "scripts/manual/lib/iut.js, ops.js",
  "The manual is built from a second implementation in JavaScript",
  "—",
  "docs/IUT_MANUAL.pdf is produced by scripts/manual, which carries its own JavaScript copy of the data model and of the operations for its diagrams and progressions. The fixes of November 2026 (V^bad_mod, Def 3.1 lettering, e_K and m_K bounds, tame K_v, f^F over V^bad_mod, Thm 1.10 hypotheses, the hull bound, Cor 3.12 as an input) are ported and tested (scripts/manual/lib/test.js; the hull bound agrees with the C value), and the manual now prints `iut pipeline` and `iut gaps` from the C program. It is still a second implementation that the next C change will not reach.",
  "scripts/manual/lib/iut.js, scripts/manual/lib/ops.js",
  "Open: make the diagrams read `iut … --json` (as the guides and articles do) and delete the port."),
G("ViewsDoNotShowGaps", -1, FIXED, "—",
  "The GUI and the TUI did not show the gap list or the hull table",
  "—",
  "Was: only `iut pipeline` and the web app showed them. Now iut-gui has the hull table on the stage 5 page, the placeholders under every stage and in the object tree; the TUI has a gaps screen (key g) and lists the placeholders of stages 5 and 6 under the multiradial screen, which shows B but not the table prime by prime.",
  "src/gui/gui_draw.c: draw_mr, draw_gaps; src/gui/gui_tree.c; src/iut_tui.c",
  "Done."),
G("LeanNotInSync", -1, OPEN, "lean/",
  "The Lean mirror of the data types does not have the new fields",
  "—",
  "lean/ mirrors the structs of iut.h as of an earlier state: no m_K, no h_F_contains_five_torsion, the old rule for V^bad_mod.",
  "lean/",
  "Open."),
G("PrerequisitePapers", -1, OPEN, "pdf/: [EtTh], [AbsTopIII], [FrdI], [FrdII], [GenEll], [SemiAnbd], …",
  "The prerequisite papers have no operations layer",
  "The étale theta function and its rigidities ([EtTh]), mono-anabelian reconstruction ([AbsTopIII]), Frobenioids ([FrdI], [FrdII]), general position ([GenEll]).",
  "Their results appear as named facts and flags (cyclotomic rigidity kinds, reconstruction steps of Cor 1.2, tempered facts); none of their constructions is run.",
  "iut_i.c, iut_ops_ii.c; iut_ops_iv.c: iut_gap_reconstruct",
  "Prepared: iut_gap_reconstruct is the placeholder for a reconstruction algorithm run on a concrete profinite/tempered group. The two guides (anabelian_guide.pdf, multiradial_guide.pdf) describe the algorithms step by step and are the specification to code against."),
};
const size_t iut_gaps_count = sizeof iut_gaps / sizeof iut_gaps[0];

const char *iut_gap_status_name(iut_gap_status s)
{
    switch (s) { case IUT_GAP_OPEN: return "open"; case IUT_GAP_APPROX: return "approximate"; case IUT_GAP_ASSERTED: return "asserted"; default: return "fixed"; }
}
const iut_gap *iut_gap_find(const char *id)
{
    for (size_t i = 0; i < iut_gaps_count; ++i) if (!strcmp(iut_gaps[i].id, id)) return &iut_gaps[i];
    return NULL;
}
unsigned iut_gaps_open_in_stage(int stage)
{
    unsigned n = 0;
    for (size_t i = 0; i < iut_gaps_count; ++i) if (iut_gaps[i].stage == stage && iut_gaps[i].status != IUT_GAP_FIXED) n++;
    return n;
}

static const char *stage_name(int s)
{
    static const char *n[] = { "stage 0, initial Θ-data", "stage 1, Def 3.1", "stage 2, Hodge theaters", "stage 3, Gaussian monoids",
                               "stage 4, log-theta-lattice", "stage 5, multiradial representation", "stage 6, height bound", "stage 7, cross-check" };
    return s >= 0 && s <= 7 ? n[s] : "the toolkit as a whole";
}

void iut_view_gaps(FILE *f, const char *filter)
{
    unsigned shown = 0, by[4] = { 0, 0, 0, 0 };
    for (size_t i = 0; i < iut_gaps_count; ++i) by[iut_gaps[i].status]++;
    fprintf(f, "Gaps and placeholders: %zu entries (%u open, %u approximate, %u asserted, %u fixed)\n", iut_gaps_count, by[0], by[1], by[2], by[3]);
    for (int s = 0; s <= 8; ++s) {
        int stage = s == 8 ? -1 : s, head = 0;
        for (size_t i = 0; i < iut_gaps_count; ++i) {
            const iut_gap *g = &iut_gaps[i];
            if (g->stage != stage) continue;
            if (filter && !strstr(g->id, filter) && !strstr(g->title, filter) && !strstr(g->ref, filter) && !strstr(iut_gap_status_name(g->status), filter)) continue;
            if (!head) { fprintf(f, "\n── %s\n", stage_name(stage)); head = 1; }
            fprintf(f, "  [%s] %s — %s\n", iut_gap_status_name(g->status), g->id, g->title);
            fprintf(f, "      papers : %s   (%s)\n", g->paper, g->ref);
            fprintf(f, "      code   : %s\n", g->code);
            fprintf(f, "      where  : %s\n", g->where);
            fprintf(f, "      fix    : %s\n", g->plan);
            shown++;
        }
    }
    if (filter) fprintf(f, "\n%u entr%s match '%s'\n", shown, shown == 1 ? "y" : "ies", filter);
}

void iut_view_gaps_stage(FILE *f, int stage)
{
    unsigned n = iut_gaps_open_in_stage(stage);
    if (!n) return;
    fprintf(f, "  placeholders in this stage (%u; `iut gaps` has the detail):\n", n);
    for (size_t i = 0; i < iut_gaps_count; ++i) {
        const iut_gap *g = &iut_gaps[i];
        if (g->stage != stage || g->status == IUT_GAP_FIXED) continue;
        fprintf(f, "    ░ %-11s %s: %s\n", iut_gap_status_name(g->status), g->id, g->title);
    }
}

static void md_cell(FILE *f, const char *s) { for (; *s; ++s) { if (*s == '|') fputs("\\|", f); else fputc(*s, f); } }
void iut_md_gaps(FILE *f)
{
    unsigned by[4] = { 0, 0, 0, 0 };
    for (size_t i = 0; i < iut_gaps_count; ++i) by[iut_gaps[i].status]++;
    fprintf(f, "# GAPS\n\n<!-- generated by `iut gaps --md` from src/iut_gaps.c — do not edit -->\n\n");
    fprintf(f, "What the papers specify and the toolkit does not do the way the papers do it: %zu entries, of which %u are open, %u approximate, %u asserted and %u fixed.\n", iut_gaps_count, by[0], by[1], by[2], by[3]);
    fprintf(f, "`iut gaps` prints this table, `iut pipeline` prints the entries of each stage under that stage, and `IUT_GAP(\"Id\")` marks the places in the sources.\n");
    fprintf(f, "The review behind it is in [gaps/GAP_REPORT.md](gaps/GAP_REPORT.md) and [gaps/REVIEW_LOG.md](gaps/REVIEW_LOG.md).\n\n");
    fprintf(f, "* **open**: not computed at all; a placeholder stands in.\n* **approximate**: computed from bounds or estimates, and labelled as such.\n");
    fprintf(f, "* **asserted**: taken as an input (a flag, a constant, a theorem), not checked.\n* **fixed**: was a gap or a mistake; closed, kept for the record.\n");
    for (int s = 0; s <= 8; ++s) {
        int stage = s == 8 ? -1 : s, head = 0;
        for (size_t i = 0; i < iut_gaps_count; ++i) {
            const iut_gap *g = &iut_gaps[i];
            if (g->stage != stage) continue;
            if (!head) { fprintf(f, "\n## %c%s\n\n| id | status | what the papers specify | what the code does | where | the fix |\n|---|---|---|---|---|---|\n", stage_name(stage)[0] == 's' ? 'S' : 'T', stage_name(stage) + 1); head = 1; }
            fprintf(f, "| `%s`<br>%s | %s | ", g->id, g->title, iut_gap_status_name(g->status));
            md_cell(f, g->paper); fprintf(f, " <br>*"); md_cell(f, g->ref); fprintf(f, "* | "); md_cell(f, g->code); fprintf(f, " | "); md_cell(f, g->where); fprintf(f, " | "); md_cell(f, g->plan); fprintf(f, " |\n");
        }
    }
}

static void jstr(FILE *f, const char *s)
{
    fputc('"', f);
    for (const unsigned char *p = (const unsigned char *)s; *p; ++p) {
        if (*p == '"') fputs("\\\"", f); else if (*p == '\\') fputs("\\\\", f); else if (*p == '\n') fputs("\\n", f);
        else if (*p < 0x20) fprintf(f, "\\u%04x", *p); else fputc(*p, f);
    }
    fputc('"', f);
}
void iut_json_gaps(FILE *f, int stage)
{
    int first = 1;
    fputc('[', f);
    for (size_t i = 0; i < iut_gaps_count; ++i) {
        const iut_gap *g = &iut_gaps[i];
        if (stage >= -1 && g->stage != stage) continue;
        fprintf(f, "%s\n    {\"id\": \"%s\", \"stage\": %d, \"status\": \"%s\", \"title\": ", first ? "" : ",", g->id, g->stage, iut_gap_status_name(g->status)); jstr(f, g->title);
        fprintf(f, ", \"ref\": "); jstr(f, g->ref); fprintf(f, ", \"paper\": "); jstr(f, g->paper); fprintf(f, ", \"code\": "); jstr(f, g->code);
        fprintf(f, ", \"where\": "); jstr(f, g->where); fprintf(f, ", \"plan\": "); jstr(f, g->plan); fputc('}', f);
        first = 0;
    }
    fputc(']', f);
}

/* ------------------------------------------------------------ placeholders
 * Functions with the signature the real computation will have.  Each returns
 * IUT_NOT_IMPLEMENTED and leaves its output zeroed, so a caller can tell a
 * placeholder from a result.  The entry of the same name in iut_gaps[] says
 * what is missing and how it is to be filled.                                */
int iut_gap_serre_SL2(const iut_initial_theta_data *d, unsigned witness_primes[3])
{ IUT_GAP("AssertedHypotheses"); (void)d; if (witness_primes) witness_primes[0] = witness_primes[1] = witness_primes[2] = 0; return IUT_NOT_IMPLEMENTED; }
int iut_gap_theta_value(const iut_initial_theta_data *d, unsigned v_index, unsigned j, unsigned long long *unit_mod_p_prec)
{ IUT_GAP("ThetaValuesOrdersOnly"); (void)d; (void)v_index; (void)j; if (unit_mod_p_prec) *unit_mod_p_prec = 0; return IUT_NOT_IMPLEMENTED; }
int iut_gap_hull_exact(const iut_initial_theta_data *d, unsigned p, unsigned j, double *log_volume)
{ IUT_GAP("IndeterminaciesAreCounted"); (void)d; (void)p; (void)j; if (log_volume) *log_volume = 0; return IUT_NOT_IMPLEMENTED; }
int iut_gap_explicit_abc(long long a, long long b, long long c, double epsilon, double *bound)
{ IUT_GAP("ExplicitEstimatesNotImplemented"); (void)a; (void)b; (void)c; (void)epsilon; if (bound) *bound = 0; return IUT_NOT_IMPLEMENTED; }
int iut_gap_reconstruct(const char *algorithm, const void *group, void *out)
{ IUT_GAP("PrerequisitePapers"); (void)algorithm; (void)group; (void)out; return IUT_NOT_IMPLEMENTED; }
