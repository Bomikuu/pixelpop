import React, { useId } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroCheckbox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id,
  className,
  accent = "var(--pp-accent)",
  borderColor = "var(--pp-border)",
}) {
  const generatedId = useId();
  const checkboxId = id || `pp-checkbox-${generatedId.replace(/:/g, "")}`;
  const descriptionId = description ? `${checkboxId}-description` : undefined;

  return (
    <label
      htmlFor={checkboxId}
      className={cx(
        "flex items-start gap-3 font-pp",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <span className="relative mt-0.5 inline-flex size-6 shrink-0">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={descriptionId}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="flex size-6 items-center justify-center border-[3px] bg-white text-sm font-black shadow-[2px_2px_0_#0f172a] peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400"
          style={{ borderColor, background: checked ? accent : "white" }}
        >
          {checked ? "✓" : ""}
        </span>
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{label}</span>
        {description ? (
          <span id={descriptionId} className="mt-1 block text-xs leading-5 opacity-70">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
