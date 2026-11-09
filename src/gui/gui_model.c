/*
 * gui_model.c — the pipeline of src/iut_pipeline.c as a state machine that advances one step at a time.
 *
 * Every number comes from the same library calls that `iut pipeline` makes, in the same order, so the
 * state after the last step is the state `iut pipeline` prints (`iut-gui --check` verifies that the
 * problem counts agree on every built-in example and every exact JSON example).  The one difference is
 * that the infinite H of stage 4 is built one link at a time, in the order iut_lattice_build_H applies
 * them, so the state of the lattice can be watched between links.
 */
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include "gui.h"

const gm_stage_info gm_stages[GS_COUNT] = {
    { "0", "initial Θ-data",            "[IUTchI] Def 3.1",          "InitialThetaData" },
    { "1", "conditions (a)–(f)",        "[IUTchI] Def 3.1",          "DefThreeOne" },
    { "2", "Hodge theaters",            "[IUTchI] §3–§6, Def 6.13",  "ThetaPmEllNFHodgeTheater" },
    { "3", "Gaussian monoids",          "[IUTchII] Cor 2.5, 3.5, 4.10", "PsiGau" },
    { "4", "log-theta-lattice",         "[IUTchIII] Def 1.1, 1.4, 3.8", "LogThetaLattice" },
    { "5", "multiradial rep., Cor 3.12", "[IUTchIII] Thm 3.11, Cor 3.12", "ThmThreeEleven" },
    { "6", "height bound",              "[IUTchIV] Thm 1.10, Cor 2.2", "ThmOneTen" },
    { "7", "cross-check",               "the JSON file",             "" },
};

/* ------------------------------------------------------------------ log */
void gm_logf(gm_model *m, const char *fmt, ...)
{
    char line[1024];
    va_list ap; va_start(ap, fmt); int n = vsnprintf(line, sizeof line, fmt, ap); va_end(ap);
    if (n < 0) return;
    size_t len = strlen(line);
    if (m->loglen + len + 2 > m->logcap) {
        size_t cap = m->logcap ? m->logcap * 2 : 4096;
        while (cap < m->loglen + len + 2) cap *= 2;
        char *p = realloc(m->log, cap); if (!p) return;
        m->log = p; m->logcap = cap;
    }
    memcpy(m->log + m->loglen, line, len); m->loglen += len;
    m->log[m->loglen++] = '\n'; m->log[m->loglen] = 0;
}

unsigned gm_bad_places(const iut_initial_theta_data *d, unsigned *out)
{
    unsigned n = 0;
    for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].in_Vbad_mod) out[n++] = i;
    return n;
}

/* copy ids are copy_base·1000 + 10·(place) + kind (src/iut_core.c), and copy_base grows by 100 per universe:
 * colour by id / 100000, so the copies of one universe share a colour and consecutive universes differ */
unsigned gm_copy_colour(unsigned id) { return ((id >= 100000 ? id / 100000 : id) * 7u) % 12u; }

/* --------------------------------------------------------- init / free */
void gm_init(gm_model *m)
{
    memset(m, 0, sizeof *m);
    m->rows = 2; m->horizontal = IUT_LINK_THETA_UNITSMODTORS_LGP; m->last_link = -1;
    for (int k = 0; k < GS_COUNT; ++k) m->ok[k] = -1;
}

static void free_state(gm_model *m)
{
    if (m->lat) { iut_lattice_free(m->lat); free(m->lat); m->lat = NULL; }
    free(m->mr); m->mr = NULL;
}

static void free_transcript(gm_model *m)
{
    for (int k = 0; k < GS_COUNT; ++k) { free(m->transcript[k]); m->transcript[k] = NULL; }
    free(m->transcript_head); free(m->transcript_tail); m->transcript_head = m->transcript_tail = NULL;
}

void gm_free(gm_model *m)
{
    free_state(m); free_transcript(m);
    free(m->log); m->log = NULL; m->loglen = m->logcap = 0;
}

