/*
 * gui_main.c — iut-gui: the window.
 *
 *   ┌ bench: where the initial Θ-data comes from (abc triple + l, built-in example, random, exact JSON) ┐
 *   ├ controls: Reset · Step · Run all · Play                                       progress, problems ┤
 *   │ stage rail │ Stage · Lattice · abc triple · Processes · Transcript             │ object inspector │
 *   │            ├────────────────────────────────────────────────────────────────── │  (every object   │
 *   │            │ State log · Stage transcript                                      │   built so far)  │
 *   └────────────┴───────────────────────────────────────────────────────────────────┴──────────────────┘
 *
 * usage: iut-gui [data options] [--rows R] [--horizontal theta|xmu|gau|LGP|lgp]
 *        iut-gui --check                            headless: run every example, compare with `iut pipeline`
 *        iut-gui [data options] --render-stage N --out FILE.png [--width W] [--steps K | --run]
 *        iut-gui [data options] --screenshot FILE.png [--tab stage|lattice|abc|processes|transcript]
 *                [--view N] [--steps K | --run] [--select N,M] [--size WxH]
 * data options as for `iut`: --abc A B C  --l L  --example K  --random SEED  --theta-json FILE
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <gtk/gtk.h>
#include "gui.h"
#include "gui_draw.h"
#include "gui_tree.h"

typedef struct {
    gm_model m;
    GtkWidget *win;
    /* bench */
    GtkWidget *src_combo, *src_stack;
    GtkWidget *e_a, *e_b, *e_c, *l_combo, *abc_preset;
    GtkWidget *ex_spin, *seed_spin, *json_combo;
    GtkWidget *horiz_combo, *rows_spin, *bench_msg;
    char json_dir[2048];
    char *json_files[64]; int njson;
    /* controls */
    GtkWidget *b_reset, *b_step, *b_run, *b_play, *speed, *progress, *problems;
    guint play_id;
    /* main */
    GtkWidget *rail, *nb, *stage_area, *stage_scroll, *lat_area, *abc_area;
    GtkWidget *sel_label, *b_log_up, *b_theta;
    GtkWidget *proc_view, *proc_text, *proc_summary;
    GtkWidget *transcript_text, *log_text, *stage_text, *bottom_nb;
    GtkWidget *tree_view, *ident_label; GtkTreeStore *store;
    gd_hits stage_hits, lat_hits;
    int in_select;
    int stage_h, lat_h, abc_h;
} app;

static const struct { const char *label; long long a, b, c; } ABC_PRESETS[] = {
    { "1 + 8 = 9", 1, 8, 9 }, { "5 + 27 = 32", 5, 27, 32 }, { "1 + 48 = 49", 1, 48, 49 }, { "1 + 63 = 64", 1, 63, 64 },
    { "1 + 80 = 81", 1, 80, 81 }, { "32 + 49 = 81", 32, 49, 81 }, { "3 + 125 = 128", 3, 125, 128 }, { "1 + 242 = 243", 1, 242, 243 },
    { "1 + 2400 = 2401", 1, 2400, 2401 }, { "1 + 4374 = 4375", 1, 4374, 4375 }, { "2 + 6436341 = 6436343", 2, 6436341, 6436343 },
    { "121 + 48234375 = 48234496", 121, 48234375, 48234496 },
};
#define NABC (sizeof ABC_PRESETS / sizeof ABC_PRESETS[0])
static const char *HORIZ_ID[] = { "theta", "xmu", "gau", "LGP", "lgp" };
static const iut_link_kind HORIZ_KIND[] = { IUT_LINK_THETA, IUT_LINK_THETA_UNITSMODTORS, IUT_LINK_THETA_UNITSMODTORS_GAU, IUT_LINK_THETA_UNITSMODTORS_LGP, IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL };

static void refresh(app *A, int rebuild_tree);

/* ================================================================ text views */
static void text_set(GtkWidget *tv, const char *s)
{
    GtkTextBuffer *b = gtk_text_view_get_buffer(GTK_TEXT_VIEW(tv));
    gtk_text_buffer_set_text(b, s ? s : "", -1);
}

static void log_refresh(app *A)
{
    GtkTextBuffer *b = gtk_text_view_get_buffer(GTK_TEXT_VIEW(A->log_text));
    gtk_text_buffer_set_text(b, A->m.log ? A->m.log : "", -1);
    GtkTextIter s, e;
    size_t mark = A->m.log_mark <= A->m.loglen ? A->m.log_mark : 0;
    glong off = A->m.log ? g_utf8_pointer_to_offset(A->m.log, A->m.log + mark) : 0;
    gtk_text_buffer_get_iter_at_offset(b, &s, (gint)off);
    gtk_text_buffer_get_end_iter(b, &e);
    gtk_text_buffer_apply_tag_by_name(b, "new", &s, &e);
    GtkTextMark *mk = gtk_text_buffer_create_mark(b, NULL, &e, FALSE);
    gtk_text_view_scroll_to_mark(GTK_TEXT_VIEW(A->log_text), mk, 0, FALSE, 0, 1);
    gtk_text_buffer_delete_mark(b, mk);
}

static void transcript_refresh(app *A)
{
    const gm_model *m = &A->m;
    GString *s = g_string_new(m->transcript_head ? m->transcript_head : "");
    for (int k = 0; k < GS_COUNT && k < m->reached; ++k) if (m->transcript[k]) g_string_append(s, m->transcript[k]);
    if (m->reached >= GS_COUNT && m->transcript_tail) g_string_append(s, m->transcript_tail);
    else g_string_append_printf(s, "\n… the transcript grows as the stages run (%d of %d done).\n", m->reached, GS_COUNT);
    text_set(A->transcript_text, s->str);
    g_string_free(s, TRUE);
    const char *t = m->view >= 0 && m->view < GS_COUNT ? m->transcript[m->view] : NULL;
    if (m->view == GS_XC && !t) t = "(no stage 7: the data was not read from a JSON file)\n";
    if (m->reached <= m->view && !(m->view == GS_LAT && m->reached == GS_LAT)) t = "(this stage has not run yet)\n";
    text_set(A->stage_text, t);
}

/* ================================================================ inspector */
static void collect_expanded(GtkTreeView *tv, GtkTreePath *path, gpointer data)
{
    g_ptr_array_add((GPtrArray *)data, gtk_tree_path_to_string(path));
    (void)tv;
}

static void tree_refresh(app *A)
{
    GPtrArray *exp = g_ptr_array_new_with_free_func(g_free);
    gtk_tree_view_map_expanded_rows(GTK_TREE_VIEW(A->tree_view), collect_expanded, exp);
    int fresh = exp->len == 0;
    GtkTreeModel *model = GTK_TREE_MODEL(A->store);
    g_object_ref(model);
    gtk_tree_view_set_model(GTK_TREE_VIEW(A->tree_view), NULL);
    gt_rebuild(A->store, &A->m);
    gtk_tree_view_set_model(GTK_TREE_VIEW(A->tree_view), model);
    g_object_unref(model);
    for (guint i = 0; i < exp->len; ++i) {
        GtkTreePath *p = gtk_tree_path_new_from_string(g_ptr_array_index(exp, i));
        gtk_tree_view_expand_row(GTK_TREE_VIEW(A->tree_view), p, FALSE);
        gtk_tree_path_free(p);
    }
    if (fresh) { GtkTreePath *p = gtk_tree_path_new_first(); gtk_tree_view_expand_row(GTK_TREE_VIEW(A->tree_view), p, FALSE); gtk_tree_path_free(p); }
    g_ptr_array_free(exp, TRUE);
}

/* find the row of a key (first match, depth-first) */
static gboolean find_key(GtkTreeModel *model, GtkTreeIter *parent, const char *key, GtkTreeIter *out)
{
    GtkTreeIter it;
    if (!gtk_tree_model_iter_children(model, &it, parent)) return FALSE;
    do {
        gchar *k = NULL; gtk_tree_model_get(model, &it, TC_KEY, &k, -1);
        int hit = k && !strcmp(k, key);
        g_free(k);
        if (hit) { *out = it; return TRUE; }
        if (find_key(model, &it, key, out)) return TRUE;
    } while (gtk_tree_model_iter_next(model, &it));
    return FALSE;
}

static void tree_show_vertex(app *A, int n, int mm)
{
    char key[32]; snprintf(key, sizeof key, "ht:%d:%d", n, mm);
    GtkTreeIter it;
    if (!find_key(GTK_TREE_MODEL(A->store), NULL, key, &it)) return;
    GtkTreePath *p = gtk_tree_model_get_path(GTK_TREE_MODEL(A->store), &it);
    gtk_tree_view_expand_to_path(GTK_TREE_VIEW(A->tree_view), p);
    gtk_tree_view_collapse_row(GTK_TREE_VIEW(A->tree_view), p);
    A->in_select = 1;
    gtk_tree_selection_select_path(gtk_tree_view_get_selection(GTK_TREE_VIEW(A->tree_view)), p);
    A->in_select = 0;
    gtk_tree_view_scroll_to_cell(GTK_TREE_VIEW(A->tree_view), p, NULL, TRUE, 0.2, 0);
    gtk_tree_path_free(p);
}

