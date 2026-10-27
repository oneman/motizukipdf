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
ROW("BoxPlus", "⊞",   "symbol", "[IUTchI] §6; [Alien] §3.6",        "the label ⊞ of the Θ±-bridge target F_⊞ (additive, 'box plus')"),
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
