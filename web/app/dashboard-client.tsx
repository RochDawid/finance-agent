"use client";

import { useWS } from "@/lib/providers/ws-provider";
import { MarketOverview } from "@/components/market/market-overview";
import { SignalList } from "@/components/signals/signal-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardClient() {
  const { state } = useWS();

  return (
    <div className="space-y-6">
      {/* Market overview */}
      <section aria-label="Market overview">
        {state.marketCondition ? (
          <MarketOverview marketCondition={state.marketCondition} />
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </section>

      {/* Agent overview */}
      {state.agentResponse?.marketOverview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
              {state.agentResponse.marketOverview}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signals */}
      <section aria-label="Trading signals">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Signals</h2>
          {state.agentResponse && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Cost: ${state.agentResponse.costUsd.toFixed(4)}
            </span>
          )}
        </div>
        {state.signals.length > 0 ? (
          <SignalList signals={state.signals} />
        ) : state.isScanning ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-[var(--muted-foreground)] text-sm">
              No signals yet. Run a scan to generate trading signals.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Errors */}
      {state.errors.length > 0 && (
        <section aria-label="Scan errors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[var(--color-bearish)]">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                {state.errors.map((err, i) => (
                  <li key={i}>
                    <span className="font-mono">{err.ticker}</span>: {err.error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
