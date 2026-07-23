import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <h1>That experiment isn&apos;t here.</h1>
        <p>It may still be in the lab.</p>
        <Link href="/experiments">Return to experiments</Link>
      </div>
    </main>
  );
}
