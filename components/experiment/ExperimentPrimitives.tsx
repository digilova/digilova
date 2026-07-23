import { CodeBlock } from "./CodeBlock";

export function Preview({
  children,
  label = "Live preview",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="preview-panel" aria-label={label}>
      <span className="preview-label">{label}</span>
      {children}
    </section>
  );
}

export function CodePreview({
  code,
  language = "tsx",
  children,
}: {
  code: string;
  language?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="code-preview-grid" aria-label="Code and live preview">
      <CodeBlock code={code} language={language} />
      <div className="preview-panel">
        <span className="preview-label">Live preview</span>
        {children}
      </div>
    </section>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <aside className="callout">{children}</aside>;
}

export function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="content-figure">
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function PrototypeBoard({
  caption,
}: {
  caption?: string;
}) {
  return (
    <figure>
      <div
        className="static-frame"
        role="img"
        aria-label="A static prototype board showing interface cards and layout studies"
      >
        <span className="preview-label">Static visual</span>
        <div className="prototype-board">
          <div className="prototype-card tall">
            <div className="prototype-accent" />
            <div className="prototype-line" />
            <div className="prototype-line short" />
            <div className="prototype-line" />
          </div>
          <div className="prototype-card">
            <div className="prototype-line short" />
            <div className="prototype-line" />
            <div className="prototype-line" />
          </div>
          <div className="prototype-card">
            <div className="prototype-line" />
            <div className="prototype-line short" />
          </div>
        </div>
      </div>
      {caption && <figcaption className="static-caption">{caption}</figcaption>}
    </figure>
  );
}
