import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, CheckCircle2, ChevronRight, Circle, Expand, FlaskConical, Home, Lightbulb, List, Minimize2, NotebookPen, PanelLeft, PlayCircle, X } from "lucide-react";
import LearningLab from "./LearningLab";
import { ActivityTabs, ConceptDiagram, LessonCheck, MatchingActivity, ScenarioActivity } from "./LessonActivities";
import { getLessonModel, lessonLabIds } from "./lessonModels";
import { LessonContext, LessonRecall, LessonReferences, LessonWorkedExample } from "./LessonDepthContent";
import RagPipelineLab, { RagApproaches, RagImplementationNotes } from "./RagDeepDive";
import useLessonDepth from "./useLessonDepth";
import StudyText from "./StudyText";
import "./lessonDepth.css";

export const studySections = [
  { id: "understand", title: "Understand the idea", short: "Understand" },
  { id: "try", title: "See it in action", short: "Try it" },
  { id: "real-world", title: "Apply it in practice", short: "Real world" },
  { id: "check", title: "Test your understanding", short: "Check" },
  { id: "takeaways", title: "Keep the key ideas", short: "Takeaways" },
];

export function StudyDrawer({ open, onOpenChange, title, description, children, side = "left", returnFocusId }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="study-drawer-overlay" /><Dialog.Content className={`study-drawer ${side}`} onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById(returnFocusId)?.focus(); }}><div className="study-drawer-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><button type="button" className="study-icon-button" aria-label={`Close ${title.toLowerCase()}`}><X size={20} aria-hidden="true" /></button></Dialog.Close></div><Dialog.Description className="sr-only">{description}</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function NotesPanel({ value, onChange, status, expanded = false, id = "lesson-notes" }) {
  return <div className="study-notes"><label htmlFor={id} className="sr-only">Your notes for this lesson</label><textarea id={id} value={value} maxLength={4000} onChange={(event) => onChange(event.target.value)} placeholder="What clicked? What would you like to try? Write a note for your next visit…" rows={expanded ? 12 : 5} /><div className="study-notes-status"><span role="status">{status}</span><span>{value.length} / 4000</span></div></div>;
}

function SectionHeading({ index, children }) {
  return <h2 className="study-section-heading" tabIndex={-1}><span aria-hidden="true">{index}</span>{children}</h2>;
}

