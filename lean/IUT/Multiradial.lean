/-
# Processions, tensor packets, indeterminacies and the multiradial representation

Port of `iut_procession_step`, `iut_indeterminacies`, `iut_multiradial_rep`,
`iut_multiradial_build`, `iut_C_theta` and `iut_leading_term`
(`src/iut.h`, `src/iut_core.c`, `src/iut_lattice.c`) to Lean.

References: [IUTchI] Prop. 6.9 (processions); [IUTchIII] §3, Thm 3.11,
Cor 3.12 (multiradial representation, log-volume estimate); [IUTchIV] Thm 1.10
(the constant `C_Θ`); [Alien] §3.7 (iv) (holomorphic hull); [ExpEst] §1.

Main results:

* `card_Ind1`: the indeterminacy **(Ind1)** on the `j`-th procession container
  `S^±_{j+1}` is the symmetric group on `j+1` letters, of order `(j+1)!`, and
  it acts on tensor packets (`instMulActionInd1TensorPacket`);
* `leadingTerm_eq`: the exact closed form
  `Σ_{j=1}^{l*} [(j+1) log d − (j²/2l) log q] = (l*(l*+3)/2) log d − (l*(l*+1)/12) log q`
  of the leading term of the log-volume of the multiradial representation;
* `thetaUpperBound_eq`: its procession-normalised version;
* `CTheta_ge_neg_one_iff`, `thetaA_nonneg_iff`: `C_Θ ≥ −1` is exactly the
  inequality `(1/6)(1 − 12/l²) log q ≤ (1 + 12 d_mod / l)(log d + log f) + 10 (e* l + η)`
  of [IUTchIV] Thm 1.10;
* `build_steps_length`, `build_multiradial`: the representation built from a
  lattice has `l* + 1` procession steps and carries all three indeterminacies.
-/
import IUT.LogThetaLattice
import Mathlib.Data.Fintype.Perm
import Mathlib.Algebra.BigOperators.Ring.Finset
import Mathlib.Algebra.BigOperators.Field
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Positivity

namespace IUT

/-! ### Processions and (Ind1) -/

/-- One step `S^±_{j+1} = {0, 1, …, j}` of the procession ([IUTchI] Prop 6.9;
[IUTchIII] §3), with the leading term of its log-volume ([Alien] §3.7 (iv))
and the shift `−(j²/2l) log q` contributed by the Θ-pilot. -/
structure ProcessionStep where
  j : ℕ
  /-- `j + 1` -/
  size : ℕ
  /-- `(j+1)!`: the number of possibilities for the element "`j`" (Ind1) -/
  perms : ℕ
  /-- `(j+1) · log d^K` -/
  logVolumeLeading : ℚ
  /-- `−(j²/2l) · log q` -/
  thetaShift : ℚ
  deriving Repr

/-- The `j`-th step for the data `d` (`iut_multiradial_build`). -/
def ProcessionStep.mk' (d : InitialThetaData) (logdK logq : ℚ) (j : ℕ) : ProcessionStep where
  j := j
  size := j + 1
  perms := (j + 1).factorial
  logVolumeLeading := (j + 1 : ℚ) * logdK
  thetaShift := -((j : ℚ) ^ 2 / (2 * d.l)) * logq

/-- **(Ind1)**: the indeterminacy on the `j`-th procession container is the
full symmetric group of `S^±_{j+1}` ([IUTchIII] Thm 3.11 (i)). -/
abbrev Ind1 (j : ℕ) := Equiv.Perm (Fin (j + 1))

/-- `|Ind1_j| = (j+1)!`. -/
theorem card_Ind1 (j : ℕ) : Fintype.card (Ind1 j) = (j + 1).factorial := by
  simp [Ind1, Fintype.card_perm]

