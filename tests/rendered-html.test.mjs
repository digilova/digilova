import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname.replaceAll("/", "-")}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the work page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Diana Simakhov/);
  assert.match(html, /Marcus by Goldman Sachs/);
  assert.match(html, /Coinbase/);
  assert.match(html, /Experiments/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the experiments index", async () => {
  const response = await render("/experiments");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /An adaptive brief that changes with the decision/);
  assert.match(html, /A small motion system for trust/);
  assert.match(html, /From a loose prompt to a useful prototype/);
  assert.match(html, /Sample draft/);
});

for (const [slug, expected] of [
  ["adaptive-ai-brief", "Interactive brief"],
  ["motion-for-trust", "Run motion"],
  ["prompt-to-prototype", "Static visual"],
]) {
  test(`server-renders experiment: ${slug}`, async () => {
    const response = await render(`/experiments/${slug}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(expected));
  });
}

test("unknown experiment returns not found", async () => {
  const response = await render("/experiments/not-a-real-experiment");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /That experiment isn/);
});
