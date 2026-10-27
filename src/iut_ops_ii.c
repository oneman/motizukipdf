/*
 * iut_ops_ii.c — operations of [IUTchII] (Hodge–Arakelov-theoretic evaluation).
 *
 *  Ex 1.7-1.9   radial environments, multiradiality, multiradialization
 *  Cor 1.10-1.12 the three cyclotomic rigidity isomorphisms and constant multiple rigidity
 *  Cor 2.4, 2.5, 2.8  theta evaluation at the l-torsion points, indices of tempered groups
 *  Prop 3.1, Cor 3.5-3.7  theta monoids, Gaussian monoids, the evaluation isomorphism
 *  Cor 4.5-4.8  constant monoids, semisimplifications, D⊩(D⊢), symmetrizing isomorphisms,
 *               conjugate synchronization, Kummer isomorphisms
 *  Def 4.9      the mono-analytic forgetting ladder F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢, pilots
 *  Cor 4.10     F⊩_Δ ≅ F⊩_mod, F⊩_env ≅ F⊩_tht ≅ F⊩_gau, the Θ×μ / Θ×μ_gau-links, coric F⊢×μ
 *  Cor 4.11, Rem 4.11.1  étale picture, the exponents (1², …, (l*)²)
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ------------------------------------------------------ radial environments */
void iut_radial_env_make(const char *radial, const char *coric, int full, const char *ref, iut_radial_env *out)
{ memset(out, 0, sizeof *out); out->radial = radial; out->coric = coric; out->full = full; out->ref = ref; }
int iut_radial_env_is_multiradial(const iut_radial_env *e) { return e->full; }   /* [IUTchII] Ex 1.7 (i): multiradial ⇔ Φ: R → C is full */
void iut_radial_env_multiradialize(const iut_radial_env *in, iut_radial_env *out)
{
    /* [IUTchII] Ex 1.7 (ii), (iii): replace the radial data R by pairs (R, α) with α a
     * full poly-isomorphism of the coric data; the resulting functor is tautologically
     * full, at the cost of introducing the indeterminacy α.                          */
    *out = *in; out->full = 1; out->multiradialized = 1;
}
const iut_radial_env iut_radial_examples[] = {
    { "holomorphic structure: Π_v ↷ O▷_{F̄_v} (an F-prime-strip)", "D⊢ = {G_v}", 0, 0, "[IUTchII] Ex 1.8 (i): uniradial — the ring structure is not transportable" },
    { "D⊢ itself", "D⊢", 1, 0, "[IUTchII] Ex 1.8 (ii): the coric data is tautologically multiradial" },
    { "O×μ_v with G_v-action, up to Ism", "D⊢", 1, 0, "[IUTchII] Ex 1.8 (iv), Cor 1.12: units modulo torsion are multiradial (Ind2)" },
    { "O×_v with its Ẑ×-Kummer structure", "D⊢", 0, 0, "[IUTchII] Ex 1.8 (iii): the full Kummer structure on O× is uniradial (needs the cyclotome)" },
    { "the mono-theta environment and its cyclotomic rigidity (l·Δ_Θ)(Π) ≅ Π_μ", "D⊢", 1, 0, "[IUTchII] Cor 1.10, Ex 1.9: multiradial" },
    { "theta monoids Ψ_env(D_>) with their splittings", "(D⊢, F⊢×μ(D⊢))", 1, 0, "[IUTchII] Thm 2.2, Cor 2.3 (étale-picture radial environment)" },
    { "the multiradial representation R^LGP: packets, splitting monoids, (F_mod^×)_j", "(D⊢, F⊢×μ)", 1, 1, "[IUTchIII] Thm 3.11 (i): multiradial up to Ind1, Ind2, Ind3" },
};
const size_t iut_radial_examples_count = sizeof iut_radial_examples / sizeof iut_radial_examples[0];

