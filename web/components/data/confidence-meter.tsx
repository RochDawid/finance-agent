import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number; // 0-100
  className?: string;
}

export function ConfidenceMeter({ value, className }: ConfidenceMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color =
    clampedValue >= 75
      ? "var(--color-confidence-very-high)"
      : clampedValue >= 50
        ? "var(--color-confidence-high)"
        : clampedValue >= 25
          ? "var(--color-confidence-medium)"
          : "var(--color-confidence-low)";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%`, backgroundColor: color }}
          role="meter"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${clampedValue}%`}
        />
      </div>
      <span className="text-xs font-mono text-[var(--muted-foreground)] w-8 text-right">
        {clampedValue}
      </span>
    </div>
  );
}
