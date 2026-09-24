import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Camera,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  Gauge,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Mic,
  Monitor,
  Mouse,
  Router,
  ShieldCheck,
  UploadCloud,
  Video,
  Wifi,
} from "lucide-react";
import ApplicationPageShell from "./ApplicationPageShell";
import { applicationProfile } from "./applicationData";

const networkMetrics = [
  {
    label: "Download speed",
    value: "516.76",
    unit: "Mbps",
    detail: "Latest supplied result",
    icon: ArrowDownToLine,
    emphasis: true,
  },
  {
    label: "Upload speed",
    value: "519.97",
    unit: "Mbps",
    detail: "Latest supplied result",
    icon: ArrowUpFromLine,
    emphasis: true,
  },
  {
    label: "Idle ping",
    value: "8",
    unit: "ms",
    detail: "Latency before load",
    icon: Gauge,
  },
  {
    label: "Download latency",
    value: "14",
    unit: "ms",
    detail: "Latency during download",
    icon: Activity,
  },
  {
    label: "Upload latency",
    value: "12",
    unit: "ms",
    detail: "Latency during upload",
    icon: UploadCloud,
  },
  {
    label: "Internet provider",
    value: "PLDT Home Fiber",
    detail: "Cagayan de Oro server, multi-connection test",
    icon: Router,
  },
];

const workstationSpecs = [
  {
    label: "Workstation",
    value: "ASUS TUF Gaming A15",
    detail: "Model FA507NV",
    icon: Laptop,
    wide: true,
  },
  {
    label: "Processor",
    value: "AMD Ryzen 7 7735HS",
    detail: "16 logical processors, approximately 3.2 GHz",
    icon: Cpu,
  },
  {
    label: "Memory",
    value: "16 GB RAM",
    detail: "15.6 GB available to Windows",
    icon: MemoryStick,
  },
  {
    label: "Dedicated graphics",
    value: "NVIDIA RTX 4060 Laptop GPU",
    detail: "Approximately 8 GB dedicated graphics memory",
    icon: Boxes,
    wide: true,
  },
  {
    label: "System storage",
    value: "486.9 GB",
    detail: "Primary system drive capacity",
    icon: HardDrive,
  },
  {
    label: "Operating environment",
    value: "Windows 11 64-bit",
    detail: "DirectX 12",
    icon: ShieldCheck,
  },
  {
    label: "Monitor setup",
    value: "2 × LG UltraGear 27-inch",
    detail: "2560 × 1440 (2K) at 180 Hz on both displays",
    icon: Monitor,
    wide: true,
  },
  {
    label: "Additional laptop",
    value: "MacBook Air M3",
    detail: "16 GB memory",
    icon: Laptop,
  },
];

const peripheralSpecs = [
  {
    label: "Microphone",
    value: "MAONO DM40 ProS",
    detail: "Wireless gaming microphone",
    icon: Mic,
  },
  {
    label: "Camera",
    value: "Insta360 Link",
    detail: "PTZ 4K webcam",
    icon: Camera,
  },
  {
    label: "Mouse",
    value: "Razer DeathAdder V3 HyperSpeed",
    detail: "Mouse",
    icon: Mouse,
  },
  {
    label: "Mouse",
    value: "Logitech G903",
    detail: "Mouse",
    icon: Mouse,
  },
  {
    label: "Headset",
    value: "Corsair HS80",
    detail: "Headset",
    icon: Headphones,
  },
  {
    label: "Keyboard",
    value: "Yunzii AL80",
    detail: "Keyboard",
    icon: Keyboard,
  },
  {
    label: "Keyboard",
    value: "Wooting 60HE+",
    detail: "Keyboard",
    icon: Keyboard,
  },
];

const readinessItems = [
  {
    title: "High-bandwidth collaboration",
    description: "The supplied connection result has headroom for video calls, screen sharing, and large project transfers.",
    icon: Video,
  },
  {
    title: "Development headroom",
    description: "The processor and memory configuration supports modern frontend and full-stack development workflows.",
    icon: Code2,
  },
  {
    title: "GPU-accelerated work",
    description: "Dedicated RTX graphics supports hardware-accelerated creative tools, 3D work, and visual QA.",
    icon: Boxes,
  },
];

