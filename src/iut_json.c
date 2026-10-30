/*
 * iut_json.c — JSON dumps of every species, and the generated identifier
 * tables:  docs/IDENTIFIERS.md  (and `ids --json`, which the web app reads from the wasm build).
 */
#include <math.h>
#include <string.h>
#include "iut.h"

static void jstr(FILE *f, const char *s)
{
    fputc('"', f);
    for (const unsigned char *p = (const unsigned char *)s; *p; ++p) {
        switch (*p) {
        case '"': fputs("\\\"", f); break;
        case '\\': fputs("\\\\", f); break;
        case '\n': fputs("\\n", f); break;
        default: if (*p < 0x20) fprintf(f, "\\u%04x", *p); else fputc(*p, f);
        }
    }
    fputc('"', f);
}
static void ind(FILE *f, int n) { while (n-- > 0) fputc(' ', f); }
static void jnum(FILE *f, double x)
{
    if (isinf(x)) fputs(x > 0 ? "\"+inf\"" : "\"-inf\"", f);
    else if (isnan(x)) fputs("null", f);
    else fprintf(f, "%.10g", x);
}

void iut_json_data(FILE *f, const iut_initial_theta_data *d)
{
    fprintf(f, "{\n  \"species\": \"InitialThetaData\",\n  \"name\": "); jstr(f, d->name);
    fprintf(f, ",\n  \"curve\": "); jstr(f, d->curve);
    fprintf(f, ",\n  \"Fmod\": {\"id\": \"Fmod\", \"degree\": %u},\n  \"F\": {\"id\": \"FBarOverF\", \"degreeBound\": %llu, \"logDifferentTpd\": ", d->dmod, d->dF); jnum(f, d->logdF);
    fprintf(f, "},\n  \"K\": {\"id\": \"KField\", \"degreeBound\": %llu, \"logDifferentEstimate\": ", d->dK); jnum(f, d->logdK);
    fprintf(f, "},\n  \"l\": %u, \"LStar\": %u, \"LPm\": %u, \"EpsilonUnder\": %d,\n  \"jLogHeight\": ", d->l, d->lstar, d->lpm, d->epsilon); jnum(f, d->j_log_height);
    fprintf(f, ",\n  \"logQ\": "); jnum(f, iut_log_q(d));
    fprintf(f, ", \"AbsLogQ\": "); jnum(f, d->l ? iut_log_q(d) / (2.0 * d->l) : 0);
    fprintf(f, ", \"logF\": "); jnum(f, iut_log_cond(d));
    fprintf(f, ", \"HtE\": "); jnum(f, iut_height_from_q(d));
    fprintf(f, ",\n  \"hypotheses\": {\"FGaloisOverFmod\": %s, \"FContainsSixTorsion\": %s, \"ImageContainsSLTwo\": %s, \"StableReduction\": %s, \"CKIsKCore\": %s},\n",
            d->h_F_galois_over_Fmod ? "true" : "false", d->h_F_contains_six_torsion ? "true" : "false", d->h_image_contains_SL2 ? "true" : "false",
            d->h_stable_reduction ? "true" : "false", d->h_CK_is_K_core ? "true" : "false");
    fprintf(f, "  \"VSet\": [\n");
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        fprintf(f, "    {\"name\": \"%s\", \"kind\": \"%s\", \"p\": %u, \"eMod\": %u, \"fMod\": %u, \"eK\": %u, \"fK\": %u, \"reduction\": \"%s\", \"ordQ\": %u, \"inVBadMod\": %s}%s\n",
                v->name, v->kind == IUT_V_ARCH ? "VArc" : "VNon", v->p, v->e_mod, v->f_mod, v->e_K, v->f_K,
                v->red == IUT_RED_GOOD ? "good" : v->red == IUT_RED_BAD_MULT ? "badMultiplicative" : "badAdditive",
                v->ordq, v->in_Vbad_mod ? "true" : "false", i + 1 < d->nV ? "," : "");
    }
    fprintf(f, "  ]\n}\n");
}

