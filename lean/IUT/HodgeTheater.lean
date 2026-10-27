import IUT.PrimeStrip

/-!
# Hodge theaters — [IUTchI] Def 3.6, Def 4.6, Def 5.5, Def 6.13

A **Θ±ell NF-Hodge theater** (`ThetaPmEllNFHodgeTheater`, [IUTchI] Def 6.13
(iii); pictures in [Pano] §3 and [Alien] §3.3 (v) Fig 3.8) is

* a **Θ±ell-Hodge theater** (`ThetaPmEllHodgeTheater`): a capsule `F_T` of
  `F`-prime-strips labelled by `t ∈ F_l` with pairwise distinct basepoints, the
  Θ±-bridge `F_T → F_⊞` (`FBoxPlus`) and the Θell-bridge `D_T → D_⊚±`
  (`DCircDotPm`, `Π_{X_K}`);
* glued along `F_l ⊇ F_l^× ↠ F_l^*` ("0, ⊞ ↦ >", `GluingZeroBoxPlusToGt`) to
* a **ΘNF-Hodge theater** (`ThetaNFHodgeTheater`): a capsule `F_J` labelled by
  `j ∈ F_l^*`, the Θ-bridge `F_J → F_>` (`FGt`) and the NF-bridge `F_J → F_⊛`
  (`FCircAst`, `Π_{C_K} ↷ F_mod^×`), containing the **Θ-Hodge theater**
  (`ThetaHodgeTheater`, [IUTchI] Def 3.6): `F⊩_mod` carrying `q̲_v` and
  `F⊩_tht` carrying `Θ̲_v` with `Θ̲_v(j) = q̲_v^{j²}`.

From these the `⊩`-strips of [IUTchII] Cor 4.10 / [IUTchIII] Def 3.8 are built:
`F⊩_Δ` (`FMonoGlobTriangle`, labels `0` and `F_l^*` identified, home of the
**q-pilot** `{q̲_v}`), `F⊩_env`, `F⊩_gau`, `F⊩_LGP` (`FMonoGlobLGP`, home of the
**Θ-pilot** `{q̲_v^{j²}}_{j=1..l*}`) and `F⊩_lgp`.  Every Hodge theater lives in
its own *universe* ([IUTchIV] §3) and all its Frobenius-like copies are fresh.

`ThetaPmEllNFHodgeTheater.WellFormed` is the Lean version of the C validator
`iut_validate_hodge_theater`, and `build_wellFormed` proves that the
constructor `build` (the port of `iut_hodge_theater_new`) produces a
well-formed Hodge theater from *any* well-formed initial Θ-data — in
particular the species is inhabited (`exists_wellFormed`).
-/

namespace IUT

/-- The basepoint of a capsule member: each label `t` gets its own copy
(conjugate synchronization is an *output* of the theory, not an input;
[IUTchI] Cor 6.10, [IUTchII] Cor 4.5). -/
structure Basepoint where
  univ : ℕ
  index : ℕ
  deriving DecidableEq, Repr

/-- A member of a capsule of prime-strips, labelled by `t ∈ F_l` or `j ∈ F_l^*`. -/
structure CapsuleMember where
  label : ℤ
  basepoint : Basepoint
  deriving DecidableEq, Repr

/-- The **Θ-Hodge theater** `(F⊩_mod, F⊩_tht)` ([IUTchI] Def 3.6): `F⊩_mod`
carries the `q`-parameters `q̲_v`, `F⊩_tht` the theta function `Θ̲_v`, whose
value at the label `j` is `q̲_v^{j²}` (recorded in `q̲`-units as `j²`). -/
structure ThetaHodgeTheater where
  FMonoGlobMod : PrimeStrip
  FMonoGlobTht : PrimeStrip
  /-- `Θ̲_v` evaluated at `j = 0, …, l*`, in `q̲`-units: `j²` -/
  thetaValue : List ℚ
  deriving Repr

/-- The **Θ±ell-Hodge theater** ([IUTchI] §6, Def 6.13): additive symmetry
`F_l^{⋊±}`, capsule `F_T` indexed by `F_l`. -/
structure ThetaPmEllHodgeTheater where
  /-- the capsule `F_T`, one `F`-prime-strip per `t ∈ F_l` -/
  T : List CapsuleMember
  /-- `F_⊞`, target of the Θ±-bridge -/
  FBoxPlus : PrimeStrip
  /-- `D_⊚±`, target of the Θell-bridge (`Π_{X_K}`) -/
  DCircDotPm : PrimeStrip
  thetaPmBridgeOk : Bool
  thetaEllBridgeOk : Bool
  deriving Repr

