import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import {
  formatExperimentDate,
  getExperiment,
  getExperiments,
} from "@/lib/experiments";

type ExperimentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getExperiments()
    .filter((experiment) => experiment.hasDetail)
    .map((experiment) => ({ slug: experiment.slug }));
}

export async function generateMetadata({
  params,
}: ExperimentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);

  if (!experiment?.meta.hasDetail) return {};

  return {
    title: experiment.meta.title,
    description: experiment.meta.summary,
    alternates: { canonical: `/experiments/${experiment.meta.slug}` },
  };
}

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = getExperiment(slug);

  if (!experiment?.meta.hasDetail) notFound();

  const Body = experiment.default;
  const { meta } = experiment;

  return (
    <PageContainer className="article-layout">
      {meta.sections && meta.sections.length > 0 && (
        <aside className="article-toc" aria-label="On this page">
          <h2>{meta.title}</h2>
          <nav>
            {meta.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>
        </aside>
      )}
      <article className="article">
        <header className="article-header">
          <span className="article-kicker">
            {meta.status === "draft" ? "Sample draft" : "Experiment"}
          </span>
          <h1>{meta.title}</h1>
          <time dateTime={meta.date}>
            {formatExperimentDate(meta.date, true)}
          </time>
          <p className="article-summary">{meta.summary}</p>
        </header>
        <div className="article-body">
          <Body />
        </div>
        <footer className="footer-note">
          This sample is a starting point for your own experiment. Replace the
          copy, code, and preview while keeping the article structure.
        </footer>
      </article>
    </PageContainer>
  );
}
