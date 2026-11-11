// Cross-check of the JavaScript port against the C engine, and of the state machine.
const { execFileSync } = require("child_process");
const path = require("path");
const assert = require("assert");
const X = require("./engine.js");
const model = require("./data.js");
const iutx = path.join(__dirname, "..", "c", "iutx");

const cases = [[5, "11", "2,3"], [7, "11", "2,3,5"], [11, "3,13", "2,3,5,7"], [13, "3,5,7", "2,11"], [29, "3", "2,2,3"]];
let lines = 0;
for (const [l, bad, good] of cases) {
  const c = JSON.parse(execFileSync(iutx, ["json", "facts", "--l", String(l), "--bad", bad, "--good", good], { encoding: "utf8" }));
  const js = X.allFacts(X.makeConfig(l, bad, good));
  assert.deepStrictEqual(Object.keys(js), Object.keys(c), "fact views differ");
  for (const k of Object.keys(c)) { assert.deepStrictEqual(js[k], c[k], `facts differ: ${k}, l = ${l}`); lines += c[k].length; }
}
console.log(`facts: C and JavaScript agree on ${lines} lines over ${cases.length} configurations`);

// configurations Def 3.1 forbids are refused by both
for (const [l, bad] of [[4, "11"], [3, "11"], [7, ""], [7, "2"], [7, "7"], [7, "9"]]) {
  assert.ok(X.checkConfig(X.makeConfig(l, bad, "2"), model.lmax).length > 0, `JS accepts l=${l} bad=${bad}`);
  let failed = false;
  try { execFileSync(iutx, ["facts", "--l", String(l), "--bad", bad, "--good", "3"], { stdio: "pipe" }); } catch (e) { failed = true; }
  assert.ok(failed, `C accepts l=${l} bad=${bad}`);
}
console.log("conditions: forbidden configurations are refused by both");

// the state machine: the tour runs in order, nothing is ready early, undo restores
const s = X.makeState(model, X.makeConfig(7, "11", "2,3,5"));
for (let i = 0; i < model.steps.length; i++) {
  assert.strictEqual(X.next(s), i, `tour stalls at ${model.steps[i].id}`);
  for (let j = 0; j < model.steps.length; j++)
    if (X.ready(s, j)) assert.ok(model.steps[j].in.every((id) => s.built.has(id)));
  assert.ok(X.apply(s, i));
}
assert.strictEqual(s.built.size, model.nodes.length, "not every object was built");
assert.strictEqual(X.next(s), -1);
while (X.undo(s) >= 0);
assert.strictEqual(s.built.size, 0);
// out of tour order: a step whose inputs exist may be applied early, one whose inputs are missing may not
assert.ok(X.apply(s, 0));
const labels = model.steps.findIndex((t) => t.id === "DeriveLabels");
assert.ok(X.apply(s, labels), "DeriveLabels should be ready right after the initial data");
const last = model.steps.length - 1;
assert.ok(!X.apply(s, last), "the last step must not be ready at the start");
console.log(`state: ${model.steps.length} steps build ${model.nodes.length} objects; order is enforced; undo works`);

// every node id is letters only
for (const n of model.nodes) assert.ok(/^[A-Za-z]+$/.test(n.id), n.id);
for (const t of model.steps) assert.ok(/^[A-Za-z]+$/.test(t.id), t.id);
console.log("ids: letters only");
