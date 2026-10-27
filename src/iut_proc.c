/*
 * iut_proc.c — the registry of processes: every operation of the ops layer, with the
 * paper/section it comes from, the data types it consumes and produces, and a runner
 * that demonstrates it on a collection of initial Θ-data.
 *
 *   iut procs [filter]            list the processes (filter on id / paper / section / name)
 *   iut run <id> [data options]   run one process
 *   iut run --all [filter]        run all (returns the number of failures)
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ----------------------------------------------------------- helpers */
#define Q(x) iut_q_todouble(x)
static iut_log_theta_lattice *new_lat(const iut_initial_theta_data *d, iut_link_kind h)
{
    iut_log_theta_lattice *lat = calloc(1, sizeof *lat);
    iut_lattice_init(lat, d, h);
    iut_lattice_build_H(lat, 0, 0, 1);
    return lat;
}
static void free_lat(iut_log_theta_lattice *lat) { iut_lattice_free(lat); free(lat); }
static int print_report(FILE *f, iut_report *r) { for (unsigned i = 0; i < r->n; ++i) fprintf(f, "    [%s] %-28s %s   %s\n", r->issue[i].sev == IUT_SEV_ERROR ? "ERR " : r->issue[i].sev == IUT_SEV_WARN ? "warn" : r->issue[i].sev == IUT_SEV_INFO ? "info" : " ok ", r->issue[i].condition, r->issue[i].msg, r->issue[i].ref); return r->errors ? 1 : 0; }
static unsigned first_bad(const iut_initial_theta_data *d) { for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_NONARCH && d->V[i].red == IUT_RED_BAD_MULT) return i; return 0; }

/* ================================================================ IUTchI */
static int p_label_maps(const iut_initial_theta_data *d, FILE *f)
{
    fprintf(f, "    F_l = {-%u..%u}, F_l^× = F_l∖{0}, F_l^* = F_l^×/{±1} = {1..%u}, |F_l| = {0..%u}\n", d->lstar, d->lstar, d->lstar, d->lstar);
    for (int t = -(int)d->lstar; t <= (int)d->lstar; ++t) fprintf(f, "    t=%3d  |t|=%2d  F_l^×→F_l^*: %2d  glue 0,⊞↦>: %2d\n", t, iut_label_abs(t), iut_label_FlUnits_to_FlStar(d, t), iut_label_glue_pm_to_nf(d, t));
    return 0;
}
static int p_label_orbits(const iut_initial_theta_data *d, FILE *f)
{
    fprintf(f, "    F_l^{⋊±} ↷ F_l: orbit of 0 has %u elements (transitive); F_l^* ↷ F_l^*: orbit of 1 has %u elements (simply transitive)\n", iut_label_orbit_FlSemiPm(d, 0), iut_label_orbit_FlStar(d, 1));
    fprintf(f, "    (a=1,+) · t=2 = %d;  (a=0,−) · t=2 = %d;  u=2 · j=3 = %d\n", iut_sym_FlSemiPm_act(d, 1, 1, 2), iut_sym_FlSemiPm_act(d, 0, -1, 2), iut_sym_FlStar_act(d, 2, 3));
    return 0;
}
static int p_labcusp(const iut_initial_theta_data *d, FILE *f)
{
    iut_labcusp pm, nf, fg; iut_labcusp_pm_make(d, &pm); iut_labcusp_make(d, &nf); iut_labcusp_forget_sign(&pm, &fg);
    fprintf(f, "    LabCusp±(D_⊚): %u cusps ≅ F_l (bijection %s);  LabCusp(D_⊛): %u ≅ F_l^* (%s);  forget sign: %u labels (%s)\n", pm.n, iut_labcusp_is_bijection(&pm, d) ? "ok" : "BAD", nf.n, iut_labcusp_is_bijection(&nf, d) ? "ok" : "BAD", fg.n, iut_labcusp_is_bijection(&fg, d) ? "ok" : "BAD");
    return !(iut_labcusp_is_bijection(&pm, d) && iut_labcusp_is_bijection(&fg, d));
}
static int p_capsules(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u);
    iut_capsule T, J; iut_capsule_from_T(ht, &T); iut_capsule_from_J(ht, &J);
    iut_capsule_morphism m = { J.n, T.n, {0} }; for (unsigned i = 0; i < J.n; ++i) m.map[i] = (int)(d->lstar + J.label[i]);
    fprintf(f, "    capsule F_T: %u members (labels %d..%d, basepoints %u..%u), %d full poly-isomorphisms\n", T.n, T.label[0], T.label[T.n - 1], T.basepoint[0], T.basepoint[T.n - 1], iut_capsule_full_poly_iso_count(&T));
    fprintf(f, "    capsule F_J: %u members; morphism F_J → F_T (j ↦ +j): %s\n", J.n, iut_capsule_morphism_valid(&m) ? "valid injection" : "INVALID");
    iut_hodge_theater_free(ht);
    return !iut_capsule_morphism_valid(&m);
}
static int p_procession(const iut_initial_theta_data *d, FILE *f)
{
    iut_procession p; int labels[IUT_MAX_LPM + 1];
    for (int k = 0; k < 2; ++k) {
        iut_procession_build(d, (iut_procession_kind)k, &p);
        fprintf(f, "    %s: %u capsules, |S_k| = 1..%u, automorphisms Π|S_k|! = %lu\n", k ? "Prc(D_T) (Prop 6.9)" : "Prc(D_J) (Prop 4.11)", p.nsteps, p.size[p.nsteps - 1], p.automorphisms);
        for (unsigned s = 0; s < p.nsteps && s < 4; ++s) { unsigned n = iut_procession_capsule_labels(&p, s, labels); fprintf(f, "      S%s_%u = {", k ? "±" : "", s + 1); for (unsigned i = 0; i < n; ++i) fprintf(f, "%s%d", i ? "," : "", labels[i]); fprintf(f, "}  weight 1/%u\n", p.size[s]); }
    }
    return 0;
}
static int p_bridges(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u); int bad = 0;
    for (int k = 0; k < IUT_BRIDGE_COUNT; ++k) { iut_bridge b; iut_bridge_build(ht, (iut_bridge_kind)k, &b); fprintf(f, "    %-15s %s → %s  (%u members)  isomorphisms: %s (%lu)  %s\n", iut_bridge_kind_id(b.kind), b.dom, b.cod, b.n_dom, b.symmetry, b.isos, b.ok ? "ok" : "MISSING"); bad += !b.ok; }
    iut_hodge_theater_free(ht); return bad;
}
static int p_ht_to_D(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u); iut_d_hodge_theater D; iut_hodge_theater_to_D(ht, &D);
    fprintf(f, "    HT(universe %u) ↦ D-HT: capsules |T|=%u |J|=%u, Π copies of F_⊞ %u.., F_> %u.., D_⊚± %u.., F_⊛ %u..; self-iso: %s\n", D.universe, D.nT, D.nJ, D.Pi_BoxPlus[0], D.Pi_Gt[0], D.Pi_CircDot[0], D.Pi_CircAst[0], iut_d_hodge_theater_iso(&D, &D) ? "yes" : "no");
    fprintf(f, "    components: Θ±ell-HT (%u strips in T), ΘNF-HT (%u in J), Θ-HT (F⊩_mod, F⊩_tht with %u theta values)\n", iut_hodge_theater_pmell(ht)->nT, iut_hodge_theater_nf(ht)->nJ, d->lstar);
    iut_hodge_theater_free(ht); return 0;
}
static int p_frobenius_chain(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA); iut_frobenius_chain c, t; iut_frobenius_chain_build(lat, 0, -1, 2, &c); iut_frobenius_chain_translate(&c, 1, &t);
    fprintf(f, "    chain of %u Θ-Hodge theaters (universes", c.n); for (unsigned i = 0; i < c.n; ++i) fprintf(f, " %u", c.universe[i]); fprintf(f, "), %s; Z-translation: %s; swap of adjacent: %s\n", iut_link_kind_notation(c.kind), c.translation_symmetric ? "yes" : "no", c.adjacent_swap_allowed ? "allowed" : "never");
    fprintf(f, "    translated by 1:"); for (unsigned i = 0; i < t.n; ++i) fprintf(f, " %u", t.universe[i]); fprintf(f, "\n");
    free_lat(lat); return c.n < 2;
}
static int p_etale_picture(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_etale_picture e, p; iut_etale_picture_build(lat, 0, &e);
    unsigned perm[IUT_LAT_N]; for (unsigned i = 0; i < e.nspokes; ++i) perm[i] = e.nspokes - 1 - i;
    int ok = iut_etale_picture_permute(&e, perm, &p);
    fprintf(f, "    hub D⊢ (G copies %u..), %u spokes (D-HTs", e.core_copy[0], e.nspokes); for (unsigned i = 0; i < e.nspokes; ++i) fprintf(f, " %u", e.spoke_universe[i]); fprintf(f, "); reversed: %s\n", ok ? "valid permutation" : "INVALID");
    free_lat(lat); return !ok;
}
static int p_global_nf(const iut_initial_theta_data *d, FILE *f)
{
    iut_global_nf_data fr, et; iut_global_nf_build(d, 5, &fr); iut_global_nf_build(d, 6, &et); iut_global_nf_realify(&fr); iut_report r = {0};
    fprintf(f, "    Π_CK copy %u; F_mod^× copy %u; κ-coric %u; sol %u; F^⊛_mod ⊆ F^⊛: %s; realified: %s\n", fr.Pi_CK_copy, fr.Fmod_units_copy, fr.kappa_coric_copy, fr.sol_copy, fr.has_Frobenioid_mod ? "yes" : "no", fr.realified ? "yes" : "no");
    iut_global_nf_kummer(&fr, &et, &r); return print_report(f, &r);
}
static int p_gluing(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u); ht->glued = 0; iut_hodge_theater_glue(ht);
    fprintf(f, "    0,⊞ ↦ >: F_> now carries the Π copies of F_⊞ (%u = %u); label map t ↦ |t|: ", ht->nf.FGt.loc[0].Pi_copy, ht->pmell.FBoxPlus.loc[0].Pi_copy);
    for (int t = -(int)d->lstar; t <= (int)d->lstar; ++t) fprintf(f, "%d%s", iut_label_glue_pm_to_nf(d, t), t < (int)d->lstar ? "," : "\n");
    int ok = ht->glued && ht->nf.FGt.loc[0].Pi_copy == ht->pmell.FBoxPlus.loc[0].Pi_copy; iut_hodge_theater_free(ht); return !ok;
}
static int p_prime_strip(const iut_initial_theta_data *d, FILE *f)
{
    iut_prime_strip ps; unsigned sq[IUT_MAX_LSTAR + 1]; unsigned n = iut_theta_gau_exponents(d, sq); iut_report r = {0};
    iut_prime_strip_build(&ps, IUT_PS_FMonoGlobValUnitsModTors, "demo", d, 9, sq, n);
    fprintf(f, "    built %s-prime-strip over %u valuations, pilot degree %.4f\n", iut_ps_kind_notation(ps.kind), ps.nV, ps.global_degree);
    iut_validate_prime_strip(&ps, d, &r); return print_report(f, &r);
}
static int p_initial_data(const iut_initial_theta_data *d, FILE *f)
{
    iut_report r = {0}; fprintf(f, "    %s: l=%u, |V|=%u, log q = %.4f, log f = %.4f\n", d->name, d->l, d->nV, iut_log_q(d), iut_log_cond(d)); iut_validate_data(d, &r); return print_report(f, &r);
}

