"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExperiments = pathname.startsWith("/experiments");

  return (
    <div className="site-shell">
      <aside className="site-nav">
        <Link className="brand-mark" href="/" aria-label="Diana Simakhov — Work">
          <img className="brand-ring" src="/ds-ring.svg" alt="" />
          <img className="brand-initials" src="/ds-mark.svg" alt="" />
        </Link>
        <nav className="site-links" aria-label="Primary navigation">
          <Link
            className="site-link"
            href="/"
            data-active={pathname === "/"}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Work
          </Link>
          <Link
            className="site-link"
            href="/experiments"
            data-active={isExperiments}
            aria-current={isExperiments ? "page" : undefined}
          >
            Experiments
          </Link>
          <a
            className="site-link"
            href="mailto:simakhovdiana@gmail.com"
          >
            Contact
          </a>
        </nav>
      </aside>
      <div className="site-main">{children}</div>
    </div>
  );
}
