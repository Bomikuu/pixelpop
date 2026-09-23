import { createElement } from "react";
import { ArrowRight, Code2, Compass, Rocket, Search } from "lucide-react";
import AstaReveal from "./AstaReveal";

const processSteps = [
  ["Discovery", "Understand your goals and constraints.", Search],
  ["Planning", "Shape the product flow and priorities.", Compass],
  ["Development", "Build with a focused, collaborative team.", Code2],
  ["Launch", "Release confidently and iterate.", Rocket],
];

export function AgencyProcess() {
  return (
    <section className="border-t border-[#28527c] bg-[#102238] text-white" id="process" aria-label="Our delivery process">
      <ol className="mx-auto grid w-[calc(100%-48px)] max-w-[1454px] grid-cols-1 gap-8 py-10 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4 lg:gap-8 lg:pb-24 lg:pt-12">
        {processSteps.map(([title, description, Icon], index) => (
          <AstaReveal as="li" className="relative flex min-w-0 items-center gap-5 lg:pr-8" key={title} delay={index * 85}>
            <span className="grid size-[70px] shrink-0 place-items-center rounded-full border border-[#3272b4] bg-[#143254] text-[#6ab4ff]">
              {createElement(Icon, { size: 30, strokeWidth: 1.7, "aria-hidden": true })}
            </span>
            <div className="min-w-0">
              <h2 className="!font-[var(--asta-font-body)] text-base font-semibold leading-tight text-white">{title}</h2>
              <p className="mt-1 max-w-[12rem] text-sm leading-[1.45] text-[#bcc9db]">{description}</p>
            </div>
            {index < processSteps.length - 1 ? <ArrowRight className="absolute right-0 hidden size-6 text-[#98b2d1] lg:block" size={24} strokeWidth={1.1} aria-hidden="true" /> : null}
          </AstaReveal>
        ))}
      </ol>
    </section>
  );
}
