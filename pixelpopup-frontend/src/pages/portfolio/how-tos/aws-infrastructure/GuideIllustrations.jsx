import { ArrowUpRight } from "lucide-react";
import { services } from "./guideContent";
import { ServiceLogo } from "./GuideUi";

const assetRoot = "/portfolio/assets/how-tos/aws-infrastructure/illustrations";

const diagrams = {
  compute: {
    alt: "Two illustrated paths: a request reaches an EC2 server and returns a response; an event triggers a Lambda worker that produces a result.",
    caption: "Two ways to run code: manage an EC2 virtual server, or let Lambda invoke your function when an event arrives.",
  },
  database: {
    alt: "RDS connects SQL tables to stored records, while a key lookup opens a DynamoDB cabinet to retrieve a shopping cart.",
    caption: "RDS supports relational records and SQL queries. DynamoDB organizes access around keys and planned query patterns.",
  },
  networking: {
    alt: "A separate DNS lookup connects a browser with Route 53. Below, asset requests go through CloudFront to S3 on a cache miss, while API requests go through API Gateway to application code.",
    caption: "Find the address first. Then an asset request can use CloudFront, while an API call can reach your backend through API Gateway.",
  },
  storage: {
    alt: "A photo, PDF, and backup archive enter an Amazon S3 storage shelf. A tag represents the object key used to identify a file.",
    caption: "S3 stores objects such as images, documents, and backups. An object key identifies each item inside a bucket.",
  },
  monitoring: {
    alt: "An app sends telemetry to CloudWatch metrics and logs screens, which connect to an alarm bell.",
    caption: "Configured telemetry makes app behavior visible. CloudWatch alarms can notify you when a metric meets a condition.",
  },
  security: {
    alt: "IAM authorizes a backend request to a locked Secrets Manager cabinet, which returns the credential to the backend.",
    caption: "IAM decides whether the backend is allowed to read a secret. Secrets Manager stores the sensitive value it needs.",
  },
  messaging: {
    alt: "An order event reaches an SNS notice board, which delivers copies to two SQS task trays for an email worker and a shipping worker.",
    caption: "SNS can fan an event out to subscribers. Separate SQS queues let each worker process its tasks at its own pace.",
  },
};

const situations = {
  page: {
    columns: 2,
    ratio: "3 / 2",
    description: "From finding the address to seeing a product photo.",
    scenes: [
      "A shopper asks a shopkeeper to find the shop address in a directory, illustrating a DNS lookup.",
      "A shopper requests a product photo from a nearby delivery kiosk, illustrating a request to CloudFront.",
      "A worker retrieves the original photo from storage shelves, illustrating an S3 read on a cache miss.",
      "The shopper sees the product page and photo on a laptop after delivery.",
    ],
  },
  order: {
    columns: 3,
    ratio: "1 / 1",
    description: "From an order click to independent background jobs.",
    scenes: [
      "A shopper hands an order ticket to the shop counter, illustrating an API Gateway request.",
      "A worker checks the order ticket against a checklist, illustrating validation by a Lambda handler.",
      "A clerk files the confirmed order in a keyed cabinet, illustrating a durable DynamoDB write.",
      "A dispatcher announces the saved order on a notice board, illustrating an SNS event.",
      "Copies of the order wait in separate email and shipping task trays, illustrating SQS queues.",
      "An email worker and a shipping worker handle their tasks independently, illustrating queue consumers.",
    ],
  },
};

export function GroupIllustration({ group }) {
  const diagram = diagrams[group.id];
  const src = `${assetRoot}/${group.id}-pixel-v2.webp`;

  return <figure className="aws-group-illustration">
    <a className="aws-diagram-image" href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open the ${group.title.toLowerCase()} illustration at full size in a new tab`}><img src={src} alt={diagram.alt} width="768" height="512" loading="lazy" decoding="async" /></a>
    <ul className="aws-illustration-legend" aria-label="AWS services in this illustration">{group.services.map((id) => {
      const service = services.find((item) => item.id === id);
      return <li key={id}><ServiceLogo id={id} size={28} /><span>{service.name}</span></li>;
    })}</ul>
    <figcaption><p>{diagram.caption}</p><span className="aws-diagram-hint">Select the image to see it full size.<ArrowUpRight size={14} aria-hidden="true" /></span></figcaption>
  </figure>;
}

export function SituationImage({ journeyId, step = 0, decorative = false }) {
  const situation = situations[journeyId];
  return <span className="aws-situation-image" style={{ "--scene-columns": situation.columns, "--scene-column": step % situation.columns, "--scene-row": Math.floor(step / situation.columns), "--scene-ratio": situation.ratio }}><img src={`${assetRoot}/situation-${journeyId}-pixel-v2.webp`} width="1536" height="1024" alt={decorative ? "" : situation.scenes[step]} loading="lazy" decoding="async" /></span>;
}

export function SituationChoices({ journeys, selectedId, onSelect }) {
  return <div className="aws-situation-choices" role="group" aria-label="Choose a situation">{journeys.map((journey) => <button type="button" key={journey.id} aria-pressed={selectedId === journey.id} onClick={() => onSelect(journey.id)}><SituationImage journeyId={journey.id} decorative /><span><strong>{journey.title}</strong><small>{situations[journey.id].description}</small><span className="aws-situation-cta">{selectedId === journey.id ? "Exploring this story" : "Explore this story"}<ArrowUpRight size={15} aria-hidden="true" /></span></span></button>)}</div>;
}