/* =============================================================== IUTchII */
static int p_radial_env(const iut_initial_theta_data *d, FILE *f)
{
    for (size_t i = 0; i < iut_radial_examples_count; ++i) fprintf(f, "    %-12s R = %s | C = %s   %s\n", iut_radial_env_is_multiradial(&iut_radial_examples[i]) ? "multiradial" : "uniradial", iut_radial_examples[i].radial, iut_radial_examples[i].coric, iut_radial_examples[i].ref);
    iut_radial_env e, m; iut_radial_env_make("F-prime-strip", "D⊢", 0, "[IUTchII] Ex 1.8 (i)", &e); iut_radial_env_multiradialize(&e, &m);
    fprintf(f, "    multiradialization (Ex 1.7 (ii)): %s → %s (α = full poly-iso of D⊢ adjoined)\n", iut_radial_env_is_multiradial(&e) ? "multi" : "uni", iut_radial_env_is_multiradial(&m) ? "multi" : "uni");
    return 0;
}
static int p_cyclotomic(const iut_initial_theta_data *d, FILE *f)
{
    for (int k = 0; k < IUT_CYC_COUNT; ++k) { iut_cyclotomic_rigidity c; iut_cyclotomic_rigidity_get((iut_cyclotomic_kind)k, &c); fprintf(f, "    %s: indeterminacy %s, %s, %s ring structure   %s\n", k == 0 ? "mono-theta" : k == 1 ? "MLF-Galois pair" : "number field", c.indeterminacy, c.multiradial ? "multiradial" : "uniradial", c.uses_ring_structure ? "uses" : "no", c.ref); }
    fprintf(f, "    constant multiple rigidity (Cor 1.12): ι-orbit of size %u\n", iut_constant_multiple_rigidity_orbit()); return 0;
}
static int p_theta_eval(const iut_initial_theta_data *d, FILE *f)
{
    iut_tempered_indices ix; iut_tempered_indices_get(d, &ix); iut_theta_value tv[IUT_MAX_LSTAR + 1]; unsigned n = iut_theta_evaluate_all(d, tv);
    fprintf(f, "    [Π:Π_Ÿ]=%u [Π±:Π]=%u [Π±:Π_Ÿ]=%u; %u evaluation points; values θ(√−q^t) in q̲-units:", ix.Pi_to_PiYdd, ix.PiPm_to_Pi, ix.PiPm_to_PiYdd, iut_evaluation_points_count(d));
    { for (unsigned j = 0; j < n; ++j) fprintf(f, " |t|=%d→q̲^%ld", tv[j].abs_t, tv[j].value.num); } fprintf(f, "  (up to μ_%u)\n", tv[0].torsion_indeterminacy); return 0;
}
static int p_monoids(const iut_initial_theta_data *d, FILE *f)
{
    unsigned v = first_bad(d); iut_monoid env, gau, cns, ss, fro; iut_report r = {0};
    iut_monoid_build(d, IUT_MON_THETA, v, 3, 1, &env); iut_monoid_build(d, IUT_MON_GAUSSIAN, v, 3, 1, &gau); iut_monoid_build(d, IUT_MON_CONSTANT, v, 3, 1, &cns); iut_monoid_semisimplify(d, &cns, &ss); iut_monoid_build(d, IUT_MON_CONSTANT, v, 4, 0, &fro);
    fprintf(f, "    at %s: Ψ_env = O×·θ^N (split %d), Ψ_gau generators", d->V[v].name, env.split); for (unsigned j = 0; j < gau.ngen; ++j) fprintf(f, " q̲^%ld", gau.gen[j].num);
    fprintf(f, "; Ψ_cns (1 gen), Ψ^ss_cns = O× × R≥0, log(p_v) = %.4f\n", ss.distinguished_log_p);
    iut_monoid_evaluation_iso(d, &env, &gau, &r); iut_monoid_kummer_iso(&fro, &cns, &r); return print_report(f, &r);
}
static int p_global_realified(const iut_initial_theta_data *d, FILE *f)
{
    iut_prime_strip D, G; iut_prime_strip_build(&D, IUT_PS_DMono, "DMono", d, 7, NULL, 0); iut_global_realified_from_DMono(d, &D, &G);
    fprintf(f, "    D⊢ ↦ D⊩(D⊢): kind %s, global realified: %s, degree of q-object %.4f (defined up to R>0)\n", iut_ps_kind_notation(G.kind), G.has_global_realified ? "yes" : "no", G.global_degree); return !G.has_global_realified;
}
static int p_symmetrize(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u); iut_capsule T, J; iut_capsule_from_T(ht, &T); iut_capsule_from_J(ht, &J); iut_symmetrization a, b;
    iut_symmetrize_FlSemiPm(d, &T, &a); iut_symmetrize_FlStar(d, &J, &b);
    fprintf(f, "    %s: %u classes (|F_l|), conjugate synchronization: %s (copy %u), diagonal %u\n", a.group, a.nclasses, iut_conjugate_synchronized(&a) ? "yes" : "no", a.synchronized_copy, a.diagonal_copy);
    fprintf(f, "    %s: %u classes (F_l^*), conjugate synchronization: %s, diagonal %u\n", b.group, b.nclasses, iut_conjugate_synchronized(&b) ? "yes" : "no", b.diagonal_copy);
    int sub[] = { 1 }; int all[2 * IUT_MAX_LSTAR + 1]; unsigned n = iut_label_line_segment(d, all);
    fprintf(f, "    label subset {1} keeps F_l^{⋊±}-symmetry: %s; full F_l: %s\n", iut_label_subset_keeps_symmetry(d, sub, 1, 1) ? "yes" : "no", iut_label_subset_keeps_symmetry(d, all, n, 1) ? "yes" : "no");
    iut_hodge_theater_free(ht); return !iut_conjugate_synchronized(&a);
}
static int p_forget_ladder(const iut_initial_theta_data *d, FILE *f)
{
    iut_prime_strip src, out[8]; iut_forget_ladder L; unsigned sq[IUT_MAX_LSTAR + 1]; unsigned n = iut_theta_gau_exponents(d, sq);
    iut_prime_strip_build(&src, IUT_PS_FMonoGlobValUnitsModTors, "pilot", d, 9, sq, n); iut_ps_forget_ladder(d, &src, out, &L);
    for (unsigned i = 0; i < L.n; ++i) fprintf(f, "    %s%-8s global %d, valgroup %d, units %s, Kummer %s   %s\n", i ? "→ " : "  ", iut_ps_kind_notation(L.kind[i]), out[i].has_global_realified, out[i].loc[0].has_valgroup, out[i].loc[0].units_copy ? (out[i].loc[0].units_mod_tors ? "O×μ" : "O×") : "—", out[i].loc[0].kummer_kind == 2 ? "Ism-orbit" : out[i].loc[0].kummer_kind == 1 ? "Ẑ×" : "—", L.ref[i]);
    fprintf(f, "    pilot object degree %.4f (≤ 0), ×μ-Kummer orbit marker %u\n", iut_pilot_object_degree(&src), iut_units_mod_tors_kummer_orbit(&src)); return L.n != 5;
}
static int p_cor410(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_GAU); iut_hodge_theater *a = iut_lattice_get(lat, 0, 0), *b = iut_lattice_get(lat, 1, 0); iut_report r = {0}; iut_link L, D; unsigned ex[IUT_MAX_LSTAR + 1];
    iut_constant_strip_identify(a, &r); iut_envelope_isos(a, &r); iut_theta_link_make(a, b, IUT_LINK_THETA_UNITSMODTORS_GAU, &L); iut_theta_link_coric_units(a, b, &r); iut_theta_link_induced_D_link(&L, &D); iut_coric_global_realified(a, b, &r);
    fprintf(f, "    Θ×μ_gau-link (0,0)→(1,0): glued %s, full poly-iso %d, Π preserved %d, O×μ preserved %d, dilation %.3f; induced %s on %s\n", iut_ps_kind_notation(L.glued_kind), L.full_poly_isomorphism, L.preserves_Pi, L.preserves_units_mod_tors, L.dilation, iut_link_kind_notation(D.kind), iut_ps_kind_notation(D.glued_kind));
    unsigned n = iut_theta_gau_exponents(d, ex); fprintf(f, "    exponents q̲ ↦ q̲^{"); for (unsigned i = 0; i < n; ++i) fprintf(f, "%s%u", i ? "," : "", ex[i]); fprintf(f, "} (Rem 4.11.1)\n");
    int rc = print_report(f, &r); free_lat(lat); return rc;
}

