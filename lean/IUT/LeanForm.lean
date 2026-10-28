import IUT.Species

/-!
# Stage 1 of the LeanForm of IUT: "Thm 3.11 ⟹ Cor 3.12" — [FormIUT] §2, §4

[FormIUT] (S. Mochizuki, *On the formalization of IUT: a preliminary progress
report*, April 2026, `leanform/`) lays out the **main strategy** for the Lean
formalization ("LeanForm") of inter-universal Teichmüller theory:

* Stage 1: [IUTchIII] Theorem 3.11 ⟹ Corollary 3.12;
* Stage 2: the proof of [IUTchIII] Theorem 3.11 modulo [IUTchI-II];
* Stage 3: [IUTchI-II] modulo the earlier results (1995–2015);
* Stage 4: the earlier results;
* Stage 5: the numerical aspects ([IUTchIV], [ExpEst]);

with the project "currently in the early skeletal portion of Stage 1".
[FormIUT] §4 reorganises Stage 1 as a diagram of **species** (boxes) and
**mutations** (arrows) consisting of four commuting triangles:

```
  BPS ──(mlt. algo.)──▶ mlt. rep. ──(hull+det)──▶ mlt. rep. + hull + det
   ▲                      ▲   ▲                           ▲
   │ (proj)         (dsc) │   │ (HDD) = (hull+det)∘(dsc)  │ (HDD)∘(SHE)
  BPS + 0-column ─(forget)─▶ BPS + etHT ◀──(SHE)── q-pilot + etHT
```

* the first triangle: the multiradial algorithm, whose input is a *basic
  prime-strip* (BPS, the `F⊢×μ`-prime-strip, the gluing datum of the Θ-link)
  and whose output is the multiradial representation, regarded as an algorithm
  on a BPS glued (by a full poly-isomorphism) to the underlying BPS of the
  Θ-pilot at `(0,0)` of the 0-column of the log-theta-lattice;
* the second triangle: the **descent** arrow `(dsc)`: up to the
  indeterminacies (Ind1,2,3) the representation is constructed from the weaker
  data of a BPS whose étale-like portion is glued to the (vertically coric)
  **étale Hodge theater** `etHT` of the 0-column;
* the third triangle: the definition `(HDD) := (hull+det) ∘ (dsc)`;
* the fourth triangle: `(HDD) ∘ (SHE)`, where `(SHE)` (*simultaneous
  holomorphic expressibility*) feeds in the q-pilot constructed from the
  `etHT`, i.e. the domain of the "`N`-th power map".

The fourth triangle is "3.11.5 ⟹ 3.12": the *simultaneous comparison*, inside
one ring structure (the common container), of the Θ-pilot (image of the
`N`-th power map, via `(HDD)`) and the q-pilot (domain, via `(SHE)`).  Its
essential content is that the height is `N` times the height up to a small
discrepancy arising from (Ind1,2,3) + hull, hence bounded ([FormIUT] §3, §4).
"3.11 ⟹ 3.11.5" is the first three triangles and rests on the **input
prime-strip link** (IPL) and **algorithmic parallel transport** (APT)
properties.

