"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/data/price-display";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import type { Quote } from "@finance/types/index.js";

interface TickerCardProps {
  quote: Quote;
  sparklineData?: number[];
  onRemove?: () => void;
}

export function TickerCard({ quote, sparklineData, onRemove }: TickerCardProps) {
  return (
    <Card className="relative group">
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          aria-label={`Remove ${quote.ticker}`}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <Link href={`/analysis/${quote.ticker}`} className="block cursor-pointer">
        <CardContent className="p-3 hover:bg-[var(--accent)] transition-colors rounded-[inherit]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{quote.ticker}</span>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{quote.assetType}</span>
          </div>
          <PriceDisplay
            price={quote.price}
            change={quote.change}
            changePercent={quote.changePercent}
            size="sm"
          />
          {sparklineData && sparklineData.length > 1 && (
            <div className="mt-2">
              <MiniSparkline data={sparklineData} width={140} height={20} />
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
