"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalDetailPanel } from "@/components/signals/signal-detail-panel";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { useWS } from "@/lib/providers/ws-provider";
import { useOHLCV } from "@/hooks/use-ohlcv";
import type { Overlay } from "@/components/charts/candlestick-chart";

export default function SignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useWS();
  const signalId = params.id as string;

  const signal = state.signals.find((s) => s.id === signalId);
  const assetType = signal?.assetType === "crypto" ? "crypto" : "stock";
  const { data: ohlcv, isLoading: chartLoading } = useOHLCV(
    signal?.ticker ?? null,
    "1d",
    assetType,
  );

  if (!signal) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          Signal not found. Run an analysis to generate signals.
        </div>
      </div>
    );
  }

  const overlays: Overlay[] = [
    { type: "line", label: "Entry", price: signal.entryPrice, color: "rgba(255,255,255,0.6)", style: "dashed" },
    { type: "line", label: "SL", price: signal.stopLoss, color: "oklch(0.65 0.2 25)", style: "solid" },
    { type: "line", label: "TP1", price: signal.takeProfit1, color: "oklch(0.72 0.19 145)", style: "dashed" },
    { type: "line", label: "TP2", price: signal.takeProfit2, color: "oklch(0.72 0.19 145)", style: "dashed" },
    { type: "line", label: "TP3", price: signal.takeProfit3, color: "oklch(0.72 0.19 145)", style: "solid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/details/${signal.ticker}`}>
            <BarChart3 className="h-4 w-4 mr-1" /> Analysis
          </Link>
        </Button>
      </div>

      {ohlcv && ohlcv.length > 0 ? (
        <ChartWrapper data={ohlcv} overlays={overlays} height={400} />
      ) : chartLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : null}

      <SignalDetailPanel signal={signal} />
    </div>
  );
}
