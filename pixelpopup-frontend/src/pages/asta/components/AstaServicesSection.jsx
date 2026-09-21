import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import AstaReveal from "../AstaReveal";
import { getServiceHref, serviceCatalog } from "../data/serviceCatalog";
import AstaSectionHeading from "./AstaSectionHeading";
import AstaServiceIcon from "./AstaServiceIcon";

export default function AstaServicesSection() {
  return (
    <section className="asta-home-section asta-home-services" id="services" aria-labelledby="asta-services-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading
            id="asta-services-title"
            title="What We Offer"
            description="ASTA builds software around each client's workflow, operating reality, and business requirements, not a preset package."
          />
        </AstaReveal>
        <div className="asta-service-grid">
          {serviceCatalog.map((service, index) => {
            return (
              <AstaReveal as="article" className={`asta-service-card ${service.featured ? "ring-1 ring-inset ring-[#1570ef]" : ""}`} key={service.id} delay={Math.min(index * 70, 280)}>
                <span className="asta-service-card__icon"><AstaServiceIcon name={service.icon} aria-hidden="true" /></span>
                {service.featured ? <span className={`mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] ${index === 0 ? "text-[#8fc4ff]" : "text-[#1570ef]"}`}>Featured capability</span> : null}
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                {service.comingSoon ? (
                  <span className="asta-service-card__action text-[#607489]">Detailed scope coming later</span>
                ) : (
                  <Link className="asta-service-card__action" to={getServiceHref(service)}>
                    Explore service <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </AstaReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
