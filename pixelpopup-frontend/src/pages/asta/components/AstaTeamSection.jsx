import { ArrowRight, Github, Linkedin, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import AstaReveal from "../AstaReveal";
import teamMembers from "../data/team.json";
import AstaSectionHeading from "./AstaSectionHeading";

export default function AstaTeamSection() {
  const orderedMembers = [...teamMembers].sort((a, b) => a.order - b.order);

  return (
    <section className="asta-home-section asta-home-team" id="team" aria-labelledby="asta-team-title">
      <div className="asta-agency-container">
        <AstaReveal>
          <AstaSectionHeading
            id="asta-team-title"
            eyebrow="People at ASTA"
            title="Meet the Team"
            description="Four co-founders started ASTA in 2021. We publish individual details only when each profile is approved."
          />
        </AstaReveal>
        <div className="asta-team-grid">
          {orderedMembers.map((member, index) => (
            <AstaReveal as="article" className={`asta-team-card${member.placeholder ? " asta-team-card--placeholder" : ""}`} key={member.id} delay={index * 80}>
              <div className="asta-team-card__media">
                {member.image ? (
                  <img src={member.image} width="900" height="900" alt={`${member.name}, ${member.role}`} loading="lazy" />
                ) : (
                  <div className="asta-team-card__empty" aria-label="Portrait pending"><UserRound aria-hidden="true" /><span>Portrait pending</span></div>
                )}
                {!member.placeholder && (member.linkedinUrl || member.githubUrl) ? (
                  <div className="asta-team-card__socials" aria-label={`${member.name} profile links`}>
                    {member.linkedinUrl ? <a href={member.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} on LinkedIn`}><Linkedin aria-hidden="true" /></a> : null}
                    {member.githubUrl ? <a href={member.githubUrl} target="_blank" rel="noreferrer" aria-label={`${member.name} on GitHub`}><Github aria-hidden="true" /></a> : null}
                  </div>
                ) : null}
              </div>
              <div className="asta-team-card__body">
                <span>{member.department}</span>
                <h3>{member.name}</h3>
                <strong>{member.role}</strong>
                <p>{member.shortBio}</p>
              </div>
            </AstaReveal>
          ))}
        </div>
        <AstaReveal className="asta-team-section__link">
          <Link className="asta-agency-button" to="/asta/team">Explore our team page <ArrowRight size={17} aria-hidden="true" /></Link>
        </AstaReveal>
      </div>
    </section>
  );
}
