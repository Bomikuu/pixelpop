import { BrainCircuit, CloudCog, Database, Monitor, PanelsTopLeft, Server } from "lucide-react";
import Reveal from "./Reveal";

const AI_ICON_BASE = "https://unpkg.com/@lobehub/icons-static-svg@1.95.1/icons";
const BRAND_ICON_BASE = "https://cdn.simpleicons.org";

const technologyGroups = [
  {
    title: "Frontend",
    description: "Interfaces, interaction, and user experience.",
    Icon: Monitor,
    technologies: [
      { name: "Vue", detail: "Frontend framework", icon: "vue.svg" },
      { name: "React", detail: "Frontend library", icon: "react.svg" },
      { name: "Nuxt", detail: "Full-stack framework", icon: "nuxt.svg" },
      { name: "Tailwind CSS", detail: "Styling and UI", icon: "tailwind.svg" },
      { name: "TypeScript", detail: "Type safety", icon: "typescript.svg" },
      { name: "JavaScript", detail: "Web fundamentals", icon: "javascript.svg" },
      { name: "shadcn/ui", detail: "UI components", icon: "shadcn.svg" },
    ],
  },
  {
    title: "Backend",
    description: "APIs, business logic, and integrations.",
    Icon: Server,
    technologies: [
      { name: "Node.js", detail: "Runtime environment", icon: "node.svg" },
      { name: "Django", detail: "Python framework", icon: "django.svg" },
      { name: "Python", detail: "Programming language", icon: "python.svg" },
      { name: "FastAPI", detail: "Python API framework", brandIcon: "fastapi" },
      { name: "Express.js", detail: "Web framework", icon: "express.svg" },
      { name: "REST API", detail: "Service integration", mark: "API" },
      { name: "GraphQL", detail: "Flexible queries", icon: "graphql.svg" },
    ],
  },
  {
    title: "Database",
    description: "Data storage, caching, and management.",
    Icon: Database,
    technologies: [
      { name: "PostgreSQL", detail: "Relational database", icon: "postgresql.svg" },
      { name: "Supabase", detail: "Postgres platform", brandIcon: "supabase" },
      { name: "MongoDB", detail: "Document database", icon: "mongodb.svg" },
      { name: "MySQL", detail: "Relational database", icon: "mysql.svg" },
      { name: "Redis", detail: "Caching and sessions", icon: "redis.svg" },
    ],
  },
  {
    title: "DevOps",
    description: "Deployment, infrastructure, and version control.",
    Icon: CloudCog,
    technologies: [
      { name: "Docker", detail: "Containerization", icon: "docker.svg" },
      { name: "AWS", detail: "Cloud infrastructure", icon: "aws.svg" },
      { name: "Vercel", detail: "Frontend hosting", brandIcon: "vercel" },
      { name: "Render", detail: "Application hosting", brandIcon: "render" },
      { name: "Cloudflare", detail: "Edge network", brandIcon: "cloudflare" },
      { name: "Netlify", detail: "Web deployment", brandIcon: "netlify" },
      { name: "Nginx", detail: "Reverse proxy", icon: "nginx.svg" },
      { name: "Jenkins", detail: "CI/CD", icon: "jenkins.svg" },
      { name: "Git", detail: "Version control", icon: "git.svg" },
      { name: "GitHub", detail: "Code collaboration", icon: "github.svg" },
    ],
  },
  {
    title: "Experience",
    description: "Design, maps, and interactive visuals.",
    Icon: PanelsTopLeft,
    technologies: [
      { name: "Three.js", detail: "3D experiences", icon: "three.svg" },
      { name: "Mapbox", detail: "Interactive maps", icon: "mapbox.svg" },
      { name: "Figma", detail: "Interface design", icon: "figma.svg" },
    ],
  },
  {
    title: "AI Tools",
    description: "Tools for exploration, coding, and research.",
    Icon: BrainCircuit,
    technologies: [
      { name: "OpenAI", detail: "AI models and tools", aiIcon: "openai.svg" },
      { name: "Claude", detail: "AI assistant", aiIcon: "claude-color.svg" },
      { name: "Antigravity", detail: "Agentic development", aiIcon: "antigravity-color.svg" },
      { name: "Grok", detail: "AI assistant", aiIcon: "grok.svg" },
      { name: "DeepSeek", detail: "AI models", aiIcon: "deepseek-color.svg" },
      { name: "Gemini", detail: "AI assistant", aiIcon: "gemini-color.svg" },
    ],
  },
];

