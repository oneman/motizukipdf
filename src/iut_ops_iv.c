/*
 * iut_ops_iv.c — operations of [IUTchIV] (log-volume computations and set-theoretic foundations).
 *
 *  Prop 1.1  tensor products and differents: p^{d_{I*}}(R_I)~ ⊆ R_I ⊆ (R_I)~
 *  Prop 1.2  differents and logarithms: a_i, b_i, p^a R ⊆ log(R×) ⊆ p^{-b} R, the φ-estimates
 *  Prop 1.3  bounds for the different exponent d_i
 *  Prop 1.4  nonarchimedean normalized log-volume estimates
 *  Prop 1.5  archimedean metric estimates
 *  Prop 1.6  prime number theorem bounds
 *  Prop 1.7  weighted averages
 *  Prop 1.8  torsion points and fields of definition
 *  Def 1.9   arithmetic divisors and their degrees
 *  Thm 1.10  the Diophantine inequality, (E1)-(E6)
 *  Prop 2.1, Cor 2.2, Cor 2.3  elementary estimates and the effective ABC/Szpiro form
 *  §3        species, mutations, mutation-histories (Def 3.1, Def 3.3)
 */
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* -------------------------------------------------------- Props 1.1-1.4 */
double iut_iv_a(const iut_local_field *k)
{ return k->p > 2 ? (1.0 / k->e) * ceil((double)k->e / (double)(k->p - 2)) : 2.0; }           /* Prop 1.2 */
double iut_iv_b(const iut_local_field *k)
{ return floor(log((double)k->p * k->e / (double)(k->p - 1)) / log((double)k->p)) - 1.0 / k->e; }
double iut_iv_dI(const iut_local_field *k, unsigned n) { double s = 0; for (unsigned i = 0; i < n; ++i) s += k[i].d; return s; }
double iut_iv_dIstar(const iut_local_field *k, unsigned n, unsigned star) { double s = 0; for (unsigned i = 0; i < n; ++i) if (i != star) s += k[i].d; return s; }  /* Prop 1.1 */
static double aI(const iut_local_field *k, unsigned n) { double s = 0; for (unsigned i = 0; i < n; ++i) s += iut_iv_a(&k[i]); return s; }
static double bI(const iut_local_field *k, unsigned n) { double s = 0; for (unsigned i = 0; i < n; ++i) s += iut_iv_b(&k[i]); return s; }
int iut_iv_prop12_i(const iut_local_field *k, double *lo, double *hi)
{
    /* p^{a_i} R_i ⊆ log_p(R_i^×) ⊆ p^{−b_i} R_i; equalities iff p > 2 and e_i ≤ p − 2 (then a_i = 1/e_i = −b_i) */
    *lo = iut_iv_a(k); *hi = -iut_iv_b(k);
    return k->p > 2 && k->e <= k->p - 2;
}
double iut_iv_prop12_ii_exp_log(const iut_local_field *k, unsigned n, double lambda)   { return ceil(lambda - iut_iv_dI(k, n) - aI(k, n)); }
double iut_iv_prop12_ii_exp_tilde(const iut_local_field *k, unsigned n, double lambda) { return floor(lambda - iut_iv_dI(k, n) - aI(k, n) - bI(k, n)); }
double iut_iv_prop12_iii_exp(const iut_local_field *k, unsigned n, double lambda)      { return floor(lambda - iut_iv_dI(k, n)) - 1.0; }
int    iut_iv_prop12_iv_unramified(const iut_local_field *k, unsigned n) { for (unsigned i = 0; i < n; ++i) if (k[i].e != 1 || k[i].p == 2) return 0; return 1; }
void   iut_iv_prop13_bounds(const iut_local_field *k0, const iut_local_field *ki, unsigned n_i, double *lo, double *hi)
{
    /* Prop 1.3: for k_0 ⊆ k_i with relative ramification index e_{i/0} = e_i/e_0 and [k_i:k_0] ≤ p^{n_i}... :
     *   d_i ≥ d_0 + (e_{i/0} − 1)/e_i  (equality if k_i/k_0 is tamely ramified),  d_i ≤ d_0 + n_i + 1/e_0 */
    double ei0 = (double)ki->e / (double)(k0->e ? k0->e : 1);
    *lo = k0->d + (ei0 - 1.0) / ki->e;
    *hi = k0->d + (double)n_i + 1.0 / (k0->e ? k0->e : 1);
}
double iut_iv_mulog_log_units(const iut_local_field *k)
{ return -(1.0 / k->e + (double)k->m / ((double)k->e * k->f)) * log((double)k->p); }   /* Prop 1.4 (ii) */
double iut_iv_prop14_iii_bound_log(const iut_local_field *k, unsigned n, unsigned nstar, double lambda)
{ return (-lambda + iut_iv_dI(k, n) + 1.0 + 4.0 * nstar / (double)k[0].p) * log((double)k[0].p); }
double iut_iv_prop14_iii_bound_tilde(const iut_local_field *k, unsigned n, const int *in_star, double lambda)
{
    double s = (-lambda + iut_iv_dI(k, n) + 1.0) * log((double)k[0].p);
    for (unsigned i = 0; i < n; ++i) if (in_star[i]) s += 3.0 + log((double)k[i].e);
    return s;
}
double iut_iv_prop14_iii_dI_plus_aI_lower(const iut_local_field *k, unsigned n) { return k[0].p > 2 ? (double)n : 2.0 * n; }
int    iut_iv_prop14_iv(const iut_local_field *k, unsigned n) { return iut_iv_prop12_iv_unramified(k, n); }  /* μ_log((R_I)~) = 0 and φ((R_I)~) ⊆ (R_I)~ */

