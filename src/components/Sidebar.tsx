"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileBarChart, LayoutDashboard, Map, Send, Settings, StickyNote, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RecruiterManage } from "@/components/carrier-map/RecruiterManage";
import { ReportsMonthNav } from "@/components/reports/ReportsMonthNav";

type NavItem = {
  label: string;
  icon: LucideIcon;
} & ({ href: string; disabled?: false } | { href?: undefined; disabled: true });

// Full item set matches the reference mockup's sidebar. Only Dashboard,
// Submissions, and Reports are live routes — State Assignment, Goals &
// Notes, and Settings don't back any real feature (state assignment lives
// inline in Dashboard's map, goals/notes live inline in the Strategy Plan
// panel, and there's no settings/auth model in this solo-user tool), so
// they render as disabled "coming soon" items, same convention as
// Recruiters/Carriers below.
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Recruiters", icon: Users, disabled: true },
  { label: "State Assignment", icon: Map, disabled: true },
  { label: "Carriers", icon: Building2, disabled: true },
  { label: "Submissions", icon: Send, href: "/activity" },
  { label: "Goals & Notes", icon: StickyNote, disabled: true },
  { label: "Reports", icon: FileBarChart, href: "/reports" },
  { label: "Settings", icon: Settings, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const onDashboard = pathname === "/";
  const onReports = pathname?.startsWith("/reports") ?? false;

  return (
    <aside className="w-[280px] shrink-0 sticky top-0 h-screen border-r border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-[var(--cpm-border)] shrink-0">
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

      <nav className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0">
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

      {/* Recruiters management, merged directly into the sidebar strip
          (rather than a separate boxed panel in the page content) — only
          shown on the Dashboard route, scrollable independently of the nav
          above it so a long recruiter list doesn't push the nav off-screen. */}
      {onDashboard && (
        <div className="flex-1 overflow-y-auto px-2.5 pb-4 pt-3 border-t border-[var(--cpm-border)]">
          <RecruiterManage />
        </div>
      )}

      {/* Same slot as RecruiterManage above, shown on /reports instead —
          the two routes never overlap so there's no conflict over this
          space. See ReportsMonthNav.tsx for why this replaced the old
          in-card pill row. */}
      {onReports && (
        <div className="flex-1 overflow-y-auto px-2.5 pb-4 pt-3 border-t border-[var(--cpm-border)]">
          <ReportsMonthNav />
        </div>
      )}
    </aside>
  );
}