static void on_tree_select(GtkTreeSelection *sel, app *A)
{
    GtkTreeModel *model; GtkTreeIter it;
    if (!gtk_tree_selection_get_selected(sel, &model, &it)) return;
    gchar *name = NULL, *value = NULL, *ident = NULL, *key = NULL;
    gtk_tree_model_get(model, &it, TC_NAME, &name, TC_VALUE, &value, TC_IDENT, &ident, TC_KEY, &key, -1);
    const iut_ident *id = ident && *ident ? iut_ident_find(ident) : NULL;
    gchar *mk;
    if (id) mk = g_markup_printf_escaped("<b>%s</b>   <tt>%s</tt> · %s\n<span foreground='#4b5563'>%s</span>\n<i>%s</i>", id->notation, id->id, id->kind, id->desc, id->ref);
    else mk = g_markup_printf_escaped("<b>%s</b>\n<span foreground='#4b5563'>%s</span>", name ? name : "", value ? value : "");
    gtk_label_set_markup(GTK_LABEL(A->ident_label), mk);
    g_free(mk);
    if (!A->in_select && key) {
        int n, mm, k;
        if (sscanf(key, "ht:%d:%d", &n, &mm) == 2) { A->m.sel_n = n; A->m.sel_m = mm; refresh(A, 0); }
        else if (sscanf(key, "stage:%d", &k) == 1 && k >= 0 && k < GS_COUNT) { A->m.view = k; refresh(A, 0); }
    }
    g_free(name); g_free(value); g_free(ident); g_free(key);
}

/* ================================================================ refresh */
static void controls_refresh(app *A)
{
    char b[256]; gm_progress(&A->m, b, sizeof b);
    gtk_label_set_text(GTK_LABEL(A->progress), b);
    int p = gm_problems(&A->m);
    char pb[64]; snprintf(pb, sizeof pb, "%d problem(s)", p);
    char *mk = g_markup_printf_escaped("<b><span foreground='%s'>%s</span></b>", p ? "#dc2626" : "#15803d",
                                       !A->m.loaded ? "" : p ? pb : A->m.reached >= GS_COUNT ? "0 problems: the pipeline went through" : "0 problems so far");
    gtk_label_set_markup(GTK_LABEL(A->problems), mk); g_free(mk);
    int more = A->m.loaded && A->m.reached < GS_COUNT;
    gtk_widget_set_sensitive(A->b_step, more);
    gtk_widget_set_sensitive(A->b_run, more);
    gtk_widget_set_sensitive(A->b_play, more || A->play_id);
    gtk_widget_set_sensitive(A->b_reset, A->m.loaded);
    int ex = A->m.reached >= GS_COUNT;
    gtk_widget_set_sensitive(A->b_log_up, ex && iut_lattice_in_range(A->m.sel_n, A->m.sel_m + 1));
    gtk_widget_set_sensitive(A->b_theta, ex && iut_lattice_in_range(A->m.sel_n + 1, A->m.sel_m));
    snprintf(b, sizeof b, "selected vertex (%d, %d)", A->m.sel_n, A->m.sel_m);
    gtk_label_set_text(GTK_LABEL(A->sel_label), b);
}

static void refresh(app *A, int rebuild_tree)
{
    if (rebuild_tree) { tree_refresh(A); log_refresh(A); }
    transcript_refresh(A);
    controls_refresh(A);
    gtk_widget_queue_draw(A->rail);
    gtk_widget_queue_draw(A->stage_area);
    gtk_widget_queue_draw(A->lat_area);
    gtk_widget_queue_draw(A->abc_area);
}

/* ================================================================ drawing callbacks */
static void fit_height(GtkWidget *w, int *cur, double h)
{
    int hi = (int)ceil(h);
    if (hi != *cur) { *cur = hi; gtk_widget_set_size_request(w, -1, hi); }
}

static gboolean on_draw_stage(GtkWidget *w, cairo_t *cr, app *A)
{
    double W = gtk_widget_get_allocated_width(w);
    fit_height(w, &A->stage_h, gd_stage(cr, W, &A->m, A->m.view, &A->stage_hits));
    return TRUE;
}
static gboolean on_draw_lat(GtkWidget *w, cairo_t *cr, app *A)
{
    double W = gtk_widget_get_allocated_width(w), H = gtk_widget_get_allocated_height(w);
    gd_lattice_page(cr, W, H, &A->m, &A->lat_hits);
    return TRUE;
}
static gboolean on_draw_abc(GtkWidget *w, cairo_t *cr, app *A)
{
    double W = gtk_widget_get_allocated_width(w);
    fit_height(w, &A->abc_h, gd_abc(cr, W, &A->m));
    return TRUE;
}
static gboolean on_draw_rail(GtkWidget *w, cairo_t *cr, app *A)
{
    gd_rail(cr, gtk_widget_get_allocated_width(w), gtk_widget_get_allocated_height(w), &A->m);
    return TRUE;
}

static int hit_vertex(const gd_hits *h, double x, double y, int *n, int *mm)
{
    for (int k = 0; k < h->nv; ++k) {
        double dx = x - h->v[k].x, dy = y - h->v[k].y;
        if (dx * dx + dy * dy <= h->v[k].r * h->v[k].r) { *n = h->v[k].n; *mm = h->v[k].m; return 1; }
    }
    return 0;
}

static void select_vertex(app *A, int n, int mm)
{
    A->m.sel_n = n; A->m.sel_m = mm;
    tree_show_vertex(A, n, mm);
    refresh(A, 0);
}

static gboolean on_click_stage(GtkWidget *w, GdkEventButton *e, app *A)
{
    int n, mm;
    if (A->m.view == GS_LAT && hit_vertex(&A->stage_hits, e->x, e->y, &n, &mm)) select_vertex(A, n, mm);
    (void)w; return TRUE;
}
static gboolean on_click_lat(GtkWidget *w, GdkEventButton *e, app *A)
{
    int n, mm;
    if (hit_vertex(&A->lat_hits, e->x, e->y, &n, &mm)) {
        select_vertex(A, n, mm);
        if (e->type == GDK_2BUTTON_PRESS) { A->m.view = GS_HT; gtk_notebook_set_current_page(GTK_NOTEBOOK(A->nb), 0); refresh(A, 0); }
    }
    (void)w; return TRUE;
}
static gboolean on_click_rail(GtkWidget *w, GdkEventButton *e, app *A)
{
    int k = gd_rail_hit(e->y);
    if (k >= 0 && A->m.loaded) { A->m.view = k; gtk_notebook_set_current_page(GTK_NOTEBOOK(A->nb), 0); refresh(A, 0); }
    (void)w; return TRUE;
}

/* ================================================================ controls */
static void stop_play(app *A)
{
    if (A->play_id) { g_source_remove(A->play_id); A->play_id = 0; }
    gtk_button_set_label(GTK_BUTTON(A->b_play), "⏵ Play");
}

static void do_step(app *A)
{
    if (!gm_step(&A->m)) return;
    gtk_notebook_set_current_page(GTK_NOTEBOOK(A->nb), 0);
    refresh(A, 1);
    if (A->m.view == GS_LAT && A->m.reached == GS_LAT) tree_show_vertex(A, A->m.sel_n, A->m.sel_m);
}

static void on_step(GtkButton *b, app *A) { stop_play(A); do_step(A); (void)b; }
static void on_run(GtkButton *b, app *A) { stop_play(A); gm_run_all(&A->m); A->m.view = GS_XC; refresh(A, 1); (void)b; }
static void on_reset(GtkButton *b, app *A)
{
    stop_play(A);
    gm_reset(&A->m);
    gm_logf(&A->m, "reset: the pipeline is back at stage 0 (the data is kept)");
    A->m.log_mark = A->m.loglen - 1;
    refresh(A, 1); (void)b;
}

static gboolean play_tick(gpointer data)
{
    app *A = data;
    if (A->m.reached >= GS_COUNT) { A->play_id = 0; stop_play(A); controls_refresh(A); return G_SOURCE_REMOVE; }
    do_step(A);
    if (A->m.reached >= GS_COUNT) { A->play_id = 0; gtk_button_set_label(GTK_BUTTON(A->b_play), "⏵ Play"); controls_refresh(A); return G_SOURCE_REMOVE; }
    return G_SOURCE_CONTINUE;
}
static void on_play(GtkButton *b, app *A)
{
    if (A->play_id) { stop_play(A); controls_refresh(A); return; }
    int ms = (int)gtk_range_get_value(GTK_RANGE(A->speed));
    A->play_id = g_timeout_add((guint)ms, play_tick, A);
    gtk_button_set_label(GTK_BUTTON(A->b_play), "⏸ Pause");
    play_tick(A);
    (void)b;
}
static void on_speed(GtkRange *r, app *A)
{
    if (A->play_id) { g_source_remove(A->play_id); A->play_id = g_timeout_add((guint)gtk_range_get_value(r), play_tick, A); }
}

