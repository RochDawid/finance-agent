"use client";

import { useConfig } from "@/lib/providers/config-provider";
import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { TickerCard } from "@/components/watchlist/ticker-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WatchlistPage() {
  const { config, isLoading, addTicker, removeTicker } = useConfig();

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Watchlist</h1>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Watchlist</h1>
        <AddTickerForm onAdd={(ticker, type) => addTicker(ticker, type)} />
      </div>

      <section>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          Stocks & ETFs ({config.watchlist.stocks.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.watchlist.stocks.map((ticker) => (
            <TickerCard key={ticker} ticker={ticker} assetType="stock" onRemove={() => removeTicker(ticker, "stocks")} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          Crypto ({config.watchlist.crypto.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {config.watchlist.crypto.map((ticker) => (
            <TickerCard key={ticker} ticker={ticker} assetType="crypto" onRemove={() => removeTicker(ticker, "crypto")} />
          ))}
        </div>
      </section>
    </div>
  );
}
