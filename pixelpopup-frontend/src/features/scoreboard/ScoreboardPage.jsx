import { useRef, useState } from "react";
import "./scoreboard.css";
import { DRIVERS, FLAG_COLORS } from "./scoreboardData";

export default function ScoreboardPage() {
  const [selectedId, setSelectedId] = useState(DRIVERS[0].id);
  const clickAudio = useRef(null);
  const selectedDriver = DRIVERS.find((driver) => driver.id === selectedId) || DRIVERS[0];

  const selectDriver = (driverId) => {
    try {
      if (!clickAudio.current) {
        clickAudio.current = new Audio("/bruh.mp3");
        clickAudio.current.preload = "auto";
        clickAudio.current.volume = 0.2;
      }
      clickAudio.current.currentTime = 0;
      void clickAudio.current.play();
    } catch {
      // Sound is an optional enhancement; selection still works silently.
    }
    setSelectedId(driverId);
  };

  return (
    <main className="scoreboard-page min-h-screen px-3 py-4 text-[#e9e0c9] sm:px-6 sm:py-7">
      <section className="scoreboard-shell mx-auto max-w-[1400px] overflow-hidden border-[3px] border-[#d2c6a1] bg-[#182728] shadow-[8px_8px_0_#080d0e]" aria-label="Pixel Grand Prix scoreboard">
        <header className="scoreboard-titlebar flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#d2c6a1] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5" aria-hidden="true"><i className="h-3 w-3 bg-[#d46f69]" /><i className="h-3 w-3 bg-[#d1a15c]" /><i className="h-3 w-3 bg-[#7fa56e]" /></span>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#eee4c9]">PIXEL GRAND PRIX</span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-[#9eb1a2] sm:inline">MFG ROUND 01</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b9c5b0]">
            <span>RACE RESULT</span>
            <span className="border border-[#788a79] px-2 py-1 text-[#d1a15c]">LIVE BOARD</span>
          </div>
        </header>

        <div className="scoreboard-trackline flex items-center justify-between border-b border-[#65796d] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9c5b0] sm:px-6">
          <span>ODAWARA / PIKES PEAK</span>
          <span className="hidden sm:inline">SELECT A DRIVER TO INSPECT</span>
          <span>01 / 12</span>
        </div>

        <div className="grid lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.5fr)]">
          <DriverCard driver={selectedDriver} />
          <ResultsBoard drivers={DRIVERS} selectedId={selectedId} onSelect={selectDriver} />
        </div>

        <footer className="flex flex-col gap-2 border-t-[3px] border-[#d2c6a1] bg-[#203233] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9bbac] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Click a result row to change the featured driver</span>
          <span>PIXELPOPUP // RACE CONTROL</span>
        </footer>
      </section>
    </main>
  );
}

function DriverCard({ driver }) {
  return (
    <aside className="scoreboard-driver-card relative overflow-hidden border-b-[3px] border-[#d2c6a1] p-5 sm:p-7 lg:border-b-0 lg:border-r-[3px]" style={{ "--driver-accent": driver.color }}>
      <div className="scoreboard-card-grid absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex items-start justify-between text-[10px] font-black uppercase tracking-[0.18em] text-[#b9c5b0]">
        <span>FEATURED DRIVER</span>
        <span className="border border-[#b9c5b0]/60 px-2 py-1">{driver.car}</span>
      </div>

      <div className="relative z-10 mt-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[clamp(4rem,10vw,7.5rem)] font-black leading-[0.78] tracking-[-0.1em] text-[#efe6c9]">{driver.rank}<sup className="ml-1 align-top text-[0.27em] tracking-normal text-[var(--driver-accent)]">{driver.rank === 1 ? "st" : driver.rank === 2 ? "nd" : driver.rank === 3 ? "rd" : "th"}</sup></div>
          <div className="mt-4 flex items-center gap-2">
            <FlagMark code={driver.flag} />
            <span className="text-sm font-black text-[#e9e0c9]">{driver.flag}</span>
          </div>
        </div>
        <div className="scoreboard-portrait-wrap relative h-52 w-36 shrink-0 self-end overflow-hidden border-2 border-[#d2c6a1] bg-[#394c4b] sm:h-64 sm:w-44">
          <div className="absolute inset-0 bg-gradient-to-t from-[#182728] via-transparent to-transparent" />
          <img src={driver.portrait} alt={`${driver.name} portrait`} className="relative h-full w-full object-cover object-top mix-blend-normal" />
        </div>
      </div>

      <div className="relative z-10 mt-6 border-t-2 border-[#d2c6a1] pt-4">
        <div className="text-[clamp(1.8rem,4vw,3rem)] font-black leading-none tracking-[-0.06em] text-[#efe6c9]">{driver.name}</div>
        <div className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--driver-accent)]">{driver.team}</div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-2 gap-2">
        <StatBox label="POINTS" value={String(driver.points)} />
        <StatBox label="BEST LAP" value={`1:${String(42 + driver.rank).padStart(2, "0")}.8`} />
      </div>
      <div className="relative z-10 mt-3 border border-[#7d917f] bg-[#233737] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b9c5b0]">Selected from the race result board</div>
    </aside>
  );
}

