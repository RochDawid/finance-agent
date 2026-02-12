import { cn, formatPrice } from "@/lib/utils";
import type { Signal } from "@finance/types/index.js";

interface EntryZoneVisualProps {
  signal: Signal;
  className?: string;
}

export function EntryZoneVisual({ signal, className }: EntryZoneVisualProps) {
  const isLong = signal.direction === "long";
  const allPrices = [
    signal.stopLoss,
    signal.entryZoneLow,
    signal.entryZoneHigh,
    signal.takeProfit1,
    signal.takeProfit2,
    signal.takeProfit3,
  ];
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;

  const pct = (price: number) => ((price - min) / range) * 100;

  const markers = [
    { label: "SL", price: signal.stopLoss, color: "var(--color-bearish)" },
    { label: "Entry Low", price: signal.entryZoneLow, color: "var(--color-neutral)" },
    { label: "Entry High", price: signal.entryZoneHigh, color: "var(--color-neutral)" },
    { label: "TP1", price: signal.takeProfit1, color: "var(--color-bullish)" },
    { label: "TP2", price: signal.takeProfit2, color: "var(--color-bullish)" },
    { label: "TP3", price: signal.takeProfit3, color: "var(--color-bullish)" },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-8 bg-[var(--muted)] rounded overflow-hidden">
        {/* Entry zone */}
        <div
          className="absolute top-0 h-full opacity-20"
          style={{
            left: `${pct(signal.entryZoneLow)}%`,
            width: `${pct(signal.entryZoneHigh) - pct(signal.entryZoneLow)}%`,
            backgroundColor: "var(--color-neutral)",
          }}
        />
        {/* Markers */}
        {markers.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 h-full w-0.5"
            style={{ left: `${pct(m.price)}%`, backgroundColor: m.color }}
            title={`${m.label}: $${formatPrice(m.price)}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)]">
        <span className="text-[var(--color-bearish)]">SL ${formatPrice(signal.stopLoss)}</span>
        <span>Entry ${formatPrice(signal.entryZoneLow)}-${formatPrice(signal.entryZoneHigh)}</span>
        <span className="text-[var(--color-bullish)]">TP3 ${formatPrice(signal.takeProfit3)}</span>
      </div>
    </div>
  );
}
