/*
 * iut.h — data types ("species") of inter-universal Teichmüller theory (IUT)
 *
 * Every type here models a mathematical object introduced in Mochizuki's
 * papers [IUTchI]–[IUTchIV] (and recalled in the survey texts [Pano], [Alien],
 * [EssLgc], [FormIUT] that live in this repository as PDFs).  Each type and
 * each notational symbol carries an ENGLISH-LETTERS-ONLY identifier (A–Z, a–z
 * only, no digits, no underscores, no Greek letters): see iut_ids.c and
 * docs/IDENTIFIERS.md for the complete mapping  notation  <->  identifier.
 *
 * Citations used in comments:
 *   [IUTchI]   Inter-universal Teichmüller Theory I   (Hodge theaters)
 *   [IUTchII]  Inter-universal Teichmüller Theory II  (Hodge–Arakelov evaluation)
 *   [IUTchIII] Inter-universal Teichmüller Theory III (log-theta-lattice)
 *   [IUTchIV]  Inter-universal Teichmüller Theory IV  (log-volume, species)
 *   [Pano]     A Panoramic Overview of IUT
 *   [Alien]    The Mathematics of Mutually Alien Copies
 *   [EssLgc]   On the Essential Logical Structure of IUT
 *   [FormIUT]  On the Formalization of IUT (2026-04)
 *   [ExpEst]   Explicit Estimates in IUT
 */
#ifndef IUT_H
#define IUT_H

#include <stddef.h>
#include <stdio.h>

/* ------------------------------------------------------------------ limits */
#define IUT_MAX_V        32   /* |V| = |Vmod|  (valuations tracked)            */
#define IUT_MAX_L        67   /* largest prime l supported                      */
#define IUT_MAX_LSTAR    33   /* l* = (l-1)/2  <= 33                           */
#define IUT_MAX_LPM      34   /* l± = (l+1)/2  <= 34                           */
#define IUT_MAX_NAME     24
#define IUT_MAX_ISSUES   64
#define IUT_LAT_N        9    /* lattice columns n in [-4, 4]                   */
#define IUT_LAT_M        13   /* lattice rows    m in [-6, 6]                   */
#define IUT_LAT_NOFF     4
#define IUT_LAT_MOFF     6

/* ---------------------------------------------------------------- rationals */
/* valuations of q-parameters, theta values, log-shell radii are rationals     */
typedef struct { long num, den; } iut_q;          /* num/den, den > 0 */
iut_q  iut_q_make(long num, long den);
iut_q  iut_q_add(iut_q a, iut_q b);
iut_q  iut_q_mul(iut_q a, iut_q b);
int    iut_q_cmp(iut_q a, iut_q b);
double iut_q_todouble(iut_q a);
void   iut_q_fmt(iut_q a, char *buf, size_t n);

/* ------------------------------------------------------------- identifiers */
/* Table row: a mathematical object/notation and its letters-only identifier. */
typedef struct {
    const char *id;        /* ^[A-Za-z]+$ , unique (case-insensitively)       */
    const char *notation;  /* the notation as printed in the papers (UTF-8)   */
    const char *kind;      /* "species", "label", "link", "symmetry", ...     */
    const char *ref;       /* where it is introduced / recalled                */
    const char *desc;      /* one-line description                            */
} iut_ident;

extern const iut_ident iut_idents[];
extern const size_t    iut_idents_count;

int  iut_ident_is_valid(const char *id);          /* letters only, non-empty  */
int  iut_ident_table_check(FILE *err);            /* 0 if all valid & unique  */
const iut_ident *iut_ident_find(const char *id);  /* NULL if missing          */
const iut_ident *iut_ident_by_notation(const char *notation);

/* -------------------------------------------------------- valuations v ∈ V */
/* Cf. [IUTchI] Def. 3.1; [Alien] §3.3 (i):  V ⊆ V(K) with V ≅ Vmod = V(Fmod). */
typedef enum { IUT_V_NONARCH = 0, IUT_V_ARCH = 1 } iut_vkind;
typedef enum { IUT_RED_GOOD = 0, IUT_RED_BAD_MULT = 1, IUT_RED_BAD_ADD = 2 } iut_reduction;

