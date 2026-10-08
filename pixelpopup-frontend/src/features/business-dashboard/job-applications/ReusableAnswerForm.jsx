import { useState } from "react";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import FormField from "../../personal-dashboard/components/forms/FormField";
import { fieldError, jobApi } from "./api";

export const answerCategories = ["availability", "rates", "experience", "screening", "other"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export default function ReusableAnswerForm({ record, onSaved, onCancel, notify }) {
  const initial = { title: record?.title || "", question: record?.question || "", category: record?.category || "screening", body: record?.body || "" };
  const [draft, setDraft] = useState(initial), [errors, setErrors] = useState({}), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  function update(name, value) { setDraft((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: "" })); }
  async function submit(event) {
    event.preventDefault(); setError("");
    const issues = {};
    for (const [name, limit] of [["title", 160], ["question", 2000], ["body", 8000]]) {
      if (!draft[name].trim()) issues[name] = "Enter text for this field.";
      else if (draft[name].length > limit) issues[name] = `Use at most ${limit.toLocaleString()} characters.`;
    }
    setErrors(issues);
    if (Object.keys(issues).length) { event.currentTarget.querySelector('[aria-invalid="true"]')?.focus(); return; }
    setBusy(true);
    try { await jobApi(`answers/${record ? `${record.id}/` : ""}`, { method: record ? "PATCH" : "POST", body: { ...draft, ...(record ? { expected_revision: record.revision } : {}) } }); onSaved(); notify("Answer saved. Review the saved wording before reusing it."); }
    catch (issue) { setError(issue.message); setErrors(issue.fields || {}); }
    finally { setBusy(false); }
  }
  return <FormModalShell title={record ? "Edit reusable answer" : "Add reusable answer"} description="Write your actual availability, rates and experience. Saving is not approval; changes to the question, category or answer require another review." busy={busy} error={error} dirty={JSON.stringify(draft) !== JSON.stringify(initial)} onSubmit={submit} onCancel={onCancel} saveLabel="Save answer">
    <div className="grid gap-4 sm:grid-cols-2">{[{ name: "title", label: "Answer title", required: true, maxLength: 160 }, { name: "category", label: "Category", type: "select", required: true }, { name: "question", label: "Question", type: "textarea", required: true, maxLength: 2000 }].map((field) => <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}><FormField field={field} values={draft} onChange={update} options={answerCategories} error={fieldError(errors, field.name)} disabled={busy} layout="plain" idPrefix="reusable-answer"/></div>)}</div>
    <fieldset disabled={busy} className="space-y-2"><MarkdownEditor id="reusable-answer-body" label="Answer text" maxLength={8000} invalid={!!fieldError(errors, "body")} describedBy={fieldError(errors, "body") ? "reusable-answer-body-error" : "reusable-answer-body-hint"} value={draft.body} onChange={(value) => update("body", value)}/>{fieldError(errors, "body") && <p id="reusable-answer-body-error" role="alert" className="text-sm text-red-800">{fieldError(errors, "body")}</p>}<p id="reusable-answer-body-hint" className="text-xs text-slate-600">{draft.body.length.toLocaleString()} / 8,000 characters. Keep reusable answers accurate and review them when your circumstances change.</p></fieldset>
  </FormModalShell>;
}
