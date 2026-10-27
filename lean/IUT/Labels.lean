import Mathlib.Data.ZMod.Basic
import Mathlib.Data.ZMod.ValMinAbs
import Mathlib.Algebra.Field.ZMod
import Mathlib.Data.Nat.Prime.Basic
import Mathlib.Algebra.BigOperators.Intervals
import Mathlib.Order.Interval.Finset.SuccPred
import Mathlib.Tactic.Ring
import Mathlib.Tactic.Linarith

/-!
# The prime `l`, the label sets `F_l`, `|F_l|`, `F_l^*` and the two symmetries

[IUTchI] §0, §4, §6; [Alien] §3.3 (ii).  Initial Θ-data contains a prime
`l ≥ 5` ([IUTchI] Def 3.1 (c)); from it one forms

* `l* = (l − 1)/2` (`LStar`) and `l± = (l + 1)/2` (`LPm`),
* `F_l = {−l*, …, 0, …, l*}` (`Fl`, modelled as `ZMod l`), the labels `t` of
  the capsule of the Θ±ell-Hodge theater,
* `|F_l| = F_l/{±1} = {0, …, l*}` (`FlAbs`),
* `F_l^* = F_l^×/{±1} = {1, …, l*}` (`FlStar`), the labels `j` of the capsule
  of the ΘNF-Hodge theater,
* the additive symmetry `F_l^{⋊±} = F_l ⋊ {±1}` (`FlSemiPm`) acting on `F_l`
  (conjugate synchronization, [IUTchI] §6), and
* the multiplicative symmetry `F_l^*` (`FlStarSym`) acting on `F_l^*`
  ([IUTchI] §4).

The projection `F_l ⊇ F_l^× ↠ F_l^*` is `absLabel`; it is the map along which
the Θ±ell-Hodge theater and the ΘNF-Hodge theater are glued ("0, ⊞ ↦ >",
[IUTchI] Def 6.13 (iii)).  The main facts proved here are the ones the C
validator (`iut_validate_data`, `iut_validate_hodge_theater`) only checks on
examples: `l = 2l* + 1`, `l± = l* + 1`, `|F_l| = l`, `|F_l^*| = l*`, every
label `j ∈ F_l^*` comes from exactly the two labels `±j ∈ F_l`
(`card_fibre_absLabel`), the two symmetries really are group actions, and the
multiplicative action factors through `{±1}`.
-/

namespace IUT

/-- The prime `l ≥ 5` of initial Θ-data ([IUTchI] Def 3.1 (c)), packaged with
the proofs that make it usable as a modulus for `ZMod`. -/
structure LPrime where
  /-- the prime itself -/
  l : ℕ
  prime : l.Prime
  ge_five : 5 ≤ l

namespace LPrime

variable (L : LPrime)

instance : Fact L.l.Prime := ⟨L.prime⟩

instance : NeZero L.l := ⟨L.prime.ne_zero⟩

/-- `l* = (l − 1)/2` ([IUTchI] §0). -/
def LStar : ℕ := (L.l - 1) / 2

/-- `l± = (l + 1)/2` ([IUTchI] §0). -/
def LPm : ℕ := (L.l + 1) / 2

theorem odd : Odd L.l := L.prime.odd_of_ne_two (by have := L.ge_five; omega)

/-- `l = 2·l* + 1`. -/
theorem two_LStar_add_one : 2 * L.LStar + 1 = L.l := by
  obtain ⟨k, hk⟩ := L.odd
  unfold LStar
  omega

/-- `l± = l* + 1`: the two halves of `F_l` overlap exactly in `0`. -/
theorem LPm_eq : L.LPm = L.LStar + 1 := by
  have := L.two_LStar_add_one
  unfold LPm
  omega

/-- `l ≥ 5` gives `l* ≥ 2`, so `F_l^*` is never empty. -/
theorem two_le_LStar : 2 ≤ L.LStar := by
  have := L.two_LStar_add_one
  have := L.ge_five
  omega

theorem LStar_pos : 0 < L.LStar := by have := L.two_le_LStar; omega

theorem LStar_lt_l : L.LStar < L.l := by have := L.two_LStar_add_one; omega

/-- `l / 2 = l*` (integer division), the form in which `ZMod.valMinAbs` sees it. -/
theorem l_div_two : L.l / 2 = L.LStar := by
  have := L.two_LStar_add_one
  omega

