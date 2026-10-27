/*
 * iut_i.c — the data types of [IUTchI] §0–§6, read from the paper itself
 * (pdf/Inter-universal Teichmuller Theory I.pdf).  See iut_i.h for the map.
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "iut_ops.h"

/* ================================================================== §0 ==== */
static const iut_pseudo_monoid psm_table[IUT_PSM_COUNT] = {
    /* kind, id, notation, ref, topological, divisible, cyclotomic, is_group, kummer_ready, etale_like */
    { IUT_PSM_MCIRCAST,                "MCircAst",              "M^⊛(†D^⊛)",  "[IUTchI] Ex 5.1 (i); Rem 5.1.3", 1, 1, 1, 1, 1, 1 },
    { IUT_PSM_MCIRCAST_MOD,            "MCircAstMod",           "M^⊛_mod",    "[IUTchI] Ex 5.1 (i); Rem 5.1.3", 1, 0, 0, 1, 0, 1 },
    { IUT_PSM_MCIRCAST_SOL,            "MCircAstSol",           "M^⊛_sol",    "[IUTchI] Ex 5.1 (i); Rem 5.1.3", 1, 0, 1, 1, 1, 1 },
    { IUT_PSM_MCIRCAST_KAPPA,          "MCircAstKappa",         "M^⊛_κ",      "[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3", 1, 0, 0, 0, 0, 1 },
    { IUT_PSM_MCIRCAST_INFKAPPA,       "MCircAstInfKappa",      "M^⊛_∞κ",     "[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3", 1, 1, 1, 0, 1, 1 },
    { IUT_PSM_MCIRCAST_INFKAPPA_UNITS, "MCircAstInfKappaUnits", "M^⊛_∞κ×",    "[IUTchI] Ex 5.1 (i); Rem 3.1.7; Rem 5.1.3", 1, 1, 1, 0, 1, 1 },
    { IUT_PSM_MCIRCAST_KAPPA_SOL,      "MCircAstKappaSol",      "M^⊛_κ-sol",  "[IUTchI] Ex 5.1 (i); Rem 3.1.7 (iii); Rem 5.1.3", 1, 0, 0, 0, 1, 1 },
    { IUT_PSM_MV,                      "MV",                    "M_v(‡D_v)",  "[IUTchI] Def 5.2 (v)", 1, 1, 1, 0, 1, 1 },
    { IUT_PSM_MKAPPA_V,                "MKappaV",               "M_κv",       "[IUTchI] Def 5.2 (vi)", 1, 0, 0, 0, 0, 1 },
    { IUT_PSM_MINFKAPPA_V,             "MInfKappaV",            "M_∞κv",      "[IUTchI] Def 5.2 (vi)", 1, 1, 1, 0, 1, 1 },
    { IUT_PSM_MINFKAPPA_UNITS_V,       "MInfKappaUnitsV",       "M_∞κ×v",     "[IUTchI] Def 5.2 (vi)", 1, 1, 1, 0, 1, 1 },
};
void iut_pseudo_monoid_get(iut_pseudo_monoid_kind k, iut_pseudo_monoid *out)
{
    if ((unsigned)k < IUT_PSM_COUNT) *out = psm_table[k]; else memset(out, 0, sizeof *out);
}
int iut_pseudo_monoid_contains(iut_pseudo_monoid_kind big, iut_pseudo_monoid_kind small)
{
    /* [IUTchI] Ex 5.1 (i): M^⊛_mod ⊆ M^⊛_sol ⊆ M^⊛;  M^⊛_κ ⊆ M^⊛_∞κ ⊆ M^⊛_∞κ× ⊆ M^⊛(…)^{∞};  M^⊛_κ ⊆ M^⊛_κ-sol ⊆ M^⊛_sol-ish */
    if (big == small) return 1;
    switch (big) {
    case IUT_PSM_MCIRCAST:   return small == IUT_PSM_MCIRCAST_MOD || small == IUT_PSM_MCIRCAST_SOL;
    case IUT_PSM_MCIRCAST_SOL: return small == IUT_PSM_MCIRCAST_MOD;
    case IUT_PSM_MCIRCAST_INFKAPPA_UNITS: return small == IUT_PSM_MCIRCAST_INFKAPPA || small == IUT_PSM_MCIRCAST_KAPPA;
    case IUT_PSM_MCIRCAST_INFKAPPA: return small == IUT_PSM_MCIRCAST_KAPPA;
    case IUT_PSM_MCIRCAST_KAPPA_SOL: return small == IUT_PSM_MCIRCAST_KAPPA;
    case IUT_PSM_MINFKAPPA_UNITS_V: return small == IUT_PSM_MINFKAPPA_V || small == IUT_PSM_MKAPPA_V;
    case IUT_PSM_MINFKAPPA_V: return small == IUT_PSM_MKAPPA_V;
    default: return 0;
    }
}

static const char *poly_ids[IUT_POLY_COUNT] = { "PolyMorphism", "PolyIsomorphism", "FullPolyIsomorphism", "PlusFullPolyIsomorphism", "CapsuleFullPolyMorphism", "CapsuleFullPolyIsomorphism" };
const char *iut_poly_kind_id(iut_poly_kind k) { return (unsigned)k < IUT_POLY_COUNT ? poly_ids[k] : "?"; }
void iut_poly_make(iut_poly_kind k, unsigned long long count, iut_poly_morphism *out)
{
    memset(out, 0, sizeof *out);
    out->kind = k; out->ref = "[IUTchI] §0";
    out->count = (k == IUT_POLY_FULL_ISOMORPHISM || k == IUT_POLY_CAPSULE_FULL_ISOMORPHISM || k == IUT_POLY_CAPSULE_FULL_MORPHISM) ? 0 : count;
    out->index_bijective = (k == IUT_POLY_CAPSULE_FULL_ISOMORPHISM);
    if (k == IUT_POLY_PLUS_FULL_ISOMORPHISM) out->ref = "[IUTchI] Def 6.1 (iv)";
}
int iut_poly_compose(const iut_poly_morphism *second, const iut_poly_morphism *first, iut_poly_morphism *out)
{
    /* [IUTchI] §0: the composite is the set {g∘f}, multiplicities forgotten; full∘full = full,
     * full ∘ (anything) = full when the target is a full poly-isomorphism.               */
    memset(out, 0, sizeof *out);
    out->ref = "[IUTchI] §0 (composite of poly-morphisms)";
    int iso = (first->kind != IUT_POLY_MORPHISM && first->kind != IUT_POLY_CAPSULE_FULL_MORPHISM) && (second->kind != IUT_POLY_MORPHISM && second->kind != IUT_POLY_CAPSULE_FULL_MORPHISM);
    if (first->kind == IUT_POLY_FULL_ISOMORPHISM || second->kind == IUT_POLY_FULL_ISOMORPHISM) { out->kind = IUT_POLY_FULL_ISOMORPHISM; out->count = 0; return 1; }
    out->kind = iso ? IUT_POLY_ISOMORPHISM : IUT_POLY_MORPHISM;
    out->count = (first->count && second->count) ? first->count * second->count : 0;   /* an upper bound: multiplicities are ignored */
    return 1;
}
void iut_poly_plus_full_make(const iut_initial_theta_data *d, const int *alpha, iut_poly_morphism *out)
{
    iut_poly_make(IUT_POLY_PLUS_FULL_ISOMORPHISM, 0, out);
    out->nV = d->nV;
    for (unsigned i = 0; i < d->nV; ++i) out->sign[i] = alpha ? (alpha[i] < 0 ? -1 : 1) : 1;
}
int iut_poly_plus_full_is_positive(const iut_poly_morphism *p) { for (unsigned i = 0; i < p->nV; ++i) if (p->sign[i] < 0) return 0; return p->kind == IUT_POLY_PLUS_FULL_ISOMORPHISM; }
int iut_poly_plus_full_is_negative(const iut_poly_morphism *p) { for (unsigned i = 0; i < p->nV; ++i) if (p->sign[i] > 0) return 0; return p->kind == IUT_POLY_PLUS_FULL_ISOMORPHISM; }

