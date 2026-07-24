import type { Metadata } from "next";
import Link from "next/link";
import { formatExperimentDate, getExperiments } from "@/lib/experiments";

export const metadata: Metadata = {
  title: "Experiments",
  description:
    "Small experiments in AI, interaction design, motion, and product craft.",
};

export default function ExperimentsPage() {
  const experiments = getExperiments();

  return (
    <main className="content-column">
      <header className="page-heading">
        <p className="eyebrow">Small explorations</p>
        <h1>Experiments</h1>
        <p>
          Notes, prototypes, and small tests in interaction design and AI.
        </p>
      </header>

      <section className="experiments-list" aria-label="Experiment posts">
        {experiments.map((experiment) => (
          <Link
            className="experiment-row"
            key={experiment.slug}
            href={`/experiments/${experiment.slug}`}
          >
            <div>
              <div className="row-labels">
                {experiment.status === "draft" && (
                  <span className="draft-label">Sample draft</span>
                )}
              </div>
              <h2>{experiment.title}</h2>
              <p>{experiment.summary}</p>
            </div>
            <time dateTime={experiment.date}>
              {formatExperimentDate(experiment.date)}
            </time>
          </Link>
        ))}
      </section>
      <p className="footer-note">
        Add a new MDX file to the experiments folder and it appears here
        automatically.
      </p>
    </main>
  );
}
