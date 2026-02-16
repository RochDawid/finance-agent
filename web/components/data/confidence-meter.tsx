import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceMeter({ value, showLabel = true, className }: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const { color } =
    clamped >= 75 ? { color: "var(--color-confidence-very-high)" } :
    clamped >= 50 ? { color: "var(--color-confidence-high)"      } :
    clamped >= 25 ? { color: "var(--color-confidence-medium)"    } :
                   { color: "var(--color-confidence-low)"        };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${clamped}%`}
        />
      </div>
      {showLabel && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-semibold" style={{ color }}>
            {clamped}%
          </span>
        </div>
      )}
    </div>
  );
}