void iut_anabelioid_make(iut_anabelioid_kind k, const char *of, iut_anabelioid *out)
{
    static const struct { const char *id, *notation; int connected, tempered; } t[IUT_ANAB_COUNT] = {
        { "BPi",   "B(Π)",        1, 0 }, { "BX", "B(X)", 0, 0 }, { "BXZero", "B(X)^0", 1, 0 }, { "BTemp", "B^temp(Π)", 1, 1 } };
    memset(out, 0, sizeof *out);
    out->kind = k; out->of = of;
    if ((unsigned)k < IUT_ANAB_COUNT) { out->id = t[k].id; out->notation = t[k].notation; out->connected = t[k].connected; out->tempered = t[k].tempered; }
}
iut_field_kind iut_field_kind_of_valuation(const iut_valuation *v) { return v->kind == IUT_V_ARCH ? IUT_FIELD_CAF : IUT_FIELD_MLF; }
const char *iut_field_kind_id(iut_field_kind k) { return k == IUT_FIELD_NF ? "NF" : k == IUT_FIELD_MLF ? "MLF" : "CAF"; }

/* ================================================================== §1 ==== */
void iut_orbicurve_get(const iut_initial_theta_data *d, iut_orbicurve_kind k, iut_orbicurve *out)
{
    unsigned l = d->l;
    memset(out, 0, sizeof *out);
    out->kind = k; out->ncusps = -1;
    switch (k) {
    case IUT_ORB_X:      out->id = "XF"; out->notation = "X"; out->type = "(1,1)"; out->base = "k"; out->covers = "—"; out->degree = 1; out->covering_group = "—"; out->ncusps = 1; out->ref = "[IUTchI] §1; Def 3.1 (a)"; break;
    case IUT_ORB_C:      out->id = "COrbicurve"; out->notation = "C = X/{±1}"; out->type = "(1,1)±"; out->base = "k"; out->covers = "—"; out->degree = 1; out->covering_group = "—"; out->ncusps = 1; out->ref = "[IUTchI] §1"; break;
    case IUT_ORB_XUNDER: out->id = "XUnderK"; out->notation = "X̲"; out->type = "(1,l-tors)"; out->base = "K"; out->covers = "X"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->ncusps = (int)l; out->ref = "[IUTchI] §1; Def 3.1 (b); Def 6.1 (iii): cusps ↔ F_l"; break;
    case IUT_ORB_CUNDER: out->id = "CK"; out->notation = "C̲ = X̲/{±1}"; out->type = "(1,l-tors)±"; out->base = "K"; out->covers = "C"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->ncusps = (int)d->lpm; out->ref = "[IUTchI] §1; Def 3.1 (b); Ex 4.4 (i): cusps ↔ |F_l|"; break;
    case IUT_ORB_XARROW: out->id = "XArrow"; out->notation = "X→"; out->type = "(1,l-tors→)"; out->base = "k"; out->covers = "X̲"; out->degree = l; out->covering_group = "Z/l (Gal(X→/C̲) ≅ Z/2l)"; out->covering_group_order = l; out->aut_k_order = 2 * l; out->ref = "[IUTchI] Def 1.1; Rem 1.2.1"; break;
    case IUT_ORB_CARROW: out->id = "CArrow"; out->notation = "C→"; out->type = "(1,l-tors→)±"; out->base = "k"; out->covers = "C̲"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->aut_k_order = l; out->ref = "[IUTchI] Def 1.1; Rem 1.2.1"; break;
    case IUT_ORB_XUNDERUNDER_V: out->id = "XUnderUnderK"; out->notation = "X̲̲_v"; out->type = "(1,(Z/l)^Θ)"; out->base = "K_v"; out->covers = "X̲_v"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->ref = "[IUTchI] Def 3.1 (b); [EtTh] Def 2.5"; break;
    case IUT_ORB_CUNDERUNDER_V: out->id = "CUnderUnderV"; out->notation = "C̲̲_v"; out->type = "(1,(Z/l)^Θ)±"; out->base = "K_v"; out->covers = "C̲_v"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->ref = "[IUTchI] Def 3.1 (b)"; break;
    case IUT_ORB_CUNDER_V: out->id = "CUnderV"; out->notation = "C̲_v"; out->type = "(1,Z/l)±"; out->base = "K_v"; out->covers = "C_v"; out->degree = l; out->covering_group = "Z/l"; out->covering_group_order = l; out->ncusps = (int)d->lpm; out->ref = "[IUTchI] Def 3.1 (b); Ex 4.4 (i)"; break;
    default: out->id = "?"; break;
    }
}
static int reduce_Fl(const iut_initial_theta_data *d, long x) { long l = d->l; x %= l; if (x < 0) x += l; if (x > (long)d->lstar) x -= l; return (int)x; }
void iut_cusps_section_one_get(const iut_initial_theta_data *d, iut_cusps_section_one *out)
{
    /* [IUTchI] §1: ε a nonzero cusp of C̲; ε′, ε″ the cusps of X̲ over ε, swapped by the
     * involution ι of X̲ over C̲; 0 → I_ε′ × I_ε″ → Δ_ε → Δ_E ⊗ Z/l → 0 where ι acts as −1
     * on Δ_E ⊗ Z/l; Δ_ε ≅ Δ_ε^+ × Δ_ε^−; the cusp "2ε" (2 ≢ ±1 mod l) determines the
     * normal section σ : G_k → J_C used to define X→, C→ (Def 1.1).                    */
    memset(out, 0, sizeof *out);
    out->epsilon = 1; out->epsilon_prime = 1; out->epsilon_dprime = -1; out->zero_cusp = 0;
    out->two_epsilon = reduce_Fl(d, 2);
    out->two_epsilon_ok = (2 % d->l != 1) && ((d->l - 1) % d->l != 2);   /* 2 ≢ ±1 mod l ⇔ l ∤ 1, l ∤ 3 */
    out->inertia_product_rank = 2; out->delta_E_mod_l_order = d->l * d->l;
    out->iota_swaps_inertia = 1; out->iota_acts_minus_one = 1; out->delta_eps_splits = 1;
}
void iut_cor_one_two_run(const iut_initial_theta_data *d, iut_cor_one_two *out)
{
    unsigned l = d->l;
    memset(out, 0, sizeof *out);
    out->l_squared = l * l;
    out->idx_X_XUnder = l; out->idx_XUnder_XArrow = l; out->idx_C_XArrow = 2 * l * l;
    out->gal_XUnder_over_CUnder = 2; out->gal_CArrow_over_CUnder = l; out->gal_XArrow_over_CUnder = 2 * l; out->gal_XArrow_over_CArrow = 2;
    out->aut_k_XArrow = 2 * l; out->aut_k_CArrow = l;
    out->stabilized_cusps[0] = 0; out->stabilized_cusps[1] = 1; out->stabilized_cusps[2] = -1;
    const char *s[] = {
        "Π_X→, Π_X̲, Π_C̲ are slim, hence embed in Aut(Π_X→); recover Δ_X→ ⊆ Π_X→ ([AbsTopI] Thm 2.6 (v),(vi))",
        "reconstruct Π_C ⊇ Π_X→ and Δ_X ⊆ Δ_C ⊆ Π_C ([AbsTopII] Cor 3.3 (i),(ii))",
        "recover l from l² = [Δ_X : Δ_X̲]·[Δ_X̲ : Δ_X→] = [Δ_X : Δ_X→] = [Δ_C : Δ_X→]/2",
        "H = Ker(Δ_X ↠ Δ_X^ab ⊗ Z/l);  Π_X̲ = Π_X→ · H",
        "decomposition groups of 0, ε′, ε″ in Π_X̲ = those of cusps with nontrivial image in Gal(X→/X̲) = Π_X̲/Π_X→",
        "Π_C̲ ⊆ Π_C: the unique splitting of Gal(X/C) = Π_C/Π_X ↠ Π_C/Π_X̲ = Gal(X̲/C̲) stabilizing the classes of 0, ε′, ε″ (l prime to 3!)",
        "Π_C→ ⊆ Π_C̲: Gal(X→/C→) (≅ Z/2) ⊆ Gal(X→/C̲) (≅ Z/2l) is the unique maximal subgroup of odd index",
        "decomposition groups of ε′, ε″: cusps with nontrivial image in Gal(X→/X̲) not fixed up to conjugacy by the outer action of Gal(X̲/C̲)",
    };
    out->nsteps = 8; for (unsigned i = 0; i < 8; ++i) out->steps[i] = s[i];
}

