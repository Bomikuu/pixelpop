import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Circle, Layers, Lightbulb, RotateCcw, Trophy, X, XCircle } from "lucide-react";
import { categories } from "./learningContent";
import { quizQuestions } from "./quizQuestions";
import QuizQuestionVisual, { getQuestionContext } from "./QuizQuestionVisual";
import { QuizProgressRing, ScoreCelebration } from "./QuizScore";
import QuizSessionTools from "./QuizSessionTools";
import QuizSetup from "./QuizSetup";
import useQuizProgress from "./useQuizProgress";
import { answerText, hasAnswer, isCorrectAnswer, isIdentification, matchesFormat } from "./quizAnswers";

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function HintPanel({ hint, inline = false }) {
  return <details className={`quiz-side-panel quiz-hint ${inline ? "quiz-inline-help" : ""}`}><summary><Lightbulb size={20} aria-hidden="true" /><strong>Need a hint?</strong><ChevronDown size={16} aria-hidden="true" /></summary><p>{hint}</p></details>;
}

function ConceptsPanel({ model, inline = false }) {
  const items = <ul>{model.nodes.map((node) => <li key={node.label}><details><summary><Check size={15} aria-hidden="true" /><span>{node.label}</span><ChevronDown size={14} aria-hidden="true" /></summary><p>{node.detail}</p></details></li>)}</ul>;
  if (inline) return <details className="quiz-side-panel quiz-concepts quiz-inline-help"><summary className="quiz-mobile-concepts-toggle"><Layers size={20} aria-hidden="true" /><strong>Key concepts</strong><ChevronDown size={16} aria-hidden="true" /></summary>{items}</details>;
  return <section className="quiz-side-panel quiz-concepts" aria-label="Related key concepts"><h3><Layers size={20} aria-hidden="true" />Key concepts</h3>{items}</section>;
}

