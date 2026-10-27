/-
# The log-theta-lattice

Port of `iut_log_theta_lattice` and the lattice operations of `src/iut_lattice.c`
(`iut_lattice_init`, `iut_lattice_get`, `iut_apply_log_link`,
`iut_apply_theta_link`, `iut_lattice_build_H`, `iut_validate_lattice`) to Lean.

References: [IUTchIII] Def. 1.4, Def. 3.8 (iii), Fig. I.1; [EssLgc] §3.10;
[Alien] §3.11 Fig. 3.14.

The lattice is a finite collection of vertices `{n,m}HT` (Θ±ellNF-Hodge
theaters), each built in its own universe, together with the links that have
been applied so far.  Vertices are created lazily (`ensure`) with fresh
universe labels drawn from `nextUniverse`, exactly as in the C code.

The main results are

* `Invariant`: the validator `iut_validate_lattice` as a `Prop`
  (all vertices well-formed and built from the same initial Θ-data, pairwise
  distinct universes, pairwise distinct positions, all links well-formed with
  both endpoints present);
* `init_invariant`, `ensure_invariant`, `applyLogLink_invariant`,
  `applyThetaLink_invariant`, `buildH_invariant`: every operation preserves
  the invariant, hence (`exists_invariant`) well-formed lattices exist;
* `buildH_countP_horizontal`: the "infinite H" of [EssLgc] §3.10 contains
  exactly one Θ-link, and `buildH_countP_vertical` counts its log-links;
* `applyLogLink_verticallyCoric`: the log-link literally identifies the
  étale-like data (`Π_v`, `G_v`) of `F_>` at `(n,m)` and `(n,m+1)`;
* `applyThetaLink_horizontallyCoric`: the `Θ×μ_LGP`-link identifies the
  `O×μ` copies of `†F⊩_LGP` and `‡F⊩_Δ`;
* `alien`: any two distinct vertices of a lattice satisfying the invariant
  live in distinct universes ([Alien] §1).
-/
import IUT.Link
import Mathlib.Data.List.Nodup

namespace IUT

open ThetaPmEllNFHodgeTheater

/-- The log-theta-lattice: a finite set of created vertices, the links applied
so far, a counter of fresh universes, and the Θ-link flavour used for the
horizontal arrows ([IUTchIII] Def 3.8 (iii)). -/
structure LogThetaLattice where
  data : InitialThetaData
  /-- which Θ-type link is used horizontally (never the log-link) -/
  horizontal : LinkKind
  /-- the vertices created so far, in creation order -/
  vertices : List ThetaPmEllNFHodgeTheater
  nextUniverse : ℕ
  links : List Link
  /-- the vertex the current "infinite H" is centred on -/
  focus : ℤ × ℤ

namespace LogThetaLattice

/-- The position `(n, m)` of a vertex. -/
def pos (ht : ThetaPmEllNFHodgeTheater) : ℤ × ℤ := (ht.n, ht.m)

/-- `iut_lattice_init`: an empty lattice with the single vertex `{0,0}HT`. -/
def init (d : InitialThetaData) (k : LinkKind) : LogThetaLattice where
  data := d
  horizontal := if k = .LogLink ∨ k = .DThetaPmEllNFLink then .ThetaUnitsModTorsLGPTorsorLink else k
  vertices := [ThetaPmEllNFHodgeTheater.build d 0 0 0]
  nextUniverse := 1
  links := []
  focus := (0, 0)

/-- Look up the vertex at `(n, m)`, if created. -/
def get? (lat : LogThetaLattice) (n m : ℤ) : Option ThetaPmEllNFHodgeTheater :=
  lat.vertices.find? fun ht => ht.n = n ∧ ht.m = m

/-- `iut_lattice_get`: the vertex at `(n, m)`, created in a fresh universe if
necessary.  Returns the (possibly new) lattice and the vertex. -/
def ensure (lat : LogThetaLattice) (n m : ℤ) : LogThetaLattice × ThetaPmEllNFHodgeTheater :=
  match lat.get? n m with
  | some ht => (lat, ht)
  | none =>
    let ht := ThetaPmEllNFHodgeTheater.build lat.data n m lat.nextUniverse
    ({ lat with vertices := lat.vertices ++ [ht], nextUniverse := lat.nextUniverse + 1 }, ht)

/-- Replace the vertex at `(n, m)` by `f` of itself (no-op if absent). -/
def updateAt (lat : LogThetaLattice) (n m : ℤ)
    (f : ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater) : LogThetaLattice :=
  { lat with vertices := lat.vertices.map fun ht => if ht.n = n ∧ ht.m = m then f ht else ht }

/-- Record a link. -/
def addLink (lat : LogThetaLattice) (L : Link) : LogThetaLattice :=
  { lat with links := lat.links ++ [L] }

/-- `iut_apply_log_link`: the log-link `(n,m) → (n,m+1)`.  Both endpoints are
created if needed, the codomain is replaced by `applyLogLink dom cod`, and the
link is recorded. -/
def applyLogLink (lat : LogThetaLattice) (n m : ℤ) : LogThetaLattice :=
  let e := lat.ensure n m
  let lat₂ := (e.1.ensure n (m + 1)).1
  (lat₂.updateAt n (m + 1) (ThetaPmEllNFHodgeTheater.applyLogLink e.2)).addLink (Link.logLinkOf n m)

/-- `iut_apply_theta_link`: the horizontal link `(n,m) → (n+1,m)` of the
lattice's flavour. -/
def applyThetaLink (lat : LogThetaLattice) (n m : ℤ) : LogThetaLattice :=
  let e := lat.ensure n m
  let lat₂ := (e.1.ensure (n + 1) m).1
  (lat₂.updateAt (n + 1) m (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal e.2)).addLink
    (Link.thetaLinkOf lat.horizontal lat.data n m)

