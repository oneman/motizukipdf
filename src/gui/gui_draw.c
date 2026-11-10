/*
 * gui_draw.c — Cairo + Pango drawing for iut-gui: one picture per pipeline stage, the log-theta-lattice,
 * the abc triple and the stage rail.  Every number drawn is read from the gm_model (gui_model.c), which
 * holds the very structs the C library built; nothing here computes mathematics of its own beyond
 * scaling bars.
 *
 * Colours follow the web app (htdocs/js/draw.js): blue = étale-like, orange = Frobenius-like / bad places,
 * violet = holomorphic / archimedean, teal = mono-analytic, green = went through, red = failed.
 */
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include <pango/pangocairo.h>
#include "gui_draw.h"

/* ------------------------------------------------------------ palette */
typedef struct { double r, g, b; } col;
static col hex(unsigned h) { return (col){ ((h >> 16) & 255) / 255.0, ((h >> 8) & 255) / 255.0, (h & 255) / 255.0 }; }
#define INK     hex(0x17202d)
#define INK2    hex(0x4b5563)
#define INK3    hex(0x8a94a6)
#define LINE    hex(0xc9d2df)
#define PAPER   hex(0xffffff)
#define PAPER2  hex(0xf6f8fb)
#define PAPER3  hex(0xeef2f7)
#define BLUE    hex(0x2563eb)
#define BLUEBG  hex(0xe8f0fe)
#define ORANGE  hex(0xea580c)
#define ORANGEBG hex(0xfff1e6)
#define GREEN   hex(0x15803d)
#define GREENBG hex(0xe7f7ec)
#define VIOLET  hex(0x7c3aed)
#define VIOLETBG hex(0xf1ebfe)
#define TEAL    hex(0x0f766e)
#define TEALBG  hex(0xe3f6f3)
#define RED     hex(0xdc2626)
#define REDBG   hex(0xfde8e8)
#define YELLOW  hex(0xb45309)
#define YELLOWBG hex(0xfff8e1)
#define PINK    hex(0xbe185d)
#define PINKBG  hex(0xfce7f3)

/* 12 well-separated colours for copy ids (universes, basepoints, Π_v copies) */
static const unsigned COPY_PAL[12] = {
    0x2563eb, 0xea580c, 0x15803d, 0x7c3aed, 0x0891b2, 0xdb2777, 0xca8a04, 0xdc2626, 0x0d9488, 0x92400e, 0x475569, 0x65a30d };
static col copy_col(unsigned id) { return hex(COPY_PAL[gm_copy_colour(id)]); }
/* one colour per label j ∈ F_l^* (j = 0: grey) */
static col label_col(int j)
{
    if (j < 0) j = -j;
    if (j == 0) return INK3;
    static const unsigned P[10] = { 0x2563eb, 0xea580c, 0x15803d, 0x7c3aed, 0xdb2777, 0x0891b2, 0xca8a04, 0x4f46e5, 0x0d9488, 0xc2410c };
    return hex(P[(j - 1) % 10]);
}

static void rgb(cairo_t *cr, col c) { cairo_set_source_rgb(cr, c.r, c.g, c.b); }
static void rgba(cairo_t *cr, col c, double a) { cairo_set_source_rgba(cr, c.r, c.g, c.b, a); }

/* --------------------------------------------------------------- text */
enum { TX_BOLD = 1, TX_MONO = 2, TX_CENTER = 4, TX_RIGHT = 8, TX_MIDDLE = 16, TX_MARKUP = 32, TX_ITALIC = 64, TX_SERIF = 128, TX_ELLIPSIZE = 256 };

/* draw s with its top-left (or top-centre / top-right, or middle with TX_MIDDLE) at x, y.  wrap > 0 wraps
 * (or with TX_ELLIPSIZE cuts) the text at that width.  Returns the height; *wout gets the width. */
static double txx(cairo_t *cr, double x, double y, double size, int fl, col c, double wrap, const char *s, double *wout)
{
    if (!s || !*s) { if (wout) *wout = 0; return 0; }
    PangoLayout *L = pango_cairo_create_layout(cr);
    PangoFontDescription *fd = pango_font_description_from_string(fl & TX_MONO ? "DejaVu Sans Mono" : fl & TX_SERIF ? "DejaVu Serif" : "DejaVu Sans");
    pango_font_description_set_absolute_size(fd, size * PANGO_SCALE);
    if (fl & TX_BOLD) pango_font_description_set_weight(fd, PANGO_WEIGHT_BOLD);
    if (fl & TX_ITALIC) pango_font_description_set_style(fd, PANGO_STYLE_ITALIC);
    pango_layout_set_font_description(L, fd);
    if (wrap > 0) {
        pango_layout_set_width(L, (int)(wrap * PANGO_SCALE));
        if (fl & TX_ELLIPSIZE) pango_layout_set_ellipsize(L, PANGO_ELLIPSIZE_END);
        else pango_layout_set_wrap(L, PANGO_WRAP_WORD_CHAR);
        if (fl & TX_CENTER) pango_layout_set_alignment(L, PANGO_ALIGN_CENTER);
    }
    if (fl & TX_MARKUP) pango_layout_set_markup(L, s, -1); else pango_layout_set_text(L, s, -1);
    int pw, ph; pango_layout_get_pixel_size(L, &pw, &ph);
    double dx = 0;
    if (wrap > 0 && (fl & TX_CENTER)) dx = -wrap / 2;
    else if (fl & TX_CENTER) dx = -pw / 2.0;
    else if (fl & TX_RIGHT) dx = -pw;
    double dy = (fl & TX_MIDDLE) ? -ph / 2.0 : 0;
    rgb(cr, c);
    cairo_move_to(cr, x + dx, y + dy);
    pango_cairo_show_layout(cr, L);
    pango_font_description_free(fd);
    g_object_unref(L);
    if (wout) *wout = (wrap > 0 && !(fl & TX_ELLIPSIZE)) ? wrap : pw;
    return ph;
}
static double tx(cairo_t *cr, double x, double y, double size, int fl, col c, const char *s) { double w; txx(cr, x, y, size, fl, c, 0, s, &w); return w; }
static double txw(cairo_t *cr, double x, double y, double size, int fl, col c, double wrap, const char *s) { return txx(cr, x, y, size, fl, c, wrap, s, NULL); }
static double txf(cairo_t *cr, double x, double y, double size, int fl, col c, const char *fmt, ...) __attribute__((format(printf, 7, 8)));
static double txf(cairo_t *cr, double x, double y, double size, int fl, col c, const char *fmt, ...)
{
    char b[1024]; va_list ap; va_start(ap, fmt); vsnprintf(b, sizeof b, fmt, ap); va_end(ap);
    return tx(cr, x, y, size, fl, c, b);
}
/* -------------------------------------------------------------- shapes */
static void rpath(cairo_t *cr, double x, double y, double w, double h, double r)
{
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    cairo_new_sub_path(cr);
    cairo_arc(cr, x + w - r, y + r, r, -M_PI / 2, 0);
    cairo_arc(cr, x + w - r, y + h - r, r, 0, M_PI / 2);
    cairo_arc(cr, x + r, y + h - r, r, M_PI / 2, M_PI);
    cairo_arc(cr, x + r, y + r, r, M_PI, 3 * M_PI / 2);
    cairo_close_path(cr);
}
static void box(cairo_t *cr, double x, double y, double w, double h, double r, const col *fill, const col *stroke, double lw)
{
    rpath(cr, x, y, w, h, r);
    if (fill) { rgb(cr, *fill); if (stroke) cairo_fill_preserve(cr); else cairo_fill(cr); }
    if (stroke) { rgb(cr, *stroke); cairo_set_line_width(cr, lw); cairo_stroke(cr); }
}
static void boxc(cairo_t *cr, double x, double y, double w, double h, double r, col fill, col stroke) { box(cr, x, y, w, h, r, &fill, &stroke, 1); }
static void boxf(cairo_t *cr, double x, double y, double w, double h, double r, col fill) { box(cr, x, y, w, h, r, &fill, NULL, 0); }

static void arrow(cairo_t *cr, double x1, double y1, double x2, double y2, col c, double lw, int dashed, double head)
{
    double a = atan2(y2 - y1, x2 - x1);
    rgb(cr, c); cairo_set_line_width(cr, lw);
    if (dashed) { double d[] = { 5, 4 }; cairo_set_dash(cr, d, 2, 0); }
    cairo_move_to(cr, x1, y1); cairo_line_to(cr, x2 - cos(a) * head * 0.6, y2 - sin(a) * head * 0.6); cairo_stroke(cr);
    cairo_set_dash(cr, NULL, 0, 0);
    if (head > 0) {
        cairo_move_to(cr, x2, y2);
        cairo_line_to(cr, x2 - head * cos(a - 0.42), y2 - head * sin(a - 0.42));
        cairo_line_to(cr, x2 - head * cos(a + 0.42), y2 - head * sin(a + 0.42));
        cairo_close_path(cr); cairo_fill(cr);
    }
}
static void line(cairo_t *cr, double x1, double y1, double x2, double y2, col c, double lw)
{
    rgb(cr, c); cairo_set_line_width(cr, lw); cairo_move_to(cr, x1, y1); cairo_line_to(cr, x2, y2); cairo_stroke(cr);
}
static void disc(cairo_t *cr, double x, double y, double r, col fill, const col *stroke, double lw)
{
    cairo_new_sub_path(cr); cairo_arc(cr, x, y, r, 0, 2 * M_PI);
    rgb(cr, fill); if (stroke) { cairo_fill_preserve(cr); rgb(cr, *stroke); cairo_set_line_width(cr, lw); cairo_stroke(cr); } else cairo_fill(cr);
}

/* a pill: ✓ text (green), ✗ text (red), or · text (grey); returns its width */
static double pill(cairo_t *cr, double x, double y, int ok, const char *text)
{
    double w; txx(cr, 0, -1000, 11.5, TX_BOLD, INK, 0, text, &w);
    col bg = ok == 1 ? GREENBG : ok == 0 ? REDBG : PAPER3, fg = ok == 1 ? GREEN : ok == 0 ? RED : INK2;
    boxf(cr, x, y, w + 30, 22, 11, bg);
    tx(cr, x + 9, y + 3, 11.5, TX_BOLD, fg, ok == 1 ? "✓" : ok == 0 ? "✗" : "·");
    tx(cr, x + 22, y + 3, 11.5, TX_BOLD, fg, text);
    return w + 30;
}

static double paragraph(cairo_t *cr, double x, double y, double w, const char *s)
{
    return txw(cr, x, y, 13, 0, INK2, w, s) + 10;
}

/* a section heading with a thin rule */
static double heading(cairo_t *cr, double x, double y, double w, const char *s, const char *ref)
{
    tx(cr, x, y, 14, TX_BOLD, INK, s);
    if (ref) tx(cr, x + w, y + 2, 11.5, TX_RIGHT, INK3, ref);
    line(cr, x, y + 22, x + w, y + 22, LINE, 1);
    return 30;
}

