import IUT.Labels
import Mathlib.Tactic.NormNum.Prime
import Mathlib.Data.List.Nodup

/-!
# Initial Θ-data `(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)` — [IUTchI] Def 3.1

The species `InitialThetaData` of [IUTchI] Def 3.1 (recalled in [Alien] §3.3 (i)
and [IUTchIV] §3).  As in `src/iut.h`, the number fields `F_mod ⊆ F ⊆ K = F(E[l])`
are recorded through their degrees (`dF`, `dK` are *upper bounds*, [IUTchIV]
(E3)–(E5)), the curve `E_F` through its arithmetic invariants at the places
`v ∈ V ≅ V_mod`, and the five hypotheses of Def 3.1 that cannot be decided from
numeric data (Galois, 6-torsion, `SL₂`, stable reduction, `K`-core) are
*asserted* flags.

`InitialThetaData.WellFormed` is the Lean version of the C validator
`iut_validate_data`: exactly the conditions that the validator reports as
errors.  The examples of the C program (`iut_gen_example`) are reproduced and
proved well-formed, which gives the inhabitation of the species
(`exists_wellFormed`).  Logarithms are never computed: a "normalized degree"
such as `log(q)` is the formal sum `Σ c_p · log p` (`qDivisor`) and only
becomes a number when a logarithm `log : ℕ → K` into an ordered field is
supplied (`logQ`).
-/

namespace IUT

/-- `V^non` / `V^arc`: nonarchimedean or archimedean valuation. -/
inductive VKind where
  | nonarch
  | arch
  deriving DecidableEq, Repr

/-- The reduction type of `E` at a nonarchimedean place. -/
inductive Reduction where
  | good
  | badMult
  | badAdd
  deriving DecidableEq, Repr

/-- A valuation `v ∈ V ⊆ V(K)`, with its image in `V_mod = V(F_mod)`
([IUTchI] Def 3.1; [Alien] §3.3 (i)). Numbers are the local degrees of
`F_mod,v / Q_p` (`eMod`, `fMod`) and `K_v / Q_p` (`eK`, `fK`), the reduction
type of `E` at `v`, and `ord_v(q_v) = −ord_v(j_E)` for bad multiplicative
reduction. -/
structure Valuation where
  name : String
  kind : VKind
  /-- residue characteristic `p_v` (`0` for an archimedean place) -/
  p : ℕ
  eMod : ℕ
  fMod : ℕ
  eK : ℕ
  fK : ℕ
  red : Reduction
  ordq : ℕ
  deriving DecidableEq, Repr

namespace Valuation

/-- `v ∈ V^bad_mod`: an **odd** nonarchimedean place of bad multiplicative
reduction ([IUTchI] Def 3.1 (e)). -/
def inVBadMod (v : Valuation) : Prop :=
  v.kind = .nonarch ∧ v.red = .badMult ∧ v.p % 2 = 1

/-- `v ∈ V^bad`: bad multiplicative reduction (the place `2` may be in
`V^bad` but is never in `V^bad_mod`). -/
def inVBad (v : Valuation) : Prop := v.kind = .nonarch ∧ v.red = .badMult

instance : DecidablePred inVBadMod := fun v => by unfold inVBadMod; infer_instance
instance : DecidablePred inVBad := fun v => by unfold inVBad; infer_instance

theorem inVBad_of_inVBadMod {v : Valuation} (h : v.inVBadMod) : v.inVBad := ⟨h.1, h.2.1⟩

/-- The conditions of [IUTchI] Def 3.1 on a single place that the validator
checks: a nonarchimedean place has a prime residue characteristic, bad
multiplicative reduction has `ord_v(q_v) > 0`, and the local degrees of `K_v`
dominate those of `F_mod,v`. -/
structure WellFormed (v : Valuation) : Prop where
  p_prime : v.kind = .nonarch → v.p.Prime
  ordq_pos : v.red = .badMult → 0 < v.ordq
  eMod_le_eK : v.eMod ≤ v.eK
  fMod_le_fK : v.fMod ≤ v.fK
  eMod_pos : 0 < v.eMod
  fMod_pos : 0 < v.fMod

