import { useId, useRef, useState } from "react";
import { ArrowRight, BookOpen, Box, Check, CheckCircle2, CircleDot, GitBranch, Layers, Network, Play, RotateCcw, Server, Users, XCircle } from "lucide-react";
import { quizQuestions } from "./quizQuestions";
import StudyText from "./StudyText";

const nodeIcons = [Box, GitBranch, Layers];

export function ConceptDiagram({ model, network = false }) {
  const [selected, setSelected] = useState(0);
  const selectNode = (index) => setSelected(index);
  return <figure className="study-concept">
    {network ? <div className="study-network" aria-label="Users send requests through a load balancer to three healthy servers">
      <button type="button" className="study-network-users" data-selected={selected === 0} aria-pressed={selected === 0} onClick={() => selectNode(0)}><span className="study-user-icons"><Users size={36} /><Users size={30} /></span><strong>Users</strong><small>Incoming requests</small></button>
      <ArrowRight className="study-network-arrow" size={30} aria-hidden="true" />
      <button type="button" className="study-network-router" data-selected={selected === 1} aria-pressed={selected === 1} onClick={() => selectNode(1)}><Network size={40} aria-hidden="true" /><strong>Load balancer</strong><small>Choose a healthy worker</small></button>
      <div className="study-network-branches" aria-hidden="true"><span /><span /><span /></div>
      <div className="study-network-servers">{[1, 2, 3].map((number) => <button type="button" key={number} data-selected={selected === 2} aria-pressed={selected === 2} onClick={() => selectNode(2)}><Server size={26} aria-hidden="true" /><span><strong>Server {number}</strong><small><span className="study-health-dot" />Healthy</small></span></button>)}</div>
    </div> : <div className={`study-concept-nodes ${model.kind}`}>
      {model.nodes.map((node, index) => { const Icon = nodeIcons[index % nodeIcons.length]; return <div className="study-concept-node-wrap" key={node.label}><button type="button" aria-pressed={selected === index} data-selected={selected === index} onClick={() => selectNode(index)}><Icon size={28} aria-hidden="true" /><strong>{node.label}</strong><small>Explore this part</small></button>{model.kind === "flow" && index < model.nodes.length - 1 && <ArrowRight size={24} aria-hidden="true" />}</div>; })}
    </div>}
    <figcaption className="study-concept-detail" role="status"><CircleDot size={17} aria-hidden="true" /><p><strong>{model.nodes[selected].label}.</strong> {model.nodes[selected].detail}</p><span>{selected + 1} / {model.nodes.length}</span></figcaption>
  </figure>;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function MatchingActivity({ model }) {
  const [order, setOrder] = useState(() => shuffle(model.nodes.map((_, index) => index)));
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options, setOptions] = useState(() => shuffle(model.nodes.map((_, index) => index)));
  const target = order[round];
  const reset = () => { setOrder(shuffle(model.nodes.map((_, index) => index))); setOptions(shuffle(model.nodes.map((_, index) => index))); setRound(0); setChoice(null); setChecked(false); setScore(0); setFinished(false); };

  if (finished) return <div className="study-match-result" role="status"><CheckCircle2 size={34} aria-hidden="true" /><h3>{score} of {model.nodes.length} matched</h3><p>{score === model.nodes.length ? "You connected each part with its role. Try explaining the whole model without looking." : "Revisit the diagram, then try matching the roles again."}</p><button type="button" className="ai-learn-button" onClick={reset}><RotateCcw size={16} aria-hidden="true" />Try again</button></div>;
  return <div className="study-matching">
    <div className="study-activity-heading"><span>Match {round + 1} of {model.nodes.length}</span><span>Connect the idea to its role</span></div>
    <h3 aria-live="polite">What does <strong className="study-match-term">{model.nodes[target].label}</strong> describe?</h3>
    <fieldset className="ai-learn-answers" disabled={checked}><legend className="sr-only">Choose the matching explanation</legend>{options.map((option) => <label key={option} data-selected={choice === option} data-correct={checked && option === target} data-wrong={checked && choice === option && option !== target}><input type="radio" name={`match-${round}`} checked={choice === option} onChange={() => setChoice(option)} /><span><StudyText>{model.nodes[option].detail}</StudyText></span>{checked && option === target && <CheckCircle2 size={18} aria-label="Correct match" />}{checked && choice === option && option !== target && <XCircle size={18} aria-label="Incorrect match" />}</label>)}</fieldset>
    {checked && <p className="study-inline-feedback" role="status"><strong>{choice === target ? "That's the connection." : "Here's the connection."}</strong> <span><strong>{model.nodes[target].label}:</strong> <StudyText>{model.nodes[target].detail}</StudyText></span></p>}
    <div className="ai-learn-controls">{checked ? <button type="button" className="ai-learn-button primary" onClick={() => {
      if (round === model.nodes.length - 1) setFinished(true);
      else { setRound((value) => value + 1); setOptions(shuffle(model.nodes.map((_, index) => index))); setChoice(null); setChecked(false); }
    }}>{round === model.nodes.length - 1 ? "See result" : "Next match"}<ArrowRight size={16} aria-hidden="true" /></button> : <button type="button" className="ai-learn-button primary" disabled={choice === null} onClick={() => { if (choice === target) setScore((value) => value + 1); setChecked(true); }}>Check match</button>}</div>
  </div>;
}

