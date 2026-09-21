import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AppWindow,
  BellRing,
  BadgeCheck,
  Boxes,
  Check,
  CheckSquare2,
  CircleHelp,
  Clipboard,
  Code2,
  ExternalLink,
  Film,
  FormInput,
  Gamepad2,
  Gauge,
  Grid2X2,
  Heading1,
  Keyboard,
  Layers3,
  LayoutPanelTop,
  ListFilter,
  MapPinned,
  MessageSquare,
  MousePointerClick,
  Music2,
  PanelTop,
  Rows3,
  Search,
  SlidersHorizontal,
  Sparkles,
  SquareMousePointer,
  TextCursorInput,
  TextSelect,
  Volume2,
  Waypoints,
  WandSparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { overlay } from "../ui/overlay";
import {
  RetroBadge,
  RetroButton,
  RetroCheckbox,
  RetroIconButton,
  RetroInput,
  RetroPanel,
  RetroSelect,
  RetroSlider,
  RetroTabs,
  RetroTextarea,
  Typewriter,
  Window,
} from "../ui/retro";
import ComponentsHeroScene from "./components/ComponentsHeroScene";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const COMPONENT_GROUPS = [
  {
    id: "foundations",
    label: "Foundations",
    items: [
      ["Button", "Actions with primary, secondary, danger, and ghost states."],
      ["Icon Button", "Compact labeled actions for toolbars and controls."],
      ["Badge", "Status and category labels with retro weight."],
      ["Input", "Single-line text entry with hints and errors."],
      ["Select", "Accessible native selection with PixelPopup framing.", "New"],
      ["Textarea", "Multi-line input for messages and longer content.", "New"],
      ["Checkbox", "Labeled binary choice with a clear focus state.", "New"],
      ["Slider", "Range input for audio, timing, and effect strength."],
      ["Tabs", "Keyboard-friendly content switching.", "New"],
      ["Loading", "Determinate and indeterminate progress feedback."],
    ],
  },
  {
    id: "containers",
    label: "Containers",
    items: [
      ["Window", "Primary retro window with title bar, slots, and footer."],
      ["Panel", "Compact grouped content container."],
      ["Stage", "Centered scene surface for focused interactions."],
      ["Modal", "Portal-based dialog connected to the global host."],
      ["Toast", "Stacked global notifications."],
      ["Header", "Reusable PixelPopup page chrome."],
      ["Footer", "Reusable lower page chrome."],
    ],
  },
  {
    id: "experiences",
    label: "Experience blocks",
    items: [
      ["Typewriter", "Progressive text with optional audio feedback."],
      ["Typewriter Panel", "Story copy with built-in actions."],
      ["Choice Panel", "Branching decisions for interactive pages."],
      ["Password Gate", "Lightweight private-page prompt."],
      ["Timeline Panel", "Chronological memories and milestones."],
      ["Map Panel", "Mapbox-powered places and stories."],
      ["Quiz Panel", "Attempt-aware question and answer flow."],
      ["Media Lyric Panel", "Timed media, lyrics, stickers, and effects."],
    ],
  },
  {
    id: "overlays",
    label: "Overlays and sound",
    items: [
      ["Toasts and modals", "Global feedback launched from any component."],
      ["Screen effects", "Confetti, CRT, VHS, shake, flash, and cursor trail."],
      ["Stickers", "Emoji, text, or image sprites with timed entry motion."],
      ["Sound effects", "WebAudio tones and project-owned MP3 assets."],
    ],
  },
];

const COMPONENT_ICONS = {
  Button: MousePointerClick,
  "Icon Button": SquareMousePointer,
  Badge: BadgeCheck,
  Input: TextCursorInput,
  Select: ListFilter,
  Textarea: FormInput,
  Checkbox: CheckSquare2,
  Slider: SlidersHorizontal,
  Tabs: Rows3,
  Loading: Gauge,
  Window: AppWindow,
  Panel: LayoutPanelTop,
  Stage: Grid2X2,
  Modal: MessageSquare,
  Toast: BellRing,
  Header: PanelTop,
  Footer: PanelTop,
  Typewriter: Heading1,
  "Typewriter Panel": Keyboard,
  "Choice Panel": Waypoints,
  "Password Gate": Keyboard,
  "Timeline Panel": Waypoints,
  "Map Panel": MapPinned,
  "Quiz Panel": CircleHelp,
  "Media Lyric Panel": Film,
  "Toasts and modals": BellRing,
  "Screen effects": WandSparkles,
  Stickers: Sparkles,
  "Sound effects": Volume2,
};

