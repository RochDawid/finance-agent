"use client";

import { useConfig } from "@/lib/providers/config-provider";
import { useWS } from "@/lib/providers/ws-provider";
import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { TickerCard } from "@/components/watchlist/ticker-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WatchlistPage() {
  const { config, isLoading, addTicker, removeTicker } = useConfig();
  const { state } = useWS();

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Watchlist</h1>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const getQuote = (ticker: string) =>
    state.reports.find((r) => r.ticker === ticker)?.quote;

  const getSparkline = (ticker: string) => {
    const report = state.reports.find((r) => r.ticker === ticker);
    // no sparkline data stored; return undefined
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Watchlist</h1>
        <AddTickerForm
          onAdd={(ticker, type) => addTicker(ticker, type)}
        />
      </div>

      {/* Stocks */}
      <section>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          Stocks & ETFs ({config.watchlist.stocks.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.watchlist.stocks.map((ticker) => {
            const quote = getQuote(ticker);
            return quote ? (
              <TickerCard
                key={ticker}
                quote={quote}
                onRemove={() => removeTicker(ticker, "stocks")}
              />
            ) : (
              <div
                key={ticker}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
              >
                <span className="font-medium text-sm">{ticker}</span>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">No data yet</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Crypto */}
      <section>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          Crypto ({config.watchlist.crypto.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.watchlist.crypto.map((ticker) => {
            const quote = getQuote(ticker);
            return quote ? (
              <TickerCard
                key={ticker}
                quote={quote}
                onRemove={() => removeTicker(ticker, "crypto")}
              />
            ) : (
              <div
                key={ticker}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
              >
                <span className="font-medium text-sm">{ticker}</span>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">No data yet</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
