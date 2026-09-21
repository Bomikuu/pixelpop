import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CloudCog,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Globe2,
  GraduationCap,
  Info,
  Layers3,
  Lightbulb,
  Link2,
  MousePointerClick,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  ServerCog,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import referenceData from "./interviewReference.json";
import technologyGlossary from "./interviewTechnologyGlossary.json";

const sectionIcons = {
  "answer-frameworks": Target,
  "project-stories": BriefcaseBusiness,
  "business-terms": Building2,
  "system-design": Network,
  "incident-scenarios": Activity,
  "frontend-architecture": Boxes,
  "backend-terms": ServerCog,
  deployment: CloudCog,
  "cloud-computing": Globe2,
  "api-design": GitBranch,
  "ui-ux": Sparkles,
  seo: Search,
  quality: CheckCircle2,
  security: ShieldCheck,
  "security-diagrams": ShieldCheck,
  react: Code2,
  "vue-nuxt": Layers3,
  "agile-delivery": Workflow,
  leadership: UsersRound,
  "ai-integration": BrainCircuit,
  "product-thinking": Target,
  metrics: Gauge,
  courses: PlayCircle,
  "weekly-routine": GraduationCap,
};

const referenceSectionIds = referenceData.navigation.map(({ id }) => id);

const conceptIcons = {
  "load-balancer": Network,
  "reverse-proxy": Workflow,
  cdn: Globe2,
  cache: Database,
  queue: Layers3,
  "rate-limiting": ShieldCheck,
  idempotency: CheckCircle2,
  "database-index": Database,
  replication: GitBranch,
  "eventual-consistency": Activity,
  "circuit-breaker": ShieldCheck,
  observability: Gauge,
  "horizontal-scaling": Layers3,
  "database-transaction": Database,
  "concurrency-control": ShieldCheck,
  sharding: Boxes,
};

const securityDiagramIcons = {
  client: Globe2,
  edge: ShieldCheck,
  throttle: Gauge,
  bot: Target,
  validation: CheckCircle2,
  service: ServerCog,
  database: Database,
  monitoring: Activity,
  identity: UsersRound,
  queue: Layers3,
};

const seoWorkstreamIcons = {
  search: Search,
  behavior: MousePointerClick,
  performance: Gauge,
  authority: Link2,
};

