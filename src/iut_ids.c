/*
 * iut_ids.c — the table of English-letters-only identifiers for the
 * mathematical objects / notations of IUT whose printed names contain
 * non-letter symbols (†, ‡, ∗, ◦, •, ⊢, ⊩, ▶, ×, μ, ⊥, ±, ⋊, ⊞, ⊚, ⊛, Δ, >, ∞, …).
 *
 * Rules (see docs/IDENTIFIERS.md, generated from this file by `iut ids --md`):
 *   - an identifier matches ^[A-Za-z]+$  (no digits, no underscores, no Greek)
 *   - identifiers are unique case-insensitively (so LGP vs lgp, MOD vs mod,
 *     which Mochizuki distinguishes by case, get distinct words:
 *     LGPTorsor / LgpIdeal, MODTorsor / ModIdeal)
 *   - symbol → word dictionary:
 *       †  Dag        ‡  Ddag       ∗  Ast        ◦  Circ       •  Bullet
 *       ⊢  Mono       ⊩  MonoGlob   ▶  Val        ×  Units      ×μ UnitsModTors
 *       μ  Tors/Mu    ⊥  Perp       ±  Pm         ⋊  Semi       ⊞  BoxPlus
 *       ⊚  CircDot    ⊛  CircAst    Δ  Triangle (label) / Delta (geometric group)
 *       >  Gt         ∞  Inf        κ  Kappa      Θ  Theta      Π  Pi
 *       Ψ  Psi        Γ  Gamma      ε  Epsilon    ¯  Bar        _  Under
 *       ^gp Gp        ^pf Pf        ′  Prime      ¨  Ddot       tempered Tp
 *       numbers spelled out: Zero One TwoL JSq LStar LPm
 */
#include <ctype.h>
#include <string.h>
#include "iut.h"

#define ROW(id, notation, kind, ref, desc) { id, notation, kind, ref, desc }