/-- The **ΘNF-Hodge theater** ([IUTchI] §4, §5, Def 5.5): multiplicative
symmetry `F_l^*`, capsule `F_J` indexed by `F_l^*`. -/
structure ThetaNFHodgeTheater where
  /-- the capsule `F_J`, one `F`-prime-strip per `j ∈ F_l^*` -/
  J : List CapsuleMember
  /-- `F_>`, target of the Θ-bridge -/
  FGt : PrimeStrip
  /-- `F_⊛`, target of the NF-bridge (`Π_{C_K} ↷ F_mod^×`) -/
  FCircAst : PrimeStrip
  tht : ThetaHodgeTheater
  thetaBridgeOk : Bool
  nfBridgeOk : Bool
  deriving Repr

/-- `q`-pilot or Θ-pilot ([IUTchIII] Def 3.8 (i)). -/
inductive PilotKind where
  | q
  | theta
  deriving DecidableEq, Repr

/-- A pilot object: the object of `C⊩` determined by `{q̲_v}` (`q`-pilot,
exponents `{1}`) or by `{q̲_v^{j²}}_{j=1..l*}` (Θ-pilot, exponents `{1, 4, 9, …}`),
with its log-volume in units of `log(q)` ([IUTchIII] Def 3.8 (i), Cor 3.12). -/
structure Pilot where
  kind : PilotKind
  exps : List ℕ
  /-- `−|log(q)|` resp. the naive `−|log(Θ)|`, in units of `log(q)` -/
  logVolumeInLogQ : ℚ
  deriving DecidableEq, Repr

/-- A log-shell `I_v = (p*)⁻¹ · log(O×_{K_v}) ⊆ K_v` ([IUTchIII] Def 1.1 (i);
[AbsTopIII] Def 5.4 (iii)): the place, `p*`, the `p`-adic valuation of a
generator, whether it was constructed from a holomorphic or a mono-analytic
strip, from étale-like or Frobenius-like data, and which lattice vertex the
units came from. -/
structure LogShell where
  vIndex : ℕ
  pstar : ℕ
  radius : ℚ
  holomorphic : Bool
  etaleLike : Bool
  latticeN : ℤ
  latticeM : ℤ
  deriving DecidableEq, Repr

/-- **The Θ±ell NF-Hodge theater** ([IUTchI] Def 6.13 (iii)): a vertex `•` of
the log-theta-lattice, `{n,m}HT` ([IUTchIII] Def 1.4). -/
structure ThetaPmEllNFHodgeTheater where
  /-- column of the log-theta-lattice -/
  n : ℤ
  /-- row of the log-theta-lattice -/
  m : ℤ
  /-- `"Dag"` (`†`), `"Ddag"` (`‡`) or `"NM…"` -/
  copyLabel : String
  /-- the universe / distinct label of this copy ([IUTchIV] §3) -/
  univ : ℕ
  data : InitialThetaData
  pmell : ThetaPmEllHodgeTheater
  nf : ThetaNFHodgeTheater
  /-- the gluing `0, ⊞ ↦ >` has been performed -/
  glued : Bool
  /-- `F⊩_Δ`: labels `0` and `F_l^*` identified; home of the `q`-pilot -/
  FMonoGlobTriangle : PrimeStrip
  /-- `F⊩_env` (theta monoids) -/
  FMonoGlobEnv : PrimeStrip
  /-- `F⊩_gau` (Gaussian monoids) -/
  FMonoGlobGau : PrimeStrip
  /-- `F⊩_LGP` (log-Gaussian procession, `MOD`); home of the Θ-pilot -/
  FMonoGlobLGP : PrimeStrip
  /-- `F⊩_lgp` (log-Gaussian procession, `mod`) -/
  FMonoGlobLgp : PrimeStrip
  qPilot : Pilot
  thetaPilot : Pilot
  /-- the log-shells constructed by the log-link *into* this vertex -/
  shell : List LogShell
  hasIncomingLog : Bool
  /-- how many log-links were applied along the column to reach this vertex -/
  logIterate : ℕ
  deriving Repr

namespace ThetaPmEllNFHodgeTheater

/-- The exponents `{j²}_{j=1..l*}` of the Θ-pilot. -/
def thetaExps (d : InitialThetaData) : List ℕ := (List.range d.LStar).map fun j => (j + 1) ^ 2

theorem thetaExps_pos (d : InitialThetaData) : ∀ e ∈ thetaExps d, 0 < e := by
  intro e he
  simp only [thetaExps, List.mem_map, List.mem_range] at he
  obtain ⟨j, _, rfl⟩ := he
  positivity