/* ============================================================== IUTchIII */
static int p_log_shells(const iut_initial_theta_data *d, FILE *f)
{
    iut_report r = {0}; int rc = 0;
    for (unsigned i = 0; i < d->nV; ++i) { iut_log_shell s; char buf[32]; iut_log_shell_make(d, i, 1, 0, 0, 0, &s); iut_q_fmt(s.radius, buf, sizeof buf); fprintf(f, "    I_%-5s p* = %u, generator valuation %s, log-volume %.4f, iso indeterminacy %s\n", d->V[i].name, s.pstar, buf, s.log_volume, iut_log_shell_iso_indeterminacy(d, i)); rc |= iut_log_shell_properties(&s, d, &r); }
    return print_report(f, &r) | rc;
}
static int p_log_link_strip(const iut_initial_theta_data *d, FILE *f)
{
    iut_prime_strip a, b; iut_log_link_result R; iut_prime_strip_build(&a, IUT_PS_F, "F", d, 11, NULL, 0); iut_log_link_strip(d, &a, &b, 0, &R);
    fprintf(f, "    †F →log ‡F (full): Π kept (%u = %u), units renewed (%u → %u), %u log-shells; coric D %d D⊢ %d; ring preserved %d; log-volume compatible %d; Kummer compatible %d\n", a.loc[0].Pi_copy, b.loc[0].Pi_copy, a.loc[0].units_copy, b.loc[0].units_copy, R.nshell, R.coric_D, R.coric_DMono, R.ring_structure_preserved, R.log_volume_compatible, R.kummer_compatible);
    iut_log_shell s1, s2, s3, s4; iut_log_shell_from(d, IUT_SHELL_HOL_F, 0, 0, 0, &s1); iut_log_shell_from(d, IUT_SHELL_MONO_FUNITSMODTORS, 0, 0, 0, &s2); iut_log_shell_from(d, IUT_SHELL_MONO_DMONO, 0, 0, 0, &s3); iut_log_shell_from(d, IUT_SHELL_HOL_D, 0, 0, 0, &s4);
    fprintf(f, "    I_F ≅ I_F⊢×μ ≅ I_D⊢ ≅ I_D at %s: %s (hol/étale flags %d%d %d%d %d%d %d%d)\n", d->V[0].name, iut_log_shell_isomorphic(&s1, &s2) && iut_log_shell_isomorphic(&s2, &s3) && iut_log_shell_isomorphic(&s3, &s4) ? "yes" : "no", s1.holomorphic, s1.etale_like, s2.holomorphic, s2.etale_like, s3.holomorphic, s3.etale_like, s4.holomorphic, s4.etale_like);
    return R.ring_structure_preserved || R.kummer_compatible || !R.coric_D;
}
static int p_log_chain(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_frobenius_chain c; iut_log_chain_build(lat, 0, -1, 2, &c); iut_report r = {0};
    fprintf(f, "    vertical chain of %u HTs in column 0 (universes", c.n); for (unsigned i = 0; i < c.n; ++i) fprintf(f, " %u", c.universe[i]); fprintf(f, "); translation symmetric %d, adjacent swap %d\n", c.translation_symmetric, c.adjacent_swap_allowed);
    iut_log_link_hodge_theater_check(iut_lattice_get(lat, 0, 0), iut_lattice_get(lat, 0, 1), &r); int rc = print_report(f, &r); free_lat(lat); return rc;
}
static int p_lattice_def(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_report r = {0};
    for (int k = 0; k < IUT_LINK_LOG; ++k) fprintf(f, "    %-10s → %s\n", iut_link_kind_notation((iut_link_kind)k), iut_lattice_flavour((iut_link_kind)k));
    fprintf(f, "    squares commute: %s (Rem 1.4.1 (i))\n", iut_lattice_square_commutes() ? "yes" : "no");
    iut_lattice_horizontal_obligates_vertical(lat, &r); print_report(f, &r); free_lat(lat); return 0;
}
static int p_bicoric(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_bicoric b; iut_bicoric_check(lat, 0, 0, &b);
    fprintf(f, "    (i) D-HT vertically coric %d (Π copy %u)  (ii) F⊢×μ horizontally coric %d (units copy %u)  (iii) F⊢×μ(D⊢_Δ) bi-coric %d  (iv) log-shells bi-coric %d  (v) D⊩(D⊢) bi-coric %d\n", b.vertical_coric_D, b.column_D_copy, b.horizontal_coric_units, b.row_units_copy, b.bicoric_units_of_DMono, b.bicoric_log_shells, b.bicoric_global_realified);
    free_lat(lat); return !(b.vertical_coric_D && b.horizontal_coric_units && b.bicoric_log_shells);
}
static int p_theta_monoids_coric(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_report r = {0}; iut_radial_item it[8]; unsigned n = iut_etale_radial_environment(it, 8);
    iut_theta_monoid_vertically_coric(lat, 0, &r); iut_theta_monoid_multiradial(&r);
    for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-6s %s\n", it[i].item, it[i].data);
    int rc = print_report(f, &r); free_lat(lat); return rc;
}
static int p_tensor_packets(const iut_initial_theta_data *d, FILE *f)
{
    unsigned p = d->V[first_bad(d)].p; iut_tensor_packet P[IUT_MAX_LPM], G; iut_report r = {0}; unsigned n = iut_tensor_packet_procession(d, p, 1, P);
    for (unsigned j = 0; j < n && j < 4; ++j) fprintf(f, "    log(^{S±_%u} F_%u): %u factors, |V_p|=%u, %lu summands, shell log-volume %.4f\n", j + 1, p, P[j].nfactors, P[j].nv_over_vQ, P[j].nsummands, P[j].log_volume_shells);
    iut_tensor_packet_build(d, 1, 0, 0, &P[0]); fprintf(f, "    archimedean I(^{S±_2} D⊢_∞): %lu summands (2^{j}·|V_arc|^{j+1})\n", P[0].nsummands);
    iut_tensor_packet_global(d, 1, &G); fprintf(f, "    global (M_mod)_{S±_2}: %u factors, %lu summand fields\n", G.nfactors, G.nsummands);
    iut_tensor_packet_build(d, 1, p, 1, &P[1]); iut_tensor_packet_localize(&G, &P[1], &r); return print_report(f, &r);
}
static int p_lgp_monoids(const iut_initial_theta_data *d, FILE *f)
{
    unsigned v = first_bad(d); int rc = 0;
    for (unsigned j = 1; j <= d->lstar && j <= 3; ++j) { iut_monoid m; iut_lgp_monoid_build(d, j, v, 5, &m); fprintf(f, "    Ψ_LGP(S±_%u) at %s: splitting monoid generated by q̲^%ld\n", j + 1, d->V[v].name, m.gen[0].num); }
    for (unsigned i = 0; i < d->nV; ++i) { iut_upper_semi_compat u; iut_upper_semi_compatibility(d, i, &u); fprintf(f, "    %-5s %-40s Δlog-vol %+.4f   %s\n", d->V[i].name, u.relation, u.log_volume_delta, u.ref); if (u.log_volume_delta < 0) rc = 1; }
    return rc;
}
static int p_global_variants(const iut_initial_theta_data *d, FILE *f)
{
    unsigned u = 0; iut_hodge_theater *ht = iut_hodge_theater_new(d, 0, 0, &u); iut_report r = {0};
    for (int v = 0; v < 2; ++v) { iut_global_variant_info gi; iut_global_variant_info_get((iut_global_variant)v, &gi); fprintf(f, "    %s: Θ-link compatible %d, log-volume compatible %d   %s\n", gi.objects, gi.multiplicatively_compatible_with_theta_link, gi.compatible_with_log_volume, gi.ref); }
    iut_gau_LGP_lgp_isos(ht, &r); int rc = print_report(f, &r); iut_hodge_theater_free(ht); return rc;
}
static int p_pilots(const iut_initial_theta_data *d, FILE *f)
{
    iut_pilot q, t; iut_pilot_make(d, IUT_PILOT_Q, &q); iut_pilot_make(d, IUT_PILOT_THETA, &t); iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_report r = {0};
    fprintf(f, "    q-pilot {q̲}: log-volume %.4f;  Θ-pilot {q̲^{j²}} (%u exps, last %u): log-volume %.4f;  arithmetic degree of q̲: %.4f\n", q.log_volume, t.nj, t.exps[t.nj - 1], t.log_volume, iut_arith_degree(d, q.exps, 1));
    iut_apply_log_link(lat, 0, -1); iut_LGP_link_requires_log(lat, 0, 0, &r); iut_LGP_link_requires_log(lat, 1, 0, &r);
    fprintf(f, "    lattice for Θ×μ_LGP: %s\n", iut_lattice_kind_for_link(IUT_LINK_THETA_UNITSMODTORS_LGP));
    print_report(f, &r); free_lat(lat); return 0;
}
static int p_log_volumes(const iut_initial_theta_data *d, FILE *f)
{
    double vols[IUT_MAX_LPM]; for (unsigned j = 0; j <= d->lstar; ++j) vols[j] = (double)(j + 1); iut_non_interference ni; iut_kummer_non_interference(d, &ni);
    fprintf(f, "    packet-normalization: vol(p·M) = vol(M) − log p: 0 ↦ %.4f (p=%u); arch: e·M ↦ %.1f\n", iut_log_volume_scale_by_p(0, d->V[first_bad(d)].p), d->V[first_bad(d)].p, iut_log_volume_scale_by_e(0));
    fprintf(f, "    procession-normalization: average of %u capsule volumes = %.4f; log-link compatibility: %s\n", d->lstar + 1, iut_log_volume_procession_normalize(vols, d->lstar + 1), iut_log_volume_log_link_compatible(1.5, 1.5) ? "preserved" : "BROKEN");
    fprintf(f, "    non-interference: F_mod^× ∩ ΠO×_v = μ (order %u), MOD/LGP-link %d, mod/log-volume %d\n", ni.torsion_order, ni.MOD_compatible_with_LGP_link, ni.mod_compatible_with_log_volume); return !ni.non_interference;
}
static int p_multiradial_full(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_multiradial_full M; iut_multiradial_full_build(lat, 0, &M);
    fprintf(f, "    R^LGP_{0,◦}: (a) %u packets, (b) %u splitting monoids, (c) %u copies of F_mod^×; Ind1 %lu, Ind2 on %lu summands, Ind3 %d; log-Kummer %d; link compat %d%d%d%d\n", M.npackets, M.nsplitting, M.nnumberfields, M.ind1_count, M.ind2_summands, M.ind3, M.log_kummer_ok, M.link_compat[0], M.link_compat[1], M.link_compat[2], M.link_compat[3]);
    fprintf(f, "    −|log q| = %.4f, −|log Θ| ≤ %.4f, C_Θ = %.3f, inequality: %s\n", -M.rep.abs_log_q, M.rep.theta_upper_bound, M.rep.C_theta, M.rep.inequality_holds ? "holds" : "FAILS");
    free_lat(lat); return 0;
}
static int p_cor312(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_named_value s[8]; unsigned n = iut_cor312_steps(lat, s, 8);
    for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-90s %12.4f   %s\n", s[i].label, s[i].value, s[i].ref);
    fprintf(f, "    Cor 3.12 holds: %s\n", iut_cor312_holds(lat) ? "yes" : "no"); free_lat(lat); return 0;
}

