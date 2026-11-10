/* gui_tree.h — the object inspector of iut-gui (gui_tree.c) */
#ifndef IUT_GUI_TREE_H
#define IUT_GUI_TREE_H
#include <gtk/gtk.h>
#include "gui.h"
enum { TC_NAME, TC_VALUE, TC_IDENT, TC_KEY, TC_WEIGHT, TC_COUNT };
GtkTreeStore *gt_store_new(void);
void gt_rebuild(GtkTreeStore *st, const gm_model *m);
#endif
