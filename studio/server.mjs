import { createServer } from "node:http";
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const STUDIO_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(STUDIO_DIR, "..");
const CONTENT_DIR = process.env.DIGILOVA_CONTENT_DIR
  ? resolve(process.env.DIGILOVA_CONTENT_DIR)
  : join(PROJECT_DIR, "content", "experiments");
const PORT = Number(process.env.DIGILOVA_STUDIO_PORT ?? 3001);
const MAX_BODY = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function safePath(parent, child) {
  const target = resolve(parent, child);
  if (target !== parent && !target.startsWith(`${parent}${sep}`)) {
    throw new Error("Unsafe file path");
  }
  return target;
}

function safeFilename(name) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 100);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error("Invalid asset filename");
  }
  return cleaned;
}

function validateBlocks(blocks, label) {
  if (!Array.isArray(blocks)) throw new Error(`${label} must be an array`);
  const allowed = new Set(["text", "image", "code", "callout", "divider"]);

  for (const block of blocks) {
    if (!block?.id || !allowed.has(block.type)) {
      throw new Error(`${label} contains an invalid block`);
    }
    if (block.type === "image" && !block.alt?.trim()) {
      throw new Error("Every image needs alternative text");
    }
    if (block.type === "image" && !block.src?.startsWith("./assets/")) {
      throw new Error("Image paths must point to the post assets folder");
    }
  }
}

function validatePayload(payload) {
  if (!payload?.title?.trim()) throw new Error("Title is required");
  if (!payload.summary?.trim()) throw new Error("Summary is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date ?? "")) {
    throw new Error("Date must use YYYY-MM-DD");
  }
  validateBlocks(payload.blocks, "Post blocks");
  if (payload.detailBlocks) validateBlocks(payload.detailBlocks, "Detail blocks");
  if (
    payload.previewSource?.trim() &&
    !/export\s+default/.test(payload.previewSource)
  ) {
    throw new Error("Preview.tsx must include a default export");
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function listPosts() {
  await mkdir(CONTENT_DIR, { recursive: true });
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const folder = safePath(CONTENT_DIR, entry.name);
    const postPath = join(folder, "post.json");
    if (!(await exists(postPath))) continue;

    const post = JSON.parse(await readFile(postPath, "utf8"));
    const detailPath = join(folder, "detail.json");
    const previewPath = join(folder, "Preview.tsx");
    posts.push({
      slug: entry.name,
      ...post,
      detailBlocks: (await exists(detailPath))
        ? JSON.parse(await readFile(detailPath, "utf8")).blocks
        : [],
      previewSource: (await exists(previewPath))
        ? await readFile(previewPath, "utf8")
        : "",
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("Upload is larger than 20 MB");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function savePost(payload) {
  validatePayload(payload);
  const slug = slugify(payload.title);
  if (!slug) throw new Error("Title must contain letters or numbers");

  const originalSlug = payload.originalSlug
    ? slugify(payload.originalSlug)
    : undefined;
  const target = safePath(CONTENT_DIR, slug);
  const original = originalSlug
    ? safePath(CONTENT_DIR, originalSlug)
    : undefined;

  if (!original && (await exists(target))) {
    const error = new Error(`A post named “${slug}” already exists`);
    error.status = 409;
    throw error;
  }
  if (original && original !== target && (await exists(target))) {
    const error = new Error(`A post named “${slug}” already exists`);
    error.status = 409;
    throw error;
  }

  await mkdir(CONTENT_DIR, { recursive: true });
  const temporary = safePath(CONTENT_DIR, `.studio-${randomUUID()}`);
  const backup = safePath(CONTENT_DIR, `.backup-${randomUUID()}`);

  try {
    if (original && (await exists(original))) {
      await cp(original, temporary, { recursive: true });
    } else {
      await mkdir(temporary, { recursive: true });
    }

    const post = {
      title: payload.title.trim(),
      date: payload.date,
      summary: payload.summary.trim(),
      tags: String(payload.tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      blocks: payload.blocks,
    };

    await writeFile(
      join(temporary, "post.json"),
      `${JSON.stringify(post, null, 2)}\n`,
    );

    const detailPath = join(temporary, "detail.json");
    if (payload.detailBlocks?.length) {
      await writeFile(
        detailPath,
        `${JSON.stringify({ blocks: payload.detailBlocks }, null, 2)}\n`,
      );
    } else {
      await rm(detailPath, { force: true });
    }

    const previewPath = join(temporary, "Preview.tsx");
    if (payload.previewSource?.trim()) {
      await writeFile(previewPath, `${payload.previewSource.trim()}\n`);
    } else {
      await rm(previewPath, { force: true });
    }

    const assetsFolder = join(temporary, "assets");
    for (const asset of payload.assets ?? []) {
      if (!IMAGE_TYPES.has(asset.type)) {
        throw new Error(`${asset.name} is not a supported image`);
      }
      const name = safeFilename(asset.name);
      const match = String(asset.data).match(/^data:[^;]+;base64,(.+)$/);
      if (!match) throw new Error(`${name} has invalid image data`);
      const bytes = Buffer.from(match[1], "base64");
      if (bytes.length > 10 * 1024 * 1024) {
        throw new Error(`${name} is larger than 10 MB`);
      }
      await mkdir(assetsFolder, { recursive: true });
      await writeFile(join(assetsFolder, name), bytes);
    }

    if (original && (await exists(original))) {
      await rename(original, backup);
    }
    await rename(temporary, target);
    await rm(backup, { recursive: true, force: true });
    return { slug };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    if (await exists(backup)) {
      if (await exists(target)) await rm(target, { recursive: true });
      await rename(backup, original);
    }
    throw error;
  }
}

function json(response, status = 200) {
  return new Response(JSON.stringify(response), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function staticResponse(pathname) {
  const files = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/app.js": ["app.js", "text/javascript; charset=utf-8"],
    "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  };
  const file = files[pathname];
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(await readFile(join(STUDIO_DIR, file[0])), {
    headers: { "content-type": file[1] },
  });
}

export function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      let result;
      if (request.method === "GET" && url.pathname === "/api/posts") {
        result = json(await listPosts());
      } else if (request.method === "POST" && url.pathname === "/api/posts") {
        result = json(await savePost(await readBody(request)), 201);
      } else {
        result = await staticResponse(url.pathname);
      }
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) {
      const status = error.status ?? 400;
      const result = json(
        { error: error.message ?? "Could not save post" },
        status,
      );
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Digilova Content Studio: http://localhost:${PORT}`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