This file is the skeletal Lean form of that diagram on top of the data model
of this library (which [FormIUT] §2 says is the right level: "standard Lean
commands for formalizing types of mathematical objects and relationships
between their component pieces of data"):

* the species `BPS`, `EtHT`, `MltRep`, `MltRepHullDet`, `BPSZeroColumn`,
  `BPSEtHT`, `QPltEtHT` and the mutations `mltAlgo`, `proj`, `forgetEt`,
  `dsc`, `hullDet`, `HDD`, `SHE`;
* `triangle_one` … `triangle_four`: the four triangles commute;
* `IPL`, `mltAlgo_IPL`: the output of the multiradial algorithm is linked to
  its input BPS (same places, `l* + 1` procession steps, `log q` of the input,
  all three indeterminacies);
* `dsc_APT`: the descended algorithm depends only on the étale-like data —
  any gluing of the BPS to the `etHT` (any full poly-isomorphism) gives the
  same output, and (Ind1) fixes the tensor packets of a column;
* `thetaUpperBound_eq_hull_sub_dilation`: the container's log-volume is
  `hull − N·|log q|` with `N = l(l+1)/12` the dilation of the Θ-link;
* `ThmThreeElevenFive`, `CorThreeTwelve`, `corThreeTwelve_of_thmThreeElevenFive`:
  "3.11.5 ⟹ 3.12" — the comparison `−|log q| ≤ −|log Θ|` in the common
  container gives the bound `|log q| ≤ hull / (N − 1)`;
* `height_bounded_of_dilation`: the toy form of [FormIUT] §3: if `N·h ≤ h + C`
  with `N > 1` then `h ≤ C/(N−1)`.

Nothing here proves the comparison itself (that is the content of
[IUTchIII] Thm 3.11 and the subject of Stage 2); it is the single hypothesis
`ThmThreeElevenFive`, and everything downstream of it is proved.
-/

namespace IUT

/-! ## The main strategy ([FormIUT] §2) -/

/-- The five stages of the main strategy for the LeanForm of IUT. -/
inductive Stage where
  /-- [IUTchIII] Theorem 3.11 ⟹ Corollary 3.12 -/
  | one
  /-- the proof of [IUTchIII] Theorem 3.11 modulo [IUTchI-II] -/
  | two
  /-- [IUTchI-II] modulo the earlier results (1995–2015) -/
  | three
  /-- the earlier results: [pGC], [GeoAn], [AbsAnb], …, [AbsTopI-III] -/
  | four
  /-- the numerical aspects: [IUTchIV], [ExpEst] -/
  | five
  deriving DecidableEq, Repr

namespace Stage

def all : List Stage := [.one, .two, .three, .four, .five]

theorem all_length : all.length = 5 := rfl

/-- What each stage formalises. -/
def text : Stage → String
  | .one => "[IUTchIII] Thm 3.11 ⟹ Cor 3.12"
  | .two => "proof of [IUTchIII] Thm 3.11 modulo [IUTchI-II]"
  | .three => "[IUTchI-II] modulo earlier results (1995-2015)"
  | .four => "earlier results: [pGC], [GeoAn], [AbsAnb], [NCBel], [AbSc], [SemiAn], [QuCnf], [CbGC], [Config], [FrdI-II], [EtTh], [GenEll], [NodNon], [AbsTopI-III]"
  | .five => "numerical aspects: [IUTchIV], [ExpEst]"

/-- The stage the project is in ("the early skeletal portion of Stage 1"). -/
def current : Stage := .one

/-- The stages that most likely require the RIMS group (Stages 1–2), versus
the long-term goals amenable to other groups / autoformalization (3–5). -/
def requiresRIMS : Stage → Bool
  | .one | .two => true
  | _ => false

theorem current_requiresRIMS : current.requiresRIMS = true := rfl

end Stage

/-! ## The species of [FormIUT] §4 -/

/-- A **basic prime-strip** (`BasicPrimeStrip`, `BPS` of [FormIUT] §4; the
`F⊢×μ`-prime-strip of [IUTchII] Def 4.9): the horizontally coric
Frobenius-like gluing datum of the Θ-link, over the places `V` of its initial
Θ-data. -/
structure BPS where
  data : InitialThetaData
  strip : PrimeStrip
  kind_eq : strip.kind = .FMonoUnitsModTorsPrimeStrip

namespace BPS

/-- A BPS is well-formed if its strip is. -/
def WellFormed (b : BPS) : Prop := b.strip.WellFormed b.data

instance (b : BPS) : Decidable b.WellFormed := by unfold WellFormed; infer_instance

/-- The underlying BPS of the Θ-pilot's strip `F⊩_LGP` of a Hodge theater:
forget the global realified Frobenioid and the value groups. -/
def ofHodgeTheater (ht : ThetaPmEllNFHodgeTheater) : BPS :=
  ⟨ht.data, ht.FMonoGlobLGP.forget .FMonoUnitsModTorsPrimeStrip, rfl⟩

/-- The underlying BPS of a well-formed Hodge theater is well-formed. -/
theorem ofHodgeTheater_wellFormed (ht : ThetaPmEllNFHodgeTheater) (h : ht.WellFormed) :
    (ofHodgeTheater ht).WellFormed := by
  unfold ThetaPmEllNFHodgeTheater.WellFormed ThetaPmEllNFHodgeTheater.check
    ThetaPmEllNFHodgeTheater.checks at h
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq] at h
  obtain ⟨_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
    _, hLGP, hLGPk, _⟩ := h
  exact PrimeStrip.forget_wellFormed _ _ _ (by rw [hLGPk]; rfl) hLGP

/-- The BPS is the only Frobenius-like kind of strip that is horizontally
coric ([IUTchIII] Thm 1.5 (ii); `PrimeStripKind.horizontallyCoric_frobenius`). -/
theorem kind_horizontallyCoric (b : BPS) : b.strip.kind.horizontallyCoric = true := by
  rw [b.kind_eq]; rfl

end BPS