function TechnologyIcon({ technology }) {
  if (!technology.icon && !technology.aiIcon && !technology.brandIcon) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#edf5ff] text-sm font-bold tracking-tight text-[#1570ef]" aria-hidden="true">
        {technology.mark}
      </span>
    );
  }

  let src = `/portfolio/tech/${technology.icon}`;
  if (technology.aiIcon) src = `${AI_ICON_BASE}/${technology.aiIcon}`;
  if (technology.brandIcon) src = `${BRAND_ICON_BASE}/${technology.brandIcon}`;

  return (
    <img
      src={src}
      width="40"
      height="40"
      loading="lazy"
      decoding="async"
      alt=""
      aria-hidden="true"
      className="size-10 shrink-0 object-contain"
    />
  );
}

export default function TechnologySection() {
  return (
    <section
      id="stack"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-[#dce7f3] bg-[#fbfdff] py-24 text-[#081a30] sm:py-32"
      aria-labelledby="technology-title"
    >
      <div className="pointer-events-none absolute -right-36 -top-48 size-[28rem] rounded-full border border-[#d7e8ff] sm:-right-20" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-36 size-[22rem] rounded-full border border-[#d7e8ff] sm:-right-8" aria-hidden="true" />
      <div className="pointer-events-none absolute left-4 top-10 size-36 opacity-70" style={{ backgroundImage: "radial-gradient(#9bc7ff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="grid gap-7 border-b border-[#d7e4f2] pb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end lg:gap-12">
            <div>
              <h2 id="technology-title" className="portfolio-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#081a30] sm:text-5xl lg:text-6xl">
                Technology <span className="text-[#2f5bff]">stack.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#52677d] sm:text-lg">
                A practical stack to design, build, and ship reliable products.
              </p>
            </div>
            <p className="max-w-lg border-l border-[#a9cfff] pl-6 text-base leading-7 text-[#52677d] lg:justify-self-end lg:pl-8">
              The right tools help turn ideas into real products. Here are the technologies I use across interfaces, backend systems, infrastructure, and more.
            </p>
          </header>
        </Reveal>

        <Reveal className="mt-1">
          <div className="divide-y divide-[#d7e4f2]">
            {technologyGroups.map((group) => {
              const Icon = group.Icon;

              return (
                <section key={group.title} className="grid gap-6 py-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:py-8" aria-label={group.title}>
                  <div className="flex items-start gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#edf5ff] text-[#1570ef]" aria-hidden="true">
                      <Icon size={27} strokeWidth={1.8} />
                    </span>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold leading-6 text-[#081a30]">{group.title}</h3>
                      <p className="mt-1.5 max-w-48 text-sm leading-5 text-[#52677d]">{group.description}</p>
                    </div>
                  </div>

                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`${group.title} technologies`}>
                    {group.technologies.map((technology) => (
                      <li key={technology.name} className="group relative flex min-h-20 min-w-0 items-center gap-3 overflow-hidden border border-[#d7e4f2] bg-white px-4 py-3 transition-colors hover:border-[#a9cfff]">
                        <TechnologyIcon technology={technology} />
                        <div className="min-w-0">
                          <strong className="block text-sm font-semibold leading-5 text-[#081a30]">{technology.name}</strong>
                          <span className="mt-0.5 block text-xs leading-4 text-[#52677d]">{technology.detail}</span>
                        </div>
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-[0.1] bg-[#2f5bff] transition-transform duration-[420ms] ease-out group-hover:scale-x-100 motion-reduce:transition-none" aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
