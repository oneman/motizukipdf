import IUT.StageFour
import Mathlib.Analysis.SpecialFunctions.Log.Basic
import Mathlib.Analysis.SpecialFunctions.Pow.Real
import Mathlib.Analysis.Complex.ExponentialBounds
import Mathlib.NumberTheory.Bertrand
import Mathlib.NumberTheory.FLT.Basic
import Mathlib.Algebra.Ring.GeomSum
import Mathlib.Data.ZMod.Basic
import Mathlib.Data.Nat.Prime.Int
import Mathlib.Data.Nat.Factorization.Basic
import Mathlib.Data.Nat.PrimeFin
import Mathlib.RingTheory.Int.Basic
import Mathlib.RingTheory.Coprime.Lemmas

/-!
# Stage 5 of the LeanForm of IUT: the numerical aspects ([IUTchIV], [ExpEst])

[FormIUT] §2: *Stage 5: Numerical aspects ([IUTchIV], [ExpEst])* — the last
stage of the main strategy, the one that turns the inequality
`C_Θ ≥ −1` of [IUTchIII] Cor 3.12 (Stages 1–2) into numbers: the explicit
constant `C_Θ` of [IUTchIV] Thm 1.10, the Diophantine inequalities of
[IUTchIV] Cor 2.2–2.3 (Vojta/Szpiro for the λ-line), and the explicit
estimates of [ExpEst] (the `μ_6`-version, the effective abc inequalities
over `ℚ` and over imaginary quadratic fields, and the application to
Fermat's Last Theorem for `p > 1.615·10^14`).  As [FormIUT] remarks, this
content "is understood by a much larger class of mathematicians and has
never been a source of confusion/debate".

This file is the skeletal Lean form of that stage.  The analytic inputs
that Mathlib does not carry (the log-volume computations of [IUTchIV] Prop
1.1–1.5, the prime number theorem bounds of [IUTchIV] Prop 1.6 / [ExpEst]
Prop 2.2, the effective abc inequality of [ExpEst] Thm 5.3 and the
Fermat estimate of [ExpEst] Lemma 5.7) are *stated* as hypotheses; the
arithmetic that connects them — exactly the steps that a reader checks with a
pencil — is *proved*:

* **[IUTchIV] Thm 1.10, Step (i)**: the elementary facts (E1)–(E6)
  (`sum_range_succ_eq`, `six_mul_sum_range_succ_sq`, `gl2_card`,
  `gl2_card_two/three/five`, `log_two_le_one`, …);
* **[IUTchIV] Thm 1.10, final portion**: from `C_Θ ≥ −1` with the explicit
  `C_Θ` of `IUT.CTheta` to the inequality
  `(1/6) log q ≤ (1 + 20 d_mod/l)(log d + log f) + 20 (e*_mod l + η_prm)`
  (`thm110_final`, `thm110_of_CTheta`), using the two estimates
  `(1 − 12/l²)⁻¹ ≤ 2` and `(1 − 12/l²)⁻¹ (1 + 12 d/l) ≤ 1 + 20 d/l` for
  `l ≥ 7` (`factor_bounds`; note that `l ≠ 5` in Thm 1.10, `LPrime.seven_le_of_ne_five`);
* **[IUTchIV] Cor 2.2 ⟹ Cor 2.3**: the "bounded discrepancy" algebra that
  turns the effective bound (C2), with its `ε_E → 0`, into Vojta's
  inequality `ht ≲ (1 + ε)(log-diff + log-cond)` for every `ε > 0`
  (`eventually_bound`, `Cor22Data.vojta`), and the absorption lemma behind
  (C2) (`absorb`);
* **[IUTchIV] Prop 1.6 / [ExpEst] Prop 2.2**, in the only form Mathlib
  provides today: Bertrand's postulate gives, for every finite set `A` of
  primes, a prime outside `A` below `2^{|A|+1}` (`exists_prime_notMem`);
* **[ExpEst] Lemma 1.11** (linearisation of logarithms, `log_one_add_sub_le`);
* **[ExpEst] Thm 5.1, final portion** (the `μ_6`-version: `4.08803 ↦ 4.0881`
  for `l ≥ 10^15`, `thm51_final`);
* **[ExpEst] Lemma 5.5 and Lemma 5.6 (i), (ii)** (the cofactor
  `(r^p + s^p)/(r + s)`, the primes dividing it and `r + s`, and the
  factorisation `r + s = u^p`, `(r^p + s^p)/(r + s) = ũ^p` when `p ∤ t`:
  `fermatCofactor_mul`, `prime_dvd_cofactor_eq`, `cofactor_coprime`,
  `fermat_factor_powers`);
* **[ExpEst] Cor 5.8** (Fermat's Last Theorem for `p > 1.615·10^14`): the
  numerical contradiction between `z > (p+1)^p/2` (Lemma 5.7) and
  `z^p ≤ 2^{5/2} e^{h_1(1)/4} rad(x^p y^p z^p)^3` (Thm 5.3 (ii)), with
  `h_1(1) = 3.4·10^30`, carried out in Mathlib's real numbers with the
  bounds `e < 2.72`, `log 2 < 0.7` (`fermat_contradiction`), and the
  reduction to coprime triples (`fermatLastTheoremFor_of_estimates`).

The bookkeeping (`rows`, `status_counts`, `deps_are_rows`, `deps_acyclic`,
`stage_five_then_four`) records which of the eighteen numerical results of
[IUTchIV] §1–§2 and [ExpEst] are proved, proved modulo stated inputs,
replaced by an elementary substitute, or stated only, and that the only
input of Stage 5 from outside Stage 5 is [IUTchIII] Cor 3.12 (Stages 1–2).
-/

namespace IUT

namespace StageFive

open Finset

/-! ## [IUTchIV] Thm 1.10, Step (i): the elementary facts (E1)–(E6) -/

/-- **(E1)**: `(1/n) Σ_{m=1}^n m = (n+1)/2`, as `2 Σ_{m=1}^n m = n(n+1)`. -/
theorem sum_range_succ_eq (n : ℕ) : 2 * ∑ i ∈ range n, (i + 1) = n * (n + 1) := by
  induction n with
  | zero => simp
  | succ n ih => rw [sum_range_succ, mul_add, ih]; ring

/-- **(E2)**: `(1/n) Σ_{m=1}^n m² = (2n+1)(n+1)/6` (`IUT.six_mul_sum_range_succ_sq`). -/
theorem sum_range_succ_sq_eq (n : ℕ) :
    6 * ∑ i ∈ range n, (i + 1) ^ 2 = n * (n + 1) * (2 * n + 1) :=
  six_mul_sum_range_succ_sq n

/-- **(E3)**: `|GL₂(F_p)| = (p² − 1)(p² − p) = p (p+1) (p−1)²`. -/
theorem gl2_card (p : ℤ) : (p ^ 2 - 1) * (p ^ 2 - p) = p * (p + 1) * (p - 1) ^ 2 := by ring

/-- **(E4)**: the values at `p = 2, 3, 5`: `2·3`, `3·2⁴`, `5·2⁵·3`. -/
theorem gl2_card_two : (2 : ℤ) * (2 + 1) * (2 - 1) ^ 2 = 2 * 3 := by norm_num
theorem gl2_card_three : (3 : ℤ) * (3 + 1) * (3 - 1) ^ 2 = 3 * 2 ^ 4 := by norm_num
theorem gl2_card_five : (5 : ℤ) * (5 + 1) * (5 - 1) ^ 2 = 5 * 2 ^ 5 * 3 := by norm_num

/-- **(E6)**, first part: `0 ≤ log 2 ≤ 1`. -/
theorem log_two_le_one : Real.log 2 ≤ 1 := by
  have := Real.log_two_lt_d9
  linarith

theorem log_two_nonneg : 0 ≤ Real.log 2 := Real.log_nonneg (by norm_num)

/-- **(E6)**, second part: `1 ≤ log 3 ≤ log 5 ≤ 2` (the intermediate `log π`
of [IUTchIV] is omitted: Mathlib's bounds on `π` are not imported here). -/
theorem one_le_log_three : 1 ≤ Real.log 3 := by
  have := Real.log_three_gt_d9
  linarith

theorem log_three_le_log_five : Real.log 3 ≤ Real.log 5 :=
  Real.log_le_log (by norm_num) (by norm_num)

theorem log_five_le_two : Real.log 5 ≤ 2 := by
  rw [Real.log_le_iff_le_exp (by norm_num)]
  have h := Real.exp_one_gt_d9
  have h2 : Real.exp 2 = Real.exp 1 ^ 2 := by rw [Real.exp_one_pow]; norm_num
  rw [h2]
  nlinarith [h]

/-! ## [IUTchIV] Thm 1.10, final portion: from `C_Θ ≥ −1` to the inequality -/

/-- `l ≠ 5` in [IUTchIV] Thm 1.10 (the `3·5`-torsion is defined over `F`, so
[IUTchI] Def 3.1 (c) excludes `l = 5`), hence `l ≥ 7`. -/
theorem _root_.IUT.LPrime.seven_le_of_ne_five (L : LPrime) (h : L.l ≠ 5) : 7 ≤ L.l := by
  rcases L with ⟨l, hp, h5⟩
  simp only at h ⊢
  by_contra hlt
  have : l = 6 := by omega
  subst this
  norm_num at hp

/-- The two estimates of the final portion of the proof of [IUTchIV] Thm 1.10:
`(1 − 12/l²)⁻¹ ≤ 2` and `(1 − 12/l²)⁻¹ (1 + 12 d/l) ≤ 1 + 20 d/l`, in
denominator-free form, for `l ≥ 7`, `d ≥ 1`.  (For `l = 5` the second one is
false: `(25/13)(17/5) > 5`.) -/
theorem factor_bounds (l d : ℕ) (hl : 7 ≤ l) (hd : 1 ≤ d) :
    1 ≤ 2 * (1 - 12 / (l ^ 2 : ℚ)) ∧
    1 + 12 * d / l ≤ (1 + 20 * d / l) * (1 - 12 / (l ^ 2 : ℚ)) := by
  have hl' : (7 : ℚ) ≤ l := by exact_mod_cast hl
  have hd' : (1 : ℚ) ≤ d := by exact_mod_cast hd
  have hl0 : (0 : ℚ) < l := by linarith
  constructor
  · have : (12 : ℚ) / l ^ 2 ≤ 1 / 2 := by
      rw [div_le_iff₀ (by positivity)]
      nlinarith
    linarith
  · have key : (1 + 20 * d / l) * (1 - 12 / (l ^ 2 : ℚ)) =
        1 + 12 * d / l + (8 * d * l ^ 2 - 12 * l - 240 * d) / l ^ 3 := by
      field_simp
      ring
    have h1 : (0 : ℚ) ≤ (d - 1) * (l ^ 2 - 30) :=
      mul_nonneg (by linarith) (by nlinarith)
    have h2 : (0 : ℚ) ≤ (l - 7) * (8 * l + 44) := mul_nonneg (by linarith) (by linarith)
    have : (0 : ℚ) ≤ (8 * d * l ^ 2 - 12 * l - 240 * d) / l ^ 3 := by
      apply div_nonneg _ (by positivity)
      nlinarith [h1, h2]
    linarith

/-- **The final portion of [IUTchIV] Thm 1.10**: from the inequality
`(1/6)(1 − 12/l²) log q ≤ (1 + 12 d/l) X + 10 Y` (which is `A ≥ 0`, i.e.
`C_Θ ≥ −1`, `IUT.thetaA_nonneg_iff`) to
`(1/6) log q ≤ (1 + 20 d/l) X + 20 Y`, for `l ≥ 7`, `d ≥ 1`, `X, Y ≥ 0`.
Here `X = log d^{F_tpd} + log f^{F_tpd}` and `Y = e*_mod l + η_prm`. -/
theorem thm110_final (l d : ℕ) (hl : 7 ≤ l) (hd : 1 ≤ d) (X Y logq : ℚ)
    (hX : 0 ≤ X) (hY : 0 ≤ Y)
    (hA : (1 / 6) * (1 - 12 / (l ^ 2 : ℚ)) * logq ≤ (1 + 12 * d / l) * X + 10 * Y) :
    (1 / 6) * logq ≤ (1 + 20 * d / l) * X + 20 * Y := by
  obtain ⟨h1, h2⟩ := factor_bounds l d hl hd
  have hcpos : 0 < (1 - 12 / (l ^ 2 : ℚ)) := by linarith
  have e1 : (1 + 12 * d / l) * X ≤ (1 + 20 * d / l) * (1 - 12 / (l ^ 2 : ℚ)) * X :=
    mul_le_mul_of_nonneg_right h2 hX
  have e2 : 10 * Y ≤ 20 * (1 - 12 / (l ^ 2 : ℚ)) * Y := by nlinarith
  have key : (1 / 6) * logq * (1 - 12 / (l ^ 2 : ℚ)) ≤
      ((1 + 20 * d / l) * X + 20 * Y) * (1 - 12 / (l ^ 2 : ℚ)) := by
    nlinarith [hA, e1, e2]
  exact le_of_mul_le_mul_right key hcpos

/-- **[IUTchIV] Thm 1.10** (the inequality): if `C_Θ ≥ −1` for the explicit
constant `C_Θ` of `IUT.CTheta` ([IUTchIII] Cor 3.12 applied to the `C_Θ`
computed in [IUTchIV] §1), then
`(1/6) log q ≤ (1 + 20 d_mod/l)(log d + log f) + 20 (e*_mod l + η_prm)`. -/
theorem thm110_of_CTheta (l dmod : ℕ) (hl : 7 ≤ l) (hd : 1 ≤ dmod)
    (logd logf logq eStar eta : ℚ) (hdf : 0 ≤ logd + logf) (hY : 0 ≤ eStar * l + eta)
    (hq : 0 < logq) (h : -1 ≤ CTheta l dmod logd logf logq eStar eta) :
    (1 / 6) * logq ≤ (1 + 20 * dmod / l) * (logd + logf) + 20 * (eStar * l + eta) := by
  have hl0 : 0 < l := by omega
  have hA := (thetaA_nonneg_iff l dmod logd logf logq eStar eta).mp
    ((CTheta_ge_neg_one_iff l dmod hl0 logd logf logq eStar eta hq).mp h)
  exact thm110_final l dmod hl hd _ _ logq hdf hY hA

/-- The same for the `μ_6`-version, **[ExpEst] Thm 5.1, final portion**: for
`l ≥ 10^15` the term `4.08803 e*_mod l` becomes `4.0881 e*_mod l`. -/
theorem thm51_final (l d : ℕ) (hl : 10 ^ 15 ≤ l) (hd : 1 ≤ d) (X T logq : ℚ)
    (hX : 0 ≤ X) (hT : 0 ≤ T)
    (hA : (1 / 6) * (1 - 12 / (l ^ 2 : ℚ)) * logq ≤ (1 + 12 * d / l) * X + 4.08803 * T) :
    (1 / 6) * logq ≤ (1 + 20 * d / l) * X + 4.0881 * T := by
  have hl7 : 7 ≤ l := by
    have h := hl
    norm_num at h
    omega
  obtain ⟨-, h2⟩ := factor_bounds l d hl7 hd
  have hl' : (10 ^ 15 : ℚ) ≤ l := by exact_mod_cast hl
  have hsmall : (12 : ℚ) / l ^ 2 ≤ 2 / 10 ^ 29 := by
    rw [div_le_iff₀ (by positivity)]
    have h30 : (10 : ℚ) ^ 30 ≤ l ^ 2 := by nlinarith
    linarith
  have hcpos : 0 < (1 - 12 / (l ^ 2 : ℚ)) := by linarith
  have e1 : (1 + 12 * d / l) * X ≤ (1 + 20 * d / l) * (1 - 12 / (l ^ 2 : ℚ)) * X :=
    mul_le_mul_of_nonneg_right h2 hX
  have e2 : 4.08803 * T ≤ 4.0881 * (1 - 12 / (l ^ 2 : ℚ)) * T := by
    apply mul_le_mul_of_nonneg_right _ hT
    linarith
  have key : (1 / 6) * logq * (1 - 12 / (l ^ 2 : ℚ)) ≤
      ((1 + 20 * d / l) * X + 4.0881 * T) * (1 - 12 / (l ^ 2 : ℚ)) := by
    nlinarith [hA, e1, e2]
  exact le_of_mul_le_mul_right key hcpos

/-! ## [IUTchIV] Cor 2.2 ⟹ Cor 2.3: the bounded-discrepancy algebra -/

/-- The absorption behind (C2): a term `t ≤ s A` with `s < 1` on the right of
`A ≤ (1 + a) B + t` is absorbed into the left: `(1 − s) A ≤ (1 + a) B`. -/
theorem absorb (A B a t s : ℚ) (ht : t ≤ s * A) (h : A ≤ (1 + a) * B + t) :
    (1 - s) * A ≤ (1 + a) * B := by linarith

/-- **From an effective bound with `ε → 0` to Vojta's form**: if
`f ≤ (1 + ε₀) g + C` with `g ≥ 0`, and `ε₀ ≤ ε` wherever `f ≥ T`, then
`f ≤ (1 + ε) g + max C T` everywhere ([IUTchIV] Cor 2.2 (ii) ⟹ Cor 2.3). -/
theorem eventually_bound {α : Type*} (f g ε₀ : α → ℚ) (C ε T : ℚ) (hε : 0 ≤ ε)
    (hg : ∀ x, 0 ≤ g x) (h : ∀ x, f x ≤ (1 + ε₀ x) * g x + C)
    (hT : ∀ x, T ≤ f x → ε₀ x ≤ ε) (x : α) :
    f x ≤ (1 + ε) * g x + max C T := by
  by_cases hx : T ≤ f x
  · have h1 := h x
    have h2 : (1 + ε₀ x) * g x ≤ (1 + ε) * g x :=
      mul_le_mul_of_nonneg_right (by linarith [hT x hx]) (hg x)
    have h3 : C ≤ max C T := le_max_left _ _
    linarith
  · push Not at hx
    have h3 : T ≤ max C T := le_max_right _ _
    have h4 : 0 ≤ (1 + ε) * g x := mul_nonneg (by linarith) (hg x)
    linarith

/-- **The data of [IUTchIV] Cor 2.2** on a set `Pt` of points
(`K_V ∩ U_X(Q̄)^{≤d}` minus the exceptional set): the functions `log q`,
`ht_{ω_X(D)}`, `log-diff_X`, `log-cond_D`, the `ε_E` of (C2), and the three
properties used in the proof of Cor 2.3: the BD-class equality
`ht ≈ (1/6) log q` of Cor 2.2 (i), the bound (C2) of Cor 2.2 (ii), and
`ε_E → 0` as `log q → ∞` (which is what the formula
`ε_E = (60δ)² log(2δ log q)/(log q)^{1/2}` gives). -/
structure Cor22Data (Pt : Type*) where
  logq : Pt → ℚ
  ht : Pt → ℚ
  logdiff : Pt → ℚ
  logcond : Pt → ℚ
  epsE : Pt → ℚ
  /-- `C_K` of (C2) -/
  CK : ℚ
  /-- the bound of the discrepancy `ht − (1/6) log q` -/
  B : ℚ
  nonneg : ∀ x, 0 ≤ logdiff x + logcond x
  /-- Cor 2.2 (i): `ht_{ω_X(D)} ≈ (1/6) log q` -/
  ht_bd : ∀ x, ht x ≤ (1 / 6) * logq x + B
  /-- Cor 2.2 (ii), (C2) -/
  C2 : ∀ x, (1 / 6) * logq x ≤ (1 + epsE x) * (logdiff x + logcond x) + CK
  /-- `ε_E → 0` as `log q → ∞` -/
  eps_small : ∀ ε : ℚ, 0 < ε → ∃ T, ∀ x, T ≤ (1 / 6) * logq x → epsE x ≤ ε

/-- **[IUTchIV] Cor 2.3 on the λ-line** (Vojta's conjecture for `P¹ ∖ {0,1,∞}`,
hence the Szpiro conjecture): for every `ε > 0` there is a constant `C` with
`ht_{ω_X(D)} ≤ (1 + ε)(log-diff_X + log-cond_D) + C` on the points. -/
theorem Cor22Data.vojta {Pt : Type*} (D : Cor22Data Pt) (ε : ℚ) (hε : 0 < ε) :
    ∃ C, ∀ x, D.ht x ≤ (1 + ε) * (D.logdiff x + D.logcond x) + C := by
  obtain ⟨T, hT⟩ := D.eps_small ε hε
  refine ⟨max D.CK T + D.B, fun x => ?_⟩
  have h1 := eventually_bound (fun x => (1 / 6) * D.logq x)
    (fun x => D.logdiff x + D.logcond x) D.epsE D.CK ε T hε.le D.nonneg D.C2 hT x
  have h2 := D.ht_bd x
  linarith

/-! ## [IUTchIV] Prop 1.6 / [ExpEst] Prop 2.2: primes outside a finite set -/

/-- Bertrand's postulate in the form used here: a prime in `(2^k, 2^{k+1}]`. -/
theorem exists_prime_pow_two_interval (k : ℕ) :
    ∃ p, p.Prime ∧ 2 ^ k < p ∧ p ≤ 2 ^ (k + 1) := by
  obtain ⟨p, hp, h1, h2⟩ := Nat.exists_prime_lt_and_le_two_mul (2 ^ k) (by positivity)
  exact ⟨p, hp, h1, by rw [pow_succ]; omega⟩

/-- A chosen prime in `(2^k, 2^{k+1}]`. -/
noncomputable def bertrandPrime (k : ℕ) : ℕ := Classical.choose (exists_prime_pow_two_interval k)

theorem bertrandPrime_spec (k : ℕ) :
    (bertrandPrime k).Prime ∧ 2 ^ k < bertrandPrime k ∧ bertrandPrime k ≤ 2 ^ (k + 1) :=
  Classical.choose_spec (exists_prime_pow_two_interval k)

theorem bertrandPrime_injective : Function.Injective bertrandPrime := by
  intro a b hab
  by_contra hne
  rcases Nat.lt_or_gt_of_ne hne with h | h
  · have h1 := (bertrandPrime_spec a).2.2
    have h2 := (bertrandPrime_spec b).2.1
    have : 2 ^ (a + 1) ≤ 2 ^ b := Nat.pow_le_pow_right (by norm_num) h
    omega
  · have h1 := (bertrandPrime_spec b).2.2
    have h2 := (bertrandPrime_spec a).2.1
    have : 2 ^ (b + 1) ≤ 2 ^ a := Nat.pow_le_pow_right (by norm_num) h
    omega

/-- **An elementary substitute for [IUTchIV] Prop 2.1 (ii) / [ExpEst] Prop 2.2
(ii)**: for every finite set `A` of natural numbers there is a prime
`p ∉ A` with `p ≤ 2^{|A|+1}`.  ([ExpEst] gives `p ≤ 1.00072 (θ_A + ξ_prm)`
from the Rosser–Schoenfeld bounds; Bertrand's postulate is what Mathlib has.) -/
theorem exists_prime_notMem (A : Finset ℕ) :
    ∃ p, p.Prime ∧ p ∉ A ∧ p ≤ 2 ^ (A.card + 1) := by
  by_contra hcon
  push Not at hcon
  have hmaps : ∀ k ∈ range (A.card + 1), bertrandPrime k ∈ A := by
    intro k hk
    rw [mem_range] at hk
    by_contra hnot
    have h1 := hcon _ (bertrandPrime_spec k).1 hnot
    have h2 := (bertrandPrime_spec k).2.2
    have : 2 ^ (k + 1) ≤ 2 ^ (A.card + 1) := Nat.pow_le_pow_right (by norm_num) (by omega)
    omega
  have := card_le_card_of_injOn bertrandPrime hmaps bertrandPrime_injective.injOn
  rw [card_range] at this
  omega

/-! ## [ExpEst] Lemma 1.11: linearisation of logarithms -/

/-- **[ExpEst] Lemma 1.11**: `0 ≤ a − log a − 1` for `a > 0`. -/
theorem log_le_sub_one (a : ℝ) (ha : 0 < a) : 0 ≤ a - Real.log a - 1 := by
  have := Real.log_le_sub_one_of_pos ha
  linarith

/-- **[ExpEst] Lemma 1.11**, second part: `log(1 + x) − a x ≤ a − log a − 1`
for `x ≥ 0` (take `a(1 + x)` for `a`). -/
theorem log_one_add_sub_le (a x : ℝ) (ha : 0 < a) (hx : 0 ≤ x) :
    Real.log (1 + x) - a * x ≤ a - Real.log a - 1 := by
  have h := log_le_sub_one (a * (1 + x)) (by positivity)
  rw [Real.log_mul ha.ne' (by positivity)] at h
  linarith

/-! ## [ExpEst] Lemma 5.5, Lemma 5.6: the cofactor `(r^p + s^p)/(r + s)` -/

/-- The cofactor `Q_p(r, s) = Σ_{i<p} r^i (−s)^{p−1−i}` of `r + s` in
`r^p + s^p` (`p` odd): the quantity `(r^p + s^p)(r + s)^{−1}` of [ExpEst]
Lemma 5.5–5.7. -/
def fermatCofactor (p : ℕ) (r s : ℤ) : ℤ := ∑ i ∈ range p, r ^ i * (-s) ^ (p - 1 - i)

/-- **[ExpEst] Lemma 5.5** (the form of it that Lemma 5.6 uses):
`Q_p(r, s) · (r + s) = r^p + s^p` for odd `p`. -/
theorem fermatCofactor_mul (p : ℕ) (hp : Odd p) (r s : ℤ) :
    fermatCofactor p r s * (r + s) = r ^ p + s ^ p := by
  have h := geom_sum₂_mul r (-s) p
  rw [sub_neg_eq_add, hp.neg_pow, sub_neg_eq_add] at h
  exact h

/-- **[ExpEst] Lemma 5.6 (i)**: for an odd prime `p` and coprime `r, s`, a prime
`l` dividing both `r + s` and `Q_p(r, s)` is `p` itself.  (Mod `l`, `s ≡ −r`
turns `Q_p(r, s)` into `p r^{p−1}`.) -/
theorem prime_dvd_cofactor_eq (p : ℕ) (hp : p.Prime) (hodd : Odd p) (r s : ℤ)
    (hrs : IsCoprime r s) (l : ℕ) (hl : l.Prime)
    (h1 : (l : ℤ) ∣ r + s) (h2 : (l : ℤ) ∣ fermatCofactor p r s) : l = p := by
  have := Fact.mk hl
  have hs : (s : ZMod l) = -(r : ZMod l) := by
    have := (ZMod.intCast_zmod_eq_zero_iff_dvd (r + s) l).mpr h1
    push_cast at this
    linear_combination this
  have hQ : ((fermatCofactor p r s : ℤ) : ZMod l) = 0 :=
    (ZMod.intCast_zmod_eq_zero_iff_dvd _ l).mpr h2
  have hQ' : ((fermatCofactor p r s : ℤ) : ZMod l) = (p : ZMod l) * (r : ZMod l) ^ (p - 1) := by
    unfold fermatCofactor
    push_cast
    rw [hs]
    simp only [neg_neg]
    have hterm : ∀ i ∈ range p,
        (r : ZMod l) ^ i * (r : ZMod l) ^ (p - 1 - i) = (r : ZMod l) ^ (p - 1) := by
      intro i hi
      rw [mem_range] at hi
      rw [← pow_add]
      congr 1
      omega
    rw [sum_congr rfl hterm, sum_const, card_range, nsmul_eq_mul]
  rw [hQ'] at hQ
  obtain ⟨k, hk⟩ := hodd
  have hp2 := hp.two_le
  have hp1 : p - 1 ≠ 0 := by omega
  rcases mul_eq_zero.mp hQ with h | h
  · have : l ∣ p := (ZMod.natCast_eq_zero_iff p l).mp h
    exact (Nat.prime_dvd_prime_iff_eq hl hp).mp this
  · exfalso
    have hr : (r : ZMod l) = 0 := (pow_eq_zero_iff hp1).mp h
    have hr' : (l : ℤ) ∣ r := (ZMod.intCast_zmod_eq_zero_iff_dvd r l).mp hr
    have hs' : (l : ℤ) ∣ s := by
      have := dvd_sub h1 hr'
      simpa using this
    have hu := hrs.isUnit_of_dvd' hr' hs'
    have hl2 := hl.two_le
    rcases Int.isUnit_iff.mp hu with h | h <;> omega

/-- **[ExpEst] Lemma 5.6 (ii)**, first part: if `r^p + s^p + t^p = 0` with `r, s`
coprime and `p ∤ t`, then `r + s` and `Q_p(r, s)` are coprime. -/
theorem cofactor_coprime (p : ℕ) (hp : p.Prime) (hodd : Odd p) (r s t : ℤ)
    (hrs : IsCoprime r s) (h : r ^ p + s ^ p + t ^ p = 0) (hpt : ¬ (p : ℤ) ∣ t) :
    IsCoprime (r + s) (fermatCofactor p r s) := by
  rw [Int.isCoprime_iff_gcd_eq_one]
  by_contra hne
  obtain ⟨l, hl, hld⟩ := Nat.exists_prime_and_dvd hne
  have hl1 : (l : ℤ) ∣ r + s :=
    (Int.natCast_dvd_natCast.mpr hld).trans (Int.gcd_dvd_left _ _)
  have hl2 : (l : ℤ) ∣ fermatCofactor p r s :=
    (Int.natCast_dvd_natCast.mpr hld).trans (Int.gcd_dvd_right _ _)
  have hlp := prime_dvd_cofactor_eq p hp hodd r s hrs l hl hl1 hl2
  subst hlp
  apply hpt
  have hdvd : (l : ℤ) ∣ t ^ l := by
    have : t ^ l = -(fermatCofactor l r s * (r + s)) := by
      rw [fermatCofactor_mul l hodd]; linear_combination h
    rw [this]
    exact (dvd_mul_of_dvd_left hl2 _).neg_right
  exact (Nat.prime_iff_prime_int.mp hl).dvd_of_dvd_pow hdvd

/-- **[ExpEst] Lemma 5.6 (ii)**, second part: under the same hypotheses there are
integers `u, ũ` with `r + s = u^p` and `Q_p(r, s) = ũ^p` (so `t = −u ũ`):
unique factorisation applied to `(r + s) Q_p(r, s) = (−t)^p`. -/
theorem fermat_factor_powers (p : ℕ) (hp : p.Prime) (hodd : Odd p) (r s t : ℤ)
    (hrs : IsCoprime r s) (h : r ^ p + s ^ p + t ^ p = 0) (hpt : ¬ (p : ℤ) ∣ t) :
    (∃ u, r + s = u ^ p) ∧ ∃ v, fermatCofactor p r s = v ^ p := by
  have hcop := cofactor_coprime p hp hodd r s t hrs h hpt
  have hmul : (r + s) * fermatCofactor p r s = (-t) ^ p := by
    rw [hodd.neg_pow, mul_comm, fermatCofactor_mul p hodd]
    linear_combination h
  exact Int.eq_pow_of_mul_eq_pow_odd hcop hodd hmul

/-! ## [ExpEst] Cor 5.8: Fermat's Last Theorem for `p > 1.615·10^14` -/

/-- `h_1(1) = 3.4·10^30` ([ExpEst] Thm 5.3: `h_d(ε) = 3.4·10^30·ε^{−166/81}`
for `d = 1`, at `ε = 1`). -/
noncomputable def hOne : ℝ := 3.4 * 10 ^ 30

/-- `log x ≥ 32.6` for `x ≥ 1.615·10^14`: `e^{326} < 2.72^{326} ≤ (1.615·10^14)^{10}`. -/
theorem log_bound_large (x : ℝ) (hx : 1.615 * 10 ^ 14 ≤ x) : 32.6 ≤ Real.log x := by
  have hx0 : (0 : ℝ) < x := by linarith
  rw [Real.le_log_iff_exp_le hx0]
  have h1 : Real.exp 1 ≤ 2.72 := by
    have := Real.exp_one_lt_d9
    linarith
  have h326 : Real.exp 326 ≤ (1.615 * 10 ^ 14) ^ 10 := by
    have e : Real.exp 326 = Real.exp 1 ^ 326 := by rw [Real.exp_one_pow]; norm_num
    rw [e]
    calc Real.exp 1 ^ 326 ≤ 2.72 ^ 326 := pow_le_pow_left₀ (Real.exp_pos 1).le h1 326
      _ ≤ (1.615 * 10 ^ 14) ^ 10 := by
          have h : (68 : ℕ) ^ 326 ≤ 1615 ^ 10 * 10 ^ 110 * 25 ^ 326 := by decide +kernel
          have e1 : (2.72 : ℝ) = 68 / 25 := by norm_num
          have e2 : (1.615 * 10 ^ 14 : ℝ) ^ 10 = 1615 ^ 10 * 10 ^ 110 := by norm_num
          rw [e1, e2, div_pow, div_le_iff₀ (by positivity)]
          exact_mod_cast h
  have hpow : Real.exp 32.6 ^ 10 = Real.exp 326 := by
    rw [← Real.exp_nat_mul]
    norm_num
  have h2 : Real.exp 32.6 ≤ 1.615 * 10 ^ 14 := by
    apply le_of_pow_le_pow_left₀ (by norm_num : (10 : ℕ) ≠ 0) (by positivity)
    rw [hpow]
    exact h326
  linarith

/-- **The numerical core of [ExpEst] Cor 5.8**: a prime `p > 1.615·10^14` and
positive `x, y ≤ z` cannot satisfy both the lower bound `z > (p+1)^p/2` of
[ExpEst] Lemma 5.7 and the upper bound
`z^p ≤ 2^{5/2} e^{h_1(1)/4} (xyz)^3` of [ExpEst] Thm 5.3 (ii) (with
`rad(x^p y^p z^p) ≤ xyz`): comparing logarithms,
`p (p − 9) log(p+1) < (p − 9) log 2 + log 8 + h_1(1)/4` is impossible once
`log(p+1) ≥ 32.6`. -/
theorem fermat_contradiction (p x y z : ℕ) (hp : (1.615 * 10 ^ 14 : ℝ) < p)
    (hx : 1 ≤ x) (hy : 1 ≤ y) (hxz : x ≤ z) (hyz : y ≤ z)
    (h53 : (z : ℝ) ^ p ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) *
      ((x * y * z : ℕ) : ℝ) ^ 3)
    (h57 : ((p : ℝ) + 1) ^ p / 2 < z) : False := by
  have hz : (1 : ℝ) ≤ z := by exact_mod_cast le_trans hx hxz
  have hp9 : (9 : ℝ) < p := by linarith
  have hp9' : 9 < p := by exact_mod_cast hp9
  -- `(xyz)^3 ≤ z^9`
  have hxyz : ((x * y * z : ℕ) : ℝ) ^ 3 ≤ (z : ℝ) ^ 9 := by
    have hx' : (x : ℝ) ≤ z := by exact_mod_cast hxz
    have hy' : (y : ℝ) ≤ z := by exact_mod_cast hyz
    have hx0 : (0 : ℝ) ≤ x := by positivity
    have hy0 : (0 : ℝ) ≤ y := by positivity
    have hz0 : (0 : ℝ) ≤ z := by positivity
    have h3 : ((x * y * z : ℕ) : ℝ) ≤ (z : ℝ) ^ 3 := by
      push_cast
      calc (x : ℝ) * y * z ≤ z * z * z := by gcongr
        _ = (z : ℝ) ^ 3 := by ring
    calc ((x * y * z : ℕ) : ℝ) ^ 3 ≤ ((z : ℝ) ^ 3) ^ 3 := pow_le_pow_left₀ (by positivity) h3 3
      _ = (z : ℝ) ^ 9 := by ring
  -- `2^{5/2} ≤ 8`
  have h2 : (2 : ℝ) ^ ((5 : ℝ) / 2) ≤ 8 := by
    calc (2 : ℝ) ^ ((5 : ℝ) / 2) ≤ (2 : ℝ) ^ ((3 : ℕ) : ℝ) :=
          Real.rpow_le_rpow_of_exponent_le (by norm_num) (by norm_num)
      _ = 8 := by rw [Real.rpow_natCast]; norm_num
  -- `z^{p−9} ≤ 8 e^{h/4}`
  have hK : (z : ℝ) ^ (p - 9) ≤ 8 * Real.exp (hOne / 4) := by
    have hsplit : (z : ℝ) ^ p = (z : ℝ) ^ (p - 9) * (z : ℝ) ^ 9 := by
      rw [← pow_add]; congr 1; omega
    have hpos9 : (0 : ℝ) < (z : ℝ) ^ 9 := by positivity
    have hexp : (0 : ℝ) ≤ Real.exp (hOne / 4) := (Real.exp_pos _).le
    have : (z : ℝ) ^ (p - 9) * (z : ℝ) ^ 9 ≤ 8 * Real.exp (hOne / 4) * (z : ℝ) ^ 9 := by
      rw [← hsplit]
      calc (z : ℝ) ^ p ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) *
            ((x * y * z : ℕ) : ℝ) ^ 3 := h53
        _ ≤ 8 * Real.exp (hOne / 4) * (z : ℝ) ^ 9 := by gcongr
    exact le_of_mul_le_mul_right this hpos9
  -- `((p+1)^p/2)^{p−9} ≤ z^{p−9}`
  have hbase : (0 : ℝ) < ((p : ℝ) + 1) ^ p / 2 := by positivity
  have hlow : (((p : ℝ) + 1) ^ p / 2) ^ (p - 9) ≤ (z : ℝ) ^ (p - 9) :=
    pow_le_pow_left₀ hbase.le h57.le _
  -- take logarithms
  have hlog := Real.log_le_log (pow_pos hbase _) (hlow.trans hK)
  rw [Real.log_pow, Real.log_mul (by norm_num) (Real.exp_pos _).ne', Real.log_exp,
    Real.log_div (by positivity) (by norm_num), Real.log_pow] at hlog
  have hcast : ((p - 9 : ℕ) : ℝ) = (p : ℝ) - 9 := by
    rw [Nat.cast_sub hp9'.le]; norm_num
  rw [hcast] at hlog
  -- the numerical bounds
  have hL : 32.6 ≤ Real.log ((p : ℝ) + 1) := log_bound_large _ (by linarith)
  have hl2 : Real.log 2 ≤ 0.7 := by
    have := Real.log_two_lt_d9
    linarith
  have hl8 : Real.log 8 ≤ 2.1 := by
    have e : (8 : ℝ) = 2 ^ 3 := by norm_num
    rw [e, Real.log_pow]
    push_cast
    linarith
  have hA : (1.615 * 10 ^ 14 - 9 : ℝ) ≤ (p : ℝ) - 9 := by linarith
  have hB : (32.6 * (1.615 * 10 ^ 14) - 0.7 : ℝ) ≤
      (p : ℝ) * Real.log ((p : ℝ) + 1) - Real.log 2 := by
    have hp0 : (0 : ℝ) ≤ p := by positivity
    have e1 : (32.6 : ℝ) * (1.615 * 10 ^ 14) ≤ 32.6 * (p : ℝ) :=
      mul_le_mul_of_nonneg_left hp.le (by norm_num)
    have e2 : (p : ℝ) * 32.6 ≤ (p : ℝ) * Real.log ((p : ℝ) + 1) :=
      mul_le_mul_of_nonneg_left hL hp0
    linarith
  have hprod := mul_le_mul hA hB (by norm_num) (by linarith)
  unfold hOne at hlog
  linarith [hprod, hlog, hl8]

/-- The radical `rad(n) = Π_{q | n} q`. -/
def rad (n : ℕ) : ℕ := ∏ q ∈ n.primeFactors, q

theorem rad_le (n : ℕ) (hn : n ≠ 0) : rad n ≤ n :=
  Nat.le_of_dvd (Nat.pos_of_ne_zero hn) (Nat.prod_primeFactors_dvd n)

theorem rad_pow (n k : ℕ) (hk : k ≠ 0) : rad (n ^ k) = rad n := by
  unfold rad
  rw [Nat.primeFactors_pow n hk]

/-- **[ExpEst] Thm 5.3 (ii)** (Theorem A (ii)), for `L = ℚ`, `ε = 1`, applied as
in the proof of Cor 5.8 to the triple `(x^p, y^p, −z^p)`:
`H_ℚ = z^p ≤ 2^{5/2} e^{h_1(1)/4} rad(x^p y^p z^p)^3` — the effective abc
inequality, stated as a hypothesis. -/
structure EffectiveABC where
  bound : ∀ (p x y z : ℕ), 0 < x → 0 < y → 0 < z → Nat.Coprime x y →
    x ^ p + y ^ p = z ^ p →
    (z : ℝ) ^ p ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) *
      (rad (x ^ p * y ^ p * z ^ p) : ℝ) ^ 3

/-- **[ExpEst] Lemma 5.7**: a coprime solution of `x^p + y^p = z^p` (`p ≥ 3`
prime) has `z > (p+1)^p / 2` — stated as a hypothesis (its proof is the
elementary but long case analysis of [ExpEst] §5, built on Lemma 5.6). -/
structure FermatLowerBound where
  bound : ∀ (p x y z : ℕ), p.Prime → 3 ≤ p → 0 < x → 0 < y → 0 < z → Nat.Coprime x y →
    x ^ p + y ^ p = z ^ p → (p + 1) ^ p < 2 * z

/-- A solution of `x^p + y^p = z^p` with `gcd(x, y, z) = 1` has `x, y` coprime. -/
theorem coprime_of_fermat (p x y z : ℕ) (hp : p ≠ 0)
    (hgcd : ({x, y, z} : Finset ℕ).gcd id = 1) (h : x ^ p + y ^ p = z ^ p) :
    Nat.Coprime x y := by
  rw [Nat.coprime_iff_gcd_eq_one]
  by_contra hne
  obtain ⟨q, hq, hqd⟩ := Nat.exists_prime_and_dvd hne
  have hqx : q ∣ x := hqd.trans (Nat.gcd_dvd_left _ _)
  have hqy : q ∣ y := hqd.trans (Nat.gcd_dvd_right _ _)
  have hqz : q ∣ z := by
    apply hq.dvd_of_dvd_pow (n := p)
    rw [← h]
    exact dvd_add (dvd_pow hqx hp) (dvd_pow hqy hp)
  have : q ∣ ({x, y, z} : Finset ℕ).gcd id := by
    apply Finset.dvd_gcd
    intro b hb
    simp only [mem_insert, mem_singleton] at hb
    rcases hb with rfl | rfl | rfl <;> assumption
  rw [hgcd] at this
  exact hq.one_lt.ne' (Nat.dvd_one.mp this)

/-- **[ExpEst] Cor 5.8** (Fermat's Last Theorem for `p > 1.615·10^14`), modulo
the effective abc inequality of [ExpEst] Thm 5.3 and the lower bound of
[ExpEst] Lemma 5.7: for every prime `p > 1.615·10^14`, `x^p + y^p = z^p` has
no solution in positive integers (`FermatLastTheoremFor p`). -/
theorem fermatLastTheoremFor_of_estimates (H : EffectiveABC) (L : FermatLowerBound)
    (p : ℕ) (hp : p.Prime) (hbig : (1.615 * 10 ^ 14 : ℝ) < p) : FermatLastTheoremFor p := by
  apply fermatLastTheoremWith_of_fermatLastTheoremWith_coprime
  intro x y z hx hy hz hgcd hxyz
  have hx' : 0 < x := Nat.pos_of_ne_zero hx
  have hy' : 0 < y := Nat.pos_of_ne_zero hy
  have hz' : 0 < z := Nat.pos_of_ne_zero hz
  have hcop := coprime_of_fermat p x y z hp.ne_zero hgcd hxyz
  have hp3 : 3 ≤ p := by
    have : (3 : ℝ) ≤ p := by linarith
    exact_mod_cast this
  have hxz : x ≤ z := by
    rw [← Nat.pow_le_pow_iff_left hp.ne_zero, ← hxyz]
    exact Nat.le_add_right _ _
  have hyz : y ≤ z := by
    rw [← Nat.pow_le_pow_iff_left hp.ne_zero, ← hxyz]
    exact Nat.le_add_left _ _
  have hb := H.bound p x y z hx' hy' hz' hcop hxyz
  have hl := L.bound p x y z hp hp3 hx' hy' hz' hcop hxyz
  -- `rad(x^p y^p z^p) ≤ xyz`
  have hrad : (rad (x ^ p * y ^ p * z ^ p) : ℝ) ≤ ((x * y * z : ℕ) : ℝ) := by
    have e : x ^ p * y ^ p * z ^ p = (x * y * z) ^ p := by ring
    rw [e, rad_pow _ _ hp.ne_zero]
    exact_mod_cast rad_le _ (by positivity)
  have h53 : (z : ℝ) ^ p ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) *
      ((x * y * z : ℕ) : ℝ) ^ 3 := by
    calc (z : ℝ) ^ p ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) *
          (rad (x ^ p * y ^ p * z ^ p) : ℝ) ^ 3 := hb
      _ ≤ (2 : ℝ) ^ ((5 : ℝ) / 2) * Real.exp (hOne / 4) * ((x * y * z : ℕ) : ℝ) ^ 3 := by
          gcongr
  have h57 : ((p : ℝ) + 1) ^ p / 2 < z := by
    rw [div_lt_iff₀ (by norm_num)]
    have : ((p + 1 : ℕ) : ℝ) ^ p < 2 * z := by exact_mod_cast hl
    push_cast at this
    linarith
  exact fermat_contradiction p x y z hbig hx' hy' hxz hyz h53 h57

/-! ## Bookkeeping: the numerical results of [IUTchIV] and [ExpEst] -/

/-- The status of a numerical result in this file. -/
inductive Status where
  /-- proved from Mathlib -/
  | proved
  /-- proved modulo results that are stated -/
  | conditional
  /-- replaced by a weaker, elementary result proved from Mathlib -/
  | substitute
  /-- stated only -/
  | stated
  deriving DecidableEq, Repr

/-- A numerical result: its id, where it is, its status, what it rests on, and
the declarations of this file that carry it. -/
structure Row where
  id : String
  ref : String
  status : Status
  dependsOn : List String
  leanNames : List String
  deriving Repr

/-- The input of Stage 5 from the earlier stages. -/
def cor312 : String := "IUTchIII.Cor3.12"

/-- The table. -/
def rows : List Row := [
  ⟨"IUTchIV.E1-E6", "[IUTchIV] Thm 1.10, Step (i)", .proved, [],
    ["sum_range_succ_eq", "sum_range_succ_sq_eq", "gl2_card", "gl2_card_two", "gl2_card_three",
     "gl2_card_five", "log_two_le_one", "one_le_log_three", "log_three_le_log_five",
     "log_five_le_two"]⟩,
  ⟨"IUTchIV.Prop1.1-1.5", "[IUTchIV] Prop 1.1–1.5 (differents, log-volumes, archimedean)",
    .stated, [], []⟩,
  ⟨"IUTchIV.Prop1.6", "[IUTchIV] Prop 1.6 (prime number theorem)", .substitute, [],
    ["exists_prime_notMem"]⟩,
  ⟨"IUTchIV.Prop1.7", "[IUTchIV] Prop 1.7 (weighted averages)", .stated, [], []⟩,
  ⟨"IUTchIV.Thm1.10", "[IUTchIV] Thm 1.10 (log-volume estimates for Θ-pilots)", .conditional,
    [cor312, "IUTchIV.E1-E6", "IUTchIV.Prop1.1-1.5", "IUTchIV.Prop1.6", "IUTchIV.Prop1.7"],
    ["factor_bounds", "thm110_final", "thm110_of_CTheta", "LPrime.seven_le_of_ne_five"]⟩,
  ⟨"IUTchIV.Cor2.2", "[IUTchIV] Cor 2.2 (suitable initial Θ-data; (C1), (C2))", .stated,
    ["IUTchIV.Thm1.10", "IUTchIV.Prop1.6"], ["Cor22Data", "absorb"]⟩,
  ⟨"IUTchIV.Cor2.3", "[IUTchIV] Cor 2.3 (Diophantine inequalities)", .conditional,
    ["IUTchIV.Cor2.2"], ["eventually_bound", "Cor22Data.vojta"]⟩,
  ⟨"ExpEst.Lemma1.11", "[ExpEst] Lemma 1.11 (linearisation of logarithms)", .proved, [],
    ["log_le_sub_one", "log_one_add_sub_le"]⟩,
  ⟨"ExpEst.Prop2.2", "[ExpEst] Prop 2.2 (effective prime number theorem)", .substitute, [],
    ["exists_prime_notMem"]⟩,
  ⟨"ExpEst.Lemma3.1", "[ExpEst] Lemma 3.1 / Prop 3.2 (primitive 12-th roots of unity)",
    .stated, [], []⟩,
  ⟨"ExpEst.Thm5.1", "[ExpEst] Thm 5.1 (the μ_6-version of Thm 1.10)", .conditional,
    [cor312, "IUTchIV.Prop1.1-1.5", "ExpEst.Prop2.2", "ExpEst.Lemma3.1"], ["thm51_final"]⟩,
  ⟨"ExpEst.Cor5.2", "[ExpEst] Cor 5.2 (suitable μ_6-initial Θ-data)", .stated,
    ["ExpEst.Thm5.1"], []⟩,
  ⟨"ExpEst.Thm5.3", "[ExpEst] Thm 5.3 = Thm A (effective abc over mono-complex fields)",
    .stated, ["ExpEst.Cor5.2", "ExpEst.Lemma1.11"], ["EffectiveABC"]⟩,
  ⟨"ExpEst.Thm5.4", "[ExpEst] Thm 5.4 = Thm B (effective Szpiro over ℚ)", .stated,
    ["ExpEst.Thm5.3"], []⟩,
  ⟨"ExpEst.Lemma5.5", "[ExpEst] Lemma 5.5 (elementary identity)", .proved, [],
    ["fermatCofactor", "fermatCofactor_mul"]⟩,
  ⟨"ExpEst.Lemma5.6", "[ExpEst] Lemma 5.6 (i), (ii) (solutions of the Fermat equation)",
    .proved, ["ExpEst.Lemma5.5"],
    ["prime_dvd_cofactor_eq", "cofactor_coprime", "fermat_factor_powers"]⟩,
  ⟨"ExpEst.Lemma5.7", "[ExpEst] Lemma 5.7 (z > (p+1)^p/2)", .stated, ["ExpEst.Lemma5.6"],
    ["FermatLowerBound"]⟩,
  ⟨"ExpEst.Cor5.8", "[ExpEst] Cor 5.8 = Cor C (Fermat's Last Theorem for p > 1.615·10^14)",
    .conditional, ["ExpEst.Thm5.3", "ExpEst.Lemma5.7"],
    ["log_bound_large", "fermat_contradiction", "coprime_of_fermat",
     "fermatLastTheoremFor_of_estimates"]⟩,
  ⟨"ExpEst.Cor5.9", "[ExpEst] Cor 5.9 (generalised Fermat equation)", .stated,
    ["ExpEst.Thm5.4"], []⟩
]

theorem rows_length : rows.length = 19 := rfl

/-- The ids are distinct. -/
theorem rows_nodup : (rows.map (·.id)).Nodup := by decide +kernel

/-- Four results are proved outright, four modulo stated inputs, two are
replaced by Bertrand's postulate, nine are stated. -/
theorem status_counts :
    (rows.filter (·.status = .proved)).length = 4 ∧
    (rows.filter (·.status = .conditional)).length = 4 ∧
    (rows.filter (·.status = .substitute)).length = 2 ∧
    (rows.filter (·.status = .stated)).length = 9 := by decide +kernel

/-- Every dependency is a row of the table, except the single input from the
earlier stages, [IUTchIII] Cor 3.12. -/
theorem deps_are_rows :
    rows.all (fun r => r.dependsOn.all (fun d => d = cor312 || rows.any (·.id = d))) = true := by
  decide +kernel

/-- The dependencies respect the order of the table (so they are acyclic). -/
theorem deps_acyclic :
    (List.range rows.length).all (fun i =>
      (rows.getD i ⟨"", "", .stated, [], []⟩).dependsOn.all (fun d =>
        d = cor312 || (rows.take i).any (·.id = d))) = true := by
  decide +kernel

/-- The proved rows rest on nothing stated: their dependencies are proved rows. -/
theorem proved_rest_on_proved :
    (rows.filter (·.status = .proved)).all (fun r => r.dependsOn.all (fun d =>
      rows.any (fun r' => r'.id = d && r'.status = .proved))) = true := by
  decide +kernel

/-- **Stage 5 feeds back into the chain**: the only input of Stage 5 from the
earlier stages is [IUTchIII] Cor 3.12, the output of Stages 1–2 (whose
inequality `C_Θ ≥ −1` is `MultiradialRep.inequalityHolds`), and Stages 4, 3, 2
chain as before. -/
theorem stage_five_then_four :
    rows.all (fun r => r.dependsOn.all (fun d => d = cor312 || rows.any (·.id = d))) = true ∧
    StageThree.earlierResults.all (fun r => StageFour.rows.any (·.id = r.id)) = true ∧
    StageTwo.inputs.all (fun i => StageThree.steps.any (·.id = i.id)) = true :=
  ⟨deps_are_rows, StageFour.stage_four_then_three_then_two.1,
    StageFour.stage_four_then_three_then_two.2.1⟩

end StageFive

end IUT