instance (v : Valuation) : Decidable v.WellFormed :=
  decidable_of_iff
    ((v.kind = .nonarch → v.p.Prime) ∧ (v.red = .badMult → 0 < v.ordq) ∧
      v.eMod ≤ v.eK ∧ v.fMod ≤ v.fK ∧ 0 < v.eMod ∧ 0 < v.fMod)
    ⟨fun ⟨a, b, c, d, e, f⟩ => ⟨a, b, c, d, e, f⟩, fun ⟨a, b, c, d, e, f⟩ => ⟨a, b, c, d, e, f⟩⟩

/-- `p* = p` for `p` odd, `p* = p²` for `p = 2` ([IUTchIII] Def 1.1 (i);
[AbsTopIII] Def 5.4 (iii)); `0` for an archimedean place. -/
def pStar (v : Valuation) : ℕ :=
  if v.kind = .arch then 0 else if v.p = 2 then 4 else v.p

/-- A nonarchimedean place with a prime residue characteristic. -/
def mk' (p : ℕ) (red : Reduction) (ordq : ℕ) : Valuation :=
  ⟨s!"v{p}", .nonarch, p, 1, 1, 1, 1, red, ordq⟩

/-- The archimedean place `v_∞`. -/
def arch : Valuation := ⟨"vinf", .arch, 0, 1, 1, 1, 1, .good, 0⟩

end Valuation

/-- **Initial Θ-data** `(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲)` ([IUTchI] Def 3.1;
[Alien] §3.3 (i)).  Field names are the identifiers of `docs/IDENTIFIERS.md`
(`Fmod`, `VSet`, `EpsilonUnder`, …) where the C struct used symbols. -/
structure InitialThetaData where
  name : String
  /-- `[F_mod : Q]`, `F_mod = Q(j_E)` the field of moduli -/
  dmod : ℕ
  /-- upper bound for `[F : Q]` ([IUTchIV] (E3)–(E5)) -/
  dF : ℕ
  /-- upper bound for `[K : Q]`, `K = F(E[l])` -/
  dK : ℕ
  /-- a description of the curve `E_F` (e.g. the Frey curve of an abc triple) -/
  curve : String
  /-- the prime `l ≥ 5` -/
  l : ℕ
  /-- `V ⊆ V(K)`, in bijection with `V_mod` -/
  V : List Valuation
  /-- `ε̲`: the 2-torsion point / cusp label used to shift the evaluation points
  ([IUTchI] Def 3.1 (vi)); one of two admissible choices -/
  epsilon : Fin 2
  /-- asserted: `F/F_mod` is Galois of degree prime to `l` (Def 3.1 (a)) -/
  hFGaloisOverFmod : Bool
  /-- asserted: `F` contains the fields of definition of `E[2·3]` (Def 3.1 (a)) -/
  hFContainsSixTorsion : Bool
  /-- asserted: `Im(Gal(K/F) → GL₂(F_l)) ⊇ SL₂(F_l)` (Def 3.1 (c)) -/
  hImageContainsSLTwo : Bool
  /-- asserted: `E_F` has stable reduction everywhere (Def 3.1 (b)) -/
  hStableReduction : Bool
  /-- asserted: `C_K` is a `K`-core (Def 3.1 (d)) -/
  hCKIsKCore : Bool
  deriving Repr

namespace InitialThetaData

variable (d : InitialThetaData)

/-- `l* = (l − 1)/2`. -/
def LStar : ℕ := (d.l - 1) / 2

/-- `l± = (l + 1)/2`. -/
def LPm : ℕ := (d.l + 1) / 2

/-- `V^non ⊆ V`. -/
def VNon : List Valuation := d.V.filter (·.kind = .nonarch)

/-- `V^arc ⊆ V`. -/
def VArc : List Valuation := d.V.filter (·.kind = .arch)

/-- `V^bad_mod`: the odd nonarchimedean places of bad multiplicative reduction. -/
def VBadMod : List Valuation := d.V.filter Valuation.inVBadMod

/-- `V^good_mod = V_mod \ V^bad_mod`. -/
def VGoodMod : List Valuation := d.V.filter fun v => ¬ v.inVBadMod

/-- `V^bad`: all places of bad multiplicative reduction (including `2`). -/
def VBad : List Valuation := d.V.filter Valuation.inVBad

/-- `V^good`. -/
def VGood : List Valuation := d.V.filter fun v => ¬ v.inVBad

