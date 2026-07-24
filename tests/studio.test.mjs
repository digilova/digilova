import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("Content Studio creates and updates an experiment folder", async () => {
  const contentDir = await mkdtemp(join(tmpdir(), "digilova-studio-"));
  process.env.DIGILOVA_CONTENT_DIR = contentDir;
  const { listPosts, savePost } = await import(
    `../studio/server.mjs?test=${Date.now()}`
  );

  try {
    const payload = {
      title: "Trust Motion",
      date: "2026-07-23",
      summary: "A small interaction test.",
      tags: "motion, trust",
      blocks: [{ id: "intro", type: "text", content: "Hello." }],
      detailBlocks: [],
      previewSource: "",
      assets: [],
    };

    assert.deepEqual(await savePost(payload), { slug: "trust-motion" });

    const post = JSON.parse(
      await readFile(join(contentDir, "trust-motion", "post.json"), "utf8"),
    );
    assert.equal(post.title, "Trust Motion");
    assert.deepEqual(post.tags, ["motion", "trust"]);

    await savePost({
      ...payload,
      originalSlug: "trust-motion",
      detailBlocks: [
        { id: "detail", type: "text", content: "Deeper content." },
      ],
      previewSource:
        "export default function Preview() { return <button>Try it</button>; }",
    });
    assert.match(
      await readFile(
        join(contentDir, "trust-motion", "Preview.tsx"),
        "utf8",
      ),
      /export default/,
    );
    assert.match(
      await readFile(join(contentDir, "trust-motion", "detail.json"), "utf8"),
      /Deeper content/,
    );

    assert.equal((await listPosts()).length, 1);
  } finally {
    delete process.env.DIGILOVA_CONTENT_DIR;
    await rm(contentDir, { recursive: true, force: true });
  }
});
