import IUT.InitialThetaData
import IUT.PrimeStrip
import Mathlib.Algebra.GroupWithZero.Units.Fintype
import Mathlib.Data.Fintype.BigOperators
import Mathlib.Data.Fintype.Prod
import Mathlib.Data.Nat.Factorial.Basic
import Mathlib.Algebra.Order.Field.Basic
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Positivity
import Mathlib.Tactic.Linarith

/-!
# The constructions of [IUTchI] §0–§6 — `src/iut_i.h`

The C header `src/iut_i.h` (added with the IUT I data types) models the
*constructions* of [IUTchI] that sit between initial Θ-data and the
Hodge theaters: pseudo-monoids and poly-morphisms (§0), the orbicurves and
the cusps `ε, ε′, ε″, 2ε` (§1), the local and global realified Frobenioids
(§3), the label-cusp torsors, global base categories and bridge symmetry
groups (§4, §6), the global Frobenioids and the functorial algorithms on
prime-strips (§5).  This file ports the *finite* content of that header:
the enumerations, the numbers the C program computes from `l` and `|V|`,
and the facts about them the C sanity checks assert, as theorems.

The main numerical facts proved here (all for a prime `l ≥ 5` and a set `V`
of `n` places):

* `twoEps_ne_pmEps`: `2 ≢ ±1 (mod l)`, so the cusp `2ε` of §1 is distinct
  from `±ε` ([IUTchI] §1, the section `σ : G_k → J_C`);
* `CorOneTwo`: the indices of [IUTchI] Cor 1.2 (`[Δ_X : Δ_X→] = l²`,
  `[Δ_C : Δ_X→] = 2l²`, `Gal(X→/C̲) ≅ Z/2 × Z/l`);
* `card_signVectors`, `isoTorsorOrder_thetaPm`: the Θ±-bridge isomorphisms
  form a torsor over `{±1} × {±1}^V`, of order `2·2^|V|` ([IUTchI] Prop 6.6
  (i)) — the correction merged with the C code;
* `isoTorsorOrder`: the four bridge isomorphism torsors have orders `1`,
  `l*`, `2·2^|V|`, `2l` ([IUTchI] Prop 4.8, Prop 6.6);
* `autImageOrder_eq`: `|Borel/{±1}| = l(l−1)²/2 = |semi-unipotent/{±1}| · l*`
  ([IUTchI] Ex 4.3, Def 6.1 (v));
* `factorial_le_pow`: processions cut the `n^n` label assignments of the
  holomorphic capsule down to `n!` ([IUTchI] Prop 4.9/4.11, Prop 6.8/6.9);
* `rho_pos`, `rho_le_one`: the gluing data `ρ_v = 1/[K_v : (F_mod)_v]` of
  the global realified Frobenioid ([IUTchI] Ex 3.5), and
  `rhoTheta v j = ρ_v · j²` from `Θ̲_v(j) = q̲_v^{j²}`.
-/

namespace IUT

/-! ## §0: pseudo-monoids, poly-morphisms, anabelioids, fields -/

/-- The pseudo-monoids of [IUTchI] §0, Ex 5.1 (i), Def 5.2 (v)–(vi) and
Rem 3.1.7, in the order of the C enumeration `iut_pseudo_monoid_kind`. -/
inductive PseudoMonoidKind where
  /-- `M^⊛(†D^⊛) ≅ F̄^×`, carries the field structure -/
  | MCircAst
  /-- `M^⊛_mod ≅ F_mod^×` -/
  | MCircAstMod
  /-- `M^⊛_sol ≅ F_sol^×` (maximal solvable extension) -/
  | MCircAstSol
  /-- `M^⊛_κ`: κ-coric rational functions -/
  | MCircAstKappa
  /-- `M^⊛_∞κ`: ∞κ-coric, all roots adjoined -/
  | MCircAstInfKappa
  /-- `M^⊛_∞κ×`: ∞κ-coric times constants -/
  | MCircAstInfKappaUnits
  /-- `M^⊛_κ-sol` -/
  | MCircAstKappaSol
  /-- `M_v(‡D_v) ≅ O▷_{F̄_v}`, local -/
  | MV
  /-- `M_κv` -/
  | MKappaV
  /-- `M_∞κv` -/
  | MInfKappaV
  /-- `M_∞κ×v` -/
  | MInfKappaUnitsV
  deriving DecidableEq, Repr

namespace PseudoMonoidKind

/-- All eleven kinds, in the C order. -/
def all : List PseudoMonoidKind :=
  [.MCircAst, .MCircAstMod, .MCircAstSol, .MCircAstKappa, .MCircAstInfKappa,
   .MCircAstInfKappaUnits, .MCircAstKappaSol, .MV, .MKappaV, .MInfKappaV, .MInfKappaUnitsV]

theorem all_length : all.length = 11 := rfl

theorem all_nodup : all.Nodup := by decide

/-- The global pseudo-monoids live over `D^⊛`; the rest are local (over `D_v`). -/
def isGlobal : PseudoMonoidKind → Bool
  | .MV | .MKappaV | .MInfKappaV | .MInfKappaUnitsV => false
  | _ => true

/-- A pseudo-monoid is *divisible* if all roots have been adjoined (`∞κ`). -/
def isDivisible : PseudoMonoidKind → Bool
  | .MCircAst | .MCircAstInfKappa | .MCircAstInfKappaUnits | .MV | .MInfKappaV
  | .MInfKappaUnitsV => true
  | _ => false

/-- The pseudo-monoids that admit a Kummer theory are the ones that contain
the cyclotomes: the divisible ones ([IUTchI] Rem 5.1.3). -/
def isKummerReady (k : PseudoMonoidKind) : Bool := k.isDivisible

/-- Seven global and four local kinds. -/
theorem global_count : (all.filter isGlobal).length = 7 := by decide

theorem local_count : (all.filter fun k => !k.isGlobal).length = 4 := by decide

end PseudoMonoidKind

/-- The kinds of poly-morphisms of [IUTchI] §0 and Def 6.1 (iv), in the C
order `iut_poly_kind`. -/
inductive PolyKind where
  /-- a set of morphisms -/
  | morphism
  /-- a set of isomorphisms -/
  | isomorphism
  /-- the *full* poly-isomorphism: the set of all isomorphisms -/
  | fullIsomorphism
  /-- the +-full poly-isomorphism of Def 6.1 (iv): the `Aut_α`-orbit of an
  isomorphism, `α ∈ {±1}^V` a sign vector -/
  | plusFullIsomorphism
  /-- a capsule-full poly-morphism of capsules -/
  | capsuleFullMorphism
  /-- a capsule-full poly-isomorphism of capsules -/
  | capsuleFullIsomorphism
  deriving DecidableEq, Repr

namespace PolyKind

def all : List PolyKind :=
  [.morphism, .isomorphism, .fullIsomorphism, .plusFullIsomorphism,
   .capsuleFullMorphism, .capsuleFullIsomorphism]

theorem all_length : all.length = 6 := rfl

/-- The poly-morphisms consisting of isomorphisms only. -/
def isIsomorphismKind : PolyKind → Bool
  | .morphism | .capsuleFullMorphism => false
  | _ => true

/-- The kinds that are determined by their source and target alone ("full"). -/
def isFull : PolyKind → Bool
  | .fullIsomorphism | .capsuleFullMorphism | .capsuleFullIsomorphism => true
  | _ => false