const iut_ident iut_idents[] = {
/* ------------------------------------------------------------ symbols */
ROW("Dag",     "†",   "symbol", "[IUTchI] Cor 3.7; [IUTchIII] §I",  "left-hand (domain) copy of a Hodge theater / prime-strip across a Θ-link"),
ROW("Ddag",    "‡",   "symbol", "[IUTchI] Cor 3.7; [IUTchIII] §I",  "right-hand (codomain) copy of a Hodge theater / prime-strip across a Θ-link"),
ROW("Ast",     "∗",   "symbol", "[IUTchII] Cor 4.10; [IUTchIII] §1", "a further distinct copy (e.g. ∗HT, F∗) or a 'full' set F_l^∗"),
ROW("Circ",    "◦",   "symbol", "[IUTchIII] Thm 3.11",              "'any element of the vertical line': (n,◦) denotes the whole column"),
ROW("Bullet",  "•",   "symbol", "[IUTchIII] Fig I.1",               "vertex of the log-theta-lattice: one Θ±ell NF-Hodge theater"),
ROW("Mono",    "⊢",   "symbol", "[IUTchI] Fig I1.2",                "mono-analytic (forgetting the ring/holomorphic structure)"),
ROW("MonoGlob","⊩",   "symbol", "[IUTchI] Fig I1.2",                "mono-analytic with global realified Frobenioid"),
ROW("Val",     "▶",   "symbol", "[IUTchII] Def 4.9",                "value-group portion O▶ of a local monoid"),
ROW("Units",   "×",   "symbol", "[IUTchII] Def 4.9",                "unit-group portion O× of a local monoid"),
ROW("UnitsModTors","×μ","symbol","[IUTchII] Def 4.9",               "units modulo torsion O×μ = O×/Oμ"),
ROW("Tors",    "μ",   "symbol", "[IUTchII] Def 4.9",                "torsion (roots of unity) Oμ"),
ROW("Perp",    "⊥",   "symbol", "[IUTchII] Def 2.7",                "'perp'-superscript: the ±-synchronized / 'perfection-free' variant"),
ROW("Pm",      "±",   "symbol", "[IUTchI] §6",                      "plus-minus (the ±-symmetry, l±, Θ±)"),
ROW("Semi",    "⋊",   "symbol", "[IUTchI] §6",                      "semi-direct product, as in F_l^{⋊±}"),
ROW("BoxPlus", "⊞",   "symbol", "[IUTchI] Def 6.4, Def 6.11; [Alien] §3.6", "the label of the Θ±-bridge target F_⊞ / D_⊞ (additive side); the paper's own glyph for this label does not survive text extraction, so this toolkit writes it ⊞"),
ROW("CircDot", "⊚",   "symbol", "[IUTchI] §6",                      "the label ⊚ (D_⊚, D_⊚±) of the Θell-bridge target"),
ROW("CircAst", "⊛",   "symbol", "[IUTchI] §4",                      "the label ⊛ (D_⊛, F_⊛) of the NF-bridge target"),
ROW("Triangle","Δ",   "symbol", "[IUTchIII] Thm B; [IUTchII] Cor 4.10", "the label Δ obtained by identifying the labels 0 and F_l^* (F⊩_Δ)"),
ROW("Gt",      ">",   "symbol", "[IUTchI] §4; [Alien] §3.6",        "the label > of the Θ-bridge target F_> (multiplicative)"),
ROW("Inf",     "∞",   "symbol", "[IUTchII] §1",                     "the ∞-subscript: taking all N-th roots (∞θ, ∞κ, ∞H)"),
ROW("Kappa",   "κ",   "symbol", "[IUTchI] §5; [IUTchII] §3",        "κ-coric functions / κ-cuspidal structure"),
ROW("Under",   "_",   "symbol", "[IUTchI] Def 3.1",                 "underline, as in X̲, q̲_v, Θ̲_v, ε̲ ('underline' = the reduced/bar-free copy)"),
ROW("Bar",     "¯",   "symbol", "[IUTchI] Def 3.1",                 "overline: algebraic closure F̄, or a quotient such as O▷̄"),
ROW("Gp",      "^gp", "symbol", "[FrdI] §0",                        "groupification of a monoid"),
ROW("Pf",      "^pf", "symbol", "[FrdI] §0",                        "perfection of a monoid"),
ROW("Tp",      "tp",  "symbol", "[EtTh] §1",                        "tempered (tempered fundamental group Π^tp, tempered Frobenioid)"),
ROW("Prime",   "′",   "symbol", "[IUTchII] §4",                     "prime-superscript variant of an object"),
ROW("Ddot",    "¨",   "symbol", "[IUTchI] §6; [IUTchII] §2",        "double-dot: the ±-synchronized / 'doubly-dotted' copy (e.g. Ẍ, D̈)"),

/* ------------------------------------------------------- base fields etc */
ROW("Fmod",      "F_mod",     "field", "[IUTchI] Def 3.1",        "field of moduli of E_F (= Q(j_E) for Fmod = Q(j)); V_mod = V(F_mod)"),
ROW("FBarOverF", "F̄/F",      "field", "[IUTchI] Def 3.1",        "number field F with algebraic closure F̄; G_F = Gal(F̄/F)"),
ROW("KField",    "K = F(E[l])","field","[IUTchI] Def 3.1",        "the field obtained by adjoining the l-torsion of E_F"),
ROW("XF",        "X_F",       "curve", "[IUTchI] Def 3.1",        "once-punctured elliptic curve E_F \\ {origin}"),
ROW("CK",        "C_K",       "curve", "[IUTchI] Def 3.1",        "hyperbolic orbicurve X_K/±1 of type (1,l-tors)_±; must be a K-core"),
ROW("XUnderK",   "X̲_K",      "curve", "[IUTchI] Def 3.1",        "hyperbolic orbicurve of type (1,l-tors) (the Θ-data orbicurve)"),
ROW("XUnderUnderK","X̲̲_v",   "curve", "[IUTchI] Def 3.1",        "double-underline: the 'l-th power' covering at v ∈ Vbad used for the theta function"),
ROW("XDdotK",    "Ẍ_K",      "curve", "[IUTchI] §6",             "the ±-synchronized (doubly dotted) orbicurve of type (1,l-tors^Θ)_±"),
ROW("VSet",      "V",        "set",   "[IUTchI] Def 3.1",        "subset V ⊆ V(K) mapping bijectively to V_mod"),
ROW("VNon",      "V^non",    "set",   "[IUTchI] Def 3.1",        "nonarchimedean valuations of V"),
ROW("VArc",      "V^arc",    "set",   "[IUTchI] Def 3.1",        "archimedean valuations of V"),
ROW("VBadMod",   "V^bad_mod","set",   "[IUTchI] Def 3.1",        "nonempty set of odd nonarchimedean v of F_mod of bad multiplicative reduction, split in K"),
ROW("VGoodMod",  "V^good_mod","set",  "[IUTchI] Def 3.1",        "complement V_mod \\ V^bad_mod"),
ROW("VBad",      "V^bad",    "set",   "[IUTchI] Def 3.1",        "elements of V over V^bad_mod"),
ROW("VGood",     "V^good",   "set",   "[IUTchI] Def 3.1",        "elements of V over V^good_mod"),
ROW("EpsilonUnder","ε̲",     "datum", "[IUTchI] Def 3.1 (vi)",   "the 2-torsion-point / cusp label used to shift the evaluation points"),
ROW("QUnderV",   "q̲_v",     "datum", "[IUTchI] Ex 3.2",         "the 2l-th root of the q-parameter q_v at v ∈ V^bad: q̲_v = q_v^{1/2l}"),
ROW("ThetaUnderV","Θ̲_v",    "datum", "[IUTchI] Ex 3.2; [EtTh]", "the (reciprocal of the l-th root of the) theta function at v ∈ V^bad"),
ROW("LPrime",    "l",        "constant","[IUTchI] Def 3.1",      "the prime l ≥ 5 (stays a letter, listed for completeness)"),
ROW("LStar",     "l* = (l−1)/2","constant","[IUTchI] §0",        "l-star"),
ROW("LPm",       "l± = (l+1)/2","constant","[IUTchI] §0",        "l-plus-minus"),
ROW("TwoL",      "2l",       "constant","[IUTchI] Ex 3.2",       "the root order of q̲_v and the denominator of |log(q)|"),
ROW("JSq",       "j²",       "constant","[IUTchI] §I; [Alien] §2.5", "the exponent of q̲ in the j-th Θ-value / Gaussian monoid"),

/* ------------------------------------------------------- label sets      */
ROW("Fl",        "F_l",      "labelset","[IUTchI] §0",           "the field with l elements, {−l*,…,0,…,l*}, labels t of the Θ±ell-HT capsule"),
ROW("FlAbs",     "|F_l|",    "labelset","[IUTchI] §0",           "F_l/{±1} = {0,1,…,l*}"),
ROW("FlStar",    "F_l^*",    "labelset","[IUTchI] §0",           "F_l^×/{±1} = {1,…,l*}, labels j of the ΘNF-HT capsule"),
ROW("FlUnits",   "F_l^×",    "labelset","[IUTchI] §0",           "multiplicative group of F_l"),
ROW("FlSemiPm",  "F_l^{⋊±}", "symmetry","[IUTchI] §6; [Alien] §3.3 (ii)", "F_l ⋊ {±1}: additive / geometric symmetry (conjugate synchronization)"),
ROW("FlStarSym", "F_l^* ↷",  "symmetry","[IUTchI] §4; [Alien] §3.3 (ii)", "multiplicative / arithmetic symmetry on labels j"),
ROW("SPmJPlusOne","S^±_{j+1}","labelset","[IUTchI] Prop 6.9; [IUTchIII] §3", "procession container {0,1,…,j}"),
ROW("SJPlusOne", "S_{j+1}",  "labelset","[IUTchI] Prop 4.11",    "procession container {1,…,j+1} (multiplicative version)"),
ROW("LabelZero", "0 ∈ F_l",  "label",   "[IUTchI] §6",           "the zero label, identified with ⊞ and then with > under the gluing"),
ROW("LabelT",    "t ∈ F_l",  "label",   "[IUTchI] §6",           "capsule label of the Θ±ell-Hodge theater"),
ROW("LabelJ",    "j ∈ F_l^*","label",   "[IUTchI] §4",           "capsule label of the ΘNF-Hodge theater"),

/* ------------------------------------------------------- groups/monoids  */
ROW("PiV",       "Π_v",      "group",   "[IUTchI] Def 3.1",      "(tempered) arithmetic fundamental group at v (holomorphic, étale-like)"),
ROW("PiTpV",     "Π^tp_v",   "group",   "[EtTh] §1",             "tempered fundamental group at v ∈ V^bad"),
ROW("GV",        "G_v",      "group",   "[IUTchI] Def 3.1",      "absolute Galois group of K_v (mono-analytic, étale-like)"),
ROW("DeltaV",    "Δ_v",      "group",   "[IUTchI] §0",           "geometric fundamental group, kernel of Π_v ↠ G_v"),
ROW("PiXK",      "Π_{X_K}",  "group",   "[IUTchI] §6",           "arithmetic fundamental group of X_K (D_⊚)"),
ROW("PiCK",      "Π_{C_K}",  "group",   "[IUTchI] §4",           "arithmetic fundamental group of C_K (D_⊛)"),
ROW("OValV",     "O▷_{F̄_v}","monoid",  "[IUTchI] Ex 3.2",       "multiplicative monoid of nonzero integers of F̄_v"),
ROW("OUnitsV",   "O×",       "monoid",  "[IUTchII] Def 4.9",     "unit group"),
ROW("OUnitsModTorsV","O×μ",  "monoid",  "[IUTchII] Def 4.9",     "units modulo torsion"),
ROW("OTorsV",    "Oμ",       "monoid",  "[IUTchII] Def 4.9",     "roots of unity"),
ROW("OValgroupV","O▶",       "monoid",  "[IUTchII] Def 4.9",     "value group portion O▷/O×"),
ROW("Ism",       "Ism",      "group",   "[IUTchII] Ex 1.8 (iv)", "isometries of O×μ (the Ind2 indeterminacy group)"),
ROW("ZHatUnits", "Ẑ×",       "group",   "[IUTchII] Rem 1.11.1",  "profinite units acting on Kummer classes (Ind2, ×-Kummer)"),
ROW("PsiTheta",  "Ψ_Θ",      "monoid",  "[IUTchII] Cor 2.8",     "theta monoid (mono-theta environment)"),
ROW("PsiGau",    "Ψ_gau",    "monoid",  "[IUTchII] Cor 3.6",     "Gaussian monoid {q̲^{j²}}"),
ROW("PsiLGP",    "Ψ_LGP",    "monoid",  "[IUTchIII] Prop 3.4",   "log-Gaussian procession monoid"),
ROW("PsiPerpEnvInf","Ψ^⊥_{∞env}","monoid","[IUTchII] Cor 4.10",  "'perp'-infinite theta-environment monoid"),
ROW("PsiPerpGauInf","Ψ^⊥_{∞gau}","monoid","[IUTchII] Cor 4.10",  "'perp'-infinite Gaussian monoid"),
ROW("FmodUnits", "F_mod^×",  "group",   "[IUTchI] §5; [IUTchIII] Thm 3.11 (c)", "copies (F_mod^×)_j of the multiplicative group of F_mod"),
ROW("MODTorsor", "F⊩_MOD / M^MOD", "monoid","[IUTchIII] Def 3.8", "global Frobenioid of F_mod^×-torsors of arithmetic line bundles (multiplicative, 'MOD')"),
ROW("ModIdeal",  "F⊩_mod / M^mod", "monoid","[IUTchIII] Def 3.8", "global Frobenioid via local fractional ideals ('mod', lower-case)"),

/* ------------------------------------------------------- prime-strips    */
ROW("DPrimeStrip",          "D-prime-strip",     "primestrip","[IUTchI] Fig I1.2", "{Π_v}: holomorphic, étale-like"),
ROW("DMonoPrimeStrip",      "D⊢-prime-strip",    "primestrip","[IUTchI] Fig I1.2", "{G_v}: mono-analytic, étale-like, bi-coric"),
ROW("FPrimeStrip",          "F-prime-strip",     "primestrip","[IUTchI] Fig I1.2", "{Π_v ↷ O▷}: holomorphic, Frobenius-like"),
ROW("FMonoPrimeStrip",      "F⊢-prime-strip",    "primestrip","[IUTchI] Fig I1.2", "{G_v ↷ O▷ split}: mono-analytic, Frobenius-like"),
ROW("FMonoUnitsPrimeStrip", "F⊢×-prime-strip",   "primestrip","[IUTchII] Def 4.9", "{G_v ↷ O×}: unit portion"),
ROW("FMonoUnitsModTorsPrimeStrip","F⊢×μ-prime-strip","primestrip","[IUTchII] Def 4.9; [IUTchIII] Thm 1.5", "{G_v ↷ O×μ} with ×μ-Kummer structure; horizontally coric"),
ROW("FMonoValUnitsModTorsPrimeStrip","F⊢▶×μ-prime-strip","primestrip","[IUTchII] Def 4.9", "{G_v ↷ O▶ × O×μ}"),
ROW("FMonoGlobPrimeStrip",  "F⊩-prime-strip",    "primestrip","[IUTchI] Fig I1.2", "F⊢ plus global realified Frobenioid C⊩ with Prime(C⊩) → V"),
ROW("FMonoGlobValUnitsModTorsPrimeStrip","F⊩▶×μ-prime-strip","primestrip","[IUTchII] Def 4.9", "F⊢▶×μ plus global realified Frobenioid; carries the pilot objects"),
ROW("UnitsModTorsKummer",   "×μ-Kummer structure","structure","[IUTchII] Def 4.9 (i)", "Ism-orbit of isomorphisms O×μ ≅ étale-like O×μ"),
ROW("UnitsKummer",          "×-Kummer structure","structure","[IUTchII] Def 4.9 (i)", "unique Kummer isomorphism on O×"),
ROW("CMonoGlob",            "C⊩",                "frobenioid","[IUTchI] Def 5.2",  "global realified Frobenioid"),
ROW("PrimeCMonoGlob",       "Prime(C⊩)",         "set",       "[IUTchI] Def 5.2",  "set of primes of C⊩, in bijection with V"),
ROW("RhoV",                 "ρ_v",               "map",       "[IUTchI] Def 5.2",  "isomorphisms of topological monoids gluing local and global portions"),

/* ------------------------------------------------------- Hodge theaters  */
ROW("ThetaHodgeTheater",        "Θ-Hodge theater",         "hodgetheater","[IUTchI] Def 3.6",   "(F⊩_mod, F⊩_tht) modelling the q-parameters and theta function"),
ROW("ThetaPmEllHodgeTheater",   "Θ±ell-Hodge theater",     "hodgetheater","[IUTchI] Def 6.13",  "additive / geometric: Θ±-bridge, Θell-bridge, capsule indexed by F_l"),
ROW("ThetaNFHodgeTheater",      "ΘNF-Hodge theater",       "hodgetheater","[IUTchI] Def 4.6, 5.5", "multiplicative / arithmetic: Θ-bridge, NF-bridge, capsule indexed by F_l^*"),
ROW("ThetaPmEllNFHodgeTheater", "Θ±ell NF-Hodge theater",  "hodgetheater","[IUTchI] Def 6.13 (iii)", "Θ±ell-HT glued to ΘNF-HT along 0,⊞ ↦ >; a vertex • of the log-theta-lattice"),
ROW("DThetaPmEllNFHodgeTheater","D-Θ±ell NF-Hodge theater","hodgetheater","[IUTchI] Def 6.13", "base-category (étale-like) version; vertically coric"),
ROW("DagHodgeTheater",          "†HT",                     "hodgetheater","[IUTchI] Cor 3.7",   "the dagger (domain) copy of a Hodge theater"),
ROW("DdagHodgeTheater",         "‡HT",                     "hodgetheater","[IUTchI] Cor 3.7",   "the double-dagger (codomain) copy"),
ROW("NMHodgeTheater",           "{n,m}HT",                 "hodgetheater","[IUTchIII] Def 1.4", "the Hodge theater at coordinate (n,m) of the log-theta-lattice"),
ROW("ThetaPmBridge",            "Θ±-bridge",               "bridge",      "[IUTchI] Def 6.4",   "F_T → F_⊞ : the capsule of F-prime-strips to the ⊞-strip"),
ROW("ThetaEllBridge",           "Θell-bridge",             "bridge",      "[IUTchI] Def 6.4",   "D_T → D_⊚± : the capsule to Π_{X_K} (ell = elliptic)"),
ROW("ThetaBridge",              "Θ-bridge",                "bridge",      "[IUTchI] Def 4.1 / 5.5", "F_J → F_> : capsule of F-prime-strips to the >-strip"),
ROW("NFBridge",                 "NF-bridge",               "bridge",      "[IUTchI] Def 4.1 / 5.5", "F_J → F_⊛ : capsule to Π_{C_K} and F_mod^× (NF = number field)"),
ROW("FBoxPlus",                 "F_⊞",                     "primestrip",  "[IUTchI] §6",        "target F-prime-strip of the Θ±-bridge"),
ROW("DCircDotPm",               "D_⊚±",                    "primestrip",  "[IUTchI] §6",        "target D-prime-strip of the Θell-bridge (Π_{X_K})"),
ROW("FGt",                      "F_>",                     "primestrip",  "[IUTchI] §4",        "target F-prime-strip of the Θ-bridge"),
ROW("FCircAst",                 "F_⊛",                     "primestrip",  "[IUTchI] §5",        "target of the NF-bridge (Π_{C_K} ↷ F_mod^×)"),
ROW("FT",                       "F_T",                     "capsule",     "[IUTchI] §6",        "capsule of F-prime-strips indexed by T = F_l"),
ROW("FJ",                       "F_J",                     "capsule",     "[IUTchI] §4",        "capsule of F-prime-strips indexed by J = F_l^*"),
ROW("GluingZeroBoxPlusToGt",    "0,⊞ ↦ >",                 "gluing",      "[IUTchI] Def 6.13 (iii); [Alien] §3.6", "identification of the label 0 ∈ F_l and ⊞ with > (F_l ⊇ F_l^× ↠ F_l^*)"),
ROW("FMonoGlobTriangle",        "F⊩_Δ",                    "primestrip",  "[IUTchII] Cor 4.10 (i); [IUTchIII] Thm B", "F⊩-prime-strip for the label Δ (0 and F_l^* identified); home of the q-pilot"),
ROW("FMonoGlobEnv",             "F⊩_env",                  "primestrip",  "[IUTchII] Cor 4.10 (ii)", "theta-monoid version"),
ROW("FMonoGlobGau",             "F⊩_gau",                  "primestrip",  "[IUTchII] Cor 4.10 (ii)", "Gaussian-monoid version"),
ROW("FMonoGlobLGPTorsor",       "F⊩_LGP",                  "primestrip",  "[IUTchIII] Def 3.8 (ii)", "log-Gaussian-procession version (via MOD, F_mod^×-torsors)"),
ROW("FMonoGlobLgpIdeal",        "F⊩_lgp",                  "primestrip",  "[IUTchIII] Def 3.8 (ii)", "log-Gaussian-procession version (via mod, local fractional ideals)"),
ROW("FMonoGlobMod",             "F⊩_mod",                  "primestrip",  "[IUTchI] Def 3.6",   "F⊩-prime-strip of the Θ-Hodge theater carrying q̲_v"),
ROW("FMonoGlobTht",             "F⊩_tht",                  "primestrip",  "[IUTchI] Def 3.6",   "F⊩-prime-strip of the Θ-Hodge theater carrying Θ̲_v"),
ROW("DGt",                      "D_>",                     "primestrip",  "[IUTchI] §4",        "D-prime-strip of the label >"),
ROW("DMonoGt",                  "D⊢_>",                    "primestrip",  "[IUTchII] Cor 4.10", "D⊢-prime-strip of the label >"),
ROW("DMonoTriangle",            "D⊢_Δ",                    "primestrip",  "[IUTchIII] Thm 1.5", "D⊢-prime-strip of the label Δ (bi-coric)"),

/* ------------------------------------------------------- links           */
ROW("ThetaLink",                    "Θ-link",          "link", "[IUTchI] Cor 3.7",        "†F⊩_tht ≅ ‡F⊩_mod : glues Θ̲_v to q̲_v, full poly-isomorphism of F⊩-prime-strips"),
ROW("ThetaUnitsModTorsLink",        "Θ×μ-link",        "link", "[IUTchII] Cor 4.10 (iii)","Θ-link on F⊩▶×μ-prime-strips, units modulo torsion"),
ROW("ThetaUnitsModTorsGauLink",     "Θ×μ_gau-link",    "link", "[IUTchII] Cor 4.10 (iii)","Gaussian version: {q̲_v^{j²}} ↦ {q̲_v}"),
ROW("ThetaUnitsModTorsLGPTorsorLink","Θ×μ_LGP-link",   "link", "[IUTchIII] Def 3.8 (ii)", "log-Gaussian-procession version (MOD)"),
ROW("ThetaUnitsModTorsLgpIdealLink","Θ×μ_lgp-link",    "link", "[IUTchIII] Def 3.8 (ii)", "log-Gaussian-procession version (mod)"),
ROW("LogLink",                      "log-link",        "link", "[IUTchIII] Def 1.1, Prop 1.3", "{n,m}HT → {n,m+1}HT via log: O× → K_v (ring structures not identified)"),
ROW("DThetaPmEllNFLink",            "D-Θ±ell NF-link", "link", "[IUTchI] Cor 6.10",       "link between D-Θ±ell NF-Hodge theaters (the étale picture)"),
ROW("EtalePicture",                 "étale-picture",   "diagram","[IUTchIII] Cor 3.12; [IUTchI] Cor 6.10", "D⊢-prime-strips (coric) radiating to the Hodge theaters: the multiradial picture"),
ROW("FrobeniusPicture",             "Frobenius-picture","diagram","[IUTchIII] Def 1.4",     "the log-theta-lattice as a diagram of Frobenius-like objects"),
ROW("LogThetaLattice",              "log-theta-lattice","lattice","[IUTchIII] Def 1.4, 3.8 (iii)", "Z²-indexed diagram of Θ±ell NF-HTs: vertical log-links, horizontal Θ×μ_LGP-links"),
ROW("LGPTorsorGaussianLogThetaLattice", "LGP-Gaussian log-theta-lattice","lattice","[IUTchIII] Def 3.8 (iii)", "the version with Θ×μ_LGP-links (used in Thm 3.11)"),
ROW("LgpIdealGaussianLogThetaLattice",  "lgp-Gaussian log-theta-lattice","lattice","[IUTchIII] Def 3.8 (iii)", "the version with Θ×μ_lgp-links"),
ROW("InfiniteH",                    "∞H",              "lattice","[EssLgc] §3.10; [Alien] §3.11 Fig 3.14", "the two columns (0,◦),(1,◦) joined by a single Θ-link (0,0)→(1,0)"),
ROW("VerticallyCoric",              "vertically coric","property","[IUTchIII] Thm 1.5 (i)", "invariant under log-links (étale-like data D, D⊢, étale log-shells)"),
ROW("HorizontallyCoric",            "horizontally coric","property","[IUTchIII] Thm 1.5 (ii)","invariant under Θ×μ-links (F⊢×μ-prime-strips, D⊢)"),
ROW("BiCoric",                      "bi-coric",        "property","[IUTchIII] Thm 1.5 (iii)","both: D⊢-prime-strips and mono-analytic log-shells"),
ROW("KummerDetachment",             "Kummer-detachment","indeterminacy","[IUTchIII] Rem 1.5.4", "detaching Frobenius-like data from étale-like data via Kummer theory"),

/* ------------------------------------------------------- log-shells      */
ROW("LogShell",              "I = log-shell",      "logshell","[IUTchIII] Def 1.1 (i); [AbsTopIII] Def 5.4 (iii)", "I_v = (p*)^{-1}·log(O×_{K_v}) ⊆ K_v, a compact container"),
ROW("HolLogShell",           "I (holomorphic)",    "logshell","[IUTchIII] Prop 1.2",    "log-shell constructed from an F-prime-strip"),
ROW("MonoLogShell",          "I⊢ (mono-analytic)", "logshell","[IUTchIII] Prop 1.2",    "log-shell constructed from an F⊢×μ- or D⊢-prime-strip (bi-coric)"),
ROW("FrobLogShell",          "I (Frobenius-like)", "logshell","[IUTchIII] Prop 1.2 (ii)","Frobenius-like log-shell"),
ROW("EtLogShell",            "I(D) (étale-like)",  "logshell","[IUTchIII] Prop 1.2 (iii)","étale-like log-shell, vertically coric"),
ROW("PStar",                 "p*",                 "constant","[IUTchIII] Def 1.1 (i)", "p* = p for p odd, p* = p² for p = 2"),
ROW("LogKummerCorrespondence","log-Kummer correspondence","structure","[IUTchIII] Prop 3.5; Thm 3.11 (ii)", "compatible Kummer isomorphisms along a vertical line, upper semi-compatible"),
ROW("UpperSemiCompatibility","upper semi-compatibility","indeterminacy","[IUTchIII] Thm 3.11 (ii)", "the log-shells contain the images at all stages (the source of Ind3)"),
ROW("TensorPacket",          "tensor packet",      "structure","[IUTchIII] Prop 3.1, 3.2","tensor product of log-shells over the labels of S^±_{j+1}"),
ROW("Procession",            "procession",         "structure","[IUTchI] Prop 4.11, 6.9", "chain of capsules S_1 ⊂ S_2 ⊂ … of (D⊢-)prime-strips"),
ROW("HolomorphicHull",       "holomorphic hull",   "structure","[IUTchIII] Rem 3.9.5; [Alien] §3.7 (iv)", "smallest holomorphic region containing the Ind1-3 orbit; adds the log(d^K) terms"),

/* ------------------------------------------------------- pilots / volume */
ROW("QPilot",          "q-pilot",       "pilot",   "[IUTchIII] Def 3.8 (i)",      "object of F⊩_Δ determined by {q̲_v}_{v ∈ V^bad}"),
ROW("ThetaPilot",      "Θ-pilot",       "pilot",   "[IUTchIII] Def 3.8 (i)",      "object of F⊩_gau/LGP determined by {q̲_v^{j²}}_{j=1..l*}"),
ROW("AbsLogQ",         "|log(q)|",      "quantity","[IUTchIII] Cor 3.12",         "log-volume of the q-pilot = log(q)/(2l) (q-divisor normalized degree)"),
ROW("AbsLogTheta",     "|log(Θ)|",      "quantity","[IUTchIII] Cor 3.12",         "log-volume of the Ind1-3-hull of the Θ-pilot"),
ROW("LogVolume",       "μ_log",         "quantity","[IUTchIII] Prop 3.9; [IUTchIV] Prop 1.2", "normalized log-volume on log-shells / tensor packets"),
ROW("CTheta",          "C_Θ",           "quantity","[IUTchIII] Cor 3.12; [IUTchIV] Thm 1.10", "the constant with −|log(Θ)| ≥ −|log(q)| ⇔ C_Θ ≥ −1"),
ROW("LogDK",           "log(d^K)",      "quantity","[IUTchIV] §1",                "normalized log-different of K"),
ROW("LogFK",           "log(f^K)",      "quantity","[IUTchIV] §1",                "normalized log-conductor of E over K"),
ROW("LogQ",            "log(q)",        "quantity","[IUTchIV] §1",                "normalized degree of the q-divisor (6 × height)"),
ROW("HtE",             "ht_E = (1/6)log(q)","quantity","[IUTchIV] Thm 1.10; [GenEll]", "the height of E_F"),
ROW("MultiradialRepresentation","R^LGP_{n,◦}","structure","[IUTchIII] Thm 3.11 (i)", "tensor packets + splitting monoids + copies of F_mod^×, up to Ind1-3"),
ROW("IndOne",          "(Ind1)",        "indeterminacy","[IUTchIII] Thm 3.11 (i)", "automorphisms of processions of D⊢-prime-strips (perms of S^±_{j+1}, Aut(G_v))"),
ROW("IndTwo",          "(Ind2)",        "indeterminacy","[IUTchIII] Thm 3.11 (i)", "Ism-indeterminacies of the ×μ-Kummer structures"),
ROW("IndThree",        "(Ind3)",        "indeterminacy","[IUTchIII] Thm 3.11 (ii)","upper semi-compatibility of the log-Kummer correspondence"),
ROW("CorThreeTwelve",  "[IUTchIII] Cor 3.12","theorem","[IUTchIII] Cor 3.12",    "−|log(Θ)| ≥ −|log(q)| (the log-volume estimate)"),
ROW("ThmThreeEleven",  "[IUTchIII] Thm 3.11","theorem","[IUTchIII] Thm 3.11",    "multiradial algorithms for the Θ-pilot (the 'main theorem')"),
ROW("ThmOneTen",       "[IUTchIV] Thm 1.10", "theorem","[IUTchIV] Thm 1.10",     "the Diophantine inequality derived from Cor 3.12"),
ROW("ThmA",            "[ExpEst] Thm A",     "theorem","[ExpEst] Thm A",         "effective ABC inequality (|abc| ≤ 2^4 max{exp(1.7·10^30 ε^{−166/81}), rad(abc)^{3(1+ε)}})"),
ROW("ThmB",            "[ExpEst] Thm B",     "theorem","[ExpEst] Thm B",         "FLT holds for primes p > 1.615·10^14"),

/* ------------------------------------------------------- species         */
ROW("ZeroSpecies",     "0-species",       "species","[IUTchIV] Def 3.1 (i)",  "set-theoretic formula Φ0(E) defining the 'objects'"),
ROW("OneSpecies",      "1-species",       "species","[IUTchIV] Def 3.1 (ii)", "set-theoretic formula Φ1(E,F,M) defining the 'morphisms'"),
ROW("SpeciesObject",   "species-object",  "species","[IUTchIV] Def 3.1 (iii)","a set E satisfying Φ0 in a model of ZFCG"),
ROW("SpeciesMorphism", "species-morphism","species","[IUTchIV] Def 3.1 (iii)","a set M satisfying Φ1"),
ROW("Mutation",        "mutation",        "mutation","[IUTchIV] Def 3.3 (i)", "species-theoretic functor between species"),
ROW("MorphismOfMutations","morphism of mutations","mutation","[IUTchIV] Def 3.3 (ii)", "species-theoretic natural transformation"),
ROW("MutationHistory", "mutation-history","mutation","[IUTchIV] Def 3.3 (iii)","oriented graph Γ with species at vertices and mutations at edges (e.g. the log-theta-lattice)"),
ROW("Observable",      "observable",      "mutation","[IUTchIV] Def 3.3 (iv)", "compatible collection of mutations S_v → S_obs over a mutation-history"),
ROW("Core",            "core",            "mutation","[IUTchIV] Def 3.3 (v)",  "observable all of whose mutations are isomorphisms (coric data)"),
ROW("ZFCG",            "ZFCG",            "species","[IUTchIV] §3",            "ZFC + Grothendieck's axiom on universes"),
ROW("AlienCopy",       "alien copy",      "mutation","[Alien] §1, §3",         "a copy of a ring/scheme theory related to another only via a non-ring-theoretic link"),
ROW("BasicPrimeStrip", "BPS = F⊢×μ",      "primestrip","[FormIUT] §1",         "'basic prime-strip': the F⊢×μ-prime-strip (horizontally coric gluing datum)"),
ROW("EtaleHodgeTheater","etHT",           "hodgetheater","[FormIUT] §1",       "étale-like Hodge theater (D-Θ±ell NF-HT) in the Formalization paper's notation"),
ROW("InitialThetaData","(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)","datum","[IUTchI] Def 3.1", "a collection of initial Θ-data: the input of the whole theory"),
ROW("NCircColumn",     "(n,◦)",           "lattice","[IUTchIII] Thm 3.11; [EssLgc] §3.6", "the whole vertical line n of the log-theta-lattice, i.e. its vertically coric (étale-like) data"),
ROW("Multiradial",     "multiradial",     "property","[IUTchII] Ex 1.7; [Alien] §3.1, Fig 3.1", "a radial algorithm compatible with arbitrary permutations of the radial data over the coric data (parallel transport)"),
ROW("Uniradial",       "uniradial",       "property","[IUTchII] Ex 1.7; [Alien] §3.1, Fig 3.1", "a radial algorithm that is not multiradial (e.g. holomorphic structures)"),
/* ------------------------------------------- [IUTchI] read from the paper (src/iut_i.h) */
/* §0 */
ROW("PseudoMonoid",     "pseudo-monoid",      "monoid",   "[IUTchI] §0",                 "topological space with a partially defined multiplication; divisible if every element has N-th roots; cyclotomic if it contains μ_∞ ≅ Q/Z"),
ROW("Isomorph",         "isomorph",           "structure","[IUTchI] §0",                 "an object isomorphic to a given one, with the isomorphism forgotten (e.g. M^⊛ is an isomorph of F̄×)"),
ROW("PolyMorphism",     "poly-morphism",      "morphism", "[IUTchI] §0",                 "a set of morphisms A → B; composites are sets of composites, multiplicities ignored"),
ROW("PolyIsomorphism",  "poly-isomorphism",   "morphism", "[IUTchI] §0",                 "a poly-morphism all of whose constituents are isomorphisms"),
ROW("FullPolyIsomorphism","full poly-isomorphism","morphism","[IUTchI] §0",              "the set of ALL isomorphisms A ≅ B (the Θ-link, the Θ-bridge at good v, the D-links are of this kind)"),
ROW("PolyAutomorphism", "poly-automorphism",  "morphism", "[IUTchI] §0; Ex 6.2 (ii)",    "a poly-isomorphism of an object with itself, e.g. −1_{F_l} of Ex 6.2"),
ROW("PlusFullPolyIsomorphism","+-full poly-isomorphism","morphism","[IUTchI] Def 6.1 (iv)", "between D-prime-strips: at each v the Aut_+-orbit (positive) or Aut_−-orbit (negative) of an isomorphism; α-signed for α ∈ {±1}^V"),
ROW("CapsuleFullPolyMorphism","capsule-full poly-morphism","morphism","[IUTchI] §0",     "morphism of capsules whose constituent poly-morphisms are full poly-isomorphisms"),
ROW("CapsuleFullPolyIsomorphism","capsule-full poly-isomorphism","morphism","[IUTchI] §0","capsule-full poly-morphism with bijective index map"),
ROW("Capsule",          "capsule {A_j}_{j∈J}","capsule",  "[IUTchI] §0",                 "finite collection of objects indexed by a finite set J (a |J|-capsule); morphism = injection of index sets + morphisms of members"),
ROW("BPi",              "B(Π)",               "anabelioid","[IUTchI] §0",                "the connected anabelioid (Galois category) of finite sets with continuous Π-action"),
ROW("BX",               "B(X)",               "anabelioid","[IUTchI] §0",                "the anabelioid of finite étale coverings of a connected scheme / orbicurve X"),
ROW("BXZero",           "B(X)^0",             "anabelioid","[IUTchI] §0; Ex 3.2–3.3; Def 4.1 (v)", "the connected component of B(X); D_v = B(X→_v)^0, D^⊛ = B(C̲_K)^0, D^⊚± = B(X̲_K)^0"),
ROW("BTemp",            "B^temp(Π)",          "anabelioid","[IUTchI] §0; Ex 3.2",        "the connected temperoid of a tempered group Π; D_v = B^temp(X̲̲_v)^0 at v ∈ V^bad"),
ROW("Temperoid",        "connected temperoid","anabelioid","[IUTchI] §0; [SemiAnbd]",    "the category of tempered coverings; the tempered fundamental group is recovered from it"),
ROW("NF",               "NF",                 "field",    "[IUTchI] §0",                 "number field: a finite extension of Q"),
ROW("MLF",              "MLF",                "field",    "[IUTchI] §0",                 "mixed-characteristic local field: a finite extension of Q_p (K_v for v ∈ V^non)"),
ROW("CAF",              "CAF",                "field",    "[IUTchI] §0; Ex 3.4",         "complex archimedean field: a topological field isomorphic to C (K_v for v ∈ V^arc)"),
ROW("PV",               "p_v",                "constant", "[IUTchI] §0",                 "the residue characteristic of v ∈ V^non; by convention p_v = e at archimedean v"),
/* §1 */
ROW("COrbicurve",       "C = X/{±1}",         "curve",    "[IUTchI] §1",                 "hyperbolic orbicurve of type (1,1)±: the quotient of the once-punctured elliptic curve by the inversion"),
ROW("XArrow",           "X→",                 "curve",    "[IUTchI] Def 1.1; Rem 1.2.1", "hyperbolic orbicurve of type (1,l-tors→): cyclic covering of X̲ of degree l determined by the section σ; Aut_k(X→) ≅ Z/2l"),
ROW("CArrow",           "C→",                 "curve",    "[IUTchI] Def 1.1; Rem 1.2.1", "hyperbolic orbicurve of type (1,l-tors→)±: cyclic covering of C̲ of degree l; Aut_k(C→) ≅ Z/l; D_v = B(X→_v)^0 at good v"),
ROW("CUnderV",          "C̲_v",               "curve",    "[IUTchI] Def 3.1 (b); Ex 4.4", "hyperbolic orbicurve of type (1,Z/l)± over K_v, v ∈ V^bad; its cusps are labelled by |F_l|"),
ROW("CUnderUnderV",     "C̲̲_v",              "curve",    "[IUTchI] Def 3.1 (b)",        "hyperbolic orbicurve of type (1,(Z/l)^Θ)± over K_v: model of C̲_v for the theta function"),
ROW("OrbicurveType",    "(1,l-tors), (1,l-tors)±, (1,l-tors→), (1,(Z/l)^Θ)…", "structure", "[IUTchI] §1; Def 1.1; Def 3.1", "the types of hyperbolic orbicurves of genus 1 with l-torsion level structure used in IUT"),
ROW("CuspEpsilon",      "ε",                  "cusp",     "[IUTchI] §1",                 "a nonzero cusp of C̲ (its label in F_l^*); ε̲ of Def 3.1 (f) is the corresponding cusp of C̲_K"),
ROW("CuspEpsilonPrime", "ε′",                 "cusp",     "[IUTchI] §1",                 "one of the two cusps of X̲ over ε (label +ε)"),
ROW("CuspEpsilonDoublePrime","ε″",            "cusp",     "[IUTchI] §1",                 "the other cusp of X̲ over ε (label −ε); ι swaps ε′ and ε″"),
ROW("CuspTwoEpsilon",   "2ε",                 "cusp",     "[IUTchI] §1",                 "the cusp 2ε (2 ≢ ±1 mod l) whose decomposition group gives the normal section σ : G_k → J_C"),
ROW("CuspZero",         "0 (cusp)",           "cusp",     "[IUTchI] §1; Def 6.1 (ii)",   "the cusp of X̲ fixed by ι: the zero element †η⁰_v of LabCusp±"),
ROW("InertiaEpsilonPrime","I_ε′ × I_ε″",      "group",    "[IUTchI] §1",                 "inertia groups of the cusps ε′, ε″ in Δ_ε: 0 → I_ε′ × I_ε″ → Δ_ε → Δ_E ⊗ Z/l → 0"),
ROW("DeltaEpsilon",     "Δ_ε",                "group",    "[IUTchI] §1",                 "the geometric fundamental group of X̲ minus the cusps ε′, ε″; Δ_ε ≅ Δ_ε^+ × Δ_ε^−"),
ROW("DeltaE",           "Δ_E ⊗ Z/l",          "group",    "[IUTchI] §1",                 "the l-torsion of the geometric fundamental group of the elliptic curve (order l²); ι acts as −1"),
ROW("JX",               "J_X",                "group",    "[IUTchI] §1",                 "the quotient Π_X̲ ↠ J_X by Δ_ε → Δ_E ⊗ Z/l, an extension of G_k by Δ_E ⊗ Z/l"),
ROW("JC",               "J_C",                "group",    "[IUTchI] §1",                 "the quotient Π_C̲ ↠ J_C; J_X ⊆ J_C of index 2"),
ROW("SectionSigma",     "σ : G_k → J_C",      "map",      "[IUTchI] §1",                 "the normal section determined by the cusp 2ε; Im(σ) ⊆ J_X defines X→ and C→"),
ROW("IotaInvolution",   "ι",                  "symmetry", "[IUTchI] §1",                 "the involution of X̲ over C̲: swaps I_ε′ and I_ε″, acts as −1 on Δ_E ⊗ Z/l"),
ROW("HSubgroup",        "H = Ker(Δ_X ↠ Δ_X^ab ⊗ Z/l)","group","[IUTchI] Cor 1.2",       "the kernel used in the reconstruction Π_X̲ = Π_X→ · H"),
ROW("PiXArrow",         "Π_X→",               "group",    "[IUTchI] Cor 1.2",            "arithmetic fundamental group of X→; from it Π_X̲, Π_C→, Π_C̲ are reconstructed group-theoretically"),
ROW("PiCArrow",         "Π_C→",               "group",    "[IUTchI] Cor 1.2",            "arithmetic fundamental group of C→: Gal(X→/C→) ≅ Z/2 is the unique maximal subgroup of odd index of Gal(X→/C̲) ≅ Z/2l"),
ROW("PiXUnder",         "Π_X̲",               "group",    "[IUTchI] §1; Cor 1.2",        "arithmetic fundamental group of X̲ (Π_{X̲_K} over K)"),
ROW("PiCUnder",         "Π_C̲",               "group",    "[IUTchI] §1; Cor 1.2",        "arithmetic fundamental group of C̲ (Π_{C̲_K} over K)"),
ROW("CorOneTwo",        "[IUTchI] Cor 1.2",   "theorem",  "[IUTchI] Cor 1.2",            "characteristic nature of coverings: functorial group-theoretic reconstruction of Π_X̲, Π_C→, Π_C̲ from Π_X→; l from l² = [Δ_X : Δ_X→]"),
/* §2 */
ROW("PiTpG",            "Π^tp_G",             "group",    "[IUTchI] §2",                 "tempered fundamental group of a semi-graph of anabelioids G (pro-Σ), dense in the profinite Π_G"),
ROW("PiGProfinite",     "Π_G",                "group",    "[IUTchI] §2",                 "profinite completion of Π^tp_G"),
ROW("TemperedConjugates","[IUTchI] Prop 2.1", "theorem",  "[IUTchI] Prop 2.1",           "a Π_G-conjugate of a nontrivial compact subgroup of Π^tp_G that lies in Π^tp_G is a Π^tp_G-conjugate"),
ROW("CommensurablyTerminal","commensurably terminal","property","[IUTchI] Prop 2.2",     "Π^tp_X ⊆ Π_X is commensurably terminal"),
ROW("TemperedSubcover", "Δ^tp_{X,H}",         "group",    "[IUTchI] Cor 2.3",            "the tempered group of the covering of X determined by an open H ⊆ Π_X"),
ROW("TemperedVerticialEdge","verticial / edge-like subgroups","group","[IUTchI] Prop 2.4", "the subgroups of Π^tp associated to the vertices / edges of the dual graph, characterized profinitely"),
ROW("DecompositionSynchronized","[IUTchI] Cor 2.5","theorem","[IUTchI] Cor 2.5",        "a decomposition / inertia group of Π_X contained in Π^tp_X is a tempered one: the conjugacy indeterminacies of tempered and profinite cusps agree"),
ROW("DiscreteAnalogue", "[IUTchI] Thm 2.6",   "theorem",  "[IUTchI] Thm 2.6; Lem 2.7; Cor 2.8", "the discrete (topological fundamental group) analogues of Props 2.1–2.5"),
ROW("GaloisCountable",  "Galois-countable",   "property", "[IUTchI] Rem 2.5.3",          "conditions (T1)–(T6) on a topological group under which the tempered theory works; effects (E1)–(E9)"),
/* §3 */
ROW("DefThreeOne",      "[IUTchI] Def 3.1 (a)–(f)","theorem","[IUTchI] Def 3.1",         "the six conditions on initial Θ-data; (c), (d), (e), (f) are machine-checked here, (a), (b) are asserted flags"),
ROW("ThetaApproach",    "Θ-approach",         "structure","[IUTchI] Rem 3.1.2",          "apply [AbsTopIII] Thm 1.9 to Π_{X̲_K} ⊆ Π_{C̲_K}: the cyclotome M_X of the once-punctured curve, not of C̲_K"),
ROW("MXCyclotome",      "M_X",                "group",    "[IUTchI] Rem 3.1.2",          "the cyclotome of the once-punctured elliptic curve X; M_X ≅ l·Δ_Θ"),
ROW("LDeltaTheta",      "l·Δ_Θ",              "group",    "[IUTchI] Rem 3.1.2; [EtTh]",  "the index-l subgroup of the theta cyclotome Δ_Θ identified with M_X"),
ROW("SMod",             "S_mod",              "structure","[IUTchI] Rem 3.1.5",          "the stack Spec(O_K) // Gal(K/F_mod); its points correspond to V_mod"),
ROW("CFmod",            "C_{F_mod}",          "curve",    "[IUTchI] Rem 3.1.7",          "the orbicurve C over F_mod; |C_L| ≅ A¹ has 4 critical points (images of the 2-torsion), all strictly critical"),
ROW("CriticalPoint",    "critical point",     "datum",    "[IUTchI] Rem 3.1.7 (i)",      "a point of |C_L| ≅ A¹ over which C_L → |C_L| ramifies: the images of the 2-torsion points"),
ROW("StrictlyCriticalPoint","strictly critical point","datum","[IUTchI] Rem 3.1.7 (i)", "a critical point at which κ-coric functions must take root-of-unity values"),
ROW("KappaCoric",       "κ-coric function",   "datum",    "[IUTchI] Rem 3.1.7 (ii)",     "rational function on |C_L| with exactly one pole, ≥ 2 zeroes, divisor over an NF avoiding the critical points, roots of unity at strictly critical points"),
ROW("InfKappaCoric",    "∞κ-coric function",  "datum",    "[IUTchI] Rem 3.1.7 (ii)",     "κ-coric function with all N-th roots adjoined (a divisible, cyclotomic pseudo-monoid)"),
ROW("InfKappaUnitsCoric","∞κ×-coric function","datum",    "[IUTchI] Rem 3.1.7 (ii)",     "∞κ-coric functions multiplied by constants (F̄×)"),
ROW("KappaSolvable",    "κ-solvable, κ-sol",  "property", "[IUTchI] Rem 3.1.7 (iii)",    "the solvable extensions generated by κ-coric data; L_C(C̲_K) and L_C(κ-sol) are linearly disjoint"),
ROW("FMuL",             "F(μ_l)",             "field",    "[IUTchI] Rem 3.1.7 (iii)",    "F with the l-th roots of unity; Gal(K/F(μ_l)) is the unique subgroup ≅ SL_2(F_l)"),
ROW("AutKappaSol",      "Aut^κ-sol, Out^κ-sol","group",   "[IUTchI] Rem 3.1.7 (iii)",    "automorphisms compatible with the κ-sol structure; the κ-sol-open subgroups are center-free"),
ROW("DV",               "D_v",                "category", "[IUTchI] Ex 3.2–3.4",         "the local base category: B^temp(X̲̲_v)^0 (bad), B(X→_v)^0 (good nonarch), the Aut-holomorphic orbispace X→_v (arch)"),
ROW("DMonoV",           "D⊢_v",               "category", "[IUTchI] Ex 3.2–3.4",         "the mono-analytic base: B(K_v)^0 ⊆ D_v (nonarch), an object of TM (arch)"),
ROW("DThetaV",          "D^Θ_v",              "category", "[IUTchI] Ex 3.2 (v)",         "the Θ-version of D⊢_v at v ∈ V^bad"),
ROW("FUnderV",          "F̲_v",               "frobenioid","[IUTchI] Ex 3.2; Def 3.6",    "the tempered Frobenioid over D_v at v ∈ V^bad (at other v: F̲_v = C_v, resp. the triple (C_v, D_v, κ_v))"),
ROW("FBiratV",          "F÷_v",               "frobenioid","[IUTchI] Ex 3.2 (ii)",       "the birationalization of F̲_v"),
ROW("YDdotV",           "Ÿ_v",                "curve",    "[IUTchI] Ex 3.2 (ii); [EtTh]","the tempered covering of X̲̲_v on which the theta function lives: Θ̲_v ∈ O×(T÷_{Ÿ_v})"),
ROW("CV",               "C_v",                "frobenioid","[IUTchI] Ex 3.2 (iii); Ex 3.3; Ex 3.4", "the base-field-theoretic hull of F̲_v (bad); the p_v-adic Frobenioid (good); the archimedean Frobenioid with O▷(C_v) ≅ O▷_{K̄_v}"),
ROW("CMonoV",           "C⊢_v",               "frobenioid","[IUTchI] Ex 3.2 (iv); Ex 3.3 (ii); Ex 3.4 (iii)", "the mono-analytic Frobenioid with divisor monoid Φ_{C⊢v} = N·log_Φ(q̲_v) / N·log(p_v) / R≥0·log(p_v)"),
ROW("CThetaV",          "C^Θ_v",              "frobenioid","[IUTchI] Ex 3.2 (v)",        "the Θ-version of C⊢_v (divisor monoid N·log_Φ(q̲_v)·log(Θ))"),
ROW("PhiCMonoV",        "Φ_{C⊢v}",            "monoid",   "[IUTchI] Ex 3.2 (iv)",        "the divisor monoid of C⊢_v: N·log_Φ(q̲_v) at bad v, ord(Z_{p_v}) at good v, R≥0·log(p_v) at arch v"),
ROW("TauMonoV",         "τ⊢_v",               "structure","[IUTchI] Ex 3.2 (iv)",        "the characteristic splitting O▷ = O× × Φ of C⊢_v; a μ_2l-orbit at bad v, canonical at good and arch v"),
ROW("TauThetaV",        "τ^Θ_v",              "structure","[IUTchI] Ex 3.2 (v)",         "the splitting of the Θ-version C^Θ_v"),
ROW("FMonoV",           "F⊢_v = (C⊢_v, τ⊢_v)","frobenioid","[IUTchI] Ex 3.2 (v); Def 5.2 (ii)", "the split Frobenioid at v: the local datum of an F⊢-prime-strip"),
ROW("FThetaV",          "F^Θ_v = (C^Θ_v, τ^Θ_v)","frobenioid","[IUTchI] Ex 3.2 (v)",    "the Θ-version split Frobenioid; F⊢_v ≅ F^Θ_v"),
ROW("MuTwoL",           "μ_2l",               "group",    "[IUTchI] Ex 3.2",             "the 2l-th roots of unity: the indeterminacy of q̲_v = q_v^{1/2l}, of Θ̲_v and of the splittings τ⊢_v"),
ROW("LogPhi",           "log_Φ",              "map",      "[IUTchI] Ex 3.2 (iv)",        "the formal logarithm turning a generator of a divisor monoid into a real/formal number: Φ_{C⊢v} = N·log_Φ(q̲_v)"),
ROW("LogPV",            "log(p_v)",           "quantity", "[IUTchI] Ex 3.3; Ex 3.5",     "the generator of the realified divisor monoid at v ∈ V^good: log_mod(p_v) ↦ (1/[K_v:(F_mod)_v])·log_Φ(p_v)"),
ROW("LogTheta",         "log(Θ)",             "quantity", "[IUTchI] Ex 3.2 (v); Ex 3.5", "the formal symbol of the Θ-versions: N·log_Φ(q̲_v)·log(Θ), log_mod(p_v)·log(Θ)"),
ROW("LogModPV",         "log_mod(p_v)",       "quantity", "[IUTchI] Ex 3.5 (i)",         "the generator of Φ_{C⊩mod,v}: the realified divisor of p_v on F_mod"),
ROW("TMCategory",       "TM",                 "category", "[IUTchI] Ex 3.4 (ii)",        "the category of split topological monoids C ≅ O▷_C with C× ≅ S¹, C→ ≅ R≥0; D⊢_v ∈ TM at v ∈ V^arc"),
ROW("AutHolOrbispace",  "Aut-holomorphic orbispace","structure","[IUTchI] Ex 3.4 (i); [AbsTopIII] §2", "the archimedean analogue of a fundamental group: X→_v with its Aut-holomorphic structure"),
ROW("ABox",             "A_□",                "field",    "[IUTchI] Ex 3.4 (i)",         "the CAF (≅ C) attached to an Aut-holomorphic orbispace"),
ROW("KappaKummerV",     "κ_v : O▷(C_v) ↪ A_{D_v}","structure","[IUTchI] Ex 3.4 (ii)",   "the archimedean Kummer structure of the triple F̲_v = (C_v, D_v, κ_v)"),
ROW("CMonoGlobMod",     "C⊩_mod",             "frobenioid","[IUTchI] Ex 3.5 (i)",        "the realification of the Frobenioid of arithmetic divisors of F_mod; Prime(C⊩_mod) ≅ V_mod"),
ROW("CMonoGlobTht",     "C⊩_tht",             "frobenioid","[IUTchI] Ex 3.5 (ii)",       "the Θ-version of C⊩_mod with generators log_mod(p_v)·log(Θ)"),
ROW("DMonoGlobMod",     "D⊩_mod",             "frobenioid","[IUTchI] Ex 3.5 (iv)",       "the étale-like (D-)version reconstructed from {D⊢_v}: (R≥0)_v with Frobenius element ×e_v (nonarch) or ÷2π (arch)"),
ROW("RhoThetaV",        "ρ^Θ_v",              "map",      "[IUTchI] Ex 3.5 (ii)",        "log_mod(p_v)·log(Θ) ↦ (log_Φ(p_v)/[K_v:(F_mod)_v])·(log_Φ(Θ̲_v)/log_Φ(q̲_v)) at v ∈ V^bad"),
ROW("RhoDV",            "ρ^D_v",              "map",      "[IUTchI] Ex 3.5 (iv)",        "the D-version gluing Φ_{D⊩mod,v} ≅ (R≥0)_v"),
ROW("FMonoGlobD",       "F⊩_D",               "primestrip","[IUTchI] Ex 3.5 (iv)",       "the D-version (D⊩_mod, Prime ≅ V, {D⊢_v}, {ρ^D_v}) of F⊩_mod"),
ROW("FrobeniusElement", "Frobenius element of (R≥0)_v","datum","[IUTchI] Ex 3.5 (iv)",   "the distinguished element ×e_v (nonarch) or ÷2π (arch) of the realified monoid at v"),
ROW("DefThreeSix",      "[IUTchI] Def 3.6",   "theorem",  "[IUTchI] Def 3.6",            "a Θ-Hodge theater †HT^Θ = ({†F̲_v}_{v∈V}, †F⊩_mod) with (a) local models, (b) global model, (c) compatibility"),
ROW("CorThreeSeven",    "[IUTchI] Cor 3.7",   "theorem",  "[IUTchI] Cor 3.7",            "the Θ-link †F⊩_tht ≅ ‡F⊩_mod (full poly-iso); (ii) preserves D⊢_v; (iii) preserves O×_{C⊢v}"),
ROW("ThetaDilation",    "Θ-dilation of value groups","property","[IUTchI] Rem 3.9.3",    "across the Θ-link the units are fixed while the value groups are dilated (Θ̲_v ↦ q̲_v)"),
/* §4 */
ROW("LabCusp",          "LabCusp(†D_v)",      "labelset", "[IUTchI] Def 4.1 (ii); Prop 4.2", "the F_l^*-torsor of label classes of cusps of †D_v, with canonical element †η_v; compatible for all v"),
ROW("EtaV",             "†η_v",               "label",    "[IUTchI] Def 4.1 (ii)",       "the canonical element of LabCusp(†D_v) (image of ε̲_v)"),
ROW("DCircAstGlobal",   "D^⊛ = B(C̲_K)^0",    "category", "[IUTchI] Def 4.1 (v)",        "the global base category of the NF-bridge target; Aut(D^⊛) ≅ Aut(C̲_K) ≅ Out(Π_{C̲_K})"),
ROW("VDCircAst",        "V(†D^⊛), V̄(†D^⊛)",  "set",      "[IUTchI] Def 4.1 (v)",        "the valuations of the number field reconstructed from †D^⊛, and their quotient by π_1"),
ROW("AutEpsilon",       "Aut_ε(C̲_K)",        "group",    "[IUTchI] Ex 4.3 (i)",         "automorphisms of C̲_K fixing the cusp ε: image = semi-unipotent (∗ ∗; 0 ±1)/{±1} ⊆ GL_2(F_l)/{±1}, of order l(l−1); Aut/Aut_ε ≅ F_l^*"),
ROW("AutSL",            "Aut^SL, Aut^SL_ε",   "group",    "[IUTchI] Ex 4.3; Ex 5.1 (i)", "the automorphisms arising from SL_2(F_l); Aut^SL_ε ⊆ Aut^SL ⊆ Aut(†D^⊛) with quotient ≅ F_l^*"),
ROW("BorelSubgroup",    "Borel (∗ ∗; 0 ∗)",   "group",    "[IUTchI] Ex 4.3 (i)",         "the image of Aut(C̲_K) in GL_2(F_l)/{±1}: order l(l−1)²/2"),
ROW("SemiUnipotentSubgroup","semi-unipotent (∗ ∗; 0 ±1)","group","[IUTchI] Ex 4.3 (i)", "the image of Aut_ε(C̲_K) in GL_2(F_l)/{±1}: order l(l−1)"),
ROW("VPmUn",            "V^±un",              "set",      "[IUTchI] Ex 4.3 (i); Rem 6.1.1", "Aut_ε(C̲_K)·V ⊆ V(K); equals V^± = Aut_csp(D^⊚±)·V"),
ROW("VBor",             "V^Bor",              "set",      "[IUTchI] Ex 4.3 (i)",         "Aut(C̲_K)·V ⊆ V(K): the basepoints of the multiplicative (F_l^*) symmetry"),
ROW("VK",               "V(K)",               "set",      "[IUTchI] Def 3.1 (d)",        "all valuations of K; V ⊆ V(K) is a section over V_mod"),
ROW("PhiNFBulletV",     "φ^NF_{•,v}, φ^NF_v",  "morphism", "[IUTchI] Ex 4.3 (ii)–(iii)",  "the model NF-bridge constituents D_v → D^⊛, φ^NF_v = β ∘ φ_{•,v} ∘ α with α ∈ Aut(D_v), β ∈ Aut_ε(D^⊛)"),
ROW("ArithLocalAnalyticSection","arithmetic local-analytic section","structure","[IUTchI] Rem 4.3.1", "a prime-strip viewed as a section of Spec K → Spec F; requirements (a) local independence, (b) globalizability, (c) étale-like (Rem 4.3.2)"),
ROW("MuMinus",          "μ_−",                "datum",    "[IUTchI] Ex 4.4 (i)",         "the 2-torsion point of X̲̲_v by which the cusps are translated to obtain the evaluation points"),
ROW("EvaluationPoint",  "evaluation point",   "datum",    "[IUTchI] Ex 4.4 (i)–(ii)",    "a μ_−-translate of a cusp of X̲̲_v, labelled by |F_l|, K_v-rational; Θ̲_v takes the value q̲_v^{j²} there (up to μ_2l)"),
ROW("EvaluationSection","evaluation section G_v → Π_v","map","[IUTchI] Ex 4.4 (ii)",   "the decomposition-group section labelled by j ∈ |F_l|, group-theoretically constructible from Π_v"),
ROW("PhiThetaVJ",       "φ^Θ_{v_j}",          "morphism", "[IUTchI] Ex 4.4 (iii)",       "the Θ-bridge constituent D_{v_j} → D_{>,v}: evaluation section labelled |j| at bad v, full poly-iso at good v"),
ROW("PhiLC",            "φ^LC_j",             "map",      "[IUTchI] Ex 4.5; Prop 4.7 (ii)", "LabCusp(D^⊛) ≅ LabCusp(D_>) transporting [ε] ↦ j; φ^LC_j = φ^LC_1 ∘ j"),
ROW("ChiJ",             "†χ : J ≅ F_l^*",     "map",      "[IUTchI] Prop 4.7 (i)",       "the bijection of the capsule index set with F_l^* determined by a D-ΘNF-Hodge theater"),
ROW("ZetaLabel",        "†ζ : LabCusp(†D^⊛) ≅ J","map",   "[IUTchI] Prop 4.7 (iii); Rem 6.12.4", "the label synchronization of the ΘNF side"),
ROW("DNFBridge",        "D-NF-bridge †φ^NF_⊛","bridge",   "[IUTchI] Def 4.6 (i)",        "poly-morphism †D_J → †D^⊛ (capsule-full + Aut_ε-orbit); isomorphisms form an F_l^*-torsor (Prop 4.8 (i))"),
ROW("DThetaBridge",     "D-Θ-bridge †φ^Θ_⊛",  "bridge",   "[IUTchI] Def 4.6 (ii)",       "poly-morphism †D_J → †D_> (capsule-full + full poly-iso); isomorphisms: trivial (Prop 4.8 (ii))"),
ROW("DThetaNFHodgeTheater","D-ΘNF-Hodge theater","hodgetheater","[IUTchI] Def 4.6 (iii)", "†D^⊛ ← †D_J → †D_>; isomorphisms trivial (Prop 4.8 (iii)); gluing of the bridges an F_l^*-torsor (Prop 4.8 (iv))"),
ROW("DThetaNFLink",     "D-ΘNF-link",         "link",     "[IUTchI] Cor 4.12",           "the full poly-isomorphism †D⊢_> ≅ ‡D⊢_> between D-ΘNF-Hodge theaters; étale picture with core D⊢_>"),
ROW("SynchronizedLabels","synchronized labels","property","[IUTchI] Rem 4.9.2",          "labels of the capsule members tied together across v ∈ V (via the global data); versus non-synchronized labels"),
/* §5 */
ROW("MCircAst",         "M^⊛(†D^⊛)",          "monoid",   "[IUTchI] Ex 5.1 (i)",         "isomorph of F̄× with its field structure, reconstructed from †D^⊛; Kummer-ready"),
ROW("MCircAstMod",      "M^⊛_mod",            "monoid",   "[IUTchI] Ex 5.1 (i)",         "isomorph of F_mod^× inside M^⊛; Kummer-blind"),
ROW("MCircAstSol",      "M^⊛_sol",            "monoid",   "[IUTchI] Ex 5.1 (i)",         "isomorph of F_sol^× (maximal solvable extension) inside M^⊛; Kummer-ready"),
ROW("MCircAstKappa",    "M^⊛_κ",              "monoid",   "[IUTchI] Ex 5.1 (i)",         "pseudo-monoid of κ-coric rational functions; Kummer-blind"),
ROW("MCircAstInfKappa", "M^⊛_∞κ",             "monoid",   "[IUTchI] Ex 5.1 (i)",         "pseudo-monoid of ∞κ-coric functions (divisible, cyclotomic); Kummer-ready"),
ROW("MCircAstInfKappaUnits","M^⊛_∞κ×",        "monoid",   "[IUTchI] Ex 5.1 (i)",         "pseudo-monoid of ∞κ×-coric functions; Kummer-ready; its ∞κ×-coric structure on †F^⊛ is unique (Ex 5.1 (v))"),
ROW("MCircAstKappaSol", "M^⊛_κ-sol",          "monoid",   "[IUTchI] Ex 5.1 (i)",         "the κ-sol version; Kummer-ready; used for κ-sol-conjugate synchronization"),
ROW("MV",               "M_v(‡D_v)",          "monoid",   "[IUTchI] Def 5.2 (v)",        "the local pseudo-monoid ≅ O▷_{F̄_v} reconstructed from ‡D_v (via π_1^rat(‡D_v)); Kummer-ready"),
ROW("MKappaV",          "M_κv",               "monoid",   "[IUTchI] Def 5.2 (vi)",       "the local κ-coric pseudo-monoid; Kummer-blind"),
ROW("MInfKappaV",       "M_∞κv",              "monoid",   "[IUTchI] Def 5.2 (vi)",       "the local ∞κ-coric pseudo-monoid (divisible, cyclotomic); Kummer-ready"),
ROW("MInfKappaUnitsV",  "M_∞κ×v",             "monoid",   "[IUTchI] Def 5.2 (vi)",       "the local ∞κ×-coric pseudo-monoid; the ∞κ-coric structures on ‡F_v are unique"),
ROW("PiRat",            "π_1^rat(†D^⊛), π_1^κ-sol, π_1^{rat/κ-sol}","group","[IUTchI] Ex 5.1 (i); Def 5.2 (v)", "the fundamental groups of the generic point / κ-sol versions from which the pseudo-monoids are reconstructed"),
ROW("DCircAstMod",      "†D^⊛_mod",           "category", "[IUTchI] Ex 5.1 (i)",         "the C_{F_mod}-version of †D^⊛ (†D^⊛ → †D^⊛_mod, π_1 open)"),
ROW("PhiCircAst",       "Φ^⊛(†D^⊛)",          "monoid",   "[IUTchI] Ex 5.1 (ii)",        "the monoid of arithmetic divisors reconstructed from †D^⊛; defines the model Frobenioid F^⊛(†D^⊛)"),
ROW("FCircAstGlobal",   "F^⊛(†D^⊛), †F^⊛",    "frobenioid","[IUTchI] Ex 5.1 (ii)–(iii)",  "the global Frobenioid over †D^⊛ (model / Frobenius-like); Kummer-ready"),
ROW("FCircAstPrime",    "†F^⊛′",              "frobenioid","[IUTchI] Ex 5.1 (iii)",      "the Frobenioid over †D^⊛_mod with †F^⊛ = †F^⊛′|_{†D^⊛}; Kummer-ready"),
ROW("FCircAstMod",      "†F^⊛_mod",           "frobenioid","[IUTchI] Ex 5.1 (iii)",      "restriction of †F^⊛′ to the terminal objects: the Frobenioid of F_mod; Kummer-blind; Prime(†F^⊛_mod) ≅ V_mod"),
ROW("FCircAstJ",        "†F^⊛_j",             "frobenioid","[IUTchI] Ex 5.1 (vii)",      "copy of †F^⊛_mod for j ∈ F_l^*, living over V_j"),
ROW("FCircAstAngleJ",   "†F^⊛_⟨J⟩",           "frobenioid","[IUTchI] Ex 5.1 (vii); Rem 5.4.2", "the diagonal copy over V_⟨J⟩ (constant distribution); log-volumes are averages (÷ l*)"),
ROW("FCircAstJCapsule", "†F^⊛_J = ∏_j †F^⊛_j","frobenioid","[IUTchI] Ex 5.1 (vii)",     "the product over F_l^* (arbitrary distribution); †F^⊛_⟨J⟩ ↪ †F^⊛_J"),
ROW("DistributionVJ",   "V_j, V_J, V_⟨J⟩",    "set",      "[IUTchI] Ex 5.1 (vii); Rem 5.1.1", "V_j = {v_j}_{v∈V}; V_J = ∏_j V_j; the diagonal V_⟨J⟩ ↪ V_J (constant versus arbitrary distribution)"),
ROW("KummerReady",      "Kummer-ready",       "property", "[IUTchI] Rem 5.1.3; Rem 5.2.2","data admitting a Kummer isomorphism with its étale-like counterpart: F^⊛, F^⊛′, M^⊛, M_sol, M_∞κ, M_∞κ×, M_κ-sol, F-prime-strips"),
ROW("KummerBlind",      "Kummer-blind",       "property", "[IUTchI] Rem 5.1.3; Rem 5.2.2","data without such a Kummer isomorphism: F^⊛_mod, M_mod, M_κ, F_j, F_⟨J⟩, F_J, F⊢-prime-strips"),
ROW("DeltaValuation",   "δ-valuation",        "datum",    "[IUTchI] Ex 5.4 (iv)",        "a valuation of the field determined by †D^⊛ lying over a label δ ∈ LabCusp(†D^⊛); gives the localization †F^⊛|_δ"),
ROW("PsiNFBridge",      "ψ^NF_⊛",             "bridge",   "[IUTchI] Ex 5.4 (v); Def 5.5 (i)", "the NF-bridge ‡F_J → ‡F^⊛ ⇝ ‡F^⊛′ lifting φ^NF_⊛ (unique over it)"),
ROW("PsiThetaBridge",   "ψ^Θ_j, ψ^Θ_⊛",       "bridge",   "[IUTchI] Ex 5.4 (ii); Def 5.5 (ii)", "the Θ-bridge ‡F_J → ‡F_> ⇝ ‡HT^Θ lifting φ^Θ_⊛"),
ROW("PivotalDistribution","pivotal distribution","structure","[IUTchI] Ex 5.4 (vii)",    "the distribution singled out by the label j = 1"),
ROW("FDCircAst",        "F^⊛(†D^⊛) ↦ †D^⊛",    "map",      "[IUTchI] Cor 5.3 (i)",        "Isom(†F^⊛, ‡F^⊛) → Isom(†D^⊛, ‡D^⊛) is bijective"),
ROW("StripLifting",     "F ↦ D lifting",      "map",      "[IUTchI] Cor 5.3 (ii)–(iv); Rem 5.3.1", "Isom(F-strips) → Isom(D-strips) bijective; Isom(F⊢) → Isom(D⊢) surjective; Aut(F̲_v) → Aut(D_v) bijective at bad v"),
/* §6 */
ROW("FlSemiPmGroup",    "F_l^{⋊±}-group",     "structure","[IUTchI] Def 6.1 (i)",        "a set with a {±1}-orbit of bijections to F_l (T of a Θ±-bridge); Aut_+(T) ⊆ Aut_±(T) of index 2"),
ROW("FlSemiPmTorsor",   "F_l^{⋊±}-torsor",    "structure","[IUTchI] Def 6.1 (i)",        "a set with an F_l^{⋊±}-orbit of bijections to F_l (T of a Θell-bridge)"),
ROW("PositiveElement",  "positive / negative element","label","[IUTchI] Def 6.1 (i)",    "elements of an F_l^{⋊±}-group mapping to {1..l*} (positive) or {−l*..−1} (negative) under the bijections"),
ROW("DPmV",             "†D^±_v",             "category", "[IUTchI] Def 6.1 (ii)",       "the X̲_v-version of †D_v (double cover of the C̲_v-version), from which LabCusp± is defined"),
ROW("LabCuspPm",        "LabCusp±(†D_v)",     "labelset", "[IUTchI] Def 6.1 (ii)–(iii)", "the cusps of †D^±_v with the F_l^×-action; ≅ F_l up to ±1 (an F_l^{⋊±}-group); (LabCusp± ∖ {η⁰})/{±1} ≅ LabCusp"),
ROW("EtaZeroV",         "†η⁰_v",              "label",    "[IUTchI] Def 6.1 (ii)",       "the zero element of LabCusp±(†D_v)"),
ROW("EtaPmV",           "†η^±_v",             "label",    "[IUTchI] Def 6.1 (iii)",      "the ±-canonical element of LabCusp±(†D_v), well-defined up to ±1"),
ROW("AutPlus",          "Aut_+(†D_v), Aut_+(†D)","group",  "[IUTchI] Def 6.1 (iii)–(iv)", "the kernel of Aut(†D_v) ↠ {±1} (automorphisms preserving the sign of LabCusp±); Aut_+(†D) = ∏_v Aut_+"),
ROW("AutMinus",         "Aut_−(†D_v)",        "group",    "[IUTchI] Def 6.1 (iii)",      "the complement Aut(†D_v) ∖ Aut_+(†D_v): the sign-reversing automorphisms"),
ROW("AutAlpha",         "Aut_α(†D)",          "group",    "[IUTchI] Def 6.1 (iv)",       "for α ∈ {±1}^V: automorphisms with sign α_v at each v; α-signed +-full poly-isomorphisms"),
ROW("SignVector",       "α ∈ {±1}^V",         "datum",    "[IUTchI] Def 6.1 (iv); Ex 6.2 (iii); Prop 6.6 (i)", "a choice of sign at every v ∈ V; the D-Θ±-bridge isomorphisms form a torsor over {±1} × {±1}^V"),
ROW("DCircDotPmGlobal", "D^⊚± = B(X̲_K)^0",   "category", "[IUTchI] Def 6.1 (v)",        "the global base category of the Θell-bridge target, a double cover of D^⊛; Aut(D^⊚±) ↠ F_l^* with kernel Aut_±"),
ROW("AutPm",            "Aut_±(D^⊚±)",        "group",    "[IUTchI] Def 6.1 (v)",        "the kernel of Aut(D^⊚±) ↠ F_l^*; Aut_±/Aut_csp ≅ Aut_K(X̲_K) ≅ F_l^{⋊±}"),
ROW("AutCsp",           "Aut_csp(D^⊚±)",      "group",    "[IUTchI] Def 6.1 (v)",        "the automorphisms fixing the cusps; Aut_csp ⊆ Aut_±; V^± = Aut_csp·V"),
ROW("VPm",              "V^±",                "set",      "[IUTchI] Def 6.1 (v); Rem 6.1.1", "Aut_±·V = Aut_csp·V ⊆ V(K); equals V^±un: the basepoints of the additive (F_l^{⋊±}) symmetry"),
ROW("MinusOneFl",       "−1_{F_l}",           "symmetry", "[IUTchI] Ex 6.2 (ii)",        "the poly-automorphism of order two of the model base-Θ±-bridge: t ↦ −t, D_t ≅ D_{−t}, negative sign at every v"),
ROW("AlphaThetaPm",     "α^Θ±",               "symmetry", "[IUTchI] Ex 6.2 (iii)",       "the poly-automorphism of order ≤ 2 of the model base-Θ±-bridge determined by α ∈ {±1}^V"),
ROW("PhiThetaEllBulletV","φ^Θell_{•,v}, φ^Θell_{v_t}","morphism","[IUTchI] Ex 6.3",   "the model Θell-bridge constituents D_v → D^⊚±; φ^Θell_{v_0} = β ∘ φ ∘ α with α ∈ Aut_+(D_{v_0}), β ∈ Aut_csp; φ^Θell_t via the poly-action of t"),
ROW("GammaPm",          "γ_±",                "symmetry", "[IUTchI] Ex 6.3 (iii)",       "the poly-action of F_l^{⋊±} on the model base-Θell-bridge"),
ROW("TAbs",             "†D_{|T|}",           "capsule",  "[IUTchI] Def 6.4 (i)",        "the l±-capsule obtained from †D_T by the quotient |T| = T/{±1}"),
ROW("TStar",            "†D_{T*}",            "capsule",  "[IUTchI] Def 6.4 (i)",        "the l*-capsule over T* = |T| ∖ {0}"),
ROW("DThetaPmBridge",   "D-Θ±-bridge †φ^Θ±_±","bridge",   "[IUTchI] Def 6.4 (i)",        "poly-morphism †D_T → †D_⊞ with T an F_l^{⋊±}-group; isomorphisms a torsor over {±1} × {±1}^V (Prop 6.6 (i))"),
ROW("DThetaEllBridge",  "D-Θell-bridge †φ^Θell_±","bridge","[IUTchI] Def 6.4 (ii)",      "poly-morphism †D_T → †D^⊚± with T an F_l^{⋊±}-torsor (Aut_csp-orbit); isomorphisms an F_l^{⋊±}-torsor (Prop 6.6 (ii))"),
ROW("DThetaPmEllHodgeTheater","D-Θ±ell-Hodge theater","hodgetheater","[IUTchI] Def 6.4 (iii)", "†D_⊞ ← †D_T → †D^⊚±; isomorphisms a {±1}-torsor (Prop 6.6 (iii)); gluing a torsor over F_l^{⋊±} × {±1}^V (Prop 6.6 (iv))"),
ROW("ZetaPm",           "†ζ_±, †ζ^Θell_{v_t}","map",      "[IUTchI] Prop 6.5",           "the ±-label synchronizations: LabCusp±(†D^⊚±) ≅ T and the local versions at v_t"),
ROW("XiSync",           "†ξ",                 "map",      "[IUTchI] Prop 6.5 (ii); Rem 6.12.4", "the global ±-synchronization of the signs of LabCusp±(†D_t) across t and v"),
ROW("PropSixSeven",     "[IUTchI] Prop 6.7",  "theorem",  "[IUTchI] Prop 6.7",           "from a D-Θ±-bridge to a D-Θ-bridge: †D_T|_{T∖{0}} → †D_{T*} (±t ↦ |t|), †D_0 and †D_⊞ ↦ †D_>"),
ROW("DThetaPmEllLink",  "D-Θ±ell-link",       "link",     "[IUTchI] Cor 6.10",           "the full poly-isomorphism †D⊢_> ≅ ‡D⊢_> between D-Θ±ell-Hodge theaters; étale picture with core D⊢_>"),
ROW("DagHTDThetaPmEllNF","†HT^{D-Θ±ell NF}",  "hodgetheater","[IUTchI] Def 6.13 (ii)",   "the D-version of a Θ±ell NF-Hodge theater: (D-Θ±ell-HT, D-ΘNF-HT, gluing via Prop 6.7)"),
ROW("HalfPlaneDictionary","upper half-plane dictionary","structure","[IUTchI] Rem 6.12.3; Fig 6.4", "F_l^{⋊±} ↔ z ↦ ±z+a (cusp, q = e^{2πiz}, basepoints V^±); F_l^* ↔ toral w = (z−i)/(z+i) (node, basepoints V^Bor); coric {±1}"),
ROW("GeometricBasepoint","geometric vs arithmetic basepoints","property","[IUTchI] Rem 6.12.6", "F_l^{⋊±} uses V^± (geometric, semi-unipotent is not normally terminal); F_l^* uses V^Bor (arithmetic, Borel is normally terminal)"),
ROW("FigSixSix",        "Frobenioids of a Θ±ell NF-HT","structure","[IUTchI] Fig 6.6",   "F-prime-strips Π_v ↷ O▷_{F̄_v}; F̲_v tempered at bad v; F^⊛_mod; F^⊛; F^⊛′"),

/* ------------------------------------------------------------ processes (src/iut_proc.c) */
ROW("MapLabels", "iut run MapLabels", "process", "[IUTchI] §4-§6, Def 6.13", "label sets F_l ⊇ F_l^× ↠ F_l^*, |F_l| and the gluing 0,⊞ ↦ >"),
ROW("ActSymmetries", "iut run ActSymmetries", "process", "[IUTchI] Prop 4.9, Prop 6.6", "the F_l^{⋊±}- and F_l^*-symmetries and their orbits"),
ROW("LabelCusps", "iut run LabelCusps", "process", "[IUTchI] Def 6.1, Prop 6.5", "LabCusp±(D_⊚) ≅ F_l, LabCusp(D_⊛) ≅ F_l^*, forgetting the sign"),
ROW("ExtractCapsules", "iut run ExtractCapsules", "process", "[IUTchI] §0, Def 4.1, Def 6.4", "the capsules F_T, F_J and morphisms of capsules"),
ROW("BuildProcessions", "iut run BuildProcessions", "process", "[IUTchI] Prop 4.11, Prop 6.9", "processions Prc(D_J), Prc(D_T) with their automorphisms"),
ROW("BuildBridges", "iut run BuildBridges", "process", "[IUTchI] Def 4.6, 5.5, 6.4", "Θ-, NF-, Θ±- and Θell-bridges and their symmetry groups"),
ROW("ForgetToDHodgeTheater", "iut run ForgetToDHodgeTheater", "process", "[IUTchI] Def 6.13, Rem 6.12.2", "Θ±ell NF-HT ↦ D-Θ±ell NF-HT, and the Θ±ell/ΘNF/Θ projections"),
ROW("ChainFrobeniusPicture", "iut run ChainFrobeniusPicture", "process", "[IUTchI] Cor 3.8", "the Frobenius picture: a chain of Θ-linked Hodge theaters"),
ROW("DrawEtalePicture", "iut run DrawEtalePicture", "process", "[IUTchI] Cor 4.12, Cor 6.10", "the étale picture: D-HTs as spokes around the core D⊢"),
ROW("BuildGlobalNF", "iut run BuildGlobalNF", "process", "[IUTchI] Ex 5.1, Cor 5.3", "global number-field data from Π_{C_K} and its Kummer isomorphism"),
ROW("GlueHodgeTheaters", "iut run GlueHodgeTheaters", "process", "[IUTchI] Prop 6.7, Def 6.13", "gluing Θ±ell-HT to ΘNF-HT along 0,⊞ ↦ >"),
ROW("BuildPrimeStrip", "iut run BuildPrimeStrip", "process", "[IUTchI] Def 4.1, Def 5.2", "construct and validate a prime-strip of any of the 9 kinds"),
ROW("GenerateInitialData", "iut run GenerateInitialData", "process", "[IUTchI] Def 3.1", "initial Θ-data from an abc triple / example and its validation"),
ROW("ClassifyPseudoMonoids", "iut run ClassifyPseudoMonoids", "process", "[IUTchI] §0, Ex 5.1 (i), Def 5.2 (v)-(vi), Rem 5.1.3", "pseudo-monoids M^⊛, M^⊛_mod, M^⊛_sol, M^⊛_κ, M^⊛_∞κ, M^⊛_∞κ×, M^⊛_κ-sol, M_v…: divisible / cyclotomic / Kummer-ready"),
ROW("ComposePolyMorphisms", "iut run ComposePolyMorphisms", "process", "[IUTchI] §0, Def 6.1 (iv)", "poly-morphisms, full and +-full poly-isomorphisms, their composites; anabelioids; NF / MLF / CAF"),
ROW("ClassifyOrbicurves", "iut run ClassifyOrbicurves", "process", "[IUTchI] §1, Def 1.1, Def 3.1 (b)", "the orbicurves X, C, X̲, C̲, X→, C→, X̲̲_v, C̲̲_v, C̲_v: types, degrees, cusps, covering groups"),
ROW("ReconstructCoverings", "iut run ReconstructCoverings", "process", "[IUTchI] §1, Cor 1.2, Rem 1.2.1", "the cusps ε, ε′, ε″, 2ε and the group-theoretic reconstruction of Π_X̲, Π_C→, Π_C̲ from Π_X→"),
ROW("CompareTempered", "iut run CompareTempered", "process", "[IUTchI] §2, Prop 2.1-Cor 2.8, Rem 2.5.3", "tempered versus profinite fundamental groups at v ∈ V^bad; Cor 2.5 synchronization"),
ROW("CheckDefThreeOne", "iut run CheckDefThreeOne", "process", "[IUTchI] Def 3.1 (a)-(f), Rem 3.1.2, 3.1.3, 3.1.5", "the six conditions on initial Θ-data; the Θ-approach M_X ≅ l·Δ_Θ; the determining data; S_mod"),
ROW("CheckKappaCoric", "iut run CheckKappaCoric", "process", "[IUTchI] Rem 3.1.7", "κ-coric / ∞κ-coric / ∞κ×-coric functions, critical points, Gal(K/F(μ_l)) ≅ SL_2(F_l)"),
ROW("BuildLocalFrobenioids", "iut run BuildLocalFrobenioids", "process", "[IUTchI] Ex 3.2, Ex 3.3, Ex 3.4", "F̲_v, C_v, C⊢_v, τ⊢_v, C^Θ_v at bad / good / archimedean v; q̲_v, Θ̲_v, log(p_v), log(Θ); F⊢_v ≅ F^Θ_v"),
ROW("BuildGlobalRealified", "iut run BuildGlobalRealified", "process", "[IUTchI] Ex 3.5", "C⊩_mod, C⊩_tht, D⊩_mod; ρ_v, ρ^Θ_v, ρ^D_v; F⊩_mod ≅ F⊩_tht"),
ROW("AssembleThetaHodgeTheater", "iut run AssembleThetaHodgeTheater", "process", "[IUTchI] Def 3.6, Cor 3.7-3.9, Rem 3.9.3", "†HT^Θ = ({F̲_v}, F⊩_mod) with (a)(b)(c); the Θ-link as full poly-iso F⊩_tht ≅ F⊩_mod preserving D⊢_v and O×"),
ROW("TorsorLabelCusps", "iut run TorsorLabelCusps", "process", "[IUTchI] Def 4.1 (ii), Prop 4.2, Def 6.1 (ii)-(iii)", "LabCusp(†D_v) as F_l^*-torsor with †η_v; LabCusp±(†D_v) with †η⁰_v, †η^±_v; forgetting the sign"),
ROW("DescribeGlobalBases", "iut run DescribeGlobalBases", "process", "[IUTchI] Def 4.1 (v), Ex 4.3, Def 6.1 (v), Rem 6.1.1", "D^⊛ = B(C̲_K)^0, D^⊚± = B(X̲_K)^0; Aut ⊇ Aut_ε (Borel ⊇ semi-unipotent), Aut_± ⊇ Aut_csp; V ⊆ V^±un ⊆ V^Bor ⊆ V(K)"),
ROW("EvaluateAtPoints", "iut run EvaluateAtPoints", "process", "[IUTchI] Ex 4.4", "evaluation points labelled |F_l|, Θ̲_v ↦ q̲_v^{j²}, evaluation sections G_v → Π_v, the Θ-bridge constituents φ^Θ_{v_j}"),
ROW("TransportLabelClasses", "iut run TransportLabelClasses", "process", "[IUTchI] Prop 4.7, Prop 6.5, Rem 6.12.4", "†χ : J ≅ F_l^*, †ζ, †ζ_±, the global ±-synchronization †ξ"),
ROW("CountIsomorphismTorsors", "iut run CountIsomorphismTorsors", "process", "[IUTchI] Prop 4.8, Prop 6.6, Cor 5.6, Cor 6.12, Rem 6.12.2", "the isomorphism torsors of the four bridges, the Hodge theaters and their gluings"),
ROW("CountForgottenSymmetries", "iut run CountForgottenSymmetries", "process", "[IUTchI] Prop 4.9, Prop 4.11, Prop 6.8, Prop 6.9", "(l*)^{l*} → l*! and (l±)^{l±} → l±!: what the forgetful functors lose and what processions recover"),
ROW("DistributeGlobalData", "iut run DistributeGlobalData", "process", "[IUTchI] Ex 5.1 (ii)-(vii), Rem 5.1.1, Rem 5.1.3, Rem 5.4.2", "F^⊛, F^⊛′, F^⊛_mod, F^⊛_j, F^⊛_⟨J⟩, F^⊛_J; V_j, V_⟨J⟩, V_J; Kummer-ready vs Kummer-blind; averaged vs summed log-volumes"),
ROW("LiftToFrobenioids", "iut run LiftToFrobenioids", "process", "[IUTchI] Def 5.2, Rem 5.2.1, Cor 5.3, Rem 5.3.1", "F ↦ D, F ↦ F⊢, F ↦ F⊩; Isom(F) ≅ Isom(D); lifting a D-prime-strip to an F-prime-strip"),
ROW("StructureFlSemiPm", "iut run StructureFlSemiPm", "process", "[IUTchI] Def 6.1 (i), Def 6.4 (i), Ex 6.2", "F_l^{⋊±}-groups and -torsors, positive elements, |T| and T*, sign vectors {±1}^V and −1_{F_l}"),
ROW("ReduceThetaPmToTheta", "iut run ReduceThetaPmToTheta", "process", "[IUTchI] Prop 6.7, Prop 6.9 (iii), Rem 6.12.2", "D-Θ±-bridge ⇒ D-Θ-bridge (±t ↦ |t|, D_0, D_⊞ ↦ D_>); S*_j ↪ S^±_{j+1}; uniqueness of the gluing"),
ROW("CompareHalfPlane", "iut run CompareHalfPlane", "process", "[IUTchI] Rem 6.12.3, Fig 6.4, Fig 6.6", "the two symmetries versus the upper half-plane; the Frobenioids of a Θ±ell NF-Hodge theater"),
ROW("ClassifyRadial", "iut run ClassifyRadial", "process", "[IUTchII] Ex 1.7-1.9", "radial environments, multiradiality, multiradialization"),
ROW("RigidifyCyclotomes", "iut run RigidifyCyclotomes", "process", "[IUTchII] Cor 1.10-1.12", "the three cyclotomic rigidity isomorphisms, constant multiple rigidity"),
ROW("EvaluateTheta", "iut run EvaluateTheta", "process", "[IUTchII] Cor 2.4, 2.5, 2.8", "theta evaluation at the l-torsion points: θ ↦ q̲^{t²}, |t|-dependence"),
ROW("BuildMonoids", "iut run BuildMonoids", "process", "[IUTchII] Prop 3.1, Cor 3.5-3.7, 4.5-4.6", "Ψ_env, Ψ_gau, Ψ_cns, Ψ^ss_cns; evaluation and Kummer isomorphisms"),
ROW("RealifyFromDMono", "iut run RealifyFromDMono", "process", "[IUTchII] Cor 4.5 (ii)", "D⊢ ↦ D⊩(D⊢): the global realified Frobenioid from the core"),
ROW("Symmetrize", "iut run Symmetrize", "process", "[IUTchII] Cor 3.5 (i), 4.5 (iii), 4.7 (ii)", "symmetrizing isomorphisms, diagonals, conjugate synchronization"),
ROW("ForgetLadder", "iut run ForgetLadder", "process", "[IUTchII] Def 4.9", "F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× → D⊢ and the pilot object"),
ROW("LinkThetaUnitsModTors", "iut run LinkThetaUnitsModTors", "process", "[IUTchII] Cor 4.10, Rem 4.11.1", "F⊩_Δ ≅ F⊩_mod, F⊩_env ≅ F⊩_gau, the Θ×μ(_gau)-link, coric F⊢×μ and D⊩"),
ROW("MakeLogShells", "iut run MakeLogShells", "process", "[IUTchIII] Def 1.1, Prop 1.2 (v)-(ix)", "log-shells I_v and their properties / isomorphisms"),
ROW("ApplyLogLinkStrip", "iut run ApplyLogLinkStrip", "process", "[IUTchIII] Def 1.1, Prop 1.2", "the log-link on an F-prime-strip; what is coric and what is not"),
ROW("ChainLogLinks", "iut run ChainLogLinks", "process", "[IUTchIII] Prop 1.2 (x), Prop 1.3", "the vertical Frobenius picture and the log-link of Hodge theaters"),
ROW("DefineLattice", "iut run DefineLattice", "process", "[IUTchIII] Def 1.4, Rem 1.4.1", "lattice flavours; non-commutativity; horizontal obligates vertical"),
ROW("CheckBicoric", "iut run CheckBicoric", "process", "[IUTchIII] Thm 1.5", "vertical / horizontal / bi-coric data of the lattice"),
ROW("CoricThetaMonoids", "iut run CoricThetaMonoids", "process", "[IUTchIII] Prop 2.1, Thm 2.2, Cor 2.3", "vertically coric theta monoids; the étale-picture radial environment"),
ROW("BuildTensorPackets", "iut run BuildTensorPackets", "process", "[IUTchIII] Prop 3.1-3.3", "local holomorphic / mono-analytic / global tensor packets"),
ROW("BuildLGPMonoids", "iut run BuildLGPMonoids", "process", "[IUTchIII] Prop 3.4, Prop 3.5", "LGP-monoids in the packets; upper semi-compatibility (Ind3)"),
ROW("CompareGlobalVariants", "iut run CompareGlobalVariants", "process", "[IUTchIII] Ex 3.6, Prop 3.7", "F_MOD vs F_mod; F⊩_gau ≅ F⊩_LGP ≅ F⊩_lgp"),
ROW("MakePilots", "iut run MakePilots", "process", "[IUTchIII] Def 3.8", "q-/Θ-pilot objects; the Θ×μ_LGP-link relative to a log-link"),
ROW("NormalizeLogVolumes", "iut run NormalizeLogVolumes", "process", "[IUTchIII] Prop 3.9, Prop 3.10", "packet-/procession-normalization, arithmetic degree, non-interference"),
ROW("RepresentMultiradially", "iut run RepresentMultiradially", "process", "[IUTchIII] Thm 3.11", "the multiradial representation (a)(b)(c) with Ind1-Ind3"),
ROW("EstimateLogVolume", "iut run EstimateLogVolume", "process", "[IUTchIII] Cor 3.12", "−|log Θ| ≥ −|log q| as numbered steps"),
ROW("BoundDifferents", "iut run BoundDifferents", "process", "[IUTchIV] Prop 1.1-1.3", "differents, a_i, b_i, the φ-estimates, bounds for d_i"),
ROW("EstimateNonarchVolume", "iut run EstimateNonarchVolume", "process", "[IUTchIV] Prop 1.4", "μ_log(log_p R×) and the normalized log-volume bounds"),
ROW("EstimateArchMetric", "iut run EstimateArchMetric", "process", "[IUTchIV] Prop 1.5", "archimedean summands 2^{|I|−1}|V|^{|I|} and metric factors"),
ROW("BoundPrimes", "iut run BoundPrimes", "process", "[IUTchIV] Prop 1.6, Prop 2.1", "prime number theorem and Chebyshev-type bounds"),
ROW("AverageWeighted", "iut run AverageWeighted", "process", "[IUTchIV] Prop 1.7", "weighted averages with λ_v = [(F_mod)_v : Q_p]"),
ROW("CheckTorsionPoints", "iut run CheckTorsionPoints", "process", "[IUTchIV] Prop 1.8", "torsion points, fields of definition, ramification at Vbad"),
ROW("DegreeArithDivisors", "iut run DegreeArithDivisors", "process", "[IUTchIV] Def 1.9", "arithmetic divisors, deg, normalized degree, deg_E"),
ROW("ComputeThmOneTen", "iut run ComputeThmOneTen", "process", "[IUTchIV] Thm 1.10", "(E1)-(E6), the intermediate bounds and the final inequality"),
ROW("ComputeCorTwoTwo", "iut run ComputeCorTwoTwo", "process", "[IUTchIV] Cor 2.2, Cor 2.3", "δ, (C1) range of l, ε_E, (C2), the height form"),
ROW("OperateSpecies", "iut run OperateSpecies", "process", "[IUTchIV] Def 3.1, Def 3.3", "compose/identity mutations, species-isomorphism, mutation-history, cores"),
ROW("EvaluateLogicModel", "iut run EvaluateLogicModel", "process", "[EssLgc] Ex 2.4.5", "the numerical model: ∧ gives A = ε ≤ 1, ∨ gives nothing"),
ROW("ChainAndSteps", "iut run ChainAndSteps", "process", "[EssLgc] §3.10 (Stp1)-(Stp8), (FxGl)", "the chain of logical ∧ relations through the lattice"),
ROW("Fuzzify", "iut run Fuzzify", "process", "[EssLgc] §3.10 (Englf), (ExtInd1/2), §3.11", "fuzzification, engulfing, extending indeterminacies, ∨ verdicts"),
ROW("ComputeGaussian", "iut run ComputeGaussian", "process", "[Alien] §1 Steps 1-12", "the Gaussian integral and its IUT analogues"),
ROW("TransportMonoAnabelian", "iut run TransportMonoAnabelian", "process", "[Alien] §2.7, Fig 2.1", "mono-anabelian transport: Kummer-detachment, étale-transport"),
ROW("SumLabelsFormally", "iut run SumLabelsFormally", "process", "[Alien] §3.6", "formal sums [0], [|j|], [⊞], [>] and their compatibilities; Ÿ labels"),
ROW("StepEstimate", "iut run StepEstimate", "process", "[Alien] §3.7 (1est)-(12est), (iv)", "the estimate step by step; the leading term"),
ROW("TranslateDictionary", "iut run TranslateDictionary", "process", "[Alien] §3.8", "the dictionary (1gau)-(11gau)"),
};

