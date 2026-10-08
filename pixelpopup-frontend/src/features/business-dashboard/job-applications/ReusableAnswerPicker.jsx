import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../personal-dashboard/ui/dialog";
import ReusableAnswersView from "./ReusableAnswersView";
import { jobApi } from "./api";

export default function ReusableAnswerPicker({ onInsert, onCancel, notify }) {
  const [selected, setSelected] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function insert() {
    setBusy(true); setError("");
    try {
      const current = await jobApi(`answers/${selected.id}/?archived=false&reviewed=true`);
      if (!current.reviewed || current.revision !== selected.revision) throw new Error("This answer changed. Select and review the current wording before inserting.");
      onInsert({ question: current.question, body: current.body });
    } catch (issue) { setError(issue.status === 404 ? "This answer is no longer reviewed or active. Choose another answer." : issue.message); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onCancel(); }}><DialogContent className="personal-dashboard max-h-[90dvh] overflow-y-auto bg-white sm:max-w-3xl" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>Use a reviewed answer</DialogTitle><DialogDescription>Insert into your local screening draft. Existing text is kept; save and review the draft afterward.</DialogDescription></DialogHeader>
    {selected ? <section className="space-y-4"><Button size="sm" variant="outline" disabled={busy} onClick={() => { setSelected(null); setError(""); }}><ArrowLeft size={15}/>Choose another</Button><h3 className="text-sm font-medium">{selected.question}</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{selected.body}</p><p className="text-xs text-slate-600">This wording is editable after insertion. Review availability and rates before sending.</p></section> : <ReusableAnswersView selectionOnly onSelect={setSelected} notify={notify}/>}
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>{selected && <Button disabled={busy} onClick={insert}><Plus size={16}/>{busy ? "Checking…" : "Insert answer"}</Button>}</div>
  </DialogContent></Dialog>;
}
