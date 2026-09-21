import { useState } from "react";
import { ArrowRight, Box, Check, CircleX, Mail, MapPin, MessageSquareText, Monitor, Rocket, Route, ScanSearch, UsersRound } from "lucide-react";
import ApplicationPageShell from "../application/ApplicationPageShell";
import ContactSection from "../components/ContactSection";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import SourceMapScene from "../components/SourceMapScene";
import ProjectMatcher from "./ProjectMatcher";
import { engagementOptions, fitCriteria, problemsSolved, proofPoints } from "./workWithMeData";

const inquiryOptions = [
  "Hire Mico - embedded leadership",
  "Hire Mico - focused product build",
  "Build with ASTA team",
  "Not sure yet",
];

const heroCapabilities = [
  { icon: Monitor, title: "Frontend leadership", detail: "Architecture and interface direction" },
  { icon: Box, title: "Full-stack delivery", detail: "From product decision to production" },
  { icon: UsersRound, title: "Right-sized support", detail: "Direct ownership or an ASTA team" },
];

const engagementWorkflow = [
  { icon: MessageSquareText, title: "Share the context", detail: "Bring the product, constraints, current blockers, and the result that needs to change." },
  { icon: ScanSearch, title: "Clarify the path", detail: "We separate the immediate request from the decisions that materially affect scope." },
  { icon: Route, title: "Build in view", detail: "Delivery stays visible through working increments, direct feedback, and clear trade-offs." },
  { icon: Rocket, title: "Ship with confidence", detail: "We validate the outcome, release responsibly, and leave the next move understandable." },
];

