/-
# IUT — the data types of inter-universal Teichmüller theory, in Lean 4

Root module: imports every module of the library.

* `IUT.Identifiers`      — the master identifier table (`docs/IDENTIFIERS.md`)
* `IUT.Labels`           — `l`, `l*`, `F_l`, `|F_l|`, `F_l^*`, `F_l^{⋊±}`, processions, `Σ j²`
* `IUT.InitialThetaData` — valuations and initial Θ-data, well-formedness, examples
* `IUT.PrimeStrip`       — the nine kinds of prime-strips, coricity, `build` / `forget`
* `IUT.HodgeTheater`     — Θ±ell NF-Hodge theaters and their validator
* `IUT.Link`             — the log-link and the Θ-links, coricity, alien copies
* `IUT.LogThetaLattice`  — the log-theta-lattice and the "infinite H"
* `IUT.Multiradial`      — processions, (Ind1)–(Ind3), the log-volume estimate
* `IUT.Species`          — species and mutations ([IUTchIV] §3)
* `IUT.Construction`     — the constructions of [IUTchI] §0–§6 (`src/iut_i.h`): cusps, torsors, bridges
* `IUT.Processes`        — the process table (`docs/PROCESSES.md`)
* `IUT.LeanForm`         — Stage 1 of the LeanForm main strategy ([FormIUT] §2, §4): the four triangles, IPL, APT, "3.11.5 ⟹ 3.12"
-/
import IUT.Identifiers
import IUT.Labels
import IUT.InitialThetaData
import IUT.PrimeStrip
import IUT.HodgeTheater
import IUT.Link
import IUT.LogThetaLattice
import IUT.Multiradial
import IUT.Species
import IUT.Construction
import IUT.Processes
import IUT.LeanForm
