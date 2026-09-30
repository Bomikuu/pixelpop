import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Pencil,
  Trash2,
  History,
  ArrowUpRight,
  Check,
  ArrowLeftRight,
  Plus,
  Receipt,
  ArrowDownLeft,
  ListChecks,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import SummaryTiles from "./SummaryTiles";
import MoneyFlowAmount from "./MoneyFlowAmount";
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
  const f = (label, value, icon, monetary = true, direction) => ({
    label,
    value: monetary
      ? direction
        ? <MoneyFlowAmount amount={value} direction={direction} />
        : money(value)
      : (value ?? 0),
    icon,
  });
  if (resource === "transactions" && kind === "income")
    return [
      f("Received income", values.income, "income", true, "in"),
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
      f("Total spent", values.expenses, "expenses", true, "out"),
      f("Spent today in filter", values.today_spent, "expenses", true, "out"),
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
      f("Received income", values.income, "income", true, "in"),
      f("Expected income", values.expected, "income"),
      f("Expenses", values.expenses, "expenses", true, "out"),
      f("Net income less expenses", values.net, "balance"),
      f("Records", values.count, "count", false),
    ];
  if (resource === "deadlines" && bills)
    return [
      f("Priced bill total", values.total, "debt"),
      f("Paid", values.paid, "completed", true, "out"),
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
  if (resource === "assets") {
    const assetValue = Number(values.value);
    const ratio = (amount) =>
      assetValue > 0
        ? ((Number(amount || 0) / assetValue) * 100).toFixed(1) + "%"
        : "N/A";
    return [
      f("Estimated asset value", values.value, "assetValue"),
      f("Financing principal", values.financing_debt, "financing"),
      f("Estimated equity", values.estimated_equity, "assetEquity"),
      f("Equity ratio", ratio(values.estimated_equity), "equityRatio", false),
      f("Debt ratio", ratio(values.financing_debt), "debtRatio", false),
      f("Real estate", values.house, "realEstate"),
      f("Vehicles", values.car, "vehicle"),
      f("Other assets", values.other, "otherAsset"),
      f("Assets", values.count, "count", false),
    ];
  }
  if (resource === "loans")
    return [
      f("Outstanding", values.outstanding, "loans"),
      f("Principal lent", values.lent, "loans", true, "out"),
      f("Repaid", values.repaid, "income", true, "in"),
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
      f("Contributed · selected month", values.contributions, "income", true, "out"),
      f("Withdrawn · selected month", values.withdrawals, "expenses", true, "in"),
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
      f("Card repayments", values.card_payments, "debt", true, "out"),
      f("Loan disbursements", values.lent, "loans", true, "out"),
      f("Loan collections", values.collected, "income", true, "in"),
      f("Fund contributions", values.contributions, "funds", true, "out"),
      f("Fund withdrawals", values.withdrawals, "balance", true, "in"),
      f("Movements", values.count, "count", false),
    ];
  return [f("Records", values.count, "count", false)];
}

