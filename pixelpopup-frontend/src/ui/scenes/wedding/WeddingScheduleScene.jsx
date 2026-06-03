import React, { useMemo, useState } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function WeddingScheduleScene({
  title = "Ceremony Schedule",
  items = null, // optional override [{ id, time, title, subtitle, description }]
  primaryText = "Back to Details",
  secondaryText = "RSVP",

  onPrimary, // back to details
  onSecondary, // rsvp

  onClose, // optional alias of onPrimary
}) {
  const { cfg } = useWeddingConfig();

  const theme = (cfg?.theme || "minimal") === "retro" ? "retro" : "minimal";

  const tokens = theme === "retro"
    ? {
        border: "rgba(0,0,0,0.18)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        dot: "#22D3EE",
        dotBorder: "rgba(0,0,0,0.18)",
        line: "rgba(0,0,0,0.18)",
        primaryBg: "linear-gradient(135deg, #7C3AED, #22D3EE)",
        primaryText: "#051923",
      }
    : {
        border: "rgba(0,0,0,0.10)",
        panelBg: "rgba(255,255,255,0.96)",
        text: "#111827",
        subtext: "rgba(17,24,39,0.72)",
        dot: "#C9A76A",
        dotBorder: "rgba(0,0,0,0.10)",
        line: "rgba(0,0,0,0.10)",
        primaryBg: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
        primaryText: "#231F20",
      };

  const schedule = useMemo(() => {
    if (Array.isArray(items) && items.length) return items;

    // fallback schedule if not provided
    return [
      {
        id: "arrival",
        time: "2:30 PM",
        title: "Guest Arrival",
        subtitle: "Registration + Seating",
        description: "Please arrive early for smoother seating. Ushers will guide you.",
      },
      {
        id: "ceremony",
        time: "3:00 PM",
        title: "Ceremony Proper",
        subtitle: "Vows + Rings",
        description: "Unplugged moment: please keep phones on silent during vows.",
      },
      {
        id: "photos",
        time: "4:00 PM",
        title: "Photo Time",
        subtitle: "Family + Friends",
        description: "Group photos right after ceremony. Stay nearby if you’re part of the list.",
      },
      {
        id: "reception",
        time: "5:30 PM",
        title: "Reception",
        subtitle: "Dinner + Program",
        description: "Dinner, speeches, games, and the first dance. Enjoy the night!",
      },
    ];
  }, [items]);

  const [openId, setOpenId] = useState(() => (schedule[0]?.id ? schedule[0].id : null));

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const close = onClose || onPrimary;

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          {cfg?.names?.bride || "Bride"} & {cfg?.names?.groom || "Groom"}
        </div>

        <div className="mt-3 text-3xl font-semibold" style={{ color: tokens.text }}>
          {title}
        </div>

        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          Tap a time slot to expand/collapse.
        </div>

        <div
          className={cx(
            "mt-6 rounded-3xl border overflow-hidden",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: tokens.border, background: tokens.panelBg }}
        >
          <div className="p-6 sm:p-7">
            <div className="relative">
              {/* vertical line */}
              <div
                className="absolute left-[14px] top-2 bottom-2 w-[2px] rounded"
                style={{ background: tokens.line }}
              />

              <div className="space-y-4">
                {schedule.map((it, idx) => {
                  const open = openId === it.id;
                  return (
                    <div key={it.id} className="relative pl-10">
                      {/* dot */}
                      <div
                        className="absolute left-[6px] top-4 h-5 w-5 rounded-full border-[2px]"
                        style={{
                          background: tokens.dot,
                          borderColor: tokens.dotBorder,
                          boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                        }}
                        title={it.time}
                      />

                      {/* card */}
                      <button
                        type="button"
                        onClick={() => toggle(it.id)}
                        className={cx(
                          "w-full text-left rounded-2xl border",
                          "transition-transform",
                          "hover:-translate-y-[1px] active:translate-y-[1px]"
                        )}
                        style={{
                          borderColor: tokens.border,
                          background: "rgba(255,255,255,0.92)",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[11px] tracking-[0.25em] uppercase opacity-70">
                                {it.time}
                              </div>
                              <div className="mt-1 text-base sm:text-lg font-semibold" style={{ color: tokens.text }}>
                                {it.title}
                              </div>
                              {it.subtitle ? (
                                <div className="mt-1 text-sm" style={{ color: tokens.subtext }}>
                                  {it.subtitle}
                                </div>
                              ) : null}

                              {it.mediaUrl ? (
                                <div
                                  className="w-full overflow-hidden border"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  {it.mediaType === "video" ? (
                                    <video
                                      src={it.mediaUrl}
                                      className="w-full h-[260px] object-cover"
                                      controls
                                    />
                                  ) : (
                                    <img
                                      src={it.mediaUrl}
                                      alt={it.title}
                                      className="w-full h-[260px] object-cover"
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                              ) : null}
                            </div>

                            <div className="shrink-0">
                              <span
                                className="text-[10px] px-2 py-1 rounded-full border"
                                style={{ borderColor: tokens.border, background: "rgba(0,0,0,0.04)" }}
                              >
                                {open ? "OPEN" : "OPEN?"}
                              </span>
                            </div>
                          </div>

                          {open ? (
                            <div className="mt-3 text-sm text-neutral-700">
                              {it.description || "—"}
                            </div>
                          ) : null}
                        </div>
                      </button>

                      {idx === schedule.length - 1 ? null : (
                        <div className="h-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GLOBAL actions (one set only) */}
          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              {cfg?.dateLine || "—"} • {cfg?.locationLine || "—"}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={close}
                className={cx(
                  "px-4 py-2 rounded-full border text-sm font-medium",
                  "hover:bg-neutral-50 active:translate-y-[1px] transition"
                )}
                style={{ borderColor: tokens.border, color: tokens.text }}
              >
                {primaryText}
              </button>

              <button
                type="button"
                onClick={onSecondary}
                className={cx(
                  "px-5 py-2 rounded-full text-sm font-semibold",
                  "shadow-[0_8px_18px_rgba(0,0,0,0.10)]",
                  "hover:translate-y-[-1px] active:translate-y-[1px] transition"
                )}
                style={{ background: tokens.primaryBg, color: tokens.primaryText }}
              >
                {secondaryText}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs opacity-60">
          Next: Gallery carousel scene.
        </div>
      </div>
    </div>
  );
}
