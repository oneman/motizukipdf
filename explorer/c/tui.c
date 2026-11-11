/*
 * tui.c — the interactive terminal face of the explorer (ncurses).
 *
 * Left: the tour, act by act, every step marked done / ready / waiting.
 * Right: the selected step (or object), and the facts computed for it.
 *
 *   ↑ ↓ j k   move            Enter   apply the selected step
 *   n         apply the next step of the tour      u   undo the last step
 *   Tab       switch between steps and the objects of the step
 *   + −       next / previous prime l              r   start again
 *   PgUp PgDn scroll the right pane                q   quit
 */
#include "iutx.h"

#ifndef X_HAVE_NCURSES
int x_tui(x_state *s) { (void)s; return 1; }
#else
#define _XOPEN_SOURCE_EXTENDED 1
#include <locale.h>
#include <stdlib.h>
#include <string.h>
#include <curses.h>

enum { C_DONE = 1, C_READY, C_WAIT, C_HEAD, C_KEY, C_SEL };

/* a list of text lines for the right pane */
typedef struct { char **v; int *attr; int n, cap; } lines;

static void push(lines *L, int attr, const char *s, int len)
{
    if (L->n == L->cap) {
        L->cap = L->cap ? L->cap * 2 : 64;
        L->v = realloc(L->v, (size_t)L->cap * sizeof *L->v);
        L->attr = realloc(L->attr, (size_t)L->cap * sizeof *L->attr);
    }
    L->v[L->n] = malloc((size_t)len + 1);
    memcpy(L->v[L->n], s, (size_t)len);
    L->v[L->n][len] = 0;
    L->attr[L->n] = attr;
    L->n++;
}

static void clear_lines(lines *L)
{
    for (int i = 0; i < L->n; i++) free(L->v[i]);
    L->n = 0;
}

/* wrap text to width columns (UTF-8 aware, one column per code point) */
static void push_wrapped(lines *L, int attr, const char *indent, const char *text, int width)
{
    char buf[2048];
    const char *p = text;
    size_t len = 0;
    int col = 0, ind = (int)strlen(indent);
    if (width < ind + 10) width = ind + 10;
    len = (size_t)snprintf(buf, sizeof buf, "%s", indent);
    while (*p) {
        const char *q = p;
        int w = 0;
        while (*q && *q != ' ') { if (((unsigned char)*q & 0xC0) != 0x80) w++; q++; }
        if (col && ind + col + 1 + w > width) {
            push(L, attr, buf, (int)len);
            len = (size_t)snprintf(buf, sizeof buf, "%s", indent);
            col = 0;
        }
        if (col && len + 1 < sizeof buf) { buf[len++] = ' '; col++; }
        if (len + (size_t)(q - p) < sizeof buf) { memcpy(buf + len, p, (size_t)(q - p)); len += (size_t)(q - p); }
        col += w;
        p = q;
        while (*p == ' ') p++;
    }
    push(L, attr, buf, (int)len);
}

static void push_nodes(lines *L, const x_state *s, const char *label, const char *list, int width, int cursor, int *count)
{
    char tok[96], buf[512];
    const char *p = list;
    push(L, COLOR_PAIR(C_HEAD) | A_BOLD, label, (int)strlen(label));
    if (!*list) { push(L, 0, "  nothing", 9); return; }
    while (x_next_token(&p, tok, sizeof tok)) {
        int k = x_node_index(tok);
        int sel = (*count == cursor);
        snprintf(buf, sizeof buf, " %s %s %-26s %s", sel ? ">" : " ", k >= 0 && s->built[k] ? "■" : "□", tok,
                 k >= 0 ? x_nodes[k].notation : "");
        push_wrapped(L, sel ? COLOR_PAIR(C_SEL) | A_BOLD : 0, "", buf, width + 40);
        (*count)++;
    }
}

static const char *nth_node(const x_step *st, int n)
{
    static char tok[96];
    const char *lists[2] = { st->in, st->out };
    for (int a = 0; a < 2; a++) {
        const char *p = lists[a];
        while (x_next_token(&p, tok, sizeof tok))
            if (n-- == 0) return tok;
    }
    return NULL;
}

static int node_count(const x_step *st)
{
    char tok[96];
    int n = 0;
    const char *lists[2] = { st->in, st->out };
    for (int a = 0; a < 2; a++) {
        const char *p = lists[a];
        while (x_next_token(&p, tok, sizeof tok)) n++;
    }
    return n;
}