/* ================================================================== §2 ==== */
unsigned iut_tempered_facts(iut_tempered_fact *out, unsigned max)
{
    static const iut_tempered_fact t[] = {
        { "TemperedConjugates",     "a profinite conjugate of a nontrivial compact subgroup of Π^tp_G lying in Π^tp_G is a Π^tp_G-conjugate (Σ-tempered groups of graphs)", "[IUTchI] Prop 2.1", 1 },
        { "CommensurablyTerminal",  "Π^tp_X ⊆ Π_X is commensurably terminal",                                                                   "[IUTchI] Prop 2.2", 1 },
        { "TemperedSubcover",       "for H ⊆ Π_X open, Δ^tp_{X,H} := Δ^tp_X ∩ H is the tempered group of the covering determined by H",               "[IUTchI] Cor 2.3", 1 },
        { "TemperedVerticialEdge",  "verticial / edge-like subgroups of Π^tp are characterized by their profinite conjugacy behaviour",             "[IUTchI] Prop 2.4", 1 },
        { "DecompositionSynchronized", "a decomposition (resp. inertia) group of Π_X contained in Π^tp_X is a tempered decomposition (resp. inertia) group", "[IUTchI] Cor 2.5", 1 },
        { "DiscreteAnalogue",       "the discrete analogues: Thm 2.6, Lemma 2.7, Cor 2.8 for the topological fundamental group π_1 and its tempered completions", "[IUTchI] Thm 2.6, Lem 2.7, Cor 2.8", 1 },
        { "GaloisCountable",        "Galois-countable groups (T1)–(T6) and the effects (E1)–(E9) on the tempered theory",                              "[IUTchI] Rem 2.5.3", 1 },
    };
    unsigned n = sizeof t / sizeof t[0]; if (n > max) n = max;
    memcpy(out, t, n * sizeof *out); return n;
}
void iut_tempered_at_v_get(const iut_initial_theta_data *d, unsigned v, iut_tempered_at_v *out)
{
    memset(out, 0, sizeof *out);
    out->v_index = v;
    const iut_valuation *V = &d->V[v];
    out->tempered_available = (V->kind == IUT_V_NONARCH && V->red == IUT_RED_BAD_MULT);   /* Def 3.1 (c): Π_v = Π^tp_{X̲̲_v} at bad v */
    out->profinite_conjugates_stay_tempered = out->tempered_available;
    out->commensurably_terminal = out->tempered_available;
    out->decomposition_groups_synchronized = out->tempered_available;
    out->galois_countable = 1;   /* Rem 2.5.3: all the groups in play are Galois-countable */
}

/* ================================================================== §3 ==== */
static int coprime(unsigned a, unsigned b) { while (b) { unsigned t = a % b; a = b; b = t; } return a == 1; }
unsigned iut_def_three_one_check(const iut_initial_theta_data *d, iut_def_three_one_item *out, unsigned max, iut_report *r)
{
    unsigned n = 0;
    int c_ok = 1, e_ok = 0, odd_ok = 1;
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *v = &d->V[i];
        if (v->in_Vbad_mod) { e_ok = 1; if (v->p % 2 == 0) odd_ok = 0; if (v->p == d->l || (v->ordq && !coprime(d->l, v->ordq))) c_ok = 0; }
    }
#define ITEM(it, cond, okv, mc, det) do { if (n < max) { out[n].item = it; out[n].condition = cond; out[n].ok = (okv); out[n].machine_checked = mc; out[n].detail = det; } n++; if (r) iut_report_add(r, (okv) ? IUT_SEV_OK : IUT_SEV_ERROR, "DefThreeOne", "[IUTchI] Def 3.1 " it, "%s: %s", cond, det); } while (0)
    ITEM("(a)", "F ∋ √−1; F/F_mod Galois of degree prime to l; the 2·3-torsion of E_F rational over F", d->h_F_galois_over_Fmod && d->h_F_contains_six_torsion, 0, "asserted flags h_F_galois_over_Fmod, h_F_contains_six_torsion");
    ITEM("(b)", "X_F once-punctured E_F; C_K = X̲_K/±1 of type (1,l-tors)±, X̲_K of type (1,l-tors); K = F(E[l]) with image ⊇ SL_2(F_l)", d->h_image_contains_SL2 && d->h_CK_is_K_core && d->l >= 5 && iut_is_prime(d->l), 0, "asserted flags h_image_contains_SL2, h_CK_is_K_core; l ≥ 5 prime checked");
    ITEM("(c)", "l prime to 2·3, to the residue characteristics of V^bad_mod and to the orders ord_v(q_v)", c_ok && d->l % 2 && d->l % 3, 1, "checked against every v ∈ V^bad_mod");
    ITEM("(d)", "V ⊆ V(K) is a section of V(K) ↠ V_mod (one v above each v_mod)", d->nV > 0 && d->nV <= IUT_MAX_V, 1, "|V| = |V_mod| by construction of the data");
    ITEM("(e)", "V^bad_mod ≠ ∅, odd residue characteristic, bad multiplicative reduction; E_F has stable reduction", e_ok && odd_ok && d->h_stable_reduction, 1, "checked: at least one odd v of bad multiplicative reduction");
    ITEM("(f)", "ε̲ a cusp of C̲_K, hence ε̲_v ∈ LabCusp(D_v) for every v", iut_label_in_Fl(d, d->epsilon), 1, "ε̲ recorded as a label of F_l");
#undef ITEM
    return n;
}
void iut_theta_approach_get(const iut_initial_theta_data *d, iut_theta_approach *out)
{
    out->cyclotome_index = d->l;
    out->cyclotome = "M_X (the cyclotome of the once-punctured elliptic curve, [AbsTopIII] Thm 1.9)";
    out->theta_cyclotome = "Δ_Θ (the cyclotome of the theta function, [EtTh])";
    out->applied_to = "Π_{X̲_K} ⊆ Π_{C̲_K} (the Θ-approach: use the once-punctured curve, not C̲_K directly)";
    out->ref = "[IUTchI] Rem 3.1.2: M_X ≅ l·Δ_Θ";
}
unsigned iut_def_three_one_determining_data(const char **out, unsigned max)
{
    static const char *s[] = { "F̄/F", "X_F", "C̲_K", "V", "V^bad_mod" };
    unsigned n = 5 > max ? max : 5;
    for (unsigned i = 0; i < n; ++i) out[i] = s[i];
    return n;   /* [IUTchI] Rem 3.1.3: l, ε̲ are then determined */
}
void iut_s_mod_get(const iut_initial_theta_data *d, iut_s_mod *out)
{
    out->notation = "S_mod = Spec(O_K) // Gal(K/F_mod)";
    out->gal_order_bound = d->dmod ? d->dK / d->dmod : d->dK;   /* [K : F_mod] */
    out->npoints = d->nV;                                       /* its "points" ↔ V_mod */
}
void iut_kappa_coric_check(const iut_kappa_function *f, iut_kappa_verdict *out)
{
    /* [IUTchI] Rem 3.1.7 (i),(ii) */
    memset(out, 0, sizeof *out);
    out->ncritical = 4; out->nstrictly_critical = 4;
    if (f->npoles != 1) { out->failed = "exactly one pole required"; return; }
    if (f->nzeros < 2) { out->failed = "at least two zeroes required"; return; }
    if (!f->divisor_over_NF) { out->failed = "divisor must be defined over a number field"; return; }
    if (!f->divisor_avoids_critical) { out->failed = "divisor must avoid the critical points"; return; }
    if (!f->roots_of_unity_at_strictly_critical) { out->failed = "values at strictly critical points must be roots of unity"; return; }
    out->kappa_coric = 1;
    out->inf_kappa_coric = f->all_roots_adjoined;
    out->inf_kappa_units_coric = f->all_roots_adjoined && f->constants_adjoined;
}
void iut_kappa_sol_get(const iut_initial_theta_data *d, iut_kappa_sol *out)
{
    unsigned long long l = d->l;
    out->sl2_order = l * (l * l - 1);          /* |SL_2(F_l)| = l(l²−1) */
    out->k_over_F_mu_l = "Gal(K/F(μ_l)) is the unique subgroup of Gal(K/F) isomorphic to SL_2(F_l)";
    out->linearly_disjoint = 1;                /* L_C(C̲_K) and L_C(κ-sol) are linearly disjoint */
    out->center_free = 1;                      /* the κ-sol-open subgroups are center-free */
}

