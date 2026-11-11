/*
 * main.c — the command line of the guided IUT explorer.
 *
 *   iutx                 the interactive terminal program (same as `iutx tui`)
 *   iutx tour            the whole guided tour as a transcript
 *   iutx step <Id>       one step of the tour
 *   iutx node <Id>       one object
 *   iutx nodes [word]    the objects, optionally filtered
 *   iutx facts [view]    the computed facts
 *   iutx check           self-check of the model
 *   iutx ids             the node identifiers against src/iut_ids.c
 *   iutx json model      the model as JSON (for ../web/data.js)
 *   iutx json facts      the facts as JSON (for the cross-check with the JS port)
 *
 * Options, anywhere: --l L   --bad 3,11   --good 2,5,7
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "iutx.h"
#include "../../src/iut.h"

/* ------------------------------------------------------------------ JSON */

void x_json_string(FILE *f, const char *s)
{
    fputc('"', f);
    for (; *s; s++) {
        unsigned char ch = (unsigned char)*s;
        if (ch == '"' || ch == '\\') { fputc('\\', f); fputc(ch, f); }
        else if (ch == '\n') fputs("\\n", f);
        else if (ch == '\t') fputs("\\t", f);
        else if (ch < 0x20) fprintf(f, "\\u%04x", ch);
        else fputc(ch, f);
    }
    fputc('"', f);
}

static void json_list(FILE *f, const char *list)
{
    char tok[96];
    const char *p = list;
    int first = 1;
    fputc('[', f);
    while (x_next_token(&p, tok, sizeof tok)) {
        if (!first) fputc(',', f);
        x_json_string(f, tok);
        first = 0;
    }
    fputc(']', f);
}

static void json_field(FILE *f, const char *k, const char *v, int comma)
{
    x_json_string(f, k); fputc(':', f); x_json_string(f, v);
    if (comma) fputc(',', f);
}

void x_json_model(FILE *f)
{
    fputs("{\n\"source\":\"[IUTchI] S. Mochizuki, Inter-universal Teichmüller Theory I\",\n\"lmax\":", f);
    fprintf(f, "%d,\n\"acts\":[\n", X_L_MAX);
    for (size_t i = 0; i < x_acts_count; i++) {
        fputs(" {", f);
        json_field(f, "title", x_acts[i].title, 1);
        json_field(f, "ref", x_acts[i].ref, 1);
        json_field(f, "intro", x_acts[i].intro, 0);
        fprintf(f, "}%s\n", i + 1 < x_acts_count ? "," : "");
    }
    fputs("],\n\"nodes\":[\n", f);
    for (size_t i = 0; i < x_nodes_count; i++) {
        const x_node *n = &x_nodes[i];
        fputs(" {", f);
        json_field(f, "id", n->id, 1);
        json_field(f, "notation", n->notation, 1);
        json_field(f, "kind", n->kind, 1);
        x_json_string(f, "tags"); fputc(':', f); json_list(f, n->tags); fputc(',', f);
        json_field(f, "ref", n->ref, 1);
        json_field(f, "brief", n->brief, 1);
        x_json_string(f, "parts"); fputc(':', f); json_list(f, n->parts);
        fprintf(f, "}%s\n", i + 1 < x_nodes_count ? "," : "");
    }
    fputs("],\n\"steps\":[\n", f);
    for (size_t i = 0; i < x_steps_count; i++) {
        const x_step *s = &x_steps[i];
        fputs(" {", f);
        json_field(f, "id", s->id, 1);
        fprintf(f, "\"act\":%d,", s->act);
        json_field(f, "title", s->title, 1);
        json_field(f, "ref", s->ref, 1);
        x_json_string(f, "in"); fputc(':', f); json_list(f, s->in); fputc(',', f);
        x_json_string(f, "out"); fputc(':', f); json_list(f, s->out); fputc(',', f);
        json_field(f, "does", s->does, 1);
        json_field(f, "watch", s->watch, 1);
        json_field(f, "fact", s->fact, 1);
        json_field(f, "picture", s->picture, 0);
        fprintf(f, "}%s\n", i + 1 < x_steps_count ? "," : "");
    }
    fputs("]\n}\n", f);
}

static void json_fact_lines(FILE *f, const char *text)
{
    const char *p = text ? text : "";
    int first = 1;
    fputc('[', f);
    while (*p) {
        const char *tab = strchr(p, '\t'), *nl = strchr(p, '\n');
        char k[512], v[1200];
        if (!tab || !nl || tab > nl) break;
        snprintf(k, sizeof k, "%.*s", (int)(tab - p), p);
        snprintf(v, sizeof v, "%.*s", (int)(nl - tab - 1), tab + 1);
        if (!first) fputc(',', f);
        fputs("\n  [", f); x_json_string(f, k); fputc(',', f); x_json_string(f, v); fputc(']', f);
        first = 0;
        p = nl + 1;
    }
    fputc(']', f);
}