void iut_json_prime_strip(FILE *f, const iut_prime_strip *ps, int in)
{
    ind(f, in); fprintf(f, "{\"species\": \"%s\", \"notation\": ", iut_ps_kind_id(ps->kind)); jstr(f, iut_ps_kind_notation(ps->kind));
    fprintf(f, ", \"label\": "); jstr(f, ps->label);
    fprintf(f, ", \"etaleLike\": %s, \"monoAnalytic\": %s, \"global\": %s",
            iut_ps_kind_is_etale_like(ps->kind) ? "true" : "false", iut_ps_kind_is_mono_analytic(ps->kind) ? "true" : "false", ps->has_global_realified ? "true" : "false");
    if (ps->has_global_realified) { fprintf(f, ", \"globalDegree\": "); jnum(f, ps->global_degree); }
    fprintf(f, ",\n"); ind(f, in); fprintf(f, " \"local\": [");
    for (unsigned i = 0; i < ps->nV; ++i) {
        const iut_local_datum *L = &ps->loc[i];
        fprintf(f, "%s{\"PiV\": %u, \"GV\": %u, \"units\": %u, \"unitsModTors\": %s, \"valGroup\": %s, \"split\": %s, \"kummer\": \"%s\", \"vals\": [",
                i ? ", " : "", L->Pi_copy, L->G_copy, L->units_copy, L->units_mod_tors ? "true" : "false", L->has_valgroup ? "true" : "false", L->has_splitting ? "true" : "false",
                L->kummer_kind == 2 ? "UnitsModTorsKummer" : L->kummer_kind == 1 ? "UnitsKummer" : "none");
        for (unsigned k = 0; k < L->nval; ++k) { char b[32]; iut_q_fmt(L->val[k], b, sizeof b); fprintf(f, "%s\"%s\"", k ? "," : "", b); }
        fprintf(f, "]}");
    }
    fprintf(f, "]}");
}

static void json_pilot(FILE *f, const iut_pilot *p, int in)
{
    ind(f, in); fprintf(f, "{\"species\": \"%s\", \"exponents\": [", p->kind == IUT_PILOT_Q ? "QPilot" : "ThetaPilot");
    for (unsigned j = 0; j < p->nj; ++j) fprintf(f, "%s%u", j ? "," : "", p->exps[j]);
    fprintf(f, "], \"logVolume\": "); jnum(f, p->log_volume); fprintf(f, "}");
}