export function LessonCheck({ category, lesson, model }) {
  const question = quizQuestions.find((item) => item.type !== "identification" && item.categoryId === category.id && item.lessonId === lesson.id);
  const [choice, setChoice] = useState(null);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [reflection, setReflection] = useState(null);
  return <div className="study-lesson-check">
    <p className="study-section-intro">{question ? "Make a choice before checking the explanation." : "Retrieve the idea from memory before revealing the reference points."}</p>
    <h3>{question?.prompt || lesson.practice}</h3>
    {question ? <fieldset className="ai-learn-answers" disabled={revealed}><legend className="sr-only">Choose one answer</legend>{question.options.map((option, index) => <label key={option} data-selected={choice === index} data-correct={revealed && index === question.answer} data-wrong={revealed && index === choice && index !== question.answer}><input type="radio" name={`lesson-check-${lesson.id}`} checked={choice === index} onChange={() => setChoice(index)} /><span>{option}</span>{revealed && index === question.answer && <CheckCircle2 size={18} aria-label="Correct answer" />}{revealed && index === choice && index !== question.answer && <XCircle size={18} aria-label="Your incorrect answer" />}</label>)}</fieldset> : <label className="study-recall-field">Your explanation<textarea value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} placeholder="Explain it in your own words. A sketch or a few sentences is enough." rows={4} /></label>}
    {!revealed ? <button type="button" className="ai-learn-button primary" disabled={question ? choice === null : !draft.trim()} onClick={() => setRevealed(true)}>{question ? "Check answer" : "Reveal reference points"}<ArrowRight size={16} aria-hidden="true" /></button> : <div className="study-answer-reference" role="status"><strong>{question ? choice === question.answer ? "Correct" : "Not quite" : "Compare your reasoning"}</strong>{question ? <p>{question.explanation}</p> : <><ul>{model.nodes.map((node) => <li key={node.label}><Check size={15} aria-hidden="true" /><span><strong>{node.label}:</strong> {node.detail}</span></li>)}</ul><p>This is a self-check, not an automatically graded answer. Does your explanation preserve these ideas?</p><div className="ai-learn-controls"><button type="button" className="ai-learn-button" aria-pressed={reflection === "practice"} onClick={() => setReflection("practice")}>I need another pass</button><button type="button" className="ai-learn-button" aria-pressed={reflection === "clear"} onClick={() => setReflection("clear")}>I can explain it</button></div>{reflection && <p>{reflection === "clear" ? "Try applying the idea to a different example next." : "Revisit the visual model, then explain it again without looking."}</p>}</>}</div>}
    {revealed && <button type="button" className="ai-learn-text-button" onClick={() => { setRevealed(false); setChoice(null); setReflection(null); }}><RotateCcw size={15} aria-hidden="true" />Try the check again</button>}
  </div>;
}

export function ScenarioActivity({ lesson }) {
  const [revealed, setRevealed] = useState(false);
  return <div className="study-scenario"><div className="study-scenario-example"><BookOpen size={22} aria-hidden="true" /><p><StudyText terms={[lesson.title]}>{lesson.example}</StudyText></p></div><p className="study-section-intro">Before opening the tradeoff, name one assumption you would check in this example.</p><button type="button" className="ai-learn-button" aria-expanded={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? "Hide the tradeoff" : "Reveal the tradeoff"}<ArrowRight size={16} aria-hidden="true" /></button>{revealed && <div className="study-scenario-reveal"><strong>Watch for this</strong><p><StudyText terms={[lesson.title]}>{lesson.pitfall}</StudyText></p></div>}</div>;
}

export function ActivityTabs({ hasSimulation, children, matching }) {
  const [tab, setTab] = useState(hasSimulation ? "simulation" : "match");
  const id = useId();
  const triggers = useRef({});
  const activities = [
    { id: "simulation", title: "Simulation", description: "Change inputs. Inspect the result.", icon: Play },
    { id: "match", title: "Match the concept", description: "Connect each idea to its role.", icon: Network },
  ];
  const navigateTabs = (event, position) => {
    let next;
    if (event.key === "ArrowRight") next = (position + 1) % activities.length;
    else if (event.key === "ArrowLeft") next = (position + activities.length - 1) % activities.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = activities.length - 1;
    else return;
    event.preventDefault();
    setTab(activities[next].id);
    triggers.current[activities[next].id]?.focus();
  };
  return <div className="study-activity-panel">
    {hasSimulation && <div className="study-activity-tabs" role="tablist" aria-label="Learning activity">{activities.map((activity, position) => {
      const Icon = activity.icon;
      return <button type="button" key={activity.id} ref={(element) => { triggers.current[activity.id] = element; }} id={`${id}-${activity.id}-tab`} role="tab" aria-selected={tab === activity.id} aria-controls={`${id}-${activity.id}-panel`} tabIndex={tab === activity.id ? 0 : -1} onClick={() => setTab(activity.id)} onKeyDown={(event) => navigateTabs(event, position)}><span className="study-activity-tab-icon"><Icon size={21} aria-hidden="true" /></span><span className="study-activity-tab-copy"><strong>{activity.title}</strong><small>{activity.description}</small></span><CheckCircle2 className="study-activity-tab-check" size={17} aria-hidden="true" /></button>;
    })}</div>}
    <div id={`${id}-simulation-panel`} role={hasSimulation ? "tabpanel" : undefined} aria-labelledby={hasSimulation ? `${id}-simulation-tab` : undefined} tabIndex={hasSimulation ? 0 : undefined} hidden={tab !== "simulation"}>{hasSimulation && children}</div>
    <div id={`${id}-match-panel`} role={hasSimulation ? "tabpanel" : undefined} aria-labelledby={hasSimulation ? `${id}-match-tab` : undefined} tabIndex={hasSimulation ? 0 : undefined} hidden={tab !== "match"}>{matching}</div>
  </div>;
}
