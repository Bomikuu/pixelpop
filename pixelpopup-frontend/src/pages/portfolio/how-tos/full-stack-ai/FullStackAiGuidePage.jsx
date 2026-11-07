import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Bot, Boxes, CheckCircle2, ChevronDown, Circle, GitBranch, ListTree, Network, PlayCircle, Search, Server, ShieldCheck, X } from "lucide-react";
import ApplicationPageShell from "../../application/ApplicationPageShell";
import { allLessons, categories, videoSource } from "./learningContent";
import { courseModules } from "./lessonModels";
import LearningQuiz from "./LearningQuiz";
import StudyLesson, { StudyDrawer } from "./StudyLesson";
import "./fullStackAi.css";
import "./studyWorkspace.css";
import "./quizExperience.css";

const icons = { Server, ListTree, Network, Boxes, Bot, GitBranch, ShieldCheck };
const courseDescriptions = {
  backend: "Build APIs that validate, persist, and recover.",
  dsa: "Choose efficient structures and reason about algorithms.",
  hld: "Design scalable systems and plan for failure.",
  lld: "Keep responsibilities clear and behavior easy to change.",
  ai: "Ground answers, connect tools, and evaluate agent behavior.",
  devops: "Ship repeatable environments and recoverable releases.",
  security: "Understand trust boundaries and enforce access.",
};
const reviewedKey = "mico-full-stack-ai-reviewed-v1";
const bookmarksKey = "mico-full-stack-ai-bookmarks-v1";
const lastLessonKey = "mico-full-stack-ai-last-lesson-v1";
const validKeys = new Set(allLessons.map((lesson) => `${lesson.categoryId}/${lesson.id}`));
const orderedLessons = categories.flatMap((category) => courseModules[category.id].flatMap(([, ids]) => ids.map((id) => allLessons.find((lesson) => lesson.categoryId === category.id && lesson.id === id)).filter(Boolean)));

function readKeys(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return { values: Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string" && validKeys.has(item)))] : [], canSave: true };
  } catch { return { values: [], canSave: false }; }
}
function readLastLesson() {
  try { const key = window.localStorage.getItem(lastLessonKey); return validKeys.has(key) ? key : "backend/rest-apis"; }
  catch { return "backend/rest-apis"; }
}

function QuizPageHeader({ onStudy }) {
  return <header className="quiz-page-header">
    <nav className="quiz-breadcrumb" aria-label="Breadcrumb"><Link to="/portfolio/how-tos">How-tos</Link><ArrowRight size={13} aria-hidden="true" /><span>Full-stack AI engineering</span></nav>
    <div className="quiz-page-heading"><div><h1>Practice quiz</h1><p>Try the ideas. Check your reasoning. Learn from each answer.</p></div><button type="button" id="study-quiz-return" className="ai-learn-button quiz-return-to-study" onClick={onStudy}><ArrowLeft size={16} aria-hidden="true" />Back to lessons</button></div>
  </header>;
}