/* =============================================================== IUTchIV */
static int p_differents(const iut_initial_theta_data *d, FILE *f)
{
    iut_local_field k[3] = { { 7, 1, 1, 0, 0 }, { 7, 2, 1, 0, 0.5 }, { 7, 6, 1, 0, 1.0 } }; double lo, hi;
    for (int i = 0; i < 3; ++i) { int eq = iut_iv_prop12_i(&k[i], &lo, &hi); fprintf(f, "    k_%d (p=%u,e=%u): a=%.3f b=%.3f  p^a R ⊆ log(R×) ⊆ p^{-b} R %s\n", i, k[i].p, k[i].e, iut_iv_a(&k[i]), iut_iv_b(&k[i]), eq ? "(equalities)" : ""); }
    fprintf(f, "    d_I = %.3f, d_{I*} (∗=0) = %.3f; φ(p^λ (R_I)~) ⊆ p^{%g} log(R_I×) ⊆ p^{%g} (R_I)~ for λ=0; (iii) exponent %g; unramified: %d\n", iut_iv_dI(k, 3), iut_iv_dIstar(k, 3, 0), iut_iv_prop12_ii_exp_log(k, 3, 0), iut_iv_prop12_ii_exp_tilde(k, 3, 0), iut_iv_prop12_iii_exp(k, 3, 0), iut_iv_prop12_iv_unramified(k, 1));
    iut_iv_prop13_bounds(&k[0], &k[2], 1, &lo, &hi); fprintf(f, "    Prop 1.3: %.3f ≤ d_2 ≤ %.3f (actual %.3f)\n", lo, hi, k[2].d);
    return !(lo <= k[2].d + 1e-9);
}
static int p_nonarch_volume(const iut_initial_theta_data *d, FILE *f)
{
    unsigned v = first_bad(d); iut_local_field k[2] = { { d->V[v].p, d->V[v].e_K ? d->V[v].e_K : 1, d->V[v].f_K ? d->V[v].f_K : 1, d->V[v].p == 2 ? 1 : 0, 0 }, { d->V[v].p, 1, 1, 0, 0 } }; int star[2] = { k[0].e > k[0].p - 2, 0 };
    fprintf(f, "    μ_log(log_p(R×)) at %s = %.4f; Prop 1.4 (iii) bounds for λ=0: log part ≤ %.4f, tilde part ≤ %.4f; d_I + a_I ≥ %.0f; (iv) unramified odd ⇒ μ_log = 0: %d\n", d->V[v].name, iut_iv_mulog_log_units(&k[0]), iut_iv_prop14_iii_bound_log(k, 2, star[0], 0), iut_iv_prop14_iii_bound_tilde(k, 2, star, 0), iut_iv_prop14_iii_dI_plus_aI_lower(k, 2), iut_iv_prop14_iv(&k[1], 1));
    fprintf(f, "    the same number through iut_log_shell_volume (with p*): %.4f\n", iut_log_shell_volume(&d->V[v], 0)); return 0;
}
static int p_arch(const iut_initial_theta_data *d, FILE *f)
{
    unsigned narc = 0; for (unsigned i = 0; i < d->nV; ++i) if (d->V[i].kind == IUT_V_ARCH) narc++;
    { for (unsigned n = 1; n <= 3; ++n) fprintf(f, "    |I|=%u: %lu summands, metric factor %.0f, ⊗m ∈ λ^{|I|}B with λ=2: %.0f\n", n, iut_iv_arch_summands(n, narc), iut_iv_arch_metric_factor(n), iut_iv_arch_tensor_bound(n, 2.0)); } return 0;
}
static int p_pnt(const iut_initial_theta_data *d, FILE *f)
{
    fprintf(f, "    n ≤ 4p_n/(3 log p_n): p_25 = 97 ⇒ n ≤ %.2f; #{p ≤ η_prm} ≤ %.3e;  log x ≤ x at x=%u: %d;  θ(x) ∈ [%.1f, %.1f] for x = 100; prime in A with θ_A=50, ξ=5: p ≤ %.0f\n", iut_iv_pnt_n_bound(97), iut_iv_pnt_count_bound(IUT_ETA_PRM_VALUE), d->l, iut_iv_log_le_x(d->l), iut_iv_chebyshev_lo(100), iut_iv_chebyshev_hi(100), iut_iv_prime_in_A_bound(50, 5)); return iut_iv_pnt_n_bound(97) < 25;
}
static int p_weighted(const iut_initial_theta_data *d, FILE *f)
{
    double lam[IUT_MAX_V], beta[IUT_MAX_V]; unsigned n; unsigned p = d->V[first_bad(d)].p; iut_iv_normalized_weights(d, p, lam, &n); for (unsigned i = 0; i < n; ++i) beta[i] = (double)(i + 1);
    fprintf(f, "    weights λ_v = [(F_mod)_v:Q_%u] for %u valuation(s) above %u; weighted average of β = 1..n: %.4f\n", p, n, p, iut_iv_weighted_average(beta, lam, n)); return n == 0;
}
static int p_torsion(const iut_initial_theta_data *d, FILE *f) { iut_report r = {0}; iut_iv_torsion_facts(d, &r); print_report(f, &r); return 0; }
static int p_divisors(const iut_initial_theta_data *d, FILE *f)
{
    iut_arith_divisor Dq, Z, S; iut_arith_divisor_q(d, &Dq); iut_arith_divisor_zero(d, &Z); iut_arith_divisor_add(&Dq, &Z, &S); unsigned p = d->V[first_bad(d)].p;
    fprintf(f, "    q-divisor: deg = %.4f, normalized deg = %.4f (= log q %.4f), deg over v|%u: %.4f\n", iut_arith_divisor_deg(d, &Dq), iut_arith_divisor_normalized_deg(d, &S), iut_log_q(d), p, iut_arith_divisor_deg_E(d, &Dq, p));
    return fabs(iut_arith_divisor_normalized_deg(d, &Dq) - iut_log_q(d)) > 1e-9;
}
static int p_thm110(const iut_initial_theta_data *d, FILE *f)
{
    iut_thm110 T; iut_thm110_compute(d, &T);
    fprintf(f, "    (E1) n=%u: %.1f (E2) %.3f (E3) |GL2(F_%u)| = %.0f (E5) %.0f\n", d->lstar, iut_iv_E1(d->lstar), iut_iv_E2(d->lstar), d->l, iut_iv_E3(d->l), iut_iv_E5());
    fprintf(f, "    log q = %.4f, |log q| = %.4f, log d^Ftpd = %.4f, log f^Ftpd = %.4f, log d^K ≤ %.4f, e_mod = %.0f, e*_mod = %.0f\n", T.logq, T.abs_logq, T.logd_tpd, T.logf_tpd, T.logdK_bound, T.e_mod, T.estar_mod);
    fprintf(f, "    C_Θ = %.3f (Cor 3.12 ⇔ C_Θ ≥ −1: %s);  (1/6) log q = %.4f ≤ %.4e: %s\n", T.C_theta, T.cor312_holds ? "yes" : "no", T.lhs, T.rhs, T.inequality_holds ? "holds" : "FAILS"); return !T.inequality_holds;
}
static int p_cor22(const iut_initial_theta_data *d, FILE *f)
{
    iut_cor22 C; iut_cor22_compute(d, &C);
    fprintf(f, "    d = %.0f, δ = %.0f, log q∀ = %.4f; (C1) %.2f ≤ l ≤ %.3e: l = %u %s; ε_E = %.4e\n", C.d, C.delta, C.logq_all, C.l_min, C.l_max, d->l, C.l_in_range ? "in range" : "OUT OF RANGE", C.eps_E);
    fprintf(f, "    (C2) %.4f ≤ (1+ε_E)(%.4f + [%.4f, %.4f]) + %.3e: %s;  Cor 2.3 slack: %.3e\n", C.lhs, C.logdiff, C.logcond_lo, C.logcond_hi, C.C_K, C.holds ? "holds" : "FAILS", iut_cor23_bound(C.lhs, C.logdiff, C.logcond_lo, C.eps_E, C.C_K)); return !C.holds;
}
static int p_species(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_mutation_history H; iut_mutation_history_from_lattice(lat, &H); iut_mutation c, id; int rc = 0;
    if (iut_mutation_count >= 2) { int done = 0; for (size_t i = 0; i < iut_mutation_count && !done; ++i) for (size_t k = 0; k < iut_mutation_count && !done; ++k) if (!iut_mutation_compose(&iut_mutation_table[i], &iut_mutation_table[k], &c)) { fprintf(f, "    compose %s then %s: %s → %s (core %d)\n", iut_mutation_table[i].id, iut_mutation_table[k].id, c.dom, c.cod, c.is_core); done = 1; } if (!done) fprintf(f, "    (no composable pair in the mutation table)\n"); }
    iut_mutation_identity(&iut_species_table[0], &id); fprintf(f, "    identity of %s: %s → %s; species-isomorphic to itself: %d\n", id.dom, id.dom, id.cod, iut_species_isomorphic(&iut_species_table[0], &iut_species_table[0]));
    fprintf(f, "    mutation-history of the lattice: %u vertices, %u edges; cores: D⊢ %d, F⊢×μ %d, D-HT %d, F-HT %d\n", H.nvertices, H.nedges, iut_observable_is_core("DMonoPrimeStrip"), iut_observable_is_core("FMonoUnitsModTorsPrimeStrip"), iut_observable_is_core("DThetaPmEllNFHodgeTheater"), iut_observable_is_core("ThetaPmEllNFHodgeTheater"));
    rc = iut_observable_is_core("ThetaPmEllNFHodgeTheater"); free_lat(lat); return rc;
}

