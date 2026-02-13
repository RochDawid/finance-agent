"use client";

import { cn, formatPercent } from "@/lib/utils";
import { RegimeBadge } from "@/components/data/regime-badge";
import type { MarketCondition } from "@finance/types/index.js";

interface MarketOverviewProps {
  marketCondition: MarketCondition;
}

function ChangeChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span
        className={cn(
          "text-xs font-mono font-medium",
          positive ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
        )}
      >
        {formatPercent(value)}
      </span>
    </div>
  );
}

export function MarketOverview({ marketCondition }: MarketOverviewProps) {
  const { regime, sp500Change, nasdaqChange, sentiment, vixLevel } = marketCondition;
  const fg = sentiment.fearGreed;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm">
      <ChangeChip label="S&P 500" value={sp500Change} />
      <span className="text-[var(--border)] select-none">·</span>
      <ChangeChip label="NASDAQ" value={nasdaqChange} />
      {vixLevel !== undefined && (
        <>
          <span className="text-[var(--border)] select-none">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--muted-foreground)]">VIX</span>
            <span className="text-xs font-mono font-medium">{vixLevel.toFixed(1)}</span>
          </div>
        </>
      )}
      <span className="text-[var(--border)] select-none">·</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--muted-foreground)]">Fear &amp; Greed</span>
        <span className="text-xs font-mono font-medium">{fg.value}</span>
        <span className="text-xs text-[var(--muted-foreground)]">({fg.classification})</span>
      </div>
      <span className="text-[var(--border)] select-none hidden sm:inline">·</span>
      <RegimeBadge regime={regime} />
    </div>
  );
}
