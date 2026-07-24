import type { ComponentType } from "react";

export type ExperimentSection = {
  id: string;
  label: string;
};

export type ExperimentMeta = {
  title: string;
  slug: string;
  date: string;
  summary: string;
  status: "draft" | "published";
  hasDetail?: boolean;
  cover?: string;
  tags?: string[];
  sections?: ExperimentSection[];
};

export type ExperimentModule = {
  default: ComponentType;
  meta: ExperimentMeta;
};