/* -------------------------------------------------------------- Prop 1.5 */
unsigned long long iut_iv_arch_summands(unsigned nI, unsigned nVarc)
{ unsigned long long s = 1; for (unsigned i = 0; i < nI; ++i) s *= (nVarc ? nVarc : 1); return nI ? s << (nI - 1) : 1; }  /* C⊗_R C ≅ C⊕C: 2^{|I|−1}·|V|^{|I|} summands */
double iut_iv_arch_metric_factor(unsigned nI) { return nI ? pow(2.0, (double)nI - 1.0) : 1.0; }                  /* direct-sum metric = 2^{|I|−1} × tensor metric */
double iut_iv_arch_tensor_bound(unsigned nI, double lambda) { return pow(lambda, (double)nI); }                 /* ⊗ m_i ∈ λ^{|I|}·B_I */

/* -------------------------------------------------------------- Prop 1.6 */
double iut_iv_pnt_n_bound(double pn) { return 4.0 * pn / (3.0 * log(pn)); }
double iut_iv_pnt_count_bound(double eta) { return 4.0 * eta / (3.0 * log(eta)); }

/* -------------------------------------------------------------- Prop 1.7 */
double iut_iv_weighted_average(const double *beta, const double *lambda, unsigned n)
{ double s = 0, w = 0; for (unsigned i = 0; i < n; ++i) { s += lambda[i] * beta[i]; w += lambda[i]; } return w ? s / w : 0; }
void iut_iv_normalized_weights(const iut_initial_theta_data *d, unsigned p, double *lambda, unsigned *n)
{
    /* Rem 3.1.1 of [IUTchIII] / Prop 1.7 of [IUTchIV]: the weight of v | p is [(F_mod)_v : Q_p] = e_v f_v */
    *n = 0;
    for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].p == p) lambda[(*n)++] = (double)((d->V[i].e_mod ? d->V[i].e_mod : 1) * (d->V[i].f_mod ? d->V[i].f_mod : 1));
}

