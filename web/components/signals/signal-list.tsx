"use client";

import { useState, useMemo } from "react";
import { SignalCard } from "./signal-card";
import { cn } from "@/lib/utils";
import type { SignalWithId } from "@/lib/types";

interface SignalListProps {
  signals: SignalWithId[];
  selectedIndex?: number;
  className?: string;
}

type SortKey = "confidence" | "rr" | "ticker";
type FilterDirection = "all" | "long" | "short";

export function SignalList({ signals, selectedIndex, className }: SignalListProps) {
  const [sortBy, setSortBy] = useState<SortKey>("confidence");
  const [filterDir, setFilterDir] = useState<FilterDirection>("all");

  const filtered = useMemo(() => {
    let result = [...signals];
    if (filterDir !== "all") result = result.filter((s) => s.direction === filterDir);
    result.sort((a, b) => {
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      if (sortBy === "rr") return b.riskRewardRatio - a.riskRewardRatio;
      return a.ticker.localeCompare(b.ticker);
    });
    return result;
  }, [signals, sortBy, filterDir]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter segmented control */}
        <div className="flex items-center rounded-lg bg-[var(--muted)] p-0.5 gap-0.5">
          {(["all", "long", "short"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setFilterDir(dir)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer capitalize",
                filterDir === dir
                  ? dir === "long"
                    ? "bg-[var(--color-bullish)]/15 text-[var(--color-bullish)] shadow-sm"
                    : dir === "short"
                    ? "bg-[var(--color-bearish)]/15 text-[var(--color-bearish)] shadow-sm"
                    : "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {dir}
            </button>
          ))}
        </div>

        {/* Sort segmented control */}
        <div className="flex items-center rounded-lg bg-[var(--muted)] p-0.5 gap-0.5">
          {([
            ["confidence", "Confidence"],
            ["rr",         "R:R"],
            ["ticker",     "A–Z"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer",
                sortBy === key
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-[var(--muted-foreground)] ml-auto font-mono">
          {filtered.length}/{signals.length}
        </span>
      </div>

      {/* Signal cards */}
      <div className="space-y-2">
        {filtered.map((signal, i) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            index={i}
            selected={selectedIndex === i}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-[var(--muted-foreground)] text-sm">
            No signals match this filter
          </div>
        )}
      </div>
    </div>
  );
}