function MetricTile({ icon: Icon, label, value, unit, detail, emphasis = false }) {
  return (
    <article
      className={`group flex min-h-52 flex-col justify-between rounded-xl border p-6 transition duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${
        emphasis
          ? "border-[#2f5bff] bg-[#2f5bff] text-white hover:bg-[#2448d8]"
          : "border-[#d7e3ef] bg-white text-slate-950 hover:border-[#2f5bff] hover:bg-[#f6f9ff]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-12 place-items-center transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none ${emphasis ? "bg-white/14 text-white" : "bg-[#edf4ff] text-[#2f5bff]"}`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className={`text-xs font-semibold tracking-[0.12em] uppercase ${emphasis ? "text-blue-100" : "text-[#60758b]"}`}>{label}</span>
      </div>
      <div className="mt-8">
        <p className="portfolio-display flex flex-wrap items-end gap-x-2 tabular-nums">
          <strong className={`${value.length > 10 ? "text-3xl" : "text-5xl"} font-semibold tracking-[-0.03em]`}>{value}</strong>
          {unit ? <span className={`pb-1 text-sm font-semibold ${emphasis ? "text-blue-100" : "text-[#60758b]"}`}>{unit}</span> : null}
        </p>
        <p className={`mt-3 text-sm leading-6 ${emphasis ? "text-blue-100" : "text-[#60758b]"}`}>{detail}</p>
      </div>
    </article>
  );
}

function SpecTile({ icon: Icon, label, value, detail, wide = false }) {
  return (
    <article className={`group rounded-xl border border-[#d7e3ef] bg-white p-6 transition duration-300 ease-out hover:-translate-y-1 hover:border-[#2f5bff] hover:bg-[#f6f9ff] motion-reduce:transform-none motion-reduce:transition-none ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center bg-[#edf4ff] text-[#2f5bff] transition duration-300 group-hover:-translate-y-1 group-hover:bg-[#2f5bff] group-hover:text-white motion-reduce:transform-none motion-reduce:transition-none">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#60758b] uppercase">{label}</p>
          <h3 className="portfolio-display mt-3 text-2xl font-semibold leading-tight tracking-[-0.025em] text-slate-950">{value}</h3>
          <p className="mt-2 text-sm leading-6 text-[#60758b]">{detail}</p>
        </div>
      </div>
    </article>
  );
}

export default function WorkSetupPage() {
  return (
    <ApplicationPageShell
      title="Work Setup"
      description="Internet connection, workstation, and peripherals for Mico Ang's remote software development setup."
      canonicalPath="/portfolio/work-setup"
    >
      <section className="relative overflow-hidden border-b border-[#dbe7f3] bg-white px-5 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="pointer-events-none absolute -left-28 bottom-[-9rem] size-80 rotate-45 bg-[#f2f7ff]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-20 size-64 rotate-45 bg-[#f6f9fd]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
          <div className="max-w-4xl">
            <h1 className="portfolio-display text-balance text-5xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-7xl">Remote work setup</h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-[#536b86] sm:text-2xl sm:leading-9">The workstation, desk gear, and connectivity behind dependable product delivery.</p>
          </div>
          <div className="border-t border-[#ccdaea] pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center bg-[#edf4ff] text-[#2f5bff]"><ShieldCheck size={22} aria-hidden="true" /></span>
              <p className="text-sm leading-6 text-[#536b86]">A transparent view of the workstation and network used for remote engineering and collaboration.</p>
            </div>
            <a href={applicationProfile.resume} download className="group mt-6 inline-flex min-h-[52px] w-full items-center justify-between gap-3 bg-[#2f5bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(47,91,255,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
              Download résumé <Download size={18} className="transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8fbff] px-5 py-14 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute right-10 top-14 grid grid-cols-5 gap-3 opacity-40" aria-hidden="true">
          {Array.from({ length: 15 }).map((_, index) => <span key={index} className="size-1 bg-[#8eb8ff]" />)}
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="portfolio-display text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Internet connection</h2>
            <p className="mt-4 text-base leading-7 text-[#536b86]">Values transcribed from the supplied Speedtest result. Actual performance can vary with routing, congestion, and network conditions.</p>
            <a href="https://www.speedtest.net/" target="_blank" rel="noopener noreferrer" className="group mt-6 inline-flex min-h-[52px] w-full items-center justify-between gap-4 bg-[#2f5bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(47,91,255,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] motion-reduce:transform-none motion-reduce:transition-none sm:w-auto">
              <span className="flex items-center gap-3"><Gauge size={19} aria-hidden="true" />Run Speedtest</span>
              <ExternalLink size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {networkMetrics.map((metric) => <MetricTile key={metric.label} {...metric} />)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="portfolio-display text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Workstation specifications</h2>
            <p className="mt-4 text-base leading-7 text-[#536b86]">Windows hardware and display details from the supplied DxDiag file, plus an additional laptop.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workstationSpecs.map((spec) => <SpecTile key={spec.label} {...spec} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbff] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="portfolio-display text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Desk peripherals</h2>
            <p className="mt-4 text-base leading-7 text-[#536b86]">The microphone, camera, input devices, and headset used day to day.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {peripheralSpecs.map((spec) => <SpecTile key={`${spec.label}-${spec.value}`} {...spec} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#071a39] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="portfolio-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Ready for remote product work</h2>
            <p className="mt-4 text-base leading-7 text-[#bfd0e5]">The supplied specifications indicate a setup suited to collaborative engineering, product delivery, and visual development work.</p>
          </div>
          <div className="mt-10 grid divide-y divide-white/15 border-y border-white/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {readinessItems.map(({ icon: Icon, title, description }) => (
              <article key={title} className="group py-7 lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <Icon size={24} className="text-[#7fb6ff] transition duration-300 group-hover:-translate-y-1 group-hover:text-white motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
                <h3 className="portfolio-display mt-5 text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#bfd0e5]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbff] px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-y border-[#ccdaea] py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-slate-950">Continue through the application material</h2>
            <p className="mt-2 text-sm leading-6 text-[#536b86]">Review the written introduction and experience summary.</p>
          </div>
          <a href="/portfolio/introduction-letter" className="group inline-flex min-h-12 items-center gap-3 self-start border border-[#bfd0e2] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] sm:self-auto">
            Read introduction letter <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
        <p className="mx-auto mt-6 flex max-w-7xl items-start gap-3 text-xs leading-5 text-[#647990]"><Wifi size={15} className="mt-0.5 shrink-0" aria-hidden="true" />Network values come from the supplied Speedtest screenshot. Windows specifications come from the DxDiag report; the additional laptop and peripherals were provided separately. Public IP and sensitive device identifiers are intentionally omitted.</p>
      </section>
    </ApplicationPageShell>
  );
}
