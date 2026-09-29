"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileBarChart, LayoutDashboard, Send, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
} & ({ href: string; disabled?: false } | { href?: undefined; disabled: true });

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Recruiters", icon: Users, disabled: true },
  { label: "Carriers", icon: Building2, disabled: true },
  { label: "Submissions", icon: Send, href: "/activity" },
  { label: "Reports", icon: FileBarChart, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 min-h-screen border-r border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] flex flex-col">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-[var(--cpm-border)]">
        <div className="rounded-lg bg-[var(--cpm-accent)] p-1.5 text-[#241800] shrink-0">
          <Truck size={18} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold tracking-wide text-[var(--cpm-text)] leading-tight">
            CLASS A RECRUITING
          </div>
          <div className="text-[9.5px] font-medium tracking-wider text-[var(--cpm-text-faint)] uppercase leading-tight">
            Drive talent. Build tomorrow.
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <span
                key={item.label}
                title="Coming soon"
                className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium text-[var(--cpm-text-faint)] opacity-60 cursor-default select-none"
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </span>
            );
          }
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-[var(--cpm-accent)] text-[#241800]"
                  : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:bg-[var(--cpm-panel)]"
              }`}
            >
              <Icon size={16} strokeWidth={2.25} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