end PolyKind

/-- A sign vector `α ∈ {±1}^V` ([IUTchI] Def 6.1 (iv)): the datum that
distinguishes the +-full poly-isomorphisms `Aut_α(†D)`.  `V` is indexed by
`Fin n`. -/
abbrev SignVector (n : ℕ) := Fin n → ℤˣ

/-- `|{±1}^V| = 2^|V|` (`iut_sign_vector_count`). -/
theorem card_signVectors (n : ℕ) : Fintype.card (SignVector n) = 2 ^ n := by
  simp [SignVector, Fintype.card_units_int, Fintype.card_fin]

/-- The all-plus sign vector (`all_plus` in C). -/
def SignVector.allPlus (n : ℕ) : SignVector n := fun _ => 1

/-- The all-minus sign vector. -/
def SignVector.allMinus (n : ℕ) : SignVector n := fun _ => -1

theorem SignVector.allPlus_ne_allMinus {n : ℕ} (hn : 0 < n) :
    SignVector.allPlus n ≠ SignVector.allMinus n := by
  intro h
  have := congrFun h ⟨0, hn⟩
  simp [SignVector.allPlus, SignVector.allMinus] at this

/-- The anabelioids of [IUTchI] §0: `B(Π)`, `B(X)`, `B(X)^0` (the connected
objects) and the tempered version `B^temp(X)`. -/
inductive AnabelioidKind where
  | BPi | BX | BXZero | BTemp
  deriving DecidableEq, Repr

/-- The field kinds of [IUTchI] §0: number field, mixed-characteristic local
field, complex archimedean field. -/
inductive FieldKind where
  | NF | MLF | CAF
  deriving DecidableEq, Repr

/-- The field kind of the completion at a place. -/
def FieldKind.ofValuation (v : Valuation) : FieldKind :=
  match v.kind with
  | .nonarch => .MLF
  | .arch => .CAF

/-! ## §1: the orbicurves and the cusps `ε, ε′, ε″, 2ε` -/

/-- The degrees of the coverings between the orbicurves of §1. -/
inductive CoverDeg where
  /-- cyclic of degree `l` -/
  | l
  /-- the quotient by `±1`, degree `2` -/
  | two
  /-- degree `2l` -/
  | twoL
  deriving DecidableEq, Repr

/-- The numerical degree. -/
def CoverDeg.degree (L : LPrime) : CoverDeg → ℕ
  | .l => L.l
  | .two => 2
  | .twoL => 2 * L.l

/-- The orbicurves of [IUTchI] §1, Def 1.1 and Def 3.1 (b), in the C order
`iut_orbicurve_kind`. -/
inductive OrbicurveKind where
  /-- `X`: the once-punctured elliptic curve, type `(1,1)` -/
  | X
  /-- `C = X/±1`, type `(1,1)±` -/
  | C
  /-- `X̲ → X`, cyclic of degree `l`, type `(1,l-tors)` -/
  | XUnder
  /-- `C̲ = X̲/±1`, type `(1,l-tors)±` -/
  | CUnder
  /-- `X→ → X̲`, cyclic of degree `l`, type `(1,l-tors→)` (Def 1.1) -/
  | XArrow
  /-- `C→ → C̲`, type `(1,l-tors→)±` -/
  | CArrow
  /-- `X̲̲_v`, type `(1,(Z/l)^Θ)`, `v ∈ V^bad` (Def 3.1 (b)) -/
  | XUnderUnderV
  /-- `C̲̲_v`, type `(1,(Z/l)^Θ)±` -/
  | CUnderUnderV
  /-- `C̲_v`, type `(1,Z/l)±` (Def 3.1 (b)) -/
  | CUnderV
  deriving DecidableEq, Repr

namespace OrbicurveKind

def all : List OrbicurveKind :=
  [.X, .C, .XUnder, .CUnder, .XArrow, .CArrow, .XUnderUnderV, .CUnderUnderV, .CUnderV]

theorem all_length : all.length = 9 := rfl

/-- The `±`-quotients: the orbicurves with a `±` in their type. -/
def isPmQuotient : OrbicurveKind → Bool
  | .C | .CUnder | .CArrow | .CUnderUnderV | .CUnderV => true
  | _ => false

/-- The local orbicurves (defined only at `v ∈ V^bad`). -/
def isLocal : OrbicurveKind → Bool
  | .XUnderUnderV | .CUnderUnderV | .CUnderV => true
  | _ => false

/-- The covering each orbicurve is presented as: its target and the degree.
`X` is the base; the local curves cover their global counterparts via the
completion, which is not a covering. -/
def coverOf : OrbicurveKind → Option (OrbicurveKind × CoverDeg)
  | .X => none
  | .C => none
  | .XUnder => some (.X, .l)
  | .CUnder => some (.C, .l)
  | .XArrow => some (.XUnder, .l)
  | .CArrow => some (.CUnder, .l)
  | .XUnderUnderV => some (.XUnder, .l)
  | .CUnderUnderV => some (.CUnder, .l)
  | .CUnderV => none

/-- The `±`-quotient map `X_? → C_?` has degree `2`. -/
def pmQuotient : OrbicurveKind → Option OrbicurveKind
  | .X => some .C
  | .XUnder => some .CUnder
  | .XArrow => some .CArrow
  | .XUnderUnderV => some .CUnderUnderV
  | _ => none

/-- Every `±`-quotient target is a `±`-quotient. -/
theorem pmQuotient_isPmQuotient :
    all.all (fun k => (k.pmQuotient.map isPmQuotient).getD true) = true := by decide

/-- Coverings go from a non-`±` curve to a non-`±` curve or between
`±`-quotients: the `±` is preserved. -/
theorem coverOf_preserves_pm :
    all.all (fun k => (k.coverOf.map fun p => p.1.isPmQuotient == k.isPmQuotient).getD true)
      = true := by decide

end OrbicurveKind

/-- The cusps of [IUTchI] §1: `ε ∈ F_l^*` a nonzero cusp of `C̲` (the C
program takes `ε = 1`), `ε′ = ε, ε″ = −ε ∈ F_l` the two cusps of `X̲` over it,
swapped by `ι`, and `2ε`, the cusp used to define the section
`σ : G_k → J_C`.  The sign of `ε′` is a choice. -/
structure CuspsSectionOne (L : LPrime) where
  /-- `ε′ ∈ F_l`, nonzero -/
  epsPrime : L.Fl
  epsPrime_ne_zero : epsPrime ≠ 0

namespace CuspsSectionOne

variable {L : LPrime} (c : CuspsSectionOne L)

/-- `ε″ = −ε′`: the other cusp of `X̲` over `ε`. -/
def epsDPrime : L.Fl := -c.epsPrime

/-- `ε = |ε′| ∈ F_l^*`. -/
def eps : ℕ := L.absLabel c.epsPrime

/-- `2ε′ ∈ F_l`. -/
def twoEps : L.Fl := 2 * c.epsPrime

theorem eps_mem_FlStar : c.eps ∈ L.FlStar :=
  (L.absLabel_mem_FlStar_iff _).mpr c.epsPrime_ne_zero

