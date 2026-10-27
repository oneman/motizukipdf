/*
 * iut_ops.h — the OPERATIONS layer: every step / process one can perform with
 * the data types of iut.h, as C functions, each annotated with the paper and
 * section it comes from.  Organised by paper:
 *
 *   iut_ops_i.c     [IUTchI]   labels, cusps, capsules, processions, bridges,
 *                              Hodge theaters, Frobenius/étale pictures, gluing
 *   iut_ops_ii.c    [IUTchII]  radial environments, cyclotomic rigidity, theta
 *                              evaluation, theta/Gaussian/constant monoids,
 *                              symmetrizing isomorphisms, Def 4.9 forgetting,
 *                              Cor 4.10 links, Cor 4.11 étale picture
 *   iut_ops_iii.c   [IUTchIII] log-link (Def 1.1, Prop 1.2 (i)-(x), Prop 1.3),
 *                              log-theta-lattice (Def 1.4), bi-cores (Thm 1.5),
 *                              tensor packets (§3), LGP-monoids, pilots and
 *                              LGP/lgp-links (Def 3.8), log-volumes (Prop 3.9),
 *                              non-interference (Prop 3.10), the multiradial
 *                              representation (Thm 3.11), the estimate (Cor 3.12)
 *   iut_ops_iv.c    [IUTchIV]  the local estimates (Props 1.1-1.8), arithmetic
 *                              divisors (Def 1.9), Thm 1.10, Prop 2.1, Cor 2.2,
 *                              Cor 2.3, and the species operations of §3
 *   iut_ops_logic.c [EssLgc]   the numerical model Ex 2.4.5, the ∧/∨̇ chain and
 *                              (Stp1)-(Stp8) of §3.10, fuzzification/engulfing;
 *                   [Alien]    Steps 1-12 of the Gaussian integral (§1), the
 *                              mono-anabelian transport apparatus (§2.7), the
 *                              formal-sum/label bookkeeping of §3.6, the
 *                              estimate steps (1est)-(12est) of §3.7, the
 *                              dictionary of §3.8
 *   iut_proc.c                 registry of all processes (id, paper, section,
 *                              inputs, outputs, runner) + `iut procs` / `iut run`
 *
 * Numerical conventions are those of iut.h: valuations in units of ord(q̲_v),
 * log-volumes in nats, |log q| = log q / 2l.
 */
#ifndef IUT_OPS_H
#define IUT_OPS_H
#include "iut.h"
#include "iut_i.h"

/* =================================================================== IUTchI */

/* ---- label sets and the maps between them  [IUTchI] §4-§6; [Pano] §3 ----- */
/* F_l ⊇ F_l^× ↠ F_l^* = F_l^×/{±1};  |F_l| = F_l/{±1} = {0} ∪ F_l^*            */
int  iut_label_abs(int t);                                      /* t ↦ |t|          */
int  iut_label_in_FlUnits(const iut_initial_theta_data *d, int t);  /* t ∈ F_l^×    */
int  iut_label_FlUnits_to_FlStar(const iut_initial_theta_data *d, int u); /* F_l^× ↠ F_l^* */
/* the gluing "0, ⊞ ↦ >" of [IUTchI] Def 6.13 / Prop 6.7 at the level of labels:
 * t ∈ F_l^× ↦ |t| ∈ F_l^*;  t = 0 ↦ 0 (the label ">" of F_>)                   */
int  iut_label_glue_pm_to_nf(const iut_initial_theta_data *d, int t);
/* orbits of the two symmetries ([IUTchI] Prop 4.9, Prop 6.6; [Pano] §3):
 * F_l^{⋊±} acts transitively on F_l (orbit = all of F_l), F_l^* acts freely and
 * transitively on F_l^*;  both return the orbit size.                           */
unsigned iut_label_orbit_FlSemiPm(const iut_initial_theta_data *d, int t);
unsigned iut_label_orbit_FlStar(const iut_initial_theta_data *d, int j);

/* ---- cusps and label classes  [IUTchI] Def 6.1, Prop 6.5; [IUTchII] Cor 4.5 (iii), Cor 4.7 (ii) */
typedef struct {
    unsigned n;                        /* |LabCusp±| = l  (resp. |LabCusp| = l*)   */
    int      label[2*IUT_MAX_LSTAR+1]; /* ζ: cusp index ↦ label in F_l (resp. F_l^*) */
    int      signed_labels;            /* 1: LabCusp± (F_l), 0: LabCusp (F_l^*)    */
} iut_labcusp;
void iut_labcusp_pm_make(const iut_initial_theta_data *d, iut_labcusp *out);      /* LabCusp±(D_⊚) ≅ F_l  */
void iut_labcusp_make(const iut_initial_theta_data *d, iut_labcusp *out);         /* LabCusp(D_⊛) ≅ F_l^* */
/* LabCusp±  →  LabCusp:  t ↦ |t|, 0 and the ± identification forgotten (Prop 6.5) */
void iut_labcusp_forget_sign(const iut_labcusp *pm, iut_labcusp *out);
int  iut_labcusp_is_bijection(const iut_labcusp *lc, const iut_initial_theta_data *d);

/* ---- capsules and processions  [IUTchI] §0, Prop 4.11, Prop 6.9 -------- */
typedef struct {
    unsigned n;
    int      label[2*IUT_MAX_LSTAR+1];
    unsigned basepoint[2*IUT_MAX_LSTAR+1];
} iut_capsule;
/* a morphism of capsules = injection of index sets + isomorphisms  [IUTchI] §0 */
typedef struct { unsigned n_dom, n_cod; int map[2*IUT_MAX_LSTAR+1]; } iut_capsule_morphism;
void iut_capsule_from_T(const iut_hodge_theater *ht, iut_capsule *out);      /* F_T, t ∈ F_l   */
void iut_capsule_from_J(const iut_hodge_theater *ht, iut_capsule *out);      /* F_J, j ∈ F_l^* */
int  iut_capsule_morphism_valid(const iut_capsule_morphism *m);           /* injective       */
int  iut_capsule_full_poly_iso_count(const iut_capsule *c);               /* n! permutations */

