import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CodeXml,
  Facebook,
  Github,
  HeartHandshake,
  Lightbulb,
  Linkedin,
  Mail,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AstaPage } from "./AstaChrome";
import AstaInteractiveHeroScene from "./components/AstaInteractiveHeroScene";
import AstaReveal from "./AstaReveal";
import useAstaPageMeta from "./useAstaPageMeta";
import { contact } from "./astaData";
import activities from "./data/activities.json";
import teamMembers from "./data/team.json";
import "./asta.css";

const cultureItems = [
  { icon: MessagesSquare, title: "Communicate with context", description: "We share the reason behind decisions so clients and teammates can move with clarity." },
  { icon: UsersRound, title: "Work as one team", description: "Design, frontend, backend, and leadership stay connected from planning through release." },
  { icon: ShieldCheck, title: "Own the outcome", description: "We follow through on the details that make software dependable after it ships." },
  { icon: Lightbulb, title: "Stay curious", description: "We ask practical questions, explore better options, and keep learning from the work." },
  { icon: CodeXml, title: "Build for maintainability", description: "Clear interfaces and thoughtful code make the next change easier for everyone." },
  { icon: RefreshCw, title: "Improve together", description: "Feedback is part of delivery, not an afterthought, and every iteration should sharpen the product." },
];

function TeamActivityCarousel() {
  const slides = [...activities].sort((a, b) => a.order - b.order);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const visibleDotCount = Math.min(5, slides.length);
  const visibleDotStart = Math.min(
    Math.max(activeIndex - Math.floor(visibleDotCount / 2), 0),
    Math.max(slides.length - visibleDotCount, 0),
  );
  const visibleDotSlides = slides.slice(visibleDotStart, visibleDotStart + visibleDotCount);
  const showPrevious = () => setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % slides.length);

  return (
    <div className="asta-team-carousel" aria-roledescription="carousel" aria-label="ASTA team activities">
      <div className="asta-team-carousel__viewport">
        <div className="asta-team-carousel__track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide, index) => (
            <figure className="asta-team-carousel__slide" key={slide.id} aria-hidden={index !== activeIndex}>
              <img src={slide.image} alt={slide.alt} loading={index === 0 ? "eager" : "lazy"} />
            </figure>
          ))}
        </div>
        <div className="asta-team-carousel__caption" aria-live="polite">
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <div><strong>{activeSlide.title}</strong><p>{activeSlide.description}</p></div>
        </div>
      </div>
      <div className="asta-team-carousel__controls">
        <div className="asta-team-carousel__dots" aria-label="Choose a nearby team activity">
          {visibleDotSlides.map((slide, offset) => {
            const index = visibleDotStart + offset;
            return (
              <button
                type="button"
                key={slide.id}
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            );
          })}
        </div>
        <div>
          <button type="button" onClick={showPrevious} aria-label="Previous team activity"><ArrowLeft size={19} /></button>
          <button type="button" onClick={showNext} aria-label="Next team activity"><ArrowRight size={19} /></button>
        </div>
      </div>
    </div>
  );
}

export default function AstaTeamPage() {
  useAstaPageMeta({
    title: "Our Team | ASTA Softwares",
    description: "Meet the engineering and product team behind ASTA Softwares, established in 2021.",
    canonical: "/asta/team",
  });

  return (
    <AstaPage>
      <main id="main-content">
        <section className="asta-team-hero">
          <AstaInteractiveHeroScene variant="team" className="asta-team-hero__scene" />
          <div className="asta-container asta-team-hero__inner">
            <AstaReveal className="asta-team-hero__copy">
              <Link className="asta-back-link" to="/asta"><ArrowLeft size={17} /> Back to ASTA</Link>
              <h1>People who turn business needs into dependable software.</h1>
              <p>A compact team across frontend, backend, design, and technical leadership—working together from first conversation to release.</p>
            </AstaReveal>
            <div className="asta-team-hero__facts" aria-label="ASTA team overview">
              <p><span>Established</span><strong>2021</strong></p>
              <p><span>Team profiles</span><strong>{teamMembers.length}</strong></p>
              <p><span>Disciplines</span><strong>Design + Engineering</strong></p>
            </div>
          </div>
        </section>

        <section className="asta-section asta-founders">
          <div className="asta-container">
            <AstaReveal className="asta-section-heading"><div><h2>Meet the team behind ASTA.</h2><p>Engineers and product thinkers bringing complementary strengths to every build.</p></div></AstaReveal>
            <div className="asta-founder-grid">
              {[...teamMembers].sort((a, b) => a.order - b.order).map((member, index) => (
                <AstaReveal as="article" className="asta-founder" key={member.id} delay={index * 65}>
                  {member.image ? <div className="asta-founder__portrait"><img src={member.image} width="900" height="900" alt={`${member.name}, ${member.role}`} /></div> : <div className="asta-founder__placeholder" aria-hidden="true"><span>0{index + 1}</span></div>}
                  <div className="asta-founder__identity"><div><h3>{member.name}</h3><strong>{member.role}</strong></div><span>{member.department}</span></div>
                  <p>{member.shortBio}</p>
                  <ul aria-label={`${member.name}'s areas of focus`}>{member.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                  <div className="asta-founder__links">
                    {member.linkedinUrl && <a href={member.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} on LinkedIn`}><Linkedin size={17} /></a>}
                    {member.githubUrl && <a href={member.githubUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} on GitHub`}><Github size={17} /></a>}
                    {member.email && <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}><Mail size={17} /></a>}
                  </div>
                </AstaReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="asta-section asta-people">
          <div className="asta-container">
            <AstaReveal className="asta-section-heading"><div><h2>Good work is built by people who enjoy working together.</h2><p>Beyond delivery schedules, we make room for the relationships and shared moments that strengthen the team.</p></div></AstaReveal>
            <AstaReveal><TeamActivityCarousel /></AstaReveal>
          </div>
        </section>

        <section className="asta-section asta-principles">
          <div className="asta-container">
            <AstaReveal className="asta-section-heading"><div><h2>The culture behind how we build.</h2><p>Our values are practical: they shape how we communicate, make decisions, and take responsibility for the work.</p></div></AstaReveal>
            <div className="asta-principles__grid">
              {cultureItems.map(({ icon: Icon, title, description }, index) => <AstaReveal key={title} delay={Math.min(index * 70, 280)}><Icon aria-hidden="true" /><h3>{title}</h3><p>{description}</p></AstaReveal>)}
            </div>
          </div>
        </section>

        <section className="asta-team-cta">
          <AstaReveal className="asta-container asta-team-cta__inner">
            <div><HeartHandshake aria-hidden="true" /><h2>Bring us the problem. Meet the team that can help shape the product.</h2></div>
            <div className="asta-actions"><a className="asta-button asta-button--light" href={`mailto:${contact.email}`}><Mail size={18} /> Email us</a><a className="asta-text-link asta-text-link--light" href={contact.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook <ArrowRight size={17} /></a></div>
          </AstaReveal>
        </section>
      </main>
    </AstaPage>
  );
}
