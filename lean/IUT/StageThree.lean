import IUT.StageTwo
import IUT.Construction

/-!
# Stage 3 of the LeanForm of IUT: [IUTchI-II] modulo the earlier results (1995–2015)

[FormIUT] §2: *Stage 3: [IUTchI-II] modulo earlier results (1995 - 2015) on
anabelian geometry/Frobenioids/theta functions, etc.*, followed by *Stage 4:
Earlier results (1995 - 2015): [pGC], [GeoAn], [AbsAnb], [NCBel], [AbSc],
[SemiAn], [QuCnf], [CbGC], [Config], [FrdI-II], [EtTh], [GenEll], [NodNon],
[AbsTopI-III]*.  Stage 2 (`IUT.StageTwo`) rested on eleven results of
[IUTchI-II]; this stage is the content of [IUTchI-II] itself — the
construction of the Hodge theaters, the Θ-link, the Galois evaluation of the
theta function, conjugate synchronization, the Kummer isomorphisms and the
Θ×μ-links — *modulo* the earlier papers, which Stage 4 will supply.

This file is the skeletal Lean form of that stage on top of the data model of
this library:

* `EarlierPaper`: the seventeen earlier papers of [FormIUT] §2 with their
  years (`years_range`: all in 1995–2015, `years_sorted`) and their topic
  (anabelian geometry / Frobenioids / theta functions / elliptic curves);
  `earlierResults`: the twenty-two results of those papers that [IUTchI-II]
  rest on, each with its citation (`every_paper_cited`);
* `steps`: the forty-two constructions of [IUTchI-II], which are exactly the
  [IUTchI] and [IUTchII] processes of `docs/PROCESSES.md`
  (`steps_cover_IUTchI_II`, `steps_byPaper`), in an order in which each step
  depends only on earlier steps (`steps_acyclic`), with the earlier results
  each uses (`steps_earlier`, `earlier_used`) and the declarations of this
  library that realise it;
* `feeds_stage_two`: every input of Stage 2 is a step of this stage;
  `earlierClosure`: the earlier results a step rests on, transitively;
  `inputs_rest_on_earlier`: every Stage 2 input rests on some earlier result;
  `elementary_steps`: the only step resting on none is the classification of
  the orbicurves;
* the content of the eight [IUTchII] processes, realised: radial
  environments and multiradialization (`RadialEnv`, Ex 1.7–1.9), the three
  cyclotomic rigidity isomorphisms (`CyclotomicRigidity`, Cor 1.10–1.12:
  multiradial ⟺ no ring structure, the `±1` of constant multiple rigidity is
  `ℤˣ`), **Galois evaluation modulo [EtTh]** (`ThetaEvaluation`: the value
  `q̲^{t²}` at the point labelled `t` is the hypothesis; the `|t|`-dependence,
  the values `1, 4, …, l*²` on `F_l^*` being the exponents of the Θ-pilot,
  each value attained at exactly `±t`, the `μ_{2l}` indeterminacy and the
  tempered indices are theorems), the theta, Gaussian and constant monoids
  with the evaluation and Kummer isomorphisms (`LocalMonoid`, Prop 3.1, Cor
  3.5–3.6, 4.5–4.6), the symmetrizing isomorphisms and conjugate
  synchronization (`Symmetrization`, Cor 3.5 (i), 4.5 (iii), 4.7 (ii)), the
  global realified Frobenioid `D⊩(D⊢)` built from the core
  (`globalRealifiedFromDMono`, Cor 4.5 (ii): well-formed, keeps `G_v`, pilot
  degree `< 0`, coric), the forgetting ladder `F⊩▶×μ → F⊢▶×μ → F⊢×μ → F⊢× →
  D⊢` (`ladder`, Def 4.9: every rung well-formed, `G_v` never forgotten, the
  bottom is the bi-coric `D⊢`), and Cor 4.10 (`F⊩_Δ ≅ F⊩_mod`,
  `F⊩_env ≅ F⊩_tht ≅ F⊩_gau`, the Θ×μ-links, the coric `F⊢×μ`, the induced
  D-link, the coric `D⊩` up to `ℝ_{>0}`, the exponents of Rem 4.11.1).
-/

namespace IUT

namespace StageThree

/-! ## The earlier results (1995–2015): the inputs of Stage 3 -/

/-- The earlier papers of [FormIUT] §2, Stage 4, in the order of its list
(which is chronological). -/
inductive EarlierPaper where
  | pGC | GeoAn | AbsAnb | NCBel | AbSc | SemiAn | QuCnf | CbGC | Config
  | FrdI | FrdII | EtTh | GenEll | NodNon | AbsTopI | AbsTopII | AbsTopIII
  deriving DecidableEq, Repr

/-- The topics of [FormIUT] §2, Stage 3: "anabelian geometry / Frobenioids /
theta functions, etc." -/
inductive Topic where
  | anabelian | frobenioids | theta | elliptic
  deriving DecidableEq, Repr

namespace EarlierPaper

/-- All seventeen, in the order of [FormIUT] §2. -/
def all : List EarlierPaper :=
  [.pGC, .GeoAn, .AbsAnb, .NCBel, .AbSc, .SemiAn, .QuCnf, .CbGC, .Config,
   .FrdI, .FrdII, .EtTh, .GenEll, .NodNon, .AbsTopI, .AbsTopII, .AbsTopIII]

/-- The citation key. -/
def text : EarlierPaper → String
  | .pGC => "pGC" | .GeoAn => "GeoAn" | .AbsAnb => "AbsAnb" | .NCBel => "NCBel"
  | .AbSc => "AbSc" | .SemiAn => "SemiAn" | .QuCnf => "QuCnf" | .CbGC => "CbGC"
  | .Config => "Config" | .FrdI => "FrdI" | .FrdII => "FrdII" | .EtTh => "EtTh"
  | .GenEll => "GenEll" | .NodNon => "NodNon" | .AbsTopI => "AbsTopI"
  | .AbsTopII => "AbsTopII" | .AbsTopIII => "AbsTopIII"

/-- The year of publication ([FormIUT] references). -/
def year : EarlierPaper → ℕ
  | .pGC => 1999 | .GeoAn => 2004 | .AbsAnb => 2004 | .NCBel => 2004 | .AbSc => 2005
  | .SemiAn => 2006 | .QuCnf => 2006 | .CbGC => 2007 | .Config => 2008 | .FrdI => 2008
  | .FrdII => 2008 | .EtTh => 2009 | .GenEll => 2010 | .NodNon => 2011
  | .AbsTopI => 2012 | .AbsTopII => 2013 | .AbsTopIII => 2015

/-- The topic. -/
def topic : EarlierPaper → Topic
  | .FrdI | .FrdII => .frobenioids
  | .EtTh => .theta
  | .GenEll => .elliptic
  | _ => .anabelian

theorem all_length : all.length = 17 := rfl

theorem all_nodup : all.Nodup := by decide

theorem text_injective_on_all : (all.map text).Nodup := by decide

/-- "1995 - 2015": every earlier paper falls in that range. -/
theorem years_range : all.all (fun p => 1995 ≤ p.year && p.year ≤ 2015) = true := by decide

/-- The list of [FormIUT] §2 is chronological. -/
theorem years_sorted : (all.map year).Pairwise (· ≤ ·) := by decide

theorem first_year : all.head?.map year = some 1999 := rfl

theorem last_year : all.getLast?.map year = some 2015 := rfl

/-- Thirteen papers on anabelian geometry, two on Frobenioids, one on the
étale theta function, one on elliptic curves in general position. -/
theorem topic_counts :
    [Topic.anabelian, .frobenioids, .theta, .elliptic].map
      (fun t => (all.filter fun p => p.topic = t).length) = [13, 2, 1, 1] := by
  decide

end EarlierPaper

/-- A result of one of the earlier papers that [IUTchI-II] rest on. -/
structure EarlierResult where
  id : String
  paper : EarlierPaper
  ref : String
  statement : String
  deriving DecidableEq, Repr

/-- The results of the earlier papers used by the steps below. -/
def earlierResults : List EarlierResult := [
  ⟨"pGC.ThmA", .pGC, "[pGC] Thm A",
    "the pro-p Grothendieck conjecture for hyperbolic curves over sub-p-adic fields"⟩,
  ⟨"GeoAn.anabelioids", .GeoAn, "[GeoAn] §1-§2",
    "anabelioids B(G), their morphisms (poly-morphisms), cores and the étale fundamental group"⟩,
  ⟨"AbsAnb.ThmA", .AbsAnb, "[AbsAnb] Thm 2.? (absolute version)",
    "absolute anabelian reconstruction of hyperbolic curves from Π with decomposition groups"⟩,
  ⟨"NCBel.ThmA", .NCBel, "[NCBel] Thm 2.5",
    "noncritical Belyi maps, the input to Belyi cuspidalization"⟩,
  ⟨"AbSc.sections", .AbSc, "[AbSc] §1-§2",
    "Galois sections of Π_X → G_k and decomposition groups of points"⟩,
  ⟨"SemiAn.tempered", .SemiAn, "[SemiAn] §3, §6",
    "semi-graphs of anabelioids, tempered fundamental groups and their coverings"⟩,
  ⟨"QuCnf.arch", .QuCnf, "[QuCnf] §1-§2",
    "categorical representation of hyperbolic Riemann surfaces (the archimedean places)"⟩,
  ⟨"CbGC.ThmA", .CbGC, "[CbGC] Thm A, Cor 2.7",
    "the combinatorial Grothendieck conjecture: verticial / cuspidal subgroups are group-theoretic"⟩,
  ⟨"Config.ThmA", .Config, "[Config] Thm A",
    "anabelian geometry of configuration spaces: fibre subgroups and cuspidal inertia"⟩,
  ⟨"FrdI.general", .FrdI, "[FrdI] §1-§6",
    "Frobenioids: base categories, divisor monoids, Frobenius-like versus étale-like structures"⟩,
  ⟨"FrdII.poly", .FrdII, "[FrdII] §1-§5",
    "poly-Frobenioids, realifications C⊩, the model Frobenioids of local and global fields"⟩,
  ⟨"EtTh.thetaFunction", .EtTh, "[EtTh] §1",
    "the étale theta function Θ̲_v with its l-th roots and its values q̲_v^{t²} at the torsion points"⟩,
  ⟨"EtTh.monoTheta", .EtTh, "[EtTh] §2",
    "mono-theta environments and the cyclotomic rigidity (l·Δ_Θ) ≅ Π_μ via the commutator"⟩,
  ⟨"EtTh.frobenioidTheta", .EtTh, "[EtTh] §3-§5",
    "the Frobenioid-theoretic theta function: tempered Frobenioids and the theta monoids"⟩,
  ⟨"GenEll.ThmA", .GenEll, "[GenEll] Thm 3.8, Cor 4.4",
    "elliptic curves in general position: existence of a prime l satisfying the conditions of Def 3.1"⟩,
  ⟨"NodNon.main", .NodNon, "[NodNon] Thm A, Thm B",
    "combinatorial anabelian geometry of nodally nondegenerate outer representations"⟩,
  ⟨"AbsTopI.cusps", .AbsTopI, "[AbsTopI] Lemma 4.5, Thm 4.? ",
    "group-theoretic reconstruction of the cusps and of the decomposition groups of cusps"⟩,
  ⟨"AbsTopII.decomposition", .AbsTopII, "[AbsTopII] §2-§3",
    "decomposition groups and endomorphisms; Belyi cuspidalization"⟩,
  ⟨"AbsTopIII.monoAnabelian", .AbsTopIII, "[AbsTopIII] Thm 1.9, Cor 1.10",
    "mono-anabelian reconstruction of the function field and the cyclotome M_X from Π (the Θ-approach)"⟩,
  ⟨"AbsTopIII.logShells", .AbsTopIII, "[AbsTopIII] §3, §5, Def 5.4",
    "Kummer theory of MLFs, the p-adic logarithm, log-shells I_v and mono-analytic reconstruction"⟩,
  ⟨"AbsTopIII.cyclotomicRigidity", .AbsTopIII, "[AbsTopIII] Prop 3.2, Rem 3.2.1",
    "cyclotomic rigidity for MLFs via local class field theory, up to Ẑ×"⟩,
  ⟨"AbsTopIII.archimedean", .AbsTopIII, "[AbsTopIII] §2, §4",
    "Aut-holomorphic spaces and the archimedean mono-anabelian reconstruction"⟩
]