/* ---------------------------------------------------- stage descriptions */
static const char *STAGE_TEXT[GS_COUNT] = {
    "The initial Θ-data fixes everything the theory works on: an elliptic curve E over a number field F, a prime l, "
    "the field K = F(E[l]) of l-torsion, the orbicurve C̲_K, a choice V of one place above each place of F_mod, the bad "
    "places V^bad_mod where E has split multiplicative reduction with Tate parameter q_v, and a cusp ε̲. For an abc "
    "triple a + b = c the curve is the Frey curve y² = x(x − a)(x + b), whose bad places are the primes dividing abc.",
    "Def 3.1 asks six conditions (a)–(f) of this data. The ones about numbers (l prime ≥ 5, prime to the residue "
    "characteristics and to the orders of q_v; V^bad_mod not empty; ε̲ from a nonzero label) are checked by the program. "
    "The Galois-theoretic ones (SL₂ in the image, stable reduction, C_K a K-core) are recorded as asserted flags.",
    "A Θ±ell NF-Hodge theater is a bookkeeping device made of prime-strips: collections, indexed by the places in V, of "
    "local Galois groups Π_v with the monoids O▷ acting on them. Its Θ±ell half has one F-prime-strip for each label "
    "t ∈ F_l, with the additive symmetry F_l^{⋊±}; its ΘNF half has one for each j ∈ F_l^*, with the multiplicative "
    "symmetry F_l^*. The gluing sends ±t to j = |t|, and 0 and ⊞ to >. Every vertex of the lattice is such a theater, in "
    "its own universe; this page shows the selected one.",
    "At each bad place the theta function evaluated at the l-torsion points t ∈ F_l gives q̲_v^{t²} (with q̲_v = q_v^{1/2l}) "
    "up to roots of unity: it depends on |t| only. These values generate the Gaussian monoid Ψ_gau, whose value group is "
    "the procession of the j²-th multiples of ord(q̲_v), j = 1..l*. The bars show ord(q̲_v^{j²}); the digits are the "
    "actual p-adic unit of q_v^{j²} when the Tate parameter is known.",
    "The log-theta-lattice has a Hodge theater at every point (n, m). Vertical log-links (n, m) → (n, m+1) identify the "
    "étale-like data Π_v (vertical coricity) and build log-shells; the horizontal Θ×μ_LGP-link identifies only the units "
    "O×μ and the groups G_v, so the Π_v on its two sides are mutually alien copies. The fill colour of a vertex is the copy "
    "of Π_v it holds: each column takes one colour as its log-links are applied, and the two columns stay different.",
    "Thm 3.11 describes the Θ-pilot of column 0 using only what the Θ-link shares, up to three indeterminacies: tensor "
    "packets of log-shells over the processions S±_{j+1}, the splitting monoids of the LGP-monoids, and copies of F_mod^×. "
    "Cor 3.12 compares the procession-normalized log-volumes: −|log Θ| ≥ −|log q|.",
    "Thm 1.10 turns Cor 3.12 into a bound on the height of the curve: (1/6)·log q is at most (1 + 20·d_mod/l) times the "
    "log-different plus the log-conductor, plus constants. For curves this small the constant η_prm = 5·10²⁰ dominates, "
    "so the bound holds and says nothing sharper than that. The scales below are logarithmic.",
    "When the initial Θ-data was read from a JSON file of docs/initial-theta-data/, the numbers stored in the file itself "
    "(computed independently by scripts/infographic/initialtheta-data.js) are compared with the toolkit's.",
};

/* ------------------------------------------------------------ title */
static double stage_title(cairo_t *cr, double W, const gm_model *m, int s)
{
    char t[160]; snprintf(t, sizeof t, "stage %s — %s", gm_stages[s].num, gm_stages[s].title);
    tx(cr, 20, 14, 19, TX_BOLD, INK, t);
    tx(cr, W - 20, 19, 12, TX_RIGHT, INK3, gm_stages[s].ref);
    int ok = m->ok[s];
    if (m->reached > s) pill(cr, 20, 44, ok == 2 ? -1 : ok, ok == 2 ? "skipped" : ok ? "went through" : "failed");
    else if (s == GS_LAT && m->reached == GS_LAT && m->done_links) { char b[64]; snprintf(b, sizeof b, "%d of %d links applied", m->done_links, m->nplan); pill(cr, 20, 44, -1, b); }
    else pill(cr, 20, 44, -1, "not run yet");
    if (m->data.name[0]) tx(cr, W - 20, 48, 12, TX_RIGHT | TX_MONO, INK2, m->data.name);
    return 76;
}

static double not_yet(cairo_t *cr, double W, double y, int s)
{
    boxc(cr, 20, y, W - 40, 70, 10, PAPER2, LINE);
    char b[200]; snprintf(b, sizeof b, "Stage %d has not run yet. Press Step (or Run all) to carry the data through it.", s);
    tx(cr, W / 2, y + 35, 14, TX_CENTER | TX_MIDDLE, INK2, b);
    return y + 90;
}

/* ============================================================ stage 0 */
static col place_col(const iut_valuation *v, col *bg)
{
    if (v->kind == IUT_V_ARCH) { *bg = VIOLETBG; return VIOLET; }
    if (v->red == IUT_RED_GOOD) { *bg = GREENBG; return GREEN; }
    if (v->red == IUT_RED_BAD_ADD) { *bg = PINKBG; return PINK; }
    if (v->in_Vbad_mod) { *bg = ORANGEBG; return ORANGE; }
    *bg = YELLOWBG; return YELLOW;
}

static double draw_data(cairo_t *cr, double W, const gm_model *m)
{
    const iut_initial_theta_data *d = &m->data;
    double y = stage_title(cr, W, m, GS_DATA);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_DATA]);
    if (m->reached <= GS_DATA) return not_yet(cr, W, y, GS_DATA);

    /* the tower of fields */
    double y0 = y + 6, tw = 250;
    const char *names[5] = { "F̄", "K = F(E[l])", "F", "F_mod = Q(j_E)", "Q" };
    char sub[5][80];
    snprintf(sub[0], 80, "algebraic closure");
    snprintf(sub[1], 80, "[K : Q] ≤ %llu", d->dK);
    snprintf(sub[2], 80, "[F : Q] ≤ %llu", d->dF);
    snprintf(sub[3], 80, "[F_mod : Q] = %u", d->dmod);
    snprintf(sub[4], 80, "rationals");
    for (int k = 0; k < 5; ++k) {
        double by = y0 + k * 52;
        col bg = k == 1 ? BLUEBG : k == 3 ? GREENBG : PAPER2;
        boxc(cr, 20, by, tw, 38, 8, bg, LINE);
        tx(cr, 32, by + 4, 13.5, TX_BOLD, INK, names[k]);
        tx(cr, 32, by + 21, 11, TX_MONO, INK2, sub[k]);
        if (k < 4) tx(cr, 20 + tw / 2, by + 39, 12, TX_CENTER, INK3, "∪");
    }
    /* the curve card */
    double cx = 20 + tw + 24, cw = W - cx - 20, cy = y0;
    boxc(cr, cx, cy, cw, 252, 10, PAPER, LINE);
    tx(cr, cx + 14, cy + 10, 12, TX_BOLD, INK3, "THE ELLIPTIC CURVE AND THE PRIME l");
    txx(cr, cx + 14, cy + 30, 16, TX_SERIF, INK, cw - 28, d->curve, NULL);
    char b[256];
    const char *rows[][2] = { { "l", NULL }, { "ε̲", NULL }, { "log q", NULL }, { "|log q|", NULL }, { "ht", NULL }, { "log f", NULL }, { "log d^K", NULL }, { "h(j)", NULL } };
    char vals[8][128];
    snprintf(vals[0], 128, "%u      l* = (l−1)/2 = %u      l± = (l+1)/2 = %u", d->l, d->lstar, d->lpm);
    snprintf(vals[1], 128, "the cusp ±%d (label %d ∈ F_l^*)", d->epsilon, d->epsilon);
    snprintf(vals[2], 128, "%.6f   = Σ_{v ∈ V^bad_mod} ord(q_v)·log p_v", iut_log_q(d));
    snprintf(vals[3], 128, "%.6f   = log q / 2l", iut_log_q(d) / (2.0 * d->l));
    snprintf(vals[4], 128, "%.6f   = log q / 6", iut_height_from_q(d));
    snprintf(vals[5], 128, "%.6f   (conductor)", iut_log_cond(d));
    snprintf(vals[6], 128, "≈ %.4f   (estimate)", d->logdK);
    if (d->j_log_height > 0) snprintf(vals[7], 128, "≈ %.3f", d->j_log_height); else snprintf(vals[7], 128, "—");
    for (int k = 0; k < 8; ++k) {
        double ry = cy + 62 + k * 23;
        tx(cr, cx + 14, ry, 12.5, TX_BOLD, INK2, rows[k][0]);
        tx(cr, cx + 92, ry, 12.5, TX_MONO, INK, vals[k]);
    }
    y = y0 + 262;

    /* V */
    snprintf(b, sizeof b, "V ≅ V_mod — %u places (one above each place of F_mod)", d->nV);
    y += heading(cr, 20, y, W - 40, b, "[IUTchI] Def 3.1 (d), (e)");
    double chw = 118, chh = 84, gap = 10, x = 20;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (x + chw > W - 20) { x = 20; y += chh + gap; }
        col bg, fg = place_col(v, &bg);
        boxc(cr, x, y, chw, chh, 9, bg, fg);
        if (v->in_Vbad_mod) { cairo_set_line_width(cr, 2.5); rpath(cr, x + 2, y + 2, chw - 4, chh - 4, 7); rgb(cr, fg); cairo_stroke(cr); }
        tx(cr, x + 10, y + 7, 14, TX_BOLD | TX_MONO, fg, v->name);
        if (v->kind == IUT_V_ARCH) tx(cr, x + 10, y + 28, 11, 0, INK2, "archimedean");
        else { txf(cr, x + 10, y + 28, 11, TX_MONO, INK2, "p = %u", v->p); }
        const char *red = v->kind == IUT_V_ARCH ? "" : v->red == IUT_RED_GOOD ? "good" : v->red == IUT_RED_BAD_ADD ? "additive" : "multiplicative";
        tx(cr, x + 10, y + 45, 11, 0, INK2, red);
        if (v->red == IUT_RED_BAD_MULT) txf(cr, x + chw - 10, y + 9, 11, TX_RIGHT | TX_MONO, fg, "ord q = %u", v->ordq);
        if (v->in_Vbad_mod) tx(cr, x + 10, y + 63, 10, TX_BOLD, fg, "∈ V^bad_mod");
        x += chw + gap;
    }
    y += chh + 14;
    /* legend */
    {
        struct { col c; const char *t; } lg[] = { { ORANGE, "V^bad_mod: odd p, multiplicative" }, { YELLOW, "multiplicative at 2 (not in V^bad_mod)" },
                                                  { PINK, "additive" }, { GREEN, "good reduction" }, { VIOLET, "archimedean" } };
        double lx = 20;
        for (int k = 0; k < 5; ++k) { disc(cr, lx + 6, y + 8, 5, lg[k].c, NULL, 0); lx += 16 + tx(cr, lx + 16, y, 11, 0, INK2, lg[k].t) + 18; }
        y += 28;
    }
    /* Tate parameters */
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    int anyq = 0; for (unsigned k = 0; k < nbad; ++k) anyq |= d->V[bad[k]].q_prec > 0;
    if (anyq) {
        y += heading(cr, 20, y, W - 40, "Tate parameters q_v = p^{ord q} · u at V^bad_mod (u to the precision the JSON file gives)", "[IUTchI] Def 3.1 (e)");
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            if (!v->q_prec) continue;
            snprintf(b, sizeof b, "q_%s = %u^%u · u,   u ≡ %llu mod %u^%u", v->name, v->p, v->ordq, v->q_unit, v->p, v->q_prec);
            tx(cr, 20, y + 4, 12.5, TX_MONO, INK, b);
            double dx = W - 20 - v->q_prec * 26;
            unsigned long long u = v->q_unit;
            tx(cr, dx - 10, y + 4, 10.5, TX_RIGHT, INK3, "base-p digits →");
            for (unsigned i = 0; i < v->q_prec; ++i) {
                boxc(cr, dx + i * 26, y, 22, 22, 4, ORANGEBG, ORANGE);
                txf(cr, dx + i * 26 + 11, y + 11, 11.5, TX_CENTER | TX_MIDDLE | TX_MONO, INK, "%llu", u % v->p);
                u /= v->p;
            }
            y += 30;
        }
        y += 6;
    }
    /* asserted hypotheses */
    y += heading(cr, 20, y, W - 40, "hypotheses recorded as asserted flags (not machine-checkable from numbers)", "[IUTchI] Def 3.1 (a), (b), (e)");
    {
        struct { int v; const char *t; } h[] = { { d->h_F_galois_over_Fmod, "F/F_mod Galois" }, { d->h_F_contains_six_torsion, "E[6] ⊆ F" },
                                                 { d->h_image_contains_SL2, "SL₂(F_l) ⊆ image" }, { d->h_stable_reduction, "stable reduction" }, { d->h_CK_is_K_core, "C_K a K-core" } };
        double hx = 20;
        for (int k = 0; k < 5; ++k) { double w = pill(cr, hx, y, h[k].v ? 1 : 0, h[k].t); hx += w + 10; if (hx > W - 160 && k < 4) { hx = 20; y += 30; } }
        y += 36;
    }
    return y + 10;
}

