import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Receipt, ChevronRight } from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { EmptyState, ErrorState } from "../components/Panel";
import ParticipantAvatars from "../components/shared-bills/ParticipantAvatars";
import CreateBillDialog from "../components/shared-bills/CreateBillDialog";
import { money, dateLabel } from "../lib/format";

export default function SharedBillsView({ dashboard, month, notify }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false),
    [period, setPeriod] = useState("month");
  const [archive, setArchive] = useState("active"),
    [page, setPage] = useState(1);
  const state = useRecords(
    "shared-bills/?page=" +
      page +
      (period === "month" ? "&month=" + month : "") +
      (archive === "archived" ? "&archived=1" : ""),
    dashboard.request,
    dashboard.version,
  );
  useEffect(() => {
    if (state.data)
      setPage((value) =>
        Math.min(value, Math.max(1, Math.ceil(state.data.count / 20))),
      );
  }, [state.data]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Keep the group's total separate from your spending. Your contribution
          becomes an expense only when you record your payment.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          New shared bill
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={period}
          onValueChange={(value) => {
            setPeriod(value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Shared bill period" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="personal-dashboard">
            <SelectItem value="month">Summary month</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={archive}
          onValueChange={(value) => {
            setArchive(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Shared bill archive filter"
            className="w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="personal-dashboard">
            <SelectItem value="active">Active bills</SelectItem>
            <SelectItem value="archived">Archived bills</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-600">
          {state.data?.count ?? "…"} shared bills
        </span>
      </div>
      {state.loading ? (
        <p role="status" className="py-8 text-sm text-slate-600">
          Loading shared bills…
        </p>
      ) : state.error ? (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      ) : !state.data?.results.length ? (
        <EmptyState
          icon={Receipt}
          title="No shared bills in this view"
          message="Create a dinner, trip, or other group breakdown—or change the period filter."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.data.results.map((bill) => (
              <Link
                key={bill.id}
                to={"/dashboard/people/shared/" + bill.id + "?month=" + month}
                className="group min-w-0 space-y-4 rounded-lg border bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-slate-950">
                      {bill.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {dateLabel(bill.date)} · {bill.category_name}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-400 group-hover:text-[var(--pd-primary)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-wrap justify-between gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-600">Group total</p>
                    <p className="mt-1 font-medium tabular-nums">
                      {money(bill.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Your contribution</p>
                    <p className="mt-1 font-semibold text-[var(--pd-primary)] tabular-nums">
                      {money(bill.my_share)}
                    </p>
                  </div>
                </div>
                <ParticipantAvatars participants={bill.participants} />
                <p className="border-t pt-3 text-xs text-slate-600">
                  {bill.archived
                    ? "Archived"
                    : bill.all_paid
                      ? "All paid · volunteer coverage agreed"
                      : bill.participants.every(
                            (person) => Number(person.remaining) <= 0,
                          ) &&
                          Number(bill.remaining_bill) <= 0 &&
                          Number(bill.reimbursement_due || 0) <= 0
                        ? "Settled"
                        : "Payments outstanding"}
                </p>
              </Link>
            ))}
          </div>
          <div className="flex justify-between gap-3 border-t pt-4 text-sm text-slate-600">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!state.data.previous}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!state.data.next}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      {creating && (
        <CreateBillDialog
          {...{ dashboard, notify }}
          close={() => setCreating(false)}
          created={(bill) => {
            setCreating(false);
            navigate("/dashboard/people/shared/" + bill.id + "?month=" + month);
          }}
        />
      )}
    </div>
  );
}