/* run `iut pipeline` (text) once and cut its output at the "── stage N ──" rules */
static void make_transcript(gm_model *m)
{
    free_transcript(m);
    char *buf = NULL; size_t len = 0;
    FILE *f = open_memstream(&buf, &len);
    if (!f) return;
    m->pipeline_problems = iut_pipeline_run(f, &m->data, m->rows, m->horizontal, 0);
    fclose(f);
    if (!buf) return;
    const char *cut[GS_COUNT + 1] = { 0 };
    for (int k = 0; k < GS_COUNT; ++k) {
        char key[32]; snprintf(key, sizeof key, "── stage %d ──", k);
        cut[k] = strstr(buf, key);
    }
    const char *tail = strstr(buf, "\npipeline ");
    if (tail) ++tail;
    const char *end = buf + len;
    const char *first = cut[0] ? cut[0] : (tail ? tail : end);
    m->transcript_head = strndup(buf, (size_t)(first - buf));
    for (int k = 0; k < GS_COUNT; ++k) {
        if (!cut[k]) continue;
        const char *e = tail ? tail : end;
        for (int j = k + 1; j < GS_COUNT; ++j) if (cut[j]) { e = cut[j]; break; }
        m->transcript[k] = strndup(cut[k], (size_t)(e - cut[k]));
    }
    m->transcript_tail = strdup(tail ? tail : "");
    free(buf);
}

/* the links of the infinite H in the order iut_lattice_build_H applies them */
static void make_plan(gm_model *m)
{
    m->nplan = 0;
    for (int col = 0; col <= 1; ++col)
        for (int r = -m->rows; r < m->rows; ++r) m->plan[m->nplan++] = (gm_planned_link){ 0, col, r };
    m->plan[m->nplan++] = (gm_planned_link){ 1, 0, 0 };
}

void gm_reset(gm_model *m)
{
    free_state(m);
    m->reached = 0; m->view = 0; m->done_links = 0; m->last_link = -1; m->explored = 0;
    m->sel_n = 0; m->sel_m = 0;
    for (int k = 0; k < GS_COUNT; ++k) m->ok[k] = -1;
    memset(&m->rdata, 0, sizeof m->rdata); memset(&m->rht, 0, sizeof m->rht); memset(&m->rlat, 0, sizeof m->rlat);
    m->nitems = 0; m->nc312 = 0; m->c312ok = 0; m->nxc = 0; m->xbad = 0;
    make_plan(m);
    m->log_mark = m->loglen;
}

void gm_load(gm_model *m, const iut_initial_theta_data *d, int rows, iut_link_kind horizontal, const long long *abc, const char *source)
{
    m->data = *d;
    m->rows = rows < 1 ? 1 : rows > IUT_LAT_MOFF ? IUT_LAT_MOFF : rows;
    m->horizontal = horizontal;
    m->loaded = 1;
    snprintf(m->source, sizeof m->source, "%s", source ? source : "");
    long long t[3];
    m->have_abc = 0;
    if (abc) m->have_abc = !gm_abc_analyse(&m->abc, abc[0], abc[1], abc[2]);
    else if (!gm_abc_from_data(d, t)) m->have_abc = !gm_abc_analyse(&m->abc, t[0], t[1], t[2]);
    make_transcript(m);
    m->loglen = 0; if (m->log) m->log[0] = 0;
    gm_reset(m);
    gm_logf(m, "loaded %s  —  %s, l = %u, %u places, H of rows ±%d, horizontal %s",
            m->data.name, m->source, m->data.l, m->data.nV, m->rows, iut_link_kind_notation(m->horizontal));
    m->log_mark = 0;
}

int gm_current_stage(const gm_model *m) { return m->reached; }

int gm_problems(const gm_model *m)
{
    int p = 0;
    if (m->reached > GS_DEF) p += (int)m->rdata.errors;
    if (m->reached > GS_HT)  p += (int)m->rht.errors;
    if (m->reached > GS_LAT) p += (int)m->rlat.errors;
    if (m->reached > GS_MR)  p += !m->c312ok;
    if (m->reached > GS_XC)  p += (int)m->xbad;
    return p;
}

