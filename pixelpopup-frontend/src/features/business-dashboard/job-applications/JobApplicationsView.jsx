import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarClock, Download, FileText, MessageSquare, Plus, Search, Settings2, UserRound } from "lucide-react";
import { applicationProfile } from "../../../pages/portfolio/application/applicationData";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { Panel, EmptyState, ErrorState } from "../../personal-dashboard/components/Panel";
import SummaryTiles from "../../personal-dashboard/components/SummaryTiles";
import ApplicationForm from "./ApplicationForm";
import ApplicantProfileForm from "./ApplicantProfileForm";
import ApplicationDetail from "./ApplicationDetail";
import ApplicationAISettings from "./ApplicationAISettings";
import ReusableAnswersView from "./ReusableAnswersView";
import ApplicationFollowUps from "./ApplicationFollowUps";
import ApplicationListItem from "./ApplicationListItem";
import ApplicationBudget from "./ApplicationBudget";
import { jobApi, statuses } from "./api";

export default function JobApplicationsView({ applicationId, initialTab = "applications", navigate, notify }) {
  const [tab, setTab] = useState(initialTab), [data, setData] = useState(null), [profile, setProfile] = useState(null), [settings, setSettings] = useState(null);
  const [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1), [version, setVersion] = useState(0);
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [dialog, setDialog] = useState(null);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([jobApi("profile/", { signal: controller.signal }), jobApi("settings/", { signal: controller.signal })])
      .then(([p, s]) => { setProfile(p); setSettings(s); }).catch((issue) => { if (!controller.signal.aborted) setError(issue.message); });
    return () => controller.abort();
  }, [version, tab]);
  useEffect(() => {
    if (applicationId || tab !== "applications") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      jobApi(`applications/?page=${page}&q=${encodeURIComponent(query)}${status === "all" ? "" : `&status=${status}`}`, { signal: controller.signal })
        .then((result) => { setData(result); setLoading(false); }).catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setLoading(false); } });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, status, page, version, applicationId, tab]);
  function showSettings() { navigate("applications/ai"); }
  async function profileChanged() { setProfile(await jobApi("profile/")); refresh(); }
  function selectTab(value) {
    navigate(value === "applications" ? "applications" : `applications/${value}`);
  }
  if (applicationId && !/^\d+$/.test(applicationId)) return <EmptyState title="This application does not exist" action={<Button onClick={() => navigate("applications")}>Back to applications</Button>}/>;
  if (applicationId) return <>{error && <ErrorState message={error} retry={refresh}/>}<ApplicationDetail key={applicationId} applicationId={applicationId} profile={profile} settings={settings} navigate={navigate} onBack={() => navigate("applications")} onProfile={() => setDialog("profile")} onProfileChanged={profileChanged} onSettings={showSettings} notify={notify}/>{dialog === "profile" && profile && <ApplicantProfileForm profile={profile} onCancel={() => setDialog(null)} onSaved={(saved) => { setProfile(saved); setDialog(null); refresh(); }} notify={notify}/>}</>;
  return <div className="space-y-4"><Tabs value={tab} onValueChange={selectTab}><div className="flex flex-wrap items-center justify-between gap-3"><TabsList variant="line" className="max-w-full overflow-x-auto"><TabsTrigger value="applications"><BriefcaseBusiness size={16}/>Applications</TabsTrigger><TabsTrigger value="followups"><CalendarClock size={16}/>Follow-ups</TabsTrigger><TabsTrigger value="profile"><UserRound size={16}/>Applicant profile</TabsTrigger><TabsTrigger value="answers"><MessageSquare size={16}/>Reusable answers</TabsTrigger><TabsTrigger value="ai"><Settings2 size={16}/>Application AI</TabsTrigger></TabsList><Button asChild size="sm" variant="outline"><a href={applicationProfile.resume} download><Download size={15}/>Download my résumé</a></Button></div>
    <TabsContent value="applications" className="mt-4 space-y-4">
      <SummaryTiles items={[{ label: "Tracked applications", value: data?.summary?.total ?? 0, icon: "count" }, { label: "Submitted", value: data?.summary?.applied ?? 0, icon: "completed" }, { label: "Interviewing", value: data?.summary?.interviewing ?? 0, icon: "loans" }, { label: "Follow-ups due", value: data?.summary?.follow_ups_due ?? 0, icon: "deadline", statusTone: data?.summary?.follow_ups_due ? "negative" : "neutral" }]}/>
      <ApplicationBudget usage={data?.ai_usage || settings?.usage} compact onSettings={showSettings}/>
      <Panel title="Job applications" description="Prepare materials, submit them yourself, and keep replies with each job." action={<Button onClick={() => setDialog("application")}><Plus size={16}/>Add application</Button>}>
        <div className="mb-4 flex flex-wrap items-center gap-3"><div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true"/><Input type="search" aria-label="Search job applications" className="pl-9" placeholder="Search roles, companies, or platforms…" maxLength={160} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}/></div><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger aria-label="Filter application status" className="min-w-40"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="all">All statuses</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent></Select></div>
        {error && <ErrorState message={error} retry={refresh}/>}
        {loading ? <p role="status" className="py-10 text-center text-sm text-slate-600">Loading applications…</p> : !error && data?.results.length ? <ul className="divide-y">{data.results.map((item) => <ApplicationListItem key={item.id} item={item} navigate={navigate}/>)}</ul> : !error && <EmptyState icon={BriefcaseBusiness} title={query || status !== "all" ? "No matching applications" : "Your next opportunity starts here"} message={query || status !== "all" ? "Try another search or status." : "Add a job posting, review your profile, and prepare the application materials."}/>}
        {data && (data.next || data.previous) && <div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-slate-600">Page {page} · {data.count} applications</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!data.previous || loading} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={!data.next || loading} onClick={() => setPage(page + 1)}>Next</Button></div></div>}
      </Panel>
    </TabsContent>
    <TabsContent value="profile" className="mt-4"><Panel title="Applicant profile" description="Your portfolio, ASTA experience, and reviewed résumé are the sources for generated applications." action={<Button disabled={!profile} onClick={() => setDialog("profile")}><UserRound size={16}/>Review profile</Button>}><div className="space-y-4"><p className="text-sm">{profile?.full_name || "Add your application profile"}</p><p className="text-sm text-slate-600">{profile?.sources_confirmed ? "Sources reviewed and confirmed." : "Sources need your review before AI generation."}</p>{profile?.facts && <p className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-600">{profile.facts}</p>}{profile?.resume_filename && <p className="flex items-center gap-2 text-sm text-slate-600"><FileText size={16}/>{profile.resume_filename}</p>}{!profile?.facts && !profile?.resume_text && <EmptyState icon={UserRound} title="Build your source profile" message="Use your existing portfolio and ASTA experience, upload a résumé, and review the facts."/>}</div></Panel></TabsContent>
    <TabsContent value="ai" className="mt-4"><ApplicationAISettings notify={notify}/></TabsContent>
    <TabsContent value="answers" className="mt-4"><ReusableAnswersView notify={notify}/></TabsContent>
    <TabsContent value="followups" className="mt-4"><ApplicationFollowUps navigate={navigate} notify={notify}/></TabsContent>
  </Tabs>
    {dialog === "application" && <ApplicationForm onCancel={() => setDialog(null)} onSaved={(saved) => { setDialog(null); refresh(); navigate(`applications/${saved.id}`); }} notify={notify}/>}
    {dialog === "profile" && profile && <ApplicantProfileForm profile={profile} onCancel={() => setDialog(null)} onSaved={(saved) => { setProfile(saved); setDialog(null); refresh(); }} notify={notify}/>}
  </div>;
}
