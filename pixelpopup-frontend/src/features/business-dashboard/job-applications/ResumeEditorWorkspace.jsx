import { useEffect, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { CheckCircle2, Copy, Download, Eye, EyeOff, FileCheck2, FileJson, FileUp, History, Maximize2, MoreHorizontal, Printer, Save, Sparkles, Undo2, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { applicationProfile } from "../../../pages/portfolio/application/applicationData";
import { copyDocument } from "../client-workflow/shared";
import { downloadFile } from "./api";
import ResumeBuilder from "./ResumeBuilder";
import ResumeDocument from "./ResumeDocument";
import ResumeJSONDialog from "./ResumeJSONDialog";
import { resumeToJSON } from "./resumeJSON";
import ResumeExperienceDrafts from "./ResumeExperienceDrafts";
import ResumePriorityGaps from "./ResumePriorityGaps";

export default function ResumeEditorWorkspace({
  record, profile, artifact, body, onChange, onSave, onReview, onOpenReview, pendingCount,
  busy, loading, error, notify, onExit, onChecks, onHistory, onDownload, onPrint, onFocusPreview,
  resumeLayout, onLayoutChange, pageRef, previewOpen, onPreviewChange, focusRequest, onFocusHandled,
  transferState, onTransferStateChange,
  editorPanel = "preview", onEditorPanelChange, generationTools, proposalTools, onGenerateExperience, experienceBlockedReason,
  assessmentDirty, comparisonBlockedReason, onCompareRequirements, onResolveRequirement,
}) {
  const [transfer, setTransfer] = useState(null);
  const menuOpening = useRef(false);
  const menuTrigger = useRef(null);
  const sideRegion = useRef(null);
  useEffect(() => {
    if (editorPanel === "preview" || window.matchMedia("(min-width: 1280px)").matches) return;
    const frame = requestAnimationFrame(() => sideRegion.current?.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [editorPanel]);
  const dirty = body !== (artifact?.body || "");
  const reviewed = Boolean(artifact?.review?.reviewed && !dirty);
  const exportable = Boolean(artifact?.review?.exportable && !dirty && !busy && !loading);
  const disabled = busy || loading;
  const notes = transferState.reviewNotes;
  const undo = transferState.undo;
  const canUndoImport = undo && undo.after === body && undo.revision === artifact?.revision;
  function exportJSON() {
    downloadFile({ blob: new Blob([JSON.stringify(resumeToJSON(body, notes), null, 2)], { type: "application/json" }), filename: `resume-${record.id}.json` });
  }
  const menu = [
    { label: "Export editable JSON", Icon: FileJson, action: exportJSON, disabled: !body.trim() },
    { label: "Copy résumé text", Icon: Copy, action: () => copyDocument(body, notify), disabled: !body.trim() },
    { label: "Print / PDF", Icon: Printer, action: onPrint, disabled: !exportable },
    { label: "Download Word", Icon: Download, action: onDownload, disabled: !exportable },
    { label: "Previous drafts", Icon: History, action: onHistory, disabled: !artifact?.revision },
    { label: "Focused preview", Icon: Maximize2, action: onFocusPreview, disabled: !body.trim(), opensDialog: true },
    { label: "Tailoring & final check", Icon: FileCheck2, action: onChecks },
  ];
  return <div className="min-w-0 space-y-4">
    <header className="sticky top-0 z-20 space-y-3 border-b bg-[var(--pd-bg,#f8fafc)] pb-3 pt-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2" disabled={disabled} onClick={onExit}><X size={15}/>Close editor</Button><h1 className="text-xl font-semibold">Résumé editor</h1><p className="mt-1 break-words text-sm text-slate-600">{record.role} · {record.company}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setTransfer("import")}><FileUp size={15}/>Import JSON</Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setTransfer("prompt")}><Sparkles size={15}/>External AI prompt</Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onEditorPanelChange("generate")}><Sparkles size={15}/>Tailor résumé</Button>
          <Button type="button" size="sm" disabled={disabled || !dirty || !body.trim()} onClick={onSave}><Save size={15}/>{busy ? "Working…" : "Save draft"}</Button>
          <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button ref={menuTrigger} type="button" size="icon-sm" variant="outline" disabled={disabled} aria-label="More résumé actions"><MoreHorizontal size={17}/></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 max-w-[calc(100vw-2rem)] min-w-52 rounded-md border bg-white p-1 text-slate-950 shadow-md" onCloseAutoFocus={(event) => { if (menuOpening.current) { event.preventDefault(); menuOpening.current = false; } }}>
            {menu.map(({ label, Icon, action, disabled: unavailable, opensDialog }) => <DropdownMenu.Item key={label} disabled={unavailable} onSelect={() => { menuOpening.current = !!opensDialog; if (opensDialog) menuTrigger.current?.focus(); action(); }} className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"><Icon size={15} aria-hidden="true"/>{label}</DropdownMenu.Item>)}
            <DropdownMenu.Separator className="my-1 border-t"/><DropdownMenu.Item asChild><a href={applicationProfile.resume} download className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100"><Download size={15} aria-hidden="true"/>Original résumé PDF</a></DropdownMenu.Item>
          </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <p role="status">{dirty ? "Unsaved changes" : reviewed ? "Saved and reviewed" : artifact?.revision ? `Saved revision ${artifact.revision} · Review required` : "New draft"} · {body.length.toLocaleString()}/30,000 characters</p>
        <div className="flex flex-wrap gap-2">{pendingCount > 0 && <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onOpenReview}><FileCheck2 size={15}/>Review proposals ({pendingCount})</Button>}<Button type="button" size="sm" variant="outline" disabled={disabled || dirty || !artifact?.body || !profile?.sources_confirmed || reviewed} onClick={onReview}><CheckCircle2 size={15}/>Mark reviewed</Button><Button type="button" size="sm" variant="ghost" aria-expanded={previewOpen && editorPanel === "preview"} aria-controls="dedicated-resume-preview" onClick={() => { if (editorPanel === "preview") onPreviewChange(!previewOpen); else { onPreviewChange(true); onEditorPanelChange("preview"); } }}>{previewOpen && editorPanel === "preview" ? <EyeOff size={15}/> : <Eye size={15}/>} {previewOpen && editorPanel === "preview" ? "Hide preview" : "Show preview"}</Button></div>
      </div>
    </header>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {canUndoImport && <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm text-slate-700"><p>JSON applied to your unsaved draft.</p><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => { onChange(undo.before); onTransferStateChange((previous) => ({ ...previous, reviewNotes: undo.notes, undo: null })); }}><Undo2 size={15}/>Undo import</Button></div>}
    {notes.length > 0 && <details className="rounded-md border border-amber-200 bg-amber-50 p-3"><summary className="cursor-pointer text-sm font-medium text-amber-950 focus-visible:outline-2 focus-visible:outline-blue-600">Imported details to verify ({notes.length})</summary><p className="mt-2 text-xs leading-5 text-amber-950">Session notes only, excluded from saved résumé text. Export JSON to keep these notes before leaving the application. Confirm actual work through the posting’s Requirements before using a proposed claim.</p><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-950">{notes.map((note, index) => <li key={index} className="break-words">{note}</li>)}</ul></details>}
    {!!artifact?.warnings?.length && <details className="rounded-md border bg-white p-3 text-sm"><summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-blue-600">Saved draft review notes ({artifact.warnings.length})</summary><ul className="mt-2 list-disc space-y-2 pl-5">{artifact.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
    {!exportable && <p className="text-xs leading-5 text-slate-600">Save your draft and mark it reviewed against confirmed profile sources to enable Word and PDF export. JSON export keeps an editable draft.</p>}
    <div className={`grid min-w-0 items-start gap-5 ${previewOpen || editorPanel !== "preview" ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
      <section aria-label="Résumé content editor" className="min-w-0 rounded-lg border bg-white p-4">
        <ResumeBuilder body={body} sourceSections={profile?.resume_sections || []} onChange={onChange} busy={disabled} focusRequest={focusRequest} onFocusHandled={onFocusHandled}/>
      </section>
      <section ref={sideRegion} aria-label="Résumé preview and generation tools" className={`min-w-0 scroll-mt-48 space-y-3 xl:sticky xl:top-36 ${previewOpen || editorPanel !== "preview" ? "block" : "hidden"}`}>
        <Tabs value={editorPanel} onValueChange={onEditorPanelChange}>
          <TabsList variant="line" className="max-w-full overflow-x-auto" aria-label="Expanded résumé tools"><TabsTrigger value="preview" disabled={disabled}>Preview</TabsTrigger><TabsTrigger value="generate" disabled={disabled}>Tailor & check</TabsTrigger><TabsTrigger value="review" disabled={disabled}>Proposals</TabsTrigger><TabsTrigger value="experience" disabled={disabled}>Experience drafts</TabsTrigger></TabsList>
          <TabsContent value="preview" forceMount className="space-y-3 data-[state=inactive]:hidden"><div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="dedicated-resume-layout" className="text-sm font-medium">Preview layout</label><Select value={resumeLayout} onValueChange={onLayoutChange} disabled={disabled}><SelectTrigger id="dedicated-resume-layout" className="w-auto min-w-36"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="original">Original layout</SelectItem><SelectItem value="ats">ATS-friendly</SelectItem></SelectContent></Select></div>
            <div id="dedicated-resume-preview" tabIndex={previewOpen && editorPanel === "preview" ? 0 : -1} className="max-h-[calc(100dvh-14rem)] min-h-80 overflow-auto overscroll-contain rounded-md border bg-slate-100 p-2 focus-visible:outline-2 focus-visible:outline-blue-600 sm:p-4"><ResumeDocument body={body} profile={profile} pageRef={pageRef} layout={resumeLayout}/></div>
          </TabsContent>
          <TabsContent value="generate" className="rounded-lg border bg-white p-4"><ResumePriorityGaps record={record} assessmentDirty={assessmentDirty} busy={disabled} comparisonBlockedReason={comparisonBlockedReason} onCompare={onCompareRequirements} onResolve={onResolveRequirement}/>{generationTools}</TabsContent>
          <TabsContent value="review" className="rounded-lg border bg-white p-4">{proposalTools}</TabsContent>
          <TabsContent value="experience" forceMount className="rounded-lg border bg-white p-4 data-[state=inactive]:hidden"><ResumeExperienceDrafts body={body} notes={notes} examples={(record.preparation_examples?.items || []).filter((item) => item.mode === "example" && item.body)} busy={disabled} blockedReason={experienceBlockedReason} onGenerate={onGenerateExperience} onExternalPrompt={() => setTransfer("exploratory")} onChange={onChange} draftState={transferState.experienceDraft} onDraftStateChange={(update) => onTransferStateChange((previous) => ({ ...previous, experienceDraft: update(previous.experienceDraft) }))}/></TabsContent>
        </Tabs>
      </section>
    </div>
    {transfer && <ResumeJSONDialog mode={transfer === "exploratory" ? "prompt" : transfer} exploratory={transfer === "exploratory"} body={body} record={record} profile={profile} reviewed={reviewed} assessmentDirty={assessmentDirty} busy={disabled} onCancel={() => setTransfer(null)} onApply={({ body: next, reviewNotes }) => {
      onTransferStateChange((previous) => ({ ...previous, reviewNotes, undo: { before: body, after: next, revision: artifact?.revision, notes } }));
      onChange(next); setTransfer(null); notify("JSON imported into your unsaved résumé draft.");
    }}/>}
  </div>;
}