/* ============================================================ stage 1 */
static double draw_def(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_DEF);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_DEF]);
    if (m->reached <= GS_DEF) return not_yet(cr, W, y, GS_DEF);
    int cols = W > 860 ? 2 : 1;
    double cw = (W - 40 - (cols - 1) * 14) / cols;
    double rowy = y, rowh = 0;
    for (unsigned k = 0; k < m->nitems; ++k) {
        const iut_def_three_one_item *it = &m->items[k];
        int c = (int)(k % (unsigned)cols);
        if (c == 0 && k) { rowy += rowh + 12; rowh = 0; }
        double x = 20 + c * (cw + 14);
        /* measure */
        cairo_save(cr); cairo_rectangle(cr, 0, 0, 0, 0); cairo_clip(cr);
        double h1 = txw(cr, 0, 0, 12.5, 0, INK, cw - 70, it->condition);
        double h2 = txw(cr, 0, 0, 11.5, TX_ITALIC, INK2, cw - 70, it->detail);
        cairo_restore(cr);
        double h = 16 + h1 + 6 + h2 + 26;
        if (h > rowh) rowh = h;
        col bg = it->ok ? GREENBG : REDBG, fg = it->ok ? GREEN : RED;
        boxc(cr, x, rowy, cw, h, 10, PAPER, LINE);
        boxf(cr, x, rowy, 6, h, 3, fg);
        disc(cr, x + 30, rowy + 24, 14, bg, &fg, 1.5);
        tx(cr, x + 30, rowy + 24, 15, TX_CENTER | TX_MIDDLE | TX_BOLD, fg, it->ok ? "✓" : "✗");
        tx(cr, x + 56, rowy + 8, 13, TX_BOLD, INK, it->item);
        txw(cr, x + 56, rowy + 8 + 18, 12.5, 0, INK, cw - 70, it->condition);
        txw(cr, x + 56, rowy + 8 + 18 + h1 + 6, 11.5, TX_ITALIC, INK2, cw - 70, it->detail);
        tx(cr, x + cw - 12, rowy + 9, 10, TX_RIGHT | TX_BOLD, it->machine_checked ? BLUE : INK3, it->machine_checked ? "MACHINE-CHECKED" : "ASSERTED");
    }
    y = rowy + rowh + 20;
    y += heading(cr, 20, y, W - 40, "validation of the initial Θ-data", "iut validate");
    char b[160];
    double x = 20;
    snprintf(b, sizeof b, "%u error(s)", m->rdata.errors); x += pill(cr, x, y, m->rdata.errors == 0, b) + 10;
    snprintf(b, sizeof b, "%u warning(s)", m->rdata.warnings); x += pill(cr, x, y, m->rdata.warnings == 0 ? 1 : -1, b) + 10;
    snprintf(b, sizeof b, "%u checks", m->rdata.n); pill(cr, x, y, -1, b);
    y += 32;
    for (unsigned k = 0; k < m->rdata.n; ++k) {
        const iut_issue *is = &m->rdata.issue[k];
        col c = is->sev == IUT_SEV_ERROR ? RED : is->sev == IUT_SEV_WARN ? YELLOW : is->sev == IUT_SEV_INFO ? BLUE : GREEN;
        const char *tag = is->sev == IUT_SEV_ERROR ? "ERROR" : is->sev == IUT_SEV_WARN ? "WARN" : is->sev == IUT_SEV_INFO ? "info" : "ok";
        tx(cr, 20, y, 11, TX_BOLD | TX_MONO, c, tag);
        tx(cr, 80, y, 11, TX_MONO, INK2, is->condition);
        double h = txw(cr, 300, y, 11.5, 0, INK, W - 320 - 150, is->msg);
        tx(cr, W - 20, y, 10.5, TX_RIGHT, INK3, is->ref);
        y += (h > 16 ? h : 16) + 4;
    }
    return y + 16;
}

/* ============================================================ stage 2 */
static const char *ht_strip_names[11] = { "F_⊞", "D_⊚±", "F_>", "F_⊛", "F⊩_mod", "F⊩_tht", "F⊩_Δ", "F⊩_env", "F⊩_gau", "F⊩_LGP", "F⊩_lgp" };
static const iut_prime_strip *ht_strip(const iut_hodge_theater *ht, int k)
{
    switch (k) {
    case 0: return &ht->pmell.FBoxPlus;   case 1: return &ht->pmell.DCircDotPm;
    case 2: return &ht->nf.FGt;           case 3: return &ht->nf.FCircAst;
    case 4: return &ht->nf.tht.FMonoGlobMod; case 5: return &ht->nf.tht.FMonoGlobTht;
    case 6: return &ht->FMonoGlobTriangle; case 7: return &ht->FMonoGlobEnv;
    case 8: return &ht->FMonoGlobGau;     case 9: return &ht->FMonoGlobLGP;
    default: return &ht->FMonoGlobLgp;
    }
}

/* the cells of a prime-strip: one per place; top half = copy of Π_v, bottom half = copy of the monoid */
static void strip_cells(cairo_t *cr, double x, double y, double cw, double ch, const iut_prime_strip *ps)
{
    for (unsigned i = 0; i < ps->nV; ++i) {
        const iut_local_datum *L = &ps->loc[i];
        double cx = x + i * (cw + 2);
        if (L->Pi_copy) { rgb(cr, copy_col(L->Pi_copy)); cairo_rectangle(cr, cx, y, cw, ch / 2); cairo_fill(cr); }
        else { rgb(cr, PAPER3); cairo_rectangle(cr, cx, y, cw, ch / 2); cairo_fill(cr); }
        if (L->units_copy) { rgba(cr, copy_col(L->units_copy), 0.55); cairo_rectangle(cr, cx, y + ch / 2, cw, ch / 2); cairo_fill(cr); }
        else { rgb(cr, PAPER2); cairo_rectangle(cr, cx, y + ch / 2, cw, ch / 2); cairo_fill(cr); }
        rgb(cr, LINE); cairo_set_line_width(cr, 0.8); cairo_rectangle(cr, cx + 0.5, y + 0.5, cw - 1, ch - 1); cairo_stroke(cr);
    }
}

