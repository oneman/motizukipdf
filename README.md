# motizukipdf — Mochizuki's papers, plus a toolkit for the data types of IUT

This repository holds Shinichi Mochizuki's papers as PDFs (the four
inter-universal Teichmüller theory papers II–IV, the surveys, the anabelian and
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
* `lean/` — the same data types in **Lean 4 / Mathlib**, with proofs that the
  constructed objects exist and satisfy the validators, and of the elementary
  facts behind them (see `lean/README.md`).

Everything is grounded in the papers in this repository: each struct, check and
view carries a citation such as `[IUTchIII] Def 1.1` or `[Alien] §3.7 (iv)`.

## Build and run (C)

```sh
cd src
make            # builds ./iut; uses ncurses(w) if present, text-only otherwise
make test       # C self-tests (90 checks) + node tests of the web model (63 checks)
./iut gen      --abc 1 2400 2401 --l 13      # generate initial Θ-data from an abc triple
./iut validate --example 1                   # validate it (exit code = number of errors)
./iut walk     --example 2 --rows 2          # build the "infinite H" of the log-theta-lattice:
                                             # Hodge theaters, log-shells, alien copies, multiradial rep.
./iut walk     --random 4 --horizontal lgp --json   # full JSON dump
./iut ids Mono                               # identifiers whose id/notation/desc contain "Mono"
./iut tui      --example 3                   # interactive ncurses UI
```

Data options accepted by `gen`, `validate`, `walk`, `tui`: `--abc A B C`, `--l L`,
`--example K` (0–5), `--random SEED`; `walk` also takes `--rows R`,
`--horizontal theta|xmu|gau|LGP|lgp` and `--json`.

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
the species graph and the searchable identifier table.

`htdocs/iut.js` is the model (usable from node), `htdocs/diagrams.js` the SVG
helpers and the Part I gallery, `htdocs/processes.js` the Part II progressions,
`htdocs/app.js` the explorer and the glue, `htdocs/identifiers.js` is generated.

## Generated files and consistency

`src/iut_ids.c` is the single source of truth for the identifiers. `make gen`
regenerates `htdocs/identifiers.js` and `docs/IDENTIFIERS.md`; `make check`
fails if they drift. The C self-test and the node test check the same
mathematical facts (label sets, symmetries, Frey-curve valuations, coricity,
log-shell volumes, the l(l+1)/12 dilation, the infinite H, the inequality).

## Layout

```
src/        iut.h (types) · iut_ids.c (identifiers, species, mutations) · iut_core.c (generators,
            validators, prime-strips, Hodge theaters, arithmetic) · iut_lattice.c (lattice, links,
            multiradial) · iut_json.c (exports) · iut_view.c (text views) · iut_tui.c · iut_main.c · Makefile
htdocs/     index.html · style.css · iut.js (model) · diagrams.js (Part I) · processes.js (Part II) · app.js (explorer) ·
            identifiers.js (generated) · test.js
docs/       IDENTIFIERS.md (generated) · DATA_MODEL.md
lean/       lakefile.toml · IUT.lean · IUT/ (Identifiers, Labels, InitialThetaData, PrimeStrip, HodgeTheater,
            Link, LogThetaLattice, Multiradial, Species) — Lean 4 / Mathlib port with proofs
scripts/    serve.sh (static server for htdocs) · test.sh (build + all tests + sync check)
```
