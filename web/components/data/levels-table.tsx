import { cn, formatPrice } from "@/lib/utils";
import type { PriceLevel } from "@finance/types/index.js";

interface LevelsTableProps {
  levels: PriceLevel[];
  currentPrice?: number;
  className?: string;
}

const strengthColors: Record<string, string> = {
  strong: "text-[var(--foreground)]",
  moderate: "text-[var(--muted-foreground)]",
  weak: "text-[var(--muted-foreground)] opacity-60",
};

export function LevelsTable({ levels, currentPrice, className }: LevelsTableProps) {
  const sorted = [...levels].sort((a, b) => b.price - a.price);

  return (
    <div className={cn("text-sm", className)}>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1">
        <div className="text-xs text-[var(--muted-foreground)] font-medium">Source</div>
        <div className="text-xs text-[var(--muted-foreground)] font-medium text-right">Price</div>
        <div className="text-xs text-[var(--muted-foreground)] font-medium">Type</div>
        <div className="text-xs text-[var(--muted-foreground)] font-medium">Strength</div>

        {sorted.map((level, i) => {
          const isNearPrice =
            currentPrice !== undefined &&
            Math.abs(level.price - currentPrice) / currentPrice < 0.005;

          return (
            <div key={`${level.source}-${i}`} className="contents">
              <div className={cn("truncate", strengthColors[level.strength])}>
                {level.source}
              </div>
              <div
                className={cn(
                  "font-mono text-right",
                  isNearPrice && "font-bold text-[var(--color-neutral)]",
                  level.type === "support"
                    ? "text-[var(--color-bullish)]"
                    : "text-[var(--color-bearish)]",
                )}
              >
                ${formatPrice(level.price)}
              </div>
              <div className={level.type === "support" ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]"}>
                {level.type === "support" ? "S" : "R"}
              </div>
              <div className={strengthColors[level.strength]}>
                {level.strength}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
