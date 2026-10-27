/*
 * iut_main.c — command-line front end and self-tests.
 *
 *   iut gen       [data options] [--json]        generate initial Θ-data
 *   iut validate  [data options] [--json]        validate it (exit code = #errors)
 *   iut walk      [data options] [--rows R] [--horizontal lgp|LGP|gau|xmu|theta] [--json]
 *                                                 build the infinite H of the log-theta-lattice,
 *                                                 print Hodge theaters, alien copies, multiradial rep
 *   iut ids       [--js|--md|--json] [filter]    identifier table (letters-only ids)
 *   iut procs     [--md|--js|--json] [filter]    registry of processes (the ops layer, src/iut_ops_*.c)
 *   iut run       <id> [data options]            run one process on the data;  iut run --all [filter]
 *   iut selftest                                 run the built-in tests (data model + ops layer)
 *   iut tui       [data options]                 ncurses interface
 *
 * data options:  --abc A B C   --l L   --example K   --random SEED
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

static void usage(FILE *f)
{
    fprintf(f,
        "iut — data types of inter-universal Teichmüller theory\n\n"
        "usage: iut <command> [options]\n"
        "  gen        generate initial Θ-data            validate   validate it (exit = #errors)\n"
        "  walk       run it through the log-theta-lattice (infinite H), show Hodge theaters,\n"
        "             mutually alien copies, log-shells and the multiradial log-volume estimate\n"
        "  ids        identifier table: --js | --md | --json | [filter]\n"
        "  species    species / mutation tables           selftest   built-in tests\n"
        "  procs      registry of processes (ops layer): --md | --js | --json | [filter]\n"
        "  run        run a process: run <id> [data options]   or   run --all [filter] [data options]\n"
        "  tui        interactive ncurses interface\n"
        "data options: --abc A B C   --l L   --example K (0..5)   --random SEED\n"
        "walk options: --rows R (default 3)  --horizontal lgp|LGP|gau|xmu|theta  --json\n");
}

void iut_options_default(iut_options *o)
{
    memset(o, 0, sizeof *o);
    o->a = 1; o->b = 2400; o->c = 2401; o->l = 13; o->example = 2; o->seed = 2;
    o->horizontal = IUT_LINK_THETA_UNITSMODTORS_LGP; o->rows = 3;
}

int iut_options_parse(iut_options *o, int argc, char **argv, FILE *err)
{
    for (int i = 0; i < argc; ++i) {
        const char *a = argv[i];
        if (!strcmp(a, "--abc") && i + 3 < argc) { o->a = atol(argv[i + 1]); o->b = atol(argv[i + 2]); o->c = atol(argv[i + 3]); o->have_abc = 1; i += 3; }
        else if (!strcmp(a, "--l") && i + 1 < argc) { o->l = (unsigned)atoi(argv[++i]); }
        else if (!strcmp(a, "--example") && i + 1 < argc) { o->example = atoi(argv[++i]); o->have_example = 1; }
        else if (!strcmp(a, "--random") && i + 1 < argc) { o->seed = (unsigned)atoi(argv[++i]); o->have_seed = 1; }
        else if (!strcmp(a, "--rows") && i + 1 < argc) { o->rows = atoi(argv[++i]); if (o->rows < 1) o->rows = 1; if (o->rows > IUT_LAT_MOFF) o->rows = IUT_LAT_MOFF; }
        else if (!strcmp(a, "--json")) o->json = 1;
        else if (!strcmp(a, "--horizontal") && i + 1 < argc) {
            const char *h = argv[++i];
            if (!strcmp(h, "theta")) o->horizontal = IUT_LINK_THETA;
            else if (!strcmp(h, "xmu")) o->horizontal = IUT_LINK_THETA_UNITSMODTORS;
            else if (!strcmp(h, "gau")) o->horizontal = IUT_LINK_THETA_UNITSMODTORS_GAU;
            else if (!strcmp(h, "LGP")) o->horizontal = IUT_LINK_THETA_UNITSMODTORS_LGP;
            else if (!strcmp(h, "lgp")) o->horizontal = IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL;
            else { fprintf(err, "unknown --horizontal %s\n", h); return -1; }
        }
        else if (a[0] == '-' && a[1] == '-') { fprintf(err, "unknown option %s\n", a); return -1; }
    }
    return 0;
}

int iut_options_make_data(const iut_options *o, iut_initial_theta_data *d, FILE *err)
{
    int rc;
    if (o->have_abc) rc = iut_gen_from_abc(d, o->a, o->b, o->c, o->l);
    else if (o->have_seed) rc = iut_gen_random(d, o->seed);
    else rc = iut_gen_example(d, o->example);
    if (rc) fprintf(err, "could not generate initial Θ-data (code %d): need a+b=c coprime positive, l prime ≥ 5 (≤ %d)\n", rc, IUT_MAX_L);
    return rc;
}

static int cmd_gen(const iut_options *o)
{
    iut_initial_theta_data d;
    if (iut_options_make_data(o, &d, stderr)) return 2;
    if (o->json) iut_json_data(stdout, &d); else iut_view_data(stdout, &d);
    return 0;
}

static int cmd_validate(const iut_options *o)
{
    iut_initial_theta_data d; iut_report r; memset(&r, 0, sizeof r);
    if (iut_options_make_data(o, &d, stderr)) return 2;
    iut_validate_data(&d, &r);
    unsigned ctr = 0;
    iut_hodge_theater *ht = iut_hodge_theater_new(&d, 0, 0, &ctr);
    if (ht) { iut_validate_hodge_theater(ht, &r); iut_hodge_theater_free(ht); }
    if (o->json) iut_json_report(stdout, &r); else { iut_view_data(stdout, &d); fputc('\n', stdout); iut_view_report(stdout, &r); }
    return (int)(r.errors > 125 ? 125 : r.errors);
}

static int cmd_walk(const iut_options *o)
{
    iut_initial_theta_data d;
    if (iut_options_make_data(o, &d, stderr)) return 2;
    iut_log_theta_lattice *lat = calloc(1, sizeof *lat);
    iut_lattice_init(lat, &d, o->horizontal);
    iut_lattice_build_H(lat, 0, -o->rows, o->rows);
    iut_report r; memset(&r, 0, sizeof r);
    iut_validate_data(&lat->data, &r);
    iut_validate_lattice(lat, &r);
    iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
    if (o->json) { iut_json_lattice(stdout, lat); }
    else {
        iut_view_data(stdout, &lat->data); fputc('\n', stdout);
        iut_view_lattice(stdout, lat); fputc('\n', stdout);
        iut_view_hodge_theater(stdout, iut_lattice_get(lat, 0, 0)); fputc('\n', stdout);
        iut_view_hodge_theater(stdout, iut_lattice_get(lat, 0, 1)); fputc('\n', stdout);
        iut_view_alien(stdout, lat, 0, 0); fputc('\n', stdout);
        iut_view_multiradial(stdout, &rep, &lat->data); fputc('\n', stdout);
        iut_view_etale_picture(stdout, lat); fputc('\n', stdout);
        iut_view_report(stdout, &r);
    }
    int errs = (int)r.errors;
    iut_lattice_free(lat); free(lat);
    return errs ? 1 : 0;
}

static int cmd_ids(int argc, char **argv)
{
    const char *filter = NULL; int js = 0, md = 0, json = 0;
    for (int i = 0; i < argc; ++i) {
        if (!strcmp(argv[i], "--js")) js = 1; else if (!strcmp(argv[i], "--md")) md = 1; else if (!strcmp(argv[i], "--json")) json = 1; else filter = argv[i];
    }
    if (iut_ident_table_check(stderr)) { fprintf(stderr, "identifier table is INVALID\n"); return 3; }
    if (js) iut_js_idents(stdout); else if (md) iut_md_idents(stdout); else if (json) iut_json_idents(stdout); else iut_view_idents(stdout, filter);
    return 0;
}

/* ------------------------------------------------------------------ selftest */
static int fails;
#define CHECK(cond, ...) do { if (cond) { fprintf(out, "  ok   " __VA_ARGS__); fputc('\n', out); } else { fails++; fprintf(out, "  FAIL " __VA_ARGS__); fputc('\n', out); } } while (0)

