import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--foreground)] text-[var(--background)]",
        secondary: "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",
        outline: "text-[var(--foreground)]",
        bullish: "border-transparent bg-[var(--color-bullish-muted)] text-[var(--color-bullish)]",
        bearish: "border-transparent bg-[var(--color-bearish-muted)] text-[var(--color-bearish)]",
        neutral: "border-transparent bg-[var(--color-neutral-muted)] text-[var(--color-neutral)]",
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