theorem two_LStar_ne_l : 2 * L.LStar ≠ L.l := by
  have := L.two_LStar_add_one
  omega

/-- `F_l`, the field with `l` elements, whose elements are written
`t ∈ {−l*, …, l*}` ([IUTchI] §0). -/
abbrev Fl : Type := ZMod L.l

/-- `|F_l| = l`. -/
theorem card_Fl : Fintype.card L.Fl = L.l := ZMod.card _

/-- `F_l` is a field (so `F_l^×` is a group of order `l − 1 = 2·l*`). -/
example : Field L.Fl := inferInstance

/-- `|F_l| = F_l/{±1} = {0, 1, …, l*}` as a finite set of natural numbers. -/
def FlAbs : Finset ℕ := Finset.range (L.LStar + 1)

/-- `F_l^* = F_l^×/{±1} = {1, …, l*}` as a finite set of natural numbers. -/
def FlStar : Finset ℕ := Finset.Icc 1 L.LStar

theorem card_FlAbs : L.FlAbs.card = L.LStar + 1 := by simp [FlAbs]

/-- `|F_l^*| = l*`: the capsule of the ΘNF-Hodge theater has `l*` members. -/
theorem card_FlStar : L.FlStar.card = L.LStar := by simp [FlStar]

theorem mem_FlAbs {j : ℕ} : j ∈ L.FlAbs ↔ j ≤ L.LStar := by
  simp [FlAbs]

theorem mem_FlStar {j : ℕ} : j ∈ L.FlStar ↔ 1 ≤ j ∧ j ≤ L.LStar := by
  simp [FlStar]

theorem FlStar_subset_FlAbs : L.FlStar ⊆ L.FlAbs := by
  intro j hj
  rw [mem_FlStar] at hj
  rw [mem_FlAbs]
  exact hj.2

/-- The *label* `t ∈ {−l*, …, l*}` of an element of `F_l` ([IUTchI] §0), via
`ZMod.valMinAbs`. -/
def label (t : L.Fl) : ℤ := t.valMinAbs

theorem label_mem (t : L.Fl) : -(L.LStar : ℤ) ≤ L.label t ∧ L.label t ≤ L.LStar := by
  have h := ZMod.natAbs_valMinAbs_le t
  rw [L.l_div_two] at h
  unfold label
  omega

theorem label_injective : Function.Injective L.label := ZMod.injective_valMinAbs

/-- The projection `F_l → |F_l| = {0, …, l*}`, `t ↦ |t|`; restricted to
`F_l^×` this is the surjection `F_l^× ↠ F_l^*` of the gluing `0, ⊞ ↦ >`
([IUTchI] Def 6.13 (iii)). -/
def absLabel (t : L.Fl) : ℕ := t.valMinAbs.natAbs

theorem absLabel_le (t : L.Fl) : L.absLabel t ≤ L.LStar := by
  have h := ZMod.natAbs_valMinAbs_le t
  rwa [L.l_div_two] at h

theorem absLabel_mem_FlAbs (t : L.Fl) : L.absLabel t ∈ L.FlAbs :=
  L.mem_FlAbs.mpr (L.absLabel_le t)

theorem absLabel_neg (t : L.Fl) : L.absLabel (-t) = L.absLabel t :=
  ZMod.natAbs_valMinAbs_neg t

theorem absLabel_eq_zero_iff (t : L.Fl) : L.absLabel t = 0 ↔ t = 0 := by
  simp [absLabel, ZMod.valMinAbs_eq_zero]

theorem absLabel_mem_FlStar_iff (t : L.Fl) : L.absLabel t ∈ L.FlStar ↔ t ≠ 0 := by
  rw [mem_FlStar]
  have := L.absLabel_le t
  have := L.absLabel_eq_zero_iff t
  constructor
  · intro h ht
    have := this.mpr ht
    omega
  · intro h
    have : L.absLabel t ≠ 0 := fun e => h (this.mp e)
    omega

/-- The projection `F_l^× ↠ F_l^*` is surjective: every `j ∈ F_l^*` is hit. -/
theorem absLabel_surjective {j : ℕ} (hj : j ∈ L.FlStar) : ∃ t : L.Fl, L.absLabel t = j := by
  rw [mem_FlStar] at hj
  refine ⟨(j : L.Fl), ?_⟩
  unfold absLabel
  rw [ZMod.valMinAbs_natCast_of_le_half (by rw [L.l_div_two]; exact hj.2)]
  simp

