import { useState } from "react";
import { UserRound } from "lucide-react";

export default function PersonAvatar({ src, name, className = "size-9 text-xs", alt = "" }) {
  const [failedSource, setFailedSource] = useState(null);
  const initials = String(name || "").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--pd-border)] bg-blue-50 font-semibold text-blue-700 ${className}`}>
    {src && src !== failedSource
      ? <img src={src} alt={alt} className="size-full bg-white object-cover" onError={() => setFailedSource(src)} />
      : <span aria-hidden="true">{initials || <UserRound className="size-6" />}</span>}
  </span>;
}
