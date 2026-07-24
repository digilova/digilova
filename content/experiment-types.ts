import type { ComponentType } from "react";

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  caption?: string;
};

export type CodeBlock = {
  id: string;
  type: "code";
  language: string;
  code: string;
};

export type CalloutBlock = {
  id: string;
  type: "callout";
  content: string;
};

export type DividerBlock = {
  id: string;
  type: "divider";
};

export type ExperimentBlock =
  | TextBlock
  | ImageBlock
  | CodeBlock
  | CalloutBlock
  | DividerBlock;

export type ExperimentPost = {
  title: string;
  date: string;
  summary: string;
  tags?: string[];
  blocks: ExperimentBlock[];
};

export type ExperimentDetail = {
  title?: string;
  summary?: string;
  blocks: ExperimentBlock[];
};

export type ExperimentRecord = {
  slug: string;
  post: ExperimentPost;
  detail?: ExperimentDetail;
  Preview?: ComponentType;
  previewSource?: string;
};
