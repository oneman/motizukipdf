/*
 * iut_i.h — the data types of [IUTchI] "Inter-universal Teichmüller Theory I:
 * Construction of Hodge Theaters", read directly from the paper
 * (pdf/Inter-universal Teichmuller Theory I.pdf), §0–§6.
 *
 * iut.h models the objects that IUT II–IV act on (prime-strips, Hodge theaters,
 * the lattice).  This header adds the finer objects that IUT I itself introduces
 * and that the recaps in the later papers leave out:
 *
 *   §0  pseudo-monoids, poly-morphisms (full / +-full / capsule-full), connected
 *       anabelioids and temperoids, the field kinds NF / MLF / CAF
 *   §1  the orbicurves X, C, X̲, C̲, X→, C→, X̲̲_v, C̲̲_v with their types, degrees,
 *       cusps, covering groups; the cusps ε, ε′, ε″, 2ε; the Cor 1.2 reconstruction
 *   §2  tempered versus profinite fundamental groups (Prop 2.1 – Cor 2.8)
 *   §3  the conditions (a)–(f) of Def 3.1; the Θ-approach (Rem 3.1.2); κ-coric
 *       functions and critical points (Rem 3.1.7); the local Frobenioids of
 *       Ex 3.2 / 3.3 / 3.4 (tempered, good nonarchimedean, archimedean) and their
 *       split mono-analytic versions (C⊢_v, τ⊢_v), (C^Θ_v, τ^Θ_v); the global
 *       realified Frobenioids C⊩_mod, C⊩_tht, D⊩_mod of Ex 3.5 with ρ_v, ρ^Θ_v, ρ^D_v;
 *       the Θ-Hodge theater of Def 3.6 as ({F̲_v}_v, F⊩_mod); the Θ-link of Cor 3.7
 *   §4  LabCusp(†D_v) as an F_l^*-torsor with canonical element †η_v; D^⊛ = B(C̲_K)^0
 *       with Aut(C̲_K) ⊇ Aut_ε(C̲_K) (Borel ⊇ semi-unipotent) and Aut/Aut_ε ≅ F_l^*;
 *       V^±un ⊆ V^Bor ⊆ V(K); the evaluation points of Ex 4.4 labelled by |F_l|;
 *       transport of label classes (Prop 4.7); the symmetry counts of Prop 4.9
 *   §5  the global Frobenioids F^⊛, F^⊛′, F^⊛_mod and the pseudo-monoids
 *       M^⊛, M^⊛_mod, M^⊛_sol, M^⊛_κ, M^⊛_∞κ, M^⊛_∞κ×, M^⊛_κ-sol with the
 *       Kummer-ready / Kummer-blind distinction of Rem 5.1.3; the distributions
 *       V_j, V_⟨J⟩, V_J of Ex 5.1 (vii) and the F-prime-strip liftings of Cor 5.3
 *   §6  F_l^{⋊±}-groups and -torsors; LabCusp±(†D_v) with †η⁰_v, †η^±_v;
 *       Aut_+ ⊆ Aut_± ⊆ Aut, Aut_csp; D^⊚± = B(X̲_K)^0; the torsor sizes of
 *       Prop 6.6; the two-to-one map of Prop 6.7; the symmetry counts of Prop 6.8;
 *       the synchronizations ζ, ζ±, ξ of Rem 6.12.4
 *
 * Every type carries a letters-only identifier (src/iut_ids.c, docs/IDENTIFIERS.md).
 */
#ifndef IUT_I_H
#define IUT_I_H
#include "iut.h"

/* =============================================================== §0 ======= */

/* pseudo-monoids  [IUTchI] §0 "Monoids and Categories": a topological
 * pseudo-monoid is a topological space with a partially defined multiplication;
 * divisible: every element has N-th roots for all N; cyclotomic: contains a
 * copy of μ_∞ ≅ Q/Z on which multiplication is total.                            */
typedef enum {
    IUT_PSM_MCIRCAST = 0,     /* M^⊛(†D^⊛) ≅ F̄×, carries the field structure        Ex 5.1 (i) */
    IUT_PSM_MCIRCAST_MOD,     /* M^⊛_mod ≅ F_mod^×                                   Ex 5.1 (i) */
    IUT_PSM_MCIRCAST_SOL,     /* M^⊛_sol ≅ F_sol^×  (maximal solvable extension)     Ex 5.1 (i) */
    IUT_PSM_MCIRCAST_KAPPA,   /* M^⊛_κ   κ-coric rational functions                  Ex 5.1 (i), Rem 3.1.7 */
    IUT_PSM_MCIRCAST_INFKAPPA,       /* M^⊛_∞κ  ∞κ-coric: all roots adjoined         Ex 5.1 (i) */
    IUT_PSM_MCIRCAST_INFKAPPA_UNITS, /* M^⊛_∞κ× ∞κ×-coric: ∞κ-coric times constants  Ex 5.1 (i) */
    IUT_PSM_MCIRCAST_KAPPA_SOL,      /* M^⊛_κ-sol                                      Ex 5.1 (i) */
    IUT_PSM_MV,               /* M_v(‡D_v) ≅ O▷_{F̄_v}  local                          Def 5.2 (v) */
    IUT_PSM_MKAPPA_V,         /* M_κv                                                 Def 5.2 (vi) */
    IUT_PSM_MINFKAPPA_V,      /* M_∞κv                                                Def 5.2 (vi) */
    IUT_PSM_MINFKAPPA_UNITS_V,/* M_∞κ×v                                               Def 5.2 (vi) */
    IUT_PSM_COUNT
} iut_pseudo_monoid_kind;
typedef struct {
    iut_pseudo_monoid_kind kind;
    const char *id, *notation, *ref;
    int topological, divisible, cyclotomic, is_group;
    int kummer_ready;          /* Rem 5.1.3: Kummer-ready (1) or Kummer-blind (0)    */
    int etale_like;            /* reconstructed from †D^⊛ / ‡D_v (1) or Frobenius-like */
} iut_pseudo_monoid;
void iut_pseudo_monoid_get(iut_pseudo_monoid_kind k, iut_pseudo_monoid *out);
/* Ex 5.1 (i): M^⊛_mod ⊆ M^⊛_sol ⊆ M^⊛,  M^⊛_κ ⊆ M^⊛_∞κ ⊆ M^⊛_∞κ×,  M^⊛_κ ⊆ M^⊛_κ-sol */
int  iut_pseudo_monoid_contains(iut_pseudo_monoid_kind big, iut_pseudo_monoid_kind small);

