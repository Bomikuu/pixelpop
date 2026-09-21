import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  GraduationCap,
  MonitorSmartphone,
  Network,
  Quote,
  Search,
} from "lucide-react";
import testimonials from "../../asta/data/testimonials.json";
import { certificationPlan } from "../portfolioData";
import Reveal from "./Reveal";

const orderedTestimonials = [...testimonials].sort((a, b) => a.order - b.order);

const certificationPresentation = {
  "Google Analytics Certification": { icon: BarChart3, category: "Analytics" },
  "AEO Fundamentals": { icon: Search, category: "SEO / AI" },
  "Scrum Fundamentals Certified": { icon: Network, category: "Delivery" },
  "Responsive Web Design": { icon: MonitorSmartphone, category: "Frontend" },
};

function personInitials(name) {
  return name.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

function TestimonialCard({ testimonial, duplicate = false }) {
  return (
    <blockquote
      className="flex min-h-[25rem] w-[21rem] shrink-0 flex-col rounded-2xl border border-blue-300/25 bg-[#091629] p-6 sm:w-[23rem] sm:p-7 xl:w-[24rem]"
      aria-hidden={duplicate || undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-[#2149dc]" aria-hidden="true">
            {personInitials(testimonial.name)}
          </span>
          <div>
            <strong className="block text-sm font-semibold text-white">{testimonial.name}</strong>
            <span className="mt-1 block text-xs leading-5 text-blue-100/60">
              {testimonial.role} · {testimonial.company}
            </span>
          </div>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-400/10 text-blue-300">
          <Quote size={16} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/[0.07] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-blue-200">
          <BadgeCheck size={14} aria-hidden="true" />
          {testimonial.approvalStatus}
        </span>
      </div>
      <p className="mt-6 flex-1 text-[1.05rem] leading-8 text-blue-50/90">“{testimonial.quote}”</p>
      <footer className="mt-7 border-t border-white/15 pt-4 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-blue-100/50">
        Approved client and collaborator feedback
      </footer>
    </blockquote>
  );
}

export default function SignalsSection() {
  return (
    <>
      <section
        className="relative isolate overflow-hidden border-y border-[#9fb9d4] bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
        style={{
          backgroundImage: "linear-gradient(rgba(21, 112, 239, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 112, 239, 0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
        aria-labelledby="certifications-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,253,255,0.98)_0%,rgba(251,253,255,0.82)_54%,rgba(251,253,255,0.3)_88%)]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <header className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20">
              <div>
                <h2 id="certifications-title" className="portfolio-display max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#081a30] sm:text-6xl lg:text-7xl">
                  Continuous learning, <span className="text-[#1570ef]">real-world growth.</span>
                </h2>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-[#52677d]">Certifications, courses, and learning experiences that support my journey as a developer and product builder.</p>
              </div>
              <div className="border-l border-[#b8cce2] pl-7 lg:pb-1">
                <span className="grid size-14 place-items-center bg-[#edf5ff] text-[#1570ef]" aria-hidden="true">
                  <GraduationCap size={27} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#081a30]">A growth mindset</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-[#52677d]">I actively learn and upskill to stay effective, adaptable, and ready for new technical challenges.</p>
              </div>
            </header>
          </Reveal>

          <Reveal stagger className="mt-16 sm:mt-20">
            <div className="border border-[#b8cce2] bg-[#f7fbff]/90 p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center bg-[#edf5ff] text-[#1570ef]" aria-hidden="true">
                  <BadgeCheck size={24} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-[#081a30]">Planned certification path</h3>
                  <p className="mt-1 text-sm leading-6 text-[#52677d]">Recommendations only, not credentials I currently claim.</p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {certificationPlan.map((certification) => {
                  const presentation = certificationPresentation[certification.title] ?? { icon: BadgeCheck, category: "Learning" };
                  const CertificationIcon = presentation.icon;

                  return (
                    <a key={certification.title} href={certification.href} target="_blank" rel="noreferrer" className="portfolio-stagger-item group flex min-h-64 flex-col border border-[#cbd9e8] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#1570ef] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1570ef]">
                      <span className="grid size-14 place-items-center bg-[#f1f6fc] text-[#1570ef]" aria-hidden="true">
                        <CertificationIcon size={27} strokeWidth={1.8} />
                      </span>
                      <strong className="mt-6 block text-lg leading-6 text-[#081a30] transition-colors group-hover:text-[#1570ef]">{certification.title}</strong>
                      <span className="mt-3 block text-sm leading-6 text-[#52677d]">{certification.focus}</span>
                      <span className="mt-auto flex items-end justify-between gap-4 pt-7">
                        <span className="bg-[#edf5ff] px-3 py-1.5 text-xs font-semibold text-[#0b55c7]">{presentation.category}</span>
                        <ArrowUpRight size={18} className="shrink-0 text-[#385474] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1570ef]" aria-hidden="true" />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="reviews"
        className="portfolio-testimonials-section relative isolate overflow-hidden bg-[#071426] py-24 text-white sm:py-32"
        aria-labelledby="reviews-title"
      >
        <div
          className="pointer-events-none absolute left-6 top-52 size-32 bg-[radial-gradient(circle,rgba(96,165,250,0.34)_1px,transparent_1.5px)] bg-[size:18px_18px] opacity-35"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-8 top-14 size-32 bg-[radial-gradient(circle,rgba(96,165,250,0.38)_1px,transparent_1.5px)] bg-[size:18px_18px] opacity-40"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[96rem] px-5 sm:px-8">
          <Reveal>
            <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end lg:gap-16">
              <div>
                <h2
                  id="reviews-title"
                  className="portfolio-display max-w-5xl text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl"
                >
                  What clients and collaborators say about working with me.
                </h2>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100/65">
                  Feedback from approved working relationships across product delivery, frontend engineering, and technical leadership.
                </p>
              </div>

              <div className="border-l border-white/20 pl-7 lg:pb-1">
                <strong className="portfolio-display block text-6xl font-semibold tracking-[-0.04em] text-blue-100">
                  {orderedTestimonials.length}
                </strong>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                  Approved testimonials
                </span>
              </div>
            </header>
          </Reveal>
        </div>

        <Reveal className="mt-14 sm:mt-16">
          <div className="portfolio-testimonial-marquee w-full" aria-label="Client and collaborator testimonials">
            <div className="portfolio-testimonial-track">
              {orderedTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                />
              ))}
              {orderedTestimonials.map((testimonial) => (
                <TestimonialCard
                  key={`${testimonial.id}-duplicate`}
                  testimonial={testimonial}
                  duplicate
                />
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-[96rem] px-5 sm:px-8">
            <div className="mt-7 flex items-center justify-end border-t border-white/15 pt-7">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-blue-100/50">
                Approved feedback from real working relationships
              </span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
