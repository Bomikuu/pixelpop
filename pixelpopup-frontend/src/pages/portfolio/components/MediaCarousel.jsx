import { useState } from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";

export default function MediaCarousel({ slides, label, imageFit = "contain" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  const move = (direction) => {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)]" role="region" aria-roledescription="carousel" aria-label={`${label} screenshot carousel`}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {activeIndex + 1} of {slides.length}: {activeSlide.title || `${label} team photo`}
      </p>
      <div className="relative flex min-h-14 items-center justify-center border-b border-slate-200 bg-slate-50 px-24">
        <span className="absolute left-5 flex items-center gap-2" aria-hidden="true">
          <span className="size-3 rounded-full border border-[#b42318] bg-[#ff5f57] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
          <span className="size-3 rounded-full border border-[#b7791f] bg-[#febc2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
          <span className="size-3 rounded-full border border-[#16803c] bg-[#28c840] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
        </span>
        <span className="max-w-full truncate text-center text-sm font-semibold text-slate-700">{label}</span>
        <span className="absolute right-5 text-xs font-semibold tabular-nums text-slate-500">{activeIndex + 1} / {slides.length}</span>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {activeSlide.placeholder ? (
          <div key={activeSlide.title} className="portfolio-media-enter portfolio-placeholder absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <span className="grid size-14 place-items-center bg-white text-[#2f5bff] shadow-sm">
              <ImageIcon size={24} />
            </span>
            <strong className="mt-5 text-base text-slate-900">Project screenshot ready to add</strong>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{activeSlide.caption || "Replace this placeholder with a real product capture."}</p>
          </div>
        ) : (
          <img
            key={activeSlide.src}
            src={activeSlide.src}
            width="1800"
            height="1125"
            loading="lazy"
            decoding="async"
            alt={activeSlide.alt}
            className={`portfolio-media-enter size-full ${imageFit === "cover" ? "object-cover" : "object-contain"}`}
          />
        )}
      </div>

      <div className="grid gap-5 border-t border-slate-200 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <strong className="block text-sm text-slate-950">{activeSlide.title || `${label} team photo`}</strong>
          <p className="mt-1 text-sm leading-6 text-slate-500">{activeSlide.caption || "A look at the people building ASTA Softwares together."}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="grid size-10 place-items-center border border-slate-300 text-slate-700 transition hover:border-[#2f5bff] hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" onClick={() => move(-1)} aria-label={`Previous ${label} image`}>
            <ArrowLeft size={17} />
          </button>
          <button type="button" className="grid size-10 place-items-center border border-slate-300 text-slate-700 transition hover:border-[#2f5bff] hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" onClick={() => move(1)} aria-label={`Next ${label} image`}>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="flex gap-1.5 px-5 pb-5" aria-label="Choose carousel slide">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title || slide.src}-${index}`}
            type="button"
            className={`h-1.5 flex-1 transition ${index === activeIndex ? "bg-[#2f5bff]" : "bg-slate-200 hover:bg-slate-300"}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show slide ${index + 1}: ${slide.title || label}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </div>
  );
}
