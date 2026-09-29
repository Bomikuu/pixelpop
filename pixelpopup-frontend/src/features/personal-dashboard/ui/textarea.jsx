import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }) {
  return (
    <textarea
      style={{ resize: "none", minHeight: "100px" }}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-solid border-slate-400 bg-white px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-[var(--pd-muted)] focus-visible:border-[var(--pd-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--pd-primary)]/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 aria-invalid:ring-red-700/20 md:text-sm dark:aria-invalid:ring-red-700/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
