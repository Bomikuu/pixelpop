import { ArrowRight, Code2, Layers3, MessageCircle, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import Reveal from "../components/Reveal";
import PortfolioServiceHeroScene from "./PortfolioServiceHeroScene";
import PortfolioServiceIcon from "./PortfolioServiceIcon";
import PortfolioServicePattern from "./PortfolioServicePattern";
import TechnologyExplorer from "./TechnologyExplorer";
import {
  getPortfolioServiceHref,
  getServiceTechnologies,
  portfolioServiceCatalog,
} from "./portfolioServices";

const featuredServices = portfolioServiceCatalog.filter((service) => service.featured);
const supportingServices = portfolioServiceCatalog.filter((service) => !service.featured);
const serviceSummary = [
  {
    title: "Direct ownership",
    description: "Architecture and implementation stay connected from the first decision through release.",
    icon: Layers3,
  },
  {
    title: "Product to release",
    description: "Design, frontend, backend, search, automation, and delivery can move as one system.",
    icon: Code2,
  },
  {
    title: "Flexible scale",
    description: "Work with me directly, with your team, or bring in ASTA when the scope needs more hands.",
    icon: UsersRound,
  },
];

const closingPrinciples = [
  { label: "Practical problem solving", icon: Zap },
  { label: "Clear communication", icon: MessageCircle },
  { label: "Responsible delivery", icon: ShieldCheck },
];

function ServiceCard({ service, featured = false }) {
  const technologies = getServiceTechnologies(service).slice(0, featured ? 4 : 3);

  return (
    <article className={`group flex h-full flex-col border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#2f5bff] hover:shadow-[0_28px_70px_-48px_rgba(15,23,42,0.72)] sm:p-8 ${featured ? "min-h-[30rem] lg:p-10" : "min-h-[25rem]"}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`grid place-items-center rounded-xl text-[#2f5bff] transition-colors group-hover:bg-[#2f5bff] group-hover:text-white ${featured ? "size-14 bg-blue-50" : "size-12 bg-slate-100"}`} aria-hidden="true">
          <PortfolioServiceIcon name={service.icon} size={featured ? 25 : 21} strokeWidth={1.7} />
        </span>
        {featured ? <span className="text-xs font-semibold text-slate-500">Focused capability</span> : null}
      </div>
      <h2 className={`portfolio-display mb-0 mt-8 max-w-[13ch] font-semibold tracking-[-0.035em] text-slate-950 ${featured ? "text-[clamp(2.25rem,4vw,3.6rem)] leading-[1]" : "text-2xl leading-tight"}`}>{service.title}</h2>
      <p className="mb-0 mt-4 max-w-[52ch] text-sm leading-7 text-slate-600">{service.summary}</p>
      <div className="mt-7">
        <TechnologyExplorer technologies={technologies} compact />
      </div>
      <Link className="mt-auto inline-flex items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm font-semibold text-slate-950 outline-none transition-colors hover:text-[#2f5bff] focus-visible:text-[#2f5bff] focus-visible:underline" to={getPortfolioServiceHref(service)}>
        Explore this service <ArrowRight size={17} className="text-[#2f5bff] transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function PortfolioServicesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <ApplicationPageShell
      title="Web Product Services"
      description="Personal web product services from Mico Ang across design, full-stack development, Three.js, AI automation, CMS, support, security, performance, and SEO."
      canonicalPath="/portfolio/services"
    >
      <section className="relative isolate min-h-[100dvh] overflow-hidden bg-white text-slate-950" aria-labelledby="portfolio-services-title">
        <PortfolioServiceHeroScene />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.97)_40%,rgba(255,255,255,0.72)_58%,rgba(255,255,255,0.08)_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 left-[55%] z-[1] hidden w-px bg-slate-200/80 lg:block" aria-hidden="true" />
        <div className="relative z-[2] grid min-h-[100dvh] w-full grid-rows-[1fr_auto] px-5 pb-8 pt-28 sm:px-8 lg:px-[clamp(2.5rem,6vw,7.5rem)] lg:pb-10 lg:pt-24">
          <Reveal className="flex max-w-[48rem] flex-col justify-center py-12 lg:py-20">
            <h1 id="portfolio-services-title" className="portfolio-display m-0 max-w-[13ch] text-[clamp(3.15rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.04em] text-slate-950">
              Technical ownership from idea to release.
            </h1>
            <p className="mb-0 mt-7 max-w-[45ch] text-lg leading-8 text-slate-600">
              I design, build, and improve web products across interface, backend, automation, search, and release.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#portfolio-service-list" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px">
                Explore services <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link to="/portfolio/work-with-me#project-inquiry" className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:border-[#2f5bff] hover:text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px">
                Discuss a project
              </Link>
            </div>
          </Reveal>
          <Reveal className="grid border-y border-slate-200 bg-white/90 sm:grid-cols-3">
            {serviceSummary.map(({ title, description, icon: Icon }, index) => (
              <article key={title} className={`flex min-h-40 gap-4 p-5 sm:p-6 lg:p-7 ${index > 0 ? "border-t border-slate-200 sm:border-l sm:border-t-0" : ""}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2f5bff]" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.8} />
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

      <section id="portfolio-service-list" className="relative isolate scroll-mt-24 overflow-hidden bg-[#f8fafc] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="featured-services-title">
        <PortfolioServicePattern variant="dots" className="opacity-70" />
        <div className="relative z-[1] mx-auto max-w-7xl">
          <Reveal className="max-w-[48rem]">
            <h2 id="featured-services-title" className="portfolio-display m-0 max-w-[13ch] text-[clamp(2.5rem,5vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950">Distinctive product experiences.</h2>
            <p className="mb-0 mt-5 max-w-[60ch] text-base leading-7 text-slate-600">These capabilities are strongest when a project needs a senior engineer who can connect experience, architecture, and delivery.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {featuredServices.map((service, index) => (
              <Reveal key={service.id} delay={index} className="h-full">
                <ServiceCard service={service} featured />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-y border-slate-200 bg-white px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="delivery-services-title">
        <PortfolioServicePattern variant="crosses" className="opacity-60" />
        <div className="relative z-[1] mx-auto max-w-7xl">
          <Reveal className="max-w-[50rem]">
            <h2 id="delivery-services-title" className="portfolio-display m-0 max-w-[14ch] text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.038em] text-slate-950">The rest of my delivery system.</h2>
            <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-slate-600">Choose one focused service or combine several around the product problem, current team, and release you need to reach.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {supportingServices.map((service, index) => (
              <Reveal key={service.id} delay={index % 3} className="h-full">
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#071a33] px-5 py-24 text-white sm:px-8 sm:py-28 lg:py-32" aria-labelledby="services-close-title">
        <div
          className="pointer-events-none absolute -right-56 -top-72 size-[44rem] rounded-full border border-blue-400/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-72 -right-40 size-[38rem] rounded-full bg-blue-500/[0.06]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[7%] top-16 size-36 bg-[radial-gradient(circle,rgba(96,165,250,0.5)_1px,transparent_1.5px)] bg-[size:20px_20px] opacity-45"
          aria-hidden="true"
        />

        <Reveal className="relative mx-auto grid max-w-[96rem] gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(23rem,0.8fr)] lg:items-center lg:gap-20">
          <div>
            <div
              id="services-close-title"
              className="portfolio-display m-0 max-w-[15ch] text-[clamp(2rem,4.6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-white"
            >
              Bring me the workflow that needs a clearer path.
            </div>
            <p className="mb-0 mt-7 max-w-[58ch] text-lg leading-8 text-blue-100/70">
              I will help separate the immediate request from the technical decisions required to deliver it responsibly.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-0">
              {closingPrinciples.map(({ label, icon: Icon }, index) => (
                <div
                  key={label}
                  className={`flex items-center gap-4 ${index > 0 ? "sm:border-l sm:border-blue-300/30 sm:pl-6" : ""} ${index < closingPrinciples.length - 1 ? "sm:pr-6" : ""}`}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-400/15 text-blue-300" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="max-w-[10rem] text-sm font-medium leading-6 text-blue-50/85">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-blue-300/25 bg-[#0b2245] p-6 sm:p-8 lg:p-9" aria-label="Start a project conversation">
            <p className="mb-0 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              <span className="size-2.5 rounded-full bg-blue-400" aria-hidden="true" />
              Ready when you are
            </p>
            <Link
              to="/portfolio/work-with-me#project-inquiry"
              className="group mt-8 flex min-h-16 w-full items-center justify-between gap-6 rounded-lg bg-white px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-200 active:translate-y-px"
            >
              Discuss a project
              <ArrowRight size={22} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <p className="mb-0 mt-7 max-w-md text-base leading-7 text-blue-100/65">
              A focused conversation to explore your goals, challenges, and the best path forward.
            </p>
          </aside>
        </Reveal>
      </section>
    </ApplicationPageShell>
  );
}
