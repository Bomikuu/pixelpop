import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

function TechnologyMark({ technology }) {
  if (technology.icon) {
    return <img src={technology.icon} alt="" className="size-8 object-contain" loading="lazy" />;
  }

  return (
    <span className="grid size-8 place-items-center rounded-md bg-blue-50 text-[0.68rem] font-bold tracking-[-0.02em] text-[#2f5bff]" aria-hidden="true">
      {technology.shortLabel}
    </span>
  );
}

function TechnologyDialog({ technology, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!technology || !dialog) return undefined;
    dialog.showModal();
    return () => dialog.close();
  }, [technology]);

  if (!technology) return null;

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(92vw,42rem)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_30px_90px_-38px_rgba(15,23,42,0.72)] backdrop:bg-[#071126]/70 backdrop:backdrop-blur-sm"
      aria-labelledby="technology-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50">
              <TechnologyMark technology={technology} />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-[#2f5bff]">Technology in my workflow</p>
              <h2 id="technology-dialog-title" className="portfolio-display mb-0 mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{technology.name}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-slate-950 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]" aria-label={`Close ${technology.name} details`}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-7 text-base leading-7 text-slate-600">{technology.summary}</p>
        <dl className="mt-7 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-slate-950">How I use it</dt>
            <dd className="m-0 mt-2 text-sm leading-6 text-slate-600">{technology.personalUse}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-950">Best fit</dt>
            <dd className="m-0 mt-2 text-sm leading-6 text-slate-600">{technology.bestFor}</dd>
          </div>
        </dl>
      </div>
    </dialog>
  );
}

export default function TechnologyExplorer({ technologies, compact = false }) {
  const [selectedTechnology, setSelectedTechnology] = useState(null);
  const lastTriggerRef = useRef(null);

  const closeTechnology = () => {
    setSelectedTechnology(null);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  };

  return (
    <>
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {technologies.map((technology) => (
          <button
            key={technology.id}
            type="button"
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setSelectedTechnology(technology);
            }}
            className={compact
              ? "group inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#2f5bff] hover:text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] active:translate-y-px"
              : "group flex min-h-28 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-[#2f5bff] hover:shadow-[0_22px_55px_-42px_rgba(15,23,42,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px"}
            aria-haspopup="dialog"
          >
            {!compact ? <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-50"><TechnologyMark technology={technology} /></span> : null}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-950 group-hover:text-[#2f5bff]">{technology.name}</span>
              {!compact ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">View how I use it</span> : null}
            </span>
            <ArrowUpRight size={compact ? 14 : 17} className="shrink-0 text-[#2f5bff] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        ))}
      </div>
      <TechnologyDialog technology={selectedTechnology} onClose={closeTechnology} />
    </>
  );
}
