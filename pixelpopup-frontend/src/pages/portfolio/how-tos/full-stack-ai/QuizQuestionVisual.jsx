import { useState } from "react";
import { ArrowRight, Box, CheckCircle2, Filter, GitBranch, KeyRound, Layers } from "lucide-react";
import { categories } from "./learningContent";
import { getLessonModel } from "./lessonModels";

const hints = {
  "backend-acid": "Think about where the transaction begins and ends. Should a partial operation become permanent?",
  "backend-jwt-auth": "Separate reading a token's contents from establishing that its contents can be trusted.",
  "backend-queues": "Consider what the broker knows if it never receives the worker's acknowledgment.",
  "backend-pagination": "What happens when two records occupy the same position under your chosen sort key?",
  "dsa-binary-search": "A midpoint comparison is useful only if it can rule out an entire region of candidates.",
  "dsa-bfs-dfs": "Which traversal finishes exploring one distance layer before starting the next?",
  "dsa-greedy": "Compare the number of coins in the greedy result with other combinations that total six.",
  "dsa-dijkstra": "Ask whether an unseen edge can make an already settled distance smaller.",
  "hld-cap": "Focus on the period when the replicas cannot communicate, rather than normal operation.",
  "hld-bloom": "A Bloom filter trades exact positive membership checks for compact storage. Which kind of error is possible?",
  "hld-replication": "A committed write and propagation to an asynchronous copy are separate events.",
  "hld-saga": "The earlier service has already committed locally. What business operation can compensate for that work?",
  "lld-strategy": "Look for an interchangeable algorithm behind a stable caller-facing contract.",
  "lld-adapter": "The problem is a mismatch between two interfaces and their units, not the object's lifetime.",
  "lld-prototype": "Copying the outer object does not necessarily copy the objects referenced inside it.",
  "lld-singleton": "Determine the scope in which the one-instance rule is actually enforced.",
  "ai-rag": "Distinguish changing knowledge from the model's general language or formatting behavior.",
  "ai-tool-calling": "A request proposed by a model still crosses an application permission boundary.",
  "ai-reranking": "Consider which documents the reranker is able to examine at all.",
  "ai-structured-outputs": "A format can be valid even when a value does not match the source document.",
  "devops-docker": "Think about what is discarded when an individual container is replaced.",
  "devops-blue-green": "The candidate and current releases exist independently. Which one is known to be ready?",
  "devops-terraform": "A declarative description can still imply removal or replacement of a real resource.",
  "devops-prometheus": "Every distinct combination of label values creates another time series.",
  "security-cors": "Ask which part of the system enforces CORS, and whether every HTTP client uses it.",
  "security-sql-injection": "Keep the query's structure separate from the data supplied by its caller.",
  "security-iam": "Knowing who a caller is does not establish what that caller is allowed to read.",
  "security-prompt-injection": "Where did the instruction come from, and does that source have permission to grant access?",
};

export function getQuestionContext(question) {
  const category = categories.find((item) => item.id === question.categoryId);
  const lesson = category.lessons.find((item) => item.id === question.lessonId);
  return { category, lesson, model: getLessonModel(category.id, lesson), hint: question.hint || hints[question.id] || "Consider the assumptions and boundaries in the related lesson." };
}

export default function QuizQuestionVisual({ question, model }) {
  const [selected, setSelected] = useState(null);
  const [inspectBits, setInspectBits] = useState(false);
  const icons = [Box, GitBranch, Layers];
  if (question.lessonId === "bloom") return <figure className="quiz-question-visual quiz-bloom-visual">
    <div className="quiz-bloom-flow"><div className="quiz-diagram-node"><KeyRound size={25} aria-hidden="true" /><strong>Key (k)</strong></div><ArrowRight size={27} aria-hidden="true" /><button type="button" className="quiz-bloom-filter" aria-pressed={inspectBits} onClick={() => setInspectBits((value) => !value)}><strong><Filter size={22} aria-hidden="true" />Bloom filter</strong><span className="quiz-bloom-bits" aria-label="Example bit array: 1, 0, 1, 1, 0, 1">{[1, 0, 1, 1, 0, 1].map((bit, index) => <span key={index} data-hashed={inspectBits && [0, 3, 5].includes(index)}>{bit}</span>)}</span></button><ArrowRight size={27} aria-hidden="true" /><div className="quiz-diagram-node quiz-bloom-positive"><CheckCircle2 size={26} aria-hidden="true" /><strong>Present<small>(possible)</small></strong></div></div>
    <figcaption role="status">{inspectBits ? "The example's three hash positions are set. Unrelated keys can also set those bits." : "Inspect the filter to highlight the example hash positions."}</figcaption>
  </figure>;
  return <figure className={`quiz-question-visual quiz-model-visual ${model.kind}`}><div className="quiz-visual-nodes">{model.nodes.map((node, index) => { const Icon = icons[index % icons.length]; return <div className="quiz-visual-node-wrap" key={node.label}><button type="button" aria-pressed={selected === index} onClick={() => setSelected(selected === index ? null : index)}><Icon size={25} aria-hidden="true" /><strong>{node.label}</strong></button>{model.kind === "flow" && index < model.nodes.length - 1 && <ArrowRight size={23} aria-hidden="true" />}</div>; })}</div><figcaption role="status">{selected === null ? "Explore a part of the model if you need a reminder." : model.nodes[selected].detail}</figcaption></figure>;
}