export default function WorkWithMePage() {
  const [preferredPath, setPreferredPath] = useState("Not sure yet");

  const choosePath = (projectType) => {
    setPreferredPath(projectType);
  };

  return (
    <ApplicationPageShell
      title="Work with me"
      description="Work with Mico Ang directly or engage ASTA Softwares for senior frontend leadership, full-stack product delivery, and coordinated software development."
      canonicalPath="/portfolio/work-with-me"
    >
      <section id="top" className="relative isolate min-h-[46rem] overflow-hidden bg-[#07152e] pb-16 pt-36 text-white sm:min-h-[50rem] sm:pb-20 sm:pt-40 lg:min-h-[calc(100svh-4.75rem)]">
        <SourceMapScene />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[#07152e]/90 lg:bg-[linear-gradient(90deg,#07152e_0%,rgba(7,21,46,0.98)_38%,rgba(7,21,46,0.76)_53%,rgba(7,21,46,0.12)_78%,transparent_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_76%_46%,rgba(47,91,255,0.2),transparent_38%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-36 bg-gradient-to-t from-[#07152e] to-transparent" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-[calc(46rem-9rem)] max-w-7xl items-center px-5 sm:min-h-[calc(50rem-10rem)] sm:px-8 lg:min-h-[calc(100svh-14.75rem)]">
          <Reveal className="w-full max-w-[48rem]">

            <h1 className="portfolio-display mt-8 max-w-[10ch] text-[clamp(3.75rem,7.2vw,5.9rem)] font-semibold leading-[0.91] tracking-[-0.04em]">
              <span className="block">Bring me the</span>
              <span className="block text-[#4f8cff]">hard part</span>
              <span className="block">of the product.</span>
            </h1>
            <p className="mt-7 max-w-[39rem] text-lg leading-8 text-blue-100/75 sm:text-xl">
              Senior frontend leadership, full-stack delivery, and a trusted software team when the scope needs more hands.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#ways-to-work" className="group inline-flex min-h-12 items-center gap-5 rounded-md bg-[#2f6fff] px-6 py-3.5 font-semibold text-white shadow-[0_18px_44px_-24px_rgba(47,111,255,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4f8cff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Find the right setup <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href="#project-inquiry" className="group inline-flex min-h-12 items-center gap-5 rounded-md border border-blue-200/35 bg-[#07152e]/55 px-6 py-3.5 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Start a conversation <Mail size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </div>

            <dl className="mt-12 grid max-w-[47rem] border-t border-blue-100/20 pt-5 sm:grid-cols-3 sm:pt-0">
              {heroCapabilities.map(({ icon: Icon, title, detail }, index) => (
                <div key={title} className={`grid grid-cols-[3rem_1fr] items-center gap-4 py-3 sm:px-5 sm:py-5 ${index === 0 ? "sm:pl-0" : "border-t border-blue-100/20 sm:border-l sm:border-t-0"}`}>
                  <span className="grid size-12 place-items-center rounded-xl bg-[#12346d] text-[#67a2ff]" aria-hidden="true">
                    <Icon size={21} strokeWidth={1.8} />
                  </span>
                  <div>
                    <dt className="text-sm font-semibold text-white">{title}</dt>
                    <dd className="mt-1 text-xs leading-5 text-blue-100/60">{detail}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="py-24 sm:py-28 lg:py-32" aria-labelledby="problems-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="problems-title" title="Useful when the product is difficult." description="I work best where interface quality, system thinking, and delivery judgment need to operate together." />
          <Reveal stagger>
            <div className="grid border-y border-slate-200 md:grid-cols-2">
              {problemsSolved.map(({ title, description, icon: Icon }, index) => (
                <article key={title} className={`portfolio-stagger-item grid min-h-56 grid-cols-[auto_1fr] gap-5 py-8 md:px-8 ${index % 2 ? "md:border-l md:border-slate-200" : ""} ${index > 1 ? "border-t border-slate-200" : index === 1 ? "border-t border-slate-200 md:border-t-0" : ""}`}>
                  <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#2f5bff]" aria-hidden="true"><Icon size={22} /></span>
                  <div><h3 className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-slate-950">{title}</h3><p className="mt-3 max-w-md leading-7 text-slate-600">{description}</p></div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="ways-to-work" className="scroll-mt-24 bg-white py-24 sm:py-28 lg:py-32" aria-labelledby="ways-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="ways-title" title="Choose the level of support the work needs." description="Work with me directly for senior hands-on ownership, or bring in ASTA when the roadmap needs a coordinated team." />
          <div className="grid gap-5 lg:grid-cols-3">
            {engagementOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Reveal key={option.id} delay={index}>
                  <article className="group flex min-h-[34rem] h-full flex-col border border-slate-200 bg-[#f8fafc] p-7 text-slate-950 transition duration-300 hover:-translate-y-2 hover:border-[#2f5bff] hover:bg-white hover:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.45)] focus-within:-translate-y-2 focus-within:border-[#2f5bff] sm:p-8">
                    <div>
                      <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#2f5bff] transition duration-300 group-hover:bg-[#2f5bff] group-hover:text-white" aria-hidden="true"><Icon size={22} /></span>
                    </div>
                    <h3 className="portfolio-display mt-8 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">{option.title}</h3>
                    <p className="mt-4 leading-7 text-slate-600">{option.description}</p>
                    <p className="mt-7 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500"><strong className="text-slate-900">Best for:</strong> {option.bestFor}</p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                      {option.includes.map((item) => <li key={item} className="flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#2f5bff]" aria-hidden="true" />{item}</li>)}
                    </ul>
                    <a href="#project-inquiry" onClick={() => choosePath(option.projectType)} className="mt-auto inline-flex min-h-12 w-full items-center justify-between rounded-md bg-[#0b1733] px-5 py-3 font-semibold text-white transition duration-200 hover:bg-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                      Choose this setup <ArrowRight size={18} aria-hidden="true" />
                    </a>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1733] py-24 text-white sm:py-28 lg:py-32" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <h2 id="workflow-title" className="portfolio-display max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              A clear workflow from first context to release.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
              Enough structure to keep decisions visible, without adding process that does not improve the product.
            </p>
          </Reveal>

          <Reveal stagger className="mt-14">
            <ol className="grid border-y border-blue-100/20 lg:grid-cols-4">
              {engagementWorkflow.map(({ icon: Icon, title, detail }, index) => (
                <li key={title} className={`portfolio-stagger-item group relative min-h-72 px-1 py-8 transition duration-300 hover:bg-white/[0.04] sm:px-6 lg:px-7 ${index ? "border-t border-blue-100/20 lg:border-l lg:border-t-0" : ""}`}>
                  <div className="flex items-center justify-between gap-5">
                    <span className="grid size-12 place-items-center rounded-xl bg-[#12346d] text-[#67a2ff] transition duration-300 group-hover:-translate-y-1 group-hover:bg-[#2f5bff] group-hover:text-white" aria-hidden="true"><Icon size={22} /></span>
                    <span className="portfolio-display text-4xl font-semibold text-white/20">0{index + 1}</span>
                  </div>
                  <h3 className="portfolio-display mt-9 text-3xl font-semibold tracking-[-0.025em]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-blue-100/65">{detail}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#eff6ff] py-24 sm:py-28 lg:py-32" aria-labelledby="proof-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="proof-title" title="Evidence from products already in motion." description="The work spans healthcare growth, location intelligence, restaurant operations, and software team leadership." />
          <Reveal stagger>
            <div className="grid overflow-hidden border border-slate-200 bg-white lg:grid-cols-2">
              {proofPoints.map(({ project, result, detail, href, external, icon: Icon }, index) => (
                <a key={project} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={`portfolio-stagger-item group grid min-h-64 content-between p-7 transition hover:bg-[#0b1733] sm:p-9 ${index % 2 ? "lg:border-l lg:border-slate-200" : ""} ${index > 1 ? "border-t border-slate-200" : index === 1 ? "border-t border-slate-200 lg:border-t-0" : ""}`}>
                  <div className="flex items-center justify-between gap-5"><span className="text-sm font-semibold text-[#2f5bff] group-hover:text-blue-300">{project}</span><Icon size={20} className="text-slate-400 group-hover:text-white" aria-hidden="true" /></div>
                  <div className="mt-12"><h3 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-white sm:text-4xl">{result}</h3><p className="mt-4 max-w-xl leading-7 text-slate-600 transition group-hover:text-slate-300">{detail}</p></div>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24 sm:py-28 lg:py-32" aria-labelledby="matcher-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="matcher-title" title="Not sure whether you need one senior lead or a team?" description="Answer four practical questions. The recommendation is a starting point, not a sales gate." />
          <Reveal>
            <ProjectMatcher onChoose={choosePath} />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28 lg:py-32" aria-labelledby="fit-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="fit-title" title="A good working relationship starts with fit." description="Clear expectations protect the product, the people doing the work, and the budget behind it." />
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              ["We will likely work well together if", fitCriteria.good, Check, "bg-[#0b1733] text-white", "text-emerald-300"],
              ["We may not be the right fit if", fitCriteria.notFit, CircleX, "border border-slate-200 bg-[#f8fafc] text-slate-950", "text-slate-400"],
            ].map(([title, items, Icon, surface, iconColor], index) => (
              <Reveal key={title} delay={index}>
                <article className={`h-full p-7 sm:p-10 ${surface}`}>
                  <h3 className="portfolio-display text-3xl font-semibold tracking-[-0.03em]">{title}</h3>
                  <ul className="mt-8 space-y-5">
                    {items.map((item) => <li key={item} className="flex items-start gap-4 leading-7"><Icon size={19} className={`mt-1 shrink-0 ${iconColor}`} aria-hidden="true" />{item}</li>)}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ContactSection
        key={preferredPath}
        id="project-inquiry"
        heading="Tell me what needs to move forward."
        description="Share the problem, the current product stage, and the result you need. I will help determine whether direct senior support or an ASTA team is the better fit."
        formTitle="Start with the project context"
        formSubtitle="No polished brief required. Clear constraints are more useful."
        projectTypeLabel="Preferred working setup"
        projectTypeOptions={inquiryOptions}
        defaultProjectType={preferredPath}
        messageLabel="What is difficult right now?"
        messagePlaceholder="Describe the product, the current blocker, who uses it, and what a useful outcome would look like."
      />
    </ApplicationPageShell>
  );
}
