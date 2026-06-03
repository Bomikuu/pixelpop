import React from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroPanel({
  children,
  title,
  rightSlot,
  className,
  bodyClassName,
  headerClassName,

  // Tokens
  bg = "rgba(255,255,255,0.85)",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow-soft)",
  radiusClass = "rounded-xl",
  borderWidthClass = "border-[3px]",

  // Press effect
  pressable = false,
  onClick,
  pressedShadow = "none",
  pressedOffsetClass = "active:translate-x-[2px] active:translate-y-[2px]",
}) {
  return (
    <div
      onClick={onClick}
      role={pressable ? "button" : undefined}
      tabIndex={pressable ? 0 : undefined}
      className={cx(
        "border",
        borderWidthClass,
       
        "overflow-hidden",
        "transition-transform",
        pressable ? "cursor-pointer select-none" : "",
        pressable ? pressedOffsetClass : "",
        className
      )}
      style={{ background: bg, borderColor, boxShadow: shadow }}
    >
      {/* Pressed shadow swap */}
      <style>{`
        .pp-panel-pressed:active {
          box-shadow: ${pressedShadow};
        }
      `}</style>

      <div className={pressable ? "pp-panel-pressed" : ""}>
        {(title || rightSlot) ? (
          <div
            className={cx(
              "flex items-center justify-between gap-3",
              "px-4 py-3",
              "border-b-[3px]",
              headerClassName
            )}
            style={{ borderColor }}
          >
            <div className="font-pp font-extrabold">{title}</div>
            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </div>
        ) : null}

        <div className={cx("p-4", bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
