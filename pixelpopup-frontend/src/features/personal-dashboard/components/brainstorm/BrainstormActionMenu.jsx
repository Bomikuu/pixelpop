import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, FileJson2, FolderPlus, Lightbulb, Plus, Rows3 } from "lucide-react";
import { Button } from "../../ui/button";

const actions = [
  { kind: "board", label: "Add board", icon: FolderPlus },
  { kind: "group", label: "Add group", icon: Rows3, needsBoard: true },
  { kind: "idea", label: "Add idea", icon: Lightbulb, needsBoard: true },
  { kind: "import", label: "Import JSON", icon: FileJson2 },
];

export default function BrainstormActionMenu({ activeBoard, onAction }) {
  const trigger = useRef(null);
  const opening = useRef(false);
  const choose = (kind) => {
    opening.current = true;
    trigger.current?.focus();
    onAction(kind);
  };

  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <Button ref={trigger}><Plus size={16} aria-hidden="true" /> Add <ChevronDown size={16} aria-hidden="true" /></Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end" sideOffset={6}
        className="personal-dashboard z-50 min-w-48 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md"
        onCloseAutoFocus={(event) => {
          if (opening.current) {
            event.preventDefault();
            opening.current = false;
          }
        }}
      >
        {actions.map(({ kind, label, icon: Icon, needsBoard }) => <DropdownMenu.Item
          key={kind}
          disabled={needsBoard && !activeBoard}
          onSelect={() => choose(kind)}
          className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)] data-[disabled]:cursor-not-allowed data-[disabled]:text-slate-400"
        >
          <Icon size={16} aria-hidden="true" />{label}
        </DropdownMenu.Item>)}
        {!activeBoard && <p className="border-t border-[var(--pd-border)] px-3 py-2 text-xs text-slate-600">
          Add or reactivate a board to add groups and ideas.
        </p>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
