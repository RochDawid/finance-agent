"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/data/price-display";
import { ConfidenceMeter } from "@/components/data/confidence-meter";
import { EntryZoneVisual } from "./entry-zone-visual";
import { formatPrice } from "@/lib/utils";
import type { SignalWithId } from "@/lib/types";

interface SignalDetailPanelProps {
  signal: SignalWithId;
}

export function SignalDetailPanel({ signal }: SignalDetailPanelProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/analysis/${signal.ticker}`} className="hover:underline underline-offset-2">
            <h1 className="text-2xl font-bold">{signal.ticker}</h1>
          </Link>
          <Badge variant={signal.direction === "long" ? "bullish" : "bearish"} className="uppercase">
            {signal.direction}
          </Badge>
          <Badge variant="secondary">{signal.assetType}</Badge>
          <Badge variant="secondary">{signal.timeframe}</Badge>
        </div>
        <PriceDisplay price={signal.entryPrice} size="lg" />
      </div>

      {/* Entry Zone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entry Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryZoneVisual signal={signal} />
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricItem label="Risk:Reward" value={`${signal.riskRewardRatio.toFixed(1)}:1`} />
            <MetricItem label="Position Size" value={`${signal.positionSizePct.toFixed(1)}%`} />
            <MetricItem label="Stop Loss" value={`$${formatPrice(signal.stopLoss)}`} color="bearish" />
            <MetricItem label="Invalidation" value={`$${formatPrice(signal.invalidationLevel)}`} color="bearish" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-[var(--muted-foreground)] mb-1">Confidence</div>
            <ConfidenceMeter value={signal.confidenceScore} />
          </div>
        </CardContent>
      </Card>

      {/* Reasoning */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Reasoning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
            {signal.reasoning}
          </p>
          {signal.confluenceFactors.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Confluence Factors</div>
              <div className="flex flex-wrap gap-1">
                {signal.confluenceFactors.map((factor, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "bullish" | "bearish";
}) {
  const colorClass = color === "bullish"
    ? "text-[var(--color-bullish)]"
    : color === "bearish"
      ? "text-[var(--color-bearish)]"
      : "";

  return (
    <div>
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className={`font-mono text-sm font-medium ${colorClass}`}>{value}</div>
    </div>
  );
}
