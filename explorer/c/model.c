/*
 * model.c — the objects of [IUTchI], the constructions between them and the
 * guided tour.  This file is the single source of the model: the TUI reads it
 * directly and `iutx json` writes it out for the web app (../web/data.js).
 *
 * Notation: a single underline is U+0332 (C̲_K, V̲, v̲, ε̲), a double underline
 * is U+0333 (X̳_v, F̳_v, q̳_v, Θ̳_v), exactly as printed in the paper.
 *
 * Identifiers follow the rule of src/iut_ids.c (letters only, symbol → word).
 * `iutx ids` lists which of them are in that table and which are new here.
 */
#include <ctype.h>
#include <string.h>
#include "iutx.h"

#define N(id, notation, kind, tags, ref, brief, parts) \
    { id, notation, kind, tags, ref, brief, parts }

const x_node x_nodes[] = {
/* ------------------------------------------------ act 0: initial Θ-data */
N("InitialThetaData", "(F̄/F, X_F, l, C̲_K, V̲, V^bad_mod, ε̲)", "datum", "global",
  "Def 3.1",
  "The seven pieces of data everything else is built from. Nothing in the theory is chosen after this point; "
  "every later object is either constructed from this data or is an abstract copy of something constructed from it.",
  "FBarOverF XF LPrime CUnderK VSet VBadMod EpsilonUnder"),
N("FBarOverF", "F̄/F", "field", "global", "Def 3.1 (a)",
  "A number field F containing √−1, with an algebraic closure F̄. G_F = Gal(F̄/F).", ""),
N("XF", "X_F", "curve", "global", "Def 3.1 (b)",
  "A once-punctured elliptic curve over F (the elliptic curve E_F with its origin removed) with stable reduction at "
  "every nonarchimedean place of F. C_F is its quotient by −1. The 2·3-torsion points of E_F are rational over F.", ""),
N("LPrime", "l", "datum", "global labels", "Def 3.1 (c)",
  "A prime number ≥ 5 such that the Galois action on the l-torsion points of E_F has image containing SL_2(F_l). "
  "All the labels of the theory are residues modulo l.", ""),
N("CUnderK", "C̲_K", "curve", "global", "Def 3.1 (d)",
  "A hyperbolic orbicurve of type (1, l-tors)± over K with K-core C_K: a degree l covering of C_K coming from a "
  "rank one quotient E_K[l] ↠ Q ≅ Z/lZ.", ""),
N("VSet", "V̲", "datum", "global", "Def 3.1 (e)",
  "A set of valuations of K that maps bijectively onto V_mod, the set of all valuations of F_mod: one chosen "
  "place of K above each place of F_mod. V̲ splits into V̲^bad, V̲^good, and into V̲^non, V̲^arc.", ""),
N("VBadMod", "V^bad_mod", "datum", "global", "Def 3.1 (b)",
  "A nonempty set of nonarchimedean valuations of F_mod of odd residue characteristic over which E_F has bad "
  "(multiplicative) reduction: the bad places the theory chooses to look at. Its complement is V^good_mod, "
  "which may still contain places of bad reduction.", ""),
N("EpsilonUnder", "ε̲", "datum", "global labels", "Def 3.1 (f)",
  "A cusp of C̲_K that comes from a nonzero element of Q. At each v̲ in V̲^bad it is the cusp of the canonical "
  "generator ±1. It is the origin from which the multiplicative labels are counted.", ""),
N("Fmod", "F_mod", "field", "global", "Def 3.1 (b)",
  "The field of moduli of X_F. F is Galois over F_mod of degree prime to l. V_mod is the set of valuations of F_mod.", ""),
N("KField", "K", "field", "global", "Def 3.1 (c)",
  "The finite Galois extension of F cut out by the kernel of G_F → GL_2(F_l): the field of the l-torsion points of E_F.", ""),
N("XUnderK", "X̲_K", "curve", "global", "Def 3.1 (d)",
  "The hyperbolic orbicurve of type (1, l-tors) over K determined by C̲_K, with X̲_K → C̲_K of degree 2 lying over X_K → C_K.", ""),
N("Fl", "F_l", "labelset", "labels", "§I1; Def 6.1",
  "The field with l elements, written −l⍟ < … < −1 < 0 < 1 < … < l⍟: the labels of the additive side.", ""),
N("FlAbs", "|F_l|", "labelset", "labels", "Ex 4.4 (i)",
  "F_l/{±1} = {0} ∪ F_l^⍟. It labels the cusps of C̲_v at a bad place.", ""),
N("FlStar", "F_l^⍟", "labelset", "labels", "§4, first paragraph",
  "F_l^×/{±1}, of cardinality l⍟ = (l−1)/2, written 1 < … < l⍟: the labels of the multiplicative side. It is a group, "
  "and it acts on itself by multiplication.", ""),
N("FlSemiPm", "F_l^⋊±", "group", "labels", "Def 6.1 (i)",
  "F_l ⋊ {±1}, acting on F_l by z ↦ ±z + λ. An F_l^⋊±-group is a set with a {±1}-orbit of bijections to F_l; an "
  "F_l^⋊±-torsor is a set with an F_l^⋊±-orbit of bijections to F_l.", ""),
N("XUnderUnderV", "X̳_v", "curve", "local", "Def 3.1 (e)",
  "At v̲ in V̲^bad: the covering of X̲_v of degree l got by extracting an l-th root of the theta function, "
  "a hyperbolic orbicurve of type (1, (Z/lZ)^Θ) over K_v.", ""),
N("XArrowV", "X→_v", "curve", "local", "Def 3.1 (f); Def 1.1",
  "At v̲ in V̲^good: the covering of X̲_v of degree l determined by ε̲, of type (1, l-tors→).", ""),
N("PiV", "Π_v", "group", "local etale", "Def 3.1 (e), (f)",
  "At a bad place the tempered fundamental group of X̳_v; at a good nonarchimedean place the étale fundamental "
  "group of X→_v.", "XUnderUnderV XArrowV"),
N("GV", "G_v", "group", "local etale mono", "Def 3.1 (e)",
  "The quotient Π_v ↠ G_v: the absolute Galois group of the base field K_v.", ""),

/* --------------------------------------- act 1: Frobenioids at each place */
N("DV", "D_v", "category", "local etale holomorphic", "Ex 3.2 (i); Ex 3.3 (i); Ex 3.4 (i)",
  "The base category at v̲. Bad: connected tempered coverings of X̳_v, B^temp(X̳_v)^0. Good nonarchimedean: "
  "B(X→_v)^0. Archimedean: the Aut-holomorphic orbispace of X→_v.", "PiV"),
N("DMonoV", "D^⊢_v", "category", "local etale mono", "Ex 3.2 (i); Ex 3.3 (i); Ex 3.4 (ii)",
  "The mono-analytic base category at v̲. Nonarchimedean: B(K_v)^0, the Galois category of G_v, a full subcategory "
  "of D_v. Archimedean: an object of the category TM^⊢ of split topological monoids.", "GV"),
N("FUnderUnderV", "F̳_v", "frobenioid", "local frobenius holomorphic", "Ex 3.2 (i); Ex 3.3 (i); Ex 3.4 (i)",
  "The Frobenioid at v̲ over the base D_v. Bad: the tempered Frobenioid of [EtTh] §5, which carries the "
  "Frobenioid-theoretic theta function. Good nonarchimedean: a p_v-adic Frobenioid, equal to C_v. Archimedean: "
  "a triple (C_v, D_v, κ_v).", "DV"),
N("CV", "C_v", "frobenioid", "local frobenius holomorphic", "Ex 3.2 (iii); Ex 3.3 (i)",
  "The p_v-adic Frobenioid inside F̳_v (its base-field-theoretic hull). Concretely the monoid O^▷ of nonzero "
  "integers of F̄_v with its Π_v-action.", "FUnderUnderV"),
N("ThetaUnderUnderV", "Θ̳_v", "datum", "local frobenius", "Ex 3.2 (ii)",
  "At a bad place: the reciprocal of the l-th root of the Frobenioid-theoretic theta function, normalised to be 1 "
  "at √−1. Determined up to a 2l-th root of unity and the action of l·Z̲.", "FUnderUnderV"),
N("QUnderUnderV", "q̳_v", "datum", "local frobenius", "Ex 3.2 (iv)",
  "At a bad place: q_v^(1/2l), a 2l-th root of the q-parameter of E at v̲, determined up to a 2l-th root of unity. "
  "It is the value of Θ̳_v at √−q_v.", ""),
N("CMonoV", "C^⊢_v", "frobenioid", "local frobenius mono", "Ex 3.2 (iv); Ex 3.3 (i)",
  "The p_v-adic Frobenioid over D^⊢_v whose divisor monoid is N·log_Φ(q̳_v) at a bad place (N·log_Φ(p_v) at a good "
  "nonarchimedean place). Concretely O^× × q̳_v^N with its G_v-action.", "DMonoV QUnderUnderV"),
N("TauMonoV", "τ^⊢_v", "datum", "local frobenius mono", "Ex 3.2 (iv)",
  "The μ_2l-orbit of characteristic splittings of C^⊢_v determined by q̳_v: the choice that separates the value "
  "group q̳_v^N from the units O^×.", "QUnderUnderV"),
N("FMonoV", "F^⊢_v", "frobenioid", "local frobenius mono", "Ex 3.2 (v); Ex 3.3 (i)",
  "The split Frobenioid (C^⊢_v, τ^⊢_v).", "CMonoV TauMonoV"),
N("DThetaV", "D^Θ_v", "category", "local etale", "Ex 3.2 (v)",
  "The category of products of Ÿ_v with objects of D^⊢_v. Forming the product with Ÿ_v is an equivalence "
  "D^⊢_v ≅ D^Θ_v.", "DMonoV"),
N("CThetaV", "C^Θ_v", "frobenioid", "local frobenius", "Ex 3.2 (v)",
  "The p_v-adic Frobenioid over D^Θ_v built from the monoid O^× · Θ̳_v^N: the same shape as C^⊢_v with Θ̳_v in "
  "the place of q̳_v.", "DThetaV ThetaUnderUnderV"),
N("TauThetaV", "τ^Θ_v", "datum", "local frobenius", "Ex 3.2 (v)",
  "The μ_2l-orbit of characteristic splittings of C^Θ_v determined by Θ̳_v.", "ThetaUnderUnderV"),
N("FThetaV", "F^Θ_v", "frobenioid", "local frobenius", "Ex 3.2 (v)",
  "The split Frobenioid (C^Θ_v, τ^Θ_v). There is a natural equivalence F^⊢_v ≅ F^Θ_v that sends q̳_v to Θ̳_v.",
  "CThetaV TauThetaV"),
N("CMonoGlobMod", "C^⊩_mod", "frobenioid", "global frobenius mono", "Ex 3.5 (i)",
  "The realification of the Frobenioid of arithmetic line bundles on F_mod. Its divisor monoid is one copy of "
  "R≥0 for each place of V_mod: arithmetic degrees.", "Fmod"),
N("RhoV", "ρ_v", "map", "global local", "Ex 3.5 (i)",
  "The isomorphism of monoids (each ≅ R≥0) between the v-part of the global divisor monoid and the realified local "
  "one, log_mod(p_v) ↦ (1/[K_v : (F_mod)_v]) · log_Φ(p_v). It is the exchange rate between global and local degrees.", ""),
N("FMonoGlobMod", "F^⊩_mod", "primestrip", "global frobenius mono", "Ex 3.5 (ii)",
  "The collection (C^⊩_mod, Prime(C^⊩_mod) ≅ V̲, {F^⊢_v}, {ρ_v}): the local split Frobenioids held together by a "
  "global realified Frobenioid, that is, by the product formula.", "CMonoGlobMod RhoV FMonoV"),
N("CMonoGlobTht", "C^⊩_tht", "frobenioid", "global frobenius mono", "Ex 3.5 (ii)",
  "A copy of C^⊩_mod whose divisor monoid is Φ_{C^⊩_mod} · log(Θ), generated by a formal symbol log(Θ).", "CMonoGlobMod"),
N("FMonoGlobTht", "F^⊩_tht", "primestrip", "global frobenius mono", "Ex 3.5 (ii)",
  "The Θ-version (C^⊩_tht, Prime(C^⊩_tht) ≅ V̲, {F^Θ_v}, {ρ^Θ_v}). It is naturally isomorphic to F^⊩_mod, by q̳_v ↦ Θ̳_v "
  "at the bad places.", "CMonoGlobTht FThetaV"),

/* ----------------------------------- act 2: Θ-Hodge theaters, the Θ-link */
N("ThetaHodgeTheater", "†HT^Θ", "theater", "frobenius holomorphic", "Def 3.6",
  "A Θ-Hodge theater: a collection ({†F̳_v}_{v̲ ∈ V̲}, †F^⊩_mod) of abstract categories, each of which admits some "
  "equivalence with the model object. Only the category structure is kept. †D_v, †D^⊢_v, †F^⊢_v, †F^Θ_v and †F^⊩_tht "
  "are then reconstructed from it by category theory.", "FUnderUnderV FMonoGlobMod"),
N("DdagHodgeTheater", "‡HT^Θ", "theater", "frobenius holomorphic", "Rem 3.6.1",
  "A second, distinct Θ-Hodge theater for the same initial Θ-data. It is not a copy with a preferred identification "
  "to †HT^Θ: the two are only known to be isomorphic.", "ThetaHodgeTheater"),
N("ThetaLink", "†HT^Θ —Θ→ ‡HT^Θ", "link", "frobenius mono", "Cor 3.7 (i)",
  "The full poly-isomorphism †F^⊩_tht ≅ ‡F^⊩_mod: the set of all isomorphisms between the Θ-version on the left and "
  "the q-version on the right. It is not a map of rings or of schemes.", "ThetaHodgeTheater DdagHodgeTheater FMonoGlobTht FMonoGlobMod"),
N("FrobeniusPicture", "… —Θ→ ⁿHT^Θ —Θ→ ⁿ⁺¹HT^Θ —Θ→ …", "picture", "frobenius", "Cor 3.8",
  "An infinite chain of distinct Θ-Hodge theaters indexed by n in Z, each Θ-linked to the next. It has the "
  "translation symmetry of Z and no symmetry that swaps two neighbours: it is order-conscious.", "ThetaLink"),
N("EtalePicture", "ⁿD_v — D^⊢_v — ᵐD_v", "picture", "etale", "Cor 3.9",
  "For each v̲, the base categories ⁿD_v of all the theaters, drawn as spokes around the single shared core D^⊢_v. "
  "It admits arbitrary permutations of the spokes: it is indifferent to order.", "FrobeniusPicture DMonoV"),

/* ------------------------------ act 3: §4, the multiplicative symmetry */
N("DPrimeStrip", "†D = {†D_v}", "primestrip", "local etale holomorphic", "Def 4.1 (i)",
  "A D-prime-strip: one category (or Aut-holomorphic orbispace) for each v̲ in V̲, each admitting an equivalence with "
  "D_v. An abstract copy of the local arithmetic holomorphic structure, with no map to any global object.", "DV VSet"),
N("DMonoPrimeStrip", "†D^⊢ = {†D^⊢_v}", "primestrip", "local etale mono", "Def 4.1 (iii)",
  "A D^⊢-prime-strip: the same with D^⊢_v. Every D-prime-strip has a mono-analyticization †D ↦ †D^⊢ "
  "(Def 4.1 (iv)).", "DMonoV VSet"),
N("LabCusp", "LabCusp(†D)", "labelset", "labels etale", "Def 4.1 (ii); Prop 4.2",
  "The set of label classes of cusps of a D-prime-strip. It is the same set at every v̲, it is an F_l^⍟-torsor with a "
  "canonical element †η_v, hence it is canonically F_l^⍟.", "DPrimeStrip FlStar"),
N("DCircDotGlobal", "D^⊚", "category", "global etale", "Def 4.1 (v)",
  "B(C̲_K)^0, the connected finite étale coverings of C̲_K: the global base of the multiplicative side. From "
  "π_1(D^⊚) one reconstructs F̄, its valuations, and LabCusp(D^⊚), an F_l^⍟-torsor.", "CUnderK"),
N("DJ", "†D_J = {†D_j}_{j ∈ J}", "capsule", "local etale holomorphic", "Ex 4.3 (iv); Def 4.6 (i)",
  "A capsule of l⍟ D-prime-strips indexed by a finite set J. At the start J is just a set: it has no preferred "
  "bijection with F_l^⍟.", "DPrimeStrip"),
N("DGt", "†D_>", "primestrip", "local etale holomorphic", "Ex 4.4 (ii); Def 4.6 (ii)",
  "The D-prime-strip that is the target of the Θ-bridge. Its labels are held fixed by all of its automorphisms.", "DPrimeStrip"),
N("DNFBridge", "†φ^NF_⍟ : †D_J → †D^⊚", "bridge", "global etale", "Ex 4.3; Def 4.6 (i)",
  "A D-NF-bridge: a poly-morphism from the capsule to the global base. It ties each local strip to the number "
  "field, and it is only defined up to the F_l^⍟-symmetry of D^⊚, which permutes J.", "DJ DCircDotGlobal"),
N("DThetaBridge", "†φ^Θ_⍟ : †D_J → †D_>", "bridge", "local etale", "Ex 4.4; Def 4.6 (ii)",
  "A D-Θ-bridge: at a bad place the component at j is given by the evaluation sections labelled j, at a good place "
  "by the full poly-isomorphism.", "DJ DGt"),
N("DThetaNFHodgeTheater", "†HT^D-ΘNF", "theater", "etale holomorphic", "Def 4.6 (iii)",
  "A D-ΘNF-Hodge theater: †D^⊚ ← †D_J → †D_>, a D-NF-bridge and a D-Θ-bridge with the same capsule.",
  "DNFBridge DThetaBridge"),
N("ChiJ", "†χ : J ≅ F_l^⍟", "map", "labels", "Prop 4.7 (i)",
  "The bijection that the D-Θ-bridge imposes on the index set: the evaluation sections at the bad places give each "
  "strip of the capsule a label in F_l^⍟.", "DThetaBridge"),
N("PhiLC", "†φ^LC_j", "map", "labels", "Ex 4.5; Prop 4.7 (ii)",
  "For each j, the isomorphism of F_l^⍟-torsors LabCusp(†D^⊚) ≅ LabCusp(†D_>) got by going through the strip j. "
  "†φ^LC_j is †φ^LC_1 followed by multiplication by j.", "DThetaNFHodgeTheater LabCusp"),
N("ZetaLabel", "†ζ_⍟ : LabCusp(†D^⊚) ≅ J", "map", "labels", "Prop 4.7 (iii)",
  "There is a unique global cusp class [†ε̲] with †φ^LC_j([†ε̲]) ↦ j for every j. It turns global cusps into capsule "
  "indices: the global object is what synchronises the labels.", "PhiLC ChiJ"),
N("Procession", "Prc(†D_J)", "capsule", "labels etale", "Prop 4.11 (i)",
  "The l⍟-procession: the nested sub-capsules for S⍟_1 ⊆ … ⊆ S⍟_j = {1, …, j} ⊆ … ⊆ S⍟_l⍟ = F_l^⍟.", "DJ ChiJ"),
N("DMonoGt", "†D^⊢_>", "primestrip", "local etale mono", "Cor 4.12 (i)",
  "The mono-analyticization of †D_>. It is the one thing all the theaters of a chain share: the mono-analytic core.",
  "DGt DMonoPrimeStrip"),
N("DThetaNFLink", "†HT^D-ΘNF —D→ ‡HT^D-ΘNF", "link", "etale mono", "Cor 4.12 (i)",
  "The D-ΘNF-link: the full poly-isomorphism †D^⊢_> ≅ ‡D^⊢_>.", "DMonoGt"),

/* ------------------------------------------- act 4: §5, ΘNF-Hodge theaters */
N("FPrimeStrip", "‡F = {‡F_v}", "primestrip", "local frobenius holomorphic", "Def 5.2 (i)",
  "An F-prime-strip: for each v̲ a category equivalent to C_v (a triple at an archimedean place). At a bad place "
  "it is modelled on Π_v acting on O^▷.", "CV VSet"),
N("FMonoPrimeStrip", "‡F^⊢ = {‡F^⊢_v}", "primestrip", "local frobenius mono", "Def 5.2 (ii)",
  "An F^⊢-prime-strip: for each v̲ a split Frobenioid isomorphic to F^⊢_v. At a bad place it is modelled on G_v "
  "acting on O^× × q̳_v^N.", "FMonoV VSet"),
N("FMonoGlobPrimeStrip", "‡F^⊩", "primestrip", "global frobenius mono", "Def 5.2 (iv)",
  "An F^⊩-prime-strip (‡C^⊩, Prime(‡C^⊩) ≅ V̲, ‡F^⊢, {‡ρ_v}): an F^⊢-prime-strip together with a global realified "
  "Frobenioid. F^⊩_mod and F^⊩_tht are of this type, so the Θ-link is an isomorphism of F^⊩-prime-strips.",
  "FMonoPrimeStrip CMonoGlobMod"),
N("FCircAstGlobal", "†F^⊛", "frobenioid", "global frobenius holomorphic", "Ex 5.1 (ii), (iii)",
  "A global Frobenioid over †D^⊛, the base that corresponds to C_{F_mod}: arithmetic divisors on the subfields of F̄, "
  "built from the copy M^⊛(†D^⊚) of F̄^× that anabelian geometry reconstructs from π_1(†D^⊚).", "DCircDotGlobal Fmod"),
N("FCircDotGlobal", "†F^⊚", "frobenioid", "global frobenius holomorphic", "Ex 5.1 (iii)",
  "The restriction †F^⊛|_{†D^⊚} of the global Frobenioid to †D^⊚.", "FCircAstGlobal DCircDotGlobal"),
N("FJ", "‡F_J = {‡F_j}_{j ∈ J}", "capsule", "local frobenius holomorphic", "Def 5.5 (i) (a)",
  "A capsule of l⍟ F-prime-strips. Its associated capsule of D-prime-strips is ‡D_J.", "FPrimeStrip DJ"),
N("FGt", "‡F_>", "primestrip", "local frobenius holomorphic", "Def 5.5 (ii) (c)",
  "The F-prime-strip tautologically associated to a Θ-Hodge theater. Its D-prime-strip is ‡D_>.", "ThetaHodgeTheater"),
N("NFBridge", "‡ψ^NF_⍟ : ‡F_J → ‡F^⊚ ⇢ ‡F^⊛", "bridge", "global frobenius", "Def 5.5 (i)",
  "An NF-bridge: the unique lift of a D-NF-bridge to Frobenioids, together with ‡F^⊚ ≅ ‡F^⊛|_{‡D^⊚}.", "FJ FCircDotGlobal FCircAstGlobal DNFBridge"),
N("ThetaBridge", "‡ψ^Θ_⍟ : ‡F_J → ‡F_> ⇢ ‡HT^Θ", "bridge", "local frobenius", "Def 5.5 (ii)",
  "A Θ-bridge: the poly-morphisms ‡F_j → ‡F_> determined by a D-Θ-bridge, with ‡F_> attached to a Θ-Hodge theater.",
  "FJ FGt ThetaHodgeTheater DThetaBridge"),
N("ThetaNFHodgeTheater", "‡HT^ΘNF", "theater", "frobenius holomorphic", "Def 5.5 (iii)",
  "A ΘNF-Hodge theater: ‡F^⊛ ⇠ ‡F^⊚ ← ‡F_J → ‡F_> ⇢ ‡HT^Θ, an NF-bridge and a Θ-bridge with the same capsule. Its "
  "base is a D-ΘNF-Hodge theater.", "NFBridge ThetaBridge"),

/* --------------------------------- act 5: §6, the additive symmetry, gluing */
N("DCircDotPmGlobal", "D^⊚±", "category", "global etale", "Def 6.1 (v)",
  "B(X̲_K)^0, the connected finite étale coverings of X̲_K: the global base of the additive side. It is a double "
  "covering of D^⊚.", "XUnderK"),
N("LabCuspPm", "LabCusp^±(†D)", "labelset", "labels etale", "Def 6.1 (iii); Prop 6.5",
  "The set of ±-label classes of cusps: an F_l^⋊±-group, in bijection with F_l up to sign, with a zero element †η⁰_v. "
  "Removing zero and dividing by ±1 gives back LabCusp.", "DPrimeStrip Fl"),
N("DT", "†D_T = {†D_t}_{t ∈ T}", "capsule", "local etale holomorphic", "Ex 6.2 (i); Def 6.4 (i)",
  "A capsule of l D-prime-strips indexed by an F_l^⋊±-group T.", "DPrimeStrip FlSemiPm"),
N("DBoxPlus", "†D_≻", "primestrip", "local etale holomorphic", "Def 6.4 (i)",
  "The D-prime-strip that is the target of the Θ±-bridge.", "DPrimeStrip"),
N("DThetaPmBridge", "†φ^Θ±_± : †D_T → †D_≻", "bridge", "local etale", "Ex 6.2; Def 6.4 (i)",
  "A D-Θ±-bridge: each component is a +-full poly-isomorphism, an isomorphism known up to positive automorphisms "
  "at each place.", "DT DBoxPlus"),
N("DThetaEllBridge", "†φ^Θell_± : †D_T → †D^⊚±", "bridge", "global etale", "Ex 6.3; Def 6.4 (ii)",
  "A D-Θell-bridge: a poly-morphism from the capsule to the global base D^⊚±, with T regarded as an F_l^⋊±-torsor.",
  "DT DCircDotPmGlobal"),
N("DThetaPmEllHodgeTheater", "†HT^D-Θ±ell", "theater", "etale holomorphic", "Def 6.4 (iii)",
  "A D-Θ±ell-Hodge theater: †D_≻ ← †D_T → †D^⊚±, a D-Θ±-bridge and a D-Θell-bridge with the same capsule.",
  "DThetaPmBridge DThetaEllBridge"),
N("TAbs", "†D_|T|", "capsule", "labels etale", "Def 6.4 (i)",
  "The l±-capsule got from †D_T by identifying the strips at t and −t through the bridge. Each strip is then "
  "only defined up to a positive automorphism.", "DT"),
N("TStar", "†D_T⍟", "capsule", "labels etale", "Def 6.4 (i)",
  "The l⍟-capsule indexed by T⍟ = |T| ∖ {0}.", "TAbs"),
N("GluingZeroBoxPlusToGt", "†D_0, †D_≻ ↦ †D_>;  †D_T|_(T∖{0}) ↦ †D_T⍟", "map", "labels etale", "Prop 6.7",
  "The functorial algorithm that makes a D-Θ-bridge out of a D-Θ±-bridge. Each of its two correspondences sends "
  "exactly two D-prime-strips to one.", "DThetaPmBridge TStar DThetaBridge"),
N("DThetaPmEllNFHodgeTheater", "†HT^D-Θ±ellNF", "theater", "etale holomorphic", "Def 6.13 (ii)",
  "A D-Θ±ellNF-Hodge theater: a D-Θ±ell-Hodge theater, a D-ΘNF-Hodge theater, and the (necessarily unique) gluing "
  "isomorphism between them.", "DThetaPmEllHodgeTheater DThetaNFHodgeTheater GluingZeroBoxPlusToGt"),
N("FT", "†F_T = {†F_t}_{t ∈ T}", "capsule", "local frobenius holomorphic", "Def 6.11 (i)",
  "A capsule of l F-prime-strips indexed by an F_l^⋊±-group T.", "FPrimeStrip DT"),
N("FBoxPlus", "†F_≻", "primestrip", "local frobenius holomorphic", "Def 6.11 (i)",
  "The F-prime-strip that is the target of the Θ±-bridge.", "FPrimeStrip DBoxPlus"),
N("ThetaPmBridge", "†ψ^Θ±_± : †F_T → †F_≻", "bridge", "local frobenius", "Def 6.11 (i)",
  "A Θ±-bridge: a poly-morphism of capsules of F-prime-strips that lifts a D-Θ±-bridge.", "FT FBoxPlus DThetaPmBridge"),
N("ThetaEllBridge", "†ψ^Θell_± : †F_T → †D^⊚±", "bridge", "global frobenius", "Def 6.11 (ii)",
  "A Θell-bridge: the poly-morphism †F_T → †D_T → †D^⊚± got from a D-Θell-bridge. Its target is still a base "
  "category: the additive side has no global Frobenioid.", "FT DThetaEllBridge"),
N("ThetaPmEllHodgeTheater", "†HT^Θ±ell", "theater", "frobenius holomorphic", "Def 6.11 (iii)",
  "A Θ±ell-Hodge theater: †F_≻ ← †F_T → †D^⊚±, a Θ±-bridge and a Θell-bridge with the same capsule.",
  "ThetaPmBridge ThetaEllBridge"),
N("ThetaPmEllNFHodgeTheater", "†HT^Θ±ellNF", "theater", "frobenius holomorphic", "Def 6.13 (i)",
  "A Θ±ellNF-Hodge theater: a Θ±ell-Hodge theater, a ΘNF-Hodge theater, and the (necessarily unique) gluing "
  "isomorphism between them. This is the object Theorem A constructs: a miniature model of conventional scheme "
  "theory, given by a system of Frobenioids.", "ThetaPmEllHodgeTheater ThetaNFHodgeTheater GluingZeroBoxPlusToGt DThetaPmEllNFHodgeTheater"),
};
const size_t x_nodes_count = sizeof x_nodes / sizeof x_nodes[0];

