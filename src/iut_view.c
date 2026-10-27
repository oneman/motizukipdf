/*
 * iut_view.c — plain-text renderers shared by the CLI (`iut walk`, …) and the
 * ncurses TUI, which renders them into a memory stream and pages through them.
 */
#include <math.h>
#include <string.h>
#include "iut.h"

static const char *redname(iut_reduction r) { return r == IUT_RED_GOOD ? "good" : r == IUT_RED_BAD_MULT ? "bad mult." : "bad add."; }

void iut_view_data(FILE *f, const iut_initial_theta_data *d)
{
    fprintf(f, "Initial Θ-data  (F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)      [IUTchI] Def 3.1\n");
    fprintf(f, "  name      : %s\n  curve     : %s\n", d->name, d->curve);
    fprintf(f, "  fields    : F_mod ⊆ F ⊆ K = F(E[l]) ⊆ F̄     [F_mod:Q]=%u  [F:Q]≤%llu  [K:Q]≤%llu\n", d->dmod, d->dF, d->dK);
    fprintf(f, "  l         : %u   (l* = %u, l± = %u)   ε̲ = %d\n", d->l, d->lstar, d->lpm, d->epsilon);
    fprintf(f, "  log(q)    : %.4f   |log(q)| = log(q)/2l = %.4f   ht_E = log(q)/6 = %.4f\n", iut_log_q(d), d->l ? iut_log_q(d) / (2.0 * d->l) : 0, iut_height_from_q(d));
    fprintf(f, "  log(f)    : %.4f   log(d^Ftpd) = %.4f   log(d^K) ≈ %.4f   h(j) ≈ %.3f\n", iut_log_cond(d), d->logdF, d->logdK, d->j_log_height);
    fprintf(f, "  V ≅ V_mod : %u valuations\n", d->nV);
    fprintf(f, "    %-6s %-5s %-4s %-5s %-5s %-10s %-7s %s\n", "name", "kind", "p", "e/f_m", "e/f_K", "reduction", "ord(q)", "V^bad_mod");
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->kind == IUT_V_ARCH) fprintf(f, "    %-6s arc   -    -     -     -          -       -\n", v->name);
        else fprintf(f, "    %-6s non   %-4u %u/%-3u %u/%-3u %-10s %-7u %s\n", v->name, v->p, v->e_mod, v->f_mod, v->e_K, v->f_K, redname(v->red), v->ordq, v->in_Vbad_mod ? "yes" : "-");
    }
    fprintf(f, "  asserted  : F/F_mod Galois %s | E[6] ⊆ F %s | SL2 ⊆ image %s | stable red. %s | C_K K-core %s\n",
            d->h_F_galois_over_Fmod ? "✓" : "✗", d->h_F_contains_six_torsion ? "✓" : "✗", d->h_image_contains_SL2 ? "✓" : "✗", d->h_stable_reduction ? "✓" : "✗", d->h_CK_is_K_core ? "✓" : "✗");
    fprintf(f, "  labels    : F_l = {%d..%d}  |F_l| = {0..%u}  F_l^* = {1..%u}\n", -(int)d->lstar, (int)d->lstar, d->lstar, d->lstar);
    fprintf(f, "  symmetries: F_l^{⋊±} (additive, Θ±ell-HT)  acts on F_l;  F_l^* (multiplicative, ΘNF-HT) acts on F_l^*\n");
}

void iut_view_report(FILE *f, const iut_report *r)
{
    static const char *sev[] = { "  ok ", "info ", "WARN ", "ERROR" };
    fprintf(f, "Validation report: %u error(s), %u warning(s), %u checks\n", r->errors, r->warnings, r->n);
    for (unsigned i = 0; i < r->n; ++i)
        fprintf(f, "  [%s] %-22s %s   (%s)\n", sev[r->issue[i].sev], r->issue[i].condition, r->issue[i].msg, r->issue[i].ref);
}

