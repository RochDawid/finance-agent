import { cn, formatPercent } from "@/lib/utils";

interface IndexChangeProps {
  name: string;
  change: number;
}

export function IndexChange({ name, change }: IndexChangeProps) {
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted-foreground)]">{name}</span>
      <span
        className={cn(
          "font-mono font-medium",
          isPositive ? "text-[var(--color-bullish)]" : "text-[var(--color-bearish)]",
        )}
      >
        {formatPercent(change)}
      </span>
    </div>
  );
}
