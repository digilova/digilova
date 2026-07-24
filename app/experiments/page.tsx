import type { Metadata } from "next";
import { PageContainer } from "@/components/PageContainer";
import { ExperimentCard } from "@/components/experiment/ExperimentCard";
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
      <header className="profile-header">
        <h1>Experiments</h1>
        <p>
          Interactive studies in product design, spatial interfaces, and AI.
        </p>
      </header>

      <section className="experiments-list" aria-label="Experiment posts">
        {experiments.map((experiment) => (
          <ExperimentCard experiment={experiment} key={experiment.slug} />
        ))}
      </section>
    </PageContainer>
  );
}
