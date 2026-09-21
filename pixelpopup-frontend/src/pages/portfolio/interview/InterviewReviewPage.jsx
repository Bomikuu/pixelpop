import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Eye,
  ExternalLink,
  Gauge,
  Globe2,
  Layers3,
  Lightbulb,
  ListTree,
  Network,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ServerCog,
  ShieldCheck,
  Shuffle,
  Sparkles,
  MessageSquareText,
  Target,
  Timer,
  UsersRound,
  Workflow,
} from "lucide-react";
import ApplicationPageShell from "../application/ApplicationPageShell";
import interviewData from "./interviewQuestions.json";
import interviewReference from "./interviewReference.json";

const sectionIcons = {
  Network,
  Layers3,
  Workflow,
  Gauge,
  UsersRound,
  BriefcaseBusiness,
  ServerCog,
  MessageSquareText,
  Code2,
  Database,
  Globe2,
  ShieldCheck,
  Sparkles,
  Target,
  Eye,
  RefreshCw,
};

const reviewSectionConfig = {
  "project-stories": {
    description: "Behavioral answers grounded in shipped product outcomes.",
    icon: "BriefcaseBusiness",
  },
  "system-design": {
    description: "Architecture boundaries, data flow, scale, and failure modes.",
    icon: "Network",
  },
  "frontend-architecture": {
    description: "Rendering, state, component boundaries, and maintainability.",
    icon: "Layers3",
  },
  "backend-terms": {
    description: "The infrastructure vocabulary behind reliable systems.",
    icon: "ServerCog",
  },
  "api-design": {
    description: "REST, GraphQL, contracts, versioning, and integrations.",
    icon: "Workflow",
  },
  "ui-ux": {
    description: "Accessible product design and interface decision-making.",
    icon: "Eye",
  },
  quality: {
    description: "Testing strategy, observability, and engineering quality.",
    icon: "ShieldCheck",
  },
  security: {
    description: "Threats, controls, and secure delivery decisions.",
    icon: "ShieldCheck",
  },
  deployment: {
    description: "Vercel, AWS, CI/CD, release safety, and operations.",
    icon: "Globe2",
  },
  react: {
    description: "React state, rendering, performance, and component APIs.",
    icon: "Code2",
  },
  "vue-nuxt": {
    description: "Vue reactivity, Nuxt rendering, state, and composables.",
    icon: "Code2",
  },
  "agile-delivery": {
    description: "Scrum, estimation, planning, feedback, and delivery flow.",
    icon: "RefreshCw",
  },
  leadership: {
    description: "Technical direction, disagreement, risk, and team growth.",
    icon: "UsersRound",
  },
  "ai-integration": {
    description: "Practical AI architecture, validation, safety, and value.",
    icon: "Sparkles",
  },
  "product-thinking": {
    description: "Outcomes, prioritization, discovery, and product judgment.",
    icon: "Target",
  },
};

const detailedSectionAliases = {
  "system-architecture": "system-design",
  "backend-fundamentals": "backend-terms",
  "frontend-architecture": "frontend-architecture",
  "services-apis": "api-design",
  "performance-reliability": "quality",
  "leadership-delivery": "leadership",
  "typical-interview": "project-stories",
  "case-studies": "project-stories",
};

const toSlug = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const createReferenceQuestion = (sectionId, item, index, overrides = {}) => {
  const question = overrides.question || item.question || item.prompt || item.title;
  const fallbackId = toSlug(question || item.term || `question-${index + 1}`);

  return {
    id: `reference-${sectionId}-${item.id || fallbackId}`,
    sectionId,
    order: 1000 + index,
    kind: "reference",
    level: overrides.level || "Senior review",
    question,
    interviewerIntent: item.interviewerIntent || overrides.interviewerIntent || "Explain the decision clearly, name the trade-offs, and connect it to shipped work.",
    shortAnswer: item.coreAnswer || item.definition || item.formula || "",
    example: item.exampleAnswer || item.example || item.interviewExample || item.projectExample || "",
    supportingDetail: item.chooseWhen || item.youMayUseItWhen || "",
    technologyExamples: item.technologyExamples || [],
    terms: item.terms || (item.term ? [item.term] : []),
    projectProof: item.projectProof || "",
    commonMistake: item.commonMistake || item.watchFor || "",
  };
};

const buildReferenceQuestions = () => {
  const questions = [];
  const addItems = (sectionId, items, transform) => {
    items.forEach((item, index) => {
      const overrides = transform ? transform(item) : {};
      questions.push(createReferenceQuestion(sectionId, item, index, overrides));
    });
  };

  addItems("project-stories", interviewReference.projectStories);
  addItems("system-design", interviewReference.architectureTopics);
  addItems("frontend-architecture", interviewReference.frontendArchitectureTopics);
  addItems("backend-terms", interviewReference.backendConcepts, (item) => ({
    question: `What is ${item.term}, when would you use it, and what trade-offs matter?`,
    level: "Backend foundation",
  }));
  addItems("api-design", interviewReference.apiStyles, (item) => ({
    question: `When would you choose ${item.title}, and what trade-offs matter?`,
  }));
  addItems("api-design", interviewReference.apiQuestions);
  addItems("ui-ux", interviewReference.uiUxTopics);
  addItems("quality", interviewReference.qualityTopics);
  addItems("security", interviewReference.securityTopics);
  addItems("deployment", interviewReference.deploymentTopics);

  interviewReference.frontendSections.forEach((section) => {
    addItems(section.id, section.items);
  });

  addItems("agile-delivery", interviewReference.agileDeliveryTopics);
  addItems("leadership", interviewReference.leadershipTopics);
  addItems("ai-integration", interviewReference.aiTopics);
  addItems("product-thinking", interviewReference.productThinkingTopics);

  return questions;
};

