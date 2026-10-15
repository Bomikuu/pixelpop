import { createElement, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
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
  ChevronDown,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  HeartHandshake,
  Utensils,
  TriangleAlert,
  BriefcaseBusiness,
  FileClock,
  Lightbulb,
  BookOpenText,
  Bell,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useReminders } from "./hooks/useReminders";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { TooltipProvider } from "./ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import FormDialog from "./components/forms/FormDialog";
import { DeleteDialog, HistoryDialog } from "./components/ActionDialogs";
import GlobalSearch from "./components/GlobalSearch";
import RecordList from "./components/RecordList";
import SummaryTiles from "./components/SummaryTiles";
import DashboardCompanion from "./components/DashboardCompanion";
import DashboardToasts from "./components/DashboardToasts";
import { STANDARD_DASHBOARD_TOASTS_ENABLED } from "../../ui/mascot/dashboardCompanionConfig";
import DatabaseBackup from "./components/DatabaseBackup";
import DashboardLogin from "./components/DashboardLogin";
import BalanceCorrectionView from "./views/BalanceCorrectionView";
import CalendarDialog from "./components/CalendarDialog";
import { EmptyState, ErrorState, Panel } from "./components/Panel";
import OverviewView from "./views/OverviewView";
import InsightsView from "./views/InsightsView";
import CalendarView from "./views/CalendarView";
import FundsView from "./views/FundsView";
import BillsView from "./views/BillsView";
import SubscriptionView from "./views/SubscriptionView";
import SubscriptionAlertsDialog from "./components/subscriptions/SubscriptionAlertsDialog";
import PeopleView from "./views/PeopleView";
import PersonHistoryView from "./views/PersonHistoryView";
import SharedBillView from "./views/SharedBillView";
import AssetDetailView from "./views/AssetDetailView";
import AccountDetailView from "./views/AccountDetailView";
import CashLoanDetailView from "./cash-loans/CashLoanDetailView";
import NutritionView from "./views/NutritionView";
import EventsView from "./views/EventsView";
import BrainstormView from "./views/BrainstormView";
import EodView from "./views/EodView";
import QuickEntryDialog from "./components/quick-entry/QuickEntryDialog";
import UnsettledTransactions from "./components/quick-entry/UnsettledTransactions";
import ReminderSettings from "./components/reminders/ReminderSettings";
import ReminderChecklistDialog from "./components/reminders/ReminderChecklistDialog";
import NutritionDateControls from "./components/nutrition/NutritionDateControls";
import { dateLabel, money, today, words } from "./lib/format";
import "./styles/theme.css";

