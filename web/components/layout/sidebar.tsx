"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/watchlist", label: "Watchlist", icon: List, shortcut: "W" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <BarChart3 className="h-5 w-5 shrink-0 text-[var(--color-bullish)]" />
          {!collapsed && (
            <span className="font-semibold text-sm truncate">Finance Agent</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.shortcut && (
                <kbd className="ml-auto text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8 rounded-lg"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
