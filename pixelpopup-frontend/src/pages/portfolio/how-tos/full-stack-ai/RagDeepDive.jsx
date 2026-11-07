import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Database, FileText, Search, ShieldCheck } from "lucide-react";
import StudyText from "./StudyText";

const approaches = [
  {
    title: "Naive RAG: establish a baseline",
    summary: "Embed documents, retrieve matching chunks and add them to the answer prompt.",
    example: "Start with a small, authorized policy collection. For a return-window question, inspect whether the retrieved text actually contains the rule. Record this baseline before adding more stages.",
    tradeoff: "Simple to debug, but similarity alone does not select the current version or preserve an exception.",
    source: ["Retrieval architectures", "https://docs.langchain.com/oss/python/deepagents/retrieval"],
  },
  {
    title: "Structure-aware chunking: preserve meaning",
    summary: "Split around useful document boundaries and retain metadata instead of cutting blindly.",
    example: "Keep a returns heading attached to its rule and link an exception to its parent section. A table cell needs its row and column labels to remain interpretable.",
    tradeoff: "Larger context can preserve meaning while diluting relevance. Tune on representative questions, including exceptions.",
    source: ["Text splitter concepts", "https://docs.langchain.com/oss/python/integrations/splitters/index"],
  },
  {
    title: "Hybrid search and reranking: improve selection",
    summary: "Combine lexical and semantic retrieval, then make a more detailed comparison of candidates.",
    example: "Lexical search can preserve an exact code such as PLAN-42; dense retrieval can find a paraphrase such as vacation allowance. Reciprocal rank fusion combines ranking positions, avoiding an unjustified addition of unlike raw scores.",
    tradeoff: "These are separate stages. Reranking improves order only among candidates already found, and adds latency.",
    source: ["Hybrid search and rank fusion", "https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview"],
  },
  {
    title: "Query transformation and verification: handle harder questions",
    summary: "Rewrite unclear queries, retrieve across multiple steps and check source support.",
    example: "To compare a subscription's cancellation deadline with its renewal date, retrieve both facts and keep their source identities. A rewrite should clarify the original request without silently changing its meaning.",
    tradeoff: "More searches can improve coverage or introduce drift. Verify each required fact and preserve uncertainty.",
    source: ["Production retrieval design", "https://developers.llamaindex.ai/python/framework/optimizing/production_rag/"],
  },
  {
    title: "Agentic RAG: choose the next retrieval action",
    summary: "Let a bounded workflow decide when to search, inspect results or try another retrieval step.",
    example: "If a policy points to a separate exception page, a permitted follow-up lookup can fetch it. Stop when the answer is supported, the source is unavailable or the step budget is exhausted.",
    tradeoff: "Adaptive steps cost time and need permissions, stopping rules and evaluation. They do not guarantee self-correction.",
    source: ["Retrieval workflow tradeoffs", "https://docs.langchain.com/oss/python/deepagents/retrieval"],
  },
];

export function RagApproaches() {
  return <div className="study-rag-approaches">
    <h3>Five approaches from the video</h3>
    <p>The video moves from a basic retrieval pipeline to more adaptive workflows. Treat these as options for specific problems, rather than a rule that every application should climb to the last level.</p>
    <a className="ai-learn-text-button" href="https://www.facebook.com/basweai/videos/1642289027572440/" target="_blank" rel="noopener noreferrer">Watch the source video <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
    <div>{approaches.map((approach) => <details key={approach.title}>
      <summary>{approach.title}</summary>
      <p><StudyText>{approach.summary}</StudyText></p><p><strong>In practice.</strong> <StudyText>{approach.example}</StudyText></p><p><strong>Tradeoff.</strong> <StudyText>{approach.tradeoff}</StudyText></p>
      <a href={approach.source[1]} target="_blank" rel="noopener noreferrer">{approach.source[0]}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
    </details>)}</div>
  </div>;
}

