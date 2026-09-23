import { Cloud, Cog, Database, Monitor, Server } from "lucide-react";
import AstaReveal from "../AstaReveal";
import technologies from "../data/technologies.json";

const categories = [
  { name: "Frontend", description: "Interfaces, interaction and user experience.", icon: <Monitor className="mt-0.5 size-8 shrink-0 text-[#7db9ff]" strokeWidth={1.9} aria-hidden="true" /> },
  { name: "Backend", description: "APIs, business logic and integrations.", icon: <Server className="mt-0.5 size-8 shrink-0 text-[#7db9ff]" strokeWidth={1.9} aria-hidden="true" /> },
  { name: "Database", description: "Data storage and management.", icon: <Database className="mt-0.5 size-8 shrink-0 text-[#7db9ff]" strokeWidth={1.9} aria-hidden="true" /> },
  { name: "DevOps", description: "Deployment, monitoring and infrastructure.", icon: <Cloud className="mt-0.5 size-8 shrink-0 text-[#7db9ff]" strokeWidth={1.9} aria-hidden="true" /> },
];

export default function AstaTechnologySection() {
  const groups = categories.map((category) => ({
    ...category,
    items: technologies
      .filter((technology) => technology.category === category.name)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <section
      className="relative isolate overflow-hidden bg-[#0e1b2e] py-14 text-white"
      id="technology"
      aria-labelledby="asta-technology-title"
    >
      <span
        className="pointer-events-none absolute -left-4 bottom-0 -z-10 h-72 w-32 opacity-45 [background-image:radial-gradient(circle,#6588b2_1.5px,transparent_1.5px)] [background-size:33px_33px]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-7 top-0 -z-10 h-36 w-40 opacity-55 [background-image:radial-gradient(circle,#6588b2_1.5px,transparent_1.5px)] [background-size:33px_33px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1280px]">
        <AstaReveal
          className="mb-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.57fr)] lg:items-end lg:gap-12"
        >
          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.12em] text-[#92c0fb] sm:text-base">
              Technology stack
            </p>
            <h2
              id="asta-technology-title"
              className="text-[clamp(3.25rem,5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.025em] text-white"
            >
              Technology Stack
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#aebbd0] sm:text-lg">
              A modern, practical stack to design, build, and ship reliable products.
            </p>
          </div>
          <p className="max-w-[29rem] border-l border-white/15 pl-6 text-base leading-relaxed text-[#b5c2d6] sm:text-lg lg:mb-1 lg:pl-7">
            The right tools help turn ideas into real products. Here are the technologies I use across frontend, backend, infrastructure, and more.
          </p>
        </AstaReveal>

        <div className="space-y-5">
          {groups.map(({ name, description, icon, items }, groupIndex) => (
            <AstaReveal
              as="article"
              className="grid min-w-0 gap-4 border-t border-white/10 pt-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0"
              key={name}
              delay={groupIndex * 80}
            >
              <header className="flex min-w-0 items-start gap-5 px-1 py-2">
                {icon}
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold leading-tight text-white">{name}</h3>
                  <p className="mt-1 max-w-[12rem] text-[15px] leading-[1.45] text-[#aebbd0]">
                    {description}
                  </p>
                </div>
              </header>

              <ul className="flex min-w-0 flex-wrap gap-3">
                {items.map((technology) => (
                  <li
                    className="group relative flex min-h-[78px] w-full min-w-0 flex-none items-center gap-3 overflow-hidden border border-white/15 bg-white/[0.015] px-3 py-2 transition-[background-color,border-color] duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--asta-blue)] after:transition-transform after:duration-200 after:ease-out hover:border-white/25 hover:bg-white/[0.045] hover:after:scale-x-100 min-[480px]:w-[208px] motion-reduce:transition-none motion-reduce:after:transition-none"
                    key={technology.id}
                  >
                    {technology.id === "rest-api" ? (
                      <Cog className="size-8 shrink-0 text-[#7fa7cb]" strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <img
                        className={`size-8 shrink-0 object-contain transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none${technology.id === "express" || technology.id === "github" ? " brightness-0 invert" : ""}`}
                        src={`/portfolio/tech/${technology.icon}`}
                        width="32"
                        height="32"
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="break-words text-sm font-semibold leading-tight text-white">
                        {technology.name}
                      </strong>
                      <small className="break-words text-xs leading-4 text-[#aebbd0]">
                        {technology.capability}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            </AstaReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
