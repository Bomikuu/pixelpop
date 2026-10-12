import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Info, LoaderCircle, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import GenerationQuoteDialog from "./GenerationQuoteDialog";
import { jobApi } from "./api";

export default function ClarificationAutoAnswers({ record, baseline, disabled, onBusyChange, onDrafts, notify }) {
  const [quote, setQuote] = useState(null), [phase, setPhase] = useState("idle"), [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null), [seconds, setSeconds] = useState(0);
  const request = useRef(null), trigger = useRef(null);
  useEffect(() => {
    if (phase !== "generating") return;
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [phase, startedAt]);

  function matches(snapshot) {
    return snapshot?.mode === "clarify" && snapshot.checklist_id === baseline.check_id
      && snapshot.source_digest === baseline.source_digest
      && snapshot.expected_revision === record.artifacts.find((item) => item.kind === "resume")?.revision
      && (snapshot.clarification_id || 0) === baseline.expected_version;
  }
  const savedDraft = record.generations?.find((run) => run.status === "completed" && matches(run.quote_snapshot));
  function apply(run) {
    if (run.status !== "completed" || !matches(run.quote_snapshot) || !Array.isArray(run.result?.answers)) {
      throw new Error("These answers are not ready or belong to a different checklist. Your current answers were kept.");
    }
    onDrafts(run.result.answers, run.result.warnings || []);
    setPhase("ready"); request.current = null;
    notify("Batch answers are ready to review. Existing replies were kept; nothing has changed in your résumé.");
  }
  async function requestQuote() {
    onBusyChange(true); setError(""); setPhase("quoting");
    try {
      const result = await jobApi(`applications/${record.id}/quote/`, { method: "POST", body: { kinds: ["resume"], mode: "clarify" } });
      if (!matches(result.items[0])) throw new Error("The checklist or saved answers changed. Close this form, refresh and reopen Resolve issues.");
      setQuote(result); setPhase("quoted");
    } catch (issue) { setError(issue.message); setPhase("idle"); onBusyChange(false); }
  }
  async function generate(items) {
    if (request.current) return;
    setQuote(null); setError(""); setPhase("generating"); setStartedAt(Date.now()); setSeconds(0);
    const item = items[0], id = crypto.randomUUID();
    request.current = { id, item };
    try {
      apply(await jobApi(`applications/${record.id}/generate/`, { method: "POST", body: {
        request_id: id, kind: "resume", mode: "clarify", expected_revision: item.expected_revision,
        quote_token: item.quote_token, confirm_replace: false,
      } }));
    } catch (issue) { setError(issue.message); setPhase("uncertain"); }
    finally { onBusyChange(false); }
  }
  async function recover() {
    onBusyChange(true); setError(""); setPhase("recovering");
    try {
      const current = await jobApi(`applications/${record.id}/`);
      if (current.resume_check?.id !== baseline.check_id || current.resume_check.stale
          || current.source_digest !== baseline.source_digest
          || (current.resume_clarifications?.version || 0) !== baseline.expected_version
          || current.artifacts.find((item) => item.kind === "resume")?.revision !== request.current.item.expected_revision) {
        throw new Error("Your checklist, sources or saved answers changed. Refresh before using the saved result.");
      }
      const run = current.generations.find((item) => item.id === request.current.id);
      if (run?.status === "completed") apply(run);
      else if (run && ["failed", "conflict"].includes(run.status)) {
        request.current = null; setPhase("idle");
        setError("The request did not produce usable current answers. Your input was kept. Check AI usage before approving another call.");
      } else {
        setPhase("uncertain"); setError("No completed result is available yet. Check again later; this check does not make another AI call.");
      }
    } catch (issue) { setError(issue.message); setPhase("uncertain"); }
    finally { onBusyChange(false); }
  }
  const working = ["quoting", "generating", "recovering"].includes(phase);
  return <section className="space-y-3" aria-label="Batch answer assistant">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-prose text-xs leading-5 text-slate-600">Draft all answers from your saved ASTA, independent-work and résumé sources. Existing replies are kept.</p>
      <div className="flex flex-wrap gap-2">{savedDraft && phase !== "ready" && <Button type="button" variant="outline" disabled={disabled || working || phase === "uncertain"} onClick={() => { try { setError(""); apply(savedDraft); } catch (issue) { setError(issue.message); } }}><RefreshCw size={16}/>Load saved drafts</Button>}<Button ref={trigger} type="button" variant="outline" disabled={disabled || working || phase === "uncertain"} onClick={requestQuote}><Sparkles size={16}/>{phase === "ready" ? "Draft again · Review cost" : "Auto-answer all"}</Button></div>
    </div>
    {working && <div role="status" className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><LoaderCircle size={17} className="mt-0.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true"/><div className="min-w-0 space-y-1"><p>{phase === "quoting" ? "Checking sources, pricing and your monthly allowance…" : phase === "recovering" ? "Checking the saved result—no new AI call…" : "AI is drafting answers for the complete checklist…"}</p><p className="text-xs leading-5">{phase === "generating" ? "Waiting for one provider response. The backend validates citations before returning drafts; its internal stages are not streamed." : "Your existing answers and résumé are kept."}</p>{phase === "generating" && <span className="flex items-center gap-1.5 text-xs tabular-nums" aria-hidden="true"><Clock3 size={13}/>{seconds}s elapsed</span>}</div></div>}
    {phase === "ready" && <p role="status" className="flex items-start gap-2 text-sm text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>Answers drafted. Review the batch below, confirm accuracy, then review the separate fix cost.</p>}
    {error && <div role="alert" className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="flex items-start gap-2"><TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true"/>{error}</p>{request.current && <Button type="button" variant="outline" size="sm" disabled={disabled || working} onClick={recover}><RefreshCw size={15}/>Check saved result</Button>}{phase === "uncertain" && <p className="flex items-start gap-1.5 text-xs leading-5"><Info size={14} className="mt-0.5 shrink-0"/>The request may have reached your provider. Check the saved result before retrying; another generation would be separately charged.</p>}</div>}
    {quote && <GenerationQuoteDialog quote={quote} busy={false} onConfirm={generate} onCancel={() => { setQuote(null); setPhase("idle"); onBusyChange(false); requestAnimationFrame(() => trigger.current?.focus()); }}/>}
  </section>;
}