typedef enum { IUT_PRC_NF = 0,   /* Prc(D_J): S_1 ⊂ … ⊂ S_{l*},  S_j = {1..j}        [IUTchI] Prop 4.11 */
               IUT_PRC_PM = 1    /* Prc(D_T): S±_1 ⊂ … ⊂ S±_{l±}, S±_{j+1} = {0..j}  [IUTchI] Prop 6.9  */
} iut_procession_kind;
typedef struct {
    iut_procession_kind kind;
    unsigned nsteps;                  /* l* or l± */
    unsigned size[IUT_MAX_LPM+1];     /* |S_k| */
    int      first_label[IUT_MAX_LPM+1], last_label[IUT_MAX_LPM+1];
    unsigned long long automorphisms;      /* Π_k |S_k|!  (the (Ind1) permutations)   */
    double   normalization[IUT_MAX_LPM+1]; /* 1/|S_k|: procession-normalization weight */
} iut_procession;
void iut_procession_build(const iut_initial_theta_data *d, iut_procession_kind k, iut_procession *out);
/* [IUTchI] Prop 6.9 (ii): the mono-analytic procession Prc(D⊢_T) is obtained from
 * Prc(D_T) by forgetting; the labels 0..j survive (|F_l| labels).                */
unsigned iut_procession_capsule_labels(const iut_procession *p, unsigned k, int *labels);

/* ---- bridges  [IUTchI] Def 4.6, Def 5.5, Def 6.4, Def 6.11 ---------------- */
typedef enum { IUT_BRIDGE_THETA = 0,  /* Θ-bridge   φ^Θ : F_J → F_>     (ΘNF)      */
               IUT_BRIDGE_NF,         /* NF-bridge  φ^NF: F_J → F_⊛     (ΘNF)      */
               IUT_BRIDGE_THETA_PM,   /* Θ±-bridge  φ^Θ±: F_T → F_⊞     (Θ±ell)    */
               IUT_BRIDGE_THETA_ELL,  /* Θell-bridge φ^Θell: D_T → D_⊚± (Θ±ell)    */
               IUT_BRIDGE_COUNT } iut_bridge_kind;
typedef struct {
    iut_bridge_kind kind;
    unsigned n_dom;                 /* capsule size l* or l                          */
    const char *dom, *cod;          /* identifiers of domain capsule / codomain strip */
    const char *symmetry;           /* group of isomorphisms: F_l^*, F_l^{⋊±}, {±1} …*/
    unsigned long long isos;             /* order of that group                           */
    int poly;                       /* poly-morphism (1) or morphism (0)             */
    int ok;                         /* bridge present in the Hodge theater           */
} iut_bridge;
void iut_bridge_build(const iut_hodge_theater *ht, iut_bridge_kind k, iut_bridge *out);
const char *iut_bridge_kind_id(iut_bridge_kind k);

/* ---- forgetful functors between Hodge theaters  [IUTchI] Def 6.13, Rem 6.12.2 */
typedef struct {                    /* D-Θ±ell NF-Hodge theater: base categories only */
    unsigned universe;
    unsigned nT, nJ;
    unsigned Pi_T[2*IUT_MAX_LSTAR+1], Pi_J[IUT_MAX_LSTAR+1]; /* Π copies of the capsules */
    unsigned Pi_BoxPlus[IUT_MAX_V], Pi_Gt[IUT_MAX_V], Pi_CircDot[IUT_MAX_V], Pi_CircAst[IUT_MAX_V];
    unsigned nV;
} iut_d_hodge_theater;
void iut_hodge_theater_to_D(const iut_hodge_theater *ht, iut_d_hodge_theater *out);   /* F-HT ↦ D-HT */
int  iut_d_hodge_theater_iso(const iut_d_hodge_theater *a, const iut_d_hodge_theater *b); /* same Π's */
/* Θ±ell NF-HT ↦ its Θ±ell-HT / ΘNF-HT / Θ-HT components (projections)               */
const iut_theta_pm_ell_hodge_theater *iut_hodge_theater_pmell(const iut_hodge_theater *ht);
const iut_theta_nf_hodge_theater     *iut_hodge_theater_nf(const iut_hodge_theater *ht);
const iut_theta_hodge_theater        *iut_hodge_theater_theta(const iut_hodge_theater *ht);

/* ---- Frobenius picture / étale picture  [IUTchI] Cor 3.8, Cor 4.12, Cor 6.10 */
typedef struct {
    unsigned n;                    /* number of Hodge theaters in the chain          */
    unsigned universe[IUT_LAT_N];  /* their labels (…, †, ‡, ∗, …)                    */
    iut_link_kind kind;            /* Θ-link flavour between consecutive ones         */
    int translation_symmetric;     /* Z acts by shifting  (Cor 3.8 (ii))              */
    int adjacent_swap_allowed;     /* 0: never (dom/cod of a Θ-link are not symmetric)*/
} iut_frobenius_chain;
void iut_frobenius_chain_build(iut_log_theta_lattice *lat, int m, int n0, int n1, iut_frobenius_chain *out);
int  iut_frobenius_chain_translate(const iut_frobenius_chain *c, int shift, iut_frobenius_chain *out);
typedef struct {
    unsigned core_copy[IUT_MAX_V];  /* the shared D⊢ = {G_v}                          */
    unsigned nV;
    unsigned nspokes;
    unsigned spoke_universe[IUT_LAT_N];
    int      permutation_symmetric; /* arbitrary permutations of spokes allowed        */
} iut_etale_picture;
void iut_etale_picture_build(iut_log_theta_lattice *lat, int m, iut_etale_picture *out);
int  iut_etale_picture_permute(const iut_etale_picture *e, const unsigned *perm, iut_etale_picture *out);

/* ---- global number-field data  [IUTchI] Ex 5.1; [IUTchII] Cor 4.7, Cor 4.8 */
typedef struct {
    unsigned Pi_CK_copy;            /* Π_{C_K} (étale-like)                            */
    unsigned Fmod_units_copy;       /* M^⊛_mod = F_mod^×  (Frobenius-like)             */
    unsigned kappa_coric_copy;      /* M^⊛_κ ⊆ M^⊛_∞κ : κ-coric rational functions      */
    unsigned sol_copy;              /* M^⊛_sol ⊇ M^⊛_mod                               */
    int has_Frobenioid_mod;         /* F^⊛_mod ⊆ F^⊛  (Ex 5.1 (iii))                   */
    int realified;                  /* F^⊛R_mod  (Ex 5.1 (vii))                        */
    int kummer_rigid;               /* Q>0 ∩ Ẑ× = {1} rigidity of the Kummer iso ([IUTchI] Ex 5.1 (v), Rem 3.1.5(?), [IUTchIII] Rem 2.3.3) */
} iut_global_nf_data;
void iut_global_nf_build(const iut_initial_theta_data *d, unsigned copy_base, iut_global_nf_data *out);
void iut_global_nf_realify(iut_global_nf_data *g);
/* Kummer isomorphism of the global data: Frobenius-like F^⊛ ≅ étale-like F^⊛(D_⊛), [IUTchI] Cor 5.3 / [IUTchII] Cor 4.8 */
int  iut_global_nf_kummer(const iut_global_nf_data *frob, const iut_global_nf_data *etale, iut_report *r);