void iut_view_prime_strip(FILE *f, const iut_prime_strip *ps, const iut_initial_theta_data *d)
{
    fprintf(f, "  %s-prime-strip  '%s'  [%s]  %s, %s%s\n", iut_ps_kind_notation(ps->kind), ps->label, iut_ps_kind_id(ps->kind),
            iut_ps_kind_is_etale_like(ps->kind) ? "étale-like" : "Frobenius-like", iut_ps_kind_is_mono_analytic(ps->kind) ? "mono-analytic" : "holomorphic",
            ps->has_global_realified ? ", + C⊩ (global realified Frobenioid)" : "");
    if (ps->has_global_realified) fprintf(f, "    pilot degree: %.4f\n", ps->global_degree);
    for (unsigned i = 0; i < ps->nV; ++i) {
        const iut_local_datum *L = &ps->loc[i];
        fprintf(f, "    %-6s", d->V[i].name);
        if (L->Pi_copy) fprintf(f, " Π_v#%-5u", L->Pi_copy); else fprintf(f, "  (no Π) ");
        fprintf(f, " G_v#%-5u", L->G_copy);
        if (L->units_copy) fprintf(f, " %s#%-5u", L->units_mod_tors ? "O×μ" : "O× ", L->units_copy);
        if (L->has_valgroup) {
            fprintf(f, " O▶{");
            for (unsigned k = 0; k < L->nval; ++k) { char b[24]; iut_q_fmt(L->val[k], b, sizeof b); fprintf(f, "%sq̲^%s", k ? "," : "", b); }
            fprintf(f, "}");
        }
        if (L->has_splitting) fprintf(f, " split");
        if (L->kummer_kind == 2) fprintf(f, " ×μ-Kummer(Ism)"); else if (L->kummer_kind == 1) fprintf(f, " ×-Kummer");
        fprintf(f, "\n");
    }
}

