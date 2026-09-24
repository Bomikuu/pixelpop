import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Boxes,
  Check,
  CircleHelp,
  Code2,
  Gauge,
  Handshake,
  Layers3,
  Lightbulb,
  Rocket,
  RotateCcw,
  Search,
  TrendingUp,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import Reveal from "../components/Reveal";
import { matcherQuestions } from "./workWithMeData";

const questionIcons = {
  scope: Layers3,
  stage: Gauge,
  help: Wrench,
  "working-style": Handshake,
};

const optionIcons = {
  focused: Code2,
  platform: Boxes,
  review: Search,
  idea: Lightbulb,
  shipping: Rocket,
  scaling: TrendingUp,
  leadership: Gauge,
  delivery: Blocks,
  frontend: Code2,
  individual: UserRound,
  team: UsersRound,
  unsure: CircleHelp,
};

export default function ProjectMatcher({ onChoose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [complete, setComplete] = useState(false);

  const question = matcherQuestions[step];
  const selected = answers[question?.id];
  const QuestionIcon = questionIcons[question?.id] || CircleHelp;
  const recommendation = useMemo(() => {
    const totals = Object.values(answers).reduce(
      (result, option) => ({ mico: result.mico + option.mico, asta: result.asta + option.asta }),
      { mico: 0, asta: 0 },
    );
    return totals.asta > totals.mico ? "asta" : "mico";
  }, [answers]);

  const choose = (option) => {
    setAnswers((current) => ({ ...current, [question.id]: option }));
  };

  const next = () => {
    if (!selected) return;
    if (step === matcherQuestions.length - 1) setComplete(true);
    else setStep((current) => current + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
    setComplete(false);
  };

  if (complete) {
    const isAsta = recommendation === "asta";
    const result = isAsta
      ? {
        title: "Your scope points to ASTA.",
        description: "The work appears to benefit from parallel frontend, backend, and delivery ownership under one technical direction.",
        projectType: "Build with ASTA team",
        image: "/portfolio/assets/asta-logo.png",
        imageAlt: "ASTA Softwares logo",
        visualLabel: "Coordinated team delivery",
      }
      : {
        title: "Your scope points to working with Mico.",
        description: "The work appears to benefit most from direct senior frontend judgment, hands-on delivery, and technical leadership.",
        projectType: "Hire Mico - embedded leadership",
        image: "/portfolio/assets/mico-ang-pixel-portrait.webp",
        imageAlt: "Pixel portrait of Mico Ang",
        visualLabel: "Direct senior ownership",
      };

    return (
      <div aria-live="polite" className="relative min-h-[34rem] overflow-hidden bg-[#07152e] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_44%,rgba(47,111,255,0.34),transparent_38%)]" aria-hidden="true" />
        <div className="relative grid min-h-[34rem] lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-300 text-[#07152e]" aria-hidden="true"><Check size={23} strokeWidth={2.5} /></span>
            <h3 className="portfolio-display mt-8 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              {result.title}
            </h3>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/70">
              {result.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#project-inquiry"
                onClick={() => onChoose(result.projectType)}
                className="group inline-flex min-h-12 items-center gap-4 rounded-md bg-[#2f6fff] px-6 py-3.5 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#4f8cff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Use this recommendation <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/25 px-5 py-3 font-semibold text-white transition hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <RotateCcw size={16} aria-hidden="true" /> Start again
              </button>
            </div>
          </Reveal>

          <Reveal delay={1} className="min-h-[24rem] lg:min-h-full">
            <figure className="relative flex h-full min-h-[24rem] items-end justify-center overflow-hidden border-t border-blue-100/15 bg-[#10295a] lg:min-h-[34rem] lg:border-l lg:border-t-0">
              <div className="pointer-events-none absolute inset-8 rounded-full border border-blue-200/20" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-20 rounded-full border border-blue-200/15" aria-hidden="true" />
              <img
                src={result.image}
                alt={result.imageAlt}
                width={isAsta ? 1024 : 1536}
                height={1024}
                className={isAsta ? "relative z-[1] mb-20 size-52 object-cover shadow-[0_28px_70px_-30px_rgba(0,0,0,0.65)] sm:size-60" : "relative z-[1] h-[92%] w-full object-contain object-bottom"}
              />
              <figcaption className="absolute inset-x-0 bottom-0 z-[2] border-t border-white/15 bg-[#07152e]/90 px-6 py-4 text-center text-sm font-semibold text-blue-100">
                {result.visualLabel}
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[34rem] border border-slate-200 bg-white p-7 sm:p-10 lg:p-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2f5bff]" aria-hidden="true">
            <QuestionIcon size={22} />
          </span>
          <p className="text-sm font-semibold text-slate-500">Question {step + 1} of {matcherQuestions.length}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {matcherQuestions.map((item, index) => <span key={item.id} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${index <= step ? "bg-[#2f5bff]" : "bg-slate-200"}`} />)}
        </div>
      </div>

      <fieldset className="mt-10">
        <legend className="portfolio-display max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">{question.question}</legend>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {question.options.map((option) => {
            const active = selected?.value === option.value;
            const OptionIcon = optionIcons[option.value] || CircleHelp;
            return (
              <label key={option.value} className={`group relative flex min-h-44 cursor-pointer flex-col border p-5 transition duration-200 hover:-translate-y-1 hover:border-[#2f5bff] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2f5bff] ${active ? "border-[#2f5bff] bg-blue-50" : "border-slate-200 bg-white"}`}>
                <input type="radio" name={question.id} value={option.value} checked={active} onChange={() => choose(option)} className="sr-only" />
                <span className={`grid size-11 place-items-center rounded-xl transition duration-200 ${active ? "bg-[#2f5bff] text-white" : "bg-blue-50 text-[#456282] group-hover:text-[#2f5bff]"}`} aria-hidden="true">
                  <OptionIcon size={21} />
                </span>
                <span className="mt-7 pr-7 text-base font-semibold leading-6 text-slate-900">{option.label}</span>
                <span className={`absolute right-5 top-5 grid size-6 place-items-center rounded-full border transition ${active ? "border-[#2f5bff] bg-[#2f5bff] text-white" : "border-slate-300 text-transparent"}`} aria-hidden="true">
                  <Check size={14} strokeWidth={2.5} />
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
        <button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] disabled:cursor-not-allowed disabled:opacity-30">
          <ArrowLeft size={17} aria-hidden="true" /> Back
        </button>
        <button type="button" disabled={!selected} onClick={next} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#2f5bff] px-5 py-3 font-semibold text-white transition hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] disabled:cursor-not-allowed disabled:opacity-40">
          {step === matcherQuestions.length - 1 ? "Reveal recommendation" : "Next question"} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
