import { useState } from "react";
import { transactionMerchantFor } from "../lib/transactionMerchants";
import { choiceIcon } from "../lib/presets";

export default function TransactionTypeIcon({ name, categoryName = "Other" }) {
  const merchant = transactionMerchantFor(name);
  const [failedLogo, setFailedLogo] = useState(null);
  const showLogo = merchant?.logo && merchant.logo !== failedLogo;
  const Icon = choiceIcon(categoryName.toLowerCase(), categoryName);

  return <span aria-hidden="true" className={"grid size-14 shrink-0 place-items-center overflow-hidden rounded-full " + (showLogo ? merchant.badgeClass : "bg-[var(--pd-soft)] text-slate-600")}>
    {showLogo ? <img src={merchant.logo} alt="" className="size-10 object-contain" loading="lazy" decoding="async" onError={() => setFailedLogo(merchant.logo)} /> : <Icon className="size-6" />}
  </span>;
}
