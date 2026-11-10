/*
 * gui.h — `iut-gui`, the graphical pipeline program of the IUT toolkit (GTK 3 + Cairo).
 *
 * The program runs the same pipeline as `iut pipeline` (src/iut_pipeline.c) on the same
 * C library, one step at a time, and draws the state after every step:
 *
 *   stage 0  initial Θ-data                     [IUTchI] Def 3.1
 *   stage 1  conditions (a)–(f), validation     [IUTchI] Def 3.1
 *   stage 2  Hodge theaters                     [IUTchI] §3–§6, Def 6.13
 *   stage 3  Gaussian monoids                   [IUTchII] Cor 2.5, 3.5, 4.10
 *   stage 4  log-theta-lattice, link by link    [IUTchIII] Def 1.1, 1.4, 3.8
 *   stage 5  multiradial rep., Cor 3.12         [IUTchIII] Thm 3.11, Cor 3.12
 *   stage 6  height bound                       [IUTchIV] Thm 1.10, Cor 2.2
 *   stage 7  cross-check with the JSON file
 *
 * gui_model.c  the pipeline state machine (no GTK in it, so `iut-gui --check` can run it headless)
 * gui_draw.c   Cairo/Pango drawing of every stage, the lattice and the abc triple
 * gui_tree.c   the object inspector (a GtkTreeStore of every object built so far)
 * gui_main.c   the window, the bench, the controls, screenshots and --check
 */
#ifndef IUT_GUI_H
#define IUT_GUI_H

#include <stdio.h>
#include "../iut_ops.h"

enum { GS_DATA = 0, GS_DEF, GS_HT, GS_GAU, GS_LAT, GS_MR, GS_HB, GS_XC, GS_COUNT };

typedef struct { const char *num, *title, *ref, *ident; } gm_stage_info;
extern const gm_stage_info gm_stages[GS_COUNT];

typedef struct { const char *what; double toolkit, file; int ok; } gm_xcheck;
typedef struct { int theta; int n, m; } gm_planned_link;   /* one link of the infinite H, in build order */

/* an abc triple with its factorizations (for the abc view) */
#define GM_MAX_FACTORS 16
typedef struct { unsigned long long p; unsigned e; } gm_factor;
typedef struct {
    long long a, b, c;
    unsigned nf[3]; gm_factor f[3][GM_MAX_FACTORS];   /* factorizations of a, b, c */
    double log_rad, log_c, quality;                   /* rad(abc), q = log c / log rad(abc) */
    int probable;                                     /* a cofactor > 3037000² was taken to be prime */
} gm_abc;

typedef struct {
    /* input */
    int loaded;
    iut_initial_theta_data data;
    int rows;                     /* the H spans rows -rows..rows */
    iut_link_kind horizontal;
    char source[160];             /* how the data was made, for the log */
    int have_abc; gm_abc abc;

    /* progress */
    int reached;                  /* stages done: stage k is done iff reached > k; GS_COUNT = complete */
    int view;                     /* the stage shown */
    int ok[GS_COUNT];             /* -1 not reached, 0 failed, 1 went through, 2 skipped */
    int nplan, done_links;        /* stage 4: the links of the H, and how many are applied */
    gm_planned_link plan[4 * IUT_LAT_MOFF + 4];
    int explored;                 /* links applied by hand after the pipeline finished */

    /* stage 1 */
    iut_report rdata; iut_def_three_one_item items[8]; unsigned nitems;
    /* stages 2 and 4 */
    iut_log_theta_lattice *lat;
    iut_report rht, rlat;
    int last_link;                /* index into lat->links of the newest link, -1 none */
    int sel_n, sel_m;             /* the selected vertex (Hodge theater shown in stage 2) */
    /* stage 3 */
    iut_pilot qp, tp;
    /* stage 5 */
    iut_multiradial_full *mr; iut_named_value c312[8]; unsigned nc312; int c312ok;
    /* stage 6 */
    iut_thm110 T; iut_cor22 C;
    /* stage 7 */
    gm_xcheck xc[4]; unsigned nxc, xbad;

    /* the transcript of `iut pipeline` on the same data, cut into stages */
    char *transcript[GS_COUNT]; char *transcript_head, *transcript_tail;
    int pipeline_problems;        /* what `iut pipeline` reports (the GUI must agree) */

    /* the state log: one line per step */
    char *log; size_t loglen, logcap;
    size_t log_mark;              /* length of the log before the last step (new lines are highlighted) */
} gm_model;

void gm_init(gm_model *m);
void gm_free(gm_model *m);
/* load initial Θ-data; abc may be NULL. Resets the pipeline to "nothing done". */
void gm_load(gm_model *m, const iut_initial_theta_data *d, int rows, iut_link_kind horizontal, const long long *abc, const char *source);
void gm_reset(gm_model *m);                  /* back to "data loaded, no stage done" */
int  gm_step(gm_model *m);                   /* one step (a stage, or one link in stage 4); 0 when nothing is left */
void gm_run_all(gm_model *m);
int  gm_current_stage(const gm_model *m);    /* the stage the next step works on (GS_COUNT when complete) */
int  gm_problems(const gm_model *m);         /* same count as `iut pipeline` (so far) */
void gm_progress(const gm_model *m, char *buf, size_t n);
void gm_logf(gm_model *m, const char *fmt, ...) __attribute__((format(printf, 2, 3)));
/* exploring the lattice by hand once the pipeline is complete; 0 = applied */
int  gm_explore_log(gm_model *m, int n, int m_);
int  gm_explore_theta(gm_model *m, int n, int m_);
/* V^bad_mod */
unsigned gm_bad_places(const iut_initial_theta_data *d, unsigned *out);
/* abc helpers */
int  gm_abc_analyse(gm_abc *x, long long a, long long b, long long c);
int  gm_abc_from_data(const iut_initial_theta_data *d, long long *abc);   /* parse frey-a-b-c / abc(a,b,c) */
unsigned gm_suggest_l(long long a, long long b, long long c);              /* smallest l passing Def 3.1, 0 if none */
/* a stable colour index 0..11 for a copy id (universe / basepoint) */
unsigned gm_copy_colour(unsigned id);

#endif