/* ================================================================ EssLgc */
static int p_esslgc_model(const iut_initial_theta_data *d, FILE *f)
{
    int rc = 0;
    for (int k = 0; k < IUT_LOGIC_COUNT; ++k) { iut_esslgc_model m; iut_esslgc_model_eval(0.5, 0.75, 0.5, (iut_logic_flavour)k, &m); fprintf(f, "    %-28s Θ-link: N=%.2f ∧ N=%.2f; multiradial: N=%.2f ∧ N=%.2f ⇒ %s\n", iut_logic_flavour_name(m.flavour), m.N_theta_link[0], m.N_theta_link[1], m.N_multiradial[0], m.N_multiradial[1], m.meaningful ? (m.consistent ? "A = ε ≤ 1" : "inconsistent") : "no conclusion"); if (k == 0) rc = !m.meaningful; }
    return rc;
}
static int p_stp_chain(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_stp s[8]; unsigned n = iut_stp_chain(lat, s, 8); double q, t;
    for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-9s %-12s ⇝ %-22s %-9s %10.4f   %s\n", s[i].id, s[i].from, s[i].to, s[i].indeterminacy, s[i].log_volume, s[i].ref);
    iut_fix_and_glue(lat, &q, &t); fprintf(f, "    (FxGl) q-pilot fixed at (1,0): %.4f; glued Θ-pilot at (0,0): %.4f\n", q, t); free_lat(lat); return n != 8;
}
static int p_fuzzify(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_multiradial_rep rep; iut_multiradial_build(lat, 0, &rep);
    iut_pilot th; iut_pilot_make(d, IUT_PILOT_THETA, &th);
    iut_interval R = iut_fuzzify(th.log_volume, &rep.ind, 0.0, 0.0, rep.theta_upper_bound - th.log_volume); iut_interval R2 = iut_fuzzify(-rep.abs_log_q, &rep.ind, 0.5, 0.5, rep.hull_enlargement);
    fprintf(f, "    Θ-pilot %.4f fuzzified by Ind1-3 to [%.4f, %.4f]: engulfs −|log q| = %.4f: %s;  q-pilot fuzzified symmetrically: [%.4f, %.4f]\n", th.log_volume, R.lo, R.hi, -rep.abs_log_q, iut_engulfs(R, -rep.abs_log_q) ? "yes" : "no", R2.lo, R2.hi);
    int a[] = { 1, 2 }, b[] = { 2, 3 }, out[8]; unsigned n1 = iut_extind1_union(a, 2, b, 2, out); unsigned n2 = iut_extind2_crush(out, n1, iut_label_abs, out + 4);
    fprintf(f, "    (ExtInd1) {1,2} ∪ {2,3} has %u elements; (ExtInd2) crushed by |·|: %u classes; %s; %s\n", n1, n2, iut_or_indeterminacy_verdict(1), iut_or_indeterminacy_verdict(0)); free_lat(lat); return !(n1 == 3 && n2 == 3 && iut_engulfs(R, -rep.abs_log_q));
}

