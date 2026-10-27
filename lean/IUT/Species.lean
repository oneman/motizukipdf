/-
# Species and mutations

Port of `iut_species_table` and `iut_mutation_table` (`src/iut_ids.c`,
`src/iut.h`) to Lean: the *species* (set-theoretic formulas Φ₀ defining the
kinds of mathematical objects of the theory) and the *mutations* (functorial
constructions between species) of [IUTchIV] §3, together with the notion of a
*mutation-history* and the observation that the log-theta-lattice is one.

Main results:

* `species_length`, `mutations_length`: the tables have 19 and 13 entries;
* `species_lettersOnly`, `mutations_lettersOnly`, `species_id_nodup`,
  `mutations_id_nodup`: identifiers are English-letters-only and distinct;
* `species_ids_mem_identifiers`, `mutations_ids_mem_identifiers`: which
  species and mutation identifiers are entries of the master identifier table
  of `docs/IDENTIFIERS.md` (all links are; the forgetful constructions are
  named only here);
* `mutations_endpoints`: every mutation goes from a species of the table to a
  species of the table;
* `MutationHistory.WellFormed`: consecutive mutations compose; the
  log-theta-lattice path `log, Θ×μ_LGP, log` is a well-formed history
  (`latticeHistory_wellFormed`);
* `core_count`: exactly four mutations are *core* (all of whose evaluations
  are isomorphisms), and `core_realised` records that their Lean
  realisations (`forgetToD`, `PrimeStrip.forget`) preserve well-formedness.
-/
import IUT.Multiradial

namespace IUT

/-- `iut_species`: a species ([IUTchIV] §3): a set-theoretic formula Φ₀
defining a kind of mathematical object. -/
structure Species where
  /-- letters-only identifier -/
  id : String
  name : String
  ref : String
  /-- informal description of the formula Φ₀ -/
  speciesData : String
  deriving DecidableEq, Repr

/-- `iut_mutation`: a mutation ([IUTchIV] §3): a functorial construction from
one species to another. -/
structure Mutation where
  id : String
  name : String
  /-- domain species id -/
  dom : String
  /-- codomain species id -/
  cod : String
  ref : String
  /-- a *core* mutation: all of its evaluations are isomorphisms -/
  isCore : Bool
  deriving DecidableEq, Repr

/-- The species table (19 entries), generated from `src/iut_ids.c`. -/
def species : List Species := [
  ⟨"InitialThetaData", "initial Θ-data", "[IUTchI] Def 3.1", "(F̄/F, X_F, l, C_K, V, V^bad_mod, ε̲) satisfying the conditions of Def 3.1"⟩,
  ⟨"ThetaPmEllNFHodgeTheater", "Θ±ell NF-Hodge theater", "[IUTchI] Def 6.13", "Θ±ell-HT glued to ΘNF-HT (a vertex • of the lattice)"⟩,
  ⟨"DThetaPmEllNFHodgeTheater", "D-Θ±ell NF-Hodge theater", "[IUTchI] Def 6.13", "base categories only: étale-like, vertically coric"⟩,
  ⟨"ThetaPmEllHodgeTheater", "Θ±ell-Hodge theater", "[IUTchI] Def 6.13", "additive symmetry F_l^{⋊±}; capsule indexed by F_l"⟩,
  ⟨"ThetaNFHodgeTheater", "ΘNF-Hodge theater", "[IUTchI] Def 5.5", "multiplicative symmetry F_l^*; capsule indexed by F_l^*"⟩,
  ⟨"ThetaHodgeTheater", "Θ-Hodge theater", "[IUTchI] Def 3.6", "(F⊩_mod, F⊩_tht)"⟩,
  ⟨"DPrimeStrip", "D-prime-strip", "[IUTchI] Def 4.1", "{Π_v}_{v∈V}"⟩,
  ⟨"DMonoPrimeStrip", "D⊢-prime-strip", "[IUTchI] Def 4.1", "{G_v}_{v∈V}"⟩,
  ⟨"FPrimeStrip", "F-prime-strip", "[IUTchI] Def 5.2", "{Π_v ↷ O▷}"⟩,
  ⟨"FMonoPrimeStrip", "F⊢-prime-strip", "[IUTchI] Def 5.2", "{G_v ↷ O▷} split"⟩,
  ⟨"FMonoUnitsModTorsPrimeStrip", "F⊢×μ-prime-strip", "[IUTchII] Def 4.9", "{G_v ↷ O×μ} + ×μ-Kummer structure"⟩,
  ⟨"FMonoValUnitsModTorsPrimeStrip", "F⊢▶×μ-prime-strip", "[IUTchII] Def 4.9", "{G_v ↷ O▶ × O×μ}"⟩,
  ⟨"FMonoGlobPrimeStrip", "F⊩-prime-strip", "[IUTchI] Def 5.2", "F⊢ + global realified Frobenioid"⟩,
  ⟨"FMonoGlobValUnitsModTorsPrimeStrip", "F⊩▶×μ-prime-strip", "[IUTchII] Def 4.9", "F⊢▶×μ + global realified Frobenioid"⟩,
  ⟨"LogShell", "log-shell", "[IUTchIII] Def 1.1", "(p*)^{-1} log(O×_{K_v})"⟩,
  ⟨"TensorPacket", "tensor packet of log-shells", "[IUTchIII] Prop 3.1", "⊗ of log-shells over S^±_{j+1}"⟩,
  ⟨"QPilot", "q-pilot object", "[IUTchIII] Def 3.8", "{q̲_v}"⟩,
  ⟨"ThetaPilot", "Θ-pilot object", "[IUTchIII] Def 3.8", "{q̲_v^{j²}}_{j=1..l*}"⟩,
  ⟨"MultiradialRepresentation", "multiradial representation R^LGP", "[IUTchIII] Thm 3.11", "(a) tensor packets (b) splitting monoids (c) (F_mod^×)_j, up to Ind1-3"⟩
]

