// engine.js — configuration, state and the facts: a port of ../c/engine.c.
// ../test.sh checks that the two give the same output.
(function (root) {
  "use strict";
  const BAD = 0, GOOD = 1, ARC = 2;

  function isPrime(n) {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }

  function parseList(text) {
    return String(text || "").split(/[,\s]+/).filter(Boolean).map(Number);
  }

  // cfg = { l, places: [{kind, p}] }, places sorted, ∞ last
  function makeConfig(l, bad, good) {
    const places = [];
    for (const p of parseList(bad)) places.push({ kind: BAD, p });
    for (const p of parseList(good)) if (!places.some((q) => q.p === p)) places.push({ kind: GOOD, p });   // a place already listed as bad stays bad
    places.sort((a, b) => a.p - b.p);
    places.push({ kind: ARC, p: 0 });
    return { l: Number(l), places };
  }

  function placeName(p) { return p.kind === ARC ? "∞" : String(p.p); }

  function checkConfig(c, lmax) {
    const out = [];
    if (!isPrime(c.l) || c.l < 5) out.push(`Def 3.1 (c): l = ${c.l} is not a prime ≥ 5`);
    else if (c.l > lmax) out.push(`l = ${c.l} is larger than this program handles (l ≤ ${lmax})`);
    let nbad = 0;
    c.places.forEach((p, i) => {
      if (p.kind === ARC) return;
      if (!Number.isInteger(p.p) || !isPrime(p.p)) out.push(`place ${p.p} is not a prime`);
      for (let j = 0; j < i; j++)
        if (c.places[j].kind !== ARC && c.places[j].p === p.p) out.push(`place ${p.p} is listed twice`);
      if (p.kind !== BAD) return;
      nbad++;
      if (p.p === 2) out.push("Def 3.1 (b): the place 2 of V^bad_mod is not of odd residue characteristic");
      if (p.p === c.l) out.push(`Def 3.1 (c): l = ${c.l} is not prime to the place ${p.p} of V^bad_mod`);
    });
    if (nbad === 0) out.push("Def 3.1 (b): V^bad_mod is empty");
    return out;
  }

  // ------------------------------------------------------------------ state
  function makeState(model, cfg) {
    return { cfg, built: new Set(), done: new Set(), hist: [], model };
  }
  function missing(s, i) { return s.model.steps[i].in.filter((id) => !s.built.has(id)); }
  function ready(s, i) { return !s.done.has(i) && missing(s, i).length === 0; }
  function apply(s, i) {
    if (!ready(s, i)) return false;
    for (const id of s.model.steps[i].out) s.built.add(id);
    s.done.add(i); s.hist.push(i);
    return true;
  }
  function undo(s) {
    if (!s.hist.length) return -1;
    const i = s.hist.pop();
    for (const id of s.model.steps[i].out) s.built.delete(id);
    s.done.delete(i);
    return i;
  }
  function next(s) {
    for (let i = 0; i < s.model.steps.length; i++) if (!s.done.has(i)) return ready(s, i) ? i : -1;
    return -1;
  }

  // ------------------------------------------------------------------ facts
  function star(n, l) { const r = ((n % l) + l) % l; return r > (l - 1) / 2 ? l - r : r; }
  function sym(n, l) { const r = ((n % l) + l) % l; return r > (l - 1) / 2 ? r - l : r; }
  function range(a, b) { const v = []; for (let i = a; i <= b; i++) v.push(i); return v.join(", "); }
  function placesOf(c, kind) {
    const v = c.places.filter((p) => p.kind === kind).map(placeName);
    return v.length ? v.join(", ") : "none shown";
  }
  function ipow(a, e) { let r = 1n; for (let i = 0; i < e; i++) r *= BigInt(a); return r.toString(); }
  function fact(n) { let r = 1n; for (let i = 2; i <= n; i++) r *= BigInt(i); return r.toString(); }

  const views = {
    conditions(c) {
      const l = c.l, okl = isPrime(l) && l >= 5;
      const bad = c.places.filter((p) => p.kind === BAD);
      const odd = !bad.some((p) => p.p === 2), primeToL = !bad.some((p) => p.p === l);
      return [
        ["(a) √−1 ∈ F", "assumed"],
        ["(b) X_F has stable reduction at every nonarchimedean place", "assumed"],
        ["(b) F/F_mod is Galois of degree prime to l", "assumed"],
        ["(b) the 2·3-torsion points of E_F are rational over F", "assumed"],
        ["(b) V^bad_mod is nonempty", `checked: {${placesOf(c, BAD)}} ${bad.length ? "ok" : "FAILS"}`],
        ["(b) V^bad_mod has odd residue characteristic", `checked: ${odd ? "ok" : "FAILS"}`],
        ["(b) E_F has multiplicative reduction over V^bad_mod", "assumed"],
        ["(c) l is a prime ≥ 5", `checked: l = ${l} ${okl ? "ok" : "FAILS"}`],
        ["(c) the image of G_F → GL_2(F_l) contains SL_2(F_l)", "assumed"],
        ["(c) l is prime to the residue characteristics of V^bad_mod", `checked: ${primeToL ? "ok" : "FAILS"}`],
        ["(c) l is prime to the orders of the q-parameters at V(F)^bad", "assumed"],
        ["(d) C̲_K is of type (1, l-tors)± with K-core C_K", "assumed"],
        ["(e) V̲ → V_mod is a bijection", "by construction: one place of K is taken above each place shown"],
        ["(e) C̲_v is of type (1, Z/lZ)± at each bad place", "assumed"],
        ["(f) ε̲ is a cusp of C̲_K from a nonzero element of Q", "assumed"],
      ];
    },
    labels(c) {
      const l = c.l, ls = (l - 1) / 2, lp = (l + 1) / 2;
      return [
        ["l", `${l}`],
        ["l⍟ = (l−1)/2", `${ls}`],
        ["l± = (l+1)/2", `${lp}`],
        ["F_l", `{${range(-ls, ls)}}, ${l} elements`],
        ["|F_l| = F_l/{±1}", `{${range(0, ls)}}, ${lp} elements`],
        ["F_l^⍟ = F_l^×/{±1}", `{${range(1, ls)}}, ${ls} elements`],
        ["F_l^⋊± = F_l ⋊ {±1}", `z ↦ ±z + λ, ${2 * l} elements`],
      ];
    },
    places(c) {
      const out = [
        ["V̲^bad shown", `{${placesOf(c, BAD)}}`],
        ["V̲^good ∩ V̲^non shown", `{${placesOf(c, GOOD)}}, and every other prime`],
        ["V̲^arc shown", "{∞}"],
      ];
      for (const p of c.places) {
        const k = `v = ${placeName(p)}`;
        if (p.kind === BAD) out.push([k, "bad: Π_v = tempered π_1 of X̳_v, D_v = B^temp(X̳_v)^0, F̳_v tempered Frobenioid with Θ̳_v, q̳_v"]);
        else if (p.kind === GOOD) out.push([k, "good: Π_v = étale π_1 of X→_v, D_v = B(X→_v)^0, F̳_v = C_v"]);
        else out.push([k, "archimedean: D_v = Aut-holomorphic orbispace of X→_v, F̳_v = (C_v, D_v, κ_v)"]);
      }
      return out;
    },
    flstar(c) {
      const l = c.l, ls = (l - 1) / 2, out = [["Aut(C̲_K)/Aut_ε(C̲_K)", `≅ F_l^⍟, of order ${ls}`]];
      for (let a = 1; a <= ls; a++) {
        const v = [];
        for (let j = 1; j <= ls; j++) v.push(`${j}↦${star(a * j, l)}`);
        out.push([`${a} · j`, v.join("  ")]);
      }
      let transitive = true;
      for (let j = 1; j <= ls; j++)
        for (let k = 1; k <= ls; k++) {
          let n = 0;
          for (let a = 1; a <= ls; a++) if (star(a * j, l) === k) n++;
          if (n !== 1) transitive = false;
        }
      out.push(["action on J", transitive ? "simply transitive: checked" : "NOT simply transitive"]);
      return out;
    },
    evaluation(c) {
      const l = c.l, ls = (l - 1) / 2, out = [["at the bad places", `{${placesOf(c, BAD)}}`]];
      for (let j = 1; j <= ls; j++) out.push([`label j = ${j}`, `Θ̳_v takes the value q̳_v^${j * j}, up to μ_${2 * l}`]);
      out.push(["exponents", `j² for j = 1, …, ${ls}; other representatives of the label give q̳_v^(n²) with n ≡ ±j mod ${l}`]);
      return out;
    },
    lctransport(c) {
      const l = c.l, ls = (l - 1) / 2, out = [["φ^LC_j", "= j · φ^LC_1"]];
      for (let j = 1; j <= ls; j++) {
        const v = [];
        for (let m = 1; m <= ls; m++) v.push(`${m}·[ε̲]↦${star(j * m, l)}`);
        out.push([`φ^LC_${j}`, v.join("  ")]);
      }
      out.push(["[ε̲]", "the unique class with φ^LC_j([ε̲]) = j for every j"]);
      out.push(["ζ_⍟", "j·[ε̲] ↦ the strip j of the capsule"]);
      return out;
    },
    procession(c) {
      const ls = (c.l - 1) / 2, out = [];
      for (let j = 1; j <= ls; j++) out.push([`S⍟_${j}`, `{${range(1, j)}}: ${j} possible label${j > 1 ? "s" : ""} for each index`]);
      out.push(["capsule without labels", `(l⍟)^(l⍟) = ${ls}^${ls} = ${ipow(ls, ls)} possibilities`]);
      out.push(["procession", `l⍟! = ${ls}! = ${fact(ls)} possibilities`]);
      return out;
    },
    pmaction(c) {
      const l = c.l, ls = (l - 1) / 2, a = [], b = [], o = ["{0}"];
      for (let t = -ls; t <= ls; t++) { a.push(`${t}↦${sym(t + 1, l)}`); b.push(`${t}↦${sym(-t, l)}`); }
      for (let t = 1; t <= ls; t++) o.push(`{${t}, ${-t}}`);
      return [
        ["F_l^⋊±", `generated by t ↦ t + 1 and t ↦ −t, of order ${2 * l}`],
        ["t ↦ t + 1", a.join("  ")],
        ["t ↦ −t", b.join("  ")],
        ["action on T", "transitive: no label is fixed by the whole group"],
        ["orbits of {±1}", o.join("  ")],
        ["as an F_l^⋊±-group", "T has a zero and is known up to sign"],
        ["as an F_l^⋊±-torsor", "T has no zero"],
      ];
    },
    pmprocession(c) {
      const lp = (c.l + 1) / 2, out = [];
      for (let t = 1; t <= lp; t++) out.push([`S±_${t}`, `{${range(0, t - 1)}}: ${t} possible label${t > 1 ? "s" : ""} for each index`]);
      out.push(["capsule without labels", `(l±)^(l±) = ${lp}^${lp} = ${ipow(lp, lp)} possibilities`]);
      out.push(["procession", `l±! = ${lp}! = ${fact(lp)} possibilities`]);
      return out;
    },
    glue(c) {
      const l = c.l, ls = (l - 1) / 2, out = [];
      for (let j = 1; j <= ls; j++) out.push([`t = ${j}, t = ${-j}`, `↦ j = ${j}`]);
      out.push(["t = 0, ≻", "↦ >"]);
      out.push(["additive side", `${l} strips †D_t and the strip †D_≻`]);
      out.push(["multiplicative side", `${ls} strips †D_j and the strip †D_>`]);
      out.push(["every correspondence", `sends exactly two strips to one: ${l + 1} = 2·${ls + 1}`]);
      return out;
    },
    frobenius(c) {
      const bad = placesOf(c, BAD), out = [];
      for (let n = -1; n <= 1; n++)
        out.push([`${n}HT^Θ —Θ→ ${n + 1}HT^Θ`, `${n}F^⊩_tht ≅ ${n + 1}F^⊩_mod; at v in {${bad}}: ${n}Θ̳_v ↦ ${n + 1}q̳_v`]);
      out.push(["symmetries", "the shift n ↦ n + 1; no swap of two neighbours"]);
      return out;
    },
    etale() {
      return [
        ["core", "one D^⊢-prime-strip, shared by every theater of the chain"],
        ["spokes", "the D-Hodge theaters ⁿHT, n in Z"],
        ["symmetries", "every permutation of the spokes"],
        ["compare", "the Frobenius-picture of the same chain allows only shifts"],
      ];
    },
  };

  function facts(c, view) { return views[view] ? views[view](c) : null; }
  function allFacts(c) { const o = {}; for (const k of Object.keys(views)) o[k] = views[k](c); return o; }

  const api = { BAD, GOOD, ARC, isPrime, makeConfig, placeName, checkConfig, makeState, missing, ready, apply, undo,
    next, facts, allFacts, star, sym, factViews: Object.keys(views) };
  if (typeof module !== "undefined") module.exports = api; else root.IUTX = api;
})(typeof window !== "undefined" ? window : globalThis);
