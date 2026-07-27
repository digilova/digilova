import type { Metadata } from "next";
import { PageContainer } from "@/components/PageContainer";
import { ExperimentCard } from "@/components/experiment/ExperimentCard";
import { getExperiments } from "@/lib/experiments";

export const metadata: Metadata = {
  title: "Experiments",
  description:
    "Diana Simakhov’s experiments with AI, interaction design, and repeatable UI/UX patterns.",
};

export default function ExperimentsPage() {
  const experiments = getExperiments();

  return (
    <PageContainer>
      <header className="profile-header">
        <h1>Experiments</h1>
        <div className="intro-copy">
          <p>
            Hi, I’m Diana. Excited you’re here. This is where I
            experiment with AI, try UX/UI ideas, and write down what I’ve been
            figuring out.
          </p>
          <p>
            I keep poking around and exploring these ideas, and I want the
            patterns to be repeatable enough to rebuild later — for me, and for
            anyone else who wants to try them.
          </p>
        </div>
      </header>

      <section className="experiments-list" aria-label="Experiment posts">
        {experiments.map((experiment) => (
          <ExperimentCard experiment={experiment} key={experiment.slug} />
        ))}
      </section>
    </PageContainer>
  );
}
