/*
 * engine.c — configuration, state, and the facts.
 *
 * The facts are the finite combinatorics of the labels of [IUTchI]: residues
 * modulo l, the two symmetry groups acting on them, the transport of labels
 * across the bridges, the processions, the gluing.  They are exact.  Nothing
 * here computes with a number field, an elliptic curve, a fundamental group
 * or a Frobenioid; those appear in the model as described objects only.
 *
 * ../web/engine.js is a line by line port of this file; test.sh compares the
 * output of the two.
 */
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include "iutx.h"

/* ---------------------------------------------------------------- buffer */

void x_buf_init(x_buf *b) { b->s = NULL; b->len = b->cap = 0; }
void x_buf_free(x_buf *b) { free(b->s); x_buf_init(b); }

void x_buf_printf(x_buf *b, const char *fmt, ...)
{
    for (;;) {
        va_list ap;
        size_t room = b->cap - b->len;
        int n;
        va_start(ap, fmt);
        n = vsnprintf(b->s ? b->s + b->len : NULL, b->s ? room : 0, fmt, ap);
        va_end(ap);
        if (n < 0) return;
        if (b->s && (size_t)n < room) { b->len += (size_t)n; return; }
        b->cap = (b->cap ? b->cap * 2 : 1024) + (size_t)n;
        b->s = realloc(b->s, b->cap);
        if (!b->s) { b->len = b->cap = 0; return; }
    }
}

/* ---------------------------------------------------------- configuration */

static int is_prime(int n)
{
    if (n < 2) return 0;
    for (int d = 2; d * d <= n; d++)
        if (n % d == 0) return 0;
    return 1;
}

void x_config_default(x_config *c)
{
    x_config_set(c, 7, "11", "2,3,5");
}

static int add_list(x_config *c, const char *list, int kind)
{
    const char *p = list ? list : "";
    while (*p) {
        char *end;
        long v;
        while (*p == ',' || *p == ' ') p++;
        if (!*p) break;
        v = strtol(p, &end, 10);
        if (end == p || v < 0 || v > 9999) return 1;
        if (kind == X_GOOD) {          /* a place already listed as bad stays bad */
            int dup = 0;
            for (int i = 0; i < c->nplaces; i++)
                if (c->places[i].p == (int)v) dup = 1;
            if (dup) { p = end; continue; }
        }
        if (c->nplaces >= X_MAX_PLACES - 1) return 1;     /* keep room for ∞ */
        c->places[c->nplaces].kind = kind;
        c->places[c->nplaces].p = (int)v;
        c->nplaces++;
        p = end;
    }
    return 0;
}

static int cmp_place(const void *a, const void *b)
{
    const x_place *x = a, *y = b;
    if ((x->kind == X_ARC) != (y->kind == X_ARC)) return x->kind == X_ARC ? 1 : -1;
    return x->p - y->p;
}

int x_config_set(x_config *c, int l, const char *bad, const char *good)
{
    memset(c, 0, sizeof *c);
    c->l = l;
    if (add_list(c, bad, X_BAD) || add_list(c, good, X_GOOD)) return 1;
    c->places[c->nplaces].kind = X_ARC;
    c->places[c->nplaces].p = 0;
    c->nplaces++;
    qsort(c->places, (size_t)c->nplaces, sizeof c->places[0], cmp_place);
    return 0;
}

void x_place_name(const x_place *p, char *buf, size_t n)
{
    if (p->kind == X_ARC) snprintf(buf, n, "∞");
    else snprintf(buf, n, "%d", p->p);
}