/-- The formal `q`-divisor `Σ_{v ∈ V^bad} ord_v(q_v) · f_v · [p_v]`, as a list of
pairs `(p, coefficient)`.  `log(q)` is its evaluation under `p ↦ log p`,
divided by `[F_mod : Q]` ([IUTchIV] Thm 1.10, "normalized degree"). -/
def qDivisor : List (ℕ × ℕ) :=
  d.VBad.map fun v => (v.p, v.ordq * v.fMod)

/-- The formal conductor divisor `Σ_{v bad} f_v · [p_v]` (`log(f)`). -/
def conductorDivisor : List (ℕ × ℕ) :=
  (d.V.filter fun v => v.kind = .nonarch ∧ v.red ≠ .good).map fun v => (v.p, v.fMod)

/-- Evaluate a formal divisor with a logarithm `log : ℕ → K`, normalizing by
`[F_mod : Q]`. -/
def normalizedDegree {K : Type*} [Field K] (log : ℕ → K) (terms : List (ℕ × ℕ)) : K :=
  (terms.map fun t => (t.2 : K) * log t.1).sum / (d.dmod : K)

/-- `log(q)`, the normalized degree of the `q`-divisor ([IUTchIV] §1). -/
def logQ {K : Type*} [Field K] (log : ℕ → K) : K := d.normalizedDegree log d.qDivisor

/-- `log(f)`, the normalized log-conductor. -/
def logF {K : Type*} [Field K] (log : ℕ → K) : K := d.normalizedDegree log d.conductorDivisor

/-- `|log(q)| = log(q) / 2l` ([IUTchIV] Thm 1.10). -/
def absLogQ {K : Type*} [Field K] (log : ℕ → K) : K := d.logQ log / (2 * d.l)

/-- `ht_E = (1/6) log(q)` ([IUTchIV] Thm 1.10; [GenEll]). -/
def HtE {K : Type*} [Field K] (log : ℕ → K) : K := d.logQ log / 6

/-- **Well-formed initial Θ-data**: the conditions of [IUTchI] Def 3.1 that the
C validator `iut_validate_data` reports as errors. -/
structure WellFormed : Prop where
  /-- `l` is a prime (Def 3.1 (c)) -/
  l_prime : d.l.Prime
  /-- `l ≥ 5` -/
  l_ge_five : 5 ≤ d.l
  /-- `[F_mod : Q] ≥ 1` -/
  dmod_pos : 0 < d.dmod
  /-- `F_mod ⊆ F`: `[F_mod : Q] ∣ [F : Q]` -/
  dmod_dvd_dF : d.dmod ∣ d.dF
  /-- `F ⊆ K`: `[F : Q] ∣ [K : Q]` -/
  dF_dvd_dK : d.dF ∣ d.dK
  /-- `[F : F_mod]` is prime to `l` (Def 3.1 (a)) -/
  degree_prime_to_l : ¬ d.l ∣ d.dF / d.dmod
  /-- `V → V_mod` is a bijection: no place is listed twice (Def 3.1 (e)) -/
  V_nodup : (d.V.map fun v => (v.kind, v.p)).Nodup
  /-- every place is well-formed -/
  V_wf : ∀ v ∈ d.V, v.WellFormed
  /-- `V^bad_mod ≠ ∅` (Def 3.1 (e)) -/
  VBadMod_nonempty : ∃ v ∈ d.V, v.inVBadMod
  /-- the five asserted hypotheses are asserted -/
  hyps : d.hFGaloisOverFmod = true ∧ d.hFContainsSixTorsion = true ∧
    d.hImageContainsSLTwo = true ∧ d.hStableReduction = true ∧ d.hCKIsKCore = true

instance : Decidable d.WellFormed :=
  decidable_of_iff
    (d.l.Prime ∧ 5 ≤ d.l ∧ 0 < d.dmod ∧ d.dmod ∣ d.dF ∧ d.dF ∣ d.dK ∧ ¬ d.l ∣ d.dF / d.dmod ∧
      (d.V.map fun v => (v.kind, v.p)).Nodup ∧ (∀ v ∈ d.V, v.WellFormed) ∧
      (∃ v ∈ d.V, v.inVBadMod) ∧
      (d.hFGaloisOverFmod = true ∧ d.hFContainsSixTorsion = true ∧
        d.hImageContainsSLTwo = true ∧ d.hStableReduction = true ∧ d.hCKIsKCore = true))
    ⟨fun ⟨a, b, c, e, f, g, h, i, j, k⟩ => ⟨a, b, c, e, f, g, h, i, j, k⟩,
     fun ⟨a, b, c, e, f, g, h, i, j, k⟩ => ⟨a, b, c, e, f, g, h, i, j, k⟩⟩

