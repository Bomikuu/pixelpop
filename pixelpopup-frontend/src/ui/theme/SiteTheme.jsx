import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const storageKey = "pixelpop-color-theme";
const SiteThemeContext = createContext(null);

function readPreference() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* The theme still works when browser storage is unavailable. */ }
  return "system";
}

export function SiteThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const mode = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => setSystemDark(media.matches);
    const onStorageChange = (event) => {
      if (event.key === storageKey || event.key === null) setPreference(readPreference());
    };
    onSystemChange();
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.siteTheme = mode;
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    toggle() {
      const next = mode === "dark" ? "light" : "dark";
      setPreference(next);
      try { localStorage.setItem(storageKey, next); }
      catch { /* Preserve the in-memory preference for this visit. */ }
    },
  }), [mode]);

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>;
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}

// Set the scope on the document so Radix portals share the active page theme.
// Authored invitation/demo experiences retain their own palettes.
export function SiteThemeRoute() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pathname === "/" || /^\/portfolio(?:\/|$)/.test(pathname)) root.dataset.siteSurface = "portfolio";
    else if (/^\/(?:dashboard|business|quick-entry|shared-bills|documents\/share)(?:\/|$)/.test(pathname)) root.dataset.siteSurface = "workspace";
    else delete root.dataset.siteSurface;
    return () => { delete root.dataset.siteSurface; };
  }, [pathname]);
  return null;
}
