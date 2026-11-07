import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { requestJourneys, services } from "./guideContent";
import { ServiceLogo } from "./GuideUi";
import { SituationChoices, SituationImage } from "./GuideIllustrations";

export default function RequestWalkthrough() {
  const [journeyId, setJourneyId] = useState("page");
  const [step, setStep] = useState(0);
  const journey = requestJourneys.find((item) => item.id === journeyId);
  const current = journey.steps[step];
  const service = services.find((item) => item.id === current.service);

  return <section id="aws-request" className="aws-section aws-request" aria-labelledby="aws-request-title">
    <div className="aws-section-heading"><h2 id="aws-request-title">Follow one request.</h2><p>A service name is easier to remember when you can see what it does. Move through the example at your own pace.</p></div>
    <SituationChoices journeys={requestJourneys} selectedId={journeyId} onSelect={(id) => { setJourneyId(id); setStep(0); }} />
    <div className="aws-walkthrough">
      <div className="aws-walkthrough-top"><h3>{journey.title}</h3><span>Step {step + 1} of {journey.steps.length}</span></div>
      <p className="aws-journey-intro">{journey.intro}</p>
      <nav className="aws-request-stages" aria-label="Request stages"><ol>{journey.steps.map((item, index) => {
        const itemService = services.find((entry) => entry.id === item.service);
        return <li key={`${journeyId}-${index}`}><button type="button" aria-current={step === index ? "step" : undefined} aria-label={`Step ${index + 1}: ${item.title}`} onClick={() => setStep(index)}><span><ServiceLogo id={itemService.id} /></span><strong>{itemService.short}</strong><small>{item.action}</small></button>{index < journey.steps.length - 1 && <ArrowRight size={19} aria-hidden="true" />}</li>;
      })}</ol></nav>
      <div className="aws-request-explanation">
        <figure className="aws-request-scene" key={`${journeyId}-${step}`}><SituationImage journeyId={journeyId} step={step} /><figcaption>The shop story: {current.title.toLowerCase()}.</figcaption></figure>
        <div className="aws-request-copy" role="status" aria-live="polite" aria-atomic="true"><div className="aws-scene-service"><ServiceLogo id={service.id} size={36} /><span>{service.name}</span></div><span className="aws-step-label">Step {step + 1} of {journey.steps.length}</span><h3>{current.title}</h3><p>{current.detail}</p><p className="aws-scene-caption">{current.action}</p></div>
      </div>
      <div className="aws-walkthrough-controls"><button type="button" className="aws-button" disabled={step === 0} onClick={() => setStep((previous) => previous - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button><button type="button" className="aws-text-button" onClick={() => setStep(0)}><RotateCcw size={16} aria-hidden="true" />Start over</button><button type="button" className="aws-button primary" disabled={step === journey.steps.length - 1} onClick={() => setStep((previous) => previous + 1)}>Next step<ArrowRight size={16} aria-hidden="true" /></button></div>
      <div className="aws-supporting-services"><h3>Some services support the whole path.</h3><p>IAM provides AWS access permissions. Secrets Manager holds sensitive credentials when needed. CloudWatch collects configured telemetry. They are supporting responsibilities, not three extra stops in every customer request.</p></div>
    </div>
    <div className="aws-request-print">{requestJourneys.map((item) => <section key={item.id}><h3>{item.title}</h3><ol>{item.steps.map((entry, index) => <li key={index}><SituationImage journeyId={item.id} step={index} /><div><ServiceLogo id={entry.service} size={28} /><p><strong>{entry.title}:</strong> {entry.detail}</p></div></li>)}</ol></section>)}</div>
  </section>;
}