const x_act x_acts[] = {
{ "Initial Θ-data", "§3, Def 3.1",
  "Fix the input. An elliptic curve over a number field, a prime l, and a choice of one place of K above each place "
  "of the field of moduli. From here on nothing is chosen." },
{ "Frobenioids at each place", "§3, Ex 3.2 to Ex 3.5",
  "At every place of V̲ the curve gives a base category and a Frobenioid over it. At the bad places the Frobenioid "
  "carries the theta function Θ̳_v and the 2l-th root q̳_v of the q-parameter. One global realified Frobenioid "
  "ties the places together." },
{ "Θ-Hodge theaters and the Θ-link", "§3, Def 3.6 to Cor 3.9",
  "Forget where the categories came from and keep them only as abstract categories: that is a Θ-Hodge theater. Two "
  "such theaters can be linked by matching the Θ-version of one with the q-version of the other." },
{ "The multiplicative symmetry", "§4",
  "Only base categories now. The labels 1, …, l⍟ of F_l^⍟ are attached to l⍟ copies of the local data, and a global "
  "base D^⊚ = B(C̲_K)^0 holds them together with an F_l^⍟-symmetry." },
{ "ΘNF-Hodge theaters", "§5",
  "Put Frobenioids back on top of the base categories of §4: F-prime-strips over D-prime-strips, global Frobenioids "
  "over D^⊚, bridges over D-bridges." },
{ "The additive symmetry and the gluing", "§6",
  "The same for the labels −l⍟, …, l⍟ of F_l with the symmetry F_l^⋊±, over the global base D^⊚± = B(X̲_K)^0. The two "
  "halves are then glued along their prime-strips to give the Θ±ellNF-Hodge theater of Theorem A." },
};
const size_t x_acts_count = sizeof x_acts / sizeof x_acts[0];

