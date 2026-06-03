import React, { useMemo } from "react";
import RetroPanel from "./Panel"; // adjust path if needed

const cx = (...c) => c.filter(Boolean).join(" ");

export default function RetroFooter({
  className,
  title = "FOOTER",

  // Main links (left)
  links = [
    { label: "m1ku.dev", href: "https://m1ku.dev", external: true },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],

  // Socials (right)
  socials = [
    { label: "Facebook", href: "https://facebook.com", external: true },
    { label: "Instagram", href: "https://instagram.com", external: true },
    { label: "TikTok", href: "https://tiktok.com", external: true },
  ],

  // Bottom row
  brandText = "PixelPopup.exe",
  byText = "by m1ku.dev",
  showYear = true,
}) {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <RetroPanel title={title} className={cx(className)}>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          {/* Links */}
          <div className="md:col-span-7">
            <div className="font-pp text-xs font-extrabold opacity-80 mb-2">
              LINKS
            </div>

            <div className="flex flex-wrap gap-2">
              {links.map((l, i) => (
                <a
                  key={`${l.label}-${i}`}
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noreferrer" : undefined}
                  className={cx(
                    "font-pp text-[11px] font-extrabold",
                    "px-3 py-2 rounded-xl border-[3px]",
                    "transition-transform",
                    "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                  )}
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: "rgba(255,255,255,0.9)",
                    color: "rgba(15,23,42,0.9)",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div className="md:col-span-5">
            <div className="font-pp text-xs font-extrabold opacity-80 mb-2">
              SOCIALS
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              {socials.map((s, i) => (
                <a
                  key={`${s.label}-${i}`}
                  href={s.href}
                  target={s.external ? "_blank" : undefined}
                  rel={s.external ? "noreferrer" : undefined}
                  className={cx(
                    "font-pp text-[11px] font-extrabold",
                    "px-3 py-2 rounded-xl border-[3px]",
                    "transition-transform",
                    "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                  )}
                  style={{
                    borderColor: "var(--pp-border)",
                    boxShadow: "var(--pp-shadow)",
                    background: "rgba(255,255,255,0.9)",
                    color: "rgba(15,23,42,0.9)",
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="mt-4 pt-3 border-t-[3px] flex flex-col md:flex-row md:items-center md:justify-between gap-2"
          style={{ borderColor: "var(--pp-border)" }}
        >
          <div className="font-pp text-[11px] font-extrabold opacity-85">
            {brandText} {showYear ? <span className="opacity-70">© {year}</span> : null}
          </div>

          <div className="font-pp text-[11px] font-extrabold opacity-70">
            {byText}
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