static void on_log_up(GtkButton *b, app *A)
{
    if (!gm_explore_log(&A->m, A->m.sel_n, A->m.sel_m)) { refresh(A, 1); tree_show_vertex(A, A->m.sel_n, A->m.sel_m); }
    (void)b;
}
static void on_theta(GtkButton *b, app *A)
{
    if (!gm_explore_theta(&A->m, A->m.sel_n, A->m.sel_m)) { refresh(A, 1); tree_show_vertex(A, A->m.sel_n, A->m.sel_m); }
    (void)b;
}
static void on_show_ht(GtkButton *b, app *A)
{
    A->m.view = GS_HT; gtk_notebook_set_current_page(GTK_NOTEBOOK(A->nb), 0); refresh(A, 0); (void)b;
}

/* ================================================================ bench */
static void bench_msg(app *A, int err, const char *fmt, ...) __attribute__((format(printf, 3, 4)));
static void bench_msg(app *A, int err, const char *fmt, ...)
{
    char b[512]; va_list ap; va_start(ap, fmt); vsnprintf(b, sizeof b, fmt, ap); va_end(ap);
    char *mk = g_markup_printf_escaped("<span foreground='%s'>%s</span>", err ? "#dc2626" : "#4b5563", b);
    gtk_label_set_markup(GTK_LABEL(A->bench_msg), mk); g_free(mk);
}

static long long entry_ll(GtkWidget *e) { return g_ascii_strtoll(gtk_entry_get_text(GTK_ENTRY(e)), NULL, 10); }
static unsigned combo_l(app *A) { gchar *s = gtk_combo_box_text_get_active_text(GTK_COMBO_BOX_TEXT(A->l_combo)); unsigned l = s ? (unsigned)atoi(s) : 13; g_free(s); return l; }
static void set_combo_l(app *A, unsigned l)
{
    int idx = 0;
    for (unsigned p = 5; p <= IUT_MAX_L; ++p) if (iut_is_prime(p)) { if (p == l) { gtk_combo_box_set_active(GTK_COMBO_BOX(A->l_combo), idx); return; } ++idx; }
}

static void on_ab_changed(GtkEditable *e, app *A)
{
    long long a = entry_ll(A->e_a), b = entry_ll(A->e_b);
    char s[48]; if (a > 0 && b > 0 && a <= LLONG_MAX - b) snprintf(s, sizeof s, "%lld", a + b); else snprintf(s, sizeof s, "?");
    gtk_entry_set_text(GTK_ENTRY(A->e_c), s);
    (void)e;
}

static void on_auto_l(GtkButton *b, app *A)
{
    long long a = entry_ll(A->e_a), bb = entry_ll(A->e_b);
    unsigned l = gm_suggest_l(a, bb, a + bb);
    if (l) { set_combo_l(A, l); bench_msg(A, 0, "l = %u is the smallest prime for which Def 3.1 holds for %lld + %lld = %lld", l, a, bb, a + bb); }
    else bench_msg(A, 1, "no prime l ≤ %d passes Def 3.1 for this triple (or it is not a coprime triple)", IUT_MAX_L);
    (void)b;
}

static void on_abc_preset(GtkComboBox *c, app *A)
{
    int k = gtk_combo_box_get_active(c);
    if (k <= 0 || k > (int)NABC) return;
    char s[32];
    snprintf(s, sizeof s, "%lld", ABC_PRESETS[k - 1].a); gtk_entry_set_text(GTK_ENTRY(A->e_a), s);
    snprintf(s, sizeof s, "%lld", ABC_PRESETS[k - 1].b); gtk_entry_set_text(GTK_ENTRY(A->e_b), s);
    unsigned l = gm_suggest_l(ABC_PRESETS[k - 1].a, ABC_PRESETS[k - 1].b, ABC_PRESETS[k - 1].c);
    if (l) set_combo_l(A, l);
}

static void on_source(GtkComboBox *c, app *A)
{
    static const char *names[] = { "abc", "example", "random", "json" };
    int k = gtk_combo_box_get_active(c);
    if (k >= 0 && k < 4) gtk_stack_set_visible_child_name(GTK_STACK(A->src_stack), names[k]);
}

static iut_link_kind combo_horizontal(app *A) { int k = gtk_combo_box_get_active(GTK_COMBO_BOX(A->horiz_combo)); return k >= 0 && k < 5 ? HORIZ_KIND[k] : IUT_LINK_THETA_UNITSMODTORS_LGP; }

static void on_load(GtkButton *btn, app *A)
{
    stop_play(A);
    iut_initial_theta_data *d = calloc(1, sizeof *d);
    if (!d) return;
    int src = gtk_combo_box_get_active(GTK_COMBO_BOX(A->src_combo)), rc = 0;
    char source[200] = "";
    long long abc[3]; int have_abc = 0;
    if (src == 0) {
        abc[0] = entry_ll(A->e_a); abc[1] = entry_ll(A->e_b); abc[2] = abc[0] + abc[1];
        unsigned l = combo_l(A);
        long double prod = (long double)abc[0] * abc[1] * abc[2];   /* a·b·c must fit the toolkit's long long */
        if (prod > 9.2e18L) { bench_msg(A, 1, "a·b·c is too large for the toolkit (it must fit in 64 bits)"); free(d); return; }
        rc = iut_gen_from_abc(d, abc[0], abc[1], abc[2], l);
        if (rc == -1) bench_msg(A, 1, "need positive a, b with a + b = c");
        else if (rc == -2) bench_msg(A, 1, "a and b must be coprime");
        else if (rc) bench_msg(A, 1, "l must be a prime between 5 and %d", IUT_MAX_L);
        snprintf(source, sizeof source, "abc triple %lld + %lld = %lld, Frey curve", abc[0], abc[1], abc[2]);
        have_abc = 1;
    } else if (src == 1) {
        int k = gtk_spin_button_get_value_as_int(GTK_SPIN_BUTTON(A->ex_spin));
        rc = iut_gen_example(d, k);
        if (rc) bench_msg(A, 1, "no example %d", k);
        snprintf(source, sizeof source, "built-in example %d", k);
    } else if (src == 2) {
        unsigned seed = (unsigned)gtk_spin_button_get_value_as_int(GTK_SPIN_BUTTON(A->seed_spin));
        rc = iut_gen_random(d, seed);
        if (rc) bench_msg(A, 1, "could not generate random data from seed %u", seed);
        snprintf(source, sizeof source, "random synthetic data, seed %u", seed);
    } else {
        int k = gtk_combo_box_get_active(GTK_COMBO_BOX(A->json_combo));
        if (k < 0 || k >= A->njson) { bench_msg(A, 1, "no JSON example found in %s", A->json_dir); free(d); return; }
        char msg[256] = "";
        rc = iut_data_from_json_file(d, A->json_files[k], msg, sizeof msg);
        if (rc) bench_msg(A, 1, "could not read %s: %s", A->json_files[k], msg);
        snprintf(source, sizeof source, "exact Θ-data from %s", strrchr(A->json_files[k], '/') ? strrchr(A->json_files[k], '/') + 1 : A->json_files[k]);
    }
    if (!rc) {
        gm_load(&A->m, d, gtk_spin_button_get_value_as_int(GTK_SPIN_BUTTON(A->rows_spin)), combo_horizontal(A), have_abc ? abc : NULL, source);
        bench_msg(A, 0, "loaded %s: press Step to run stage 0, or Run all", d->name);
        refresh(A, 1);
    }
    free(d);
    (void)btn;
}

/* ================================================================ processes */
static void on_proc_select(GtkTreeSelection *sel, app *A)
{
    GtkTreeModel *model; GtkTreeIter it;
    if (!gtk_tree_selection_get_selected(sel, &model, &it)) return;
    gchar *id = NULL; gtk_tree_model_get(model, &it, 1, &id, -1);
    const iut_process *p = id && *id ? iut_process_find(id) : NULL;
    g_free(id);
    if (!p || !A->m.loaded) return;
    char *buf = NULL; size_t len = 0; FILE *f = open_memstream(&buf, &len);
    fprintf(f, "%s   [%s] %s\n%s\n\n  inputs : %s\n  outputs: %s\n\n", p->id, p->paper, p->section, p->name, p->inputs, p->outputs);
    fprintf(f, "$ iut run %s   (on %s)\n\n", p->id, A->m.data.name);
    int rc = iut_process_run(p, &A->m.data, f);
    fprintf(f, "\n→ %s\n", rc ? "FAILED" : "ok");
    fclose(f);
    text_set(A->proc_text, buf);
    free(buf);
}