int x_config_check(const x_config *c, FILE *err)
{
    int bad = 0, nbad = 0;
    if (!is_prime(c->l) || c->l < 5) {
        if (err) fprintf(err, "Def 3.1 (c): l = %d is not a prime ≥ 5\n", c->l);
        bad++;
    } else if (c->l > X_L_MAX) {
        if (err) fprintf(err, "l = %d is larger than this program handles (l ≤ %d)\n", c->l, X_L_MAX);
        bad++;
    }
    for (int i = 0; i < c->nplaces; i++) {
        const x_place *p = &c->places[i];
        if (p->kind == X_ARC) continue;
        if (!is_prime(p->p)) {
            if (err) fprintf(err, "place %d is not a prime\n", p->p);
            bad++;
        }
        for (int j = 0; j < i; j++)
            if (c->places[j].kind != X_ARC && c->places[j].p == p->p) {
                if (err) fprintf(err, "place %d is listed twice\n", p->p);
                bad++;
            }
        if (p->kind != X_BAD) continue;
        nbad++;
        if (p->p == 2) {
            if (err) fprintf(err, "Def 3.1 (b): the place 2 of V^bad_mod is not of odd residue characteristic\n");
            bad++;
        }
        if (p->p == c->l) {
            if (err) fprintf(err, "Def 3.1 (c): l = %d is not prime to the place %d of V^bad_mod\n", c->l, p->p);
            bad++;
        }
    }
    if (nbad == 0) {
        if (err) fprintf(err, "Def 3.1 (b): V^bad_mod is empty\n");
        bad++;
    }
    return bad;
}

/* ------------------------------------------------------------------ state */

void x_state_init(x_state *s, const x_config *c)
{
    memset(s, 0, sizeof *s);
    s->cfg = *c;
}

int x_step_missing(const x_state *s, int step, char *buf, size_t n)
{
    char tok[96];
    const char *p = x_steps[step].in;
    int missing = 0;
    size_t len = 0;
    if (n) buf[0] = 0;
    while (x_next_token(&p, tok, sizeof tok)) {
        int k = x_node_index(tok);
        if (k >= 0 && s->built[k]) continue;
        missing++;
        if (n) len += (size_t)snprintf(buf + len, len < n ? n - len : 0, "%s%s", len ? " " : "", tok);
        if (len >= n && n) len = n - 1;
    }
    return missing;
}

int x_step_ready(const x_state *s, int step)
{
    if (step < 0 || (size_t)step >= x_steps_count) return 0;
    if (s->done[step]) return 0;
    return x_step_missing(s, step, NULL, 0) == 0;
}

int x_apply(x_state *s, int step)
{
    char tok[96];
    const char *p;
    if (!x_step_ready(s, step)) return 1;
    p = x_steps[step].out;
    while (x_next_token(&p, tok, sizeof tok)) {
        int k = x_node_index(tok);
        if (k >= 0) s->built[k] = 1;
    }
    s->done[step] = 1;
    s->hist[s->nhist++] = step;
    return 0;
}

int x_undo(x_state *s)
{
    char tok[96];
    const char *p;
    int step;
    if (s->nhist == 0) return 1;
    step = s->hist[--s->nhist];
    p = x_steps[step].out;
    while (x_next_token(&p, tok, sizeof tok)) {
        int k = x_node_index(tok);
        if (k >= 0) s->built[k] = 0;
    }
    s->done[step] = 0;
    return 0;
}

int x_next(const x_state *s)
{
    for (size_t i = 0; i < x_steps_count; i++)
        if (!s->done[i]) return x_step_ready(s, (int)i) ? (int)i : -1;
    return -1;
}

/* ------------------------------------------------------------------ facts */

const char *const x_fact_views[] = {
    "conditions", "labels", "places", "flstar", "evaluation", "lctransport",
    "procession", "pmaction", "pmprocession", "glue", "frobenius", "etale",
};
const size_t x_fact_views_count = sizeof x_fact_views / sizeof x_fact_views[0];

static void kv(x_buf *b, const char *k, const char *fmt, ...)
{
    char v[1024];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(v, sizeof v, fmt, ap);
    va_end(ap);
    x_buf_printf(b, "%s\t%s\n", k, v);
}

/* the class of n in F_l^⍟ = F_l^×/{±1}, as a representative in 1..l⍟ */
static int star(int n, int l)
{
    int r = ((n % l) + l) % l;
    return r > (l - 1) / 2 ? l - r : r;
}

/* a residue as a representative in −l⍟..l⍟ */
static int sym(int n, int l)
{
    int r = ((n % l) + l) % l;
    return r > (l - 1) / 2 ? r - l : r;
}

static void range(char *buf, size_t n, int a, int b)
{
    size_t len = 0;
    buf[0] = 0;
    for (int i = a; i <= b && len + 8 < n; i++)
        len += (size_t)snprintf(buf + len, n - len, "%s%d", i > a ? ", " : "", i);
}

