import { Badge } from "@/components/ui/badge";
import type { Bias } from "@finance/types/index.js";

interface BiasBadgeProps {
  bias: Bias;
  className?: string;
}

export function BiasBadge({ bias, className }: BiasBadgeProps) {
  const variant = bias === "bullish" ? "bullish" : bias === "bearish" ? "bearish" : "neutral";
  return (
    <Badge variant={variant} className={className}>
      {bias}
    </Badge>
  );
}

export function BullishBadge({ className }: { className?: string }) {
  return <Badge variant="bullish" className={className}>bullish</Badge>;
}

export function BearishBadge({ className }: { className?: string }) {
  return <Badge variant="bearish" className={className}>bearish</Badge>;
}

export function NeutralBadge({ className }: { className?: string }) {
  return <Badge variant="neutral" className={className}>neutral</Badge>;
}