/* ------------------------------------------------------- cyclotomic rigidity */
void iut_cyclotomic_rigidity_get(iut_cyclotomic_kind k, iut_cyclotomic_rigidity *out)
{
    memset(out, 0, sizeof *out);
    out->kind = k;
    switch (k) {
    case IUT_CYC_MONO_THETA:       /* [IUTchII] Cor 1.10: (l·Δ_Θ)(Π_v) ≅ Π_μ(M^Θ_*(Π_v)) via the commutator structure of the theta group */
        out->indeterminacy = "none"; out->multiradial = 1; out->uses_ring_structure = 0; out->ref = "[IUTchII] Cor 1.10; [IUTchIII] Rem 2.3.3 (i)"; break;
    case IUT_CYC_MLF_GALOIS_PAIR:  /* [IUTchII] Cor 1.11: via local class field theory; only up to the Ẑ×-orbit (resp. Aut(G_v)-orbit) — needs O▷ with its ring structure */
        out->indeterminacy = "Ẑ×-orbit (resp. Aut(G_v)-orbit) on the units"; out->multiradial = 0; out->uses_ring_structure = 1; out->ref = "[IUTchII] Cor 1.11; [IUTchIII] Rem 2.3.3 (ii)"; break;
    case IUT_CYC_NUMBER_FIELD:     /* [IUTchI] Ex 5.1 (v), [IUTchII] Cor 4.8, [IUTchIII] Rem 2.3.3 (vi): Q>0 ∩ Ẑ× = {1} applied to the κ-coric functions of the number field */
        out->indeterminacy = "none (Q>0 ∩ Ẑ× = {1})"; out->multiradial = 1; out->uses_ring_structure = 0; out->ref = "[IUTchI] Ex 5.1 (v); [IUTchII] Cor 4.8; [IUTchIII] Rem 2.3.3 (vi)"; break;
    default: break;
    }
}
unsigned iut_constant_multiple_rigidity_orbit(void) { return 2; }  /* [IUTchII] Cor 1.12: constant multiples are rigid up to the ι-indeterminacy ±1; Γ^{×μ} = Ism */

/* ----------------------------------------------------------- theta evaluation */
void iut_tempered_indices_get(const iut_initial_theta_data *d, iut_tempered_indices *out)
{
    /* [IUTchII] Cor 2.4 (i): [Π_v : Π_Ÿ] = 2, [Π±_v : Π_v] = l, [Π±_v : Π_Ÿ] = 2l for the
     * tempered fundamental groups of X_v, Ÿ_v, X±_v (cf. [IUTchI] Def 2.1(?); [EtTh]). */
    out->Pi_to_PiYdd = 2; out->PiPm_to_Pi = d->l; out->PiPm_to_PiYdd = 2 * d->l;
}
void iut_theta_evaluate(const iut_initial_theta_data *d, int t, iut_theta_value *out)
{
    /* [IUTchII] Cor 2.5 (i), Cor 2.8: restricting the étale theta function θ (of
     * [EtTh]) to the decomposition group D_{t,μ−} of the evaluation point labelled t
     * gives the value q̲_v^{t²} up to μ_{2l} (resp. μ: mono-theta version); the value
     * depends only on |t| ∈ |F_l|.  In q̲-units: ord = t².                              */
    memset(out, 0, sizeof *out);
    out->t = t; out->abs_t = iut_label_abs(t);
    out->value = iut_q_make((long)t * t, 1);
    out->torsion_indeterminacy = 2 * d->l;
    out->mono_theta = 1;
}
unsigned iut_theta_evaluate_all(const iut_initial_theta_data *d, iut_theta_value *out)
{
    for (unsigned j = 0; j <= d->lstar; ++j) iut_theta_evaluate(d, (int)j, &out[j]);
    return d->lstar + 1;
}
unsigned iut_evaluation_points_count(const iut_initial_theta_data *d) { return d->l; }  /* [IUTchII] Cor 2.4 (ii): one D_{t,μ−} per t ∈ F_l */

/* ----------------------------------------------------------------- monoids */
static unsigned bad_index(const iut_initial_theta_data *d, unsigned v_index)
{ return v_index < d->nV ? v_index : 0; }

