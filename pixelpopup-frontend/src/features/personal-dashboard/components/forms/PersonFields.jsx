import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import SelectableField from "../SelectableField";
import { relationshipOptions } from "./formDefinitions";
import { Building2, Mail, Phone } from "lucide-react";
import PersonAvatarField from "./PersonAvatarField";

export default function PersonFields({ values, onChange, errors = {}, disabled = false, prefix = "finance", existingAvatar }) {
  const fieldId = (name) => `${prefix}-${name}`;
  const error = (name) => errors[name] && (
    <p id={`${fieldId(name)}-error`} role="alert" className="mt-1 text-sm text-red-800">
      {errors[name]}
    </p>
  );
  return (
    <>
      <div className="sm:col-span-2">
        <PersonAvatarField id={fieldId("avatar_upload")} value={values.avatar_upload} existingAvatar={existingAvatar}
          name={values.name} disabled={disabled} onChange={(value) => onChange("avatar_upload", value)} error={errors.avatar_upload} />
      </div>
      <div>
        <Label htmlFor={fieldId("name")} className="mb-2 block">Name *</Label>
        <Input
          id={fieldId("name")}
          value={values.name || ""}
          onChange={(event) => onChange("name", event.target.value)}
          maxLength={120}
          autoComplete="name"
          placeholder="Person's name"
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
        <Label htmlFor={fieldId("nickname")} className="mb-2 block">Nickname / identifier (optional)</Label>
        <Input id={fieldId("nickname")} value={values.nickname || ""} maxLength={60}
          placeholder="For example, Mico from ASTA" disabled={disabled}
          onChange={(event) => onChange("nickname", event.target.value)}
          aria-invalid={!!errors.nickname} aria-describedby={`${fieldId("nickname")}-help${errors.nickname ? ` ${fieldId("nickname")}-error` : ""}`} />
        <p id={`${fieldId("nickname")}-help`} className="mt-1 text-xs text-slate-600">Helps distinguish people with the same name. Their records stay separate.</p>
        {error("nickname")}
      </div>
      <div className="sm:col-span-2 border-t border-[var(--pd-border)] pt-4">
        <p className="text-sm font-semibold">Contact details <span className="font-normal text-slate-600">(optional)</span></p>
      </div>
      {[
        { name: "email", label: "Email", icon: Mail, type: "email", maxLength: 254, autoComplete: "email", placeholder: "name@example.com" },
        { name: "phone", label: "Phone", icon: Phone, inputMode: "numeric", maxLength: 15, autoComplete: "tel", placeholder: "09171234567" },
        { name: "organization", label: "Company / organization", icon: Building2, maxLength: 120, autoComplete: "organization", placeholder: "Company, business, or group", fullWidth: true },
      ].map(({ name, label, icon: Icon, fullWidth, ...inputProps }) => <div key={name} className={fullWidth ? "sm:col-span-2" : "min-w-0"}>
        <Label htmlFor={fieldId(name)} className="mb-2 flex items-center gap-2"><Icon className="size-4 text-slate-600" aria-hidden="true" />{label}</Label>
        <Input id={fieldId(name)} {...inputProps} value={values[name] || ""}
          onChange={(event) => onChange(name, event.target.value)} disabled={disabled}
          aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${fieldId(name)}-error` : undefined} />
        {error(name)}
      </div>)}
      <div className="sm:col-span-2">
        <Label htmlFor={fieldId("notes")} className="mb-2 block">Notes (optional)</Label>
        <Textarea
          id={fieldId("notes")}
          value={values.notes || ""}
          onChange={(event) => onChange("notes", event.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Anything useful to remember about this person."
          disabled={disabled}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? `${fieldId("notes")}-error` : undefined}
        />
        {error("notes")}
      </div>
    </>
  );
}