/* -------------------------------------------------------------- Prop 1.8 */
int iut_iv_torsion_facts(const iut_initial_theta_data *d, iut_report *r)
{
    /* [IUTchIV] Prop 1.8: (i) k_E := minimal field of definition of E, E has a Legendre form over a
     * quadratic extension of k_E(E[2]); (ii) (Serre's criterion) a point of order N ≥ 3 defined over
     * k ⇒ E has semistable reduction over k at primes not dividing N...; (iii) if E[l] is rational
     * over F then E has semistable reduction at all v ∤ l — hence the hypothesis "stable reduction"
     * of [IUTchI] Def 3.1 is automatic over K = F(E[l]) up to the primes above l; (vii) the tame
     * ramification index at a prime of multiplicative reduction divides the order of the q-parameter,
     * so l ∤ ord(q_v) is the condition that K/F be unramified at v ∈ Vbad.                        */
    int issues = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind != IUT_V_NONARCH || v->red != IUT_RED_BAD_MULT) continue;
        if (v->ordq % d->l == 0) { issues++; if (r) iut_report_add(r, IUT_SEV_WARN, "TorsionRamification", "[IUTchIV] Prop 1.8 (vii)", "l = %u divides ord_%s(q) = %u: K/F ramifies at %s", d->l, v->name, v->ordq, v->name); }
    }
    if (r) {
        iut_report_add(r, d->h_stable_reduction ? IUT_SEV_OK : IUT_SEV_WARN, "SemistableOverK", "[IUTchIV] Prop 1.8 (ii),(iii)", "E[l] rational over K ⇒ semistable reduction over K away from l (asserted: %s)", d->h_stable_reduction ? "yes" : "no");
        iut_report_add(r, IUT_SEV_INFO, "MinimalFieldOfDefinition", "[IUTchIV] Prop 1.8 (i)", "k_E ⊆ F_mod = Q(j_E), [F_mod:Q] = %u; F_tpd = F_mod(E[2]) has degree ≤ 6 over F_mod", d->dmod);
    }
    return issues;
}

/* --------------------------------------------------------------- Def 1.9 */
void iut_arith_divisor_zero(const iut_initial_theta_data *d, iut_arith_divisor *out) { memset(out, 0, sizeof *out); out->nV = d->nV; }
/* the q-divisor of [IUTchIV] Thm 1.10 is supported on V(F)^bad, i.e. over V^bad_mod (odd residue characteristic) */
void iut_arith_divisor_q(const iut_initial_theta_data *d, iut_arith_divisor *out)
{ iut_arith_divisor_zero(d, out); for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].in_Vbad_mod) out->coeff[i] = (double)d->V[i].ordq; }
void iut_arith_divisor_add(const iut_arith_divisor *a, const iut_arith_divisor *b, iut_arith_divisor *out)
{ *out = *a; for (unsigned i = 0; i < a->nV && i < b->nV; ++i) out->coeff[i] += b->coeff[i]; }
double iut_arith_divisor_deg(const iut_initial_theta_data *d, const iut_arith_divisor *D)
{
    /* Def 1.9 (i): deg(Σ c_v v) = Σ_{v nonarch} c_v·log|k(v)| + Σ_{v arch} c_v·[F_v:R]; here f_v log p_v weights */
    double s = 0;
    for (unsigned i = 0; i < D->nV; ++i) { const iut_valuation *v = &d->V[i]; s += v->kind == IUT_V_NONARCH ? D->coeff[i] * (v->f_mod ? v->f_mod : 1) * log((double)v->p) : D->coeff[i]; }
    return s;
}
double iut_arith_divisor_normalized_deg(const iut_initial_theta_data *d, const iut_arith_divisor *D) { return iut_arith_divisor_deg(d, D) / (d->dmod ? d->dmod : 1); }  /* Def 1.9 (ii): divide by [F_mod:Q] */
double iut_arith_divisor_deg_E(const iut_initial_theta_data *d, const iut_arith_divisor *D, unsigned p)
{ double s = 0; for (unsigned i = 0; i < D->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].p == p) s += D->coeff[i] * (d->V[i].f_mod ? d->V[i].f_mod : 1) * log((double)p); return s / (d->dmod ? d->dmod : 1); }  /* Def 1.9 (iii): the part over E = {v | p} */