static void places_of(const x_config *c, int kind, char *buf, size_t n)
{
    size_t len = 0;
    buf[0] = 0;
    for (int i = 0; i < c->nplaces && len + 12 < n; i++) {
        char nm[16];
        if (c->places[i].kind != kind) continue;
        x_place_name(&c->places[i], nm, sizeof nm);
        len += (size_t)snprintf(buf + len, n - len, "%s%s", len ? ", " : "", nm);
    }
    if (!len) snprintf(buf, n, "none shown");
}

static void f_conditions(const x_config *c, x_buf *b)
{
    char bad[256];
    int l = c->l, okl = is_prime(l) && l >= 5, nbad = 0, odd = 1, prime_to_l = 1;
    for (int i = 0; i < c->nplaces; i++)
        if (c->places[i].kind == X_BAD) {
            nbad++;
            if (c->places[i].p == 2) odd = 0;
            if (c->places[i].p == l) prime_to_l = 0;
        }
    places_of(c, X_BAD, bad, sizeof bad);
    kv(b, "(a) √−1 ∈ F", "assumed");
    kv(b, "(b) X_F has stable reduction at every nonarchimedean place", "assumed");
    kv(b, "(b) F/F_mod is Galois of degree prime to l", "assumed");
    kv(b, "(b) the 2·3-torsion points of E_F are rational over F", "assumed");
    kv(b, "(b) V^bad_mod is nonempty", "checked: {%s} %s", bad, nbad ? "ok" : "FAILS");
    kv(b, "(b) V^bad_mod has odd residue characteristic", "checked: %s", odd ? "ok" : "FAILS");
    kv(b, "(b) E_F has multiplicative reduction over V^bad_mod", "assumed");
    kv(b, "(c) l is a prime ≥ 5", "checked: l = %d %s", l, okl ? "ok" : "FAILS");
    kv(b, "(c) the image of G_F → GL_2(F_l) contains SL_2(F_l)", "assumed");
    kv(b, "(c) l is prime to the residue characteristics of V^bad_mod", "checked: %s", prime_to_l ? "ok" : "FAILS");
    kv(b, "(c) l is prime to the orders of the q-parameters at V(F)^bad", "assumed");
    kv(b, "(d) C̲_K is of type (1, l-tors)± with K-core C_K", "assumed");
    kv(b, "(e) V̲ → V_mod is a bijection", "by construction: one place of K is taken above each place shown");
    kv(b, "(e) C̲_v is of type (1, Z/lZ)± at each bad place", "assumed");
    kv(b, "(f) ε̲ is a cusp of C̲_K from a nonzero element of Q", "assumed");
}

static void f_labels(const x_config *c, x_buf *b)
{
    char buf[512];
    int l = c->l, ls = (l - 1) / 2, lp = (l + 1) / 2;
    kv(b, "l", "%d", l);
    kv(b, "l⍟ = (l−1)/2", "%d", ls);
    kv(b, "l± = (l+1)/2", "%d", lp);
    range(buf, sizeof buf, -ls, ls);
    kv(b, "F_l", "{%s}, %d elements", buf, l);
    range(buf, sizeof buf, 0, ls);
    kv(b, "|F_l| = F_l/{±1}", "{%s}, %d elements", buf, lp);
    range(buf, sizeof buf, 1, ls);
    kv(b, "F_l^⍟ = F_l^×/{±1}", "{%s}, %d elements", buf, ls);
    kv(b, "F_l^⋊± = F_l ⋊ {±1}", "z ↦ ±z + λ, %d elements", 2 * l);
}

static void f_places(const x_config *c, x_buf *b)
{
    char buf[256];
    places_of(c, X_BAD, buf, sizeof buf);
    kv(b, "V̲^bad shown", "{%s}", buf);
    places_of(c, X_GOOD, buf, sizeof buf);
    kv(b, "V̲^good ∩ V̲^non shown", "{%s}, and every other prime", buf);
    kv(b, "V̲^arc shown", "{∞}");
    for (int i = 0; i < c->nplaces; i++) {
        char nm[16], k[64];
        x_place_name(&c->places[i], nm, sizeof nm);
        snprintf(k, sizeof k, "v = %s", nm);
        switch (c->places[i].kind) {
        case X_BAD:
            kv(b, k, "bad: Π_v = tempered π_1 of X̳_v, D_v = B^temp(X̳_v)^0, F̳_v tempered Frobenioid with Θ̳_v, q̳_v");
            break;
        case X_GOOD:
            kv(b, k, "good: Π_v = étale π_1 of X→_v, D_v = B(X→_v)^0, F̳_v = C_v");
            break;
        default:
            kv(b, k, "archimedean: D_v = Aut-holomorphic orbispace of X→_v, F̳_v = (C_v, D_v, κ_v)");
        }
    }
}