/* poly-morphisms  [IUTchI] §0: a poly-morphism A → B is a set of morphisms; a
 * poly-isomorphism a set of isomorphisms; the FULL poly-isomorphism is the set of
 * all isomorphisms; a +-full poly-isomorphism (Def 6.1 (iv)) of D-prime-strips
 * is, at each v, the Aut_+-orbit (positive) or Aut_−-orbit (negative) of an iso;
 * a capsule-full poly-morphism (§0) has bijective index map and full constituents. */
typedef enum {
    IUT_POLY_MORPHISM = 0, IUT_POLY_ISOMORPHISM, IUT_POLY_FULL_ISOMORPHISM,
    IUT_POLY_PLUS_FULL_ISOMORPHISM, IUT_POLY_CAPSULE_FULL_MORPHISM, IUT_POLY_CAPSULE_FULL_ISOMORPHISM,
    IUT_POLY_COUNT
} iut_poly_kind;
typedef struct {
    iut_poly_kind kind;
    unsigned long long count;       /* number of constituent morphisms (0 = "all", i.e. full) */
    unsigned nV;               /* +-full only: signs α ∈ {±1}^V                        */
    int sign[IUT_MAX_V];
    int index_bijective;       /* capsule kinds: index map bijective                    */
    const char *ref;
} iut_poly_morphism;
void iut_poly_make(iut_poly_kind k, unsigned long long count, iut_poly_morphism *out);
/* §0: the composite of two poly-morphisms is the set of composites (multiplicities ignored) */
int  iut_poly_compose(const iut_poly_morphism *second, const iut_poly_morphism *first, iut_poly_morphism *out);
/* Def 6.1 (iv): positive / negative / α-signed +-full poly-isomorphism */
void iut_poly_plus_full_make(const iut_initial_theta_data *d, const int *alpha, iut_poly_morphism *out);
int  iut_poly_plus_full_is_positive(const iut_poly_morphism *p);
int  iut_poly_plus_full_is_negative(const iut_poly_morphism *p);
const char *iut_poly_kind_id(iut_poly_kind k);

/* anabelioids  [IUTchI] §0: B(Π) the connected anabelioid of a profinite group,
 * B(X) of a scheme, B(X)^0 its connected component, B^temp(Π) the connected
 * temperoid of a tempered group.                                                */
typedef enum { IUT_ANAB_BPI = 0, IUT_ANAB_BX, IUT_ANAB_BX_ZERO, IUT_ANAB_BTEMP, IUT_ANAB_COUNT } iut_anabelioid_kind;
typedef struct { iut_anabelioid_kind kind; const char *id, *notation, *of; int connected, tempered; } iut_anabelioid;
void iut_anabelioid_make(iut_anabelioid_kind k, const char *of, iut_anabelioid *out);

/* fields  [IUTchI] §0: NF number field, MLF mixed-characteristic local field,
 * CAF complex archimedean field.                                                */
typedef enum { IUT_FIELD_NF = 0, IUT_FIELD_MLF, IUT_FIELD_CAF } iut_field_kind;
iut_field_kind iut_field_kind_of_valuation(const iut_valuation *v);   /* K_v: MLF or CAF */
const char *iut_field_kind_id(iut_field_kind k);

/* =============================================================== §1 ======= */

