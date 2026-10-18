import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import SourceMapScene from "./SourceMapScene";

export default function HeroSection() {
  return (
    <section id="top" className="portfolio-hero-surface relative isolate min-h-svh overflow-hidden border-b border-slate-200 bg-white pt-[4.75rem]">
      <SourceMapScene />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.76)_49%,rgba(255,255,255,0.18)_70%,transparent_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-t from-white via-white/70 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.75rem)] max-w-7xl items-center px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <Reveal immediate className="flex w-full max-w-[47rem] flex-col justify-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              Davao City, Philippines
            </span>
            <span className="size-1 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Available for remote work</span>
          </div>
          <h1 className="portfolio-display mt-7 max-w-[9ch] text-[clamp(3.75rem,7.4vw,5.75rem)] font-semibold leading-[0.91] tracking-[-0.04em] text-slate-950">
            <span className="block">Meet</span>
            <span className="block text-[#2f5bff]">Mico Ang.</span>
          </h1>
          <p className="mt-7 max-w-[38rem] text-lg leading-8 text-slate-600 sm:text-xl">
            I'm a senior frontend developer and technical lead. I build web applications with React, Vue, and Django.
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

        </Reveal>
      </div>
    </section>
  );
}