/* --------------------------------------------------------------- Thm 1.10 */
double iut_iv_E1(unsigned n) { return (n + 1.0) / 2.0; }
double iut_iv_E2(unsigned n) { return (2.0 * n + 1.0) * (n + 1.0) / 6.0; }
double iut_iv_E3(unsigned p) { return (double)p * (p + 1.0) * (p - 1.0) * (p - 1.0); }
double iut_iv_E5(void) { return 2.0; }
void iut_thm110_compute(const iut_initial_theta_data *d, iut_thm110 *out)
{
    /* [IUTchIV] Thm 1.10: with F_tpd = F_mod(E[2]) ("tripod"), d_mod = [F_mod:Q], e_mod ≤ max ramification of
     * F_mod/Q at the bad primes, e*_mod = 2^12·3^3·5·e_mod, η_prm from Prop 1.6:
     *   (1/6) log q ≤ (1 + 20 d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod l + η_prm)      — the final form,
     * derived from Cor 3.12 (C_Θ ≥ −1) via (E1)-(E6) and the bounds
     *   log d^F + log f^F ≤ log d^Ftpd + log f^Ftpd + 21;  log d^K ≤ log d^Ftpd + log f^Ftpd + 2 log l + 21. */
    memset(out, 0, sizeof *out);
    out->logq = iut_log_q(d); out->abs_logq = out->logq / (2.0 * d->l);
    /* f^{F}: "the effective arithmetic divisor whose support coincides with Supp(q^F_ADiv), but all of whose
     * coefficients are equal to 1": summed over V^bad_mod only, like log q.  A bad place over 2 or over l is
     * not in it (it used to be counted here through iut_log_cond).                                           */
    out->logd_tpd = d->logdF; out->logf_tpd = iut_log_cond_bad(d);
    out->logdF_plus_logfF_bound = out->logd_tpd + out->logf_tpd + 21.0;
    out->logdK_bound = out->logd_tpd + out->logf_tpd + 2.0 * log((double)d->l) + 21.0;
    out->logfK_bound = out->logf_tpd;
    unsigned e_mod = 1; for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].e_mod > e_mod) e_mod = d->V[i].e_mod;
    out->e_mod = e_mod; out->estar_mod = 4096.0 * 27.0 * 5.0 * e_mod; out->eta_prm = IUT_ETA_PRM_VALUE;
    out->C_theta = iut_C_theta(d, out->logd_tpd, out->logf_tpd);
    out->cor312_holds = out->C_theta >= -1.0;
    out->lhs = out->logq / 6.0;
    out->main_term = (1.0 + 20.0 * d->dmod / d->l) * (out->logd_tpd + out->logf_tpd);
    out->const_term = 20.0 * (out->estar_mod * d->l + out->eta_prm);
    out->rhs = out->main_term + out->const_term;
    out->constant_dominates = out->const_term >= out->lhs;
    out->inequality_holds = out->lhs <= out->rhs;
    /* hypotheses of the statement that Def 3.1 does not already contain */
    out->hyp_l_not_five = d->l >= 7;
    out->hyp_good_away_from_2l = 1;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind != IUT_V_NONARCH || v->red == IUT_RED_GOOD || v->in_Vbad_mod) continue;
        if (v->p != 2 && v->p != d->l) out->hyp_good_away_from_2l = 0;      /* bad, outside V^bad_mod, and not over 2l */
    }
    IUT_GAP("AssertedHypotheses");
    out->hyp_F_is_tripod_extension = d->h_F_contains_six_torsion && d->h_F_contains_five_torsion;
    out->hypotheses_ok = out->hyp_l_not_five && out->hyp_good_away_from_2l && out->hyp_F_is_tripod_extension;
}