/* ================================================================== IUTchII */

/* ---- radial environments and multiradiality  [IUTchII] Ex 1.7-1.9 -------- */
typedef struct {
    const char *radial;             /* radial data R                                   */
    const char *coric;              /* coric data C                                    */
    int  full;                      /* Φ : R → C is full  ⇒ multiradial                */
    int  multiradialized;           /* obtained by Ex 1.7 (ii): R × (full poly-iso)    */
    const char *ref;
} iut_radial_env;
void iut_radial_env_make(const char *radial, const char *coric, int full, const char *ref, iut_radial_env *out);
int  iut_radial_env_is_multiradial(const iut_radial_env *e);               /* Ex 1.7 (i)   */
void iut_radial_env_multiradialize(const iut_radial_env *in, iut_radial_env *out); /* Ex 1.7 (ii) */
extern const iut_radial_env iut_radial_examples[];                         /* Ex 1.8, 1.9, Cor 2.3, Thm 3.11 */
extern const size_t iut_radial_examples_count;

/* ---- cyclotomic rigidity  [IUTchII] Cor 1.10, Cor 1.11, Cor 1.12; [IUTchI] Ex 5.1 (v) */
typedef enum { IUT_CYC_MONO_THETA = 0, /* (l·Δ_Θ)(Π) ≅ Π_μ(M^Θ_*(Π)): multiradial, no indeterminacy */
               IUT_CYC_MLF_GALOIS_PAIR, /* local class field theory: Ẑ×-orbit/Aut(G)-orbit indet.  */
               IUT_CYC_NUMBER_FIELD,    /* Q>0 ∩ Ẑ× = {1}: global κ-coric functions, multiradial    */
               IUT_CYC_COUNT } iut_cyclotomic_kind;
typedef struct {
    iut_cyclotomic_kind kind;
    const char *indeterminacy;       /* "none", "Ẑ×-orbit", …                            */
    int multiradial;                 /* compatible with the Ind2 (Ism) indeterminacy      */
    int uses_ring_structure;         /* needs the full local field (uniradial input)      */
    const char *ref;
} iut_cyclotomic_rigidity;
void iut_cyclotomic_rigidity_get(iut_cyclotomic_kind k, iut_cyclotomic_rigidity *out);
/* constant multiple rigidity Cor 1.12: Γ^{×μ} = Ism,  pairs (ι, D) */
unsigned iut_constant_multiple_rigidity_orbit(void);   /* returns 2 = |{±1}| (the ι-indeterminacy) */

/* ---- theta evaluation  [IUTchII] Cor 2.4, Cor 2.5, Cor 2.8, Cor 3.5 ------- */
typedef struct { unsigned Pi_to_PiYdd, PiPm_to_Pi, PiPm_to_PiYdd; } iut_tempered_indices; /* 2, l, 2l */
void iut_tempered_indices_get(const iut_initial_theta_data *d, iut_tempered_indices *out);     /* Cor 2.4 (i) */
typedef struct {
    int      t;                      /* label t ∈ F_l of the evaluation point           */
    int      abs_t;                  /* |t|: the value depends only on |t|  (Cor 2.5)   */
    iut_q    value;                  /* ord(θ(√−q^t)) = t²·ord(q̲)  (q̲ = q^{1/2l})       */
    unsigned torsion_indeterminacy;  /* μ_{2l}-orbit (2l) — Cor 2.5 (i)                 */
    int      mono_theta;             /* Cor 2.8: mono-theta-theoretic version (μ-orbit) */
} iut_theta_value;
void iut_theta_evaluate(const iut_initial_theta_data *d, int t, iut_theta_value *out);
unsigned iut_theta_evaluate_all(const iut_initial_theta_data *d, iut_theta_value *out); /* |t| = 0..l* */
/* decomposition groups at the evaluation points D_{t,μ−}  (Cor 2.4 (ii)): count */
unsigned iut_evaluation_points_count(const iut_initial_theta_data *d);    /* l (one per t) */

/* ---- monoids  [IUTchII] Prop 3.1, Cor 3.5, Cor 3.6, Cor 4.5, Cor 4.6 ------- */
typedef enum { IUT_MON_CONSTANT = 0,   /* Ψ_cns   = O▷ (constant)                Cor 4.5 (i)   */
               IUT_MON_THETA,          /* Ψ_env   = O× · θ^N                     Prop 3.1       */
               IUT_MON_THETA_INF,      /* ∞Ψ_env  = O× · θ^Q≥0 (all roots)       Prop 3.1       */
               IUT_MON_GAUSSIAN,       /* Ψ_gau   = O× · (q̲^{j²})_j              Cor 3.5 (ii)   */
               IUT_MON_GAUSSIAN_INF,   /* ∞Ψ_gau                                              */
               IUT_MON_SEMISIMPLE,     /* Ψ^ss_cns = O× × R≥0 with log(p_v)      Cor 4.5 (ii)   */
               IUT_MON_LGP,            /* Ψ_LGP: log-Gaussian procession monoid  [IUTchIII] Prop 3.4 */
               IUT_MON_COUNT } iut_monoid_kind;
typedef struct {
    iut_monoid_kind kind;
    unsigned v_index;                /* which v ∈ V                                      */
    unsigned units_copy;             /* O× (Frobenius-like) copy id                      */
    unsigned G_copy;                 /* G_v acting                                       */
    unsigned ngen;                   /* value-group generators                           */
    iut_q    gen[IUT_MAX_LSTAR+1];   /* their valuations: θ: {1 (symbolic)}, gau: {j²}   */
    int      gen_label[IUT_MAX_LSTAR+1];
    int      perfected;              /* Q≥0-powers adjoined (∞-version)                  */
    double   distinguished_log_p;    /* Ψ^ss: log_{D⊢}(p_v) ∈ R≥0                        */
    int      etale_like;             /* built from D (Prop 3.1/Cor 4.5) vs from F (Cor 3.6/4.6) */
    int      split;                  /* splitting O× × value-group present              */
} iut_monoid;
void iut_monoid_build(const iut_initial_theta_data *d, iut_monoid_kind k, unsigned v_index,
                      unsigned copy_base, int etale_like, iut_monoid *out);