function periodParams(period, month, start, end) {
  const current = today();
  if (period === "undated") return { undated: "1" };
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

const recentChartConfig = {
  income: { label: "Received income", color: "var(--chart-3)" },
  expenses: { label: "Expenses", color: "var(--chart-1)" },
};

function RecentTransactionsChart({ rows = [] }) {
  const values = rows.map((row) => ({
    ...row,
    income: Number(row.income || 0),
    expenses: Number(row.expenses || 0),
  }));
  return (
    <section className="min-w-0 rounded-lg border border-[var(--pd-border)] bg-white p-4 lg:col-span-3 xl:col-span-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">Income vs. expenses</h3>
        <span className="text-xs text-slate-600">12 months to selected month</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[var(--chart-3)]" aria-hidden="true" />Received income</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[var(--chart-1)]" aria-hidden="true" />Expenses</span>
      </div>
      {values.some((row) => row.income || row.expenses) ? (
        <ChartContainer config={recentChartConfig} className="h-44 w-full">
          <BarChart accessibilityLayer data={values} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tickFormatter={(label) => label.slice(0, 3)} />
            <YAxis tickFormatter={(value) => "₱" + new Intl.NumberFormat("en-PH", { notation: "compact" }).format(value)} tickLine={false} axisLine={false} width={58} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{recentChartConfig[name]?.label}: <MoneyFlowAmount amount={value} direction={name === "income" ? "in" : "out"} /></span>} />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="grid h-44 place-items-center text-center text-sm text-slate-600">No income or expenses to chart yet.</p>
      )}
    </section>
  );
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
  headerActions,
  accountScoped = false,
  hideAnalytics = false,
  initialTransactionKind = "",
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState("month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);
  const [transactionKind, setTransactionKind] = useState(initialTransactionKind);
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
  const recent = compact && resource === "transactions";
  const showsTransactionTypeFilter =
    resource === "transactions" && !kind && (recent || accountScoped || !compact);
  const displayedKind =
    kind || (resource === "transactions" && !compact && !accountScoped ? transactionKind : "");
  const searchId = resource + (fixedParams?.coverage ? "-coverage-" + fixedParams.coverage : "") + "-search";
  const params = new URLSearchParams({
    page: String(page),
    page_size: recent ? "10" : compact ? "100" : "20",
    ...((dated && period !== "undated") || kind === "fund" ? { chart_month: month } : {}),
    ...(dated && (!compact || recent) ? periodParams(period, month, start, end) : {}),
    ...fixedParams,
  });
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (kind) params.set("kind", kind);
  if (showsTransactionTypeFilter && transactionKind) params.set("kind", transactionKind);
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
                    ...(!compact && displayedKind !== "income" ? ["recipient"] : []),
                    "category_name",
                    "amount",
                    ...(!accountScoped ? ["account_name"] : []),
                    ...(!recent ? ["payment_method"] : []),
                    ...(displayedKind === "income" ? ["receipt_state"] : []),
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
    if (!["task", "reminder"].includes(row.kind)) {
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
    if (recent && field === "date")
      return (
        <span className="block min-w-28 leading-5">
          <span className="block font-medium text-slate-950">{dateLabel(row.date)}</span>
          <span className="block text-xs text-slate-600">
            {new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(new Date(row.date + "T12:00:00"))}
          </span>
        </span>
      );
    if (recent && field === "category_name") {
      const Icon = choiceIcon(row.category_name?.toLowerCase() || "other", row.category_name);
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--pd-soft)] px-2.5 py-1 text-xs font-medium text-slate-700">
          <Icon size={14} aria-hidden="true" />
          {row.category_name || "Other"}
        </span>
      );
    }
    if (recent && field === "account_name") {
      if (!row.account_name) return "—";
      const account = dashboard.data.accounts.find((item) => String(item.id) === String(row.account));
      const AccountIcon = choiceIcon(account?.kind || "bank");
      return (
        <span className="inline-flex min-w-32 items-center gap-2 text-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><AccountIcon size={15} aria-hidden="true" /></span>
          <span className="min-w-0 break-words">{row.account_name}</span>
        </span>
      );
    }
    if (recent && field === "amount") {
      return <MoneyFlowAmount amount={row.amount} direction={row.kind === "income" ? "in" : "out"} />;
    }
    if (resource === "assets" && field === "name")
      return (
        <Link
          to={"/dashboard/assets/" + row.id + "?month=" + month}
          className="inline-flex rounded-sm hover:text-[var(--pd-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
        >
          <RecordIdentity resource={resource} row={row} label={row.name || "—"} />
        </Link>
      );
    if (resource === "deadlines" && field === "title" && row.financing_asset_id)
      return (
        <Link
          to={"/dashboard/assets/" + row.financing_asset_id + "?month=" + month}
          className="inline-flex rounded-sm hover:text-[var(--pd-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
        >
          <RecordIdentity resource={resource} row={row} label={row.title || "—"} />
        </Link>
      );
    if (
      ["name", "title", "person", "recipient"].includes(field) ||
      (resource === "movements" && field === "kind")
    )
      return (
        <span>
          <RecordIdentity
            resource={resource}
            row={row}
            label={(field === "kind" ? words(row[field]) : row[field]) || "—"}
          />
          {accountScoped && field === "name" && row.kind === "income" && row.receipt_state === "expected" && (
            <span className="mt-1 block text-xs font-medium text-amber-800">Expected · not yet in balance</span>
          )}
        </span>
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
          {field === "amount" && ["task", "reminder"].includes(row.kind) && resource === "deadlines" ? (
            <span className="text-slate-500">—</span>
          ) : field === "amount" && row.asset_financing && row.status === "pending" ? (
            <>
              {money(row.remaining_due)}
              <span className="block text-xs text-slate-600">of {money(row.amount)} due</span>
            </>
          ) : row[field] == null ? (
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
            field === "amount" && resource === "transactions" ? (
              <MoneyFlowAmount amount={row[field]} direction={row.kind === "income" ? "in" : "out"} />
            ) : field === "amount" && resource === "movements" && row.kind !== "transfer" ? (
              <MoneyFlowAmount amount={row[field]} direction={["loan_repayment", "fund_withdrawal"].includes(row.kind) ? "in" : "out"} />
            ) : field === "principal" && resource === "loans" ? (
              <MoneyFlowAmount amount={row[field]} direction="out" />
            ) : (
              money(row[field])
            )
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
    (resource === "transactions" ? displayedKind || "expense" : entityMap[resource]);
  return (
    <div className="min-w-0 space-y-4">
      {!compact && !accountScoped && !hideAnalytics && state.data?.summary && (
        <SummaryTiles
          items={fixedParams?.coverage === "1"
            ? [{ label: "Coverage records", value: state.data.summary.count, icon: "count" }]
            : summaries(resource, state.data.summary, displayedKind, bills)}
        />
      )}
      {!compact && !accountScoped && !hideAnalytics && fixedParams?.coverage !== "1" && state.data?.charts && (
        <RecordCharts
          charts={state.data.charts}
          month={month}
          amountDirection={resource === "transactions" && displayedKind === "expense" ? "out" : undefined}
          sideBySide={
            (resource === "transactions" && !kind) ||
            resource === "deadlines" ||
            (resource === "accounts" && kind === "fund" && fixedParams?.coverage === "0")
          }
          assetComposition={resource === "assets"}
        />
      )}
      <Panel
        title={title}
        description={
          accountScoped
            ? "Income and expenses recorded against this account."
            : recent
              ? "Your latest income and expenses, with the selected period applied to the list and totals."
              : compact
                ? undefined
                : resource === "accounts" && fixedParams?.coverage === "1"
                  ? "Keep coverage details here. Premiums belong in Expenses, and coverage does not count toward net worth."
                  : fixedParams?.coverage
                    ? "Expenses linked to this coverage. Change the period to see earlier payments."
                    : dated
                      ? "Summary and records follow this period and filters."
                      : "Current recorded values. Open history for dated movements."
        }
        action={
          headerActions ?? (!compact && !hideAdd && resource === "deadlines" ? (
            <div className="flex flex-wrap gap-2">
              {!bills && (
                <Button onClick={() => openForm("deadline", { kind: "task" })}>
                  <Plus aria-hidden="true" />
                  Add Task
                </Button>
              )}
              {bills && (
                <Button onClick={() => openForm("deadline", { kind: "bill" })}>
                  <Plus aria-hidden="true" />
                  Add Bill
                </Button>
              )}

            </div>
          ) : !compact && !hideAdd && addEntity && resource !== "schedules" ? (
            <Button onClick={() => openForm(addEntity, addRecord)}>
              <Plus aria-hidden="true" />
              Add {words(addEntity).toLowerCase()}
            </Button>
          ) : undefined)
        }
      >
        {(!compact || recent) && (
          <div className={recent ? "mb-5 flex flex-wrap items-end justify-end gap-3" : "mb-4 flex flex-wrap items-end gap-3"}>
            <div className={recent ? "w-full min-w-44 sm:w-64" : "min-w-40 flex-1"}>
              <Label htmlFor={searchId} className={recent ? "sr-only" : "mb-2 block"}>
                {recent ? "Search transactions" : "Search records"}
              </Label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id={searchId}
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
                  placeholder={recent ? "Search transactions..." : "Name, category or notes"}
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
                      document.getElementById(searchId)?.focus();
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
            {dated && (
              <div className="w-full sm:w-44">
                <Label htmlFor={resource + "-period"} className={recent ? "sr-only" : "mb-2 block"}>
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
                      ...(resource === "deadlines" && !bills ? [["undated", "No date"]] : []),
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
                <Label htmlFor={resource + "-category"} className={recent ? "sr-only" : "mb-2 block"}>
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
        {recent && state.data && !state.error && (
          <>
            <div className="grid gap-3 border-b border-[var(--pd-border)] pb-5 lg:grid-cols-3 xl:grid-cols-12">
              <RecentTransactionsChart rows={state.data.charts?.monthly} />
              {[
                { label: "Transactions", value: state.data.summary?.count ?? 0, icon: ListChecks, tone: "bg-blue-50 text-blue-700", surface: "bg-blue-50/30" },
                { label: "Money in", value: <MoneyFlowAmount amount={state.data.summary?.income ?? 0} direction="in" />, icon: ArrowDownLeft, tone: "bg-emerald-50 text-emerald-700", surface: "bg-emerald-50/30" },
                { label: "Money out", value: <MoneyFlowAmount amount={state.data.summary?.expenses ?? 0} direction="out" />, icon: ArrowUpRight, tone: "bg-rose-50 text-rose-700", surface: "bg-rose-50/30" },
              ].map(({ label, value, icon: Icon, tone, surface }) => (
                <div key={label} className={"min-w-0 rounded-lg border border-[var(--pd-border)] p-4 transition-colors hover:border-blue-200 motion-reduce:transition-none lg:col-span-1 xl:col-span-2 " + surface}>
                  <span className={"grid size-9 place-items-center rounded-full " + tone}><Icon size={18} aria-hidden="true" /></span>
                  <p className="mt-4 text-sm text-slate-600">{label}</p>
                  <p className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-600">Search, category and type apply to the chart. Period selection applies to the list and totals.</p>
            <div className="my-4 flex flex-wrap gap-2" role="group" aria-label="Transaction type">
              {[["", "All"], ["income", "Income"], ["expense", "Expenses"]].map(([value, label]) => (
                <Button
                  key={label}
                  size="sm"
                  variant={transactionKind === value ? "secondary" : "ghost"}
                  aria-pressed={transactionKind === value}
                  onClick={() => { setTransactionKind(value); setPage(1); }}
                >
                  {value === "income" ? <ArrowDownLeft aria-hidden="true" /> : value === "expense" ? <ArrowUpRight aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
                  {label}
                </Button>
              ))}
            </div>
          </>
        )}
        {!recent && showsTransactionTypeFilter && state.data && !state.error && (
          <div className="my-4 flex flex-wrap gap-2" role="group" aria-label="Transaction type">
            {[["", "All"], ["income", "Income"], ["expense", "Expenses"]].map(([value, label]) => (
              <Button
                key={label}
                size="sm"
                variant={transactionKind === value ? "secondary" : "ghost"}
                aria-pressed={transactionKind === value}
                onClick={() => { setTransactionKind(value); setPage(1); }}
              >
                {value === "income" ? <ArrowDownLeft aria-hidden="true" /> : value === "expense" ? <ArrowUpRight aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
                {label}
              </Button>
            ))}
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
            title={query || category || (showsTransactionTypeFilter && transactionKind) || (dated && period !== "month") ? "No matching records" : "No records yet"}
            message={
              query || category || (showsTransactionTypeFilter && transactionKind) || (dated && period !== "month")
                ? "Try clearing the search or changing your filters."
                : fixedParams?.coverage
                  ? "No premium payments are recorded for this coverage in this period."
                  : accountScoped
                    ? "No income or expenses are recorded for this account in this period."
                    : "Add a record when you're ready. No sample balances are included."
            }
          />
        ) : (
          <>
            {resource === "accounts" ? (
              <AccountCards
                rows={rows}
                month={month}
                openForm={openForm}
                showHistory={showHistory}
                confirmDelete={confirmDelete}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table className={recent ? "min-w-[760px]" : undefined}>
                  <TableHeader className={recent ? "bg-[var(--pd-soft)]/60" : undefined}>
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
                            className={"max-w-64 whitespace-normal break-words " + (recent ? "align-middle py-3" : "align-top")}
                          >
                            {display(f, row)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {resource === "assets" && (
                              <Button asChild size="sm" variant="outline">
                                <Link to={"/dashboard/assets/" + row.id + "?month=" + month}>
                                  <ArrowUpRight aria-hidden="true" /> View
                                </Link>
                              </Button>
                            )}
                            {resource === "deadlines" && row.financing_asset_id && (
                              <Button asChild size="sm" variant="outline">
                                <Link to={"/dashboard/assets/" + row.financing_asset_id + "?month=" + month}>
                                  <ArrowUpRight aria-hidden="true" /> Asset
                                </Link>
                              </Button>
                            )}
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
                                    aria-label={
                                      (["task", "reminder"].includes(row.kind)
                                        ? "Complete "
                                        : row.financing_asset_id
                                          ? "Open asset to record payment for "
                                          : row.settlement_kind === "loan_collection"
                                            ? "Record collection for "
                                            : "Pay bill ") + row.title
                                    }
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
                              !row.asset_financing &&
                              row.status !== "paid" &&
                              row.status !== "completed" &&
                              !row.deadline &&
                              !(resource === "deadlines" && row.loan) && (
                                <Button
                                  size="icon"
                                  variant={recent ? "outline" : "ghost"}
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
                              !row.asset_financing &&
                              !row.deadline &&
                              !row.schedule &&
                              row.status !== "paid" &&
                              row.status !== "completed" &&
                              row.active !== false &&
                              !(resource === "deadlines" && row.loan) && (
                                <Button
                                  size="icon"
                                  variant={recent ? "outline" : "ghost"}
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
            {(!compact || recent) && (
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
