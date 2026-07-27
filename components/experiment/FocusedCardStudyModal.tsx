"use client";

import Preview from "@/content/experiments/focused-card-viewer/Preview";
import {
  buildFocusedCardLlmPrompt,
  buildFocusedCardMountSnippet,
  buildFocusedCardOptionsSnippet,
  focusedCardGuide,
} from "@/content/experiments/focused-card-viewer/guide";
import { ExperimentModal } from "./ExperimentModal";
import { ExperimentStudyBody } from "./ExperimentStudyBody";
import type { ExperimentStudyModalProps } from "./ExperimentStudyCard";
import { useCopyPrompt } from "./useCopyPrompt";

export function FocusedCardStudyModal({
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
        guide={focusedCardGuide}
        onCopyPrompt={() => {
          void copyPrompt(buildFocusedCardLlmPrompt());
        }}
        preview={<Preview />}
        promptCopied={promptCopied}
        snippets={[
          {
            code: buildFocusedCardMountSnippet(),
            language: "tsx",
          },
          {
            code: buildFocusedCardOptionsSnippet(),
            language: "ts",
          },
        ]}
        title={title}
      />
    </ExperimentModal>
  );
}