/* the orbicurves of §1 and Def 3.1, with their types */
typedef enum {
    IUT_ORB_X = 0,       /* X        type (1,1)          once-punctured elliptic curve        */
    IUT_ORB_C,           /* C = X/±1 type (1,1)±                                              */
    IUT_ORB_XUNDER,      /* X̲        type (1,l-tors)     X̲ → X cyclic of degree l             */
    IUT_ORB_CUNDER,      /* C̲ = X̲/±1 type (1,l-tors)±   C̲ → C of degree l                     */
    IUT_ORB_XARROW,      /* X→       type (1,l-tors→)    X→ → X̲ cyclic of degree l   Def 1.1  */
    IUT_ORB_CARROW,      /* C→       type (1,l-tors→)±   C→ → C̲ cyclic of degree l   Def 1.1  */
    IUT_ORB_XUNDERUNDER_V, /* X̲̲_v   type (1,(Z/l)^Θ)    Def 3.1 (b), v ∈ V^bad               */
    IUT_ORB_CUNDERUNDER_V, /* C̲̲_v   type (1,(Z/l)^Θ)±                                        */
    IUT_ORB_CUNDER_V,    /* C̲_v     type (1,Z/l)±        Def 3.1 (b)                          */
    IUT_ORB_COUNT
} iut_orbicurve_kind;
typedef struct {
    iut_orbicurve_kind kind;
    const char *id, *notation, *type, *base;   /* base: "k" / "K" / "K_v"                 */
    const char *covers;                        /* the orbicurve it is a covering of       */
    unsigned degree;                           /* degree of that covering                 */
    const char *covering_group;                /* "Z/l", "Z/2", "Z/2l" (Def 1.1), "—"       */
    unsigned covering_group_order;
    int ncusps;                                /* number of cusps; -1 if not recorded      */
    unsigned aut_k_order;                      /* |Aut_k| when stated (Rem 1.2.1), else 0   */
    const char *ref;
} iut_orbicurve;
void iut_orbicurve_get(const iut_initial_theta_data *d, iut_orbicurve_kind k, iut_orbicurve *out);

/* the cusps of §1: ε a nonzero cusp of C̲, ε′, ε″ the cusps of X̲ over it (swapped
 * by ι), 2ε the cusp used to define the section σ : G_k → J_C (needs 2 ≢ ±1 mod l) */
typedef struct {
    int epsilon;               /* label of ε in F_l^* (we take 1)                        */
    int epsilon_prime, epsilon_dprime;   /* ±ε ∈ F_l: the two cusps of X̲ over ε           */
    int two_epsilon;           /* 2ε ∈ F_l, reduced to {−l*..l*}                          */
    int two_epsilon_ok;        /* 2 ≢ ±1 (mod l), automatic for l ≥ 5                     */
    int zero_cusp;             /* the cusp 0 of X̲ (fixed by ι)                            */
    unsigned inertia_product_rank;   /* I_ε′ × I_ε″ ≅ Ẑ² : rank 2                       */
    unsigned delta_E_mod_l_order;    /* |Δ_E ⊗ Z/l| = l²                                 */
    int iota_swaps_inertia, iota_acts_minus_one;   /* ι: I_ε′ ↔ I_ε″, −1 on Δ_E ⊗ Z/l       */
    int delta_eps_splits;      /* Δ_ε ≅ Δ_ε^+ × Δ_ε^−                                    */
} iut_cusps_section_one;
void iut_cusps_section_one_get(const iut_initial_theta_data *d, iut_cusps_section_one *out);

/* Cor 1.2 / Rem 1.2.1: what is reconstructed group-theoretically from Π_X→ (resp. Π_C→) */
typedef struct {
    unsigned l_squared;        /* l² = [Δ_X : Δ_X̲]·[Δ_X̲ : Δ_X→] = [Δ_X : Δ_X→] = [Δ_C : Δ_X→]/2 */
    unsigned idx_X_XUnder, idx_XUnder_XArrow, idx_C_XArrow;
    unsigned gal_XUnder_over_CUnder;   /* 2      Gal(X̲/C̲) ≅ Z/2                        */
    unsigned gal_CArrow_over_CUnder;   /* l      Gal(C→/C̲) ≅ Z/l                        */
    unsigned gal_XArrow_over_CUnder;   /* 2l     Gal(X→/C̲) ≅ Z/2 × Z/l                  */
    unsigned gal_XArrow_over_CArrow;   /* 2      the unique maximal subgroup of odd index */
    unsigned aut_k_XArrow, aut_k_CArrow;   /* Z/2l, Z/l   (Rem 1.2.1)                    */
    const char *steps[8]; unsigned nsteps;  /* the algorithm, step by step                 */
    int stabilized_cusps[3];   /* 0, ε′, ε″: the splitting Gal(X̲/C̲) is the one stabilizing them */
} iut_cor_one_two;
void iut_cor_one_two_run(const iut_initial_theta_data *d, iut_cor_one_two *out);

/* =============================================================== §2 ======= */

/* tempered versus profinite fundamental groups at v ∈ V^bad  [IUTchI] §2 */
typedef struct {
    const char *id, *statement, *ref;
    int holds;                 /* 1 in this toolkit's model (the statements are theorems) */
} iut_tempered_fact;
unsigned iut_tempered_facts(iut_tempered_fact *out, unsigned max);   /* Prop 2.1 – Cor 2.8 */
/* Cor 2.5 applied to v ∈ V: a decomposition / inertia group of Π_{X} contained in
 * Π^tp_{X} is a tempered decomposition / inertia group — so the conjugacy
 * indeterminacies of tempered and profinite data are synchronized at bad v.     */
typedef struct {
    unsigned v_index;
    int tempered_available;    /* v ∈ V^bad: Π_v = Π^tp_{X̲̲_v}                          */
    int profinite_conjugates_stay_tempered;  /* Prop 2.1 (compact subgroups)            */
    int commensurably_terminal;              /* Prop 2.2: Π^tp ⊆ Π is commensurably terminal */
    int decomposition_groups_synchronized;   /* Cor 2.5                                   */
    int galois_countable;                    /* Rem 2.5.3 (T1)–(T6)                       */
} iut_tempered_at_v;
void iut_tempered_at_v_get(const iut_initial_theta_data *d, unsigned v, iut_tempered_at_v *out);