/-- The mutation table (13 entries), generated from `src/iut_ids.c`. -/
def mutations : List Mutation := [
  ⟨"LogLink", "log-link", "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 1.1", false⟩,
  ⟨"ThetaUnitsModTorsLGPTorsorLink", "Θ×μ_LGP-link", "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 3.8", false⟩,
  ⟨"ThetaUnitsModTorsLgpIdealLink", "Θ×μ_lgp-link", "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchIII] Def 3.8", false⟩,
  ⟨"ThetaUnitsModTorsGauLink", "Θ×μ_gau-link", "ThetaPmEllNFHodgeTheater", "ThetaPmEllNFHodgeTheater", "[IUTchII] Cor 4.10", false⟩,
  ⟨"ThetaLink", "Θ-link", "ThetaHodgeTheater", "ThetaHodgeTheater", "[IUTchI] Cor 3.7", false⟩,
  ⟨"ForgetToD", "HT ↦ D-HT", "ThetaPmEllNFHodgeTheater", "DThetaPmEllNFHodgeTheater", "[IUTchI] Def 6.13", true⟩,
  ⟨"ForgetToDMono", "F ↦ D⊢", "FPrimeStrip", "DMonoPrimeStrip", "[IUTchI] Def 5.2", true⟩,
  ⟨"ForgetToUnitsModTors", "F⊩ ↦ F⊢×μ", "FMonoGlobPrimeStrip", "FMonoUnitsModTorsPrimeStrip", "[IUTchII] Def 4.9", true⟩,
  ⟨"LogShellConstruction", "F ↦ I", "FPrimeStrip", "LogShell", "[IUTchIII] Prop 1.2", false⟩,
  ⟨"EtaleLogShellConstruction", "D ↦ I(D)", "DPrimeStrip", "LogShell", "[IUTchIII] Prop 1.2", true⟩,
  ⟨"TensorPacketConstruction", "{I_t} ↦ ⊗", "LogShell", "TensorPacket", "[IUTchIII] Prop 3.1", false⟩,
  ⟨"KummerDetachment", "Frobenius-like ↦ étale-like", "FMonoGlobPrimeStrip", "DThetaPmEllNFHodgeTheater", "[IUTchIII] Rem 1.5.4", false⟩,
  ⟨"MultiradialAlgorithm", "Thm 3.11", "ThetaPilot", "MultiradialRepresentation", "[IUTchIII] Thm 3.11", false⟩
]