/* ================================================================= Alien */
static int p_gauss(const iut_initial_theta_data *d, FILE *f)
{
    iut_gauss_step s[12]; unsigned n = iut_alien_gauss_steps(s, 12);
    for (unsigned i = 0; i < n; ++i) { char b[16]; if (isnan(s[i].value)) snprintf(b, sizeof b, "—"); else snprintf(b, sizeof b, "%.5f", s[i].value); fprintf(f, "    Step %2u %-64s %8s   ↔ %s\n", s[i].step, s[i].title, b, s[i].iut_analogue); }
    fprintf(f, "    numerical ∫e^{−x²} = %.6f, √π = %.6f\n", iut_alien_gauss_numeric(), sqrt(M_PI)); return fabs(iut_alien_gauss_numeric() - sqrt(M_PI)) > 1e-3;
}
static int p_transport(const iut_initial_theta_data *d, FILE *f)
{
    iut_transport_stage st[8]; unsigned n = iut_transport_apparatus(st, 8); iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_named_value v[4]; unsigned m = iut_transport_run(lat, v, 4);
    for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-62s %-8s %-48s %s\n", st[i].stage, st[i].side, st[i].mass, st[i].indeterminacy);
    { for (unsigned i = 0; i < m; ++i) fprintf(f, "    run: %-70s %12.4f\n", v[i].label, v[i].value); } free_lat(lat); return n != 7;
}
static int p_formal_sums(const iut_initial_theta_data *d, FILE *f)
{
    iut_report r = {0}; char buf[32]; int seg[2 * IUT_MAX_LSTAR + 1], ev[2];
    for (int k = 0; k < 4; ++k) { iut_formal_sum s; iut_formal_sum_make(d, (iut_formal_sum_kind)k, 2, &s); iut_q_fmt(iut_formal_sum_total(&s), buf, sizeof buf); fprintf(f, "    %-6s %2u terms, total mass %s\n", k == 0 ? "[0]" : k == 1 ? "[|2|]" : k == 2 ? "[⊞]" : "[>]", s.n, buf); }
    iut_formal_sum_compatible(d, IUT_FS_ZERO, &r); iut_formal_sum_compatible(d, IUT_FS_BOXPLUS, &r); iut_formal_sum_compatible(d, IUT_FS_ABS_J, &r);
    unsigned n = iut_label_line_segment(d, seg), m = iut_evaluation_points(d, 2, ev); fprintf(f, "    line segment of Ÿ: %u labels %d..%d; evaluation points of t=2: {%d,%d} (%u)\n", n, seg[0], seg[n - 1], ev[0], ev[1], m);
    return print_report(f, &r);
}
static int p_estimate(const iut_initial_theta_data *d, FILE *f)
{
    iut_log_theta_lattice *lat = new_lat(d, IUT_LINK_THETA_UNITSMODTORS_LGP); iut_named_value v[12]; unsigned n = iut_alien_estimate_steps(lat, v, 12);
    for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-74s %12.4f   %s\n", v[i].label, v[i].value, v[i].ref);
    fprintf(f, "    leading term per j (j=1): %.4f; sum over F_l^*: %.4f ≈ (l²/48)(6 log d^K − log q) = %.4f; l ≈ √ht = %.2f\n", iut_alien_leading_term_j(d, 1), iut_alien_leading_term_sum(d), iut_leading_term(d), iut_alien_l_from_height(d)); free_lat(lat); return n != 12;
}
static int p_dictionary(const iut_initial_theta_data *d, FILE *f)
{ iut_dictionary_entry e[11]; unsigned n = iut_alien_dictionary(e, 11); for (unsigned i = 0; i < n; ++i) fprintf(f, "    %-70s ↔ %s\n", e[i].gauss, e[i].iut); return n != 11; }