void gm_progress(const gm_model *m, char *buf, size_t n)
{
    if (!m->loaded) { snprintf(buf, n, "no data loaded"); return; }
    if (m->reached >= GS_COUNT) {
        snprintf(buf, n, "pipeline %s: %d problem(s)%s", gm_problems(m) ? "FAILED" : "complete", gm_problems(m),
                 m->explored ? "  ·  exploring the lattice" : "");
        return;
    }
    if (m->reached == 0) { snprintf(buf, n, "ready: step to run stage 0"); return; }
    if (m->reached == GS_LAT && m->done_links > 0)
        snprintf(buf, n, "stage 4: %d of %d links of the infinite H applied", m->done_links, m->nplan);
    else
        snprintf(buf, n, "stages 0–%d done; next: stage %d, %s", m->reached - 1, m->reached, gm_stages[m->reached].title);
}

/* ------------------------------------------------------------ the steps */
static void stage_data(gm_model *m)
{
    const iut_initial_theta_data *d = &m->data;
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    char vb[256] = ""; size_t o = 0;
    for (unsigned k = 0; k < nbad && o + 24 < sizeof vb; ++k) o += (size_t)snprintf(vb + o, sizeof vb - o, "%s%s", k ? ", " : "", d->V[bad[k]].name);
    gm_logf(m, "[stage 0] initial Θ-data (F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲): %s; l = %u (l* = %u, l± = %u); V has %u places; V^bad_mod = {%s}; ε̲ = the cusp ±%d",
            d->curve, d->l, d->lstar, d->lpm, d->nV, vb, d->epsilon);
    gm_logf(m, "          log q = %.6f   |log q| = log q / 2l = %.6f   ht = log q / 6 = %.6f", iut_log_q(d), iut_log_q(d) / (2.0 * d->l), iut_height_from_q(d));
    m->ok[GS_DATA] = nbad > 0;
}

static void stage_def(gm_model *m)
{
    memset(&m->rdata, 0, sizeof m->rdata);
    iut_validate_data(&m->data, &m->rdata);
    m->nitems = iut_def_three_one_check(&m->data, m->items, 8, NULL);
    unsigned good = 0; for (unsigned k = 0; k < m->nitems; ++k) good += m->items[k].ok != 0;
    gm_logf(m, "[stage 1] Def 3.1: %u of %u conditions hold; validation %u error(s), %u warning(s) in %u checks",
            good, m->nitems, m->rdata.errors, m->rdata.warnings, m->rdata.n);
    for (unsigned k = 0; k < m->nitems; ++k) if (!m->items[k].ok) gm_logf(m, "          ✗ %s %s", m->items[k].item, m->items[k].detail);
    m->ok[GS_DEF] = m->rdata.errors == 0;
}

static void stage_ht(gm_model *m)
{
    m->lat = calloc(1, sizeof *m->lat);
    if (!m->lat) return;
    iut_lattice_init(m->lat, &m->data, m->horizontal);            /* creates (0,0) */
    /* the other vertices of the H, in the order iut_lattice_build_H creates them (so universe and copy ids agree) */
    for (int col = 0; col <= 1; ++col) for (int r = -m->rows; r <= m->rows; ++r) iut_lattice_get(m->lat, col, r);
    iut_hodge_theater *ht = iut_lattice_get(m->lat, 0, 0);
    memset(&m->rht, 0, sizeof m->rht);
    iut_validate_hodge_theater(ht, &m->rht);
    unsigned nht = 0; for (int i = 0; i < IUT_LAT_N; ++i) for (int j = 0; j < IUT_LAT_M; ++j) nht += m->lat->ht[i][j] != NULL;
    gm_logf(m, "[stage 2] built %u Θ±ell NF-Hodge theaters (columns n = 0, 1; rows %d..%d), each in its own universe; none linked yet",
            nht, -m->rows, m->rows);
    gm_logf(m, "          (0,0): capsule F_T of %u F-prime-strips, capsule F_J of %u; Θ±-bridge %s Θell-bridge %s Θ-bridge %s NF-bridge %s; glued 0,⊞ ↦ > %s; %u error(s) in %u checks",
            ht->pmell.nT, ht->nf.nJ, ht->pmell.theta_pm_bridge_ok ? "✓" : "✗", ht->pmell.theta_ell_bridge_ok ? "✓" : "✗",
            ht->nf.theta_bridge_ok ? "✓" : "✗", ht->nf.nf_bridge_ok ? "✓" : "✗", ht->glued ? "✓" : "✗", m->rht.errors, m->rht.n);
    m->ok[GS_HT] = m->rht.errors == 0;
}

