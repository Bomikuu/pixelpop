import { ArrowRight, CalendarDays, Database, Facebook, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { astaSlides } from "../portfolioData";
import MediaCarousel from "./MediaCarousel";
import Reveal from "./Reveal";

const astaHighlights = [
  { label: "Established", value: "2021", detail: "software studio", icon: CalendarDays },
  { label: "Founding team", value: "4", detail: "co-founders", icon: UsersRound },
  { label: "Ongoing platform", value: "DineEase", detail: "restaurant operations", icon: Database },
];

const astaTechnologies = [
  { name: "React", icon: "react.svg" },
  { name: "Vue", icon: "vue.svg" },
  { name: "Nuxt", icon: "nuxt.svg" },
  { name: "TypeScript", icon: "typescript.svg" },
  { name: "Node.js", icon: "node.svg" },
  { name: "Django", icon: "django.svg" },
  { name: "Python", icon: "python.svg" },
  { name: "PostgreSQL", icon: "postgresql.svg" },
];

export default function AstaSection() {
  return (
    <section
      id="asta"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
      style={{
        backgroundImage: "linear-gradient(rgba(21, 112, 239, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 112, 239, 0.08) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,253,255,0.96)_0%,rgba(251,253,255,0.72)_45%,rgba(251,253,255,0.18)_78%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <img src="/portfolio/assets/asta-logo.png" width="1024" height="1024" loading="lazy" decoding="async" alt="ASTA Softwares logo" className="mx-auto size-16 rounded-xl bg-[#1570ef] object-contain shadow-[0_18px_42px_-22px_rgba(21,112,239,0.7)] sm:size-20" />
            <p className="mt-4 text-sm font-semibold text-[#385474]">ASTA Softwares</p>
            <h2 className="portfolio-display mx-auto mt-7 max-w-[16ch] text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#081a30] sm:text-5xl lg:text-6xl">
              Building products and teams at <span className="text-[#2f5bff]">ASTA.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#52677d]">
              I’m one of four co-founders and serve as Technical Lead. We build software around real business workflows, from employee systems and interactive experiences to the ongoing DineEase restaurant platform.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
              {astaHighlights.map((highlight) => (
                <div className="grid grid-cols-[3.25rem_1fr] items-center gap-4 rounded-xl border border-[#cbd9e8] bg-white/90 p-5" key={highlight.label}>
                  <span className="grid size-[3.25rem] place-items-center rounded-lg bg-[#edf5ff] text-[#1570ef]" aria-hidden="true">
                    <highlight.icon size={25} strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#52677d]">{highlight.label}</span>
                    <strong className="mt-1 block text-2xl font-semibold tracking-[-0.025em] text-[#081a30]">{highlight.value}</strong>
                    <span className="text-sm text-[#52677d]">{highlight.detail}</span>
                  </span>
                </div>
              ))}
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <p className="text-center text-sm font-semibold text-[#385474]">Technology stack</p>
            <ul className="mt-4 flex flex-wrap justify-center gap-2.5" aria-label="ASTA technology stack">
              {astaTechnologies.map((technology) => (
                <li key={technology.name} className="inline-flex items-center gap-2 rounded-full border border-[#cbd9e8] bg-white px-3.5 py-2 text-sm font-semibold text-[#385474]">
                  <img src={`/portfolio/tech/${technology.icon}`} alt="" className="size-4 object-contain" aria-hidden="true" />
                  {technology.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/asta" className="group inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#1570ef] px-6 py-3.5 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#0b55c7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1570ef]">
                Visit ASTA Softwares
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a href="https://www.facebook.com/astasoftwares" target="_blank" rel="noreferrer" className="grid size-12 place-items-center rounded-lg border border-[#9fb4ca] bg-white text-[#081a30] transition duration-200 hover:-translate-y-0.5 hover:border-[#1570ef] hover:bg-[#edf5ff] hover:text-[#1570ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1570ef]" aria-label="ASTA Softwares on Facebook" title="ASTA Softwares on Facebook">
                <Facebook size={19} aria-hidden="true" />
              </a>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="mx-auto mt-10 max-w-5xl">
            <MediaCarousel slides={astaSlides} label="ASTA Softwares" imageFit="cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