/* ============================================================== registry */
const iut_process iut_processes[] = {
/* IUTchI */
{ "MapLabels",            "IUTchI",   "§4-§6, Def 6.13",     "label sets F_l ⊇ F_l^× ↠ F_l^*, |F_l| and the gluing 0,⊞ ↦ >", "InitialThetaData",            "labels",                     p_label_maps },
{ "ActSymmetries",        "IUTchI",   "Prop 4.9, Prop 6.6",  "the F_l^{⋊±}- and F_l^*-symmetries and their orbits",            "InitialThetaData, label",     "label, orbit size",          p_label_orbits },
{ "LabelCusps",           "IUTchI",   "Def 6.1, Prop 6.5",   "LabCusp±(D_⊚) ≅ F_l, LabCusp(D_⊛) ≅ F_l^*, forgetting the sign",  "InitialThetaData",            "LabCusp, LabCusp±",          p_labcusp },
{ "ExtractCapsules",      "IUTchI",   "§0, Def 4.1, Def 6.4", "the capsules F_T, F_J and morphisms of capsules",                 "ThetaPmEllNFHodgeTheater",    "capsule, capsule morphism",  p_capsules },
{ "BuildProcessions",     "IUTchI",   "Prop 4.11, Prop 6.9", "processions Prc(D_J), Prc(D_T) with their automorphisms",         "InitialThetaData",            "procession",                 p_procession },
{ "BuildBridges",         "IUTchI",   "Def 4.6, 5.5, 6.4",   "Θ-, NF-, Θ±- and Θell-bridges and their symmetry groups",         "ThetaPmEllNFHodgeTheater",    "bridge",                     p_bridges },
{ "ForgetToDHodgeTheater","IUTchI",   "Def 6.13, Rem 6.12.2","Θ±ell NF-HT ↦ D-Θ±ell NF-HT, and the Θ±ell/ΘNF/Θ projections",    "ThetaPmEllNFHodgeTheater",    "DThetaPmEllNFHodgeTheater",  p_ht_to_D },
{ "ChainFrobeniusPicture","IUTchI",   "Cor 3.8",             "the Frobenius picture: a chain of Θ-linked Hodge theaters",      "LogThetaLattice",             "chain of universes",         p_frobenius_chain },
{ "DrawEtalePicture",     "IUTchI",   "Cor 4.12, Cor 6.10",  "the étale picture: D-HTs as spokes around the core D⊢",           "LogThetaLattice",             "étale picture",              p_etale_picture },
{ "BuildGlobalNF",        "IUTchI",   "Ex 5.1, Cor 5.3",     "global number-field data from Π_{C_K} and its Kummer isomorphism","InitialThetaData",            "F^⊛, F^⊛_mod, F^⊛R",         p_global_nf },
{ "GlueHodgeTheaters",    "IUTchI",   "Prop 6.7, Def 6.13",  "gluing Θ±ell-HT to ΘNF-HT along 0,⊞ ↦ >",                          "ThetaPmEllHodgeTheater, ThetaNFHodgeTheater", "ThetaPmEllNFHodgeTheater", p_gluing },
{ "BuildPrimeStrip",      "IUTchI",   "Def 4.1, Def 5.2",    "construct and validate a prime-strip of any of the 9 kinds",     "InitialThetaData",            "prime-strip",                p_prime_strip },
{ "GenerateInitialData",  "IUTchI",   "Def 3.1",             "initial Θ-data from an abc triple / example and its validation",  "abc triple",                  "InitialThetaData, report",   p_initial_data },
/* IUTchII */
{ "ClassifyRadial",       "IUTchII",  "Ex 1.7-1.9",          "radial environments, multiradiality, multiradialization",        "radial data, coric data",     "multiradial / uniradial",    p_radial_env },
{ "RigidifyCyclotomes",   "IUTchII",  "Cor 1.10-1.12",       "the three cyclotomic rigidity isomorphisms, constant multiple rigidity", "Π_v / G_v, M^Θ",       "rigidity + indeterminacy",   p_cyclotomic },
{ "EvaluateTheta",        "IUTchII",  "Cor 2.4, 2.5, 2.8",   "theta evaluation at the l-torsion points: θ ↦ q̲^{t²}, |t|-dependence", "InitialThetaData",     "theta values",               p_theta_eval },
{ "BuildMonoids",         "IUTchII",  "Prop 3.1, Cor 3.5-3.7, 4.5-4.6", "Ψ_env, Ψ_gau, Ψ_cns, Ψ^ss_cns; evaluation and Kummer isomorphisms", "prime-strip at v",  "monoid",                     p_monoids },
{ "RealifyFromDMono",     "IUTchII",  "Cor 4.5 (ii)",        "D⊢ ↦ D⊩(D⊢): the global realified Frobenioid from the core",      "DMonoPrimeStrip",             "FMonoGlobPrimeStrip",        p_global_realified },
{ "Symmetrize",           "IUTchII",  "Cor 3.5 (i), 4.5 (iii), 4.7 (ii)", "symmetrizing isomorphisms, diagonals, conjugate synchronization", "capsule",          "symmetrization",             p_symmetrize },
{ "ForgetLadder",         "IUTchII",  "Def 4.9",             "F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢ and the pilot object",            "FMonoGlobValUnitsModTorsPrimeStrip", "prime-strips",        p_forget_ladder },
{ "LinkThetaUnitsModTors","IUTchII",  "Cor 4.10, Rem 4.11.1","F⊩_Δ ≅ F⊩_mod, F⊩_env ≅ F⊩_gau, the Θ×μ(_gau)-link, coric F⊢×μ and D⊩", "two Hodge theaters",   "link, D-link",               p_cor410 },
/* IUTchIII */
{ "MakeLogShells",        "IUTchIII", "Def 1.1, Prop 1.2 (v)-(ix)", "log-shells I_v and their properties / isomorphisms",       "InitialThetaData",            "LogShell",                   p_log_shells },
{ "ApplyLogLinkStrip",    "IUTchIII", "Def 1.1, Prop 1.2",   "the log-link on an F-prime-strip; what is coric and what is not", "FPrimeStrip",                 "FPrimeStrip, LogShell",      p_log_link_strip },
{ "ChainLogLinks",        "IUTchIII", "Prop 1.2 (x), Prop 1.3", "the vertical Frobenius picture and the log-link of Hodge theaters", "LogThetaLattice",       "chain, report",              p_log_chain },
{ "DefineLattice",        "IUTchIII", "Def 1.4, Rem 1.4.1",  "lattice flavours; non-commutativity; horizontal obligates vertical", "LogThetaLattice",         "report",                     p_lattice_def },
{ "CheckBicoric",         "IUTchIII", "Thm 1.5",             "vertical / horizontal / bi-coric data of the lattice",            "LogThetaLattice",             "bicoric summary",            p_bicoric },
{ "CoricThetaMonoids",    "IUTchIII", "Prop 2.1, Thm 2.2, Cor 2.3", "vertically coric theta monoids; the étale-picture radial environment", "LogThetaLattice", "report, radial items",       p_theta_monoids_coric },
{ "BuildTensorPackets",   "IUTchIII", "Prop 3.1-3.3",        "local holomorphic / mono-analytic / global tensor packets",       "LogShell, InitialThetaData",  "TensorPacket",               p_tensor_packets },
{ "BuildLGPMonoids",      "IUTchIII", "Prop 3.4, Prop 3.5",  "LGP-monoids in the packets; upper semi-compatibility (Ind3)",     "TensorPacket",                "monoid, Δlog-volume",        p_lgp_monoids },
{ "CompareGlobalVariants","IUTchIII", "Ex 3.6, Prop 3.7",    "F_MOD vs F_mod; F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp",                        "ThetaPmEllNFHodgeTheater",    "report",                     p_global_variants },
{ "MakePilots",           "IUTchIII", "Def 3.8",             "q-/Θ-pilot objects; the Θ×μ_LGP-link relative to a log-link",     "InitialThetaData, lattice",   "QPilot, ThetaPilot",         p_pilots },
{ "NormalizeLogVolumes",  "IUTchIII", "Prop 3.9, Prop 3.10", "packet-/procession-normalization, arithmetic degree, non-interference", "log-volumes",         "numbers",                    p_log_volumes },
{ "RepresentMultiradially","IUTchIII","Thm 3.11",            "the multiradial representation (a)(b)(c) with Ind1-Ind3",         "LogThetaLattice",             "MultiradialRepresentation",  p_multiradial_full },
{ "EstimateLogVolume",    "IUTchIII", "Cor 3.12",            "−|log Θ| ≥ −|log q| as numbered steps",                           "LogThetaLattice",             "numbers",                    p_cor312 },
/* IUTchIV */
{ "BoundDifferents",      "IUTchIV",  "Prop 1.1-1.3",        "differents, a_i, b_i, the φ-estimates, bounds for d_i",           "local fields k_i",            "exponents",                  p_differents },
{ "EstimateNonarchVolume","IUTchIV",  "Prop 1.4",            "μ_log(log_p R×) and the normalized log-volume bounds",            "local fields k_i",            "log-volumes",                p_nonarch_volume },
{ "EstimateArchMetric",   "IUTchIV",  "Prop 1.5",            "archimedean summands 2^{|I|−1}|V|^{|I|} and metric factors",      "|I|, |V_arc|",                "counts",                     p_arch },
{ "BoundPrimes",          "IUTchIV",  "Prop 1.6, Prop 2.1",  "prime number theorem and Chebyshev-type bounds",                  "numbers",                     "numbers",                    p_pnt },
{ "AverageWeighted",      "IUTchIV",  "Prop 1.7",            "weighted averages with λ_v = [(F_mod)_v : Q_p]",                   "InitialThetaData",            "number",                     p_weighted },
{ "CheckTorsionPoints",   "IUTchIV",  "Prop 1.8",            "torsion points, fields of definition, ramification at Vbad",      "InitialThetaData",            "report",                     p_torsion },
{ "DegreeArithDivisors",  "IUTchIV",  "Def 1.9",             "arithmetic divisors, deg, normalized degree, deg_E",              "InitialThetaData",            "ArithDivisor, numbers",      p_divisors },
{ "ComputeThmOneTen",     "IUTchIV",  "Thm 1.10",            "(E1)-(E6), the intermediate bounds and the final inequality",     "InitialThetaData",            "Thm 1.10 numbers",           p_thm110 },
{ "ComputeCorTwoTwo",     "IUTchIV",  "Cor 2.2, Cor 2.3",    "δ, (C1) range of l, ε_E, (C2), the height form",                  "InitialThetaData",            "Cor 2.2 numbers",            p_cor22 },
{ "OperateSpecies",       "IUTchIV",  "Def 3.1, Def 3.3",    "compose/identity mutations, species-isomorphism, mutation-history, cores", "species tables, lattice", "mutation, history",    p_species },
/* EssLgc */
{ "EvaluateLogicModel",   "EssLgc",   "Ex 2.4.5",            "the numerical model: ∧ gives A = ε ≤ 1, ∨ gives nothing",          "A, B, ε",                     "conclusion",                 p_esslgc_model },
{ "ChainAndSteps",        "EssLgc",   "§3.10 (Stp1)-(Stp8), (FxGl)", "the chain of logical ∧ relations through the lattice",     "LogThetaLattice",             "steps with log-volumes",     p_stp_chain },
{ "Fuzzify",              "EssLgc",   "§3.10 (Englf), (ExtInd1/2), §3.11", "fuzzification, engulfing, extending indeterminacies, ∨ verdicts", "value, indeterminacies", "interval",            p_fuzzify },
/* Alien */
{ "ComputeGaussian",      "Alien",    "§1 Steps 1-12",       "the Gaussian integral and its IUT analogues",                     "—",                           "√π",                         p_gauss },
{ "TransportMonoAnabelian","Alien",   "§2.7, Fig 2.1",       "mono-anabelian transport: Kummer-detachment, étale-transport",    "LogThetaLattice",             "stages",                     p_transport },
{ "SumLabelsFormally",    "Alien",    "§3.6",                "formal sums [0], [|j|], [⊞], [>] and their compatibilities; Ÿ labels", "InitialThetaData",       "formal sums",                p_formal_sums },
{ "StepEstimate",         "Alien",    "§3.7 (1est)-(12est), (iv)", "the estimate step by step; the leading term",              "LogThetaLattice",             "numbers",                    p_estimate },
{ "TranslateDictionary",  "Alien",    "§3.8",                "the dictionary (1gau)-(11gau)",                                   "—",                           "table",                      p_dictionary },
};
const size_t iut_process_count = sizeof iut_processes / sizeof iut_processes[0];