void iut_json_hodge_theater(FILE *f, const iut_hodge_theater *ht, int in)
{
    const iut_initial_theta_data *d = ht->data;
    ind(f, in); fprintf(f, "{\"species\": \"ThetaPmEllNFHodgeTheater\", \"n\": %d, \"m\": %d, \"copy\": \"%s\", \"universe\": %u, \"glued\": %s, \"logIterate\": %d,\n",
                        ht->n, ht->m, ht->copy_label, ht->universe, ht->glued ? "true" : "false", ht->log_iterate);
    ind(f, in); fprintf(f, " \"ThetaPmEllHodgeTheater\": {\"symmetry\": \"FlSemiPm\", \"capsuleFT\": [");
    for (unsigned i = 0; i < ht->pmell.nT; ++i) fprintf(f, "%s{\"t\": %d, \"basepoint\": %u}", i ? "," : "", ht->pmell.T[i].label, ht->pmell.T[i].basepoint);
    fprintf(f, "],\n"); ind(f, in); fprintf(f, "  \"ThetaPmBridge\": %s, \"ThetaEllBridge\": %s,\n", ht->pmell.theta_pm_bridge_ok ? "true" : "false", ht->pmell.theta_ell_bridge_ok ? "true" : "false");
    ind(f, in); fprintf(f, "  \"FBoxPlus\":\n"); iut_json_prime_strip(f, &ht->pmell.FBoxPlus, in + 3); fprintf(f, ",\n");
    ind(f, in); fprintf(f, "  \"DCircDotPm\":\n"); iut_json_prime_strip(f, &ht->pmell.DCircDotPm, in + 3); fprintf(f, "},\n");
    ind(f, in); fprintf(f, " \"ThetaNFHodgeTheater\": {\"symmetry\": \"FlStarSym\", \"capsuleFJ\": [");
    for (unsigned i = 0; i < ht->nf.nJ; ++i) fprintf(f, "%s{\"j\": %d, \"basepoint\": %u}", i ? "," : "", ht->nf.J[i].label, ht->nf.J[i].basepoint);
    fprintf(f, "],\n"); ind(f, in); fprintf(f, "  \"ThetaBridge\": %s, \"NFBridge\": %s,\n", ht->nf.theta_bridge_ok ? "true" : "false", ht->nf.nf_bridge_ok ? "true" : "false");
    ind(f, in); fprintf(f, "  \"FGt\":\n"); iut_json_prime_strip(f, &ht->nf.FGt, in + 3); fprintf(f, ",\n");
    ind(f, in); fprintf(f, "  \"FCircAst\":\n"); iut_json_prime_strip(f, &ht->nf.FCircAst, in + 3); fprintf(f, ",\n");
    ind(f, in); fprintf(f, "  \"ThetaHodgeTheater\": {\"thetaValues\": [");
    for (unsigned j = 0; j <= d->lstar; ++j) { char b[32]; iut_q_fmt(ht->nf.tht.theta_value[j], b, sizeof b); fprintf(f, "%s\"%s\"", j ? "," : "", b); }
    fprintf(f, "],\n"); ind(f, in); fprintf(f, "   \"FMonoGlobMod\":\n"); iut_json_prime_strip(f, &ht->nf.tht.FMonoGlobMod, in + 4); fprintf(f, ",\n");
    ind(f, in); fprintf(f, "   \"FMonoGlobTht\":\n"); iut_json_prime_strip(f, &ht->nf.tht.FMonoGlobTht, in + 4); fprintf(f, "}},\n");
    const struct { const char *k; const iut_prime_strip *ps; } extra[] = {
        { "FMonoGlobTriangle", &ht->FMonoGlobTriangle }, { "FMonoGlobEnv", &ht->FMonoGlobEnv }, { "FMonoGlobGau", &ht->FMonoGlobGau },
        { "FMonoGlobLGPTorsor", &ht->FMonoGlobLGP }, { "FMonoGlobLgpIdeal", &ht->FMonoGlobLgp } };
    for (size_t k = 0; k < 5; ++k) { ind(f, in); fprintf(f, " \"%s\":\n", extra[k].k); iut_json_prime_strip(f, extra[k].ps, in + 2); fprintf(f, ",\n"); }
    ind(f, in); fprintf(f, " \"QPilot\":\n"); json_pilot(f, &ht->q_pilot, in + 2); fprintf(f, ",\n");
    ind(f, in); fprintf(f, " \"ThetaPilot\":\n"); json_pilot(f, &ht->theta_pilot, in + 2); fprintf(f, ",\n");
    ind(f, in); fprintf(f, " \"hasIncomingLog\": %s, \"LogShell\": [", ht->has_incoming_log ? "true" : "false");
    for (unsigned i = 0; i < ht->nshell; ++i) {
        const iut_log_shell *S = &ht->shell[i]; char b[32]; iut_q_fmt(S->radius, b, sizeof b);
        fprintf(f, "%s{\"v\": \"%s\", \"PStar\": %u, \"radius\": \"%s\", \"logVolume\": ", i ? ", " : "", d->V[S->v_index].name, S->pstar, b); jnum(f, S->log_volume);
        fprintf(f, ", \"holomorphic\": %s, \"etaleLike\": %s, \"from\": [%d,%d]}", S->holomorphic ? "true" : "false", S->etale_like ? "true" : "false", S->lattice_n, S->lattice_m);
    }
    fprintf(f, "]}");
}

void iut_json_lattice(FILE *f, const iut_log_theta_lattice *lat)
{
    fprintf(f, "{\"species\": \"LogThetaLattice\", \"horizontal\": \"%s\", \"focus\": [%d,%d],\n \"data\":\n", iut_link_kind_id(lat->horizontal), lat->focus_n, lat->focus_m);
    iut_json_data(f, &lat->data);
    fprintf(f, ", \"HodgeTheaters\": [\n");
    int first = 1;
    for (int i = 0; i < IUT_LAT_N; ++i)
        for (int j = 0; j < IUT_LAT_M; ++j)
            if (lat->ht[i][j]) { if (!first) fprintf(f, ",\n"); first = 0; iut_json_hodge_theater(f, lat->ht[i][j], 2); }
    fprintf(f, "\n ], \"links\": [\n");
    for (unsigned k = 0; k < lat->nlinks; ++k) {
        const iut_link *L = &lat->links[k];
        fprintf(f, "  {\"species\": \"%s\", \"notation\": ", iut_link_kind_id(L->kind)); jstr(f, iut_link_kind_notation(L->kind));
        fprintf(f, ", \"dom\": [%d,%d], \"cod\": [%d,%d], \"glued\": \"%s\", \"fullPolyIsomorphism\": %s, \"preservesPiV\": %s, \"preservesGV\": %s, \"preservesUnitsModTors\": %s, \"preservesRing\": %s, \"dilation\": ",
                L->dom_n, L->dom_m, L->cod_n, L->cod_m, iut_ps_kind_id(L->glued_kind), L->full_poly_isomorphism ? "true" : "false",
                L->preserves_Pi ? "true" : "false", L->preserves_G ? "true" : "false", L->preserves_units_mod_tors ? "true" : "false", L->preserves_ring_structure ? "true" : "false");
        jnum(f, L->dilation); fprintf(f, "}%s\n", k + 1 < lat->nlinks ? "," : "");
    }
    fprintf(f, " ]}\n");
}

