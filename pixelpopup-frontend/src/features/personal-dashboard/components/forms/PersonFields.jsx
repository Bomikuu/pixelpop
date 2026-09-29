import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import SelectableField from "../SelectableField";
import { relationshipOptions } from "./formDefinitions";

export default function PersonFields({ values, onChange, errors = {}, disabled = false, prefix = "finance" }) {
  const fieldId = (name) => `${prefix}-${name}`;
  const error = (name) => errors[name] && (
    <p id={`${fieldId(name)}-error`} role="alert" className="mt-1 text-sm text-red-800">
      {errors[name]}
    </p>
  );
  return (
    <>
      <div>
        <Label htmlFor={fieldId("name")} className="mb-2 block">Name *</Label>
        <Input
          id={fieldId("name")}
          value={values.name || ""}
          onChange={(event) => onChange("name", event.target.value)}
          maxLength={120}
          disabled={disabled}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${fieldId("name")}-error` : undefined}
        />
        {error("name")}
      </div>
      <div>
        <Label htmlFor={fieldId("relationship")} className="mb-2 block">Relationship *</Label>
        <SelectableField
          id={fieldId("relationship")}
          label="Relationship"
          options={relationshipOptions}
          value={values.relationship || ""}
          onChange={(value) => onChange("relationship", value)}
          disabled={disabled}
          required
          invalid={!!errors.relationship}
          describedBy={errors.relationship ? `${fieldId("relationship")}-error` : undefined}
        />
        {error("relationship")}
      </div>
      {values.relationship === "Other" && (
        <div className="sm:col-span-2">
          <Label htmlFor={fieldId("custom_relationship")} className="mb-2 block">Relationship detail</Label>
          <Input
            id={fieldId("custom_relationship")}
            value={values.custom_relationship || ""}
            onChange={(event) => onChange("custom_relationship", event.target.value)}
            maxLength={60}
            placeholder="For example, Cousin or Neighbor"
            disabled={disabled}
            aria-invalid={!!errors.custom_relationship}
            aria-describedby={errors.custom_relationship ? `${fieldId("custom_relationship")}-error` : undefined}
          />
          {error("custom_relationship")}
        </div>
      )}
      <div className="sm:col-span-2">
        <Label htmlFor={fieldId("notes")} className="mb-2 block">Notes (optional)</Label>
        <Textarea
          id={fieldId("notes")}
          value={values.notes || ""}
          onChange={(event) => onChange("notes", event.target.value)}
          maxLength={4000}
          disabled={disabled}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? `${fieldId("notes")}-error` : undefined}
        />
        {error("notes")}
      </div>
    </>
  );
}
