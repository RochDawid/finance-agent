"use client";

import Link from "next/link";
import { X, RefreshCw, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceDisplay } from "@/components/data/price-display";
import { useQuote } from "@/hooks/use-quote";
import { cn } from "@/lib/utils";

interface TickerCardProps {
  ticker: string;
  assetType: "stock" | "crypto";
  onRemove?: () => void;
}

export function TickerCard({ ticker, assetType, onRemove }: TickerCardProps) {
  const { quote, isLoading, refresh } = useQuote(ticker, assetType);
  const positive = quote ? quote.changePercent >= 0 : null;

  return (
    <div className={cn(
      "group relative rounded-xl border bg-[var(--card)] overflow-hidden transition-all duration-200",
      "hover:shadow-md hover:-translate-y-px",
      positive === true  && "border-[var(--color-bullish)]/15 hover:border-[var(--color-bullish)]/35",
      positive === false && "border-[var(--color-bearish)]/15 hover:border-[var(--color-bearish)]/35",
      positive === null  && "border-[var(--border)]",
    )}>
      {/* Top action row — visible on hover */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.preventDefault(); refresh(); }}
          aria-label={`Refresh ${ticker}`}
          className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
        {onRemove && (
          <button
            onClick={(e) => { e.preventDefault(); onRemove(); }}
            aria-label={`Remove ${ticker}`}
            className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <Link
        href={`/analysis/${ticker}`}
        className="block"
        title={`View ${ticker} details`}
      >
        <div className="px-3 pt-3 pb-2.5 hover:bg-[var(--accent)] transition-colors rounded-[inherit]">
          <div className="mb-1.5">
            <span className="font-bold text-sm tracking-tight">{ticker}</span>
          </div>

          {isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ) : quote ? (
            <PriceDisplay
              price={quote.price}
              change={quote.change}
              changePercent={quote.changePercent}
              size="sm"
            />
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">Failed to load</p>
          )}

          {/* "View details" hint */}
          <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-[var(--muted-foreground)]">Details</span>
            <ArrowUpRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
