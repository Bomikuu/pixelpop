import { ArrowUpRight, BookOpen, RotateCcw } from "lucide-react";
import StudyText from "./StudyText";

export function LessonContext({ depth, loading, error, onRetry, terms }) {
  if (error) return <div className="study-depth-status" role="status"><p>The extended notes could not load. Your original lesson and saved notes remain available.</p><button type="button" className="ai-learn-text-button" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Retry extended notes</button></div>;
  if (loading) return <p className="study-depth-status" role="status">Loading the detailed explanation…</p>;
  if (!depth) return null;
  return <div className="study-depth-context"><h3>Why this matters</h3><p><StudyText terms={terms}>{depth.context[0]}</StudyText></p><h3>How it works</h3><p><StudyText terms={terms}>{depth.context[1]}</StudyText></p></div>;
}

export function LessonWorkedExample({ depth, terms }) {
  if (!depth) return null;
  return <div className="study-worked-example"><h3><BookOpen size={20} aria-hidden="true" />Walk through an example</h3><p className="study-worked-input"><strong>Starting point.</strong> <StudyText terms={terms}>{depth.workedExample.input}</StudyText></p><ol>{depth.workedExample.walkthrough.map((step, index) => <li key={index}><span aria-hidden="true">{index + 1}</span><p><StudyText terms={terms}>{step}</StudyText></p></li>)}</ol><p className="study-worked-output"><strong>Result.</strong> <StudyText terms={terms}>{depth.workedExample.output}</StudyText></p><div className="study-depth-decision"><h4>When to choose it</h4><p><StudyText terms={terms}>{depth.decision}</StudyText></p></div><div className="study-depth-decision"><h4>A mistake to avoid</h4><p><StudyText terms={terms}>{depth.pitfall}</StudyText></p></div></div>;
}

export function LessonRecall({ depth, terms }) {
  if (!depth) return null;
  return <section className="study-depth-recall" aria-labelledby="study-recall-title"><h3 id="study-recall-title">Explain it without the diagram</h3><p><StudyText terms={terms}>{depth.check.question}</StudyText></p><details><summary>Reveal the reasoning</summary><p><StudyText terms={terms}>{depth.check.answer}</StudyText></p></details></section>;
}

export function LessonReferences({ references }) {
  return <details className="study-reading"><summary>References & further reading</summary><ul>{references.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></details>;
}