theorem earlierResults_length : earlierResults.length = 22 := rfl

theorem earlierResults_id_nodup : (earlierResults.map (·.id)).Nodup := by decide

/-- Every earlier paper of [FormIUT] §2 is cited by some result. -/
theorem every_paper_cited :
    EarlierPaper.all.all (fun p => earlierResults.any (·.paper = p)) = true := by decide

/-- The results per topic: 13 / 2 / 3 / 1 for anabelian geometry /
Frobenioids / theta functions / elliptic curves... see `topic_counts`; the
theta function paper [EtTh] contributes three results. -/
theorem earlierResults_byTopic :
    [Topic.anabelian, .frobenioids, .theta, .elliptic].map
      (fun t => (earlierResults.filter fun r => r.paper.topic = t).length) = [16, 2, 3, 1] := by
  decide

/-! ## The steps: the constructions of [IUTchI-II] -/

/-- The theme of a step: which part of [IUTchI-II] it belongs to. -/
inductive Theme where
  /-- [IUTchI] §1–§2: orbicurves, their coverings, tempered fundamental groups -/
  | anabelianSetup
  /-- [IUTchI] §3, Def 3.1: initial Θ-data -/
  | initialData
  /-- [IUTchI] §3 Ex 3.2–3.5, §5: local and global Frobenioids, the Θ-link -/
  | frobenioids
  /-- [IUTchI] §4–§6: label sets, symmetries, cusps -/
  | labels
  /-- [IUTchI] §4–§6: bridges, Hodge theaters, processions, gluing -/
  | hodgeTheaters
  /-- [IUTchII] §1: radial environments, cyclotomic rigidity -/
  | radial
  /-- [IUTchII] §2–§3: Galois evaluation, theta and Gaussian monoids -/
  | evaluation
  /-- [IUTchII] §4: constant monoids, symmetrizing isomorphisms, the ladder, the Θ×μ-links -/
  | monoAnalytic
  deriving DecidableEq, Repr

/-- One step of Stage 3: a construction of [IUTchI-II], identified with its
process of `docs/PROCESSES.md`. -/
structure Step where
  id : String
  paper : Paper
  ref : String
  theme : Theme
  /-- the steps it builds on (ids of earlier steps) -/
  dependsOn : List String
  /-- the earlier results it uses (ids of `earlierResults`) -/
  usesEarlier : List String
  /-- declarations of this library that realise the construction -/
  realisedBy : List String
  deriving DecidableEq, Repr

/-- The forty-two steps of [IUTchI-II], in an order of construction. -/
def steps : List Step := [
  -- [IUTchI] §1–§2
  ⟨"ClassifyOrbicurves", .IUTchI, "[IUTchI] §1, Def 1.1, Def 3.1 (b)", .anabelianSetup, [], [],
    ["OrbicurveKind", "OrbicurveKind.coverOf_preserves_pm"]⟩,
  ⟨"ReconstructCoverings", .IUTchI, "[IUTchI] §1, Cor 1.2, Rem 1.2.1", .anabelianSetup,
    ["ClassifyOrbicurves"], ["pGC.ThmA", "AbsTopI.cusps", "AbsAnb.ThmA"],
    ["CuspsSectionOne.two_ne_pm_one", "CorOneTwo.lSquared_eq"]⟩,
  ⟨"CompareTempered", .IUTchI, "[IUTchI] §2, Prop 2.1-Cor 2.8, Rem 2.5.3", .anabelianSetup,
    ["ClassifyOrbicurves"], ["pGC.ThmA", "SemiAn.tempered", "CbGC.ThmA", "NodNon.main"],
    ["LocalFrobenioidKind.isTempered"]⟩,
  -- [IUTchI] §3
  ⟨"GenerateInitialData", .IUTchI, "[IUTchI] Def 3.1", .initialData, ["ClassifyOrbicurves"],
    ["GenEll.ThmA"], ["InitialThetaData.exampleOne_wellFormed", "InitialThetaData.exists_wellFormed"]⟩,
  ⟨"CheckDefThreeOne", .IUTchI, "[IUTchI] Def 3.1 (a)-(f), Rem 3.1.2, 3.1.3, 3.1.5", .initialData,
    ["GenerateInitialData", "ReconstructCoverings"], ["GenEll.ThmA", "AbsTopIII.monoAnabelian"],
    ["InitialThetaData.WellFormed", "InitialThetaData.l_coprime_of_mem_VBadMod"]⟩,
  ⟨"CheckKappaCoric", .IUTchI, "[IUTchI] Rem 3.1.7", .initialData, ["CheckDefThreeOne"],
    ["NCBel.ThmA", "AbsTopII.decomposition", "AbsTopIII.monoAnabelian"], []⟩,
  ⟨"BuildLocalFrobenioids", .IUTchI, "[IUTchI] Ex 3.2, Ex 3.3, Ex 3.4", .frobenioids,
    ["CheckDefThreeOne", "CompareTempered"],
    ["FrdI.general", "FrdII.poly", "EtTh.frobenioidTheta", "QuCnf.arch", "AbsTopIII.archimedean"],
    ["LocalFrobenioidKind", "LocalFrobenioidKind.splittingIndeterminacy_bad"]⟩,
  ⟨"BuildGlobalRealified", .IUTchI, "[IUTchI] Ex 3.5", .frobenioids, ["BuildLocalFrobenioids"],
    ["FrdI.general", "FrdII.poly"], ["rho", "rho_mul_localDegree", "rhoTheta_mono"]⟩,
  ⟨"AssembleThetaHodgeTheater", .IUTchI, "[IUTchI] Def 3.6, Cor 3.7-3.9, Rem 3.9.3", .frobenioids,
    ["BuildLocalFrobenioids", "BuildGlobalRealified"], ["FrdI.general", "EtTh.thetaFunction"],
    ["ThetaHodgeTheater", "Link.thetaLinkOf_wellFormed", "Link.wellFormed_not_ring"]⟩,
  ⟨"ChainFrobeniusPicture", .IUTchI, "[IUTchI] Cor 3.8", .frobenioids, ["AssembleThetaHodgeTheater"],
    [], ["LogThetaLattice.buildH", "LogThetaLattice.alien"]⟩,
  -- [IUTchI] §4–§6: labels
  ⟨"MapLabels", .IUTchI, "[IUTchI] §4-§6, Def 6.13", .labels, ["CheckDefThreeOne"], [],
    ["LPrime.FlAbs", "LPrime.FlStar", "LPrime.absLabel", "LPrime.card_fibre_absLabel"]⟩,
  ⟨"StructureFlSemiPm", .IUTchI, "[IUTchI] Def 6.1 (i), Def 6.4 (i), Ex 6.2", .labels, ["MapLabels"],
    [], ["LPrime.FlSemiPm", "SignVector", "card_signVectors"]⟩,
  ⟨"ActSymmetries", .IUTchI, "[IUTchI] Prop 4.9, Prop 6.6", .labels,
    ["MapLabels", "StructureFlSemiPm"], [],
    ["LPrime.FlSemiPm.exists_smul_eq", "LPrime.FlStarSym_transitive"]⟩,
  ⟨"LabelCusps", .IUTchI, "[IUTchI] Def 6.1, Prop 6.5", .labels, ["MapLabels", "ReconstructCoverings"],
    ["AbsTopI.cusps"], ["LabCusp", "LabCuspPm", "forget_fibre_card"]⟩,
  -- [IUTchI] §4–§6: strips and bases
  ⟨"BuildPrimeStrip", .IUTchI, "[IUTchI] Def 4.1, Def 5.2", .frobenioids, ["BuildLocalFrobenioids"],
    ["GeoAn.anabelioids", "FrdI.general", "AbsTopIII.archimedean"],
    ["PrimeStrip.build_wellFormed", "PrimeStripKind.card"]⟩,
  ⟨"TorsorLabelCusps", .IUTchI, "[IUTchI] Def 4.1 (ii), Prop 4.2, Def 6.1 (ii)-(iii)", .labels,
    ["BuildPrimeStrip", "LabelCusps"], ["AbsTopI.cusps", "AbsTopII.decomposition"],
    ["LabCusp_transitive", "eta_mem_LabCusp"]⟩,
  ⟨"DescribeGlobalBases", .IUTchI, "[IUTchI] Def 4.1 (v), Ex 4.3, Def 6.1 (v), Rem 6.1.1", .labels,
    ["BuildPrimeStrip", "ReconstructCoverings"],
    ["GeoAn.anabelioids", "AbsAnb.ThmA", "AbsTopII.decomposition"],
    ["GlobalBaseKind.autImageOrder_eq", "GlobalBaseKind.card_FlSemiPm"]⟩,
  ⟨"EvaluateAtPoints", .IUTchI, "[IUTchI] Ex 4.4", .evaluation, ["BuildPrimeStrip", "MapLabels"],
    ["EtTh.thetaFunction", "AbSc.sections"], ["ThetaPmEllNFHodgeTheater.thetaExps"]⟩,
  ⟨"ComposePolyMorphisms", .IUTchI, "[IUTchI] §0, Def 6.1 (iv)", .frobenioids, ["BuildPrimeStrip"],
    ["GeoAn.anabelioids"], ["PolyKind", "SignVector"]⟩,
  ⟨"ClassifyPseudoMonoids", .IUTchI, "[IUTchI] §0, Ex 5.1 (i), Def 5.2 (v)-(vi), Rem 5.1.3",
    .frobenioids, ["BuildPrimeStrip", "CheckKappaCoric"], ["AbsTopIII.monoAnabelian", "FrdI.general"],
    ["PseudoMonoidKind", "PseudoMonoidKind.global_count"]⟩,
  ⟨"BuildGlobalNF", .IUTchI, "[IUTchI] Ex 5.1, Cor 5.3", .frobenioids,
    ["ClassifyPseudoMonoids", "DescribeGlobalBases"], ["AbsTopIII.monoAnabelian", "FrdI.general"],
    ["GlobalFrobenioidKind", "GlobalFrobenioidKind.copies_not_kummerReady"]⟩,
  ⟨"DistributeGlobalData", .IUTchI, "[IUTchI] Ex 5.1 (ii)-(vii), Rem 5.1.1, Rem 5.1.3, Rem 5.4.2",
    .frobenioids, ["BuildGlobalNF", "MapLabels"], ["FrdI.general"],
    ["GlobalFrobenioidKind.logVolumeWeight", "GlobalFrobenioidKind.LStar_mul_angleJ_weight"]⟩,
  ⟨"LiftToFrobenioids", .IUTchI, "[IUTchI] Def 5.2, Rem 5.2.1, Cor 5.3, Rem 5.3.1", .frobenioids,
    ["BuildPrimeStrip", "ClassifyPseudoMonoids"],
    ["FrdI.general", "FrdII.poly", "AbsTopIII.monoAnabelian"],
    ["stripFunctors", "PrimeStrip.forget_wellFormed"]⟩,
  -- [IUTchI] §4–§6: bridges and Hodge theaters
  ⟨"BuildBridges", .IUTchI, "[IUTchI] Def 4.6, 5.5, 6.4", .hodgeTheaters,
    ["TorsorLabelCusps", "DescribeGlobalBases", "EvaluateAtPoints", "LiftToFrobenioids",
     "StructureFlSemiPm"], [], ["BridgeKind", "BridgeKind.isoTorsorOrder"]⟩,
  ⟨"CountIsomorphismTorsors", .IUTchI,
    "[IUTchI] Prop 4.8, Prop 6.6, Cor 5.6, Cor 6.12, Rem 6.12.2", .hodgeTheaters, ["BuildBridges"], [],
    ["BridgeKind.isoTorsorOrder_thetaPm", "BridgeKind.gluingThetaPmEll_order"]⟩,
  ⟨"TransportLabelClasses", .IUTchI, "[IUTchI] Prop 4.7, Prop 6.5, Rem 6.12.4", .hodgeTheaters,
    ["BuildBridges", "LabelCusps"], [], []⟩,
  ⟨"ExtractCapsules", .IUTchI, "[IUTchI] §0, Def 4.1, Def 6.4", .hodgeTheaters,
    ["BuildPrimeStrip", "MapLabels"], [],
    ["ThetaPmEllNFHodgeTheater.capsuleT_length", "ThetaPmEllNFHodgeTheater.capsuleJ_length"]⟩,
  ⟨"BuildProcessions", .IUTchI, "[IUTchI] Prop 4.11, Prop 6.9", .hodgeTheaters,
    ["ExtractCapsules", "ActSymmetries"], [], ["LPrime.SPmJPlusOne", "Ind1", "card_Ind1"]⟩,
  ⟨"CountForgottenSymmetries", .IUTchI, "[IUTchI] Prop 4.9, Prop 4.11, Prop 6.8, Prop 6.9",
    .hodgeTheaters, ["BuildProcessions"], [], ["ForgetfulCounts.factorial_le_pow"]⟩,
  ⟨"ReduceThetaPmToTheta", .IUTchI, "[IUTchI] Prop 6.7, Prop 6.9 (iii), Rem 6.12.2", .hodgeTheaters,
    ["BuildBridges", "BuildProcessions"], [], ["forget_mem_LabCusp", "LPrime.SPmJPlusOne_mono"]⟩,
  ⟨"GlueHodgeTheaters", .IUTchI, "[IUTchI] Prop 6.7, Def 6.13", .hodgeTheaters,
    ["BuildBridges", "ReduceThetaPmToTheta", "TransportLabelClasses"], [],
    ["ThetaPmEllNFHodgeTheater.build_wellFormed", "ThetaPmEllNFHodgeTheater.exists_wellFormed"]⟩,
  ⟨"ForgetToDHodgeTheater", .IUTchI, "[IUTchI] Def 6.13, Rem 6.12.2", .hodgeTheaters,
    ["GlueHodgeTheaters"], [], ["ThetaPmEllNFHodgeTheater.forgetToD_wellFormed"]⟩,
  ⟨"DrawEtalePicture", .IUTchI, "[IUTchI] Cor 4.12, Cor 6.10", .hodgeTheaters,
    ["ForgetToDHodgeTheater", "ChainFrobeniusPicture"], ["GeoAn.anabelioids"],
    ["PrimeStripKind.biCoric_iff"]⟩,
  ⟨"CompareHalfPlane", .IUTchI, "[IUTchI] Rem 6.12.3, Fig 6.4, Fig 6.6", .hodgeTheaters,
    ["ActSymmetries", "GlueHodgeTheaters"], [], []⟩,
  -- [IUTchII]
  ⟨"ClassifyRadial", .IUTchII, "[IUTchII] Ex 1.7-1.9", .radial, ["ForgetToDHodgeTheater"],
    ["AbsTopIII.logShells"], ["StageThree.RadialEnv", "StageThree.RadialEnv.examples_multiradial_count"]⟩,
  ⟨"RigidifyCyclotomes", .IUTchII, "[IUTchII] Cor 1.10-1.12", .radial,
    ["CompareTempered", "ClassifyRadial"],
    ["EtTh.monoTheta", "AbsTopIII.cyclotomicRigidity", "AbsTopIII.monoAnabelian"],
    ["StageThree.CyclotomicRigidity", "StageThree.CyclotomicRigidity.multiradial_iff_not_ring"]⟩,
  ⟨"EvaluateTheta", .IUTchII, "[IUTchII] Cor 2.4, 2.5, 2.8", .evaluation,
    ["CompareTempered", "EvaluateAtPoints", "RigidifyCyclotomes"],
    ["EtTh.thetaFunction", "SemiAn.tempered", "CbGC.ThmA", "NodNon.main", "Config.ThmA"],
    ["StageThree.ThetaEvaluation", "StageThree.ThetaEvaluation.value_neg",
     "StageThree.ThetaEvaluation.values_FlStar"]⟩,
  ⟨"BuildMonoids", .IUTchII, "[IUTchII] Prop 3.1, Cor 3.5-3.7, 4.5-4.6", .evaluation,
    ["EvaluateTheta", "BuildLocalFrobenioids"],
    ["EtTh.frobenioidTheta", "AbsTopIII.monoAnabelian", "AbsTopIII.logShells"],
    ["StageThree.LocalMonoid", "StageThree.LocalMonoid.evaluate_build",
     "StageThree.LocalMonoid.build_kummerIso"]⟩,
  ⟨"Symmetrize", .IUTchII, "[IUTchII] Cor 3.5 (i), 4.5 (iii), 4.7 (ii)", .monoAnalytic,
    ["BuildMonoids", "ActSymmetries", "ExtractCapsules"], [],
    ["StageThree.Symmetrization", "StageThree.conjugateSynchronization"]⟩,
  ⟨"RealifyFromDMono", .IUTchII, "[IUTchII] Cor 4.5 (ii)", .monoAnalytic,
    ["BuildMonoids", "ForgetToDHodgeTheater"], ["FrdII.poly", "AbsTopIII.logShells"],
    ["StageThree.globalRealifiedFromDMono", "StageThree.globalRealifiedFromDMono_wellFormed"]⟩,
  ⟨"ForgetLadder", .IUTchII, "[IUTchII] Def 4.9", .monoAnalytic,
    ["RealifyFromDMono", "LiftToFrobenioids"], ["AbsTopIII.logShells", "FrdI.general"],
    ["StageThree.ladder", "StageThree.ladder_wellFormed", "StageThree.core_G"]⟩,
  ⟨"LinkThetaUnitsModTors", .IUTchII, "[IUTchII] Cor 4.10, Rem 4.11.1", .monoAnalytic,
    ["ForgetLadder", "Symmetrize", "BuildMonoids", "AssembleThetaHodgeTheater"],
    ["AbsTopIII.logShells"],
    ["Link.thetaLinkOf", "StageThree.constantStripIdentify", "StageThree.envelopeIsos",
     "StageThree.thetaUnitsModTorsLink_glues", "ThetaPmEllNFHodgeTheater.applyThetaLink_shares_units"]⟩
]

