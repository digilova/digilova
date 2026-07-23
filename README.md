# Digilova

Diana Simakhov’s portfolio and experiments site.

## Edit the Work page

Work entries live in `content/work.ts`. Add, remove, or reorder an object in the
`workEntries` array. Each entry supports a company, dates, role, short summary,
external link, and visual treatment.

The initial entries are explicitly draft content. Replace the copy, dates, and
visuals with approved portfolio material before treating them as final.

## Add an experiment

Create a new `.mdx` file in `content/experiments`. Export a `meta` object and
write the article below it. The experiment is discovered automatically and
added to the index.

```mdx
export const meta = {
  title: "Experiment title",
  slug: "experiment-title",
  date: "2026-07-23",
  summary: "One-sentence summary.",
  status: "draft",
  sections: [{ id: "first-section", label: "First section" }]
};

## First section

Write with normal Markdown here.
```

MDX can import the reusable components in `components/experiment` for copied
code blocks, live previews, callouts, and static figures. A post can also import
any local React component when it needs a bespoke interactive demo.

## Local development

```bash
npm run dev
```

## Validation

```bash
npm run build
node --test tests/rendered-html.test.mjs
npx tsc --noEmit
```