static void f_flstar(const x_config *c, x_buf *b)
{
    int l = c->l, ls = (l - 1) / 2, transitive = 1;
    kv(b, "Aut(C̲_K)/Aut_ε(C̲_K)", "≅ F_l^⍟, of order %d", ls);
    for (int a = 1; a <= ls; a++) {
        char v[512], k[32];
        size_t len = 0;
        for (int j = 1; j <= ls; j++)
            len += (size_t)snprintf(v + len, sizeof v - len, "%s%d↦%d", j > 1 ? "  " : "", j, star(a * j, l));
        snprintf(k, sizeof k, "%d · j", a);
        kv(b, k, "%s", v);
    }
    /* simply transitive: for every pair (j, k) exactly one a with a·j = k */
    for (int j = 1; j <= ls; j++)
        for (int k = 1; k <= ls; k++) {
            int n = 0;
            for (int a = 1; a <= ls; a++)
                if (star(a * j, l) == k) n++;
            if (n != 1) transitive = 0;
        }
    kv(b, "action on J", "%s", transitive ? "simply transitive: checked" : "NOT simply transitive");
}

static void f_evaluation(const x_config *c, x_buf *b)
{
    char bad[256];
    int l = c->l, ls = (l - 1) / 2;
    places_of(c, X_BAD, bad, sizeof bad);
    kv(b, "at the bad places", "{%s}", bad);
    for (int j = 1; j <= ls; j++) {
        char k[32];
        snprintf(k, sizeof k, "label j = %d", j);
        kv(b, k, "Θ̳_v takes the value q̳_v^%d, up to μ_%d", j * j, 2 * l);
    }
    kv(b, "exponents", "j² for j = 1, …, %d; other representatives of the label give q̳_v^(n²) with n ≡ ±j mod %d", ls, l);
}

static void f_lctransport(const x_config *c, x_buf *b)
{
    int l = c->l, ls = (l - 1) / 2;
    kv(b, "φ^LC_j", "= j · φ^LC_1");
    for (int j = 1; j <= ls; j++) {
        char v[512], k[48];
        size_t len = 0;
        for (int m = 1; m <= ls; m++)
            len += (size_t)snprintf(v + len, sizeof v - len, "%s%d·[ε̲]↦%d", m > 1 ? "  " : "", m, star(j * m, l));
        snprintf(k, sizeof k, "φ^LC_%d", j);
        kv(b, k, "%s", v);
    }
    kv(b, "[ε̲]", "the unique class with φ^LC_j([ε̲]) = j for every j");
    kv(b, "ζ_⍟", "j·[ε̲] ↦ the strip j of the capsule");
}

static unsigned long long ipow(int a, int e)
{
    unsigned long long r = 1;
    while (e-- > 0) r *= (unsigned long long)a;
    return r;
}

static unsigned long long fact(int n)
{
    unsigned long long r = 1;
    for (int i = 2; i <= n; i++) r *= (unsigned long long)i;
    return r;
}

static void f_procession(const x_config *c, x_buf *b)
{
    int ls = (c->l - 1) / 2;
    for (int j = 1; j <= ls; j++) {
        char v[512], k[32];
        range(v, sizeof v, 1, j);
        snprintf(k, sizeof k, "S⍟_%d", j);
        kv(b, k, "{%s}: %d possible label%s for each index", v, j, j > 1 ? "s" : "");
    }
    kv(b, "capsule without labels", "(l⍟)^(l⍟) = %d^%d = %llu possibilities", ls, ls, ipow(ls, ls));
    kv(b, "procession", "l⍟! = %d! = %llu possibilities", ls, fact(ls));
}

