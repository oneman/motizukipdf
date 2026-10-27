/*
 * iut_core.c — rationals, generators, validators, prime-strips, Hodge
 * theaters, pilots, log-shells and the arithmetic of the log-volume estimate.
 *
 * Numerical conventions (see docs/DATA_MODEL.md):
 *   - valuations of elements of the value-group monoids are measured in units
 *     of ord_v(q̲_v), where q̲_v = q_v^{1/2l}  ([IUTchI] Ex. 3.2 (iv)); hence
 *     ord(q_v) = 2l, ord(q̲_v^{j²}) = j².
 *   - "normalized degrees" log(q), log(d^K), log(f^K) are as in
 *     [IUTchIV] Thm 1.10: deg of the arithmetic divisor divided by the degree
 *     of the field, so they do not depend on the field F ⊆ K chosen.
 *   - |log(q)| = log(q)/(2l)                      ([IUTchIV] Thm 1.10)
 *   - C_Θ = (l+1)/(4|log q|) · { (1 + 12 d_mod/l)(log d^{Ftpd} + log f^{Ftpd})
 *             + 10 (e*_mod l + η_prm) − (1/6)(1 − 12/l²) log q } − 1
 *                                                 ([IUTchIV] Thm 1.10)
 *     with e*_mod = 2^12·3^3·5·e_mod and η_prm = 5·10^20 ([ExpEst] Prop 1.?).
 *   - leading term of the procession log-volume ([Alien] §3.7 (iv)):
 *       Σ_{j=1}^{l*} [(j+1) log d^K − (j²/2l) log q] ≈ (l²/48)(6 log d^K − log q)
 */
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include "iut.h"

/* ------------------------------------------------------------- rationals */
static long gcdl(long a, long b) { if (a < 0) a = -a; if (b < 0) b = -b; while (b) { long t = a % b; a = b; b = t; } return a ? a : 1; }
iut_q iut_q_make(long num, long den)
{
    iut_q r; if (den == 0) den = 1; if (den < 0) { num = -num; den = -den; }
    long g = gcdl(num, den); r.num = num / g; r.den = den / g; return r;
}
iut_q iut_q_add(iut_q a, iut_q b) { return iut_q_make(a.num * b.den + b.num * a.den, a.den * b.den); }
iut_q iut_q_mul(iut_q a, iut_q b) { return iut_q_make(a.num * b.num, a.den * b.den); }
int   iut_q_cmp(iut_q a, iut_q b) { long l = a.num * b.den, r = b.num * a.den; return (l > r) - (l < r); }
double iut_q_todouble(iut_q a) { return (double)a.num / (double)a.den; }
void  iut_q_fmt(iut_q a, char *buf, size_t n)
{
    if (a.den == 1) snprintf(buf, n, "%ld", a.num); else snprintf(buf, n, "%ld/%ld", a.num, a.den);
}

/* ------------------------------------------------------------- reports   */
void iut_report_add(iut_report *r, iut_severity s, const char *cond, const char *ref, const char *fmt, ...)
{
    if (!r || r->n >= IUT_MAX_ISSUES) return;
    iut_issue *is = &r->issue[r->n++];
    is->sev = s;
    snprintf(is->condition, sizeof is->condition, "%s", cond ? cond : "");
    snprintf(is->ref, sizeof is->ref, "%s", ref ? ref : "");
    va_list ap; va_start(ap, fmt); vsnprintf(is->msg, sizeof is->msg, fmt, ap); va_end(ap);
    if (s == IUT_SEV_ERROR) r->errors++; else if (s == IUT_SEV_WARN) r->warnings++;
}

/* ------------------------------------------------------------- utility   */
int iut_is_prime(unsigned n)
{
    if (n < 2) return 0;
    for (unsigned d = 2; d * d <= n; ++d) if (n % d == 0) return 0;
    return 1;
}
unsigned long long iut_factorial(unsigned n) { unsigned long long f = 1; while (n > 1) f *= n--; return f; }

/* ------------------------------------------------------------- labels    */
int iut_label_in_Fl(const iut_initial_theta_data *d, int t)     { return t >= -(int)d->lstar && t <= (int)d->lstar; }
int iut_label_in_FlAbs(const iut_initial_theta_data *d, int j)  { return j >= 0 && j <= (int)d->lstar; }
int iut_label_in_FlStar(const iut_initial_theta_data *d, int j) { return j >= 1 && j <= (int)d->lstar; }

/* F_l^{⋊±} = F_l ⋊ {±1}:  t ↦ ±t + a  (then reduced to the representative in F_l) */
int iut_sym_FlSemiPm_act(const iut_initial_theta_data *d, int a, int sign, int t)
{
    int l = (int)d->l, r = ((sign < 0 ? -t : t) + a) % l;
    if (r < 0) r += l;
    if (r > (int)d->lstar) r -= l;
    return r;
}
/* F_l^* = F_l^×/{±1} acting on F_l^* = {1..l*}:  j ↦ |u·j| */
int iut_sym_FlStar_act(const iut_initial_theta_data *d, int u, int j)
{
    int l = (int)d->l, r = (u * j) % l;
    if (r < 0) r += l;
    if (r > (int)d->lstar) r = l - r;
    return r;
}

/* ------------------------------------------------------------- arithmetic */
static const double IUT_ETA_PRM = 5e20;                 /* [ExpEst] §1: η_prm = 5·10^20 */
static double estar_mod(unsigned e_mod) { return 4096.0 * 27.0 * 5.0 * (double)(e_mod ? e_mod : 1); }

double iut_log_q(const iut_initial_theta_data *d)
{
    /* log(q) = deg(q-divisor)/[Fmod:Q] = Σ_v ord_v(q_v) f_v log(p_v) / d_mod, over V^bad (odd) ∪ {2 if bad} */
    double s = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind != IUT_V_NONARCH || v->red != IUT_RED_BAD_MULT) continue;
        s += (double)v->ordq * (double)(v->f_mod ? v->f_mod : 1) * log((double)v->p);
    }
    return s / (double)(d->dmod ? d->dmod : 1);
}
double iut_log_cond(const iut_initial_theta_data *d)
{
    double s = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind != IUT_V_NONARCH || v->red == IUT_RED_GOOD) continue;
        s += (double)(v->f_mod ? v->f_mod : 1) * log((double)v->p);
    }
    return s / (double)(d->dmod ? d->dmod : 1);
}
double iut_height_from_q(const iut_initial_theta_data *d) { return iut_log_q(d) / 6.0; }