const tabs = [
  ["", "Dashboard", LayoutDashboard, "Home"],
  ["transactions", "Transactions", ArrowLeftRight, "Daily tracking"],
  ["income", "Income", ArrowDownLeft, "Daily tracking"],
  ["bills", "Bills", Receipt, "Daily tracking"],
  ["quick-entry-transactions", "Quick Entry transactions", Plus, "Daily tracking", "Entry review"],
  ["accounts", "Accounts & cards", Wallet, "Money & assets", "Accounts"],
  ["assets", "Assets", House, "Money & assets"],
  ["funds", "Benefits & investments", PiggyBank, "Money & assets", "Funds & coverage"],
  ["people", "People & money", HeartHandshake, "Money & assets"],
  ["deadlines", "Tasks & deadlines", ListChecks, "Planning", "Tasks"],
  ["calendar", "Calendar", CalendarDays, "Planning"],
  ["brainstorm", "Brainstorming", Lightbulb, "Planning", "Ideas"],
  ["eod", "EOD", BookOpenText, "Planning", "End of day"],
  ["nutrition", "Nutrition", Utensils, "Wellbeing"],
  ["spending", "Spending", ChartNoAxesCombined, "Insights"],
  ["reports", "Monthly reports", FileChartColumn, "Insights", "Reports"],
  ["settings", "Settings", Settings, "Workspace"],
  ["events", "Events log", FileClock, "Workspace", "Activity log"],
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
  const accountId = tab === "accounts" ? routeParts[1] : undefined;
  const subscriptionId = tab === "bills" && routeParts[1] === "subscriptions" ? routeParts[2] : undefined;
  const correctingBalances = tab === "settings" && routeParts[1] === "balances";
  const cashLoanId = accountId && routeParts[2] === "cash-loans" ? routeParts[3] : undefined;
  const sharedBillRoute = tab === "people" && routeParts[1] === "shared";
  const sharedBillId = sharedBillRoute ? routeParts[2] : undefined;
  const currentTab =
    tab === "loans" ? "people" : tab === "expenses" ? "transactions" : tab;
  const current = tabs.find((t) => t[0] === currentTab);
  const dashboard = useDashboardData(selectedMonth);
  const reminders = useReminders({
    request: dashboard.request,
    ready: dashboard.status === "ready",
    version: dashboard.version,
    refresh: dashboard.refresh,
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutTrigger = useRef(null);
  const logoutPending = useRef(false);
  const signOut = async (event) => {
    event.preventDefault();
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await dashboard.request("session/logout/", { method: "POST" });
      logoutPending.current = false;
      setLoggingOut(false);
      setLogoutOpen(false);
      setMobileNav(false);
      // Recheck the session even if an unsaved-work prompt cancels navigation.
      dashboard.refresh();
      window.location.replace("/dashboard");
    } catch (error) {
      setLogoutError(error.message);
      setLoggingOut(false);
      logoutPending.current = false;
    }
  };
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileNav(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const [nutritionDate, setNutritionDate] = useState(today);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
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
  const [overdueItems, setOverdueItems] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueError, setOverdueError] = useState("");
  const calendarTrigger = useRef(null);
  const calendarEditing = useRef(false);
  const notificationId = useRef(0);
  const [companionReaction, setCompanionReaction] = useState(null);
  const [companionActivity, setCompanionActivity] = useState(null);
  const launchingControl = useRef(null);
  const quickAddTrigger = useRef(null);
  const quickAddOpening = useRef(false);
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
    } else if (tab === "expenses") {
      navigateRouter(
        "/dashboard/transactions?month=" + selectedMonth,
        { replace: true, state: { transactionKind: "expense" } },
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
  const openOverdueItem = (item) => {
    const month = item.due_date.slice(0, 7);
    const path = item.cash_loan_id
      ? "accounts/" + item.credit_card + "/cash-loans/" + item.cash_loan_id
      : item.financing_asset_id
      ? "assets/" + item.financing_asset_id
      : item.shared_bill_id
        ? "people/shared/" + item.shared_bill_id
        : item.settlement_kind === "loan_collection"
          ? "people"
          : ["task", "reminder"].includes(item.kind)
            ? "deadlines"
            : "bills";
    setOverdueItems(null);
    navigateRouter(
      "/dashboard/" +
        path +
        "?month=" +
        month +
        (item.settlement_kind === "loan_collection" ? "&view=loans" : ""),
    );
  };
  const reviewOverdue = async () => {
    if (overdueLoading) return;
    setOverdueLoading(true);
    setOverdueError("");
    try {
      const items = [];
      let page = 1;
      let hasNext = true;
      while (hasNext) {
        const response = await dashboard.request(
          "deadlines/?status=pending&urgency=overdue&page_size=100&page=" + page,
        );
        items.push(...response.results);
        hasNext = Boolean(response.next);
        page += 1;
      }
      if (items.length === 1) openOverdueItem(items[0]);
      else if (items.length > 1) setOverdueItems(items);
      else
        setOverdueError("No overdue items remain. Refresh to update the count.");
    } catch (error) {
      setOverdueError(
        error.message || "Could not load overdue items. Try again.",
      );
    } finally {
      setOverdueLoading(false);
    }
  };
  const setMonth = (month) =>
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.set("month", month);
      return updated;
    });
  const notify = (text, context) => {
    const id = ++notificationId.current;
    const notice = { id, text, tone: context?.tone || "success", context, createdAt: Date.now() };
    setNotices((items) => {
      const latest = items[items.length - 1];
      if (latest?.text === text && latest.tone === notice.tone && notice.createdAt - latest.createdAt < 2000) return items;
      return [...(STANDARD_DASHBOARD_TOASTS_ENABLED ? items.slice(-2) : items), notice];
    });
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
      if (["deadline", "settlement"].includes(entity) && record?.subscription_id) {
        navigateRouter(`/dashboard/bills/subscriptions/${record.subscription_id}?month=${selectedMonth}&cycle=${record.subscription_cycle_id}${entity === "settlement" ? "&action=pay" : ""}`);
        return;
      }
      if (["deadline", "settlement"].includes(entity) && record?.cash_loan_id) {
        navigateRouter(`/dashboard/accounts/${record.credit_card}/cash-loans/${record.cash_loan_id}?month=${selectedMonth}`);
        return;
      }
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
    settleDeadline: async (record) => {
      if (!["task", "reminder"].includes(record.kind)) {
        actions.openForm("settlement", record);
        return;
      }
      try {
        await dashboard.mutate("deadlines/" + record.id + "/settle/", {});
        notify("Task completed.", { action: "completed", entity: "deadline" });
        return true;
      } catch (error) {
        notify(error.message, { tone: "error" });
        return false;
      }
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
  const openQuickAdd = (entity, record) => {
    quickAddOpening.current = true;
    actions.openForm(entity, record);
    launchingControl.current = quickAddTrigger.current;
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
        <div className="w-full max-w-md text-center">
          {dashboard.status === "denied" ? (
            <DashboardLogin onSignedIn={dashboard.refresh} />
          ) : dashboard.status === "error" ? (
            <ErrorState message={dashboard.error} retry={dashboard.refresh} />
          ) : (
            <div role="status" className="flex flex-col items-center gap-3 text-sm text-slate-600">
              <LoaderCircle className="size-8 animate-spin text-[var(--pd-primary)] motion-reduce:animate-none" aria-hidden="true" />
              <span>Loading your workspace…</span>
            </div>
          )}
        </div>
      </main>
    );
  const shared = { dashboard, month: selectedMonth, ...actions };
  const renderNavigation = (mobile = false) => (
    <nav id={mobile ? "mobile-dashboard-links" : "dashboard-navigation"} aria-label="Dashboard" className={"space-y-1 px-3 pb-5 " + (mobile ? "" : "hidden lg:block")}>
      {tabs.map(([path, title, icon, group, label = title], index) => (
        <div key={path}>
          {(index === 0 || group !== tabs[index - 1][3]) && <p className={"px-3 pb-2 text-xs font-medium text-slate-500 " + (index === 0 ? "pt-2 " : "pt-5 ") + (!mobile && collapsed ? "lg:hidden" : "")}>{group}</p>}
          <Button asChild variant="ghost" className={"w-full justify-start px-3 font-normal " + (mobile ? "h-11 " : "h-9 " + (collapsed ? "lg:justify-center lg:px-0 " : "")) + (tab === path ? "bg-blue-50 text-[var(--pd-primary)]" : "text-slate-600")}>
            <a href={"/dashboard" + (path ? "/" + path : "") + "?month=" + selectedMonth} aria-current={tab === path ? "page" : undefined} aria-label={label} title={!mobile && collapsed ? label : undefined} onClick={(event) => {
              if (!event.metaKey && !event.ctrlKey) { event.preventDefault(); navigate(path); }
            }}>
              {createElement(icon, { size: 17, className: "shrink-0", "aria-hidden": true })}
              <span className={"whitespace-nowrap " + (!mobile && collapsed ? "lg:hidden" : "")}>{label}</span>
            </a>
          </Button>
        </div>
      ))}
      <div className="mt-3 border-t pt-3">
        <Button asChild variant="ghost" className={"w-full justify-start px-3 font-normal text-slate-600 " + (mobile ? "h-11" : collapsed ? "lg:justify-center lg:px-0" : "")}>
          <a href="/business" aria-label="Business dashboard" title={!mobile && collapsed ? "Business dashboard" : undefined}><BriefcaseBusiness size={17} aria-hidden="true" /><span className={!mobile && collapsed ? "lg:hidden" : ""}>Business dashboard</span></a>
        </Button>
        <Button type="button" variant="ghost" className={"w-full justify-start px-3 font-normal text-slate-600 " + (mobile ? "h-11" : collapsed ? "lg:justify-center lg:px-0" : "")} aria-label="Log out" title={!mobile && collapsed ? "Log out" : undefined} onClick={(event) => { logoutTrigger.current = event.currentTarget; setLogoutError(""); setLogoutOpen(true); }}>
          <LogOut size={17} aria-hidden="true" /><span className={!mobile && collapsed ? "lg:hidden" : ""}>Log out</span>
        </Button>
      </div>
    </nav>
  );
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
            <Dialog open={mobileNav} onOpenChange={setMobileNav}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Open dashboard navigation" aria-expanded={mobileNav} aria-controls="mobile-dashboard-navigation"><Menu /></Button>
              </DialogTrigger>
              <DialogContent id="mobile-dashboard-navigation" className="personal-dashboard inset-y-0 left-0 top-0 flex h-dvh w-80 max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-l-0 p-0 sm:max-w-80 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 motion-reduce:animate-none [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:grid [&_[data-slot=dialog-close]]:size-11 [&_[data-slot=dialog-close]]:place-items-center" >
                <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left">
                  <DialogTitle className="flex items-center gap-3 text-sm"><Wallet size={19} aria-hidden="true" />Personal workspace</DialogTitle>
                  <DialogDescription className="sr-only">Choose a page in your personal dashboard.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 pb-[env(safe-area-inset-bottom)]">
                  {renderNavigation(true)}
                  <p className="border-t px-5 py-4 text-xs leading-5 text-slate-500">Private workspace<br />Signed in as {dashboard.data.user.name}</p>
                </div>
              </DialogContent>
            </Dialog>
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
          {renderNavigation()}
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
                      {correctingBalances ? "Correct balances" : tab ? current?.[1] || "Page not found" : "Welcome back, Miku!"}
                    </h1>
                  </nav>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {tab === "nutrition"
                      ? "Meals, macros, weight readings, and your own daily target."
                      : tab === "events"
                        ? "A read-only history of changes across your personal workspace."
                      : tab === "brainstorm"
                        ? "Capture, shape, and carry ideas into tasks when they are ready."
                      : tab === "eod"
                        ? "A daily recap of work and time away, organized by group."
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
              {tab === "nutrition" ? <NutritionDateControls date={nutritionDate} onChange={setNutritionDate} /> : tab === "brainstorm" ? null : <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <NutritionDateControls id="workspace-month" date={selectedMonth} onChange={setMonth} mode="month" label={tab === "events" ? "Events month" : tab === "eod" ? "EOD month" : "Summary month"} />
                <GlobalSearch request={dashboard.request} select={searchSelect} />
              </div>}
            </div>
            {!tab && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={reminders.openChecklist}>
                  <Bell aria-hidden="true" />
                  Important tasks
                  {reminders.checklist && <span className="text-xs text-slate-600">{reminders.checklist.items.filter((item) => !item.completed).length} left</span>}
                </Button>
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
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button ref={quickAddTrigger}>
                      <Plus aria-hidden="true" />
                      Add new
                      <ChevronDown aria-hidden="true" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md"
                      align="end"
                      sideOffset={6}
                      onCloseAutoFocus={(event) => {
                        if (quickAddOpening.current) {
                          event.preventDefault();
                          quickAddOpening.current = false;
                        }
                      }}
                    >
                      <DropdownMenu.Item
                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)] data-[highlighted]:text-slate-950"
                        onSelect={() => { quickAddOpening.current = true; setQuickEntryOpen(true); }}
                      >
                        <Plus size={16} aria-hidden="true" />Quick Entry
                      </DropdownMenu.Item>
                      {[
                        ["Task", ListChecks, "deadline", { kind: "task" }],
                        ["Bill", Receipt, "deadline", { kind: "bill" }],
                        ["Expense", ArrowUpRight, "expense"],
                      ].map(([label, Icon, entity, record]) => (
                        <DropdownMenu.Item
                          key={label}
                          className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)] data-[highlighted]:text-slate-950"
                          onSelect={() => openQuickAdd(entity, record)}
                        >
                          <Icon size={16} aria-hidden="true" />
                          Add {label.toLowerCase()}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            )}
            {!tab && reminders.error && <p role="alert" className="mt-2 text-right text-xs text-red-700">{reminders.error}</p>}
          </header>
          {!tab && dashboard.data.overview.attention.overdue > 0 && (
            <div
              role="status"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                  <TriangleAlert size={19} aria-hidden="true" />
                </span>
                <div>
                  <p>
                    <strong>
                      {dashboard.data.overview.attention.overdue} overdue{" "}
                      {dashboard.data.overview.attention.overdue === 1
                        ? "item"
                        : "items"}
                    </strong>{" "}
                    across all months{" "}
                    {dashboard.data.overview.attention.overdue === 1
                      ? "needs"
                      : "need"}{" "}
                    attention.
                  </p>
                  {overdueError && (
                    <p role="alert" className="mt-1 text-xs">
                      {overdueError}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={reviewOverdue}
                disabled={overdueLoading}
              >
                {overdueLoading
                  ? "Loading…"
                  : dashboard.data.overview.attention.overdue === 1
                    ? "Review item"
                    : "Review items"}
                {!overdueLoading && <ChevronRight aria-hidden="true" />}
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
              settleDeadline={actions.settleDeadline}
            />
          ) : tab === "quick-entry-transactions" ? (
            <UnsettledTransactions dashboard={dashboard} notify={notify} />
          ) : tab === "nutrition" ? (
            <NutritionView request={dashboard.request} notify={notify} date={nutritionDate} onLeave={() => navigate("")} />
          ) : tab === "events" ? (
            <EventsView dashboard={dashboard} month={selectedMonth} />
          ) : tab === "brainstorm" ? (
            <BrainstormView dashboard={dashboard} notify={notify} />
          ) : tab === "eod" ? (
            <EodView dashboard={dashboard} notify={notify} month={selectedMonth} onMonthChange={setMonth} />
          ) : tab === "funds" ? (
            <FundsView {...shared} />
          ) : tab === "bills" ? (
            subscriptionId ? /^\d+$/.test(subscriptionId) && !routeParts.slice(3).some(Boolean) ? <SubscriptionView key={subscriptionId} subscriptionId={subscriptionId} {...shared} /> : <EmptyState title="This service page does not exist" /> : <BillsView {...shared} />
          ) : tab === "accounts" && accountId ? (
            /^\d+$/.test(accountId) && cashLoanId && /^\d+$/.test(cashLoanId) && !routeParts.slice(4).some(Boolean) ? (
              <CashLoanDetailView key={cashLoanId} accountId={accountId} loanId={cashLoanId} {...shared} />
            ) : /^\d+$/.test(accountId) && !routeParts.slice(2).some(Boolean) ? (
              <AccountDetailView key={accountId} accountId={accountId} {...shared} />
            ) : (
              <EmptyState
                title="This account page does not exist"
                action={<Button onClick={() => navigate("accounts")}>Back to accounts</Button>}
              />
            )
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
          ) : correctingBalances ? (
            <BalanceCorrectionView dashboard={dashboard} notify={notify} />
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
                  Categories and recurring schedules are managed below. Reconcile forgotten transactions by correcting your actual account balances.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => navigateRouter("/dashboard/settings/balances")}><ShieldCheck className="size-4" aria-hidden="true" />Correct account balances</Button>
              </Panel>
              <ReminderSettings
                settings={dashboard.data.settings}
                status={reminders.status}
                error={reminders.error}
                busy={reminders.busy}
                onSave={reminders.saveSettings}
                onEnable={reminders.enablePush}
                onDisable={reminders.disablePush}
              />
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
                    bills: "deadlines",
                  }[tab] || tab
                }
                kind={tab === "income" ? "income" : undefined}
                initialTransactionKind={
                  tab === "transactions" && location.state?.transactionKind === "expense"
                    ? "expense"
                    : ""
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
          tab={sharedBillRoute ? "shared" : currentTab}
          overdue={dashboard.data.overview.attention.overdue}
          activity={companionActivity}
          reaction={companionReaction}
          stationary={!STANDARD_DASHBOARD_TOASTS_ENABLED}
          notification={notices[0]}
          pendingCount={notices.length}
          dismiss={(id) => setNotices((items) => items.filter((item) => item.id !== id))}
        />
        {STANDARD_DASHBOARD_TOASTS_ENABLED && <DashboardToasts
          notices={notices}
          dismiss={(id) =>
            setNotices((items) => items.filter((item) => item.id !== id))
          }
        />}
        <AlertDialog open={logoutOpen} onOpenChange={(open) => { if (!logoutPending.current) setLogoutOpen(open); }}>
          <AlertDialogContent className="personal-dashboard" onEscapeKeyDown={(event) => { if (logoutPending.current) event.preventDefault(); }} onCloseAutoFocus={(event) => { if (logoutTrigger.current?.isConnected) { event.preventDefault(); logoutTrigger.current.focus(); } }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><LogOut className="size-5" aria-hidden="true" />Log out of your workspace?</AlertDialogTitle>
              <AlertDialogDescription>This ends your Django session in this browser, including Django admin. Save any unsaved work first. Your saved records will not change.</AlertDialogDescription>
            </AlertDialogHeader>
            {logoutError && <p role="alert" className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-900"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />{logoutError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loggingOut}>Stay signed in</AlertDialogCancel>
              <AlertDialogAction onClick={signOut} disabled={loggingOut} aria-busy={loggingOut}><LogOut className="size-4" aria-hidden="true" />{loggingOut ? "Logging out…" : "Log out"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ReminderChecklistDialog
          dialog={reminders.dialog}
          error={reminders.error}
          busy={reminders.busy}
          close={reminders.close}
          toggle={reminders.toggle}
        />
        <SubscriptionAlertsDialog alert={reminders.serviceAlert} close={reminders.closeServiceAlert} />
        {overdueItems && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setOverdueItems(null);
            }}
          >
            <DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white sm:max-w-xl">
              <DialogHeader className="pr-8">
                <DialogTitle className="flex items-center gap-2 text-red-900">
                  <TriangleAlert size={20} aria-hidden="true" />
                  Overdue items
                </DialogTitle>
                <DialogDescription>
                  Choose an item to open its page and take action.
                </DialogDescription>
              </DialogHeader>
              <ul className="mt-2 space-y-2">
                {overdueItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openOverdueItem(item)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 text-left transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] motion-reduce:transition-none"
                    >
                      <span className="min-w-0">
                        <span className="block break-words font-medium text-slate-950">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs text-slate-600">
                          {words(item.kind)} · Due {dateLabel(item.due_date)}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 text-red-700 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        )}
        {quickEntryOpen && <QuickEntryDialog open={quickEntryOpen} onOpenChange={setQuickEntryOpen} dashboard={dashboard} notify={notify} restoreFocus={() => quickAddTrigger.current?.focus()} />}
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
            settleDeadline={async (record) => {
              calendarEditing.current = !["task", "reminder"].includes(record.kind);
              setCalendarOpen(false);
              launchingControl.current = calendarTrigger.current;
              await actions.settleDeadline(record);
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
