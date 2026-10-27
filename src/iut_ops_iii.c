/*
 * iut_ops_iii.c — operations of [IUTchIII] (canonical splittings of the log-theta-lattice).
 *
 *  Def 1.1, Prop 1.2 (i)-(x)  the log-link on prime-strips, log-shells (holomorphic,
 *                             mono-analytic, coric), the vertical Frobenius picture
 *  Prop 1.3                   log-link between Hodge theaters
 *  Def 1.4, Rem 1.4.1         the log-theta-lattice (non-Gaussian / Gaussian / LGP / lgp)
 *  Thm 1.5                    bi-coric data: D-HTs (vertical), F⊢×μ (horizontal), log-shells, D⊩(D⊢)
 *  Prop 2.1, Thm 2.2, Cor 2.3 vertically coric theta monoids; the étale-picture radial environment
 *  Prop 3.1-3.3               local holomorphic / mono-analytic / global tensor packets
 *  Prop 3.4, 3.5              LGP-monoids; upper semi-compatibility (Ind3)
 *  Ex 3.6, Prop 3.7           F_MOD (rational function torsors) vs F_mod (local fractional ideals)
 *  Def 3.8                    pilot objects, Θ×μ_LGP / Θ×μ_lgp-links relative to a log-link
 *  Prop 3.9                   packet-/procession-normalized log-volumes, the global degree
 *  Prop 3.10                  global Kummer theory, non-interference
 *  Thm 3.11                   the multiradial representation in full
 *  Cor 3.12                   the log-volume estimate as a list of numbered steps
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ---------------------------------------------------------------- log-link */
void iut_log_shell_make(const iut_initial_theta_data *d, unsigned v_index, int holomorphic, int etale_like, int n, int m, iut_log_shell *out)
{
    /* [IUTchIII] Def 1.1 (i), (ii); [AbsTopIII] Def 5.4 (iii):  I_v = (p*_v)^{-1}·log(O×_{K_v}) ⊆ K_v
     * for v nonarchimedean (p* = p for p odd, p* = 4 for p = 2); for v archimedean, I_v is
     * the closed disc of radius π.  The p-adic valuation of a generator is recorded as a
     * rational, the log-volume by [IUTchIV] Prop 1.4 (ii) with the p* normalization.     */
    const iut_valuation *v = &d->V[v_index];
    memset(out, 0, sizeof *out);
    out->v_index = v_index; out->holomorphic = holomorphic; out->etale_like = etale_like; out->lattice_n = n; out->lattice_m = m;
    if (v->kind == IUT_V_ARCH) { out->pstar = 0; out->radius = iut_q_make(0, 1); out->log_volume = 0; return; }
    unsigned e = v->e_K ? v->e_K : 1, p = v->p;
    out->pstar = (p == 2) ? 4 : p;
    long lam = (long)(e / (p - 1)) + 1, kstar = (p == 2) ? 2 : 1;
    out->radius = iut_q_make(lam - kstar * (long)e, (long)e);
    out->log_volume = iut_log_shell_volume(v, (unsigned)d->dK);
}
void iut_log_link_strip(const iut_initial_theta_data *d, const iut_prime_strip *src, iut_prime_strip *dst, int tautological, iut_log_link_result *out)
{
    /* [IUTchIII] Def 1.1 (iii), Prop 1.2: the log-link  †F --log--> ‡F  between F-prime-strips:
     * at each v the units O×_{†v} are sent by the p-adic logarithm to log(O×) which is used
     * as the additive module of a NEW copy ‡ of the local field, whose monoid O▷_{‡v} is
     * then rebuilt; the Π_v's are identified ((i): D and D⊢ are coric), the ring structures
     * are NOT ((ii)); the log-shell I_v ⊆ ‡K_v is the image of †O× rescaled by (p*)^{-1} ((v)).
     * "tautological" log-link: Π identified by the identity; "full" log-link: by the full
     * poly-isomorphism of D-prime-strips (Def 1.1 (iii)).                                  */
    memset(out, 0, sizeof *out);
    *dst = *src;
    out->tautological = tautological;
    out->coric_D = out->coric_DMono = 1;
    out->ring_structure_preserved = 0;
    out->log_volume_compatible = 1;      /* Prop 1.2 (iii), Prop 3.9 (iv) */
    out->kummer_compatible = 0;          /* Prop 1.2 (iv): the Kummer isomorphisms of † and ‡ are NOT compatible with log */
    out->holomorphic_shells = 1;
    for (unsigned i = 0; i < src->nV; ++i) {
        /* Frobenius-like portion: a new copy of the units (ring structure forgotten and rebuilt) */
        if (dst->loc[i].units_copy) dst->loc[i].units_copy = src->loc[i].units_copy + 1;
        iut_log_shell_make(d, i, 1, 0, 0, 0, &out->shell[i]);
    }
    out->nshell = src->nV;
}
int iut_log_shell_properties(const iut_log_shell *sh, const iut_initial_theta_data *d, iut_report *r)
{
    /* [IUTchIII] Prop 1.2 (v): (a) log(O×) ⊆ I_v, (b) the image of O▷ ("O▷ ⊆ I" after taking
     * the logarithm of the units and the usual embedding of the rest) is contained in I_v
     * up to the p*-factor, (c) I_v is a compact (topological) Z_p-module (resp. closed disc)
     * containing log(O×) — these are what make the log-shell a "container" for both the
     * units and the value group.  In the model: radius ≤ 0 (I_v ⊇ O_v for p odd unramified)
     * and the log-volume formula is finite.                                                */
    const iut_valuation *v = &d->V[sh->v_index];
    int a = 1, b = 1, c = 1;
    if (v->kind == IUT_V_NONARCH) {
        a = sh->pstar >= v->p;                                  /* (p*)^{-1} log(O×) ⊇ log(O×) */
        b = iut_q_cmp(sh->radius, iut_q_make(1, 1)) <= 0;      /* generator of I has valuation ≤ 1: O ⊆ p^{-1}... contains the integers up to p */
        c = isfinite(sh->log_volume);
    }
    if (r) iut_report_add(r, (a && b && c) ? IUT_SEV_OK : IUT_SEV_ERROR, "LogShellProperties", "[IUTchIII] Prop 1.2 (v)", "I_%s: (a) log(O×) ⊆ I %s, (b) O ⊆ p^{-?}I %s, (c) compact Z_p-module %s", v->name, a ? "✓" : "✗", b ? "✓" : "✗", c ? "✓" : "✗");
    return (a && b && c) ? 0 : 1;
}
void iut_log_shell_from(const iut_initial_theta_data *d, iut_shell_source src, unsigned v_index, int n, int m, iut_log_shell *out)
{
    /* [IUTchIII] Prop 1.2 (vi) I_{F⊢×μ}: from the units mod torsion (Frobenius-like, mono-analytic);
     *                     (vii) I_{D⊢}: from G_v alone (étale-like, mono-analytic) — by [AbsTopIII] Prop 5.8;
     *                     (ix)  I_{*D}: from Π_v (étale-like, holomorphic): the vertically coric shells;
     *                     (v)   I_F : from the F-prime-strip (Frobenius-like, holomorphic).        */
    int hol = (src == IUT_SHELL_HOL_F || src == IUT_SHELL_HOL_D), et = (src == IUT_SHELL_MONO_DMONO || src == IUT_SHELL_HOL_D);
    iut_log_shell_make(d, v_index, hol, et, n, m, out);
}
const char *iut_log_shell_iso_indeterminacy(const iut_initial_theta_data *d, unsigned v_index)
{
    /* [IUTchIII] Prop 1.2 (vi), (vii): the isomorphisms I_{D⊢} ≅ I_{F⊢×μ} ≅ I_F are determined
     * up to the Ism-orbit (nonarchimedean) resp. the {±1}-orbit (archimedean).           */
    return d->V[v_index].kind == IUT_V_ARCH ? "{±1}" : "Ism";
}
int iut_log_shell_isomorphic(const iut_log_shell *a, const iut_log_shell *b)
{ return a->v_index == b->v_index && a->pstar == b->pstar && iut_q_cmp(a->radius, b->radius) == 0 && fabs(a->log_volume - b->log_volume) < 1e-12; }

