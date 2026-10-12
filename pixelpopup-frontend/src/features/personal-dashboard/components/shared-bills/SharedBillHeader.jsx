import { CalendarDays, Receipt, ShieldCheck, Tag } from "lucide-react";
import { Badge } from "../../ui/badge";
import { dateLabel, money } from "../../lib/format";
import ParticipantAvatars from "./ParticipantAvatars";
import PaymentReceiver from "./PaymentReceiver";

export default function SharedBillHeader({ bill, publicView = false, headingRef, actions }) {
  const Heading = publicView ? "h1" : "h2";
  return (
    <header className="rounded-xl border bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <Receipt size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Heading ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="break-words text-2xl font-semibold">
              {bill?.title || "Shared bill breakdown"}
            </Heading>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              {bill?.date && <span className="flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{dateLabel(bill.date)}</span>}
              {!publicView && bill?.category_name && <span className="flex items-center gap-1.5"><Tag size={15} aria-hidden="true" />{bill.category_name}</span>}
              {publicView && <span className="flex items-center gap-1.5"><ShieldCheck size={15} aria-hidden="true" />Public breakdown</span>}
              {bill?.archived ? <Badge variant="outline">Archived</Badge> : bill?.all_paid && <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">All paid</Badge>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
      </div>
      {bill && (
        <div className="mt-4 grid min-w-0 gap-4 border-t pt-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-2">
            <p className="text-xs text-slate-600">Participants ({bill.participants.length})</p>
            <ParticipantAvatars participants={bill.participants} showNames />
          </div>
          <div className="min-w-0 lg:border-l lg:pl-4">
            <PaymentReceiver bill={bill} stacked className="" />
          </div>
        </div>
      )}
      {publicView ? (
        <p className="mt-4 text-xs text-slate-600">Payments need no PIN; management does.</p>
      ) : bill && (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="text-slate-600">Your agreed contribution</span>
          <span className="text-[var(--pd-primary)] tabular-nums">{money(bill.my_share)}</span>
          <span className="text-xs text-slate-600">The group total is not your expense.</span>
        </p>
      )}
    </header>
  );
}
