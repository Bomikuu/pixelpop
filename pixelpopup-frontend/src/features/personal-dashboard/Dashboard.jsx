import { createElement, lazy, useCallback, useEffect, useRef, useState } from "react";
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
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  HeartHandshake,
  Utensils,
  Activity,
  TriangleAlert,
  BriefcaseBusiness,
  FileClock,
  Lightbulb,
  BookOpenText,
  Bell,
  LogOut,
  LoaderCircle,
  RefreshCw,
  UserRound,
  Search,
} from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useReminders } from "./hooks/useReminders";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { TooltipProvider } from "./ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { DeleteDialog, HistoryDialog } from "./components/ActionDialogs";
import GlobalSearch from "./components/GlobalSearch";
import RecordList from "./components/RecordList";
import SummaryTiles from "./components/SummaryTiles";
import DashboardCompanion from "./components/DashboardCompanion";
import DashboardToasts from "./components/DashboardToasts";
import { STANDARD_DASHBOARD_TOASTS_ENABLED } from "../../ui/mascot/dashboardCompanionConfig";
import DatabaseBackup from "./components/DatabaseBackup";
import DashboardLogin from "./components/DashboardLogin";
import UserProfileSettings from "./components/UserProfileSettings";
import DashboardPageBoundary from "./components/DashboardPageBoundary";
import DeferredDashboardDialog from "./components/DeferredDashboardDialog";
import { EmptyState, ErrorState, Panel } from "./components/Panel";
import OverviewView from "./views/OverviewView";
import SubscriptionAlertsDialog from "./components/subscriptions/SubscriptionAlertsDialog";
import ReminderSettings from "./components/reminders/ReminderSettings";
import ReminderChecklistDialog from "./components/reminders/ReminderChecklistDialog";
import NutritionDateControls from "./components/nutrition/NutritionDateControls";
import { dateLabel, money, today, words } from "./lib/format";
import "./styles/theme.css";
import WorkspaceBottomNav from "../workspace-mobile/WorkspaceBottomNav";
import WorkspaceSwitcher from "../workspace-mobile/WorkspaceSwitcher";
import useWorkspacePwa from "../workspace-pwa/useWorkspacePwa";
import WorkspacePwaControls from "../workspace-pwa/WorkspacePwaControls";
import ThemeToggle from "../../ui/theme/ThemeToggle";
import WorkspaceMobileHeader from "../workspace-mobile/WorkspaceMobileHeader";
import WorkspaceMobilePage from "../workspace-mobile/WorkspaceMobilePage";
import WorkspaceQuickActionGrid from "../workspace-mobile/WorkspaceQuickActionGrid";
import useWorkspaceMobile from "../workspace-mobile/useWorkspaceMobile";

const loadFormDialog = () => import("./components/forms/FormDialog");
const loadCalendarDialog = () => import("./components/CalendarDialog");
const loadQuickEntryDialog = () => import("./components/quick-entry/QuickEntryDialog");

const BalanceCorrectionView = lazy(() => import("./views/BalanceCorrectionView"));
const InsightsView = lazy(() => import("./views/InsightsView"));
const CalendarView = lazy(() => import("./views/CalendarView"));
const FundsView = lazy(() => import("./views/FundsView"));
const BillsView = lazy(() => import("./views/BillsView"));
const SubscriptionView = lazy(() => import("./views/SubscriptionView"));
const PeopleView = lazy(() => import("./views/PeopleView"));
const PersonHistoryView = lazy(() => import("./views/PersonHistoryView"));
const SharedBillView = lazy(() => import("./views/SharedBillView"));
const AssetDetailView = lazy(() => import("./views/AssetDetailView"));
const AccountDetailView = lazy(() => import("./views/AccountDetailView"));
const CashLoanDetailView = lazy(() => import("./cash-loans/CashLoanDetailView"));
const NutritionView = lazy(() => import("./views/NutritionView"));
const EventsView = lazy(() => import("./views/EventsView"));
const BrainstormView = lazy(() => import("./views/BrainstormView"));
const EodView = lazy(() => import("./views/EodView"));
const UnsettledTransactions = lazy(() => import("./components/quick-entry/UnsettledTransactions"));

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

