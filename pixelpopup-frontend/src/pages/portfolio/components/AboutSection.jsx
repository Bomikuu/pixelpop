import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const strengths = [
  { title: "Frontend development", text: "I build reusable components, handle loading and error states, and check layouts across screen sizes." },
  { title: "Backend and deployment", text: "I also work on APIs and databases, and deploy the applications I build." },
  { title: "Performance and SEO", text: "I use Core Web Vitals, Search Console, and behavior analytics to find pages that need attention." },
];

export default function AboutSection() {
  const [showRealPortrait, setShowRealPortrait] = useState(false);

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden border-b border-slate-200 bg-[#fbfdff] py-24 sm:py-32">
      <div
        className="pointer-events-none absolute left-[4%] top-[24%] hidden h-24 w-24 opacity-55 lg:block"
        style={{ backgroundImage: "radial-gradient(circle, #8eb4ff 1.6px, transparent 1.7px)", backgroundSize: "18px 18px" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[7%] right-[3%] hidden h-20 w-20 opacity-35 lg:block"
        style={{ backgroundImage: "radial-gradient(circle, #8eb4ff 1.5px, transparent 1.6px)", backgroundSize: "17px 17px" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          title={<span className="text-[#2f5bff]">About me.</span>}
          description="I've worked on web applications since 2018, with most of my time spent on frontend development."
        />

        <div className="grid items-start gap-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-0">
          <Reveal>
            <figure className="mx-auto w-full max-w-md px-3 text-center lg:sticky lg:top-28 lg:px-8">
              <div className="relative mx-auto max-w-sm">
                <span className="absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-[#e6efff]" aria-hidden="true" />
                <button
                  type="button"
                  className="portfolio-portrait-reveal group relative aspect-square w-full overflow-hidden rounded-full border-[7px] border-white bg-[#dce7ff] ring-1 ring-[#bfd3ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#2f5bff]"
                  data-revealed={showRealPortrait}
                  aria-label={showRealPortrait ? "Show Mico Ang's illustrated portrait" : "Reveal Mico Ang's real portrait"}
                  aria-pressed={showRealPortrait}
                  onClick={() => setShowRealPortrait((visible) => !visible)}
                >
                  <img src="/portfolio/assets/mico-ang-pixel-portrait.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="" className="portfolio-portrait-reveal__image portfolio-portrait-reveal__image--real" />
                  <img src="/portfolio/assets/mico-ang-portrait.jpg" width="900" height="900" loading="lazy" decoding="async" alt="" className="portfolio-portrait-reveal__image portfolio-portrait-reveal__image--illustrated" />
                  <span className="portfolio-portrait-reveal__hint" aria-hidden="true">Hover to reveal</span>
                </button>
              </div>
              <figcaption className="mt-8">
                <strong className="portfolio-display block text-2xl font-semibold tracking-[-0.03em] text-slate-950">Mico Ang</strong>
                <span className="mx-auto mt-2 block max-w-xs text-sm leading-6 text-slate-500">Co-founder &amp; Technical Lead · Senior Frontend Developer</span>
                <span className="mx-auto mt-6 block h-0.5 w-14 bg-[#2f5bff]" aria-hidden="true" />
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={1} className="lg:border-l lg:border-slate-200 lg:pl-12 xl:pl-16">
            <p className="portfolio-display max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              I like figuring out how a <span className="text-[#2563eb]">complicated application should work on screen.</span>
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              My projects include healthcare software, financial tools, interactive maps, and restaurant systems. Some work starts with a new design; other work means finding why an existing page is slow or fixing a feature that people already use.
            </p>

            <p className="mt-7 text-sm leading-6 text-slate-600">
              My work history starts in 2018. <a href="#experience-title" className="font-semibold text-[#2149dc] underline underline-offset-4 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">See the roles and dates</a> or <a href="#work" className="font-semibold text-[#2149dc] underline underline-offset-4 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">inspect the selected projects</a>.
            </p>

            <div className="mt-10 flex items-center justify-between gap-6 border-b border-slate-200 pb-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Areas of expertise</h3>
            </div>

            <dl className="divide-y divide-slate-200">
              {strengths.map(({ title, text }) => (
                <div key={title} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-semibold text-slate-950">{title}</dt>
                  <dd className="text-sm leading-6 text-slate-600">{text}</dd>
                </div>
              ))}
            </dl>

            <a href="https://www.linkedin.com/in/boomiyaah/" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] transition-colors hover:text-[#1746bd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">
              View LinkedIn <ArrowUpRight size={17} />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
