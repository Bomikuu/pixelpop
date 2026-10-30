import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, ChevronRight, ClipboardCheck, FileText, GitPullRequest, LayoutDashboard, ListChecks, NotebookPen, PanelLeftClose, PanelLeftOpen, RefreshCw, Settings2, ShieldCheck, Target, Users, Workflow, X } from "lucide-react";
import { leadershipApi } from "./api";
import { OverviewView, RoadmapView, SectionPage, ThisWeekView } from "./views/BusinessViews";
import MemberDetailView from "./views/MemberDetailView";
import ClientsView from "./client-workflow/ClientsView";
import ClientDetailView from "./client-workflow/ClientDetailView";
import ProjectWorkflowView from "./client-workflow/ProjectWorkflowView";
import TemplateLibraryView from "./client-workflow/TemplateLibraryView";
import JobApplicationsView from "./job-applications/JobApplicationsView";
import BusinessCompanion from "./components/BusinessCompanion";
import { STANDARD_DASHBOARD_TOASTS_ENABLED } from "../../ui/mascot/dashboardCompanionConfig";
import { Button } from "../personal-dashboard/ui/button";
import { Input } from "../personal-dashboard/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../personal-dashboard/ui/dialog";
import { ErrorState } from "../personal-dashboard/components/Panel";
import "../personal-dashboard/styles/theme.css";
import WorkspaceBottomNav from "../workspace-mobile/WorkspaceBottomNav";
import WorkspaceSwitcher from "../workspace-mobile/WorkspaceSwitcher";
import useWorkspacePwa from "../workspace-pwa/useWorkspacePwa";
import WorkspacePwaControls from "../workspace-pwa/WorkspacePwaControls";
import ThemeToggle from "../../ui/theme/ThemeToggle";
import WorkspaceMobileHeader from "../workspace-mobile/WorkspaceMobileHeader";
import WorkspaceMobilePage from "../workspace-mobile/WorkspaceMobilePage";
import WorkspaceQuickActionGrid from "../workspace-mobile/WorkspaceQuickActionGrid";

const destinations = [
  ["", "Overview", LayoutDashboard, "Plan"],
  ["week", "This Week", CalendarDays, "Plan"],
  ["roadmap", "90-Day Plan", ListChecks, "Plan"],
  ["goals", "Team Goals", Target, "Execution"],
  ["quality", "PR & Quality", GitPullRequest, "Execution"],
  ["metrics", "Metrics", ChartNoAxesCombined, "Execution"],
  ["team", "Team Development", Users, "People"],
  ["delegation", "Delegation", ClipboardCheck, "People"],
  ["processes", "Processes", Workflow, "Systems"],
  ["documentation", "Documentation", BookOpen, "Systems"],
  ["evidence", "Evidence", ShieldCheck, "Review"],
  ["reflection", "Reflection", NotebookPen, "Review"],
  ["clients", "Clients", Users, "Client work"],
  ["clients/templates", "Templates", FileText, "Client work"],
  ["applications", "Job applications", BriefcaseBusiness, "Career"],
  ["applications/ai", "Application AI", Settings2, "Career"],
];

function SetupDialog({ open, csrf, onCreated }) {
  const [teamName, setTeamName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await leadershipApi("plans/", { method: "POST", body: { team_name: teamName.trim(), start_date: startDate } }, csrf); onCreated(); }
    catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  };
  return <Dialog open={open}><DialogContent showCloseButton={false} onEscapeKeyDown={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()} className="personal-dashboard sm:max-w-lg"><DialogHeader><div className="mb-2 grid size-11 place-items-center rounded-md bg-blue-50 text-blue-700"><BriefcaseBusiness size={22}/></div><DialogTitle>Set up your leadership plan</DialogTitle><DialogDescription>Choose the team and start date once. The 12-week roadmap will be created with editable, unchecked actions; no results or team members are assumed. Client work can be used separately.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div><label htmlFor="business-team-name" className="mb-1.5 block text-sm font-medium">Team name</label><Input id="business-team-name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Your team" required maxLength={120}/></div><div><label htmlFor="business-start-date" className="mb-1.5 block text-sm font-medium">Week 1 start date</label><Input id="business-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required/><p className="mt-1 text-xs text-slate-500">Weeks are seven-day intervals in Asia/Manila. This date cannot move after the roadmap is created.</p></div>{error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<DialogFooter><Button asChild type="button" variant="outline"><a href="/business/clients"><Users size={15}/>Open Clients</a></Button><Button type="submit" disabled={saving}><BriefcaseBusiness size={16}/>{saving ? "Creating…" : "Create plan"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