/* =============================================================== §3 ======= */

/* Def 3.1 (a)–(f): the conditions on initial Θ-data, each checked or asserted  */
typedef struct { const char *item, *condition; int ok, machine_checked; const char *detail; } iut_def_three_one_item;
unsigned iut_def_three_one_check(const iut_initial_theta_data *d, iut_def_three_one_item *out, unsigned max, iut_report *r);
/* Rem 3.1.2: the Θ-approach — [AbsTopIII] Thm 1.9 applied to Π_{X̲_K} ⊆ Π_{C̲_K}; the
 * cyclotome M_X of the once-punctured curve is identified with l·Δ_Θ (index l). */
typedef struct { unsigned cyclotome_index; const char *cyclotome, *theta_cyclotome, *applied_to, *ref; } iut_theta_approach;
void iut_theta_approach_get(const iut_initial_theta_data *d, iut_theta_approach *out);
/* Rem 3.1.3: the initial Θ-data is determined by (F̄/F, X_F, C̲_K, V, V^bad_mod) */
unsigned iut_def_three_one_determining_data(const char **out, unsigned max);
/* Rem 3.1.5: the stack S_mod = Spec(O_K) // Gal(K/F_mod) */
typedef struct { const char *notation; unsigned long long gal_order_bound; unsigned npoints; } iut_s_mod;
void iut_s_mod_get(const iut_initial_theta_data *d, iut_s_mod *out);

/* Rem 3.1.7: κ-coric functions on C_{F_mod}.  |C_L| ≅ A¹ has 4 critical points
 * (the images of the 2-torsion points), all strictly critical.  A rational
 * function on |C_L| is κ-coric if it has exactly one pole, at least two zeroes,
 * its divisor is defined over an NF and avoids the critical points, and its
 * value at every strictly critical point is a root of unity.                    */
typedef struct {
    unsigned npoles, nzeros;
    int divisor_over_NF, divisor_avoids_critical, roots_of_unity_at_strictly_critical;
    int all_roots_adjoined;    /* ∞κ: all N-th roots taken          */
    int constants_adjoined;    /* ∞κ×: multiplied by constants       */
} iut_kappa_function;
typedef struct { unsigned ncritical, nstrictly_critical; int kappa_coric, inf_kappa_coric, inf_kappa_units_coric; const char *failed; } iut_kappa_verdict;
void iut_kappa_coric_check(const iut_kappa_function *f, iut_kappa_verdict *out);
/* Rem 3.1.7 (iii): Gal(K/F(μ_l)) ≅ SL_2(F_l) is the unique such subgroup; L_C(C̲_K) and L_C(κ-sol) linearly disjoint */
typedef struct { unsigned long long sl2_order; const char *k_over_F_mu_l; int linearly_disjoint, center_free; } iut_kappa_sol;
void iut_kappa_sol_get(const iut_initial_theta_data *d, iut_kappa_sol *out);

/* the local Frobenioids of Ex 3.2 (v ∈ V^bad), Ex 3.3 (v ∈ V^good ∩ V^non), Ex 3.4 (v ∈ V^arc) */
typedef enum { IUT_LF_BAD = 0, IUT_LF_GOOD_NONARCH, IUT_LF_ARCH } iut_local_frobenioid_kind;
typedef struct {
    iut_local_frobenioid_kind kind;
    unsigned v_index;
    const char *ref;
    /* base categories */
    const char *D_v;           /* B^temp(X̲̲_v)^0 / B(X→_v)^0 / the Aut-holomorphic orbispace X→_v */
    const char *D_mono_v;      /* D⊢_v = B(K_v)^0 / B(K_v)^0 / an object of TM                 */
    const char *D_theta_v;     /* D^Θ_v (bad v only)                                          */
    /* Frobenioids */
    const char *F_v;           /* F̲_v tempered / C_v = F̲_v / (C_v, D_v, κ_v)                     */
    const char *F_birat_v;     /* F÷_v birationalization (bad)                                 */
    const char *C_v;           /* base-field-theoretic hull                                    */
    const char *C_mono_v;      /* C⊢_v                                                         */
    const char *C_theta_v;     /* C^Θ_v (bad)                                                  */
    const char *divisor_monoid;        /* Φ_{C⊢v}: N·log_Φ(q̲_v) / ord(Z_p) = N·log(p_v) / R≥0·log(p_v) */
    const char *divisor_monoid_theta;  /* Θ-version: … · log(Θ)                               */
    iut_q generator_value;     /* value of the generator in q̲_v-units: q̲_v = 1; p_v: e_K (ord of p in q̲ units: 2l·e_K/ord q)… */
    const char *generator;     /* "q̲_v", "p_v", "p_v (R≥0)"                                   */
    const char *splitting;     /* τ⊢_v: μ_2l-orbit (bad) / canonical from p_v (good) / C× = S¹ × R>0 (arch) */
    unsigned splitting_indeterminacy;   /* |μ_2l| = 2l at bad v, 1 otherwise                   */
    const char *theta_function;        /* Θ̲_v ∈ O×(T÷_Ÿv) up to μ_2l and l·Z (bad)              */
    unsigned theta_root_indeterminacy; /* 2l (μ_2l)                                           */
    int theta_translation_indeterminacy; /* l·Z (bad)                                          */
    int is_tempered, is_split, has_kummer_structure, is_birational_available;
    const char *formal_symbol;  /* "log(Θ)" / "log(p_v)·log(Θ)"                                 */
} iut_local_frobenioid;
void iut_local_frobenioid_build(const iut_initial_theta_data *d, unsigned v, iut_local_frobenioid *out);
/* Ex 3.2 (v): the split Frobenioids F⊢_v = (C⊢_v, τ⊢_v) and F^Θ_v = (C^Θ_v, τ^Θ_v) are isomorphic */
int  iut_local_frobenioid_split_iso(const iut_local_frobenioid *a, int theta_version_of_a, const iut_local_frobenioid *b, int theta_version_of_b);
/* Ex 3.2 (vi) (a)–(f): what the tempered Frobenioid F̲_v lets one reconstruct group-theoretically */
unsigned iut_local_frobenioid_reconstructions(const iut_local_frobenioid *lf, const char **out, unsigned max);

