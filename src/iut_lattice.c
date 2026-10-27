/*
 * iut_lattice.c — the log-theta-lattice ([IUTchIII] Def. 1.4, Def. 3.8 (iii)),
 * the log-link ([IUTchIII] Def. 1.1, Prop. 1.3), the Θ(×μ,gau,LGP,lgp)-links
 * ([IUTchI] Cor. 3.7, [IUTchII] Cor. 4.10, [IUTchIII] Def. 3.8 (ii)), the
 * "infinite H" actually used in the proof ([EssLgc] §3.10, [Alien] §3.11),
 * coricity ([IUTchIII] Thm. 1.5) and the multiradial representation with its
 * log-volume estimate ([IUTchIII] Thm. 3.11, Cor. 3.12; [IUTchIV] Thm. 1.10;
 * [Alien] §3.7 (iv)).
 *
 *            ...         ...
 *             ↑           ↑         (vertical arrows: log-links, each column
 *   (n,m+1)•  ↑  (n+1,m+1)•          (n,◦) is a "vertical line")
 *             ↑           ↑
 *   (n,m)  • ---Θ---→ (n+1,m) •     (horizontal arrows: Θ×μ_LGP-links)
 *             ↑           ↑
 *            ...         ...
 *
 *   The lattice is NOT commutative ([IUTchIII] Rem. 1.4.1): a Θ-link is never
 *   compatible with the ring structures / log-links on either side of it.
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut.h"

int iut_lattice_in_range(int n, int m)
{
    return n >= -IUT_LAT_NOFF && n <= IUT_LAT_NOFF && m >= -IUT_LAT_MOFF && m <= IUT_LAT_MOFF;
}

void iut_lattice_init(iut_log_theta_lattice *lat, const iut_initial_theta_data *d, iut_link_kind horizontal)
{
    memset(lat, 0, sizeof *lat);
    lat->data = *d;
    lat->horizontal = (horizontal == IUT_LINK_LOG || horizontal == IUT_LINK_D_THETA_PMELL_NF) ? IUT_LINK_THETA_UNITSMODTORS_LGP : horizontal;
    lat->next_universe = 0;
    lat->focus_n = 0; lat->focus_m = 0;
    iut_lattice_get(lat, 0, 0);
}

void iut_lattice_free(iut_log_theta_lattice *lat)
{
    for (int i = 0; i < IUT_LAT_N; ++i)
        for (int j = 0; j < IUT_LAT_M; ++j)
            if (lat->ht[i][j]) { iut_hodge_theater_free(lat->ht[i][j]); lat->ht[i][j] = NULL; }
    lat->nlinks = 0;
}

iut_hodge_theater *iut_lattice_get(iut_log_theta_lattice *lat, int n, int m)
{
    if (!iut_lattice_in_range(n, m)) return NULL;
    iut_hodge_theater **slot = &lat->ht[n + IUT_LAT_NOFF][m + IUT_LAT_MOFF];
    if (!*slot) *slot = iut_hodge_theater_new(&lat->data, n, m, &lat->next_universe);
    return *slot;
}

static iut_link *find_link(iut_log_theta_lattice *lat, iut_link_kind kind, int dn, int dm, int cn, int cm)
{
    int vertical = (kind == IUT_LINK_LOG);
    for (unsigned i = 0; i < lat->nlinks; ++i) {
        iut_link *L = &lat->links[i];
        if ((L->kind == IUT_LINK_LOG) == vertical && L->dom_n == dn && L->dom_m == dm && L->cod_n == cn && L->cod_m == cm) return L;
    }
    return NULL;
}

/* ---------------------------------------------------------------- log-link */
/* [IUTchIII] Def. 1.1 (i)-(iii), Prop. 1.3:  the log-link  †F → ‡F  (here (n,m) → (n,m+1))
 *   - identifies the D-prime-strips (Π_v) of domain and codomain  ⇒ vertically coric;
 *   - sends the units O×_{†} via log to K_v, and takes the codomain's O▷ to be the
 *     multiplicative monoid of the *additive* image: ring structures are NOT identified;
 *   - produces, in the codomain, the log-shells  I_v = (p*)^{-1} log(O×)  that contain
 *     the images of both the units and (after Kummer) the theta/q values.           */
