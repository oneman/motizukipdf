import IUT.HodgeTheater

/-!
# Links — the log-link and the Θ-links

[IUTchI] Cor 3.7 (Θ-link), [IUTchII] Cor 4.10 (Θ×μ-, Θ×μ_gau-links), [IUTchIII]
Def 1.1 / Prop 1.3 (log-link), Def 3.8 (ii) (Θ×μ_LGP-, Θ×μ_lgp-links),
[IUTchIII] Thm 1.5 (coricity), [Alien] §1 (mutually alien copies).

A `Link` records, for an arrow of the log-theta-lattice, what is glued and
what is preserved:

* the **log-link** `(n,m) → (n,m+1)` identifies the étale-like data (`Π_v`,
  `G_v`: *vertical coricity*), gives the codomain fresh Frobenius-like monoids
  (the units are sent through `log` to `K_v`: the source of **Ind3**), and
  constructs the log-shells in the codomain;
* a **Θ-link** `(n,m) → (n+1,m)` glues `†F⊩_LGP` to `‡F⊩_Δ`: the unit groups
  `G_v ↷ O×μ` are identified up to `Ind1`, `Ind2` (*horizontal coricity*), the
  value groups are *not* compatible (`{q̲^{j²}} ↦ {q̲}`, the dilation
  `l(l+1)/12`), and `Π_v` — the holomorphic structure — is *never* shared: the
  two sides are *mutually alien* ring theories;
* **no link is compatible with the ring structures** ([IUTchIII] Rem 1.4.1).

`Link.WellFormed` is the Lean version of `iut_validate_link`; `logLinkOf` and
`thetaLinkOf` are proved well-formed, and the structural facts above are
theorems (`wellFormed_not_ring`, `wellFormed_alien`, `wellFormed_G`, …).
The *application* of a link to Hodge theaters (`applyLogLink`,
`applyThetaLink`) is proved to preserve well-formedness and to have exactly
the coricity properties claimed: `applyLogLink_shares_Pi`,
`applyThetaLink_shares_units`, `applyThetaLink_alien`,
`applyLogLink_fresh_units`.
-/

namespace IUT

/-- The kinds of links of the log-theta-lattice. -/
inductive LinkKind where
  | ThetaLink
  | ThetaUnitsModTorsLink
  | ThetaUnitsModTorsGauLink
  | ThetaUnitsModTorsLGPTorsorLink
  | ThetaUnitsModTorsLgpIdealLink
  | LogLink
  | DThetaPmEllNFLink
  deriving DecidableEq, Repr

namespace LinkKind

def ident : LinkKind → String
  | ThetaLink => "ThetaLink"
  | ThetaUnitsModTorsLink => "ThetaUnitsModTorsLink"
  | ThetaUnitsModTorsGauLink => "ThetaUnitsModTorsGauLink"
  | ThetaUnitsModTorsLGPTorsorLink => "ThetaUnitsModTorsLGPTorsorLink"
  | ThetaUnitsModTorsLgpIdealLink => "ThetaUnitsModTorsLgpIdealLink"
  | LogLink => "LogLink"
  | DThetaPmEllNFLink => "DThetaPmEllNFLink"

def printed : LinkKind → String
  | ThetaLink => "Θ-link"
  | ThetaUnitsModTorsLink => "Θ×μ-link"
  | ThetaUnitsModTorsGauLink => "Θ×μ_gau-link"
  | ThetaUnitsModTorsLGPTorsorLink => "Θ×μ_LGP-link"
  | ThetaUnitsModTorsLgpIdealLink => "Θ×μ_lgp-link"
  | LogLink => "log-link"
  | DThetaPmEllNFLink => "D-Θ±ell NF-link"

/-- The vertical arrow of the lattice. -/
def isVertical (k : LinkKind) : Bool := k == LogLink

/-- A horizontal arrow (one of the Θ-type links). -/
def isHorizontal (k : LinkKind) : Bool := k != LogLink

/-- The horizontal link kind used by the lattice: the log-link and the
étale-picture link are replaced by the default `Θ×μ_LGP`-link
(`iut_lattice_init`). -/
def normalizeHorizontal (k : LinkKind) : LinkKind :=
  if k = LogLink ∨ k = DThetaPmEllNFLink then ThetaUnitsModTorsLGPTorsorLink else k

theorem normalizeHorizontal_isHorizontal (k : LinkKind) :
    (normalizeHorizontal k).isHorizontal = true := by
  cases k <;> rfl

/-- Every link kind identifier is in the identifier table. -/
theorem ident_mem_identifiers : ∀ k : LinkKind, (findIdent k.ident).isSome = true := by
  intro k
  cases k <;> decide +kernel

end LinkKind

/-- A link of the log-theta-lattice: its kind, domain and codomain
coordinates, which kind of prime-strip is glued, whether the gluing is a full
poly-isomorphism, and what is preserved ("coric") versus dilated ("mutated"). -/
structure Link where
  kind : LinkKind
  dom : ℤ × ℤ
  cod : ℤ × ℤ
  /-- the kind of prime-strip glued (`F⊩`, `F⊩▶×μ`, `F` for the log-link) -/
  gluedKind : PrimeStripKind
  /-- the gluing is a *full* poly-isomorphism (no distinguished isomorphism) -/
  fullPolyIsomorphism : Bool
  /-- `Π_v` identified (log-link: yes; Θ-links: never) -/
  preservesPi : Bool
  /-- `G_v` identified up to indeterminate isomorphism (always) -/
  preservesG : Bool
  /-- `O×μ` identified (Θ×μ-type links: yes; log-link: no) -/
  preservesUnitsModTors : Bool
  /-- the ring structures are identified (never) -/
  preservesRingStructure : Bool
  /-- value-group dilation factor: `1` for the log-link, `l(l+1)/12 = (1/l*) Σ j²`
  for the Θ-links -/
  dilation : ℚ
  deriving DecidableEq, Repr

namespace Link

/-- The log-link `(n,m) → (n,m+1)` ([IUTchIII] Def 1.1, Prop 1.3). -/
def logLinkOf (n m : ℤ) : Link where
  kind := .LogLink
  dom := (n, m)
  cod := (n, m + 1)
  gluedKind := .FPrimeStrip
  fullPolyIsomorphism := true
  preservesPi := true
  preservesG := true
  preservesUnitsModTors := false
  preservesRingStructure := false
  dilation := 1