void iut_local_frobenioid_build(const iut_initial_theta_data *d, unsigned v, iut_local_frobenioid *out)
{
    const iut_valuation *V = &d->V[v];
    memset(out, 0, sizeof *out);
    out->v_index = v;
    if (V->kind == IUT_V_ARCH) {
        out->kind = IUT_LF_ARCH; out->ref = "[IUTchI] Ex 3.4";
        out->D_v = "X→_v: the Aut-holomorphic orbispace of X→ ×_K K_v (a CAF A_□ = C)";
        out->D_mono_v = "D⊢_v: a split topological monoid in TM (C ≅ O▷_C, C× ≅ S¹, C→ ≅ R≥0)";
        out->F_v = "F̲_v = (C_v, D_v, κ_v): archimedean Frobenioid C_v with O▷(C_v) ≅ O▷_{K̄_v}, Kummer structure κ_v : O▷(C_v) ↪ A_{D_v}";
        out->C_v = "C_v"; out->C_mono_v = "C⊢_v (F⊢_v = (C⊢_v, D⊢_v, τ⊢_v))";
        out->divisor_monoid = "Φ_{C⊢v} = R≥0 · log(p_v)"; out->divisor_monoid_theta = "R≥0 · log(p_v) · log(Θ)";
        out->generator = "p_v (= e)"; out->generator_value = iut_q_make(1, 1);
        out->splitting = "τ⊢_v: C× = S¹ × R>0 (the canonical splitting of a CAF)"; out->splitting_indeterminacy = 1;
        out->is_split = 1; out->has_kummer_structure = 1; out->formal_symbol = "log(p_v)·log(Θ)";
        return;
    }
    if (V->red == IUT_RED_BAD_MULT) {
        out->kind = IUT_LF_BAD; out->ref = "[IUTchI] Ex 3.2";
        out->D_v = "D_v = B^temp(X̲̲_v)^0"; out->D_mono_v = "D⊢_v = B(K_v)^0 ⊆ D_v"; out->D_theta_v = "D^Θ_v";
        out->F_v = "F̲_v: the tempered Frobenioid over D_v"; out->F_birat_v = "F÷_v: birationalization"; out->C_v = "C_v: base-field-theoretic hull";
        out->C_mono_v = "C⊢_v (with the μ_2l-orbit of characteristic splittings τ⊢_v)"; out->C_theta_v = "C^Θ_v (with τ^Θ_v)";
        out->divisor_monoid = "Φ_{C⊢v} = N · log_Φ(q̲_v)"; out->divisor_monoid_theta = "N · log_Φ(q̲_v) · log(Θ)";
        out->generator = "q̲_v = q_v^{1/2l} (up to μ_2l)"; out->generator_value = iut_q_make(1, 1);
        out->splitting = "τ⊢_v: a μ_2l-orbit of splittings O▷ = O× × Φ"; out->splitting_indeterminacy = 2 * d->l;
        out->theta_function = "Θ̲_v ∈ O×(T÷_{Ÿ_v}) up to μ_2l and l·Z (translation of the labels)"; out->theta_root_indeterminacy = 2 * d->l; out->theta_translation_indeterminacy = 1;
        out->is_tempered = 1; out->is_split = 1; out->is_birational_available = 1; out->formal_symbol = "log(Θ)";
        return;
    }
    out->kind = IUT_LF_GOOD_NONARCH; out->ref = "[IUTchI] Ex 3.3";
    out->D_v = "D_v = B(X→_v)^0"; out->D_mono_v = "D⊢_v = B(K_v)^0";
    out->F_v = "F̲_v = C_v: the p_v-adic Frobenioid, Φ_{C_v}: Spec L ↦ ord(O_L)^pf"; out->C_v = "C_v"; out->C_mono_v = "C⊢_v ⊆ C_v";
    out->divisor_monoid = "Φ_{C⊢v} = ord(Z_{p_v}) = N · log(p_v)"; out->divisor_monoid_theta = "N · log(p_v) · log(Θ)";
    out->generator = "p_v"; out->generator_value = iut_q_make(V->e_K ? (long)V->e_K : 1, 1);
    out->splitting = "τ⊢_v: the splitting determined by p_v"; out->splitting_indeterminacy = 1;
    out->is_split = 1; out->formal_symbol = "log(p_v)·log(Θ)";
}
int iut_local_frobenioid_split_iso(const iut_local_frobenioid *a, int ta, const iut_local_frobenioid *b, int tb)
{
    /* [IUTchI] Ex 3.2 (v) / 3.3 (iii) / 3.4 (iv): F⊢_v ≅ F^Θ_v — the split Frobenioids are
     * isomorphic (the isomorphism sends q̲_v ↦ Θ̲_v-generator, i.e. log(q̲) ↦ log(Θ)); the
     * underlying mono-analytic data (D⊢_v, splitting indeterminacy) must agree.         */
    (void)ta; (void)tb;
    return a->kind == b->kind && a->splitting_indeterminacy == b->splitting_indeterminacy && !iut_q_cmp(a->generator_value, b->generator_value);
}
unsigned iut_local_frobenioid_reconstructions(const iut_local_frobenioid *lf, const char **out, unsigned max)
{
    static const char *bad[] = {
        "(a) the subgroups Π^tp_{X̲̲_v} ↠ G_v, the cuspidal decomposition groups and Ÿ_v from the tempered Frobenioid F̲_v",
        "(b) the birationalization F÷_v and the base-field-theoretic hull C_v",
        "(c) the theta function Θ̲_v ∈ O×(T÷_{Ÿ_v}) up to μ_2l and l·Z  ([EtTh] Thm 1.10)",
        "(d) q_v and q̲_v = q_v^{1/2l} up to μ_2l; the divisor monoid Φ_{C⊢v} = N·log_Φ(q̲_v)",
        "(e) the μ_2l-orbit of characteristic splittings τ⊢_v, hence the split Frobenioid F⊢_v = (C⊢_v, τ⊢_v)",
        "(f) the Θ-version D^Θ_v, C^Θ_v, τ^Θ_v and the isomorphism F⊢_v ≅ F^Θ_v",
    };
    static const char *good[] = { "D⊢_v = B(K_v)^0 from D_v = B(X→_v)^0 (Π_v ↠ G_v)", "C⊢_v ⊆ C_v and the splitting τ⊢_v from p_v", "the formal symbol log(p_v)·log(Θ)" };
    static const char *arch[] = { "the Kummer structure κ_v and O▷(C_v) ≅ O▷_{K̄_v}", "D⊢_v ∈ TM: C× ≅ S¹, C→ ≅ R≥0", "Φ_{C⊢v} = R≥0·log(p_v) and its Θ-version" };
    const char **src = lf->kind == IUT_LF_BAD ? bad : lf->kind == IUT_LF_GOOD_NONARCH ? good : arch;
    unsigned n = lf->kind == IUT_LF_BAD ? 6 : 3; if (n > max) n = max;
    for (unsigned i = 0; i < n; ++i) out[i] = src[i];
    return n;
}

