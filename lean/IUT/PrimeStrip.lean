import IUT.Identifiers
import IUT.InitialThetaData
import Mathlib.Tactic.DeriveFintype

/-!
# Prime-strips — [IUTchI] Fig I1.2, Def 4.1, Def 5.2; [IUTchII] Def 4.9

A prime-strip is a collection of local data indexed by `v ∈ V`.  The nine
kinds of [IUTchI] Fig I1.2 / [IUTchII] Def 4.9 are the constructors of
`PrimeStripKind`; their names are the identifiers of `docs/IDENTIFIERS.md`:

| kind | data at `v` | nature |
|---|---|---|
| `DPrimeStrip` (`D`) | `Π_v` | étale-like, holomorphic |
| `DMonoPrimeStrip` (`D⊢`) | `G_v` | étale-like, mono-analytic (bi-coric) |
| `FPrimeStrip` (`F`) | `Π_v ↷ O▷` | Frobenius-like, holomorphic |
| `FMonoPrimeStrip` (`F⊢`) | `G_v ↷ O▷` split | Frobenius-like, mono-analytic |
| `FMonoUnitsPrimeStrip` (`F⊢×`) | `G_v ↷ O×` | |
| `FMonoUnitsModTorsPrimeStrip` (`F⊢×μ`) | `G_v ↷ O×μ` + `×μ`-Kummer | horizontally coric |
| `FMonoValUnitsModTorsPrimeStrip` (`F⊢▶×μ`) | `G_v ↷ O▶ × O×μ` | |
| `FMonoGlobPrimeStrip` (`F⊩`) | `F⊢` + global realified Frobenioid `C⊩` | |
| `FMonoGlobValUnitsModTorsPrimeStrip` (`F⊩▶×μ`) | `F⊢▶×μ` + `C⊩`; carries the pilots | |

Each local datum records *copy ids* (`CopyId`) for `Π_v`, `G_v` and the monoid
`O`, so that "shared" versus "distinct copy" is a literal equality of ids; the
valuations of the value-group generators are measured in units of
`ord_v(q̲_v)`, `q̲_v = q_v^{1/2l}`, so that `q_v` has value `2l` and `q̲_v^{j²}`
has value `j²` ([IUTchI] Ex 3.2).

`PrimeStrip.WellFormed` is the Lean version of the C validator
`iut_validate_prime_strip`.  The two things proved here that the C program only
tests are: the constructor `PrimeStrip.build` always produces a well-formed
strip (`build_wellFormed`), and the forgetful mutations
`F ⊃ F⊢ ⊃ F⊢× ⊃ F⊢×μ`, `F ⊃ D ⊃ D⊢`, `F⊩ ⊃ F⊢`, `F⊩▶×μ ⊃ F⊢▶×μ ⊃ F⊢×μ`, …
preserve well-formedness (`forget_wellFormed`).  Coricity ([IUTchIII] Thm 1.5)
is recorded as predicates on kinds, and *bi-coric = vertically coric and
horizontally coric* is a theorem (`biCoric_iff`).
-/

namespace IUT

/-- The nine kinds of prime-strip ([IUTchI] Fig I1.2; [IUTchII] Def 4.9). -/
inductive PrimeStripKind where
  | DPrimeStrip
  | DMonoPrimeStrip
  | FPrimeStrip
  | FMonoPrimeStrip
  | FMonoUnitsPrimeStrip
  | FMonoUnitsModTorsPrimeStrip
  | FMonoValUnitsModTorsPrimeStrip
  | FMonoGlobPrimeStrip
  | FMonoGlobValUnitsModTorsPrimeStrip
  deriving DecidableEq, Repr

namespace PrimeStripKind

/-- The list of all nine kinds. -/
def all : List PrimeStripKind :=
  [DPrimeStrip, DMonoPrimeStrip, FPrimeStrip, FMonoPrimeStrip, FMonoUnitsPrimeStrip,
    FMonoUnitsModTorsPrimeStrip, FMonoValUnitsModTorsPrimeStrip, FMonoGlobPrimeStrip,
    FMonoGlobValUnitsModTorsPrimeStrip]

instance : Fintype PrimeStripKind where
  elems := ⟨↑all, by decide⟩
  complete := by intro k; cases k <;> decide

