import { useEffect, useLayoutEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  MapPinned,
  MonitorSmartphone,
  Store,
  UsersRound,
} from "lucide-react";
import PortfolioFooter from "../components/PortfolioFooter";
import PortfolioNav from "../components/PortfolioNav";
import Reveal from "../components/Reveal";
import ProjectHeroScene from "./ProjectHeroScene";
import ProjectMediaCarousel from "./ProjectMediaCarousel";
import "../portfolioModern.css";

const projectIcons = {
  analytics: BarChart3,
  calendar: CalendarDays,
  map: MapPinned,
  screens: MonitorSmartphone,
  store: Store,
  team: UsersRound,
};

function ProjectIcon({ name, ...props }) {
  const Icon = projectIcons[name] || Store;
  return <Icon {...props} />;
}

function ProjectTitle({ title, highlight }) {
  if (!highlight || !title.includes(highlight)) return title;
  const highlightIndex = title.indexOf(highlight);
  return (
    <>
      {title.slice(0, highlightIndex)}
      <span className="text-[#f5b55c]">{highlight}</span>
      {title.slice(highlightIndex + highlight.length)}
    </>
  );
}

function useProjectDocument(project) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.body.classList.add("portfolio-motion-ready");
    return () => document.body.classList.remove("portfolio-motion-ready");
  }, [project.slug]);

  useEffect(() => {
    const previousTitle = document.title;
    const url = new URL(`/portfolio/${project.slug}`, window.location.origin).href;
    const image = new URL("/portfolio/assets/mico-ang-portrait.jpg", window.location.origin).href;
    const metadata = [
      ["name", "description", project.seo.description],
      ["name", "keywords", `${project.name}, product case study, Mico Ang`],
      ["property", "og:type", "website"],
      ["property", "og:title", project.seo.title],
      ["property", "og:description", project.seo.description],
      ["property", "og:url", url],
      ["property", "og:image", image],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", project.seo.title],
      ["name", "twitter:description", project.seo.description],
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
    const existingCanonical = document.head.querySelector('link[rel="canonical"]');
    const canonical = existingCanonical || document.createElement("link");
    const previousCanonical = existingCanonical?.getAttribute("href");
    if (!existingCanonical) {
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    document.title = project.seo.title;
    return () => {
      document.title = previousTitle;
      managed.forEach(({ element, existing, previous }) => {
        if (existing) element.content = previous || "";
        else element.remove();
      });
      if (existingCanonical) canonical.setAttribute("href", previousCanonical || "");
      else canonical.remove();
    };
  }, [project]);
}

export default function ProjectCaseStudyPage({ project }) {
  useProjectDocument(project);

  return (
    <div className="modern-portfolio min-h-screen overflow-x-clip bg-[#f8fafc] text-slate-950">
      <a href="#main-content" className="fixed -top-20 left-4 z-[60] rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white transition-[top] focus-visible:top-2">Skip to content</a>
      <PortfolioNav routeBase="/portfolio" />

      <main id="main-content" tabIndex="-1">
        <section id="top" className="relative isolate min-h-[calc(100svh-64px)] overflow-hidden bg-[#071a33] text-white" aria-labelledby="project-title">
          <ProjectHeroScene variant={project.hero.scene} />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(4,17,35,0.99)_0%,rgba(4,17,35,0.94)_42%,rgba(4,17,35,0.48)_68%,rgba(4,17,35,0.08)_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 left-[53%] z-[1] hidden w-px bg-white/10 lg:block" aria-hidden="true" />

          <div className="relative z-[2] grid min-h-[calc(100svh-64px)] grid-rows-[1fr_auto] px-5 pb-8 pt-28 sm:px-8 sm:pb-10 sm:pt-32 lg:px-[clamp(2.5rem,6vw,7.5rem)] lg:pb-12">
            <Reveal className="flex max-w-[51rem] flex-col justify-center py-12 lg:py-16">
              <a href={project.hero.backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><ArrowLeft size={17} aria-hidden="true" /> {project.hero.backLabel}</a>
              <h1 id="project-title" className="portfolio-display mb-0 mt-8 max-w-[12ch] text-balance text-[clamp(3.2rem,6.5vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em]"><ProjectTitle title={project.hero.title} highlight={project.hero.highlight} /></h1>
              <p className="mb-0 mt-7 max-w-[54ch] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{project.hero.summary}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {project.hero.actions.map((action) => (
                  <a key={action.label} href={action.href} className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-5 py-3 font-semibold transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${action.primary ? "bg-[#2f5bff] text-white hover:bg-[#2149dc]" : "border border-white/30 text-white hover:border-white hover:bg-white hover:text-slate-950"}`}>
                    {action.label}{action.icon !== false ? <ArrowRight size={17} aria-hidden="true" /> : null}
                  </a>
                ))}
              </div>
            </Reveal>

            <Reveal delay={1} className="grid border-y border-white/15 bg-[#071a33]/50 sm:grid-cols-3">
              {project.hero.facts.map((fact, index) => (
                <div className={`py-5 sm:min-h-28 sm:px-6 ${index > 0 ? "border-t border-white/15 sm:border-l sm:border-t-0" : ""}`} key={fact.label}>
                  <span className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">{fact.label}</span>
                  <strong className="mt-2 block text-sm font-semibold text-white">{fact.value}</strong>
                  {fact.detail ? <span className="mt-1 block text-xs leading-5 text-slate-400">{fact.detail}</span> : null}
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:py-28" aria-labelledby="project-overview-title">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-start gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
              <Reveal>
                <h2 id="project-overview-title" className="portfolio-display m-0 max-w-[13ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{project.overview.title}</h2>
                <p className="mb-0 mt-6 max-w-xl text-lg leading-8 text-slate-600">{project.overview.description}</p>
              </Reveal>
              <Reveal delay={1} className="border border-slate-200 bg-[#f8fafc] p-3 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)] sm:p-5">
                <img src={project.overview.image.src} width="1800" height="1125" fetchPriority="high" decoding="async" alt={project.overview.image.alt} className="aspect-[16/10] size-full object-cover object-left-top" />
              </Reveal>
            </div>

            <Reveal stagger className="mt-14 border-y border-slate-200">
              <dl className="grid md:grid-cols-3">
                {project.overview.signals.map((signal, index) => (
                  <div className={`portfolio-stagger-item py-7 md:px-7 ${index > 0 ? "border-t border-slate-200 md:border-l md:border-t-0" : ""}`} key={signal.title}>
                    <dt className="text-sm font-semibold text-slate-950">{signal.title}</dt>
                    <dd className="m-0 mt-3 text-sm leading-6 text-slate-600">{signal.description}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#eef3f8] px-5 py-20 sm:px-8 sm:py-24 lg:py-28" aria-labelledby="responsibilities-title">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <h2 id="responsibilities-title" className="portfolio-display m-0 max-w-[13ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{project.responsibilities.title}</h2>
              <p className="m-0 max-w-2xl text-lg leading-8 text-slate-600">{project.responsibilities.description}</p>
            </Reveal>
            <Reveal stagger className="mt-12">
              <div className="grid border-l border-t border-slate-300 md:grid-cols-2 lg:grid-cols-3">
                {project.responsibilities.items.map((item) => (
                  <a key={item.id} href={`#feature-${item.id}`} className="portfolio-stagger-item group min-h-52 border-b border-r border-slate-300 bg-white p-7 transition-colors hover:bg-[#e7f0ff] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#2f5bff] sm:p-8">
                    <ProjectIcon name={item.icon} size={23} className="text-[#2f5bff]" aria-hidden="true" />
                    <h3 className="mb-0 mt-8 text-xl font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                    <p className="mb-0 mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="product-gallery" className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="gallery-title">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <h2 id="gallery-title" className="portfolio-display m-0 max-w-[12ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{project.gallery.title}</h2>
              <p className="m-0 max-w-2xl text-lg leading-8 text-slate-600">{project.gallery.description}</p>
            </Reveal>
            <Reveal className="mt-12" delay={1}>
              <ProjectMediaCarousel slides={project.gallery.slides} projectName={project.name} sourceNote={project.gallery.sourceNote} />
            </Reveal>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-t border-slate-200 bg-[#f8fafc]" aria-labelledby="features-title">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <Reveal>
              <h2 id="features-title" className="portfolio-display m-0 max-w-[14ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{project.features.title}</h2>
              <p className="mb-0 mt-6 max-w-2xl text-lg leading-8 text-slate-600">{project.features.description}</p>
            </Reveal>

            <div className="mt-16 divide-y divide-slate-200 border-y border-slate-200">
              {project.features.items.map((item, index) => (
                <article key={item.id} id={`feature-${item.id}`} className="scroll-mt-28 py-16 sm:py-20 lg:py-24">
                  <Reveal>
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                      <div className={index % 2 ? "lg:order-2" : ""}>
                        <ProjectIcon name={item.icon} size={26} className="text-[#2f5bff]" aria-hidden="true" />
                        <h3 className="portfolio-display mb-0 mt-7 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{item.title}</h3>
                        <p className="mb-0 mt-5 max-w-xl text-lg leading-8 text-slate-600">{item.summary}</p>
                        <ul className="mt-8 space-y-4" aria-label={`${item.title} capabilities`}>
                          {item.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 size-1.5 shrink-0 bg-[#2f5bff]" aria-hidden="true" />{feature}</li>)}
                        </ul>
                      </div>
                      <div className={`border border-slate-200 bg-white p-3 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)] sm:p-5 ${index % 2 ? "lg:order-1" : ""}`}>
                        <img src={item.image} width="1800" height="1125" loading="lazy" decoding="async" alt={item.imageAlt} className="aspect-[16/10] size-full object-contain" />
                      </div>
                    </div>
                  </Reveal>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#071a33] px-5 py-20 text-white sm:px-8 sm:py-24 lg:py-28" aria-labelledby="technology-title">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <h2 id="technology-title" className="portfolio-display m-0 max-w-[13ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">{project.technology.title}</h2>
              <p className="m-0 max-w-2xl text-base leading-7 text-slate-300">{project.technology.description}</p>
            </Reveal>
            <Reveal stagger className="mt-12">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={`${project.name} technology stack`}>
                {project.technology.items.map((technology) => (
                  <li key={technology.name} className="portfolio-stagger-item group flex min-h-32 items-center gap-4 border border-white/15 bg-[#0b213e] p-5 transition-[border-color,background-color,transform] hover:-translate-y-1 hover:border-[#6f8cff] hover:bg-[#102b50]">
                    <span className="grid size-12 shrink-0 place-items-center border border-white/15 bg-white p-3">
                      <img src={`/portfolio/tech/${technology.icon}`} width="26" height="26" loading="lazy" decoding="async" alt="" aria-hidden="true" className="size-7 object-contain" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-base font-semibold text-white">{technology.name}</strong>
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#8ea6c0]">{technology.group}</span>
                      <span className="mt-2 block text-xs leading-5 text-slate-400">{technology.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="bg-[#2f5bff] px-5 py-20 text-white sm:px-8 sm:py-24">
          <Reveal>
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="portfolio-display m-0 max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{project.cta.title}</h2>
                <p className="mb-0 mt-5 max-w-2xl text-lg leading-8 text-blue-100">{project.cta.description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {project.cta.actions.map((action) => (
                  <a key={action.label} href={action.href} className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-5 py-3 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${action.primary ? "bg-white text-slate-950 hover:bg-slate-950 hover:text-white" : "border border-white/45 text-white hover:bg-white hover:text-slate-950"}`}>
                    {action.label}{action.primary ? <ArrowRight size={17} aria-hidden="true" /> : null}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <PortfolioFooter routeBase="/portfolio" />
    </div>
  );
}