/-- The dilation of the value groups across a Θ-link: the average exponent
`(1/l*) Σ_{j=1}^{l*} j² = l(l+1)/12` ([IUTchIII] Rem 3.12.1). -/
def thetaDilation (d : InitialThetaData) : ℚ := d.l * (d.l + 1) / 12

/-- A Θ-type link `(n,m) → (n+1,m)` of kind `k` ([IUTchI] Cor 3.7; [IUTchII]
Cor 4.10 (iii); [IUTchIII] Def 3.8 (ii)). -/
def thetaLinkOf (k : LinkKind) (d : InitialThetaData) (n m : ℤ) : Link where
  kind := k
  dom := (n, m)
  cod := (n + 1, m)
  gluedKind := if k = .ThetaLink then .FMonoGlobPrimeStrip else .FMonoGlobValUnitsModTorsPrimeStrip
  fullPolyIsomorphism := true
  preservesPi := false
  preservesG := true
  preservesUnitsModTors := k != .ThetaLink
  preservesRingStructure := false
  dilation := thetaDilation d

/-- `iut_validate_link`: the conditions on a link. -/
def checks (d : InitialThetaData) (L : Link) : List Bool :=
  [ -- [IUTchIII] Rem 1.4.1; [Alien] §3.3: no link is compatible with the ring structures
    !L.preservesRingStructure,
    -- [IUTchI] Cor 3.7 (i): a FULL poly-isomorphism
    L.fullPolyIsomorphism,
    -- [IUTchIII] Thm 1.5 (iii): G_v is bi-coric
    L.preservesG,
    -- [IUTchIII] Def 1.4: log-links go (n,m) → (n,m+1), Θ-links (n,m) → (n+1,m)
    if L.kind = .LogLink then L.cod == (L.dom.1, L.dom.2 + 1) else L.cod == (L.dom.1 + 1, L.dom.2),
    -- [IUTchIII] Thm 1.5 (i): the log-link identifies Π_v; [Alien] §1: a Θ-link never does
    if L.kind = .LogLink then L.preservesPi else !L.preservesPi,
    -- [IUTchIII] Prop 1.3 (Ind3): the log-link does not identify the units;
    -- [IUTchII] Cor 4.10 (iii): the Θ×μ-type links do
    if L.kind = .LogLink then !L.preservesUnitsModTors
      else L.kind == .ThetaLink || L.preservesUnitsModTors,
    -- [IUTchI] Cor 3.7: the Θ-link glues F⊩-strips; [IUTchII] Cor 4.10 (iii): Θ×μ-type glue F⊩▶×μ
    L.kind == .LogLink ||
      (if L.kind = .ThetaLink then L.gluedKind == .FMonoGlobPrimeStrip
        else L.gluedKind == .FMonoGlobValUnitsModTorsPrimeStrip),
    -- [IUTchIII] Def 3.8, Rem 3.12.1: the dilation is the average of j²
    L.kind == .LogLink || L.dilation == thetaDilation d ]

/-- A well-formed link. -/
def WellFormed (d : InitialThetaData) (L : Link) : Prop := (L.checks d).all id = true

instance (d : InitialThetaData) (L : Link) : Decidable (L.WellFormed d) := by
  unfold WellFormed; infer_instance

/-- The log-link is well-formed. -/
theorem logLinkOf_wellFormed (d : InitialThetaData) (n m : ℤ) : (logLinkOf n m).WellFormed d := by
  simp [WellFormed, checks, logLinkOf]

/-- Every Θ-type link is well-formed. -/
theorem thetaLinkOf_wellFormed (k : LinkKind) (hk : k ≠ .LogLink) (d : InitialThetaData) (n m : ℤ) :
    (thetaLinkOf k d n m).WellFormed d := by
  cases k <;> simp_all [WellFormed, checks, thetaLinkOf]

/-- The unfolded form of `WellFormed`. -/
theorem wellFormed_iff (d : InitialThetaData) (L : Link) : L.WellFormed d ↔
    L.preservesRingStructure = false ∧ L.fullPolyIsomorphism = true ∧ L.preservesG = true ∧
    (if L.kind = .LogLink then L.cod = (L.dom.1, L.dom.2 + 1) else L.cod = (L.dom.1 + 1, L.dom.2)) ∧
    (if L.kind = .LogLink then L.preservesPi = true else L.preservesPi = false) ∧
    (if L.kind = .LogLink then L.preservesUnitsModTors = false
      else (L.kind = .ThetaLink ∨ L.preservesUnitsModTors = true)) ∧
    (L.kind = .LogLink ∨
      (if L.kind = .ThetaLink then L.gluedKind = .FMonoGlobPrimeStrip
        else L.gluedKind = .FMonoGlobValUnitsModTorsPrimeStrip)) ∧
    (L.kind = .LogLink ∨ L.dilation = thetaDilation d) := by
  unfold WellFormed checks
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq,
    Bool.not_eq_true', Bool.or_eq_true]
  constructor
  · rintro ⟨h1, h2, h3, h4, h5, h6, h7, h8⟩
    refine ⟨h1, h2, h3, ?_, ?_, ?_, ?_, h8⟩
    · split_ifs at h4 ⊢ <;> simpa using h4
    · split_ifs at h5 ⊢ <;> simpa using h5
    · split_ifs at h6 ⊢ <;> simpa using h6
    · rcases h7 with h7 | h7
      · exact Or.inl h7
      · right; split_ifs at h7 ⊢ <;> simpa using h7
  · rintro ⟨h1, h2, h3, h4, h5, h6, h7, h8⟩
    refine ⟨h1, h2, h3, ?_, ?_, ?_, ?_, h8⟩
    · split_ifs at h4 ⊢ <;> simpa using h4
    · split_ifs at h5 ⊢ <;> simpa using h5
    · split_ifs at h6 ⊢ <;> simpa using h6
    · rcases h7 with h7 | h7
      · exact Or.inl h7
      · right; split_ifs at h7 ⊢ <;> simpa using h7

