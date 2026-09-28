import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useRecords } from "../hooks/useDashboardData";
import { dateLabel, monthLabel, money, today } from "../lib/format";
import { EmptyState, ErrorState } from "./Panel";
import UrgencyBadge from "./UrgencyBadge";
import RecordIdentity from "./RecordIdentity";

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function monthDays(month) {
  const first = new Date(month + "-01T12:00:00Z");
  const count = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const days = Array.from(
    { length: Math.ceil((offset + count) / 7) * 7 },
    (_, index) => {
      const number = index - offset + 1;
      return number > 0 && number <= count
        ? month + "-" + String(number).padStart(2, "0")
        : null;
    },
  );
  return Array.from({ length: days.length / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );
}
function entryType(row) {
  return row.kind === "task" || row.kind === "reminder"
    ? "Task"
    : row.settlement_kind === "loan_collection"
      ? "Collection"
      : "Bill";
}
function settled(row) {
  return ["paid", "completed"].includes(row.status);
}
function eventStyle(row) {
  if (settled(row)) return "border-slate-200 bg-slate-100 text-slate-600";
  if (row.urgency === "overdue") return "border-red-200 bg-red-50 text-red-900";
  if (row.urgency === "today")
    return "border-amber-200 bg-amber-50 text-amber-900";
  return entryType(row) === "Task"
    ? "border-blue-200 bg-blue-50 text-blue-900"
    : "border-teal-200 bg-teal-50 text-teal-900";
}

export default function CalendarDialog({
  dashboard,
  initialMonth,
  close,
  openForm,
  restoreFocus,
}) {
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(() =>
    today().startsWith(initialMonth) ? today() : initialMonth + "-01",
  );
  const state = useRecords(
    "calendar/?view=month&month=" + month,
    dashboard.request,
    dashboard.version,
  );
  const groups = useMemo(() => {
    const byDate = {};
    for (const row of state.data?.results || []) {
      if (row.calendar_kind !== "deadline") continue;
      (byDate[row.due_date] ||= []).push(row);
    }
    return byDate;
  }, [state.data]);
  const selected = groups[day] || [];
  const details = useRef(null);
  function showDay(date) {
    setDay(date);
    requestAnimationFrame(() => {
      details.current?.scrollIntoView({ block: "nearest" });
    });
  }
  function moveMonth(offset) {
    const date = new Date(month + "-01T12:00:00Z");
    date.setUTCMonth(date.getUTCMonth() + offset);
    const next = date.toISOString().slice(0, 7);
    setMonth(next);
    setDay(next + "-01");
  }
  function selectItem(row) {
    if (!settled(row)) openForm("deadline", row);
    else showDay(row.due_date);
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        aria-modal="true"
        onCloseAutoFocus={restoreFocus}
        className="personal-dashboard flex max-h-[90dvh] flex-col gap-4 overflow-hidden bg-white sm:max-w-[calc(100%-2rem)] lg:w-[75vw] lg:max-w-[75vw]"
      >
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays size={20} aria-hidden="true" />
            Bills & tasks calendar
          </DialogTitle>
          <DialogDescription>
            Items appear on their due dates. Select a date to see everything, or
            an outstanding item to edit it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft />
            </Button>
            <h2
              className="min-w-32 text-center text-base font-semibold"
              aria-live="polite"
            >
              {monthLabel(month)}
            </h2>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMonth(today().slice(0, 7));
              setDay(today());
            }}
          >
            Today
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Receipt size={14} aria-hidden="true" />
              Bills / collections
            </span>
            <span className="flex items-center gap-1.5">
              <ListChecks size={14} aria-hidden="true" />
              Tasks
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} aria-hidden="true" />
              Paid / completed stay visible
            </span>
          </div>
          {state.error ? (
            <ErrorState message={state.error} retry={dashboard.refresh} />
          ) : (
            <>
              {state.loading && (
                <p role="status" className="text-sm text-slate-600">
                  Loading bills and tasks…
                </p>
              )}
              <p className="text-xs text-slate-500 sm:hidden">
                Swipe the calendar horizontally to see all dates.
              </p>
              <div
                className="overflow-x-auto rounded-md border"
                aria-busy={state.loading}
              >
                <table className="w-full min-w-[672px] table-fixed border-collapse text-left">
                  <caption className="sr-only">
                    Bills and tasks for {monthLabel(month)}
                  </caption>
                  <thead className="bg-slate-50">
                    <tr>
                      {week.map((name) => (
                        <th
                          key={name}
                          scope="col"
                          className="border-b px-3 py-2 text-xs font-semibold text-slate-600"
                        >
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthDays(month).map((dates, index) => (
                      <tr key={index}>
                        {dates.map((date, column) => (
                          <td
                            key={date || column}
                            className={
                              "h-32 border-b border-r p-2 align-top last:border-r-0 " +
                              (!date
                                ? "bg-slate-50"
                                : date === day
                                  ? "bg-blue-50/40"
                                  : "bg-white")
                            }
                          >
                            {date && (
                              <>
                                <button
                                  type="button"
                                  className={
                                    "mb-2 grid size-7 place-items-center rounded-full text-xs font-semibold hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)] " +
                                    (date === today()
                                      ? "bg-[var(--pd-primary)] text-white hover:bg-[var(--pd-primary-hover)]"
                                      : "text-slate-800")
                                  }
                                  aria-label={
                                    "Show items for " + dateLabel(date)
                                  }
                                  aria-pressed={date === day}
                                  aria-current={
                                    date === today() ? "date" : undefined
                                  }
                                  onClick={() => setDay(date)}
                                >
                                  {Number(date.slice(-2))}
                                </button>
                                <ul className="space-y-1">
                                  {(groups[date] || [])
                                    .slice(0, 3)
                                    .map((row) => {
                                      const Icon = settled(row)
                                        ? CheckCircle2
                                        : entryType(row) === "Task"
                                          ? ListChecks
                                          : Receipt;
                                      return (
                                        <li key={row.id}>
                                          <button
                                            type="button"
                                            onClick={() => selectItem(row)}
                                            className={
                                              "flex w-full items-start gap-1 rounded border px-1.5 py-1 text-left text-[11px] leading-4 transition-colors hover:brightness-95 " +
                                              eventStyle(row)
                                            }
                                            aria-label={`${row.title}, ${entryType(row)}, ${row.status}, ${dateLabel(date)}. ${settled(row) ? "View details" : "Edit item"}`}
                                            title={row.title}
                                          >
                                            <Icon
                                              className="mt-0.5 size-3 shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span className="min-w-0 truncate">
                                              {row.due_time
                                                ? row.due_time.slice(0, 5) + " "
                                                : ""}
                                              {row.title}
                                            </span>
                                          </button>
                                        </li>
                                      );
                                    })}
                                </ul>
                                {(groups[date]?.length || 0) > 3 && (
                                  <button
                                    type="button"
                                    className="mt-1 bg-transparent px-1 text-xs font-medium text-[var(--pd-primary)] hover:underline"
                                    onClick={() => showDay(date)}
                                  >
                                    +{groups[date].length - 3} more
                                    <span className="sr-only">
                                      {" "}
                                      on {dateLabel(date)}
                                    </span>
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <section
                ref={details}
                className="rounded-md border p-4"
                aria-labelledby="calendar-day-title"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 id="calendar-day-title" className="text-sm font-semibold">
                    {dateLabel(day)}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openForm("deadline", { due_date: day })}
                  >
                    <Plus aria-hidden="true" />
                    Add task / bill
                  </Button>
                </div>
                {!state.loading &&
                  (!selected.length ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="Nothing scheduled"
                      message="Add a task or bill for this date."
                    />
                  ) : (
                    <ul className="divide-y">
                      {selected.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div>
                            <RecordIdentity
                              resource="deadlines"
                              row={row}
                              label={row.title}
                            />
                            <p className="mt-1 text-xs text-slate-600">
                              {entryType(row)} ·{" "}
                              {row.amount == null
                                ? "No amount set"
                                : row.financing_asset_id && row.status === "pending"
                                  ? money(row.remaining_due) + " left of " + money(row.amount)
                                  : money(row.amount)}
                              {row.due_time
                                ? " · " + row.due_time.slice(0, 5) + " PHT"
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <UrgencyBadge state={row.urgency} />
                            {!settled(row) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectItem(row)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ))}
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
