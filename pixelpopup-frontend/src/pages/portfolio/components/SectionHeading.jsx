import Reveal from "./Reveal";

export default function SectionHeading({ id, title, description }) {
  return (
    <header className="mb-14 grid gap-7 border-b border-slate-200 pb-9 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)] md:items-end lg:mb-20">
      <Reveal>
        <h2 id={id} className="portfolio-display max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={1} className="md:justify-self-end">
        <p className="max-w-xl text-base leading-7 text-slate-600 md:max-w-md">{description}</p>
      </Reveal>
    </header>
  );
}