/-- `(j : F_l) ≠ -(j : F_l)` for `1 ≤ j ≤ l*`: `2j ≢ 0 (mod l)` since `l` is an
odd prime. -/
theorem natCast_ne_neg {j : ℕ} (hj : j ∈ L.FlStar) : (j : L.Fl) ≠ -(j : L.Fl) := by
  rw [mem_FlStar] at hj
  intro h
  have h2 : ((2 * j : ℕ) : L.Fl) = 0 := by
    push_cast
    rw [two_mul]
    exact add_eq_zero_iff_eq_neg.mpr h
  rw [ZMod.natCast_eq_zero_iff] at h2
  rcases (Nat.Prime.dvd_mul L.prime).mp h2 with h' | h'
  · have := Nat.le_of_dvd (by norm_num) h'
    have := L.ge_five
    omega
  · have := Nat.le_of_dvd (by omega) h'
    have := L.LStar_lt_l
    omega

/-- The fibre of `F_l → |F_l|` over `j`: `|t| = j ↔ t = ±j`. -/
theorem absLabel_eq_iff {j : ℕ} (hj : j ≤ L.LStar) (t : L.Fl) :
    L.absLabel t = j ↔ t = (j : L.Fl) ∨ t = -(j : L.Fl) := by
  have hv : ((j : L.Fl)).valMinAbs = j :=
    ZMod.valMinAbs_natCast_of_le_half (by rw [L.l_div_two]; exact hj)
  have hvneg : (-(j : L.Fl)).valMinAbs = -(j : ℤ) := by
    rw [ZMod.valMinAbs_neg_of_ne_half, hv]
    rw [ZMod.val_natCast, Nat.mod_eq_of_lt (by have := L.LStar_lt_l; omega)]
    have := L.two_LStar_add_one
    omega
  unfold absLabel
  rw [Int.natAbs_eq_iff]
  constructor
  · rintro (h | h)
    · left; rw [← ZMod.valMinAbs_inj, hv, h]
    · right; rw [← ZMod.valMinAbs_inj, hvneg, h]
  · rintro (h | h)
    · left; rw [h, hv]
    · right; rw [h, hvneg]

/-- **The gluing `F_l^× ↠ F_l^*` is exactly 2-to-1**: for every `j ∈ F_l^*`
exactly two elements of `F_l`, namely `±j`, have label `j`.  This is the
condition checked (per example) by the C validator under
`GluingZeroBoxPlusToGt` ([IUTchI] Def 6.13 (iii)). -/
theorem card_fibre_absLabel {j : ℕ} (hj : j ∈ L.FlStar) :
    (Finset.univ.filter fun t : L.Fl => L.absLabel t = j).card = 2 := by
  have hj' := (L.mem_FlStar.mp hj).2
  have : (Finset.univ.filter fun t : L.Fl => L.absLabel t = j) = {(j : L.Fl), -(j : L.Fl)} := by
    ext t
    simp only [Finset.mem_filter, Finset.mem_univ, true_and, Finset.mem_insert,
      Finset.mem_singleton]
    exact L.absLabel_eq_iff hj' t
  rw [this, Finset.card_pair (L.natCast_ne_neg hj)]

/-- The fibre over `0` is `{0}`: the label `0 ∈ F_l` is the one identified with
`⊞` and then with `>` under the gluing (`LabelZero`). -/
theorem card_fibre_absLabel_zero :
    (Finset.univ.filter fun t : L.Fl => L.absLabel t = 0).card = 1 := by
  have : (Finset.univ.filter fun t : L.Fl => L.absLabel t = 0) = {0} := by
    ext t
    simp [L.absLabel_eq_zero_iff]
  rw [this, Finset.card_singleton]

/-! ### The additive symmetry `F_l^{⋊±} = F_l ⋊ {±1}` ([IUTchI] §6) -/

/-- An element `(a, s)` of `F_l^{⋊±} = F_l ⋊ {±1}`, acting on `F_l` by
`t ↦ s·t + a` ([IUTchI] §6; [Alien] §3.3 (ii)). -/
@[ext]
structure FlSemiPm where
  /-- the translation part `a ∈ F_l` -/
  shift : L.Fl
  /-- the sign `s ∈ {±1}` -/
  sign : ℤˣ

namespace FlSemiPm

variable {L}

