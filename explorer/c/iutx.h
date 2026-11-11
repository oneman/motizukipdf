/*
 * iutx.h — the guided IUT explorer.
 *
 * A fresh start: nothing here uses the old process / pipeline / verdict code
 * of src/.  The only thing shared with src/ is the table of letters-only
 * identifiers (src/iut_ids.c) and the rule that turns a printed notation into
 * such an identifier.
 *
 * Everything in the model is written from the text of
 *   [IUTchI] S. Mochizuki, Inter-universal Teichmüller Theory I
 * (pdf/Inter-universal Teichmuller Theory I.pdf), and every node and step
 * carries the place in that paper it comes from.
 *
 * Three layers:
 *   model   (model.c)   the objects of [IUTchI], the constructions between
 *                       them, and the guided tour through the constructions;
 *   engine  (engine.c)  a configuration (l and a window of V_mod), a state
 *                       (which objects have been built, in which order), and
 *                       the "facts": the finite combinatorics of the labels
 *                       that really can be computed;
 *   faces   (main.c, tui.c, ../web/)  CLI transcript, ncurses TUI, canvas app.
 */
#ifndef IUTX_H
#define IUTX_H

#include <stddef.h>
#include <stdio.h>

/* ------------------------------------------------------------------ model */

typedef struct {
    const char *id;        /* letters only, unique case-insensitively          */
    const char *notation;  /* as printed in [IUTchI] (UTF-8)                   */
    const char *kind;      /* datum field curve group labelset category        */
                           /* frobenioid primestrip capsule bridge theater     */
                           /* link picture map                                 */
    const char *tags;      /* space separated: local global labels             */
                           /* etale frobenius holomorphic mono                 */
    const char *ref;       /* where in [IUTchI]                                */
    const char *brief;     /* what it is                                       */
    const char *parts;     /* space separated node ids it consists of / uses   */
} x_node;

typedef struct {
    const char *title;
    const char *ref;
    const char *intro;
} x_act;

typedef struct {
    const char *id;        /* letters only                                     */
    int         act;       /* index into x_acts                                */
    const char *title;
    const char *ref;
    const char *in;        /* space separated node ids that must exist         */
    const char *out;       /* space separated node ids this step builds        */
    const char *does;      /* what the construction does                       */
    const char *watch;     /* what to look at / what is lost or kept           */
    const char *fact;      /* name of a fact view, or ""                       */
    const char *picture;   /* name of a picture, or ""                         */
} x_step;

extern const x_node x_nodes[];
extern const size_t x_nodes_count;
extern const x_act  x_acts[];
extern const size_t x_acts_count;
extern const x_step x_steps[];     /* in tour order */
extern const size_t x_steps_count;

int  x_node_index(const char *id);              /* -1 if missing */
int  x_step_index(const char *id);
int  x_id_is_letters(const char *id);
/* iterate a space separated list: returns length of token at *p, advances */
int  x_next_token(const char **p, char *buf, size_t n);
/* model self-check; prints problems to err; returns their number */
int  x_model_check(FILE *err);
/* compare the node ids with the trusted table src/iut_ids.c */
void x_model_ids_report(FILE *out);

/* ----------------------------------------------------------------- engine */

enum { X_BAD = 0, X_GOOD = 1, X_ARC = 2 };
#define X_MAX_PLACES 24
#define X_L_MAX      29     /* (l±)^(l±) must fit in 64 bits */

typedef struct {
    int kind;          /* X_BAD, X_GOOD, X_ARC                                 */
    int p;             /* residue characteristic; 0 at an archimedean place    */
} x_place;

typedef struct {
    int     l;
    int     nplaces;
    x_place places[X_MAX_PLACES];   /* a finite window of V_mod ≅ V           */
} x_config;

#define X_MAX_NODES 128
#define X_MAX_STEPS 64

typedef struct {
    x_config      cfg;
    unsigned char built[X_MAX_NODES];   /* node has been constructed           */
    unsigned char done[X_MAX_STEPS];    /* step has been applied               */
    int           hist[X_MAX_STEPS];    /* applied steps, oldest first         */
    int           nhist;
} x_state;

void x_config_default(x_config *c);
/* parse "3,11" style lists; returns 0 on success */
int  x_config_set(x_config *c, int l, const char *bad, const char *good);
/* number of violated checkable conditions of [IUTchI] Def 3.1; messages to err */
int  x_config_check(const x_config *c, FILE *err);
void x_place_name(const x_place *p, char *buf, size_t n);

void x_state_init(x_state *s, const x_config *c);
int  x_step_ready(const x_state *s, int step);          /* inputs all built    */
int  x_step_missing(const x_state *s, int step, char *buf, size_t n);
int  x_apply(x_state *s, int step);                     /* 0 ok                */
int  x_undo(x_state *s);                                /* 0 ok                */
int  x_next(const x_state *s);                          /* next tour step, -1  */

/* facts: lines "key<TAB>value" appended to a growable buffer */
typedef struct { char *s; size_t len, cap; } x_buf;
void x_buf_init(x_buf *b);
void x_buf_free(x_buf *b);
void x_buf_printf(x_buf *b, const char *fmt, ...);
extern const char *const x_fact_views[];
extern const size_t      x_fact_views_count;
/* returns 0 if the view exists */
int  x_facts(const x_config *c, const char *view, x_buf *out);

/* ------------------------------------------------------------------ faces */
void x_json_string(FILE *f, const char *s);
void x_json_model(FILE *f);
void x_json_facts(FILE *f, const x_config *c);
int  x_tui(x_state *s);        /* returns 0; 1 if built without ncurses */

#endif
