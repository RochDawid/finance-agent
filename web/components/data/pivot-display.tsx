import { cn, formatPrice } from "@/lib/utils";
import type { PivotPoints } from "@finance/types/index.js";

interface PivotDisplayProps {
  pivots: PivotPoints;
  currentPrice?: number;
  className?: string;
}

export function PivotDisplay({ pivots, currentPrice, className }: PivotDisplayProps) {
  const rows = [
    { label: "R3", value: pivots.r3, type: "resistance" as const },
    { label: "R2", value: pivots.r2, type: "resistance" as const },
    { label: "R1", value: pivots.r1, type: "resistance" as const },
    { label: "Pivot", value: pivots.pivot, type: "pivot" as const },
    { label: "S1", value: pivots.s1, type: "support" as const },
    { label: "S2", value: pivots.s2, type: "support" as const },
    { label: "S3", value: pivots.s3, type: "support" as const },
  ];

  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="text-xs text-[var(--muted-foreground)] mb-1">
        {pivots.type === "classic" ? "Classic" : "Camarilla"} Pivots
      </div>
      {rows.map(({ label, value, type }) => {
        const isNear =
          currentPrice !== undefined && Math.abs(value - currentPrice) / currentPrice < 0.005;
        return (
          <div key={label} className="flex items-center justify-between py-0.5">
            <span
              className={cn(
                "text-xs font-medium w-8",
                type === "resistance"
                  ? "text-[var(--color-bearish)]"
                  : type === "support"
                    ? "text-[var(--color-bullish)]"
                    : "text-[var(--muted-foreground)]",
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                "font-mono text-xs",
                isNear && "font-bold text-[var(--color-neutral)]",
              )}
            >
              ${formatPrice(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