static double draw_ht(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_HT);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_HT]);
    if (m->reached <= GS_HT || !m->lat) return not_yet(cr, W, y, GS_HT);
    const iut_initial_theta_data *d = &m->data;
    const iut_hodge_theater *ht = m->lat->ht[m->sel_n + IUT_LAT_NOFF][m->sel_m + IUT_LAT_MOFF];
    if (!ht) ht = m->lat->ht[IUT_LAT_NOFF][IUT_LAT_MOFF];
    char b[256];
    snprintf(b, sizeof b, "the Θ±ell NF-Hodge theater at (%d, %d)  ·  universe #%u  ·  %s%s", ht->n, ht->m, ht->universe, ht->copy_label,
             ht->has_incoming_log ? "  ·  codomain of a log-link" : "");
    y += heading(cr, 20, y, W - 40, b, "[IUTchI] Def 6.13; [Pano] Fig. 3.3");

    /* geometry */
    unsigned l = ht->pmell.nT, ls = ht->nf.nJ;
    double avail = 26.0 * l; if (avail > 440) avail = 440;
    double rh = avail / l;               /* row height of the T capsule */
    double top = y + 34, bottom = top + avail;
    double Ax = 20, Aw = 130, Tx = Ax + Aw + 56, Tw = 84;
    double Rw = 150, Rx = W - 20 - Rw, Jw = 84, Jx = Rx - 56 - Jw;
    if (Jx < Tx + Tw + 120) { Jx = Tx + Tw + 120; Rx = Jx + Jw + 40; Rw = W - 20 - Rx; }
    tx(cr, (Ax + Tx + Tw) / 2, y + 4, 12.5, TX_CENTER | TX_BOLD, VIOLET, "Θ±ell-Hodge theater");
    tx(cr, (Jx + Rx + Rw) / 2, y + 4, 12.5, TX_CENTER | TX_BOLD, TEAL, "ΘNF-Hodge theater");
    tx(cr, (Tx + Tw + Jx) / 2, y + 4, 12.5, TX_CENTER | TX_BOLD, INK2, "gluing 0, ⊞ ↦ >");
    tx(cr, Tx + Tw / 2, top - 16, 11, TX_CENTER, INK3, "capsule F_T, t ∈ F_l");
    tx(cr, Jx + Jw / 2, top - 16, 11, TX_CENTER, INK3, "capsule F_J, j ∈ F_l^*");
    /* bridge targets on the left */
    double Fy = top + avail * 0.18, Dy = top + avail * 0.62, bh = 58;
    boxc(cr, Ax, Fy, Aw, bh, 9, VIOLETBG, VIOLET);
    tx(cr, Ax + Aw / 2, Fy + 8, 15, TX_CENTER | TX_BOLD, VIOLET, "F_⊞");
    tx(cr, Ax + Aw / 2, Fy + 30, 10.5, TX_CENTER, INK2, ht->pmell.theta_pm_bridge_ok ? "Θ±-bridge ✓" : "Θ±-bridge ✗");
    boxc(cr, Ax, Dy, Aw, bh, 9, BLUEBG, BLUE);
    tx(cr, Ax + Aw / 2, Dy + 8, 15, TX_CENTER | TX_BOLD, BLUE, "D_⊚±");
    tx(cr, Ax + Aw / 2, Dy + 30, 10.5, TX_CENTER, INK2, ht->pmell.theta_ell_bridge_ok ? "Θell-bridge ✓" : "Θell-bridge ✗");
    /* T capsule */
    double ty[2 * IUT_MAX_LSTAR + 1];
    for (unsigned i = 0; i < l; ++i) {
        int t = ht->pmell.T[i].label;
        double yy = top + i * rh;
        ty[i] = yy + rh / 2;
        rgba(cr, VIOLET, 0.25); cairo_set_line_width(cr, 0.8);
        cairo_move_to(cr, Tx, ty[i]); cairo_line_to(cr, Ax + Aw, Fy + bh / 2); cairo_stroke(cr);
        double dsh[] = { 3, 3 }; cairo_set_dash(cr, dsh, 2, 0); rgba(cr, BLUE, 0.22);
        cairo_move_to(cr, Tx, ty[i]); cairo_line_to(cr, Ax + Aw, Dy + bh / 2); cairo_stroke(cr); cairo_set_dash(cr, NULL, 0, 0);
        col c = label_col(t);
        box(cr, Tx, yy + 1, Tw, rh - 2, 4, &(col){ 1, 1, 1 }, &c, 1.2);
        if (rh >= 12) {
            snprintf(b, sizeof b, "t = %d", t);
            tx(cr, Tx + 6, yy + rh / 2, rh >= 20 ? 11.5 : 9, TX_MIDDLE | TX_MONO | TX_BOLD, c, b);
            if (rh >= 20) txf(cr, Tx + Tw - 5, yy + rh / 2, 8.5, TX_MIDDLE | TX_RIGHT | TX_MONO, INK3, "#%u", ht->pmell.T[i].basepoint);
        }
    }
    /* J capsule, centred */
    double jrh = avail / (ls ? ls : 1); if (jrh > 44) jrh = 44;
    double jtop = top + (avail - jrh * ls) / 2, jy[IUT_MAX_LSTAR + 1];
    for (unsigned i = 0; i < ls; ++i) jy[i] = jtop + i * jrh + jrh / 2;
    /* gluing lines ±t ↦ |t| */
    for (unsigned i = 0; i < l; ++i) {
        int t = ht->pmell.T[i].label;
        if (t == 0) continue;
        int j = iut_label_glue_pm_to_nf(d, t);
        if (j < 1 || j > (int)ls) continue;
        col c = label_col(j);
        rgba(cr, c, 0.7); cairo_set_line_width(cr, 1.4);
        double x1 = Tx + Tw, x2 = Jx;
        cairo_move_to(cr, x1, ty[i]); cairo_curve_to(cr, (x1 + x2) / 2, ty[i], (x1 + x2) / 2, jy[j - 1], x2, jy[j - 1]); cairo_stroke(cr);
    }
    /* 0 ↦ > : the zero label goes to F_> together with ⊞ */
    double Gy = top + avail * 0.1, gh = 56, Sy = top + avail * 0.62;
    for (unsigned i = 0; i < l; ++i) if (ht->pmell.T[i].label == 0) {
        double dsh[] = { 6, 4 }; cairo_set_dash(cr, dsh, 2, 0); rgba(cr, INK3, 0.9); cairo_set_line_width(cr, 1.3);
        cairo_move_to(cr, Tx + Tw, ty[i]); cairo_curve_to(cr, Jx, ty[i], Jx - 30, Gy - 22, Rx + Rw / 2, Gy - 2); cairo_stroke(cr); cairo_set_dash(cr, NULL, 0, 0);
        tx(cr, (Tx + Tw + Jx) / 2, ty[i] - 16, 10.5, TX_CENTER, INK3, "0 ↦ >");
    }
    for (unsigned i = 0; i < ls; ++i) {
        int j = ht->nf.J[i].label;
        double yy = jy[i] - jrh / 2;
        rgba(cr, TEAL, 0.3); cairo_set_line_width(cr, 0.8);
        cairo_move_to(cr, Jx + Jw, jy[i]); cairo_line_to(cr, Rx, Gy + gh / 2); cairo_stroke(cr);
        double dsh[] = { 3, 3 }; cairo_set_dash(cr, dsh, 2, 0);
        cairo_move_to(cr, Jx + Jw, jy[i]); cairo_line_to(cr, Rx, Sy + gh / 2); cairo_stroke(cr); cairo_set_dash(cr, NULL, 0, 0);
        col c = label_col(j);
        box(cr, Jx, yy + 2, Jw, jrh - 4, 5, &(col){ 1, 1, 1 }, &c, 1.6);
        if (jrh >= 12) {
            snprintf(b, sizeof b, "j = %d", j);
            tx(cr, Jx + 7, jy[i], jrh >= 20 ? 12 : 9, TX_MIDDLE | TX_MONO | TX_BOLD, c, b);
            if (jrh >= 20) txf(cr, Jx + Jw - 5, jy[i], 8.5, TX_MIDDLE | TX_RIGHT | TX_MONO, INK3, "#%u", ht->nf.J[i].basepoint);
        }
    }
    /* NF-side targets */
    boxc(cr, Rx, Gy, Rw, gh, 9, TEALBG, TEAL);
    tx(cr, Rx + Rw / 2, Gy + 7, 15, TX_CENTER | TX_BOLD, TEAL, "F_>");
    tx(cr, Rx + Rw / 2, Gy + 29, 10.5, TX_CENTER, INK2, ht->nf.theta_bridge_ok ? "Θ-bridge ✓" : "Θ-bridge ✗");
    double Hy = Gy + gh + 16;
    boxc(cr, Rx, Hy, Rw, 64, 9, ORANGEBG, ORANGE);
    tx(cr, Rx + Rw / 2, Hy + 6, 11.5, TX_CENTER | TX_BOLD, ORANGE, "Θ-Hodge theater");
    tx(cr, Rx + Rw / 2, Hy + 24, 11, TX_CENTER, INK2, "F⊩_mod: q̲_v");
    tx(cr, Rx + Rw / 2, Hy + 40, 11, TX_CENTER, INK2, "F⊩_tht: Θ̲_v");
    if (Sy < Hy + 74) Sy = Hy + 74;
    boxc(cr, Rx, Sy, Rw, gh, 9, GREENBG, GREEN);
    tx(cr, Rx + Rw / 2, Sy + 7, 15, TX_CENTER | TX_BOLD, GREEN, "F_⊛");
    tx(cr, Rx + Rw / 2, Sy + 29, 10.5, TX_CENTER, INK2, ht->nf.nf_bridge_ok ? "NF-bridge ✓ (F_mod^×)" : "NF-bridge ✗");
    double yb = bottom; if (Sy + gh > yb) yb = Sy + gh;
    y = yb + 12;
    snprintf(b, sizeof b, "symmetries: F_l^{⋊±} of order %u acts on the t's (orbit of 0: %u)   ·   F_l^* of order %u acts on the j's (orbit of 1: %u)   ·   glued %s",
             2 * d->l, iut_label_orbit_FlSemiPm(d, 0), d->lstar, iut_label_orbit_FlStar(d, 1), ht->glued ? "✓" : "✗");
    y += txw(cr, 20, y, 11.5, 0, INK2, W - 40, b) + 16;

    /* Θ-HT at V^bad */
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    y += heading(cr, 20, y, W - 40, "Θ-Hodge theater at V^bad: q̲_v = q_v^{1/2l}, and Θ̲_v at the label j is q̲_v^{j²}", "[IUTchI] Def 3.6, Ex 3.2–3.4");
    for (unsigned k = 0; k < nbad; ++k) {
        const iut_valuation *v = &d->V[bad[k]];
        char q1[48]; iut_q_fmt(iut_q_make((long)v->ordq, 2L * d->l), q1, sizeof q1);
        txf(cr, 20, y, 12, TX_MONO | TX_BOLD, ORANGE, "%s", v->name);
        txf(cr, 80, y, 12.5, 0, INK, "ord(q_v) = %u      ord(q̲_v) = %u/%u = %s", v->ordq, v->ordq, 2 * d->l, q1);
        y += 22;
    }
    if (nbad) {
        tx(cr, 20, y, 11, 0, INK3, "theta values Θ̲_v(j) in units of ord(q̲_v):");
        double x = 290;
        for (unsigned j = 1; j <= d->lstar && x < W - 60; ++j) {
            char q[32]; iut_q_fmt(ht->nf.tht.theta_value[j], q, sizeof q);
            x += txf(cr, x, y, 11, TX_MONO, label_col((int)j), "j=%u: %s", j, q) + 14;
        }
        y += 26;
    }

    /* prime-strips */
    y += heading(cr, 20, y, W - 40, "the prime-strips of this Hodge theater: one cell per place v ∈ V", "[IUTchI] Fig. I1.2; [IUTchII] Cor 4.10");
    tx(cr, 20, y, 11, 0, INK2, "top half: the copy of Π_v (blank = mono-analytic, only G_v)   ·   bottom half: the copy of the monoid O▷ / O×μ (blank = étale-like)");
    y += 22;
    double cw = 22, ch = 22;
    for (int k = 0; k < 11; ++k) {
        const iut_prime_strip *ps = ht_strip(ht, k);
        tx(cr, 20, y + 3, 12.5, TX_BOLD, INK, ht_strip_names[k]);
        tx(cr, 92, y + 4, 11, TX_MONO, INK2, iut_ps_kind_notation(ps->kind));
        strip_cells(cr, 170, y, cw, ch, ps);
        double ex = 170 + ps->nV * (cw + 2) + 12;
        char extra[160] = "";
        if (ps->has_global_realified) snprintf(extra, sizeof extra, "global realified Frobenioid, deg = %.4f", ps->global_degree);
        for (unsigned i = 0; i < ps->nV && !extra[0]; ++i) if (ps->loc[i].nval) {
            size_t o = (size_t)snprintf(extra, sizeof extra, "O▶ at %s: ", d->V[i].name);
            for (unsigned g = 0; g < ps->loc[i].nval && g < 6 && o + 20 < sizeof extra; ++g) { char q[24]; iut_q_fmt(ps->loc[i].val[g], q, sizeof q); o += (size_t)snprintf(extra + o, sizeof extra - o, "%sq̲^%s", g ? "," : "", q); }
            if (ps->loc[i].nval > 6) snprintf(extra + o, sizeof extra - o, ",…");
        }
        txx(cr, ex, y + 4, 11, TX_ELLIPSIZE, INK3, W - 20 - ex, extra, NULL);
        y += ch + 6;
    }
    {
        double x = 170;
        for (unsigned i = 0; i < d->nV; ++i) { tx(cr, x + i * (cw + 2) + cw / 2, y, 8.5, TX_CENTER | TX_MONO, INK3, d->V[i].name + (d->V[i].name[0] == 'v')); }
        y += 18;
    }
    /* log-shells */
    if (ht->nshell) {
        y += 8;
        y += heading(cr, 20, y, W - 40, "log-shells I_v = (p*)⁻¹·log(O×) built by the log-link into this vertex", "[IUTchIII] Def 1.1 (i)");
        for (unsigned i = 0; i < ht->nshell; ++i) {
            const iut_log_shell *S = &ht->shell[i];
            const iut_valuation *v = &d->V[S->v_index];
            char q[32]; iut_q_fmt(S->radius, q, sizeof q);
            if (v->kind == IUT_V_ARCH) snprintf(b, sizeof b, "%-6s  π-disc (archimedean)", v->name);
            else snprintf(b, sizeof b, "%-6s  p* = %-3u  I_v = p^{%s}·O    μ_log(I_v) = %+.6f", v->name, S->pstar, q, S->log_volume);
            tx(cr, 20, y, 11.5, TX_MONO, INK, b);
            y += 18;
        }
    }
    y += 10;
    snprintf(b, sizeof b, "validation of the Θ±ell NF-Hodge theater at (0,0): %u error(s) in %u checks", m->rht.errors, m->rht.n);
    pill(cr, 20, y, m->rht.errors == 0, b);
    return y + 40;
}

/* ============================================================ stage 3 */
static double draw_gau(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_GAU);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_GAU]);
    if (m->reached <= GS_GAU) return not_yet(cr, W, y, GS_GAU);
    const iut_initial_theta_data *d = &m->data;
    char b[256];
    /* the evaluation points */
    snprintf(b, sizeof b, "the %u evaluation points t ∈ F_l (the l-torsion points of E): θ(t) = q̲_v^{t²} up to μ_%u", d->l, 2 * d->l);
    y += heading(cr, 20, y, W - 40, b, "[IUTchII] Cor 2.5");
    {
        double step = (W - 60) / d->l; if (step > 52) step = 52;
        double x0 = W / 2 - step * (d->l - 1) / 2.0;
        for (int t = -(int)d->lstar; t <= (int)d->lstar; ++t) {
            double x = x0 + (t + (int)d->lstar) * step, r = step * 0.36; if (r > 15) r = 15;
            col c = label_col(t);
            disc(cr, x, y + 18, r, t ? c : INK3, NULL, 0);
            if (step >= 20) txf(cr, x, y + 18, step >= 36 ? 11 : 8.5, TX_CENTER | TX_MIDDLE | TX_BOLD, PAPER, "%d", t);
            if (step >= 30) txf(cr, x, y + 38, 9.5, TX_CENTER | TX_MONO, INK2, "%d", t * t);
        }
        if (step >= 30) tx(cr, x0 - step * 0.7, y + 38, 9.5, TX_RIGHT, INK3, "t² =");
        y += 62;
    }
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    unsigned twol = 2 * d->l;
    for (unsigned k = 0; k < nbad; ++k) {
        const iut_valuation *v = &d->V[bad[k]];
        snprintf(b, sizeof b, "Ψ_gau at %s (p = %u, ord q_v = %u):  ord_v(q̲_v^{j²}) = j²·%u/%u", v->name, v->p, v->ordq, v->ordq, twol);
        y += heading(cr, 20, y, W - 40, b, "[IUTchII] Cor 3.5, Cor 4.10");
        double maxv = (double)d->lstar * d->lstar * v->ordq / twol;
        double bx = 90, bw = W * 0.38;
        for (unsigned j = 1; j <= d->lstar; ++j) {
            double val = (double)j * j * v->ordq / twol;
            col c = label_col((int)j);
            txf(cr, 20, y + 2, 11.5, TX_MONO | TX_BOLD, c, "j = %u", j);
            boxf(cr, bx, y + 3, bw, 14, 3, PAPER3);
            boxf(cr, bx, y + 3, bw * val / maxv < 3 ? 3 : bw * val / maxv, 14, 3, c);
            char q[48]; iut_q_fmt(iut_q_make((long)(j * j * v->ordq), (long)twol), q, sizeof q);
            txf(cr, bx + bw + 10, y + 2, 11.5, TX_MONO, INK, "%s", q);
            if (v->q_prec) {
                unsigned long long u = iut_tate_unit_pow(v, (unsigned long long)j * j);
                double dx = bx + bw + 90;
                double cwid = (W - 20 - dx - 120) / v->q_prec; if (cwid > 20) cwid = 20;
                if (cwid >= 10) {
                    for (unsigned i = 0; i < v->q_prec; ++i) {
                        boxc(cr, dx + i * cwid, y + 1, cwid - 2, 18, 3, ORANGEBG, LINE);
                        txf(cr, dx + i * cwid + (cwid - 2) / 2, y + 10, 10, TX_CENTER | TX_MIDDLE | TX_MONO, INK, "%llu", u % v->p);
                        u /= v->p;
                    }
                    txf(cr, W - 20, y + 3, 10.5, TX_RIGHT | TX_MONO, INK3, "%llu", iut_tate_unit_pow(v, (unsigned long long)j * j));
                }
            }
            y += 22;
        }
        if (v->q_prec) { txf(cr, W - 20, y, 10, TX_RIGHT, INK3, "unit of q_v^{j²} mod %u^%u, base-%u digits (lowest first), and its value", v->p, v->q_prec, v->p); y += 18; }
        y += 8;
    }
    /* log-volumes */
    y += heading(cr, 20, y, W - 40, "normalized log-volumes −(j²/2l)·log q, and the two pilots", "[IUTchIII] Prop 3.9, Def 3.8");
    {
        double gx = 70, gw = W - 120, gh = 180, gy = y + 10;
        double lq = iut_log_q(d), vmin = -((double)d->lstar * d->lstar / twol) * lq;
        if (vmin > m->tp.log_volume) vmin = m->tp.log_volume;
        if (vmin >= 0) vmin = -1;
        rgb(cr, PAPER2); cairo_rectangle(cr, gx, gy, gw, gh); cairo_fill(cr);
        line(cr, gx, gy, gx + gw, gy, LINE, 1);
        tx(cr, gx - 6, gy - 6, 10, TX_RIGHT | TX_MONO, INK3, "0");
        txf(cr, gx - 6, gy + gh - 6, 10, TX_RIGHT | TX_MONO, INK3, "%.1f", vmin);
        double hy;
        hy = gy + gh * (m->qp.log_volume / vmin);
        { double dsh[] = { 6, 4 }; cairo_set_dash(cr, dsh, 2, 0); }
        line(cr, gx, hy, gx + gw, hy, BLUE, 1.4);
        cairo_set_dash(cr, NULL, 0, 0);
        txf(cr, gx + gw - 4, hy - 16, 10.5, TX_RIGHT, BLUE, "q-pilot  −|log q| = %.4f", m->qp.log_volume);
        hy = gy + gh * (m->tp.log_volume / vmin);
        { double dsh[] = { 6, 4 }; cairo_set_dash(cr, dsh, 2, 0); }
        line(cr, gx, hy, gx + gw, hy, ORANGE, 1.4);
        cairo_set_dash(cr, NULL, 0, 0);
        txf(cr, gx + gw - 4, hy + 3, 10.5, TX_RIGHT, ORANGE, "Θ-pilot  −(l(l+1)/12)·|log q| = %.4f", m->tp.log_volume);
        double px = 0, py = 0;
        for (unsigned j = 1; j <= d->lstar; ++j) {
            double val = -((double)j * j / twol) * lq;
            double x = gx + gw * (j - 0.5) / d->lstar, yy = gy + gh * (val / vmin);
            if (j > 1) line(cr, px, py, x, yy, INK2, 1.2);
            px = x; py = yy;
        }
        for (unsigned j = 1; j <= d->lstar; ++j) {
            double val = -((double)j * j / twol) * lq;
            double x = gx + gw * (j - 0.5) / d->lstar, yy = gy + gh * (val / vmin);
            disc(cr, x, yy, 4.5, label_col((int)j), NULL, 0);
            if (d->lstar <= 20) txf(cr, x, gy + gh + 4, 10, TX_CENTER | TX_MONO, INK2, "%u", j);
        }
        tx(cr, gx + gw / 2, gy + gh + 20, 10.5, TX_CENTER, INK3, "j");
        y = gy + gh + 44;
    }
    return y;
}

