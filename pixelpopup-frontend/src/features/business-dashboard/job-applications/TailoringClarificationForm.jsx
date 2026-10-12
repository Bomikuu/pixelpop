import { ArrowRight } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import RequirementDecisionForm from "./RequirementDecisionForm";

export function priorityTailoringQuestion(rows = []) {
  return [...rows].filter((row) => row.status !== "supported" && (!row.applicant_decision || row.applicant_decision.stale || row.applicant_decision.decision === "needs_review"))
    .sort((a, b) => ({ required: 0, preferred: 1, unspecified: 2 }[a.importance] ?? 2) - ({ required: 0, preferred: 1, unspecified: 2 }[b.importance] ?? 2))[0];
}

export default function TailoringClarificationForm({ onContinue, ...props }) {
  return <RequirementDecisionForm {...props} title="One priority question before tailoring" description="Have you personally used this requirement? Add one actual contribution, record a limitation, or continue with it unresolved. No AI call is made here." extraActions={<Button type="button" variant="outline" onClick={onContinue}><ArrowRight size={15}/>Continue without an answer</Button>}/>;
}