/* semisimplification  Ψ_cns ↦ Ψ^ss_cns  (Cor 4.5 (ii)): forget the ring, keep O× and R≥0 with log(p_v) */
void iut_monoid_semisimplify(const iut_initial_theta_data *d, const iut_monoid *cns, iut_monoid *out);
/* evaluation isomorphism  Ψ_env ≅ Ψ_gau : θ ↦ (q̲^{j²})_j   (Cor 3.5 (ii), Cor 4.10 (ii)) */
int  iut_monoid_evaluation_iso(const iut_initial_theta_data *d, const iut_monoid *env, const iut_monoid *gau, iut_report *r);
/* Kummer isomorphism  Frobenius-like Ψ(F) ≅ étale-like Ψ(D)  (Cor 4.6, Cor 4.8) */
int  iut_monoid_kummer_iso(const iut_monoid *frob, const iut_monoid *etale, iut_report *r);
/* the global realified Frobenioid D⊩(D⊢) built from Ψ^ss  (Cor 4.5 (ii)): Prime(D⊩) → V, ρ_v */
void iut_global_realified_from_DMono(const iut_initial_theta_data *d, const iut_prime_strip *DMono, iut_prime_strip *out);

/* ---- symmetrizing isomorphisms, conjugate synchronization  Cor 3.5 (i), Cor 4.5 (iii), Cor 4.7 (ii) */
typedef struct {
    unsigned nclasses;                 /* |F_l| = l*+1  or  l*                            */
    int      class_of[2*IUT_MAX_LSTAR+1]; /* label index ↦ class (|t| or j)               */
    unsigned synchronized_copy;        /* the single G_v copy all members are identified with */
    unsigned diagonal_copy;            /* the diagonal (−)_{F_l^*} ⊆ Π_j (−)_j             */
    const char *group;                 /* "F_l^{⋊±}" or "F_l^*"                           */
} iut_symmetrization;
void iut_symmetrize_FlSemiPm(const iut_initial_theta_data *d, const iut_capsule *T, iut_symmetrization *out);
void iut_symmetrize_FlStar(const iut_initial_theta_data *d, const iut_capsule *J, iut_symmetrization *out);
int  iut_conjugate_synchronized(const iut_symmetrization *s);   /* all basepoints identified */
/* [IUTchII] Rem 4.11.1 / [IUTchI] Rem 6.12.6: restricting the labels to a proper subset breaks the symmetry */
int  iut_label_subset_keeps_symmetry(const iut_initial_theta_data *d, const int *labels, unsigned n, int group_pm);

/* ---- Def 4.9: the mono-analytic forgetting ladder and pilot objects -------- */
typedef struct { unsigned n; iut_ps_kind kind[8]; const char *ref[8]; } iut_forget_ladder;
void iut_ps_forget_ladder(const iut_initial_theta_data *d, const iut_prime_strip *src, iut_prime_strip *out, iut_forget_ladder *ladder);
double iut_pilot_object_degree(const iut_prime_strip *ps);     /* Def 4.9 (viii): ≤ 0 */
unsigned iut_units_mod_tors_kummer_orbit(const iut_prime_strip *ps); /* Ism-orbit size marker (2 = ±1 nontrivial) */

/* ---- Cor 4.10: the Θ×μ / Θ×μ_gau-links and their cores ------------------- */
int  iut_constant_strip_identify(const iut_hodge_theater *ht, iut_report *r);   /* (i) F⊩_Δ ≅ F⊩_mod via 0, F_l^* ↦ > */
int  iut_envelope_isos(const iut_hodge_theater *ht, iut_report *r);             /* (ii) F⊩_env ≅ F⊩_tht ≅ F⊩_gau       */
int  iut_theta_link_make(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_link_kind k, iut_link *out); /* (iii) + [IUTchIII] Def 3.8 (ii) */
int  iut_theta_link_coric_units(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r);  /* (iv) †F⊢×μ ≅ ‡F⊢×μ */
int  iut_theta_link_induced_D_link(const iut_link *theta, iut_link *out);        /* (iv) D-Θ±ellNF-link on D⊢             */
int  iut_coric_global_realified(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r);  /* (v) up to R>0 */
unsigned iut_theta_gau_exponents(const iut_initial_theta_data *d, unsigned *out);  /* Rem 4.11.1: q ↦ q^{(1²,…,(l*)²)} */

/* ================================================================= IUTchIII */

/* ---- the log-link on a prime-strip  Def 1.1, Prop 1.2 --------------------- */
typedef struct {
    int tautological;               /* tautological log-link (identity on D) vs full log-link (full poly-iso of D) */
    unsigned nshell;
    iut_log_shell shell[IUT_MAX_V];
    /* Prop 1.2 bookkeeping */
    int coric_D, coric_DMono;        /* (i)                                                */
    int ring_structure_preserved;    /* never: "log" is not a ring homomorphism  (ii)       */
    int log_volume_compatible;       /* (iii)                                              */
    int kummer_compatible;           /* (iv) NO: Kummer isos are not compatible             */
    int holomorphic_shells;          /* (v) a,b,c hold                                      */
} iut_log_link_result;
void iut_log_link_strip(const iut_initial_theta_data *d, const iut_prime_strip *src, iut_prime_strip *dst, int tautological, iut_log_link_result *out);
/* the log-shell at v:  I_v = (p*)^{-1} log(O×)   Def 1.1 (i);  [AbsTopIII] Def 5.4 (iii) */
void iut_log_shell_make(const iut_initial_theta_data *d, unsigned v_index, int holomorphic, int etale_like, int n, int m, iut_log_shell *out);
/* Prop 1.2 (v): (a) O× ⊆ I (after log), (b) O▷ ⊆ … , (c) I is a compact Z_p-module containing log(O×) */
int  iut_log_shell_properties(const iut_log_shell *sh, const iut_initial_theta_data *d, iut_report *r);
/* Prop 1.2 (vi)-(ix): mono-analytic / coric log-shells and the isomorphisms between them */
typedef enum { IUT_SHELL_HOL_F = 0, IUT_SHELL_MONO_FUNITSMODTORS, IUT_SHELL_MONO_DMONO, IUT_SHELL_HOL_D } iut_shell_source;
void iut_log_shell_from(const iut_initial_theta_data *d, iut_shell_source src, unsigned v_index, int n, int m, iut_log_shell *out);
/* I_D⊢ ≅ I_F⊢×μ ≅ I_F : indeterminacy of the iso = Ism-orbit (nonarch) / {±1} (arch) (Prop 1.2 (vi), (vii)) */
const char *iut_log_shell_iso_indeterminacy(const iut_initial_theta_data *d, unsigned v_index);
int  iut_log_shell_isomorphic(const iut_log_shell *a, const iut_log_shell *b);
/* Prop 1.2 (x) / Prop 1.3 (iv): the vertical Frobenius picture …→F→F→F→… */
void iut_log_chain_build(iut_log_theta_lattice *lat, int n, int m0, int m1, iut_frobenius_chain *out);
/* Prop 1.3: log-link between Hodge theaters via an isomorphism Ξ of D-HTs; applied to F_>, F_⊚, F_J, F_T */
int  iut_log_link_hodge_theater_check(const iut_hodge_theater *dom, const iut_hodge_theater *cod, iut_report *r);