void iut_monoid_build(const iut_initial_theta_data *d, iut_monoid_kind k, unsigned v_index, unsigned copy_base, int etale_like, iut_monoid *out)
{
    memset(out, 0, sizeof *out);
    v_index = bad_index(d, v_index);
    const iut_valuation *v = &d->V[v_index];
    out->kind = k; out->v_index = v_index; out->etale_like = etale_like;
    out->G_copy = copy_base * 1000 + v_index * 10 + 1;
    out->units_copy = copy_base * 1000 + v_index * 10 + 3;
    int bad = (v->kind == IUT_V_NONARCH && v->red == IUT_RED_BAD_MULT);
    switch (k) {
    case IUT_MON_CONSTANT:    /* [IUTchII] Cor 4.5 (i) (étale-like, from Π_v) / Cor 4.6 (i) (Frobenius-like): Ψ_cns = O▷, generated by O× and (any uniformizer) */
        out->ngen = 1; out->gen[0] = iut_q_make(bad ? 1 : 1, 1); out->gen_label[0] = 0; break;
    case IUT_MON_THETA:       /* [IUTchII] Prop 3.1 (i): Ψ_env = O×_{M^Θ} · θ^ι_env^N — the theta function itself, not yet evaluated */
    case IUT_MON_THETA_INF:   /* Prop 3.1 (ii): ∞Ψ_env — all N-th roots of θ adjoined */
        out->ngen = 1; out->gen[0] = iut_q_make(0, 1); out->gen_label[0] = -1; out->perfected = (k == IUT_MON_THETA_INF); out->split = 1; break;
    case IUT_MON_GAUSSIAN:    /* [IUTchII] Cor 3.5 (ii), Cor 3.6: Ψ_gau = O× · (q̲^{j²})_{j ∈ F_l^*} ⊆ Π_{|t|} Ψ_cns(…)_{|t|}, via the value-profile ξ */
    case IUT_MON_GAUSSIAN_INF:
        out->ngen = d->lstar;
        for (unsigned j = 1; j <= d->lstar; ++j) { out->gen[j - 1] = iut_q_make(bad ? (long)j * j : 0, 1); out->gen_label[j - 1] = (int)j; }
        out->perfected = (k == IUT_MON_GAUSSIAN_INF); out->split = 1; break;
    case IUT_MON_SEMISIMPLE:  /* [IUTchII] Cor 4.5 (ii): Ψ^ss_cns = O× × R≥0 with the distinguished element log_{D⊢}(p_v) */
        out->ngen = 1; out->gen[0] = iut_q_make(1, 1); out->gen_label[0] = 0; out->split = 1;
        out->distinguished_log_p = v->kind == IUT_V_NONARCH ? log((double)v->p) : 1.0; break;
    case IUT_MON_LGP:         /* [IUTchIII] Prop 3.4 (ii): handled by iut_lgp_monoid_build */
        out->ngen = 0; break;
    default: break;
    }
}
void iut_monoid_semisimplify(const iut_initial_theta_data *d, const iut_monoid *cns, iut_monoid *out)
{
    /* [IUTchII] Cor 4.5 (ii): Ψ_cns ↦ Ψ^ss_cns: forget the ring structure; what survives is
     * the unit group and the value group, realified to R≥0, with log(p_v) distinguished. */
    iut_monoid_build(d, IUT_MON_SEMISIMPLE, cns->v_index, cns->units_copy / 1000, cns->etale_like, out);
    out->units_copy = cns->units_copy; out->G_copy = cns->G_copy;
}
int iut_monoid_evaluation_iso(const iut_initial_theta_data *d, const iut_monoid *env, const iut_monoid *gau, iut_report *r)
{
    /* [IUTchII] Cor 3.5 (ii), Cor 3.6 (ii), Cor 4.10 (ii): the evaluation θ ↦ (θ(√−q^j))_j =
     * (q̲^{j²})_j induces Ψ_env ≅ Ψ_gau, compatible with the units and the splittings. */
    int ok = (env->kind == IUT_MON_THETA || env->kind == IUT_MON_THETA_INF) && (gau->kind == IUT_MON_GAUSSIAN || gau->kind == IUT_MON_GAUSSIAN_INF)
          && env->v_index == gau->v_index && env->perfected == gau->perfected && gau->ngen == d->lstar;
    for (unsigned j = 1; ok && j <= d->lstar; ++j) {
        iut_theta_value tv; iut_theta_evaluate(d, (int)j, &tv);
        if (d->V[gau->v_index].red == IUT_RED_BAD_MULT && iut_q_cmp(tv.value, gau->gen[j - 1]) != 0) ok = 0;
    }
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "EvaluationIso", "[IUTchII] Cor 3.5 (ii); Cor 4.10 (ii)",
                          ok ? "Ψ_env ≅ Ψ_gau at %s: θ ↦ (q̲^{j²})_{j=1..%u}" : "evaluation isomorphism fails at %s (%u generators)", d->V[gau->v_index].name, gau->ngen);
    return ok ? 0 : 1;
}
int iut_monoid_kummer_iso(const iut_monoid *frob, const iut_monoid *etale, iut_report *r)
{
    /* [IUTchII] Cor 4.6 (i), Cor 4.8 (i): Ψ(F) ≅ Ψ(D): Kummer isomorphism between the
     * Frobenius-like monoid and the monoid reconstructed from the base category. */
    int ok = frob->kind == etale->kind && frob->v_index == etale->v_index && !frob->etale_like && etale->etale_like && frob->ngen == etale->ngen;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "KummerIso", "[IUTchII] Cor 4.6, Cor 4.8",
                          ok ? "Kummer isomorphism Ψ(F)[%u] ≅ Ψ(D)[%u] at v#%u" : "no Kummer isomorphism between monoids %u and %u (v#%u)", frob->units_copy, etale->G_copy, frob->v_index);
    return ok ? 0 : 1;
}
void iut_global_realified_from_DMono(const iut_initial_theta_data *d, const iut_prime_strip *DMono, iut_prime_strip *out)
{
    /* [IUTchII] Cor 4.5 (ii): from D⊢ one constructs D⊩(D⊢) = (C⊩, Prime(C⊩) → V, {ρ_v}):
     * the global realified Frobenioid of arithmetic divisors with R-coefficients, whose
     * local components are the R≥0(D⊢)_v of the semisimplifications; ρ_v identifies
     * the v-component with the value group R≥0 with log(p_v) distinguished.  Since it is
     * built from étale-like data it is determined only up to R>0-orbits (Cor 4.10 (v)). */
    iut_prime_strip_forget(out, DMono, IUT_PS_DMono);
    out->kind = IUT_PS_FMonoGlob;
    snprintf(out->label, sizeof out->label, "DMonoGlob");
    for (unsigned i = 0; i < out->nV; ++i) {
        iut_local_datum *L = &out->loc[i];
        L->has_valgroup = 1; L->has_splitting = 1; L->units_copy = 0; L->kummer_kind = 0;
        if (d->V[i].kind == IUT_V_NONARCH && d->V[i].red == IUT_RED_BAD_MULT) { L->nval = 1; L->val[0] = iut_q_make(1, 1); }
    }
    out->has_global_realified = 1;
    out->global_degree = -iut_log_q(d) / (2.0 * (d->l ? d->l : 1));
}