/* Fig 3.8 of [Alien] / Fig I1.4 of [IUTchI]: the Θ±ell NF-Hodge theater */
void iut_view_hodge_theater(FILE *f, const iut_hodge_theater *ht)
{
    const iut_initial_theta_data *d = ht->data;
    fprintf(f, "Θ±ell NF-Hodge theater  %sHT  at (n,m) = (%d,%d)   universe #%u   log-iterate %d\n", ht->copy_label[0] == 'D' && ht->copy_label[1] == 'a' ? "†" : (ht->copy_label[0] == 'D' && ht->copy_label[1] == 'd' ? "‡" : ""), ht->n, ht->m, ht->universe, ht->log_iterate);
    fprintf(f, "  [%s] = Θ±ell-HT  ⊔_{0,⊞ ↦ >}  ΘNF-HT                      [IUTchI] Def 6.13 (iii)\n\n", "ThetaPmEllNFHodgeTheater");
    /* capsules */
    fprintf(f, "  Θ±ell-HT  (symmetry F_l^{⋊±}, additive / geometric, conjugate synchronization)\n");
    fprintf(f, "    capsule F_T, t ∈ F_l :  ");
    for (unsigned i = 0; i < ht->pmell.nT; ++i) fprintf(f, "%s[%+d]", i ? " " : "", ht->pmell.T[i].label);
    fprintf(f, "\n    Θ±-bridge  F_T  → F_⊞   %s        Θell-bridge  D_T → D_⊚± (Π_{X_K})   %s\n", ht->pmell.theta_pm_bridge_ok ? "✓" : "✗", ht->pmell.theta_ell_bridge_ok ? "✓" : "✗");
    fprintf(f, "  ΘNF-HT    (symmetry F_l^*, multiplicative / arithmetic)\n");
    fprintf(f, "    capsule F_J, j ∈ F_l^*:  ");
    for (unsigned i = 0; i < ht->nf.nJ; ++i) fprintf(f, "%s[%d]", i ? " " : "", ht->nf.J[i].label);
    fprintf(f, "\n    Θ-bridge   F_J  → F_>   %s        NF-bridge    F_J → F_⊛ (Π_{C_K} ↷ F_mod^×)   %s\n", ht->nf.theta_bridge_ok ? "✓" : "✗", ht->nf.nf_bridge_ok ? "✓" : "✗");
    fprintf(f, "  gluing 0,⊞ ↦ > : %s    (F_l ⊇ F_l^× ↠ F_l^* ,  ±j ↦ j)\n\n", ht->glued ? "✓" : "✗");
    /* picture */
    fprintf(f, "          Θ±ell-HT                                   ΘNF-HT\n");
    fprintf(f, "      D_⊚± (Π_{X_K})                               F_⊛ (Π_{C_K}, F_mod^×)\n");
    fprintf(f, "          ↑ Θell-bridge                                ↑ NF-bridge\n");
    fprintf(f, "   [-l*]…[-1][0][+1]…[+l*]  = F_T    ↦ (0,⊞ ↦ >)    [1]…[l*] = F_J\n");
    fprintf(f, "          ↓ Θ±-bridge                                 ↓ Θ-bridge\n");
    fprintf(f, "         F_⊞  ═══════════════════ identified ════════  F_>  ⊇  F⊩_tht ← Θ-Hodge theater → F⊩_mod\n\n");
    /* Θ-Hodge theater values */
    fprintf(f, "  Θ-Hodge theater: Θ̲_v evaluated at j ∈ F_l^*:  ");
    for (unsigned j = 1; j <= d->lstar; ++j) { char b[24]; iut_q_fmt(ht->nf.tht.theta_value[j], b, sizeof b); fprintf(f, "%sq̲^%s", j > 1 ? ", " : "", b); }
    fprintf(f, "\n  q-pilot  {q̲_v}            log-vol −|log(q)| = %.4f    (in F⊩_Δ)\n", ht->q_pilot.log_volume);
    fprintf(f, "  Θ-pilot  {q̲_v^{j²}}_{j≤l*} naive log-vol  = %.4f    (in F⊩_gau / F⊩_LGP; = l(l+1)/12 · (−|log q|))\n\n", ht->theta_pilot.log_volume);
    /* strips */
    iut_view_prime_strip(f, &ht->pmell.DCircDotPm, d);
    iut_view_prime_strip(f, &ht->pmell.FBoxPlus, d);
    iut_view_prime_strip(f, &ht->nf.FGt, d);
    iut_view_prime_strip(f, &ht->nf.FCircAst, d);
    iut_view_prime_strip(f, &ht->nf.tht.FMonoGlobMod, d);
    iut_view_prime_strip(f, &ht->nf.tht.FMonoGlobTht, d);
    iut_view_prime_strip(f, &ht->FMonoGlobTriangle, d);
    iut_view_prime_strip(f, &ht->FMonoGlobLGP, d);
    /* log-shells */
    if (ht->has_incoming_log) {
        fprintf(f, "  log-shells I_v = (p*)^{-1}·log(O×_{K_v}) (codomain of log-link from (%d,%d)):\n", ht->n, ht->m - 1);
        for (unsigned i = 0; i < ht->nshell; ++i) {
            const iut_log_shell *S = &ht->shell[i]; char b[24]; iut_q_fmt(S->radius, b, sizeof b);
            if (d->V[S->v_index].kind == IUT_V_ARCH) fprintf(f, "    %-6s I_v = closed disc of radius π ⊆ C\n", d->V[S->v_index].name);
            else fprintf(f, "    %-6s p* = %-3u  I_v = p^{%s}·O_v   μ_log(I_v) = %+.4f   %s %s\n", d->V[S->v_index].name, S->pstar, b, S->log_volume, S->holomorphic ? "holomorphic" : "mono-analytic", S->etale_like ? "étale-like" : "Frobenius-like");
        }
    } else fprintf(f, "  (no log-shells yet: apply a log-link INTO this vertex)\n");
}

