import { useEffect, useRef, useState } from "react";
import { Archive, CheckCircle2, Eye, MessageSquare, Pencil, Plus, Search, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../personal-dashboard/ui/alert-dialog";
import { Panel, EmptyState, ErrorState } from "../../personal-dashboard/components/Panel";
import ReusableAnswerForm, { answerCategories } from "./ReusableAnswerForm";
import WorkflowPages from "./WorkflowPages";
import { jobApi } from "./api";

export default function ReusableAnswersView({ notify, onSelect, selectionOnly = false }) {
  const [data, setData] = useState(null), [query, setQuery] = useState(""), [category, setCategory] = useState("all"), [archived, setArchived] = useState("false"), [page, setPage] = useState(1), [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [dialog, setDialog] = useState(null), [preview, setPreview] = useState(null), [confirm, setConfirm] = useState(null);
  const searchRef = useRef(null);
  const [composing, setComposing] = useState(false);
  const [committedQuery, setCommittedQuery] = useState("");
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => { setCommittedQuery(query); setPage(1); }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, composing]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const params = new URLSearchParams({ page, q: committedQuery, archived: selectionOnly ? "false" : archived });
    if (category !== "all") params.set("category", category);
    if (selectionOnly) params.set("reviewed", "true");
    jobApi(`answers/?${params}`, { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) { setData(result); setLoading(false); } }).catch((issue) => { if (!controller.signal.aborted) { setError(issue.message); setLoading(false); } });
    return () => controller.abort();
  }, [committedQuery, category, archived, page, version, selectionOnly]);
  async function change(record, action) {
    setBusy(true); setError("");
    try {
      await jobApi(`answers/${record.id}/${action === "review" ? "review/" : ""}`, { method: action === "review" ? "POST" : "PATCH", body: action === "review" ? { expected_revision: record.revision } : { expected_revision: record.revision, is_archived: !record.is_archived } });
      setConfirm(null); setPreview(null); setVersion((value) => value + 1); setPage(1);
      notify(action === "review" ? "Answer marked reviewed." : record.is_archived ? "Answer restored. Review it before reusing." : "Answer archived.");
    } catch (issue) { setError(issue.message); setConfirm(null); }
    finally { setBusy(false); }
  }
  return <Panel title={selectionOnly ? "Reviewed answer library" : "Reusable answers"} description="Your wording, reviewed by you. Library content is never sent to AI automatically." action={!selectionOnly && <Button onClick={() => setDialog({})}><Plus size={16}/>Add answer</Button>}>
    <div className="mb-4 flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-500"/><Input ref={searchRef} aria-label="Search reusable answers" placeholder="Search questions or answers…" maxLength={160} className="pl-9 pr-9" value={query} onCompositionStart={() => setComposing(true)} onCompositionEnd={(event) => { setComposing(false); setQuery(event.currentTarget.value); }} onChange={(event) => setQuery(event.target.value)}/>{query && <button type="button" aria-label="Clear answer search" className="absolute right-2 top-2 rounded p-1 text-slate-600 hover:bg-slate-100 focus-visible:outline-blue-600" onClick={() => { setQuery(""); setCommittedQuery(""); setPage(1); searchRef.current?.focus(); }}><X size={15}/></button>}</div><Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}><SelectTrigger aria-label="Answer category"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="all">All categories</SelectItem>{answerCategories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>{!selectionOnly && <Select value={archived} onValueChange={(value) => { setArchived(value); setPage(1); }}><SelectTrigger aria-label="Answer archive state"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="false">Active answers</SelectItem><SelectItem value="true">Archived answers</SelectItem></SelectContent></Select>}</div>
    {error && <ErrorState message={error} retry={() => setVersion(version + 1)}/>}
    {loading ? <p role="status" className="py-8 text-sm text-slate-600">Loading answers…</p> : !error && <>{data?.results?.length ? <ul className="divide-y">{data.results.map((item) => <li key={item.id} className="flex flex-wrap items-start gap-3 py-4 first:pt-0"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><MessageSquare size={17}/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{item.title}</h3><p className="mt-1 break-words text-sm text-slate-600">{item.question}</p><p className="mt-1 text-xs capitalize text-slate-600">{item.category} · {item.reviewed ? "Reviewed" : "Needs review"}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => selectionOnly ? onSelect(item) : setPreview(item)}><Eye size={15}/>{selectionOnly ? "Preview & select" : "Preview"}</Button>{!selectionOnly && <><Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog(item)}><Pencil size={15}/>Edit</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm(item)}><Archive size={15}/>{item.is_archived ? "Restore" : "Archive"}</Button></>}</div></li>)}</ul> : <EmptyState icon={MessageSquare} title={selectionOnly ? "No reviewed answers found" : "No answers in this view"} message={selectionOnly ? "Add an answer in Reusable answers, then read and mark it reviewed." : "Try another filter or save your own response to a common question."}/>}<WorkflowPages data={data} page={page} onPage={setPage} busy={loading}/></>}
    {dialog && <ReusableAnswerForm record={dialog.id ? dialog : null} onCancel={() => { setDialog(null); setVersion(version + 1); }} onSaved={() => { setDialog(null); setVersion(version + 1); setPage(1); }} notify={notify}/>}
    <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}><DialogContent className="personal-dashboard max-h-[85dvh] overflow-y-auto bg-white sm:max-w-2xl"><DialogHeader><DialogTitle>{preview?.title}</DialogTitle><DialogDescription>{preview?.question}</DialogDescription></DialogHeader><p className="whitespace-pre-wrap break-words text-sm leading-7">{preview?.body}</p>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}<div className="flex justify-end gap-2">{preview && !preview.is_archived && !preview.reviewed && <Button disabled={busy} onClick={() => change(preview, "review")}><CheckCircle2 size={16}/>Mark reviewed</Button>}<Button variant="outline" disabled={busy} onClick={() => setPreview(null)}>Close</Button></div></DialogContent></Dialog>
    <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open && !busy) setConfirm(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>{confirm?.is_archived ? "Restore" : "Archive"} this answer?</AlertDialogTitle><AlertDialogDescription>{confirm?.is_archived ? "Restore it to the active library, then review it before insertion." : "Its text is kept. Existing application drafts stay unchanged."}</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); change(confirm, "archive"); }}>{confirm?.is_archived ? "Restore answer" : "Archive answer"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Panel>;
}