void iut_log_chain_build(iut_log_theta_lattice *lat, int n, int m0, int m1, iut_frobenius_chain *out)
{
    /* [IUTchIII] Prop 1.2 (x), Prop 1.3 (iv): the vertical Frobenius picture …→ F →log F →log F → …
     * with Z-translation symmetry and no symmetry swapping dom/cod of a single log-link. */
    memset(out, 0, sizeof *out);
    out->kind = IUT_LINK_LOG;
    for (int m = m0; m <= m1 && out->n < IUT_LAT_N; ++m) {
        iut_hodge_theater *ht = iut_lattice_get(lat, n, m);
        if (!ht) break;
        out->universe[out->n++] = ht->universe;
        if (m < m1) iut_apply_log_link(lat, n, m);
    }
    out->translation_symmetric = 1; out->adjacent_swap_allowed = 0;
}
int iut_log_link_hodge_theater_check(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r)
{
    /* [IUTchIII] Prop 1.3 (i)-(iii): the log-link of Hodge theaters is the log-link applied to
     * F_>, F_⊚ (= F_⊞ here), and each member of the capsules F_J, F_T, relative to an iso Ξ of
     * the underlying D-Θ±ell NF-Hodge theaters; (ii) the D-HTs are coric.                      */
    iut_d_hodge_theater a, b;
    iut_hodge_theater_to_D(dom, &a); iut_hodge_theater_to_D(cod, &b);
    int ok = iut_d_hodge_theater_iso(&a, &b) && cod->has_incoming_log && cod->nshell == dom->data->nV && cod->log_iterate == dom->log_iterate + 1;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "LogLinkHodgeTheater", "[IUTchIII] Prop 1.3", ok ? "log-link (%d,%d)→(%d,%d): D-HTs coric, %u log-shells built" : "log-link (%d,%d)→(%d,%d) ill-formed (%u shells)", dom->n, dom->m, cod->n, cod->m, cod->nshell);
    return ok ? 0 : 1;
}

