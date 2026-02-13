"use client";

import { useWS } from "@/lib/providers/ws-provider";
import { MarketOverview } from "@/components/market/market-overview";
import { SignalList } from "@/components/signals/signal-list";
import { ScanStatus } from "@/components/layout/scan-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, TrendingUp, BarChart3, Zap } from "lucide-react";

export function DashboardClient() {
  const { state, triggerScan } = useWS();

  const hasData = state.signals.length > 0 || state.marketCondition !== null;

  // Empty state — no scan has been run yet
  if (!state.isScanning && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--accent)] mb-8">
          <TrendingUp className="h-10 w-10 text-[var(--foreground)]" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-3">Ready to scan the market?</h2>
        <p className="text-[var(--muted-foreground)] max-w-sm mb-8 leading-relaxed">
          Fetch live quotes, run technical analysis on your watchlist, and generate AI-powered
          trading signals — all in one click.
        </p>

        <Button
          size="lg"
          onClick={triggerScan}
          className="gap-2 px-6 font-semibold"
        >
          <Scan className="h-5 w-5" />
          Run Market Scan
        </Button>

        <p className="mt-4 text-xs text-[var(--muted-foreground)]">
          or press{" "}
          <kbd className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">Ctrl+S</kbd>
          {" "}·{" "}
          <kbd className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">Cmd+S</kbd>
        </p>

        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg w-full text-left">
          {[
            { icon: BarChart3, label: "15+ Indicators", desc: "EMA, MACD, RSI, Bollinger Bands, ATR, VWAP and more" },
            { icon: Zap, label: "AI Signals", desc: "Claude reasons over multi-timeframe confluence to find setups" },
            { icon: TrendingUp, label: "Risk-Managed", desc: "Every signal includes entry, stop loss, and 3 take-profit levels" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scan status — shows progress or last scan time */}
      <ScanStatus
        isScanning={state.isScanning}
        lastScanTime={state.lastScanTime}
        scanStage={state.scanStage}
        scanMessage={state.scanMessage}
        onScan={triggerScan}
      />

      {/* Market overview */}
      {state.marketCondition && (
        <section aria-label="Market overview">
          <MarketOverview marketCondition={state.marketCondition} />
        </section>
      )}

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
        ) : !state.isScanning ? (
          <Card>
            <CardContent className="py-8 text-center text-[var(--muted-foreground)] text-sm">
              No signals generated. Try running another scan.
            </CardContent>
          </Card>
        ) : null}
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
