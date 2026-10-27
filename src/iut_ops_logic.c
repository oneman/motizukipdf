/*
 * iut_ops_logic.c — operations of [EssLgc] (the essential logical structure) and [Alien]
 * (the mathematics of mutually alien copies).
 *
 *  [EssLgc] Ex 2.4.5   the numerical model: A, B > 0, ε ∈ [0,1], N; ∧ versus ∨
 *  [EssLgc] §3.10      the chain of logical ∧ relations: (Stp1)-(Stp8), (FxGl), (Englf),
 *                      (ExtInd1)/(ExtInd2), (logORInd)/(ΘORInd)
 *  [Alien] §1          Steps 1-12 of the computation of ∫ e^{−x²} dx = √π
 *  [Alien] §2.7        the apparatus of mono-anabelian transport (Fig 2.1)
 *  [Alien] §3.6        formal sums of labels [0], [|j|], [⊞], [>] and their compatibilities;
 *                      the line segment of labels in Ÿ and the evaluation points ±t
 *  [Alien] §3.7        the estimate, (1est)-(12est); the leading term (j+1) log d^K − (j²/2l) log q
 *  [Alien] §3.8        the dictionary (1gau)-(11gau)
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ---------------------------------------------------------------- EssLgc */
static const char *flavours[IUT_LOGIC_COUNT] = { "AND-IUT (∧)", "OR-IUT (∨)", "XOR-IUT", "RCS-IUT (redundant copies)", "EssOR-IUT" };
const char *iut_logic_flavour_name(iut_logic_flavour f) { return (unsigned)f < IUT_LOGIC_COUNT ? flavours[f] : "?"; }
void iut_esslgc_model_eval(double A, double B, double eps, iut_logic_flavour f, iut_esslgc_model *out)
{
    /* [EssLgc] Ex 2.4.5: the Θ-link asserts  N = −2B ∧ N = −A  (q-pilot log-volume −A on one side,
     * the Θ-pilot log-volume −2B on the other, glued as the SAME number N); the multiradial
     * representation asserts  N = −2A + ε ∧ N = −A  (the Θ-pilot expressed in terms of the
     * q-side data, up to the indeterminacy ε).  Taken together (∧): −2A + ε = −A, so A = ε ≤ 1.
     * The "∨" version (OR-IUT, RCS-IUT, …) asserts nothing: one of the disjuncts may simply hold. */
    memset(out, 0, sizeof *out);
    out->A = A; out->B = B; out->eps = eps; out->flavour = f;
    out->N_theta_link[0] = -2.0 * B; out->N_theta_link[1] = -A;
    out->N_multiradial[0] = -2.0 * A + eps; out->N_multiradial[1] = -A;
    out->consistent = fabs(-2.0 * A + eps - (-A)) < 1e-9;      /* the ∧-system is solvable iff A = ε */
    out->conclusion_A = eps;                                   /* A = ε ≤ 1 */
    out->meaningful = (f == IUT_LOGIC_AND);                    /* only the ∧ version yields a conclusion */
}
unsigned iut_stp_chain(const iut_log_theta_lattice *lat, iut_stp *out, unsigned max)
{
    /* [EssLgc] §3.10, (Stp1)-(Stp8), with the lattice labels of §3.6: the Θ-pilot at (0,0) is carried
     * through the vertically coric data (0,◦), descended to the mono-analytic (0,◦)⊢ and (0,0)⊢ ⇔ (1,0)⊢
     * (the Θ-link gluing), then hulled, approximated, determinant-ed, log-shift-adjusted and measured. */
    iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
    const iut_stp steps[] = {
        { "StpOne",   "(0,0)",     "(0,◦)",             "Ind3",  "[EssLgc] §3.10 (Stp1); [IUTchIII] Thm 3.11 (ii)",  rep.theta_upper_bound },  /* log-Kummer correspondence and Galois evaluation; upper semi-compatibility */
        { "StpTwo",   "(0,◦)",     "(0,◦)⊢",            "Ind1",  "[EssLgc] §3.10 (Stp2); [IUTchIII] Thm 3.11 (i)",   rep.theta_upper_bound },  /* descent to the mono-analytic étale-like data: procession automorphisms */
        { "StpThree", "(0,◦)⊢",    "(0,0)⊢ ⇔ (1,0)⊢",   "Ind2",  "[EssLgc] §3.10 (Stp3); [IUTchII] Cor 4.10 (iv)",   rep.theta_upper_bound },  /* descent to F⊢×μ, glued by the Θ-link: Ism */
        { "StpFour",  "(1,0)⊢",    "(1,◦) hull",        "none",  "[EssLgc] §3.10 (Stp4); [IUTchIII] Cor 3.12 proof", rep.hull_enlargement },   /* holomorphic hull of the 1-column */
        { "StpFive",  "(1,◦) hull","hull-approximants",  "none",  "[EssLgc] §3.10 (Stp5)",                            rep.hull_enlargement },   /* arithmetic vector bundles of the same log-volume */
        { "StpSix",   "approximants","determinant^{1/n}","none",  "[EssLgc] §3.10 (Stp6)",                            rep.hull_enlargement },   /* rational tensor power of the determinant */
        { "StpSeven", "(1,m)↑",    "(1,m+1)↓",          "none",  "[EssLgc] §3.10 (Stp7); [IUTchIII] Prop 1.2 (iii)", rep.hull_enlargement },   /* log-shift adjustment: an endomorphism of the 1-column, closed loop */
        { "StpEight", "log-volumes","R: −|log Θ| ≥ −|log q|", "monodromy", "[EssLgc] §3.10 (Stp8); [IUTchIII] Cor 3.12", -rep.abs_log_q }, /* passage to R; invariance of log-volume under log-link */
    };
    unsigned n = sizeof steps / sizeof steps[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = steps[i];
    return n;
}
int iut_fix_and_glue(const iut_log_theta_lattice *lat, double *q_side, double *theta_side)
{
    /* [EssLgc] §3.10 (FxGl): FIX the q-pilot at (1,0) and GLUE it, via the Θ-link, to the Θ-pilot at (0,0):
     * the two are the same object seen from the two sides (∧); the comparison is made in the
     * 1-column where the q-pilot lives.                                                            */
    const iut_initial_theta_data *d = &lat->data;
    iut_pilot q, th; iut_pilot_make(d, IUT_PILOT_Q, &q); iut_pilot_make(d, IUT_PILOT_THETA, &th);
    *q_side = q.log_volume; *theta_side = th.log_volume;
    return 1;
}
iut_interval iut_fuzzify(double value, const iut_indeterminacies *ind, double ind1_width, double ind2_width, double ind3_up)
{
    /* [EssLgc] §3.10 (Englf), (DstMp): the indeterminacies Ind1, Ind2 (symmetric) and Ind3 (one-sided,
     * upwards) turn the Θ-pilot into a region ("fuzzification") that engulfs the q-pilot. */
    iut_interval r = { value, value };
    if (ind->ind1) { r.lo -= ind1_width; r.hi += ind1_width; }
    if (ind->ind2) { r.lo -= ind2_width; r.hi += ind2_width; }
    if (ind->ind3) { r.hi += ind3_up; }
    return r;
}
int iut_engulfs(iut_interval region, double value) { return region.lo <= value && value <= region.hi; }
unsigned iut_extind1_union(const int *a, unsigned na, const int *b, unsigned nb, int *out)
{
    /* (ExtInd1): extending the indeterminacy by ADDING possibilities (union of the label/orbit sets) */
    unsigned n = 0;
    for (unsigned i = 0; i < na; ++i) out[n++] = a[i];
    for (unsigned i = 0; i < nb; ++i) { int dup = 0; for (unsigned k = 0; k < n; ++k) if (out[k] == b[i]) dup = 1; if (!dup) out[n++] = b[i]; }
    return n;
}
unsigned iut_extind2_crush(const int *a, unsigned na, int (*cls)(int), int *out)
{
    /* (ExtInd2): extending the indeterminacy by CRUSHING / IDENTIFYING (pass to classes) */
    unsigned n = 0;
    for (unsigned i = 0; i < na; ++i) { int c = cls(a[i]), dup = 0; for (unsigned k = 0; k < n; ++k) if (out[k] == c) dup = 1; if (!dup) out[n++] = c; }
    return n;
}
const char *iut_or_indeterminacy_verdict(int along_log_link)
{
    /* [EssLgc] §3.11 (logORInd) vs (ΘORInd): a ∨̇-indeterminacy along the log-link (which log-volume does not
     * see) is harmless, whereas a ∨ between the two sides of the Θ-link would destroy the conclusion. */
    return along_log_link ? "(logORInd): harmless — log-volume is invariant under the log-link" : "(ΘORInd): fatal — an OR across the Θ-link asserts nothing";
}

/* ---------------------------------------------------------------- Alien §1 */
double iut_alien_gauss_numeric(void)
{
    double s = 0, h = 1e-3;
    for (double x = -12.0; x < 12.0; x += h) s += exp(-x * x) * h;
    return s;
}
unsigned iut_alien_gauss_steps(iut_gauss_step *out, unsigned max)
{
    double I = iut_alien_gauss_numeric();
    const iut_gauss_step steps[] = {
        { 1,  "the naive approach e^{−x²} ↦ u fails: no elementary antiderivative", NAN, "a single ring/scheme theory cannot compute the height" },
        { 2,  "partial integration does not help either", NAN, "no Frobenius morphism in characteristic 0" },
        { 3,  "introduce a SECOND copy of the integral: I² = ∫∫ e^{−x²−y²}", I * I, "two mutually alien copies of the ring theory (the two sides of the Θ-link)" },
        { 4,  "regard them as coordinates of R²", I * I, "the log-theta-lattice as a plane of copies" },
        { 5,  "infinitesimals dx dy: the measure", I * I, "log-volumes" },
        { 6,  "the Jacobian: how the measure transforms", 1.0, "compatibility of log-volumes with the links" },
        { 7,  "linear transformations: toral dilations, unipotent, rotations", 1.0, "the dilation q ↦ q^{j²} of the Θ-link vs the rotation by the log-link" },
        { 8,  "polar coordinates on R² ∖ (R≤0 × {0})", 1.0, "the coordinates (n, m) of the lattice; the slit = the 'Kummer-detachment' indeterminacy" },
        { 9,  "decoupling of the radial and angular parts", 1.0, "multiradiality: the radial data is decoupled from the coric data" },
        { 10, "radial integral ∫_0^∞ e^{−r²} 2r dr = 1", 1.0, "the multiradial representation computes the Θ-pilot" },
        { 11, "angular integral ∫_0^{2π} (1/2) dθ = π", M_PI, "the holomorphic hull / the indeterminacies contribute the constant" },
        { 12, "√π: the result, with its 'error factor' from the slit", sqrt(M_PI), "−|log Θ| ≥ −|log q| with the indeterminacies as error term" },
    };
    unsigned n = sizeof steps / sizeof steps[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = steps[i];
    return n;
}

/* ---------------------------------------------------------------- Alien §2.7 */
unsigned iut_transport_apparatus(iut_transport_stage *out, unsigned max)
{
    /* [Alien] §2.7, Fig 2.1: mono-anabelian transport */
    const iut_transport_stage st[] = {
        { "Frobenius-like object (input)", "domain", "positive mass (rigid, carries the arithmetic)", "none", "[Alien] §2.7 (ii)" },
        { "Kummer-detachment", "domain", "—", "Kummer-detachment indeterminacies (Ind2, Ind3)", "[Alien] §2.7 (iii)" },
        { "étale-like object (reconstructed from Π/G)", "domain", "zero mass (an indeterminate isomorphism class)", "none", "[Alien] §2.7 (ii)" },
        { "étale-transport across the link (the coric data)", "link", "zero mass", "étale-transport indeterminacies (Ind1: Aut(G_v), permutations)", "[Alien] §2.7 (iii)" },
        { "étale-like object", "codomain", "zero mass", "none", "[Alien] §2.7 (ii)" },
        { "Kummer-detachment (inverse): re-attach to Frobenius-like data", "codomain", "positive mass again", "Kummer-detachment indeterminacies", "[Alien] §2.7 (iii)" },
        { "Frobenius-like object (output), compared with the input", "codomain", "positive mass", "the comparison holds up to Ind1, Ind2, Ind3", "[Alien] §2.7 (iv); [IUTchIII] Thm 3.11" },
    };
    unsigned n = sizeof st / sizeof st[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = st[i];
    return n;
}
unsigned iut_transport_run(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max)
{
    const iut_initial_theta_data *d = &lat->data;
    iut_pilot q, th; iut_pilot_make(d, IUT_PILOT_Q, &q); iut_pilot_make(d, IUT_PILOT_THETA, &th);
    iut_procession prc; iut_procession_build(d, IUT_PRC_PM, &prc);
    const iut_named_value v[] = {
        { "Frobenius-like input at (0,0): Θ-pilot log-volume", th.log_volume, "[Alien] §2.7, §3.7 (1est)" },
        { "Kummer-detach at (0,0): pass to étale-like (0,◦) data (mass 0)", 0.0, "[Alien] §2.7 (iii)" },
        { "étale-transport across the Θ-link via D⊢ (Ind1 permutations)", (double)prc.automorphisms, "[Alien] §2.7 (iii); [IUTchIII] Thm 3.11 (Ind1)" },
        { "re-attach at (1,0): q-pilot log-volume (the mass of the codomain)", q.log_volume, "[Alien] §2.7 (iv)" },
    };
    unsigned n = sizeof v / sizeof v[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = v[i];
    return n;
}

/* ---------------------------------------------------------------- Alien §3.6 */
void iut_formal_sum_make(const iut_initial_theta_data *d, iut_formal_sum_kind k, int j, iut_formal_sum *out)
{
    /* [Alien] §3.6 (i): [0]; [|j|] = ½([j] + [−j]); [⊞] = (1/l) Σ_{t∈F_l} [t]; [>] = (1/l*) Σ_{j∈F_l^*} [|j|]. */
    memset(out, 0, sizeof *out);
    switch (k) {
    case IUT_FS_ZERO: out->n = 1; out->label[0] = 0; out->coeff[0] = iut_q_make(1, 1); break;
    case IUT_FS_ABS_J: j = iut_label_abs(j); if (j == 0) { out->n = 1; out->label[0] = 0; out->coeff[0] = iut_q_make(1, 1); } else { out->n = 2; out->label[0] = j; out->label[1] = -j; out->coeff[0] = out->coeff[1] = iut_q_make(1, 2); } break;
    case IUT_FS_BOXPLUS: out->n = d->l; for (unsigned i = 0; i < d->l; ++i) { out->label[i] = (int)i - (int)d->lstar; out->coeff[i] = iut_q_make(1, (long)d->l); } break;
    case IUT_FS_GT: out->n = 2 * d->lstar; for (unsigned i = 0; i < d->lstar; ++i) { out->label[2 * i] = (int)i + 1; out->label[2 * i + 1] = -(int)i - 1; out->coeff[2 * i] = out->coeff[2 * i + 1] = iut_q_make(1, 2L * d->lstar); } break;
    }
}
iut_q iut_formal_sum_total(const iut_formal_sum *s) { iut_q t = iut_q_make(0, 1); for (unsigned i = 0; i < s->n; ++i) t = iut_q_add(t, s->coeff[i]); return t; }
static iut_q coeff_of(const iut_formal_sum *s, int label) { iut_q t = iut_q_make(0, 1); for (unsigned i = 0; i < s->n; ++i) if (s->label[i] == label) t = iut_q_add(t, s->coeff[i]); return t; }
int iut_formal_sum_compatible(const iut_initial_theta_data *d, iut_formal_sum_kind from, iut_report *r)
{
    /* [Alien] §3.6 (i), Fig 3.15/3.16: under the gluing 0,⊞ ↦ > and t ↦ |t| the formal sums are compatible:
     *   [0] → [>]   (the label 0 is identified with the diagonal/average over F_l^*),
     *   [⊞] → [>]   ((1/l)Σ_t[t] averages to (1/l*)Σ_j[|j|] once 0 is sent to >),
     *   (1/(l*+1))([0] + Σ_j [|j|]) → [>].
     * Check: after applying the label map, every image has total mass 1 and is symmetric under ±. */
    iut_formal_sum s, gt; iut_formal_sum_make(d, IUT_FS_GT, 0, &gt);
    int ok = 1; char what[32];
    if (from == IUT_FS_ZERO) { iut_formal_sum_make(d, IUT_FS_ZERO, 0, &s); snprintf(what, sizeof what, "[0]"); }
    else if (from == IUT_FS_BOXPLUS) { iut_formal_sum_make(d, IUT_FS_BOXPLUS, 0, &s); snprintf(what, sizeof what, "[⊞]"); }
    else { /* (1/(l*+1))([0] + Σ_j [|j|]) */
        memset(&s, 0, sizeof s); s.n = 1; s.label[0] = 0; s.coeff[0] = iut_q_make(1, (long)d->lstar + 1);
        for (unsigned j = 1; j <= d->lstar; ++j) { s.label[s.n] = (int)j; s.coeff[s.n++] = iut_q_make(1, 2L * (d->lstar + 1)); s.label[s.n] = -(int)j; s.coeff[s.n++] = iut_q_make(1, 2L * (d->lstar + 1)); }
        snprintf(what, sizeof what, "(1/(l*+1))([0]+Σ[|j|])");
    }
    /* total mass is preserved */
    ok = ok && iut_q_cmp(iut_formal_sum_total(&s), iut_q_make(1, 1)) == 0 && iut_q_cmp(iut_formal_sum_total(&gt), iut_q_make(1, 1)) == 0;
    /* symmetry under t ↦ −t (so the map t ↦ |t| is well defined on the sum) */
    for (unsigned i = 0; ok && i < s.n; ++i) if (iut_q_cmp(coeff_of(&s, s.label[i]), coeff_of(&s, -s.label[i])) != 0) ok = 0;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "FormalSumCompatibility", "[Alien] §3.6 (i)", "%s → [>]: total mass 1, ±-symmetric: %s", what, ok ? "compatible" : "NOT compatible");
    return ok ? 0 : 1;
}
unsigned iut_label_line_segment(const iut_initial_theta_data *d, int *out)
{ for (unsigned i = 0; i < d->l; ++i) out[i] = (int)i - (int)d->lstar; return d->l; }   /* [Alien] §3.6 (ii): the labels {−l*,…,l*} as a line segment of cusps of Ÿ */
unsigned iut_evaluation_points(const iut_initial_theta_data *d, int t, int *out)
{ if (!iut_label_in_Fl(d, t)) return 0; out[0] = t; if (t == 0) return 1; out[1] = -t; return 2; }  /* the evaluation points ±t (the cusps t and −t of Ÿ) */

/* ---------------------------------------------------------------- Alien §3.7 */
double iut_alien_leading_term_j(const iut_initial_theta_data *d, unsigned j) { return (j + 1.0) * d->logdK - ((double)j * j / (2.0 * d->l)) * iut_log_q(d); }
double iut_alien_leading_term_sum(const iut_initial_theta_data *d) { double s = 0; for (unsigned j = 1; j <= d->lstar; ++j) s += iut_alien_leading_term_j(d, j); return s; }
double iut_alien_l_from_height(const iut_initial_theta_data *d) { double h = iut_log_q(d) / 6.0; return h > 0 ? sqrt(h) : 0; }
unsigned iut_alien_estimate_steps(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max)
{
    const iut_initial_theta_data *d = &lat->data;
    iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
    iut_procession prc; iut_procession_build(d, IUT_PRC_PM, &prc);
    const iut_named_value v[] = {
        { "(1est) start with the q-pilot on the RHS (1,0): −|log q|", -rep.abs_log_q, "[Alien] §3.7 (ii) (1est)" },
        { "(2est) the Θ-link identifies it with the Θ-pilot of the LHS (0,0)", -rep.abs_log_q, "(2est)" },
        { "(3est) the multiradial representation expresses the Θ-pilot in RHS terms", rep.theta_upper_bound, "(3est); [IUTchIII] Thm 3.11" },
        { "(4est) Ind1-invariance: permutations of the procession", (double)prc.automorphisms, "(4est)" },
        { "(5est) Ind2-invariance: Ism on the units", 1.0, "(5est)" },
        { "(6est) Ind3 gives an UPPER bound on the Θ-pilot's region", rep.theta_upper_bound, "(6est)" },
        { "(7est) comparison only up to isomorphism class of O_k-modules", 0.0, "(7est)" },
        { "(8est) holomorphic hull = ⊗ of j+1 copies of log(O_k^×): log d^K terms", rep.hull_enlargement, "(8est)" },
        { "(9est) log-volume = arithmetic degree", rep.theta_upper_bound, "(9est); [IUTchIII] Prop 3.9 (iii)" },
        { "(10est) log-Kummer on both sides", 0.0, "(10est)" },
        { "(11est) the inequality −|log Θ| ≥ −|log q|", rep.theta_upper_bound + rep.abs_log_q, "(11est); [IUTchIII] Cor 3.12" },
        { "(12est) leading term (l²/48)(6 log d^K − log q), l ≈ √height", iut_leading_term(d), "(12est); [Alien] §3.7 (iv)" },
    };
    unsigned n = sizeof v / sizeof v[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = v[i];
    return n;
}

/* ---------------------------------------------------------------- Alien §3.8 */
unsigned iut_alien_dictionary(iut_dictionary_entry *out, unsigned max)
{
    const iut_dictionary_entry e[] = {
        { "(1gau) the two copies of ∫ e^{−x²}", "the two Hodge theaters on either side of the Θ-link" },
        { "(2gau) R² = the plane of the two coordinates", "the log-theta-lattice" },
        { "(3gau) the measure dx dy", "log-volumes" },
        { "(4gau) linear coordinate changes / toral dilations", "the dilation q̲ ↦ q̲^{j²} of the Θ-link" },
        { "(5gau) rotations", "the log-link (rotating multiplicative into additive structure)" },
        { "(6gau) polar coordinates", "the coordinates (n, m) and the multiradial decoupling" },
        { "(7gau) the slit R≤0 × {0}", "the indeterminacies Ind1-Ind3 (Kummer-detachment / étale-transport)" },
        { "(8gau) the radial integral = 1", "the multiradial representation of the Θ-pilot" },
        { "(9gau) the angular integral = π", "the holomorphic hull, the constant terms" },
        { "(10gau) √π", "−|log Θ| ≥ −|log q|" },
        { "(11gau) the 'error' from the slit is what makes the computation possible", "the indeterminacies are what make the Θ-link's gluing consistent with ring theory" },
    };
    unsigned n = sizeof e / sizeof e[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = e[i];
    return n;
}
