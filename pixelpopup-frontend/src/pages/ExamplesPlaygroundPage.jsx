import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Gamepad2,
  Layers3,
  MapPinned,
  Music2,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SceneEngine from "../engine/SceneEngine";
import { megaDemoFlow } from "../engine/flows/megaDemoFlow";
import { RetroBadge, RetroButton } from "../ui/retro";

const PLAYGROUND_MODULES = [
  { label: "Branching choices", detail: "Move between modules from one shared hub.", icon: Route },
  { label: "Password gate", detail: "Test guarded paths and unlock state.", icon: ShieldCheck },
  { label: "Quiz and scoring", detail: "Exercise attempts, mutations, and outcomes.", icon: BadgeCheck },
  { label: "Timeline and map", detail: "Inspect data-rich interactive panels.", icon: MapPinned },
  { label: "Media and lyrics", detail: "Try timed copy, stickers, sound, and video.", icon: Music2 },
];

const RELATED_LINKS = [
  { to: "/components", label: "Component docs" },
  { to: "/ui", label: "UI kit" },
  { to: "/overlay-playground", label: "Overlay lab" },
];

export default function ExamplesPlaygroundPage() {
  const [runKey, setRunKey] = useState(0);

  const restartDemo = () => {
    setRunKey((current) => current + 1);
    document.getElementById("playground-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-violet-100 font-pp text-slate-950 pp-retro-bg">
      <header className="sticky top-0 z-40 border-b-[3px] border-slate-950 bg-violet-700/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between gap-4">
          <Link to="/components" className="flex min-w-0 items-center gap-3 !text-white">
            <span className="flex size-9 shrink-0 items-center justify-center border-[3px] border-slate-950 bg-cyan-300 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">PP</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">PixelPopup Playground</span>
              <span className="hidden text-[10px] font-bold text-white/65 sm:block">interactive scene laboratory</span>
            </span>
          </Link>
          <nav aria-label="Playground navigation" className="flex items-center gap-2">
            {RELATED_LINKS.slice(1).map((item) => (
              <Link key={item.to} to={item.to} className="hidden border-[2px] border-white/45 px-3 py-2 text-xs font-bold !text-white hover:bg-white/10 md:inline-flex">
                {item.label}
              </Link>
            ))}
            <Link to="/components" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-yellow-300 px-3 py-2 text-xs font-black !text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <ArrowLeft size={14} /> Components
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b-[3px] border-slate-950 bg-violet-700 px-4 py-14 text-white sm:px-8 lg:py-20 xl:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:28px_28px]" aria-hidden="true" />
        <div className="relative grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.58fr)] lg:items-end">
          <div>
            <RetroBadge variant="yellow" size="sm">EXAMPLES / PLAYGROUND</RetroBadge>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] sm:text-5xl lg:text-6xl">
              Play every PixelPopup scene in one connected flow.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              The former <code className="bg-slate-950/45 px-1.5 py-1 text-cyan-200">/demo-all</code> experience now lives here. Explore real components, route between scenes, change variables, and restart whenever you want a clean run.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#playground-stage" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-cyan-300 px-4 py-3 text-sm font-black !text-slate-950 shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5">
                Enter playground <ArrowRight size={16} />
              </a>
              <Link to="/components" className="inline-flex items-center gap-2 border-[3px] border-white/60 bg-white/10 px-4 py-3 text-sm font-black !text-white hover:bg-white/15">
                Browse components <Layers3 size={16} />
              </Link>
            </div>
          </div>
          <div className="border-[3px] border-slate-950 bg-yellow-300 p-5 text-slate-950 shadow-[7px_7px_0_#0f172a]">
            <Gamepad2 size={28} strokeWidth={2.5} />
            <div className="mt-5 text-3xl font-black">One flow. Seven modules.</div>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">Choices and state carry between scenes, so this behaves like a real PixelPopup experience instead of isolated previews.</p>
          </div>
        </div>
      </section>

      <section id="playground-stage" className="scroll-mt-20 px-4 py-10 sm:px-8 lg:py-14 xl:px-12">
        <div className="grid w-full gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="self-start border-[3px] border-slate-950 bg-white p-5 shadow-[5px_5px_0_#0f172a] xl:sticky xl:top-24">
            <div className="flex items-center justify-between gap-3 border-b-[3px] border-slate-950 pb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">Demo map</div>
                <h2 className="mt-1 text-xl font-black">What to test</h2>
              </div>
              <Sparkles size={22} className="text-violet-700" />
            </div>
            <ol className="mt-4 space-y-4">
              {PLAYGROUND_MODULES.map(({ label, detail, icon: Icon }, index) => (
                <li key={label} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="flex size-8 items-center justify-center border-[2px] border-slate-950 bg-cyan-300 text-xs font-black" aria-hidden="true">{index + 1}</span>
                  <span>
                    <span className="flex items-center gap-2 text-sm font-black"><Icon size={14} /> {label}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-slate-600">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            <RetroButton className="mt-6 w-full justify-center" variant="secondary" onClick={restartDemo} leftIcon={<RefreshCw size={16} />}>
              Restart demo
            </RetroButton>
          </aside>

          <div className="min-w-0 border-[3px] border-slate-950 bg-violet-700 shadow-[8px_8px_0_#0f172a]">
            <div className="flex items-center justify-between gap-4 border-b-[3px] border-slate-950 bg-pink-400 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  {["bg-red-400", "bg-yellow-300", "bg-emerald-400"].map((color) => <span key={color} className={`size-3 border-2 border-slate-950 ${color}`} />)}
                </span>
                <span className="text-xs font-black uppercase tracking-[0.1em]">MEGA_DEMO.EXE</span>
              </div>
              <span className="hidden text-[10px] font-black uppercase tracking-[0.12em] sm:block">Live scene engine</span>
            </div>
            <div className="min-h-[620px] bg-violet-700 p-3 pp-retro-bg sm:p-6 lg:min-h-[720px]">
              <SceneEngine key={runKey} flow={megaDemoFlow} />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-[3px] border-slate-950 bg-slate-950 px-4 py-8 text-white sm:px-8 xl:px-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black">Ready to compose your own flow?</div>
            <div className="mt-1 text-xs text-white/60">Return to the catalog for component APIs, previews, effects, and sound.</div>
          </div>
          <Link to="/components" className="inline-flex items-center gap-2 border-[3px] border-white bg-cyan-300 px-4 py-3 text-sm font-black !text-slate-950 shadow-[4px_4px_0_#ffffff]">
            Open component docs <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