/* ----------------------------------------- symmetrizing isomorphisms */
void iut_symmetrize_FlSemiPm(const iut_initial_theta_data *d, const iut_capsule *T, iut_symmetrization *out)
{
    /* [IUTchII] Cor 3.5 (i), Cor 4.5 (iii): the F_l^{⋊±}-symmetry of the Θ±ell-Hodge theater
     * induces isomorphisms G_v(M)_t ≅ G_v(M)_{t'} and Ψ_cns(M)_t ≅ Ψ_cns(M)_{t'} for all
     * t, t' ∈ F_l ("conjugate synchronization": the l copies of G_v are identified by a
     * canonical system of isomorphisms); the labels descend to |F_l| and the diagonal
     * (−)_{|F_l|} ⊆ Π_t (−)_t is defined.                                              */
    memset(out, 0, sizeof *out);
    out->group = "F_l^{⋊±}";
    out->nclasses = d->lstar + 1;
    for (unsigned i = 0; i < T->n; ++i) out->class_of[i] = iut_label_abs(T->label[i]);
    out->synchronized_copy = T->n ? T->basepoint[0] : 0;    /* every member is identified with the member labelled −l* (any choice; the isomorphisms are canonical) */
    for (unsigned i = 0; i < T->n; ++i) if (T->label[i] == 0) out->synchronized_copy = T->basepoint[i];
    out->diagonal_copy = out->synchronized_copy * 10 + 9;
}
void iut_symmetrize_FlStar(const iut_initial_theta_data *d, const iut_capsule *J, iut_symmetrization *out)
{
    /* [IUTchII] Cor 4.7 (ii), Cor 4.8 (ii): the F_l^*-symmetry of the ΘNF-Hodge theater
     * gives symmetrizing isomorphisms between the labelled copies (†M_mod)_j etc., and the
     * diagonal (−)_{F_l^*} ⊆ Π_{j} (−)_j.  Unlike F_l^{⋊±}, it does not synchronize the
     * conjugates of G_v (it is an "arithmetic", outer symmetry: [IUTchI] Rem 6.12.6). */
    memset(out, 0, sizeof *out);
    out->group = "F_l^*";
    out->nclasses = d->lstar;
    for (unsigned i = 0; i < J->n; ++i) out->class_of[i] = J->label[i];
    out->synchronized_copy = 0;
    out->diagonal_copy = J->n ? J->basepoint[0] * 10 + 9 : 0;
}
int iut_conjugate_synchronized(const iut_symmetrization *s) { return s->synchronized_copy != 0; }
int iut_label_subset_keeps_symmetry(const iut_initial_theta_data *d, const int *labels, unsigned n, int group_pm)
{
    /* [IUTchII] Rem 4.11.1 (ii)-(iii); [IUTchI] Rem 6.12.6: the F_l^{⋊±}- (resp. F_l^*-) symmetry
     * only acts on the FULL label set F_l (resp. F_l^*); restricting to a proper subset
     * (e.g. the label j = 1 alone) destroys the symmetry — except that the subset {1} ⊆ F_l^*
     * is where the Θ×μ_gau-link restricts to the identity q ↦ q^{1²} (Rem 4.11.1 (i)). */
    unsigned full = group_pm ? d->l : d->lstar;
    if (n != full) return 0;
    for (unsigned i = 0; i < n; ++i) { int ok = group_pm ? iut_label_in_Fl(d, labels[i]) : iut_label_in_FlStar(d, labels[i]); if (!ok) return 0; for (unsigned k = 0; k < i; ++k) if (labels[k] == labels[i]) return 0; }
    return 1;
}

