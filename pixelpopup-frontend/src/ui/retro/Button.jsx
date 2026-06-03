import React from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RetroButton({
  children,
  onClick,
  type = "button",
  disabled = false,

  // Visual
  variant = "primary", // primary | secondary | danger | ghost
  size = "md", // sm | md | lg
  className,

  // Tokens
  bg,
  fg,
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  radiusClass = "rounded-lg",
  borderWidthClass = "border-[3px]",

  // Effects
  pressedOffsetClass = "active:translate-x-[2px] active:translate-y-[2px]",
  hoverLift = true,

  leftIcon,
  rightIcon,
  ariaLabel,
}) {
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm md:text-base",
    lg: "px-5 py-3 text-base md:text-lg",
  };

  const defaults = {
    primary: { bg: "var(--pp-accent)", fg: "#051923" },
    secondary: { bg: "white", fg: "#0f172a" },
    danger: { bg: "var(--pp-danger)", fg: "white" },
    ghost: { bg: "transparent", fg: "#0f172a", shadow: "none" },
  };

  const chosen = defaults[variant] || defaults.primary;
  const finalBg = bg ?? chosen.bg;
  const finalFg = fg ?? chosen.fg;
  const finalShadow = chosen.shadow === "none" ? "none" : shadow;

  return (
    <button
      aria-label={ariaLabel}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2",
        "font-pp font-extrabold",
        "select-none",
        sizes[size],
        radiusClass,
        "transition-transform",
        hoverLift && !disabled ? "hover:-translate-y-[1px]" : "",
        pressedOffsetClass,
        disabled ? "opacity-60 cursor-not-allowed" : "",
        "border",
        borderWidthClass,
        className
      )}
      style={{
        background: finalBg,
        color: finalFg,
        borderColor,
        boxShadow: finalShadow,
      }}
    >
      {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      <span className="truncate">{children}</span>
      {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
    </button>
  );
}