/* Ex 3.5: the global realified Frobenioids and the gluing data ρ_v */
typedef enum { IUT_GR_MOD = 0,  /* C⊩_mod: realification of the Frobenioid of F_mod; log_mod(p_v) */
               IUT_GR_THT,      /* C⊩_tht: Θ-version, log_mod(p_v)·log(Θ)                         */
               IUT_GR_D         /* D⊩_mod: étale-like version, (R≥0)_v with Frobenius element     */
} iut_global_realified_kind;
typedef struct {
    iut_global_realified_kind kind;
    const char *id, *notation, *ref;
    unsigned nprimes;          /* Prime(C⊩_mod) ≅ V_mod  (= |V|)                                 */
    double rho[IUT_MAX_V];     /* ρ_v: log_mod(p_v) ↦ (1/[K_v : (F_mod)_v])·log_Φ(p_v)            */
    unsigned local_degree[IUT_MAX_V];   /* [K_v : (F_mod)_v] = e_K f_K / (e_mod f_mod)             */
    double frobenius_element[IUT_MAX_V];/* D-version: ×e_v (nonarch) or ÷2π (arch) on (R≥0)_v        */
    int    with_theta;         /* ρ^Θ_v at bad v: log(Θ) ↦ log_Φ(Θ̲_v)/log_Φ(q̲_v)                   */
} iut_global_realified;
void iut_global_realified_build(const iut_initial_theta_data *d, iut_global_realified_kind k, iut_global_realified *out);
double iut_rho_v(const iut_initial_theta_data *d, unsigned v);          /* 1/[K_v:(F_mod)_v]        */
/* ρ^Θ_v evaluated: log_mod(p_v)·log(Θ) at label j ↦ ρ_v · log_Φ(p_v) · j²  (Θ̲_v(label j) = q̲_v^{j²}) */
double iut_rho_theta_v(const iut_initial_theta_data *d, unsigned v, unsigned j);
/* Ex 3.5 (iii): F⊩_mod = (C⊩_mod, Prime ≅ V, {F⊢_v}, {ρ_v}),  F⊩_tht ≅ F⊩_mod;  (iv) F⊩_D from {D⊢_v} */
typedef struct {
    const char *id, *notation;
    iut_global_realified global;
    unsigned nV;
    iut_local_frobenioid loc[IUT_MAX_V];
    int theta_version;
} iut_f_monoglob;
void iut_f_monoglob_build(const iut_initial_theta_data *d, int theta_version, iut_f_monoglob *out);
int  iut_f_monoglob_iso(const iut_f_monoglob *a, const iut_f_monoglob *b);    /* Ex 3.5 (iii): F⊩_tht ≅ F⊩_mod */

/* Def 3.6: a Θ-Hodge theater †HT^Θ = ({†F̲_v}_{v∈V}, †F⊩_mod) with (a) F̲_v ≅ model, (b) F⊩_mod ≅ model, (c) compatibility */
typedef struct {
    unsigned nV;
    iut_local_frobenioid loc[IUT_MAX_V];
    iut_f_monoglob mod, tht;
    int cond_a, cond_b, cond_c;
} iut_theta_hodge_theater_def;
void iut_theta_hodge_theater_def_build(const iut_initial_theta_data *d, iut_theta_hodge_theater_def *out);
/* Cor 3.7: the Θ-link †F⊩_tht ≅ ‡F⊩_mod (full poly-iso); (ii) preserves D⊢_v; (iii) preserves O×_{C⊢v};
 * Rem 3.9.3: units fixed, value groups Θ-dilated.  Checks an iut_link of kind Θ.   */
int  iut_theta_link_cor_three_seven(const iut_link *lk, iut_report *r);

/* =============================================================== §4 ======= */

/* Def 4.1 (ii), Prop 4.2: LabCusp(†D_v) is an F_l^*-torsor with canonical element †η_v;
 * the bijections LabCusp(†D_v) ≅ F_l^* for the various v are compatible.          */
