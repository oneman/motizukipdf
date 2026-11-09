/*
 * iut_input.c — read initial Θ-data from JSON.
 *
 * The worked examples in docs/initial-theta-data/<id>.json (schema
 * "iut-initial-theta-data/1", written by scripts/infographic/initialtheta-data.js)
 * hold the tuple (F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲) of [IUTchI] Def 3.1 computed
 * exactly for a given elliptic curve: reduction types over F, ord(q_v), the Tate
 * parameters q_v to 8 p-adic digits, l with its SL2 proof, the cusp ε̲ and so on.
 * This file turns such a file into an iut_initial_theta_data, so that every
 * command of the toolkit (gen, validate, walk, run, pipeline, tui) can run on it:
 *
 *     iut pipeline --theta-json docs/initial-theta-data/curve-11a1.json
 *
 * The argument of --theta-json is a path, or the JSON text itself when it starts
 * with '{' (that is how the web app passes it: the wasm engine has no files).
 *
 * The JSON reader below is a small strict parser (RFC 8259 values, UTF-8 strings,
 * \uXXXX escapes with surrogate pairs) with no dependencies, so that it builds
 * unchanged for wasm32-wasi.
 */
#include <errno.h>
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include "iut.h"

/* ------------------------------------------------------------- JSON values */
typedef enum { J_NULL, J_FALSE, J_TRUE, J_NUM, J_STR, J_ARR, J_OBJ } jtype;
typedef struct jval {
    jtype type;
    double num;
    char *str;                 /* J_STR: the string; J_NUM: the literal text   */
    unsigned n;                /* J_ARR / J_OBJ: number of members             */
    char **keys;               /* J_OBJ                                        */
    struct jval **items;       /* J_ARR / J_OBJ                                */
} jval;

typedef struct { const char *s; size_t i, n; char err[160]; int depth; } jparser;