theorem steps_length : steps.length = 42 := rfl

theorem steps_id_nodup : (steps.map (·.id)).Nodup := by decide +kernel

/-- Every step is a process of [IUTchI] or [IUTchII] of `docs/PROCESSES.md`,
with the paper recorded correctly. -/
theorem steps_are_processes :
    steps.all (fun s => (Process.find? s.id).any fun p =>
      p.paper == s.paper && (s.paper == .IUTchI || s.paper == .IUTchII)) = true := by
  decide +kernel

/-- The steps are exactly the processes of [IUTchI] and [IUTchII], reordered
into an order of construction. -/
theorem steps_cover_IUTchI_II :
    (steps.map (·.id)).Perm
      ((Process.byPaper .IUTchI ++ Process.byPaper .IUTchII).map (·.id)) := by
  decide +kernel

/-- 34 steps of [IUTchI] and 8 of [IUTchII] (`processes_byPaper`). -/
theorem steps_byPaper :
    (steps.filter (·.paper = .IUTchI)).length = 34 ∧
    (steps.filter (·.paper = .IUTchII)).length = 8 := by decide +kernel

/-- Every earlier result a step uses is one of `earlierResults`. -/
theorem steps_earlier :
    steps.all (fun s => s.usesEarlier.all fun r => earlierResults.any (·.id = r)) = true := by
  decide +kernel

/-- Every earlier result is used by some step. -/
theorem earlier_used :
    earlierResults.all (fun r => steps.any fun s => s.usesEarlier.contains r.id) = true := by
  decide +kernel

/-- The dependency order is well-founded: each step depends only on steps
listed *before* it. -/
def acyclic : List Step → List String → Bool
  | [], _ => true
  | s :: rest, seen => s.dependsOn.all (fun d => seen.contains d) && acyclic rest (s.id :: seen)

theorem steps_acyclic : acyclic steps [] = true := by decide +kernel

/-- Every theme has a step. -/
theorem themes_covered :
    [Theme.anabelianSetup, .initialData, .frobenioids, .labels, .hodgeTheaters, .radial,
      .evaluation, .monoAnalytic].all (fun t => steps.any fun s => s.theme == t) = true := by
  decide +kernel

/-- The [IUTchII] steps come after all the [IUTchI] steps they need: the
[IUTchII] steps are the last eight. -/
theorem IUTchII_last :
    (steps.drop 34).all (·.paper == .IUTchII) = true ∧
    (steps.take 34).all (·.paper == .IUTchI) = true := by decide +kernel

/-! ## Stage 3 feeds Stage 2 -/

/-- **Every input of Stage 2 is a step of Stage 3**: the eleven results of
[IUTchI-II] that the proof of Thm 3.11 rests on are constructed here. -/
theorem feeds_stage_two :
    StageTwo.inputs.all (fun i => steps.any (·.id = i.id)) = true := by decide +kernel

/-- The step with a given id. -/
def find? (id : String) : Option Step := steps.find? (·.id = id)

/-- One round of closing a set of step ids under `dependsOn`. -/
def depsStep (ids : List String) : List String :=
  (ids ++ ids.flatMap fun id => ((find? id).map (·.dependsOn)).getD []).eraseDups

/-- `n` rounds. -/
def depsClosure : ℕ → List String → List String
  | 0, ids => ids
  | n + 1, ids => depsClosure n (depsStep ids)

/-- The depth of the dependency graph: twelve rounds suffice to close any
singleton under `dependsOn` (`depsClosure_stable`). -/
def depth : ℕ := 12

/-- The earlier results a step rests on, transitively through its dependencies. -/
def earlierClosure (id : String) : List String :=
  (depsClosure depth [id]).flatMap fun i => ((find? i).map (·.usesEarlier)).getD []

/-- Twelve rounds close every step's dependency set. -/
theorem depsClosure_stable :
    steps.all (fun s => depsStep (depsClosure depth [s.id]) == depsClosure depth [s.id]) = true := by
  decide +kernel

/-- Every input of Stage 2 rests on some earlier result. -/
theorem inputs_rest_on_earlier :
    StageTwo.inputs.all (fun i => !(earlierClosure i.id).isEmpty) = true := by decide +kernel

/-- The only step resting on no earlier result is the (elementary) classification
of the orbicurves of [IUTchI] §1. -/
theorem elementary_steps :
    (steps.filter fun s => (earlierClosure s.id).isEmpty).map (·.id) = ["ClassifyOrbicurves"] := by
  decide +kernel

/-- Thm 3.11 (the last step of Stage 2) rests, through its inputs, on results
of every one of the seventeen earlier papers. -/
theorem thm311_rests_on_all_papers :
    EarlierPaper.all.all (fun p => StageTwo.inputs.any fun i =>
      (earlierClosure i.id).any fun r =>
        (earlierResults.find? (·.id = r)).any (·.paper = p)) = true := by
  decide +kernel

/-! ## [IUTchII] §1: radial environments (`ClassifyRadial`, Ex 1.7–1.9) -/

/-- `iut_radial_env`: a radial environment ([IUTchII] Ex 1.7): radial data,
coric data, and whether the functor from the radial to the coric category is
full (= multiradial, Ex 1.7 (i)). -/
structure RadialEnv where
  radial : String
  coric : String
  full : Bool
  multiradialized : Bool
  ref : String
  deriving DecidableEq, Repr

