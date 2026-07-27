import type { Metadata } from "next";
import { PageContainer } from "@/components/PageContainer";
import { WorkCard } from "@/components/WorkCard";
import { WorkGate } from "@/components/WorkGate";
import { workEntries } from "@/content/work";
import { isWorkUnlocked } from "@/lib/work-auth";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A concise view of Diana Simakhov’s product design leadership across financial services, crypto, and emerging AI experiences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkPage() {
  const unlocked = await isWorkUnlocked();

  if (!unlocked) {
    return (
      <PageContainer>
        <WorkGate />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className="profile-header">
        <h1>Diana Simakhov</h1>
        <p>Designer based in Palm Beach, Florida</p>
      </header>

      <section className="intro-copy" aria-label="Introduction">
        <p>
          For 15+ years, I&apos;ve led design for products that help people
          navigate important decisions with more trust and less friction. From
          launching Marcus by Goldman Sachs and shaping financial wellness
          experiences at Ayco, to leading a design team at Coinbase making the
          crypto economy more accessible and secure, my work has always been
          about making the difficult feel simple.
        </p>
        <p>
          Now, I&apos;m exploring opportunities to leverage AI to design
          experiences that are adaptive, intuitive, and empowering—removing
          friction, building trust, and creating moments that resonate.
        </p>
      </section>

      <section className="work-list" aria-label="Selected work">
        {workEntries.map((entry) => (
          <WorkCard key={entry.company} entry={entry} />
        ))}
      </section>
    </PageContainer>
  );
}
