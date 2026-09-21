import AstaReveal from "../AstaReveal";
import technologies from "../data/technologies.json";
import AstaSectionHeading from "./AstaSectionHeading";

const categoryOrder = ["Frontend", "Backend", "Platform", "Delivery"];

export default function AstaTechnologySection() {
  const groups = categoryOrder.map((category) => ({
    category,
    items: technologies
      .filter((technology) => technology.category === category)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <section className="asta-home-section asta-home-technology" id="technology" aria-labelledby="asta-technology-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading
            id="asta-technology-title"
            inverse
            eyebrow="Technology & Expertise"
            title="Technology Stack"
            description="We select practical tools around the product, the team maintaining it, and the business needs it must support."
          />
        </AstaReveal>
        <div className="asta-technology-groups">
          {groups.map(({ category, items }, groupIndex) => (
            <AstaReveal as="article" className="asta-technology-group" key={category} delay={groupIndex * 80}>
              <h3>{category}</h3>
              <ul>
                {items.map((technology) => (
                  <li className="asta-technology-item" key={technology.id}>
                    <img src={`/portfolio/tech/${technology.icon}`} width="38" height="38" alt="" loading="lazy" />
                    <span><strong>{technology.name}</strong><small>{technology.capability}</small></span>
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
