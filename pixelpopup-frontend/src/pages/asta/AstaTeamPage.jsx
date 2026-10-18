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
  { icon: MessagesSquare, title: "Explain decisions", description: "We write down why a change is needed and discuss it with the people affected." },
  { icon: UsersRound, title: "Work together", description: "Designers and developers review the same features as the work progresses." },
  { icon: ShieldCheck, title: "Follow through", description: "We check what we release and agree on who handles follow-up work." },
  { icon: Lightbulb, title: "Ask questions", description: "If a requirement is unclear, we ask before building it." },
  { icon: CodeXml, title: "Leave readable code", description: "We use code reviews and documentation to help the next person make changes." },
  { icon: RefreshCw, title: "Use feedback", description: "We review what's working and adjust the next round of work." },
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
              <h1>Meet the people at ASTA.</h1>
              <p>We're a small development team working across frontend, backend, and design. Four co-founders started ASTA in 2021.</p>
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
            <AstaReveal className="asta-section-heading"><div><h2>Who you'll work with.</h2><p>Read about each person's role and find their profile links below.</p></div></AstaReveal>
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
            <AstaReveal className="asta-section-heading"><div><h2>Away from our desks.</h2><p>Photos from team gatherings and celebrations.</p></div></AstaReveal>
            <AstaReveal><TeamActivityCarousel /></AstaReveal>
          </div>
        </section>

        <section className="asta-section asta-principles">
          <div className="asta-container">
            <AstaReveal className="asta-section-heading"><div><h2>How we work together.</h2><p>What you can expect when working with our team.</p></div></AstaReveal>
            <div className="asta-principles__grid">
              {cultureItems.map(({ icon: Icon, title, description }, index) => <AstaReveal key={title} delay={Math.min(index * 70, 280)}><Icon aria-hidden="true" /><h3>{title}</h3><p>{description}</p></AstaReveal>)}
            </div>
          </div>
        </section>

        <section className="asta-team-cta">
          <AstaReveal className="asta-container asta-team-cta__inner">
            <div><HeartHandshake aria-hidden="true" /><h2>Have a project for the team?</h2></div>
            <div className="asta-actions"><a className="asta-button asta-button--light" href={`mailto:${contact.email}`}><Mail size={18} /> Email us</a><a className="asta-text-link asta-text-link--light" href={contact.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook <ArrowRight size={17} /></a></div>
          </AstaReveal>
        </section>
      </main>
    </AstaPage>
  );
}