/-- The capsule `F_T`: one member per `t ∈ F_l = {−l*, …, l*}`, each with its own
basepoint. -/
def capsuleT (d : InitialThetaData) (u : ℕ) : List CapsuleMember :=
  (List.range d.l).map fun (i : ℕ) => ⟨(i : ℤ) - d.LStar, ⟨u, 1 + i⟩⟩

/-- The capsule `F_J`: one member per `j ∈ F_l^* = {1, …, l*}`. -/
def capsuleJ (d : InitialThetaData) (u : ℕ) : List CapsuleMember :=
  (List.range d.LStar).map fun (j : ℕ) => ⟨(j : ℤ) + 1, ⟨u, 1 + d.LStar + 1 + j⟩⟩

/-- Share the étale-like portion (`Π_v`, `G_v`) of `src` with `dst`: the
codomain strip *literally* uses the same copies.  Used by the gluing
`0, ⊞ ↦ >` and by the log-link (vertical coricity). -/
def shareEtale (src dst : PrimeStrip) : PrimeStrip :=
  { dst with loc := List.zipWith (fun s t => { t with Pi := s.Pi, G := s.G }) src.loc dst.loc }

@[simp] theorem shareEtale_kind (src dst : PrimeStrip) : (shareEtale src dst).kind = dst.kind := rfl

@[simp] theorem shareEtale_loc_length (src dst : PrimeStrip) :
    (shareEtale src dst).loc.length = min src.loc.length dst.loc.length := by
  simp [shareEtale]

theorem shareEtale_loc_getElem (src dst : PrimeStrip) (i : ℕ)
    (hi : i < (shareEtale src dst).loc.length) :
    (shareEtale src dst).loc[i] =
      { dst.loc[i]'(by simp at hi; omega) with
        Pi := (src.loc[i]'(by simp at hi; omega)).Pi, G := (src.loc[i]'(by simp at hi; omega)).G } := by
  simp [shareEtale]

/-- Replacing the étale-like portion of a local datum by that of a datum of a
kind of the same holomorphic/mono-analytic nature preserves its check. -/
theorem _root_.IUT.LocalDatum.check_update_etale (k k' : PrimeStripKind) (s t : LocalDatum)
    (hmono : k.isMonoAnalytic = k'.isMonoAnalytic) (hs : s.check k = true) (ht : t.check k' = true) :
    ({ t with Pi := s.Pi, G := s.G } : LocalDatum).check k' = true := by
  unfold LocalDatum.check LocalDatum.checks at hs ht ⊢
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id] at hs ht ⊢
  rw [hmono] at hs
  exact ⟨hs.1, hs.2.1, ht.2.2.1, ht.2.2.2.1, ht.2.2.2.2.1, ht.2.2.2.2.2.1, ht.2.2.2.2.2.2.1,
    ht.2.2.2.2.2.2.2.1, ht.2.2.2.2.2.2.2.2⟩

/-- Sharing the étale-like portion of a strip of the same holomorphic/mono-
analytic nature preserves well-formedness. -/
theorem shareEtale_wellFormed (d : InitialThetaData) (src dst : PrimeStrip)
    (hmono : src.kind.isMonoAnalytic = dst.kind.isMonoAnalytic)
    (hs : src.WellFormed d) (ht : dst.WellFormed d) : (shareEtale src dst).WellFormed d := by
  unfold PrimeStrip.WellFormed PrimeStrip.check at hs ht ⊢
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true] at hs ht
  obtain ⟨⟨⟨hslen, hsloc⟩, _⟩, _⟩ := hs
  obtain ⟨⟨⟨htlen, htloc⟩, htglob⟩, htdeg⟩ := ht
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true, shareEtale_kind]
  refine ⟨⟨⟨by simp [hslen, htlen], ?_⟩, htglob⟩, htdeg⟩
  intro L hL
  rw [List.mem_iff_getElem] at hL
  obtain ⟨i, hi, rfl⟩ := hL
  rw [shareEtale_loc_getElem]
  exact LocalDatum.check_update_etale _ _ _ _ hmono
    (hsloc _ (List.getElem_mem (by simp at hi; omega)))
    (htloc _ (List.getElem_mem (by simp at hi; omega)))

/-- The gluing `0, ⊞ ↦ >` ([IUTchI] Def 6.13 (iii)): the `F`-prime-strip `F_⊞`
of the Θ±ell-Hodge theater and `F_>` of the ΘNF-Hodge theater are identified
(their `Π_v`, `G_v` become the same copies), and the capsule members `±j` are
identified with `j ∈ F_l^*` (`iut_hodge_theater_glue`). -/
def glue (ht : ThetaPmEllNFHodgeTheater) : ThetaPmEllNFHodgeTheater :=
  { ht with nf := { ht.nf with FGt := shareEtale ht.pmell.FBoxPlus ht.nf.FGt }, glued := true }