/-- The letters-only identifier of the kind. -/
def ident : PrimeStripKind → String
  | DPrimeStrip => "DPrimeStrip"
  | DMonoPrimeStrip => "DMonoPrimeStrip"
  | FPrimeStrip => "FPrimeStrip"
  | FMonoPrimeStrip => "FMonoPrimeStrip"
  | FMonoUnitsPrimeStrip => "FMonoUnitsPrimeStrip"
  | FMonoUnitsModTorsPrimeStrip => "FMonoUnitsModTorsPrimeStrip"
  | FMonoValUnitsModTorsPrimeStrip => "FMonoValUnitsModTorsPrimeStrip"
  | FMonoGlobPrimeStrip => "FMonoGlobPrimeStrip"
  | FMonoGlobValUnitsModTorsPrimeStrip => "FMonoGlobValUnitsModTorsPrimeStrip"

/-- The notation of the kind as printed in the papers. -/
def printed : PrimeStripKind → String
  | DPrimeStrip => "D"
  | DMonoPrimeStrip => "D⊢"
  | FPrimeStrip => "F"
  | FMonoPrimeStrip => "F⊢"
  | FMonoUnitsPrimeStrip => "F⊢×"
  | FMonoUnitsModTorsPrimeStrip => "F⊢×μ"
  | FMonoValUnitsModTorsPrimeStrip => "F⊢▶×μ"
  | FMonoGlobPrimeStrip => "F⊩"
  | FMonoGlobValUnitsModTorsPrimeStrip => "F⊩▶×μ"

/-- Étale-like: `D`, `D⊢` (no Frobenius-like monoid). -/
def isEtaleLike : PrimeStripKind → Bool
  | DPrimeStrip | DMonoPrimeStrip => true
  | _ => false

/-- Mono-analytic: carries `⊢` or `⊩` (has forgotten `Π_v`, remembers only `G_v`). -/
def isMonoAnalytic : PrimeStripKind → Bool
  | DPrimeStrip | FPrimeStrip => false
  | _ => true

/-- Carries a global realified Frobenioid `C⊩` (`⊩`). -/
def hasGlobal : PrimeStripKind → Bool
  | FMonoGlobPrimeStrip | FMonoGlobValUnitsModTorsPrimeStrip => true
  | _ => false

/-- The Frobenius-like monoid is `O×μ` (rather than `O×` or `O▷`). -/
def isUnitsModTors : PrimeStripKind → Bool
  | FMonoUnitsModTorsPrimeStrip | FMonoValUnitsModTorsPrimeStrip
  | FMonoGlobValUnitsModTorsPrimeStrip => true
  | _ => false

/-- Carries a value-group portion `O▶` (every Frobenius-like kind except the
pure unit kinds `F⊢×`, `F⊢×μ`). -/
def hasValgroup : PrimeStripKind → Bool
  | FPrimeStrip | FMonoPrimeStrip | FMonoValUnitsModTorsPrimeStrip
  | FMonoGlobPrimeStrip | FMonoGlobValUnitsModTorsPrimeStrip => true
  | _ => false

/-- Split Frobenioid `O▷ = O× × O▶` ([IUTchI] Def 5.2 (ii)). -/
def hasSplitting : PrimeStripKind → Bool
  | FMonoPrimeStrip | FMonoGlobPrimeStrip | FMonoValUnitsModTorsPrimeStrip
  | FMonoGlobValUnitsModTorsPrimeStrip => true
  | _ => false

theorem card : Fintype.card PrimeStripKind = 9 := by decide

/-- `⊩` implies `⊢`. -/
theorem mono_of_hasGlobal : ∀ k : PrimeStripKind, k.hasGlobal = true → k.isMonoAnalytic = true := by
  decide

/-- Étale-like strips carry no global realified Frobenioid. -/
theorem not_hasGlobal_of_etale : ∀ k : PrimeStripKind, k.isEtaleLike = true → k.hasGlobal = false := by
  decide

/-- Étale-like strips carry no value-group portion. -/
theorem not_hasValgroup_of_etale :
    ∀ k : PrimeStripKind, k.isEtaleLike = true → k.hasValgroup = false := by
  decide

/-- The identifiers of the nine kinds are pairwise distinct. -/
theorem ident_injective : Function.Injective ident := by
  intro a b h
  cases a <;> cases b <;> first | rfl | (simp [ident] at h)

/-- Every kind identifier is in the identifier table. -/
theorem ident_mem_identifiers : ∀ k : PrimeStripKind, (findIdent k.ident).isSome = true := by
  decide +kernel

