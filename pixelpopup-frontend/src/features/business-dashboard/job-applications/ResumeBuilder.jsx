import { useEffect, useState } from "react";
import { FileText, Info, Plus, Trash2, Undo2 } from "lucide-react";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import { Button } from "../../personal-dashboard/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { EmptyState } from "../../personal-dashboard/components/Panel";
import ResumeSectionForm from "./ResumeSectionForm";
import ResumeSectionCard from "./ResumeSectionCard";
import { documentSections, sectionContent } from "./documentSections";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../personal-dashboard/ui/alert-dialog";

const assemble = (sections) => sections.map((section) => section.body.replace(/\s+$/, "")).join("\n\n") + "\n";
const isHeader = (section) => ["Whole document", "Header & introduction"].includes(section.title) || /^#\s+/.test(section.body);

export default function ResumeBuilder({ body, sourceSections = [], onChange, busy, focusRequest, onFocusHandled }) {
  const [mode, setMode] = useState("sections"), [dialog, setDialog] = useState(null);
  const [drag, setDrag] = useState(null), [drop, setDrop] = useState(null);
  const [remove, setRemove] = useState(null), [undo, setUndo] = useState(null);
  const [error, setError] = useState(""), [status, setStatus] = useState("");
  const sections = documentSections(body);
  useEffect(() => {
    if (!focusRequest || busy) return;
    const current = documentSections(body);
    const index = current.findIndex((section) => section.key === focusRequest.key);
    if (index >= 0) { setMode("sections"); setDialog({ index, section: current[index], baseline: body }); }
    onFocusHandled?.(null);
  }, [focusRequest, busy, body, onFocusHandled]);
  function changeDraft(next, message) {
    if (busy) return false;
    if (next.length > 30000) { setError("The draft would exceed 30,000 characters. Shorten it before adding content."); return false; }
    setUndo({ before: body, after: next }); setError(""); setStatus(message); onChange(next);
    return true;
  }
  function apply(text) {
    if (busy) return "An application action is in progress. Your section edits have been kept.";
    if (body !== dialog.baseline) return "The draft changed while this section was open. Close and reopen the section before applying; your entered text has been kept.";
    let next;
    if (dialog.insertAfter) {
      const parts = documentSections(dialog.baseline);
      const index = parts.findIndex((section) => section.key === dialog.insertAfter);
      parts.splice(index + 1, 0, { body: text });
      next = assemble(parts);
    } else if (dialog.index == null) next = `${body}${body.trim() ? "\n\n" : ""}${text}\n`;
    else {
      const parts = documentSections(dialog.baseline).map((section) => section.body);
      parts[dialog.index] = text.endsWith("\n") ? text : `${text}\n`;
      next = parts.join("");
    }
    if (next.length > 30000) return "The complete draft would exceed 30,000 characters. Shorten this section before applying.";
    changeDraft(next, dialog.index == null ? "Section added to your unsaved draft." : "Section updated in your unsaved draft."); setDialog(null);
    return "";
  }
  function move(sourceKey, targetKey, position) {
    if (busy || dialog || sourceKey === targetKey) return;
    const source = sections.find((section) => section.key === sourceKey);
    const target = sections.find((section) => section.key === targetKey);
    if (!source || !target || isHeader(source) || isHeader(target)) return;
    const parts = sections.filter((section) => section !== source);
    const index = parts.findIndex((section) => section === target) + Number(position === "after");
    parts.splice(index, 0, source);
    changeDraft(assemble(parts), `${source.title} moved ${position} ${target.title}. Save draft to keep this order.`);
  }
  function finishDrag() { setDrag(null); setDrop(null); }
  function dropSection(target, position) {
    if (drag && drag.baseline !== body) setError("The draft changed while dragging. Start dragging again; the newer text was kept.");
    else if (drag) move(drag.key, target.key, position);
    finishDrag();
  }
  function removeSection() {
    if (!remove || busy) return;
    if (remove.baseline !== body) setError("The draft changed while confirming. Reopen Remove section; your newer text was kept.");
    else changeDraft(assemble(sections.filter((section) => section.key !== remove.section.key)), `${remove.section.title} removed from the draft. Undo is available.`);
    setRemove(null);
  }
  return <div className="min-w-0 space-y-3">
    <Tabs value={mode} onValueChange={setMode}>
      <div className="flex flex-wrap items-center justify-between gap-2"><TabsList variant="line"><TabsTrigger value="sections" disabled={busy}><FileText size={15}/>Sections</TabsTrigger><TabsTrigger value="markdown" disabled={busy}>Full Markdown</TabsTrigger></TabsList><div className="flex gap-2"><Button type="button" size="sm" variant="ghost" disabled={busy || !undo || undo.after !== body} onClick={() => { onChange(undo.before); setUndo(null); setError(""); setStatus("Last section change undone."); }}><Undo2 size={15}/>Undo</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setDialog({ index: null, baseline: body })}><Plus size={15}/>Add section</Button></div></div>
      {error && <p role="alert" className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-900"><Info size={17} className="shrink-0" aria-hidden="true"/>{error}</p>}
      <p role="status" className="sr-only">{status}</p>
      <TabsContent value="sections" className="mt-3 space-y-3">
        {sections.length ? <ol className="divide-y rounded-md border bg-white">{sections.map((section, index) => <ResumeSectionCard key={section.key} section={section} busy={busy} pinned={isHeader(section)} dragging={drag?.key === section.key} dropPosition={drop?.key === section.key ? drop.position : null}
          canMoveEarlier={index > 0 && !isHeader(sections[index - 1])} canMoveLater={index < sections.length - 1 && !isHeader(sections[index + 1])}
          onMoveEarlier={() => move(section.key, sections[index - 1]?.key, "before")} onMoveLater={() => move(section.key, sections[index + 1]?.key, "after")}
          onEdit={() => setDialog({ index, section, baseline: body })}
          onDuplicate={() => setDialog({ index: null, insertAfter: section.key, baseline: body, initialValues: { title: `${section.title} (copy)`, content: sectionContent(section) } })}
          onRemove={() => setRemove({ section, baseline: body })} onDragStart={() => setDrag({ key: section.key, baseline: body })} onDragEnd={finishDrag}
          onDragOver={(position) => { if (!drag || drag.key === section.key || drag.baseline !== body) return false; setDrop({ key: section.key, position }); return true; }}
          onDrop={(position) => dropSection(section, position)}/>)}</ol> : <EmptyState icon={FileText} title="Build your résumé section by section" message="Add sections from editable templates or your real experience, or review and accept an AI proposal."/>}
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0" aria-hidden="true"/>Drag a handle or use the arrows to reorder. Edit headings and content, or duplicate/remove sections from their menu. Save draft afterward. Plain text stays together until it has section headings.</p>
      </TabsContent>
      <TabsContent value="markdown" className="mt-3"><fieldset disabled={busy}><MarkdownEditor id="application-resume-body" value={body} onChange={onChange} maxLength={30000}/></fieldset></TabsContent>
    </Tabs>
    {dialog && <ResumeSectionForm section={dialog.section} sourceSections={sourceSections} initialValues={dialog.initialValues} onCancel={() => setDialog(null)} onApply={apply}/>}
    <AlertDialog open={!!remove} onOpenChange={(open) => { if (!open) setRemove(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>Remove {remove?.section.title}?</AlertDialogTitle><AlertDialogDescription>This removes the section only from your unsaved draft. Your original résumé and saved revisions stay unchanged. You can undo this change before another draft edit.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep section</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={removeSection}><Trash2 size={15} aria-hidden="true"/>Remove section</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
