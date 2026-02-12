"use client";

import { useState, useMemo } from "react";
import { SignalCard } from "./signal-card";
import { Button } from "@/components/ui/button";
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
    if (filterDir !== "all") {
      result = result.filter((s) => s.direction === filterDir);
    }
    result.sort((a, b) => {
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      if (sortBy === "rr") return b.riskRewardRatio - a.riskRewardRatio;
      return a.ticker.localeCompare(b.ticker);
    });
    return result;
  }, [signals, sortBy, filterDir]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--muted-foreground)]">Filter:</span>
          {(["all", "long", "short"] as const).map((dir) => (
            <Button
              key={dir}
              variant={filterDir === dir ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setFilterDir(dir)}
            >
              {dir}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--muted-foreground)]">Sort:</span>
          {([
            ["confidence", "Conf"],
            ["rr", "R:R"],
            ["ticker", "A-Z"],
          ] as const).map(([key, label]) => (
            <Button
              key={key}
              variant={sortBy === key ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setSortBy(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

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
          <div className="rounded-lg border border-dashed border-[var(--border)] py-8 text-center text-[var(--muted-foreground)] text-sm">
            No signals match the current filter
          </div>
        )}
      </div>
    </div>
  );
}
