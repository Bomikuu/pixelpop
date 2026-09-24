import { createElement, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Box, Braces, CalendarDays, Layers3, SearchCheck, UsersRound } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const strengths = [
  { icon: Braces, title: "Frontend mastery", text: "Architecture, accessibility, interaction, responsive behavior, and maintainable component systems." },
  { icon: Layers3, title: "Full-stack range", text: "Backend, API, deployment, and infrastructure context that keeps frontend decisions grounded." },
  { icon: SearchCheck, title: "Growth awareness", text: "Technical SEO, Search Console, Hotjar, analytics, and Core Web Vitals." },
];

const stats = [
  { icon: Box, value: 40, suffix: "+", label: "Projects shipped" },
  { icon: CalendarDays, value: 8, suffix: "+", label: "Years of experience" },
  { icon: UsersRound, value: 3, suffix: "", label: "Ways I contribute: frontend, full-stack, leadership" },
];

function AnimatedStat({ icon: Icon, value, suffix, label, delay }) {
  const rootRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !window.IntersectionObserver) {
      setDisplayValue(value);
      return undefined;
    }

    let frameId = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const startedAt = performance.now();
      const duration = 1050;
      const animate = (now) => {
        const elapsed = Math.max(0, now - startedAt - delay);
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - ((1 - progress) ** 4);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) frameId = window.requestAnimationFrame(animate);
      };

      frameId = window.requestAnimationFrame(animate);
    }, { threshold: 0.5 });

    observer.observe(root);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [delay, value]);

  const finalValue = `${value}${suffix}`;

  return (
    <div ref={rootRef} className="grid grid-cols-[3.25rem_1fr] items-center gap-4 border-t border-slate-200 p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <span className="grid h-12 w-12 place-items-center bg-[#edf4ff] text-[#2563eb]" aria-hidden="true">
        <Icon size={21} strokeWidth={1.8} />
      </span>
      <div>
        <dt className="portfolio-display text-3xl font-semibold tracking-[-0.04em] text-[#2563eb] tabular-nums" aria-label={finalValue}>
          <span className="sr-only">{finalValue}</span>
          <span aria-hidden="true">{displayValue}{suffix}</span>
        </dt>
        <dd className="mt-0.5 text-xs leading-5 text-slate-600">{label}</dd>
      </div>
    </div>
  );
}

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
          title={<><span className="text-[#2f5bff]">About me.</span> Who am I?</>}
          description="A practical look at the experience, range, and working style I bring to complex product builds."
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">My philosophy</p>
            <p className="portfolio-display mt-5 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              The best interface is the point where a <span className="text-[#2563eb]">complex system starts to feel obvious.</span>
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Since 2018, I have worked across operational software, healthcare, financial products, map experiences, marketing platforms, and interactive web products. I bring that range to the details customers feel most: clarity, speed, and confidence.
            </p>

            <dl className="mt-10 grid border border-slate-200 bg-white sm:grid-cols-3">
              {stats.map((stat, index) => (
                <AnimatedStat key={stat.label} {...stat} delay={index * 110} />
              ))}
            </dl>

            <div className="mt-10 flex items-center justify-between gap-6 border-b border-slate-200 pb-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Areas of expertise</h3>
              <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-300 sm:block">Turning ideas into useful products</span>
            </div>

            <div className="divide-y divide-slate-200">
              {strengths.map(({ icon: Icon, title, text }) => (
                <div key={title} className="grid gap-4 py-5 sm:grid-cols-[4rem_11rem_1fr] sm:items-center">
                  <span className="grid h-12 w-12 place-items-center bg-[#edf4ff] text-[#2563eb]" aria-hidden="true">
                    {createElement(Icon, { size: 22, strokeWidth: 1.8 })}
                  </span>
                  <strong className="text-base text-slate-950">{title}</strong>
                  <p className="text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>

            <a href="https://www.linkedin.com/in/boomiyaah/" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] transition-colors hover:text-[#1746bd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]">
              View LinkedIn <ArrowUpRight size={17} />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
