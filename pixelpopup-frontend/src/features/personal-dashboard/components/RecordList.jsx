import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Pencil,
  Trash2,
  History,
  Check,
  ArrowLeftRight,
  Plus,
  Receipt,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import AccountCards from "./AccountCards";
import RecordIdentity from "./RecordIdentity";
import { choiceIcon } from "../lib/presets";
import { RecordCharts } from "./Charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import SummaryTiles from "./SummaryTiles";
import UrgencyBadge from "./UrgencyBadge";
import { EmptyState, ErrorState, Panel } from "./Panel";
import { dateLabel, money, today, words } from "../lib/format";

const entityMap = {
  accounts: "account",
  assets: "asset",
  loans: "loan",
  deadlines: "deadline",
  categories: "category",
  schedules: "schedule",
};
function summaries(resource, values = {}, kind, bills) {
  const f = (label, value, icon, monetary = true) => ({
    label,
    value: monetary ? money(value) : (value ?? 0),
    icon,
  });
  if (resource === "transactions" && kind === "income")
    return [
      f("Received income", values.income, "income"),
      f("Expected income", values.expected, "income"),
      f("Total income", values.total_income, "income"),
      f(
        "Next expected receipt",
        values.next_receipt ? dateLabel(values.next_receipt) : "None scheduled",
        "deadline",
        false,
      ),
      f("Income records", values.count, "count", false),
    ];
  if (resource === "transactions" && kind === "expense")
    return [
      f("Total spent", values.expenses, "expenses"),
      f("Spent today in filter", values.today_spent, "expenses"),
      f(
        "Largest category",
        values.largest_category || "No expenses",
        "count",
        false,
      ),
      f("Expense records", values.count, "count", false),
    ];
  if (resource === "transactions")
    return [
      f("Received income", values.income, "income"),
      f("Expected income", values.expected, "income"),
      f("Expenses", values.expenses, "expenses"),
      f("Net income less expenses", values.net, "balance"),
      f("Records", values.count, "count", false),
    ];
  if (resource === "deadlines" && bills)
    return [
      f("Priced bill total", values.total, "debt"),
      f("Paid", values.paid, "completed"),
      f("Unpaid", values.unpaid, "debt"),
      f("Overdue", values.overdue, "deadline", false),
      f("Unpriced bills", values.unpriced, "count", false),
      f("Next bill", values.next || "None scheduled", "deadline", false),
    ];
  if (resource === "deadlines")
    return [
      f("Due today", values.today, "deadline", false),
      f("Pending", values.pending, "deadline", false),
      f("Completed / paid", values.completed, "completed", false),
      f("Overdue", values.overdue, "deadline", false),
      f("Next deadline", values.next || "None scheduled", "deadline", false),
    ];
  if (resource === "assets")
    return [
      f("Estimated asset value", values.value, "assets"),
      f("Real estate", values.house, "assets"),
      f("Vehicles", values.car, "assets"),
      f("Other assets", values.other, "assets"),
      f("Assets", values.count, "count", false),
    ];
  if (resource === "loans")
    return [
      f("Outstanding", values.outstanding, "loans"),
      f("Principal lent", values.lent, "loans"),
      f("Repaid", values.repaid, "income"),
      f("Overdue principal", values.overdue, "deadline"),
      f("People", values.people, "count", false),
      f(
        "Next collection",
        values.next_collection
          ? dateLabel(values.next_collection)
          : "Unscheduled",
        "deadline",
        false,
      ),
    ];
  if (resource === "accounts" && kind === "fund")
    return [
      f("Current recorded value", values.funds, "funds"),
      f("Contributed · selected month", values.contributions, "income"),
      f("Withdrawn · selected month", values.withdrawals, "expenses"),
      f("Funds", values.count, "funds", false),
    ];
  if (resource === "accounts")
    return [
      f("Available balance", values.available, "balance"),
      f("Card debt", values.debt, "debt"),
      f("Accounts", values.count, "count", false),
      f(
        "Credit utilization",
        values.utilization == null
          ? "No limits set"
          : Number(values.utilization).toFixed(1) + "%",
        "debt",
        false,
      ),
    ];
  if (resource === "movements")
    return [
      f("Net cash movement", values.net_cash, "balance"),
      f("Card repayments", values.card_payments, "debt"),
      f("Loan disbursements", values.lent, "loans"),
      f("Loan collections", values.collected, "income"),
      f("Fund contributions", values.contributions, "funds"),
      f("Fund withdrawals", values.withdrawals, "balance"),
      f("Movements", values.count, "count", false),
    ];
  return [f("Records", values.count, "count", false)];
}

