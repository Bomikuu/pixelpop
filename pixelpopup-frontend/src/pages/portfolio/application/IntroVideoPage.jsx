import { ArrowRight, Code2, Database, Download, FileText, Play, UsersRound, Video } from "lucide-react";
import ApplicationPageShell from "./ApplicationPageShell";
import { applicationProfile, introVideo } from "./applicationData";

const topicIcons = {
  frontend: Code2,
  delivery: Database,
  leadership: UsersRound,
};

export default function IntroVideoPage() {
  return (
    <ApplicationPageShell
      title="Intro Video"
      description="Intro video page for Mico Ang, senior frontend-focused full-stack developer and technical lead."
      canonicalPath="/portfolio/intro-video"
    >
      <section className="relative overflow-hidden border-b border-[#dbe7f3] bg-white px-5 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="pointer-events-none absolute -left-28 bottom-[-9rem] size-80 rotate-45 bg-[#f2f7ff]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-20 size-64 rotate-45 bg-[#f6f9fd]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
          <div className="max-w-4xl">
            <h1 className="portfolio-display text-balance text-5xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-7xl">
              {introVideo.heading}
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-[#536b86] sm:text-2xl sm:leading-9">
              {introVideo.summary}
            </p>
          </div>
          <div className="border-t border-[#ccdaea] pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center bg-[#edf4ff] text-[#2f5bff]">
                <Video size={22} aria-hidden="true" />
              </span>
              <p className="text-sm leading-6 text-[#536b86]">The final recording is coming soon. Preview the topics covered below or continue with the written application.</p>
            </div>
            <div className="mt-6 grid gap-3">
              <a href="/portfolio/introduction-letter" className="group inline-flex min-h-[52px] items-center justify-between gap-3 bg-[#2f5bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(47,91,255,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Read introduction letter <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href={applicationProfile.resume} download className="inline-flex min-h-12 items-center justify-between gap-3 border border-[#bfd0e2] bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Download résumé <Download size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8fbff] px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute right-10 top-14 grid grid-cols-5 gap-3 opacity-40" aria-hidden="true">
          {Array.from({ length: 15 }).map((_, index) => <span key={index} className="size-1 bg-[#8eb8ff]" />)}
        </div>
        <div className="group relative mx-auto grid max-w-7xl overflow-hidden bg-[#071a39] ring-1 ring-[#d4e1ef] lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.55fr)]">
          <figure className="relative min-h-[30rem] overflow-hidden sm:min-h-[38rem]">
            <img
              className="absolute inset-0 size-full object-cover object-top opacity-75 transition duration-700 ease-out group-hover:scale-[1.035] group-hover:opacity-85 motion-reduce:transform-none motion-reduce:transition-none"
              src={introVideo.poster}
              alt="Mico Ang in a professional portrait"
            />
            <div className="absolute inset-0 bg-[#071a39]/48 transition-colors duration-500 group-hover:bg-[#071a39]/38 motion-reduce:transition-none" aria-hidden="true" />
            <div className="absolute left-6 top-6 text-white sm:left-9 sm:top-8">
              <strong className="block text-xs font-semibold tracking-[0.18em] text-[#bbd6fa] uppercase">Intro video</strong>
              <span className="mt-2 block text-xs tracking-[0.14em] text-[#94b6df] uppercase">Get to know me</span>
            </div>
            <div className="absolute inset-0 grid place-items-center px-5">
              <div className="max-w-lg border border-white/20 bg-[#06152f]/92 px-7 py-8 text-center text-white transition duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none sm:px-12 sm:py-10">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#2f5bff] shadow-[0_12px_32px_-16px_rgba(47,91,255,0.9)] transition duration-500 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">
                  <Play size={25} fill="currentColor" />
                </span>
                <h2 className="portfolio-display mt-6 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Intro video coming soon</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c6d8ee]">The portrait preview is ready while the final recording is being prepared.</p>
              </div>
            </div>
            <figcaption className="absolute inset-x-6 bottom-6 flex flex-col gap-2 text-white sm:inset-x-9 sm:bottom-8 sm:flex-row sm:items-end sm:justify-between">
              <span><strong className="block text-xs tracking-[0.16em] uppercase">{applicationProfile.name}</strong><small className="mt-1 block text-xs text-[#aec8e8]">{applicationProfile.role}</small></span>
              <span className="text-xs tracking-[0.16em] text-[#aec8e8] uppercase">Build · Learn · Lead</span>
            </figcaption>
          </figure>
          <aside className="border-t border-white/15 p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-11">
            <div className="flex items-center gap-3 text-[#9dc8ff]">
              <Play size={18} aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase">What I will cover</span>
            </div>
            <div className="mt-8 divide-y divide-white/15">
              {introVideo.topics.map((topic) => {
                const TopicIcon = topicIcons[topic.id] || FileText;
                return (
                  <article key={topic.id} className="group/topic grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 py-7 first:pt-0 last:pb-0">
                    <span className="grid size-[52px] place-items-center bg-[#173f9b] text-[#9dc8ff] transition duration-300 group-hover/topic:translate-x-1 group-hover/topic:bg-[#2056cb] group-hover/topic:text-white motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">
                      <TopicIcon size={22} />
                    </span>
                    <div>
                      <h2 className="portfolio-display text-xl font-semibold tracking-[-0.02em]">{topic.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#bfd0e5]">{topic.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