static void jfree(jval *v)
{
    if (!v) return;
    free(v->str);
    for (unsigned k = 0; k < v->n; ++k) { if (v->keys) free(v->keys[k]); jfree(v->items[k]); }
    free(v->keys); free(v->items); free(v);
}
static int jfail(jparser *p, const char *msg)
{
    if (!p->err[0]) {
        unsigned line = 1; for (size_t k = 0; k < p->i && k < p->n; ++k) if (p->s[k] == '\n') line++;
        snprintf(p->err, sizeof p->err, "JSON line %u: %s", line, msg);
    }
    return -1;
}
static void jws(jparser *p) { while (p->i < p->n && (p->s[p->i] == ' ' || p->s[p->i] == '\t' || p->s[p->i] == '\n' || p->s[p->i] == '\r')) p->i++; }
static jval *jnew(jtype t) { jval *v = calloc(1, sizeof *v); if (v) v->type = t; return v; }
static int jpush(jval *v, char *key, jval *item)
{
    char **nk = v->type == J_OBJ ? realloc(v->keys, (v->n + 1) * sizeof *nk) : NULL;
    if (v->type == J_OBJ) { if (!nk) return -1; v->keys = nk; v->keys[v->n] = key; }
    jval **ni = realloc(v->items, (v->n + 1) * sizeof *ni);
    if (!ni) return -1;
    v->items = ni; v->items[v->n++] = item;
    return 0;
}
static void put_utf8(char *out, size_t *o, unsigned long c)
{
    if (c < 0x80) out[(*o)++] = (char)c;
    else if (c < 0x800) { out[(*o)++] = (char)(0xC0 | (c >> 6)); out[(*o)++] = (char)(0x80 | (c & 0x3F)); }
    else if (c < 0x10000) { out[(*o)++] = (char)(0xE0 | (c >> 12)); out[(*o)++] = (char)(0x80 | ((c >> 6) & 0x3F)); out[(*o)++] = (char)(0x80 | (c & 0x3F)); }
    else { out[(*o)++] = (char)(0xF0 | (c >> 18)); out[(*o)++] = (char)(0x80 | ((c >> 12) & 0x3F)); out[(*o)++] = (char)(0x80 | ((c >> 6) & 0x3F)); out[(*o)++] = (char)(0x80 | (c & 0x3F)); }
}
static int hex4(jparser *p, unsigned long *c)
{
    if (p->i + 4 > p->n) return -1;
    unsigned long x = 0;
    for (int k = 0; k < 4; ++k) {
        char h = p->s[p->i++]; x <<= 4;
        if (h >= '0' && h <= '9') x |= (unsigned long)(h - '0');
        else if (h >= 'a' && h <= 'f') x |= (unsigned long)(h - 'a' + 10);
        else if (h >= 'A' && h <= 'F') x |= (unsigned long)(h - 'A' + 10);
        else return -1;
    }
    *c = x; return 0;
}
static char *jstring(jparser *p)
{
    if (p->s[p->i] != '"') { jfail(p, "expected a string"); return NULL; }
    p->i++;
    size_t start = p->i;
    while (p->i < p->n && p->s[p->i] != '"') { if (p->s[p->i] == '\\') p->i++; p->i++; }
    if (p->i >= p->n) { jfail(p, "unterminated string"); return NULL; }
    size_t end = p->i; p->i = start;
    char *out = malloc(end - start + 1); size_t o = 0;
    if (!out) { jfail(p, "out of memory"); return NULL; }
    while (p->i < end) {
        unsigned char ch = (unsigned char)p->s[p->i++];
        if (ch < 0x20) { free(out); jfail(p, "control character in string"); return NULL; }
        if (ch != '\\') { out[o++] = (char)ch; continue; }
        char e = p->s[p->i++];
        switch (e) {
        case '"': out[o++] = '"'; break;   case '\\': out[o++] = '\\'; break; case '/': out[o++] = '/'; break;
        case 'b': out[o++] = '\b'; break;  case 'f': out[o++] = '\f'; break;  case 'n': out[o++] = '\n'; break;
        case 'r': out[o++] = '\r'; break;  case 't': out[o++] = '\t'; break;
        case 'u': {
            unsigned long c, c2;
            if (hex4(p, &c)) { free(out); jfail(p, "bad \\u escape"); return NULL; }
            if (c >= 0xD800 && c < 0xDC00 && p->i + 6 <= end && p->s[p->i] == '\\' && p->s[p->i + 1] == 'u') {
                p->i += 2;
                if (hex4(p, &c2) || c2 < 0xDC00 || c2 > 0xDFFF) { free(out); jfail(p, "bad surrogate pair"); return NULL; }
                c = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
            }
            put_utf8(out, &o, c);      /* at most 4 bytes for the 6+ consumed: fits */
            break;
        }
        default: free(out); jfail(p, "bad escape"); return NULL;
        }
    }
    out[o] = 0; p->i = end + 1;
    return out;
}
static jval *jvalue(jparser *p);
static jval *jcontainer(jparser *p, int obj)
{
    jval *v = jnew(obj ? J_OBJ : J_ARR);
    if (!v) { jfail(p, "out of memory"); return NULL; }
    if (++p->depth > 64) { jfail(p, "nesting too deep"); jfree(v); return NULL; }
    p->i++; jws(p);
    if (p->i < p->n && p->s[p->i] == (obj ? '}' : ']')) { p->i++; p->depth--; return v; }
    for (;;) {
        char *key = NULL;
        jws(p);
        if (obj) {
            if (p->i >= p->n || !(key = jstring(p))) { jfree(v); return NULL; }
            jws(p);
            if (p->i >= p->n || p->s[p->i] != ':') { free(key); jfree(v); jfail(p, "expected ':'"); return NULL; }
            p->i++;
        }
        jval *item = jvalue(p);
        if (!item || jpush(v, key, item)) { free(key); jfree(item); jfree(v); jfail(p, "bad member"); return NULL; }
        jws(p);
        if (p->i < p->n && p->s[p->i] == ',') { p->i++; continue; }
        if (p->i < p->n && p->s[p->i] == (obj ? '}' : ']')) { p->i++; p->depth--; return v; }
        jfree(v); jfail(p, obj ? "expected ',' or '}'" : "expected ',' or ']'"); return NULL;
    }
}
static jval *jvalue(jparser *p)
{
    jws(p);
    if (p->i >= p->n) { jfail(p, "unexpected end of input"); return NULL; }
    char c = p->s[p->i];
    if (c == '{' || c == '[') return jcontainer(p, c == '{');
    if (c == '"') { char *s = jstring(p); if (!s) return NULL; jval *v = jnew(J_STR); if (!v) { free(s); return NULL; } v->str = s; return v; }
    if (!strncmp(p->s + p->i, "true", 4))  { p->i += 4; return jnew(J_TRUE); }
    if (!strncmp(p->s + p->i, "false", 5)) { p->i += 5; return jnew(J_FALSE); }
    if (!strncmp(p->s + p->i, "null", 4))  { p->i += 4; return jnew(J_NULL); }
    if (c == '-' || (c >= '0' && c <= '9')) {
        size_t start = p->i;
        if (p->s[p->i] == '-') p->i++;
        while (p->i < p->n && strchr("0123456789.eE+-", p->s[p->i])) p->i++;
        jval *v = jnew(J_NUM); if (!v) return NULL;
        v->str = malloc(p->i - start + 1);
        if (!v->str) { free(v); return NULL; }
        memcpy(v->str, p->s + start, p->i - start); v->str[p->i - start] = 0;
        char *end = NULL; v->num = strtod(v->str, &end);
        if (!end || *end) { jfree(v); jfail(p, "bad number"); return NULL; }
        return v;
    }
    jfail(p, "unexpected character");
    return NULL;
}
static jval *jparse(const char *text, char *err, size_t errn)
{
    jparser p; memset(&p, 0, sizeof p);
    p.s = text; p.n = strlen(text);
    if (p.n >= 3 && (unsigned char)text[0] == 0xEF && (unsigned char)text[1] == 0xBB && (unsigned char)text[2] == 0xBF) p.i = 3;  /* BOM */
    jval *v = jvalue(&p);
    if (v) { jws(&p); if (p.i != p.n) { jfree(v); v = NULL; jfail(&p, "trailing characters after the value"); } }
    if (!v) snprintf(err, errn, "%s", p.err[0] ? p.err : "invalid JSON");
    return v;
}

