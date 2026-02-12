import { Badge } from "@/components/ui/badge";
import type { MarketRegime } from "@finance/types/index.js";

const regimeLabels: Record<MarketRegime, string> = {
  trending_up: "Trending Up",
  trending_down: "Trending Down",
  range_bound: "Range Bound",
  high_volatility: "High Vol",
  low_volatility: "Low Vol",
};

const regimeVariants: Record<MarketRegime, "bullish" | "bearish" | "neutral"> = {
  trending_up: "bullish",
  trending_down: "bearish",
  range_bound: "neutral",
  high_volatility: "bearish",
  low_volatility: "neutral",
};

interface RegimeBadgeProps {
  regime: MarketRegime;
  className?: string;
}

export function RegimeBadge({ regime, className }: RegimeBadgeProps) {
  return (
    <Badge variant={regimeVariants[regime]} className={className}>
      {regimeLabels[regime]}
    </Badge>
  );
}
