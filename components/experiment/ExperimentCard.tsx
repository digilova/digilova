"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import type { ExperimentRecord } from "@/content/experiment-types";
import {
  formatExperimentDate,
  resolveExperimentAsset,
} from "@/lib/experiments";
import {
  ExperimentStudyCard,
  type ExperimentStudyModalProps,
} from "./ExperimentStudyCard";
import { FocusedCardStudyModal } from "./FocusedCardStudyModal";
import { RippleStudyModal } from "./RippleStudyModal";
import { SpatialGalleryStudyModal } from "./SpatialGalleryStudyModal";

const studyModals: Record<string, ComponentType<ExperimentStudyModalProps>> = {
  "image-ripple": RippleStudyModal,
  "focused-card-viewer": FocusedCardStudyModal,
  "ask-unk-spatial-gallery": SpatialGalleryStudyModal,
};

export function ExperimentCard({
  experiment,
}: {
  experiment: ExperimentRecord;
}) {
  const { post, slug, Preview } = experiment;
  const StudyModal = studyModals[slug];

  if (StudyModal && Preview) {
    return (
      <ExperimentStudyCard
        Preview={Preview}
        StudyModal={StudyModal}
        date={post.date}
        summary={post.summary}
        title={post.title}
      />
    );
  }

  const cover = post.cover
    ? resolveExperimentAsset(slug, post.cover)
    : undefined;
  const mode = cover ? "image" : Preview ? "preview" : "placeholder";

  const visual = Preview ? (
    <Preview className="experiment-preview" />
  ) : (
    <div
      className="work-visual experiment-visual"
      data-mode={mode}
      role={mode === "placeholder" ? "img" : undefined}
      aria-label={
        mode === "placeholder"
          ? `Visual placeholder for ${post.title}`
          : undefined
      }
      style={
        {
          "--visual-background":
            "linear-gradient(135deg, #edf2f0 0%, #dce9e5 52%, #d3e0df 100%)",
          "--visual-ink": "#314740",
        } as React.CSSProperties
      }
    >
      {cover ? (
        <img className="experiment-cover" src={cover} alt="" />
      ) : (
        <>
          <span className="work-visual-label">{post.title}</span>
          <span className="work-visual-kicker">Experiment</span>
        </>
      )}
    </div>
  );

  return (
    <article className="work-card experiment-card">
      {visual}
      <div className="work-meta">
        <p className="experiment-card-date">
          {formatExperimentDate(post.date, true)}
        </p>
        <p className="work-role">{post.title}</p>
        <p className="work-summary">{post.summary}</p>
        {experiment.detail && (
          <Link className="work-company" href={`/experiments/${slug}`}>
            Read full case study <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
