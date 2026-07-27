"use client";

import type { ReactNode } from "react";
import { formatExperimentDate } from "@/lib/experiments";
import { CodeBlock } from "./CodeBlock";
import styles from "./ExperimentStudyBody.module.css";

export type ExperimentStudyGuide = {
  tags: string[];
  whatYouSee: string[];
  howToBuild: string[];
  sectionTitles: {
    howToBuild: string;
  };
};

export function ExperimentStudyBody({
  title,
  date,
  guide,
  preview,
  snippets,
  onCopyPrompt,
  promptCopied = false,
  fillViewport = false,
}: {
  title: string;
  date: string;
  guide: ExperimentStudyGuide;
  preview: ReactNode;
  snippets?: { code: string; language?: string }[];
  onCopyPrompt?: () => void;
  promptCopied?: boolean;
  /** Stretch the study canvas to the modal's visible body height. */
  fillViewport?: boolean;
}) {
  const showCopyPrompt = typeof onCopyPrompt === "function";
  const showSnippets = Boolean(snippets && snippets.length > 0);
  const showGuide =
    guide.howToBuild.length > 0 || showSnippets;

  return (
    <>
      <div
        className={[styles.hero, fillViewport ? styles.heroFill : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.canvas}>{preview}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.date}>{formatExperimentDate(date, true)}</p>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.summary}>
            {guide.whatYouSee.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {guide.tags.length > 0 || showCopyPrompt ? (
            <div className={styles.metaRow}>
              {guide.tags.length > 0 ? (
                <ul className={styles.tags}>
                  {guide.tags.map((tag) => (
                    <li className={styles.tag} key={tag}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              {showCopyPrompt ? (
                <button
                  aria-label="Copy LLM build prompt"
                  className={styles.copyPrompt}
                  onClick={onCopyPrompt}
                  type="button"
                >
                  {promptCopied ? "Copied" : "Copy prompt"}
                  <svg
                    aria-hidden="true"
                    className={styles.copyIcon}
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 16 16"
                  >
                    <rect height="9.5" rx="1.5" width="9.5" x="4.75" y="1.75" />
                    <path d="M2.75 5.25v7a1.5 1.5 0 0 0 1.5 1.5h7" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {showGuide ? (
          <div className={styles.guide}>
            {guide.howToBuild.length > 0 ? (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {guide.sectionTitles.howToBuild}
                </h3>
                <ul className={styles.steps}>
                  {guide.howToBuild.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {showSnippets ? (
              <section className={styles.section} aria-label="Code snippets">
                <div className={styles.snippets}>
                  {snippets!.map((snippet, index) => (
                    <CodeBlock
                      code={snippet.code}
                      key={`${snippet.language ?? "tsx"}-${index}`}
                      language={snippet.language ?? "tsx"}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