static void on_proc_all(GtkButton *b, app *A)
{
    if (!A->m.loaded) return;
    char *buf = NULL; size_t len = 0; FILE *f = open_memstream(&buf, &len);
    gint64 t0 = g_get_monotonic_time();
    int fails = iut_process_run_all(&A->m.data, f, NULL);
    fclose(f);
    double ms = (g_get_monotonic_time() - t0) / 1000.0;
    text_set(A->proc_text, buf);
    free(buf);
    char *mk = g_markup_printf_escaped("<b><span foreground='%s'>%zu processes, %d failure(s)</span></b>  in %.1f ms", fails ? "#dc2626" : "#15803d", iut_process_count, fails, ms);
    gtk_label_set_markup(GTK_LABEL(A->proc_summary), mk); g_free(mk);
    (void)b;
}

static GtkWidget *build_processes(app *A)
{
    GtkTreeStore *st = gtk_tree_store_new(3, G_TYPE_STRING, G_TYPE_STRING, G_TYPE_STRING);
    GtkTreeIter paper_it; const char *last = NULL;
    for (size_t i = 0; i < iut_process_count; ++i) {
        const iut_process *p = &iut_processes[i];
        if (!last || strcmp(last, p->paper)) { gtk_tree_store_append(st, &paper_it, NULL); gtk_tree_store_set(st, &paper_it, 0, "", 1, p->paper, 2, "", -1); last = p->paper; }
        GtkTreeIter it; gtk_tree_store_append(st, &it, &paper_it);
        gtk_tree_store_set(st, &it, 0, p->section, 1, p->id, 2, p->name, -1);
    }
    A->proc_view = gtk_tree_view_new_with_model(GTK_TREE_MODEL(st));
    g_object_unref(st);
    const char *titles[3] = { "process", "paper / section", "what it does" };
    const int order[3] = { 1, 0, 2 };
    for (int c = 0; c < 3; ++c) {
        GtkCellRenderer *r = gtk_cell_renderer_text_new();
        if (c > 0) g_object_set(r, "ellipsize", PANGO_ELLIPSIZE_END, "foreground", c == 1 ? "#4b5563" : NULL, NULL);
        GtkTreeViewColumn *col = gtk_tree_view_column_new_with_attributes(titles[c], r, "text", order[c], NULL);
        if (c == 1) gtk_tree_view_column_set_fixed_width(col, 150), gtk_tree_view_column_set_sizing(col, GTK_TREE_VIEW_COLUMN_FIXED);
        gtk_tree_view_column_set_resizable(col, TRUE);
        if (c == 2) gtk_tree_view_column_set_expand(col, TRUE);
        gtk_tree_view_append_column(GTK_TREE_VIEW(A->proc_view), col);
    }
    gtk_tree_view_expand_all(GTK_TREE_VIEW(A->proc_view));
    g_signal_connect(gtk_tree_view_get_selection(GTK_TREE_VIEW(A->proc_view)), "changed", G_CALLBACK(on_proc_select), A);
    GtkWidget *sw1 = gtk_scrolled_window_new(NULL, NULL); gtk_container_add(GTK_CONTAINER(sw1), A->proc_view);
    A->proc_text = gtk_text_view_new(); gtk_text_view_set_monospace(GTK_TEXT_VIEW(A->proc_text), TRUE); gtk_text_view_set_editable(GTK_TEXT_VIEW(A->proc_text), FALSE);
    gtk_text_view_set_left_margin(GTK_TEXT_VIEW(A->proc_text), 8);
    text_set(A->proc_text, "Pick a process on the left to run it on the loaded Θ-data (the same runner as `iut run <id>`), or run all of them.");
    GtkWidget *sw2 = gtk_scrolled_window_new(NULL, NULL); gtk_container_add(GTK_CONTAINER(sw2), A->proc_text);
    GtkWidget *bar = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    GtkWidget *all = gtk_button_new_with_label("Run all processes");
    g_signal_connect(all, "clicked", G_CALLBACK(on_proc_all), A);
    A->proc_summary = gtk_label_new("the registry of src/iut_proc.c: every step of [IUTchI]–[IUTchIV], [EssLgc] and [Alien] as a C function");
    gtk_box_pack_start(GTK_BOX(bar), all, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(bar), A->proc_summary, FALSE, FALSE, 0);
    gtk_container_set_border_width(GTK_CONTAINER(bar), 6);
    GtkWidget *pan = gtk_paned_new(GTK_ORIENTATION_HORIZONTAL);
    gtk_paned_pack1(GTK_PANED(pan), sw1, TRUE, FALSE); gtk_paned_pack2(GTK_PANED(pan), sw2, TRUE, FALSE);
    gtk_paned_set_position(GTK_PANED(pan), 520);
    GtkWidget *v = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_box_pack_start(GTK_BOX(v), bar, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(v), pan, TRUE, TRUE, 0);
    return v;
}

/* ================================================================ window */
static GtkWidget *labelw(const char *s) { GtkWidget *l = gtk_label_new(s); gtk_widget_set_valign(l, GTK_ALIGN_CENTER); return l; }
static GtkWidget *scrolled(GtkWidget *child, int hpolicy_never)
{
    GtkWidget *sw = gtk_scrolled_window_new(NULL, NULL);
    gtk_scrolled_window_set_policy(GTK_SCROLLED_WINDOW(sw), hpolicy_never ? GTK_POLICY_NEVER : GTK_POLICY_AUTOMATIC, GTK_POLICY_AUTOMATIC);
    gtk_container_add(GTK_CONTAINER(sw), child);
    return sw;
}
static GtkWidget *textview(void)
{
    GtkWidget *t = gtk_text_view_new();
    gtk_text_view_set_monospace(GTK_TEXT_VIEW(t), TRUE);
    gtk_text_view_set_editable(GTK_TEXT_VIEW(t), FALSE);
    gtk_text_view_set_left_margin(GTK_TEXT_VIEW(t), 8);
    gtk_text_view_set_top_margin(GTK_TEXT_VIEW(t), 4);
    return t;
}
static GtkWidget *canvas(app *A, GCallback draw, GCallback click)
{
    GtkWidget *d = gtk_drawing_area_new();
    gtk_widget_add_events(d, GDK_BUTTON_PRESS_MASK);
    g_signal_connect(d, "draw", draw, A);
    if (click) g_signal_connect(d, "button-press-event", click, A);
    return d;
}

static void find_json(app *A, const char *argv0)
{
    const char *cands[6]; char exe_rel[2048] = "", buf[2048];
    gchar *exe = g_file_read_link("/proc/self/exe", NULL);
    if (exe) { gchar *dir = g_path_get_dirname(exe); snprintf(exe_rel, sizeof exe_rel, "%s/../docs/initial-theta-data", dir); g_free(dir); g_free(exe); }
    else if (argv0) { gchar *dir = g_path_get_dirname(argv0); snprintf(exe_rel, sizeof exe_rel, "%s/../docs/initial-theta-data", dir); g_free(dir); }
    const char *env = getenv("IUT_THETA_DATA_DIR");
    int n = 0;
    if (A->json_dir[0]) cands[n++] = A->json_dir;
    if (env) cands[n++] = env;
    cands[n++] = exe_rel; cands[n++] = "../docs/initial-theta-data"; cands[n++] = "docs/initial-theta-data";
    for (int k = 0; k < n; ++k) {
        GDir *dir = g_dir_open(cands[k], 0, NULL);
        if (!dir) continue;
        const char *nm;
        while ((nm = g_dir_read_name(dir)) && A->njson < 64) {
            if (!g_str_has_suffix(nm, ".json") || !strcmp(nm, "index.json")) continue;
            snprintf(buf, sizeof buf, "%s/%s", cands[k], nm);
            A->json_files[A->njson++] = g_strdup(buf);
        }
        g_dir_close(dir);
        snprintf(A->json_dir, sizeof A->json_dir, "%s", cands[k]);
        if (A->njson) break;
    }
    for (int i = 0; i < A->njson; ++i) for (int j = i + 1; j < A->njson; ++j) if (strcmp(A->json_files[i], A->json_files[j]) > 0) { char *t = A->json_files[i]; A->json_files[i] = A->json_files[j]; A->json_files[j] = t; }
}

static gboolean on_key(GtkWidget *w, GdkEventKey *e, app *A)
{
    GtkWidget *f = gtk_window_get_focus(GTK_WINDOW(w));
    if (f && (GTK_IS_ENTRY(f) || GTK_IS_SPIN_BUTTON(f))) return FALSE;
    switch (e->keyval) {
    case GDK_KEY_space: case GDK_KEY_s: on_step(NULL, A); return TRUE;
    case GDK_KEY_r: on_run(NULL, A); return TRUE;
    case GDK_KEY_p: on_play(NULL, A); return TRUE;
    case GDK_KEY_BackSpace: on_reset(NULL, A); return TRUE;
    case GDK_KEY_Left: if (A->m.view > 0) { A->m.view--; refresh(A, 0); } return TRUE;
    case GDK_KEY_Right: if (A->m.view < GS_COUNT - 1) { A->m.view++; refresh(A, 0); } return TRUE;
    default: return FALSE;
    }
}