void iut_view_lattice(FILE *f, const iut_log_theta_lattice *lat)
{
    int nmin = IUT_LAT_N, nmax = -1, mmin = IUT_LAT_M, mmax = -1;
    for (int i = 0; i < IUT_LAT_N; ++i) for (int j = 0; j < IUT_LAT_M; ++j) if (lat->ht[i][j]) {
        if (i < nmin) nmin = i;
        if (i > nmax) nmax = i;
        if (j < mmin) mmin = j;
        if (j > mmax) mmax = j;
    }
    if (nmax < 0) { fprintf(f, "(empty lattice)\n"); return; }
    fprintf(f, "log-theta-lattice (%s horizontal; vertical = log-links)     [IUTchIII] Def 1.4, 3.8 (iii)\n", iut_link_kind_notation(lat->horizontal));
    fprintf(f, "   m\\n ");
    for (int i = nmin; i <= nmax; ++i) fprintf(f, "   %+d     ", i - IUT_LAT_NOFF);
    fprintf(f, "\n");
    for (int j = mmax; j >= mmin; --j) {
        /* vertical arrows row */
        if (j < mmax) {
            fprintf(f, "        ");
            for (int i = nmin; i <= nmax; ++i) {
                int has = 0;
                for (unsigned k = 0; k < lat->nlinks; ++k) if (lat->links[k].kind == IUT_LINK_LOG && lat->links[k].dom_n == i - IUT_LAT_NOFF && lat->links[k].dom_m == j - IUT_LAT_MOFF) has = 1;
                fprintf(f, "   %s      ", has ? "↑" : (lat->ht[i][j] ? "·" : " "));
            }
            fprintf(f, "\n");
        }
        fprintf(f, "  %+3d  ", j - IUT_LAT_MOFF);
        for (int i = nmin; i <= nmax; ++i) {
            const iut_hodge_theater *h = lat->ht[i][j];
            int focus = (i - IUT_LAT_NOFF == lat->focus_n && j - IUT_LAT_MOFF == lat->focus_m);
            int has = 0;
            for (unsigned k = 0; k < lat->nlinks; ++k) if (lat->links[k].kind != IUT_LINK_LOG && lat->links[k].dom_n == i - IUT_LAT_NOFF && lat->links[k].dom_m == j - IUT_LAT_MOFF) has = 1;
            if (h) fprintf(f, "%s%-5s%s", focus ? "[" : " ", h->copy_label[0] == 'N' ? "•" : (h->copy_label[0] == 'D' && h->copy_label[1] == 'a' ? "†•" : "‡•"), focus ? "]" : " ");
            else fprintf(f, "       ");
            fprintf(f, "%s", has ? "─Θ→" : "   ");
        }
        fprintf(f, "\n");
    }
    fprintf(f, "\n  • = Θ±ell NF-Hodge theater (its own universe / label)   † = (0,0)   ‡ = (1,0)   [ ] = focus\n");
    fprintf(f, "  ↑ = log-link (vertically coric: D-prime-strips shared)   ─Θ→ = %s (horizontally coric: F⊢×μ shared)\n", iut_link_kind_notation(lat->horizontal));
    fprintf(f, "  %u vertices, %u links. The diagram does NOT commute ([IUTchIII] Rem 1.4.1).\n", lat->next_universe, lat->nlinks);
}

