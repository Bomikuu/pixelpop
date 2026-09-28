import { createElement, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  House,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ListChecks,
  Receipt,
  CalendarDays,
  ChartNoAxesCombined,
  FileChartColumn,
  Settings,
  Plus,
  Menu,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  HeartHandshake,
  Utensils,
} from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { Button } from "./ui/button";
import { TooltipProvider } from "./ui/tooltip";
import FormDialog from "./components/forms/FormDialog";
import { DeleteDialog, HistoryDialog } from "./components/ActionDialogs";
import GlobalSearch from "./components/GlobalSearch";
import RecordList from "./components/RecordList";
import SummaryTiles from "./components/SummaryTiles";
import DashboardCompanion from "./components/DashboardCompanion";
import DashboardToasts from "./components/DashboardToasts";
import DatabaseBackup from "./components/DatabaseBackup";
import CalendarDialog from "./components/CalendarDialog";
import { EmptyState, ErrorState, Panel } from "./components/Panel";
import OverviewView from "./views/OverviewView";
import InsightsView from "./views/InsightsView";
import CalendarView from "./views/CalendarView";
import FundsView from "./views/FundsView";
import PeopleView from "./views/PeopleView";
import PersonHistoryView from "./views/PersonHistoryView";
import SharedBillView from "./views/SharedBillView";
import AssetDetailView from "./views/AssetDetailView";
import NutritionView from "./views/NutritionView";
import NutritionDateControls from "./components/nutrition/NutritionDateControls";
import { money, today } from "./lib/format";
import "./styles/theme.css";

const tabs = [
  ["", "Dashboard", LayoutDashboard, "Overview"],
  ["accounts", "Accounts & cards", Wallet, "Money"],
  ["assets", "Assets", House, "Money"],
  ["funds", "Benefits & investments", PiggyBank, "Money"],
  ["people", "People & money", HeartHandshake, "Money"],
  ["transactions", "Transactions", ArrowLeftRight, "Money"],
  ["income", "Income", ArrowDownLeft, "Money"],
  ["expenses", "Expenses", ArrowUpRight, "Money"],
  ["deadlines", "Tasks & deadlines", ListChecks, "Planning"],
  ["bills", "Bills", Receipt, "Planning"],
  ["calendar", "Calendar", CalendarDays, "Planning"],
  ["nutrition", "Nutrition", Utensils, "Wellbeing"],
  ["spending", "Spending", ChartNoAxesCombined, "Insights"],
  ["reports", "Monthly reports", FileChartColumn, "Insights"],
  ["settings", "Settings", Settings, "Workspace"],
];

