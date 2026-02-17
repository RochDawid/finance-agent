import Link from "next/link";
import { cn, formatPrice, formatPercent } from "@/lib/utils";

interface TickerPillProps {
  ticker: string;
  quote: { price: number; changePercent: number };
}

export function TickerPill({ ticker, quote }: TickerPillProps) {
  const positive = quote.changePercent >= 0;
  return (
    <Link
      href={`/details/${ticker}`}
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
