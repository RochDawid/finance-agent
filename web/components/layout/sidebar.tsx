"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/watchlist", label: "Watchlist",  icon: List,            shortcut: "W" },
  { href: "/history",   label: "History",    icon: Clock,           shortcut: "H" },
  { href: "/settings",  label: "Settings",   icon: Settings,        shortcut: "," },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-200 ease-out",
        collapsed ? "w-14" : "w-52",
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center h-14 border-b border-[var(--border)]",
        collapsed ? "justify-center px-0" : "px-4 gap-2.5",
      )}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-brand)] shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
              Finance<span className="text-[var(--color-brand)]">AI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-brand)]" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[var(--color-brand)]" : "")} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  <kbd className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                    isActive
                      ? "text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20"
                      : "text-[var(--muted-foreground)] bg-[var(--muted)] border-[var(--border)]"
                  )}>
                    {item.shortcut}
                  </kbd>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[var(--border)]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full h-8 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}
