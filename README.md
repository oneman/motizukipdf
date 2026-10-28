# motizukipdf — Mochizuki's papers, plus a toolkit for the data types of IUT

This repository holds Shinichi Mochizuki's papers as PDFs in `pdf/` (the four
inter-universal Teichmüller theory papers I–IV, the surveys, the anabelian and
Frobenioid prerequisites, …) and a small toolkit that turns the **mathematical
objects introduced in IUT I–IV into concrete data types**, with generators,
validators, a terminal UI and a web app:

* `src/` — C11 library + CLI + ncurses TUI (`iut`),
* `htdocs/` — static web app that runs the C toolkit itself, compiled to
  WebAssembly: every data type in its form, every process run live, a
  log-theta-lattice explorer and worked examples that step through the
  processes,
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
  (`iut procs`, `iut run <id>`), run on the command line and in the web app,
* `lean/` — the same data types in **Lean 4 / Mathlib**, with proofs that the
  constructed objects exist and satisfy the validators, and of the elementary
  facts behind them (see `lean/README.md`).

Everything is grounded in the papers in this repository: each struct, check and
view carries a citation such as `[IUTchIII] Def 1.1` or `[Alien] §3.7 (iv)`.

## Build and run (C)

```sh
cd src
make            # builds ./iut; uses ncurses(w) if present, text-only otherwise
make test       # C self-tests (model + operations layer) + node tests of the web engine (wasm build)
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
http://localhost:8000/). No build step, no server and no dependencies: the page
is the C toolkit `src/*.c` compiled to WebAssembly (`htdocs/engine/iut.wasm.js`)
and a few plain-JavaScript files. Every number, transcript and diagram is
computed by the engine, so the page cannot drift from the C data model or the
process registry. The *bench* at the top picks the initial Θ-data everything
works on (a built-in example, an abc triple and a prime l, or a random synthetic
number field), the horizontal link flavour and the size of the lattice; change
it and every view recomputes.

* **Data types** — one card per mathematical object: a diagram, the *live
  instance* the engine builds from the selected data (`iut gen`, `iut walk`),
  and the *form* of the object, i.e. the C struct or enum field by field with
  the comment on every field (`htdocs/data/types.js`, generated from the
  headers). Below the featured types, the complete catalogue of all 448
  identifiers grouped by kind, each with its form.
* **Processes** — the 73 processes of the registry, grouped by paper, each run
  live on the selected data with its inputs → outputs, the C functions behind
  it and the transcript of `iut run <id>`; *run all* runs the whole registry
  (`iut run --all`) in a few milliseconds and lists the verdicts.
* **Lattice** — the log-theta-lattice built by `iut walk`, drawn on a canvas:
  click a vertex for its Hodge theater (capsules, bridges, prime-strips,
  log-shells, pilots), click an arrow for the link record (what is shared, what
  is alien, the dilation), or build the lattice one link at a time in the order
  the C program applies them. Tabs show the alien copies across the Θ-link, the
  multiradial representation and the log-volume numbers, the étale-picture and
  the validation report.
* **Worked examples** — nine walks through the theory, step by step (54 steps):
  from an abc triple to initial Θ-data; labels, symmetries and cusps;
  prime-strips and the forgetful ladder; assembling a Θ±ell NF-Hodge theater;
  the Θ-link and the mutually alien copies; walking the log-theta-lattice; from
  the multiradial representation to Cor 3.12, Thm 1.10 and abc; the logical
  structure ∧ versus ∨ and (Stp1)–(Stp8); mono-anabelian transport and the
  Gaussian integral. Each step explains what happens, draws it, and shows its
  *evidence*: the transcript of the process that performs it, run by the engine.
* **Identifiers** — the 448 letters-only identifiers, searchable and filterable
  by kind; each opens a panel with its notation, reference, description, the
  struct that implements it and the processes that use it.

```
htdocs/index.html            the page (hash routes: #types, #processes/<id>, #lattice, #examples/<key>/<step>, #identifiers)
htdocs/engine/iut.wasm.js    src/*.c compiled to wasm32-wasi, base64-embedded   (generated: scripts/web/build-engine.sh)
htdocs/data/types.js         the form of every struct and enum of the headers    (generated: scripts/web/gen-types.js)
htdocs/js/engine.js          runs the engine: IUT.exec(['run', 'MapLabels', '--example', '2']) → { code, out, err, ms }
htdocs/js/model.js           the selected Θ-data, memoised engine calls
htdocs/js/draw.js            canvas kit · js/diagrams.js  the 23 diagrams · js/ui.js  DOM helpers, transcripts, forms
htdocs/js/views/             types.js · procs.js · lattice.js · examples.js · ids.js
htdocs/test.js               node tests of the engine (selftest, all processes on all examples, byte-identical with src/iut)
```

Rebuilding the engine after a change to `src/` needs clang with the wasm32
target and a WASI libc (Ubuntu: `apt install clang lld wasi-libc
libclang-rt-18-dev-wasm32`), then `make engine` in `src/` (or
`CC=clang-18 scripts/web/build-engine.sh`). `node htdocs/test.js` checks that
the wasm build and the native build give byte-identical output.

## The manual (PDF)

`docs/IUT_MANUAL.pdf` is a generated manual / demo of the toolkit: **every data
type** of the identifier table in its *form* (the C struct, field by field) and
with its *reference* into the original papers (paper, section, statement and the
page of the PDF in `pdf/`), the symbol dictionary, ten illustrated
progressions through the processes step by step with a diagram for every step (Hodge
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
`src/iut.h`, `src/iut_i.h`, `docs/DATA_MODEL.md` §8b and the JavaScript
diagram and progression modules in `scripts/manual/lib/` in node, so the manual
cannot drift from the code; regenerate it after changing the identifier table
or the registry.

## Generated files and consistency

`src/iut_ids.c` is the single source of truth for the identifiers and
`src/iut_proc.c` for the process registry, and the headers for the form of
every type. `make gen` regenerates `docs/IDENTIFIERS.md`, `docs/PROCESSES.md`
and `htdocs/data/types.js`; `make check` fails if they drift; `make engine`
recompiles the web engine. The C self-test checks the mathematical facts (label
sets, symmetries, Frey-curve valuations, coricity, log-shell volumes, the
l(l+1)/12 dilation, the infinite H, the inequality) and the operations-layer
facts (bridge torsors, procession automorphisms, Cor 2.5 theta values,
bi-coricity, tensor-packet counts, the a_i / b_i / μ_log formulas, Thm 1.10,
Cor 2.2, (Stp1)–(Stp8), formal sums, ∫e^{−x²} = √π) and runs all 73 processes
on the examples; `htdocs/test.js` runs the same self-test and all processes in
the WebAssembly build and compares its output byte for byte with the native
build.

## Layout

```
src/        iut.h (types) · iut_ids.c (identifiers, species, mutations) · iut_core.c (generators,
            validators, prime-strips, Hodge theaters, arithmetic) · iut_lattice.c (lattice, links,
            multiradial) · iut_json.c (exports) · iut_view.c (text views) · iut_tui.c · iut_main.c · Makefile ·
            iut_i.h + iut_i.c (the data types of [IUTchI] §0–§6) ·
            iut_ops.h + iut_ops_i.c / _ii.c / _iii.c / _iv.c / _logic.c (operations layer) · iut_proc.c (process
            registry) · iut_test_ops.c
htdocs/     index.html · css/app.css · engine/iut.wasm.js (generated) · data/types.js (generated) · js/ (engine, model,
            draw, diagrams, ui, app) · js/views/ (types, procs, lattice, examples, ids) · test.js
docs/       IDENTIFIERS.md, PROCESSES.md (generated) · DATA_MODEL.md
lean/       lakefile.toml · IUT.lean · IUT/ (Identifiers, Labels, InitialThetaData, PrimeStrip, HodgeTheater,
            Link, LogThetaLattice, Multiradial, Species, Construction, Processes, LeanForm, StageTwo, StageThree, StageFour, StageFive) — Lean 4 / Mathlib port with proofs
scripts/    serve.sh (static server for htdocs) · test.sh (build + all tests + sync check) · web/ (build-engine.sh,
            gen-types.js) · manual/ (build.js, pageindex.py, lib/)
```