typedef struct {
    unsigned nV;
    unsigned torsor_size;      /* l*                                                   */
    int eta[IUT_MAX_V];        /* †η_v ∈ F_l^*: the canonical element (label 1)         */
    int compatible;            /* Prop 4.2: one F_l^*-torsor LabCusp(†D)                */
} iut_labcusp_torsor;
void iut_labcusp_torsor_make(const iut_initial_theta_data *d, iut_labcusp_torsor *out);
int  iut_labcusp_torsor_act(const iut_initial_theta_data *d, int u, int label);   /* F_l^* ↷ LabCusp */

/* Def 4.1 (v), Ex 4.3, Def 6.1 (v): the global base categories D^⊛ = B(C̲_K)^0 and D^⊚± = B(X̲_K)^0 */
typedef enum { IUT_GB_CIRCAST = 0 /* D^⊛ */, IUT_GB_CIRCDOTPM /* D^⊚± */ } iut_global_base_kind;
typedef struct {
    iut_global_base_kind kind;
    const char *id, *notation, *curve, *group;   /* B(C̲_K)^0, Π_{C̲_K} / B(X̲_K)^0, Π_{X̲_K}        */
    unsigned labcusp_size;     /* |LabCusp(D^⊛)| = l*;  |LabCusp±(D^⊚±)| = l                 */
    unsigned nV_section;       /* |V| ⊆ V(D^⊛): the section over V_mod                        */
    /* Ex 4.3: Aut(C̲_K) ≅ Out(Π_{C̲_K}) ≅ Aut(D^⊛) ⊇ Aut_ε(C̲_K);  images in GL_2(F_l)/{±1}:
     *   Aut   ↔ Borel (∗ ∗; 0 ∗),   Aut_ε ↔ semi-unipotent (∗ ∗; 0 ±1),  Aut/Aut_ε ≅ F_l^*
     * Def 6.1 (v): Aut(D^⊚±) ↠ F_l^* with kernel Aut_±;  Aut_csp ⊆ Aut_±;  Aut_±/Aut_csp ≅ F_l^{⋊±} */
    unsigned long long aut_image_order;      /* |Borel/{±1}| = l(l−1)²/2                             */
    unsigned long long aut_eps_image_order;  /* |semi-unipotent/{±1}| = l(l−1)                       */
    unsigned long long quotient_order;       /* |Aut/Aut_ε| = l*   (D^⊛);  |Aut_±/Aut_csp| = 2l (D^⊚±) */
    const char *quotient_group;         /* "F_l^*" / "F_l^{⋊±}"                                 */
    int double_cover;                   /* D^⊚± → D^⊛ is a double covering                       */
} iut_global_base;
void iut_global_base_get(const iut_initial_theta_data *d, iut_global_base_kind k, iut_global_base *out);
/* Ex 4.3 (i), Def 6.1 (v), Rem 6.1.1: V ⊆ V^±un = Aut_ε·V = V^± = Aut_csp·V ⊆ V^Bor = Aut·V ⊆ V(K) */
typedef struct { const char *id, *notation, *orbit_of; unsigned lower_bound; unsigned long long upper_bound; } iut_valuation_orbit;
unsigned iut_valuation_orbits(const iut_initial_theta_data *d, iut_valuation_orbit *out, unsigned max);

/* Ex 4.4: |F_l| = F_l/{±1} ↔ cusps of C̲_v; μ_− the 2-torsion point; the evaluation
 * points are the μ_−-translates of the cusps; Θ̲_v takes the value q̲_v^{j²} (up to
 * μ_2l) at the points labelled j; the evaluation sections G_v → Π_v are labelled by |F_l| */
typedef struct {
    unsigned v_index;
    unsigned n;                      /* l± = |{0} ⊔ F_l^*|                                   */
    int      label[IUT_MAX_LPM];     /* 0, 1, …, l*                                          */
    iut_q    theta_value[IUT_MAX_LPM]; /* j² (in units of ord q̲_v), up to μ_2l                */
    int      K_v_rational;           /* evaluation points of X̲̲_v are K_v-rational              */
    int      sections_group_theoretic; /* the sections G_v → Π_v are constructible from Π_v    */
    unsigned mu_minus_order;         /* 2                                                    */
} iut_eval_points;
void iut_eval_points_make(const iut_initial_theta_data *d, unsigned v, iut_eval_points *out);
/* Ex 4.4 (iii): the poly-morphism φ^Θ_{v_j} : D_{v_j} → D_{>,v} is given by the evaluation
 * section labelled |j| at bad v, and is the full poly-isomorphism at good v.           */
typedef struct { unsigned v_index; int j; int via_evaluation_section; int full_poly_iso; int label_used; } iut_theta_bridge_piece;
void iut_theta_bridge_piece_get(const iut_initial_theta_data *d, unsigned v, int j, iut_theta_bridge_piece *out);

/* Prop 4.7 (ΘNF), Prop 6.5 (Θ±ell): transport of label classes.
 *   †χ : J ≅ F_l^*,  †φ^LC_j : LabCusp(†D^⊛) ≅ LabCusp(†D_>),  [†ε] ↦ j,  †ζ : LabCusp(†D^⊛) ≅ J
 *   †ζ^Θell_{v_t}, the global ±-synchronization †ξ, †ζ_± : LabCusp±(†D^⊚±) ≅ T          */
