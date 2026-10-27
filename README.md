# motizukipdf — Mochizuki's papers, plus a toolkit for the data types of IUT

This repository holds Shinichi Mochizuki's papers as PDFs (the four
inter-universal Teichmüller theory papers II–IV, the surveys, the anabelian and
Frobenioid prerequisites, …) and a small toolkit that turns the **mathematical
objects introduced in IUT I–IV into concrete data types**, with generators,
validators, a terminal UI and a web app:

* `src/` — C11 library + CLI + ncurses TUI (`iut`),
* `htdocs/` — plain-JavaScript / HTML5-canvas web app with the same model,
* `docs/IDENTIFIERS.md` — the table of **English-letters-only identifiers** for
  every object whose notation uses symbols (†HT → `DagHodgeTheater`,
  F⊢×μ → `FMonoUnitsModTorsPrimeStrip`, Θ×μ_LGP-link →
  `ThetaUnitsModTorsLGPTorsorLink`, F⊩_Δ → `FMonoGlobTriangle`, S^±_{j+1} →
  `SPmJPlusOne`, …), generated from the C source,
* `docs/DATA_MODEL.md` — what each type models, with citations into the PDFs,
  and what the program does and does not compute.

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
http://localhost:8000/). No build step and no dependencies. Tabs:

1. **Θ-data & validate** — generator (abc triple → Frey curve, examples, random,
   synthetic number fields), the full datum, the validation report, JSON;
2. **lattice** — the log-theta-lattice on a canvas: click a vertex to focus,
   `l`/`t`/`H` or the buttons apply log-links, Θ-links, the infinite H;
3. **Hodge theater** — the Θ±ell NF-Hodge theater at the focus drawn after
   [Alien] Fig 3.8: capsules F_T (t ∈ F_l) and F_J (j ∈ F_l^*), the four
   bridges, the gluing 0,⊞ ↦ >, the pilots and the log-shells;
4. **alien copies** — †HT vs ‡HT across the Θ-link: what is shared (G_v up to
   Ind1, O×μ up to Ind2), what is dilated ({q̲^{j²}} ↦ {q̲}) and what is alien (Π_v,
   ring structures);
5. **multiradial / log-volume** — processions S^±_{j+1}, hull vs Θ-shift per j,
   the exact C_Θ of [IUTchIV] Thm 1.10 and the leading-term heuristic
   (l²/48)(6 log d^K − log q) of [Alien] §3.7 (iv), the étale-picture;
6. **species** — the mutation-history graph ([IUTchIV] §3);
7. **identifiers** — the searchable letters-only identifier table.

`htdocs/iut.js` is the model (usable from node), `htdocs/app.js` the canvas UI,
`htdocs/identifiers.js` is generated.

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
htdocs/     index.html · style.css · iut.js (model) · app.js (canvas UI) · identifiers.js (generated) · test.js
docs/       IDENTIFIERS.md (generated) · DATA_MODEL.md
scripts/    serve.sh (static server for htdocs) · test.sh (build + all tests + sync check)
```