/* ---- Def 1.4, Rem 1.4.1: the log-theta-lattice ---------------------------- */
const char *iut_lattice_flavour(iut_link_kind horizontal);  /* "non-Gaussian", "Gaussian", "LGP-Gaussian", "lgp-Gaussian" */
int  iut_lattice_square_commutes(void);                     /* 0: squares are NOT commutative (Rem 1.4.1 (i)) */
int  iut_lattice_horizontal_obligates_vertical(const iut_log_theta_lattice *lat, iut_report *r); /* Rem 1.4.1 (ii) */

/* ---- Thm 1.5: bi-coric data ----------------------------------------------- */
typedef struct {
    int vertical_coric_D;          /* (i)  (n,◦)D : the D-HT is the same down a column   */
    int horizontal_coric_units;    /* (ii) F⊢×μ the same across a Θ-link                 */
    int bicoric_units_of_DMono;    /* (iii) F⊢×μ(D⊢_Δ) ≅ F⊢×μ_> via Kummer               */
    int bicoric_log_shells;        /* (iv) mono-analytic log-shells                      */
    int bicoric_global_realified;  /* (v)  D⊩(D⊢) up to R>0                              */
    unsigned column_D_copy, row_units_copy;
} iut_bicoric;
void iut_bicoric_check(iut_log_theta_lattice *lat, int n, int m, iut_bicoric *out);

/* ---- §2: vertically coric theta monoids and the étale-picture radial environment */
int  iut_theta_monoid_vertically_coric(iut_log_theta_lattice *lat, int n, iut_report *r);  /* Prop 2.1 */
typedef struct { const char *item; const char *data; } iut_radial_item;
unsigned iut_etale_radial_environment(iut_radial_item *out, unsigned max); /* Cor 2.3: (aR)-(eR) + coric data */
int  iut_theta_monoid_multiradial(iut_report *r);                           /* Thm 2.2 / Cor 2.3 */

/* ---- §3: tensor packets, LGP-monoids, log-volumes ------------------------- */
typedef struct {
    unsigned j;                      /* capsule S±_{j+1}: j+1 factors                    */
    unsigned nfactors;
    unsigned vQ_p;                   /* rational prime (0 = archimedean)                  */
    unsigned nv_over_vQ;             /* |{v ∈ V : v | vQ}|                                 */
    unsigned long long nsummands;         /* nonarch: (nv_over_vQ)^{j+1} direct summand fields; arch: 2^{j}·|V_vQ|^{j+1} (Prop 1.5) */
    int holomorphic;                 /* log(^A F_vQ)  vs  mono-analytic I(^A D⊢_vQ)        */
    int global;                      /* (M_mod)_A : tensor powers of F_mod                 */
    double log_volume;               /* packet-normalized log-volume of the integral structure (0) / of the shells */
    double log_volume_shells;        /* Σ over factors of the shell log-volumes            */
} iut_tensor_packet;
void iut_tensor_packet_build(const iut_initial_theta_data *d, unsigned j, unsigned vQ_p, int holomorphic, iut_tensor_packet *out); /* Prop 3.1 (i), Prop 3.2 */
void iut_tensor_packet_global(const iut_initial_theta_data *d, unsigned j, iut_tensor_packet *out);        /* Prop 3.3 (i)  */
int  iut_tensor_packet_localize(const iut_tensor_packet *global, const iut_tensor_packet *local, iut_report *r); /* Prop 3.3 (ii) */
unsigned iut_tensor_packet_procession(const iut_initial_theta_data *d, unsigned vQ_p, int holomorphic, iut_tensor_packet *out); /* all j = 0..l* */

void iut_lgp_monoid_build(const iut_initial_theta_data *d, unsigned j, unsigned v_index, unsigned copy_base, iut_monoid *out); /* Prop 3.4 (ii): Ψ_FLGP at v ∈ Vbad */
typedef enum { IUT_USC_NONARCH = 0, IUT_USC_ARCH, IUT_USC_BAD } iut_usc_case;
typedef struct { iut_usc_case kase; const char *relation; double log_volume_delta; const char *ref; } iut_upper_semi_compat;
void iut_upper_semi_compatibility(const iut_initial_theta_data *d, unsigned v_index, iut_upper_semi_compat *out); /* Prop 3.5 (ii) (a)(b)(c) */

typedef enum { IUT_GLOB_MOD_TORSOR = 0 /* F_MOD: rational function torsors  Ex 3.6 (i) */, IUT_GLOB_MOD_IDEAL = 1 /* F_mod: local fractional ideals Ex 3.6 (ii) */ } iut_global_variant;
typedef struct { iut_global_variant v; const char *objects; int multiplicatively_compatible_with_theta_link; int compatible_with_log_volume; const char *ref; } iut_global_variant_info;
void iut_global_variant_info_get(iut_global_variant v, iut_global_variant_info *out);
int  iut_gau_LGP_lgp_isos(const iut_hodge_theater *ht, iut_report *r);  /* Prop 3.7 (ii): F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp */

