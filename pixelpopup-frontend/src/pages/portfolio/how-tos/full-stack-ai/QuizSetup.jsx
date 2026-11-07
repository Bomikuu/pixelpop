import { ArrowRight, BookOpen, Bot, Boxes, CheckCircle2, ChevronDown, Circle, GitBranch, ListTree, Network, RotateCcw, Server, ShieldCheck, Shuffle } from "lucide-react";
import { allLessons, categories } from "./learningContent";
import { quizQuestions } from "./quizQuestions";
import { isIdentification, matchesFormat } from "./quizAnswers";
import QuizQuestionVisual, { getQuestionContext } from "./QuizQuestionVisual";
import "./quizSetup.css";

const icons = { Server, ListTree, Network, Boxes, Bot, GitBranch, ShieldCheck };
const mixedCount = categories.reduce((count, category) => count + Math.min(2, quizQuestions.filter((question) => question.categoryId === category.id).length), 0);

function questionTitle(question) {
  return allLessons.find((lesson) => lesson.categoryId === question.categoryId && lesson.id === question.lessonId)?.title || question.lessonId;
}

function TopicCard({ category, selected, answers, onSelect, format }) {
  const pool = quizQuestions.filter((question) => matchesFormat(question, format) && (!category || question.categoryId === category.id));
  const practiced = pool.filter((question) => typeof answers[question.id] === "boolean").length;
  const correct = pool.filter((question) => answers[question.id] === true).length;
  const Icon = category ? icons[category.icon] : Shuffle;
  const title = category?.title || "Mixed practice";

  return <label className="quiz-topic-card" data-selected={selected}>
    <input type="radio" name="quiz-topic" value={category?.id || "all"} checked={selected} onChange={() => onSelect(category?.id || "all")} />
    <span className="quiz-topic-card-content">
      <span className="quiz-topic-card-top"><span className="quiz-topic-icon"><Icon size={23} aria-hidden="true" /></span><span>{category ? `${pool.length} questions` : `${mixedCount} questions · all categories`}</span>{selected ? <CheckCircle2 size={21} aria-hidden="true" /> : <Circle size={21} aria-hidden="true" />}</span>
      <strong>{title}</strong>
      <span className="quiz-topic-description">{category ? [...new Set(pool.map(questionTitle))].join(" · ") : format === "mixed" ? "One multiple-choice and one identification question per category." : "Two questions per category. Find the ideas that need another pass."}</span>
      <span className="quiz-topic-progress-text">{practiced ? `${practiced} / ${pool.length} practiced · ${correct} correct on last attempt` : "Not practiced yet"}</span>
      <span className="quiz-topic-segments" aria-hidden="true">{pool.map((question) => <span key={question.id} data-result={answers[question.id] === true ? "correct" : answers[question.id] === false ? "incorrect" : "new"} />)}</span>
    </span>
  </label>;
}

