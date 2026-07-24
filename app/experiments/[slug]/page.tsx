import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { ExperimentContent } from "@/components/experiment/ExperimentContent";
import { getExperiment, getExperiments } from "@/lib/experiments";

type ExperimentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getExperiments()
    .filter((experiment) => experiment.detail)
    .map((experiment) => ({ slug: experiment.slug }));
}

export async function generateMetadata({
  params,
}: ExperimentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);

  if (!experiment?.detail) return {};

  return {
    title: experiment.detail.title ?? experiment.post.title,
    description: experiment.detail.summary ?? experiment.post.summary,
    alternates: { canonical: `/experiments/${experiment.slug}` },
  };
}

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = getExperiment(slug);

  if (!experiment?.detail) notFound();

  return (
    <PageContainer className="article-layout">
      <ExperimentContent detail experiment={experiment} />
    </PageContainer>
  );
}