/-- The rows `mmin, mmin+1, …, mmax-1` (the domains of the log-links of a column). -/
def rows (mmin mmax : ℤ) : List ℤ := (List.range (mmax - mmin).toNat).map fun i => mmin + i

/-- Apply the log-links `(col, m) → (col, m+1)` for every `m` in `ms`. -/
def logColumn (lat : LogThetaLattice) (col : ℤ) (ms : List ℤ) : LogThetaLattice :=
  ms.foldl (fun l m => l.applyLogLink col m) lat

/-- `iut_lattice_build_H` ([EssLgc] §3.10; [Alien] §3.11 Fig. 3.14): the
"infinite H" actually used in the proof of [IUTchIII] Cor 3.12 — the two
vertical lines `(n, ◦)`, `(n+1, ◦)` between rows `mmin` and `mmax`, joined by
the single Θ-link `(n,0) → (n+1,0)`. -/
def buildH (lat : LogThetaLattice) (n mmin mmax : ℤ) : LogThetaLattice :=
  let lat := (lat.logColumn n (rows mmin mmax)).logColumn (n + 1) (rows mmin mmax)
  let lat := if mmin ≤ 0 ∧ 0 ≤ mmax then lat.applyThetaLink n 0 else lat
  { lat with focus := (n, 0) }

/-! ### The validator `iut_validate_lattice` as a proposition -/

/-- Everything `iut_validate_lattice` checks, plus the bookkeeping that makes
the checks hold after every operation. -/
structure Invariant (lat : LogThetaLattice) : Prop where
  data_wf : lat.data.WellFormed
  horizontal_ne : lat.horizontal ≠ .LogLink
  vertices_wf : ∀ ht ∈ lat.vertices, ht.WellFormed
  vertices_data : ∀ ht ∈ lat.vertices, ht.data = lat.data
  univ_lt : ∀ ht ∈ lat.vertices, ht.univ < lat.nextUniverse
  univ_nodup : (lat.vertices.map (·.univ)).Nodup
  pos_nodup : (lat.vertices.map pos).Nodup
  links_wf : ∀ L ∈ lat.links, L.WellFormed lat.data
  links_dom : ∀ L ∈ lat.links, ∃ ht ∈ lat.vertices, pos ht = L.dom
  links_cod : ∀ L ∈ lat.links, ∃ ht ∈ lat.vertices, pos ht = L.cod

/-! ### `init` -/

theorem init_horizontal_ne (d : InitialThetaData) (k : LinkKind) : (init d k).horizontal ≠ .LogLink := by
  unfold init
  split_ifs with h
  · simp
  · exact fun h' => h (Or.inl h')

theorem init_invariant (d : InitialThetaData) (hd : d.WellFormed) (k : LinkKind) :
    (init d k).Invariant where
  data_wf := hd
  horizontal_ne := init_horizontal_ne d k
  vertices_wf := by
    intro ht h
    simp only [init, List.mem_singleton] at h
    subst h
    exact build_wellFormed d hd 0 0 0
  vertices_data := by
    intro ht h
    simp only [init, List.mem_singleton] at h
    subst h
    rfl
  univ_lt := by
    intro ht h
    simp only [init, List.mem_singleton] at h
    subst h
    simp [init]
  univ_nodup := by simp [init]
  pos_nodup := by simp [init]
  links_wf := by simp [init]
  links_dom := by simp [init]
  links_cod := by simp [init]

/-! ### `get?` and `ensure` -/

theorem get?_some_mem {lat : LogThetaLattice} {n m : ℤ} {ht : ThetaPmEllNFHodgeTheater}
    (h : lat.get? n m = some ht) : ht ∈ lat.vertices :=
  List.mem_of_find?_eq_some h

theorem get?_some_pos {lat : LogThetaLattice} {n m : ℤ} {ht : ThetaPmEllNFHodgeTheater}
    (h : lat.get? n m = some ht) : pos ht = (n, m) := by
  have := List.find?_some h
  simp only [decide_eq_true_eq] at this
  simp [pos, this.1, this.2]

theorem get?_none {lat : LogThetaLattice} {n m : ℤ} (h : lat.get? n m = none) :
    ∀ ht ∈ lat.vertices, pos ht ≠ (n, m) := by
  intro ht hm hp
  have := List.find?_eq_none.mp h ht hm
  simp only [pos, Prod.mk.injEq] at hp
  simp [hp.1, hp.2] at this

@[simp] theorem ensure_data (lat : LogThetaLattice) (n m : ℤ) : (lat.ensure n m).1.data = lat.data := by
  unfold ensure; split <;> rfl

@[simp] theorem ensure_horizontal (lat : LogThetaLattice) (n m : ℤ) :
    (lat.ensure n m).1.horizontal = lat.horizontal := by
  unfold ensure; split <;> rfl

@[simp] theorem ensure_links (lat : LogThetaLattice) (n m : ℤ) : (lat.ensure n m).1.links = lat.links := by
  unfold ensure; split <;> rfl

theorem ensure_vertices_subset (lat : LogThetaLattice) (n m : ℤ) :
    lat.vertices ⊆ (lat.ensure n m).1.vertices := by
  unfold ensure; split
  · exact fun _ h => h
  · exact fun _ h => List.mem_append_left _ h

/-- The vertex returned by `ensure` is a vertex of the resulting lattice. -/
theorem ensure_snd_mem (lat : LogThetaLattice) (n m : ℤ) :
    (lat.ensure n m).2 ∈ (lat.ensure n m).1.vertices := by
  unfold ensure; split
  · exact get?_some_mem ‹_›
  · simp

theorem ensure_snd_pos (lat : LogThetaLattice) (n m : ℤ) : pos (lat.ensure n m).2 = (n, m) := by
  unfold ensure; split
  · exact get?_some_pos ‹_›
  · rfl

theorem ensure_get?_self (lat : LogThetaLattice) (n m : ℤ) :
    (lat.ensure n m).1.get? n m = some (lat.ensure n m).2 := by
  unfold ensure
  split
  · assumption
  · rename_i h
    simp only [get?] at h ⊢
    rw [List.find?_append, h]
    simp

