import { createElement } from "react";
import { ArrowRight, Code2, Compass, Rocket, Search } from "lucide-react";
import AstaReveal from "./AstaReveal";

const processSteps = [
  ["Discovery", "Understand the people, process, and constraints behind the work.", Search],
  ["Planning", "Shape the product flow, technical boundaries, and delivery priorities.", Compass],
  ["Development", "Build a responsive, maintainable product with clear team feedback.", Code2],
  ["Launch", "Validate critical paths, release confidently, and improve from feedback.", Rocket],
];

export function AgencyProcess() {
  return (
    <section className="asta-agency-process" id="process" aria-label="Our delivery process">
      <ol className="asta-agency-container asta-agency-process__list">
        {processSteps.map(([title, description, Icon], index) => (
          <AstaReveal as="li" className="asta-agency-process__step" key={title} delay={index * 85}>
            <span className="asta-agency-process__icon">{createElement(Icon, { "aria-hidden": true })}</span>
            <div><h2>{title}</h2><p>{description}</p></div>
            {index < processSteps.length - 1 ? <ArrowRight className="asta-agency-process__arrow" aria-hidden="true" /> : null}
          </AstaReveal>
        ))}
      </ol>
    </section>
  );
}
