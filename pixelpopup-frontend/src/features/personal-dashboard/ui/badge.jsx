import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-[var(--pd-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--pd-primary)]/50 aria-invalid:border-red-700 aria-invalid:ring-red-700/20 dark:aria-invalid:ring-red-700/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--pd-primary)] text-white [a&]:hover:bg-[var(--pd-primary)]/90",
        secondary:
          "bg-[var(--pd-soft)] text-slate-900 [a&]:hover:bg-[var(--pd-soft)]/90",
        destructive:
          "bg-red-700 text-white focus-visible:ring-red-700/20 dark:bg-red-700/60 dark:focus-visible:ring-red-700/40 [a&]:hover:bg-red-700/90",
        outline:
          "border-[var(--pd-border)] text-[var(--pd-ink)] [a&]:hover:bg-[var(--pd-soft)] [a&]:hover:text-slate-900",
        ghost: "[a&]:hover:bg-[var(--pd-soft)] [a&]:hover:text-slate-900",
        link: "text-[var(--pd-primary)] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
