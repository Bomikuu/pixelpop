import React, { useEffect, useMemo, useRef, useState } from "react";

const cx = (...c) => c.filter(Boolean).join(" ");

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function WeddingGalleryScene({
  title = "Gallery",
  subtitle = "A few moments we love",
  className,

  // images: [{ id, url, alt, caption }]
  images = [],

  // behavior
  startIndex = 0,
  loop = true,
  showDots = true,
  showArrows = true,
  enableKeyboard = true,
  enableSwipe = true,
  enableFullscreen = true,

  // global actions (ONLY ONCE)
  backText = "Back to Details",
  rsvpText = "RSVP",
  onBack,
  onRSVP,
}) {
  const normalized = useMemo(() => {
    return (images || []).map((img, i) => ({
      id: img.id ?? String(i),
      url: img.url,
      alt: img.alt ?? `Photo ${i + 1}`,
      caption: img.caption ?? "",
    })).filter((x) => Boolean(x.url));
  }, [images]);

  const [idx, setIdx] = useState(() => {
    const base = Number(startIndex) || 0;
    return clamp(base, 0, Math.max(0, normalized.length - 1));
  });

  // keep index valid when images change
  useEffect(() => {
    setIdx((prev) => clamp(prev, 0, Math.max(0, normalized.length - 1)));
  }, [normalized.length]);

  const [fsOpen, setFsOpen] = useState(false);

  const go = (next) => {
    if (!normalized.length) return;
    const last = normalized.length - 1;

    setIdx((prev) => {
      let n = next;
      if (typeof next === "function") n = next(prev);

      if (loop) {
        if (n < 0) return last;
        if (n > last) return 0;
        return n;
      }
      return clamp(n, 0, last);
    });
  };

  const next = () => go((p) => p + 1);
  const prev = () => go((p) => p - 1);

  // keyboard
  useEffect(() => {
    if (!enableKeyboard) return;
    const onKeyDown = (e) => {
      // ignore when typing
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (enableFullscreen && e.key === "Escape") setFsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableKeyboard, enableFullscreen, normalized.length, loop]);

  // swipe
  const touchRef = useRef({ x: 0, y: 0, active: false });
  const onTouchStart = (e) => {
    if (!enableSwipe) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchMove = (e) => {
    if (!enableSwipe) return;
    if (!touchRef.current.active) return;
    // prevent scroll jank on horizontal gesture
    const t = e.touches?.[0];
    if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    if (Math.abs(dx) > 14) {
      try {
        e.preventDefault();
      } catch {}
    }
  };
  const onTouchEnd = (e) => {
    if (!enableSwipe) return;
    if (!touchRef.current.active) return;

    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current.active = false;

    // horizontal swipe only
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  const active = normalized[idx] || null;

  return (
    <div className={cx("w-full", className)}>
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          GALLERY
        </div>

        <div className="mt-3 text-3xl font-semibold">{title}</div>
        {subtitle ? (
          <div className="mt-2 text-sm text-neutral-600">{subtitle}</div>
        ) : null}

        <div
          className={cx(
            "mt-6 rounded-3xl border bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="p-5 sm:p-7">
            {!normalized.length ? (
              <div className="text-sm text-neutral-700">No photos yet.</div>
            ) : (
              <div className="space-y-4">
                {/* Carousel Frame */}
                <div
                  className="relative overflow-hidden rounded-3xl border"
                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div className="relative w-full aspect-[16/10] bg-neutral-100">
                    {active ? (
                      <img
                        src={active.url}
                        alt={active.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                        onClick={() => enableFullscreen && setFsOpen(true)}
                        style={{ cursor: enableFullscreen ? "zoom-in" : "default" }}
                      />
                    ) : null}

                    {/* Arrows */}
                    {showArrows ? (
                      <>
                        <button
                          type="button"
                          onClick={prev}
                          className={cx(
                            "absolute left-3 top-1/2 -translate-y-1/2",
                            "px-3 py-2 rounded-full border bg-white/90",
                            "text-sm font-semibold",
                            "hover:bg-white active:translate-y-[1px] transition"
                          )}
                          style={{ borderColor: "rgba(0,0,0,0.12)" }}
                          aria-label="Previous photo"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={next}
                          className={cx(
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "px-3 py-2 rounded-full border bg-white/90",
                            "text-sm font-semibold",
                            "hover:bg-white active:translate-y-[1px] transition"
                          )}
                          style={{ borderColor: "rgba(0,0,0,0.12)" }}
                          aria-label="Next photo"
                        >
                          →
                        </button>
                      </>
                    ) : null}

                    {/* Index badge */}
                    <div className="absolute left-3 bottom-3">
                      <span
                        className="text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-full border bg-white/90"
                        style={{ borderColor: "rgba(0,0,0,0.12)" }}
                      >
                        {idx + 1} / {normalized.length}
                      </span>
                    </div>

                    {/* Hint */}
                    {enableFullscreen ? (
                      <div className="absolute right-3 bottom-3">
                        <span
                          className="text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-full border bg-white/90"
                          style={{ borderColor: "rgba(0,0,0,0.12)" }}
                        >
                          Tap to Zoom
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Caption */}
                {active?.caption ? (
                  <div className="text-sm text-neutral-700">
                    {active.caption}
                  </div>
                ) : null}

                {/* Dots */}
                {showDots ? (
                  <div className="flex items-center justify-center gap-2">
                    {normalized.map((p, i) => {
                      const on = i === idx;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => go(i)}
                          className={cx(
                            "h-2.5 w-2.5 rounded-full border transition",
                            on ? "scale-110" : "opacity-70 hover:opacity-100"
                          )}
                          style={{
                            borderColor: "rgba(0,0,0,0.20)",
                            background: on
                              ? "rgba(201,167,106,0.95)"
                              : "rgba(255,255,255,0.95)",
                          }}
                          aria-label={`Go to photo ${i + 1}`}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* GLOBAL FOOTER ACTIONS (ONLY ONCE) */}
          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="text-sm text-neutral-700">
              Swipe, use arrows, or tap dots to navigate.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className={cx(
                  "px-4 py-2 rounded-full border text-sm font-medium",
                  "hover:bg-neutral-50 active:translate-y-[1px] transition"
                )}
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                {backText}
              </button>

              <button
                type="button"
                onClick={onRSVP}
                className={cx(
                  "px-5 py-2 rounded-full text-sm font-semibold",
                  "shadow-[0_8px_18px_rgba(0,0,0,0.10)]",
                  "hover:translate-y-[-1px] active:translate-y-[1px] transition"
                )}
                style={{
                  background: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
                  color: "#231F20",
                }}
              >
                {rsvpText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {enableFullscreen && fsOpen && active ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-3xl overflow-hidden border bg-black"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <div className="relative w-full aspect-[16/10]">
                <img
                  src={active.url}
                  alt={active.alt}
                  className="absolute inset-0 h-full w-full object-contain"
                  draggable={false}
                />

                <button
                  type="button"
                  onClick={() => setFsOpen(false)}
                  className={cx(
                    "absolute right-3 top-3",
                    "px-3 py-2 rounded-full border bg-white/10 text-white",
                    "text-xs tracking-[0.25em] uppercase",
                    "hover:bg-white/15 active:translate-y-[1px] transition"
                  )}
                  style={{ borderColor: "rgba(255,255,255,0.18)" }}
                >
                  Close
                </button>

                {showArrows ? (
                  <>
                    <button
                      type="button"
                      onClick={prev}
                      className={cx(
                        "absolute left-3 top-1/2 -translate-y-1/2",
                        "px-3 py-2 rounded-full border bg-white/10 text-white",
                        "text-sm font-semibold",
                        "hover:bg-white/15 active:translate-y-[1px] transition"
                      )}
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                      aria-label="Previous photo"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      className={cx(
                        "absolute right-3 top-1/2 -translate-y-1/2",
                        "px-3 py-2 rounded-full border bg-white/10 text-white",
                        "text-sm font-semibold",
                        "hover:bg-white/15 active:translate-y-[1px] transition"
                      )}
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                      aria-label="Next photo"
                    >
                      →
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {active.caption ? (
              <div className="mt-3 text-sm text-white/80">
                {active.caption}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
