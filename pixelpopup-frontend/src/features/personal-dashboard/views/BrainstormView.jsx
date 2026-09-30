import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardList,
  FileJson2, Lightbulb, Pencil, Plus, Search, Trash2, X,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { EmptyState, ErrorState } from "../components/Panel";

const statuses = ["inbox", "planned", "in_progress", "carried_over", "done", "archived"];
const urgencies = ["high", "medium", "low", "someday"];
const label = (value) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const initialIdea = { title: "", description: "", source_text: "", urgency: "medium", status: "inbox", tags: "", reference_url: "", notes: "", group: "" };
const errorText = (error) => {
  if (!error?.fields || typeof error.fields !== "object") return error?.message || "Something went wrong. Please try again.";
  return Object.entries(error.fields).map(([field, detail]) => `${field}: ${typeof detail === "object" ? JSON.stringify(detail) : String(detail)}`).join(" · ");
};

function Choice({ id, value, onChange, items, placeholder = "All", className = "", labelText, disabled = false }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger id={id} aria-label={labelText} className={`h-9 bg-white ${className}`}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent className="personal-dashboard" position="popper">
      {items.map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function IdeaCard({ idea, groups, busy, onEdit, onPatch, onCarry, onDelete }) {
  return <article className="group flex h-full flex-col border border-slate-200 bg-white p-4 shadow-[0_3px_12px_-9px_rgba(15,23,42,.4)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_8px_22px_-13px_rgba(15,23,42,.4)] focus-within:border-blue-400 motion-reduce:transform-none motion-reduce:transition-none">
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Lightbulb size={17} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} disabled={busy} className="text-left font-semibold leading-snug text-slate-950 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default">{idea.title}</button>
        {idea.description && <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{idea.description}</p>}
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className={`border px-2 py-0.5 font-medium ${idea.urgency === "high" ? "border-red-200 bg-red-50 text-red-800" : idea.urgency === "medium" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{label(idea.urgency)}</span>
      <span className="border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-800">{label(idea.status)}</span>
      {idea.tags.slice(0, 3).map((tag) => <span key={tag} className="text-slate-600">#{tag}</span>)}
      {idea.tags.length > 3 && <span className="text-slate-500">+{idea.tags.length - 3}</span>}
    </div>
    {idea.task_id && <Link to="/dashboard/deadlines" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-700 underline-offset-4 hover:underline">Task {label(idea.task_status || "pending")} <ArrowRight size={13} /></Link>}
    {!idea.task_id && idea.task_status === "missing" && <p className="mt-3 text-xs text-amber-800">Linked task was deleted. You can carry this idea again.</p>}
    <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 sm:grid-cols-3">
      <div className="min-w-0"><Choice id={`idea-${idea.id}-urgency-choice`} labelText={`Urgency for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={idea.urgency} onChange={(value) => onPatch({ urgency: value })} items={urgencies.map((value) => [value, label(value)])} /></div>
      <div className="min-w-0"><Choice id={`idea-${idea.id}-status-choice`} labelText={`Status for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={idea.status} onChange={(value) => onPatch({ status: value })} items={statuses.filter((value) => value !== "carried_over" || !!idea.task_id || idea.status === "carried_over").map((value) => [value, label(value)])} /></div>
      <div className="col-span-2 min-w-0 sm:col-span-1"><Choice id={`idea-${idea.id}-group-choice`} labelText={`Group for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={String(idea.group)} onChange={(value) => onPatch({ group: Number(value) })} items={groups.map((item) => [String(item.id), item.name])} /></div>
    </div>
    <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3 text-xs sm:opacity-75 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <button type="button" onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><Pencil size={13} /> Edit</button>
      <button type="button" onClick={onCarry} disabled={busy || !!idea.task_id} className="inline-flex items-center gap-1 px-2 py-1.5 font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><ClipboardList size={13} /> Carry to task</button>
      {idea.status !== "archived" && <button type="button" onClick={() => onPatch({ status: "archived" })} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><Archive size={13} /> Archive</button>}
      <button type="button" onClick={onDelete} disabled={busy} className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600"><Trash2 size={13} /> Delete</button>
    </div>
  </article>;
}

export default function BrainstormView({ dashboard, notify }) {
  const boardsState = useRecords("brainstorm/boards/", dashboard.request, dashboard.version);
  const boards = boardsState.data || [];
  const [boardId, setBoardId] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [urgency, setUrgency] = useState("all");
  const [status, setStatus] = useState("all");
  const [group, setGroup] = useState("all");
  const [sort, setSort] = useState("newest");
  const [unconverted, setUnconverted] = useState(false);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState({});
  const [rawJson, setRawJson] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const launchRef = useRef(null);
  useEffect(() => {
    if (boards.length && !boards.some((board) => String(board.id) === boardId)) setBoardId(String(boards.find((board) => board.is_active)?.id || boards[0].id));
  }, [boards, boardId]);
  useEffect(() => { if (composing) return; const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search, composing]);
  const selected = boards.find((board) => String(board.id) === boardId);
  const params = new URLSearchParams({ board: boardId || "0", page: String(page), sort });
  if (query) params.set("q", query);
  if (urgency !== "all") params.set("urgency", urgency);
  if (status !== "all") params.set("status", status);
  if (group !== "all") params.set("group", group);
  if (unconverted) params.set("unconverted", "1");
  const ideasState = useRecords(boardId ? `brainstorm/ideas/?${params}` : "brainstorm/boards/", dashboard.request, dashboard.version);
  const data = boardId ? ideasState.data : null;
  const groups = data?.groups || [];
  const ideas = data?.results || [];
  const grouped = useMemo(() => groups.map((item) => ({ ...item, ideas: ideas.filter((idea) => idea.group === item.id) })), [groups, ideas]);
  const activeFilters = Boolean(query || urgency !== "all" || status !== "all" || group !== "all" || unconverted);
  useEffect(() => { if (data && page > 1 && data.count <= (page - 1) * 50) setPage(page - 1); }, [data, page]);

  function open(kind, record = null) {
    launchRef.current = document.activeElement;
    setDialog({ kind, record }); setError(""); setPreview(null);
    if (kind === "idea") setDraft(record ? { ...record, tags: record.tags.join(", "), group: String(record.group) } : { ...initialIdea, group: String(groups[0]?.id || "") });
    else if (kind === "carry") setDraft({ title: record.title, description: record.description || "", priority: record.urgency === "someday" ? "low" : record.urgency, due_date: "", category: "none" });
    else setDraft(record ? { ...record } : { name: "", description: "" });
  }
  function close() { if (!saving) { setDialog(null); setError(""); setPreview(null); } }
  async function mutate(path, body, method, success) {
    setSaving(true); setError("");
    try { const result = await dashboard.mutate(path, body, method); notify(success, { action: method === "PATCH" ? "edited" : "added", entity: "brainstorm" }); closeAfterSave(); return result; }
    catch (issue) { setError(errorText(issue)); return null; }
    finally { setSaving(false); }
  }
  function closeAfterSave() { setDialog(null); setPreview(null); setError(""); }
  async function save(event) {
    event.preventDefault();
    if (!dialog || saving) return;
    const { kind, record } = dialog;
    if (kind === "board") {
      if (!draft.name?.trim()) return setError("Enter a board name.");
      const result = await mutate(`brainstorm/boards/${record ? `${record.id}/` : ""}`, { name: draft.name.trim(), description: draft.description || "" }, record ? "PATCH" : "POST", record ? "Board updated." : "Board added.");
      if (result && !record) setBoardId(String(result.id));
    } else if (kind === "group") {
      if (!draft.name?.trim()) return setError("Enter a group name.");
      await mutate(`brainstorm/groups/${record ? `${record.id}/` : ""}`, { ...(!record ? { board: Number(boardId) } : {}), name: draft.name.trim(), description: draft.description || "" }, record ? "PATCH" : "POST", record ? "Group updated." : "Group added.");
    } else if (kind === "idea") {
      if (!draft.title?.trim()) return setError("Enter an idea title.");
      if (!draft.group) return setError("Choose a group for this idea.");
      const body = { board: Number(boardId), group: Number(draft.group), title: draft.title.trim(), description: draft.description || "", source_text: draft.source_text || "", urgency: draft.urgency, status: draft.status, tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean), reference_url: draft.reference_url || "", notes: draft.notes || "" };
      await mutate(`brainstorm/ideas/${record ? `${record.id}/` : ""}`, body, record ? "PATCH" : "POST", record ? "Idea updated." : "Idea added.");
    } else if (kind === "carry") {
      const body = { ...draft, category: draft.category && draft.category !== "none" ? Number(draft.category) : null, due_date: draft.due_date || null };
      await mutate(`brainstorm/ideas/${record.id}/carry/`, body, "POST", "Idea carried to Tasks & deadlines.");
    } else if (kind === "delete") {
      setSaving(true); setError("");
      try { await dashboard.mutate(`brainstorm/ideas/${record.id}/`, null, "DELETE"); notify("Idea deleted.", { action: "deleted", entity: "brainstorm" }); closeAfterSave(); }
      catch (issue) { setError(errorText(issue)); }
      finally { setSaving(false); }
    } else if (kind === "deactivate") {
      await mutate(`brainstorm/boards/${record.id}/`, { is_active: !record.is_active }, "PATCH", record.is_active ? "Board deactivated." : "Board reactivated.");
    }
  }
  async function patchIdea(idea, body) {
    setBusyId(idea.id);
    try { await dashboard.mutate(`brainstorm/ideas/${idea.id}/`, body, "PATCH"); notify("Idea updated.", { action: "edited", entity: "brainstorm" }); }
    catch (issue) { setError(errorText(issue)); }
    finally { setBusyId(null); }
  }
  async function importIdeas(confirm = false) {
    let payload;
    try { payload = JSON.parse(rawJson); }
    catch { setError("This is not valid JSON. Check commas, quotes, and brackets, then preview again."); return; }
    setSaving(true); setError("");
    try {
      const summary = await dashboard.request(`brainstorm/import/${confirm ? "" : "preview/"}`, { method: "POST", body: payload });
      if (confirm) { dashboard.refresh(); notify(`${summary.created} ideas imported.`, { action: "added", entity: "brainstorm" }); closeAfterSave(); }
      else setPreview(summary);
    } catch (issue) { setError(errorText(issue)); }
    finally { setSaving(false); }
  }
  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));
  const input = (name, title, props = {}) => <div className="space-y-1.5"><Label htmlFor={`brainstorm-${name}`}>{title}</Label><Input id={`brainstorm-${name}`} value={draft[name] ?? ""} onChange={(event) => set(name, event.target.value)} disabled={saving} {...props} /></div>;
  const area = (name, title, props = {}) => <div className="space-y-1.5"><Label htmlFor={`brainstorm-${name}`}>{title}</Label><Textarea id={`brainstorm-${name}`} value={draft[name] ?? ""} onChange={(event) => set(name, event.target.value)} disabled={saving} {...props} /></div>;
  const select = (name, title, items) => <div className="space-y-1.5"><Label htmlFor={`brainstorm-${name}`}>{title}</Label><Choice id={`brainstorm-${name}`} value={String(draft[name] || "")} onChange={(value) => set(name, value)} items={items} /></div>;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-border)] pb-3">
      <p className="text-sm text-slate-600">Keep ideas loose here. Carry one to a task when it is ready.</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => open("import")}><FileJson2 size={16} /> Import JSON</Button><Button onClick={() => open("board")}><Plus size={16} /> Add board</Button></div>
    </div>
    {boardsState.error && <ErrorState message={boardsState.error} retry={dashboard.refresh} />}
    {boardsState.loading && <p className="py-12 text-center text-sm text-slate-600">Loading your boards…</p>}
    {!boardsState.loading && !boardsState.error && !boards.length && <div className="border border-[var(--pd-border)] bg-white"><EmptyState icon={Lightbulb} title="Your idea wall starts here" message="Add a board or import your saved brainstorm to begin." action={<Button onClick={() => open("board")}><Plus size={16} /> Add board</Button>} /></div>}
    {!!boards.length && <>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Brainstorm boards">
        {boards.map((board) => <button key={board.id} type="button" aria-current={boardId === String(board.id) ? "page" : undefined} onClick={() => { setBoardId(String(board.id)); setGroup("all"); setPage(1); }} className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${boardId === String(board.id) ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}>{board.name}<span className="ml-1 text-xs text-slate-500">{board.idea_count ?? 0}</span>{!board.is_active && <span className="ml-2 text-xs text-slate-500">Inactive</span>}</button>)}
      </nav>
      {selected && <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">{selected.description || "A space for ideas worth exploring."}</p>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => open("board", selected)}><Pencil size={15} /> Edit board</Button><Button size="sm" variant="outline" onClick={() => open("deactivate", selected)}>{selected.is_active ? "Deactivate" : "Reactivate"}</Button>{selected.is_active && <Button size="sm" variant="outline" onClick={() => open("group")}><Plus size={15} /> Add group</Button>}</div>
      </div>}
      {selected?.is_active && <div className="flex flex-wrap items-end gap-2 border border-[var(--pd-border)] bg-white p-3">
        <div className="relative min-w-48 flex-1"><Label htmlFor="brainstorm-search" className="sr-only">Search ideas</Label><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" /><Input id="brainstorm-search" className="pl-9 pr-9" placeholder="Search ideas" value={search} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" className="absolute right-2 top-2 p-0.5 text-slate-600 hover:text-slate-950" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
        <Choice id="brainstorm-urgency" labelText="Filter by urgency" className="w-32" value={urgency} onChange={(value) => { setUrgency(value); setPage(1); }} items={[["all", "All urgency"], ...urgencies.map((value) => [value, label(value)])]} />
        <Choice id="brainstorm-status" labelText="Filter by status" className="w-36" value={status} onChange={(value) => { setStatus(value); setPage(1); }} items={[["all", "All status"], ...statuses.map((value) => [value, label(value)])]} />
        <Choice id="brainstorm-group" labelText="Filter by group" className="w-36" value={group} onChange={(value) => { setGroup(value); setPage(1); }} items={[["all", "All groups"], ...groups.map((item) => [String(item.id), item.name])]} />
        <Choice id="brainstorm-sort" labelText="Sort ideas" className="w-32" value={sort} onChange={(value) => { setSort(value); setPage(1); }} items={[["newest", "Newest"], ["urgency", "Urgency"]]} />
        <label className="flex h-9 items-center gap-2 px-2 text-xs text-slate-700"><input type="checkbox" checked={unconverted} onChange={(event) => { setUnconverted(event.target.checked); setPage(1); }} className="accent-blue-600" /> Not yet tasked</label>
        <Button onClick={() => open("idea")}><Plus size={16} /> Add idea</Button>
      </div>}
      {!selected?.is_active && <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This board is inactive. Reactivate it to add or change ideas.</div>}
      {!dialog && error && <ErrorState message={error} retry={() => { setError(""); dashboard.refresh(); }} />}
      {selected && ideasState.error && <ErrorState message={ideasState.error} retry={dashboard.refresh} />}
      {selected && ideasState.loading && <p className="py-12 text-center text-sm text-slate-600">Loading ideas…</p>}
      {selected && !ideasState.loading && !ideasState.error && <div className="min-h-64 border border-[var(--pd-border)] bg-[radial-gradient(circle_at_1px_1px,rgba(47,91,255,.08)_1px,transparent_0)] bg-[length:24px_24px] p-4 sm:p-6">
        {!ideas.length && (activeFilters || !groups.length) && <div className="bg-white/95"><EmptyState icon={Lightbulb} title={activeFilters ? "No ideas match these filters" : "No ideas on this board yet"} message={activeFilters ? "Change the filters or search to see more ideas." : "Add a thought now, or import a brainstorm you already have."} action={!activeFilters && selected.is_active ? <Button onClick={() => open("idea")}><Plus size={16} /> Add idea</Button> : undefined} /></div>}
        {grouped.filter((item) => !activeFilters || item.ideas.length).map((item) => <section key={item.id} className="mb-8 last:mb-0" aria-labelledby={`group-${item.id}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2"><h3 id={`group-${item.id}`} className="text-base font-semibold text-slate-950">{item.name}</h3><span className="text-xs text-slate-500">{item.ideas.length} on this page</span>{selected.is_active && <button type="button" onClick={() => open("group", item)} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"><Pencil size={12} /> Rename</button>}</div>
          {item.description && <p className="mb-3 text-sm text-slate-600">{item.description}</p>}
          {item.ideas.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{item.ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} groups={groups} busy={busyId === idea.id || !selected.is_active} onEdit={() => open("idea", idea)} onPatch={(body) => patchIdea(idea, body)} onCarry={() => open("carry", idea)} onDelete={() => open("delete", idea)} />)}</div> : <p className="border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-600">No ideas in this group yet.</p>}
        </section>)}
      </div>}
      {!!data?.count && <div className="flex items-center justify-between gap-3 text-sm text-slate-600"><span>{data.count} ideas · Page {page}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15} /> Previous</Button><Button size="sm" variant="outline" disabled={!data.next} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={15} /></Button></div></div>}
    </>}
    <Dialog open={!!dialog} onOpenChange={(value) => { if (!value) close(); }}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl" onEscapeKeyDown={(event) => { if (saving) event.preventDefault(); }} onInteractOutside={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); const target = launchRef.current?.isConnected ? launchRef.current : document.getElementById("brainstorm-search"); target?.focus(); }}>
        <DialogHeader><DialogTitle>{dialog?.kind === "idea" ? `${dialog.record ? "Edit" : "Add"} idea` : dialog?.kind === "board" ? `${dialog.record ? "Edit" : "Add"} board` : dialog?.kind === "group" ? `${dialog.record ? "Edit" : "Add"} group` : dialog?.kind === "carry" ? "Carry idea to task" : dialog?.kind === "import" ? "Import brainstorm" : dialog?.kind === "delete" ? "Delete idea?" : "Change board availability?"}</DialogTitle><DialogDescription>{dialog?.kind === "import" ? "Paste a board or boards JSON document. Preview it before importing." : dialog?.kind === "carry" ? "This creates one linked task. A due date is optional." : dialog?.kind === "delete" ? "This permanently deletes only the idea. A linked task will remain." : "Your changes stay private to this workspace."}</DialogDescription></DialogHeader>
        {error && <div role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {dialog?.kind === "import" ? <div className="space-y-4"><Label htmlFor="brainstorm-json">Brainstorm JSON</Label><Textarea id="brainstorm-json" className="min-h-64 font-mono text-xs" value={rawJson} onChange={(event) => { setRawJson(event.target.value); setPreview(null); }} placeholder={'{ "boards": [ ... ] }'} disabled={saving} /><p className="text-xs text-slate-600">Existing ideas are never overwritten. Matching titles on the same board are skipped.</p>{preview && <div className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><p className="font-medium">Preview: {preview.boards} board(s), {preview.groups} group(s)</p><p className="mt-1">{preview.created} new ideas · {preview.duplicates_skipped} duplicates skipped · {preview.invalid} invalid</p>{!!preview.errors?.length && <ul className="mt-2 max-h-32 list-disc overflow-y-auto pl-5 text-xs">{preview.errors.map((item, index) => <li key={index}>{item.location}: {item.reason}</li>)}</ul>}</div>}<DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button variant="outline" disabled={saving || !rawJson.trim()} onClick={() => importIdeas(false)}><Search size={15} /> Preview</Button><Button disabled={saving || !preview} onClick={() => importIdeas(true)}><Check size={15} /> {saving ? "Importing…" : "Import ideas"}</Button></DialogFooter></div> : <form onSubmit={save} className="space-y-4">
          {dialog?.kind === "board" || dialog?.kind === "group" ? <>{input("name", "Name", { required: true, maxLength: 120 })}{area("description", "Description", { maxLength: 4000 })}</> : null}
          {dialog?.kind === "idea" && <>{input("title", "Idea title", { required: true, maxLength: 160 })}{area("description", "Short description", { maxLength: 4000 })}<div className="grid gap-3 sm:grid-cols-2">{select("group", "Group", groups.map((item) => [String(item.id), item.name]))}{select("urgency", "Urgency", urgencies.map((item) => [item, label(item)]))}{select("status", "Status", statuses.filter((item) => item !== "carried_over" || !!dialog.record?.task_id || dialog.record?.status === "carried_over").map((item) => [item, label(item)]))}{input("tags", "Tags, separated by commas", { maxLength: 660 })}</div>{input("reference_url", "Reference link", { type: "url", maxLength: 2048, placeholder: "https://…" })}{area("source_text", "Original thought", { maxLength: 4000 })}{area("notes", "Private notes", { maxLength: 4000 })}</>}
          {dialog?.kind === "carry" && <>{input("title", "Task title", { required: true, maxLength: 160 })}{area("description", "Task description", { maxLength: 4000 })}<div className="grid gap-3 sm:grid-cols-2">{select("priority", "Priority", [["high", "High"], ["medium", "Medium"], ["low", "Low"]])}{input("due_date", "Due date (optional)", { type: "date" })}</div>{select("category", "Category", [["none", "None"], ...(dashboard.data?.categories || []).map((item) => [String(item.id), item.name]))}</>}
          {dialog?.kind === "delete" && <p className="text-sm text-slate-700">“{dialog.record.title}” will be removed from this board.</p>}
          {dialog?.kind === "deactivate" && <p className="text-sm text-slate-700">{dialog.record.is_active ? "Ideas remain saved, but this board becomes read-only until reactivated." : "You can add and change ideas on this board again."}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={saving} variant={dialog?.kind === "delete" ? "destructive" : "default"}>{dialog?.kind === "delete" ? <Trash2 size={15} /> : <Check size={15} />}{saving ? "Saving…" : dialog?.kind === "delete" ? "Delete idea" : dialog?.kind === "deactivate" ? dialog.record.is_active ? "Deactivate board" : "Reactivate board" : dialog?.kind === "carry" ? "Create task" : dialog?.record ? "Save changes" : "Add"}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