/* Def 3.8: pilot objects and the LGP/lgp-links */
void iut_pilot_make(const iut_initial_theta_data *d, iut_pilot_kind k, iut_pilot *out);           /* (i)   */
int  iut_LGP_link_requires_log(const iut_log_theta_lattice *lat, int n, int m, iut_report *r);    /* (ii): relative to a log-link ‡→† */
const char *iut_lattice_kind_for_link(iut_link_kind k);                                            /* (iii) */

/* Prop 3.9: log-volumes */
double iut_log_volume_scale_by_p(double vol, unsigned p);               /* (i): multiplication by p_v adds −log p_v */
double iut_log_volume_scale_by_e(double vol);                            /* arch: multiplication by e adds +1       */
double iut_log_volume_procession_normalize(const double *vols, unsigned n); /* average over the capsules            */
double iut_arith_degree(const iut_initial_theta_data *d, const unsigned *exps, unsigned nexps); /* (iii): global log-volume = degree of the arithmetic line bundle determined by q̲^{exps} at v ∈ Vbad, in units of |log q| */
int    iut_log_volume_log_link_compatible(double before, double after);  /* (iv) log-volume is preserved by the log-link */

/* Prop 3.10: global Kummer theory and non-interference */
typedef struct { unsigned torsion_order; int non_interference; int MOD_compatible_with_LGP_link; int mod_compatible_with_log_volume; } iut_non_interference;
void iut_kummer_non_interference(const iut_initial_theta_data *d, iut_non_interference *out);

/* Thm 3.11: the multiradial representation, in full */
typedef struct {
    iut_multiradial_rep rep;            /* the numeric summary of iut.h                          */
    unsigned npackets;                  /* (a) tensor packets I(S±_{j+1}; n,◦D⊢)                 */
    iut_tensor_packet packet[IUT_MAX_LPM];
    unsigned nsplitting;                /* (b) splitting monoids Ψ⊥_LGP at v ∈ Vbad, one per j    */
    unsigned nnumberfields;             /* (c) copies (M_MOD)_j = (M_mod)_j of F_mod^×           */
    unsigned long long ind1_count;           /* |Aut(Prc)| permutations (× Aut(G_v), symbolic)        */
    unsigned long long ind2_summands;        /* number of direct summands acted on by Ism             */
    int ind3;                           /* upper semi-compatibility present                      */
    int log_kummer_ok;                  /* (ii) log-Kummer correspondence (non-interference)     */
    int link_compat[4];                 /* (iii) (a)-(d) compatibility with the Θ×μ_LGP-link     */
} iut_multiradial_full;
void iut_multiradial_full_build(const iut_log_theta_lattice *lat, int n, iut_multiradial_full *out);

/* Cor 3.12: the estimate, as a sequence of steps with numbers */
typedef struct { const char *label; double value; const char *ref; } iut_named_value;
unsigned iut_cor312_steps(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max);
int  iut_cor312_holds(const iut_log_theta_lattice *lat);

/* ================================================================== IUTchIV */

/* ---- Props 1.1-1.4: differents, logarithms, p-adic log-volume --------------- */
typedef struct { unsigned p, e, f, m; double d; } iut_local_field;  /* k_i: ram. index e, residue degree f, p-torsion exponent m, different exponent d */
double iut_iv_a(const iut_local_field *k);                /* a_i = (1/e)⌈e/(p−2)⌉ (p>2), 2 (p=2)   Prop 1.2 */
double iut_iv_b(const iut_local_field *k);                /* b_i = ⌊log(p e/(p−1))/log p⌋ − 1/e           */
double iut_iv_dI(const iut_local_field *k, unsigned n);   /* d_I = Σ d_i                                     */
double iut_iv_dIstar(const iut_local_field *k, unsigned n, unsigned star); /* Prop 1.1: d_{I*}, I* = I∖{*}    */
int    iut_iv_prop12_i(const iut_local_field *k, double *lo, double *hi);  /* p^a R ⊆ log(R×) ⊆ p^{-b} R: returns 1 if equalities */
double iut_iv_prop12_ii_exp_log(const iut_local_field *k, unsigned n, double lambda);   /* ⌈λ − d_I − a_I⌉ */
double iut_iv_prop12_ii_exp_tilde(const iut_local_field *k, unsigned n, double lambda); /* ⌊λ − d_I − a_I − b_I⌋ */
double iut_iv_prop12_iii_exp(const iut_local_field *k, unsigned n, double lambda);      /* ⌊λ − d_I⌋ − 1 (p>2, e ≤ p−2) */
int    iut_iv_prop12_iv_unramified(const iut_local_field *k, unsigned n);               /* φ((R_I)~) ⊆ (R_I)~ */
void   iut_iv_prop13_bounds(const iut_local_field *k0, const iut_local_field *ki, unsigned n_i, double *lo, double *hi); /* d_0 + (e_{i/0}−1)/e_i ≤ d_i ≤ d_0 + n_i + 1/e_0 */
double iut_iv_mulog_log_units(const iut_local_field *k);  /* Prop 1.4 (ii): μ_log(log_p(R×)) = −(1/e + m/(ef)) log p */
double iut_iv_prop14_iii_bound_log(const iut_local_field *k, unsigned n, unsigned nstar, double lambda);   /* (−λ + d_I + 1 + 4|I*|/p) log p */
double iut_iv_prop14_iii_bound_tilde(const iut_local_field *k, unsigned n, const int *in_star, double lambda); /* (−λ+d_I+1) log p + Σ_{I*}(3+log e_i) */
double iut_iv_prop14_iii_dI_plus_aI_lower(const iut_local_field *k, unsigned n); /* |I| (p>2) or 2|I| (p=2) */
int    iut_iv_prop14_iv(const iut_local_field *k, unsigned n);                   /* μ_log = 0 if p>2 unramified */

/* ---- Prop 1.5: archimedean ------------------------------------------------ */
unsigned long long iut_iv_arch_summands(unsigned nI, unsigned nVarc);   /* 2^{|I|−1}·|V|^{|I|} */
double iut_iv_arch_metric_factor(unsigned nI);                     /* 2^{|I|−1}            */
double iut_iv_arch_tensor_bound(unsigned nI, double lambda);       /* ⊗m_i ∈ λ^{|I|}·B_I   */

/* ---- Prop 1.6: prime number theorem bounds -------------------------------- */
double iut_iv_pnt_n_bound(double pn);          /* n ≤ 4 p_n /(3 log p_n)                     */
double iut_iv_pnt_count_bound(double eta);     /* #{p ≤ η} ≤ 4η/(3 log η) for η ≥ η_prm      */
#ifndef IUT_ETA_PRM_VALUE
#define IUT_ETA_PRM_VALUE 5.0e20   /* η_prm of [IUTchIV] Prop 1.6 / [ExpEst] */
#endif