/-- `ε′ ≠ ε″`: the two cusps over `ε` are distinct (`l` is odd). -/
theorem epsPrime_ne_epsDPrime : c.epsPrime ≠ c.epsDPrime := by
  intro h
  have h2 : (2 : L.Fl) * c.epsPrime = 0 := by
    have := congrArg (· + c.epsPrime) h
    simp only [epsDPrime, neg_add_cancel] at this
    rw [← this]; ring
  rcases mul_eq_zero.mp h2 with h2 | h2
  · have : ((2 : ℕ) : L.Fl) = 0 := by exact_mod_cast h2
    rw [ZMod.natCast_eq_zero_iff] at this
    exact absurd (Nat.le_of_dvd (by norm_num) this) (by have := L.ge_five; omega)
  · exact c.epsPrime_ne_zero h2

/-- `ι` swaps `ε′` and `ε″` and acts as `−1`. -/
theorem epsDPrime_epsDPrime : -c.epsDPrime = c.epsPrime := by simp [epsDPrime]

/-- `|ε″| = |ε′| = ε`: both cusps of `X̲` lie over `ε`. -/
theorem absLabel_epsDPrime : L.absLabel c.epsDPrime = c.eps := L.absLabel_neg _

/-- `2 ≢ ±1 (mod l)` for `l ≥ 5` (`two_epsilon_ok` in C): the key numerical
fact behind the cusp `2ε`. -/
theorem two_ne_pm_one : (2 : L.Fl) ≠ 1 ∧ (2 : L.Fl) ≠ -1 := by
  have h5 := L.ge_five
  constructor
  · intro h
    have : ((1 : ℕ) : L.Fl) = 0 := by
      have := congrArg (· - (1 : L.Fl)) h
      simp only [sub_self] at this
      rw [← this]; push_cast; ring
    rw [ZMod.natCast_eq_zero_iff] at this
    exact absurd (Nat.le_of_dvd (by norm_num) this) (by omega)
  · intro h
    have : ((3 : ℕ) : L.Fl) = 0 := by
      have := congrArg (· + (1 : L.Fl)) h
      simp only [neg_add_cancel] at this
      rw [← this]; push_cast; ring
    rw [ZMod.natCast_eq_zero_iff] at this
    exact absurd (Nat.le_of_dvd (by norm_num) this) (by omega)

/-- `2ε′ ≠ ε′` and `2ε′ ≠ ε″`: the cusp `2ε` is distinct from both cusps
over `ε`, hence from `ε` in `C̲`. -/
theorem twoEps_ne_pmEps : c.twoEps ≠ c.epsPrime ∧ c.twoEps ≠ c.epsDPrime := by
  obtain ⟨h1, h2⟩ := two_ne_pm_one (L := L)
  constructor
  · intro h
    apply h1
    have := mul_right_cancel₀ c.epsPrime_ne_zero (show (2 : L.Fl) * c.epsPrime = 1 * c.epsPrime by
      simpa [twoEps] using h)
    exact this
  · intro h
    apply h2
    have := mul_right_cancel₀ c.epsPrime_ne_zero (show (2 : L.Fl) * c.epsPrime = (-1) * c.epsPrime by
      simpa [twoEps, epsDPrime] using h)
    exact this

/-- `|Δ_E ⊗ Z/l| = l²`, the rank of `I_ε′ × I_ε″ ≅ Ẑ²` is `2`, and `μ_−` has
order `2`: the constants of the C record. -/
def deltaEModLOrder : ℕ := L.l ^ 2

theorem deltaEModLOrder_eq : deltaEModLOrder (L := L) = L.l * L.l := by
  simp [deltaEModLOrder, sq]

end CuspsSectionOne

/-- The indices of [IUTchI] Cor 1.2 / Rem 1.2.1: what is reconstructed
group-theoretically from `Π_X→`. -/
structure CorOneTwo (L : LPrime) where
  /-- `[Δ_X : Δ_X̲] = l` -/
  idxXXUnder : ℕ := L.l
  /-- `[Δ_X̲ : Δ_X→] = l` -/
  idxXUnderXArrow : ℕ := L.l
  /-- `[Δ_C : Δ_X→] = 2l²` -/
  idxCXArrow : ℕ := 2 * L.l ^ 2
  /-- `Gal(X̲/C̲) ≅ Z/2` -/
  galXUnderOverCUnder : ℕ := 2
  /-- `Gal(C→/C̲) ≅ Z/l` -/
  galCArrowOverCUnder : ℕ := L.l
  /-- `Gal(X→/C̲) ≅ Z/2 × Z/l` -/
  galXArrowOverCUnder : ℕ := 2 * L.l
  /-- `Gal(X→/C→) ≅ Z/2`: the unique maximal subgroup of odd index -/
  galXArrowOverCArrow : ℕ := 2
  /-- `Aut_k(X→) ≅ Z/2l` (Rem 1.2.1) -/
  autXArrow : ℕ := 2 * L.l
  /-- `Aut_k(C→) ≅ Z/l` -/
  autCArrow : ℕ := L.l

namespace CorOneTwo

variable {L : LPrime}

/-- The canonical instance: all the default values. -/
def run (L : LPrime) : CorOneTwo L := {}

/-- `l² = [Δ_X : Δ_X̲]·[Δ_X̲ : Δ_X→] = [Δ_X : Δ_X→]`. -/
theorem lSquared_eq : (run L).idxXXUnder * (run L).idxXUnderXArrow = L.l ^ 2 := by
  simp [run, sq]

/-- `[Δ_C : Δ_X→] = 2·l²`. -/
theorem idxCXArrow_eq : (run L).idxCXArrow = 2 * ((run L).idxXXUnder * (run L).idxXUnderXArrow) := by
  simp [run, sq]

/-- `|Gal(X→/C̲)| = |Gal(X̲/C̲)| · |Gal(C→/C̲)| = 2l`: the two coverings are
independent. -/
theorem galXArrowOverCUnder_eq :
    (run L).galXArrowOverCUnder = (run L).galXUnderOverCUnder * (run L).galCArrowOverCUnder := by
  simp [run]

/-- `Gal(X→/C→)` has index `l` in `Gal(X→/C̲)`, which is odd: it is the
unique maximal subgroup of odd index. -/
theorem galXArrowOverCArrow_index :
    (run L).galXArrowOverCUnder = (run L).galXArrowOverCArrow * L.l ∧ Odd L.l := by
  exact ⟨by simp [run], L.odd⟩

/-- `Aut_k(X→)` is the group `Gal(X→/C̲)` and `Aut_k(C→)` is `Gal(C→/C̲)`. -/
theorem aut_eq : (run L).autXArrow = (run L).galXArrowOverCUnder ∧
    (run L).autCArrow = (run L).galCArrowOverCUnder := ⟨rfl, rfl⟩

end CorOneTwo

/-! ## §3: local Frobenioids and the global realified Frobenioid -/

/-- The three kinds of local Frobenioid data of [IUTchI] Ex 3.2–3.4, in the C
order `iut_local_frobenioid_kind`. -/
inductive LocalFrobenioidKind where
  /-- `v ∈ V^bad`: the tempered Frobenioid `F̲_v` with `q̲_v`, `Θ̲_v` (Ex 3.2) -/
  | bad
  /-- `v ∈ V^good ∩ V^non` (Ex 3.3) -/
  | goodNonarch
  /-- `v ∈ V^arc`: `(C_v, D_v, κ_v)` (Ex 3.4) -/
  | arch
  deriving DecidableEq, Repr

