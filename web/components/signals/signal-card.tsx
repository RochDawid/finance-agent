"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ConfidenceMeter } from "@/components/data/confidence-meter";
import { cn, formatPrice } from "@/lib/utils";
import type { SignalWithId } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SignalCardProps {
  signal: SignalWithId;
  index?: number;
  selected?: boolean;
  className?: string;
}

export function SignalCard({ signal, index, selected, className }: SignalCardProps) {
  const router = useRouter();
  const isLong = signal.direction === "long";

  return (
    <div
      onClick={() => router.push(`/signals/${signal.id}`)}
      className={cn(
        "group relative flex cursor-pointer rounded-xl border bg-[var(--card)] overflow-hidden",
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-px",
        isLong
          ? "border-[var(--color-bullish)]/20 hover:border-[var(--color-bullish)]/50 hover:shadow-[var(--color-bullish)]/8"
          : "border-[var(--color-bearish)]/20 hover:border-[var(--color-bearish)]/50 hover:shadow-[var(--color-bearish)]/8",
        selected && (isLong ? "border-[var(--color-bullish)]/60" : "border-[var(--color-bearish)]/60"),
        className,
      )}
    >
      {/* Direction accent stripe */}
      <div className={cn(
        "w-1 shrink-0",
        isLong ? "bg-[var(--color-bullish)]" : "bg-[var(--color-bearish)]",
      )} />

      <div className="flex-1 p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {index !== undefined && (
              <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-3.5 shrink-0">{index + 1}</span>
            )}
            <Link
              href={`/details/${signal.ticker}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-base tracking-tight hover:text-[var(--color-brand)] transition-colors"
            >
              {signal.ticker}
            </Link>

            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest",
              isLong
                ? "bg-[var(--color-bullish)]/12 text-[var(--color-bullish)]"
                : "bg-[var(--color-bearish)]/12 text-[var(--color-bearish)]",
            )}>
              {isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {signal.direction}
            </div>

            <Badge variant="secondary" className="text-[9px] font-medium uppercase tracking-wide py-0">
              {signal.assetType}
            </Badge>
          </div>

          {/* Entry price */}
          <div className="text-right shrink-0">
            <div className="font-mono font-bold text-base">${formatPrice(signal.entryPrice)}</div>
            <div className="text-[10px] text-[var(--muted-foreground)] font-medium">entry</div>
          </div>
        </div>

        {/* Price levels grid */}
        <div className="grid grid-cols-4 gap-2">
          <LevelCell label="Stop" value={signal.stopLoss} variant="stop" />
          <LevelCell label="TP1"  value={signal.takeProfit1} variant="tp" />
          <LevelCell label="TP2"  value={signal.takeProfit2} variant="tp" />
          <LevelCell label="TP3"  value={signal.takeProfit3} variant="tp" />
        </div>

        {/* Metrics row + confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MetricPill label="R:R" value={`${signal.riskRewardRatio.toFixed(1)}×`} />
              <MetricPill label="Size" value={`${signal.positionSizePct.toFixed(1)}%`} />
              <MetricPill label="TF" value={signal.timeframe} />
            </div>
          </div>
          <ConfidenceMeter value={signal.confidenceScore} />
        </div>
      </div>
    </div>
  );
}

function LevelCell({ label, value, variant }: { label: string; value: number; variant: "stop" | "tp" }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] px-2 py-1.5">
      <div className="text-[9px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">{label}</div>
      <div className={cn(
        "font-mono text-xs font-semibold",
        variant === "stop" ? "text-[var(--color-bearish)]" : "text-[var(--color-bullish)]",
      )}>
        ${formatPrice(value)}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[var(--muted-foreground)]">{label}</span>
      <span className="text-xs font-mono font-semibold">{value}</span>
    </div>
  );
}

