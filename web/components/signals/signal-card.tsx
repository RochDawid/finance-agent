"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BiasBadge } from "@/components/data/bias-badge";
import { ConfidenceMeter } from "@/components/data/confidence-meter";
import { PriceDisplay } from "@/components/data/price-display";
import { cn, formatPrice } from "@/lib/utils";
import type { SignalWithId } from "@/lib/types";
import type { ReactNode } from "react";

interface SignalCardProps {
  signal: SignalWithId;
  index?: number;
  selected?: boolean;
  className?: string;
}

export function SignalCard({ signal, index, selected, className }: SignalCardProps) {
  return (
    <Link href={`/signals/${signal.id}`} className="block">
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md hover:border-[var(--ring)]",
          selected && "border-[var(--ring)] ring-1 ring-[var(--ring)]",
          className,
        )}
      >
        <CardHeader className="pb-2">
          <SignalCardHeader signal={signal} index={index} />
        </CardHeader>
        <CardContent className="space-y-3">
          <SignalCardLevels signal={signal} />
          <SignalCardMetrics signal={signal} />
        </CardContent>
      </Card>
    </Link>
  );
}

function SignalCardHeader({ signal, index }: { signal: SignalWithId; index?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {index !== undefined && (
          <span className="text-xs text-[var(--muted-foreground)] font-mono w-4">{index + 1}</span>
        )}
        <CardTitle className="text-lg font-semibold tracking-tight">{signal.ticker}</CardTitle>
        <Badge variant={signal.direction === "long" ? "bullish" : "bearish"} className="uppercase text-[10px] ml-1">
          {signal.direction}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {signal.assetType}
        </Badge>
      </div>
      <PriceDisplay price={signal.entryPrice} size="sm" />
    </div>
  );
}

function SignalCardLevels({ signal }: { signal: SignalWithId }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-xs">
      <div>
        <div className="text-[var(--muted-foreground)]">Stop</div>
        <div className="font-mono text-[var(--color-bearish)]">${formatPrice(signal.stopLoss)}</div>
      </div>
      <div>
        <div className="text-[var(--muted-foreground)]">TP1</div>
        <div className="font-mono text-[var(--color-bullish)]">${formatPrice(signal.takeProfit1)}</div>
      </div>
      <div>
        <div className="text-[var(--muted-foreground)]">TP2</div>
        <div className="font-mono text-[var(--color-bullish)]">${formatPrice(signal.takeProfit2)}</div>
      </div>
      <div>
        <div className="text-[var(--muted-foreground)]">TP3</div>
        <div className="font-mono text-[var(--color-bullish)]">${formatPrice(signal.takeProfit3)}</div>
      </div>
    </div>
  );
}

function SignalCardMetrics({ signal }: { signal: SignalWithId }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">R:R</span>
        <span className="font-mono">{signal.riskRewardRatio.toFixed(1)}</span>
        <span className="text-[var(--muted-foreground)]">Size</span>
        <span className="font-mono">{signal.positionSizePct.toFixed(1)}%</span>
        <span className="text-[var(--muted-foreground)]">TF</span>
        <span className="font-mono">{signal.timeframe}</span>
      </div>
      <ConfidenceMeter value={signal.confidenceScore} />
    </div>
  );
}

function SignalCardReasoning({ signal }: { signal: SignalWithId }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{signal.reasoning}</p>
      {signal.confluenceFactors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {signal.confluenceFactors.map((factor, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              {factor}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export { SignalCardHeader, SignalCardLevels, SignalCardMetrics, SignalCardReasoning };