static int ci_eq(const char *a, const char *b) { for (; *a && *b; ++a, ++b) if ((*a | 32) != (*b | 32)) return 0; return *a == *b; }
static int ci_has(const char *hay, const char *needle)
{
    size_t n = strlen(needle);
    for (; *hay; ++hay) { size_t i = 0; while (i < n && hay[i] && (hay[i] | 32) == (needle[i] | 32)) ++i; if (i == n) return 1; }
    return 0;
}
const iut_process *iut_process_find(const char *id) { for (size_t i = 0; i < iut_process_count; ++i) if (ci_eq(iut_processes[i].id, id)) return &iut_processes[i]; return NULL; }
static int matches(const iut_process *p, const char *filter)
{ return !filter || !*filter || ci_has(p->id, filter) || ci_has(p->paper, filter) || ci_has(p->section, filter) || ci_has(p->name, filter); }
int iut_process_run(const iut_process *p, const iut_initial_theta_data *d, FILE *out)
{
    fprintf(out, "%s  [%s] %s — %s\n  in: %s   out: %s\n", p->id, p->paper, p->section, p->name, p->inputs, p->outputs);
    int rc = p->run(d, out);
    fprintf(out, "  => %s\n", rc ? "FAILED" : "ok");
    return rc;
}
int iut_process_run_all(const iut_initial_theta_data *d, FILE *out, const char *filter)
{
    int fails = 0, n = 0;
    for (size_t i = 0; i < iut_process_count; ++i) if (matches(&iut_processes[i], filter)) { n++; if (iut_process_run(&iut_processes[i], d, out)) fails++; }
    fprintf(out, "%d process(es) run, %d failure(s)\n", n, fails);
    return fails;
}
void iut_view_processes(FILE *f, const char *filter)
{
    fprintf(f, "%-24s %-9s %-34s %s\n", "id", "paper", "section", "process");
    for (size_t i = 0; i < iut_process_count; ++i) if (matches(&iut_processes[i], filter)) fprintf(f, "%-24s %-9s %-34s %s\n", iut_processes[i].id, iut_processes[i].paper, iut_processes[i].section, iut_processes[i].name);
}
static void jstr(FILE *f, const char *s) { fputc('"', f); for (; *s; ++s) { if (*s == '"' || *s == '\\') fputc('\\', f); if (*s == '\n') fputs("\\n", f); else fputc(*s, f); } fputc('"', f); }
void iut_json_processes(FILE *f)
{
    fputs("[\n", f);
    for (size_t i = 0; i < iut_process_count; ++i) {
        const iut_process *p = &iut_processes[i];
        fputs("  {\"id\":", f); jstr(f, p->id); fputs(",\"paper\":", f); jstr(f, p->paper); fputs(",\"section\":", f); jstr(f, p->section); fputs(",\"name\":", f); jstr(f, p->name); fputs(",\"inputs\":", f); jstr(f, p->inputs); fputs(",\"outputs\":", f); jstr(f, p->outputs);
        fprintf(f, "}%s\n", i + 1 < iut_process_count ? "," : "");
    }
    fputs("]\n", f);
}
void iut_md_processes(FILE *f)
{
    fputs("# Processes\n\nGenerated by `iut procs --md` from `src/iut_proc.c`. Each row is a C function family in `src/iut_ops_*.c` (declared in `src/iut_ops.h`), mirrored in `htdocs/ops.js`; `iut run <id>` demonstrates it.\n\n| id | paper | section | process | inputs | outputs |\n|---|---|---|---|---|---|\n", f);
    for (size_t i = 0; i < iut_process_count; ++i) { const iut_process *p = &iut_processes[i]; fprintf(f, "| `%s` | %s | %s | %s | %s | %s |\n", p->id, p->paper, p->section, p->name, p->inputs, p->outputs); }
}