const size_t iut_idents_count = sizeof iut_idents / sizeof iut_idents[0];

int iut_ident_is_valid(const char *id)
{
    if (!id || !*id) return 0;
    for (const unsigned char *p = (const unsigned char *)id; *p; ++p)
        if (!((*p >= 'A' && *p <= 'Z') || (*p >= 'a' && *p <= 'z'))) return 0;
    return 1;
}

static int ieq(const char *a, const char *b)
{
    for (; *a && *b; ++a, ++b)
        if (tolower((unsigned char)*a) != tolower((unsigned char)*b)) return 0;
    return *a == *b;
}

int iut_ident_table_check(FILE *err)
{
    int bad = 0;
    for (size_t i = 0; i < iut_idents_count; ++i) {
        if (!iut_ident_is_valid(iut_idents[i].id)) {
            if (err) fprintf(err, "identifier %zu '%s' is not letters-only\n", i, iut_idents[i].id);
            bad++;
        }
        for (size_t j = 0; j < i; ++j)
            if (ieq(iut_idents[i].id, iut_idents[j].id)) {
                if (err) fprintf(err, "identifier '%s' duplicates '%s'\n", iut_idents[i].id, iut_idents[j].id);
                bad++;
            }
    }
    return bad;
}

const iut_ident *iut_ident_find(const char *id)
{
    for (size_t i = 0; i < iut_idents_count; ++i)
        if (ieq(iut_idents[i].id, id)) return &iut_idents[i];
    return NULL;
}