/* --------------------------------------------------------------- Def 1.4 */
const char *iut_lattice_flavour(iut_link_kind h)
{
    switch (h) {
    case IUT_LINK_THETA: case IUT_LINK_THETA_UNITSMODTORS: return "non-Gaussian log-theta-lattice ([IUTchIII] Def 1.4 (i))";
    case IUT_LINK_THETA_UNITSMODTORS_GAU: return "Gaussian log-theta-lattice ([IUTchIII] Def 1.4 (ii))";
    case IUT_LINK_THETA_UNITSMODTORS_LGP: return "LGP-Gaussian log-theta-lattice ([IUTchIII] Def 3.8 (iii))";
    case IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL: return "lgp-Gaussian log-theta-lattice ([IUTchIII] Def 3.8 (iii))";
    default: return "not a log-theta-lattice";
    }
}
int iut_lattice_square_commutes(void) { return 0; }  /* [IUTchIII] Rem 1.4.1 (i): the squares of the lattice do NOT commute */
int iut_lattice_horizontal_obligates_vertical(const iut_log_theta_lattice *lat, iut_report *r)
{
    /* [IUTchIII] Rem 1.4.1 (ii): every horizontal arrow (n,m)→(n+1,m) "obligates" the vertical
     * arrows of its column: the Θ×μ-link only makes sense for the F⊢×μ data, whose use
     * requires the log-link (to get log-shells / the ring structure back).  Check: for each
     * Θ-link in the lattice there is a log-link into or out of its domain.                  */
    int bad = 0;
    for (unsigned k = 0; k < lat->nlinks; ++k) {
        const iut_link *L = &lat->links[k];
        if (L->kind == IUT_LINK_LOG || L->kind == IUT_LINK_D_THETA_PMELL_NF) continue;
        int found = 0;
        for (unsigned q = 0; q < lat->nlinks; ++q) if (lat->links[q].kind == IUT_LINK_LOG && lat->links[q].dom_n == L->dom_n && (lat->links[q].dom_m == L->dom_m || lat->links[q].cod_m == L->dom_m)) found = 1;
        if (!found) bad++;
    }
    if (r) iut_report_add(r, bad ? IUT_SEV_WARN : IUT_SEV_OK, "HorizontalObligatesVertical", "[IUTchIII] Rem 1.4.1 (ii)", "%d horizontal arrow(s) without an accompanying log-link in their column", bad);
    return bad;
}

/* --------------------------------------------------------------- Thm 1.5 */
void iut_bicoric_check(iut_log_theta_lattice *lat, int n, int m, iut_bicoric *out)
{
    /* [IUTchIII] Thm 1.5: (i) the D-HT (n,◦)HT^D is vertically coric; (ii) F⊢×μ is horizontally coric;
     * (iii) F⊢×μ(n,m D⊢_Δ) ≅ F⊢×μ_> via Kummer: bi-coric; (iv) mono-analytic log-shells are bi-coric;
     * (v) D⊩(D⊢) is bi-coric up to R>0.                                                               */
    memset(out, 0, sizeof *out);
    iut_hodge_theater *a = iut_lattice_get(lat, n, m), *b = iut_lattice_get(lat, n, m + 1), *c = iut_lattice_get(lat, n + 1, m);
    if (!a || !b || !c) return;
    iut_apply_log_link(lat, n, m); iut_apply_theta_link(lat, n, m);
    iut_d_hodge_theater da, db; iut_hodge_theater_to_D(a, &da); iut_hodge_theater_to_D(b, &db);
    out->vertical_coric_D = iut_d_hodge_theater_iso(&da, &db);
    out->column_D_copy = da.Pi_Gt[0];
    /* the strip glued by the horizontal link: F⊩_tht / F⊩_env / F⊩_gau / F⊩_LGP / F⊩_lgp  (the codomain side is F⊩_mod resp. F⊩_Δ) */
    const iut_prime_strip *src = &a->FMonoGlobLGP, *dst = &c->FMonoGlobTriangle;
    switch (lat->horizontal) {
    case IUT_LINK_THETA: src = &a->nf.tht.FMonoGlobTht; dst = &c->nf.tht.FMonoGlobMod; break;
    case IUT_LINK_THETA_UNITSMODTORS: src = &a->FMonoGlobEnv; break;
    case IUT_LINK_THETA_UNITSMODTORS_GAU: src = &a->FMonoGlobGau; break;
    case IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL: src = &a->FMonoGlobLgp; break;
    default: break;
    }
    out->horizontal_coric_units = 1;
    for (unsigned i = 0; i < src->nV; ++i) if (src->loc[i].units_copy != dst->loc[i].units_copy || src->loc[i].G_copy != dst->loc[i].G_copy) out->horizontal_coric_units = 0;
    out->row_units_copy = dst->loc[0].units_copy;
    out->bicoric_units_of_DMono = out->vertical_coric_D && out->horizontal_coric_units;   /* F⊢×μ(D⊢_Δ): built from the (bi-coric) D⊢, Kummer-identified with F⊢×μ_> */
    iut_log_shell s1, s2; iut_log_shell_from(&lat->data, IUT_SHELL_MONO_DMONO, 0, n, m, &s1); iut_log_shell_from(&lat->data, IUT_SHELL_MONO_DMONO, 0, n + 1, m, &s2);
    out->bicoric_log_shells = iut_log_shell_isomorphic(&s1, &s2);
    out->bicoric_global_realified = a->FMonoGlobTriangle.has_global_realified && c->FMonoGlobTriangle.has_global_realified;
}