const iut_link *iut_apply_log_link(iut_log_theta_lattice *lat, int n, int m)
{
    iut_hodge_theater *dom = iut_lattice_get(lat, n, m), *cod = iut_lattice_get(lat, n, m + 1);
    if (!dom || !cod) return NULL;
    iut_link *L = find_link(lat, IUT_LINK_LOG, n, m, n, m + 1);
    if (!L) {
        if (lat->nlinks >= sizeof lat->links / sizeof lat->links[0]) return NULL;
        L = &lat->links[lat->nlinks++];
    }
    memset(L, 0, sizeof *L);
    L->kind = IUT_LINK_LOG; L->dom_n = n; L->dom_m = m; L->cod_n = n; L->cod_m = m + 1;
    L->glued_kind = IUT_PS_F; L->full_poly_isomorphism = 1;
    L->preserves_Pi = 1; L->preserves_G = 1; L->preserves_units_mod_tors = 0; L->preserves_ring_structure = 0;
    L->dilation = 1.0;
    /* vertical coricity: étale-like data of every holomorphic strip is literally shared */
    iut_prime_strip *pairs[][2] = {
        { &dom->pmell.FBoxPlus, &cod->pmell.FBoxPlus }, { &dom->pmell.DCircDotPm, &cod->pmell.DCircDotPm },
        { &dom->nf.FGt, &cod->nf.FGt }, { &dom->nf.FCircAst, &cod->nf.FCircAst },
        { &dom->nf.tht.FMonoGlobMod, &cod->nf.tht.FMonoGlobMod }, { &dom->nf.tht.FMonoGlobTht, &cod->nf.tht.FMonoGlobTht },
        { &dom->FMonoGlobTriangle, &cod->FMonoGlobTriangle }, { &dom->FMonoGlobEnv, &cod->FMonoGlobEnv },
        { &dom->FMonoGlobGau, &cod->FMonoGlobGau }, { &dom->FMonoGlobLGP, &cod->FMonoGlobLGP }, { &dom->FMonoGlobLgp, &cod->FMonoGlobLgp },
    };
    for (size_t k = 0; k < sizeof pairs / sizeof pairs[0]; ++k)
        for (unsigned i = 0; i < dom->data->nV; ++i) {
            pairs[k][1]->loc[i].Pi_copy = pairs[k][0]->loc[i].Pi_copy;
            pairs[k][1]->loc[i].G_copy  = pairs[k][0]->loc[i].G_copy;
        }
    for (unsigned i = 0; i < dom->pmell.nT; ++i) cod->pmell.T[i].basepoint = dom->pmell.T[i].basepoint;
    for (unsigned i = 0; i < dom->nf.nJ; ++i)    cod->nf.J[i].basepoint = dom->nf.J[i].basepoint;
    /* log-shells in the codomain, one per v ∈ V */
    const iut_initial_theta_data *d = dom->data;
    cod->nshell = d->nV;
    for (unsigned i = 0; i < d->nV; ++i) {
        iut_log_shell *S = &cod->shell[i];
        const iut_valuation *v = &d->V[i];
        memset(S, 0, sizeof *S);
        S->v_index = i; S->holomorphic = 1; S->etale_like = 0; S->lattice_n = n; S->lattice_m = m;
        if (v->kind == IUT_V_ARCH) { S->pstar = 0; S->radius = iut_q_make(0, 1); S->log_volume = 0; continue; }
        unsigned e = v->e_K ? v->e_K : 1, p = v->p;
        S->pstar = (p == 2) ? 4 : p;
        /* log(1 + p^λ O) = p^λ O once λ > e/(p−1): λ_min = floor(e/(p−1)) + 1 (in units of ord of a uniformizer) */
        long lam = (long)(e / (p - 1)) + 1, kstar = (p == 2) ? 2 : 1;
        S->radius = iut_q_make(lam - kstar * (long)e, (long)e);   /* p-adic valuation of a generator of I_v */
        S->log_volume = iut_log_shell_volume(v, d->dK);
    }
    cod->has_incoming_log = 1;
    cod->log_iterate = dom->log_iterate + 1;
    return L;
}