/-- **No well-formed link preserves the ring structures** ([IUTchIII] Rem 1.4.1):
the log-theta-lattice is a diagram of *non-ring-theoretic* links. -/
theorem wellFormed_not_ring (d : InitialThetaData) (L : Link) (h : L.WellFormed d) :
    L.preservesRingStructure = false :=
  ((wellFormed_iff d L).mp h).1

/-- Every well-formed link is a full poly-isomorphism ([IUTchI] Cor 3.7 (i)). -/
theorem wellFormed_fullPoly (d : InitialThetaData) (L : Link) (h : L.WellFormed d) :
    L.fullPolyIsomorphism = true :=
  ((wellFormed_iff d L).mp h).2.1

/-- **`G_v` is bi-coric** ([IUTchIII] Thm 1.5 (iii)): every well-formed link
identifies `G_v`. -/
theorem wellFormed_G (d : InitialThetaData) (L : Link) (h : L.WellFormed d) :
    L.preservesG = true :=
  ((wellFormed_iff d L).mp h).2.2.1

/-- **Mutually alien copies** ([Alien] §1): a well-formed Θ-type link never
identifies `Π_v`. -/
theorem wellFormed_alien (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind ≠ .LogLink) : L.preservesPi = false := by
  have := ((wellFormed_iff d L).mp h).2.2.2.2.1
  rwa [ite_eq_right hk] at this

/-- The log-link identifies `Π_v`: **vertical coricity** ([IUTchIII] Thm 1.5 (i)). -/
theorem wellFormed_log_Pi (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind = .LogLink) : L.preservesPi = true := by
  have := ((wellFormed_iff d L).mp h).2.2.2.2.1
  rwa [ite_eq_left hk] at this

/-- The log-link does not identify the Frobenius-like units: this is the
source of **Ind3** ([IUTchIII] Prop 1.3; Thm 3.11 (ii)). -/
theorem wellFormed_log_not_units (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind = .LogLink) : L.preservesUnitsModTors = false := by
  have := ((wellFormed_iff d L).mp h).2.2.2.2.2.1
  rwa [ite_eq_left hk] at this

/-- The log-link goes `(n,m) → (n,m+1)` ([IUTchIII] Def 1.4). -/
theorem wellFormed_log_cod (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind = .LogLink) : L.cod = (L.dom.1, L.dom.2 + 1) := by
  have := ((wellFormed_iff d L).mp h).2.2.2.1
  rwa [ite_eq_left hk] at this

/-- A Θ-type link goes `(n,m) → (n+1,m)` ([IUTchIII] Def 1.4). -/
theorem wellFormed_theta_cod (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind ≠ .LogLink) : L.cod = (L.dom.1 + 1, L.dom.2) := by
  have := ((wellFormed_iff d L).mp h).2.2.2.1
  rwa [ite_eq_right hk] at this

