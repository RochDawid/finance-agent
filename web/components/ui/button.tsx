import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:     "bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 shadow-sm",
        destructive: "bg-[var(--color-bearish)] text-white hover:opacity-90 shadow-sm",
        outline:     "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        secondary:   "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]",
        ghost:       "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        link:        "text-[var(--foreground)] underline-offset-4 hover:underline",
        brand:       "bg-[var(--color-brand)] text-white hover:opacity-90 shadow-sm shadow-[var(--color-brand)]/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-lg px-3 text-xs",
        lg:      "h-10 rounded-lg px-6 text-sm",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