#define S(id, act, title, ref, in, out, does, watch, fact, picture) \
    { id, act, title, ref, in, out, does, watch, fact, picture }

const x_step x_steps[] = {
/* ------------------------------------------------------------------ act 0 */
S("ChooseInitialThetaData", 0, "Choose initial Θ-data", "Def 3.1",
  "", "InitialThetaData FBarOverF XF LPrime CUnderK VSet VBadMod EpsilonUnder",
  "Fix (F̄/F, X_F, l, C̲_K, V̲, V^bad_mod, ε̲) subject to conditions (a) to (f) of Definition 3.1.",
  "The explorer holds only l and a finite window of V_mod with each place marked bad, good or archimedean. It checks "
  "the conditions that can be checked from that (l is a prime ≥ 5, V^bad_mod is nonempty, of odd residue characteristic "
  "and prime to l) and lists the others as assumed. It does not construct an elliptic curve.",
  "conditions", "places"),
S("DeriveFields", 0, "Derive the fields and the global curves", "Def 3.1 (b), (c), (d)",
  "InitialThetaData", "Fmod KField XUnderK",
  "F_mod is the field of moduli of X_F. K is the field of l-torsion points. C̲_K determines X̲_K of type (1, l-tors), "
  "sitting over X_K = X_F ×_F K.",
  "Two global curves now stand side by side: X̲_K, which will carry the additive symmetry, and C̲_K, which will carry "
  "the multiplicative one (Fig. I1.1).",
  "", "curves"),
S("DeriveLabels", 0, "Derive the label sets", "§I1; §4; Def 6.1 (i)",
  "LPrime", "Fl FlAbs FlStar FlSemiPm",
  "From l alone: l⍟ = (l−1)/2, l± = (l+1)/2, the field F_l, the quotient |F_l| = F_l/{±1}, the group "
  "F_l^⍟ = F_l^×/{±1} and the group F_l^⋊± = F_l ⋊ {±1}.",
  "These finite sets are the whole of the bookkeeping of a Hodge theater. Everything this explorer computes, it "
  "computes on them.",
  "labels", "labels"),
S("LocalizeAtV", 0, "Localize at each place of V̲", "Def 3.1 (e), (f)",
  "InitialThetaData XUnderK", "XUnderUnderV XArrowV PiV GV",
  "Base-change to K_v at each v̲. At a bad place take the l-th root of the theta function to get X̳_v; at a good "
  "place use ε̲ to get X→_v. Π_v is the tempered (bad) or étale (good) fundamental group, with quotient G_v.",
  "The local coverings are different at bad and good places, and neither kind extends the global symmetries: the "
  "F_l^⋊±-symmetry of X̲_K only extends to {±1}, the F_l^⍟-symmetry of C̲_K only to {1} (Fig. I1.1).",
  "places", "places"),
/* ------------------------------------------------------------------ act 1 */
S("BaseCategories", 1, "Form the base categories D_v and D^⊢_v", "Ex 3.2 (i); Ex 3.3 (i); Ex 3.4 (i), (ii)",
  "PiV GV", "DV DMonoV",
  "D_v is the category of connected (tempered) coverings, so its fundamental group is Π_v. D^⊢_v = B(K_v)^0 is the "
  "full subcategory that only sees G_v.",
  "D_v is the local arithmetic holomorphic structure. D^⊢_v is its mono-analytic shadow: passing from Π_v to G_v "
  "forgets the curve and keeps only the Galois group of the local field.",
  "places", "strip"),
S("LocalFrobenioids", 1, "Form the Frobenioids F̳_v and C_v", "Ex 3.2 (i), (iii); Ex 3.3 (i); Ex 3.4 (i)",
  "DV", "FUnderUnderV CV",
  "Over D_v put the Frobenioid F̳_v. At a bad place it is the tempered Frobenioid of [EtTh] and C_v is its "
  "base-field-theoretic hull; at a good nonarchimedean place F̳_v = C_v.",
  "A Frobenioid is a category of line bundles and divisors over a base category. D_v can be reconstructed from "
  "F̳_v by category theory alone (Ex 3.2 (vi) (d)), so F̳_v contains its own base.",
  "", "frobenioid"),
S("ThetaAndQ", 1, "Extract Θ̳_v and q̳_v at the bad places", "Ex 3.2 (ii), (iv)",
  "FUnderUnderV", "ThetaUnderUnderV QUnderUnderV",
  "Θ̳_v is the reciprocal of the l-th root of the theta function, normalised to 1 at √−1. Its value at √−q_v is "
  "q̳_v = q_v^(1/2l).",
  "Both are only determined up to 2l-th roots of unity (and Θ̳_v up to l·Z̲). Both are reconstructed "
  "category-theoretically from F̳_v.",
  "", "thetaq"),
S("SplitFrobenioids", 1, "Form the split Frobenioids F^⊢_v and F^Θ_v", "Ex 3.2 (iv), (v)",
  "CV DMonoV ThetaUnderUnderV QUnderUnderV", "CMonoV TauMonoV FMonoV DThetaV CThetaV TauThetaV FThetaV",
  "Over D^⊢_v the monoid O^× × q̳_v^N gives C^⊢_v with its splitting τ^⊢_v. Over D^Θ_v ≅ D^⊢_v the monoid "
  "O^× · Θ̳_v^N gives C^Θ_v with τ^Θ_v. The assignment q̳_v ↦ Θ̳_v is an equivalence F^⊢_v ≅ F^Θ_v.",
  "This is the local seed of the Θ-link: two Frobenioids of the same shape, one generated by a constant and one by "
  "a function. As abstract split Frobenioids they cannot be told apart.",
  "", "thetaq"),
S("GlobalRealified", 1, "Form the global realified Frobenioids", "Ex 3.5 (i), (ii)",
  "Fmod VSet FMonoV FThetaV", "CMonoGlobMod RhoV FMonoGlobMod CMonoGlobTht FMonoGlobTht",
  "C^⊩_mod is the realified Frobenioid of F_mod, one R≥0 for each place. ρ_v compares it with each local Frobenioid. "
  "F^⊩_mod bundles all of this; F^⊩_tht is the same with log(Θ) and F^Θ_v.",
  "The global Frobenioid is a device for currency exchange between the local divisor monoids (Rem 3.5.1 (ii)): it "
  "is what makes the product formula available.",
  "", "global"),
/* ------------------------------------------------------------------ act 2 */
S("AssembleThetaHodgeTheater", 2, "Assemble a Θ-Hodge theater", "Def 3.6",
  "FUnderUnderV FMonoGlobMod", "ThetaHodgeTheater",
  "†HT^Θ = ({†F̳_v}, †F^⊩_mod), where each †F̳_v is any category equivalent to F̳_v and †F^⊩_mod is any collection of "
  "data isomorphic to F^⊩_mod.",
  "The equivalences to the model objects are required to exist; they are not part of the data. From †F̳_v alone one "
  "then reconstructs †D_v, †D^⊢_v, †D^Θ_v, †F^⊢_v, †F^Θ_v and †F^⊩_tht.",
  "", "theater"),
S("SecondTheater", 2, "Take a second, distinct Θ-Hodge theater", "Rem 3.6.1",
  "ThetaHodgeTheater", "DdagHodgeTheater",
  "‡HT^Θ is another Θ-Hodge theater for the same initial Θ-data.",
  "Nothing identifies ‡ with †. Keeping them apart, rather than identifying them, is the whole point of the theory.",
  "", "theater"),
S("FormThetaLink", 2, "Link them: the Θ-link", "Cor 3.7",
  "ThetaHodgeTheater DdagHodgeTheater FMonoGlobTht", "ThetaLink",
  "The Θ-link is the full poly-isomorphism †F^⊩_tht ≅ ‡F^⊩_mod. At a bad place it reads †Θ̳_v ↦ ‡q̳_v.",
  "It is not compatible with the ring structures on the two sides. What it does preserve is †D^⊢_v ≅ ‡D^⊢_v (ii) and "
  "the units †O^× ≅ ‡O^× (iii). There are many such isomorphisms and none is distinguished (Rem 3.7.1).",
  "", "link"),
S("FormFrobeniusPicture", 2, "Chain them: the Frobenius-picture", "Cor 3.8",
  "ThetaLink", "FrobeniusPicture",
  "Take distinct theaters ⁿHT^Θ for n in Z and link each to the next.",
  "The chain can be shifted, but two neighbours cannot be swapped: the picture is order-conscious, or "
  "Frobenius-like.",
  "frobenius", "frobenius"),
S("FormEtalePicture", 2, "Look at the bases: the étale-picture", "Cor 3.9",
  "FrobeniusPicture DMonoV", "EtalePicture",
  "By Cor 3.7 (ii) all the ⁿD^⊢_v are identified up to isomorphism. Draw each ⁿD_v as a spoke around that single "
  "core D^⊢_v.",
  "Now every permutation of the spokes is a symmetry. The same chain looks ordered from the Frobenioids and "
  "unordered from the base categories; the étale-picture is a kind of canonical splitting of the Frobenius-picture.",
  "etale", "etale"),
/* ------------------------------------------------------------------ act 3 */
S("FormDPrimeStrips", 3, "Form D-prime-strips and their cusp labels", "Def 4.1 (i) to (iv); Prop 4.2",
  "DV DMonoV VSet FlStar", "DPrimeStrip DMonoPrimeStrip LabCusp",
  "A D-prime-strip is a collection {†D_v}, one abstract copy of D_v for each v̲. LabCusp(†D_v) is the set of label "
  "classes of cusps; Prop 4.2 identifies these sets for all v̲ and with F_l^⍟.",
  "A prime-strip is a local analytic section of Spec(K) → Spec(F_mod): one place of K over each place of F_mod, cut "
  "loose from the global field. The price is that the strips of a capsule are no longer tied to each other.",
  "places", "strip"),
S("FormGlobalBase", 3, "Form the global base D^⊚", "Def 4.1 (v); Ex 4.3 (i)",
  "CUnderK", "DCircDotGlobal",
  "D^⊚ = B(C̲_K)^0. Aut_ε(C̲_K) is the subgroup of Aut(C̲_K) fixing the cusp ε̲, and Aut(C̲_K)/Aut_ε(C̲_K) ≅ F_l^⍟: a "
  "Borel subgroup modulo a semi-unipotent one.",
  "This quotient is the F_l^⍟-symmetry. It is arithmetic: it comes from Gal(K/F), so it moves the places of K. "
  "V̲^Bor = Aut(C̲_K)·V̲ is the F_l^⍟-orbit of V̲^±un = Aut_ε(C̲_K)·V̲.",
  "flstar", "symmetry"),
S("FormDNFBridge", 3, "Build the D-NF-bridge", "Ex 4.3; Def 4.6 (i)",
  "DPrimeStrip DCircDotGlobal FlStar", "DJ DNFBridge",
  "Take a capsule †D_J of l⍟ D-prime-strips and a poly-morphism †φ^NF_⍟ : †D_J → †D^⊚, modelled on the restriction "
  "functors D_v → D^⊚ composed with the F_l^⍟-action.",
  "The bridge is an F_l^⍟-orbit. So F_l^⍟ acts simply transitively on the index set J: from the side of the number "
  "field no strip is first (Prop 4.9 (i)).",
  "flstar", "nfbridge"),
S("FormDThetaBridge", 3, "Build the D-Θ-bridge", "Ex 4.4; Def 4.6 (ii)",
  "DJ DPrimeStrip", "DGt DThetaBridge",
  "Take a further D-prime-strip †D_> and a poly-morphism †φ^Θ_⍟ : †D_J → †D_>. At a bad place the component at j "
  "comes from the evaluation sections labelled j; at a good place it is the full poly-isomorphism.",
  "An evaluation point is the translate by the 2-torsion point μ_− of a cusp with label j. There the theta function "
  "takes the values q̳_v^(j²), up to μ_2l. This is where the j² of the theory comes from.",
  "evaluation", "thetabridge"),
S("AssembleDThetaNFHodgeTheater", 3, "Assemble a D-ΘNF-Hodge theater", "Def 4.6 (iii)",
  "DNFBridge DThetaBridge", "DThetaNFHodgeTheater",
  "†HT^D-ΘNF = (†D^⊚ ← †D_J → †D_>).",
  "The same capsule is seen from two sides: from the number field, where its indices are permuted, and from the "
  "theta function, where they are fixed.",
  "", "dthetanf"),
S("TransportLabels", 3, "Transport the cusp labels", "Ex 4.5; Prop 4.7",
  "DThetaNFHodgeTheater LabCusp", "ChiJ PhiLC ZetaLabel",
  "The Θ-bridge gives †χ : J ≅ F_l^⍟. Going from †D^⊚ through the strip j to †D_> gives †φ^LC_j, and "
  "†φ^LC_j = j · †φ^LC_1. There is a unique [†ε̲] in LabCusp(†D^⊚) with †φ^LC_j([†ε̲]) = j for all j.",
  "So the abstract index set J acquires labels, and the global cusps of †D^⊚ become the same thing as the indices: "
  "†ζ_⍟ : LabCusp(†D^⊚) ≅ J.",
  "lctransport", "lctransport"),
S("FormProcessions", 3, "Form the procession", "Prop 4.11",
  "DJ ChiJ", "Procession",
  "Replace the capsule by the nested sequence of sub-capsules for S⍟_1 ⊆ S⍟_2 ⊆ … ⊆ S⍟_l⍟.",
  "If the labels of a capsule are forgotten, each of its l⍟ strips could be any of l⍟ labels: (l⍟)^(l⍟) possibilities. "
  "In a procession the j-th stage has only j possibilities: l⍟! in all.",
  "procession", "procession"),
S("FormMonoAnalyticCore", 3, "Find the mono-analytic core", "Cor 4.12",
  "DThetaNFHodgeTheater DMonoPrimeStrip", "DMonoGt DThetaNFLink",
  "Mono-analyticize †D_> to get †D^⊢_>. The D-ΘNF-link between two theaters is the full poly-isomorphism "
  "†D^⊢_> ≅ ‡D^⊢_>.",
  "In a chain of linked theaters ⁿD^⊢_> is a constant invariant. Around it the D-ΘNF-Hodge theaters are spokes that "
  "may be permuted arbitrarily (Fig. 4.7).",
  "etale", "etale"),
/* ------------------------------------------------------------------ act 4 */
S("FormFPrimeStrips", 4, "Form F-, F^⊢- and F^⊩-prime-strips", "Def 5.2 (i), (ii), (iv)",
  "CV FMonoV CMonoGlobMod VSet", "FPrimeStrip FMonoPrimeStrip FMonoGlobPrimeStrip",
  "An F-prime-strip is {‡F_v} with ‡F_v equivalent to C_v. An F^⊢-prime-strip has split Frobenioids isomorphic to "
  "F^⊢_v. An F^⊩-prime-strip adds a global realified Frobenioid.",
  "Fig. I1.2 lists the types by their model at a bad place: Π_v ↷ O^▷ for F, G_v ↷ O^× × q̳_v^N for F^⊢. Each "
  "F-strip has an underlying D-strip.",
  "", "stripkinds"),
S("FormGlobalFrobenioids", 4, "Form the global Frobenioids F^⊛ and F^⊚", "Ex 5.1 (i) to (iii)",
  "DCircDotGlobal Fmod", "FCircAstGlobal FCircDotGlobal",
  "From π_1(†D^⊚) anabelian geometry reconstructs a copy M^⊛(†D^⊚) of F̄^× with its field structure, and a base †D^⊛ "
  "for C_{F_mod} with †D^⊚ → †D^⊛. Arithmetic divisors then give the Frobenioid †F^⊛, and †F^⊚ is its restriction to "
  "†D^⊚.",
  "This is where the number field F_mod itself is reconstructed (as M^⊛_mod, the π_1(†D^⊛)-invariants). The explorer "
  "describes this step; it does not carry out the reconstruction.",
  "", "globalnf"),
S("FormNFBridge", 4, "Build the NF-bridge", "Ex 5.4; Def 5.5 (i)",
  "FPrimeStrip FCircDotGlobal FCircAstGlobal DNFBridge", "FJ NFBridge",
  "A capsule ‡F_J of l⍟ F-prime-strips and a poly-morphism ‡ψ^NF_⍟ : ‡F_J → ‡F^⊚ that lifts a D-NF-bridge, together "
  "with ‡F^⊚ ⇢ ‡F^⊛.",
  "The lift is unique (Cor 5.3 (ii)): the Frobenioid layer adds no new choices on top of the base layer.",
  "", "nfbridge"),
S("FormThetaBridge", 4, "Build the Θ-bridge", "Def 5.5 (ii)",
  "FJ ThetaHodgeTheater DThetaBridge", "FGt ThetaBridge",
  "‡F_> is the F-prime-strip of a Θ-Hodge theater, and ‡ψ^Θ_⍟ : ‡F_J → ‡F_> is determined by a D-Θ-bridge.",
  "This is where the Θ-Hodge theater of §3 is attached to the label machinery of §4.",
  "", "thetabridge"),
S("AssembleThetaNFHodgeTheater", 4, "Assemble a ΘNF-Hodge theater", "Def 5.5 (iii)",
  "NFBridge ThetaBridge", "ThetaNFHodgeTheater",
  "‡HT^ΘNF = (‡F^⊛ ⇠ ‡F^⊚ ← ‡F_J → ‡F_> ⇢ ‡HT^Θ).",
  "Forgetting the Frobenioids gives back a D-ΘNF-Hodge theater, and isomorphisms correspond bijectively (Cor 5.6).",
  "", "dthetanf"),
/* ------------------------------------------------------------------ act 5 */
S("FormGlobalBasePm", 5, "Form the global base D^⊚± and the ±-labels", "Def 6.1",
  "XUnderK DPrimeStrip Fl", "DCircDotPmGlobal LabCuspPm",
  "D^⊚± = B(X̲_K)^0. LabCusp^±(†D_v) is the set of ±-label classes of cusps, an F_l^⋊±-group with a zero element. "
  "Aut_±(D^⊚±)/Aut_csp(D^⊚±) ≅ F_l^⋊±.",
  "This symmetry is geometric: it comes from K-linear automorphisms of X̲_K, so it does not move the places of K. "
  "That is why it can permute copies of G_v without conjugacy indeterminacies (conjugate synchronization).",
  "pmaction", "symmetry"),
S("FormDThetaPmBridge", 5, "Build the D-Θ±-bridge", "Ex 6.2; Def 6.4 (i)",
  "DPrimeStrip FlSemiPm", "DT DBoxPlus DThetaPmBridge",
  "A capsule †D_T of l D-prime-strips indexed by an F_l^⋊±-group T, a D-prime-strip †D_≻, and "
  "†φ^Θ±_± : †D_T → †D_≻ whose components are +-full poly-isomorphisms.",
  "A +-full poly-isomorphism is an isomorphism up to automorphisms that act positively on the ±-labels. The signs "
  "at the places form a vector α in {±1}^V̲.",
  "pmaction", "pmbridge"),
S("FormDThetaEllBridge", 5, "Build the D-Θell-bridge", "Ex 6.3; Def 6.4 (ii)",
  "DT DCircDotPmGlobal", "DThetaEllBridge",
  "A poly-morphism †φ^Θell_± : †D_T → †D^⊚±, with T now regarded as an F_l^⋊±-torsor.",
  "The bridge is an F_l^⋊±-orbit, so F_l^⋊± acts transitively on the labels t in T: from the global side no label "
  "is zero.",
  "pmaction", "pmbridge"),
S("AssembleDThetaPmEllHodgeTheater", 5, "Assemble a D-Θ±ell-Hodge theater", "Def 6.4 (iii)",
  "DThetaPmBridge DThetaEllBridge", "DThetaPmEllHodgeTheater",
  "†HT^D-Θ±ell = (†D_≻ ← †D_T → †D^⊚±).",
  "On the Θ± side T is a group (it has a zero, known up to sign); on the Θell side it is only a torsor.",
  "", "pmbridge"),
S("FoldCapsule", 5, "Fold the capsule by ±1", "Def 6.4 (i); Prop 6.9",
  "DThetaPmBridge", "TAbs TStar",
  "Identify the strips at t and −t to get the l±-capsule †D_|T|, and drop 0 to get the l⍟-capsule †D_T⍟.",
  "The l±-procession on |T| reduces (l±)^(l±) possible labellings to l±!, as on the multiplicative side.",
  "pmprocession", "procession"),
S("GlueBases", 5, "Glue the two base theaters", "Prop 6.7; Rem 6.12.2; Def 6.13 (ii)",
  "DThetaPmEllHodgeTheater TStar DThetaNFHodgeTheater", "GluingZeroBoxPlusToGt DThetaPmEllNFHodgeTheater",
  "From the D-Θ±-bridge make a D-Θ-bridge: †D_T⍟ becomes the capsule †D_J, and †D_0 and †D_≻ are identified to "
  "form †D_>. Glue the D-Θ±ell-Hodge theater to a D-ΘNF-Hodge theater along it.",
  "The labels ±t ≠ 0 on the additive side become the label j on the multiplicative side. The gluing isomorphism "
  "is unique. The label 0 has no multiplicative partner: it goes to >.",
  "glue", "glue"),
S("AssembleThetaPmEllHodgeTheater", 5, "Assemble a Θ±ell-Hodge theater", "Def 6.11",
  "FPrimeStrip DThetaPmEllHodgeTheater", "FT FBoxPlus ThetaPmBridge ThetaEllBridge ThetaPmEllHodgeTheater",
  "Lift the D-Θ±-bridge to F-prime-strips: †ψ^Θ±_± : †F_T → †F_≻. Compose †F_T → †D_T with the D-Θell-bridge: "
  "†ψ^Θell_± : †F_T → †D^⊚±.",
  "This side is technically simpler than §5: no global Frobenioid is put over D^⊚±.",
  "", "pmbridge"),
S("AssembleThetaPmEllNFHodgeTheater", 5, "Glue: the Θ±ellNF-Hodge theater", "Def 6.13 (i); Theorem A",
  "ThetaPmEllHodgeTheater ThetaNFHodgeTheater GluingZeroBoxPlusToGt DThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater",
  "†HT^Θ±ellNF is the triple of a Θ±ell-Hodge theater, a ΘNF-Hodge theater and the gluing isomorphism between them.",
  "This is the end of [IUTchI] and one vertex of the diagrams of the later papers. The additive symmetry serves the "
  "theta function, the multiplicative one serves the number field, and the two meet only along prime-strips. The "
  "Θ-link of this paper is a simplified version; the links used later are built in [IUTchII] and [IUTchIII].",
  "glue", "glue"),
};
const size_t x_steps_count = sizeof x_steps / sizeof x_steps[0];