const documents = [
  { id: "returns-v2", workspace: "shop-a", current: true, title: "Current returns policy", text: "Unused standard items may be returned within 30 days of delivery. See the personalized-item exception." },
  { id: "exception-v2", workspace: "shop-a", current: true, title: "Personalized-item exception", text: "Personalized items are not returnable unless faulty. This exception overrides the standard return window." },
  { id: "returns-v1", workspace: "shop-a", current: false, title: "Archived returns policy", text: "Standard items may be returned within 14 days of delivery." },
  { id: "delivery-b", workspace: "shop-b", current: true, title: "Another workspace's delivery policy", text: "This document is outside the signed-in user's permitted workspace." },
];
const questions = [
  { id: "standard", label: "Standard return", text: "How long do I have to return an unused standard item?", candidates: ["exception-v2", "returns-v2"], ranked: ["returns-v2", "exception-v2"], required: "returns-v2", answer: "An unused standard item may be returned within 30 days of delivery [returns-v2]. Personalized items have a separate exception [exception-v2]." },
  { id: "personalized", label: "Personalized item", text: "Can I return a personalized item just because I changed my mind?", candidates: ["returns-v2", "exception-v2"], ranked: ["exception-v2", "returns-v2"], required: "exception-v2", answer: "The supplied policy excludes personalized items from returns unless they are faulty [exception-v2]. The ordinary 30-day rule does not override that exception." },
  { id: "missing", label: "Missing evidence", text: "How many days does delivery take?", candidates: [], ranked: [], required: null, answer: "The permitted current documents do not establish a delivery time. I cannot answer that from this evidence." },
];
const indexing = [
  { title: "Extract and clean", icon: FileText, input: "A policy PDF, an archived version and a separate exception section.", action: "Extract readable text while preserving headings, table labels and source identity. Remove navigation noise without removing qualifications.", output: "Readable source text linked to its document and version.", failure: "A missing table row or corrupted extraction cannot be repaired by a better similarity index.", inspect: "Compare extracted text with the source, especially dates, tables and exceptions." },
  { title: "Chunk with provenance", icon: FileText, input: "Clean text with its section hierarchy.", action: "Create focused passages and retain parent-section links. Attach workspace, document ID, version, current status and source location.", output: "returns-v2 + exception-v2 + archived returns-v1, each with metadata.", failure: "A rule separated from its exception can become misleading even when the retrieved sentence is accurate.", inspect: "Ask an exception-specific question and check whether both rule and qualification can be recovered." },
  { title: "Embed compatible text", icon: Database, input: "The passages and a selected embedding model.", action: "Encode passages with the model's document conventions. Record the model identity and required metric; later queries must use the compatible query representation.", output: "A vector associated with each passage ID. This demo does not calculate vectors.", failure: "Vectors from incompatible models do not become comparable merely because their dimensions match.", inspect: "Check model revision, encoding conventions, dimensions and metric before indexing or migrating." },
  { title: "Build searchable indexes", icon: Database, input: "Passage text, vectors, metadata and stable identities.", action: "Store searchable records and, when useful, a lexical index for exact terms. Keep updates and deletions tied to authoritative source changes.", output: "A corpus that can retrieve evidence while enforcing workspace and version constraints.", failure: "An old policy can remain searchable after a source update unless the indexing lifecycle handles it.", inspect: "Check version coverage, deleted-record cleanup and retrieval recall on known answer-bearing passages." },
];
const queryStages = [
  { title: "Scope access", icon: ShieldCheck, action: "The application derives workspace access from the signed-in user, then restricts this example to current source records.", failure: "A model-provided workspace ID cannot grant access to another tenant.", inspect: "Verify the eligible source IDs before any private passage reaches the model." },
  { title: "Retrieve candidates", icon: Search, action: "Search the eligible corpus. In a real system, lexical and dense retrieval can contribute candidates; this teaching example uses fixed candidate lists.", failure: "If the answer-bearing passage is absent here, the later reranker cannot recover it.", inspect: "Measure answer-bearing recall among the initial candidates." },
  { title: "Rank the evidence", icon: Search, action: "Compare candidates with the question and place the most useful evidence first. Real reranking requires a model or another ranking method; the order here is authored for the example.", failure: "A relevant-looking general rule can outrank the exception that actually answers the question.", inspect: "Inspect the top results, duplicate passages and the position of required evidence." },
  { title: "Pack the context", icon: FileText, action: "Keep the selected passages, source identities and necessary qualifications within a bounded context budget. Treat passage text as evidence, not privileged instructions.", failure: "Truncation can remove the exception or its source identity after retrieval succeeded.", inspect: "Inspect the exact text supplied to generation, rather than only the search results." },
  { title: "Answer or abstain", icon: FileText, action: "Generate a response supported by the supplied context. When the requested fact is missing, report the limitation. This demo displays an authored answer rather than calling a language model.", failure: "Fluent generation can add an unsupported deadline or ignore a qualification.", inspect: "Compare every material claim with the selected source passages." },
  { title: "Verify support", icon: CheckCircle2, action: "Check that the answer uses eligible current sources and that its claims follow from their text. A citation's presence alone does not prove support.", failure: "A real link can point to a relevant document that does not establish the specific claim.", inspect: "Evaluate claim support and correct abstention separately from retrieval recall." },
];

function PassageList({ records }) {
  if (!records.length) return <p>No answer-bearing passage in this example's permitted current corpus.</p>;
  return <ul className="study-rag-passages">{records.map((record) => <li key={record.id}><strong>{record.title}</strong><code>{record.id}</code><p><StudyText>{record.text}</StudyText></p></li>)}</ul>;
}