enum { IUT_KX_E = 1, IUT_KX_F = 2, IUT_KX_M = 4, IUT_KX_D = 8 };
typedef struct {
    char          name[IUT_MAX_NAME]; /* e.g. "v7", "vinf"                   */
    iut_vkind     kind;               /* Vnon or Varc                          */
    unsigned      p;                  /* residue characteristic p_v (0 if arc) */
    unsigned      e_mod, f_mod;       /* ram. index / res. degree of Fmod_v/Qp */
    unsigned      e_K,   f_K;         /* same for K_v / Q_p  (v ∈ V ⊆ V(K))    */
    int           e_K_lower;          /* e_K is only a lower bound: forced by q_v^{1/2l} ∈ K_v (bad mult.) and by the
                                         roots of unity √−1, μ_3, (μ_5,) μ_l ∈ K (p | 2·3·5·l); see gap LocalFieldsOfK */
    unsigned      m_K;                /* μ_{p^m} ⊆ K_v for m = m_K, as forced by Def 3.1: √−1 ∈ F (p = 2: m ≥ 2),
                                         E[3] ⊆ E(F) (p = 3: m ≥ 1), E[5] ⊆ E(F) (p = 5: m ≥ 1), E[l] ⊆ E(K) (p = l: m ≥ 1).
                                         A lower bound; enters μ_log(I_v) by [IUTchIV] Prop 1.4 (ii)                */
    int           K_exact;            /* which invariants of K_v/Q_p are exact values and not bounds: a mask of
                                         IUT_KX_E, IUT_KX_F, IUT_KX_M, IUT_KX_D, set by iut_local_field_K at the
                                         places where K_v can be written down (tame Tate-curve places, unramified
                                         good places); 0 elsewhere                                               */
    double        d_K;                /* exponent of the different of K_v/Q_p in units of ord(p) = 1; valid with IUT_KX_D */
    iut_reduction red;                /* reduction type of E at v              */
    unsigned      ordq;               /* ord_v(q_v) = -ord_v(j_E)  (bad mult.) */
    int           in_Vbad_mod;        /* v ∈ Vbad_mod: bad multiplicative, p odd and p ≠ l ([IUTchI] Def 3.1 (b), (c)).
                                         A place over 2 or over l where E is bad stays in V^good, which Def 3.1 (b)
                                         allows and [IUTchIV] Thm 1.10 expects ("good reduction away from 2l").   */
    /* the Tate parameter itself, when known (e.g. read from a JSON file):      */
    /* q_v = p^ordq · u with u ≡ q_unit mod p^q_prec  (q_prec = 0: unknown)     */
    unsigned long long q_unit;
    unsigned      q_prec;
} iut_valuation;

/* ------------------------------------------------- initial Θ-data (species) */
/* (F̄/F, X_F, l, C_K, V, Vbad_mod, ε)   [IUTchI] Def. 3.1; [Alien] §3.3 (i). */
typedef struct {
    char     name[96];
    /* number fields  Fmod ⊆ F ⊆ K = F(E[l]) ⊆ F̄ */
    unsigned dmod;        /* [Fmod : Q]    (Fmod = field of moduli = Q(j_E))  */
    unsigned long long dF; /* upper bound for [F : Q]                          */
    unsigned long long dK; /* upper bound for [K : Q]                          */
    double   logdF;       /* log(d^F): normalized degree of different of F/Q  */
    double   logdK;       /* log(d^K)                                         */
    /* the elliptic curve E_F — recorded through its arithmetic invariants    */
    char     curve[96];               /* description, e.g. "Frey(a,b,c)"      */
    double   j_log_height;            /* h(j_E) (Weil height of j), optional  */
    /* the prime l ≥ 5 and derived constants                                  */
    unsigned l;           /* prime l ≥ 5                                      */
    unsigned lstar;       /* l* = (l-1)/2                                     */
    unsigned lpm;         /* l± = (l+1)/2                                     */
    /* V ≅ Vmod                                                              */
    unsigned      nV;
    iut_valuation V[IUT_MAX_V];
    /* ε̲ (underlined epsilon) [IUTchI] Def 3.1 (f): a cusp of C̲_K that arises */
    /* from a NONZERO element of the quotient Q ≅ Z/lZ, recorded by its label  */
    /* in F_l^* = {1..l*}.  At v ∈ V^bad, ε̲_v must be the cusp of the canonical */
    /* generator ±1 of Z, so with V^bad ≠ ∅ the label is 1 (the cusp ±1).     */
    int      epsilon;
    /* hypotheses of [IUTchI] Def. 3.1 that cannot be machine-verified from   */
    /* the numeric data alone are recorded as asserted flags.                 */
    int h_F_galois_over_Fmod;        /* F/Fmod Galois, degree prime to l      */
    int h_F_contains_six_torsion;    /* F ⊇ fields of definition of E[2·3]    */
    int h_image_contains_SL2;        /* Im(Gal(K/F) → GL2(F_l)) ⊇ SL2(F_l)    */
    int h_stable_reduction;          /* E_F has stable reduction everywhere   */
    int h_CK_is_K_core;              /* C_K is a K-core                       */
    int h_F_contains_five_torsion;   /* F ⊇ field of definition of E[5]: F = F_mod(√−1, E[2·3·5]), the extra
                                        hypothesis of [IUTchIV] Thm 1.10 (not of Def 3.1); it forces l ≠ 5       */
    /* provenance: generated by the toolkit, or read from a JSON file of the  */
    /* schema iut-initial-theta-data/1 (docs/initial-theta-data/)              */
    int      from_json;
    char     source_id[48];               /* e.g. "frey-1-8-9"                */
    int      have_expected;               /* the JSON's own "derived" numbers  */
    double   expected_logq, expected_abslogq, expected_logcond, expected_ht;
} iut_initial_theta_data;

/* --------------------------------------------------------- label sets      */
/* F_l = {-l*,...,0,...,l*};  |F_l| = F_l/{±1} = {0,...,l*};  F_l^* = {1,...,l*} */
int iut_label_in_Fl(const iut_initial_theta_data *d, int t);
int iut_label_in_FlAbs(const iut_initial_theta_data *d, int j);
int iut_label_in_FlStar(const iut_initial_theta_data *d, int j);
/* F_l^{⋊±} = F_l ⋊ {±1} acting on F_l;  F_l^* = F_l^×/{±1} acting on F_l^* */
int iut_sym_FlSemiPm_act(const iut_initial_theta_data *d, int a, int sign, int t);
int iut_sym_FlStar_act(const iut_initial_theta_data *d, int u, int j);

