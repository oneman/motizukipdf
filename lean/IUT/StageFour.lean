import IUT.StageThree
import Mathlib.Data.ZMod.QuotientGroup
import Mathlib.NumberTheory.Padics.PadicVal.Basic
import Mathlib.Data.Nat.Factorization.Defs
import Mathlib.Data.Nat.Prime.Infinite
import Mathlib.Data.Nat.Sqrt
import Mathlib.GroupTheory.Index
import Mathlib.GroupTheory.Subgroup.Centralizer
import Mathlib.Data.PNat.Basic
import Mathlib.Data.Rat.Floor
import Mathlib.Data.NNRat.Defs

/-!
# Stage 4 of the LeanForm of IUT: the earlier results (1995–2015)

[FormIUT] §2: *Stage 4: Earlier results (1995 - 2015): [pGC], [GeoAn],
[AbsAnb], [NCBel], [AbSc], [SemiAn], [QuCnf], [CbGC], [Config], [FrdI-II],
[EtTh], [GenEll], [NodNon], [AbsTopI-III]* — the results that Stage 3
(`IUT.StageThree`) listed as the inputs of [IUTchI-II].  [FormIUT] remarks
that their content "is understood by a much larger class of mathematicians
and has never been a source of confusion/debate", hence is "amenable to
LeanForm by research groups not so closely connected to my research group".

This file is the skeletal Lean form of that stage: for each of the
twenty-two earlier results of `StageThree.earlierResults`, either a **proof**
in Lean/Mathlib of the part of the result that [IUTchI-II] actually use (where
that part is elementary enough for Mathlib today), or a **statement** of it as
a structure of hypotheses (where it is not), together with the bookkeeping of
which is which (`status`, `proved_count`, `every_result_has_status`).

Proved here, from Mathlib:

* **[GenEll]** (`exists_prime_avoiding`, `exists_LPrime_avoiding`): for any
  finite set of nonzero integers and any bound there is a prime `l ≥ 5` above
  the bound dividing none of them — the existence of the `l` of [IUTchI] Def
  3.1 (c) (`l ∤ p_v` for `v ∈ V^bad_mod`), the input of `GenerateInitialData`;
* **[AbsTopIII] Rem 2.3.3 (vi) / [IUTchI] Ex 5.1 (v)** (`pos_rat_unit_eq_one`):
  `ℚ_{>0} ∩ Ẑ× = {1}` — a positive rational with `p`-adic valuation `0` at
  every prime is `1`; this is why the number-field cyclotomic rigidity
  (`StageThree.CyclotomicRigidity.numberField`) has no indeterminacy;
* **[EtTh] §1** (`ThetaFunction`, `ThetaFunction.values`): from the
  functional equation `θ(q·u) = q^{−1/2} u^{−1} θ(u)` of the theta function
  on the Tate curve, `θ(q^j u) = q^{−j²/2} u^{−j} θ(u)` — the `j²` of the
  Galois evaluation `Θ ↦ q̲^{j²}`, the hypothesis of
  `StageThree.ThetaEvaluation`;
* **[FrdI] §1** (`FrobElem`): the elementary Frobenioid of a monoid `Φ`: the
  monoid `ℕ_{≥1} ⋉ Φ` of pairs (Frobenius degree, zero divisor), with its
  Frobenius degree homomorphism, its linear and pure-Frobenius submonoids, and
  `frobenius_scales`: the Frobenius morphism of degree `N` multiplies divisors
  (heights) by `N` — the "`N`-th power map" of [FormIUT] §3; **[FrdII]**
  (`FrobElem.map`, `realify`): realification `Φ ↦ Φ ⊗ ℚ_{≥0}` is a monoid
  homomorphism of Frobenioids; and the toy of [FormIUT] §3 itself
  (`powMap_injOn`): in a field with no nontrivial `N`-th roots of unity the
  `N`-th power map is injective on nonzero elements;
* **[AbSc] §1** (`section_decomposition`): a section `s` of `π : Π ↠ G`
  decomposes `Π` uniquely as `ker π · s(G)` — the decomposition-group
  structure of the evaluation sections `G_v → Π_v` of `EvaluateAtPoints`;
* **[GeoAn] §1** (`Slim`, `center_eq_bot_of_slim`, `conj_injective_of_slim`):
  a slim group (trivial centralizers of finite-index subgroups) has trivial
  center and embeds in its automorphism group — the reason the anabelioid
  `B(G)` determines `G` up to inner automorphisms;
* **[SemiAn] §3** (`loop_indices`): the covering tower of the loop graph of
  the Tate curve, `2lℤ ⊆ lℤ ⊆ ℤ`, has the indices `2`, `l`, `2l` of
  `StageThree.temperedIndices` ([IUTchII] Cor 2.4 (i));