static void build_right(lines *L, const x_state *s, int sel, int focus_nodes, int ncur, int width)
{
    const x_step *st = &x_steps[sel];
    char buf[512];
    int count = 0;
    clear_lines(L);
    snprintf(buf, sizeof buf, "Act %d. %s", st->act + 1, x_acts[st->act].title);
    push(L, COLOR_PAIR(C_HEAD) | A_BOLD, buf, (int)strlen(buf));
    push_wrapped(L, A_DIM, "", x_acts[st->act].intro, width);
    push(L, 0, "", 0);
    snprintf(buf, sizeof buf, "Step %d. %s", sel + 1, st->title);
    push(L, A_BOLD, buf, (int)strlen(buf));
    snprintf(buf, sizeof buf, "[IUTchI] %s   id: %s", st->ref, st->id);
    push(L, COLOR_PAIR(C_KEY), buf, (int)strlen(buf));
    if (s->done[sel]) push(L, COLOR_PAIR(C_DONE), "done", 4);
    else if (x_step_ready(s, sel)) push(L, COLOR_PAIR(C_READY), "ready: press Enter to apply", 27);
    else {
        char miss[400];
        x_step_missing(s, sel, miss, sizeof miss);
        snprintf(buf, sizeof buf, "waiting for: %s", miss);
        push_wrapped(L, COLOR_PAIR(C_WAIT), "", buf, width);
    }
    push(L, 0, "", 0);
    push_wrapped(L, 0, "", st->does, width);
    push(L, 0, "", 0);
    push_nodes(L, s, "needs", st->in, width, focus_nodes ? ncur : -1, &count);
    push_nodes(L, s, "builds", st->out, width, focus_nodes ? ncur : -1, &count);
    if (focus_nodes) {
        const char *id = nth_node(st, ncur);
        int k = id ? x_node_index(id) : -1;
        if (k >= 0) {
            push(L, 0, "", 0);
            snprintf(buf, sizeof buf, "%s   %s", x_nodes[k].id, x_nodes[k].notation);
            push_wrapped(L, COLOR_PAIR(C_HEAD) | A_BOLD, "", buf, width);
            snprintf(buf, sizeof buf, "[IUTchI] %s   %s   %s", x_nodes[k].ref, x_nodes[k].kind, x_nodes[k].tags);
            push_wrapped(L, COLOR_PAIR(C_KEY), "", buf, width);
            push_wrapped(L, 0, "", x_nodes[k].brief, width);
            if (*x_nodes[k].parts) {
                snprintf(buf, sizeof buf, "made of / uses: %s", x_nodes[k].parts);
                push_wrapped(L, A_DIM, "", buf, width);
            }
        }
    }
    push(L, 0, "", 0);
    push(L, COLOR_PAIR(C_HEAD) | A_BOLD, "what to notice", 14);
    push_wrapped(L, 0, "", st->watch, width);
    if (*st->fact) {
        x_buf b;
        x_buf_init(&b);
        x_facts(&s->cfg, st->fact, &b);
        push(L, 0, "", 0);
        snprintf(buf, sizeof buf, "computed for l = %d", s->cfg.l);
        push(L, COLOR_PAIR(C_HEAD) | A_BOLD, buf, (int)strlen(buf));
        for (const char *p = b.s ? b.s : ""; *p; ) {
            const char *tab = strchr(p, '\t'), *nl = strchr(p, '\n');
            char line[1600];
            if (!tab || !nl) break;
            snprintf(line, sizeof line, "%.*s: %.*s", (int)(tab - p), p, (int)(nl - tab - 1), tab + 1);
            push_wrapped(L, 0, "  ", line, width);
            p = nl + 1;
        }
        x_buf_free(&b);
    }
}

static int next_prime(int l, int dir)
{
    static const int primes[] = { 5, 7, 11, 13, 17, 19, 23, 29 };
    int n = (int)(sizeof primes / sizeof primes[0]), i = 0;
    while (i < n && primes[i] != l) i++;
    if (i == n) return 7;
    i += dir;
    if (i < 0) i = 0;
    if (i >= n) i = n - 1;
    return primes[i];
}

