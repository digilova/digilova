import Link from "next/link";
import type { ExperimentRecord } from "@/content/experiment-types";
import {
  formatExperimentDate,
  resolveExperimentAsset,
} from "@/lib/experiments";

export function ExperimentCard({
  experiment,
}: {
  experiment: ExperimentRecord;
}) {
  const { post, slug, Preview } = experiment;
  const cover = post.cover
    ? resolveExperimentAsset(slug, post.cover)
    : undefined;
  const mode = cover ? "image" : Preview ? "preview" : "placeholder";

  const visual = (
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
      ) : Preview ? (
        <Preview />
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