/* dagger vs double-dagger across the Θ-link at (n,m) → (n+1,m): what is shared and what is alien */
void iut_view_alien(FILE *f, const iut_log_theta_lattice *lat, int n, int m)
{
    const iut_hodge_theater *A = iut_lattice_in_range(n, m) ? lat->ht[n + IUT_LAT_NOFF][m + IUT_LAT_MOFF] : NULL;
    const iut_hodge_theater *B = iut_lattice_in_range(n + 1, m) ? lat->ht[n + 1 + IUT_LAT_NOFF][m + IUT_LAT_MOFF] : NULL;
    const iut_initial_theta_data *d = &lat->data;
    fprintf(f, "Mutually alien copies across the %s  (%d,%d) → (%d,%d)        [Alien] §1, §3.6; [IUTchII] Cor 4.10\n", iut_link_kind_notation(lat->horizontal), n, m, n + 1, m);
    if (!A || !B) { fprintf(f, "  (both endpoints must exist: build the Θ-link first with `t`)\n"); return; }
    const iut_link *L = NULL;
    for (unsigned k = 0; k < lat->nlinks; ++k) if (lat->links[k].kind != IUT_LINK_LOG && lat->links[k].dom_n == n && lat->links[k].dom_m == m) L = &lat->links[k];
    if (!L) { fprintf(f, "  (no Θ-link applied here yet)\n"); return; }
    fprintf(f, "  †HT = %s (universe #%u)        ‡HT = %s (universe #%u)\n\n", A->copy_label, A->universe, B->copy_label, B->universe);
    fprintf(f, "  %-14s %-28s %-28s %s\n", "datum", "† (domain)  F⊩_LGP", "‡ (codomain) F⊩_Δ", "status");
    fprintf(f, "  %-14s %-28s %-28s %s\n", "--------------", "----------------------------", "----------------------------", "------------------------------");
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_local_datum *a = &A->FMonoGlobLGP.loc[i], *b = &B->FMonoGlobTriangle.loc[i];
        char va[64] = "", vb[64] = "";
        for (unsigned k = 0; k < a->nval && strlen(va) < 50; ++k) { char t[24]; iut_q_fmt(a->val[k], t, sizeof t); strcat(va, k ? "," : "q̲^{"); strcat(va, t); }
        if (a->nval) strcat(va, "}");
        for (unsigned k = 0; k < b->nval && strlen(vb) < 50; ++k) { char t[24]; iut_q_fmt(b->val[k], t, sizeof t); strcat(vb, k ? "," : "q̲^{"); strcat(vb, t); }
        if (b->nval) strcat(vb, "}");
        fprintf(f, "  %-14s Π_v#%-24u Π_v#%-24u %s\n", d->V[i].name, A->nf.FGt.loc[i].Pi_copy, B->nf.FGt.loc[i].Pi_copy, "ALIEN: ring/holomorphic structure not shared");
        fprintf(f, "  %-14s G_v#%-24u G_v#%-24u %s\n", "", a->G_copy, b->G_copy, a->G_copy == b->G_copy ? "shared (up to Aut(G_v): Ind1)" : "distinct");
        fprintf(f, "  %-14s O×μ#%-23u O×μ#%-23u %s\n", "", a->units_copy, b->units_copy, a->units_copy == b->units_copy ? "shared (up to Ism: Ind2)" : "distinct (Θ-link, not ×μ)");
        if (a->has_valgroup) fprintf(f, "  %-14s %-28s %-28s %s\n", "", va[0] ? va : "O▶ (good)", vb[0] ? vb : "O▶ (good)", va[0] ? "DILATED: {q̲^{j²}} ↦ {q̲}" : "-");
    }
    fprintf(f, "\n  gluing data of the %s ([IUTchII] Cor 4.10; [Alien] §3.6):\n", iut_link_kind_notation(L->kind));
    fprintf(f, "    (aΘ) G_v ↷ O×μ  of †F⊩_LGP   ≅   G_v ↷ O×μ  of ‡F⊩_Δ          — horizontally coric %s\n", L->preserves_units_mod_tors ? "✓" : "(Θ-link: only up to the ×μ step)");
    fprintf(f, "    (bΘ) {q̲_v^{j²}}_{j=1..l*}   ↦   {q̲_v}                            — value groups dilated by l(l+1)/12 = %.3f\n", L->dilation);
    fprintf(f, "    (cΘ) global realified Frobenioid  †C⊩  ≅  ‡C⊩                    — arithmetic degrees: † %.4f  vs  ‡ %.4f\n", A->FMonoGlobLGP.global_degree, B->FMonoGlobTriangle.global_degree);
    fprintf(f, "    Π_v  NOT identified: %s; ring structures NOT identified: %s; full poly-isomorphism: %s\n", L->preserves_Pi ? "✗ (bug)" : "✓", L->preserves_ring_structure ? "✗ (bug)" : "✓", L->full_poly_isomorphism ? "✓" : "✗");
    fprintf(f, "\n  Kummer-detachment: to compare † and ‡ one passes to the étale-like D⊢-prime-strips (bi-coric) and\n  reconstructs the Frobenius-like data up to (Ind1),(Ind2),(Ind3) — the multiradial representation.\n");
}

