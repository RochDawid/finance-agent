"use client";

import { useConfig } from "@/lib/providers/config-provider";
import { useWS } from "@/lib/providers/ws-provider";
import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { TickerCard } from "@/components/watchlist/ticker-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  const { isScanning } = state;

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
            if (quote) return <TickerCard key={ticker} quote={quote} onRemove={() => removeTicker(ticker, "stocks")} />;
            if (isScanning) return <SkeletonCard key={ticker} />;
            return <PlaceholderCard key={ticker} ticker={ticker} onRemove={() => removeTicker(ticker, "stocks")} />;
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
            if (quote) return <TickerCard key={ticker} quote={quote} onRemove={() => removeTicker(ticker, "crypto")} />;
            if (isScanning) return <SkeletonCard key={ticker} />;
            return <PlaceholderCard key={ticker} ticker={ticker} onRemove={() => removeTicker(ticker, "crypto")} />;
          })}
        </div>
      </section>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

function PlaceholderCard({ ticker, onRemove }: { ticker: string; onRemove: () => void }) {
  return (
    <div className="relative group rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
        aria-label={`Remove ${ticker}`}
      >
        <X className="h-3 w-3" />
      </Button>
      <span className="font-medium text-sm">{ticker}</span>
      <div className="text-xs text-[var(--muted-foreground)] mt-1">No data yet</div>
    </div>
  );
}