static void stage_gau(gm_model *m)
{
    const iut_initial_theta_data *d = &m->data;
    iut_pilot_make(d, IUT_PILOT_Q, &m->qp); iut_pilot_make(d, IUT_PILOT_THETA, &m->tp);
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    gm_logf(m, "[stage 3] Gaussian monoids Ψ_gau = O× · (q̲_v^{j²})_{j=1..%u} at %u place(s) of V^bad_mod; q-pilot −|log q| = %.6f, Θ-pilot −(l(l+1)/12)·|log q| = %.6f",
            d->lstar, nbad, m->qp.log_volume, m->tp.log_volume);
    m->ok[GS_GAU] = nbad > 0;
}

static void lattice_link_step(gm_model *m)
{
    gm_planned_link *p = &m->plan[m->done_links];
    const iut_link *L = p->theta ? iut_apply_theta_link(m->lat, p->n, p->m) : iut_apply_log_link(m->lat, p->n, p->m);
    m->done_links++;
    m->last_link = L ? (int)(L - m->lat->links) : -1;
    if (L) {
        iut_hodge_theater *dom = iut_lattice_get(m->lat, L->dom_n, L->dom_m), *cod = iut_lattice_get(m->lat, L->cod_n, L->cod_m);
        if (p->theta)
            gm_logf(m, "[stage 4] link %d/%d: %s (%d,%d) → (%d,%d) glues %s-prime-strips; shares G_v and O×μ, Π_v stays alien (#%u vs #%u); dilation l(l+1)/12 = %.4f",
                    m->done_links, m->nplan, iut_link_kind_notation(L->kind), L->dom_n, L->dom_m, L->cod_n, L->cod_m,
                    iut_ps_kind_notation(L->glued_kind), dom->nf.FGt.loc[0].Pi_copy, cod->nf.FGt.loc[0].Pi_copy, L->dilation);
        else
            gm_logf(m, "[stage 4] link %d/%d: log-link (%d,%d) → (%d,%d): Π_v of (%d,%d) is now copy #%u (shared: vertical coricity); %u log-shells built at (%d,%d)",
                    m->done_links, m->nplan, L->dom_n, L->dom_m, L->cod_n, L->cod_m, L->cod_n, L->cod_m, cod->nf.FGt.loc[0].Pi_copy,
                    cod->nshell, L->cod_n, L->cod_m);
        m->sel_n = L->cod_n; m->sel_m = L->cod_m;
    }
    if (m->done_links >= m->nplan) {
        memset(&m->rlat, 0, sizeof m->rlat);
        iut_validate_lattice(m->lat, &m->rlat);
        m->lat->focus_n = 0; m->lat->focus_m = 0;
        m->sel_n = 0; m->sel_m = 0;
        gm_logf(m, "[stage 4] the infinite H is built: %u links; lattice validation %u error(s) in %u checks", m->lat->nlinks, m->rlat.errors, m->rlat.n);
        m->ok[GS_LAT] = m->rlat.errors == 0;
        m->reached = GS_LAT + 1;
    }
}

static void stage_mr(gm_model *m)
{
    m->mr = calloc(1, sizeof *m->mr);
    if (!m->mr) return;
    iut_multiradial_full_build(m->lat, 0, m->mr);
    m->nc312 = iut_cor312_steps(m->lat, m->c312, 8);
    m->c312ok = iut_cor312_holds(m->lat);
    gm_logf(m, "[stage 5] multiradial representation of column 0: %u tensor packets, %u splitting monoids, %u copies of F_mod^×; (Ind1) %llu perms, (Ind2) %llu summands, (Ind3) %s",
            m->mr->npackets, m->mr->nsplitting, m->mr->nnumberfields, m->mr->ind1_count, m->mr->ind2_summands, m->mr->ind3 ? "✓" : "✗");
    gm_logf(m, "          Cor 3.12: −|log Θ| ≥ −|log q| %s", m->c312ok ? "holds ✓" : "FAILS ✗");
    m->ok[GS_MR] = m->c312ok;
}

