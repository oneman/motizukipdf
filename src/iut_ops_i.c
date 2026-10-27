/*
 * iut_ops_i.c — operations of [IUTchI] (Hodge theaters), cited through the
 * recaps in [IUTchII] §4, [IUTchIII] §1, [Pano] §3, [Alien] §3.3/§3.6 as well
 * as the statements of [IUTchI] itself.
 *
 *  §4-§6 labels:   F_l ⊇ F_l^× ↠ F_l^*, |F_l|, the two symmetries, the gluing 0,⊞ ↦ >
 *  Def 6.1/Prop 6.5 cusps:  LabCusp±(D_⊚) ≅ F_l,  LabCusp(D_⊛) ≅ F_l^*
 *  §0 capsules, Prop 4.11 / Prop 6.9 processions
 *  Def 4.6, 5.5, 6.4, 6.11 bridges;  Def 6.13 Hodge theaters and forgetful functors
 *  Cor 3.8 Frobenius picture, Cor 4.12 / 6.10 étale picture
 *  Ex 5.1 / Cor 5.3 global number-field data and its Kummer isomorphism
 */
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ------------------------------------------------------------------ labels */
int iut_label_abs(int t) { return t < 0 ? -t : t; }
int iut_label_in_FlUnits(const iut_initial_theta_data *d, int t) { return t != 0 && iut_label_in_Fl(d, t); }
int iut_label_FlUnits_to_FlStar(const iut_initial_theta_data *d, int u) { return iut_label_in_FlUnits(d, u) ? iut_label_abs(u) : -1; }
int iut_label_glue_pm_to_nf(const iut_initial_theta_data *d, int t)
{
    /* [IUTchI] Def 6.13 (iii), Prop 6.7; [Alien] §3.6 Fig 3.15: F_l ⊇ F_l^× ↠ F_l^*,
     * and the label 0 (the "constant" member) together with ⊞ go to ">". */
    if (!iut_label_in_Fl(d, t)) return -1;
    return t == 0 ? 0 : iut_label_abs(t);
}
unsigned iut_label_orbit_FlSemiPm(const iut_initial_theta_data *d, int t) { return iut_label_in_Fl(d, t) ? d->l : 0; }     /* [IUTchI] Prop 6.6: transitive on F_l */
unsigned iut_label_orbit_FlStar(const iut_initial_theta_data *d, int j)   { return iut_label_in_FlStar(d, j) ? d->lstar : 0; } /* [IUTchI] Prop 4.9: simply transitive on F_l^* */

/* ------------------------------------------------------------------- cusps */
void iut_labcusp_pm_make(const iut_initial_theta_data *d, iut_labcusp *out)
{
    /* [IUTchI] Def 6.1 (iii), Prop 6.5 (i); [IUTchII] Cor 4.5 (iii): the cusps of X_K
     * (the "±-labelled" cusps of the l-th power covering) are in bijection with F_l
     * via ζ, compatibly with the F_l^{⋊±}-action.  ε̲ is the cusp labelled by the
     * 2-torsion shift (recorded in d->epsilon).                                     */
    memset(out, 0, sizeof *out);
    out->n = d->l; out->signed_labels = 1;
    for (unsigned i = 0; i < d->l; ++i) out->label[i] = (int)i - (int)d->lstar;
}
void iut_labcusp_make(const iut_initial_theta_data *d, iut_labcusp *out)
{
    /* [IUTchI] Def 4.1 (ii), Prop 4.2; [IUTchII] Cor 4.7 (ii): LabCusp(D_⊛) ≅ F_l^*
     * (the cusps of C_K other than the one at 0, modulo ±).                        */
    memset(out, 0, sizeof *out);
    out->n = d->lstar; out->signed_labels = 0;
    for (unsigned i = 0; i < d->lstar; ++i) out->label[i] = (int)i + 1;
}
void iut_labcusp_forget_sign(const iut_labcusp *pm, iut_labcusp *out)
{
    /* LabCusp± → LabCusp: t ↦ |t|, the cusp 0 dropped  ([IUTchI] Prop 6.5 (ii), Def 6.13) */
    memset(out, 0, sizeof *out);
    out->signed_labels = 0;
    for (unsigned i = 0; i < pm->n; ++i) if (pm->label[i] > 0) out->label[out->n++] = pm->label[i];
}
int iut_labcusp_is_bijection(const iut_labcusp *lc, const iut_initial_theta_data *d)
{
    unsigned expect = lc->signed_labels ? d->l : d->lstar;
    if (lc->n != expect) return 0;
    for (unsigned i = 0; i < lc->n; ++i) {
        int ok = lc->signed_labels ? iut_label_in_Fl(d, lc->label[i]) : iut_label_in_FlStar(d, lc->label[i]);
        if (!ok) return 0;
        for (unsigned k = 0; k < i; ++k) if (lc->label[k] == lc->label[i]) return 0;
    }
    return 1;
}