theorem ensure_invariant {lat : LogThetaLattice} (h : lat.Invariant) (n m : ℤ) :
    (lat.ensure n m).1.Invariant := by
  unfold ensure
  split
  · exact h
  · rename_i hnone
    refine ⟨h.data_wf, h.horizontal_ne, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩
    · intro ht hm
      simp only [List.mem_append, List.mem_singleton] at hm
      rcases hm with hm | rfl
      · exact h.vertices_wf ht hm
      · exact build_wellFormed _ h.data_wf _ _ _
    · intro ht hm
      simp only [List.mem_append, List.mem_singleton] at hm
      rcases hm with hm | rfl
      · exact h.vertices_data ht hm
      · rfl
    · intro ht hm
      simp only [List.mem_append, List.mem_singleton] at hm
      rcases hm with hm | rfl
      · exact Nat.lt_succ_of_lt (h.univ_lt ht hm)
      · exact Nat.lt_succ_self _
    · simp only [List.map_append, List.map_cons, List.map_nil, build_univ]
      rw [List.nodup_append]
      refine ⟨h.univ_nodup, List.nodup_singleton _, ?_⟩
      intro a ha b hb
      simp only [List.mem_singleton] at hb
      subst hb
      obtain ⟨ht, hm, rfl⟩ := List.mem_map.mp ha
      exact Nat.ne_of_lt (h.univ_lt ht hm)
    · simp only [List.map_append, List.map_cons, List.map_nil]
      rw [List.nodup_append]
      refine ⟨h.pos_nodup, List.nodup_singleton _, ?_⟩
      intro a ha b hb
      simp only [List.mem_singleton] at hb
      subst hb
      obtain ⟨ht, hm, rfl⟩ := List.mem_map.mp ha
      exact get?_none hnone ht hm
    · exact h.links_wf
    · intro L hL
      obtain ⟨ht, hm, hp⟩ := h.links_dom L hL
      exact ⟨ht, List.mem_append_left _ hm, hp⟩
    · intro L hL
      obtain ⟨ht, hm, hp⟩ := h.links_cod L hL
      exact ⟨ht, List.mem_append_left _ hm, hp⟩

/-! ### `updateAt` and `addLink` -/

@[simp] theorem updateAt_data (lat : LogThetaLattice) (n m : ℤ) (f) : (lat.updateAt n m f).data = lat.data := rfl
@[simp] theorem updateAt_horizontal (lat : LogThetaLattice) (n m : ℤ) (f) :
    (lat.updateAt n m f).horizontal = lat.horizontal := rfl
@[simp] theorem updateAt_links (lat : LogThetaLattice) (n m : ℤ) (f) : (lat.updateAt n m f).links = lat.links := rfl
@[simp] theorem addLink_data (lat : LogThetaLattice) (L : Link) : (lat.addLink L).data = lat.data := rfl
@[simp] theorem addLink_horizontal (lat : LogThetaLattice) (L : Link) :
    (lat.addLink L).horizontal = lat.horizontal := rfl
@[simp] theorem addLink_vertices (lat : LogThetaLattice) (L : Link) : (lat.addLink L).vertices = lat.vertices := rfl
@[simp] theorem addLink_links (lat : LogThetaLattice) (L : Link) : (lat.addLink L).links = lat.links ++ [L] := rfl

/-- The invariant survives an in-place update of one vertex by a map that
preserves well-formedness, the data, the universe and the position. -/
theorem updateAt_invariant {lat : LogThetaLattice} (h : lat.Invariant) (n m : ℤ)
    (f : ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater)
    (hwf : ∀ ht ∈ lat.vertices, ht.WellFormed → (f ht).WellFormed)
    (hdata : ∀ ht, (f ht).data = ht.data) (huniv : ∀ ht, (f ht).univ = ht.univ)
    (hn : ∀ ht, (f ht).n = ht.n) (hm : ∀ ht, (f ht).m = ht.m) :
    (lat.updateAt n m f).Invariant := by
  have hpos : ∀ ht, pos (f ht) = pos ht := fun ht => by simp [pos, hn, hm]
  have hmap : ∀ g : ThetaPmEllNFHodgeTheater → ℤ × ℤ, (∀ ht, g (f ht) = g ht) →
      (lat.updateAt n m f).vertices.map g = lat.vertices.map g := by
    intro g hg
    simp only [updateAt, List.map_map]
    apply List.map_congr_left
    intro ht _
    simp only [Function.comp]
    split_ifs <;> simp [hg]
  have hmapu : (lat.updateAt n m f).vertices.map (·.univ) = lat.vertices.map (·.univ) := by
    simp only [updateAt, List.map_map]
    apply List.map_congr_left
    intro ht _
    simp only [Function.comp]
    split_ifs <;> simp [huniv]
  refine ⟨h.data_wf, h.horizontal_ne, ?_, ?_, ?_, ?_, ?_, h.links_wf, ?_, ?_⟩
  · intro ht' hm'
    obtain ⟨ht, hm, rfl⟩ := List.mem_map.mp hm'
    split_ifs
    · exact hwf ht hm (h.vertices_wf ht hm)
    · exact h.vertices_wf ht hm
  · intro ht' hm'
    obtain ⟨ht, hm, rfl⟩ := List.mem_map.mp hm'
    split_ifs
    · rw [hdata]; exact h.vertices_data ht hm
    · exact h.vertices_data ht hm
  · intro ht' hm'
    obtain ⟨ht, hm, rfl⟩ := List.mem_map.mp hm'
    split_ifs
    · rw [huniv]; exact h.univ_lt ht hm
    · exact h.univ_lt ht hm
  · rw [hmapu]; exact h.univ_nodup
  · rw [hmap pos hpos]; exact h.pos_nodup
  · intro L hL
    obtain ⟨ht, hm, hp⟩ := h.links_dom L hL
    refine ⟨if ht.n = n ∧ ht.m = m then f ht else ht, List.mem_map.mpr ⟨ht, hm, rfl⟩, ?_⟩
    split_ifs <;> simp [hpos, hp]
  · intro L hL
    obtain ⟨ht, hm, hp⟩ := h.links_cod L hL
    refine ⟨if ht.n = n ∧ ht.m = m then f ht else ht, List.mem_map.mpr ⟨ht, hm, rfl⟩, ?_⟩
    split_ifs <;> simp [hpos, hp]

