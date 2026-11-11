// pictures.js — the canvas pictures of the explorer.
// Each picture is a function that fills a scene with boxes, arrows and text in a
// 1000 × 560 coordinate space.  A box may carry the id of an object of the model:
// it is then drawn solid once that object has been built, dashed before, and it
// can be clicked.
(function (root) {
  "use strict";
  const X = root.IUTX;
  const W = 1000, H = 560;

  function Scene() { this.items = []; }
  Scene.prototype.box = function (x, y, w, h, label, o) { this.items.push(Object.assign({ t: "box", x, y, w, h, label }, o || {})); return this; };
  Scene.prototype.arrow = function (x1, y1, x2, y2, o) { this.items.push(Object.assign({ t: "arrow", x1, y1, x2, y2 }, o || {})); return this; };
  Scene.prototype.text = function (x, y, label, o) { this.items.push(Object.assign({ t: "text", x, y, label }, o || {})); return this; };

  // ------------------------------------------------------------ helpers
  function cells(c) {
    // the places shown, then "…" for the rest of V_mod, with ∞ last
    const out = [];
    for (const p of c.cfg.places) {
      if (p.kind === X.ARC) out.push({ dots: true });
      out.push({ p, name: X.placeName(p), cls: p.kind === X.BAD ? "bad" : p.kind === X.GOOD ? "good" : "arc" });
    }
    return out;
  }
  function placesRow(S, c, y, h, labelFn, o) {
    const cs = cells(c), x0 = (o && o.x0) || 150, x1 = (o && o.x1) || 960;
    const w = Math.min(120, (x1 - x0) / cs.length), gap = 8;
    const xs = [];
    cs.forEach((cell, i) => {
      const x = x0 + i * w;
      xs.push(x + (w - gap) / 2);
      if (cell.dots) { S.text(x + (w - gap) / 2, y + h / 2, "…", { size: 20, color: "muted" }); return; }
      const lab = labelFn(cell);
      if (lab === null) return;
      S.box(x, y, w - gap, h, lab.label !== undefined ? lab.label : lab, { cls: lab.cls || cell.cls, id: lab.id, sub: lab.sub, size: lab.size });
    });
    return { xs, cs, w: w - gap };
  }
  const local = (bad, good, arc) => (cell) => (cell.p.kind === X.BAD ? bad : cell.p.kind === X.GOOD ? good : arc);
  function title(S, t) { S.text(24, 30, t, { align: "left", size: 17, bold: true }); }
  function note(S, t, y) { S.text(24, y || 536, t, { align: "left", size: 13, color: "muted" }); }
  function legendPlaces(S, y) {
    S.box(24, y, 16, 16, "", { cls: "bad" }).text(46, y + 8, "bad", { align: "left", size: 12, color: "muted" });
    S.box(84, y, 16, 16, "", { cls: "good" }).text(106, y + 8, "good", { align: "left", size: 12, color: "muted" });
    S.box(152, y, 16, 16, "", { cls: "arc" }).text(174, y + 8, "archimedean", { align: "left", size: 12, color: "muted" });
  }
  function seq(a, b) { const v = []; for (let i = a; i <= b; i++) v.push(i); return v; }
  // a row of small label cells; returns their centres
  function labelRow(S, x0, x1, y, h, labels, o) {
    const n = labels.length, w = Math.min((o && o.max) || 64, (x1 - x0) / n), gap = Math.min(6, w * 0.12);
    const off = (x1 - x0 - n * w) / 2, xs = [];
    labels.forEach((lab, i) => {
      const x = x0 + off + i * w;
      xs.push(x + (w - gap) / 2);
      S.box(x, y, w - gap, h, String(lab), Object.assign({ cls: "lab", size: w < 34 ? 11 : 14 }, o && o.cell ? o.cell(lab, i) : {}));
    });
    return xs;
  }

  // ------------------------------------------------------------ pictures
  const P = {};

  P.places = function (S, c) {
    title(S, "V̲: one place of K above each place of F_mod");
    S.text(80, 120, "V̲ ⊆ V(K)", { size: 15, bold: true });
    S.text(80, 260, "V_mod", { size: 15, bold: true });
    const top = placesRow(S, c, 92, 56, (cell) => ({ label: "v̲ | " + cell.name, id: "VSet" }));
    placesRow(S, c, 232, 56, (cell) => ({ label: cell.name, id: cell.p.kind === X.BAD ? "VBadMod" : undefined }));
    top.xs.forEach((x, i) => { if (!top.cs[i].dots) S.arrow(x, 150, x, 230, {}); });
    S.text(80, 190, "bijection", { size: 12, color: "muted" });
    S.text(80, 372, "covering", { size: 15, bold: true });
    placesRow(S, c, 344, 56, local({ label: "X̳_v", id: "XUnderUnderV", sub: "l-th root of Θ" }, { label: "X→_v", id: "XArrowV", sub: "from ε̲" },
      { label: "X→_v", id: "XArrowV", sub: "orbispace" }));
    S.text(80, 452, "group", { size: 15, bold: true });
    placesRow(S, c, 424, 56, local({ label: "Π_v ↠ G_v", id: "PiV", sub: "tempered", cls: "etale" }, { label: "Π_v ↠ G_v", id: "PiV", sub: "étale", cls: "etale" },
      null));
    legendPlaces(S, 510);
    note(S, "Only a window of V_mod is drawn: the bad places chosen, a few good ones, and ∞.", 544);
  };

  P.curves = function (S, c) {
    title(S, "The global curves and their symmetries (Fig. I1.1)");
    S.box(360, 70, 280, 60, "{ X̳_v or X→_v }  for v̲ in V̲", { cls: "plain", sub: "only {±1} survives here" });
    S.box(170, 230, 220, 70, "X̲_K", { id: "XUnderK", cls: "etale", sub: "type (1, l-tors)" });
    S.box(610, 230, 220, 70, "C̲_K", { id: "CUnderK", cls: "etale", sub: "type (1, l-tors)±" });
    S.arrow(392, 265, 608, 265, { label: "degree 2" });
    S.arrow(430, 132, 300, 228, { dashed: true });
    S.arrow(570, 132, 700, 228, { dashed: true });
    S.box(60, 240, 90, 50, "F_l^⋊±", { cls: "lab", id: "FlSemiPm" });
    S.box(850, 240, 90, 50, "F_l^⍟", { cls: "lab", id: "FlStar" });
    S.text(105, 310, "additive, geometric", { size: 12, color: "muted" });
    S.text(895, 310, "multiplicative, arithmetic", { size: 12, color: "muted" });
    S.box(170, 380, 220, 56, "X_K = X_F ×_F K", { cls: "plain" });
    S.box(610, 380, 220, 56, "C_K = C_F ×_F K", { cls: "plain" });
    S.arrow(280, 302, 280, 378, { label: "degree l" });
    S.arrow(720, 302, 720, 378, { label: "degree l" });
    S.arrow(392, 408, 608, 408, {});
    S.box(380, 470, 70, 44, "F_mod", { id: "Fmod", cls: "plain" });
    S.text(500, 492, "⊆   F   ⊆", { size: 15 });
    S.box(550, 470, 70, 44, "K", { id: "KField", cls: "plain" });
    note(S, `l = ${c.l}: the two symmetry groups have ${2 * c.l} and ${c.ls} elements.`, 544);
  };

  P.labels = function (S, c) {
    title(S, `The labels for l = ${c.l}`);
    const ls = c.ls;
    S.text(60, 118, "F_l", { size: 16, bold: true });
    const top = labelRow(S, 110, 960, 90, 54, seq(-ls, ls), { cell: () => ({ id: "Fl" }) });
    S.text(60, 278, "|F_l|", { size: 16, bold: true });
    const cw = Math.min(64, 850 / (2 * ls + 1));
    const mid = labelRow(S, 110, 960, 250, 54, seq(0, ls), { max: cw, cell: () => ({ id: "FlAbs" }) });
    for (let t = -ls; t <= ls; t++) S.arrow(top[t + ls], 146, mid[Math.abs(t)], 248, { dashed: t < 0 });
    S.text(60, 438, "F_l^⍟", { size: 16, bold: true });
    const bot = labelRow(S, 110, 960, 410, 54, seq(1, ls), { max: cw, cell: () => ({ id: "FlStar" }) });
    for (let j = 1; j <= ls; j++) S.arrow(mid[j], 306, bot[j - 1], 408, {});
    S.text(880, 200, "t and −t fold together", { size: 12, color: "muted" });
    S.text(880, 360, "drop 0", { size: 12, color: "muted" });
    note(S, `l⍟ = ${ls},  l± = ${c.lp}.  F_l labels the additive side, F_l^⍟ the multiplicative side.`);
  };

  function strip(S, c, y, name, labelFn, o) {
    S.text(76, y + 28, name, { size: 14, bold: true });
    return placesRow(S, c, y, 56, labelFn, o);
  }

  P.strip = function (S, c) {
    const strips = c.step.out.includes("DPrimeStrip");
    title(S, strips ? "A D-prime-strip and its mono-analyticization" : "The base categories at each place");
    const a = strip(S, c, 110, strips ? "†D" : "D_v", local(
      { label: strips ? "†D_v" : "D_v", id: strips ? "DPrimeStrip" : "DV", cls: "etale", sub: "B^temp(X̳_v)^0" },
      { label: strips ? "†D_v" : "D_v", id: strips ? "DPrimeStrip" : "DV", cls: "etale", sub: "B(X→_v)^0" },
      { label: strips ? "†D_v" : "D_v", id: strips ? "DPrimeStrip" : "DV", cls: "etale", sub: "orbispace" }));
    strip(S, c, 300, strips ? "†D^⊢" : "D^⊢_v", local(
      { label: strips ? "†D^⊢_v" : "D^⊢_v", id: strips ? "DMonoPrimeStrip" : "DMonoV", cls: "mono", sub: "B(K_v)^0" },
      { label: strips ? "†D^⊢_v" : "D^⊢_v", id: strips ? "DMonoPrimeStrip" : "DMonoV", cls: "mono", sub: "B(K_v)^0" },
      { label: strips ? "†D^⊢_v" : "D^⊢_v", id: strips ? "DMonoPrimeStrip" : "DMonoV", cls: "mono", sub: "in TM^⊢" }));
    a.xs.forEach((x, i) => { if (!a.cs[i].dots) S.arrow(x, 168, x, 298, {}); });
    S.text(76, 234, "Π_v ↠ G_v", { size: 12, color: "muted" });
    if (strips) {
      S.box(150, 420, 300, 50, "LabCusp(†D)  ≅  F_l^⍟", { id: "LabCusp", cls: "lab", sub: "the same set at every v̲" });
      S.text(700, 445, "no arrow joins the cells of a strip to a global object", { size: 13, color: "muted" });
    }
    legendPlaces(S, 500);
    note(S, "Top row: arithmetic holomorphic structure. Bottom row: what is left when only the local Galois groups are kept.", 540);
  };

  P.frobenioid = function (S, c) {
    title(S, "A Frobenioid over each base category");
    const a = strip(S, c, 110, "F̳_v", local(
      { label: "F̳_v ⊇ C_v", id: "FUnderUnderV", cls: "frob", sub: "tempered" },
      { label: "F̳_v = C_v", id: "FUnderUnderV", cls: "frob", sub: "p_v-adic" },
      { label: "F̳_v", id: "FUnderUnderV", cls: "frob", sub: "(C_v, D_v, κ_v)" }));
    strip(S, c, 300, "D_v", local({ label: "D_v", id: "DV", cls: "etale" }, { label: "D_v", id: "DV", cls: "etale" }, { label: "D_v", id: "DV", cls: "etale" }));
    a.xs.forEach((x, i) => { if (!a.cs[i].dots) S.arrow(x, 168, x, 298, {}); });
    S.text(76, 234, "base", { size: 12, color: "muted" });
    S.box(150, 410, 380, 56, "C_v :  Π_v  ↷  O^▷", { id: "CV", cls: "frob", sub: "the nonzero integers of F̄_v" });
    legendPlaces(S, 500);
    note(S, "Frobenius-like on top, étale-like below. The base can be recovered from the Frobenioid; not the other way round.", 540);
  };

  P.thetaq = function (S, c) {
    title(S, "At a bad place: q̳_v and Θ̳_v give two Frobenioids of the same shape");
    S.box(360, 60, 280, 64, "F̳_v", { id: "FUnderUnderV", cls: "frob", sub: "tempered Frobenioid" });
    S.box(170, 170, 200, 56, "q̳_v = q_v^(1/2l)", { id: "QUnderUnderV", cls: "frob", sub: "a constant" });
    S.box(630, 170, 200, 56, "Θ̳_v", { id: "ThetaUnderUnderV", cls: "frob", sub: "a function" });
    S.arrow(440, 126, 300, 168, {}).arrow(560, 126, 700, 168, {});
    S.arrow(628, 198, 372, 198, { label: "value at √−q_v" });
    S.box(120, 290, 300, 70, "F^⊢_v = (C^⊢_v, τ^⊢_v)", { id: "FMonoV", cls: "frob", sub: "G_v ↷ O^× × q̳_v^N" });
    S.box(580, 290, 300, 70, "F^Θ_v = (C^Θ_v, τ^Θ_v)", { id: "FThetaV", cls: "frob", sub: "O^× · Θ̳_v^N" });
    S.arrow(270, 228, 270, 288, {}).arrow(730, 228, 730, 288, {});
    S.arrow(422, 325, 578, 325, { label: "≅   q̳_v ↦ Θ̳_v", both: true });
    S.box(120, 420, 300, 50, "D^⊢_v", { id: "DMonoV", cls: "mono" });
    S.box(580, 420, 300, 50, "D^Θ_v", { id: "DThetaV", cls: "etale", sub: "products with Ÿ_v" });
    S.arrow(270, 362, 270, 418, {}).arrow(730, 362, 730, 418, {});
    S.arrow(422, 445, 578, 445, { label: "≅", both: true });
    note(S, `Both q̳_v and Θ̳_v are determined only up to μ_${2 * c.l}, the 2l-th roots of unity.`);
  };

  P.global = function (S, c) {
    title(S, "One global realified Frobenioid ties the places together");
    S.box(150, 70, 810, 54, "C^⊩_mod :  one copy of R≥0 for each place of V_mod", { id: "CMonoGlobMod", cls: "frob" });
    const a = strip(S, c, 220, "F^⊢_v", local({ label: "F^⊢_v", id: "FMonoV", cls: "frob", sub: "q̳_v" }, { label: "F^⊢_v", id: "FMonoV", cls: "frob", sub: "p_v" },
      { label: "F^⊢_v", id: "FMonoV", cls: "frob" }));
    a.xs.forEach((x, i) => { if (!a.cs[i].dots) S.arrow(x, 126, x, 218, { label: i === 0 ? "ρ_v" : "" }); });
    S.box(24, 150, 110, 40, "ρ_v", { id: "RhoV", cls: "plain", size: 13 });
    S.box(150, 330, 380, 60, "F^⊩_mod = (C^⊩_mod, Prime ≅ V̲, {F^⊢_v}, {ρ_v})", { id: "FMonoGlobMod", cls: "frob", size: 13 });
    S.box(580, 330, 380, 60, "F^⊩_tht = (C^⊩_tht, Prime ≅ V̲, {F^Θ_v}, {ρ^Θ_v})", { id: "FMonoGlobTht", cls: "frob", size: 13 });
    S.arrow(532, 360, 578, 360, { label: "≅", both: true });
    S.text(555, 420, "q̳_v ↦ Θ̳_v at the bad places,  log(p_v) ↦ log(p_v)·log(Θ) elsewhere", { size: 13, color: "muted" });
    legendPlaces(S, 500);
    note(S, "ρ_v :  log_mod(p_v) ↦ (1/[K_v : (F_mod)_v]) · log_Φ(p_v).  Global and local arithmetic degrees are compared through it.", 540);
  };

  function theater(S, c, x, w, dec, id, o) {
    const built = id;
    S.box(x, 110, w, 250, "", { id: built, cls: "plain", frame: true });
    S.text(x + w / 2, 132, dec + "HT^Θ", { size: 16, bold: true });
    const cs = c.cfg.places, n = cs.length, cw = (w - 30) / n;
    cs.forEach((p, i) => S.box(x + 15 + i * cw, 160, cw - 6, 70, dec + "F̳_v", { cls: "frob", size: cw < 60 ? 11 : 13, sub: X.placeName(p), id: o && o.cellId }));
    S.box(x + 15, 262, w - 36, 44, dec + (o && o.tht ? "F^⊩_tht" : "F^⊩_mod"), { cls: "frob", id: o && o.barId });
    if (o && o.both) S.box(x + 15, 312, w - 36, 38, dec + "F^⊩_tht", { cls: "frob", size: 13, id: "FMonoGlobTht" });
  }

  P.theater = function (S, c) {
    const second = c.step.id === "SecondTheater";
    title(S, second ? "Two Θ-Hodge theaters with nothing between them" : "A Θ-Hodge theater");
    if (!second) {
      theater(S, c, 250, 500, "†", "ThetaHodgeTheater", { cellId: "FUnderUnderV", barId: "FMonoGlobMod" });
      S.text(500, 400, "abstract categories: each is equivalent to its model, by an equivalence that is not kept", { size: 13, color: "muted" });
      S.text(500, 440, "reconstructed from †F̳_v by category theory:  †D_v,  †D^⊢_v,  †D^Θ_v,  †F^⊢_v,  †F^Θ_v,  †F^⊩_tht", { size: 13 });
    } else {
      theater(S, c, 60, 400, "†", "ThetaHodgeTheater", {});
      theater(S, c, 540, 400, "‡", "DdagHodgeTheater", {});
      S.text(500, 235, "?", { size: 34, color: "muted" });
      S.text(500, 410, "the same initial Θ-data, two distinct theaters, no chosen identification", { size: 13, color: "muted" });
    }
  };

  P.link = function (S, c) {
    title(S, "The Θ-link");
    theater(S, c, 40, 400, "†", "ThetaHodgeTheater", { both: true });
    theater(S, c, 560, 400, "‡", "DdagHodgeTheater", {});
    S.arrow(425, 331, 573, 284, { label: "Θ", id: "ThetaLink", bold: true });
    S.box(300, 400, 400, 46, "†F^⊩_tht  ≅  ‡F^⊩_mod   (all isomorphisms)", { id: "ThetaLink", cls: "frob", size: 14 });
    S.text(500, 476, "at a bad place:  †Θ̳_v ↦ ‡q̳_v", { size: 14 });
    S.text(500, 504, "preserved:  †D^⊢_v ≅ ‡D^⊢_v   and   †O^× ≅ ‡O^×", { size: 14, color: "mono" });
    note(S, "Not preserved: the ring structure. The link identifies a function on one side with a constant on the other.", 540);
  };

  P.frobenius = function (S, c) {
    title(S, "The Frobenius-picture");
    const ns = [-2, -1, 0, 1, 2], w = 130, gap = 62, x0 = 40;
    S.text(18, 235, "…", { size: 24, color: "muted" });
    ns.forEach((n, i) => {
      const x = x0 + i * (w + gap);
      S.box(x, 150, w, 170, "", { id: "FrobeniusPicture", cls: "plain", frame: true });
      S.text(x + w / 2, 172, `^{${n}}HT^Θ`, { size: 15, bold: true });
      S.box(x + 10, 195, w - 20, 44, `^{${n}}q̳_v`, { cls: "frob", size: 13 });
      S.box(x + 10, 255, w - 20, 44, `^{${n}}Θ̳_v`, { cls: "frob", size: 13 });
      if (i < ns.length - 1) S.arrow(x + w - 8, 277, x + w + gap + 8, 217, { label: "Θ", bold: true });
    });
    S.text(984, 235, "…", { size: 24, color: "muted" });
    S.text(500, 380, "^{n}Θ̳_v  ↦  ^{n+1}q̳_v", { size: 16 });
    S.text(500, 430, "symmetries: the shift n ↦ n + 1 only", { size: 14, color: "muted" });
    note(S, "Order-conscious: no automorphism swaps two neighbours and fixes the rest.");
  };

  P.etale = function (S, c) {
    const s4 = c.step.id === "FormMonoAnalyticCore";
    title(S, s4 ? "The étale-picture of D-ΘNF-Hodge theaters (Fig. 4.7)" : "The étale-picture (Fig. 3.2)");
    const cx = 500, cy = 280, R = 190, n = 6;
    S.box(cx - 70, cy - 30, 140, 60, s4 ? "D^⊢_>" : "D^⊢_v", { id: s4 ? "DMonoGt" : "EtalePicture", cls: "mono", sub: "core" });
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2, x = cx + R * Math.cos(a) * 1.7, y = cy + R * Math.sin(a);
      S.arrow(x - (x - cx) * 0.22, y - (y - cy) * 0.22, cx + (x - cx) * 0.25, cy + (y - cy) * 0.25, { noHead: true });
      S.box(x - 70, y - 24, 140, 48, s4 ? `^{${i - 2}}HT^D-ΘNF` : `^{${i - 2}}D_v`, { cls: "etale", size: 13, id: s4 ? "DThetaNFLink" : "EtalePicture" });
    }
    S.text(500, 518, "symmetries: every permutation of the spokes", { size: 14, color: "muted" });
    note(S, "Indifferent to order. Each spoke is its own arithmetic holomorphic structure; the core is what they all share.", 544);
  };

  P.symmetry = function (S, c) {
    const pm = c.step.id === "FormGlobalBasePm";
    const l = c.l, ls = c.ls, labs = pm ? seq(-ls, ls) : seq(1, ls), n = labs.length;
    title(S, pm ? "The F_l^⋊±-symmetry on the labels of F_l" : "The F_l^⍟-symmetry on the labels of F_l^⍟");
    S.box(40, 70, 250, 60, pm ? "D^⊚± = B(X̲_K)^0" : "D^⊚ = B(C̲_K)^0", { id: pm ? "DCircDotPmGlobal" : "DCircDotGlobal", cls: "etale" });
    S.text(165, 160, pm ? "Aut_±/Aut_csp ≅ F_l^⋊±" : "Aut(C̲_K)/Aut_ε(C̲_K) ≅ F_l^⍟", { size: 13, color: "muted" });
    S.text(165, 182, pm ? "geometric: fixes the places of K" : "arithmetic: moves the places of K", { size: 13, color: "muted" });
    const cx = 620, cy = 290, R = 185, pos = {};
    labs.forEach((t, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      pos[t] = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    });
    const g = pm ? null : (function () { for (let a = 2; a <= ls; a++) { let k = a, o = 1; while (k !== 1) { k = X.star(k * a, l); o++; } if (o === ls) return a; } return 1; })();
    labs.forEach((t) => {
      const u = pm ? X.sym(t + 1, l) : X.star(t * g, l);
      const [x1, y1] = pos[t], [x2, y2] = pos[u];
      const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, r = n > 14 ? 16 : 24;
      if (u !== t) S.arrow(x1 + (dx / d) * r, y1 + (dy / d) * r, x2 - (dx / d) * r, y2 - (dy / d) * r, {});
    });
    labs.forEach((t) => {
      const r = n > 14 ? 15 : 22;
      S.box(pos[t][0] - r, pos[t][1] - r, 2 * r, 2 * r, String(t), { cls: "lab", round: true, size: n > 14 ? 11 : 14, id: pm ? "LabCuspPm" : undefined });
    });
    S.text(cx, cy, pm ? "t ↦ t + 1" : (ls > 1 ? `j ↦ ${g}·j` : "trivial"), { size: 15, bold: true });
    if (pm) S.text(cx, cy + 24, "and t ↦ −t", { size: 13, color: "muted" });
    note(S, pm ? `Transitive on the ${l} labels: seen from the global side, no label is zero.`
      : `Simply transitive on the ${ls} labels: seen from the number field, no label is first.`);
  };

  // capsule of strips drawn as a column of bars
  function capsule(S, x, y, w, labels, o) {
    const n = labels.length, h = Math.min(40, 330 / n), ys = [];
    y = (o.mid || 255) - (n * h) / 2;
    labels.forEach((lab, i) => {
      const yy = y + i * h;
      ys.push(yy + (h - 4) / 2);
      S.box(x, yy, w, h - 4, (o.prefix || "") + lab, { cls: o.cls || "etale", id: o.id, size: h < 26 ? 11 : 13 });
    });
    return ys;
  }

  function nfSide(S, c, frob) {
    const ls = c.ls, labs = seq(1, ls).map((j) => (c.built("ChiJ") || frob ? `j = ${j}` : "?"));
    const ys = capsule(S, 400, 120, 200, labs, { prefix: frob ? "‡F_" : "†D_", id: frob ? "FJ" : "DJ", cls: frob ? "frob" : "etale" });
    return ys;
  }

  P.nfbridge = function (S, c) {
    const frob = c.step.id === "FormNFBridge";
    title(S, frob ? "The NF-bridge" : "The D-NF-bridge");
    const ys = nfSide(S, c, frob);
    S.text(500, 70, frob ? "‡F_J : l⍟ F-prime-strips" : "†D_J : l⍟ D-prime-strips", { size: 14, bold: true });
    if (frob) {
      S.box(60, 170, 220, 70, "‡F^⊚", { id: "FCircDotGlobal", cls: "frob", sub: "over ‡D^⊚" });
      S.box(60, 320, 220, 70, "‡F^⊛", { id: "FCircAstGlobal", cls: "frob", sub: "over ‡D^⊛" });
      S.arrow(170, 242, 170, 318, { dashed: true, label: "restriction of" });
      ys.forEach((y) => S.arrow(398, y, 282, 205, { id: "NFBridge" }));
      S.text(340, 130, "‡ψ^NF_⍟", { size: 14, bold: true });
    } else {
      S.box(60, 210, 220, 90, "†D^⊚ = B(C̲_K)^0", { id: "DCircDotGlobal", cls: "etale", sub: "global" });
      ys.forEach((y) => S.arrow(398, y, 282, 255, { id: "DNFBridge" }));
      S.text(340, 150, "†φ^NF_⍟", { size: 14, bold: true });
    }
    S.box(700, 200, 240, 110, "F_l^⍟  permutes the strips", { cls: "lab", sub: "simply transitively" });
    S.arrow(698, 255, 602, 255, { dashed: true });
    note(S, frob ? "The lift of a D-NF-bridge to Frobenioids is unique: no new choice is made here."
      : "The bridge is an F_l^⍟-orbit of morphisms. Until the Θ-bridge is built the strips carry no labels.");
  };

  P.thetabridge = function (S, c) {
    const frob = c.step.id === "FormThetaBridge";
    const ls = c.ls;
    title(S, frob ? "The Θ-bridge" : "The D-Θ-bridge");
    const ys = capsule(S, 100, 120, 200, seq(1, ls).map((j) => `j = ${j}`), { prefix: frob ? "‡F_" : "†D_", id: frob ? "FJ" : "DJ", cls: frob ? "frob" : "etale" });
    S.text(200, 70, frob ? "‡F_J" : "†D_J", { size: 14, bold: true });
    S.box(600, 220, 220, 80, frob ? "‡F_>" : "†D_>", { id: frob ? "FGt" : "DGt", cls: frob ? "frob" : "etale", sub: "one prime-strip" });
    ys.forEach((y, i) => S.arrow(302, y, 598, 260, { id: frob ? "ThetaBridge" : "DThetaBridge", label: ls <= 9 ? `q̳_v^${(i + 1) * (i + 1)}` : "", at: 0.16 }));
    S.text(450, 70, frob ? "‡ψ^Θ_⍟" : "†φ^Θ_⍟", { size: 14, bold: true });
    if (frob) {
      S.box(600, 380, 220, 60, "‡HT^Θ", { id: "ThetaHodgeTheater", cls: "frob", sub: "the Θ-Hodge theater of §3" });
      S.arrow(710, 302, 710, 378, { dashed: true });
    }
    S.text(710, 180, "labels held fixed", { size: 13, color: "muted" });
    note(S, "At a bad place the arrow from the strip j is the evaluation section at the label j, where Θ̳_v takes the value q̳_v^(j²).");
  };

  P.dthetanf = function (S, c) {
    const frob = c.step.id === "AssembleThetaNFHodgeTheater";
    const ls = c.ls;
    title(S, frob ? "A ΘNF-Hodge theater" : "A D-ΘNF-Hodge theater (Fig. 4.4)");
    S.box(24, 70, 952, 400, "", { id: frob ? "ThetaNFHodgeTheater" : "DThetaNFHodgeTheater", cls: "plain", frame: true });
    const ys = capsule(S, 400, 120, 200, seq(1, ls).map((j) => `j = ${j}`), { prefix: frob ? "‡F_" : "†D_", id: frob ? "FJ" : "DJ", cls: frob ? "frob" : "etale" });
    S.box(60, 210, 220, 90, frob ? "‡F^⊚ ⇢ ‡F^⊛" : "†D^⊚", { id: frob ? "FCircDotGlobal" : "DCircDotGlobal", cls: frob ? "frob" : "etale", sub: "number field side" });
    S.box(720, 210, 220, 90, frob ? "‡F_> ⇢ ‡HT^Θ" : "†D_>", { id: frob ? "FGt" : "DGt", cls: frob ? "frob" : "etale", sub: "theta side" });
    ys.forEach((y) => { S.arrow(398, y, 282, 255, { id: frob ? "NFBridge" : "DNFBridge" }); S.arrow(602, y, 718, 255, { id: frob ? "ThetaBridge" : "DThetaBridge" }); });
    S.text(170, 180, "indices permuted by F_l^⍟", { size: 13, color: "muted" });
    S.text(830, 180, "indices fixed", { size: 13, color: "muted" });
    note(S, "One capsule, two bridges. The left bridge knows the number field; the right bridge knows the labels.", 520);
  };

  P.lctransport = function (S, c) {
    const l = c.l, ls = c.ls;
    title(S, "Transport of cusp labels: φ^LC_j(m·[ε̲]) = j·m in F_l^⍟");
    const size = Math.min(52, 400 / (ls + 1)), x0 = 500 - ((ls + 1) * size) / 2, y0 = 90;
    S.text(x0 - 80, y0 + size * (ls + 1) / 2 + size / 2, "strip j", { size: 13, color: "muted" });
    S.text(500, y0 - 14, "global cusp class m·[ε̲] in LabCusp(†D^⊚)", { size: 13, color: "muted" });
    for (let m = 1; m <= ls; m++) S.box(x0 + m * size, y0, size - 4, size - 4, String(m), { cls: "etale", size: size < 30 ? 11 : 14 });
    for (let j = 1; j <= ls; j++) {
      S.box(x0, y0 + j * size, size - 4, size - 4, String(j), { cls: "etale", size: size < 30 ? 11 : 14, id: "ChiJ" });
      for (let m = 1; m <= ls; m++) {
        const v = X.star(j * m, l);
        S.box(x0 + m * size, y0 + j * size, size - 4, size - 4, String(v), { cls: m === 1 ? "mono" : "lab", size: size < 30 ? 11 : 14, id: m === 1 ? "ZetaLabel" : "PhiLC" });
      }
    }
    S.text(500, 516, "Column 1 is the class [ε̲]: it is sent to j by the strip j, for every j. That singles it out.", { size: 13 });
    note(S, "Each row is a bijection, and row j is row 1 multiplied by j.", 544);
  };

  P.procession = function (S, c) {
    const pm = c.step.id === "FoldCapsule";
    const n = pm ? c.lp : c.ls, first = pm ? 0 : 1;
    title(S, pm ? "The l±-procession on |T|" : "The l⍟-procession");
    const show = Math.min(n, 7), h = Math.min(54, 380 / show), cw = Math.min(60, 700 / n);
    for (let j = 1; j <= show; j++) {
      const stage = j === show ? n : j, y = 80 + (j - 1) * h;
      S.text(110, y + (h - 8) / 2, (pm ? "S±_" : "S⍟_") + stage, { size: 14, bold: true });
      for (let k = 0; k < stage; k++) S.box(170 + k * cw, y, cw - 5, h - 8, String(first + k), { cls: "lab", size: cw < 34 ? 11 : 13, id: pm ? "TAbs" : "Procession" });
      S.text(170 + stage * cw + 60, y + (h - 8) / 2, `${stage} possibilit${stage > 1 ? "ies" : "y"}`, { size: 12, color: "muted" });
      if (j === show - 1 && show < n) S.text(140, y + h + 2, "⋮", { size: 16, color: "muted" });
    }
    const f = (m) => { let r = 1n; for (let i = 2; i <= m; i++) r *= BigInt(i); return r; };
    S.text(500, 492, `unlabelled capsule: ${n}^${n} = ${(BigInt(n) ** BigInt(n)).toString()}      procession: ${n}! = ${f(n).toString()}`, { size: 15, bold: true });
    note(S, "A procession remembers only that each stage contains the previous one. That is enough to cut the indeterminacy to a factorial.");
  };

  P.stripkinds = function (S, c) {
    title(S, "Types of prime-strip in [IUTchI] and their model at a bad place (Fig. I1.2)");
    const rows = [
      ["D", "Π_v", "Def 4.1 (i)", "etale", "DPrimeStrip"],
      ["D^⊢", "G_v", "Def 4.1 (iii)", "mono", "DMonoPrimeStrip"],
      ["F", "Π_v  ↷  O^▷", "Def 5.2 (i)", "frob", "FPrimeStrip"],
      ["F^⊢", "G_v  ↷  O^× × q̳_v^N", "Def 5.2 (ii)", "frob", "FMonoPrimeStrip"],
      ["F^⊩", "F^⊢  +  a global realified Frobenioid", "Def 5.2 (iv)", "frob", "FMonoGlobPrimeStrip"],
    ];
    rows.forEach((r, i) => {
      const y = 80 + i * 78;
      S.box(60, y, 130, 58, r[0], { cls: r[3], id: r[4], size: 18 });
      S.box(210, y, 520, 58, r[1], { cls: "plain", size: 15 });
      S.text(840, y + 29, r[2], { size: 13, color: "muted" });
    });
    S.arrow(40, 108, 40, 186, {}).arrow(40, 264, 40, 342, {});
    note(S, "Arrows: mono-analyticization. The further types (F^⊢×, F^⊢×μ, …) are introduced in [IUTchII] and [IUTchIII].", 500);
  };

  P.globalnf = function (S, c) {
    title(S, "The global Frobenioids of the multiplicative side");
    S.box(120, 110, 300, 70, "†F^⊚ = †F^⊛|_{†D^⊚}", { id: "FCircDotGlobal", cls: "frob" });
    S.box(580, 110, 300, 70, "†F^⊛", { id: "FCircAstGlobal", cls: "frob", sub: "arithmetic divisors" });
    S.arrow(422, 145, 578, 145, { label: "restriction", dashed: true });
    S.box(120, 290, 300, 70, "†D^⊚", { id: "DCircDotGlobal", cls: "etale", sub: "C̲_K" });
    S.box(580, 290, 300, 70, "†D^⊛", { cls: "etale", sub: "C_{F_mod}" });
    S.arrow(422, 325, 578, 325, {});
    S.arrow(270, 182, 270, 288, {}).arrow(730, 182, 730, 288, {});
    S.box(300, 420, 400, 56, "π_1(†D^⊚)  ⟿  M^⊛(†D^⊚) ≅ F̄^×", { cls: "plain", sub: "anabelian reconstruction, [AbsTopIII] Thm 1.9" });
    S.arrow(270, 362, 400, 418, { dashed: true });
    note(S, "F_mod is recovered inside M^⊛(†D^⊚) as the invariants of π_1(†D^⊛). This is described here, not computed.");
  };

  P.pmbridge = function (S, c) {
    const frob = c.step.id === "AssembleThetaPmEllHodgeTheater";
    const ls = c.ls, labs = seq(-ls, ls).map((t) => `t = ${t}`);
    const whole = c.step.id === "AssembleDThetaPmEllHodgeTheater" || frob;
    title(S, frob ? "A Θ±ell-Hodge theater" : whole ? "A D-Θ±ell-Hodge theater (Fig. 6.1)" : c.step.id === "FormDThetaEllBridge" ? "The D-Θell-bridge" : "The D-Θ±-bridge");
    if (whole) S.box(24, 70, 952, 400, "", { id: frob ? "ThetaPmEllHodgeTheater" : "DThetaPmEllHodgeTheater", cls: "plain", frame: true });
    const ys = capsule(S, 400, 100, 200, labs, { prefix: frob ? "†F_" : "†D_", id: frob ? "FT" : "DT", cls: frob ? "frob" : "etale" });
    S.box(60, 210, 220, 90, frob ? "†F_≻" : "†D_≻", { id: frob ? "FBoxPlus" : "DBoxPlus", cls: frob ? "frob" : "etale", sub: "T is a group here" });
    S.box(720, 210, 220, 90, "†D^⊚± = B(X̲_K)^0", { id: "DCircDotPmGlobal", cls: "etale", sub: "T is a torsor here" });
    ys.forEach((y) => {
      S.arrow(398, y, 282, 255, { id: frob ? "ThetaPmBridge" : "DThetaPmBridge" });
      S.arrow(602, y, 718, 255, { id: frob ? "ThetaEllBridge" : "DThetaEllBridge" });
    });
    S.text(170, 180, frob ? "†ψ^Θ±_±" : "†φ^Θ±_±", { size: 14, bold: true });
    S.text(830, 180, frob ? "†ψ^Θell_±" : "†φ^Θell_±", { size: 14, bold: true });
    S.text(170, 330, "+-full poly-isomorphisms", { size: 12, color: "muted" });
    S.text(830, 330, "indices permuted by F_l^⋊±", { size: 12, color: "muted" });
    note(S, "The additive counterpart of the D-ΘNF-Hodge theater: l strips, labelled by F_l, between a prime-strip and a global base.", 520);
  };

  P.glue = function (S, c) {
    const fin = c.step.id === "AssembleThetaPmEllNFHodgeTheater";
    const ls = c.ls, l = c.l;
    title(S, fin ? "The Θ±ellNF-Hodge theater (Fig. I1.3, Fig. 6.5)" : "Gluing the additive side to the multiplicative side (Prop 6.7)");
    S.box(16, 56, 968, 440, "", { id: fin ? "ThetaPmEllNFHodgeTheater" : "DThetaPmEllNFHodgeTheater", cls: "plain", frame: true });
    S.box(30, 70, 440, 412, "", { id: fin ? "ThetaPmEllHodgeTheater" : "DThetaPmEllHodgeTheater", cls: "plain", frame: true });
    S.box(530, 70, 440, 412, "", { id: fin ? "ThetaNFHodgeTheater" : "DThetaNFHodgeTheater", cls: "plain", frame: true });
    const pre = fin ? "F" : "D", cls = fin ? "frob" : "etale";
    S.text(170, 92, fin ? "†HT^Θ±ell" : "†HT^D-Θ±ell", { size: 19, bold: true });
    S.text(840, 92, fin ? "†HT^ΘNF" : "†HT^D-ΘNF", { size: 19, bold: true });
    // left: T capsule
    const n = l, h = Math.min(34, 300 / n);
    const ty = (t) => 150 + (t + ls) * h + (h - 4) / 2;
    for (let t = -ls; t <= ls; t++) S.box(300, 150 + (t + ls) * h, 120, h - 4, `${t}`, { cls, id: fin ? "FT" : "DT", size: h < 22 ? 10 : 12 });
    S.box(300, 108, 120, 30, `†${pre}_≻`, { cls, id: fin ? "FBoxPlus" : "DBoxPlus", size: 13 });
    S.box(50, 240, 160, 70, "†D^⊚±", { cls: "etale", id: "DCircDotPmGlobal", sub: "F_l^⋊±" });
    S.arrow(298, 150 + (n * h) / 2, 212, 275, {});
    // right: J capsule
    const jy = (j) => 150 + (ls + j) * h + (h - 4) / 2;
    for (let j = 1; j <= ls; j++) S.box(580, 150 + (ls + j) * h, 120, h - 4, `${j}`, { cls, id: fin ? "FJ" : "DJ", size: h < 22 ? 10 : 12 });
    S.box(580, 108, 120, 30, `†${pre}_>`, { cls, id: fin ? "FGt" : "DGt", size: 13 });
    S.box(790, 240, 160, 70, fin ? "†F^⊚ ⇢ †F^⊛" : "†D^⊚", { cls: fin ? "frob" : "etale", id: fin ? "FCircDotGlobal" : "DCircDotGlobal", sub: "F_l^⍟" });
    S.arrow(702, 150 + (ls + (ls + 1) / 2) * h, 788, 275, {});
    // gluing arrows
    for (let j = 1; j <= ls; j++) {
      S.arrow(422, ty(j), 578, jy(j), { id: "GluingZeroBoxPlusToGt", color: "mono" });
      S.arrow(422, ty(-j), 578, jy(j), { id: "GluingZeroBoxPlusToGt", color: "mono", dashed: true });
    }
    S.arrow(422, 123, 578, 123, { id: "GluingZeroBoxPlusToGt", color: "mono" });
    S.arrow(422, ty(0), 578, 130, { id: "GluingZeroBoxPlusToGt", color: "mono", dashed: true });
    S.text(500, 100, "glue", { size: 13, color: "mono", bold: true });
    note(S, `±t ↦ j for t ≠ 0, and 0, ≻ ↦ >.  ${l} + 1 strips on the left become ${ls} + 1 on the right: two to one.`, 520);
    if (fin) note(S, "Additive symmetry for the theta function, multiplicative symmetry for the number field; they meet only along prime-strips.", 544);
  };

  // ------------------------------------------------------------ rendering
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  const FILL = { etale: "--etale-bg", frob: "--frob-bg", mono: "--mono-bg", lab: "--lab-bg", bad: "--bad-bg", good: "--good-bg", arc: "--arc-bg", plain: "--panel" };
  const EDGE = { etale: "--etale", frob: "--frob", mono: "--mono", lab: "--lab", bad: "--bad", good: "--muted", arc: "--ready", plain: "--muted" };

  const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  // text with real sub- and superscripts; shrinks to fit maxw when given
  function rich(g, text, x, y, size, o) {
    const runs = root.IUTXFmt.parse(String(text)), bold = o && o.bold ? "600 " : "";
    let s = size, total = 0;
    const measure = () => {
      total = 0;
      for (const r of runs) { g.font = `${bold}${r.lvl ? s * 0.74 : s}px ${FONT}`; r.w = g.measureText(r.s).width; total += r.w; }
    };
    measure();
    while (o && o.maxw && total > o.maxw && s > 8) { s -= 1; measure(); }
    const align = (o && o.align) || "center";
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    g.textAlign = "left"; g.textBaseline = "middle";
    for (const r of runs) {
      g.font = `${bold}${r.lvl ? s * 0.74 : s}px ${FONT}`;
      g.fillText(r.s, cx, y - r.lvl * s * 0.3);
      cx += r.w;
    }
    return total;
  }

  function render(canvas, scene, built, selected) {
    const dpr = window.devicePixelRatio || 1, cw = canvas.clientWidth || W, k = cw / W;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(H * k * dpr);
    const g = canvas.getContext("2d");
    g.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    g.clearRect(0, 0, W, H);
    const ink = css("--ink"), muted = css("--muted");
    const order = scene.items.filter((i) => i.t === "box" && i.frame).concat(scene.items.filter((i) => i.t === "arrow"),
      scene.items.filter((i) => i.t === "box" && !i.frame), scene.items.filter((i) => i.t === "text"));
    for (const it of order) {
      const pending = it.id && !built(it.id);
      g.save();
      if (it.t === "box") {
        const r = it.round ? it.w / 2 : Math.min(8, it.h / 4);
        g.beginPath(); g.roundRect(it.x, it.y, it.w, it.h, r);
        g.globalAlpha = pending ? 0.35 : 1;
        if (!it.frame) { g.fillStyle = css(FILL[it.cls] || "--panel"); g.fill(); }
        g.globalAlpha = pending ? 0.55 : 1;
        g.lineWidth = selected && it.id === selected ? 3 : it.frame ? 1.2 : 1.4;
        g.strokeStyle = selected && it.id === selected ? css("--accent") : css(EDGE[it.cls] || "--muted");
        g.setLineDash(pending ? [5, 4] : []);
        g.stroke();
        if (it.label) {
          g.setLineDash([]); g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
          const sub = it.sub && it.h >= 44;
          rich(g, it.label, it.x + it.w / 2, it.y + it.h / 2 - (sub ? 8 : 0), it.size || 15, { maxw: it.w - 8 });
          if (sub) { g.fillStyle = muted; rich(g, it.sub, it.x + it.w / 2, it.y + it.h / 2 + 13, 11.5, { maxw: it.w - 8 }); }
        }
      } else if (it.t === "arrow") {
        g.globalAlpha = pending ? 0.3 : 0.9;
        g.strokeStyle = g.fillStyle = it.color ? css("--" + it.color) : muted;
        g.lineWidth = it.bold ? 2.2 : 1.3;
        g.setLineDash(it.dashed || pending ? [5, 4] : []);
        g.beginPath(); g.moveTo(it.x1, it.y1); g.lineTo(it.x2, it.y2); g.stroke();
        g.setLineDash([]);
        const head = (x, y, a) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 9 * Math.cos(a - 0.4), y - 9 * Math.sin(a - 0.4)); g.lineTo(x - 9 * Math.cos(a + 0.4), y - 9 * Math.sin(a + 0.4)); g.closePath(); g.fill(); };
        const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1);
        if (!it.noHead) head(it.x2, it.y2, a);
        if (it.both) head(it.x1, it.y1, a + Math.PI);
        if (it.label) {
          g.globalAlpha = pending ? 0.5 : 1;
          const at = it.at === undefined ? 0.5 : it.at;
          const mx = it.x1 + (it.x2 - it.x1) * at, my = it.y1 + (it.y2 - it.y1) * at, fs = it.bold ? 15 : 12;
          g.font = `${it.bold ? "600 " : ""}${fs}px ${FONT}`;
          const tw = g.measureText(it.label.replace(/[_^{}]/g, "")).width + 8;
          g.fillStyle = css("--panel"); g.fillRect(mx - tw / 2, my - 10, tw, 20);
          g.fillStyle = it.bold ? css("--frob") : muted;
          rich(g, it.label, mx, my, fs, { bold: it.bold });
        }
      } else {
        g.fillStyle = it.color ? css("--" + it.color) : ink;
        rich(g, it.label, it.x, it.y, it.size || 14, { bold: it.bold, align: it.align || "center" });
      }
      g.restore();
    }
  }

  function hit(canvas, scene, ev) {
    const r = canvas.getBoundingClientRect(), k = W / r.width;
    const x = (ev.clientX - r.left) * k, y = (ev.clientY - r.top) * k;
    let best = null;
    for (const it of scene.items)
      if (it.t === "box" && it.id && x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h)
        if (!best || it.w * it.h < best.w * best.h) best = it;
    return best ? best.id : null;
  }

  function build(name, ctx) {
    const S = new Scene();
    (P[name] || function (S) { S.text(500, 280, "no picture for this step", { color: "muted" }); })(S, ctx);
    return S;
  }

  root.IUTXPictures = { build, render, hit, names: Object.keys(P), W, H };
})(window);
