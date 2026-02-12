import { cn } from "@/lib/utils";

interface FearGreedGaugeProps {
  value: number; // 0-100
  classification: string;
  size?: number;
  className?: string;
}

export function FearGreedGauge({
  value,
  classification,
  size = 120,
  className,
}: FearGreedGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = -90 + (clampedValue / 100) * 180; // -90 to 90 degrees
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  // Arc path
  const startAngle = -Math.PI;
  const endAngle = 0;
  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);

  // Needle endpoint
  const needleAngle = ((angle - 90) * Math.PI) / 180;
  const needleX = cx + (r - 5) * Math.cos(needleAngle);
  const needleY = cy + (r - 5) * Math.sin(needleAngle);

  const color =
    clampedValue <= 25
      ? "var(--color-bearish)"
      : clampedValue <= 45
        ? "var(--color-neutral)"
        : clampedValue <= 55
          ? "var(--color-terminal-400)"
          : clampedValue <= 75
            ? "var(--color-neutral)"
            : "var(--color-bullish)";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`} role="img" aria-label={`Fear & Greed Index: ${clampedValue} - ${classification}`}>
        {/* Background arc */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="var(--color-terminal-800)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Gradient arc segments */}
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-bearish)" />
            <stop offset="25%" stopColor="var(--color-neutral)" />
            <stop offset="50%" stopColor="var(--color-terminal-400)" />
            <stop offset="75%" stopColor="var(--color-neutral)" />
            <stop offset="100%" stopColor="var(--color-bullish)" />
          </linearGradient>
        </defs>
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
        {/* Value text */}
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono, monospace" fill="currentColor">
          {clampedValue}
        </text>
      </svg>
      <span className="text-xs text-[var(--muted-foreground)] mt-1">{classification}</span>
    </div>
  );
}