/-- The `perms` field of a procession step is the order of (Ind1). -/
theorem ProcessionStep.perms_eq_card_Ind1 (d : InitialThetaData) (logdK logq : ℚ) (j : ℕ) :
    (ProcessionStep.mk' d logdK logq j).perms = Fintype.card (Ind1 j) := by
  rw [card_Ind1]; rfl

/-- A **tensor packet** of log-shells ([IUTchIII] Prop 3.2, Thm 3.11 (i)(a)):
one log-shell (per `v`, so a list) for each label of `S^±_{j+1}`. -/
def TensorPacket (j : ℕ) := Fin (j + 1) → List LogShell

/-- The tensor packet in which every label carries the same log-shells
(the packet `I_{v,0} ⊗ ⋯ ⊗ I_{v,j}` of a single column of the lattice). -/
def TensorPacket.ofShells (j : ℕ) (shells : List LogShell) : TensorPacket j := fun _ => shells

/-- (Ind1) acts on tensor packets by permuting the labels. -/
instance (j : ℕ) : MulAction (Ind1 j) (TensorPacket j) where
  smul σ P := P ∘ σ.symm
  one_smul _ := rfl
  mul_smul _ _ _ := rfl

theorem TensorPacket.smul_apply {j : ℕ} (σ : Ind1 j) (P : TensorPacket j) (i : Fin (j + 1)) :
    (σ • P) i = P (σ.symm i) := rfl

/-- A constant packet is fixed by (Ind1). -/
theorem TensorPacket.smul_ofShells {j : ℕ} (σ : Ind1 j) (shells : List LogShell) :
    σ • TensorPacket.ofShells j shells = TensorPacket.ofShells j shells := rfl

/-! ### The three indeterminacies -/

/-- `iut_indeterminacies`: the indeterminacies **(Ind1)**, **(Ind2)**, **(Ind3)**
of [IUTchIII] Thm 3.11. -/
structure Indeterminacies where
  /-- permutations / automorphisms of the procession (Ind1) -/
  ind1 : Bool
  /-- `Ism`-indeterminacies on `O×μ` (Kummer-detachment) (Ind2) -/
  ind2 : Bool
  /-- upper semi-compatibility of the log-Kummer correspondence (Ind3) -/
  ind3 : Bool
  deriving DecidableEq, Repr

namespace Indeterminacies

/-- All three indeterminacies. -/
def all : Indeterminacies := ⟨true, true, true⟩

/-- A representation is **multiradial** only up to all three indeterminacies
([IUTchIII] Thm 3.11; [Alien] §3.6). -/
def Multiradial (I : Indeterminacies) : Prop := I.ind1 = true ∧ I.ind2 = true ∧ I.ind3 = true

instance (I : Indeterminacies) : Decidable I.Multiradial := by unfold Multiradial; infer_instance

theorem all_multiradial : all.Multiradial := by decide

/-- Dropping any one of the indeterminacies destroys multiradiality. -/
theorem not_multiradial_of_not_ind3 (I : Indeterminacies) (h : I.ind3 = false) : ¬ I.Multiradial :=
  fun hm => by rw [hm.2.2] at h; cases h

end Indeterminacies

/-! ### Closed forms of the leading term -/

/-- `2 · Σ_{i<n} (i+2) = n (n+3)`: `Σ_{j=1}^{n} (j+1)`. -/
theorem two_mul_sum_range_add_two (n : ℕ) :
    2 * ∑ i ∈ Finset.range n, (i + 2) = n * (n + 3) := by
  induction n with
  | zero => simp
  | succ n ih =>
    rw [Finset.sum_range_succ, mul_add, ih]
    ring

/-- `6 · Σ_{i<n} (i+1)² = n (n+1) (2n+1)`: `Σ_{j=1}^{n} j²`. -/
theorem six_mul_sum_range_succ_sq (n : ℕ) :
    6 * ∑ i ∈ Finset.range n, (i + 1) ^ 2 = n * (n + 1) * (2 * n + 1) := by
  have := LPrime.six_mul_sum_sq n
  rw [Finset.sum_range_succ'] at this
  simpa using this

namespace InitialThetaData

variable (d : InitialThetaData)

/-- `Σ_{j=1}^{l*} [(j+1) log d^K − (j²/2l) log q]`: the leading term of the
log-volume of the multiradial representation, as the finite sum computed by
`iut_multiradial_build` ([Alien] §3.7 (iv)). -/
def leadingTerm (logdK logq : ℚ) : ℚ :=
  ∑ i ∈ Finset.range d.LStar, (((i : ℚ) + 2) * logdK - (((i : ℚ) + 1) ^ 2 / (2 * d.l)) * logq)

/-- **Closed form of the leading term**:
`Σ_{j=1}^{l*} [(j+1) log d − (j²/2l) log q] = (l*(l*+3)/2) log d − (l*(l*+1)/12) log q`.
(With `l* ≈ l/2` this is the familiar `(l²/48)(6 log d − log q)` of [Alien] §3.7.) -/
theorem leadingTerm_eq (hd : d.WellFormed) (logdK logq : ℚ) :
    d.leadingTerm logdK logq =
      (d.LStar * (d.LStar + 3) / 2) * logdK - (d.LStar * (d.LStar + 1) / 12) * logq := by
  have hl : (d.l : ℚ) = 2 * d.LStar + 1 := by exact_mod_cast (two_LStar_add_one d hd).symm
  have h1 : ∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 2) = d.LStar * (d.LStar + 3) / 2 := by
    have h' : ((2 * ∑ i ∈ Finset.range d.LStar, (i + 2) : ℕ) : ℚ) =
        ((d.LStar * (d.LStar + 3) : ℕ) : ℚ) := by rw [two_mul_sum_range_add_two]
    push_cast [Nat.cast_sum] at h'
    linarith
  have h2 : ∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 1) ^ 2 =
      (d.LStar : ℚ) * (d.LStar + 1) * (2 * d.LStar + 1) / 6 := by
    have h' : ((6 * ∑ i ∈ Finset.range d.LStar, (i + 1) ^ 2 : ℕ) : ℚ) =
        ((d.LStar * (d.LStar + 1) * (2 * d.LStar + 1) : ℕ) : ℚ) := by
      rw [six_mul_sum_range_succ_sq]
    push_cast [Nat.cast_sum] at h'
    linarith
  rw [leadingTerm, Finset.sum_sub_distrib, ← Finset.sum_mul, ← Finset.sum_mul, ← Finset.sum_div,
    h1, h2, hl]
  have hpos : (2 * (2 * (d.LStar : ℚ) + 1)) ≠ 0 := by positivity
  field_simp
  ring

