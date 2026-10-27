/*
 * iut_tui.c — ncurses interface.
 *
 *  Screens (number keys):
 *    1 Θ-data   2 validate   3 lattice   4 Hodge theater (focus)   5 alien copies
 *    6 multiradial / log-volume   7 étale-picture   8 species   9 identifiers
 *  Lattice actions:
 *    arrows  move focus      l  log-link from focus (n,m)→(n,m+1)
 *    t       Θ-link from focus (n,m)→(n+1,m)        H  build the infinite H
 *    L       cycle the horizontal link kind (Θ, Θ×μ, gau, LGP, lgp) and rebuild
 *  Data actions:
 *    e  next example   r  new random data   a  enter an abc triple and l
 *  Paging: PgUp/PgDn/Home/End, j/k.   ?  help.   q  quit.
 *
 * Every screen is rendered by the plain-text views of iut_view.c into a
 * memory stream, then paged — so the TUI and `iut walk` always agree.
 */
#include <stdlib.h>
#include <string.h>
#include "iut.h"

#ifdef IUT_NO_CURSES
int iut_tui_main(const iut_options *o)
{
    fprintf(stderr, "this build has no ncurses; running `iut walk` instead\n");
    iut_initial_theta_data d; if (iut_options_make_data(o, &d, stderr)) return 2;
    iut_log_theta_lattice *lat = calloc(1, sizeof *lat);
    iut_lattice_init(lat, &d, o->horizontal); iut_lattice_build_H(lat, 0, -o->rows, o->rows);
    iut_view_lattice(stdout, lat); iut_view_hodge_theater(stdout, iut_lattice_get(lat, 0, 0));
    iut_lattice_free(lat); free(lat); return 0;
}
#else
#define _XOPEN_SOURCE_EXTENDED 1
#include <locale.h>
#include <curses.h>

typedef struct {
    iut_options opt;
    iut_log_theta_lattice *lat;
    int screen, scroll, example, seed;
    char status[160];
    char *buf; size_t buflen;      /* rendered text of the current screen */
    char **lines; int nlines;
    char filter[40];
} tui;

static void rebuild_lattice(tui *T, const iut_initial_theta_data *d)
{
    iut_link_kind h = T->lat->horizontal ? T->lat->horizontal : T->opt.horizontal;
    if (!T->lat->data.l) h = T->opt.horizontal;
    iut_lattice_free(T->lat);
    iut_lattice_init(T->lat, d, h);
    iut_lattice_build_H(T->lat, 0, -1, 1);
}

static void render(tui *T)
{
    free(T->buf); free(T->lines); T->buf = NULL; T->lines = NULL; T->nlines = 0; T->buflen = 0;
    FILE *m = open_memstream(&T->buf, &T->buflen);
    iut_log_theta_lattice *lat = T->lat;
    iut_hodge_theater *focus = iut_lattice_in_range(lat->focus_n, lat->focus_m) ? lat->ht[lat->focus_n + IUT_LAT_NOFF][lat->focus_m + IUT_LAT_MOFF] : NULL;
    iut_report r; memset(&r, 0, sizeof r);
    switch (T->screen) {
    case 1: iut_view_data(m, &lat->data); break;
    case 2: iut_validate_data(&lat->data, &r); if (focus) iut_validate_hodge_theater(focus, &r); iut_validate_lattice(lat, &r); iut_view_report(m, &r); break;
    case 3: iut_view_lattice(m, lat); fprintf(m, "\nfocus (%d,%d): %s   keys: arrows move · l log-link · t Θ-link · H infinite H · L link kind\n", lat->focus_n, lat->focus_m, focus ? focus->copy_label : "(empty: press l/t from a neighbour)"); break;
    case 4: if (focus) iut_view_hodge_theater(m, focus); else fprintf(m, "no Hodge theater at (%d,%d) yet — move the focus or apply a link\n", lat->focus_n, lat->focus_m); break;
    case 5: iut_view_alien(m, lat, lat->focus_n, lat->focus_m); break;
    case 6: { iut_multiradial_rep rep; iut_multiradial_build(lat, lat->focus_n, &rep); iut_view_multiradial(m, &rep, &lat->data); } break;
    case 7: iut_view_etale_picture(m, lat); break;
    case 8: iut_view_species(m); break;
    case 9: fprintf(m, "filter: '%s'  (type letters to filter, Backspace to erase)\n\n", T->filter); iut_view_idents(m, T->filter); break;
    default:
        fprintf(m, "iut — inter-universal Teichmüller theory data types\n\n"
                   "  1 Θ-data        2 validate        3 log-theta-lattice   4 Hodge theater (focus)\n"
                   "  5 alien copies  6 multiradial     7 étale-picture       8 species / mutations\n"
                   "  9 identifiers (letters-only)\n\n"
                   "  lattice: arrows move the focus; l = log-link (n,m)→(n,m+1); t = Θ-link (n,m)→(n+1,m);\n"
                   "           H = build the infinite H; L = cycle Θ / Θ×μ / Θ×μ_gau / Θ×μ_LGP / Θ×μ_lgp\n"
                   "  data:    e = next example; r = random; a = type an abc triple and l\n"
                   "  paging:  PgUp PgDn Home End j k;  q quits\n\n"
                   "  Everything on screen is produced by the same C model the CLI uses (`iut walk`).\n"
                   "  References in brackets point into the PDFs in this repository.\n");
    }
    fclose(m);
    /* split into lines */
    int cap = 64; T->lines = malloc(cap * sizeof *T->lines);
    char *p = T->buf;
    while (p && *p) {
        if (T->nlines == cap) { cap *= 2; T->lines = realloc(T->lines, cap * sizeof *T->lines); }
        T->lines[T->nlines++] = p;
        char *nl = strchr(p, '\n');
        if (!nl) break;
        *nl = 0; p = nl + 1;
    }
    if (T->scroll > T->nlines - 1) T->scroll = T->nlines > 0 ? T->nlines - 1 : 0;
    if (T->scroll < 0) T->scroll = 0;
}

