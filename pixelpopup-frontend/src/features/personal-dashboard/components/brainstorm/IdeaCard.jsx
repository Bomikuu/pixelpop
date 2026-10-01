import { useRef } from "react";
import { Link } from "react-router-dom";
import { Archive, ArrowDown, ArrowRight, ArrowUp, ClipboardList, GripVertical, Lightbulb, Pencil, Trash2 } from "lucide-react";
import BrainstormFilterSelect from "./BrainstormFilterSelect";
import { CardPattern } from "./BrainstormPatterns";
import "./brainstorm.css";

const statuses = ["inbox", "planned", "in_progress", "carried_over", "done", "archived"];
const urgencies = ["high", "medium", "low", "someday"];
const label = (value) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export default function IdeaCard({
  idea, groups, busy, onEdit, onPatch, onCarry, onDelete,
  canArrange, dragging, dropPosition, onDragStart, onDragEnd, onDragOver, onDrop,
  canMoveEarlier, canMoveLater, onMoveEarlier, onMoveLater,
}) {
  const card = useRef(null);
  const dragHelpId = `idea-${idea.id}-drag-help`;

  function startDrag(event) {
    if (!canArrange || busy) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(idea.id));
    if (card.current) event.dataTransfer.setDragImage(card.current, 24, 24);
    onDragStart(idea);
  }

  function dragOver(event) {
    if (!canArrange || !dragging) return;
    if (dragging === idea.id) { event.stopPropagation(); return; }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const bounds = card.current?.getBoundingClientRect();
    const position = bounds && event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    onDragOver(idea, position);
  }

  function drop(event) {
    if (!canArrange || !dragging) return;
    if (dragging === idea.id) { event.preventDefault(); event.stopPropagation(); return; }
    event.preventDefault();
    event.stopPropagation();
    const bounds = card.current?.getBoundingClientRect();
    const position = bounds && event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    onDrop(idea, position);
  }

  return <article ref={card}
    data-dragging={dragging === idea.id ? "true" : undefined}
    onDragOver={dragOver} onDrop={drop}
    className={`brainstorm-idea-card group relative isolate flex h-full min-w-0 flex-col overflow-hidden border bg-white p-4
      shadow-[0_3px_12px_-9px_rgba(15,23,42,.4)] transition-[border-color,box-shadow] duration-150
      hover:border-blue-300 hover:shadow-[0_8px_22px_-13px_rgba(15,23,42,.4)] focus-within:border-blue-400
      ${dragging === idea.id ? "opacity-45" : ""}
      ${dropPosition ? "border-blue-500 ring-1 ring-blue-200" : "border-slate-200"}`}
  >
    <CardPattern />
    {dropPosition && <span className={`absolute z-20 border border-blue-500 bg-white px-2 py-0.5 text-xs font-medium text-blue-800 shadow-sm
      ${dropPosition === "before" ? "left-2 top-1" : "bottom-1 left-2"}`}>
      Drop {dropPosition}
    </span>}
    <div className="relative z-10 flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Lightbulb size={17} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} disabled={busy}
          className="text-left font-semibold leading-snug text-slate-950 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default">
          {idea.title}
        </button>
        {idea.description && <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{idea.description}</p>}
      </div>
      {canArrange && <button type="button" draggable={!busy} onDragStart={startDrag} onDragEnd={onDragEnd}
        disabled={busy} aria-label={`Drag ${idea.title}`} aria-describedby={dragHelpId}
        title="Drag to another position or group"
        className="grid size-8 shrink-0 cursor-grab place-items-center border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed">
        <GripVertical size={16} aria-hidden="true" />
      </button>}
    </div>
    <span id={dragHelpId} className="sr-only">Drag to arrange. Use Move earlier, Move later, or the Group selector instead.</span>
    <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className={`border px-2 py-0.5 font-medium ${idea.urgency === "high" ? "border-red-200 bg-red-50 text-red-800" : idea.urgency === "medium" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{label(idea.urgency)}</span>
      <span className="border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-800">{label(idea.status)}</span>
      {idea.tags.slice(0, 3).map((tag) => <span key={tag} className="text-slate-600">#{tag}</span>)}
      {idea.tags.length > 3 && <span className="text-slate-500">+{idea.tags.length - 3}</span>}
    </div>
    {idea.task_id && <Link to="/dashboard/deadlines" className="relative z-10 mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-700 underline-offset-4 hover:underline">Task {label(idea.task_status || "pending")} <ArrowRight size={13} /></Link>}
    {!idea.task_id && idea.task_status === "missing" && <p className="relative z-10 mt-3 text-xs text-amber-800">Linked task was deleted. You can carry this idea again.</p>}
    <div className="relative z-10 mt-3 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 sm:grid-cols-3">
      <div className="min-w-0"><BrainstormFilterSelect id={`idea-${idea.id}-urgency-choice`} labelText={`Urgency for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={idea.urgency} onChange={(value) => onPatch({ urgency: value })} items={urgencies.map((value) => [value, label(value)])} /></div>
      <div className="min-w-0"><BrainstormFilterSelect id={`idea-${idea.id}-status-choice`} labelText={`Status for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={idea.status} onChange={(value) => onPatch({ status: value })} items={statuses.filter((value) => value !== "carried_over" || !!idea.task_id || idea.status === "carried_over").map((value) => [value, label(value)])} /></div>
      <div className="col-span-2 min-w-0 sm:col-span-1"><BrainstormFilterSelect id={`idea-${idea.id}-group-choice`} labelText={`Group for ${idea.title}`} disabled={busy} className="w-full min-w-0 text-xs" value={String(idea.group)} onChange={(value) => onPatch({ group: Number(value) })} items={groups.map((item) => [String(item.id), item.name])} /></div>
    </div>
    <div className="relative z-10 mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3 text-xs sm:opacity-75 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      {canArrange && <div className="mr-1 flex items-center gap-0.5 border-r border-slate-200 pr-1">
        <button type="button" onClick={onMoveEarlier} disabled={busy || !canMoveEarlier}
          aria-label={`Move ${idea.title} earlier`} title="Move earlier"
          className="grid size-7 place-items-center text-slate-600 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40">
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={onMoveLater} disabled={busy || !canMoveLater}
          aria-label={`Move ${idea.title} later`} title="Move later"
          className="grid size-7 place-items-center text-slate-600 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40">
          <ArrowDown size={14} aria-hidden="true" />
        </button>
      </div>}
      <button type="button" onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><Pencil size={13} /> Edit</button>
      <button type="button" onClick={onCarry} disabled={busy || !!idea.task_id} className="inline-flex items-center gap-1 px-2 py-1.5 font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><ClipboardList size={13} /> Carry to task</button>
      {idea.status !== "archived" && <button type="button" onClick={() => onPatch({ status: "archived" })} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><Archive size={13} /> Archive</button>}
      <button type="button" onClick={onDelete} disabled={busy} className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600"><Trash2 size={13} /> Delete</button>
    </div>
  </article>;
}
