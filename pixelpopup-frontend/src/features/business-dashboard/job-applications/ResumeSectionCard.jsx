import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowDown, ArrowUp, Copy, FileText, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { sectionContent } from "./documentSections";

export default function ResumeSectionCard({ section, busy, pinned, dragging, dropPosition, canMoveEarlier, canMoveLater, onMoveEarlier, onMoveLater, onEdit, onDuplicate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const card = useRef(null);
  const openingDialog = useRef(false);
  function openAction(action) { openingDialog.current = true; action(); }
  function startDrag(event) {
    if (busy || pinned) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", section.key);
    if (card.current) event.dataTransfer.setDragImage(card.current, 24, 24);
    onDragStart();
  }
  function position(event) {
    const bounds = card.current?.getBoundingClientRect();
    return bounds && event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
  }
  return <li ref={card} onDragOver={(event) => { if (busy || pinned) return; if (onDragOver(position(event))) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={(event) => { if (busy || pinned) return; event.preventDefault(); onDrop(position(event)); }}
    className={`min-w-0 space-y-2 p-3 transition-colors motion-reduce:transition-none hover:bg-slate-50 ${dragging ? "opacity-50" : ""} ${dropPosition ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : ""}`}>
    {dropPosition && <p className="text-xs font-medium text-blue-700">Drop {dropPosition} {section.title}</p>}
    <div className="flex flex-wrap items-start gap-2">
      {!pinned && <Button type="button" size="icon-sm" variant="ghost" draggable={!busy} disabled={busy} onDragStart={startDrag} onDragEnd={onDragEnd} aria-label={`Drag ${section.title} to reorder`} title="Drag to reorder; arrow buttons also work" className="shrink-0 cursor-grab active:cursor-grabbing"><GripVertical size={16} aria-hidden="true"/></Button>}
      <div className="min-w-0 flex-1"><h3 className="flex items-start gap-2 break-words text-sm font-medium"><FileText size={16} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true"/>{section.title}</h3>{pinned && <p className="mt-1 text-xs text-slate-500">Header stays at the top</p>}</div>
      <div className="flex flex-wrap gap-1">
        {!pinned && <><Button type="button" size="icon-sm" variant="ghost" disabled={busy || !canMoveEarlier} onClick={onMoveEarlier} aria-label={`Move ${section.title} up`} title="Move up"><ArrowUp size={15} aria-hidden="true"/></Button><Button type="button" size="icon-sm" variant="ghost" disabled={busy || !canMoveLater} onClick={onMoveLater} aria-label={`Move ${section.title} down`} title="Move down"><ArrowDown size={15} aria-hidden="true"/></Button></>}
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onEdit} aria-label={`Edit ${section.title}`}><Pencil size={14} aria-hidden="true"/>Edit</Button>
        {!pinned && <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button type="button" size="icon-sm" variant="ghost" disabled={busy} aria-label={`More actions for ${section.title}`}><MoreHorizontal size={16} aria-hidden="true"/></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} onCloseAutoFocus={(event) => { if (openingDialog.current) { event.preventDefault(); openingDialog.current = false; } }} className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md">
          <DropdownMenu.Item onSelect={() => openAction(onDuplicate)} className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]"><Copy size={16} aria-hidden="true"/>Duplicate section</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => openAction(onRemove)} className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-800 outline-none data-[highlighted]:bg-red-50"><Trash2 size={16} aria-hidden="true"/>Remove section</DropdownMenu.Item>
        </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>}
      </div>
    </div>
    <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">{sectionContent(section).trim() || "No content yet."}</p>
  </li>;
}