/-- The copy label `†`, `‡` or `{n,m}` of a vertex. -/
def copyLabelOf (n m : ℤ) : String :=
  if n = 0 ∧ m = 0 then "Dag"
  else if n = 1 ∧ m = 0 then "Ddag"
  else "NM" ++ (if n < 0 then "Neg" else "") ++ toString n.natAbs ++
    (if m < 0 then "Neg" else "") ++ toString m.natAbs

/-- `iut_hodge_theater_new`: the Θ±ell NF-Hodge theater at `(n, m)` in the
universe `u`, built from initial Θ-data `d`, glued. -/
def build (d : InitialThetaData) (n m : ℤ) (u : ℕ) : ThetaPmEllNFHodgeTheater :=
  glue
  { n := n
    m := m
    copyLabel := copyLabelOf n m
    univ := u
    data := d
    pmell :=
      { T := capsuleT d u
        FBoxPlus := PrimeStrip.build d .FPrimeStrip "BoxPlus" u 70 []
        DCircDotPm := PrimeStrip.build d .DPrimeStrip "CircDotPm" u 71 []
        thetaPmBridgeOk := true
        thetaEllBridgeOk := true }
    nf :=
      { J := capsuleJ d u
        FGt := PrimeStrip.build d .FPrimeStrip "Gt" u 72 []
        FCircAst := PrimeStrip.build d .FPrimeStrip "CircAst" u 73 []
        tht :=
          { FMonoGlobMod := PrimeStrip.build d .FMonoGlobPrimeStrip "MonoGlobMod" u 74 []
            FMonoGlobTht := PrimeStrip.build d .FMonoGlobPrimeStrip "MonoGlobTht" u 75 (thetaExps d)
            thetaValue := (List.range (d.LStar + 1)).map fun j => ((j : ℚ) ^ 2) }
        thetaBridgeOk := true
        nfBridgeOk := true }
    glued := false
    FMonoGlobTriangle :=
      PrimeStrip.build d .FMonoGlobValUnitsModTorsPrimeStrip "Triangle" u 80 []
    FMonoGlobEnv := PrimeStrip.build d .FMonoGlobValUnitsModTorsPrimeStrip "Env" u 81 (thetaExps d)
    FMonoGlobGau := PrimeStrip.build d .FMonoGlobValUnitsModTorsPrimeStrip "Gau" u 82 (thetaExps d)
    FMonoGlobLGP :=
      PrimeStrip.build d .FMonoGlobValUnitsModTorsPrimeStrip "LGPTorsor" u 83 (thetaExps d)
    FMonoGlobLgp :=
      PrimeStrip.build d .FMonoGlobValUnitsModTorsPrimeStrip "LgpIdeal" u 84 (thetaExps d)
    qPilot := ⟨.q, [1], -1 / (2 * d.l)⟩
    thetaPilot := ⟨.theta, thetaExps d, -(PrimeStrip.averageExp (thetaExps d)) / (2 * d.l)⟩
    shell := []
    hasIncomingLog := false
    logIterate := 0 }

