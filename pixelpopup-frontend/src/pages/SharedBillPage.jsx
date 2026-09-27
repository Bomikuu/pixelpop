import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Link2, ShieldCheck } from "lucide-react";
import { financeApi } from "../features/personal-dashboard/api";
import { useRecords } from "../features/personal-dashboard/hooks/useDashboardData";
import BillBreakdown from "../features/personal-dashboard/components/shared-bills/BillBreakdown";
import ParticipantAvatars from "../features/personal-dashboard/components/shared-bills/ParticipantAvatars";
import PublicBillActions from "../features/personal-dashboard/components/shared-bills/PublicBillActions";
import { Button } from "../features/personal-dashboard/ui/button";
import {
  EmptyState,
  ErrorState,
} from "../features/personal-dashboard/components/Panel";
import { dateLabel } from "../features/personal-dashboard/lib/format";
import "../features/personal-dashboard/styles/theme.css";

const publicRequest = (path, options) =>
  financeApi(path, { ...options, credentials: "omit" });

export default function SharedBillPage() {
  const { token } = useParams();
  const [version, setVersion] = useState(0);
  const state = useRecords(
    "shared-bills/share/" + encodeURIComponent(token) + "/",
    publicRequest,
    version,
  );
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Shared bill breakdown";
    const restored = ["robots", "referrer"].map((name) => {
      const existing = document.querySelector('meta[name="' + name + '"]');
      const element = existing || document.createElement("meta");
      const previous = existing?.getAttribute("content");
      element.name = name;
      element.content =
        name === "robots" ? "noindex, nofollow, noarchive" : "no-referrer";
      if (!existing) document.head.appendChild(element);
      return () => {
        if (existing) element.setAttribute("content", previous);
        else element.remove();
      };
    });
    return () => {
      document.title = previousTitle;
      restored.forEach((restore) => restore());
    };
  }, []);
  const retry = () => setVersion((value) => value + 1);
  useEffect(() => {
    document.title = state.data?.title || "Shared bill breakdown";
  }, [state.data?.title, token]);
  return (
    <main className="personal-dashboard min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold">
              {state.data?.title || "Shared bill breakdown"}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <ShieldCheck size={16} aria-hidden="true" />
              Public breakdown · Editing requires the event PIN.
            </p>
            {state.data && (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  {dateLabel(state.data.date)}
                </p>
                <div className="mt-3">
                  <ParticipantAvatars participants={state.data.participants} />
                </div>
              </>
            )}
          </div>
          <Button variant="outline" onClick={retry} disabled={state.loading}>
            <RefreshCw aria-hidden="true" />
            Refresh breakdown
          </Button>
        </header>
        {state.loading ? (
          <p role="status" className="py-8 text-sm text-slate-600">
            Loading shared breakdown…
          </p>
        ) : state.error ? (
          <>
            <EmptyState
              icon={Link2}
              title="This breakdown is unavailable"
              message="The link may have expired or been revoked. Ask the person who shared it for a new link."
            />
            <ErrorState message={state.error} retry={retry} />
          </>
        ) : (
          state.data && (
            <>
              <PublicBillActions
                key={token}
                bill={state.data}
                token={token}
                changed={retry}
              />
              <BillBreakdown bill={state.data} readOnly />
            </>
          )
        )}
        <p className="border-t pt-4 text-xs leading-5 text-slate-600">
          Only this event's breakdown is shared. PIN holders can add people and
          report payments or reimbursements. Reports await owner confirmation;
          recording a payment here does not transfer money.
        </p>
      </div>
    </main>
  );
}
