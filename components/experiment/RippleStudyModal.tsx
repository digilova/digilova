"use client";

import { useCallback, useState } from "react";
import Preview, {
  type RippleSettings,
} from "@/content/experiments/image-ripple/Preview";
import {
  buildRippleLlmPrompt,
  buildRippleSettingsSnippet,
  buildRippleUniformsSnippet,
  rippleGuide,
} from "@/content/experiments/image-ripple/guide";
import { ExperimentModal } from "./ExperimentModal";
import { ExperimentStudyBody } from "./ExperimentStudyBody";
import type { ExperimentStudyModalProps } from "./ExperimentStudyCard";
import { useCopyPrompt } from "./useCopyPrompt";

const defaultSettings: RippleSettings = {
  rippleCount: 3,
  speed: 1,
  bandWidth: 1.35,
  loop: true,
  cursorFollow: false,
};

export function RippleStudyModal({
  open,
  onClose,
  onExitComplete,
  title,
  date,
}: ExperimentStudyModalProps) {
  const [settings, setSettings] = useState<RippleSettings>(defaultSettings);
  const { promptCopied, copyPrompt } = useCopyPrompt();
  const onSettingsChange = useCallback((next: RippleSettings) => {
    setSettings(next);
  }, []);

  return (
    <ExperimentModal
      onClose={onClose}
      onExitComplete={onExitComplete}
      open={open}
      title={title}
    >
      <ExperimentStudyBody
        date={date}
        guide={rippleGuide}
        onCopyPrompt={() => {
          void copyPrompt(buildRippleLlmPrompt(settings));
        }}
        preview={<Preview onSettingsChange={onSettingsChange} />}
        promptCopied={promptCopied}
        snippets={[
          {
            code: buildRippleSettingsSnippet(settings),
            language: "ts",
          },
          {
            code: buildRippleUniformsSnippet(settings),
            language: "js",
          },
        ]}
        title={title}
      />
    </ExperimentModal>
  );
}
