import { useRef, useState } from "react";
import { DRIVERS, FLAG_COLORS } from "./scoreboardData";
import "./scoreboardOverlay.css";

const BACKGROUND_PRESETS = [
  { label: "Garden", src: "/images/date/picnic.png" },
  { label: "Dinner", src: "/images/date/dinner.png" },
  { label: "Matcha", src: "/images/date/matcha.png" },
];

export default function ScoreboardOverlayPage() {
  const [selectedId, setSelectedId] = useState(DRIVERS[0].id);
  const [backgroundSrc, setBackgroundSrc] = useState(BACKGROUND_PRESETS[0].src);
  const clickAudio = useRef(null);
  const selectedDriver = DRIVERS.find((driver) => driver.id === selectedId) || DRIVERS[0];

  const playClick = () => {
    try {
      if (!clickAudio.current) {
        clickAudio.current = new Audio("/bruh.mp3");
        clickAudio.current.preload = "auto";
        clickAudio.current.volume = 0.2;
      }
      clickAudio.current.currentTime = 0;
      void clickAudio.current.play();
    } catch {
      // Sound is optional; the scoreboard remains usable without it.
    }
  };

  const selectDriver = (driverId) => {
    playClick();
    setSelectedId(driverId);
  };

  const importBackground = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    playClick();
    setBackgroundSrc(URL.createObjectURL(file));
  };

  return (
    <main className="scoreboard-overlay-page relative min-h-screen overflow-hidden bg-[#15242f] text-[#f7f0d7]">
      <div className="scoreboard-overlay-background absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${backgroundSrc}")` }} aria-hidden="true" />
      <div className="scoreboard-overlay-shade absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-3 pb-3 pt-4 sm:px-6 sm:pt-6">
        <header className="scoreboard-overlay-broadcast-header grid grid-cols-[auto_1fr_auto] items-end gap-3 border-b-[3px] border-[#ece13b] px-2 pb-2 sm:gap-6 sm:px-4">
          <div className="text-[clamp(1rem,2.4vw,2rem)] font-black uppercase leading-none tracking-[-0.04em] text-[#f7f0d7]">MFG Round 1</div>
          <div className="min-w-0 text-center text-[clamp(0.95rem,2.1vw,1.8rem)] font-black uppercase leading-none tracking-[-0.03em] text-[#f7f0d7]">Odawara Pikes Peak</div>
          <div className="text-right text-[clamp(1rem,2.5vw,2.1rem)] font-black uppercase leading-none tracking-[-0.06em] text-[#f7f0d7]">Race Result</div>
        </header>

        <div className="flex items-center justify-end gap-1 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-[#d9d99d] sm:gap-2 sm:text-[9px]">
          <span className="hidden sm:inline">Background</span>
          {BACKGROUND_PRESETS.map((preset) => <button key={preset.src} type="button" onClick={() => { playClick(); setBackgroundSrc(preset.src); }} className={`!px-2 !py-1 text-[8px] font-black uppercase tracking-[0.11em] ${backgroundSrc === preset.src ? "!bg-[#ece13b] !text-[#1a2730]" : "!bg-[#1b2b39]/75 !text-[#f7f0d7] hover:!bg-[#334a55]"}`}>{preset.label}</button>)}
          <label htmlFor="scoreboard-overlay-background" className="cursor-pointer border border-[#ece13b] bg-[#1b2b39]/75 px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-[#f7f0d7] hover:bg-[#334a55]">Import</label>
          <input id="scoreboard-overlay-background" className="sr-only" type="file" accept="image/*" onChange={importBackground} />
        </div>

        <div className="scoreboard-overlay-subline grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[#bdc64b]/70 px-2 py-1 text-[8px] font-black uppercase tracking-[0.15em] text-[#dce1bb] sm:px-4 sm:text-[10px]">
          <span>Race broadcast</span>
          <span className="truncate text-center">Click a driver to spotlight the player</span>
          <span>01 / 12</span>
        </div>

        <div className="scoreboard-overlay-broadcast-grid grid min-h-0 flex-1 gap-2 pt-2 lg:h-[calc(100vh-150px)] lg:min-h-[560px] lg:flex-none lg:grid-cols-[minmax(180px,0.7fr)_minmax(260px,1.05fr)_minmax(440px,1.9fr)]">
          <DriverStatsPanel driver={selectedDriver} />
          <PortraitPanel driver={selectedDriver} />
          <ResultsPanel drivers={DRIVERS} selectedId={selectedId} onSelect={selectDriver} />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t-2 border-[#ece13b] px-2 pt-2 text-[8px] font-black uppercase tracking-[0.12em] text-[#dce1bb] sm:px-4 sm:text-[9px]">
          <span>{selectedDriver.name} / {selectedDriver.team}</span>
          <span>PixelPopup // Race control</span>
        </footer>
      </div>
    </main>
  );
}

function DriverStatsPanel({ driver }) {
  return (
    <aside className="scoreboard-overlay-stats relative flex min-h-[420px] flex-col overflow-hidden border-[3px] border-[#f0df36] bg-[#101a2d]/80 p-3 shadow-[4px_4px_0_#151b23] sm:p-4 lg:min-h-0">
      <div className="scoreboard-overlay-stats-pattern absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 border-b-2 border-[#f0dfd0]/80 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#f7f0d7]">Featured driver</div>

      <div className="relative z-10 mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="text-[clamp(3.8rem,8vw,6.7rem)] font-black leading-[0.72] tracking-[-0.1em] text-[#f7f0d7]">{driver.rank}<sup className="ml-1 align-top text-[0.25em] tracking-normal text-[#f0df36]">{getRankSuffix(driver.rank)}</sup></div>
        <div className="flex flex-col items-end gap-2">
          <FlagMark code={driver.flag} large />
          <span className="border border-[#f0df36] bg-[#19243a] px-2 py-1 text-[10px] font-black text-[#f7f0d7]">{driver.car}</span>
        </div>
      </div>

      <div className="relative z-10 mt-2 border-b-2 border-[#f0df36] pb-2 text-[clamp(1.45rem,3vw,2.35rem)] font-black uppercase leading-none tracking-[-0.06em] text-[#f7f0d7]">{driver.name}</div>
      <div className="scoreboard-overlay-mini-car relative z-10 mt-3 h-12" style={{ "--overlay-accent": driver.color }} aria-label={`${driver.name} race car`}><span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#f7f0d7]">{driver.car}</span></div>

      <div className="relative z-10 mt-auto grid gap-2 pt-4">
        <StatBlock label="+ POINTS" value={driver.points} />
        <StatBlock label="TOTAL POINTS" value={driver.points} />
      </div>
    </aside>
  );
}

function PortraitPanel({ driver }) {
  return (
    <section className="scoreboard-overlay-portrait-panel relative flex min-h-[440px] flex-col justify-end overflow-hidden px-2 pt-5 sm:px-4 lg:min-h-0" style={{ "--overlay-accent": driver.color }} aria-label={`${driver.name} player spotlight`}>
      <div className="scoreboard-overlay-announcement absolute left-1/2 top-2 z-20 w-max max-w-none -translate-x-1/2 whitespace-nowrap px-2 text-center font-serif text-[clamp(0.9rem,1.6vw,1.35rem)] font-bold italic text-[#f7f0d7] drop-shadow-[2px_2px_0_#14212a]">{driver.name} finished {driver.rank}{getRankSuffix(driver.rank)}.</div>
      <div className="scoreboard-overlay-portrait-stage relative mx-auto h-full min-h-[360px] w-full max-w-[430px]">
        <div className="scoreboard-overlay-portrait-glow absolute bottom-7 left-1/2 h-[75%] w-[78%] -translate-x-1/2" aria-hidden="true" />
        <div className="scoreboard-overlay-portrait-frame absolute inset-x-[8%] bottom-4 top-8 border-2 border-[var(--overlay-accent)] opacity-80" aria-hidden="true" />
        <img src={driver.portrait} alt={`${driver.name} highlighted portrait`} className="relative z-10 h-full w-full object-contain object-bottom" />
        <div className="absolute bottom-2 left-1/2 z-20 w-[82%] -translate-x-1/2 border-2 border-[#f0df36] bg-[#152034]/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#f7f0d7] sm:text-xs">MFG Round 1 / Odawara Pikes Peak / {driver.rank}{getRankSuffix(driver.rank)}: {driver.name}</div>
      </div>
    </section>
  );
}

function ResultsPanel({ drivers, selectedId, onSelect }) {
  return (
    <section className="scoreboard-overlay-results flex min-h-[500px] min-w-0 flex-col border-l-0 border-[#f0df36]/60 bg-[#111b2c]/45 px-1 sm:px-2 lg:min-h-0 lg:border-l-2 lg:pl-3" aria-labelledby="overlay-results-heading">
      <div className="flex items-end justify-between border-b-2 border-[#f0df36] pb-1">
        <div className="text-[clamp(1.25rem,3vw,2.4rem)] font-black uppercase italic leading-none tracking-[-0.06em] text-[#f7f0d7]" id="overlay-results-heading">Race result</div>
        <div className="text-[9px] font-black uppercase tracking-[0.1em] text-[#dce1bb]">Select player</div>
      </div>
      <div className="scoreboard-overlay-result-list min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-1" aria-label="Selectable race results">
        {drivers.map((driver) => <ResultRow key={driver.id} driver={driver} selected={driver.id === selectedId} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function ResultRow({ driver, selected, onSelect }) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(driver.id)} className={`scoreboard-overlay-result-row group relative mb-1 grid w-full grid-cols-[30px_34px_minmax(0,1fr)_56px] items-center gap-1 border-2 px-1.5 py-1 text-left transition sm:grid-cols-[34px_38px_minmax(0,1fr)_66px] sm:gap-2 sm:px-2 ${selected ? "scoreboard-overlay-result-row-selected !text-[#172335]" : "!bg-[#26334a]/90 !text-[#f7f0d7] hover:-translate-y-0.5 hover:!bg-[#3b485b]"}`} style={{ "--overlay-accent": driver.color }}>
      <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-black sm:h-7 sm:w-7 sm:text-xs ${selected ? "border-[#172335] bg-[#f7f0d7] text-[#172335]" : "border-[#f7f0d7] bg-[#31425a] text-[#f7f0d7]"}`}>{driver.rank}</span>
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[#f7f0d7] text-[9px] font-black" style={{ backgroundColor: driver.color, color: "#172335" }}>{getCarNumber(driver.car)}</span>
      <span className="flex min-w-0 items-center gap-2"><FlagMark code={driver.flag} /><span className="min-w-0"><span className={`block truncate text-[10px] font-black uppercase sm:text-xs ${selected ? "text-[#172335]" : "text-[#f7f0d7]"}`}>{driver.name} <span className="font-normal opacity-80">/ {driver.team}</span></span></span></span>
      <span className={`text-right text-[10px] font-black sm:text-xs ${selected ? "text-[#172335]" : "text-[#f0df36]"}`}>{driver.gap}</span>
      {selected ? <span className="absolute -right-1 -top-2 border border-[#172335] bg-[#f7f0d7] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#172335]">Player</span> : null}
    </button>
  );
}

function FlagMark({ code, large = false }) {
  const colors = FLAG_COLORS[code] || FLAG_COLORS.US;
  return <span className={`flex ${large ? "h-7 w-10" : "h-4 w-6"} shrink-0 overflow-hidden border border-[#f7f0d7]`} aria-label={`${code} flag`} title={code}><i className="flex-1" style={{ backgroundColor: colors[0] }} /><i className="flex-1" style={{ backgroundColor: colors[1] }} /><i className="flex-1" style={{ backgroundColor: colors[2] }} /></span>;
}

function StatBlock({ label, value }) {
  return <div className="border-2 border-[#f0df36] bg-[#151e34]/90 px-2 py-1.5"><div className="text-[10px] font-black uppercase tracking-[0.08em] text-[#f7f0d7]">{label}</div><div className="text-right text-[clamp(2rem,4vw,3.6rem)] font-black leading-[0.8] text-[#f7f0d7]">{value}</div></div>;
}

function getCarNumber(car) {
  return car.split("-")[1] || car;
}

function getRankSuffix(rank) {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}