/* -------------------------------------------------------- prime-strips     */
/* [IUTchI] Fig. I1.2 (recalled in [Pano] §3, [IUTchII] Def. 4.9, [IUTchIII] Def. 1.1) */
typedef enum {
    IUT_PS_D = 0,            /* D      {Π_v}                 holomorphic, étale-like   */
    IUT_PS_DMono,            /* D⊢     {G_v}                 mono-analytic, étale-like */
    IUT_PS_F,                /* F      {Π_v ↷ O▷_F̄v}         holomorphic, Frobenius-like */
    IUT_PS_FMono,            /* F⊢     {G_v ↷ O▷} split      mono-analytic, Frobenius-like */
    IUT_PS_FMonoUnits,       /* F⊢×    {G_v ↷ O×}                                         */
    IUT_PS_FMonoUnitsModTors,/* F⊢×μ   {G_v ↷ O×μ = O×/Oμ} + ×μ-Kummer structure (Ism-orbit) */
    IUT_PS_FMonoValUnitsModTors, /* F⊢▶×μ {G_v ↷ O▶ × O×μ}                               */
    IUT_PS_FMonoGlob,        /* F⊩     (C⊩, Prime(C⊩)→V, F⊢, {ρ_v})  + global realified Frobenioid */
    IUT_PS_FMonoGlobValUnitsModTors, /* F⊩▶×μ (C⊩, F⊢▶×μ, {ρ_v})  like F⊩ with F⊢▶×μ; carries a pilot object */
    IUT_PS_KIND_COUNT
} iut_ps_kind;

const char *iut_ps_kind_id(iut_ps_kind k);        /* letters-only identifier */
const char *iut_ps_kind_notation(iut_ps_kind k);  /* "F⊢×μ" etc.              */
int iut_ps_kind_is_etale_like(iut_ps_kind k);     /* D, D⊢                    */
int iut_ps_kind_is_mono_analytic(iut_ps_kind k);  /* has ⊢ or ⊩               */
int iut_ps_kind_has_global(iut_ps_kind k);        /* ⊩                        */

/* Local datum at v of a prime-strip. Numbers are valuations measured in     */
/* units of ord_v(q̲_v) where q̲_v = q_v^{1/2l}  (so q_v itself has value 2l). */
typedef struct {
    /* étale-like portion */
    unsigned Pi_copy;      /* copy/basepoint id of Π_v (0 = absent)            */
    unsigned G_copy;       /* copy id of G_v (quotient Π_v ↠ G_v)              */
    /* Frobenius-like portion                                                 */
    unsigned units_copy;   /* copy id of O× / O×μ (0 = absent)                 */
    int      units_mod_tors;    /* O×μ (1) rather than O× (0)                  */
    int      has_valgroup;      /* O▶ value-group portion present              */
    int      has_splitting;     /* split Frobenioid: O▷ = O× × O▶ splitting     */
    unsigned nval;              /* generators of the value-group monoid(s)     */
    iut_q    val[IUT_MAX_LSTAR+1]; /* valuations of generators (q̲-units)      */
    /* Kummer structure on units: Ẑ×-orbit (×) or Ism-orbit (×μ)              */
    int      kummer_kind;       /* 0 none, 1 ×-Kummer (unique), 2 ×μ-Kummer    */
} iut_local_datum;

typedef struct {
    iut_ps_kind kind;
    char        label[IUT_MAX_NAME];  /* e.g. "t=-3", "j=2", "BoxPlus", "Gt", "Triangle" */
    unsigned    nV;
    iut_local_datum loc[IUT_MAX_V];
    /* global portion for ⊩ kinds: realified Frobenioid C⊩ with Prime(C⊩)→V   */
    int         has_global_realified;
    double      global_degree;        /* arithmetic degree of the pilot object (≤0) */
} iut_prime_strip;

/* ------------------------------------------------------ pilot objects      */
/* [IUTchIII] Def. 3.8 (i): q-pilot = object of C⊩ determined by {q̲_v}_{v∈Vbad};
 * Θ-pilot = object determined by {q̲_v^{j²}}_{j=1..l*}, v ∈ Vbad.             */
typedef enum { IUT_PILOT_Q = 0, IUT_PILOT_THETA = 1 } iut_pilot_kind;
typedef struct {
    iut_pilot_kind kind;
    unsigned nj;                       /* 1 for q-pilot, l* for Θ-pilot        */
    unsigned exps[IUT_MAX_LSTAR+1];    /* exponents of q̲: {1} or {1,4,9,...}   */
    double   log_volume;               /* −|log(q)| or (upper bound for) −|log(Θ)| */
} iut_pilot;