typedef struct {
    int signed_labels;         /* 0: ΘNF (F_l^*), 1: Θ±ell (F_l)                               */
    unsigned n;
    int chi[2*IUT_MAX_LSTAR+1];   /* index in the capsule ↦ label (χ : J ≅ F_l^* or T ≅ F_l)      */
    int zeta[2*IUT_MAX_LSTAR+1];  /* LabCusp(†D^⊛) ↦ J  (resp. LabCusp±(†D^⊚±) ↦ T)                */
    int epsilon_class_image;   /* [†ε] ↦ 1 under φ^LC_1  (resp. the ±-synchronized ε̲ ↦ ±1)       */
    int synchronized;          /* Rem 6.12.4: ζ (NF side) / ζ±, ξ (± side) agree across v ∈ V      */
} iut_label_transport;
void iut_label_transport_make(const iut_initial_theta_data *d, int signed_labels, iut_label_transport *out);
int  iut_label_transport_check(const iut_label_transport *lt, const iut_initial_theta_data *d);

/* Prop 4.8 (ΘNF) and Prop 6.6 (Θ±ell): the isomorphism torsors of bridges and Hodge theaters */
typedef struct { const char *object, *group; unsigned long long order; const char *ref; } iut_iso_torsor;
unsigned iut_iso_torsors(const iut_initial_theta_data *d, iut_iso_torsor *out, unsigned max);

/* Prop 4.9 (ΘNF) and Prop 6.8 (Θ±ell): forgetting structure
 *   (i)  F_l^* acts simply transitively on J  (F_l^{⋊±} doubly transitively on T)
 *   (ii) holomorphic capsule: S_{l*} (resp. S_{l±}) symmetry, (l*)^{l*} (resp. (l±)^{l±}) label assignments
 *   (iii) mono-analytic capsule: the same after D ↦ D⊢
 * Prop 4.11 / 6.9: processions cut (l*)^{l*} down to l*!  (resp. (l±)^{l±} down to l±!)      */
typedef struct {
    int signed_labels;
    unsigned n;                /* l* or l±                                                        */
    unsigned long long symmetric_group_order;     /* n!                                                */
    double   label_assignments;              /* n^n                                               */
    unsigned long long procession_assignments;    /* n!                                                */
    double   reduction_factor;               /* n^n / n!                                          */
    const char *transitivity;                /* "simply transitive" / "doubly transitive"         */
} iut_forgetful_counts;
void iut_forgetful_counts_get(const iut_initial_theta_data *d, int signed_labels, iut_forgetful_counts *out);

/* =============================================================== §5 ======= */

/* Ex 5.1 (ii)–(iii), (vii): the global Frobenioids over D^⊛ and their copies */
typedef enum {
    IUT_GF_FCIRCAST = 0,   /* F^⊛(†D^⊛): model Frobenioid of arithmetic divisors Φ^⊛, Kummer-ready    */
    IUT_GF_FCIRCAST_PRIME, /* F^⊛′ over †D^⊛_mod (the C_{F_mod} version), Kummer-ready                  */
    IUT_GF_FCIRCAST_MOD,   /* F^⊛_mod: restriction to the terminal objects, Kummer-blind                 */
    IUT_GF_FCIRCAST_J,     /* F^⊛_j: copy of F^⊛_mod for j ∈ F_l^*, over V_j                             */
    IUT_GF_FCIRCAST_ANGLEJ,/* F^⊛_⟨J⟩: diagonal copy over V_⟨J⟩ (constant distribution)                   */
    IUT_GF_FCIRCAST_JCAPS, /* F^⊛_J = ∏_j F^⊛_j  over V_J (arbitrary distribution)                       */
    IUT_GF_COUNT
} iut_global_frobenioid_kind;
typedef struct {
    iut_global_frobenioid_kind kind;
    const char *id, *notation, *base, *ref;
    int kummer_ready;          /* Rem 5.1.3                                                       */
    int realified_available;   /* ^R                                                              */
    unsigned ncopies;          /* 1, l* (F_J), …                                                  */
    double log_volume_weight;  /* Rem 5.4.2: F_⟨J⟩ averages (1/l*), F_J sums (1)                    */
} iut_global_frobenioid;
void iut_global_frobenioid_get(const iut_initial_theta_data *d, iut_global_frobenioid_kind k, iut_global_frobenioid *out);
/* Ex 5.1 (vii): V_j = {v_j}, V_J = ∏_j V_j, the diagonal V_⟨J⟩ ↪ V_J */
typedef struct { unsigned nj, nV; unsigned long long total; int diagonal; const char *notation; } iut_distribution;
void iut_distribution_make(const iut_initial_theta_data *d, int diagonal, iut_distribution *out);
/* Rem 5.4.2: log-volume of the F_⟨J⟩ copy = average over j (÷ l*), of F_J = sum */
double iut_distribution_log_volume(const iut_distribution *dist, const double *per_j, unsigned n);

/* Def 5.2, Rem 5.2.1: the functorial algorithms F ↦ D, F ↦ F⊢ (mono-analyticization), F ↦ F⊩,
 * and Cor 5.3: Isom(F-strips) → Isom(D-strips) bijective, F⊢ → D⊢ surjective (not injective) */