* **[AbsTopI] Lemma 4.5 / [IUTchI] Cor 1.2** (`l_of_index`): `l` is recovered
  from the index `l²` of `Π_X̲ ⊆ Π_X→` as its square root.

Stated only (structures of hypotheses, no proof): the anabelian
reconstruction theorems of [pGC], [AbsAnb], [AbsTopII], [AbsTopIII] Thm 1.9,
the combinatorial results of [CbGC], [NodNon], [Config], Belyi maps [NCBel],
the archimedean theory [QuCnf], [AbsTopIII] §2, the Kummer theory and
log-shells of [AbsTopIII] §3, §5, the mono-theta environments of [EtTh] §2
and the tempered Frobenioids of [EtTh] §3–§5.
-/

namespace IUT

namespace StageFour

open scoped NNRat

/-! ## [GenEll]: existence of the prime `l` -/

/-- **[GenEll] Thm 3.8 / Cor 4.4, as used by [IUTchI] Def 3.1 (c)**: for a
finite set `S` of nonzero naturals (the `p_v`, `v ∈ V^bad_mod`, and whatever
else `l` must avoid) and a bound `B`, there is a prime `l ≥ B` dividing no
element of `S`. -/
theorem exists_prime_avoiding (S : Finset ℕ) (hS : 0 ∉ S) (B : ℕ) :
    ∃ l : ℕ, l.Prime ∧ B ≤ l ∧ ∀ s ∈ S, ¬ l ∣ s := by
  obtain ⟨l, hl, hp⟩ := Nat.exists_infinite_primes (max B (S.sup id) + 1)
  refine ⟨l, hp, by omega, fun s hs hdvd => ?_⟩
  have hs0 : 0 < s := Nat.pos_of_ne_zero (fun h => hS (h ▸ hs))
  have := Nat.le_of_dvd hs0 hdvd
  have := Finset.le_sup (f := id) hs
  simp only [id] at this
  omega

/-- The `l` of the library: an `LPrime` (`l ≥ 5` prime) avoiding `S`. -/
theorem exists_LPrime_avoiding (S : Finset ℕ) (hS : 0 ∉ S) (B : ℕ) :
    ∃ L : LPrime, B ≤ L.l ∧ ∀ s ∈ S, ¬ L.l ∣ s := by
  obtain ⟨l, hp, hl, h⟩ := exists_prime_avoiding S hS (max B 5)
  exact ⟨⟨l, hp, by omega⟩, by simp only; omega, h⟩

/-- Def 3.1 (c) for the bad primes of initial Θ-data: a prime `l ≥ 5` dividing
no `p_v`, `v ∈ V^bad_mod` (`InitialThetaData.l_coprime_of_mem_VBadMod` is the
condition; this is its satisfiability). -/
theorem exists_l_coprime (d : InitialThetaData) (hp : ∀ v ∈ d.VBadMod, 0 < v.p) :
    ∃ L : LPrime, ∀ v ∈ d.VBadMod, ¬ L.l ∣ v.p := by
  obtain ⟨L, _, h⟩ := exists_LPrime_avoiding (d.VBadMod.map (·.p)).toFinset
    (by simp only [List.mem_toFinset, List.mem_map, not_exists, not_and]
        intro v hv h0; have := hp v hv; omega) 0
  exact ⟨L, fun v hv => h v.p (by simp only [List.mem_toFinset, List.mem_map]; exact ⟨v, hv, rfl⟩)⟩

/-! ## [AbsTopIII] Rem 2.3.3 (vi), [IUTchI] Ex 5.1 (v): `ℚ_{>0} ∩ Ẑ× = {1}` -/

/-- **`ℚ_{>0} ∩ Ẑ× = {1}`**: a positive rational that is a `p`-adic unit at
every prime is `1`.  This is the arithmetic fact behind the cyclotomic
rigidity isomorphism of the number field ([IUTchI] Ex 5.1 (v); [IUTchII] Cor
4.8; [IUTchIII] Rem 2.3.3 (vi)), which is why that rigidity carries no
indeterminacy (`StageThree.CyclotomicRigidity.get .numberField`). -/
theorem pos_rat_unit_eq_one (q : ℚ) (hq : 0 < q) (h : ∀ p : ℕ, p.Prime → padicValRat p q = 0) :
    q = 1 := by
  have hnum : 0 < q.num := Rat.num_pos.mpr hq
  have hnat : (q.num.natAbs : ℤ) = q.num := Int.natAbs_of_nonneg hnum.le
  have hden : q.den ≠ 0 := q.den_ne_zero
  have hnum0 : q.num.natAbs ≠ 0 := Int.natAbs_ne_zero.mpr hnum.ne'
  have heq : q.num.natAbs = q.den := by
    apply Nat.eq_of_factorization_eq hnum0 hden
    intro p
    by_cases hp : p.Prime
    · rw [Nat.factorization_def _ hp, Nat.factorization_def _ hp]
      have := h p hp
      rw [padicValRat_def, padicValInt] at this
      omega
    · simp [Nat.factorization_eq_zero_of_not_prime _ hp]
  have : (q.num : ℚ) = q.den := by
    rw [← hnat, heq]
    simp
  rw [← Rat.num_div_den q, this, div_self (by exact_mod_cast hden)]