/* ---------------------------------------------------------------- capsules */
void iut_capsule_from_T(const iut_hodge_theater *ht, iut_capsule *out)
{
    memset(out, 0, sizeof *out);
    out->n = ht->pmell.nT;
    for (unsigned i = 0; i < out->n; ++i) { out->label[i] = ht->pmell.T[i].label; out->basepoint[i] = ht->pmell.T[i].basepoint; }
}
void iut_capsule_from_J(const iut_hodge_theater *ht, iut_capsule *out)
{
    memset(out, 0, sizeof *out);
    out->n = ht->nf.nJ;
    for (unsigned i = 0; i < out->n; ++i) { out->label[i] = ht->nf.J[i].label; out->basepoint[i] = ht->nf.J[i].basepoint; }
}
int iut_capsule_morphism_valid(const iut_capsule_morphism *m)
{
    /* [IUTchI] §0: a morphism of capsules is an injection of index sets together with
     * isomorphisms of the corresponding members; a capsule-full poly-morphism is one
     * where the isomorphisms are full poly-isomorphisms.                            */
    if (m->n_dom > m->n_cod) return 0;
    for (unsigned i = 0; i < m->n_dom; ++i) {
        if (m->map[i] < 0 || (unsigned)m->map[i] >= m->n_cod) return 0;
        for (unsigned k = 0; k < i; ++k) if (m->map[k] == m->map[i]) return 0;
    }
    return 1;
}
int iut_capsule_full_poly_iso_count(const iut_capsule *c) { return (int)iut_factorial(c->n); }

/* ------------------------------------------------------------- processions */
void iut_procession_build(const iut_initial_theta_data *d, iut_procession_kind k, iut_procession *out)
{
    /* [IUTchI] Prop 4.11 (Prc(D_J)): S_1 ⊂ S_2 ⊂ … ⊂ S_{l*}, S_j = {1,…,j}, each inclusion
     * a capsule-full poly-morphism; the automorphisms are Π_j |S_j|!.  [IUTchI] Prop 6.9
     * (Prc(D_T)): S±_1 ⊂ … ⊂ S±_{l±}, S±_{j+1} = {0,…,j}.  The procession is what makes the
     * label j "indistinguishable" from the other elements of S_{j+1} ((Ind1)).          */
    memset(out, 0, sizeof *out);
    out->kind = k;
    out->nsteps = (k == IUT_PRC_NF) ? d->lstar : d->lpm;
    out->automorphisms = 1;
    for (unsigned s = 0; s < out->nsteps; ++s) {
        out->size[s] = s + 1;
        out->first_label[s] = (k == IUT_PRC_NF) ? 1 : 0;
        out->last_label[s]  = (k == IUT_PRC_NF) ? (int)s + 1 : (int)s;
        out->automorphisms *= iut_factorial(s + 1);
        out->normalization[s] = 1.0 / (double)(s + 1);
    }
}
unsigned iut_procession_capsule_labels(const iut_procession *p, unsigned k, int *labels)
{
    if (k >= p->nsteps) return 0;
    unsigned n = 0;
    for (int t = p->first_label[k]; t <= p->last_label[k]; ++t) labels[n++] = t;
    return n;
}