static void f_pmaction(const x_config *c, x_buf *b)
{
    char v[512];
    int l = c->l, ls = (l - 1) / 2;
    size_t len = 0;
    kv(b, "F_l^⋊±", "generated by t ↦ t + 1 and t ↦ −t, of order %d", 2 * l);
    for (int t = -ls; t <= ls; t++)
        len += (size_t)snprintf(v + len, sizeof v - len, "%s%d↦%d", t > -ls ? "  " : "", t, sym(t + 1, l));
    kv(b, "t ↦ t + 1", "%s", v);
    len = 0;
    for (int t = -ls; t <= ls; t++)
        len += (size_t)snprintf(v + len, sizeof v - len, "%s%d↦%d", t > -ls ? "  " : "", t, sym(-t, l));
    kv(b, "t ↦ −t", "%s", v);
    kv(b, "action on T", "transitive: no label is fixed by the whole group");
    len = (size_t)snprintf(v, sizeof v, "{0}");
    for (int t = 1; t <= ls; t++)
        len += (size_t)snprintf(v + len, sizeof v - len, "  {%d, %d}", t, -t);
    kv(b, "orbits of {±1}", "%s", v);
    kv(b, "as an F_l^⋊±-group", "T has a zero and is known up to sign");
    kv(b, "as an F_l^⋊±-torsor", "T has no zero");
}

static void f_pmprocession(const x_config *c, x_buf *b)
{
    int lp = (c->l + 1) / 2;
    for (int t = 1; t <= lp; t++) {
        char v[512], k[32];
        range(v, sizeof v, 0, t - 1);
        snprintf(k, sizeof k, "S±_%d", t);
        kv(b, k, "{%s}: %d possible label%s for each index", v, t, t > 1 ? "s" : "");
    }
    kv(b, "capsule without labels", "(l±)^(l±) = %d^%d = %llu possibilities", lp, lp, ipow(lp, lp));
    kv(b, "procession", "l±! = %d! = %llu possibilities", lp, fact(lp));
}

static void f_glue(const x_config *c, x_buf *b)
{
    int l = c->l, ls = (l - 1) / 2;
    for (int j = 1; j <= ls; j++) {
        char k[48];
        snprintf(k, sizeof k, "t = %d, t = %d", j, -j);
        kv(b, k, "↦ j = %d", j);
    }
    kv(b, "t = 0, ≻", "↦ >");
    kv(b, "additive side", "%d strips †D_t and the strip †D_≻", l);
    kv(b, "multiplicative side", "%d strips †D_j and the strip †D_>", ls);
    kv(b, "every correspondence", "sends exactly two strips to one: %d = 2·%d", l + 1, ls + 1);
}

static void f_frobenius(const x_config *c, x_buf *b)
{
    char bad[256];
    places_of(c, X_BAD, bad, sizeof bad);
    for (int n = -1; n <= 1; n++) {
        char k[64];
        snprintf(k, sizeof k, "%dHT^Θ —Θ→ %dHT^Θ", n, n + 1);
        kv(b, k, "%dF^⊩_tht ≅ %dF^⊩_mod; at v in {%s}: %dΘ̳_v ↦ %dq̳_v", n, n + 1, bad, n, n + 1);
    }
    kv(b, "symmetries", "the shift n ↦ n + 1; no swap of two neighbours");
}

static void f_etale(const x_config *c, x_buf *b)
{
    (void)c;
    kv(b, "core", "one D^⊢-prime-strip, shared by every theater of the chain");
    kv(b, "spokes", "the D-Hodge theaters ⁿHT, n in Z");
    kv(b, "symmetries", "every permutation of the spokes");
    kv(b, "compare", "the Frobenius-picture of the same chain allows only shifts");
}

int x_facts(const x_config *c, const char *view, x_buf *out)
{
    static const struct { const char *name; void (*fn)(const x_config *, x_buf *); } t[] = {
        { "conditions", f_conditions }, { "labels", f_labels }, { "places", f_places },
        { "flstar", f_flstar }, { "evaluation", f_evaluation }, { "lctransport", f_lctransport },
        { "procession", f_procession }, { "pmaction", f_pmaction }, { "pmprocession", f_pmprocession },
        { "glue", f_glue }, { "frobenius", f_frobenius }, { "etale", f_etale },
    };
    for (size_t i = 0; i < sizeof t / sizeof t[0]; i++)
        if (strcmp(t[i].name, view) == 0) { t[i].fn(c, out); return 0; }
    return 1;
}