export default function StudyLesson({ category, lesson, moduleTitle, Icon, completed, bookmarked, onBookmark, onComplete, focusMode, onFocusMode, previous, next, onNavigate, onOpenCourse, onCategoryQuiz }) {
  const model = getLessonModel(category.id, lesson);
  const { depth, loading, error, retry } = useLessonDepth(category.id, lesson.id);
  const isRag = category.id === "ai" && lesson.id === "rag";
  const emphasisTerms = [lesson.title, ...model.nodes.map((node) => node.label)];
  const key = `${category.id}/${lesson.id}`;
  const notesKey = `mico-study-note-v1:${key}`;
  const [notes, setNotes] = useState(() => { try { return window.localStorage.getItem(notesKey) || ""; } catch { return ""; } });
  const latestNote = useRef(notes);
  const [noteStatus, setNoteStatus] = useState("Saved in this browser");
  const [notesOpen, setNotesOpen] = useState(false);
  const [active, setActive] = useState("understand");
  const [visited, setVisited] = useState(new Set(["understand"]));
  const content = useRef(null);
  const title = useRef(null);
  const hasSimulation = lessonLabIds[category.id]?.has(lesson.id);
  const sectionCount = completed ? studySections.length : visited.size;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(notesKey, notes); setNoteStatus("Saved in this browser"); }
      catch { setNoteStatus("Storage unavailable. Copy your note before leaving."); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [notes, notesKey]);
  useEffect(() => () => {
    try { window.localStorage.setItem(notesKey, latestNote.current); } catch { /* The visible save status describes unavailable storage. */ }
  }, [notesKey]);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      visible.forEach((entry) => {
        const id = entry.target.dataset.studySection;
        setVisited((previousVisited) => previousVisited.has(id) ? previousVisited : new Set([...previousVisited, id]));
      });
      setActive(visible[visible.length - 1].target.dataset.studySection);
    }, { rootMargin: "-110px 0px -52% 0px", threshold: 0 });
    content.current?.querySelectorAll("[data-study-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const goToSection = (id) => {
    const section = document.getElementById(`study-${id}`);
    setActive(id);
    setVisited((previousVisited) => new Set([...previousVisited, id]));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    section?.querySelector("h2")?.focus({ preventScroll: true });
  };
  const updateNotes = (value) => { latestNote.current = value; setNotes(value); setNoteStatus("Saving…"); };

  return <>
    <article className="study-main" ref={content} aria-labelledby="study-lesson-title">
      <div className="study-mobile-tools"><button type="button" id="study-course-trigger" onClick={onOpenCourse}><PanelLeft size={17} aria-hidden="true" />Course outline</button><button type="button" id="study-mobile-notes-trigger" onClick={() => setNotesOpen(true)}><NotebookPen size={17} aria-hidden="true" />My notes</button></div>
      <nav className="study-breadcrumbs" aria-label="Lesson breadcrumb"><a href="/portfolio/how-tos" aria-label="All how-tos"><Home size={16} aria-hidden="true" /></a><ChevronRight size={14} aria-hidden="true" /><span>{category.shortTitle}</span><ChevronRight size={14} aria-hidden="true" /><span>{moduleTitle}</span><ChevronRight size={14} aria-hidden="true" /><strong>{lesson.title}</strong></nav>
      <header className="study-lesson-header"><div className="study-lesson-title-row"><span className="study-lesson-icon"><Icon size={29} strokeWidth={1.8} aria-hidden="true" /></span><div><h1 id="study-lesson-title" ref={title} tabIndex={-1}>{lesson.title}</h1><p>{model.nodes.map((node) => node.label).join(" · ")}</p></div></div><div className="study-lesson-meta"><div><span><List size={15} aria-hidden="true" />5 sections</span><span><PlayCircle size={15} aria-hidden="true" />Interactive lesson</span></div><div><button type="button" className="study-icon-button" aria-pressed={bookmarked} aria-label={bookmarked ? "Remove lesson bookmark" : "Bookmark this lesson"} title={bookmarked ? "Remove bookmark" : "Bookmark lesson"} onClick={onBookmark}>{bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</button><button type="button" className="ai-learn-button study-focus-button" aria-pressed={focusMode} onClick={onFocusMode}>{focusMode ? <Minimize2 size={15} aria-hidden="true" /> : <Expand size={15} aria-hidden="true" />}{focusMode ? "Exit focus" : "Focus mode"}</button></div></div></header>

      <section id="study-understand" data-study-section="understand" className="study-section">
        <SectionHeading index={1}>Understand {lesson.title}</SectionHeading>
        <p className="study-explanation"><StudyText terms={emphasisTerms}>{lesson.explanation}</StudyText></p>
        <LessonContext depth={depth} loading={loading} error={error} onRetry={retry} terms={emphasisTerms} />
        <ConceptDiagram model={model} network={category.id === "hld" && lesson.id === "load-balancing"} />
        {isRag && <RagApproaches />}
        <button type="button" className="ai-learn-text-button" onClick={() => goToSection("try")}>Try the idea <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
      <section id="study-try" data-study-section="try" className="study-section">
        <SectionHeading index={2}>See it in action</SectionHeading>
        <p className="study-section-intro">{isRag ? "Choose a question, then follow the evidence through each stage. Switch to document preparation to see what happens before a question arrives." : hasSimulation ? "Change the inputs and inspect the result, or match the parts to their roles." : "Match each part of the visual model with what it does. Check your reasoning after each choice."}</p>
        <ActivityTabs hasSimulation={hasSimulation} matching={<MatchingActivity model={model} />}>
          {isRag ? <><RagPipelineLab /><details className="study-rag-original"><summary>Try the passage-selection exercise</summary><LearningLab category={category} /></details></> : <LearningLab category={category} />}
        </ActivityTabs>
        <div className="study-try-prompt"><FlaskConical size={21} aria-hidden="true" /><p><strong>Try this:</strong> {lesson.practice}</p></div>
      </section>
      <section id="study-real-world" data-study-section="real-world" className="study-section">
        <SectionHeading index={3}>Apply it in practice</SectionHeading>
        <LessonWorkedExample depth={depth} terms={emphasisTerms} />
        {isRag && <RagImplementationNotes />}
        <ScenarioActivity lesson={lesson} />
      </section>
      <section id="study-check" data-study-section="check" className="study-section">
        <SectionHeading index={4}>Test your understanding</SectionHeading>
        <LessonCheck category={category} lesson={lesson} model={model} />
        <LessonRecall depth={depth} terms={emphasisTerms} />
      </section>
      <section id="study-takeaways" data-study-section="takeaways" className="study-section"><SectionHeading index={5}>Keep the key ideas</SectionHeading><ul className="study-takeaway-list">{model.nodes.map((node) => <li key={node.label}><CheckCircle2 size={19} aria-hidden="true" /><span><strong>{node.label}.</strong> {node.detail}</span></li>)}</ul><div className="study-lesson-finish"><Lightbulb size={24} aria-hidden="true" /><div><h3>Make the idea yours</h3><p>Explain it aloud, write a note, or apply it to a project you know. Mark it completed when you are ready to move on.</p></div></div><div className="study-finish-actions"><button type="button" className="ai-learn-button primary" onClick={onComplete} aria-pressed={completed}>{completed ? <CheckCircle2 size={17} /> : <Check size={17} />}{completed ? "Completed" : "Mark as completed"}</button><button type="button" className="ai-learn-text-button" onClick={onCategoryQuiz}>Practice {category.shortTitle}<ArrowRight size={16} aria-hidden="true" /></button></div><LessonReferences references={depth?.references || category.references} /></section>
    </article>

    <aside className="study-companion" aria-label="Lesson tools"><section className="study-rail-panel study-progress-panel"><div><h2>Lesson progress</h2><span>{sectionCount} of 5 sections</span></div><progress className="ai-learn-progress" value={sectionCount} max={5} aria-label="Lesson sections visited" /><small>{completed ? "Marked completed by you" : "Progress tracks sections visited"}</small></section><section className="study-rail-panel study-toc"><h2>On this page</h2><ol>{studySections.map((section) => <li key={section.id} data-active={active === section.id}><button type="button" aria-current={active === section.id ? "step" : undefined} onClick={() => goToSection(section.id)}>{completed || visited.has(section.id) ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}<span>{section.title}</span></button></li>)}</ol></section><section className="study-rail-panel study-rail-takeaways"><h2><Lightbulb size={20} aria-hidden="true" />Key takeaways</h2><ul>{model.nodes.map((node) => <li key={node.label}><Check size={15} aria-hidden="true" /><span>{node.detail}</span></li>)}</ul></section><section className="study-rail-panel study-notes-panel"><div className="study-rail-heading"><h2><NotebookPen size={19} aria-hidden="true" />My notes</h2><button type="button" id="study-desktop-notes-trigger" className="study-icon-button" aria-label="Expand lesson notes" onClick={() => setNotesOpen(true)}><Expand size={16} aria-hidden="true" /></button></div><NotesPanel value={notes} onChange={updateNotes} status={noteStatus} /></section></aside>

    <footer className="study-bottom-bar" aria-label="Lesson navigation"><button type="button" className="study-adjacent previous" disabled={!previous} onClick={() => onNavigate(previous)}><ArrowLeft size={17} aria-hidden="true" /><span><small>Previous</small><strong>{previous?.title || "First lesson"}</strong></span></button><nav className="study-stage-nav" aria-label="Lesson sections">{studySections.map((section, index) => <button type="button" key={section.id} aria-label={`${index + 1}. ${section.title}`} aria-current={active === section.id ? "step" : undefined} onClick={() => goToSection(section.id)}>{completed || visited.has(section.id) ? <CheckCircle2 size={21} aria-hidden="true" /> : <Circle size={21} aria-hidden="true" />}<span>{index + 1}. {section.short}</span></button>)}</nav><button type="button" className="ai-learn-button primary study-complete-button" aria-pressed={completed} onClick={onComplete}><span>{completed ? "Completed" : "Mark as completed"}</span><Check size={17} aria-hidden="true" /></button><button type="button" className="study-adjacent next" disabled={!next} onClick={() => onNavigate(next)}><span><small>Next</small><strong>{next?.title || "Last lesson"}</strong></span><ArrowRight size={17} aria-hidden="true" /></button></footer>
    <StudyDrawer open={notesOpen} onOpenChange={setNotesOpen} title="My lesson notes" description={`Your browser-local notes for ${lesson.title}.`} side="right" returnFocusId={!focusMode && window.matchMedia("(min-width: 1280px)").matches ? "study-desktop-notes-trigger" : "study-mobile-notes-trigger"}><p className="study-drawer-context">{lesson.title}</p><NotesPanel id="lesson-notes-expanded" value={notes} onChange={updateNotes} status={noteStatus} expanded /></StudyDrawer>
  </>;
}
