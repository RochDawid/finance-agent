import { cn, formatPrice, formatPercent } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  change?: number;
  changePercent?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  size = "md",
  className,
}: PriceDisplayProps) {
  const isPositive = (change ?? 0) >= 0;
  const colorClass = change !== undefined
    ? isPositive ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]"
    : "";

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-bold",
  };

  return (
    <div className={cn("inline-flex items-baseline gap-2 font-mono", className)}>
      <span className={cn(sizeClasses[size], colorClass)}>
        ${formatPrice(price)}
      </span>
      {change !== undefined && (
        <span className={cn("text-xs", colorClass)}>
          {isPositive ? "+" : ""}{formatPrice(change)}
        </span>
      )}
      {changePercent !== undefined && (
        <span className={cn("text-xs", colorClass)}>
          ({formatPercent(changePercent)})
        </span>
      )}
    </div>
  );
}
