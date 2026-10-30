import { ArrowRight, ArrowUpRight, BookOpen, ClipboardList, Database, Workflow } from "lucide-react";
import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import { howTos } from "./howTos";
import { designStyles, designStylesSource } from "./designStyles";

export default function HowTosIndexPage() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ApplicationPageShell
      title="How-tos"
      description="Practical guides on systems and client workflow, plus a reference to 14 web design styles."
      canonicalPath="/portfolio/how-tos"
    >
      <header className="border-b border-slate-200 bg-white px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <Link to="/portfolio/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2448d8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
            <BookOpen size={17} aria-hidden="true" /> Articles
          </Link>
          <h1 className="portfolio-display mt-7 text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">How-tos</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Practical notes on how I build systems and guide client projects.
          </p>
        </div>
      </header>

      <section className="px-5 py-14 sm:px-8 sm:py-20" aria-label="How-to guides">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 text-slate-600">
            <Workflow size={19} strokeWidth={1.8} aria-hidden="true" />
            <p className="text-sm">{howTos.length} {howTos.length === 1 ? "guide" : "guides"} available</p>
          </div>
          <div className="mt-7 max-w-5xl border-t border-slate-300">
            {howTos.map((guide) => (
              <Link
                key={guide.slug}
                to={guide.href}
                className="group grid gap-5 border-b border-slate-200 py-8 transition-colors hover:bg-blue-50/60 focus-visible:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-5"
              >
                <span className="grid size-14 place-items-center rounded-xl bg-[#eff6ff] text-[#2448d8]" aria-hidden="true">{guide.slug === "client-workflow" ? <ClipboardList size={25} strokeWidth={1.7} /> : <Database size={25} strokeWidth={1.7} />}</span>
                <span>
                  <span className="portfolio-display block text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-4xl">{guide.title}</span>
                  <span className="mt-2 block max-w-2xl text-base leading-7 text-slate-600">{guide.description}</span>
                  <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">{guide.topics.map((topic) => <span key={topic}>{topic}</span>)}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2448d8]">Read guide <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="design-styles" className="scroll-mt-24 border-t border-slate-200 bg-white px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="design-styles-heading">
        <div className="mx-auto max-w-7xl">
          <h2 id="design-styles-heading" className="portfolio-display text-balance text-4xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-5xl">Design styles to recognize</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            The {designStyles.length} styles from {designStylesSource.author}’s video, with my notes on their visual traits, possible uses and implementation tradeoffs.
          </p>
          <a href={designStylesSource.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#2448d8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
            Watch the original video <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
          <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {designStyles.map((style) => (
              <li key={style.slug} className="min-w-0">
                <article id={`design-style-${style.slug}`} aria-labelledby={`design-style-${style.slug}-title`} className="h-full scroll-mt-24 rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 sm:p-7">
                  <h3 id={`design-style-${style.slug}-title`} className="portfolio-display break-words text-3xl font-semibold tracking-[-0.025em] text-slate-950">{style.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{style.description}</p>
                  <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm leading-6">
                    <div><dt className="font-semibold text-slate-950">Try it for</dt><dd className="mt-1 text-slate-600">{style.useCase}</dd></div>
                    <div><dt className="font-semibold text-slate-950">Keep in mind</dt><dd className="mt-1 text-slate-600">{style.caution}</dd></div>
                  </dl>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
