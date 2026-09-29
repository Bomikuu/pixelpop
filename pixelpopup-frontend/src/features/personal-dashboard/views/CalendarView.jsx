import { useState } from "react";
import { Plus } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import SummaryTiles from "../components/SummaryTiles";
import { Panel, EmptyState, ErrorState } from "../components/Panel";
import UrgencyBadge from "../components/UrgencyBadge";
import { ComparisonChart } from "../components/Charts";
import { dateLabel, money, today } from "../lib/format";

export default function CalendarView({ dashboard, month, setMonth, openForm, settleDeadline }) {
  const [day, setDay] = useState(() =>
    today().startsWith(month + "-") ? today() : month + "-01",
  );
  const [acting, setActing] = useState(null);
  async function settle(row) {
    if (!["task", "reminder"].includes(row.kind)) {
      await settleDeadline(row);
      return;
    }
    setActing(row.id);
    try {
      await settleDeadline(row);
    } finally {
      setActing(null);
    }
  }
  const selectedDay = day.startsWith(month + "-") ? day : month + "-01";
  const state = useRecords(
    "calendar/?month=" + month + "&day=" + selectedDay,
    dashboard.request,
    dashboard.version,
  );
  const items = state.data?.results || [];
  const selected = items;
  const summary = state.data?.summary || {};
  return (
    <div className="space-y-6">
      <SummaryTiles
        items={[
          { label: "Month items", value: summary.count ?? 0, icon: "count" },
          { label: "Due today", value: summary.today ?? 0, icon: "deadline" },
          {
            label: "Completed / paid",
            value: summary.completed ?? 0,
            icon: "completed",
          },
          {
            label: "Unpaid bills",
            value: money(summary.unpaid ?? 0),
            icon: "debt",
          },
        ]}
      />
      <ComparisonChart
        title="Monthly planning comparison"
        description="Pending versus completed deadlines by due month; income receipts are listed in the calendar separately."
        rows={dashboard.data.overview.charts.bills}
        fields={["pending", "completed"]}
        monetary={false}
        comparisonMonth={month}
      />
      {state.error && (
        <ErrorState message={state.error} retry={dashboard.refresh} />
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel
          title="Monthly calendar"
          description="Highlighted dates contain tasks or bills."
        >
          <Calendar
            mode="single"
            month={new Date(month + "-01T12:00:00")}
            selected={new Date(selectedDay + "T12:00:00")}
            onMonthChange={(d) => {
              const value =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0");
              setMonth(value);
              setDay(value + "-01");
            }}
            onSelect={(d) => {
              if (d)
                setDay(
                  d.getFullYear() +
                    "-" +
                    String(d.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(d.getDate()).padStart(2, "0"),
                );
            }}
            modifiers={{
              scheduled: (state.data?.days || []).map(
                (d) => new Date(d + "T12:00:00"),
              ),
            }}
            modifiersClassNames={{
              scheduled:
                "underline decoration-[var(--pd-primary)] decoration-2 underline-offset-4",
            }}
            weekStartsOn={1}
            className="mx-auto w-full [--cell-size:2.5rem]"
          />
        </Panel>
        <Panel
          title={dateLabel(selectedDay)}
          description="Everything scheduled for the selected day."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => openForm("deadline", { kind: "task", due_date: selectedDay })}>
                <Plus aria-hidden="true" /> Add task
              </Button>
              <Button variant="outline" onClick={() => openForm("deadline", { kind: "bill", due_date: selectedDay })}>
                <Plus aria-hidden="true" /> Add bill
              </Button>
            </div>
          }
        >
          {state.loading ? (
            <p role="status">Loading scheduled items…</p>
          ) : !selected.length ? (
            <EmptyState
              title="Nothing scheduled"
              message="Add a task or bill to plan this day."
            />
          ) : (
            <ul className="divide-y">
              {selected.map((row) => (
                <li
                  key={row.calendar_kind + row.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    {row.calendar_kind === "deadline" && row.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => settle(row)}
                        disabled={acting === row.id}
                        aria-label={
                          (["task", "reminder"].includes(row.kind)
                            ? "Complete task "
                            : row.financing_asset_id
                              ? "Open asset to record payment for "
                              : row.settlement_kind === "loan_collection"
                                ? "Record collection for "
                                : "Pay bill ") + row.title
                        }
                        className="rounded-sm text-left font-medium hover:text-[var(--pd-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
                      >
                        {row.title}
                      </button>
                    ) : (
                      <p className="font-medium">{row.title}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-600">
                      {row.calendar_kind === "income"
                        ? "Income · "
                        : row.settlement_kind === "loan_collection"
                          ? "Incoming collection · "
                          : ["task", "reminder"].includes(row.kind)
                            ? (row.kind === "reminder" ? "Reminder" : "Task")
                            : ""}
                      {!["task", "reminder"].includes(row.kind) && (
                        row.amount == null
                          ? "No fixed amount"
                          : row.financing_asset_id && row.status === "pending"
                            ? money(row.remaining_due) + " left of " + money(row.amount)
                            : money(row.amount)
                      )}
                      {row.due_time
                        ? " · " + row.due_time.slice(0, 5) + " PHT"
                        : ""}
                    </p>
                  </div>
                  {row.calendar_kind === "income" ? (
                    <span className="text-sm text-blue-800">
                      {row.urgency === "expected" ? "Expected" : "Received"}
                    </span>
                  ) : (
                    <UrgencyBadge state={row.urgency} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