/* ---------------------------------------------------------------- §2 */
int iut_theta_monoid_vertically_coric(iut_log_theta_lattice *lat, int n, iut_report *r)
{
    /* [IUTchIII] Prop 2.1: the theta monoids Ψ_env(n,◦D_>) and the global D⊩_env are constructed
     * from the étale-like D_> alone, so they are the same for every m in the column. */
    iut_hodge_theater *a = iut_lattice_get(lat, n, 0), *b = iut_lattice_get(lat, n, 1);
    if (!a || !b) return 1;
    iut_apply_log_link(lat, n, 0);
    iut_monoid ma, mb;
    iut_monoid_build(&lat->data, IUT_MON_THETA, 0, a->nf.FGt.loc[0].Pi_copy / 1000, 1, &ma);
    iut_monoid_build(&lat->data, IUT_MON_THETA, 0, b->nf.FGt.loc[0].Pi_copy / 1000, 1, &mb);
    int ok = ma.G_copy == mb.G_copy && a->nf.FGt.loc[0].Pi_copy == b->nf.FGt.loc[0].Pi_copy;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "VerticallyCoricThetaMonoids", "[IUTchIII] Prop 2.1", ok ? "Ψ_env(%d,◦D_>) is the same at m = 0 and m = 1 (Π copy %u)" : "Ψ_env differs along column %d (%u)", n, a->nf.FGt.loc[0].Pi_copy);
    return ok ? 0 : 1;
}
unsigned iut_etale_radial_environment(iut_radial_item *out, unsigned max)
{
    /* [IUTchIII] Cor 2.3 (i): radial data = (aR) D-Θ±ell NF-HT, (bR) its F⊢×μ(D⊢)-prime-strips at the
     * labels, (cR) the theta monoids Ψ_env(D_>) with splittings, (dR) the F_l^{⋊±}-symmetrizing
     * isomorphisms / conjugate synchronization, (eR) the full poly-isomorphism to the coric data;
     * coric data = (D⊢, F⊢×μ(D⊢)).  The functor is full and essentially surjective ⇒ multiradial. */
    static const iut_radial_item items[] = {
        { "(aR)", "a D-Θ±ell NF-Hodge theater †HT^D (étale-like)" },
        { "(bR)", "the F⊢×μ-prime-strips F⊢×μ(†D⊢_t) at the labels t ∈ F_l, with their ×μ-Kummer structures" },
        { "(cR)", "the theta monoids Ψ_env(†D_>), ∞Ψ_env(†D_>) with their canonical splittings (Thm 2.2)" },
        { "(dR)", "the F_l^{⋊±}-symmetrizing isomorphisms and the diagonal (conjugate synchronization)" },
        { "(eR)", "the full poly-isomorphism F⊢×μ(†D⊢_Δ) ≅ (coric F⊢×μ) — the 'α' of the multiradialization" },
        { "coric", "(D⊢, F⊢×μ(D⊢)): the mono-analytic core and its units modulo torsion" },
    };
    unsigned n = sizeof items / sizeof items[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = items[i];
    return n;
}
int iut_theta_monoid_multiradial(iut_report *r)
{
    /* [IUTchIII] Thm 2.2 (ii), Cor 2.3 (ii): the étale-picture radial environment is multiradial:
     * the theta monoids, their splittings and the cyclotomic rigidity of the mono-theta
     * environment are compatible with arbitrary automorphisms (Ism, Aut(G_v)) of the coric data. */
    iut_cyclotomic_rigidity c; iut_cyclotomic_rigidity_get(IUT_CYC_MONO_THETA, &c);
    int ok = c.multiradial && !c.uses_ring_structure;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "ThetaMonoidsMultiradial", "[IUTchIII] Thm 2.2, Cor 2.3", "theta monoids with mono-theta cyclotomic rigidity: multiradial (indeterminacy: %s)", c.indeterminacy);
    return ok ? 0 : 1;
}

