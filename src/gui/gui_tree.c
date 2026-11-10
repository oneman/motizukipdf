/*
 * gui_tree.c — the object inspector of iut-gui: every object the pipeline has built so far, as a tree
 * (GtkTreeStore), field by field, with the letters-only identifier of its type (src/iut_ids.c) so the
 * window can show the notation, reference and description of whatever is selected.
 */
#include <stdarg.h>
#include <string.h>
#include <gtk/gtk.h>
#include "gui_tree.h"

static GtkTreeIter add(GtkTreeStore *st, GtkTreeIter *parent, const char *ident, const char *key, const char *name, const char *fmt, ...) __attribute__((format(printf, 6, 7)));
static GtkTreeIter add(GtkTreeStore *st, GtkTreeIter *parent, const char *ident, const char *key, const char *name, const char *fmt, ...)
{
    char v[512] = "";
    if (fmt) { va_list ap; va_start(ap, fmt); vsnprintf(v, sizeof v, fmt, ap); va_end(ap); }
    GtkTreeIter it;
    gtk_tree_store_append(st, &it, parent);
    gtk_tree_store_set(st, &it, TC_NAME, name, TC_VALUE, v, TC_IDENT, ident ? ident : "", TC_KEY, key ? key : "",
                       TC_WEIGHT, parent ? PANGO_WEIGHT_NORMAL : PANGO_WEIGHT_BOLD, -1);
    return it;
}

static const char *yes(int b) { return b ? "✓" : "✗"; }

static void add_strip(GtkTreeStore *st, GtkTreeIter *parent, const char *ident, const char *name, const iut_prime_strip *ps, const iut_initial_theta_data *d)
{
    GtkTreeIter s = add(st, parent, ident, NULL, name, "%s  ·  label %s", iut_ps_kind_notation(ps->kind), ps->label[0] ? ps->label : "—");
    add(st, &s, iut_ps_kind_id(ps->kind), NULL, "kind", "%s (%s%s%s)", iut_ps_kind_notation(ps->kind), iut_ps_kind_is_etale_like(ps->kind) ? "étale-like" : "Frobenius-like",
        iut_ps_kind_is_mono_analytic(ps->kind) ? ", mono-analytic" : ", holomorphic", iut_ps_kind_has_global(ps->kind) ? ", global" : "");
    if (ps->has_global_realified) add(st, &s, NULL, NULL, "global realified Frobenioid", "deg of the pilot object = %.6f", ps->global_degree);
    for (unsigned i = 0; i < ps->nV && i < d->nV; ++i) {
        const iut_local_datum *L = &ps->loc[i];
        char vals[200] = ""; size_t o = 0;
        for (unsigned g = 0; g < L->nval && o + 24 < sizeof vals; ++g) { char q[24]; iut_q_fmt(L->val[g], q, sizeof q); o += (size_t)snprintf(vals + o, sizeof vals - o, "%s%s", g ? "," : "", q); }
        GtkTreeIter li = add(st, &s, NULL, NULL, d->V[i].name, "Π #%u · G #%u · %s #%u%s%s%s", L->Pi_copy, L->G_copy, L->units_mod_tors ? "O×μ" : "O×", L->units_copy,
                             L->nval ? " · O▶ {" : "", vals, L->nval ? "}" : "");
        add(st, &li, NULL, NULL, "Π_v copy", "%u%s", L->Pi_copy, L->Pi_copy ? "" : " (absent: mono-analytic)");
        add(st, &li, NULL, NULL, "G_v copy", "%u", L->G_copy);
        add(st, &li, NULL, NULL, "monoid copy", "%u%s", L->units_copy, L->units_copy ? "" : " (absent: étale-like)");
        add(st, &li, NULL, NULL, "units mod torsion", "%s", L->units_mod_tors ? "O×μ = O×/O_μ" : "O×");
        add(st, &li, NULL, NULL, "value group O▶", "%s%s", yes(L->has_valgroup), L->has_splitting ? "  (split)" : "");
        add(st, &li, NULL, NULL, "value-group generators", "%u: {%s} (units of ord q̲_v)", L->nval, vals);
        add(st, &li, NULL, NULL, "Kummer structure", "%s", L->kummer_kind == 2 ? "×μ-Kummer (Ism-orbit)" : L->kummer_kind == 1 ? "×-Kummer" : "none");
    }
}