static const char *CSS =
    ".bench { background: #f6f8fb; border-bottom: 1px solid #dde3ec; }\n"
    ".brand { font-weight: bold; font-size: 15px; }\n"
    ".step { font-weight: bold; }\n"
    ".inspector-head { font-weight: bold; padding: 4px 6px; }\n";

static void build_window(app *A)
{
    A->win = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_title(GTK_WINDOW(A->win), "iut-gui — the IUT pipeline, step by step");
    gtk_window_set_default_size(GTK_WINDOW(A->win), 1500, 940);
    g_signal_connect(A->win, "destroy", G_CALLBACK(gtk_main_quit), NULL);
    g_signal_connect(A->win, "key-press-event", G_CALLBACK(on_key), A);
    GtkCssProvider *css = gtk_css_provider_new();
    gtk_css_provider_load_from_data(css, CSS, -1, NULL);
    gtk_style_context_add_provider_for_screen(gdk_screen_get_default(), GTK_STYLE_PROVIDER(css), GTK_STYLE_PROVIDER_PRIORITY_APPLICATION);

    GtkWidget *root = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_container_add(GTK_CONTAINER(A->win), root);

    /* ---- bench, row 1: the data */
    GtkWidget *bench = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_style_context_add_class(gtk_widget_get_style_context(bench), "bench");
    gtk_container_set_border_width(GTK_CONTAINER(bench), 8);
    GtkWidget *r1 = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    GtkWidget *brand = gtk_label_new("IUT pipeline");
    gtk_style_context_add_class(gtk_widget_get_style_context(brand), "brand");
    gtk_box_pack_start(GTK_BOX(r1), brand, FALSE, FALSE, 4);
    gtk_box_pack_start(GTK_BOX(r1), labelw("initial Θ-data from"), FALSE, FALSE, 0);
    A->src_combo = gtk_combo_box_text_new();
    const char *srcs[] = { "an abc triple", "a built-in example", "random synthetic data", "an exact JSON example" };
    for (int k = 0; k < 4; ++k) gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->src_combo), srcs[k]);
    gtk_box_pack_start(GTK_BOX(r1), A->src_combo, FALSE, FALSE, 0);
    A->src_stack = gtk_stack_new();
    gtk_stack_set_homogeneous(GTK_STACK(A->src_stack), FALSE);
    /* abc */
    GtkWidget *abc = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    A->e_a = gtk_entry_new(); A->e_b = gtk_entry_new(); A->e_c = gtk_entry_new();
    gtk_entry_set_width_chars(GTK_ENTRY(A->e_a), 7); gtk_entry_set_width_chars(GTK_ENTRY(A->e_b), 10); gtk_entry_set_width_chars(GTK_ENTRY(A->e_c), 10);
    gtk_editable_set_editable(GTK_EDITABLE(A->e_c), FALSE); gtk_widget_set_can_focus(A->e_c, FALSE);
    gtk_box_pack_start(GTK_BOX(abc), labelw("a"), FALSE, FALSE, 0); gtk_box_pack_start(GTK_BOX(abc), A->e_a, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(abc), labelw("+  b"), FALSE, FALSE, 0); gtk_box_pack_start(GTK_BOX(abc), A->e_b, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(abc), labelw("=  c"), FALSE, FALSE, 0); gtk_box_pack_start(GTK_BOX(abc), A->e_c, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(abc), labelw("  l"), FALSE, FALSE, 0);
    A->l_combo = gtk_combo_box_text_new();
    for (unsigned p = 5; p <= IUT_MAX_L; ++p) if (iut_is_prime(p)) { char s[8]; snprintf(s, sizeof s, "%u", p); gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->l_combo), s); }
    gtk_box_pack_start(GTK_BOX(abc), A->l_combo, FALSE, FALSE, 0);
    GtkWidget *autol = gtk_button_new_with_label("auto l");
    gtk_widget_set_tooltip_text(autol, "the smallest prime l ≥ 5 for which the initial Θ-data passes Def 3.1 (l prime to the bad primes and to every ord(q_v))");
    g_signal_connect(autol, "clicked", G_CALLBACK(on_auto_l), A);
    gtk_box_pack_start(GTK_BOX(abc), autol, FALSE, FALSE, 0);
    A->abc_preset = gtk_combo_box_text_new();
    gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->abc_preset), "abc hits…");
    for (size_t k = 0; k < NABC; ++k) gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->abc_preset), ABC_PRESETS[k].label);
    gtk_combo_box_set_active(GTK_COMBO_BOX(A->abc_preset), 0);
    g_signal_connect(A->abc_preset, "changed", G_CALLBACK(on_abc_preset), A);
    gtk_box_pack_start(GTK_BOX(abc), A->abc_preset, FALSE, FALSE, 0);
    g_signal_connect(A->e_a, "changed", G_CALLBACK(on_ab_changed), A);
    g_signal_connect(A->e_b, "changed", G_CALLBACK(on_ab_changed), A);
    gtk_stack_add_named(GTK_STACK(A->src_stack), abc, "abc");
    /* example */
    GtkWidget *ex = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    A->ex_spin = gtk_spin_button_new_with_range(0, 5, 1);
    gtk_box_pack_start(GTK_BOX(ex), labelw("example"), FALSE, FALSE, 0); gtk_box_pack_start(GTK_BOX(ex), A->ex_spin, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(ex), labelw("(0–3: Frey curves of small triples, 4–5: hand-made fields; `iut gen --example K`)"), FALSE, FALSE, 0);
    gtk_stack_add_named(GTK_STACK(A->src_stack), ex, "example");
    /* random */
    GtkWidget *rnd = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    A->seed_spin = gtk_spin_button_new_with_range(0, 1000000, 1);
    gtk_spin_button_set_value(GTK_SPIN_BUTTON(A->seed_spin), 2);
    gtk_box_pack_start(GTK_BOX(rnd), labelw("seed"), FALSE, FALSE, 0); gtk_box_pack_start(GTK_BOX(rnd), A->seed_spin, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(rnd), labelw("(a synthetic number field and curve; `iut gen --random SEED`)"), FALSE, FALSE, 0);
    gtk_stack_add_named(GTK_STACK(A->src_stack), rnd, "random");
    /* json */
    GtkWidget *js = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    A->json_combo = gtk_combo_box_text_new();
    for (int k = 0; k < A->njson; ++k) { const char *b = strrchr(A->json_files[k], '/'); gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->json_combo), b ? b + 1 : A->json_files[k]); }
    if (A->njson) gtk_combo_box_set_active(GTK_COMBO_BOX(A->json_combo), 0);
    gtk_box_pack_start(GTK_BOX(js), A->json_combo, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(js), labelw(A->njson ? "(Tate parameters to 8 p-adic digits, SL₂ proved: docs/initial-theta-data/)" : "(docs/initial-theta-data/ not found: set IUT_THETA_DATA_DIR)"), FALSE, FALSE, 0);
    gtk_stack_add_named(GTK_STACK(A->src_stack), js, "json");
    gtk_box_pack_start(GTK_BOX(r1), A->src_stack, FALSE, FALSE, 0);
    g_signal_connect(A->src_combo, "changed", G_CALLBACK(on_source), A);
    /* horizontal, rows, load */
    GtkWidget *load = gtk_button_new_with_label("Load");
    gtk_style_context_add_class(gtk_widget_get_style_context(load), "suggested-action");
    g_signal_connect(load, "clicked", G_CALLBACK(on_load), A);
    gtk_box_pack_end(GTK_BOX(r1), load, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(bench), r1, FALSE, FALSE, 0);

    /* ---- row 2: the controls */
    GtkWidget *r2 = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    A->b_reset = gtk_button_new_with_label("⏮ Reset");
    A->b_step = gtk_button_new_with_label("⏭ Step");
    A->b_run = gtk_button_new_with_label("⏩ Run all");
    A->b_play = gtk_button_new_with_label("⏵ Play");
    gtk_style_context_add_class(gtk_widget_get_style_context(A->b_step), "suggested-action");
    gtk_widget_set_tooltip_text(A->b_step, "run the next stage (in stage 4: apply the next link of the infinite H)   [space]");
    gtk_widget_set_tooltip_text(A->b_run, "run every remaining step   [r]");
    gtk_widget_set_tooltip_text(A->b_play, "step automatically at the chosen speed   [p]");
    gtk_widget_set_tooltip_text(A->b_reset, "back to stage 0 with the same data   [backspace]");
    g_signal_connect(A->b_reset, "clicked", G_CALLBACK(on_reset), A);
    g_signal_connect(A->b_step, "clicked", G_CALLBACK(on_step), A);
    g_signal_connect(A->b_run, "clicked", G_CALLBACK(on_run), A);
    g_signal_connect(A->b_play, "clicked", G_CALLBACK(on_play), A);
    gtk_box_pack_start(GTK_BOX(r2), A->b_reset, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->b_step, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->b_run, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->b_play, FALSE, FALSE, 0);
    A->speed = gtk_scale_new_with_range(GTK_ORIENTATION_HORIZONTAL, 100, 2000, 50);
    gtk_range_set_value(GTK_RANGE(A->speed), 700);
    gtk_range_set_inverted(GTK_RANGE(A->speed), TRUE);
    gtk_scale_set_draw_value(GTK_SCALE(A->speed), FALSE);
    gtk_widget_set_size_request(A->speed, 120, -1);
    gtk_widget_set_tooltip_text(A->speed, "play speed (milliseconds per step)");
    g_signal_connect(A->speed, "value-changed", G_CALLBACK(on_speed), A);
    gtk_box_pack_start(GTK_BOX(r2), labelw("speed"), FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->speed, FALSE, FALSE, 0);
    A->horiz_combo = gtk_combo_box_text_new();
    for (int k = 0; k < 5; ++k) gtk_combo_box_text_append_text(GTK_COMBO_BOX_TEXT(A->horiz_combo), iut_link_kind_notation(HORIZ_KIND[k]));
    gtk_combo_box_set_active(GTK_COMBO_BOX(A->horiz_combo), 3);
    gtk_widget_set_tooltip_text(A->horiz_combo, "which flavour of the Θ-link joins the two columns (applied on Load)");
    A->rows_spin = gtk_spin_button_new_with_range(1, IUT_LAT_MOFF, 1);
    gtk_spin_button_set_value(GTK_SPIN_BUTTON(A->rows_spin), 2);
    gtk_widget_set_tooltip_text(A->rows_spin, "the infinite H spans rows −R..R (applied on Load)");
    gtk_box_pack_start(GTK_BOX(r2), labelw("   Θ-link"), FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->horiz_combo, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), labelw("rows ±"), FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(r2), A->rows_spin, FALSE, FALSE, 0);
    A->progress = gtk_label_new("");
    gtk_label_set_ellipsize(GTK_LABEL(A->progress), PANGO_ELLIPSIZE_END);
    gtk_label_set_max_width_chars(GTK_LABEL(A->progress), 46);
    gtk_box_pack_start(GTK_BOX(r2), A->progress, FALSE, FALSE, 12);
    A->problems = gtk_label_new("");
    gtk_box_pack_end(GTK_BOX(r2), A->problems, FALSE, FALSE, 6);
    A->bench_msg = gtk_label_new("");
    gtk_label_set_ellipsize(GTK_LABEL(A->bench_msg), PANGO_ELLIPSIZE_END);
    gtk_box_pack_end(GTK_BOX(r2), A->bench_msg, TRUE, TRUE, 6);
    gtk_box_pack_start(GTK_BOX(bench), r2, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(root), bench, FALSE, FALSE, 0);

    /* ---- the rail */
    A->rail = canvas(A, G_CALLBACK(on_draw_rail), G_CALLBACK(on_click_rail));
    gtk_widget_set_size_request(A->rail, 230, 8 * 66 + 60);
    GtkWidget *rail_sw = scrolled(A->rail, 1);

    /* ---- centre notebook */
    A->nb = gtk_notebook_new();
    A->stage_area = canvas(A, G_CALLBACK(on_draw_stage), G_CALLBACK(on_click_stage));
    A->stage_scroll = scrolled(A->stage_area, 1);
    gtk_notebook_append_page(GTK_NOTEBOOK(A->nb), A->stage_scroll, gtk_label_new("Stage"));
    GtkWidget *latbox = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    GtkWidget *latbar = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    gtk_container_set_border_width(GTK_CONTAINER(latbar), 6);
    A->sel_label = gtk_label_new("");
    A->b_log_up = gtk_button_new_with_label("↑ apply a log-link");
    A->b_theta = gtk_button_new_with_label("→ apply the Θ-link");
    GtkWidget *showht = gtk_button_new_with_label("show its Hodge theater");
    gtk_widget_set_tooltip_text(A->b_log_up, "log-link (n,m) → (n,m+1) from the selected vertex (once the pipeline is complete)");
    gtk_widget_set_tooltip_text(A->b_theta, "horizontal link (n,m) → (n+1,m) from the selected vertex (once the pipeline is complete)");
    g_signal_connect(A->b_log_up, "clicked", G_CALLBACK(on_log_up), A);
    g_signal_connect(A->b_theta, "clicked", G_CALLBACK(on_theta), A);
    g_signal_connect(showht, "clicked", G_CALLBACK(on_show_ht), A);
    gtk_box_pack_start(GTK_BOX(latbar), A->sel_label, FALSE, FALSE, 4);
    gtk_box_pack_start(GTK_BOX(latbar), A->b_log_up, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(latbar), A->b_theta, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(latbar), showht, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(latbox), latbar, FALSE, FALSE, 0);
    A->lat_area = canvas(A, G_CALLBACK(on_draw_lat), G_CALLBACK(on_click_lat));
    gtk_widget_set_size_request(A->lat_area, -1, 520);
    gtk_box_pack_start(GTK_BOX(latbox), A->lat_area, TRUE, TRUE, 0);
    gtk_notebook_append_page(GTK_NOTEBOOK(A->nb), latbox, gtk_label_new("Lattice"));
    A->abc_area = canvas(A, G_CALLBACK(on_draw_abc), NULL);
    gtk_notebook_append_page(GTK_NOTEBOOK(A->nb), scrolled(A->abc_area, 1), gtk_label_new("abc triple"));
    gtk_notebook_append_page(GTK_NOTEBOOK(A->nb), build_processes(A), gtk_label_new("Processes"));
    A->transcript_text = textview();
    gtk_notebook_append_page(GTK_NOTEBOOK(A->nb), scrolled(A->transcript_text, 0), gtk_label_new("Transcript"));

    /* ---- bottom notebook */
    A->bottom_nb = gtk_notebook_new();
    A->log_text = textview();
    GtkTextBuffer *lb = gtk_text_view_get_buffer(GTK_TEXT_VIEW(A->log_text));
    gtk_text_buffer_create_tag(lb, "new", "foreground", "#1d4ed8", "weight", PANGO_WEIGHT_BOLD, NULL);
    gtk_notebook_append_page(GTK_NOTEBOOK(A->bottom_nb), scrolled(A->log_text, 0), gtk_label_new("State log"));
    A->stage_text = textview();
    gtk_notebook_append_page(GTK_NOTEBOOK(A->bottom_nb), scrolled(A->stage_text, 0), gtk_label_new("Stage transcript (iut pipeline)"));
    GtkWidget *vp = gtk_paned_new(GTK_ORIENTATION_VERTICAL);
    gtk_paned_pack1(GTK_PANED(vp), A->nb, TRUE, FALSE);
    gtk_paned_pack2(GTK_PANED(vp), A->bottom_nb, FALSE, FALSE);
    gtk_paned_set_position(GTK_PANED(vp), 640);

    /* ---- inspector */
    A->store = gt_store_new();
    A->tree_view = gtk_tree_view_new_with_model(GTK_TREE_MODEL(A->store));
    {
        GtkCellRenderer *r = gtk_cell_renderer_text_new();
        GtkTreeViewColumn *c = gtk_tree_view_column_new_with_attributes("object / field", r, "text", TC_NAME, "weight", TC_WEIGHT, NULL);
        gtk_tree_view_column_set_resizable(c, TRUE);
        gtk_tree_view_append_column(GTK_TREE_VIEW(A->tree_view), c);
        r = gtk_cell_renderer_text_new();
        g_object_set(r, "family", "DejaVu Sans Mono", "ellipsize", PANGO_ELLIPSIZE_END, NULL);
        c = gtk_tree_view_column_new_with_attributes("value", r, "text", TC_VALUE, NULL);
        gtk_tree_view_column_set_expand(c, TRUE);
        gtk_tree_view_append_column(GTK_TREE_VIEW(A->tree_view), c);
        gtk_tree_view_set_tooltip_column(GTK_TREE_VIEW(A->tree_view), TC_VALUE);
    }
    g_signal_connect(gtk_tree_view_get_selection(GTK_TREE_VIEW(A->tree_view)), "changed", G_CALLBACK(on_tree_select), A);
    GtkWidget *insp = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    GtkWidget *ih = gtk_label_new("objects built so far");
    gtk_style_context_add_class(gtk_widget_get_style_context(ih), "inspector-head");
    gtk_widget_set_halign(ih, GTK_ALIGN_START);
    gtk_box_pack_start(GTK_BOX(insp), ih, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(insp), scrolled(A->tree_view, 0), TRUE, TRUE, 0);
    A->ident_label = gtk_label_new("Select an object to see its notation, identifier and reference.");
    gtk_label_set_line_wrap(GTK_LABEL(A->ident_label), TRUE);
    gtk_label_set_xalign(GTK_LABEL(A->ident_label), 0);
    gtk_label_set_selectable(GTK_LABEL(A->ident_label), TRUE);
    gtk_widget_set_size_request(A->ident_label, -1, 96);
    GtkWidget *fr = gtk_frame_new(NULL);
    gtk_widget_set_margin_start(A->ident_label, 8); gtk_widget_set_margin_end(A->ident_label, 8); gtk_widget_set_margin_top(A->ident_label, 6); gtk_widget_set_margin_bottom(A->ident_label, 6);
    gtk_container_add(GTK_CONTAINER(fr), A->ident_label);
    gtk_box_pack_start(GTK_BOX(insp), fr, FALSE, FALSE, 0);

    GtkWidget *hp2 = gtk_paned_new(GTK_ORIENTATION_HORIZONTAL);
    gtk_paned_pack1(GTK_PANED(hp2), vp, TRUE, FALSE);
    gtk_paned_pack2(GTK_PANED(hp2), insp, FALSE, FALSE);
    gtk_paned_set_position(GTK_PANED(hp2), 900);
    GtkWidget *hp = gtk_paned_new(GTK_ORIENTATION_HORIZONTAL);
    gtk_paned_pack1(GTK_PANED(hp), rail_sw, FALSE, FALSE);
    gtk_paned_pack2(GTK_PANED(hp), hp2, TRUE, FALSE);
    gtk_paned_set_position(GTK_PANED(hp), 232);
    gtk_box_pack_start(GTK_BOX(root), hp, TRUE, TRUE, 0);
}

