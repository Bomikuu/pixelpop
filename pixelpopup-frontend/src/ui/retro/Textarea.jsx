import React, { useId } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  hint,
  error,
  id,
  className,
  textareaClassName,
  bg = "white",
  fg = "#0f172a",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
}) {
  const generatedId = useId();
  const textareaId = id || `pp-textarea-${generatedId.replace(/:/g, "")}`;
  const messageId = `${textareaId}-message`;

  return (
    <div className={cx("w-full", className)}>
      {label ? (
        <label htmlFor={textareaId} className="mb-1 block font-pp text-sm font-extrabold">
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        className={cx(
          "w-full resize-y border-[3px] px-3 py-3 font-pp outline-none transition-transform",
          "focus:translate-x-[2px] focus:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-60",
          textareaClassName
        )}
        style={{ background: bg, color: fg, borderColor: error ? "var(--pp-danger)" : borderColor, boxShadow: shadow }}
      />

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
