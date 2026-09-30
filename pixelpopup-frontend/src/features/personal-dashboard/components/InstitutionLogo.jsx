import { useState } from "react";
import { Landmark } from "lucide-react";

export default function InstitutionLogo({ institution, className = "h-7 w-16" }) {
  const [failed, setFailed] = useState(false);
  return institution?.logo && !failed ? (
    <img
      src={institution.logo}
      alt=""
      className={className + " object-contain"}
      width="64"
      height="28"
      onError={() => setFailed(true)}
    />
  ) : (
    <Landmark
      className="size-6 shrink-0 text-[var(--pd-primary)]"
      aria-hidden="true"
    />
  );
}