/-- The **étale Hodge theater** `etHT` (`EtaleHodgeTheater` of [FormIUT] §4):
the D-Θ±ell NF-Hodge theater, purely group-theoretic and vertically coric. -/
abbrev EtHT := ThetaPmEllNFHodgeTheater.DThetaPmEllNFHodgeTheater

/-- The **multiradial representation** (`MultiradialRepresentation`,
[IUTchIII] Thm 3.11): the output of the multiradial algorithm. -/
abbrev MltRep := MultiradialRep

/-- The multiradial representation after `hull+det`: the holomorphic hull and
the determinant of the module generated by the topological module of the
representation, summarised by its log-volume `−|log Θ|` ([FormIUT] §4,
the third triangle; [IUTchIII] Cor 3.12; [Alien] §3.7 (iv)). -/
structure MltRepHullDet where
  rep : MultiradialRep
  /-- the log-volume of the hull: the common container's size -/
  logVolume : ℚ
  deriving Repr

/-- The formal logarithm the log-volumes are computed with: `log : ℕ → ℚ` on
the residue characteristics and the value `log d^K` of the log-different. -/
structure LogData where
  log : ℕ → ℚ
  logdK : ℚ

/-- **BPS + 0-column**: a BPS glued (by a full poly-isomorphism, i.e. an
arbitrary indeterminate isomorphism, hence no data beyond "the same places")
to the underlying BPS of the Θ-pilot at `(0,0)` of the 0-column of a
log-theta-lattice ([FormIUT] §4, the first triangle). -/
structure BPSZeroColumn where
  bps : BPS
  lat : LogThetaLattice
  /-- the vertex `(0,0)` of the 0-column -/
  origin : ThetaPmEllNFHodgeTheater
  origin_pos : origin.n = 0 ∧ origin.m = 0
  origin_data : origin.data = lat.data
  /-- the gluing: the BPS lives over the places of the lattice -/
  glued : bps.data = lat.data

/-- **BPS + etHT**: a BPS whose étale-like portion (`G_v`) is glued, by a full
poly-isomorphism, to the corresponding portion of an étale Hodge theater
([FormIUT] §4, the second triangle). -/
structure BPSEtHT where
  bps : BPS
  etHT : EtHT
  /-- the gluing of the étale-like portions: the same places -/
  glued : bps.data = etHT.data

/-- **q-pilot + etHT**: the q-pilot (the domain of the `N`-th power map)
constructed from an étale Hodge theater ([FormIUT] §4, the fourth triangle;
[IUTchIII] Def 3.8). -/
structure QPltEtHT where
  qPilot : Pilot
  qPilot_kind : qPilot.kind = .q
  qPilot_exps : qPilot.exps = [1]
  etHT : EtHT

/-! ## The mutations of [FormIUT] §4 -/