export default function RagPipelineLab() {
  const [phase, setPhase] = useState("query");
  const [step, setStep] = useState(0);
  const [questionId, setQuestionId] = useState("standard");
  const question = questions.find((item) => item.id === questionId);
  const steps = phase === "index" ? indexing : queryStages;
  const stage = steps[step];
  const StageIcon = stage.icon;
  const eligible = documents.filter((item) => item.workspace === "shop-a" && item.current);
  const findRecords = (ids) => ids.map((id) => eligible.find((record) => record.id === id)).filter(Boolean);
  const candidates = findRecords(question.candidates);
  const ranked = findRecords(question.ranked);
  const choosePhase = (next) => { setPhase(next); setStep(0); };

  return <div className="study-rag-lab">
    <header><h3>Follow one question through the pipeline</h3><p>Fixed, fictional policies make every stage inspectable. No embedding service, search engine or language model runs in this activity.</p></header>
    <div className="study-rag-phase" role="group" aria-label="Pipeline phase"><button type="button" aria-pressed={phase === "index"} onClick={() => choosePhase("index")}><Database size={16} aria-hidden="true" />Prepare the documents</button><button type="button" aria-pressed={phase === "query"} onClick={() => choosePhase("query")}><Search size={16} aria-hidden="true" />Answer a question</button></div>
    {phase === "query" && <fieldset className="study-rag-questions"><legend>Choose a question</legend>{questions.map((item) => <label key={item.id}><input type="radio" name="rag-question" value={item.id} checked={questionId === item.id} onChange={() => { setQuestionId(item.id); setStep(0); }} />{item.label}</label>)}<p>{question.text}</p></fieldset>}
    <ol className="study-rag-stages" aria-label={phase === "index" ? "Document preparation stages" : "Question answering stages"}>{steps.map((item, index) => <li key={item.title}><button type="button" aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)}><span aria-hidden="true">{index + 1}</span>{item.title}</button></li>)}</ol>
    <div className="study-rag-stage" aria-live="polite" aria-atomic="true">
      <h4><StageIcon size={21} aria-hidden="true" />{stage.title}</h4><p><StudyText>{stage.action}</StudyText></p>
      <dl>
        <div><dt>Input</dt><dd>{phase === "index" ? stage.input : step === 0 ? question.text : step === 1 ? "Two current passages in shop-a. The archived rule and shop-b document are excluded." : step < 4 ? "The permitted candidate passages and the original question." : "The packed evidence and its source identities."}</dd></div>
        <div><dt>Output</dt><dd>{phase === "index" ? stage.output : step === 0 ? <><PassageList records={eligible} /><p className="study-rag-excluded">Excluded: returns-v1 is archived; delivery-b belongs to another workspace.</p></> : step === 1 ? <PassageList records={candidates} /> : step < 4 ? <PassageList records={ranked} /> : step === 4 ? question.answer : <><strong>{question.required ? "Supported answer in this authored example." : "Correct abstention: no permitted supporting passage."}</strong><p>{question.required ? `Check the answer against ${question.required}, including its qualifications. A production verifier still needs to evaluate the actual claims.` : "The existence of a delivery document in another workspace does not authorize using it."}</p></>}</dd></div>
      </dl>
      <div className="study-rag-diagnostic"><h5>What can go wrong?</h5><p><StudyText>{stage.failure}</StudyText></p><h5>What to inspect</h5><p><StudyText>{stage.inspect}</StudyText></p></div>
    </div>
    <div className="study-rag-controls"><button type="button" className="ai-learn-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous stage</button><span>{step + 1} / {steps.length}</span><button type="button" className="ai-learn-button primary" disabled={step === steps.length - 1} onClick={() => setStep((value) => value + 1)}>Next stage<ArrowRight size={16} aria-hidden="true" /></button></div>
  </div>;
}

export function RagImplementationNotes() {
  return <div className="study-rag-implementation">
    <h3>Translate the pipeline into application code</h3><p>This pseudocode shows responsibility boundaries. Each function still needs a concrete implementation, failure contract and evaluation.</p>
    <pre tabIndex={0} aria-label="Illustrative RAG workflow pseudocode"><code>{`scope = authorized_current_corpus(user)
query = preserve_user_intent(question)
lexical = keyword_search(query, scope)
dense = vector_search(query, scope, compatible_embedding_model)
candidates = fuse_ranks(lexical, dense)
evidence = rerank_and_deduplicate(question, candidates)
context = pack_with_sources_and_exceptions(evidence, token_budget)

if not has_required_evidence(context, question):
    return explain_missing_evidence()

draft = generate_grounded_answer(question, context)
return verify_claim_support_or_abstain(draft, context)`}</code></pre>
    <h3>Find the failing stage before adding complexity</h3>
    <dl className="study-rag-failures"><div><dt>The answer is not in the candidates</dt><dd>Check extraction, source coverage, permissions, version filters, query wording and retrieval recall. A bigger generator does not repair this missing input.</dd></div><div><dt>The right passage is found but not supplied</dt><dd>Inspect reranking, deduplication, parent expansion and context truncation. Preserve qualifications when selecting a compact context.</dd></div><div><dt>The supplied passage is right but the answer is wrong</dt><dd>Inspect claim interpretation, conflicting evidence and citation support. Evaluate unsupported statements and correct abstentions, not just whether a link appears.</dd></div></dl>
    <p>Measure quality, end-to-end latency and cost on the same question set. Hybrid search is a retrieval technique; a hybrid RAG workflow can also mean combining deterministic and agent-controlled stages. State which meaning you intend.</p>
  </div>;
}
