import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { processSteps } from "../portfolioData";
import Reveal from "./Reveal";

const formatStep = (index) => String(index + 1).padStart(2, "0");

export default function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = processSteps[activeStep];

  return (
    <section
      id="process"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
      style={{
        backgroundImage: "linear-gradient(rgba(21, 112, 239, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 112, 239, 0.08) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }}
      aria-labelledby="process-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,253,255,0.97)_0%,rgba(251,253,255,0.76)_48%,rgba(251,253,255,0.2)_82%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="mx-auto max-w-4xl text-center">
            <h2 id="process-title" className="portfolio-display text-4xl font-semibold tracking-[-0.035em] text-[#081a30] sm:text-5xl lg:text-6xl">How I <span className="text-[#2f5bff]">work.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#52677d]">A structured workflow that connects product thinking, frontend craft, validation, and measurable improvement.</p>
          </header>
        </Reveal>

        <Reveal className="mt-14" stagger>
          <div className="portfolio-process-runway before:!bg-[#b8cce2]" role="tablist" aria-label="Product delivery process">
            {processSteps.map((item, index) => {
              const selected = index === activeStep;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`portfolio-process-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="portfolio-process-panel"
                  className="portfolio-process-step portfolio-stagger-item group focus:outline-none focus-visible:!outline-none"
                  data-active={selected}
                  onClick={() => setActiveStep(index)}
                >
                  <span className={`portfolio-process-step__number group-focus-visible:!ring-4 group-focus-visible:!ring-[#1570ef]/20 group-focus-visible:!ring-offset-2 group-focus-visible:!ring-offset-[#fbfdff] ${selected ? "!border-[#1570ef] !bg-[#1570ef] !text-white !shadow-[0_0_0_7px_rgba(21,112,239,0.14)]" : "!border-[#a9bfd6] !bg-white !text-[#385474] group-hover:!border-[#1570ef] group-hover:!bg-[#edf5ff] group-hover:!text-[#1570ef]"}`}>{formatStep(index)}</span>
                  <span className={`mt-3 hidden text-xs font-semibold transition lg:block ${selected ? "text-[#1570ef]" : "text-[#52677d] group-hover:text-[#1570ef]"}`}>{item.title}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={1}>
          <div id="portfolio-process-panel" role="tabpanel" aria-labelledby={`portfolio-process-tab-${step.id}`} className="grid overflow-hidden rounded-2xl border border-[#b8cce2] bg-white shadow-[0_28px_70px_-50px_rgba(8,26,48,0.55)] lg:grid-cols-[0.86fr_1.14fr]">
            <div className="bg-white p-7 sm:p-10 lg:p-12">
              <div className="flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#b8cce2] bg-[#edf5ff] text-lg font-semibold text-[#1570ef]">{formatStep(activeStep)}</span>
                <div><span className="text-sm font-semibold text-[#1570ef]">{step.shortTitle}</span><h3 className="portfolio-display mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#081a30] sm:text-4xl">{step.title}</h3></div>
              </div>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#52677d]">{step.description}</p>
              <ul className="mt-8 space-y-4 border-t border-[#d6e1ec] pt-7">
                {step.points.map((point) => <li key={point} className="flex items-center gap-3 text-sm text-[#385474]"><CheckCircle2 size={19} className="shrink-0 text-[#1570ef]" aria-hidden="true" />{point}</li>)}
              </ul>
              <div className="mt-9 rounded-xl border border-[#b8cce2] bg-[#edf5ff] p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1570ef]">Outcome</span>
                <strong className="mt-2 block text-lg text-[#081a30]">{step.outcome}</strong>
              </div>
            </div>

            <div className="portfolio-process-visual relative min-h-[27rem] overflow-hidden bg-[#101a2d]">
              <img key={step.image} src={step.image} width="854" height="787" loading="lazy" decoding="async" alt={step.imageAlt} className="portfolio-media-enter absolute inset-0 size-full object-cover object-center" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,30,0.06),rgba(8,15,30,0.02)_42%,rgba(8,15,30,0.48)),linear-gradient(0deg,rgba(8,15,30,0.9),transparent_58%)]" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080f1e] via-[#080f1e]/80 to-transparent p-7 pt-32 sm:p-10 lg:p-12">
                <span className="portfolio-display text-7xl font-semibold tracking-[-0.04em] text-white/35">{formatStep(activeStep)}</span>
                <h3 className="portfolio-display mt-2 max-w-lg text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{step.shortTitle}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">The goal is not more process. It is enough shared clarity to make strong decisions and move with confidence.</p>
                <a href="#contact" className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Discuss your product <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