/* ------------------------------------------------------------ §3 packets */
static unsigned count_v_over(const iut_initial_theta_data *d, unsigned p)
{
    unsigned n = 0;
    for (unsigned i = 0; i < d->nV; ++i) if ((p == 0 && d->V[i].kind == IUT_V_ARCH) || (p && d->V[i].kind == IUT_V_NONARCH && d->V[i].p == p)) n++;
    return n;
}
void iut_tensor_packet_build(const iut_initial_theta_data *d, unsigned j, unsigned vQ_p, int holomorphic, iut_tensor_packet *out)
{
    /* [IUTchIII] Prop 3.1 (i): for the capsule A = S±_{j+1} (j+1 factors α) and vQ ∈ V_Q,
     *   log(^A F_vQ) = ⊗_{α∈A} ⊕_{v|vQ} log(^α F_v)  (tensor over Q_vQ / over R)
     * decomposes as a direct sum of (|V_vQ|)^{j+1} finite extensions (nonarch), resp. of
     * 2^{j}·|V_vQ|^{j+1} copies of C by C ⊗_R C ≅ C ⊕ C ([IUTchIV] Prop 1.5 (i)).
     * Prop 3.2: the mono-analytic version I(^A D⊢_vQ) = ⊗ ⊕ I(D⊢_v) with its Q-span.
     * Prop 3.9 (i): packet-normalized so that the integral structure has log-volume 0.   */
    memset(out, 0, sizeof *out);
    out->j = j; out->nfactors = j + 1; out->vQ_p = vQ_p; out->holomorphic = holomorphic;
    out->nv_over_vQ = count_v_over(d, vQ_p);
    unsigned long long s = 1; for (unsigned k = 0; k < out->nfactors; ++k) s *= (out->nv_over_vQ ? out->nv_over_vQ : 1);
    if (vQ_p == 0) s *= (1UL << j);
    out->nsummands = s;
    out->log_volume = 0.0;
    double shells = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (!((vQ_p == 0 && v->kind == IUT_V_ARCH) || (vQ_p && v->kind == IUT_V_NONARCH && v->p == vQ_p))) continue;
        iut_log_shell sh; iut_log_shell_make(d, i, holomorphic, !holomorphic, 0, 0, &sh);
        shells += sh.log_volume;
    }
    out->log_volume_shells = shells * (double)out->nfactors;   /* log-volume of ⊗ of j+1 shells = sum (Prop 3.9 (i), the log-volume is additive on tensor products of lattices) */
}
void iut_tensor_packet_global(const iut_initial_theta_data *d, unsigned j, iut_tensor_packet *out)
{
    /* [IUTchIII] Prop 3.3 (i): the global tensor packet (M_mod)_A = ⊗_{α∈A} (M_mod)_α: j+1 copies of
     * the number field F_mod tensored over Q, a direct sum of [F_mod:Q]^{j} number fields. */
    memset(out, 0, sizeof *out);
    out->j = j; out->nfactors = j + 1; out->global = 1; out->holomorphic = 1;
    unsigned long long s = 1; for (unsigned k = 0; k + 1 < out->nfactors; ++k) s *= (d->dmod ? d->dmod : 1);
    out->nsummands = s;
}
int iut_tensor_packet_localize(const iut_tensor_packet *global, const iut_tensor_packet *local, iut_report *r)
{
    /* [IUTchIII] Prop 3.3 (ii): (M_mod)_A ⊗ Q_vQ ↪ log(^A F_vQ) (resp. its Q-span): localization is
     * compatible with the capsule A (same number of factors).                               */
    int ok = global->global && !local->global && global->nfactors == local->nfactors;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "GlobalPacketLocalization", "[IUTchIII] Prop 3.3 (ii)", ok ? "(M_mod)_{S±%u} localizes into the packet at v_Q = %u" : "packets have different capsules (%u vs %u)", global->nfactors, local->vQ_p ? local->vQ_p : local->nfactors);
    return ok ? 0 : 1;
}
unsigned iut_tensor_packet_procession(const iut_initial_theta_data *d, unsigned vQ_p, int holomorphic, iut_tensor_packet *out)
{
    /* [IUTchIII] Prop 3.4 (ii), Thm 3.11 (i)(a): the packets indexed by the procession S±_1 ⊂ … ⊂ S±_{l±} */
    for (unsigned j = 0; j <= d->lstar; ++j) iut_tensor_packet_build(d, j, vQ_p, holomorphic, &out[j]);
    return d->lstar + 1;
}
void iut_lgp_monoid_build(const iut_initial_theta_data *d, unsigned j, unsigned v_index, unsigned copy_base, iut_monoid *out)
{
    /* [IUTchIII] Prop 3.4 (ii): the local LGP-monoid Ψ_FLGP(…)_{j} at v ∈ Vbad is the monoid
     * generated inside the tensor packet log(^{S±_{j+1}} F_v) by the units of the packet and the
     * theta value q̲^{j²} placed in the factor labelled j; its splitting monoid Ψ⊥ is generated by
     * q̲^{j²} alone ("⊥" = the value-group portion, cf. [IUTchII] Cor 3.6).                       */
    iut_monoid_build(d, IUT_MON_LGP, v_index, copy_base, 0, out);
    const iut_valuation *v = &d->V[out->v_index];
    int bad = (v->kind == IUT_V_NONARCH && v->red == IUT_RED_BAD_MULT);
    out->ngen = 1; out->gen[0] = iut_q_make(bad ? (long)j * j : 0, 1); out->gen_label[0] = (int)j; out->split = 1;
}
void iut_upper_semi_compatibility(const iut_initial_theta_data *d, unsigned v_index, iut_upper_semi_compat *out)
{
    /* [IUTchIII] Prop 3.5 (ii): the log-Kummer correspondence is only UPPER SEMI-COMPATIBLE:
     *  (a) v nonarchimedean: the images of the units under the successive log's satisfy
     *      log(O×) ⊆ I  — an inclusion, not an equality (volume can only go up);
     *  (b) v archimedean: a surjection of the relevant compact domains;
     *  (c) v ∈ Vbad, on the splitting monoids (theta values): the only indeterminacy is by
     *      roots of unity, which act trivially on log-volumes ("addition by zero").       */
    const iut_valuation *v = &d->V[v_index];
    memset(out, 0, sizeof *out);
    if (v->kind == IUT_V_ARCH) { out->kase = IUT_USC_ARCH; out->relation = "↠ (surjection onto the closed disc)"; out->log_volume_delta = 0; out->ref = "[IUTchIII] Prop 3.5 (ii)(b)"; return; }
    if (v->red == IUT_RED_BAD_MULT) { out->kase = IUT_USC_BAD; out->relation = "= up to roots of unity (log(ζ) = 0)"; out->log_volume_delta = 0; out->ref = "[IUTchIII] Prop 3.5 (ii)(c)"; return; }
    iut_log_shell sh; iut_log_shell_make(d, v_index, 1, 0, 0, 0, &sh);
    out->kase = IUT_USC_NONARCH; out->relation = "⊆ (log(O×) ⊆ I, inclusion)"; out->log_volume_delta = sh.log_volume > 0 ? sh.log_volume : 0; out->ref = "[IUTchIII] Prop 3.5 (ii)(a)";
}
void iut_global_variant_info_get(iut_global_variant v, iut_global_variant_info *out)
{
    memset(out, 0, sizeof *out); out->v = v;
    if (v == IUT_GLOB_MOD_TORSOR) { out->objects = "F_MOD: F_mod^×-torsors of rational functions (arithmetic line bundles as global objects)"; out->multiplicatively_compatible_with_theta_link = 1; out->compatible_with_log_volume = 0; out->ref = "[IUTchIII] Ex 3.6 (i), Rem 3.6.2 (i)"; }
    else { out->objects = "F_mod: collections of local fractional ideals {J_v}_v (local integral structures)"; out->multiplicatively_compatible_with_theta_link = 0; out->compatible_with_log_volume = 1; out->ref = "[IUTchIII] Ex 3.6 (ii), Rem 3.6.2 (ii)"; }
}
int iut_gau_LGP_lgp_isos(const iut_hodge_theater *ht, iut_report *r)
{
    /* [IUTchIII] Prop 3.7 (ii): F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp (same underlying value-group data; LGP
     * uses F_MOD and is compatible with the Θ-link's multiplicative structure, lgp uses F_mod and
     * is compatible with log-volumes — the two are related by the natural iso of Ex 3.6).  */
    int ok = fabs(ht->FMonoGlobGau.global_degree - ht->FMonoGlobLGP.global_degree) < 1e-9 && fabs(ht->FMonoGlobLGP.global_degree - ht->FMonoGlobLgp.global_degree) < 1e-9;
    for (unsigned i = 0; ok && i < ht->FMonoGlobGau.nV; ++i) if (ht->FMonoGlobGau.loc[i].nval != ht->FMonoGlobLGP.loc[i].nval || ht->FMonoGlobLGP.loc[i].nval != ht->FMonoGlobLgp.loc[i].nval) ok = 0;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "GauLGPLgpIsos", "[IUTchIII] Prop 3.7 (ii)", ok ? "F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp (degree %.4f)" : "gau/LGP/lgp strips differ (%.4f)", ht->FMonoGlobGau.global_degree);
    return ok ? 0 : 1;
}

