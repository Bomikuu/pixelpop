import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AstaPage } from "./AstaChrome";
import AstaReveal from "./AstaReveal";
import { AgencyProcess } from "./AstaAgencySections";
import AstaCareersSection from "./components/AstaCareersSection";
import AstaGallerySection from "./components/AstaGallerySection";
import AstaHeroScene from "./components/AstaHeroScene";
import AstaServicesSection from "./components/AstaServicesSection";
import AstaTeamSection from "./components/AstaTeamSection";
import AstaTechnologySection from "./components/AstaTechnologySection";
import AstaTestimonialsSection from "./components/AstaTestimonialsSection";
import AstaProjectInquiryModal from "./components/AstaProjectInquiryModal";
import useAstaPageMeta from "./useAstaPageMeta";
import "./asta.css";
import "./astaLanding.css";

function AgencyHero({ onStartProject }) {
  return (
    <section
      className="relative isolate h-[calc(100svh-4.5rem)] min-h-[680px] overflow-hidden bg-[#061427] text-white"
      aria-labelledby="asta-agency-title"
    >
      <AstaHeroScene />
      <AstaReveal className="absolute inset-x-0 bottom-0 z-[2] flex min-h-[48%] items-end bg-[#071a33]/95 px-5 pb-10 pt-12 sm:px-8 sm:pb-12 lg:right-auto lg:min-h-[46%] lg:w-1/2 lg:items-center lg:pb-14 lg:pl-[max(3rem,calc((100vw-1320px)/2))] lg:pr-[12vw] lg:pt-14 lg:[clip-path:polygon(0_0,72%_0,100%_100%,0_100%)]">
        <div className="max-w-[34rem]">
          <h1
            id="asta-agency-title"
            className="m-0 text-[clamp(3rem,5vw,5.25rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-white"
          >
            <span className="block text-[#8fc4ff]">ASTA</span>
            <span className="block">Softwares</span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-base leading-7 text-[#c5d7e8]">
            We build custom software around how your team and business actually work.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#8fc4ff]/30 pt-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#8faac5]">
            <span>Product strategy</span>
            <span>Interface engineering</span>
            <span>Established 2021</span>
          </div>
          <button
            className="group mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-[3px] bg-[#1570ef] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0b55c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff]"
            type="button"
            onClick={onStartProject}
          >
            Start a project
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={18} aria-hidden="true" />
          </button>
        </div>
      </AstaReveal>
    </section>
  );
}

export default function AstaLandingPage() {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const projectDialogOpenerRef = useRef(null);

  function openProjectDialog(event) {
    projectDialogOpenerRef.current = event.currentTarget;
    setProjectDialogOpen(true);
  }

  function closeProjectDialog() {
    setProjectDialogOpen(false);
    requestAnimationFrame(() => projectDialogOpenerRef.current?.focus());
  }

  useAstaPageMeta({
    title: "ASTA Softwares | Custom Software and Web Products",
    description: "ASTA Softwares designs and builds custom business systems, web products, and operational tools. Established 2021.",
    canonical: "/asta",
  });

  return (
    <AstaPage variant="agency" onStartProject={openProjectDialog}>
      <main id="main-content">
        <AgencyHero onStartProject={openProjectDialog} />
        <AgencyProcess />
        <AstaServicesSection onStartProject={openProjectDialog} />
        <AstaTechnologySection />
        <AstaTeamSection />
        <AstaGallerySection />
        <AstaTestimonialsSection />
        <AstaCareersSection />
      </main>
      {projectDialogOpen ? <AstaProjectInquiryModal onClose={closeProjectDialog} /> : null}
    </AstaPage>
  );
}