function ResultsBoard({ drivers, selectedId, onSelect }) {
  return (
    <section className="min-w-0 p-4 sm:p-6" aria-labelledby="results-heading">
      <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-[#d2c6a1] pb-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9eb1a2]">MFG ROUND 01</div>
          <h1 id="results-heading" className="mt-1 text-2xl font-black uppercase tracking-[-0.04em] text-[#eee4c9] sm:text-4xl">Race result</h1>
        </div>
        <div className="hidden text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9eb1a2] sm:block">12 drivers<br /><span className="text-[#d1a15c]">click to inspect</span></div>
      </div>

      <div className="scoreboard-list">
        {drivers.map((driver) => <DriverRow key={driver.id} driver={driver} selected={driver.id === selectedId} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function DriverRow({ driver, selected, onSelect }) {
  const colors = FLAG_COLORS[driver.flag] || FLAG_COLORS.US;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(driver.id)}
      className={`scoreboard-row group relative mb-2 grid w-full grid-cols-[38px_38px_minmax(0,1fr)_64px] items-center gap-2 border-2 px-2 py-2 text-left transition sm:grid-cols-[44px_48px_minmax(0,1fr)_78px] sm:gap-3 sm:px-3 ${selected ? "scoreboard-row-selected" : "border-[#728278] bg-[#263a3a] hover:-translate-y-0.5 hover:border-[#d2c6a1] hover:bg-[#304646]"}`}
      style={{ "--driver-accent": driver.color }}
    >
      <span className={`text-center font-black ${selected ? "text-[#182728]" : "text-[#b9c5b0]"}`}>{driver.rank}</span>
      <FlagMark code={driver.flag} colors={colors} />
      <span className="min-w-0">
        <span className={`block truncate text-xs font-black uppercase sm:text-sm ${selected ? "text-[#182728]" : "text-[#eee4c9]"}`}>{driver.name}</span>
        <span className={`mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] ${selected ? "text-[#30483c]" : "text-[#9eb1a2]"}`}>{driver.team}</span>
      </span>
      <span className={`text-right text-xs font-black sm:text-sm ${selected ? "text-[#182728]" : "text-[#d1a15c]"}`}>{driver.gap}</span>
      {selected ? <span className="absolute -right-2 -top-2 border border-[#182728] bg-[#e9e0c9] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#182728]">Your driver</span> : null}
    </button>
  );
}

function FlagMark({ code, colors = FLAG_COLORS[code] || FLAG_COLORS.US }) {
  return <span className="flex h-5 w-7 shrink-0 overflow-hidden border border-[#d2c6a1]" aria-label={`${code} flag`} title={code}><i className="flex-1" style={{ backgroundColor: colors[0] }} /><i className="flex-1" style={{ backgroundColor: colors[1] }} /><i className="flex-1" style={{ backgroundColor: colors[2] }} /></span>;
}

function StatBox({ label, value }) {
  return <div className="border-2 border-[#d2c6a1] bg-[#243737] p-3"><div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9eb1a2]">{label}</div><div className="mt-1 text-2xl font-black text-[#eee4c9]">{value}</div></div>;
}