/-- `iut_validate_hodge_theater`: the list of conditions checked. -/
def checks (ht : ThetaPmEllNFHodgeTheater) : List Bool :=
  let d := ht.data
  let tLabels := ht.pmell.T.map (·.label)
  [ -- Θ±ell-HT: capsule indexed by F_l, distinct labels and basepoints, bridges, F_⊞, D_⊚±
    ht.pmell.T.length == d.l,
    ht.pmell.T.all fun c => decide (-(d.LStar : ℤ) ≤ c.label ∧ c.label ≤ d.LStar),
    decide tLabels.Nodup,
    decide (ht.pmell.T.map (·.basepoint)).Nodup,
    ht.pmell.thetaPmBridgeOk,
    ht.pmell.thetaEllBridgeOk,
    ht.pmell.FBoxPlus.check d,
    ht.pmell.FBoxPlus.kind == .FPrimeStrip,
    ht.pmell.DCircDotPm.check d,
    ht.pmell.DCircDotPm.kind == .DPrimeStrip,
    -- ΘNF-HT: capsule indexed by F_l^*, bridges, F_>, F_⊛, the Θ-Hodge theater
    ht.nf.J.length == d.LStar,
    ht.nf.J.all fun c => decide (1 ≤ c.label ∧ c.label ≤ d.LStar),
    ht.nf.thetaBridgeOk,
    ht.nf.nfBridgeOk,
    ht.nf.FGt.check d,
    ht.nf.FGt.kind == .FPrimeStrip,
    ht.nf.FCircAst.check d,
    ht.nf.FCircAst.kind == .FPrimeStrip,
    ht.nf.tht.FMonoGlobMod.check d,
    ht.nf.tht.FMonoGlobMod.kind == .FMonoGlobPrimeStrip,
    ht.nf.tht.FMonoGlobTht.check d,
    ht.nf.tht.FMonoGlobTht.kind == .FMonoGlobPrimeStrip,
    ht.nf.tht.thetaValue == (List.range (d.LStar + 1)).map fun j => ((j : ℚ) ^ 2),
    -- gluing 0, ⊞ ↦ >: every j ∈ F_l^* comes from the two labels ±j ∈ F_l
    ht.glued,
    ht.nf.J.all fun c => decide (c.label ∈ tLabels ∧ -c.label ∈ tLabels),
    -- the derived ⊩-strips and the pilots
    ht.FMonoGlobTriangle.check d,
    ht.FMonoGlobTriangle.kind == .FMonoGlobValUnitsModTorsPrimeStrip,
    ht.FMonoGlobEnv.check d,
    ht.FMonoGlobEnv.kind == .FMonoGlobValUnitsModTorsPrimeStrip,
    ht.FMonoGlobGau.check d,
    ht.FMonoGlobGau.kind == .FMonoGlobValUnitsModTorsPrimeStrip,
    ht.FMonoGlobLGP.check d,
    ht.FMonoGlobLGP.kind == .FMonoGlobValUnitsModTorsPrimeStrip,
    ht.FMonoGlobLgp.check d,
    ht.FMonoGlobLgp.kind == .FMonoGlobValUnitsModTorsPrimeStrip,
    ht.qPilot.kind == .q,
    ht.qPilot.exps == [1],
    ht.thetaPilot.kind == .theta,
    ht.thetaPilot.exps == thetaExps d,
    -- log-shells: one per v ∈ V if this vertex is the codomain of a log-link
    !ht.hasIncomingLog || ht.shell.length == d.V.length ]

/-- `iut_validate_hodge_theater`, as a Boolean check: all of `checks` hold. -/
def check (ht : ThetaPmEllNFHodgeTheater) : Bool := ht.checks.all id

/-- A well-formed Θ±ell NF-Hodge theater. -/
def WellFormed (ht : ThetaPmEllNFHodgeTheater) : Prop := ht.check = true

instance (ht : ThetaPmEllNFHodgeTheater) : Decidable ht.WellFormed := by
  unfold WellFormed; infer_instance

@[simp] theorem build_n (d : InitialThetaData) (n m : ℤ) (u : ℕ) : (build d n m u).n = n := rfl
@[simp] theorem build_m (d : InitialThetaData) (n m : ℤ) (u : ℕ) : (build d n m u).m = m := rfl
@[simp] theorem build_univ (d : InitialThetaData) (n m : ℤ) (u : ℕ) : (build d n m u).univ = u := rfl
@[simp] theorem build_data (d : InitialThetaData) (n m : ℤ) (u : ℕ) : (build d n m u).data = d := rfl
@[simp] theorem build_glued (d : InitialThetaData) (n m : ℤ) (u : ℕ) : (build d n m u).glued = true := rfl

theorem capsuleT_length (d : InitialThetaData) (u : ℕ) : (capsuleT d u).length = d.l := by
  simp [capsuleT]

theorem capsuleJ_length (d : InitialThetaData) (u : ℕ) : (capsuleJ d u).length = d.LStar := by
  simp [capsuleJ]

/-- The labels of `F_T` are pairwise distinct. -/
theorem capsuleT_labels_nodup (d : InitialThetaData) (u : ℕ) :
    ((capsuleT d u).map (·.label)).Nodup := by
  unfold capsuleT
  rw [List.map_map]
  refine List.Nodup.map ?_ List.nodup_range
  intro a b h
  simp at h
  omega

/-- The basepoints of `F_T` are pairwise distinct: the capsule members are
distinct copies. -/
theorem capsuleT_basepoints_nodup (d : InitialThetaData) (u : ℕ) :
    ((capsuleT d u).map (·.basepoint)).Nodup := by
  unfold capsuleT
  rw [List.map_map]
  refine List.Nodup.map ?_ List.nodup_range
  intro a b h
  simp at h
  omega

/-- The labels of `F_T` are exactly `{−l*, …, l*}` (for `l = 2l* + 1`). -/
theorem mem_capsuleT_labels (d : InitialThetaData) (u : ℕ) (hl : 2 * d.LStar + 1 = d.l) (t : ℤ) :
    t ∈ (capsuleT d u).map (·.label) ↔ -(d.LStar : ℤ) ≤ t ∧ t ≤ d.LStar := by
  simp only [capsuleT, List.map_map, List.mem_map, List.mem_range, Function.comp]
  constructor
  · rintro ⟨i, hi, rfl⟩
    omega
  · intro h
    refine ⟨(t + d.LStar).toNat, by omega, by omega⟩