/-- `(a₁, s₁)·(a₂, s₂) = (a₁ + s₁·a₂, s₁·s₂)`. -/
instance : Mul L.FlSemiPm :=
  ⟨fun g h => ⟨g.shift + (g.sign : ℤ) • h.shift, g.sign * h.sign⟩⟩

instance : One L.FlSemiPm := ⟨⟨0, 1⟩⟩

/-- `(a, s)⁻¹ = (−s·a, s)` (note `s⁻¹ = s` in `{±1}`). -/
instance : Inv L.FlSemiPm := ⟨fun g => ⟨-((g.sign⁻¹ : ℤˣ) : ℤ) • g.shift, g.sign⁻¹⟩⟩

@[simp] theorem mul_shift (g h : L.FlSemiPm) :
    (g * h).shift = g.shift + (g.sign : ℤ) • h.shift := rfl
@[simp] theorem mul_sign (g h : L.FlSemiPm) : (g * h).sign = g.sign * h.sign := rfl
@[simp] theorem one_shift : (1 : L.FlSemiPm).shift = 0 := rfl
@[simp] theorem one_sign : (1 : L.FlSemiPm).sign = 1 := rfl
@[simp] theorem inv_shift (g : L.FlSemiPm) :
    g⁻¹.shift = -((g.sign⁻¹ : ℤˣ) : ℤ) • g.shift := rfl
@[simp] theorem inv_sign (g : L.FlSemiPm) : g⁻¹.sign = g.sign⁻¹ := rfl

/-- `F_l^{⋊±}` is a group (the semi-direct product). -/
instance : Group L.FlSemiPm where
  mul_assoc a b c := by
    ext
    · simp only [mul_shift, mul_sign, Units.val_mul, zsmul_eq_mul, Int.cast_mul]
      ring
    · simp [mul_assoc]
  one_mul a := by ext <;> simp
  mul_one a := by ext <;> simp
  inv_mul_cancel a := by
    ext
    · simp only [mul_shift, inv_shift, inv_sign, one_shift, zsmul_eq_mul, Int.cast_neg, neg_mul]
      rcases Int.units_eq_one_or a.sign with h | h <;> simp [h]
    · simp

/-- The action `(a, s) • t = s·t + a` of `F_l^{⋊±}` on `F_l`. -/
instance : SMul L.FlSemiPm L.Fl := ⟨fun g t => (g.sign : ℤ) • t + g.shift⟩

@[simp] theorem smul_def (g : L.FlSemiPm) (t : L.Fl) :
    g • t = (g.sign : ℤ) • t + g.shift := rfl

/-- `F_l^{⋊±}` acts on `F_l`. -/
instance : MulAction L.FlSemiPm L.Fl where
  one_smul t := by simp
  mul_smul g h t := by
    simp only [smul_def, mul_shift, mul_sign, Units.val_mul, zsmul_eq_mul, Int.cast_mul]
    ring

variable (L)

/-- The translation by `a ∈ F_l` (an element of the normal subgroup `F_l`). -/
def translate (a : L.Fl) : L.FlSemiPm := ⟨a, 1⟩

/-- The sign change `t ↦ −t` (the `{±1}` quotient). -/
def negate : L.FlSemiPm := ⟨0, -1⟩

@[simp] theorem translate_smul (a t : L.Fl) : translate L a • t = t + a := by
  simp [translate, add_comm]

@[simp] theorem negate_smul (t : L.Fl) : negate L • t = -t := by
  simp [negate]

