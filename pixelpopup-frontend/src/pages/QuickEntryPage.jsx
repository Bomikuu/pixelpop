import { useEffect, useState } from "react";
import { Check, ShieldCheck, LogIn } from "lucide-react";
import { useQuickEntryData } from "../features/personal-dashboard/hooks/useQuickEntryData";
import QuickEntryView from "../features/personal-dashboard/views/QuickEntryView";
import { Button } from "../features/personal-dashboard/ui/button";
import { ErrorState } from "../features/personal-dashboard/components/Panel";
import "../features/personal-dashboard/styles/theme.css";

export default function QuickEntryPage() {
  const dashboard = useQuickEntryData();
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const previousTitle = document.title;
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.getAttribute("content");
    const meta = existing || document.createElement("meta");
    meta.setAttribute("name", "robots"); meta.setAttribute("content", "noindex, nofollow");
    if (!existing) document.head.appendChild(meta);
    document.title = "Quick Entry | Personal workspace";
    return () => {
      document.title = previousTitle;
      if (existing) meta.setAttribute("content", previous); else meta.remove();
    };
  }, []);
  return <main className="personal-dashboard min-h-[100dvh] bg-slate-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:py-6">
    <div className="mx-auto w-full max-w-6xl">
      {dashboard.status === "ready" ? <>
        {notice && <p role="status" className="mb-3 flex items-center gap-2 text-sm text-emerald-700"><Check className="size-4" aria-hidden="true" />{notice}</p>}
        {dashboard.error && <div className="mb-4"><ErrorState message={dashboard.error} retry={dashboard.refresh} /></div>}
        <QuickEntryView dashboard={dashboard} notify={setNotice} />
      </> : dashboard.status === "denied" ? <div className="space-y-4 py-12 text-center">
        <ShieldCheck className="mx-auto size-8 text-slate-500" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Sign in for Quick Entry</h1>
        <p className="text-sm text-slate-600">Use your Django account to record personal income and expenses.</p>
        <Button asChild className="h-11"><a href="/admin/login/?next=/quick-entry"><LogIn className="size-4" aria-hidden="true" />Sign in</a></Button>
      </div> : dashboard.status === "error" ? <ErrorState message={dashboard.error} retry={dashboard.refresh} /> : <p className="py-12 text-center text-sm text-slate-600" role="status">Loading your entry workspace…</p>}
    </div>
  </main>;
}
