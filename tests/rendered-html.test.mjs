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
  assert.match(html, /ASK UNK — Spatial Card Gallery/);
  assert.match(html, /Explore the ASK UNK sports-card collection/);
  assert.match(html, /\/experiments\/ask-unk\/cards\/card-01\.webp/);
  assert.match(html, /href="\/experiments\/ask-unk-spatial-gallery"/);
  assert.doesNotMatch(html, /file:\/\/.*card-\d+\.webp/);
  assert.doesNotMatch(html, /An adaptive brief/);
  assert.doesNotMatch(html, /A small motion system for trust/);
  assert.doesNotMatch(html, /From a loose prompt to a useful prototype/);
});

test("server-renders the ASK UNK case study", async () => {
  const response = await render("/experiments/ask-unk-spatial-gallery");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Designing a spatial card gallery for ASK UNK/);
  assert.match(html, /The compact layout uses six rows/);
  assert.match(html, /SpatialCardGallery/);
});

test("unknown experiment returns not found", async () => {
  const response = await render("/experiments/not-a-real-experiment");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /That experiment isn/);
});