/* ---- Prop 1.7: weighted averages ----------------------------------------- */
double iut_iv_weighted_average(const double *beta, const double *lambda, unsigned n); /* β_avg = Σλβ/Σλ */
void   iut_iv_normalized_weights(const iut_initial_theta_data *d, unsigned p, double *lambda, unsigned *n); /* λ_v = [(F_mod)_v : Q_p] */

/* ---- Prop 1.8: torsion points, fields of definition ----------------------- */
int  iut_iv_torsion_facts(const iut_initial_theta_data *d, iut_report *r);   /* (i)-(vii) as checks/notes */

/* ---- Def 1.9: arithmetic divisors ----------------------------------------- */
typedef struct { unsigned nV; double coeff[IUT_MAX_V]; } iut_arith_divisor;  /* Σ c_v·v, c_v ∈ R (nonarch: Z) */
void   iut_arith_divisor_zero(const iut_initial_theta_data *d, iut_arith_divisor *out);
void   iut_arith_divisor_q(const iut_initial_theta_data *d, iut_arith_divisor *out);       /* the q-divisor Σ ord(q_v)·v */
void   iut_arith_divisor_add(const iut_arith_divisor *a, const iut_arith_divisor *b, iut_arith_divisor *out);
double iut_arith_divisor_deg(const iut_initial_theta_data *d, const iut_arith_divisor *D); /* deg = Σ c_v f_v log p_v     */
double iut_arith_divisor_normalized_deg(const iut_initial_theta_data *d, const iut_arith_divisor *D); /* deg/[F_mod:Q] */
double iut_arith_divisor_deg_E(const iut_initial_theta_data *d, const iut_arith_divisor *D, unsigned p); /* deg over the v | p */

/* ---- Thm 1.10 ------------------------------------------------------------ */
double iut_iv_E1(unsigned n);                /* (1/n)Σ_{m=1}^n m = (n+1)/2           */
double iut_iv_E2(unsigned n);                /* (1/n)Σ m² = (2n+1)(n+1)/6             */
double iut_iv_E3(unsigned p);                /* |GL2(F_p)| = p(p+1)(p−1)²             */
double iut_iv_E5(void);                      /* [F_mod(√−1):F_mod] ≤ 2                */
typedef struct {
    double logq, abs_logq, logd_tpd, logf_tpd, logdK_bound, logfK_bound, logdF_plus_logfF_bound;
    double e_mod, estar_mod, eta_prm;
    double C_theta;                          /* the constant of Thm 1.10               */
    double lhs, rhs;                         /* (1/6) log q  ≤  (1 + 20 d_mod/l)(log d^Ftpd + log f^Ftpd) + 20(e*_mod l + η_prm) */
    int    cor312_holds, inequality_holds;
} iut_thm110;
void iut_thm110_compute(const iut_initial_theta_data *d, iut_thm110 *out);

/* ---- Prop 2.1, Cor 2.2, Cor 2.3 ------------------------------------------ */
int    iut_iv_log_le_x(double x);                       /* log x ≤ x                              */
double iut_iv_chebyshev_lo(double x);                   /* 2x/3 ≤ θ(x)                            */
double iut_iv_chebyshev_hi(double x);                   /* θ(x) ≤ 4x/3  (x ≥ ξ_prm)               */
double iut_iv_prime_in_A_bound(double thetaA, double xi_prm); /* ∃ p ∈ A, p ≤ 2(θ_A + ξ_prm)     */
typedef struct {
    double d, delta;                        /* δ = 2^12·3^3·5·d                                  */
    double logq_all;                        /* log q∀ (the height)                               */
    double l_min, l_max;                    /* (C1): (log q∀)^{1/2} ≤ l ≤ 10δ (log q∀)^{1/2} log(2δ log q∀) */
    double eps_E;                           /* (60δ)² log(2δ log q∀)/(log q∀)^{1/2}              */
    double logdiff, logcond_lo, logcond_hi; /* log-diff = log d^Ftpd; log f^Ftpd ≤ log-cond ≤ log f^Ftpd + log(2l) */
    double C_K, lhs, rhs;                   /* (C2): (1/6) log q ≤ (1+ε_E)(log-diff + log-cond) + C_K */
    int    l_in_range, holds;
} iut_cor22;
void iut_cor22_compute(const iut_initial_theta_data *d, iut_cor22 *out);
double iut_cor23_bound(double ht, double logdiff, double logcond, double eps, double C); /* ht ≤ (1+ε)(log-diff+log-cond)+C: returns slack */

/* ---- §3: species, mutations, mutation-histories --------------------------- */
int  iut_species_find(const char *id);                            /* index or -1               */
int  iut_mutation_find(const char *id);
int  iut_mutation_compose(const iut_mutation *f, const iut_mutation *g, iut_mutation *out); /* g∘f if f.cod == g.dom  Def 3.3 */
void iut_mutation_identity(const iut_species *s, iut_mutation *out);
int  iut_species_isomorphic(const iut_species *a, const iut_species *b);            /* Def 3.1 (iv): same formula */
typedef struct { unsigned nvertices, nedges; const char *vertex[IUT_LAT_N*IUT_LAT_M]; const char *edge[IUT_LAT_N*IUT_LAT_M*2]; } iut_mutation_history;
void iut_mutation_history_from_lattice(const iut_log_theta_lattice *lat, iut_mutation_history *out); /* Def 3.3 (iii) */
int  iut_observable_is_core(const char *species_id);                                   /* Def 3.3 (v): coric data */

/* =================================================================== EssLgc */

/* Ex 2.4.5: the numerical model.  A, B > 0, ε ∈ [0,1], N ∈ R. */
typedef enum { IUT_LOGIC_AND = 0, IUT_LOGIC_OR, IUT_LOGIC_XOR, IUT_LOGIC_RCS, IUT_LOGIC_ESSOR, IUT_LOGIC_COUNT } iut_logic_flavour;
typedef struct {
    double A, B, eps;
    double N_theta_link[2];     /* Θ-link:        N = −2B  ∧  N = −A           */
    double N_multiradial[2];    /* multiradial:   N = −2A+ε ∧ N = −A           */
    double conclusion_A;        /* A = ε ≤ 1 (AND-IUT)                          */
    int    consistent;          /* the ∧ system has a solution                  */
    int    meaningful;          /* OR-version: no conclusion                     */
    iut_logic_flavour flavour;
} iut_esslgc_model;
void iut_esslgc_model_eval(double A, double B, double eps, iut_logic_flavour f, iut_esslgc_model *out);
const char *iut_logic_flavour_name(iut_logic_flavour f);