/* ---------------------------------------------------------------- Θ-link  */
/* [IUTchI] Cor. 3.7; [IUTchII] Cor. 4.10 (iii); [IUTchIII] Def. 3.8 (ii):
 *   †F⊩_LGP  ≅  ‡F⊩_Δ    i.e.   {q̲_v^{j²}}_{j=1..l*}  ↦  {q̲_v}
 *   - (aΘ) the unit groups G_v ↷ O×μ are glued (horizontally coric, up to Ism = Ind2);
 *   - (bΘ) the value groups are NOT compatible: this is the "dilation" by the
 *          Θ-pilot, measured here by the average exponent l(l+1)/12;
 *   - (cΘ) the global realified Frobenioids are glued;
 *   - Π_v (the holomorphic structure) is NOT shared: the two sides are
 *     "mutually alien" ring theories ([Alien] §1).                              */
const iut_link *iut_apply_theta_link(iut_log_theta_lattice *lat, int n, int m)
{
    iut_hodge_theater *dom = iut_lattice_get(lat, n, m), *cod = iut_lattice_get(lat, n + 1, m);
    if (!dom || !cod) return NULL;
    iut_link *L = find_link(lat, lat->horizontal, n, m, n + 1, m);
    if (!L) {
        if (lat->nlinks >= sizeof lat->links / sizeof lat->links[0]) return NULL;
        L = &lat->links[lat->nlinks++];
    }
    memset(L, 0, sizeof *L);
    L->kind = lat->horizontal; L->dom_n = n; L->dom_m = m; L->cod_n = n + 1; L->cod_m = m;
    L->glued_kind = (lat->horizontal == IUT_LINK_THETA) ? IUT_PS_FMonoGlob : IUT_PS_FMonoGlobValUnitsModTors;
    L->full_poly_isomorphism = 1;
    L->preserves_Pi = 0; L->preserves_G = 1;
    L->preserves_units_mod_tors = (lat->horizontal != IUT_LINK_THETA);
    L->preserves_ring_structure = 0;
    const iut_initial_theta_data *d = dom->data;
    L->dilation = (double)d->l * (d->l + 1) / 12.0;   /* (1/l*) Σ_{j=1}^{l*} j² */
    /* which domain strip is glued: Θ-link: F⊩_tht; Θ×μ: F⊩_env; gau: F⊩_gau; LGP: F⊩_LGP; lgp: F⊩_lgp */
    iut_prime_strip *src = &dom->FMonoGlobLGP;
    switch (lat->horizontal) {
    case IUT_LINK_THETA: src = &dom->nf.tht.FMonoGlobTht; break;
    case IUT_LINK_THETA_UNITSMODTORS: src = &dom->FMonoGlobEnv; break;
    case IUT_LINK_THETA_UNITSMODTORS_GAU: src = &dom->FMonoGlobGau; break;
    case IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL: src = &dom->FMonoGlobLgp; break;
    default: break;
    }
    iut_prime_strip *dst = (lat->horizontal == IUT_LINK_THETA) ? &cod->nf.tht.FMonoGlobMod : &cod->FMonoGlobTriangle;
    for (unsigned i = 0; i < d->nV; ++i) {
        dst->loc[i].G_copy     = src->loc[i].G_copy;      /* (aΘ): G_v identified (up to Aut, Ind1) */
        dst->loc[i].units_copy = src->loc[i].units_copy;  /* (aΘ): O×μ identified (up to Ism, Ind2) */
        /* (bΘ): value groups deliberately left as they are: {q̲} on the right, {q̲^{j²}} on the left */
    }
    return L;
}

/* ---------------------------------------------------------- "infinite H"  */
/* [EssLgc] §3.10, [Alien] §3.11 Fig. 3.14: the proof of Cor 3.12 only uses the two
 * vertical lines (n,◦), (n+1,◦) and the single Θ-link (n,0) → (n+1,0).            */
void iut_lattice_build_H(iut_log_theta_lattice *lat, int n, int mmin, int mmax)
{
    if (mmin < -IUT_LAT_MOFF) mmin = -IUT_LAT_MOFF;
    if (mmax >  IUT_LAT_MOFF) mmax =  IUT_LAT_MOFF;
    for (int col = n; col <= n + 1; ++col) {
        if (col < -IUT_LAT_NOFF || col > IUT_LAT_NOFF) continue;
        for (int m = mmin; m < mmax; ++m) iut_apply_log_link(lat, col, m);
    }
    if (mmin <= 0 && 0 <= mmax) iut_apply_theta_link(lat, n, 0);
    lat->focus_n = n; lat->focus_m = 0;
}