static void draw(tui *T)
{
    int H, W; getmaxyx(stdscr, H, W);
    erase();
    static const char *names[] = { "help", "Θ-data", "validate", "lattice", "Hodge theater", "alien copies", "multiradial", "étale-picture", "species", "identifiers" };
    attron(A_REVERSE);
    mvprintw(0, 0, " iut  [%s]  %s  l=%u  focus=(%d,%d)  %s  ", names[T->screen], T->lat->data.name, T->lat->data.l, T->lat->focus_n, T->lat->focus_m, iut_link_kind_notation(T->lat->horizontal));
    for (int x = getcurx(stdscr); x < W; ++x) addch(' ');
    attroff(A_REVERSE);
    int rows = H - 2;
    for (int i = 0; i < rows && T->scroll + i < T->nlines; ++i) {
        const char *ln = T->lines[T->scroll + i];
        if (strstr(ln, "ERROR") || strstr(ln, "FAIL")) attron(A_BOLD);
        mvaddnstr(1 + i, 0, ln, W * 4);
        attroff(A_BOLD);
    }
    attron(A_REVERSE);
    mvprintw(H - 1, 0, " %s  (line %d/%d)  1-9 screens  ? help  q quit ", T->status, T->nlines ? T->scroll + 1 : 0, T->nlines);
    for (int x = getcurx(stdscr); x < W; ++x) addch(' ');
    attroff(A_REVERSE);
    refresh();
}

static void prompt_abc(tui *T)
{
    int H, W; getmaxyx(stdscr, H, W); (void)W;
    echo(); curs_set(1);
    mvprintw(H - 1, 0, " enter: a b c l  (a+b=c coprime, l prime ≥ 5) > ");
    clrtoeol();
    char in[80] = ""; getnstr(in, sizeof in - 1);
    noecho(); curs_set(0);
    long long a, b, c; unsigned l;
    if (sscanf(in, "%lld %lld %lld %u", &a, &b, &c, &l) == 4) {
        iut_initial_theta_data d;
        int rc = iut_gen_from_abc(&d, a, b, c, l);
        if (rc == 0) { rebuild_lattice(T, &d); snprintf(T->status, sizeof T->status, "generated %s", d.name); }
        else snprintf(T->status, sizeof T->status, "rejected (code %d): need a+b=c, coprime, l prime ≥ 5", rc);
    } else snprintf(T->status, sizeof T->status, "expected four numbers");
}

