"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExperiments = pathname.startsWith("/experiments");
  const isWork = pathname === "/work" || pathname.startsWith("/work/");

  return (
    <div className="site-shell">
      <aside className="site-nav">
        <Link
          className="brand-mark"
          href="/experiments"
          aria-label="Diana Simakhov — Experiments"
        >
          <img className="brand-ring" src="/ds-ring.svg" alt="" />
          <img className="brand-initials" src="/ds-mark.svg" alt="" />
        </Link>
        <nav className="site-links" aria-label="Primary navigation">
          <Link
            className="site-link"
            href="/experiments"
            data-active={isExperiments}
            aria-current={isExperiments ? "page" : undefined}
          >
            Experiments
          </Link>
          <Link
            className="site-link site-link-locked"
            href="/work"
            data-active={isWork}
            aria-current={isWork ? "page" : undefined}
          >
            Work
            <span className="site-link-lock" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <span className="sr-only"> (password protected)</span>
          </Link>
          <a
            className="site-link"
            href="https://www.linkedin.com/in/dianasimakhov"
            rel="noopener noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="site-link"
            href="mailto:simakhovdiana@gmail.com"
          >
            Email
          </a>
        </nav>
      </aside>
      <div className="site-main">{children}</div>
    </div>
  );
}
