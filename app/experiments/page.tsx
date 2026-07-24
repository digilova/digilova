import type { Metadata } from "next";
import { PageContainer } from "@/components/PageContainer";
import { ExperimentContent } from "@/components/experiment/ExperimentContent";
import { getExperiments } from "@/lib/experiments";

export const metadata: Metadata = {
  title: "Experiments",
  description:
    "Small experiments in AI, interaction design, motion, and product craft.",
};

export default function ExperimentsPage() {
  const experiments = getExperiments();

  return (
    <PageContainer>
      <header className="page-heading">
        <p className="eyebrow">Small explorations</p>
        <h1>Experiments</h1>
        <p>
          Notes, prototypes, and small tests in interaction design and AI.
        </p>
      </header>

      <section className="experiments-list" aria-label="Experiment posts">
        {experiments.map((experiment) => (
          <ExperimentContent experiment={experiment} key={experiment.slug} />
        ))}
      </section>
      <p className="footer-note">
        New posts created in the local Content Studio appear here
        automatically.
      </p>
    </PageContainer>
  );
}
