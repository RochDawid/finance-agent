"use client";

import { useWS } from "@/lib/providers/ws-provider";
import { useConfig } from "@/lib/providers/config-provider";
import { MarketOverview } from "@/components/market/market-overview";
import { SignalList } from "@/components/signals/signal-list";
import { AnalysisStatus } from "@/components/layout/analysis-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, BarChart3, Zap, KeyRound, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn, formatPrice, formatPercent } from "@/lib/utils";

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

export function DashboardClient() {
  const { state, triggerAnalysis, hasApiKey } = useWS();
  const { config } = useConfig();
  const { analysisError } = state;

  const hasData = state.signals.length > 0 || state.marketCondition !== null;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!state.isAnalyzing && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-fade-in">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20">
            <TrendingUp className="h-9 w-9 text-[var(--color-brand)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-bullish)] border-2 border-[var(--background)] flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Ready to analyze</h2>
        <p className="text-[var(--muted-foreground)] max-w-xs mb-8 leading-relaxed text-sm">
          Run a full market scan on your watchlist to get AI-powered trading signals with entry, stops, and targets.
        </p>

        {/* Error */}
        {analysisError && (
          <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/8 text-red-500 text-sm text-left max-w-sm w-full">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* API key nudge */}
        {!hasApiKey && (
          <Link
            href="/settings?tab=api"
            className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-amber-500 text-sm hover:bg-amber-500/12 transition-colors max-w-sm w-full"
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>
              Add your {config?.model?.provider ? PROVIDER_LABELS[config.model.provider] ?? config.model.provider : "AI"} API key to get started →
            </span>
          </Link>
        )}

        <Button
          size="lg"
          onClick={triggerAnalysis}
          disabled={!hasApiKey}
          className="gap-2 px-8 font-semibold bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white border-0 shadow-lg shadow-[var(--color-brand)]/20"
        >
          <Zap className="h-4 w-4" />
          Analyze Watchlist
        </Button>

        {hasApiKey && (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            or press{" "}
            <kbd className="rounded-md bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs border border-[var(--border)]">⌘A</kbd>
          </p>
        )}

        {/* Feature pills */}
        <div className="mt-14 flex flex-wrap gap-3 justify-center max-w-md">
          {[
            { icon: BarChart3,   text: "15+ indicators" },
            { icon: Zap,         text: "AI signals"     },
            { icon: ShieldCheck, text: "Risk-managed"   },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted-foreground)]">
              <Icon className="h-3.5 w-3.5" />
              {text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Error banner */}
      {analysisError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/8 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{analysisError}</span>
          {analysisError.includes("API key") && (
            <Link href="/settings?tab=api" className="font-semibold underline underline-offset-2 whitespace-nowrap">
              Fix →
            </Link>
          )}
        </div>
      )}

      {/* Analysis status */}
      <AnalysisStatus
        isAnalyzing={state.isAnalyzing}
        lastAnalysisTime={state.lastAnalysisTime}
        analysisStage={state.analysisStage}
        analysisMessage={state.analysisMessage}
        onAnalyze={triggerAnalysis}
      />

      {/* Market overview */}
      {state.marketCondition && (
        <section aria-label="Market overview">
          <MarketOverview marketCondition={state.marketCondition} />
        </section>
      )}

      {/* Watchlist price grid */}
      {(state.reports.length > 0 || state.isAnalyzing) && (
        <section aria-label="Watchlist prices">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2">
            {state.isAnalyzing && config
              ? [...config.watchlist.stocks, ...config.watchlist.crypto].map((ticker) => {
                  const report = state.reports.find((r) => r.ticker === ticker);
                  if (report) {
                    return <TickerPill key={ticker} ticker={ticker} quote={report.quote} />;
                  }
                  return (
                    <div key={ticker} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[var(--muted-foreground)]">{ticker}</span>
                        <Skeleton className="h-2.5 w-9" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  );
                })
              : state.reports.map((report) => (
                  <TickerPill key={report.ticker} ticker={report.ticker} quote={report.quote} />
                ))}
          </div>
        </section>
      )}

      {/* AI market analysis */}
      {state.agentResponse?.marketOverview && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
              <CardTitle className="text-sm">AI Market Analysis</CardTitle>
              {state.agentResponse.costUsd != null && (
                <span className="ml-auto text-[10px] font-mono text-[var(--muted-foreground)]">
                  ${state.agentResponse.costUsd.toFixed(4)}
                </span>
              )}
            </div>
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
          <h2 className="text-base font-bold tracking-tight">Signals</h2>
        </div>
        {state.signals.length > 0 ? (
          <SignalList signals={state.signals} />
        ) : !state.isAnalyzing ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--muted)]">
                <Activity className="h-6 w-6 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">No signals this run</p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-xs leading-relaxed">
                  The AI reviewed all tickers but found no high-quality setups. Better to sit out than force a marginal trade.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={triggerAnalysis} className="gap-1.5 mt-1">
                <Activity className="h-3.5 w-3.5" />
                Analyze again
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Errors */}
      {state.errors.length > 0 && (
        <section aria-label="Analysis errors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-[var(--color-bearish)] uppercase tracking-wide">
                Partial errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                {state.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono font-semibold text-[var(--foreground)] shrink-0">{err.ticker}</span>
                    <span>{err.error}</span>
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

function TickerPill({ ticker, quote }: { ticker: string; quote: { price: number; changePercent: number } }) {
  const positive = quote.changePercent >= 0;
  return (
    <Link
      href={`/analysis/${ticker}`}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 transition-all duration-150",
        "hover:shadow-md hover:-translate-y-px",
        positive
          ? "border-[var(--color-bullish)]/15 hover:border-[var(--color-bullish)]/35 bg-[var(--card)]"
          : "border-[var(--color-bearish)]/15 hover:border-[var(--color-bearish)]/35 bg-[var(--card)]",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold truncate">{ticker}</span>
        <span className={cn(
          "text-[10px] font-mono font-semibold shrink-0",
          positive ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
        )}>
          {formatPercent(quote.changePercent)}
        </span>
      </div>
      <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
        ${formatPrice(quote.price)}
      </span>
    </Link>
  );
}