/-- The procession-normalised leading term `(1/l*) Σ_{j=1}^{l*} […]`, the
heuristic upper bound for `−|log(Θ)|` of `iut_multiradial_build`. -/
def thetaUpperBound (logdK logq : ℚ) : ℚ := d.leadingTerm logdK logq / d.LStar

theorem thetaUpperBound_eq (hd : d.WellFormed) (logdK logq : ℚ) :
    d.thetaUpperBound logdK logq = ((d.LStar + 3) / 2) * logdK - ((d.LStar + 1) / 12) * logq := by
  have hpos : (d.LStar : ℚ) ≠ 0 := by
    have := two_le_LStar d hd
    positivity
  rw [thetaUpperBound, leadingTerm_eq d hd, div_eq_iff hpos]
  ring

/-- The **holomorphic hull** enlargement `(1/l*) Σ_{j=1}^{l*} (j+1) log d^K`
([Alien] §3.7 (iv)). -/
def hullEnlargement (logdK : ℚ) : ℚ :=
  (∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 2) * logdK) / d.LStar

theorem hullEnlargement_eq (hd : d.WellFormed) (logdK : ℚ) :
    d.hullEnlargement logdK = ((d.LStar + 3) / 2) * logdK := by
  have hpos : (d.LStar : ℚ) ≠ 0 := by
    have := two_le_LStar d hd
    positivity
  have h1 : ∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 2) = d.LStar * (d.LStar + 3) / 2 := by
    have h' : ((2 * ∑ i ∈ Finset.range d.LStar, (i + 2) : ℕ) : ℚ) =
        ((d.LStar * (d.LStar + 3) : ℕ) : ℚ) := by rw [two_mul_sum_range_add_two]
    push_cast [Nat.cast_sum] at h'
    linarith
  rw [hullEnlargement, ← Finset.sum_mul, h1, div_eq_iff hpos]
  ring

