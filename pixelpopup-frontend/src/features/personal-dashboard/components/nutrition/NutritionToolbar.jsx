import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { Activity, CalendarDays, ChevronDown, Plus, Settings2, UtensilsCrossed } from "lucide-react";
import { Button } from "../../ui/button";

export default function NutritionToolbar({ entryRef, onTargets, onCalendar, onMeal, onActivity }) {
  const opening = useRef(false);
  return <div className="flex flex-wrap justify-end gap-2">
    <Button variant="outline" onClick={onCalendar}><CalendarDays className="size-4" />Log calendar</Button>
    <Button variant="outline" onClick={onTargets}><Settings2 className="size-4" />Targets & baseline</Button>
    <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button ref={entryRef}><Plus className="size-4" />Add entry<ChevronDown className="size-4" /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-44 rounded-md border border-[var(--pd-border)] bg-white p-1 shadow-md" onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }}>
        {[["Add meal", UtensilsCrossed, onMeal], ["Add activity", Activity, onActivity]].map(([label, Icon, action]) => <DropdownMenu.Item key={label} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => { opening.current = true; action(); }}><Icon className="size-4" />{label}</DropdownMenu.Item>)}
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
  </div>;
}
