"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Pay Map" },
  { href: "/activity", label: "Carrier Activity" },
  { href: "/recruiter-review", label: "Recruiter Review" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="w-full border-b border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)]">
      <div className="mx-auto w-full max-w-[1400px] px-6 flex items-center gap-1 h-11">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href) ?? false;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3.5 h-8 inline-flex items-center rounded-md text-[12.5px] font-semibold transition-colors ${
                active
                  ? "bg-[var(--cpm-accent)] text-[#241800]"
                  : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
