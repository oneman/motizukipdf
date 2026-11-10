/*
 * iut_pipeline.c — `iut pipeline`: one run of the whole theory on one set of
 * initial Θ-data, printing the state after every stage.
 *
 *   stage 0  the initial Θ-data (F̄/F, X_F, l, C̲_K, V, V^bad_mod, ε̲)      [IUTchI] Def 3.1
 *   stage 1  the conditions (a)–(f) and the validation report              [IUTchI] Def 3.1
 *   stage 2  the Hodge theaters: Θ±ell-HT, ΘNF-HT, the Θ-HT at V^bad,
 *            the gluing 0,⊞ ↦ > into the Θ±ell NF-Hodge theater         [IUTchI] §3–§6, Def 6.13
 *   stage 3  the Gaussian monoids: theta values q̲_v^{j²} at the l-torsion
 *            points, with the actual p-adic numbers q_v^{j²} when q_v is known
 *                                                                          [IUTchII] Cor 2.5, Cor 3.5, Cor 4.10
 *   stage 4  the log-theta-lattice: the infinite H, the Θ×μ_LGP-link, the
 *            log-links and their log-shells                                [IUTchIII] Def 1.1, 1.4, 3.8
 *   stage 5  the multiradial representation and Cor 3.12                  [IUTchIII] Thm 3.11, Cor 3.12
 *   stage 6  the height bound                                              [IUTchIV] Thm 1.10, Cor 2.2
 *   stage 7  cross-check against the numbers stored in the JSON file (when the data came from one)
 *
 * The same run is available as JSON (`--json`), which the web app draws.
 * Exit status: number of validation errors plus cross-check mismatches (0 = the
 * whole pipeline went through).
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

static const char *ck(int b) { return b ? "✓" : "✗"; }
static const char *tf(int b) { return b ? "true" : "false"; }

static void jstr(FILE *f, const char *s)
{
    fputc('"', f);
    for (const unsigned char *p = (const unsigned char *)s; *p; ++p) {
        if (*p == '"') fputs("\\\"", f); else if (*p == '\\') fputs("\\\\", f); else if (*p == '\n') fputs("\\n", f);
        else if (*p < 0x20) fprintf(f, "\\u%04x", *p); else fputc(*p, f);
    }
    fputc('"', f);
}
static void jnum(FILE *f, double x)
{
    if (isinf(x)) fputs(x > 0 ? "\"+inf\"" : "\"-inf\"", f); else if (isnan(x)) fputs("null", f); else fprintf(f, "%.10g", x);
}
static void qfmt(iut_q q, char *b, size_t n) { iut_q_fmt(q, b, n); }

/* base-p digits of x (little-endian), as "d0 d1 d2 …" */
static void digits(unsigned long long x, unsigned p, unsigned n, char *buf, size_t bn)
{
    size_t o = 0; buf[0] = 0;
    for (unsigned k = 0; k < n && o + 8 < bn; ++k) { o += (size_t)snprintf(buf + o, bn - o, "%s%llu", k ? "," : "", x % p); x /= p; }
}

/* one check of the cross-check stage */
typedef struct { const char *what; double toolkit, file; int ok; } xcheck;

