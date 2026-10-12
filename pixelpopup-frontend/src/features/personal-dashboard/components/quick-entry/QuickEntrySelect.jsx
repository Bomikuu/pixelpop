import { CircleHelp, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { choiceIcon } from "../../lib/presets";
import { accountLabel } from "../../lib/format";
import { eligibleAccounts } from "../../quick-entry/model";
import { formatMinorUnits, toMinorUnits } from "../../quick-entry/money";

export function QuickEntrySelect({ label, value, onChange, options, disabled, invalid, describedBy, className = "" }) {
  const selected = options.find((option) => String(option.value ?? "__none") === String(value ?? "__none"));
  const SelectedIcon = selected?.icon || CircleHelp;
  return (
    <Select value={value == null ? "__none" : String(value)} onValueChange={(next) => onChange(next === "__none" ? null : Number(next))} disabled={disabled}>
      <SelectTrigger className={`min-h-11 w-full ${className}`} aria-label={label} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
        <SelectValue placeholder={label}><span className="inline-flex min-w-0 items-center gap-1.5"><SelectedIcon className="size-4 shrink-0 text-slate-500" aria-hidden="true" /><span className="truncate">{selected?.label || label}</span></span></SelectValue>
      </SelectTrigger>
      <SelectContent className="personal-dashboard w-[var(--radix-select-trigger-width)] rounded-none" position="popper" align="start">
        {options.map(({ value: optionValue, label: text, description, icon: Icon = CircleHelp }) => (
          <SelectItem className="rounded-none" key={optionValue ?? "__none"} value={optionValue == null ? "__none" : String(optionValue)}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 whitespace-normal"><span className="block">{text}</span>{description && <span className="block text-xs text-slate-600">{description}</span>}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AccountSelect({ accounts, kind, allowNone = true, ...props }) {
  const options = eligibleAccounts(accounts, kind).map((account) => {
    const balance = toMinorUnits(account.balance);
    const card = account.kind === "credit_card";
    const available = card && account.credit_limit != null ? toMinorUnits(account.available_credit ?? (Number(account.credit_limit) - Number(account.balance))) : balance;
    return { value: account.id, label: accountLabel(account), icon: choiceIcon(account.kind), description: card
      ? account.credit_limit == null ? "Set a credit limit before charging" : `${formatMinorUnits(available)} available credit · ${formatMinorUnits(toMinorUnits(account.credit_limit))} limit`
      : `${formatMinorUnits(available)} current balance` };
  });
  if (allowNone) options.unshift({ value: null, label: "Other Account", description: "Save unsettled; assign an account later", icon: Wallet });
  return <QuickEntrySelect options={options} {...props} />;
}

export function CategorySelect({ categories, ...props }) {
  return <QuickEntrySelect options={[{ value: null, label: "Other", icon: CircleHelp }, ...categories.map((category) => ({ value: category.id, label: category.name, icon: choiceIcon(category.name.toLowerCase(), category.name) }))]} {...props} />;
}