namespace Species

theorem species_length : species.length = 19 := by rfl

theorem mutations_length : mutations.length = 13 := by rfl

/-- Species identifiers are English-letters-only. -/
theorem species_lettersOnly : species.all (fun s => lettersOnly s.id) = true := by decide +kernel

/-- Mutation identifiers are English-letters-only. -/
theorem mutations_lettersOnly : mutations.all (fun m => lettersOnly m.id) = true := by decide +kernel

/-- Species identifiers are pairwise distinct (even case-insensitively). -/
theorem species_id_nodup : (species.map fun s => ciKey s.id).Nodup := by decide +kernel

/-- Mutation identifiers are pairwise distinct (even case-insensitively). -/
theorem mutations_id_nodup : (mutations.map fun m => ciKey m.id).Nodup := by decide +kernel

/-- Every species identifier except the top-level `InitialThetaData` is an
entry of the master identifier table of `docs/IDENTIFIERS.md` (the initial
Θ-data is listed there field by field). -/
theorem species_ids_mem_identifiers :
    (species.filter fun s => (findIdent s.id).isNone).map (·.id) = ["InitialThetaData"] := by
  decide +kernel

/-- The mutation identifiers that are links of the lattice are entries of the
master identifier table; the remaining (constructive / forgetful) mutations
are named only in the species table. -/
theorem mutations_ids_mem_identifiers :
    (mutations.filter fun m => (findIdent m.id).isNone).map (·.id) =
      ["ForgetToD", "ForgetToDMono", "ForgetToUnitsModTors", "LogShellConstruction",
        "EtaleLogShellConstruction", "TensorPacketConstruction", "MultiradialAlgorithm"] := by
  decide +kernel

/-- Look up a species by id. -/
def find? (id : String) : Option Species := species.find? (·.id = id)

/-- Look up a mutation by id. -/
def findMutation? (id : String) : Option Mutation := mutations.find? (·.id = id)

/-- **Every mutation goes between species of the table.** -/
theorem mutations_endpoints :
    mutations.all (fun m => (find? m.dom).isSome && (find? m.cod).isSome) = true := by
  decide +kernel

/-- Exactly four mutations are core. -/
theorem core_count : (mutations.filter (·.isCore)).length = 4 := by decide +kernel

/-- The core mutations are the forgetful ones and the étale-like log-shell
construction ([IUTchIV] §3; [IUTchIII] Prop 1.2 (iii)). -/
theorem core_ids : (mutations.filter (·.isCore)).map (·.id) =
    ["ForgetToD", "ForgetToDMono", "ForgetToUnitsModTors", "EtaleLogShellConstruction"] := by
  decide +kernel

/-- The links of the log-theta-lattice are the non-core mutations of Hodge
theaters: every mutation whose domain and codomain are both
`ThetaPmEllNFHodgeTheater` is a link, not core. -/
theorem lattice_links_not_core :
    (mutations.filter fun m =>
      m.dom = "ThetaPmEllNFHodgeTheater" && m.cod = "ThetaPmEllNFHodgeTheater").all (fun m => !m.isCore) =
      true := by
  decide +kernel

/-- The four Hodge-theater links of the mutation table, by id. -/
theorem lattice_links_ids :
    ((mutations.filter fun m =>
      m.dom = "ThetaPmEllNFHodgeTheater" && m.cod = "ThetaPmEllNFHodgeTheater").map (·.id)) =
      ["LogLink", "ThetaUnitsModTorsLGPTorsorLink", "ThetaUnitsModTorsLgpIdealLink",
        "ThetaUnitsModTorsGauLink"] := by
  decide +kernel

/-- Each lattice link id is the identifier of a `LinkKind`. -/
theorem lattice_links_are_LinkKinds :
    ∀ k ∈ [LinkKind.LogLink, .ThetaUnitsModTorsLGPTorsorLink, .ThetaUnitsModTorsLgpIdealLink,
        .ThetaUnitsModTorsGauLink],
      (findMutation? k.ident).isSome = true := by
  decide +kernel

end Species

/-! ### Mutation-histories -/

/-- A **mutation-history** ([IUTchIV] §3): a finite sequence of mutations,
each starting where the previous one ends. -/
structure MutationHistory where
  steps : List Mutation
  deriving Repr

