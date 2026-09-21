import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AstaPage } from "./AstaChrome";
import AstaReveal from "./AstaReveal";
import AstaInteractiveHeroScene from "./components/AstaInteractiveHeroScene";
import AstaProjectInquiryModal from "./components/AstaProjectInquiryModal";
import AstaServiceIcon from "./components/AstaServiceIcon";
import AstaServicePattern from "./components/AstaServicePattern";
import AstaThreeCarScene from "./components/AstaThreeCarScene";
import AstaThreeShoeScene from "./components/AstaThreeShoeScene";
import { getServiceBySlug, serviceCatalog } from "./data/serviceCatalog";
import useAstaPageMeta from "./useAstaPageMeta";
import useAstaProjectDialog from "./useAstaProjectDialog";
import "./asta.css";
import "./astaLanding.css";

function ServiceDetail({ service }) {
  const { projectDialogOpen, openProjectDialog, closeProjectDialog } = useAstaProjectDialog();
  const currentIndex = serviceCatalog.findIndex((entry) => entry.id === service.id);
  const nextService = serviceCatalog[(currentIndex + 1) % serviceCatalog.length];
  const heroDetails = service.features.slice(0, 3);

  useAstaPageMeta({
    title: `${service.title} | ASTA Softwares`,
    description: service.summary,
    canonical: `/asta/services/${service.slug}`,
  });

  return (
    <AstaPage variant="agency" onStartProject={openProjectDialog}>
      <main id="main-content" className="bg-white text-[#081a30]">
        <section className="relative isolate min-h-[calc(100svh-64px)] overflow-hidden bg-[#061427] text-white" aria-labelledby="service-title">
          <AstaInteractiveHeroScene variant={`service-banner-${service.slug}`} />
          <AstaServicePattern variant="hero" tone="dark" />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(3,16,31,0.99)_0%,rgba(3,16,31,0.95)_39%,rgba(3,16,31,0.55)_66%,rgba(3,16,31,0.14)_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 left-[52%] z-[1] hidden w-px bg-[#5da5f6]/20 lg:block" aria-hidden="true" />
          <div className="relative z-[2] grid min-h-[calc(100svh-64px)] w-full grid-rows-[1fr_auto] px-5 pb-8 pt-12 sm:px-8 sm:pb-10 lg:px-[clamp(2.5rem,6vw,7.5rem)] lg:pb-12 lg:pt-16">
            <AstaReveal className="flex w-full max-w-[52rem] flex-col justify-center py-12 lg:py-16">
              <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#8fc4ff] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]" to="/asta/services"><ArrowLeft size={16} aria-hidden="true" /> All services</Link>
              <h1 id="service-title" className="mb-0 mt-8 max-w-[12ch] text-balance text-[clamp(3rem,6.5vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-white">{service.title}</h1>
              <p className="mb-0 mt-7 max-w-[52ch] text-base leading-7 text-[#c5d7e8] sm:text-lg sm:leading-8">{service.summary}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button className="inline-flex min-h-12 items-center gap-3 bg-[#1570ef] px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#0b55c7] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]" type="button" onClick={openProjectDialog}>
                  Start a project <ArrowRight size={18} aria-hidden="true" />
                </button>
                <a className="inline-flex min-h-12 items-center gap-3 border border-white/45 px-6 py-3 text-sm font-semibold text-white transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#061427] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="#service-overview-title">
                  See the scope <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </AstaReveal>
            <AstaReveal delay={100} className="grid border-y border-white/20 bg-[#061427]/45 sm:grid-cols-3">
              {heroDetails.map((detail, index) => (
                <article className={`flex min-h-[7.5rem] gap-4 py-5 sm:px-6 ${index > 0 ? "border-t border-white/20 sm:border-l sm:border-t-0" : ""}`} key={detail.id}>
                  <AstaServiceIcon className="mt-1 shrink-0 text-[#5da5f6]" name={detail.icon} size={21} strokeWidth={1.7} aria-hidden="true" />
                  <div>
                    <h2 className="m-0 text-sm font-semibold text-white">{detail.title}</h2>
                    <p className="mb-0 mt-2 max-w-[34ch] text-xs leading-5 text-[#9eb7cf]">{detail.description}</p>
                  </div>
                </article>
              ))}
            </AstaReveal>
          </div>
        </section>

        <section className="relative isolate overflow-hidden px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-overview-title">
          <AstaServicePattern variant="overview" />
          <div className="relative z-[1] mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <AstaReveal>
              <p className="m-0 text-sm font-semibold text-[#0b62ce]">{service.title}</p>
              <h2 id="service-overview-title" className="mb-0 mt-4 max-w-[14ch] text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-[#081a30]">{service.overview.title}</h2>
            </AstaReveal>
            <AstaReveal delay={90} className="border-t border-[#cbd6e1] pt-7 lg:mt-2">
              {service.overview.paragraphs.map((paragraph) => <p className="mt-0 max-w-[67ch] text-base leading-8 text-[#52677d] last:mb-0" key={paragraph}>{paragraph}</p>)}
              <button className="mt-7 inline-flex min-h-12 items-center gap-3 bg-[#081a30] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123b67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1570ef]" type="button" onClick={openProjectDialog}>
                Discuss your requirements <ArrowRight size={17} aria-hidden="true" />
              </button>
            </AstaReveal>
          </div>
        </section>

        {service.slug === "threejs-development" ? (
          <section className="relative isolate overflow-hidden bg-[#061427] px-5 py-20 text-white sm:px-8 lg:py-28" aria-labelledby="threejs-scene-title">
            <AstaServicePattern variant="showcase" tone="dark" />
            <div className="relative z-[1] mx-auto grid max-w-[1320px] border border-[#294666] lg:grid-cols-[0.82fr_1.18fr]">
              <AstaReveal className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#8fc4ff]">Rendered in the browser</p>
                  <h2 id="threejs-scene-title" className="mb-0 mt-6 max-w-[11ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-white">A small scene people can explore.</h2>
                  <p className="mb-0 mt-6 max-w-[48ch] text-base leading-7 text-[#bed2e7]">This stylized car is assembled from lightweight geometry and rendered live with Three.js. Move across the scene to change its angle.</p>
                </div>
                <dl className="mb-0 mt-10 grid border-t border-[#294666] sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    ["01", "Purposeful interaction"],
                    ["02", "Performance-aware rendering"],
                    ["03", "Reduced-motion fallback"],
                  ].map(([number, label]) => (
                    <div className="flex gap-4 border-b border-[#294666] py-4" key={number}>
                      <dt className="text-xs font-semibold text-[#5da5f6]">{number}</dt>
                      <dd className="m-0 text-sm text-[#d7e5f2]">{label}</dd>
                    </div>
                  ))}
                </dl>
              </AstaReveal>
              <AstaReveal delay={90} className="border-t border-[#294666] lg:border-l lg:border-t-0">
                <AstaThreeCarScene />
              </AstaReveal>
            </div>
            <div id="threejs-shoe-scene" className="relative z-[1] mx-auto grid max-w-[1320px] scroll-mt-20 border-x border-b border-[#294666] lg:grid-cols-[1.18fr_0.82fr]">
              <AstaReveal delay={70} className="border-b border-[#294666] lg:border-b-0 lg:border-r">
                <AstaThreeShoeScene />
              </AstaReveal>
              <AstaReveal delay={140} className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#8fc4ff]">Product visualization</p>
                  <h2 className="mb-0 mt-6 max-w-[12ch] text-[clamp(2.35rem,4.5vw,4.25rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-white">A real product model, built for the browser.</h2>
                  <p className="mb-0 mt-6 max-w-[48ch] text-base leading-7 text-[#bed2e7]">This compact PBR shoe model combines detailed geometry, material textures, responsive studio lighting, and direct manipulation while staying small enough to load only when this section approaches the viewport.</p>
                </div>
                <dl className="mb-0 mt-10 grid border-t border-[#294666] sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    ["01", "13.5K model vertices"],
                    ["02", "557 KB compressed GLB"],
                    ["03", "Lazy load and offscreen pause"],
                  ].map(([number, label]) => (
                    <div className="flex gap-4 border-b border-[#294666] py-4" key={number}>
                      <dt className="text-xs font-semibold text-[#5da5f6]">{number}</dt>
                      <dd className="m-0 text-sm text-[#d7e5f2]">{label}</dd>
                    </div>
                  ))}
                </dl>
              </AstaReveal>
            </div>
          </section>
        ) : null}

        {service.aiExpertise?.length ? (
          <section className="relative isolate overflow-hidden border-y border-[#cbd6e1] bg-[#eaf4ff] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="ai-expertise-title">
            <AstaServicePattern variant="expertise" />
            <div className="relative z-[1] mx-auto max-w-[1320px]">
              <AstaReveal className="max-w-[56rem]">
                <h2 id="ai-expertise-title" className="m-0 max-w-[13ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-[#081a30]">AI platforms and patterns we work with.</h2>
                <p className="mb-0 mt-5 max-w-[66ch] text-base leading-7 text-[#52677d]">The right model and orchestration approach depends on the task, data permissions, latency, cost, and review requirements.</p>
              </AstaReveal>
              <div className="mt-12 grid border-y border-[#b8cde2] lg:grid-cols-2">
                {service.aiExpertise.map((item, index) => (
                  <AstaReveal as="article" key={item.id} delay={Math.min(index * 70, 280)} className={`group flex min-h-[12rem] gap-5 bg-white/55 p-7 transition-colors duration-200 hover:bg-white sm:p-8 ${index > 0 ? "border-t border-[#b8cde2]" : ""} ${index % 2 === 1 ? "lg:border-l" : ""} ${index === 1 ? "lg:border-t-0" : ""}`}>
                    <span className="text-xs font-semibold tabular-nums text-[#0b62ce]">0{index + 1}</span>
                    <div>
                      <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-[#081a30]">{item.name}</h3>
                      <p className="mb-0 mt-3 max-w-[48ch] text-sm leading-6 text-[#52677d]">{item.detail}</p>
                    </div>
                  </AstaReveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="relative isolate overflow-hidden bg-[#f4f7fb] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-features-title">
          <AstaServicePattern variant="features" />
          <div className="relative z-[1] mx-auto max-w-[1320px]">
            <AstaReveal className="max-w-[52rem]">
              <h2 id="service-features-title" className="m-0 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-[#081a30]">What the engagement can include.</h2>
              <p className="mb-0 mt-5 max-w-[65ch] text-base leading-7 text-[#52677d]">The exact scope is selected around the system, team, and outcome. These are the core capabilities we can bring into the work.</p>
            </AstaReveal>
            <div className="mt-10 grid gap-px border border-[#d4dee8] bg-[#d4dee8] md:grid-cols-2 lg:grid-cols-3">
              {service.features.map((feature, index) => (
                <AstaReveal as="article" key={feature.id} delay={Math.min(index * 70, 280)} className="group min-h-[14rem] bg-white p-7 transition-colors duration-200 hover:bg-[#f7fbff] sm:p-8">
                  <AstaServiceIcon className="text-[#1570ef] transition-transform duration-200 group-hover:-translate-y-1" name={feature.icon} size={26} strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="mb-0 mt-7 text-xl font-semibold tracking-[-0.02em] text-[#081a30]">{feature.title}</h3>
                  <p className="mb-0 mt-3 text-sm leading-6 text-[#52677d]">{feature.description}</p>
                </AstaReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-[#071c34] px-5 py-16 text-white sm:px-8 lg:py-20" aria-labelledby="service-banner-title">
          <AstaServicePattern variant="banner" tone="dark" />
          <AstaReveal className="relative z-[1] mx-auto flex max-w-[1320px] flex-col justify-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="service-banner-title" className="m-0 max-w-[20ch] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-[2.75rem]">{service.banner.title}</h2>
              <p className="mb-0 mt-3 max-w-[62ch] text-[#bed2e7]">{service.banner.description}</p>
            </div>
            <button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-white px-6 py-3 text-sm font-semibold text-[#081a30] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#dbeaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" type="button" onClick={openProjectDialog}>
              {service.banner.ctaLabel} <ArrowRight size={18} aria-hidden="true" />
            </button>
          </AstaReveal>
        </section>

        <section className="relative isolate overflow-hidden px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="service-faq-title">
          <AstaServicePattern variant="faq" />
          <div className="relative z-[1] mx-auto max-w-[960px]">
            <AstaReveal className="text-center">
              <h2 id="service-faq-title" className="m-0 text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-[-0.035em] text-[#081a30]">Frequently asked questions.</h2>
              <p className="mb-0 mt-4 text-[#52677d]">Practical answers about how this service is scoped and delivered.</p>
            </AstaReveal>
            <div className="mt-10 border-t border-[#cbd6e1]">
              {service.faqs.map((faq, index) => (
                <AstaReveal key={faq.id} delay={Math.min(index * 60, 240)}>
                  <details className="group border-b border-[#cbd6e1]">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-semibold text-[#081a30] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1570ef] [&::-webkit-details-marker]:hidden">
                      {faq.question}<ChevronDown className="shrink-0 text-[#1570ef] transition-transform duration-200 group-open:rotate-180" size={20} aria-hidden="true" />
                    </summary>
                    <p className="mt-0 max-w-[70ch] pb-6 pr-10 text-sm leading-7 text-[#52677d]">{faq.answer}</p>
                  </details>
                </AstaReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-t border-[#d6dfe8] bg-[#f4f7fb] px-5 py-12 sm:px-8" aria-label="Next service">
          <AstaServicePattern variant="next" />
          <AstaReveal className="relative z-[1] mx-auto flex max-w-[1320px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#52677d]"><CheckCircle2 className="text-[#1570ef]" size={20} aria-hidden="true" /> Explore another capability</div>
            <Link className="inline-flex items-center gap-3 text-lg font-semibold text-[#081a30] transition-colors hover:text-[#0b62ce] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1570ef]" to={`/asta/services/${nextService.slug}`}>{nextService.title} <ArrowRight size={19} aria-hidden="true" /></Link>
          </AstaReveal>
        </section>
      </main>
      {projectDialogOpen ? <AstaProjectInquiryModal onClose={closeProjectDialog} /> : null}
    </AstaPage>
  );
}

export default function AstaServiceDetailPage() {
  const { serviceSlug } = useParams();
  const service = getServiceBySlug(serviceSlug);
  if (!service) return <Navigate to="/asta/services" replace />;
  return <ServiceDetail service={service} />;
}