void iut_json_report(FILE *f, const iut_report *r)
{
    static const char *sev[] = { "ok", "info", "warn", "error" };
    fprintf(f, "{\"errors\": %u, \"warnings\": %u, \"issues\": [\n", r->errors, r->warnings);
    for (unsigned i = 0; i < r->n; ++i) {
        fprintf(f, "  {\"severity\": \"%s\", \"condition\": \"%s\", \"ref\": ", sev[r->issue[i].sev], r->issue[i].condition); jstr(f, r->issue[i].ref);
        fprintf(f, ", \"msg\": "); jstr(f, r->issue[i].msg); fprintf(f, "}%s\n", i + 1 < r->n ? "," : "");
    }
    fprintf(f, "]}\n");
}

void iut_json_idents(FILE *f)
{
    fprintf(f, "[\n");
    for (size_t i = 0; i < iut_idents_count; ++i) {
        const iut_ident *x = &iut_idents[i];
        fprintf(f, "  {\"id\": \"%s\", \"notation\": ", x->id); jstr(f, x->notation);
        fprintf(f, ", \"kind\": \"%s\", \"ref\": ", x->kind); jstr(f, x->ref); fprintf(f, ", \"desc\": "); jstr(f, x->desc);
        fprintf(f, "}%s\n", i + 1 < iut_idents_count ? "," : "");
    }
    fprintf(f, "]\n");
}

void iut_js_idents(FILE *f)
{
    fprintf(f, "// GENERATED by `iut ids --js` from src/iut_ids.c — do not edit by hand.\n");
    fprintf(f, "// English-letters-only identifiers for the notations of IUT (see docs/IDENTIFIERS.md).\n");
    fprintf(f, "(function (root) {\n  'use strict';\n  var IDENTS = ");
    iut_json_idents(f);
    fprintf(f, "  ;\n  var SPECIES = [\n");
    for (size_t i = 0; i < iut_species_count; ++i) {
        fprintf(f, "    {\"id\": \"%s\", \"name\": ", iut_species_table[i].id); jstr(f, iut_species_table[i].name);
        fprintf(f, ", \"ref\": "); jstr(f, iut_species_table[i].ref); fprintf(f, ", \"data\": "); jstr(f, iut_species_table[i].species_data);
        fprintf(f, "}%s\n", i + 1 < iut_species_count ? "," : "");
    }
    fprintf(f, "  ];\n  var MUTATIONS = [\n");
    for (size_t i = 0; i < iut_mutation_count; ++i) {
        const iut_mutation *m = &iut_mutation_table[i];
        fprintf(f, "    {\"id\": \"%s\", \"name\": ", m->id); jstr(f, m->name);
        fprintf(f, ", \"dom\": \"%s\", \"cod\": \"%s\", \"ref\": ", m->dom, m->cod); jstr(f, m->ref);
        fprintf(f, ", \"core\": %s}%s\n", m->is_core ? "true" : "false", i + 1 < iut_mutation_count ? "," : "");
    }
    fprintf(f, "  ];\n  var byId = {};\n  IDENTS.forEach(function (x) { byId[x.id.toLowerCase()] = x; });\n");
    fprintf(f, "  var api = { IDENTS: IDENTS, SPECIES: SPECIES, MUTATIONS: MUTATIONS,\n");
    fprintf(f, "    find: function (id) { return byId[String(id).toLowerCase()] || null; },\n");
    fprintf(f, "    isValid: function (id) { return /^[A-Za-z]+$/.test(id); } };\n");
    fprintf(f, "  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IUT_IDENTS = api;\n})(this);\n");
}