/* ============================================================ the lattice */
void gd_lattice(cairo_t *cr, double x, double y, double w, double h, const gm_model *m, int n0, int n1, int m0, int m1, gd_hits *hits, int big)
{
    const iut_log_theta_lattice *lat = m->lat;
    int ncol = n1 - n0 + 1, nrow = m1 - m0 + 1;
    double dx = w / ncol, dy = h / nrow;
    double r = dx < dy ? dx : dy; r *= big ? 0.26 : 0.24; if (r > 24) r = 24; if (r < 6) r = 6;
#define VX(n) (x + ((n) - n0 + 0.5) * dx)
#define VY(mm) (y + (m1 - (mm) + 0.5) * dy)
    /* faint grid */
    for (int n = n0; n <= n1; ++n) line(cr, VX(n), y + dy * 0.2, VX(n), y + h - dy * 0.2, PAPER3, 1);
    for (int mm = m0; mm <= m1; ++mm) line(cr, x + dx * 0.2, VY(mm), x + w - dx * 0.2, VY(mm), PAPER3, 1);
    /* labels */
    for (int n = n0; n <= n1; ++n) txf(cr, VX(n), y + h + 2, 10.5, TX_CENTER | TX_MONO, INK3, "n = %d", n);
    for (int mm = m0; mm <= m1; ++mm) txf(cr, x - 4, VY(mm), 10.5, TX_RIGHT | TX_MIDDLE | TX_MONO, INK3, "m = %d", mm);
    /* planned links not applied yet (only while the pipeline builds the H) */
    if (m->reached <= GS_LAT && lat) {
        for (int k = m->done_links; k < m->nplan; ++k) {
            const gm_planned_link *p = &m->plan[k];
            if (p->n < n0 || p->n + p->theta > n1 || p->m < m0 || p->m + !p->theta > m1) continue;
            double x1 = VX(p->n), y1 = VY(p->m), x2 = VX(p->n + p->theta), y2 = VY(p->m + !p->theta);
            double ux = (x2 - x1), uy = (y2 - y1), L = sqrt(ux * ux + uy * uy); ux /= L; uy /= L;
            rgba(cr, INK3, 0.45); cairo_set_line_width(cr, 1.2); double dsh[] = { 3, 4 }; cairo_set_dash(cr, dsh, 2, 0);
            cairo_move_to(cr, x1 + ux * r, y1 + uy * r); cairo_line_to(cr, x2 - ux * r, y2 - uy * r); cairo_stroke(cr); cairo_set_dash(cr, NULL, 0, 0);
        }
    }
    /* links */
    if (lat) for (unsigned k = 0; k < lat->nlinks; ++k) {
        const iut_link *L = &lat->links[k];
        if (L->dom_n < n0 || L->dom_n > n1 || L->cod_n < n0 || L->cod_n > n1 || L->dom_m < m0 || L->dom_m > m1 || L->cod_m < m0 || L->cod_m > m1) continue;
        double x1 = VX(L->dom_n), y1 = VY(L->dom_m), x2 = VX(L->cod_n), y2 = VY(L->cod_m);
        double ux = (x2 - x1), uy = (y2 - y1), len = sqrt(ux * ux + uy * uy); ux /= len; uy /= len;
        int newest = (int)k == m->last_link;
        int log_ = L->kind == IUT_LINK_LOG;
        col c = newest ? BLUE : log_ ? INK2 : ORANGE;
        if (newest) { rgba(cr, BLUE, 0.18); cairo_set_line_width(cr, 10); cairo_move_to(cr, x1 + ux * r, y1 + uy * r); cairo_line_to(cr, x2 - ux * r, y2 - uy * r); cairo_stroke(cr); }
        arrow(cr, x1 + ux * (r + 2), y1 + uy * (r + 2), x2 - ux * (r + 3), y2 - uy * (r + 3), c, log_ ? 1.8 : 2.6, 0, big ? 10 : 8);
        if (log_ && dx > 60) tx(cr, x1 + 6 + r * 0.2, (y1 + y2) / 2, big ? 10.5 : 9.5, TX_MIDDLE, newest ? BLUE : INK3, "log");
        if (!log_) tx(cr, (x1 + x2) / 2, y1 - (big ? 22 : 18), big ? 12 : 10.5, TX_CENTER | TX_BOLD, newest ? BLUE : ORANGE, iut_link_kind_notation(L->kind));
    }
    /* vertices */
    if (hits) hits->nv = 0;
    for (int n = n0; n <= n1; ++n) for (int mm = m0; mm <= m1; ++mm) {
        double vx = VX(n), vy = VY(mm);
        const iut_hodge_theater *ht = (lat && iut_lattice_in_range(n, mm)) ? lat->ht[n + IUT_LAT_NOFF][mm + IUT_LAT_MOFF] : NULL;
        if (!ht) { disc(cr, vx, vy, 2.5, LINE, NULL, 0); continue; }
        col fill = copy_col(ht->nf.FGt.loc[0].Pi_copy), stroke = INK;
        int sel = n == m->sel_n && mm == m->sel_m;
        if (sel) { disc(cr, vx, vy, r + 6, BLUEBG, NULL, 0); col bl = BLUE; cairo_new_sub_path(cr); cairo_arc(cr, vx, vy, r + 6, 0, 2 * M_PI); rgb(cr, bl); cairo_set_line_width(cr, 2); cairo_stroke(cr); }
        disc(cr, vx, vy, r, fill, &stroke, 1.4);
        if (r >= 11) txf(cr, vx, vy, r >= 18 ? 11 : 8.5, TX_CENTER | TX_MIDDLE | TX_BOLD | TX_MONO, PAPER, "%u", ht->universe);
        if (ht->has_incoming_log && r >= 10) { disc(cr, vx + r * 0.78, vy - r * 0.78, 4, TEAL, &(col){ 1, 1, 1 }, 1); }
        if (big && r >= 14) txf(cr, vx + r + 5, vy + r * 0.45, 9.5, TX_MONO, INK3, "(%d,%d)", n, mm);
        if (hits && hits->nv < (int)(sizeof hits->v / sizeof hits->v[0])) hits->v[hits->nv++] = (gd_vhit){ n, mm, vx, vy, r + 6 };
    }
#undef VX
#undef VY
}

static void lattice_legend(cairo_t *cr, double x, double y, double w)
{
    double lx = x;
    disc(cr, lx + 8, y + 8, 7, BLUE, &(col){ 0.09, 0.13, 0.18 }, 1); lx += 20;
    lx += tx(cr, lx, y, 11, 0, INK2, "vertex = Θ±ell NF-Hodge theater; number = its universe; fill = its copy of Π_v") + 18;
    if (lx > x + w - 200) { lx = x; y += 20; }
    disc(cr, lx + 6, y + 8, 4, TEAL, NULL, 0); lx += 14;
    lx += tx(cr, lx, y, 11, 0, INK2, "has log-shells") + 18;
    arrow(cr, lx, y + 8, lx + 30, y + 8, INK2, 1.8, 0, 7); lx += 36;
    lx += tx(cr, lx, y, 11, 0, INK2, "log-link") + 18;
    arrow(cr, lx, y + 8, lx + 30, y + 8, ORANGE, 2.4, 0, 7); lx += 36;
    lx += tx(cr, lx, y, 11, 0, INK2, "Θ-link") + 18;
    arrow(cr, lx, y + 8, lx + 30, y + 8, BLUE, 2, 0, 7); lx += 36;
    tx(cr, lx, y, 11, 0, INK2, "newest");
}