/* ----------------------------------------------------------------- bridges */
static const char *bridge_ids[IUT_BRIDGE_COUNT] = { "ThetaBridge", "NFBridge", "ThetaPmBridge", "ThetaEllBridge" };
const char *iut_bridge_kind_id(iut_bridge_kind k) { return (unsigned)k < IUT_BRIDGE_COUNT ? bridge_ids[k] : "?"; }
void iut_bridge_build(const iut_hodge_theater *ht, iut_bridge_kind k, iut_bridge *out)
{
    const iut_initial_theta_data *d = ht->data;
    memset(out, 0, sizeof *out);
    out->kind = k; out->poly = 1;
    switch (k) {
    case IUT_BRIDGE_THETA:     /* [IUTchI] Def 5.5 (ii): φ^Θ : F_J → F_>, the Θ-bridge; isomorphisms form an F_l^*-torsor only together with the NF-bridge; alone: {±1}-indeterminacy at bad v is absorbed, so the group is trivial up to the capsule permutations */
        out->n_dom = d->lstar; out->dom = "FJ"; out->cod = "FGt"; out->symmetry = "trivial (rigid once the NF-bridge is fixed; [IUTchI] Prop 4.8 (iii), Cor 5.6 (ii))"; out->isos = 1; out->ok = ht->nf.theta_bridge_ok; break;
    case IUT_BRIDGE_NF:        /* [IUTchI] Def 5.5 (i): φ^NF : F_J → F_⊛ via the Frobenioid F_mod^×; isomorphisms: F_l^*-torsor ([IUTchI] Prop 4.8 (ii), Prop 4.9 (iii)) */
        out->n_dom = d->lstar; out->dom = "FJ"; out->cod = "FCircAst"; out->symmetry = "F_l^*"; out->isos = d->lstar; out->ok = ht->nf.nf_bridge_ok; break;
    case IUT_BRIDGE_THETA_PM:  /* [IUTchI] Def 6.4 (i), Def 6.11: φ^Θ± : F_T → F_⊞; isomorphisms: F_l^{⋊±}-torsor ([IUTchI] Prop 6.6 (ii)) */
        out->n_dom = d->l; out->dom = "FT"; out->cod = "FBoxPlus"; out->symmetry = "F_l^{⋊±}"; out->isos = 2UL * d->l; out->ok = ht->pmell.theta_pm_bridge_ok; break;
    case IUT_BRIDGE_THETA_ELL: /* [IUTchI] Def 6.4 (ii): φ^Θell : D_T → D_⊚± (étale-like, Π_{X_K}); isomorphisms: F_l^{⋊±} ([IUTchI] Prop 6.6 (iii)) */
        out->n_dom = d->l; out->dom = "DT"; out->cod = "DCircDotPm"; out->symmetry = "F_l^{⋊±}"; out->isos = 2UL * d->l; out->ok = ht->pmell.theta_ell_bridge_ok; break;
    default: break;
    }
}

/* ----------------------------------------------------- forgetful functors */
void iut_hodge_theater_to_D(const iut_hodge_theater *ht, iut_d_hodge_theater *out)
{
    /* [IUTchI] Def 6.13 (ii), Rem 6.12.2: passing from a Θ±ell NF-Hodge theater to its
     * D-Θ±ell NF-Hodge theater forgets the Frobenius-like portions (all monoids); only
     * the base categories (the Π_v's and their copies) remain.  This is the vertically
     * coric datum "(n,◦)HT^D" of [IUTchIII] Thm 1.5 (i).                                  */
    memset(out, 0, sizeof *out);
    out->universe = ht->universe;
    out->nT = ht->pmell.nT; out->nJ = ht->nf.nJ; out->nV = ht->pmell.FBoxPlus.nV;
    for (unsigned i = 0; i < out->nT; ++i) out->Pi_T[i] = ht->pmell.T[i].basepoint;
    for (unsigned i = 0; i < out->nJ; ++i) out->Pi_J[i] = ht->nf.J[i].basepoint;
    for (unsigned i = 0; i < out->nV; ++i) {
        out->Pi_BoxPlus[i] = ht->pmell.FBoxPlus.loc[i].Pi_copy;
        out->Pi_Gt[i]      = ht->nf.FGt.loc[i].Pi_copy;
        out->Pi_CircDot[i] = ht->pmell.DCircDotPm.loc[i].Pi_copy;
        out->Pi_CircAst[i] = ht->nf.FCircAst.loc[i].Pi_copy;
    }
}
int iut_d_hodge_theater_iso(const iut_d_hodge_theater *a, const iut_d_hodge_theater *b)
{
    if (a->nT != b->nT || a->nJ != b->nJ || a->nV != b->nV) return 0;
    for (unsigned i = 0; i < a->nV; ++i) if (a->Pi_BoxPlus[i] != b->Pi_BoxPlus[i] || a->Pi_Gt[i] != b->Pi_Gt[i]) return 0;
    return 1;
}
const iut_theta_pm_ell_hodge_theater *iut_hodge_theater_pmell(const iut_hodge_theater *ht) { return &ht->pmell; }
const iut_theta_nf_hodge_theater     *iut_hodge_theater_nf(const iut_hodge_theater *ht)    { return &ht->nf; }
const iut_theta_hodge_theater        *iut_hodge_theater_theta(const iut_hodge_theater *ht) { return &ht->nf.tht; }