/-- A Θ×μ-type link identifies the `F⊢×μ`-prime-strips: **horizontal coricity**
([IUTchII] Cor 4.10 (iii); [IUTchIII] Thm 1.5 (ii)). -/
theorem wellFormed_theta_units (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind ≠ .LogLink) (hk' : L.kind ≠ .ThetaLink) : L.preservesUnitsModTors = true := by
  have := ((wellFormed_iff d L).mp h).2.2.2.2.2.1
  rw [ite_eq_right hk] at this
  rcases this with h' | h'
  · exact absurd h' hk'
  · exact h'

/-- The dilation of a Θ-type link is `l(l+1)/12`, the average of `j²` over
`j ∈ F_l^*` ([IUTchIII] Rem 3.12.1). -/
theorem wellFormed_theta_dilation (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind ≠ .LogLink) : L.dilation = thetaDilation d := by
  rcases ((wellFormed_iff d L).mp h).2.2.2.2.2.2.2 with h' | h'
  · exact absurd h' hk
  · exact h'

/-- A well-formed link is either a vertical log-link or a horizontal Θ-type
link: the lattice has only these two kinds of arrows. -/
theorem wellFormed_vertical_or_horizontal (d : InitialThetaData) (L : Link) (h : L.WellFormed d) :
    (L.kind = .LogLink ∧ L.cod = (L.dom.1, L.dom.2 + 1)) ∨
    (L.kind ≠ .LogLink ∧ L.cod = (L.dom.1 + 1, L.dom.2)) := by
  by_cases hk : L.kind = .LogLink
  · exact Or.inl ⟨hk, wellFormed_log_cod d L h hk⟩
  · exact Or.inr ⟨hk, wellFormed_theta_cod d L h hk⟩

/-- The dilation of a Θ-link is really the average exponent of the Θ-pilot:
`thetaDilation = (Σ_{j=1}^{l*} j²) / l*` (`LPrime.sumSq_div_LStar`). -/
theorem thetaDilation_eq_average (d : InitialThetaData) (hd : d.WellFormed) :
    thetaDilation d = ((d.toLPrime hd).sumSq : ℚ) / (d.toLPrime hd).LStar := by
  rw [LPrime.sumSq_div_LStar]
  rfl

end Link

namespace ThetaPmEllNFHodgeTheater

/-- Share the étale-like data (`Π_v`, `G_v`) and the capsule basepoints of
`dom` with `cod`, keeping `cod`'s Frobenius-like monoids. -/
def shareBasepoints (src dst : List CapsuleMember) : List CapsuleMember :=
  List.zipWith (fun s t => { t with basepoint := s.basepoint }) src dst

theorem shareBasepoints_map_label (src dst : List CapsuleMember) (h : src.length = dst.length) :
    (shareBasepoints src dst).map (·.label) = dst.map (·.label) := by
  induction src generalizing dst with
  | nil => cases dst with
    | nil => rfl
    | cons _ _ => simp at h
  | cons s ss ih => cases dst with
    | nil => simp at h
    | cons t ts =>
      simp only [shareBasepoints, List.zipWith_cons_cons, List.map_cons, List.cons.injEq, true_and]
      exact ih ts (by simpa using h)

theorem shareBasepoints_map_basepoint (src dst : List CapsuleMember)
    (h : src.length = dst.length) :
    (shareBasepoints src dst).map (·.basepoint) = src.map (·.basepoint) := by
  induction src generalizing dst with
  | nil => rfl
  | cons s ss ih => cases dst with
    | nil => simp at h
    | cons t ts =>
      simp only [shareBasepoints, List.zipWith_cons_cons, List.map_cons, List.cons.injEq, true_and]
      exact ih ts (by simpa using h)

theorem shareBasepoints_length (src dst : List CapsuleMember) (h : src.length = dst.length) :
    (shareBasepoints src dst).length = dst.length := by
  simp [shareBasepoints, h]

/-- The `p`-adic valuation of a generator of the log-shell
`I_v = (p*)⁻¹ log(O×_{K_v})`: `log(1 + p^λ O) = p^λ O` once `λ > e/(p−1)`,
so with `λ_min = ⌊e/(p−1)⌋ + 1` (in units of the valuation of a uniformizer)
the radius is `(λ_min − k* e)/e` where `p* = p^{k*}` ([IUTchIII] Def 1.1 (i);
[AbsTopIII] Def 5.4 (iii)). -/
def logShellRadius (v : Valuation) : ℚ :=
  if v.kind = .arch then 0
  else
    let e : ℕ := if v.eK = 0 then 1 else v.eK
    let lam : ℕ := e / (v.p - 1) + 1
    let kstar : ℕ := if v.p = 2 then 2 else 1
    ((lam : ℚ) - kstar * e) / e

/-- The log-shells constructed by a log-link out of the vertex `(n, m)`:
one per `v ∈ V`, holomorphic and Frobenius-like ([IUTchIII] Prop 1.2). -/
def logShells (d : InitialThetaData) (n m : ℤ) : List LogShell :=
  d.V.mapIdx fun i v => ⟨i, v.pStar, logShellRadius v, true, false, n, m⟩

@[simp] theorem logShells_length (d : InitialThetaData) (n m : ℤ) :
    (logShells d n m).length = d.V.length := by simp [logShells]

/-- **The log-link** `dom = {n,m}HT → cod = {n,m+1}HT` ([IUTchIII] Def 1.1,
Prop 1.3; `iut_apply_log_link`): the codomain *shares the étale-like data*
of every strip of the domain (`Π_v`, `G_v`, capsule basepoints — vertical
coricity, [IUTchIII] Thm 1.5 (i)), keeps its own fresh Frobenius-like monoids
(the ring structures are not identified: Ind3), and receives the log-shells.
The result is the new codomain. -/
def applyLogLink (dom cod : ThetaPmEllNFHodgeTheater) : ThetaPmEllNFHodgeTheater :=
  { cod with
    pmell :=
      { cod.pmell with
        T := shareBasepoints dom.pmell.T cod.pmell.T
        FBoxPlus := shareEtale dom.pmell.FBoxPlus cod.pmell.FBoxPlus
        DCircDotPm := shareEtale dom.pmell.DCircDotPm cod.pmell.DCircDotPm }
    nf :=
      { cod.nf with
        J := shareBasepoints dom.nf.J cod.nf.J
        FGt := shareEtale dom.nf.FGt cod.nf.FGt
        FCircAst := shareEtale dom.nf.FCircAst cod.nf.FCircAst
        tht :=
          { cod.nf.tht with
            FMonoGlobMod := shareEtale dom.nf.tht.FMonoGlobMod cod.nf.tht.FMonoGlobMod
            FMonoGlobTht := shareEtale dom.nf.tht.FMonoGlobTht cod.nf.tht.FMonoGlobTht } }
    FMonoGlobTriangle := shareEtale dom.FMonoGlobTriangle cod.FMonoGlobTriangle
    FMonoGlobEnv := shareEtale dom.FMonoGlobEnv cod.FMonoGlobEnv
    FMonoGlobGau := shareEtale dom.FMonoGlobGau cod.FMonoGlobGau
    FMonoGlobLGP := shareEtale dom.FMonoGlobLGP cod.FMonoGlobLGP
    FMonoGlobLgp := shareEtale dom.FMonoGlobLgp cod.FMonoGlobLgp
    shell := logShells dom.data dom.n dom.m
    hasIncomingLog := true
    logIterate := dom.logIterate + 1 }

/-- Share `G_v` and the Frobenius-like monoid of `src` with `dst`, but *not*
`Π_v`: the gluing data `(aΘ)` of a Θ-link. -/
def shareGUnits (src dst : PrimeStrip) : PrimeStrip :=
  { dst with loc := List.zipWith (fun s t => { t with G := s.G, units := s.units }) src.loc dst.loc }

@[simp] theorem shareGUnits_kind (src dst : PrimeStrip) : (shareGUnits src dst).kind = dst.kind := rfl

theorem shareGUnits_loc_getElem (src dst : PrimeStrip) (i : ℕ)
    (hi : i < (shareGUnits src dst).loc.length) :
    (shareGUnits src dst).loc[i] =
      { dst.loc[i]'(by simp [shareGUnits] at hi; omega) with
        G := (src.loc[i]'(by simp [shareGUnits] at hi; omega)).G,
        units := (src.loc[i]'(by simp [shareGUnits] at hi; omega)).units } := by
  simp [shareGUnits]

theorem _root_.IUT.LocalDatum.check_update_GUnits (k k' : PrimeStripKind) (s t : LocalDatum)
    (hk : k.isEtaleLike = k'.isEtaleLike) (hs : s.check k = true) (ht : t.check k' = true) :
    ({ t with G := s.G, units := s.units } : LocalDatum).check k' = true := by
  unfold LocalDatum.check LocalDatum.checks at hs ht ⊢
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id] at hs ht ⊢
  rw [hk] at hs
  exact ⟨ht.1, ht.2.1, hs.2.2.1, hs.2.2.2.1, ht.2.2.2.2.1, ht.2.2.2.2.2.1, ht.2.2.2.2.2.2.1,
    ht.2.2.2.2.2.2.2.1, ht.2.2.2.2.2.2.2.2⟩

theorem shareGUnits_wellFormed (d : InitialThetaData) (src dst : PrimeStrip)
    (hk : src.kind.isEtaleLike = dst.kind.isEtaleLike)
    (hs : src.WellFormed d) (ht : dst.WellFormed d) : (shareGUnits src dst).WellFormed d := by
  unfold PrimeStrip.WellFormed PrimeStrip.check at hs ht ⊢
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true] at hs ht
  obtain ⟨⟨⟨hslen, hsloc⟩, _⟩, _⟩ := hs
  obtain ⟨⟨⟨htlen, htloc⟩, htglob⟩, htdeg⟩ := ht
  simp only [Bool.and_eq_true, beq_iff_eq, List.all_eq_true, shareGUnits_kind]
  refine ⟨⟨⟨by simp [shareGUnits, hslen, htlen], ?_⟩, htglob⟩, htdeg⟩
  intro L hL
  rw [List.mem_iff_getElem] at hL
  obtain ⟨i, hi, rfl⟩ := hL
  rw [shareGUnits_loc_getElem]
  exact LocalDatum.check_update_GUnits _ _ _ _ hk
    (hsloc _ (List.getElem_mem (by simp [shareGUnits] at hi; omega)))
    (htloc _ (List.getElem_mem (by simp [shareGUnits] at hi; omega)))

/-- The strip of the domain that a Θ-type link of kind `k` glues: `†F⊩_tht`
for the Θ-link, `†F⊩_env`, `†F⊩_gau`, `†F⊩_LGP`, `†F⊩_lgp` for the `×μ`-variants. -/
def thetaSource (k : LinkKind) (dom : ThetaPmEllNFHodgeTheater) : PrimeStrip :=
  match k with
  | .ThetaLink => dom.nf.tht.FMonoGlobTht
  | .ThetaUnitsModTorsLink => dom.FMonoGlobEnv
  | .ThetaUnitsModTorsGauLink => dom.FMonoGlobGau
  | .ThetaUnitsModTorsLgpIdealLink => dom.FMonoGlobLgp
  | _ => dom.FMonoGlobLGP

/-- **A Θ-type link** `dom = {n,m}HT → cod = {n+1,m}HT` ([IUTchI] Cor 3.7;
[IUTchII] Cor 4.10 (iii); [IUTchIII] Def 3.8 (ii); `iut_apply_theta_link`):
`†F⊩_LGP ≅ ‡F⊩_Δ`, i.e. `{q̲_v^{j²}}_{j=1..l*} ↦ {q̲_v}`.  `(aΘ)` the unit
groups `G_v ↷ O×μ` are glued (horizontally coric, up to `Ism` = Ind2); `(bΘ)`
the value groups are *not* compatible (the dilation); `Π_v` is *not* shared:
the two sides are mutually alien.  For the plain Θ-link the glued strips are
`†F⊩_tht ≅ ‡F⊩_mod`.  The result is the new codomain. -/
def applyThetaLink (k : LinkKind) (dom cod : ThetaPmEllNFHodgeTheater) :
    ThetaPmEllNFHodgeTheater :=
  if k = .ThetaLink then
    { cod with
      nf := { cod.nf with
        tht := { cod.nf.tht with
          FMonoGlobMod := shareGUnits (thetaSource k dom) cod.nf.tht.FMonoGlobMod } } }
  else
    { cod with FMonoGlobTriangle := shareGUnits (thetaSource k dom) cod.FMonoGlobTriangle }

/-! ### Well-formedness is preserved by the links -/

/-- Extract the kind of a strip of a well-formed Hodge theater (helper). -/
theorem wellFormed_strips (ht : ThetaPmEllNFHodgeTheater) (h : ht.WellFormed) :
    ht.pmell.FBoxPlus.WellFormed ht.data ∧ ht.pmell.FBoxPlus.kind = .FPrimeStrip ∧
    ht.pmell.DCircDotPm.WellFormed ht.data ∧ ht.pmell.DCircDotPm.kind = .DPrimeStrip ∧
    ht.nf.FGt.WellFormed ht.data ∧ ht.nf.FGt.kind = .FPrimeStrip ∧
    ht.nf.FCircAst.WellFormed ht.data ∧ ht.nf.FCircAst.kind = .FPrimeStrip ∧
    ht.nf.tht.FMonoGlobMod.WellFormed ht.data ∧ ht.nf.tht.FMonoGlobMod.kind = .FMonoGlobPrimeStrip ∧
    ht.nf.tht.FMonoGlobTht.WellFormed ht.data ∧ ht.nf.tht.FMonoGlobTht.kind = .FMonoGlobPrimeStrip ∧
    ht.FMonoGlobTriangle.WellFormed ht.data ∧
    ht.FMonoGlobTriangle.kind = .FMonoGlobValUnitsModTorsPrimeStrip ∧
    ht.FMonoGlobEnv.WellFormed ht.data ∧ ht.FMonoGlobEnv.kind = .FMonoGlobValUnitsModTorsPrimeStrip ∧
    ht.FMonoGlobGau.WellFormed ht.data ∧ ht.FMonoGlobGau.kind = .FMonoGlobValUnitsModTorsPrimeStrip ∧
    ht.FMonoGlobLGP.WellFormed ht.data ∧
    ht.FMonoGlobLGP.kind = .FMonoGlobValUnitsModTorsPrimeStrip ∧
    ht.FMonoGlobLgp.WellFormed ht.data ∧
    ht.FMonoGlobLgp.kind = .FMonoGlobValUnitsModTorsPrimeStrip := by
  unfold WellFormed check checks at h
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq] at h
  obtain ⟨_, _, _, _, _, _, hBox, hBoxk, hCirc, hCirck, _, _, _, _, hGt, hGtk, hAst, hAstk, hM, hMk,
    hTh, hThk, _, _, _, hTri, hTrik, hE, hEk, hGa, hGak, hL, hLk, hLg, hLgk, _⟩ := h
  exact ⟨hBox, hBoxk, hCirc, hCirck, hGt, hGtk, hAst, hAstk, hM, hMk, hTh, hThk, hTri, hTrik, hE,
    hEk, hGa, hGak, hL, hLk, hLg, hLgk⟩

/-- **The log-link preserves well-formedness.**  The codomain of a log-link
between well-formed Hodge theaters over the same initial Θ-data is a
well-formed Hodge theater (with its log-shells). -/
theorem applyLogLink_wellFormed (dom cod : ThetaPmEllNFHodgeTheater) (hdom : dom.WellFormed)
    (hcod : cod.WellFormed) (hdata : dom.data = cod.data) : (applyLogLink dom cod).WellFormed := by
  obtain ⟨dBox, dBoxk, dCirc, dCirck, dGt, dGtk, dAst, dAstk, dM, dMk, dTh, dThk, dTri, dTrik, dE,
    dEk, dGa, dGak, dL, dLk, dLg, dLgk⟩ := wellFormed_strips dom hdom
  unfold WellFormed check checks at hdom hcod ⊢
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq,
    List.all_eq_true, Bool.or_eq_true, Bool.not_eq_true'] at hdom hcod ⊢
  obtain ⟨dT1, _, _, dT4, _, _, _, _, _, _, dJ1, _⟩ := hdom
  obtain ⟨cT1, cT2, cT3, cT4, cB1, cB2, cBox, cBoxk, cCirc, cCirck, cJ1, cJ2, cB3, cB4, cGt, cGtk,
    cAst, cAstk, cM, cMk, cTh, cThk, cV, cG, cJ3, cTri, cTrik, cE, cEk, cGa, cGak, cL, cLk, cLg,
    cLgk, cq1, cq2, ct1, ct2, _⟩ := hcod
  have hTlen : dom.pmell.T.length = cod.pmell.T.length := by rw [dT1, cT1, hdata]
  have hJlen : dom.nf.J.length = cod.nf.J.length := by rw [dJ1, cJ1, hdata]
  rw [hdata] at dBox dCirc dGt dAst dM dTh dTri dE dGa dL dLg
  simp only [applyLogLink]
  refine ⟨?_, ?_, ?_, ?_, cB1, cB2, ?_, cBoxk, ?_, cCirck, ?_, ?_, cB3, cB4, ?_, cGtk, ?_, cAstk,
    ?_, cMk, ?_, cThk, cV, cG, ?_, ?_, cTrik, ?_, cEk, ?_, cGak, ?_, cLk, ?_, cLgk, cq1, cq2, ct1,
    ct2, Or.inr ?_⟩
  · rw [shareBasepoints_length _ _ hTlen, cT1]
  · intro c hc
    have : c.label ∈ (shareBasepoints dom.pmell.T cod.pmell.T).map (·.label) :=
      List.mem_map_of_mem hc
    rw [shareBasepoints_map_label _ _ hTlen, List.mem_map] at this
    obtain ⟨c', hc', hl⟩ := this
    rw [← hl]
    exact cT2 c' hc'
  · exact decide_eq_true (by rw [shareBasepoints_map_label _ _ hTlen]; exact of_decide_eq_true cT3)
  · exact decide_eq_true (by rw [shareBasepoints_map_basepoint _ _ hTlen]; exact of_decide_eq_true dT4)
  · exact shareEtale_wellFormed _ _ _ (by rw [dBoxk, cBoxk]) dBox cBox
  · exact shareEtale_wellFormed _ _ _ (by rw [dCirck, cCirck]) dCirc cCirc
  · rw [shareBasepoints_length _ _ hJlen, cJ1]
  · intro c hc
    have : c.label ∈ (shareBasepoints dom.nf.J cod.nf.J).map (·.label) :=
      List.mem_map_of_mem hc
    rw [shareBasepoints_map_label _ _ hJlen, List.mem_map] at this
    obtain ⟨c', hc', hl⟩ := this
    rw [← hl]
    exact cJ2 c' hc'
  · exact shareEtale_wellFormed _ _ _ (by rw [dGtk, cGtk]) dGt cGt
  · exact shareEtale_wellFormed _ _ _ (by rw [dAstk, cAstk]) dAst cAst
  · exact shareEtale_wellFormed _ _ _ (by rw [dMk, cMk]) dM cM
  · exact shareEtale_wellFormed _ _ _ (by rw [dThk, cThk]) dTh cTh
  · intro c hc
    have : c.label ∈ (shareBasepoints dom.nf.J cod.nf.J).map (·.label) :=
      List.mem_map_of_mem hc
    rw [shareBasepoints_map_label _ _ hJlen, List.mem_map] at this
    obtain ⟨c', hc', hl⟩ := this
    refine decide_eq_true ?_
    rw [← hl, shareBasepoints_map_label _ _ hTlen]
    exact of_decide_eq_true (cJ3 c' hc')
  · exact shareEtale_wellFormed _ _ _ (by rw [dTrik, cTrik]) dTri cTri
  · exact shareEtale_wellFormed _ _ _ (by rw [dEk, cEk]) dE cE
  · exact shareEtale_wellFormed _ _ _ (by rw [dGak, cGak]) dGa cGa
  · exact shareEtale_wellFormed _ _ _ (by rw [dLk, cLk]) dL cL
  · exact shareEtale_wellFormed _ _ _ (by rw [dLgk, cLgk]) dLg cLg
  · rw [logShells_length, hdata]

/-- The source strip of a Θ-type link is a well-formed Frobenius-like strip. -/
theorem thetaSource_wellFormed (k : LinkKind) (dom : ThetaPmEllNFHodgeTheater)
    (hdom : dom.WellFormed) :
    (thetaSource k dom).WellFormed dom.data ∧ (thetaSource k dom).kind.isEtaleLike = false := by
  obtain ⟨_, _, _, _, _, _, _, _, _, _, dTh, dThk, _, _, dE, dEk, dGa, dGak, dL, dLk, dLg, dLgk⟩ :=
    wellFormed_strips dom hdom
  cases k <;> simp only [thetaSource] <;>
    first
    | exact ⟨dTh, by rw [dThk]; rfl⟩
    | exact ⟨dE, by rw [dEk]; rfl⟩
    | exact ⟨dGa, by rw [dGak]; rfl⟩
    | exact ⟨dLg, by rw [dLgk]; rfl⟩
    | exact ⟨dL, by rw [dLk]; rfl⟩

/-- **A Θ-type link preserves well-formedness.** -/
theorem applyThetaLink_wellFormed (k : LinkKind) (dom cod : ThetaPmEllNFHodgeTheater)
    (hdom : dom.WellFormed) (hcod : cod.WellFormed) (hdata : dom.data = cod.data) :
    (applyThetaLink k dom cod).WellFormed := by
  obtain ⟨hs, hsk⟩ := thetaSource_wellFormed k dom hdom
  rw [hdata] at hs
  unfold WellFormed check checks at hcod ⊢
  simp only [List.all_cons, List.all_nil, Bool.and_true, Bool.and_eq_true, id, beq_iff_eq,
    List.all_eq_true, Bool.or_eq_true, Bool.not_eq_true'] at hcod ⊢
  obtain ⟨cT1, cT2, cT3, cT4, cB1, cB2, cBox, cBoxk, cCirc, cCirck, cJ1, cJ2, cB3, cB4, cGt, cGtk,
    cAst, cAstk, cM, cMk, cTh, cThk, cV, cG, cJ3, cTri, cTrik, cE, cEk, cGa, cGak, cL, cLk, cLg,
    cLgk, cq1, cq2, ct1, ct2, csh⟩ := hcod
  by_cases hk : k = .ThetaLink
  · simp only [applyThetaLink, hk, ↓reduceIte]
    rw [hk] at hs hsk
    refine ⟨cT1, cT2, cT3, cT4, cB1, cB2, cBox, cBoxk, cCirc, cCirck, cJ1, cJ2, cB3, cB4, cGt, cGtk,
      cAst, cAstk, ?_, cMk, cTh, cThk, cV, cG, cJ3, cTri, cTrik, cE, cEk, cGa, cGak, cL, cLk, cLg,
      cLgk, cq1, cq2, ct1, ct2, csh⟩
    exact shareGUnits_wellFormed _ _ _ (by rw [hsk, cMk]; rfl) hs cM
  · simp only [applyThetaLink, hk, ↓reduceIte]
    refine ⟨cT1, cT2, cT3, cT4, cB1, cB2, cBox, cBoxk, cCirc, cCirck, cJ1, cJ2, cB3, cB4, cGt, cGtk,
      cAst, cAstk, cM, cMk, cTh, cThk, cV, cG, cJ3, ?_, cTrik, cE, cEk, cGa, cGak, cL, cLk, cLg,
      cLgk, cq1, cq2, ct1, ct2, csh⟩
    exact shareGUnits_wellFormed _ _ _ (by rw [hsk, cTrik]; rfl) hs cTri

/-! ### Coricity and alienness, literally -/

/-- **Vertical coricity** ([IUTchIII] Thm 1.5 (i)): after a log-link, the copy
of `Π_v` in `F_>` of the codomain is the copy of the domain. -/
theorem applyLogLink_shares_Pi (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (applyLogLink dom cod).nf.FGt.loc.length) :
    ((applyLogLink dom cod).nf.FGt.loc[i]).Pi =
      (dom.nf.FGt.loc[i]'(by simp [applyLogLink] at hi; omega)).Pi := by
  simp [applyLogLink, shareEtale]

/-- After a log-link, the copy of `G_v` in `F⊩_Δ` of the codomain is the copy
of the domain (`D⊢` is vertically coric). -/
theorem applyLogLink_shares_G (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (applyLogLink dom cod).FMonoGlobTriangle.loc.length) :
    ((applyLogLink dom cod).FMonoGlobTriangle.loc[i]).G =
      (dom.FMonoGlobTriangle.loc[i]'(by simp [applyLogLink] at hi; omega)).G := by
  simp [applyLogLink, shareEtale]

/-- **The log-link does not identify the Frobenius-like monoids** (Ind3): the
units of `F⊩_Δ` in the codomain are the codomain's own. -/
theorem applyLogLink_fresh_units (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (applyLogLink dom cod).FMonoGlobTriangle.loc.length) :
    ((applyLogLink dom cod).FMonoGlobTriangle.loc[i]).units =
      (cod.FMonoGlobTriangle.loc[i]'(by simp [applyLogLink] at hi; omega)).units := by
  simp [applyLogLink, shareEtale]

/-- The log-link builds one log-shell per `v ∈ V` in the codomain. -/
theorem applyLogLink_shell_length (dom cod : ThetaPmEllNFHodgeTheater) :
    (applyLogLink dom cod).shell.length = dom.data.V.length := by
  simp [applyLogLink]

/-- The log-link increments the number of log-iterates along the column. -/
theorem applyLogLink_logIterate (dom cod : ThetaPmEllNFHodgeTheater) :
    (applyLogLink dom cod).logIterate = dom.logIterate + 1 := rfl

/-- **Horizontal coricity** ([IUTchII] Cor 4.10 (aΘ); [IUTchIII] Thm 1.5 (ii)):
after a `Θ×μ_LGP`-link, the copy of `O×μ` in `‡F⊩_Δ` is the copy of `†F⊩_LGP`. -/
theorem applyThetaLink_shares_units (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom cod).FMonoGlobTriangle.loc.length) :
    ((applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom cod).FMonoGlobTriangle.loc[i]).units =
      (dom.FMonoGlobLGP.loc[i]'(by simp [applyThetaLink, shareGUnits, thetaSource] at hi; omega)).units := by
  simp [applyThetaLink, shareGUnits, thetaSource]

/-- After a `Θ×μ_LGP`-link, the copy of `G_v` in `‡F⊩_Δ` is the copy of
`†F⊩_LGP` (`G_v` is horizontally coric, up to Ind1). -/
theorem applyThetaLink_shares_G (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom cod).FMonoGlobTriangle.loc.length) :
    ((applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom cod).FMonoGlobTriangle.loc[i]).G =
      (dom.FMonoGlobLGP.loc[i]'(by simp [applyThetaLink, shareGUnits, thetaSource] at hi; omega)).G := by
  simp [applyThetaLink, shareGUnits, thetaSource]

/-- **A Θ-link never touches the holomorphic structure**: the holomorphic
strips (`F_>`, with its `Π_v`) of the codomain are untouched. -/
theorem applyThetaLink_FGt (k : LinkKind) (dom cod : ThetaPmEllNFHodgeTheater) :
    (applyThetaLink k dom cod).nf.FGt = cod.nf.FGt := by
  unfold applyThetaLink
  split_ifs <;> rfl

/-- **Mutually alien copies** ([Alien] §1): across a Θ-link between Hodge
theaters built in distinct universes, the copies of `Π_v` in `F_>` are
different copies — the holomorphic structures on the two sides are never
identified. -/
theorem applyThetaLink_alien (k : LinkKind) (d : InitialThetaData) (n m n' m' : ℤ) (u u' : ℕ)
    (huu : u ≠ u') (i : ℕ) (hi : i < d.V.length) :
    ((applyThetaLink k (build d n m u) (build d n' m' u')).nf.FGt.loc[i]'(by
        rw [applyThetaLink_FGt]; simp [build, glue]; omega)).Pi ≠
      ((build d n m u).nf.FGt.loc[i]'(by simp [build, glue]; omega)).Pi := by
  have h1 : (applyThetaLink k (build d n m u) (build d n' m' u')).nf.FGt = (build d n' m' u').nf.FGt :=
    applyThetaLink_FGt k _ _
  simp only [h1]
  rw [build_FGt_Pi d n' m' u' i hi, build_FGt_Pi d n m u i hi]
  intro h
  simp only [Option.some.injEq, CopyId.mk.injEq] at h
  exact huu h.1.symm

/-- The vertex `(n+1, m+1)` reached from `(n, m)` by **log then Θ**:
`B' = log(A → B)`, then `Θ×μ_LGP(B' → D)`, where `A`, `B`, `D` are built in the
universes `uA`, `uB`, `uD`. -/
def squareLogTheta (d : InitialThetaData) (n m : ℤ) (uA uB uD : ℕ) : ThetaPmEllNFHodgeTheater :=
  applyThetaLink .ThetaUnitsModTorsLGPTorsorLink
    (applyLogLink (build d n m uA) (build d n (m + 1) uB)) (build d (n + 1) (m + 1) uD)

/-- The vertex `(n+1, m+1)` reached from `(n, m)` by **Θ then log**:
`C' = Θ×μ_LGP(A → C)`, then `log(C' → D)`. -/
def squareThetaLog (d : InitialThetaData) (n m : ℤ) (uA uC uD : ℕ) : ThetaPmEllNFHodgeTheater :=
  applyLogLink (applyThetaLink .ThetaUnitsModTorsLGPTorsorLink (build d n m uA) (build d (n + 1) m uC))
    (build d (n + 1) (m + 1) uD)

@[simp] theorem squareLogTheta_loc_length (d : InitialThetaData) (n m : ℤ) (uA uB uD : ℕ) :
    (squareLogTheta d n m uA uB uD).FMonoGlobTriangle.loc.length = d.V.length := by
  simp [squareLogTheta, applyThetaLink, shareGUnits, thetaSource, applyLogLink, shareEtale, build,
    glue]

@[simp] theorem squareThetaLog_loc_length (d : InitialThetaData) (n m : ℤ) (uA uC uD : ℕ) :
    (squareThetaLog d n m uA uC uD).FMonoGlobTriangle.loc.length = d.V.length := by
  simp [squareThetaLog, applyThetaLink, shareGUnits, thetaSource, applyLogLink, shareEtale, build,
    glue]

/-- Along log-then-Θ, the units of `‡F⊩_Δ` at `(n+1,m+1)` are the units of
`F⊩_LGP` of the vertex `(n, m+1)`. -/
theorem squareLogTheta_units (d : InitialThetaData) (n m : ℤ) (uA uB uD : ℕ) (i : ℕ)
    (hi : i < d.V.length) :
    ((squareLogTheta d n m uA uB uD).FMonoGlobTriangle.loc[i]'(by simp; exact hi)).units =
      some ⟨uB, 83, i, .units⟩ := by
  have hne : LinkKind.ThetaUnitsModTorsLGPTorsorLink ≠ LinkKind.ThetaLink := by decide
  simp only [squareLogTheta, applyThetaLink, ite_eq_right hne, shareGUnits, thetaSource,
    applyLogLink, shareEtale, List.getElem_zipWith]
  rw [build_LGP_units d n (m + 1) uB i hi]

/-- Along Θ-then-log, the units of `‡F⊩_Δ` at `(n+1,m+1)` are the fresh units
of the vertex `(n+1, m+1)` itself (the log-link does not identify units). -/
theorem squareThetaLog_units (d : InitialThetaData) (n m : ℤ) (uA uC uD : ℕ) (i : ℕ)
    (hi : i < d.V.length) :
    ((squareThetaLog d n m uA uC uD).FMonoGlobTriangle.loc[i]'(by simp; exact hi)).units =
      some ⟨uD, 80, i, .units⟩ := by
  simp only [squareThetaLog, applyLogLink, shareEtale, List.getElem_zipWith]
  rw [build_Triangle_units d (n + 1) (m + 1) uD i hi]

/-- **Non-commutativity of the log-theta-lattice** ([IUTchIII] Rem 1.4.1):
going around a square `(n,m) → (n,m+1) → (n+1,m+1)` (log then Θ) and
`(n,m) → (n+1,m) → (n+1,m+1)` (Θ then log) gives *different* data at
`(n+1,m+1)` whenever the vertices live in distinct universes: along the first
path the units of `‡F⊩_Δ` are those of `(n,m+1)`, along the second the fresh
units of `(n+1,m+1)`.  No square of the lattice commutes. -/
theorem square_not_commutative (d : InitialThetaData) (n m : ℤ) (uA uB uC uD : ℕ)
    (hBD : uB ≠ uD) (i : ℕ) (hi : i < d.V.length) :
    ((squareLogTheta d n m uA uB uD).FMonoGlobTriangle.loc[i]'(by simp; exact hi)).units ≠
    ((squareThetaLog d n m uA uC uD).FMonoGlobTriangle.loc[i]'(by simp; exact hi)).units := by
  rw [squareLogTheta_units d n m uA uB uD i hi, squareThetaLog_units d n m uA uC uD i hi]
  intro h
  simp only [Option.some.injEq, CopyId.mk.injEq] at h
  exact hBD h.1

end ThetaPmEllNFHodgeTheater

end IUT