/* ------------------------------------------------------- Def 4.9 ladder */
void iut_ps_forget_ladder(const iut_initial_theta_data *d, const iut_prime_strip *src, iut_prime_strip *out, iut_forget_ladder *ladder)
{
    /* [IUTchII] Def 4.9 (vi), (vii), (viii) and [IUTchI] Def 5.2, Rem 5.2.1:
     *   F⊩▶×μ → F⊢▶×μ (forget the global realified Frobenioid)
     *          → F⊢×μ  (forget the value-group portion O▶, keep the ×μ-Kummer structure)
     *          → F⊢×   (lift: O×μ ← O×, forgets the Ism-orbit: here we record O×)
     *          → D⊢    (forget all monoids: étale-like mono-analytic core)         */
    static const iut_ps_kind chain[] = { IUT_PS_FMonoGlobValUnitsModTors, IUT_PS_FMonoValUnitsModTors, IUT_PS_FMonoUnitsModTors, IUT_PS_FMonoUnits, IUT_PS_DMono };
    static const char *refs[] = { "[IUTchII] Def 4.9 (viii)", "[IUTchII] Def 4.9 (vii)", "[IUTchII] Def 4.9 (vii)", "[IUTchII] Def 4.9 (vi)", "[IUTchI] Def 4.1 (iii)" };
    (void)d;
    memset(ladder, 0, sizeof *ladder);
    unsigned start = 0;
    while (start < 5 && chain[start] != src->kind) ++start;
    if (start == 5) start = 0;
    out[0] = *src; ladder->kind[0] = src->kind; ladder->ref[0] = refs[start]; ladder->n = 1;
    for (unsigned i = start + 1; i < 5; ++i) { iut_prime_strip_forget(&out[ladder->n], &out[ladder->n - 1], chain[i]); ladder->kind[ladder->n] = chain[i]; ladder->ref[ladder->n] = refs[i]; ladder->n++; }
}
double iut_pilot_object_degree(const iut_prime_strip *ps) { return ps->has_global_realified ? ps->global_degree : 0.0; }  /* [IUTchII] Def 4.9 (viii): the pilot object has arithmetic degree < 0 */
unsigned iut_units_mod_tors_kummer_orbit(const iut_prime_strip *ps)
{
    /* [IUTchII] Def 4.9 (i)-(iv): the ×μ-Kummer structure is the Ism-orbit of a Kummer
     * isomorphism; its indeterminacy is the group Ism of G_v-equivariant isometries. */
    for (unsigned i = 0; i < ps->nV; ++i) if (ps->loc[i].kummer_kind == 2) return 2;
    return 1;
}

