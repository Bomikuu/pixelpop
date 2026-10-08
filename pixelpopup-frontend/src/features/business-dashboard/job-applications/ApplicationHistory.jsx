import { FileText, History, MessageSquare, Sparkles } from "lucide-react";
import { Panel, EmptyState } from "../../personal-dashboard/components/Panel";
import { Button } from "../../personal-dashboard/ui/button";
import { labels } from "./api";

function generationState(run) {
  if (run.proposal_status) return { pending: "Proposal ready", accepted: "Accepted", discarded: "Discarded" }[run.proposal_status];
  if (run.status === "completed") return run.kind === "assessment" ? "Assessment saved" : "Generated";
  return run.status;
}

export default function ApplicationHistory({ record, onActivity, onUseAlternative }) {
  return <div className="grid gap-4 lg:grid-cols-2">
    <Panel title="Application history" description="Your notes and employer responses, recorded manually." action={<Button size="sm" onClick={onActivity}><MessageSquare size={15}/>Record activity</Button>}>
      {record.activities.length ? <ol className="divide-y">{record.activities.map((item) => <li key={item.id} className="flex gap-3 py-4 first:pt-0"><span className={`grid size-9 shrink-0 place-items-center rounded-full ${item.kind === "response" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{item.kind === "response" ? <MessageSquare size={16}/> : <History size={16}/>}</span><div className="min-w-0"><div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600"><span className="font-medium capitalize">{item.kind.replaceAll("_", " ")}</span><time dateTime={item.occurred_on}>{item.occurred_on}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p></div></li>)}</ol> : <EmptyState icon={History} title="No activity recorded" message="Record a reply or note after sending your application."/>}
    </Panel>
    <Panel title="AI usage" description="Token-based estimates in USD. Additional provider fees or reasoning usage may affect the bill.">
      {record.generations.length ? <ul className="divide-y">{record.generations.map((run) => <li key={run.id} className="py-3 first:pt-0"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium"><Sparkles size={15} className="text-blue-600"/>{labels[run.kind]}</span><span className="text-xs capitalize text-slate-600">{generationState(run)}</span></div><p className="mt-1 text-xs text-slate-600">{run.provider} · {run.model} · {new Date(run.created_at).toLocaleString()}</p><p className="mt-2 text-xs text-slate-600">{run.input_tokens == null ? "Input usage unavailable" : `${run.input_tokens.toLocaleString()} input tokens`} · {run.output_tokens == null ? "Output usage unavailable" : `${run.output_tokens.toLocaleString()} output tokens`}</p><p className="mt-1 text-xs text-slate-600">{run.estimated_cost_usd == null ? "Cost estimate unavailable" : `Estimated $${Number(run.estimated_cost_usd).toFixed(6)} · rates dated ${run.pricing_date}`}</p>{run.status === "conflict" && run.result?.body && <Button size="sm" variant="outline" className="mt-2" onClick={() => onUseAlternative(run.kind, run.result.body)}><FileText size={14}/>Open saved alternative</Button>}</li>)}</ul> : <EmptyState icon={Sparkles} title="No AI usage yet" message="Provider and model usage will appear after generation."/>}
    </Panel>
  </div>;
}