namespace RadialEnv

/-- [IUTchII] Ex 1.7 (i): multiradial ⟺ the functor to the coric data is full. -/
def isMultiradial (e : RadialEnv) : Bool := e.full

/-- [IUTchII] Ex 1.7 (ii), (iii): **multiradialization** — replace the radial
data `R` by the pairs `(R, α)` with `α` a full poly-isomorphism of the coric
data; the result is tautologically multiradial, at the cost of the
indeterminacy `α`. -/
def multiradialize (e : RadialEnv) : RadialEnv := { e with full := true, multiradialized := true }

theorem multiradialize_isMultiradial (e : RadialEnv) : (multiradialize e).isMultiradial = true := rfl

theorem multiradialize_idem (e : RadialEnv) : multiradialize (multiradialize e) = multiradialize e := rfl

theorem multiradialize_keeps_data (e : RadialEnv) :
    (multiradialize e).radial = e.radial ∧ (multiradialize e).coric = e.coric := ⟨rfl, rfl⟩

/-- `iut_radial_examples`: the radial environments of [IUTchII] Ex 1.8–1.9,
Thm 2.2 and [IUTchIII] Thm 3.11. -/
def examples : List RadialEnv := [
  ⟨"holomorphic structure: Π_v ↷ O▷_{F̄_v} (an F-prime-strip)", "D⊢ = {G_v}", false, false,
    "[IUTchII] Ex 1.8 (i): uniradial — the ring structure is not transportable"⟩,
  ⟨"D⊢ itself", "D⊢", true, false, "[IUTchII] Ex 1.8 (ii): the coric data is tautologically multiradial"⟩,
  ⟨"O×μ_v with G_v-action, up to Ism", "D⊢", true, false,
    "[IUTchII] Ex 1.8 (iv), Cor 1.12: units modulo torsion are multiradial (Ind2)"⟩,
  ⟨"O×_v with its Ẑ×-Kummer structure", "D⊢", false, false,
    "[IUTchII] Ex 1.8 (iii): the full Kummer structure on O× is uniradial (needs the cyclotome)"⟩,
  ⟨"the mono-theta environment and its cyclotomic rigidity (l·Δ_Θ)(Π) ≅ Π_μ", "D⊢", true, false,
    "[IUTchII] Cor 1.10, Ex 1.9: multiradial"⟩,
  ⟨"theta monoids Ψ_env(D_>) with their splittings", "(D⊢, F⊢×μ(D⊢))", true, false,
    "[IUTchII] Thm 2.2, Cor 2.3 (étale-picture radial environment)"⟩,
  ⟨"the multiradial representation R^LGP: packets, splitting monoids, (F_mod^×)_j", "(D⊢, F⊢×μ)",
    true, true, "[IUTchIII] Thm 3.11 (i): multiradial up to Ind1, Ind2, Ind3"⟩
]

theorem examples_length : examples.length = 7 := rfl

/-- Five of the seven are multiradial. -/
theorem examples_multiradial_count : (examples.filter isMultiradial).length = 5 := by decide

/-- The uniradial ones are the holomorphic structure (the ring structure) and
the full `×`-Kummer structure on `O×` (which needs the cyclotome). -/
theorem examples_uniradial :
    (examples.filter (fun e => !e.isMultiradial)).map (·.radial) =
      ["holomorphic structure: Π_v ↷ O▷_{F̄_v} (an F-prime-strip)",
       "O×_v with its Ẑ×-Kummer structure"] := by decide

/-- Only the multiradial representation is obtained by multiradialization
(it carries the indeterminacies). -/
theorem examples_multiradialized :
    (examples.filter (·.multiradialized)).length = 1 := by decide

/-- The two uniradial examples live on the holomorphic / `×`-Kummer kinds,
which are not horizontally coric; the coric data `D⊢` is bi-coric and the
units modulo torsion `F⊢×μ` are horizontally coric (`PrimeStripKind`). -/
theorem kinds_coricity :
    PrimeStripKind.horizontallyCoric .FPrimeStrip = false ∧
    PrimeStripKind.horizontallyCoric .FMonoUnitsPrimeStrip = false ∧
    PrimeStripKind.horizontallyCoric .FMonoUnitsModTorsPrimeStrip = true ∧
    PrimeStripKind.biCoric .DMonoPrimeStrip = true := by decide

end RadialEnv

/-! ## [IUTchII] §1: cyclotomic rigidity (`RigidifyCyclotomes`, Cor 1.10–1.12) -/

/-- `iut_cyclotomic_kind`: the three cyclotomic rigidity isomorphisms. -/
inductive CyclotomicKind where
  /-- [IUTchII] Cor 1.10: via the mono-theta environment (the commutator) -/
  | monoTheta
  /-- [IUTchII] Cor 1.11: via local class field theory on the MLF-Galois pair -/
  | mlfGaloisPair
  /-- [IUTchI] Ex 5.1 (v), [IUTchII] Cor 4.8: via `Q_{>0} ∩ Ẑ× = {1}` on the number field -/
  | numberField
  deriving DecidableEq, Repr

namespace CyclotomicKind

def all : List CyclotomicKind := [.monoTheta, .mlfGaloisPair, .numberField]

theorem all_length : all.length = 3 := rfl

end CyclotomicKind

/-- `iut_cyclotomic_rigidity`: a cyclotomic rigidity isomorphism with its
indeterminacy, whether it is multiradial, and whether it uses the ring
structure ([IUTchIII] Rem 2.3.3). -/
structure CyclotomicRigidity where
  kind : CyclotomicKind
  indeterminacy : String
  multiradial : Bool
  usesRingStructure : Bool
  ref : String
  deriving DecidableEq, Repr

namespace CyclotomicRigidity

/-- `iut_cyclotomic_rigidity_get`. -/
def get : CyclotomicKind → CyclotomicRigidity
  | .monoTheta => ⟨.monoTheta, "none", true, false, "[IUTchII] Cor 1.10; [IUTchIII] Rem 2.3.3 (i)"⟩
  | .mlfGaloisPair => ⟨.mlfGaloisPair, "Ẑ×-orbit (resp. Aut(G_v)-orbit) on the units", false, true,
      "[IUTchII] Cor 1.11; [IUTchIII] Rem 2.3.3 (ii)"⟩
  | .numberField => ⟨.numberField, "none (Q>0 ∩ Ẑ× = {1})", true, false,
      "[IUTchI] Ex 5.1 (v); [IUTchII] Cor 4.8; [IUTchIII] Rem 2.3.3 (vi)"⟩

/-- **Multiradial ⟺ no ring structure used** ([IUTchIII] Rem 2.3.3): the
rigidity via the mono-theta environment and via the number field are
multiradial; the one via local class field theory needs `O▷` with its ring
structure and is only defined up to `Ẑ×`. -/
theorem multiradial_iff_not_ring :
    CyclotomicKind.all.all (fun k => (get k).multiradial == !(get k).usesRingStructure) = true := by
  decide

theorem multiradial_count :
    (CyclotomicKind.all.filter fun k => (get k).multiradial).length = 2 := by decide

theorem monoTheta_multiradial : (get .monoTheta).multiradial = true := rfl

theorem mlf_uniradial : (get .mlfGaloisPair).multiradial = false := rfl

/-- The mono-theta rigidity is the one used for the Θ-pilot: it is multiradial
and its indeterminacy is trivial — the "constant multiple rigidity" of Cor 1.12
is then only up to `±1`. -/
theorem monoTheta_rigid : (get .monoTheta).indeterminacy = "none" := rfl

end CyclotomicRigidity

/-- `iut_constant_multiple_rigidity_orbit`: [IUTchII] Cor 1.12: constant
multiples are rigid up to the `ι`-indeterminacy `±1`. -/
def constantMultipleOrbit : ℕ := 2

/-- The `±1` is the unit group of `ℤ`. -/
theorem constantMultipleOrbit_eq : constantMultipleOrbit = Fintype.card ℤˣ := by
  simp [constantMultipleOrbit, Fintype.card_units_int]

/-! ## [IUTchII] §2: Galois evaluation modulo [EtTh] (`EvaluateTheta`, Cor 2.4, 2.5, 2.8) -/

/-- **The evaluation datum**, modulo [EtTh] §1 and [IUTchII] Cor 2.5 (i),
Cor 2.8: restricting the étale theta function `Θ̲_v` to the decomposition
group `D_{t,μ−}` of the evaluation point labelled `t ∈ F_l` gives the value
`q̲_v^{t²}` up to `μ_{2l}`.  `value t` is `ord_{q̲}` of that value; the field
`value_eq` is the hypothesis supplied by the earlier results (and the content
of [IUTchII] §2 modulo them); everything below is derived from it. -/
structure ThetaEvaluation (L : LPrime) where
  /-- `ord_{q̲_v}` of the value at the point labelled `t` -/
  value : L.Fl → ℕ
  /-- [IUTchII] Cor 2.5 (i), Cor 2.8 (via [EtTh] §1): `Θ̲_v|_{D_{t,μ−}} = q̲_v^{t²}` -/
  value_eq : ∀ t, value t = (L.absLabel t) ^ 2
  /-- the torsion indeterminacy of the value -/
  torsionIndeterminacy : ℕ
  /-- [IUTchII] Cor 2.5 (i): the value is defined up to `μ_{2l}` -/
  torsion_eq : torsionIndeterminacy = 2 * L.l

namespace ThetaEvaluation

variable {L : LPrime}

/-- `iut_theta_evaluate`: the canonical datum. -/
def canonical (L : LPrime) : ThetaEvaluation L :=
  ⟨fun t => (L.absLabel t) ^ 2, fun _ => rfl, 2 * L.l, rfl⟩

/-- **`|t|`-dependence** ([IUTchII] Cor 2.8): the value at `−t` is the value at `t`. -/
theorem value_neg (E : ThetaEvaluation L) (t : L.Fl) : E.value (-t) = E.value t := by
  rw [E.value_eq, E.value_eq, L.absLabel_neg]

/-- The value at the label `0` is `q̲^0 = 1`. -/
theorem value_zero (E : ThetaEvaluation L) : E.value 0 = 0 := by
  rw [E.value_eq, (L.absLabel_eq_zero_iff 0).mpr rfl]
  norm_num

/-- The values are bounded by `(l*)²`. -/
theorem value_le (E : ThetaEvaluation L) (t : L.Fl) : E.value t ≤ L.LStar ^ 2 := by
  rw [E.value_eq]
  exact Nat.pow_le_pow_left (L.absLabel_le t) 2

/-- The value at the label `j ∈ |F_l|` is `j²`. -/
theorem value_natCast (E : ThetaEvaluation L) {j : ℕ} (hj : j ≤ L.LStar) :
    E.value (j : L.Fl) = j ^ 2 := by
  rw [E.value_eq, (L.absLabel_eq_iff hj (j : L.Fl)).mpr (Or.inl rfl)]

/-- [IUTchII] Rem 4.11.1 (i): at the label `1` the evaluation is the identity
`q̲ ↦ q̲^{1²}`. -/
theorem value_one (E : ThetaEvaluation L) : E.value 1 = 1 := by
  have := E.value_natCast (j := 1) (by have := L.two_le_LStar; omega)
  simpa using this

/-- **The values on `F_l^* = {1, …, l*}` are the exponents `1, 4, …, (l*)²` of
the Θ-pilot** (`ThetaPmEllNFHodgeTheater.thetaExps`; [IUTchII] Cor 4.11, Rem
4.11.1): what the Θ×μ_gau-link sends `q̲` to. -/
theorem values_FlStar (d : InitialThetaData) (hd : d.WellFormed) (E : ThetaEvaluation (d.toLPrime hd)) :
    (List.range d.LStar).map (fun j => E.value ((j + 1 : ℕ) : (d.toLPrime hd).Fl)) =
      ThetaPmEllNFHodgeTheater.thetaExps d := by
  simp only [ThetaPmEllNFHodgeTheater.thetaExps]
  apply List.map_congr_left
  intro j hj
  rw [List.mem_range] at hj
  exact E.value_natCast (by rw [← d.LStar_eq hd]; omega)

