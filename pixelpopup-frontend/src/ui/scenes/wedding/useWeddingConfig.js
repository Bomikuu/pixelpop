import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pp_wedding_config_v1";

const DEFAULTS = {
  theme: "minimal", // "minimal" | "retro"
  names: { bride: "Andrea", groom: "Mico" },
  dateLine: "Saturday • June 15, 2026 • 3:00 PM",
  locationLine: "Davao City • Philippines",

  photos: {
    coverUrl: "",
    brideUrl: "",
    groomUrl: "",
  },
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

function mergeDeep(base, patch) {
  const out = Array.isArray(base) ? [...base] : { ...(base || {}) };
  Object.keys(patch || {}).forEach((k) => {
    const bv = base?.[k];
    const pv = patch?.[k];
    if (pv && typeof pv === "object" && !Array.isArray(pv)) out[k] = mergeDeep(bv || {}, pv);
    else out[k] = pv;
  });
  return out;
}

export function useWeddingConfig() {
  const [cfg, setCfg] = useState(() => {
    if (typeof window === "undefined") return DEFAULTS;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return mergeDeep(DEFAULTS, safeParse(raw, {}));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }, [cfg]);

  const api = useMemo(() => {
    const set = (patch) => setCfg((prev) => mergeDeep(prev, patch));
    const reset = () => setCfg(DEFAULTS);
    return { cfg, set, reset };
  }, [cfg]);

  return api;
}
