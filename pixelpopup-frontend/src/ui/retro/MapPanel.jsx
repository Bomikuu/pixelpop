import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import RetroPanel from "./Panel";
import RetroButton from "./Button";

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

/**
 * MapPanel (Retro + Mapbox)
 *
 * places: [{
 *   id, title, subtitle, description,
 *   lng, lat,
 *   emoji?: "💖",
 *   iconUrl?: "/stickers/heart.png",
 *   mediaUrl, mediaType: "image"|"video",
 *   badge, color: { pinBg, pinBorder, listBg }, actions: [{ label, kind, onClick, disabled }]
 * }]
 *
 * routes: [{
 *   id,
 *   points: [[lng,lat],[lng,lat],...],
 *   color?, width?, dash?
 * }]
 */
export default function MapPanel({
  // Panel
  title = "MAP",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Layout
  dense = false,
  mapMinHeightClass = "min-h-[420px]",
  mapHeightClass, // optional e.g. "h-[720px]"
  mapHeightStyle, // optional { height: 720 }

  // Sidebar INSIDE map
  showSidebar = false, // optional
  sidebarDock = "left", // "left" | "right"
  sidebarTitle = "PLACES",
  sidebarWidthClass = "w-[280px]",
  sidebarMaxHeightClass = "max-h-[320px]",
  sidebarCollapsed = false, // initial collapsed state

  split = "35/65", // kept for backward compat (unused now)

  // Mapbox
  mapStyle = "mapbox://styles/mapbox/dark-v11",
  initialZoom = 12,
  minZoom = 2,
  maxZoom = 18,
  fitBoundsPadding = 60,
  center, // optional { lng, lat }
  zoom, // optional number

  // Places + Routes
  places = [],
  routes = [],
  defaultSelectedId,
  onSelect, // (place) => void

  // Popup
  showPopup = true,
  showPopupOnInit = false,
  popupTitle = "LOCATION",
  mediaAspectClass = "aspect-video",

  // Retro pins tokens
  pinBorder = "var(--pp-border)",
  pinBg = "var(--pp-accent)",
  pinShadow = "var(--pp-shadow)",
  activePinBg = "var(--pp-accent-2)",

  // Sidebar tokens
  listItemBg = "rgba(255,255,255,0.92)",
  listItemBorder = "var(--pp-border)",
  listItemShadow = "var(--pp-shadow)",

  // Retro popup tokens
  popupBg = "rgba(255,255,255,0.95)",
  popupBorder = "var(--pp-border)",
  popupShadow = "var(--pp-shadow)",

  // Retro map look
  retroMapFilter = "contrast(1.12) saturate(0.85) hue-rotate(-8deg)",

  // Special effects
  crt = true,
  vhs = true,

  // Controls (retro)
  controls = true,

  // NEW (engine wiring)
  engine,
  vars,
}) {
  const padding = dense ? "p-3" : "p-4";
  const token = useMemo(() => getMapboxToken(), []);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const resizeObsRef = useRef(null);

  const normalized = useMemo(() => {
    return (places || [])
      .map((p, i) => ({
        id: p.id ?? String(i),
        title: p.title ?? `Place ${i + 1}`,
        subtitle: p.subtitle,
        description: p.description,
        lng: Number(p.lng),
        lat: Number(p.lat),
        emoji: p.emoji,
        iconUrl: p.iconUrl,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType || "image",
        badge: p.badge,
        color: p.color || {}, // { pinBg, pinBorder, listBg }
        actions: p.actions || [],
      }))
      .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat));
  }, [places]);

  const initialSelected = useMemo(() => {
    if (defaultSelectedId && normalized.some((p) => p.id === defaultSelectedId)) return defaultSelectedId;
    return normalized[0]?.id ?? null;
  }, [defaultSelectedId, normalized]);

  const [selectedId, setSelectedId] = useState(() => initialSelected);
  const [popupOpen, setPopupOpen] = useState(() => Boolean(showPopupOnInit) && Boolean(initialSelected));
  const [sidebarOpen, setSidebarOpen] = useState(() => (showSidebar ? !sidebarCollapsed : false));

  // when showSidebar toggles, keep sidebarOpen sensible
  useEffect(() => {
    if (!showSidebar) {
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen((prev) => (prev === false && sidebarCollapsed === false ? true : prev));
  }, [showSidebar, sidebarCollapsed]);

  // keep selection valid when places change
  useEffect(() => {
    if (!normalized.length) {
      setSelectedId(null);
      setPopupOpen(false);
      return;
    }
    if (selectedId && normalized.some((p) => p.id === selectedId)) return;

    setSelectedId(initialSelected);
    setPopupOpen(Boolean(showPopupOnInit) && Boolean(initialSelected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, initialSelected, showPopupOnInit]);

  const selected = useMemo(
    () => normalized.find((p) => p.id === selectedId) || null,
    [normalized, selectedId]
  );

  const emitSelect = (p) => {
    try {
      onSelect?.(p);
    } catch {}
    if (engine?.emit) {
      const id = String(p?.id ?? "unknown");
      engine.emit(`select:${id}`, p);
      engine.emit("select", { id, raw: p });
    }
  };

  const runAction = (a, place) => {
    try {
      a.onClick?.(place, { engine, vars });
    } catch {}

    if (engine?.emit) {
      if (a?.event) {
        engine.emit(String(a.event), { action: a, place });
      } else if (a?.to) {
        engine.emit(`to:${String(a.to)}`, { action: a, place });
      }
    }
  };

  const pick = (p) => {
    setSelectedId(p.id);
    setPopupOpen(true);
    emitSelect(p);

    const map = mapRef.current;
    if (map && p) {
      map.easeTo({
        center: [p.lng, p.lat],
        duration: 650,
        zoom: Math.max(map.getZoom(), 13),
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }
  };

  const closePopup = () => setPopupOpen(false);

  const focusSelected = () => {
    const map = mapRef.current;
    if (map && selected) {
      map.easeTo({
        center: [selected.lng, selected.lat],
        duration: 650,
        zoom: Math.max(map.getZoom(), 14),
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }
  };

  const initialCenter = useMemo(() => {
    if (center && Number.isFinite(center.lng) && Number.isFinite(center.lat)) {
      return [center.lng, center.lat];
    }
    if (normalized.length) return [normalized[0].lng, normalized[0].lat];
    return [121.0244, 14.5547];
  }, [center, normalized]);

  // ---- Init Mapbox map ----
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: Number.isFinite(zoom) ? zoom : initialZoom,
      minZoom,
      maxZoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("click", () => {
      setPopupOpen(false);
    });

    // Resize map when container size changes
    try {
      resizeObsRef.current = new ResizeObserver(() => {
        try {
          map.resize();
        } catch {}
      });
      resizeObsRef.current.observe(mapContainerRef.current);
    } catch {}

    const t = setTimeout(() => {
      try {
        map.resize();
      } catch {}
    }, 80);

    return () => {
      clearTimeout(t);

      try {
        resizeObsRef.current?.disconnect?.();
      } catch {}
      resizeObsRef.current = null;

      try {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
      } catch {}

      try {
        map.remove();
      } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mapStyle]);

  // Force resize when layout props change (sidebar open/close or height changes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => {
      try {
        map.resize();
      } catch {}
    }, 60);
    return () => clearTimeout(t);
  }, [sidebarOpen, showSidebar, mapMinHeightClass, mapHeightClass, mapHeightStyle]);

  // ---- Fit bounds when places change (if no explicit center/zoom) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (center || Number.isFinite(zoom)) return;
    if (normalized.length < 2) return;

    const fit = () => {
      const bounds = new mapboxgl.LngLatBounds();
      normalized.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: fitBoundsPadding, duration: 700 });
    };

    if (map.isStyleLoaded()) fit();
    else map.once("load", fit);
  }, [normalized, center, zoom, fitBoundsPadding]);

  // ---- Sync markers (emoji/img support) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const ids = new Set(normalized.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    normalized.forEach((p) => {
      const existing = markersRef.current.get(p.id);
      if (existing) {
        existing.remove();
        markersRef.current.delete(p.id);
      }

      const active = p.id === selectedId;

      const el = createRetroPinElement({
        active,
        pinBg: p.color?.pinBg ?? (active ? activePinBg : pinBg),
        pinBorder: p.color?.pinBorder ?? pinBorder,
        pinShadow,
        emoji: p.emoji,
        iconUrl: p.iconUrl,
      });

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pick(p);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);

      markersRef.current.set(p.id, marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, selectedId, pinBg, pinBorder, pinShadow, activePinBg]);

  // ---- Routes: dashed line + dotted breadcrumb points ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const cleanup = () => {
      (routes || []).forEach((r) => {
        if (!r?.id) return;
        const sid = `route-${r.id}`;
        const lineId = `route-line-${r.id}`;
        const dotsId = `route-dots-${r.id}`;

        if (map.getLayer(dotsId)) map.removeLayer(dotsId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(sid)) map.removeSource(sid);
      });
    };

    const add = () => {
      cleanup();

      (routes || []).forEach((r) => {
        if (!r?.id) return;
        const coords = Array.isArray(r.points) ? r.points : [];
        if (coords.length < 2) return;

        const sid = `route-${r.id}`;
        const lineId = `route-line-${r.id}`;
        const dotsId = `route-dots-${r.id}`;

        const dotFeatures = coords
          .filter((c) => Array.isArray(c) && c.length >= 2)
          .map((c, i) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: c },
            properties: { i },
          }));

        map.addSource(sid, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: coords },
                properties: {},
              },
              ...dotFeatures,
            ],
          },
        });

        map.addLayer({
          id: lineId,
          type: "line",
          source: sid,
          filter: ["==", ["geometry-type"], "LineString"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": r.color || "rgba(255,255,255,0.85)",
            "line-width": r.width || 3,
            "line-dasharray": r.dash || [1, 2],
            "line-opacity": 0.95,
          },
        });

        map.addLayer({
          id: dotsId,
          type: "circle",
          source: sid,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 3,
            "circle-color": "rgba(15,23,42,0.75)",
            "circle-stroke-color": "rgba(255,255,255,0.9)",
            "circle-stroke-width": 2,
            "circle-opacity": 0.95,
          },
        });
      });
    };

    if (map.isStyleLoaded()) add();
    else map.once("load", add);

    return () => {
      try {
        cleanup();
      } catch {}
    };
  }, [routes]);

  const mapReady = Boolean(token);

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + 1, duration: 220 });
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() - 1, duration: 220 });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;

    if (center && Number.isFinite(center.lng) && Number.isFinite(center.lat)) {
      map.easeTo({
        center: [center.lng, center.lat],
        zoom: Number.isFinite(zoom) ? zoom : initialZoom,
        duration: 450,
      });
      return;
    }

    if (normalized.length >= 2 && !Number.isFinite(zoom)) {
      const bounds = new mapboxgl.LngLatBounds();
      normalized.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: fitBoundsPadding, duration: 650 });
      return;
    }

    map.easeTo({
      center: initialCenter,
      zoom: Number.isFinite(zoom) ? zoom : initialZoom,
      duration: 450,
    });
  };

  const sidebarDockClass = sidebarDock === "right" ? "right-3" : "left-3";

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className={padding}>
        <div
          className={cx(
            "border-[3px] rounded-2xl overflow-hidden relative",
            mapMinHeightClass,
            mapHeightClass
          )}
          style={{
            borderColor: "var(--pp-border)",
            boxShadow: "var(--pp-shadow)",
            background: "rgba(255,255,255,0.7)",
            ...(mapHeightStyle || {}),
          }}
        >
          {/* Map container */}
          <div className="absolute inset-0 h-full" style={{ filter: retroMapFilter }}>
            <div ref={mapContainerRef} className="absolute inset-0 h-full" />
          </div>

          {/* Sidebar overlay (inside the map) */}
          {showSidebar ? (
            <div className={cx("absolute top-3 pointer-events-none", sidebarDockClass)}>
              <div className="pointer-events-auto">
                {sidebarOpen ? (
                  <div
                    className={cx(
                      "border-[3px] rounded-2xl overflow-hidden",
                      sidebarWidthClass
                    )}
                    style={{
                      borderColor: "var(--pp-border)",
                      boxShadow: "var(--pp-shadow)",
                      background: "rgba(255,255,255,0.92)",
                    }}
                  >
                    <div
                      className="px-3 py-2 border-b-[3px] flex items-center justify-between gap-2"
                      style={{ borderColor: "var(--pp-border)" }}
                    >
                      <div className="font-pp font-extrabold text-xs">
                        {sidebarTitle}
                      </div>
                      <RetroButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setSidebarOpen(false)}
                        className="!px-3 !py-2"
                        title="Collapse"
                      >
                        —
                      </RetroButton>
                    </div>

                    <div className={cx("p-3 overflow-auto", sidebarMaxHeightClass)}>
                      <div className="space-y-3">
                        {normalized.map((p) => {
                          const active = p.id === selectedId;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => pick(p)}
                              className={cx(
                                "w-full text-left border-[3px] rounded-xl overflow-hidden",
                                "transition-transform",
                                "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                              )}
                              style={{
                                background: p.color?.listBg ?? listItemBg,
                                borderColor: listItemBorder,
                                boxShadow: listItemShadow,
                                outline: active ? "3px solid rgba(255,255,255,0.7)" : "none",
                              }}
                            >
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-pp font-extrabold text-sm truncate">
                                      {p.title}
                                    </div>
                                    {p.subtitle ? (
                                      <div className="mt-1 font-pp text-xs opacity-80">
                                        {p.subtitle}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    {p.badge ? (
                                      <span
                                        className="font-pp text-[10px] font-extrabold px-2 py-1 border-[3px] rounded-lg"
                                        style={{
                                          borderColor: "var(--pp-border)",
                                          boxShadow: "var(--pp-shadow)",
                                          background: "rgba(255,255,255,0.75)",
                                        }}
                                      >
                                        {p.badge}
                                      </span>
                                    ) : null}

                                    <span
                                      className="h-6 w-6 rounded-full border-[3px] grid place-items-center"
                                      style={{
                                        background: active
                                          ? p.color?.pinBg ?? activePinBg
                                          : p.color?.pinBg ?? pinBg,
                                        borderColor: p.color?.pinBorder ?? pinBorder,
                                        boxShadow: pinShadow,
                                      }}
                                      title="Pin"
                                    >
                                      <span className="font-pp text-[10px] font-black">
                                        {p.iconUrl ? "IMG" : p.emoji || "•"}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}

                        {!normalized.length ? (
                          <div className="font-pp text-sm font-extrabold opacity-80">
                            No places yet.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <RetroButton
                    size="sm"
                    variant="secondary"
                    onClick={() => setSidebarOpen(true)}
                    className="!px-3 !py-2"
                    title="Open places"
                  >
                    {sidebarTitle}
                  </RetroButton>
                )}
              </div>
            </div>
          ) : null}

          {/* Retro controls overlay */}
          {controls ? (
            <div className="absolute top-3 right-3 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2">
                <RetroButton size="sm" variant="secondary" onClick={zoomIn} className="!px-3 !py-2">
                  +
                </RetroButton>
                <RetroButton size="sm" variant="secondary" onClick={zoomOut} className="!px-3 !py-2">
                  −
                </RetroButton>
                <RetroButton size="sm" variant="secondary" onClick={resetView} className="!px-3 !py-2">
                  Reset
                </RetroButton>
              </div>
            </div>
          ) : null}

          {/* Special effects overlays */}
          {crt ? <CrtScanlines /> : null}
          {vhs ? <VhsJitter /> : null}

          {/* If token missing */}
          {!mapReady ? (
            <div className="absolute inset-0 grid place-items-center p-6">
              <div
                className="border-[3px] rounded-2xl p-4 max-w-lg text-center"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  borderColor: "var(--pp-border)",
                  boxShadow: "var(--pp-shadow)",
                }}
              >
                <div className="font-pp font-extrabold text-sm">Mapbox token missing</div>
                <div className="mt-2 font-pp text-xs opacity-80">
                  Set <span className="font-extrabold">VITE_MAPBOX_TOKEN</span> (or REACT_APP_MAPBOX_TOKEN /
                  NEXT_PUBLIC_MAPBOX_TOKEN) in your environment, then restart dev.
                </div>
              </div>
            </div>
          ) : null}

          {/* Popup card */}
          {showPopup && popupOpen && selected ? (
            <div className="absolute left-3 right-3 bottom-3 pointer-events-none flex justify-center">
              <div className="w-full max-w-[520px] pointer-events-auto">
                <div
                  className="border-[3px] rounded-2xl overflow-hidden"
                  style={{
                    borderColor: popupBorder,
                    boxShadow: popupShadow,
                    background: popupBg,
                  }}
                >
                  <div
                    className="px-3 py-2 border-b-[3px] flex items-center justify-between gap-2"
                    style={{ borderColor: popupBorder }}
                  >
                    <div className="font-pp font-extrabold text-xs">{popupTitle}</div>

                    <div className="flex items-center gap-2">
                      <div className="font-pp text-[10px] opacity-70">
                        {selected.badge || selected.subtitle || ""}
                      </div>
                      <RetroButton
                        size="sm"
                        variant="secondary"
                        onClick={closePopup}
                        className="!px-3 !py-2"
                        title="Close"
                      >
                        ✕
                      </RetroButton>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-pp font-extrabold text-sm truncate">{selected.title}</div>
                        {selected.subtitle ? (
                          <div className="mt-1 font-pp text-xs opacity-80">{selected.subtitle}</div>
                        ) : null}
                      </div>

                      <RetroButton variant="secondary" size="sm" onClick={focusSelected} className="!px-3 !py-2">
                        Focus
                      </RetroButton>
                    </div>

                    {selected.description ? (
                      <div className="mt-2 font-pp text-xs opacity-85">{selected.description}</div>
                    ) : null}

                    {selected.mediaUrl ? (
                      <div
                        className={cx(
                          "mt-3 w-full border-[3px] rounded-xl overflow-hidden",
                          mediaAspectClass,
                          "max-h-[180px]"
                        )}
                        style={{
                          borderColor: popupBorder,
                          boxShadow: popupShadow,
                          background: "rgba(255,255,255,0.7)",
                        }}
                      >
                        {selected.mediaType === "video" ? (
                          <video src={selected.mediaUrl} className="h-full w-full object-cover" controls />
                        ) : (
                          <img
                            src={selected.mediaUrl}
                            alt={selected.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ) : null}

                    {selected.actions?.length ? (
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        {selected.actions.map((a, i) => (
                          <RetroButton
                            key={a.label || i}
                            variant={a.kind || "secondary"}
                            size="sm"
                            onClick={() => runAction(a, selected)}
                            disabled={Boolean(a.disabled)}
                            className="!px-3 !py-2"
                          >
                            {a.label}
                          </RetroButton>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-2 font-pp text-[11px] opacity-70">
          * Click pins to open the retro popup. Click map to close.
        </div>
      </div>
    </RetroPanel>
  );
}

// ---- Retro Pin Element (DOM) ----
function createRetroPinElement({ active, pinBg, pinBorder, pinShadow, emoji, iconUrl }) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", active ? "Selected place" : "Place");

  el.style.width = "42px";
  el.style.height = "42px";
  el.style.borderRadius = "9999px";
  el.style.border = "3px solid";
  el.style.borderColor = pinBorder;
  el.style.background = pinBg;
  el.style.boxShadow = pinShadow;
  el.style.display = "grid";
  el.style.placeItems = "center";
  el.style.cursor = "pointer";
  el.style.userSelect = "none";

  if (active) {
    el.style.outline = "3px solid rgba(255,255,255,0.7)";
    el.style.outlineOffset = "2px";
  }

  const inner = document.createElement("div");
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "grid";
  inner.style.placeItems = "center";

  if (iconUrl) {
    const img = document.createElement("img");
    img.src = iconUrl;
    img.alt = "marker";
    img.style.width = "22px";
    img.style.height = "22px";
    img.style.objectFit = "contain";
    img.style.imageRendering = "pixelated";
    inner.appendChild(img);
  } else {
    const glyph = document.createElement("span");
    glyph.textContent = emoji || (active ? "★" : "•");
    glyph.style.fontFamily = "inherit";
    glyph.style.fontWeight = "900";
    glyph.style.fontSize = emoji ? "16px" : "14px";
    glyph.style.color = "rgba(15,23,42,0.9)";
    inner.appendChild(glyph);
  }

  el.appendChild(inner);
  return el;
}

// ---- Special Effects ----
function CrtScanlines() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-70">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, rgba(255,255,255,0.0) 2px, rgba(255,255,255,0.0) 5px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0.30) 100%)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

function VhsJitter() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-40">
      <div className="absolute inset-0 vhs-jitter-layer" />
      <style>{`
        @keyframes vhsJitter {
          0% { transform: translate3d(0,0,0); filter: hue-rotate(0deg); }
          12% { transform: translate3d(-1px,0,0); filter: hue-rotate(2deg); }
          25% { transform: translate3d(1px,0,0); filter: hue-rotate(-2deg); }
          40% { transform: translate3d(0,-1px,0); filter: hue-rotate(1deg); }
          55% { transform: translate3d(0,1px,0); filter: hue-rotate(-1deg); }
          70% { transform: translate3d(-1px,1px,0); filter: hue-rotate(2deg); }
          85% { transform: translate3d(1px,-1px,0); filter: hue-rotate(-2deg); }
          100% { transform: translate3d(0,0,0); filter: hue-rotate(0deg); }
        }
        .vhs-jitter-layer {
          animation: vhsJitter 1.8s infinite steps(1);
          background-image:
            linear-gradient(to right, rgba(255,0,0,0.06), rgba(0,255,255,0.06)),
            repeating-linear-gradient(to bottom,
              rgba(255,255,255,0.00) 0px,
              rgba(255,255,255,0.00) 8px,
              rgba(0,0,0,0.05) 9px,
              rgba(255,255,255,0.00) 12px
            );
          mix-blend-mode: screen;
        }
      `}</style>
    </div>
  );
}