/-- **Each value `q̲^{j²}`, `j ∈ F_l^*`, is attained at exactly two labels**,
namely `±j` (`card_fibre_absLabel`): the `|t|`-dependence is exactly 2-to-1
away from `0`. -/
theorem card_fibre (E : ThetaEvaluation L) {j : ℕ} (hj : j ∈ L.FlStar) :
    (Finset.univ.filter fun t : L.Fl => E.value t = j ^ 2).card = 2 := by
  have : (Finset.univ.filter fun t : L.Fl => E.value t = j ^ 2) =
      Finset.univ.filter fun t : L.Fl => L.absLabel t = j := by
    ext t
    simp only [Finset.mem_filter, Finset.mem_univ, true_and, E.value_eq]
    exact Nat.pow_left_injective (by norm_num : (2 : ℕ) ≠ 0) |>.eq_iff
  rw [this, L.card_fibre_absLabel hj]

/-- The value `1 = q̲^0` is attained only at `0`. -/
theorem card_fibre_zero (E : ThetaEvaluation L) :
    (Finset.univ.filter fun t : L.Fl => E.value t = 0).card = 1 := by
  have : (Finset.univ.filter fun t : L.Fl => E.value t = 0) =
      Finset.univ.filter fun t : L.Fl => L.absLabel t = 0 := by
    ext t
    simp [E.value_eq]
  rw [this, L.card_fibre_absLabel_zero]

/-- The torsion indeterminacy `μ_{2l}` of the value is the indeterminacy of
the splitting `τ⊢_v` at a bad place ([IUTchI] Ex 3.2; `LocalFrobenioidKind`). -/
theorem torsion_eq_splitting (E : ThetaEvaluation L) :
    E.torsionIndeterminacy = LocalFrobenioidKind.splittingIndeterminacy L .bad := E.torsion_eq

/-- `|μ_{2l}| = 2 · |F_l|`. -/
theorem torsion_eq_two_card (E : ThetaEvaluation L) :
    E.torsionIndeterminacy = 2 * Fintype.card L.Fl := by
  rw [E.torsion_eq, L.card_Fl]

end ThetaEvaluation

/-- `iut_tempered_indices`: [IUTchII] Cor 2.4 (i): the indices of the tempered
fundamental groups `Π_Ÿ ⊆ Π_v ⊆ Π±_v` of `Ÿ_v`, `X̲_v`, `X̲±_v`. -/
structure TemperedIndices where
  /-- `[Π_v : Π_Ÿ] = 2` -/
  PiToPiYdd : ℕ
  /-- `[Π±_v : Π_v] = l` -/
  PiPmToPi : ℕ
  /-- `[Π±_v : Π_Ÿ] = 2l` -/
  PiPmToPiYdd : ℕ
  deriving DecidableEq, Repr

/-- The indices for the prime `l`. -/
def temperedIndices (L : LPrime) : TemperedIndices := ⟨2, L.l, 2 * L.l⟩

/-- The indices multiply along the tower. -/
theorem temperedIndices_mul (L : LPrime) :
    (temperedIndices L).PiPmToPiYdd = (temperedIndices L).PiToPiYdd * (temperedIndices L).PiPmToPi :=
  rfl

/-- `[Π±_v : Π_Ÿ] = |μ_{2l}|`: the covering `Ÿ → X̲±` of degree `2l` is where
the `2l`-th roots of the theta function live. -/
theorem temperedIndices_eq_torsion (L : LPrime) (E : ThetaEvaluation L) :
    (temperedIndices L).PiPmToPiYdd = E.torsionIndeterminacy := E.torsion_eq.symm

/-- `iut_evaluation_points_count`: [IUTchII] Cor 2.4 (ii): one decomposition
group `D_{t,μ−}` for each `t ∈ F_l`. -/
def evaluationPointsCount (L : LPrime) : ℕ := L.l

theorem evaluationPointsCount_eq (L : LPrime) : evaluationPointsCount L = Fintype.card L.Fl :=
  L.card_Fl.symm

/-! ## [IUTchII] §3–§4: theta, Gaussian and constant monoids (`BuildMonoids`) -/

/-- `iut_monoid_kind`. -/
inductive MonoidKind where
  /-- `Ψ_cns = O▷` ([IUTchII] Cor 4.5 (i), Cor 4.6 (i)) -/
  | constant
  /-- `Ψ_env = O× · θ^N` ([IUTchII] Prop 3.1 (i)) -/
  | theta
  /-- `∞Ψ_env`: all `N`-th roots of `θ` adjoined ([IUTchII] Prop 3.1 (ii)) -/
  | thetaInf
  /-- `Ψ_gau = O× · (q̲^{j²})_j` ([IUTchII] Cor 3.5 (ii), Cor 3.6) -/
  | gaussian
  /-- `∞Ψ_gau` -/
  | gaussianInf
  /-- `Ψ^ss_cns = O× × ℝ_{≥0}` ([IUTchII] Cor 4.5 (ii)) -/
  | semisimple
  /-- the LGP-monoids of [IUTchIII] Prop 3.4 (Stage 2) -/
  | lgp
  deriving DecidableEq, Repr

/-- `iut_monoid`: a monoid of [IUTchII] at a place `v`: its kind, whether it is
étale-like (reconstructed from `Π_v` / `G_v`) or Frobenius-like, the exponents
of `q̲_v` of the generators of its value-group portion (in the order of the
labels `j = 1, …, l*` for the Gaussian monoids), whether the theta function
itself is a generator (unevaluated), whether it is perfected (`∞`) and split. -/
structure LocalMonoid where
  kind : MonoidKind
  vIndex : ℕ
  etaleLike : Bool
  gens : List ℕ
  thetaGenerator : Bool
  perfected : Bool
  split : Bool
  deriving DecidableEq, Repr

namespace LocalMonoid

/-- `iut_monoid_build`. -/
def build (L : LPrime) (k : MonoidKind) (v : ℕ) (etaleLike : Bool) : LocalMonoid :=
  match k with
  | .constant => ⟨k, v, etaleLike, [1], false, false, false⟩
  | .theta => ⟨k, v, etaleLike, [], true, false, true⟩
  | .thetaInf => ⟨k, v, etaleLike, [], true, true, true⟩
  | .gaussian => ⟨k, v, etaleLike, (List.range L.LStar).map (fun j => (j + 1) ^ 2), false, false, true⟩
  | .gaussianInf => ⟨k, v, etaleLike, (List.range L.LStar).map (fun j => (j + 1) ^ 2), false, true, true⟩
  | .semisimple => ⟨k, v, etaleLike, [1], false, false, true⟩
  | .lgp => ⟨k, v, etaleLike, [], false, false, false⟩

/-- **The evaluation** `θ ↦ (θ(√−q̲^j))_j = (q̲^{j²})_j` ([IUTchII] Cor 3.5 (ii),
Cor 3.6 (ii)): the theta monoid becomes the Gaussian monoid. -/
def evaluate (L : LPrime) (E : ThetaEvaluation L) (m : LocalMonoid) : LocalMonoid :=
  { m with
    kind := if m.perfected then .gaussianInf else .gaussian
    gens := (List.range L.LStar).map fun j => E.value ((j + 1 : ℕ) : L.Fl)
    thetaGenerator := false }

/-- `iut_monoid_evaluation_iso`: `Ψ_env ≅ Ψ_gau` via the evaluation, compatible
with the units and the splittings ([IUTchII] Cor 3.5 (ii), Cor 4.10 (ii)). -/
def EvaluationIso (L : LPrime) (env gau : LocalMonoid) : Prop :=
  (env.kind = .theta ∨ env.kind = .thetaInf) ∧ (gau.kind = .gaussian ∨ gau.kind = .gaussianInf) ∧
  env.vIndex = gau.vIndex ∧ env.perfected = gau.perfected ∧ env.split = gau.split ∧
  gau.gens.length = L.LStar

/-- `iut_monoid_kummer_iso`: `Ψ(F) ≅ Ψ(D)` ([IUTchII] Cor 4.6 (i), Cor 4.8 (i)):
the Kummer isomorphism between a Frobenius-like monoid and the monoid of the
same kind reconstructed from the base category. -/
def KummerIso (frob et : LocalMonoid) : Prop :=
  frob.kind = et.kind ∧ frob.vIndex = et.vIndex ∧ frob.etaleLike = false ∧ et.etaleLike = true ∧
  frob.gens = et.gens

/-- The generators of the Gaussian monoid are the theta values on `F_l^*`
(`ThetaEvaluation.value_natCast`). -/
theorem gaussian_gens (L : LPrime) (E : ThetaEvaluation L) (v : ℕ) (e : Bool) :
    (build L .gaussian v e).gens = (List.range L.LStar).map fun j => E.value ((j + 1 : ℕ) : L.Fl) := by
  simp only [build]
  apply List.map_congr_left
  intro j hj
  rw [List.mem_range] at hj
  rw [E.value_natCast (by omega)]

/-- **Evaluating the theta monoid gives the Gaussian monoid** ([IUTchII] Cor
3.5 (ii), Cor 3.6): `evaluate (Ψ_env) = Ψ_gau`, and likewise for the perfections. -/
theorem evaluate_build (L : LPrime) (E : ThetaEvaluation L) (v : ℕ) (e : Bool) :
    evaluate L E (build L .theta v e) = build L .gaussian v e ∧
    evaluate L E (build L .thetaInf v e) = build L .gaussianInf v e := by
  have hg := gaussian_gens L E v e
  constructor
  · unfold evaluate
    rw [← hg]
    rfl
  · unfold evaluate
    rw [← hg]
    rfl

/-- The evaluation isomorphism holds between the theta monoid and its evaluation. -/
theorem evaluate_iso (L : LPrime) (E : ThetaEvaluation L) (v : ℕ) (e : Bool) :
    EvaluationIso L (build L .theta v e) (evaluate L E (build L .theta v e)) := by
  simp [EvaluationIso, evaluate, build]

/-- **The Kummer isomorphisms** ([IUTchII] Cor 4.6, Cor 4.8): for every kind
and place, the Frobenius-like monoid and the étale-like one coincide up to the
labels — the Kummer isomorphism exists. -/
theorem build_kummerIso (L : LPrime) (k : MonoidKind) (v : ℕ) :
    KummerIso (build L k v false) (build L k v true) := by
  cases k <;> simp [KummerIso, build]

/-- `iut_monoid_semisimplify`: `Ψ_cns ↦ Ψ^ss_cns` ([IUTchII] Cor 4.5 (ii)):
forget the ring structure; what survives is the unit group and the value group,
realified, with `log(p_v)` distinguished. -/
def semisimplify (L : LPrime) (m : LocalMonoid) : LocalMonoid :=
  build L .semisimple m.vIndex m.etaleLike

theorem semisimplify_kind (L : LPrime) (m : LocalMonoid) : (semisimplify L m).kind = .semisimple := rfl

theorem semisimplify_split (L : LPrime) (m : LocalMonoid) : (semisimplify L m).split = true := rfl

theorem semisimplify_keeps_place (L : LPrime) (m : LocalMonoid) :
    (semisimplify L m).vIndex = m.vIndex ∧ (semisimplify L m).etaleLike = m.etaleLike := ⟨rfl, rfl⟩

/-- The Gaussian monoid has `l*` generators, the theta monoid none (it is
generated by `θ` itself). -/
theorem gens_length (L : LPrime) (v : ℕ) (e : Bool) :
    (build L .gaussian v e).gens.length = L.LStar ∧ (build L .theta v e).gens.length = 0 ∧
    (build L .theta v e).thetaGenerator = true := by
  simp [build]