static void add_ht(GtkTreeStore *st, GtkTreeIter *parent, const iut_hodge_theater *ht, const iut_initial_theta_data *d)
{
    char key[32], name[48]; snprintf(key, sizeof key, "ht:%d:%d", ht->n, ht->m); snprintf(name, sizeof name, "(%d, %d)", ht->n, ht->m);
    GtkTreeIter h = add(st, parent, "ThetaPmEllNFHodgeTheater", key, name, "universe #%u · %s%s", ht->universe, ht->copy_label, ht->has_incoming_log ? " · log-shells" : "");
    add(st, &h, NULL, key, "position (n, m)", "(%d, %d)", ht->n, ht->m);
    add(st, &h, NULL, key, "universe", "#%u", ht->universe);
    add(st, &h, NULL, key, "copy label", "%s", ht->copy_label);
    GtkTreeIter pm = add(st, &h, "ThetaPmEllHodgeTheater", key, "Θ±ell-Hodge theater", "capsule of %u, bridges %s %s", ht->pmell.nT, yes(ht->pmell.theta_pm_bridge_ok), yes(ht->pmell.theta_ell_bridge_ok));
    GtkTreeIter T = add(st, &pm, "FT", key, "capsule F_T", "%u F-prime-strips, t ∈ F_l", ht->pmell.nT);
    for (unsigned i = 0; i < ht->pmell.nT; ++i) { char n[24]; snprintf(n, sizeof n, "t = %d", ht->pmell.T[i].label); add(st, &T, "LabelT", key, n, "basepoint #%u", ht->pmell.T[i].basepoint); }
    add_strip(st, &pm, "FBoxPlus", "F_⊞  (Θ±-bridge target)", &ht->pmell.FBoxPlus, d);
    add_strip(st, &pm, "DCircDotPm", "D_⊚±  (Θell-bridge target)", &ht->pmell.DCircDotPm, d);
    add(st, &pm, "ThetaPmBridge", key, "Θ±-bridge", "%s", yes(ht->pmell.theta_pm_bridge_ok));
    add(st, &pm, "ThetaEllBridge", key, "Θell-bridge", "%s", yes(ht->pmell.theta_ell_bridge_ok));
    GtkTreeIter nf = add(st, &h, "ThetaNFHodgeTheater", key, "ΘNF-Hodge theater", "capsule of %u, bridges %s %s", ht->nf.nJ, yes(ht->nf.theta_bridge_ok), yes(ht->nf.nf_bridge_ok));
    GtkTreeIter J = add(st, &nf, "FJ", key, "capsule F_J", "%u F-prime-strips, j ∈ F_l^*", ht->nf.nJ);
    for (unsigned i = 0; i < ht->nf.nJ; ++i) { char n[24]; snprintf(n, sizeof n, "j = %d", ht->nf.J[i].label); add(st, &J, NULL, key, n, "basepoint #%u", ht->nf.J[i].basepoint); }
    add_strip(st, &nf, "FGt", "F_>  (Θ-bridge target)", &ht->nf.FGt, d);
    add_strip(st, &nf, "FCircAst", "F_⊛  (NF-bridge target)", &ht->nf.FCircAst, d);
    GtkTreeIter th = add(st, &nf, "ThetaHodgeTheater", key, "Θ-Hodge theater", "q̲_v and Θ̲_v at V^bad");
    add_strip(st, &th, "FMonoGlobMod", "F⊩_mod", &ht->nf.tht.FMonoGlobMod, d);
    add_strip(st, &th, "FMonoGlobTht", "F⊩_tht", &ht->nf.tht.FMonoGlobTht, d);
    {
        char s[400] = ""; size_t o = 0;
        for (unsigned j = 1; j <= d->lstar && o + 24 < sizeof s; ++j) { char q[24]; iut_q_fmt(ht->nf.tht.theta_value[j], q, sizeof q); o += (size_t)snprintf(s + o, sizeof s - o, "%s%u:%s", j > 1 ? "  " : "", j, q); }
        add(st, &th, NULL, key, "Θ̲_v at j (units of ord q̲_v)", "%s", s);
    }
    add(st, &nf, "ThetaBridge", key, "Θ-bridge", "%s", yes(ht->nf.theta_bridge_ok));
    add(st, &nf, "NFBridge", key, "NF-bridge", "%s", yes(ht->nf.nf_bridge_ok));
    add(st, &h, NULL, key, "glued 0, ⊞ ↦ >", "%s", yes(ht->glued));
    add_strip(st, &h, "FMonoGlobTriangle", "F⊩_Δ", &ht->FMonoGlobTriangle, d);
    add_strip(st, &h, "FMonoGlobEnv", "F⊩_env", &ht->FMonoGlobEnv, d);
    add_strip(st, &h, "FMonoGlobGau", "F⊩_gau", &ht->FMonoGlobGau, d);
    add_strip(st, &h, "FMonoGlobLGPTorsor", "F⊩_LGP", &ht->FMonoGlobLGP, d);
    add_strip(st, &h, "FMonoGlobLgpIdeal", "F⊩_lgp", &ht->FMonoGlobLgp, d);
    add(st, &h, "QPilot", key, "q-pilot", "%u exponent(s), log-volume %.6f", ht->q_pilot.nj, ht->q_pilot.log_volume);
    add(st, &h, "ThetaPilot", key, "Θ-pilot", "%u exponents, log-volume %.6f", ht->theta_pilot.nj, ht->theta_pilot.log_volume);
    GtkTreeIter sh = add(st, &h, "LogShell", key, "log-shells", "%u%s", ht->nshell, ht->nshell ? "" : " (no log-link into this vertex yet)");
    for (unsigned i = 0; i < ht->nshell; ++i) {
        const iut_log_shell *S = &ht->shell[i]; const iut_valuation *v = &d->V[S->v_index];
        char q[24]; iut_q_fmt(S->radius, q, sizeof q);
        if (v->kind == IUT_V_ARCH) add(st, &sh, "LogShell", key, v->name, "π-disc (archimedean)");
        else add(st, &sh, "LogShell", key, v->name, "p* = %u, I_v = p^{%s}·O, μ_log = %+.6f, %s, units from (%d,%d)", S->pstar, q, S->log_volume,
                 S->etale_like ? "étale-like" : "Frobenius-like", S->lattice_n, S->lattice_m);
    }
    add(st, &h, NULL, key, "log-link iterate", "%d", ht->log_iterate);
}