theorem addLink_invariant {lat : LogThetaLattice} (h : lat.Invariant) (L : Link)
    (hL : L.WellFormed lat.data) (hdom : ∃ ht ∈ lat.vertices, pos ht = L.dom)
    (hcod : ∃ ht ∈ lat.vertices, pos ht = L.cod) : (lat.addLink L).Invariant := by
  refine ⟨h.data_wf, h.horizontal_ne, h.vertices_wf, h.vertices_data, h.univ_lt, h.univ_nodup,
    h.pos_nodup, ?_, ?_, ?_⟩
  · intro L' hL'
    simp only [addLink, List.mem_append, List.mem_singleton] at hL'
    rcases hL' with hL' | rfl
    · exact h.links_wf L' hL'
    · exact hL
  · intro L' hL'
    simp only [addLink, List.mem_append, List.mem_singleton] at hL'
    rcases hL' with hL' | rfl
    · exact h.links_dom L' hL'
    · exact hdom
  · intro L' hL'
    simp only [addLink, List.mem_append, List.mem_singleton] at hL'
    rcases hL' with hL' | rfl
    · exact h.links_cod L' hL'
    · exact hcod

/-- The position `(n, m)` is occupied after `ensure n m`. -/
theorem ensure_exists_pos (lat : LogThetaLattice) (n m : ℤ) :
    ∃ ht ∈ (lat.ensure n m).1.vertices, pos ht = (n, m) :=
  ⟨_, ensure_snd_mem lat n m, ensure_snd_pos lat n m⟩

/-- Positions occupied in `lat` stay occupied after `ensure`. -/
theorem ensure_exists_pos_of (lat : LogThetaLattice) (n m : ℤ) {p : ℤ × ℤ}
    (h : ∃ ht ∈ lat.vertices, pos ht = p) : ∃ ht ∈ (lat.ensure n m).1.vertices, pos ht = p := by
  obtain ⟨ht, hm, hp⟩ := h
  exact ⟨ht, ensure_vertices_subset lat n m hm, hp⟩

/-- Positions are preserved by `updateAt` of a position-preserving map. -/
theorem updateAt_exists_pos (lat : LogThetaLattice) (n m : ℤ) (f)
    (hn : ∀ ht, (f ht).n = ht.n) (hm : ∀ ht, (f ht).m = ht.m) {p : ℤ × ℤ}
    (h : ∃ ht ∈ lat.vertices, pos ht = p) : ∃ ht ∈ (lat.updateAt n m f).vertices, pos ht = p := by
  obtain ⟨ht, hmem, hp⟩ := h
  refine ⟨if ht.n = n ∧ ht.m = m then f ht else ht, List.mem_map.mpr ⟨ht, hmem, rfl⟩, ?_⟩
  split_ifs <;> simp [pos, hn, hm] <;> simpa [pos] using hp

/-! ### The links preserve the invariant -/

/-- The Hodge-theater level log-link preserves the bookkeeping fields. -/
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyLogLink_data (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyLogLink dom cod).data = cod.data := rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyLogLink_univ (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyLogLink dom cod).univ = cod.univ := rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyLogLink_n (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyLogLink dom cod).n = cod.n := rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyLogLink_m (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyLogLink dom cod).m = cod.m := rfl

@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyThetaLink_data (k : LinkKind)
    (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyThetaLink k dom cod).data = cod.data := by
  unfold ThetaPmEllNFHodgeTheater.applyThetaLink; split_ifs <;> rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyThetaLink_univ (k : LinkKind)
    (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyThetaLink k dom cod).univ = cod.univ := by
  unfold ThetaPmEllNFHodgeTheater.applyThetaLink; split_ifs <;> rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyThetaLink_n (k : LinkKind)
    (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyThetaLink k dom cod).n = cod.n := by
  unfold ThetaPmEllNFHodgeTheater.applyThetaLink; split_ifs <;> rfl
@[simp] theorem _root_.IUT.ThetaPmEllNFHodgeTheater.applyThetaLink_m (k : LinkKind)
    (dom cod : ThetaPmEllNFHodgeTheater) :
    (ThetaPmEllNFHodgeTheater.applyThetaLink k dom cod).m = cod.m := by
  unfold ThetaPmEllNFHodgeTheater.applyThetaLink; split_ifs <;> rfl

@[simp] theorem applyLogLink_data (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyLogLink n m).data = lat.data := by simp [applyLogLink]
@[simp] theorem applyLogLink_horizontal (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyLogLink n m).horizontal = lat.horizontal := by simp [applyLogLink]
@[simp] theorem applyLogLink_links (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyLogLink n m).links = lat.links ++ [Link.logLinkOf n m] := by simp [applyLogLink]
@[simp] theorem applyThetaLink_data (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyThetaLink n m).data = lat.data := by simp [applyThetaLink]
@[simp] theorem applyThetaLink_horizontal (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyThetaLink n m).horizontal = lat.horizontal := by simp [applyThetaLink]
@[simp] theorem applyThetaLink_links (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyThetaLink n m).links = lat.links ++ [Link.thetaLinkOf lat.horizontal lat.data n m] := by
  simp [applyThetaLink]