int iut_selftest(FILE *out)
{
    fails = 0;
    fprintf(out, "iut selftest\n");
    /* identifiers */
    CHECK(iut_ident_table_check(out) == 0, "identifier table: %zu ids, all ^[A-Za-z]+$ and case-insensitively unique", iut_idents_count);
    CHECK(iut_ident_is_valid("ThetaPmEllNFHodgeTheater") && !iut_ident_is_valid("Theta_Pm") && !iut_ident_is_valid("F2") && !iut_ident_is_valid("Θ") && !iut_ident_is_valid(""), "identifier syntax");
    CHECK(iut_ident_find("fmonoglobtriangle") && !strcmp(iut_ident_find("fmonoglobtriangle")->notation, "F⊩_Δ"), "lookup is case-insensitive: FMonoGlobTriangle ↔ F⊩_Δ");
    CHECK(iut_ident_by_notation("‡") && !strcmp(iut_ident_by_notation("‡")->id, "Ddag"), "notation lookup: ‡ ↔ Ddag");
    for (int k = 0; k < IUT_PS_KIND_COUNT; ++k) CHECK(iut_ident_find(iut_ps_kind_id((iut_ps_kind)k)) != NULL, "prime-strip kind %s is in the table", iut_ps_kind_id((iut_ps_kind)k));
    for (int k = 0; k < IUT_LINK_KIND_COUNT; ++k) CHECK(iut_ident_find(iut_link_kind_id((iut_link_kind)k)) != NULL, "link kind %s is in the table", iut_link_kind_id((iut_link_kind)k));
    for (size_t k = 0; k < iut_mutation_count; ++k) {
        int ok = 0;
        for (size_t s = 0; s < iut_species_count; ++s) if (!strcmp(iut_species_table[s].id, iut_mutation_table[k].dom)) ok++;
        for (size_t s = 0; s < iut_species_count; ++s) if (!strcmp(iut_species_table[s].id, iut_mutation_table[k].cod)) ok++;
        CHECK(ok == 2, "mutation %s has species endpoints", iut_mutation_table[k].id);
    }
    /* rationals */
    { iut_q a = iut_q_make(2, 4), b = iut_q_make(-1, 3); char buf[32];
      CHECK(a.num == 1 && a.den == 2, "rational normalisation 2/4 = 1/2");
      iut_q_fmt(iut_q_add(a, b), buf, sizeof buf); CHECK(!strcmp(buf, "1/6"), "1/2 + (-1/3) = %s", buf);
      CHECK(iut_q_cmp(iut_q_mul(a, b), iut_q_make(-1, 6)) == 0, "1/2 · (-1/3) = -1/6"); }
    /* labels and symmetries */
    { iut_initial_theta_data d; iut_gen_example(&d, 0); /* l = 7 */
      CHECK(d.l == 7 && d.lstar == 3 && d.lpm == 4, "l = 7 ⇒ l* = 3, l± = 4");
      CHECK(iut_label_in_Fl(&d, -3) && iut_label_in_Fl(&d, 3) && !iut_label_in_Fl(&d, 4), "F_l = {-3..3}");
      CHECK(iut_label_in_FlStar(&d, 1) && !iut_label_in_FlStar(&d, 0) && iut_label_in_FlAbs(&d, 0), "F_l^* = {1..3}, |F_l| = {0..3}");
      CHECK(iut_sym_FlSemiPm_act(&d, 1, -1, 3) == -2, "F_l^{⋊±}: t ↦ −t + 1 sends 3 ↦ −2");
      CHECK(iut_sym_FlSemiPm_act(&d, 3, 1, 3) == -1, "F_l^{⋊±}: 3 + 3 = 6 ≡ −1");
      CHECK(iut_sym_FlStar_act(&d, 2, 3) == 1, "F_l^*: 2·3 = 6 ≡ −1 ↦ |−1| = 1");
      CHECK(iut_sym_FlStar_act(&d, 3, 2) == 1, "F_l^*: 3·2 = 6 ↦ 1"); }
    /* generators + validators */
    for (int k = 0; k <= 5; ++k) {
        iut_initial_theta_data d; iut_report r; memset(&r, 0, sizeof r);
        int rc = iut_gen_example(&d, k);
        CHECK(rc == 0, "example %d generates (%s)", k, d.name);
        int e = iut_validate_data(&d, &r);
        CHECK(e == 0, "example %d validates with %d error(s), %u warning(s)", k, e, r.warnings);
        CHECK(iut_log_q(&d) > 0 && iut_log_cond(&d) > 0, "example %d: log(q) = %.3f > 0, log(f) = %.3f > 0", k, iut_log_q(&d), iut_log_cond(&d));
    }
    { iut_initial_theta_data d;
      CHECK(iut_gen_from_abc(&d, 1, 2, 4, 7) != 0, "rejects a+b≠c");
      CHECK(iut_gen_from_abc(&d, 2, 4, 6, 7) != 0, "rejects non-coprime abc");
      CHECK(iut_gen_from_abc(&d, 1, 8, 9, 9) != 0, "rejects composite l");
      CHECK(iut_gen_from_abc(&d, 1, 8, 9, 3) != 0, "rejects l < 5");
      iut_gen_from_abc(&d, 1, 8, 9, 7);
      int v2 = -1, v3 = -1; for (unsigned i = 0; i < d.nV; ++i) { if (d.V[i].p == 2) v2 = i; if (d.V[i].p == 3) v3 = i; }
      CHECK(v3 >= 0 && d.V[v3].red == IUT_RED_BAD_MULT && d.V[v3].ordq == 4 && d.V[v3].in_Vbad_mod, "Frey(1,8,9): ord_3(q) = 2·ord_3(abc) = 4, 3 ∈ V^bad_mod");
      CHECK(v2 >= 0 && d.V[v2].red == IUT_RED_BAD_ADD && !d.V[v2].in_Vbad_mod, "Frey(1,8,9): 2^3 ∥ abc ⇒ additive at 2, 2 ∉ V^bad_mod");
      iut_report r;
      iut_gen_from_abc(&d, 1, 80, 81, 7);
      for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].p == 2) v2 = i;
      CHECK(d.V[v2].red == IUT_RED_GOOD && d.V[v2].ordq == 0 && !d.V[v2].in_Vbad_mod, "Frey(1,80,81): 2^4 ∥ abc ⇒ Δ_min odd ⇒ good reduction at 2");
      iut_gen_from_abc(&d, 1, 80, 81, 5); memset(&r, 0, sizeof r);
      CHECK(iut_validate_data(&d, &r) > 0, "l = 5 is rejected: F ⊇ Q(E[5]) makes [F:F_mod] divisible by l");
      /* a broken datum */
      iut_gen_from_abc(&d, 1, 2400, 2401, 13);
      for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].red == IUT_RED_BAD_MULT && d.V[i].p % 2) d.V[i].red = IUT_RED_GOOD;
      iut_data_finish(&d); memset(&r, 0, sizeof r);
      CHECK(iut_validate_data(&d, &r) > 0, "validator rejects empty V^bad_mod"); }
    /* prime-strips */
    { iut_initial_theta_data d; iut_gen_example(&d, 2); iut_prime_strip ps, q; iut_report r;
      unsigned sq[] = { 1, 4, 9, 16, 25, 36 };
      iut_prime_strip_build(&ps, IUT_PS_FMonoGlobValUnitsModTors, "test", &d, 5, sq, 6);
      memset(&r, 0, sizeof r); CHECK(iut_validate_prime_strip(&ps, &d, &r) == 0, "F⊩▶×μ-prime-strip builds and validates");
      CHECK(ps.global_degree < 0, "pilot object has negative arithmetic degree (%.3f)", ps.global_degree);
      iut_prime_strip_forget(&q, &ps, IUT_PS_FMonoUnitsModTors);
      memset(&r, 0, sizeof r); CHECK(iut_validate_prime_strip(&q, &d, &r) == 0 && !q.has_global_realified && !q.loc[0].has_valgroup, "forget F⊩▶×μ → F⊢×μ drops C⊩ and O▶");
      iut_prime_strip_forget(&q, &ps, IUT_PS_DMono);
      memset(&r, 0, sizeof r); CHECK(iut_validate_prime_strip(&q, &d, &r) == 0 && q.loc[0].units_copy == 0 && q.loc[0].Pi_copy == 0, "forget → D⊢ keeps only G_v");
      iut_prime_strip_build(&ps, IUT_PS_F, "hol", &d, 6, NULL, 0);
      iut_prime_strip_forget(&q, &ps, IUT_PS_D);
      memset(&r, 0, sizeof r); CHECK(iut_validate_prime_strip(&q, &d, &r) == 0 && q.loc[0].Pi_copy != 0, "forget F → D keeps Π_v");
      q = ps; q.loc[0].Pi_copy = 0; memset(&r, 0, sizeof r); CHECK(iut_validate_prime_strip(&q, &d, &r) > 0, "validator rejects F-prime-strip without Π_v");
      CHECK(iut_vertically_coric(IUT_PS_D) && iut_horizontally_coric(IUT_PS_FMonoUnitsModTors) && iut_bi_coric(IUT_PS_DMono) && !iut_bi_coric(IUT_PS_F), "coricity table ([IUTchIII] Thm 1.5)"); }
    /* Hodge theaters */
    { iut_initial_theta_data d; iut_gen_example(&d, 2); unsigned ctr = 0; iut_report r; memset(&r, 0, sizeof r);
      iut_hodge_theater *ht = iut_hodge_theater_new(&d, 0, 0, &ctr);
      CHECK(ht && iut_validate_hodge_theater(ht, &r) == 0, "Θ±ell NF-Hodge theater validates (%u checks)", r.n);
      CHECK(ht->pmell.nT == 13 && ht->nf.nJ == 6, "capsules: |F_T| = l = 13, |F_J| = l* = 6");
      CHECK(ht->theta_pilot.exps[5] == 36 && ht->q_pilot.exps[0] == 1, "pilots: Θ-pilot exps j², q-pilot exp 1");
      CHECK(fabs(ht->theta_pilot.log_volume / ht->q_pilot.log_volume - 13.0 * 14 / 12) < 1e-9, "naive Θ-pilot volume = l(l+1)/12 · q-pilot volume");
      ht->pmell.T[2].basepoint = ht->pmell.T[3].basepoint; memset(&r, 0, sizeof r);
      CHECK(iut_validate_hodge_theater(ht, &r) > 0, "validator rejects shared basepoints in the F_l-capsule");
      ht->pmell.T[2].basepoint = 99999; ht->glued = 0; memset(&r, 0, sizeof r);
      CHECK(iut_validate_hodge_theater(ht, &r) > 0, "validator rejects an unglued Hodge theater");
      iut_hodge_theater_free(ht); }
    /* lattice */
    { iut_initial_theta_data d; iut_gen_example(&d, 1);
      iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_report r; memset(&r, 0, sizeof r);
      iut_lattice_init(lat, &d, IUT_LINK_THETA_UNITSMODTORS_LGP);
      iut_lattice_build_H(lat, 0, -2, 2);
      CHECK(lat->next_universe == 10 && lat->nlinks == 9, "infinite H: 2 columns × 5 rows = %u vertices, %u links (8 log + 1 Θ)", lat->next_universe, lat->nlinks);
      CHECK(iut_validate_lattice(lat, &r) == 0, "lattice validates (%u errors)", r.errors);
      iut_hodge_theater *a = iut_lattice_get(lat, 0, 0), *b = iut_lattice_get(lat, 0, 1), *c = iut_lattice_get(lat, 1, 0);
      CHECK(a->nf.FGt.loc[0].Pi_copy == b->nf.FGt.loc[0].Pi_copy, "log-link: Π_v shared along the column (vertical coricity)");
      CHECK(a->FMonoGlobLGP.loc[0].units_copy != b->FMonoGlobLGP.loc[0].units_copy, "log-link: Frobenius-like units NOT shared along the column");
      CHECK(a->FMonoGlobLGP.loc[0].units_copy == c->FMonoGlobTriangle.loc[0].units_copy, "Θ-link: O×μ shared across the link (horizontal coricity)");
      CHECK(a->nf.FGt.loc[0].Pi_copy != c->nf.FGt.loc[0].Pi_copy, "Θ-link: Π_v NOT shared (mutually alien copies)");
      CHECK(b->has_incoming_log && b->nshell == d.nV && !iut_lattice_get(lat, 0, -2)->has_incoming_log, "log-shells appear exactly in log-link codomains");
      int v3 = -1; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].p == 3) v3 = i;
      CHECK(v3 >= 0 && b->shell[v3].radius.num == 0 && fabs(b->shell[v3].log_volume - 0.0) < 1e-9, "log-shell at unramified odd p: I_v = O_v, μ_log = 0");
      int v2 = -1; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].p == 2) v2 = i;
      CHECK(v2 >= 0 && fabs(b->shell[v2].log_volume - (2.0 - 2.0) * log(2.0)) < 1e-9, "log-shell at p=2: p* = 4, μ_log(I_2) = (2 − 1 − 1) log 2 = 0");
      iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
      CHECK(rep.nsteps == d.lstar + 1 && rep.step[3].perms == 24 && rep.step[3].size == 4, "processions S^±_{j+1}: |S^±_4| = 4, 4! = 24 (Ind1)");
      CHECK(rep.leading_term > 0.5 * iut_leading_term(&d) && rep.leading_term < 2.0 * iut_leading_term(&d), "leading term sum %.3f ≈ (l²/48)(6 log d^K − log q) = %.3f (asymptotic in l)", rep.leading_term, iut_leading_term(&d));
      CHECK(rep.inequality_holds, "−|log Θ| ≥ −|log q| holds (C_Θ = %.3g ≥ −1)", rep.C_theta);
      const iut_link *tl = iut_apply_theta_link(lat, 0, 1);
      CHECK(tl && lat->nlinks == 10, "a second Θ-link can be added on row 1 (full lattice, not just the H)");
      memset(&r, 0, sizeof r); iut_validate_lattice(lat, &r);
      int infoH = 0; for (unsigned i = 0; i < r.n; ++i) if (!strcmp(r.issue[i].condition, "LogThetaLattice") && r.issue[i].sev == IUT_SEV_INFO) infoH++;
      CHECK(r.errors == 0 && infoH >= 1, "lattice with two Θ-links still validates");
      iut_lattice_free(lat); free(lat); }
    /* lgp variant and Θ-link variant */
    { iut_initial_theta_data d; iut_gen_example(&d, 3);
      iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_report r;
      iut_lattice_init(lat, &d, IUT_LINK_THETA); iut_lattice_build_H(lat, 0, 0, 1);
      memset(&r, 0, sizeof r); CHECK(iut_validate_lattice(lat, &r) == 0, "plain Θ-link lattice validates");
      iut_lattice_free(lat);
      iut_lattice_init(lat, &d, IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL); iut_lattice_build_H(lat, 0, 0, 1);
      memset(&r, 0, sizeof r); CHECK(iut_validate_lattice(lat, &r) == 0, "lgp-Gaussian lattice validates");
      iut_lattice_free(lat); free(lat); }
    /* JSON smoke test */
    { iut_initial_theta_data d; iut_gen_example(&d, 0);
      char *buf = NULL; size_t n = 0; FILE *m = open_memstream(&buf, &n);
      iut_json_data(m, &d); fclose(m);
      CHECK(buf && n > 100 && buf[0] == '{' && strstr(buf, "\"VSet\""), "JSON export of initial Θ-data (%zu bytes)", n);
      free(buf); }
    fprintf(out, "%s: %d failure(s)\n", fails ? "FAILED" : "PASSED", fails);
    int ops = iut_selftest_ops(out);
    return fails + ops;
}