/* ----------------------------------------------- Frobenius / étale picture */
void iut_frobenius_chain_build(iut_log_theta_lattice *lat, int m, int n0, int n1, iut_frobenius_chain *out)
{
    /* [IUTchI] Cor 3.8 (Θ-link chain of Θ-Hodge theaters), [IUTchII] Cor 4.10 (vi),
     * [IUTchIII] Prop 1.2 (x): … → HT → HT → HT → …  The chain has a Z-translation
     * symmetry but no symmetry swapping the domain and codomain of a single link. */
    memset(out, 0, sizeof *out);
    out->kind = lat->horizontal;
    for (int n = n0; n <= n1 && out->n < IUT_LAT_N; ++n) {
        iut_hodge_theater *ht = iut_lattice_get(lat, n, m);
        if (!ht) break;
        out->universe[out->n++] = ht->universe;
        if (n < n1) iut_apply_theta_link(lat, n, m);
    }
    out->translation_symmetric = 1;
    out->adjacent_swap_allowed = 0;
}
int iut_frobenius_chain_translate(const iut_frobenius_chain *c, int shift, iut_frobenius_chain *out)
{
    /* translation by shift ∈ Z: relabel the universes cyclically; the result is again a chain of the same shape */
    *out = *c;
    if (!c->n) return 0;
    int s = ((shift % (int)c->n) + (int)c->n) % (int)c->n;
    for (unsigned i = 0; i < c->n; ++i) out->universe[(i + s) % c->n] = c->universe[i];
    return 1;
}
void iut_etale_picture_build(iut_log_theta_lattice *lat, int m, iut_etale_picture *out)
{
    /* [IUTchI] Cor 4.12, Cor 6.10; [IUTchII] Cor 4.11: the D-Θ±ell NF-Hodge theaters of
     * a row are the spokes of a wheel whose hub is the shared mono-analytic core D⊢;
     * the picture is symmetric under arbitrary permutations of the spokes.           */
    memset(out, 0, sizeof *out);
    for (int n = -IUT_LAT_NOFF; n <= IUT_LAT_NOFF; ++n) {
        iut_hodge_theater *ht = lat->ht[n + IUT_LAT_NOFF][m + IUT_LAT_MOFF];
        if (!ht) continue;
        if (!out->nV) { out->nV = ht->FMonoGlobTriangle.nV; for (unsigned i = 0; i < out->nV; ++i) out->core_copy[i] = ht->FMonoGlobTriangle.loc[i].G_copy; }
        out->spoke_universe[out->nspokes++] = ht->universe;
    }
    out->permutation_symmetric = 1;
}
int iut_etale_picture_permute(const iut_etale_picture *e, const unsigned *perm, iut_etale_picture *out)
{
    *out = *e;
    for (unsigned i = 0; i < e->nspokes; ++i) {
        if (perm[i] >= e->nspokes) return 0;
        for (unsigned k = 0; k < i; ++k) if (perm[k] == perm[i]) return 0;
        out->spoke_universe[i] = e->spoke_universe[perm[i]];
    }
    return 1;
}

/* ------------------------------------------------ global number-field data */
void iut_global_nf_build(const iut_initial_theta_data *d, unsigned copy_base, iut_global_nf_data *out)
{
    /* [IUTchI] Ex 5.1: from Π_{C_K} (étale-like) one reconstructs the pseudo-monoid of
     * κ-coric rational functions M^⊛_κ ⊆ M^⊛_∞κ, the copies M^⊛_mod ⊆ M^⊛_sol of F_mod^×,
     * the Frobenioids F^⊛_mod ⊆ F^⊛ and their realifications ([IUTchII] Cor 4.7 (i)). */
    (void)d;
    memset(out, 0, sizeof *out);
    out->Pi_CK_copy = copy_base * 1000 + 1;
    out->Fmod_units_copy = copy_base * 1000 + 2;
    out->kappa_coric_copy = copy_base * 1000 + 3;
    out->sol_copy = copy_base * 1000 + 4;
    out->has_Frobenioid_mod = 1;
    out->kummer_rigid = 1;     /* Q>0 ∩ Ẑ× = {1}: [IUTchI] Ex 5.1 (v); [IUTchIII] Rem 2.3.3 (vi) */
}
void iut_global_nf_realify(iut_global_nf_data *g) { g->realified = 1; }  /* [IUTchI] Ex 5.1 (vii): F^⊛R */
int iut_global_nf_kummer(const iut_global_nf_data *frob, const iut_global_nf_data *etale, iut_report *r)
{
    /* [IUTchI] Cor 5.3 / [IUTchII] Cor 4.8 (i): Kummer isomorphism between the Frobenius-like
     * global data and the étale-like data reconstructed from Π_{C_K}; it is unique
     * (no Ẑ×-indeterminacy) because of the cyclotomic rigidity Q>0 ∩ Ẑ× = {1}.      */
    int ok = frob->has_Frobenioid_mod && etale->has_Frobenioid_mod && frob->kummer_rigid && etale->kummer_rigid;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "GlobalKummerIso", "[IUTchI] Cor 5.3; [IUTchII] Cor 4.8",
                          ok ? "Kummer isomorphism F^⊛(%u) ≅ F^⊛(D_⊛(%u)) is unique (Q>0 ∩ Ẑ× = {1})" : "global Kummer isomorphism not available",
                          frob->Fmod_units_copy, etale->Pi_CK_copy);
    return ok ? 0 : 1;
}
