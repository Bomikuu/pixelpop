import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  Filter,
  MessageSquare,
  Network,
  Palette,
  PlugZap,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import {
  MCP_CATEGORIES,
  MCP_DIRECTORY,
  MCP_SOURCE_LINKS,
  MCP_WORKFLOWS,
} from "../data/mcpDirectory";

const CATEGORY_ICONS = {
  "Design & Motion": Palette,
  Engineering: Code2,
  Collaboration: MessageSquare,
  "Data & Infrastructure": Database,
  Automation: PlugZap,
};

const STATUS_COLORS = {
  "Official MCP": "bg-[#76e6c6] text-[#00261d]",
  "Official MCP kit": "bg-[#ffd86b] text-[#2a1600]",
  "Official MCP catalog": "bg-[#7dd9ff] text-[#001d2a]",
  "Native agent integration": "bg-[#ff9fbd] text-[#350011]",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function McpCard({ integration, index }) {
  const CategoryIcon = CATEGORY_ICONS[integration.category] || Blocks;

  return (
    <article
      id={`mcp-${integration.id}`}
      className={cx(
        "group relative flex h-full scroll-mt-28 flex-col border-2 border-[#211746] p-5 transition duration-200",
        "hover:-translate-y-1 hover:border-[#ff4f8b] hover:shadow-[7px_7px_0_#211746]",
        integration.featured ? "bg-[#fff8de] xl:col-span-2" : "bg-white",
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center border-2 border-[#211746] bg-[#74e5ff] text-[#211746] shadow-[3px_3px_0_#211746]">
            <CategoryIcon size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b5f89]">
              {String(index + 1).padStart(2, "0")} / {integration.category}
            </p>
            <h2 className="mt-1 text-xl font-black leading-tight text-[#211746] sm:text-2xl">
              {integration.name}
            </h2>
          </div>
        </div>
        {integration.featured && (
          <span className="shrink-0 border-2 border-[#211746] bg-[#ffd54f] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#211746]">
            Popular
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={cx(
          "border border-[#211746] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
          STATUS_COLORS[integration.status] || "bg-[#eee9ff] text-[#211746]",
        )}>
          {integration.status}
        </span>
        <span className="border border-[#c7bddf] bg-[#f7f4ff] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#51466c]">
          {integration.provider}
        </span>
      </div>

      <p className="text-sm font-semibold leading-6 text-[#211746]">{integration.useCase}</p>

      <dl className="mt-5 grid gap-4 border-t-2 border-dashed border-[#cfc6e6] pt-4 text-sm">
        <div>
          <dt className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#74668f]">Use when</dt>
          <dd className="mt-1 leading-6 text-[#51466c]">{integration.useWhen}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#74668f]">Connection</dt>
            <dd className="mt-1 font-semibold text-[#30265b]">{integration.transport}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#74668f]">Authentication</dt>
            <dd className="mt-1 font-semibold text-[#30265b]">{integration.auth}</dd>
          </div>
        </div>
      </dl>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${integration.name} capabilities`}>
        {integration.capabilities.map((capability) => (
          <li key={capability} className="border border-[#c7bddf] bg-[#f7f4ff] px-2 py-1 text-[11px] font-bold text-[#51466c]">
            {capability}
          </li>
        ))}
      </ul>

      {integration.note && (
        <p className="mt-4 border-l-4 border-[#ffcf4a] bg-[#fff8de] px-3 py-2 text-xs font-semibold leading-5 text-[#4f4269]">
          {integration.note}
        </p>
      )}

      <details className="group/details mt-5 border-2 border-[#211746] bg-[#faf8ff]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-black outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
          Setup steps
          <ChevronDown size={16} className="transition group-open/details:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t-2 border-[#211746] bg-white p-3">
          <ol className="space-y-3">
            {integration.setup.map((step, stepIndex) => (
              <li key={step} className="grid grid-cols-[24px_1fr] gap-2 text-xs font-semibold leading-5 text-[#51466c]">
                <span className="grid size-6 place-items-center bg-[#211746] font-mono text-[10px] text-white">
                  {stepIndex + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 border-l-4 border-[#4b61ff] bg-[#f2f0ff] px-3 py-2">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#74668f]">Try this</p>
            <p className="mt-1 font-mono text-xs leading-5 text-[#30265b]">{integration.examplePrompt}</p>
          </div>
        </div>
      </details>

      <a
        href={integration.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 self-start border-b-2 border-[#211746] text-sm font-black text-[#211746] outline-none transition hover:border-[#ff4f8b] hover:text-[#d81b60] focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
      >
        Official guide <ExternalLink size={15} aria-hidden="true" />
      </a>
    </article>
  );
}

export default function McpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All types");

  const statuses = useMemo(
    () => ["All types", ...new Set(MCP_DIRECTORY.map((integration) => integration.status))],
    [],
  );

  const filteredIntegrations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MCP_DIRECTORY.filter((integration) => {
      const matchesCategory = activeCategory === "All" || integration.category === activeCategory;
      const matchesStatus = activeStatus === "All types" || integration.status === activeStatus;
      const matchesQuery = !normalizedQuery || [
        integration.name,
        integration.provider,
        integration.category,
        integration.status,
        integration.useCase,
        integration.useWhen,
        ...integration.capabilities,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesStatus && matchesQuery;
    });
  }, [activeCategory, activeStatus, query]);

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
    setActiveStatus("All types");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4ff] text-[#211746]">
      <header className="border-b-4 border-[#211746] bg-[#211746] text-white">
        <div className="mx-auto flex min-h-16 w-full max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link to="/components" className="inline-flex items-center gap-3 font-black outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
            <span className="grid size-9 place-items-center bg-[#74e5ff] text-[#211746] shadow-[3px_3px_0_#ff4f8b]">
              <Network size={20} aria-hidden="true" />
            </span>
            <span>PixelPopup <span className="text-[#74e5ff]">/ MCP</span></span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-bold" aria-label="Documentation">
            <Link className="hidden hover:text-[#74e5ff] sm:inline" to="/components">Components</Link>
            <Link className="hidden hover:text-[#74e5ff] sm:inline" to="/skill">Skills</Link>
            <a href="https://modelcontextprotocol.io/registry/about" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 border-2 border-white px-3 hover:bg-white hover:text-[#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
              Registry <ExternalLink size={14} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate border-b-4 border-[#211746] bg-[#4b61ff] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 border-2 border-white bg-[#211746] px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.2em] shadow-[5px_5px_0_#ffcf4a]">
              <Sparkles size={15} aria-hidden="true" /> Agent integration directory
            </p>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-[88px]">
              Connect agents to the tools where work happens.
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#eeebff] sm:text-xl">
              A practical field guide to common MCP servers and adjacent agent integrations—what they expose, how to connect them, and where they fit in real delivery workflows.
            </p>
          </div>

          <div className="border-2 border-[#211746] bg-[#fff8de] text-[#211746] shadow-[10px_10px_0_#211746]">
            <div className="grid grid-cols-2">
              <div className="border-b-2 border-r-2 border-[#211746] p-5">
                <strong className="block text-4xl font-black">{MCP_DIRECTORY.length}</strong>
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Integrations</span>
              </div>
              <div className="border-b-2 border-[#211746] p-5">
                <strong className="block text-4xl font-black">{MCP_CATEGORIES.length}</strong>
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Categories</span>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 p-5 text-center text-xs font-black sm:text-sm">
              <span className="border-2 border-[#211746] bg-white px-2 py-3">Host</span>
              <ArrowRight size={16} aria-hidden="true" />
              <span className="border-2 border-[#211746] bg-[#74e5ff] px-2 py-3">MCP</span>
              <ArrowRight size={16} aria-hidden="true" />
              <span className="border-2 border-[#211746] bg-[#ffcf4a] px-2 py-3">Service</span>
            </div>
            <div className="flex items-start gap-3 border-t-2 border-[#211746] p-5 text-sm leading-6">
              <BookOpenCheck className="mt-0.5 shrink-0 text-[#4b61ff]" size={21} aria-hidden="true" />
              <p><strong>Field rule:</strong> connect the smallest trusted toolset and begin read-only whenever possible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#211746] bg-[#fff8de] px-5 py-7 sm:px-8 lg:px-12" aria-label="MCP sources">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-7 gap-y-3">
          <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#716482]">Primary references</span>
          {MCP_SOURCE_LINKS.map(([label, url]) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold underline decoration-2 underline-offset-4 hover:text-[#d81b60] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
              {label} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section id="workflows" className="border-b-4 border-[#211746] bg-[#211746] px-5 py-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74e5ff]">Common sequences</p>
              <h2 className="mt-2 text-3xl font-black sm:text-5xl">Integrations work best as controlled chains.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#d9d3ed]">Give each connection one job, preserve human confirmation for consequential writes, and keep an audit trail in the system your team already uses.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {MCP_WORKFLOWS.map((workflow, workflowIndex) => (
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
                      <span className="text-[#ffcf4a]">{stepIndex + 1}.</span><span>{step}</span>
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
                <Filter size={17} aria-hidden="true" /> Browse integrations
              </div>
              <div className="p-3">
                {["All", ...MCP_CATEGORIES].map((category) => {
                  const Icon = category === "All" ? Blocks : CATEGORY_ICONS[category];
                  const count = category === "All" ? MCP_DIRECTORY.length : MCP_DIRECTORY.filter((entry) => entry.category === category).length;
                  return (
                    <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={cx(
                      "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-[#74e5ff]",
                      activeCategory === category ? "bg-[#211746] text-white" : "hover:bg-[#f2efff]",
                    )}>
                      <span className="flex items-center gap-2"><Icon size={16} aria-hidden="true" /> {category}</span>
                      <span className="font-mono text-[10px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 border-2 border-[#211746] bg-[#211746] p-4 text-white shadow-[6px_6px_0_#74e5ff]">
              <ShieldCheck className="text-[#76e6c6]" size={24} aria-hidden="true" />
              <h2 className="mt-3 font-black">Connection checklist</h2>
              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-[#d9d3ed]">
                <li>Verify the official endpoint.</li>
                <li>Use least-privilege scopes.</li>
                <li>Prefer read-only first.</li>
                <li>Keep secrets out of source control.</li>
                <li>Review every external write.</li>
              </ul>
            </div>
          </aside>

          <div>
            <div className="mb-8 border-2 border-[#211746] bg-white p-4 shadow-[6px_6px_0_#ff4f8b] sm:p-5">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_250px_auto]">
                <label className="relative block">
                  <span className="sr-only">Search MCP integrations</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f628c]" size={18} aria-hidden="true" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service, task, or capability" className="min-h-12 w-full border-2 border-[#211746] bg-[#faf8ff] pl-10 pr-4 text-sm font-semibold outline-none placeholder:text-[#82769b] focus:bg-white focus:ring-4 focus:ring-[#74e5ff]" />
                </label>
                <label>
                  <span className="sr-only">Filter by integration type</span>
                  <select value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)} className="min-h-12 w-full border-2 border-[#211746] bg-white px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#74e5ff]">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                {(query || activeCategory !== "All" || activeStatus !== "All types") && (
                  <button type="button" onClick={clearFilters} className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-[#211746] px-4 text-sm font-black outline-none hover:bg-[#211746] hover:text-white focus-visible:ring-4 focus-visible:ring-[#74e5ff]">
                    <X size={16} aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#706488]" aria-live="polite">
                Showing {filteredIntegrations.length} of {MCP_DIRECTORY.length} integrations
              </p>
            </div>

            {filteredIntegrations.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredIntegrations.map((integration) => (
                  <McpCard key={integration.id} integration={integration} index={MCP_DIRECTORY.findIndex((entry) => entry.id === integration.id)} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-[#211746] bg-white px-6 py-16 text-center shadow-[7px_7px_0_#211746]">
                <Search className="mx-auto text-[#ff4f8b]" size={42} aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">No matching integration found.</h2>
                <p className="mt-2 text-sm text-[#655a7d]">Try a broader service, capability, or category.</p>
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
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#453b63]">Build safely</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">Need an internal tool? Expose one narrow capability before an entire API.</h2>
          </div>
          <a href="https://modelcontextprotocol.io/docs/develop/build-server" target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center gap-3 border-2 border-[#211746] bg-[#ffcf4a] px-6 font-black shadow-[6px_6px_0_#211746] outline-none transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#211746] focus-visible:ring-4 focus-visible:ring-white">
            Build an MCP server <ChevronRight size={19} aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="bg-[#17112f] px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
          <p className="font-semibold">PixelPopup MCP Integration Field Guide</p>
          <div className="flex flex-wrap items-center gap-5 text-[#d6cfee]">
            <Link className="hover:text-[#74e5ff]" to="/skill">Skills</Link>
            <Link className="hover:text-[#74e5ff]" to="/components">Components</Link>
            <a className="hover:text-[#74e5ff]" href="#workflows">Workflows</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