function periodParams(period, month, start, end) {
  const current = today();
  if (period === "today") return { start: current, end: current };
  if (period === "week") {
    const d = new Date(current + "T12:00:00Z");
    const offset = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - offset);
    const first = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 6);
    return { start: first, end: d.toISOString().slice(0, 10) };
  }
  if (period === "custom")
    return { ...(start ? { start } : {}), ...(end ? { end } : {}) };
  if (period === "all") return {};
  return { month };
}

export default function RecordList({
  resource,
  title,
  dashboard,
  month,
  openForm,
  confirmDelete,
  showHistory,
  notify,
  kind,
  bills = false,
  fixedParams,
  compact = false,
  addEntity: addEntityOverride,
  addRecord,
  hideAdd = false,
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState("month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState(null);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, composing]);
  const dated = ["transactions", "deadlines", "movements"].includes(resource);
  const params = new URLSearchParams({
    page: String(page),
    page_size: compact ? "100" : "20",
    ...(dated || kind === "fund" ? { chart_month: month } : {}),
    ...(dated && !compact ? periodParams(period, month, start, end) : {}),
    ...fixedParams,
  });
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (kind) params.set("kind", kind);
  if (bills) params.set("bills", "1");
  const state = useRecords(
    resource + "/?" + params.toString(),
    dashboard.request,
    dashboard.version,
  );
  const rows = state.data?.results || [];
  const fields =
    resource === "accounts"
      ? ["name", "kind", "balance"]
      : resource === "assets"
        ? ["name", "kind", "value", "valuation_date"]
        : resource === "loans"
          ? ["person", "principal", "outstanding", "due_date"]
          : resource === "categories"
            ? ["name", "monthly_budget"]
            : resource === "schedules"
              ? ["title", "frequency", "amount", "anchor_date"]
              : resource === "movements"
                ? ["kind", "amount", "date", "source_name", "destination_name"]
                : resource === "deadlines"
                  ? ["title", "amount", "due_date", "urgency"]
                  : [
                      "date",
                      "name",
                      ...(!compact && kind !== "income" ? ["recipient"] : []),
                      "category_name",
                      "amount",
                      "account_name",
                      "payment_method",
                      ...(kind === "income" ? ["receipt_state"] : []),
                      ...(!compact ? ["notes"] : []),
                    ];
  const entity = (row) =>
    resource === "transactions"
      ? row.recipient
        ? "giving"
        : row.kind
      : entityMap[resource];
  if (resource === "loans") fields.push("collection_state", "notes");
  async function complete(row) {
    if (
      row.amount != null ||
      ["bill", "subscription", "payment"].includes(row.kind) ||
      row.settlement_kind !== "expense"
    ) {
      openForm("settlement", row);
      return;
    }
    setActing(row.id);
    setActionError("");
    try {
      await dashboard.mutate("deadlines/" + row.id + "/settle/", {});
      notify("Task completed.", { action: "completed", entity: "deadline" });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActing(null);
    }
  }
  function display(field, row) {
    if (field === "recipient" && !row.recipient) return "—";
    if (
      ["name", "title", "person", "recipient"].includes(field) ||
      (resource === "movements" && field === "kind")
    )
      return (
        <RecordIdentity
          resource={resource}
          row={row}
          label={(field === "kind" ? words(row[field]) : row[field]) || "—"}
        />
      );
    if (field === "urgency")
      return (
        <div>
          <UrgencyBadge state={row.urgency} />
          {row.overdue_duration && (
            <p className="mt-1 text-xs text-red-800">{row.overdue_duration}</p>
          )}
        </div>
      );
    if (field === "collection_state")
      return row.collection_state === "unscheduled" ? (
        "Unscheduled"
      ) : (
        <UrgencyBadge state={row.collection_state} />
      );
    if (
      [
        "amount",
        "value",
        "principal",
        "outstanding",
        "balance",
        "monthly_budget",
      ].includes(field)
    )
      return (
        <span className="tabular-nums">
          {row[field] == null ? (
            resource === "deadlines" ? (
              <span className="font-medium text-amber-800">
                {["bill", "subscription", "payment"].includes(row.kind)
                  ? "Needs this month's amount"
                  : "No amount"}
              </span>
            ) : (
              "Not set"
            )
          ) : (
            money(row[field])
          )}
        </span>
      );
    if (field.endsWith("date") || field === "date")
      return (
        <span>
          {dateLabel(row[field])}
          {field === "due_date" && row.due_time && (
            <span className="block text-xs text-slate-600">
              {row.due_time.slice(0, 5)} PHT
            </span>
          )}
        </span>
      );
    if (field === "kind" || field === "frequency") return words(row[field]);
    return row[field] || "—";
  }
  const addEntity =
    addEntityOverride ||
    (resource === "transactions" ? kind || "expense" : entityMap[resource]);
  return (
    <div className="min-w-0 space-y-4">
      {!compact && state.data?.summary && (
        <SummaryTiles
          items={summaries(resource, state.data.summary, kind, bills)}
        />
      )}
      {!compact && state.data?.charts && (
        <RecordCharts charts={state.data.charts} month={month} />
      )}
      <Panel
        title={title}
        description={
          compact
            ? undefined
            : dated
              ? "Summary and records follow this period and filters."
              : "Current recorded values. Open history for dated movements."
        }
        action={
          !compact && !hideAdd && addEntity && resource !== "schedules" ? (
            <Button onClick={() => openForm(addEntity, addRecord)}>
              <Plus aria-hidden="true" />
              Add {words(addEntity).toLowerCase()}
            </Button>
          ) : undefined
        }
      >
        {!compact && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1">
              <Label htmlFor={resource + "-search"} className="mb-2 block">
                Search records
              </Label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id={resource + "-search"}
                  value={search}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={() => setComposing(false)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (!e.target.value) {
                      setQuery("");
                      setPage(1);
                    }
                  }}
                  className="pl-9 pr-10"
                  placeholder="Name, category or notes"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    aria-label="Clear record search"
                    onClick={() => {
                      setSearch("");
                      setQuery("");
                      document.getElementById(resource + "-search")?.focus();
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
            {dated && (
              <div className="w-full sm:w-44">
                <Label htmlFor={resource + "-period"} className="mb-2 block">
                  Period
                </Label>
                <Select
                  value={period}
                  onValueChange={(v) => {
                    setPeriod(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id={resource + "-period"} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="personal-dashboard"
                    position="popper"
                  >
                    {[
                      ["month", "Selected month"],
                      ["today", "Today"],
                      ["week", "This week"],
                      ["custom", "Custom dates"],
                      ["all", "All records"],
                    ].map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {["transactions", "deadlines"].includes(resource) && (
              <div className="w-full sm:w-48">
                <Label htmlFor={resource + "-category"} className="mb-2 block">
                  Category
                </Label>
                <Select
                  value={category || "all"}
                  onValueChange={(v) => {
                    setCategory(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id={resource + "-category"} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="personal-dashboard"
                    position="popper"
                  >
                    <SelectItem value="all">All categories</SelectItem>
                    {dashboard.data.categories.map((c) => {
                      const Icon = choiceIcon(c.name);
                      return (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <Icon
                            size={16}
                            aria-hidden="true"
                            className="text-[var(--pd-primary)]"
                          />
                          {c.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dated && period === "custom" && (
              <>
                <div>
                  <Label htmlFor="record-start">From</Label>
                  <Input
                    id="record-start"
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="record-end">Through</Label>
                  <Input
                    id="record-end"
                    type="date"
                    value={end}
                    onChange={(e) => {
                      setEnd(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        {(state.error || actionError) && (
          <ErrorState
            message={state.error || actionError}
            retry={dashboard.refresh}
          />
        )}
        {state.error ? null : !state.data ? (
          <p role="status" className="py-8 text-sm text-slate-600">
            Loading records…
          </p>
        ) : !rows.length ? (
          <EmptyState
            title={query || category ? "No matching records" : "No records yet"}
            message={
              query || category
                ? "Try clearing the search or changing your filters."
                : "Add a record when you're ready. No sample balances are included."
            }
          />
        ) : (
          <>
            {resource === "accounts" ? (
              <AccountCards
                rows={rows}
                openForm={openForm}
                showHistory={showHistory}
                confirmDelete={confirmDelete}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fields.map((f) => (
                        <TableHead key={f}>
                          {words(f.replace("_name", ""))}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={
                          (row.status && row.status !== "pending") ||
                          row.active === false
                            ? "text-slate-500"
                            : row.urgency === "overdue"
                              ? "bg-red-50/70"
                              : row.urgency === "today"
                                ? "bg-amber-50/70"
                                : ""
                        }
                      >
                        {fields.map((f) => (
                          <TableCell
                            key={f}
                            className="max-w-64 whitespace-normal break-words align-top"
                          >
                            {display(f, row)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {row.shared_bill_id && (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to={
                                    "/dashboard/people/shared/" +
                                    row.shared_bill_id +
                                    "?month=" +
                                    month
                                  }
                                >
                                  <Receipt aria-hidden="true" />
                                  Shared bill
                                </Link>
                              </Button>
                            )}
                            {resource === "deadlines" &&
                              row.status === "pending" && (
                                <>
                                  {row.amount == null &&
                                    [
                                      "bill",
                                      "subscription",
                                      "payment",
                                    ].includes(row.kind) &&
                                    row.settlement_kind === "expense" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openForm("deadline", row)
                                        }
                                      >
                                        Enter amount
                                      </Button>
                                    )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={"Complete or pay " + row.title}
                                    disabled={acting === row.id}
                                    onClick={() => complete(row)}
                                  >
                                    <Check />
                                  </Button>
                                </>
                              )}
                            {resource === "loans" &&
                              !row.shared_bill_id &&
                              Number(row.outstanding) > 0 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={
                                    "Record repayment from " + row.person
                                  }
                                  onClick={() =>
                                    openForm("movement", {
                                      kind: "loan_repayment",
                                      loan: row.id,
                                      destination: row.account,
                                      amount: row.outstanding,
                                    })
                                  }
                                >
                                  <ArrowLeftRight />
                                </Button>
                              )}
                            {["accounts", "loans"].includes(resource) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={
                                  "History for " + (row.name || row.person)
                                }
                                onClick={() => showHistory(resource, row)}
                              >
                                <History />
                              </Button>
                            )}
                            {resource === "accounts" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={"Correct " + row.name + " balance"}
                                onClick={() => openForm("adjustment", row)}
                              >
                                <ArrowLeftRight />
                              </Button>
                            )}
                            {entity(row) &&
                              !row.shared_bill_id &&
                              row.status !== "paid" &&
                              row.status !== "completed" &&
                              !row.deadline &&
                              !(resource === "deadlines" && row.loan) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={
                                    "Edit " +
                                    (row.name || row.title || row.person)
                                  }
                                  onClick={() => openForm(entity(row), row)}
                                >
                                  <Pencil />
                                </Button>
                              )}
                            {entity(row) &&
                              !row.shared_bill_id &&
                              !row.deadline &&
                              !row.schedule &&
                              row.status !== "paid" &&
                              row.status !== "completed" &&
                              row.active !== false &&
                              !(resource === "deadlines" && row.loan) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={
                                    "Delete or archive " +
                                    (row.name || row.title || row.person)
                                  }
                                  onClick={() => confirmDelete(resource, row)}
                                >
                                  <Trash2 />
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {!compact && (
              <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
                <span>
                  {state.data.count} records • Page {page}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!state.data.previous}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!state.data.next}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
