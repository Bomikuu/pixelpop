import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CircleHelp, Info, MessageSquare, TriangleAlert } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { fieldError, focusInvalidField, jobApi } from "./api";

const statuses = [
  { value: "answered", label: "I can provide facts", description: "Describe actual work, dates and your contribution.", icon: CheckCircle2 },
  { value: "not_used", label: "Not used / not applicable", description: "Keep this as a limitation, not experience.", icon: Info },
  { value: "unresolved", label: "Leave unresolved", description: "More information is needed; do not add a claim.", icon: CircleHelp },
];

function questionFor(finding) {
  const text = `${finding.explanation} ${finding.suggestion} ${finding.section_title}`;
  const questions = [];
  if (/react|hooks|context/i.test(text)) questions.push("When did you start using React professionally? Which projects used hooks, context or advanced patterns, and what did you implement?");
  if (/typescript|generics|utility types/i.test(text)) questions.push("Where have you used TypeScript in production? Describe specific complex types, generics or utility types you implemented.");
  if (/redux|rtk|thunk/i.test(text)) questions.push("Which Redux tools have you actually used, in which projects, and for what? Distinguish Redux-Saga from Toolkit, RTK Query and async thunks.");
  if (/jest|testing library|cypress|playwright|tests?\b|testing/i.test(text)) questions.push("Which test frameworks and test types have you used? Give a project example and describe tests you personally wrote or maintained.");
  if (/git|ssh|webpack|shell|wsl|npm|yarn|linux|macos|byod/i.test(text)) questions.push("Which development environments and tools do you actively use? Describe real Git, SSH, shell or build-tool workflows; mention OS/BYOD experience only if applicable.");
  if (/employment|role overlap|concurrent|countable|asta/i.test(text)) questions.push("What are the correct start/end dates and current status of these roles? Were any roles concurrent, freelance or part-time?");
  if (/placeholder|bracket|drafting instruction|unfinished/i.test(text)) questions.push("What verified examples should replace the placeholders? If none, say which draft-only material should be removed.");
  if (/english|accessibility|cross.browser|performance/i.test(text)) questions.push("What real examples demonstrate these requirements? Describe your own methods, responsibilities and outcomes without inventing measurements.");
  if (/posting|listing|still open|active/i.test(text)) questions.push("Have you confirmed the listing is still open and its dates are accurate? What did you verify?");
  return questions.length ? questions : ["What accurate facts, project examples or wording corrections can you provide to address this finding? If it needs information you do not have, leave it unresolved."];
}