/* μ_log(I_v) for I_v = (p*)^{-1} log(O×_{K_v}):  [IUTchIV] Prop 1.4 (ii):
 *   μ_log(log_p(R×)) = −(1/e + m/(e f)) log p,   then + log(p*)  for the (p*)^{-1}. */
double iut_log_shell_volume(const iut_valuation *v, unsigned dK)
{
    (void)dK;
    if (v->kind == IUT_V_ARCH) return 0.0;             /* I_v = closed disc of radius π: normalized 0 in our model */
    double p = (double)v->p, e = v->e_K ? v->e_K : 1, f = v->f_K ? v->f_K : 1;
    double m = (v->p == 2) ? 1.0 : 0.0;                 /* ±1 ∈ μ_2 always; other p-torsion ignored */
    double kstar = (v->p == 2) ? 2.0 : 1.0;             /* p* = p^kstar */
    return -(1.0 / e + m / (e * f)) * log(p) + kstar * log(p);
}

double iut_C_theta(const iut_initial_theta_data *d, double logd_tpd, double logf_tpd)
{
    double l = d->l, logq = iut_log_q(d);
    if (logq <= 0) return INFINITY;
    double abslogq = logq / (2.0 * l);
    unsigned e_mod = 1;
    for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].e_mod > e_mod) e_mod = d->V[i].e_mod;
    double A = (1.0 + 12.0 * d->dmod / l) * (logd_tpd + logf_tpd)
             + 10.0 * (estar_mod(e_mod) * l + IUT_ETA_PRM)
             - (1.0 / 6.0) * (1.0 - 12.0 / (l * l)) * logq;
    return (l + 1.0) / (4.0 * abslogq) * A - 1.0;
}

double iut_leading_term(const iut_initial_theta_data *d)
{
    double l = d->l;
    return l * l / 48.0 * (6.0 * d->logdK - iut_log_q(d));
}

/* ------------------------------------------------------------- finishing */
void iut_data_finish(iut_initial_theta_data *d)
{
    d->lstar = d->l ? (d->l - 1) / 2 : 0;
    d->lpm   = d->l ? (d->l + 1) / 2 : 0;
    if (!d->dmod) d->dmod = 1;
    if (d->dF < d->dmod) d->dF = d->dmod;
    if (d->dK < d->dF)   d->dK = d->dF;
    for (unsigned i = 0; i < d->nV; ++i) {
        iut_valuation *v = &d->V[i];
        if (!v->e_mod) v->e_mod = 1;
        if (!v->f_mod) v->f_mod = 1;
        if (!v->e_K)   v->e_K = v->e_mod;
        if (!v->f_K)   v->f_K = v->f_mod;
        v->in_Vbad_mod = (v->kind == IUT_V_NONARCH && v->red == IUT_RED_BAD_MULT && v->p % 2 == 1);
        if (v->red != IUT_RED_BAD_MULT) v->ordq = 0;
    }
}

/* ------------------------------------------------------------- generators */
static unsigned ordp(long long n, unsigned p) { unsigned k = 0; if (n < 0) n = -n; while (n && n % p == 0) { n /= p; ++k; } return k; }

static void add_val(iut_initial_theta_data *d, unsigned p, iut_reduction red, unsigned ordq)
{
    if (d->nV >= IUT_MAX_V) return;
    iut_valuation *v = &d->V[d->nV++];
    memset(v, 0, sizeof *v);
    if (p == 0) { snprintf(v->name, sizeof v->name, "vinf"); v->kind = IUT_V_ARCH; return; }
    snprintf(v->name, sizeof v->name, "v%u", p);
    v->kind = IUT_V_NONARCH; v->p = p; v->red = red; v->ordq = ordq;
    v->e_mod = v->f_mod = 1;
    /* K = F(E[l]) with the local degrees we can honestly say little about: */
    v->e_K = (red == IUT_RED_BAD_MULT) ? 1 : 1;
    v->f_K = 1;
}