double iut_rho_v(const iut_initial_theta_data *d, unsigned v)
{
    /* [IUTchI] Ex 3.5 (ii): ρ_v : log_mod(p_v) ↦ (1/[K_v : (F_mod)_v]) · log_Φ(p_v) */
    const iut_valuation *V = &d->V[v];
    if (V->kind == IUT_V_ARCH) return 1.0;
    double deg = (double)(V->e_K ? V->e_K : 1) * (V->f_K ? V->f_K : 1) / ((double)(V->e_mod ? V->e_mod : 1) * (V->f_mod ? V->f_mod : 1));
    return 1.0 / (deg < 1 ? 1 : deg);
}
double iut_rho_theta_v(const iut_initial_theta_data *d, unsigned v, unsigned j)
{
    /* [IUTchI] Ex 3.5 (ii), Θ-version: log_mod(p_v)·log(Θ) ↦ (log_Φ(p_v)/[K_v:(F_mod)_v]) · (log_Φ(Θ̲_v)/log_Φ(q̲_v)).
     * Evaluated at the label j (Ex 4.4 (i): Θ̲_v ↦ q̲_v^{j²}) the last ratio is j².          */
    const iut_valuation *V = &d->V[v];
    double logp = V->kind == IUT_V_ARCH ? 1.0 : log((double)V->p);
    return iut_rho_v(d, v) * logp * (double)j * (double)j;
}
void iut_global_realified_build(const iut_initial_theta_data *d, iut_global_realified_kind k, iut_global_realified *out)
{
    memset(out, 0, sizeof *out);
    out->kind = k; out->nprimes = d->nV;
    switch (k) {
    case IUT_GR_MOD: out->id = "CMonoGlobMod"; out->notation = "C⊩_mod"; out->ref = "[IUTchI] Ex 3.5 (i),(ii)"; break;
    case IUT_GR_THT: out->id = "CMonoGlobTht"; out->notation = "C⊩_tht"; out->ref = "[IUTchI] Ex 3.5 (ii) (Θ-version: log(Θ))"; out->with_theta = 1; break;
    default:         out->id = "DMonoGlobMod"; out->notation = "D⊩_mod"; out->ref = "[IUTchI] Ex 3.5 (iv) (étale-like, from {D⊢_v})"; break;
    }
    for (unsigned i = 0; i < d->nV; ++i) {
        const iut_valuation *V = &d->V[i];
        out->rho[i] = iut_rho_v(d, i);
        out->local_degree[i] = V->kind == IUT_V_ARCH ? 1 : (unsigned)(1.0 / out->rho[i] + 0.5);
        out->frobenius_element[i] = V->kind == IUT_V_ARCH ? 1.0 / (2.0 * M_PI) : (double)(V->e_K ? V->e_K : 1);   /* ×e_v (nonarch), ÷2π (arch) */
    }
}
void iut_f_monoglob_build(const iut_initial_theta_data *d, int theta_version, iut_f_monoglob *out)
{
    /* [IUTchI] Ex 3.5 (iii): F⊩_mod = (C⊩_mod, Prime(C⊩_mod) ≅ V, {F⊢_v}_{v∈V}, {ρ_v}_{v∈V}); the Θ-version F⊩_tht likewise */
    memset(out, 0, sizeof *out);
    out->theta_version = theta_version;
    out->id = theta_version ? "FMonoGlobTht" : "FMonoGlobMod"; out->notation = theta_version ? "F⊩_tht" : "F⊩_mod";
    iut_global_realified_build(d, theta_version ? IUT_GR_THT : IUT_GR_MOD, &out->global);
    out->nV = d->nV;
    for (unsigned i = 0; i < d->nV; ++i) iut_local_frobenioid_build(d, i, &out->loc[i]);
}
int iut_f_monoglob_iso(const iut_f_monoglob *a, const iut_f_monoglob *b)
{
    /* [IUTchI] Ex 3.5 (iii): F⊩_tht ≅ F⊩_mod — the isomorphism is "log(Θ) ↦ log(q̲)" at each v; the local split Frobenioids match */
    if (a->nV != b->nV || a->global.nprimes != b->global.nprimes) return 0;
    for (unsigned i = 0; i < a->nV; ++i) if (!iut_local_frobenioid_split_iso(&a->loc[i], a->theta_version, &b->loc[i], b->theta_version) || fabs(a->global.rho[i] - b->global.rho[i]) > 1e-12) return 0;
    return 1;
}
void iut_theta_hodge_theater_def_build(const iut_initial_theta_data *d, iut_theta_hodge_theater_def *out)
{
    /* [IUTchI] Def 3.6: †HT^Θ = ({†F̲_v}_{v∈V}, †F⊩_mod) such that (a) each †F̲_v ≅ F̲_v of Ex 3.2–3.4,
     * (b) †F⊩_mod ≅ F⊩_mod of Ex 3.5, (c) the local data of (b) are the mono-analyticizations †F⊢_v of (a) */
    memset(out, 0, sizeof *out);
    out->nV = d->nV;
    for (unsigned i = 0; i < d->nV; ++i) iut_local_frobenioid_build(d, i, &out->loc[i]);
    iut_f_monoglob_build(d, 0, &out->mod); iut_f_monoglob_build(d, 1, &out->tht);
    out->cond_a = 1; out->cond_b = 1;
    out->cond_c = 1; for (unsigned i = 0; i < d->nV; ++i) if (out->mod.loc[i].kind != out->loc[i].kind) out->cond_c = 0;
}
int iut_theta_link_cor_three_seven(const iut_link *lk, iut_report *r)
{
    /* [IUTchI] Cor 3.7: the Θ-link †HT^Θ → ‡HT^Θ is the full poly-isomorphism †F⊩_tht ≅ ‡F⊩_mod;
     * (ii) it induces full poly-isomorphisms †D⊢_v ≅ ‡D⊢_v (the G_v are preserved up to indeterminate iso, the Π_v are not);
     * (iii) it induces isomorphisms of the unit groups O×_{C⊢v} (Rem 3.9.3: units fixed, value groups Θ-dilated). */
    int bad = 0;
    int is_theta = lk->kind != IUT_LINK_LOG && lk->kind != IUT_LINK_D_THETA_PMELL_NF;
    int c1 = is_theta && lk->full_poly_isomorphism, c2 = lk->preserves_G && !lk->preserves_Pi, c3 = lk->preserves_units_mod_tors || lk->kind == IUT_LINK_THETA, c4 = !lk->preserves_ring_structure;
    if (r) {
        iut_report_add(r, c1 ? IUT_SEV_OK : IUT_SEV_ERROR, "ThetaLinkFullPolyIso", "[IUTchI] Cor 3.7 (i)", "Θ-link is the full poly-isomorphism F⊩_tht ≅ F⊩_mod");
        iut_report_add(r, c2 ? IUT_SEV_OK : IUT_SEV_ERROR, "ThetaLinkPreservesDMono", "[IUTchI] Cor 3.7 (ii)", "D⊢_v = {G_v} preserved, Π_v not");
        iut_report_add(r, c3 ? IUT_SEV_OK : IUT_SEV_WARN, "ThetaLinkPreservesUnits", "[IUTchI] Cor 3.7 (iii); Rem 3.9.3", "O×_{C⊢v} preserved; value groups dilated by %.3f", lk->dilation);
        iut_report_add(r, c4 ? IUT_SEV_OK : IUT_SEV_ERROR, "ThetaLinkNotRing", "[IUTchI] Rem 3.9.3", "the ring structures are not related by the Θ-link");
    }
    bad += !c1; bad += !c2; bad += !c4;
    return bad;
}

/* ================================================================== §4 ==== */
void iut_labcusp_torsor_make(const iut_initial_theta_data *d, iut_labcusp_torsor *out)
{
    /* [IUTchI] Def 4.1 (ii): LabCusp(†D_v) = the set of (D_v-)cusps labelled by F_l^*, an F_l^*-torsor with
     * canonical element †η_v (the image of ε̲_v); Prop 4.2: the bijections are compatible for all v. */
    memset(out, 0, sizeof *out);
    out->nV = d->nV; out->torsor_size = d->lstar;
    for (unsigned i = 0; i < d->nV; ++i) out->eta[i] = 1;
    out->compatible = 1;
}
int iut_labcusp_torsor_act(const iut_initial_theta_data *d, int u, int label) { return iut_sym_FlStar_act(d, u, label); }