/* ------------------------------------------ Thm 1.10, proof, Steps (iv)–(viii) */
void iut_hull_bound_compute(const iut_initial_theta_data *d, iut_hull_bound *out)
{
    /* The proof of [IUTchIV] Thm 1.10 bounds −|log(Θ)| one v_Q ∈ V_Q at a time and then sums:
     *
     *  Step (v), v_Q ∈ V^dst_Q.  With I = S^±_{j+1}, λ = ord(q̲^{j²}) at V^bad and 0 elsewhere, Prop 1.4 (iii)
     *   gives the container p^{λ−d_I−a_I−b_I}·(R_I)~ of log-volume ≤ (−λ + d_I + 1) log p + Σ_{I*}(3 + log e_i);
     *   by (R4), e_i > p − 2 forces p ≤ e*_mod·l and log e_i ≤ −3 + 4 l*_mod.  Weighted average over the
     *   collections {v_i} (Prop 1.7), then the average over j = 1..l* ((E1), (E2)):
     *        ((l*+3)/2)·log(d^K_vQ) − ((2l*+1)(l*+1)/12l)·log(q_vQ) + log(s^Q_vQ) + 2(l*+3)·l*_mod·log(s^≤_vQ)
     *      = ((l+5)/4)·log(d^K_vQ) − ((l+1)/24)·log(q_vQ) + log(s^Q_vQ) + (l+5)·l*_mod·log(s^≤_vQ).
     *  Step (vi), v_Q nonarchimedean and not distinguished: Prop 1.4 (iv), the container is (R_I)~: 0.
     *  Step (vii), v_Q archimedean: Prop 1.5, the container is π^{j+1}·B_I: (j+1) log π, average ((l+5)/4) log π.
     *
     * V^dst_Q = the primes that ramify in K = those dividing 2·3·5·l or under Supp(q + d)  ((D4)–(D7)).
     * log(s^Q_vQ) = log p (e = 1 over Q); log(s^≤_vQ) = ι_vQ = 1 iff p ≤ e*_mod·l.
     *
     * log(d^K_vQ) is not known exactly (gap LocalFieldsOfK); the proof's own bounds are used, place by place
     * (Step (ii); Prop 1.3 (i), (ii)):
     *    p ∤ 2·3·5·l, p ∈ Supp(q):  K/F_tpd tame            log d^K_vQ ≤ log d^Ftpd_vQ + log f^Ftpd_vQ
     *    p | 2·3·5:  Gal(F/F_tpd) ↪ GL2(F_3)×GL2(F_5)×Z/2   … + n_p·log p,  (n_2, n_3, n_5) = (11, 3, 2)
     *    p = l:      Gal(K/F) ↪ GL2(F_l)                    … + 2·log l
     * (2^11·3^3·5^2 is the "21" and 2 log l the "2·log(l)" of the statement's log d^K bound.)               */
    memset(out, 0, sizeof *out);
    double l = d->l, lq = iut_log_q(d), dm = d->dmod ? d->dmod : 1;
    unsigned e_mod = 1; for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].e_mod > e_mod) e_mod = d->V[i].e_mod;
    double estar_l = 4096.0 * 27.0 * 5.0 * e_mod * l;
    out->lstar_mod = log(estar_l);
    out->abs_logq = lq / (2.0 * l);
    double cD = (l + 5.0) / 4.0, cQ = (l + 1.0) / 24.0, cI = (l + 5.0) * out->lstar_mod;
    /* the primes to list: 2, 3, 5, l, then every nonarchimedean member of V */
    unsigned ps[IUT_MAX_V + 6], np = 0;
    unsigned fixed[] = { 2, 3, 5, d->l };
    for (unsigned k = 0; k < 4; ++k) { int seen = 0; for (unsigned q = 0; q < np; ++q) if (ps[q] == fixed[k]) seen = 1; if (!seen && fixed[k]) ps[np++] = fixed[k]; }
    for (unsigned i = 0; i < d->nV; ++i) {
        if (d->V[i].kind != IUT_V_NONARCH) continue;
        int seen = 0; for (unsigned q = 0; q < np; ++q) if (ps[q] == d->V[i].p) seen = 1;
        if (!seen && np < IUT_MAX_V + 4) ps[np++] = d->V[i].p;
    }
    for (unsigned a = 0; a + 1 < np; ++a) for (unsigned b = a + 1; b < np; ++b) if (ps[b] < ps[a]) { unsigned t = ps[a]; ps[a] = ps[b]; ps[b] = t; }
    double sumD = 0, sumS = 0, sumI = 0;
    for (unsigned k = 0; k < np; ++k) {
        iut_hull_row *R = &out->row[out->nrows++];
        unsigned p = ps[k]; double lp = log((double)p);
        R->p = p;
        int small = (p == 2 || p == 3 || p == 5), isl = (p == d->l), inq = 0, badmult = 0;
        double lqv = 0, lfv = 0;
        for (unsigned i = 0; i < d->nV; ++i) {
            const iut_valuation *v = &d->V[i];
            if (v->kind != IUT_V_NONARCH || v->p != p) continue;
            if (v->red == IUT_RED_BAD_MULT) badmult = 1;
            if (v->in_Vbad_mod) { inq = 1; lqv += (double)v->ordq * (v->f_mod ? v->f_mod : 1) * lp / dm; lfv += (double)(v->f_mod ? v->f_mod : 1) * lp / dm; }
        }
        if (!small && !isl && !inq) { R->kind = 1; R->why = "unramified in K"; R->logdK_src = "Prop 1.4 (iv)"; continue; }   /* Step (vi): 0 */
        R->kind = 0; R->logq = lqv; R->logs = lp;
        R->iota = (double)p <= estar_l;
        double D = lfv;                                   /* tame part at Supp(q): ≤ log f^Ftpd_vQ */
        if (p == 2)      { D += 11.0 * lp; if (badmult) D += lp; R->logdK_src = badmult ? "Step (ii): 11 log 2, + log 2 (tame, bad over 2)" : "Step (ii): 11 log 2"; }
        else if (p == 3) { D += 3.0 * lp; R->logdK_src = inq ? "Step (ii): 3 log 3 + log f" : "Step (ii): 3 log 3"; }
        else if (p == 5) { D += 2.0 * lp; R->logdK_src = inq ? "Step (ii): 2 log 5 + log f" : "Step (ii): 2 log 5"; }
        else if (isl)    { D += 2.0 * lp; if (badmult) D += lp; R->logdK_src = "Step (ii): 2 log l"; }
        else             R->logdK_src = "Prop 1.3 (i): tame, ≤ log f";
        if (isl && small) D += 2.0 * lp;                  /* l = 5 (outside Thm 1.10): both contributions */
        R->why = small && inq ? "p | 2·3·5, Supp(q)" : small ? "p | 2·3·5" : isl ? "p = l" : "Supp(q)";
        R->logdK = D;
        R->bound = cD * D - cQ * lqv + lp + cI * R->iota;
        sumD += D; sumS += lp; sumI += R->iota;
    }
    /* the archimedean prime */
    { iut_hull_row *R = &out->row[out->nrows++]; R->p = 0; R->kind = 2; R->why = "archimedean"; R->logdK_src = "Prop 1.5 (iii), (iv)"; R->bound = cD * log(M_PI); }
    /* the different of F_tpd: only its total log(d^Ftpd) is in the data model, not its support */
    IUT_GAP("DifferentSupport");
    out->unlocalized_logd = cD * d->logdF;
    out->complete = !(d->logdF > 0);
    double B = out->unlocalized_logd;
    for (unsigned k = 0; k < out->nrows; ++k) B += out->row[k].bound;
    out->total = B;
    /* the same bound before the average over j: Σ_vQ [(j+1) D − (j²/2l) log q_vQ + log s^Q + 4(j+1) l*_mod ι] + (j+1) log π */
    double avg = 0;
    for (unsigned j = 1; j <= d->lstar && j < IUT_MAX_LPM; ++j) {
        out->per_j[j] = (j + 1.0) * (sumD + d->logdF) - ((double)j * j / (2.0 * l)) * lq + sumS + 4.0 * (j + 1.0) * out->lstar_mod * sumI + (j + 1.0) * log(M_PI);
        avg += out->per_j[j];
    }
    (void)avg;   /* avg / l* = B: asserted in the self-test, (E1) and (E2) */
    out->C_theta_local = out->abs_logq > 0 ? B / out->abs_logq : INFINITY;
    out->C_theta_formula = iut_C_theta(d, d->logdF, iut_log_cond_bad(d));
    out->below_formula = out->C_theta_local <= out->C_theta_formula;
    out->consequence_holds = B >= -out->abs_logq;
}

