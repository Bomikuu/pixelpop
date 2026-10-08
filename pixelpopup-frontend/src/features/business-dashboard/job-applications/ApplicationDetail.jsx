import { useCallback, useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, FileCheck2, FileSearch, FileText, History, Info, LayoutDashboard, MessageSquare, Pencil, Receipt, Sparkles, UserRound } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { Panel, ErrorState, EmptyState } from "../../personal-dashboard/components/Panel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../personal-dashboard/ui/alert-dialog";
import ApplicationForm from "./ApplicationForm";
import ApplicationActivityForm from "./ApplicationActivityForm";
import ApplicationTimeline from "./ApplicationTimeline";
import ApplicationUsage from "./ApplicationUsage";
import GenerationQuoteDialog from "./GenerationQuoteDialog";
import ApplicationConversionForm from "./ApplicationConversionForm";
import ArtifactEditor from "./ArtifactEditor";
import ApplicationChecklist from "./ApplicationChecklist";
import RequirementsComparison from "./RequirementsComparison";
import ProposalReview from "./ProposalReview";
import AIActivityPanel from "./AIActivityPanel";
import PostingHighlights from "./PostingHighlights";
import AssessmentSummary from "./AssessmentSummary";
import AssessmentComparison from "./AssessmentComparison";
import RequirementDecisionForm from "./RequirementDecisionForm";
import SubmissionReviewForm from "./SubmissionReviewForm";
import FollowUpForm from "./FollowUpForm";
import ResumeClarificationForm from "./ResumeClarificationForm";
import GenerationResultBanner from "./GenerationResultBanner";
import ApplicationOverview from "./ApplicationOverview";
import ApplicationHeader from "./ApplicationHeader";
import ResumeOptimization from "./ResumeOptimization";
import { jobApi, labels, packageKinds, fieldError, generationLabel, isResumeReport } from "./api";