/-! ### Coricity ([IUTchIII] Thm 1.5) -/

/-- Vertically coric (invariant under log-links): the étale-like kinds
([IUTchIII] Thm 1.5 (i)). -/
def verticallyCoric (k : PrimeStripKind) : Bool := k.isEtaleLike

/-- Horizontally coric (invariant under Θ×μ-links): `F⊢×μ` and `D⊢`
([IUTchIII] Thm 1.5 (ii)). -/
def horizontallyCoric : PrimeStripKind → Bool
  | FMonoUnitsModTorsPrimeStrip | DMonoPrimeStrip => true
  | _ => false

/-- Bi-coric: `D⊢` ([IUTchIII] Thm 1.5 (iii)). -/
def biCoric : PrimeStripKind → Bool
  | DMonoPrimeStrip => true
  | _ => false

/-- **Bi-coric = vertically coric and horizontally coric** — the content of
[IUTchIII] Thm 1.5 (iii) at the level of kinds: the only kind of prime-strip
that survives both the log-link and the Θ×μ-link is `D⊢`. -/
theorem biCoric_iff : ∀ k : PrimeStripKind,
    k.biCoric = (k.verticallyCoric && k.horizontallyCoric) := by
  decide

/-- The horizontally coric Frobenius-like strip is `F⊢×μ`, the "basic
prime-strip" of [FormIUT] §1. -/
theorem horizontallyCoric_frobenius : ∀ k : PrimeStripKind,
    k.horizontallyCoric = true → k.isEtaleLike = false → k = FMonoUnitsModTorsPrimeStrip := by
  decide

end PrimeStripKind

/-- Which component of a local datum a copy id refers to. -/
inductive CopyPart where
  | Pi
  | G
  | units
  deriving DecidableEq, Repr

/-- A *copy id*: which universe (lattice vertex, [IUTchIV] §3), which strip
inside the Hodge theater and which place `v` a copy of `Π_v`, `G_v` or `O` was
created for.  Two copies are *the same copy* iff their ids are equal; this is
how "shared across a link" (coric) versus "a fresh alien copy" is made literal. -/
structure CopyId where
  univ : ℕ
  strip : ℕ
  place : ℕ
  part : CopyPart
  deriving DecidableEq, Repr

/-- The Kummer structure on the units ([IUTchII] Def 4.9 (i)): none, the
unique `×`-Kummer structure on `O×`, or the `Ism`-orbit `×μ`-Kummer structure
on `O×μ`. -/
inductive KummerKind where
  | none
  | units
  | unitsModTors
  deriving DecidableEq, Repr

/-- The local datum of a prime-strip at a place `v`.  Mirrors
`iut_local_datum` of `src/iut.h` one to one. -/
structure LocalDatum where
  /-- copy of `Π_v` (absent for mono-analytic strips) -/
  Pi : Option CopyId
  /-- copy of `G_v` (always present: `G_v` is bi-coric) -/
  G : CopyId
  /-- copy of the Frobenius-like monoid `O×` / `O×μ` (absent for étale-like strips) -/
  units : Option CopyId
  /-- the monoid is `O×μ` rather than `O×` -/
  unitsModTors : Bool
  /-- the value-group portion `O▶` is present -/
  hasValgroup : Bool
  /-- the splitting `O▷ = O× × O▶` is present -/
  hasSplitting : Bool
  /-- valuations of the generators of the value-group monoid, in `q̲`-units -/
  val : List ℚ
  /-- Kummer structure on the units -/
  kummer : KummerKind
  deriving DecidableEq, Repr

namespace LocalDatum

/-- The conditions checked by `iut_validate_prime_strip` on one local datum of
a strip of kind `k`: a holomorphic strip needs `Π_v`, a mono-analytic strip must
not remember `Π_v`, an étale-like strip carries no monoid and a Frobenius-like
one needs one; the value-group portion `O▶` is present exactly for the kinds
that carry one; the monoid is `O×μ` exactly for the `×μ` kinds; `F⊢×μ` carries
its `×μ`-Kummer structure (`Ism`-orbit); the split kinds `F⊢`, `F⊩`, `▶×μ`
are split; the value-group generators have positive valuation.  (This is the
check of `iut_validate_prime_strip`, slightly strengthened so that it is
*preserved* by every forgetful mutation, `forget_wellFormed`.) -/
def checks (k : PrimeStripKind) (L : LocalDatum) : List Bool :=
  [ k.isMonoAnalytic || L.Pi.isSome,
    !k.isMonoAnalytic || L.Pi.isNone,
    !k.isEtaleLike || L.units.isNone,
    k.isEtaleLike || L.units.isSome,
    L.hasValgroup == k.hasValgroup,
    k.isEtaleLike || L.unitsModTors == k.isUnitsModTors,
    k != .FMonoUnitsModTorsPrimeStrip || L.kummer == .unitsModTors,
    !k.hasSplitting || L.hasSplitting,
    L.val.all fun x => decide (0 < x) ]

