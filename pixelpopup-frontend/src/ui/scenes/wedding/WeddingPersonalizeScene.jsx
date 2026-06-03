import React, { useMemo, useRef, useState } from "react";
import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

function readFileToObjectUrl(file) {
  if (!file) return "";
  try {
    return URL.createObjectURL(file);
  } catch {
    return "";
  }
}

export default function WeddingPersonalizeScene({
  title = "Personalize",
  subtitle = "Edit names, date, theme, and upload couple photos",
  onBack,
  onDone,

  backText = "Back",
  doneText = "Save",
}) {
  const { cfg, set } = useWeddingConfig();

  const [local, setLocal] = useState(() => ({
    theme: cfg.theme || "minimal",
    bride: cfg.names?.bride || "",
    groom: cfg.names?.groom || "",
    dateLine: cfg.dateLine || "",
    locationLine: cfg.locationLine || "",
    coverUrl: cfg.photos?.coverUrl || "",
    brideUrl: cfg.photos?.brideUrl || "",
    groomUrl: cfg.photos?.groomUrl || "",
  }));

  const coverInputRef = useRef(null);
  const brideInputRef = useRef(null);
  const groomInputRef = useRef(null);

  const themeLabel = useMemo(() => (local.theme === "retro" ? "Retro" : "Minimal"), [local.theme]);

  const update = (k) => (e) => setLocal((p) => ({ ...p, [k]: e.target.value }));

  const pickFile = (which, file) => {
    const url = readFileToObjectUrl(file);
    if (!url) return;
    setLocal((p) => ({ ...p, [which]: url }));
  };

  const save = () => {
    set({
      theme: local.theme,
      names: { bride: local.bride, groom: local.groom },
      dateLine: local.dateLine,
      locationLine: local.locationLine,
      photos: {
        coverUrl: local.coverUrl,
        brideUrl: local.brideUrl,
        groomUrl: local.groomUrl,
      },
    });
    onDone?.();
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          PERSONALIZE
        </div>

        <div className="mt-3 text-3xl font-semibold">{title}</div>
        {subtitle ? <div className="mt-2 text-sm text-neutral-600">{subtitle}</div> : null}

        <div
          className={cx(
            "mt-6 rounded-3xl border bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="p-6 sm:p-7 space-y-6">
            {/* Theme */}
            <section>
              <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">Theme</div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, theme: "minimal" }))}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium transition",
                    local.theme === "minimal" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                  )}
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                >
                  Minimal
                </button>
                <button
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, theme: "retro" }))}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-medium transition",
                    local.theme === "retro" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                  )}
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                >
                  Retro
                </button>

                <span className="text-sm text-neutral-600">
                  Current: <span className="font-semibold">{themeLabel}</span>
                </span>
              </div>
            </section>

            {/* Names */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bride Name">
                <input
                  value={local.bride}
                  onChange={update("bride")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  placeholder="Bride name"
                />
              </Field>
              <Field label="Groom Name">
                <input
                  value={local.groom}
                  onChange={update("groom")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  placeholder="Groom name"
                />
              </Field>
            </section>

            {/* Lines */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date Line">
                <input
                  value={local.dateLine}
                  onChange={update("dateLine")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  placeholder="Saturday • June 15, 2026 • 3:00 PM"
                />
              </Field>
              <Field label="Location Line">
                <input
                  value={local.locationLine}
                  onChange={update("locationLine")}
                  className="w-full px-4 py-3 rounded-2xl border outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  placeholder="Davao City • Philippines"
                />
              </Field>
            </section>

            {/* Photos */}
            <section className="space-y-3">
              <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">Photos</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PhotoCard
                  label="Cover Photo"
                  url={local.coverUrl}
                  onPick={() => coverInputRef.current?.click()}
                  onClear={() => setLocal((p) => ({ ...p, coverUrl: "" }))}
                />
                <PhotoCard
                  label="Bride Photo"
                  url={local.brideUrl}
                  circle
                  onPick={() => brideInputRef.current?.click()}
                  onClear={() => setLocal((p) => ({ ...p, brideUrl: "" }))}
                />
                <PhotoCard
                  label="Groom Photo"
                  url={local.groomUrl}
                  circle
                  onPick={() => groomInputRef.current?.click()}
                  onClear={() => setLocal((p) => ({ ...p, groomUrl: "" }))}
                />
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile("coverUrl", e.target.files?.[0])}
              />
              <input
                ref={brideInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile("brideUrl", e.target.files?.[0])}
              />
              <input
                ref={groomInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile("groomUrl", e.target.files?.[0])}
              />
            </section>
          </div>

          {/* actions */}
          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="text-sm text-neutral-700">
              Changes save locally for now (no account needed).
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
                onClick={save}
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
                {doneText}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs opacity-60">
          Next: we can swap object URLs to uploaded storage URLs (Supabase/S3) without changing scenes.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PhotoCard({ label, url, onPick, onClear, circle = false }) {
  return (
    <div className="rounded-3xl border p-4 bg-white" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
      <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">{label}</div>

      <div
        className={cx(
          "mt-3 border bg-neutral-100 overflow-hidden",
          circle ? "rounded-full aspect-square" : "rounded-2xl aspect-[16/10]"
        )}
        style={{ borderColor: "rgba(0,0,0,0.10)" }}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full grid place-items-center text-sm text-neutral-600">
            No image
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          className={cx(
            "px-4 py-2 rounded-full border text-sm font-medium",
            "hover:bg-neutral-50 active:translate-y-[1px] transition"
          )}
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Upload
        </button>

        <button
          type="button"
          onClick={onClear}
          className={cx(
            "px-4 py-2 rounded-full border text-sm font-medium",
            "hover:bg-neutral-50 active:translate-y-[1px] transition"
          )}
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
          disabled={!url}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
