import { useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import ApplicationPageShell from "../../application/ApplicationPageShell";
import { glossary, services, videoSource } from "./guideContent";
import { ServiceLogo, SourceLink } from "./GuideUi";
import ServiceExplorer from "./ServiceExplorer";
import RequestWalkthrough from "./RequestWalkthrough";
import "./awsInfrastructure.css";

export default function AwsInfrastructureGuidePage() {
  const [selectedId, setSelectedId] = useState("ec2");
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  return <ApplicationPageShell title="AWS infrastructure, explained" description="Understand 13 AWS services through plain-language examples, illustrated categories, interactive request walkthroughs, and short knowledge checks." canonicalPath="/portfolio/how-tos/aws-infrastructure" type="article">
    <article className="aws-guide">
      <header className="aws-guide-header"><div className="aws-container">
        <Link className="aws-back-link" to="/portfolio/how-tos"><ArrowLeft size={16} aria-hidden="true" />All how-tos</Link>
        <div className="aws-introduction"><div><img className="aws-wordmark" src="/portfolio/tech/aws.svg" alt="AWS" width="60" height="36" decoding="async" /><h1>AWS infrastructure,<br />explained.</h1><p className="aws-guide-lead">An app needs a place to run, a place to keep data, and a way to reach people. Start there.</p><p>Explore the 13 services from the video by the jobs they do. Use a small online shop to see how the pieces fit.</p><div className="aws-header-actions"><a className="aws-button primary" href="#aws-explorer">Explore the services<ArrowRight size={17} aria-hidden="true" /></a><button type="button" className="aws-button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" />Print guide</button></div><div className="aws-guide-meta"><span><BookOpen size={16} aria-hidden="true" />Beginner guide</span><span>7 jobs · 13 services</span><SourceLink href={videoSource.href}>Watch the source video</SourceLink></div></div>
        <figure className="aws-workshop-figure"><img src="/portfolio/assets/how-tos/aws-infrastructure/cloud-village-pixel-v2.webp" alt="A pixel-art infrastructure village with a shop counter, computer workbench, records cabinet, file shelves, task trays, monitoring screen, and locked key cabinet." width="768" height="512" decoding="async" fetchPriority="high" /><figcaption>Think of infrastructure as a workshop: different tools handle different jobs. The illustration is a metaphor; the diagrams below show service relationships.</figcaption></figure></div>
      </div></header>
      <div className="aws-container aws-guide-body">
        <nav className="aws-page-links" aria-label="Guide sections"><a href="#aws-explorer">Explore services</a><a href="#aws-request">Follow a request</a><a href="#aws-reference">Quick reference</a><a href="#aws-glossary">Plain-language glossary</a></nav>
        <ServiceExplorer selectedId={selectedId} onSelect={setSelectedId} />
        <RequestWalkthrough />
        <section id="aws-reference" className="aws-section aws-reference" aria-labelledby="aws-reference-title"><div className="aws-section-heading"><h2 id="aws-reference-title">The services at a glance.</h2><p>Use the job as your memory cue. Select a service to return to its explanation.</p></div><ul>{services.map((service) => <li key={service.id}><a href="#aws-explorer" onClick={() => setSelectedId(service.id)}><ServiceLogo id={service.id} size={28} /><strong>{service.name}</strong><span>{service.job}</span><ArrowRight size={17} aria-hidden="true" /></a></li>)}</ul>
          <div className="aws-print-reference">{services.map((service) => <section key={service.id}><h3><ServiceLogo id={service.id} size={28} />{service.name}: {service.job}</h3><p>{service.meaning}</p><p><strong>Example:</strong> {service.example}</p><p><strong>Keep in mind:</strong> {service.caution}</p><p className="aws-print-url">{service.docs}</p></section>)}</div>
        </section>
        <section id="aws-glossary" className="aws-section aws-glossary" aria-labelledby="aws-glossary-title"><div className="aws-section-heading"><h2 id="aws-glossary-title">Translate the unfamiliar words.</h2><p>No need to memorize every abbreviation before you start.</p></div><dl>{glossary.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></section>
        <section id="aws-sources" className="aws-section aws-source-note" aria-labelledby="aws-source-title"><h2 id="aws-source-title">Where this guide comes from</h2><p>The starting list comes from a {videoSource.duration} video shared by {videoSource.sharedBy}. The explanations expand its service names, captions, and diagrams into practical examples, with links to AWS documentation.</p><p>The shop, walkthroughs, and questions are teaching examples added for this guide. They are not a claim that the video deploys this architecture. AWS services have different configuration, availability, security, and cost considerations; this is a conceptual introduction.</p><p>Service symbols come from the <SourceLink href="https://aws.amazon.com/architecture/icons/">official AWS Architecture Icons</SourceLink>. The generated workshop illustrations explain concepts through a shop analogy; they are not deployment diagrams.</p><div className="aws-source-actions"><SourceLink href={videoSource.href}>Source video shared by {videoSource.sharedBy}</SourceLink><span>Sources checked {videoSource.checkedOn}</span></div><details><summary>A few details the short video simplifies</summary><ul><li>DNS tells a client where to connect; it is separate from the HTTP request path.</li><li>IAM controls AWS resource access. Customer sign-in is an additional application concern.</li><li>EC2 need not run all day, Lambda still uses managed servers, and secret rotation needs configuration.</li><li>Recording data and publishing a message require a reliable coordination strategy. See <SourceLink href="https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html">AWS’s transactional outbox explanation</SourceLink>.</li></ul></details><div className="aws-service-sources">{services.map((service) => <SourceLink key={service.id} href={service.docs}>{service.short} documentation</SourceLink>)}</div></section>
      </div>
    </article>
  </ApplicationPageShell>;
}