export default function QuizSetup({ scope, onScopeChange, format, onFormatChange, onStart, progress, completedLessons, headingRef, panelRef }) {
  const selectedCategory = categories.find((category) => category.id === scope);
  const pool = quizQuestions.filter((question) => matchesFormat(question, format) && (!selectedCategory || question.categoryId === scope));
  const practiced = Object.keys(progress.answers).length;
  const correct = Object.values(progress.answers).filter(Boolean).length;
  const missed = quizQuestions.filter((question) => progress.answers[question.id] === false);
  const selectedPracticed = pool.filter((question) => typeof progress.answers[question.id] === "boolean").length;
  const preview = pool[0];
  const previewContext = getQuestionContext(preview);

  return <div className="quiz-practice-setup">
    <section className="quiz-practice-overview" aria-labelledby="quiz-overall-progress-title" ref={panelRef}>
      <div className="quiz-overview-heading"><div><h2 id="quiz-overall-progress-title" tabIndex={-1} ref={headingRef}>Your overall progress</h2><p>{practiced ? "Pick your next topic or revisit a question you missed." : "Start with a topic you know, or try a mixed round to find your starting point."}</p></div><button type="button" className="ai-learn-button" disabled={!missed.length} onClick={() => onStart(missed)}><RotateCcw size={16} aria-hidden="true" />Retry missed ({missed.length})</button></div>
      <dl className="quiz-practice-stats"><div><dt>Questions practiced</dt><dd>{practiced}<span> / {quizQuestions.length}</span></dd></div><div><dt>Correct on latest attempt</dt><dd>{practiced ? `${Math.round(correct / practiced * 100)}%` : <span className="quiz-stat-empty">Not yet</span>}</dd></div><div><dt>Questions to revisit</dt><dd>{missed.length}</dd></div><div><dt>Lessons completed</dt><dd>{completedLessons}<span> / {allLessons.length}</span></dd></div></dl>
      <progress className="ai-learn-progress quiz-overall-progress" value={practiced} max={quizQuestions.length} aria-label={`${practiced} of ${quizQuestions.length} unique questions practiced`} />
      <p className="quiz-progress-storage-note">{progress.canSave ? "Quiz progress is saved in this browser. Each question counts once; correctness uses your latest checked answer." : "Browser storage is unavailable. Quiz progress will last for this page session."}</p>
    </section>

    <div className="quiz-picker-layout">
      <section className="quiz-topic-picker" aria-labelledby="quiz-topic-picker-title"><div className="quiz-topic-picker-heading"><h2 id="quiz-topic-picker-title">What would you like to practice?</h2><p>Select a question format and a topic to see your round.</p></div>
        <fieldset className="quiz-format-options" aria-describedby="quiz-format-help"><legend>Question format</legend><div>{[["mixed", "Mixed"], ["multiple-choice", "Multiple choice"], ["identification", "Identification"]].map(([value, label]) => <label key={value} data-selected={format === value}><input type="radio" name="quiz-format" value={value} checked={format === value} onChange={() => onFormatChange(value)} />{label}</label>)}</div><p id="quiz-format-help">{format === "multiple-choice" ? "Choose one answer from the options." : format === "identification" ? "Type the term or an accepted abbreviation. Answers are not case-sensitive." : "Practice choosing an answer and recalling a term without choices. Typed answers are not case-sensitive."}</p></fieldset>
        <fieldset className="quiz-topic-options"><legend className="sr-only">Choose one quiz topic</legend><div className="quiz-topic-grid"><TopicCard selected={!selectedCategory} answers={progress.answers} onSelect={onScopeChange} format={format} />{categories.map((category) => <TopicCard key={category.id} category={category} selected={category.id === scope} answers={progress.answers} onSelect={onScopeChange} format={format} />)}</div></fieldset></section>

      <aside className="quiz-round-preview" aria-labelledby="quiz-round-preview-title">
        <div className="quiz-round-preview-heading"><span className="quiz-topic-icon">{selectedCategory ? <BookOpen size={23} aria-hidden="true" /> : <Shuffle size={23} aria-hidden="true" />}</span><div><h2 id="quiz-round-preview-title">{selectedCategory?.shortTitle || "Mixed practice"}</h2><p>{selectedCategory ? `${pool.length} questions · shuffled order` : `${mixedCount} questions · 2 per category`}</p></div></div>
        <div className="quiz-round-start"><span className="quiz-round-mobile-selection"><strong>{selectedCategory?.shortTitle || "Mixed practice"}</strong><span>{selectedCategory ? pool.length : mixedCount} questions</span></span><button type="button" className="ai-learn-button primary" onClick={() => onStart()}>Start round<ArrowRight size={17} aria-hidden="true" /></button><span className="quiz-round-note">Instant feedback · optional timer above</span></div>
        <div className="quiz-round-coverage"><span>{selectedPracticed ? `${selectedPracticed} / ${pool.length} questions practiced in this ${selectedCategory ? "topic" : "question bank"}` : "A fresh set of ideas to try"}</span><progress className="ai-learn-progress" value={selectedPracticed} max={pool.length} aria-label="Selected topic practice coverage" /></div>
        <h3>{selectedCategory ? "In this round" : "Your round draws from"}</h3>
        <ul className="quiz-round-topics">{selectedCategory ? pool.map((question) => <li key={question.id}>{progress.answers[question.id] === true ? <CheckCircle2 size={17} className="quiz-practiced-correct" aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}<span>{questionTitle(question)}<small className="quiz-round-question-type">{isIdentification(question) ? "Identification" : "Multiple choice"}</small></span><small>{progress.answers[question.id] === true ? "Correct" : progress.answers[question.id] === false ? "Revisit" : "New"}</small></li>) : categories.map((category) => <li key={category.id}><span>{category.title}</span><small>2 questions</small></li>)}</ul>
        <details className="quiz-round-sample" key={`${scope}-${format}`}><summary>Try a question preview<ChevronDown size={16} aria-hidden="true" /></summary><div><p>{preview.prompt}</p>{!isIdentification(preview) && <QuizQuestionVisual question={preview} model={previewContext.model} />}<span>{isIdentification(preview) ? "You will type the term without answer choices." : "Explore the diagram."} Your score starts when you begin a round.</span></div></details>
      </aside>
    </div>
  </div>;
}