void gt_rebuild(GtkTreeStore *st, const gm_model *m)
{
    gtk_tree_store_clear(st);
    if (!m->loaded) return;
    const iut_initial_theta_data *d = &m->data;

    /* stage 0 */
    GtkTreeIter D = add(st, NULL, "InitialThetaData", "stage:0", "initial Θ-data", "%s", d->name);
    if (m->reached > GS_DATA) {
        add(st, &D, NULL, NULL, "name", "%s", d->name);
        add(st, &D, NULL, NULL, "curve E_F", "%s", d->curve);
        add(st, &D, NULL, NULL, "source", "%s", d->from_json ? d->source_id : m->source);
        add(st, &D, "Fl", NULL, "l", "%u", d->l);
        add(st, &D, NULL, NULL, "l* = (l−1)/2", "%u", d->lstar);
        add(st, &D, NULL, NULL, "l± = (l+1)/2", "%u", d->lpm);
        add(st, &D, "EpsilonUnder", NULL, "ε̲", "the cusp ±%d", d->epsilon);
        add(st, &D, NULL, NULL, "[F_mod : Q]", "%u", d->dmod);
        add(st, &D, NULL, NULL, "[F : Q] ≤", "%llu", d->dF);
        add(st, &D, NULL, NULL, "[K : Q] ≤", "%llu", d->dK);
        add(st, &D, NULL, NULL, "log d^F", "%.6f", d->logdF);
        add(st, &D, NULL, NULL, "log d^K", "%.6f (estimate)", d->logdK);
        add(st, &D, NULL, NULL, "h(j_E)", "%.6f", d->j_log_height);
        add(st, &D, NULL, NULL, "log q", "%.6f", iut_log_q(d));
        add(st, &D, NULL, NULL, "log q∀", "%.6f", iut_log_q_all(d));
        GtkTreeIter H = add(st, &D, NULL, NULL, "asserted hypotheses", "%d of 5", d->h_F_galois_over_Fmod + d->h_F_contains_six_torsion + d->h_image_contains_SL2 + d->h_stable_reduction + d->h_CK_is_K_core);
        add(st, &H, NULL, NULL, "F/F_mod Galois, degree prime to l", "%s", yes(d->h_F_galois_over_Fmod));
        add(st, &H, NULL, NULL, "F ⊇ fields of definition of E[6]", "%s", yes(d->h_F_contains_six_torsion));
        add(st, &H, NULL, NULL, "Im(Gal(K/F)) ⊇ SL₂(F_l)", "%s", yes(d->h_image_contains_SL2));
        add(st, &H, NULL, NULL, "stable reduction everywhere", "%s", yes(d->h_stable_reduction));
        add(st, &H, NULL, NULL, "C_K is a K-core", "%s", yes(d->h_CK_is_K_core));
        GtkTreeIter V = add(st, &D, NULL, NULL, "V ≅ V_mod", "%u places", d->nV);
        for (unsigned i = 0; i < d->nV; ++i) {
            const iut_valuation *v = &d->V[i];
            const char *red = v->kind == IUT_V_ARCH ? "archimedean" : v->red == IUT_RED_GOOD ? "good" : v->red == IUT_RED_BAD_ADD ? "additive" : "multiplicative";
            GtkTreeIter p = v->red == IUT_RED_BAD_MULT
                ? add(st, &V, NULL, NULL, v->name, "multiplicative, ord q = %u%s", v->ordq, v->in_Vbad_mod ? ", ∈ V^bad_mod" : "")
                : add(st, &V, NULL, NULL, v->name, "%s", red);
            add(st, &p, NULL, NULL, "kind", "%s", v->kind == IUT_V_ARCH ? "archimedean (V^arc)" : "non-archimedean (V^non)");
            if (v->kind != IUT_V_ARCH) {
                add(st, &p, NULL, NULL, "p_v", "%u", v->p);
                add(st, &p, NULL, NULL, "e/f of (F_mod)_v / Q_p", "%u/%u", v->e_mod, v->f_mod);
                add(st, &p, NULL, NULL, "e/f of K_v / Q_p", "%s%u/%u", v->e_K_lower ? "≥" : "", v->e_K, v->f_K);
                add(st, &p, NULL, NULL, "reduction", "%s", red);
                add(st, &p, NULL, NULL, "ord_v(q_v)", "%u", v->ordq);
                add(st, &p, NULL, NULL, "in V^bad_mod", "%s", yes(v->in_Vbad_mod));
                if (v->q_prec) add(st, &p, NULL, NULL, "Tate parameter", "q_v = %u^%u · u, u ≡ %llu mod %u^%u", v->p, v->ordq, v->q_unit, v->p, v->q_prec);
            }
        }
    }
    /* stage 1 */
    if (m->reached > GS_DEF) {
        unsigned good = 0; for (unsigned k = 0; k < m->nitems; ++k) good += m->items[k].ok != 0;
        GtkTreeIter C = add(st, NULL, "DefThreeOne", "stage:1", "Def 3.1 (a)–(f)", "%u of %u hold", good, m->nitems);
        for (unsigned k = 0; k < m->nitems; ++k) {
            GtkTreeIter it = add(st, &C, NULL, "stage:1", m->items[k].item, "%s %s", yes(m->items[k].ok), m->items[k].condition);
            add(st, &it, NULL, "stage:1", "detail", "%s", m->items[k].detail);
            add(st, &it, NULL, "stage:1", "checked by", "%s", m->items[k].machine_checked == 2 ? "the program, and assertions (flags)" : m->items[k].machine_checked ? "the program" : "assertion (flag)");
        }
        GtkTreeIter R = add(st, NULL, NULL, "stage:1", "validation report", "%u error(s), %u warning(s), %u checks", m->rdata.errors, m->rdata.warnings, m->rdata.n);
        for (unsigned k = 0; k < m->rdata.n; ++k) {
            const iut_issue *is = &m->rdata.issue[k];
            add(st, &R, is->condition, "stage:1", is->condition, "[%s] %s  %s", is->sev == IUT_SEV_ERROR ? "ERROR" : is->sev == IUT_SEV_WARN ? "WARN" : is->sev == IUT_SEV_INFO ? "info" : "ok", is->msg, is->ref);
        }
    }
    /* stages 2 and 4 */
    if (m->reached > GS_HT && m->lat) {
        const iut_log_theta_lattice *lat = m->lat;
        unsigned nht = 0; for (int i = 0; i < IUT_LAT_N; ++i) for (int j = 0; j < IUT_LAT_M; ++j) nht += lat->ht[i][j] != NULL;
        GtkTreeIter L = add(st, NULL, "LogThetaLattice", "stage:4", "log-theta-lattice", "%u Hodge theaters, %u links, horizontal %s", nht, lat->nlinks, iut_link_kind_notation(lat->horizontal));
        GtkTreeIter HT = add(st, &L, "ThetaPmEllNFHodgeTheater", "stage:2", "Hodge theaters", "%u", nht);
        for (int n = -IUT_LAT_NOFF; n <= IUT_LAT_NOFF; ++n) for (int mm = -IUT_LAT_MOFF; mm <= IUT_LAT_MOFF; ++mm) {
            const iut_hodge_theater *ht = lat->ht[n + IUT_LAT_NOFF][mm + IUT_LAT_MOFF];
            if (ht) add_ht(st, &HT, ht, d);
        }
        GtkTreeIter LK = add(st, &L, NULL, "stage:4", "links", "%u", lat->nlinks);
        for (unsigned k = 0; k < lat->nlinks; ++k) {
            const iut_link *l = &lat->links[k];
            char name[96]; snprintf(name, sizeof name, "%s (%d,%d) → (%d,%d)", iut_link_kind_notation(l->kind), l->dom_n, l->dom_m, l->cod_n, l->cod_m);
            GtkTreeIter li = add(st, &LK, iut_link_kind_id(l->kind), "stage:4", name, "%s#%u", (int)k == m->last_link ? "newest · " : "", k + 1);
            add(st, &li, iut_ps_kind_id(l->glued_kind), "stage:4", "glues", "%s-prime-strips", iut_ps_kind_notation(l->glued_kind));
            add(st, &li, NULL, "stage:4", "full poly-isomorphism", "%s", yes(l->full_poly_isomorphism));
            add(st, &li, NULL, "stage:4", "shares Π_v", "%s", yes(l->preserves_Pi));
            add(st, &li, NULL, "stage:4", "shares G_v", "%s", yes(l->preserves_G));
            add(st, &li, NULL, "stage:4", "shares O×μ", "%s", yes(l->preserves_units_mod_tors));
            add(st, &li, NULL, "stage:4", "keeps the ring structure", "%s", yes(l->preserves_ring_structure));
            add(st, &li, NULL, "stage:4", "value-group dilation", "%.6f", l->dilation);
        }
        if (m->reached > GS_LAT) add(st, &L, NULL, "stage:4", "validation", "%u error(s) in %u checks", m->rlat.errors, m->rlat.n);
    }
    /* stage 3 */
    if (m->reached > GS_GAU) {
        unsigned bad[IUT_MAX_V], nbad = gm_bad_places(d, bad), twol = 2 * d->l;
        GtkTreeIter G = add(st, NULL, "PsiGau", "stage:3", "Gaussian monoids Ψ_gau", "at %u place(s) of V^bad_mod", nbad);
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            GtkTreeIter p = add(st, &G, NULL, "stage:3", v->name, "p = %u, ord q_v = %u", v->p, v->ordq);
            for (unsigned j = 1; j <= d->lstar; ++j) {
                char q[24]; iut_q_fmt(iut_q_make((long)(j * j * v->ordq), (long)twol), q, sizeof q);
                char n[24]; snprintf(n, sizeof n, "j = %u", j);
                if (v->q_prec) add(st, &p, NULL, "stage:3", n, "ord(q̲^{j²}) = %s · unit of q^{%u} ≡ %llu mod %u^%u", q, j * j, iut_tate_unit_pow(v, (unsigned long long)j * j), v->p, v->q_prec);
                else add(st, &p, NULL, "stage:3", n, "ord(q̲^{j²}) = %s", q);
            }
        }
        add(st, &G, "QPilot", "stage:3", "q-pilot", "−|log q| = %.6f", m->qp.log_volume);
        add(st, &G, "ThetaPilot", "stage:3", "Θ-pilot", "−(l(l+1)/12)·|log q| = %.6f", m->tp.log_volume);
    }
    /* stage 5 */
    if (m->reached > GS_MR && m->mr) {
        const iut_multiradial_full *mr = m->mr;
        GtkTreeIter R = add(st, NULL, "MultiradialRepresentation", "stage:5", "multiradial representation", "column %d, %u steps", mr->rep.n, mr->rep.nsteps);
        GtkTreeIter P = add(st, &R, "Procession", "stage:5", "procession", "S±_{j+1}, j = 0..%u", d->lstar);
        for (unsigned j = 0; j < mr->rep.nsteps; ++j) {
            const iut_procession_step *s = &mr->rep.step[j];
            char n[24]; snprintf(n, sizeof n, "S±_%u", s->j + 1);
            add(st, &P, "TensorPacket", "stage:5", n, "|S| = %u, %u perms, (j+1)·log d^K = %.6f, −(j²/2l)·log q = %.6f", s->size, s->perms, s->log_volume_leading, s->theta_shift);
        }
        add(st, &R, "IndOne", "stage:5", "(Ind1)", "|Aut(Prc)| = %llu", mr->ind1_count);
        add(st, &R, "IndTwo", "stage:5", "(Ind2)", "Ism on %llu summands", mr->ind2_summands);
        add(st, &R, "IndThree", "stage:5", "(Ind3)", "%s", yes(mr->ind3));
        add(st, &R, "TensorPacket", "stage:5", "(a) tensor packets", "%u", mr->npackets);
        add(st, &R, NULL, "stage:5", "(b) splitting monoids", "%u", mr->nsplitting);
        add(st, &R, NULL, "stage:5", "(c) copies of F_mod^×", "%u", mr->nnumberfields);
        add(st, &R, "LogKummerCorrespondence", "stage:5", "log-Kummer non-interference", "%s", yes(mr->log_kummer_ok));
        add(st, &R, NULL, "stage:5", "compatible with the Θ×μ_LGP-link", "%s %s %s %s", yes(mr->link_compat[0]), yes(mr->link_compat[1]), yes(mr->link_compat[2]), yes(mr->link_compat[3]));
        add(st, &R, NULL, "stage:5", "leading term", "%.6f", mr->rep.leading_term);
        add(st, &R, NULL, "stage:5", "−|log Θ| upper bound", "%.6f", mr->rep.theta_upper_bound);
        add(st, &R, NULL, "stage:5", "|log q|", "%.6f", mr->rep.abs_log_q);
        add(st, &R, NULL, "stage:5", "C_Θ", "%.6g", mr->rep.C_theta);
        GtkTreeIter C = add(st, NULL, "CorThreeTwelve", "stage:5", "Cor 3.12", "%s", m->c312ok ? "holds ✓" : "fails ✗");
        for (unsigned k = 0; k < m->nc312; ++k) add(st, &C, NULL, "stage:5", m->c312[k].label, "%.6g   %s", m->c312[k].value, m->c312[k].ref);
    }
    /* stage 6 */
    if (m->reached > GS_HB) {
        const iut_thm110 *T = &m->T; const iut_cor22 *C = &m->C;
        GtkTreeIter t = add(st, NULL, "ThmOneTen", "stage:6", "Thm 1.10", "%.6f ≤ %.6g %s", T->lhs, T->rhs, yes(T->inequality_holds));
        add(st, &t, NULL, "stage:6", "log q", "%.6f", T->logq);
        add(st, &t, NULL, "stage:6", "|log q|", "%.6f", T->abs_logq);
        add(st, &t, NULL, "stage:6", "log d^Ftpd", "%.6f", T->logd_tpd);
        add(st, &t, NULL, "stage:6", "log f^Ftpd", "%.6f", T->logf_tpd);
        add(st, &t, NULL, "stage:6", "e*_mod", "%.0f", T->estar_mod);
        add(st, &t, NULL, "stage:6", "η_prm", "%.3g", T->eta_prm);
        add(st, &t, NULL, "stage:6", "C_Θ", "%.6g", T->C_theta);
        add(st, &t, NULL, "stage:6", "left side (1/6) log q", "%.6f", T->lhs);
        add(st, &t, NULL, "stage:6", "right side", "%.6g", T->rhs);
        GtkTreeIter c = add(st, NULL, NULL, "stage:6", "Cor 2.2", "(C1) %s, (C2) %s%s", C->l_in_range ? "l in range" : "l out of range", yes(C->holds), C->in_exceptional_set ? " (curve in the exceptional set)" : "");
        add(st, &c, NULL, "stage:6", "log q∀", "%.6f", C->logq_all);
        add(st, &c, NULL, "stage:6", "δ = 2¹²·3³·5·d", "%.6g", C->delta);
        add(st, &c, NULL, "stage:6", "(C1) l range", "[%.4f, %.6g], l = %u", C->l_min, C->l_max, d->l);
        add(st, &c, NULL, "stage:6", "ε_E", "%.6g", C->eps_E);
        add(st, &c, NULL, "stage:6", "(C2)", "%.6f ≤ %.6g", C->lhs, C->rhs);
    }
    /* stage 7 */
    if (m->reached > GS_XC) {
        GtkTreeIter x = add(st, NULL, NULL, "stage:7", "cross-check", m->nxc ? "%u of %u agree" : "none (generated data)", m->nxc - m->xbad, m->nxc);
        for (unsigned k = 0; k < m->nxc; ++k) add(st, &x, NULL, "stage:7", m->xc[k].what, "%s toolkit %.6f, file %.6f", yes(m->xc[k].ok), m->xc[k].toolkit, m->xc[k].file);
    }
}

GtkTreeStore *gt_store_new(void)
{
    return gtk_tree_store_new(TC_COUNT, G_TYPE_STRING, G_TYPE_STRING, G_TYPE_STRING, G_TYPE_STRING, G_TYPE_INT);
}
