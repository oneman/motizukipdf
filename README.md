# motizukipdf — Mochizuki's papers, plus a toolkit for the data types of IUT

This repository holds Shinichi Mochizuki's papers as PDFs in `pdf/` (the four
inter-universal Teichmüller theory papers I–IV, the surveys, the anabelian and
Frobenioid prerequisites, …) and a small toolkit that turns the **mathematical
objects introduced in IUT I–IV into concrete data types**, with generators,
validators, a terminal UI and a web app:

* `src/` — C11 library + CLI + ncurses TUI (`iut`),
* `htdocs/` — plain-JavaScript web app with the same model: the data types as
  diagrams, the processes as step-by-step progressions, and a canvas explorer,
* `docs/IDENTIFIERS.md` — the table of **English-letters-only identifiers** for
  every object whose notation uses symbols (†HT → `DagHodgeTheater`,
  F⊢×μ → `FMonoUnitsModTorsPrimeStrip`, Θ×μ_LGP-link →
  `ThetaUnitsModTorsLGPTorsorLink`, F⊩_Δ → `FMonoGlobTriangle`, S^±_{j+1} →
  `SPmJPlusOne`, …), generated from the C source,
* `docs/DATA_MODEL.md` — what each type models, with citations into the PDFs,
  and what the program does and does not compute,
* `docs/PROCESSES.md` — the **operations layer**: every step / process of
  [IUTchI–IV], [EssLgc] and [Alien] that acts on the data types, captured as
  C functions (`src/iut_ops_*.c`) behind a registry of 73 named processes
  (`iut procs`, `iut run <id>`), mirrored one to one in `htdocs/ops.js`,
* `lean/` — the same data types in **Lean 4 / Mathlib**, with proofs that the
  constructed objects exist and satisfy the validators, and of the elementary
  facts behind them (see `lean/README.md`).

Everything is grounded in the papers in this repository: each struct, check and
view carries a citation such as `[IUTchIII] Def 1.1` or `[Alien] §3.7 (iv)`.

## Build and run (C)

```sh
cd src
make            # builds ./iut; uses ncurses(w) if present, text-only otherwise
make test       # C self-tests (model + operations layer) + node tests of the web model and ops.js
./iut gen      --abc 1 2400 2401 --l 13      # generate initial Θ-data from an abc triple
./iut validate --example 1                   # validate it (exit code = number of errors)
./iut walk     --example 2 --rows 2          # build the "infinite H" of the log-theta-lattice:
                                             # Hodge theaters, log-shells, alien copies, multiradial rep.
./iut walk     --random 4 --horizontal lgp --json   # full JSON dump
./iut ids Mono                               # identifiers whose id/notation/desc contain "Mono"
./iut procs IUTchIII                         # the registry of processes (operations on the data types), filtered
./iut run ComputeThmOneTen --abc 1 2400 2401 --l 13   # run one process on the given Θ-data
./iut run --all --example 2                  # run all 73 processes (exit code = number of failures)
./iut tui      --example 3                   # interactive ncurses UI
```

Data options accepted by `gen`, `validate`, `walk`, `run`, `tui`: `--abc A B C`, `--l L`,
`--example K` (0–5), `--random SEED`; `walk` also takes `--rows R`,
`--horizontal theta|xmu|gau|LGP|lgp` and `--json`; `procs` takes `--md`, `--js`,
`--json` and an optional filter; `run` takes a process id or `--all [filter]`.

### The operations layer (`src/iut_ops.h`)

Going through [IUTchI], [IUTchII], [IUTchIII], [IUTchIV],
[EssLgc] and [Alien] section by section, every *step* and every *process* that
can be performed on the data types is a C function, grouped by paper:

| file | contents |
|---|---|
| `iut_i.h`, `iut_i.c` | the data types of [IUTchI] read from the paper itself, §0–§6: pseudo-monoids (M^⊛, M^⊛_mod, M^⊛_sol, M^⊛_κ, M^⊛_∞κ, M^⊛_∞κ×, M^⊛_κ-sol, M_v, …) with the Kummer-ready/Kummer-blind distinction; poly-morphisms, full and +-full poly-isomorphisms, capsule-full poly-morphisms; anabelioids B(Π), B(X)^0, B^temp(Π); NF/MLF/CAF; the orbicurves X, C, X̲, C̲, X→, C→, X̲̲_v, C̲̲_v, C̲_v with types, degrees, cusps, covering groups; the cusps ε, ε′, ε″, 2ε and the Cor 1.2 reconstruction; the tempered/profinite facts of §2; the conditions (a)–(f) of Def 3.1, the Θ-approach, κ-coric functions and critical points; the local Frobenioids of Ex 3.2/3.3/3.4 (F̲_v, C_v, C⊢_v, τ⊢_v, C^Θ_v, q̲_v, Θ̲_v, log(p_v), log(Θ)); the global realified Frobenioids C⊩_mod, C⊩_tht, D⊩_mod with ρ_v, ρ^Θ_v, ρ^D_v; the Θ-Hodge theater of Def 3.6 and the Θ-link of Cor 3.7; LabCusp/LabCusp± torsors with †η_v, †η⁰_v, †η^±_v; D^⊛, D^⊚± with Aut ⊇ Aut_ε (Borel ⊇ semi-unipotent), Aut_± ⊇ Aut_csp and V ⊆ V^±un ⊆ V^Bor ⊆ V(K); evaluation points and sections (Ex 4.4); label transport (Prop 4.7/6.5); the isomorphism torsors (Prop 4.8/6.6); the forgetful counts (Prop 4.9/6.8); global Frobenioid copies and distributions (Ex 5.1 (vii)); strip functors and lifting (Cor 5.3); F_l^{⋊±}-groups/torsors; Prop 6.7 |
| `iut_ops_i.c` | label maps and symmetries, LabCusp, capsules and their morphisms, processions, the four bridges with their isomorphism torsors, the forgetful functor to D-Hodge theaters, Frobenius and étale pictures, global number-field data and its Kummer theory |
| `iut_ops_ii.c` | radial environments and multiradialization, cyclotomic rigidities, tempered indices, theta evaluation, the seven monoids (constant, theta, Gaussian, …), semisimplification, Kummer and evaluation isomorphisms, F_l^{⋊±}/F_l^* symmetrization, the forgetful ladder of prime-strips, the Θ-link flavours of Cor 4.10 |
| `iut_ops_iii.c` | log-shells from each of the four sources, the log-link of prime-strips and Hodge theaters, lattice flavours, bi-coricity (Thm 1.5), tensor packets and their procession, LGP monoids, upper semi-compatibility, the global variants F_MOD / F_mod, pilots, log-volume normalizations, non-interference, the multiradial representation (Thm 3.11) and the steps of Cor 3.12 |
| `iut_ops_iv.c` | Props 1.1–1.8 (a_i, b_i, μ_log, archimedean summands, prime number theorem bounds, weighted averages, torsion points), arithmetic divisors (Def 1.9), (E1)–(E5) and Thm 1.10, Prop 2.1, Cor 2.2 / 2.3, and the species operations of §3 (identities, composition, cores, mutation histories) |
| `iut_ops_logic.c` | the ∧/∨ model of [EssLgc] Ex 2.4.5, the chain (Stp1)–(Stp8), (FxGl), (Englf), (ExtInd1/2), (logORInd); the twelve Gaussian-integral steps, the mono-anabelian transport apparatus, formal sums of labels, (1est)–(12est) and the dictionary of [Alien] |
| `iut_proc.c` | the registry: 73 processes (34 from [IUTchI]), each with id (an identifier in the table), paper, section, name, inputs, outputs and a runner that demonstrates the functions on given Θ-data |
| `iut_test_ops.c` | the paper-cited self-tests of the layer (part of `iut selftest`) |

TUI keys: `1`–`9` screens (Θ-data, validate, lattice, Hodge theater, alien
copies, multiradial / log-volume, étale-picture, species, identifiers); arrows
move the focus in the lattice; `l` applies a log-link (n,m) → (n,m+1); `t`
applies the Θ-link (n,m) → (n+1,m); `H` builds the infinite H; `L` cycles the
horizontal link kind (Θ, Θ×μ, Θ×μ_gau, Θ×μ_LGP, Θ×μ_lgp); `e` next example; `r`
random data; `a` type an abc triple; `q` quit.

## Web app