const dashboardActionGroups = [
  { title: "Daily tracking", items: [
    { label: "Quick Entry", description: "Capture an entry for review.", Icon: Plus, target: "quick-entry-transactions", kind: "quick-entry" },
    { label: "Add expense", description: "Record a new expense.", Icon: ArrowUpRight, target: "transactions", entity: "expense" },
  ] },
  { title: "Planning & bills", items: [
    { label: "Add task", description: "Create a task or deadline.", Icon: ListChecks, target: "deadlines", entity: "deadline", record: { kind: "task" } },
    { label: "Add bill", description: "Record a bill to track its due date.", Icon: Receipt, target: "bills", entity: "deadline", record: { kind: "bill" } },
  ] },
  { title: "Nutrition", items: [
    { label: "Add meal", description: "Log food and macros for the selected day.", Icon: Utensils, target: "nutrition", kind: "meal" },
    { label: "Add activity", description: "Log activity and active calories burned.", Icon: Activity, target: "nutrition", kind: "activity" },
  ] },
];

const mobileDashboardActions = [
  { label: "Add EOD", description: "Write an end-of-day entry.", Icon: BookOpenText, target: "eod", compose: "eod-entry" },
  { label: "Add loan", description: "Record money lent to someone.", Icon: HeartHandshake, target: "people", view: "loans", entity: "loan" },
  { label: "Add shared bill", mobileLabel: "Shared bill", description: "Create a shared bill and its participants.", Icon: Receipt, target: "people", view: "shared", compose: "shared-bill" },
];

