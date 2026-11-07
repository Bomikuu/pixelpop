import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowLeft, ArrowRight, BookOpenCheck, ChevronRight, Expand, List, Minimize2, PanelLeft, Search, X } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import ReferenceTopicContent, { referenceHref } from "./ReferenceTopicContent";
import { referenceGroups, referenceSections, referenceTopics, technologyTopic, topicById } from "./referenceTopics";
import "./interviewReference.css";

function ReferenceOutline({ origin, technology, query, onQuery, onChoose, onNavigate }) {
  const fieldId = useId();
  const group = referenceGroups.find((item) => item.id === origin.groupId);
  const groupTopics = referenceTopics.filter((item) => item.groupId === group.id);
  const search = query.trim().toLowerCase();
  const results = search ? referenceTopics.filter((item) => `${item.title} ${item.sectionTitle} ${item.subgroup || ""} ${item.terms.join(" ")} ${item.technologies.join(" ")}`.toLowerCase().includes(search)) : [];
  const sectionTopics = groupTopics.filter((item) => item.sectionId === origin.sectionId);

  return <div className="reference-outline">
    <Link className="reference-outline-back" to="/portfolio/how-tos"><ArrowLeft size={15} aria-hidden="true" />All learning guides</Link>
    <div className="reference-outline-identity"><span><BookOpenCheck size={24} aria-hidden="true" /></span><div><h2>Interview reference</h2><p>One idea, a clear answer, a real example.</p></div></div>
    <label className="reference-outline-select" htmlFor={`${fieldId}-group`}>Group<select id={`${fieldId}-group`} value={group.id} onChange={(event) => onChoose(referenceTopics.find((item) => item.groupId === event.target.value))}>{referenceGroups.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label className="reference-outline-select" htmlFor={`${fieldId}-section`}>Section<select id={`${fieldId}-section`} value={origin.sectionId} onChange={(event) => onChoose(referenceTopics.find((item) => item.sectionId === event.target.value))}>{group.sections.map((sectionId) => <option key={sectionId} value={sectionId}>{referenceSections.find((item) => item.id === sectionId).label}</option>)}</select></label>
    <div className="reference-outline-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor={`${fieldId}-search`}>Search all interview topics</label><input id={`${fieldId}-search`} type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search all topics" />{query && <button type="button" aria-label="Clear topic search" onClick={() => onQuery("")}><X size={15} aria-hidden="true" /></button>}</div>
    <p className="reference-outline-context">{search ? `${results.length} matching topics across all groups` : `${origin.sectionTitle} · ${sectionTopics.length} topics`}</p>
    <nav aria-label={search ? "Matching interview topics" : `${origin.sectionTitle} topics`} className="reference-topic-list">
      {search && !results.length ? <p className="reference-empty" role="status">No matching topics. Try a term such as caching, state or delivery.</p> : <ul>{(search ? results : sectionTopics).map((item, index, items) => <li key={item.id}>
        {!search && item.subgroup && item.subgroup !== items[index - 1]?.subgroup && <h3 className="reference-outline-subgroup">{item.subgroup}</h3>}
        <Link to={referenceHref(item.id)} aria-current={!technology && item.id === origin.id ? "page" : undefined} onClick={onNavigate}><span className="reference-topic-number" aria-hidden="true">{index + 1}</span><span className="reference-topic-label">{item.title}{search && <small>{item.sectionTitle}</small>}</span>{!technology && item.id === origin.id && <ChevronRight size={15} aria-hidden="true" />}</Link>
      </li>)}</ul>}
    </nav>
    {technology && <nav className="reference-related-outline" aria-label="Related technology references"><h3>Technology context</h3><ul>{[...new Set([...origin.technologies, technology])].map((item) => <li key={item}><Link to={referenceHref(origin.id, item)} aria-current={technology === item ? "page" : undefined} onClick={onNavigate}>{item}</Link></li>)}</ul></nav>}
    <div className="reference-outline-footer"><p>{group.description}</p><Link to="/portfolio/interview-review">Practice your answers<ArrowRight size={15} aria-hidden="true" /></Link></div>
  </div>;
}

function TopicContents({ sections, active, onSection }) {
  return <nav className="reference-contents" aria-label="On this topic"><h2>On this topic</h2><ol>{sections.map((section) => <li key={section.id}><button type="button" aria-current={active === section.id ? "location" : undefined} onClick={() => onSection(section.id)}>{section.title}</button></li>)}</ol></nav>;
}

export default function InterviewReferencePage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const heading = useRef(null);
  const reading = useRef(null);
  // Existing section-hash links continue to open that section's first topic.
  const legacySection = location.hash.slice(1);
  const origin = topicById.get(params.get("topic")) || referenceTopics.find((item) => item.sectionId === legacySection) || referenceTopics[0];
  const technology = params.get("technology")?.trim() || "";
  const topic = useMemo(() => technology ? technologyTopic(technology, origin) : origin, [technology, origin]);
  const sections = useMemo(() => [...topic.sections, ...(topic.technologies.length ? [{ id: "technologies", title: "Technology context" }] : [])], [topic]);
  const [activeSection, setActiveSection] = useState(sections[0]?.id);
  const position = referenceTopics.findIndex((item) => item.id === origin.id);
  const sectionTopics = referenceTopics.filter((item) => item.sectionId === origin.sectionId);
  const sectionPosition = sectionTopics.findIndex((item) => item.id === origin.id);
  const previous = referenceTopics[position - 1];
  const next = referenceTopics[position + 1];

  useEffect(() => {
    setActiveSection(sections[0]?.id);
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length) setActiveSection(visible[0].target.dataset.referenceSection);
    }, { rootMargin: "-100px 0px -55% 0px", threshold: 0 });
    reading.current?.querySelectorAll("[data-reference-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [topic.id, sections]);

  const choose = (item) => {
    if (!item) return;
    setQuery("");
    setOutlineOpen(false);
    setParams({ topic: item.id }, { preventScrollReset: true });
  };
  const goToSection = (id) => {
    const section = document.getElementById(`reference-${id}`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    section?.querySelector("h2")?.focus({ preventScroll: true });
    setActiveSection(id);
  };
  const outlineProps = { origin, technology, query, onQuery: setQuery, onChoose: choose, onNavigate: () => { setOutlineOpen(false); setQuery(""); } };

  return <ApplicationPageShell title={`${topic.title} · Interview reference`} description="A focused interview handbook with clear explanations, project examples and technology context, one topic at a time." canonicalPath="/portfolio/interview-reference" showFooter={false}>
    <Dialog.Root open={outlineOpen} onOpenChange={setOutlineOpen}>
      <div className="reference-workspace" data-focus={focusMode}>
        <div className="reference-grid">
          <aside className="reference-sidebar" aria-label="Interview topic navigation"><ReferenceOutline {...outlineProps} /></aside>
          <div className="reference-reading" ref={reading}>
            <div className="reference-reading-tools"><Dialog.Trigger asChild><button type="button" className="reference-button reference-topic-trigger"><PanelLeft size={16} aria-hidden="true" />Topics</button></Dialog.Trigger><span className="reference-reading-mode"><BookOpenCheck size={15} aria-hidden="true" />Explanations are always visible</span><button type="button" className="reference-button reference-focus" aria-pressed={focusMode} onClick={() => setFocusMode((value) => !value)}>{focusMode ? <Minimize2 size={15} aria-hidden="true" /> : <Expand size={15} aria-hidden="true" />}{focusMode ? "Exit focus" : "Focus mode"}</button></div>
            <ReferenceTopicContent key={topic.id} topic={topic} origin={origin} technology={technology} titleRef={heading}><nav className="reference-mobile-contents" aria-label="Topic sections">{sections.map((section) => <button key={section.id} type="button" aria-current={activeSection === section.id ? "location" : undefined} onClick={() => goToSection(section.id)}><List size={14} aria-hidden="true" />{section.title}</button>)}</nav></ReferenceTopicContent>
          </div>
          <aside className="reference-companion" aria-label="Topic reading tools"><TopicContents sections={sections} active={activeSection} onSection={goToSection} /><div className="reference-practice"><h2>Make the answer yours</h2><p>Explain the main idea aloud, name a trade-off, and connect it to a project you know.</p><Link to="/portfolio/interview-review">Practice answers<ArrowRight size={15} aria-hidden="true" /></Link></div></aside>
        </div>
        <footer className="reference-footer" aria-label="Reference topic navigation"><button type="button" className="reference-adjacent" disabled={!previous} onClick={() => choose(previous)}><ArrowLeft size={18} aria-hidden="true" /><span><small>Previous topic</small><strong>{previous?.title || "First topic"}</strong></span></button><div className="reference-footer-position">{technology ? <Link to={referenceHref(origin.id)}>Back to your topic</Link> : <><span>{sectionPosition + 1} / {sectionTopics.length}</span><small>Topics in this section</small></>}</div><button type="button" className="reference-adjacent next" disabled={!next} onClick={() => choose(next)}><span><small>Next topic</small><strong>{next?.title || "Last topic"}</strong></span><ArrowRight size={18} aria-hidden="true" /></button></footer>
      </div>
      <Dialog.Portal><Dialog.Overlay className="reference-drawer-overlay" /><Dialog.Content className="reference-drawer"><div className="reference-drawer-heading"><Dialog.Title>Browse interview topics</Dialog.Title><Dialog.Close asChild><button type="button" className="reference-button" aria-label="Close topic navigation"><X size={18} aria-hidden="true" /></button></Dialog.Close></div><Dialog.Description className="sr-only">Choose a group and section, or search all interview topics.</Dialog.Description><ReferenceOutline {...outlineProps} /></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </ApplicationPageShell>;
}
