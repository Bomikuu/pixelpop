import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { education, experience } from "../portfolioData";
import Reveal from "./Reveal";

function Timeline({ title, items, type }) {
  const isExperience = type === "experience";
  const Icon = isExperience ? BriefcaseBusiness : GraduationCap;

  return (
    <section>
      <header className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center bg-[#1570ef] text-white" aria-hidden="true">
          <Icon size={23} strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-[#081a30]">{title}</h3>
          <p className="mt-1 text-sm text-[#52677d]">{isExperience ? "Roles, products, and impact over time." : "The foundation that started the journey."}</p>
        </div>
      </header>

      <ol className="relative ml-6 mt-10 space-y-12 border-l border-[#b8cce2] pl-10 sm:space-y-14">
        {items.map((item) => {
          const highlighted = isExperience && item.period.toLowerCase().includes("present");

          return (
            <li key={`${item.period}-${item.company || item.school}`} className="portfolio-stagger-item relative">
              <span className="absolute -left-[2.95rem] top-1 grid size-3.5 place-items-center" aria-hidden="true">
                {highlighted ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-[#1570ef]/35 motion-safe:animate-ping" />
                    <span className="relative size-3.5 rounded-full bg-[#1570ef] shadow-[0_0_18px_5px_rgba(21,112,239,0.5)] ring-4 ring-[#fbfdff]" />
                  </>
                ) : (
                  <span className="size-3.5 rounded-full bg-[#a9bfd6] ring-4 ring-[#fbfdff]" />
                )}
              </span>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7f95]">{item.period.replace(/[—–]/g, "-")}</span>
                {highlighted ? (
                  <span className="bg-[#edf5ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1570ef]">Current</span>
                ) : null}
              </div>
              <strong className="mt-2 block text-lg text-[#081a30]">{isExperience ? item.company : item.school}</strong>
              <span className="mt-1 block text-sm font-semibold text-[#1570ef]">{isExperience ? item.title : item.program}</span>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#52677d]">{isExperience ? item.detail : item.note}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function TimelineSection() {
  return (
    <section
      className="relative isolate overflow-hidden border-t border-[#9fb9d4] bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
      style={{
        backgroundImage: "linear-gradient(rgba(21, 112, 239, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 112, 239, 0.08) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }}
      aria-labelledby="experience-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,253,255,0.98)_0%,rgba(251,253,255,0.8)_54%,rgba(251,253,255,0.24)_86%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[1] hidden 2xl:block text-[10px] font-semibold uppercase leading-[1.7] tracking-[0.24em] text-[#6b93c2]" aria-hidden="true">
        <p className="absolute left-10 top-40 m-0">Ideas<br />People<br />Products<br />Impact</p>
        <p className="absolute right-10 top-24 m-0 text-right">Build<br />Learn<br />Create<br />Repeat</p>
        <p className="absolute bottom-12 left-10 m-0">A better<br />tomorrow</p>
        <p className="absolute bottom-12 right-10 m-0 text-right">Continuous growth<br />through experience</p>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="max-w-4xl">
            <h2 id="experience-title" className="portfolio-display max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#081a30] sm:text-6xl lg:text-7xl">
              Experience built across products, teams, and <span className="text-[#1570ef]">industries.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52677d]">Professional experience from 2018 to present, paired with the education that started the foundation.</p>
          </header>
        </Reveal>

        <div className="mt-16 max-w-5xl space-y-16 sm:mt-20 sm:space-y-24">
          <Reveal stagger><Timeline title="Professional experience" items={experience} type="experience" /></Reveal>
          <Reveal stagger delay={1}><Timeline title="Education" items={education} type="education" /></Reveal>
        </div>
      </div>
    </section>
  );
}
