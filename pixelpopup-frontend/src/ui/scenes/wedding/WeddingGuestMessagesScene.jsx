import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useWeddingConfig } from "./useWeddingConfig";

const cx = (...c) => c.filter(Boolean).join(" ");

// ---- ENV TOKEN (supports Vite + CRA/Next-style) ----
function getMapboxToken() {
  const vite = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const t1 =
    vite?.VITE_MAPBOX_TOKEN ||
    vite?.VITE_MAPBOX_API_KEY ||
    vite?.VITE_MAPBOX_ACCESS_TOKEN;

  const t2 =
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.REACT_APP_MAPBOX_TOKEN ||
        process.env.MAPBOX_API_KEY ||
        process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ||
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)) ||
    undefined;

  return t1 || t2 || "";
}

function safeInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "G";
}

function initialsSvgDataUrl(initials, opts = {}) {
  const bg = opts.bg || "#111827";
  const fg = opts.fg || "#F9FAFB";
  const stroke = opts.stroke || "rgba(0,0,0,0.18)";
  const text = String(initials || "G").slice(0, 2).toUpperCase();

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <rect x="2" y="2" width="60" height="60" fill="${bg}" stroke="${stroke}" stroke-width="2"/>
    <text x="32" y="40" text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      font-size="22" font-weight="800" fill="${fg}">
      ${text}
    </text>
  </svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createAvatarMarkerEl({ src, label }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label || "Guest marker");

  // NO rounded corners
  btn.style.width = "44px";
  btn.style.height = "44px";
  btn.style.borderRadius = "0px";
  btn.style.border = "1px solid rgba(0,0,0,0.18)";
  btn.style.background = "#fff";
  btn.style.boxShadow = "0 10px 22px rgba(0,0,0,0.10)";
  btn.style.cursor = "pointer";
  btn.style.overflow = "hidden";
  btn.style.padding = "0";
  btn.style.display = "grid";
  btn.style.placeItems = "center";

  const img = document.createElement("img");
  img.src = src;
  img.alt = label || "Guest";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.display = "block";

  btn.appendChild(img);
  return btn;
}