const iut_ident *iut_ident_by_notation(const char *notation)
{
    for (size_t i = 0; i < iut_idents_count; ++i)
        if (strcmp(iut_idents[i].notation, notation) == 0) return &iut_idents[i];
    return NULL;
}

/* -------------------------------------------------- prime-strip kind table */
static const struct { const char *id, *notation; int etale, mono, glob; } ps_kinds[IUT_PS_KIND_COUNT] = {
    { "DPrimeStrip",                          "D",     1, 0, 0 },
    { "DMonoPrimeStrip",                      "D⊢",    1, 1, 0 },
    { "FPrimeStrip",                          "F",     0, 0, 0 },
    { "FMonoPrimeStrip",                      "F⊢",    0, 1, 0 },
    { "FMonoUnitsPrimeStrip",                 "F⊢×",   0, 1, 0 },
    { "FMonoUnitsModTorsPrimeStrip",          "F⊢×μ",  0, 1, 0 },
    { "FMonoValUnitsModTorsPrimeStrip",       "F⊢▶×μ", 0, 1, 0 },
    { "FMonoGlobPrimeStrip",                  "F⊩",    0, 1, 1 },
    { "FMonoGlobValUnitsModTorsPrimeStrip",   "F⊩▶×μ", 0, 1, 1 },
};
const char *iut_ps_kind_id(iut_ps_kind k)       { return (unsigned)k < IUT_PS_KIND_COUNT ? ps_kinds[k].id : "Unknown"; }
const char *iut_ps_kind_notation(iut_ps_kind k) { return (unsigned)k < IUT_PS_KIND_COUNT ? ps_kinds[k].notation : "?"; }
int iut_ps_kind_is_etale_like(iut_ps_kind k)    { return (unsigned)k < IUT_PS_KIND_COUNT ? ps_kinds[k].etale : 0; }
int iut_ps_kind_is_mono_analytic(iut_ps_kind k) { return (unsigned)k < IUT_PS_KIND_COUNT ? ps_kinds[k].mono : 0; }
int iut_ps_kind_has_global(iut_ps_kind k)       { return (unsigned)k < IUT_PS_KIND_COUNT ? ps_kinds[k].glob : 0; }

