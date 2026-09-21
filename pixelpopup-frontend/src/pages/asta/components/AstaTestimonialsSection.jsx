import { Building2, Quote } from "lucide-react";
import AstaReveal from "../AstaReveal";
import testimonials from "../data/testimonials.json";
import AstaSectionHeading from "./AstaSectionHeading";

const orderedTestimonials = [...testimonials].sort((a, b) => a.order - b.order);

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ClientReferenceCard({ reference, duplicate = false }) {
  return (
    <article className="asta-testimonial-card" aria-hidden={duplicate || undefined}>
      <div className="asta-testimonial-card__head">
        <div className="asta-testimonial-card__avatar" aria-hidden="true">{getInitials(reference.name)}</div>
        <div className="asta-testimonial-card__identity">
          <strong>{reference.name}</strong>
          <span>{reference.role}</span>
        </div>
        <Quote className="asta-testimonial-card__quote" aria-hidden="true" />
      </div>
      <p className="asta-testimonial-card__copy">“{reference.quote}”</p>
      <div className="asta-testimonial-card__organization">
        <Building2 aria-hidden="true" />
        <div>
          <span>Organization</span>
          <strong>{reference.company}</strong>
        </div>
      </div>
      <footer>{reference.approvalStatus}</footer>
    </article>
  );
}

export default function AstaTestimonialsSection() {
  return (
    <section className="asta-home-section asta-home-testimonials" id="testimonials" aria-labelledby="asta-testimonials-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading
            id="asta-testimonials-title"
            inverse
            title="What clients and collaborators say."
            description="Feedback from clients and collaborators across product delivery, frontend engineering, and technical leadership."
          />
        </AstaReveal>
        <AstaReveal className="asta-testimonial-publish-note">
          <strong>{orderedTestimonials.length} named references</strong>
          <span>Published client and collaborator feedback</span>
        </AstaReveal>
      </div>
      <AstaReveal className="asta-testimonial-marquee">
        <div className="asta-testimonial-track" aria-label="ASTA client and collaborator references">
          {orderedTestimonials.map((reference) => <ClientReferenceCard key={reference.id} reference={reference} />)}
          {orderedTestimonials.map((reference) => <ClientReferenceCard key={`${reference.id}-duplicate`} reference={reference} duplicate />)}
        </div>
      </AstaReveal>
    </section>
  );
}
