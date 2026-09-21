import { ArrowRight, FileText, Play, Video } from "lucide-react";
import ApplicationPageShell from "./ApplicationPageShell";
import { applicationProfile, introVideo } from "./applicationData";

export default function IntroVideoPage() {
  return (
    <ApplicationPageShell
      title="Intro Video"
      description="Intro video page for Mico Ang, senior frontend-focused full-stack developer and technical lead."
      canonicalPath="/portfolio/intro-video"
    >
      <section className="px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-slate-300 pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] lg:items-end lg:gap-16">
            <div>
              <h1 className="portfolio-display text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
                {introVideo.heading}
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">{introVideo.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a href="/portfolio/introduction-letter" className="group inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Read introduction letter <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href={applicationProfile.resume} download className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Download résumé <FileText size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-[#0b1733] lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
          <div className="relative min-h-[26rem] overflow-hidden sm:min-h-[34rem]">
            {introVideo.videoSrc ? (
              <video className="size-full object-cover" controls preload="metadata" poster={introVideo.poster}>
                <source src={introVideo.videoSrc} />
                Your browser does not support embedded video.
              </video>
            ) : (
              <div className="relative grid size-full min-h-[26rem] place-items-center overflow-hidden sm:min-h-[34rem]" role="status" aria-label="Intro video placeholder">
                <img className="absolute inset-0 size-full object-cover object-top opacity-65" src={introVideo.poster} alt="Mico Ang in a professional portrait" />
                <div className="absolute inset-0 bg-[#0b1733]/55" />
                <div className="relative mx-6 max-w-md border border-white/25 bg-[#071122]/90 p-7 text-white sm:p-9">
                  <div className="grid size-12 place-items-center rounded-full bg-[#2f5bff]">
                    <Video size={21} aria-hidden="true" />
                  </div>
                  <h2 className="portfolio-display mt-6 text-3xl font-semibold tracking-[-0.03em]">Intro video coming soon</h2>
                  <p className="mt-3 text-sm leading-6 text-blue-100">The page is ready. Add the final video URL in the application content file when the recording is available.</p>
                </div>
              </div>
            )}
          </div>
          <aside className="border-t border-white/15 p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="flex items-center gap-3 text-blue-200">
              <Play size={18} aria-hidden="true" />
              <span className="text-sm font-semibold">What I will cover</span>
            </div>
            <div className="mt-8 divide-y divide-white/15">
              {introVideo.topics.map((topic) => (
                <article key={topic.id} className="py-6 first:pt-0 last:pb-0">
                  <h2 className="portfolio-display text-xl font-semibold tracking-[-0.02em]">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{topic.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