int iut_gen_from_abc(iut_initial_theta_data *d, long long a, long long b, long long c, unsigned l)
{
    memset(d, 0, sizeof *d);
    if (a <= 0 || b <= 0 || c <= 0 || a + b != c) return -1;
    if (gcdl(a, b) != 1 || gcdl(a, c) != 1) return -2;
    if (!iut_is_prime(l) || l < 5 || l > IUT_MAX_L) return -3;
    snprintf(d->name, sizeof d->name, "abc(%lld,%lld,%lld) l=%u", a, b, c, l);
    snprintf(d->curve, sizeof d->curve, "Frey y^2=x(x-%lld)(x+%lld)", a, b);
    d->dmod = 1;                 /* F_mod = Q(j) = Q (j ∈ Q) */
    d->l = l;
    /* Frey curve has full rational 2-torsion, so F_tpd = Q.  F ⊇ Q(√-1, E[2·3·5]). */
    d->dF = 2 * 6 * 48 * 480;    /* upper bound: 2·|GL2(F2)|·|GL2(F3)|·|GL2(F5)|, [IUTchIV] (E3)-(E5) */
    d->dK = d->dF * (unsigned long long)l * (l + 1) * (l - 1) * (l - 1); /* × |GL2(F_l)|, [IUTchIV] (E3) */
    d->epsilon = 0;
    /* bad primes: p | abc.  Δ = 16 (abc)²; for odd p, ord_p(j) = −2 ord_p(abc). */
    long long n = a * b * c;
    unsigned p = 2;
    double logq2 = 0, logf = 0, logq = 0;
    for (long long m = n; m > 1 && d->nV < IUT_MAX_V - 4; ) {
        while (p <= 3037000 && m % p) ++p;
        if (m % p) { /* leftover prime factor larger than our trial bound */
            p = (unsigned)m;
        }
        unsigned k = ordp(n, p);
        while (m % p == 0) m /= p;
        if (p == 2) {
            /* minimal model: Δ_min = 2^{-8}(abc)² when 16 | abc (after permuting/signing a,b,c) */
            if (k > 4)       { add_val(d, 2, IUT_RED_BAD_MULT, 2 * k - 8); logq2 = (2.0 * k - 8) * log(2.0); logf += log(2.0); }
            else if (k == 4) { add_val(d, 2, IUT_RED_GOOD, 0); /* Δ_min = 2^{-8}(abc)² is odd: good reduction at 2 */ }
            else             { add_val(d, 2, IUT_RED_BAD_ADD, 0); logf += log(2.0); }
        } else {
            add_val(d, p, IUT_RED_BAD_MULT, 2 * k);
            logq += 2.0 * k * log((double)p);
            logf += log((double)p);
        }
    }
    logq += logq2;
    /* a few good primes so the prime-strips have V^good members too */
    unsigned extras[] = { 3, 5, l };
    for (unsigned i = 0; i < 3; ++i) {
        int seen = 0;
        for (unsigned k = 0; k < d->nV; ++k) if (d->V[k].p == extras[i]) seen = 1;
        if (!seen) add_val(d, extras[i], IUT_RED_GOOD, 0);
    }
    add_val(d, 0, IUT_RED_GOOD, 0); /* the archimedean place */
    /* heights / differents */
    d->j_log_height = log((double)(a * a + a * b + b * b)) * 3.0 + 8.0 * log(2.0) - 2.0 * log((double)n);
    if (d->j_log_height < 0) d->j_log_height = -d->j_log_height;
    d->logdF = 0.0;              /* d^{F_tpd} = 1 since F_tpd = Q; we track the tripodal field */
    /* log(d^K) estimate: tame ramification at bad primes ≤ log p each, at l ≤ 2 log l  */
    d->logdK = logf + 2.0 * log((double)l);
    d->h_F_galois_over_Fmod = 1; d->h_F_contains_six_torsion = 1;
    d->h_image_contains_SL2 = 1; /* asserted: true for all but finitely many l by Serre, cannot be checked here */
    d->h_stable_reduction = 1;   /* true at odd primes for Frey curves; at 2 see IUT_RED_BAD_ADD */
    d->h_CK_is_K_core = 1;       /* asserted: fails only for CM / Shimura-type curves */
    iut_data_finish(d);
    return 0;
}

static unsigned long long rng_state;
static unsigned rnd(unsigned n) { rng_state = rng_state * 6364136223846793005ULL + 1442695040888963407ULL; return (unsigned)((rng_state >> 33) % (n ? n : 1)); }

int iut_gen_random(iut_initial_theta_data *d, unsigned seed)
{
    static const unsigned ls[] = { 7, 11, 13, 17, 19, 23 };
    rng_state = seed * 2654435761ULL + 12345;
    if (seed % 2 == 0) {
        /* random coprime abc triple with 16 | one of them, then the Frey curve */
        for (int tries = 0; tries < 100; ++tries) {
            long long a = 1 + 2 * rnd(60), b = 16 * (1 + rnd(40));
            if (a % 4 != 3) a += 2;
            if (gcdl(a, b) != 1) continue;
            unsigned l = ls[rnd(6)];
            if (iut_gen_from_abc(d, a, b, a + b, l) == 0) {
                snprintf(d->name, sizeof d->name, "random#%u abc(%lld,%lld,%lld) l=%u", seed, a, b, a + b, l);
                return 0;
            }
        }
        return -1;
    }
    /* synthetic: a number field F_mod of degree 1..3 with made-up valuations */
    memset(d, 0, sizeof *d);
    d->dmod = 1 + rnd(3);
    d->l = ls[rnd(6)];
    snprintf(d->name, sizeof d->name, "random#%u synthetic dmod=%u l=%u", seed, d->dmod, d->l);
    snprintf(d->curve, sizeof d->curve, "E over F_mod of degree %u", d->dmod);
    unsigned nbad = 1 + rnd(4);
    static const unsigned ps[] = { 3, 5, 7, 11, 13, 17, 19, 23, 29, 31 };
    unsigned used[10] = { 0 };
    for (unsigned i = 0; i < nbad; ++i) {
        unsigned k, oq; do { k = rnd(10); } while (used[k] || ps[k] == d->l); used[k] = 1;   /* [IUTchI] Def 3.1 (c): l prime to p_v … */
        do { oq = 1 + rnd(6); } while (oq % d->l == 0);                                   /* … and to ord(q_v) on V^bad_mod */
        add_val(d, ps[k], IUT_RED_BAD_MULT, oq);
        d->V[d->nV - 1].e_mod = 1 + rnd(d->dmod); d->V[d->nV - 1].f_mod = 1;
        if (d->V[d->nV - 1].e_K < d->V[d->nV - 1].e_mod) d->V[d->nV - 1].e_K = d->V[d->nV - 1].e_mod;   /* K_v ⊇ (F_mod)_v */
    }
    for (unsigned k = 0; k < 10 && d->nV < 8; ++k) if (!used[k]) { add_val(d, ps[k], IUT_RED_GOOD, 0); used[k] = 1; }
    { iut_reduction red2 = rnd(2) ? IUT_RED_GOOD : IUT_RED_BAD_MULT; unsigned oq2 = 2 + 2 * rnd(3);   /* sequenced: argument evaluation order is unspecified in C */
      add_val(d, 2, red2, oq2); }
    add_val(d, 0, IUT_RED_GOOD, 0);
    d->dF = (unsigned long long)d->dmod * 2 * 6 * 48; d->dK = d->dF * (unsigned long long)d->l * (d->l + 1) * (d->l - 1) * (d->l - 1);
    d->logdF = 0.5 + 0.1 * rnd(40);
    d->logdK = d->logdF + iut_log_cond(d) + 2.0 * log((double)d->l);
    d->epsilon = rnd(2);
    d->h_F_galois_over_Fmod = d->h_F_contains_six_torsion = d->h_image_contains_SL2 = d->h_stable_reduction = d->h_CK_is_K_core = 1;
    iut_data_finish(d);
    return 0;
}

