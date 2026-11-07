import { useState } from "react";
import { ArrowRight, Check, Database, FileText, LockKeyhole, Network, Play, RotateCcw, Server, ShieldCheck, Users } from "lucide-react";
import StudyText from "./StudyText";

function Flow({ nodes }) {
  return <div className="ai-learn-flow" aria-label={nodes.join(" → ")}>{nodes.map((node, index) => <div className="ai-learn-flow-part" key={`${index}-${node}`}><span>{node}</span>{index < nodes.length - 1 && <ArrowRight size={16} aria-hidden="true" />}</div>)}</div>;
}

function RequestLab() {
  const [authenticated, setAuthenticated] = useState(true);
  const [valid, setValid] = useState(true);
  const [step, setStep] = useState(0);
  const blocked = step >= 1 && !authenticated ? "401 · Sign-in required" : step >= 2 && !valid ? "400 · Invalid meal amount" : null;
  const states = ["Request prepared", "Identity checked", "Input validated", "Transaction committed", "201 · Meal created"];
  const reset = () => setStep(0);
  return <>
    <p><StudyText>Send a sample meal through an API. Change a condition, then follow the request again.</StudyText></p>
    <div className="ai-learn-controls">
      <label className="ai-learn-check"><input type="checkbox" checked={authenticated} onChange={(event) => { setAuthenticated(event.target.checked); reset(); }} />Signed in</label>
      <label className="ai-learn-check"><input type="checkbox" checked={valid} onChange={(event) => { setValid(event.target.checked); reset(); }} />Valid amount</label>
    </div>
    <Flow nodes={["Browser", "Authentication", "Validation", "Database", "Response"]} />
    <ol className="ai-learn-trace" aria-label="Request stages">{states.map((state, index) => <li key={state} data-active={step === index} data-done={index < step}>{index < step ? <Check size={16} aria-hidden="true" /> : <span className="ai-learn-trace-dot" />}{state}</li>)}</ol>
    <p className="ai-learn-output" role="status"><strong>{blocked || states[step]}</strong>{blocked ? ". No database write was made." : step === 4 ? ". The write completed before the success response." : ". Advance to inspect the next boundary."}</p>
    <div className="ai-learn-controls"><button className="ai-learn-button primary" disabled={Boolean(blocked) || step === 4} onClick={() => setStep((value) => value + 1)}>Next boundary <ArrowRight size={16} aria-hidden="true" /></button><button className="ai-learn-button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button></div>
  </>;
}