static void stage_hb(gm_model *m)
{
    iut_thm110_compute(&m->data, &m->T);
    iut_cor22_compute(&m->data, &m->C);
    gm_logf(m, "[stage 6] Thm 1.10: (1/6) log q = %.6f ≤ %.6g %s;  Cor 2.2: l = %u %s [%.3f, %.4g], (C2) %s",
            m->T.lhs, m->T.rhs, m->T.inequality_holds ? "✓" : "✗", m->data.l, m->C.l_in_range ? "in" : "outside", m->C.l_min, m->C.l_max, m->C.holds ? "✓" : "✗");
    m->ok[GS_HB] = m->T.inequality_holds;
}

static void stage_xc(gm_model *m)
{
    const iut_initial_theta_data *d = &m->data;
    m->nxc = 0; m->xbad = 0;
    if (d->have_expected) {
        double lq = iut_log_q(d);
        m->xc[m->nxc++] = (gm_xcheck){ "log(q)  = Σ_{V^bad_mod} ord(q_v) log p_v", lq, d->expected_logq, 0 };
        m->xc[m->nxc++] = (gm_xcheck){ "|log(q)| = log(q)/2l", lq / (2.0 * d->l), d->expected_abslogq, 0 };
        m->xc[m->nxc++] = (gm_xcheck){ "log(f) over V^bad_mod", iut_log_cond_bad(d), d->expected_logcond, 0 };
        m->xc[m->nxc++] = (gm_xcheck){ "ht = log(q)/6", iut_height_from_q(d), d->expected_ht, 0 };
        for (unsigned k = 0; k < m->nxc; ++k) { m->xc[k].ok = fabs(m->xc[k].toolkit - m->xc[k].file) < 5e-6; m->xbad += !m->xc[k].ok; }
        gm_logf(m, "[stage 7] cross-check with %s.json: %u of %u numbers agree", d->source_id, m->nxc - m->xbad, m->nxc);
        m->ok[GS_XC] = m->xbad == 0;
    } else {
        gm_logf(m, "[stage 7] no cross-check: the data was generated by the toolkit, not read from a JSON file");
        m->ok[GS_XC] = 2;
    }
    int p = gm_problems(m);
    gm_logf(m, "pipeline %s: %d problem(s)  (Def 3.1: %u, Hodge theater: %u, lattice: %u, Cor 3.12: %s, cross-check: %u)",
            p ? "FAILED" : "complete", p, m->rdata.errors, m->rht.errors, m->rlat.errors, m->c312ok ? "holds" : "fails", m->xbad);
}

int gm_step(gm_model *m)
{
    if (!m->loaded || m->reached >= GS_COUNT) return 0;
    m->log_mark = m->loglen;
    int s = m->reached;
    switch (s) {
    case GS_DATA: stage_data(m); break;
    case GS_DEF:  stage_def(m); break;
    case GS_HT:   stage_ht(m); break;
    case GS_GAU:  stage_gau(m); break;
    case GS_LAT:  lattice_link_step(m); m->view = GS_LAT; return 1;   /* advances `reached` itself */
    case GS_MR:   stage_mr(m); break;
    case GS_HB:   stage_hb(m); break;
    case GS_XC:   stage_xc(m); break;
    }
    m->reached = s + 1;
    m->view = s;
    return 1;
}

void gm_run_all(gm_model *m)
{
    size_t mark = m->loglen;
    while (gm_step(m)) {}
    m->log_mark = mark;
}

/* ------------------------------------------------------ exploration */
int gm_explore_log(gm_model *m, int n, int mm)
{
    if (m->reached < GS_COUNT || !m->lat || !iut_lattice_in_range(n, mm) || !iut_lattice_in_range(n, mm + 1)) return -1;
    m->log_mark = m->loglen;
    const iut_link *L = iut_apply_log_link(m->lat, n, mm);
    if (!L) return -1;
    m->last_link = (int)(L - m->lat->links); m->explored++;
    iut_hodge_theater *cod = iut_lattice_get(m->lat, n, mm + 1);
    gm_logf(m, "[explore] log-link (%d,%d) → (%d,%d): Π_v copy #%u carried up, %u log-shells at (%d,%d); %u links in the lattice",
            n, mm, n, mm + 1, cod->nf.FGt.loc[0].Pi_copy, cod->nshell, n, mm + 1, m->lat->nlinks);
    m->sel_n = n; m->sel_m = mm + 1;
    return 0;
}