namespace LocalFrobenioidKind

/-- The kind of a place. -/
def ofValuation (v : Valuation) : LocalFrobenioidKind :=
  match v.kind, v.red with
  | .arch, _ => .arch
  | .nonarch, .badMult => .bad
  | .nonarch, _ => .goodNonarch

theorem ofValuation_bad_iff (v : Valuation) : ofValuation v = .bad ↔ v.inVBad := by
  unfold ofValuation Valuation.inVBad
  cases v.kind <;> cases v.red <;> simp

/-- The indeterminacy of the splitting `τ⊢_v`: a `μ_2l`-orbit at bad `v`,
canonical otherwise. -/
def splittingIndeterminacy (L : LPrime) : LocalFrobenioidKind → ℕ
  | .bad => 2 * L.l
  | _ => 1

/-- The indeterminacy of the roots of `Θ̲_v`: `μ_2l` at bad `v`. -/
def thetaRootIndeterminacy (L : LPrime) : LocalFrobenioidKind → ℕ
  | .bad => 2 * L.l
  | _ => 0

/-- Only the bad places carry a tempered structure and a theta function. -/
def isTempered : LocalFrobenioidKind → Bool
  | .bad => true
  | _ => false

/-- The splitting indeterminacy at a bad place is the order of `μ_2l`, the
same group that measures the roots of `Θ̲_v`. -/
theorem splittingIndeterminacy_bad (L : LPrime) :
    splittingIndeterminacy L .bad = thetaRootIndeterminacy L .bad := rfl

/-- At a bad place the indeterminacy is `2l`, twice the number of labels of
`LabCusp±`. -/
theorem splittingIndeterminacy_bad_eq (L : LPrime) :
    splittingIndeterminacy L .bad = 2 * Fintype.card L.Fl := by
  simp [splittingIndeterminacy, L.card_Fl]

end LocalFrobenioidKind

/-- The three global realified Frobenioids of [IUTchI] Ex 3.5. -/
inductive GlobalRealifiedKind where
  /-- `C⊩_mod`: the realification of the Frobenioid of `F_mod` -/
  | mod
  /-- `C⊩_tht`: the Θ-version, `log_mod(p_v)·log(Θ)` -/
  | tht
  /-- `D⊩_mod`: the étale-like version `(R_≥0)_v` with Frobenius elements -/
  | D
  deriving DecidableEq, Repr

/-- The local degree `[K_v : (F_mod)_v] = e_K f_K / (e_mod f_mod)` (as a
rational number; it is an integer for well-formed data). -/
def localDegree (v : Valuation) : ℚ := (v.eK * v.fK : ℚ) / (v.eMod * v.fMod)

/-- The gluing datum `ρ_v : log_mod(p_v) ↦ (1/[K_v : (F_mod)_v])·log_Φ(p_v)`
of [IUTchI] Ex 3.5 (ii) (`iut_rho_v`). -/
def rho (v : Valuation) : ℚ := (v.eMod * v.fMod : ℚ) / (v.eK * v.fK)

/-- `ρ^Θ_v` at label `j`: `log_mod(p_v)·log(Θ) ↦ ρ_v · log_Φ(p_v) · j²`, since
`Θ̲_v(j) = q̲_v^{j²}` (`iut_rho_theta_v`), here in units of `log_Φ(p_v)`. -/
def rhoTheta (v : Valuation) (j : ℕ) : ℚ := rho v * j ^ 2

theorem rho_mul_localDegree (v : Valuation) (h : v.WellFormed) : rho v * localDegree v = 1 := by
  have h1 : (v.eMod : ℚ) ≠ 0 := by exact_mod_cast h.eMod_pos.ne'
  have h2 : (v.fMod : ℚ) ≠ 0 := by exact_mod_cast h.fMod_pos.ne'
  have h3 : (v.eK : ℚ) ≠ 0 := by exact_mod_cast (lt_of_lt_of_le h.eMod_pos h.eMod_le_eK).ne'
  have h4 : (v.fK : ℚ) ≠ 0 := by exact_mod_cast (lt_of_lt_of_le h.fMod_pos h.fMod_le_fK).ne'
  unfold rho localDegree
  field_simp

/-- `ρ_v > 0`. -/
theorem rho_pos (v : Valuation) (h : v.WellFormed) : 0 < rho v := by
  unfold rho
  have h1 : (0 : ℚ) < v.eMod := by exact_mod_cast h.eMod_pos
  have h2 : (0 : ℚ) < v.fMod := by exact_mod_cast h.fMod_pos
  have h3 : (0 : ℚ) < v.eK := by exact_mod_cast lt_of_lt_of_le h.eMod_pos h.eMod_le_eK
  have h4 : (0 : ℚ) < v.fK := by exact_mod_cast lt_of_lt_of_le h.fMod_pos h.fMod_le_fK
  exact div_pos (mul_pos h1 h2) (mul_pos h3 h4)

/-- `ρ_v ≤ 1`: `K_v ⊇ (F_mod)_v`. -/
theorem rho_le_one (v : Valuation) (h : v.WellFormed) : rho v ≤ 1 := by
  unfold rho
  have h3 : (0 : ℚ) < v.eK * v.fK := by
    have h3 : (0 : ℚ) < v.eK := by exact_mod_cast lt_of_lt_of_le h.eMod_pos h.eMod_le_eK
    have h4 : (0 : ℚ) < v.fK := by exact_mod_cast lt_of_lt_of_le h.fMod_pos h.fMod_le_fK
    exact mul_pos h3 h4
  rw [div_le_one h3]
  exact_mod_cast Nat.mul_le_mul h.eMod_le_eK h.fMod_le_fK

