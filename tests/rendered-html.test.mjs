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

test("home redirects toward experiments", async () => {
  const response = await render("/");
  assert.ok([200, 307, 308].includes(response.status));
});

test("work page stays password gated", async () => {
  const response = await render("/work");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Password protected|This section is private/i);
  assert.match(html, /password/i);
  assert.doesNotMatch(html, /Marcus by Goldman Sachs/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the experiments index", async () => {
  const response = await render("/experiments");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /href="\/work"/);
  assert.match(html, /password protected/i);
  assert.match(html, /aria-label="Diana Simakhov — Experiments"/);
  assert.match(html, /Focused Card Viewer/);
  assert.match(html, /Interactive player card viewer/);
  assert.match(html, /\/experiments\/yamal\/yamal-front\.webp/);
  assert.match(html, /\/experiments\/players\/haaland-front\.webp/);
  assert.match(html, /\/experiments\/players\/messi-front\.webp/);
  assert.equal(
    html.match(/href="\/experiments\/focused-card-viewer"/g)?.length,
    undefined,
  );
  assert.match(html, /Spatial Card Gallery/);
  assert.match(html, /Explore the ASK UNK sports-card collection/);
  assert.match(html, /\/experiments\/ask-unk\/cards\/card-01\.webp/);
  assert.equal(
    html.match(/href="\/experiments\/ask-unk-spatial-gallery"/g)?.length,
    undefined,
  );
  assert.doesNotMatch(html, /file:\/\/.*card-\d+\.webp/);
  assert.doesNotMatch(html, /An adaptive brief/);
  assert.doesNotMatch(html, /A small motion system for trust/);
  assert.doesNotMatch(html, /From a loose prompt to a useful prototype/);
});

test("ASK UNK case study stays disabled", async () => {
  const response = await render("/experiments/ask-unk-spatial-gallery");
  assert.equal(response.status, 404);
});

test("focused card case study stays disabled", async () => {
  const response = await render("/experiments/focused-card-viewer");
  assert.equal(response.status, 404);
});

test("unknown experiment returns not found", async () => {
  const response = await render("/experiments/not-a-real-experiment");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /That experiment isn/);
});