/* ------------------------------------------------------------- utilities */

int x_node_index(const char *id)
{
    for (size_t i = 0; i < x_nodes_count; i++)
        if (strcmp(x_nodes[i].id, id) == 0) return (int)i;
    return -1;
}

int x_step_index(const char *id)
{
    for (size_t i = 0; i < x_steps_count; i++)
        if (strcmp(x_steps[i].id, id) == 0) return (int)i;
    return -1;
}

int x_id_is_letters(const char *id)
{
    if (!id || !*id) return 0;
    for (const char *p = id; *p; p++)
        if (!((*p >= 'A' && *p <= 'Z') || (*p >= 'a' && *p <= 'z'))) return 0;
    return 1;
}

int x_next_token(const char **p, char *buf, size_t n)
{
    const char *s = *p;
    size_t k = 0;
    while (*s == ' ') s++;
    while (*s && *s != ' ') {
        if (k + 1 < n) buf[k++] = *s;
        s++;
    }
    buf[k] = 0;
    *p = s;
    return (int)k;
}

static int same_nocase(const char *a, const char *b)
{
    for (; *a && *b; a++, b++)
        if (tolower((unsigned char)*a) != tolower((unsigned char)*b)) return 0;
    return *a == *b;
}

static int check_list(FILE *err, const char *where, const char *what, const char *list)
{
    int bad = 0;
    char tok[96];
    const char *p = list;
    while (x_next_token(&p, tok, sizeof tok))
        if (x_node_index(tok) < 0) {
            fprintf(err, "%s: %s names unknown node %s\n", where, what, tok);
            bad++;
        }
    return bad;
}