/-- All the conditions of `checks` hold. -/
def check (k : PrimeStripKind) (L : LocalDatum) : Bool := (checks k L).all id

/-- The local datum created by `iut_prime_strip_build` at place `i` for the
valuation `v`, with fresh copies in the given universe and strip. -/
def build (k : PrimeStripKind) (u strip i : ℕ) (v : Valuation) (exps : List ℕ) :
    LocalDatum where
  Pi := if k.isMonoAnalytic then none else some ⟨u, strip, i, .Pi⟩
  G := ⟨u, strip, i, .G⟩
  units := if k.isEtaleLike then none else some ⟨u, strip, i, .units⟩
  unitsModTors := k.isUnitsModTors
  hasValgroup := k.hasValgroup
  hasSplitting := k.hasSplitting
  val :=
    if k.hasValgroup && decide v.inVBad then
      (if exps.isEmpty then [1] else exps.map (Nat.cast : ℕ → ℚ))
    else []
  kummer :=
    if k.isUnitsModTors then .unitsModTors
    else if k == .FPrimeStrip || k == .FMonoUnitsPrimeStrip then .units
    else .none

/-- The forgetful mutation at one place: forget everything the kind `to` does
not carry (`iut_prime_strip_forget`). -/
def forget (tgt : PrimeStripKind) (L : LocalDatum) : LocalDatum :=
  let L₁ := if tgt.isMonoAnalytic then { L with Pi := none } else L
  if tgt.isEtaleLike then
    { L₁ with units := none, unitsModTors := false, hasValgroup := false, hasSplitting := false,
              val := [], kummer := .none }
  else
    match tgt with
    | .FMonoUnitsPrimeStrip =>
      { L₁ with unitsModTors := false, hasValgroup := false, val := [], hasSplitting := false,
                kummer := .units }
    | .FMonoUnitsModTorsPrimeStrip =>
      { L₁ with unitsModTors := true, hasValgroup := false, val := [], hasSplitting := false,
                kummer := .unitsModTors }
    | .FMonoValUnitsModTorsPrimeStrip | .FMonoGlobValUnitsModTorsPrimeStrip =>
      { L₁ with unitsModTors := true, hasSplitting := true, kummer := .unitsModTors }
    | .FMonoPrimeStrip | .FMonoGlobPrimeStrip => { L₁ with hasSplitting := true }
    | _ => L₁

theorem build_check (k : PrimeStripKind) (u s i : ℕ) (v : Valuation) (exps : List ℕ)
    (hexps : ∀ e ∈ exps, 0 < e) : (build k u s i v exps).check k = true := by
  have hval : ((build k u s i v exps).val.all fun x => decide (0 < x)) = true := by
    simp only [build]
    split_ifs with h1 h2
    · simp
    · rw [List.all_eq_true]
      intro x hx
      rw [List.mem_map] at hx
      obtain ⟨e, he, rfl⟩ := hx
      have := hexps e he
      simp only [decide_eq_true_eq]
      exact_mod_cast this
    · simp
  unfold check checks
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id]
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, hval⟩ <;>
  cases k <;> simp [build, PrimeStripKind.isMonoAnalytic, PrimeStripKind.isEtaleLike,
    PrimeStripKind.isUnitsModTors, PrimeStripKind.hasValgroup, PrimeStripKind.hasSplitting]

end LocalDatum

/-- A prime-strip: a kind, a label (`"BoxPlus"`, `"Gt"`, `"Triangle"`, `"t=-3"`,
…), one local datum per `v ∈ V`, and, for the `⊩` kinds, the global realified
Frobenioid `C⊩` with the arithmetic degree of its pilot object measured in units
of `log(q)` (so `q̲_v` has degree `−1/2l`). -/
structure PrimeStrip where
  kind : PrimeStripKind
  label : String
  loc : List LocalDatum
  /-- the global realified Frobenioid `C⊩` with `Prime(C⊩) → V` is present -/
  hasGlobalRealified : Bool
  /-- arithmetic degree of the pilot object, in units of `log(q)` (`≤ 0`) -/
  globalDegreeInLogQ : ℚ
  deriving Repr

