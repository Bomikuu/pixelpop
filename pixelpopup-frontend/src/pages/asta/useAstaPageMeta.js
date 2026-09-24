import { useEffect } from "react";

export default function useAstaPageMeta({ title, description, canonical }) {
  useEffect(() => {
    const previousTitle = document.title;
    const root = document.documentElement;
    const url = new URL(canonical, window.location.origin).href;
    const image = new URL("/portfolio/assets/asta-team-01.jpg", window.location.origin).href;
    const metadata = [
      ["name", "description", description],
      ["name", "keywords", `${title}, custom software development, web development`],
      ["property", "og:type", "website"],
      ["property", "og:title", title],
      ["property", "og:description", description],
      ["property", "og:url", url],
      ["property", "og:image", image],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", description],
      ["name", "twitter:image", image],
    ];
    const managed = metadata.map(([attribute, key, content]) => {
      const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
      const element = existing || document.createElement("meta");
      const previous = existing?.content;
      if (!existing) {
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
      return { element, existing, previous };
    });
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const canonicalLink = existingCanonical || document.createElement("link");
    const previousCanonical = existingCanonical?.getAttribute("href");
    if (!existingCanonical) {
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }

    document.title = title;
    canonicalLink.href = url;
    root.classList.add("asta-motion-ready");

    return () => {
      document.title = previousTitle;
      managed.forEach(({ element, existing, previous }) => {
        if (existing) element.content = previous || "";
        else element.remove();
      });
      if (existingCanonical) canonicalLink.setAttribute("href", previousCanonical || "");
      else canonicalLink.remove();
      root.classList.remove("asta-motion-ready");
    };
  }, [canonical, description, title]);
}