static double draw_lat(cairo_t *cr, double W, const gm_model *m, gd_hits *hits)
{
    double y = stage_title(cr, W, m, GS_LAT);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_LAT]);
    if (m->reached < GS_LAT || !m->lat) return not_yet(cr, W, y, GS_LAT);
    const iut_initial_theta_data *d = &m->data;
    char b[256];
    /* progress bar of the links */
    snprintf(b, sizeof b, "building the infinite H: %d of %d links applied (log-links up column 0, then column 1, then the Θ-link)", m->done_links, m->nplan);
    tx(cr, 20, y, 12, TX_BOLD, INK, b);
    y += 22;
    boxf(cr, 20, y, W - 40, 8, 4, PAPER3);
    boxf(cr, 20, y, (W - 40) * m->done_links / (m->nplan ? m->nplan : 1), 8, 4, BLUE);
    y += 22;
    /* the lattice */
    int m0 = -m->rows - 1, m1 = m->rows + 1;
    if (m0 < -IUT_LAT_MOFF) m0 = -IUT_LAT_MOFF;
    if (m1 > IUT_LAT_MOFF) m1 = IUT_LAT_MOFF;
    double lw = W * 0.5 < 300 ? 300 : W * 0.5, lh = 64.0 * (m1 - m0 + 1); if (lh > 560) lh = 560;
    gd_lattice(cr, 70, y + 24, lw - 70, lh, m, -1, 2, m0, m1, hits, 0);
    /* side panel: the Θ-link record, the newest link */
    double px = lw + 20, pw = W - px - 20, py = y;
    const iut_link *tl = NULL;
    for (unsigned k = 0; k < m->lat->nlinks; ++k) if (m->lat->links[k].kind != IUT_LINK_LOG) tl = &m->lat->links[k];
    if (m->last_link >= 0) {
        const iut_link *L = &m->lat->links[m->last_link];
        boxc(cr, px, py, pw, 70, 10, BLUEBG, BLUE);
        tx(cr, px + 12, py + 8, 11, TX_BOLD, BLUE, "NEWEST LINK");
        snprintf(b, sizeof b, "%s  (%d,%d) → (%d,%d)", iut_link_kind_notation(L->kind), L->dom_n, L->dom_m, L->cod_n, L->cod_m);
        tx(cr, px + 12, py + 26, 14, TX_BOLD | TX_MONO, INK, b);
        snprintf(b, sizeof b, "glues %s-prime-strips, full poly-isomorphism %s", iut_ps_kind_notation(L->glued_kind), L->full_poly_isomorphism ? "✓" : "✗");
        txx(cr, px + 12, py + 48, 11, 0, INK2, pw - 24, b, NULL);
        py += 82;
    }
    boxc(cr, px, py, pw, 150, 10, PAPER, LINE);
    tx(cr, px + 12, py + 8, 11, TX_BOLD, INK3, "WHAT A LINK SHARES");
    struct { const char *what; int log_, th; } rows[] = {
        { "Π_v (étale-like, holomorphic)", 1, 0 }, { "G_v (étale-like, mono-analytic)", 1, 1 }, { "O×μ units mod torsion", 0, tl ? tl->preserves_units_mod_tors : 1 }, { "ring structure", 0, 0 } };
    tx(cr, px + pw - 110, py + 28, 10.5, TX_CENTER | TX_BOLD, INK2, "log");
    tx(cr, px + pw - 45, py + 28, 10.5, TX_CENTER | TX_BOLD, ORANGE, "Θ×μ_LGP");
    for (int k = 0; k < 4; ++k) {
        double ry = py + 48 + k * 24;
        tx(cr, px + 12, ry, 11.5, 0, INK, rows[k].what);
        tx(cr, px + pw - 110, ry, 13, TX_CENTER | TX_BOLD, rows[k].log_ ? GREEN : RED, rows[k].log_ ? "✓" : "✗");
        tx(cr, px + pw - 45, ry, 13, TX_CENTER | TX_BOLD, rows[k].th ? GREEN : RED, rows[k].th ? "✓" : "✗");
    }
    py += 162;
    if (tl) {
        boxc(cr, px, py, pw, 96, 10, ORANGEBG, ORANGE);
        tx(cr, px + 12, py + 8, 11, TX_BOLD, ORANGE, "THE Θ-LINK");
        const iut_hodge_theater *a = m->lat->ht[tl->dom_n + IUT_LAT_NOFF][tl->dom_m + IUT_LAT_MOFF], *c = m->lat->ht[tl->cod_n + IUT_LAT_NOFF][tl->cod_m + IUT_LAT_MOFF];
        snprintf(b, sizeof b, "value groups dilated by l(l+1)/12 = %.4f", tl->dilation);
        tx(cr, px + 12, py + 28, 11.5, 0, INK, b);
        if (a && c) {
            snprintf(b, sizeof b, "Π_v: copy #%u on the left, #%u on the right", a->nf.FGt.loc[0].Pi_copy, c->nf.FGt.loc[0].Pi_copy);
            tx(cr, px + 12, py + 48, 11.5, 0, INK, b);
            disc(cr, px + pw - 40, py + 55, 8, copy_col(a->nf.FGt.loc[0].Pi_copy), NULL, 0);
            disc(cr, px + pw - 18, py + 55, 8, copy_col(c->nf.FGt.loc[0].Pi_copy), NULL, 0);
        }
        tx(cr, px + 12, py + 68, 11.5, TX_ITALIC, INK2, "mutually alien: no ring isomorphism between them");
        py += 108;
    }
    y += (lh + 50 > py - y ? lh + 50 : py - y);
    lattice_legend(cr, 20, y, W - 40);
    y += 44;
    /* Θ-link at V^bad, and log-shells at (0,1), as in the transcript */
    unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad);
    if (tl) {
        y += heading(cr, 20, y, W - 40, "the Θ×μ_LGP-link at V^bad: the left F⊩_LGP value monoid becomes the right F⊩_Δ one", "[IUTchIII] Def 3.8");
        const iut_hodge_theater *ht = m->lat->ht[IUT_LAT_NOFF][IUT_LAT_MOFF], *ht1 = m->lat->ht[1 + IUT_LAT_NOFF][IUT_LAT_MOFF];
        for (unsigned k = 0; k < nbad && ht && ht1; ++k) {
            unsigned i = bad[k];
            const iut_local_datum *A = &ht->FMonoGlobLGP.loc[i], *B = &ht1->FMonoGlobTriangle.loc[i];
            char s[200]; size_t o = (size_t)snprintf(s, sizeof s, "%-5s O▶{", d->V[i].name);
            for (unsigned g = 0; g < A->nval && o + 16 < sizeof s; ++g) { char q[24]; iut_q_fmt(A->val[g], q, sizeof q); o += (size_t)snprintf(s + o, sizeof s - o, "%s%s", g ? "," : "", q); }
            o += (size_t)snprintf(s + o, sizeof s - o, "} ↦ {");
            for (unsigned g = 0; g < B->nval && o + 16 < sizeof s; ++g) { char q[24]; iut_q_fmt(B->val[g], q, sizeof q); o += (size_t)snprintf(s + o, sizeof s - o, "%s%s", g ? "," : "", q); }
            snprintf(s + o, sizeof s - o, "}  O×μ #%u = #%u %s", A->units_copy, B->units_copy, A->units_copy == B->units_copy ? "✓" : "✗");
            txx(cr, 20, y, 11, TX_MONO | TX_ELLIPSIZE, INK, W - 40, s, NULL);
            y += 18;
        }
        y += 10;
    }
    const iut_hodge_theater *up = m->lat->ht[IUT_LAT_NOFF][1 + IUT_LAT_MOFF];
    if (up && up->nshell) {
        y += heading(cr, 20, y, W - 40, "log-shells at (0,1)  I_v = (p*)⁻¹·log(O×_{K_v})", "[IUTchIII] Def 1.1; [IUTchIV] Prop 1.2");
        double mx = 0;
        for (unsigned i = 0; i < up->nshell; ++i) if (fabs(up->shell[i].log_volume) > mx) mx = fabs(up->shell[i].log_volume);
        for (unsigned i = 0; i < up->nshell; ++i) {
            const iut_log_shell *S = &up->shell[i]; const iut_valuation *v = &d->V[S->v_index];
            char q[24]; iut_q_fmt(S->radius, q, sizeof q);
            if (v->kind == IUT_V_ARCH) snprintf(b, sizeof b, "%-6s       π-disc", v->name);
            else snprintf(b, sizeof b, "%-6s p* = %-3u p^{%s}·O", v->name, S->pstar, q);
            tx(cr, 20, y, 11.5, TX_MONO, INK, b);
            double bx = 260, bw = W - bx - 130;
            boxf(cr, bx, y + 3, bw, 12, 3, PAPER3);
            if (mx > 0) boxf(cr, bx, y + 3, bw * fabs(S->log_volume) / mx, 12, 3, TEAL);
            txf(cr, W - 20, y, 11.5, TX_RIGHT | TX_MONO, INK, "%+.6f", S->log_volume);
            y += 20;
        }
    }
    if (m->reached > GS_LAT) {
        y += 10;
        snprintf(b, sizeof b, "validation of the lattice: %u error(s) in %u checks", m->rlat.errors, m->rlat.n);
        pill(cr, 20, y, m->rlat.errors == 0, b);
        y += 30;
    }
    return y + 10;
}

/* ============================================================ stage 5 */
static double draw_mr(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_MR);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_MR]);
    if (m->reached <= GS_MR || !m->mr) return not_yet(cr, W, y, GS_MR);
    const iut_multiradial_full *mr = m->mr;
    char b[256];
    y += heading(cr, 20, y, W - 40, "the procession S±_{j+1} = {0..j} of tensor packets of log-shells", "[IUTchI] Prop 6.9; [IUTchIII] Thm 3.11 (i)");
    double mx = 1e-9;
    for (unsigned j = 0; j < mr->rep.nsteps; ++j) { const iut_procession_step *s = &mr->rep.step[j]; if (fabs(s->log_volume_leading) > mx) mx = fabs(s->log_volume_leading); if (fabs(s->theta_shift) > mx) mx = fabs(s->theta_shift); }
    double slot = 16, cx = W * 0.56, half = W * 0.18;
    tx(cr, cx - half / 2, y, 10.5, TX_CENTER, ORANGE, "theta shift −(j²/2l)·log q");
    tx(cr, cx + half / 2, y, 10.5, TX_CENTER, TEAL, "hull (j+1)·log d^K");
    tx(cr, W - 20, y, 10.5, TX_RIGHT, INK3, "sum");
    y += 18;
    for (unsigned j = 0; j < mr->rep.nsteps; ++j) {
        const iut_procession_step *s = &mr->rep.step[j];
        double maxslots = (cx - half - 150) / slot;
        unsigned shown = s->size < maxslots ? s->size : (unsigned)maxslots;
        txf(cr, 20, y + 2, 11, TX_MONO | TX_BOLD, INK, "j=%u", s->j);
        for (unsigned i = 0; i < shown; ++i) { col c = label_col((int)i); boxc(cr, 62 + i * slot, y + 1, slot - 3, 16, 3, PAPER, c); if (slot >= 14) txf(cr, 62 + i * slot + (slot - 3) / 2, y + 9, 8.5, TX_CENTER | TX_MIDDLE | TX_MONO, c, "%u", i); }
        txf(cr, 62 + shown * slot + 6, y + 2, 10, TX_MONO, INK3, "%u! = %u", s->size, s->perms);
        double wl = half * fabs(s->log_volume_leading) / mx, wt = half * fabs(s->theta_shift) / mx;
        boxf(cr, cx, y + 3, wl, 13, 2, TEAL);
        boxf(cr, cx - wt, y + 3, wt, 13, 2, ORANGE);
        line(cr, cx, y - 2, cx, y + 20, INK3, 1);
        txf(cr, W - 20, y + 2, 11, TX_RIGHT | TX_MONO, INK, "%.4f", s->log_volume_leading + s->theta_shift);
        y += 21;
    }
    y += 12;
    /* indeterminacies and contents */
    y += heading(cr, 20, y, W - 40, "the representation R^LGP_{0,◦} and its indeterminacies", "[IUTchIII] Thm 3.11; [Alien] §3.7 (i)");
    double x = 20;
    snprintf(b, sizeof b, "(Ind1) |Aut(Prc)| = Π (j+1)! = %llu", mr->ind1_count); x += pill(cr, x, y, -1, b) + 10;
    snprintf(b, sizeof b, "(Ind2) Ism on %llu summands", mr->ind2_summands); x += pill(cr, x, y, -1, b) + 10;
    if (x > W - 260) { x = 20; y += 30; }
    pill(cr, x, y, mr->ind3, "(Ind3) upper semi-compatibility");
    y += 30; x = 20;
    snprintf(b, sizeof b, "(a) %u tensor packets", mr->npackets); x += pill(cr, x, y, 1, b) + 10;
    snprintf(b, sizeof b, "(b) %u splitting monoids", mr->nsplitting); x += pill(cr, x, y, 1, b) + 10;
    snprintf(b, sizeof b, "(c) %u copies of F_mod^×", mr->nnumberfields); x += pill(cr, x, y, 1, b) + 10;
    if (x > W - 300) { x = 20; y += 30; }
    x += pill(cr, x, y, mr->log_kummer_ok, "log-Kummer non-interference") + 10;
    if (x > W - 300) { x = 20; y += 30; }
    pill(cr, x, y, mr->link_compat[0] && mr->link_compat[1] && mr->link_compat[2] && mr->link_compat[3], "compatible with the Θ×μ_LGP-link");
    y += 40;
    /* Cor 3.12 */
    y += heading(cr, 20, y, W - 40, "Cor 3.12, step by step", "[IUTchIII] Cor 3.12");
    for (unsigned k = 0; k < m->nc312; ++k) {
        double h = txw(cr, 20, y, 11.5, 0, INK, W - 470, m->c312[k].label);
        txf(cr, W - 290, y, 11.5, TX_RIGHT | TX_MONO | TX_BOLD, INK, "%.6g", m->c312[k].value);
        txw(cr, W - 280, y, 10.5, 0, INK3, 260, m->c312[k].ref);
        y += (h > 16 ? h : 16) + 6;
    }
    y += 8;
    /* the inequality on a number line */
    {
        double a = -mr->rep.abs_log_q, t = mr->rep.theta_upper_bound;
        double lo = a < t ? a : t, hi = a > t ? a : t;
        if (hi < 0) hi = 0;
        double pad = (hi - lo) * 0.15 + 0.5; lo -= pad; hi += pad;
        double lx = 60, lw = W - 120, ly = y + 34;
        line(cr, lx, ly, lx + lw, ly, INK3, 1.5);
        double xa = lx + lw * (a - lo) / (hi - lo), xt = lx + lw * (t - lo) / (hi - lo), x0 = lx + lw * (0 - lo) / (hi - lo);
        line(cr, x0, ly - 6, x0, ly + 6, INK3, 1); tx(cr, x0, ly + 8, 10, TX_CENTER | TX_MONO, INK3, "0");
        disc(cr, xa, ly, 7, BLUE, NULL, 0); txf(cr, xa, ly - 26, 11, TX_CENTER | TX_BOLD, BLUE, "−|log q| = %.4f", a);
        disc(cr, xt, ly, 7, ORANGE, NULL, 0); txf(cr, xt, ly + 12, 11, TX_CENTER | TX_BOLD, ORANGE, "−|log Θ| ≤ %.4f", t);
        y = ly + 40;
        snprintf(b, sizeof b, "Cor 3.12: −|log Θ| ≥ −|log q|   (C_Θ = %.6g ≥ −1)", mr->rep.C_theta);
        pill(cr, 20, y, m->c312ok, b);
        y += 36;
    }
    return y;
}