void x_json_facts(FILE *f, const x_config *c)
{
    fputs("{", f);
    for (size_t i = 0; i < x_fact_views_count; i++) {
        x_buf b;
        x_buf_init(&b);
        x_facts(c, x_fact_views[i], &b);
        fputs(i ? ",\n " : "\n ", f);
        x_json_string(f, x_fact_views[i]); fputc(':', f);
        json_fact_lines(f, b.s);
        x_buf_free(&b);
    }
    fputs("\n}\n", f);
}

/* ------------------------------------------------------------ plain text */

static void wrap(FILE *f, const char *indent, const char *text, int width)
{
    /* wrap on spaces, counting UTF-8 characters, not bytes */
    const char *p = text;
    int col = 0;
    fputs(indent, f);
    while (*p) {
        const char *q = p;
        int w = 0;
        while (*q && *q != ' ') { if (((unsigned char)*q & 0xC0) != 0x80) w++; q++; }
        if (col && col + 1 + w > width) { fprintf(f, "\n%s", indent); col = 0; }
        if (col) { fputc(' ', f); col++; }
        fwrite(p, 1, (size_t)(q - p), f);
        col += w;
        p = q;
        while (*p == ' ') p++;
    }
    fputc('\n', f);
}

static void print_facts(FILE *f, const x_config *c, const char *view)
{
    x_buf b;
    const char *p;
    x_buf_init(&b);
    if (x_facts(c, view, &b) || !b.s) { x_buf_free(&b); return; }
    for (p = b.s; *p; ) {
        const char *tab = strchr(p, '\t'), *nl = strchr(p, '\n');
        if (!tab || !nl) break;
        fprintf(f, "      %.*s: %.*s\n", (int)(tab - p), p, (int)(nl - tab - 1), tab + 1);
        p = nl + 1;
    }
    x_buf_free(&b);
}

static void print_node(FILE *f, const x_node *n)
{
    fprintf(f, "%s   %s\n", n->id, n->notation);
    fprintf(f, "  [IUTchI] %s   kind: %s   %s\n", n->ref, n->kind, n->tags);
    wrap(f, "  ", n->brief, 96);
    if (*n->parts) fprintf(f, "  made of / uses: %s\n", n->parts);
}

static void print_node_list(FILE *f, const char *label, const char *list)
{
    char tok[96];
    const char *p = list;
    if (!*list) { fprintf(f, "    %s: nothing\n", label); return; }
    fprintf(f, "    %s:\n", label);
    while (x_next_token(&p, tok, sizeof tok)) {
        int k = x_node_index(tok);
        fprintf(f, "      %-28s %s\n", tok, k >= 0 ? x_nodes[k].notation : "?");
    }
}

static void print_step(FILE *f, const x_config *c, int i)
{
    const x_step *s = &x_steps[i];
    fprintf(f, "  Step %d. %s   (%s)   [IUTchI] %s\n", i + 1, s->title, s->id, s->ref);
    wrap(f, "    ", s->does, 94);
    print_node_list(f, "needs", s->in);
    print_node_list(f, "builds", s->out);
    fprintf(f, "    what to notice:\n");
    wrap(f, "      ", s->watch, 92);
    if (*s->fact) {
        fprintf(f, "    computed for l = %d (%s):\n", c->l, s->fact);
        print_facts(f, c, s->fact);
    }
    fputc('\n', f);
}

static int cmd_tour(const x_config *c)
{
    x_state st;
    int act = -1;
    x_state_init(&st, c);
    printf("A guided walk through [IUTchI], with l = %d.\n\n", c->l);
    for (size_t i = 0; i < x_steps_count; i++) {
        if (x_steps[i].act != act) {
            act = x_steps[i].act;
            printf("== Act %d. %s   [IUTchI] %s\n", act + 1, x_acts[act].title, x_acts[act].ref);
            wrap(stdout, "   ", x_acts[act].intro, 96);
            fputc('\n', stdout);
        }
        if (x_apply(&st, (int)i)) {
            char miss[512];
            x_step_missing(&st, (int)i, miss, sizeof miss);
            printf("cannot apply %s: missing %s\n", x_steps[i].id, miss);
            return 1;
        }
        print_step(stdout, c, (int)i);
    }
    {
        int built = 0;
        for (size_t i = 0; i < x_nodes_count; i++) built += st.built[i];
        printf("Built %d objects in %d steps.\n", built, st.nhist);
    }
    return 0;
}

static int contains_nocase(const char *hay, const char *needle)
{
    size_t n = strlen(needle);
    if (!n) return 1;
    for (; *hay; hay++) {
        size_t i = 0;
        while (i < n && hay[i] && (hay[i] | 32) == (needle[i] | 32)) i++;
        if (i == n) return 1;
    }
    return 0;
}

void x_model_ids_report(FILE *out)
{
    int known = 0, fresh = 0;
    for (size_t i = 0; i < x_nodes_count; i++) {
        const iut_ident *e = iut_ident_find(x_nodes[i].id);
        if (e) known++; else fresh++;
        fprintf(out, "%-28s %-9s %s\n", x_nodes[i].id, e ? "in table" : "new here", x_nodes[i].notation);
    }
    fprintf(out, "%d identifiers are in src/iut_ids.c, %d are new here.\n", known, fresh);
}