function SectionHeading({ id, title, description }) {
  const Icon = sectionIcons[id] || Sparkles;

  return (
    <div className="mb-7 border-b border-slate-300 pb-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center bg-[#e8efff] text-[#2146d0]">
          <Icon size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="portfolio-display text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

function normalizeTechnologyKey(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return technologyGlossary.aliases?.[normalized] || normalized;
}

function mapGlossaryDetail(detail) {
  return {
    ...detail,
    example: detail.howToDiscuss || detail.example,
    category: detail.category || "Technology reference",
  };
}

function getExactTechnologyDetail(item) {
  const detail = technologyGlossary.entries?.[normalizeTechnologyKey(item)];
  return detail ? mapGlossaryDetail(detail) : null;
}

function getCompositeTechnologyDetail(item) {
  const separator = [" or ", " and "].find((candidate) => item.toLowerCase().includes(candidate));
  if (!separator) return null;

  const labels = item.split(new RegExp(separator, "i")).map((label) => label.trim()).filter(Boolean);
  if (labels.length !== 2) return null;

  const details = labels.map(getExactTechnologyDetail);
  if (details.some((detail) => !detail)) return null;

  const [left, right] = details;
  const isComparison = separator.trim() === "or";

  return {
    category: isComparison ? "Technology comparison" : "Technology combination",
    definition: `${labels[0]}: ${left.definition} ${labels[1]}: ${right.definition}`,
    whyItMatters: isComparison
      ? `The choice changes the system's trade-offs. ${left.whyItMatters} ${right.whyItMatters}`
      : `These tools solve different parts of the workflow. ${left.whyItMatters} ${right.whyItMatters}`,
    example: isComparison
      ? `Define the requirement first, compare ${labels[0]} and ${labels[1]} against scale, ownership, operations, and failure behavior, then justify the simpler adequate option.`
      : `Explain the boundary between ${labels[0]} and ${labels[1]}, the contract joining them, and how you observe or test that integration.`,
    caution: `${left.caution} ${right.caution}`,
  };
}

function getTechnologyDetail(item) {
  const exactDetail = getExactTechnologyDetail(item);
  if (exactDetail) return exactDetail;

  const compositeDetail = getCompositeTechnologyDetail(item);
  if (compositeDetail) return compositeDetail;

  const normalizedItem = item.trim().toLowerCase();
  const family = technologyGlossary.families?.find(({ keywords }) =>
    keywords.some((keyword) => normalizedItem.includes(keyword)),
  ) || technologyGlossary.defaultDetail;

  return {
    category: family.category,
    definition: family.definition.replaceAll("{term}", item),
    whyItMatters: family.whyItMatters.replaceAll("{term}", item),
    example: family.howToDiscuss.replaceAll("{term}", item),
    caution: family.caution,
  };
}

function TechnologyInfoModal({ item, detail, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[82dvh] w-[min(92vw,40rem)] overflow-y-auto rounded-xl border border-slate-300 bg-white p-0 text-slate-900 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.65)] backdrop:bg-slate-950/55 backdrop:backdrop-blur-[2px]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">{detail.category}</p>
            <h3 id={titleId} className="portfolio-display mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {item}
            </h3>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-[#2f5bff] hover:bg-[#f3f6ff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]"
            aria-label={`Close ${item} information`}
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <p id={descriptionId} className="text-sm leading-6 text-slate-700">{detail.definition}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="border-l-2 border-[#2f5bff] pl-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Why it matters</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{detail.whyItMatters}</p>
          </div>
          <div className="border-l-2 border-[#2f5bff] pl-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">How to discuss it</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{detail.example}</p>
          </div>
        </div>
        {detail.caution ? (
          <div className="border border-[#b8c7ff] bg-[#f3f6ff] p-4 text-sm leading-6 text-slate-700">
            <strong className="text-slate-950">Remember:</strong> {detail.caution}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

function TechnologyList({ items, label = "Technology examples" }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedDetail = selectedItem ? getTechnologyDetail(selectedItem) : null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label={label}>
        {items.map((item) => {
          const isSelected = selectedItem === item;

          return (
            <li key={item}>
              <button
                type="button"
                className={`inline-flex min-h-8 items-center gap-1.5 border px-3 py-1.5 text-left text-xs font-semibold transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2f5bff] hover:bg-[#f3f6ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] motion-reduce:transform-none motion-reduce:transition-none ${
                  isSelected
                    ? "border-[#2f5bff] bg-[#e8efff] text-[#163cb8]"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                aria-haspopup="dialog"
                onClick={() => setSelectedItem(item)}
              >
                {item}
                <Info size={13} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {selectedItem && selectedDetail ? (
        <TechnologyInfoModal item={selectedItem} detail={selectedDetail} onClose={() => setSelectedItem(null)} />
      ) : null}
    </div>
  );
}

function SeoReference({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-px border border-slate-300 bg-slate-300 lg:grid-cols-2">
        {data.workstreams.map((workstream) => {
          const Icon = seoWorkstreamIcons[workstream.icon] || Search;

          return (
            <article key={workstream.id} className="bg-white p-6 transition-colors duration-200 hover:bg-[#f8faff] sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center bg-[#e8efff] text-[#2146d0]">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="portfolio-display text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {workstream.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#2146d0]">{workstream.signal}</p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">{workstream.description}</p>
              <div className="mt-5">
                <TechnologyList items={workstream.tools} label="Where to check" />
              </div>
              <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                {workstream.checks.map((check) => (
                  <li key={check} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-1 shrink-0 text-[#2f5bff]" size={15} aria-hidden="true" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <section className="border border-slate-300 bg-white" aria-labelledby="seo-link-map-title">
        <div className="border-b border-slate-300 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link2 className="text-[#2f5bff]" size={22} aria-hidden="true" />
            <div>
              <h3 id="seo-link-map-title" className="portfolio-display text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Link architecture at a glance
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Know which direction authority and context move before choosing a metric.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-px bg-slate-300 lg:grid-cols-3">
          {data.linkTypes.map((linkType) => (
            <article key={linkType.id} className="bg-white p-6 sm:p-7">
              <h4 className="text-lg font-semibold text-slate-950">{linkType.title}</h4>
              <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-700" aria-label={`${linkType.from} to ${linkType.to}`}>
                <span className="min-w-0 flex-1 border border-slate-300 bg-slate-50 px-3 py-3 text-center">{linkType.from}</span>
                <ArrowRight className="shrink-0 text-[#2f5bff]" size={18} aria-hidden="true" />
                <span className="min-w-0 flex-1 border border-[#b8c7ff] bg-[#f3f6ff] px-3 py-3 text-center">{linkType.to}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{linkType.description}</p>
              <p className="mt-4 border-l-2 border-[#2f5bff] pl-3 text-sm leading-6 text-slate-700">
                <strong className="text-slate-950">Check:</strong> {linkType.check}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-slate-300 bg-white" aria-labelledby="seo-cadence-title">
          <div className="border-b border-slate-300 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-[#2f5bff]" size={22} aria-hidden="true" />
              <h3 id="seo-cadence-title" className="portfolio-display text-2xl font-semibold tracking-[-0.03em] text-slate-950">A useful review rhythm</h3>
            </div>
          </div>
          <dl className="divide-y divide-slate-200">
            {data.reviewCadence.map((item) => (
              <div key={item.when} className="grid gap-2 px-6 py-5 sm:grid-cols-[9rem_1fr] sm:px-8">
                <dt className="font-semibold text-slate-950">{item.when}</dt>
                <dd className="text-sm leading-6 text-slate-600">{item.focus}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="bg-[#061129] p-6 text-white sm:p-8">
          <Target className="text-[#7da7ff]" size={26} aria-hidden="true" />
          <h3 className="portfolio-display mt-5 text-2xl font-semibold tracking-[-0.03em]">How to frame the senior answer</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">{data.seniorAnswer}</p>
          <div className="mt-6 border-t border-white/20 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8db4ff]">Portfolio proof</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{data.portfolioProof}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReferenceEntry({ entry, index }) {
  return (
    <article className="border-t border-slate-300 py-8 first:border-t-0 first:pt-0">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div>
          <p className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="portfolio-display mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            {entry.title}
          </h3>
          {entry.prompt ? <p className="mt-4 border-l-2 border-[#2f5bff] pl-4 text-sm font-semibold leading-6 text-slate-800">{entry.prompt}</p> : null}
          <div className="mt-6 bg-slate-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">What they are testing</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{entry.interviewerIntent}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Core answer</p>
            <p className="mt-2 text-base font-medium leading-7 text-slate-900">{entry.coreAnswer}</p>
          </div>
          <div className="border border-[#b8c7ff] bg-[#f3f6ff] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2146d0]">
              <Lightbulb size={17} aria-hidden="true" /> Example answer
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{entry.exampleAnswer}</p>
          </div>
          <TechnologyList items={entry.technologyExamples} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Terms to remember</p>
              <ul className="mt-3 space-y-2">
                {entry.terms.map((term) => (
                  <li key={term} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[#2f5bff]" size={15} aria-hidden="true" /> {term}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Project proof</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{entry.projectProof}</p>
            </div>
          </div>
          <p className="border-l-2 border-amber-500 pl-4 text-sm leading-6 text-slate-600">
            <strong className="text-slate-900">Common mistake:</strong> {entry.commonMistake}
          </p>
        </div>
      </div>
    </article>
  );
}

function BackendConcept({ concept, index }) {
  const Icon = conceptIcons[concept.id] || ServerCog;

  return (
    <details className="group border-t border-slate-300 bg-white first:border-t-0">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] sm:px-6">
        <span className="flex items-center gap-4">
          <span className="grid size-9 shrink-0 place-items-center bg-[#edf2ff] text-[#2146d0]"><Icon size={17} aria-hidden="true" /></span>
          <span className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-base font-semibold text-slate-950">{concept.term}</span>
        </span>
        <span className="text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
      </summary>
      <div className="border-t border-slate-200 px-5 pb-7 pt-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-sm leading-7 text-slate-700">{concept.definition}</p>
            <div className="mt-5">
              <TechnologyList items={concept.technologyExamples} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="border-l-2 border-[#2f5bff] bg-[#f3f6ff] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">You may already use it when</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{concept.youMayUseItWhen}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Project example</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{concept.projectExample}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interview phrasing</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{concept.interviewExample}</p>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function BusinessTermGroup({ group, index }) {
  return (
    <article className="border border-slate-300 bg-white">
      <header className="flex items-start gap-4 border-b border-slate-300 bg-slate-950 p-5 text-white sm:p-6">
        <span className="font-mono text-xs font-semibold text-[#8fb3ff]">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 className="text-lg font-semibold">{group.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">{group.description}</p>
        </div>
      </header>
      <div>
        {group.items.map((term) => (
          <details key={term.id} className="group border-t border-slate-300 first:border-t-0">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] sm:px-6">
              <span className="flex min-w-0 items-center gap-4">
                <span className="grid min-w-14 shrink-0 place-items-center bg-[#edf2ff] px-2 py-2 font-mono text-xs font-bold text-[#2146d0]">
                  {term.term}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950 sm:text-base">{term.expanded}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{term.definition}</span>
                </span>
              </span>
              <span className="shrink-0 text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <div className="border-t border-slate-200 bg-slate-50 px-5 pb-6 pt-5 sm:px-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Why the business cares</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{term.businessValue}</p>
                  <div className="mt-5"><TechnologyList items={term.examples} label="Examples" /></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Portfolio connection</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{term.portfolioExample}</p>
                  </div>
                  <div className="border-l-2 border-[#2f5bff] bg-[#f3f6ff] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">Interview phrasing</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{term.interviewExample}</p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}

function QuestionList({ items }) {
  return (
    <div className="border border-slate-300 bg-white">
      {items.map((item, index) => (
        <details key={item.question} className="group border-t border-slate-300 first:border-t-0">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] sm:px-6">
            <span className="flex items-start gap-4">
              <span className="mt-0.5 font-mono text-xs font-semibold text-[#2f5bff]">Q{String(index + 1).padStart(2, "0")}</span>
              <span className="text-sm font-semibold leading-6 text-slate-950 sm:text-base">{item.question}</span>
            </span>
            <span className="text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="border-t border-slate-200 px-5 pb-7 pt-6 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Core answer</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.coreAnswer}</p>
                {item.technologyExamples ? <div className="mt-5"><TechnologyList items={item.technologyExamples} /></div> : null}
              </div>
              <div>
                <div className="border-l-2 border-[#2f5bff] bg-[#f3f6ff] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">Example</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.example}</p>
                </div>
                {item.commonMistake ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Common mistake:</strong> {item.commonMistake}</p>
                ) : null}
                {item.terms ? <div className="mt-5"><TechnologyList items={item.terms} label="Terms to remember" /></div> : null}
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function IncidentScenario({ scenario }) {
  return (
    <details className="group border-t border-slate-300 bg-white first:border-t-0">
      <summary className="flex min-h-20 cursor-pointer list-none items-start justify-between gap-5 px-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] sm:px-6">
        <span className="flex min-w-0 items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center bg-slate-950 text-white">
            <Activity size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold leading-6 text-slate-950 sm:text-lg">{scenario.title}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{scenario.situation}</span>
          </span>
        </span>
        <span className="shrink-0 text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
      </summary>

      <div className="border-t border-slate-300 px-5 pb-8 pt-6 sm:px-6 sm:pb-9">
        <div className="bg-[#f3f6ff] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">First principle</p>
          <p className="mt-2 text-sm font-medium leading-7 text-slate-900">{scenario.firstRule}</p>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Step-by-step response</h3>
            <ol className="mt-4 border border-slate-300">
              {scenario.steps.map((step, stepIndex) => (
                <li key={step.title} className="grid border-t border-slate-300 first:border-t-0 sm:grid-cols-[3.75rem_1fr]">
                  <span className="grid min-h-14 place-items-center bg-slate-950 font-mono text-xs font-semibold text-white">
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="border-t border-slate-200 px-4 py-4 sm:border-l sm:border-t-0">
                    <h4 className="text-sm font-semibold text-slate-950">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-7">
            <div className="bg-slate-950 p-5 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8fb3ff]">Should you increase the server?</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{scenario.scaleDecision}</p>
            </div>
            <TechnologyList items={scenario.signals} label="Signals to inspect" />
            <TechnologyList items={scenario.technologyExamples} label="Useful tools and technologies" />
            <div className="border border-[#b8c7ff] bg-[#f3f6ff] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2146d0]">
                <Lightbulb size={17} aria-hidden="true" /> Interview answer
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{scenario.interviewAnswer}</p>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function SecurityFlowDiagram({ flow }) {
  return (
    <div className="border border-slate-300 bg-[#f8fafc] p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-300 pb-3">
        <h4 className="text-sm font-semibold text-slate-950">{flow.label}</h4>
        <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${flow.tone === "risk" ? "text-rose-700" : "text-[#2146d0]"}`}>
          {flow.badge}
        </span>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-stretch">
        {flow.nodes.map((node, index) => {
          const Icon = securityDiagramIcons[node.icon] || ShieldCheck;

          return (
            <div key={node.id} className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-center">
              <div className={`flex min-h-28 flex-1 flex-col border p-4 ${node.tone === "risk" ? "border-rose-300 bg-rose-50" : "border-slate-300 bg-white"}`}>
                <span className={`grid size-9 place-items-center ${node.tone === "risk" ? "bg-rose-700 text-white" : "bg-[#e8efff] text-[#2146d0]"}`}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-950">{node.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{node.detail}</p>
              </div>
              {index < flow.nodes.length - 1 ? (
                <ArrowRight className="mx-auto my-2 shrink-0 rotate-90 text-slate-400 lg:mx-2 lg:my-0 lg:rotate-0" size={18} aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-l-2 border-[#2f5bff] pl-3 text-xs leading-5 text-slate-600">{flow.note}</p>
    </div>
  );
}

function SecurityDiagramScenario({ scenario, index }) {
  const mappingHeaders = scenario.mappingHeaders || ["Threat", "Primary controls", "Why they help"];

  return (
    <details className="group border-t border-slate-300 bg-white first:border-t-0">
      <summary className="flex min-h-20 cursor-pointer list-none items-start justify-between gap-5 px-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] sm:px-6">
        <span className="flex min-w-0 items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center bg-slate-950 font-mono text-xs font-semibold text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold leading-6 text-slate-950 sm:text-lg">{scenario.title}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{scenario.question}</span>
          </span>
        </span>
        <span className="shrink-0 text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
      </summary>

      <div className="border-t border-slate-300 px-5 pb-8 pt-6 sm:px-6 sm:pb-9">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="border-l-2 border-[#2f5bff] bg-[#f3f6ff] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">Core answer</p>
            <p className="mt-2 text-sm font-medium leading-7 text-slate-900">{scenario.coreAnswer}</p>
          </div>
          <div className="bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8fb3ff]">Senior framing</p>
            <p className="mt-2 text-sm leading-7 text-slate-200">{scenario.seniorFraming}</p>
          </div>
        </div>

        {scenario.flows?.length ? (
          <div className="mt-8 space-y-5" aria-label={`${scenario.title} diagrams`}>
            {scenario.flows.map((flow) => <SecurityFlowDiagram key={flow.id} flow={flow} />)}
          </div>
        ) : null}

        {scenario.controlMappings?.length ? (
          <div className="mt-8 border border-slate-300">
            <div className="grid bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white sm:grid-cols-[0.8fr_1fr_1.2fr] sm:gap-4">
              <span>{mappingHeaders[0]}</span><span className="hidden sm:block">{mappingHeaders[1]}</span><span className="hidden sm:block">{mappingHeaders[2]}</span>
            </div>
            {scenario.controlMappings.map((mapping) => (
              <div key={mapping.threat} className="grid gap-3 border-t border-slate-300 px-4 py-4 first:border-t-0 sm:grid-cols-[0.8fr_1fr_1.2fr] sm:gap-4">
                <p className="text-sm font-semibold text-slate-950">{mapping.threat}</p>
                <p className="text-sm leading-6 text-[#2146d0]">{mapping.controls}</p>
                <p className="text-sm leading-6 text-slate-600">{mapping.explanation}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Step-by-step explanation</h3>
            <ol className="mt-4 border border-slate-300">
              {scenario.steps.map((step, stepIndex) => (
                <li key={step.title} className="grid border-t border-slate-300 first:border-t-0 sm:grid-cols-[3.75rem_1fr]">
                  <span className="grid min-h-14 place-items-center bg-slate-950 font-mono text-xs font-semibold text-white">
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="px-4 py-4 sm:border-l sm:border-slate-300">
                    <h4 className="text-sm font-semibold text-slate-950">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-6">
            <TechnologyList items={scenario.technologyExamples} label="Technologies and controls" />
            <TechnologyList items={scenario.terms} label="Terms to remember" />
            <div className="border border-[#b8c7ff] bg-[#f3f6ff] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2146d0]">
                <Lightbulb size={17} aria-hidden="true" /> Interview answer
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{scenario.interviewAnswer}</p>
            </div>
            <p className="border-l-2 border-amber-500 pl-4 text-sm leading-6 text-slate-600">
              <strong className="text-slate-950">Common mistake:</strong> {scenario.commonMistake}
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}

function CourseCard({ course, index }) {
  return (
    <article className="border border-slate-300 bg-white transition hover:-translate-y-1 hover:border-[#2f5bff]">
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${course.youtubeId}`}
          title={`${course.title} by ${course.source}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">
          <span>Lesson {String(index + 1).padStart(2, "0")}</span>
          <span className="text-slate-500">{course.module}</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-7 text-slate-950">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{course.source}</p>
        <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700">{course.takeaway}</p>
      </div>
    </article>
  );
}

export default function InterviewReferencePage() {
  const reactSection = referenceData.frontendSections.find((section) => section.id === "react");
  const vueSection = referenceData.frontendSections.find((section) => section.id === "vue-nuxt");
  const [activeSectionId, setActiveSectionId] = useState(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    return referenceSectionIds.includes(hash) ? hash : referenceSectionIds[0];
  });
  const [isTopicSidebarExpanded, setIsTopicSidebarExpanded] = useState(true);

  useEffect(() => {
    const sections = referenceSectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!("IntersectionObserver" in window) || sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const focusedSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              Math.abs(first.boundingClientRect.top - window.innerHeight * 0.25)
              - Math.abs(second.boundingClientRect.top - window.innerHeight * 0.25),
          )[0];

        if (focusedSection) setActiveSectionId(focusedSection.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <ApplicationPageShell
      title={referenceData.page.title}
      description={referenceData.page.description}
      canonicalPath="/portfolio/interview-reference"
    >
      <section className="bg-slate-50 pb-20 pt-24 lg:pb-28 lg:pt-28">
        <div className="w-full">
          <header className="mx-auto w-full max-w-[1440px] border-b border-slate-300 px-5 pb-10 sm:px-8">
            <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
              <div className="max-w-4xl">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2146d0]">
                  <BookOpenCheck size={18} aria-hidden="true" /> Interview reference
                </span>
                <h1 className="portfolio-display mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl">
                  Senior interview handbook.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Use this as your durable cheat sheet for architecture, UI/UX, quality, security, delivery, framework depth, leadership, and project evidence. Open a topic when you need the decision, terminology, trade-off, and a credible example from your work.
                </p>
              </div>
              <Link
                to="/portfolio/interview-review"
                className="inline-flex min-h-11 w-fit items-center gap-2 bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] active:translate-y-px"
              >
                Open study mode <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div
            className={`mt-10 grid w-full items-start gap-8 transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none lg:gap-10 ${
              isTopicSidebarExpanded
                ? "lg:grid-cols-[18rem_minmax(0,1fr)]"
                : "lg:grid-cols-[4.5rem_minmax(0,1fr)]"
            }`}
          >
            <aside
              id="interview-reference-topics"
              aria-labelledby="interview-reference-topics-title"
              className="self-start overflow-hidden border border-slate-300 bg-white lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]"
            >
              <div className={`flex min-h-16 items-center border-b border-slate-300 p-2 ${isTopicSidebarExpanded ? "justify-between pl-4" : "justify-center"}`}>
                {isTopicSidebarExpanded ? (
                  <h2 id="interview-reference-topics-title" className="text-sm font-semibold text-slate-950">Interview topics</h2>
                ) : (
                  <span id="interview-reference-topics-title" className="sr-only">Interview topics</span>
                )}
                <button
                  type="button"
                  aria-controls="interview-reference-topic-list"
                  aria-expanded={isTopicSidebarExpanded}
                  aria-label={isTopicSidebarExpanded ? "Collapse topic sidebar" : "Expand topic sidebar"}
                  onClick={() => setIsTopicSidebarExpanded((isExpanded) => !isExpanded)}
                  className="grid size-11 shrink-0 place-items-center text-slate-700 transition-colors hover:bg-[#edf2ff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff]"
                >
                  {isTopicSidebarExpanded ? <PanelLeftClose size={19} aria-hidden="true" /> : <PanelLeftOpen size={19} aria-hidden="true" />}
                </button>
              </div>

              <nav id="interview-reference-topic-list" aria-label="Reference topics" className="max-h-[22rem] overflow-y-auto p-2 lg:max-h-[calc(100vh-15rem)]">
                <ul className={isTopicSidebarExpanded ? "grid gap-1 sm:grid-cols-2 lg:grid-cols-1" : "flex flex-wrap gap-1 lg:flex-col"}>
                  {referenceData.navigation.map((item) => {
                    const Icon = sectionIcons[item.id] || Sparkles;
                    const isActive = activeSectionId === item.id;

                    return (
                      <li key={item.id} className={isTopicSidebarExpanded ? "min-w-0" : "shrink-0"}>
                        <a
                          href={`#${item.id}`}
                          aria-label={isTopicSidebarExpanded ? undefined : item.label}
                          aria-current={isActive ? "location" : undefined}
                          title={isTopicSidebarExpanded ? undefined : item.label}
                          onClick={() => setActiveSectionId(item.id)}
                          className={`flex min-h-11 items-center text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f5bff] ${
                            isTopicSidebarExpanded ? "gap-3 px-3 py-2.5" : "justify-center px-3 py-2.5"
                          } ${
                            isActive
                              ? "bg-[#edf2ff] font-semibold text-[#2146d0]"
                              : "font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2146d0]"
                          }`}
                        >
                          <Icon className="shrink-0" size={17} aria-hidden="true" />
                          <span className={isTopicSidebarExpanded ? "min-w-0" : "sr-only"}>{item.label}</span>
                          {isTopicSidebarExpanded ? (
                            <ArrowRight className={`ml-auto shrink-0 ${isActive ? "opacity-100" : "opacity-0"}`} size={14} aria-hidden="true" />
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {isTopicSidebarExpanded ? (
                <div className="border-t border-slate-300 bg-slate-950 p-5 text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} aria-hidden="true" /> Recall rule</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Remember the decision, trade-off, example, and result.</p>
                </div>
              ) : null}
            </aside>

            <div className="min-w-0 space-y-20 px-5 sm:px-8 lg:pl-0">
              <section id="answer-frameworks" className="scroll-mt-24">
                <SectionHeading id="answer-frameworks" title="Answer frameworks" description="Use a consistent structure so your answer sounds deliberate instead of improvised." />
                <div className="grid border border-slate-300 bg-white md:grid-cols-3">
                  {referenceData.answerFrameworks.map((framework, index) => (
                    <article key={framework.id} className="border-t border-slate-300 p-6 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
                      <span className="font-mono text-xs font-semibold text-[#2f5bff]">0{index + 1}</span>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">{framework.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[#2146d0]">{framework.formula}</p>
                      <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">{framework.example}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="project-stories" className="scroll-mt-24">
                <SectionHeading id="project-stories" title="Reusable project stories" description="Anchor abstract questions in products you have actually helped build." />
                <div className="bg-white p-6 sm:p-8">
                  {referenceData.projectStories.map((entry, index) => <ReferenceEntry key={entry.id} entry={entry} index={index} />)}
                </div>
              </section>

              <section id="business-terms" className="scroll-mt-24">
                <SectionHeading id="business-terms" title="Business and product terms" description="Translate the acronyms you hear in product, commercial, and leadership conversations into business impact and engineering decisions." />
                <div className="grid gap-6 xl:grid-cols-2">
                  {referenceData.businessTermGroups.map((group, index) => (
                    <BusinessTermGroup key={group.id} group={group} index={index} />
                  ))}
                </div>
              </section>

              <section id="system-design" className="scroll-mt-24">
                <SectionHeading id="system-design" title="Architecture and system design" description="Start with requirements and failure modes. Technology choices come after the shape of the problem is clear." />
                <div className="bg-white p-6 sm:p-8">
                  {referenceData.architectureTopics.map((entry, index) => <ReferenceEntry key={entry.id} entry={entry} index={index} />)}
                </div>
              </section>

              <section id="incident-scenarios" className="scroll-mt-24">
                <SectionHeading id="incident-scenarios" title="Production incident scenarios" description="Use the same senior response every time: stabilize users, measure the system, isolate the constrained layer, fix the proven cause, and verify recovery." />
                <div className="grid border border-slate-300 bg-white sm:grid-cols-2 xl:grid-cols-4">
                  {referenceData.incidentResponsePattern.map((item) => (
                    <article key={item.id} className="border-t border-slate-300 p-5 first:border-t-0 sm:border-l sm:odd:border-l-0 sm:[&:nth-child(-n+2)]:border-t-0 xl:border-l xl:border-t-0 xl:first:border-l-0">
                      <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-6 border border-slate-300">
                  {referenceData.incidentScenarios.map((scenario) => (
                    <IncidentScenario key={scenario.id} scenario={scenario} />
                  ))}
                </div>
              </section>

              <section id="frontend-architecture" className="scroll-mt-24">
                <SectionHeading id="frontend-architecture" title="Frontend architecture" description="Show how you divide responsibility, select rendering and state boundaries, and keep a large interface observable and responsive." />
                <QuestionList items={referenceData.frontendArchitectureTopics} />
              </section>

              <section id="backend-terms" className="scroll-mt-24">
                <SectionHeading id="backend-terms" title="Backend terms with real technology examples" description="Open each term to see what implements it, where a managed platform may hide it, and how to explain it using your projects." />
                <div className="border border-slate-300">
                  {referenceData.backendConcepts.map((concept, index) => <BackendConcept key={concept.id} concept={concept} index={index} />)}
                </div>
              </section>

              <section id="api-design" className="scroll-mt-24">
                <SectionHeading id="api-design" title="REST and GraphQL" description="Both are API styles. The senior answer explains their operational and product trade-offs, not which one is fashionable." />
                <div className="grid gap-px bg-slate-300 lg:grid-cols-2">
                  {referenceData.apiStyles.map((style) => (
                    <article key={style.id} className="bg-white p-6 sm:p-8">
                      <div className="flex items-center gap-3">
                        {style.id === "rest" ? <Globe2 className="text-[#2f5bff]" size={24} aria-hidden="true" /> : <Boxes className="text-[#2f5bff]" size={24} aria-hidden="true" />}
                        <h3 className="portfolio-display text-3xl font-semibold tracking-[-0.035em] text-slate-950">{style.title}</h3>
                      </div>
                      <p className="mt-5 text-sm leading-7 text-slate-700">{style.definition}</p>
                      <div className="mt-5"><TechnologyList items={style.technologyExamples} /></div>
                      <div className="mt-6 border-l-2 border-[#2f5bff] bg-[#f3f6ff] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">You may already use it when</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{style.youMayUseItWhen}</p>
                      </div>
                      <dl className="mt-6 space-y-5 text-sm">
                        <div><dt className="font-semibold text-slate-950">Example</dt><dd className="mt-1 leading-6 text-slate-600">{style.example}</dd></div>
                        <div><dt className="font-semibold text-slate-950">Choose it when</dt><dd className="mt-1 leading-6 text-slate-600">{style.chooseWhen}</dd></div>
                        <div><dt className="font-semibold text-slate-950">Watch for</dt><dd className="mt-1 leading-6 text-slate-600">{style.watchFor}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="mt-6">
                  <QuestionList items={referenceData.apiQuestions} />
                </div>
              </section>

              <section id="ui-ux" className="scroll-mt-24">
                <SectionHeading id="ui-ux" title="UI/UX and accessibility" description="Connect visual decisions to user tasks, reusable systems, inclusive behavior, and measurable product outcomes." />
                <QuestionList items={referenceData.uiUxTopics} />
              </section>

              <section id="seo" className="scroll-mt-24">
                <SectionHeading id="seo" title="SEO, analytics, and growth signals" description="A visual operating guide for finding visibility, behavior, performance, and authority problems without treating one dashboard as the whole truth." />
                <SeoReference data={referenceData.seoReference} />
              </section>

              <section id="quality" className="scroll-mt-24">
                <SectionHeading id="quality" title="Testing and engineering quality" description="Explain how you build confidence with risk-appropriate tests, review practices, release controls, and observable outcomes." />
                <QuestionList items={referenceData.qualityTopics} />
              </section>

              <section id="security" className="scroll-mt-24">
                <SectionHeading id="security" title="Security and frontend hardening" description="Treat user input, identity, tenant data, browser boundaries, files, and secrets as explicit parts of the architecture." />
                <QuestionList items={referenceData.securityTopics} />
              </section>

              <section id="security-diagrams" className="scroll-mt-24">
                <SectionHeading id="security-diagrams" title="Security architecture diagrams" description="Compare weak and hardened request paths, match common attacks to the right controls, and rehearse a senior incident response." />
                <div className="border border-slate-300 bg-white">
                  {referenceData.securityDiagramScenarios.map((scenario, index) => (
                    <SecurityDiagramScenario key={scenario.id} scenario={scenario} index={index} />
                  ))}
                </div>
              </section>

              <section id="deployment" className="scroll-mt-24">
                <SectionHeading id="deployment" title="Deployment and DevOps" description="Explain the request path, release workflow, failure boundaries, and managed infrastructure behind a production deployment." />
                <QuestionList items={referenceData.deploymentTopics} />
              </section>

              <section id="cloud-computing" className="scroll-mt-24">
                <SectionHeading id="cloud-computing" title="Cloud computing" description="Explain cloud services as architectural trade-offs across compute, storage, networking, reliability, security, observability, and cost." />
                <QuestionList items={referenceData.cloudComputingTopics} />
              </section>

              <section id="react" className="scroll-mt-24">
                <SectionHeading id="react" title={reactSection.title} description="Explain the mental model first, then name the tool and a product example." />
                <QuestionList items={reactSection.items} />
              </section>

              <section id="vue-nuxt" className="scroll-mt-24">
                <SectionHeading id="vue-nuxt" title={vueSection.title} description="Show that you understand reactivity and rendering decisions beyond component syntax." />
                <QuestionList items={vueSection.items} />
              </section>

              <section id="agile-delivery" className="scroll-mt-24">
                <SectionHeading id="agile-delivery" title="Agile delivery and team collaboration" description="Use Agile and Scrum vocabulary to explain how you plan, adapt, negotiate scope, and improve delivery without turning ceremonies into the goal." />
                <QuestionList items={referenceData.agileDeliveryTopics} />
              </section>

              <section id="leadership" className="scroll-mt-24">
                <SectionHeading id="leadership" title="Leadership and behavioral answers" description="Senior answers make risk, alignment, ownership, and learning visible." />
                <QuestionList items={referenceData.leadershipTopics} />
              </section>

              <section id="ai-integration" className="scroll-mt-24">
                <SectionHeading id="ai-integration" title="AI integration" description="Frame AI as a product and systems capability with reliability, security, and evaluation boundaries." />
                <QuestionList items={referenceData.aiTopics} />
              </section>

              <section id="product-thinking" className="scroll-mt-24">
                <SectionHeading id="product-thinking" title="Product thinking and stakeholder communication" description="Translate engineering decisions into user outcomes, evidence, scope, business value, and clear options for stakeholders." />
                <QuestionList items={referenceData.productThinkingTopics} />
              </section>

              <section id="metrics" className="scroll-mt-24">
                <SectionHeading id="metrics" title="Credible metrics language" description="Be precise about evidence and contribution without shrinking your impact or claiming sole ownership." />
                <div className="space-y-4">
                  {referenceData.metricGuidance.map((item, index) => (
                    <article key={item.strong} className="grid border border-slate-300 bg-white lg:grid-cols-[4rem_1fr_1fr]">
                      <div className="grid min-h-16 place-items-center bg-slate-950 font-mono text-sm font-semibold text-white">{String(index + 1).padStart(2, "0")}</div>
                      <div className="border-t border-slate-300 p-5 lg:border-l lg:border-t-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-600">Avoid</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.weak}</p>
                      </div>
                      <div className="border-t border-slate-300 bg-[#f3f6ff] p-5 lg:border-l lg:border-t-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2146d0]">Use instead</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{item.strong}</p>
                        <p className="mt-3 text-xs leading-5 text-slate-500">{item.reason}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section id="courses" className="scroll-mt-24">
                <SectionHeading id="courses" title="Embedded video lessons" description="Watch without leaving the reference page, then explain the concept aloud using one of your projects." />
                <div className="grid gap-5 xl:grid-cols-2">
                  {referenceData.courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
                </div>
              </section>

              <section id="weekly-routine" className="scroll-mt-24">
                <SectionHeading id="weekly-routine" title="A repeatable weekly routine" description="Short, deliberate practice is more useful than rereading the entire page." />
                <ol className="border border-slate-300 bg-white">
                  {referenceData.weeklyRoutine.map((item, index) => (
                    <li key={item.day} className="grid border-t border-slate-300 first:border-t-0 sm:grid-cols-[4rem_8rem_1fr]">
                      <span className="grid min-h-14 place-items-center bg-slate-950 font-mono text-xs font-semibold text-white">{String(index + 1).padStart(2, "0")}</span>
                      <strong className="flex items-center border-t border-slate-200 px-4 py-3 text-sm text-slate-950 sm:border-l sm:border-t-0">{item.day}</strong>
                      <div className="border-t border-slate-200 px-4 py-3 sm:border-l sm:border-t-0">
                        <p className="text-sm font-semibold text-[#2146d0]">{item.focus}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.exercise}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="border border-slate-300 bg-slate-950 p-7 text-white sm:p-9">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#8fb3ff]"><ShieldCheck size={17} aria-hidden="true" /> Ready to practice</div>
                    <h2 className="portfolio-display mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Turn reference into recall.</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Choose a topic in study mode and answer before revealing the prepared response.</p>
                  </div>
                  <Link to="/portfolio/interview-review" className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4169ff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">
                    Start study mode <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
