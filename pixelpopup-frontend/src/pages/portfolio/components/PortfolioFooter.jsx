import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Github,
  Linkedin,
  Mail,
  Navigation,
} from "lucide-react";
import { portfolioLinks } from "../portfolioData";
import LogoMark from "./LogoMark";
import Reveal from "./Reveal";

const portfolioNavigation = [
  ["Selected work", "#work"],
  ["Services", "/portfolio/services"],
  ["Process", "#process"],
  ["Technology", "#stack"],
  ["Work with me", "/portfolio/work-with-me"],
  ["Contact", "#contact"],
];

const resourceLinks = [
  ["Components", "/components"],
  ["Skills", "/skill"],
  ["MCP", "/mcp"],
  ["Examples playground", "/examples/playground"],
  ["AI prompt guide", "/portfolio/ai-prompt-guide"],
  ["ASTA Softwares", "/asta"],
];

const applicationLinks = [
  ["Articles", "/portfolio/articles"],
  ["Interview reference", "/portfolio/interview-reference"],
  ["Introduction letter", "/portfolio/introduction-letter"],
  ["Intro video", "/portfolio/intro-video"],
  ["Work setup", "/portfolio/work-setup"],
];

const socialIcons = { LinkedIn: Linkedin, GitHub: Github, Email: Mail };

function resolveFooterHref(href, routeBase) {
  return href.startsWith("#") ? `${routeBase}${href}` : href;
}

function FooterLinkList({ links, routeBase }) {
  return (
    <ul className="mt-5 space-y-1">
      {links.map(([label, href]) => (
        <li key={label}>
          <a
            href={resolveFooterHref(href, routeBase)}
            className="group flex min-h-9 items-center justify-between gap-4 text-sm text-blue-100/65 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            <span>{label}</span>
            <ArrowUpRight
              size={15}
              className="shrink-0 text-blue-200/45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-200"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function PortfolioFooter({ routeBase = "" }) {
  return (
    <footer id="site-footer" className="relative isolate scroll-mt-24 overflow-hidden bg-[#070d18] px-5 pb-8 pt-16 text-blue-100/75 sm:px-8 sm:pt-20">
      <div
        className="pointer-events-none absolute right-10 top-10 size-36 bg-[radial-gradient(circle,rgba(96,165,250,0.4)_1px,transparent_1.5px)] bg-[size:20px_20px] opacity-30"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[96rem]">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-blue-300/35 bg-[#0b1830] p-7 sm:p-9 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14 lg:p-10">
            <div
              className="pointer-events-none absolute -right-28 -top-40 size-80 rounded-full border border-blue-500/30"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-5 right-8 size-24 bg-[radial-gradient(circle,rgba(147,197,253,0.55)_1px,transparent_1.5px)] bg-[size:18px_18px] opacity-40"
              aria-hidden="true"
            />

            <div className="relative">
              <h2 className="portfolio-display max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-2xl">
                Need stronger frontend leadership?
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100/65 sm:text-lg sm:leading-8">
                Bring me the difficult workflow, scaling problem, or product experience that needs a clear technical path.
              </p>
            </div>

            <div className="relative mt-7 lg:mt-0 lg:min-w-80">
              <a
                href="/portfolio/work-with-me"
                className="group inline-flex min-h-14 w-full items-center justify-between gap-6 rounded-lg bg-white px-6 py-4 font-semibold text-slate-950 transition hover:bg-[#2f5bff] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-200"
              >
                See how we can work together
                <ArrowRight size={19} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <p className="mt-4 text-center text-sm text-blue-100/55">Strategy · Execution · Real impact</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-12 border-t border-white/15 py-14 md:grid-cols-2 lg:grid-cols-[1.2fr_0.75fr_0.9fr_1fr] lg:gap-0 lg:py-16">
          <div className="lg:pr-12">
            <a
              href={`${routeBase}#top`}
              className="portfolio-footer-brand inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
              aria-label="Mico Ang, back to top"
            >
              <LogoMark className="portfolio-logo-mark--footer" />
              <strong className="portfolio-display text-3xl font-semibold tracking-[-0.025em] text-white">Mico Ang</strong>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/65">
              Senior frontend engineer, full-stack developer, and Co-founder &amp; Technical Lead at ASTA Softwares.
            </p>
            <div className="mt-6 flex gap-3">
              {portfolioLinks.map((link) => {
                const Icon = socialIcons[link.label];
                const isExternal = link.href.startsWith("http");

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="grid size-11 place-items-center rounded-lg border border-white/20 text-blue-100 transition hover:border-blue-300 hover:bg-blue-300/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                    aria-label={link.label}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
            <p className="mt-8 max-w-xs border-t border-white/15 pt-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-100/45">
              Better products through people, craft, and clarity.
            </p>
          </div>

          <nav className="lg:border-l lg:border-white/10 lg:px-10" aria-label="Portfolio navigation">
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              <Navigation size={17} className="text-blue-300" aria-hidden="true" />
              Portfolio
            </h3>
            <FooterLinkList links={portfolioNavigation} routeBase={routeBase} />
          </nav>

          <nav className="lg:border-l lg:border-white/10 lg:px-10" aria-label="Build resources">
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              <Boxes size={17} className="text-blue-300" aria-hidden="true" />
              Explore
            </h3>
            <FooterLinkList links={resourceLinks} routeBase={routeBase} />
          </nav>

          <div className="lg:border-l lg:border-white/10 lg:pl-10">
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              <Mail size={17} className="text-blue-300" aria-hidden="true" />
              Contact
            </h3>
            <a
              href="mailto:mico.dahang@gmail.com"
              className="mt-5 flex items-start gap-3 break-all text-sm leading-6 text-blue-100/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              <Mail size={17} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              mico.dahang@gmail.com
            </a>
            <p className="mt-6 border-y border-white/15 py-5 text-sm leading-7 text-blue-100/55">
              Available for senior frontend, full-stack, and leadership opportunities.
            </p>
            <p className="mt-5 flex items-center gap-3 text-sm font-medium text-emerald-300">
              <span className="size-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.7)]" aria-hidden="true" />
              Open to opportunities
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/15 pt-7 text-xs text-blue-100/50 lg:flex-row lg:items-center lg:justify-between">
          <span>© {new Date().getFullYear()} Mico Ang. All rights reserved.</span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Application resources">
            {applicationLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                {label}
              </a>
            ))}
          </nav>
          <span>Built with React, Tailwind CSS, and Three.js.</span>
        </div>
      </div>
    </footer>
  );
}