static const struct { const char *id, *notation; } link_kinds[IUT_LINK_KIND_COUNT] = {
    { "ThetaLink",                       "Θ-link" },
    { "ThetaUnitsModTorsLink",           "Θ×μ-link" },
    { "ThetaUnitsModTorsGauLink",        "Θ×μ_gau-link" },
    { "ThetaUnitsModTorsLGPTorsorLink",  "Θ×μ_LGP-link" },
    { "ThetaUnitsModTorsLgpIdealLink",   "Θ×μ_lgp-link" },
    { "LogLink",                         "log-link" },
    { "DThetaPmEllNFLink",               "D-Θ±ell NF-link" },
};
const char *iut_link_kind_id(iut_link_kind k)       { return (unsigned)k < IUT_LINK_KIND_COUNT ? link_kinds[k].id : "Unknown"; }
const char *iut_link_kind_notation(iut_link_kind k) { return (unsigned)k < IUT_LINK_KIND_COUNT ? link_kinds[k].notation : "?"; }

/* -------------------------------------------------- species / mutations   */
/* [IUTchIV] §3: the log-theta-lattice is a mutation-history whose vertices  */
/* are species (Hodge theaters) and whose edges are mutations (links).       */
const iut_species iut_species_table[] = {
    { "InitialThetaData",            "initial Θ-data",            "[IUTchI] Def 3.1",   "(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲) satisfying the conditions of Def 3.1" },
    { "ThetaPmEllNFHodgeTheater",    "Θ±ell NF-Hodge theater",    "[IUTchI] Def 6.13",  "Θ±ell-HT glued to ΘNF-HT (a vertex • of the lattice)" },
    { "DThetaPmEllNFHodgeTheater",   "D-Θ±ell NF-Hodge theater",  "[IUTchI] Def 6.13",  "base categories only: étale-like, vertically coric" },
    { "ThetaPmEllHodgeTheater",      "Θ±ell-Hodge theater",       "[IUTchI] Def 6.13",  "additive symmetry F_l^{⋊±}; capsule indexed by F_l" },
    { "ThetaNFHodgeTheater",         "ΘNF-Hodge theater",         "[IUTchI] Def 5.5",   "multiplicative symmetry F_l^*; capsule indexed by F_l^*" },
    { "ThetaHodgeTheater",           "Θ-Hodge theater",           "[IUTchI] Def 3.6",   "(F⊩_mod, F⊩_tht)" },
    { "DPrimeStrip",                 "D-prime-strip",             "[IUTchI] Def 4.1",   "{Π_v}_{v∈V}" },
    { "DMonoPrimeStrip",             "D⊢-prime-strip",            "[IUTchI] Def 4.1",   "{G_v}_{v∈V}" },
    { "FPrimeStrip",                 "F-prime-strip",             "[IUTchI] Def 5.2",   "{Π_v ↷ O▷}" },
    { "FMonoPrimeStrip",             "F⊢-prime-strip",            "[IUTchI] Def 5.2",   "{G_v ↷ O▷} split" },
    { "FMonoUnitsModTorsPrimeStrip", "F⊢×μ-prime-strip",          "[IUTchII] Def 4.9",  "{G_v ↷ O×μ} + ×μ-Kummer structure" },
    { "FMonoValUnitsModTorsPrimeStrip","F⊢▶×μ-prime-strip",       "[IUTchII] Def 4.9",  "{G_v ↷ O▶ × O×μ}" },
    { "FMonoGlobPrimeStrip",         "F⊩-prime-strip",            "[IUTchI] Def 5.2",   "F⊢ + global realified Frobenioid" },
    { "FMonoGlobValUnitsModTorsPrimeStrip","F⊩▶×μ-prime-strip",   "[IUTchII] Def 4.9",  "F⊢▶×μ + global realified Frobenioid" },
    { "LogShell",                    "log-shell",                 "[IUTchIII] Def 1.1", "(p*)^{-1} log(O×_{K_v})" },
    { "TensorPacket",                "tensor packet of log-shells","[IUTchIII] Prop 3.1","⊗ of log-shells over S^±_{j+1}" },
    { "QPilot",                      "q-pilot object",            "[IUTchIII] Def 3.8", "{q̲_v}" },
    { "ThetaPilot",                  "Θ-pilot object",            "[IUTchIII] Def 3.8", "{q̲_v^{j²}}_{j=1..l*}" },
    { "MultiradialRepresentation",   "multiradial representation R^LGP", "[IUTchIII] Thm 3.11", "(a) tensor packets (b) splitting monoids (c) (F_mod^×)_j, up to Ind1-3" },
};
const size_t iut_species_count = sizeof iut_species_table / sizeof iut_species_table[0];