/* ---------------------------------------------------------------- coricity */
int iut_vertically_coric(iut_ps_kind k)   { return iut_ps_kind_is_etale_like(k); }                          /* [IUTchIII] Thm 1.5 (i)   */
int iut_horizontally_coric(iut_ps_kind k) { return k == IUT_PS_FMonoUnitsModTors || k == IUT_PS_DMono; }    /* [IUTchIII] Thm 1.5 (ii)  */
int iut_bi_coric(iut_ps_kind k)           { return k == IUT_PS_DMono; }                                     /* [IUTchIII] Thm 1.5 (iii) */

/* ------------------------------------------------- multiradial representation */
/* [IUTchIII] Thm 3.11 (i): R^LGP_{n,◦} consists of
 *   (a) tensor packets of log-shells indexed by the processions S^±_{j+1}, j = 0..l*,
 *   (b) the splitting monoids of the LGP-monoids (the Θ-pilot values q̲^{j²}),
 *   (c) copies (F_mod^×)_j,
 * up to (Ind1) perms/Aut of the procession, (Ind2) Ism on O×μ, (Ind3) upper semi-compatibility.
 * [IUTchIII] Cor 3.12: −|log(Θ)| ≥ −|log(q)|, where both are procession-normalized
 * (averaged over j ∈ F_l^*) mono-analytic log-volumes.
 * [Alien] §3.7 (iv): the hull enlarges the j-th packet by ≈ (j+1)·log(d^K), hence
 *   Σ_{j=1}^{l*} [(j+1) log d^K − (j²/2l) log q]  ≈  (l²/48)(6 log d^K − log q).        */
void iut_multiradial_build(const iut_log_theta_lattice *lat, int n, iut_multiradial_rep *out)
{
    const iut_initial_theta_data *d = &lat->data;
    memset(out, 0, sizeof *out);
    out->n = n;
    out->ind.ind1 = out->ind.ind2 = out->ind.ind3 = 1;
    out->logq = iut_log_q(d);
    out->abs_log_q = out->logq / (2.0 * d->l);
    out->nsteps = d->lstar + 1;
    double sum = 0, hull = 0;
    for (unsigned j = 0; j <= d->lstar; ++j) {
        iut_procession_step *s = &out->step[j];
        s->j = j; s->size = j + 1; s->perms = (unsigned)(j + 1 <= 12 ? iut_factorial(j + 1) : 0);
        s->log_volume_leading = (j + 1) * d->logdK;
        s->theta_shift = -((double)j * j / (2.0 * d->l)) * out->logq;
        if (j >= 1) { sum += s->log_volume_leading + s->theta_shift; hull += s->log_volume_leading; }
    }
    out->leading_term = sum;                                   /* exact finite sum of the leading terms */
    out->hull_enlargement = hull / (double)(d->lstar ? d->lstar : 1);
    out->theta_upper_bound = sum / (double)(d->lstar ? d->lstar : 1);  /* procession-normalized −|log(Θ)| (heuristic) */
    out->C_theta = iut_C_theta(d, d->logdF, iut_log_cond(d));          /* [IUTchIV] Thm 1.10, F_tpd-data */
    out->inequality_holds = (out->theta_upper_bound >= -out->abs_log_q) && (out->C_theta >= -1.0);
}