/* ================================================================ command line */
typedef struct {
    int have_abc, have_example, have_seed, have_json; long long a, b, c; unsigned l; int example; unsigned seed; const char *json;
    int rows; int horiz; int check;
    const char *shot, *render_out, *tab; int render_stage, width, view, steps, run, sel, sel_n, sel_m, w, h;
} cli;

static int parse_cli(cli *o, int argc, char **argv)
{
    memset(o, 0, sizeof *o);
    o->l = 13; o->rows = 2; o->horiz = 3; o->render_stage = -1; o->width = 1100; o->view = -1; o->steps = -1; o->w = 1500; o->h = 940;
    for (int i = 1; i < argc; ++i) {
        const char *a = argv[i];
        if (!strcmp(a, "--abc") && i + 3 < argc) { o->a = atoll(argv[i + 1]); o->b = atoll(argv[i + 2]); o->c = atoll(argv[i + 3]); o->have_abc = 1; i += 3; }
        else if (!strcmp(a, "--l") && i + 1 < argc) o->l = (unsigned)atoi(argv[++i]);
        else if (!strcmp(a, "--example") && i + 1 < argc) { o->example = atoi(argv[++i]); o->have_example = 1; }
        else if (!strcmp(a, "--random") && i + 1 < argc) { o->seed = (unsigned)atoi(argv[++i]); o->have_seed = 1; }
        else if (!strcmp(a, "--theta-json") && i + 1 < argc) { o->json = argv[++i]; o->have_json = 1; }
        else if (!strcmp(a, "--rows") && i + 1 < argc) o->rows = atoi(argv[++i]);
        else if (!strcmp(a, "--horizontal") && i + 1 < argc) { const char *h = argv[++i]; o->horiz = -1; for (int k = 0; k < 5; ++k) if (!strcmp(h, HORIZ_ID[k])) o->horiz = k; if (o->horiz < 0) { fprintf(stderr, "unknown --horizontal %s\n", h); return -1; } }
        else if (!strcmp(a, "--check")) o->check = 1;
        else if (!strcmp(a, "--screenshot") && i + 1 < argc) o->shot = argv[++i];
        else if (!strcmp(a, "--render-stage") && i + 1 < argc) o->render_stage = atoi(argv[++i]);
        else if (!strcmp(a, "--out") && i + 1 < argc) o->render_out = argv[++i];
        else if (!strcmp(a, "--width") && i + 1 < argc) o->width = atoi(argv[++i]);
        else if (!strcmp(a, "--tab") && i + 1 < argc) o->tab = argv[++i];
        else if (!strcmp(a, "--view") && i + 1 < argc) o->view = atoi(argv[++i]);
        else if (!strcmp(a, "--steps") && i + 1 < argc) o->steps = atoi(argv[++i]);
        else if (!strcmp(a, "--run")) o->run = 1;
        else if (!strcmp(a, "--select") && i + 1 < argc) { if (sscanf(argv[++i], "%d,%d", &o->sel_n, &o->sel_m) == 2) o->sel = 1; }
        else if (!strcmp(a, "--size") && i + 1 < argc) sscanf(argv[++i], "%dx%d", &o->w, &o->h);
        else if (!strcmp(a, "--help") || !strcmp(a, "-h")) {
            printf("usage: iut-gui [--abc A B C --l L | --example K | --random SEED | --theta-json FILE] [--rows R] [--horizontal theta|xmu|gau|LGP|lgp]\n"
                   "       iut-gui --check\n"
                   "       iut-gui [data] --render-stage N --out FILE.png [--width W] [--steps K | --run] [--select N,M]\n"
                   "       iut-gui [data] --screenshot FILE.png [--tab stage|lattice|abc|processes|transcript] [--view N] [--steps K | --run] [--select N,M] [--size WxH]\n");
            exit(0);
        }
        else if (a[0] == '-' && a[1] == '-') { fprintf(stderr, "unknown option %s (try --help)\n", a); return -1; }
    }
    return 0;
}

