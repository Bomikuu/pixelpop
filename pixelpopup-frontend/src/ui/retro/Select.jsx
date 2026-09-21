import React, { useId } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Choose an option",
  disabled = false,
  hint,
  error,
  id,
  className,
  selectClassName,
  bg = "white",
  fg = "#0f172a",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
}) {
  const generatedId = useId();
  const selectId = id || `pp-select-${generatedId.replace(/:/g, "")}`;
  const messageId = `${selectId}-message`;

  return (
    <div className={cx("w-full", className)}>
      {label ? (
        <label htmlFor={selectId} className="mb-1 block font-pp text-sm font-extrabold">
          {label}
        </label>
      ) : null}

      <div
        className="border-[3px] px-3 py-2 transition-transform focus-within:translate-x-[2px] focus-within:translate-y-[2px]"
        style={{ background: bg, color: fg, borderColor: error ? "var(--pp-danger)" : borderColor, boxShadow: shadow }}
      >
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? messageId : undefined}
          className={cx(
            "w-full cursor-pointer bg-transparent font-pp outline-none disabled:cursor-not-allowed disabled:opacity-60",
            selectClassName
          )}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const normalized = typeof option === "string" ? { label: option, value: option } : option;
            return (
              <option key={normalized.value} value={normalized.value} disabled={normalized.disabled}>
                {normalized.label}
              </option>
            );
          })}
        </select>
      </div>

      {error || hint ? (
        <p
          id={messageId}
          className="mt-2 font-pp text-sm font-bold"
          style={{ color: error ? "var(--pp-danger)" : undefined }}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}