int iut_gen_example(iut_initial_theta_data *d, int which)
{
    switch (which) {
    case 0:  return iut_gen_from_abc(d, 1, 8, 9, 7);          /* 1 + 2^3 = 3^2 */
    case 1:  return iut_gen_from_abc(d, 3, 125, 128, 11);     /* 3 + 5^3 = 2^7 */
    case 2:  return iut_gen_from_abc(d, 1, 2400, 2401, 13);   /* 1 + 2^5·3·5^2 = 7^4  (rad = 210) */
    case 3:  return iut_gen_from_abc(d, 5, 27, 32, 7);        /* 5 + 3^3 = 2^5 */
    case 4:  return iut_gen_from_abc(d, 1, 80, 81, 7);        /* 1 + 2^4·5 = 3^4: 2^4 ∥ abc ⇒ good reduction at 2 */
    case 5:  return iut_gen_random(d, 1);                     /* synthetic, dmod > 1 possible */
    default: return -1;
    }
}

/* ------------------------------------------------------------- validators */
int iut_validate_data(const iut_initial_theta_data *d, iut_report *r)
{
    unsigned before = r->errors;
    /* l */
    if (!iut_is_prime(d->l) || d->l < 5)
        iut_report_add(r, IUT_SEV_ERROR, "LPrime", "[IUTchI] Def 3.1 (c)", "l = %u must be a prime ≥ 5", d->l);
    else
        iut_report_add(r, IUT_SEV_OK, "LPrime", "[IUTchI] Def 3.1 (c)", "l = %u prime, l* = %u, l± = %u", d->l, d->lstar, d->lpm);
    if (d->l > IUT_MAX_L)
        iut_report_add(r, IUT_SEV_ERROR, "LPrime", "iut.h", "l = %u exceeds IUT_MAX_L = %d", d->l, IUT_MAX_L);
    if (d->lstar != (d->l - 1) / 2 || d->lpm != (d->l + 1) / 2)
        iut_report_add(r, IUT_SEV_ERROR, "LStar", "[IUTchI] §0", "l*, l± inconsistent with l");
    if (d->l == 5)
        iut_report_add(r, IUT_SEV_WARN, "LPrime", "[IUTchIV] Thm 1.10", "l = 5 is excluded in the explicit estimate of Thm 1.10 (F ⊇ Q(E[5]) ⇒ l ≠ 5)");
    /* fields */
    if (d->dmod == 0 || d->dF % d->dmod || d->dK % d->dF)
        iut_report_add(r, IUT_SEV_ERROR, "Fmod", "[IUTchI] Def 3.1", "degrees must satisfy dmod | dF | dK (got %u,%llu,%llu)", d->dmod, d->dF, d->dK);
    else
        iut_report_add(r, IUT_SEV_OK, "Fmod", "[IUTchI] Def 3.1", "F_mod ⊆ F ⊆ K with [F_mod:Q]=%u, [F:Q]≤%llu, [K:Q]≤%llu", d->dmod, d->dF, d->dK);
    if (d->l && (d->dF / (d->dmod ? d->dmod : 1)) % d->l == 0)
        iut_report_add(r, IUT_SEV_ERROR, "FBarOverF", "[IUTchI] Def 3.1 (a)", "[F:F_mod] must be prime to l");
    /* V ≅ V_mod */
    unsigned narc = 0, nbad = 0, nbad_odd = 0, nbad_even = 0, nadd = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        for (unsigned k = 0; k < i; ++k)
            if (v->kind == d->V[k].kind && v->p == d->V[k].p)
                iut_report_add(r, IUT_SEV_ERROR, "VSet", "[IUTchI] Def 3.1 (e)", "V → V_mod must be a bijection: %s duplicated", v->name);
        if (v->kind == IUT_V_ARCH) { narc++; continue; }
        if (!iut_is_prime(v->p))
            iut_report_add(r, IUT_SEV_ERROR, "VNon", "[IUTchI] Def 3.1", "%s: residue characteristic %u is not prime", v->name, v->p);
        if (v->red == IUT_RED_BAD_MULT) {
            nbad++;
            if (v->p % 2) nbad_odd++; else nbad_even++;
            if (v->ordq == 0)
                iut_report_add(r, IUT_SEV_ERROR, "QUnderV", "[IUTchI] Ex 3.2", "%s: bad multiplicative reduction needs ord(q_v) > 0", v->name);
            if (v->in_Vbad_mod && v->p % 2 == 0)
                iut_report_add(r, IUT_SEV_ERROR, "VBadMod", "[IUTchI] Def 3.1 (e)", "%s: V^bad_mod consists of ODD residue characteristic", v->name);
            if (v->in_Vbad_mod && v->p == d->l)
                iut_report_add(r, IUT_SEV_ERROR, "VBadMod", "[IUTchI] Def 3.1 (c)", "%s: l must be prime to the residue characteristics of V^bad_mod", v->name);
            if (d->l && v->ordq % d->l == 0)
                iut_report_add(r, IUT_SEV_WARN, "QUnderV", "[IUTchI] Def 3.1; [IUTchIV] Prop 1.8 (vii)", "%s: l | ord(q_v) = %u (l-torsion then unramified at v; SL2 condition fragile)", v->name, v->ordq);
        }
        if (v->red == IUT_RED_BAD_ADD) nadd++;
        if (v->e_K < v->e_mod || v->f_K < v->f_mod)
            iut_report_add(r, IUT_SEV_ERROR, "KField", "[IUTchI] Def 3.1", "%s: e_K,f_K must dominate e_mod,f_mod", v->name);
    }
    if (nbad_odd == 0)
        iut_report_add(r, IUT_SEV_ERROR, "VBadMod", "[IUTchI] Def 3.1 (e)", "V^bad_mod must be nonempty: no odd prime of bad multiplicative reduction");
    else
        iut_report_add(r, IUT_SEV_OK, "VBadMod", "[IUTchI] Def 3.1 (e)", "|V^bad_mod| = %u odd primes of bad multiplicative reduction%s", nbad_odd, nbad_even ? " (2 is bad but excluded from V^bad_mod)" : "");
    if (narc == 0)
        iut_report_add(r, IUT_SEV_WARN, "VArc", "[IUTchI] Def 3.1", "no archimedean valuation listed in V");
    if (nadd)
        iut_report_add(r, IUT_SEV_WARN, "VBad", "[IUTchI] Def 3.1 (b); [IUTchIV] Cor 2.2", "%u place(s) of additive reduction: stable reduction only after a finite extension (F_tpd / Legendre form)", nadd);
    /* asserted hypotheses */
    struct { int ok; const char *cond, *ref, *msg; } hs[] = {
        { d->h_F_galois_over_Fmod,     "FBarOverF", "[IUTchI] Def 3.1 (a)", "F Galois over F_mod of degree prime to l" },
        { d->h_F_contains_six_torsion, "FBarOverF", "[IUTchI] Def 3.1 (a)", "F contains the fields of definition of E[2·3]" },
        { d->h_image_contains_SL2,     "KField",    "[IUTchI] Def 3.1 (c)", "Im(Gal(K/F) → GL2(F_l)) ⊇ SL2(F_l)" },
        { d->h_stable_reduction,       "XF",        "[IUTchI] Def 3.1 (b)", "E_F has stable reduction at all nonarchimedean valuations of F" },
        { d->h_CK_is_K_core,           "CK",        "[IUTchI] Def 3.1 (d); [CanLift] Rem 2.1.1", "C_K is a K-core (no Shimura-curve coverings)" },
    };
    for (size_t i = 0; i < sizeof hs / sizeof hs[0]; ++i)
        iut_report_add(r, hs[i].ok ? IUT_SEV_INFO : IUT_SEV_ERROR, hs[i].cond, hs[i].ref, "%s: %s", hs[i].ok ? "asserted (not machine-checkable here)" : "NOT asserted", hs[i].msg);
    /* ε */
    if (d->epsilon != 0 && d->epsilon != 1)
        iut_report_add(r, IUT_SEV_ERROR, "EpsilonUnder", "[IUTchI] Def 3.1 (f)", "ε̲ must be one of the two admissible shifts (0/1)");
    return (int)(r->errors - before);
}