void iut_view_multiradial(FILE *f, const iut_multiradial_rep *rep, const iut_initial_theta_data *d)
{
    fprintf(f, "Multiradial representation R^LGP_{%d,◦} of the Θ-pilot       [IUTchIII] Thm 3.11, Cor 3.12; [IUTchIV] Thm 1.10\n", rep->n);
    fprintf(f, "  (a) tensor packets of log-shells over the processions S^±_{j+1} = {0..j}\n  (b) splitting monoids of the LGP-monoids: {q̲^{j²}}\n  (c) copies (F_mod^×)_j of the global number field\n");
    fprintf(f, "  indeterminacies: (Ind1) %s  (Ind2) %s  (Ind3) %s\n\n", rep->ind.ind1 ? "perms of S^±_{j+1}, Aut(G_v)" : "-", rep->ind.ind2 ? "Ism on O×μ" : "-", rep->ind.ind3 ? "upper semi-compatibility" : "-");
    fprintf(f, "  %-4s %-10s %-10s %-22s %-22s\n", "j", "|S±_{j+1}|", "(j+1)!", "hull  (j+1)·log d^K", "Θ-shift −(j²/2l)·log q");
    for (unsigned j = 0; j < rep->nsteps; ++j) {
        const iut_procession_step *s = &rep->step[j];
        fprintf(f, "  %-4u %-10u %-10u %-22.4f %-22.4f\n", s->j, s->size, s->perms, s->log_volume_leading, s->theta_shift);
    }
    fprintf(f, "\n  log(q) = %.4f   |log(q)| = log(q)/2l = %.4f   −|log(q)| = %.4f\n", rep->logq, rep->abs_log_q, -rep->abs_log_q);
    fprintf(f, "  Σ_{j=1}^{l*} [(j+1) log d^K − (j²/2l) log q] = %.4f   ≈ (l²/48)(6 log d^K − log q) = %.4f      [Alien] §3.7 (iv)\n", rep->leading_term, iut_leading_term(d));
    fprintf(f, "  procession-normalized (÷ l*):  hull enlargement %.4f,  −|log(Θ)| (leading-term heuristic) = %.4f\n", rep->hull_enlargement, rep->theta_upper_bound);
    fprintf(f, "  heuristic  −|log(Θ)| ≥ −|log(q)| :  %.4f ≥ %.4f  → %s\n", rep->theta_upper_bound, -rep->abs_log_q, rep->theta_upper_bound >= -rep->abs_log_q ? "holds" : "FAILS (Szpiro-violating data?)");
    fprintf(f, "  C_Θ ([IUTchIV] Thm 1.10, with e*_mod = 2^12·3^3·5·e_mod, η_prm = 5·10^20 [ExpEst]) = %.6g  →  C_Θ ≥ −1 %s\n", rep->C_theta, rep->C_theta >= -1 ? "✓" : "✗");
    fprintf(f, "  hence (1/6) log(q) ≤ (1 + 20 d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod·l + η_prm):  %.4f ≤ %.6g\n",
            rep->logq / 6.0, (1 + 20.0 * d->dmod / d->l) * (d->logdF + iut_log_cond(d)) + 20.0 * (4096.0 * 27 * 5 * d->l + 5e20));
    fprintf(f, "  overall: %s\n", rep->inequality_holds ? "inequality holds for this data" : "inequality FAILS for this data");
}