/-- **The log-link preserves the lattice invariant.** -/
theorem applyLogLink_invariant {lat : LogThetaLattice} (h : lat.Invariant) (n m : ℤ) :
    (lat.applyLogLink n m).Invariant := by
  unfold applyLogLink
  have h1 := ensure_invariant h n m
  have h2 := ensure_invariant h1 n (m + 1)
  have hdom_mem := ensure_snd_mem lat n m
  have hdom_wf := h1.vertices_wf _ hdom_mem
  have hdom_data := h1.vertices_data _ hdom_mem
  have hu := updateAt_invariant h2 n (m + 1) (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2)
    (fun ht hm hwf => by
      apply applyLogLink_wellFormed _ _ hdom_wf hwf
      simp only [hdom_data, h2.vertices_data ht hm, ensure_data])
    (fun _ => rfl) (fun _ => rfl) (fun _ => rfl) (fun _ => rfl)
  refine addLink_invariant hu _ ?_ ?_ ?_
  · simp only [updateAt_data, ensure_data]
    exact Link.logLinkOf_wellFormed _ n m
  · exact updateAt_exists_pos _ n (m + 1) (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2)
      (fun _ => rfl) (fun _ => rfl) (p := (n, m))
      (ensure_exists_pos_of _ n (m + 1) (ensure_exists_pos lat n m))
  · exact updateAt_exists_pos _ n (m + 1) (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2)
      (fun _ => rfl) (fun _ => rfl) (p := (n, m + 1)) (ensure_exists_pos _ n (m + 1))

/-- **The Θ-link preserves the lattice invariant.** -/
theorem applyThetaLink_invariant {lat : LogThetaLattice} (h : lat.Invariant) (n m : ℤ) :
    (lat.applyThetaLink n m).Invariant := by
  unfold applyThetaLink
  have h1 := ensure_invariant h n m
  have h2 := ensure_invariant h1 (n + 1) m
  have hdom_mem := ensure_snd_mem lat n m
  have hdom_wf := h1.vertices_wf _ hdom_mem
  have hdom_data := h1.vertices_data _ hdom_mem
  have hu := updateAt_invariant h2 (n + 1) m
    (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2)
    (fun ht hm hwf => by
      apply applyThetaLink_wellFormed _ _ _ hdom_wf hwf
      simp only [hdom_data, h2.vertices_data ht hm, ensure_data])
    (fun _ => by simp) (fun _ => by simp) (fun _ => by simp) (fun _ => by simp)
  refine addLink_invariant hu _ ?_ ?_ ?_
  · simp only [updateAt_data, ensure_data]
    exact Link.thetaLinkOf_wellFormed _ h.horizontal_ne _ n m
  · exact updateAt_exists_pos _ (n + 1) m
      (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2)
      (fun _ => by simp) (fun _ => by simp) (p := (n, m))
      (ensure_exists_pos_of _ (n + 1) m (ensure_exists_pos lat n m))
  · exact updateAt_exists_pos _ (n + 1) m
      (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2)
      (fun _ => by simp) (fun _ => by simp) (p := (n + 1, m)) (ensure_exists_pos _ (n + 1) m)

/-! ### Columns and the infinite H -/

theorem logColumn_invariant {lat : LogThetaLattice} (h : lat.Invariant) (col : ℤ) (ms : List ℤ) :
    (lat.logColumn col ms).Invariant := by
  induction ms generalizing lat with
  | nil => exact h
  | cons m ms ih => exact ih (applyLogLink_invariant h col m)

@[simp] theorem logColumn_data (lat : LogThetaLattice) (col : ℤ) (ms : List ℤ) :
    (lat.logColumn col ms).data = lat.data := by
  induction ms generalizing lat with
  | nil => rfl
  | cons m ms ih =>
    simp only [logColumn, List.foldl_cons] at ih ⊢
    rw [ih, applyLogLink_data]

@[simp] theorem logColumn_horizontal (lat : LogThetaLattice) (col : ℤ) (ms : List ℤ) :
    (lat.logColumn col ms).horizontal = lat.horizontal := by
  induction ms generalizing lat with
  | nil => rfl
  | cons m ms ih =>
    simp only [logColumn, List.foldl_cons] at ih ⊢
    rw [ih, applyLogLink_horizontal]

/-- The links recorded by a column are exactly the log-links of its rows. -/
theorem logColumn_links (lat : LogThetaLattice) (col : ℤ) (ms : List ℤ) :
    (lat.logColumn col ms).links = lat.links ++ ms.map (Link.logLinkOf col) := by
  induction ms generalizing lat with
  | nil => simp [logColumn]
  | cons m ms ih =>
    simp only [logColumn, List.foldl_cons] at ih ⊢
    rw [ih, applyLogLink_links, List.map_cons, List.append_assoc, List.singleton_append]

theorem rows_length (mmin mmax : ℤ) : (rows mmin mmax).length = (mmax - mmin).toNat := by
  simp [rows]

/-- **The infinite H satisfies the lattice invariant.** -/
theorem buildH_invariant {lat : LogThetaLattice} (h : lat.Invariant) (n mmin mmax : ℤ) :
    (lat.buildH n mmin mmax).Invariant := by
  unfold buildH
  have h1 := logColumn_invariant (logColumn_invariant h n (rows mmin mmax)) (n + 1) (rows mmin mmax)
  split_ifs with hm
  · have h2 := applyThetaLink_invariant h1 n 0
    exact ⟨h2.data_wf, h2.horizontal_ne, h2.vertices_wf, h2.vertices_data, h2.univ_lt, h2.univ_nodup,
      h2.pos_nodup, h2.links_wf, h2.links_dom, h2.links_cod⟩
  · exact ⟨h1.data_wf, h1.horizontal_ne, h1.vertices_wf, h1.vertices_data, h1.univ_lt, h1.univ_nodup,
      h1.pos_nodup, h1.links_wf, h1.links_dom, h1.links_cod⟩