int iut_validate_prime_strip(const iut_prime_strip *ps, const iut_initial_theta_data *d, iut_report *r)
{
    unsigned before = r->errors;
    const char *id = iut_ps_kind_id(ps->kind);
    if ((unsigned)ps->kind >= IUT_PS_KIND_COUNT) { iut_report_add(r, IUT_SEV_ERROR, "DPrimeStrip", "[IUTchI] Fig I1.2", "unknown prime-strip kind"); return 1; }
    if (ps->nV != d->nV)
        iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 4.1", "%s '%s': indexed by V (|V| = %u) but has %u local data", iut_ps_kind_notation(ps->kind), ps->label, d->nV, ps->nV);
    int etale = iut_ps_kind_is_etale_like(ps->kind), mono = iut_ps_kind_is_mono_analytic(ps->kind);
    for (unsigned i = 0; i < ps->nV && i < d->nV; ++i) {
        const iut_local_datum *L = &ps->loc[i];
        if (!mono && !L->Pi_copy)  iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 4.1", "%s@%s: holomorphic strip needs Π_v", ps->label, d->V[i].name);
        if (mono && L->Pi_copy)    iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 4.1", "%s@%s: mono-analytic strip must NOT remember Π_v (only G_v)", ps->label, d->V[i].name);
        if (!L->G_copy)            iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 4.1", "%s@%s: G_v missing", ps->label, d->V[i].name);
        if (etale && L->units_copy) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 4.1", "%s@%s: étale-like strip carries no Frobenius-like monoid", ps->label, d->V[i].name);
        if (!etale && !L->units_copy) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 5.2", "%s@%s: Frobenius-like strip needs a monoid O", ps->label, d->V[i].name);
        switch (ps->kind) {
        case IUT_PS_FMonoUnitsModTors:
            if (!L->units_mod_tors || L->kummer_kind != 2) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Def 4.9 (i)", "%s@%s: F⊢×μ needs O×μ with a ×μ-Kummer structure (Ism-orbit)", ps->label, d->V[i].name);
            if (L->has_valgroup) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Def 4.9", "%s@%s: F⊢×μ has no value-group portion", ps->label, d->V[i].name);
            break;
        case IUT_PS_FMonoValUnitsModTors: case IUT_PS_FMonoGlobValUnitsModTors:
            if (!L->units_mod_tors || !L->has_valgroup) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchII] Def 4.9", "%s@%s: ▶×μ needs O▶ × O×μ", ps->label, d->V[i].name);
            break;
        case IUT_PS_FMono: case IUT_PS_FMonoGlob:
            if (!L->has_splitting) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 5.2 (ii)", "%s@%s: F⊢ strips are SPLIT Frobenioids", ps->label, d->V[i].name);
            break;
        default: break;
        }
        if (L->has_valgroup && d->V[i].kind == IUT_V_NONARCH && d->V[i].in_Vbad_mod && L->nval == 0)
            iut_report_add(r, IUT_SEV_WARN, id, "[IUTchI] Ex 3.2", "%s@%s: v ∈ V^bad but no q̲-generator recorded", ps->label, d->V[i].name);
        for (unsigned k = 0; k < L->nval; ++k)
            if (L->val[k].num <= 0) iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Ex 3.2", "%s@%s: value-group generator with non-positive valuation", ps->label, d->V[i].name);
    }
    if (iut_ps_kind_has_global(ps->kind) && !ps->has_global_realified)
        iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 5.2 (iv)", "%s: ⊩ strip needs the global realified Frobenioid C⊩", ps->label);
    if (!iut_ps_kind_has_global(ps->kind) && ps->has_global_realified)
        iut_report_add(r, IUT_SEV_ERROR, id, "[IUTchI] Def 5.2", "%s: only ⊩ strips carry C⊩", ps->label);
    if (ps->has_global_realified && ps->global_degree > 1e-9)
        iut_report_add(r, IUT_SEV_WARN, id, "[IUTchIII] Def 3.8", "%s: pilot object has positive arithmetic degree %.3f (expected ≤ 0)", ps->label, ps->global_degree);
    if (r->errors == before)
        iut_report_add(r, IUT_SEV_OK, id, "[IUTchI] Fig I1.2", "%s-prime-strip '%s' well-formed (%s, %s)", iut_ps_kind_notation(ps->kind), ps->label, etale ? "étale-like" : "Frobenius-like", mono ? "mono-analytic" : "holomorphic");
    return (int)(r->errors - before);
}

