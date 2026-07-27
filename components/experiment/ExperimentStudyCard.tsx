"use client";

import { useCallback, useState, type ComponentType } from "react";
import { formatExperimentDate } from "@/lib/experiments";
import styles from "./ExperimentStudyCard.module.css";

export type ExperimentStudyModalProps = {
  open: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  title: string;
  date: string;
};

export function ExperimentStudyCard({
  title,
  summary,
  date,
  Preview,
  StudyModal,
}: {
  title: string;
  summary: string;
  date: string;
  Preview: ComponentType<{ className?: string }>;
  StudyModal: ComponentType<ExperimentStudyModalProps>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [studyKey, setStudyKey] = useState(0);

  const openStudy = useCallback(() => {
    setStudyKey((current) => current + 1);
    setMounted(true);
    setOpen(true);
  }, []);

  const closeStudy = useCallback(() => {
    setOpen(false);
  }, []);

  const handleExitComplete = useCallback(() => {
    setMounted(false);
  }, []);

  return (
    <>
      <article
        className={`work-card experiment-card ${styles.card}`}
        data-opening={open ? "true" : undefined}
      >
        <div className={styles.surface}>
          <div className={styles.previewHit}>
            <Preview className="experiment-preview" />
          </div>
          <div
            className={`work-meta ${styles.meta}`}
            onClick={openStudy}
          >
            <p className="experiment-card-date">
              {formatExperimentDate(date, true)}
            </p>
            <p className="work-role">{title}</p>
            <p className="work-summary">{summary}</p>
            <button
              className={`work-company ${styles.openHint}`}
              onClick={(event) => {
                event.stopPropagation();
                openStudy();
              }}
              type="button"
            >
              Open study <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </article>

      {mounted ? (
        <StudyModal
          date={date}
          key={studyKey}
          onClose={closeStudy}
          onExitComplete={handleExitComplete}
          open={open}
          title={title}
        />
      ) : null}
    </>
  );
}
