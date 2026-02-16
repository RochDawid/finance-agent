import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:   "bg-[var(--foreground)] text-[var(--background)] border border-transparent",
        secondary: "bg-[var(--muted)] text-[var(--muted-foreground)] border border-transparent",
        outline:   "border border-[var(--border)] text-[var(--foreground)]",
        bullish:   "bg-[var(--color-bullish-muted)] text-[var(--color-bullish)] border border-[var(--color-bullish)]/20",
        bearish:   "bg-[var(--color-bearish-muted)] text-[var(--color-bearish)] border border-[var(--color-bearish)]/20",
        neutral:   "bg-[var(--color-neutral-muted)] text-[var(--color-neutral)] border border-[var(--color-neutral)]/20",
        brand:     "bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