int iut_validate_hodge_theater(const iut_hodge_theater *ht, iut_report *r)
{
    unsigned before = r->errors;
    const iut_initial_theta_data *d = ht->data;
    if (!d) { iut_report_add(r, IUT_SEV_ERROR, "ThetaPmEllNFHodgeTheater", "[IUTchI] Def 6.13", "Hodge theater without initial Θ-data"); return 1; }
    /* Θ±ell-HT: capsule indexed by F_l, with distinct basepoints (conjugate synchronization) */
    if (ht->pmell.nT != d->l)
        iut_report_add(r, IUT_SEV_ERROR, "ThetaPmEllHodgeTheater", "[IUTchI] Def 6.13", "capsule F_T must have |F_l| = %u members, has %u", d->l, ht->pmell.nT);
    for (unsigned i = 0; i < ht->pmell.nT; ++i) {
        if (!iut_label_in_Fl(d, ht->pmell.T[i].label))
            iut_report_add(r, IUT_SEV_ERROR, "LabelT", "[IUTchI] §6", "label t=%d ∉ F_l", ht->pmell.T[i].label);
        for (unsigned k = 0; k < i; ++k) {
            if (ht->pmell.T[k].label == ht->pmell.T[i].label) iut_report_add(r, IUT_SEV_ERROR, "LabelT", "[IUTchI] §6", "label t=%d repeated", ht->pmell.T[i].label);
            if (ht->pmell.T[k].basepoint == ht->pmell.T[i].basepoint) iut_report_add(r, IUT_SEV_ERROR, "FlSemiPm", "[IUTchI] Cor 6.10; [IUTchII] Cor 4.5", "members t=%d,t=%d share a basepoint: capsule members must be distinct copies (conjugate synchronization is an output, not an input)", ht->pmell.T[k].label, ht->pmell.T[i].label);
        }
    }
    if (!ht->pmell.theta_pm_bridge_ok)  iut_report_add(r, IUT_SEV_ERROR, "ThetaPmBridge", "[IUTchI] Def 6.4", "Θ±-bridge F_T → F_⊞ missing");
    if (!ht->pmell.theta_ell_bridge_ok) iut_report_add(r, IUT_SEV_ERROR, "ThetaEllBridge", "[IUTchI] Def 6.4", "Θell-bridge D_T → D_⊚± missing");
    iut_validate_prime_strip(&ht->pmell.FBoxPlus, d, r);
    iut_validate_prime_strip(&ht->pmell.DCircDotPm, d, r);
    if (ht->pmell.FBoxPlus.kind != IUT_PS_F) iut_report_add(r, IUT_SEV_ERROR, "FBoxPlus", "[IUTchI] §6", "F_⊞ must be an F-prime-strip");
    if (ht->pmell.DCircDotPm.kind != IUT_PS_D) iut_report_add(r, IUT_SEV_ERROR, "DCircDotPm", "[IUTchI] §6", "D_⊚± must be a D-prime-strip");
    /* ΘNF-HT: capsule indexed by F_l^* */
    if (ht->nf.nJ != d->lstar)
        iut_report_add(r, IUT_SEV_ERROR, "ThetaNFHodgeTheater", "[IUTchI] Def 5.5", "capsule F_J must have |F_l^*| = %u members, has %u", d->lstar, ht->nf.nJ);
    for (unsigned i = 0; i < ht->nf.nJ; ++i)
        if (!iut_label_in_FlStar(d, ht->nf.J[i].label))
            iut_report_add(r, IUT_SEV_ERROR, "LabelJ", "[IUTchI] §4", "label j=%d ∉ F_l^*", ht->nf.J[i].label);
    if (!ht->nf.theta_bridge_ok) iut_report_add(r, IUT_SEV_ERROR, "ThetaBridge", "[IUTchI] Def 5.5", "Θ-bridge F_J → F_> missing");
    if (!ht->nf.nf_bridge_ok)    iut_report_add(r, IUT_SEV_ERROR, "NFBridge", "[IUTchI] Def 5.5", "NF-bridge F_J → F_⊛ missing");
    iut_validate_prime_strip(&ht->nf.FGt, d, r);
    iut_validate_prime_strip(&ht->nf.FCircAst, d, r);
    iut_validate_prime_strip(&ht->nf.tht.FMonoGlobMod, d, r);
    iut_validate_prime_strip(&ht->nf.tht.FMonoGlobTht, d, r);
    /* Θ-Hodge theater values: Θ̲_v at label j has valuation j² (units of ord q̲) */
    for (unsigned j = 1; j <= d->lstar; ++j)
        if (iut_q_cmp(ht->nf.tht.theta_value[j], iut_q_make((long)j * j, 1)) != 0)
            iut_report_add(r, IUT_SEV_ERROR, "ThetaUnderV", "[IUTchI] Ex 3.2; [IUTchII] Cor 2.8", "Θ̲-value at j=%u must be q̲^{j²}", j);
    /* gluing */
    if (!ht->glued) iut_report_add(r, IUT_SEV_ERROR, "GluingZeroBoxPlusToGt", "[IUTchI] Def 6.13 (iii)", "Θ±ell-HT and ΘNF-HT not glued (0,⊞ ↦ >)");
    else {
        /* under the gluing, the F_l^* capsule members are the F_l^× members modulo ±1: check basepoint compatibility */
        for (unsigned i = 0; i < ht->nf.nJ; ++i) {
            int j = ht->nf.J[i].label, found = 0;
            for (unsigned k = 0; k < ht->pmell.nT; ++k) if (ht->pmell.T[k].label == j || ht->pmell.T[k].label == -j) found++;
            if (found != 2) iut_report_add(r, IUT_SEV_ERROR, "GluingZeroBoxPlusToGt", "[IUTchI] Def 6.13 (iii)", "F_l^× ↠ F_l^*: label j=%d must come from exactly ±j ∈ F_l", j);
        }
    }
    /* derived ⊩ strips */
    iut_validate_prime_strip(&ht->FMonoGlobTriangle, d, r);
    iut_validate_prime_strip(&ht->FMonoGlobGau, d, r);
    iut_validate_prime_strip(&ht->FMonoGlobLGP, d, r);
    if (ht->q_pilot.kind != IUT_PILOT_Q || ht->q_pilot.nj != 1 || ht->q_pilot.exps[0] != 1)
        iut_report_add(r, IUT_SEV_ERROR, "QPilot", "[IUTchIII] Def 3.8 (i)", "q-pilot must be {q̲_v} (single exponent 1)");
    if (ht->theta_pilot.kind != IUT_PILOT_THETA || ht->theta_pilot.nj != d->lstar)
        iut_report_add(r, IUT_SEV_ERROR, "ThetaPilot", "[IUTchIII] Def 3.8 (i)", "Θ-pilot must be {q̲_v^{j²}}_{j=1..l*}");
    else for (unsigned j = 0; j < d->lstar; ++j)
        if (ht->theta_pilot.exps[j] != (j + 1) * (j + 1))
            iut_report_add(r, IUT_SEV_ERROR, "ThetaPilot", "[IUTchIII] Def 3.8 (i)", "Θ-pilot exponent at j=%u is %u, not j²", j + 1, ht->theta_pilot.exps[j]);
    if (ht->has_incoming_log && ht->nshell != d->nV)
        iut_report_add(r, IUT_SEV_ERROR, "LogShell", "[IUTchIII] Def 1.1", "codomain of a log-link must carry one log-shell per v ∈ V");
    if (r->errors == before)
        iut_report_add(r, IUT_SEV_OK, "ThetaPmEllNFHodgeTheater", "[IUTchI] Def 6.13", "%s at (%d,%d) is a well-formed Θ±ell NF-Hodge theater (universe #%u)", ht->copy_label, ht->n, ht->m, ht->universe);
    return (int)(r->errors - before);
}

