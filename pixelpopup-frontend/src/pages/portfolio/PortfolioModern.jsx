import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import AboutSection from "./components/AboutSection";
import ActivitySection from "./components/ActivitySection";
import ArticlesCarouselSection from "./components/ArticlesCarouselSection";
import AstaSection from "./components/AstaSection";
import ContactSection from "./components/ContactSection";
import HeroSection from "./components/HeroSection";
import HireSection from "./components/HireSection";
import PortfolioFooter from "./components/PortfolioFooter";
import PortfolioNav from "./components/PortfolioNav";
import ProcessSection from "./components/ProcessSection";
import ProjectsSection from "./components/ProjectsSection";
import ServicesSection from "./components/ServicesSection";
import SignalsSection from "./components/SignalsSection";
import TechnologySection from "./components/TechnologySection";
import TimelineSection from "./components/TimelineSection";
import "./portfolioModern.css";

function usePortfolioDocument() {
  const { pathname } = useLocation();
  const pagePath = pathname === "/" ? "/" : "/portfolio";

  useLayoutEffect(() => {
    document.body.classList.add("portfolio-motion-ready");
    return () => document.body.classList.remove("portfolio-motion-ready");
  }, []);

  useEffect(() => {
    const title = "Mico Ang | Senior Frontend & Full-Stack Developer";
    const metadata = [
      ["name", "description", "Portfolio of Mico Ang, a senior frontend engineer, full-stack developer, and technical lead building clear, fast, maintainable products."],
      ["name", "keywords", "Mico Ang, senior frontend engineer, full-stack developer, React, Vue, Django, technical lead"],
      ["property", "og:type", "website"],
      ["property", "og:title", title],
      ["property", "og:description", "Portfolio of Mico Ang, a senior frontend engineer, full-stack developer, and technical lead building clear, fast, maintainable products."],
      ["property", "og:url", new URL(pagePath, window.location.origin).href],
      ["property", "og:image", new URL("/portfolio/assets/mico-ang-portrait.jpg", window.location.origin).href],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", "Portfolio of Mico Ang, a senior frontend engineer, full-stack developer, and technical lead building clear, fast, maintainable products."],
      ["name", "twitter:image", new URL("/portfolio/assets/mico-ang-portrait.jpg", window.location.origin).href],
    ];
    document.title = title;
    const elements = metadata.map(([attribute, key, content]) => {
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
      return element;
    });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = new URL(pagePath, window.location.origin).href;

    return () => {
      document.title = "PixelPopup";
      elements.forEach((element) => element.remove());
      canonical.remove();
    };
  }, [pagePath]);
}

export default function PortfolioModern() {
  usePortfolioDocument();

  return (
    <div className="modern-portfolio min-h-screen bg-[#f8fafc] text-slate-950">
      <a href="#main-content" className="fixed left-4 top-2 z-[60] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white focus-visible:translate-y-0">Skip to content</a>
      <PortfolioNav />
      <main id="main-content" tabIndex="-1">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <ServicesSection />
        <ProcessSection />
        <AstaSection />
        <TechnologySection />
        <TimelineSection />
        {/* <ActivitySection /> */}
        {/* <SignalsSection /> */}
        <ArticlesCarouselSection />
        <ContactSection compactHeading heading={<>Let’s build something <span className="text-[#2f5bff]">useful.</span></>} />
      </main>
      <PortfolioFooter />
    </div>
  );
}