/-- The links of the infinite H. -/
theorem buildH_links (lat : LogThetaLattice) (n mmin mmax : ℤ) :
    (lat.buildH n mmin mmax).links =
      lat.links ++ (rows mmin mmax).map (Link.logLinkOf n) ++ (rows mmin mmax).map (Link.logLinkOf (n + 1)) ++
        (if mmin ≤ 0 ∧ 0 ≤ mmax then [Link.thetaLinkOf lat.horizontal lat.data n 0] else []) := by
  unfold buildH
  split_ifs with hm
  · simp only [applyThetaLink_links, logColumn_links, logColumn_horizontal, logColumn_data]
  · simp only [logColumn_links, List.append_nil]

/-- **The infinite H has exactly one Θ-link** ([EssLgc] §3.10): starting from an
initialised lattice, `buildH` records a single horizontal link, namely
`(n,0) → (n+1,0)`, provided row `0` lies in the range. -/
theorem buildH_countP_horizontal (d : InitialThetaData) (k : LinkKind) (n mmin mmax : ℤ)
    (hm : mmin ≤ 0 ∧ 0 ≤ mmax) :
    ((init d k).buildH n mmin mmax).links.countP (fun L => L.kind.isHorizontal) = 1 := by
  rw [buildH_links, ite_eq_left hm]
  have hrow : ∀ c : ℤ,
      ((rows mmin mmax).map (Link.logLinkOf c)).countP (fun L => L.kind.isHorizontal) = 0 := by
    intro c
    rw [List.countP_eq_zero]
    intro L hL
    obtain ⟨m, _, rfl⟩ := List.mem_map.mp hL
    simp [Link.logLinkOf, LinkKind.isHorizontal]
  have hinit : (init d k).links = [] := rfl
  rw [List.countP_append, List.countP_append, List.countP_append, hinit, hrow, hrow]
  simp only [List.countP_nil, List.countP_cons, Link.thetaLinkOf, LinkKind.isHorizontal, zero_add]
  simp [bne_iff_ne, init_horizontal_ne d k]

/-- **The infinite H has `2 (mmax − mmin)` log-links**, `mmax − mmin` in each
of its two columns. -/
theorem buildH_countP_vertical (d : InitialThetaData) (k : LinkKind) (n mmin mmax : ℤ) :
    ((init d k).buildH n mmin mmax).links.countP (fun L => L.kind.isVertical) =
      2 * (mmax - mmin).toNat := by
  rw [buildH_links]
  have hrow : ∀ c : ℤ, ((rows mmin mmax).map (Link.logLinkOf c)).countP (fun L => L.kind.isVertical) =
      (mmax - mmin).toNat := by
    intro c
    rw [List.countP_map, List.countP_eq_length.mpr, rows_length]
    intro m _
    simp [Function.comp, Link.logLinkOf, LinkKind.isVertical]
  have hinit : (init d k).links = [] := rfl
  rw [List.countP_append, List.countP_append, List.countP_append, hinit, hrow, hrow,
    List.countP_nil]
  split_ifs
  · simp only [List.countP_cons, List.countP_nil, Link.thetaLinkOf, LinkKind.isVertical]
    rw [ite_eq_right (by simp [init_horizontal_ne d k])]
    omega
  · simp only [List.countP_nil]
    omega

/-- The focus of the infinite H is `(n, 0)`. -/
@[simp] theorem buildH_focus (lat : LogThetaLattice) (n mmin mmax : ℤ) :
    (lat.buildH n mmin mmax).focus = (n, 0) := by
  unfold buildH; split_ifs <;> rfl

/-- **Existence**: for every well-formed initial Θ-data there is a lattice
satisfying the validator, namely the infinite H around `(0, 0)`. -/
theorem exists_invariant (d : InitialThetaData) (hd : d.WellFormed) :
    ∃ lat : LogThetaLattice, lat.Invariant ∧
      lat.links.countP (fun L => L.kind.isHorizontal) = 1 ∧
      lat.links.countP (fun L => L.kind.isVertical) = 4 :=
  ⟨(init d .ThetaUnitsModTorsLGPTorsorLink).buildH 0 (-1) 1,
    buildH_invariant (init_invariant d hd _) 0 (-1) 1,
    buildH_countP_horizontal d _ 0 (-1) 1 ⟨by norm_num, by norm_num⟩,
    buildH_countP_vertical d _ 0 (-1) 1⟩

instance : Inhabited LogThetaLattice :=
  ⟨(init InitialThetaData.exampleOne .ThetaUnitsModTorsLGPTorsorLink).buildH 0 (-1) 1⟩

/-! ### Alien copies: distinct vertices live in distinct universes -/

/-- **Mutually alien copies** ([Alien] §1; [IUTchIV] §3): two distinct vertices
of a lattice satisfying the invariant carry distinct universe labels.  Combined
with `ThetaPmEllNFHodgeTheater.applyThetaLink_alien` this says that the two
sides of every Θ-link of the lattice are built from mutually alien copies. -/
theorem alien {lat : LogThetaLattice} (h : lat.Invariant) {a b : ThetaPmEllNFHodgeTheater}
    (ha : a ∈ lat.vertices) (hb : b ∈ lat.vertices) (hab : pos a ≠ pos b) : a.univ ≠ b.univ := by
  intro huv
  have hinj := List.inj_on_of_nodup_map h.univ_nodup
  exact hab (congrArg pos (hinj ha hb huv))

/-- A well-formed link never joins a vertex to itself. -/
theorem _root_.IUT.Link.wellFormed_dom_ne_cod (d : InitialThetaData) (L : Link) (h : L.WellFormed d) :
    L.dom ≠ L.cod := by
  by_cases hk : L.kind = .LogLink
  · rw [Link.wellFormed_log_cod d L h hk]
    intro he
    have := congrArg Prod.snd he
    simp at this
  · rw [Link.wellFormed_theta_cod d L h hk]
    intro he
    have := congrArg Prod.fst he
    simp at this

