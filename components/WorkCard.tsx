import type { WorkEntry } from "@/content/work";

export function WorkCard({ entry }: { entry: WorkEntry }) {
  const visual = (
    <div
      className="work-visual"
      role="img"
      aria-label={entry.visual.alt}
      style={
        {
          "--visual-background": entry.visual.background,
          "--visual-ink": entry.visual.ink,
        } as React.CSSProperties
      }
    >
      <span className="work-visual-label">{entry.visual.label}</span>
      <span className="work-visual-kicker">{entry.visual.kicker}</span>
    </div>
  );

  return (
    <article className="work-card">
      {entry.href ? (
        <a href={entry.href} target="_blank" rel="noreferrer">
          {visual}
        </a>
      ) : (
        visual
      )}
      <div className="work-meta">
        {entry.dates && <p>{entry.dates}</p>}
        <p className="work-role">{entry.role}</p>
        <p className="work-summary">{entry.summary}</p>
        {entry.href && (
          <a
            className="work-company"
            href={entry.href}
            target="_blank"
            rel="noreferrer"
          >
            {entry.company} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
