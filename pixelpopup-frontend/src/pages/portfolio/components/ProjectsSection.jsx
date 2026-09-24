import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { projects } from "../portfolioData";
import CorticoProof from "./CorticoProof";
import MediaCarousel from "./MediaCarousel";
import Reveal from "./Reveal";

const formatIndex = (index) => String(index + 1).padStart(2, "0");

const projectTechnologyIcons = {
  Vue: "/portfolio/tech/vue.svg",
  Nuxt: "/portfolio/tech/nuxt.svg",
  Django: "/portfolio/tech/django.svg",
  Strapi: "/portfolio/tech/strapi.svg",
  Mapbox: "/portfolio/tech/mapbox.svg",
  "Mapbox GL": "/portfolio/tech/mapbox.svg",
  "Tailwind CSS": "/portfolio/tech/tailwind.svg",
  Hotjar: "/portfolio/tech/hotjar.svg",
  WebGL: "/portfolio/tech/webgl.svg",
  "Responsive UI": "/portfolio/tech/tailwind.svg",
  WebSockets: "/portfolio/tech/socketio.svg",
  Stripe: "/portfolio/tech/stripe.svg",
  PostgreSQL: "/portfolio/tech/postgresql.svg",
  React: "/portfolio/tech/react.svg",
  "Material UI": "/portfolio/tech/materialui.svg",
  "Redux-Saga": "/portfolio/tech/redux.svg",
  Python: "/portfolio/tech/python.svg",
  Charts: "/portfolio/tech/chartjs.svg",
};

