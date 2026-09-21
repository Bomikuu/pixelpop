import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  BookOpenCheck,
  Box,
  Braces,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Filter,
  FlaskConical,
  Palette,
  PlugZap,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import {
  COMMON_WORKFLOWS,
  HOW_TO_USE_SKILLS,
  SKILL_CATEGORIES,
  SKILLS_DIRECTORY,
} from "../data/skillsDirectory";

const CATEGORY_ICONS = {
  Design: Palette,
  Delivery: Workflow,
  Quality: ShieldCheck,
  Testing: FlaskConical,
  Artifacts: FileText,
  Extensibility: PlugZap,
};

const PROVIDER_COLORS = {
  Anthropic: "bg-[#ffd86b] text-[#2a1600]",
  Community: "bg-[#ff6f91] text-[#22000a]",
  Superpowers: "bg-[#76e6c6] text-[#00261d]",
  Codex: "bg-[#7dd9ff] text-[#001d2a]",
  "Codex project": "bg-[#a9a3ff] text-[#130d45]",
  "OpenAI / Anthropic": "bg-[#f6f0ff] text-[#281c50]",
  Vercel: "bg-[#211746] text-white",
  NextLevelBuilder: "bg-[#74e5ff] text-[#211746]",
};

const PAGE_SIZE = 10;