/* ----------------------------------------------- Cor 2.2, proof: the choice of l */
unsigned iut_choose_l(const iut_initial_theta_data *d, int *in_window)
{
    /* [IUTchIV] Cor 2.2, proof: with h = log(q∀) and δ = 2^12·3^3·5·d, there is a prime l with
     *   (P1) h^{1/2} ≤ l ≤ 10δ·h^{1/2}·log(2δh),  (P2) l divides no nonzero local height h_v = ord_v(q_v),
     *   (P3) if l = p_v for a bad v, then h_v < h^{1/2}.
     * Thm 1.10 adds l ≥ 7 (E[5] ⊆ E(F)).  The toolkit also needs l ≤ IUT_MAX_L, and a V^bad_mod that stays
     * nonempty once the places over l are taken out.  The smallest such prime is returned (0: none in reach). */
    double h = iut_log_q_all(d), delta = 4096.0 * 27.0 * 5.0 * (d->dmod ? d->dmod : 1);
    if (h < 1) h = 1;
    double lo = sqrt(h), hi = 10.0 * delta * sqrt(h) * log(2.0 * delta * h);
    if (in_window) *in_window = 0;
    for (unsigned l = 7; l <= IUT_MAX_L; ++l) {
        if (!iut_is_prime(l) || (double)l < lo || (double)l > hi) continue;
        int ok = 1, nbad = 0;
        for (unsigned i = 0; i < d->nV; ++i) {
            const iut_valuation *v = &d->V[i];
            if (v->kind != IUT_V_NONARCH || v->red != IUT_RED_BAD_MULT) continue;
            if (v->ordq && v->ordq % l == 0) ok = 0;                                 /* (P2) */
            if (v->p == l && !((double)v->ordq < lo)) ok = 0;                        /* (P3) */
            if (v->p % 2 == 1 && v->p != l) nbad++;
        }
        if (ok && nbad) { if (in_window) *in_window = 1; return l; }
    }
    return 0;
}