int iut_tui_main(const iut_options *o)
{
    setlocale(LC_ALL, "");
    tui T; memset(&T, 0, sizeof T);
    T.opt = *o; T.example = o->example; T.seed = (int)o->seed;
    T.lat = calloc(1, sizeof *T.lat);
    iut_initial_theta_data d;
    if (iut_options_make_data(o, &d, stderr)) return 2;
    iut_lattice_init(T.lat, &d, o->horizontal);
    iut_lattice_build_H(T.lat, 0, -o->rows, o->rows);
    T.screen = 3;
    snprintf(T.status, sizeof T.status, "built the infinite H of the log-theta-lattice");
    initscr(); cbreak(); noecho(); keypad(stdscr, TRUE); curs_set(0);
    render(&T);
    for (;;) {
        draw(&T);
        int ch = getch();
        int H = getmaxy(stdscr), page = H - 3;
        if (T.screen == 9 && ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == KEY_BACKSPACE || ch == 127 || ch == 8) && ch != 'q' && ch != 'Q') {
            size_t n = strlen(T.filter);
            if (ch == KEY_BACKSPACE || ch == 127 || ch == 8) { if (n) T.filter[n - 1] = 0; }
            else if (n + 1 < sizeof T.filter) { T.filter[n] = (char)ch; T.filter[n + 1] = 0; }
            T.scroll = 0; render(&T); continue;
        }
        if (ch == 'q' || ch == 'Q') break;
        if (ch >= '0' && ch <= '9') { T.screen = ch - '0'; T.scroll = 0; render(&T); continue; }
        if (ch == '?') { T.screen = 0; T.scroll = 0; render(&T); continue; }
        switch (ch) {
        case KEY_NPAGE: T.scroll += page; break;
        case KEY_PPAGE: T.scroll -= page; break;
        case 'j': T.scroll++; break;
        case 'k': T.scroll--; break;
        case KEY_HOME: T.scroll = 0; break;
        case KEY_END: T.scroll = T.nlines - page; break;
        case KEY_UP:    if (iut_lattice_in_range(T.lat->focus_n, T.lat->focus_m + 1)) T.lat->focus_m++; break;
        case KEY_DOWN:  if (iut_lattice_in_range(T.lat->focus_n, T.lat->focus_m - 1)) T.lat->focus_m--; break;
        case KEY_LEFT:  if (iut_lattice_in_range(T.lat->focus_n - 1, T.lat->focus_m)) T.lat->focus_n--; break;
        case KEY_RIGHT: if (iut_lattice_in_range(T.lat->focus_n + 1, T.lat->focus_m)) T.lat->focus_n++; break;
        case 'l': {
            const iut_link *L = iut_apply_log_link(T.lat, T.lat->focus_n, T.lat->focus_m);
            if (L) { snprintf(T.status, sizeof T.status, "log-link (%d,%d)→(%d,%d): D-prime-strips shared, log-shells built in the codomain", L->dom_n, L->dom_m, L->cod_n, L->cod_m); T.lat->focus_m++; }
            else snprintf(T.status, sizeof T.status, "cannot apply a log-link here (edge of the modelled lattice)");
            break; }
        case 't': {
            const iut_link *L = iut_apply_theta_link(T.lat, T.lat->focus_n, T.lat->focus_m);
            if (L) { snprintf(T.status, sizeof T.status, "%s (%d,%d)→(%d,%d): O×μ shared, value groups dilated by %.2f, Π_v alien", iut_link_kind_notation(L->kind), L->dom_n, L->dom_m, L->cod_n, L->cod_m, L->dilation); T.lat->focus_n++; }
            else snprintf(T.status, sizeof T.status, "cannot apply a Θ-link here (edge of the modelled lattice)");
            break; }
        case 'H': iut_lattice_build_H(T.lat, T.lat->focus_n, -3, 3); snprintf(T.status, sizeof T.status, "built the infinite H on columns %d,%d", T.lat->focus_n, T.lat->focus_n + 1); break;
        case 'L': {
            iut_link_kind k = T.lat->horizontal;
            k = (k == IUT_LINK_THETA) ? IUT_LINK_THETA_UNITSMODTORS : (k == IUT_LINK_THETA_UNITSMODTORS) ? IUT_LINK_THETA_UNITSMODTORS_GAU : (k == IUT_LINK_THETA_UNITSMODTORS_GAU) ? IUT_LINK_THETA_UNITSMODTORS_LGP : (k == IUT_LINK_THETA_UNITSMODTORS_LGP) ? IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL : IUT_LINK_THETA;
            iut_initial_theta_data dd = T.lat->data; iut_lattice_free(T.lat); iut_lattice_init(T.lat, &dd, k); iut_lattice_build_H(T.lat, 0, -1, 1);
            snprintf(T.status, sizeof T.status, "horizontal link is now the %s", iut_link_kind_notation(k)); break; }
        case 'e': { T.example = (T.example + 1) % 6; iut_initial_theta_data dd; if (iut_gen_example(&dd, T.example) == 0) { rebuild_lattice(&T, &dd); snprintf(T.status, sizeof T.status, "example %d: %s", T.example, dd.name); } break; }
        case 'r': { T.seed++; iut_initial_theta_data dd; if (iut_gen_random(&dd, (unsigned)T.seed) == 0) { rebuild_lattice(&T, &dd); snprintf(T.status, sizeof T.status, "random data: %s", dd.name); } break; }
        case 'a': prompt_abc(&T); break;
        case KEY_RESIZE: break;
        default: break;
        }
        render(&T);
    }
    endwin();
    free(T.buf); free(T.lines);
    iut_lattice_free(T.lat); free(T.lat);
    return 0;
}
#endif