/* ------------------------------------------------------ log-shells         */
/* [IUTchIII] Def. 1.1 (i): I_v = (p*_v)^{-1} · log(O×_{K_v}) ⊆ K_v,          */
/* p* = p (p odd), p* = p² (p = 2).   [AbsTopIII] Def. 5.4 (iii).             */
typedef struct {
    unsigned v_index;          /* index into V                                 */
    unsigned pstar;            /* p or p² (0 for archimedean: I = π-disc)      */
    iut_q    radius;           /* p-adic valuation of the generator of I_v     */
    double   log_volume;       /* normalized log-volume of I_v ([IUTchIV] Prop 1.2/1.4) */
    int      holomorphic;      /* 1: from F-prime-strip, 0: mono-analytic (F⊢×μ / D⊢) */
    int      etale_like;       /* 1: constructed from D/D⊢, 0: Frobenius-like  */
    int      lattice_n, lattice_m;  /* which (n,m) the units came from         */
} iut_log_shell;

/* ----------------------------------------------- Hodge theaters (species)  */
/* Θ±ell NF-Hodge theater = Θ±ell-Hodge theater glued to ΘNF-Hodge theater    */
/* along  F_l ⊇ F_l^× ↠ F_l^*  ("0, ⊞ ↦ >").  [IUTchI] §I1, Def. 6.13;        */
/* [Pano] §3 Fig. 3.3; [Alien] §3.3 (v) Fig. 3.8; [IUTchII] Rem. 3.8.2.        */

typedef struct {               /* one member of a capsule, labeled by t or j   */
    int      label;            /* t ∈ F_l  or  j ∈ F_l^*                        */
    unsigned basepoint;        /* distinct copy id (conjugate synchronization) */
} iut_capsule_member;

typedef struct {               /* Θ-Hodge theater  [IUTchI] Def. 3.6            */
    iut_prime_strip FMonoGlobMod;   /* F⊩_mod  (q-parameters  q̲_v)              */
    iut_prime_strip FMonoGlobTht;   /* F⊩_tht  (theta function Θ̲_v)             */
    iut_q    theta_value[IUT_MAX_LSTAR+1]; /* Θ̲_v evaluated at label j: j²·ord(q̲) */
} iut_theta_hodge_theater;

typedef struct {               /* Θ±ell-Hodge theater  [IUTchI] §6              */
    unsigned nT;                                    /* 2l*+1 = l                */
    iut_capsule_member T[2*IUT_MAX_LSTAR+1];        /* capsule F_T, t ∈ F_l     */
    iut_prime_strip FBoxPlus;   /* F_⊞ : target of the Θ±-bridge               */
    iut_prime_strip DCircDotPm; /* D_⊚± : target of the Θell-bridge (Π_{X_K})  */
    int      theta_pm_bridge_ok, theta_ell_bridge_ok;
} iut_theta_pm_ell_hodge_theater;

typedef struct {               /* ΘNF-Hodge theater  [IUTchI] §4, §5            */
    unsigned nJ;                                    /* l*                       */
    iut_capsule_member J[IUT_MAX_LSTAR+1];          /* capsule F_J, j ∈ F_l^*   */
    iut_prime_strip FGt;        /* F_> : target of the Θ-bridge                */
    iut_prime_strip FCircAst;   /* F_⊛ : target of the NF-bridge (Π_{C_K}, F_mod^×) */
    iut_theta_hodge_theater tht;
    int      theta_bridge_ok, nf_bridge_ok;
} iut_theta_nf_hodge_theater;

typedef struct {
    /* position in the log-theta-lattice and "alien copy" labels             */
    int      n, m;                 /* coordinates (n = column, m = row)       */
    char     copy_label[32];       /* "Dag", "Ddag", "NMnm" (letters-only)    */
    unsigned universe;             /* distinct label/universe id, [IUTchIV] §3 */
    const iut_initial_theta_data *data;
    iut_theta_pm_ell_hodge_theater pmell;
    iut_theta_nf_hodge_theater     nf;
    int      glued;                /* gluing 0,⊞ ↦ > performed                 */
    /* data constructed in [IUTchII] Cor. 4.10 / [IUTchIII] Def. 3.8           */
    iut_prime_strip FMonoGlobTriangle;  /* F⊩_Δ : labels 0 and F_l^* identified (constant) */
    iut_prime_strip FMonoGlobEnv;       /* F⊩_env (theta monoids)              */
    iut_prime_strip FMonoGlobGau;       /* F⊩_gau (Gaussian monoids)           */
    iut_prime_strip FMonoGlobLGP;       /* F⊩_LGP (log-Gaussian procession, MOD) */
    iut_prime_strip FMonoGlobLgp;       /* F⊩_lgp (local fractional ideal, mod) */
    iut_pilot        q_pilot;           /* in F⊩_Δ                               */
    iut_pilot        theta_pilot;       /* in F⊩_gau / F⊩_LGP                    */
    /* log-shells at this lattice point (constructed by the log-link INTO it) */
    unsigned      nshell;
    iut_log_shell shell[IUT_MAX_V];
    int           has_incoming_log;     /* this • is the codomain of a log-link */
    /* Frobenius-like "state": how many log-links applied along the column   */
    int           log_iterate;
} iut_hodge_theater;