/* ---------------------------------------------------------------- validators */
int iut_validate_link(const iut_link *lk, const iut_log_theta_lattice *lat, iut_report *r)
{
    unsigned before = r->errors;
    const char *id = iut_link_kind_id(lk->kind);
    const iut_initial_theta_data *d = &lat->data;
    if (lk->preserves_ring_structure)
        iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchIII] Rem 1.4.1; [Alien] §3.3", "%s: no link of the lattice is compatible with the ring structures", iut_link_kind_notation(lk->kind));
    if (!lk->full_poly_isomorphism)
        iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Cor 3.7 (i)", "%s must be a FULL poly-isomorphism (no distinguished isomorphism)", iut_link_kind_notation(lk->kind));
    if (lk->kind == IUT_LINK_LOG) {
        if (lk->cod_n != lk->dom_n || lk->cod_m != lk->dom_m + 1)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchIII] Def 1.4", "log-link must go (n,m) → (n,m+1), got (%d,%d)→(%d,%d)", lk->dom_n, lk->dom_m, lk->cod_n, lk->cod_m);
        if (!lk->preserves_Pi || !lk->preserves_G)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchIII] Thm 1.5 (i)", "log-link must identify the D-prime-strips (vertical coricity)");
        if (lk->preserves_units_mod_tors)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchIII] Prop 1.3; Thm 3.11 (ii)", "log-link does not identify the Frobenius-like units (source of Ind3)");
        const iut_hodge_theater *cod = lat->ht[lk->cod_n + IUT_LAT_NOFF][lk->cod_m + IUT_LAT_MOFF];
        if (cod && cod->nshell != d->nV)
            iut_report_add(r, IUT_SEV_ERROR, "LogShell", "[IUTchIII] Def 1.1", "codomain of log-link lacks its log-shells");
    } else {
        if (lk->cod_n != lk->dom_n + 1 || lk->cod_m != lk->dom_m)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchIII] Def 1.4", "Θ-link must go (n,m) → (n+1,m), got (%d,%d)→(%d,%d)", lk->dom_n, lk->dom_m, lk->cod_n, lk->cod_m);
        if (lk->preserves_Pi)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Cor 3.7; [Alien] §1", "Θ-link must NOT identify Π_v: the two sides are mutually alien");
        if (!lk->preserves_G)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Cor 4.10 (aΘ)", "Θ-link identifies G_v ↷ O×μ (up to Ind1, Ind2)");
        if (lk->kind != IUT_LINK_THETA && !lk->preserves_units_mod_tors)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Cor 4.10 (iii)", "Θ×μ-type links glue the F⊢×μ-prime-strips (horizontal coricity)");
        if (lk->kind == IUT_LINK_THETA && lk->glued_kind != IUT_PS_FMonoGlob)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Cor 3.7", "Θ-link glues F⊩-prime-strips");
        if (lk->kind != IUT_LINK_THETA && lk->glued_kind != IUT_PS_FMonoGlobValUnitsModTors)
            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Cor 4.10 (iii)", "Θ×μ-type links glue F⊩▶×μ-prime-strips");
        double want = (double)d->l * (d->l + 1) / 12.0;
        if (fabs(lk->dilation - want) > 1e-9)
            iut_report_add(r, IUT_SEV_ERROR, "JSq", "[IUTchIII] Def 3.8; Rem 3.12.1", "value-group dilation must be the average of j², l(l+1)/12 = %.3f", want);
    }
    if (r->errors == before)
        iut_report_add(r, IUT_SEV_OK, id, lk->kind == IUT_LINK_LOG ? "[IUTchIII] Def 1.1" : "[IUTchIII] Def 3.8", "%s (%d,%d)→(%d,%d) well-formed", iut_link_kind_notation(lk->kind), lk->dom_n, lk->dom_m, lk->cod_n, lk->cod_m);
    return (int)(r->errors - before);
}

