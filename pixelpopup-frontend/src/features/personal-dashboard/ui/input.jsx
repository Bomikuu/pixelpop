import * as React from "react";
import { cn } from "cn";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[var(--pd-border)] bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-[var(--pd-primary)] selection:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--pd-ink)] placeholder:text-[var(--pd-muted)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-[var(--pd-border)]/30",
        "focus-visible:border-[var(--pd-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--pd-primary)]/50",
        "aria-invalid:border-red-700 aria-invalid:ring-red-700/20 dark:aria-invalid:ring-red-700/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
