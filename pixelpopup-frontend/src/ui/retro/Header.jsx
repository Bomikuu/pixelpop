import React from "react";
import { Window, RetroButton } from "../retro"; // adjust path to your Window/RetroButton

const cx = (...c) => c.filter(Boolean).join(" ");

export default function RetroHeader({
  className,

  // Left: tabs
  tabs = [
    { id: "home", label: "HOME" },
    { id: "scenes", label: "SCENES" },
    { id: "booth", label: "BOOTH" },
  ],
  activeTab = "home",
  onTabChange,

  // Right: logo / links
  logo = { src: "/logo.png", alt: "PixelPopup" }, // replace later
  logoRight = true,
  rightLinks = [
    { label: "m1ku.dev", href: "https://m1ku.dev", external: true },
  ],

  // Window options
  title = "PIXELPOPUP.EXE",
  showControls = true, // the 3 buttons on the right
  onMinimize,
  onMaximize,
  onClose,

  // If you want it sticky
  sticky = false,
}) {
  return (
    <div
      className={cx(
        sticky ? "sticky top-0 z-[50] w-full" : "",
        className
      )}
    >
      <Window
        title={title}
      
        maxWidthClass="max-w-full"
        headerClassName="!py-2"
        bodyClassName="!p-0"
      >
        {/* Header content inside Window */}
        <div
          className={cx(
            "px-3 py-2 border-b-[3px] flex items-center gap-3",
            "bg-[rgba(255,255,255,0.75)]"
          )}
          style={{ borderColor: "var(--pp-border)" }}
        >
          {/* Tabs */}
          <div className="flex items-center gap-2 min-w-0">
            {tabs.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange?.(t.id)}
                  className={cx(
                    "font-pp font-extrabold text-[11px] uppercase",
                    "px-3 py-[6px] rounded-xl border-[3px]",
                    "transition-transform",
                    "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]",
                    active ? "opacity-100" : "opacity-80"
                  )}
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: active
                      ? "var(--pp-accent-2)"
                      : "rgba(255,255,255,0.92)",
                    color: "rgba(15,23,42,0.9)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right links */}
          <div className="hidden md:flex items-center gap-2">
            {rightLinks.map((l, i) => (
              <a
                key={`${l.label}-${i}`}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noreferrer" : undefined}
                className={cx(
                  "font-pp text-[11px] font-extrabold",
                  "px-3 py-[6px] rounded-xl border-[3px]",
                  "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]",
                  "transition-transform"
                )}
                style={{
                  borderColor: "var(--pp-border)",
                  boxShadow: "var(--pp-shadow)",
                  background: "rgba(255,255,255,0.92)",
                  color: "rgba(15,23,42,0.9)",
                  whiteSpace: "nowrap",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Logo */}
          {logoRight ? (
            <div className="shrink-0 flex items-center gap-2">
              {logo?.src ? (
                <img
                  src={logo.src}
                  alt={logo.alt || "logo"}
                  className="h-7 w-7 rounded-lg border-[3px]"
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: "rgba(255,255,255,0.85)",
                    imageRendering: "pixelated",
                  }}
                />
              ) : null}

              {showControls ? (
                <div className="flex items-center gap-2">
                  <ControlDot
                    color="rgba(34,197,94,0.95)"
                    onClick={onMinimize}
                    title="Minimize"
                  />
                  <ControlDot
                    color="rgba(59,130,246,0.95)"
                    onClick={onMaximize}
                    title="Maximize"
                  />
                  <ControlDot
                    color="rgba(239,68,68,0.95)"
                    onClick={onClose}
                    title="Close"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Optional: a tiny sub-row (mobile links) */}
        <div
          className="px-3 py-2 flex md:hidden items-center gap-2"
          style={{ background: "rgba(255,255,255,0.70)" }}
        >
          {rightLinks.map((l, i) => (
            <RetroButton
              key={`${l.label}-${i}`}
              size="sm"
              variant="secondary"
              onClick={() => (window.location.href = l.href)}
              className="!px-3 !py-2"
            >
              {l.label}
            </RetroButton>
          ))}
        </div>
      </Window>
    </div>
  );
}

function ControlDot({ color, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cx(
        "h-6 w-6 rounded-lg border-[3px]",
        "transition-transform",
        "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
      )}
      style={{
        background: color,
        borderColor: "var(--pp-border)",
        boxShadow: "var(--pp-shadow)",
      }}
    />
  );
}
