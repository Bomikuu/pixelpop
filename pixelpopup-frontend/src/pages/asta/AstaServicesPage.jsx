import { ArrowRight, Check, CornerDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AstaPage } from "./AstaChrome";
import AstaReveal from "./AstaReveal";
import AstaInteractiveHeroScene from "./components/AstaInteractiveHeroScene";
import AstaProjectInquiryModal from "./components/AstaProjectInquiryModal";
import AstaServiceIcon from "./components/AstaServiceIcon";
import { getServiceHref, serviceCatalog } from "./data/serviceCatalog";
import useAstaPageMeta from "./useAstaPageMeta";
import useAstaProjectDialog from "./useAstaProjectDialog";
import "./asta.css";
import "./astaLanding.css";

const featuredServices = serviceCatalog.filter((service) => service.featured);
const supportingServices = serviceCatalog.filter((service) => !service.featured);

export default function AstaServicesPage() {
  const { projectDialogOpen, openProjectDialog, closeProjectDialog } = useAstaProjectDialog();

  useAstaPageMeta({
    title: "Software Services | ASTA Softwares",
    description: "Explore ASTA Softwares services for browser-based 3D, AI automation, software design, development, maintenance, performance, and technical SEO.",
    canonical: "/asta/services",
  });

  return (
    <AstaPage variant="agency" onStartProject={openProjectDialog}>
      <main id="main-content" className="overflow-x-clip bg-[#f4f7fb] text-[#081a30]">
        <section className="relative isolate min-h-[calc(100svh-64px)] overflow-hidden bg-[#061427] text-white" aria-labelledby="asta-services-page-title">
          <AstaInteractiveHeroScene variant="services" />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(4,19,37,0.99)_0%,rgba(4,19,37,0.9)_38%,rgba(4,19,37,0.42)_66%,rgba(4,19,37,0.08)_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 left-[54%] z-[1] hidden w-px bg-[#5da5f6]/25 lg:block" aria-hidden="true" />
          <div className="relative z-[2] mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[1320px] items-end px-5 py-14 sm:px-8 lg:items-center lg:px-10 lg:py-20">
            <AstaReveal className="max-w-[47rem]">
              <h1 id="asta-services-page-title" className="m-0 max-w-[10ch] text-[clamp(3.35rem,7vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-white">
                Software built for real work.
              </h1>
              <p className="mt-7 max-w-[48ch] text-lg leading-8 text-[#c7d9eb]">
                Product engineering, browser-based 3D, and AI workflows shaped around a real operating need.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button className="inline-flex min-h-12 items-center gap-3 bg-[#1570ef] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b55c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]" type="button" onClick={openProjectDialog}>
                  Start a project <ArrowRight size={18} aria-hidden="true" />
                </button>
                <a className="inline-flex min-h-12 items-center gap-3 border border-white/45 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-[#061427] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="#lead-capabilities">
                  Explore capabilities <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </AstaReveal>
          </div>
        </section>

        <section id="lead-capabilities" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="lead-capabilities-title">
          <div className="mx-auto max-w-[1320px]">
            <AstaReveal className="max-w-[55rem]">
              <h2 id="lead-capabilities-title" className="m-0 max-w-[13ch] text-[clamp(2.65rem,5vw,4.7rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-[#081a30]">New interfaces for complex work.</h2>
              <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-[#52677d]">Two focused capabilities for teams that need more than a conventional website or standard application flow.</p>
            </AstaReveal>

            <div className="mt-12 grid border border-[#bfcddd] lg:grid-cols-2">
              {featuredServices.map((service, index) => (
                <AstaReveal
                  as="article"
                  id={service.slug}
                  key={service.id}
                  delay={index * 90}
                  className={`group relative flex min-h-[38rem] scroll-mt-28 flex-col overflow-hidden p-7 sm:p-10 lg:p-12 ${index === 0 ? "bg-[#07172c] text-white" : "border-t border-[#bfcddd] bg-[#eaf4ff] text-[#081a30] lg:border-l lg:border-t-0"}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <span className={`flex h-14 w-14 items-center justify-center ${index === 0 ? "bg-[#1570ef] text-white" : "bg-[#081a30] text-[#8fc4ff]"}`} aria-hidden="true">
                      <AstaServiceIcon name={service.icon} size={27} strokeWidth={1.7} />
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${index === 0 ? "text-[#8fc4ff]" : "text-[#0b62ce]"}`}>0{index + 1}</span>
                  </div>
                  <h3 className={`mb-0 mt-12 max-w-[10ch] text-[clamp(2.5rem,4vw,4.5rem)] font-semibold leading-[0.94] tracking-[-0.04em] ${index === 0 ? "text-white" : "text-[#081a30]"}`}>{service.title}</h3>
                  <p className={`mb-0 mt-5 max-w-[48ch] text-base leading-7 ${index === 0 ? "text-[#bed2e7]" : "text-[#435d76]"}`}>{service.summary}</p>
                  <ul className={`mt-9 grid gap-0 border-t ${index === 0 ? "border-[#294666]" : "border-[#b8cde2]"}`}>
                    {service.features.slice(0, 3).map((feature) => (
                      <li className={`flex items-center gap-3 border-b py-3.5 text-sm ${index === 0 ? "border-[#294666] text-[#d4e4f3]" : "border-[#b8cde2] text-[#314961]"}`} key={feature.id}>
                        <Check className={index === 0 ? "text-[#5da5f6]" : "text-[#1570ef]"} size={16} aria-hidden="true" />
                        {feature.title}
                      </li>
                    ))}
                  </ul>
                  <Link className={`mt-auto inline-flex items-center gap-3 pt-10 text-sm font-semibold outline-none transition-[gap,color] hover:gap-4 focus-visible:underline ${index === 0 ? "text-[#8fc4ff] hover:text-white" : "text-[#0b62ce] hover:text-[#084b9b]"}`} to={getServiceHref(service)}>
                    Explore {service.title} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <span className={`pointer-events-none absolute -bottom-14 -right-8 text-[12rem] font-semibold leading-none tracking-[-0.08em] opacity-[0.035] sm:text-[16rem] ${index === 0 ? "text-white" : "text-[#081a30]"}`} aria-hidden="true">0{index + 1}</span>
                </AstaReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="service-catalog" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-catalog-title">
          <div className="mx-auto max-w-[1320px]">
            <AstaReveal className="max-w-[52rem]">
              <h2 id="service-catalog-title" className="m-0 max-w-[12ch] text-[clamp(2.5rem,5vw,4.4rem)] font-semibold leading-[0.97] tracking-[-0.038em] text-[#081a30]">The rest of the delivery system.</h2>
              <p className="mb-0 mt-5 max-w-[62ch] text-base leading-7 text-[#52677d]">Use one capability independently or combine several into a product engagement with clear ownership and scope.</p>
            </AstaReveal>

            <div className="mt-12 grid border-y border-[#c5d1dd] lg:grid-cols-2">
              {supportingServices.map((service, index) => (
                <AstaReveal as="article" id={service.slug} key={service.id} delay={Math.min(index * 70, 280)} className={`group min-h-[18rem] scroll-mt-28 bg-white p-7 transition-colors duration-200 hover:bg-[#edf5fd] sm:p-9 ${index > 0 ? "border-t border-[#c5d1dd]" : ""} ${index % 2 === 1 ? "lg:border-l" : ""} ${index === 1 ? "lg:border-t-0" : ""}`}>
                  <div className="flex h-full gap-5 sm:gap-7">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e3eef9] text-[#0b62ce] transition-transform duration-200 group-hover:-translate-y-1" aria-hidden="true">
                      <AstaServiceIcon name={service.icon} size={22} strokeWidth={1.8} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs font-semibold tabular-nums text-[#7890a8]">0{index + 3}</span>
                      <h3 className="mb-0 mt-4 text-2xl font-semibold tracking-[-0.025em] text-[#081a30]">{service.title}</h3>
                      <p className="mb-0 mt-3 max-w-[48ch] text-sm leading-6 text-[#52677d]">{service.summary}</p>
                      <Link className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[#0b62ce] outline-none transition-[gap,color] hover:gap-3 hover:text-[#084b9b] focus-visible:underline" to={getServiceHref(service)}>
                        View capability <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </AstaReveal>
              ))}
            </div>
          </div>
        </section>

        <AstaReveal as="section" className="bg-[#0a2a50] px-5 py-16 text-white sm:px-8 lg:py-20" aria-labelledby="service-project-cta-title">
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="m-0 border-l-2 border-[#5da5f6] pl-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#8fc4ff]">Start with the problem</p>
              <h2 id="service-project-cta-title" className="mb-0 mt-6 max-w-[16ch] text-[clamp(2.4rem,4.5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.038em] text-white">Bring us the workflow slowing your team down.</h2>
              <p className="mb-0 mt-5 max-w-[58ch] text-base leading-7 text-[#bed2e7]">We will help separate the immediate bottleneck from the system behind it, then define the smallest useful engagement.</p>
            </div>
            <div className="border-y border-[#3b5f84]">
              {["What is still manual", "Where the process breaks", "What a useful outcome looks like"].map((prompt, index) => (
                <div className="flex items-center gap-4 border-b border-[#3b5f84] py-4 last:border-b-0" key={prompt}>
                  <span className="text-xs font-semibold tabular-nums text-[#8fc4ff]">0{index + 1}</span>
                  <span className="text-sm text-[#d7e5f2]">{prompt}</span>
                </div>
              ))}
              <button className="mt-6 inline-flex min-h-12 w-full items-center justify-between bg-white px-5 py-3 text-sm font-semibold text-[#081a30] transition-colors hover:bg-[#dbeaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto sm:min-w-[15rem]" type="button" onClick={openProjectDialog}>
                Start a project <CornerDownRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </AstaReveal>
      </main>
      {projectDialogOpen ? <AstaProjectInquiryModal onClose={closeProjectDialog} /> : null}
    </AstaPage>
  );
}