end InitialThetaData

/-! ### The constant `C_Θ` of [IUTchIV] Thm 1.10 -/

/-- `η_prm = 5·10^20` ([ExpEst] §1). -/
def etaPrm : ℚ := 5 * 10 ^ 20

/-- `e*_mod = 2^12 · 3^3 · 5 · e_mod` (`estar_mod` in `iut_core.c`). -/
def eStarMod (eMod : ℕ) : ℚ := 4096 * 27 * 5 * (if eMod = 0 then 1 else eMod)

/-- The bracket `A` of [IUTchIV] Thm 1.10:
`(1 + 12 d_mod / l)(log d + log f) + 10 (e* l + η) − (1/6)(1 − 12/l²) log q`. -/
def thetaA (l dmod : ℕ) (logd logf logq eStar eta : ℚ) : ℚ :=
  (1 + 12 * dmod / l) * (logd + logf) + 10 * (eStar * l + eta) - (1 / 6) * (1 - 12 / (l ^ 2 : ℚ)) * logq

/-- `C_Θ = ((l+1) / (4 |log q|)) · A − 1` with `|log q| = log q / 2l`
(`iut_C_theta`; [IUTchIV] Thm 1.10). -/
def CTheta (l dmod : ℕ) (logd logf logq eStar eta : ℚ) : ℚ :=
  (l + 1) / (4 * (logq / (2 * l))) * thetaA l dmod logd logf logq eStar eta - 1

/-- **`C_Θ ≥ −1` iff `A ≥ 0`** (for `l > 0` and `log q > 0`): the log-volume
inequality `−|log(Θ)| ≥ −|log(q)|` of [IUTchIII] Cor 3.12 is, in the
normalisation of [IUTchIV] Thm 1.10, exactly the non-negativity of `A`. -/
theorem CTheta_ge_neg_one_iff (l dmod : ℕ) (hl : 0 < l) (logd logf logq eStar eta : ℚ)
    (hq : 0 < logq) :
    -1 ≤ CTheta l dmod logd logf logq eStar eta ↔ 0 ≤ thetaA l dmod logd logf logq eStar eta := by
  unfold CTheta
  have hc : 0 < (l + 1 : ℚ) / (4 * (logq / (2 * l))) := by
    have : (0 : ℚ) < l := by exact_mod_cast hl
    positivity
  constructor
  · intro h
    have h' : 0 ≤ (l + 1 : ℚ) / (4 * (logq / (2 * l))) * thetaA l dmod logd logf logq eStar eta := by
      linarith
    exact (mul_nonneg_iff_of_pos_left hc).mp h'
  · intro h
    have := mul_nonneg hc.le h
    linarith

/-- `A ≥ 0` unfolds to the inequality of [IUTchIV] Thm 1.10 (and hence to the
effective abc-type bound of [IUTchIV] Cor 2.2):
`(1/6)(1 − 12/l²) log q ≤ (1 + 12 d_mod / l)(log d + log f) + 10 (e* l + η)`. -/
theorem thetaA_nonneg_iff (l dmod : ℕ) (logd logf logq eStar eta : ℚ) :
    0 ≤ thetaA l dmod logd logf logq eStar eta ↔
      (1 / 6) * (1 - 12 / (l ^ 2 : ℚ)) * logq ≤
        (1 + 12 * dmod / l) * (logd + logf) + 10 * (eStar * l + eta) := by
  unfold thetaA
  constructor <;> intro h <;> linarith

/-! ### The multiradial representation `R^LGP_{n,◦}` -/