/* ------------------------------------------------------------- prime-strips */
void iut_prime_strip_build(iut_prime_strip *ps, iut_ps_kind kind, const char *label,
                           const iut_initial_theta_data *d, unsigned copy_base,
                           const unsigned *theta_exps, unsigned ntheta)
{
    memset(ps, 0, sizeof *ps);
    ps->kind = kind; ps->nV = d->nV;
    snprintf(ps->label, sizeof ps->label, "%s", label);
    int etale = iut_ps_kind_is_etale_like(kind), mono = iut_ps_kind_is_mono_analytic(kind);
    double deg = 0;
    for (unsigned i = 0; i < d->nV; ++i) {
        iut_local_datum *L = &ps->loc[i];
        const iut_valuation *v = &d->V[i];
        L->G_copy  = copy_base * 1000 + i * 10 + 1;
        L->Pi_copy = mono ? 0 : copy_base * 1000 + i * 10 + 2;
        if (!etale) {
            L->units_copy = copy_base * 1000 + i * 10 + 3;
            L->units_mod_tors = (kind == IUT_PS_FMonoUnitsModTors || kind == IUT_PS_FMonoValUnitsModTors || kind == IUT_PS_FMonoGlobValUnitsModTors);
            L->has_valgroup = (kind != IUT_PS_FMonoUnits && kind != IUT_PS_FMonoUnitsModTors);
            L->has_splitting = (kind == IUT_PS_FMono || kind == IUT_PS_FMonoGlob || kind == IUT_PS_FMonoValUnitsModTors || kind == IUT_PS_FMonoGlobValUnitsModTors);
            L->kummer_kind = L->units_mod_tors ? 2 : (kind == IUT_PS_F || kind == IUT_PS_FMonoUnits ? 1 : 0);
            if (L->has_valgroup && v->kind == IUT_V_NONARCH && v->red == IUT_RED_BAD_MULT) {
                if (theta_exps && ntheta) {
                    L->nval = ntheta > IUT_MAX_LSTAR + 1 ? IUT_MAX_LSTAR + 1 : ntheta;
                    for (unsigned k = 0; k < L->nval; ++k) { L->val[k] = iut_q_make((long)theta_exps[k], 1); deg -= (double)theta_exps[k]; }
                } else { L->nval = 1; L->val[0] = iut_q_make(1, 1); deg -= 1.0; }
                /* arithmetic degree in units of |log q̲_v| summed over bad v */
            }
        }
    }
    if (iut_ps_kind_has_global(kind)) {
        ps->has_global_realified = 1;
        /* normalized degree of the pilot: −Σ_j exps · log(q)/(2l) averaged: */
        double logq = iut_log_q(d), ex = 0; unsigned n = 0;
        if (theta_exps && ntheta) { for (unsigned k = 0; k < ntheta; ++k) ex += theta_exps[k]; n = ntheta; }
        else { ex = 1; n = 1; }
        ps->global_degree = -(ex / (double)n) * logq / (2.0 * (double)(d->l ? d->l : 1));
    }
}

/* forget structure: F ⊃ F⊢ ⊃ F⊢× ⊃ F⊢×μ ,  F ⊃ D ⊃ D⊢ ,  F⊩ ⊃ F⊢ … */
void iut_prime_strip_forget(iut_prime_strip *dst, const iut_prime_strip *src, iut_ps_kind to)
{
    *dst = *src;
    dst->kind = to;
    int etale = iut_ps_kind_is_etale_like(to), mono = iut_ps_kind_is_mono_analytic(to);
    for (unsigned i = 0; i < dst->nV; ++i) {
        iut_local_datum *L = &dst->loc[i];
        if (mono) L->Pi_copy = 0;
        if (etale) { L->units_copy = 0; L->units_mod_tors = 0; L->has_valgroup = 0; L->has_splitting = 0; L->nval = 0; L->kummer_kind = 0; continue; }
        switch (to) {
        case IUT_PS_FMonoUnits:        L->units_mod_tors = 0; L->has_valgroup = 0; L->nval = 0; L->has_splitting = 0; L->kummer_kind = 1; break;
        case IUT_PS_FMonoUnitsModTors: L->units_mod_tors = 1; L->has_valgroup = 0; L->nval = 0; L->has_splitting = 0; L->kummer_kind = 2; break;
        case IUT_PS_FMonoValUnitsModTors: case IUT_PS_FMonoGlobValUnitsModTors: L->units_mod_tors = 1; L->has_splitting = 1; L->kummer_kind = 2; break;
        case IUT_PS_FMono: case IUT_PS_FMonoGlob: L->has_splitting = 1; break;
        default: break;
        }
    }
    if (!iut_ps_kind_has_global(to)) { dst->has_global_realified = 0; dst->global_degree = 0; }
}

