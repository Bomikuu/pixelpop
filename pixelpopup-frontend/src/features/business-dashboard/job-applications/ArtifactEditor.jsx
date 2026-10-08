import { useRef, useState } from "react";
import { CheckCircle2, Copy, Download, Eye, EyeOff, FileCheck2, History, Info, LayoutTemplate, List, Maximize2, MessageSquare, Printer, Save, Sparkles, TriangleAlert, X } from "lucide-react";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import DocumentPage from "../client-workflow/DocumentPage";
import { copyDocument, DocumentActions } from "../client-workflow/shared";
import ResumeDocument from "./ResumeDocument";
import { printResume } from "./resumePrint";
import { applicationProfile } from "../../../pages/portfolio/application/applicationData";
import { Button } from "../../personal-dashboard/ui/button";
import { EmptyState } from "../../personal-dashboard/components/Panel";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../personal-dashboard/ui/dialog";
import { downloadFile, jobApi, labels } from "./api";
import ReusableAnswerPicker from "./ReusableAnswerPicker";
import ResumeBuilder from "./ResumeBuilder";
import SelectableField from "../../personal-dashboard/components/SelectableField";
import ResumeOptimization from "./ResumeOptimization";
import FitAssessment from "./FitAssessment";

export default function ArtifactEditor({ applicationId, kind, artifact, body, profile, pendingCount = 0, onChange, onSave, onGenerate, onReview, onOpenReview, busy, busyMessage, canGenerate, generationBlockedReason, notify, opportunities, resumeCheck, optimizationBlockedReason, assessmentContext, showOptimization = true, onChecks, focusRequest, onFocusHandled }) {
  const [previewOpen, setPreviewOpen] = useState(() => window.matchMedia("(min-width: 1280px)").matches);
  const [history, setHistory] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const [answerPicker, setAnswerPicker] = useState(false);
  const [resumeLayout, setResumeLayout] = useState("original");
  const [sectionFocus, setSectionFocus] = useState(null);
  const [focusPreview, setFocusPreview] = useState(false);
  const pageRef = useRef(null);
  const previewId = `application-${applicationId}-${kind}-preview`;
  const dirty = body !== (artifact?.body || "");
  const generationHelpId = `application-${applicationId}-${kind}-generation-help`;
  const generationHelp = busy ? `${busyMessage || "Waiting for Django to return the application update."} Expand a row in the activity panel above for request details.` : dirty ? "Save your draft before generating or refining. Your unsaved edits will not be overwritten." : !canGenerate ? generationBlockedReason || "Confirm and save your profile sources, then configure your AI provider." : "";
  const isDocument = kind !== "assessment";
  const resumeExportable = Boolean(artifact?.review?.exportable && !dirty && !busy && !loading);
  async function download() {
    setLoading(true); setError("");
    try { downloadFile(await jobApi(`applications/${applicationId}/export/${kind}/${kind === "resume" ? `?layout=${resumeLayout}` : ""}`, { download: true })); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  }
  async function revisions() {
    setLoading(true); setError("");
    try { setHistory(await jobApi(`applications/${applicationId}/revisions/${kind}/`)); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  }
  async function printReviewedResume() {
    const html = pageRef.current?.innerHTML;
    if (!html) { setError("Open the saved résumé preview before printing."); return; }
    // Open synchronously from the click; an async fetch alone can trigger popup blocking.
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { notify("Allow pop-ups to open the résumé print dialog."); return; }
    win.opener = null;
    setLoading(true); setError("");
    try {
      const current = await jobApi(`applications/${applicationId}/`);
      const saved = current.artifacts.find((item) => item.kind === "resume");
      if (!saved?.review?.exportable || saved.revision !== artifact.revision || saved.reviewed_digest !== artifact.reviewed_digest || saved.body !== body) {
        throw new Error("The résumé or sources changed. Refresh the application and review the current saved draft before printing.");
      }
      printResume({ html, win, title: `${profile?.full_name || "Résumé"} — tailored résumé`, onMessage: notify, layout: resumeLayout });
    } catch (issue) { if (!win.closed) win.close(); setError(issue.message); }
    finally { setLoading(false); }
  }
  return <div className="space-y-4">
    {kind === "assessment" ? <FitAssessment artifact={artifact} body={body} context={assessmentContext} onChange={onChange} onSave={onSave} onGenerate={onGenerate} onHistory={revisions} busy={busy} loading={loading} generationHelp={generationHelp} error={error} notify={notify}/> : <>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">{labels[kind]}</h2><p className="mt-1 text-xs text-slate-600">Editable draft · {artifact?.revision ? `Revision ${artifact.revision}${artifact.edited ? " · Edited by you" : " · AI generated"}` : "Ready to prepare"}{dirty && " · Unsaved changes"}</p></div><div className="flex flex-wrap gap-2">
      {kind !== "resume" && <Button size="sm" variant="outline" disabled={busy || !canGenerate || dirty} aria-describedby={generationHelp ? generationHelpId : undefined} onClick={() => onGenerate("routine")}><Sparkles size={15}/>{isDocument ? artifact?.body ? "Propose changes" : "Generate proposal" : artifact?.body ? "Reassess" : "Generate assessment"}</Button>}
      {artifact?.body && kind !== "resume" && <Button size="sm" variant="outline" disabled={busy || !canGenerate || dirty} aria-describedby={generationHelp ? generationHelpId : undefined} onClick={() => onGenerate("refine")}><Sparkles size={15}/>{isDocument ? "Propose refinement" : "Refine assessment"}</Button>}
      <Button size="sm" disabled={busy || !dirty || !body.trim()} onClick={onSave}><Save size={15}/>Save draft</Button>
      {kind === "answers" && <Button size="sm" variant="outline" disabled={busy} onClick={() => setAnswerPicker(true)}><MessageSquare size={15}/>Use reviewed answer</Button>}
    </div></div>
    {generationHelp && <p id={generationHelpId} role="status" className={`flex items-start gap-2 rounded-md border p-3 text-sm leading-6 ${busy ? "border-blue-200 bg-blue-50 text-blue-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{busy ? <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true"/> : <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>}{generationHelp}</p>}
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {isDocument && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 p-3"><div><p className={`flex items-center gap-2 text-sm ${artifact?.review?.reviewed && !dirty ? "text-emerald-800" : "text-slate-700"}`}>{artifact?.review?.reviewed && !dirty ? <CheckCircle2 size={17}/> : <FileCheck2 size={17}/>} {artifact?.review?.reviewed && !dirty ? "Reviewed against current sources" : "This draft needs your review"}</p><p className="mt-1 text-xs text-slate-600">{pendingCount ? `${pendingCount} pending proposal${pendingCount === 1 ? "" : "s"}. Your saved draft has not been replaced.` : "Write a draft manually, or review an AI proposal section by section."}</p></div><div className="flex flex-wrap gap-2">{pendingCount > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={onOpenReview}><FileCheck2 size={15}/>Review proposals</Button>}<Button size="sm" variant="outline" disabled={busy || dirty || !artifact?.body || !profile?.sources_confirmed || artifact?.review?.reviewed} onClick={onReview}><CheckCircle2 size={15}/>Mark reviewed</Button></div></div>}
    {!!artifact?.warnings?.length && <details className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><summary className="flex cursor-pointer items-center gap-2 font-medium"><TriangleAlert size={17}/>Review before sending ({artifact.warnings.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5">{artifact.warnings.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
    {kind === "resume" && (showOptimization ? <ResumeOptimization opportunities={opportunities} check={resumeCheck} dirty={dirty} blockedReason={optimizationBlockedReason || generationHelp} busy={busy} saved={!!artifact?.body?.trim()} pendingCount={pendingCount} onGenerate={onGenerate} onReview={onOpenReview} onEditSection={(key) => setSectionFocus({ key })}/> : <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"><p className="text-xs text-slate-600">Keyword opportunities, tailoring and recruiter checks live in Checks.</p><Button size="sm" variant="outline" disabled={busy} onClick={onChecks}><FileCheck2 size={15}/>Optimize & check résumé</Button></div>)}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">{kind === "resume" ? "Edit each résumé section individually. Original layout follows your current PDF; choose ATS for a simpler single-column version." : kind === "interview_prep" ? "Practice suggestions only. Keep talking points source-backed and fill in any unknown answers yourself." : "Format your draft using the toolbar, with the same live document preview as Clients/Templates."}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" aria-expanded={previewOpen} aria-controls={previewId} onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? <EyeOff size={15}/> : <Eye size={15}/>} {previewOpen ? "Hide preview" : "Show preview"}</Button>
        <Button size="sm" variant="outline" disabled={!body.trim()} onClick={() => setFocusPreview(true)}><Maximize2 size={15}/>Focus preview</Button>
        {artifact?.revision > 0 && <Button size="sm" variant="outline" disabled={loading || busy} onClick={revisions}><History size={15}/>Previous drafts</Button>}
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {kind === "resume" ? <><Button size="sm" variant="outline" disabled={!body.trim()} onClick={() => copyDocument(body, notify)}><Copy size={15}/>Copy text</Button><Button size="sm" variant="outline" disabled={!resumeExportable} onClick={printReviewedResume}><Printer size={15}/>Print / PDF</Button></> : <DocumentActions title={labels[kind]} body={body} pageRef={pageRef} onMessage={notify}/>}
      {["resume", "cover_letter"].includes(kind) && <Button size="sm" variant="outline" disabled={!artifact?.body || dirty || loading || busy || kind === "resume" && !resumeExportable} onClick={download}><Download size={15}/>Download Word</Button>}
      {kind === "resume" && <Button asChild size="sm" variant="outline"><a href={applicationProfile.resume} download><Download size={15}/>My original résumé PDF</a></Button>}
    </div>
    {kind === "resume" && <SelectableField id="resume-layout" label="Résumé layout" value={resumeLayout} onChange={setResumeLayout} disabled={busy || loading} options={[{ value: "original", label: "Original layout", description: "Serif type, centered header and label/date columns—like your existing résumé.", icon: LayoutTemplate }, { value: "ats", label: "ATS-friendly", description: "One column with standard headings and readable bullets.", icon: List }]}/>}
    {kind === "resume" && !resumeExportable && !busy && !loading && <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"><FileCheck2 size={17} className="mt-0.5 shrink-0" aria-hidden="true"/><span>Before exporting: review any AI proposal, save the résumé draft, then choose <strong>Mark reviewed</strong>. Profile sources must also be confirmed. Changes to the résumé or its sources require another review.</span></p>}
    <div className={`grid min-w-0 gap-5 ${previewOpen ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "xl:grid-cols-1"}`}>
      {kind === "resume" ? <ResumeBuilder body={body} sourceSections={profile?.resume_sections || []} onChange={onChange} busy={busy} focusRequest={focusRequest || sectionFocus} onFocusHandled={() => { setSectionFocus(null); onFocusHandled?.(null); }}/> : <fieldset disabled={busy} className="min-w-0"><MarkdownEditor id={`application-${kind}-body`} value={body} onChange={onChange}/></fieldset>}
      <section id={previewId} aria-label="Live document preview" tabIndex={previewOpen ? 0 : -1} className={`max-h-[calc(100dvh-16rem)] min-h-80 min-w-0 overflow-auto overscroll-contain border border-slate-200 bg-slate-100/70 p-2 focus-visible:outline-2 focus-visible:outline-blue-600 sm:p-4 ${previewOpen ? "block" : "hidden"}`}>
        {kind === "resume" ? <div className="overflow-x-auto"><ResumeDocument body={body} profile={profile} pageRef={pageRef} layout={resumeLayout}/></div> : <DocumentPage body={body} pageRef={pageRef} allowImages={false}/>}
      </section>
    </div>
    {kind === "resume" && <p className="text-xs text-slate-600">Word and Print / PDF use your selected layout; the original résumé PDF stays unchanged. Save and mark reviewed before exporting. In the print dialog, choose Save as PDF and disable browser headers/footers. Use ATS-friendly for portals that require a single-column résumé; parsing varies by employer.</p>}
    {dirty && <p className="text-xs text-slate-600">Save your edits before downloading Word or generating again.{kind !== "resume" && " Print / PDF uses the current preview."}</p>}
    {answerPicker && <ReusableAnswerPicker notify={notify} onCancel={() => setAnswerPicker(false)} onInsert={({ question, body: answer }) => { const next = `${body}${body.trim() ? "\n\n---\n\n" : ""}### ${question}\n\n${answer}`; if (next.length > 30000) { setError("This answer would exceed the draft's 30,000-character limit. Shorten the draft first."); setAnswerPicker(false); return; } onChange(next); setAnswerPicker(false); notify("Answer inserted into your unsaved draft."); }}/>} 
    {!!artifact?.evidence?.length && <details className="border-t pt-3 text-xs text-slate-600"><summary className="cursor-pointer font-medium">Source facts used</summary><ul className="mt-2 list-disc space-y-1 pl-5">{artifact.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul></details>}
    </>}
    <Dialog open={focusPreview} onOpenChange={setFocusPreview}><DialogContent showCloseButton={false} className="personal-dashboard grid h-[92dvh] w-[calc(100%-2rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden bg-white p-4 sm:max-w-[94vw]">
      <DialogHeader className="flex-row items-center justify-between gap-3 text-left"><div><DialogTitle>{labels[kind]} preview</DialogTitle><DialogDescription className="mt-1">Focused reading view. Close to return to your unchanged editor.</DialogDescription></div><DialogClose asChild><Button size="sm" variant="outline"><X size={15}/>Exit focus</Button></DialogClose></DialogHeader>
      <div className="min-h-0 min-w-0 overflow-auto overscroll-contain bg-slate-100 p-2 sm:p-5" tabIndex={0} aria-label="Focused document preview">{kind === "resume" ? <ResumeDocument body={body} profile={profile} layout={resumeLayout}/> : <DocumentPage body={body} allowImages={false}/>}</div>
    </DialogContent></Dialog>
    <Dialog open={history !== null} onOpenChange={(open) => { if (!open) setHistory(null); }}><DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white sm:max-w-3xl"><DialogHeader><DialogTitle>Previous {labels[kind].toLowerCase()} drafts</DialogTitle><DialogDescription>Copy an earlier version into the editor, then save it as a new revision.</DialogDescription></DialogHeader>{history?.filter((item) => item.body).length ? history.filter((item) => item.body).map((item) => <section key={item.id} className="space-y-2 border-t pt-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">Revision {item.revision}</h3><Button size="sm" variant="outline" disabled={dirty || busy} onClick={() => { onChange(item.body); setHistory(null); }}>Use this version</Button></div><p className="max-h-52 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-slate-600">{item.body}</p></section>) : <EmptyState icon={History} title="No earlier text saved" message="Earlier drafts appear after you save edits or regenerate."/>}{dirty && <p className="text-xs text-slate-600">Save your current edits before restoring an earlier draft.</p>}</DialogContent></Dialog>
  </div>;
}
