import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clipboard,
  Code2,
  Copy,
  FileCheck2,
  Focus,
  Gauge,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Terminal,
  WandSparkles,
  X,
} from "lucide-react";
import ApplicationPageShell from "../application/ApplicationPageShell";
import {
  AGENT_MD_TEMPLATE,
  PROMPT_FIELDS,
  PROMPT_SCENARIOS,
  SKILL_GUIDE,
} from "./aiPromptGuideData";

const INITIAL_FORM = Object.fromEntries(PROMPT_FIELDS.map(({ id }) => [id, ""]));

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function CopyButton({ value, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-[#211746] bg-white px-4 text-sm font-black text-[#211746] transition hover:-translate-y-0.5 hover:bg-[#ffcf4a] hover:shadow-[3px_3px_0_#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]",
        className,
      )}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {copied ? "Copied" : label}
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ""}</span>
    </button>
  );
}

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="grid gap-5 border-b-2 border-[#211746] pb-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.58fr)] lg:items-end">
      <div>
        <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d81b60]">
          <Icon size={16} aria-hidden="true" /> {eyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.035em] text-[#211746] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </div>
      <p className="max-w-2xl text-base font-semibold leading-7 text-[#51466c]">{description}</p>
    </div>
  );
}

export default function AiPromptGuidePage() {
  const [activeScenario, setActiveScenario] = useState(PROMPT_SCENARIOS[0].id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [permissions, setPermissions] = useState({ terminal: false, tests: false, build: false });
  const [activeSkill, setActiveSkill] = useState(SKILL_GUIDE[0].id);

  const scenario = PROMPT_SCENARIOS.find(({ id }) => id === activeScenario) || PROMPT_SCENARIOS[0];
  const skill = SKILL_GUIDE.find(({ id }) => id === activeSkill) || SKILL_GUIDE[0];

  const generatedPrompt = useMemo(() => {
    const checks = [
      permissions.terminal
        ? "Run only the terminal commands needed to inspect the named implementation."
        : "Do not run terminal commands.",
      permissions.tests
        ? "Run only the smallest targeted test for the changed behavior."
        : "Do not run tests, linting, type checks, or browser automation.",
      permissions.build ? "Run the relevant build once." : "Do not run a build.",
    ];

    return `Task: ${form.objective || "[state one exact outcome]"}

Scope:
- Edit only: ${form.scope || "[exact file or route]"}
- Ask before modifying another file.

Source of truth:
${form.source || "[state what supplied data is authoritative and where extra context may be checked]"}

Preserve:
${form.preserve || "[list behavior, routes, handlers, copy, and data contracts that must remain unchanged]"}

Definition of done:
${form.acceptance || "[list observable acceptance criteria]"}

Verification and command budget:
- ${checks.join("\n- ")}
- Do not fix unrelated findings.
- Report the files changed and stop when this task is complete.`;
  }, [form, permissions]);

  const completedFields = PROMPT_FIELDS.filter(({ id }) => form[id].trim()).length;

  return (
    <ApplicationPageShell
      title="Efficient AI Prompting"
      description="An interactive field guide to writing specific, bounded AI coding prompts that conserve tokens and avoid unnecessary work."
      canonicalPath="/portfolio/ai-prompt-guide"
    >
      <div className="overflow-x-hidden bg-[#f7f4ff] text-[#211746]">
        <section className="relative isolate border-b-4 border-[#211746] bg-[#5d4bff] text-white">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1480px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,0.72fr)] lg:items-center lg:px-12 lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 border-2 border-white bg-[#211746] px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.18em] shadow-[5px_5px_0_#ffcf4a]">
                <Focus size={15} aria-hidden="true" /> Prompt with intent
              </p>
              <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.6rem] xl:leading-[0.94]">
                Specific prompts save work, tokens, and time.
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-[#eeebff]">
                Tell the agent exactly what to change, where the truth lives, what must remain untouched,
                and which commands are allowed. Precision is not micromanagement. It is a shared contract.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#prompt-lab"
                  className="inline-flex min-h-12 items-center gap-2 border-2 border-[#211746] bg-[#ffcf4a] px-5 font-black text-[#211746] shadow-[5px_5px_0_#211746] transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
                >
                  Build a prompt <ArrowRight size={17} aria-hidden="true" />
                </a>
                <a
                  href="#agent-template"
                  className="inline-flex min-h-12 items-center gap-2 border-2 border-white bg-[#211746] px-5 font-black text-white transition hover:bg-white hover:text-[#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]"
                >
                  Copy AGENTS.md <Clipboard size={17} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="border-2 border-[#211746] bg-[#fff8de] p-6 text-[#211746] shadow-[10px_10px_0_#211746] sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b-2 border-[#d9d0a9] pb-5">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d81b60]">The bounded prompt</p>
                  <p className="mt-2 text-xl font-black">Less guessing. Less wandering.</p>
                </div>
                <span className="grid size-12 place-items-center border-2 border-[#211746] bg-[#74e5ff] shadow-[3px_3px_0_#211746]">
                  <Gauge size={26} aria-hidden="true" />
                </span>
              </div>
              <ol className="mt-2 divide-y-2 divide-[#d9d0a9]">
                {[
                  ["01", "Outcome", "One concrete change"],
                  ["02", "Scope", "Exact file or route"],
                  ["03", "Truth", "Named source data"],
                  ["04", "Protection", "Behavior to preserve"],
                  ["05", "Verification", "Explicit command budget"],
                ].map(([number, label, detail]) => (
                  <li key={number} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4">
                    <span className="font-mono text-xs font-black text-[#4b61ff]">{number}</span>
                    <span className="font-bold">{label}</span>
                    <span className="text-right text-sm text-[#6b5f4b]">{detail}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-l-4 border-[#ff4f8b] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#51466c]">
                Default rule: no terminal, build, tests, or broad search unless the prompt explicitly allows it.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <SectionHeading
            eyebrow="Before and after"
            title="Replace vague direction with bounded instructions."
            description="Choose a common task. The useful version removes expensive ambiguity before the agent opens a file."
            icon={MousePointerClick}
          />

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Prompt examples">
            {PROMPT_SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeScenario === item.id}
                onClick={() => setActiveScenario(item.id)}
                className={cx(
                  "min-h-11 border-2 border-[#211746] px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#74e5ff]",
                  activeScenario === item.id
                    ? "bg-[#211746] text-white shadow-[4px_4px_0_#ff4f8b]"
                    : "bg-white text-[#51466c] hover:bg-[#ffcf4a] hover:text-[#211746]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid border-2 border-[#211746] bg-white shadow-[7px_7px_0_#211746] lg:grid-cols-2">
            <article className="border-b-2 border-[#211746] p-6 lg:border-b-0 lg:border-r-2 lg:p-8">
              <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#d81b60]">
                <X size={15} aria-hidden="true" /> Vague prompt
              </p>
              <p className="mt-5 text-2xl font-black tracking-[-0.025em] text-[#211746]">{scenario.vague}</p>
              <p className="mt-5 text-sm leading-6 text-[#6b5f89]">
                This asks the agent to discover the goal, scope, files, protected behavior, and test budget on its own.
              </p>
            </article>
            <article className="bg-[#f2f0ff] p-6 lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#4b61ff]">
                  <Check size={15} aria-hidden="true" /> Specific prompt
                </p>
                <CopyButton value={scenario.specific} label="Copy example" />
              </div>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-xs leading-6 text-[#30265b] sm:text-sm">
                {scenario.specific}
              </pre>
            </article>
          </div>
          <p className="border-x-2 border-b-2 border-[#211746] bg-[#211746] px-6 py-4 text-sm font-semibold text-white">
            Lesson: <span className="text-[#74e5ff]">{scenario.lesson}</span>
          </p>
        </section>

        <section id="prompt-lab" className="scroll-mt-20 border-y-4 border-[#211746] bg-[#fff8de]">
          <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <SectionHeading
              eyebrow="Interactive prompt lab"
              title="Build the contract before the agent starts."
              description="Fill only what matters. The generated prompt makes scope and command permissions explicit, with all expensive actions disabled by default."
              icon={WandSparkles}
            />

            <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(22rem,0.82fr)_minmax(30rem,1.18fr)]">
              <div className="space-y-5">
                {PROMPT_FIELDS.map((field) => (
                  <label key={field.id} className="block">
                    <span className="text-sm font-black text-[#211746]">{field.label}</span>
                    <textarea
                      value={form[field.id]}
                      onChange={(event) => setForm((current) => ({ ...current, [field.id]: event.target.value }))}
                      placeholder={field.placeholder}
                      rows={field.id === "scope" ? 2 : 3}
                      className="mt-2 w-full resize-y border-2 border-[#211746] bg-white px-4 py-3 text-sm leading-6 text-[#211746] outline-none transition placeholder:text-[#8a80a1] focus:bg-[#f7f4ff] focus:ring-4 focus:ring-[#74e5ff]"
                    />
                    <span className="mt-1.5 block text-xs leading-5 text-[#6b5f89]">{field.hint}</span>
                  </label>
                ))}

                <fieldset className="border-2 border-[#211746] bg-white p-4 shadow-[4px_4px_0_#ffcf4a]">
                  <legend className="bg-white px-2 text-sm font-black text-[#211746]">Explicit command permissions</legend>
                  <div className="mt-2 grid gap-3">
                    {[
                      ["terminal", "Allow narrow terminal inspection"],
                      ["tests", "Allow one targeted test"],
                      ["build", "Allow one build"],
                    ].map(([id, label]) => (
                      <label key={id} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#51466c]">
                        <input
                          type="checkbox"
                          checked={permissions[id]}
                          onChange={(event) => setPermissions((current) => ({ ...current, [id]: event.target.checked }))}
                          className="size-4 accent-[#4b61ff]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="self-start border-2 border-[#211746] bg-[#211746] text-white shadow-[8px_8px_0_#ff4f8b] xl:sticky xl:top-24">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 px-5 py-4">
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#74e5ff]">Generated prompt</p>
                    <p className="mt-1 text-sm text-[#d9d3ed]">{completedFields} of {PROMPT_FIELDS.length} context fields completed</p>
                  </div>
                  <CopyButton value={generatedPrompt} label="Copy prompt" />
                </div>
                <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-[#eeebff] sm:p-7 sm:text-sm">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading
            eyebrow="Skill routing"
            title="Load expertise only when the task needs it."
            description="Skills improve specialized work, but overlapping skills also add instructions and context. Pick the smallest one that changes the quality of the answer."
            icon={Sparkles}
          />

          <div className="mt-10 grid border-2 border-[#211746] bg-white shadow-[7px_7px_0_#211746] lg:grid-cols-[20rem_minmax(0,1fr)]">
            <div className="border-b-2 border-[#211746] lg:border-b-0 lg:border-r-2">
              {SKILL_GUIDE.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSkill(item.id)}
                  className={cx(
                    "flex min-h-16 w-full items-center justify-between gap-4 border-b-2 border-[#d7d0e7] px-5 text-left text-sm font-black transition last:border-b-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#74e5ff]",
                    activeSkill === item.id
                      ? "bg-[#211746] text-white"
                      : "bg-white text-[#51466c] hover:bg-[#ffcf4a] hover:text-[#211746]",
                  )}
                >
                  <span>{item.name}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>

            <article className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#d81b60]">{skill.category}</p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#211746]">{skill.name}</h3>
                </div>
                <span className="grid size-12 place-items-center border-2 border-[#211746] bg-[#74e5ff] shadow-[3px_3px_0_#211746]">
                  <Code2 size={27} aria-hidden="true" />
                </span>
              </div>
              <dl className="mt-8 grid gap-7">
                <div>
                  <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#74668f]">Use when</dt>
                  <dd className="mt-2 text-base leading-7 text-[#51466c]">{skill.useWhen}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#74668f]">Prompt example</dt>
                  <dd className="mt-2 flex flex-col gap-3 border-l-4 border-[#4b61ff] bg-[#f2f0ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <code className="text-sm leading-6 text-[#30265b]">{skill.invocation}</code>
                    <CopyButton value={skill.invocation} label="Copy" className="shrink-0" />
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#74668f]">Token discipline</dt>
                  <dd className="mt-2 text-sm leading-6 text-[#51466c]">{skill.caution}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <section id="agent-template" className="scroll-mt-20 border-y-4 border-[#211746] bg-[#211746] text-white">
          <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(32rem,1.1fr)] lg:items-start">
              <div>
                <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74e5ff]">
                  <FileCheck2 size={16} aria-hidden="true" /> Copyable project policy
                </p>
                <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Give every task the same efficient defaults.</h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-[#d9d3ed]">
                  Put this in your repository as <code className="text-[#74e5ff]">AGENTS.md</code>. It keeps the agent focused when an individual prompt does not repeat every boundary.
                </p>
                <div className="mt-8 grid gap-3 text-sm text-[#d9d3ed]">
                  {[
                    [ShieldCheck, "Supplied prompt data stays authoritative"],
                    [Terminal, "Terminal, builds, and tests stay opt-in"],
                    [Focus, "Named files stay the edit boundary"],
                    [FileCheck2, "Completion reports stay short and verifiable"],
                  ].map(([Icon, text]) => (
                    <div key={text} className="flex items-center gap-3 border-b border-white/15 py-3">
                      <Icon size={18} className="text-[#74e5ff]" aria-hidden="true" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-white bg-[#17112f] shadow-[8px_8px_0_#ff4f8b]">
                <div className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-4">
                  <div className="font-mono text-xs font-black uppercase tracking-[0.15em] text-[#74e5ff]">AGENTS.md</div>
                  <CopyButton value={AGENT_MD_TEMPLATE} label="Copy file" />
                </div>
                <pre className="max-h-[760px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-[#eeebff] sm:p-7">
                  {AGENT_MD_TEMPLATE}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-4 border-[#211746] bg-[#74e5ff]">
          <div className="mx-auto grid max-w-[1480px] gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#453b63]">The rule to remember</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#211746] sm:text-4xl">
                Be specific about the outcome. Be strict about the scope.
              </h2>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#51466c]">
                A good prompt spends words once so the agent does not spend tokens guessing many times.
              </p>
            </div>
            <a
              href="#prompt-lab"
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-[#211746] bg-[#ffcf4a] px-5 font-black text-[#211746] shadow-[5px_5px_0_#211746] transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#211746] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              Build another prompt <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>
    </ApplicationPageShell>
  );
}
