import type {
  ExperimentDetail,
  ExperimentPost,
  ExperimentRecord,
} from "@/content/experiment-types";

const postModules = import.meta.glob<{ default: ExperimentPost }>(
  "/content/experiments/*/post.json",
  { eager: true },
);

const detailModules = import.meta.glob<{ default: ExperimentDetail }>(
  "/content/experiments/*/detail.json",
  { eager: true },
);

const previewModules = import.meta.glob<{ default: ExperimentRecord["Preview"] }>(
  "/content/experiments/*/Preview.tsx",
  { eager: true },
);

const previewSources = import.meta.glob<string>(
  "/content/experiments/*/Preview.tsx",
  { eager: true, query: "?raw", import: "default" },
);

const assetModules = import.meta.glob<string>(
  "/content/experiments/*/assets/*",
  { eager: true, query: "?url", import: "default" },
);

function slugFromPath(path: string): string {
  const match = path.match(/\/content\/experiments\/([^/]+)\//);
  if (!match) throw new Error(`Could not derive experiment slug from ${path}`);
  return match[1];
}

function assertPost(post: ExperimentPost, path: string): void {
  if (!post.title?.trim()) throw new Error(`${path}: title is required`);
  if (!post.summary?.trim()) throw new Error(`${path}: summary is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
    throw new Error(`${path}: date must use YYYY-MM-DD`);
  }
  if (!Array.isArray(post.blocks)) {
    throw new Error(`${path}: blocks must be an array`);
  }
}

function findBySlug<T>(
  modules: Record<string, T>,
  slug: string,
): T | undefined {
  return Object.entries(modules).find(
    ([path]) => slugFromPath(path) === slug,
  )?.[1];
}

export function getExperiments(): ExperimentRecord[] {
  return Object.entries(postModules)
    .map(([path, module]) => {
      const slug = slugFromPath(path);
      const post = module.default;
      assertPost(post, path);

      return {
        slug,
        post,
        detail:
          post.hasDetail === false
            ? undefined
            : findBySlug(detailModules, slug)?.default,
        Preview: findBySlug(previewModules, slug)?.default,
        previewSource: findBySlug(previewSources, slug),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
    );
}

export function getExperiment(slug: string): ExperimentRecord | undefined {
  return getExperiments().find((experiment) => experiment.slug === slug);
}

export function resolveExperimentAsset(
  slug: string,
  source: string,
): string | undefined {
  const normalized = source.replace(/^\.\//, "");
  return assetModules[`/content/experiments/${slug}/${normalized}`];
}

export function formatExperimentDate(date: string, long = false): string {
  return new Intl.DateTimeFormat("en-US", {
    month: long ? "long" : "short",
    day: long ? "numeric" : undefined,
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
