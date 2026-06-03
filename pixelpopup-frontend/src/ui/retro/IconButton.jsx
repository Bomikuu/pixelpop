import React from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroIconButton({
  icon,
  onClick,
  title,
  disabled = false,
  className,
  bg = "rgba(255,255,255,0.75)",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  sizeClass = "h-10 w-10",
  radiusClass = "rounded-lg",
  borderWidthClass = "border-[3px]",
  iconColor = "var(--pp-border)",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "inline-flex items-center justify-center",
        "select-none transition-transform",
        "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]",
        "border",
        borderWidthClass,
        radiusClass,
        sizeClass,
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className
      )}
      style={{ background: bg, borderColor, boxShadow: shadow }}
    >
      <div className="inline-flex" style={{ color: iconColor }}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon, {
              color: iconColor,
              stroke: iconColor,
              fill: "none",
            })
          : icon}
      </div>
    </button>
  );
}