/* ------------------------------------------------------------- lookups    */
static const jval *jget(const jval *o, const char *key)
{
    if (!o || o->type != J_OBJ) return NULL;
    for (unsigned k = 0; k < o->n; ++k) if (!strcmp(o->keys[k], key)) return o->items[k];
    return NULL;
}
/* path "a.b.c" */
static const jval *jpath(const jval *o, const char *path)
{
    char buf[128]; snprintf(buf, sizeof buf, "%s", path);
    const jval *v = o;
    for (char *tok = strtok(buf, "."); tok && v; tok = strtok(NULL, ".")) v = jget(v, tok);
    return v;
}
static int jnum(const jval *v, double *out)
{
    if (!v) return 0;
    if (v->type == J_NUM) { *out = v->num; return 1; }
    if (v->type == J_STR) { char *e = NULL; double x = strtod(v->str, &e); if (e && e != v->str && !*e) { *out = x; return 1; } }
    return 0;
}
static int jull(const jval *v, unsigned long long *out)    /* exact, from a number or a decimal string */
{
    if (!v || (v->type != J_NUM && v->type != J_STR) || !v->str) return 0;
    const char *s = v->str; unsigned long long x = 0;
    if (!*s) return 0;
    for (; *s; ++s) {
        if (*s < '0' || *s > '9') return 0;
        if (x > (~0ULL - 9) / 10) return 0;
        x = x * 10 + (unsigned long long)(*s - '0');
    }
    *out = x; return 1;
}
static int jtruthy(const jval *v)        /* true, a nonempty string or a nonzero number */
{
    if (!v) return 0;
    if (v->type == J_TRUE) return 1;
    if (v->type == J_STR) return v->str && v->str[0];
    if (v->type == J_NUM) return v->num != 0;
    return v->type == J_OBJ || v->type == J_ARR;
}
static const char *jstr(const jval *v) { return v && v->type == J_STR ? v->str : NULL; }

/* ------------------------------------------------------------- arithmetic */
unsigned long long iut_pow_ull(unsigned long long b, unsigned e) { unsigned long long r = 1; while (e--) r *= b; return r; }
static unsigned long long mulmod(unsigned long long a, unsigned long long b, unsigned long long m)
{
    /* m < 2^62, so a + a never overflows: double-and-add (portable to wasm32, no __int128) */
    unsigned long long r = 0; a %= m;
    while (b) { if (b & 1) { r += a; if (r >= m) r -= m; } a += a; if (a >= m) a -= m; b >>= 1; }
    return r;
}
unsigned long long iut_tate_unit_pow(const iut_valuation *v, unsigned long long k)
{
    if (!v->q_prec || !v->p) return 0;
    unsigned long long m = iut_pow_ull(v->p, v->q_prec), b = v->q_unit % m, r = 1 % m;
    while (k) { if (k & 1) r = mulmod(r, b, m); b = mulmod(b, b, m); k >>= 1; }
    return r;
}

/* ------------------------------------------------------------- the loader */
static int fail(char *err, size_t errn, const char *fmt, ...)
{
    va_list ap; va_start(ap, fmt); vsnprintf(err, errn, fmt, ap); va_end(ap);
    return -1;
}

