import React from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,

  className,
  labelClassName,

  // Tokens
  trackBg = "white",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  accent = "var(--pp-accent)",
}) {
  return (
    <div className={cx("w-full", className)}>
      {label ? (
        <div className={cx("mb-2 font-pp font-extrabold text-sm", labelClassName)}>
          {label} <span className="opacity-70">({value})</span>
        </div>
      ) : null}

      <div
        className="border-[3px] rounded-lg px-3 py-3"
        style={{ background: trackBg, borderColor, boxShadow: shadow }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full"
          style={{ accentColor: accent }}
        />
      </div>
    </div>
  );
}