int x_model_check(FILE *err)
{
    int bad = 0;
    char tok[96];
    static int producer[X_MAX_NODES];

    if (x_nodes_count > X_MAX_NODES) { fprintf(err, "too many nodes\n"); return 1; }
    if (x_steps_count > X_MAX_STEPS) { fprintf(err, "too many steps\n"); return 1; }

    for (size_t i = 0; i < x_nodes_count; i++) {
        const x_node *n = &x_nodes[i];
        producer[i] = -1;
        if (!x_id_is_letters(n->id)) { fprintf(err, "node id not letters only: %s\n", n->id); bad++; }
        for (size_t j = 0; j < i; j++)
            if (same_nocase(n->id, x_nodes[j].id)) { fprintf(err, "duplicate node id: %s\n", n->id); bad++; }
        if (!*n->notation || !*n->ref || !*n->brief || !*n->kind) {
            fprintf(err, "node %s: empty field\n", n->id); bad++;
        }
        bad += check_list(err, n->id, "parts", n->parts);
    }
    for (size_t i = 0; i < x_steps_count; i++) {
        const x_step *s = &x_steps[i];
        const char *p;
        if (!x_id_is_letters(s->id)) { fprintf(err, "step id not letters only: %s\n", s->id); bad++; }
        for (size_t j = 0; j < i; j++)
            if (same_nocase(s->id, x_steps[j].id)) { fprintf(err, "duplicate step id: %s\n", s->id); bad++; }
        if (x_node_index(s->id) >= 0) { fprintf(err, "step id is also a node id: %s\n", s->id); bad++; }
        if (s->act < 0 || (size_t)s->act >= x_acts_count) { fprintf(err, "step %s: bad act\n", s->id); bad++; }
        if (i > 0 && s->act < x_steps[i - 1].act) { fprintf(err, "step %s: acts out of order\n", s->id); bad++; }
        bad += check_list(err, s->id, "in", s->in);
        bad += check_list(err, s->id, "out", s->out);
        /* the tour must be runnable top to bottom */
        p = s->in;
        while (x_next_token(&p, tok, sizeof tok)) {
            int k = x_node_index(tok);
            if (k >= 0 && producer[k] < 0) {
                fprintf(err, "step %s needs %s, which no earlier step builds\n", s->id, tok); bad++;
            }
        }
        p = s->out;
        while (x_next_token(&p, tok, sizeof tok)) {
            int k = x_node_index(tok);
            if (k < 0) continue;
            if (producer[k] >= 0) {
                fprintf(err, "node %s is built twice (%s and %s)\n", tok, x_steps[producer[k]].id, s->id); bad++;
            }
            producer[k] = (int)i;
        }
        if (*s->fact) {
            int found = 0;
            for (size_t j = 0; j < x_fact_views_count; j++)
                if (strcmp(x_fact_views[j], s->fact) == 0) found = 1;
            if (!found) { fprintf(err, "step %s: unknown fact view %s\n", s->id, s->fact); bad++; }
        }
    }
    for (size_t i = 0; i < x_nodes_count; i++)
        if (producer[i] < 0) { fprintf(err, "node %s is never built\n", x_nodes[i].id); bad++; }
    return bad;
}
