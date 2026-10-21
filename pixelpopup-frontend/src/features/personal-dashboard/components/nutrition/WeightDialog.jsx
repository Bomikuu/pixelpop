import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { dateLabel } from "../../lib/format";
export default function WeightDialog({ date, reading, onSave, onDelete, onClose, restoreFocus }) {
  const [weight, setWeight] = useState(reading?.weight_kg ?? ""), [note, setNote] = useState(reading?.note ?? "");
  const [error, setError] = useState(""), [invalid, setInvalid] = useState(false), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(null);
  const dirty = weight !== (reading?.weight_kg ?? "") || note !== (reading?.note ?? "");
  useEffect(() => {
    function warn(event) { if (dirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() { if (!busy) dirty ? setConfirm("discard") : onClose(); }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (!weight || !Number.isFinite(Number(weight)) || Number(weight) <= 0) { setInvalid(true); event.currentTarget.elements.namedItem("weight")?.focus(); return; }
    setBusy(true); setError("");
    try { await onSave(date, { weight_kg: weight, note: note.trim() }); onClose(); }
    catch (failure) { setError(failure.fields?.weight_kg ? [failure.fields.weight_kg].flat().join(" ") : failure.message); }
    finally { setBusy(false); }
  }
  async function remove(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { await onDelete(date); setConfirm(null); onClose(); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <><Dialog open onOpenChange={(value) => { if (!value) close(); }}><DialogContent className="personal-dashboard max-h-[calc(100dvh-2rem)] overflow-y-auto" onCloseAutoFocus={restoreFocus} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>{reading ? "Edit" : "Log"} weight</DialogTitle><DialogDescription>Reading for {dateLabel(date)}. You don’t need to measure every day.</DialogDescription></DialogHeader><form noValidate onSubmit={save} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="weight-reading">Weight (kg) <span className="text-red-700">*</span></Label><Input id="weight-reading" name="weight" type="number" step="0.01" min="0.01" aria-required aria-invalid={invalid} aria-describedby={invalid ? "weight-error" : undefined} value={weight} disabled={busy} onChange={(event) => { setWeight(event.target.value); setInvalid(false); }} />{invalid && <p id="weight-error" className="text-xs text-red-700">Enter a weight greater than zero.</p>}</div><div className="space-y-1.5"><Label htmlFor="weight-note">Note · optional</Label><Input id="weight-note" maxLength={500} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} placeholder="Morning, after workout…" /></div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<DialogFooter>{reading && <Button type="button" variant="ghost" className="mr-auto text-red-700" disabled={busy} onClick={() => setConfirm("delete")}><Trash2 className="size-4" />Delete</Button>}<Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Saving…" : "Save reading"}</Button></DialogFooter></form></DialogContent></Dialog>
    <AlertDialog open={!!confirm} onOpenChange={(value) => { if (!value && !busy) setConfirm(null); }}><AlertDialogContent className="personal-dashboard"><AlertDialogHeader><AlertDialogTitle>{confirm === "delete" ? "Delete this weight reading?" : "Discard this reading?"}</AlertDialogTitle><AlertDialogDescription>{confirm === "delete" ? "This removes the measurement from your history. Meals stay unchanged." : "Your unsaved changes will be lost."}</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep editing</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={confirm === "delete" ? remove : onClose} className="bg-red-700 text-white hover:bg-red-800">{busy ? "Deleting…" : confirm === "delete" ? "Delete reading" : "Discard changes"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
