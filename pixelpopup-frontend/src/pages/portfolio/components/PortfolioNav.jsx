import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import {
  getPortfolioServiceHref,
  portfolioServiceCatalog,
} from "../services/portfolioServices";
import LogoMark from "./LogoMark";

const navItems = [
  ["Work", "#work"],
  ["About", "#about"],
  ["ASTA", "#asta"],
  ["Stack", "#stack"],
  ["Contact", "#contact"],
];

const dropdownServices = [
  ...portfolioServiceCatalog.filter((service) => service.featured),
  ...portfolioServiceCatalog.filter((service) => !service.featured),
].slice(0, 4);

export default function PortfolioNav({ routeBase = "" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const navRef = useRef(null);

  const closeNavigation = () => {
    setMenuOpen(false);
    setServicesOpen(false);
  };

  useEffect(() => {
    let frameId = 0;
    const update = () => {
      frameId = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      setProgress(Math.round(nextProgress * 100));
    };
    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) setServicesOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setServicesOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      aria-label="Portfolio navigation"
      onMouseLeave={() => setServicesOpen(false)}
    >
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          href={`${routeBase}#top`}
          className="portfolio-brand-link flex items-center rounded-lg"
          aria-label="Mico Ang, back to top"
          onClick={closeNavigation}
        >
          <LogoMark />
          <span>
            <strong className="block font-bold tracking-[-0.01em]">Mico Ang</strong>
            <span className="hidden text-xs text-slate-500 lg:block">Senior frontend developer</span>
          </span>
        </a>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg border border-slate-300 text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] md:hidden"
          onClick={() => {
            setMenuOpen((value) => !value);
            setServicesOpen(false);
          }}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <div className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col border-b border-slate-200 bg-white px-5 py-5 shadow-xl md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          <div className="hidden md:block">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] ${
                servicesOpen ? "bg-blue-50 text-[#2f5bff]" : "text-slate-600 hover:bg-slate-50 hover:text-[#2f5bff]"
              }`}
              aria-expanded={servicesOpen}
              aria-controls="portfolio-services-menu"
              onClick={() => setServicesOpen((value) => !value)}
              onMouseEnter={() => setServicesOpen(true)}
            >
              Services
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <a
            href="/portfolio/services"
            className="border-b border-slate-100 py-3 text-sm font-semibold text-slate-800 transition hover:text-[#2f5bff] md:hidden"
            onClick={closeNavigation}
          >
            Services
          </a>
          <div className="border-b border-slate-100 pb-3 md:hidden">
            {dropdownServices.map((service) => (
              <a
                key={service.id}
                href={getPortfolioServiceHref(service)}
                className="block py-2 pl-4 text-sm text-slate-500 transition hover:text-[#2f5bff]"
                onClick={closeNavigation}
              >
                {service.title}
              </a>
            ))}
          </div>

          {navItems.map(([label, href]) => (
            <a
              key={href}
              href={href.startsWith("/") ? href : `${routeBase}${href}`}
              className="border-b border-slate-100 py-3 text-sm font-medium text-slate-600 transition hover:text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] md:border-0 md:px-3 md:py-2"
              onClick={closeNavigation}
            >
              {label}
            </a>
          ))}

          <a
            href="/portfolio/Mico_Ang_Senior_Software_Developer.pdf"
            download
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] md:ml-3 md:mt-0"
          >
            Resume <ArrowDownToLine size={16} aria-hidden="true" />
          </a>
        </div>
      </div>

      {servicesOpen ? (
        <div
          id="portfolio-services-menu"
          className="absolute inset-x-0 top-full z-40 hidden bg-slate-50/95 px-6 pb-7 text-slate-950 md:block"
          onMouseEnter={() => setServicesOpen(true)}
        >
          <div className="relative mx-auto max-w-7xl border border-t-0 border-blue-200 bg-white px-7 pb-7 pt-8 shadow-[0_26px_65px_-36px_rgba(37,99,235,0.32)] lg:px-10 lg:pb-8 lg:pt-9">
            <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-l border-t border-blue-200 bg-white" aria-hidden="true" />

            <div className="flex items-start justify-between gap-8">
              <div>
                <h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  Services
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                  Help with a new website, an existing application, or a specific technical problem.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-x-10 lg:grid-cols-2">
              {dropdownServices.map((service) => (
                <a
                  key={service.id}
                  href={getPortfolioServiceHref(service)}
                  className="group block border-b border-slate-200 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]"
                  onClick={closeNavigation}
                >
                  <span>
                    <strong className="block text-base font-semibold text-slate-950 group-hover:text-[#2149dc] group-hover:underline group-hover:underline-offset-4">{service.title}</strong>
                    <span className="mt-1.5 block max-w-[52ch] text-sm leading-6 text-slate-600">{service.summary}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="m-0 text-sm text-slate-600">
                View all services or ask about the work you need done.
              </p>
              <a
                href="/portfolio/services"
                className="inline-flex shrink-0 items-center gap-3 text-sm font-semibold text-[#2f5bff] transition hover:text-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
                onClick={closeNavigation}
              >
                See full service list <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-1 bg-slate-100" role="progressbar" aria-label="Page scroll progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <div className="h-full origin-left bg-[#2f5bff] transition-transform duration-150" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
    </nav>
  );
}
