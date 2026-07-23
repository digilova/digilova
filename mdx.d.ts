declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { ExperimentMeta } from "@/content/experiment-types";

  export const meta: ExperimentMeta;
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
