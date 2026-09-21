import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function ProjectMediaCarousel({
  slides,
  projectName,
  sourceNote = "Product interface captured from the supplied project reference",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailRefs = useRef([]);
  const activeSlide = slides[activeIndex];

  const selectSlide = (index) => {
    const nextIndex = (index + slides.length) % slides.length;
    setActiveIndex(nextIndex);
    thumbnailRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectSlide(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectSlide(activeIndex + 1);
    }
  };

  return (
    <div className="border border-slate-200 bg-white shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)]" role="region" aria-roledescription="carousel" aria-label={`${projectName} product screenshot gallery`} onKeyDown={handleKeyDown}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">Slide {activeIndex + 1} of {slides.length}: {activeSlide.title}</p>

      <div className="grid min-h-16 items-center gap-4 border-b border-slate-200 px-5 py-3 sm:grid-cols-[1fr_auto] sm:px-7">
        <div>
          <strong className="block text-sm text-slate-950">{activeSlide.title}</strong>
          <span className="mt-1 block text-xs text-slate-500">{sourceNote}</span>
        </div>
        <span className="text-xs font-semibold tabular-nums text-slate-500">{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </div>

      <figure>
        <div className="relative aspect-[16/9] overflow-hidden bg-[#eef3f8]">
          <img key={activeSlide.src} src={activeSlide.src} width="1800" height="1013" loading={activeIndex === 0 ? "eager" : "lazy"} decoding="async" alt={activeSlide.alt} className="portfolio-media-enter size-full object-contain" />
        </div>
        <figcaption className="grid gap-5 border-y border-slate-200 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <p className="m-0 max-w-3xl text-sm leading-6 text-slate-600">{activeSlide.caption}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => selectSlide(activeIndex - 1)} className="grid size-11 place-items-center border border-slate-300 text-slate-700 transition-colors hover:border-[#2f5bff] hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" aria-label={`Previous ${projectName} screenshot`}><ArrowLeft size={18} aria-hidden="true" /></button>
            <button type="button" onClick={() => selectSlide(activeIndex + 1)} className="grid size-11 place-items-center border border-slate-300 text-slate-700 transition-colors hover:border-[#2f5bff] hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" aria-label={`Next ${projectName} screenshot`}><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </figcaption>
      </figure>

      <div className="flex gap-3 overflow-x-auto p-4 sm:p-5" aria-label={`Choose a ${projectName} screenshot`}>
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            ref={(node) => { thumbnailRefs.current[index] = node; }}
            type="button"
            onClick={() => selectSlide(index)}
            className={`group relative h-20 w-32 shrink-0 overflow-hidden border-2 bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] sm:h-24 sm:w-40 ${index === activeIndex ? "border-[#2f5bff]" : "border-transparent hover:border-slate-400"}`}
            aria-label={`Show ${slide.title}`}
            aria-pressed={index === activeIndex}
          >
            <img src={slide.src} alt="" width="320" height="180" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
            <span className="absolute bottom-1.5 left-1.5 bg-slate-950/85 px-1.5 py-1 text-[0.65rem] font-semibold tabular-nums text-white">{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