int iut_validate_lattice(const iut_log_theta_lattice *lat, iut_report *r)
{
    unsigned before = r->errors;
    unsigned nht = 0, nlog = 0, ntheta = 0;
    iut_report rr; memset(&rr, 0, sizeof rr);
    for (int i = 0; i < IUT_LAT_N; ++i)
        for (int j = 0; j < IUT_LAT_M; ++j)
            if (lat->ht[i][j]) {
                nht++;
                memset(&rr, 0, sizeof rr);
                if (iut_validate_hodge_theater(lat->ht[i][j], &rr))
                    iut_report_add(r, IUT_SEV_ERROR, "NMHodgeTheater", "[IUTchIII] Def 1.4", "Hodge theater at (%d,%d) has %u error(s); first: %s", lat->ht[i][j]->n, lat->ht[i][j]->m, rr.errors, rr.issue[0].msg);
                /* distinct universes / labels */
                for (int a = 0; a < IUT_LAT_N; ++a)
                    for (int b = 0; b < IUT_LAT_M; ++b)
                        if (lat->ht[a][b] && lat->ht[a][b] != lat->ht[i][j] && lat->ht[a][b]->universe == lat->ht[i][j]->universe)
                            iut_report_add(r, IUT_SEV_ERROR, "NMHodgeTheater", "[IUTchIV] §3; [IUTchIII] Rem 1.4.1", "two lattice vertices share a universe label");
            }
    for (unsigned k = 0; k < lat->nlinks; ++k) {
        const iut_link *L = &lat->links[k];
        memset(&rr, 0, sizeof rr);
        if (iut_validate_link(L, lat, &rr))
            iut_report_add(r, IUT_SEV_ERROR, iut_link_kind_id(L->kind), "[IUTchIII] Def 1.4", "link (%d,%d)→(%d,%d): %s", L->dom_n, L->dom_m, L->cod_n, L->cod_m, rr.issue[0].msg);
        if (L->kind == IUT_LINK_LOG) nlog++; else ntheta++;
        if (!lat->ht[L->dom_n + IUT_LAT_NOFF][L->dom_m + IUT_LAT_MOFF] || !lat->ht[L->cod_n + IUT_LAT_NOFF][L->cod_m + IUT_LAT_MOFF])
            iut_report_add(r, IUT_SEV_ERROR, iut_link_kind_id(L->kind), "[IUTchIII] Def 1.4", "link endpoint (%d,%d)/(%d,%d) missing", L->dom_n, L->dom_m, L->cod_n, L->cod_m);
        /* coricity checks on the actual data */
        if (L->kind == IUT_LINK_LOG) {
            const iut_hodge_theater *A = lat->ht[L->dom_n + IUT_LAT_NOFF][L->dom_m + IUT_LAT_MOFF], *B = lat->ht[L->cod_n + IUT_LAT_NOFF][L->cod_m + IUT_LAT_MOFF];
            if (A && B) for (unsigned i = 0; i < lat->data.nV; ++i)
                if (A->nf.FGt.loc[i].Pi_copy != B->nf.FGt.loc[i].Pi_copy)
                    { iut_report_add(r, IUT_SEV_ERROR, "VerticallyCoric", "[IUTchIII] Thm 1.5 (i)", "D-prime-strip not shared across log-link at v#%u", i); break; }
        } else {
            const iut_hodge_theater *A = lat->ht[L->dom_n + IUT_LAT_NOFF][L->dom_m + IUT_LAT_MOFF], *B = lat->ht[L->cod_n + IUT_LAT_NOFF][L->cod_m + IUT_LAT_MOFF];
            if (A && B && L->kind != IUT_LINK_THETA) for (unsigned i = 0; i < lat->data.nV; ++i)
                if (A->FMonoGlobLGP.loc[i].units_copy != B->FMonoGlobTriangle.loc[i].units_copy && L->kind == IUT_LINK_THETA_UNITSMODTORS_LGP)
                    { iut_report_add(r, IUT_SEV_ERROR, "HorizontallyCoric", "[IUTchIII] Thm 1.5 (ii)", "F⊢×μ-prime-strip not shared across Θ-link at v#%u", i); break; }
            if (A && B) for (unsigned i = 0; i < lat->data.nV; ++i)
                if (A->FMonoGlobLGP.loc[i].Pi_copy && A->FMonoGlobLGP.loc[i].Pi_copy == B->FMonoGlobTriangle.loc[i].Pi_copy)
                    iut_report_add(r, IUT_SEV_ERROR, "AlienCopy", "[Alien] §1", "Π_v shared across a Θ-link: the copies are not mutually alien");
        }
    }
    /* structure of the portion built */
    int rows_with_theta[IUT_LAT_M] = { 0 };
    for (unsigned k = 0; k < lat->nlinks; ++k) if (lat->links[k].kind != IUT_LINK_LOG) rows_with_theta[lat->links[k].dom_m + IUT_LAT_MOFF]++;
    int multi = 0; for (int j = 0; j < IUT_LAT_M; ++j) if (rows_with_theta[j] > 0 && j != IUT_LAT_MOFF) multi = 1;
    iut_report_add(r, IUT_SEV_INFO, multi ? "LogThetaLattice" : "InfiniteH", multi ? "[IUTchIII] Def 1.4" : "[EssLgc] §3.10; [Alien] §3.11",
                   "%u Hodge theaters, %u log-links, %u Θ-links (%s)%s", nht, nlog, ntheta, iut_link_kind_notation(lat->horizontal),
                   multi ? "" : "; only the row m=0 carries a Θ-link: this is the 'infinite H' used in the proof of Cor 3.12");
    iut_report_add(r, IUT_SEV_INFO, "LogThetaLattice", "[IUTchIII] Rem 1.4.1", "the diagram is highly non-commutative: no square of links is required to commute");
    if (r->errors == before)
        iut_report_add(r, IUT_SEV_OK, "LogThetaLattice", "[IUTchIII] Def 3.8 (iii)", "%s-Gaussian log-theta-lattice well-formed", lat->horizontal == IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL ? "lgp" : "LGP");
    return (int)(r->errors - before);
}
