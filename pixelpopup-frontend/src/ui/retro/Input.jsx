import React from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,

  className,
  inputClassName,
  labelClassName,
  hint,
  error,

  // Tokens
  bg = "white",
  fg = "#0f172a",
  borderColor = "var(--pp-border)",
  radiusClass = "rounded-lg",
  borderWidthClass = "border-[3px]",
  shadow = "var(--pp-shadow)",

  // Press effect
  focusWithinPress = true,
  pressedShadow = "none",
  pressedOffsetClass = "focus-within:translate-x-[2px] focus-within:translate-y-[2px]",

  leftSlot,
  rightSlot,
}) {
  return (
    <div className={cx("w-full", className)}>
      {label ? (
        <div className={cx("mb-1 font-pp font-extrabold text-sm", labelClassName)}>
          {label}
        </div>
      ) : null}

      <div
        className={cx(
          "flex items-center gap-2",
          "px-3 py-2",
          "border",
          borderWidthClass,
          radiusClass,
          "transition-transform",
          focusWithinPress ? pressedOffsetClass : ""
        )}
        style={{
          background: bg,
          color: fg,
          borderColor,
          boxShadow: shadow,
        }}
      >
        {/* Pressed shadow swap */}
        <style>{`
          .pp-input-pressed:focus-within {
            box-shadow: ${pressedShadow};
          }
        `}</style>

        <div className={cx("w-full flex items-center gap-2", focusWithinPress ? "pp-input-pressed" : "")}>
          {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}

          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cx(
              "w-full bg-transparent outline-none",
              "font-pp",
              "placeholder:opacity-60",
              disabled ? "cursor-not-allowed" : "",
              inputClassName
            )}
          />

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </div>

      {error ? (
        <div className="mt-2 font-pp text-sm font-bold" style={{ color: "var(--pp-danger)" }}>
          {error}
        </div>
      ) : hint ? (
        <div className="mt-2 font-pp text-sm opacity-80">{hint}</div>
      ) : null}
    </div>
  );
}
