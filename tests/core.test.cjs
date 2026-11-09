const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../extension/core.js");
test("multiple tags survive round trip and match each summary filter", () => {
  const r = G.validateRecord(G.record({quote:"一句原文", tags:["content", "product", "business"]}));
  const imported = G.validateRecord(JSON.parse(JSON.stringify(r)));
  for (const type of ["content", "product", "business"]) assert.equal(G.search([imported], "", {type}).length, 1);
  assert.match(G.markdown([r]), /内容选题、产品选题、非生业务/);
  assert.deepEqual(G.recordTags(G.validateRecord({...r, tags:[]})), []);
  assert.deepEqual(G.recordTags(G.record({quote:"旧记录",type:"writing"})), ["writing"]);
});
test("records default to unprocessed and preserve completion status", () => {
  for (const status of [undefined, "converted", "archived"]) {
    const original = G.record({ quote: "保留原文", thought: "保留想法", status });
    const normalized = G.validateRecord(original);
    assert.equal(normalized.status, status || "unprocessed");
    assert.equal(normalized.thought, original.thought);
    assert.equal(normalized.id, original.id);
  }
});
test("import rejects script links and malformed records", () => {
  const r = G.record({ quote: "一句话" });
  assert.equal(G.validateRecord(r).quote, "一句话");
  assert.throws(() => G.validateRecord({ ...r, url: "javascript:alert(1)" }));
  assert.throws(() => G.validateRecord({ ...r, createdAt: "invalid" }));
  assert.throws(() => G.validateRecord({ ...r, quote: "" }));
});
test("natural phrase tokens find excerpt and thought with combined filters", () => {
  const a = G.record({
      quote: "好的文章开头需要具体的场景",
      thought: "试着从清晨跑步写起",
      type: "writing",
    }),
    b = G.record({ quote: "产品设计", type: "product" });
  assert.deepEqual(
    G.search([a, b], "我读过哪些关于文章开头的方法").map((x) => x.id),
    [a.id],
  );
  assert.equal(G.search([a, b], "", { type: "product" }).length, 1);
  assert.equal(G.search([a, b], "文章开头", { type: "product" }).length, 0);
});
test("canonical URLs retain query identity and strip scroll fragment", () => {
  assert.equal(
    G.canonical("https://example.com/read?id=2#chapter"),
    "https://example.com/read?id=2",
  );
});
test("rendered content escapes injected markup", () => {
  assert.equal(
    G.esc('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
});
test("source jump validates scheme and encodes quote as text fragment", () => {
  assert.equal(G.anchorUrl({ url: "javascript:alert(1)", quote: "x" }), "");
  assert.match(
    G.anchorUrl({ url: "https://example.com/a", quote: "a-b" }),
    /#:~:text=a%2Db$/,
  );
});