int gm_explore_theta(gm_model *m, int n, int mm)
{
    if (m->reached < GS_COUNT || !m->lat || !iut_lattice_in_range(n, mm) || !iut_lattice_in_range(n + 1, mm)) return -1;
    m->log_mark = m->loglen;
    const iut_link *L = iut_apply_theta_link(m->lat, n, mm);
    if (!L) return -1;
    m->last_link = (int)(L - m->lat->links); m->explored++;
    iut_hodge_theater *dom = iut_lattice_get(m->lat, n, mm), *cod = iut_lattice_get(m->lat, n + 1, mm);
    gm_logf(m, "[explore] %s (%d,%d) → (%d,%d): O×μ shared, Π_v alien (#%u vs #%u); %u links in the lattice",
            iut_link_kind_notation(L->kind), n, mm, n + 1, mm, dom->nf.FGt.loc[0].Pi_copy, cod->nf.FGt.loc[0].Pi_copy, m->lat->nlinks);
    m->sel_n = n + 1; m->sel_m = mm;
    return 0;
}

/* --------------------------------------------------------------- abc */
static unsigned factor(unsigned long long x, gm_factor *f, int *probable)
{
    unsigned n = 0;
    for (unsigned long long p = 2; p * p <= x && p <= 3037000ULL; p += (p == 2 ? 1 : 2)) {
        if (x % p) continue;
        unsigned e = 0; while (x % p == 0) { x /= p; ++e; }
        if (n < GM_MAX_FACTORS) f[n++] = (gm_factor){ p, e };
    }
    if (x > 1) {
        if (x > 3037000ULL * 3037000ULL) *probable = 1;
        if (n < GM_MAX_FACTORS) f[n++] = (gm_factor){ x, 1 };
    }
    return n;
}

static long long gcdll(long long a, long long b) { while (b) { long long t = a % b; a = b; b = t; } return a < 0 ? -a : a; }

int gm_abc_analyse(gm_abc *x, long long a, long long b, long long c)
{
    memset(x, 0, sizeof *x);
    if (a <= 0 || b <= 0 || c <= 0 || a + b != c || gcdll(a, b) != 1) return -1;
    x->a = a; x->b = b; x->c = c;
    long long v[3] = { a, b, c };
    x->log_rad = 0;
    for (int k = 0; k < 3; ++k) {
        x->nf[k] = factor((unsigned long long)v[k], x->f[k], &x->probable);
        for (unsigned i = 0; i < x->nf[k]; ++i) x->log_rad += log((double)x->f[k][i].p);
    }
    x->log_c = log((double)c);
    x->quality = x->log_rad > 0 ? x->log_c / x->log_rad : 0;
    return 0;
}

int gm_abc_from_data(const iut_initial_theta_data *d, long long *abc)
{
    long long a, b, c;
    if (d->from_json && sscanf(d->source_id, "frey-%lld-%lld-%lld", &a, &b, &c) == 3 && a + b == c) { abc[0] = a; abc[1] = b; abc[2] = c; return 0; }
    if (sscanf(d->name, "abc(%lld,%lld,%lld)", &a, &b, &c) == 3 && a + b == c) { abc[0] = a; abc[1] = b; abc[2] = c; return 0; }
    return -1;
}

unsigned gm_suggest_l(long long a, long long b, long long c)
{
    iut_initial_theta_data *d = malloc(sizeof *d);
    if (!d) return 0;
    unsigned best = 0;
    for (unsigned l = 5; l <= IUT_MAX_L && !best; ++l) {
        if (!iut_is_prime(l) || iut_gen_from_abc(d, a, b, c, l)) continue;
        iut_report r; memset(&r, 0, sizeof r);
        iut_validate_data(d, &r);
        if (!r.errors) best = l;
    }
    free(d);
    return best;
}
