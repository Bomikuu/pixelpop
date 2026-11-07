import { useEffect, useState } from "react";
import { Check, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { serviceGroups, services } from "./guideContent";
import { GuideIcon, ServiceLogo, SourceLink } from "./GuideUi";
import { GroupIllustration } from "./GuideIllustrations";

const progressKey = "mico-aws-infrastructure-checks-v1";

function readChecks() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(progressKey) || "{}");
    const answers = Object.fromEntries(serviceGroups.filter((group) => Number.isInteger(saved?.[group.id]) && saved[group.id] >= 0 && saved[group.id] < group.check.options.length).map((group) => [group.id, saved[group.id]]));
    return { answers, canSave: true };
  } catch { return { answers: {}, canSave: false }; }
}

export default function ServiceExplorer({ selectedId, onSelect }) {
  const [progress, setProgress] = useState(readChecks);
  const service = services.find((item) => item.id === selectedId) || services[0];
  const group = serviceGroups.find((item) => item.id === service.group);
  const choice = progress.answers[group.id];
  const checked = Number.isInteger(choice);
  const correct = checked && choice === group.check.answer;
  const correctCount = serviceGroups.filter((item) => progress.answers[item.id] === item.check.answer).length;

  useEffect(() => {
    if (!progress.canSave) return;
    try { window.localStorage.setItem(progressKey, JSON.stringify(progress.answers)); }
    catch { setProgress((previous) => ({ ...previous, canSave: false })); }
  }, [progress.answers, progress.canSave]);

  const answer = (index) => {
    if (!checked) setProgress((previous) => ({ ...previous, answers: { ...previous.answers, [group.id]: index } }));
  };
  const retry = () => setProgress((previous) => {
    const answers = { ...previous.answers };
    delete answers[group.id];
    return { ...previous, answers };
  });

  return <section id="aws-explorer" className="aws-section aws-explorer" aria-labelledby="aws-explorer-title" tabIndex={-1}>
    <div className="aws-section-heading"><h2 id="aws-explorer-title">Start with the job, then learn the name.</h2><p>Pick a job. Explore a service, then check the idea with a short question.</p></div>
    <div className="aws-explorer-grid">
      <nav className="aws-job-navigation" aria-label="Infrastructure jobs">
        {serviceGroups.map((item) => <button type="button" key={item.id} aria-pressed={group.id === item.id} onClick={() => onSelect(item.services[0])}><GuideIcon name={item.icon} size={21} /><span><strong>{item.title}</strong><small>{item.services.length} {item.services.length === 1 ? "service" : "services"}</small></span>{Number.isInteger(progress.answers[item.id]) && <CheckCircle2 className={progress.answers[item.id] === item.check.answer ? "aws-correct-icon" : "aws-answered-icon"} size={17} aria-label={progress.answers[item.id] === item.check.answer ? "Check answered correctly" : "Check answered, revisit it"} />}</button>)}
        <p className="aws-progress-note">{Object.keys(progress.answers).length} / {serviceGroups.length} checks answered · {correctCount} correct<br />{progress.canSave ? "Saved in this browser." : "Saved for this page session only."}</p>
      </nav>
      <div className="aws-explorer-content">
        <div className="aws-job-intro"><h3>{group.title}</h3><p className="aws-job-question">{group.question}</p><p>{group.explanation}</p></div>
        <div className="aws-service-options" aria-label={`Services for ${group.title.toLowerCase()}`}>{group.services.map((id) => {
          const item = services.find((entry) => entry.id === id);
          return <button key={id} type="button" aria-pressed={service.id === id} onClick={() => onSelect(id)}><ServiceLogo id={id} /><span><strong>{item.short}</strong><small>{item.job}</small></span>{service.id === id && <Check size={17} aria-hidden="true" />}</button>;
        })}</div>
        <article className="aws-service-detail" key={service.id} aria-labelledby="aws-service-title">
          <div className="aws-service-title"><span className="aws-service-symbol"><ServiceLogo id={service.id} size={40} /></span><div><h4 id="aws-service-title">{service.name}</h4><p>{service.job}</p></div></div>
          <p>{service.meaning}</p>
          <GroupIllustration group={group} />
          <dl className="aws-service-explanation"><div><dt>In our shop</dt><dd>{service.example}</dd></div><div><dt>Keep in mind</dt><dd>{service.caution}</dd></div></dl>
          <SourceLink href={service.docs}>Read the AWS documentation</SourceLink>
        </article>
        <div className="aws-comparison-note"><strong>Put it together</strong><p>{group.compare}</p><span>Video section: {group.time}</span></div>
        <section className="aws-knowledge-check" aria-labelledby="aws-check-title" key={group.id}>
          <h4 id="aws-check-title">Try the idea</h4>
          <fieldset disabled={checked}><legend>{group.check.prompt}</legend><div className="aws-check-options">{group.check.options.map((option, index) => <button type="button" key={option} onClick={() => answer(index)} data-correct={checked && index === group.check.answer} data-wrong={checked && index === choice && !correct}>{checked && index === group.check.answer ? <CheckCircle2 size={20} aria-hidden="true" /> : checked && index === choice ? <XCircle size={20} aria-hidden="true" /> : <span className="aws-choice-dot" aria-hidden="true" />}<span>{option}</span>{checked && index === group.check.answer && <small>Correct</small>}{checked && index === choice && !correct && <small>Your answer</small>}</button>)}</div></fieldset>
          {checked && <div className="aws-check-feedback" role="status" data-correct={correct}>{correct ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}<div><strong>{correct ? "You’ve got it." : "Not quite. Here’s the distinction."}</strong><p>{group.check.explanation}</p><button type="button" className="aws-text-button" onClick={retry}><RotateCcw size={15} aria-hidden="true" />Try again</button></div></div>}
        </section>
      </div>
    </div>
  </section>;
}
