import Link from "next/link";
import type {
  ExperimentBlock,
  ExperimentRecord,
} from "@/content/experiment-types";
import {
  formatExperimentDate,
  resolveExperimentAsset,
} from "@/lib/experiments";
import { CodeBlock } from "./CodeBlock";
import { Callout, CodePreview, Figure } from "./ExperimentPrimitives";

function TextContent({ content }: { content: string }) {
  return content.split(/\n{2,}/).map((paragraph, index) => {
    const lines = paragraph.split("\n");
    const isList = lines.every((line) => line.trim().startsWith("- "));

    if (isList) {
      return (
        <ul key={index}>
          {lines.map((line) => (
            <li key={line}>{line.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }

    return <p key={index}>{paragraph}</p>;
  });
}

function Blocks({
  blocks,
  slug,
}: {
  blocks: ExperimentBlock[];
  slug: string;
}) {
  return blocks.map((block) => {
    if (block.type === "text") {
      return <TextContent content={block.content} key={block.id} />;
    }
    if (block.type === "callout") {
      return (
        <Callout key={block.id}>
          <p>{block.content}</p>
        </Callout>
      );
    }
    if (block.type === "code") {
      return (
        <CodeBlock
          code={block.code}
          key={block.id}
          language={block.language}
        />
      );
    }
    if (block.type === "divider") {
      return <hr key={block.id} />;
    }

    const source = resolveExperimentAsset(slug, block.src);
    if (!source) {
      throw new Error(`Missing image for ${slug}: ${block.src}`);
    }
    return (
      <Figure
        alt={block.alt}
        caption={block.caption}
        key={block.id}
        src={source}
      />
    );
  });
}

export function ExperimentContent({
  experiment,
  detail = false,
}: {
  experiment: ExperimentRecord;
  detail?: boolean;
}) {
  const { post, slug, Preview, previewSource } = experiment;
  const content = detail ? experiment.detail : undefined;
  const blocks = content?.blocks ?? post.blocks;

  return (
    <article className={detail ? "article experiment-post" : "experiment-post"}>
      <header className="experiment-post-header">
        <div>
          <h2>{content?.title ?? post.title}</h2>
          <p>{content?.summary ?? post.summary}</p>
        </div>
        <time dateTime={post.date}>{formatExperimentDate(post.date)}</time>
      </header>

      <div className="article-body experiment-post-body">
        <Blocks blocks={blocks} slug={slug} />
        {!detail && Preview && previewSource && (
          <CodePreview code={previewSource} language="tsx">
            <Preview />
          </CodePreview>
        )}
      </div>

      {!detail && experiment.detail && (
        <Link className="experiment-detail-link" href={`/experiments/${slug}`}>
          Read full case study <span aria-hidden="true">→</span>
        </Link>
      )}
    </article>
  );
}