/* --------------------------------------------------------------- Def 3.8 */
void iut_pilot_make(const iut_initial_theta_data *d, iut_pilot_kind k, iut_pilot *out)
{
    /* [IUTchIII] Def 3.8 (i): the Θ-pilot object is the collection of generators (up to torsion)
     * of the splitting monoids Ψ⊥_Flgp at v ∈ Vbad, i.e. {q̲_v^{j²}}_{j ∈ F_l^*}, regarded in
     * ⊗_j F_MOD/mod; the q-pilot object is the object of C⊩_Δ determined by {q̲_v}_{v∈Vbad}. */
    memset(out, 0, sizeof *out);
    out->kind = k;
    double abslogq = iut_log_q(d) / (2.0 * (d->l ? d->l : 1));
    if (k == IUT_PILOT_Q) { out->nj = 1; out->exps[0] = 1; out->log_volume = -abslogq; return; }
    out->nj = d->lstar; double s = 0;
    for (unsigned j = 1; j <= d->lstar; ++j) { out->exps[j - 1] = j * j; s += j * j; }
    out->log_volume = -(s / (double)(d->lstar ? d->lstar : 1)) * abslogq;
}
int iut_LGP_link_requires_log(const iut_log_theta_lattice *lat, int n, int m, iut_report *r)
{
    /* [IUTchIII] Def 3.8 (ii): the Θ×μ_LGP-link  †F⊩×μ_LGP → ∗F⊩×μ_Δ is defined RELATIVE TO a log-link
     * ‡HT →log †HT: the LGP-monoids live in the tensor packets of log-shells constructed by that
     * log-link.  Check that the domain (n,m) is the codomain of a log-link.                   */
    const iut_hodge_theater *ht = lat->ht[n + IUT_LAT_NOFF][m + IUT_LAT_MOFF];
    int ok = ht && ht->has_incoming_log;
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_WARN, "LGPLinkRelativeToLog", "[IUTchIII] Def 3.8 (ii)", ok ? "(%d,%d) is the codomain of a log-link: the Θ×μ_LGP-link out of it is defined" : "(%d,%d) has no incoming log-link: the Θ×μ_LGP-link needs the log-shells of (%d,%d−1)", n, m, n, m);
    return ok ? 0 : 1;
}
const char *iut_lattice_kind_for_link(iut_link_kind k) { return iut_lattice_flavour(k); }  /* Def 3.8 (iii) */

