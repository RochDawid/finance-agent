"use client";

import { cn, formatPercent } from "@/lib/utils";
import { RegimeBadge } from "@/components/data/regime-badge";
import type { MarketCondition } from "@finance/types/index.js";

interface MarketOverviewProps {
  marketCondition: MarketCondition;
}

function IndexChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs",
      positive
        ? "border-[var(--color-bullish)]/20 bg-[var(--color-bullish)]/5"
        : "border-[var(--color-bearish)]/20 bg-[var(--color-bearish)]/5",
    )}>
      <span className="text-[var(--muted-foreground)] font-medium">{label}</span>
      <span className={cn(
        "font-mono font-bold",
        positive ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
      )}>
        {formatPercent(value)}
      </span>
    </div>
  );
}

export function MarketOverview({ marketCondition }: MarketOverviewProps) {
  const { regime, sp500Change, nasdaqChange, sentiment, vixLevel } = marketCondition;
  const fg = sentiment.fearGreed;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <IndexChip label="S&P 500" value={sp500Change} />
      <IndexChip label="NASDAQ"  value={nasdaqChange} />

      {vixLevel !== undefined && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs">
          <span className="text-[var(--muted-foreground)] font-medium">VIX</span>
          <span className="font-mono font-bold">{vixLevel.toFixed(1)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs">
        <span className="text-[var(--muted-foreground)] font-medium">Fear &amp; Greed</span>
        <span className="font-mono font-bold">{fg.value}</span>
        <span className="text-[var(--muted-foreground)]">· {fg.classification}</span>
      </div>

      <RegimeBadge regime={regime} />
    </div>
  );
}
