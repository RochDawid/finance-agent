"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { ChartControls } from "@/components/charts/chart-controls";
import { BiasBadge } from "@/components/data/bias-badge";
import { PriceDisplay } from "@/components/data/price-display";
import { IndicatorPanel } from "@/components/data/indicator-panel";
import { IndicatorRow } from "@/components/data/indicator-row";
import { LevelsTable } from "@/components/data/levels-table";
import { FibonacciDisplay } from "@/components/data/fibonacci-display";
import { PivotDisplay } from "@/components/data/pivot-display";
import { useTickerData } from "@/hooks/use-ticker-data";
import { useOHLCV } from "@/hooks/use-ohlcv";
import { useConfig } from "@/lib/providers/config-provider";
import type { Timeframe } from "@finance/types/index.js";

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");

  const { config } = useConfig();
  const assetType = config?.watchlist.crypto.includes(ticker) ? "crypto" : "stock";

  const { data, isLoading } = useTickerData(ticker, assetType);
  const { data: ohlcv, isLoading: chartLoading } = useOHLCV(ticker, timeframe, assetType);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-bold font-mono">{ticker}</h1>
        {data?.technicals && <BiasBadge bias={data.technicals.overallBias} />}
      </div>

      {data?.quote && (
        <PriceDisplay
          price={data.quote.price}
          change={data.quote.change}
          changePercent={data.quote.changePercent}
          size="lg"
        />
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Price Chart</CardTitle>
          <ChartControls timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </CardHeader>
        <CardContent>
          {ohlcv && ohlcv.length > 0 ? (
            <ChartWrapper data={ohlcv} height={400} />
          ) : chartLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-[var(--muted-foreground)] text-sm">
              No chart data available
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : data?.technicals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trend Indicators */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <IndicatorPanel title="Trend">
                <IndicatorRow label="EMA 9" value={data.technicals.trend.ema9.value} bias={data.technicals.trend.ema9.interpretation} />
                <IndicatorRow label="EMA 21" value={data.technicals.trend.ema21.value} bias={data.technicals.trend.ema21.interpretation} />
                <IndicatorRow label="EMA 50" value={data.technicals.trend.ema50.value} bias={data.technicals.trend.ema50.interpretation} />
                <IndicatorRow label="EMA 200" value={data.technicals.trend.ema200.value} bias={data.technicals.trend.ema200.interpretation} />
                <IndicatorRow
                  label="MACD"
                  value={data.technicals.trend.macd.histogram}
                  bias={data.technicals.trend.macd.interpretation}
                  format={(v) => v.toFixed(4)}
                />
                <IndicatorRow label="ADX" value={data.technicals.trend.adx.value} bias={data.technicals.trend.adx.interpretation} format={(v) => v.toFixed(1)} />
              </IndicatorPanel>

              <IndicatorPanel title="Momentum">
                <IndicatorRow label="RSI" value={data.technicals.momentum.rsi.value} bias={data.technicals.momentum.rsi.interpretation} format={(v) => v.toFixed(1)} />
                <IndicatorRow label="Stochastic K" value={data.technicals.momentum.stochastic.k} bias={data.technicals.momentum.stochastic.interpretation} format={(v) => v.toFixed(1)} />
                <IndicatorRow label="CCI" value={data.technicals.momentum.cci.value} bias={data.technicals.momentum.cci.interpretation} format={(v) => v.toFixed(1)} />
                <IndicatorRow label="Williams %R" value={data.technicals.momentum.williamsR.value} bias={data.technicals.momentum.williamsR.interpretation} format={(v) => v.toFixed(1)} />
              </IndicatorPanel>

              <IndicatorPanel title="Volatility" defaultOpen={false}>
                <IndicatorRow label="BB Upper" value={data.technicals.volatility.bollingerBands.upper} bias={data.technicals.volatility.bollingerBands.interpretation} />
                <IndicatorRow label="BB Middle" value={data.technicals.volatility.bollingerBands.middle} bias="neutral" />
                <IndicatorRow label="BB Lower" value={data.technicals.volatility.bollingerBands.lower} bias={data.technicals.volatility.bollingerBands.interpretation} />
                <IndicatorRow label="ATR" value={data.technicals.volatility.atr.value} bias={data.technicals.volatility.atr.interpretation} format={(v) => v.toFixed(4)} />
              </IndicatorPanel>

              <IndicatorPanel title="Volume" defaultOpen={false}>
                <IndicatorRow label="OBV" value={data.technicals.volume.obv.value} bias={data.technicals.volume.obv.interpretation} format={(v) => (v / 1e6).toFixed(1) + "M"} />
                <IndicatorRow label="VWAP" value={data.technicals.volume.vwap.value} bias={data.technicals.volume.vwap.interpretation} />
                <IndicatorRow label="CMF" value={data.technicals.volume.cmf.value} bias={data.technicals.volume.cmf.interpretation} format={(v) => v.toFixed(4)} />
              </IndicatorPanel>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">Confluence Score</span>
                <span className="font-mono font-medium">{data.technicals.confluenceScore}/10</span>
              </div>
            </CardContent>
          </Card>

          {/* Levels */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Price Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs text-[var(--muted-foreground)] mb-2">Support & Resistance</h4>
                <LevelsTable
                  levels={[...data.levels.supports, ...data.levels.resistances]}
                  currentPrice={data.quote?.price}
                />
              </div>

              <div>
                <h4 className="text-xs text-[var(--muted-foreground)] mb-2">Fibonacci Retracements</h4>
                <FibonacciDisplay fib={data.levels.fibonacci} currentPrice={data.quote?.price} />
              </div>

              <div>
                <h4 className="text-xs text-[var(--muted-foreground)] mb-2">Pivot Points</h4>
                <PivotDisplay pivots={data.levels.pivots} currentPrice={data.quote?.price} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
