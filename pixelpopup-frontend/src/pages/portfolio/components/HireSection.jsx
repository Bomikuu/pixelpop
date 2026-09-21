import { createElement } from "react";
import { ArrowRight, BriefcaseBusiness, Code2, Layers3, UsersRound } from "lucide-react";
import Reveal from "./Reveal";

const availabilitySignals = [
  { icon: Code2, value: "Senior", label: "Frontend engineering" },
  { icon: Layers3, value: "Full-stack", label: "Product delivery" },
  { icon: UsersRound, value: "Technical", label: "Leadership and mentorship" },
  { icon: BriefcaseBusiness, value: "8+ years", label: "Professional experience" },
];

export default function HireSection() {
  return (
    <section id="availability" className="relative scroll-mt-24 overflow-hidden bg-[#0b1733] py-20 text-white sm:py-24" aria-labelledby="hire-title">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[#2f5bff]/10" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal stagger>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
            <div>
              <div className="portfolio-stagger-item inline-flex items-center gap-2 border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" /> Available for hire
              </div>
              <h2 id="hire-title" className="portfolio-display portfolio-stagger-item mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                Let&apos;s work together.
              </h2>
              <a href="#contact" className="portfolio-stagger-item group mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3.5 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Start a conversation <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
            </div>

            <dl className="grid border-y border-white/15 sm:grid-cols-2">
              {availabilitySignals.map(({ icon: Icon, value, label }, index) => (
                <div key={label} className={`portfolio-stagger-item flex min-h-36 items-center gap-5 py-6 sm:px-6 ${index % 2 ? "sm:border-l sm:border-white/15" : ""} ${index > 1 ? "border-t border-white/15" : index === 1 ? "border-t border-white/15 sm:border-t-0" : ""}`}>
                  <span className="grid size-12 shrink-0 place-items-center border border-white/15 bg-white/5 text-blue-300" aria-hidden="true">{createElement(Icon, { size: 21 })}</span>
                  <div>
                    <dt className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-white">{value}</dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-400">{label}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
