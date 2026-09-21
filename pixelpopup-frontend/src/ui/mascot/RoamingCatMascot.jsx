import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import messages from "../../data/cat-mascot-messages.json";
import { catMascotConfig, isMascotRoute } from "./catMascotConfig";
import useRoamingCat from "./useRoamingCat";
import "./catMascot.css";

function MascotBody({ config, pathname }) {
  const mascotRef = useRef(null);
  const cat = useRoamingCat({ config, messages, pathname, mascotRef });

  if (cat.hiddenForSession) return null;

  const astaRoute = pathname.startsWith("/asta");
  const bubblePosition = cat.bubbleAlign === "right"
    ? "right-0 origin-bottom-right"
    : "left-0 origin-bottom-left";

  return (
    <aside
      ref={mascotRef}
      className="cat-mascot"
      data-state={cat.state}
      data-facing={cat.facing}
      data-suppressed={cat.suppressed}
      style={{ "--cat-sprite-url": `url(${config.spriteUrl})` }}
      aria-label="Smokey Sr., website cat companion"
    >
      {cat.bubble ? (
        <div
          id="cat-mascot-message"
          className={`pointer-events-auto absolute bottom-[calc(100%-0.5rem)] w-48 sm:w-60 ${bubblePosition} ${astaRoute ? "rounded-sm border-[#1570ef]" : "rounded-xl border-[#2f5bff]"} border bg-white p-4 text-left font-sans text-slate-950 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.55)]`}
        >
          <button
            type="button"
            className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-md bg-transparent p-0 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2f5bff]"
            onClick={cat.dismissBubble}
            aria-label="Close cat message"
          >
            <X size={15} aria-hidden="true" />
          </button>
          <span className={`mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.12em] ${astaRoute ? "text-[#1570ef]" : "text-[#2f5bff]"}`}>Smokey Sr.</span>
          <p className="pr-7 text-sm font-semibold leading-5">{cat.bubble.message}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            {cat.bubble.actionLabel && cat.bubble.actionUrl ? (
              <a className={`text-xs font-semibold ${astaRoute ? "text-[#1570ef]" : "text-[#2f5bff]"} hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`} href={cat.bubble.actionUrl}>
                {cat.bubble.actionLabel}
              </a>
            ) : <span />}
            <button type="button" className="bg-transparent p-0 text-xs font-medium text-slate-500 hover:text-slate-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" onClick={cat.hideForSession}>
              Hide for now
            </button>
          </div>
          <span className={`absolute -bottom-1.5 size-3 rotate-45 border-b border-r bg-white ${cat.bubbleAlign === "right" ? "right-8" : "left-8"} ${astaRoute ? "border-[#1570ef]" : "border-[#2f5bff]"}`} aria-hidden="true" />
        </div>
      ) : null}

      <button
        type="button"
        className="cat-mascot__button"
        onClick={cat.activate}
        onPointerDown={cat.beginDrag}
        onPointerMove={cat.updateDrag}
        onPointerUp={cat.endDrag}
        onPointerCancel={cat.endDrag}
        aria-label="Move Smokey Sr. or ask for a suggestion"
        aria-describedby="cat-mascot-instructions"
        aria-expanded={Boolean(cat.bubble)}
        aria-controls={cat.bubble ? "cat-mascot-message" : undefined}
      >
        <span className="cat-mascot__facing" aria-hidden="true">
          <span className="cat-mascot__sprite" />
        </span>
      </button>
      <span id="cat-mascot-instructions" className="sr-only">
        Drag Smokey Sr. to reposition him, or activate him for a suggestion.
      </span>
    </aside>
  );
}

export default function RoamingCatMascot({ config = catMascotConfig }) {
  const { pathname } = useLocation();
  if (!config.enabled || !isMascotRoute(pathname)) return null;
  return <MascotBody config={config} pathname={pathname} />;
}