/* make the data the command line asks for; *abc set for a triple. 0 = ok */
static int cli_data(const cli *o, iut_initial_theta_data *d, long long *abc, int *have_abc, char *src, size_t n)
{
    *have_abc = 0;
    if (o->have_json) {
        char msg[256] = "";
        if (iut_data_from_json_file(d, o->json, msg, sizeof msg)) { fprintf(stderr, "could not read %s: %s\n", o->json, msg); return -1; }
        snprintf(src, n, "exact Θ-data from %s", o->json);
        return 0;
    }
    if (o->have_example) { snprintf(src, n, "built-in example %d", o->example); return iut_gen_example(d, o->example); }
    if (o->have_seed) { snprintf(src, n, "random synthetic data, seed %u", o->seed); return iut_gen_random(d, o->seed); }
    long long a = o->have_abc ? o->a : 1, b = o->have_abc ? o->b : 2400, c = o->have_abc ? o->c : 2401;
    abc[0] = a; abc[1] = b; abc[2] = c; *have_abc = 1;
    snprintf(src, n, "abc triple %lld + %lld = %lld, Frey curve", a, b, c);
    int rc = iut_gen_from_abc(d, a, b, c, o->l);
    if (rc) fprintf(stderr, "could not make initial Θ-data from abc(%lld, %lld, %lld), l = %u (code %d)\n", a, b, c, o->l, rc);
    return rc;
}

static void apply_steps(gm_model *m, const cli *o)
{
    if (o->run) gm_run_all(m);
    else if (o->steps > 0) { size_t mark = m->loglen; for (int k = 0; k < o->steps; ++k) gm_step(m); m->log_mark = mark; }
    if (o->view >= 0 && o->view < GS_COUNT) m->view = o->view;
    if (o->sel) { m->sel_n = o->sel_n; m->sel_m = o->sel_m; }
}

