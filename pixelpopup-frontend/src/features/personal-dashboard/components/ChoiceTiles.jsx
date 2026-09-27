import { useState } from "react";
import { Check, Landmark } from "lucide-react";
import { choiceIcon } from "../lib/presets";

export function InstitutionLogo({ institution, className = "h-7 w-16" }) {
  const [failed, setFailed] = useState(false);
  return institution?.logo && !failed ? (
    <img
      src={institution.logo}
      alt=""
      className={className + " object-contain"}
      width="64"
      height="28"
      onError={() => setFailed(true)}
    />
  ) : (
    <Landmark
      className="size-6 shrink-0 text-[var(--pd-primary)]"
      aria-hidden="true"
    />
  );
}

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
          compact
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
                "pd-choice relative flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--pd-primary)] " +
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
              {option.logo ? (
                <InstitutionLogo institution={option} />
              ) : (
                <Icon
                  size={18}
                  className="shrink-0 text-[var(--pd-primary)]"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 flex-1 break-words leading-5">
                {option.label}
              </span>
              {selected && (
                <Check
                  size={14}
                  className="shrink-0 text-[var(--pd-primary)]"
                  aria-hidden="true"
                />
              )}
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
