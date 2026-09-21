import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getPortfolioServiceHref,
  getServiceTechnologies,
  portfolioServiceCatalog,
} from "../services/portfolioServices";
import PortfolioServiceIcon from "../services/PortfolioServiceIcon";
import TechnologyExplorer from "../services/TechnologyExplorer";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-24 border-b border-slate-200 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          title="What I offer."
          description="The same delivery capabilities I help lead at ASTA, offered here through my direct architecture, design, implementation, and technical ownership."
        />
        <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {portfolioServiceCatalog.map((service, index) => (
            <Reveal key={service.id} delay={index % 3} className="h-full">
              <article className="portfolio-service-card group flex h-full min-h-80 flex-col bg-white p-7 sm:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#2f5bff] transition duration-200 group-hover:-translate-y-1 group-hover:bg-[#2f5bff] group-hover:text-white" aria-hidden="true">
                  <PortfolioServiceIcon name={service.icon} size={21} strokeWidth={1.8} />
                </span>
                <h3 className="portfolio-display mt-8 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{service.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{service.summary}</p>
                <div className="mt-6"><TechnologyExplorer technologies={getServiceTechnologies(service).slice(0, 2)} compact /></div>
                <Link to={getPortfolioServiceHref(service)} className="mt-7 inline-flex items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                  View service <ArrowRight size={16} className="text-[#2f5bff] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 flex justify-end">
          <Link to="/portfolio/services" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px">
            Explore all services <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