namespace MutationHistory

/-- Consecutive steps compose: `cod` of each step is `dom` of the next. -/
def chained : List Mutation → Bool
  | [] => true
  | [_] => true
  | a :: b :: rest => a.cod == b.dom && chained (b :: rest)

/-- `chained` as a proposition. -/
def Chained (l : List Mutation) : Prop := chained l = true

instance (l : List Mutation) : Decidable (Chained l) := by unfold Chained; infer_instance

/-- A well-formed history: every step is a mutation of the table and the
steps are chained. -/
def WellFormed (h : MutationHistory) : Prop :=
  (∀ m ∈ h.steps, m ∈ mutations) ∧ Chained h.steps

instance (h : MutationHistory) : Decidable h.WellFormed := by unfold WellFormed; infer_instance

/-- The species a history starts from (if non-empty). -/
def source (h : MutationHistory) : Option String := h.steps.head?.map (·.dom)

/-- The species a history ends in (if non-empty). -/
def target (h : MutationHistory) : Option String := h.steps.getLast?.map (·.cod)

/-- The log-theta-lattice as a mutation-history: `log`, then `Θ×μ_LGP`, then
`log` again ([IUTchIII] Def 1.4, Def 3.8 (iii); [IUTchIV] §3). -/
def latticeHistory : MutationHistory :=
  ⟨[mutations[0], mutations[1], mutations[0]]⟩

theorem latticeHistory_wellFormed : latticeHistory.WellFormed := by decide +kernel

/-- The lattice history starts and ends at a `Θ±ell NF`-Hodge theater. -/
theorem latticeHistory_endpoints :
    latticeHistory.source = some "ThetaPmEllNFHodgeTheater" ∧
      latticeHistory.target = some "ThetaPmEllNFHodgeTheater" := by
  decide +kernel

/-- The multiradial algorithm as a history: build a Hodge theater's
`F⊩_LGP` strip, forget to `F⊢×μ`, construct log-shells étale-theoretically,
form tensor packets, run Thm 3.11.  Chaining fails at the first step unless
one passes through the Kummer-detachment — a well-formedness *failure* that
the validator detects. -/
theorem forget_then_logShell_not_chained :
    ¬ Chained [mutations[7], mutations[9]] := by decide +kernel

/-- `D ↦ I(D)` followed by `{I_t} ↦ ⊗` is a well-formed history
(étale-like log-shells, then tensor packets: [IUTchIII] Prop 1.2 (iii), Prop 3.1). -/
theorem etaleLogShell_tensorPacket_wellFormed :
    MutationHistory.WellFormed ⟨[mutations[9], mutations[10]]⟩ := by decide +kernel

end MutationHistory

/-! ### The core mutations are realised by the Lean constructions -/

/-- **The core mutations preserve well-formedness.**  `ForgetToD` is
`ThetaPmEllNFHodgeTheater.forgetToD`, `ForgetToDMono` and
`ForgetToUnitsModTors` are instances of `PrimeStrip.forget`; all three send
well-formed objects to well-formed objects ([IUTchI] Def 5.2, Def 6.13;
[IUTchII] Def 4.9). -/
theorem core_realised :
    (∀ ht : ThetaPmEllNFHodgeTheater, ht.WellFormed →
      (ThetaPmEllNFHodgeTheater.forgetToD ht).WellFormed) ∧
    (∀ (d : InitialThetaData) (ps : PrimeStrip), ps.kind = .FPrimeStrip → ps.WellFormed d →
      (ps.forget .DMonoPrimeStrip).WellFormed d) ∧
    (∀ (d : InitialThetaData) (ps : PrimeStrip), ps.kind = .FMonoGlobPrimeStrip → ps.WellFormed d →
      (ps.forget .FMonoUnitsModTorsPrimeStrip).WellFormed d) :=
  ⟨fun ht h => ThetaPmEllNFHodgeTheater.forgetToD_wellFormed ht h,
    fun d ps hk h => PrimeStrip.forgetToDMono_wellFormed d ps hk h,
    fun d ps hk h => PrimeStrip.forgetToUnitsModTors_wellFormed d ps hk h⟩

end IUT
