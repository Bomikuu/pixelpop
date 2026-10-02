import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, ChevronRight, ClipboardCheck, FileText, GitPullRequest, LayoutDashboard, ListChecks, Menu, NotebookPen, PanelLeftClose, PanelLeftOpen, ShieldCheck, Target, Users, Workflow, X } from "lucide-react";
import { leadershipApi } from "./api";
import { OverviewView, RoadmapView, SectionPage, ThisWeekView } from "./views/BusinessViews";
import MemberDetailView from "./views/MemberDetailView";
import ClientsView from "./client-workflow/ClientsView";
import ClientDetailView from "./client-workflow/ClientDetailView";
import ProjectWorkflowView from "./client-workflow/ProjectWorkflowView";
import TemplateLibraryView from "./client-workflow/TemplateLibraryView";
import { Button } from "../personal-dashboard/ui/button";
import { Input } from "../personal-dashboard/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../personal-dashboard/ui/dialog";
import { ErrorState } from "../personal-dashboard/components/Panel";
import "../personal-dashboard/styles/theme.css";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [path, memberId, ...extraSegments] = location.pathname.slice("/business".length).replace(/^\//, "").split("/");
  const current = destinations.find(([key]) => key === path);
  const isMemberPage = path === "team" && Boolean(memberId) && /^\d+$/.test(memberId) && extraSegments.length === 0;
  const isClientRoute = path === "clients";
  const isTemplatesRoute = path === "clients" && memberId === "templates" && extraSegments.length === 0;
  const isClientDetail = path === "clients" && /^\d+$/.test(memberId || "") && extraSegments.length === 0;
  const isProjectDetail = path === "clients" && /^\d+$/.test(memberId || "") && extraSegments[0] === "projects" && /^\d+$/.test(extraSegments[1] || "") && extraSegments.length === 2;
  const clientRouteValid = path === "clients" && (!memberId || isTemplatesRoute || isClientDetail || isProjectDetail);
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
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem("business-dashboard-nav-collapsed") === "true"; } catch { return false; } });
  const [toast, setToast] = useState(null);
  const [clientDocumentDirty, setClientDocumentDirty] = useState(false);
  const notify = useCallback((message, danger = false) => { setToast({ message, danger, id: Date.now() }); }, []);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(null), 4200); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { const original = document.title; const meta = document.querySelector('meta[name="robots"]') || document.createElement("meta"); const previous = meta.getAttribute("content"); meta.name = "robots"; meta.content = "noindex, nofollow"; if (!meta.parentNode) document.head.appendChild(meta); document.title = `${isMemberPage ? memberName || "Team member" : current?.[1] || "Business"} · Business Dashboard`; return () => { document.title = original; if (previous === null) meta.remove(); else meta.content = previous; }; }, [current, isMemberPage, memberName]);
  const load = useCallback(async () => { setLoading(true); setError(""); setErrorStatus(null); try { const data = await leadershipApi("bootstrap/"); setBootstrap(data); if (data.plan) setOverview(await leadershipApi("overview/")); else setOverview(null); } catch (cause) { setError(cause.message); setErrorStatus(cause.status); setBootstrap(null); setOverview(null); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { let day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", dateStyle: "short" }).format(new Date()); const interval = setInterval(() => { const next = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", dateStyle: "short" }).format(new Date()); if (next !== day) { day = next; load(); } }, 60_000); return () => clearInterval(interval); }, [load]);
  useEffect(() => { if (!bootstrap?.plan || revision === 0) return; leadershipApi("overview/").then(setOverview).catch((cause) => notify(cause.message, true)); }, [revision, bootstrap?.plan, notify]);
  const changed = useCallback(() => setRevision((old) => old + 1), []);
  const go = (destination) => { const next = "/business" + (destination ? `/${destination}` : ""); if (clientDocumentDirty && location.pathname !== next && !window.confirm("Discard unsaved document changes?")) return; setClientDocumentDirty(false); navigate(next); setMobileNav(false); };
  const toggleCollapsed = () => setCollapsed((old) => { try { localStorage.setItem("business-dashboard-nav-collapsed", String(!old)); } catch { /* optional storage */ } return !old; });
  if (loading && !bootstrap) return <main className="personal-dashboard grid min-h-screen place-items-center bg-slate-50" aria-busy="true"><p className="text-sm text-slate-600">Loading your private business dashboard…</p></main>;
  if (error && !bootstrap) return <main className="personal-dashboard grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-md"><ErrorState message={errorStatus === 403 || errorStatus === 401 ? "Sign in to your Django account to access this private dashboard." : error} retry={load}/>{(errorStatus === 403 || errorStatus === 401) && <a href="/admin/login/?next=/business" className="mt-4 inline-block text-sm text-blue-700 underline">Open Django sign-in</a>}</div></main>;
  if (!bootstrap?.plan && !isClientRoute) return <main className="personal-dashboard min-h-screen bg-slate-50"><SetupDialog open csrf={bootstrap?.csrfToken || ""} onCreated={load}/></main>;
  return <div className="personal-dashboard min-h-screen bg-[#f8fafc]"><div className={`grid w-full ${collapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]"}`}>
    <aside className={`border-b bg-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r ${mobileNav ? "" : "max-lg:pb-0"}`}><div className="flex h-16 items-center justify-between gap-2 px-4"><a href="/business" onClick={(event) => { event.preventDefault(); go(""); }} className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-slate-950"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-600 text-white"><BriefcaseBusiness size={18}/></span><span className={collapsed ? "truncate lg:hidden" : "truncate"}>Business workspace</span></a><Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileNav((old) => !old)} aria-label={mobileNav ? "Close navigation" : "Open navigation"}>{mobileNav ? <X/> : <Menu/>}</Button><Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen/> : <PanelLeftClose/>}</Button></div>
      <nav aria-label="Business dashboard" className={`${mobileNav ? "block" : "hidden"} space-y-1 px-3 pb-5 lg:block`}>{destinations.map(([key, label, Icon, group], index) => !bootstrap.plan && group !== "Client work" ? null : <div key={key}>{(index === 0 || group !== destinations[index - 1][3]) && <p className={`px-3 pb-2 pt-4 text-xs font-medium text-slate-500 ${collapsed ? "lg:hidden" : ""}`}>{group}</p>}<Button variant="ghost" className={`w-full justify-start px-3 font-normal ${collapsed ? "lg:justify-center lg:px-0" : ""} ${(key === "clients/templates" ? isTemplatesRoute : path === key && !isTemplatesRoute) ? "bg-blue-50 text-blue-700" : "text-slate-600"}`} asChild><a href={`/business${key ? `/${key}` : ""}`} title={collapsed ? label : undefined} aria-label={label} aria-current={(key === "clients/templates" ? isTemplatesRoute : path === key && !isTemplatesRoute) ? "page" : undefined} onClick={(event) => { if (!event.metaKey && !event.ctrlKey) { event.preventDefault(); go(key); } }}><Icon size={17} aria-hidden="true"/><span className={collapsed ? "lg:hidden" : ""}>{label}</span></a></Button></div>)}<div className="mt-4 border-t pt-3"><Button asChild variant="ghost" className={`w-full justify-start px-3 font-normal text-slate-600 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}><a href="/dashboard" title="Personal dashboard"><ArrowLeft size={17}/><span className={collapsed ? "lg:hidden" : ""}>Personal dashboard</span></a></Button></div></nav><p className={`border-t px-5 py-4 text-xs leading-5 text-slate-500 ${mobileNav ? "block" : "hidden"} ${collapsed ? "lg:hidden" : "lg:block"}`}>Private workspace<br/>Signed in as {bootstrap.user.name}</p>
    </aside>
    <main className="min-w-0 p-4 sm:p-6 lg:p-8"><header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm"><span className="text-slate-500">Business</span><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/>{isMemberPage && <><button type="button" onClick={() => go("team")} className="text-slate-600 hover:text-blue-700 hover:underline">Team Development</button><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/></>}{isClientDetail || isProjectDetail ? <><button type="button" onClick={() => go("clients")} className="text-slate-600 hover:text-blue-700 hover:underline">Clients</button><ChevronRight size={14} className="text-slate-400" aria-hidden="true"/></> : null}<h1 className="text-sm! leading-5! font-semibold text-slate-950">{isMemberPage ? memberName || "Team member" : isProjectDetail ? "Project workflow" : isClientDetail ? "Client details" : isTemplatesRoute ? "Templates" : current?.[1] || "Page not found"}</h1></nav><p className="mt-1 text-xs text-slate-600">{bootstrap.plan ? `${bootstrap.plan.team_name} · ${bootstrap.currentWeek ? `Week ${bootstrap.currentWeek} of 12` : bootstrap.period === "upcoming" ? "Plan not started" : "Plan completed"}` : "Client workspace"} · {new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "long" }).format(new Date())}</p></div><span className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs text-slate-600"><BriefcaseBusiness size={15} className="text-blue-700"/> Private workspace</span></header>
      {!current || (isClientRoute ? !clientRouteValid : memberId && !isMemberPage) ? <ErrorState message="This business page does not exist." retry={() => go("")}/> : isProjectDetail ? <ProjectWorkflowView key={extraSegments[1]} clientId={memberId} projectId={extraSegments[1]} csrf={bootstrap.csrfToken} navigate={go} onDirtyChange={setClientDocumentDirty}/> : isClientDetail ? <ClientDetailView key={memberId} clientId={memberId} csrf={bootstrap.csrfToken} navigate={go}/> : isTemplatesRoute ? <TemplateLibraryView csrf={bootstrap.csrfToken} onDirtyChange={setClientDocumentDirty}/> : path === "clients" ? <ClientsView csrf={bootstrap.csrfToken} navigate={go}/> : isMemberPage ? <MemberDetailView key={memberId} memberId={memberId} csrf={bootstrap.csrfToken} currentWeek={bootstrap.currentWeek} onBack={() => go("team")} onMemberLoaded={onMemberLoaded} notify={notify}/> : path === "" ? <OverviewView overview={overview} bootstrap={bootstrap} navigate={go} csrf={bootstrap.csrfToken} revision={revision}/> : path === "week" ? <ThisWeekView bootstrap={bootstrap} overview={overview} csrf={bootstrap.csrfToken} notify={notify} refresh={changed}/> : path === "roadmap" ? <RoadmapView bootstrap={bootstrap} csrf={bootstrap.csrfToken} notify={notify} refresh={changed} revision={revision}/> : <SectionPage key={path} section={path} bootstrap={bootstrap} csrf={bootstrap.csrfToken} notify={notify} refresh={changed} revision={revision}/>}
    </main>
  </div>{toast && <div role={toast.danger ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm shadow-lg ${toast.danger ? "border-rose-300 text-rose-800" : "border-emerald-200 text-slate-900"}`}>{toast.danger ? <X size={16}/> : <ShieldCheck size={16} className="text-emerald-700"/>}{toast.message}</div>}</div>;
}