/-- Every link of the lattice joins two *distinct* vertices (hence, by `alien`,
two distinct universes). -/
theorem link_endpoints_distinct {lat : LogThetaLattice} (h : lat.Invariant) {L : Link}
    (hL : L ∈ lat.links) : ∃ a ∈ lat.vertices, ∃ b ∈ lat.vertices,
      pos a = L.dom ∧ pos b = L.cod ∧ a.univ ≠ b.univ := by
  obtain ⟨a, ha, hpa⟩ := h.links_dom L hL
  obtain ⟨b, hb, hpb⟩ := h.links_cod L hL
  refine ⟨a, ha, b, hb, hpa, hpb, alien h ha hb ?_⟩
  rw [hpa, hpb]
  exact Link.wellFormed_dom_ne_cod lat.data L (h.links_wf L hL)

/-! ### Coricity through the lattice -/

@[simp] theorem get?_addLink (lat : LogThetaLattice) (L : Link) (n m : ℤ) :
    (lat.addLink L).get? n m = lat.get? n m := rfl

/-- The position predicate is invariant under a position-preserving update. -/
theorem comp_update (n m n' m' : ℤ) (f : ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater)
    (hn : ∀ ht, (f ht).n = ht.n) (hm : ∀ ht, (f ht).m = ht.m) :
    (fun ht : ThetaPmEllNFHodgeTheater => decide (ht.n = n' ∧ ht.m = m')) ∘
      (fun ht => if ht.n = n ∧ ht.m = m then f ht else ht) =
      fun ht => decide (ht.n = n' ∧ ht.m = m') := by
  funext ht
  simp only [Function.comp]
  split_ifs <;> simp [hn, hm]

theorem get?_updateAt_self (lat : LogThetaLattice) (n m : ℤ)
    (f : ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater)
    (hn : ∀ ht, (f ht).n = ht.n) (hm : ∀ ht, (f ht).m = ht.m) :
    (lat.updateAt n m f).get? n m = (lat.get? n m).map f := by
  simp only [updateAt, get?, List.find?_map, comp_update n m n m f hn hm]
  cases hf : lat.vertices.find? (fun ht => decide (ht.n = n ∧ ht.m = m)) with
  | none => rfl
  | some ht =>
    have := List.find?_some hf
    simp only [decide_eq_true_eq] at this
    simp only [Option.map_some]
    rw [ite_eq_left this]

theorem get?_updateAt_ne (lat : LogThetaLattice) (n m n' m' : ℤ)
    (f : ThetaPmEllNFHodgeTheater → ThetaPmEllNFHodgeTheater)
    (hn : ∀ ht, (f ht).n = ht.n) (hm : ∀ ht, (f ht).m = ht.m) (hne : (n', m') ≠ (n, m)) :
    (lat.updateAt n m f).get? n' m' = lat.get? n' m' := by
  simp only [updateAt, get?, List.find?_map, comp_update n m n' m' f hn hm]
  cases hf : lat.vertices.find? (fun ht => decide (ht.n = n' ∧ ht.m = m')) with
  | none => rfl
  | some ht =>
    have := List.find?_some hf
    simp only [decide_eq_true_eq] at this
    simp only [Option.map_some]
    rw [ite_eq_right]
    intro h
    exact hne (by rw [← this.1, ← this.2, h.1, h.2])

theorem get?_ensure_ne (lat : LogThetaLattice) (n m n' m' : ℤ) (hne : (n', m') ≠ (n, m)) :
    (lat.ensure n m).1.get? n' m' = lat.get? n' m' := by
  unfold ensure
  split
  · rfl
  · simp only [get?]
    rw [List.find?_append]
    cases hf : lat.vertices.find? (fun ht => decide (ht.n = n' ∧ ht.m = m')) with
    | none =>
      rw [Option.none_or, List.find?_cons_of_neg, List.find?_nil]
      simp only [build_n, build_m]
      intro h
      have h' := of_decide_eq_true h
      exact hne (Prod.ext h'.1.symm h'.2.symm)
    | some ht => rfl

/-- After `applyLogLink n m`, the vertex at `(n, m)` is the (possibly fresh)
domain. -/
theorem applyLogLink_get?_dom (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyLogLink n m).get? n m = some (lat.ensure n m).2 := by
  simp only [applyLogLink, get?_addLink]
  rw [get?_updateAt_ne _ n (m + 1) n m (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2)
      (fun _ => rfl) (fun _ => rfl) (fun h => by simp only [Prod.mk.injEq] at h; omega),
    get?_ensure_ne _ n (m + 1) n m (fun h => by simp only [Prod.mk.injEq] at h; omega),
    ensure_get?_self]

/-- After `applyLogLink n m`, the vertex at `(n, m+1)` is the image of the
(possibly fresh) codomain under the Hodge-theater level log-link. -/
theorem applyLogLink_get?_cod (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyLogLink n m).get? n (m + 1) =
      some (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2
        ((lat.ensure n m).1.ensure n (m + 1)).2) := by
  simp only [applyLogLink, get?_addLink]
  rw [get?_updateAt_self _ n (m + 1) (ThetaPmEllNFHodgeTheater.applyLogLink (lat.ensure n m).2)
      (fun _ => rfl) (fun _ => rfl), ensure_get?_self]
  rfl

theorem applyThetaLink_get?_dom (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyThetaLink n m).get? n m = some (lat.ensure n m).2 := by
  simp only [applyThetaLink, get?_addLink]
  rw [get?_updateAt_ne _ (n + 1) m n m
      (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2)
      (fun _ => by simp) (fun _ => by simp) (fun h => by simp only [Prod.mk.injEq] at h; omega),
    get?_ensure_ne _ (n + 1) m n m (fun h => by simp only [Prod.mk.injEq] at h; omega),
    ensure_get?_self]

theorem applyThetaLink_get?_cod (lat : LogThetaLattice) (n m : ℤ) :
    (lat.applyThetaLink n m).get? (n + 1) m =
      some (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2
        ((lat.ensure n m).1.ensure (n + 1) m).2) := by
  simp only [applyThetaLink, get?_addLink]
  rw [get?_updateAt_self _ (n + 1) m
      (ThetaPmEllNFHodgeTheater.applyThetaLink lat.horizontal (lat.ensure n m).2)
      (fun _ => by simp) (fun _ => by simp), ensure_get?_self]
  rfl

