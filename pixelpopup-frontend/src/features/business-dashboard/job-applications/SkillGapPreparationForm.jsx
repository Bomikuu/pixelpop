import { useState } from "react";
import { Info } from "lucide-react";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import SkillTagPicker from "./SkillTagPicker";
import { skillGroups } from "./skillCatalog";
import { focusInvalidField } from "./api";

export default function SkillGapPreparationForm({ record, profile, request, onCancel, onQuote }) {
  const mode = request.mode;
  const rows = (record.requirement_decisions || []).filter((row) => mode !== "example" || row.status !== "supported");
  const [initial] = useState(() => ({ requirement_key: request.requirement_key || rows[0]?.requirement_key || "", related_project_id: request.related_project_id || "", system_type: request.system_type || "", tools: request.tools || [] }));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const row = rows.find((item) => item.requirement_key === draft.requirement_key);
  const projects = profile?.project_experience || [];
  const set = (name, value) => { setDraft((previous) => ({ ...previous, [name]: value })); setErrors({}); };
  function chooseProject(name, id) {
    const project = projects.find((item) => item.id === id);
    setDraft((previous) => ({ ...previous, related_project_id: id, ...(project ? { system_type: project.system_type, tools: project.tools } : {}) })); setErrors({});
  }
  function submit(event) {
    event.preventDefault();
    if (!row) { setErrors({ requirement_key: "Choose a current requirement." }); focusInvalidField(event.currentTarget); return; }
    onQuote(mode, { ...draft, related_project_id: draft.related_project_id || null,
      assessment_revision: record.artifacts.find((item) => item.kind === "assessment")?.revision,
      example_proposal_id: request.example_proposal_id || null, resume_proposal_id: request.resume_proposal_id || null,
      reference_version: request.reference_version || null });
  }
  const types = skillGroups.find((group) => group.label === "System types").options;
  const systemOptions = [...new Set([...types, draft.system_type].filter(Boolean))].map((value) => ({ value, label: value }));
  return <FormModalShell title={mode === "example" ? "Generate an experience example" : "Prepare for this requirement"} description="Choose the context first, then review the cost estimate. No AI call is made until you approve it." scrollBody dirty={JSON.stringify(initial) !== JSON.stringify(draft)} onSubmit={submit} onCancel={onCancel} saveLabel="Review AI cost" submitDisabled={!rows.length}>
    <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"><Info size={17} className="mt-1 shrink-0"/>{mode === "example" ? "This is a hypothetical implementation example for review and practice—not a claim that you did the work. Approving its wording does not add it to your résumé." : request.example_proposal_id ? "The plan will use the exact approved hypothetical example. Study material does not turn it into past experience." : request.resume_proposal_id ? "The plan will use your accepted résumé changes and current confirmed sources." : "Refresh demonstrated skills or study an unfamiliar requirement. Your saved résumé stays unchanged."}</p>
    <FormField field={{ name: "requirement_key", label: "Job requirement", type: "select", required: true }} values={draft} onChange={set} layout="plain" idPrefix="skill-gap" error={errors.requirement_key} options={rows.map((item) => ({ value: item.requirement_key, label: item.text, description: `${item.importance} · ${item.status.replaceAll("_", " ")}` }))}/>
    {row && <details className="text-xs leading-5 text-slate-600"><summary className="cursor-pointer hover:text-blue-700">Why this requirement needs preparation</summary><p className="mt-2 break-words">{row.explanation}</p><blockquote className="mt-2 border-l pl-3">{row.posting_excerpt}</blockquote></details>}
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField field={{ name: "related_project_id", label: "Related profile project (optional)", type: "select" }} values={draft} onChange={chooseProject} layout="plain" idPrefix="skill-gap" options={[{ value: "", label: "No related project" }, ...projects.map((item) => ({ value: item.id, label: item.name, description: item.status === "confirmed" ? "Confirmed contribution" : "Unconfirmed context only" }))]}/>
      <FormField field={{ name: "system_type", label: "Example system type (optional)", type: "select" }} values={draft} onChange={set} layout="plain" idPrefix="skill-gap" options={[{ value: "", label: "Use the requirement context" }, ...systemOptions]}/>
    </div>
    <SkillTagPicker id="skill-gap-tools" value={draft.tools} onChange={(value) => set("tools", value)}/>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>Selected tools set the practice theme; they do not confirm proficiency, a client, dates or results. Other technologies start unselected.</p>
  </FormModalShell>;
}