export default function Dashboard() {
  const navigateRouter = useNavigate(),
    location = useLocation();
  const [params, setParams] = useSearchParams();
  const selectedMonth = /^\d{4}-\d{2}$/.test(params.get("month") || "")
    ? params.get("month")
    : today().slice(0, 7);
  const routeParts = location.pathname
    .slice("/dashboard".length)
    .replace(/^\//, "")
    .split("/");
  const tab = routeParts[0];
  const personKey = tab === "people" ? routeParts[1] : undefined;
  const assetId = tab === "assets" ? routeParts[1] : undefined;
  const sharedBillRoute = tab === "people" && routeParts[1] === "shared";
  const sharedBillId = sharedBillRoute ? routeParts[2] : undefined;
  const current = tabs.find((t) => t[0] === (tab === "loans" ? "people" : tab));
  const dashboard = useDashboardData(selectedMonth);
  const [mobileNav, setMobileNav] = useState(false);
  const [nutritionDate, setNutritionDate] = useState(today);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return (
        localStorage.getItem("personal-dashboard-nav-collapsed") === "true"
      );
    } catch {
      return false;
    }
  });
  const toggleSidebar = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(
          "personal-dashboard-nav-collapsed",
          String(!value),
        );
      } catch {
        /* Browser storage is optional. */
      }
      return !value;
    });
  };
  const [dialog, setDialog] = useState(null),
    [deleteTarget, setDeleteTarget] = useState(null),
    [history, setHistory] = useState(null);
  const [notices, setNotices] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarTrigger = useRef(null);
  const calendarEditing = useRef(false);
  const notificationId = useRef(0);
  const [companionReaction, setCompanionReaction] = useState(null);
  const [companionActivity, setCompanionActivity] = useState(null);
  const launchingControl = useRef(null);
  const restoreFocus = (event, removed = false) => {
    event.preventDefault();
    requestAnimationFrame(() => {
      const target =
        !removed && launchingControl.current?.isConnected
          ? launchingControl.current
          : document.querySelector(".personal-dashboard main button");
      target?.focus();
    });
  };
  useEffect(() => {
    if (tab === "loans") {
      navigateRouter(
        "/dashboard/people?month=" + selectedMonth + "&view=loans",
        { replace: true },
      );
    }
  }, [tab, selectedMonth, navigateRouter]);
  useEffect(() => {
    const title = document.title;
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.getAttribute("content");
    const meta = existing || document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    if (!existing) document.head.appendChild(meta);
    document.title =
      (current?.[1] || "Personal dashboard") + " | Personal workspace";
    return () => {
      document.title = title;
      if (existing) meta.setAttribute("content", previous);
      else meta.remove();
    };
  }, [current]);
  const navigate = (target) => {
    navigateRouter(
      "/dashboard" +
        (target ? "/" + (target === "loans" ? "people" : target) : "") +
        "?month=" +
        selectedMonth +
        (target === "loans" ? "&view=loans" : ""),
    );
    setMobileNav(false);
    setCompanionActivity(null);
  };
  const setMonth = (month) =>
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.set("month", month);
      return updated;
    });
  const notify = (text, context) => {
    const id = ++notificationId.current;
    setNotices((items) => [
      ...items.slice(-2),
      { id, text, tone: context?.tone || "success" },
    ]);
    if (context?.action) {
      setCompanionActivity(
        context.action === "added" || context.action === "edited"
          ? "saved-" + context.entity
          : context.action,
      );
      setCompanionReaction({ ...context, id });
    }
  };
  const actions = {
    openForm: (entity, record) => {
      if (
        (entity === "deadline" || entity === "settlement") &&
        record?.financing_asset_id
      ) {
        navigateRouter(
          "/dashboard/assets/" + record.financing_asset_id +
            "?month=" + selectedMonth,
        );
        return;
      }
      launchingControl.current = document.activeElement;
      setDialog({ entity, record });
      setCompanionActivity(entity);
    },
    confirmDelete: (resource, record) => {
      launchingControl.current = document.activeElement;
      setDeleteTarget({ resource, record });
    },
    showHistory: (resource, record) => {
      launchingControl.current = document.activeElement;
      setHistory({ resource, record });
    },
    notify,
  };
  async function searchSelect(row) {
    if (row.tab === "assets") {
      navigateRouter("/dashboard/assets/" + row.id + "?month=" + selectedMonth);
      return;
    }
    navigate(row.tab);
    try {
      const record = await dashboard.request(
        (row.tab === "settings" ? "categories" : row.tab) + "/" + row.id + "/",
      );
      if (record.shared_bill_id) {
        navigateRouter(
          "/dashboard/people/shared/" +
            record.shared_bill_id +
            "?month=" +
            selectedMonth,
        );
        return;
      }
      if (record.financing_asset_id) {
        navigateRouter(
          "/dashboard/assets/" + (record.financing_asset_id || record.id) +
            "?month=" + selectedMonth,
        );
        return;
      }
      const entity =
        {
          accounts: "account",
          assets: "asset",
          loans: "loan",
          deadlines: "deadline",
          settings: "category",
        }[row.tab] || record.kind;
      if (
        record.status === "paid" ||
        record.status === "completed" ||
        record.deadline
      ) {
        notify("This record is settled. View its history in the list.");
        return;
      }
      actions.openForm(entity, record);
    } catch (e) {
      notify(e.message, { tone: "error" });
    }
  }
  if (dashboard.status !== "ready")
    return (
      <main className="personal-dashboard grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          {dashboard.status === "denied" ? (
            <>
              <ShieldCheck
                className="mx-auto mb-5 text-slate-500"
                size={32}
                aria-hidden="true"
              />
              <h1 className="text-2xl font-semibold">
                This page is not accessible.
              </h1>
              <p className="mt-3 text-base text-slate-600">
                You need to be logged in to view your personal dashboard.
              </p>
            </>
          ) : dashboard.status === "error" ? (
            <ErrorState message={dashboard.error} retry={dashboard.refresh} />
          ) : (
            <p role="status" className="text-sm text-slate-600">
              Verifying your Django session…
            </p>
          )}
        </div>
      </main>
    );
  const shared = { dashboard, month: selectedMonth, ...actions };
  return (
    <TooltipProvider>
      <div
        className={
          "personal-dashboard min-h-screen bg-slate-50 lg:grid " +
          (collapsed
            ? "lg:grid-cols-[80px_minmax(0,1fr)]"
            : "lg:grid-cols-[248px_minmax(0,1fr)]")
        }
      >
        <aside
          data-dashboard-sidebar
          className="border-b bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r"
        >
          <div
            className={
              "flex items-center justify-between gap-3 px-4 py-5 " +
              (collapsed ? "lg:flex-col lg:px-2" : "")
            }
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-[var(--pd-primary)] text-white">
                <Wallet size={20} aria-hidden="true" />
              </span>
              <span
                className={
                  "text-sm font-semibold " + (collapsed ? "lg:hidden" : "")
                }
              >
                Personal workspace
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle dashboard navigation"
              aria-expanded={mobileNav}
              aria-controls="dashboard-navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden shrink-0 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              aria-controls="dashboard-navigation"
              onClick={toggleSidebar}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </div>
          <nav
            id="dashboard-navigation"
            aria-label="Dashboard"
            className={
              (mobileNav ? "block" : "hidden") + " space-y-1 px-3 pb-5 lg:block"
            }
          >
            {tabs.map(([path, label, icon, group], index) => (
              <div key={path}>
                {index > 0 && group !== tabs[index - 1][3] && (
                  <p
                    className={
                      "px-3 pb-2 pt-5 text-xs font-medium text-slate-500 " +
                      (collapsed ? "lg:hidden" : "")
                    }
                  >
                    {group}
                  </p>
                )}
                <Button
                  asChild
                  variant="ghost"
                  className={
                    "w-full justify-start px-3 font-normal " +
                    (collapsed ? "lg:justify-center lg:px-0 " : "") +
                    (tab === path
                      ? "bg-blue-50 text-[var(--pd-primary)]"
                      : "text-slate-600")
                  }
                >
                  <a
                    href={
                      "/dashboard" +
                      (path ? "/" + path : "") +
                      "?month=" +
                      selectedMonth
                    }
                    aria-current={tab === path ? "page" : undefined}
                    aria-label={label}
                    title={collapsed ? label : undefined}
                    onClick={(event) => {
                      if (!event.metaKey && !event.ctrlKey) {
                        event.preventDefault();
                        navigate(path);
                      }
                    }}
                  >
                    {createElement(icon, { size: 17, "aria-hidden": true })}
                    <span className={collapsed ? "lg:hidden" : ""}>
                      {label}
                    </span>
                  </a>
                </Button>
              </div>
            ))}
          </nav>
          <p
            className={
              "hidden border-t px-5 py-4 text-xs leading-5 text-slate-500 " +
              (collapsed ? "" : "lg:block")
            }
          >
            Private workspace
            <br />
            Signed in as {dashboard.data.user.name}
          </p>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-4 border-b pb-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {!tab && (
                  <img
                    src="/portfolio/assets/mico-ang-pixel-portrait.webp"
                    alt="Miku’s pixel portrait"
                    width="36"
                    height="36"
                    className="size-9 shrink-0 object-contain [image-rendering:pixelated]"
                  />
                )}
                <div className="min-w-0">
                  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">Workspace</span>
                    <ChevronRight size={14} className="text-slate-500" aria-hidden="true" />
                    <h1 className="text-sm! leading-5! font-semibold text-slate-950">
                      {tab ? current?.[1] || "Page not found" : "Welcome back, Miku!"}
                    </h1>
                  </nav>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {tab === "nutrition"
                      ? "Meals, macros, weight readings, and your own daily target."
                      : "Your money, expenses, bills, and deadlines in one place."}
                    <span className="inline-block whitespace-nowrap">
                      <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
                      <time dateTime={today()}>
                        {new Intl.DateTimeFormat("en-PH", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "Asia/Manila",
                        }).format(new Date())}
                      </time>
                    </span>
                  </p>
                </div>
              </div>
              {tab === "nutrition" ? <NutritionDateControls date={nutritionDate} onChange={setNutritionDate} /> : <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <label htmlFor="workspace-month" className="sr-only">
                  Summary month
                </label>
                <input
                  id="workspace-month"
                  type="month"
                  className="h-9 w-[10.5rem] rounded-md border bg-white px-3 text-sm"
                  value={selectedMonth}
                  onChange={(e) => {
                    if (e.target.value) setMonth(e.target.value);
                  }}
                />
                <GlobalSearch request={dashboard.request} select={searchSelect} />
              </div>}
            </div>
            {!tab && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  ref={calendarTrigger}
                  variant="outline"
                  onClick={() => {
                    calendarEditing.current = false;
                    setCalendarOpen(true);
                  }}
                >
                  <CalendarDays aria-hidden="true" />
                  View calendar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => actions.openForm("deadline")}
                >
                  <Plus />
                  Add task / bill
                </Button>
                <Button onClick={() => actions.openForm("expense")}>
                  <Plus />
                  Add expense
                </Button>
              </div>
            )}
          </header>
          {tab !== "nutrition" && dashboard.data.overview.attention.overdue > 0 && (
            <div
              role="status"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <p>
                <strong>
                  {dashboard.data.overview.attention.overdue} overdue items
                </strong>{" "}
                across all months need attention.
              </p>
              <Button variant="outline" onClick={() => navigate("deadlines")}>
                Review deadlines
              </Button>
            </div>
          )}
          {!current ? (
            <EmptyState
              title="This dashboard page does not exist"
              action={
                <Button onClick={() => navigate("")}>Back to dashboard</Button>
              }
            />
          ) : tab === "" ? (
            <OverviewView {...shared} navigate={navigate} />
          ) : ["spending", "reports"].includes(tab) ? (
            <InsightsView dashboard={dashboard} reports={tab === "reports"} />
          ) : tab === "calendar" ? (
            <CalendarView
              dashboard={dashboard}
              month={selectedMonth}
              setMonth={setMonth}
              openForm={actions.openForm}
            />
          ) : tab === "nutrition" ? (
            <NutritionView request={dashboard.request} notify={notify} date={nutritionDate} onLeave={() => navigate("")} />
          ) : tab === "funds" ? (
            <FundsView {...shared} />
          ) : tab === "assets" && assetId ? (
            /^\d+$/.test(assetId) && !routeParts.slice(2).some(Boolean) ? (
              <AssetDetailView key={assetId} assetId={assetId} {...shared} />
            ) : (
              <EmptyState
                title="This asset page does not exist"
                action={<Button onClick={() => navigate("assets")}>Back to assets</Button>}
              />
            )
          ) : tab === "people" || tab === "loans" ? (
            sharedBillRoute ? (
              /^\d+$/.test(sharedBillId || "") &&
              !routeParts.slice(3).some(Boolean) ? (
                <SharedBillView
                  key={sharedBillId}
                  billId={sharedBillId}
                  {...shared}
                />
              ) : (
                <EmptyState
                  title="This shared bill page does not exist"
                  action={
                    <Button
                      onClick={() =>
                        navigateRouter(
                          "/dashboard/people?view=shared&month=" +
                            selectedMonth,
                        )
                      }
                    >
                      Back to shared bills
                    </Button>
                  }
                />
              )
            ) : personKey ? (
              /^[a-f0-9]{40}$/.test(personKey) &&
              !routeParts.slice(2).some(Boolean) ? (
                <PersonHistoryView
                  key={personKey}
                  personKey={personKey}
                  {...shared}
                />
              ) : (
                <EmptyState
                  title="This person history page does not exist"
                  action={
                    <Button onClick={() => navigate("people")}>
                      Back to People & money
                    </Button>
                  }
                />
              )
            ) : (
              <PeopleView {...shared} />
            )
          ) : tab === "settings" ? (
            <div className="space-y-6">
              <SummaryTiles
                items={[
                  {
                    label: "Current balance",
                    value: money(dashboard.data.overview.position.available),
                    icon: "balance",
                  },
                  {
                    label: "Monthly budget",
                    value: money(dashboard.data.settings.monthly_budget),
                    icon: "budget",
                  },
                  {
                    label: "Category budgets",
                    value:
                      dashboard.data.overview.configuration.category_budgets,
                    icon: "count",
                  },
                  {
                    label: "Active schedules",
                    value: dashboard.data.overview.configuration.schedules,
                    icon: "deadline",
                  },
                ]}
              />
              <Panel
                title="Budget & workspace"
                description="Timezone: Asia/Manila. Currency: Philippine Peso. No bank connection is required."
                action={
                  <Button
                    onClick={() =>
                      actions.openForm("budget", dashboard.data.settings)
                    }
                  >
                    Set monthly budget
                  </Button>
                }
              >
                <p className="text-sm text-slate-600">
                  Opening balances and corrections belong to Accounts & cards.
                  Categories and recurring schedules are managed below.
                </p>
              </Panel>
              <RecordList
                resource="categories"
                title="Categories & budgets"
                {...shared}
              />
              <DatabaseBackup
                allowed={dashboard.data.user.can_backup}
                notify={notify}
              />
              <RecordList
                resource="schedules"
                title="Recurring schedules"
                {...shared}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {tab === "accounts" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => actions.openForm("movement")}
                  >
                    <ArrowLeftRight />
                    Transfer / card payment
                  </Button>
                </div>
              )}
              <RecordList
                key={tab}
                resource={
                  {
                    income: "transactions",
                    expenses: "transactions",
                    bills: "deadlines",
                  }[tab] || tab
                }
                kind={
                  tab === "income"
                    ? "income"
                    : tab === "expenses"
                      ? "expense"
                      : undefined
                }
                bills={tab === "bills"}
                title={current[1]}
                fixedParams={
                  tab === "accounts" ? { exclude_funds: "1" } : undefined
                }
                {...shared}
              />
              {tab === "transactions" && (
                <RecordList
                  resource="movements"
                  title="Transfers, card payments & loan movements"
                  {...shared}
                />
              )}
            </div>
          )}
        </main>
        <DashboardCompanion
          tab={tab}
          overdue={dashboard.data.overview.attention.overdue}
          activity={companionActivity}
          reaction={companionReaction}
        />
        <DashboardToasts
          notices={notices}
          dismiss={(id) =>
            setNotices((items) => items.filter((item) => item.id !== id))
          }
        />
        {dialog && (
          <FormDialog
            key={dialog.entity + "-" + (dialog.record?.id || "new")}
            {...dialog}
            data={dashboard.data}
            mutate={dashboard.mutate}
            close={() => setDialog(null)}
            notify={notify}
            restoreFocus={restoreFocus}
          />
        )}
        {calendarOpen && (
          <CalendarDialog
            dashboard={dashboard}
            initialMonth={selectedMonth}
            close={() => setCalendarOpen(false)}
            restoreFocus={(event) => {
              event.preventDefault();
              if (!calendarEditing.current)
                requestAnimationFrame(() => calendarTrigger.current?.focus());
            }}
            openForm={(entity, record) => {
              calendarEditing.current = true;
              setCalendarOpen(false);
              actions.openForm(entity, record);
              launchingControl.current = calendarTrigger.current;
            }}
          />
        )}
        {deleteTarget && (
          <DeleteDialog
            target={deleteTarget}
            mutate={dashboard.mutate}
            close={() => setDeleteTarget(null)}
            notify={notify}
            restoreFocus={(event) => restoreFocus(event, true)}
          />
        )}
        {history && (
          <HistoryDialog
            target={history}
            request={dashboard.request}
            version={dashboard.version}
            close={() => setHistory(null)}
            restoreFocus={restoreFocus}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