const SOURCE_LINKS = [
  ["Agent Skills standard", "https://agentskills.io"],
  ["OpenAI skill docs", "https://learn.chatgpt.com/docs/build-skills"],
  ["Anthropic Skills", "https://github.com/anthropics/skills"],
  ["OpenAI Plugins", "https://github.com/openai/plugins"],
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkillCard({ skill, index }) {
  const CategoryIcon = CATEGORY_ICONS[skill.category] || Box;

  return (
    <article
      id={`skill-${skill.id}`}
      className={cx(
        "group relative scroll-mt-28 border-2 border-[#211746] p-5 transition duration-200 sm:p-6",
        "hover:-translate-y-1 hover:border-[#ff4f8b] hover:shadow-[7px_7px_0_#211746]",
        skill.featured ? "bg-[#fff8de]" : "bg-white",
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center border-2 border-[#211746] bg-[#74e5ff] text-[#211746] shadow-[3px_3px_0_#211746]">
                <CategoryIcon size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b5f89]">
                  {String(index + 1).padStart(2, "0")} / {skill.category}
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight text-[#211746] sm:text-2xl">
                  {skill.name}
                </h2>
              </div>
            </div>
            {skill.featured && (
              <span className="shrink-0 border-2 border-[#211746] bg-[#ffd54f] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#211746]">
                Start here
              </span>
            )}
          </div>

          <span
            className={cx(
              "mb-4 w-fit border border-[#211746] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
              PROVIDER_COLORS[skill.provider] || "bg-[#eee9ff] text-[#211746]",
            )}
          >
            {skill.provider}
          </span>

          <p className="text-sm font-semibold leading-6 text-[#211746]">{skill.useCase}</p>

          <a
            href={skill.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-11 items-center gap-2 self-start border-b-2 border-[#211746] text-sm font-black text-[#211746] outline-none transition hover:border-[#ff4f8b] hover:text-[#d81b60] focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
          >
            Open source <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>

        <dl className="grid gap-4 border-t-2 border-dashed border-[#cfc6e6] pt-5 text-sm lg:border-l-2 lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#74668f]">Use when</dt>
            <dd className="mt-1 leading-6 text-[#51466c]">{skill.useWhen}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#74668f]">How to use</dt>
            <dd className="mt-2 border-l-4 border-[#4b61ff] bg-[#f2f0ff] px-3 py-3 font-mono text-xs leading-5 text-[#30265b]">
              {skill.invocation}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default function SkillsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeProvider, setActiveProvider] = useState("All providers");
  const [currentPage, setCurrentPage] = useState(1);

  const providers = useMemo(
    () => ["All providers", ...new Set(SKILLS_DIRECTORY.map((skill) => skill.provider))],
    [],
  );

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return SKILLS_DIRECTORY.filter((skill) => {
      const matchesCategory = activeCategory === "All" || skill.category === activeCategory;
      const matchesProvider = activeProvider === "All providers" || skill.provider === activeProvider;
      const matchesQuery = !normalizedQuery || [
        skill.name,
        skill.provider,
        skill.category,
        skill.useCase,
        skill.useWhen,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesProvider && matchesQuery;
    });
  }, [activeCategory, activeProvider, query]);

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / PAGE_SIZE));
  const visibleSkills = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSkills.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredSkills, totalPages]);

  const updateQuery = (value) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const updateCategory = (value) => {
    setActiveCategory(value);
    setCurrentPage(1);
  };

  const updateProvider = (value) => {
    setActiveProvider(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
    setActiveProvider("All providers");
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4ff] text-[#211746]">
      <header className="border-b-4 border-[#211746] bg-[#211746] text-white">
        <div className="mx-auto flex min-h-16 w-full max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link
            to="/components"
            className="inline-flex items-center gap-3 font-black outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
          >
            <span className="grid size-9 place-items-center bg-[#ff4f8b] text-[#211746] shadow-[3px_3px_0_#74e5ff]">
              <Braces size={20} aria-hidden="true" />
            </span>
            <span>
              PixelPopup <span className="text-[#74e5ff]">/ Skills</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-bold" aria-label="Documentation">
            <Link className="hidden hover:text-[#74e5ff] sm:inline" to="/components">Components</Link>
            <Link className="hidden hover:text-[#74e5ff] sm:inline" to="/examples/playground">Playground</Link>
            <Link className="hidden hover:text-[#74e5ff] sm:inline" to="/mcp">MCP</Link>
            <a
              href="https://agentskills.io"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 border-2 border-white px-3 hover:bg-white hover:text-[#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
            >
              Standard <ExternalLink size={14} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate border-b-4 border-[#211746] bg-[#5d4bff] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 border-2 border-white bg-[#211746] px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.2em] shadow-[5px_5px_0_#ffcf4a]">
              <Sparkles size={15} aria-hidden="true" /> Agent capability directory
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-[92px]">
              Pick the right skill before you prompt.
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#eeebff] sm:text-xl">
              A practical field guide to widely used Codex, Claude, and cross-agent skills—what each one does, when to use it, and how they fit into real workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 border-2 border-[#211746] bg-[#fff8de] text-[#211746] shadow-[10px_10px_0_#211746]">
            <div className="border-b-2 border-r-2 border-[#211746] p-5">
              <strong className="block text-4xl font-black">{SKILLS_DIRECTORY.length}</strong>
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Curated skills</span>
            </div>
            <div className="border-b-2 border-[#211746] p-5">
              <strong className="block text-4xl font-black">{SKILL_CATEGORIES.length}</strong>
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Categories</span>
            </div>
            <div className="col-span-2 flex items-start gap-3 p-5 text-sm leading-6">
              <BookOpenCheck className="mt-0.5 shrink-0 text-[#4b61ff]" size={21} aria-hidden="true" />
              <p><strong>Field rule:</strong> skills provide focused operating instructions. Use the smallest set that covers the task.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#211746] bg-[#fff8de] px-5 py-7 sm:px-8 lg:px-12" aria-label="Skill sources">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-7 gap-y-3">
          <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#716482]">Primary references</span>
          {SOURCE_LINKS.map(([label, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-bold underline decoration-2 underline-offset-4 hover:text-[#d81b60] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
            >
              {label} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="border-b-4 border-[#211746] bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-16" aria-labelledby="how-to-use-skills">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="mb-8 grid gap-4 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#4b61ff]">Four-step field guide</p>
              <h2 id="how-to-use-skills" className="mt-2 text-3xl font-black sm:text-5xl">How to use a skill well.</h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-[#655a7d] lg:justify-self-end">
              Skills work best as focused operating instructions. Choose deliberately, invoke explicitly, and give the agent enough context to act without widening the task.
            </p>
          </div>

          <ol className="grid border-2 border-[#211746] md:grid-cols-2 xl:grid-cols-4">
            {HOW_TO_USE_SKILLS.map((step, index) => (
              <li
                key={step.id}
                className="border-b-2 border-[#211746] p-5 last:border-b-0 md:[&:nth-child(odd)]:border-r-2 md:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r-2 xl:last:border-r-0 xl:[&:nth-child(odd)]:border-r-2"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center bg-[#211746] font-mono text-xs font-black text-[#74e5ff] shadow-[3px_3px_0_#ffcf4a]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <CheckCircle2 size={20} className="text-[#4b61ff]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#655a7d]">{step.description}</p>
                <p className="mt-4 border-l-4 border-[#ff4f8b] bg-[#f7f4ff] px-3 py-2 font-mono text-xs leading-5 text-[#30265b]">
                  {step.example}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-3 border-2 border-[#211746] bg-[#74e5ff] px-5 py-4 font-mono text-xs font-bold text-[#211746] sm:flex-row sm:items-center sm:justify-between">
            <span>Install globally for Codex, Claude, and compatible agents:</span>
            <code className="overflow-x-auto bg-[#211746] px-3 py-2 text-white">npx skills add &lt;owner/repo&gt; --skill &lt;skill-name&gt; -g</code>
          </div>
        </div>
      </section>

      <section id="workflows" className="border-b-4 border-[#211746] bg-[#211746] px-5 py-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74e5ff]">Common sequences</p>
              <h2 className="mt-2 text-3xl font-black sm:text-5xl">Workflows that keep agents useful.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#d9d3ed]">Start with intent, add only the specialist skills you need, then finish with evidence. More skills do not automatically mean better work.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {COMMON_WORKFLOWS.map((workflow, workflowIndex) => (
              <article key={workflow.id} className="border-2 border-[#8b7ec4] bg-[#2d2257] p-4 transition hover:border-[#74e5ff] hover:bg-[#352965]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#ffcf4a]">0{workflowIndex + 1}</span>
                  <Workflow size={18} className="text-[#74e5ff]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black">{workflow.title}</h3>
                <p className="mt-2 min-h-16 text-xs leading-5 text-[#cec8e2]">{workflow.description}</p>
                <ol className="mt-5 border-t border-[#6c5c9f] pt-4">
                  {workflow.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-2 py-1.5 text-xs font-semibold leading-5">
                      <span className="text-[#ffcf4a]">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto grid w-full max-w-[1500px] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="border-2 border-[#211746] bg-white shadow-[6px_6px_0_#211746]">
              <div className="flex items-center gap-2 border-b-2 border-[#211746] bg-[#ffcf4a] px-4 py-3 font-black">
                <Filter size={17} aria-hidden="true" /> Browse skills
              </div>
              <div className="p-3">
                {["All", ...SKILL_CATEGORIES].map((category) => {
                  const Icon = category === "All" ? Blocks : CATEGORY_ICONS[category];
                  const count = category === "All"
                    ? SKILLS_DIRECTORY.length
                    : SKILLS_DIRECTORY.filter((skill) => skill.category === category).length;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => updateCategory(category)}
                      aria-pressed={activeCategory === category}
                      className={cx(
                        "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-[#74e5ff]",
                        activeCategory === category ? "bg-[#211746] text-white" : "hover:bg-[#f2efff]",
                      )}
                    >
                      <span className="flex items-center gap-2"><Icon size={16} aria-hidden="true" /> {category}</span>
                      <span className="font-mono text-[10px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-8 border-2 border-[#211746] bg-white p-4 shadow-[6px_6px_0_#ff4f8b] sm:p-5">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_250px_auto]">
                <label className="relative block">
                  <span className="sr-only">Search skills</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f628c]" size={18} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => updateQuery(event.target.value)}
                    placeholder="Search by skill, task, or use case"
                    className="min-h-12 w-full border-2 border-[#211746] bg-[#faf8ff] pl-10 pr-4 text-sm font-semibold outline-none placeholder:text-[#82769b] focus:bg-white focus:ring-4 focus:ring-[#74e5ff]"
                  />
                </label>
                <label>
                  <span className="sr-only">Filter by provider</span>
                  <select
                    value={activeProvider}
                    onChange={(event) => updateProvider(event.target.value)}
                    className="min-h-12 w-full border-2 border-[#211746] bg-white px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#74e5ff]"
                  >
                    {providers.map((provider) => <option key={provider}>{provider}</option>)}
                  </select>
                </label>
                {(query || activeCategory !== "All" || activeProvider !== "All providers") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-[#211746] px-4 text-sm font-black outline-none hover:bg-[#211746] hover:text-white focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
                  >
                    <X size={16} aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#706488]" aria-live="polite">
                Showing {filteredSkills.length === 0 ? 0 : ((Math.min(currentPage, totalPages) - 1) * PAGE_SIZE) + 1}–{Math.min(Math.min(currentPage, totalPages) * PAGE_SIZE, filteredSkills.length)} of {filteredSkills.length} matching skills
              </p>
            </div>

            {filteredSkills.length > 0 ? (
              <>
                <div className="grid gap-5">
                  {visibleSkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      index={SKILLS_DIRECTORY.findIndex((entry) => entry.id === skill.id)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-8 flex flex-wrap items-center justify-between gap-4 border-2 border-[#211746] bg-white p-3 shadow-[5px_5px_0_#211746]" aria-label="Skills pagination">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex min-h-11 items-center gap-2 border-2 border-[#211746] px-4 text-sm font-black outline-none transition hover:bg-[#211746] hover:text-white focus-visible:ring-4 focus-visible:ring-[#74e5ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#211746]"
                    >
                      <ChevronLeft size={17} aria-hidden="true" /> Previous
                    </button>

                    <div className="flex flex-wrap justify-center gap-2">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Go to skills page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                          className={cx(
                            "grid size-11 place-items-center border-2 border-[#211746] font-mono text-xs font-black outline-none transition focus-visible:ring-4 focus-visible:ring-[#74e5ff]",
                            currentPage === page ? "bg-[#4b61ff] text-white" : "bg-[#fff8de] hover:bg-[#ffcf4a]",
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex min-h-11 items-center gap-2 border-2 border-[#211746] px-4 text-sm font-black outline-none transition hover:bg-[#211746] hover:text-white focus-visible:ring-4 focus-visible:ring-[#74e5ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#211746]"
                    >
                      Next <ChevronRight size={17} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="border-2 border-[#211746] bg-white px-6 py-16 text-center shadow-[7px_7px_0_#211746]">
                <Search className="mx-auto text-[#ff4f8b]" size={42} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">No matching skill found.</h2>
                <p className="mt-2 text-sm text-[#655a7d]">Try a broader task, provider, or category.</p>
                <button type="button" onClick={clearFilters} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#4b61ff] px-5 font-black text-white shadow-[4px_4px_0_#211746] hover:bg-[#3247dc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
                  Reset directory <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y-4 border-[#211746] bg-[#74e5ff] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-[1500px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#453b63]">A practical default</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">Describe the outcome first. Add specialist skills only where they improve the work.</h2>
          </div>
          <a
            href="https://learn.chatgpt.com/docs/build-skills"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 items-center justify-center gap-3 border-2 border-[#211746] bg-[#ffcf4a] px-6 font-black shadow-[6px_6px_0_#211746] outline-none transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#211746] focus-visible:ring-4 focus-visible:ring-white"
          >
            Learn to build a skill <ChevronRight size={19} aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="bg-[#17112f] px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
          <p className="font-semibold">PixelPopup Agent Skills Field Guide</p>
          <div className="flex flex-wrap items-center gap-5 text-[#d6cfee]">
            <Link className="hover:text-[#74e5ff]" to="/components">Components</Link>
            <Link className="hover:text-[#74e5ff]" to="/examples/playground">Playground</Link>
            <Link className="hover:text-[#74e5ff]" to="/mcp">MCP</Link>
            <a className="hover:text-[#74e5ff]" href="#workflows">Workflows</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