/-- The length of a strip of a vertex of an invariant lattice is `|V|`. -/
theorem strip_loc_length {lat : LogThetaLattice} (h : lat.Invariant) {ht : ThetaPmEllNFHodgeTheater}
    (hm : ht ∈ lat.vertices) {ps : PrimeStrip} (hps : ps.WellFormed ht.data) :
    ps.loc.length = lat.data.V.length := by
  unfold PrimeStrip.WellFormed PrimeStrip.check at hps
  simp only [Bool.and_eq_true, beq_iff_eq] at hps
  rw [hps.1.1.1, h.vertices_data ht hm]

/-- **Vertical coricity through the lattice** ([IUTchIII] Thm 1.5 (i)): after
`applyLogLink n m` the vertex at `(n,m+1)` carries, in its holomorphic strip
`F_>`, *exactly* the copies of `Π_v` and `G_v` of the vertex at `(n,m)` (and
both vertices exist). -/
theorem applyLogLink_verticallyCoric {lat : LogThetaLattice} (h : lat.Invariant) (n m : ℤ) :
    ∃ dom cod, (lat.applyLogLink n m).get? n m = some dom ∧
      (lat.applyLogLink n m).get? n (m + 1) = some cod ∧
      cod.nf.FGt.loc.map (·.Pi) = dom.nf.FGt.loc.map (·.Pi) ∧
      cod.nf.FGt.loc.map (·.G) = dom.nf.FGt.loc.map (·.G) := by
  have h1 := ensure_invariant h n m
  have h2 := ensure_invariant h1 n (m + 1)
  have hdom_len : (lat.ensure n m).2.nf.FGt.loc.length = lat.data.V.length := by
    have := strip_loc_length h1 (ensure_snd_mem lat n m)
      (wellFormed_strips _ (h1.vertices_wf _ (ensure_snd_mem lat n m))).2.2.2.2.1
    rwa [ensure_data] at this
  have hcod_len : ((lat.ensure n m).1.ensure n (m + 1)).2.nf.FGt.loc.length = lat.data.V.length := by
    have := strip_loc_length h2 (ensure_snd_mem _ n (m + 1))
      (wellFormed_strips _ (h2.vertices_wf _ (ensure_snd_mem _ n (m + 1)))).2.2.2.2.1
    rwa [ensure_data, ensure_data] at this
  refine ⟨_, _, applyLogLink_get?_dom lat n m, applyLogLink_get?_cod lat n m, ?_, ?_⟩
  · simp only [ThetaPmEllNFHodgeTheater.applyLogLink, shareEtale]
    apply List.ext_getElem
    · simp [hdom_len, hcod_len]
    · intro i _ _
      simp
  · simp only [ThetaPmEllNFHodgeTheater.applyLogLink, shareEtale]
    apply List.ext_getElem
    · simp [hdom_len, hcod_len]
    · intro i _ _
      simp

/-- **Horizontal coricity through the lattice** ([IUTchIII] Thm 1.5 (ii)): for
the `Θ×μ_LGP`-flavoured lattice, after `applyThetaLink n m` the vertex at
`(n+1,m)` carries, in `‡F⊩_Δ`, exactly the copies of `O×μ` and `G_v` of
`†F⊩_LGP` at `(n,m)`. -/
theorem applyThetaLink_horizontallyCoric {lat : LogThetaLattice} (h : lat.Invariant)
    (hk : lat.horizontal = .ThetaUnitsModTorsLGPTorsorLink) (n m : ℤ) :
    ∃ dom cod, (lat.applyThetaLink n m).get? n m = some dom ∧
      (lat.applyThetaLink n m).get? (n + 1) m = some cod ∧
      cod.FMonoGlobTriangle.loc.map (·.units) = dom.FMonoGlobLGP.loc.map (·.units) ∧
      cod.FMonoGlobTriangle.loc.map (·.G) = dom.FMonoGlobLGP.loc.map (·.G) := by
  have h1 := ensure_invariant h n m
  have h2 := ensure_invariant h1 (n + 1) m
  have hdom_len : (lat.ensure n m).2.FMonoGlobLGP.loc.length = lat.data.V.length := by
    have := strip_loc_length h1 (ensure_snd_mem lat n m)
      (wellFormed_strips _ (h1.vertices_wf _ (ensure_snd_mem lat n m))).2.2.2.2.2.2.2.2.2.2.2.2.2.2.2.2.2.2.1
    rwa [ensure_data] at this
  have hcod_len :
      ((lat.ensure n m).1.ensure (n + 1) m).2.FMonoGlobTriangle.loc.length = lat.data.V.length := by
    have := strip_loc_length h2 (ensure_snd_mem _ (n + 1) m)
      (wellFormed_strips _ (h2.vertices_wf _ (ensure_snd_mem _ (n + 1) m))).2.2.2.2.2.2.2.2.2.2.2.2.1
    rwa [ensure_data, ensure_data] at this
  have hne : LinkKind.ThetaUnitsModTorsLGPTorsorLink ≠ LinkKind.ThetaLink := by decide
  refine ⟨_, _, applyThetaLink_get?_dom lat n m, applyThetaLink_get?_cod lat n m, ?_, ?_⟩
  · rw [hk]
    simp only [ThetaPmEllNFHodgeTheater.applyThetaLink, thetaSource, shareGUnits, ite_eq_right hne]
    apply List.ext_getElem
    · simp [hdom_len, hcod_len]
    · intro i _ _
      simp
  · rw [hk]
    simp only [ThetaPmEllNFHodgeTheater.applyThetaLink, thetaSource, shareGUnits, ite_eq_right hne]
    apply List.ext_getElem
    · simp [hdom_len, hcod_len]
    · intro i _ _
      simp

end LogThetaLattice

end IUT