void iut_md_idents(FILE *f)
{
    fprintf(f, "# English-letters-only identifiers for IUT notation\n\n");
    fprintf(f, "GENERATED by `iut ids --md` from `src/iut_ids.c` — do not edit by hand.\n\n");
    fprintf(f, "Every mathematical object of [IUTchI]–[IUTchIV] whose printed name contains a\n"
               "symbol that is not an English letter (†, ‡, ∗, ◦, •, ⊢, ⊩, ▶, ×, μ, ⊥, ±, ⋊, ⊞, ⊚, ⊛, Δ, >, ∞, …)\n"
               "gets a unique identifier matching `^[A-Za-z]+$`. Identifiers are unique\n"
               "case-insensitively, so they can be used as C identifiers, JS keys, file names and URL fragments.\n\n");
    fprintf(f, "The whole table on one page: [identifiers-infographic.png](identifiers-infographic.png) (3840 × 2160;\n"
               "SVG master [identifiers-infographic.svg](identifiers-infographic.svg)) — the symbol dictionary, the species and\n"
               "mutations from initial Θ-data to the inequality, every identifier by family and the processes by paper.\n"
               "Regenerate it with `node scripts/infographic/build.js` after changing this table.\n\n");
    fprintf(f, "## Symbol dictionary\n\n| symbol | word | symbol | word | symbol | word |\n|---|---|---|---|---|---|\n");
    fprintf(f, "| † | Dag | ‡ | Ddag | ∗ | Ast |\n| ◦ | Circ | • | Bullet | ⊢ | Mono |\n| ⊩ | MonoGlob | ▶ | Val | × | Units |\n");
    fprintf(f, "| ×μ | UnitsModTors | μ | Tors | ⊥ | Perp |\n| ± | Pm | ⋊ | Semi | ⊞ | BoxPlus |\n| ⊚ | CircDot | ⊛ | CircAst | Δ (label) | Triangle |\n");
    fprintf(f, "| > | Gt | ∞ | Inf | κ | Kappa |\n| Θ | Theta | Π | Pi | Δ (group) | Delta |\n| Ψ | Psi | Γ | Gamma | ε | Epsilon |\n");
    fprintf(f, "| underline | Under | overline | Bar | ^gp | Gp |\n| ^pf | Pf | ′ | Prime | ¨ | Ddot |\n| tempered | Tp | LGP / lgp | LGPTorsor / LgpIdeal | MOD / mod | MODTorsor / ModIdeal |\n\n");
    fprintf(f, "Numbers are spelled out (`Zero`, `One`, `TwoL`, `JSq`, `LStar`, `LPm`), and\n"
               "`l*`, `l±`, `S^±_{j+1}` become `LStar`, `LPm`, `SPmJPlusOne`.\n\n");
    fprintf(f, "## Table (%zu entries)\n\n| identifier | notation | kind | introduced / recalled | description |\n|---|---|---|---|---|\n", iut_idents_count);
    for (size_t i = 0; i < iut_idents_count; ++i) {
        const iut_ident *x = &iut_idents[i];
        fprintf(f, "| `%s` | %s | %s | %s | %s |\n", x->id, x->notation, x->kind, x->ref, x->desc);
    }
    fprintf(f, "\n");
    iut_md_species(f);
}

void iut_md_species(FILE *f)
{
    fprintf(f, "## Species and mutations ([IUTchIV] §3)\n\n");
    fprintf(f, "A *species* is a set-theoretic formula defining a type of mathematical object; a\n"
               "*mutation* is a species-theoretic functor; the log-theta-lattice is a *mutation-history*\n"
               "([IUTchIV] Def. 3.1, 3.3). The program implements each species as a C struct and each\n"
               "mutation as a function.\n\n| species | notation | ref | data |\n|---|---|---|---|\n");
    for (size_t i = 0; i < iut_species_count; ++i)
        fprintf(f, "| `%s` | %s | %s | %s |\n", iut_species_table[i].id, iut_species_table[i].name, iut_species_table[i].ref, iut_species_table[i].species_data);
    fprintf(f, "\n| mutation | notation | domain → codomain | ref | core? |\n|---|---|---|---|---|\n");
    for (size_t i = 0; i < iut_mutation_count; ++i)
        fprintf(f, "| `%s` | %s | `%s` → `%s` | %s | %s |\n", iut_mutation_table[i].id, iut_mutation_table[i].name, iut_mutation_table[i].dom, iut_mutation_table[i].cod, iut_mutation_table[i].ref, iut_mutation_table[i].is_core ? "yes" : "no");
    fprintf(f, "\n");
}