const roleTracks = [
  {
    id: "senior-frontend",
    label: "Senior Frontend",
    icon: Code2,
    focus: "Lead with rendering strategy, accessibility, performance, state boundaries, and design-system decisions.",
    proof: "Use Cortico and Walkspan to connect interface decisions to product outcomes.",
  },
  {
    id: "senior-fullstack",
    label: "Senior Full-stack",
    icon: Database,
    focus: "Explain contracts, data ownership, caching, asynchronous work, failure modes, and observability.",
    proof: "Use DineEase and Cortico to show end-to-end product and platform judgment.",
  },
  {
    id: "technical-lead",
    label: "Technical Lead",
    icon: UsersRound,
    focus: "Frame decisions around risk, sequencing, team alignment, measurable outcomes, and maintainable delivery.",
    proof: "Use ASTA and DineEase to demonstrate leadership across ambiguous, multi-surface builds.",
  },
];

const glossaryGroups = [
  {
    id: "traffic-delivery",
    label: "Traffic & delivery",
    icon: Network,
    terms: ["Load balancer", "Reverse proxy", "CDN", "Rate limiting"],
  },
  {
    id: "caching",
    label: "Caching",
    icon: Database,
    terms: ["Cache", "Cache invalidation", "TTL"],
  },
  {
    id: "scale-data",
    label: "Scale & data",
    icon: Layers3,
    terms: ["Horizontal scaling", "Vertical scaling", "Database index", "Read replica"],
  },
  {
    id: "reliability-async",
    label: "Reliability & async",
    icon: ShieldCheck,
    terms: ["Message queue", "Idempotency", "Circuit breaker", "Eventual consistency", "Observability"],
  },
];

const rapidRecallGroups = [
  {
    id: "frontend",
    label: "Frontend",
    icon: Code2,
    items: ["ssr-csr-ssg", "react-rerender", "state-management", "debounce-throttle"],
  },
  {
    id: "apis-security",
    label: "APIs & security",
    icon: ShieldCheck,
    items: ["rest-graphql", "authentication-authorization", "cors", "xss-csrf", "webhook"],
  },
  {
    id: "data-backend",
    label: "Data & backend",
    icon: Database,
    items: ["sql-nosql", "transactions", "race-condition", "cap-theorem"],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Workflow,
    items: ["docker", "cicd", "deployment-strategies"],
  },
];

const glossaryTermIcons = {
  "Load balancer": Network,
  "Reverse proxy": ArrowRight,
  CDN: Globe2,
  "Rate limiting": Gauge,
  Cache: Database,
  "Cache invalidation": RotateCcw,
  TTL: Timer,
  "Horizontal scaling": ArrowLeftRight,
  "Vertical scaling": ArrowUpDown,
  "Database index": Search,
  "Read replica": Copy,
  "Message queue": ListTree,
  Idempotency: CheckCircle2,
  "Circuit breaker": ShieldCheck,
  "Eventual consistency": Workflow,
  Observability: Eye,
};

const videoReferences = [
  {
    id: "load-balancing",
    category: "System design",
    title: "Top 6 Load Balancing Algorithms Every Developer Should Know",
    source: "ByteByteGo",
    url: "https://www.youtube.com/watch?v=dBmxNsS3BGE",
    thumbnailUrl: "https://i.ytimg.com/vi/dBmxNsS3BGE/hqdefault.jpg",
    takeaway: "Refresh routing strategies, failure handling, and the tradeoffs behind distributing traffic.",
  },
  {
    id: "caching",
    category: "Backend foundations",
    title: "Caching in System Design",
    source: "ByteByteGo",
    url: "https://www.youtube.com/watch?v=mWArFVAjwYc",
    thumbnailUrl: "https://i.ytimg.com/vi/mWArFVAjwYc/hqdefault.jpg",
    takeaway: "Connect cache placement, invalidation, eviction, and consistency to real architecture decisions.",
  },
  {
    id: "core-web-vitals",
    category: "Frontend performance",
    title: "Understanding Performance with Core Web Vitals",
    source: "Chrome for Developers",
    url: "https://www.youtube.com/watch?v=F0NYT7DIlDQ",
    thumbnailUrl: "https://i.ytimg.com/vi/F0NYT7DIlDQ/hqdefault.jpg",
    takeaway: "Turn performance metrics into an explanation of user impact, measurement, and prioritization.",
  },
  {
    id: "react-profiling",
    category: "Frontend architecture",
    title: "Profiling React Rendering Performance",
    source: "React Alicante",
    url: "https://www.youtube.com/watch?v=Q7NEfD4FNYE",
    thumbnailUrl: "https://i.ytimg.com/vi/Q7NEfD4FNYE/hqdefault.jpg",
    takeaway: "Practice explaining how you find rendering bottlenecks before reaching for memoization.",
  },
];