/-- The prime `l` of well-formed data, packaged as an `LPrime`. -/
def toLPrime (h : d.WellFormed) : LPrime := ⟨d.l, h.l_prime, h.l_ge_five⟩

@[simp] theorem toLPrime_l (h : d.WellFormed) : (d.toLPrime h).l = d.l := rfl

theorem LStar_eq (h : d.WellFormed) : d.LStar = (d.toLPrime h).LStar := rfl

theorem LPm_eq (h : d.WellFormed) : d.LPm = (d.toLPrime h).LPm := rfl

/-- `l = 2l* + 1` for well-formed data. -/
theorem two_LStar_add_one (h : d.WellFormed) : 2 * d.LStar + 1 = d.l :=
  (d.toLPrime h).two_LStar_add_one

/-- `l± = l* + 1` for well-formed data. -/
theorem LPm_eq_LStar_succ (h : d.WellFormed) : d.LPm = d.LStar + 1 :=
  (d.toLPrime h).LPm_eq

/-- `l* ≥ 2` for well-formed data. -/
theorem two_le_LStar (h : d.WellFormed) : 2 ≤ d.LStar :=
  (d.toLPrime h).two_le_LStar

/-- `V^bad_mod ⊆ V^bad`. -/
theorem VBadMod_subset_VBad : ∀ v ∈ d.VBadMod, v ∈ d.VBad := by
  intro v hv
  unfold VBadMod at hv
  unfold VBad
  rw [List.mem_filter] at hv ⊢
  exact ⟨hv.1, by simpa using Valuation.inVBad_of_inVBadMod (by simpa using hv.2)⟩

/-- `V^bad_mod` is non-empty for well-formed data. -/
theorem VBadMod_ne_nil (h : d.WellFormed) : d.VBadMod ≠ [] := by
  obtain ⟨v, hv, hb⟩ := h.VBadMod_nonempty
  intro e
  have : v ∈ d.VBadMod := by
    unfold VBadMod
    rw [List.mem_filter]
    exact ⟨hv, by simpa using hb⟩
  rw [e] at this
  exact List.not_mem_nil this

/-- Every place of `V^bad_mod` has odd residue characteristic. -/
theorem VBadMod_odd : ∀ v ∈ d.VBadMod, v.p % 2 = 1 := by
  intro v hv
  unfold VBadMod at hv
  rw [List.mem_filter] at hv
  exact (by simpa using hv.2 : v.inVBadMod).2.2

/-- `V = V^non ⊔ V^arc`. -/
theorem length_VNon_add_VArc : d.VNon.length + d.VArc.length = d.V.length := by
  unfold VNon VArc
  induction d.V with
  | nil => rfl
  | cons v vs ih =>
    cases hv : v.kind <;> simp [hv] <;> omega

/-! ### Examples: the initial Θ-data generated by the C program -/