const iut_mutation iut_mutation_table[] = {
    { "LogLink",                        "log-link",          "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 1.1",   0 },
    { "ThetaUnitsModTorsLGPTorsorLink", "Θ×μ_LGP-link",      "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 3.8",   0 },
    { "ThetaUnitsModTorsLgpIdealLink",  "Θ×μ_lgp-link",      "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 3.8",   0 },
    { "ThetaUnitsModTorsGauLink",       "Θ×μ_gau-link",      "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchII] Cor 4.10",   0 },
    { "ThetaLink",                      "Θ-link",            "ThetaHodgeTheater",        "ThetaHodgeTheater",        "[IUTchI] Cor 3.7",     0 },
    { "ForgetToD",                      "HT ↦ D-HT",         "ThetaPmEllNFHodgeTheater", "DThetaPmEllNFHodgeTheater","[IUTchI] Def 6.13",    1 },
    { "ForgetToDMono",                  "F ↦ D⊢",            "FPrimeStrip",              "DMonoPrimeStrip",          "[IUTchI] Def 5.2",     1 },
    { "ForgetToUnitsModTors",           "F⊩ ↦ F⊢×μ",         "FMonoGlobPrimeStrip",      "FMonoUnitsModTorsPrimeStrip","[IUTchII] Def 4.9",  1 },
    { "LogShellConstruction",           "F ↦ I",             "FPrimeStrip",              "LogShell",                 "[IUTchIII] Prop 1.2",  0 },
    { "EtaleLogShellConstruction",      "D ↦ I(D)",          "DPrimeStrip",              "LogShell",                 "[IUTchIII] Prop 1.2",  1 },
    { "TensorPacketConstruction",       "{I_t} ↦ ⊗",         "LogShell",                 "TensorPacket",             "[IUTchIII] Prop 3.1",  0 },
    { "KummerDetachment",               "Frobenius-like ↦ étale-like", "FMonoGlobPrimeStrip","DThetaPmEllNFHodgeTheater","[IUTchIII] Rem 1.5.4",0 },
    { "MultiradialAlgorithm",           "Thm 3.11",          "ThetaPilot",               "MultiradialRepresentation","[IUTchIII] Thm 3.11",  0 },
};
const size_t iut_mutation_count = sizeof iut_mutation_table / sizeof iut_mutation_table[0];