/-- The rigidity, restated on the multiplicative group `ℚ_{>0}`: the only
element killed by every `p`-adic valuation is `1`. -/
theorem numberField_rigidity :
    ∀ q : ℚ, 0 < q → (∀ p : ℕ, p.Prime → padicValRat p q = 0) → q = 1 :=
  pos_rat_unit_eq_one

/-! ## [EtTh] §1: the theta function and its values `q^{j²}` -/

/-- **The theta function on the Tate curve**, modulo [EtTh] §1: a function on
the multiplicative uniformization `𝔾_m` with parameter `q = s²`, satisfying
the functional equation `θ(q·u) = q^{−1/2} u^{−1} θ(u)` (the classical
`θ(u) = Σ_n q^{n²/2} u^n`; [EtTh] Prop 1.4). -/
structure ThetaFunction (K : Type*) [Field K] where
  θ : K → K
  /-- a square root of the Tate parameter `q` -/
  s : K
  s_ne : s ≠ 0
  /-- `θ(s² u) = s⁻¹ u⁻¹ θ(u)` -/
  functional_eq : ∀ u : K, u ≠ 0 → θ (s ^ 2 * u) = s⁻¹ * u⁻¹ * θ u

namespace ThetaFunction

variable {K : Type*} [Field K]

/-- **The values at the torsion points carry `q^{j²}`**: iterating the
functional equation, `θ(q^j u) = q^{−j²/2} u^{−j} θ(u)`, i.e.
`s^{j²} u^j θ(s^{2j} u) = θ(u)`.  The exponent `j²` is the one of the Galois
evaluation `Θ ↦ q̲^{j²}` ([IUTchII] Cor 2.5, 2.8), the hypothesis `value_eq`
of `StageThree.ThetaEvaluation`. -/
theorem values (T : ThetaFunction K) (u : K) (hu : u ≠ 0) (j : ℕ) :
    T.s ^ (j ^ 2) * u ^ j * T.θ (T.s ^ (2 * j) * u) = T.θ u := by
  induction j with
  | zero => simp
  | succ j ih =>
    have hsu : T.s ^ (2 * j) * u ≠ 0 := mul_ne_zero (pow_ne_zero _ T.s_ne) hu
    have h2 : T.s ^ (2 * (j + 1)) * u = T.s ^ 2 * (T.s ^ (2 * j) * u) := by ring
    rw [h2, T.functional_eq _ hsu, ← ih]
    have hs := T.s_ne
    field_simp
    ring

/-- The value at the point labelled `j` is `q̲^{j²}` times the unit-like factor
`u^{−j} θ(u)`: the exponent of `s` is `j²`, in particular it depends only on
`|j|` once `u ↦ u⁻¹` is taken into account, and it is `1` at `j = 1`. -/
theorem value_exponent (T : ThetaFunction K) (u : K) (hu : u ≠ 0) (j : ℕ) :
    T.θ (T.s ^ (2 * j) * u) = (T.s ^ (j ^ 2))⁻¹ * (u ^ j)⁻¹ * T.θ u := by
  have h := T.values u hu j
  have hs : T.s ^ (j ^ 2) ≠ 0 := pow_ne_zero _ T.s_ne
  have hu' : u ^ j ≠ 0 := pow_ne_zero _ hu
  rw [← h]
  field_simp

/-- The exponents at the labels `1, …, l*` are the exponents of the Θ-pilot
(`StageThree.gauExponents`). -/
theorem exponents_eq_gauExponents (d : InitialThetaData) :
    (List.range d.LStar).map (fun j => (j + 1) ^ 2) = StageThree.gauExponents d := rfl

end ThetaFunction

/-! ## [FrdI] §1: the elementary Frobenioid of a monoid; [FrdII]: realification -/