/-- The data of `iut_gen_example(0)`: the Frey curve of `1 + 2³ = 3²` with
`l = 7`.  `2³ ∥ abc` gives additive reduction at `2` (stable only after the
extension `F_tpd`), `3² ∥ abc` gives bad multiplicative reduction at `3` with
`ord₃(q) = 4`; `5`, `7` and `∞` are listed as good places.  The degree bounds
are `2·|GL₂(F₂)|·|GL₂(F₃)|·|GL₂(F₅)|` and `·|GL₂(F₇)|` ([IUTchIV] (E3)–(E5)). -/
def exampleOne : InitialThetaData where
  name := "abc(1,8,9) l=7"
  dmod := 1
  dF := 2 * 6 * 48 * 480
  dK := 2 * 6 * 48 * 480 * (7 * 8 * 6 * 6)
  curve := "Frey y^2=x(x-1)(x+8)"
  l := 7
  V := [Valuation.mk' 2 .badAdd 0, Valuation.mk' 3 .badMult 4, Valuation.mk' 5 .good 0,
    Valuation.mk' 7 .good 0, Valuation.arch]
  epsilon := 0
  hFGaloisOverFmod := true
  hFContainsSixTorsion := true
  hImageContainsSLTwo := true
  hStableReduction := true
  hCKIsKCore := true

/-- The data of `iut_gen_example(1)`: `3 + 5³ = 2⁷`, `l = 11`.  `2⁷ | abc` gives
multiplicative reduction at `2` with `ord₂(q) = 2·7 − 8 = 6` (not in `V^bad_mod`),
`ord₃(q) = 2`, `ord₅(q) = 6`. -/
def exampleTwo : InitialThetaData where
  name := "abc(3,125,128) l=11"
  dmod := 1
  dF := 2 * 6 * 48 * 480
  dK := 2 * 6 * 48 * 480 * (11 * 12 * 10 * 10)
  curve := "Frey y^2=x(x-3)(x+125)"
  l := 11
  V := [Valuation.mk' 2 .badMult 6, Valuation.mk' 3 .badMult 2, Valuation.mk' 5 .badMult 6,
    Valuation.mk' 11 .good 0, Valuation.arch]
  epsilon := 0
  hFGaloisOverFmod := true
  hFContainsSixTorsion := true
  hImageContainsSLTwo := true
  hStableReduction := true
  hCKIsKCore := true

/-- The data of `iut_gen_example(4)`: `1 + 2⁴·5 = 3⁴`, `l = 7`; `2⁴ ∥ abc` gives
*good* reduction at `2` (`Δ_min = 2⁻⁸(abc)²` is odd). -/
def exampleFive : InitialThetaData where
  name := "abc(1,80,81) l=7"
  dmod := 1
  dF := 2 * 6 * 48 * 480
  dK := 2 * 6 * 48 * 480 * (7 * 8 * 6 * 6)
  curve := "Frey y^2=x(x-1)(x+80)"
  l := 7
  V := [Valuation.mk' 2 .good 0, Valuation.mk' 5 .badMult 2, Valuation.mk' 3 .badMult 8,
    Valuation.mk' 7 .good 0, Valuation.arch]
  epsilon := 0
  hFGaloisOverFmod := true
  hFContainsSixTorsion := true
  hImageContainsSLTwo := true
  hStableReduction := true
  hCKIsKCore := true

theorem exampleOne_wellFormed : exampleOne.WellFormed := by decide

theorem exampleTwo_wellFormed : exampleTwo.WellFormed := by decide

theorem exampleFive_wellFormed : exampleFive.WellFormed := by decide

/-- **The species of initial Θ-data is inhabited**: there is well-formed
initial Θ-data. -/
theorem exists_wellFormed : ∃ d : InitialThetaData, d.WellFormed :=
  ⟨exampleOne, exampleOne_wellFormed⟩

instance : Inhabited InitialThetaData := ⟨exampleOne⟩

/-- A well-formed datum, as a subtype. -/
abbrev WellFormedData := { d : InitialThetaData // d.WellFormed }

instance : Inhabited WellFormedData := ⟨⟨exampleOne, exampleOne_wellFormed⟩⟩

/-- `l* = 3` and `l± = 4` for `l = 7`. -/
example : exampleOne.LStar = 3 ∧ exampleOne.LPm = 4 := by decide

/-- The `q`-divisor of the first example is `4·[3]`: `log(q) = 4 log 3`. -/
example : exampleOne.qDivisor = [(3, 4)] := by decide

/-- The second example has the even place `2` in `V^bad` but not in `V^bad_mod`. -/
example : exampleTwo.VBad.length = 3 ∧ exampleTwo.VBadMod.length = 2 := by decide

/-- A datum that is *not* well-formed: `l = 9` is not prime. -/
example : ¬ ({ exampleOne with l := 9 } : InitialThetaData).WellFormed := by decide

/-- A datum that is *not* well-formed: no odd prime of bad multiplicative reduction. -/
example : ¬ ({ exampleOne with
    V := [Valuation.mk' 2 .badMult 6, Valuation.arch] } : InitialThetaData).WellFormed := by
  decide

end InitialThetaData

end IUT