/* §3.10: the chain of logical ∧ relations, (Stp1)-(Stp8) */
typedef struct {
    const char *id;            /* "StpOne" … "StpEight"                         */
    const char *from, *to;     /* lattice labels: (0,0) ⇝ (0,◦) ⇝ (0,◦)⊢ ⇝ (0,0)⊢ ⇔ (1,0)⊢ … */
    const char *indeterminacy; /* Ind3, Ind1, Ind2, none                        */
    const char *ref;
    double log_volume;         /* running log-volume bound after the step        */
} iut_stp;
unsigned iut_stp_chain(const iut_log_theta_lattice *lat, iut_stp *out, unsigned max);
/* (FxGl): fix the q-pilot at (1,0) and glue it to the Θ-pilot at (0,0) */
int  iut_fix_and_glue(const iut_log_theta_lattice *lat, double *q_side, double *theta_side);
/* fuzzification / engulfing (Englf): the indeterminacies turn a value into a region that contains the q-pilot */
typedef struct { double lo, hi; } iut_interval;
iut_interval iut_fuzzify(double value, const iut_indeterminacies *ind, double ind1_width, double ind2_width, double ind3_up);
int  iut_engulfs(iut_interval region, double value);
/* (ExtInd1) adding possibilities = union of label sets; (ExtInd2) crushing = identifying labels */
unsigned iut_extind1_union(const int *a, unsigned na, const int *b, unsigned nb, int *out);
unsigned iut_extind2_crush(const int *a, unsigned na, int (*cls)(int), int *out);
/* (logORInd) vs (ΘORInd): which ∨̇ is harmless */
const char *iut_or_indeterminacy_verdict(int along_log_link);

/* =================================================================== Alien */

/* §1: Steps 1-12 of the computation of the Gaussian integral ∫ e^{−x²} dx = √π */
typedef struct { unsigned step; const char *title; double value; const char *iut_analogue; } iut_gauss_step;
unsigned iut_alien_gauss_steps(iut_gauss_step *out, unsigned max);
double   iut_alien_gauss_numeric(void);           /* numerical ∫_{−∞}^{∞} e^{−x²} dx */

/* §2.7: the apparatus of mono-anabelian transport (Fig 2.1) */
typedef struct { const char *stage; const char *side; const char *mass; const char *indeterminacy; const char *ref; } iut_transport_stage;
unsigned iut_transport_apparatus(iut_transport_stage *out, unsigned max);
/* run it on the lattice: Kummer-detach at (0,0), étale-transport across the Θ-link, Kummer-detach at (1,0) */
unsigned iut_transport_run(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max);

/* §3.6: formal sums of labels and their compatibilities */
typedef struct { unsigned n; int label[2*IUT_MAX_LSTAR+1]; iut_q coeff[2*IUT_MAX_LSTAR+1]; } iut_formal_sum;
typedef enum { IUT_FS_ZERO = 0 /* [0] */, IUT_FS_ABS_J /* [|j|] = ½([j]+[−j]) */, IUT_FS_BOXPLUS /* [⊞] = (1/l)Σ_t [t] */, IUT_FS_GT /* [>] = (1/l*)Σ_j [|j|] */ } iut_formal_sum_kind;
void iut_formal_sum_make(const iut_initial_theta_data *d, iut_formal_sum_kind k, int j, iut_formal_sum *out);
iut_q iut_formal_sum_total(const iut_formal_sum *s);                 /* Σ coefficients (= 1 for all four) */
/* the compatibilities  [0] → [>],  [⊞] → [>],  (1/(l*+1))([0] + Σ_j [|j|]) → [>]  under t ↦ |t| and 0,⊞ ↦ > */
int  iut_formal_sum_compatible(const iut_initial_theta_data *d, iut_formal_sum_kind from, iut_report *r);
/* labels as a line segment of Ÿ ({−l*,…,l*}) and the evaluation points ±t */
unsigned iut_label_line_segment(const iut_initial_theta_data *d, int *out);
unsigned iut_evaluation_points(const iut_initial_theta_data *d, int t, int *out); /* {t, −t} */

/* §3.7 (ii): the estimate, steps (1est)-(12est) */
unsigned iut_alien_estimate_steps(const iut_log_theta_lattice *lat, iut_named_value *out, unsigned max);
/* §3.7 (iv): leading term per label j and the sum ≈ (l²/48)(6 log d^K − log q) */
double iut_alien_leading_term_j(const iut_initial_theta_data *d, unsigned j);  /* (j+1) log d^K − (j²/2l) log q */
double iut_alien_leading_term_sum(const iut_initial_theta_data *d);
double iut_alien_l_from_height(const iut_initial_theta_data *d);               /* l ≈ √(height) */

/* §3.8: the dictionary (1gau)-(11gau) between the Gaussian integral and IUT */
typedef struct { const char *gauss; const char *iut; } iut_dictionary_entry;
unsigned iut_alien_dictionary(iut_dictionary_entry *out, unsigned max);

/* =============================================================== registry */
typedef int (*iut_process_fn)(const iut_initial_theta_data *d, FILE *out);
typedef struct {
    const char *id;        /* letters-only, in the identifier table            */
    const char *paper;     /* IUTchI … Alien                                   */
    const char *section;
    const char *name;
    const char *inputs;    /* data types consumed                              */
    const char *outputs;   /* data types / numbers produced                    */
    iut_process_fn run;    /* demonstration runner: 0 = ok                      */
} iut_process;
extern const iut_process iut_processes[];
extern const size_t      iut_process_count;
const iut_process *iut_process_find(const char *id);
int  iut_process_run(const iut_process *p, const iut_initial_theta_data *d, FILE *out);
int  iut_process_run_all(const iut_initial_theta_data *d, FILE *out, const char *filter); /* returns #failures */
void iut_view_processes(FILE *f, const char *filter);
void iut_json_processes(FILE *f);
void iut_md_processes(FILE *f);
int  iut_selftest_ops(FILE *out);   /* tests of this layer, returns #failures */

#endif /* IUT_OPS_H */