void iut_global_base_get(const iut_initial_theta_data *d, iut_global_base_kind k, iut_global_base *out)
{
    unsigned long long l = d->l;
    memset(out, 0, sizeof *out);
    out->kind = k; out->nV_section = d->nV;
    out->aut_image_order = l * (l - 1) * (l - 1) / 2;   /* Borel/{±1} */
    out->aut_eps_image_order = l * (l - 1);             /* semi-unipotent/{±1} */
    if (k == IUT_GB_CIRCAST) {
        out->id = "DCircAstGlobal"; out->notation = "D^⊛ = B(C̲_K)^0"; out->curve = "C̲_K"; out->group = "Π_{C̲_K}";
        out->labcusp_size = d->lstar; out->quotient_order = d->lstar; out->quotient_group = "F_l^* = Aut(C̲_K)/Aut_ε(C̲_K)";
    } else {
        out->id = "DCircDotPmGlobal"; out->notation = "D^⊚± = B(X̲_K)^0"; out->curve = "X̲_K"; out->group = "Π_{X̲_K}";
        out->labcusp_size = d->l; out->quotient_order = 2 * l; out->quotient_group = "F_l^{⋊±} = Aut_±(D^⊚±)/Aut_csp(D^⊚±)";
        out->double_cover = 1;
    }
}
unsigned iut_valuation_orbits(const iut_initial_theta_data *d, iut_valuation_orbit *out, unsigned max)
{
    unsigned long long l = d->l;
    iut_valuation_orbit t[4] = {
        { "VSet",  "V",     "—",                     d->nV, d->nV },
        { "VPmUn", "V^±un = V^±", "Aut_ε(C̲_K)·V = Aut_csp(D^⊚±)·V  ([IUTchI] Ex 4.3 (i); Def 6.1 (v); Rem 6.1.1)", d->nV, d->nV * l * (l - 1) },
        { "VBor",  "V^Bor", "Aut(C̲_K)·V  ([IUTchI] Ex 4.3 (i))", d->nV, d->nV * l * (l - 1) * (l - 1) / 2 },
        { "VK",    "V(K)",  "all valuations of K", d->nV, d->nV * (unsigned long long)(d->dmod ? d->dK / d->dmod : d->dK) },
    };
    unsigned n = 4 > max ? max : 4; memcpy(out, t, n * sizeof *out); return n;
}
void iut_eval_points_make(const iut_initial_theta_data *d, unsigned v, iut_eval_points *out)
{
    /* [IUTchI] Ex 4.4 (i): the cusps of C̲_v ↔ |F_l|; the evaluation points are the μ_−-translates of the cusps;
     * Θ̲_v takes the value q̲_v^{j²} (up to μ_2l) at the points labelled j ∈ |F_l|; (ii) they are K_v-rational;
     * the evaluation sections G_v → Π_v labelled by |F_l| are group-theoretically constructible from Π_v. */
    memset(out, 0, sizeof *out);
    out->v_index = v; out->n = d->lpm; out->mu_minus_order = 2;
    for (unsigned j = 0; j < d->lpm; ++j) { out->label[j] = (int)j; out->theta_value[j] = iut_q_make((long)j * (long)j, 1); }
    out->K_v_rational = 1; out->sections_group_theoretic = 1;
}
void iut_theta_bridge_piece_get(const iut_initial_theta_data *d, unsigned v, int j, iut_theta_bridge_piece *out)
{
    /* [IUTchI] Ex 4.4 (iii): φ^Θ_{v_j} : D_{v_j} → D_{>,v} — at v ∈ V^bad the poly-morphism determined by the
     * evaluation section labelled |j| (composed with the full poly-automorphisms); at v ∈ V^good the full poly-isomorphism */
    const iut_valuation *V = &d->V[v];
    memset(out, 0, sizeof *out);
    out->v_index = v; out->j = j; out->label_used = iut_label_abs(j);
    int bad = V->kind == IUT_V_NONARCH && V->red == IUT_RED_BAD_MULT;
    out->via_evaluation_section = bad; out->full_poly_iso = !bad;
}
void iut_label_transport_make(const iut_initial_theta_data *d, int signed_labels, iut_label_transport *out)
{
    /* [IUTchI] Prop 4.7: †χ : J ≅ F_l^* (from the capsule index set), †φ^LC_j : LabCusp(†D^⊛) ≅ LabCusp(†D_>) with
     * [†ε] ↦ j, and †ζ : LabCusp(†D^⊛) ≅ J.  Prop 6.5: the ± versions †ζ^Θell_{v_t}, the global ±-synchronization
     * †ξ, and †ζ_± : LabCusp±(†D^⊚±) ≅ T.  Rem 6.12.4: these are synchronized across v ∈ V.                  */
    memset(out, 0, sizeof *out);
    out->signed_labels = signed_labels;
    if (signed_labels) { out->n = d->l; for (unsigned i = 0; i < d->l; ++i) { int t = (int)i - (int)d->lstar; out->chi[i] = t; out->zeta[i] = t; } out->epsilon_class_image = 1; }
    else { out->n = d->lstar; for (unsigned i = 0; i < d->lstar; ++i) { out->chi[i] = (int)i + 1; out->zeta[i] = (int)i + 1; } out->epsilon_class_image = 1; }
    out->synchronized = 1;
}
int iut_label_transport_check(const iut_label_transport *lt, const iut_initial_theta_data *d)
{
    unsigned expect = lt->signed_labels ? d->l : d->lstar;
    if (lt->n != expect) return 0;
    for (unsigned i = 0; i < lt->n; ++i) {
        if (lt->signed_labels ? !iut_label_in_Fl(d, lt->chi[i]) : !iut_label_in_FlStar(d, lt->chi[i])) return 0;
        for (unsigned k = 0; k < i; ++k) if (lt->chi[k] == lt->chi[i] || lt->zeta[k] == lt->zeta[i]) return 0;
    }
    return lt->synchronized;
}
unsigned iut_iso_torsors(const iut_initial_theta_data *d, iut_iso_torsor *out, unsigned max)
{
    unsigned long long l = d->l, twoV = 1UL << (d->nV < 63 ? d->nV : 63);
    iut_iso_torsor t[] = {
        { "D-NF-bridge †φ^NF_⊛",          "F_l^*",                 d->lstar,        "[IUTchI] Prop 4.8 (i)" },
        { "D-Θ-bridge †φ^Θ_⊛",            "trivial",               1,               "[IUTchI] Prop 4.8 (ii)" },
        { "D-ΘNF-Hodge theater",          "trivial",               1,               "[IUTchI] Prop 4.8 (iii)" },
        { "gluing D-NF-bridge ∪ D-Θ-bridge", "F_l^*",              d->lstar,        "[IUTchI] Prop 4.8 (iv)" },
        { "D-Θ±-bridge †φ^Θ±_±",          "{±1} × {±1}^V",         2 * twoV,        "[IUTchI] Prop 6.6 (i)" },
        { "D-Θell-bridge †φ^Θell_±",      "F_l^{⋊±}",              2 * l,           "[IUTchI] Prop 6.6 (ii)" },
        { "D-Θ±ell-Hodge theater",        "{±1}",                  2,               "[IUTchI] Prop 6.6 (iii)" },
        { "gluing D-Θ±-bridge ∪ D-Θell-bridge", "F_l^{⋊±} × {±1}^V", 2 * l * twoV,  "[IUTchI] Prop 6.6 (iv)" },
        { "NF-/Θ-bridges, ΘNF-HT (F-version)", "same as the D-versions", 1,          "[IUTchI] Cor 5.6 (i)–(iii)" },
        { "Θ±-/Θell-bridges, Θ±ell-HT (F-version)", "same as the D-versions", 1,     "[IUTchI] Cor 6.12 (i)–(iii)" },
        { "gluing Θ±ell-HT ∪ ΘNF-HT (Prop 6.7)", "unique",          1,               "[IUTchI] Rem 6.12.2; Def 6.13" },
    };
    unsigned n = sizeof t / sizeof t[0]; if (n > max) n = max; memcpy(out, t, n * sizeof *out); return n;
}
void iut_forgetful_counts_get(const iut_initial_theta_data *d, int signed_labels, iut_forgetful_counts *out)
{
    /* [IUTchI] Prop 4.9 / Prop 6.8 and Prop 4.11 / Prop 6.9 */
    memset(out, 0, sizeof *out);
    out->signed_labels = signed_labels;
    out->n = signed_labels ? d->lpm : d->lstar;
    out->symmetric_group_order = iut_factorial(out->n);
    out->label_assignments = pow((double)out->n, (double)out->n);
    out->procession_assignments = out->symmetric_group_order;
    out->reduction_factor = out->label_assignments / (double)out->procession_assignments;
    out->transitivity = signed_labels ? "F_l^{⋊±} acts doubly transitively on T (Prop 6.8 (i))" : "F_l^* acts simply transitively on J (Prop 4.9 (i))";
}