export default function ApplicationDetail({ applicationId, profile, settings, onBack, onProfile, onProfileChanged, onSettings, navigate, notify }) {
  const [record, setRecord] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [progress, setProgress] = useState(""), [dialog, setDialog] = useState(null), [confirm, setConfirm] = useState(null);
  const [section, setSection] = useState("overview"), [kind, setKind] = useState("resume"), [edits, setEdits] = useState({});
  const [reviewDirty, setReviewDirty] = useState(false), [reviewBusy, setReviewBusy] = useState(false), [reviewVersion, setReviewVersion] = useState(0);
  const [quote, setQuote] = useState(null), [refreshKey, setRefreshKey] = useState(0);
  const [activity, setActivity] = useState(null);
  const [requirementFocus, setRequirementFocus] = useState(null);
  const [gapRow, setGapRow] = useState(null);
  const [proposalFocus, setProposalFocus] = useState(null);
  const [resumeSectionFocus, setResumeSectionFocus] = useState(null);
  const resultBannerRef = useRef(null);
  const load = useCallback(async (signal) => {
    const result = await jobApi(`applications/${applicationId}/`, { signal }); setRecord(result); setRefreshKey((value) => value + 1); return result;
  }, [applicationId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal).catch((issue) => { if (!controller.signal.aborted) setError(issue.message); }); return () => controller.abort(); }, [load, profile?.updated_at]);
  const getArtifact = (key) => record?.artifacts.find((item) => item.kind === key);
  const assessment = getArtifact("assessment");
  const assessmentDirty = edits.assessment !== undefined && edits.assessment !== (assessment?.body || "");
  const hasDocumentUnsaved = Object.entries(edits).some(([key, text]) => text !== (getArtifact(key)?.body || ""));
  const hasUnsaved = reviewDirty || hasDocumentUnsaved;
  const actionBusy = busy || reviewBusy;
  const pendingCount = (key) => record?.pending_proposals?.find((item) => item.kind === key)?.count || 0;
  const provider = settings?.providers.find((item) => item.id === settings.settings.provider);
  const canGenerate = Boolean(profile?.sources_confirmed && provider?.configured);
  const generationBlockedReason = [!profile?.sources_confirmed && "Review your profile, tick the source confirmation and Save profile.", !provider?.configured && "Select a provider with a backend API key and Save AI settings."].filter(Boolean).join(" ");
  const experienceBlockedReason = actionBusy ? "Wait for the current application action to finish." : hasUnsaved ? "Save your draft edits and proposal decisions first." : generationBlockedReason || (assessment?.requirements_stale ? "Reassess requirements against your current sources first." : !getArtifact("resume")?.body?.trim() ? "Save a résumé draft in Application package first; the proposal will preserve it and suggest additions only." : "");
  const packagePrepared = packageKinds.every((key) => getArtifact(key)?.body || pendingCount(key) || key === "answers" && !record?.questions.length);
  const actionMessage = activity?.message || progress || "Updating the application from Django. See the activity panel for the result.";
  const generationStatus = actionBusy ? actionMessage : generationBlockedReason || (hasUnsaved ? "Save your edited drafts or finish the proposal review before preparing more drafts." : packagePrepared ? "Each available section already has a draft or pending proposal. Review proposals or open a saved draft to request changes." : "Choose Prepare missing drafts, review the cost quote, then review the generated proposals. Nothing is submitted automatically.");
  const workspace = ["drafts", "interview", "review"].includes(section) ? "files" : section === "posting" ? "requirements" : ["timeline", "usage"].includes(section) ? "activity" : section;
  function beginOperation(title, message) {
    const startedAt = Date.now();
    setProgress(title);
    setActivity({ type: "operation", title, message, startedAt, items: [{ kind: "operation", label: title, status: "waiting", startedAt, detail: message }] });
  }
  function updateOperation(message, status) {
    const endedAt = ["ready", "failed"].includes(status) ? Date.now() : undefined;
    setActivity((previous) => previous && ({ ...previous, message, endedAt, items: previous.items.map((item) => ({ ...item, status, detail: message, endedAt })) }));
  }
  function reviewActivity(title, message, status) {
    if (status === "waiting") beginOperation(title, message);
    else { updateOperation(message, status); if (["ready", "failed"].includes(status)) setProgress(""); }
  }
  function updateRequest(key, patch, message) {
    setActivity((previous) => previous && ({ ...previous, message, items: previous.items.map((item) => item.kind === key ? { ...item, ...patch } : item) }));
  }
  useEffect(() => {
    const unload = (event) => { if (hasUnsaved) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", unload); return () => window.removeEventListener("beforeunload", unload);
  }, [hasUnsaved]);
  async function refresh() {
    try { setError(""); await load(); }
    catch (issue) { setError(issue.message); }
  }
  function back() { if (hasUnsaved) setConfirm({ back: true }); else onBack(); }
  function applySection(next, nextKind) {
    if (nextKind) setKind(nextKind);
    else if (next === "interview") setKind("interview_prep");
    else if (next === "drafts" && kind === "interview_prep") setKind("resume");
    setSection(next);
  }
  function changeSection(next, nextKind) {
    if (reviewDirty && (next !== section || nextKind && nextKind !== kind)) setConfirm({ section: next, nextKind });
    else applySection(next, nextKind);
  }
  function changeWorkspace(next) {
    changeSection({ files: "drafts", activity: "timeline" }[next] || next);
  }
  function openFile(key) { changeSection(key === "interview_prep" ? "interview" : "drafts", key); }
  function editResumeSection(key) { setResumeSectionFocus({ key }); openFile("resume"); }
  function openReview(key) { changeSection("review", key); }
  function openAIResult(key, mode, proposalId) {
    if (hasUnsaved) { setError("Save your draft edits and review decisions before opening another AI result."); return; }
    setKind(key); setProposalFocus(proposalId || null);
    changeSection(isResumeReport(mode) ? "checks" : key === "assessment" ? "requirements" : "review");
  }
  function inspectRequirement(index) {
    if (actionBusy || reviewDirty) return;
    setRequirementFocus({ index });
    changeSection("requirements");
  }
  async function reviewedDraftUpdated(acceptedKind) {
    if (acceptedKind) setEdits((previous) => { const next = { ...previous }; delete next[acceptedKind]; return next; });
    await load();
  }
  function checklistAction(action) {
    if (action === "profile") onProfile();
    else if (["posting", "activity", "final_checks", "follow_up", "reschedule"].includes(action)) setDialog(action);
    else changeSection(pendingCount(action) ? "review" : "drafts", action);
  }
  async function markReviewed(key) {
    setBusy(true); setError("");
    beginOperation(`Confirming ${labels[key].toLowerCase()} review`, "Django is checking the saved revision and profile sources before recording your review. No AI call is being made.");
    try {
      await jobApi(`applications/${applicationId}/review/${key}/`, { method: "POST", body: { expected_revision: getArtifact(key)?.revision, source_digest: record.source_digest } });
      updateOperation("Review recorded. Refreshing the application and export eligibility from Django.", "received");
      await load(); updateOperation(`${labels[key]} review confirmed and the application refreshed.`, "ready"); notify(`${labels[key]} marked reviewed.`);
    } catch (issue) { setError(issue.message); updateOperation(`The review or application refresh could not finish: ${issue.message}`, "failed"); }
    finally { setBusy(false); setProgress(""); }
  }
  async function saveDraft(key = kind) {
    setBusy(true); setError("");
    beginOperation(`Saving ${labels[key].toLowerCase()}`, "Sending your edited text and expected revision to Django. The server checks for conflicting changes before saving; no AI call is being made.");
    try {
      const saved = await jobApi(`applications/${applicationId}/artifacts/${key}/`, { method: "PATCH", body: { body: edits[key] ?? getArtifact(key)?.body ?? "", expected_revision: getArtifact(key)?.revision || 0 } });
      setRecord((previous) => ({ ...previous, artifacts: [...previous.artifacts.filter((item) => item.kind !== key), saved] }));
      setEdits((previous) => { const next = { ...previous }; delete next[key]; return next; });
      updateOperation("Django returned the saved draft. Refreshing revisions and application status.", "received");
      await load(); updateOperation(`${labels[key]} saved and the application refreshed.`, "ready"); notify(`${labels[key]} saved.`);
    } catch (issue) { setError(fieldError(issue.fields, "body") || issue.message); updateOperation(`The save or application refresh could not finish: ${issue.message}`, "failed"); }
    finally { setBusy(false); setProgress(""); }
  }
  function requestGeneration(key = kind, mode = "routine") {
    if (mode === "fix") { setDialog("resume_clarifications"); return; }
    if (isResumeReport(mode)) { requestQuote([key], mode); return; }
    const current = getArtifact(key);
    if (current?.body || pendingCount(key)) setConfirm({ kind: key, mode }); else requestQuote([key], mode);
  }
  async function requestQuote(keys, mode = "routine") {
    setConfirm(null); setBusy(true); setError("");
    beginOperation("Checking request costs", `Requesting a quote for ${keys.map((key) => generationLabel(key, mode)).join(", ")}. Django checks sources, model pricing and your allowance; the AI provider has not been called.`);
    try { setQuote(await jobApi(`applications/${applicationId}/quote/`, { method: "POST", body: { kinds: keys, mode } })); updateOperation("Cost quote received. Review the estimate in the dialog before approving an AI call.", "ready"); }
    catch (issue) { setError(issue.message); updateOperation(`The cost quote could not be prepared: ${issue.message}`, "failed"); }
    finally { setBusy(false); setProgress(""); }
  }
  async function runGeneration(items) {
    setQuote(null); setBusy(true); setError("");
    setActivity({ type: "generation", title: "AI request activity", provider: items[0]?.provider, startedAt: Date.now(), message: "Your approved requests are queued. Existing saved drafts are kept.",
      sourceSummary: `Reviewed profile facts, résumé text, applicant contact details and portfolio URL, the ${record.role} posting at ${record.company}, and ${record.questions.length} screening question(s).`,
      items: items.map((item) => ({ ...item, label: generationLabel(item.kind, item.mode), providerLabel: settings.providers.find((value) => value.id === item.provider)?.label || item.provider, status: "queued", detail: "Not sent yet. This request runs after the preceding request finishes." })) });
    let current = record;
    let proposalKind;
    let completed = 0;
    let attempted = 0;
    try {
      for (const item of items) {
        const key = item.kind;
        const providerLabel = settings.providers.find((value) => value.id === item.provider)?.label || item.provider;
        const resultLabel = generationLabel(key, item.mode);
        const waitingMessage = `Requesting ${resultLabel.toLowerCase()} from ${providerLabel} / ${item.model}. Waiting for the backend/provider response.`;
        setKind(key); setProgress(`Requesting ${resultLabel.toLowerCase()}…`);
        updateRequest(key, { status: "waiting", startedAt: Date.now(), detail: waitingMessage + " The server checks your sources and allowance, then calls the provider and validates its output. These internal stages are not streamed." }, waitingMessage);
        const previous = current.artifacts.find((item) => item.kind === key);
        attempted += 1;
        const result = await jobApi(`applications/${applicationId}/generate/`, { method: "POST", body: { request_id: crypto.randomUUID(), kind: key, mode: item.mode, expected_revision: item.expected_revision, quote_token: item.quote_token, confirm_replace: Boolean(previous?.body) } });
        completed += 1;
        if (result.proposal_id) { proposalKind = key; setProposalFocus(result.proposal_id); }
        updateRequest(key, { status: "received", detail: "The generation endpoint returned successfully. Fetching saved results and current application status from Django." }, `${resultLabel} response received. Refreshing its saved result…`);
        current = await load();
        notify(result.proposal_id ? `${resultLabel} ready. Your saved document is unchanged—review the new proposal.` : `${resultLabel} complete. The new result is saved and ready to view.`);
        updateRequest(key, { status: "ready", proposalId: result.proposal_id, endedAt: Date.now(), detail: isResumeReport(item.mode) ? "The report is saved against this résumé revision and current sources. The résumé itself was not changed." : key === "assessment" ? "The saved assessment and requirement evidence are available for inspection." : "Your review proposal is saved. Accepting reviewed changes is a separate action; the existing draft was kept." }, `${resultLabel} is ready to review.`);
      }
      if (proposalKind) { setKind(proposalKind); setReviewVersion((value) => value + 1); setSection("review"); }
      else if (items.some((item) => isResumeReport(item.mode))) { setKind("resume"); setSection("checks"); }
      else setSection("requirements");
      setActivity((previous) => ({ ...previous, endedAt: Date.now(), message: "All requested results are loaded. Open an assessment or review a proposal; no application has been submitted." }));
      requestAnimationFrame(() => resultBannerRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" }));
    } catch (issue) {
      const remaining = items.slice(attempted).map((item) => labels[item.kind]).join(", ");
      setError(`${issue.message}${items.length > 1 ? ` ${completed} of ${items.length} requests completed. Completed results are kept.${remaining ? ` Not started: ${remaining}.` : ""}` : ""} Check AI usage before retrying a request with an uncertain result.`);
      setActivity((previous) => ({ ...previous, endedAt: Date.now(), message: `Stopped after ${completed} successful response(s). ${issue.message}`, items: previous.items.map((item) => item.status === "waiting" ? { ...item, status: "failed", endedAt: Date.now(), detail: `${issue.message} The request may have reached the provider. Check saved results and AI usage before retrying.` } : item.status === "queued" ? { ...item, status: "not_started", detail: "Not sent because the preceding request or refresh did not finish." } : item.status === "received" ? { ...item, endedAt: Date.now(), detail: "The generation response was received, but refreshing the saved result failed. Check results and AI usage before sending another request." } : item) }));
      try { await load(); } catch { /* Keep the error and previously loaded drafts available. */ }
    } finally { setBusy(false); setProgress(""); }
  }
  function preparePackage() {
    const missing = packageKinds.filter((key) => !getArtifact(key)?.body && !pendingCount(key) && (key !== "answers" || record.questions.length));
    if (missing.length) requestQuote(missing);
  }
  function openConversion() {
    if (hasUnsaved) { setError("Save your draft and review decisions before creating a client project."); return; }
    setDialog("conversion");
  }
  function openLinked(destination) {
    if (hasUnsaved) setConfirm({ destination });
    else navigate(destination);
  }
  if (!record) return error ? <ErrorState message={error} retry={refresh}/> : <p className="py-10 text-center text-sm text-slate-600">Loading application…</p>;
  return <div className="space-y-4">
    <ApplicationHeader record={record} assessment={assessment} dirty={assessmentDirty} busy={actionBusy} prepareBlocked={!canGenerate || hasUnsaved} prepared={packagePrepared} prepareStatus={generationStatus} onBack={back} onRefresh={refresh} onEdit={() => setDialog("posting")} onConvert={openConversion} onPrepare={preparePackage} onChecks={() => changeSection("checks")} onRequirements={() => changeSection("requirements")} onFlags={() => openFile("assessment")} onProposals={() => openReview(record.pending_proposals?.find((item) => item.count > 0)?.kind || "resume")} onSettings={() => { if (hasUnsaved) setConfirm({ settings: true }); else onSettings(); }}/>
    <Tabs value={workspace} onValueChange={changeWorkspace}>
    <div className="sticky top-0 z-30 -mx-1 overflow-x-auto border-b bg-[var(--pd-bg,#f8fafc)] px-1 py-2">
      <TabsList variant="line" aria-label="Application workspace"><TabsTrigger value="overview" disabled={actionBusy}><LayoutDashboard size={16}/>Overview</TabsTrigger><TabsTrigger value="requirements" disabled={actionBusy}><FileSearch size={16}/>Requirements</TabsTrigger><TabsTrigger value="checks" disabled={actionBusy}><FileCheck2 size={16}/>Checks{record.resume_check?.findings?.length > 0 && <span className="text-xs">({record.resume_check.findings.length})</span>}</TabsTrigger><TabsTrigger value="files" disabled={actionBusy}><FileText size={16}/>Files / Preview</TabsTrigger><TabsTrigger value="activity" disabled={actionBusy}><History size={16}/>Activity</TabsTrigger></TabsList>
    </div>
    {error && <ErrorState message={error}/>}
    {(actionBusy || activity?.items?.some((item) => item.status === "failed")) && <AIActivityPanel activity={activity} busy={actionBusy} onReview={openAIResult} onUsage={() => changeSection("usage")} onDismiss={() => setActivity(null)}/>}
    <GenerationResultBanner generations={record.generations} busy={actionBusy || hasUnsaved} onOpen={openAIResult} bannerRef={resultBannerRef}/>
    {(!canGenerate || hasUnsaved) && <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3" aria-label="AI assist readiness">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Info size={16} className="shrink-0 text-amber-800" aria-hidden="true"/>{!canGenerate ? "AI Assist is locked" : "Save your work to continue"}</h3><p id="application-ai-status" role="status" className="mt-1 text-sm leading-6 text-slate-700">{generationBlockedReason || "Save your edited drafts or finish the proposal review before preparing more drafts."}</p></div>
        {!profile?.sources_confirmed && <Button size="sm" variant="outline" type="button" onClick={onProfile} disabled={actionBusy}><UserRound size={15}/>Review profile</Button>}
        {!provider?.configured && <Button size="sm" variant="outline" type="button" onClick={() => { if (hasUnsaved) setConfirm({ settings: true }); else onSettings(); }} disabled={actionBusy}><Sparkles size={15}/>AI settings</Button>}
      </div>
      <details className="text-xs"><summary className="w-fit cursor-pointer rounded-sm text-amber-900 hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">See prerequisite details</summary><div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className={`flex items-center gap-1.5 ${profile?.sources_confirmed ? "text-emerald-800" : "text-amber-900"}`}>{profile?.sources_confirmed ? <CheckCircle2 size={15} aria-hidden="true"/> : <UserRound size={15} aria-hidden="true"/>}{profile?.sources_confirmed ? "Profile sources confirmed" : "Profile confirmation required"}</span>
        <span className={`flex items-center gap-1.5 ${provider?.configured ? "text-emerald-800" : "text-amber-900"}`}>{provider?.configured ? <CheckCircle2 size={15} aria-hidden="true"/> : <Info size={15} aria-hidden="true"/>}{provider?.configured ? `${provider.label}: server API key present` : "Server API key required"}</span>
      </div>
      <p className="mt-2 text-amber-900">An API key alone does not unlock generation. Confirm and save your profile first. Key presence does not verify vendor access or credit.</p></details>
    </section>}
    <div className={workspace === "overview" ? "" : "hidden"}>
      <AssessmentSummary artifact={assessment} dirty={assessmentDirty} decisions={record.requirement_decisions} onInspect={inspectRequirement} busy={actionBusy || reviewDirty}/>
    </div>
    <TabsContent value="overview" className="mt-2 space-y-4">
      <ApplicationOverview record={record} assessment={assessment} dirty={assessmentDirty} busy={actionBusy || reviewDirty} onAction={checklistAction} onInspect={inspectRequirement} onRequirements={() => changeSection("requirements")} onAssessment={() => openFile("assessment")} onFile={openFile} onChecks={() => changeSection("checks")} onActivity={() => changeSection("timeline")} onSettings={() => { if (hasUnsaved) setConfirm({ settings: true }); else onSettings(); }} onLinked={openLinked}/>
    </TabsContent>
    <TabsContent value="files" className="mt-2">
    <Tabs value={section} onValueChange={changeSection}><TabsList className="max-w-full overflow-x-auto" aria-label="Document workspace"><TabsTrigger value="drafts" disabled={actionBusy}><FileText size={15}/>Saved drafts</TabsTrigger><TabsTrigger value="review" disabled={actionBusy}><FileCheck2 size={15}/>Proposal review</TabsTrigger><TabsTrigger value="interview" disabled={actionBusy}><MessageSquare size={15}/>Interview preparation</TabsTrigger></TabsList>
      <TabsContent value="drafts" className="mt-3 space-y-4">
        <details className="rounded-md border bg-white p-3 text-xs text-slate-600"><summary className="cursor-pointer font-medium">Profile sources available to the AI</summary><div className="mt-3 grid gap-4 lg:grid-cols-2"><section><h3 className="mb-2 font-medium">Experience & portfolio</h3><p className="max-h-56 overflow-y-auto whitespace-pre-wrap leading-6">{profile?.facts || "No experience facts added."}</p></section><section><h3 className="mb-2 font-medium">Reviewed résumé {profile?.resume_filename && `· ${profile.resume_filename}`}</h3><p className="max-h-56 overflow-y-auto whitespace-pre-wrap leading-6">{profile?.resume_text || "No résumé text added."}</p></section></div></details>
        <Panel title="Application materials" description="Choose a saved document to edit or preview. Review proposals separately; nothing is submitted automatically.">
          <Tabs orientation="vertical" value={packageKinds.includes(kind) ? kind : "resume"} onValueChange={setKind} className="grid min-w-0 items-start gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
            <TabsList className="h-auto! w-full items-stretch!" aria-label="Saved application materials">{packageKinds.map((key) => <TabsTrigger key={key} value={key} disabled={actionBusy} className="w-full justify-start! whitespace-normal py-3 text-left"><FileText size={15}/>{labels[key]}{pendingCount(key) > 0 && <span className="ml-auto text-xs">({pendingCount(key)})</span>}{getArtifact(key)?.body && <span className="sr-only"> · draft saved</span>}</TabsTrigger>)}</TabsList>
            {packageKinds.map((key) => <TabsContent key={key} value={key} className="min-w-0">
              {key === "answers" && !record.questions.length ? <EmptyState icon={Info} title="No screening questions supplied" message="Add the actual questions from the application form to prepare answers." action={<Button variant="outline" onClick={() => setDialog("posting")}><Pencil size={15}/>Add questions</Button>}/> : <ArtifactEditor
                applicationId={applicationId} kind={key} artifact={getArtifact(key)} body={edits[key] ?? getArtifact(key)?.body ?? ""} profile={profile} pendingCount={pendingCount(key)}
                onChange={(text) => setEdits((previous) => ({ ...previous, [key]: text }))} onSave={() => saveDraft(key)} onGenerate={(mode) => requestGeneration(key, mode)} onReview={() => markReviewed(key)} onOpenReview={() => openReview(key)}
                busy={actionBusy} busyMessage={actionMessage} canGenerate={canGenerate} generationBlockedReason={generationBlockedReason}
                opportunities={record.resume_opportunities} resumeCheck={record.resume_check} optimizationBlockedReason={hasUnsaved ? "Save your draft edits and proposal decisions before requesting another report or proposal." : ""}
                showOptimization={false} onChecks={() => changeSection("checks")} focusRequest={key === "resume" ? resumeSectionFocus : null} onFocusHandled={setResumeSectionFocus}
                assessmentContext={{ role: record.role, company: record.company, decisions: record.requirement_decisions }} notify={notify}
              />}
            </TabsContent>)}
          </Tabs>
        </Panel>
      </TabsContent>
      <TabsContent value="interview" className="mt-3 space-y-4"><p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>Optional practice material—not confirmed employer questions. Write manually or explicitly request a quoted AI proposal. This does not affect submission readiness.</p><Panel title="Interview preparation"><ArtifactEditor applicationId={applicationId} kind="interview_prep" artifact={getArtifact("interview_prep")} body={edits.interview_prep ?? getArtifact("interview_prep")?.body ?? ""} profile={profile} pendingCount={pendingCount("interview_prep")} onChange={(text) => setEdits((previous) => ({ ...previous, interview_prep: text }))} onSave={() => saveDraft("interview_prep")} onGenerate={(mode) => requestGeneration("interview_prep", mode)} onReview={() => markReviewed("interview_prep")} onOpenReview={() => openReview("interview_prep")} busy={actionBusy} busyMessage={actionMessage} canGenerate={canGenerate} generationBlockedReason={generationBlockedReason} notify={notify}/></Panel></TabsContent>
      <TabsContent value="review" className="mt-3"><ProposalReview key={`proposal-${proposalFocus || "default"}`} applicationId={applicationId} kind={kind === "assessment" ? "resume" : kind} sourceDigest={record.source_digest} version={reviewVersion} targetProposalId={proposalFocus} onKindChange={setKind} onUpdated={reviewedDraftUpdated} onDirtyChange={setReviewDirty} onBusyChange={setReviewBusy} onActivity={reviewActivity} notify={notify} disabled={busy} draftDirty={hasDocumentUnsaved} onOpenDrafts={() => changeSection(kind === "interview_prep" ? "interview" : "drafts")}/></TabsContent>
    </Tabs>
    </TabsContent>
    <TabsContent value="requirements" className="mt-2"><Tabs value={section} onValueChange={changeSection}><TabsList aria-label="Requirements views"><TabsTrigger value="requirements"><FileSearch size={15}/>Evidence comparison</TabsTrigger><TabsTrigger value="posting"><BriefcaseBusiness size={15}/>Original posting</TabsTrigger></TabsList>
      <TabsContent value="requirements" className="mt-3 space-y-4"><RequirementsComparison artifact={assessment} decisions={record.requirement_decisions} historical={record.historical_requirement_decisions} onResolve={setGapRow} focusRequest={requirementFocus} onFocusHandled={setRequirementFocus} canGenerate={canGenerate} busy={actionBusy || hasUnsaved} onGenerate={() => requestGeneration("assessment")} onProposeExperience={() => requestGeneration("resume", "experience")} experienceBlockedReason={experienceBlockedReason} onOpenAssessment={() => openFile("assessment")}/><details className="rounded-md border bg-white p-3"><summary className="cursor-pointer text-sm font-medium hover:text-blue-700">Assessment changes & comparison</summary><div className="mt-3"><AssessmentComparison comparison={record.assessment_comparison}/></div></details></TabsContent>
      <TabsContent value="posting" className="mt-3"><Panel title="Reviewed job posting" action={<Button size="sm" variant="outline" onClick={() => setDialog("posting")}><Pencil size={15}/>Edit posting</Button>}><PostingHighlights posting={record.posting} requirements={assessment?.requirements_stale ? [] : assessment?.requirements || []} showSummary={false} collapsible/>{!!record.questions.length && <details className="mt-6 border-t pt-4"><summary className="cursor-pointer text-sm font-medium hover:text-blue-700">Screening questions ({record.questions.length})</summary><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">{record.questions.map((question, index) => <li key={index}>{question}</li>)}</ol></details>}</Panel></TabsContent>
    </Tabs></TabsContent>
    <TabsContent value="checks" className="mt-2 space-y-4">
      <ApplicationChecklist checklist={record.checklist} onAction={checklistAction} busy={actionBusy || reviewDirty}/>
      <Panel title="Résumé & recruiter checks" description="Source-backed preparation checks, not an ATS test or a hiring prediction.">
        <ResumeOptimization opportunities={record.resume_opportunities} check={record.resume_check} dirty={edits.resume !== undefined && edits.resume !== (getArtifact("resume")?.body || "")} blockedReason={actionBusy ? actionMessage : hasUnsaved ? "Save your draft edits and proposal decisions before requesting another report or proposal." : generationBlockedReason} busy={actionBusy} saved={!!getArtifact("resume")?.body?.trim()} pendingCount={pendingCount("resume")} onGenerate={(mode) => requestGeneration("resume", mode)} onReview={() => openReview("resume")} onEditSection={editResumeSection}/>
      </Panel>
    </TabsContent>
    <TabsContent value="activity" className="mt-2 space-y-4">
      {!actionBusy && !activity?.items?.some((item) => item.status === "failed") && <AIActivityPanel activity={activity} busy={false} onReview={openAIResult} onUsage={() => changeSection("usage")} onDismiss={() => setActivity(null)}/>}
      <Tabs value={section} onValueChange={changeSection}><TabsList aria-label="Application activity views"><TabsTrigger value="timeline"><History size={15}/>Timeline</TabsTrigger><TabsTrigger value="usage"><Receipt size={15}/>AI usage & budget</TabsTrigger></TabsList>
      <TabsContent value="timeline" className="mt-3 space-y-3">{["ready", "applied", "interviewing"].includes(record.status) && <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" disabled={actionBusy} onClick={() => setDialog("reschedule")}><CalendarClock size={15}/>Reschedule follow-up</Button><Button size="sm" disabled={actionBusy} onClick={() => setDialog("follow_up")}><MessageSquare size={15}/>Record follow-up</Button></div>}<ApplicationTimeline applicationId={applicationId} refreshKey={refreshKey} onActivity={() => setDialog("activity")}/></TabsContent>
      <TabsContent value="usage" className="mt-3"><ApplicationUsage applicationId={applicationId} refreshKey={refreshKey} notify={notify} onUseAlternative={(key, text) => { if (edits[key] !== undefined && edits[key] !== (getArtifact(key)?.body || "")) { setError("Save or clear your unsaved draft before opening an alternative."); return; } setEdits((previous) => ({ ...previous, [key]: text })); setKind(key); setSection(key === "interview_prep" ? "interview" : "drafts"); }}/></TabsContent>
      </Tabs>
    </TabsContent>
    </Tabs>
    {dialog === "posting" && <ApplicationForm record={record} onCancel={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} notify={notify}/>}
    {dialog === "resume_clarifications" && record.resume_check && <ResumeClarificationForm record={record} onCancel={() => setDialog(null)} onSaved={async () => { await load(); setDialog(null); await requestQuote(["resume"], "fix"); }} notify={notify}/>}
    {dialog === "activity" && <ApplicationActivityForm applicationId={applicationId} onCancel={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} notify={notify}/>}
    {dialog === "conversion" && <ApplicationConversionForm record={record} onCancel={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} notify={notify}/>}
    {gapRow && <RequirementDecisionForm record={record} row={gapRow} profile={profile} onCancel={() => setGapRow(null)} onSaved={async (result) => { if (result.profile_changed) await onProfileChanged(); await load(); setGapRow(null); }} notify={notify}/>}
    {dialog === "final_checks" && <SubmissionReviewForm record={record} onCancel={() => setDialog(null)} onSaved={async () => { await load(); setDialog(null); }} notify={notify}/>}
    {(dialog === "follow_up" || dialog === "reschedule") && <FollowUpForm record={record} mode={dialog === "reschedule" ? "reschedule" : "record"} onCancel={() => setDialog(null)} onSaved={async () => { await load(); setDialog(null); }} notify={notify}/>}
    {quote && <GenerationQuoteDialog quote={quote} busy={busy} onCancel={() => setQuote(null)} onConfirm={runGeneration}/>}
    <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>{confirm?.back || confirm?.settings || confirm?.section || confirm?.destination ? "Leave unsaved changes?" : confirm?.kind === "assessment" ? "Generate a new assessment?" : "Create a new document proposal?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.back || confirm?.settings || confirm?.section || confirm?.destination ? "Save your draft and review decisions first if you want to keep them." : "Your saved drafts and proposals will be kept. Next, review the API cost estimate before confirming generation."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { const action = confirm; setConfirm(null); if (action.back) onBack(); else if (action.settings) onSettings(); else if (action.destination) navigate(action.destination); else if (action.section) { setReviewDirty(false); applySection(action.section, action.nextKind); } else requestQuote([action.kind], action.mode); }}>{confirm?.back || confirm?.settings || confirm?.section || confirm?.destination ? "Leave without saving" : "Review estimate"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
