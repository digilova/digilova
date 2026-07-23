import type { Metadata } from "next";
import { headers } from "next/headers";
import { Barlow, IBM_Plex_Mono } from "next/font/google";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

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
      <body className={`${barlow.variable} ${mono.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