int iut_pipeline_run(FILE *f, const iut_initial_theta_data *din, int rows, iut_link_kind horizontal, int json)
{
    if (rows < 1) rows = 1;
    if (rows > IUT_LAT_MOFF) rows = IUT_LAT_MOFF;
    iut_log_theta_lattice *lat = calloc(1, sizeof *lat);
    if (!lat) return 1;
    iut_lattice_init(lat, din, horizontal);
    const iut_initial_theta_data *d = &lat->data;

    /* ---- stage 1: Def 3.1 */
    iut_report rdata; memset(&rdata, 0, sizeof rdata);
    iut_validate_data(d, &rdata);
    iut_def_three_one_item items[8]; unsigned nitems = iut_def_three_one_check(d, items, 8, NULL);

    /* ---- stage 4 first (it builds the Hodge theaters): the infinite H */
    iut_lattice_build_H(lat, 0, -rows, rows);
    iut_hodge_theater *ht = iut_lattice_get(lat, 0, 0), *ht1 = iut_lattice_get(lat, 1, 0), *htup = iut_lattice_get(lat, 0, 1);
    iut_report rht; memset(&rht, 0, sizeof rht); iut_validate_hodge_theater(ht, &rht);
    iut_report rlat; memset(&rlat, 0, sizeof rlat); iut_validate_lattice(lat, &rlat);
    const iut_link *tlink = NULL;
    for (unsigned k = 0; k < lat->nlinks; ++k) if (lat->links[k].kind != IUT_LINK_LOG) tlink = &lat->links[k];
    unsigned nlog = 0; for (unsigned k = 0; k < lat->nlinks; ++k) nlog += lat->links[k].kind == IUT_LINK_LOG;

    /* ---- stage 5 */
    iut_multiradial_full *mr = calloc(1, sizeof *mr);
    if (!mr) { iut_lattice_free(lat); free(lat); return 1; }
    iut_multiradial_full_build(lat, 0, mr);
    iut_named_value c312[8]; unsigned nc312 = iut_cor312_steps(lat, c312, 8);
    int c312ok = iut_cor312_holds(lat);
    iut_pilot qp, tp; iut_pilot_make(d, IUT_PILOT_Q, &qp); iut_pilot_make(d, IUT_PILOT_THETA, &tp);
    iut_hull_bound HB; iut_hull_bound_compute(d, &HB);     /* [IUTchIV] Thm 1.10, Steps (iv)–(viii), place by place */

    /* ---- stage 6 */
    iut_thm110 T; iut_thm110_compute(d, &T);
    iut_cor22 C; iut_cor22_compute(d, &C);

    /* ---- stage 7 */
    xcheck xc[4]; unsigned nxc = 0, xbad = 0;
    if (d->have_expected) {
        double lq = iut_log_q(d);
        xc[nxc++] = (xcheck){ "log(q)  = Σ_{V^bad_mod} ord(q_v) log p_v", lq, d->expected_logq, 0 };
        xc[nxc++] = (xcheck){ "|log(q)| = log(q)/2l", lq / (2.0 * d->l), d->expected_abslogq, 0 };
        xc[nxc++] = (xcheck){ "log(f) over V^bad_mod", iut_log_cond_bad(d), d->expected_logcond, 0 };
        xc[nxc++] = (xcheck){ "ht = log(q)/6", iut_height_from_q(d), d->expected_ht, 0 };
        for (unsigned k = 0; k < nxc; ++k) { xc[k].ok = fabs(xc[k].toolkit - xc[k].file) < 5e-6; xbad += !xc[k].ok; }
    }

    /* V^bad_mod indices */
    unsigned bad[IUT_MAX_V], nbad = 0;
    for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].in_Vbad_mod) bad[nbad++] = i;
    unsigned twol = 2 * d->l;
    IUT_GAP("CrossCheckIsShallow");
    int hullbad = !HB.below_formula;   /* a second check: C_Θ computed place by place must lie below the C_Θ of the statement */
    int errors = (int)(rdata.errors + rht.errors + rlat.errors + xbad) + !c312ok + hullbad;
    char b1[48], b2[64], dg[160];

    if (!json) {
        fprintf(f, "IUT pipeline   %s\n", d->name);
        fprintf(f, "  source: %s   curve: %s   l = %u   rows ±%d   horizontal: %s\n\n",
                d->from_json ? d->source_id : "generated by the toolkit", d->curve, d->l, rows, iut_link_kind_notation(lat->horizontal));

        fprintf(f, "── stage 0 ── initial Θ-data ─────────────────────────────────────────── [IUTchI] Def 3.1\n");
        iut_view_data(f, d);
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            if (!v->q_prec) continue;
            digits(v->q_unit, v->p, v->q_prec, dg, sizeof dg);
            fprintf(f, "  Tate param: q_%s = %u^%u · u,   u ≡ %llu mod %u^%u   (base-%u digits %s)\n", v->name, v->p, v->ordq, v->q_unit, v->p, v->q_prec, v->p, dg);
        }
        fprintf(f, "  ε̲         : the cusp ±%d of C̲_K   ([IUTchI] Def 3.1 (f): from a nonzero element of Q ≅ Z/%uZ)\n", d->epsilon, d->l);
        iut_view_gaps_stage(f, 0); fputc('\n', f);

        fprintf(f, "── stage 1 ── conditions (a)–(f) ─────────────────────────────────────── [IUTchI] Def 3.1\n");
        for (unsigned k = 0; k < nitems && k < 8; ++k) fprintf(f, "  %s %s  %s\n      %s\n", ck(items[k].ok), items[k].item, items[k].condition, items[k].detail);
        fprintf(f, "  validation: %u error(s), %u warning(s), %u checks\n", rdata.errors, rdata.warnings, rdata.n);
        for (unsigned k = 0; k < rdata.n; ++k) if (rdata.issue[k].sev >= IUT_SEV_WARN) fprintf(f, "    [%s] %s: %s\n", rdata.issue[k].sev == IUT_SEV_ERROR ? "ERROR" : "WARN", rdata.issue[k].condition, rdata.issue[k].msg);
        iut_view_gaps_stage(f, 1); fputc('\n', f);

        fprintf(f, "── stage 2 ── Hodge theaters ───────────────────────────────── [IUTchI] §3–§6, Def 6.13\n");
        fprintf(f, "  Θ±ell-Hodge theater   capsule F_T of %u F-prime-strips, t ∈ F_%u, symmetry F_l^{⋊±} of order %u (orbit of t=0: %u)\n",
                ht->pmell.nT, d->l, 2 * d->l, iut_label_orbit_FlSemiPm(d, 0));
        fprintf(f, "    t:          "); for (unsigned i = 0; i < ht->pmell.nT; ++i) fprintf(f, "%6d", ht->pmell.T[i].label); fputc('\n', f);
        fprintf(f, "    basepoint:  "); for (unsigned i = 0; i < ht->pmell.nT; ++i) fprintf(f, "%6u", ht->pmell.T[i].basepoint); fputc('\n', f);
        fprintf(f, "    Θ±-bridge F_T → F_⊞ %s   Θell-bridge D_T → D_⊚± %s\n", ck(ht->pmell.theta_pm_bridge_ok), ck(ht->pmell.theta_ell_bridge_ok));
        fprintf(f, "  ΘNF-Hodge theater     capsule F_J of %u F-prime-strips, j ∈ F_l^*, symmetry F_l^* of order %u (orbit of j=1: %u)\n",
                ht->nf.nJ, d->lstar, iut_label_orbit_FlStar(d, 1));
        fprintf(f, "    j:          "); for (unsigned i = 0; i < ht->nf.nJ; ++i) fprintf(f, "%6d", ht->nf.J[i].label); fputc('\n', f);
        fprintf(f, "    Θ-bridge F_J → F_> %s   NF-bridge F_J → F_⊛ %s\n", ck(ht->nf.theta_bridge_ok), ck(ht->nf.nf_bridge_ok));
        fprintf(f, "  gluing 0,⊞ ↦ >        %s   F_l^× ↠ F_l^*:", ck(ht->glued));
        for (int t = 1; t <= (int)d->lstar; ++t) fprintf(f, "  ±%d ↦ %d", t, iut_label_glue_pm_to_nf(d, t));
        fprintf(f, "   (0 ↦ >)\n");
        fprintf(f, "  Θ-Hodge theater at V^bad: q̲_v = q_v^{1/2l}, Θ̲_v evaluated at j ∈ F_l^* is q̲_v^{j²}\n");
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            qfmt(iut_q_make((long)v->ordq, (long)twol), b1, sizeof b1);
            fprintf(f, "    %-6s ord(q_v) = %u   ord(q̲_v) = %u/%u = %s\n", v->name, v->ordq, v->ordq, twol, b1);
        }
        fprintf(f, "  prime-strips at (0,0): F_⊞, D_⊚±, F_>, F_⊛, F⊩_mod, F⊩_tht, F⊩_Δ, F⊩_env, F⊩_gau, F⊩_LGP, F⊩_lgp  (each indexed by the %u places of V)\n", d->nV);
        fprintf(f, "  validation of the Θ±ell NF-Hodge theater: %u error(s) in %u checks\n", rht.errors, rht.n);
        for (unsigned k = 0; k < rht.n; ++k) if (rht.issue[k].sev == IUT_SEV_ERROR) fprintf(f, "    [ERROR] %s: %s\n", rht.issue[k].condition, rht.issue[k].msg);
        iut_view_gaps_stage(f, 2); fputc('\n', f);

        fprintf(f, "── stage 3 ── Gaussian monoids (theta values) ─────────── [IUTchII] Cor 2.5, 3.5, 4.10\n");
        fprintf(f, "  θ evaluated at the l = %u evaluation points t ∈ F_l gives q̲_v^{t²} up to μ_%u; it depends on |t| only.\n", d->l, twol);
        fprintf(f, "  Ψ_gau at v ∈ V^bad = O× · (q̲_v^{j²})_{j=1..%u}.  ord_v(q̲_v^{j²}) = j²·ord(q_v)/%u.\n", d->lstar, twol);
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            fprintf(f, "  v = %s (p = %u, ord q_v = %u)\n", v->name, v->p, v->ordq);
            fprintf(f, "    %3s %5s %14s %12s", "j", "j²", "ord(q̲^{j²})", "ord(q^{j²})");
            if (v->q_prec) fprintf(f, "   unit of q_v^{j²} mod %u^%u (base-%u digits)", v->p, v->q_prec, v->p);
            fputc('\n', f);
            for (unsigned j = 1; j <= d->lstar; ++j) {
                qfmt(iut_q_make((long)(j * j * v->ordq), (long)twol), b1, sizeof b1);
                fprintf(f, "    %3u %5u %14s %12u", j, j * j, b1, j * j * v->ordq);
                if (v->q_prec) { unsigned long long u = iut_tate_unit_pow(v, (unsigned long long)j * j); digits(u, v->p, v->q_prec, dg, sizeof dg); fprintf(f, "   %llu  (%s)", u, dg); }
                fputc('\n', f);
            }
        }
        fprintf(f, "  log-volumes (normalized, [IUTchIII] Prop 3.9):  −(j²/2l)·log q for j = 1..%u:", d->lstar);
        for (unsigned j = 1; j <= d->lstar; ++j) fprintf(f, " %.4f", -((double)j * j / twol) * iut_log_q(d));
        fprintf(f, "\n  q-pilot {q̲_v}: −|log q| = %.6f      Θ-pilot {q̲_v^{j²}}: −avg(j²)·|log q| = −(l(l+1)/12)·|log q| = %.6f\n", qp.log_volume, tp.log_volume);
        IUT_GAP("ThetaValuesOrdersOnly");
        iut_view_gaps_stage(f, 3); fputc('\n', f);

        fprintf(f, "── stage 4 ── log-theta-lattice ────────────────────────── [IUTchIII] Def 1.1, 1.4, 3.8\n");
        iut_view_lattice(f, lat);
        if (tlink) {
            fprintf(f, "\n  %s (%d,%d) → (%d,%d): glues %s-prime-strips, full poly-isomorphism %s\n", iut_link_kind_notation(tlink->kind), tlink->dom_n, tlink->dom_m, tlink->cod_n, tlink->cod_m, iut_ps_kind_notation(tlink->glued_kind), ck(tlink->full_poly_isomorphism));
            fprintf(f, "    shares G_v %s, O×μ %s; Π_v %s (mutually alien), ring structure %s; value-group dilation l(l+1)/12 = %.4f\n",
                    ck(tlink->preserves_G), ck(tlink->preserves_units_mod_tors), tlink->preserves_Pi ? "shared" : "NOT shared", tlink->preserves_ring_structure ? "kept" : "NOT kept", tlink->dilation);
            for (unsigned k = 0; k < nbad; ++k) {
                unsigned i = bad[k];
                const iut_local_datum *A = &ht->FMonoGlobLGP.loc[i], *B = &ht1->FMonoGlobTriangle.loc[i];
                fprintf(f, "    %-6s left (0,0) F⊩_LGP O▶{", d->V[i].name);
                for (unsigned g = 0; g < A->nval; ++g) { qfmt(A->val[g], b1, sizeof b1); fprintf(f, "%sq̲^%s", g ? "," : "", b1); }
                fprintf(f, "} ↦ right (1,0) F⊩_Δ O▶{");
                for (unsigned g = 0; g < B->nval; ++g) { qfmt(B->val[g], b1, sizeof b1); fprintf(f, "%sq̲^%s", g ? "," : "", b1); }
                fprintf(f, "};  O×μ #%u = #%u %s;  Π_v #%u vs #%u\n", A->units_copy, B->units_copy, ck(A->units_copy == B->units_copy),
                        ht->nf.FGt.loc[i].Pi_copy, ht1->nf.FGt.loc[i].Pi_copy);
            }
        }
        fprintf(f, "  log-links: %u (columns n = 0, 1; rows %d..%d). Each one identifies Π_v (vertical coricity) and builds the log-shells of its codomain:\n", nlog, -rows, rows);
        fprintf(f, "    (I_v ⊇ the module shown.  \"exact\": K_v is written down (p ∤ 30l, iut_local_field_K) and μ_log(I_v) is its true value;\n     \"model\": e and m are the lower bounds forced by the roots of unity and by q̲_v ∈ K_v)\n");
        fprintf(f, "    %-6s %4s %10s %14s  %-6s %-22s %s\n", "v", "p*", "I_v ⊇", "μ_log(I_v)", "", "K_v/Q_p: e, f, m, d", "Π_v at (0,0) = at (0,1)?");
        for (unsigned i = 0; i < htup->nshell; ++i) {
            const iut_log_shell *S = &htup->shell[i]; const iut_valuation *v = &d->V[S->v_index];
            if (v->kind == IUT_V_ARCH) { fprintf(f, "    %-6s %4s %10s %14s  %-6s %-22s %s\n", v->name, "-", "π-disc", "0", "", "-", ck(ht->nf.FGt.loc[i].Pi_copy == htup->nf.FGt.loc[i].Pi_copy)); continue; }
            qfmt(S->radius, b1, sizeof b1); snprintf(b2, sizeof b2, "p^{%s}·O", b1);
            { int x = v->K_exact, ex = (x & IUT_KX_E) && (x & IUT_KX_M); char kv[64]; int w;
              if (x & IUT_KX_D) w = snprintf(kv, sizeof kv, "%u, %s%u, %s%u, %.4f", v->e_K, (x & IUT_KX_F) ? "" : "≥", v->f_K, (x & IUT_KX_M) ? "" : "≥", v->m_K, v->d_K);
              else              w = snprintf(kv, sizeof kv, "≥%u, ≥%u, ≥%u, ?", v->e_K, v->f_K, v->m_K);
              int nb = 0; for (int q = 0; q < w; ++q) if (((unsigned char)kv[q] & 0xC0) == 0x80) ++nb;   /* pad by display width */
              fprintf(f, "    %-6s %4u %10s %+14.6f  %-6s %-*s ", v->name, S->pstar, b2, S->log_volume, ex ? "exact" : "model", 22 + nb, kv); }
            fprintf(f, "%s\n", ck(ht->nf.FGt.loc[i].Pi_copy == htup->nf.FGt.loc[i].Pi_copy));
        }
        fprintf(f, "  validation of the lattice: %u error(s) in %u checks\n", rlat.errors, rlat.n);
        for (unsigned k = 0; k < rlat.n; ++k) if (rlat.issue[k].sev == IUT_SEV_ERROR || rlat.issue[k].sev == IUT_SEV_INFO) fprintf(f, "    [%s] %s\n", rlat.issue[k].sev == IUT_SEV_ERROR ? "ERROR" : "info", rlat.issue[k].msg);
        iut_view_gaps_stage(f, 4); fputc('\n', f);

        fprintf(f, "── stage 5 ── multiradial representation, Cor 3.12 ───────── [IUTchIII] Thm 3.11, Cor 3.12\n");
        fprintf(f, "  procession S^±_{j+1} = {0..j} of tensor packets of log-shells, j = 0..l* = %u:\n", d->lstar);
        fprintf(f, "    (leading terms use the estimate log d^K ≈ %.4f; the last column is the bound of Thm 1.10, Step (v)–(vii), before the average over j)\n", d->logdK);
        fprintf(f, "    %3s %5s %10s %16s %16s %16s %18s\n", "j", "|S|", "(j+1)!", "(j+1)·log d^K", "−(j²/2l)·log q", "leading sum", "full bound at j");
        for (unsigned j = 0; j < mr->rep.nsteps; ++j) {
            const iut_procession_step *s = &mr->rep.step[j];
            fprintf(f, "    %3u %5u %10u %16.6f %16.6f %16.6f", s->j, s->size, s->perms, s->log_volume_leading, s->theta_shift, s->log_volume_leading + s->theta_shift);
            if (j >= 1) fprintf(f, " %18.6f\n", HB.per_j[j]); else fprintf(f, " %18s\n", "(j = 0: not averaged)");
        }
        fprintf(f, "  indeterminacies: (Ind1) |Aut(Prc)| = Π_j (j+1)! = %llu, (Ind2) Ism on %llu direct summands, (Ind3) upper semi-compatibility %s\n",
                mr->ind1_count, mr->ind2_summands, ck(mr->ind3));
        fprintf(f, "  (a) %u tensor packets, (b) %u splitting monoids, (c) %u copies of F_mod^×;  log-Kummer non-interference %s;  compatible with the Θ×μ_LGP-link %s\n",
                mr->npackets, mr->nsplitting, mr->nnumberfields, ck(mr->log_kummer_ok), ck(mr->link_compat[0] && mr->link_compat[1] && mr->link_compat[2] && mr->link_compat[3]));
        for (unsigned k = 0; k < nc312; ++k) fprintf(f, "  %-104s %16.6g   %s\n", c312[k].label, c312[k].value, c312[k].ref);
        fprintf(f, "  the hull bound, place by place ([IUTchIV] Thm 1.10, proof): l*_mod = log(e*_mod·l) = %.4f\n", HB.lstar_mod);
        fprintf(f, "    %-6s %-22s %12s %10s %9s %2s %14s   %s\n", "v_Q", "class", "log d^K_vQ ≤", "log q_vQ", "log s^Q", "ι", "bound", "source of the log d^K bound");
        for (unsigned k = 0; k < HB.nrows; ++k) {
            const iut_hull_row *R = &HB.row[k];
            char nm[16]; if (R->p) snprintf(nm, sizeof nm, "%u", R->p); else snprintf(nm, sizeof nm, "∞");
            int pad = 22; for (const unsigned char *c = (const unsigned char *)R->why; *c; ++c) if ((*c & 0xC0) == 0x80) pad++;   /* pad by display width, not bytes */
            if (R->kind == 0) fprintf(f, "    %-6s %-*s %12.4f %10.4f %9.4f %2d %14.4f   %s\n", nm, pad, R->why, R->logdK, R->logq, R->logs, R->iota, R->bound, R->logdK_src);
            else fprintf(f, "    %-*s %-22s %12s %10s %9s %2s %14.4f   %s\n", R->p ? 6 : 8, nm, R->kind == 1 ? "unramified in K" : "archimedean", "-", "-", "-", "-", R->bound, R->kind == 1 ? "Step (vi): Prop 1.4 (iv), the container is the packet itself" : "Step (vii): ((l+5)/4)·log π");
        }
        if (HB.unlocalized_logd > 0) fprintf(f, "    + ((l+5)/4)·log d^Ftpd = %.4f, not localized: the primes under the different of F_tpd are not in the data (bound incomplete)\n", HB.unlocalized_logd);
        fprintf(f, "    distinguished v_Q: ((l+5)/4)·log d^K_vQ − ((l+1)/24)·log q_vQ + log s^Q_vQ + (l+5)·l*_mod·ι     (Step (v))\n");
        fprintf(f, "  −|log Θ| ≤ B = %.6f%s;   C_Θ := B/|log q| = %.6g, against the C_Θ of the statement of Thm 1.10 = %.6g  %s\n", HB.total, HB.complete ? "" : " (incomplete)", HB.C_theta_local, HB.C_theta_formula, ck(HB.below_formula));
        fprintf(f, "  Cor 3.12 is an input here, not something this program verifies.  Its consequence B ≥ −|log q|: %.6f ≥ %.6f  %s\n", HB.total, -HB.abs_logq, c312ok ? "consistent ✓" : "NOT consistent ✗");
        iut_view_gaps_stage(f, 5); fputc('\n', f);

        fprintf(f, "── stage 6 ── the height bound ───────────────────────────── [IUTchIV] Thm 1.10, Cor 2.2\n");
        fprintf(f, "  log q = %.6f   |log q| = %.6f   log d^Ftpd = %.6f   log f^Ftpd = %.6f   e*_mod = %.0f   η_prm = %.3g\n", T.logq, T.abs_logq, T.logd_tpd, T.logf_tpd, T.estar_mod, T.eta_prm);
        fprintf(f, "  hypotheses of Thm 1.10 beyond Def 3.1:  l ≥ 7 %s   good reduction away from 2l outside V^bad %s   F = F_mod(√−1, E[2·3·5]) %s (asserted)\n", ck(T.hyp_l_not_five), ck(T.hyp_good_away_from_2l), ck(T.hyp_F_is_tripod_extension));
        if (!T.hypotheses_ok) fprintf(f, "  Thm 1.10 does NOT apply to this data: the numbers below are its formulas evaluated, not a statement about the curve.\n");
        fprintf(f, "  C_Θ = %.6g (≥ −1 %s)\n", T.C_theta, ck(T.cor312_holds));
        fprintf(f, "  Thm 1.10:  (1/6)·log q = %.6f  ≤  (1 + 20·d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod·l + η_prm) = %.6g   %s\n", T.lhs, T.rhs, ck(T.inequality_holds));
        fprintf(f, "  Cor 2.2:   log q∀ = %.6f (2 included); (C1) wants %.3f ≤ l ≤ %.4g: l = %u %s;  ε_E = %.4g;  (C2) %.6f ≤ %.6g %s\n",
                C.logq_all, C.l_min, C.l_max, d->l, C.l_in_range ? "in range" : "out of range", C.eps_E, C.lhs, C.rhs, ck(C.holds));
        if (T.constant_dominates)
            fprintf(f, "  Thm 1.10 holds here only as a comparison with its constant: main term %.6f, constant 20(e*_mod·l + η_prm) = %.6g.\n", T.main_term, T.const_term);
        if (C.in_exceptional_set)
            fprintf(f, "  Cor 2.2 asserts nothing about this curve: it is in the exceptional set Exc (%s%s%s; (log q∀)^{1/2} = %.3f, ξ_prm + η_prm ≥ %.3g).\n",
                    C.eps_small ? "" : "ε_E > 1", C.eps_small || C.s1_ok ? "" : ", ", C.s1_ok ? "" : "(log q∀)^{1/2} < ξ_prm + η_prm", C.sqrt_h, C.s1_threshold);
        { int win = 0; unsigned la = iut_choose_l(d, &win);
          if (la) fprintf(f, "  the proof of Cor 2.2 would take a prime with (P1)–(P3); the smallest one ≥ 7 is l = %u%s.\n", la, la == d->l ? " (the l of this run)" : "");
          else fprintf(f, "  no prime l ≤ %d satisfies (P1)–(P3) of the proof of Cor 2.2 for this curve.\n", IUT_MAX_L); }
        iut_view_gaps_stage(f, 6); fputc('\n', f);

        if (nxc) {
            fprintf(f, "── stage 7 ── cross-check with %s.json ─────────────────────────────\n", d->source_id);
            for (unsigned k = 0; k < nxc; ++k) fprintf(f, "  %s %-42s toolkit %.6f   file %.6f\n", ck(xc[k].ok), xc[k].what, xc[k].toolkit, xc[k].file);
            iut_view_gaps_stage(f, 7); fputc('\n', f);
        }
        { unsigned nopen = 0; for (size_t k = 0; k < iut_gaps_count; ++k) nopen += iut_gaps[k].status != IUT_GAP_FIXED;
          fprintf(f, "pipeline %s: %d problem(s)  (Def 3.1: %u, Hodge theater: %u, lattice: %u, consequence of Cor 3.12: %s, hull bound vs Thm 1.10: %s, cross-check: %u)\n",
                errors ? "FAILED" : "complete", errors, rdata.errors, rht.errors, rlat.errors, c312ok ? "consistent" : "NOT consistent", hullbad ? "ABOVE" : "below", xbad);
          fprintf(f, "%u placeholder(s) stand in for parts of the theory that are not computed (`iut gaps`): \"complete\" means every stage ran, not that the theory was verified.\n", nopen); }
    } else {
        fprintf(f, "{\n  \"schema\": \"iut-pipeline/1\",\n  \"source\": "); jstr(f, d->from_json ? d->source_id : "generated");
        fprintf(f, ",\n  \"name\": "); jstr(f, d->name);
        fprintf(f, ",\n  \"rows\": %d, \"horizontal\": \"%s\",\n  \"problems\": %d,\n", rows, iut_link_kind_id(lat->horizontal), errors);
        /* stage 0 */
        fprintf(f, "  \"data\": ");
        iut_json_data(f, d);
        /* stage 1 */
        fprintf(f, "  ,\"defThreeOne\": {\"items\": [");
        for (unsigned k = 0; k < nitems && k < 8; ++k) { fprintf(f, "%s\n    {\"item\": ", k ? "," : ""); jstr(f, items[k].item); fprintf(f, ", \"ok\": %s, \"condition\": ", tf(items[k].ok)); jstr(f, items[k].condition); fprintf(f, ", \"detail\": "); jstr(f, items[k].detail); fputc('}', f); }
        fprintf(f, "],\n    \"errors\": %u, \"warnings\": %u, \"checks\": %u, \"issues\": [", rdata.errors, rdata.warnings, rdata.n);
        { int first = 1; for (unsigned k = 0; k < rdata.n; ++k) if (rdata.issue[k].sev >= IUT_SEV_WARN) { fprintf(f, "%s{\"severity\": \"%s\", \"condition\": ", first ? "" : ", ", rdata.issue[k].sev == IUT_SEV_ERROR ? "error" : "warning"); jstr(f, rdata.issue[k].condition); fprintf(f, ", \"msg\": "); jstr(f, rdata.issue[k].msg); fputc('}', f); first = 0; } }
        fprintf(f, "]},\n");
        /* stage 2 */
        fprintf(f, "  \"hodgeTheater\": {\n    \"T\": [");
        for (unsigned i = 0; i < ht->pmell.nT; ++i) fprintf(f, "%s{\"t\": %d, \"basepoint\": %u}", i ? ", " : "", ht->pmell.T[i].label, ht->pmell.T[i].basepoint);
        fprintf(f, "],\n    \"J\": [");
        for (unsigned i = 0; i < ht->nf.nJ; ++i) fprintf(f, "%s{\"j\": %d, \"basepoint\": %u}", i ? ", " : "", ht->nf.J[i].label, ht->nf.J[i].basepoint);
        fprintf(f, "],\n    \"symmetryPmOrder\": %u, \"symmetryStarOrder\": %u,\n    \"bridges\": {\"ThetaPm\": %s, \"ThetaEll\": %s, \"Theta\": %s, \"NF\": %s}, \"glued\": %s,\n    \"gluing\": [",
                2 * d->l, d->lstar, tf(ht->pmell.theta_pm_bridge_ok), tf(ht->pmell.theta_ell_bridge_ok), tf(ht->nf.theta_bridge_ok), tf(ht->nf.nf_bridge_ok), tf(ht->glued));
        for (int t = -(int)d->lstar; t <= (int)d->lstar; ++t) fprintf(f, "%s[%d, %d]", t > -(int)d->lstar ? ", " : "", t, iut_label_glue_pm_to_nf(d, t));
        fprintf(f, "],\n    \"thetaHT\": [");
        for (unsigned k = 0; k < nbad; ++k) { const iut_valuation *v = &d->V[bad[k]]; fprintf(f, "%s{\"v\": \"%s\", \"p\": %u, \"ordQ\": %u, \"ordQUnder\": [%u, %u]}", k ? ", " : "", v->name, v->p, v->ordq, v->ordq, twol); }
        fprintf(f, "],\n    \"errors\": %u, \"checks\": %u\n  },\n", rht.errors, rht.n);
        /* stage 3 */
        fprintf(f, "  \"gaussian\": {\"evaluationPoints\": %u, \"muOrder\": %u, \"places\": [", d->l, twol);
        for (unsigned k = 0; k < nbad; ++k) {
            const iut_valuation *v = &d->V[bad[k]];
            fprintf(f, "%s\n    {\"v\": \"%s\", \"p\": %u, \"ordQ\": %u, \"precision\": %u, \"qUnit\": \"%llu\", \"rows\": [", k ? "," : "", v->name, v->p, v->ordq, v->q_prec, v->q_unit);
            for (unsigned j = 1; j <= d->lstar; ++j) {
                iut_q o = iut_q_make((long)(j * j * v->ordq), (long)twol);
                fprintf(f, "%s{\"j\": %u, \"jSq\": %u, \"ordQUnderPow\": [%ld, %ld], \"ordQPow\": %u", j > 1 ? ", " : "", j, j * j, o.num, o.den, j * j * v->ordq);
                if (v->q_prec) fprintf(f, ", \"unitPow\": \"%llu\"", iut_tate_unit_pow(v, (unsigned long long)j * j));
                fputc('}', f);
            }
            fprintf(f, "]}");
        }
        fprintf(f, "],\n    \"logVolumes\": [");
        for (unsigned j = 1; j <= d->lstar; ++j) { fprintf(f, "%s", j > 1 ? ", " : ""); jnum(f, -((double)j * j / twol) * iut_log_q(d)); }
        fprintf(f, "], \"qPilot\": "); jnum(f, qp.log_volume); fprintf(f, ", \"thetaPilot\": "); jnum(f, tp.log_volume);
        fprintf(f, "},\n");
        /* stage 4 */
        fprintf(f, "  \"lattice\": {\"vertices\": %u, \"logLinks\": %u, \"errors\": %u, \"checks\": %u,\n    \"thetaLink\": ", lat->next_universe, nlog, rlat.errors, rlat.n);
        if (tlink) {
            fprintf(f, "{\"kind\": \"%s\", \"notation\": ", iut_link_kind_id(tlink->kind)); jstr(f, iut_link_kind_notation(tlink->kind));
            fprintf(f, ", \"dom\": [%d, %d], \"cod\": [%d, %d], \"glued\": \"%s\", \"sharesG\": %s, \"sharesUnits\": %s, \"sharesPi\": %s, \"keepsRing\": %s, \"dilation\": ",
                    tlink->dom_n, tlink->dom_m, tlink->cod_n, tlink->cod_m, iut_ps_kind_id(tlink->glued_kind), tf(tlink->preserves_G), tf(tlink->preserves_units_mod_tors), tf(tlink->preserves_Pi), tf(tlink->preserves_ring_structure));
            jnum(f, tlink->dilation);
            fprintf(f, ", \"places\": [");
            for (unsigned k = 0; k < nbad; ++k) {
                unsigned i = bad[k]; const iut_local_datum *A = &ht->FMonoGlobLGP.loc[i], *B = &ht1->FMonoGlobTriangle.loc[i];
                fprintf(f, "%s{\"v\": \"%s\", \"left\": [", k ? ", " : "", d->V[i].name);
                for (unsigned g = 0; g < A->nval; ++g) fprintf(f, "%s%ld", g ? ", " : "", A->val[g].num);
                fprintf(f, "], \"right\": [");
                for (unsigned g = 0; g < B->nval; ++g) fprintf(f, "%s%ld", g ? ", " : "", B->val[g].num);
                fprintf(f, "], \"unitsShared\": %s, \"piLeft\": %u, \"piRight\": %u}", tf(A->units_copy == B->units_copy), ht->nf.FGt.loc[i].Pi_copy, ht1->nf.FGt.loc[i].Pi_copy);
            }
            fprintf(f, "]}");
        } else fprintf(f, "null");
        fprintf(f, ",\n    \"logShells\": [");
        for (unsigned i = 0; i < htup->nshell; ++i) {
            const iut_log_shell *S = &htup->shell[i]; const iut_valuation *v = &d->V[S->v_index];
            fprintf(f, "%s{\"v\": \"%s\", \"p\": %u, \"pstar\": %u, \"radius\": [%ld, %ld], \"logVolume\": ", i ? ", " : "", v->name, v->p, S->pstar, S->radius.num, S->radius.den);
            jnum(f, S->log_volume);
            fprintf(f, ", \"exact\": %s, \"eK\": %u, \"fK\": %u, \"mK\": %u", tf((v->K_exact & IUT_KX_E) && (v->K_exact & IUT_KX_M)), v->e_K, v->f_K, v->m_K);
            if (v->K_exact & IUT_KX_D) { fprintf(f, ", \"dK\": "); jnum(f, v->d_K); }
            fprintf(f, ", \"piShared\": %s}", tf(ht->nf.FGt.loc[i].Pi_copy == htup->nf.FGt.loc[i].Pi_copy));
        }
        fprintf(f, "]},\n");
        /* stage 5 */
        fprintf(f, "  \"multiradial\": {\"procession\": [");
        for (unsigned j = 0; j < mr->rep.nsteps; ++j) {
            const iut_procession_step *s = &mr->rep.step[j];
            fprintf(f, "%s{\"j\": %u, \"size\": %u, \"perms\": %u, \"leading\": ", j ? ", " : "", s->j, s->size, s->perms); jnum(f, s->log_volume_leading);
            fprintf(f, ", \"thetaShift\": "); jnum(f, s->theta_shift); fputc('}', f);
        }
        fprintf(f, "],\n    \"ind1\": %llu, \"ind2Summands\": %llu, \"ind3\": %s, \"packets\": %u, \"splittingMonoids\": %u, \"numberFieldCopies\": %u, \"logKummer\": %s,\n    \"leadingTerm\": ",
                mr->ind1_count, mr->ind2_summands, tf(mr->ind3), mr->npackets, mr->nsplitting, mr->nnumberfields, tf(mr->log_kummer_ok));
        jnum(f, mr->rep.leading_term); fprintf(f, ", \"thetaUpperBound\": "); jnum(f, mr->rep.theta_upper_bound); fprintf(f, ", \"absLogQ\": "); jnum(f, mr->rep.abs_log_q);
        fprintf(f, ",\n    \"hull\": {\"lStarMod\": "); jnum(f, HB.lstar_mod); fprintf(f, ", \"total\": "); jnum(f, HB.total);
        fprintf(f, ", \"CThetaLocal\": "); jnum(f, HB.C_theta_local); fprintf(f, ", \"CThetaStatement\": "); jnum(f, HB.C_theta_formula);
        fprintf(f, ", \"belowStatement\": %s, \"consequenceHolds\": %s, \"complete\": %s, \"unlocalizedLogD\": ", tf(HB.below_formula), tf(HB.consequence_holds), tf(HB.complete)); jnum(f, HB.unlocalized_logd);
        fprintf(f, ",\n      \"perJ\": [");
        for (unsigned j = 1; j <= d->lstar; ++j) { fprintf(f, "%s", j > 1 ? ", " : ""); jnum(f, HB.per_j[j]); }
        fprintf(f, "],\n      \"rows\": [");
        for (unsigned k = 0; k < HB.nrows; ++k) {
            const iut_hull_row *R = &HB.row[k];
            fprintf(f, "%s\n        {\"p\": %u, \"kind\": \"%s\", \"why\": ", k ? "," : "", R->p, R->kind == 0 ? "distinguished" : R->kind == 1 ? "unramified" : "archimedean"); jstr(f, R->why);
            fprintf(f, ", \"logDK\": "); jnum(f, R->logdK); fprintf(f, ", \"logDKSource\": "); jstr(f, R->logdK_src ? R->logdK_src : "");
            fprintf(f, ", \"logQ\": "); jnum(f, R->logq); fprintf(f, ", \"logS\": "); jnum(f, R->logs); fprintf(f, ", \"iota\": %d, \"bound\": ", R->iota); jnum(f, R->bound); fputc('}', f);
        }
        fprintf(f, "]}");
        fprintf(f, ",\n    \"corThreeTwelve\": {\"holds\": %s, \"isInput\": true, \"steps\": [", tf(c312ok));
        for (unsigned k = 0; k < nc312; ++k) { fprintf(f, "%s\n      {\"label\": ", k ? "," : ""); jstr(f, c312[k].label); fprintf(f, ", \"value\": "); jnum(f, c312[k].value); fprintf(f, ", \"ref\": "); jstr(f, c312[k].ref); fputc('}', f); }
        fprintf(f, "]}},\n");
        /* stage 6 */
        fprintf(f, "  \"heightBound\": {\"logQ\": "); jnum(f, T.logq); fprintf(f, ", \"absLogQ\": "); jnum(f, T.abs_logq);
        fprintf(f, ", \"logDTpd\": "); jnum(f, T.logd_tpd); fprintf(f, ", \"logFTpd\": "); jnum(f, T.logf_tpd);
        fprintf(f, ", \"CTheta\": "); jnum(f, T.C_theta); fprintf(f, ", \"lhs\": "); jnum(f, T.lhs); fprintf(f, ", \"rhs\": "); jnum(f, T.rhs);
        fprintf(f, ", \"mainTerm\": "); jnum(f, T.main_term); fprintf(f, ", \"constTerm\": "); jnum(f, T.const_term);
        fprintf(f, ", \"holds\": %s, \"constantDominates\": %s,\n    \"hypotheses\": {\"lAtLeastSeven\": %s, \"goodAwayFromTwoL\": %s, \"FIsTripodExtension\": %s, \"ok\": %s}, \"autoL\": %u,\n    \"corTwoTwo\": {\"logQAll\": ", tf(T.inequality_holds), tf(T.constant_dominates), tf(T.hyp_l_not_five), tf(T.hyp_good_away_from_2l), tf(T.hyp_F_is_tripod_extension), tf(T.hypotheses_ok), iut_choose_l(d, NULL)); jnum(f, C.logq_all);
        fprintf(f, ", \"lMin\": "); jnum(f, C.l_min); fprintf(f, ", \"lMax\": "); jnum(f, C.l_max);
        fprintf(f, ", \"lInRange\": %s, \"epsE\": ", tf(C.l_in_range)); jnum(f, C.eps_E);
        fprintf(f, ", \"lhs\": "); jnum(f, C.lhs); fprintf(f, ", \"rhs\": "); jnum(f, C.rhs); fprintf(f, ", \"holds\": %s, \"epsSmall\": %s, \"sOneOk\": %s, \"inExceptionalSet\": %s}},\n", tf(C.holds), tf(C.eps_small), tf(C.s1_ok), tf(C.in_exceptional_set));
        /* stage 7 */
        fprintf(f, "  \"crossCheck\": [");
        for (unsigned k = 0; k < nxc; ++k) { fprintf(f, "%s{\"what\": ", k ? ", " : ""); jstr(f, xc[k].what); fprintf(f, ", \"toolkit\": "); jnum(f, xc[k].toolkit); fprintf(f, ", \"file\": "); jnum(f, xc[k].file); fprintf(f, ", \"ok\": %s}", tf(xc[k].ok)); }
        fprintf(f, "],\n  \"gaps\": "); iut_json_gaps(f, -2);
        fprintf(f, "\n}\n");
    }
    free(mr);
    iut_lattice_free(lat); free(lat);
    return errors;
}
