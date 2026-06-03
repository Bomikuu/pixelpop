import React from "react";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function Badge({
  children,
  variant = "info", // info | success | warning | danger | pink | purple | cyan | yellow
  size = "sm", // xs | sm | md
  className,

  // Tokens
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  bg,
  fg,
  radiusClass = "rounded-lg",
  borderWidthClass = "border-[3px]",
  skew = false,
}) {
  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
  };

  const presets = {
    info: { bg: "white", fg: "#0f172a" },
    success: { bg: "#32ff7e", fg: "#051923" },
    warning: { bg: "var(--pp-accent-2)", fg: "#0f172a" },
    danger: { bg: "var(--pp-danger)", fg: "white" },
    pink: { bg: "var(--pp-titlebar)", fg: "white" },
    purple: { bg: "var(--pp-titlebar-2)", fg: "white" },
    cyan: { bg: "var(--pp-accent)", fg: "#051923" },
    yellow: { bg: "var(--pp-accent-2)", fg: "#0f172a" },
  };

  const chosen = presets[variant] || presets.info;

  return (
    <span
      className={cx(
        "inline-flex items-center justify-center",
        "font-pp font-extrabold tracking-tight",
        sizes[size],
        "select-none",
        "border",
        borderWidthClass,
        radiusClass,
        skew ? "-skew-x-6 rotate-1" : "",
        className
      )}
      style={{
        background: bg ?? chosen.bg,
        color: fg ?? chosen.fg,
        borderColor,
        boxShadow: shadow,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}