static int load(iut_initial_theta_data *d, const jval *root, char *err, size_t errn)
{
    memset(d, 0, sizeof *d);
    if (!root || root->type != J_OBJ) return fail(err, errn, "initial Θ-data JSON must be an object");
    const char *schema = jstr(jget(root, "schema"));
    if (!schema || strcmp(schema, "iut-initial-theta-data/1"))
        return fail(err, errn, "unknown schema \"%s\" (expected \"iut-initial-theta-data/1\", see docs/initial-theta-data/)", schema ? schema : "");
    const char *id = jstr(jget(root, "id")), *title = jstr(jget(root, "title"));
    d->from_json = 1;
    snprintf(d->source_id, sizeof d->source_id, "%s", id ? id : "json");
    snprintf(d->name, sizeof d->name, "%.60s (%.30s)", title ? title : d->source_id, d->source_id);
    const char *eq = jstr(jpath(root, "curve.equation"));
    snprintf(d->curve, sizeof d->curve, "%s", eq ? eq : "E_F (equation not given)");

    /* fields F_mod ⊆ F ⊆ K */
    double x;
    if (!jnum(jpath(root, "Fmod.degree"), &x) || x < 1) return fail(err, errn, "Fmod.degree missing");
    d->dmod = (unsigned)x;
    unsigned long long u;
    if (!jull(jpath(root, "F.degreeDivides"), &u) || !u) return fail(err, errn, "F.degreeDivides missing");
    d->dF = u;
    /* l */
    if (!jnum(jpath(root, "l.value"), &x)) return fail(err, errn, "l.value missing");
    d->l = (unsigned)x;
    if (!iut_is_prime(d->l) || d->l < 5 || d->l > IUT_MAX_L) return fail(err, errn, "l = %u must be a prime with 5 ≤ l ≤ %d", d->l, IUT_MAX_L);
    unsigned long long gl2 = (unsigned long long)d->l * (d->l + 1) * (d->l - 1) * (d->l - 1);
    if (!jull(jpath(root, "K.degreeOverQAtMost"), &u) || !u) u = d->dF * gl2;   /* [K:F] ≤ |GL2(F_l)| */
    d->dK = u;
    /* ε̲ */
    if (!jnum(jpath(root, "epsilon.label"), &x)) return fail(err, errn, "epsilon.label missing");
    d->epsilon = (int)x;
    /* V: one v above each place of F_mod that the file lists */
    const jval *places = jpath(root, "V.places");
    if (!places || places->type != J_ARR || !places->n) return fail(err, errn, "V.places missing");
    double logf_Q = 0;
    for (unsigned k = 0; k < places->n; ++k) {
        const jval *P = places->items[k];
        if (d->nV >= IUT_MAX_V) return fail(err, errn, "too many places (IUT_MAX_V = %d)", IUT_MAX_V);
        iut_valuation *v = &d->V[d->nV++];
        memset(v, 0, sizeof *v);
        const char *name = jstr(jget(P, "name")), *kind = jstr(jget(P, "kind"));
        snprintf(v->name, sizeof v->name, "%s", name ? name : "v?");
        if (kind && !strcmp(kind, "VArc")) { v->kind = IUT_V_ARCH; v->red = IUT_RED_GOOD; continue; }
        v->kind = IUT_V_NONARCH;
        if (!jnum(jget(P, "p"), &x) || x < 2) return fail(err, errn, "%s: residue characteristic p missing", v->name);
        v->p = (unsigned)x;
        v->e_mod = v->f_mod = v->e_K = v->f_K = 1;
        const char *rF = jstr(jget(P, "reductionOverF")), *rQ = jstr(jget(P, "reductionOverQ"));
        if (!rF) return fail(err, errn, "%s: reductionOverF missing", v->name);
        if (!strncmp(rF, "good", 4)) v->red = IUT_RED_GOOD;
        else if (!strncmp(rF, "multiplicative", 14)) v->red = IUT_RED_BAD_MULT;
        else if (!strncmp(rF, "additive", 8)) v->red = IUT_RED_BAD_ADD;
        else return fail(err, errn, "%s: unknown reductionOverF \"%s\"", v->name, rF);
        if (rQ && strncmp(rQ, "good", 4)) logf_Q += log((double)v->p);   /* bad over Q: enters the conductor */
        if (jnum(jget(P, "ordQ"), &x)) v->ordq = (unsigned)x;
        const jval *T = jget(P, "tateParameter");
        if (T && jull(jget(T, "unitModPD"), &u) && jnum(jget(T, "precision"), &x) && x >= 1) {
            unsigned prec = (unsigned)x;
            /* keep p^prec < 2^62 (mulmod); 8 digits of 109 is about 2^54 */
            while (prec > 1 && log((double)v->p) * prec > 61.0 * log(2.0)) prec--;
            v->q_prec = prec; v->q_unit = u % iut_pow_ull(v->p, prec);
            if (jnum(jget(T, "ord"), &x) && (unsigned)x != v->ordq) return fail(err, errn, "%s: tateParameter.ord %u ≠ ordQ %u", v->name, (unsigned)x, v->ordq);
            if (v->q_unit % v->p == 0) return fail(err, errn, "%s: the unit part of q_v is divisible by p", v->name);
        }
    }
    /* heights, differents: the file gives h(j); log d^{F_tpd} only if present (0 for F_tpd = Q).
     * log d^K is estimated as in iut_gen_from_abc: tame at the bad primes (≤ log p each), ≤ 2 log l at l. */
    if (jnum(jpath(root, "curve.j.weilHeight"), &x)) d->j_log_height = x;
    if (jnum(jpath(root, "F.logDifferentTpd"), &x)) d->logdF = x;
    d->logdK = d->logdF + logf_Q + 2.0 * log((double)d->l);
    /* hypotheses of Def 3.1 that the file proves or records */
    d->h_F_galois_over_Fmod     = jtruthy(jpath(root, "F.galoisOverFmod")) && jtruthy(jpath(root, "F.degreePrimeToL"));
    d->h_F_contains_six_torsion = jtruthy(jpath(root, "F.sixTorsionRational")) && jtruthy(jpath(root, "F.containsSqrtMinus1"));
    d->h_image_contains_SL2     = jtruthy(jpath(root, "l.SL2.proved"));
    d->h_stable_reduction       = jtruthy(jpath(root, "F.stableReduction"));
    d->h_CK_is_K_core           = jtruthy(jpath(root, "C_K.kCore"));
    /* the file's own derived numbers, for the cross-check in `iut pipeline` */
    double a, b, c, h;
    if (jnum(jpath(root, "derived.logQ"), &a) && jnum(jpath(root, "derived.absLogQ"), &b) &&
        jnum(jpath(root, "derived.logCond"), &c) && jnum(jpath(root, "derived.htFromQ"), &h)) {
        d->have_expected = 1; d->expected_logq = a; d->expected_abslogq = b; d->expected_logcond = c; d->expected_ht = h;
    }
    iut_data_finish(d);
    /* V^bad_mod as listed in the file must be exactly the odd places of bad multiplicative reduction */
    const jval *vb = jget(root, "VbadMod");
    if (vb && vb->type == J_ARR) {
        unsigned listed = 0;
        for (unsigned k = 0; k < vb->n; ++k) {
            if (!jnum(jget(vb->items[k], "p"), &x)) continue;
            listed++;
            int found = 0;
            for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].p == (unsigned)x && d->V[i].in_Vbad_mod) found = 1;
            if (!found) return fail(err, errn, "VbadMod lists p = %u, but that place is not odd of bad multiplicative reduction over F", (unsigned)x);
        }
        unsigned have = 0; for (unsigned i = 0; i < d->nV; ++i) have += (unsigned)d->V[i].in_Vbad_mod;
        if (have != listed) return fail(err, errn, "V.places has %u odd places of bad multiplicative reduction, VbadMod lists %u", have, listed);
    }
    return 0;
}

