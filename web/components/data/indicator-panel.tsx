"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface IndicatorPanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function IndicatorPanel({
  title,
  children,
  defaultOpen = true,
  className,
}: IndicatorPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-b border-[var(--border)] last:border-b-0", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-[var(--foreground)] text-[var(--muted-foreground)] transition-colors"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}