/* -------------------------------------------------------------- links      */
typedef enum {
    IUT_LINK_THETA = 0,              /* Θ-link        [IUTchI]  Cor. 3.7      */
    IUT_LINK_THETA_UNITSMODTORS,     /* Θ×μ-link      [IUTchII] Cor. 4.10     */
    IUT_LINK_THETA_UNITSMODTORS_GAU, /* Θ×μ_gau-link  [IUTchII] Cor. 4.10     */
    IUT_LINK_THETA_UNITSMODTORS_LGP, /* Θ×μ_LGP-link  [IUTchIII] Def. 3.8     */
    IUT_LINK_THETA_UNITSMODTORS_LGPIDEAL, /* Θ×μ_lgp-link [IUTchIII] Def. 3.8 */
    IUT_LINK_LOG,                    /* log-link      [IUTchIII] Def. 1.1, Prop 1.3 */
    IUT_LINK_D_THETA_PMELL_NF,       /* D-Θ±ell NF-link (étale picture)       */
    IUT_LINK_KIND_COUNT
} iut_link_kind;
const char *iut_link_kind_id(iut_link_kind k);
const char *iut_link_kind_notation(iut_link_kind k);

typedef struct {
    iut_link_kind kind;
    int dom_n, dom_m, cod_n, cod_m;
    iut_ps_kind glued_kind;        /* kind of prime-strip glued (F⊩, F⊩▶×μ, ...) */
    int full_poly_isomorphism;     /* gluing is a FULL poly-isomorphism         */
    /* what is preserved ("coric") and what is dilated ("mutated")             */
    int preserves_Pi;              /* Π_v identified (log-link: yes; Θ: no)      */
    int preserves_G;               /* G_v identified up to indeterminate iso     */
    int preserves_units_mod_tors;  /* O×μ identified (Θ×μ..: yes)                */
    int preserves_ring_structure;  /* never                                      */
    double dilation;               /* value-group dilation factor (Θ: avg j²)    */
} iut_link;

/* ------------------------------------------------- indeterminacies         */
/* [IUTchIII] Thm. 3.11; [Alien] §3.7 (i); [EssLgc] §3.10 (Stp1)-(Stp3)        */
typedef struct {
    int ind1;   /* automorphisms of processions of D⊢-prime-strips (perms of S±_{j+1}, Aut(G_v)) */
    int ind2;   /* Ism / Ẑ×-indeterminacies on O×μ (Kummer-detachment)           */
    int ind3;   /* upper semi-compatibility of the log-Kummer correspondence     */
} iut_indeterminacies;

/* --------------------------------------- processions and tensor packets    */
/* S±_{j+1} = {0,1,...,j}  for j = 0..l*;   [IUTchI] Prop. 6.9; [IUTchIII] §3  */
typedef struct {
    unsigned j;                /* container S±_{j+1} holds labels 0..j          */
    unsigned size;             /* j+1                                           */
    unsigned perms;            /* (j+1)!  possibilities for the element "j"     */
    double   log_volume_leading; /* (j+1)·log(d^K)  leading term per [Alien] §3.7 (iv) */
    double   theta_shift;        /* −(j²/2l)·log(q)                              */
} iut_procession_step;

/* ----------------------------------------- multiradial representation      */
/* R^LGP_{n,◦} = (a) tensor packets of log-shells, (b) splitting monoids of   */
/* LGP-monoids, (c) copies (F_mod^×)_j  — up to (Ind1),(Ind2),(Ind3).          */
typedef struct {
    int      n;                               /* column (n,◦)                  */
    unsigned nsteps;
    iut_procession_step step[IUT_MAX_LPM];
    iut_indeterminacies ind;
    double   logq;              /* log(q)  normalized degree of q-divisor       */
    double   abs_log_q;         /* |log(q)| = log(q)/(2l)                       */
    double   theta_upper_bound; /* −|log(Θ)| upper bound, leading-term version  */
    double   leading_term;      /* (l²/48)(6 log d^K − log q) (×constant)       */
    double   C_theta;           /* C_Θ of [IUTchIV] Thm 1.10                    */
    int      inequality_holds;  /* −|log Θ| ≥ −|log q|  i.e. C_Θ ≥ −1           */
    double   hull_enlargement;  /* log-volume added by the holomorphic hull     */
    /* the upper bound of [IUTchIV] Thm 1.10, proof Steps (v)–(vii), summed over v_Q (iut_hull_bound_compute) */
    double   theta_hull_bound;  /* B with −|log(Θ)| ≤ B: every term of the proof, not only the leading ones */
    double   C_theta_local;     /* B/|log q|: an admissible C_Θ computed from the places of this curve     */
} iut_multiradial_rep;

/* ------------------------------------------------- log-theta-lattice       */
/* [IUTchIII] Def. 1.4, Def. 3.8 (iii); Fig. I.1.  Vertices • = Θ±ell NF-HTs, */
/* vertical arrows = log-links, horizontal arrows = Θ(×μ,gau,LGP,lgp)-links.  */
typedef struct {
    iut_initial_theta_data data;
    iut_link_kind horizontal;          /* which Θ-link version                 */
    iut_hodge_theater *ht[IUT_LAT_N][IUT_LAT_M];   /* lazily created           */
    unsigned next_universe;
    unsigned nlinks;
    iut_link links[IUT_LAT_N*IUT_LAT_M*2 + 8];
    /* the "infinite H" actually used: columns 0 and 1, single Θ-link (0,0)→(1,0) */
    int focus_n, focus_m;
} iut_log_theta_lattice;