int iut_data_from_json_text(iut_initial_theta_data *d, const char *text, char *err, size_t errn)
{
    jval *root = jparse(text, err, errn);
    if (!root) return -1;
    int rc = load(d, root, err, errn);
    jfree(root);
    return rc;
}

int iut_data_from_json_file(iut_initial_theta_data *d, const char *path, char *err, size_t errn)
{
    FILE *f = fopen(path, "rb");
    if (!f) return fail(err, errn, "%s: %s", path, strerror(errno));
    size_t cap = 1 << 16, n = 0; char *buf = malloc(cap);
    if (!buf) { fclose(f); return fail(err, errn, "out of memory"); }
    for (;;) {
        if (n + 4096 + 1 > cap) { char *nb = realloc(buf, cap *= 2); if (!nb) { free(buf); fclose(f); return fail(err, errn, "out of memory"); } buf = nb; }
        size_t got = fread(buf + n, 1, 4096, f);
        n += got;
        if (got < 4096) break;
    }
    fclose(f);
    buf[n] = 0;
    int rc = iut_data_from_json_text(d, buf, err, errn);
    if (rc && strncmp(err, path, strlen(path))) {
        char tmp[256]; snprintf(tmp, sizeof tmp, "%s: %s", path, err); snprintf(err, errn, "%s", tmp);
    }
    free(buf);
    return rc;
}