/-- `iut_multiradial_rep`: the multiradial representation of the Θ-pilot of the
column `(n, ◦)` ([IUTchIII] Thm 3.11 (i)): the procession steps (tensor
packets of log-shells, indexed by `S^±_{j+1}`, `j = 0..l*`), the
indeterminacies, and the log-volume bookkeeping of [IUTchIII] Cor 3.12. -/
structure MultiradialRep where
  n : ℤ
  steps : List ProcessionStep
  ind : Indeterminacies
  /-- `log(q)` -/
  logq : ℚ
  /-- `|log(q)| = log(q) / 2l` -/
  absLogQ : ℚ
  /-- the procession-normalised leading term (a heuristic upper bound for `−|log Θ|`) -/
  thetaUpperBound : ℚ
  /-- the exact finite sum of the leading terms -/
  leadingTerm : ℚ
  /-- `C_Θ` of [IUTchIV] Thm 1.10 -/
  CTheta : ℚ
  /-- the enlargement by the holomorphic hull -/
  hullEnlargement : ℚ
  deriving Repr

namespace MultiradialRep

/-- `inequality_holds`: `−|log Θ| ≥ −|log q|` in the leading-term version, and
`C_Θ ≥ −1`. -/
def inequalityHolds (R : MultiradialRep) : Prop := -R.absLogQ ≤ R.thetaUpperBound ∧ -1 ≤ R.CTheta

instance (R : MultiradialRep) : Decidable R.inequalityHolds := by
  unfold inequalityHolds; infer_instance

/-- The largest `e_mod` among the non-archimedean places (`iut_C_theta`). -/
def eModMax (d : InitialThetaData) : ℕ :=
  d.VNon.foldl (fun acc v => max acc v.eMod) 1

/-- `iut_multiradial_build`: the multiradial representation of column `n` of a
lattice, for a "formal logarithm" `log : ℕ → ℚ` and the value `log d^K` of the
log-different. -/
def build (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) : MultiradialRep :=
  let d := lat.data
  let logq := d.logQ log
  { n := n
    steps := (List.range (d.LStar + 1)).map (ProcessionStep.mk' d logdK logq)
    ind := Indeterminacies.all
    logq := logq
    absLogQ := d.absLogQ log
    thetaUpperBound := d.thetaUpperBound logdK logq
    leadingTerm := d.leadingTerm logdK logq
    CTheta := IUT.CTheta d.l d.dmod (logdK - d.logF log - 2 * log d.l) (d.logF log) logq (eStarMod (eModMax d)) etaPrm
    hullEnlargement := d.hullEnlargement logdK }

/-- The representation has `l* + 1` procession steps `S^±_1, …, S^±_{l*+1}`. -/
theorem build_steps_length (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) :
    (build lat n log logdK).steps.length = lat.data.LStar + 1 := by
  simp [build]

/-- The `j`-th step is `S^±_{j+1}`, of size `j+1`, with `(j+1)!` possibilities (Ind1). -/
theorem build_steps_getElem (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) (j : ℕ)
    (hj : j < lat.data.LStar + 1) :
    (build lat n log logdK).steps[j]'(by rw [build_steps_length]; exact hj) =
      ProcessionStep.mk' lat.data logdK (lat.data.logQ log) j := by
  simp [build]

/-- The representation carries all three indeterminacies, hence is multiradial. -/
theorem build_multiradial (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) :
    (build lat n log logdK).ind.Multiradial := Indeterminacies.all_multiradial

/-- The leading term of the built representation is the closed form. -/
theorem build_leadingTerm (lat : LogThetaLattice) (hd : lat.data.WellFormed) (n : ℤ) (log : ℕ → ℚ)
    (logdK : ℚ) :
    (build lat n log logdK).leadingTerm =
      (lat.data.LStar * (lat.data.LStar + 3) / 2) * logdK -
        (lat.data.LStar * (lat.data.LStar + 1) / 12) * lat.data.logQ log :=
  InitialThetaData.leadingTerm_eq lat.data hd logdK _

/-- `|log q| = log q / 2l` for the built representation. -/
theorem build_absLogQ (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) :
    (build lat n log logdK).absLogQ = (build lat n log logdK).logq / (2 * lat.data.l) := rfl

end MultiradialRep

end IUT