/* ============================================================ stage 6 */
static double logpos(double v, double lo, double hi, double x, double w)
{
    double lv = v > 0 ? log10(v) : lo;
    if (lv < lo) lv = lo;
    if (lv > hi) lv = hi;
    return x + w * (lv - lo) / (hi - lo);
}

static double draw_hb(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_HB);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_HB]);
    if (m->reached <= GS_HB) return not_yet(cr, W, y, GS_HB);
    const iut_thm110 *T = &m->T; const iut_cor22 *C = &m->C;
    char b[256];
    y += heading(cr, 20, y, W - 40, "the quantities of Thm 1.10", "[IUTchIV] Thm 1.10");
    struct { const char *k; double v; const char *fmt; } q[] = {
        { "log q", T->logq, "%.6f" }, { "|log q| = log q / 2l", T->abs_logq, "%.6f" }, { "log d^Ftpd (log-different)", T->logd_tpd, "%.6f" },
        { "log f^Ftpd (log-conductor)", T->logf_tpd, "%.6f" }, { "e*_mod", T->estar_mod, "%.0f" }, { "η_prm", T->eta_prm, "%.3g" }, { "C_Θ", T->C_theta, "%.6g" } };
    int cols = W > 800 ? 2 : 1; double cw = (W - 40) / cols;
    for (int k = 0; k < 7; ++k) {
        double x = 20 + (k % cols) * cw, yy = y + (k / cols) * 24;
        tx(cr, x, yy, 12, 0, INK2, q[k].k);
        snprintf(b, sizeof b, q[k].fmt, q[k].v);
        tx(cr, x + cw - 30, yy, 12.5, TX_RIGHT | TX_MONO | TX_BOLD, INK, b);
    }
    y += ((7 + cols - 1) / cols) * 24 + 14;
    /* the inequality on a log scale */
    y += heading(cr, 20, y, W - 40, "(1/6)·log q  ≤  (1 + 20·d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod·l + η_prm)", "log₁₀ scale");
    {
        double lo = -1, hi = ceil(log10(T->rhs > 10 ? T->rhs : 10)) + 1;
        double lx = 60, lw = W - 120, ly = y + 40;
        line(cr, lx, ly, lx + lw, ly, INK3, 1.5);
        for (int e = (int)lo; e <= (int)hi; e += (hi - lo > 12 ? 2 : 1)) {
            double xx = lx + lw * (e - lo) / (hi - lo);
            line(cr, xx, ly - 4, xx, ly + 4, INK3, 1);
            txf(cr, xx, ly + 8, 9.5, TX_CENTER | TX_MONO, INK3, "10^%d", e);
        }
        double xl = logpos(T->lhs, lo, hi, lx, lw), xr = logpos(T->rhs, lo, hi, lx, lw);
        boxf(cr, xl, ly - 3, xr - xl, 6, 3, GREENBG);
        disc(cr, xl, ly, 8, BLUE, NULL, 0); txf(cr, xl, ly - 32, 11.5, TX_CENTER | TX_BOLD, BLUE, "(1/6) log q = %.4f", T->lhs);
        disc(cr, xr, ly, 8, ORANGE, NULL, 0); txf(cr, xr, ly - 32, 11.5, TX_RIGHT | TX_BOLD, ORANGE, "right side = %.4g", T->rhs);
        double gap = T->lhs > 0 ? log10(T->rhs / T->lhs) : 0;
        txf(cr, (xl + xr) / 2, ly + 26, 11, TX_CENTER | TX_ITALIC, INK2, "%.1f orders of magnitude of room", gap);
        y = ly + 52;
        pill(cr, 20, y, T->inequality_holds, !T->inequality_holds ? "Thm 1.10 fails" : T->constant_dominates ? "Thm 1.10 holds, through its constant alone" : "Thm 1.10 holds for this curve");
        y += 40;
    }
    /* Cor 2.2 */
    y += heading(cr, 20, y, W - 40, "Cor 2.2: the range (C1) of l, and the inequality (C2)", "[IUTchIV] Cor 2.2");
    {
        snprintf(b, sizeof b, "log q∀ = %.6f (places above 2 included)    ε_E = %.4g", C->logq_all, C->eps_E);
        tx(cr, 20, y, 12, TX_MONO, INK, b);
        y += 26;
        double lo = 0, hi = ceil(log10(C->l_max > 100 ? C->l_max : 100)) + 0.5;
        double lx = 60, lw = W - 120, ly = y + 30;
        line(cr, lx, ly, lx + lw, ly, INK3, 1.5);
        for (int e = 0; e <= (int)hi; e += (hi > 12 ? 2 : 1)) { double xx = lx + lw * (e - lo) / (hi - lo); line(cr, xx, ly - 4, xx, ly + 4, INK3, 1); txf(cr, xx, ly + 8, 9.5, TX_CENTER | TX_MONO, INK3, "10^%d", e); }
        double x1 = logpos(C->l_min, lo, hi, lx, lw), x2 = logpos(C->l_max, lo, hi, lx, lw), xl = logpos(m->data.l, lo, hi, lx, lw);
        boxf(cr, x1, ly - 6, x2 - x1 > 2 ? x2 - x1 : 2, 12, 4, TEALBG);
        txf(cr, x1, ly - 24, 10.5, TX_CENTER, TEAL, "l_min = %.3f", C->l_min);
        txf(cr, x2, ly - 24, 10.5, TX_RIGHT, TEAL, "l_max = %.4g", C->l_max);
        disc(cr, xl, ly, 7, C->l_in_range ? GREEN : RED, NULL, 0);
        txf(cr, xl, ly + 22, 11, TX_CENTER | TX_BOLD, C->l_in_range ? GREEN : RED, "l = %u", m->data.l);
        y = ly + 48;
        double x = 20;
        x += pill(cr, x, y, C->l_in_range, C->l_in_range ? "(C1) l in range" : "(C1) l out of range") + 10;
        snprintf(b, sizeof b, "(C2) %.6f ≤ %.6g", C->lhs, C->rhs);
        x += pill(cr, x, y, C->holds, b) + 10;
        if (C->in_exceptional_set) pill(cr, x, y, 0, "in the exceptional set: Cor 2.2 asserts nothing here");
        y += 40;
    }
    return y;
}

/* ============================================================ stage 7 */
static double draw_xc(cairo_t *cr, double W, const gm_model *m)
{
    double y = stage_title(cr, W, m, GS_XC);
    y += paragraph(cr, 20, y, W - 40, STAGE_TEXT[GS_XC]);
    if (m->reached <= GS_XC) return not_yet(cr, W, y, GS_XC);
    if (!m->nxc) {
        boxc(cr, 20, y, W - 40, 60, 10, PAPER2, LINE);
        tx(cr, W / 2, y + 30, 13, TX_CENTER | TX_MIDDLE, INK2, "No cross-check: this Θ-data was generated by the toolkit, not read from a JSON file.");
        y += 80;
    } else {
        char b[160]; snprintf(b, sizeof b, "%s.json", m->data.source_id);
        y += heading(cr, 20, y, W - 40, b, "docs/initial-theta-data/");
        tx(cr, W - 250, y, 11, TX_RIGHT | TX_BOLD, INK3, "toolkit");
        tx(cr, W - 100, y, 11, TX_RIGHT | TX_BOLD, INK3, "file");
        y += 20;
        for (unsigned k = 0; k < m->nxc; ++k) {
            const gm_xcheck *x = &m->xc[k];
            boxf(cr, 20, y - 3, W - 40, 26, 6, x->ok ? GREENBG : REDBG);
            tx(cr, 30, y + 1, 13, TX_BOLD, x->ok ? GREEN : RED, x->ok ? "✓" : "✗");
            tx(cr, 52, y + 2, 12, TX_MONO, INK, x->what);
            txf(cr, W - 250, y + 2, 12, TX_RIGHT | TX_MONO, INK, "%.6f", x->toolkit);
            txf(cr, W - 100, y + 2, 12, TX_RIGHT | TX_MONO, INK, "%.6f", x->file);
            y += 32;
        }
    }
    y += 10;
    int p = gm_problems(m);
    char b[200];
    snprintf(b, sizeof b, "pipeline %s: %d problem(s)  (Def 3.1: %u, Hodge theater: %u, lattice: %u, Cor 3.12: %s, cross-check: %u)",
             p ? "FAILED" : "complete", p, m->rdata.errors, m->rht.errors, m->rlat.errors, m->c312ok ? "holds" : "fails", m->xbad);
    pill(cr, 20, y, p == 0, b);
    y += 34;
    snprintf(b, sizeof b, "`iut pipeline` on the same data reports %d problem(s): %s", m->pipeline_problems, m->pipeline_problems == p ? "the two agree" : "THEY DISAGREE");
    tx(cr, 20, y, 11.5, TX_ITALIC, m->pipeline_problems == p ? INK2 : RED, b);
    return y + 40;
}

/* ============================================================ dispatch */
double gd_stage(cairo_t *cr, double W, const gm_model *m, int stage, gd_hits *hits)
{
    rgb(cr, PAPER); cairo_paint(cr);
    if (hits) hits->nv = 0;
    if (!m->loaded) { tx(cr, W / 2, 80, 15, TX_CENTER, INK2, "Load some initial Θ-data with the bench above."); return 200; }
    switch (stage) {
    case GS_DATA: return draw_data(cr, W, m);
    case GS_DEF:  return draw_def(cr, W, m);
    case GS_HT:   return draw_ht(cr, W, m);
    case GS_GAU:  return draw_gau(cr, W, m);
    case GS_LAT:  return draw_lat(cr, W, m, hits);
    case GS_MR:   return draw_mr(cr, W, m);
    case GS_HB:   return draw_hb(cr, W, m);
    default:      return draw_xc(cr, W, m);
    }
}