/* ------------------------------------------- species / mutations (IUTchIV) */
typedef struct {
    const char *id;        /* letters-only                                     */
    const char *name;
    const char *ref;
    const char *species_data; /* informal description of the set-theoretic formula Φ0 */
} iut_species;
typedef struct {
    const char *id;
    const char *name;
    const char *dom, *cod; /* species ids                                      */
    const char *ref;
    int is_core;           /* observable all of whose Ve are isomorphisms      */
} iut_mutation;
extern const iut_species  iut_species_table[];
extern const size_t       iut_species_count;
extern const iut_mutation iut_mutation_table[];
extern const size_t       iut_mutation_count;

/* ------------------------------------------------------------ validation   */
typedef enum { IUT_SEV_OK = 0, IUT_SEV_INFO, IUT_SEV_WARN, IUT_SEV_ERROR } iut_severity;
typedef struct {
    iut_severity sev;
    char condition[IUT_MAX_NAME*2]; /* identifier of the condition checked    */
    char msg[160];
    char ref[48];
} iut_issue;
typedef struct {
    unsigned n;
    iut_issue issue[IUT_MAX_ISSUES];
    unsigned errors, warnings;
} iut_report;
void iut_report_add(iut_report *r, iut_severity s, const char *cond, const char *ref, const char *fmt, ...);

/* ------------------------------------------------------------- generators  */
/* Frey curve  y² = x(x−a)(x+b) of an abc triple, Fmod = Q.  [ExpEst] Thm A/B */
int  iut_gen_from_abc(iut_initial_theta_data *d, long long a, long long b, long long c, unsigned l);
/* pseudo-random but valid-looking initial Θ-data from a seed                 */
int  iut_gen_random(iut_initial_theta_data *d, unsigned seed);
/* a tiny hand-made example with explicit valuations                          */
int  iut_gen_example(iut_initial_theta_data *d, int which);
void iut_data_finish(iut_initial_theta_data *d);
unsigned iut_eK_min(unsigned l, unsigned ordq);   /* 2l/gcd(2l, ord q_v): the least e(K_v/(F_mod)_v) with q_v^{1/2l} ∈ K_v */  /* derive l*, l±, flags       */

/* ------------------------------------------------------------- validators  */
int  iut_validate_data(const iut_initial_theta_data *d, iut_report *r);
int  iut_validate_prime_strip(const iut_prime_strip *ps, const iut_initial_theta_data *d, iut_report *r);
int  iut_validate_hodge_theater(const iut_hodge_theater *ht, iut_report *r);
int  iut_validate_link(const iut_link *lk, const iut_log_theta_lattice *lat, iut_report *r);
int  iut_validate_lattice(const iut_log_theta_lattice *lat, iut_report *r);

/* ----------------------------------------------------------- constructors  */
void iut_prime_strip_build(iut_prime_strip *ps, iut_ps_kind kind, const char *label,
                           const iut_initial_theta_data *d, unsigned copy_base,
                           const unsigned *theta_exps, unsigned ntheta);
void iut_prime_strip_forget(iut_prime_strip *dst, const iut_prime_strip *src, iut_ps_kind to);
iut_hodge_theater *iut_hodge_theater_new(const iut_initial_theta_data *d, int n, int m, unsigned *universe_ctr);
void iut_hodge_theater_free(iut_hodge_theater *ht);
void iut_hodge_theater_glue(iut_hodge_theater *ht);    /* 0,⊞ ↦ >                */

/* ------------------------------------------------------------- lattice ops */
void iut_lattice_init(iut_log_theta_lattice *lat, const iut_initial_theta_data *d, iut_link_kind horizontal);
void iut_lattice_free(iut_log_theta_lattice *lat);
iut_hodge_theater *iut_lattice_get(iut_log_theta_lattice *lat, int n, int m); /* create if needed */
int  iut_lattice_in_range(int n, int m);
/* apply a log-link (n,m) → (n,m+1): returns the link, builds log-shells at (n,m+1) */
const iut_link *iut_apply_log_link(iut_log_theta_lattice *lat, int n, int m);
/* apply the horizontal Θ-link (n,m) → (n+1,m)                                 */
const iut_link *iut_apply_theta_link(iut_log_theta_lattice *lat, int n, int m);
/* build the "infinite H" portion: columns n and n+1, rows mmin..mmax          */
void iut_lattice_build_H(iut_log_theta_lattice *lat, int n, int mmin, int mmax);
/* multiradial representation of the Θ-pilot of column n, with log-volume     */
void iut_multiradial_build(const iut_log_theta_lattice *lat, int n, iut_multiradial_rep *out);
/* coricity queries */
int  iut_vertically_coric(iut_ps_kind k);   /* D, D⊢ (étale-like), log-shells (étale-like) */
int  iut_horizontally_coric(iut_ps_kind k); /* F⊢×μ, D⊢                              */
int  iut_bi_coric(iut_ps_kind k);           /* D⊢ (and mono-analytic log-shells)      */