/-- The action of `F_l^{⋊±}` on `F_l` is transitive: this is the
"conjugate synchronization" that makes all the labels `t ∈ F_l` of the capsule
`F_T` interchangeable ([IUTchI] Cor 6.10; [IUTchII] Cor 4.5). -/
theorem exists_smul_eq (t t' : L.Fl) : ∃ g : L.FlSemiPm, g • t = t' :=
  ⟨translate L (t' - t), by simp [translate]⟩

/-- The subgroup `{±1}` fixes the label `0`, and `|·|` is invariant under the
whole group only up to the translation part: the sign part preserves
`absLabel`. -/
theorem absLabel_negate_smul (t : L.Fl) : L.absLabel (negate L • t) = L.absLabel t := by
  rw [negate_smul, L.absLabel_neg]

/-- `F_l^{⋊±}` has `2l` elements. -/
noncomputable instance : Fintype L.FlSemiPm :=
  Fintype.ofEquiv (L.Fl × ℤˣ)
    { toFun := fun p => ⟨p.1, p.2⟩
      invFun := fun g => (g.shift, g.sign)
      left_inv := fun _ => rfl
      right_inv := fun _ => rfl }

end FlSemiPm

/-! ### The multiplicative symmetry `F_l^* = F_l^×/{±1}` ([IUTchI] §4) -/

/-- The action of a unit `u ∈ F_l^×` on a label `j ∈ |F_l|`: `j ↦ |u·j|`.
Since `|−u·j| = |u·j|`, this factors through `F_l^×/{±1} = F_l^*`
(`FlStarSym_neg`), which is the multiplicative symmetry of [IUTchI] §4
([Alien] §3.3 (ii)). -/
def FlStarSym (u : L.Flˣ) (j : ℕ) : ℕ := L.absLabel ((u : L.Fl) * (j : L.Fl))

/-- The action factors through `{±1}`. -/
theorem FlStarSym_neg (u : L.Flˣ) (j : ℕ) : L.FlStarSym (-u) j = L.FlStarSym u j := by
  simp [FlStarSym, L.absLabel_neg]

/-- The multiplicative symmetry preserves `F_l^*` (units never send a non-zero
label to `0`). -/
theorem FlStarSym_mem_FlStar (u : L.Flˣ) {j : ℕ} (hj : j ∈ L.FlStar) :
    L.FlStarSym u j ∈ L.FlStar := by
  unfold FlStarSym
  rw [L.absLabel_mem_FlStar_iff]
  intro h
  rcases mul_eq_zero.mp h with h | h
  · exact u.ne_zero h
  · rw [ZMod.natCast_eq_zero_iff] at h
    rw [mem_FlStar] at hj
    have := Nat.le_of_dvd (by omega) h
    have := L.LStar_lt_l
    omega

/-- The trivial unit acts trivially on `F_l^*`. -/
theorem FlStarSym_one {j : ℕ} (hj : j ∈ L.FlStar) : L.FlStarSym 1 j = j := by
  unfold FlStarSym
  rw [Units.val_one, one_mul]
  exact (L.absLabel_eq_iff (L.mem_FlStar.mp hj).2 _).mpr (Or.inl rfl)

/-- Compatibility with the projection: `FlStarSym u |t| = |u·t|`. -/
theorem FlStarSym_absLabel (u : L.Flˣ) (t : L.Fl) :
    L.FlStarSym u (L.absLabel t) = L.absLabel ((u : L.Fl) * t) := by
  unfold FlStarSym absLabel
  rw [ZMod.natCast_natAbs_valMinAbs]
  split_ifs with h
  · rfl
  · rw [mul_neg, ZMod.natAbs_valMinAbs_neg]

/-- The multiplicative action is transitive on `F_l^*`: this is what makes the
labels `j ∈ F_l^*` of the capsule `F_J` interchangeable up to the
`F_l^*`-symmetry. -/
theorem FlStarSym_transitive {j j' : ℕ} (hj : j ∈ L.FlStar) (hj' : j' ∈ L.FlStar) :
    ∃ u : L.Flˣ, L.FlStarSym u j = j' := by
  have hj0 : (j : L.Fl) ≠ 0 := by
    intro h
    rw [ZMod.natCast_eq_zero_iff] at h
    rw [mem_FlStar] at hj
    have := Nat.le_of_dvd (by omega) h
    have := L.LStar_lt_l
    omega
  refine ⟨Units.mk0 (j' : L.Fl) ?_ * (Units.mk0 (j : L.Fl) hj0)⁻¹, ?_⟩
  · intro h
    rw [ZMod.natCast_eq_zero_iff] at h
    rw [mem_FlStar] at hj'
    have := Nat.le_of_dvd (by omega) h
    have := L.LStar_lt_l
    omega
  · unfold FlStarSym
    rw [Units.val_mul, Units.val_inv_eq_inv_val, Units.val_mk0, Units.val_mk0,
      mul_assoc, inv_mul_cancel₀ hj0, mul_one]
    exact (L.absLabel_eq_iff (L.mem_FlStar.mp hj').2 _).mpr (Or.inl rfl)

/-! ### Processions `S^±_{j+1} = {0, …, j}` and `S_{j+1} = {1, …, j+1}` -/

/-- The procession container `S^±_{j+1} = {0, 1, …, j}` ([IUTchI] Prop 6.9;
[IUTchIII] §3). -/
def SPmJPlusOne (j : ℕ) : Finset ℕ := Finset.range (j + 1)

/-- The multiplicative procession container `S_{j+1} = {1, …, j+1}`
([IUTchI] Prop 4.11). -/
def SJPlusOne (j : ℕ) : Finset ℕ := Finset.Icc 1 (j + 1)

@[simp] theorem card_SPmJPlusOne (j : ℕ) : (SPmJPlusOne j).card = j + 1 := by
  simp [SPmJPlusOne]

@[simp] theorem card_SJPlusOne (j : ℕ) : (SJPlusOne j).card = j + 1 := by
  simp [SJPlusOne]

/-- The processions form a chain `S^±_1 ⊂ S^±_2 ⊂ …`. -/
theorem SPmJPlusOne_mono {j k : ℕ} (h : j ≤ k) : SPmJPlusOne j ⊆ SPmJPlusOne k := by
  intro x hx
  simp only [SPmJPlusOne, Finset.mem_range] at hx ⊢
  omega

theorem SPmJPlusOne_subset_succ (j : ℕ) : SPmJPlusOne j ⊆ SPmJPlusOne (j + 1) :=
  SPmJPlusOne_mono (by omega)

/-- `S^±_{l*+1} = |F_l|`: the last procession container is the whole of `|F_l|`. -/
theorem SPmJPlusOne_LStar : SPmJPlusOne L.LStar = L.FlAbs := rfl

/-! ### The exponents `j²` and the dilation `(1/l*) Σ j² = l(l+1)/12` -/

/-- `6 · Σ_{j=0}^{n} j² = n(n+1)(2n+1)`. -/
theorem six_mul_sum_sq (n : ℕ) :
    6 * ∑ j ∈ Finset.range (n + 1), j ^ 2 = n * (n + 1) * (2 * n + 1) := by
  induction n with
  | zero => simp
  | succ n ih =>
    rw [Finset.sum_range_succ, mul_add, ih]
    ring

/-- `Σ_{j=1}^{l*} j²`, the total exponent of `q̲` in the Θ-pilot
`{q̲^{j²}}_{j = 1..l*}` ([IUTchIII] Def 3.8 (i)). -/
def sumSq : ℕ := ∑ j ∈ L.FlStar, j ^ 2

/-- `12 · Σ_{j=1}^{l*} j² = l* · l · (l+1)`: the average exponent
`(1/l*) Σ j²` of the Θ-pilot is `l(l+1)/12`, the "dilation" of the value
groups across a Θ-link ([IUTchIII] Rem 3.12.1; [IUTchIV] Thm 1.10). -/
theorem twelve_mul_sumSq : 12 * L.sumSq = L.LStar * L.l * (L.l + 1) := by
  unfold sumSq FlStar
  have h : ∑ j ∈ Finset.Icc 1 L.LStar, j ^ 2 = ∑ j ∈ Finset.range (L.LStar + 1), j ^ 2 := by
    rw [← Finset.Ico_succ_right_eq_Icc, Nat.succ_eq_succ, Finset.sum_Ico_eq_sum_range,
      Finset.sum_range_succ', Nat.succ_sub_one]
    simp only [zero_pow (by norm_num : (2 : ℕ) ≠ 0), add_zero]
    exact Finset.sum_congr rfl fun k _ => by ring
  rw [h, show (12 : ℕ) = 2 * 6 by rfl, mul_assoc, six_mul_sum_sq]
  have := L.two_LStar_add_one
  rw [← this]
  ring

/-- The same identity over `ℚ`: `(Σ_{j=1}^{l*} j²) / l* = l(l+1)/12`. -/
theorem sumSq_div_LStar : (L.sumSq : ℚ) / L.LStar = L.l * (L.l + 1) / 12 := by
  have h := L.twelve_mul_sumSq
  have hpos : (L.LStar : ℚ) ≠ 0 := by
    have := L.LStar_pos
    exact_mod_cast this.ne'
  rw [div_eq_div_iff hpos (by norm_num)]
  have h' : L.sumSq * 12 = L.l * (L.l + 1) * L.LStar := by rw [mul_comm, h]; ring
  exact_mod_cast h'

/-- The number of labels of the Θ-pilot: `l*`. -/
theorem card_thetaPilot_labels : L.FlStar.card = L.LStar := L.card_FlStar

end LPrime

end IUT