const learningLoop = [
  {
    id: "watch",
    label: "Watch one concept",
    detail: "Choose one video that matches the topic you are reviewing today.",
    icon: PlayCircle,
  },
  {
    id: "explain",
    label: "Explain without notes",
    detail: "Summarize it aloud in 90 seconds using Context, Constraints, Decision, and Tradeoffs.",
    icon: MessageSquareText,
  },
  {
    id: "apply",
    label: "Attach project proof",
    detail: "Connect the concept to Cortico, Walkspan, DineEase, or an ASTA delivery decision.",
    icon: BriefcaseBusiness,
  },
  {
    id: "revisit",
    label: "Revisit after 48 hours",
    detail: "Return without rereading first. The gap you notice is what you should review next.",
    icon: RefreshCw,
  },
];

function ArchitectureDiagram({ diagram }) {
  const vertical = diagram.type === "layers";

  return (
    <div
      className={`grid gap-3 ${vertical ? "grid-cols-1" : "md:grid-cols-[repeat(7,minmax(0,1fr))] md:items-stretch"}`}
      aria-label="Architecture flow"
    >
      {diagram.nodes.map((node, index) => (
        <div key={node.id} className={vertical ? "contents" : "contents"}>
          <div className={`${vertical ? "" : "md:col-span-1"} border border-slate-300 bg-white p-4 transition-colors hover:border-[#2f5bff]`}>
            <span className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</span>
            <h4 className="mt-2 text-sm font-semibold text-slate-950">{node.label}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-600">{node.detail}</p>
          </div>
          {index < diagram.nodes.length - 1 && (
            <div className={`${vertical ? "h-5" : "hidden md:grid md:col-span-1"} place-items-center text-slate-400`} aria-hidden="true">
              {vertical ? <ArrowDown size={18} /> : <ArrowRight size={18} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StudyMode({ question, glossary, note, onNoteChange, onReveal }) {
  const [activeTerm, setActiveTerm] = useState(null);
  const glossaryByTerm = useMemo(
    () => Object.fromEntries(glossary.map((item) => [item.term.toLowerCase(), item])),
    [glossary],
  );
  const selectedDefinition = activeTerm ? glossaryByTerm[activeTerm.toLowerCase()] : null;

  return (
    <div className="space-y-8">
      <section className="border-y border-slate-200 py-7" aria-labelledby="scenario-title">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <h3 id="scenario-title" className="text-sm font-semibold text-slate-950">The scenario</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{question.scenario}</p>
          </div>
          <div className="border-l-2 border-[#2f5bff] pl-5">
            <h3 className="text-sm font-semibold text-slate-950">What the interviewer is testing</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{question.interviewerIntent}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="architecture-map-title">
        <div className="mb-5 flex items-center gap-3">
          <Network size={19} className="text-[#2f5bff]" aria-hidden="true" />
          <h3 id="architecture-map-title" className="text-lg font-semibold text-slate-950">Architecture map</h3>
        </div>
        <ArchitectureDiagram diagram={question.diagram} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-slate-950 p-6 text-white" aria-labelledby="think-title">
          <div className="flex items-center gap-3">
            <Lightbulb size={19} className="text-blue-300" aria-hidden="true" />
            <h3 id="think-title" className="text-lg font-semibold">Think through it first</h3>
          </div>
          <ol className="mt-5 space-y-4">
            {question.reflectionPrompts.map((prompt, index) => (
              <li key={prompt} className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm leading-6 text-slate-300">
                <span className="font-mono text-xs font-semibold text-blue-300">{String(index + 1).padStart(2, "0")}</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border border-slate-300 bg-white p-6" aria-labelledby="concepts-title">
          <div className="flex items-center gap-3">
            <Layers3 size={19} className="text-[#2f5bff]" aria-hidden="true" />
            <h3 id="concepts-title" className="text-lg font-semibold text-slate-950">Concepts to connect</h3>
          </div>
          <ul className="mt-5 divide-y divide-slate-200">
            {question.concepts.map((concept) => {
              const hasDefinition = Boolean(glossaryByTerm[concept.toLowerCase()]);
              return (
                <li key={concept} className="py-2">
                  <button
                    type="button"
                    disabled={!hasDefinition}
                    onClick={() => hasDefinition && setActiveTerm(concept)}
                    className={`flex min-h-9 w-full items-center gap-3 text-left text-sm font-medium ${hasDefinition ? "text-slate-700 transition hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" : "cursor-default text-slate-700"}`}
                  >
                    <span className="size-1.5 bg-[#2f5bff]" aria-hidden="true" />
                    {concept}
                    {hasDefinition && <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-[#2146d0]">Define</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedDefinition && (
            <div className="mt-4 border-l-2 border-[#2f5bff] bg-blue-50 p-4" aria-live="polite">
              <strong className="text-sm text-slate-950">{selectedDefinition.term}</strong>
              <p className="mt-1 text-sm leading-6 text-slate-700">{selectedDefinition.definition}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600"><strong>Use it when:</strong> {selectedDefinition.useWhen}</p>
            </div>
          )}
        </section>
      </div>

      <section className="border border-slate-300 bg-slate-50 p-5" aria-labelledby="notes-title">
        <label id="notes-title" htmlFor={`study-notes-${question.id}`} className="text-sm font-semibold text-slate-950">Your study notes</label>
        <p className="mt-1 text-xs leading-5 text-slate-600">Draft your answer, list terms you forgot, or save a project example. Notes stay in this browser session.</p>
        <textarea
          id={`study-notes-${question.id}`}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={4}
          placeholder="Start with context, constraints, decision, and tradeoffs..."
          className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-[#2f5bff] focus:ring-2 focus:ring-blue-100"
        />
      </section>

      <div className="flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-7 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm leading-6 text-slate-600">Say your answer out loud using Context, Constraints, Decision, and Tradeoffs. Then compare your reasoning with the model answer.</p>
        <button
          type="button"
          onClick={onReveal}
          aria-expanded="false"
          className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px"
        >
          Review the answer
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function AnswerMode({ question, onReturn }) {
  return (
    <div className="space-y-8" aria-live="polite">
      <section className="border-l-4 border-[#2f5bff] bg-blue-50 p-6 sm:p-8" aria-labelledby="short-answer-title">
        <div className="flex items-center gap-3 text-[#2146d0]">
          <Sparkles size={18} aria-hidden="true" />
          <h3 id="short-answer-title" className="text-sm font-semibold">The 30-second answer</h3>
        </div>
        <p className="mt-4 text-lg font-medium leading-8 text-slate-950">{question.shortAnswer}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section aria-labelledby="deeper-answer-title">
          <h3 id="deeper-answer-title" className="text-xl font-semibold text-slate-950">Build the deeper answer</h3>
          <ol className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
            {question.deepAnswer.map((point, index) => (
              <li key={point} className="grid grid-cols-[2.5rem_1fr] gap-4 py-4 text-sm leading-7 text-slate-700">
                <span className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-slate-950 p-6 text-white" aria-labelledby="signals-title">
          <h3 id="signals-title" className="text-lg font-semibold">Senior signals</h3>
          <ul className="mt-5 space-y-4">
            {question.seniorSignals.map((signal) => (
              <li key={signal} className="flex gap-3 text-sm leading-6 text-slate-300">
                <CheckCircle2 size={17} className="mt-1 shrink-0 text-blue-300" aria-hidden="true" />
                {signal}
              </li>
            ))}
          </ul>
          <div className="mt-7 border-t border-white/15 pt-6">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Project proof</span>
            <h4 className="mt-2 text-base font-semibold">{question.projectProof.project}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{question.projectProof.summary}</p>
          </div>
        </section>
      </div>

      <section aria-labelledby="tradeoffs-title">
        <h3 id="tradeoffs-title" className="text-xl font-semibold text-slate-950">Tradeoffs to name clearly</h3>
        <div className="mt-5 grid gap-px bg-slate-300 md:grid-cols-2">
          {question.tradeoffs.map((tradeoff) => (
            <article key={tradeoff.choice} className="bg-white p-6">
              <h4 className="font-semibold text-slate-950">{tradeoff.choice}</h4>
              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div><dt className="font-semibold text-emerald-700">Benefit</dt><dd className="text-slate-600">{tradeoff.benefit}</dd></div>
                <div><dt className="font-semibold text-rose-700">Risk</dt><dd className="text-slate-600">{tradeoff.risk}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-7" aria-labelledby="follow-ups-title">
        <h3 id="follow-ups-title" className="text-base font-semibold text-slate-950">Likely follow-up questions</h3>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {question.followUps.map((followUp) => (
            <li key={followUp} className="flex gap-3 border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              <ArrowRight size={16} className="mt-1 shrink-0 text-[#2f5bff]" aria-hidden="true" />
              {followUp}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={onReturn}
        aria-expanded="true"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Return to study mode
      </button>
    </div>
  );
}

function ReferenceStudyMode({ question, note, onNoteChange, onReveal }) {
  return (
    <div className="space-y-8">
      <section className="grid gap-px bg-slate-300 md:grid-cols-3" aria-labelledby="reference-prompts-title">
        <h3 id="reference-prompts-title" className="sr-only">Questions to consider before revealing the answer</h3>
        {[
          ["Define", "Explain the concept in plain language before naming tools."],
          ["Decide", "State what you would choose, then name the constraint that changes your decision."],
          ["Prove", "Connect the answer to Cortico, Walkspan, DineEase, ASTA, or another shipped system."],
        ].map(([label, detail]) => (
          <div key={label} className="bg-slate-50 p-5 sm:p-6">
            <strong className="text-sm text-slate-950">{label}</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-slate-200 py-7" aria-labelledby="reference-intent-title">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <h3 id="reference-intent-title" className="text-sm font-semibold text-slate-950">What the interviewer is testing</h3>
          <p className="text-sm leading-7 text-slate-600">{question.interviewerIntent}</p>
        </div>
      </section>

      <section className="border border-slate-300 bg-slate-50 p-5" aria-labelledby={`reference-notes-${question.id}`}>
        <label id={`reference-notes-${question.id}`} htmlFor={`study-notes-${question.id}`} className="text-sm font-semibold text-slate-950">Your answer outline</label>
        <p className="mt-1 text-xs leading-5 text-slate-600">Capture the decision, trade-off, example, and result before comparing your answer.</p>
        <textarea
          id={`study-notes-${question.id}`}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={5}
          placeholder="My decision is... The trade-off is... A relevant project example is..."
          className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-[#2f5bff] focus:ring-2 focus:ring-blue-100"
        />
      </section>

      <div className="flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-7 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm leading-6 text-slate-600">Give yourself 60–90 seconds. A strong senior answer explains why, not only what.</p>
        <button
          type="button"
          onClick={onReveal}
          aria-expanded="false"
          className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px"
        >
          Reveal answer
          <Eye size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ReferenceAnswerMode({ question, onReturn }) {
  const hasSupportingDetails = question.example
    || question.supportingDetail
    || question.projectProof
    || question.commonMistake;

  return (
    <div className="space-y-8" aria-live="polite">
      <section className="bg-blue-50 p-6 sm:p-8" aria-labelledby={`reference-answer-${question.id}`}>
        <div className="flex items-center gap-3 text-[#2146d0]">
          <Sparkles size={18} aria-hidden="true" />
          <h3 id={`reference-answer-${question.id}`} className="text-sm font-semibold">Core answer</h3>
        </div>
        <p className="mt-4 max-w-5xl text-lg font-medium leading-8 text-slate-950">{question.shortAnswer}</p>
      </section>

      {(question.technologyExamples.length > 0 || question.terms.length > 0) && (
        <div className="grid gap-8 border-y border-slate-200 py-7 lg:grid-cols-2">
          {question.technologyExamples.length > 0 && (
            <section aria-labelledby={`reference-tools-${question.id}`}>
              <h3 id={`reference-tools-${question.id}`} className="text-sm font-semibold text-slate-950">Technology examples</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {question.technologyExamples.map((technology) => (
                  <li key={technology} className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{technology}</li>
                ))}
              </ul>
            </section>
          )}
          {question.terms.length > 0 && (
            <section aria-labelledby={`reference-terms-${question.id}`}>
              <h3 id={`reference-terms-${question.id}`} className="text-sm font-semibold text-slate-950">Terms to use naturally</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {question.terms.map((term) => (
                  <li key={term} className="border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2146d0]">{term}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {hasSupportingDetails && (
        <div className="grid gap-px bg-slate-300 lg:grid-cols-2">
          {question.example && (
            <section className="bg-white p-6" aria-labelledby={`reference-example-${question.id}`}>
              <h3 id={`reference-example-${question.id}`} className="text-base font-semibold text-slate-950">Example answer</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{question.example}</p>
            </section>
          )}
          {question.supportingDetail && (
            <section className="bg-white p-6" aria-labelledby={`reference-detail-${question.id}`}>
              <h3 id={`reference-detail-${question.id}`} className="text-base font-semibold text-slate-950">When this applies</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{question.supportingDetail}</p>
            </section>
          )}
          {question.projectProof && (
            <section className="bg-slate-950 p-6 text-white" aria-labelledby={`reference-proof-${question.id}`}>
              <h3 id={`reference-proof-${question.id}`} className="text-base font-semibold">Project proof</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{question.projectProof}</p>
            </section>
          )}
          {question.commonMistake && (
            <section className="bg-slate-50 p-6" aria-labelledby={`reference-mistake-${question.id}`}>
              <h3 id={`reference-mistake-${question.id}`} className="text-base font-semibold text-slate-950">Common mistake</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{question.commonMistake}</p>
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onReturn}
        aria-expanded="true"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] active:translate-y-px"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Return to study mode
      </button>
    </div>
  );
}

function RoleCoach({ activeRoleId, onRoleChange }) {
  const activeRole = roleTracks.find((role) => role.id === activeRoleId) || roleTracks[0];

  return (
    <section className="border-y border-slate-300 bg-slate-950 text-white" aria-labelledby="role-coach-title">
      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <div className="border-b border-white/15 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <Target size={20} className="text-blue-300" aria-hidden="true" />
            <h3 id="role-coach-title" className="text-lg font-semibold">Aim your answer at the role</h3>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Choose the interview lens once. The same answer should emphasize different evidence for each senior path.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Target role">
            {roleTracks.map((role) => {
              const Icon = role.icon;
              const active = role.id === activeRole.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onRoleChange(role.id)}
                  aria-pressed={active}
                  className={`flex min-h-11 items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white ${active ? "border-blue-400 bg-blue-600 text-white" : "border-white/15 text-slate-300 hover:border-blue-300 hover:text-white"}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10" aria-live="polite">
          <span className="text-sm font-semibold text-blue-300">Coach for {activeRole.label}</span>
          <p className="mt-4 max-w-4xl text-xl font-medium leading-8 sm:text-2xl">{activeRole.focus}</p>
          <div className="mt-6 flex items-start gap-3 border-t border-white/15 pt-5 text-sm leading-6 text-slate-300">
            <BriefcaseBusiness size={17} className="mt-1 shrink-0 text-blue-300" aria-hidden="true" />
            <p><strong className="text-white">Best proof:</strong> {activeRole.proof}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BackendGlossary({ items }) {
  const [activeGroupId, setActiveGroupId] = useState(glossaryGroups[0].id);
  const activeGroup = glossaryGroups.find((group) => group.id === activeGroupId) || glossaryGroups[0];
  const visibleItems = activeGroup.terms
    .map((term) => items.find((item) => item.term === term))
    .filter(Boolean);

  return (
    <section className="border-t border-slate-300 bg-slate-950 px-5 py-16 text-white sm:px-8 lg:py-24" aria-labelledby="backend-glossary-title">
      <div className="grid gap-10 xl:grid-cols-[0.7fr_1.3fr] xl:items-start">
        <div className="xl:sticky xl:top-24">
          <div className="flex size-11 items-center justify-center bg-blue-600 text-white" aria-hidden="true"><ServerCog size={21} /></div>
          <h2 id="backend-glossary-title" className="portfolio-display mt-6 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Backend language, organized by purpose.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Refresh the vocabulary senior interviewers expect without scanning one long wall of definitions.</p>
          <div className="mt-7 grid gap-2 sm:grid-cols-2 xl:grid-cols-1" aria-label="Backend term groups">
            {glossaryGroups.map((group) => {
              const Icon = group.icon;
              const active = group.id === activeGroup.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white ${active ? "border-blue-400 bg-blue-600 text-white" : "border-white/15 text-slate-300 hover:border-blue-300 hover:text-white"}`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{group.label}</span>
                  <span className="ml-auto font-mono text-xs text-current opacity-70">{group.terms.length}</span>
                </button>
              );
            })}
          </div>
        </div>

        <dl className="grid gap-px bg-white/15 sm:grid-cols-2" aria-live="polite">
          {visibleItems.map((item) => {
            const Icon = glossaryTermIcons[item.term] || ServerCog;
            return (
            <div key={item.term} className="min-h-52 bg-slate-950 p-6 transition-colors hover:bg-[#101c33] sm:p-7">
              <dt className="flex items-center gap-3 text-lg font-semibold text-white">
                <span className="flex size-9 shrink-0 items-center justify-center border border-blue-300/30 bg-blue-400/10 text-blue-300" aria-hidden="true"><Icon size={17} /></span>
                {item.term}
              </dt>
              <dd className="mt-3 text-sm leading-6 text-slate-300">{item.definition}</dd>
              <dd className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-blue-200"><strong className="text-white">Use it when:</strong> {item.useWhen}</dd>
            </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

function RapidRecall({ items }) {
  const [revealedId, setRevealedId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(rapidRecallGroups[0].id);
  const activeGroup = rapidRecallGroups.find((group) => group.id === activeGroupId) || rapidRecallGroups[0];
  const visibleItems = activeGroup.items
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean);

  const selectGroup = (groupId) => {
    setActiveGroupId(groupId);
    setRevealedId(null);
  };

  return (
    <section className="border-t border-slate-300 bg-white px-5 py-16 sm:px-8 lg:py-24" aria-labelledby="rapid-recall-title">
      <div className="grid gap-10 xl:grid-cols-[0.65fr_1.35fr] xl:items-start">
        <div className="xl:sticky xl:top-24">
          <div className="flex size-11 items-center justify-center bg-[#2f5bff] text-white" aria-hidden="true"><Gauge size={21} /></div>
          <h2 id="rapid-recall-title" className="portfolio-display mt-6 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">Rapid recall, one domain at a time.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Give yourself two sentences before revealing the answer. Switch domains only when the current set feels familiar.</p>
          <div className="mt-7 grid gap-2 sm:grid-cols-2 xl:grid-cols-1" aria-label="Rapid review groups">
            {rapidRecallGroups.map((group) => {
              const Icon = group.icon;
              const active = group.id === activeGroup.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectGroup(group.id)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] ${active ? "border-[#2f5bff] bg-blue-50 text-[#2146d0]" : "border-slate-300 bg-white text-slate-700 hover:border-[#2f5bff] hover:text-[#2146d0]"}`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{group.label}</span>
                  <span className="ml-auto font-mono text-xs text-current opacity-70">{group.items.length}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-px bg-slate-300 sm:grid-cols-2" aria-live="polite">
          {visibleItems.map((item, index) => {
            const revealed = revealedId === item.id;
            return (
              <article key={item.id} className={`flex min-h-72 flex-col p-6 transition-colors sm:p-7 ${revealed ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950 hover:bg-white"}`}>
                <div className="flex items-center justify-between gap-4">
                  <span className={`font-mono text-xs font-semibold ${revealed ? "text-blue-300" : "text-[#2146d0]"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={`text-xs font-semibold ${revealed ? "text-slate-400" : "text-slate-500"}`}>{revealed ? "Answer" : "Recall"}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold leading-7">{item.question}</h3>
                {revealed ? (
                  <div className="mt-5 flex flex-1 flex-col">
                    <p className="text-sm leading-6 text-slate-300">{item.answer}</p>
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Key terms">
                      {item.terms.map((term) => <li key={term} className="border border-white/15 px-2.5 py-1 text-xs text-blue-200">{term}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-slate-600">Explain it in one or two sentences before revealing the key terminology.</p>
                )}
                <button
                  type="button"
                  onClick={() => setRevealedId(revealed ? null : item.id)}
                  aria-expanded={revealed}
                  className={`mt-7 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-3 ${revealed ? "border-white/20 text-white hover:border-blue-300 focus-visible:outline-white" : "border-slate-300 text-slate-950 hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-[#2f5bff]"}`}
                >
                  {revealed ? <RotateCcw size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  {revealed ? "Hide answer" : "Reveal answer"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LearningResources() {
  return (
    <section className="border-t border-slate-300 bg-slate-50 px-5 py-16 sm:px-8 lg:py-24" aria-labelledby="learning-resources-title">
      <div className="grid gap-12 xl:grid-cols-[0.7fr_1.3fr] xl:items-start">
        <div>
          <div className="flex size-11 items-center justify-center bg-[#2f5bff] text-white" aria-hidden="true"><PlayCircle size={22} /></div>
          <h2 id="learning-resources-title" className="portfolio-display mt-6 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">Watch less. Retain more.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Use videos as input, then immediately turn the idea into an interview answer and a real project example.</p>

          <ol className="mt-8 border-y border-slate-300">
            {learningLoop.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.id} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-slate-200 py-5 last:border-b-0">
                  <div className="flex size-10 items-center justify-center border border-blue-200 bg-blue-50 text-[#2146d0]" aria-hidden="true"><Icon size={18} /></div>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="text-sm font-semibold text-slate-950">{step.label}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid gap-px bg-slate-300 sm:grid-cols-2">
          {videoReferences.map((video, index) => (
            <article key={video.id} className="group flex flex-col bg-white transition-colors hover:bg-blue-50">
              <a href={video.url} target="_blank" rel="noreferrer" className="relative block aspect-video overflow-hidden bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white">
                <img src={video.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-100" />
                <span className="absolute inset-0 grid place-items-center bg-slate-950/20" aria-hidden="true">
                  <span className="grid size-12 place-items-center bg-white text-slate-950 shadow-lg"><PlayCircle size={24} /></span>
                </span>
              </a>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-semibold text-[#2146d0]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-xs font-semibold text-slate-500">{video.category}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-7 text-slate-950">{video.title}</h3>
                <p className="mt-2 text-sm font-medium text-[#2146d0]">{video.source}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{video.takeaway}</p>
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-11 items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-950 transition-colors hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
              >
                Watch reference
                <ExternalLink size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function InterviewReviewPage() {
  const sections = useMemo(() => interviewReference.navigation
    .filter((section) => reviewSectionConfig[section.id])
    .map((section, index) => ({
      ...section,
      ...reviewSectionConfig[section.id],
      order: index + 1,
    })), []);
  const questions = useMemo(() => {
    const detailedQuestions = interviewData.questions.map((question) => ({
      ...question,
      kind: "detailed",
      sectionId: detailedSectionAliases[question.sectionId] || question.sectionId,
    }));
    const seenQuestions = new Set(detailedQuestions.map((question) => question.question.trim().toLowerCase()));
    const referenceQuestions = buildReferenceQuestions().filter((question) => {
      const normalizedQuestion = question.question.trim().toLowerCase();
      if (seenQuestions.has(normalizedQuestion)) return false;
      seenQuestions.add(normalizedQuestion);
      return true;
    });

    return [...detailedQuestions, ...referenceQuestions].sort((a, b) => a.order - b.order);
  }, []);
  const glossary = useMemo(() => [...interviewData.backendGlossary].sort((a, b) => a.term.localeCompare(b.term)), []);
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [activeQuestionId, setActiveQuestionId] = useState(questions.find((question) => question.sectionId === sections[0].id).id);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [confidenceByQuestion, setConfidenceByQuestion] = useState({});
  const [notesByQuestion, setNotesByQuestion] = useState({});
  const [activeRoleId, setActiveRoleId] = useState(roleTracks[0].id);

  const sectionQuestions = questions.filter((question) => question.sectionId === activeSectionId);
  const activeQuestion = sectionQuestions.find((question) => question.id === activeQuestionId) || sectionQuestions[0];
  const activeQuestionIndex = sectionQuestions.findIndex((question) => question.id === activeQuestion?.id);
  const reviewedCount = Object.keys(confidenceByQuestion).length;
  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];
  const progress = sectionQuestions.length > 0 ? ((activeQuestionIndex + 1) / sectionQuestions.length) * 100 : 0;

  const selectSection = (sectionId) => {
    const firstQuestion = questions.find((question) => question.sectionId === sectionId);
    setActiveSectionId(sectionId);
    setActiveQuestionId(firstQuestion.id);
    setAnswerVisible(false);
  };

  const selectQuestion = (questionId) => {
    setActiveQuestionId(questionId);
    setAnswerVisible(false);
  };

  const moveQuestion = (direction) => {
    if (!sectionQuestions.length) return;
    const nextIndex = (activeQuestionIndex + direction + sectionQuestions.length) % sectionQuestions.length;
    selectQuestion(sectionQuestions[nextIndex].id);
  };

  const selectRandomQuestion = () => {
    const pool = questions.filter((question) => question.id !== activeQuestion?.id);
    const nextQuestion = pool[Math.floor(Math.random() * pool.length)];
    setActiveSectionId(nextQuestion.sectionId);
    setActiveQuestionId(nextQuestion.id);
    setAnswerVisible(false);
  };

  return (
    <ApplicationPageShell
      title={interviewData.page.title}
      description={interviewData.page.description}
      canonicalPath="/portfolio/interview-review"
    >
      <section id="review-workspace" className="scroll-mt-20 bg-slate-50 px-5 pb-16 pt-24 sm:px-8 lg:pb-24 lg:pt-28">
        <div className="w-full">
          <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2146d0]"><BookOpenCheck size={18} aria-hidden="true" /> Study mode first</span>
              <h1 className="portfolio-display mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-6xl">Senior interview study desk.</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">Choose a topic, reason through the architecture, and connect the answer to product decisions you have already made.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"><strong className="text-slate-950">{reviewedCount}</strong> of {questions.length} reviewed</div>
              <Link to="/portfolio/interview-reference" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] active:translate-y-px"><BookOpenCheck size={16} aria-hidden="true" /> Reference guide</Link>
              <button type="button" onClick={selectRandomQuestion} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff] active:translate-y-px"><Shuffle size={16} aria-hidden="true" /> Surprise me</button>
            </div>
          </div>

          <div className="mt-9 border-y border-slate-300 bg-white" aria-label="Answer framework">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-sm font-semibold text-slate-950">Use this structure when answering</span>
              <span className="font-mono text-xs text-slate-500">04 steps</span>
            </div>
            <ol className="grid md:grid-cols-2 xl:grid-cols-4">
              {interviewData.answerFramework.map((step, index) => (
                <li key={step.id} className="border-b border-slate-200 p-5 md:border-r xl:border-b-0 xl:last:border-r-0">
                  <span className="font-mono text-xs font-semibold text-[#2f5bff]">{String(index + 1).padStart(2, "0")}</span>
                  <strong className="mt-2 block text-sm text-slate-950">{step.label}</strong>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{step.description}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-9">
            <RoleCoach activeRoleId={activeRoleId} onRoleChange={setActiveRoleId} />
          </div>

          <nav className="mt-10 border-y border-slate-300 bg-white px-5 py-6" aria-label="Interview topics">
            <div className="flex items-center gap-3">
              <Layers3 size={18} className="text-[#2f5bff]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">Choose a topic</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map((section) => {
                const Icon = sectionIcons[section.icon];
                const active = section.id === activeSectionId;
                const questionCount = questions.filter((question) => question.sectionId === section.id).length;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    aria-pressed={active}
                    className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] ${active ? "border-[#2f5bff] bg-[#2f5bff] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-[#2f5bff] hover:text-[#2146d0]"}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{section.label}</span>
                    <span className="ml-auto font-mono text-xs opacity-70">{questionCount}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="mt-10">
            {activeQuestion && (
              <article className="min-w-0 border border-slate-300 bg-white">
                <div className="h-1 bg-slate-200" aria-hidden="true">
                  <div className="h-full bg-[#2f5bff] transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <div className="p-6 sm:p-8 lg:p-10">
                <header className="border-b border-slate-200 pb-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-[#2146d0]">{activeSection.label}</span>
                      <span className="text-xs text-slate-400" aria-hidden="true">/</span>
                      <span className="font-mono text-xs font-semibold text-slate-500">Question {String(activeQuestionIndex + 1).padStart(2, "0")} of {String(sectionQuestions.length).padStart(2, "0")}</span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                      {answerVisible ? <Eye size={15} aria-hidden="true" /> : <BookOpenCheck size={15} aria-hidden="true" />}
                      {answerVisible ? "Model answer" : "Study mode"}
                    </span>
                  </div>
                  <h2 className="portfolio-display mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl">{activeQuestion.question}</h2>
                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 xl:flex-row xl:items-center xl:justify-between">
                    <span className="text-sm font-semibold text-slate-700">How confident are you?</span>
                    <div className="flex flex-wrap gap-2" aria-label="Confidence rating">
                      {["Learning", "Familiar", "Confident"].map((level) => {
                        const selected = confidenceByQuestion[activeQuestion.id] === level;
                        return <button key={level} type="button" aria-pressed={selected} onClick={() => setConfidenceByQuestion((current) => ({ ...current, [activeQuestion.id]: level }))} className={`min-h-10 rounded-lg border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] ${selected ? "border-[#2f5bff] bg-[#2f5bff] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-[#2f5bff] hover:text-[#2146d0]"}`}>{level}</button>;
                      })}
                    </div>
                  </div>
                </header>
                <div className="pt-8">
                  {activeQuestion.kind === "detailed" ? (
                    answerVisible ? (
                      <AnswerMode question={activeQuestion} onReturn={() => setAnswerVisible(false)} />
                    ) : (
                      <StudyMode question={activeQuestion} glossary={glossary} note={notesByQuestion[activeQuestion.id] || ""} onNoteChange={(note) => setNotesByQuestion((current) => ({ ...current, [activeQuestion.id]: note }))} onReveal={() => setAnswerVisible(true)} />
                    )
                  ) : answerVisible ? (
                    <ReferenceAnswerMode question={activeQuestion} onReturn={() => setAnswerVisible(false)} />
                  ) : (
                    <ReferenceStudyMode question={activeQuestion} note={notesByQuestion[activeQuestion.id] || ""} onNoteChange={(note) => setNotesByQuestion((current) => ({ ...current, [activeQuestion.id]: note }))} onReveal={() => setAnswerVisible(true)} />
                  )}
                </div>
                <footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
                  <button type="button" onClick={() => moveQuestion(-1)} aria-label="Previous interview question" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]"><ArrowLeft size={16} aria-hidden="true" /> Previous</button>
                  <span className="hidden text-center text-xs font-medium text-slate-500 sm:block">One question at a time</span>
                  <button type="button" onClick={() => moveQuestion(1)} aria-label="Next interview question" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2146d0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">Next <ArrowRight size={16} aria-hidden="true" /></button>
                </footer>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
      <BackendGlossary items={glossary} />
      <RapidRecall items={interviewData.rapidReview} />
      <LearningResources />
    </ApplicationPageShell>
  );
}