/* ------------------------------------------------------------- arithmetic  */
double iut_log_q(const iut_initial_theta_data *d);        /* log(q): over V^bad_mod only ([IUTchIV] Thm 1.10, Rem 1.10.6 (i)) */
double iut_log_q_all(const iut_initial_theta_data *d);    /* log(q∀): every v of bad multiplicative reduction, 2 included ([IUTchIV] Cor 2.2) */
double iut_log_cond(const iut_initial_theta_data *d);     /* log-conductor over EVERY bad v (2 and additive places included); NOT the f of Thm 1.10 */
double iut_log_cond_bad(const iut_initial_theta_data *d); /* log(f^F) of [IUTchIV] Thm 1.10: Σ_{v ∈ V^bad_mod} f_v log p_v, the support of the q-divisor */
double iut_height_from_q(const iut_initial_theta_data *d);/* ht = (1/6) log(q) */
double iut_log_shell_volume(const iut_valuation *v, unsigned dK);
double iut_C_theta(const iut_initial_theta_data *d, double logdK, double logfK);
double iut_leading_term(const iut_initial_theta_data *d);

/* --------------------------------------------------------------- output    */
void iut_json_data(FILE *f, const iut_initial_theta_data *d);
void iut_json_prime_strip(FILE *f, const iut_prime_strip *ps, int indent);
void iut_json_hodge_theater(FILE *f, const iut_hodge_theater *ht, int indent);
void iut_json_lattice(FILE *f, const iut_log_theta_lattice *lat);
void iut_json_report(FILE *f, const iut_report *r);
void iut_json_idents(FILE *f);
void iut_js_idents(FILE *f);       /* JS module for htdocs/                  */
void iut_md_idents(FILE *f);       /* Markdown table for docs/               */
void iut_md_species(FILE *f);

/* --------------------------------------------------------------- utility   */
int  iut_is_prime(unsigned n);
unsigned long long iut_factorial(unsigned n);
int  iut_selftest(FILE *out);      /* returns number of failures               */

/* --------------------------------------------------------------- views     */
/* Plain-text renderers shared by the CLI and the TUI (iut_view.c).           */
void iut_view_data(FILE *f, const iut_initial_theta_data *d);
void iut_view_report(FILE *f, const iut_report *r);
void iut_view_prime_strip(FILE *f, const iut_prime_strip *ps, const iut_initial_theta_data *d);
void iut_view_hodge_theater(FILE *f, const iut_hodge_theater *ht);
void iut_view_lattice(FILE *f, const iut_log_theta_lattice *lat);
void iut_view_alien(FILE *f, const iut_log_theta_lattice *lat, int n, int m);
void iut_view_multiradial(FILE *f, const iut_multiradial_rep *rep, const iut_initial_theta_data *d);
void iut_view_etale_picture(FILE *f, const iut_log_theta_lattice *lat);
void iut_view_species(FILE *f);
void iut_view_idents(FILE *f, const char *filter);

/* ------------------------------------------- initial Θ-data from JSON     */
/* iut_input.c: reads a file of the schema "iut-initial-theta-data/1" (the    */
/* worked examples in docs/initial-theta-data/) into the data type.  Returns  */
/* 0, or nonzero with a message in err.                                       */
int  iut_data_from_json_text(iut_initial_theta_data *d, const char *text, char *err, size_t errn);
int  iut_data_from_json_file(iut_initial_theta_data *d, const char *path, char *err, size_t errn);
/* q_v^k mod p^prec for the unit part u of q_v (needs q_prec > 0)             */
unsigned long long iut_tate_unit_pow(const iut_valuation *v, unsigned long long k);
unsigned long long iut_pow_ull(unsigned long long b, unsigned e);


/* ------------------------------------------------ gaps and placeholders    */
/* iut_gaps.c: the register of everything the papers specify that this       */
/* toolkit does not (yet) compute, computes only approximately, or takes as  */
/* an asserted input.  Each entry is a PLACEHOLDER with the paper reference,  */
/* what the code does instead, where, and the fix that is prepared.  The      */
/* pipeline prints the entries of each stage; `iut gaps` lists them all;      */
/* docs/GAPS.md is generated from this table.  In the sources, the statement  */
/* IUT_GAP("Id") marks every place an entry refers to (make check verifies    */
/* that the marks and the table agree).                                       */
#define IUT_GAP(id) ((void)0)
typedef enum {
    IUT_GAP_OPEN = 0,      /* not computed at all: a placeholder stands in             */
    IUT_GAP_APPROX,        /* computed from bounds / estimates, labelled as such       */
    IUT_GAP_ASSERTED,      /* taken as an input (flag, constant or theorem), not checked */
    IUT_GAP_FIXED          /* was a gap or a mistake; closed, kept for the record      */
} iut_gap_status;
typedef struct {
    const char *id;        /* letters only, unique                                     */
    int stage;             /* pipeline stage 0–7, or −1 for the toolkit as a whole     */
    iut_gap_status status;
    const char *ref;       /* where the papers specify the thing                       */
    const char *title;
    const char *paper;     /* what the papers specify                                  */
    const char *code;      /* what the toolkit does instead                            */
    const char *where;     /* file: function(s)                                        */
    const char *plan;      /* the fix: done, or prepared                               */
} iut_gap;
extern const iut_gap iut_gaps[];
extern const size_t  iut_gaps_count;
const char *iut_gap_status_name(iut_gap_status s);
const iut_gap *iut_gap_find(const char *id);
unsigned iut_gaps_open_in_stage(int stage);               /* entries of that stage that are not FIXED */
void iut_view_gaps(FILE *f, const char *filter);          /* `iut gaps`           */
void iut_view_gaps_stage(FILE *f, int stage);             /* the lines `iut pipeline` prints under a stage */
void iut_md_gaps(FILE *f);                                /* docs/GAPS.md         */
void iut_json_gaps(FILE *f, int stage);                   /* JSON array; stage < −1: all */
/* a placeholder that stands for a computation which is not implemented: returns this */
#define IUT_NOT_IMPLEMENTED (-77)

