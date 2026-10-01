import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, FolderPen, Info } from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { today } from "../lib/format";
import { Button } from "../ui/button";
import { EmptyState, ErrorState } from "../components/Panel";
import FormModalShell from "../components/forms/FormModalShell";
import EodActionMenu from "../components/eod/EodActionMenu";
import EodCard from "../components/eod/EodCard";
import EodDetail from "../components/eod/EodDetail";
import EodEntryForm from "../components/eod/EodEntryForm";
import EodGroupForm from "../components/eod/EodGroupForm";
import EodImportForm from "../components/eod/EodImportForm";

const emptyEntry = { group: "", date: "", type: "workday", title: "", summary: "", items: "", in_progress: "", slack_message: "", bullet_list: "" };
const lines = (value) => value.split("\n").map((item) => item.trim().replace(/^[•*-]\s*/, "")).filter(Boolean);
const errorText = (error) => {
  if (!error?.fields || typeof error.fields !== "object") return error?.message || "Could not save. Please try again.";
  return Object.entries(error.fields).filter(([key]) => key !== "preview").map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : value}`).join(" · ") || error.message;
};
const formErrors = (error) => error?.fields && typeof error.fields === "object" ? error.fields : {};
const shiftDay = (date, amount) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
};

export default function EodView({ dashboard, notify, month, onMonthChange }) {
  const [groupId, setGroupId] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState(emptyEntry);
  const [openedDraft, setOpenedDraft] = useState(emptyEntry);
  const [rawJson, setRawJson] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const detailRef = useRef(null);
  const launchRef = useRef(null);
  const groupsState = useRecords("eod/groups/", dashboard.request, dashboard.version);
  const groups = groupsState.data || [];
  useEffect(() => {
    setSelectedDate((previous) => previous?.startsWith(`${month}-`) ? previous : null);
    setCopied("");
  }, [month]);
  useEffect(() => {
    if (groups.length && !groupId) {
      setGroupId(String(groups.find((group) => group.name.toLowerCase() === "personal")?.id || groups[0].id));
    }
  }, [groups, groupId]);
  const selectedGroup = groups.find((group) => String(group.id) === groupId);
  const entryPath = groupId ? `eod/entries/?month=${month}&group=${groupId}` : "eod/groups/";
  const entriesState = useRecords(entryPath, dashboard.request, dashboard.version);
  const entries = groupId ? entriesState.data?.entries || [] : [];
  const currentDay = entriesState.data?.today || today();
  const currentMonth = currentDay.slice(0, 7);
  const dates = useMemo(() => {
    const [year, number] = month.split("-").map(Number);
    const lastDay = month === currentMonth ? Number(currentDay.slice(8)) : new Date(Date.UTC(year, number, 0)).getUTCDate();
    return Array.from({ length: Math.max(0, lastDay) }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`).reverse();
  }, [month, currentMonth, currentDay]);
  const entriesByDate = useMemo(() => new Map(entries.map((entry) => [entry.date, entry])), [entries]);
  const selected = selectedDate ? entriesByDate.get(selectedDate) || null : null;

  function changeScope(nextGroup) {
    setGroupId(String(nextGroup)); setSelectedDate(null); setCopied(""); setPageError("");
  }
  function open(kind, record = null, date = null) {
    launchRef.current = document.activeElement;
    setError(""); setFieldErrors({}); setPreview(null); setDialog({ kind, record });
    if (kind === "import") setRawJson("");
    const next = kind === "entry" ? record ? {
      ...record, group: String(record.group), items: (record.items?.length ? record.items : record.bullet_list || []).join("\n"), in_progress: (record.in_progress || []).join("\n"),
    } : { ...emptyEntry, group: groupId, date: date || selectedDate || (month === today().slice(0, 7) ? today() : `${month}-01`) } : kind === "group" ? { name: record?.name || "" } : {};
    setDraft(next); setOpenedDraft(next);
  }
  function close() { if (!saving) { setDialog(null); setError(""); setFieldErrors({}); setPreview(null); } }
  function set(name, value) { setDraft((previous) => ({ ...previous, [name]: value })); setError(""); setFieldErrors((previous) => ({ ...previous, [name]: null })); }
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); setCopied(label); notify(`${label} copied.`); }
    catch { notify("Could not copy. Please select the text and copy it manually.", { tone: "error" }); }
  }
  async function submit(event) {
    event.preventDefault();
    if (!dialog || saving) return;
    setSaving(true); setError(""); setFieldErrors({});
    try {
      if (dialog.kind === "entry") {
        const body = {
          group: Number(draft.group), date: draft.date, type: draft.type, title: draft.title.trim(), summary: draft.summary.trim(),
          items: draft.type === "workday" ? lines(draft.items) : [],
          in_progress: draft.type === "workday" ? lines(draft.in_progress) : [],
          slack_message: draft.type === "workday" ? draft.slack_message.trim() : "",
          bullet_list: [],
        };
        const result = await dashboard.mutate(`eod/entries/${dialog.record ? `${dialog.record.id}/` : ""}`, body, dialog.record ? "PATCH" : "POST");
        changeScope(result.group); onMonthChange(result.date.slice(0, 7)); setSelectedDate(result.date);
        notify(dialog.record ? "EOD entry updated." : "EOD entry saved.", { action: dialog.record ? "edited" : "added", entity: "eod" });
        setDialog(null); setPreview(null);
      } else if (dialog.kind === "group") {
        const result = await dashboard.mutate(`eod/groups/${dialog.record ? `${dialog.record.id}/` : ""}`, { name: draft.name.trim() }, dialog.record ? "PATCH" : "POST");
        if (!dialog.record) changeScope(result.id);
        notify(dialog.record ? "Group renamed." : "Group added.", { action: dialog.record ? "edited" : "added", entity: "eod" });
        setDialog(null); setPreview(null);
      } else if (dialog.kind === "import") {
        let payload;
        try { payload = JSON.parse(rawJson); }
        catch { setError("The JSON is not valid. Check quotes, commas, and brackets, then preview again."); return; }
        if (!preview) {
          const result = await dashboard.request(`eod/import/preview/?group=${groupId}`, { method: "POST", body: payload });
          setPreview(result);
        } else if (!preview.counts.error) {
          const result = await dashboard.mutate(`eod/import/?group=${groupId}`, payload, "POST");
          notify(`${result.counts.created} EOD ${result.counts.created === 1 ? "entry" : "entries"} imported.`);
          setDialog(null); setPreview(null);
        }
      }
    } catch (issue) { setError(errorText(issue)); setFieldErrors(formErrors(issue)); }
    finally { setSaving(false); }
  }
  const dirty = dialog?.kind === "import" ? Boolean(rawJson) : dialog ? JSON.stringify(draft) !== JSON.stringify(openedDraft) : false;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-border)] pb-3">
      <nav className="flex min-w-0 flex-wrap items-center gap-2" aria-label="EOD groups">
        {groups.map((group) => <button key={group.id} type="button" aria-current={groupId === String(group.id) ? "page" : undefined} onClick={() => changeScope(group.id)} className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${groupId === String(group.id) ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}>{group.name}</button>)}
      </nav>
      <EodActionMenu onAction={open} />
    </div>
    {selectedGroup && selectedGroup.name.toLowerCase() !== "personal" && <div><Button type="button" size="sm" variant="outline" onClick={() => open("group", selectedGroup)}><FolderPen size={15} aria-hidden="true" />Rename group</Button></div>}
    {pageError && <ErrorState message={pageError} retry={() => setPageError("")} />}
    {groupsState.error && <ErrorState message={groupsState.error} retry={dashboard.refresh} />}
    {groupsState.loading && <p className="py-10 text-center text-sm text-slate-600">Loading EOD groups…</p>}
    {!groupsState.loading && !groupsState.error && !groups.length && <div className="border border-[var(--pd-border)] bg-white"><EmptyState icon={CalendarDays} title="No EOD groups yet" message="Add a group to begin recording your days." action={<Button onClick={() => open("group")}>Add group</Button>} /></div>}
    {groupId && entriesState.error && <ErrorState message={entriesState.error} retry={dashboard.refresh} />}
    {groupId && entriesState.loading && <p className="py-10 text-center text-sm text-slate-600">Loading saved days…</p>}
    {groupId && !entriesState.loading && !entriesState.error && <div className={`grid min-w-0 gap-5 ${selectedDate ? "lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]" : ""}`}>
      <div className="min-w-0">
        <div className="grid auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{dates.map((date, index) => <EodCard key={date} date={date} entry={entriesByDate.get(date)} selected={selectedDate === date} wide={index % 5 === 0 || index % 5 === 4} onSelect={() => { const nextDate = selectedDate === date ? null : date; setSelectedDate(nextDate); setCopied(""); if (nextDate && window.innerWidth < 1024) requestAnimationFrame(() => { detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); detailRef.current?.focus({ preventScroll: true }); }); }} />)}</div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Info size={13} aria-hidden="true" />Unsaved dates stay visible as placeholders. Select a date to add or read its entry.</p>
      </div>
      {selectedDate && <EodDetail date={selectedDate} entry={selected} groupName={selectedGroup?.name} onEdit={() => open("entry", selected)} onAdd={() => open("entry", null, selectedDate)} onCopy={copy} copied={copied} detailRef={detailRef} onPrevious={dates.includes(shiftDay(selectedDate, -1)) ? () => setSelectedDate(shiftDay(selectedDate, -1)) : null} onNext={dates.includes(shiftDay(selectedDate, 1)) ? () => setSelectedDate(shiftDay(selectedDate, 1)) : null} />}
    </div>}
    {dialog && <FormModalShell title={dialog.kind === "entry" ? dialog.record ? "Edit EOD entry" : "Add EOD entry" : dialog.kind === "group" ? dialog.record ? "Rename group" : "Add EOD group" : "Import EOD JSON"} description={dialog.kind === "entry" ? "Keep one recap per group and date." : dialog.kind === "group" ? "Keep work from each group separate." : "Preview first. Existing group/date entries are skipped and never overwritten."} error={error} busy={saving} dirty={dirty} onCancel={close} onCloseAutoFocus={(event) => { if (launchRef.current?.isConnected) { event.preventDefault(); launchRef.current.focus(); } }} onSubmit={submit} saveLabel={dialog.kind === "import" ? preview ? "Import entries" : "Preview JSON" : dialog.kind === "group" ? dialog.record ? "Save group" : "Add group" : "Save EOD"} submitDisabled={dialog.kind === "import" ? !rawJson.trim() || Boolean(preview?.counts.error) : false} busyLabel={dialog.kind === "import" && !preview ? "Previewing…" : "Saving…"}>
      {dialog.kind === "entry" ? <EodEntryForm draft={draft} onChange={set} errors={fieldErrors} disabled={saving} maxDate={today()} groups={groups} /> : dialog.kind === "group" ? <EodGroupForm name={draft.name || ""} onChange={(value) => set("name", value)} error={fieldErrors.name} disabled={saving} /> : <EodImportForm rawJson={rawJson} onChange={(value) => { setRawJson(value); setPreview(null); setError(""); }} preview={preview} disabled={saving} groupName={selectedGroup?.name || "Personal"} />}
    </FormModalShell>}
  </div>;
}
