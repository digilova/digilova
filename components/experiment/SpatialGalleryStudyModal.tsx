"use client";

import Preview from "@/content/experiments/ask-unk-spatial-gallery/Preview";
import {
  buildSpatialGalleryLayoutSnippet,
  buildSpatialGalleryLlmPrompt,
  buildSpatialGalleryMountSnippet,
  spatialGalleryGuide,
} from "@/content/experiments/ask-unk-spatial-gallery/guide";
import { ExperimentModal } from "./ExperimentModal";
import { ExperimentStudyBody } from "./ExperimentStudyBody";
import type { ExperimentStudyModalProps } from "./ExperimentStudyCard";
import { useCopyPrompt } from "./useCopyPrompt";

export function SpatialGalleryStudyModal({
  open,
  onClose,
  onExitComplete,
  title,
  date,
}: ExperimentStudyModalProps) {
  const { promptCopied, copyPrompt } = useCopyPrompt();

  return (
    <ExperimentModal
      onClose={onClose}
      onExitComplete={onExitComplete}
      open={open}
      title={title}
    >
      <ExperimentStudyBody
        date={date}
        guide={spatialGalleryGuide}
        onCopyPrompt={() => {
          void copyPrompt(buildSpatialGalleryLlmPrompt());
        }}
        preview={<Preview />}
        promptCopied={promptCopied}
        snippets={[
          {
            code: buildSpatialGalleryMountSnippet(),
            language: "tsx",
          },
          {
            code: buildSpatialGalleryLayoutSnippet(),
            language: "ts",
          },
        ]}
        title={title}
      />
    </ExperimentModal>
  );
}