/-- **The elementary Frobenioid** `F_Φ` of a (commutative, additive) monoid
`Φ` of divisors over the one-object base category ([FrdI] Def 1.1, Ex 1.2):
its morphisms are the pairs `(n, a)` of a *Frobenius degree* `n ∈ ℕ_{≥1}` and
a *zero divisor* `a ∈ Φ`, composed by `(n, a) ∘ (n', a') = (n n', a + n·a')`:
the Frobenius of degree `n` multiplies the divisors it passes over by `n`. -/
@[ext]
structure FrobElem (Φ : Type*) [AddCommMonoid Φ] where
  deg : ℕ+
  div : Φ

namespace FrobElem

variable {Φ : Type*} [AddCommMonoid Φ]

instance : Mul (FrobElem Φ) := ⟨fun x y => ⟨x.deg * y.deg, x.div + (x.deg : ℕ) • y.div⟩⟩

instance : One (FrobElem Φ) := ⟨⟨1, 0⟩⟩

@[simp] theorem mul_deg (x y : FrobElem Φ) : (x * y).deg = x.deg * y.deg := rfl

@[simp] theorem mul_div (x y : FrobElem Φ) : (x * y).div = x.div + (x.deg : ℕ) • y.div := rfl

@[simp] theorem one_deg : (1 : FrobElem Φ).deg = 1 := rfl

@[simp] theorem one_div : (1 : FrobElem Φ).div = 0 := rfl

/-- `F_Φ` is a monoid ([FrdI] Def 1.1: a category with one object). -/
instance : Monoid (FrobElem Φ) where
  mul_assoc x y z := by
    ext
    · simp [mul_assoc]
    · simp [PNat.mul_coe, mul_smul, smul_add, add_assoc]
  one_mul x := by ext <;> simp
  mul_one x := by ext <;> simp

/-- The Frobenius degree is a homomorphism to `ℕ_{≥1}` ([FrdI] Def 1.1 (iii)). -/
def degHom : FrobElem Φ →* ℕ+ where
  toFun := deg
  map_one' := rfl
  map_mul' _ _ := rfl

/-- The *linear* morphisms (Frobenius degree `1`) form a submonoid, a copy of `Φ`. -/
def linear : Submonoid (FrobElem Φ) where
  carrier := { x | x.deg = 1 }
  mul_mem' {x y} hx hy := by simp_all
  one_mem' := rfl

/-- The *pure Frobenius* morphisms (zero divisor `0`) form a submonoid, a copy of `ℕ_{≥1}`. -/
def pureFrobenius : Submonoid (FrobElem Φ) where
  carrier := { x | x.div = 0 }
  mul_mem' {x y} hx hy := by simp_all
  one_mem' := rfl

/-- The Frobenius morphism of degree `N`. -/
def frobenius (N : ℕ+) : FrobElem Φ := ⟨N, 0⟩

/-- The linear morphism of divisor `a`. -/
def ofDiv (a : Φ) : FrobElem Φ := ⟨1, a⟩

/-- **The Frobenius of degree `N` multiplies divisors by `N`** ([FrdI] §1;
[FormIUT] §3): `Frob_N ∘ (1, a) = (N, N·a)` — passing a divisor (a height)
through the `N`-th power map multiplies it by `N`.  This is the "`N`-th
power map" whose compatibility with the multiplicative, but not the additive,
structure is the starting point of [FormIUT] §3, and the dilation
`Link.thetaDilation` of the Θ-link is its `N = l(l+1)/12`. -/
theorem frobenius_scales (N : ℕ+) (a : Φ) :
    frobenius N * ofDiv a = ⟨N, (N : ℕ) • a⟩ := by
  ext <;> simp [frobenius, ofDiv]

/-- Linear morphisms compose by adding divisors: `Φ` embeds additively. -/
theorem ofDiv_mul (a b : Φ) : ofDiv a * ofDiv b = ofDiv (a + b) := by
  ext <;> simp [ofDiv]

/-- Every morphism factors uniquely as a Frobenius followed by a linear morphism. -/
theorem factor (x : FrobElem Φ) : x = ofDiv x.div * frobenius x.deg := by
  ext <;> simp [ofDiv, frobenius]