export default function LearningQuiz({ scope, onScopeChange, onReview, focusMode, onFocusMode, completedLessons }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [phase, setPhase] = useState("setup");
  const [roundKind, setRoundKind] = useState("standard");
  const [reviewFilter, setReviewFilter] = useState("missed");
  const [roundId, setRoundId] = useState(0);
  const [format, setFormat] = useState("mixed");
  const progress = useQuizProgress();
  const heading = useRef(null);
  const panel = useRef(null);
  const current = questions[index];
  const currentResponse = current ? responses[current.id] : undefined;
  const checked = Boolean(currentResponse?.submitted);
  const context = current ? getQuestionContext(current) : null;
  const answered = questions.filter((question) => responses[question.id]?.submitted).length;
  const correct = questions.filter((question) => responses[question.id]?.submitted && isCorrectAnswer(question, responses[question.id].choice)).length;
  const incorrect = answered - correct;
  const remaining = questions.length - answered;
  const missed = questions.filter((question) => !responses[question.id]?.submitted || !isCorrectAnswer(question, responses[question.id].choice));
  const percentage = questions.length ? Math.round(correct / questions.length * 100) : 0;
  const selectedCategory = categories.find((category) => category.id === scope);

  useEffect(() => {
    if (phase === "setup" && roundId === 0) return;
    heading.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: "start" });
  }, [current?.id, phase, roundId]);

  const start = (items) => {
    const available = quizQuestions.filter((question) => matchesFormat(question, format));
    const pool = items || (selectedCategory
      ? available.filter((question) => question.categoryId === selectedCategory.id)
      : categories.flatMap((category) => {
        const categoryPool = available.filter((question) => question.categoryId === category.id);
        return format === "mixed"
          ? [shuffle(categoryPool.filter((question) => !isIdentification(question)))[0], shuffle(categoryPool.filter(isIdentification))[0]].filter(Boolean)
          : shuffle(categoryPool).slice(0, 2);
      }));
    if (!pool.length) return;
    setQuestions(shuffle(pool)); setIndex(0); setResponses({}); setRoundKind(items ? "retry" : "standard"); setReviewFilter("missed"); setRoundId((value) => value + 1); setPhase("active");
  };
  const choose = (choice) => {
    if (checked) return;
    setResponses((previous) => ({ ...previous, [current.id]: { choice, submitted: false } }));
  };
  const submit = () => {
    if (checked || !hasAnswer(current, currentResponse?.choice)) return;
    setResponses((previous) => ({ ...previous, [current.id]: { ...previous[current.id], submitted: true } }));
    progress.recordAnswer(current, currentResponse.choice);
  };
  const showResults = () => { setReviewFilter("missed"); setPhase("results"); };
  const nextQuestion = () => {
    if (!remaining) { showResults(); return; }
    if (index < questions.length - 1) setIndex((value) => value + 1);
    else setIndex(questions.findIndex((question) => !responses[question.id]?.submitted));
  };

  const sessionTools = <QuizSessionTools phase={phase} roundId={roundId} answered={answered} total={questions.length} focusMode={focusMode} onFocusMode={onFocusMode} />;

  if (phase === "setup") return <div className="quiz-session">{sessionTools}<QuizSetup scope={scope} onScopeChange={onScopeChange} format={format} onFormatChange={setFormat} onStart={start} progress={progress} completedLessons={completedLessons} headingRef={heading} panelRef={panel} /></div>;

  if (phase === "results") {
    const reviewQuestions = reviewFilter === "all" ? questions : missed;
    return <div className="quiz-session">{sessionTools}<div className="quiz-layout quiz-results-layout" ref={panel}>
      <section className="quiz-question-card quiz-result-card" aria-labelledby="quiz-results-title"><div className="quiz-result-heading"><span className="quiz-result-trophy"><Trophy size={27} aria-hidden="true" /></span><span>{remaining ? "Round paused" : "Round complete"}</span></div><h2 id="quiz-results-title" ref={heading} tabIndex={-1}>Your score</h2><div className="quiz-result-score"><div className="quiz-result-ring-wrap"><QuizProgressRing value={percentage} label="Questions answered correctly" animated /><ScoreCelebration celebrate={!remaining && percentage >= 80} /></div><div><strong>{correct}<span> / {questions.length}</span></strong><p>questions correct</p><p>{!remaining && correct === questions.length ? "Every answer in this round was correct. Try applying the ideas to a new example." : "Use the explanations to strengthen the ideas that need another pass."}</p></div></div><div className="quiz-result-totals"><div className="correct"><CheckCircle2 size={20} aria-hidden="true" /><strong>{correct}</strong><span>Correct</span></div><div className="incorrect"><XCircle size={20} aria-hidden="true" /><strong>{incorrect}</strong><span>Incorrect</span></div><div><Circle size={20} aria-hidden="true" /><strong>{remaining}</strong><span>Unanswered</span></div></div>{remaining > 0 && <p className="quiz-partial-note">{remaining} unanswered {remaining === 1 ? "question counts" : "questions count"} as zero in this score. Resume the round to finish them.</p>}<div className="quiz-result-actions">{remaining > 0 && <button type="button" className="ai-learn-button primary" onClick={() => { setIndex(questions.findIndex((question) => !responses[question.id]?.submitted)); setPhase("active"); }}>Resume round<ArrowRight size={16} aria-hidden="true" /></button>}{missed.length > 0 && <button type="button" className={`ai-learn-button ${remaining ? "" : "primary"}`} onClick={() => start(missed)}><RotateCcw size={16} aria-hidden="true" />Retry missed questions</button>}<button type="button" className="ai-learn-button" onClick={() => start()}>New round</button><button type="button" className="ai-learn-text-button" onClick={() => setPhase("setup")}>Choose topic</button></div></section>
      <aside className="quiz-sidebar"><section className="quiz-side-panel quiz-category-results"><h3>By category</h3>{categories.filter((category) => questions.some((question) => question.categoryId === category.id)).map((category) => {
        const group = questions.filter((question) => question.categoryId === category.id);
        const groupScore = group.filter((question) => responses[question.id]?.submitted && isCorrectAnswer(question, responses[question.id].choice)).length;
        return <div key={category.id}><div><span>{category.shortTitle}</span><strong>{groupScore} / {group.length}</strong></div><progress value={groupScore} max={group.length} className="ai-learn-progress" aria-label={`${category.title} correct answers`} /></div>;
      })}</section><section className="quiz-side-panel quiz-review-guidance"><h3><Lightbulb size={20} aria-hidden="true" />Make it stick</h3><p>Before retrying, explain the answer without looking at the choices. Use a related lesson when the underlying idea still feels unclear.</p></section></aside>
      <section className="quiz-result-review" aria-labelledby="quiz-review-title"><div className="quiz-review-heading"><h2 id="quiz-review-title">Review your answers</h2><div aria-label="Filter answer review"><button type="button" aria-pressed={reviewFilter === "missed"} onClick={() => setReviewFilter("missed")}>Missed ({missed.length})</button><button type="button" aria-pressed={reviewFilter === "all"} onClick={() => setReviewFilter("all")}>All ({questions.length})</button></div></div>{!reviewQuestions.length ? <div className="quiz-review-empty"><CheckCircle2 size={24} aria-hidden="true" /><p>No missed questions in this round. Open All to revisit the explanations.</p></div> : <div className="quiz-reviewed-questions">{reviewQuestions.map((question) => {
        const response = responses[question.id];
        const isCorrect = response?.submitted && isCorrectAnswer(question, response.choice);
        return <details key={question.id} className="quiz-review-item" data-result={isCorrect ? "correct" : response?.submitted ? "incorrect" : "unanswered"}><summary>{isCorrect ? <CheckCircle2 size={20} aria-hidden="true" /> : response?.submitted ? <XCircle size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}<span>{question.prompt}<small>{isCorrect ? "Correct" : response?.submitted ? "Incorrect" : "Unanswered"}</small></span><ChevronDown size={18} aria-hidden="true" /></summary><div>{response?.submitted && <p>Your answer: {answerText(question, response.choice)}</p>}<p><strong>Correct answer:</strong> {answerText(question)}</p><p>{question.explanation}</p><button type="button" className="ai-learn-text-button" onClick={() => onReview(question)}>Review this lesson<ArrowRight size={16} aria-hidden="true" /></button></div></details>;
      })}</div>}</section>
    </div></div>;
  }

  const isCorrect = checked && isCorrectAnswer(current, currentResponse.choice);
  const identification = isIdentification(current);
  return <div className="quiz-session">{sessionTools}<div className="quiz-layout quiz-active-layout">
    <section ref={panel} className="quiz-question-card" aria-labelledby="quiz-question-title"><header className="quiz-question-topline"><div><span className="quiz-category-symbol"><Layers size={19} aria-hidden="true" /></span><span>{context.category.shortTitle}</span><ArrowRight size={14} aria-hidden="true" /><span>{identification && !checked ? "Identification" : context.lesson.title}</span></div><span className="quiz-question-position">{roundKind === "retry" ? "Retry · " : ""}Question {index + 1} of {questions.length}</span></header><progress className="ai-learn-progress quiz-question-progress" value={answered} max={questions.length} aria-label="Questions checked" /><h2 id="quiz-question-title" className="quiz-question-title" ref={heading} tabIndex={-1}>{current.prompt}</h2>{(!identification || checked) && <QuizQuestionVisual key={current.id} question={current} model={context.model} />}
      <form id="quiz-answer-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      {identification ? <div className="quiz-identification" data-result={checked ? isCorrect ? "correct" : "incorrect" : undefined}>
        <label htmlFor="quiz-identification-answer">Your answer</label>
        <input id="quiz-identification-answer" name="answer" type="text" value={currentResponse?.choice || ""} onChange={(event) => choose(event.target.value)} readOnly={checked} maxLength={200} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-invalid={checked && !isCorrect} aria-describedby={`quiz-identification-help${checked ? " quiz-answer-feedback" : ""}`} placeholder="Type the term or accepted abbreviation" />
        <p id="quiz-identification-help">Answers are not case-sensitive. Extra spaces are ignored. Press Enter or select Check answer.</p>
      </div> : <fieldset className="ai-learn-answers quiz-answer-options" disabled={checked}><legend className="sr-only">Choose one answer, then check it</legend>{current.options.map((option, optionIndex) => {
        const optionCorrect = checked && optionIndex === current.answer;
        const optionWrong = checked && currentResponse.choice === optionIndex && !optionCorrect;
        return <label key={option} data-selected={currentResponse?.choice === optionIndex} data-correct={optionCorrect} data-wrong={optionWrong}><input type="radio" name={`answer-${current.id}`} value={optionIndex} checked={currentResponse?.choice === optionIndex} onChange={() => choose(optionIndex)} /><span>{option}</span>{optionCorrect && <span className="quiz-option-status"><CheckCircle2 size={19} aria-hidden="true" /><span>Correct</span></span>}{optionWrong && <span className="quiz-option-status"><XCircle size={19} aria-hidden="true" /><span>Incorrect</span></span>}</label>;
      })}</fieldset>}
      </form>
      {checked && <div id="quiz-answer-feedback" className="quiz-answer-feedback" data-correct={isCorrect} role="status" key={`feedback-${current.id}`}>{isCorrect ? <CheckCircle2 size={24} aria-hidden="true" /> : <XCircle size={24} aria-hidden="true" />}<div><strong>{isCorrect ? "That's correct!" : "Not quite. Here's why."}</strong><p>{current.explanation}</p>{(!isCorrect || identification) && <p className="quiz-feedback-correct-answer"><strong>Correct answer:</strong> {answerText(current)}</p>}</div></div>}
      <div className="quiz-mobile-help"><HintPanel key={`mobile-hint-${current.id}`} hint={context.hint} inline />{(!identification || checked) && <ConceptsPanel key={`mobile-concepts-${current.id}`} model={context.model} inline />}</div>
      <footer className="quiz-question-actions"><button type="button" className="ai-learn-button quiz-previous" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button><button type="button" className="ai-learn-text-button quiz-end-round" onClick={showResults}>End round</button>{!checked ? <button type="submit" form="quiz-answer-form" className="ai-learn-button primary" disabled={!hasAnswer(current, currentResponse?.choice)}>Check answer<Check size={17} aria-hidden="true" /></button> : <button type="button" className="ai-learn-button primary" onClick={nextQuestion}>{!remaining ? "See your score" : index === questions.length - 1 ? "Next unanswered" : "Next question"}<ArrowRight size={17} aria-hidden="true" /></button>}</footer>
    </section>
    <aside className="quiz-sidebar" aria-label="Quiz tools"><section className="quiz-side-panel quiz-progress-panel"><div className="quiz-panel-title"><h3>Quiz progress</h3><span>{answered} of {questions.length} checked</span></div><div className="quiz-progress-body"><QuizProgressRing value={Math.round(answered / questions.length * 100)} label="Quiz completion" /><dl><div className="correct"><dt><Check size={16} aria-hidden="true" /><span>Correct</span></dt><dd>{correct}</dd></div><div className="incorrect"><dt><X size={16} aria-hidden="true" /><span>Incorrect</span></dt><dd>{incorrect}</dd></div><div><dt><Circle size={16} aria-hidden="true" /><span>Remaining</span></dt><dd>{remaining}</dd></div></dl></div></section><section className="quiz-side-panel quiz-question-map"><h3>Questions</h3><nav aria-label="Jump to a quiz question">{questions.map((question, position) => {
      const response = responses[question.id];
      const status = !response?.submitted ? "unanswered" : isCorrectAnswer(question, response.choice) ? "correct" : "incorrect";
      return <button type="button" key={question.id} data-result={status} aria-current={index === position ? "step" : undefined} aria-label={`Question ${position + 1}, ${status}${index === position ? ", current" : ""}`} onClick={() => setIndex(position)}>{status === "correct" ? <CheckCircle2 size={18} aria-hidden="true" /> : status === "incorrect" ? <XCircle size={18} aria-hidden="true" /> : position + 1}</button>;
    })}</nav></section><HintPanel key={current.id} hint={context.hint} />{(!identification || checked) && <ConceptsPanel key={`concepts-${current.id}`} model={context.model} />}</aside>
  </div></div>;
}