function CourseOutline({ category, lesson, reviewed, bookmarks, onCategory, onLesson, onPractice, query, onQuery, savedOnly, onSavedOnly, canSave }) {
  const Icon = icons[category.icon];
  const search = query.trim().toLowerCase();
  const count = category.lessons.filter((item) => reviewed.has(`${category.id}/${item.id}`)).length;
  const results = allLessons.filter((item) => (!savedOnly || bookmarks.has(`${item.categoryId}/${item.id}`)) && (!search || `${item.title} ${item.explanation} ${item.categoryTitle}`.toLowerCase().includes(search)));
  return <div className="study-outline-content">
    <Link to="/portfolio/how-tos" className="study-all-courses"><ArrowLeft size={16} aria-hidden="true" />All how-tos</Link>
    <label className="study-course-select">Course<select value={category.id} onChange={(event) => onCategory(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <div className="study-course-identity"><span><Icon size={28} aria-hidden="true" /></span><div><h2>{category.title}</h2><p>{courseDescriptions[category.id]}</p></div></div>
    <div className="study-course-progress"><progress className="ai-learn-progress" value={count} max={category.lessons.length} aria-label={`${category.title} lessons completed`} /><span>{count} / {category.lessons.length} lessons completed ({Math.round(count / category.lessons.length * 100)}%)</span></div>
    <div className="study-outline-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor="study-search">Search all lessons</label><input id="study-search" type="search" value={query} placeholder="Find a lesson…" onChange={(event) => onQuery(event.target.value)} />{query && <button type="button" aria-label="Clear lesson search" onClick={() => onQuery("")}><X size={15} aria-hidden="true" /></button>}</div>
    <div className="study-outline-shortcuts"><button type="button" className="study-saved-filter" aria-pressed={savedOnly} aria-label={savedOnly ? "Show all lessons" : "Show bookmarked lessons"} onClick={() => onSavedOnly(!savedOnly)}><Bookmark size={15} aria-hidden="true" />Saved<span>{bookmarks.size}</span></button><button type="button" className="study-outline-quiz" onClick={onPractice}><PlayCircle size={15} aria-hidden="true" />Practice quiz</button></div>
    {search || savedOnly ? <div className="study-outline-results"><p role="status">{results.length} {results.length === 1 ? "lesson" : "lessons"}</p>{results.length ? <ul>{results.map((item) => <li key={`${item.categoryId}/${item.id}`}><button type="button" onClick={() => onLesson(item.categoryId, item.id)}><span><strong>{item.title}</strong><small>{item.categoryTitle}</small></span><ArrowRight size={15} aria-hidden="true" /></button></li>)}</ul> : <p>{savedOnly ? "Bookmark a lesson using the icon beside Focus mode to find it here." : "No matching lessons. Try a broader term such as database or search."}</p>}</div> : <nav className="study-module-list" aria-label={`${category.title} course outline`}>{courseModules[category.id].map(([title, ids], index) => {
      const moduleLessons = ids.map((id) => category.lessons.find((item) => item.id === id)).filter(Boolean);
      const moduleCompleted = moduleLessons.filter((item) => reviewed.has(`${category.id}/${item.id}`)).length;
      return <details key={`${category.id}-${title}`} open={ids.includes(lesson.id)}><summary><span className="study-module-number">{index + 1}</span><strong>{title}</strong><small>{moduleCompleted}/{moduleLessons.length}</small><ChevronDown size={15} aria-hidden="true" /></summary><ul>{moduleLessons.map((item) => {
        const current = lesson.id === item.id;
        const done = reviewed.has(`${category.id}/${item.id}`);
        return <li key={item.id}><button type="button" aria-current={current ? "page" : undefined} onClick={() => onLesson(category.id, item.id)}>{done ? <CheckCircle2 size={17} className="study-completed-icon" aria-label="Completed" /> : current ? <PlayCircle size={17} aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}<span>{item.title}</span>{bookmarks.has(`${category.id}/${item.id}`) && <Bookmark size={12} aria-label="Bookmarked" />}</button></li>;
      })}</ul></details>;
    })}</nav>}
    <div className="study-outline-footer"><span>{reviewed.size} / {allLessons.length} completed across all courses</span><p>{canSave ? "Progress and bookmarks stay in this browser." : "Storage unavailable. Progress lasts for this page session."}</p><a href={videoSource.href} target="_blank" rel="noopener noreferrer">Source video<ArrowUpRight size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></div>
  </div>;
}

export default function FullStackAiGuidePage() {
  const [params, setParams] = useSearchParams();
  const [lastLesson] = useState(readLastLesson);
  const [progress, setProgress] = useState(() => readKeys(reviewedKey));
  const [saved, setSaved] = useState(() => readKeys(bookmarksKey));
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [quizFocusMode, setQuizFocusMode] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [quizScope, setQuizScope] = useState("all");
  const [quizLaunch, setQuizLaunch] = useState(0);
  const courseReturnFocus = useRef("study-course-trigger");
  const [lastCategory, lastTopic] = lastLesson.split("/");
  const categoryId = params.has("category") ? params.get("category") : lastCategory;
  const category = categories.find((item) => item.id === categoryId) || categories[0];
  const topicId = params.has("topic") ? params.get("topic") : params.has("category") ? category.lessons[0].id : lastTopic;
  const lesson = category.lessons.find((item) => item.id === topicId) || category.lessons[0];
  const key = `${category.id}/${lesson.id}`;
  const mode = params.get("mode") === "quiz" ? "quiz" : "learn";
  const reviewed = new Set(progress.values);
  const bookmarks = new Set(saved.values);
  const moduleTitle = courseModules[category.id].find(([, ids]) => ids.includes(lesson.id))?.[0] || category.title;
  const lessonIndex = orderedLessons.findIndex((item) => `${item.categoryId}/${item.id}` === key);
  const previous = orderedLessons[lessonIndex - 1];
  const next = orderedLessons[lessonIndex + 1];

  useEffect(() => {
    window.scrollTo(0, 0);
    try { window.localStorage.setItem(lastLessonKey, key); } catch { /* Current lesson remains usable without storage. */ }
  }, [key, mode]);

  const chooseLesson = (nextCategory, nextTopic) => {
    courseReturnFocus.current = "study-lesson-title";
    setCourseOpen(false); setQuery(""); setSavedOnly(false);
    setParams((previousParams) => { const nextParams = new URLSearchParams(previousParams); nextParams.set("category", nextCategory); nextParams.set("topic", nextTopic); nextParams.delete("mode"); return nextParams; }, { preventScrollReset: true });
  };
  const chooseCategory = (id) => { const target = categories.find((item) => item.id === id); if (target) chooseLesson(id, target.lessons[0].id); };
  const toggleStored = (storageKey, state, setState) => {
    const values = state.values.includes(key) ? state.values.filter((item) => item !== key) : [...state.values, key];
    let canSave = true;
    try { window.localStorage.setItem(storageKey, JSON.stringify(values)); } catch { canSave = false; }
    setState({ values, canSave });
  };
  const setMode = (nextMode) => setParams((previousParams) => { const nextParams = new URLSearchParams(previousParams); if (nextMode === "quiz") nextParams.set("mode", "quiz"); else nextParams.delete("mode"); return nextParams; }, { preventScrollReset: true });
  const launchQuiz = (scope) => { setQuizScope(scope); setQuizFocusMode(false); setQuizLaunch((value) => value + 1); setMode("quiz"); };
  const openCourse = () => { courseReturnFocus.current = "study-course-trigger"; setCourseOpen(true); };
  const outlineProps = { category, lesson, reviewed, bookmarks, onCategory: chooseCategory, onLesson: chooseLesson, onPractice: () => { courseReturnFocus.current = "study-quiz-return"; setCourseOpen(false); launchQuiz("all"); }, query, onQuery: setQuery, savedOnly, onSavedOnly: setSavedOnly, canSave: progress.canSave && saved.canSave };

  return <ApplicationPageShell title={mode === "quiz" ? "Practice quiz · Full-stack AI engineering" : `${lesson.title} · Full-stack AI study guide`} description="Learn full-stack AI engineering through visual lessons, hands-on activities, self-checks, and quizzes across 140 topics." canonicalPath="/portfolio/how-tos/full-stack-ai" type="article" showFooter={false}>
    <div className="ai-learn-page study-page" data-focus={focusMode} data-quiz={mode === "quiz"} data-quiz-focus={mode === "quiz" && quizFocusMode}>
      {mode === "quiz" && <QuizPageHeader onStudy={() => setMode("learn")} />}
      <div className="study-grid"><aside className="study-course-sidebar" aria-label="Course navigation">{!courseOpen && <CourseOutline {...outlineProps} />}</aside>
        {mode === "quiz" ? <div className="study-quiz-room"><LearningQuiz key={quizLaunch} scope={quizScope} onScopeChange={setQuizScope} completedLessons={reviewed.size} focusMode={quizFocusMode} onFocusMode={setQuizFocusMode} onReview={(question) => chooseLesson(question.categoryId, question.lessonId)} /></div> : <StudyLesson key={key} category={category} lesson={lesson} moduleTitle={moduleTitle} Icon={icons[category.icon]} completed={reviewed.has(key)} bookmarked={bookmarks.has(key)} onBookmark={() => toggleStored(bookmarksKey, saved, setSaved)} onComplete={() => toggleStored(reviewedKey, progress, setProgress)} focusMode={focusMode} onFocusMode={() => setFocusMode((value) => !value)} previous={previous} next={next} onNavigate={(item) => { if (item) chooseLesson(item.categoryId, item.id); }} onOpenCourse={openCourse} onCategoryQuiz={() => launchQuiz(category.id)} />}
      </div>
      <StudyDrawer open={courseOpen} onOpenChange={setCourseOpen} title="Course outline" description="Choose a course, search all 140 lessons, or revisit a bookmark." returnFocusId={courseReturnFocus.current}>{courseOpen && <CourseOutline {...outlineProps} />}</StudyDrawer>
    </div>
  </ApplicationPageShell>;
}