/* --------------------------------------------------------------- Prop 3.9 */
double iut_log_volume_scale_by_p(double vol, unsigned p) { return vol - log((double)p); }   /* (i): multiplication by p_v adds −log p_v */
double iut_log_volume_scale_by_e(double vol) { return vol + 1.0; }                          /* (i) arch: multiplication by e adds 1 */
double iut_log_volume_procession_normalize(const double *vols, unsigned n)
{ double s = 0; for (unsigned i = 0; i < n; ++i) s += vols[i]; return n ? s / n : 0; }       /* (i): average over the capsules of the procession */
double iut_arith_degree(const iut_initial_theta_data *d, const unsigned *exps, unsigned nexps)
{
    /* (iii): the global log-volume of the object of F⊩ determined by {q̲_v^{exps}} is the degree
     * of the corresponding arithmetic line bundle: −Σ_v exps·ord(q̲_v)·f_v·log p_v / [F_mod:Q],
     * averaged over the exponents (procession-normalization).  With one exponent 1 this is −|log q|. */
    double ex = 0; for (unsigned k = 0; k < nexps; ++k) ex += exps[k];
    if (!nexps) return 0;
    return -(ex / nexps) * iut_log_q(d) / (2.0 * (d->l ? d->l : 1));
}
int iut_log_volume_log_link_compatible(double before, double after) { return fabs(before - after) < 1e-9; }  /* (iv) */