export default function Dashboard() {
  const mobile = useWorkspaceMobile();
  const pwa = useWorkspacePwa();
  const rawNavigateRouter = useNavigate(),
    location = useLocation();
  const profileDraft = useRef(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileExit, setProfileExit] = useState(null);
  const pendingProfileNavigation = useRef(null);
  const guardProfileNavigation = useCallback((proceed) => {
    if (location.pathname.replace(/\/+$/, "") === "/dashboard/settings" && (profileDraft.current?.dirty || profileDraft.current?.saving)) {
      setProfileExit({ proceed });
      return false;
    }
    proceed();
    return true;
  }, [location.pathname]);
  const navigateRouter = useCallback((target, options, afterNavigation) => {
    const proceed = () => {
      rawNavigateRouter(target, options);
      afterNavigation?.();
    };
    if (typeof target === "string" && target.split("?")[0] === location.pathname) {
      proceed();
      return true;
    }
    return guardProfileNavigation(proceed);
  }, [rawNavigateRouter, guardProfileNavigation, location.pathname]);
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
  const moreButton = useRef(null);
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [pageAction, setPageAction] = useState(null);
  const [failedUserAvatar, setFailedUserAvatar] = useState(null);
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
  const overdueTrigger = useRef(null);
  const calendarTrigger = useRef(null);
  const calendarEditing = useRef(false);
  const notificationId = useRef(0);
  const [companionReaction, setCompanionReaction] = useState(null);
  const [companionActivity, setCompanionActivity] = useState(null);
  const launchingControl = useRef(null);
  const quickAddTrigger = useRef(null);
  const mobileActionTrigger = useRef(null);
  const mobileSearchTrigger = useRef(null);
  const pendingMobileSearch = useRef(null);
  const pendingDashboardAction = useRef(null);
  const pageHeadingRef = useRef(null);
  const mobileHeadingRef = useRef(null);
  const mainRef = useRef(null);
  const mobileRouteFocus = useRef(false);
  const previousPath = useRef(location.pathname);
  const focusPageHeading = useCallback(() => {
    if (!document.querySelector('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]')) {
      (window.matchMedia("(max-width: 1023px)").matches ? mobileHeadingRef.current : pageHeadingRef.current)?.focus();
    }
  }, []);
  useEffect(() => {
    if (previousPath.current === location.pathname || dashboard.status !== "ready") return;
    previousPath.current = location.pathname;
    const frame = requestAnimationFrame(focusPageHeading);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, dashboard.status, focusPageHeading]);
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
        "/dashboard/transactions?month=" + selectedMonth + "&transactions.kind=expense",
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
  const navigate = (target, afterNavigation, query = "") => {
    setPageAction(null);
    return navigateRouter(
      "/dashboard" +
        (target ? "/" + (target === "loans" ? "people" : target) : "") +
        "?month=" +
        selectedMonth +
        (target === "loans" ? "&view=loans" : "") +
        (query ? "&" + query : ""),
      undefined,
      () => {
        mobileRouteFocus.current = mobileNav;
        setMobileNav(false);
        setCompanionActivity(null);
        afterNavigation?.();
      },
    );
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
    overdueTrigger.current = document.activeElement;
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
      else {
        dashboard.refresh({ resources: [] });
        notify("No overdue items remain.");
      }
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
      for (const key of [...updated.keys()]) if (key.endsWith(".page")) updated.delete(key);
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
  const chooseDashboardAction = (action) => {
    pendingDashboardAction.current = () => {
      const query = new URLSearchParams();
      if (action.view) query.set("view", action.view);
      if (action.compose) query.set("compose", action.compose);
      navigate(action.target, () => {
        if (!action.compose) setPageAction(action);
      }, query.toString());
    };
    setActionsOpen(false);
  };
  useEffect(() => {
    if (!pageAction || pageAction.target !== currentTab || dashboard.status !== "ready" || pageAction.target === "nutrition") return;
    launchingControl.current = (mobile ? mobileActionTrigger.current : quickAddTrigger.current) || pageHeadingRef.current;
    if (pageAction.kind === "quick-entry") setQuickEntryOpen(true);
    else {
      setDialog({ entity: pageAction.entity, record: pageAction.record });
      setCompanionActivity(pageAction.entity);
    }
    setPageAction(null);
  }, [pageAction, currentTab, dashboard.status, mobile]);
  function searchSelect(row) {
    if (row.tab === "settings") openSearchResult(row);
    else guardProfileNavigation(() => openSearchResult(row));
  }
  async function openSearchResult(row) {
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
  const userAvatar = dashboard.data.user.avatar_url;
  const shortcutParams = new URLSearchParams(params);
  shortcutParams.set("month", selectedMonth);
  const renderUserFooter = (mobile = false) => (
    <footer
      aria-label="Signed-in user"
      title={!mobile && collapsed ? dashboard.data.user.name : undefined}
      className={"shrink-0 items-center gap-3 border-t border-[var(--pd-border)] bg-white px-4 py-4 " + (mobile ? "flex pb-[max(1rem,env(safe-area-inset-bottom))]" : "hidden lg:flex " + (collapsed ? "lg:justify-center lg:px-2" : ""))}
    >
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--pd-border)] bg-[var(--pd-soft)] text-slate-500">
        {userAvatar && userAvatar !== failedUserAvatar ? (
          <img src={userAvatar} width="40" height="40" alt="" className="size-full object-cover" onError={() => setFailedUserAvatar(userAvatar)} />
        ) : <UserRound className="size-5" aria-hidden="true" />}
      </span>
      <div className={"min-w-0 " + (!mobile && collapsed ? "lg:sr-only" : "")}>
        <p className="truncate text-sm font-semibold text-slate-950">{dashboard.data.user.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">Personal workspace</p>
      </div>
    </footer>
  );
  const renderNavigation = (mobile = false) => (
    <nav id={mobile ? "mobile-dashboard-links" : "dashboard-navigation"} aria-label="Dashboard" className={"space-y-1 px-3 pb-5 " + (mobile ? "" : "hidden lg:block lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain")}>
      {tabs.map(([path, title, icon, group, label = title], index) => (
        <div key={path}>
          {(index === 0 || group !== tabs[index - 1][3]) && <p className={"px-3 pb-2 text-xs font-medium text-slate-500 " + (index === 0 ? "pt-2 " : "pt-5 ") + (!mobile && collapsed ? "lg:hidden" : "")}>{group}</p>}
          <Button asChild variant="ghost" className={"w-full justify-start px-3 font-normal " + (mobile ? "h-11 " : "h-9 " + (collapsed ? "lg:justify-center lg:px-0 " : "")) + (currentTab === path ? "bg-blue-50 text-[var(--pd-primary)]" : "text-slate-600")}>
            <a href={"/dashboard" + (path ? "/" + path : "") + "?month=" + selectedMonth} aria-current={currentTab === path ? "page" : undefined} aria-label={label} title={!mobile && collapsed ? label : undefined} onClick={(event) => {
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
          <a href="/business" aria-label="Business dashboard" title={!mobile && collapsed ? "Business dashboard" : undefined} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigateRouter("/business"); } }}><BriefcaseBusiness size={17} aria-hidden="true" /><span className={!mobile && collapsed ? "lg:hidden" : ""}>Business dashboard</span></a>
        </Button>
        <Button type="button" variant="ghost" className={"w-full justify-start px-3 font-normal text-slate-600 " + (mobile ? "h-11" : collapsed ? "lg:justify-center lg:px-0" : "")} aria-label="Log out" title={!mobile && collapsed ? "Log out" : undefined} onClick={(event) => { logoutTrigger.current = event.currentTarget; setLogoutError(""); setLogoutOpen(true); }}>
          <LogOut size={17} aria-hidden="true" /><span className={!mobile && collapsed ? "lg:hidden" : ""}>Log out</span>
        </Button>
      </div>
      {(mobile || !collapsed) && <WorkspacePwaControls pwa={pwa} />}
    </nav>
  );
  return (
    <TooltipProvider>
      <div
        className={
          "personal-dashboard workspace-mobile-shell min-h-screen bg-slate-50 lg:grid " +
          (collapsed
            ? "lg:grid-cols-[80px_minmax(0,1fr)]"
            : "lg:grid-cols-[248px_minmax(0,1fr)]")
        }
      >
        <a href="#dashboard-main" className="sr-only z-50 rounded-md border border-[var(--pd-border)] bg-white font-medium text-[var(--pd-primary)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:p-3" onClick={(event) => { event.preventDefault(); mainRef.current?.focus(); }}>Skip to dashboard content</a>
        <aside
          data-dashboard-sidebar
          className="hidden border-b bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r"
        >
          <div
            className={
              "flex shrink-0 items-center justify-between gap-3 px-4 py-5 " +
              (collapsed ? "lg:flex-col lg:px-2" : "")
            }
          >
            <WorkspaceSwitcher workspace="personal" onSwitch={() => navigateRouter("/business/clients")} />
            <div className="hidden items-center gap-3 lg:flex">
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
              <DialogContent id="mobile-dashboard-navigation" overlayClassName="workspace-mobile-backdrop" className="personal-dashboard workspace-navigation-drawer inset-y-0 left-0 top-0 flex h-dvh w-80 max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-l-0 p-0 sm:max-w-80 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 motion-reduce:animate-none [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:grid [&_[data-slot=dialog-close]]:size-11 [&_[data-slot=dialog-close]]:place-items-center" onCloseAutoFocus={(event) => {
                if (!mobileRouteFocus.current) { event.preventDefault(); requestAnimationFrame(() => { if (window.matchMedia("(min-width: 1024px)").matches) focusPageHeading(); else moreButton.current?.focus(); }); return; }
                mobileRouteFocus.current = false;
                event.preventDefault();
                requestAnimationFrame(focusPageHeading);
              }}>
                <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left">
                  <DialogTitle className="flex items-center gap-3 text-sm"><Wallet size={19} aria-hidden="true" />Personal workspace</DialogTitle>
                  <DialogDescription className="sr-only">Choose a page in your personal dashboard.</DialogDescription>
                  <WorkspaceSwitcher workspace="personal" onSwitch={() => navigateRouter("/business/clients")} />
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3">
                  {renderNavigation(true)}
                </div>
                {renderUserFooter(true)}
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
          {renderUserFooter()}
        </aside>
        <main ref={mainRef} id="dashboard-main" tabIndex={-1} className="min-w-0 p-4 sm:p-6 lg:p-8">
          <WorkspaceMobileHeader
            headingRef={mobileHeadingRef}
            title={correctingBalances ? "Correct balances" : tab ? current?.[1] || "Page not found" : "Today"}
            subtitle={tab ? "Personal workspace" : `Welcome back, ${dashboard.data.user.name}!`}
            actions={<><Button ref={mobileSearchTrigger} type="button" variant="outline" size="icon" aria-label="Search workspace" onClick={() => setMobileSearchOpen(true)}><Search size={19} aria-hidden="true" /></Button><Button type="button" variant="outline" size="icon" aria-label="Refresh workspace" aria-busy={dashboard.refreshing} disabled={dashboard.refreshing} onClick={dashboard.refresh}><RefreshCw size={18} className={dashboard.refreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" /></Button></>}
          >
            {tab === "nutrition" ? <NutritionDateControls id="mobile-nutrition-date" date={nutritionDate} onChange={setNutritionDate} /> : !["settings", "brainstorm"].includes(tab) ? <NutritionDateControls id="mobile-workspace-month" date={selectedMonth} onChange={setMonth} mode="month" label="Reporting month" /> : null}
          </WorkspaceMobileHeader>
          <header className="mb-4 hidden border-b pb-4 lg:block">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-[1_1_20rem] items-start gap-2">
                <div className="min-w-0">
                  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">Workspace</span>
                    <ChevronRight size={14} className="text-slate-500" aria-hidden="true" />
                    <h1 ref={pageHeadingRef} tabIndex={-1} className="text-sm! leading-5! font-semibold text-slate-950">
                      {correctingBalances ? "Correct balances" : tab ? current?.[1] || "Page not found" : `Welcome back, ${dashboard.data.user.name}!`}
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
              <div className="flex w-full max-w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                {tab === "nutrition" ? <NutritionDateControls date={nutritionDate} onChange={setNutritionDate} /> : tab === "brainstorm" ? null : tab === "settings" ? <GlobalSearch request={dashboard.request} select={searchSelect} /> : <div className="flex flex-wrap items-center gap-2">
                  <NutritionDateControls id="workspace-month" date={selectedMonth} onChange={setMonth} mode="month" label={tab === "events" ? "Events month" : tab === "eod" ? "EOD month" : "Summary month"} />
                  <GlobalSearch request={dashboard.request} select={searchSelect} />
                </div>}
                <ThemeToggle />
                <Dialog open={actionsOpen} onOpenChange={(open) => {
                  if (open) pendingDashboardAction.current = null;
                  setActionsOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button ref={quickAddTrigger} className="hidden lg:inline-flex">
                      <LayoutDashboard aria-hidden="true" />
                      Actions
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    id="personal-quick-actions"
                    overlayClassName="workspace-mobile-backdrop"
                    className="personal-dashboard workspace-quick-sheet flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-3xl"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      (mobile ? mobileActionTrigger.current : quickAddTrigger.current)?.focus();
                      if (!pendingDashboardAction.current) return;
                      const action = pendingDashboardAction.current;
                      pendingDashboardAction.current = null;
                      queueMicrotask(action);
                    }}
                  >
                    <DialogHeader className="shrink-0 text-left">
                      <DialogTitle>{mobile ? "Quick actions" : "Dashboard actions"}</DialogTitle>
                      <DialogDescription>Choose what to add or log.</DialogDescription>
                    </DialogHeader>
                    <div className="lg:hidden"><WorkspaceQuickActionGrid items={[...dashboardActionGroups].sort((a, b) => tab === "nutrition" ? Number(b.title === "Nutrition") - Number(a.title === "Nutrition") : 0).flatMap((group) => group.items).concat(mobileDashboardActions)} onChoose={chooseDashboardAction} /></div>
                    <div className="hidden min-h-0 space-y-7 overflow-y-auto p-1 lg:block">
                      {dashboardActionGroups.map((group, index) => (
                        <section key={group.title} aria-labelledby={`dashboard-actions-group-${index}`}>
                          <h3 id={`dashboard-actions-group-${index}`} className="mb-3 text-sm font-semibold text-slate-950">{group.title}{group.title === "Nutrition" && <span className="ml-2 inline-block text-xs font-normal text-slate-600">{dateLabel(nutritionDate)}</span>}</h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {group.items.map((action) => {
                              const Icon = action.Icon;
                              return (
                                <Button key={action.label} type="button" variant="outline" className="h-auto items-start justify-start gap-3 whitespace-normal p-4 text-left hover:border-blue-300 hover:bg-blue-50/50" onClick={() => chooseDashboardAction(action)}>
                                  <Icon className="mt-0.5 size-5 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" />
                                  <span className="min-w-0"><span className="block font-semibold text-slate-950">{action.label}</span><span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{action.description}</span></span>
                                </Button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                    <DialogFooter className="hidden shrink-0 border-t border-[var(--pd-border)] pt-4 lg:flex"><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
              </div>
            )}
            {!tab && reminders.error && <p role="alert" className="mt-2 text-right text-xs text-red-700">{reminders.error}</p>}
          </header>
          {!tab && reminders.error && <p role="alert" className="mb-3 text-sm text-red-700 lg:hidden">{reminders.error}</p>}
          <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}><DialogContent className="personal-dashboard flex h-[min(32rem,calc(100dvh-2rem))] flex-col" onCloseAutoFocus={(event) => {
            event.preventDefault(); mobileSearchTrigger.current?.focus();
            const row = pendingMobileSearch.current; pendingMobileSearch.current = null;
            if (row) queueMicrotask(() => searchSelect(row));
          }}><DialogHeader><DialogTitle>Search workspace</DialogTitle><DialogDescription>Find a saved record.</DialogDescription></DialogHeader><GlobalSearch request={dashboard.request} select={(row) => { pendingMobileSearch.current = row; setMobileSearchOpen(false); }} /></DialogContent></Dialog>
          <div className={`mb-4 flex-wrap items-center justify-between gap-2 text-xs text-slate-600 ${dashboard.refreshError ? "flex" : "hidden lg:flex"}`} aria-live="polite" aria-atomic="true">
            {dashboard.refreshError ? <>
              <p role="alert" className="text-red-800">Could not refresh the workspace. {dashboard.monthPending ? "The selected month is unavailable." : "Your last loaded data is still shown."} {dashboard.refreshError}</p>
              <Button type="button" variant="outline" size="sm" onClick={dashboard.refresh}>Retry refresh</Button>
            </> : <>
              <p role="status">{dashboard.refreshing ? "Refreshing workspace…" : dashboard.updatedAt ? <>Last updated <time dateTime={new Date(dashboard.updatedAt).toISOString()}>{new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).format(new Date(dashboard.updatedAt))} PHT</time></> : null}</p>
              <Button type="button" variant="ghost" size="sm" disabled={dashboard.refreshing} aria-busy={dashboard.refreshing} onClick={dashboard.refresh}><RefreshCw className={"size-4 " + (dashboard.refreshing ? "motion-safe:animate-spin" : "")} aria-hidden="true" />Refresh workspace</Button>
            </>}
          </div>
          <WorkspaceMobilePage viewKey={location.pathname}>
          <DashboardPageBoundary key={location.pathname}>
          {dashboard.monthPending && !["settings", "nutrition", "brainstorm"].includes(tab) ? (
            <Panel title="Selected month">
              {dashboard.refreshError ? <ErrorState message="This month's information could not load. Your saved records have not changed." retry={dashboard.refresh} /> : <p role="status" className="text-sm text-slate-600">Loading the selected month…</p>}
            </Panel>
          ) : !current ? (
            <EmptyState
              title="This dashboard page does not exist"
              action={
                <Button onClick={() => navigate("")}>Back to dashboard</Button>
              }
            />
          ) : tab === "" ? (
            <OverviewView {...shared} navigate={navigate} reviewOverdue={reviewOverdue} overdueLoading={overdueLoading} overdueError={overdueError} onReminders={reminders.openChecklist} />
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
          <NutritionView request={dashboard.request} notify={notify} date={nutritionDate} onDateChange={setNutritionDate} onLeave={() => navigate("")} actionRequest={pageAction?.target === "nutrition" ? pageAction.kind : null} onActionHandled={setPageAction} />
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
              <UserProfileSettings
                user={dashboard.data.user}
                request={dashboard.request}
                draftRef={profileDraft}
                onSavingChange={setProfileSaving}
                onSaved={() => {
                  setFailedUserAvatar(null);
                  dashboard.refresh({ resources: [] });
                  notify("Profile updated.");
                }}
              />
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
          </DashboardPageBoundary>
          </WorkspaceMobilePage>
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
        <AlertDialog open={Boolean(profileExit)} onOpenChange={(open) => { if (!open) setProfileExit(null); }}>
          <AlertDialogContent className="personal-dashboard" onCloseAutoFocus={(event) => {
            if (!pendingProfileNavigation.current) return;
            event.preventDefault();
            const proceed = pendingProfileNavigation.current;
            pendingProfileNavigation.current = null;
            queueMicrotask(() => {
              profileDraft.current = null;
              proceed();
            });
          }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave profile settings?</AlertDialogTitle>
              <AlertDialogDescription>{profileSaving ? "Your profile is saving. Wait for it to finish before leaving." : profileDraft.current?.dirty ? "Your profile has unsaved changes. Keep editing or discard them before leaving." : "Your profile is saved. You can leave settings."}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction disabled={profileSaving} onClick={() => {
                pendingProfileNavigation.current = profileExit?.proceed;
                profileDraft.current = null;
                setProfileExit(null);
              }}>{profileDraft.current?.dirty ? "Discard changes & leave" : "Leave settings"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            <DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white sm:max-w-xl" onCloseAutoFocus={(event) => {
              event.preventDefault();
              requestAnimationFrame(() => (overdueTrigger.current?.isConnected ? overdueTrigger.current : pageHeadingRef.current)?.focus());
            }}>
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
        {quickEntryOpen && <DeferredDashboardDialog
          load={loadQuickEntryDialog}
          title="Quick Entry"
          description="Preparing your entry form."
          onClose={() => setQuickEntryOpen(false)}
          restoreFocus={(event) => {
            event.preventDefault();
            (quickAddTrigger.current?.isConnected ? quickAddTrigger.current : pageHeadingRef.current)?.focus();
          }}
          dialogProps={{
            open: quickEntryOpen,
            onOpenChange: setQuickEntryOpen,
            dashboard,
            notify,
            restoreFocus: () => (quickAddTrigger.current?.isConnected ? quickAddTrigger.current : pageHeadingRef.current)?.focus(),
          }}
        />}
        {dialog && (
          <DeferredDashboardDialog
            key={dialog.entity + "-" + (dialog.record?.id || "new")}
            load={loadFormDialog}
            title="Record details"
            description="Preparing the form for your selected record."
            onClose={() => setDialog(null)}
            restoreFocus={restoreFocus}
            dialogProps={{
              ...dialog,
              data: dashboard.data,
              mutate: dashboard.mutate,
              close: () => setDialog(null),
              notify,
              restoreFocus,
            }}
          />
        )}
        {calendarOpen && (
          <DeferredDashboardDialog
            load={loadCalendarDialog}
            title="Calendar"
            description="Opening your tasks and bills."
            onClose={() => setCalendarOpen(false)}
            restoreFocus={(event) => {
              event.preventDefault();
              if (!calendarEditing.current)
                requestAnimationFrame(() => calendarTrigger.current?.focus());
            }}
            dialogProps={{
              dashboard,
              initialMonth: selectedMonth,
              close: () => setCalendarOpen(false),
              restoreFocus: (event) => {
                event.preventDefault();
                if (!calendarEditing.current)
                  requestAnimationFrame(() => calendarTrigger.current?.focus());
              },
              openForm: (entity, record) => {
                calendarEditing.current = true;
                setCalendarOpen(false);
                actions.openForm(entity, record);
                launchingControl.current = calendarTrigger.current;
              },
              settleDeadline: async (record) => {
                calendarEditing.current = !["task", "reminder"].includes(record.kind);
                setCalendarOpen(false);
                launchingControl.current = calendarTrigger.current;
                await actions.settleDeadline(record);
              },
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
        <WorkspaceBottomNav actionButtonRef={mobileActionTrigger} actionControls="personal-quick-actions" actionOpen={actionsOpen} onAction={() => { pendingDashboardAction.current = null; setActionsOpen(true); }} moreButtonRef={moreButton} moreControls="mobile-dashboard-navigation" moreOpen={mobileNav} onMore={() => setMobileNav(true)} onNavigate={(href) => {
          setPageAction(null);
          navigateRouter(href, undefined, () => { setMobileNav(false); setCompanionActivity(null); });
        }} items={[
          { key: "today", label: "Today", href: `/dashboard?${shortcutParams}`, Icon: LayoutDashboard, active: currentTab === "" },
          { key: "money", label: "Money", href: `/dashboard/transactions?${shortcutParams}`, Icon: Wallet, active: ["transactions", "income", "bills", "quick-entry-transactions", "accounts", "assets", "funds", "people", "spending", "reports"].includes(currentTab) },
          { key: "nutrition", label: "Nutrition", href: `/dashboard/nutrition?${shortcutParams}`, Icon: Utensils, active: currentTab === "nutrition" },
        ]}/>
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
