"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist",  icon: List            },
  { href: "/history",   label: "History",    icon: Clock           },
  { href: "/settings",  label: "Settings",   icon: Settings        },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-lg md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[10px] font-semibold touch-manipulation transition-all duration-150",
                isActive
                  ? "text-[var(--color-brand)] bg-[var(--color-brand)]/8"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform duration-150", isActive && "scale-110")} />
              <span className="tracking-wide uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
