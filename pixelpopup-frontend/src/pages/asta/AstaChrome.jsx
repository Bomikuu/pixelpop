import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, ChevronDown, Code2, Facebook, Layers3, Mail, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { contact } from "./astaData";
import AstaServiceIcon from "./components/AstaServiceIcon";
import { dropdownServices, getServiceHref } from "./data/serviceCatalog";

const navigation = [
  ["Technology", "/asta#technology"],
  ["Team", "/asta#team"],
  ["Culture", "/asta#culture"],
  ["Reviews", "/asta#testimonials"],
];

export function AstaNav({ onStartProject }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const toggleRef = useRef(null);
  const headerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setServicesOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setServicesOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let frameId = 0;
    const updateProgress = () => {
      frameId = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0;
      setScrollProgress(Math.min(100, Math.max(0, nextProgress)));
    };
    const onScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header ref={headerRef} className="asta-nav" onMouseLeave={() => setServicesOpen(false)}>
      <div className="asta-container asta-nav__inner">
        <Link className="asta-brand" to="/asta" aria-label="ASTA Softwares home">
          <img src="/portfolio/assets/asta-logo.png" width="44" height="44" alt="" />
          <span><strong>ASTA Softwares</strong><small className="hidden sm:block">Product engineering studio</small></span>
        </Link>
        <nav className="asta-nav__links" aria-label="Main navigation">
          <button
            className="relative inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[13px] text-[#4d6077] outline-none transition-colors hover:text-[#081a30] focus-visible:text-[#0b62ce] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-8"
            type="button"
            aria-expanded={servicesOpen}
            aria-controls="asta-services-menu"
            onClick={() => setServicesOpen((value) => !value)}
            onMouseEnter={() => setServicesOpen(true)}
          >
            Services <ChevronDown className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} size={14} aria-hidden="true" />
          </button>
          {navigation.map(([label, href]) => href.includes("#") ? (
            <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>
          ) : (
            <NavLink key={label} to={href} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
        </nav>
        <div
          className="asta-nav__progress"
          role="progressbar"
          aria-label="Page scroll progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={scrollProgress}
        >
          <span aria-hidden="true"><i style={{ transform: `scaleX(${scrollProgress / 100})` }} /></span>
          <strong>{scrollProgress}%</strong>
        </div>
        {onStartProject ? (
          <button className="asta-button asta-button--small" type="button" onClick={onStartProject}>Start a project <ArrowRight size={16} aria-hidden="true" /></button>
        ) : (
          <a className="asta-button asta-button--small" href={`mailto:${contact.email}`}>Start a project <ArrowRight size={16} aria-hidden="true" /></a>
        )}
        <button
          ref={toggleRef}
          className="asta-nav__toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {servicesOpen ? (
        <div id="asta-services-menu" className="absolute inset-x-0 top-full z-50 hidden border-y border-[#d9e2eb] bg-white text-[#081a30] shadow-[0_18px_35px_rgba(6,20,39,0.14)] min-[821px]:block" onMouseEnter={() => setServicesOpen(true)}>
          <div className="mx-auto grid max-w-[1320px] gap-px bg-[#d9e2eb] lg:grid-cols-2">
            {dropdownServices.map((service) => (
              <Link className={`group flex min-h-[7.25rem] gap-4 px-7 py-6 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1570ef] ${service.featured ? "bg-[#eaf4ff] shadow-[inset_0_0_0_1px_#8fc4ff] hover:bg-[#deeeff]" : "bg-white hover:bg-[#f5f9fd]"}`} key={service.id} to={getServiceHref(service)}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:-translate-y-1 ${service.featured ? "bg-[#1570ef] text-white" : "bg-[#e7f1fd] text-[#0b62ce]"}`}><AstaServiceIcon name={service.icon} size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                <span>{service.featured ? <small className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#0b62ce]">Featured capability</small> : null}<strong className="block text-sm font-semibold text-[#081a30]">{service.title}</strong><small className="mt-1.5 block max-w-[52ch] text-xs leading-5 text-[#607489]">{service.menuDescription}</small></span>
              </Link>
            ))}
          </div>
          <div className="border-t border-[#d9e2eb] bg-[#f4f7fb]">
            <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-3 px-7 py-4 sm:flex-row sm:items-center">
              <p className="m-0 text-sm text-[#52677d]">Need a custom solution outside these categories?</p>
              <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b62ce] hover:text-[#084b9b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1570ef]" to="/asta/services">View all services <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      ) : null}
      {open && (
        <nav className="asta-nav__mobile" aria-label="Mobile navigation">
          <Link to="/asta/services" onClick={() => setOpen(false)}>Services</Link>
          {dropdownServices.map((service) => <Link className={`pl-5 text-sm ${service.featured ? "font-semibold text-[#0b62ce]" : ""}`} key={service.id} to={getServiceHref(service)} onClick={() => setOpen(false)}>{service.title}{service.featured ? " - Featured" : ""}</Link>)}
          {navigation.map(([label, href]) => href.includes("#") ? (
            <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>
          ) : (
            <Link key={label} to={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          {onStartProject ? <button type="button" onClick={() => { setOpen(false); onStartProject({ currentTarget: toggleRef.current }); }}>Start a project</button> : <a href={`mailto:${contact.email}`}>Start a project</a>}
        </nav>
      )}
      <span className="asta-nav__page-line" aria-hidden="true"><i style={{ transform: `scaleX(${scrollProgress / 100})` }} /></span>
    </header>
  );
}

const footerLinks = [
  ["Services", "/asta/services"],
  ["Technology", "/asta#technology"],
  ["Team", "/asta#team"],
  ["Culture", "/asta#culture"],
  ["Reviews", "/asta#testimonials"],
];

const capabilities = [
  "Custom business systems",
  "Web and mobile products",
  "Interface and experience design",
  "API and platform integration",
  "Cloud delivery and support",
];

export function AstaFooter({ onStartProject }) {
  const scrollToTop = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="asta-footer">
      <div className="asta-container">
        <div className="asta-footer__cta">
          <div>
            <h2>Build the system your business actually needs.</h2>
            <p>Bring us the workflow, operational bottleneck, or product idea. We will help shape a practical path from discovery to delivery.</p>
          </div>
          {onStartProject ? (
            <button type="button" onClick={onStartProject}>Start a project <ArrowRight size={18} aria-hidden="true" /></button>
          ) : (
            <a href={`mailto:${contact.email}`}>Start a project <ArrowRight size={18} aria-hidden="true" /></a>
          )}
        </div>

        <div className="asta-footer__inner">
          <div className="asta-footer__brand-column">
            <Link className="asta-brand asta-brand--light" to="/asta">
              <img src="/portfolio/assets/asta-logo.png" width="44" height="44" alt="" />
              <span><strong>ASTA Softwares</strong><small>Product engineering studio</small></span>
            </Link>
            <p>Custom software and digital products, built around real teams and operating needs since 2021.</p>
            <div className="asta-footer__socials">
              <a href={`mailto:${contact.email}`} aria-label="Email ASTA Softwares"><Mail size={18} aria-hidden="true" /></a>
              <a href={contact.facebook} target="_blank" rel="noreferrer" aria-label="ASTA Softwares on Facebook"><Facebook size={18} aria-hidden="true" /></a>
            </div>
          </div>
          <nav aria-label="Footer navigation">
            <strong>Explore</strong>
            <ul>{footerLinks.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
          </nav>
          <div className="asta-footer__capabilities">
            <strong>Capabilities</strong>
            <ul>{capabilities.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="asta-footer__contact">
            <strong>Start a conversation</strong>
            <a href={`mailto:${contact.email}`}><Mail size={17} aria-hidden="true" />{contact.email}</a>
            <p>For custom products, ongoing engineering support, and delivery partnerships.</p>
            <div><Code2 size={17} aria-hidden="true" /><span>Strategy, interface, engineering</span></div>
            <div><Layers3 size={17} aria-hidden="true" /><span>Established 2021</span></div>
          </div>
        </div>
        <div className="asta-footer__base">
          <span>© {new Date().getFullYear()} ASTA Softwares. All rights reserved.</span>
          <span>Built with React, Tailwind CSS, and Three.js.</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex min-h-10 items-center gap-2 border-0 bg-transparent px-0 text-xs font-semibold text-[#bed2e7] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]"
          >
            Back to top <ArrowUp size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function AstaRouteScrollReset() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname, hash]);

  return null;
}

export function AstaPage({ children, showFooter = true, variant = "", onStartProject }) {
  return (
    <div className={`asta-site ${variant ? `asta-site--${variant}` : ""}`.trim()}>
      <AstaRouteScrollReset />
      <a className="asta-skip-link" href="#main-content">Skip to content</a>
      <AstaNav onStartProject={onStartProject} />
      {children}
      {showFooter && <AstaFooter onStartProject={onStartProject} />}
    </div>
  );
}