/-- The multiradial representation of column `n` computed from initial
Θ-data alone (`iut_multiradial_build` depends on the lattice only through its
data). -/
def MultiradialRep.ofData (d : InitialThetaData) (n : ℤ) (L : LogData) : MultiradialRep :=
  let logq := d.logQ L.log
  { n := n
    steps := (List.range (d.LStar + 1)).map (ProcessionStep.mk' d L.logdK logq)
    ind := Indeterminacies.all
    logq := logq
    absLogQ := d.absLogQ L.log
    thetaUpperBound := d.thetaUpperBound L.logdK logq
    leadingTerm := d.leadingTerm L.logdK logq
    CTheta := IUT.CTheta d.l d.dmod (L.logdK - d.logF L.log - 2 * L.log d.l) (d.logF L.log) logq
      (eStarMod (MultiradialRep.eModMax d)) etaPrm
    hullEnlargement := d.hullEnlargement L.logdK }

/-- `build` on a lattice is `ofData` on its data. -/
theorem MultiradialRep.build_eq_ofData (lat : LogThetaLattice) (n : ℤ) (log : ℕ → ℚ) (logdK : ℚ) :
    MultiradialRep.build lat n log logdK = MultiradialRep.ofData lat.data n ⟨log, logdK⟩ := rfl

namespace Form

variable (L : LogData)

/-- **(mlt. algo.)**: the multiradial algorithm `BPS ↦ mlt. rep.`
([IUTchIII] Thm 3.11): the representation of the 0-column over the places of
the BPS. -/
def mltAlgo (b : BPS) : MltRep := MultiradialRep.ofData b.data 0 L

/-- **(proj)**: `BPS + 0-column ↦ BPS`, forgetting the column. -/
def proj (x : BPSZeroColumn) : BPS := x.bps

/-- The diagonal of the first triangle: `BPS + 0-column ↦ mlt. rep.`. -/
def mltAlgoZeroColumn (x : BPSZeroColumn) : MltRep := MultiradialRep.build x.lat 0 L.log L.logdK

/-- **(forget)**: `BPS + 0-column ↦ BPS + etHT`, keeping of the vertex `(0,0)`
only its étale Hodge theater (`ForgetToD`). -/
def forgetEt (x : BPSZeroColumn) : BPSEtHT :=
  ⟨x.bps, ThetaPmEllNFHodgeTheater.forgetToD x.origin, by
    show x.bps.data = x.origin.data
    rw [x.origin_data, x.glued]⟩

/-- **(dsc)**: the descent arrow `BPS + etHT ↦ mlt. rep.`: the multiradial
representation constructed, up to (Ind1,2,3), from the étale-like data alone. -/
def dsc (x : BPSEtHT) : MltRep := MultiradialRep.ofData x.etHT.data 0 L

/-- **(hull+det)**: `mlt. rep. ↦ mlt. rep. + hull + det`; the log-volume of the
hull is the procession-normalised upper bound `−|log Θ| ≤ (1/l*) Σ_j […]` of
[IUTchIII] Cor 3.12 / [Alien] §3.7 (iv). -/
def hullDet (R : MltRep) : MltRepHullDet := ⟨R, R.thetaUpperBound⟩

/-- **(HDD)** `:= (hull+det) ∘ (dsc)` ([FormIUT] §4, the third triangle). -/
def HDD (x : BPSEtHT) : MltRepHullDet := hullDet (dsc L x)

/-- **(SHE)**, simultaneous holomorphic expressibility: `q-pilot + etHT ↦
BPS + etHT`, the BPS underlying the q-pilot, expressed in the holomorphic
structure of the étale Hodge theater's vertex. -/
def SHE (x : QPltEtHT) : BPSEtHT :=
  ⟨⟨x.etHT.data,
    PrimeStrip.build x.etHT.data .FMonoUnitsModTorsPrimeStrip "BPS" x.etHT.univ 0 x.qPilot.exps,
    rfl⟩,
   x.etHT, rfl⟩

/-- The composite of the fourth triangle, `(HDD) ∘ (SHE)`: the Θ-pilot and
the q-pilot in one container. -/
def HDDSHE (x : QPltEtHT) : MltRepHullDet := HDD L (SHE x)

/-! ### The four triangles commute -/

/-- **First triangle**: the multiradial algorithm on `BPS + 0-column` is the
multiradial algorithm on the BPS. -/
theorem triangle_one (x : BPSZeroColumn) : mltAlgoZeroColumn L x = mltAlgo L (proj x) := by
  simp only [mltAlgoZeroColumn, mltAlgo, proj, MultiradialRep.build_eq_ofData, x.glued]

/-- **Second triangle**: the multiradial algorithm on `BPS + 0-column` factors
through the descent arrow: forget to `BPS + etHT`, then descend. -/
theorem triangle_two (x : BPSZeroColumn) : mltAlgoZeroColumn L x = dsc L (forgetEt x) := by
  simp only [mltAlgoZeroColumn, dsc, forgetEt, ThetaPmEllNFHodgeTheater.forgetToD,
    MultiradialRep.build_eq_ofData, x.origin_data]

/-- **Third triangle**: `(HDD) = (hull+det) ∘ (dsc)`. -/
theorem triangle_three (x : BPSEtHT) : HDD L x = hullDet (dsc L x) := rfl

/-- **Fourth triangle**: `(HDD) ∘ (SHE)` restricted to the q-pilot. -/
theorem triangle_four (x : QPltEtHT) : HDDSHE L x = hullDet (dsc L (SHE x)) := rfl

/-- The two paths from `BPS + 0-column` to `mlt. rep.` agree: `(mlt. algo.) ∘
(proj) = (dsc) ∘ (forget)`. -/
theorem descent_square (x : BPSZeroColumn) : mltAlgo L (proj x) = dsc L (forgetEt x) := by
  rw [← triangle_one, triangle_two]

/-! ### The input prime-strip link (IPL) -/

/-- **IPL**: the relationship between the data of the input BPS of the
multiradial algorithm and the data of its output ([FormIUT] §4): the output
has `l* + 1` procession steps for the `l` of the input, its `log q` and
`|log q| = log q / 2l` are those of the input's places, it is the
representation of the 0-column, and it carries all three indeterminacies. -/
structure IPL (b : BPS) (R : MltRep) : Prop where
  steps_length : R.steps.length = b.data.LStar + 1
  logq_eq : R.logq = b.data.logQ L.log
  absLogQ_eq : R.absLogQ = R.logq / (2 * b.data.l)
  column_zero : R.n = 0
  multiradial : R.ind.Multiradial

/-- The multiradial algorithm satisfies IPL. -/
theorem mltAlgo_IPL (b : BPS) : IPL L b (mltAlgo L b) where
  steps_length := by simp [mltAlgo, MultiradialRep.ofData]
  logq_eq := rfl
  absLogQ_eq := rfl
  column_zero := rfl
  multiradial := Indeterminacies.all_multiradial

/-- IPL also holds along the descended path: the output of `(dsc) ∘ (forget)`
is linked to the input BPS of `BPS + 0-column`. -/
theorem dsc_forget_IPL (x : BPSZeroColumn) : IPL L (proj x) (dsc L (forgetEt x)) := by
  rw [← descent_square]
  exact mltAlgo_IPL L (proj x)

/-- The procession steps of the output are `S^±_1, …, S^±_{l*+1}` with
`(j+1)!` possibilities each (Ind1). -/
theorem mltAlgo_steps (b : BPS) (j : ℕ) (hj : j < b.data.LStar + 1) :
    (mltAlgo L b).steps[j]'(by rw [(mltAlgo_IPL L b).steps_length]; exact hj) =
      ProcessionStep.mk' b.data L.logdK (b.data.logQ L.log) j := by
  simp [mltAlgo, MultiradialRep.ofData]

/-! ### Algorithmic parallel transport (APT) -/

/-- **APT**: the descended algorithm expresses "gluings up to indeterminacies":
its output depends only on the étale-like data of the `etHT`, so any two
gluings of any two BPSs to étale Hodge theaters with the same data (i.e. any
full poly-isomorphism, and any indeterminacy of (Ind1,2,3) + hull) give the
same multiradial representation. -/
theorem dsc_APT (x y : BPSEtHT) (h : x.etHT.data = y.etHT.data) : dsc L x = dsc L y := by
  simp only [dsc, h]

/-- In particular the choice of BPS is immaterial: the descended output is
determined by the étale Hodge theater. -/
theorem dsc_eq_of_etHT (x y : BPSEtHT) (h : x.etHT = y.etHT) : dsc L x = dsc L y :=
  dsc_APT L x y (by rw [h])

/-- (Ind1) acts trivially on the tensor packets of a single column: the
packet in which every label carries the same log-shells is fixed by every
permutation (`TensorPacket.smul_ofShells`), which is why `(dsc)` can be
defined on the quotient by (Ind1). -/
theorem apt_ind1 (j : ℕ) (σ : Ind1 j) (shells : List LogShell) :
    σ • TensorPacket.ofShells j shells = TensorPacket.ofShells j shells :=
  TensorPacket.smul_ofShells σ shells

/-- `(SHE)` produces a well-formed BPS (the q-pilot's exponents are positive). -/
theorem SHE_wellFormed (x : QPltEtHT) : (SHE x).bps.WellFormed := by
  unfold BPS.WellFormed SHE
  apply PrimeStrip.build_wellFormed
  rw [x.qPilot_exps]
  simp

/-- `(SHE)` is compatible with the gluing: the BPS it produces lives over the
places of the étale Hodge theater. -/
theorem SHE_data (x : QPltEtHT) : (SHE x).bps.data = x.etHT.data := rfl

/-! ### "3.11.5 ⟹ 3.12" -/

/-- The container's log-volume is the hull enlargement minus `N·|log q|`,
`N = l(l+1)/12` the dilation of the Θ-link ([IUTchIII] Rem 3.12.1;
`Link.thetaDilation`): the Θ-pilot is "`N` times the q-pilot" up to the hull. -/
theorem thetaUpperBound_eq_hull_sub_dilation (d : InitialThetaData) (hd : d.WellFormed)
    (logdK logq : ℚ) :
    d.thetaUpperBound logdK logq = d.hullEnlargement logdK - Link.thetaDilation d * (logq / (2 * d.l)) := by
  rw [InitialThetaData.thetaUpperBound_eq d hd, InitialThetaData.hullEnlargement_eq d hd]
  have hl : (d.l : ℚ) = 2 * d.LStar + 1 := by
    exact_mod_cast (InitialThetaData.two_LStar_add_one d hd).symm
  unfold Link.thetaDilation
  rw [hl]
  have hpos : (2 * (d.LStar : ℚ) + 1) ≠ 0 := by positivity
  field_simp
  ring

/-- `N = l(l+1)/12 > 1` for `l ≥ 5`. -/
theorem one_lt_thetaDilation (d : InitialThetaData) (hd : d.WellFormed) : 1 < Link.thetaDilation d := by
  unfold Link.thetaDilation
  have h5 : (5 : ℚ) ≤ d.l := by exact_mod_cast hd.l_ge_five
  rw [lt_div_iff₀ (by norm_num)]
  nlinarith

/-- The log-volume of the container `(HDD)∘(SHE)` is `hull − N·|log q|`. -/
theorem HDDSHE_logVolume (x : QPltEtHT) (hd : x.etHT.data.WellFormed) :
    (HDDSHE L x).logVolume =
      x.etHT.data.hullEnlargement L.logdK - Link.thetaDilation x.etHT.data * x.etHT.data.absLogQ L.log := by
  show x.etHT.data.thetaUpperBound L.logdK (x.etHT.data.logQ L.log) = _
  rw [thetaUpperBound_eq_hull_sub_dilation _ hd]
  rfl

/-- The q-pilot's log-volume, in the container, is `−|log q|` ([IUTchIII] Def
3.8, Cor 3.12; `Pilot.logVolumeInLogQ`). -/
theorem qPilot_logVolume (x : QPltEtHT) (hq : x.qPilot.logVolumeInLogQ = -1 / (2 * x.etHT.data.l)) :
    x.qPilot.logVolumeInLogQ * x.etHT.data.logQ L.log = -(x.etHT.data.absLogQ L.log) := by
  rw [hq]
  unfold InitialThetaData.absLogQ
  ring

/-- **"Theorem 3.11.5"** (`= 3.11 + Rem 3.9.5`, with `hull+det` moved into it,
[FormIUT] §4) as a statement about the fourth triangle: the q-pilot sits
inside the common container, i.e. its log-volume `−|log q|` is at most the
container's log-volume `−|log Θ|`.  This is the simultaneous comparison of the
q- and Θ-pilots and is *not* proved here — it is the content of Stage 2. -/
def ThmThreeElevenFive (x : QPltEtHT) : Prop :=
  -(x.etHT.data.absLogQ L.log) ≤ (HDDSHE L x).logVolume

/-- **Corollary 3.12** in the form of the bound: `|log q| ≤ hull / (N − 1)`
([IUTchIII] Cor 3.12; [FormIUT] §3: "the height is bounded"). -/
def CorThreeTwelve (x : QPltEtHT) : Prop :=
  x.etHT.data.absLogQ L.log ≤
    x.etHT.data.hullEnlargement L.logdK / (Link.thetaDilation x.etHT.data - 1)

/-- **"3.11.5 ⟹ 3.12"** ([FormIUT] §4, the fourth triangle): the comparison in
the common container implies the bound on `|log q|`. -/
theorem corThreeTwelve_of_thmThreeElevenFive (x : QPltEtHT) (hd : x.etHT.data.WellFormed)
    (h : ThmThreeElevenFive L x) : CorThreeTwelve L x := by
  unfold ThmThreeElevenFive at h
  unfold CorThreeTwelve
  rw [HDDSHE_logVolume L x hd] at h
  have hN := one_lt_thetaDilation _ hd
  rw [le_div_iff₀ (by linarith)]
  linarith

/-- The same, in the normalisation of `MultiradialRep.inequalityHolds`: the
first conjunct of `inequalityHolds` for the descended representation is
exactly `ThmThreeElevenFive`. -/
theorem thmThreeElevenFive_iff_inequality (x : QPltEtHT) :
    ThmThreeElevenFive L x ↔ -(dsc L (SHE x)).absLogQ ≤ (dsc L (SHE x)).thetaUpperBound :=
  Iff.rfl

/-- The toy form of [FormIUT] §3: if the "height" `h` satisfies
`N·h ≤ h + C` — the `N`-th power map multiplies heights by `N`, and the
multiradial algorithm says the height is unaffected by this up to a mild
error `C` (from (Ind1,2,3) + hull) — then the height is bounded:
`h ≤ C / (N − 1)`. -/
theorem height_bounded_of_dilation (N h C : ℚ) (hN : 1 < N) (hc : N * h ≤ h + C) :
    h ≤ C / (N - 1) := by
  rw [le_div_iff₀ (by linarith)]
  linarith

/-- The IUT instance of the toy: `N = l(l+1)/12`, `h = |log q|`, `C = hull`. -/
theorem corThreeTwelve_is_height_bound (x : QPltEtHT) (hd : x.etHT.data.WellFormed)
    (h : ThmThreeElevenFive L x) :
    x.etHT.data.absLogQ L.log ≤
      x.etHT.data.hullEnlargement L.logdK / (Link.thetaDilation x.etHT.data - 1) := by
  apply height_bounded_of_dilation _ _ _ (one_lt_thetaDilation _ hd)
  unfold ThmThreeElevenFive at h
  rw [HDDSHE_logVolume L x hd] at h
  linarith

/-- Unfolding the bound: `log q ≤ (12 l (l* + 3) / (l(l+1) − 12)) · log d^K`
for well-formed data — a bound on the height of the elliptic curve in terms
of the log-different. -/
theorem corThreeTwelve_unfolded (x : QPltEtHT) (hd : x.etHT.data.WellFormed)
    (h : ThmThreeElevenFive L x) :
    x.etHT.data.logQ L.log ≤
      (12 * x.etHT.data.l * (x.etHT.data.LStar + 3) / (x.etHT.data.l * (x.etHT.data.l + 1) - 12)) *
        L.logdK := by
  have hb := corThreeTwelve_of_thmThreeElevenFive L x hd h
  unfold CorThreeTwelve at hb
  rw [InitialThetaData.hullEnlargement_eq _ hd] at hb
  unfold InitialThetaData.absLogQ Link.thetaDilation at hb
  have hl : (5 : ℚ) ≤ x.etHT.data.l := by exact_mod_cast hd.l_ge_five
  have hpos : (0 : ℚ) < x.etHT.data.l * (x.etHT.data.l + 1) - 12 := by nlinarith
  have hl0 : (0 : ℚ) < 2 * x.etHT.data.l := by linarith
  rw [div_le_iff₀ hl0] at hb
  rw [show (x.etHT.data.l : ℚ) * (x.etHT.data.l + 1) / 12 - 1 =
      (x.etHT.data.l * (x.etHT.data.l + 1) - 12) / 12 by ring, div_div_eq_mul_div] at hb
  rw [show (12 : ℚ) * x.etHT.data.l * (x.etHT.data.LStar + 3) /
      (x.etHT.data.l * (x.etHT.data.l + 1) - 12) * L.logdK =
      ((x.etHT.data.LStar + 3) / 2 * L.logdK * 12 / (x.etHT.data.l * (x.etHT.data.l + 1) - 12)) *
        (2 * x.etHT.data.l) by field_simp]
  exact hb

/-! ### The diagram as species and mutations -/

/-- The species of the [FormIUT] §4 diagram, as entries of the species table
format. -/
def formSpecies : List Species := [
  ⟨"BasicPrimeStrip", "BPS", "[FormIUT] §4", "the F⊢×μ-prime-strip: the gluing datum of the Θ-link"⟩,
  ⟨"MultiradialRepresentation", "mlt. rep.", "[FormIUT] §4", "the output of the multiradial algorithm, up to (Ind1,2,3)"⟩,
  ⟨"MultiradialRepresentationHullDet", "mlt. rep. + hull + det", "[FormIUT] §4", "the holomorphic hull and the determinant: the common container"⟩,
  ⟨"BasicPrimeStripZeroColumn", "BPS + 0-column", "[FormIUT] §4", "a BPS glued to the underlying BPS of the Θ-pilot at (0,0)"⟩,
  ⟨"BasicPrimeStripEtaleHodgeTheater", "BPS + etHT", "[FormIUT] §4", "a BPS whose étale-like portion is glued to an etHT"⟩,
  ⟨"QPilotEtaleHodgeTheater", "q-plt. + etHT", "[FormIUT] §4", "the q-pilot constructed from an etHT"⟩
]

/-- The mutations of the [FormIUT] §4 diagram. -/
def formMutations : List Mutation := [
  ⟨"MultiradialAlgorithm", "mlt. algo.", "BasicPrimeStrip", "MultiradialRepresentation", "[FormIUT] §4; [IUTchIII] Thm 3.11", false⟩,
  ⟨"ProjectToBasicPrimeStrip", "proj", "BasicPrimeStripZeroColumn", "BasicPrimeStrip", "[FormIUT] §4", true⟩,
  ⟨"ForgetToEtaleHodgeTheater", "forget", "BasicPrimeStripZeroColumn", "BasicPrimeStripEtaleHodgeTheater", "[FormIUT] §4", true⟩,
  ⟨"Descent", "(dsc)", "BasicPrimeStripEtaleHodgeTheater", "MultiradialRepresentation", "[FormIUT] §4", false⟩,
  ⟨"HullDet", "hull+det", "MultiradialRepresentation", "MultiradialRepresentationHullDet", "[FormIUT] §4", false⟩,
  ⟨"HullDetDescent", "(HDD) = (hull+det)∘(dsc)", "BasicPrimeStripEtaleHodgeTheater", "MultiradialRepresentationHullDet", "[FormIUT] §4", false⟩,
  ⟨"SimultaneousHolomorphicExpressibility", "(SHE)", "QPilotEtaleHodgeTheater", "BasicPrimeStripEtaleHodgeTheater", "[FormIUT] §4", false⟩
]

theorem formSpecies_length : formSpecies.length = 6 := rfl

theorem formMutations_length : formMutations.length = 7 := rfl

/-- All identifiers are English letters only and pairwise distinct. -/
theorem form_ids_lettersOnly :
    formSpecies.all (fun s => lettersOnly s.id) = true ∧
    formMutations.all (fun m => lettersOnly m.id) = true := by decide

theorem form_ids_nodup :
    (formSpecies.map (·.id)).Nodup ∧ (formMutations.map (·.id)).Nodup := by decide

/-- Look up a species of the diagram. -/
def findSpecies? (id : String) : Option Species := formSpecies.find? (·.id = id)

/-- Every mutation of the diagram goes between species of the diagram. -/
theorem formMutations_endpoints :
    formMutations.all (fun m => (findSpecies? m.dom).isSome && (findSpecies? m.cod).isSome) = true := by
  decide

/-- The two species that already appear in the master identifier table and
the species table are `BasicPrimeStrip` and `MultiradialRepresentation`; the
glued species and the arrows are named only here. -/
theorem formSpecies_in_identifiers :
    (formSpecies.filter fun s => (findIdent s.id).isSome).map (·.id) =
      ["BasicPrimeStrip", "MultiradialRepresentation"] := by
  decide +kernel

/-- The four paths of the diagram, as mutation-histories: each is chained. -/
def triangleOnePath : MutationHistory := ⟨[formMutations[1], formMutations[0]]⟩

def triangleTwoPath : MutationHistory := ⟨[formMutations[2], formMutations[3]]⟩

def triangleThreePath : MutationHistory := ⟨[formMutations[3], formMutations[4]]⟩

def triangleFourPath : MutationHistory := ⟨[formMutations[6], formMutations[3], formMutations[4]]⟩

theorem paths_chained :
    MutationHistory.Chained triangleOnePath.steps ∧ MutationHistory.Chained triangleTwoPath.steps ∧
    MutationHistory.Chained triangleThreePath.steps ∧
    MutationHistory.Chained triangleFourPath.steps := by
  decide

/-- The first two paths have the same endpoints (`BPS + 0-column → mlt. rep.`):
the descent square. -/
theorem paths_one_two_endpoints :
    triangleOnePath.source = triangleTwoPath.source ∧ triangleOnePath.target = triangleTwoPath.target := by
  decide

/-- The third path is the composite `(HDD)`. -/
theorem path_three_is_HDD :
    triangleThreePath.source = some formMutations[5].dom ∧
    triangleThreePath.target = some formMutations[5].cod := by
  decide

/-- The fourth path starts at the q-pilot and ends in the common container. -/
theorem path_four_endpoints :
    triangleFourPath.source = some "QPilotEtaleHodgeTheater" ∧
    triangleFourPath.target = some "MultiradialRepresentationHullDet" := by
  decide

/-- The decomposition of "3.11 ⟹ 3.12" ([FormIUT] §4): Thm 3.11 is `(dsc)`
(triangles 1–3, resting on APT + IPL), "Thm 3.11.5" is `(hull+det) ∘ (dsc)`,
and Cor 3.12 is the comparison of the q- and Θ-pilots via `(SHE)` + IPL
(triangle 4). -/
inductive StageOneStep where
  /-- Thm 3.11: `(dsc)`, the first/second/third triangles, via APT + IPL -/
  | thm311
  /-- "Thm 3.11.5": `(hull+det) ∘ (dsc)` -/
  | thm3115
  /-- Cor 3.12: the comparison of the q- and Θ-pilots, the fourth triangle, via SHE + IPL -/
  | cor312
  deriving DecidableEq, Repr

/-- The mutations each step of the decomposition consists of. -/
def StageOneStep.mutations : StageOneStep → List String
  | .thm311 => ["MultiradialAlgorithm", "ProjectToBasicPrimeStrip", "ForgetToEtaleHodgeTheater", "Descent"]
  | .thm3115 => ["HullDet", "HullDetDescent"]
  | .cor312 => ["SimultaneousHolomorphicExpressibility"]

/-- The three steps use every mutation of the diagram exactly once. -/
theorem stageOneSteps_cover :
    ([StageOneStep.thm311, .thm3115, .cor312].flatMap StageOneStep.mutations) =
      formMutations.map (·.id) := by
  decide

end Form

end IUT
