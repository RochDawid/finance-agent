"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegimeBadge } from "@/components/data/regime-badge";
import { FearGreedGauge } from "@/components/charts/fear-greed-gauge";
import { IndexChange } from "./index-change";
import type { MarketCondition } from "@finance/types/index.js";

interface MarketOverviewProps {
  marketCondition: MarketCondition;
}

export function MarketOverview({ marketCondition }: MarketOverviewProps) {
  const { regime, sp500Change, nasdaqChange, sentiment, vixLevel } = marketCondition;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Market Overview</CardTitle>
          <RegimeBadge regime={regime} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <div className="space-y-2 flex-1">
            <IndexChange name="S&P 500" change={sp500Change} />
            <IndexChange name="NASDAQ" change={nasdaqChange} />
            {vixLevel !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">VIX</span>
                <span className="font-mono">{vixLevel.toFixed(1)}</span>
              </div>
            )}
            {sentiment.marketBreadth && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Breadth</span>
                <span className="font-mono">
                  {sentiment.marketBreadth.advancers}A / {sentiment.marketBreadth.decliners}D
                </span>
              </div>
            )}
          </div>
          <FearGreedGauge
            value={sentiment.fearGreed.value}
            classification={sentiment.fearGreed.classification}
            size={100}
          />
        </div>
      </CardContent>
    </Card>
  );
}
