import { ArrowRight, Box, MapPin, Monitor, UsersRound } from "lucide-react";
import Reveal from "./Reveal";
import SourceMapScene from "./SourceMapScene";

const capabilities = [
  { icon: Monitor, title: "Frontend systems", detail: "Architecture and UI" },
  { icon: Box, title: "Full-stack delivery", detail: "Product to production" },
  { icon: UsersRound, title: "Technical leadership", detail: "Teams and standards" },
];

export default function HeroSection() {
  return (
    <section id="top" className="portfolio-hero-surface relative isolate min-h-svh overflow-hidden border-b border-slate-200 bg-white pt-[4.75rem]">
      <SourceMapScene />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.76)_49%,rgba(255,255,255,0.18)_70%,transparent_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-t from-white via-white/70 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.75rem)] max-w-7xl items-center px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <Reveal className="flex w-full max-w-[47rem] flex-col justify-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <MapPin size={17} className="text-[#2f5bff]" aria-hidden="true" />
              Davao City, Philippines
            </span>
            <span className="size-1 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Working globally</span>
          </div>
          <h1 className="portfolio-display mt-7 max-w-[9ch] text-[clamp(3.75rem,7.4vw,5.75rem)] font-semibold leading-[0.91] tracking-[-0.04em] text-slate-950">
            <span className="block">Meet</span>
            <span className="block text-[#2f5bff]">Mico Ang.</span>
          </h1>
          <p className="mt-7 max-w-[38rem] text-lg leading-8 text-slate-600 sm:text-xl">
            Senior frontend engineer, full-stack developer, and technical lead turning complex product requirements into clear, high-performing experiences.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#work" className="group inline-flex min-h-12 items-center gap-5 rounded-md bg-[#2f5bff] px-6 py-3.5 font-semibold text-white shadow-[0_16px_40px_-22px_rgba(47,91,255,0.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
              View selected work
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" size={18} aria-hidden="true" />
            </a>
            <a href="/portfolio/work-with-me" className="group inline-flex min-h-12 items-center gap-5 rounded-md border border-slate-300 bg-white/90 px-6 py-3.5 font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:border-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950">
              Start a conversation <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" size={17} aria-hidden="true" />
            </a>
          </div>

          <dl className="mt-12 grid max-w-[46rem] grid-cols-1 border-t border-slate-300/80 pt-5 sm:grid-cols-3 sm:pt-0">
            {capabilities.map(({ icon: Icon, title, detail }, index) => (
              <div key={title} className={`grid grid-cols-[3rem_1fr] items-center gap-4 py-3 sm:py-5 sm:px-5 ${index === 0 ? "sm:pl-0" : "border-t border-slate-300/80 sm:border-l sm:border-t-0"}`}>
                <span className="grid size-12 place-items-center rounded-full bg-[#eaf1ff] text-[#2f5bff]" aria-hidden="true">
                  <Icon size={21} strokeWidth={1.8} />
                </span>
                <div>
                  <dt className="text-sm font-semibold tracking-[-0.01em] text-slate-950">{title}</dt>
                  <dd className="mt-1 text-xs leading-5 text-slate-500">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
