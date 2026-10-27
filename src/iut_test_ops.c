/*
 * iut_test_ops.c — self-tests of the operations layer (iut_ops.h), run by `iut selftest`.
 * Each check names the paper statement it exercises.
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

static int fails;
#define CHECK(cond, ...) do { if (cond) { fprintf(out, "  ok   " __VA_ARGS__); fputc('\n', out); } else { fails++; fprintf(out, "  FAIL " __VA_ARGS__); fputc('\n', out); } } while (0)

int iut_selftest_ops(FILE *out)
{
    fails = 0;
    fprintf(out, "iut selftest: operations layer\n");
    iut_initial_theta_data d; iut_gen_example(&d, 2);   /* abc(1,2400,2401), l = 13 */
    /* registry */
    CHECK(iut_process_count >= 50, "process registry has %zu entries", iut_process_count);
    for (size_t i = 0; i < iut_process_count; ++i) CHECK(iut_ident_find(iut_processes[i].id) != NULL && !strcmp(iut_ident_find(iut_processes[i].id)->kind, "process"), "process %s is in the identifier table as a process", iut_processes[i].id);
    { const char *papers[] = { "IUTchI", "IUTchII", "IUTchIII", "IUTchIV", "EssLgc", "Alien" }; for (int k = 0; k < 6; ++k) { int n = 0; for (size_t i = 0; i < iut_process_count; ++i) if (!strcmp(iut_processes[i].paper, papers[k])) n++; CHECK(n > 0, "%d process(es) from [%s]", n, papers[k]); } }
    CHECK(iut_process_find("maplabels") == &iut_processes[0], "process lookup is case-insensitive");
    { char *buf = NULL; size_t n = 0; FILE *m = open_memstream(&buf, &n); int f = iut_process_run_all(&d, m, NULL); fclose(m); CHECK(f == 0 && n > 1000, "all processes run on example 2 without failure (%zu bytes of output)", n); free(buf); }

    /* IUTchI */
    CHECK(iut_label_glue_pm_to_nf(&d, -4) == 4 && iut_label_glue_pm_to_nf(&d, 0) == 0 && iut_label_glue_pm_to_nf(&d, 7) == -1, "[IUTchI] Def 6.13: 0,⊞ ↦ >, t ↦ |t|, out of range rejected");
    CHECK(iut_label_FlUnits_to_FlStar(&d, -3) == 3 && iut_label_FlUnits_to_FlStar(&d, 0) == -1, "[IUTchI] F_l^× ↠ F_l^*");
    CHECK(iut_label_orbit_FlSemiPm(&d, 2) == 13 && iut_label_orbit_FlStar(&d, 2) == 6, "[IUTchI] Prop 6.6 / 4.9: orbits of size l and l*");
    { iut_labcusp pm, nf, fg; iut_labcusp_pm_make(&d, &pm); iut_labcusp_make(&d, &nf); iut_labcusp_forget_sign(&pm, &fg);
      CHECK(iut_labcusp_is_bijection(&pm, &d) && iut_labcusp_is_bijection(&nf, &d) && iut_labcusp_is_bijection(&fg, &d) && fg.n == d.lstar, "[IUTchI] Prop 6.5: LabCusp± ≅ F_l, LabCusp ≅ F_l^*, forgetting the sign"); }
    { iut_procession p; iut_procession_build(&d, IUT_PRC_PM, &p); int lab[IUT_MAX_LPM + 1]; unsigned n = iut_procession_capsule_labels(&p, 2, lab);
      CHECK(p.nsteps == d.lpm && p.size[p.nsteps - 1] == d.lpm && n == 3 && lab[0] == 0 && lab[2] == 2, "[IUTchI] Prop 6.9: Prc(D_T) has l± capsules, S±_3 = {0,1,2}");
      unsigned long a = 1; for (unsigned k = 1; k <= d.lpm; ++k) a *= iut_factorial(k); CHECK(p.automorphisms == a, "[IUTchI] Prop 6.9: |Aut Prc| = Π |S±_k|! = %lu", p.automorphisms);
      iut_procession_build(&d, IUT_PRC_NF, &p); CHECK(p.nsteps == d.lstar && p.first_label[0] == 1, "[IUTchI] Prop 4.11: Prc(D_J) has l* capsules starting at label 1"); }
    { unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(&d, 0, 0, &u); iut_capsule T, J; iut_capsule_from_T(ht, &T); iut_capsule_from_J(ht, &J);
      CHECK(T.n == d.l && J.n == d.lstar && iut_capsule_full_poly_iso_count(&J) == 720, "[IUTchI] §0: capsules F_T (l members), F_J (l* members, 6! poly-isos)");
      iut_capsule_morphism m = { 2, 3, { 0, 0 } }; CHECK(!iut_capsule_morphism_valid(&m), "[IUTchI] §0: a non-injective index map is not a capsule morphism");
      iut_bridge b; iut_bridge_build(ht, IUT_BRIDGE_THETA_PM, &b); CHECK(b.isos == (2UL << d.nV) && b.n_dom == d.l, "[IUTchI] Prop 6.6 (i): Θ±-bridge isomorphisms form a torsor over {±1} × {±1}^V (%lu)", b.isos);
      iut_bridge_build(ht, IUT_BRIDGE_THETA_ELL, &b); CHECK(b.isos == 2UL * d.l, "[IUTchI] Prop 6.6 (ii): Θell-bridge isomorphisms form an F_l^{⋊±}-torsor (2l)");
      iut_bridge_build(ht, IUT_BRIDGE_NF, &b); CHECK(b.isos == d.lstar, "[IUTchI] Def 5.5: NF-bridge isomorphisms form an F_l^*-torsor (l*)");
      iut_d_hodge_theater D; iut_hodge_theater_to_D(ht, &D); CHECK(D.nT == d.l && D.Pi_Gt[0] == D.Pi_BoxPlus[0] && iut_d_hodge_theater_iso(&D, &D), "[IUTchI] Def 6.13: forgetful functor to the D-HT keeps the glued Π copies");
      iut_global_nf_data g1, g2; iut_global_nf_build(&d, 1, &g1); iut_global_nf_build(&d, 2, &g2); iut_report r = {0}; CHECK(iut_global_nf_kummer(&g1, &g2, &r) == 0 && r.errors == 0, "[IUTchI] Cor 5.3: global Kummer isomorphism");
      iut_hodge_theater_free(ht); }
    { iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_lattice_init(lat, &d, IUT_LINK_THETA); iut_frobenius_chain c, t; iut_frobenius_chain_build(lat, 0, -2, 2, &c); iut_frobenius_chain_translate(&c, 2, &t);
      CHECK(c.n == 5 && !c.adjacent_swap_allowed && c.translation_symmetric && t.universe[2] == c.universe[0], "[IUTchI] Cor 3.8: Frobenius picture chain of 5, Z-translation, no swaps");
      iut_etale_picture e, p; iut_etale_picture_build(lat, 0, &e); unsigned perm[IUT_LAT_N] = { 4, 3, 2, 1, 0 }; CHECK(e.nspokes == 5 && iut_etale_picture_permute(&e, perm, &p) && p.spoke_universe[0] == e.spoke_universe[4], "[IUTchI] Cor 4.12: étale picture with 5 spokes, arbitrary permutations");
      iut_lattice_free(lat); free(lat); }


    /* IUTchI, read from the paper (iut_i.h) */
    { iut_pseudo_monoid m; iut_pseudo_monoid_get(IUT_PSM_MCIRCAST_INFKAPPA_UNITS, &m); CHECK(m.divisible && m.cyclotomic && m.kummer_ready && !strcmp(m.id, "MCircAstInfKappaUnits"), "[IUTchI] Ex 5.1 (i): M^⊛_∞κ× is divisible, cyclotomic, Kummer-ready");
      iut_pseudo_monoid_get(IUT_PSM_MCIRCAST_MOD, &m); CHECK(!m.kummer_ready && m.is_group && iut_pseudo_monoid_contains(IUT_PSM_MCIRCAST, IUT_PSM_MCIRCAST_MOD) && !iut_pseudo_monoid_contains(IUT_PSM_MCIRCAST_MOD, IUT_PSM_MCIRCAST), "[IUTchI] Rem 5.1.3: M^⊛_mod ⊆ M^⊛ is Kummer-blind");
      for (int k = 0; k < IUT_PSM_COUNT; ++k) { iut_pseudo_monoid_get((iut_pseudo_monoid_kind)k, &m); CHECK(iut_ident_find(m.id) != NULL, "pseudo-monoid %s is in the identifier table", m.id); } }
    { iut_poly_morphism a, b, c, pf; iut_poly_make(IUT_POLY_ISOMORPHISM, 4, &a); iut_poly_make(IUT_POLY_FULL_ISOMORPHISM, 7, &b); iut_poly_compose(&a, &b, &c);
      CHECK(b.count == 0 && c.kind == IUT_POLY_FULL_ISOMORPHISM, "[IUTchI] §0: full poly-isomorphism = all isomorphisms; composite with a full one is full");
      int alpha[IUT_MAX_V]; for (unsigned i = 0; i < d.nV; ++i) alpha[i] = -1; iut_poly_plus_full_make(&d, alpha, &pf); CHECK(iut_poly_plus_full_is_negative(&pf) && !iut_poly_plus_full_is_positive(&pf) && pf.nV == d.nV, "[IUTchI] Def 6.1 (iv): negative +-full poly-isomorphism");
      iut_sign_vector sv; iut_sign_vector_make(&d, alpha, &sv); CHECK(sv.all_minus && iut_sign_vector_count(&d) == (1UL << d.nV), "[IUTchI] Def 6.1 (iv): {±1}^V has 2^|V| elements");
      for (int k = 0; k < IUT_POLY_COUNT; ++k) CHECK(iut_ident_find(iut_poly_kind_id((iut_poly_kind)k)) != NULL, "poly-morphism kind %s is in the identifier table", iut_poly_kind_id((iut_poly_kind)k)); }
    { iut_anabelioid an; iut_anabelioid_make(IUT_ANAB_BTEMP, "Π", &an); CHECK(an.tempered && an.connected && !strcmp(an.id, "BTemp"), "[IUTchI] §0: B^temp(Π) is a connected temperoid");
      CHECK(iut_field_kind_of_valuation(&d.V[0]) == IUT_FIELD_MLF && iut_field_kind_of_valuation(&d.V[d.nV - 1]) == IUT_FIELD_CAF, "[IUTchI] §0: K_v is an MLF at v ∈ V^non, a CAF at v ∈ V^arc"); }
    { iut_orbicurve o; int bad = 0; for (int k = 0; k < IUT_ORB_COUNT; ++k) { iut_orbicurve_get(&d, (iut_orbicurve_kind)k, &o); if (!iut_ident_find(o.id)) bad++; }
      CHECK(!bad, "[IUTchI] §1: all %d orbicurves have identifiers", IUT_ORB_COUNT);
      iut_orbicurve_get(&d, IUT_ORB_XUNDER, &o); CHECK(o.ncusps == 13 && o.degree == 13 && o.covering_group_order == 13, "[IUTchI] §1: X̲ → X cyclic of degree l, l cusps ↔ F_l");
      iut_orbicurve_get(&d, IUT_ORB_CUNDER, &o); CHECK(o.ncusps == 7, "[IUTchI] Ex 4.4 (i): C̲ has l± = 7 cusps ↔ |F_l|");
      iut_orbicurve_get(&d, IUT_ORB_XARROW, &o); CHECK(o.aut_k_order == 26 && !strcmp(o.covers, "X̲"), "[IUTchI] Def 1.1, Rem 1.2.1: X→ → X̲, Aut_k(X→) ≅ Z/2l");
      iut_cusps_section_one c; iut_cusps_section_one_get(&d, &c); CHECK(c.two_epsilon == 2 && c.two_epsilon_ok && c.delta_E_mod_l_order == 169 && c.epsilon_prime == -c.epsilon_dprime, "[IUTchI] §1: cusps ε′ = −ε″, 2ε ≢ ±ε, |Δ_E ⊗ Z/l| = l²");
      iut_cor_one_two r; iut_cor_one_two_run(&d, &r); CHECK(r.l_squared == 169 && r.idx_C_XArrow == 338 && r.gal_XArrow_over_CUnder == 26 && r.gal_XArrow_over_CArrow == 2 && r.nsteps == 8, "[IUTchI] Cor 1.2: l² = [Δ_X : Δ_X→] = [Δ_C : Δ_X→]/2, Gal(X→/C̲) ≅ Z/2l ⊇ Gal(X→/C→) ≅ Z/2"); }
    { iut_tempered_fact t[8]; unsigned n = iut_tempered_facts(t, 8); int bad = 0; for (unsigned i = 0; i < n; ++i) if (!iut_ident_find(t[i].id)) bad++; CHECK(n == 7 && !bad, "[IUTchI] §2: 7 tempered/profinite facts, all with identifiers");
      iut_tempered_at_v a, g; iut_tempered_at_v_get(&d, 0, &a); iut_tempered_at_v_get(&d, d.nV - 1, &g); CHECK(a.tempered_available && a.decomposition_groups_synchronized && !g.tempered_available, "[IUTchI] Def 3.1 (c), Cor 2.5: Π_v tempered exactly at v ∈ V^bad, decomposition groups synchronized there"); }
    { iut_def_three_one_item it[6]; iut_report r = {0}; unsigned n = iut_def_three_one_check(&d, it, 6, &r); CHECK(n == 6 && r.errors == 0 && it[2].machine_checked && !it[0].machine_checked, "[IUTchI] Def 3.1 (a)-(f) on example 2: all hold; (c) machine-checked, (a) asserted");
      iut_initial_theta_data bad = d; { unsigned vb = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].in_Vbad_mod) { vb = i; break; } bad.V[vb].ordq = 13; } r.n = r.errors = 0; iut_def_three_one_check(&bad, it, 6, &r); CHECK(r.errors >= 1 && !it[2].ok, "[IUTchI] Def 3.1 (c): l | ord_v(q_v) is detected");
      iut_theta_approach ta; iut_theta_approach_get(&d, &ta); CHECK(ta.cyclotome_index == 13, "[IUTchI] Rem 3.1.2: M_X ≅ l·Δ_Θ (index l)");
      const char *det[5]; CHECK(iut_def_three_one_determining_data(det, 5) == 5 && !strcmp(det[2], "C̲_K"), "[IUTchI] Rem 3.1.3: determined by (F̄/F, X_F, C̲_K, V, V^bad_mod)"); }
    { iut_kappa_function f = { 1, 2, 1, 1, 1, 1, 1 }; iut_kappa_verdict v; iut_kappa_coric_check(&f, &v); CHECK(v.kappa_coric && v.inf_kappa_units_coric && v.ncritical == 4, "[IUTchI] Rem 3.1.7: κ-coric conditions; 4 strictly critical points");
      f.nzeros = 1; iut_kappa_coric_check(&f, &v); CHECK(!v.kappa_coric && v.failed, "[IUTchI] Rem 3.1.7: a single zero is rejected");
      iut_kappa_sol ks; iut_kappa_sol_get(&d, &ks); CHECK(ks.sl2_order == 13 * 168, "[IUTchI] Rem 3.1.7 (iii): |SL_2(F_13)| = l(l²−1)"); }
    { iut_local_frobenioid lf; iut_local_frobenioid_build(&d, 0, &lf); CHECK(lf.kind == IUT_LF_BAD && lf.is_tempered && lf.splitting_indeterminacy == 26 && lf.theta_root_indeterminacy == 26 && lf.theta_translation_indeterminacy && !iut_q_cmp(lf.generator_value, iut_q_make(1, 1)), "[IUTchI] Ex 3.2: tempered F̲_v, q̲_v up to μ_2l, Θ̲_v up to μ_2l and l·Z, splittings a μ_2l-orbit");
      iut_local_frobenioid lg; iut_local_frobenioid_build(&d, d.nV - 2, &lg); CHECK(lg.kind == IUT_LF_GOOD_NONARCH && lg.splitting_indeterminacy == 1 && !lg.is_tempered, "[IUTchI] Ex 3.3: good v: Φ_{C⊢v} = N·log(p_v), canonical splitting");
      iut_local_frobenioid la; iut_local_frobenioid_build(&d, d.nV - 1, &la); CHECK(la.kind == IUT_LF_ARCH && la.has_kummer_structure && strstr(la.D_mono_v, "TM"), "[IUTchI] Ex 3.4: archimedean (C_v, D_v, κ_v), D⊢_v ∈ TM");
      const char *rec[6]; CHECK(iut_local_frobenioid_reconstructions(&lf, rec, 6) == 6 && iut_local_frobenioid_split_iso(&lf, 0, &lf, 1), "[IUTchI] Ex 3.2 (v)-(vi): six reconstructions, F⊢_v ≅ F^Θ_v"); }
    { iut_global_realified g; iut_global_realified_build(&d, IUT_GR_MOD, &g); CHECK(g.nprimes == d.nV && fabs(g.rho[0] - 1.0) < 1e-12 && fabs(g.frobenius_element[d.nV - 1] - 1 / (2 * M_PI)) < 1e-12, "[IUTchI] Ex 3.5: Prime(C⊩_mod) ≅ V_mod, ρ_v = 1/[K_v:(F_mod)_v], Frobenius element ÷2π at arch v");
      CHECK(fabs(iut_rho_theta_v(&d, 0, 3) - 9 * log(2.0)) < 1e-9, "[IUTchI] Ex 3.5 (ii), Ex 4.4 (i): ρ^Θ_v at label 3 = 9·log(p_v)/[K_v:(F_mod)_v]");
      iut_f_monoglob m, t; iut_f_monoglob_build(&d, 0, &m); iut_f_monoglob_build(&d, 1, &t); CHECK(iut_f_monoglob_iso(&m, &t) && !strcmp(t.id, "FMonoGlobTht"), "[IUTchI] Ex 3.5 (iii): F⊩_tht ≅ F⊩_mod");
      iut_theta_hodge_theater_def h; iut_theta_hodge_theater_def_build(&d, &h); CHECK(h.cond_a && h.cond_b && h.cond_c && h.nV == d.nV, "[IUTchI] Def 3.6: Θ-Hodge theater conditions (a)(b)(c)");
      iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_lattice_init(lat, &d, IUT_LINK_THETA); iut_lattice_build_H(lat, 0, 0, 0); const iut_link *lk = iut_apply_theta_link(lat, 0, 0); iut_report r = {0};
      CHECK(iut_theta_link_cor_three_seven(lk, &r) == 0 && r.errors == 0, "[IUTchI] Cor 3.7: Θ-link is a full poly-iso preserving D⊢_v and the units, not the rings"); iut_lattice_free(lat); free(lat); }
    { iut_labcusp_torsor t; iut_labcusp_torsor_make(&d, &t); CHECK(t.torsor_size == 6 && t.compatible && iut_labcusp_torsor_act(&d, 5, 1) == 5 && iut_labcusp_torsor_act(&d, 5, 5) == 1, "[IUTchI] Def 4.1 (ii), Prop 4.2: LabCusp(†D_v) an F_l^*-torsor (5·5 = 25 ≡ −1 ↦ 1)");
      iut_labcusp_pm_torsor pm; iut_labcusp_pm_torsor_make(&d, &pm); CHECK(pm.size == 13 && pm.eta_zero[0] == 0 && pm.aut_plus_index == 2 && iut_labcusp_pm_forget(&d, -4) == 4 && iut_labcusp_pm_forget(&d, 0) == -1, "[IUTchI] Def 6.1 (ii)-(iii): LabCusp± with η⁰, [Aut : Aut_+] = 2, forgetting the sign");
      iut_global_base a, b; iut_global_base_get(&d, IUT_GB_CIRCAST, &a); iut_global_base_get(&d, IUT_GB_CIRCDOTPM, &b); CHECK(a.aut_image_order == 936 && a.aut_eps_image_order == 156 && a.quotient_order == 6 && b.quotient_order == 26 && b.double_cover, "[IUTchI] Ex 4.3, Def 6.1 (v): |Borel/±1| = l(l−1)²/2, |semi-unipotent/±1| = l(l−1), quotients F_l^*, F_l^{⋊±}");
      iut_valuation_orbit o[4]; CHECK(iut_valuation_orbits(&d, o, 4) == 4 && o[1].upper_bound <= o[2].upper_bound && !strcmp(o[1].id, "VPmUn"), "[IUTchI] Ex 4.3 (i), Rem 6.1.1: V ⊆ V^±un = V^± ⊆ V^Bor ⊆ V(K)"); }
    { iut_eval_points e; iut_eval_points_make(&d, 0, &e); CHECK(e.n == 7 && iut_q_todouble(e.theta_value[6]) == 36 && e.K_v_rational && e.sections_group_theoretic, "[IUTchI] Ex 4.4: l± evaluation points, Θ̲_v ↦ q̲_v^{j²}, K_v-rational, sections group-theoretic");
      iut_theta_bridge_piece p0, pg; iut_theta_bridge_piece_get(&d, 0, -2, &p0); iut_theta_bridge_piece_get(&d, d.nV - 1, -2, &pg); CHECK(p0.via_evaluation_section && p0.label_used == 2 && pg.full_poly_iso, "[IUTchI] Ex 4.4 (iii): φ^Θ_{v_j} via evaluation section |j| at bad v, full poly-iso at good v");
      iut_label_transport nf, pm; iut_label_transport_make(&d, 0, &nf); iut_label_transport_make(&d, 1, &pm); CHECK(iut_label_transport_check(&nf, &d) && iut_label_transport_check(&pm, &d) && nf.n == 6 && pm.n == 13, "[IUTchI] Prop 4.7, Prop 6.5: †χ, †ζ, †ζ_± are bijections, synchronized");
      iut_iso_torsor t[12]; unsigned n = iut_iso_torsors(&d, t, 12); CHECK(n == 11 && t[0].order == 6 && t[1].order == 1 && t[4].order == (2UL << d.nV) && t[5].order == 26 && t[6].order == 2 && t[7].order == 26 * (1UL << d.nV), "[IUTchI] Prop 4.8, Prop 6.6: torsor orders l*, 1, 1, l*; 2·2^|V|, 2l, 2, 2l·2^|V|");
      iut_forgetful_counts fc; iut_forgetful_counts_get(&d, 1, &fc); CHECK(fc.n == 7 && fc.symmetric_group_order == 5040 && fabs(fc.label_assignments - 823543) < 1e-6, "[IUTchI] Prop 6.8, Prop 6.9: (l±)^{l±} = 7^7 label assignments cut down to l±! = 5040"); }
    { iut_global_frobenioid g; int bad = 0; for (int k = 0; k < IUT_GF_COUNT; ++k) { iut_global_frobenioid_get(&d, (iut_global_frobenioid_kind)k, &g); if (!iut_ident_find(g.id)) bad++; }
      iut_global_frobenioid_get(&d, IUT_GF_FCIRCAST_ANGLEJ, &g); CHECK(!bad && !g.kummer_ready && fabs(g.log_volume_weight - 1.0 / 6) < 1e-12, "[IUTchI] Ex 5.1 (vii), Rem 5.1.3, Rem 5.4.2: F^⊛_⟨J⟩ Kummer-blind, log-volumes averaged (1/l*)");
      iut_distribution dg, fl; iut_distribution_make(&d, 1, &dg); iut_distribution_make(&d, 0, &fl); double pj[6] = { 1, 2, 3, 4, 5, 6 }; CHECK(fl.total == 6 * d.nV && fabs(iut_distribution_log_volume(&dg, pj, 6) - 3.5) < 1e-12 && fabs(iut_distribution_log_volume(&fl, pj, 6) - 21) < 1e-12, "[IUTchI] Ex 5.1 (vii): |V_J| = l*·|V|; average 3.5 vs sum 21");
      iut_strip_functor sf[8]; unsigned n = iut_strip_functors(sf, 8); CHECK(n == 7 && sf[0].bijective_on_isoms && !sf[2].bijective_on_isoms && sf[2].surjective_on_isoms, "[IUTchI] Cor 5.3: Isom(F) ≅ Isom(D) bijective, Isom(F⊢) → Isom(D⊢) only surjective");
      iut_prime_strip D, F; iut_prime_strip_build(&D, IUT_PS_D, "x", &d, 31, NULL, 0); CHECK(iut_lift_d_to_f(&D, &d, &F) && F.kind == IUT_PS_F && F.loc[0].Pi_copy == D.loc[0].Pi_copy && !iut_lift_d_to_f(&F, &d, &D), "[IUTchI] Cor 5.3 (ii), Rem 5.3.1: lifting D → F keeps the Π copies; an F-strip is not lifted again"); }
    { iut_fl_semi_pm_set G, T; iut_fl_semi_pm_group_make(&d, &G); iut_fl_semi_pm_torsor_make(&d, &T); int a[IUT_MAX_LPM + 1]; CHECK(G.orbit_size == 2 && T.orbit_size == 26 && T.aut_plus_order == 13 && iut_fl_semi_pm_abs(&G, a) == 7 && iut_fl_semi_pm_star(&G, a) == 6, "[IUTchI] Def 6.1 (i), Def 6.4 (i): F_l^{⋊±}-group ({±1}-orbit) vs torsor (2l-orbit); |T| = l±, T* = l*");
      iut_prop_six_seven p; iut_prop_six_seven_apply(&d, &p); iut_report r = {0}; CHECK(p.n_from == 13 && p.n_to == 6 && p.to[0] == 6 && p.from[0] == -6 && iut_processions_compatible(&d, &r) && r.errors == 0, "[IUTchI] Prop 6.7, Prop 6.9 (iii): ±t ↦ |t|, S*_j ↪ S^±_{j+1}");
      iut_half_plane_row h[3]; iut_ht_frobenioid_row fr[6]; CHECK(iut_half_plane_dictionary(h, 3) == 3 && iut_ht_frobenioids(fr, 6) == 6 && !strcmp(fr[0].id, "FPrimeStrip"), "[IUTchI] Rem 6.12.3 Fig 6.4; Fig 6.6: dictionary and Frobenioid table"); }

    /* IUTchII */
    { iut_radial_env e, m; iut_radial_env_make("F", "D⊢", 0, "", &e); iut_radial_env_multiradialize(&e, &m); CHECK(!iut_radial_env_is_multiradial(&e) && iut_radial_env_is_multiradial(&m) && m.multiradialized, "[IUTchII] Ex 1.7: multiradialization makes a uniradial environment multiradial");
      int nm = 0; for (size_t i = 0; i < iut_radial_examples_count; ++i) nm += iut_radial_env_is_multiradial(&iut_radial_examples[i]); CHECK(nm == 5 && iut_radial_examples_count == 7, "[IUTchII] Ex 1.8/1.9: 5 of 7 example environments are multiradial"); }
    { iut_cyclotomic_rigidity c; iut_cyclotomic_rigidity_get(IUT_CYC_MONO_THETA, &c); int a = c.multiradial; iut_cyclotomic_rigidity_get(IUT_CYC_MLF_GALOIS_PAIR, &c); CHECK(a && !c.multiradial && c.uses_ring_structure, "[IUTchII] Cor 1.10 vs 1.11: mono-theta rigidity multiradial, MLF-Galois-pair rigidity not"); }
    { iut_tempered_indices ix; iut_tempered_indices_get(&d, &ix); iut_theta_value tv[IUT_MAX_LSTAR + 1]; unsigned n = iut_theta_evaluate_all(&d, tv);
      CHECK(ix.Pi_to_PiYdd == 2 && ix.PiPm_to_Pi == 13 && ix.PiPm_to_PiYdd == 26, "[IUTchII] Cor 2.4: [Π:Π_Ÿ] = 2, [Π±:Π] = l, [Π±:Π_Ÿ] = 2l");
      iut_theta_value a, b; iut_theta_evaluate(&d, 3, &a); iut_theta_evaluate(&d, -3, &b);
      CHECK(n == 7 && iut_q_cmp(a.value, b.value) == 0 && a.value.num == 9 && a.torsion_indeterminacy == 26, "[IUTchII] Cor 2.5: θ(√−q^{±3}) = q̲^9 up to μ_{2l}, depends only on |t|"); }
    { unsigned v = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].in_Vbad_mod) { v = i; break; } iut_monoid env, gau, cns, ss, fro; iut_report r = {0};
      iut_monoid_build(&d, IUT_MON_THETA, v, 3, 1, &env); iut_monoid_build(&d, IUT_MON_GAUSSIAN, v, 3, 1, &gau); iut_monoid_build(&d, IUT_MON_CONSTANT, v, 3, 1, &cns); iut_monoid_semisimplify(&d, &cns, &ss); iut_monoid_build(&d, IUT_MON_CONSTANT, v, 4, 0, &fro);
      CHECK(gau.ngen == 6 && gau.gen[5].num == 36 && iut_monoid_evaluation_iso(&d, &env, &gau, &r) == 0, "[IUTchII] Cor 3.5 (ii): Ψ_env ≅ Ψ_gau with generators q̲^{1,4,…,36}");
      CHECK(ss.kind == IUT_MON_SEMISIMPLE && fabs(ss.distinguished_log_p - log((double)d.V[v].p)) < 1e-12 && ss.units_copy == cns.units_copy, "[IUTchII] Cor 4.5 (ii): semisimplification keeps O× and distinguishes log(p_v)");
      CHECK(iut_monoid_kummer_iso(&fro, &cns, &r) == 0 && iut_monoid_kummer_iso(&cns, &fro, NULL) != 0, "[IUTchII] Cor 4.6: Kummer isomorphism goes from Frobenius-like to étale-like"); }
    { iut_prime_strip D, G; iut_prime_strip_build(&D, IUT_PS_DMono, "D", &d, 7, NULL, 0); iut_global_realified_from_DMono(&d, &D, &G); CHECK(G.has_global_realified && G.kind == IUT_PS_FMonoGlob && fabs(G.global_degree + iut_log_q(&d) / 26.0) < 1e-9, "[IUTchII] Cor 4.5 (ii): D⊩(D⊢) carries the degree −|log q| of the q-object"); }
    { unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(&d, 0, 0, &u); iut_capsule T, J; iut_capsule_from_T(ht, &T); iut_capsule_from_J(ht, &J); iut_symmetrization a, b; iut_symmetrize_FlSemiPm(&d, &T, &a); iut_symmetrize_FlStar(&d, &J, &b);
      CHECK(a.nclasses == 7 && iut_conjugate_synchronized(&a) && a.class_of[0] == 6 && a.class_of[6] == 0, "[IUTchII] Cor 4.5 (iii): F_l^{⋊±} synchronizes conjugates, labels descend to |F_l|");
      CHECK(b.nclasses == 6 && !iut_conjugate_synchronized(&b), "[IUTchII] Cor 4.7 (ii): F_l^* symmetrizes the labelled copies but does not synchronize G_v");
      int sub[] = { 1 }; int all[IUT_MAX_L]; unsigned n = iut_label_line_segment(&d, all); CHECK(!iut_label_subset_keeps_symmetry(&d, sub, 1, 1) && iut_label_subset_keeps_symmetry(&d, all, n, 1), "[IUTchII] Rem 4.11.1: only the full label set keeps the symmetry");
      iut_report r = {0}; CHECK(iut_constant_strip_identify(ht, &r) == 0 && iut_envelope_isos(ht, &r) == 0 && iut_gau_LGP_lgp_isos(ht, &r) == 0, "[IUTchII] Cor 4.10 (i),(ii); [IUTchIII] Prop 3.7: F⊩_Δ ≅ F⊩_mod, F⊩_env ≅ F⊩_tht ≅ F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp");
      iut_hodge_theater_free(ht); }
    { iut_prime_strip src, lad[8]; iut_forget_ladder L; unsigned sq[IUT_MAX_LSTAR + 1]; unsigned n = iut_theta_gau_exponents(&d, sq); iut_prime_strip_build(&src, IUT_PS_FMonoGlobValUnitsModTors, "p", &d, 9, sq, n); iut_ps_forget_ladder(&d, &src, lad, &L);
      CHECK(n == 6 && sq[0] == 1 && sq[5] == 36, "[IUTchII] Rem 4.11.1: exponents (1², …, (l*)²)");
      CHECK(L.n == 5 && L.kind[4] == IUT_PS_DMono && lad[2].kind == IUT_PS_FMonoUnitsModTors && !lad[2].loc[0].has_valgroup && lad[2].loc[0].kummer_kind == 2 && !lad[4].loc[0].units_copy, "[IUTchII] Def 4.9: ladder F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢");
      CHECK(iut_pilot_object_degree(&src) < 0 && iut_units_mod_tors_kummer_orbit(&src) == 2, "[IUTchII] Def 4.9 (viii): pilot object of negative degree, ×μ-Kummer via Ism-orbit"); }
    { iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_lattice_init(lat, &d, IUT_LINK_THETA_UNITSMODTORS_GAU); iut_lattice_build_H(lat, 0, 0, 1); iut_hodge_theater *a = iut_lattice_get(lat, 0, 0), *b = iut_lattice_get(lat, 1, 0); iut_link L, D; iut_report r = {0};
      CHECK(iut_theta_link_make(a, b, IUT_LINK_THETA_UNITSMODTORS_GAU, &L) == 0 && L.full_poly_isomorphism && !L.preserves_Pi && L.preserves_units_mod_tors && fabs(L.dilation - 13.0 * 14.0 / 12.0) < 1e-12, "[IUTchII] Cor 4.10 (iii): Θ×μ_gau-link: full poly-iso of F⊩▶×μ, Π not preserved, dilation l(l+1)/12");
      CHECK(iut_theta_link_make(a, b, IUT_LINK_LOG, &L) != 0, "[IUTchII] Cor 4.10: the log-link is not a Θ-link flavour");
      iut_theta_link_make(a, b, IUT_LINK_THETA_UNITSMODTORS, &L);
      CHECK(iut_theta_link_coric_units(a, b, &r) == 0 && iut_theta_link_induced_D_link(&L, &D) == 0 && D.kind == IUT_LINK_D_THETA_PMELL_NF && D.glued_kind == IUT_PS_DMono && iut_coric_global_realified(a, b, &r) == 0 && r.errors == 0, "[IUTchII] Cor 4.10 (iv),(v): coric F⊢×μ, induced D-Θ±ellNF-link, coric D⊩ up to R>0");
      iut_lattice_free(lat); free(lat); }

    /* IUTchIII */
    { iut_log_shell s1, s2, s3; iut_report r = {0}; unsigned v = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].in_Vbad_mod) { v = i; break; }
      iut_log_shell_make(&d, v, 1, 0, 0, 0, &s1); iut_log_shell_from(&d, IUT_SHELL_MONO_DMONO, v, 0, 0, &s2); iut_log_shell_from(&d, IUT_SHELL_MONO_FUNITSMODTORS, v, 0, 0, &s3);
      CHECK(s1.pstar == d.V[v].p && iut_log_shell_isomorphic(&s1, &s2) && iut_log_shell_isomorphic(&s2, &s3) && s2.etale_like && !s2.holomorphic && !s3.etale_like, "[IUTchIII] Prop 1.2 (vi),(vii): I_F ≅ I_F⊢×μ ≅ I_D⊢ (p* = p for odd p)");
      CHECK(!strcmp(iut_log_shell_iso_indeterminacy(&d, v), "Ism") && !strcmp(iut_log_shell_iso_indeterminacy(&d, d.nV - 1), "{±1}"), "[IUTchIII] Prop 1.2 (vi): indeterminacy Ism (nonarch) / ±1 (arch)");
      int bad = 0; for (unsigned i = 0; i < d.nV; ++i) { iut_log_shell s; iut_log_shell_make(&d, i, 1, 0, 0, 0, &s); bad += iut_log_shell_properties(&s, &d, &r); } CHECK(bad == 0, "[IUTchIII] Prop 1.2 (v): log-shell properties (a)(b)(c) at all %u valuations", d.nV);
      unsigned v2 = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].p == 2) v2 = i; iut_log_shell_make(&d, v2, 1, 0, 0, 0, &s1); CHECK(d.V[v2].p != 2 || s1.pstar == 4, "[IUTchIII] Def 1.1 (i): p* = 4 at p = 2"); }
    { iut_prime_strip a, b; iut_log_link_result R; iut_prime_strip_build(&a, IUT_PS_F, "F", &d, 11, NULL, 0); iut_log_link_strip(&d, &a, &b, 0, &R);
      CHECK(R.coric_D && R.coric_DMono && !R.ring_structure_preserved && R.log_volume_compatible && !R.kummer_compatible && R.nshell == d.nV && b.loc[0].Pi_copy == a.loc[0].Pi_copy && b.loc[0].units_copy != a.loc[0].units_copy, "[IUTchIII] Prop 1.2 (i)-(v): log-link keeps D, renews units, breaks ring structure and Kummer compatibility"); }
    { iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_lattice_init(lat, &d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_lattice_build_H(lat, 0, 0, 1); iut_report r = {0};
      iut_frobenius_chain c; iut_log_chain_build(lat, 0, -2, 2, &c); CHECK(c.n == 5 && c.kind == IUT_LINK_LOG && !c.adjacent_swap_allowed, "[IUTchIII] Prop 1.2 (x): vertical Frobenius picture of 5 Hodge theaters");
      CHECK(iut_log_link_hodge_theater_check(iut_lattice_get(lat, 0, 0), iut_lattice_get(lat, 0, 1), &r) == 0, "[IUTchIII] Prop 1.3: log-link of Hodge theaters, D-HTs coric");
      CHECK(!iut_lattice_square_commutes() && strstr(iut_lattice_flavour(IUT_LINK_THETA_UNITSMODTORS_LGP), "LGP") && strstr(iut_lattice_flavour(IUT_LINK_THETA_UNITSMODTORS_GAU), "Gaussian"), "[IUTchIII] Def 1.4, Rem 1.4.1: lattice flavours, non-commuting squares");
      CHECK(iut_lattice_horizontal_obligates_vertical(lat, &r) == 0, "[IUTchIII] Rem 1.4.1 (ii): every Θ-link of the H has a log-link in its column");
      iut_bicoric b; iut_bicoric_check(lat, 0, 0, &b); CHECK(b.vertical_coric_D && b.horizontal_coric_units && b.bicoric_units_of_DMono && b.bicoric_log_shells && b.bicoric_global_realified, "[IUTchIII] Thm 1.5 (i)-(v): bi-coric data");
      CHECK(iut_theta_monoid_vertically_coric(lat, 0, &r) == 0 && iut_theta_monoid_multiradial(&r) == 0, "[IUTchIII] Prop 2.1, Thm 2.2: vertically coric and multiradial theta monoids");
      iut_radial_item it[8]; CHECK(iut_etale_radial_environment(it, 8) == 6 && !strcmp(it[0].item, "(aR)"), "[IUTchIII] Cor 2.3: radial data (aR)-(eR) + coric data");
      iut_multiradial_full M; iut_multiradial_full_build(lat, 0, &M); iut_procession prc; iut_procession_build(&d, IUT_PRC_PM, &prc);
      CHECK(M.npackets == d.lstar + 1 && M.nnumberfields == d.lstar && M.nsplitting == d.lstar * 3 && M.ind1_count == prc.automorphisms && M.ind2_summands >= M.npackets && M.ind3 && M.log_kummer_ok, "[IUTchIII] Thm 3.11: (a) %u packets, (b) %u splitting monoids, (c) %u number fields, Ind1 = %lu", M.npackets, M.nsplitting, M.nnumberfields, M.ind1_count);
      iut_named_value s[8]; unsigned n = iut_cor312_steps(lat, s, 8); CHECK(n == 7 && fabs(s[0].value + iut_log_q(&d) / 26.0) < 1e-9 && iut_cor312_holds(lat), "[IUTchIII] Cor 3.12: steps listed, −|log q| = %.4f, inequality holds", s[0].value);
      iut_apply_log_link(lat, 0, -1); CHECK(iut_LGP_link_requires_log(lat, 0, 0, &r) == 0 && iut_LGP_link_requires_log(lat, 1, 0, NULL) != 0, "[IUTchIII] Def 3.8 (ii): the Θ×μ_LGP-link needs an incoming log-link");
      iut_mutation_history H; iut_mutation_history_from_lattice(lat, &H); CHECK(H.nvertices >= 4 && H.nedges >= 3, "[IUTchIV] Def 3.3 (iii): the lattice as a mutation-history (%u vertices, %u edges)", H.nvertices, H.nedges);
      iut_lattice_free(lat); free(lat); }
    { unsigned v = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].in_Vbad_mod) { v = i; break; } unsigned p = d.V[v].p; iut_tensor_packet P[IUT_MAX_LPM], G; iut_report r = {0};
      unsigned n = iut_tensor_packet_procession(&d, p, 1, P); unsigned nv = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].kind == IUT_V_NONARCH && d.V[i].p == p) nv++;
      CHECK(n == d.lstar + 1 && P[2].nfactors == 3 && P[2].nsummands == (unsigned long)nv * nv * nv && fabs(P[2].log_volume_shells - 3 * P[0].log_volume_shells) < 1e-9, "[IUTchIII] Prop 3.1: packet of S±_3 has 3 factors, |V_p|³ summands, 3× the shell log-volume");
      iut_tensor_packet_build(&d, 2, 0, 0, &P[0]); unsigned na = 0; for (unsigned i = 0; i < d.nV; ++i) if (d.V[i].kind == IUT_V_ARCH) na++; CHECK(P[0].nsummands == iut_iv_arch_summands(3, na), "[IUTchIII] Prop 3.2 / [IUTchIV] Prop 1.5: archimedean packet has 2^{|I|−1}|V|^{|I|} summands");
      iut_tensor_packet_global(&d, 2, &G); iut_tensor_packet_build(&d, 2, p, 1, &P[1]); CHECK(G.global && G.nfactors == 3 && iut_tensor_packet_localize(&G, &P[1], &r) == 0 && iut_tensor_packet_localize(&P[1], &G, NULL) != 0, "[IUTchIII] Prop 3.3: global packet localizes into the local one");
      iut_monoid m; iut_lgp_monoid_build(&d, 4, v, 5, &m); CHECK(m.kind == IUT_MON_LGP && m.gen[0].num == 16 && m.split, "[IUTchIII] Prop 3.4 (ii): LGP splitting monoid at j = 4 generated by q̲^16");
      iut_upper_semi_compat u; iut_upper_semi_compatibility(&d, v, &u); int a = (u.kase == IUT_USC_BAD && u.log_volume_delta == 0); iut_upper_semi_compatibility(&d, d.nV - 1, &u); CHECK(a && u.kase == IUT_USC_ARCH, "[IUTchIII] Prop 3.5 (ii): bad primes: roots of unity only (Δ = 0); archimedean: surjection");
      iut_global_variant_info gi; iut_global_variant_info_get(IUT_GLOB_MOD_TORSOR, &gi); int b = gi.multiplicatively_compatible_with_theta_link && !gi.compatible_with_log_volume; iut_global_variant_info_get(IUT_GLOB_MOD_IDEAL, &gi); CHECK(b && gi.compatible_with_log_volume, "[IUTchIII] Ex 3.6: F_MOD is Θ-link-compatible, F_mod is log-volume-compatible");
      iut_pilot q, t; iut_pilot_make(&d, IUT_PILOT_Q, &q); iut_pilot_make(&d, IUT_PILOT_THETA, &t); CHECK(q.nj == 1 && t.nj == 6 && t.exps[5] == 36 && fabs(t.log_volume - (91.0 / 6.0) * q.log_volume) < 1e-9, "[IUTchIII] Def 3.8 (i): Θ-pilot {q̲^{j²}}, naive log-volume avg(j²)·(−|log q|)");
      CHECK(fabs(iut_log_volume_scale_by_p(1.0, 7) - (1.0 - log(7.0))) < 1e-12 && iut_log_volume_scale_by_e(0) == 1.0, "[IUTchIII] Prop 3.9 (i): packet-normalization (×p ↦ −log p, ×e ↦ +1)");
      double vols[] = { 1, 2, 3 }; CHECK(fabs(iut_log_volume_procession_normalize(vols, 3) - 2.0) < 1e-12 && fabs(iut_arith_degree(&d, q.exps, 1) - q.log_volume) < 1e-12 && iut_log_volume_log_link_compatible(2.5, 2.5), "[IUTchIII] Prop 3.9 (i),(iii),(iv): procession average, degree = log-volume, log-link invariance");
      iut_non_interference ni; iut_kummer_non_interference(&d, &ni); CHECK(ni.non_interference && ni.torsion_order == 2 && ni.MOD_compatible_with_LGP_link && ni.mod_compatible_with_log_volume, "[IUTchIII] Prop 3.10: non-interference, μ(F_mod) = {±1}"); }

    /* IUTchIV */
    { iut_local_field k7 = { 7, 1, 1, 0, 0 }, k7r = { 7, 6, 1, 0, 1.0 }, k2 = { 2, 1, 1, 1, 0 }; double lo, hi;
      CHECK(iut_iv_prop12_i(&k7, &lo, &hi) && fabs(iut_iv_a(&k7) - 1.0) < 1e-12 && fabs(iut_iv_b(&k7) + 1.0) < 1e-12, "[IUTchIV] Prop 1.2: unramified p = 7: a = 1 = −b, equalities");
      CHECK(!iut_iv_prop12_i(&k7r, &lo, &hi) && fabs(iut_iv_a(&k7r) - (1.0 / 6.0) * 2) < 1e-12, "[IUTchIV] Prop 1.2: e = 6 > p − 2 = 5: a = (1/6)⌈6/5⌉ = 1/3");
      CHECK(fabs(iut_iv_a(&k2) - 2.0) < 1e-12 && fabs(iut_iv_mulog_log_units(&k2) + 2.0 * log(2.0)) < 1e-12 && fabs(iut_iv_mulog_log_units(&k7) + log(7.0)) < 1e-12, "[IUTchIV] Prop 1.2 / 1.4 (ii): a = 2 at p = 2; μ_log(log R×) = −(1/e + m/ef) log p");
      iut_local_field I[2] = { k7, k7 }; CHECK(fabs(iut_iv_prop12_ii_exp_log(I, 2, 0) + 2) < 1e-12 && fabs(iut_iv_prop12_ii_exp_tilde(I, 2, 0) - 0) < 1e-12 && fabs(iut_iv_prop12_iii_exp(I, 2, 0) + 1) < 1e-12 && iut_iv_prop12_iv_unramified(I, 2) && iut_iv_prop14_iv(I, 2), "[IUTchIV] Prop 1.2 (ii)-(iv): exponents for two unramified copies of Q_7");
      CHECK(fabs(iut_iv_prop14_iii_dI_plus_aI_lower(I, 2) - 2) < 1e-12 && fabs(iut_iv_dIstar(I, 2, 0) - 0) < 1e-12, "[IUTchIV] Prop 1.1 / 1.4 (iii): d_{I*} and d_I + a_I ≥ |I|");
      iut_iv_prop13_bounds(&k7, &k7r, 1, &lo, &hi); CHECK(fabs(lo - 5.0 / 6.0) < 1e-12 && fabs(hi - 2.0) < 1e-12 && lo <= k7r.d && k7r.d <= hi, "[IUTchIV] Prop 1.3: 5/6 ≤ d ≤ 2 for a tame sextic over Q_7 (d = 1 - 1/6... recorded 1.0)");
      CHECK(iut_iv_arch_summands(3, 1) == 4 && iut_iv_arch_metric_factor(3) == 4 && iut_iv_arch_tensor_bound(2, 3) == 9, "[IUTchIV] Prop 1.5: 2^{|I|−1}|V|^{|I|} summands, metric factor 2^{|I|−1}");
      CHECK(iut_iv_pnt_n_bound(97) >= 25 && iut_iv_pnt_count_bound(1e21) > 0 && iut_iv_log_le_x(13) && iut_iv_chebyshev_lo(99) < 99 && iut_iv_chebyshev_hi(99) > 99 && iut_iv_prime_in_A_bound(1, 5) == 12, "[IUTchIV] Prop 1.6, Prop 2.1: PNT / Chebyshev bounds");
      double beta[] = { 1, 3 }, lam[] = { 1, 3 }; CHECK(fabs(iut_iv_weighted_average(beta, lam, 2) - 2.5) < 1e-12, "[IUTchIV] Prop 1.7: weighted average");
      double w[IUT_MAX_V]; unsigned n; iut_iv_normalized_weights(&d, 7, w, &n); CHECK(n == 1 && w[0] == 1, "[IUTchIV] Prop 1.7: λ_v = [(F_mod)_v : Q_7] = 1 for F_mod = Q"); }
    { iut_arith_divisor Dq; iut_arith_divisor_q(&d, &Dq); CHECK(fabs(iut_arith_divisor_normalized_deg(&d, &Dq) - iut_log_q(&d)) < 1e-9 && iut_arith_divisor_deg_E(&d, &Dq, 7) > 0, "[IUTchIV] Def 1.9: normalized degree of the q-divisor = log q");
      iut_thm110 T; iut_thm110_compute(&d, &T); CHECK(fabs(iut_iv_E1(6) - 3.5) < 1e-12 && fabs(iut_iv_E2(6) - 91.0 / 6.0) < 1e-12 && iut_iv_E3(13) == 13 * 14 * 144 && T.inequality_holds && T.cor312_holds && fabs(T.logdK_bound - (T.logd_tpd + T.logf_tpd + 2 * log(13.0) + 21)) < 1e-12, "[IUTchIV] Thm 1.10: (E1)-(E3), log d^K bound, C_Θ = %.3f, inequality holds", T.C_theta);
      iut_cor22 C; iut_cor22_compute(&d, &C); CHECK(C.delta == 4096.0 * 27 * 5 && C.holds && C.eps_E > 0 && C.logcond_hi > C.logcond_lo, "[IUTchIV] Cor 2.2: δ = 2^12·3^3·5·d, (C2) holds, ε_E = %.3e", C.eps_E);
      CHECK(iut_cor23_bound(1, 0, 1, 0, 0) == 0 && iut_cor23_bound(1, 0, 1, 1, 0) == 1, "[IUTchIV] Cor 2.3: slack of ht ≤ (1+ε)(log-diff+log-cond)+C");
      iut_report r = {0}; iut_iv_torsion_facts(&d, &r); CHECK(r.n >= 2, "[IUTchIV] Prop 1.8: torsion-point facts reported (%u notes)", r.n); }
    { iut_mutation id, c; iut_mutation_identity(&iut_species_table[0], &id); CHECK(!strcmp(id.dom, id.cod) && id.is_core && iut_species_isomorphic(&iut_species_table[0], &iut_species_table[0]) && !iut_species_isomorphic(&iut_species_table[0], &iut_species_table[1]), "[IUTchIV] Def 3.1: identity mutation; species-isomorphism");
      int composed = 0; for (size_t i = 0; i < iut_mutation_count && !composed; ++i) for (size_t k = 0; k < iut_mutation_count && !composed; ++k) if (!iut_mutation_compose(&iut_mutation_table[i], &iut_mutation_table[k], &c)) composed = 1; CHECK(composed && iut_mutation_compose(&iut_mutation_table[0], &id, &c) == (strcmp(iut_mutation_table[0].cod, id.dom) ? 1 : 0), "[IUTchIV] Def 3.3: composition of mutations requires cod = dom");
      CHECK(iut_observable_is_core("DMonoPrimeStrip") && iut_observable_is_core("FMonoUnitsModTorsPrimeStrip") && !iut_observable_is_core("ThetaPmEllNFHodgeTheater"), "[IUTchIV] Def 3.3 (v): D⊢ and F⊢×μ are cores, the full Hodge theater is not"); }

    /* EssLgc, Alien */
    { iut_esslgc_model m; iut_esslgc_model_eval(0.5, 0.75, 0.5, IUT_LOGIC_AND, &m); int a = m.consistent && m.meaningful && m.conclusion_A == 0.5 && m.N_theta_link[0] == -1.5; iut_esslgc_model_eval(0.5, 0.75, 0.5, IUT_LOGIC_OR, &m); int b = !m.meaningful; iut_esslgc_model_eval(0.7, 0.75, 0.5, IUT_LOGIC_AND, &m);
      CHECK(a && b && !m.consistent, "[EssLgc] Ex 2.4.5: ∧ ⇒ A = ε; ∨ ⇒ nothing; A ≠ ε is inconsistent");
      iut_log_theta_lattice *lat = calloc(1, sizeof *lat); iut_lattice_init(lat, &d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_lattice_build_H(lat, 0, 0, 1);
      iut_stp s[8]; unsigned n = iut_stp_chain(lat, s, 8); CHECK(n == 8 && !strcmp(s[0].indeterminacy, "Ind3") && !strcmp(s[1].indeterminacy, "Ind1") && !strcmp(s[2].indeterminacy, "Ind2") && strstr(s[2].to, "(1,0)⊢"), "[EssLgc] §3.10: (Stp1)-(Stp8) with Ind3, Ind1, Ind2 at steps 1-3 and the gluing (0,0)⊢ ⇔ (1,0)⊢");
      double q, t; iut_fix_and_glue(lat, &q, &t); iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep); iut_interval R = iut_fuzzify(t, &rep.ind, 0, 0, rep.theta_upper_bound - t);
      CHECK(q > t && iut_engulfs(R, q) && !iut_engulfs(R, t - 1) && !iut_engulfs(R, rep.theta_upper_bound + 1), "[EssLgc] (FxGl), (Englf): the Θ-pilot's region engulfs the q-pilot's log-volume %.4f", q);
      int A[] = { 1, 2 }, B[] = { 2, 3 }, U[8], C2[8]; CHECK(iut_extind1_union(A, 2, B, 2, U) == 3 && iut_extind2_crush(U, 3, iut_label_abs, C2) == 3 && strstr(iut_or_indeterminacy_verdict(1), "harmless") && strstr(iut_or_indeterminacy_verdict(0), "fatal"), "[EssLgc] (ExtInd1), (ExtInd2), (logORInd)/(ΘORInd)");
      iut_gauss_step g[12]; CHECK(iut_alien_gauss_steps(g, 12) == 12 && fabs(g[11].value - sqrt(M_PI)) < 1e-12 && fabs(iut_alien_gauss_numeric() - sqrt(M_PI)) < 1e-6, "[Alien] §1: Steps 1-12, ∫e^{−x²} = √π numerically");
      iut_transport_stage st[8]; iut_named_value tr[4]; CHECK(iut_transport_apparatus(st, 8) == 7 && iut_transport_run(lat, tr, 4) == 4 && tr[3].value == q, "[Alien] §2.7: 7 stages of mono-anabelian transport; run ends at the q-pilot");
      iut_formal_sum fs; iut_formal_sum_make(&d, IUT_FS_BOXPLUS, 0, &fs); char buf[16]; iut_q_fmt(iut_formal_sum_total(&fs), buf, sizeof buf); iut_report r = {0};
      CHECK(fs.n == 13 && !strcmp(buf, "1") && iut_formal_sum_compatible(&d, IUT_FS_ZERO, &r) == 0 && iut_formal_sum_compatible(&d, IUT_FS_BOXPLUS, &r) == 0 && iut_formal_sum_compatible(&d, IUT_FS_ABS_J, &r) == 0, "[Alien] §3.6: [⊞] has 13 terms of total mass 1; [0], [⊞], (1/(l*+1))([0]+Σ[|j|]) → [>] compatible");
      int seg[IUT_MAX_L], ev[2]; CHECK(iut_label_line_segment(&d, seg) == 13 && seg[0] == -6 && iut_evaluation_points(&d, 2, ev) == 2 && ev[1] == -2 && iut_evaluation_points(&d, 0, ev) == 1, "[Alien] §3.6 (ii): line segment {−6..6}, evaluation points ±t");
      iut_named_value es[12]; CHECK(iut_alien_estimate_steps(lat, es, 12) == 12 && fabs(iut_alien_leading_term_sum(&d) - rep.leading_term) < 1e-9 && fabs(iut_alien_leading_term_j(&d, 1) - (2 * d.logdK - iut_log_q(&d) / 26.0)) < 1e-9 && fabs(iut_alien_l_from_height(&d) - sqrt(iut_log_q(&d) / 6)) < 1e-12, "[Alien] §3.7: (1est)-(12est), leading terms (j+1) log d^K − (j²/2l) log q, l ≈ √ht");
      iut_dictionary_entry de[11]; CHECK(iut_alien_dictionary(de, 11) == 11, "[Alien] §3.8: dictionary (1gau)-(11gau)");
      iut_lattice_free(lat); free(lat); }
    fprintf(out, "%s: %d failure(s) in the operations layer\n", fails ? "FAILED" : "PASSED", fails);
    return fails;
}