void iut_view_etale_picture(FILE *f, const iut_log_theta_lattice *lat)
{
    fprintf(f, "Étale-picture: the bi-coric D⊢-prime-strip at the centre, Hodge theaters as spokes   [IUTchIII] Cor 3.12; [IUTchI] Cor 6.10\n\n");
    int count = 0;
    for (int i = 0; i < IUT_LAT_N; ++i) for (int j = 0; j < IUT_LAT_M; ++j) if (lat->ht[i][j]) count++;
    fprintf(f, "                    (%d,◦) column                      (%d,◦) column\n", lat->focus_n, lat->focus_n + 1);
    fprintf(f, "            R^LGP_{%d,◦}  …  ↖        ↗  …  R^LGP_{%d,◦}\n", lat->focus_n, lat->focus_n + 1);
    fprintf(f, "                               ╲      ╱\n");
    fprintf(f, "                        ┌─────────────────┐\n");
    fprintf(f, "                        │  D⊢-prime-strip │   {G_v}_{v∈V}  +  mono-analytic log-shells I⊢_v\n");
    fprintf(f, "                        │   (bi-coric)    │   shared by ALL %d Hodge theaters built so far\n", count);
    fprintf(f, "                        └─────────────────┘\n");
    fprintf(f, "                               ╱      ╲\n");
    fprintf(f, "            {n,m}D-HT  …  ↙        ↘  …  {n',m'}D-HT\n\n");
    fprintf(f, "  Every spoke is a D-Θ±ell NF-Hodge theater (étale-like, vertically coric); the Frobenius-like\n");
    fprintf(f, "  data of each vertex is recovered from the core only up to (Ind1),(Ind2),(Ind3).\n");
    fprintf(f, "  Θ-link mutations: Π_v (holomorphic) is NOT part of the core; G_v and O×μ are (up to Ind1, Ind2).\n");
}

void iut_view_species(FILE *f)
{
    fprintf(f, "Species / mutations   ([IUTchIV] §3 Def 3.1, 3.3): the log-theta-lattice as a mutation-history\n\n");
    fprintf(f, "  %-36s %-34s %s\n", "species (C struct)", "notation", "ref");
    for (size_t i = 0; i < iut_species_count; ++i) fprintf(f, "  %-36s %-34s %s\n", iut_species_table[i].id, iut_species_table[i].name, iut_species_table[i].ref);
    fprintf(f, "\n  %-30s %-20s %-30s → %-30s %s\n", "mutation (C function)", "notation", "domain", "codomain", "core?");
    for (size_t i = 0; i < iut_mutation_count; ++i)
        fprintf(f, "  %-30s %-20s %-30s → %-30s %s\n", iut_mutation_table[i].id, iut_mutation_table[i].name, iut_mutation_table[i].dom, iut_mutation_table[i].cod, iut_mutation_table[i].is_core ? "yes" : "no");
    fprintf(f, "\n  mutation-history Γ of the infinite H:   (0,m) →log (0,m+1),  (1,m) →log (1,m+1),  (0,0) →Θ (1,0)\n");
    fprintf(f, "  observable/core: D⊢-prime-strip (all arrows isomorphisms)  ⇒  the étale-picture.\n");
}

void iut_view_idents(FILE *f, const char *filter)
{
    fprintf(f, "%-36s %-22s %-12s %s\n", "identifier (letters only)", "notation", "kind", "ref / description");
    for (size_t i = 0; i < iut_idents_count; ++i) {
        const iut_ident *x = &iut_idents[i];
        if (filter && *filter && !strstr(x->id, filter) && !strstr(x->notation, filter) && !strstr(x->kind, filter) && !strstr(x->desc, filter)) continue;
        fprintf(f, "%-36s %-22s %-12s %s — %s\n", x->id, x->notation, x->kind, x->ref, x->desc);
    }
}