/-- The isomorphisms of `F_Φ` (for a cancellative `Φ` with no units other than
`0`, e.g. `ℕ`): degree `1` and divisor `0`, i.e. only the identity ([FrdI]
Prop 1.4 for the elementary Frobenioid over the trivial base). -/
theorem eq_one_of_mul_eq_one (x y : FrobElem ℕ) (h : x * y = 1) : x = 1 := by
  have hd : x.deg * y.deg = 1 := by have := congrArg deg h; simpa using this
  have hv : x.div + (x.deg : ℕ) • y.div = 0 := by have := congrArg div h; simpa using this
  have hd' : (x.deg : ℕ) * (y.deg : ℕ) = 1 := by
    have := congrArg PNat.val hd; simpa using this
  have hx : x.deg = 1 := PNat.eq (Nat.eq_one_of_mul_eq_one_right hd')
  ext
  · exact hx
  · simp only [one_div]; omega

/-- [FrdII] §1: a homomorphism of divisor monoids induces a homomorphism of
elementary Frobenioids (a *functor* of Frobenioids over the trivial base). -/
def map {Ψ : Type*} [AddCommMonoid Ψ] (φ : Φ →+ Ψ) : FrobElem Φ →* FrobElem Ψ where
  toFun x := ⟨x.deg, φ x.div⟩
  map_one' := by ext <;> simp
  map_mul' x y := by ext <;> simp [map_nsmul]

/-- **Realification** ([FrdII] §5; [IUTchI] Ex 3.5): `Φ = ℕ ↦ Φ^rlf = ℚ_{≥0}`
(standing in for `ℝ_{≥0}`), the Frobenioid of divisors with non-negative
rational coefficients, as a homomorphism of elementary Frobenioids. -/
def realify : FrobElem ℕ →* FrobElem ℚ≥0 := map (Nat.castAddMonoidHom ℚ≥0)

theorem realify_frobenius (N : ℕ+) : realify (frobenius N) = frobenius N := by
  ext <;> simp [realify, map, frobenius]

theorem realify_div (x : FrobElem ℕ) : (realify x).div = (x.div : ℚ≥0) := rfl

end FrobElem

/-- **The toy of [FormIUT] §3**: in a field with no nontrivial `N`-th roots
of unity, the `N`-th power map is injective on the nonzero elements — it is
an isomorphism of multiplicative monoids `R^▷ ≅ (R^▷)^N` (and a monoid
homomorphism, `powMonoidHom`), which "does not arise from a ring
homomorphism". -/
theorem powMap_injOn {K : Type*} [Field K] (N : ℕ)
    (hroots : ∀ z : K, z ^ N = 1 → z = 1) :
    Set.InjOn (fun x : K => x ^ N) {x | x ≠ 0} := by
  intro x hx y hy hxy
  simp only [Set.mem_ofPred_eq] at hx hy hxy
  have hy' : y ^ N ≠ 0 := pow_ne_zero _ hy
  have : (x / y) ^ N = 1 := by rw [div_pow, hxy, div_self hy']
  have := hroots _ this
  rwa [div_eq_one_iff_eq hy] at this

/-! ## [AbSc] §1: Galois sections and decomposition groups -/

/-- **A section of `π : Π ↠ G` splits `Π`** ([AbSc] §1; [IUTchI] Ex 4.4: the
evaluation sections `G_v → Π_v` and the decomposition groups of the
evaluation points): every `x ∈ Π` is uniquely `δ · s(π(x))` with `δ ∈ ker π`.
This is the structure that lets Galois evaluation restrict the theta function
to the decomposition group `D_{t,μ−}` of a point. -/
theorem section_decomposition {P G : Type*} [Group P] [Group G] (π : P →* G) (s : G →* P)
    (hs : ∀ g, π (s g) = g) (x : P) :
    ∃! δ : P, δ ∈ π.ker ∧ x = δ * s (π x) := by
  refine ⟨x * (s (π x))⁻¹, ⟨?_, by simp⟩, ?_⟩
  · rw [MonoidHom.mem_ker, map_mul, map_inv, hs, mul_inv_cancel]
  · rintro δ ⟨_, hδ⟩
    rw [eq_mul_inv_iff_mul_eq]
    exact hδ.symm

/-- The sections `G → Π` with `π ∘ s = id` are exactly the splittings; their
images are the "decomposition groups" `D ⊆ Π` mapping isomorphically to `G`. -/
theorem section_range_isom {P G : Type*} [Group P] [Group G] (π : P →* G) (s : G →* P)
    (hs : ∀ g, π (s g) = g) :
    Function.Injective s ∧ Function.Surjective (π.comp s.range.subtype) := by
  refine ⟨fun a b hab => by rw [← hs a, ← hs b, hab],
    fun g => ⟨⟨s g, MonoidHom.mem_range.mpr ⟨g, rfl⟩⟩, by simpa using hs g⟩⟩

/-! ## [GeoAn] §1: anabelioids and slim groups -/

/-- **Slim** ([GeoAn] Def 1.?, [AbsTopI] §0): every finite-index subgroup
(open subgroup of a profinite group) has trivial centralizer. -/
def Slim (G : Type*) [Group G] : Prop :=
  ∀ H : Subgroup G, H.FiniteIndex → Subgroup.centralizer (H : Set G) = ⊥

/-- A slim group has trivial center. -/
theorem center_eq_bot_of_slim {G : Type*} [Group G] (h : Slim G) : Subgroup.center G = ⊥ := by
  have := h ⊤ inferInstance
  rwa [Subgroup.coe_top, Subgroup.centralizer_univ] at this

/-- **A slim group embeds in its automorphism group** by conjugation: the
anabelioid `B(G)` (finite `G`-sets) determines `G` up to inner automorphisms,
and for slim `G` the inner automorphisms are a faithful copy of `G` — the
reason the étale fundamental groups of IUT are taken slim ([GeoAn] §1;
[IUTchI] Rem 3.1.2). -/
theorem conj_injective_of_slim {G : Type*} [Group G] (h : Slim G) :
    Function.Injective (MulAut.conj : G →* MulAut G) := by
  rw [injective_iff_map_eq_one]
  intro g hg
  have hc : g ∈ Subgroup.center G := by
    rw [Subgroup.mem_center_iff]
    intro x
    have := congrArg (fun φ : MulAut G => φ x) hg
    simp only [MulAut.conj_apply, MulAut.one_apply] at this
    calc x * g = g * x * g⁻¹ * g := by rw [this]
      _ = g * x := by rw [mul_assoc, inv_mul_cancel, mul_one]
  rwa [center_eq_bot_of_slim h, Subgroup.mem_bot] at hc

/-! ## [SemiAn] §3: the tempered covering tower of the loop graph -/

/-- **The covering tower `Ÿ → X̲ → X̲±` on the dual graph** ([SemiAn] §3;
[IUTchI] §2; [IUTchII] Cor 2.4 (i)): the tempered fundamental group of the
loop graph of the Tate curve is `ℤ`; the coverings of degrees `2l`, `l`
correspond to `2lℤ ⊆ lℤ ⊆ ℤ`, and the indices are those of
`StageThree.temperedIndices`: `[ℤ : lℤ] = l`, `[ℤ : 2lℤ] = 2l`,
`[lℤ : 2lℤ] = 2`. -/
theorem loop_indices (L : LPrime) :
    (AddSubgroup.zmultiples (L.l : ℤ)).index = (StageThree.temperedIndices L).PiPmToPi ∧
    (AddSubgroup.zmultiples ((2 * L.l : ℕ) : ℤ)).index =
      (StageThree.temperedIndices L).PiPmToPiYdd ∧
    (AddSubgroup.zmultiples ((2 * L.l : ℕ) : ℤ)).relIndex (AddSubgroup.zmultiples (L.l : ℤ)) =
      (StageThree.temperedIndices L).PiToPiYdd := by
  have h1 : (AddSubgroup.zmultiples (L.l : ℤ)).index = L.l := by
    rw [Int.index_zmultiples]; simp
  have h2 : (AddSubgroup.zmultiples ((2 * L.l : ℕ) : ℤ)).index = 2 * L.l := by
    rw [Int.index_zmultiples, Int.natAbs_natCast]
  refine ⟨h1, h2, ?_⟩
  have hle : AddSubgroup.zmultiples ((2 * L.l : ℕ) : ℤ) ≤ AddSubgroup.zmultiples (L.l : ℤ) := by
    rw [AddSubgroup.zmultiples_le, Int.mem_zmultiples_iff]
    exact ⟨2, by push_cast; ring⟩
  have := AddSubgroup.relIndex_mul_index hle
  rw [h1, h2] at this
  have hl : 0 < L.l := L.prime.pos
  simp only [StageThree.temperedIndices]
  nlinarith [this]

/-! ## [AbsTopI] Lemma 4.5 / [IUTchI] Cor 1.2: `l` from the indices -/

/-- **`l` is recovered from `Π_X→`** ([IUTchI] Cor 1.2 via [AbsTopI] Lemma 4.5):
the index of `Π_X̲ ⊆ Π_X→` is `l²` (`CorOneTwo.lSquared_eq`), so `l` is its
square root — the datum `l` of the initial Θ-data is group-theoretic. -/
theorem l_of_index (L : LPrime) :
    Nat.sqrt ((CorOneTwo.run L).idxXXUnder * (CorOneTwo.run L).idxXUnderXArrow) = L.l := by
  rw [CorOneTwo.lSquared_eq, Nat.sqrt_eq']

/-! ## The results stated but not proved -/

/-- **The anabelian reconstruction theorems** ([pGC] Thm A, [AbsAnb], [AbsTopII],
[AbsTopIII] Thm 1.9), as hypotheses: a category of curves, a functor to
(outer) Galois representations, and its full faithfulness / the existence of
a reconstruction algorithm.  Nothing here is proved. -/
structure AnabelianReconstruction where
  /-- the (hyperbolic) curves -/
  Curve : Type
  /-- the fundamental groups with their Galois actions -/
  Rep : Type
  /-- `X ↦ Π_X ↠ G_k` -/
  π₁ : Curve → Rep
  /-- isomorphisms of curves -/
  isoC : Curve → Curve → Prop
  /-- isomorphisms of representations (outer, compatible with `G_k`) -/
  isoR : Rep → Rep → Prop
  /-- [pGC] Thm A, [AbsAnb]: full faithfulness — the curve is determined by `Π` -/
  fully_faithful : ∀ X Y, isoR (π₁ X) (π₁ Y) → isoC X Y
  /-- [AbsTopIII] Thm 1.9: a *mono-anabelian* reconstruction: an algorithm from `Π` alone -/
  reconstruct : Rep → Option Curve
  reconstruct_spec : ∀ X, ∃ Y, reconstruct (π₁ X) = some Y ∧ isoC X Y

/-- **The combinatorial anabelian results** ([CbGC] Thm A, [NodNon] Thm A–B,
[Config] Thm A): verticial and cuspidal subgroups, and fibre subgroups of
configuration spaces, are group-theoretic. -/
structure CombinatorialAnabelian where
  Group' : Type
  /-- the subgroups of the fundamental group of the semi-graph -/
  Sub : Type
  /-- verticial / cuspidal / fibre subgroups -/
  verticial : Sub → Prop
  cuspidal : Sub → Prop
  /-- the automorphisms considered (nodally nondegenerate outer representations) -/
  aut : (Sub → Sub) → Prop
  /-- [CbGC] Thm A: automorphisms preserve verticial and cuspidal subgroups -/
  preserves_verticial : ∀ φ, aut φ → ∀ H, verticial H → verticial (φ H)
  preserves_cuspidal : ∀ φ, aut φ → ∀ H, cuspidal H → cuspidal (φ H)

/-- **The archimedean and Kummer-theoretic inputs** ([QuCnf], [AbsTopIII] §2–§5,
[EtTh] §2–§5, [NCBel]): the Aut-holomorphic structures, the `p`-adic
logarithm with its log-shells `I_v = (p*)⁻¹ log(O×)`, the mono-theta
environments with their cyclotomic rigidity, the tempered Frobenioids, and
noncritical Belyi maps, as hypotheses. -/
structure LocalInputs where
  /-- [AbsTopIII] Def 5.4: the log-shell at `v` has radius `logShellRadius v` -/
  logShell_radius : ∀ v : Valuation, 0 ≤ ThetaPmEllNFHodgeTheater.logShellRadius v
  /-- [EtTh] §2 (via [IUTchII] Cor 1.10): the mono-theta cyclotomic rigidity has no indeterminacy -/
  monoTheta_rigid : (StageThree.CyclotomicRigidity.get .monoTheta).indeterminacy = "none"
  /-- [AbsTopIII] Prop 3.2 (via [IUTchII] Cor 1.11): the MLF rigidity is only up to `Ẑ×` -/
  mlf_up_to_units : (StageThree.CyclotomicRigidity.get .mlfGaloisPair).usesRingStructure = true
  /-- [EtTh] §3–§5: the theta monoid is generated by the theta function itself -/
  theta_monoid : ∀ (L : LPrime) (v : ℕ) (e : Bool),
    (StageThree.LocalMonoid.build L .theta v e).thetaGenerator = true

/-- The hypotheses of `LocalInputs` that the library already settles are
satisfied (the archimedean and `p`-adic analysis behind them is not). -/
theorem localInputs_of_library (hr : ∀ v : Valuation, 0 ≤ ThetaPmEllNFHodgeTheater.logShellRadius v) :
    Nonempty LocalInputs :=
  ⟨⟨hr, rfl, rfl, fun _ _ _ => rfl⟩⟩

/-! ## Bookkeeping: which earlier results are proved here -/

/-- The status of an earlier result in this stage. -/
inductive Status where
  /-- the part used by [IUTchI-II] is a theorem of this file -/
  | proved
  /-- stated as a structure of hypotheses, not proved -/
  | stated
  deriving DecidableEq, Repr

/-- One row of the Stage 4 table: the earlier result, its status, and the
declarations of this file that carry it. -/
structure Row where
  id : String
  status : Status
  leanNames : List String
  deriving DecidableEq, Repr

/-- The table. -/
def rows : List Row := [
  ⟨"pGC.ThmA", .stated, ["AnabelianReconstruction"]⟩,
  ⟨"GeoAn.anabelioids", .proved, ["Slim", "center_eq_bot_of_slim", "conj_injective_of_slim"]⟩,
  ⟨"AbsAnb.ThmA", .stated, ["AnabelianReconstruction"]⟩,
  ⟨"NCBel.ThmA", .stated, ["LocalInputs"]⟩,
  ⟨"AbSc.sections", .proved, ["section_decomposition", "section_range_isom"]⟩,
  ⟨"SemiAn.tempered", .proved, ["loop_indices"]⟩,
  ⟨"QuCnf.arch", .stated, ["LocalInputs"]⟩,
  ⟨"CbGC.ThmA", .stated, ["CombinatorialAnabelian"]⟩,
  ⟨"Config.ThmA", .stated, ["CombinatorialAnabelian"]⟩,
  ⟨"FrdI.general", .proved, ["FrobElem", "FrobElem.degHom", "FrobElem.frobenius_scales", "powMap_injOn"]⟩,
  ⟨"FrdII.poly", .proved, ["FrobElem.map", "FrobElem.realify"]⟩,
  ⟨"EtTh.thetaFunction", .proved, ["ThetaFunction", "ThetaFunction.values", "ThetaFunction.value_exponent"]⟩,
  ⟨"EtTh.monoTheta", .stated, ["LocalInputs"]⟩,
  ⟨"EtTh.frobenioidTheta", .stated, ["LocalInputs"]⟩,
  ⟨"GenEll.ThmA", .proved, ["exists_prime_avoiding", "exists_LPrime_avoiding", "exists_l_coprime"]⟩,
  ⟨"NodNon.main", .stated, ["CombinatorialAnabelian"]⟩,
  ⟨"AbsTopI.cusps", .proved, ["l_of_index"]⟩,
  ⟨"AbsTopII.decomposition", .stated, ["AnabelianReconstruction"]⟩,
  ⟨"AbsTopIII.monoAnabelian", .stated, ["AnabelianReconstruction"]⟩,
  ⟨"AbsTopIII.logShells", .stated, ["LocalInputs"]⟩,
  ⟨"AbsTopIII.cyclotomicRigidity", .proved, ["pos_rat_unit_eq_one", "numberField_rigidity"]⟩,
  ⟨"AbsTopIII.archimedean", .stated, ["LocalInputs"]⟩
]

theorem rows_length : rows.length = 22 := rfl

/-- The table covers exactly the earlier results of Stage 3, in the same order. -/
theorem rows_cover_earlierResults :
    rows.map (·.id) = StageThree.earlierResults.map (·.id) := by decide

/-- Every earlier result has a status. -/
theorem every_result_has_status :
    StageThree.earlierResults.all (fun r => rows.any (·.id = r.id)) = true := by decide

/-- Nine of the twenty-two are proved (in the part [IUTchI-II] use), thirteen
are stated. -/
theorem proved_count :
    (rows.filter (·.status = .proved)).length = 9 ∧ (rows.filter (·.status = .stated)).length = 13 := by
  decide

/-- The proved results by paper: [GeoAn], [AbSc], [SemiAn], [FrdI], [FrdII],
[EtTh], [GenEll], [AbsTopI], [AbsTopIII]. -/
theorem proved_papers :
    ((rows.filter (·.status = .proved)).filterMap fun r =>
      (StageThree.earlierResults.find? (·.id = r.id)).map (·.paper.text)) =
      ["GeoAn", "AbSc", "SemiAn", "FrdI", "FrdII", "EtTh", "GenEll", "AbsTopI", "AbsTopIII"] := by
  decide

/-- The stated ones are the anabelian reconstruction and combinatorial
theorems, the archimedean and `p`-adic analysis, and the Belyi maps: the
topics [FormIUT] §2 lists as "anabelian geometry" — none of them in Mathlib. -/
theorem stated_topics :
    (rows.filter (·.status = .stated)).all (fun r =>
      (StageThree.earlierResults.find? (·.id = r.id)).any fun e =>
        e.paper.topic == .anabelian || e.paper == .EtTh) = true := by
  decide

/-- **Stage 4 feeds Stage 3 feeds Stage 2**: the earlier results used by the
Stage 3 steps that are the Stage 2 inputs each have a row here, and the three
chains compose: Stage 2's inputs are Stage 3's steps resting on Stage 4's
results. -/
theorem stage_four_then_three_then_two :
    StageThree.earlierResults.all (fun r => rows.any (·.id = r.id)) = true ∧
    StageTwo.inputs.all (fun i => StageThree.steps.any (·.id = i.id)) = true ∧
    StageTwo.inputs.all (fun i => !(StageThree.earlierClosure i.id).isEmpty) = true :=
  ⟨every_result_has_status, StageThree.feeds_stage_two, StageThree.inputs_rest_on_earlier⟩

end StageFour

end IUT
