import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { CalendarPlus, ChevronDown, FileJson2, FolderPlus, Plus } from "lucide-react";
import { Button } from "../../ui/button";

const actions = [
  ["entry", "Add entry", CalendarPlus],
  ["group", "Add group", FolderPlus],
  ["import", "Import JSON", FileJson2],
];

export default function EodActionMenu({ onAction }) {
  const trigger = useRef(null);
  const opening = useRef(false);
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild><Button ref={trigger}><Plus size={16} aria-hidden="true" /> Add <ChevronDown size={16} aria-hidden="true" /></Button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }} className="personal-dashboard z-50 min-w-44 border border-[var(--pd-border)] bg-white p-1 text-slate-950 shadow-md">
      {actions.map(([kind, label, Icon]) => <DropdownMenu.Item key={kind} onSelect={() => { opening.current = true; trigger.current?.focus(); onAction(kind); }} className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]"><Icon size={16} aria-hidden="true" />{label}</DropdownMenu.Item>)}
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