/* ----------------------- the hull bound of [IUTchIV] Thm 1.10, Steps (iv)–(viii) */
/* An upper bound B for −|log(Θ)|, the procession-normalized mono-analytic     */
/* log-volume of the holomorphic hull of the union of possible images of a     */
/* Θ-pilot, computed place by place exactly as in the proof:                   */
/*   v_Q ∈ V^dst_Q (p | 2·3·5·l, or in the support of q or of the different):  */
/*     ((l+5)/4)·log(d^K_vQ) − ((l+1)/24)·log(q_vQ) + log(s^Q_vQ) + (l+5)·l*_mod·log(s^≤_vQ)   (Step (v))  */
/*   v_Q nonarchimedean, not distinguished:  0                                  (Step (vi)) */
/*   v_Q archimedean:  ((l+5)/4)·log π                                          (Step (vii)) */
/* with l*_mod = log(e*_mod·l), log(s^Q_vQ) = log p, log(s^≤_vQ) = 1 if p ≤ e*_mod·l, else 0. */
typedef struct {
    unsigned p;            /* the prime under v_Q (0: archimedean)                          */
    int      kind;         /* 0 distinguished, 1 nonarchimedean not distinguished, 2 archimedean */
    const char *why;       /* why it is distinguished                                       */
    double   logdK;        /* the upper bound used for log(d^K_vQ)                          */
    const char *logdK_src; /* where that bound comes from (Step (ii), Prop 1.3)             */
    double   logq;         /* log(q_vQ)                                                     */
    double   logs;         /* log(s^Q_vQ) = log p                                           */
    int      iota;         /* ι_vQ                                                          */
    double   bound;        /* the procession-normalized upper bound at v_Q                  */
} iut_hull_row;
typedef struct {
    unsigned nrows;
    iut_hull_row row[IUT_MAX_V + 6];
    double   lstar_mod;                  /* l*_mod = log(e*_mod·l)                           */
    double   per_j[IUT_MAX_LPM];         /* the bound before averaging, for j = 1..l* (index j) */
    double   unlocalized_logd;           /* ((l+5)/4)·log(d^Ftpd) when its support is unknown   */
    double   total;                      /* B                                                */
    double   abs_logq;
    double   C_theta_local;              /* B/|log q|                                        */
    double   C_theta_formula;            /* the C_Θ of the statement of Thm 1.10             */
    int      below_formula;              /* C_theta_local ≤ C_theta_formula, as the proof says  */
    int      consequence_holds;          /* B ≥ −|log q|, the consequence of Cor 3.12        */
    int      complete;                   /* 0: the support of d^Ftpd is not in the data model (gap DifferentSupport) */
} iut_hull_bound;
void iut_hull_bound_compute(const iut_initial_theta_data *d, iut_hull_bound *out);

/* [IUTchIV] Cor 2.2, proof, (P1)–(P3): the primes l the proof may choose for a curve.
 * Returns the smallest prime l ≥ max(7, (log q∀)^{1/2}) that divides no ord(q_v) and is ≤ IUT_MAX_L, or 0. */
unsigned iut_choose_l(const iut_initial_theta_data *d, int *in_window);

/* ------------------------------------------------------------ pipeline     */
/* iut_pipeline.c: the whole run, initial Θ-data → [IUTchI] Hodge theaters →  */
/* [IUTchII] Gaussian monoids → [IUTchIII] log-theta-lattice, multiradial    */
/* representation, Cor 3.12 → [IUTchIV] Thm 1.10, with the state of each stage. */
int  iut_pipeline_run(FILE *f, const iut_initial_theta_data *d, int rows, iut_link_kind horizontal, int json);

/* option parsing shared by CLI and TUI */
typedef struct {
    long long a, b, c; unsigned l; int example; unsigned seed; int have_abc, have_example, have_seed;
    iut_link_kind horizontal; int rows; int json;
    const char *theta_json; int have_theta_json;   /* --theta-json FILE (or inline JSON text starting with '{') */
    int auto_l;                                    /* --l auto: choose l as in the proof of [IUTchIV] Cor 2.2 (iut_choose_l) */
} iut_options;
void iut_options_default(iut_options *o);
int  iut_options_parse(iut_options *o, int argc, char **argv, FILE *err);
int  iut_options_make_data(const iut_options *o, iut_initial_theta_data *d, FILE *err);
int  iut_tui_main(const iut_options *o);

#endif /* IUT_H */
