"use client";

import Link from "next/link";
import { X, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceDisplay } from "@/components/data/price-display";
import { useQuote } from "@/hooks/use-quote";

interface TickerCardProps {
  ticker: string;
  assetType: "stock" | "crypto";
  onRemove?: () => void;
}

export function TickerCard({ ticker, assetType, onRemove }: TickerCardProps) {
  const { quote, isLoading, refresh } = useQuote(ticker, assetType);

  return (
    <Card className="relative group">
      {/* Action buttons — visible on hover */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.preventDefault();
            refresh();
          }}
          aria-label={`Refresh ${ticker}`}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            aria-label={`Remove ${ticker}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Link href={`/analysis/${ticker}`} className="block cursor-pointer">
        <CardContent className="p-3 hover:bg-[var(--accent)] transition-colors rounded-[inherit]">
          <div className="mb-1">
            <span className="font-medium text-sm">{ticker}</span>
          </div>
          {isLoading ? (
            <div className="space-y-1.5 mt-1">
              <Skeleton className="h-4 w-20 bg-[var(--foreground)]/15" />
              <Skeleton className="h-3 w-14 bg-[var(--foreground)]/10" />
            </div>
          ) : quote ? (
            <PriceDisplay
              price={quote.price}
              change={quote.change}
              changePercent={quote.changePercent}
              size="sm"
            />
          ) : (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Failed to load</p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