export default function WeddingGuestMessagesScene({
  title = "Guest Messages",
  subtitle = "Video greetings from friends abroad",

  // [{ id, from, country, note, videoUrl, posterUrl, avatarUrl, lng, lat }]
  messages = null,

  primaryText = "Back to Details",
  secondaryText = "RSVP",

  onPrimary,
  onSecondary,
}) {
  const { cfg } = useWeddingConfig();

  const token = useMemo(() => getMapboxToken(), []);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef(new Map());

  const [active, setActive] = useState(null); // for video modal
  const [selected, setSelected] = useState(null); // for popup

  // Minimal wedding theme tokens (no retro)
  const tokens = {
    border: "rgba(0,0,0,0.10)",
    panelBg: "rgba(255,255,255,0.96)",
    text: "#111827",
    subtext: "rgba(17,24,39,0.72)",
    primaryBg: "linear-gradient(135deg, #C9A76A, #E6D2A8)",
    primaryText: "#231F20",
  };

  const list = useMemo(() => {
    if (Array.isArray(messages) && messages.length) return messages;

    // fallback sample (WITH coords)
    return [
      {
        id: "msg1",
        from: "Aira",
        country: "Japan 🇯🇵",
        note: "Congrats! We’re celebrating with you from afar 💛",
        videoUrl: "/messages/aira.mp4",
        posterUrl: "/messages/aira.jpg",
        lng: 139.6917,
        lat: 35.6895,
      },
      {
        id: "msg2",
        from: "Ken",
        country: "Canada 🇨🇦",
        note: "So happy for you both! See you soon!",
        videoUrl: "/messages/ken.mp4",
        posterUrl: "/messages/ken.jpg",
        lng: -79.3832,
        lat: 43.6532,
      },
      {
        id: "msg3",
        from: "Lia",
        country: "UAE 🇦🇪",
        note: "Love you guys. Wishing you a beautiful life together.",
        videoUrl: "/messages/lia.mp4",
        posterUrl: "/messages/lia.jpg",
        lng: 55.2708,
        lat: 25.2048,
      },
    ];
  }, [messages]);

  const places = useMemo(() => {
    return (list || [])
      .map((m, i) => {
        const id = m.id ?? String(i);
        const from = m.from ?? "Guest";
        const initials = safeInitials(from);

        const avatar =
          m.avatarUrl || m.posterUrl || initialsSvgDataUrl(initials);

        return {
          ...m,
          id,
          from,
          avatar,
          lng: Number(m.lng),
          lat: Number(m.lat),
        };
      })
      .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
  }, [list]);

  const initialCenter = useMemo(() => {
    if (places.length) return [places[0].lng, places[0].lat];
    return [121.0244, 14.5547];
  }, [places]);

  // ---- init map ----
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!token) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11", // minimal
      center: initialCenter,
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
    });

    mapRef.current = map;

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("click", () => {
      setSelected(null);
    });

    const t = setTimeout(() => {
      try {
        map.resize();
      } catch {}
    }, 80);

    return () => {
      clearTimeout(t);
      try {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
      } catch {}
      try {
        map.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [token, initialCenter]);

  // ---- sync markers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // remove old
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {}
    });
    markersRef.current.clear();

    // add new
    places.forEach((p) => {
      const el = createAvatarMarkerEl({
        src: p.avatar,
        label: p.from,
      });

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(p);

        try {
          map.easeTo({
            center: [p.lng, p.lat],
            zoom: Math.max(map.getZoom(), 3),
            duration: 650,
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });
        } catch {}
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);

      markersRef.current.set(p.id, marker);
    });

    // fit bounds if many
    if (places.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.lng, p.lat]));
      try {
        map.fitBounds(bounds, { padding: 60, duration: 700 });
      } catch {}
    }
  }, [places]);

  const mapReady = Boolean(token);

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="text-xs tracking-[0.35em] uppercase opacity-70">
          {cfg?.names?.bride || "Bride"} & {cfg?.names?.groom || "Groom"}
        </div>

        <div className="mt-3 text-3xl font-semibold" style={{ color: tokens.text }}>
          {title}
        </div>
        {subtitle ? (
          <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
            {subtitle}
          </div>
        ) : null}

        <div
          className={cx(
            "mt-6 border overflow-hidden",
            "shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          )}
          style={{ borderColor: tokens.border, background: tokens.panelBg }}
        >
          {/* MAP (no rounded corners) */}
          <div className="relative h-full min-h-[520px] w-full">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {!mapReady ? (
              <div className="absolute inset-0 grid place-items-center p-6">
                <div
                  className="border p-4 max-w-lg text-center bg-white"
                  style={{ borderColor: tokens.border }}
                >
                  <div className="text-sm font-semibold">Mapbox token missing</div>
                  <div className="mt-2 text-xs opacity-80">
                    Set <span className="font-semibold">VITE_MAPBOX_TOKEN</span> (or REACT_APP_MAPBOX_TOKEN /
                    NEXT_PUBLIC_MAPBOX_TOKEN) then restart dev.
                  </div>
                </div>
              </div>
            ) : null}

            {/* Minimal popup (square, no rounded) */}
            {selected ? (
              <div className="absolute left-4 right-4 bottom-4 pointer-events-none flex justify-center">
                <div className="w-full max-w-[560px] pointer-events-auto">
                  <div className="border bg-white" style={{ borderColor: tokens.border }}>
                    <div
                      className="px-4 py-3 border-b flex items-center justify-between"
                      style={{ borderColor: tokens.border }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{selected.from}</div>
                        <div className="text-xs opacity-70 truncate">{selected.country || "—"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="px-3 py-2 border text-sm"
                        style={{ borderColor: tokens.border }}
                      >
                        Close
                      </button>
                    </div>

                    <div className="p-4">
                      {selected.note ? (
                        <div className="text-sm text-neutral-700">{selected.note}</div>
                      ) : (
                        <div className="text-sm text-neutral-700">—</div>
                      )}

                      <div className="mt-4 flex items-center justify-end gap-2">
                        {selected.videoUrl ? (
                          <button
                            type="button"
                            onClick={() => setActive(selected)}
                            className="px-4 py-2 text-sm font-semibold border"
                            style={{
                              borderColor: tokens.border,
                              background: tokens.primaryBg,
                              color: tokens.primaryText,
                            }}
                          >
                            Play Video
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="px-6 sm:px-7 py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
            style={{ borderColor: tokens.border }}
          >
            <div className="text-sm" style={{ color: tokens.subtext }}>
              Tap a marker to open a message.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrimary}
                className={cx(
                  "px-4 py-2 border text-sm font-medium",
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
                  "px-5 py-2 text-sm font-semibold",
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
      </div>

      {/* Video modal */}
      {active ? (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl border overflow-hidden bg-white" style={{ borderColor: tokens.border }}>
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: tokens.border }}
            >
              <div>
                <div className="text-sm font-semibold">{active.from}</div>
                <div className="text-xs opacity-70">{active.country}</div>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="px-3 py-2 border text-sm"
                style={{ borderColor: tokens.border }}
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="border overflow-hidden" style={{ borderColor: tokens.border }}>
                <video
                  src={active.videoUrl}
                  className="w-full max-h-[60vh] object-cover bg-black"
                  controls
                  autoPlay
                />
              </div>
              {active.note ? <div className="mt-3 text-sm text-neutral-700">{active.note}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