/* ================================================================== §5 ==== */
void iut_global_frobenioid_get(const iut_initial_theta_data *d, iut_global_frobenioid_kind k, iut_global_frobenioid *out)
{
    memset(out, 0, sizeof *out);
    out->kind = k; out->realified_available = 1; out->ncopies = 1; out->log_volume_weight = 1.0;
    switch (k) {
    case IUT_GF_FCIRCAST:       out->id = "FCircAstGlobal"; out->notation = "F^⊛(†D^⊛)"; out->base = "†D^⊛"; out->kummer_ready = 1; out->ref = "[IUTchI] Ex 5.1 (ii),(iii); Rem 5.1.3"; break;
    case IUT_GF_FCIRCAST_PRIME: out->id = "FCircAstPrime"; out->notation = "F^⊛′"; out->base = "†D^⊛_mod (the C_{F_mod} version)"; out->kummer_ready = 1; out->ref = "[IUTchI] Ex 5.1 (iii); Rem 5.1.3"; break;
    case IUT_GF_FCIRCAST_MOD:   out->id = "FCircAstMod"; out->notation = "F^⊛_mod"; out->base = "terminal objects of †D^⊛_mod"; out->kummer_ready = 0; out->ref = "[IUTchI] Ex 5.1 (iii); Rem 5.1.3"; break;
    case IUT_GF_FCIRCAST_J:     out->id = "FCircAstJ"; out->notation = "F^⊛_j"; out->base = "V_j = {v_j}"; out->kummer_ready = 0; out->ref = "[IUTchI] Ex 5.1 (vii); Rem 5.1.3"; break;
    case IUT_GF_FCIRCAST_ANGLEJ:out->id = "FCircAstAngleJ"; out->notation = "F^⊛_⟨J⟩"; out->base = "V_⟨J⟩ (diagonal)"; out->kummer_ready = 0; out->log_volume_weight = 1.0 / (double)d->lstar; out->ref = "[IUTchI] Ex 5.1 (vii); Rem 5.1.1; Rem 5.4.2"; break;
    case IUT_GF_FCIRCAST_JCAPS: out->id = "FCircAstJCapsule"; out->notation = "F^⊛_J = ∏_j F^⊛_j"; out->base = "V_J = ∏_j V_j"; out->kummer_ready = 0; out->ncopies = d->lstar; out->ref = "[IUTchI] Ex 5.1 (vii); Rem 5.1.3"; break;
    default: break;
    }
}
void iut_distribution_make(const iut_initial_theta_data *d, int diagonal, iut_distribution *out)
{
    /* [IUTchI] Ex 5.1 (vii): V_j = {v_j}_{v∈V} for j ∈ F_l^*, V_J = ∏_j V_j, and the diagonal V_⟨J⟩ ↪ V_J;
     * Rem 5.1.1: F_⟨J⟩ = "constant distribution", F_J = "arbitrary distribution" of the global data.  */
    out->nj = d->lstar; out->nV = d->nV; out->diagonal = diagonal;
    out->total = diagonal ? d->nV : (unsigned long long)d->nV * d->lstar;
    out->notation = diagonal ? "V_⟨J⟩" : "V_J";
}
double iut_distribution_log_volume(const iut_distribution *dist, const double *per_j, unsigned n)
{
    /* [IUTchI] Rem 5.4.2: log-volumes of the F_⟨J⟩ copy are averages (÷ l*) of those of the F_j, of F_J sums */
    double s = 0; for (unsigned i = 0; i < n; ++i) s += per_j[i];
    return dist->diagonal ? s / (double)(dist->nj ? dist->nj : 1) : s;
}
unsigned iut_strip_functors(iut_strip_functor *out, unsigned max)
{
    static const iut_strip_functor t[] = {
        { "FPrimeStrip",     "DPrimeStrip",     "F ↦ D (forget the Frobenioids)",       1, 1, "[IUTchI] Rem 5.2.1 (i); Cor 5.3 (ii): Isom(F) → Isom(D) bijective" },
        { "FPrimeStrip",     "FMonoPrimeStrip", "F ↦ F⊢ (mono-analyticization)",         0, 1, "[IUTchI] Rem 5.2.1 (ii); Rem 5.2.2: F Kummer-ready, F⊢ Kummer-blind" },
        { "FMonoPrimeStrip", "DMonoPrimeStrip", "F⊢ ↦ D⊢",                                0, 1, "[IUTchI] Cor 5.3 (iii): Isom(F⊢) → Isom(D⊢) surjective, not injective" },
        { "FPrimeStrip",     "FMonoGlobPrimeStrip", "F ↦ F⊩ (adjoin the global realified Frobenioid)", 0, 1, "[IUTchI] Rem 5.2.1 (iii); Def 5.2 (iv)" },
        { "DPrimeStrip",     "DMonoPrimeStrip", "D ↦ D⊢ (Π_v ↦ G_v)",                      0, 1, "[IUTchI] Def 4.1 (iv)" },
        { "FCircAstGlobal",  "DCircAstGlobal",  "F^⊛ ↦ Base(F^⊛) = D^⊛",                   1, 1, "[IUTchI] Cor 5.3 (i): Isom(F^⊛) → Isom(D^⊛) bijective" },
        { "FUnderV",         "DV",              "F̲_v ↦ D_v (v ∈ V^bad)",                    1, 1, "[IUTchI] Cor 5.3 (iv): Aut(F̲_v) → Aut(D_v) bijective" },
    };
    unsigned n = sizeof t / sizeof t[0]; if (n > max) n = max; memcpy(out, t, n * sizeof *out); return n;
}
int iut_lift_d_to_f(const iut_prime_strip *dstrip, const iut_initial_theta_data *d, iut_prime_strip *out)
{
    /* [IUTchI] Cor 5.3 (ii), Rem 5.3.1: a morphism of D-prime-strips lifts uniquely to F-prime-strips (pull-back of the
     * Frobenioids along the base morphism); so an F-prime-strip over a D-prime-strip is determined by the D-strip. */
    if (dstrip->kind != IUT_PS_D) return 0;
    unsigned base = dstrip->loc[0].Pi_copy ? dstrip->loc[0].Pi_copy : 1;
    iut_prime_strip_build(out, IUT_PS_F, dstrip->label, d, base, NULL, 0);
    for (unsigned i = 0; i < dstrip->nV && i < out->nV; ++i) { out->loc[i].Pi_copy = dstrip->loc[i].Pi_copy; out->loc[i].G_copy = dstrip->loc[i].G_copy; }
    return 1;
}

