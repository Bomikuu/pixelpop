import { useEffect } from "react";

export default function useAstaPageMeta({ title, description, canonical }) {
  useEffect(() => {
    const previousTitle = document.title;
    const root = document.documentElement;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const previousDescription = descriptionMeta?.getAttribute("content");
    const previousCanonical = canonicalLink?.getAttribute("href");

    document.title = title;
    descriptionMeta?.setAttribute("content", description);
    canonicalLink?.setAttribute("href", canonical);
    root.classList.add("asta-motion-ready");

    return () => {
      document.title = previousTitle;
      if (previousDescription) descriptionMeta?.setAttribute("content", previousDescription);
      if (previousCanonical) canonicalLink?.setAttribute("href", previousCanonical);
      root.classList.remove("asta-motion-ready");
    };
  }, [canonical, description, title]);
}
