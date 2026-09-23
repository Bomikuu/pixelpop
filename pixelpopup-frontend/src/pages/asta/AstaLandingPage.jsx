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
      className="relative isolate min-h-[720px] overflow-hidden bg-[#061427] text-white max-md:min-h-[calc(100svh-4.25rem)]"
      aria-labelledby="asta-agency-title"
    >
      <AstaHeroScene />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#102238_0%,rgba(11,29,51,0.96)_34%,rgba(11,29,51,0.16)_68%,transparent_100%)] max-md:bg-[linear-gradient(180deg,rgba(7,26,51,0.28)_0%,#071a33_52%,#071a33_100%)]"
        aria-hidden="true"
      />
      <AstaReveal className="relative z-[2] mx-auto flex min-h-[720px] w-[calc(100%-48px)] max-w-[1454px] items-start pb-16 pt-[114px] max-md:min-h-[calc(100svh-4.25rem)] max-md:items-end max-md:py-12">
        <div className="w-full max-w-[680px]">
          <p className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c1cde0] sm:text-[13px]">
            <span className="h-px w-14 shrink-0 bg-[#6f89a5] sm:w-24" aria-hidden="true" />
            Software for a brighter tomorrow
          </p>
          <h1
            id="asta-agency-title"
            className="!mt-14 text-[clamp(5rem,7vw,7rem)] font-semibold leading-[0.87] tracking-[-0.035em] text-white max-sm:!mt-9 max-sm:text-[clamp(4.5rem,18vw,6.5rem)]"
          >
            <span className="block text-[#59aaff]">ASTA</span>
            <span className="block">Softwares</span>
          </h1>
          <p className="!mt-3 max-w-[38ch] text-[clamp(1.125rem,1.55vw,1.625rem)] leading-[1.42] text-[#bdc9dc] max-sm:max-w-[34ch]">
            We build custom software around real business workflows — helping your team work smarter, move faster, and achieve more.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-0 gap-y-2 border-t border-[#87baff]/20 pt-5 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#b5c4d9] sm:text-[13px]">
            <span>Product strategy</span>
            <span className="mx-5 hidden h-5 w-px bg-[#8ca6c4] sm:block" aria-hidden="true" />
            <span>Interface engineering</span>
            <span className="mx-5 hidden h-5 w-px bg-[#8ca6c4] sm:block" aria-hidden="true" />
            <span>Established 2021</span>
          </div>
          <button
            className="group mt-8 inline-flex min-h-[70px] items-center justify-center gap-7 rounded-md bg-[#0875f5] px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#0b55c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fc4ff] max-sm:min-h-14 max-sm:px-6 max-sm:text-base"
            type="button"
            onClick={onStartProject}
          >
            Start a project
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" size={24} strokeWidth={1.6} aria-hidden="true" />
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