/* ------------------------------------------------------- Cor 4.10 */
int iut_constant_strip_identify(const iut_hodge_theater *ht, iut_report *r)
{
    /* [IUTchII] Cor 4.10 (i): the symmetrizing isomorphisms identify the labelled copies
     * Ψ_cns(†F⊢)_0 and Ψ_cns(†F⊢)_{F_l^*} (diagonal) and give †F⊩_Δ ≅ †F⊩_mod ("0, ⊞ ↦ >"). */
    int ok = ht->glued && ht->FMonoGlobTriangle.has_global_realified && ht->nf.tht.FMonoGlobMod.has_global_realified
          && fabs(ht->FMonoGlobTriangle.global_degree - ht->nf.tht.FMonoGlobMod.global_degree) < 1e-9;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "ConstantStripIdentification", "[IUTchII] Cor 4.10 (i)", ok ? "F⊩_Δ ≅ F⊩_mod (labels 0 and F_l^* identified; degree %.4f)" : "F⊩_Δ and F⊩_mod differ (%.4f)", ht->FMonoGlobTriangle.global_degree);
    return ok ? 0 : 1;
}
int iut_envelope_isos(const iut_hodge_theater *ht, iut_report *r)
{
    /* [IUTchII] Cor 4.10 (ii): †F⊩_env ≅ †F⊩_tht (theta monoids vs the Θ-Hodge theater) and
     * the evaluation isomorphism †F⊩_env ≅ †F⊩_gau.                                       */
    int ok = fabs(ht->FMonoGlobEnv.global_degree - ht->nf.tht.FMonoGlobTht.global_degree) < 1e-9
          && fabs(ht->FMonoGlobEnv.global_degree - ht->FMonoGlobGau.global_degree) < 1e-9;
    for (unsigned i = 0; ok && i < ht->FMonoGlobEnv.nV; ++i) if (ht->FMonoGlobEnv.loc[i].nval != ht->FMonoGlobGau.loc[i].nval) ok = 0;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "EnvelopeIsos", "[IUTchII] Cor 4.10 (ii)", ok ? "F⊩_env ≅ F⊩_tht ≅ F⊩_gau (degree %.4f)" : "envelope isomorphisms fail (%.4f)", ht->FMonoGlobEnv.global_degree);
    return ok ? 0 : 1;
}
int iut_theta_link_make(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_link_kind k, iut_link *out)
{
    /* [IUTchI] Cor 3.7 (Θ-link: †F⊩_tht ≅ ‡F⊩_mod), [IUTchII] Cor 4.10 (iii) (Θ×μ: †F⊩▶×μ_env ≅ ‡F⊩▶×μ_Δ;
     * Θ×μ_gau with F⊩▶×μ_gau), [IUTchIII] Def 3.8 (ii) (Θ×μ_LGP / Θ×μ_lgp with F⊩▶×μ_LGP / F⊩▶×μ_lgp):
     * the full poly-isomorphism of F⊩▶×μ-prime-strips that sends the Θ-pilot of the domain
     * to the q-pilot of the codomain.  Only value groups and units-mod-torsion are related;
     * the ring structures (and the Π_v's) are not.                                        */
    memset(out, 0, sizeof *out);
    out->kind = k; out->dom_n = dom->n; out->dom_m = dom->m; out->cod_n = cod->n; out->cod_m = cod->m;
    out->full_poly_isomorphism = 1;
    out->glued_kind = (k == IUT_LINK_THETA) ? IUT_PS_FMonoGlob : IUT_PS_FMonoGlobValUnitsModTors;
    out->preserves_Pi = 0; out->preserves_G = 1; out->preserves_units_mod_tors = (k != IUT_LINK_THETA); out->preserves_ring_structure = 0;
    double l = dom->data->l;
    out->dilation = l * (l + 1.0) / 12.0;   /* average of j² over F_l^* = (l*+1)(2l*+1)/6 = l(l+1)/12 */
    return (k >= IUT_LINK_THETA && k <= IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL) ? 0 : 1;
}
int iut_theta_link_coric_units(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r)
{
    /* [IUTchII] Cor 4.10 (iv): †F⊢×μ ≅ †F⊢×μ_env ≅ †F⊢×μ_gau, and the Θ×μ-link induces the FULL
     * poly-isomorphism †F⊢×μ ≅ ‡F⊢×μ : the units modulo torsion are horizontally coric. */
    iut_prime_strip a, b;
    iut_prime_strip_forget(&a, &dom->FMonoGlobEnv, IUT_PS_FMonoUnitsModTors);
    iut_prime_strip_forget(&b, &cod->FMonoGlobTriangle, IUT_PS_FMonoUnitsModTors);
    int ok = a.nV == b.nV;
    for (unsigned i = 0; ok && i < a.nV; ++i) if (!a.loc[i].units_mod_tors || !b.loc[i].units_mod_tors || a.loc[i].kummer_kind != 2 || b.loc[i].kummer_kind != 2) ok = 0;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "CoricUnitsModTors", "[IUTchII] Cor 4.10 (iv)", ok ? "†F⊢×μ ≅ ‡F⊢×μ: full poly-isomorphism of F⊢×μ-prime-strips (Ism-orbits)" : "units-mod-torsion portions are not comparable");
    return ok ? 0 : 1;
}
int iut_theta_link_induced_D_link(const iut_link *theta, iut_link *out)
{
    /* [IUTchII] Cor 4.10 (iv): the Θ×μ-link induces, on the D⊢-prime-strips, the full
     * poly-isomorphism †D⊢ ≅ ‡D⊢, i.e. the D-Θ±ell NF-link of the étale picture.      */
    if (theta->kind == IUT_LINK_LOG) return 1;
    *out = *theta;
    out->kind = IUT_LINK_D_THETA_PMELL_NF; out->glued_kind = IUT_PS_DMono;
    out->preserves_units_mod_tors = 0; out->preserves_G = 1; out->dilation = 1.0;
    return 0;
}
int iut_coric_global_realified(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r)
{
    /* [IUTchII] Cor 4.10 (v): the global realified Frobenioids D⊩(†D⊢) ≅ D⊩(‡D⊢) are
     * horizontally coric up to R>0-orbits (the arithmetic degree is only defined up to a
     * positive real multiple on the étale-like side).                                   */
    int ok = dom->FMonoGlobTriangle.has_global_realified && cod->FMonoGlobTriangle.has_global_realified;
    double ratio = (dom->FMonoGlobTriangle.global_degree != 0) ? cod->FMonoGlobTriangle.global_degree / dom->FMonoGlobTriangle.global_degree : 1.0;
    ok = ok && ratio > 0;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "CoricGlobalRealified", "[IUTchII] Cor 4.10 (v)", ok ? "D⊩(†D⊢) ≅ D⊩(‡D⊢) up to R>0 (ratio %.3f)" : "global realified Frobenioids not comparable (%.3f)", ratio);
    return ok ? 0 : 1;
}
unsigned iut_theta_gau_exponents(const iut_initial_theta_data *d, unsigned *out)
{
    /* [IUTchII] Rem 4.11.1 (i): the Θ×μ_gau-link sends q̲ ↦ (q̲^{1²}, q̲^{2²}, …, q̲^{(l*)²}); its
     * restriction to the label j = 1 is the identity. */
    for (unsigned j = 1; j <= d->lstar; ++j) out[j - 1] = j * j;
    return d->lstar;
}