export default function BusinessDashboard() {
  const pwa = useWorkspacePwa();
  const navigate = useNavigate();
  const location = useLocation();
  const [path, memberId, ...extraSegments] = location.pathname.slice("/business".length).replace(/^\//, "").split("/");
  const current = useMemo(() => destinations.find(([key]) => key === path)?.map((value, index) => index === 1 && path === "applications" && memberId === "followups" ? "Follow-ups" : value), [path, memberId]);
  const isMemberPage = path === "team" && Boolean(memberId) && /^\d+$/.test(memberId) && extraSegments.length === 0;
  const isClientRoute = path === "clients";
  const isTemplatesRoute = path === "clients" && memberId === "templates" && extraSegments.length === 0;
  const isClientDetail = path === "clients" && /^\d+$/.test(memberId || "") && extraSegments.length === 0;
  const isProjectDetail = path === "clients" && /^\d+$/.test(memberId || "") && extraSegments[0] === "projects" && /^\d+$/.test(extraSegments[1] || "") && extraSegments.length === 2;
  const clientRouteValid = path === "clients" && (!memberId || isTemplatesRoute || isClientDetail || isProjectDetail);
  const isApplicationsRoute = path === "applications";
  const isResumeEditor = isApplicationsRoute && /^\d+$/.test(memberId || "") && extraSegments[0] === "resume" && !extraSegments.slice(1).some(Boolean);
  const isApplicationAI = isApplicationsRoute && memberId === "ai";
  const isApplicationProfile = isApplicationsRoute && memberId === "profile";
  const isApplicationAnswers = isApplicationsRoute && memberId === "answers";
  const isApplicationFollowUps = isApplicationsRoute && memberId === "followups";
  const applicationInitialTab = isApplicationAI ? "ai" : isApplicationProfile ? "profile" : isApplicationAnswers ? "answers" : isApplicationFollowUps ? "followups" : "applications";
  const applicationRouteValid = isApplicationsRoute && (!memberId || isApplicationAI || isApplicationProfile || isApplicationAnswers || isApplicationFollowUps || /^\d+$/.test(memberId)) && (!extraSegments.some(Boolean) || isResumeEditor);
  const activeDestination = (key) => key === "clients/templates" ? isTemplatesRoute : key === "applications/ai" ? isApplicationAI : path === key && !isTemplatesRoute && !isApplicationAI;
  const [memberLabel, setMemberLabel] = useState(null);
  const memberName = memberLabel?.id === Number(memberId) ? memberLabel.name : "";
  const onMemberLoaded = useCallback((id, name) => setMemberLabel({ id, name }), []);
  const [bootstrap, setBootstrap] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [revision, setRevision] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const mobileActionTrigger = useRef(null);
  const pendingQuickAction = useRef(null);
  const moreButton = useRef(null);
  const mainRef = useRef(null);
  const mobileRouteFocus = useRef(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = () => { if (desktop.matches) { setMobileNav(false); setQuickActionsOpen(false); } };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem("business-dashboard-nav-collapsed") === "true"; } catch { return false; } });
  const [notices, setNotices] = useState([]);
  const noticeSequence = useRef(0);
  const [clientDocumentDirty, setClientDocumentDirty] = useState(false);
  const notify = useCallback((message, danger = false) => {
    const notice = { message, danger, id: ++noticeSequence.current, createdAt: Date.now() };
    setNotices((old) => {
      const latest = old[old.length - 1];
      return latest?.message === message && latest.danger === danger && notice.createdAt - latest.createdAt < 2000 ? old : [...old, notice];
    });
  }, []);
  const dismissNotice = useCallback((id) => setNotices((old) => old.filter((notice) => notice.id !== id)), []);
  const toast = notices[0];
  useEffect(() => {
    if (!STANDARD_DASHBOARD_TOASTS_ENABLED || !toast) return;
    const timeout = setTimeout(() => dismissNotice(toast.id), 4200);
    return () => clearTimeout(timeout);
  }, [toast, dismissNotice]);
  useEffect(() => { const original = document.title; const meta = document.querySelector('meta[name="robots"]') || document.createElement("meta"); const previous = meta.getAttribute("content"); meta.name = "robots"; meta.content = "noindex, nofollow"; if (!meta.parentNode) document.head.appendChild(meta); document.title = `${isResumeEditor ? "Résumé editor" : isApplicationAI ? "Application AI" : isMemberPage ? memberName || "Team member" : current?.[1] || "Business"} · Business Dashboard`; return () => { document.title = original; if (previous === null) meta.remove(); else meta.content = previous; }; }, [current, isMemberPage, memberName, isApplicationAI, isResumeEditor]);
  const load = useCallback(async () => { setLoading(true); setError(""); setErrorStatus(null); try { const data = await leadershipApi("bootstrap/"); setBootstrap(data); if (data.plan) setOverview(await leadershipApi("overview/")); else setOverview(null); } catch (cause) { setError(cause.message); setErrorStatus(cause.status); setBootstrap(null); setOverview(null); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { let day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", dateStyle: "short" }).format(new Date()); const interval = setInterval(() => { const next = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", dateStyle: "short" }).format(new Date()); if (next !== day) { day = next; load(); } }, 60_000); return () => clearInterval(interval); }, [load]);
  useEffect(() => { if (!bootstrap?.plan || revision === 0) return; leadershipApi("overview/").then(setOverview).catch((cause) => notify(cause.message, true)); }, [revision, bootstrap?.plan, notify]);
  const changed = useCallback(() => setRevision((old) => old + 1), []);
  const go = (destination = "") => {
    const next = destination.startsWith("/") ? destination : "/business" + (destination ? `/${destination}` : "");
    const nextPath = next.split("?")[0];
    const applicationPath = /^\/business\/applications\/(\d+)(?:\/resume)?\/?$/;
    const currentApplication = location.pathname.match(applicationPath)?.[1];
    const sameApplication = currentApplication && currentApplication === nextPath.match(applicationPath)?.[1];
    if (clientDocumentDirty && location.pathname !== nextPath && !sameApplication && !window.confirm("Discard unsaved document changes?")) return;
    if (!sameApplication) setClientDocumentDirty(false);
    mobileRouteFocus.current = mobileNav;
    navigate(next); setMobileNav(false);
  };
  const toggleCollapsed = () => setCollapsed((old) => { try { localStorage.setItem("business-dashboard-nav-collapsed", String(!old)); } catch { /* optional storage */ } return !old; });
  const renderNavigation = (mobile = false) => <nav aria-label="Business dashboard" className={mobile ? "space-y-1 px-3 pb-5" : "hidden space-y-1 px-3 pb-5 lg:block"}>
    {destinations.map(([key, label, Icon, group], index) => !bootstrap?.plan && !["Client work", "Career"].includes(group) ? null : <div key={key}>
      {(index === 0 || group !== destinations[index - 1][3]) && <p className={`px-3 pb-2 pt-4 text-xs font-medium text-slate-500 ${!mobile && collapsed ? "lg:hidden" : ""}`}>{group}</p>}
      <Button variant="ghost" className={`w-full justify-start px-3 font-normal ${mobile ? "min-h-11" : collapsed ? "lg:justify-center lg:px-0" : ""} ${activeDestination(key) ? "bg-blue-50 text-blue-700" : "text-slate-600"}`} asChild>
        <a href={`/business${key ? `/${key}` : ""}`} title={!mobile && collapsed ? label : undefined} aria-label={label} aria-current={activeDestination(key) ? "page" : undefined} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); go(key); } }}><Icon size={17} aria-hidden="true"/><span className={!mobile && collapsed ? "lg:hidden" : ""}>{label}</span></a>
      </Button>
    </div>)}
    <div className="mt-4 border-t pt-3"><Button asChild variant="ghost" className={`w-full justify-start px-3 font-normal text-slate-600 ${mobile ? "min-h-11" : collapsed ? "lg:justify-center lg:px-0" : ""}`}><a href="/dashboard" onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); go("/dashboard"); } }} title="Personal dashboard"><ArrowLeft size={17}/><span className={!mobile && collapsed ? "lg:hidden" : ""}>Personal dashboard</span></a></Button></div>
    {(mobile || !collapsed) && <WorkspacePwaControls pwa={pwa} />}
  </nav>;
  if (loading && !bootstrap) return <main className="personal-dashboard grid min-h-screen place-items-center bg-slate-50" aria-busy="true"><p className="text-sm text-slate-600">Loading your private business dashboard…</p></main>;
  if (error && !bootstrap) return <main className="personal-dashboard grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-md"><ErrorState message={errorStatus === 403 || errorStatus === 401 ? "Sign in to your Django account to access this private dashboard." : error} retry={load}/>{(errorStatus === 403 || errorStatus === 401) && <a href="/admin/login/?next=/business" className="mt-4 inline-block text-sm text-blue-700 underline">Open Django sign-in</a>}</div></main>;
  if (!bootstrap?.plan && !isClientRoute && !isApplicationsRoute) return <main className="personal-dashboard min-h-screen bg-slate-50"><SetupDialog open csrf={bootstrap?.csrfToken || ""} onCreated={load}/></main>;
  return <div className={`personal-dashboard ${isResumeEditor ? "" : "workspace-mobile-shell"} min-h-screen bg-[#f8fafc]`}><div className={`grid w-full ${collapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]"}`}>
    <aside className="hidden border-b bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className={`flex h-16 shrink-0 items-center justify-between gap-2 px-4 ${collapsed ? "lg:h-auto lg:flex-col lg:px-2 lg:py-3" : ""}`}>
        <WorkspaceSwitcher workspace="business" onSwitch={() => go("/dashboard")} />
        <a href={bootstrap.plan ? "/business" : "/business/clients"} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); go(bootstrap.plan ? "" : "clients"); } }} className="hidden min-w-0 items-center gap-2.5 text-sm font-semibold text-slate-950 lg:flex"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-600 text-white"><BriefcaseBusiness size={18}/></span><span className={collapsed ? "truncate lg:hidden" : "truncate"}>Business workspace</span></a>
        <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen/> : <PanelLeftClose/>}</Button>
      </div>
      <div className="hidden min-h-0 flex-1 overflow-y-auto overscroll-contain lg:block">{renderNavigation()}</div>
      <p className={`hidden shrink-0 border-t px-5 py-4 text-xs leading-5 text-slate-500 ${collapsed ? "" : "lg:block"}`}>Private workspace<br/>Signed in as {bootstrap.user.name}</p>
      <Dialog open={mobileNav} onOpenChange={setMobileNav}>
        <DialogContent id="mobile-business-navigation" overlayClassName="workspace-mobile-backdrop" className="personal-dashboard workspace-navigation-drawer inset-y-0 left-0 top-0 flex h-dvh w-80 max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-l-0 p-0 sm:max-w-80 motion-reduce:animate-none [&_[data-slot=dialog-close]]:grid [&_[data-slot=dialog-close]]:size-11 [&_[data-slot=dialog-close]]:place-items-center" onCloseAutoFocus={(event) => {
          event.preventDefault();
          const focusPage = mobileRouteFocus.current || window.matchMedia("(min-width: 1024px)").matches;
          mobileRouteFocus.current = false;
          requestAnimationFrame(() => { if (focusPage) (Array.from(mainRef.current?.querySelectorAll("h1") || []).find((heading) => heading.getClientRects().length) || mainRef.current)?.focus(); else moreButton.current?.focus(); });
        }}>
          <DialogHeader className="shrink-0 border-b px-5 py-5 pr-14 text-left"><DialogTitle className="text-sm">Business workspace</DialogTitle><DialogDescription className="sr-only">Choose a business page or switch workspace.</DialogDescription><WorkspaceSwitcher workspace="business" onSwitch={() => go("/dashboard")} /></DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2">{renderNavigation(true)}</div>
          <footer className="shrink-0 border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"><p className="text-sm font-semibold text-slate-950">{bootstrap.user.name}</p><p className="mt-1 text-xs text-slate-600">Private business workspace</p></footer>
        </DialogContent>
      </Dialog>
    </aside>
    <main ref={mainRef} tabIndex={-1} className="min-w-0 p-4 sm:p-6 lg:p-8">{!isResumeEditor && <WorkspaceMobileHeader workspace="Business" title={isApplicationAI ? "Application AI" : isApplicationProfile ? "Applicant profile" : isApplicationAnswers ? "Reusable answers" : isMemberPage ? memberName || "Team member" : isProjectDetail ? "Project workflow" : isClientDetail ? "Client details" : isTemplatesRoute ? "Templates" : path === "" ? "Today" : current?.[1] || "Business"} subtitle={path === "" ? `Welcome back, ${bootstrap.user.name}!` : "Business workspace"} actions={<Button type="button" variant="outline" size="icon" aria-label="Refresh business workspace" aria-busy={loading} title={clientDocumentDirty ? "Save your changes before refreshing" : "Refresh workspace"} disabled={loading || clientDocumentDirty} onClick={load}><RefreshCw size={18} className={loading ? "motion-safe:animate-spin" : ""} aria-hidden="true" /></Button>} />}{!isResumeEditor && <header className="mb-5 hidden flex-wrap items-start justify-between gap-3 border-b pb-4 lg:flex"><div><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm"><span className="text-slate-500">Business</span><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/>{isMemberPage && <><button type="button" onClick={() => go("team")} className="text-slate-600 hover:text-blue-700 hover:underline">Team Development</button><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/></>}{isClientDetail || isProjectDetail ? <><button type="button" onClick={() => go("clients")} className="text-slate-600 hover:text-blue-700 hover:underline">Clients</button><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/></> : null}<h1 tabIndex={-1} className="text-sm! leading-5! font-semibold text-slate-950">{isApplicationAI ? "Application AI" : isApplicationAnswers ? "Reusable answers" : isMemberPage ? memberName || "Team member" : isProjectDetail ? "Project workflow" : isClientDetail ? "Client details" : isTemplatesRoute ? "Templates" : current?.[1] || "Page not found"}</h1></nav><p className="mt-1 text-xs text-slate-600">{isApplicationsRoute ? "Prepare application materials and track submissions and replies." : bootstrap.plan ? `${bootstrap.plan.team_name} · ${bootstrap.currentWeek ? `Week ${bootstrap.currentWeek} of 12` : bootstrap.period === "upcoming" ? "Plan not started" : "Plan completed"}` : "Client workspace"} · {new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "long" }).format(new Date())}</p></div><div className="flex items-center gap-2"><ThemeToggle /><span className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs text-slate-600"><BriefcaseBusiness size={15} className="text-blue-700"/> Private workspace</span></div></header>}
      <WorkspaceMobilePage viewKey={location.pathname} motionDisabled={isResumeEditor}>
      {!current || (isClientRoute ? !clientRouteValid : isApplicationsRoute ? !applicationRouteValid : memberId && !isMemberPage) ? <ErrorState message="This business page does not exist." retry={() => go("")}/> : isApplicationsRoute ? <JobApplicationsView applicationId={/^\d+$/.test(memberId || "") ? memberId : undefined} initialTab={applicationInitialTab} navigate={go} notify={notify} resumeEditor={isResumeEditor} onDirtyChange={setClientDocumentDirty}/> : isProjectDetail ? <ProjectWorkflowView key={extraSegments[1]} clientId={memberId} projectId={extraSegments[1]} csrf={bootstrap.csrfToken} navigate={go} onDirtyChange={setClientDocumentDirty}/> : isClientDetail ? <ClientDetailView key={memberId} clientId={memberId} csrf={bootstrap.csrfToken} navigate={go}/> : isTemplatesRoute ? <TemplateLibraryView csrf={bootstrap.csrfToken} onDirtyChange={setClientDocumentDirty}/> : path === "clients" ? <ClientsView csrf={bootstrap.csrfToken} navigate={go}/> : isMemberPage ? <MemberDetailView key={memberId} memberId={memberId} csrf={bootstrap.csrfToken} currentWeek={bootstrap.currentWeek} onBack={() => go("team")} onMemberLoaded={onMemberLoaded} notify={notify}/> : path === "" ? <OverviewView overview={overview} bootstrap={bootstrap} navigate={go} csrf={bootstrap.csrfToken} revision={revision}/> : path === "week" ? <ThisWeekView bootstrap={bootstrap} overview={overview} csrf={bootstrap.csrfToken} notify={notify} refresh={changed}/> : path === "roadmap" ? <RoadmapView bootstrap={bootstrap} csrf={bootstrap.csrfToken} notify={notify} refresh={changed} revision={revision}/> : <SectionPage key={path} section={path} bootstrap={bootstrap} csrf={bootstrap.csrfToken} notify={notify} refresh={changed} revision={revision}/>}
      </WorkspaceMobilePage>
    </main>
  </div>
  <Dialog open={quickActionsOpen} onOpenChange={setQuickActionsOpen}><DialogContent id="business-quick-actions" overlayClassName="workspace-mobile-backdrop" className="personal-dashboard workspace-quick-sheet" onCloseAutoFocus={(event) => {
    event.preventDefault();
    if (window.matchMedia("(max-width: 1023px)").matches) mobileActionTrigger.current?.focus();
    else (Array.from(mainRef.current?.querySelectorAll("h1") || []).find((heading) => heading.getClientRects().length) || mainRef.current)?.focus();
    const action = pendingQuickAction.current; pendingQuickAction.current = null;
    if (action) queueMicrotask(() => go(action.target));
  }}><DialogHeader className="pr-10 text-left"><DialogTitle>Quick actions</DialogTitle><DialogDescription>Create something in your business workspace.</DialogDescription></DialogHeader><WorkspaceQuickActionGrid items={[
    { label: "Add client", Icon: Users, target: "clients?compose=client" },
    { label: "Add application", Icon: BriefcaseBusiness, target: "applications?compose=application" },
    ...(bootstrap.currentWeek ? [{ label: "Add action", Icon: ListChecks, target: "week?compose=action" }] : []),
  ]} onChoose={(action) => { pendingQuickAction.current = action; setQuickActionsOpen(false); }} /></DialogContent></Dialog>
  {!isResumeEditor && <WorkspaceBottomNav actionButtonRef={mobileActionTrigger} actionControls="business-quick-actions" actionOpen={quickActionsOpen} onAction={() => { pendingQuickAction.current = null; setQuickActionsOpen(true); }} moreButtonRef={moreButton} moreControls="mobile-business-navigation" moreOpen={mobileNav} onMore={() => setMobileNav(true)} onNavigate={go} items={[
    ...(bootstrap.plan ? [{ key: "today", label: "Today", href: `/business${location.search}`, Icon: LayoutDashboard, active: path === "" }] : []),
    { key: "clients", label: "Clients", href: `/business/clients${location.search}`, Icon: Users, active: isClientRoute && !isTemplatesRoute },
    { key: "applications", label: "Applications", href: `/business/applications${location.search}`, Icon: BriefcaseBusiness, active: isApplicationsRoute },
    ...(!bootstrap.plan ? [{ key: "templates", label: "Templates", href: `/business/clients/templates${location.search}`, Icon: FileText, active: isTemplatesRoute }] : []),
  ]}/>}{STANDARD_DASHBOARD_TOASTS_ENABLED
    ? toast && <div role={toast.danger ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm shadow-lg ${toast.danger ? "border-rose-300 text-rose-800" : "border-emerald-200 text-slate-900"}`}>{toast.danger ? <X size={16}/> : <ShieldCheck size={16} className="text-emerald-700"/>}{toast.message}</div>
    : <BusinessCompanion notification={notices[0]} pendingCount={notices.length} dismiss={dismissNotice}/>}</div>;
}