/* draw every stage of every example into a recording surface; compare with `iut pipeline` */
static int run_check(void)
{
    int bad = 0, runs = 0;
    gm_model *m = malloc(sizeof *m);
    iut_initial_theta_data *d = malloc(sizeof *d);
    cairo_surface_t *s = cairo_recording_surface_create(CAIRO_CONTENT_COLOR_ALPHA, NULL);
    cairo_t *cr = cairo_create(s);
    app A; memset(&A, 0, sizeof A);
    find_json(&A, NULL);
    int nex = 6 + A.njson + 3;
    for (int k = 0; k < nex; ++k) {
        int rc;
        long long abc[3] = { 0 };
        if (k < 6) rc = iut_gen_example(d, k);
        else if (k < 6 + A.njson) { char msg[256]; rc = iut_data_from_json_file(d, A.json_files[k - 6], msg, sizeof msg); }
        else { /* two hits with the smallest valid l, and one triple with l = 5 dividing abc, which Def 3.1 (c) must reject */
               static const long long T[3][4] = { { 2, 6436341, 6436343, 0 }, { 121, 48234375, 48234496, 0 }, { 1, 2400, 2401, 5 } };
               abc[0] = T[k - 6 - A.njson][0]; abc[1] = T[k - 6 - A.njson][1]; abc[2] = T[k - 6 - A.njson][2];
               unsigned l = T[k - 6 - A.njson][3] ? (unsigned)T[k - 6 - A.njson][3] : gm_suggest_l(abc[0], abc[1], abc[2]); rc = iut_gen_from_abc(d, abc[0], abc[1], abc[2], l ? l : 13); }
        if (rc) { printf("✗ could not make data #%d\n", k); ++bad; continue; }
        for (int h = 0; h < 5; h += 2) {
            gm_init(m);
            gm_load(m, d, 2, HORIZ_KIND[h == 0 ? 3 : h == 2 ? 0 : 4], abc[0] ? abc : NULL, "check");
            int steps = 0;
            while (gm_step(m)) {
                ++steps;
                gd_hits hits;
                gd_stage(cr, 1100, m, m->view, &hits);
            }
            for (int st = 0; st < GS_COUNT; ++st) gd_stage(cr, 1100, m, st, NULL);
            gd_lattice_page(cr, 1100, 700, m, NULL); gd_abc(cr, 1100, m); gd_rail(cr, 230, 600, m);
            /* the lattice built link by link must be the lattice iut_lattice_build_H builds, field for field */
            char *j1 = NULL, *j2 = NULL; size_t n1 = 0, n2 = 0;
            FILE *f = open_memstream(&j1, &n1); iut_json_lattice(f, m->lat); fclose(f);
            iut_log_theta_lattice *ref = calloc(1, sizeof *ref);
            iut_lattice_init(ref, &m->data, m->horizontal); iut_lattice_build_H(ref, 0, -m->rows, m->rows);
            f = open_memstream(&j2, &n2); iut_json_lattice(f, ref); fclose(f);
            int same = n1 == n2 && !memcmp(j1, j2, n1);
            iut_lattice_free(ref); free(ref); free(j1); free(j2);
            gm_explore_log(m, 0, m->rows); gm_explore_theta(m, 1, 1); gd_lattice_page(cr, 1100, 700, m, NULL);
            int agree = gm_problems(m) == m->pipeline_problems && same;
            ++runs;
            if (!agree) ++bad;
            printf("%s %-44s %-14s %2d steps  problems: gui %d, iut pipeline %d;  lattice %s\n", agree ? "✓" : "✗", m->data.name, iut_link_kind_notation(m->horizontal),
                   steps, gm_problems(m), m->pipeline_problems, same ? "identical to iut_lattice_build_H" : "DIFFERS from iut_lattice_build_H");
            gm_free(m);
        }
    }
    cairo_destroy(cr); cairo_surface_destroy(s);
    free(m); free(d);
    printf("%d run(s), %d disagreement(s)\n", runs, bad);
    return bad ? 1 : 0;
}

static int render_stage(const cli *o)
{
    gm_model *m = malloc(sizeof *m); gm_init(m);
    iut_initial_theta_data *d = malloc(sizeof *d);
    long long abc[3]; int have_abc; char src[256];
    if (cli_data(o, d, abc, &have_abc, src, sizeof src)) return 2;
    gm_load(m, d, o->rows, HORIZ_KIND[o->horiz], have_abc ? abc : NULL, src);
    if (!o->run && o->steps < 0) gm_run_all(m); else apply_steps(m, o);
    if (o->sel) { m->sel_n = o->sel_n; m->sel_m = o->sel_m; }
    int st = o->render_stage;
    double scale = 2.0;
    cairo_surface_t *rec = cairo_recording_surface_create(CAIRO_CONTENT_COLOR_ALPHA, NULL);
    cairo_t *cr = cairo_create(rec);
    double H = st == 8 ? gd_abc(cr, o->width, m) : st == 9 ? 720 : gd_stage(cr, o->width, m, st, NULL);
    cairo_destroy(cr); cairo_surface_destroy(rec);
    cairo_surface_t *img = cairo_image_surface_create(CAIRO_FORMAT_RGB24, (int)(o->width * scale), (int)(ceil(H) * scale));
    cr = cairo_create(img); cairo_scale(cr, scale, scale);
    if (st == 8) gd_abc(cr, o->width, m); else if (st == 9) gd_lattice_page(cr, o->width, H, m, NULL); else gd_stage(cr, o->width, m, st, NULL);
    cairo_destroy(cr);
    int rc = cairo_surface_write_to_png(img, o->render_out) != CAIRO_STATUS_SUCCESS;
    cairo_surface_destroy(img);
    if (!rc) printf("wrote %s (%d × %d)\n", o->render_out, (int)(o->width * scale), (int)(ceil(H) * scale));
    gm_free(m); free(m); free(d);
    return rc;
}

/* screenshot of the whole window, once it has been laid out and drawn */
typedef struct { app *A; const char *file; int phase; } shot_ctx;
static gboolean shot_tick(gpointer data)
{
    shot_ctx *s = data;
    if (s->phase++ < 2) { gtk_widget_queue_draw(s->A->win); return G_SOURCE_CONTINUE; }
    int w = gtk_widget_get_allocated_width(s->A->win), h = gtk_widget_get_allocated_height(s->A->win);
    cairo_surface_t *img = cairo_image_surface_create(CAIRO_FORMAT_RGB24, w, h);
    cairo_t *cr = cairo_create(img);
    gtk_widget_draw(s->A->win, cr);
    cairo_destroy(cr);
    cairo_surface_write_to_png(img, s->file);
    cairo_surface_destroy(img);
    printf("wrote %s (%d × %d)\n", s->file, w, h);
    gtk_main_quit();
    return G_SOURCE_REMOVE;
}

int main(int argc, char **argv)
{
    cli o;
    if (parse_cli(&o, argc, argv)) return 2;
    if (o.check) return run_check();
    if (o.render_stage >= 0) {
        if (!o.render_out) { fprintf(stderr, "--render-stage needs --out FILE.png\n"); return 2; }
        return render_stage(&o);
    }
    gtk_init(&argc, &argv);
    app *A = calloc(1, sizeof *A);
    gm_init(&A->m);
    find_json(A, argv[0]);
    build_window(A);

    /* initial data */
    iut_initial_theta_data *d = calloc(1, sizeof *d);
    long long abc[3]; int have_abc; char src[256];
    if (cli_data(&o, d, abc, &have_abc, src, sizeof src) == 0) {
        gm_load(&A->m, d, o.rows, HORIZ_KIND[o.horiz], have_abc ? abc : NULL, src);
        bench_msg(A, 0, "loaded %s", d->name);
    }
    free(d);
    /* reflect it on the bench */
    char s[32];
    snprintf(s, sizeof s, "%lld", A->m.have_abc ? A->m.abc.a : 1); gtk_entry_set_text(GTK_ENTRY(A->e_a), s);
    snprintf(s, sizeof s, "%lld", A->m.have_abc ? A->m.abc.b : 2400); gtk_entry_set_text(GTK_ENTRY(A->e_b), s);
    set_combo_l(A, A->m.loaded ? A->m.data.l : o.l);
    gtk_combo_box_set_active(GTK_COMBO_BOX(A->src_combo), o.have_json ? 3 : o.have_seed ? 2 : o.have_example ? 1 : 0);
    if (o.have_example) gtk_spin_button_set_value(GTK_SPIN_BUTTON(A->ex_spin), o.example);
    if (o.have_seed) gtk_spin_button_set_value(GTK_SPIN_BUTTON(A->seed_spin), o.seed);
    if (o.have_json) for (int k = 0; k < A->njson; ++k) if (strstr(A->json_files[k], strrchr(o.json, '/') ? strrchr(o.json, '/') + 1 : o.json)) gtk_combo_box_set_active(GTK_COMBO_BOX(A->json_combo), k);
    gtk_combo_box_set_active(GTK_COMBO_BOX(A->horiz_combo), o.horiz);
    gtk_spin_button_set_value(GTK_SPIN_BUTTON(A->rows_spin), o.rows);
    apply_steps(&A->m, &o);
    gtk_window_set_default_size(GTK_WINDOW(A->win), o.w, o.h);
    gtk_widget_show_all(A->win);
    refresh(A, 1);
    if (o.sel) tree_show_vertex(A, o.sel_n, o.sel_m);
    if (o.tab) {
        static const char *tabs[] = { "stage", "lattice", "abc", "processes", "transcript" };
        for (int k = 0; k < 5; ++k) if (!strcmp(o.tab, tabs[k])) gtk_notebook_set_current_page(GTK_NOTEBOOK(A->nb), k);
        if (!strcmp(o.tab, "processes")) on_proc_all(NULL, A);
    }
    if (o.shot) { shot_ctx *sc = calloc(1, sizeof *sc); sc->A = A; sc->file = o.shot; g_timeout_add(500, shot_tick, sc); }
    gtk_main();
    gm_free(&A->m);
    return 0;
}
