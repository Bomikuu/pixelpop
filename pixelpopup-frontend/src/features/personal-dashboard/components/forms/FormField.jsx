import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import SelectableField from "../SelectableField";
import AccountBalancePreview from "../AccountBalancePreview";
import { institutions } from "../../lib/presets";
import { accountSources } from "./accountFlow";

export default function FormField({
  field, values, options = [], error, disabled, onChange, entity, accountState,
  amountValue, institutionChoice, onInstitutionChoice, children, idPrefix = "finance",
  layout = "dashboard", labelAction,
}) {
  const id = `${idPrefix}-${field.name}`;
  const selectedAccount = accountSources.has(field.source) ? accountState?.(field) : null;
  const fullWidth = ["textarea", "institution"].includes(field.type) ||
    accountSources.has(field.source) || field.source === "contacts" ||
    field.name === "existing" || (field.type === "select" && options.length < 3);
  const compactSelect = field.type === "select" && !fullWidth;
  const placement = layout === "plain" ? "" : fullWidth
    ? entity === "account" ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-6"
    : entity === "account" ? "" : compactSelect ? "lg:col-span-2" : "lg:col-span-3";

  return <div className={`min-w-0 ${placement}`}>
    {labelAction ? <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Label htmlFor={id}>{field.label}{field.required && " *"}</Label>{labelAction}</div> : <Label htmlFor={id} className="mb-2 block">{field.label}{field.required && " *"}</Label>}
    {field.type === "select" ? <>
      <SelectableField
        id={id} label={field.label} required={field.required}
        options={field.nullable ? [{ value: "", label: "None" }, ...options] : options}
        value={values[field.name]} onChange={(value) => onChange(field.name, value)}
        disabled={disabled || field.disabled} invalid={!!error}
        describedBy={[error && id + "-error", selectedAccount?.previewVisible && id + "-preview"].filter(Boolean).join(" ") || undefined}
        forceTiles={accountSources.has(field.source)}
      />
      {selectedAccount?.direction && <AccountBalancePreview
        id={id + "-preview"} account={selectedAccount.selected} amount={amountValue}
        direction={selectedAccount.direction} existingAmount={selectedAccount.existingAmount}
      />}
    </> : field.type === "institution" ? <div className="space-y-3">
      <SelectableField
        id={id} label={field.label}
        options={institutions.filter((option) => option.value === "__other" ||
          (values.kind === "ewallet" ? ["GCash", "Maya"].includes(option.value) : !["GCash", "Maya"].includes(option.value)))}
        value={institutionChoice}
        onChange={(value) => {
          onInstitutionChoice(value);
          onChange("institution", value === "__other" ? "" : value);
        }}
        disabled={disabled}
      />
      {institutionChoice === "__other" && <div>
        <Label htmlFor="custom-institution">Institution name</Label>
        <Input id="custom-institution" value={values.institution || ""}
          onChange={(event) => onChange("institution", event.target.value)}
          maxLength={100} disabled={disabled} placeholder="Enter your bank or wallet" />
      </div>}
    </div> : field.type === "textarea" ? <Textarea
      id={id} value={values[field.name] ?? ""} onChange={(event) => onChange(field.name, event.target.value)}
      maxLength={field.maxLength === null ? undefined : field.maxLength || 4000}
      placeholder={field.placeholder}
      disabled={disabled} className={`resize-none ${field.className || ""}`}
      aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined}
    /> : <Input
      id={id} type={field.type} value={values[field.name] ?? ""}
      onChange={(event) => onChange(field.name, event.target.value)}
      min={field.min} max={field.max} step={field.step} inputMode={field.inputMode}
      placeholder={field.placeholder} pattern={field.pattern}
      maxLength={field.maxLength || (field.name === "reason" ? 240 : 160)}
      disabled={disabled || field.disabled} aria-invalid={!!error}
      aria-describedby={[field.hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ") || undefined}
    />}
    {field.hint && <p id={id + "-hint"} className="mt-1 text-xs leading-5 text-slate-600">{field.hint}</p>}
    {children}
    {error && <p id={id + "-error"} role="alert" className="mt-1 text-sm text-red-800">{error}</p>}
  </div>;
}