const componentAnchor = (name) => `component-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const INSTALL_CODE = `import { OverlayHost } from "./ui/overlay";

export default function App() {
  return (
    <>
      <OverlayHost />
      <YourRoutes />
    </>
  );
}`;

const IMPORT_CODE = `import {
  Window,
  RetroButton,
  RetroInput,
  RetroSelect,
  RetroCheckbox,
} from "./ui/retro";`;

const BUTTON_CODE = `<RetroButton variant="primary" rightIcon={<ArrowRight size={16} />}>
  Launch page
</RetroButton>`;

const OVERLAY_CODE = `overlay.toast({ type: "success", message: "Saved!" });
overlay.effect({ type: "confetti", doubleBurst: true });
overlay.effect({ type: "sfx", name: "success" });`;

const SOUND_ITEMS = [
  { id: "beep", label: "Beep", detail: "WebAudio square tone", icon: Zap, action: () => overlay.effect({ type: "sfx", name: "beep", volume: 0.06 }) },
  { id: "success", label: "Success", detail: "WebAudio rising tone", icon: BadgeCheck, action: () => overlay.effect({ type: "sfx", name: "success", volume: 0.06 }) },
  { id: "error", label: "Error", detail: "WebAudio warning tone", icon: XCircle, action: () => overlay.effect({ type: "sfx", name: "error", volume: 0.07 }) },
  { id: "mine", label: "Mine", detail: "Local MP3 asset", icon: Music2, asset: "/mine.mp3" },
  { id: "bruh", label: "Bruh", detail: "Local MP3 asset", icon: Volume2, asset: "/bruh.mp3" },
];

const EFFECT_ITEMS = [
  { label: "Confetti", action: () => overlay.effect({ type: "confetti", doubleBurst: true }) },
  { label: "CRT", action: () => overlay.effect({ type: "crt", ms: 1200 }) },
  { label: "VHS", action: () => overlay.effect({ type: "vhs", ms: 900, strength: 12, aberration: 2 }) },
  { label: "Flash", action: () => overlay.effect({ type: "flash", ms: 160, opacity: 0.45 }) },
  { label: "Cursor trail", action: () => overlay.effect({ type: "cursorTrail", ms: 1500 }) },
  { label: "Sticker", action: () => overlay.spawnSticker({ emoji: "✨", x: 78, y: 32, entry: "shakePop", size: 64, durationMs: 1100 }) },
];

function CodeBlock({ code, label = "jsx" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="overflow-hidden border-[3px] border-slate-950 bg-slate-950 text-slate-100 shadow-[4px_4px_0_rgba(15,23,42,.35)]">
      <div className="flex items-center justify-between border-b border-white/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
        <span>{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 border border-white/25 bg-transparent px-2 py-1 font-pp text-[11px] font-bold text-white hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          {copied ? <Check size={13} /> : <Clipboard size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 sm:text-sm"><code>{code}</code></pre>
    </div>
  );
}

function SectionHeader({ id, icon: Icon, title, description, count }) {
  return (
    <div id={id} className="scroll-mt-24 border-b-[3px] border-slate-950 pb-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center border-[3px] border-slate-950 bg-cyan-300 shadow-[3px_3px_0_#0f172a]">
          <Icon size={22} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 font-pp text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{title}</h2>
            {count ? <RetroBadge variant="yellow" size="xs">{count}</RetroBadge> : null}
          </div>
          <p className="mt-2 max-w-2xl font-pp text-sm leading-6 text-slate-700">{description}</p>
        </div>
      </div>
    </div>
  );
}

function InlineLoadingPreview({ progress = 72 }) {
  return (
    <div className="w-full border-[3px] border-slate-950 bg-white p-3 shadow-[3px_3px_0_#0f172a]">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em]"><span>Loading...</span><span>{progress}%</span></div>
      <div className="mt-3 h-4 overflow-hidden border-[3px] border-slate-950 bg-violet-100">
        <div className="h-full bg-[repeating-linear-gradient(90deg,var(--pp-accent)_0_10px,var(--pp-accent-2)_10px_20px)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ComponentPreview({ name }) {
  const Icon = COMPONENT_ICONS[name] || Boxes;
  const staticInput = { value: "PixelPopup", onChange: () => {} };

  if (name === "Button") return <RetroButton size="sm" rightIcon={<ArrowRight size={15} />}>Launch</RetroButton>;
  if (name === "Icon Button") return <RetroIconButton title="Sparkle" icon={<Sparkles size={17} />} />;
  if (name === "Badge") return <div className="flex flex-wrap gap-2"><RetroBadge variant="cyan">NEW</RetroBadge><RetroBadge variant="yellow">DRAFT</RetroBadge></div>;
  if (name === "Input") return <RetroInput label="Page name" {...staticInput} />;
  if (name === "Select") return <RetroSelect label="Scene" value="intro" onChange={() => {}} options={[{ label: "Introduction", value: "intro" }]} placeholder="" />;
  if (name === "Textarea") return <RetroTextarea label="Message" value="Make it personal." onChange={() => {}} rows={2} />;
  if (name === "Checkbox") return <RetroCheckbox label="Enable effects" description="Adds screen feedback." checked onChange={() => {}} />;
  if (name === "Slider") return <RetroSlider label="Intensity" value={62} onChange={() => {}} />;
  if (name === "Tabs") return <RetroTabs items={[{ value: "preview", label: "Preview", content: <p className="text-xs font-bold">Live result</p> }, { value: "code", label: "Code", content: <p className="text-xs font-bold">JSX source</p> }]} />;
  if (name === "Loading") return <InlineLoadingPreview />;
  if (name === "Window") return <Window title="PREVIEW.EXE" subtitle="ready" maxWidthClass="max-w-none"><p className="text-xs font-bold">Window content</p></Window>;
  if (name === "Panel") return <RetroPanel title="Panel title" shadow="var(--pp-shadow)"><p className="text-xs font-bold">Grouped content</p></RetroPanel>;
  if (name === "Modal") return <RetroButton size="sm" onClick={() => overlay.showModal({ title: "COMPONENT MODAL", subtitle: "Live from the catalog", content: <p className="font-pp text-sm font-bold">This is the actual global modal component.</p>, showDefaultActions: true })}>Open modal</RetroButton>;
  if (name === "Toast" || name === "Toasts and modals") return <RetroButton size="sm" onClick={() => overlay.toast({ type: "success", message: "Toast component is online." })}>Show toast</RetroButton>;
  if (name === "Typewriter") return <Typewriter text="PixelPopup is typing..." speedMs={55} beepEnabled={false} className="text-sm font-black" />;
  if (name === "Screen effects") return <RetroButton size="sm" onClick={() => overlay.effect({ type: "vhs", ms: 700, strength: 9 })}>Run VHS</RetroButton>;
  if (name === "Stickers") return <RetroButton size="sm" onClick={() => overlay.spawnSticker({ emoji: "✨", x: 76, y: 38, size: 64, entry: "shakePop", durationMs: 1000 })}>Spawn sticker</RetroButton>;
  if (name === "Sound effects") return <RetroButton size="sm" leftIcon={<Volume2 size={15} />} onClick={() => overlay.effect({ type: "sfx", name: "success", volume: 0.06 })}>Play tone</RetroButton>;

  if (name === "Header" || name === "Footer") {
    return (
      <div className="w-full border-[3px] border-slate-950 bg-violet-700 p-2 text-white shadow-[3px_3px_0_#0f172a]">
        <div className="flex items-center justify-between gap-3 text-[10px] font-black"><span>PIXELPOPUP</span><span>{name === "Header" ? "MENU" : "© 2026"}</span></div>
      </div>
    );
  }

  if (name === "Stage") {
    return <div className="grid min-h-24 place-items-center border-[3px] border-dashed border-slate-950 bg-violet-100"><RetroBadge variant="purple">STAGE</RetroBadge></div>;
  }

  if (name === "Choice Panel") {
    return <div className="grid w-full grid-cols-2 gap-2"><RetroButton size="sm">YES</RetroButton><RetroButton size="sm" variant="secondary">NO</RetroButton></div>;
  }

  if (name === "Password Gate") {
    return <div className="flex w-full gap-2"><input aria-label="Preview password" value="••••" readOnly className="min-w-0 flex-1 border-[3px] border-slate-950 bg-white px-2 py-1 text-xs" /><RetroButton size="sm">Unlock</RetroButton></div>;
  }

  if (name === "Timeline Panel") {
    return <div className="w-full border-l-[3px] border-violet-700 pl-3 text-xs"><div className="font-black">First scene</div><div className="mt-3 font-black">Published page</div></div>;
  }

  if (name === "Map Panel") {
    return <div className="relative min-h-24 w-full overflow-hidden border-[3px] border-slate-950 bg-[linear-gradient(90deg,rgba(109,40,217,.14)_1px,transparent_1px),linear-gradient(rgba(109,40,217,.14)_1px,transparent_1px)] bg-[size:16px_16px]"><MapPinned className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-700" /></div>;
  }

  if (name === "Quiz Panel") {
    return <div className="w-full text-xs"><div className="font-black">Pick the right answer</div><div className="mt-2 grid grid-cols-2 gap-2"><span className="border-[2px] border-slate-950 bg-cyan-300 p-2 font-bold">A</span><span className="border-[2px] border-slate-950 bg-white p-2 font-bold">B</span></div></div>;
  }

  if (name === "Media Lyric Panel") {
    return <div className="w-full border-[3px] border-slate-950 bg-slate-950 p-3 text-white"><div className="flex items-center gap-2 text-xs font-black"><Film size={16} /> 00:12 / 00:48</div><div className="mt-3 h-2 bg-cyan-300" style={{ width: "62%" }} /></div>;
  }

  if (name === "Typewriter Panel") {
    return <RetroPanel title="MESSAGE.TXT" shadow="none"><Typewriter text="A story starts here." speedMs={70} beepEnabled={false} className="text-xs font-black" /></RetroPanel>;
  }

  return (
    <div className="flex w-full items-center gap-3 border-[3px] border-dashed border-slate-950 bg-violet-100 p-3">
      <span className="flex size-9 items-center justify-center border-[2px] border-slate-950 bg-cyan-300"><Icon size={18} /></span>
      <span className="text-xs font-black">{name} preview</span>
    </div>
  );
}

function CatalogCard({ item }) {
  const [name, description, status] = item;
  const Icon = COMPONENT_ICONS[name] || Boxes;
  return (
    <article id={componentAnchor(name)} className="group scroll-mt-24 border-[3px] border-slate-950 bg-white p-4 shadow-[4px_4px_0_rgba(15,23,42,.22)] transition-transform duration-200 hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center border-[3px] border-slate-950 bg-cyan-300 transition-transform group-hover:-rotate-3"><Icon size={17} /></span>
            <h3 className="font-pp text-base font-black text-slate-950">{name}</h3>
          </div>
          {status ? <RetroBadge variant="cyan" size="xs">{status}</RetroBadge> : null}
        </div>
        <p className="mt-3 font-pp text-xs leading-5 text-slate-600">{description}</p>
      </div>
      <div className="mt-4 border-t-[3px] border-slate-950 pt-4">
        <ComponentPreview name={name} />
      </div>
    </article>
  );
}

export default function ComponentsPage() {
  const [query, setQuery] = useState("");
  const [buttonVariant, setButtonVariant] = useState("primary");
  const [buttonLabel, setButtonLabel] = useState("Launch page");
  const [showButtonIcon, setShowButtonIcon] = useState(true);
  const [inputValue, setInputValue] = useState("PixelPopup");
  const [selectValue, setSelectValue] = useState("party");
  const [notes, setNotes] = useState("Make the invitation feel personal.");
  const [volume, setVolume] = useState(45);
  const audioRef = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "PixelPopup Components | UI, Effects, and Sound";
    return () => {
      document.title = previousTitle;
      audioRef.current?.pause();
    };
  }, []);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return COMPONENT_GROUPS;
    return COMPONENT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(([name, description]) => `${name} ${description}`.toLowerCase().includes(normalizedQuery)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const playAsset = (src) => {
    audioRef.current?.pause();
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    audioRef.current = audio;
    audio.play().catch(() => {
      overlay.toast({ type: "warning", message: "Click again to allow browser audio." });
    });
  };

  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-violet-700 font-pp text-slate-950 pp-retro-bg">
      {/*
        THESIS: PixelPopup components read like a practical workshop manual, not a generic SaaS docs shell.
        OWN-WORLD: Violet grid, cyan actions, yellow annotations, ink borders, and hard-edged windows.
        STORY: Learn the setup, inspect the catalog, tune components live, then test overlays and sound.
        FIRST VIEWPORT: Compact workshop masthead above a two-column docs layout with visible quick start.
        FORM: Read-mode component workshop extending the existing PixelPopup retro system.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
      */}
      <header className="sticky top-0 z-40 border-b-[3px] border-slate-950 bg-violet-700/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between gap-4">
          <a href="#top" className="flex min-w-0 items-center gap-3 !text-white">
            <span className="flex size-9 shrink-0 items-center justify-center border-[3px] border-slate-950 bg-cyan-300 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">PP</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">PixelPopup Components</span>
              <span className="hidden text-[10px] font-bold text-white/65 sm:block">source-owned UI and effects</span>
            </span>
          </a>
          <nav aria-label="Related demos" className="flex items-center gap-2">
            <Link to="/ui" className="hidden border-[2px] border-white/45 px-3 py-2 text-xs font-bold !text-white hover:bg-white/10 sm:inline-flex">UI kit</Link>
            <Link to="/overlay-playground" className="hidden border-[2px] border-white/45 px-3 py-2 text-xs font-bold !text-white hover:bg-white/10 md:inline-flex">Overlays</Link>
            <Link to="/examples/playground" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-yellow-300 px-3 py-2 text-xs font-black !text-slate-950 shadow-[3px_3px_0_#0f172a]">
              Playground <ExternalLink size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <section id="top" className="relative flex min-h-[calc(100dvh-65px)] scroll-mt-20 items-center overflow-hidden border-b-[3px] border-slate-950 px-4 py-12 sm:px-8 sm:py-14 xl:px-12">
        <ComponentsHeroScene />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(76,29,149,.97)_0%,rgba(91,33,182,.86)_42%,rgba(109,40,217,.12)_76%,rgba(109,40,217,.04)_100%)]" aria-hidden="true" />
        <div className="relative z-10 grid w-full gap-10 lg:grid-cols-[minmax(0,.82fr)_minmax(520px,1.18fr)] lg:items-end">
          <div>
            <RetroBadge variant="yellow" size="sm">PIXELPOPUP.EXE / COMPONENTS</RetroBadge>
            <h1 className="mt-6 max-w-4xl font-pp text-4xl font-black leading-[1.02] text-white sm:text-5xl lg:text-[3.5rem]">
              Build interactive pages from reusable retro parts.
            </h1>
            <p className="mt-5 max-w-2xl font-pp text-sm leading-7 text-white/82 sm:text-base">
              A single reference for PixelPopup primitives, story blocks, overlays, stickers, and sound. Copy the source, compose the parts, and keep the personality.
            </p>
          </div>
          <div className="grid grid-cols-3 border-[3px] border-slate-950 bg-white shadow-[8px_8px_0_#0f172a] lg:mb-6 lg:ml-auto lg:w-full lg:max-w-2xl">
            {[["25", "exports", Boxes], ["9", "effects", WandSparkles], ["5", "sounds", Volume2]].map(([value, label, Icon], index) => (
              <div key={label} className={cx("p-4 sm:p-5", index ? "border-l-[3px] border-slate-950" : "")}>
                <Icon size={20} className="mb-4 text-violet-700" strokeWidth={2.5} />
                <div className="text-2xl font-black sm:text-4xl">{value}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid w-full grid-cols-1 gap-0 bg-violet-100 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b-[3px] border-slate-950 bg-violet-100 p-4 lg:sticky lg:top-[66px] lg:flex lg:h-[calc(100dvh-66px)] lg:flex-col lg:border-b-0 lg:border-r-[3px] lg:p-6">
          <label htmlFor="component-search" className="mb-2 block text-xs font-black uppercase tracking-[0.12em]">Find a component</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={17} />
            <input
              id="component-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Button, modal, sound..."
              className="w-full border-[3px] border-slate-950 bg-white py-2.5 pl-10 pr-3 text-xs font-bold outline-none shadow-[3px_3px_0_#0f172a] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            />
          </div>
          <nav aria-label="Documentation sections" className="mt-5 grid grid-cols-2 gap-2 border-b-[3px] border-slate-950 pb-5 text-xs lg:grid-cols-1">
            {[
              { href: "#start", label: "Introduction" },
              { to: "/examples/playground", label: "Playground" },
              { href: "#overlays-demo", label: "Overlays" },
              { href: "#sounds", label: "Sounds" },
            ].map((item) => {
              const className = "border-l-[3px] border-slate-950 px-3 py-2 font-bold !text-slate-700 hover:border-cyan-500 hover:bg-white hover:!text-slate-950";
              return item.to
                ? <Link key={item.label} to={item.to} className={className}>{item.label}</Link>
                : <a key={item.label} href={item.href} className={className}>{item.label}</a>;
            })}
          </nav>
          <nav aria-label="Component index" className="mt-5 max-h-80 overflow-y-auto pr-2 text-xs lg:max-h-none lg:flex-1">
            {visibleGroups.map((group) => (
              <div key={group.id} className="mb-6">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">{group.label}</div>
                <div className="space-y-1">
                  {group.items.map(([name]) => {
                    const Icon = COMPONENT_ICONS[name] || Boxes;
                    return (
                      <a key={name} href={`#${componentAnchor(name)}`} className="flex items-center gap-2 border-l-[3px] border-transparent px-2 py-1.5 font-bold !text-slate-600 hover:border-cyan-500 hover:bg-white hover:!text-slate-950">
                        <Icon size={14} strokeWidth={2.4} />
                        <span>{name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 bg-violet-100 px-4 py-8 sm:px-8 sm:py-12 xl:px-12">
          <section id="start" className="scroll-mt-24">
            <SectionHeader
              id="introduction"
              icon={Code2}
              title="Introduction and install"
              description="PixelPopup uses open, source-owned React components. Keep the host at the app root, import only what a page needs, and customize through props or the shared CSS tokens."
            />
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <Window title="01 / ADD THE HOST" subtitle="Required for global effects" maxWidthClass="max-w-none" titlebarGradient={false} titlebarSolidBg="var(--pp-titlebar)">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-slate-700">Render one OverlayHost above the router content. Toasts, modal dialogs, stickers, effects, and WebAudio tones all use this shared event bus.</p>
                  <CodeBlock code={INSTALL_CODE} />
                </div>
              </Window>
              <Window title="02 / IMPORT COMPONENTS" subtitle="Copy and compose" maxWidthClass="max-w-none" titlebarGradient={false} titlebarSolidBg="var(--pp-accent)">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-slate-700">Import from the retro barrel file. Advanced experience blocks stay composable, so scenes can mix standard inputs with story-specific panels.</p>
                  <CodeBlock code={IMPORT_CODE} />
                </div>
              </Window>
            </div>
            <RetroPanel className="mt-5" title="Token map" rightSlot={<RetroBadge variant="purple" size="xs">src/index.css</RetroBadge>} shadow="var(--pp-shadow)">
              <div className="grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["--pp-border", "Ink outlines"],
                  ["--pp-accent", "Primary cyan"],
                  ["--pp-accent-2", "Highlight yellow"],
                  ["--pp-shadow", "Hard offset depth"],
                ].map(([token, purpose]) => (
                  <div key={token} className="border-l-[3px] border-slate-950 pl-3">
                    <code className="font-black text-violet-700">{token}</code>
                    <div className="mt-1 text-slate-600">{purpose}</div>
                  </div>
                ))}
              </div>
            </RetroPanel>
          </section>

          <section id="catalog" className="mt-16 scroll-mt-24">
            <SectionHeader
              id="component-catalog"
              icon={Layers3}
              title="Component catalog"
              description="The compact inventory from /ui, /overlay-playground, and /examples/playground, plus the missing form and navigation primitives added for complete page composition."
              count="29 catalog entries"
            />
            <div className="mt-7 space-y-10">
              {visibleGroups.length ? visibleGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-violet-700">{group.label}</h3>
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {group.items.map((item) => <CatalogCard key={item[0]} item={item} />)}
                  </div>
                </div>
              )) : (
                <div className="border-[3px] border-dashed border-slate-950 bg-white p-8 text-center">
                  <div className="font-black">No component matched “{query}”.</div>
                  <button type="button" onClick={() => setQuery("")} className="mt-3 font-pp text-sm font-black underline decoration-cyan-400 decoration-2 underline-offset-4">Clear search</button>
                </div>
              )}
            </div>
          </section>

          <section id="playground" className="mt-16 scroll-mt-24">
            <SectionHeader
              id="component-playground"
              icon={Sparkles}
              title="Live component playground"
              description="Tune real component props and inspect the result without leaving the page. The same primitives can be composed into invitations, mini-sites, and interactive stories."
            />
            <div className="mt-7 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
              <RetroPanel title="Controls" shadow="var(--pp-shadow)" className="self-start">
                <div className="space-y-5">
                  <RetroInput label="Button label" value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} hint="Try a short action label." />
                  <RetroSelect
                    label="Button variant"
                    value={buttonVariant}
                    onChange={(event) => setButtonVariant(event.target.value)}
                    options={["primary", "secondary", "danger", "ghost"]}
                    placeholder=""
                  />
                  <RetroCheckbox
                    label="Show arrow icon"
                    description="Adds a right-side directional cue."
                    checked={showButtonIcon}
                    onChange={(event) => setShowButtonIcon(event.target.checked)}
                  />
                  <RetroSlider label="Preview volume" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
                </div>
              </RetroPanel>

              <Window title="COMPONENT_PREVIEW.EXE" subtitle="Interactive sandbox" maxWidthClass="max-w-none" footer={<span className="text-xs font-bold">Props update instantly</span>}>
                <RetroTabs
                  items={[
                    {
                      value: "button",
                      label: "Button",
                      content: (
                        <div className="grid min-h-56 place-items-center bg-[linear-gradient(90deg,rgba(109,40,217,.08)_1px,transparent_1px),linear-gradient(rgba(109,40,217,.08)_1px,transparent_1px)] bg-[size:18px_18px] p-6">
                          <RetroButton variant={buttonVariant} rightIcon={showButtonIcon ? <ArrowRight size={17} /> : null}>
                            {buttonLabel || "Button label"}
                          </RetroButton>
                        </div>
                      ),
                    },
                    {
                      value: "forms",
                      label: "Form",
                      content: (
                        <div className="grid gap-5 md:grid-cols-2">
                          <RetroInput label="Project name" value={inputValue} onChange={(event) => setInputValue(event.target.value)} />
                          <RetroSelect label="Page type" value={selectValue} onChange={(event) => setSelectValue(event.target.value)} options={[{ label: "Party invite", value: "party" }, { label: "Wedding RSVP", value: "wedding" }, { label: "Interactive story", value: "story" }]} placeholder="" />
                          <RetroTextarea className="md:col-span-2" label="Creative note" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
                        </div>
                      ),
                    },
                    {
                      value: "states",
                      label: "States",
                      content: (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InlineLoadingPreview />
                          <div className="flex flex-wrap content-start gap-3">
                            {[["success", "READY"], ["warning", "DRAFT"], ["danger", "ERROR"], ["cyan", "NEW"]].map(([variant, label]) => <RetroBadge key={label} variant={variant}>{label}</RetroBadge>)}
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </Window>
            </div>
            <div className="mt-5"><CodeBlock code={BUTTON_CODE} /></div>
            <div className="mt-5 flex flex-col gap-4 border-[3px] border-slate-950 bg-yellow-300 p-5 shadow-[5px_5px_0_#0f172a] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black">Want the complete scene flow?</div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-700">Open the dedicated playground to run choices, gates, quizzes, timelines, maps, and media as one connected experience.</p>
              </div>
              <Link to="/examples/playground" className="inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-slate-950 bg-cyan-300 px-4 py-3 text-sm font-black !text-slate-950 shadow-[3px_3px_0_#0f172a]">
                Open playground <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section id="overlays-demo" className="mt-16 scroll-mt-24">
            <SectionHeader
              id="overlay-playground"
              icon={Zap}
              title="Overlay playground"
              description="Global effects are event-driven. Trigger them from any route without threading state through every component."
              count="9 effects"
            />
            <div id="component-effect-target" className="mt-7 grid gap-5 xl:grid-cols-[1fr_.9fr]">
              <div className="border-[3px] border-slate-950 bg-white p-5 shadow-[5px_5px_0_#0f172a]">
                <h3 className="text-lg font-black">Try an effect</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">Effects are intentionally short. CRT, VHS, and cursor trail automatically clean themselves up.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {EFFECT_ITEMS.map((effect, index) => (
                    <RetroButton key={effect.label} variant={index === 0 ? "primary" : "secondary"} size="sm" onClick={effect.action}>{effect.label}</RetroButton>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3 border-t-[3px] border-slate-950 pt-5">
                  <RetroButton onClick={() => overlay.toast({ type: "success", message: "Component settings saved." })}>Show toast</RetroButton>
                  <RetroButton variant="secondary" onClick={() => overlay.showModal({ title: "PREVIEW READY", subtitle: "Everything is wired.", content: <p className="font-pp text-sm font-bold">The global modal host is working from the component docs.</p>, showDefaultActions: true, confirmText: "Nice" })}>Open modal</RetroButton>
                </div>
              </div>
              <CodeBlock code={OVERLAY_CODE} />
            </div>
          </section>

          <section id="sounds" className="mt-16 scroll-mt-24">
            <SectionHeader
              id="sound-library"
              icon={Volume2}
              title="Sound library"
              description="Built-in tones use WebAudio. Project music and meme sounds remain local assets, so pages can ship without a third-party audio service."
              count="5 sounds"
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {SOUND_ITEMS.map((sound) => {
                const Icon = sound.icon;
                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => sound.asset ? playAsset(sound.asset) : sound.action()}
                    className="group border-[3px] border-slate-950 bg-white p-4 text-left shadow-[4px_4px_0_#0f172a] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                  >
                    <span className="flex size-10 items-center justify-center border-[3px] border-slate-950 bg-yellow-300 transition-transform group-hover:-rotate-3"><Icon size={20} /></span>
                    <span className="mt-4 block text-sm font-black">{sound.label}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-slate-600">{sound.detail}</span>
                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-black text-violet-700">Play sound <Volume2 size={13} /></span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 border-l-[5px] border-yellow-400 bg-white px-4 py-3 text-xs leading-5 text-slate-700">
              Browser audio starts after a click or tap. Keep sound optional, label every control, and never autoplay loud effects.
            </div>
          </section>

          <footer className="mt-16 border-t-[3px] border-slate-950 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-black">PixelPopup component workshop</div>
                <div className="mt-1 text-xs text-slate-600">One page now, ready for a public profile connection later.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/examples/playground" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-yellow-300 px-3 py-2 text-xs font-black !text-slate-950">Playground <Gamepad2 size={14} /></Link>
                <Link to="/ui" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-white px-3 py-2 text-xs font-black !text-slate-950">Legacy UI kit <ArrowRight size={14} /></Link>
                <a href="#top" className="inline-flex items-center gap-2 border-[3px] border-slate-950 bg-cyan-300 px-3 py-2 text-xs font-black !text-slate-950 shadow-[3px_3px_0_#0f172a]">Back to top</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