/* the Lattice page: the whole 9 × 13 lattice */
double gd_lattice_page(cairo_t *cr, double W, double H, const gm_model *m, gd_hits *hits)
{
    rgb(cr, PAPER); cairo_paint(cr);
    if (hits) hits->nv = 0;
    tx(cr, 20, 14, 19, TX_BOLD, INK, "the log-theta-lattice");
    tx(cr, W - 20, 19, 12, TX_RIGHT, INK3, "[IUTchIII] Def 1.4, Fig. I.1");
    char b[300];
    if (!m->lat) {
        txw(cr, 20, 50, 13, 0, INK2, W - 40, "The lattice appears once stage 2 has built the Hodge theaters. Step the pipeline, or press Run all.");
        return H;
    }
    unsigned nht = 0; for (int i = 0; i < IUT_LAT_N; ++i) for (int j = 0; j < IUT_LAT_M; ++j) nht += m->lat->ht[i][j] != NULL;
    snprintf(b, sizeof b, "%u Hodge theaters, %u links. Click a vertex to select it: its Hodge theater is drawn in stage 2 and listed in the inspector. %s",
             nht, m->lat->nlinks,
             m->reached >= GS_COUNT ? "The pipeline is complete, so further log-links (↑) and Θ-links (→) can be applied from the selected vertex with the buttons above."
                                    : "Further links can be applied by hand once the pipeline is complete.");
    double h = txw(cr, 20, 44, 12.5, 0, INK2, W - 40, b);
    double top = 44 + h + 30, bot = H - 70;
    if (bot - top < 300) bot = top + 300;
    /* show the part of the 9 × 13 lattice that holds Hodge theaters, with a margin of one for the next links */
    int n0 = IUT_LAT_NOFF, n1 = -IUT_LAT_NOFF, m0 = IUT_LAT_MOFF, m1 = -IUT_LAT_MOFF;
    for (int n = -IUT_LAT_NOFF; n <= IUT_LAT_NOFF; ++n) for (int mm = -IUT_LAT_MOFF; mm <= IUT_LAT_MOFF; ++mm)
        if (m->lat->ht[n + IUT_LAT_NOFF][mm + IUT_LAT_MOFF]) { if (n < n0) n0 = n; if (n > n1) n1 = n; if (mm < m0) m0 = mm; if (mm > m1) m1 = mm; }
    n0 = n0 - 1 < -IUT_LAT_NOFF ? -IUT_LAT_NOFF : n0 - 1; n1 = n1 + 1 > IUT_LAT_NOFF ? IUT_LAT_NOFF : n1 + 1;
    m0 = m0 - 1 < -IUT_LAT_MOFF ? -IUT_LAT_MOFF : m0 - 1; m1 = m1 + 1 > IUT_LAT_MOFF ? IUT_LAT_MOFF : m1 + 1;
    gd_lattice(cr, 80, top, W - 110, bot - top, m, n0, n1, m0, m1, hits, 1);
    lattice_legend(cr, 20, bot + 26, W - 40);
    return bot + 60;
}

/* ============================================================ abc */
static void sup(unsigned e, char *out, size_t on)
{
    static const char *D[10] = { "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹" };
    char d[16]; snprintf(d, sizeof d, "%u", e);
    size_t o = 0; out[0] = 0;
    for (const char *c = d; *c && o + 4 < on; ++c) { size_t k = strlen(D[*c - '0']); memcpy(out + o, D[*c - '0'], k); o += k; out[o] = 0; }
}

static int fmt_factors(const gm_factor *f, unsigned n, char *out, size_t on)
{
    size_t o = 0; out[0] = 0;
    if (!n) return snprintf(out, on, "1");
    for (unsigned i = 0; i < n && o + 40 < on; ++i) {
        char e[24]; sup(f[i].e, e, sizeof e);
        if (f[i].e > 1) o += (size_t)snprintf(out + o, on - o, "%s%llu%s", i ? "·" : "", f[i].p, e);
        else o += (size_t)snprintf(out + o, on - o, "%s%llu", i ? "·" : "", f[i].p);
    }
    return (int)o;
}

double gd_abc(cairo_t *cr, double W, const gm_model *m)
{
    rgb(cr, PAPER); cairo_paint(cr);
    tx(cr, 20, 14, 19, TX_BOLD, INK, "the abc triple");
    tx(cr, W - 20, 19, 12, TX_RIGHT, INK3, "[ExpEst] Thm A, B; [IUTchIV] Cor 2.3");
    if (!m->loaded || !m->have_abc) {
        txw(cr, 20, 54, 13, 0, INK2, W - 40, "This Θ-data does not come from an abc triple (it is a built-in synthetic example, random data, or a curve such as 11a1). "
            "Choose “abc triple” on the bench, or one of the Frey-curve JSON examples, to see the triple here.");
        return 160;
    }
    const gm_abc *x = &m->abc;
    const iut_initial_theta_data *d = &m->data;
    char fa[256], fb[256], fc[256], mk[1024];
    fmt_factors(x->f[0], x->nf[0], fa, sizeof fa); fmt_factors(x->f[1], x->nf[1], fb, sizeof fb); fmt_factors(x->f[2], x->nf[2], fc, sizeof fc);
    double y = 54;
    snprintf(mk, sizeof mk, "<span foreground='#2563eb'>%lld</span>  +  <span foreground='#ea580c'>%lld</span>  =  <span foreground='#15803d'>%lld</span>", x->a, x->b, x->c);
    tx(cr, W / 2, y, 30, TX_CENTER | TX_MARKUP | TX_SERIF, INK, mk);
    y += 46;
    snprintf(mk, sizeof mk, "<span foreground='#2563eb'>%s</span>  +  <span foreground='#ea580c'>%s</span>  =  <span foreground='#15803d'>%s</span>", fa, fb, fc);
    tx(cr, W / 2, y, 20, TX_CENTER | TX_MARKUP | TX_SERIF, INK, mk);
    y += 44;
    /* rad and quality */
    double rad = exp(x->log_rad);
    char b[256];
    snprintf(b, sizeof b, "rad(abc) = %.0f      quality q = log c / log rad(abc) = %.6f", rad, x->quality);
    tx(cr, W / 2, y, 14, TX_CENTER | TX_MONO | TX_BOLD, INK, b);
    y += 28;
    {
        double w; int hit = x->quality > 1;
        txx(cr, 0, -1000, 11.5, TX_BOLD, INK, 0, hit ? "an abc hit: c > rad(abc)" : "not a hit: c ≤ rad(abc)", &w);
        pill(cr, W / 2 - (w + 30) / 2, y, hit ? 1 : -1, hit ? "an abc hit: c > rad(abc)" : "not a hit: c ≤ rad(abc)");
        y += 36;
    }
    /* c versus rad on a log scale */
    {
        double hi = x->log_c > x->log_rad ? x->log_c : x->log_rad; hi *= 1.1;
        double lx = 140, lw = W - 200;
        tx(cr, 20, y, 12, TX_BOLD, GREEN, "log c"); boxf(cr, lx, y + 2, lw * x->log_c / hi, 16, 4, GREEN); txf(cr, lx + lw * x->log_c / hi + 8, y + 1, 11.5, TX_MONO, INK, "%.4f", x->log_c);
        y += 24;
        tx(cr, 20, y, 12, TX_BOLD, VIOLET, "log rad(abc)"); boxf(cr, lx, y + 2, lw * x->log_rad / hi, 16, 4, VIOLET); txf(cr, lx + lw * x->log_rad / hi + 8, y + 1, 11.5, TX_MONO, INK, "%.4f", x->log_rad);
        y += 34;
    }
    /* prime blocks */
    y += heading(cr, 20, y, W - 40, "the primes of abc: each square is one power of p, coloured by the number it divides", NULL);
    {
        double bx = 30, sq = 16;
        unsigned maxe = 1;
        for (int k = 0; k < 3; ++k) for (unsigned i = 0; i < x->nf[k]; ++i) if (x->f[k][i].e > maxe) maxe = x->f[k][i].e;
        if (maxe > 12) sq = 192.0 / maxe;
        double base = y + 8 + maxe * (sq + 2);
        col cc[3] = { BLUE, ORANGE, GREEN };
        for (int k = 0; k < 3; ++k) for (unsigned i = 0; i < x->nf[k]; ++i) {
            const gm_factor *f = &x->f[k][i];
            for (unsigned e = 0; e < f->e; ++e) boxf(cr, bx, base - (e + 1) * (sq + 2), 34, sq, 3, cc[k]);
            txf(cr, bx + 17, base + 4, 12, TX_CENTER | TX_MONO | TX_BOLD, INK, "%llu", f->p);
            bx += 48;
            if (bx > W - 60) break;
        }
        y = base + 30;
        if (x->probable) { tx(cr, 20, y, 11, TX_ITALIC, YELLOW, "a cofactor above 3037000² was taken to be prime"); y += 20; }
    }
    /* the Frey curve and its places */
    y += heading(cr, 20, y, W - 40, "the Frey curve and its places", "[IUTchIV] §2; [ExpEst]");
    snprintf(b, sizeof b, "E: y² = x(x − %lld)(x + %lld)      Δ = 16·(abc)²      F_mod = Q(j_E) = Q", x->a, x->b);
    tx(cr, 20, y, 13, TX_MONO, INK, b);
    y += 26;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind == IUT_V_ARCH) continue;
        col bg, fg = place_col(v, &bg);
        boxf(cr, 20, y - 2, W - 40, 22, 5, bg);
        txf(cr, 30, y + 1, 12, TX_MONO | TX_BOLD, fg, "%s", v->name);
        const char *red = v->red == IUT_RED_GOOD ? "good reduction" : v->red == IUT_RED_BAD_ADD ? "additive reduction" : "split multiplicative reduction";
        txf(cr, 100, y + 1, 12, 0, INK, "p = %u   %s", v->p, red);
        if (v->red == IUT_RED_BAD_MULT) txf(cr, W - 30, y + 1, 12, TX_RIGHT | TX_MONO, INK, "ord(q_v) = −ord(j_E) = %u%s", v->ordq, v->in_Vbad_mod ? "   ∈ V^bad_mod" : "   (p = 2: only in log q∀)");
        y += 26;
    }
    y += 8;
    snprintf(b, sizeof b, "log q = %.6f      ht = log q / 6 = %.6f      log f over V^bad_mod = %.6f      l = %u", iut_log_q(d), iut_height_from_q(d), iut_log_cond_bad(d), d->l);
    tx(cr, 20, y, 12, TX_MONO, INK2, b);
    y += 26;
    txw(cr, 20, y, 12, TX_ITALIC, INK2, W - 40, "The abc conjecture says the quality q is bounded by 1 + ε up to finitely many exceptions; [IUTchIV] Cor 2.3 derives it from "
        "the height bound of stage 6 applied to Frey curves like this one. Run the pipeline to see that bound computed for this triple.");
    return y + 60;
}

/* ============================================================ the stage rail */
#define RAIL_TOP 14
#define RAIL_STEP 66
int gd_rail_hit(double y)
{
    int k = (int)floor((y - RAIL_TOP) / RAIL_STEP);
    return k >= 0 && k < GS_COUNT ? k : -1;
}

void gd_rail(cairo_t *cr, double W, double H, const gm_model *m)
{
    rgb(cr, PAPER2); cairo_paint(cr);
    for (int k = 0; k < GS_COUNT; ++k) {
        double y = RAIL_TOP + k * RAIL_STEP, cy = y + 22;
        int done = m->reached > k, cur = m->loaded && m->reached == k, view = m->view == k && m->loaded;
        if (view) boxf(cr, 6, y, W - 12, RAIL_STEP - 6, 9, BLUEBG);
        if (k < GS_COUNT - 1) line(cr, 26, cy + 14, 26, cy + RAIL_STEP - 14, done && m->reached > k + 1 ? GREEN : LINE, 2);
        col fill = !done ? PAPER : m->ok[k] == 0 ? RED : m->ok[k] == 2 ? INK3 : GREEN;
        col stroke = cur ? BLUE : !done ? LINE : fill;
        disc(cr, 26, cy, 13, fill, &stroke, cur ? 2.5 : 1.5);
        tx(cr, 26, cy, 12, TX_CENTER | TX_MIDDLE | TX_BOLD, done ? PAPER : cur ? BLUE : INK3, done ? (m->ok[k] == 0 ? "✗" : m->ok[k] == 2 ? "–" : "✓") : gm_stages[k].num);
        txx(cr, 48, y + 6, 12.5, TX_BOLD | TX_ELLIPSIZE, done || cur ? INK : INK3, W - 54, gm_stages[k].title, NULL);
        txx(cr, 48, y + 25, 10, TX_ELLIPSIZE, INK3, W - 54, gm_stages[k].ref, NULL);
        if (k == GS_LAT && m->loaded && m->reached >= GS_LAT) {
            double bw = W - 60;
            boxf(cr, 48, y + 43, bw, 5, 2.5, PAPER3);
            boxf(cr, 48, y + 43, bw * m->done_links / (m->nplan ? m->nplan : 1), 5, 2.5, m->reached > GS_LAT ? GREEN : BLUE);
        }
    }
    double y = RAIL_TOP + GS_COUNT * RAIL_STEP + 4;
    if (m->loaded) {
        char b[160]; int p = gm_problems(m);
        if (m->reached >= GS_COUNT) { if (p) snprintf(b, sizeof b, "%d problem(s)", p); else snprintf(b, sizeof b, "pipeline complete"); } else snprintf(b, sizeof b, "%d problem(s) so far", p);
        pill(cr, 10, y, m->reached >= GS_COUNT ? p == 0 : p == 0 ? -1 : 0, b);
    }
    (void)H;
}
