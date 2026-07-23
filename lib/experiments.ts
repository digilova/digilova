import type {
  ExperimentMeta,
  ExperimentModule,
} from "@/content/experiment-types";

const experimentModules = import.meta.glob<ExperimentModule>(
  "/content/experiments/*.mdx",
  { eager: true },
);

function allModules(): ExperimentModule[] {
  return Object.values(experimentModules);
}

export function getExperiments(): ExperimentMeta[] {
  return allModules()
    .map((experiment) => experiment.meta)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
}

export function getExperiment(slug: string): ExperimentModule | undefined {
  return allModules().find((experiment) => experiment.meta.slug === slug);
}

export function formatExperimentDate(date: string, long = false): string {
  return new Intl.DateTimeFormat("en-US", {
    month: long ? "long" : "short",
    day: long ? "numeric" : undefined,
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
