import { BiasBadge } from "./bias-badge";
import { formatPrice } from "@/lib/utils";
import type { Bias } from "@finance/types/index.js";

interface IndicatorRowProps {
  label: string;
  value: number;
  bias: Bias;
  format?: (v: number) => string;
}

export function IndicatorRow({ label, value, bias, format }: IndicatorRowProps) {
  const formatted = format ? format(value) : formatPrice(value);

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{formatted}</span>
        <BiasBadge bias={bias} />
      </div>
    </div>
  );
}
