import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getExperiments } from "@/lib/experiments";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return [
    { url: origin, changeFrequency: "monthly", priority: 1 },
    {
      url: `${origin}/experiments`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...getExperiments()
      .filter((experiment) => experiment.detail)
      .map((experiment) => ({
        url: `${origin}/experiments/${experiment.slug}`,
        lastModified: new Date(experiment.post.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}
