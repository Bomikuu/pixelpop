import { Check } from "lucide-react";
import { choiceIcon } from "../lib/presets";
import AccountCardFace from "./AccountCardFace";
import InstitutionLogo from "./InstitutionLogo";

export { InstitutionLogo };

export default function ChoiceTiles({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  required = false,
  compact = false,
  accountChoices = false,
  avatarChoices = false,
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="min-w-0"
    >
      <legend className="sr-only">
        {label}
        {required ? " (required)" : ""}
      </legend>
      <div
        className={
          accountChoices
            ? "grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3"
            : compact
              ? "flex flex-wrap gap-2"
              : "grid grid-cols-2 gap-2 sm:grid-cols-3"
        }
      >
        {options.map((option) => {
          const Icon = option.icon || choiceIcon(option.value, option.label);
          const selected = String(value ?? "") === String(option.value);
          return (
            <label
              key={option.value}
              className={
                "pd-choice relative flex min-w-0 cursor-pointer items-center gap-2 rounded-md border text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--pd-primary)] " +
                (avatarChoices ? "flex-col text-center " : "") +
                (accountChoices ? "p-2.5 " : "p-3 ") +
                (disabled ? "pointer-events-none opacity-60" : "") +
                (compact ? " px-3 py-2" : "")
              }
              data-selected={selected}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                onChange={() => onChange(String(option.value))}
                disabled={disabled}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className="sr-only"
              />
              {accountChoices && option.account ? (
                <div aria-hidden="true" className="relative h-14 w-[98px] shrink-0 overflow-hidden rounded-md">
                  <div className="pointer-events-none absolute left-0 top-0 w-[350px] origin-top-left scale-[0.28]">
                    <AccountCardFace account={option.account} align="left" />
                  </div>
                </div>
              ) : (
                <span aria-hidden="true" className={"grid shrink-0 place-items-center rounded-full bg-blue-50 " + (avatarChoices ? "size-14" : compact ? "size-8" : "size-10")}>
                  {option.logo ? <InstitutionLogo institution={option} className="h-6 w-8" /> : <Icon size={avatarChoices ? 28 : compact ? 16 : 20} className="text-[var(--pd-primary)]" />}
                </span>
              )}
              <span className="min-w-0 flex-1 break-words leading-5">
                <span className="block font-medium text-slate-950">{accountChoices && option.account ? option.account.name : option.label}</span>
                {accountChoices && option.account?.last_four && <span className="block text-xs text-slate-600">•••• {option.account.last_four}{option.account.card_expiry ? ` · Exp ${option.account.card_expiry}` : ""}</span>}
                {option.description && <span className="mt-0.5 block text-xs leading-snug text-slate-600">{option.description}</span>}
              </span>
              <span aria-hidden="true" className={"grid size-4 shrink-0 self-start place-items-center rounded-full border " + (avatarChoices ? "absolute right-3 top-3 " : "") + (selected ? "border-[var(--pd-primary)] bg-[var(--pd-primary)] text-white" : "border-slate-400 bg-white")}>{selected && <Check size={11} strokeWidth={3} />}</span>
            </label>
          );
        })}
      </div>
      {!options.length && (
        <p className="text-sm text-slate-600">
          No choices yet. Add a record in the corresponding tab first.
        </p>
      )}
    </fieldset>
  );
}