/-- `ρ_v = 1` exactly when `K_v = (F_mod)_v`. -/
theorem rho_eq_one_iff (v : Valuation) (h : v.WellFormed) :
    rho v = 1 ↔ v.eK * v.fK = v.eMod * v.fMod := by
  unfold rho
  have h3 : (0 : ℚ) < v.eK * v.fK := by
    have h3 : (0 : ℚ) < v.eK := by exact_mod_cast lt_of_lt_of_le h.eMod_pos h.eMod_le_eK
    have h4 : (0 : ℚ) < v.fK := by exact_mod_cast lt_of_lt_of_le h.fMod_pos h.fMod_le_fK
    exact mul_pos h3 h4
  rw [div_eq_one_iff_eq h3.ne']
  constructor
  · intro e; exact_mod_cast e.symm
  · intro e; exact_mod_cast e.symm

/-- At `j = 1` the Θ-version is the original gluing datum. -/
theorem rhoTheta_one (v : Valuation) : rhoTheta v 1 = rho v := by simp [rhoTheta]

/-- `ρ^Θ_v` is monotone in the label `|j|`: the Θ-pilot's `j²`-growth. -/
theorem rhoTheta_mono (v : Valuation) (h : v.WellFormed) {j k : ℕ} (hjk : j ≤ k) :
    rhoTheta v j ≤ rhoTheta v k := by
  unfold rhoTheta
  have := rho_pos v h
  have : (j : ℚ) ^ 2 ≤ (k : ℚ) ^ 2 := by
    have : (j : ℚ) ≤ k := by exact_mod_cast hjk
    exact pow_le_pow_left₀ (by positivity) this 2
  nlinarith

/-- `Prime(C⊩_mod) ≅ V_mod`: the number of primes of the global realified
Frobenioid is `|V|` ([IUTchI] Ex 3.5 (i)). -/
def nprimes (d : InitialThetaData) : ℕ := d.V.length

/-! ## §4: label-cusp torsors, global base categories, iso torsors -/

/-- The label-cusp set `LabCusp(†D_v) ≅ F_l^*` of [IUTchI] Def 4.1 (ii): an
`F_l^*`-torsor with canonical element `†η_v = 1` (`iut_labcusp_torsor`).  The
action is `FlStarSym` of `IUT.Labels`. -/
def LabCusp (L : LPrime) : Finset ℕ := L.FlStar

/-- `|LabCusp| = l*`. -/
theorem card_LabCusp (L : LPrime) : (LabCusp L).card = L.LStar := L.card_FlStar

/-- The canonical element `†η_v = 1 ∈ LabCusp`. -/
theorem eta_mem_LabCusp (L : LPrime) : 1 ∈ LabCusp L :=
  L.mem_FlStar.mpr ⟨le_rfl, L.LStar_pos⟩

/-- `F_l^*` acts transitively on `LabCusp` (Prop 4.2: `LabCusp(†D)` is one
`F_l^*`-torsor). -/
theorem LabCusp_transitive (L : LPrime) {j j' : ℕ} (hj : j ∈ LabCusp L) (hj' : j' ∈ LabCusp L) :
    ∃ u : L.Flˣ, L.FlStarSym u j = j' :=
  L.FlStarSym_transitive hj hj'

/-- The signed version `LabCusp±(†D_v) ≅ F_l` of [IUTchI] Def 6.1 (ii), an
`F_l^{⋊±}`-group with zero element `†η⁰_v = 0` and ±-canonical element
`†η^±_v = ±1`. -/
abbrev LabCuspPm (L : LPrime) := L.Fl

/-- `|LabCusp±| = l`. -/
theorem card_LabCuspPm (L : LPrime) : Fintype.card (LabCuspPm L) = L.l := L.card_Fl

/-- Forgetting the sign, `LabCusp± ∖ {η⁰} → LabCusp`, `t ↦ |t|`
(`iut_labcusp_pm_forget`, Def 6.1 (iii)): it lands in `LabCusp` exactly off
the zero element … -/
theorem forget_mem_LabCusp (L : LPrime) (t : LabCuspPm L) :
    L.absLabel t ∈ LabCusp L ↔ t ≠ 0 := L.absLabel_mem_FlStar_iff t

/-- … is surjective … -/
theorem forget_surjective (L : LPrime) {j : ℕ} (hj : j ∈ LabCusp L) :
    ∃ t : LabCuspPm L, L.absLabel t = j := L.absLabel_surjective hj

/-- … and has fibres of size `2` over `LabCusp`:
`(LabCusp± ∖ {η⁰})/{±1} ≅ LabCusp`. -/
theorem forget_fibre_card (L : LPrime) {j : ℕ} (hj : j ∈ LabCusp L) :
    (Finset.univ.filter fun t : LabCuspPm L => L.absLabel t = j).card = 2 :=
  L.card_fibre_absLabel hj

/-- The two global base categories of [IUTchI] Def 4.1 (v), Ex 4.3 and Def
6.1 (v). -/
inductive GlobalBaseKind where
  /-- `D^⊛ = B(C̲_K)^0` -/
  | circAst
  /-- `D^⊚± = B(X̲_K)^0`, a double cover of `D^⊛` -/
  | circDotPm
  deriving DecidableEq, Repr

namespace GlobalBaseKind

/-- The identifier of the master table. -/
def ident : GlobalBaseKind → String
  | .circAst => "DCircAstGlobal"
  | .circDotPm => "DCircDotPmGlobal"

/-- `|LabCusp(D^⊛)| = l*`, `|LabCusp±(D^⊚±)| = l`. -/
def labcuspSize (L : LPrime) : GlobalBaseKind → ℕ
  | .circAst => L.LStar
  | .circDotPm => L.l

/-- The image of `Aut(C̲_K) ≅ Out(Π_{C̲_K})` in `GL_2(F_l)/{±1}` is the Borel
subgroup modulo `±1`, of order `l(l−1)²/2` (Ex 4.3). -/
def autImageOrder (L : LPrime) : ℕ := L.l * (L.l - 1) ^ 2 / 2

/-- The image of `Aut_ε(C̲_K)` is the semi-unipotent subgroup modulo `±1`,
of order `l(l−1)`. -/
def autEpsImageOrder (L : LPrime) : ℕ := L.l * (L.l - 1)

/-- `|Aut/Aut_ε| = l*` for `D^⊛`; `|Aut_±/Aut_csp| = 2l` for `D^⊚±`. -/
def quotientOrder (L : LPrime) : GlobalBaseKind → ℕ
  | .circAst => L.LStar
  | .circDotPm => 2 * L.l

/-- The quotient group: `F_l^*` resp. `F_l^{⋊±}`. -/
def quotientGroup : GlobalBaseKind → String
  | .circAst => "F_l^*"
  | .circDotPm => "F_l^{⋊±}"

/-- `D^⊚± → D^⊛` is a double covering. -/
def doubleCover : GlobalBaseKind → Bool
  | .circAst => false
  | .circDotPm => true

/-- `l(l−1)²/2 = l(l−1)·l*`: the Borel image is the semi-unipotent image
times `F_l^* = Aut/Aut_ε`, exactly. -/
theorem autImageOrder_eq (L : LPrime) : autImageOrder L = autEpsImageOrder L * L.LStar := by
  unfold autImageOrder autEpsImageOrder
  obtain ⟨s, hs⟩ : ∃ s, L.l = 2 * s + 1 := ⟨L.LStar, (L.two_LStar_add_one).symm⟩
  have hs' : L.LStar = s := by
    have := L.two_LStar_add_one; omega
  rw [hs, hs', Nat.add_sub_cancel]
  rw [show (2 * s + 1) * (2 * s) ^ 2 = ((2 * s + 1) * (2 * s) * s) * 2 by ring]
  exact Nat.mul_div_cancel _ two_pos

/-- The quotient order of `D^⊛` is `|Aut|/|Aut_ε|`. -/
theorem quotientOrder_circAst (L : LPrime) :
    autImageOrder L = autEpsImageOrder L * quotientOrder L .circAst :=
  autImageOrder_eq L

/-- The quotient of `D^⊚±` is twice the number of its labels; that of `D^⊛`
is the number of its labels: `F_l^{⋊±}` acts on `F_l` with stabilisers of
order `2`, `F_l^*` acts simply transitively on `F_l^*`. -/
theorem quotientOrder_eq (L : LPrime) :
    quotientOrder L .circDotPm = 2 * labcuspSize L .circDotPm ∧
    quotientOrder L .circAst = labcuspSize L .circAst := ⟨rfl, rfl⟩

/-- `F_l^{⋊±}` has `2l` elements, the quotient order of `D^⊚±`. -/
theorem card_FlSemiPm (L : LPrime) : Fintype.card L.FlSemiPm = quotientOrder L .circDotPm := by
  simp only [quotientOrder]
  rw [Fintype.ofEquiv_card, Fintype.card_prod, L.card_Fl, Fintype.card_units_int, mul_comm]

end GlobalBaseKind

/-- The four kinds of bridges ([IUTchI] Def 4.6, Def 5.5, Def 6.4). -/
inductive BridgeKind where
  /-- the Θ-bridge `†φ^Θ_⊛ : F_J → F_>` -/
  | theta
  /-- the NF-bridge `†φ^NF_⊛ : F_J → F_⊛` -/
  | nf
  /-- the Θ±-bridge `†φ^Θ±_± : F_T → F_⊞` -/
  | thetaPm
  /-- the Θell-bridge `†φ^Θell_± : D_T → D_⊚±` -/
  | thetaEll
  deriving DecidableEq, Repr

namespace BridgeKind

def all : List BridgeKind := [.theta, .nf, .thetaPm, .thetaEll]

/-- The identifier of the master table. -/
def ident : BridgeKind → String
  | .theta => "ThetaBridge"
  | .nf => "NFBridge"
  | .thetaPm => "ThetaPmBridge"
  | .thetaEll => "ThetaEllBridge"

/-- The group over which the isomorphisms between two bridges of the kind
form a torsor ([IUTchI] Prop 4.8 (i)–(ii), Prop 6.6 (i)–(ii)). -/
def isoGroup : BridgeKind → String
  | .theta => "trivial"
  | .nf => "F_l^*"
  | .thetaPm => "{±1} × {±1}^V"
  | .thetaEll => "F_l^{⋊±}"

/-- The order of that torsor, for `|V| = n` (`iut_iso_torsors`): `1`, `l*`,
`2·2^n`, `2l`. -/
def isoTorsorOrder (L : LPrime) (n : ℕ) : BridgeKind → ℕ
  | .theta => 1
  | .nf => L.LStar
  | .thetaPm => 2 * 2 ^ n
  | .thetaEll => 2 * L.l

/-- The Θ±-bridge torsor is `{±1} × {±1}^V` ([IUTchI] Prop 6.6 (i)): the
global sign and one sign per place.  Its order is `|ℤˣ × (Fin n → ℤˣ)|`. -/
theorem isoTorsorOrder_thetaPm (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .thetaPm = Fintype.card (ℤˣ × SignVector n) := by
  simp [isoTorsorOrder, Fintype.card_prod, Fintype.card_units_int]

/-- `2·2^n = 2^(n+1)`. -/
theorem isoTorsorOrder_thetaPm_eq (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .thetaPm = 2 ^ (n + 1) := by
  simp [isoTorsorOrder, pow_succ, mul_comm]

/-- The NF-bridge torsor is `F_l^* = LabCusp(D^⊛)`. -/
theorem isoTorsorOrder_nf (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .nf = (LabCusp L).card := (card_LabCusp L).symm

/-- The Θell-bridge torsor is `F_l^{⋊±}`, of order `2l`. -/
theorem isoTorsorOrder_thetaEll (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .thetaEll = Fintype.card L.FlSemiPm :=
  (GlobalBaseKind.card_FlSemiPm L).symm

/-- The Θ-bridge is rigid: its torsor is trivial ([IUTchI] Prop 4.8 (ii)). -/
theorem isoTorsorOrder_theta (L : LPrime) (n : ℕ) : isoTorsorOrder L n .theta = 1 := rfl

/-- The D-ΘNF-Hodge theater is rigid, the D-Θ±ell-Hodge theater has a `{±1}`
of automorphisms ([IUTchI] Prop 4.8 (iii), Prop 6.6 (iii)), and the gluings
of two bridges are torsors over the product of the two groups
(Prop 4.8 (iv), Prop 6.6 (iv)). -/
def hodgeTheaterIsoOrder (L : LPrime) (n : ℕ) : Bool → ℕ
  | false => isoTorsorOrder L n .theta
  | true => 2

/-- The gluing of the NF- and Θ-bridges: `F_l^*`. -/
theorem gluingNFTheta_order (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .nf * isoTorsorOrder L n .theta = L.LStar := by
  simp [isoTorsorOrder]

/-- The gluing of the Θ±- and Θell-bridges: `F_l^{⋊±} × {±1}^V`, of order
`2l · 2^n`; the global `±1` of the Θ±-bridge is absorbed by `F_l^{⋊±}`. -/
theorem gluingThetaPmEll_order (L : LPrime) (n : ℕ) :
    isoTorsorOrder L n .thetaEll * 2 ^ n = Fintype.card (L.FlSemiPm × SignVector n) := by
  rw [Fintype.card_prod, GlobalBaseKind.card_FlSemiPm L, card_signVectors]
  rfl

/-- All four torsor orders are positive. -/
theorem isoTorsorOrder_pos (L : LPrime) (n : ℕ) (k : BridgeKind) : 0 < isoTorsorOrder L n k := by
  cases k <;> simp [isoTorsorOrder, L.LStar_pos, L.prime.pos]

/-- Every bridge kind is an entry of the master identifier table. -/
theorem ident_mem_identifiers : all.all (fun k => (findIdent k.ident).isSome) = true := by
  decide +kernel

end BridgeKind

/-- The counts of [IUTchI] Prop 4.9 / Prop 6.8 (forgetting structure) and
Prop 4.11 / Prop 6.9 (processions), for `n = l*` (unsigned labels) or
`n = l±` (signed labels). -/
structure ForgetfulCounts where
  /-- `n`: the size of the capsule -/
  n : ℕ

namespace ForgetfulCounts

/-- The holomorphic capsule has an `S_n`-symmetry: `n!` automorphisms. -/
def symmetricGroupOrder (c : ForgetfulCounts) : ℕ := c.n.factorial

/-- Without the labels, `n^n` assignments of labels are possible. -/
def labelAssignments (c : ForgetfulCounts) : ℕ := c.n ^ c.n

/-- A procession cuts this down to `n!` (Prop 4.11 / Prop 6.9). -/
def processionAssignments (c : ForgetfulCounts) : ℕ := c.n.factorial

/-- The unsigned counts (`l*`) and the signed counts (`l±`). -/
def unsigned (L : LPrime) : ForgetfulCounts := ⟨L.LStar⟩

def signed (L : LPrime) : ForgetfulCounts := ⟨L.LPm⟩

/-- `n! ≤ n^n`: a procession never has more label assignments than the
unstructured capsule. -/
theorem factorial_le_pow (c : ForgetfulCounts) : c.processionAssignments ≤ c.labelAssignments :=
  Nat.factorial_le_pow c.n

/-- The procession assignments are the symmetries of the holomorphic capsule. -/
theorem processionAssignments_eq (c : ForgetfulCounts) :
    c.processionAssignments = c.symmetricGroupOrder := rfl

/-- The signed capsule has one more member than the unsigned one: `l± = l* + 1`
(the label `0`). -/
theorem signed_n (L : LPrime) : (signed L).n = (unsigned L).n + 1 := L.LPm_eq

/-- `F_l^*` acts simply transitively on `J = F_l^*` (Prop 4.9 (i)): the
`F_l^*`-action on `LabCusp` is transitive, and the stabiliser of `1` is
trivial on labels. -/
theorem unsigned_transitive (L : LPrime) {j j' : ℕ} (hj : j ∈ LabCusp L) (hj' : j' ∈ LabCusp L) :
    ∃ u : L.Flˣ, L.FlStarSym u j = j' := L.FlStarSym_transitive hj hj'

/-- `F_l^{⋊±}` acts transitively on `T = F_l` (Prop 6.8 (i)) … -/
theorem signed_transitive (L : LPrime) (t t' : L.Fl) : ∃ g : L.FlSemiPm, g • t = t' :=
  LPrime.FlSemiPm.exists_smul_eq L t t'

/-- … with the stabiliser of `0` equal to `{±1}`: the translation part of a
stabilising element vanishes. -/
theorem signed_stabilizer_zero (L : LPrime) (g : L.FlSemiPm) : g • (0 : L.Fl) = 0 ↔ g.shift = 0 := by
  show (g.sign : ℤ) • (0 : L.Fl) + g.shift = 0 ↔ g.shift = 0
  simp

end ForgetfulCounts

/-! ## §5: global Frobenioids, distributions, strip functors -/

/-- The global Frobenioids over `D^⊛` and their copies ([IUTchI] Ex 5.1
(ii)–(iii), (vii)), in the C order `iut_global_frobenioid_kind`. -/
inductive GlobalFrobenioidKind where
  /-- `F^⊛(†D^⊛)`: the model Frobenioid of arithmetic divisors, Kummer-ready -/
  | FCircAst
  /-- `F^⊛′` over `†D^⊛_mod`, Kummer-ready -/
  | FCircAstPrime
  /-- `F^⊛_mod`: the restriction to the terminal objects, Kummer-blind -/
  | FCircAstMod
  /-- `F^⊛_j`: a copy of `F^⊛_mod` for `j ∈ F_l^*`, over `V_j` -/
  | FCircAstJ
  /-- `F^⊛_⟨J⟩`: the diagonal copy over `V_⟨J⟩` -/
  | FCircAstAngleJ
  /-- `F^⊛_J = ∏_j F^⊛_j` over `V_J` -/
  | FCircAstJCaps
  deriving DecidableEq, Repr

namespace GlobalFrobenioidKind

def all : List GlobalFrobenioidKind :=
  [.FCircAst, .FCircAstPrime, .FCircAstMod, .FCircAstJ, .FCircAstAngleJ, .FCircAstJCaps]

theorem all_length : all.length = 6 := rfl

/-- Kummer-ready ([IUTchI] Rem 5.1.3): only the two full Frobenioids. -/
def kummerReady : GlobalFrobenioidKind → Bool
  | .FCircAst | .FCircAstPrime => true
  | _ => false

/-- The number of copies of `F^⊛_mod` involved: `l*` for `F^⊛_J`, one
otherwise. -/
def ncopies (L : LPrime) : GlobalFrobenioidKind → ℕ
  | .FCircAstJCaps => L.LStar
  | _ => 1

/-- The log-volume weight of [IUTchI] Rem 5.4.2: `F^⊛_⟨J⟩` *averages* over
`j` (weight `1/l*`), `F^⊛_J` *sums* (weight `1`). -/
def logVolumeWeight (L : LPrime) : GlobalFrobenioidKind → ℚ
  | .FCircAstAngleJ => 1 / L.LStar
  | _ => 1

/-- The copies that are built from `F^⊛_mod` are Kummer-blind. -/
theorem copies_not_kummerReady :
    all.all (fun k => k.ncopies ⟨5, by norm_num, le_rfl⟩ = 1 || !k.kummerReady) = true := by
  decide

/-- The weights are positive and at most `1`. -/
theorem logVolumeWeight_pos (L : LPrime) (k : GlobalFrobenioidKind) : 0 < logVolumeWeight L k := by
  cases k <;> simp [logVolumeWeight, L.LStar_pos]

theorem logVolumeWeight_le_one (L : LPrime) (k : GlobalFrobenioidKind) :
    logVolumeWeight L k ≤ 1 := by
  have h1 : (1 : ℚ) ≤ L.LStar := by exact_mod_cast Nat.succ_le_of_lt L.LStar_pos
  cases k <;> simp only [logVolumeWeight, le_refl]
  rw [one_div]
  exact inv_le_one_of_one_le₀ h1

/-- `l*` times the weight of `F^⊛_⟨J⟩` is the weight of `F^⊛_J`: the average
of `l*` equal contributions equals one of them, and the sum is `l*` of them
(Rem 5.4.2). -/
theorem LStar_mul_angleJ_weight (L : LPrime) :
    (L.LStar : ℚ) * logVolumeWeight L .FCircAstAngleJ = logVolumeWeight L .FCircAstJCaps := by
  have : (L.LStar : ℚ) ≠ 0 := by exact_mod_cast L.LStar_pos.ne'
  simp only [logVolumeWeight, one_div]
  exact mul_inv_cancel₀ this

end GlobalFrobenioidKind

/-- The distributions of [IUTchI] Ex 5.1 (vii): `V_j = {v_j}` a copy of `V`
for each `j ∈ F_l^*`, `V_J = ∏_j V_j` the arbitrary distributions, and the
diagonal `V_⟨J⟩ ↪ V_J` (the constant ones). -/
def distributionTotal (nj nV : ℕ) (diagonal : Bool) : ℕ :=
  if diagonal then nV else nV ^ nj

/-- The constant distributions are a subset of all of them. -/
theorem distributionTotal_diag_le (nj nV : ℕ) (hj : 0 < nj) :
    distributionTotal nj nV true ≤ distributionTotal nj nV false := by
  simp only [distributionTotal, ite_true]
  calc nV = nV ^ 1 := (pow_one nV).symm
    _ ≤ nV ^ nj := by
      rcases Nat.eq_zero_or_pos nV with h | h
      · subst h; simp [Nat.zero_pow hj]
      · exact Nat.pow_le_pow_right h hj

/-- The log-volume of the `F^⊛_⟨J⟩`-copy is the *average* over `j`, of the
`F^⊛_J`-copy the *sum* (Rem 5.4.2, `iut_distribution_log_volume`). -/
def distributionLogVolume (L : LPrime) (diagonal : Bool) (perJ : List ℚ) : ℚ :=
  if diagonal then perJ.sum / L.LStar else perJ.sum

/-- `l*` times the diagonal log-volume is the product log-volume. -/
theorem LStar_mul_distributionLogVolume (L : LPrime) (perJ : List ℚ) :
    (L.LStar : ℚ) * distributionLogVolume L true perJ = distributionLogVolume L false perJ := by
  have : (L.LStar : ℚ) ≠ 0 := by exact_mod_cast L.LStar_pos.ne'
  simp only [distributionLogVolume, ite_true]
  exact mul_div_cancel₀ _ this

/-- A functorial algorithm between kinds of strips ([IUTchI] Def 5.2, Rem
5.2.1, Cor 5.3), `iut_strip_functor`. -/
structure StripFunctor where
  /-- the source species (an identifier of the master table) -/
  src : String
  /-- the target species -/
  tgt : String
  /-- the name of the algorithm -/
  name : String
  /-- `Isom(src) → Isom(tgt)` is bijective (Cor 5.3) -/
  bijectiveOnIsoms : Bool
  /-- `Isom(src) → Isom(tgt)` is surjective -/
  surjectiveOnIsoms : Bool
  /-- the reference -/
  ref : String
  deriving DecidableEq, Repr

/-- The seven functorial algorithms of `iut_strip_functors`. -/
def stripFunctors : List StripFunctor := [
  ⟨"FPrimeStrip", "DPrimeStrip", "F ↦ D (forget the Frobenioids)", true, true,
    "[IUTchI] Rem 5.2.1 (i); Cor 5.3 (ii): Isom(F) → Isom(D) bijective"⟩,
  ⟨"FPrimeStrip", "FMonoPrimeStrip", "F ↦ F⊢ (mono-analyticization)", false, true,
    "[IUTchI] Rem 5.2.1 (ii); Rem 5.2.2: F Kummer-ready, F⊢ Kummer-blind"⟩,
  ⟨"FMonoPrimeStrip", "DMonoPrimeStrip", "F⊢ ↦ D⊢", false, true,
    "[IUTchI] Cor 5.3 (iii): Isom(F⊢) → Isom(D⊢) surjective, not injective"⟩,
  ⟨"FPrimeStrip", "FMonoGlobPrimeStrip", "F ↦ F⊩ (adjoin the global realified Frobenioid)",
    false, true, "[IUTchI] Rem 5.2.1 (iii); Def 5.2 (iv)"⟩,
  ⟨"DPrimeStrip", "DMonoPrimeStrip", "D ↦ D⊢ (Π_v ↦ G_v)", false, true, "[IUTchI] Def 4.1 (iv)"⟩,
  ⟨"FCircAstGlobal", "DCircAstGlobal", "F^⊛ ↦ Base(F^⊛) = D^⊛", true, true,
    "[IUTchI] Cor 5.3 (i): Isom(F^⊛) → Isom(D^⊛) bijective"⟩,
  ⟨"FUnderV", "DV", "F̲_v ↦ D_v (v ∈ V^bad)", true, true,
    "[IUTchI] Cor 5.3 (iv): Aut(F̲_v) → Aut(D_v) bijective"⟩
]

namespace StripFunctor

theorem stripFunctors_length : stripFunctors.length = 7 := rfl

/-- Bijective implies surjective: the flags are consistent. -/
theorem bijective_surjective :
    stripFunctors.all (fun f => !f.bijectiveOnIsoms || f.surjectiveOnIsoms) = true := by decide

/-- Every source and target is an entry of the master identifier table. -/
theorem endpoints_mem_identifiers :
    stripFunctors.all (fun f => (findIdent f.src).isSome && (findIdent f.tgt).isSome) = true := by
  decide +kernel

/-- Exactly three of the algorithms are bijective on isomorphisms: the ones
that forget the Frobenioid structure but keep the holomorphic base
(Cor 5.3 (i), (ii), (iv)). -/
theorem bijective_count : (stripFunctors.filter (·.bijectiveOnIsoms)).length = 3 := by decide

/-- The functors between the nine kinds of prime-strips of `IUT.PrimeStrip`
realise the forgetful maps `forget` of that module: they go from a
Kummer-ready kind to a kind that is at least as mono-analytic. -/
theorem strip_kinds :
    (stripFunctors.filterMap fun f =>
      (PrimeStripKind.all.find? fun k => k.ident = f.src).bind fun s =>
        (PrimeStripKind.all.find? fun k => k.ident = f.tgt).map fun t => (s, t)).all
      (fun p => !p.1.isMonoAnalytic || p.2.isMonoAnalytic) = true := by
  decide

end StripFunctor

/-! ## §6: `F_l^{⋊±}`-groups and torsors, Prop 6.7 -/

/-- An `F_l^{⋊±}`-group is a set with a `{±1}`-orbit of bijections to `F_l`;
an `F_l^{⋊±}`-torsor a set with an `F_l^{⋊±}`-orbit of bijections
([IUTchI] Def 6.1 (i)).  The size of the orbit is `2` resp. `2l`
(`iut_fl_semi_pm_set.orbit_size`). -/
def flSemiPmOrbitSize (L : LPrime) (isGroup : Bool) : ℕ :=
  if isGroup then 2 else 2 * L.l

/-- `Aut_+(T) ⊆ Aut_±(T)` has index `2` for an `F_l^{⋊±}`-group. -/
theorem flSemiPmOrbitSize_group (L : LPrime) : flSemiPmOrbitSize L true = 2 := rfl

/-- The torsor orbit is the whole group `F_l^{⋊±}`. -/
theorem flSemiPmOrbitSize_torsor (L : LPrime) :
    flSemiPmOrbitSize L false = Fintype.card L.FlSemiPm := by
  simp [flSemiPmOrbitSize, GlobalBaseKind.card_FlSemiPm, GlobalBaseKind.quotientOrder]

/-- The group orbit is the index-`2` part of the torsor orbit: `2 · l = 2l`. -/
theorem flSemiPmOrbitSize_eq (L : LPrime) :
    flSemiPmOrbitSize L false = flSemiPmOrbitSize L true * L.l := rfl

/-- Def 6.1 (i): the *positive* elements of `F_l` are `1, …, l*`, the negative
ones `−1, …, −l*`; `0` is neither. -/
def isPositive (L : LPrime) (t : L.Fl) : Bool := decide (0 < L.label t)

theorem isPositive_neg (L : LPrime) (t : L.Fl) (ht : t ≠ 0) :
    isPositive L (-t) = !isPositive L t := by
  unfold isPositive
  have h0 : L.label t ≠ 0 := by
    intro h
    apply ht
    have := L.absLabel_eq_zero_iff t
    simp only [LPrime.absLabel, LPrime.label] at *
    exact this.mp (by rw [h]; rfl)
  have hneg : L.label (-t) = -L.label t := by
    simp only [LPrime.label]
    exact ZMod.valMinAbs_neg_of_ne_half (by
      intro h
      apply L.two_LStar_ne_l
      have := L.l_div_two
      omega)
  rw [hneg]
  rcases lt_or_gt_of_ne h0 with h | h <;> simp [h, not_lt.mpr h.le]

/-- Prop 6.7: from a D-Θ±-bridge to a D-Θ-bridge, `T ∖ {0} → T*`, `t ↦ |t|`,
two labels `±t` to one `|t|`, and the strips `D_0, D_⊞ ↦ D_>`.  The label map
is `absLabel`; it sends `l − 1` nonzero signed labels onto the `l*` unsigned
ones, two to one. -/
theorem propSixSeven_label_map (L : LPrime) :
    (Finset.univ.filter fun t : L.Fl => t ≠ 0).card = 2 * L.FlStar.card := by
  have h1 : (Finset.univ.filter fun t : L.Fl => t ≠ 0).card = L.l - 1 := by
    rw [Finset.filter_ne', Finset.card_erase_of_mem (Finset.mem_univ _), Finset.card_univ, L.card_Fl]
  rw [h1, L.card_FlStar]
  have := L.two_LStar_add_one
  omega

/-- The sizes of the capsules: `l` signed labels (`n_from`), `l*` unsigned
ones (`n_to`). -/
theorem propSixSeven_sizes (L : LPrime) :
    Fintype.card L.Fl = L.l ∧ L.FlStar.card = L.LStar ∧ L.l = 2 * L.LStar + 1 :=
  ⟨L.card_Fl, L.card_FlStar, L.two_LStar_add_one.symm⟩

end IUT
