import { ArrowLeft, ArrowRight, Box, Compass, Layers3, MousePointer2 } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import Reveal from "../components/Reveal";
import PortfolioServiceHeroScene from "./PortfolioServiceHeroScene";
import PortfolioServiceIcon from "./PortfolioServiceIcon";
import PortfolioInclusionIcon from "./PortfolioInclusionIcon";
import PortfolioServicePattern from "./PortfolioServicePattern";
import TechnologyExplorer from "./TechnologyExplorer";
import {
  getPortfolioServiceBySlug,
  getServiceTechnologies,
  portfolioServiceCatalog,
} from "./portfolioServices";

const AstaThreeCarScene = lazy(() => import("../../asta/components/AstaThreeCarScene"));
const AstaThreeShoeScene = lazy(() => import("../../asta/components/AstaThreeShoeScene"));

function SceneFallback({ label }) {
  return (
    <div className="grid min-h-[25rem] place-items-center bg-[#0b1733] px-6 text-center text-sm font-semibold text-blue-200 sm:min-h-[31rem]" role="status">
      {label}
    </div>
  );
}

function ServiceDetail({ service }) {
  const technologies = getServiceTechnologies(service);
  const currentIndex = portfolioServiceCatalog.findIndex((entry) => entry.id === service.id);
  const nextService = portfolioServiceCatalog[(currentIndex + 1) % portfolioServiceCatalog.length];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [service.slug]);

  return (
    <ApplicationPageShell
      title={service.title}
      description={service.summary}
      canonicalPath={`/portfolio/services/${service.slug}`}
    >
      <section className="relative isolate min-h-[100dvh] overflow-hidden bg-white text-slate-950" aria-labelledby="service-title">
        <PortfolioServiceHeroScene serviceSlug={service.slug} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.97)_40%,rgba(255,255,255,0.72)_58%,rgba(255,255,255,0.08)_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 left-[55%] z-[1] hidden w-px bg-slate-200/80 lg:block" aria-hidden="true" />
        <div className="relative z-[2] grid min-h-[100dvh] w-full grid-rows-[1fr_auto] px-5 pb-8 pt-28 sm:px-8 lg:px-[clamp(2.5rem,6vw,7.5rem)] lg:pb-10 lg:pt-24">
          <Reveal className="flex max-w-[50rem] flex-col justify-center py-12 lg:py-20">
            <Link to="/portfolio/services" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#2f5bff] transition hover:text-[#173dcc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
              <ArrowLeft size={16} aria-hidden="true" /> All services
            </Link>
            <h1 id="service-title" className="portfolio-display mb-0 mt-8 max-w-[12ch] text-[clamp(3.1rem,7vw,5.8rem)] font-semibold leading-[0.93] tracking-[-0.04em] text-slate-950">{service.title}</h1>
            <p className="mb-0 mt-7 max-w-[49ch] text-lg leading-8 text-slate-600">{service.summary}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/portfolio/work-with-me#project-inquiry" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px">
                Discuss this service <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#service-inclusions" className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:border-[#2f5bff] hover:text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px">
                View inclusions
              </a>
            </div>
          </Reveal>
          <Reveal className="grid border-y border-slate-200 bg-white/90 sm:grid-cols-3">
            {service.inclusions.slice(0, 3).map(([title, description], index) => (
              <article key={title} className={`flex min-h-40 gap-4 p-5 sm:p-6 lg:p-7 ${index > 0 ? "border-t border-slate-200 sm:border-l sm:border-t-0" : ""}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2f5bff]" aria-hidden="true">
                  <PortfolioInclusionIcon title={title} size={18} strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="m-0 text-base font-semibold text-slate-950">{title}</h2>
                  <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#f8fafc] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-summary-title">
        <PortfolioServicePattern variant="dots" className="opacity-70" />
        <div className="relative z-[1] mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_30px_80px_-64px_rgba(15,23,42,0.65)] lg:grid-cols-[0.85fr_1.15fr_1.05fr]">
          <Reveal className="group relative isolate min-h-[24rem] overflow-hidden bg-[#2f5bff] p-7 text-white sm:p-9 lg:p-10">
            <span className="relative z-[1] grid size-14 place-items-center rounded-xl bg-white text-[#2f5bff] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3" aria-hidden="true">
              <PortfolioServiceIcon name={service.icon} size={26} strokeWidth={1.7} />
            </span>
            <h2 id="service-summary-title" className="portfolio-display relative z-[1] mb-0 mt-7 max-w-[13ch] text-[clamp(2.35rem,4vw,3.55rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">{service.overview.title}</h2>
            <p className="relative z-[1] mb-0 mt-8 max-w-[28ch] text-sm font-semibold leading-6 text-white">{service.shortTitle}</p>
            <div className="pointer-events-none absolute -bottom-24 -right-20 size-64 rounded-full border border-white/15 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
              <div className="absolute inset-10 rounded-full border border-white/15" />
              <div className="absolute inset-20 rounded-full border border-white/15" />
            </div>
          </Reveal>
          <Reveal delay={1} className="group relative border-t border-slate-200 p-7 transition-colors duration-300 hover:bg-blue-50/50 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
            <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[#2f5bff] transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
            <Compass className="text-[#2f5bff] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6" size={24} strokeWidth={1.8} aria-hidden="true" />
            <h3 className="mb-0 mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950">How I approach it</h3>
            <p className="mb-0 mt-4 max-w-[52ch] text-base leading-8 text-slate-600">{service.overview.paragraphs[0]}</p>
            <ul className="mt-8 grid gap-2 border-t border-blue-100 pt-5" aria-label="Initial areas of focus">
              {service.inclusions.slice(0, 3).map(([title]) => (
                <li key={title} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <ArrowRight className="shrink-0 text-[#2f5bff]" size={14} strokeWidth={2} aria-hidden="true" />
                  {title}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={2} className="group relative border-t border-slate-200 p-7 transition-colors duration-300 hover:bg-blue-50/50 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
            <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[#2f5bff] transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
            <Layers3 className="text-[#2f5bff] transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6" size={24} strokeWidth={1.8} aria-hidden="true" />
            <h3 className="mb-0 mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950">What stays connected</h3>
            <p className="mb-0 mt-4 max-w-[52ch] text-base leading-8 text-slate-600">{service.overview.paragraphs[1]}</p>
            <div className="mt-8 rounded-xl bg-blue-50 p-5 text-sm leading-7 text-slate-700 transition-colors duration-300 group-hover:bg-white">
              <strong className="block text-slate-950">My role</strong>
              I work directly on the architecture and implementation. If ASTA support is useful, I make that team boundary explicit before the engagement begins.
            </div>
          </Reveal>
        </div>
      </section>

      {service.slug === "threejs-development" ? (
        <section className="relative isolate overflow-hidden bg-white px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="portfolio-threejs-showcase-title">
          <PortfolioServicePattern variant="crosses" className="opacity-60" />
          <div className="relative z-[1] mx-auto max-w-7xl">
            <Reveal className="max-w-[48rem]">
              <span className="grid size-14 place-items-center rounded-xl bg-blue-50 text-[#2f5bff]" aria-hidden="true"><Box size={26} strokeWidth={1.8} /></span>
              <h2 id="portfolio-threejs-showcase-title" className="portfolio-display mb-0 mt-7 max-w-[12ch] text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.038em] text-slate-950">Live 3D, two interaction models.</h2>
              <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-slate-600">These ASTA scenes show how lightweight geometry and a detailed product model can serve different browser experiences.</p>
            </Reveal>
            <div className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 lg:grid-cols-2">
              {[
                {
                  title: "Geometry-built vehicle",
                  description: "Move across the scene to change the camera angle around a lightweight model assembled in code.",
                  scene: <AstaThreeCarScene />,
                  fallback: "Preparing the vehicle scene",
                },
                {
                  title: "Detailed product model",
                  description: "Drag the shoe to inspect its geometry, materials, texture detail, and responsive studio lighting.",
                  scene: <AstaThreeShoeScene />,
                  fallback: "Preparing the product scene",
                },
              ].map((item, index) => (
                <Reveal as="article" key={item.title} delay={index} className={`group bg-white ${index > 0 ? "border-t border-slate-200 lg:border-l lg:border-t-0" : ""}`}>
                  <div className="flex gap-4 p-6 sm:p-8">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2f5bff] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3" aria-hidden="true"><MousePointer2 size={20} strokeWidth={1.8} /></span>
                    <div>
                      <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                      <p className="mb-0 mt-2 max-w-[48ch] text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                  <Suspense fallback={<SceneFallback label={item.fallback} />}>{item.scene}</Suspense>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="service-inclusions" className="relative isolate scroll-mt-24 overflow-hidden border-y border-slate-200 bg-[#f8fafc] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-inclusions-title">
        <PortfolioServicePattern variant="dots" className="opacity-70" />
        <div className="relative z-[1] mx-auto max-w-7xl">
          <Reveal className="max-w-[50rem]">
            <span className="grid size-14 place-items-center rounded-xl bg-white text-[#2f5bff] shadow-[0_18px_45px_-32px_rgba(47,91,255,0.65)]" aria-hidden="true"><PortfolioServiceIcon name={service.icon} size={25} strokeWidth={1.8} /></span>
            <h2 id="service-inclusions-title" className="portfolio-display mb-0 mt-7 max-w-[12ch] text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.038em] text-slate-950">What I can own.</h2>
            <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-slate-600">The final scope follows the product, team, current system, and release risk.</p>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {service.inclusions.map(([title, description], index) => (
              <Reveal key={title} delay={index % 3} className="h-full">
                <article className="group flex h-full gap-5 rounded-xl border border-slate-200 bg-white/95 p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#2f5bff] hover:shadow-[0_26px_60px_-44px_rgba(47,91,255,0.65)] sm:p-7">
                  <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2f5bff] transition-[background-color,color,transform] duration-300 group-hover:rotate-3 group-hover:scale-105 group-hover:bg-[#2f5bff] group-hover:text-white" aria-hidden="true"><PortfolioInclusionIcon title={title} size={21} strokeWidth={1.8} /></span>
                  <div>
                    <h3 className="m-0 text-lg font-semibold tracking-[-0.015em] text-slate-950">{title}</h3>
                    <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-white px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-technologies-title">
        <PortfolioServicePattern variant="crosses" className="opacity-55" />
        <div className="relative z-[1] mx-auto max-w-7xl">
          <Reveal className="max-w-[48rem]">
            <h2 id="service-technologies-title" className="portfolio-display m-0 max-w-[13ch] text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.038em] text-slate-950">Technologies I use with purpose.</h2>
            <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-slate-600">Select any technology to see what it does, where it fits, and how I use it in delivery.</p>
          </Reveal>
          <Reveal delay={1} className="mt-12">
            <TechnologyExplorer technologies={technologies} />
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-y border-slate-200 bg-[#f8fafc] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-faq-title">
        <PortfolioServicePattern variant="dots" className="opacity-55" />
        <div className="relative z-[1] mx-auto max-w-5xl">
          <Reveal>
            <h2 id="service-faq-title" className="portfolio-display m-0 max-w-[12ch] text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.038em] text-slate-950">Questions I usually answer.</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {service.faqs.map(([question, answer], index) => (
              <Reveal key={question} delay={index % 3}>
                <details className="group rounded-xl border border-slate-200 bg-white open:border-[#2f5bff]">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-left font-semibold text-slate-950 marker:content-none sm:px-6">
                    {question}
                    <span className="text-xl font-normal text-[#2f5bff] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mb-0 border-t border-slate-200 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">{answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1733] px-5 py-16 text-white sm:px-8 lg:py-20" aria-labelledby="service-next-title">
        <Reveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="m-0 text-sm font-semibold text-blue-300">Next service</p>
            <h2 id="service-next-title" className="portfolio-display mb-0 mt-4 max-w-[15ch] text-[clamp(2.3rem,4.5vw,4rem)] font-semibold leading-[1] tracking-[-0.038em] text-white">{nextService.title}</h2>
            <p className="mb-0 mt-4 max-w-[55ch] text-base leading-7 text-slate-300">{nextService.summary}</p>
          </div>
          <Link to={`/portfolio/services/${nextService.slug}`} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px">
            Explore next service <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </ApplicationPageShell>
  );
}

export default function PortfolioServiceDetailPage() {
  const { serviceSlug } = useParams();
  const service = getPortfolioServiceBySlug(serviceSlug);
  if (!service) return <Navigate to="/portfolio/services" replace />;
  return <ServiceDetail service={service} />;
}
