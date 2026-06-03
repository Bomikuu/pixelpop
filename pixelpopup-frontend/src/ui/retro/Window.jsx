import React from "react";
import { Minus, Square, X } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Window({
  title = "Window",
  subtitle,
  children,

  // Layout
  widthClass = "w-full",
  maxWidthClass = "max-w-2xl",
  heightClass,
  className,
  bodyClassName,
  headerClassName,
  footer,
  footerClassName,

  // Style tokens (use CSS vars or literal colors)
  bg = "var(--pp-window)",
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  radiusClass = "rounded-xl",
  borderWidthClass = "border-[3px]",

  // Titlebar
  titlebar = true,
  titlebarGradient = true,
  titlebarBg = "linear-gradient(90deg, var(--pp-titlebar), var(--pp-titlebar-2))",
  titlebarSolidBg = "var(--pp-titlebar)",
  titleClassName,
  subtitleClassName,
  dots = true,
  dotColors = ["#ff3b3b", "#ffe14d", "#32ff7e"],
  rightSlot,

  // Controls
  onClose,
  onMinimize,
  onMaximize,
  closable = false,
  minimizable = false,
  maximizable = false,
  ariaLabel,
}) {
  const rootStyle = {
    background: bg,
    borderColor,
    boxShadow: shadow,
  };

  const titlebarStyle = titlebarGradient
    ? { background: titlebarBg, borderColor }
    : { background: titlebarSolidBg, borderColor };

const controlBtn =
  "h-7 w-8 border-[2px] rounded-md bg-white/75 hover:bg-white active:translate-y-[1px] inline-flex items-center justify-center text-slate-900";

  return (
    <section
      aria-label={ariaLabel || title}
      className={cx(
        "border",
        borderWidthClass,
   
        "overflow-hidden",
        "text-slate-900",
        widthClass,
        maxWidthClass,
        heightClass,
        className
      )}
      style={rootStyle}
    >
      {titlebar && (
        <div
          className={cx(
            "flex items-center justify-between gap-3",
            "px-3 py-2",
            "border-b-[3px]",
            headerClassName
          )}
          style={titlebarStyle}
        >
          <div className="flex items-center gap-3 min-w-0">
            {dots && (
              <div className="flex items-center gap-2 shrink-0">
                {dotColors.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="h-3 w-3 rounded-full border-[2px]"
                    style={{ background: c, borderColor: "var(--pp-border)" }}
                  />
                ))}
              </div>
            )}

            <div className="min-w-0">
              <div
                className={cx(
                  "font-pp font-extrabold tracking-tight",
                  "text-sm md:text-base",
                  "truncate",
                  titleClassName
                )}
              >
                {title}
              </div>
              {subtitle ? (
                <div
                  className={cx(
                    "font-pp text-[11px] md:text-xs opacity-90",
                    "truncate",
                    subtitleClassName
                  )}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {rightSlot}
            {(minimizable || maximizable || closable) && (
              <div className="flex items-center gap-1">
                {minimizable && (
                  <button
                    type="button"
                    onClick={onMinimize}
                    className={controlBtn}
                    style={{ borderColor: "var(--pp-border)" }}
                    title="Minimize"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                )}
                {maximizable && (
                  <button
                    type="button"
                    onClick={onMaximize}
                    className={controlBtn}
                    style={{ borderColor: "var(--pp-border)" }}
                    title="Maximize"
                  >
                    <Square size={15} strokeWidth={3} />
                  </button>
                )}
                {closable && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={controlBtn}
                    style={{ borderColor: "var(--pp-border)" }}
                    title="Close"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cx("p-4", bodyClassName)}>{children}</div>

      {footer ? (
        <div
          className={cx("border-t-[3px] px-4 py-3", footerClassName)}
          style={{ borderColor: "var(--pp-border)" }}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}
