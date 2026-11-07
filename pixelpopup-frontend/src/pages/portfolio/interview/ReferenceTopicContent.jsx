import { AlertTriangle, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarClock, CheckCircle2, Database, FileText, GitBranch, Globe2, Layers3, Lightbulb, ListChecks, MessageSquare, Network, PlayCircle, Search, ServerCog, ShieldCheck, Target, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import StudyText from "../how-tos/full-stack-ai/StudyText";
import { getTechnologyDetail } from "./referenceTopics";

const flowIcons = { client: Globe2, edge: ShieldCheck, throttle: Target, bot: Target, validation: CheckCircle2, service: ServerCog, database: Database, monitoring: Network, identity: UsersRound, queue: Layers3 };
const sectionIcons = {
  idea: Lightbulb, value: Target, example: FileText, examples: Layers3,
  answer: MessageSquare, use: MessageSquare, intent: Search, recognize: Search,
  terms: BookOpen, sources: BookOpen, evidence: CheckCircle2, proof: CheckCircle2,
  mistake: AlertTriangle, avoid: AlertTriangle, rule: ShieldCheck, controls: ShieldCheck,
  structure: GitBranch, path: GitBranch, framing: GitBranch, decision: GitBranch,
  steps: ListChecks, checks: ListChecks, exercise: Target, choose: Target,
  signals: Search, situation: Globe2, cadence: CalendarClock, video: PlayCircle, reason: Lightbulb,
};

export function referenceHref(topicId, technology) {
  const params = new URLSearchParams({ topic: topicId });
  if (technology) params.set("technology", technology);
  return `/portfolio/interview-reference?${params.toString()}`;
}

function SecurityFlow({ flow, terms }) {
  return <figure className="reference-flow" data-tone={flow.tone}>
    <figcaption><ShieldCheck size={18} aria-hidden="true" /><strong>{flow.badge}</strong></figcaption>
    <ol>{flow.nodes.map((node, index) => {
      const Icon = flowIcons[node.icon] || ServerCog;
      return <li key={node.id}><div className="reference-flow-node"><Icon size={21} aria-hidden="true" /><div><h3>{node.title}</h3><p><StudyText terms={terms}>{node.detail}</StudyText></p></div></div>{index < flow.nodes.length - 1 && <ArrowDown className="reference-flow-arrow" size={19} aria-hidden="true" />}</li>;
    })}</ol>
    <p className="reference-caption"><StudyText terms={terms}>{flow.note}</StudyText></p>
  </figure>;
}

function ContentSection({ section, terms, topicId }) {
  const Icon = sectionIcons[section.id] || (section.flow ? Network : FileText);
  return <section id={`reference-${section.id}`} data-reference-section={section.id} className={`reference-reading-section${section.lead ? " reference-lead-section" : ""}${section.caution ? " reference-caution-section" : ""}`} aria-labelledby={`reference-${section.id}-title`}>
    <h2 id={`reference-${section.id}-title`} className="reference-section-heading" tabIndex={-1}><span className="reference-section-icon" aria-hidden="true"><Icon size={18} /></span><span>{section.title}</span></h2>
    {section.body && <p><StudyText terms={terms}>{section.body}</StudyText></p>}
    {section.items && <ul className="reference-points">{section.items.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" /><span>{["terms", "examples"].includes(section.id) ? <Link to={referenceHref(topicId, item)}><StudyText terms={terms}>{item}</StudyText><ArrowRight size={14} aria-hidden="true" /><span className="sr-only">: read full reference</span></Link> : <StudyText terms={terms}>{item}</StudyText>}</span></li>)}</ul>}
    {section.sequence && <ol className="reference-answer-sequence" aria-label={section.title}>{section.sequence.map((item, index) => <li key={`${index}-${item}`}><strong>{item}</strong>{index < section.sequence.length - 1 && <ArrowRight size={17} aria-hidden="true" />}</li>)}</ol>}
    {section.steps && <ol className="reference-steps">{section.steps.map((step, index) => <li key={step.title}><span aria-hidden="true">{index + 1}</span><div><h3>{step.title}</h3><p><StudyText terms={terms}>{step.detail}</StudyText></p></div></li>)}</ol>}
    {section.flow && <SecurityFlow flow={section.flow} terms={terms} />}
    {section.mappings && <div className="reference-comparisons">{section.mappings.map((mapping) => <article key={mapping.threat}><h3>{mapping.threat}</h3><dl><div><dt>{section.headers[1]}</dt><dd><StudyText terms={terms}>{mapping.controls}</StudyText></dd></div><div><dt>{section.headers[2]}</dt><dd><StudyText terms={terms}>{mapping.explanation}</StudyText></dd></div></dl></article>)}</div>}
    {section.video && <><div className="reference-video"><iframe src={`https://www.youtube-nocookie.com/embed/${section.video.youtubeId}`} title={`${section.video.title} by ${section.video.source}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><p className="reference-caption">{section.video.source} · {section.video.module}</p></>}
    {section.sources && <ul className="reference-sources">{section.sources.map((source) => <li key={source}><a href={source} target="_blank" rel="noopener noreferrer">{source.replace(/^https?:\/\//, "").split("/")[0]}<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
  </section>;
}

export function TechnologyContext({ items, topicId, terms }) {
  if (!items.length) return null;
  return <section id="reference-technologies" data-reference-section="technologies" className="reference-reading-section" aria-labelledby="reference-technologies-title"><h2 id="reference-technologies-title" className="reference-section-heading" tabIndex={-1}><span className="reference-section-icon" aria-hidden="true"><Layers3 size={18} /></span><span>Technology context</span></h2><p className="reference-section-help">The role of each tool is shown here. Follow its name for a focused reference with usage guidance and cautions.</p><ul className="reference-technologies">{items.map((item) => {
    const detail = getTechnologyDetail(item);
    return <li key={item}><Link to={referenceHref(topicId, item)}><FileText size={17} aria-hidden="true" /><strong>{item}</strong><ArrowRight size={15} aria-hidden="true" /><span className="sr-only">: read full reference</span></Link><p><StudyText terms={terms}>{detail.definition}</StudyText></p></li>;
  })}</ul></section>;
}

export default function ReferenceTopicContent({ topic, titleRef, origin, technology, children }) {
  const terms = [topic.title, ...topic.terms, ...topic.technologies];
  return <article className="reference-main" aria-labelledby="reference-topic-title">
    <h1 id="reference-topic-title" className="sr-only" tabIndex={-1} ref={titleRef}>{topic.title}</h1>
    {technology && <Link to={referenceHref(origin.id)} className="reference-return"><ArrowRight size={15} aria-hidden="true" />Back to {origin.title}</Link>}
    <div className="reference-topic-header">{topic.attribution && <p className="reference-topic-description">{topic.attribution}</p>}{topic.subgroupDescription && <p className="reference-topic-description">{topic.subgroupDescription}</p>}{topic.prompt && <p className="reference-topic-prompt"><strong>The interview question</strong><span><StudyText terms={terms}>{topic.prompt}</StudyText></span></p>}{children}</div>
    <div className="reference-reading-content">{topic.sections.map((section) => <ContentSection key={section.id} section={section} terms={terms} topicId={origin.id} />)}<TechnologyContext items={topic.technologies} topicId={origin.id} terms={terms} /></div>
  </article>;
}
