/*
 * views/procs.js — "Processes": the registry of 73 processes (src/iut_proc.c), grouped by paper, each run
 * live by the engine on the selected Θ-data (`iut run <id>`), with its inputs → outputs, the transcript,
 * the identifiers it touches and the C functions behind it.  "Run all" = `iut run --all`.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, DG = root.DIAG, el = U.el, esc = U.esc;
  var PAPERS = ['IUTchI', 'IUTchII', 'IUTchIII', 'IUTchIV', 'EssLgc', 'Alien'];
  var PAPER_TITLES = { IUTchI: 'IUT I — construction of Hodge theaters', IUTchII: 'IUT II — Hodge–Arakelov-theoretic evaluation', IUTchIII: 'IUT III — canonical splittings of the log-theta-lattice', IUTchIV: 'IUT IV — log-volume computations and set-theoretic foundations', EssLgc: 'On the essential logical structure of IUT', Alien: 'The mathematics of mutually alien copies' };
  var FUNCS = {
    MapLabels: 'iut_label_abs, iut_label_in_FlUnits, iut_label_FlUnits_to_FlStar, iut_label_glue_pm_to_nf', ActSymmetries: 'iut_sym_FlSemiPm_act, iut_sym_FlStar_act, iut_label_orbit_FlSemiPm, iut_label_orbit_FlStar',
    LabelCusps: 'iut_labcusp_pm_make, iut_labcusp_make, iut_labcusp_forget_sign', ExtractCapsules: 'iut_capsule_from_T, iut_capsule_from_J, iut_capsule_morphism_valid, iut_capsule_full_poly_iso_count',
    BuildProcessions: 'iut_procession_build, iut_procession_capsule_labels', BuildBridges: 'iut_bridge_build', ForgetToDHodgeTheater: 'iut_hodge_theater_to_D, iut_d_hodge_theater_iso, iut_hodge_theater_pmell/nf/theta',
    ChainFrobeniusPicture: 'iut_frobenius_chain_build, iut_frobenius_chain_translate', DrawEtalePicture: 'iut_etale_picture_build, iut_etale_picture_permute', BuildGlobalNF: 'iut_global_nf_build, iut_global_nf_realify, iut_global_nf_kummer',
    GlueHodgeTheaters: 'iut_hodge_theater_glue, iut_label_glue_pm_to_nf', BuildPrimeStrip: 'iut_prime_strip_build, iut_validate_prime_strip', GenerateInitialData: 'iut_gen_from_abc, iut_gen_example, iut_validate_data',
    ClassifyPseudoMonoids: 'iut_pseudo_monoid_get, iut_pseudo_monoid_contains', ComposePolyMorphisms: 'iut_poly_make, iut_poly_compose, iut_poly_plus_full_make, iut_anabelioid_make, iut_field_kind_of_valuation',
    ClassifyOrbicurves: 'iut_orbicurve_get', ReconstructCoverings: 'iut_cusps_section_one_get, iut_cor_one_two_run', CompareTempered: 'iut_tempered_facts, iut_tempered_at_v_get', CheckDefThreeOne: 'iut_def_three_one_check, iut_theta_approach_get, iut_def_three_one_determining_data, iut_s_mod_get',
    CheckKappaCoric: 'iut_kappa_coric_check, iut_kappa_sol_get', BuildLocalFrobenioids: 'iut_local_frobenioid_build, iut_local_frobenioid_split_iso, iut_local_frobenioid_reconstructions', BuildGlobalRealified: 'iut_global_realified_build, iut_rho_v, iut_rho_theta_v, iut_f_monoglob_build, iut_f_monoglob_iso',
    AssembleThetaHodgeTheater: 'iut_theta_hodge_theater_def_build, iut_theta_link_cor_three_seven', TorsorLabelCusps: 'iut_labcusp_torsor_make, iut_labcusp_torsor_act, iut_labcusp_pm_torsor_make, iut_labcusp_pm_forget', DescribeGlobalBases: 'iut_global_base_get, iut_valuation_orbits',
    EvaluateAtPoints: 'iut_eval_points_make, iut_theta_bridge_piece_get', TransportLabelClasses: 'iut_label_transport_make, iut_label_transport_check', CountIsomorphismTorsors: 'iut_iso_torsors', CountForgottenSymmetries: 'iut_forgetful_counts_get',
    DistributeGlobalData: 'iut_global_frobenioid_get, iut_distribution_make, iut_distribution_log_volume', LiftToFrobenioids: 'iut_strip_functors, iut_lift_d_to_f', StructureFlSemiPm: 'iut_fl_semi_pm_group_make, iut_fl_semi_pm_torsor_make, iut_fl_semi_pm_is_positive, iut_fl_semi_pm_abs/star, iut_sign_vector_make',
    ReduceThetaPmToTheta: 'iut_prop_six_seven_apply, iut_processions_compatible', CompareHalfPlane: 'iut_half_plane_dictionary, iut_ht_frobenioids',
    ClassifyRadial: 'iut_radial_env_make, iut_radial_env_is_multiradial, iut_radial_env_multiradialize', RigidifyCyclotomes: 'iut_cyclotomic_rigidity_get, iut_constant_multiple_rigidity_orbit', EvaluateTheta: 'iut_tempered_indices_get, iut_theta_evaluate, iut_theta_evaluate_all',
    BuildMonoids: 'iut_monoid_build, iut_monoid_semisimplify, iut_monoid_evaluation_iso, iut_monoid_kummer_iso', RealifyFromDMono: 'iut_global_realified_from_DMono', Symmetrize: 'iut_symmetrize_FlSemiPm, iut_symmetrize_FlStar, iut_conjugate_synchronized, iut_label_subset_keeps_symmetry',
    ForgetLadder: 'iut_ps_forget_ladder, iut_pilot_object_degree, iut_units_mod_tors_kummer_orbit', LinkThetaUnitsModTors: 'iut_constant_strip_identify, iut_envelope_isos, iut_theta_link_make, iut_theta_link_coric_units, iut_theta_link_induced_D_link, iut_coric_global_realified',
    MakeLogShells: 'iut_log_shell_make, iut_log_shell_properties, iut_log_shell_from, iut_log_shell_iso_indeterminacy', ApplyLogLinkStrip: 'iut_log_link_strip, iut_log_shell_isomorphic', ChainLogLinks: 'iut_log_chain_build, iut_log_link_hodge_theater_check',
    DefineLattice: 'iut_lattice_flavour, iut_lattice_square_commutes, iut_lattice_horizontal_obligates_vertical', CheckBicoric: 'iut_bicoric_check', CoricThetaMonoids: 'iut_theta_monoid_vertically_coric, iut_etale_radial_environment, iut_theta_monoid_multiradial',
    BuildTensorPackets: 'iut_tensor_packet_build, iut_tensor_packet_global, iut_tensor_packet_localize, iut_tensor_packet_procession', BuildLGPMonoids: 'iut_lgp_monoid_build, iut_upper_semi_compatibility', CompareGlobalVariants: 'iut_global_variant_info_get, iut_gau_LGP_lgp_isos',
    MakePilots: 'iut_pilot_make, iut_LGP_link_requires_log, iut_lattice_kind_for_link', NormalizeLogVolumes: 'iut_log_volume_scale_by_p/e, iut_log_volume_procession_normalize, iut_arith_degree, iut_kummer_non_interference',
    RepresentMultiradially: 'iut_multiradial_full_build', EstimateLogVolume: 'iut_cor312_steps, iut_cor312_holds', BoundDifferents: 'iut_iv_a, iut_iv_b, iut_iv_dI, iut_iv_prop12_*, iut_iv_prop13_bounds', EstimateNonarchVolume: 'iut_iv_mulog_log_units, iut_iv_prop14_*',
    EstimateArchMetric: 'iut_iv_arch_summands, iut_iv_arch_metric_factor, iut_iv_arch_tensor_bound', BoundPrimes: 'iut_iv_pnt_n_bound, iut_iv_pnt_count_bound, iut_iv_log_le_x, iut_iv_chebyshev_lo/hi, iut_iv_prime_in_A_bound', AverageWeighted: 'iut_iv_weighted_average, iut_iv_normalized_weights',
    CheckTorsionPoints: 'iut_iv_torsion_facts', DegreeArithDivisors: 'iut_arith_divisor_q, iut_arith_divisor_deg, iut_arith_divisor_normalized_deg, iut_arith_divisor_deg_E', ComputeThmOneTen: 'iut_iv_E1, iut_iv_E2, iut_iv_E3, iut_iv_E5, iut_thm110_compute', ComputeCorTwoTwo: 'iut_cor22_compute, iut_cor23_bound',
    OperateSpecies: 'iut_mutation_compose, iut_mutation_identity, iut_species_isomorphic, iut_mutation_history_from_lattice, iut_observable_is_core', EvaluateLogicModel: 'iut_esslgc_model_eval', ChainAndSteps: 'iut_stp_chain, iut_fix_and_glue', Fuzzify: 'iut_fuzzify, iut_engulfs, iut_extind1_union, iut_extind2_crush, iut_or_indeterminacy_verdict',
    ComputeGaussian: 'iut_alien_gauss_steps, iut_alien_gauss_numeric', TransportMonoAnabelian: 'iut_transport_apparatus, iut_transport_run', SumLabelsFormally: 'iut_formal_sum_make, iut_formal_sum_total, iut_formal_sum_compatible, iut_label_line_segment, iut_evaluation_points',
    StepEstimate: 'iut_alien_estimate_steps, iut_alien_leading_term_j/sum, iut_alien_l_from_height', TranslateDictionary: 'iut_alien_dictionary'
  };
  var FILES = { IUTchI: 'iut_ops_i.c (+ iut_i.c)', IUTchII: 'iut_ops_ii.c', IUTchIII: 'iut_ops_iii.c', IUTchIV: 'iut_ops_iv.c', EssLgc: 'iut_ops_logic.c', Alien: 'iut_ops_logic.c' };

  var state = { current: null, filter: '', allResult: null };
  var listEl, detailEl, container;

  function render(c) {
    container = c; U.clear(c);
    c.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Processes' }),
      el('p', { class: 'lead', html: 'The <em>operations layer</em>: every step and process of [IUTchI]–[IUTchIV], [EssLgc] and [Alien] that acts on the data types is a C function in <code>src/iut_ops_*.c</code>, and the registry in <code>src/iut_proc.c</code> groups them into ' + M.procs().length + ' named processes. Pick one: the engine runs it on the selected Θ-data right here, exactly as <code>iut run &lt;id&gt;</code> does on the command line.' })
    ]));
    var layout = el('div', { class: 'proc-layout' });
    listEl = el('div', { class: 'proc-list card flat' });
    detailEl = el('div');
    layout.appendChild(listEl); layout.appendChild(detailEl);
    c.appendChild(layout);
    renderList();
    if (!state.current) state.current = M.procs()[0].id;
    renderDetail();
  }

  function renderList() {
    U.clear(listEl);
    listEl.appendChild(el('input', { type: 'search', placeholder: 'filter by id, name, section…', value: state.filter, style: 'width:100%;margin-bottom:6px', oninput: function (ev) { state.filter = ev.target.value; renderList(); } }));
    listEl.appendChild(el('div', { class: 'runbar' }, [el('button', { class: 'primary', text: 'run all 73', onclick: runAll }), el('span', { class: 'ms small muted', text: 'iut run --all' })]));
    var f = state.filter.toLowerCase();
    PAPERS.forEach(function (p) {
      var ps = M.procs().filter(function (x) { return x.paper === p && (!f || (x.id + ' ' + x.name + ' ' + x.section + ' ' + x.inputs + ' ' + x.outputs).toLowerCase().indexOf(f) >= 0); });
      if (!ps.length) return;
      listEl.appendChild(el('div', { class: 'paper', text: '[' + p + '] · ' + ps.length }));
      ps.forEach(function (x) {
        var it = el('a', { class: 'item' + (x.id === state.current ? ' active' : ''), href: '#processes/' + x.id, onclick: function (ev) { ev.preventDefault(); select(x.id); } });
        it.appendChild(el('span', { class: 'pid', text: x.id }));
        it.appendChild(el('span', { class: 'pname', text: x.name }));
        if (state.allResult && state.allResult[x.id] != null) it.appendChild(el('span', { class: 'pill ' + (state.allResult[x.id] ? 'ok' : 'fail'), text: state.allResult[x.id] ? 'ok' : 'fail', style: 'margin-left:6px' }));
        listEl.appendChild(it);
      });
    });
  }

  function select(id) {
    state.current = id;
    if (location.hash !== '#processes/' + id) history.replaceState(null, '', '#processes/' + id);
    renderList(); renderDetail();
    var a = listEl.querySelector('.item.active'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
  }

  function identsIn(text) {
    var found = [], seen = {};
    M.ids().forEach(function (i) {
      if (i.kind === 'process' || i.kind === 'symbol' || i.id.length < 4) return;
      var re = new RegExp('(^|[^A-Za-z])' + i.id + '($|[^A-Za-z])');
      if (re.test(text) && !seen[i.id]) { seen[i.id] = 1; found.push(i.id); }
    });
    return found;
  }

  function renderDetail() {
    U.clear(detailEl);
    var p = M.proc(state.current); if (!p) return;
    var idx = M.procs().indexOf(p);
    var head = el('div', { class: 'proc-head card' });
    head.appendChild(el('div', { class: 'kind', text: '[' + p.paper + '] ' + p.section + ' · process ' + (idx + 1) + ' of ' + M.procs().length + ' · ' + (FILES[p.paper] || '') }));
    head.appendChild(el('h2', { text: p.id }));
    head.appendChild(el('p', { class: 'name', text: p.name }));
    head.appendChild(U.canvas(function (cv) { DG.procFlow(cv, p); }));
    var io = el('div', { class: 'io' });
    io.appendChild(el('span', { class: 'muted small', text: 'inputs: ' })); p.inputs.split(',').forEach(function (s) { s = s.trim(); if (s) io.appendChild(M.ident(s) ? U.identPill(s) : el('span', { class: 'box', text: s })); });
    io.appendChild(el('span', { class: 'arrow', text: '→' }));
    io.appendChild(el('span', { class: 'muted small', text: 'outputs: ' })); p.outputs.split(',').forEach(function (s) { s = s.trim(); if (s) io.appendChild(M.ident(s) ? U.identPill(s) : el('span', { class: 'box', text: s })); });
    head.appendChild(io);
    if (FUNCS[p.id]) head.appendChild(el('p', { class: 'small muted', html: 'C functions: <code>' + esc(FUNCS[p.id]) + '</code>' }));
    var nav = el('div', { class: 'step-nav' }, [
      el('button', { text: '◀ previous', disabled: idx === 0 ? '' : null, onclick: function () { select(M.procs()[idx - 1].id); } }),
      el('button', { text: 'next ▶', disabled: idx === M.procs().length - 1 ? '' : null, onclick: function () { select(M.procs()[idx + 1].id); } }),
      el('span', { class: 'small muted', text: 'iut run ' + p.id + ' ' + M.dataArgs().join(' ') })
    ]);
    head.appendChild(nav);
    detailEl.appendChild(head);

    var r = M.run(p.id);
    var out = el('div', { class: 'card', style: 'margin-top:16px' });
    out.appendChild(el('h3', {}, [el('span', { text: 'transcript' }), el('span', { class: 'pill ' + (r.code === 0 ? 'ok' : 'fail'), text: r.code === 0 ? 'ok' : 'failed (' + r.code + ')' }), el('span', { class: 'ref', text: r.ms.toFixed(1) + ' ms in the engine' })]));
    out.appendChild(U.transcript(r.out + (r.err ? '\n' + r.err : '')));
    detailEl.appendChild(out);

    var ids = identsIn(r.out + ' ' + p.inputs + ' ' + p.outputs);
    if (ids.length) {
      var idc = el('div', { class: 'card', style: 'margin-top:16px' }, [el('h3', { text: 'data types touched' })]);
      var wrap = el('p', {}); ids.forEach(function (id) { wrap.appendChild(U.identPill(id)); wrap.appendChild(document.createTextNode(' ')); });
      idc.appendChild(wrap);
      detailEl.appendChild(idc);
    }
    var ex = root.VIEW_EXAMPLES && root.VIEW_EXAMPLES.examplesUsing(p.id);
    if (ex && ex.length) {
      var exc = el('div', { class: 'card', style: 'margin-top:16px' }, [el('h3', { text: 'worked examples that go through this process' })]);
      ex.forEach(function (e) { exc.appendChild(el('p', {}, [el('a', { href: '#examples/' + e.key + '/' + e.step, text: e.title + ' — step ' + (e.step + 1) + ': ' + e.stepTitle })])); });
      detailEl.appendChild(exc);
    }
  }

  function runAll() {
    var r = M.runAll(), map = {};
    var split = M.runAllSplit();
    Object.keys(split).forEach(function (id) { map[id] = /=> ok/.test(split[id]); });
    state.allResult = map;
    renderList();
    U.clear(detailEl);
    var c = el('div', { class: 'card' });
    var okN = Object.keys(map).filter(function (k) { return map[k]; }).length;
    c.appendChild(el('h3', {}, [el('span', { text: 'iut run --all ' + M.dataArgs().join(' ') }), el('span', { class: 'pill ' + (r.code === 0 ? 'ok' : 'fail'), text: okN + ' / ' + Object.keys(map).length + ' ok' }), el('span', { class: 'ref', text: r.ms.toFixed(1) + ' ms' })]));
    c.appendChild(el('p', { class: 'muted', text: r.out.split('\n').filter(function (l) { return /process\(es\) run/.test(l); })[0] || '' }));
    var grid = el('div', { class: 'summary-grid' });
    M.procs().forEach(function (p) { grid.appendChild(el('div', { class: 's' + (map[p.id] ? '' : ' fail'), text: (map[p.id] ? '✓ ' : '✗ ') + p.id, onclick: function () { select(p.id); } })); });
    c.appendChild(grid);
    c.appendChild(el('details', { style: 'margin-top:12px' }, [el('summary', { text: 'full transcript (' + r.out.split('\n').length + ' lines)' }), U.transcript(r.out)]));
    detailEl.appendChild(c);
  }

  function onHash(parts) { if (parts[1] && M.proc(parts[1])) { state.current = parts[1]; if (listEl) { renderList(); renderDetail(); } } }
  function onChange() { state.allResult = null; if (container && container.classList.contains('active')) render(container); }

  root.VIEW_PROCS = { render: render, onHash: onHash, onChange: onChange, select: select };
})(typeof window !== 'undefined' ? window : globalThis);