/* ------------------------------------------------------------- Hodge theaters */
iut_hodge_theater *iut_hodge_theater_new(const iut_initial_theta_data *d, int n, int m, unsigned *universe_ctr)
{
    iut_hodge_theater *ht = calloc(1, sizeof *ht);
    if (!ht) return NULL;
    ht->n = n; ht->m = m; ht->data = d;
    ht->universe = ++*universe_ctr;
    if (n == 0 && m == 0)      snprintf(ht->copy_label, sizeof ht->copy_label, "Dag");
    else if (n == 1 && m == 0) snprintf(ht->copy_label, sizeof ht->copy_label, "Ddag");
    else                       snprintf(ht->copy_label, sizeof ht->copy_label, "NM%s%d%s%d", n < 0 ? "Neg" : "", abs(n), m < 0 ? "Neg" : "", abs(m));
    unsigned base = ht->universe * 100;
    /* Θ±ell-HT */
    ht->pmell.nT = d->l;
    for (unsigned i = 0; i < d->l; ++i) { ht->pmell.T[i].label = (int)i - (int)d->lstar; ht->pmell.T[i].basepoint = base + 1 + i; }
    iut_prime_strip_build(&ht->pmell.FBoxPlus, IUT_PS_F, "BoxPlus", d, base + 70, NULL, 0);
    iut_prime_strip_build(&ht->pmell.DCircDotPm, IUT_PS_D, "CircDotPm", d, base + 71, NULL, 0);
    ht->pmell.theta_pm_bridge_ok = ht->pmell.theta_ell_bridge_ok = 1;
    /* ΘNF-HT */
    ht->nf.nJ = d->lstar;
    for (unsigned j = 0; j < d->lstar; ++j) { ht->nf.J[j].label = (int)j + 1; ht->nf.J[j].basepoint = base + 1 + d->lstar + 1 + j; /* shares the copy of +j under the gluing */ }
    iut_prime_strip_build(&ht->nf.FGt, IUT_PS_F, "Gt", d, base + 72, NULL, 0);
    iut_prime_strip_build(&ht->nf.FCircAst, IUT_PS_F, "CircAst", d, base + 73, NULL, 0);
    ht->nf.theta_bridge_ok = ht->nf.nf_bridge_ok = 1;
    unsigned sq[IUT_MAX_LSTAR + 1];
    for (unsigned j = 0; j < d->lstar; ++j) sq[j] = (j + 1) * (j + 1);
    iut_prime_strip_build(&ht->nf.tht.FMonoGlobMod, IUT_PS_FMonoGlob, "MonoGlobMod", d, base + 74, NULL, 0);
    iut_prime_strip_build(&ht->nf.tht.FMonoGlobTht, IUT_PS_FMonoGlob, "MonoGlobTht", d, base + 75, sq, d->lstar);
    for (unsigned j = 0; j <= d->lstar; ++j) ht->nf.tht.theta_value[j] = iut_q_make((long)j * j, 1);
    /* [IUTchII] Cor 4.10 / [IUTchIII] Def 3.8 */
    iut_prime_strip_build(&ht->FMonoGlobTriangle, IUT_PS_FMonoGlobValUnitsModTors, "Triangle", d, base + 80, NULL, 0);
    iut_prime_strip_build(&ht->FMonoGlobEnv, IUT_PS_FMonoGlobValUnitsModTors, "Env", d, base + 81, sq, d->lstar);
    iut_prime_strip_build(&ht->FMonoGlobGau, IUT_PS_FMonoGlobValUnitsModTors, "Gau", d, base + 82, sq, d->lstar);
    iut_prime_strip_build(&ht->FMonoGlobLGP, IUT_PS_FMonoGlobValUnitsModTors, "LGPTorsor", d, base + 83, sq, d->lstar);
    iut_prime_strip_build(&ht->FMonoGlobLgp, IUT_PS_FMonoGlobValUnitsModTors, "LgpIdeal", d, base + 84, sq, d->lstar);
    ht->q_pilot.kind = IUT_PILOT_Q; ht->q_pilot.nj = 1; ht->q_pilot.exps[0] = 1;
    ht->q_pilot.log_volume = -iut_log_q(d) / (2.0 * d->l);
    ht->theta_pilot.kind = IUT_PILOT_THETA; ht->theta_pilot.nj = d->lstar;
    double s = 0; for (unsigned j = 0; j < d->lstar; ++j) { ht->theta_pilot.exps[j] = sq[j]; s += sq[j]; }
    /* naive log-volume of the Θ-pilot: average of j² times |log q| ([IUTchIII] Rem 3.12.1: (l+1)/12 · log(q) ... ) */
    ht->theta_pilot.log_volume = -(s / (double)(d->lstar ? d->lstar : 1)) * iut_log_q(d) / (2.0 * d->l);
    iut_hodge_theater_glue(ht);
    return ht;
}

void iut_hodge_theater_free(iut_hodge_theater *ht) { free(ht); }

void iut_hodge_theater_glue(iut_hodge_theater *ht)
{
    /* 0,⊞ ↦ > :  the F-prime-strip at label 0 of the Θ±ell-HT and F_⊞ are identified with F_>;
     * the capsule members ±j are identified with j ∈ F_l^* ([IUTchI] Def 6.13 (iii)). */
    ht->nf.FGt.loc[0] = ht->nf.FGt.loc[0]; /* same |V| indexing; the identification is a poly-isomorphism */
    for (unsigned i = 0; i < ht->nf.FGt.nV; ++i) {
        ht->nf.FGt.loc[i].Pi_copy = ht->pmell.FBoxPlus.loc[i].Pi_copy;
        ht->nf.FGt.loc[i].G_copy  = ht->pmell.FBoxPlus.loc[i].G_copy;
    }
    ht->glued = 1;
}