end LocalMonoid

/-! ## [IUTchII] Cor 3.5 (i), 4.5 (iii), 4.7 (ii): symmetrizing isomorphisms (`Symmetrize`) -/

/-- `iut_symmetrization`: the symmetrizing isomorphisms induced by the
`F_l^{⋊±}`-symmetry (resp. the `F_l^*`-symmetry) between the labelled copies
of `G_v`, `Ψ_cns`, … (resp. `(M_mod)_j`, …): the group, the number of classes
the labels descend to, whether the copies of `G_v` are conjugate-synchronized,
and whether the diagonal is defined. -/
structure Symmetrization where
  group : String
  nclasses : ℕ
  synchronized : Bool
  diagonal : Bool
  deriving DecidableEq, Repr

/-- `iut_symmetrize_FlSemiPm`: [IUTchII] Cor 3.5 (i), Cor 4.5 (iii): the
`F_l^{⋊±}`-symmetry of the Θ±ell-Hodge theater identifies the `l` copies of
`G_v` ("conjugate synchronization"); the labels descend to `|F_l|`. -/
def symmetrizeFlSemiPm (L : LPrime) : Symmetrization := ⟨"FlSemiPm", L.LStar + 1, true, true⟩

/-- `iut_symmetrize_FlStar`: [IUTchII] Cor 4.7 (ii), Cor 4.8 (ii): the
`F_l^*`-symmetry of the ΘNF-Hodge theater gives symmetrizing isomorphisms
between the labelled copies; being an outer ("arithmetic") symmetry, it does
*not* synchronize the conjugates of `G_v` ([IUTchI] Rem 6.12.6). -/
def symmetrizeFlStar (L : LPrime) : Symmetrization := ⟨"FlStar", L.LStar, false, true⟩

/-- The classes of the additive symmetrization are `|F_l| = {0, …, l*}`. -/
theorem symmetrizeFlSemiPm_nclasses (L : LPrime) : (symmetrizeFlSemiPm L).nclasses = L.FlAbs.card :=
  L.card_FlAbs.symm

/-- The classes of the multiplicative symmetrization are `F_l^* = {1, …, l*}`. -/
theorem symmetrizeFlStar_nclasses (L : LPrime) : (symmetrizeFlStar L).nclasses = L.FlStar.card :=
  L.card_FlStar.symm

/-- `F_l^{⋊±}` has one class more than `F_l^*`: the label `0`. -/
theorem nclasses_succ (L : LPrime) :
    (symmetrizeFlSemiPm L).nclasses = (symmetrizeFlStar L).nclasses + 1 := rfl

/-- `iut_conjugate_synchronized`: only the additive symmetry synchronizes. -/
theorem synchronized_iff (L : LPrime) :
    (symmetrizeFlSemiPm L).synchronized = true ∧ (symmetrizeFlStar L).synchronized = false :=
  ⟨rfl, rfl⟩

