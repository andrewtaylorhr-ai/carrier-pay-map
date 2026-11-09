"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, ClipboardList, FileBarChart, GraduationCap, GripVertical, LayoutDashboard, Map, Route, Send, Truck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { RecruiterManage } from "@/components/carrier-map/RecruiterManage";
import { ReportsMonthNav } from "@/components/reports/ReportsMonthNav";

type NavItem = {
  label: string;
  icon: LucideIcon;
} & ({ href: string; disabled?: false } | { href?: undefined; disabled: true });

// Live pages only. Strategy Builder (the guided recruiter-plan wizard) is
// the home page; Team Overview is the full all-in-one dashboard.
const NAV_ITEMS: NavItem[] = [
  { label: "Strategy Builder", icon: Route, href: "/" },
  { label: "Pay Map", icon: Map, href: "/pay-map" },
  { label: "Team Overview", icon: LayoutDashboard, href: "/overview" },
  { label: "Daily Tracker", icon: ClipboardList, href: "/tracker" },
  { label: "Submissions", icon: Send, href: "/activity" },
  { label: "Reports", icon: FileBarChart, href: "/reports" },
  { label: "Training", icon: GraduationCap, href: "/training" },
  { label: "Controller", icon: UserCheck, href: "/controller" },
  { label: "Agencies", icon: Building2, href: "/agencies" },
];

export function Sidebar() {
  const pathname = usePathname();
  const onDashboard = pathname?.startsWith("/overview") ?? false;
  const onReports = pathname?.startsWith("/reports") ?? false;

  // Menu order is drag-and-drop, saved per browser. Pages added later that
  // aren't in the saved order go at the end.
  const [order, setOrder] = useLocalStorageState<string[]>("cpm_navOrder", []);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const items = [
    ...order.map((l) => NAV_ITEMS.find((n) => n.label === l)).filter((n): n is NavItem => !!n),
    ...NAV_ITEMS.filter((n) => !order.includes(n.label)),
  ];
  const customOrder = items.some((n, i) => n.label !== NAV_ITEMS[i].label);
  const endDrag = () => {
    setDragging(null);
    setDropAt(null);
  };
  const moveItem = (label: string, to: number) => {
    const labels = items.map((n) => n.label);
    const from = labels.indexOf(label);
    labels.splice(from, 1);
    labels.splice(from < to ? to - 1 : to, 0, label);
    setOrder(labels);
  };

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

      <nav className="flex flex-col gap-0.5 px-2.5 py-3 shrink-0" onDragOver={(e) => dragging && e.preventDefault()}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const dropLine =
            dragging && dropAt != null && dragging !== item.label && (dropAt === i || (dropAt === i + 1 && i === items.length - 1))
              ? dropAt === i
                ? "shadow-[inset_0_2px_0_var(--cpm-accent)]"
                : "shadow-[inset_0_-2px_0_var(--cpm-accent)]"
              : "";
          const dragProps = {
            draggable: true,
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", item.label);
              setDragging(item.label);
            },
            onDragOver: (e: React.DragEvent) => {
              if (!dragging) return;
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
            },
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              if (dragging && dropAt != null) moveItem(dragging, dropAt);
              endDrag();
            },
            onDragEnd: endDrag,
          };
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
              {...dragProps}
              title="Drag to move"
              className={`group flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-semibold transition-colors ${dropLine} ${
                dragging === item.label ? "opacity-40" : ""
              } ${
                active
                  ? "bg-[var(--cpm-accent)] text-[#241800]"
                  : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:bg-[var(--cpm-panel)]"
              }`}
            >
              <Icon size={16} strokeWidth={2.25} />
              <span className="flex-1">{item.label}</span>
              <GripVertical size={14} className="opacity-0 group-hover:opacity-60 cursor-grab shrink-0" />
            </Link>
          );
        })}
        {customOrder && (
          <button
            type="button"
            onClick={() => setOrder([])}
            className="self-start mt-1 px-3 text-[11px] text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)] hover:underline"
          >
            Reset menu order
          </button>
        )}
      </nav>

      {/* Recruiters management, merged directly into the sidebar strip
          (rather than a separate boxed panel in the page content) — only
          shown on the Team Overview route, scrollable independently of the nav
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
