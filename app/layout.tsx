import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Diana Simakhov — Product Design",
      template: "%s — Diana Simakhov",
    },
    description:
      "Product design leadership, experiments, and small explorations by Diana Simakhov.",
    icons: {
      icon: "/ds-ring.svg",
      shortcut: "/ds-ring.svg",
    },
    openGraph: {
      type: "website",
      title: "Diana Simakhov — Product Design",
      description:
        "Selected work and small experiments in product design, interaction, and AI.",
      url: origin,
      siteName: "Digilova",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1536,
          height: 1024,
          alt: "Diana Simakhov — Product Design and Experiments",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Diana Simakhov — Product Design",
      description:
        "Selected work and small experiments in product design, interaction, and AI.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
