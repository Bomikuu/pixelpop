import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, HeartHandshake, Plus, UserRoundPlus, Users } from "lucide-react";
import { Button } from "../ui/button";

export default function PeopleActions({ openForm, person }) {
  const trigger = useRef(null);
  const opening = useRef(false);
  const openRecord = (entity) => {
    opening.current = true;
    trigger.current?.focus();
    openForm(entity, person?.id ? { contact: person.id } : undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button ref={trigger}>
            <Plus aria-hidden="true" />
            Add record
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="personal-dashboard z-50 min-w-40 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md"
            onCloseAutoFocus={(event) => {
              if (opening.current) {
                event.preventDefault();
                opening.current = false;
              }
            }}
          >
            <DropdownMenu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]"
              onSelect={() => openRecord("giving")}
            >
              <HeartHandshake size={16} aria-hidden="true" />
              Add giving
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]"
              onSelect={() => openRecord("loan")}
            >
              <Users size={16} aria-hidden="true" />
              Add loan
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Button variant="outline" onClick={() => openForm("person", person?.id ? person : undefined)}>
        <UserRoundPlus aria-hidden="true" />
        {person?.id ? "Edit person" : "Add person"}
      </Button>
    </div>
  );
}