typedef struct { const char *from, *to, *name; int bijective_on_isoms, surjective_on_isoms; const char *ref; } iut_strip_functor;
unsigned iut_strip_functors(iut_strip_functor *out, unsigned max);
/* Cor 5.3 (ii), Rem 5.3.1: lift a morphism of D-prime-strips to F-prime-strips (unique) */
int  iut_lift_d_to_f(const iut_prime_strip *dstrip, const iut_initial_theta_data *d, iut_prime_strip *out);

/* =============================================================== §6 ======= */

/* Def 6.1 (i): F_l^{⋊±} = F_l ⋊ {±1}; an F_l^{⋊±}-group is a set with a {±1}-orbit of
 * bijections to F_l; an F_l^{⋊±}-torsor a set with an F_l^{⋊±}-orbit of bijections.    */
typedef struct {
    unsigned n;                /* l                                                       */
    int      label[2*IUT_MAX_LSTAR+1];  /* one bijection T ≅ F_l                              */
    int      is_group;         /* 1: F_l^{⋊±}-group ({±1}-orbit), 0: torsor (F_l^{⋊±}-orbit)  */
    unsigned long long orbit_size;  /* 2 or 2l                                                 */
    unsigned long long aut_plus_order, aut_pm_order;   /* Aut_+(T) ⊆ Aut_±(T) of index 2 (groups) */
} iut_fl_semi_pm_set;
void iut_fl_semi_pm_group_make(const iut_initial_theta_data *d, iut_fl_semi_pm_set *out);
void iut_fl_semi_pm_torsor_make(const iut_initial_theta_data *d, iut_fl_semi_pm_set *out);
int  iut_fl_semi_pm_is_positive(const iut_initial_theta_data *d, int t);   /* Def 6.1 (i): positive / negative elements */
/* Def 6.4: T ↦ |T| (l±-capsule) and T* = |T| ∖ {0} (l*-capsule) */
unsigned iut_fl_semi_pm_abs(const iut_fl_semi_pm_set *T, int *out);
unsigned iut_fl_semi_pm_star(const iut_fl_semi_pm_set *T, int *out);

/* Def 6.1 (ii)–(iii): LabCusp±(†D_v) with the F_l^×-action, the zero element †η⁰_v,
 * the ±-canonical element †η^±_v (up to ±1); (LabCusp± ∖ {η⁰})/{±1} ≅ LabCusp;
 * Aut(†D_v) ↠ {±1} with Aut_+ the kernel, Aut_− the other coset                 */
typedef struct {
    unsigned nV;
    unsigned size;             /* l                                                       */
    int eta_zero[IUT_MAX_V];   /* †η⁰_v = 0                                                */
    int eta_pm[IUT_MAX_V];     /* †η^±_v = ±1 (we store +1; defined up to sign)             */
    unsigned long long aut_plus_index;  /* [Aut : Aut_+] = 2                                     */
} iut_labcusp_pm_torsor;
void iut_labcusp_pm_torsor_make(const iut_initial_theta_data *d, iut_labcusp_pm_torsor *out);
int  iut_labcusp_pm_forget(const iut_initial_theta_data *d, int signed_label);   /* LabCusp± ∖ {0} → LabCusp */

/* Def 6.1 (iv): Aut_+(†D) and Aut_α(†D) for α ∈ {±1}^V; signed +-full poly-isomorphisms */
typedef struct { unsigned nV; int alpha[IUT_MAX_V]; int all_plus, all_minus; } iut_sign_vector;
void iut_sign_vector_make(const iut_initial_theta_data *d, const int *alpha, iut_sign_vector *out);
unsigned long long iut_sign_vector_count(const iut_initial_theta_data *d);   /* |{±1}^V| = 2^|V| */

/* Prop 6.7: from a D-Θ±-bridge to a D-Θ-bridge: †D_T|_{T∖{0}} → †D_{T*} (two labels ±t ↦ one |t|),
 * and the two strips †D_0, †D_⊞ ↦ the single †D_>;  +-full replaced by full (good v) / Ex 4.4 (bad v) */
typedef struct {
    unsigned n_from, n_to;     /* l → l*                                                   */
    int from[2*IUT_MAX_LSTAR+1], to[2*IUT_MAX_LSTAR+1];   /* t ↦ |t|  (t ≠ 0)                */
    const char *strips_identified;   /* "D_0, D_⊞ ↦ D_>"                                   */
    int poly_replaced;         /* +-full → full (good v) / evaluation-section (bad v)         */
} iut_prop_six_seven;
void iut_prop_six_seven_apply(const iut_initial_theta_data *d, iut_prop_six_seven *out);

/* Prop 6.9 (iii): compatibility S*_j ↪ S^±_{j+1} of the two processions via Prop 6.7 */
int  iut_processions_compatible(const iut_initial_theta_data *d, iut_report *r);

/* Rem 6.12.3, Fig 6.4: the two symmetries compared with the upper half-plane */
typedef struct { const char *iut, *half_plane, *basepoints, *point_at_infinity; } iut_half_plane_row;
unsigned iut_half_plane_dictionary(iut_half_plane_row *out, unsigned max);

/* Fig 6.6: the Frobenioids that appear in a Θ±ell NF-Hodge theater */
typedef struct { const char *id, *notation, *where, *kummer; } iut_ht_frobenioid_row;
unsigned iut_ht_frobenioids(iut_ht_frobenioid_row *out, unsigned max);

#endif /* IUT_I_H */
