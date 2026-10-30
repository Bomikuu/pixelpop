import { Save, UserRoundPlus } from "lucide-react";
import { Button } from "../../ui/button";
import PersonFields from "./PersonFields";

export default function InlinePersonCreator({
  open, onToggle, draft, onDraftChange, errors, saving, onSave, disabled,
}) {
  return <div className="mt-3">
    <Button type="button" variant="outline" size="sm" onClick={onToggle}
      disabled={disabled || saving} aria-expanded={open} aria-controls="inline-person-fields">
      <UserRoundPlus aria-hidden="true" />{open ? "Close person form" : "Add person"}
    </Button>
    {open && <div id="inline-person-fields"
      className="mt-3 border border-[var(--pd-border)] bg-[var(--pd-soft)] p-4"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target.tagName === "INPUT") {
          event.preventDefault();
          onSave();
        }
      }}>
      <p className="mb-3 text-sm font-semibold">New person</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <PersonFields prefix="new-contact" values={draft} onChange={onDraftChange}
          errors={errors} disabled={saving} />
      </div>
      {Object.values(errors).some(Boolean) && <p id="new-contact-form-error" tabIndex={-1} role="alert" className="mt-3 text-sm text-red-800 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--pd-primary)]">{errors.common || "Check the highlighted fields before saving this person."}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" onClick={onSave} disabled={saving || ["__processing__", "__invalid__"].includes(draft.avatar_upload)} aria-busy={saving}>
          <Save aria-hidden="true" />{saving ? "Saving person…" : "Save person"}
        </Button>
      </div>
    </div>}
  </div>;
}