/* ------------------------------------------------- Prop 2.1, Cor 2.2, Cor 2.3 */
int    iut_iv_log_le_x(double x) { return x > 0 && log(x) <= x; }
double iut_iv_chebyshev_lo(double x) { return 2.0 * x / 3.0; }
double iut_iv_chebyshev_hi(double x) { return 4.0 * x / 3.0; }
double iut_iv_prime_in_A_bound(double thetaA, double xi_prm) { return 2.0 * (thetaA + xi_prm); }
void iut_cor22_compute(const iut_initial_theta_data *d, iut_cor22 *out)
{
    /* [IUTchIV] Cor 2.2: for a point of the λ-line of degree d over Q with Frey/Legendre curve E:
     *  δ = 2^12·3^3·5·d;  (C1) there is a prime l with (log q∀)^{1/2} ≤ l ≤ 10δ(log q∀)^{1/2} log(2δ log q∀);
     *  (C2) (1/6) log q ≤ (1+ε_E)(log-diff + log-cond) + C_K, ε_E = (60δ)² log(2δ log q∀)/(log q∀)^{1/2};
     *  log-diff = log d^Ftpd, log f^Ftpd ≤ log-cond ≤ log f^Ftpd + log(2l);  (1/6) log q ≈ ht_∞ ≈ ht_ω(D). */
    IUT_GAP("InexplicitConstants");   /* η_prm, ξ_prm, C_K, Exc: see the entry */
    memset(out, 0, sizeof *out);
    out->d = d->dmod; out->delta = 4096.0 * 27.0 * 5.0 * out->d;
    out->logq_all = iut_log_q_all(d);   /* q∀: every bad multiplicative v, 2 included */
    double lq = out->logq_all > 1 ? out->logq_all : 1.0;
    out->l_min = sqrt(lq);
    out->l_max = 10.0 * out->delta * sqrt(lq) * log(2.0 * out->delta * lq);
    out->l_in_range = d->l >= out->l_min && d->l <= out->l_max;
    out->eps_E = (60.0 * out->delta) * (60.0 * out->delta) * log(2.0 * out->delta * lq) / sqrt(lq);
    out->logdiff = d->logdF;
    out->logcond_lo = iut_log_cond_bad(d); out->logcond_hi = out->logcond_lo + log(2.0 * d->l);   /* log f^Ftpd ≤ log-cond ≤ log f^Ftpd + log(2l) */
    out->C_K = 20.0 * (4096.0 * 27.0 * 5.0 * d->l + IUT_ETA_PRM_VALUE);   /* the constant swallowed into C_K: 20(e*_mod l + η_prm) with e_mod = 1 */
    out->lhs = out->logq_all / 6.0;
    out->rhs = (1.0 + out->eps_E) * (out->logdiff + out->logcond_lo) + out->C_K;
    out->holds = out->lhs <= out->rhs;
    /* Cor 2.2 is a statement about the points outside a finite exceptional set Exc.  Two of the conditions that
     * put a point INTO Exc are explicit in the proof (Step (i)–(ii); Yamashita Prop 1.15, (s1) and the last
     * enlargement): (log q∀)^{1/2} < ξ_prm + η_prm, and ε_E > min{1, ε}.  A curve failing either is in Exc for
     * every ε, and (C2) then holds only through the constant C_K. */
    out->sqrt_h = sqrt(lq); out->s1_threshold = 5.0 + IUT_ETA_PRM_VALUE;
    out->eps_small = out->eps_E <= 1.0; out->s1_ok = out->sqrt_h >= out->s1_threshold;
    out->in_exceptional_set = !(out->eps_small && out->s1_ok);
}
double iut_cor23_bound(double ht, double logdiff, double logcond, double eps, double C) { IUT_GAP("ReductionToGeneralPosition"); return (1.0 + eps) * (logdiff + logcond) + C - ht; }

