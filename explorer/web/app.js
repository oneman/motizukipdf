// app.js — the page: tour list, picture, step card, object card, facts.
(function () {
  "use strict";
  const M = IUTX_MODEL, X = window.IUTX, Pic = window.IUTXPictures, R = window.IUTXFmt.html;
  const $ = (id) => document.getElementById(id);
  const nodeById = new Map(M.nodes.map((n) => [n.id, n]));
  const builtBy = new Map(), usedBy = new Map();
  M.steps.forEach((s, i) => {
    s.out.forEach((id) => builtBy.set(id, i));
    s.in.forEach((id) => usedBy.set(id, (usedBy.get(id) || []).concat(i)));
  });

  let state = X.makeState(M, X.makeConfig(7, "11", "2,3,5"));
  let sel = 0;          // selected step
  let node = null;      // selected object id
  let scene = null;
  let tab = "picture";

  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v; else if (k === "onclick") e.addEventListener("click", v); else e.setAttribute(k, v);
    }
    for (const k of kids) e.append(k);
    return e;
  };
  const stepStatus = (i) => (state.done.has(i) ? "done" : X.ready(state, i) ? "ready" : "wait");
  const MARK = { done: "✓", ready: "▶", wait: "·" };
  const chipClass = (n) => (n.tags.includes("labels") ? "labels" : n.tags.includes("frobenius") ? "frobenius" : n.tags.includes("etale") ? "etale" : "plain");

  function chip(id) {
    const n = nodeById.get(id);
    const b = el("button", { class: `chip ${state.built.has(id) ? "built" : ""} ${chipClass(n)}`, title: n.notation, onclick: () => { node = id; draw(); } }, id);
    if (id === node) b.setAttribute("aria-current", "true");
    return b;
  }

  function drawTour() {
    const ol = $("steps");
    ol.replaceChildren();
    let act = -1;
    M.steps.forEach((s, i) => {
      if (s.act !== act) { act = s.act; ol.append(el("li", { class: "act" }, R(`${act + 1}. ${M.acts[act].title}`))); }
      const st = stepStatus(i);
      const b = el("button", { class: `step ${st}`, onclick: () => select(i) }, el("span", { class: "mark", "aria-hidden": "true" }, MARK[st]), el("span", {}, R(s.title)));
      b.setAttribute("aria-label", `${s.title}: ${st === "wait" ? "waiting" : st}`);
      if (i === sel) b.setAttribute("aria-current", "true");
      ol.append(el("li", {}, b));
    });
    $("progress").textContent = `${state.hist.length} of ${M.steps.length} steps done, ${state.built.size} of ${M.nodes.length} objects built`;
    $("btn-next").disabled = X.next(state) < 0;
    $("btn-undo").disabled = state.hist.length === 0;
    $("btn-all").disabled = X.next(state) < 0;
    const cur = ol.querySelector('[aria-current="true"]');
    const nav = $("tour");      // keep the selection in view inside the list, without moving the page
    if (cur && nav.scrollHeight > nav.clientHeight) {
      const top = cur.offsetTop - nav.offsetTop, bottom = top + cur.offsetHeight;
      if (top < nav.scrollTop + 40) nav.scrollTop = Math.max(0, top - 40);
      else if (bottom > nav.scrollTop + nav.clientHeight - 8) nav.scrollTop = bottom - nav.clientHeight + 8;
    }
  }

  function drawStep() {
    const s = M.steps[sel], st = stepStatus(sel), card = $("step-card");
    const status = st === "done" ? "Done" : st === "ready" ? "Ready to apply" : `Waiting for: ${X.missing(state, sel).join(", ")}`;
    const apply = el("button", { class: "primary", onclick: () => { if (X.apply(state, sel)) draw(); } }, "Apply this step");
    apply.disabled = st !== "ready";
    card.replaceChildren(
      el("div", { class: "ref" }, R(`Act ${s.act + 1}. ${M.acts[s.act].title} · step ${sel + 1} of ${M.steps.length}`)),
      el("h2", {}, R(s.title)),
      el("div", { class: "ref" }, `[IUTchI] ${s.ref} · `, el("code", {}, s.id)),
      el("p", {}, R(s.does)),
      el("div", { class: "io" },
        el("div", {}, el("h3", {}, "Needs"), el("div", { class: "chips" }, ...(s.in.length ? s.in.map(chip) : ["nothing"]))),
        el("div", {}, el("h3", {}, "Builds"), el("div", { class: "chips" }, ...s.out.map(chip)))),
      el("h3", {}, "What to notice"),
      el("p", {}, R(s.watch)),
      el("div", {}, el("span", { class: `status ${st}` }, status)),
      el("p", {}, apply));
  }

  function drawNode() {
    const card = $("node-card");
    if (!node) {
      card.replaceChildren(el("h3", {}, "Object"), el("p", {}, "Select an object in the picture or in the lists to read what it is and where the paper defines it."));
      return;
    }
    const n = nodeById.get(node), b = builtBy.get(node), u = usedBy.get(node) || [];
    const link = (i) => el("button", { class: "chip built plain", onclick: () => select(i) }, R(`${i + 1}. ${M.steps[i].title}`));
    card.replaceChildren(
      el("h3", {}, state.built.has(node) ? "Object · built" : "Object · not built yet"),
      el("div", { class: "ids" }, el("code", {}, n.id)),
      el("div", { class: "notation" }, R(n.notation)),
      el("div", { class: "ref" }, `[IUTchI] ${n.ref}`),
      el("div", { class: "tags" }, el("span", { class: "tag" }, n.kind), ...n.tags.map((t) => el("span", { class: "tag" }, t === "mono" ? "mono-analytic" : t === "etale" ? "étale-like" : t === "frobenius" ? "Frobenius-like" : t))),
      el("p", {}, R(n.brief)),
      ...(n.parts.length ? [el("h3", {}, "Made of / uses"), el("div", { class: "chips" }, ...n.parts.map(chip))] : []),
      el("h3", {}, "Built by"), el("div", { class: "chips" }, link(b)),
      ...(u.length ? [el("h3", {}, "Used by"), el("div", { class: "chips" }, ...u.map(link))] : []));
  }

  function drawFacts() {
    const s = M.steps[sel], box = $("facts");
    if (!s.fact) { box.replaceChildren(el("h3", {}, "Computed"), el("p", {}, "Nothing is computed at this step. What it builds is described, with its citation, not calculated.")); return; }
    const rows = X.facts(state.cfg, s.fact);
    const table = el("table", {});
    for (const [k, v] of rows) {
      const td = el("td", {}, R(v));
      if (v.startsWith("checked") && v.endsWith("ok")) td.className = "ok"; else if (v.startsWith("assumed")) td.className = "assumed";
      table.append(el("tr", {}, el("td", {}, R(k)), td));
    }
    box.replaceChildren(el("h3", {}, `Computed for l = ${state.cfg.l}`), table);
  }

  function drawPicture() {
    const s = M.steps[sel], l = state.cfg.l;
    scene = Pic.build(s.picture, { cfg: state.cfg, l, ls: (l - 1) / 2, lp: (l + 1) / 2, step: s, built: (id) => state.built.has(id) });
    Pic.render($("canvas"), scene, (id) => state.built.has(id), node);
    $("canvas").setAttribute("aria-label", `Picture for the step: ${s.title}`);
  }

  function drawMap() {
    const box = $("map");
    box.replaceChildren();
    M.acts.forEach((a, i) => {
      const ids = [];
      M.steps.forEach((s) => { if (s.act === i) ids.push(...s.out); });
      box.append(el("h3", {}, `${i + 1}. ${a.title} · ${a.ref}`), el("div", { class: "chips" }, ...ids.map(chip)));
    });
  }

  function draw() {
    drawTour(); drawStep(); drawNode(); drawFacts();
    $("canvas-wrap").hidden = tab !== "picture"; $("map").hidden = tab !== "map";
    $("tab-picture").setAttribute("aria-selected", String(tab === "picture"));
    $("tab-map").setAttribute("aria-selected", String(tab === "map"));
    if (tab === "picture") drawPicture(); else drawMap();
    try { history.replaceState(null, "", "#" + M.steps[sel].id); } catch (e) { /* file:// in some browsers */ }
  }
  function select(i) { sel = i; draw(); }

  // ------------------------------------------------------------ controls
  $("btn-next").addEventListener("click", () => { const k = X.next(state); if (k >= 0) { X.apply(state, k); sel = k; draw(); } });
  $("btn-undo").addEventListener("click", () => { const k = X.undo(state); if (k >= 0) { sel = k; draw(); } });
  $("btn-all").addEventListener("click", () => { let k; while ((k = X.next(state)) >= 0) { X.apply(state, k); sel = k; } draw(); });
  $("btn-reset").addEventListener("click", () => { state = X.makeState(M, state.cfg); sel = 0; node = null; draw(); });
  $("tab-picture").addEventListener("click", () => { tab = "picture"; draw(); });
  $("tab-map").addEventListener("click", () => { tab = "map"; draw(); });
  $("canvas").addEventListener("click", (ev) => { const id = scene && Pic.hit($("canvas"), scene, ev); if (id) { node = id; draw(); } });
  $("canvas").addEventListener("mousemove", (ev) => { $("canvas").style.cursor = scene && Pic.hit($("canvas"), scene, ev) ? "pointer" : "default"; });
  window.addEventListener("resize", () => { if (tab === "picture") drawPicture(); });
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
  document.addEventListener("keydown", (ev) => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (ev.key === "n") $("btn-next").click();
    else if (ev.key === "u") $("btn-undo").click();
    else if (ev.key === "ArrowDown" && sel + 1 < M.steps.length) { ev.preventDefault(); select(sel + 1); }
    else if (ev.key === "ArrowUp" && sel > 0) { ev.preventDefault(); select(sel - 1); }
  });

  const lsel = $("cfg-l");
  for (const p of [5, 7, 11, 13, 17, 19, 23, 29]) lsel.append(el("option", { value: p }, String(p)));
  lsel.value = "7";
  $("config").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const cfg = X.makeConfig(lsel.value, $("cfg-bad").value, $("cfg-good").value);
    const problems = X.checkConfig(cfg, M.lmax);
    $("cfg-msg").textContent = problems.join("; ");
    if (problems.length) return;
    state.cfg = cfg;      // the objects built so far are kept; pictures and facts are recomputed
    draw();
  });
  lsel.addEventListener("change", () => $("config").requestSubmit());

  const want = location.hash.slice(1), at = M.steps.findIndex((s) => s.id === want);
  if (at >= 0) sel = at;
  draw();
})();