static void usage(void)
{
    puts("iutx: a guided explorer for the constructions of Inter-universal Teichmüller Theory I\n"
         "\n"
         "  iutx [tui]           the interactive terminal program\n"
         "  iutx tour            the whole guided tour as a transcript\n"
         "  iutx step <Id>       one step        iutx node <Id>     one object\n"
         "  iutx nodes [word]    the objects     iutx facts [view]  the computed facts\n"
         "  iutx check           self-check      iutx ids           identifiers vs src/iut_ids.c\n"
         "  iutx json model|facts\n"
         "\n"
         "  options: --l L  --bad 3,11  --good 2,5,7");
}

int main(int argc, char **argv)
{
    x_config cfg;
    const char *args[8];
    const char *bad = "11", *good = "2,3,5";
    int nargs = 0, l = 7;

    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "--l") && i + 1 < argc) l = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--bad") && i + 1 < argc) bad = argv[++i];
        else if (!strcmp(argv[i], "--good") && i + 1 < argc) good = argv[++i];
        else if (!strcmp(argv[i], "--help") || !strcmp(argv[i], "-h")) { usage(); return 0; }
        else if (nargs < 8) args[nargs++] = argv[i];
    }
    if (x_config_set(&cfg, l, bad, good)) { fprintf(stderr, "iutx: cannot read the list of places\n"); return 2; }

    if (nargs && !strcmp(args[0], "check")) {
        int bad_n = x_model_check(stderr);
        printf("model: %zu objects, %zu steps, %zu acts, %zu fact views: %s\n", x_nodes_count, x_steps_count,
               x_acts_count, x_fact_views_count, bad_n ? "PROBLEMS" : "consistent");
        return bad_n ? 1 : 0;
    }
    if (nargs && !strcmp(args[0], "ids")) { x_model_ids_report(stdout); return 0; }
    if (nargs >= 2 && !strcmp(args[0], "json") && !strcmp(args[1], "model")) { x_json_model(stdout); return 0; }

    {
        int n = x_config_check(&cfg, stderr);
        if (n) { fprintf(stderr, "iutx: %d condition%s of Def 3.1 fail%s\n", n, n > 1 ? "s" : "", n > 1 ? "" : "s"); return 2; }
    }

    if (nargs == 0 || !strcmp(args[0], "tui")) {
        x_state st;
        x_state_init(&st, &cfg);
        if (x_tui(&st)) { fprintf(stderr, "iutx: built without ncurses; try `iutx tour`\n"); return 2; }
        return 0;
    }
    if (!strcmp(args[0], "tour")) return cmd_tour(&cfg);
    if (!strcmp(args[0], "json") && nargs >= 2 && !strcmp(args[1], "facts")) { x_json_facts(stdout, &cfg); return 0; }
    if (!strcmp(args[0], "step") && nargs >= 2) {
        int i = x_step_index(args[1]);
        if (i < 0) { fprintf(stderr, "iutx: no step %s\n", args[1]); return 2; }
        print_step(stdout, &cfg, i);
        return 0;
    }
    if (!strcmp(args[0], "node") && nargs >= 2) {
        int i = x_node_index(args[1]);
        if (i < 0) { fprintf(stderr, "iutx: no object %s\n", args[1]); return 2; }
        print_node(stdout, &x_nodes[i]);
        for (size_t s = 0; s < x_steps_count; s++) {
            char tok[96];
            const char *p = x_steps[s].out;
            while (x_next_token(&p, tok, sizeof tok))
                if (!strcmp(tok, args[1])) printf("  built by step %zu: %s (%s)\n", s + 1, x_steps[s].title, x_steps[s].id);
            p = x_steps[s].in;
            while (x_next_token(&p, tok, sizeof tok))
                if (!strcmp(tok, args[1])) printf("  used by step %zu: %s (%s)\n", s + 1, x_steps[s].title, x_steps[s].id);
        }
        return 0;
    }
    if (!strcmp(args[0], "nodes")) {
        const char *w = nargs >= 2 ? args[1] : "";
        for (size_t i = 0; i < x_nodes_count; i++)
            if (contains_nocase(x_nodes[i].id, w) || contains_nocase(x_nodes[i].brief, w) || contains_nocase(x_nodes[i].kind, w))
                printf("%-28s %-11s %-18s %s\n", x_nodes[i].id, x_nodes[i].kind, x_nodes[i].ref, x_nodes[i].notation);
        return 0;
    }
    if (!strcmp(args[0], "facts")) {
        for (size_t i = 0; i < x_fact_views_count; i++) {
            if (nargs >= 2 && strcmp(args[1], x_fact_views[i])) continue;
            printf("%s\n", x_fact_views[i]);
            print_facts(stdout, &cfg, x_fact_views[i]);
        }
        return 0;
    }
    usage();
    return 2;
}
