/* gui_draw.h — the drawing entry points of iut-gui (gui_draw.c) */
#ifndef IUT_GUI_DRAW_H
#define IUT_GUI_DRAW_H
#include <cairo.h>
#include "gui.h"

typedef struct { int n, m; double x, y, r; } gd_vhit;                  /* a clickable lattice vertex */
typedef struct { int nv; gd_vhit v[IUT_LAT_N * IUT_LAT_M]; } gd_hits;

/* each returns the height it used, so the caller can size its scrolled canvas */
double gd_stage(cairo_t *cr, double W, const gm_model *m, int stage, gd_hits *hits);
double gd_lattice_page(cairo_t *cr, double W, double H, const gm_model *m, gd_hits *hits);
double gd_abc(cairo_t *cr, double W, const gm_model *m);
void   gd_lattice(cairo_t *cr, double x, double y, double w, double h, const gm_model *m, int n0, int n1, int m0, int m1, gd_hits *hits, int big);
void   gd_rail(cairo_t *cr, double W, double H, const gm_model *m);
int    gd_rail_hit(double y);                                         /* stage under y, or -1 */
#endif