/* ------------------------------------------------------------------ §3 */
int iut_species_find(const char *id) { for (size_t i = 0; i < iut_species_count; ++i) if (!strcmp(iut_species_table[i].id, id)) return (int)i; return -1; }
int iut_mutation_find(const char *id) { for (size_t i = 0; i < iut_mutation_count; ++i) if (!strcmp(iut_mutation_table[i].id, id)) return (int)i; return -1; }
int iut_mutation_compose(const iut_mutation *f, const iut_mutation *g, iut_mutation *out)
{
    /* [IUTchIV] Def 3.3 (i): mutations compose (as species-theoretic functors) when cod(f) = dom(g);
     * the composite is a core iff both are (observables all of whose mutations are isomorphisms). */
    static char idbuf[128], namebuf[160];
    if (strcmp(f->cod, g->dom)) return 1;
    snprintf(idbuf, sizeof idbuf, "%sThen%s", f->id, g->id);
    snprintf(namebuf, sizeof namebuf, "%s ∘ %s", g->name, f->name);
    memset(out, 0, sizeof *out);
    out->id = idbuf; out->name = namebuf; out->dom = f->dom; out->cod = g->cod; out->ref = "[IUTchIV] Def 3.3 (i)"; out->is_core = f->is_core && g->is_core;
    return 0;
}
void iut_mutation_identity(const iut_species *s, iut_mutation *out)
{ memset(out, 0, sizeof *out); out->id = "Identity"; out->name = "identity mutation"; out->dom = out->cod = s->id; out->ref = "[IUTchIV] Def 3.1 (ii) (identities)"; out->is_core = 1; }
int iut_species_isomorphic(const iut_species *a, const iut_species *b)
{ return !strcmp(a->species_data, b->species_data); }  /* Def 3.1 (iv): species-isomorphism = the same set-theoretic formulas (model-free) */
void iut_mutation_history_from_lattice(const iut_log_theta_lattice *lat, iut_mutation_history *out)
{
    /* [IUTchIV] Def 3.3 (iii), Rem 3.3.1: the log-theta-lattice is a mutation-history: vertices =
     * the species "Θ±ell NF-Hodge theater" (one per •), edges = the mutations log-link / Θ-link. */
    memset(out, 0, sizeof *out);
    for (int n = -IUT_LAT_NOFF; n <= IUT_LAT_NOFF; ++n) for (int m = -IUT_LAT_MOFF; m <= IUT_LAT_MOFF; ++m)
        if (lat->ht[n + IUT_LAT_NOFF][m + IUT_LAT_MOFF]) out->vertex[out->nvertices++] = "ThetaPmEllNFHodgeTheater";
    for (unsigned k = 0; k < lat->nlinks && out->nedges < sizeof out->edge / sizeof out->edge[0]; ++k) out->edge[out->nedges++] = iut_link_kind_id(lat->links[k].kind);
}
int iut_observable_is_core(const char *species_id)
{
    /* Def 3.3 (v): the coric species of the lattice: D⊢ (mono-analytic étale core), the D-HT down a column,
     * F⊢×μ along a row, mono-analytic log-shells, D⊩(D⊢) — cf. [IUTchIII] Thm 1.5. */
    static const char *cores[] = { "DMonoPrimeStrip", "DThetaPmEllNFHodgeTheater", "FMonoUnitsModTorsPrimeStrip", "LogShell" };
    for (size_t i = 0; i < sizeof cores / sizeof cores[0]; ++i) if (!strcmp(cores[i], species_id)) return 1;
    for (size_t k = 0; k < iut_mutation_count; ++k) if (iut_mutation_table[k].is_core && !strcmp(iut_mutation_table[k].cod, species_id)) return 1;
    return 0;
}