function ProjectStory({ project, index, registerPanel }) {
  const externalLink = project.link?.startsWith("http");
  const projectLinkClassName = project.linkProminent
    ? "group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7aa2ff] active:translate-y-px"
    : "group inline-flex items-center gap-2 font-semibold text-slate-900 transition-colors hover:text-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]";
  const media = project.id === "cortico"
    ? <CorticoProof metrics={project.metrics} />
    : <MediaCarousel slides={project.slides} label={project.title} />;

  return (
    <article
      ref={(node) => registerPanel(project.id, node)}
      id={`project-${project.id}`}
      className="portfolio-work-panel relative scroll-mt-28 border-t border-slate-200 py-16 lg:min-h-[calc(100svh-7rem)] lg:py-12"
    >
      <Reveal stagger>
        <div className="mb-10 flex items-center justify-between gap-5">
          <span className="text-sm font-semibold tabular-nums text-[#2f5bff]">{formatIndex(index)}</span>
          <span className="text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{project.type}</span>
        </div>

        <div className="portfolio-project-summary max-w-5xl">
          <div>
            <h3 className="portfolio-display text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">{project.title}</h3>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{project.summary}</p>

            <div className="mt-8 grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">My role</span>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{project.role}</p>
              </div>

              {project.link ? (
                <a href={project.link} target={externalLink ? "_blank" : undefined} rel={externalLink ? "noreferrer" : undefined} className={projectLinkClassName}>
                  {project.linkLabel} <ArrowUpRight size={17} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : (
                <p className="text-sm font-semibold text-[#2f5bff]">{project.linkLabel}</p>
              )}
            </div>
          </div>
        </div>

        <div className="portfolio-project-media mt-12">{media}</div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2" aria-label={`${project.title} outcomes`}>
            {project.outcomes.map((outcome) => (
              <li key={outcome} className="portfolio-stagger-item flex gap-3 text-sm leading-6 text-slate-600">
                <CheckCircle2 size={17} className="mt-1 shrink-0 text-[#2f5bff]" aria-hidden="true" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
            {project.technologies.map((technology) => (
              <span key={technology} className="portfolio-stagger-item portfolio-project-tech inline-flex items-center gap-2 rounded-full border border-slate-200 !bg-white px-3 py-1.5 text-xs font-medium !text-[#475569] hover:!border-blue-300 hover:!bg-blue-50 hover:!text-[#2149dc]">
                <span className="portfolio-project-tech__icon grid size-5 shrink-0 place-items-center" aria-hidden="true">
                  <img
                    src={projectTechnologyIcons[technology] ?? "/portfolio/tech/javascript.svg"}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </span>
                {technology}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </article>
  );
}

function ProjectLinks({ activeProject, onProjectSelect }) {
  return projects.map((project, index) => {
    const isActive = project.id === activeProject;
    return (
      <a
        key={project.id}
        href={`#project-${project.id}`}
        className="portfolio-work-nav-item group relative block border-l border-slate-200 py-4 pl-5 before:!bg-[#2f5bff]"
        data-active={isActive}
        aria-current={isActive ? "true" : undefined}
        onClick={() => onProjectSelect(project.id)}
      >
        <span className="flex items-center gap-2 text-xs font-semibold tabular-nums text-slate-500">
          {formatIndex(index)}
          <span className="portfolio-work-nav-dot size-1.5 bg-[#2f5bff]" aria-hidden="true" />
        </span>
        <strong className={`mt-1.5 block text-xl font-semibold transition duration-200 ${isActive ? "translate-x-[3px] text-slate-950" : "text-slate-500 group-hover:text-slate-950"}`}>{project.title}</strong>
        <span className={`mt-1 block text-xs leading-5 transition-colors ${isActive ? "text-slate-600" : "text-slate-500"}`}>{project.type}</span>
      </a>
    );
  });
}

export default function ProjectsSection() {
  const [activeProject, setActiveProject] = useState(projects[0].id);
  const panelsRef = useRef(new Map());

  const registerPanel = (id, node) => {
    if (node) panelsRef.current.set(id, node);
    else panelsRef.current.delete(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries.find((entry) => entry.isIntersecting);
        if (activeEntry) setActiveProject(activeEntry.target.id.replace("project-", ""));
      },
      {
        rootMargin: "-45% 0px -54% 0px",
        threshold: 0,
      },
    );

    panelsRef.current.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  const activeIndex = Math.max(0, projects.findIndex((project) => project.id === activeProject));

  return (
    <section
      id="work"
      className="portfolio-work-section scroll-mt-24 bg-slate-50 text-slate-950"
      style={{ backgroundImage: "radial-gradient(circle, rgba(47, 91, 255, 0.18) 1px, transparent 1px)" }}
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="portfolio-work-floating-index">
          <aside className="portfolio-work-floating-index__inner" aria-label="Selected work navigation">
            <div className="flex items-center gap-3">
              <span className="size-2 bg-[#2f5bff]" aria-hidden="true" />
              <h2 className="portfolio-display text-lg font-semibold tracking-[-0.02em]">Selected works</h2>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Scroll through product systems, frontend leadership, and measurable growth work.</p>

            <div className="mt-10 flex items-end gap-2" aria-live="polite" aria-atomic="true">
              <strong className="portfolio-display text-5xl font-semibold tracking-[-0.04em] text-slate-950">{formatIndex(activeIndex)}</strong>
              <span className="pb-1 text-sm font-semibold text-slate-500">/ {String(projects.length).padStart(2, "0")}</span>
            </div>

            <nav className="mt-9" aria-label="Choose a selected project">
              <ProjectLinks activeProject={activeProject} onProjectSelect={setActiveProject} />
            </nav>
          </aside>
        </div>

        <Reveal>
          <header className="portfolio-work-content max-w-3xl py-20 lg:py-12">
            <h2 className="portfolio-display text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">Selected product <span className="text-[#2f5bff]">work.</span></h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">A closer look at the systems, interfaces, and measurable outcomes I’ve helped deliver.</p>
          </header>
        </Reveal>

        <div className="portfolio-work-content portfolio-work-compact-index border-y border-slate-200 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-950">Projects</span>
            <span className="text-xs font-semibold tabular-nums text-slate-500">{formatIndex(activeIndex)} / {String(projects.length).padStart(2, "0")}</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Choose a selected project">
            {projects.map((project, index) => {
              const isActive = project.id === activeProject;
              return (
                <a
                  key={project.id}
                  href={`#project-${project.id}`}
                  className={`inline-flex border-b-2 pb-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] ${isActive ? "border-[#2f5bff] text-slate-950" : "border-transparent text-slate-500 hover:text-slate-950"}`}
                  data-active={isActive}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveProject(project.id)}
                >
                  <span className="mr-2 text-xs tabular-nums">{formatIndex(index)}</span>{project.title}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="portfolio-work-content">
          {projects.map((project, index) => (
            <ProjectStory key={project.id} project={project} index={index} registerPanel={registerPanel} />
          ))}
        </div>
      </div>
    </section>
  );
}
