import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Lightbulb, Pencil, Search, X,
} from "lucide-react";
import { useRecords } from "../hooks/useDashboardData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { EmptyState, ErrorState } from "../components/Panel";
import FormModalShell from "../components/forms/FormModalShell";
import BrainstormFilterSelect from "../components/brainstorm/BrainstormFilterSelect";
import BrainstormActionMenu from "../components/brainstorm/BrainstormActionMenu";
import BrainstormBoardShell from "../components/brainstorm/BrainstormBoardShell";
import IdeaCard from "../components/brainstorm/IdeaCard";
import BoardForm, { boardPayload } from "../components/brainstorm/forms/BoardForm";
import GroupForm, { groupPayload } from "../components/brainstorm/forms/GroupForm";
import IdeaForm, { ideaPayload } from "../components/brainstorm/forms/IdeaForm";
import CarryForm, { carryPayload } from "../components/brainstorm/forms/CarryForm";
import ImportForm from "../components/brainstorm/forms/ImportForm";
import BrainstormConfirmDialog from "../components/brainstorm/forms/BrainstormConfirmDialog";

const statuses = ["inbox", "planned", "in_progress", "carried_over", "done", "archived"];
const urgencies = ["high", "medium", "low", "someday"];
const label = (value) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const initialIdea = { title: "", description: "", source_text: "", urgency: "medium", status: "inbox", tags: "", reference_url: "", notes: "", group: "" };
const errorText = (error) => {
  if (!error?.fields || typeof error.fields !== "object") return error?.message || "Something went wrong. Please try again.";
  return Object.entries(error.fields).map(([field, detail]) => `${field}: ${typeof detail === "object" ? JSON.stringify(detail) : String(detail)}`).join(" · ");
};

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
  const [sort, setSort] = useState("manual");
  const [unconverted, setUnconverted] = useState(false);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState({});
  const [openedDraft, setOpenedDraft] = useState({});
  const [rawJson, setRawJson] = useState("");
  const [openedRawJson, setOpenedRawJson] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [movingId, setMovingId] = useState(null);
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
  const activeFilters = Boolean(search || query || urgency !== "all" || status !== "all" || group !== "all" || unconverted);
  const canArrange = Boolean(selected?.is_active && sort === "manual" && !activeFilters && !movingId);
  useEffect(() => { if (data && page > 1 && data.count <= (page - 1) * 50) setPage(page - 1); }, [data, page]);

  function open(kind, record = null) {
    launchRef.current = document.activeElement;
    setDialog({ kind, record }); setError(""); setPreview(null);
    const nextDraft = kind === "idea"
      ? record ? { ...record, tags: record.tags.join(", "), group: String(record.group) } : { ...initialIdea, group: String(groups[0]?.id || "") }
      : kind === "carry"
        ? { title: record.title, description: record.description || "", priority: record.urgency === "someday" ? "low" : record.urgency, due_date: "", category: "none" }
        : record ? { ...record } : { name: "", description: "" };
    setDraft(nextDraft);
    setOpenedDraft(nextDraft);
    setOpenedRawJson(rawJson);
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
    event?.preventDefault();
    if (!dialog || saving) return;
    const { kind, record } = dialog;
    if (kind === "board") {
      if (!draft.name?.trim()) return setError("Enter a board name.");
      const result = await mutate(`brainstorm/boards/${record ? `${record.id}/` : ""}`, boardPayload(draft), record ? "PATCH" : "POST", record ? "Board updated." : "Board added.");
      if (result && !record) setBoardId(String(result.id));
    } else if (kind === "group") {
      if (!draft.name?.trim()) return setError("Enter a group name.");
      await mutate(`brainstorm/groups/${record ? `${record.id}/` : ""}`, groupPayload(draft, boardId, !record), record ? "PATCH" : "POST", record ? "Group updated." : "Group added.");
    } else if (kind === "idea") {
      if (!draft.title?.trim()) return setError("Enter an idea title.");
      if (!draft.group) return setError("Choose a group for this idea.");
      const body = ideaPayload(draft, boardId);
      await mutate(`brainstorm/ideas/${record ? `${record.id}/` : ""}`, body, record ? "PATCH" : "POST", record ? "Idea updated." : "Idea added.");
    } else if (kind === "carry") {
      if (!draft.title?.trim()) return setError("Enter a task title.");
      const body = carryPayload(draft);
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
  async function moveIdea(idea, groupId, anchor = {}) {
    if (!idea || !selected?.is_active || movingId) return;
    if (idea.group === groupId && !Object.keys(anchor).length && grouped.find((item) => item.id === groupId)?.ideas.at(-1)?.id === idea.id) return;
    setMovingId(idea.id);
    setDraggedId(null);
    setDropTarget(null);
    setError("");
    try {
      await dashboard.mutate(`brainstorm/ideas/${idea.id}/move/`, { group: groupId, ...anchor }, "POST");
      notify("Idea moved.", { action: "edited", entity: "brainstorm" });
    } catch (issue) {
      setError(errorText(issue));
      dashboard.refresh();
    } finally {
      setMovingId(null);
    }
  }
  function dropOnIdea(target, position) {
    const source = ideas.find((idea) => idea.id === draggedId);
    setDraggedId(null);
    setDropTarget(null);
    if (!source || source.id === target.id) return;
    moveIdea(source, target.group, position === "before" ? { before_id: target.id } : { after_id: target.id });
  }
  function dropInGroup(groupId) {
    const source = ideas.find((idea) => idea.id === draggedId);
    setDraggedId(null);
    setDropTarget(null);
    if (source) moveIdea(source, groupId);
  }
  function clearArrangeFilters() {
    setSearch(""); setQuery(""); setUrgency("all"); setStatus("all"); setGroup("all");
    setUnconverted(false); setSort("manual"); setPage(1);
  }
  async function importIdeas(confirm = false) {
    if (confirm && !preview) return;
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

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-border)] pb-3">
      {!selected && <BrainstormActionMenu activeBoard={false} onAction={open} />}
    </div>
    {boardsState.error && <ErrorState message={boardsState.error} retry={dashboard.refresh} />}
    {boardsState.loading && <p className="py-12 text-center text-sm text-slate-600">Loading your boards…</p>}
    {!boardsState.loading && !boardsState.error && !boards.length && <div className="border border-[var(--pd-border)] bg-white"><EmptyState icon={Lightbulb} title="Your idea wall starts here" message="Use Add to create a board or import your saved brainstorm." /></div>}
    {!!boards.length && <>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Brainstorm boards">
        {boards.map((board) => <button key={board.id} type="button" aria-current={boardId === String(board.id) ? "page" : undefined} onClick={() => { setBoardId(String(board.id)); setGroup("all"); setPage(1); }} className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${boardId === String(board.id) ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}>{board.name}<span className="ml-1 text-xs text-slate-500">{board.idea_count ?? 0}</span>{!board.is_active && <span className="ml-2 text-xs text-slate-500">Inactive</span>}</button>)}
      </nav>
      {selected && <BrainstormBoardShell boardName={selected.name}
        actions={<BrainstormActionMenu activeBoard={selected.is_active} onAction={open} />}
      ><div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-slate-600">{selected.description || "A space for ideas worth exploring."}</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => open("board", selected)}><Pencil size={15} /> Edit board</Button><Button size="sm" variant="outline" onClick={() => open("deactivate", selected)}>{selected.is_active ? "Deactivate" : "Reactivate"}</Button></div>
        </div>
        {selected.is_active && <div className="mt-4 flex flex-wrap items-end gap-2 border border-[var(--pd-border)] bg-white/95 p-3">
          <div className="relative min-w-48 flex-1"><Label htmlFor="brainstorm-search" className="sr-only">Search ideas</Label><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" /><Input id="brainstorm-search" className="pl-9 pr-9" placeholder="Search ideas" value={search} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" className="absolute right-2 top-2 p-0.5 text-slate-600 hover:text-slate-950" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
          <BrainstormFilterSelect id="brainstorm-urgency" labelText="Filter by urgency" className="w-32" value={urgency} onChange={(value) => { setUrgency(value); setPage(1); }} items={[["all", "All urgency"], ...urgencies.map((value) => [value, label(value)])]} />
          <BrainstormFilterSelect id="brainstorm-status" labelText="Filter by status" className="w-36" value={status} onChange={(value) => { setStatus(value); setPage(1); }} items={[["all", "All status"], ...statuses.map((value) => [value, label(value)])]} />
          <BrainstormFilterSelect id="brainstorm-group" labelText="Filter by group" className="w-36" value={group} onChange={(value) => { setGroup(value); setPage(1); }} items={[["all", "All groups"], ...groups.map((item) => [String(item.id), item.name])]} />
          <BrainstormFilterSelect id="brainstorm-sort" labelText="Sort ideas" className="w-32" value={sort} onChange={(value) => { setSort(value); setPage(1); }} items={[["manual", "Manual"], ["newest", "Newest"], ["urgency", "Urgency"]]} />
          <label className="flex h-9 items-center gap-2 px-2 text-xs text-slate-700"><input type="checkbox" checked={unconverted} onChange={(event) => { setUnconverted(event.target.checked); setPage(1); }} className="accent-blue-600" /> Not yet tasked</label>
        </div>}
        {selected.is_active && !canArrange && (activeFilters || sort !== "manual") && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>To arrange cards, use Manual sort with no filters.</span>
          <button type="button" onClick={clearArrangeFilters} className="font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">Arrange ideas</button>
        </div>}
        {canArrange && !!ideas.length && <p className="mt-2 text-xs text-slate-500">Drag a card's handle to move it within or between groups. Use the arrow buttons to reorder without dragging.</p>}
        {!selected?.is_active && <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This board is inactive. Reactivate it to add or change ideas.</div>}
        {!dialog && error && <ErrorState message={error} retry={() => { setError(""); dashboard.refresh(); }} />}
        {selected && ideasState.error && <ErrorState message={ideasState.error} retry={dashboard.refresh} />}
        {selected && ideasState.loading && <p className="py-12 text-center text-sm text-slate-600">Loading ideas…</p>}
        {!ideasState.loading && !ideasState.error && <div className="mt-5 min-h-32">
          {!ideas.length && (activeFilters || !groups.length) && <div className="bg-white/95"><EmptyState icon={Lightbulb} title={activeFilters ? "No ideas match these filters" : "No ideas on this board yet"} message={activeFilters ? "Change the filters or search to see more ideas." : "Use Add to create an idea, or import a brainstorm you already have."} /></div>}
          {grouped.filter((item) => !activeFilters || item.ideas.length).map((item) => <section key={item.id} className={`mb-8 border border-transparent p-2 transition-colors last:mb-0 ${dropTarget?.groupId === item.id && !dropTarget.ideaId ? "border-blue-400 bg-blue-50/70" : ""}`}
            aria-labelledby={`group-${item.id}`}
            onDragOver={(event) => {
              if (!canArrange || !draggedId) return;
              event.preventDefault(); event.dataTransfer.dropEffect = "move";
              if (dropTarget?.groupId !== item.id || dropTarget.ideaId) setDropTarget({ groupId: item.id, ideaId: null });
            }}
            onDrop={(event) => { if (!canArrange || !draggedId) return; event.preventDefault(); dropInGroup(item.id); }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2"><h3 id={`group-${item.id}`} className="text-base font-semibold text-slate-950">{item.name}</h3><span className="text-xs text-slate-500">{item.ideas.length} on this page</span>{selected.is_active && <button type="button" onClick={() => open("group", item)} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"><Pencil size={12} /> Rename</button>}</div>
            {item.description && <p className="mb-3 text-sm text-slate-600">{item.description}</p>}
            {dropTarget?.groupId === item.id && !dropTarget.ideaId && <p className="mb-3 border border-dashed border-blue-400 bg-white/90 px-3 py-2 text-xs font-medium text-blue-800">Drop here to place the idea at the end of {item.name}.</p>}
            {item.ideas.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{item.ideas.map((idea, index) => <IdeaCard key={idea.id} idea={idea} groups={groups}
              busy={busyId === idea.id || Boolean(movingId) || !selected.is_active}
              canArrange={canArrange} dragging={draggedId}
              dropPosition={dropTarget?.ideaId === idea.id ? dropTarget.position : null}
              onDragStart={(source) => { setDraggedId(source.id); setDropTarget(null); }}
              onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
              onDragOver={(target, position) => setDropTarget({ groupId: target.group, ideaId: target.id, position })}
              onDrop={dropOnIdea}
              canMoveEarlier={index > 0} canMoveLater={index < item.ideas.length - 1}
              onMoveEarlier={() => moveIdea(idea, item.id, { before_id: item.ideas[index - 1].id })}
              onMoveLater={() => moveIdea(idea, item.id, { after_id: item.ideas[index + 1].id })}
              onEdit={() => open("idea", idea)} onPatch={(body) => body.group ? body.group !== idea.group && moveIdea(idea, body.group) : patchIdea(idea, body)} onCarry={() => open("carry", idea)} onDelete={() => open("delete", idea)} />)}</div> : <p className="border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-600">{canArrange ? "No ideas in this group yet. Drag an idea here to add it." : "No ideas in this group yet."}</p>}
          </section>)}
        </div>}
        {!!data?.count && <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600"><span>{data.count} ideas · Page {page}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15} /> Previous</Button><Button size="sm" variant="outline" disabled={!data.next} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={15} /></Button></div></div>}
      </BrainstormBoardShell>}
    </>}
    {dialog && ["delete", "deactivate"].includes(dialog.kind) ?
      <BrainstormConfirmDialog
        kind={dialog.kind} record={dialog.record} busy={saving} error={error}
        onConfirm={save} onCancel={close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = launchRef.current?.isConnected ? launchRef.current : document.getElementById("brainstorm-search");
          target?.focus();
        }}
      /> : dialog && <FormModalShell
        title={dialog.kind === "idea" ? `${dialog.record ? "Edit" : "Add"} idea`
          : dialog.kind === "board" ? `${dialog.record ? "Edit" : "Add"} board`
            : dialog.kind === "group" ? `${dialog.record ? "Edit" : "Add"} group`
              : dialog.kind === "carry" ? "Carry idea to task" : "Import brainstorm"}
        description={dialog.kind === "import"
          ? "Paste a board or boards JSON document. Preview it before importing."
          : dialog.kind === "carry" ? "This creates one linked task. A due date is optional."
            : "Your changes stay private to this workspace."}
        error={error} busy={saving} preventOutsideClose
        dirty={dialog.kind === "import" ? rawJson !== openedRawJson : JSON.stringify(draft) !== JSON.stringify(openedDraft)}
        onSubmit={dialog.kind === "import" ? (event) => { event.preventDefault(); importIdeas(true); } : save}
        onCancel={close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = launchRef.current?.isConnected ? launchRef.current : document.getElementById("brainstorm-search");
          target?.focus();
        }}
        saveLabel={dialog.kind === "import" ? "Import ideas"
          : dialog.kind === "carry" ? "Create task"
            : dialog.record ? "Save changes" : `Add ${dialog.kind}`}
        busyLabel={dialog.kind === "import" ? "Importing…" : "Saving…"}
        submitDisabled={dialog.kind === "import" && !preview}
        extraActions={dialog.kind === "import" &&
          <Button type="button" variant="outline" disabled={saving || !rawJson.trim()}
            onClick={() => importIdeas(false)}><Search size={15} /> Preview</Button>}
      >
        {dialog.kind === "board" && <BoardForm draft={draft} onChange={set} busy={saving} />}
        {dialog.kind === "group" && <GroupForm draft={draft} onChange={set} busy={saving} />}
        {dialog.kind === "idea" && <IdeaForm draft={draft} record={dialog.record}
          groups={groups} onChange={set} busy={saving} />}
        {dialog.kind === "carry" && <CarryForm draft={draft}
          categories={dashboard.data?.categories || []} onChange={set} busy={saving} />}
        {dialog.kind === "import" && <ImportForm rawJson={rawJson}
          onChange={(value) => { setRawJson(value); setPreview(null); }}
          preview={preview} busy={saving} />}
      </FormModalShell>}
  </div>;
}
