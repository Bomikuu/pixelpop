import { useEffect, useLayoutEffect } from "react";
import PortfolioFooter from "../components/PortfolioFooter";
import PortfolioNav from "../components/PortfolioNav";
import "../portfolioModern.css";

export default function ApplicationPageShell({ title, description, canonicalPath, children }) {
  useLayoutEffect(() => {
    document.body.classList.add("portfolio-motion-ready");
    return () => document.body.classList.remove("portfolio-motion-ready");
  }, []);

  useEffect(() => {
    const documentTitle = `${title} | Mico Ang`;
    const previousTitle = document.title;
    const metadata = [
      ["name", "description", description],
      ["property", "og:type", "website"],
      ["property", "og:title", documentTitle],
      ["property", "og:description", description],
      ["property", "og:url", canonicalPath],
      ["property", "og:image", "/portfolio/assets/mico-ang-portrait.jpg"],
    ];
    const managedElements = metadata.map(([attribute, key, content]) => {
      const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
      const element = existing || document.createElement("meta");
      const previousContent = existing?.content;
      if (!existing) {
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
      return { element, created: !existing, previousContent };
    });
    const existingCanonical = document.head.querySelector('link[rel="canonical"]');
    const canonical = existingCanonical || document.createElement("link");
    const previousCanonical = existingCanonical?.href;
    if (!existingCanonical) {
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalPath;
    document.title = documentTitle;

    return () => {
      document.title = previousTitle;
      managedElements.forEach(({ element, created, previousContent }) => {
        if (created) element.remove();
        else element.content = previousContent || "";
      });
      if (existingCanonical) canonical.href = previousCanonical;
      else canonical.remove();
    };
  }, [canonicalPath, description, title]);

  return (
    <div className="modern-portfolio min-h-screen bg-[#f8fafc] text-slate-950">
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[60] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <PortfolioNav routeBase="/portfolio" />
      <main id="main-content" tabIndex="-1">
        {children}
      </main>
      <PortfolioFooter routeBase="/portfolio" />
    </div>
  );
}
