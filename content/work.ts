export type WorkEntry = {
  company: string;
  dates?: string;
  role: string;
  summary: string;
  href?: string;
  visual: {
    alt: string;
    label: string;
    kicker: string;
    background: string;
    ink: string;
  };
};

// Replace these draft entries with final dates, titles, copy, links, and images.
// The visual object can later be extended with an image path without changing
// the surrounding page structure.
export const workEntries: WorkEntry[] = [
  {
    company: "Current exploration",
    role: "Designing adaptive AI experiences",
    summary:
      "Exploring how AI can remove friction, build trust, and make complex decisions feel more intuitive.",
    visual: {
      alt: "Abstract study representing product foundations",
      label: "Leading product foundations",
      kicker: "Exploration · Draft",
      background:
        "linear-gradient(135deg, #dff3ec 0%, #c7e3dc 52%, #b9d5d4 100%)",
      ink: "#24423b",
    },
  },
  {
    company: "Coinbase",
    role: "Design leadership",
    summary:
      "Leading a design team focused on making the crypto economy more accessible, understandable, and secure.",
    href: "https://www.coinbase.com/",
    visual: {
      alt: "Abstract study representing simpler tax experiences",
      label: "Demystifying taxes",
      kicker: "Coinbase · Draft",
      background:
        "linear-gradient(135deg, #dfe8ff 0%, #c8d6ff 48%, #b9c7f0 100%)",
      ink: "#1f3477",
    },
  },
  {
    company: "Ayco",
    role: "Financial wellness experience design",
    summary:
      "Shaping experiences that help people understand their financial lives and move forward with confidence.",
    href: "https://www.goldmansachs.com/what-we-do/asset-management/ayco",
    visual: {
      alt: "Abstract study representing proactive financial protection",
      label: "From reactive to proactive protection",
      kicker: "Ayco · Draft",
      background:
        "linear-gradient(135deg, #f1eadf 0%, #e5d7c6 50%, #d8c8bc 100%)",
      ink: "#5c4336",
    },
  },
  {
    company: "Marcus by Goldman Sachs",
    role: "Launch and product design",
    summary:
      "Helping launch a consumer financial product designed to make important money decisions feel simpler.",
    href: "https://www.marcus.com/",
    visual: {
      alt: "Abstract study representing a simple path through financial complexity",
      label: "Simple, from day one",
      kicker: "Marcus · Draft",
      background:
        "linear-gradient(135deg, #ece7f7 0%, #d9d0ee 50%, #c9c0df 100%)",
      ink: "#443b62",
    },
  },
];