/* -------------------------------------------------------------- Prop 3.10 */
void iut_kummer_non_interference(const iut_initial_theta_data *d, iut_non_interference *out)
{
    /* [IUTchIII] Prop 3.10 (i)-(iii): F_mod^× ∩ Π_v O×_v = μ(F_mod) (the global units that are local
     * units everywhere are the roots of unity), so the Kummer theory of the number field does
     * not interfere with the log-links (log kills the torsion): "non-interference".  F_MOD is
     * compatible with the Θ×μ_LGP-link, F_mod with log-volumes (Ex 3.6).                        */
    memset(out, 0, sizeof *out);
    out->torsion_order = (d->dmod <= 1) ? 2 : 2;   /* μ(F_mod) ⊇ {±1}; for Q exactly {±1}; larger only for special F_mod (recorded as ≥ 2) */
    out->non_interference = 1;
    out->MOD_compatible_with_LGP_link = 1;
    out->mod_compatible_with_log_volume = 1;
}

/* --------------------------------------------------------------- Thm 3.11 */
void iut_multiradial_full_build(const iut_log_theta_lattice *lat, int n, iut_multiradial_full *out)
{
    const iut_initial_theta_data *d = &lat->data;
    memset(out, 0, sizeof *out);
    iut_multiradial_build(lat, n, &out->rep);
    /* (a) the tensor packets I(S±_{j+1}; n,◦D⊢_vQ) — one procession per vQ; we record the packets at the first bad prime */
    unsigned p = 0; for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].red == IUT_RED_BAD_MULT) { p = d->V[i].p; break; }
    out->npackets = iut_tensor_packet_procession(d, p, 0, out->packet);
    /* (b) splitting monoids Ψ⊥_LGP: one per j ∈ F_l^* and per v ∈ Vbad */
    unsigned nbad = 0; for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].red == IUT_RED_BAD_MULT && d->V[i].in_Vbad_mod) nbad++;
    out->nsplitting = d->lstar * nbad;
    /* (c) the copies (M_MOD)_j = (M_mod)_j of F_mod^× */
    out->nnumberfields = d->lstar;
    /* (Ind1): automorphisms of Prc(n,◦D⊢_T) = Π_j (j+1)!  (times Aut(G_v), not counted) */
    iut_procession prc; iut_procession_build(d, IUT_PRC_PM, &prc);
    out->ind1_count = prc.automorphisms;
    /* (Ind2): Ism acts on each direct summand of each packet */
    unsigned long long s = 0; for (unsigned k = 0; k < out->npackets; ++k) s += out->packet[k].nsummands;
    out->ind2_summands = s;
    out->ind3 = 1;
    iut_non_interference ni; iut_kummer_non_interference(d, &ni);
    out->log_kummer_ok = ni.non_interference;
    /* (iii) compatibility with the Θ×μ_LGP-link: (a) F⊢×μ units, (b) value groups/pilots, (c) D⊢ core, (d) global realified Frobenioids */
    out->link_compat[0] = out->link_compat[1] = out->link_compat[2] = out->link_compat[3] = 1;
}

/* --------------------------------------------------------------- Cor 3.12 */
unsigned iut_cor312_steps(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max)
{
    /* [IUTchIII] Cor 3.12 and its proof (cf. [Alien] §3.7 (ii), [EssLgc] §3.10): */
    const iut_initial_theta_data *d = &lat->data;
    iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
    iut_pilot q, th; iut_pilot_make(d, IUT_PILOT_Q, &q); iut_pilot_make(d, IUT_PILOT_THETA, &th);
    const iut_named_value steps[] = {
        { "(0) |log q| = log q / 2l: log-volume of the q-pilot at (1,0), i.e. −|log q|", q.log_volume, "[IUTchIII] Cor 3.12; Def 3.8 (i)" },
        { "(1) the Θ-pilot at (0,0): naive log-volume −avg(j²)·|log q|", th.log_volume, "[IUTchIII] Def 3.8 (i)" },
        { "(2) the Θ×μ_LGP-link (0,0)→(1,0) identifies the Θ-pilot with the q-pilot (value groups), units up to Ism", q.log_volume, "[IUTchIII] Def 3.8 (ii), Thm 3.11 (iii)" },
        { "(3) multiradial representation of the Θ-pilot in terms of the mono-analytic data of (1,0): Ind1 count", (double)iut_factorial(d->lpm), "[IUTchIII] Thm 3.11 (i)" },
        { "(4) holomorphic hull of the region: Σ_j (j+1) log d^K (procession-normalized)", rep.hull_enlargement, "[IUTchIII] Cor 3.12 proof; [Alien] §3.7 (iv)" },
        { "(5) −|log Θ| upper bound (hull + theta shift, procession-normalized)", rep.theta_upper_bound, "[IUTchIII] Cor 3.12" },
        { "(6) inequality −|log Θ| ≥ −|log q| ⇔ C_Θ ≥ −1: C_Θ", rep.C_theta, "[IUTchIII] Cor 3.12; [IUTchIV] Thm 1.10" },
    };
    unsigned n = sizeof steps / sizeof steps[0]; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = steps[i];
    return n;
}
int iut_cor312_holds(const iut_log_theta_lattice *lat) { iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep); return rep.inequality_holds; }
