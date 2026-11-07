import { useState } from "react";
import { ChevronDown } from "lucide-react";
import useWorkspaceMobile from "./useWorkspaceMobile";

// Keep children mounted so opening a section never discards filters or drafts.
export default function MobileDisclosure({ title, count, defaultOpen = false, children }) {
  const mobile = useWorkspaceMobile();
  const [expanded, setExpanded] = useState(defaultOpen);
  return <details open={!mobile || expanded} onToggle={(event) => {
    if (mobile) setExpanded(event.currentTarget.open);
  }} className="group/mobile-section min-w-0">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--pd-border)] py-2 text-[13px] font-medium text-[var(--site-link)] focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden [&::-webkit-details-marker]:hidden">
      <span>{title}{count > 0 && <span className="ml-2 text-xs text-[var(--site-secondary)]">({count})</span>}</span>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open/mobile-section:rotate-180 motion-safe:transition-transform" />
    </summary>
    <div className="min-w-0 pt-3 lg:pt-0">{children}</div>
  </details>;
}