/-- **Conjugate synchronization** ([IUTchII] Cor 3.5 (i), Cor 4.5 (iii)): the
`F_l^{⋊±}`-action is transitive on the labels `t ∈ F_l`, so any two labelled
copies are identified by an element of the symmetry group
(`LPrime.FlSemiPm.exists_smul_eq`). -/
theorem conjugateSynchronization (L : LPrime) (t t' : L.Fl) : ∃ g : L.FlSemiPm, g • t = t' :=
  LPrime.FlSemiPm.exists_smul_eq L t t'

/-- The labels descend to the classes `|t| ∈ |F_l|`: the sign part of the
symmetry preserves the class (`absLabel_negate_smul`), and every class is hit. -/
theorem classes_descend (L : LPrime) :
    (∀ t : L.Fl, L.absLabel (LPrime.FlSemiPm.negate L • t) = L.absLabel t) ∧
    (∀ j ∈ L.FlAbs, ∃ t : L.Fl, L.absLabel t = j) := by
  refine ⟨fun t => LPrime.FlSemiPm.absLabel_negate_smul L t, fun j hj => ?_⟩
  rcases Nat.eq_zero_or_pos j with rfl | hpos
  · exact ⟨0, (L.absLabel_eq_zero_iff 0).mpr rfl⟩
  · exact L.absLabel_surjective (L.mem_FlStar.mpr ⟨hpos, L.mem_FlAbs.mp hj⟩)

/-- The multiplicative symmetry is transitive on `F_l^*` (`FlStarSym_transitive`). -/
theorem multiplicative_transitive (L : LPrime) {j j' : ℕ} (hj : j ∈ L.FlStar) (hj' : j' ∈ L.FlStar) :
    ∃ u : L.Flˣ, L.FlStarSym u j = j' :=
  L.FlStarSym_transitive hj hj'

/-- `iut_label_subset_keeps_symmetry`: [IUTchII] Rem 4.11.1 (ii)-(iii); [IUTchI]
Rem 6.12.6: the `F_l^*`-symmetry acts only on the full label set `F_l^*`. -/
def KeepsSymmetryStar (L : LPrime) (S : Finset ℕ) : Prop := S = L.FlStar

/-- Likewise the `F_l^{⋊±}`-symmetry acts only on the full `F_l`. -/
def KeepsSymmetryPm (L : LPrime) (S : Finset L.Fl) : Prop := S = Finset.univ

/-- Restricting to the single label `j = 1` destroys the symmetry (`l* ≥ 2`) —
even though it is where the Θ×μ_gau-link is the identity
(`ThetaEvaluation.value_one`). -/
theorem singleton_one_not_keeps (L : LPrime) : ¬ KeepsSymmetryStar L {1} := by
  intro h
  have := congrArg Finset.card h
  rw [Finset.card_singleton, L.card_FlStar] at this
  have := L.two_le_LStar
  omega

/-! ## [IUTchII] Cor 4.5 (ii): the global realified Frobenioid from the core (`RealifyFromDMono`) -/

/-- The local datum of `D⊩(D⊢)` at the place `v` (index `i`), from the local
datum of `D⊢`: no `Π_v`, the same copy of `G_v`, the realified value group
`ℝ_{≥0}(D⊢)_v` of the semisimplification as a (split) Frobenius-like monoid
constructed from `G_v`, with the generator `q̲_v` at the bad places. -/
def realifyLocal (i : ℕ) (v : Valuation) (L : LocalDatum) : LocalDatum where
  Pi := none
  G := L.G
  units := some ⟨L.G.univ, L.G.strip, i, .units⟩
  unitsModTors := false
  hasValgroup := true
  hasSplitting := true
  val := if v.inVBad then [1] else []
  kummer := .none

/-- `iut_global_realified_from_DMono`: from `D⊢` one constructs
`D⊩(D⊢) = (C⊩, Prime(C⊩) → V, {ρ_v})`, the global realified Frobenioid of
arithmetic divisors with `ℝ`-coefficients whose local components are the
`ℝ_{≥0}(D⊢)_v` of the semisimplifications; the degree of its pilot object is
`−|log q| = −log q / 2l` ([IUTchII] Cor 4.5 (ii); [IUTchIII] Def 3.8). -/
def globalRealifiedFromDMono (d : InitialThetaData) (ps : PrimeStrip) : PrimeStrip where
  kind := .FMonoGlobPrimeStrip
  label := "DMonoGlob"
  loc := (ps.loc.zip d.V).mapIdx fun i p => realifyLocal i p.2 p.1
  hasGlobalRealified := true
  globalDegreeInLogQ := -1 / (2 * d.l)

theorem globalRealifiedFromDMono_kind (d : InitialThetaData) (ps : PrimeStrip) :
    (globalRealifiedFromDMono d ps).kind = .FMonoGlobPrimeStrip := rfl

theorem globalRealifiedFromDMono_loc_length (d : InitialThetaData) (ps : PrimeStrip)
    (h : ps.loc.length = d.V.length) :
    (globalRealifiedFromDMono d ps).loc.length = d.V.length := by
  simp [globalRealifiedFromDMono, h]

/-- **`D⊩(D⊢)` is a well-formed `F⊩`-strip** whenever the core has one local
datum per place and `l > 0`. -/
theorem globalRealifiedFromDMono_wellFormed (d : InitialThetaData) (ps : PrimeStrip)
    (h : ps.loc.length = d.V.length) (hl : 0 < d.l) :
    (globalRealifiedFromDMono d ps).WellFormed d := by
  unfold PrimeStrip.WellFormed PrimeStrip.check
  have hdeg : (-1 : ℚ) / (2 * d.l) ≤ 0 := by
    apply div_nonpos_of_nonpos_of_nonneg (by norm_num)
    have : (0 : ℚ) < d.l := by exact_mod_cast hl
    linarith
  simp only [globalRealifiedFromDMono, List.length_mapIdx, List.length_zip, h, min_self,
    beq_self_eq_true, Bool.true_and, PrimeStripKind.hasGlobal, Bool.not_true, Bool.false_or,
    hdeg, decide_true, Bool.and_true, List.all_eq_true, List.mem_mapIdx]
  rintro L ⟨i, hi, rfl⟩
  simp [LocalDatum.check, LocalDatum.checks, realifyLocal, PrimeStripKind.isMonoAnalytic,
    PrimeStripKind.isEtaleLike, PrimeStripKind.hasValgroup, PrimeStripKind.isUnitsModTors,
    PrimeStripKind.hasSplitting]

/-- `G_v` is kept: `D⊩(D⊢)` is built on the same copies of `G_v` as the core. -/
theorem globalRealifiedFromDMono_G (d : InitialThetaData) (ps : PrimeStrip) (i : ℕ)
    (hi : i < (globalRealifiedFromDMono d ps).loc.length) :
    ((globalRealifiedFromDMono d ps).loc[i]).G =
      (ps.loc[i]'(by simp [globalRealifiedFromDMono] at hi; omega)).G := by
  simp [globalRealifiedFromDMono, realifyLocal, List.getElem_zip]

/-- `Π_v` is not reconstructed: `D⊩(D⊢)` is mono-analytic. -/
theorem globalRealifiedFromDMono_Pi (d : InitialThetaData) (ps : PrimeStrip) (i : ℕ)
    (hi : i < (globalRealifiedFromDMono d ps).loc.length) :
    ((globalRealifiedFromDMono d ps).loc[i]).Pi = none := by
  simp [globalRealifiedFromDMono, realifyLocal]

/-- [IUTchII] Def 4.9 (viii): the pilot object has arithmetic degree `< 0`. -/
theorem globalRealifiedFromDMono_degree_neg (d : InitialThetaData) (ps : PrimeStrip) (hl : 0 < d.l) :
    (globalRealifiedFromDMono d ps).globalDegreeInLogQ < 0 := by
  simp only [globalRealifiedFromDMono]
  have : (0 : ℚ) < d.l := by exact_mod_cast hl
  apply div_neg_of_neg_of_pos (by norm_num)
  linarith

/-- The degree is that of the `q`-pilot of any Hodge theater over `d`
(`ThetaPmEllNFHodgeTheater.build`): `−|log q|`. -/
theorem globalRealifiedFromDMono_degree_eq_qPilot (d : InitialThetaData) (ps : PrimeStrip) (n m : ℤ) (u : ℕ) :
    (globalRealifiedFromDMono d ps).globalDegreeInLogQ =
      (ThetaPmEllNFHodgeTheater.build d n m u).qPilot.logVolumeInLogQ := rfl

/-- [IUTchII] Cor 4.10 (v): `D⊩(†D⊢) ≅ D⊩(‡D⊢)` — built from étale-like data,
the global realified Frobenioids of any two cores over `d` have the same
degree (so they are horizontally coric, here even on the nose rather than up
to `ℝ_{>0}`). -/
theorem globalRealifiedFromDMono_coric (d : InitialThetaData) (ps ps' : PrimeStrip) :
    (globalRealifiedFromDMono d ps).globalDegreeInLogQ =
      (globalRealifiedFromDMono d ps').globalDegreeInLogQ := rfl

/-! ## [IUTchII] Def 4.9: the forgetting ladder (`ForgetLadder`) -/

/-- The kinds of the forgetful ladder `F⊩▶×μ → F⊢▶×μ → F⊢×μ → D⊢` ([IUTchII]
Def 4.9 (vii)-(viii); [IUTchI] Def 4.1 (iii), Def 5.2, Rem 5.2.1).  The
remaining strip of Def 4.9, `F⊢×`, sits *beside* the ladder: `O×μ = O×/μ` is
forgotten from `O×`, not conversely (`units_lift`). -/
def ladderKinds : List PrimeStripKind :=
  [.FMonoGlobValUnitsModTorsPrimeStrip, .FMonoValUnitsModTorsPrimeStrip,
   .FMonoUnitsModTorsPrimeStrip, .DMonoPrimeStrip]

theorem ladderKinds_length : ladderKinds.length = 4 := rfl

/-- Each rung forgets to the next (`PrimeStrip.Forgettable`). -/
theorem ladderKinds_forgettable :
    (ladderKinds.zip ladderKinds.tail).all (fun p => PrimeStrip.Forgettable p.1 p.2) = true := by
  decide

/-- [IUTchII] Def 4.9 (vi): `F⊢×μ ⇝ F⊢×` is a *lift* (`O×μ ← O×`), not a
forgetful mutation: `F⊢×` forgets to `F⊢×μ` and to `D⊢`, but `F⊢×μ` does not
forget to `F⊢×` — the `×`-Kummer structure cannot be recovered from the
`×μ`-Kummer structure (which is why (Ind2) appears). -/
theorem units_lift :
    PrimeStrip.Forgettable .FMonoUnitsModTorsPrimeStrip .FMonoUnitsPrimeStrip = false ∧
    PrimeStrip.Forgettable .FMonoUnitsPrimeStrip .FMonoUnitsModTorsPrimeStrip = true ∧
    PrimeStrip.Forgettable .FMonoUnitsPrimeStrip .DMonoPrimeStrip = true := by decide

/-- What each rung forgets: the global realified Frobenioid after the first,
the value group after the second, all monoids after the third; every rung is
mono-analytic and the first three carry `O×μ`. -/
theorem ladderKinds_structure :
    ladderKinds.map PrimeStripKind.hasGlobal = [true, false, false, false] ∧
    ladderKinds.map PrimeStripKind.hasValgroup = [true, true, false, false] ∧
    ladderKinds.map PrimeStripKind.isUnitsModTors = [true, true, true, false] ∧
    ladderKinds.map PrimeStripKind.isEtaleLike = [false, false, false, true] ∧
    ladderKinds.all PrimeStripKind.isMonoAnalytic = true := by decide

/-- The successive forgetful mutations along a list of kinds. -/
def ladderFrom (ps : PrimeStrip) : List PrimeStripKind → List PrimeStrip
  | [] => []
  | k :: ks => let q := ps.forget k; q :: ladderFrom q ks

/-- `iut_ps_forget_ladder`: the ladder from an `F⊩▶×μ`-strip down to its core `D⊢`. -/
def ladder (ps : PrimeStrip) : List PrimeStrip := ps :: ladderFrom ps ladderKinds.tail

/-- The bottom of the ladder: the étale-like mono-analytic core `D⊢`. -/
def core (ps : PrimeStrip) : PrimeStrip :=
  ((ps.forget .FMonoValUnitsModTorsPrimeStrip).forget .FMonoUnitsModTorsPrimeStrip).forget
    .DMonoPrimeStrip

theorem ladder_length (ps : PrimeStrip) : (ladder ps).length = 4 := rfl

theorem ladder_kinds (ps : PrimeStrip) (h : ps.kind = .FMonoGlobValUnitsModTorsPrimeStrip) :
    (ladder ps).map (·.kind) = ladderKinds := by
  simp [ladder, ladderFrom, ladderKinds, PrimeStrip.forget, h]

theorem core_mem_ladder (ps : PrimeStrip) : core ps ∈ ladder ps := by
  simp [ladder, ladderFrom, ladderKinds, core]

theorem core_kind (ps : PrimeStrip) : (core ps).kind = .DMonoPrimeStrip := rfl

/-- **Every rung of the ladder is well-formed** (`PrimeStrip.forget_wellFormed`
three times). -/
theorem ladder_wellFormed (d : InitialThetaData) (ps : PrimeStrip)
    (h : ps.kind = .FMonoGlobValUnitsModTorsPrimeStrip) (hw : ps.WellFormed d) :
    ∀ q ∈ ladder ps, q.WellFormed d := by
  have h1 := PrimeStrip.forget_wellFormed d ps .FMonoValUnitsModTorsPrimeStrip (by rw [h]; rfl) hw
  have h2 := PrimeStrip.forget_wellFormed d _ .FMonoUnitsModTorsPrimeStrip rfl h1
  have h3 := PrimeStrip.forget_wellFormed d _ .DMonoPrimeStrip rfl h2
  intro q hq
  simp only [ladder, ladderFrom, ladderKinds, List.tail_cons, List.mem_cons, List.not_mem_nil,
    or_false] at hq
  rcases hq with rfl | rfl | rfl | rfl <;> assumption

theorem core_loc_length (ps : PrimeStrip) : (core ps).loc.length = ps.loc.length := by
  simp [core, PrimeStrip.forget]

/-- **`G_v` is never forgotten**: the core carries the copies of `G_v` of the
strip it was forgotten from (`PrimeStrip.forget_G` three times). -/
theorem core_G (ps : PrimeStrip) (i : ℕ) (hi : i < ps.loc.length) :
    ((core ps).loc[i]'(by rw [core_loc_length]; exact hi)).G = (ps.loc[i]).G := by
  simp [core, PrimeStrip.forget, LocalDatum.forget, PrimeStripKind.isEtaleLike,
    PrimeStripKind.isMonoAnalytic]

/-- The core has forgotten `Π_v` and the monoids. -/
theorem core_etale (ps : PrimeStrip) (i : ℕ) (hi : i < ps.loc.length) :
    ((core ps).loc[i]'(by rw [core_loc_length]; exact hi)).Pi = none ∧
    ((core ps).loc[i]'(by rw [core_loc_length]; exact hi)).units = none := by
  simp [core, PrimeStrip.forget, LocalDatum.forget, PrimeStripKind.isEtaleLike,
    PrimeStripKind.isMonoAnalytic]

/-- The third rung `F⊢×μ` (the BPS of [FormIUT]) carries its `×μ`-Kummer
structure, the `Ism`-orbit ([IUTchII] Def 4.9 (i)–(iv)) — the source of (Ind2). -/
theorem ladder_kummer (ps : PrimeStrip) (i : ℕ) (hi : i < ps.loc.length) :
    (((ps.forget .FMonoValUnitsModTorsPrimeStrip).forget .FMonoUnitsModTorsPrimeStrip).loc[i]'(by
      simp [PrimeStrip.forget]; exact hi)).kummer = .unitsModTors := by
  simp [PrimeStrip.forget, LocalDatum.forget, PrimeStripKind.isEtaleLike, PrimeStripKind.isMonoAnalytic]

/-- The core is bi-coric (`PrimeStripKind.biCoric_iff`), the BPS `F⊢×μ` is
horizontally coric: the ladder ends in the data shared across both links. -/
theorem ladder_coricity :
    PrimeStripKind.biCoric .DMonoPrimeStrip = true ∧
    PrimeStripKind.horizontallyCoric .FMonoUnitsModTorsPrimeStrip = true ∧
    (ladderKinds.filter PrimeStripKind.horizontallyCoric).length = 2 := by decide

/-- `iut_pilot_object_degree`: the arithmetic degree of the pilot object of an
`F⊩`-strip ([IUTchII] Def 4.9 (viii)). -/
def pilotDegree (ps : PrimeStrip) : ℚ := if ps.hasGlobalRealified then ps.globalDegreeInLogQ else 0

/-- A well-formed strip has pilot degree `≤ 0`. -/
theorem pilotDegree_nonpos (d : InitialThetaData) (ps : PrimeStrip) (h : ps.WellFormed d) :
    pilotDegree ps ≤ 0 := by
  unfold PrimeStrip.WellFormed PrimeStrip.check at h
  simp only [Bool.and_eq_true, Bool.or_eq_true, Bool.not_eq_true', decide_eq_true_eq] at h
  unfold pilotDegree
  split_ifs with hg
  · rcases h.2 with h2 | h2
    · simp [hg] at h2
    · exact h2
  · exact le_refl 0

/-- The pilot degree of the Θ-pilot strip of a Hodge theater is strictly
negative: `−(average of j²)/2l < 0` ([IUTchII] Def 4.9 (viii)). -/
theorem thetaPilot_degree_neg (d : InitialThetaData) (hd : d.WellFormed) (n m : ℤ) (u : ℕ) :
    (ThetaPmEllNFHodgeTheater.build d n m u).thetaPilot.logVolumeInLogQ < 0 ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).qPilot.logVolumeInLogQ < 0 := by
  have hl : (0 : ℚ) < d.l := by exact_mod_cast hd.l_prime.pos
  have havg : 0 < PrimeStrip.averageExp (ThetaPmEllNFHodgeTheater.thetaExps d) := by
    unfold PrimeStrip.averageExp
    split_ifs with h0
    · norm_num
    · apply div_pos
      · have hmem : (1 : ℚ) ∈ (ThetaPmEllNFHodgeTheater.thetaExps d).map (Nat.cast : ℕ → ℚ) := by
          simp only [ThetaPmEllNFHodgeTheater.thetaExps, List.map_map, List.mem_map, List.mem_range]
          exact ⟨0, by have := d.two_le_LStar hd; omega, by simp⟩
        have hnn : ∀ x ∈ (ThetaPmEllNFHodgeTheater.thetaExps d).map (Nat.cast : ℕ → ℚ), 0 ≤ x := by
          intro x hx
          rw [List.mem_map] at hx
          obtain ⟨e, _, rfl⟩ := hx
          exact Nat.cast_nonneg e
        have := List.single_le_sum hnn 1 hmem
        linarith
      · have : (ThetaPmEllNFHodgeTheater.thetaExps d).length ≠ 0 := by
          intro h; exact h0 (List.isEmpty_iff_length_eq_zero.mpr h)
        exact_mod_cast Nat.pos_of_ne_zero this
  constructor
  · simp only [ThetaPmEllNFHodgeTheater.build, ThetaPmEllNFHodgeTheater.glue]
    apply div_neg_of_neg_of_pos (by linarith)
    linarith
  · simp only [ThetaPmEllNFHodgeTheater.build, ThetaPmEllNFHodgeTheater.glue]
    apply div_neg_of_neg_of_pos (by norm_num)
    linarith

/-! ## [IUTchII] Cor 4.10, Rem 4.11.1: the Θ×μ-links (`LinkThetaUnitsModTors`) -/

/-- `iut_constant_strip_identify`: [IUTchII] Cor 4.10 (i): the symmetrizing
isomorphisms identify the labelled copies `Ψ_cns(†F⊢)_0` and
`Ψ_cns(†F⊢)_{F_l^*}` (diagonal) and give `†F⊩_Δ ≅ †F⊩_mod` ("`0, ⊞ ↦ >`"): in
a built Hodge theater the gluing has been performed and the two strips carry
the global realified Frobenioid with the same degree. -/
theorem constantStripIdentify (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (ThetaPmEllNFHodgeTheater.build d n m u).glued = true ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobTriangle.hasGlobalRealified = true ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).nf.tht.FMonoGlobMod.hasGlobalRealified = true ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobTriangle.globalDegreeInLogQ =
      (ThetaPmEllNFHodgeTheater.build d n m u).nf.tht.FMonoGlobMod.globalDegreeInLogQ :=
  ⟨rfl, rfl, rfl, rfl⟩

/-- `iut_envelope_isos`: [IUTchII] Cor 4.10 (ii): `†F⊩_env ≅ †F⊩_tht` and the
evaluation isomorphism `†F⊩_env ≅ †F⊩_gau`: same degree, same value-group
generators at every place. -/
theorem envelopeIsos (d : InitialThetaData) (n m : ℤ) (u : ℕ) :
    (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobEnv.globalDegreeInLogQ =
      (ThetaPmEllNFHodgeTheater.build d n m u).nf.tht.FMonoGlobTht.globalDegreeInLogQ ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobEnv.globalDegreeInLogQ =
      (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobGau.globalDegreeInLogQ ∧
    ∀ i (hi : i < (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobEnv.loc.length)
      (hi' : i < (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobGau.loc.length),
      ((ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobEnv.loc[i]).val =
        ((ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobGau.loc[i]).val := by
  refine ⟨rfl, rfl, fun i hi hi' => ?_⟩
  simp [ThetaPmEllNFHodgeTheater.build, ThetaPmEllNFHodgeTheater.glue, PrimeStrip.build,
    LocalDatum.build]

/-- `iut_theta_link_make`: [IUTchII] Cor 4.10 (iii): the Θ×μ-type links are full
poly-isomorphisms of `F⊩▶×μ`-strips that identify `G_v` and `O×μ` but neither
`Π_v` nor the ring structures, with dilation `l(l+1)/12` (`Link.thetaLinkOf`). -/
theorem thetaUnitsModTorsLink_glues (k : LinkKind) (hk : k ≠ .LogLink) (hk' : k ≠ .ThetaLink)
    (d : InitialThetaData) (n m : ℤ) :
    (Link.thetaLinkOf k d n m).gluedKind = .FMonoGlobValUnitsModTorsPrimeStrip ∧
    (Link.thetaLinkOf k d n m).fullPolyIsomorphism = true ∧
    (Link.thetaLinkOf k d n m).preservesG = true ∧
    (Link.thetaLinkOf k d n m).preservesUnitsModTors = true ∧
    (Link.thetaLinkOf k d n m).preservesPi = false ∧
    (Link.thetaLinkOf k d n m).preservesRingStructure = false ∧
    (Link.thetaLinkOf k d n m).dilation = Link.thetaDilation d ∧
    (Link.thetaLinkOf k d n m).WellFormed d := by
  refine ⟨?_, rfl, rfl, ?_, rfl, rfl, rfl, Link.thetaLinkOf_wellFormed k hk d n m⟩ <;>
    cases k <;> simp_all [Link.thetaLinkOf]

/-- `iut_theta_link_coric_units`: [IUTchII] Cor 4.10 (iv): across a Θ×μ-link
the units modulo torsion are coric — after the link, the `O×μ` copies of the
codomain's `F⊩_Δ` are those of the domain's glued strip
(`applyThetaLink_shares_units`), and the kind `F⊢×μ` they are forgotten to is
horizontally coric. -/
theorem thetaLink_coric_units (dom cod : ThetaPmEllNFHodgeTheater) (i : ℕ)
    (hi : i < (ThetaPmEllNFHodgeTheater.applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom
      cod).FMonoGlobTriangle.loc.length) :
    (((ThetaPmEllNFHodgeTheater.applyThetaLink .ThetaUnitsModTorsLGPTorsorLink dom
        cod).FMonoGlobTriangle.forget .FMonoUnitsModTorsPrimeStrip).loc[i]'(by
          simpa [PrimeStrip.forget] using hi)).units =
      ((dom.FMonoGlobLGP.forget .FMonoUnitsModTorsPrimeStrip).loc[i]'(by
        simp [ThetaPmEllNFHodgeTheater.applyThetaLink, ThetaPmEllNFHodgeTheater.shareGUnits,
          ThetaPmEllNFHodgeTheater.thetaSource, PrimeStrip.forget] at hi ⊢; omega)).units ∧
    PrimeStripKind.horizontallyCoric .FMonoUnitsModTorsPrimeStrip = true := by
  refine ⟨?_, rfl⟩
  simp [PrimeStrip.forget, LocalDatum.forget, PrimeStripKind.isEtaleLike,
    PrimeStripKind.isMonoAnalytic, ThetaPmEllNFHodgeTheater.applyThetaLink,
    ThetaPmEllNFHodgeTheater.shareGUnits, ThetaPmEllNFHodgeTheater.thetaSource]

/-- `iut_theta_link_induced_D_link`: [IUTchII] Cor 4.10 (iv): the Θ×μ-link
induces, on the `D⊢`-strips, the full poly-isomorphism `†D⊢ ≅ ‡D⊢`, the
D-Θ±ell NF-link of the étale picture: it glues `D⊢`, preserves `G_v`, no
longer carries units or a dilation. -/
def inducedDLink (L : Link) : Link :=
  { L with
    kind := .DThetaPmEllNFLink
    gluedKind := .DMonoPrimeStrip
    preservesUnitsModTors := false
    preservesG := true
    dilation := 1 }

theorem inducedDLink_props (L : Link) :
    (inducedDLink L).kind = .DThetaPmEllNFLink ∧ (inducedDLink L).gluedKind = .DMonoPrimeStrip ∧
    (inducedDLink L).preservesG = true ∧ (inducedDLink L).dilation = 1 ∧
    (inducedDLink L).dom = L.dom ∧ (inducedDLink L).cod = L.cod :=
  ⟨rfl, rfl, rfl, rfl, rfl, rfl⟩

/-- The induced D-link of a well-formed horizontal link is still a full
poly-isomorphism that identifies no `Π_v` and no ring structure. -/
theorem inducedDLink_of_wellFormed (d : InitialThetaData) (L : Link) (h : L.WellFormed d)
    (hk : L.kind ≠ .LogLink) :
    (inducedDLink L).fullPolyIsomorphism = true ∧ (inducedDLink L).preservesPi = false ∧
    (inducedDLink L).preservesRingStructure = false := by
  have h' := (Link.wellFormed_iff d L).mp h
  refine ⟨h'.2.1, ?_, h'.1⟩
  have := h'.2.2.2.2.1
  split_ifs at this with h
  · exact absurd h hk
  · exact this

/-- `iut_coric_global_realified`: [IUTchII] Cor 4.10 (v): across a Θ×μ-link the
global realified Frobenioids of the cores are coric up to `ℝ_{>0}`: the link
does not change the degree of the codomain's `F⊩_Δ`, and for Hodge theaters
over the same data the degrees of `D⊩(†D⊢)` and `D⊩(‡D⊢)` coincide. -/
theorem coricGlobalRealified (k : LinkKind) (hk : k ≠ .ThetaLink)
    (dom cod : ThetaPmEllNFHodgeTheater) (d : InitialThetaData) (n m n' m' : ℤ) (u u' : ℕ) :
    (ThetaPmEllNFHodgeTheater.applyThetaLink k dom cod).FMonoGlobTriangle.globalDegreeInLogQ =
      cod.FMonoGlobTriangle.globalDegreeInLogQ ∧
    (ThetaPmEllNFHodgeTheater.build d n m u).FMonoGlobTriangle.globalDegreeInLogQ =
      (ThetaPmEllNFHodgeTheater.build d n' m' u').FMonoGlobTriangle.globalDegreeInLogQ := by
  refine ⟨?_, rfl⟩
  simp [ThetaPmEllNFHodgeTheater.applyThetaLink, ThetaPmEllNFHodgeTheater.shareGUnits, hk]

/-- `iut_theta_gau_exponents`: [IUTchII] Rem 4.11.1 (i): the Θ×μ_gau-link sends
`q̲ ↦ (q̲^{1²}, q̲^{2²}, …, q̲^{(l*)²})`. -/
def gauExponents (d : InitialThetaData) : List ℕ := (List.range d.LStar).map fun j => (j + 1) ^ 2

theorem gauExponents_eq_thetaExps (d : InitialThetaData) :
    gauExponents d = ThetaPmEllNFHodgeTheater.thetaExps d := rfl

theorem gauExponents_length (d : InitialThetaData) : (gauExponents d).length = d.LStar := by
  simp [gauExponents]

/-- Its restriction to the label `j = 1` is the identity `q̲ ↦ q̲`. -/
theorem gauExponents_head (d : InitialThetaData) (hd : d.WellFormed) :
    (gauExponents d).head? = some 1 := by
  obtain ⟨k, hk⟩ : ∃ k, d.LStar = k + 1 := ⟨d.LStar - 1, by have := d.two_le_LStar hd; omega⟩
  simp [gauExponents, hk, List.range_succ_eq_map]

/-- The exponents are the theta values on `F_l^*` (`ThetaEvaluation.values_FlStar`):
the Θ×μ_gau-link is the Galois evaluation. -/
theorem gauExponents_eq_values (d : InitialThetaData) (hd : d.WellFormed)
    (E : ThetaEvaluation (d.toLPrime hd)) :
    gauExponents d = (List.range d.LStar).map (fun j => E.value ((j + 1 : ℕ) : (d.toLPrime hd).Fl)) :=
  (ThetaEvaluation.values_FlStar d hd E).symm

/-- The dilation of the Θ-link is the average of the exponents
(`Link.thetaDilation_eq_average`): the "`N`" of the `N`-th power map of
[FormIUT] §3. -/
theorem gauExponents_average (d : InitialThetaData) (hd : d.WellFormed) :
    PrimeStrip.averageExp (gauExponents d) = Link.thetaDilation d := by
  have hn : 2 ≤ d.LStar := d.two_le_LStar hd
  have hl : (d.l : ℚ) = 2 * d.LStar + 1 := by exact_mod_cast (d.two_LStar_add_one hd).symm
  have hne : (gauExponents d).isEmpty = false := by
    cases h : gauExponents d with
    | nil => have := gauExponents_length d; rw [h] at this; simp at this; omega
    | cons _ _ => rfl
  have hsum : ((gauExponents d).map (Nat.cast : ℕ → ℚ)).sum =
      ∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 1) ^ 2 := by
    rw [gauExponents, List.map_map, ← List.toFinset_range, List.sum_toFinset _ List.nodup_range]
    simp [Function.comp_def]
  have h6 : (6 : ℚ) * ∑ i ∈ Finset.range d.LStar, ((i : ℚ) + 1) ^ 2 =
      d.LStar * (d.LStar + 1) * (2 * d.LStar + 1) := by
    have := six_mul_sum_range_succ_sq d.LStar
    exact_mod_cast this
  have hpos : (d.LStar : ℚ) ≠ 0 := by exact_mod_cast (by omega : d.LStar ≠ 0)
  simp only [PrimeStrip.averageExp, hne, Bool.false_eq_true, ↓reduceIte, hsum, gauExponents_length,
    Link.thetaDilation, hl]
  field_simp
  linarith [h6]

/-! ## Stage 3 ⟹ Stage 2 ⟹ Stage 1 -/

/-- The three stages as one chain: the eleven inputs of Stage 2 are steps of
Stage 3 resting on the earlier results; Stage 2's twelve steps feed Thm 3.11;
Stage 1 continues with Cor 3.12. -/
theorem stage_three_then_two_then_one :
    StageTwo.inputs.all (fun i => steps.any (·.id = i.id)) = true ∧
    StageTwo.inputs.all (fun i => !(earlierClosure i.id).isEmpty) = true ∧
    (Process.byPaper .IUTchIII).map (·.id) =
      StageTwo.steps.map (·.id) ++ ["EstimateLogVolume"] :=
  ⟨feeds_stage_two, inputs_rest_on_earlier, StageTwo.steps_cover_IUTchIII⟩

end StageThree

end IUT