int x_tui(x_state *s)
{
    lines L = { 0 };
    int sel = 0, top = 0, rtop = 0, focus_nodes = 0, ncur = 0;
    const char *msg = "n: next step   Enter: apply   u: undo   Tab: objects   +/−: change l   q: quit";

    setlocale(LC_ALL, "");
    initscr(); cbreak(); noecho(); keypad(stdscr, TRUE); curs_set(0);
    if (has_colors()) {
        start_color(); use_default_colors();
        init_pair(C_DONE, COLOR_GREEN, -1);  init_pair(C_READY, COLOR_YELLOW, -1);
        init_pair(C_WAIT, COLOR_RED, -1);    init_pair(C_HEAD, COLOR_CYAN, -1);
        init_pair(C_KEY, COLOR_MAGENTA, -1); init_pair(C_SEL, COLOR_BLACK, COLOR_CYAN);
    }
    for (;;) {
        int H, W, lw, row = 1, act = -1, built = 0, selrow = 0, ch;
        getmaxyx(stdscr, H, W);
        lw = W > 110 ? 46 : W * 2 / 5;
        erase();
        for (size_t i = 0; i < x_nodes_count; i++) built += s->built[i];
        attron(A_REVERSE);
        mvprintw(0, 0, " iutx: a guided walk through IUT I   l = %d   step %d of %zu   %d of %zu objects built %*s",
                 s->cfg.l, s->nhist, x_steps_count, built, x_nodes_count, W, "");
        attroff(A_REVERSE);

        /* left pane: find the row of the selection first, to scroll */
        {
            int r = 0, a = -1;
            for (size_t i = 0; i < x_steps_count; i++) {
                if (x_steps[i].act != a) { a = x_steps[i].act; r++; }
                if ((int)i == sel) selrow = r;
                r++;
            }
            if (selrow - top > H - 4) top = selrow - (H - 4);
            if (selrow - 1 < top) top = selrow - 1;
            if (top < 0) top = 0;
        }
        {
            int r = 0;
            for (size_t i = 0; i < x_steps_count; i++) {
                const x_step *st = &x_steps[i];
                if (st->act != act) {
                    act = st->act;
                    if (r >= top && row < H - 1) {
                        attron(COLOR_PAIR(C_HEAD) | A_BOLD);
                        mvprintw(row++, 0, "%d. %.*s", act + 1, lw - 4, x_acts[act].title);
                        attroff(COLOR_PAIR(C_HEAD) | A_BOLD);
                    }
                    r++;
                }
                if (r >= top && row < H - 1) {
                    int pair = s->done[i] ? C_DONE : x_step_ready(s, (int)i) ? C_READY : C_WAIT;
                    const char *mark = s->done[i] ? "✓" : x_step_ready(s, (int)i) ? "▶" : "·";
                    if ((int)i == sel && !focus_nodes) attron(A_REVERSE);
                    else if ((int)i == sel) attron(A_UNDERLINE);
                    attron(COLOR_PAIR(pair));
                    mvprintw(row, 0, " %s ", mark);
                    attroff(COLOR_PAIR(pair));
                    mvaddnstr(row, 3, st->title, lw - 4);
                    attroff(A_REVERSE | A_UNDERLINE);
                    row++;
                }
                r++;
            }
        }
        for (int y = 1; y < H - 1; y++) mvaddch(y, lw, ACS_VLINE);

        build_right(&L, s, sel, focus_nodes, ncur, W - lw - 3);
        if (rtop > L.n - (H - 2)) rtop = L.n - (H - 2);
        if (rtop < 0) rtop = 0;
        for (int y = 1; y < H - 1 && rtop + y - 1 < L.n; y++) {
            attron(L.attr[rtop + y - 1]);
            mvaddnstr(y, lw + 2, L.v[rtop + y - 1], -1);
            attroff(L.attr[rtop + y - 1]);
        }
        attron(A_DIM);
        mvaddnstr(H - 1, 0, msg, W - 1);
        attroff(A_DIM);
        refresh();

        ch = getch();
        msg = "n: next step   Enter: apply   u: undo   Tab: objects   +/−: change l   q: quit";
        if (ch == 'q' || ch == 'Q') break;
        if (ch == '\t') { focus_nodes = !focus_nodes; ncur = 0; continue; }
        if (ch == KEY_NPAGE) { rtop += H / 2; continue; }
        if (ch == KEY_PPAGE) { rtop -= H / 2; continue; }
        if (ch == KEY_DOWN || ch == 'j') {
            if (focus_nodes) { if (ncur + 1 < node_count(&x_steps[sel])) ncur++; }
            else if (sel + 1 < (int)x_steps_count) { sel++; rtop = 0; }
        } else if (ch == KEY_UP || ch == 'k') {
            if (focus_nodes) { if (ncur > 0) ncur--; }
            else if (sel > 0) { sel--; rtop = 0; }
        } else if (ch == '\n' || ch == KEY_ENTER) {
            if (s->done[sel]) msg = "that step is already done";
            else if (x_apply(s, sel)) msg = "not ready: an earlier step has to build its inputs first (press n for the next one)";
            else msg = "applied";
        } else if (ch == 'n') {
            int k = x_next(s);
            if (k < 0) msg = s->nhist == (int)x_steps_count ? "the tour is complete" : "the next tour step is not ready";
            else { x_apply(s, k); sel = k; rtop = 0; focus_nodes = 0; msg = "applied the next step of the tour"; }
        } else if (ch == 'u') {
            if (x_undo(s)) msg = "nothing to undo";
            else { sel = s->hist[s->nhist]; msg = "undone"; }
        } else if (ch == 'r') {
            x_config c = s->cfg;
            x_state_init(s, &c); sel = 0; rtop = 0;
            msg = "started again";
        } else if (ch == '+' || ch == '=' || ch == '-') {
            x_config c = s->cfg;
            int l = next_prime(c.l, ch == '-' ? -1 : 1);
            c.l = l;
            if (x_config_check(&c, NULL)) msg = "that l is not allowed with the bad places chosen";
            else { s->cfg.l = l; msg = "changed l; the objects built so far are kept, the facts are recomputed"; }
        }
    }
    endwin();
    clear_lines(&L);
    free(L.v); free(L.attr);
    return 0;
}
#endif