/-- **Every Hodge theater produced by `build` from well-formed initial Θ-data
is well-formed.**  In particular the capsule `F_T` has `|F_l| = l` members with
distinct labels and basepoints, `F_J` has `l*` members, `Θ̲_v(j) = q̲_v^{j²}`,
the gluing `0, ⊞ ↦ >` identifies each `j ∈ F_l^*` with exactly the labels
`±j ∈ F_l`, the `q`-pilot is `{q̲_v}` and the Θ-pilot is `{q̲_v^{j²}}_{j=1..l*}`. -/
theorem build_wellFormed (d : InitialThetaData) (hd : d.WellFormed) (n m : ℤ) (u : ℕ) :
    (build d n m u).WellFormed := by
  have hl := d.two_LStar_add_one hd
  have hpos : ∀ e ∈ ([] : List ℕ), 0 < e := by simp
  have hth := thetaExps_pos d
  have hB := PrimeStrip.build_wellFormed d .FPrimeStrip "BoxPlus" u 70 [] hpos
  have hC := PrimeStrip.build_wellFormed d .DPrimeStrip "CircDotPm" u 71 [] hpos
  have hG := shareEtale_wellFormed d (PrimeStrip.build d .FPrimeStrip "BoxPlus" u 70 [])
    (PrimeStrip.build d .FPrimeStrip "Gt" u 72 []) rfl hB
    (PrimeStrip.build_wellFormed d .FPrimeStrip "Gt" u 72 [] hpos)
  have hA := PrimeStrip.build_wellFormed d .FPrimeStrip "CircAst" u 73 [] hpos
  have hM := PrimeStrip.build_wellFormed d .FMonoGlobPrimeStrip "MonoGlobMod" u 74 [] hpos
  have hTh := PrimeStrip.build_wellFormed d .FMonoGlobPrimeStrip "MonoGlobTht" u 75 (thetaExps d) hth
  have hTr := PrimeStrip.build_wellFormed d .FMonoGlobValUnitsModTorsPrimeStrip "Triangle" u 80 [] hpos
  have hE := PrimeStrip.build_wellFormed d .FMonoGlobValUnitsModTorsPrimeStrip "Env" u 81
    (thetaExps d) hth
  have hGa := PrimeStrip.build_wellFormed d .FMonoGlobValUnitsModTorsPrimeStrip "Gau" u 82
    (thetaExps d) hth
  have hL := PrimeStrip.build_wellFormed d .FMonoGlobValUnitsModTorsPrimeStrip "LGPTorsor" u 83
    (thetaExps d) hth
  have hLg := PrimeStrip.build_wellFormed d .FMonoGlobValUnitsModTorsPrimeStrip "LgpIdeal" u 84
    (thetaExps d) hth
  have hT1 := capsuleT_length d u
  have hT2 : ∀ c ∈ capsuleT d u, -(d.LStar : ℤ) ≤ c.label ∧ c.label ≤ d.LStar := fun c hc =>
    (mem_capsuleT_labels d u hl _).mp (List.mem_map_of_mem hc)
  have hT3 := capsuleT_labels_nodup d u
  have hT4 := capsuleT_basepoints_nodup d u
  have hJ1 := capsuleJ_length d u
  have hJ2 : ∀ c ∈ capsuleJ d u, 1 ≤ c.label ∧ c.label ≤ d.LStar := by
    intro c hc
    simp only [capsuleJ, List.mem_map, List.mem_range] at hc
    obtain ⟨j, hj, rfl⟩ := hc
    dsimp only
    omega
  have hJ3 : ∀ c ∈ capsuleJ d u, c.label ∈ (capsuleT d u).map (·.label) ∧
      -c.label ∈ (capsuleT d u).map (·.label) := by
    intro c hc
    simp only [capsuleJ, List.mem_map, List.mem_range] at hc
    obtain ⟨j, hj, rfl⟩ := hc
    exact ⟨(mem_capsuleT_labels d u hl _).mpr (by dsimp only; omega),
      (mem_capsuleT_labels d u hl _).mpr (by dsimp only; omega)⟩
  unfold PrimeStrip.WellFormed at hB hC hG hA hM hTh hTr hE hGa hL hLg
  unfold WellFormed check checks
  simp only [build, glue, List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id,
    beq_iff_eq, List.all_eq_true, shareEtale_kind, PrimeStrip.build_kind, Bool.or_eq_true,
    Bool.not_eq_true']
  exact ⟨hT1, fun c hc => decide_eq_true (hT2 c hc), decide_eq_true hT3, decide_eq_true hT4,
    by trivial, by trivial, hB, by trivial, hC, by trivial, hJ1, fun c hc => decide_eq_true (hJ2 c hc),
    by trivial, by trivial, hG, by trivial, hA, by trivial, hM, by trivial, hTh, by trivial,
    by trivial, by trivial, fun c hc => decide_eq_true (hJ3 c hc), hTr, by trivial, hE, by trivial,
    hGa, by trivial, hL, by trivial, hLg, by trivial, by trivial, by trivial, by trivial, by trivial,
    Or.inl trivial⟩

/-- **The species of Θ±ell NF-Hodge theaters is inhabited.** -/
theorem exists_wellFormed : ∃ ht : ThetaPmEllNFHodgeTheater, ht.WellFormed :=
  ⟨build InitialThetaData.exampleOne 0 0 1,
    build_wellFormed _ InitialThetaData.exampleOne_wellFormed 0 0 1⟩

/-- For every well-formed initial Θ-data and every lattice coordinate there is
a well-formed Hodge theater: the vertices `{n,m}HT` of the log-theta-lattice
all exist. -/
theorem exists_wellFormed_at (d : InitialThetaData) (hd : d.WellFormed) (n m : ℤ) :
    ∃ ht : ThetaPmEllNFHodgeTheater, ht.WellFormed ∧ ht.n = n ∧ ht.m = m ∧ ht.data = d :=
  ⟨build d n m 0, build_wellFormed d hd n m 0, rfl, rfl, rfl⟩

instance : Inhabited ThetaPmEllNFHodgeTheater := ⟨build InitialThetaData.exampleOne 0 0 1⟩

/-- The copy of `Π_v` in `F_>` of a built Hodge theater is *the* copy of `F_⊞`:
the gluing `0, ⊞ ↦ >`. -/
theorem build_glued_Pi (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ) (hi : i < d.V.length) :
    ((build d n m u).nf.FGt.loc[i]'(by simp [build, glue]; omega)).Pi =
      ((build d n m u).pmell.FBoxPlus.loc[i]'(by simp [build, glue]; omega)).Pi := by
  simp [build, glue, shareEtale]

/-- The capsule `F_T` of a built Hodge theater has `l` members. -/
theorem build_T_length (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (build d n m u).pmell.T.length = d.l := capsuleT_length d u

/-- The capsule `F_J` of a built Hodge theater has `l*` members. -/
theorem build_J_length (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (build d n m u).nf.J.length = d.LStar := capsuleJ_length d u

/-- The Θ-pilot of a built Hodge theater has the exponents `j²`, `j = 1, …, l*`. -/
theorem build_thetaPilot_exps (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (build d n m u).thetaPilot.exps = (List.range d.LStar).map fun j => (j + 1) ^ 2 := rfl

/-- The `q`-pilot of a built Hodge theater is `{q̲_v}`. -/
theorem build_qPilot_exps (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (build d n m u).qPilot.exps = [1] := rfl

/-- The Frobenius-like monoid copies of a built Hodge theater live in its
universe: the copy of `O×μ` in `F⊩_Δ` at place `i`. -/
theorem build_Triangle_units (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ)
    (hi : i < d.V.length) :
    ((build d n m u).FMonoGlobTriangle.loc[i]'(by simp [build, glue]; omega)).units =
      some ⟨u, 80, i, .units⟩ := by
  simp only [build, glue]
  rw [PrimeStrip.build_units d _ _ _ _ _ i hi]
  rfl

/-- The copy of `O×μ` in `F⊩_LGP` at place `i`. -/
theorem build_LGP_units (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ)
    (hi : i < d.V.length) :
    ((build d n m u).FMonoGlobLGP.loc[i]'(by simp [build, glue]; omega)).units =
      some ⟨u, 83, i, .units⟩ := by
  simp only [build, glue]
  rw [PrimeStrip.build_units d _ _ _ _ _ i hi]
  rfl

/-- The copy of `Π_v` in `F_>` (after gluing, the copy of `F_⊞`) at place `i`. -/
theorem build_FGt_Pi (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ) (hi : i < d.V.length) :
    ((build d n m u).nf.FGt.loc[i]'(by simp [build, glue]; omega)).Pi = some ⟨u, 70, i, .Pi⟩ := by
  rw [build_glued_Pi d n m u i hi]
  simp only [build, glue]
  rw [PrimeStrip.build_Pi d _ _ _ _ _ i hi]
  rfl

/-- The copy of `G_v` in `F⊩_Δ` at place `i`. -/
theorem build_Triangle_G (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ) (hi : i < d.V.length) :
    ((build d n m u).FMonoGlobTriangle.loc[i]'(by simp [build, glue]; omega)).G =
      ⟨u, 80, i, .G⟩ := by
  simp only [build, glue]
  rw [PrimeStrip.build_G d _ _ _ _ _ i hi]

/-- The copy of `G_v` in `F⊩_LGP` at place `i`. -/
theorem build_LGP_G (d : InitialThetaData) (n m : ℤ) (u : ℕ) (i : ℕ) (hi : i < d.V.length) :
    ((build d n m u).FMonoGlobLGP.loc[i]'(by simp [build, glue]; omega)).G = ⟨u, 83, i, .G⟩ := by
  simp only [build, glue]
  rw [PrimeStrip.build_G d _ _ _ _ _ i hi]

/-! ### The étale-like (base-category) Hodge theater `D-Θ±ell NF-HT` -/

/-- The **D-Θ±ell NF-Hodge theater** (`DThetaPmEllNFHodgeTheater`, [IUTchI]
Def 6.13; `etHT` of [FormIUT] §1): the base-category (étale-like) version of
a Θ±ell NF-Hodge theater — only `D`- and `D⊢`-prime-strips, no Frobenius-like
monoids.  It is vertically coric ([IUTchIII] Thm 1.5 (i)). -/
structure DThetaPmEllNFHodgeTheater where
  n : ℤ
  m : ℤ
  univ : ℕ
  data : InitialThetaData
  T : List CapsuleMember
  J : List CapsuleMember
  DCircDotPm : PrimeStrip
  DBoxPlus : PrimeStrip
  DGt : PrimeStrip
  DCircAst : PrimeStrip
  DMonoTriangle : PrimeStrip
  deriving Repr

/-- The mutation `HT ↦ D-HT` (`ForgetToD`, [IUTchI] Def 6.13): forget all
Frobenius-like data. -/
def forgetToD (ht : ThetaPmEllNFHodgeTheater) : DThetaPmEllNFHodgeTheater where
  n := ht.n
  m := ht.m
  univ := ht.univ
  data := ht.data
  T := ht.pmell.T
  J := ht.nf.J
  DCircDotPm := ht.pmell.DCircDotPm
  DBoxPlus := ht.pmell.FBoxPlus.forget .DPrimeStrip
  DGt := ht.nf.FGt.forget .DPrimeStrip
  DCircAst := ht.nf.FCircAst.forget .DPrimeStrip
  DMonoTriangle := ht.FMonoGlobTriangle.forget .DMonoPrimeStrip

/-- A D-Θ±ell NF-Hodge theater is well-formed if its strips are well-formed
`D`- resp. `D⊢`-strips. -/
def DThetaPmEllNFHodgeTheater.WellFormed (D : DThetaPmEllNFHodgeTheater) : Prop :=
  D.DCircDotPm.WellFormed D.data ∧ D.DCircDotPm.kind = .DPrimeStrip ∧
  D.DBoxPlus.WellFormed D.data ∧ D.DBoxPlus.kind = .DPrimeStrip ∧
  D.DGt.WellFormed D.data ∧ D.DGt.kind = .DPrimeStrip ∧
  D.DCircAst.WellFormed D.data ∧ D.DCircAst.kind = .DPrimeStrip ∧
  D.DMonoTriangle.WellFormed D.data ∧ D.DMonoTriangle.kind = .DMonoPrimeStrip

/-- **`ForgetToD` preserves well-formedness**: the étale-like Hodge theater of
a well-formed Hodge theater is well-formed. -/
theorem forgetToD_wellFormed (ht : ThetaPmEllNFHodgeTheater) (h : ht.WellFormed) :
    (forgetToD ht).WellFormed := by
  unfold WellFormed check checks at h
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq] at h
  obtain ⟨_, _, _, _, _, _, hBox, hBoxk, hCirc, hCirck, _, _, _, _, hGt, hGtk, hAst, hAstk, _, _,
    _, _, _, _, _, hTri, hTrik, _⟩ := h
  refine ⟨hCirc, hCirck, ?_, rfl, ?_, rfl, ?_, rfl, ?_, rfl⟩
  · exact PrimeStrip.forget_wellFormed _ _ _ (by rw [hBoxk]; rfl) hBox
  · exact PrimeStrip.forget_wellFormed _ _ _ (by rw [hGtk]; rfl) hGt
  · exact PrimeStrip.forget_wellFormed _ _ _ (by rw [hAstk]; rfl) hAst
  · exact PrimeStrip.forget_wellFormed _ _ _ (by rw [hTrik]; rfl) hTri

end ThetaPmEllNFHodgeTheater

end IUT