namespace PrimeStrip

variable (d : InitialThetaData)

/-- `iut_validate_prime_strip`: indexed by `V`, every local datum well-formed
for the kind, `C⊩` present exactly for the `⊩` kinds, and the pilot degree
non-positive. -/
def check (ps : PrimeStrip) : Bool :=
  (ps.loc.length == d.V.length) &&
  ps.loc.all (LocalDatum.check ps.kind) &&
  (ps.kind.hasGlobal == ps.hasGlobalRealified) &&
  (!ps.hasGlobalRealified || decide (ps.globalDegreeInLogQ ≤ 0))

/-- A well-formed prime-strip over the initial Θ-data `d`. -/
def WellFormed (ps : PrimeStrip) : Prop := ps.check d = true

instance (ps : PrimeStrip) : Decidable (ps.WellFormed d) := by unfold WellFormed; infer_instance

/-- The average of a list of exponents (`1` for the empty list, which stands
for the single generator `q̲_v`). -/
def averageExp (exps : List ℕ) : ℚ :=
  if exps.isEmpty then 1 else (exps.map (Nat.cast : ℕ → ℚ)).sum / exps.length

theorem averageExp_nonneg (exps : List ℕ) : 0 ≤ averageExp exps := by
  unfold averageExp
  split_ifs
  · norm_num
  · apply div_nonneg
    · apply List.sum_nonneg
      intro x hx
      rw [List.mem_map] at hx
      obtain ⟨e, _, rfl⟩ := hx
      exact Nat.cast_nonneg e
    · exact Nat.cast_nonneg _

/-- `iut_prime_strip_build`: a prime-strip of kind `k` over `d`, with fresh
copies of `Π_v`, `G_v`, `O` in the given universe and strip, and the
value-group generators `q̲_v^{e}` for `e ∈ exps` (or just `q̲_v` if `exps = []`)
at the places of bad reduction.  The degree of the pilot object is
`−(average exponent)/2l` in units of `log(q)` ([IUTchIII] Def 3.8). -/
def build (k : PrimeStripKind) (label : String) (u strip : ℕ) (exps : List ℕ) :
    PrimeStrip where
  kind := k
  label := label
  loc := d.V.mapIdx fun i v => LocalDatum.build k u strip i v exps
  hasGlobalRealified := k.hasGlobal
  globalDegreeInLogQ := if k.hasGlobal then -(averageExp exps) / (2 * d.l) else 0

/-- **Every strip produced by `build` is well-formed** (for positive exponents). -/
theorem build_wellFormed (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ)
    (hexps : ∀ e ∈ exps, 0 < e) : (build d k label u s exps).WellFormed d := by
  unfold WellFormed check
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true]
  refine ⟨⟨⟨?_, ?_⟩, ?_⟩, ?_⟩
  · simp [build]
  · intro L hL
    simp only [build, List.mem_mapIdx] at hL
    obtain ⟨i, hi, rfl⟩ := hL
    exact LocalDatum.build_check k u s i _ exps hexps
  · simp [build]
  · by_cases hg : k.hasGlobal
    · simp only [build, hg, ite_true, Bool.not_true, Bool.false_or, decide_eq_true_eq]
      apply div_nonpos_of_nonpos_of_nonneg
      · linarith [averageExp_nonneg exps]
      · positivity
    · simp [build, hg]

/-- The number of places of a built strip is `|V|`. -/
@[simp] theorem build_loc_length (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ) :
    (build d k label u s exps).loc.length = d.V.length := by
  simp [build]

@[simp] theorem build_kind (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ) :
    (build d k label u s exps).kind = k := rfl

