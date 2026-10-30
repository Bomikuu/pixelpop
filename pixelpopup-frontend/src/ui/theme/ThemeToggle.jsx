import { Moon, Sun } from "lucide-react";
import { useSiteTheme } from "./SiteTheme";

export default function ThemeToggle({ className = "" }) {
  const { mode, toggle } = useSiteTheme();
  const dark = mode === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      className={`site-theme-toggle ${className}`}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  );
}