int main(int argc, char **argv)
{
    if (argc < 2) { usage(stdout); return 0; }
    const char *cmd = argv[1];
    iut_options o; iut_options_default(&o);
    if (!strcmp(cmd, "ids")) return cmd_ids(argc - 2, argv + 2);
    if (!strcmp(cmd, "species")) { iut_view_species(stdout); return 0; }
    if (!strcmp(cmd, "selftest")) return iut_selftest(stdout) ? 1 : 0;
    if (!strcmp(cmd, "procs")) {
        const char *filter = NULL; int md = 0, js = 0, json = 0;
        for (int i = 2; i < argc; ++i) { if (!strcmp(argv[i], "--md")) md = 1; else if (!strcmp(argv[i], "--js")) js = 1; else if (!strcmp(argv[i], "--json")) json = 1; else filter = argv[i]; }
        if (md) iut_md_processes(stdout); else if (json) iut_json_processes(stdout);
        else if (js) { fputs("// generated by `iut procs --js` from src/iut_proc.c — do not edit\n(function (root) { 'use strict'; var PROCESSES = ", stdout); iut_json_processes(stdout); fputs(";\n  var API = { PROCESSES: PROCESSES, find: function (id) { id = String(id).toLowerCase(); for (var i = 0; i < PROCESSES.length; i++) if (PROCESSES[i].id.toLowerCase() === id) return PROCESSES[i]; return null; } };\n  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.PROCLIST = API;\n})(typeof window !== 'undefined' ? window : this);\n", stdout); }
        else iut_view_processes(stdout, filter);
        return 0;
    }
    if (!strcmp(cmd, "run")) {
        if (argc < 3) { fprintf(stderr, "usage: iut run <id> [data options] | iut run --all [filter] [data options]\n"); return 2; }
        const char *id = argv[2]; const char *filter = NULL; int first = 3;
        if (!strcmp(id, "--all") && argc > 3 && argv[3][0] != '-') { filter = argv[3]; first = 4; }
        if (iut_options_parse(&o, argc - first, argv + first, stderr)) { usage(stderr); return 2; }
        iut_initial_theta_data d; if (iut_options_make_data(&o, &d, stderr)) return 2;
        if (!strcmp(id, "--all")) return iut_process_run_all(&d, stdout, filter) ? 1 : 0;
        const iut_process *p = iut_process_find(id);
        if (!p) { fprintf(stderr, "unknown process '%s' (see `iut procs`)\n", id); return 2; }
        return iut_process_run(p, &d, stdout) ? 1 : 0;
    }
    if (!strcmp(cmd, "help") || !strcmp(cmd, "--help") || !strcmp(cmd, "-h")) { usage(stdout); return 0; }
    if (iut_options_parse(&o, argc - 2, argv + 2, stderr)) { usage(stderr); return 2; }
    if (!strcmp(cmd, "gen")) return cmd_gen(&o);
    if (!strcmp(cmd, "validate")) return cmd_validate(&o);
    if (!strcmp(cmd, "walk")) return cmd_walk(&o);
    if (!strcmp(cmd, "tui")) return iut_tui_main(&o);
    fprintf(stderr, "unknown command '%s'\n", cmd); usage(stderr);
    return 2;
}
