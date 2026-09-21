import { technologies } from "../portfolioData";
import Reveal from "./Reveal";

const backgroundNotes = [
  { text: <>Built<br />for what&apos;s next</>, className: "left-10 top-12" },
  { text: <><span className="text-[#1570ef]">// 03</span><br />Technology</>, className: "right-10 top-12 text-right" },
  { text: <>Ideas<br />Tools<br />Products<br />Impact</>, className: "left-10 top-[48%]" },
  { text: <>Better interfaces<br />Brighter tomorrows</>, className: "right-10 top-[56%] text-right" },
  { text: <>Modern tools.<br />Meaningful products.</>, className: "bottom-10 left-10" },
  { text: <>A more accessible<br />and open web.</>, className: "bottom-10 right-10 text-right" },
];

export default function TechnologySection() {
  return (
    <section
      id="stack"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-[#9fb9d4] bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
      style={{
        backgroundImage: "linear-gradient(rgba(21, 112, 239, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 112, 239, 0.08) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }}
      aria-labelledby="technology-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,253,255,0.97)_0%,rgba(251,253,255,0.78)_50%,rgba(251,253,255,0.22)_84%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[1] hidden 2xl:block" aria-hidden="true">
        {backgroundNotes.map((note) => (
          <p key={note.className} className={`absolute m-0 text-[10px] font-semibold uppercase leading-[1.7] tracking-[0.24em] text-[#6b93c2] ${note.className}`}>
            {note.text}
          </p>
        ))}
        <p className="absolute inset-x-0 bottom-10 m-0 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6b93c2]">
          Build <span className="px-2 text-[#1570ef]">/</span> Ship <span className="px-2 text-[#1570ef]">/</span> Learn <span className="px-2 text-[#1570ef]">/</span> Repeat
        </p>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="mx-auto max-w-3xl text-center">
            <h2 id="technology-title" className="portfolio-display text-5xl font-semibold tracking-[-0.035em] text-[#081a30] sm:text-6xl lg:text-7xl">
              Technology <span className="text-[#1570ef]">stack.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#52677d]">
              A production-focused toolkit for building accessible interfaces, reliable platforms, and measurable product experiences.
            </p>
          </header>
        </Reveal>

        <Reveal stagger className="mt-14 sm:mt-16">
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Technology stack">
            {technologies.map((technology) => (
              <li key={technology.name} className="portfolio-stagger-item portfolio-tech-card group relative flex min-h-24 items-center gap-4 overflow-hidden rounded-xl !border !border-[#cbd9e8] !bg-white/90 px-5 py-4 hover:!border-[#1570ef] hover:!bg-[#f7fbff]">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-[#d6e1ec] bg-[#f5f9fd] p-3">
                  <img
                    src={`/portfolio/tech/${technology.icon}`}
                    width="24"
                    height="24"
                    loading="lazy"
                    decoding="async"
                    alt=""
                    aria-hidden="true"
                    className="portfolio-tech-icon size-6 !opacity-100 !filter-none object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-base font-semibold text-[#081a30]">{technology.name}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#52677d]">{technology.group}</span>
                </span>
                <span className="rounded-md bg-[#eef3f8] px-3 py-1.5 text-xs font-medium text-[#52677d]">Used</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