Open `htdocs/index.html` in a browser (or `scripts/serve.sh` and visit
http://localhost:8000/). No build step and no dependencies. The page is a
single bright document in three parts, all computed from the initial Θ-data
chosen in the bench at the top (abc triple → Frey curve, the five examples, a
random synthetic number field):

**Part I · Data types** — one diagram per mathematical object, with its
citations and its letters-only identifiers: initial Θ-data (field tower, curves,
V ≅ V_mod, V^bad_mod), label sets F_l / |F_l| / F_l^* and their symmetries,
the prime-strip forgetful ladder with the coricity of each kind, the local datum
at v (Π_v ↠ G_v, O▷ ≅ O▶ × O×, O×μ, Kummer), the Θ±ell NF-Hodge theater
([Alien] Fig 3.8), the Θ-Hodge theater and the two pilots, log-link vs Θ-link,
the log-theta-lattice ⊇ the infinite H ([Alien] Fig 3.6), log-shells, the three
indeterminacies, the multiradial representation ([Alien] Fig 3.18), the
étale-picture, species and mutations, the identifier rule.

**Part II · Processes** — ten steppable progressions (62 steps) showing how the
objects are used:

1. from an abc triple to initial Θ-data (Frey curve, valuations, l, invariants, validation);
2. forgetting down the prime-strip ladder F → F⊢ → F⊢× → F⊢×μ → D⊢, and F⊩▶×μ;
3. assembling a Hodge theater (capsule F_T, Θ±/Θell-bridges, capsule F_J, Θ/NF-bridges, the gluing 0,⊞ ↦ >);
4. building the log-theta-lattice: log-links, the 0-column and its coric ◦, the Θ-link, the 1-column, the H;
5. the Θ-link: gluing data (aΘ),(bΘ),(cΘ) ≅ (aq),(bq),(cq), what is *not* glued, [Alien] Fig 3.19;
6. mono-anabelian transport ([Alien] Fig 2.1);
7. the chain of logical AND relations (FxGl), (Stp1)–(Stp8) of [EssLgc] §3.10 and the ∧(∨̇)-chain;
8. logical AND versus OR: segments vs loops, the numerical model of [EssLgc] Ex 2.4.5 with sliders, (ExtInd);
9. the Gaussian-integral analogy, Steps 1–12 of [Alien] §1 and the dictionary of §3.8;
10. from the multiradial representation to Cor 3.12, Thm 1.10 and abc, with the data's numbers.

**Part III · Explorer** — the interactive log-theta-lattice on a canvas: click a
vertex to focus, `l`/`t`/`H` or the buttons apply log-links, Θ-links and the
infinite H; tabs for the Θ-data & validation report, the Hodge theater at the
focus, the alien copies across a Θ-link, the multiradial / log-volume numbers,
the species graph, the searchable identifier table and the processes table
(tab 8: filter the 73 processes, run one or all of them on the current Θ-data
and read the same output as `iut run`).

`htdocs/iut.js` is the model (usable from node), `htdocs/ops.js` the operations
layer (every function of `src/iut_ops_*.c` under a camelCase name, plus the
registry with JS runners), `htdocs/diagrams.js` the SVG helpers and the Part I
gallery, `htdocs/processes.js` the Part II progressions, `htdocs/app.js` the
explorer and the glue; `htdocs/identifiers.js` and `htdocs/processlist.js` are
generated.

## The manual (PDF)

`docs/IUT_MANUAL.pdf` is a generated manual / demo of the toolkit: **every data
type** of the identifier table in its *form* (the C struct, field by field) and
with its *reference* into the original papers (paper, section, statement and the
page of the PDF in `pdf/`), the symbol dictionary, the ten illustrated
progressions of the web app step by step with a diagram for every step (Hodge
theaters, the log-theta-lattice and the infinite H, log-links and Θ-links, alien
copies, mono-anabelian transport, the (Stp1)–(Stp8) chain, the multiradial
representation, …), all 73 processes of the registry with the transcript of
`iut run` on the demo Θ-data, a demo session (`iut validate`, `iut walk`,
`iut species`) and an index of all identifiers with page numbers.

```sh
python3 scripts/manual/pageindex.py   # pdftotext: statements / figures / sections of pdf/*.pdf → docs/manual/pageindex.json
node scripts/manual/build.js          # → docs/manual/iut-manual.html and docs/IUT_MANUAL.pdf (Chromium via playwright)
node scripts/manual/build.js --html-only --example 3     # other demo data: --example K or --abc A B C --l L
```

The generator reads `iut ids --json`, `iut procs --json`, `iut run --all`,
`src/iut.h`, `src/iut_i.h`, `docs/DATA_MODEL.md` §8b and the `htdocs/`
modules in node, so the manual cannot drift from the code; regenerate it after
changing the identifier table or the registry.

## Generated files and consistency

`src/iut_ids.c` is the single source of truth for the identifiers and
`src/iut_proc.c` for the process registry. `make gen` regenerates
`htdocs/identifiers.js`, `docs/IDENTIFIERS.md`, `htdocs/processlist.js` and
`docs/PROCESSES.md`; `make check` fails if they drift. The C self-test and the
node test check the same mathematical facts (label sets, symmetries, Frey-curve
valuations, coricity, log-shell volumes, the l(l+1)/12 dilation, the infinite
H, the inequality) and the same operations-layer facts (bridge torsors,
procession automorphisms, Cor 2.5 theta values, bi-coricity, tensor-packet
counts, the a_i / b_i / μ_log formulas, Thm 1.10, Cor 2.2, (Stp1)–(Stp8),
formal sums, ∫e^{−x²} = √π), and both run all 73 processes on the examples.

## Layout

```
src/        iut.h (types) · iut_ids.c (identifiers, species, mutations) · iut_core.c (generators,
            validators, prime-strips, Hodge theaters, arithmetic) · iut_lattice.c (lattice, links,
            multiradial) · iut_json.c (exports) · iut_view.c (text views) · iut_tui.c · iut_main.c · Makefile ·
            iut_i.h + iut_i.c (the data types of [IUTchI] §0–§6) ·
            iut_ops.h + iut_ops_i.c / _ii.c / _iii.c / _iv.c / _logic.c (operations layer) · iut_proc.c (process
            registry) · iut_test_ops.c
htdocs/     index.html · style.css · iut.js (model) · ops.js (operations layer) · diagrams.js (Part I) · processes.js (Part II) ·
            app.js (explorer) · identifiers.js, processlist.js (generated) · test.js
docs/       IDENTIFIERS.md, PROCESSES.md (generated) · DATA_MODEL.md
lean/       lakefile.toml · IUT.lean · IUT/ (Identifiers, Labels, InitialThetaData, PrimeStrip, HodgeTheater,
            Link, LogThetaLattice, Multiradial, Species) — Lean 4 / Mathlib port with proofs
scripts/    serve.sh (static server for htdocs) · test.sh (build + all tests + sync check)
```
