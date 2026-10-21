import { useState } from "react";
import { ArrowRight, CheckCircle2, Code2, ListChecks, PanelsTopLeft, Rocket, Search, ShieldCheck } from "lucide-react";
import { processSteps } from "../portfolioData";
import Reveal from "./Reveal";

const processIcons = {
  discovery: Search,
  planning: ListChecks,
  experience: PanelsTopLeft,
  development: Code2,
  validation: ShieldCheck,
  launch: Rocket,
};

export default function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = processSteps[activeStep];

  const handleTabKey = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % processSteps.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + processSteps.length) % processSteps.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = processSteps.length - 1;
    else return;
    event.preventDefault();
    setActiveStep(next);
    document.getElementById(`portfolio-process-tab-${processSteps[next].id}`)?.focus();
  };

  return (
    <section id="process" className="scroll-mt-24 border-b border-slate-200 bg-[#fbfdff] py-24 text-slate-950 sm:py-32" aria-labelledby="process-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="mx-auto max-w-3xl text-center">
            <h2 id="process-title" className="portfolio-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">How I <span className="text-[#2f5bff]">work.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">We agree on what needs building, review the work as it develops, and check it before release.</p>
          </header>
        </Reveal>
        <Reveal className="mt-10">
          <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-2.5" role="tablist" aria-label="Product delivery process">
            {processSteps.map((item, index) => {
              const selected = index === activeStep;
              const Icon = processIcons[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`portfolio-process-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="portfolio-process-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-[#2f5bff] bg-[#2f5bff] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950"}`}
                  onClick={() => setActiveStep(index)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                >
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                  {item.title}
                </button>
              );
            })}
          </div>
        </Reveal>
        <Reveal className="mt-8">
          <div id="portfolio-process-panel" role="tabpanel" tabIndex={0} aria-labelledby={`portfolio-process-tab-${step.id}`} className="grid gap-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] lg:grid-cols-2 lg:gap-12">
            <div className="py-4">
              <h3 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{step.shortTitle}</h3>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{step.description}</p>
              <ul className="mt-7 space-y-4">
                {step.points.map((point) => <li key={point} className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 size={19} className="shrink-0 text-[#2f5bff]" aria-hidden="true" />{point}</li>)}
              </ul>
              <p className="mt-8 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-600">Result: <strong className="font-semibold text-slate-950">{step.outcome}</strong>.</p>
              <a href="#contact" className="mt-6 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">Discuss your project <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <img key={step.image} src={step.image} width="854" height="787" loading="lazy" decoding="async" alt={step.imageAlt} className="h-full max-h-[28rem] w-full rounded-lg object-cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