export default function ResumeClarificationForm({ record, onCancel, onSaved, notify }) {
  const [baseline] = useState(() => ({ check_id: record.resume_check.id, source_digest: record.source_digest, expected_version: record.resume_clarifications?.version || 0 }));
  const [findings] = useState(record.resume_check.findings);
  const [initial] = useState(() => Object.fromEntries(findings.flatMap((_, index) => {
    const saved = record.resume_clarifications?.answers.find((row) => row.finding_index === index);
    return [[`status_${index}`, saved?.status || "unresolved"], [`answer_${index}`, saved?.answer || ""]];
  })));
  const [values, setValues] = useState(initial), [confirmed, setConfirmed] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState(""), [errors, setErrors] = useState({});
  const set = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value })); setConfirmed(false);
    setErrors((previous) => ({ ...previous, [name]: undefined, [name.replace(/^status_/, "answer_")]: undefined, accuracy_confirmed: undefined }));
  };
  const answered = findings.filter((_, index) => values[`status_${index}`] === "answered").length;
  const notUsed = findings.filter((_, index) => values[`status_${index}`] === "not_used").length;
  const needsAnswer = findings.filter((_, index) => values[`status_${index}`] === "answered" && !values[`answer_${index}`].trim()).length;
  function openItem(index) {
    setActiveItem(index);
    requestAnimationFrame(() => document.getElementById(`clarification-question-${index}`)?.focus());
  }
  function showErrors(invalid, form) {
    setErrors(invalid);
    const field = Object.keys(invalid).find((name) => /^answer_\d+$/.test(name));
    if (field) setActiveItem(Number(field.split("_")[1]));
    focusInvalidField(form);
  }
  async function submit(event) {
    event.preventDefault(); if (busy || saved) return;
    const form = event.currentTarget, invalid = {};
    const answers = findings.map((_, index) => ({ finding_index: index, status: values[`status_${index}`], answer: values[`answer_${index}`].trim() }));
    answers.forEach((row, index) => { if (row.status === "answered" && !row.answer) invalid[`answer_${index}`] = "Provide real dates, an example or a factual explanation."; });
    if (answered && !confirmed) invalid.accuracy_confirmed = "Confirm these answers describe your actual experience.";
    if (answers.reduce((sum, row) => sum + row.answer.length, 0) > 30000) invalid.total = "Shorten your answers to at most 30,000 characters in total.";
    setError(invalid.total || "");
    if (Object.keys(invalid).length) { showErrors(invalid, form); return; }
    setErrors({});
    setBusy(true);
    try {
      await jobApi(`applications/${record.id}/resume-clarifications/`, { method: "POST", body: { ...baseline, answers, accuracy_confirmed: confirmed } });
      setSaved(true); notify("Answers saved for this application. No AI call made yet.");
      await onSaved();
    } catch (issue) {
      setError(issue.message);
      const nested = issue.fields?.answers;
      showErrors({ ...issue.fields, ...(Array.isArray(nested) ? Object.fromEntries(nested.flatMap((row, index) => row?.answer ? [[`answer_${index}`, row.answer]] : [])) : {}) }, form);
    } finally { setBusy(false); }
  }
  return <FormModalShell scrollBody title="Let's clarify your experience" description="One finding at a time. Answer what you know, or leave it unresolved. No AI call is made until you approve the cost." onSubmit={submit} onCancel={onCancel} busy={busy} dirty={!saved && (confirmed || JSON.stringify(values) !== JSON.stringify(initial))} error={error} submitDisabled={saved} saveLabel="Save answers & review cost" extraActions={saved && <Button type="button" disabled={busy} variant="outline" onClick={async () => { setBusy(true); try { await onSaved(); } catch (issue) { setError(issue.message); } finally { setBusy(false); } }}><ArrowRight size={15}/>Continue to cost review</Button>}>
    <div className="space-y-2 border-b pb-3">
      <div role="status" className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-800"><CheckCircle2 size={15} aria-hidden="true"/>{answered - needsAnswer} with facts</span>
        <span className="flex items-center gap-1.5 text-slate-600"><Info size={15} aria-hidden="true"/>{notUsed} not applicable</span>
        <span className="flex items-center gap-1.5 text-slate-600"><CircleHelp size={15} aria-hidden="true"/>{findings.length - answered - notUsed} unresolved</span>
        {needsAnswer > 0 && <span className="flex items-center gap-1.5 text-amber-900"><TriangleAlert size={15} aria-hidden="true"/>{needsAnswer} need an answer</span>}
      </div>
      <p className="flex items-start gap-1.5 text-xs leading-5 text-slate-600"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true"/>Application-only answers. Your shared profile and saved résumé stay unchanged until you accept reviewed changes.</p>
    </div>
    <div className="min-w-0 divide-y overflow-hidden rounded-md border bg-white">
      {findings.map((finding, index) => {
        const active = activeItem === index, status = values[`status_${index}`];
        const questions = active ? questionFor(finding) : [];
        const missing = status === "answered" && !values[`answer_${index}`].trim();
        const invalid = !!errors[`answer_${index}`];
        const StatusIcon = missing || invalid ? TriangleAlert : status === "answered" ? CheckCircle2 : status === "not_used" ? Info : CircleHelp;
        const statusTone = missing || invalid ? "bg-amber-50 text-amber-900" : status === "answered" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600";
        const headingId = `clarification-heading-${index}`, panelId = `clarification-panel-${index}`;
        return <section key={index} className="min-w-0">
          <h3><button type="button" id={headingId} aria-expanded={active} aria-controls={panelId} disabled={busy} onClick={() => setActiveItem(active ? null : index)} className={`flex w-full items-start gap-3 p-3 text-left outline-none transition-colors hover:bg-blue-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-wait motion-reduce:transition-none sm:p-4 ${active ? "bg-blue-50/60" : ""}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${active ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}><CircleHelp size={17} aria-hidden="true"/></span>
            <span className="min-w-0 flex-1 space-y-1"><span className="flex flex-wrap items-center gap-2"><span className="break-words text-sm font-semibold">{finding.section_title}</span><span className="text-xs font-normal capitalize text-slate-600">{finding.category} · {finding.priority} priority</span></span><span className="line-clamp-1 break-words text-xs font-normal text-slate-600">{finding.explanation}</span></span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-normal ${statusTone}`}><StatusIcon size={13} aria-hidden="true"/><span className="hidden sm:inline">{missing || invalid ? "Needs answer" : status === "answered" ? "With facts" : status === "not_used" ? "Not applicable" : "Unresolved"}</span><span className="sr-only sm:hidden">{missing || invalid ? "Needs answer" : status === "answered" ? "With facts" : status === "not_used" ? "Not applicable" : "Unresolved"}</span></span>
            <ChevronDown size={16} className={`mt-1 shrink-0 text-slate-600 transition-transform motion-reduce:transition-none ${active ? "rotate-180" : ""}`} aria-hidden="true"/>
          </button></h3>
          <div id={panelId} role="region" aria-labelledby={headingId} hidden={!active} className="min-w-0">
            {active && <div className="min-w-0 space-y-4 px-3 pb-4 pt-3 sm:px-4">
              <div className="space-y-2 rounded-md bg-blue-50 p-4 text-blue-950">
                <h4 id={`clarification-question-${index}`} tabIndex={-1} className="flex items-center gap-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><MessageSquare size={17} aria-hidden="true"/>Question{questions.length > 1 ? "s" : ""} for you</h4>
                <ul className="space-y-2 text-sm leading-6">{questions.map((question) => <li key={question} className="max-w-prose break-words">{question}</li>)}</ul>
              </div>
              <details className="text-xs leading-5 text-slate-600"><summary className="cursor-pointer rounded-sm font-medium outline-none hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500">Why this matters · View context</summary><div className="mt-2 max-w-prose space-y-2"><p>{finding.explanation}</p><p><span className="font-medium text-slate-800">Suggested fix:</span> {finding.suggestion}</p>{finding.excerpt && <blockquote className="border-l pl-3"><span className="mb-1 block font-medium text-slate-800">Current résumé wording</span>{finding.excerpt}</blockquote>}</div></details>
              <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <FormField field={{ name: `status_${index}`, label: "How would you like to respond?", type: "select", required: true }} values={values} onChange={set} options={statuses} layout="plain" idPrefix="resume-clarification" disabled={busy || saved}/>
                <FormField field={{ name: `answer_${index}`, label: status === "answered" ? "Your answer" : "Optional explanation", type: "textarea", required: status === "answered", maxLength: 4000, className: "min-h-32", placeholder: status === "answered" ? "Name a real project, dates, the tools you used and what you personally did." : "Add context, explain a limitation, or say what should be removed." }} values={values} onChange={set} layout="plain" idPrefix="resume-clarification" disabled={busy || saved} error={fieldError(errors, `answer_${index}`)}/>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><p className="text-xs text-slate-600">Item {index + 1} of {findings.length} · Switching items keeps your answers.</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy || index === 0} onClick={() => openItem(index - 1)}><ArrowLeft size={14}/>Previous</Button><Button type="button" size="sm" variant="outline" disabled={busy || index === findings.length - 1} onClick={() => openItem(index + 1)}>Next<ArrowRight size={14}/></Button></div></div>
            </div>}
          </div>
        </section>;
      })}
    </div>
    {answered > 0 && <div className="space-y-2 border-t pt-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-blue-600" checked={confirmed} disabled={busy || saved} onChange={(event) => setConfirmed(event.target.checked)} aria-invalid={!!errors.accuracy_confirmed} aria-describedby={errors.accuracy_confirmed ? "resume-clarification-confirm-error" : undefined}/><span>I confirm these answers describe my actual experience. *</span></label>{errors.accuracy_confirmed && <p id="resume-clarification-confirm-error" role="alert" className="text-sm text-red-800">{fieldError(errors, "accuracy_confirmed")}</p>}</div>}
    {saved && <p role="status" className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 size={16}/>Answers saved. Continue to cost review if the refresh did not finish.</p>}
  </FormModalShell>;
}
