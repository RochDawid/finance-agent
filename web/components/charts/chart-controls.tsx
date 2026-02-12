"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Timeframe } from "@finance/types/index.js";

interface ChartControlsProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  className?: string;
}

const timeframes: { value: Timeframe; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

export function ChartControls({ timeframe, onTimeframeChange, className }: ChartControlsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {timeframes.map((tf) => (
        <Button
          key={tf.value}
          variant={timeframe === tf.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onTimeframeChange(tf.value)}
          className="h-7 px-2 text-xs font-mono"
        >
          {tf.label}
        </Button>
      ))}
    </div>
  );
}