const searchValues = [3, 7, 11, 14, 18, 23, 27, 31, 35, 42, 47, 53];
const initialSearch = { low: 0, high: searchValues.length - 1, checked: -1, done: false, message: "The entire sorted array is still a candidate.", count: 0 };
function SearchLab() {
  const [target, setTarget] = useState(31);
  const [state, setState] = useState(initialSearch);
  const advance = () => setState((previous) => {
    const middle = Math.floor((previous.low + previous.high) / 2);
    const value = searchValues[middle];
    const low = value < target ? middle + 1 : previous.low;
    const high = value > target ? middle - 1 : previous.high;
    const found = value === target;
    const absent = low > high;
    return { low, high, checked: middle, done: found || absent, count: previous.count + 1,
      message: found ? `Found ${target} at index ${middle}.` : absent ? `${target} is absent: no candidates remain.` : `Checked ${value}: ${value < target ? "discard it and everything to its left" : "discard it and everything to its right"}.` };
  });
  return <>
    <p>Each comparison rules out part of a <strong>sorted array</strong>. Try <strong>26</strong> to see an unsuccessful search.</p>
    <label className="ai-learn-field">Target<select value={target} onChange={(event) => { setTarget(Number(event.target.value)); setState(initialSearch); }}>{[31, 14, 26].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <div className="ai-learn-array" aria-label="Sorted search array">{searchValues.map((value, index) => <div key={value} data-discarded={(index < state.low || index > state.high) && index !== state.checked} data-checked={index === state.checked}><strong>{value}</strong><small>{index}</small></div>)}</div>
    <p className="ai-learn-caption">Value above, zero-based index below. The outlined value is the latest midpoint.</p>
    <p className="ai-learn-output" role="status"><strong>{state.message}</strong> <span>{state.count} {state.count === 1 ? "comparison" : "comparisons"}</span></p>
    <div className="ai-learn-controls"><button className="ai-learn-button primary" disabled={state.done} onClick={advance}>Compare midpoint <ArrowRight size={16} aria-hidden="true" /></button><button className="ai-learn-button" onClick={() => setState(initialSearch)}><RotateCcw size={15} aria-hidden="true" />Reset</button></div>
  </>;
}

function ScaleLab() {
  const [requests, setRequests] = useState(36);
  const [workers, setWorkers] = useState(3);
  const [cached, setCached] = useState(false);
  const [result, setResult] = useState(null);
  const origin = result ? result.cached ? Math.ceil(result.requests * 0.4) : result.requests : 0;
  const workerCount = result?.workers || workers;
  const loads = Array.from({ length: workerCount }, (_, index) => Math.floor(origin / workerCount) + (index < origin % workerCount ? 1 : 0));
  const changed = result && (requests !== result.requests || workers !== result.workers || cached !== result.cached);
  return <>
    <p>Choose the workload, predict the split, then run it. Each worker has a modeled capacity of <strong>10 requests per round</strong>.</p>
    <div className="study-distribution-lab"><div className="study-simulation-controls"><div className="ai-learn-control-grid"><label className="ai-learn-field">Requests<input type="number" min="1" max="60" value={requests} onChange={(event) => setRequests(Math.min(60, Math.max(1, Math.round(Number(event.target.value) || 1))))} /></label><label className="ai-learn-field">Workers<select value={workers} onChange={(event) => setWorkers(Number(event.target.value))}>{[1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}</select></label></div><label className="ai-learn-check"><input type="checkbox" checked={cached} onChange={(event) => setCached(event.target.checked)} />60% cache hit rate</label><div className="ai-learn-controls"><button type="button" className="ai-learn-button primary" onClick={() => setResult((previous) => ({ requests, workers, cached, run: (previous?.run || 0) + 1 }))}><Play size={15} aria-hidden="true" />Run simulation</button><button type="button" className="ai-learn-button" onClick={() => { setRequests(36); setWorkers(3); setCached(false); setResult(null); }}><RotateCcw size={15} aria-hidden="true" />Reset</button></div></div>
      <div className="study-simulation-result"><strong>Request distribution {result && `(${origin} to workers)`}</strong><div className="study-simulation-route" key={result?.run || 0}><Users size={23} aria-hidden="true" /><span className={result ? "study-request-route is-running" : "study-request-route"}><span /></span><Network size={25} aria-hidden="true" /><ArrowRight size={18} aria-hidden="true" /></div><div className="ai-learn-workers" style={{ "--worker-count": workerCount }} key={`workers-${result?.run || 0}`}>{loads.map((load, index) => <div key={index}><Server size={24} aria-hidden="true" /><strong>Server {index + 1}</strong><span>{load} requests</span><small>{origin ? Math.round(load / origin * 100) : 0}% of worker traffic</small><div className="ai-learn-meter"><span style={{ width: `${Math.min(load * 10, 100)}%` }} /></div>{load > 10 && <small>{load - 10} over capacity</small>}</div>)}</div></div></div>
    <p className="ai-learn-output" role="status">{!result ? "Ready when you are. Predict how many requests each server will receive." : changed ? "Settings changed. Run the simulation again to apply them." : `${result.cached ? `${result.requests - origin} requests were served from cache. ` : ""}${loads.some((load) => load > 10) ? "Some workers exceed their modeled capacity. Try another worker or enable caching." : "This round fits the modeled worker capacity."}`}</p>
    <p className="ai-learn-caption">Local illustration with equal-cost requests, rounded cache hits, and no network or database bottleneck. These assumptions are not a performance benchmark.</p>
  </>;
}

function StrategyLab() {
  const [subtotal, setSubtotal] = useState(1000);
  const [policy, setPolicy] = useState("standard");
  const discount = policy === "member" ? subtotal * 0.1 : 0;
  const money = (value) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value);
  return <>
    <p>The caller uses <strong>one pricing contract</strong>. The chosen policy supplies the calculation.</p>
    <div className="ai-learn-control-grid"><label className="ai-learn-field">Sample subtotal: {money(subtotal)}<input type="range" min="100" max="2000" step="100" value={subtotal} onChange={(event) => setSubtotal(Number(event.target.value))} /></label><label className="ai-learn-field">Pricing strategy<select value={policy} onChange={(event) => setPolicy(event.target.value)}><option value="standard">Standard · no discount</option><option value="member">Member · 10% discount</option></select></label></div>
    <Flow nodes={["Checkout", "calculate(subtotal)", policy === "member" ? "Member policy" : "Standard policy", money(subtotal - discount)]} />
    <pre className="ai-learn-code"><code>{`// The caller stays the same.\nconst total = pricing.calculate(subtotal);\n\n// Current policy\n${policy === "member" ? "return subtotal * 0.90;" : "return subtotal;"}`}</code></pre>
    <p className="ai-learn-output" role="status">{money(subtotal)} subtotal − {money(discount)} discount = <strong>{money(subtotal - discount)} total.</strong></p>
    <p className="ai-learn-caption">An invented pricing policy for this demonstration, not a product offer.</p>
  </>;
}

const retrievalSamples = {
  delivery: { query: "When does delivery arrive?", relevant: "delivery", answer: "Sample deliveries arrive in 3–5 business days." },
  leave: { query: "How do I request leave?", relevant: "leave", answer: "Sample leave requests go through the team calendar for manager approval." },
};
const documents = [
  { id: "delivery", title: "Delivery policy", text: "Deliveries arrive in 3–5 business days after dispatch." },
  { id: "leave", title: "Leave policy", text: "Submit leave through the team calendar for manager approval." },
  { id: "returns", title: "Returns policy", text: "Return requests need the original order reference." },
];
function RetrievalLab() {
  const [sample, setSample] = useState("delivery");
  const [included, setIncluded] = useState(["delivery"]);
  const selected = retrievalSamples[sample];
  const grounded = included.includes(selected.relevant);
  return <>
    <p>Choose a question and the <strong>passages supplied to the answer stage</strong>. Everything here is a fixed local example.</p>
    <label className="ai-learn-field">Question<select value={sample} onChange={(event) => { setSample(event.target.value); setIncluded([]); }}>{Object.entries(retrievalSamples).map(([id, item]) => <option key={id} value={id}>{item.query}</option>)}</select></label>
    <Flow nodes={["Question", "Retrieve candidates", "Select evidence", "Grounded answer"]} />
    <fieldset className="ai-learn-passages"><legend>Passages included in context</legend>{documents.map((document) => <label key={document.id}><input type="checkbox" checked={included.includes(document.id)} onChange={() => setIncluded((previous) => previous.includes(document.id) ? previous.filter((id) => id !== document.id) : [...previous, document.id])} /><span><strong><FileText size={16} aria-hidden="true" />{document.title}</strong><span>{document.text}</span></span></label>)}</fieldset>
    <div className="ai-learn-output" role="status"><strong>{grounded ? "Evidence available" : "Insufficient evidence"}</strong><p>{grounded ? selected.answer : "The selected passages do not answer this question. Retrieve more relevant evidence or say you do not know."}</p>{grounded && <small>Source: {documents.find((document) => document.id === selected.relevant).title}</small>}</div>
    <p className="ai-learn-caption">No embeddings, search service, or language model runs in this demo. The selection illustrates the evidence boundary; real generation still needs evaluation.</p>
  </>;
}

function DeployLab() {
  const [route, setRoute] = useState("blue");
  const [ready, setReady] = useState(false);
  return <>
    <p>Blue is the <strong>current release</strong>. Green is a <strong>candidate</strong>. Only a ready candidate should receive traffic.</p>
    <label className="ai-learn-check"><input type="checkbox" checked={ready} onChange={(event) => setReady(event.target.checked)} />Green passes its readiness checks</label>
    <Flow nodes={["Visitors", "Router", route === "blue" ? "Blue · current" : "Green · candidate"]} />
    <div className="ai-learn-environments">{["blue", "green"].map((environment) => <div key={environment} data-active={route === environment}><Server size={24} aria-hidden="true" /><strong>{environment === "blue" ? "Blue · v1" : "Green · v2"}</strong><span>{route === environment ? "Receiving traffic" : "Standing by"}</span><small>{environment === "blue" || ready ? "Ready" : "Check failed"}</small></div>)}</div>
    <div className="ai-learn-controls"><button className="ai-learn-button primary" disabled={!ready || route === "green"} onClick={() => setRoute("green")}>Switch to green <ArrowRight size={16} aria-hidden="true" /></button><button className="ai-learn-button" disabled={route === "blue"} onClick={() => setRoute("blue")}><RotateCcw size={15} aria-hidden="true" />Roll back to blue</button></div>
    <p className="ai-learn-output" role="status">{route === "green" && !ready ? "The active candidate is now unhealthy. Roll back traffic and investigate." : route === "green" ? "Green is serving. Blue remains available as the previous application version." : !ready ? "Switch blocked: green is not ready. Visitors remain on blue." : "Green is ready. You can now switch the router."}</p>
    <p className="ai-learn-caption">Traffic routing only. A real release must also account for schema compatibility, in-flight requests, and data changes that rollback cannot undo.</p>
  </>;
}

function AccessLab() {
  const [signedIn, setSignedIn] = useState(true);
  const [own, setOwn] = useState(false);
  const allowed = signedIn && own;
  return <>
    <p>Sample rule: a signed-in user may read <strong>only their own report</strong>. A hard-to-guess report ID does not grant access.</p>
    <div className="ai-learn-controls"><label className="ai-learn-check"><input type="checkbox" checked={signedIn} onChange={(event) => setSignedIn(event.target.checked)} />Signed in</label><label className="ai-learn-check"><input type="checkbox" checked={own} onChange={(event) => setOwn(event.target.checked)} />Report belongs to this user</label></div>
    <Flow nodes={["Request", signedIn ? "Identity verified" : "No valid identity", own ? "Owner matches" : "Owner differs", allowed ? "Allow read" : "Deny"]} />
    <div className="ai-learn-access-result">{allowed ? <ShieldCheck size={38} aria-hidden="true" /> : <LockKeyhole size={38} aria-hidden="true" />}<div role="status"><strong>{allowed ? "200 · Authorized" : !signedIn ? "401 · Authentication required" : "403 · Permission denied"}</strong><p>{allowed ? "The request satisfies both identity and ownership checks." : !signedIn ? "Establish identity before evaluating this private resource." : "The caller is known, but has no right to read this report."}</p></div></div>
    <p className="ai-learn-caption">This local example displays 403 to expose the decision. Real APIs may deliberately use 404 to avoid disclosing whether a resource exists. Enforcement belongs on the server.</p>
  </>;
}

const labs = { request: RequestLab, search: SearchLab, scale: ScaleLab, strategy: StrategyLab, retrieval: RetrievalLab, deploy: DeployLab, access: AccessLab };
export default function LearningLab({ category }) {
  const Lab = labs[category.lab];
  return <section className="ai-learn-lab" aria-labelledby={`lab-${category.id}`}><div className="ai-learn-lab-heading"><Database size={20} aria-hidden="true" /><h3 id={`lab-${category.id}`}>{category.labTitle}</h3><span>Interactive example</span></div><Lab /></section>;
}
