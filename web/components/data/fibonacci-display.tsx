import { cn, formatPrice } from "@/lib/utils";
import type { FibonacciLevels } from "@finance/types/index.js";

interface FibonacciDisplayProps {
  fib: FibonacciLevels;
  currentPrice?: number;
  className?: string;
}

const levels = [
  { key: "level0", label: "0% (High)", pct: 0 },
  { key: "level236", label: "23.6%", pct: 23.6 },
  { key: "level382", label: "38.2%", pct: 38.2 },
  { key: "level500", label: "50%", pct: 50 },
  { key: "level618", label: "61.8%", pct: 61.8 },
  { key: "level786", label: "78.6%", pct: 78.6 },
  { key: "level1000", label: "100% (Low)", pct: 100 },
] as const;

export function FibonacciDisplay({ fib, currentPrice, className }: FibonacciDisplayProps) {
  const range = fib.level0 - fib.level1000;
  const pricePosition =
    currentPrice !== undefined && range !== 0
      ? ((fib.level0 - currentPrice) / range) * 100
      : null;

  return (
    <div className={cn("space-y-1", className)}>
      {levels.map(({ key, label, pct }) => {
        const price = fib[key];
        const isNear =
          currentPrice !== undefined && Math.abs(price - currentPrice) / currentPrice < 0.005;

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] w-20">{label}</span>
            <div className="flex-1 h-1 bg-[var(--muted)] rounded relative">
              <div
                className="absolute top-0 h-1 w-1 rounded-full bg-[var(--color-neutral)]"
                style={{ left: `${pct}%` }}
              />
              {pricePosition !== null && (
                <div
                  className="absolute top-[-2px] h-[8px] w-[2px] bg-[var(--foreground)]"
                  style={{ left: `${Math.max(0, Math.min(100, pricePosition))}%` }}
                />
              )}
            </div>
            <span
              className={cn(
                "font-mono text-xs w-20 text-right",
                isNear && "font-bold text-[var(--color-neutral)]",
              )}
            >
              ${formatPrice(price)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
