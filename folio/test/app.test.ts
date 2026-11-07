import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { openDb, toFtsQuery } from "../src/db.ts";
import { classifyInput, finalText, parseArticle, type Generator } from "../src/generate.ts";
import { createApp } from "../src/server.ts";

test("classifyInput tells links from topics", () => {
  assert.deepEqual(classifyInput("https://example.com/a?b=1"), { input: "https://example.com/a?b=1", sourceType: "url" });
  assert.deepEqual(classifyInput("en.wikipedia.org/wiki/Entropy"), { input: "https://en.wikipedia.org/wiki/Entropy", sourceType: "url" });
  assert.deepEqual(classifyInput("  how do vaccines work "), { input: "how do vaccines work", sourceType: "topic" });
  assert.equal(classifyInput("Node.js streams").sourceType, "topic");
  assert.equal(classifyInput("javascript:alert(1)").sourceType, "topic");
});

test("parseArticle extracts title, dek and body", () => {
  const md = "Sure, here it is.\n\n# The Title\n> A short dek.\n\n## Section\nBody text.";
  assert.deepEqual(parseArticle(md, "fallback"), { title: "The Title", dek: "A short dek.", body: "## Section\nBody text." });
  assert.deepEqual(parseArticle("Just text", "fallback"), { title: "fallback", dek: null, body: "Just text" });
});

test("finalText keeps only text after the last tool result", () => {
  const content = [
    { type: "text", text: "Let me fetch that." },
    { type: "server_tool_use", id: "1", name: "web_fetch", input: {} },
    { type: "web_fetch_tool_result", tool_use_id: "1", content: {} },
    { type: "thinking", thinking: "", signature: "" },
    { type: "text", text: "# Title\n" },
    { type: "text", text: "Body with a citation." },
  ] as any;
  assert.equal(finalText(content), "# Title\nBody with a citation.");
});

test("toFtsQuery makes safe prefix queries", () => {
  assert.equal(toFtsQuery(`photo "synth" OR (x`), `"photo"* "synth"* "OR"* "x"*`);
  assert.equal(toFtsQuery("!!!"), "");
});

async function withServer(generate: Generator, fn: (base: string) => Promise<void>) {
  const db = openDb(mkdtempSync(path.join(tmpdir(), "folio-")));
  const app = createApp({ db, generate, model: "test", effort: "low", lookupCover: async () => null });
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

async function waitFor(base: string, id: number, status: string) {
  for (let i = 0; i < 50; i++) {
    const a = await (await fetch(`${base}/api/articles/${id}`)).json();
    if (a.status === status) return a;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`article ${id} never reached ${status}`);
}

test("create, list, search, retry and delete articles", async () => {
  let brokenCalls = 0;
  const generate: Generator = async ({ input, mode }) => {
    if (input.includes("broken") && brokenCalls++ === 0) throw new Error("boom");
    return `# About ${input}\n> A ${mode} piece.\n\n## Ideas\nChlorophyll captures sunlight.`;
  };

  await withServer(generate, async (base) => {
    const post = (body: object) =>
      fetch(`${base}/api/articles`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

    assert.equal((await post({ input: "x", mode: "essay" })).status, 400);
    assert.equal((await post({ input: "", mode: "summary" })).status, 400);

    const created = await (await post({ input: "photosynthesis", mode: "tutor" })).json();
    assert.equal(created.status, "pending");
    const ready = await waitFor(base, created.id, "ready");
    assert.equal(ready.title, "About photosynthesis");
    assert.equal(ready.dek, "A tutor piece.");
    assert.equal(ready.mode, "tutor");

    const hits = await (await fetch(`${base}/api/articles?q=chloro`)).json();
    assert.equal(hits.length, 1);
    assert.match(hits[0].snippet, /<mark>Chlorophyll<\/mark>/);
    assert.equal((await (await fetch(`${base}/api/articles?q=zebra`)).json()).length, 0);

    const broken = await (await post({ input: "broken thing", mode: "summary" })).json();
    const failed = await waitFor(base, broken.id, "failed");
    assert.equal(failed.error, "boom");
    assert.equal((await fetch(`${base}/api/articles/${broken.id}/retry`, { method: "POST" })).status, 200);
    await waitFor(base, broken.id, "ready");

    assert.equal((await (await fetch(`${base}/api/articles`)).json()).length, 2);
    assert.equal((await fetch(`${base}/api/articles/${created.id}`, { method: "DELETE" })).status, 204);
    assert.equal((await fetch(`${base}/api/articles/${created.id}`)).status, 404);
    assert.equal((await (await fetch(`${base}/api/articles?q=photosynthesis`)).json()).length, 0);
  });
});