/-- The local datum of a built strip at place `i`. -/
theorem build_loc_getElem (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ)
    (i : ℕ) (hi : i < d.V.length) :
    (build d k label u s exps).loc[i]'(by rw [build_loc_length]; exact hi) =
      LocalDatum.build k u s i (d.V[i]'hi) exps := by
  simp [build]

/-- The copy of `G_v` in a built strip records its universe. -/
theorem build_G (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ)
    (i : ℕ) (hi : i < d.V.length) :
    ((build d k label u s exps).loc[i]'(by rw [build_loc_length]; exact hi)).G = ⟨u, s, i, .G⟩ := by
  rw [build_loc_getElem d k label u s exps i hi]
  rfl

/-- The copy of `Π_v` in a built holomorphic strip records its universe. -/
theorem build_Pi (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ)
    (i : ℕ) (hi : i < d.V.length) :
    ((build d k label u s exps).loc[i]'(by rw [build_loc_length]; exact hi)).Pi =
      if k.isMonoAnalytic then none else some ⟨u, s, i, .Pi⟩ := by
  rw [build_loc_getElem d k label u s exps i hi]
  rfl

/-- The copy of the monoid in a built Frobenius-like strip records its universe. -/
theorem build_units (k : PrimeStripKind) (label : String) (u s : ℕ) (exps : List ℕ)
    (i : ℕ) (hi : i < d.V.length) :
    ((build d k label u s exps).loc[i]'(by rw [build_loc_length]; exact hi)).units =
      if k.isEtaleLike then none else some ⟨u, s, i, .units⟩ := by
  rw [build_loc_getElem d k label u s exps i hi]
  rfl

/-! ### The forgetful mutations between kinds -/

/-- `from ⊃ tgt`: the kind `tgt` can be obtained from the kind `from` by
forgetting structure.  (One cannot *add* `Π_v`, a monoid, `O▶` or `C⊩`, nor
recover the torsion `Oμ` once the units have been replaced by `O×μ`.) -/
def Forgettable (from_ tgt : PrimeStripKind) : Bool :=
  (tgt.isMonoAnalytic || !from_.isMonoAnalytic) &&
  (tgt.isEtaleLike || !from_.isEtaleLike) &&
  (!tgt.hasGlobal || from_.hasGlobal) &&
  (!tgt.hasValgroup || from_.hasValgroup) &&
  (!from_.isUnitsModTors || tgt.isUnitsModTors || tgt.isEtaleLike)

/-- `iut_prime_strip_forget`: forget structure, keeping the shared copies. -/
def forget (ps : PrimeStrip) (tgt : PrimeStripKind) : PrimeStrip where
  kind := tgt
  label := ps.label
  loc := ps.loc.map (LocalDatum.forget tgt)
  hasGlobalRealified := if tgt.hasGlobal then ps.hasGlobalRealified else false
  globalDegreeInLogQ := if tgt.hasGlobal then ps.globalDegreeInLogQ else 0

/-- The forgetful mutation preserves the well-formedness of each local datum. -/
theorem LocalDatum.forget_check (from_ tgt : PrimeStripKind) (L : LocalDatum)
    (hf : Forgettable from_ tgt = true) (h : L.check from_ = true) :
    (L.forget tgt).check tgt = true := by
  cases from_ <;> cases tgt <;> simp_all [Forgettable, LocalDatum.check, LocalDatum.checks,
    LocalDatum.forget,
    PrimeStripKind.isMonoAnalytic, PrimeStripKind.isEtaleLike, PrimeStripKind.hasGlobal,
    PrimeStripKind.hasValgroup, PrimeStripKind.hasSplitting, PrimeStripKind.isUnitsModTors]

/-- **The forgetful mutations preserve well-formedness**: if `ps` is a
well-formed strip of kind `from` and `from ⊃ to`, then forgetting down tgt `to`
gives a well-formed strip of kind `to`.  This covers the mutations
`ForgetToDMono` (`F ↦ D⊢`), `ForgetToUnitsModTors` (`F⊩ ↦ F⊢×μ`), … of
[IUTchIV] §3 as implemented in the toolkit. -/
theorem forget_wellFormed (ps : PrimeStrip) (tgt : PrimeStripKind)
    (hf : Forgettable ps.kind tgt = true) (h : ps.WellFormed d) : (ps.forget tgt).WellFormed d := by
  unfold WellFormed check at h ⊢
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true] at h
  obtain ⟨⟨⟨hlen, hloc⟩, hglob⟩, hdeg⟩ := h
  simp only [forget, List.length_map, List.all_eq_true, List.mem_map, Bool.and_eq_true,
    beq_iff_eq]
  refine ⟨⟨⟨hlen, ?_⟩, ?_⟩, ?_⟩
  · rintro _ ⟨L, hL, rfl⟩
    exact LocalDatum.forget_check ps.kind tgt L hf (hloc L hL)
  · by_cases hg : tgt.hasGlobal
    · simp only [hg, ite_true]
      have h1 : ps.kind.hasGlobal = true := by
        simp only [Forgettable, Bool.and_eq_true, Bool.or_eq_true, Bool.not_eq_true', hg] at hf
        simpa using hf.1.1.2
      rw [← hglob, h1]
    · simp [hg]
  · by_cases hg : tgt.hasGlobal
    · simpa [hg] using hdeg
    · simp [hg]

/-- `F ↦ D⊢` (`ForgetToDMono`), the mutation that is a *core* ([IUTchIV]
Def 3.3 (v)): the `D⊢`-prime-strip is bi-coric. -/
theorem forgetToDMono_wellFormed (ps : PrimeStrip) (hk : ps.kind = .FPrimeStrip)
    (h : ps.WellFormed d) : (ps.forget .DMonoPrimeStrip).WellFormed d :=
  forget_wellFormed d ps _ (by rw [hk]; rfl) h

/-- `F⊩ ↦ F⊢×μ` (`ForgetToUnitsModTors`), [IUTchII] Def 4.9. -/
theorem forgetToUnitsModTors_wellFormed (ps : PrimeStrip) (hk : ps.kind = .FMonoGlobPrimeStrip)
    (h : ps.WellFormed d) : (ps.forget .FMonoUnitsModTorsPrimeStrip).WellFormed d :=
  forget_wellFormed d ps _ (by rw [hk]; rfl) h

/-- Forgetting keeps the copy of `G_v`: `G_v` is never forgotten. -/
theorem forget_G (ps : PrimeStrip) (tgt : PrimeStripKind) (i : ℕ) (hi : i < ps.loc.length) :
    ((ps.forget tgt).loc[i]'(by simpa [forget] using hi)).G = (ps.loc[i]).G := by
  simp only [forget, List.getElem_map]
  unfold LocalDatum.forget
  cases tgt <;> simp [PrimeStripKind.isEtaleLike, PrimeStripKind.isMonoAnalytic]

/-- Forgetting tgt a mono-analytic kind forgets `Π_v`. -/
theorem forget_Pi_of_mono (ps : PrimeStrip) (tgt : PrimeStripKind) (hto : tgt.isMonoAnalytic = true)
    (i : ℕ) (hi : i < ps.loc.length) :
    ((ps.forget tgt).loc[i]'(by simpa [forget] using hi)).Pi = none := by
  simp only [forget, List.getElem_map]
  unfold LocalDatum.forget
  cases tgt <;> simp_all [PrimeStripKind.isEtaleLike, PrimeStripKind.isMonoAnalytic]

/-- Forgetting tgt an étale-like kind forgets the monoid. -/
theorem forget_units_of_etale (ps : PrimeStrip) (tgt : PrimeStripKind)
    (hto : tgt.isEtaleLike = true) (i : ℕ) (hi : i < ps.loc.length) :
    ((ps.forget tgt).loc[i]'(by simpa [forget] using hi)).units = none := by
  simp only [forget, List.getElem_map]
  unfold LocalDatum.forget
  cases tgt <;> simp_all [PrimeStripKind.isEtaleLike, PrimeStripKind.isMonoAnalytic]

/-- The `⊃`-relation is reflexive. -/
theorem Forgettable_refl : ∀ k : PrimeStripKind, Forgettable k k = true := by decide

/-- The `⊃`-relation is transitive. -/
theorem Forgettable_trans : ∀ a b c : PrimeStripKind,
    Forgettable a b = true → Forgettable b c = true → Forgettable a c = true := by
  decide

/-- `F` is the richest kind: everything can be forgotten from an `F`-prime-strip
except the global realified Frobenioid. -/
theorem Forgettable_F : ∀ k : PrimeStripKind,
    Forgettable .FPrimeStrip k = (!k.hasGlobal) := by decide

/-- `F⊩▶×μ` and `F⊩` are the richest `⊩`-kinds; `D⊢` can be reached from everything. -/
theorem Forgettable_to_DMono : ∀ k : PrimeStripKind, Forgettable k .DMonoPrimeStrip = true := by
  decide

/-- One cannot recover `Π_v` from a mono-analytic strip. -/
theorem not_Forgettable_mono_to_hol : ∀ k : PrimeStripKind, k.isMonoAnalytic = true →
    Forgettable k .FPrimeStrip = false ∧ Forgettable k .DPrimeStrip = false := by
  decide

end PrimeStrip

end IUT