/* ================================================================== §6 ==== */
void iut_fl_semi_pm_group_make(const iut_initial_theta_data *d, iut_fl_semi_pm_set *out)
{
    /* [IUTchI] Def 6.1 (i): an F_l^{⋊±}-group = a set T with a {±1}-orbit of bijections T ≅ F_l */
    memset(out, 0, sizeof *out);
    out->n = d->l; out->is_group = 1; out->orbit_size = 2;
    for (unsigned i = 0; i < d->l; ++i) out->label[i] = (int)i - (int)d->lstar;
    out->aut_pm_order = 2; out->aut_plus_order = 1;    /* Aut_±(T) = {±1} ⊇ Aut_+(T) = {1}, index 2 */
}
void iut_fl_semi_pm_torsor_make(const iut_initial_theta_data *d, iut_fl_semi_pm_set *out)
{
    /* Def 6.1 (i): an F_l^{⋊±}-torsor = a set T with an F_l^{⋊±}-orbit of bijections T ≅ F_l */
    iut_fl_semi_pm_group_make(d, out);
    out->is_group = 0; out->orbit_size = 2UL * d->l;
    out->aut_pm_order = 2UL * d->l; out->aut_plus_order = d->l;   /* Aut_±(T) = F_l^{⋊±} ⊇ Aut_+(T) = F_l, index 2 */
}
int iut_fl_semi_pm_is_positive(const iut_initial_theta_data *d, int t) { (void)d; return t > 0; }   /* Def 6.1 (i): positive = image of {1..l*}, negative = {−l*..−1} */
unsigned iut_fl_semi_pm_abs(const iut_fl_semi_pm_set *T, int *out)
{
    unsigned n = 0;
    for (unsigned i = 0; i < T->n; ++i) { int a = iut_label_abs(T->label[i]); int seen = 0; for (unsigned k = 0; k < n; ++k) if (out[k] == a) seen = 1; if (!seen) out[n++] = a; }
    return n;   /* |T|: l± elements */
}
unsigned iut_fl_semi_pm_star(const iut_fl_semi_pm_set *T, int *out)
{
    int tmp[IUT_MAX_LPM + 1]; unsigned m = iut_fl_semi_pm_abs(T, tmp), n = 0;
    for (unsigned i = 0; i < m; ++i) if (tmp[i] != 0) out[n++] = tmp[i];
    return n;   /* T* = |T| ∖ {0}: l* elements */
}
void iut_labcusp_pm_torsor_make(const iut_initial_theta_data *d, iut_labcusp_pm_torsor *out)
{
    /* [IUTchI] Def 6.1 (ii),(iii): LabCusp±(†D_v) = cusps of the X̲_v-version †D^±_v, with the F_l^×-action
     * (as a set of labels: F_l), the zero element †η⁰_v and the ±-canonical element †η^±_v, well-defined up to ±1 */
    memset(out, 0, sizeof *out);
    out->nV = d->nV; out->size = d->l;
    for (unsigned i = 0; i < d->nV; ++i) { out->eta_zero[i] = 0; out->eta_pm[i] = 1; }
    out->aut_plus_index = 2;
}
int iut_labcusp_pm_forget(const iut_initial_theta_data *d, int t)
{
    /* Def 6.1 (iii): (LabCusp±(†D_v) ∖ {†η⁰_v})/{±1} ≅ LabCusp(†D_v) */
    if (!iut_label_in_Fl(d, t) || t == 0) return -1;
    return iut_label_abs(t);
}
void iut_sign_vector_make(const iut_initial_theta_data *d, const int *alpha, iut_sign_vector *out)
{
    memset(out, 0, sizeof *out);
    out->nV = d->nV; out->all_plus = 1; out->all_minus = 1;
    for (unsigned i = 0; i < d->nV; ++i) { out->alpha[i] = alpha ? (alpha[i] < 0 ? -1 : 1) : 1; if (out->alpha[i] < 0) out->all_plus = 0; else out->all_minus = 0; }
}
unsigned long long iut_sign_vector_count(const iut_initial_theta_data *d) { return 1UL << (d->nV < 63 ? d->nV : 63); }   /* |{±1}^V| */
void iut_prop_six_seven_apply(const iut_initial_theta_data *d, iut_prop_six_seven *out)
{
    /* [IUTchI] Prop 6.7: the D-Θ-bridge associated to a D-Θ±-bridge: restrict †D_T to T ∖ {0}, pass to the quotient
     * T* = (T ∖ {0})/{±1} (two strips ±t ↦ one strip |t| via the positive poly-isomorphisms), and send the two
     * strips †D_0, †D_⊞ to the single †D_>; +-full poly-isomorphisms are replaced by full ones at good v and by
     * the Ex 4.4 evaluation-section poly-morphisms at bad v.                                                */
    memset(out, 0, sizeof *out);
    out->n_from = d->l; out->n_to = d->lstar;
    unsigned n = 0;
    for (int t = -(int)d->lstar; t <= (int)d->lstar; ++t) if (t) { out->from[n] = t; out->to[n] = iut_label_abs(t); n++; }
    out->strips_identified = "†D_0, †D_⊞ ↦ †D_>"; out->poly_replaced = 1;
}
int iut_processions_compatible(const iut_initial_theta_data *d, iut_report *r)
{
    /* [IUTchI] Prop 6.9 (iii): via Prop 6.7, S*_j = {1..j} ↪ S^±_{j+1} = {0..j}: the j-th capsule of Prc(D_J) sits inside the (j+1)-st of Prc(D_T) */
    iut_procession nf, pm; iut_procession_build(d, IUT_PRC_NF, &nf); iut_procession_build(d, IUT_PRC_PM, &pm);
    int ok = pm.nsteps == nf.nsteps + 1;
    for (unsigned j = 0; ok && j < nf.nsteps; ++j) ok = (pm.size[j + 1] == nf.size[j] + 1) && pm.first_label[j + 1] == 0 && pm.last_label[j + 1] == nf.last_label[j];
    if (r) iut_report_add(r, ok ? IUT_SEV_OK : IUT_SEV_ERROR, "ProcessionsCompatible", "[IUTchI] Prop 6.9 (iii)", ok ? "S*_j ↪ S^±_{j+1} for j = 1..%u" : "processions do not match", nf.nsteps);
    return ok;
}
unsigned iut_half_plane_dictionary(iut_half_plane_row *out, unsigned max)
{
    static const iut_half_plane_row t[] = {
        { "additive symmetry F_l^{⋊±} (Θ±ell-HT, geometric)", "z ↦ ±z + a, the parabolic/translation symmetries", "V^± (basepoints via Aut_csp)", "the cusp at infinity; q = e^{2πiz}" },
        { "multiplicative symmetry F_l^* (ΘNF-HT, arithmetic)", "toral symmetries w = (z−i)/(z+i), rotations", "V^Bor (basepoints via the Borel subgroup)", "the node; w ↦ e^{iθ}w" },
        { "coric {±1} shared by both", "z ↦ −z̄ … the common {±1}", "V^±un = V^±", "—" },
    };
    unsigned n = 3 > max ? max : 3; memcpy(out, t, n * sizeof *out); return n;   /* [IUTchI] Rem 6.12.3, Fig 6.4 */
}
unsigned iut_ht_frobenioids(iut_ht_frobenioid_row *out, unsigned max)
{
    static const iut_ht_frobenioid_row t[] = {
        { "FPrimeStrip",    "{Π_v ↷ O▷_{F̄_v}}_{v∈V}",  "every F-prime-strip F_t, F_j, F_⊞, F_>",  "Kummer-ready" },
        { "FUnderV",        "F̲_v (tempered Frobenioid)", "v ∈ V^bad, inside F_>",                  "Kummer-ready" },
        { "FCircAstMod",    "F^⊛_mod",                   "NF-bridge target, restricted to terminal objects", "Kummer-blind" },
        { "FCircAstGlobal", "F^⊛",                       "NF-bridge target over D^⊛",               "Kummer-ready" },
        { "FCircAstPrime",  "F^⊛′",                      "over D^⊛_mod",                            "Kummer-ready" },
        { "FMonoGlobMod",   "F⊩_mod (and F⊩_tht)",       "the Θ-Hodge theater inside the ΘNF-HT",   "Kummer-blind (mono-analytic)" },
    };
    unsigned n = 6 > max ? max : 6; memcpy(out, t, n * sizeof *out); return n;   /* [IUTchI] Fig 6.6 */
}
